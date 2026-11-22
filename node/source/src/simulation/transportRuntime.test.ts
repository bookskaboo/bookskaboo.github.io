import { afterEach, describe, expect, it } from 'vitest';
import { activateMod } from '../mods/modContent';
import { emptyMod } from '../mods/modTypes';
import { tutorialNode } from '../tutorials/tutorialRuntime';
import { createInitialState, GameEngine } from './engine';

function setup() {
  const state = createInitialState(301);
  state.isTraining = true;
  state.paused = false;
  const home = state.sectors[state.activeSectorId];
  home.nodes = []; home.connections = [];
  const engine = new GameEngine(state, { autosave: false });
  const sector = engine.getSector();
  const source = tutorialNode('warehouse', 'source', 800, 600, {
    constructionMs: 0, output: { iron: 2, copper: 1 }, outputQueue: ['iron', 'copper', 'iron'],
  });
  const target = tutorialNode('warehouse', 'target', 1600, 600, { constructionMs: 0 });
  sector.nodes.push(source, target);
  sector.connections.push({ id: 'send', from: source.id, to: target.id, fromPort: 0, toPort: 0, createdAt: 0 });
  return { engine, source, target, sector };
}

afterEach(() => activateMod());

describe('transport state lifecycle through the engine facade', () => {
  it('delivers loaded cargo and launches on inactive maps using replacement state only', () => {
    const { engine } = setup();
    engine.tick(400);
    const old = engine.getState(), oldSnapshot = structuredClone(old);
    const replacement = setup();
    replacement.engine.tick(400);
    const state = replacement.engine.getState();
    const remote = structuredClone(replacement.sector);
    remote.id = '6,5'; remote.x = 6; remote.unlocked = true;
    state.sectors[remote.id] = remote;
    state.activeSectorId = remote.id;
    engine.replaceState(state);
    engine.tick(1000);
    const current = engine.getState();
    const homeTarget = current.sectors[replacement.sector.id].nodes.find(n => n.id === 'target')!;
    expect(homeTarget.outputQueue).toEqual(['iron']);
    expect(current.inFlightTransfers?.filter(t => !t.cosmeticOnly).map(t => [t.sectorId, t.item])).toEqual([
      [replacement.sector.id, 'copper'], [remote.id, 'copper'],
    ]);
    expect(old).toEqual(oldSnapshot);
    expect(state.playTimeMs).toBe(400); // The caller's replacement snapshot was cloned.
  });

  it('restores canceled FIFO cargo with Undo and then delivers the restored transfers', () => {
    const { engine, source } = setup();
    engine.tick(400); engine.tick(400);
    expect(engine.getState().inFlightTransfers?.map(t => t.item)).toEqual(['iron', 'copper']);
    expect(engine.deleteConnection('send')).toBeUndefined();
    expect(engine.getState().inFlightTransfers).toEqual([]);
    expect(source.outputQueue).toEqual(['iron', 'copper', 'iron']);
    engine.undo();
    const restored = engine.getSector().nodes.find(n => n.id === source.id)!;
    expect(restored).not.toBe(source);
    expect(restored.outputQueue).toEqual(['iron']);
    engine.tick(1000);
    const target = engine.getSector().nodes.find(n => n.id === 'target')!;
    expect(target.outputQueue).toEqual(['iron', 'copper']);
    expect(engine.getState().inFlightTransfers?.map(t => t.item)).toEqual(['iron']);
    expect(source.outputQueue).toEqual(['iron', 'copper', 'iron']);
  });

  it('uses current mod timing for new launches while retaining paid cargo deadlines through Undo', () => {
    const { engine } = setup();
    engine.tick(400);
    expect(engine.getState().inFlightTransfers?.map(t => t.arrivesAtMs)).toEqual([1400]);
    const mod = emptyMod();
    mod.rules = { cableLaunchMs: 100, cableTravelMs: 300 };
    engine.applyMod(mod);
    engine.tick(100);
    expect(engine.getState().inFlightTransfers?.map(t => t.arrivesAtMs)).toEqual([1400, 800]);
    engine.undo();
    expect(engine.getState().mod).toBeUndefined();
    expect(engine.getState().inFlightTransfers?.map(t => t.arrivesAtMs)).toEqual([1400]);
    engine.tick(400);
    expect(engine.getState().inFlightTransfers?.map(t => t.arrivesAtMs)).toEqual([1400, 1800]);
  });
});
