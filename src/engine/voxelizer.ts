import {
  Mesh,
  SkinnedMesh,
  Raycaster,
  Vector3,
  Box3,
  BufferGeometry,
  MeshStandardMaterial,
  DoubleSide,
  Color,
  BufferAttribute,
  Scene,
  Group,
  Texture,
  Vector2,
} from 'three';
import { MeshBVH, acceleratedRaycast } from 'three-mesh-bvh';
import { VoxelGrid } from './VoxelGrid';

// Patch Three.js Mesh to use BVH-accelerated raycasting
Mesh.prototype.raycast = acceleratedRaycast;

/** Convert a linear-light sRGB component to sRGB (gamma-encoded) */
function linearToSRGB(c: number): number {
  if (c <= 0.0031308) return 12.92 * c;
  return 1.055 * Math.pow(c, 1.0 / 2.4) - 0.055;
}

export interface VoxelizeOptions {
  resolution: number; // voxels along longest axis (e.g., 32, 48, 64)
  onProgress?: (percent: number) => void;
}

export interface VoxelizeResult {
  grid: VoxelGrid;
  /** Bounding box of the original model in world space */
  bboxMin: [number, number, number];
  bboxMax: [number, number, number];
  /** Size of each voxel in world units */
  voxelSize: number;
}

/**
 * Extract pixel data from a Three.js texture so we can sample it on the CPU.
 */
function getTextureImageData(texture: Texture): ImageData | null {
  const image = texture.image as HTMLImageElement | ImageBitmap | null;
  if (!image) return null;

  const w = 'naturalWidth' in image ? (image.naturalWidth || image.width) : image.width;
  const h = 'naturalHeight' in image ? (image.naturalHeight || image.height) : image.height;
  if (!w || !h) return null;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(image as CanvasImageSource, 0, 0);
  return ctx.getImageData(0, 0, w, h);
}

/**
 * Sample a texture at a given UV coordinate, returning [r, g, b] in [0, 1].
 * @param flipY - if true, UV (0,0) is bottom-left (standard OpenGL). If false, UV (0,0) is top-left (glTF convention).
 */
function sampleTextureAtUV(
  imageData: ImageData,
  u: number,
  v: number,
  flipY: boolean,
): [number, number, number] {
  const w = imageData.width;
  const h = imageData.height;

  // Wrap UVs to [0, 1]
  const su = ((u % 1) + 1) % 1;
  const sv = ((v % 1) + 1) % 1;

  // Canvas pixel (0,0) is top-left.
  // glTF (flipY=false): UV (0,0) is top-left → py = sv * h
  // Standard (flipY=true): UV (0,0) is bottom-left → py = (1-sv) * h
  const px = Math.min(Math.floor(su * w), w - 1);
  const py = Math.min(Math.floor((flipY ? (1 - sv) : sv) * h), h - 1);

  const idx = (py * w + px) * 4;
  return [
    imageData.data[idx] / 255,
    imageData.data[idx + 1] / 255,
    imageData.data[idx + 2] / 255,
  ];
}

/** Per-face texture info for the merged geometry */
interface FaceTextureGroup {
  startFace: number; // first face index (triangle index, not vertex index)
  faceCount: number; // number of triangles
  textureData: ImageData | null;
  materialColor: Color;
  flipY: boolean; // true = standard OpenGL (UV origin bottom-left), false = glTF (UV origin top-left)
}

interface MergedResult {
  geometry: BufferGeometry;
  mesh: Mesh;
  faceGroups: FaceTextureGroup[];
}

/**
 * Merge all meshes in a scene/group into a single geometry.
 * Preserves UVs and tracks per-face texture data for accurate color sampling.
 */
function mergeSceneToMesh(object: Scene | Group | Mesh): MergedResult {
  interface GeoEntry {
    geo: BufferGeometry;
    color: Color;
    textureData: ImageData | null;
    flipY: boolean;
  }
  const geometries: GeoEntry[] = [];

  object.updateMatrixWorld(true);

  object.traverse((child) => {
    if (!(child instanceof Mesh)) return;
    if (!child.geometry) return;

    const geo = child.geometry.clone();

    // For SkinnedMesh, bake bone/skeleton transforms into the geometry.
    // Without this, we'd only get the bind-pose vertices, not the actual
    // displayed pose — causing LEGO output to be mispositioned.
    if (child instanceof SkinnedMesh && child.skeleton) {
      child.skeleton.update();
      const posAttr = geo.attributes.position;
      const v = new Vector3();
      for (let i = 0; i < posAttr.count; i++) {
        v.fromBufferAttribute(posAttr, i);
        child.applyBoneTransform(i, v);
        v.applyMatrix4(child.matrixWorld);
        posAttr.setXYZ(i, v.x, v.y, v.z);
      }
      posAttr.needsUpdate = true;
      // Also transform normals if present
      if (geo.attributes.normal) {
        geo.computeVertexNormals();
      }
    } else {
      geo.applyMatrix4(child.matrixWorld);
    }

    let meshColor = new Color(1, 1, 1);
    let textureData: ImageData | null = null;
    let flipY = true; // default: standard OpenGL convention

    if (child.material) {
      const mat = Array.isArray(child.material) ? child.material[0] : child.material;
      if (mat && 'color' in mat) {
        meshColor = (mat as MeshStandardMaterial).color.clone();
      }
      if (mat && 'map' in mat && (mat as MeshStandardMaterial).map) {
        const tex = (mat as MeshStandardMaterial).map!;
        textureData = getTextureImageData(tex);
        flipY = tex.flipY; // false for glTF/GLB textures
      }
    }

    geometries.push({ geo, color: meshColor, textureData, flipY });
  });

  if (geometries.length === 0) {
    throw new Error('No mesh geometry found in the model');
  }

  // Calculate totals
  let totalVertices = 0;
  let totalIndices = 0;
  for (const { geo } of geometries) {
    totalVertices += geo.attributes.position.count;
    if (geo.index) {
      totalIndices += geo.index.count;
    } else {
      totalIndices += geo.attributes.position.count;
    }
  }

  const positions = new Float32Array(totalVertices * 3);
  const colors = new Float32Array(totalVertices * 3);
  const uvs = new Float32Array(totalVertices * 2);
  const indices = new Uint32Array(totalIndices);

  const faceGroups: FaceTextureGroup[] = [];
  let vertexOffset = 0;
  let indexOffset = 0;

  for (const { geo, color, textureData, flipY } of geometries) {
    const posAttr = geo.attributes.position;
    const colorAttr = geo.attributes.color as BufferAttribute | undefined;
    const uvAttr = geo.attributes.uv as BufferAttribute | undefined;
    const count = posAttr.count;

    // Track this mesh's face range
    const startFace = indexOffset / 3;

    for (let i = 0; i < count; i++) {
      const vi = vertexOffset + i;
      positions[vi * 3] = posAttr.getX(i);
      positions[vi * 3 + 1] = posAttr.getY(i);
      positions[vi * 3 + 2] = posAttr.getZ(i);

      // Bake vertex colors in sRGB space (material.color and vertex colors are linear in Three.js)
      if (colorAttr) {
        colors[vi * 3] = linearToSRGB(colorAttr.getX(i));
        colors[vi * 3 + 1] = linearToSRGB(colorAttr.getY(i));
        colors[vi * 3 + 2] = linearToSRGB(colorAttr.getZ(i));
      } else {
        colors[vi * 3] = linearToSRGB(color.r);
        colors[vi * 3 + 1] = linearToSRGB(color.g);
        colors[vi * 3 + 2] = linearToSRGB(color.b);
      }

      // Preserve UVs
      if (uvAttr) {
        uvs[vi * 2] = uvAttr.getX(i);
        uvs[vi * 2 + 1] = uvAttr.getY(i);
      }
    }

    if (geo.index) {
      for (let i = 0; i < geo.index.count; i++) {
        indices[indexOffset + i] = geo.index.array[i] + vertexOffset;
      }
      indexOffset += geo.index.count;
    } else {
      for (let i = 0; i < count; i++) {
        indices[indexOffset + i] = vertexOffset + i;
      }
      indexOffset += count;
    }

    const faceCount = (indexOffset / 3) - startFace;
    faceGroups.push({ startFace, faceCount, textureData, materialColor: color, flipY });

    vertexOffset += count;
  }

  const mergedGeo = new BufferGeometry();
  mergedGeo.setAttribute('position', new BufferAttribute(positions, 3));
  mergedGeo.setAttribute('color', new BufferAttribute(colors, 3));
  mergedGeo.setAttribute('uv', new BufferAttribute(uvs, 2));
  mergedGeo.setIndex(new BufferAttribute(indices, 1));
  mergedGeo.computeVertexNormals();

  const material = new MeshStandardMaterial({
    vertexColors: true,
    side: DoubleSide,
  });

  const mesh = new Mesh(mergedGeo, material);
  return { geometry: mergedGeo, mesh, faceGroups };
}

/**
 * Surface voxelization: cast rays along all 3 axes and mark surface voxels.
 */
function surfaceVoxelize(
  grid: VoxelGrid,
  mesh: Mesh,
  bbox: Box3,
  voxelSize: number,
  onProgress?: (percent: number) => void,
): void {
  const raycaster = new Raycaster();
  const origin = new Vector3();
  const direction = new Vector3();

  const minX = bbox.min.x;
  const minY = bbox.min.y;
  const minZ = bbox.min.z;

  const halfVoxel = voxelSize / 2;

  const markAtWorldPos = (wx: number, wy: number, wz: number) => {
    const gx = Math.floor((wx - minX) / voxelSize);
    const gy = Math.floor((wy - minY) / voxelSize);
    const gz = Math.floor((wz - minZ) / voxelSize);
    if (grid.inBounds(gx, gy, gz)) {
      grid.setFilled(gx, gy, gz, true);
    }
  };

  const totalRays = grid.height * grid.depth + grid.width * grid.depth + grid.width * grid.height;
  let raysProcessed = 0;

  // Cast rays along X axis
  direction.set(1, 0, 0);
  for (let gy = 0; gy < grid.height; gy++) {
    for (let gz = 0; gz < grid.depth; gz++) {
      const wy = minY + gy * voxelSize + halfVoxel;
      const wz = minZ + gz * voxelSize + halfVoxel;
      origin.set(minX - voxelSize, wy, wz);
      raycaster.set(origin, direction);
      raycaster.far = (grid.width + 2) * voxelSize;

      const hits = raycaster.intersectObject(mesh, false);
      for (const hit of hits) {
        markAtWorldPos(hit.point.x, hit.point.y, hit.point.z);
      }
      raysProcessed++;
    }
  }
  onProgress?.(Math.round((raysProcessed / totalRays) * 30));

  // Cast rays along Y axis
  direction.set(0, 1, 0);
  for (let gx = 0; gx < grid.width; gx++) {
    for (let gz = 0; gz < grid.depth; gz++) {
      const wx = minX + gx * voxelSize + halfVoxel;
      const wz = minZ + gz * voxelSize + halfVoxel;
      origin.set(wx, minY - voxelSize, wz);
      raycaster.set(origin, direction);
      raycaster.far = (grid.height + 2) * voxelSize;

      const hits = raycaster.intersectObject(mesh, false);
      for (const hit of hits) {
        markAtWorldPos(hit.point.x, hit.point.y, hit.point.z);
      }
      raysProcessed++;
    }
  }
  onProgress?.(Math.round((raysProcessed / totalRays) * 30));

  // Cast rays along Z axis
  direction.set(0, 0, 1);
  for (let gx = 0; gx < grid.width; gx++) {
    for (let gy = 0; gy < grid.height; gy++) {
      const wx = minX + gx * voxelSize + halfVoxel;
      const wy = minY + gy * voxelSize + halfVoxel;
      origin.set(wx, wy, minZ - voxelSize);
      raycaster.set(origin, direction);
      raycaster.far = (grid.depth + 2) * voxelSize;

      const hits = raycaster.intersectObject(mesh, false);
      for (const hit of hits) {
        markAtWorldPos(hit.point.x, hit.point.y, hit.point.z);
      }
      raysProcessed++;
    }
  }
  onProgress?.(30);
}

/**
 * Flood fill from exterior to identify interior voxels.
 */
function floodFillInterior(grid: VoxelGrid, onProgress?: (percent: number) => void): void {
  const w = grid.width;
  const h = grid.height;
  const d = grid.depth;
  const total = w * h * d;

  const exterior = new Uint8Array(total);
  const queue: number[] = [];
  const idx = (x: number, y: number, z: number) => x + y * w + z * w * h;

  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      for (let z = 0; z < d; z++) {
        if (x === 0 || x === w - 1 || y === 0 || y === h - 1 || z === 0 || z === d - 1) {
          if (!grid.isFilled(x, y, z)) {
            const i = idx(x, y, z);
            exterior[i] = 1;
            queue.push(i);
          }
        }
      }
    }
  }

  const dx = [1, -1, 0, 0, 0, 0];
  const dy = [0, 0, 1, -1, 0, 0];
  const dz = [0, 0, 0, 0, 1, -1];

  let head = 0;
  while (head < queue.length) {
    const ci = queue[head++];
    const cx = ci % w;
    const cy = Math.floor(ci / w) % h;
    const cz = Math.floor(ci / (w * h));

    for (let dir = 0; dir < 6; dir++) {
      const nx = cx + dx[dir];
      const ny = cy + dy[dir];
      const nz = cz + dz[dir];

      if (nx < 0 || nx >= w || ny < 0 || ny >= h || nz < 0 || nz >= d) continue;

      const ni = idx(nx, ny, nz);
      if (exterior[ni]) continue;
      if (grid.isFilled(nx, ny, nz)) continue;

      exterior[ni] = 1;
      queue.push(ni);
    }
  }

  for (let z = 0; z < d; z++) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = idx(x, y, z);
        if (!exterior[i] && !grid.isFilled(x, y, z)) {
          grid.setFilled(x, y, z, true);
        }
      }
    }
  }

  onProgress?.(50);
}

/**
 * Find which face group a face index belongs to, to get its texture data.
 */
function findFaceGroup(faceIndex: number, faceGroups: FaceTextureGroup[]): FaceTextureGroup | null {
  for (const group of faceGroups) {
    if (faceIndex >= group.startFace && faceIndex < group.startFace + group.faceCount) {
      return group;
    }
  }
  return null;
}

/**
 * Sample colors for all filled voxels by raycasting to the nearest surface point.
 * Uses per-pixel texture sampling at the ray hit point for accurate colors.
 */
function sampleColors(
  grid: VoxelGrid,
  mesh: Mesh,
  faceGroups: FaceTextureGroup[],
  bbox: Box3,
  voxelSize: number,
  onProgress?: (percent: number) => void,
): void {
  const raycaster = new Raycaster();
  const voxelCenter = new Vector3();
  const minX = bbox.min.x;
  const minY = bbox.min.y;
  const minZ = bbox.min.z;
  const halfVoxel = voxelSize / 2;

  const geometry = mesh.geometry;
  const colorAttr = geometry.attributes.color as BufferAttribute | undefined;
  const uvAttr = geometry.attributes.uv as BufferAttribute | undefined;
  const posAttr = geometry.attributes.position;
  const indexAttr = geometry.index;

  const directions = [
    new Vector3(1, 0, 0), new Vector3(-1, 0, 0),
    new Vector3(0, 1, 0), new Vector3(0, -1, 0),
    new Vector3(0, 0, 1), new Vector3(0, 0, -1),
  ];

  const filledVoxels = grid.getFilledVoxels();
  const total = filledVoxels.length;

  for (let i = 0; i < total; i++) {
    const { x, y, z } = filledVoxels[i];
    voxelCenter.set(
      minX + x * voxelSize + halfVoxel,
      minY + y * voxelSize + halfVoxel,
      minZ + z * voxelSize + halfVoxel,
    );

    let foundColor = false;

    for (const dir of directions) {
      raycaster.set(voxelCenter, dir);
      raycaster.far = Infinity;
      const hits = raycaster.intersectObject(mesh, false);

      if (hits.length > 0) {
        const hit = hits[0];
        const face = hit.face;

        if (!face) continue;

        // face.a, face.b, face.c are already resolved vertex indices
        const a = face.a;
        const b = face.b;
        const c = face.c;

        // Compute barycentric coordinates at the hit point
        const vA = new Vector3().fromBufferAttribute(posAttr, a);
        const vB = new Vector3().fromBufferAttribute(posAttr, b);
        const vC = new Vector3().fromBufferAttribute(posAttr, c);
        const bary = computeBarycentric(hit.point, vA, vB, vC);

        // Determine the face index to look up which texture group this face belongs to
        // face.a/b/c are vertex indices; we need the face (triangle) index
        // Three.js stores faceIndex on the intersection for indexed geometries
        let faceIndex = -1;
        if (hit.faceIndex != null) {
          faceIndex = hit.faceIndex;
        } else if (indexAttr) {
          // Fallback: search for the face in the index buffer
          for (let fi = 0; fi < indexAttr.count; fi += 3) {
            if (indexAttr.getX(fi) === a && indexAttr.getX(fi + 1) === b && indexAttr.getX(fi + 2) === c) {
              faceIndex = fi / 3;
              break;
            }
          }
        }

        // Try texture sampling first (most accurate for textured models)
        const group = faceIndex >= 0 ? findFaceGroup(faceIndex, faceGroups) : null;

        if (group && group.textureData && uvAttr) {
          // Use Three.js interpolated UV when available (more reliable), else compute manually
          let hitU: number;
          let hitV: number;
          if (hit.uv) {
            hitU = hit.uv.x;
            hitV = hit.uv.y;
          } else {
            const uvA = new Vector2(uvAttr.getX(a), uvAttr.getY(a));
            const uvB = new Vector2(uvAttr.getX(b), uvAttr.getY(b));
            const uvC = new Vector2(uvAttr.getX(c), uvAttr.getY(c));
            hitU = uvA.x * bary.u + uvB.x * bary.v + uvC.x * bary.w;
            hitV = uvA.y * bary.u + uvB.y * bary.v + uvC.y * bary.w;
          }

          // Sample texture at the interpolated UV (returns sRGB [0,1] values)
          const [tr, tg, tb] = sampleTextureAtUV(group.textureData, hitU, hitV, group.flipY);

          // Multiply by material color (convert from linear to sRGB first to match texture space)
          const mc = group.materialColor;
          const mcR = linearToSRGB(mc.r);
          const mcG = linearToSRGB(mc.g);
          const mcB = linearToSRGB(mc.b);
          const r = Math.round(tr * mcR * 255);
          const g = Math.round(tg * mcG * 255);
          const bVal = Math.round(tb * mcB * 255);

          grid.setColor(x, y, z,
            Math.max(0, Math.min(255, r)),
            Math.max(0, Math.min(255, g)),
            Math.max(0, Math.min(255, bVal)),
          );
          foundColor = true;
          break;
        } else if (colorAttr) {
          // Interpolate vertex colors using barycentric coordinates
          const cA = [colorAttr.getX(a), colorAttr.getY(a), colorAttr.getZ(a)];
          const cB = [colorAttr.getX(b), colorAttr.getY(b), colorAttr.getZ(b)];
          const cC = [colorAttr.getX(c), colorAttr.getY(c), colorAttr.getZ(c)];

          const r = Math.round((cA[0] * bary.u + cB[0] * bary.v + cC[0] * bary.w) * 255);
          const g = Math.round((cA[1] * bary.u + cB[1] * bary.v + cC[1] * bary.w) * 255);
          const bVal = Math.round((cA[2] * bary.u + cB[2] * bary.v + cC[2] * bary.w) * 255);

          grid.setColor(x, y, z,
            Math.max(0, Math.min(255, r)),
            Math.max(0, Math.min(255, g)),
            Math.max(0, Math.min(255, bVal)),
          );
          foundColor = true;
          break;
        } else if (group) {
          // Use material color from the group
          const mc = group.materialColor;
          grid.setColor(x, y, z,
            Math.round(mc.r * 255),
            Math.round(mc.g * 255),
            Math.round(mc.b * 255),
          );
          foundColor = true;
          break;
        }
      }
    }

    if (!foundColor) {
      grid.setColor(x, y, z, 128, 128, 128);
    }

    if (i % 500 === 0) {
      onProgress?.(50 + Math.round((i / total) * 50));
    }
  }

  onProgress?.(100);
}

function computeBarycentric(
  p: Vector3, a: Vector3, b: Vector3, c: Vector3,
): { u: number; v: number; w: number } {
  const v0 = new Vector3().subVectors(b, a);
  const v1 = new Vector3().subVectors(c, a);
  const v2 = new Vector3().subVectors(p, a);

  const dot00 = v0.dot(v0);
  const dot01 = v0.dot(v1);
  const dot02 = v0.dot(v2);
  const dot11 = v1.dot(v1);
  const dot12 = v1.dot(v2);

  const denom = dot00 * dot11 - dot01 * dot01;
  if (Math.abs(denom) < 1e-10) {
    return { u: 1 / 3, v: 1 / 3, w: 1 / 3 };
  }

  const invDenom = 1 / denom;
  const v = (dot11 * dot02 - dot01 * dot12) * invDenom;
  const w = (dot00 * dot12 - dot01 * dot02) * invDenom;
  const u = 1 - v - w;

  return { u: Math.max(0, u), v: Math.max(0, v), w: Math.max(0, w) };
}

/**
 * Main voxelization function: converts a 3D scene/mesh into a VoxelGrid.
 */
export function voxelizeMesh(
  object: Scene | Group | Mesh,
  options: VoxelizeOptions,
): VoxelizeResult {
  const { resolution, onProgress } = options;

  onProgress?.(0);

  // Step 1: Merge all meshes into a single mesh with UV and texture data
  const { geometry, mesh, faceGroups } = mergeSceneToMesh(object);

  // Step 2: Compute bounding box and grid dimensions
  const bbox = new Box3().setFromBufferAttribute(geometry.attributes.position as BufferAttribute);
  const margin = 0.001;
  bbox.min.subScalar(margin);
  bbox.max.addScalar(margin);

  const size = bbox.getSize(new Vector3());
  const longestAxis = Math.max(size.x, size.y, size.z);
  const voxelSize = longestAxis / resolution;

  const gridW = Math.max(1, Math.ceil(size.x / voxelSize));
  const gridH = Math.max(1, Math.ceil(size.y / voxelSize));
  const gridD = Math.max(1, Math.ceil(size.z / voxelSize));

  const grid = new VoxelGrid(gridW, gridH, gridD);

  // Step 3: Build BVH for fast raycasting
  // Use indirect mode to preserve original triangle ordering so faceIndex
  // values from raycasting match our per-mesh faceGroup tracking.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (geometry as any).boundsTree = new MeshBVH(geometry, { indirect: true });

  // Step 4: Surface voxelization
  surfaceVoxelize(grid, mesh, bbox, voxelSize, onProgress);

  // Step 5: Flood fill interior
  floodFillInterior(grid, onProgress);

  // Step 6: Color sampling with per-pixel texture lookup
  sampleColors(grid, mesh, faceGroups, bbox, voxelSize, onProgress);

  return {
    grid,
    bboxMin: [bbox.min.x, bbox.min.y, bbox.min.z],
    bboxMax: [bbox.max.x, bbox.max.y, bbox.max.z],
    voxelSize,
  };
}
