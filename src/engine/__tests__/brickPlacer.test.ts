import { describe, it, expect } from 'vitest';
import { VoxelGrid } from '../VoxelGrid';
import { placeBricks, mergeVertically } from '../brickPlacer';
import { LEGO_COLORS } from '../../data/legoColors';
import type { LegoColor } from '../../data/legoColors';

function makeColorMap(grid: VoxelGrid, color: LegoColor): Map<string, LegoColor> {
  const map = new Map<string, LegoColor>();
  grid.forEach((x, y, z, filled) => {
    if (filled) map.set(`${x},${y},${z}`, color);
  });
  return map;
}

const RED = LEGO_COLORS.find((c) => c.name === 'Red')!;
const BLUE = LEGO_COLORS.find((c) => c.name === 'Blue')!;

describe('placeBricks', () => {
  it('should cover all filled voxels in a single layer', () => {
    const grid = new VoxelGrid(4, 1, 4);
    for (let x = 0; x < 4; x++) {
      for (let z = 0; z < 4; z++) {
        grid.setFilled(x, 0, z, true);
      }
    }
    const colorMap = makeColorMap(grid, RED);
    const bricks = placeBricks(grid, colorMap);

    // Total stud area should equal 16 (4x4)
    let totalStuds = 0;
    for (const b of bricks) {
      const w = b.rotated ? b.brick.depthStuds : b.brick.widthStuds;
      const d = b.rotated ? b.brick.widthStuds : b.brick.depthStuds;
      totalStuds += w * d;
    }
    expect(totalStuds).toBe(16);
  });

  it('should produce only 1x1 bricks for a checkerboard pattern', () => {
    const grid = new VoxelGrid(4, 1, 4);
    for (let x = 0; x < 4; x++) {
      for (let z = 0; z < 4; z++) {
        grid.setFilled(x, 0, z, true);
      }
    }
    // Create alternating color map
    const colorMap = new Map<string, LegoColor>();
    for (let x = 0; x < 4; x++) {
      for (let z = 0; z < 4; z++) {
        const color = (x + z) % 2 === 0 ? RED : BLUE;
        colorMap.set(`${x},0,${z}`, color);
      }
    }

    const bricks = placeBricks(grid, colorMap);
    // All bricks should be 1x1 (or 1x2 at most for same-color runs)
    expect(bricks.length).toBe(16);
    for (const b of bricks) {
      expect(b.brick.widthStuds * b.brick.depthStuds).toBe(1);
    }
  });

  it('should handle empty grid', () => {
    const grid = new VoxelGrid(4, 4, 4);
    const colorMap = new Map<string, LegoColor>();
    const bricks = placeBricks(grid, colorMap);
    expect(bricks.length).toBe(0);
  });

  it('should handle single voxel', () => {
    const grid = new VoxelGrid(1, 1, 1);
    grid.setFilled(0, 0, 0, true);
    const colorMap = makeColorMap(grid, RED);
    const bricks = placeBricks(grid, colorMap);
    expect(bricks.length).toBe(1);
    expect(bricks[0].brick.id).toBe('plate_1x1');
  });
});

describe('mergeVertically', () => {
  it('should merge 3 consecutive plates into a brick', () => {
    const grid = new VoxelGrid(1, 3, 1);
    for (let y = 0; y < 3; y++) {
      grid.setFilled(0, y, 0, true);
    }
    const colorMap = makeColorMap(grid, RED);
    const plates = placeBricks(grid, colorMap);
    expect(plates.length).toBe(3);
    expect(plates[0].brick.category).toBe('plate');

    const merged = mergeVertically(plates);
    expect(merged.length).toBe(1);
    expect(merged[0].brick.category).toBe('brick');
    expect(merged[0].brick.heightPlates).toBe(3);
  });

  it('should merge 6 plates into 2 bricks', () => {
    const grid = new VoxelGrid(1, 6, 1);
    for (let y = 0; y < 6; y++) {
      grid.setFilled(0, y, 0, true);
    }
    const colorMap = makeColorMap(grid, RED);
    const plates = placeBricks(grid, colorMap);
    expect(plates.length).toBe(6);

    const merged = mergeVertically(plates);
    const brickCount = merged.filter((b) => b.brick.category === 'brick').length;
    expect(brickCount).toBe(2);
    expect(merged.length).toBe(2);
  });

  it('should leave 2 plates unmerged', () => {
    const grid = new VoxelGrid(1, 2, 1);
    for (let y = 0; y < 2; y++) {
      grid.setFilled(0, y, 0, true);
    }
    const colorMap = makeColorMap(grid, RED);
    const plates = placeBricks(grid, colorMap);
    const merged = mergeVertically(plates);
    // Can't merge 2 plates into a brick (need 3)
    expect(merged.length).toBe(2);
    expect(merged[0].brick.category).toBe('plate');
  });
});
