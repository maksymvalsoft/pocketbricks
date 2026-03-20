import { describe, it, expect } from 'vitest';
import { VoxelGrid } from '../VoxelGrid';
import { quantizeColors } from '../colorQuantizer';
import { LEGO_COLORS } from '../../data/legoColors';

describe('colorQuantizer', () => {
  it('should map all filled voxels to LEGO colors', () => {
    const grid = new VoxelGrid(3, 3, 3);
    grid.setFilled(0, 0, 0, true);
    grid.setColor(0, 0, 0, 200, 10, 10); // reddish
    grid.setFilled(1, 1, 1, true);
    grid.setColor(1, 1, 1, 10, 10, 200); // blueish

    const { colorMap } = quantizeColors(grid);
    expect(colorMap.size).toBe(2);

    const color1 = colorMap.get('0,0,0');
    expect(color1).toBeDefined();
    expect(color1!.name).toBe('Red');

    const color2 = colorMap.get('1,1,1');
    expect(color2).toBeDefined();
    // Should be some blue LEGO color
    expect(color2!.rgb[2]).toBeGreaterThan(color2!.rgb[0]);
  });

  it('should not have more unique colors than LEGO palette', () => {
    const grid = new VoxelGrid(4, 4, 4);
    // Fill all voxels with random colors
    for (let x = 0; x < 4; x++) {
      for (let y = 0; y < 4; y++) {
        for (let z = 0; z < 4; z++) {
          grid.setFilled(x, y, z, true);
          grid.setColor(x, y, z,
            Math.floor(Math.random() * 256),
            Math.floor(Math.random() * 256),
            Math.floor(Math.random() * 256),
          );
        }
      }
    }

    const { colorMap } = quantizeColors(grid);
    const uniqueColors = new Set(Array.from(colorMap.values()).map((c) => c.id));
    expect(uniqueColors.size).toBeLessThanOrEqual(LEGO_COLORS.length);
  });

  it('should handle empty grid', () => {
    const grid = new VoxelGrid(3, 3, 3);
    const { colorMap } = quantizeColors(grid);
    expect(colorMap.size).toBe(0);
  });
});
