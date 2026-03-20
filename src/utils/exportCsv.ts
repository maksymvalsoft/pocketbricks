import type { ShoppingList } from '../engine/shoppingList';

export function exportShoppingListCsv(list: ShoppingList): void {
  const header = 'Part Number,Brick Name,Color,Quantity,Unit Price (USD),Line Total (USD),BrickLink URL';
  const rows = list.items.map((item) =>
    [
      item.brick.partNumber,
      `"${item.brick.name}"`,
      `"${item.color.name}"`,
      item.quantity,
      item.brick.estimatedPrice.toFixed(2),
      item.lineCost.toFixed(2),
      item.brickLinkUrl,
    ].join(','),
  );

  // Add total row
  const totalRow = `,,,,TOTAL,$${list.estimatedTotalCost.toFixed(2)},`;
  const csv = [header, ...rows, totalRow].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'pocketbricks-shopping-list.csv';
  link.click();

  URL.revokeObjectURL(url);
}
