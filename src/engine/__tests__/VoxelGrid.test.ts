import { describe, it, expect } from 'vitest';
import { VoxelGrid } from '../VoxelGrid';

describe('VoxelGrid', () => {
  it('should initialize with correct dimensions', () => {
    const grid = new VoxelGrid(4, 5, 6);
    expect(grid.width).toBe(4);
    expect(grid.height).toBe(5);
    expect(grid.depth).toBe(6);
  });

  it('should default all voxels to unfilled', () => {
    const grid = new VoxelGrid(3, 3, 3);
    expect(grid.filledCount()).toBe(0);
    expect(grid.isFilled(0, 0, 0)).toBe(false);
  });

  it('should set and get filled state', () => {
    const grid = new VoxelGrid(3, 3, 3);
    grid.setFilled(1, 2, 1, true);
    expect(grid.isFilled(1, 2, 1)).toBe(true);
    expect(grid.isFilled(0, 0, 0)).toBe(false);
    expect(grid.filledCount()).toBe(1);
  });

  it('should set and get color', () => {
    const grid = new VoxelGrid(3, 3, 3);
    grid.setColor(1, 1, 1, 255, 128, 0);
    const [r, g, b] = grid.getColor(1, 1, 1);
    expect(r).toBe(255);
    expect(g).toBe(128);
    expect(b).toBe(0);
  });

  it('should handle bounds checking', () => {
    const grid = new VoxelGrid(3, 3, 3);
    expect(grid.inBounds(-1, 0, 0)).toBe(false);
    expect(grid.inBounds(0, 0, 3)).toBe(false);
    expect(grid.inBounds(2, 2, 2)).toBe(true);
    // Out of bounds setFilled should be a no-op
    grid.setFilled(-1, 0, 0, true);
    expect(grid.filledCount()).toBe(0);
  });

  it('should return filled voxels only', () => {
    const grid = new VoxelGrid(4, 4, 4);
    grid.setFilled(0, 0, 0, true);
    grid.setColor(0, 0, 0, 255, 0, 0);
    grid.setFilled(2, 3, 1, true);
    grid.setColor(2, 3, 1, 0, 255, 0);

    const filled = grid.getFilledVoxels();
    expect(filled.length).toBe(2);
    expect(filled).toContainEqual({ x: 0, y: 0, z: 0, r: 255, g: 0, b: 0 });
    expect(filled).toContainEqual({ x: 2, y: 3, z: 1, r: 0, g: 255, b: 0 });
  });

  it('should iterate over all voxels with forEach', () => {
    const grid = new VoxelGrid(2, 2, 2);
    grid.setFilled(0, 0, 0, true);
    grid.setFilled(1, 1, 1, true);

    let filledCount = 0;
    let totalCount = 0;
    grid.forEach((_x, _y, _z, filled) => {
      totalCount++;
      if (filled) filledCount++;
    });

    expect(totalCount).toBe(8); // 2*2*2
    expect(filledCount).toBe(2);
  });

  it('should handle single voxel grid', () => {
    const grid = new VoxelGrid(1, 1, 1);
    grid.setFilled(0, 0, 0, true);
    grid.setColor(0, 0, 0, 100, 200, 50);
    expect(grid.filledCount()).toBe(1);
    expect(grid.getColor(0, 0, 0)).toEqual([100, 200, 50]);
  });

  it('should handle unfilling a voxel', () => {
    const grid = new VoxelGrid(3, 3, 3);
    grid.setFilled(1, 1, 1, true);
    expect(grid.filledCount()).toBe(1);
    grid.setFilled(1, 1, 1, false);
    expect(grid.filledCount()).toBe(0);
    expect(grid.isFilled(1, 1, 1)).toBe(false);
  });
});
