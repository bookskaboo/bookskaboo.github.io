import { describe, expect, it } from 'vitest';
import type { MachineNode } from '../domain/types';
import { getEffectiveNodeInputFamilies, getEffectiveNodeOutputFamilies } from '../content/nodes';
import { getPortAnchor, organicPolygon } from '../renderer/nodeLayout';
import { normalizeLegacy } from '../persistence/saves';
import { nodesOverlap } from './collisions';
import { createInitialState, GameEngine } from './engine';
import { generateSector, getMythrilSpawnChance, sectorDistance } from './worldGeneration';
import { portFamiliesCompatible } from './connectionRules';
import { getNodeCapabilities } from '../content/nodeCapabilities';

const node = (kind: MachineNode['kind'], extra: Partial<MachineNode> = {}): MachineNode => ({
  id: kind, kind, name: kind, x: 500, y: 500, rotation: 0, input: {}, output: {}, progressMs: 0,
  cycleMs: 1000, constructedAt: 0, constructionMs: 0, ...extra,
});

describe('speedrun follow-up regressions', () => {
  it('delivers single-material road stock without losing the retained receiving batch', () => {
    const state = createInitialState(1);
    const other = generateSector(6, 5, 1); other.unlocked = true; other.nodes = []; other.connections = [];
    state.sectors[other.id] = other;
    other.nodes = [node('woodenChest', { id: 'supply', input: { copper: 20 }, output: { copper: 20 } }), node('road', { id: 'send', roadMode: 'export', pairedSectorId: '5,5', pairedRoadId: 'receive' })];
    other.connections = [{ id: 'supply-send', from: 'supply', to: 'send', fromPort: 0, toPort: 0, createdAt: 0 }];
    state.sectors['5,5'].nodes = [
      node('road', { id: 'receive', x: 200, roadMode: 'import', output: { copper: 9 } }),
      node('splitter', { id: 'split', x: 600 }),
      node('filter', { id: 'blocked', x: 1000, y: 300, filterItem: 'mythril', input: { mythril: 5 }, output: { mythril: 5 } }),
      node('filter', { id: 'open', x: 1000, y: 700, filterItem: 'copper' }),
      node('woodenChest', { id: 'sink', x: 1400, y: 700 }),
    ];
    const engine = new GameEngine(state);
    expect(engine.connectPorts('receive', 0, 'split', 0)).toBe(true);
    expect(engine.connectPorts('split', 0, 'blocked', 0)).toBe(true);
    expect(engine.connectPorts('split', 1, 'open', 0)).toBe(true);
    expect(engine.connectPorts('open', 0, 'sink', 0)).toBe(true);
    let received = 0;
    for (let step = 0; step < 2100; step++) {
      engine.tick(100);
      const sink = engine.getSector().nodes.find(n => n.id === 'sink')!;
      received += (sink.input.copper ?? 0) + (sink.output.copper ?? 0);
      sink.input = {}; sink.output = {};
    }
    const all = Object.values(engine.getState().sectors).flatMap(s => s.nodes);
    expect(received).toBe(40);
    expect(engine.getState().globalPool?.copper).toBe(9);
    expect(received + (engine.getState().globalPool?.copper ?? 0)).toBe(49);
    expect(all.reduce((n, entry) => n + (entry.input.mythril ?? 0) + (entry.output.mythril ?? 0), 0)).toBe(10);
  });

  it('uses five-item production buffers and preserves excess contents in older saves', () => {
    for (const kind of ['hydroProcessor', 'advancedAssembler', 'separationFurnace'] as const) {
      expect(getNodeCapabilities(kind).inputCapacity).toBe(5);
      const state = createInitialState(1);
      state.sectors['5,5'].nodes = [node(kind, { capacity: 64, input: { coolant: 40 }, output: { slag: 12 } })];
      const engine = new GameEngine(state);
      expect(engine.getSector().nodes[0]).toMatchObject({ capacity: 5, input: { coolant: 40 }, output: { slag: 12 } });
    }
    const state = createInitialState(1);
    state.research.completed = ['mithrilTools'];
    state.sectors['5,5'].nodes = [node('separationFurnace', { recipeId: 'refined-mithril', cycleMs: 12000, input: { 'mythril-plate': 5, 'iron-plate': 5, charcoal: 5 } })];
    const engine = new GameEngine(state);
    for (let step = 0; step < 121; step++) engine.tick(100);
    engine.getSector().nodes[0].input['mythril-plate'] = 5;
    engine.getSector().nodes[0].input['iron-plate'] = 5;
    for (let step = 0; step < 180; step++) engine.tick(100);
    expect(engine.getSector().nodes[0].output).toEqual({ 'refined-mithril': 4 });
    expect(engine.getSector().nodes[0].input['mythril-plate']).toBe(4);
    expect(engine.getSector().nodes[0].input['iron-plate']).toBe(1);
  });

  it('rejects locked storage placement and copying until its research is unlocked', () => {
    const engine = new GameEngine(createInitialState(1)); engine.getSector().nodes = [];
    for (const kind of ['storage', 'fluidStorage', 'slagHopper', 'wasteHopper', 'warehouse'] as const) {
      expect(engine.getNodePlacementPreview(kind, 1000, 1000)?.valid).toBe(false);
      expect(engine.placeNode(kind, 1000, 1000)).toBeUndefined();
    }
    engine.getSector().nodes = [node('fluidStorage')];
    expect(engine.duplicateNodes(['fluidStorage'])).toEqual([]);
    engine.getState().research.unlocked.push('fluidRouting');
    expect(engine.placeNode('fluidStorage', 1400, 1000)).toBeTruthy();
  });
  it('stops mixed traffic at a Filter whose required remainder outlet is disconnected', () => {
    const state = createInitialState(1);
    state.sectors['5,5'].nodes = [
      node('woodenChest', { id: 'source', x: 200, output: { mythril: 10, copper: 10 } }),
      node('splitter', { id: 'split', x: 600, input: { mythril: 3, copper: 2 }, output: { mythril: 5 } }),
      node('filter', { id: 'blocked', x: 1000, y: 300, filterItem: 'mythril', input: { mythril: 5 }, output: { mythril: 5 } }),
      node('filter', { id: 'open', x: 1000, y: 700, filterItem: 'copper' }),
      node('woodenChest', { id: 'sink', x: 1400, y: 700 }),
    ];
    const engine = new GameEngine(state);
    expect(engine.connectPorts('source', 0, 'split', 0)).toBe(true);
    expect(engine.connectPorts('split', 0, 'blocked', 0)).toBe(true);
    expect(engine.connectPorts('split', 1, 'open', 0)).toBe(true);
    expect(engine.connectPorts('open', 0, 'sink', 0)).toBe(true);
    for (let step = 0; step < 300; step++) {
      engine.tick(100);
      const split = engine.getSector().nodes.find(n => n.id === 'split')!;
      expect(Object.values(split.input).reduce((a, b) => a + (b ?? 0), 0)).toBeLessThanOrEqual(5);
      expect(Object.values(split.output).reduce((a, b) => a + (b ?? 0), 0)).toBeLessThanOrEqual(5);
    }
    const nodes = engine.getSector().nodes;
    const open = nodes.find(n => n.id === 'open')!;
    const sink = nodes.find(n => n.id === 'sink')!;
    expect((open.input.copper ?? 0) + (open.output.copper ?? 0) + (sink.input.copper ?? 0) + (sink.output.copper ?? 0)).toBe(0);
    expect(nodes.reduce((total, n) => total + (n.input.mythril ?? 0) + (n.output.mythril ?? 0), 0)).toBe(28);
  });
  it('routes coolant through fluid equipment while keeping solids out', () => {
    const source = node('hydroProcessor', { id: 'source', x: 400, recipeId: 'coolant', output: { coolant: 24 } });
    const link = node('fluidLink', { id: 'link', x: 900 });
    const target = node('advancedAssembler', { id: 'target', x: 1400, recipeId: 'hydraulic-actuator' });
    const water = node('lakeIntake'); const iron = node('extractor', { resourceItem: 'iron' });
    for (const kind of ['fluidLink', 'fluidStorage'] as const) {
      const equipment = node(kind);
      expect(portFamiliesCompatible(source, 0, equipment, 0)).toBe(true);
      expect(portFamiliesCompatible(water, 0, equipment, 0)).toBe(true);
      expect(portFamiliesCompatible(iron, 0, equipment, 0)).toBe(false);
    }
    const state = createInitialState(1); state.sectors['5,5'].nodes = [source, link, target];
    const engine = new GameEngine(state);
    expect(engine.connectPorts('source', 0, 'link', 0)).toBe(true);
    expect(engine.connectPorts('link', 0, 'target', 2)).toBe(true);
    let received = 0;
    for (let step = 0; step < 200; step++) {
      engine.tick(100);
      const target = engine.getSector().nodes.find(n => n.id === 'target')!;
      expect(target.input.coolant ?? 0).toBeLessThanOrEqual(5);
      received += target.input.coolant ?? 0; target.input.coolant = 0;
    }
    expect(received).toBe(24);
  });
  it('keeps future resources separated across world tiers and seeds', () => {
    for (let seed = 1; seed <= 10; seed++) for (let x = 0; x <= 10; x++) for (let y = 0; y <= 10; y++) {
      if (sectorDistance(x, y) === 0) continue;
      const resources = generateSector(x, y, seed, 0).nodes.filter((entry) => entry.resourceItem && entry.kind !== 'lake');
      for (let a = 0; a < resources.length; a++) for (let b = a + 1; b < resources.length; b++) {
        expect(nodesOverlap(resources[a], resources[b], 160), `${seed}: ${x},${y}`).toBe(false);
      }
    }
  });

  it('matches the original Mythril tier probabilities without the tier-two exception', () => {
    expect([0, 1, 2, 3, 10].map(getMythrilSpawnChance)).toEqual([0, 0, 0, 0, 0]);
    expect(getMythrilSpawnChance(4)).toBe(0);
    expect(getMythrilSpawnChance(9)).toBe(0);
    for (let seed = 1; seed <= 30; seed++) expect(generateSector(7, 5, seed).nodes.some((entry) => entry.kind === 'mythril')).toBe(false);
  });

  it('anchors every lake socket to an edge of the visible shoreline', () => {
    for (let seed = 0; seed < 10; seed++) {
      const lake = node('lake', { id: `lake-${seed}`, obstructionWidth: 800, obstructionHeight: 500 });
      const polygon = organicPolygon(lake, 18);
      for (let port = 0; port < 4; port++) {
        const point = getPortAnchor(lake, 'output', port);
        const onEdge = polygon.some((_, index) => {
          if (index % 2) return false;
          const ax = polygon[index], ay = polygon[index + 1];
          const bx = polygon[(index + 2) % polygon.length], by = polygon[(index + 3) % polygon.length];
          const dx = bx - ax, dy = by - ay;
          const cross = (point.x - ax) * dy - (point.y - ay) * dx;
          const along = (point.x - ax) * dx + (point.y - ay) * dy;
          return Math.abs(cross) < 1e-5 && along >= -1e-5 && along <= dx * dx + dy * dy + 1e-5;
        });
        expect(onEdge).toBe(true);
      }
    }
  });

  it('gives roads one inward socket and reverses paired transport without losing buffers', () => {
    const state = createInitialState(5); state.sectors['5,5'].nodes = [];
    const other = generateSector(6, 5, 5); other.unlocked = true; other.nodes = []; other.connections = [];
    state.sectors[other.id] = other;
    const engine = new GameEngine(state);
    const id = engine.placeNode('road', 3550, 1200)!;
    const road = engine.getSector().nodes.find((entry) => entry.id === id)!;
    const pair = engine.getState().sectors['6,5'].nodes.find((entry) => entry.id === road.pairedRoadId)!;
    expect(road.roadFacing).toBe('west'); expect(pair.roadFacing).toBe('east');
    expect(getPortAnchor(road, 'input', 0).x).toBe(-64);
    expect(getEffectiveNodeInputFamilies(road, [])).toHaveLength(1);
    expect(getEffectiveNodeOutputFamilies(road)).toHaveLength(0);
    expect(getEffectiveNodeInputFamilies(pair, [])).toHaveLength(0);
    expect(getEffectiveNodeOutputFamilies(pair)).toHaveLength(1);
    road.input.iron = 3; pair.output.copper = 7;
    expect(engine.reverseRoad(id)).toBe(true);
    expect(road.roadMode).toBe('import'); expect(pair.roadMode).toBe('export');
    expect(road.output.iron).toBe(3); expect(pair.input.copper).toBe(7);
    expect(road.roadFacing).toBe('west'); expect(pair.roadFacing).toBe('east');
  });

  it('rotates mixed chest transfers even when the first material keeps arriving', () => {
    const state = createInitialState(1);
    state.sectors['5,5'].nodes = [node('woodenChest', { input: { iron: 10, copper: 10 } })];
    const engine = new GameEngine(state); const chest = engine.getSector().nodes[0];
    for (let step = 0; step < 80; step++) { engine.tick(100); chest.input.iron = 10; }
    expect(chest.output.copper).toBe(10); expect(chest.output.iron).toBe(10);
  });

  it('normalizes old names and road orientation while preserving saved contents, layouts and camera', () => {
    const state = createInitialState(1);
    const sector = state.sectors['5,5']; sector.camera = { x: -123, y: -456, zoom: .72 };
    sector.nodes = [node('forest', { name: 'Wild Forest', resourceRemaining: 823 }), node('big-hole', { name: 'Depletion Hole', resourceRemaining: 112 }), node('road', { pairedSectorId: '5,4', roadMode: 'export', input: { copper: 9 } })];
    const engine = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(state)))!);
    expect(engine.getSector().nodes.map((entry) => entry.name)).toEqual(['Forest', 'Deep Hole', 'road']);
    expect(engine.getSector().nodes[2].roadFacing).toBe('south');
    expect(engine.getSector().nodes[2].input).toEqual({});
    expect(engine.getState().globalPool?.copper).toBe(9);
    expect(engine.getSector().nodes[0].resourceRemaining).toBe(823);
    expect(engine.getSector().nodes[1].resourceRemaining).toBe(112);
    expect(engine.getSector().nodes.map(({ x, y }) => [x, y])).toEqual([[500, 500], [500, 500], [500, 500]]);
    expect(engine.getSector().camera).toEqual(sector.camera);
  });

  it('renames saved Wooden Chests without changing stock or layout', () => {
    const state = createInitialState(1);
    state.sectors['5,5'].nodes = [node('woodenChest', { name: 'Wooden Chest', x: 800, y: 700, input: { iron: 11 }, output: { iron: 7 } })];
    const engine = new GameEngine(state);
    expect(engine.getSector().nodes[0]).toMatchObject({ name: 'Cart', x: 800, y: 700, input: { iron: 11 }, output: { iron: 7 } });
  });
});
