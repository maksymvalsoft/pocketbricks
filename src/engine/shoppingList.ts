import type { PlacedBrick } from './brickPlacer';
import type { BrickType } from '../data/legoBricks';
import type { LegoColor } from '../data/legoColors';

export interface ShoppingListItem {
  brick: BrickType;
  color: LegoColor;
  quantity: number;
  brickLinkUrl: string;
  lineCost: number; // quantity × brick.estimatedPrice
}

export interface ShoppingList {
  items: ShoppingListItem[];
  totalBricks: number;
  totalUniqueItems: number;
  estimatedStudCount: number;
  estimatedTotalCost: number; // sum of all lineCost values
}

export function generateShoppingList(placedBricks: PlacedBrick[]): ShoppingList {
  const map = new Map<string, ShoppingListItem>();

  let estimatedStudCount = 0;

  for (const placed of placedBricks) {
    const key = `${placed.brick.id}_${placed.color.id}`;
    const studs = placed.brick.widthStuds * placed.brick.depthStuds;
    estimatedStudCount += studs;

    if (map.has(key)) {
      map.get(key)!.quantity++;
    } else {
      map.set(key, {
        brick: placed.brick,
        color: placed.color,
        quantity: 1,
        brickLinkUrl: `https://www.bricklink.com/v2/catalog/catalogitem.page?P=${placed.brick.partNumber}`,
        lineCost: 0, // computed below
      });
    }
  }

  const items = Array.from(map.values());

  // Compute line costs
  for (const item of items) {
    item.lineCost = item.quantity * item.brick.estimatedPrice;
  }

  items.sort((a, b) => b.quantity - a.quantity);

  const estimatedTotalCost = items.reduce((sum, item) => sum + item.lineCost, 0);

  return {
    items,
    totalBricks: placedBricks.length,
    totalUniqueItems: items.length,
    estimatedStudCount,
    estimatedTotalCost,
  };
}
