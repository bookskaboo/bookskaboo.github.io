import { useRef, useState, type PointerEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { NODE_DEFINITIONS } from '../../src/content/nodes';
import { getNodeSize, getPortAnchor } from '../../src/domain/nodeGeometry';
import type { MachineNode } from '../../src/domain/types';
import { NodeIcon } from '../../src/ui/NodeIcon';
import { allowsContact, edgeTarget, FIELD, fixture, gapBetween, snap, stepFor, valid, type Layout, type Mode } from './model';
import '../../src/styles/readability.css';
import './preview.css';

const modes: { id: Mode; title: string; tag: string; copy: string }[] = [
  { id: 'current', title: 'Previous spacing', tag: '64-unit gap', copy: '64-unit grid · 12-unit clearance' },
  { id: 'contact', title: '64-unit contact', tag: 'Edges touch', copy: '64-unit grid · no body clearance' },
  { id: 'half', title: '32-unit contact', tag: 'Selected', copy: '32-unit grid · no body clearance' },
  { id: 'fine', title: 'Small gap', tag: '16-unit gap', copy: '16-unit snap · 12-unit clearance' },
];

function App() {
  const [mode, setMode] = useState<Mode>('half');
  const [layout, setLayout] = useState<Layout>('horizontal');
  const [nodes, setNodes] = useState(() => fixture('half', 'horizontal'));
  const [ghost, setGhost] = useState<MachineNode>();
  const [notice, setNotice] = useState('Drag the gold-outlined node, or use its arrow keys.');
  const [zoom, setZoom] = useState(1);
  const [grid, setGrid] = useState(true);
  const [sockets, setSockets] = useState(true);
  const [socketInfo, setSocketInfo] = useState<string[]>();
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ origin: MachineNode; x: number; y: number; desired: MachineNode } | undefined>(undefined);
  const shown = [nodes[0], ghost ?? nodes[1]];
  const gap = gapBetween(shown, layout);
  const allowed = valid(shown[1], nodes, mode);
  const current = modes.find(value => value.id === mode)!;

  function reset(nextMode = mode, nextLayout = layout) {
    setMode(nextMode); setLayout(nextLayout); setNodes(fixture(nextMode, nextLayout)); setGhost(undefined); setSocketInfo(undefined);
    setNotice('Drag the gold-outlined node, or use its arrow keys.');
  }
  function point(event: PointerEvent<SVGElement>) {
    const matrix = svg.current!.getScreenCTM()!;
    return new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
  }
  function commit(candidate: MachineNode) {
    if (valid(candidate, nodes, mode)) {
      setNodes([nodes[0], candidate]); setGhost(undefined); setSocketInfo(undefined);
      setNotice('Placement accepted. The factory has acquired a neighbor.');
    } else {
      setGhost(candidate); setSocketInfo(undefined);
      setNotice(allowsContact(mode) ? 'Blocked: bodies cannot overlap or cross the field boundary.' : 'Blocked: this position needs at least 12 units of clearance.');
    }
  }
  function touch() { commit(edgeTarget(nodes, layout)); }
  function start(event: PointerEvent<SVGGElement>) {
    if (event.button !== 0) return;
    const p = point(event); setGhost(undefined); setSocketInfo(undefined);
    drag.current = { origin: nodes[1], x: p.x, y: p.y, desired: nodes[1] };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus();
  }
  function move(event: PointerEvent<SVGGElement>) {
    const state = drag.current;
    if (!state) return;
    const p = point(event);
    state.desired = snap(state.origin, { x: state.origin.x + p.x - state.x, y: state.origin.y + p.y - state.y }, mode);
    setGhost(state.desired);
  }
  function finish() {
    if (!drag.current) return;
    commit(drag.current.desired); drag.current = undefined;
  }

  function socketChoices(node: MachineNode, direction: 'input' | 'output', index: number) {
    const p = getPortAnchor(node, direction, index), choices: string[] = [];
    for (const other of shown) for (const dir of ['input', 'output'] as const) {
      NODE_DEFINITIONS[other.kind][dir].forEach((family, i) => {
        const q = getPortAnchor(other, dir, i);
        if (Math.hypot(other.x + q.x - node.x - p.x, other.y + q.y - node.y - p.y) < 24)
          choices.push(`${NODE_DEFINITIONS[other.kind].name} ${dir} ${i + 1} · ${family}`);
      });
    }
    setSocketInfo(choices);
  }

  function drawNode(node: MachineNode, movable: boolean) {
    const size = getNodeSize(node), definition = NODE_DEFINITIONS[node.kind];
    const w = size.w, h = size.h, compact = w === 128;
    return <g key={node.id} transform={`translate(${node.x},${node.y})`} className={movable ? 'movable' : ''}
      tabIndex={movable ? 0 : undefined} role={movable ? 'button' : undefined}
      aria-label={movable ? `Move ${definition.name}. Use arrow keys to snap by ${stepFor(mode)} units.` : undefined}
      onPointerDown={movable ? start : undefined} onPointerMove={movable ? move : undefined}
      onPointerUp={movable ? finish : undefined} onPointerCancel={() => { drag.current = undefined; setGhost(undefined); }}
      onKeyDown={event => {
        const delta: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
        if (event.key === 'Escape') { setGhost(undefined); return; }
        const d = delta[event.key]; if (!d) return;
        event.preventDefault(); const base = ghost ?? node;
        commit(snap(base, { x: base.x + d[0] * stepFor(mode), y: base.y + d[1] * stepFor(mode) }, mode));
      }}>
      <rect x={-w / 2 + 1} y={-h / 2 + 8} width={w} height={h} rx={12} fill="#000" opacity=".42" />
      <rect className="node-body" x={-w / 2} y={-h / 2} width={w} height={h} rx={compact ? 9 : 12}
        fill="#25282d" stroke={movable ? allowed ? '#e0b85c' : '#ef6f75' : '#070809'} strokeWidth={movable ? 3 : 1.25} />
      <rect x={-w / 2 + 2} y={-h / 2 + 2} width={w - 4} height={compact ? 39 : 58} rx="10" fill="#30343a" />
      <path d={`M${-w / 2 + 10},${-h / 2} h${w - 20}`} stroke={definition.accentCss} strokeWidth="3" />
      <text x={-w / 2 + 16} y={-h / 2 + 28} className="node-title">{definition.name}</text>
      <foreignObject x={-27} y={compact ? -6 : 0} width="54" height="54"><div className="specimen-icon"><NodeIcon kind={node.kind} /></div></foreignObject>
      {!compact && <><text x="0" y={h / 2 - 45} textAnchor="middle" className="node-caption">Waiting for materials</text>
        <rect x={-w / 2 + 20} y={h / 2 - 26} width={w - 40} height="8" rx="4" fill="#181a1d" /></>}
      {sockets && (['input', 'output'] as const).flatMap(direction => definition[direction].map((family, index) => {
        const p = getPortAnchor(node, direction, index);
        return <g key={`${direction}-${index}`} className="port" role="button" tabIndex={0}
          aria-label={`${definition.name} ${direction} ${index + 1}, ${family}`}
          onPointerDown={event => event.stopPropagation()}
          onClick={event => { event.stopPropagation(); socketChoices(node, direction, index); }}
          onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.stopPropagation(); event.preventDefault(); socketChoices(node, direction, index); } }}>
          <circle cx={p.x} cy={p.y} r="15" fill="transparent" />
          <circle cx={p.x} cy={p.y} r="7" fill="#181a1d" stroke={direction === 'input' ? '#aab4bf' : '#83caff'} strokeWidth="2.5" />
          {!compact && <text x={p.x + (direction === 'input' ? 17 : -17)} y={p.y + 5} textAnchor={direction === 'input' ? 'start' : 'end'} className="port-label">{family}</text>}
        </g>;
      }))}
    </g>;
  }

  const a = shown[0], b = shown[1], sa = getNodeSize(a), sb = getNodeSize(b);
  const vertical = layout === 'vertical';
  const measure = vertical ? { x1: a.x + sa.w / 2 + 42, x2: a.x + sa.w / 2 + 42, y1: a.y + sa.h / 2, y2: b.y - sb.h / 2 }
    : { x1: a.x + sa.w / 2, x2: b.x - sb.w / 2, y1: a.y - sa.h / 2 - 30, y2: a.y - sa.h / 2 - 30 };

  return <main>
    <header className="page-header"><div><span className="eyebrow">NODE / layout study</span><h1>Let the nodes touch.</h1>
      <p>A closer factory. The neighbors were inevitable.</p></div><span className="prototype-label">Local test page · simulated layout</span></header>
    <div className="mode-options" aria-label="Spacing proposals">
      {modes.map(option => <button key={option.id} className={`mode-option ${option.id === mode ? 'active' : ''}`}
        aria-pressed={option.id === mode} onClick={() => reset(option.id)}><span className="option-heading">{option.title}<span className="tag">{option.tag}</span></span><small>{option.copy}</small></button>)}
    </div>
    <div className="workspace">
      <section className="playground" aria-label="Interactive node spacing preview">
        <div className="toolbar"><div className="arrangements" aria-label="Arrangement">
          {(['horizontal', 'vertical', 'mixed'] as Layout[]).map(value => <button key={value} aria-pressed={layout === value} onClick={() => reset(mode, value)}>{value === 'mixed' ? 'Mixed sizes' : value === 'vertical' ? 'Stacked' : 'Side by side'}</button>)}
        </div><label className="zoom-label">Zoom <select aria-label="Zoom" value={zoom} onChange={event => setZoom(Number(event.target.value))}>
          <option value={0.7}>70%</option><option value={1}>100%</option><option value={1.35}>135%</option></select></label></div>
        <svg ref={svg} className="field" viewBox={`${576 - FIELD.width / zoom / 2} ${384 - FIELD.height / zoom / 2} ${FIELD.width / zoom} ${FIELD.height / zoom}`} aria-label="Two nodes on the world grid">
          <defs><pattern id="world-grid" width={mode === 'half' ? 32 : 64} height={mode === 'half' ? 32 : 64} patternUnits="userSpaceOnUse"><path d={mode === 'half' ? 'M32 0H0V32' : 'M64 0H0V64'} fill="none" stroke="#ffffff" strokeOpacity=".10" /></pattern>
            <pattern id="fine-grid" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="0" cy="0" r="1" fill="#9cb4bc" opacity=".34" /></pattern></defs>
          <rect width={FIELD.width} height={FIELD.height} fill="#1e2024" />
          {grid && <rect width={FIELD.width} height={FIELD.height} fill="url(#world-grid)" />}
          {grid && mode === 'fine' && <rect width={FIELD.width} height={FIELD.height} fill="url(#fine-grid)" />}
          <line {...measure} stroke={allowed ? '#91cbb6' : '#ef6f75'} strokeWidth="2" />
          <text x={vertical ? measure.x1 + 15 : (measure.x1 + measure.x2) / 2} y={vertical ? (measure.y1 + measure.y2) / 2 : measure.y1 - 13}
            textAnchor={vertical ? 'start' : 'middle'} className="measurement">{gap === 0 ? 'Edges touch' : `${gap} units`}</text>
          {nodes.map((_, index) => drawNode(shown[index], index === 1))}
          <text x="256" y="738" className="grid-caption">{stepFor(mode)}-unit snapping · actual game body sizes</text>
        </svg>
        <div className={`feedback ${allowed ? '' : 'blocked'}`} role="status"><strong>{allowed ? gap === 0 ? 'Touching · valid placement' : 'Valid placement' : 'Placement blocked'}</strong><span>{notice}</span></div>
      </section>
      <aside>
        <section className="detail"><span className="eyebrow">Selected proposal</span><h2>{current.title}</h2>
          <p>{mode === 'half' ? 'Use a 32-unit grid for finer positioning. Let rectangular node bodies touch, while still rejecting overlap.' : mode === 'contact' ? 'Use the previous 64-unit grid. Let rectangular node bodies meet edge to edge, while still rejecting overlap.' : mode === 'fine' ? 'Keep the former clearance rule. Add 16-unit snap points so the smallest gap is 16 units instead of 64.' : 'The previous grid matched node sizes. Its extra 12-unit collision buffer rejected edge contact, forcing a 64-unit gap.'}</p>
          <dl><div><dt>Snap step</dt><dd>{stepFor(mode)} units</dd></div><div><dt>Body clearance</dt><dd>{allowsContact(mode) ? 0 : 12} units</dd></div><div><dt>Shown edge gap</dt><dd>{gap} units</dd></div></dl>
          <div className="actions"><button className="primary" onClick={touch}>Try touching edges</button><button onClick={() => reset()}>Reset layout</button></div>
          <label className="check"><input type="checkbox" checked={grid} onChange={event => setGrid(event.target.checked)} />Show grid</label>
          <label className="check"><input type="checkbox" checked={sockets} onChange={event => setSockets(event.target.checked)} />Show sockets</label>
        </section>
        <section className="detail rationale"><h2>Selected behavior</h2><p>Use a 32-unit grid and allow body contact for player-built nodes. Retain clearance around natural obstacles and the field boundary.</p>
          <p>Touching sockets need a choice of node and direction when both occupy the same point. Click a socket to inspect that proposal.</p>
          <small>Spacing prototype: game dimensions, socket anchors and collision checks; simplified node rendering. No production, wiring or save data.</small></section>
      </aside>
    </div>
    {socketInfo && <div className="socket-backdrop" onClick={() => setSocketInfo(undefined)}><section className="socket-dialog" role="dialog" aria-modal="true" aria-label="Socket inspection" onClick={event => event.stopPropagation()}>
      <h2>{socketInfo.length > 1 ? 'Sockets share this spot' : 'Socket inspection'}</h2><p>{socketInfo.length > 1 ? 'Proposed wiring behavior: choose the intended socket before connecting.' : 'This socket has a separate hit target.'}</p>
      <ul>{socketInfo.map(value => <li key={value}>{value}</li>)}</ul><small>This inspects the proposed choices. Connections are not simulated.</small><button autoFocus onClick={() => setSocketInfo(undefined)} onKeyDown={event => { if (event.key === 'Escape') setSocketInfo(undefined); }}>Close</button>
    </section></div>}
    <footer>The local game now uses 32-unit snapping and allows body contact. This page remains a simulated comparison.</footer>
  </main>;
}

createRoot(document.getElementById('root')!).render(<App />);
