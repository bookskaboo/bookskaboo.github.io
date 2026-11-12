import { useState, type CSSProperties } from 'react';
import { FILTERABLE_ITEMS, materialTypeName, itemColorCss } from '../content/items';
import { cargoMaterial } from '../content/botAssembly';
import { blockedFilterPort, selectedFilterPort } from '../domain/filterRouting';
import { filterOutletLabels } from '../domain/nodeGeometry';
import type { MachineNode } from '../domain/types';
import type { GameEngine } from '../simulation/engine';
import { NodeIcon } from './NodeIcon';
import { MaterialIcon } from './MaterialIcon';

export function FilterPicker({ engine, node, onClose }: {
  engine: GameEngine;
  node: MachineNode;
  onClose(): void;
}) {
  const [search, setSearch] = useState('');
  const selectedPort = selectedFilterPort(node);
  const labels = filterOutletLabels(node);
  const blockedPort = blockedFilterPort(node);
  const query = search.trim().toLowerCase();
  const selectedItem = node.filterItem && cargoMaterial(node.filterItem);
  const items = FILTERABLE_ITEMS.filter(item => cargoMaterial(item) === item && materialTypeName(item).toLowerCase().includes(query))
    .sort((a, b) => materialTypeName(a).localeCompare(materialTypeName(b)));

  return <aside className="inspector recipe-picker-panel filter-picker-panel glass" aria-labelledby="filter-picker-title">
    <header className="recipe-picker-header">
      <span><NodeIcon kind="filter" /></span>
      <div><h2 id="filter-picker-title">Filter</h2></div>
      <button type="button" onClick={onClose} aria-label="Close Filter">×</button>
    </header>
    <div className="filter-picker-controls">
      <div className="filter-picker-outlets" role="group" aria-label="Outlet for the selected item">
        {([0, 1] as const).map(port => {
          const selected = port === selectedPort;
          const label = `${labels[port]} outlet`;
          const item = selected ? node.filterItem : undefined;
          const contents = selected ? item ? materialTypeName(item) : 'Choose an item' : 'All other items';
          return <button key={port} type="button" className="filter-picker-outlet" aria-pressed={selected}
            aria-label={`${label}: ${contents}`}
            onClick={() => engine.setFilterItem(node.id, node.filterItem ?? 'wood', port)}>
            <span>{label}</span><strong>{contents}</strong>
          </button>;
        })}
      </div>
      {blockedPort !== undefined && <p className="filter-picker-blocked" role="status">{labels[blockedPort]} outlet blocked</p>}
      <input type="search" aria-label="Find an item" placeholder="Find an item" value={search}
        onChange={event => setSearch(event.target.value)}
        onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); } }} />
    </div>
    <div className="recipe-picker-list" role="group" aria-label="Filter items">
      {items.map(item => {
        const selected = item === selectedItem;
        return <button key={item} type="button" aria-pressed={selected} className={`recipe-picker-card${selected ? ' selected' : ''}`}
          style={{ '--recipe-color': itemColorCss(item) } as CSSProperties} onClick={() => engine.setFilterItem(node.id, item)}>
          <span className="recipe-picker-icon" aria-hidden="true"><MaterialIcon item={item} fallback="filter" /></span>
          <span className="recipe-picker-copy"><strong>{materialTypeName(item)}</strong></span>
        </button>;
      })}
      {!items.length && <p className="empty-state">No matching items.</p>}
    </div>
  </aside>;
}
