import { VoxelGrid } from './VoxelGrid';
import { findClosestLegoColor } from '../data/legoColors';
import type { LegoColor } from '../data/legoColors';

export interface QuantizedVoxelGrid {
  grid: VoxelGrid;
  colorMap: Map<string, LegoColor>;
}

export function quantizeColors(grid: VoxelGrid): QuantizedVoxelGrid {
  const colorMap = new Map<string, LegoColor>();
  const filledVoxels = grid.getFilledVoxels();

  for (const { x, y, z, r, g, b } of filledVoxels) {
    const legoColor = findClosestLegoColor(r, g, b);
    const key = `${x},${y},${z}`;
    colorMap.set(key, legoColor);

    // Update the grid color to the exact LEGO color
    grid.setColor(x, y, z, legoColor.rgb[0], legoColor.rgb[1], legoColor.rgb[2]);
  }

  return { grid, colorMap };
}
