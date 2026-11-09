import type { CSSProperties } from 'react';
import { itemColorCss, ITEM_NAMES } from '../content/items';
import type { GameState, MachineNode, NodeKind } from '../domain/types';
import type { GameEngine } from '../simulation/engine';
import { getTributeItems, tributeAmount, tributeMaterial, type TributeItem } from '../simulation/goblinTribute';
import { NodeIcon } from './NodeIcon';

const RESOURCE_ICONS: Record<TributeItem, NodeKind> = {
  iron: 'iron', copper: 'copper', stone: 'stoneDeposit', wood: 'forest', water: 'lake', mythril: 'mythril',
};

export function TributeResourcePicker({ game, engine, node, onClose }: {
  game: GameState; engine: GameEngine; node: MachineNode; onClose(): void;
}) {
  const camp = engine.getSector().nodes.find(candidate => candidate.id === node.tributeCampId && candidate.kind === 'monster-camp');
  if (!camp) return null;
  const selected = tributeMaterial(camp);
  return <aside className="inspector recipe-picker-panel tribute-picker-panel glass" aria-label="Tribute resources" aria-labelledby="tribute-picker-title">
    <header className="recipe-picker-header">
      <span><NodeIcon kind="goblinTribute" /></span>
      <div><h2 id="tribute-picker-title">Tribute</h2><p>{camp.lizardSettlement ? 'Mythril only. Stock survives missed upkeep; the arrangement remains conditional.' : 'Changing material discards other stored tribute.'}</p></div>
      <button onClick={onClose} aria-label="Close tribute picker">×</button>
    </header>
    <div className="recipe-picker-list" role="listbox" aria-label="Tribute resources">
      {getTributeItems(game, camp).map(item => <button key={item} type="button" role="option" aria-selected={item === selected}
        aria-label={ITEM_NAMES[item]}
        data-tooltip={ITEM_NAMES[item]} data-tooltip-detail={`${tributeAmount(camp)} ${ITEM_NAMES[item]} every 5 seconds. Diplomacy has a production rate.`}
        className={`recipe-picker-card ${item === selected ? 'selected' : ''}`}
        style={{ '--recipe-color': itemColorCss(item) } as CSSProperties}
        onClick={() => { if (engine.setGoblinTributeItem(node.id, item)) onClose(); }}>
        <span className="recipe-picker-icon"><NodeIcon kind={RESOURCE_ICONS[item]} inheritColor /></span>
        <span className="recipe-picker-copy"><span className="recipe-card-title"><strong>{ITEM_NAMES[item]}</strong><span className="recipe-card-time">5 sec</span></span><small>{tributeAmount(camp)} {ITEM_NAMES[item]}</small></span>
      </button>)}
    </div>
  </aside>;
}
