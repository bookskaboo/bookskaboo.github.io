import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createInitialState } from '../simulation/createInitialState';
import { MapBorderMarkers, mapBorderPointsOfInterest, discoveredBorderObstructions } from './MapBorderObstructions';
import { borderSide, SIDE_LABELS } from '../domain/borderObstructionLayout';

describe('map border discovery and summary', () => {
  it('hides unknown edges, reveals from either end, and keeps terrain after research without requirement text', () => {
    const state = createInitialState(37), edge = state.borderObstructions![0];
    expect(discoveredBorderObstructions(state)).toEqual([]);
    const home = state.sectors['5,5'];
    state.sectors[edge.from] = { ...home, id: edge.from, visited: true };
    expect(discoveredBorderObstructions(state)).toContainEqual(edge);
    const before = renderToStaticMarkup(<MapBorderMarkers game={state} />);
    expect(before).toContain('role="img"'); expect(before).not.toMatch(/requires|research|permission|Complex|Hydro|Shiny/);
    state.research.completed.push('riverBridges', 'mountainTunnels', 'chasmSpans');
    expect(renderToStaticMarkup(<MapBorderMarkers game={state} />)).toContain('crossable');
    for (const id of [edge.from, edge.to]) {
      const text = mapBorderPointsOfInterest(state,id).map(row=>row.name).join(' ');
      expect(text).toContain(SIDE_LABELS[borderSide(id, id === edge.from ? edge.to : edge.from)]);
      expect(text).not.toMatch(/requires|research|permission|Complex|Hydro|Shiny/);
    }
    state.sectors[edge.from].visited = false;
    expect(discoveredBorderObstructions(state)).toEqual([]);
    expect(mapBorderPointsOfInterest(state,edge.to)).toEqual([]);
  });
});
