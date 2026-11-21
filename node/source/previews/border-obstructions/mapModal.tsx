import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';
import { NodeMinimap } from '../../src/ui/NodeMinimap';
import { UiTooltipLayer } from '../../src/ui/components/UiTooltipLayer';
import { GameEngine } from '../../src/simulation/engine';
import { mapNodePosition } from '../../src/domain/worldGrid';
import { SIDE_LABELS } from '../../src/domain/borderObstructionLayout';
import { BORDER_ART } from '../../src/art/borderObstructionArt';
import { bordersVisibleInMap, mapModalFixture, sideOfBorder } from './mapModalModel';
import type { BorderObstruction } from '../../src/domain/borderObstructionLayout';
import '../../src/styles.css';
import './mapModal.css';

const iconPaths: Record<BorderObstruction, string> = {
  river: 'M3 1Q7 5 3 9T3 17Q7 21 3 25 M7 1Q11 5 7 9T7 17Q11 21 7 25',
  mountain: 'M1 25L5 17L9 25M1 17L5 9L9 17M1 9L5 1L9 9',
  chasm: 'M3 0L1 5L4 9L2 14L4 19L1 26 M8 0L6 5L9 9L7 14L9 19L6 26',
};
const icons = (kind: BorderObstruction, horizontal = false) => horizontal && kind === 'mountain'
  ? <svg viewBox="0 0 26 10" aria-hidden="true" className="border-symbol mountain-flat"><path d="M1 9L5 1L9 9M9 9L13 1L17 9M17 9L21 1L25 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
  : <svg viewBox="0 0 10 26" aria-hidden="true" className={horizontal ? 'border-symbol horizontal' : 'border-symbol'}><path d={iconPaths[kind]} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const tierIndex = { river: 1, mountain: 2, chasm: 3 };
function Preview() {
  const hostRef = useRef<HTMLElement>(null), toolbarRef = useRef<HTMLElement>(null);
  const [engine] = useState(() => new GameEngine(mapModalFixture(), { autosave: false }));
  const [, setRevision] = useState(0), [open, setOpen] = useState(true), [surveyed, setSurveyed] = useState(true), [tier, setTier] = useState(0);
  useEffect(() => engine.subscribe(() => setRevision(n => n + 1)), [engine]);
  useLayoutEffect(() => { const update = () => hostRef.current?.style.setProperty('--border-map-toolbar-height', `${toolbarRef.current!.getBoundingClientRect().height}px`); const observer = new ResizeObserver(update); observer.observe(toolbarRef.current!); update(); return () => observer.disconnect(); }, []);
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, []);
  const game = engine.getState(), borders = bordersVisibleInMap(game);
  const reveal = (all: boolean) => { setSurveyed(all); engine.replaceState(mapModalFixture(all)); };
  const overlay = borders.map(border => {
    const [x, y] = border.from.split(',').map(Number), [ox, oy] = border.to.split(',').map(Number);
    const horizontal = x === ox, art = BORDER_ART.find(a => a.id === border.kind)!;
    const description = `${art.name === 'Chasms' ? 'Chasm' : art.name === 'Mountains' ? 'Mountain' : 'River'} · ${mapNodePosition(x, y)} / ${mapNodePosition(ox, oy)}`;
    return <span key={`${border.from}:${border.to}`} role="img" aria-label={description} className={`border-map-marker ${horizontal ? 'across' : 'upright'} ${tier >= tierIndex[border.kind] ? 'crossable' : ''}`}
      style={{ gridColumn: `${Math.min(x, ox) + 1} / ${Math.max(x, ox) + 2}`, gridRow: `${Math.min(y, oy) + 1} / ${Math.max(y, oy) + 2}`, '--border-color': art.color } as CSSProperties}
      data-tooltip={description}>{icons(border.kind, horizontal)}</span>;
  });
  return <main ref={hostRef} className="border-map-test"><header ref={toolbarRef} className="border-map-test-toolbar"><div><h1>Border obstructions in the Node Map</h1><p>Display samples · presentation reference · browser saves untouched</p></div><div className="border-map-test-controls"><label>Crossing research<select value={tier} onChange={event => setTier(Number(event.target.value))}><option value={0}>None</option><option value={1}>Hydro</option><option value={2}>Shiny</option><option value={3}>Complex</option></select></label><label><input type="checkbox" checked={surveyed} onChange={event => reveal(event.target.checked)} /> Surveyed map</label><button onClick={() => setOpen(true)}>Open Node Map</button><a href="./index.html">Play area study</a></div><div className="border-map-legend">{BORDER_ART.map(art => <span key={art.id} style={{ color: art.color }}>{icons(art.id)}{art.name} · {art.tier}</span>)}<span>3 examples of each type</span></div></header>
  {open && <NodeMinimap expanded game={game} engine={engine} persistLayout={false} mapOverlay={overlay} onHoverChange={() => {}} onTravel={id => engine.switchSector(id)} onOpenMap={() => setOpen(true)} onClose={() => setOpen(false)} sectorPointsOfInterest={id => {
    const edges = borders.filter(edge => edge.from === id || edge.to === id);
    return edges.map(edge => ({ name: `${SIDE_LABELS[sideOfBorder(edge, id)]} · ${edge.kind === 'river' ? 'River' : edge.kind === 'mountain' ? 'Mountain' : 'Chasm'}` }));
  }} />}
  <UiTooltipLayer /></main>;
}
const root = createRoot(document.getElementById('root')!); root.render(<Preview />);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
