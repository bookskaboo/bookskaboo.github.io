import { createInitialState } from '../../src/simulation/createInitialState';
import { generateSector } from '../../src/simulation/worldGeneration';
import { BORDER_SIDES, trySetBorder } from '../../src/domain/borderObstructionLayout';
import type { BorderObstruction, BorderSide, MapBorderLayout } from '../../src/domain/borderObstructionLayout';
import type { GameState } from '../../src/domain/types';

export interface BorderExample { from: string; to: string; kind: BorderObstruction }
/** Deliberate display samples, not a proposal for the generator's final distribution. */
export const MAP_BORDER_EXAMPLES: readonly BorderExample[] = [
  { from: '4,4', to: '5,4', kind: 'river' }, { from: '6,5', to: '7,5', kind: 'river' }, { from: '3,7', to: '3,8', kind: 'river' },
  { from: '7,3', to: '8,3', kind: 'mountain' }, { from: '2,5', to: '2,6', kind: 'mountain' }, { from: '7,7', to: '8,7', kind: 'mountain' },
  { from: '2,2', to: '3,2', kind: 'chasm' }, { from: '8,8', to: '8,9', kind: 'chasm' }, { from: '5,7', to: '5,8', kind: 'chasm' },
];
export function sideOfBorder(border: BorderExample, sectorId: string): BorderSide {
  const [x, y] = sectorId.split(',').map(Number), other = border.from === sectorId ? border.to : border.from;
  const [ox, oy] = other.split(',').map(Number);
  return ox > x ? 'east' : ox < x ? 'west' : oy > y ? 'south' : 'north';
}
export function bordersVisibleInMap(state: GameState) {
  return MAP_BORDER_EXAMPLES.filter(edge => state.sectors[edge.from]?.visited || state.sectors[edge.to]?.visited);
}
export function mapModalFixture(surveyed = true) {
  const state = createInitialState(37);
  state.research.completed = ['exploration', 'researchCenter', 'road'];
  state.research.unlocked = ['extractor', 'road', ...state.research.completed];
  state.research.mapPoints = 5;
  for (let y = 0; y < 11; y++) for (let x = 0; x < 11; x++) {
    const id = `${x},${y}`;
    const sector = state.sectors[id] ?? generateSector(x, y, state.seed, 0, state.research.completed, 5, 2, 11, 1, 2);
    state.sectors[id] = sector; sector.unlocked = true;
    sector.visited = surveyed || x >= 3 && x <= 7 && y >= 3 && y <= 7;
  }
  state.activeSectorId = '6,5';
  return state;
}
export function validateDisplayBorders() {
  const layouts = new Map<string, MapBorderLayout>();
  for (const border of MAP_BORDER_EXAMPLES) {
    const [x, y] = border.from.split(',').map(Number), [ox, oy] = border.to.split(',').map(Number);
    if (Math.abs(x - ox) + Math.abs(y - oy) !== 1) throw Error('Nonadjacent display border');
    for (const id of [border.from, border.to]) {
      const layout = layouts.get(id) ?? Object.fromEntries(BORDER_SIDES.map(side => [side, null])) as MapBorderLayout;
      const result = trySetBorder(layout, sideOfBorder(border, id), border.kind);
      if (!result.accepted) throw Error('Right angle in display fixture');
      layouts.set(id, result.layout);
    }
  }
  return layouts;
}
validateDisplayBorders();
