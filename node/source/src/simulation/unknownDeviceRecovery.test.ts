import { describe, expect, it } from 'vitest';
import type { GameState, MachineNode } from '../domain/types';
import { CORE_ITEMS } from '../content/landmarks';
import { CORE_RESEARCH } from '../content/coreResearch';
import { getResearchCostsForState, getResearchProject } from '../content/research';
import { RECIPES } from '../content/recipes';
import { createInitialState } from './engine';
import { applyExpansionRescue, nextExpansionShortages } from './expansionRescue';
import { simulateUnknownDevice } from './landmarkRuntime';
import { takeOutput } from './mixedOutput';
import { progressionDeficits } from './progressionRecovery';
import { sectorForState } from './worldGeneration';

function fixture() {
  const state = createInitialState(81);
  state.research.completed = ['kiln', 'smelter', 'refiner', 'assembler', 'basicCore', 'exploration', 'road'];
  state.research.unlocked = [...state.research.completed];
  const destination = state.landmarkLayout!.find(entry => entry.sector.nodes.some(node => node.landmark === 'unknown'))!.sector;
  let x = 5, y = 5;
  const open = () => {
    const sector = sectorForState(state, x, y);
    sector.unlocked = true; sector.visited = true; state.sectors[sector.id] = sector;
  };
  while (x !== destination.x) { x += Math.sign(destination.x - x); open(); }
  while (y !== destination.y) { y += Math.sign(destination.y - y); open(); }
  (state.research.repeatableCompletions ??= {}).mapNode = Object.keys(state.sectors).length - 1;
  for (const sector of Object.values(state.sectors)) for (const node of sector.nodes) if (node.resourceItem) node.resourceRemaining = 0;
  const sector = state.sectors[destination.id];
  const device = sector.nodes.find(node => node.landmark === 'unknown')!;
  const bank: MachineNode = { id: 'seed-bank', kind: 'warehouse', name: 'Seed bank', x: 1000, y: 1000,
    rotation: 0, input: {}, output: {}, progressMs: 0, cycleMs: 1000, constructedAt: 0, constructionMs: 0 };
  sector.nodes.push(bank);
  return { state, sector, device, bank };
}
const quote = (state: GameState) => getResearchCostsForState(getResearchProject('mapNode')!, state.research);
const completeCoreAccess = (state: GameState) => state.research.completed.push(...CORE_RESEARCH.map(core => core.id));

describe('Unknown Device recovery budgets', () => {
  it('does not grant the audited false Copper rescue or mutate the factory while planning', () => {
    const { state, bank } = fixture(); bank.output['simple-core'] = 1;
    expect(quote(state)).toEqual({ 'simple-core': 5 });
    const before = structuredClone(state);
    expect(progressionDeficits(state, 'mapNode', quote(state))).toEqual({});
    expect(nextExpansionShortages(state)).toEqual([]);
    expect(applyExpansionRescue(state)).toBe(false);
    expect(state).toEqual(before);
  });
  it.each(CORE_ITEMS)('uses an owned %s seed only for its repeatable tier', core => {
    const { state, bank } = fixture(); completeCoreAccess(state); bank.output[core] = 1;
    expect(progressionDeficits(state, 'mapNode', { [core]: 100 })).toEqual({});
    expect(bank.output[core]).toBe(1);
  });
  it.each(CORE_ITEMS)('includes a paid active %s after it leaves the waiting buffer', core => {
    const { state, device } = fixture(); completeCoreAccess(state);
    device.activeCore = core; device.progressMs = 2500;
    const before = structuredClone(device);
    expect(progressionDeficits(state, 'mapNode', { [core]: 100 })).toEqual({});
    expect(device).toEqual(before);
  });
  it.each(['locked sector', 'absent device'] as const)('does not use a device in a %s, even with a seed and saved layout', unavailable => {
    const { state, bank, sector, device } = fixture(); bank.output['simple-core'] = 1;
    if (unavailable === 'locked sector') {
      sector.unlocked = false;
      state.sectors['5,5'].nodes.push({ ...bank, id: 'accessible-seed', output: { 'simple-core': 1 } });
    } else sector.nodes = sector.nodes.filter(node => node !== device);
    expect(nextExpansionShortages(state)).toContain('copper');
  });
  it('does not create an unseeded higher tier from a lower-tier seed', () => {
    const { state, bank } = fixture(); completeCoreAccess(state); bank.output['simple-core'] = 1;
    const missing = progressionDeficits(state, 'mapNode', { 'basic-core': 5 });
    expect(missing).toBeDefined();
    expect(Object.values(missing!).some(amount => amount! > 0)).toBe(true);
    expect(nextExpansionShortages(state)).not.toContain('copper'); // Its actual Simple-only bill is funded.
  });
  it.each(['input', 'batch', 'shipment', 'pool'] as const)('recognizes a real seed in %s without spending it twice', location => {
    const { state, bank } = fixture();
    if (location === 'input') bank.input['simple-core'] = 1;
    if (location === 'batch') bank.batch = { recipeId: 'simple-core', outputs: { 'simple-core': 1 } };
    if (location === 'shipment') state.inFlightTransfers = [{ id: 'seed', sectorId: '5,5', connectionId: 'c', from: 'a', to: 'b', item: 'simple-core', amount: 1, launchedAtMs: 0, arrivesAtMs: 1000 }];
    if (location === 'pool') { state.research.completed.push('autonomousLogistics'); state.globalPool = { 'simple-core': 1 }; }
    const before = structuredClone(state);
    expect(progressionDeficits(state, 'mapNode', { 'simple-core': 100 })).toEqual({});
    expect(state).toEqual(before);
  });
  it.each(['cosmetic shipment', 'locked stock', 'inaccessible pool', 'paid research'] as const)('does not treat %s as a reusable seed', location => {
    const { state, bank } = fixture();
    if (location === 'cosmetic shipment') state.inFlightTransfers = [{ id: 'pulse', sectorId: '5,5', connectionId: 'c', from: 'a', to: 'b', item: 'simple-core', amount: 1, launchedAtMs: 0, arrivesAtMs: 1000, cosmeticOnly: true }];
    if (location === 'locked stock') {
      const locked = sectorForState(state, 4, 4); locked.unlocked = false;
      locked.nodes.push({ ...bank, output: { 'simple-core': 1 } }); state.sectors[locked.id] = locked;
    }
    if (location === 'inaccessible pool') state.globalPool = { 'simple-core': 1 };
    if (location === 'paid research') state.research.projectContributions = { assembler: { 'simple-core': 1 } };
    expect(nextExpansionShortages(state)).toContain('copper');
  });
  it('can fund the first seed from ordinary ingredients instead of demanding the entire bill', () => {
    const { state, bank } = fixture();
    bank.output = { ...RECIPES['simple-core'].inputs };
    expect(progressionDeficits(state, 'mapNode', { 'simple-core': 100 })).toEqual({});
    expect(bank.output).toEqual(RECIPES['simple-core'].inputs);
  });
  it('retains a real shortage and rescue when there is no funded seed', () => {
    const { state, sector } = fixture();
    const missing = progressionDeficits(state, 'mapNode', quote(state));
    const ordinary = structuredClone(state);
    ordinary.sectors[sector.id].nodes = ordinary.sectors[sector.id].nodes.filter(node => node.landmark !== 'unknown');
    expect(missing).toEqual(progressionDeficits(ordinary, 'mapNode', { 'simple-core': 1 }));
    expect(missing?.copper).toBeGreaterThan(0);
    expect(nextExpansionShortages(state)).toContain('copper');
    expect(applyExpansionRescue(state)).toBe(true);
    expect(state.rescue?.pending?.resource).toBe('copper');
  });
  it('treats a resumable, disconnected device as production potential rather than a shortage', () => {
    const { state, device, bank } = fixture();
    state.paused = true; device.disabled = true; bank.output['simple-core'] = 1;
    expect(progressionDeficits(state, 'mapNode', { 'simple-core': 100 })).toEqual({});
    expect(device.disabled).toBe(true);
    expect(state.paused).toBe(true);
  });
  it('matches ordinary device cycles with a Core returned between cycles', () => {
    const { state, device, bank } = fixture(); bank.output['simple-core'] = 1;
    expect(nextExpansionShortages(state)).toEqual([]);
    for (let cycle = 0; cycle < 4; cycle++) {
      bank.output['simple-core']!--;
      device.input['simple-core'] = 1; device.inputQueue = ['simple-core'];
      for (let tick = 0; tick < 5; tick++) simulateUnknownDevice(state, device, 1000);
      expect(device.output['simple-core']).toBe(2);
      takeOutput(device, 'simple-core', 2); bank.output['simple-core']! += 2;
    }
    expect(bank.output['simple-core']).toBe(5);
    expect(state.produced?.['simple-core']).toBe(8);
  });
});
