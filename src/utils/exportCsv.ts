import type { ShoppingList } from '../engine/shoppingList';

export function exportShoppingListCsv(list: ShoppingList): void {
  const header = 'Part Number,Brick Name,Color,Quantity,BrickLink URL';
  const rows = list.items.map((item) =>
    [
      item.brick.partNumber,
      `"${item.brick.name}"`,
      `"${item.color.name}"`,
      item.quantity,
      item.brickLinkUrl,
    ].join(','),
  );

  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'pocketbricks-shopping-list.csv';
  link.click();

  URL.revokeObjectURL(url);
}
