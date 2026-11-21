import { describe, expect, it } from 'vitest';
import { BORDER_CROSSING_RESEARCH, borderSide, type BorderObstruction } from '../domain/borderObstructionLayout';
import { getResearchProject, isResearchAvailable } from '../content/research';
import { SEVEN_CORES } from '../content/endgame';
import { normalizeLegacy } from '../persistence/legacyMigration';
import { createInitialState, GameEngine } from './engine';
import { borderQuadrantCount, borderTargets, generateBorderObstructions, validateBorderWorld } from './borderObstructions';
import { getWorldFieldSize } from './worldGeneration';
import { emptyMod } from '../mods/modTypes';

function fixture(kind: BorderObstruction, reverse = false) {
  const state = createInitialState(37), edge = state.borderObstructions!.find(e => e.kind === kind)!;
  state.research.completed = ['road', 'roadChannels1', 'roadChannels2']; state.research.unlocked.push('road');
  const engine = new GameEngine(state, { autosave: false });
  for (const id of [edge.from, edge.to]) {
    const [x, y] = id.split(',').map(Number), sector = engine.ensureSector(x, y);
    sector.unlocked = true; sector.visited = true; sector.nodes = []; sector.connections = [];
    engine.getState().sectors[id] = sector;
  }
  engine.getState().activeSectorId = reverse ? edge.to : edge.from;
  const other = reverse ? edge.from : edge.to;
  const side = borderSide(engine.getSector().id, other), field = getWorldFieldSize(engine.getState());
  const point = { x: side === 'east' ? field.width - 10 : side === 'west' ? 10 : field.width / 2, y: side === 'south' ? field.height - 10 : side === 'north' ? 10 : field.height / 2 };
  return { engine, edge, other, point };
}
describe('seeded border worlds', () => {
  it('meets exact quotas, corner and route safeguards and quadrant coverage across seeds', () => {
    for (let seed = 0; seed < 100; seed++) {
      const edges = generateBorderObstructions(seed);
      expect(validateBorderWorld(edges, 11), `seed ${seed}`).toBe(true);
      for (const kind of ['river', 'mountain', 'chasm'] as const) {
        expect(edges.filter(e => e.kind === kind)).toHaveLength(borderTargets(11)[kind]);
        expect(borderQuadrantCount(edges, kind)).toBeGreaterThanOrEqual(3);
      }
      expect(new Set(edges.flatMap(e => [e.from, e.to])).size).toBeGreaterThanOrEqual(45);
      expect(generateBorderObstructions(seed)).toEqual(edges);
      edges[0].from = 'invalid';
      expect(generateBorderObstructions(seed)[0].from).not.toBe('invalid');
    }
  });
  it.each([13, 15, 17, 19, 21])('scales quotas and preserves clear routes on a %i grid', size => {
    const edges = generateBorderObstructions(37, size);
    expect(validateBorderWorld(edges, size)).toBe(true);
    for (const kind of ['river', 'mountain', 'chasm'] as const) expect(edges.filter(e => e.kind === kind)).toHaveLength(borderTargets(size)[kind]);
  });
});
describe.each(['river', 'mountain', 'chasm'] as const)('%s Road permission', kind => {
  it.each([false, true])('rejects both endpoints atomically from either side (reverse %s), with a blocked ghost', reverse => {
    const { engine, point, other } = fixture(kind, reverse);
    const before = structuredClone(engine.getState());
    const preview = engine.getNodePlacementPreview('road', point.x, point.y)!;
    expect(preview.valid).toBe(false); expect(preview.road?.sector.id).toBe(other);
    expect(preview.crossingRequirement).toBe(engine.getNodePlacementError('road', point.x, point.y));
    expect(engine.getNodePlacementError('road', point.x, point.y)).toMatch(/research/);
    for (const delta of [-300, 0, 300]) expect(engine.placeNode('road', point.x < 100 || point.x > 3500 ? point.x : point.x + delta, point.y < 100 || point.y > 2300 ? point.y : point.y + delta)).toBeUndefined();
    expect(engine.getState()).toEqual(before);
  });
  it('requires its own research, then places normal pairs with normal channels, saves and removal', () => {
    const { engine, point, edge, other } = fixture(kind);
    engine.getState().research.completed.push(...Object.entries(BORDER_CROSSING_RESEARCH).filter(([k]) => k !== kind).map(([, id]) => id));
    expect(engine.placeNode('road', point.x, point.y)).toBeUndefined();
    engine.getState().research.completed.push(BORDER_CROSSING_RESEARCH[kind]);
    const id = engine.placeNode('road', point.x, point.y)!;
    expect(id).toBeTruthy();
    const road = engine.getSector().nodes.find(n => n.id === id)!;
    expect(road.kind).toBe('road'); expect(road.pairedSectorId).toBe(other);
    expect(engine.getState().sectors[other].nodes.find(n => n.id === road.pairedRoadId)?.pairedRoadId).toBe(id);
    expect(engine.getRoadMovePreview(id, point)?.valid).toBe(true);
    expect(engine.reverseRoad(id)).toBe(true);
    const restored = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))!, { autosave: false });
    expect(restored.getState().borderObstructions).toEqual(engine.getState().borderObstructions);
    expect(restored.getRoadMovePreview(id, point)?.valid).toBe(true);
    restored.deleteNodes([id]);
    expect(restored.getState().borderObstructions).toContainEqual(edge);
    expect(restored.getSector().nodes).toHaveLength(0); expect(restored.getState().sectors[other].nodes).toHaveLength(0);
  });
  it('completes through normal Research Center processing at the matching Core tier', () => {
    const { engine, point } = fixture(kind), id = BORDER_CROSSING_RESEARCH[kind], project = getResearchProject(id)!;
    const tier = kind === 'river' ? 4 : kind === 'mountain' ? 5 : 6, core = kind === 'river' ? 'hydroCore' : kind === 'mountain' ? 'shinyCore' : 'complexCore';
    expect(project.costs).toEqual(Object.fromEntries(SEVEN_CORES.slice(0, tier).map(item => [item, 5])));
    expect(isResearchAvailable(project, ['road'])).toBe(false);
    expect(isResearchAvailable(project, [core])).toBe(false);
    expect(isResearchAvailable(project, ['road', core])).toBe(true);
    engine.getState().research.completed.push('simpleCore', 'basicCore', 'automataCore', 'hydroCore', 'shinyCore', 'complexCore');
    engine.getSector().nodes.push({ id: 'lab', kind: 'researchCenter', name: 'Research Center', x: 1000, y: 1000, rotation: 0, input: { ...project.costs }, output: {}, cycleMs: 5000, progressMs: 0, constructedAt: 0, constructionMs: 0 });
    engine.selectResearch(id);
    expect(engine.getState().research.selected).toBe(id);
    for (let i = 0; i < 300; i++) engine.tick(100);
    expect(engine.getState().research.completed).toContain(id);
    expect(engine.placeNode('road', point.x, point.y)).toBeTruthy();
  });
});
describe('border save compatibility', () => {
  it('keeps old worlds clear after reload, replacement and later sector discovery', () => {
    const state = createInitialState(37); delete state.borderObstructionVersion; delete state.borderObstructions;
    const loaded = normalizeLegacy(JSON.parse(JSON.stringify(state)))!;
    expect(loaded.borderObstructionVersion).toBe(0); expect(loaded.borderObstructions).toEqual([]);
    const engine = new GameEngine(loaded, { autosave: false });
    engine.ensureSector(4, 5); engine.replaceState(engine.getState());
    expect(engine.getState().borderObstructions).toEqual([]);
    expect(normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))?.borderObstructionVersion).toBe(0);
  });
  it('rejects unsupported, duplicate, nonadjacent, right-angle and protected layouts', () => {
    const state = createInitialState(37), edge = state.borderObstructions![0];
    for (const value of [null, [{ ...edge, to: '99,99' }], [edge, edge], [{ from: '5,5', to: '6,5', kind: 'river' }], [{ from: '2,2', to: '3,2', kind: 'river' }, { from: '2,2', to: '2,3', kind: 'mountain' }]]) expect(normalizeLegacy({ ...state, borderObstructions: value })).toBeNull();
    expect(normalizeLegacy({ ...state, borderObstructionVersion: 2 })).toBeNull();
  });
  it('rejects imported unresearched Roads without deleting the source payload', () => {
    const { engine, point } = fixture('river');
    engine.getState().research.completed.push('riverBridges');
    expect(engine.placeNode('road', point.x, point.y)).toBeTruthy();
    const payload = structuredClone(engine.getState()); payload.research.completed = ['road'];
    const before = structuredClone(payload);
    expect(normalizeLegacy(payload)).toBeNull(); expect(payload).toEqual(before);
  });
  it('preserves research, terrain and paired endpoints through undo and scales new layouts only', () => {
    const { engine, point } = fixture('mountain');
    engine.getState().research.completed.push('mountainTunnels');
    const edges = structuredClone(engine.getState().borderObstructions);
    expect(engine.placeNode('road', point.x, point.y)).toBeTruthy(); engine.undo();
    expect(engine.getSector().nodes).toHaveLength(0); expect(engine.getState().borderObstructions).toEqual(edges);
    expect(engine.getState().research.completed).toContain('mountainTunnels');
    const fresh = new GameEngine(createInitialState(37), { autosave: false }), mod = emptyMod(); mod.rules.worldGridSize = 21;
    fresh.applyMod(mod); expect(fresh.getState().borderObstructions).toHaveLength(138);
    expect(normalizeLegacy(fresh.getState())?.borderObstructions).toEqual(fresh.getState().borderObstructions);
    fresh.undo(); expect(fresh.getState().borderObstructions).toHaveLength(36);
    const legacy = createInitialState(37); delete legacy.borderObstructionVersion; delete legacy.borderObstructions;
    const old = new GameEngine(legacy, { autosave: false }); old.applyMod(mod);
    expect(old.getState().borderObstructions).toEqual([]);
  });
  it('prevents Road copy/template bypasses and checks paired movement permission', () => {
    const { engine, point } = fixture('chasm');
    engine.getState().research.completed.push('chasmSpans', 'factoryTemplates');
    const id = engine.placeNode('road', point.x, point.y)!, road = engine.getSector().nodes.find(n => n.id === id)!;
    expect(engine.copyNodes([id])).toBe(false);
    expect(engine.saveFactoryTemplate('Road', [id])).toBe(false);
    engine.getState().factoryTemplates = [{ name: 'Imported Road', nodes: [structuredClone(road)], connections: [] }];
    expect(engine.getTemplatePreview(0, 1800, 1200)?.valid).toBe(false);
    expect(engine.placeFactoryTemplate(0, 1800, 1200)).toBe(false);
    engine.getState().research.completed = ['road'];
    expect(engine.getRoadMovePreview(id, point)?.valid).toBe(false);
    expect(engine.tryMoveNodesTo({ [id]: point })).toBe(false);
  });
});
