import { useState } from 'react';
import { BUILDABLE_NODES, isNodeUnlocked } from '../../content/nodes';
import { RESEARCH_PROJECTS } from '../../content/research';
import type { GameState } from '../../domain/types';
import { GameEngine } from '../../simulation/engine';
import { PanelHeader } from '../PanelHeader';

export function DevPanel({ game, engine, showAllBuildNodes, onShowAllBuildNodes, onClose }: { game: GameState; engine: GameEngine; showAllBuildNodes: boolean; onShowAllBuildNodes(v: boolean): void; onClose(): void }) {
  const [reportText, setReportText] = useState('');
  const exportReport = () => {
    const report = { exportedAt: new Date().toISOString(), simulationTimeMs: game.playTimeMs, seed: game.seed, extracted: game.extracted ?? {}, produced: game.produced ?? {}, state: game };
    setReportText(JSON.stringify(report, null, 2));
  };
  const allNodesUnlocked = BUILDABLE_NODES.every((definition) => isNodeUnlocked(definition.kind, game.research.unlocked));
  const allResearchUnlocked = RESEARCH_PROJECTS.filter((project) => !project.repeatable).every((project) => game.research.completed.includes(project.id));
  const allMapNodesUnlocked = Object.values(game.sectors).filter((sector) => sector.unlocked).length === 121;
  const Control = ({ icon, title, detail, action, state, disabled }: { icon: string; title: string; detail: string; action(): void; state: string; disabled?: boolean }) => <button className={`option-action dev-control ${disabled ? 'complete' : ''}`} disabled={disabled} onClick={action}><i>{icon}</i><span><b>{title}</b><small>{detail}</small></span><strong>{state}</strong></button>;
  return <div className="modal-backdrop"><section className="modal dev-modal glass"><PanelHeader eyebrow="DEVELOPER TOOLS" title="Dev controls" onClose={onClose} /><div className="dev-note"><i>!</i><span><b>Local developer overrides</b><small>These controls modify this save immediately. Unlock actions can be undone once with Ctrl + Z.</small></span></div><div className="option-list dev-controls">
    <button className="option-action" onClick={exportReport}><i>↓</i><span><b>Export playtest report</b><small>Export resources, time, and factory state. Evidence, if required.</small></span><strong>JSON</strong></button>
    {reportText && <textarea aria-label="Playtest report JSON" readOnly value={reportText} style={{ width: '100%', minHeight: 180, fontFamily: 'monospace', fontSize: 11 }} />}
    <Control icon="◉" title="Show all nodes" detail="Preview locked schematics without unlocking them. Window shopping." action={() => onShowAllBuildNodes(!showAllBuildNodes)} state={showAllBuildNodes ? 'ON' : 'OFF'} />
    <Control icon="＋" title="Unlock all nodes" detail="Unlock every buildable node. The research department has been bypassed." action={() => engine.developerUnlockAllNodes()} state={allNodesUnlocked ? 'UNLOCKED' : 'UNLOCK'} disabled={allNodesUnlocked} />
    <Control icon="⌁" title="Unlock all research" detail="Complete permanent research and grant Map Points. Peer review waived." action={() => engine.developerUnlockAllResearch()} state={allResearchUnlocked ? 'UNLOCKED' : 'UNLOCK'} disabled={allResearchUnlocked} />
    <Control icon="◎" title="Unlock all map nodes" detail="Activate all 121 maps. A modest expansion of responsibilities." action={() => engine.developerUnlockAllSectors()} state={allMapNodesUnlocked ? 'UNLOCKED' : 'UNLOCK'} disabled={allMapNodesUnlocked} />
    <Control icon="▦" title="Global Inventory" detail="Autonomous Logistics unlocks Inventory withdrawals through Filters and shared-pool Storage deposits." action={() => {}} state="RESEARCH" disabled />
    <Control icon="□" title="Storage capacity" detail="The shared pool holds 1,000 per item. Repeatable research increases placements and connections." action={() => {}} state="ACTIVE" disabled />
  </div></section></div>;
}
