import { ITEM_COLORS, ITEM_NAMES } from '../../content/items';
import type { ItemId } from '../../domain/types';
import { PanelHeader } from '../PanelHeader';

export function InventoryPanel({ inventory, onClose }: { inventory: Partial<Record<ItemId, number>>; onClose(): void }) {
  const entries = Object.entries(inventory).filter(([, count]) => (count ?? 0) > 0) as [ItemId, number][];
  return <div className="modal-backdrop"><section className="modal inventory-modal glass"><PanelHeader eyebrow="WORLD LEDGER" title="Stock overview" onClose={onClose} /><div className="inventory-summary"><b>{entries.reduce((a, [, c]) => a + c, 0)}</b><span>items in buffers</span></div><div className="inventory-grid">{entries.map(([item, count]) => <div className="inventory-row" key={item} tabIndex={0} data-tooltip={ITEM_NAMES[item]} data-tooltip-detail={`${count} currently stored across all node buffers.`} style={{ '--item-color': `#${ITEM_COLORS_HEX[item]}`, '--tooltip-tone': `#${ITEM_COLORS_HEX[item]}` } as React.CSSProperties}><i /><span>{ITEM_NAMES[item]}</span><b>{count}<small>stored</small></b></div>)}{!entries.length && <div className="empty-state">Factory buffers are empty. Remarkably easy to inventory.</div>}</div></section></div>;
}

const ITEM_COLORS_HEX = Object.fromEntries(Object.entries(ITEM_COLORS).map(([key, value]) => [key, value.toString(16).padStart(6, '0')])) as Record<ItemId, string>;
