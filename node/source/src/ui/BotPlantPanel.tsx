import { useId, type CSSProperties } from 'react';
import { BOT_FRAME_AP, BOT_FRAMES, BOT_GUN_MULTIPLIERS, BOT_GUNS, type BotFrame, type BotGun } from '../content/botAssembly';
import { ITEM_NAMES, itemColorCss } from '../content/items';
import { getBotPlantBuild } from '../content/recipes';
import type { ItemId, MachineNode } from '../domain/types';
import { MaterialIcon } from './MaterialIcon';
import { NodeIcon } from './NodeIcon';

function PartCard({ label, item, detail }: { label: string; item?: ItemId; detail?: string }) {
  const color = item && itemColorCss(item);
  return <div className={`recipe-picker-card part-card${item ? '' : ' part-card-empty'}`} style={{ '--recipe-color': color } as CSSProperties}>
    <span className="part-label">{label}</span>
    <span className="recipe-picker-icon" aria-hidden="true">{item && <MaterialIcon item={item} />}</span>
    <div className="part-copy">
      <span className="part-name">{item ? ITEM_NAMES[item] : 'Empty'}</span>
      {detail && <span className="part-detail">{detail}</span>}
    </div>
  </div>;
}

export function BotPlantPanel({ frame, gun, attackPower, onClose }: {
  frame?: BotFrame;
  gun?: BotGun;
  attackPower?: number;
  onClose(): void;
}) {
  const titleId = useId();
  const frameDetail = frame && `${BOT_FRAME_AP[BOT_FRAMES.indexOf(frame)]} base AP`;
  const gunDetail = gun && `×${BOT_GUN_MULTIPLIERS[BOT_GUNS.indexOf(gun)]} multiplier`;
  return <section className="inspector recipe-picker-panel glass bot-plant-panel" aria-labelledby={titleId}>
    <header className="recipe-picker-header">
      <span><NodeIcon kind="botPlant" /></span>
      <h2 id={titleId}>Bot Plant</h2>
      <button type="button" aria-label="Close Bot Plant" onClick={onClose}>×</button>
    </header>
    <div className="bot-inputs">
      <div className="part-cards">
        <PartCard label="Frame" item={frame} detail={frameDetail} />
        <PartCard label="Gun" item={gun} detail={gunDetail} />
      </div>
      <output className="bot-output" aria-label="Suppression Bot attack power">{attackPower === undefined ? null : `${attackPower} AP`}</output>
    </div>
  </section>;
}

export function BotPlantInspector({ node, completed, onClose }: { node: MachineNode; completed: readonly string[]; onClose(): void }) {
  const build = getBotPlantBuild(node, completed);
  const frame = build?.frame ?? BOT_FRAMES.find(part => (node.input[part] ?? 0) >= 1);
  const gun = build?.gun ?? BOT_GUNS.find(part => (node.input[part] ?? 0) >= 1);
  return <BotPlantPanel frame={frame} gun={gun} attackPower={build?.ap} onClose={onClose} />;
}
