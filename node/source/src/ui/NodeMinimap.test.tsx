import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { worldCornerIds, WORLD_GRID_SIZES } from '../domain/worldGrid';
import { createInitialState, GameEngine } from '../simulation/engine';
import { generateMapTerrains } from '../simulation/mapTerrain';
import { NodeMinimap } from './NodeMinimap';

afterEach(() => vi.unstubAllGlobals());

describe('revealed corner emphasis', () => {
  it.each(WORLD_GRID_SIZES)('keeps all four corners glowing on the expanded %i-wide map after acknowledgement', size => {
    vi.stubGlobal('window', { innerWidth: 1280, innerHeight: 900 });
    const state = createInitialState(41);
    state.worldGridSize = size;
    state.mapTerrains = generateMapTerrains(state.seed, size);
    const engine = new GameEngine(state, { autosave: false });
    const game = engine.getState();
    const render = (expanded: boolean) => renderToStaticMarkup(<NodeMinimap game={game} engine={engine}
      expanded={expanded} persistLayout={false} onTravel={() => {}} onOpenMap={() => {}} onClose={() => {}} onHoverChange={() => {}} />);
    const glowing = (expanded: boolean) => (render(expanded).match(/class="[^"]*\bcorner-discovery-pending\b[^"]*"/g) ?? []).length;
    game.research.completed.push('complexCore');
    expect(glowing(true)).toBe(0);
    game.research.completed.push('finalCore');
    expect(glowing(true)).toBe(4);
    engine.acknowledgeCornerDiscovery();
    for (const id of worldCornerIds(size)) engine.acknowledgeCornerDiscovery(id);
    const before = JSON.stringify(game);
    expect(glowing(false)).toBe(0);
    expect(glowing(true)).toBe(4);
    expect(render(true)).not.toContain('Newly revealed corner');
    expect(glowing(false)).toBe(0);
    expect(glowing(true)).toBe(4);
    expect(JSON.stringify(game)).toBe(before);
  });
});
