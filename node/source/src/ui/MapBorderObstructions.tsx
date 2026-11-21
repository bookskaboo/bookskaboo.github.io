import type { CSSProperties } from 'react';
import { BORDER_CROSSING_RESEARCH, BORDER_NAMES, SIDE_LABELS, borderSide, sectorBorderObstructions, type BorderObstruction } from '../domain/borderObstructionLayout';
import type { GameState } from '../domain/types';
import { mapNodePosition, worldGridBounds, worldGridSize } from '../domain/worldGrid';
import { BORDER_ART } from '../art/borderObstructionArt';
import './mapBorderObstructions.css';

const paths: Record<BorderObstruction, string> = {
  river: 'M3 1Q7 5 3 9T3 17Q7 21 3 25 M7 1Q11 5 7 9T7 17Q11 21 7 25',
  mountain: 'M1 25L5 17L9 25M1 17L5 9L9 17M1 9L5 1L9 9',
  chasm: 'M3 0L1 5L4 9L2 14L4 19L1 26 M8 0L6 5L9 9L7 14L9 19L6 26',
};
function BorderSymbol({ kind, horizontal = false }: { kind: BorderObstruction; horizontal?: boolean }) {
  const flat = horizontal && kind === 'mountain';
  return <svg viewBox={flat ? '0 0 26 10' : '0 0 10 26'} aria-hidden="true" className={`border-symbol ${flat ? 'mountain-flat' : horizontal ? 'horizontal' : ''}`}><path d={flat ? 'M1 9L5 1L9 9M9 9L13 1L17 9M17 9L21 1L25 9' : paths[kind]} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
export function discoveredBorderObstructions(game: GameState) {
  return game.borderObstructionVersion === 1 ? (game.borderObstructions ?? []).filter(edge => game.sectors[edge.from]?.visited || game.sectors[edge.to]?.visited) : [];
}
export function MapBorderMarkers({ game }: { game: GameState }) {
  const { min } = worldGridBounds(worldGridSize(game));
  return discoveredBorderObstructions(game).map(edge => {
    const [x, y] = edge.from.split(',').map(Number), [ox, oy] = edge.to.split(',').map(Number), horizontal = x === ox;
    const description = `${BORDER_NAMES[edge.kind]} · ${mapNodePosition(x, y)} / ${mapNodePosition(ox, oy)}`;
    return <span key={`${edge.from}:${edge.to}`} role="img" aria-label={description} data-tooltip={description}
      className={`border-map-marker ${horizontal ? 'across' : 'upright'} ${game.research.completed.includes(BORDER_CROSSING_RESEARCH[edge.kind]) ? 'crossable' : ''}`}
      style={{ gridColumn: `${Math.min(x, ox) - min + 1} / ${Math.max(x, ox) - min + 2}`, gridRow: `${Math.min(y, oy) - min + 1} / ${Math.max(y, oy) - min + 2}`, '--border-color': BORDER_ART.find(art => art.id === edge.kind)!.color } as CSSProperties}><BorderSymbol kind={edge.kind} horizontal={horizontal} /></span>;
  });
}
export function MapBorderSummary({ game, id }: { game: GameState; id: string }) {
  if (game.borderObstructionVersion !== 1) return null;
  const edges = sectorBorderObstructions(game, id).filter(edge => game.sectors[edge.from]?.visited || game.sectors[edge.to]?.visited);
  if (!edges.length && !game.sectors[id]?.visited) return null;
  return <section className="map-survey-list border-map-details" aria-label="Border obstructions"><h3>Border obstructions</h3>{edges.length ? <ul>{edges.map(edge => <li key={`${edge.from}:${edge.to}`}><BorderSymbol kind={edge.kind} /><span>{SIDE_LABELS[borderSide(id, edge.from === id ? edge.to : edge.from)]} · {BORDER_NAMES[edge.kind]}</span></li>)}</ul> : <p>No border obstructions.</p>}</section>;
}
