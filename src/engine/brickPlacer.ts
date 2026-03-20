import type { BrickType } from '../data/legoBricks';
import { BRICK_CATALOG } from '../data/legoBricks';
import type { LegoColor } from '../data/legoColors';
import { VoxelGrid } from './VoxelGrid';

export interface PlacedBrick {
  x: number;
  y: number;
  z: number;
  brick: BrickType;
  color: LegoColor;
  rotated: boolean;
}

/** Get plate-type bricks sorted by area (largest first). */
function getSortedPlates(): BrickType[] {
  return BRICK_CATALOG
    .filter((b) => b.category === 'plate')
    .sort((a, b) => (b.widthStuds * b.depthStuds) - (a.widthStuds * a.depthStuds));
}

/** Check if a rectangle of size w×d can be placed at (x, z) in layer y. */
function canPlace(
  grid: VoxelGrid,
  used: Uint8Array,
  colorMap: Map<string, LegoColor>,
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
  color: LegoColor,
): boolean {
  if (x + w > grid.width || z + d > grid.depth) return false;

  for (let dz = 0; dz < d; dz++) {
    for (let dx = 0; dx < w; dx++) {
      const cx = x + dx;
      const cz = z + dz;
      if (!grid.isFilled(cx, y, cz)) return false;
      if (used[cz * grid.width + cx]) return false;
      const voxelColor = colorMap.get(`${cx},${y},${cz}`);
      if (!voxelColor || voxelColor.id !== color.id) return false;
    }
  }

  return true;
}

/** Mark a rectangle in the used array. */
function markUsed(used: Uint8Array, gridWidth: number, x: number, z: number, w: number, d: number): void {
  for (let dz = 0; dz < d; dz++) {
    for (let dx = 0; dx < w; dx++) {
      used[(z + dz) * gridWidth + (x + dx)] = 1;
    }
  }
}

/**
 * Greedy layer-by-layer brick placement algorithm.
 * Processes one horizontal layer at a time, fitting the largest possible plates.
 */
export function placeBricks(
  grid: VoxelGrid,
  colorMap: Map<string, LegoColor>,
): PlacedBrick[] {
  const placedBricks: PlacedBrick[] = [];
  const sortedPlates = getSortedPlates();

  for (let y = 0; y < grid.height; y++) {
    const used = new Uint8Array(grid.width * grid.depth);

    for (let z = 0; z < grid.depth; z++) {
      for (let x = 0; x < grid.width; x++) {
        if (!grid.isFilled(x, y, z)) continue;
        if (used[z * grid.width + x]) continue;

        const color = colorMap.get(`${x},${y},${z}`);
        if (!color) continue;

        let placed = false;
        for (const brickType of sortedPlates) {
          // Try both orientations
          for (const rotated of [false, true]) {
            const w = rotated ? brickType.depthStuds : brickType.widthStuds;
            const d = rotated ? brickType.widthStuds : brickType.depthStuds;

            // Skip if rotation doesn't change anything
            if (rotated && brickType.widthStuds === brickType.depthStuds) continue;

            if (canPlace(grid, used, colorMap, x, y, z, w, d, color)) {
              markUsed(used, grid.width, x, z, w, d);
              placedBricks.push({ x, y, z, brick: brickType, color, rotated });
              placed = true;
              break;
            }
          }
          if (placed) break;
        }

        // Fallback: 1x1 plate (should always succeed since the voxel is filled and unused)
        if (!placed) {
          const plate1x1 = BRICK_CATALOG.find((b) => b.id === 'plate_1x1');
          if (plate1x1) {
            used[z * grid.width + x] = 1;
            placedBricks.push({ x, y, z, brick: plate1x1, color, rotated: false });
          }
        }
      }
    }
  }

  return placedBricks;
}

/**
 * Merge 3 consecutive same-footprint plates into full bricks where possible.
 */
export function mergeVertically(placedBricks: PlacedBrick[]): PlacedBrick[] {
  // Group bricks by their footprint key (x, z, width, depth, color, rotated)
  const groups = new Map<string, PlacedBrick[]>();

  for (const brick of placedBricks) {
    if (brick.brick.category !== 'plate') {
      // Already a full brick, skip grouping
      continue;
    }
    const w = brick.rotated ? brick.brick.depthStuds : brick.brick.widthStuds;
    const d = brick.rotated ? brick.brick.widthStuds : brick.brick.depthStuds;
    const key = `${brick.x},${brick.z},${w},${d},${brick.color.id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(brick);
  }

  const result: PlacedBrick[] = [];
  const merged = new Set<PlacedBrick>();

  for (const [, group] of groups) {
    // Sort by y
    group.sort((a, b) => a.y - b.y);

    let i = 0;
    while (i < group.length) {
      // Try to find 3 consecutive layers
      if (
        i + 2 < group.length &&
        group[i + 1].y === group[i].y + 1 &&
        group[i + 2].y === group[i].y + 2
      ) {
        // Find the corresponding full brick
        const plate = group[i].brick;
        const fullBrick = BRICK_CATALOG.find(
          (b) =>
            b.category === 'brick' &&
            b.widthStuds === plate.widthStuds &&
            b.depthStuds === plate.depthStuds,
        );

        if (fullBrick) {
          result.push({
            x: group[i].x,
            y: group[i].y,
            z: group[i].z,
            brick: fullBrick,
            color: group[i].color,
            rotated: group[i].rotated,
          });
          merged.add(group[i]);
          merged.add(group[i + 1]);
          merged.add(group[i + 2]);
          i += 3;
          continue;
        }
      }
      i++;
    }
  }

  // Add all non-merged plates back
  for (const brick of placedBricks) {
    if (!merged.has(brick)) {
      result.push(brick);
    }
  }

  return result;
}
