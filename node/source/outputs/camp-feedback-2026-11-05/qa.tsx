// Isolated visual fixture. It never loads, writes or modifies user saves.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PixiPlayfield } from '../../src/renderer/PixiPlayfield';
import { GameEngine, createInitialState } from '../../src/simulation/engine';
import { tutorialNode } from '../../src/tutorials/tutorialRuntime';
import { lessonCopy } from '../../src/tutorials/tutorialDialogue';
import { DwarvenDiscoveryNotice } from '../../src/ui/components/DwarvenDiscoveryNotice';
import '../../src/styles.css';

const state = createInitialState(234);
state.isTraining = true; state.paused = true;
state.sectors['5,5'].camera = { x: 60, y: 30, zoom: .7 };
state.sectors['5,5'].nodes = [
  tutorialNode('monster-camp', 'failed', 430, 380, { name: 'Goblin Camp', attackRequirement: 3, obstructionMaxRadius: 230, campStrength: 35, progressMs: 30000, campLastCheck: { passed: false, atMs: 0, suppliedAp: 0, requiredAp: 3 } }),
  tutorialNode('monster-camp', 'passed', 1100, 380, { name: 'Dwarven Camp', lizardSettlement: 'camp', settlementMapTier: 4, obstructionMaxRadius: 230, campStrength: 15, progressMs: 45000, suppressionCredit: 2, input: { 'medium-suppression-bot': 1 }, campLastCheck: { passed: true, atMs: 0, suppliedAp: 8, requiredAp: 6 } }),
];
const engine = new GameEngine(state, { autosave: false });
const noop = () => {};
function Fixture() {
  const [notice, setNotice] = useState(false), [guide, setGuide] = useState(false), [revision, setRevision] = useState(0);
  const [zoom, setZoom] = useState(.7);
  return <><div style={{ position: 'absolute', zIndex: 20, top: 10, left: 15, right: 15, display: 'flex', gap: 10, alignItems: 'center' }}><b>Camp feedback QA — no saves</b><button onClick={() => setNotice(true)}>Show Dwarven discovery</button><button onClick={() => setGuide(!guide)}>Show camp guide</button><button onClick={() => { const z = zoom === .7 ? .4 : .7; engine.setCamera({ x: 60, y: 30, zoom: z }); setZoom(z); }}>Toggle map-fit zoom</button><button onClick={() => { engine.getState().paused = false; for (let i = 0; i < 60; i++) engine.tick(1000); engine.getState().paused = true; setRevision(revision + 1); }}>Advance one check (QA)</button></div>
    <div style={{ position: 'absolute', inset: 0 }}><PixiPlayfield key={zoom} engine={engine} revision={revision} selectedIds={[]} snapToGrid={false} onSelect={noop} onNodeContextMenu={noop} onCopyRecipe={() => false} onPlace={noop} onConnect={() => false} onConnectionRejected={noop} onConnectionSource={noop} onConnectionSelect={noop} onDeleteConnection={noop} onDeleteNode={noop} onCycleInputPorts={noop} onCycleOutputPorts={noop} onRotate={noop} onConfigure={noop} onClonePlacement={noop} onCamera={noop}/></div>
    {guide && <aside className="inspector glass" style={{ zIndex: 25, top: 75, maxHeight: '80vh', overflow: 'auto' }}><button onClick={() => setGuide(false)}>Close guide</button>{(['monster-camp-suppression','monster-camp-growth'] as const).map(stage => { const copy = lessonCopy(stage); return <article key={stage}><h2>{copy.title}</h2><p>{copy.body}</p><b>{copy.instruction}</b></article>; })}</aside>}
    {notice && <DwarvenDiscoveryNotice camp={engine.getSector().nodes[1]} onDismiss={() => setNotice(false)}/>}</>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
