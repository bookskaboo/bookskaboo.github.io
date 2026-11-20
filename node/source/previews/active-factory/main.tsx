import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RECIPES } from '../../src/content/recipes';
import type { CameraState } from '../../src/domain/types';
import { getNodeSize } from '../../src/domain/nodeGeometry';
import { PixiPlayfield } from '../../src/renderer/PixiPlayfield';
import { MAX_VISIBLE_TRANSFERS } from '../../src/simulation/transfers';
import { GameEngine } from '../../src/simulation/engine';
import { createFactoryFixture, factoryActivity, factoryLoads, DENSE_CELL_NODES, type FactoryLoad, type FactoryLayout } from './model';
import type { RendererDiagnostics } from '../../src/renderer/sceneUpdates';
import '../../src/styles.css';
import './preview.css';

function ActiveFactory() {
  const params = new URLSearchParams(location.search);
  const queryLoad = Number(params.get('nodes'));
  const initialLayout: FactoryLayout = params.get('layout') === 'dense' ? 'dense' : params.get('layout') === 'lines' || params.has('nodes') ? 'lines' : 'dense';
  const [layout, setLayout] = useState<FactoryLayout>(initialLayout);
  const [load, setLoad] = useState<FactoryLoad>(factoryLoads(initialLayout).find(value => value === queryLoad) ?? (initialLayout === 'dense' ? 1200 : 300));
  const [engine] = useState(() => new GameEngine(createFactoryFixture(layout, load), { autosave: false }));
  const [emphasizeProgress, setEmphasizeProgress] = useState(initialLayout === 'dense');
  const [revision, setRevision] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string>();
  const [cameraFocus, setCameraFocus] = useState<{ camera: CameraState; nonce: number }>();
  const [performanceStats, setPerformanceStats] = useState({ fps: 0, tickMs: 0 });
  const samples = useRef({ start: performance.now(), frames: [] as number[], ticks: [] as number[], lastFrame: 0 });
  const [benchmark, setBenchmark] = useState({ frameP95: 0, frameP99: 0, tickP95: 0, slowFrames: 0, count: 0, seconds: 0 });
  const [message, setMessage] = useState('');
  const [rendererStats, setRendererStats] = useState<RendererDiagnostics>();
  const viewportRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const helpRef = useRef<HTMLElement>(null);
  const state = engine.getState();
  const sector = engine.getSector();
  const activity = factoryActivity(state);
  const selected = sector.nodes.find(node => selectedIds.includes(node.id));

  const focus = (detail = false) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const box = viewport.getBoundingClientRect();
    const currentNodes = engine.getSector().nodes;
    if (!currentNodes.length) return;
    const nodes = detail ? currentNodes.slice(0, layout === 'dense' ? DENSE_CELL_NODES : 5) : currentNodes;
    const left = Math.min(...nodes.map(node => node.x - getNodeSize(node).w / 2));
    const right = Math.max(...nodes.map(node => node.x + getNodeSize(node).w / 2));
    const top = Math.min(...nodes.map(node => node.y - getNodeSize(node).h / 2));
    const bottom = Math.max(...nodes.map(node => node.y + getNodeSize(node).h / 2));
    const availableHeight = Math.max(80, box.height - (helpRef.current?.getBoundingClientRect().height ?? 48) - 32);
    const zoom = Math.min(detail ? .9 : .5, (box.width - 48) / (right - left), availableHeight / (bottom - top));
    const camera = { x: (box.width - (left + right) * zoom) / 2, y: box.top + 16 + (availableHeight - (top + bottom) * zoom) / 2, zoom };
    engine.setCamera(camera);
    setCameraFocus(previous => ({ camera, nonce: (previous?.nonce ?? 0) + 1 }));
  };

  useLayoutEffect(() => {
    const header = headerRef.current!;
    const size = () => header.parentElement!.style.setProperty('--test-header-height', `${header.getBoundingClientRect().height}px`);
    const observer = new ResizeObserver(size);
    observer.observe(header);
    size();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const unsubscribe = engine.subscribe(() => setRevision(value => value + 1));
    engine.startRealtimeClock();
    let lastTickMs = 0;
    const interval = window.setInterval(() => {
      const start = performance.now();
      engine.tickRealtime();
      lastTickMs = performance.now() - start;
      if (performance.now() - samples.current.start >= 5000) samples.current.ticks.push(lastTickMs);
    }, 100);
    let frame = 0, frames = 0, measuredAt = performance.now();
    const measure = (now: number) => {
      frames++;
      const sample = samples.current;
      if (now - sample.start >= 5000 && sample.lastFrame) sample.frames.push(now - sample.lastFrame);
      sample.lastFrame = now;
      if (now - measuredAt >= 1000) {
        setPerformanceStats({ fps: Math.round(frames * 1000 / (now - measuredAt)), tickMs: lastTickMs });
        measuredAt = now; frames = 0;
        const percentile = (values: number[], fraction: number) => [...values].sort((a, b) => a - b)[Math.max(0, Math.ceil(values.length * fraction) - 1)] ?? 0;
        setBenchmark({ frameP95: percentile(sample.frames, .95), frameP99: percentile(sample.frames, .99), tickP95: percentile(sample.ticks, .95), slowFrames: sample.frames.filter(ms => ms > 33.4).length, count: sample.frames.length, seconds: Math.max(0, (now - sample.start) / 1000 - 5) });
        // Bound profiling memory during long manual sessions.
        if (sample.frames.length > 3600) sample.frames.splice(0, sample.frames.length - 3600);
        if (sample.ticks.length > 600) sample.ticks.splice(0, sample.ticks.length - 600);
      }
      frame = requestAnimationFrame(measure);
    };
    frame = requestAnimationFrame(measure);
    const fitFrame = requestAnimationFrame(() => focus());
    return () => {
      unsubscribe(); engine.stopRealtimeClock();
      clearInterval(interval); cancelAnimationFrame(frame); cancelAnimationFrame(fitFrame);
    };
  }, [engine]);

  const reset = (nextLoad = load, nextLayout = layout) => {
    setLoad(nextLoad); setLayout(nextLayout);
    if (nextLayout !== layout) setEmphasizeProgress(nextLayout === 'dense');
    samples.current = { start: performance.now(), frames: [], ticks: [], lastFrame: 0 };
    setBenchmark({ frameP95: 0, frameP99: 0, tickP95: 0, slowFrames: 0, count: 0, seconds: 0 });
    setPerformanceStats({ fps: 0, tickMs: 0 });
    setSelectedIds([]); setSelectedConnection(undefined); setMessage('');
    // Reuse the current WebGL renderer, as the main game does when loading a save.
    engine.replaceState(createFactoryFixture(nextLayout, nextLoad));
    requestAnimationFrame(() => focus());
    const url = new URL(location.href);
    url.searchParams.set('nodes', String(nextLoad));
    url.searchParams.set('layout', nextLayout);
    history.replaceState(null, '', url);
  };

  return <main className="active-factory-test">
    <header ref={headerRef} className="factory-test-header">
      <div className="factory-test-title"><h1>Active factory test</h1><span>One Map Node. Several questionable staffing decisions.</span></div>
      <div className="factory-test-controls">
        <label>Layout <select value={layout} onChange={event => { const next = event.target.value as FactoryLayout; reset(next === 'dense' ? 1200 : 300, next); }}><option value="dense">Dense routing</option><option value="lines">Production lines</option></select></label>
        <label>Load <select value={load} onChange={event => reset(Number(event.target.value) as FactoryLoad)}>{factoryLoads(layout).map(value => <option key={value} value={value}>{value.toLocaleString()} nodes</option>)}</select></label>
        <button onClick={() => engine.togglePause()}>{state.paused ? 'Resume' : 'Pause'}</button>
        <button onClick={() => focus()}>Fit all</button>
        <button onClick={() => focus(true)}>{layout === 'dense' ? 'Inspect a cell' : 'Inspect a line'}</button>
        <button onClick={() => reset()}>Reset test</button>
        <label><input type="checkbox" checked={emphasizeProgress} onChange={event => setEmphasizeProgress(event.target.checked)} />Emphasize progress bars</label>
      </div>
      <div className="factory-test-stats" aria-label="Live factory activity" data-benchmark={JSON.stringify(benchmark)} data-renderer={JSON.stringify(rendererStats)} data-layout={layout} data-progress-emphasis={emphasizeProgress}>
        <span>{activity.nodes} nodes</span><span>{activity.producers} producers</span><span>{activity.connections} connections</span>
        {layout === 'dense' && <><span>{activity.splitters} Splitters</span><span>{activity.mergers} Mergers</span></>}
        <span>{state.paused ? 0 : activity.cycling} cycling</span>
        <span>{activity.transfers} materials in transit</span><span>{activity.produced.toLocaleString()} produced</span><span>{activity.delivered.toLocaleString()} delivered</span>
        <span>{Math.floor(state.playTimeMs / 1000)} s elapsed</span><span>{performanceStats.fps} page FPS</span><span>{performanceStats.tickMs.toFixed(1)} ms last tick</span>
        <span>{benchmark.frameP95.toFixed(1)} ms p95 frame</span>
      </div>
      <p>Current game engine and renderer, normal speed. Dev Sources supply inputs; large final storage keeps lines moving. Test resets on reload. Browser saves are untouched.</p>
    </header>
    <PixiPlayfield viewportRef={viewportRef} engine={engine} revision={revision} selectedIds={selectedIds} selectedConnection={selectedConnection}
      onDiagnostics={setRendererStats}
      minimumProgressBarPixels={emphasizeProgress ? 3 : 0}
      snapToGrid={false} showRecipeIcons={true} cameraFocus={cameraFocus}
      onSelect={setSelectedIds} onNodeContextMenu={id => setSelectedIds([id])} onCopyRecipe={() => false} onPlace={() => {}}
      onConnect={(from, to, fromPort, toPort, replace) => engine.connectPorts(from, fromPort, to, toPort, replace)}
      onConnectionRejected={failure => setMessage(`${failure.title}: ${failure.detail}`)} onConnectionSelect={setSelectedConnection}
      onDeleteConnection={id => engine.deleteConnection(id)} onDeleteNode={id => engine.deleteNodes([id])}
      onCycleInputPorts={id => engine.cycleNodeInputOrder(id)} onCycleOutputPorts={id => engine.cycleNodeOutputPosition(id)}
      onRotate={id => engine.rotateNode(id)} onConfigure={id => setSelectedIds([id])} onClonePlacement={() => {}}
      onCamera={camera => engine.setCamera(camera)} />
    <aside ref={helpRef} className="factory-test-help">
      <p>Scroll to zoom · Space + drag to pan · Click a node to inspect</p>
      <p>The current renderer shows up to {MAX_VISIBLE_TRANSFERS} transfer animations; the counter includes all physical cargo.</p>
      {selected && <p className="factory-test-selection" data-node-id={selected.id} data-x={selected.x} data-y={selected.y}>{selected.name}{selected.recipeId && ` · ${RECIPES[selected.recipeId]?.name}`} · Input {Object.values(selected.input).reduce<number>((sum, amount) => sum + (amount ?? 0), 0)} · Output {Object.values(selected.output).reduce<number>((sum, amount) => sum + (amount ?? 0), 0)}</p>}
      {message && <p role="status">{message} <button onClick={() => setMessage('')}>Dismiss</button></p>}
    </aside>
  </main>;
}

const root = createRoot(document.getElementById('root')!);
root.render(<ActiveFactory />);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
