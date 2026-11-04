import { describe, expect, it } from 'vitest';
import { GOLEM_AP_COST, GOLEM_MINERALS, type GolemMineral } from '../content/resourceGolems';
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
    health: GOLEM_AP_COST, x: 1800, y: 1200, rotation: 0, input: {}, output: {}, progressMs: 0,
    cycleMs: 1000, constructedAt: 0, constructionMs: 0 };
  state.sectors['5,5'].nodes = [golem];
  return new GameEngine(state);
}

describe('resource Golems', () => {
  it.each([1, 37, 98765, 2147483647])('places one of each mineral in separate unobstructed tier six sectors for seed %i', seed => {
    const minerals: string[] = [];
    const sectors = new Set<string>();
    for (let x = 0; x < 11; x++) for (let y = 0; y < 11; y++) {
      const sector = generateSector(x, y, seed, 0);
      const golems = sector.nodes.filter(node => node.kind === 'resourceGolem');
      expect(golems.length).toBeLessThanOrEqual(1);
      for (const golem of golems) {
        minerals.push(golem.golemMineral!); sectors.add(sector.id);
        expect(sectorDistance(x, y)).toBe(6);
        const field = getSectorWorldSize(sector, []);
        expect(golem.x).toBe(field.width / 2);
        expect(golem.y).toBe(field.height / 2);
        expect(golem.health).toBe(golem.golemMineral === 'mythril' ? 20000 : 10000);
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

  it('banks permanent AP damage through saves, requires the full one-time cost, and retires bot cables at victory', () => {
    let engine = setup();
    let golem = engine.getSector().nodes[0];
    expect(getEffectiveNodeOutputFamilies(golem)).toEqual([]);
    golem.input['heavy-suppression-bot'] = 625; // 5,000 AP.
    advance(engine, .1);
    expect(golem.health).toBe(5000);
    engine = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))!);
    golem = engine.getSector().nodes[0];
    advance(engine, 60);
    expect(golem.health).toBe(5000);
    golem.input['command-suppression-bot'] = 249; // Another 4,980 AP.
    advance(engine, .1);
    expect(golem.kind).toBe('resourceGolem');
    expect(golem.health).toBe(20);
    engine.getSector().connections.push({ id: 'attack', from: 'supply', to: golem.id, createdAt: 0 });
    golem.input['command-suppression-bot'] = 1;
    advance(engine, .1);
    expect(golem.kind).toBe('iron');
    expect(golem.defeated).toBe(true);
    expect(golem.infiniteResource).toBe(true);
    expect(golem.health).toBe(0);
    expect(engine.getSector().connections).toEqual([]);
    expect(getEffectiveNodeInputFamilies(golem, [])).toEqual([]);
  });

  it.each(GOLEM_MINERALS)('turns a defeated %s Golem into an endless reserve with four working star faces', item => {
    const engine = setup(item);
    const source = engine.getSector().nodes[0];
    source.input['command-suppression-bot'] = item === 'mythril' ? 1000 : 500;
    advance(engine, .1);
    expect(source.resourceItem).toBe(item);
    expect(source.name).toMatch(/^Infinite /);
    expect(getEffectiveNodeOutputFamilies(source)).toEqual([item, item, item, item]);
    const size = getNodeSize(source);
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
