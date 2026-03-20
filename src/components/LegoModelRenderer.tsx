import { useMemo } from 'react';
import { Matrix4, MeshStandardMaterial, Color, Vector3 } from 'three';
import { useModelStore } from '../hooks/useModelStore';
import { createBrickGeometry } from './LegoBrickGeometry';
import { LEGO_DIMENSIONS } from '../data/legoBricks';
import type { PlacedBrick } from '../engine/brickPlacer';

const { STUD_PITCH, PLATE_HEIGHT } = LEGO_DIMENSIONS;

interface BrickGroup {
  key: string;
  widthStuds: number;
  depthStuds: number;
  heightPlates: number;
  color: Color;
  bricks: PlacedBrick[];
}

export default function LegoModelRenderer() {
  const placedBricks = useModelStore((s) => s.placedBricks);
  const viewMode = useModelStore((s) => s.viewMode);
  const voxelizeResult = useModelStore((s) => s.voxelizeResult);
  const voxelGrid = useModelStore((s) => s.voxelGrid);

  const groups = useMemo(() => {
    if (!placedBricks) return [];

    const map = new Map<string, BrickGroup>();

    for (const brick of placedBricks) {
      const w = brick.rotated ? brick.brick.depthStuds : brick.brick.widthStuds;
      const d = brick.rotated ? brick.brick.widthStuds : brick.brick.depthStuds;
      const h = brick.brick.heightPlates;
      const key = `${brick.brick.id}_${brick.rotated}_${brick.color.id}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          widthStuds: w,
          depthStuds: d,
          heightPlates: h,
          color: new Color(brick.color.hex),
          bricks: [],
        });
      }
      map.get(key)!.bricks.push(brick);
    }

    return Array.from(map.values());
  }, [placedBricks]);

  const legoTransform = useMemo(() => {
    if (!voxelizeResult || !voxelGrid) {
      return null;
    }

    const { bboxMin, voxelSize } = voxelizeResult;

    // Scale: each voxel = voxelSize world units.
    // The brick geometry is in mm (STUD_PITCH=8mm per stud, PLATE_HEIGHT=3.2mm).
    // Horizontally: 1 stud = 1 voxel, so scaleXZ = voxelSize / STUD_PITCH
    // Vertically: 1 plate = 1 voxel layer, so scaleY = voxelSize / PLATE_HEIGHT
    const scaleXZ = voxelSize / STUD_PITCH;
    const scaleY = voxelSize / PLATE_HEIGHT;

    return {
      bboxMin: new Vector3(bboxMin[0], bboxMin[1], bboxMin[2]),
      voxelSize,
      scaleXZ,
      scaleY,
    };
  }, [voxelizeResult, voxelGrid]);

  if (!placedBricks || !voxelizeResult || !legoTransform || (viewMode !== 'lego' && viewMode !== 'side-by-side')) {
    return null;
  }

  // For side-by-side, offset the LEGO model to the right of the original.
  // Compute offset from the model's actual width (bboxMax.x - bboxMin.x) plus padding.
  // The original model stays at its raw position (can't move SkinnedMesh parents).
  let offsetX = 0;
  if (viewMode === 'side-by-side') {
    const modelWidth = voxelizeResult.bboxMax[0] - voxelizeResult.bboxMin[0];
    offsetX = modelWidth * 1.3; // model width + 30% padding
  }

  return (
    <group position={[offsetX, 0, 0]}>
      {groups.map((group) => (
        <BrickGroupMesh
          key={group.key}
          group={group}
          legoTransform={legoTransform}
        />
      ))}
    </group>
  );
}

interface LegoTransform {
  bboxMin: Vector3;
  voxelSize: number;
  scaleXZ: number;
  scaleY: number;
}

function BrickGroupMesh({ group, legoTransform }: { group: BrickGroup; legoTransform: LegoTransform }) {
  const geometry = useMemo(
    () => createBrickGeometry(group.widthStuds, group.depthStuds, group.heightPlates),
    [group.widthStuds, group.depthStuds, group.heightPlates],
  );

  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: group.color,
        roughness: 0.3,
        metalness: 0.0,
      }),
    [group.color],
  );

  const matrices = useMemo(() => {
    const { bboxMin, voxelSize, scaleXZ, scaleY } = legoTransform;
    const result: Matrix4[] = [];

    for (const brick of group.bricks) {
      // Convert grid position back to world position (raw, no centering)
      const worldX = bboxMin.x + brick.x * voxelSize;
      const worldY = bboxMin.y + brick.y * voxelSize;
      const worldZ = bboxMin.z + brick.z * voxelSize;

      const mat = new Matrix4();
      // Position the brick, then scale the geometry from mm to world units
      mat.makeTranslation(worldX, worldY, worldZ);
      const scaleMat = new Matrix4().makeScale(scaleXZ, scaleY, scaleXZ);
      mat.multiply(scaleMat);

      result.push(mat);
    }
    return result;
  }, [group.bricks, legoTransform]);

  return (
    <instancedMesh
      args={[geometry, material, matrices.length]}
      frustumCulled={false}
      ref={(mesh) => {
        if (!mesh) return;
        for (let i = 0; i < matrices.length; i++) {
          mesh.setMatrixAt(i, matrices[i]);
        }
        mesh.instanceMatrix.needsUpdate = true;
      }}
    />
  );
}
