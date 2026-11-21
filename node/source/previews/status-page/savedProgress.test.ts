import { describe, expect, it } from 'vitest';
import { CORE_RESEARCH } from '../../src/content/coreResearch';
import { isRecipeUnlocked } from '../../src/content/recipes';
import { normalizeLegacy } from '../../src/persistence/saves';
import { createInitialState, GameEngine } from '../../src/simulation/engine';
import { BOT_UPGRADES, characterStage, installBotUpgradeProposal, nextBotUpgrade } from './model';
import { restoreStatusFactory, savedProgressExample } from './savedProgress';

installBotUpgradeProposal();

describe('explicit transition of saved research to character upgrades', () => {
  it.each(CORE_RESEARCH.slice(1).map((core, index) => [core.id, core.item, index + 1] as const))(
    'retains earned %s access and derives the preceding character tier', (id, item, tier) => {
      const old = createInitialState(204);
      old.research.completed = [id];
      old.research.unlocked = ['extractor', id];
      const snapshot = structuredClone(old);
      const migrated = restoreStatusFactory(JSON.parse(JSON.stringify(old)))!;
      expect(characterStage(migrated)).toBe(tier);
      expect(nextBotUpgrade(migrated)?.id).toBe(BOT_UPGRADES[tier].id);
      expect(isRecipeUnlocked(item, migrated.research.completed)).toBe(true);
      expect(BOT_UPGRADES.slice(0, tier).every(upgrade => migrated.research.completed.includes(upgrade.id))).toBe(true);
      expect(migrated.research.completed).not.toContain('finalBotUpgrade');
      expect(old).toEqual(snapshot);
      expect(restoreStatusFactory(migrated)).toEqual(migrated);
    });

  it('keeps active and parked payments, priority, queue, pauses, stock and partial cycles', () => {
    const original = savedProgressExample().getState();
    const source = structuredClone(original);
    const restored = new GameEngine(restoreStatusFactory(JSON.parse(JSON.stringify(original)))!, { autosave: false });
    const loaded = restored.getState();
    expect(loaded.research).toEqual(source.research);
    expect(loaded.sectors).toEqual(source.sectors);
    expect(loaded.paused).toBe(true);
    expect(loaded.research.contributed).toEqual({ 'simple-core': 2, 'basic-core': 2, 'automata-core': 2 });
    expect(loaded.research.projectContributions?.extractor2).toEqual({ 'simple-core': 3 });
    restored.releasePriorityResearch('hydroCore');
    expect(loaded.research.queue).toEqual(['extractor2', 'kiln2']);
    expect(loaded.research.selected).toBeUndefined();
    expect(loaded.research.paused).toBe(true);
    expect(loaded.research.projectContributions?.hydroCore).toEqual(source.research.contributed);
    restored.setResearchPaused(false);
    expect(loaded.research.selected).toBe('extractor2');
    expect(loaded.research.contributed).toEqual({ 'simple-core': 3 });
    expect(original).toEqual(source);
  });

  it('uses existing pre-project migration and adopts character milestones on ordinary loading', () => {
    const old = createInitialState(204);
    delete old.coreResearchVersion;
    old.research.completed = ['refiner', 'assembler', 'cornerComponents'];
    const normal = normalizeLegacy(old)!;
    expect(normal.research.completed).toContain('finalCore');
    expect(normal.research.completed).toContain('automataCore');
    const migrated = restoreStatusFactory(old)!;
    expect(characterStage(migrated)).toBe(6);
    expect(migrated.research.completed).toContain('automataCore');
    expect(migrated.research.completed).toContain('cornerComponents');
    expect(migrated.research.completed).not.toContain('finalBotUpgrade');
  });

  it('finishes a migrated upgrade from its remaining bill without charging paid Cores again', () => {
    const engine = savedProgressExample();
    const state = engine.getState();
    state.paused = false;
    engine.setResearchPaused(false);
    for (let index = 0; index < 137; index++) engine.tick(100);
    expect(state.research.completed).not.toContain('hydroCore');
    engine.tick(100);
    expect(state.research.completed).toContain('hydroCore');
    expect(characterStage(state)).toBe(3);
    expect(state.sectors['5,5'].nodes[0].input).toEqual({ 'simple-core': 0, 'basic-core': 0, 'automata-core': 0 });
    expect(state.research.selected).toBe('extractor2');
    expect(state.research.contributed).toEqual({ 'simple-core': 3 });
  });

  it('does not promote historical Simple discovery or victory to new paid character completion', () => {
    const old = createInitialState(204);
    old.research.completed = ['simpleCore', 'victory'];
    expect(characterStage(restoreStatusFactory(old)!)).toBe(0);
    old.research.completed.push(...CORE_RESEARCH.slice(1).map(core => core.id));
    expect(characterStage(restoreStatusFactory(old)!)).toBe(6);
    old.research.completed.push('finalBotUpgrade');
    expect(characterStage(restoreStatusFactory(old)!)).toBe(7);
  });

  it('converts map quotes to banked-point bills while preserving their price and saved points', () => {
    const old = createInitialState(204);
    delete old.mapResearchMode;
    old.research.mapNodeQuote = { completion: 2, destination: '4,5', costs: { 'simple-core': 12 } };
    old.research.mapPoints = 2;
    const migrated = restoreStatusFactory(old)!;
    expect(migrated.mapResearchMode).toBe('points');
    expect(migrated.research.mapNodeQuote).toEqual({ completion: 2, costs: { 'simple-core': 12 } });
    expect(old.mapResearchMode).toBeUndefined();
    expect(old.research.mapNodeQuote.destination).toBe('4,5');
    expect(migrated.research.mapPoints).toBe(2);
    expect(restoreStatusFactory({})).toBeNull();
  });
});
