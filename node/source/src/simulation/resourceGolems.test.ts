import { describe, expect, it } from 'vitest';
import { GOLEM_COST_VERSION, GOLEM_MINERALS, GOLEM_NAMES, golemApCost, type GolemMineral } from '../content/resourceGolems';
import { getEffectiveNodeInputFamilies, getEffectiveNodeOutputFamilies } from '../content/nodes';
import type { MachineNode } from '../domain/types';
import { normalizeLegacy } from '../persistence/saves';
import { getNodeSize, getPortAnchor } from '../renderer/nodeLayout';
import { createInitialState, GameEngine } from './engine';
import { getPortSide, isMultiConnectionPort } from './connectionRules';
import { nodesOverlap } from './collisions';
import { generateSector, getSectorWorldSize, sectorDistance } from './worldGeneration';

const advance = (engine: GameEngine, seconds: number) => { for (let i = 0; i < seconds * 10; i++) engine.tick(100); };
function setup(item: GolemMineral = 'iron') {
  const state = createInitialState(37);
  state.research.completed = ['resourceGolemSurvey'];
  const golem: MachineNode = { id: 'golem', kind: 'resourceGolem', name: 'Golem', golemMineral: item,
    health: golemApCost({ golemMineral: item }), golemCostVersion: GOLEM_COST_VERSION,
    x: 1800, y: 1200, rotation: 0, input: {}, output: {}, progressMs: 0,
    cycleMs: 1000, constructedAt: 0, constructionMs: 0 };
  state.sectors['5,5'].nodes = [golem];
  return new GameEngine(state);
}

describe('resource Golems', () => {
  it.each([1, 37, 98765, 2147483647])('places one of each mineral in separate unobstructed tier five sectors for seed %i', seed => {
    const minerals: string[] = [];
    const sectors = new Set<string>();
    for (let x = 0; x < 11; x++) for (let y = 0; y < 11; y++) {
      const sector = generateSector(x, y, seed, 0);
      const golems = sector.nodes.filter(node => node.kind === 'resourceGolem');
      expect(golems.length).toBeLessThanOrEqual(1);
      for (const golem of golems) {
        minerals.push(golem.golemMineral!); sectors.add(sector.id);
        expect(sectorDistance(x, y)).toBe(5);
        const field = getSectorWorldSize(sector, []);
        expect(golem.x).toBe(field.width / 2);
        expect(golem.y).toBe(field.height / 2);
        expect(golem.health).toBe(golem.golemMineral === 'mythril' ? 150 : 100);
        expect(golem.golemCostVersion).toBe(GOLEM_COST_VERSION);
        expect(golem.golemOutputs).toEqual([golem.golemMineral]);
        expect(sector.nodes.some(node => ['monster-camp', 'big-hole', 'lake'].includes(node.kind))).toBe(false);
        expect(sector.nodes.filter(node => node.id !== golem.id).some(node => nodesOverlap(golem, node))).toBe(false);
        expect(generateSector(x, y, seed, 0).nodes.find(node => node.id === golem.id)).toEqual(golem);
        const expanded = generateSector(x, y, seed, 0, ['areaExpansion2']);
        const expandedField = getSectorWorldSize(expanded, ['areaExpansion2']);
        const expandedGolem = expanded.nodes.find(node => node.kind === 'resourceGolem')!;
        expect(expandedGolem.x).toBe(expandedField.width / 2);
        expect(expandedGolem.y).toBe(expandedField.height / 2);
      }
    }
    expect(minerals.sort()).toEqual([...GOLEM_MINERALS].sort());
    expect(sectors.size).toBe(4);
  });

  it.each([5, 6] as const)('keeps a legacy tier-%i layout with an already generated Golem sector', tier => {
    const state = createInitialState(37);
    if (tier === 6) delete state.golemPlacementTier;
    delete state.encounterLayoutVersion;
    const oldGolemSectors = Array.from({ length: 121 }, (_, index) => ({ x: index % 11, y: Math.floor(index / 11) }))
      .filter(({ x, y }) => sectorDistance(x, y) === tier)
      .map(({ x, y }) => generateSector(x, y, state.seed, 0, [], tier, 1))
      .filter(sector => sector.nodes.some(node => node.kind === 'resourceGolem'));
    const [oldSector] = oldGolemSectors;
    const oldGolem = oldSector.nodes.find(node => node.kind === 'resourceGolem')!;
    oldGolem.health = 90;
    oldSector.unlocked = true;
    state.sectors[oldSector.id] = oldSector;
    const engine = new GameEngine(state, { autosave: false });
    engine.developerUnlockAllSectors();
    const restored = new GameEngine(normalizeLegacy(engine.getState())!, { autosave: false }).getState();
    expect(restored.golemPlacementTier).toBe(tier);
    expect(restored.encounterLayoutVersion).toBe(1);
    expect(restored.sectors[oldSector.id].nodes.find(node => node.id === oldGolem.id)?.health).toBe(90);
    const golemSectors = Object.values(restored.sectors).filter(sector => sector.nodes.some(node => node.kind === 'resourceGolem'));
    expect(golemSectors.map(sector => sector.id).sort()).toEqual(oldGolemSectors.map(sector => sector.id).sort());
    const minerals = golemSectors.flatMap(sector => sector.nodes.filter(node => node.kind === 'resourceGolem').map(node => node.golemMineral));
    expect(minerals.sort()).toEqual([...GOLEM_MINERALS].sort());
  });

  it('banks permanent AP damage through saves, requires the full one-time cost, and retires bot cables at victory', () => {
    let engine = setup();
    let golem = engine.getSector().nodes[0];
    expect(getEffectiveNodeOutputFamilies(golem)).toEqual([]);
    golem.input['heavy-suppression-bot'] = 10;
    advance(engine, .1);
    expect(golem.health).toBe(20);
    engine = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))!);
    golem = engine.getSector().nodes[0];
    advance(engine, 60);
    expect(golem.health).toBe(20);
    golem.input['suppression-bot'] = 19;
    advance(engine, .1);
    expect(golem.kind).toBe('resourceGolem');
    expect(golem.health).toBe(1);
    engine.getSector().connections.push({ id: 'attack', from: 'supply', to: golem.id, createdAt: 0 });
    golem.input['suppression-bot'] = 1;
    advance(engine, .1);
    expect(golem.kind).toBe('iron');
    expect(golem.defeated).toBe(true);
    expect(golem.infiniteResource).toBe(true);
    expect(golem.health).toBe(0);
    expect(engine.getSector().connections).toEqual([]);
    expect(getEffectiveNodeInputFamilies(golem, [])).toEqual([]);
  });

  it.each([[19880, 1], [240, 2]] as const)('credits the AP already paid at the old Mythril price with %i HP and version %i', (health, golemCostVersion) => {
    const engine = setup('mythril');
    const old = structuredClone(engine.getState());
    Object.assign(old.sectors['5,5'].nodes[0], { health, golemCostVersion });
    engine.replaceState(old);
    expect(engine.getSector().nodes[0]).toMatchObject({ kind: 'resourceGolem', health: 30, golemCostVersion: GOLEM_COST_VERSION });
    const reloaded = new GameEngine(normalizeLegacy(structuredClone(engine.getState()))!);
    expect(reloaded.getSector().nodes[0].health).toBe(30);
  });

  it('converts an old Golem that is already paid for and returns pending bots', () => {
    const engine = setup();
    const old = structuredClone(engine.getState());
    const sector = old.sectors['5,5'];
    const golem = sector.nodes[0];
    Object.assign(golem, { health: 9800, golemCostVersion: 1, input: { 'suppression-bot': 2 } });
    sector.nodes.push({ ...golem, id: 'cart', kind: 'woodenChest', x: 1300, input: {}, output: {} });
    sector.connections.push({ id: 'attack', from: 'cart', to: golem.id, createdAt: 0 });
    old.inFlightTransfers = [{ id: 'bot', sectorId: sector.id, connectionId: 'attack', from: 'cart', to: golem.id, item: 'suppression-bot', launchedAtMs: 0, arrivesAtMs: 1000 }];
    engine.replaceState(old);
    expect(engine.getSector().nodes[0]).toMatchObject({ kind: 'iron', infiniteResource: true, health: 0, input: {} });
    expect(engine.getSector().connections).toEqual([]);
    expect(engine.getState().inFlightTransfers).toEqual([]);
    expect(engine.getSector().nodes[1].output).toEqual({ 'suppression-bot': 1 });
    expect(engine.getState().globalPool).toMatchObject({ 'suppression-bot': 2 });
  });

  it.each(GOLEM_MINERALS)('turns a defeated %s Golem into an endless reserve with four working star faces', item => {
    const engine = setup(item);
    const source = engine.getSector().nodes[0];
    source.input['command-suppression-bot'] = item === 'mythril' ? 7 : 5;
    advance(engine, .1);
    expect(source.resourceItem).toBe(item);
    expect(source.name).toBe(GOLEM_NAMES[item]);
    expect(getEffectiveNodeOutputFamilies(source)).toEqual([item, item, item, item]);
    const size = getNodeSize(source);
    const normalSize = getNodeSize({ kind: source.kind });
    expect(size).toEqual({ w: normalSize.w * 2, h: normalSize.h * 2 });
    const positions = [{ x: 1800, y: 600 }, { x: 2500, y: 1200 }, { x: 1800, y: 1800 }, { x: 1100, y: 1200 }];
    const anchors = [{ x: 0, y: -size.h / 2 }, { x: size.w / 2, y: 0 }, { x: 0, y: size.h / 2 }, { x: -size.w / 2, y: 0 }];
    positions.forEach((position, index) => {
      expect(getPortAnchor(source, 'output', index)).toEqual(anchors[index]);
      expect(getPortSide(source, 'output', index)).toBe(['north', 'east', 'south', 'west'][index]);
      expect(isMultiConnectionPort(source, 'output', index)).toBe(true); // Star socket rendering.
      const extractor: MachineNode = { ...source, ...position, id: `extractor-${index}`, kind: 'extractor', name: 'Extractor', resourceItem: undefined, infiniteResource: undefined, input: {}, output: {}, cycleMs: 5000 };
      engine.getSector().nodes.push(extractor);
      expect(engine.connectPorts(source.id, index, extractor.id, 0)).toBe(true);
    });
    for (let cycle = 0; cycle < 20; cycle++) {
      advance(engine, 5);
      for (const extractor of engine.getSector().nodes.filter(node => node.kind === 'extractor')) {
        expect(extractor.output[item]).toBe(1);
        extractor.output = {};
      }
    }
    expect(source.resourceRemaining).toBeUndefined();
    expect(source.infiniteResource).toBe(true);
    expect(source.kind).not.toBe('big-hole');
    const loaded = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))!);
    expect(loaded.getSector().nodes.find(node => node.id === source.id)?.infiniteResource).toBe(true);
    expect(loaded.getSector().connections).toHaveLength(4);
  });
});
