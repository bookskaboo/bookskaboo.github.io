import { itemColorCss, ITEM_NAMES } from '../../content/items';
import { cargoMaterial } from '../../content/botAssembly';
import type { ItemId } from '../../domain/types';
import { MaterialIcon } from '../MaterialIcon';
import { PanelHeader } from '../PanelHeader';

export function InventoryPanel({ inventory, onClose }: { inventory: Partial<Record<ItemId, number>>; onClose(): void }) {
  const entries = Object.entries(inventory).filter(([, count]) => (count ?? 0) > 0) as [ItemId, number][];
  return <div className="modal-backdrop"><section className="modal inventory-modal glass">
    <PanelHeader title="Stock overview" onClose={onClose} />
    <div className="inventory-summary"><b>{entries.reduce((total, [, count]) => total + count, 0)}</b><span>items in buffers</span></div>
    <div className="inventory-grid">
      {entries.map(([item, count]) => {
        const color = itemColorCss(item);
        return <div className="inventory-row" key={item} tabIndex={0} data-tooltip={ITEM_NAMES[item]}
          data-tooltip-detail={`${count} currently stored across all node buffers.`}
          style={{ '--item-color': color, '--tooltip-tone': color } as React.CSSProperties}>
          <MaterialIcon item={cargoMaterial(item)} /><span>{ITEM_NAMES[item]}</span><b>{count}<small>stored</small></b>
        </div>;
      })}
      {!entries.length && <div className="empty-state">Factory buffers are empty. Remarkably easy to inventory.</div>}
    </div>
  </section></div>;
}
