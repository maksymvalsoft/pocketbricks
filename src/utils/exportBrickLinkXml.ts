import type { ShoppingList } from '../engine/shoppingList';

export function exportBrickLinkXml(list: ShoppingList): void {
  const itemLines: string[] = [];

  for (const item of list.items) {
    const blColorId = item.color.brickLinkColorId;
    if (blColorId === -1) {
      console.warn(
        `Skipping color "${item.color.name}" (Rebrickable ID ${item.color.id}) — no BrickLink color ID mapping`,
      );
      continue;
    }

    itemLines.push(
      `  <ITEM>`,
      `    <ITEMTYPE>P</ITEMTYPE>`,
      `    <ITEMID>${item.brick.partNumber}</ITEMID>`,
      `    <COLOR>${blColorId}</COLOR>`,
      `    <MAXPRICE>-1</MAXPRICE>`,
      `    <MINQTY>${item.quantity}</MINQTY>`,
      `    <CONDITION>N</CONDITION>`,
      `    <NOTIFY>N</NOTIFY>`,
      `  </ITEM>`,
    );
  }

  const xml = `<INVENTORY>\n${itemLines.join('\n')}\n</INVENTORY>\n`;

  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'pocketbricks-wanted-list.xml';
  link.click();

  URL.revokeObjectURL(url);
}
