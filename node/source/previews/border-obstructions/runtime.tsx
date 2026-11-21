import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PixiPlayfield } from '../../src/renderer/PixiPlayfield';
import { NodeMinimap } from '../../src/ui/NodeMinimap';
import { UiTooltipLayer } from '../../src/ui/components/UiTooltipLayer';
import { GameEngine, createInitialState } from '../../src/simulation/engine';
import { BORDER_CROSSING_RESEARCH, borderSide, type BorderObstruction } from '../../src/domain/borderObstructionLayout';
import { mapNodePosition } from '../../src/domain/worldGrid';
import type { CameraState } from '../../src/domain/types';
import '../../src/styles.css';
import './runtime.css';

function fixture() {
  const engine = new GameEngine(createInitialState(37), { autosave: false });
  const state = engine.getState(); state.paused = true;
  state.research.completed = ['road', 'roadChannels1', 'roadChannels2']; state.research.unlocked.push('road');
  for (let y = 0; y < 11; y++) for (let x = 0; x < 11; x++) {
    const sector = engine.ensureSector(x, y); sector.unlocked = true; sector.visited = true; sector.nodes = []; sector.connections = [];
    state.sectors[sector.id] = sector;
  }
  state.activeSectorId = state.borderObstructions!.find(edge => edge.kind === 'river')!.from;
  engine.getSector().camera = { x: 220, y: 240, zoom: .16 };
  return engine;
}
function Preview() {
  const [engine] = useState(fixture), [revision, setRevision] = useState(0), [kind, setKind] = useState<BorderObstruction>('river');
  const [reverse, setReverse] = useState(false), [placing, setPlacing] = useState(false), [map, setMap] = useState(false), [result, setResult] = useState('');
  const [sample, setSample] = useState(0);
  const [focus, setFocus] = useState<{ camera: CameraState; nonce: number }>();
  const viewportRef = useRef<HTMLDivElement>(null), toolbarRef = useRef<HTMLElement>(null), hostRef = useRef<HTMLElement>(null);
  const game = engine.getState(), samples = game.borderObstructions!.filter(e => e.kind === kind), edge = samples[sample % samples.length];
  const id = reverse ? edge.to : edge.from, other = reverse ? edge.from : edge.to, side = borderSide(id, other);
  const point = { x: side === 'west' ? 10 : side === 'east' ? 3590 : 1800, y: side === 'north' ? 10 : side === 'south' ? 2390 : 1200 };
  useEffect(() => engine.subscribe(() => setRevision(n => n + 1)), [engine]);
  const fit = () => {
    const top = toolbarRef.current?.getBoundingClientRect().bottom ?? 130;
    const w = 3600 + (placing && (side === 'west' || side === 'east') ? 1848 : 0), h = 2400 + (placing && (side === 'north' || side === 'south') ? 1248 : 0);
    const zoom = Math.min(.25, (window.innerWidth - 36) / w, (window.innerHeight - top - 24) / h);
    const camera = { x: (window.innerWidth - w * zoom) / 2 + (placing && side === 'west' ? 1848 * zoom : 0), y: top + 6 + (placing && side === 'north' ? 1248 * zoom : 0), zoom };
    engine.getSector().camera = camera; setFocus(old => ({ camera, nonce: (old?.nonce ?? 0) + 1 }));
  };
  useLayoutEffect(() => { const update = () => { hostRef.current?.style.setProperty('--hud-clear', `${toolbarRef.current!.getBoundingClientRect().height}px`); fit(); }; const ro = new ResizeObserver(update); ro.observe(toolbarRef.current!); update(); return () => ro.disconnect(); }, [kind, reverse, placing, sample]);
  const choose = (nextKind: BorderObstruction, nextReverse = false, nextSample = 0) => {
    const matches = game.borderObstructions!.filter(e => e.kind === nextKind), next = matches[nextSample % matches.length];
    game.activeSectorId = nextReverse ? next.to : next.from;
    setKind(nextKind); setReverse(nextReverse); setSample(nextSample); setPlacing(false); setResult(''); setRevision(n => n + 1);
  };
  const place = () => { const road = engine.placeNode('road', point.x, point.y); setResult(road ? 'Road pair placed with the normal channel limit.' : engine.getNodePlacementError('road', point.x, point.y)); };
  return <main ref={hostRef} className="border-engine-test"><header ref={toolbarRef} className="border-engine-toolbar"><div><h1>Border obstructions · real engine test</h1><p>Synthetic empty fields · seed 37 · browser saves untouched · not a balance run</p></div><div className="border-engine-controls"><label>Terrain<select value={kind} onChange={e => choose(e.target.value as BorderObstruction)}><option value="river">River</option><option value="mountain">Mountain</option><option value="chasm">Chasm</option></select></label><button onClick={() => choose(kind, !reverse, sample)}>View other side</button><button onClick={() => choose(kind, false, sample + 1)}>Next border</button><button onClick={() => setPlacing(!placing)}>{placing ? 'Cancel Road' : 'Hold Road'}</button><button onClick={place}>Place test Road</button><button disabled={game.research.completed.includes(BORDER_CROSSING_RESEARCH[kind])} onClick={() => { game.research.completed.push(BORDER_CROSSING_RESEARCH[kind]); setRevision(n => n + 1); setResult('Crossing permission granted for this fixture. Roads remain manually placed.'); }}>Grant crossing research</button><button onClick={fit}>Fit field and ghost</button><button onClick={() => setMap(true)}>Open Node Map</button><button onClick={() => { engine.replaceState(fixture().getState()); choose('river'); }}>Reset fixture</button></div><p role="status">{mapNodePosition(...id.split(',').map(Number) as [number, number])} · {side} {kind} · {game.research.completed.includes(BORDER_CROSSING_RESEARCH[kind]) ? 'Crossing permitted' : 'Crossing blocked'} · {game.borderObstructions!.length} generated borders. {result || (placing ? 'Move the pointer over the field to show the centered Road preview and neighboring half.' : 'Normal view shows only terrain within the current field.')}</p></header>
    <PixiPlayfield engine={engine} revision={revision} viewportRef={viewportRef} selectedIds={[]} placing={placing ? 'road' : undefined} snapToGrid={false} showRecipeIcons cameraFocus={focus} roadPlacementPoint={() => point}
      onSelect={() => {}} onNodeContextMenu={() => {}} onCopyRecipe={() => false} onPlace={() => place()} onConnect={() => false} onConnectionRejected={() => {}} onConnectionSelect={() => {}} onDeleteConnection={id => engine.deleteConnection(id)} onDeleteNode={id => engine.deleteNodes([id])} onCycleInputPorts={() => {}} onCycleOutputPorts={() => {}} onRotate={() => {}} onConfigure={() => {}} onClonePlacement={() => {}} onCamera={camera => { engine.getSector().camera = camera; }} />
    {map && <NodeMinimap expanded persistLayout={false} game={game} engine={engine} onTravel={target => { game.activeSectorId = target; setMap(false); setPlacing(false); setRevision(n => n + 1); }} onOpenMap={() => setMap(true)} onClose={() => setMap(false)} onHoverChange={() => {}} />}
    <UiTooltipLayer />
  </main>;
}
const root = createRoot(document.getElementById('root')!); root.render(<Preview />);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
