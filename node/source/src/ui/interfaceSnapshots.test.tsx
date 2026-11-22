import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameState, MachineNode } from '../domain/types';
import { subscribeAutosaveWrites, writeAutosave } from '../persistence/autosave';
import { AUTOSAVE_KEY, readAutosave, SAVE_KEY } from '../persistence/saves';
import { createInitialState, GameEngine } from '../simulation/engine';
import { inventoryTotals, useInventoryTotals } from './useInventoryTotals';
import { observeAutosaveChanges } from './useAutosaveSnapshot';

let memory: Map<string, string>;
let getItem: ReturnType<typeof vi.fn>;
const disposers: Array<() => void> = [];
beforeEach(() => {
  memory = new Map();
  getItem = vi.fn((key: string) => memory.get(key) ?? null);
  vi.stubGlobal('localStorage', { getItem, setItem: (key: string, value: string) => memory.set(key, value) });
});
afterEach(() => { disposers.splice(0).forEach(dispose => dispose()); vi.unstubAllGlobals(); });
const stock = (id: string, input: MachineNode['input'], output: MachineNode['output']): MachineNode => ({
  id, kind: 'woodenChest', name: id, x: 1000, y: 1000, rotation: 0, input, output,
  progressMs: 0, cycleMs: 1000, constructedAt: 0, constructionMs: 0,
});
function InventoryProbe({ game, visible }: { game: GameState; visible: boolean }) {
  return <output>{JSON.stringify(useInventoryTotals(game, visible))}</output>;
}

describe('inventory visibility', () => {
  it('never touches sectors while its only consumer is hidden', () => {
    const game = createInitialState(204);
    Object.defineProperty(game, 'sectors', { get() { throw new Error('Hidden inventory scanned'); } });
    expect(renderToStaticMarkup(<InventoryProbe game={game} visible={false} />)).toBe('<output>{}</output>');
  });
  it('retains existing totals across all sector buffers without counting shared stock or reserves', () => {
    const game = createInitialState(204), home = game.sectors['5,5'];
    home.nodes = [stock('a', { iron: 2 }, { copper: 3, wood: undefined })];
    game.sectors['6,5'] = { ...structuredClone(home), id: '6,5', x: 6, unlocked: false,
      nodes: [stock('b', { copper: 4 }, { iron: 5 })] };
    game.globalPool = { iron: 900 };
    home.nodes[0].resourceRemaining = 123;
    const before = structuredClone(game);
    expect(inventoryTotals(game, true)).toEqual({ iron: 7, copper: 7, wood: 0 });
    expect(game).toEqual(before);
  });
});

function watching() {
  const host = new EventTarget();
  let snapshot = readAutosave();
  const refresh = vi.fn(() => { snapshot = readAutosave(); });
  const stop = observeAutosaveChanges(refresh, host as unknown as Window);
  disposers.push(stop);
  const storage = (key: string | null) => host.dispatchEvent(Object.assign(new Event('storage'), { key }));
  return { host, refresh, stop, storage, snapshot: () => snapshot };
}
describe('autosave snapshot invalidation', () => {
  it('does not read autosave during ordinary engine publications', () => {
    const engine = new GameEngine(createInitialState(204), { autosave: false });
    const view = watching(), reads = getItem.mock.calls.length;
    for (let i = 0; i < 20; i++) engine.updatePreferences({ snapToGrid: Boolean(i % 2) });
    expect(getItem).toHaveBeenCalledTimes(reads);
    expect(view.snapshot()).toBeNull();
  });
  it('updates after successful automatic writes and paused retry even when failure status does not change', () => {
    const engine = new GameEngine(createInitialState(204)), view = watching();
    engine.updatePreferences({ autosaveMinutes: 1 });
    for (let i = 0; i < 60; i++) engine.tick(1000);
    expect(view.snapshot()?.playTimeMs).toBe(60000);
    engine.togglePause();
    engine.renameSector('Paused saved factory', 'HME');
    expect(engine.retryAutosave()).toBe(true);
    expect(view.snapshot()?.sectorName).toBe('Paused saved factory');
    expect(engine.hasAutosaveFailure()).toBe(false);
  });
  it('retains the previous saved snapshot on a failed write and refreshes on recovery', () => {
    const engine = new GameEngine(createInitialState(204)), view = watching();
    engine.retryAutosave();
    const previous = view.snapshot(), reads = getItem.mock.calls.length;
    const setItem = vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new Error('Full'); });
    engine.renameSector('Later factory', 'HME');
    expect(engine.retryAutosave()).toBe(false);
    expect(view.snapshot()).toBe(previous);
    expect(getItem).toHaveBeenCalledTimes(reads);
    expect(engine.hasAutosaveFailure()).toBe(true);
    setItem.mockImplementation((key, value) => { memory.set(key, value); });
    expect(engine.retryAutosave()).toBe(true);
    expect(view.snapshot()?.sectorName).toBe('Later factory');
    expect(engine.hasAutosaveFailure()).toBe(false);
  });
  it('refreshes on external autosave replacement and clear, ignoring other storage keys', () => {
    const view = watching(), game = createInitialState(204), reads = getItem.mock.calls.length;
    game.sectors['5,5'].name = 'Other tab';
    memory.set(AUTOSAVE_KEY, JSON.stringify(game));
    view.storage(SAVE_KEY);
    expect(getItem).toHaveBeenCalledTimes(reads);
    view.storage(AUTOSAVE_KEY);
    expect(view.snapshot()?.sectorName).toBe('Other tab');
    memory.delete(AUTOSAVE_KEY); view.storage(null);
    expect(view.snapshot()).toBeNull();
  });
  it('handles malformed external data and focus-based storage recovery without throwing', () => {
    const view = watching();
    memory.set(AUTOSAVE_KEY, '{bad'); view.storage(AUTOSAVE_KEY);
    expect(view.snapshot()).toBeNull();
    const game = createInitialState(204); memory.set(AUTOSAVE_KEY, JSON.stringify(game));
    getItem.mockImplementation(() => { throw new Error('Storage blocked'); });
    expect(() => view.host.dispatchEvent(new Event('focus'))).not.toThrow();
    expect(view.snapshot()).toBeNull();
    getItem.mockImplementation((key: string) => memory.get(key) ?? null);
    view.host.dispatchEvent(new Event('focus'));
    expect(view.snapshot()).not.toBeNull();
  });
  it('rechecks once after subscribing to close the render-to-effect gap', () => {
    const host = new EventTarget(), game = createInitialState(204);
    let snapshot = readAutosave();
    writeAutosave(game);
    disposers.push(observeAutosaveChanges(() => { snapshot = readAutosave(); }, host as unknown as Window));
    expect(snapshot).not.toBeNull();
  });
  it('disposes write, storage and focus listeners and reads fresh when reopened', () => {
    const view = watching(); view.stop();
    const reads = getItem.mock.calls.length;
    writeAutosave(createInitialState(204)); view.storage(AUTOSAVE_KEY); view.host.dispatchEvent(new Event('focus'));
    expect(getItem).toHaveBeenCalledTimes(reads);
    expect(watching().snapshot()).not.toBeNull();
  });
  it('contains observer exceptions so successful writes do not report a persistence failure', () => {
    disposers.push(subscribeAutosaveWrites(() => { throw new Error('Observer failed'); }));
    const next = vi.fn(); disposers.push(subscribeAutosaveWrites(next));
    const engine = new GameEngine(createInitialState(204));
    expect(engine.retryAutosave()).toBe(true);
    expect(engine.hasAutosaveFailure()).toBe(false);
    expect(next).toHaveBeenCalledOnce();
    expect(memory.has(AUTOSAVE_KEY)).toBe(true);
  });
});
