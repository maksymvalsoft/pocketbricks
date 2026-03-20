import { describe, it, expect } from 'vitest';
import {
  BoxGeometry,
  Mesh,
  MeshStandardMaterial,
  Color,
  BufferAttribute,
} from 'three';
import { VoxelGrid } from '../engine/VoxelGrid';
import { voxelizeMesh } from '../engine/voxelizer';
import { quantizeColors } from '../engine/colorQuantizer';
import { placeBricks, mergeVertically } from '../engine/brickPlacer';
import { generateShoppingList } from '../engine/shoppingList';

describe('E2E: Full pipeline smoke test', () => {
  it('should voxelize a simple colored cube and produce a shopping list', () => {
    // Step 1: Create a simple colored cube mesh
    const geometry = new BoxGeometry(1, 1, 1);

    // Add vertex colors (red)
    const count = geometry.attributes.position.count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      colors[i * 3] = 1;     // R
      colors[i * 3 + 1] = 0; // G
      colors[i * 3 + 2] = 0; // B
    }
    geometry.setAttribute('color', new BufferAttribute(colors, 3));

    const material = new MeshStandardMaterial({
      color: new Color(1, 0, 0),
      vertexColors: true,
    });
    const mesh = new Mesh(geometry, material);

    // Step 2: Voxelize at resolution 8
    const result = voxelizeMesh(mesh, { resolution: 8 });
    const grid = result.grid;

    expect(grid).toBeInstanceOf(VoxelGrid);
    expect(grid.filledCount()).toBeGreaterThan(0);
    expect(grid.width).toBeGreaterThan(0);
    expect(grid.height).toBeGreaterThan(0);
    expect(grid.depth).toBeGreaterThan(0);

    // Verify VoxelizeResult metadata
    expect(result.bboxMin).toHaveLength(3);
    expect(result.bboxMax).toHaveLength(3);
    expect(result.voxelSize).toBeGreaterThan(0);

    // Step 3: Quantize colors
    const { colorMap } = quantizeColors(grid);
    expect(colorMap.size).toBeGreaterThan(0);

    // All voxels should map to LEGO colors
    const uniqueColors = new Set(Array.from(colorMap.values()).map((c) => c.id));
    expect(uniqueColors.size).toBeGreaterThanOrEqual(1);

    // Step 4: Place bricks
    let bricks = placeBricks(grid, colorMap);
    expect(bricks.length).toBeGreaterThan(0);

    // Step 5: Merge vertically
    bricks = mergeVertically(bricks);
    expect(bricks.length).toBeGreaterThan(0);

    // Step 6: Generate shopping list
    const shoppingList = generateShoppingList(bricks);
    expect(shoppingList.totalBricks).toBeGreaterThan(0);
    expect(shoppingList.items.length).toBeGreaterThan(0);
    expect(shoppingList.totalUniqueItems).toBeGreaterThanOrEqual(1);
    expect(shoppingList.estimatedStudCount).toBeGreaterThan(0);

    // Each item should have valid fields
    for (const item of shoppingList.items) {
      expect(item.quantity).toBeGreaterThan(0);
      expect(item.brick).toBeDefined();
      expect(item.color).toBeDefined();
      expect(item.brickLinkUrl).toBeTruthy();
    }

    console.log(`E2E Results:
    Grid: ${grid.width}x${grid.height}x${grid.depth}
    Filled voxels: ${grid.filledCount()}
    Placed bricks: ${bricks.length}
    Shopping list items: ${shoppingList.items.length}
    Total bricks: ${shoppingList.totalBricks}
    Total studs: ${shoppingList.estimatedStudCount}`);
  });
});
