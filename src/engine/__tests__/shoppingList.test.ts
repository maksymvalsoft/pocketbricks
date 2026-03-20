import { describe, it, expect } from 'vitest';
import { generateShoppingList } from '../shoppingList';
import { BRICK_CATALOG } from '../../data/legoBricks';
import { LEGO_COLORS } from '../../data/legoColors';
import type { PlacedBrick } from '../brickPlacer';

const RED = LEGO_COLORS.find((c) => c.name === 'Red')!;
const BLUE = LEGO_COLORS.find((c) => c.name === 'Blue')!;
const PLATE_1x1 = BRICK_CATALOG.find((b) => b.id === 'plate_1x1')!;
const PLATE_2x4 = BRICK_CATALOG.find((b) => b.id === 'plate_2x4')!;

describe('generateShoppingList', () => {
  it('should correctly aggregate brick quantities', () => {
    const bricks: PlacedBrick[] = [
      { x: 0, y: 0, z: 0, brick: PLATE_1x1, color: RED, rotated: false },
      { x: 1, y: 0, z: 0, brick: PLATE_1x1, color: RED, rotated: false },
      { x: 2, y: 0, z: 0, brick: PLATE_1x1, color: BLUE, rotated: false },
    ];

    const list = generateShoppingList(bricks);
    expect(list.totalBricks).toBe(3);
    expect(list.totalUniqueItems).toBe(2);
    expect(list.items.length).toBe(2);

    const redItem = list.items.find((i) => i.color.id === RED.id);
    expect(redItem).toBeDefined();
    expect(redItem!.quantity).toBe(2);

    const blueItem = list.items.find((i) => i.color.id === BLUE.id);
    expect(blueItem).toBeDefined();
    expect(blueItem!.quantity).toBe(1);
  });

  it('should sort by quantity descending', () => {
    const bricks: PlacedBrick[] = [
      { x: 0, y: 0, z: 0, brick: PLATE_1x1, color: BLUE, rotated: false },
      { x: 1, y: 0, z: 0, brick: PLATE_1x1, color: RED, rotated: false },
      { x: 2, y: 0, z: 0, brick: PLATE_1x1, color: RED, rotated: false },
      { x: 3, y: 0, z: 0, brick: PLATE_1x1, color: RED, rotated: false },
    ];

    const list = generateShoppingList(bricks);
    expect(list.items[0].color.id).toBe(RED.id);
    expect(list.items[0].quantity).toBe(3);
  });

  it('should calculate correct stud count', () => {
    const bricks: PlacedBrick[] = [
      { x: 0, y: 0, z: 0, brick: PLATE_2x4, color: RED, rotated: false },
      { x: 0, y: 0, z: 4, brick: PLATE_1x1, color: RED, rotated: false },
    ];

    const list = generateShoppingList(bricks);
    expect(list.estimatedStudCount).toBe(8 + 1); // 2x4=8, 1x1=1
  });

  it('should handle empty brick list', () => {
    const list = generateShoppingList([]);
    expect(list.totalBricks).toBe(0);
    expect(list.totalUniqueItems).toBe(0);
    expect(list.items.length).toBe(0);
  });

  it('should generate BrickLink URLs', () => {
    const bricks: PlacedBrick[] = [
      { x: 0, y: 0, z: 0, brick: PLATE_1x1, color: RED, rotated: false },
    ];

    const list = generateShoppingList(bricks);
    expect(list.items[0].brickLinkUrl).toContain(PLATE_1x1.partNumber);
  });
});
