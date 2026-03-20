import { useMemo, useState } from 'react';
import { useModelStore } from '../hooks/useModelStore';
import { generateShoppingList } from '../engine/shoppingList';
import type { ShoppingList as ShoppingListType } from '../engine/shoppingList';
import { exportShoppingListCsv } from '../utils/exportCsv';
import { exportBrickLinkXml } from '../utils/exportBrickLinkXml';

type SortMode = 'quantity' | 'color' | 'brick';

export default function ShoppingList() {
  const placedBricks = useModelStore((s) => s.placedBricks);
  const [sortMode, setSortMode] = useState<SortMode>('quantity');

  const shoppingList = useMemo<ShoppingListType | null>(() => {
    if (!placedBricks) return null;
    return generateShoppingList(placedBricks);
  }, [placedBricks]);

  if (!shoppingList) return null;

  const sortedItems = [...shoppingList.items].sort((a, b) => {
    switch (sortMode) {
      case 'quantity':
        return b.quantity - a.quantity;
      case 'color':
        return a.color.name.localeCompare(b.color.name);
      case 'brick':
        return a.brick.name.localeCompare(b.brick.name);
      default:
        return 0;
    }
  });

  return (
    <div className="shopping-list">
      <h3>Shopping List</h3>

      <div className="estimated-cost">
        <span className="cost-value">
          Estimated cost: ${shoppingList.estimatedTotalCost.toFixed(2)} USD
        </span>
        <span className="cost-disclaimer">Based on avg. BrickLink prices</span>
      </div>

      <div className="shopping-stats">
        <span>{shoppingList.totalBricks.toLocaleString()} total bricks</span>
        <span>{shoppingList.totalUniqueItems} unique items</span>
        <span>{shoppingList.estimatedStudCount.toLocaleString()} studs</span>
      </div>

      <div className="shopping-actions">
        <div className="sort-controls">
          <label>Sort by:</label>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
          >
            <option value="quantity">Quantity</option>
            <option value="color">Color</option>
            <option value="brick">Brick Type</option>
          </select>
        </div>
        <button
          className="export-btn"
          onClick={() => exportShoppingListCsv(shoppingList)}
        >
          Export CSV
        </button>
        <button
          className="export-btn export-xml-btn"
          onClick={() => exportBrickLinkXml(shoppingList)}
        >
          Export BrickLink XML
        </button>
      </div>

      <div className="shopping-items">
        {sortedItems.map((item) => (
          <div key={`${item.brick.id}_${item.color.id}`} className="shopping-item">
            <div
              className="color-swatch"
              style={{ backgroundColor: item.color.hex }}
            />
            <div className="item-details">
              <span className="item-name">{item.brick.name}</span>
              <span className="item-color">{item.color.name}</span>
            </div>
            <span className="item-qty">{item.quantity}x</span>
          </div>
        ))}
      </div>
    </div>
  );
}
