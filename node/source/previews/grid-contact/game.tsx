// Isolated renderer fixture. No persistence and no connection to an existing save.
import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PixiPlayfield } from '../../src/renderer/PixiPlayfield';
import { createInitialState, GameEngine } from '../../src/simulation/engine';
import { getNodeSize } from '../../src/domain/nodeGeometry';
import { snapNodePosition } from '../../src/domain/nodeGrid';
import type { CameraState, NodeKind } from '../../src/domain/types';
import { specimen } from './model';
import '../../src/styles/readability.css';
import './game.css';

function makeFixture() {
  const engine = new GameEngine(createInitialState(1), { autosave: false });
  engine.getState().paused = true;
  engine.getState().research.unlocked.push('road');
  const sector = engine.getSector();
  sector.camera = { x: 32, y: 0, zoom: 1 };
  sector.nodes = [specimen('woodenChest', 'a-cart', 256, 128), specimen('woodenChest', 'b-cart', 384, 128),
    specimen('woodenChest', 'c-cart', 704, 128), specimen('smelter', 'smelter', 256, 320), specimen('assembler', 'assembler', 512, 320)];
  sector.nodes[0].output.wood = 4;
  sector.connections = [];
  return engine;
}

function Fixture() {
  const [engine, setEngine] = useState(makeFixture);
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [placing, setPlacing] = useState<NodeKind>();
  const [message, setMessage] = useState('32-unit grid. Touching bodies. Paused fixture.');
  const [cameraFocus, setCameraFocus] = useState<{ camera: CameraState; nonce: number }>();
  const viewportRef = useRef<HTMLDivElement>(null);
  useEffect(() => engine.subscribe(() => setRevision(engine.getState().revision)), [engine]);
  const sector = engine.getSector();
  return <>
    <header className="fixture-tools"><span>Actual game renderer · isolated QA fixture</span>
      <button onClick={() => { setEngine(makeFixture()); setSelected([]); setPlacing(undefined); setMessage('Reset fixture.'); }}>Reset fixture</button>
      <button onClick={() => setPlacing(placing ? undefined : 'woodenChest')}>{placing ? 'Cancel placement' : 'Place Cart'}</button>
      <button onClick={() => setCameraFocus({ camera: { x: 32, y: 0, zoom: .7 }, nonce: performance.now() })}>70% zoom</button>
      <button onClick={() => setCameraFocus({ camera: { x: 32, y: 0, zoom: 1 }, nonce: performance.now() })}>100% zoom</button>
      <button onClick={() => { engine.getState().paused = false; for (let i = 0; i < 20; i++) engine.tick(100); engine.getState().paused = true; setRevision(engine.getState().revision); setMessage('Simulated two seconds, then paused.'); }}>Run transfers</button>
      <output role="status">{message}</output></header>
    <PixiPlayfield viewportRef={viewportRef} engine={engine} revision={revision} selectedIds={selected} snapToGrid showRecipeIcons cameraFocus={cameraFocus}
      placing={placing} onSelect={setSelected} onNodeContextMenu={() => {}} onCopyRecipe={() => false}
      onPlace={(kind, x, y) => {
        const point = snapNodePosition({ x, y }, true, getNodeSize({ kind }));
        const id = engine.placeNode(kind, point.x, point.y);
        setMessage(id ? `Placed Cart at ${point.x}, ${point.y}.` : 'Placement blocked.');
        if (id) setPlacing(undefined);
      }}
      onConnect={(from, to, fromPort, toPort, replace) => {
        const result = engine.connectPorts(from, fromPort, to, toPort, replace);
        setMessage(`${from} output ${fromPort} to ${to} input ${toPort}: ${result ? 'connected' : 'blocked'}.`); return result;
      }} onConnectionRejected={failure => setMessage(failure.detail)} onConnectionSelect={() => {}}
      onDeleteConnection={id => engine.deleteConnection(id)} onDeleteNode={() => {}}
      onCycleInputPorts={() => {}} onCycleOutputPorts={() => {}} onRotate={() => {}} onConfigure={() => {}} onClonePlacement={setPlacing}
      onCamera={camera => { sector.camera = camera; }} />
    <details className="fixture-readout" open><summary>Fixture state</summary>
      <pre>{JSON.stringify({ selected, nodes: sector.nodes.map(({ id, x, y, input, output }) => ({ id, x, y, input, output })),
        connections: sector.connections.map(({ from, to, fromPort, toPort }) => ({ from, to, fromPort, toPort })) }, null, 2)}</pre>
    </details>
  </>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
