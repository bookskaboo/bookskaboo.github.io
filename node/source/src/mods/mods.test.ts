import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { activateMod, BASE_MOD_CONTENT } from './modContent';
import { emptyMod } from './modTypes';
import { exportMod, exportModText, importMod, readModTextFile } from './modSharing';
import { validateMod } from './modValidation';
import { modRule } from './modRules';
import { createInitialState, GameEngine } from '../simulation/engine';
import { NODE_DEFINITIONS, getEffectiveNodeInputFamilies } from '../content/nodes';
import { ITEM_NAMES } from '../content/items';
import { RECIPES, RECIPE_GROUPS } from '../content/recipes';
import { getResearchCosts, getResearchProject } from '../content/research';
import { normalizeLegacy } from '../persistence/saves';
import { cartCapacity } from '../content/cartUpgrades';
import { getMapNodeResourceCapacity, getSectorWorldSize, generateSector } from '../simulation/worldGeneration';
import { getNodeSize } from '../domain/nodeGeometry';
import { canPlaceNode } from '../simulation/collisions';
import type { MachineNode, NodeKind } from '../domain/types';
import { createEntry, entriesFor } from './modCatalog';

const machine = (kind: NodeKind, id: string = kind, x = 500): MachineNode => ({ id, kind, name: BASE_MOD_CONTENT.nodes[kind].name, x, y: 500, rotation: 0, input: {}, output: {}, progressMs: 0, cycleMs: 1000, constructedAt: 0, constructionMs: 0 });
function setup(nodes: MachineNode[] = []) {
  const state = createInitialState(82); state.sectors['5,5'].nodes = nodes;
  state.research.unlocked.push('kiln', 'road'); state.research.completed.push('road');
  return new GameEngine(state, { autosave: false });
}
beforeEach(() => activateMod());
afterEach(() => activateMod());

describe('data mod sharing and validation', () => {
  it('round-trips Unicode, every category and wrapped share codes without executing data', () => {
    const mod = emptyMod(); mod.name = '工場 — café 🌲'; mod.description = '<script>alert(1)</script>';
    mod.resources.wood = { name: 'Timber', color: '#abc123' };
    mod.nodes.extractor = { name: 'Collector', constructionMs: 250, cycleMultiplier: 0.5 };
    mod.recipes.charcoal = { inputs: { wood: 2 }, outputs: { charcoal: 3 }, cycleMs: 1000 };
    mod.research.assembler = { costs: { 'simple-core': 3 }, prerequisites: ['kiln'] };
    mod.rules = { cableTravelMs: 250, mapResourceMultiplier: 2 };
    const code = exportMod(mod);
    expect(code.startsWith('NODEMOD1.')).toBe(true);
    expect(importMod(` \n${code.match(/.{1,80}/g)!.join('\n')}\n `)).toEqual(mod);
  });
  it('rejects truncation, corruption and future versions', () => {
    const code = exportMod(emptyMod());
    expect(() => importMod(code.slice(0, -1))).toThrow();
    expect(() => importMod(code.replace(/.$/, code.endsWith('0') ? '1' : '0'))).toThrow(/damaged/);
    expect(() => validateMod({ ...emptyMod(), version: 2 })).toThrow(/version/);
  });
  it('rejects unknown keys, inherited prototype attacks and non-finite quantities', () => {
    const mod = emptyMod();
    expect(() => validateMod({ ...mod, script: 'alert(1)' })).toThrow(/unknown setting/);
    expect(() => validateMod(JSON.parse(JSON.stringify(mod).replace('"resources":{}', '"resources":{"__proto__":{}}')))).toThrow(/unknown base-game/);
    mod.recipes.charcoal = { cycleMs: Infinity };
    expect(() => validateMod(mod)).toThrow(/cycle time/);
    mod.recipes.charcoal = { inputs: { wood: -1 } };
    expect(() => validateMod(mod)).toThrow(/ingredients/);
  });
  it('rejects invalid references, fractional inventory counts, empty products and research cycles', () => {
    const mod = emptyMod(); mod.nodes.extractor = { recipeIds: ['missing'] };
    expect(() => validateMod(mod)).toThrow(/recipe-processing/);
    mod.nodes = {}; mod.recipes.charcoal = { outputs: {} };
    expect(() => validateMod(mod)).toThrow(/product/);
    mod.recipes.charcoal = { outputs: { charcoal: 1.5 } };
    expect(() => validateMod(mod)).toThrow(/whole number/);
    mod.recipes = {}; mod.research.assembler = { prerequisite: 'assembler' };
    expect(() => validateMod(mod)).toThrow(/dependency cycle/);
  });
  it('validates generation settings before importing a mod', () => {
    const mod = emptyMod();
    mod.nodes.lake = { worldSpawn: { minTier: 6, maxTier: 2 } };
    expect(() => validateMod(mod)).toThrow(/minimum map tier/);
    mod.nodes.lake.worldSpawn = { count: 1.5 };
    expect(() => validateMod(mod)).toThrow(/whole number/);
    mod.nodes.lake.worldSpawn = { chance: 1.01 };
    expect(() => validateMod(mod)).toThrow(/between 0 and 1/);
    mod.nodes.lake.worldSpawn = { region: 'outside' as never };
    expect(() => validateMod(mod)).toThrow(/region/);
    delete mod.nodes.lake;
    mod.nodes.lakeIntake = { worldSpawn: {} };
    expect(() => validateMod(mod)).toThrow(/does not support map spawn rules/);
  });
});

describe('applied mod behavior', () => {
  it('creates a custom item, machine, recipe, and research project and keeps them through saves', () => {
    const lab = machine('researchCenter');
    const engine = setup([lab]);
    const mod = emptyMod();
    const item = createEntry(mod, 'resources', 'Copper Powder');
    const recipe = createEntry(mod, 'recipes', 'Powdered Copper');
    const research = createEntry(mod, 'research', 'Powder Metallurgy');
    const kind = createEntry(mod, 'production', 'Powder Mill', 'refiner');
    mod.recipes[recipe] = { name: 'Powdered Copper', inputs: { copper: 2 }, outputs: { [item]: 3 }, cycleMs: 1000 };
    mod.research[research].costs = { wood: 1 };
    Object.assign(mod.nodes[kind]!, { recipeIds: [recipe], unlockResearch: research, constructionMs: 0 });

    engine.applyMod(importMod(exportMod(mod)));
    expect(engine.placeNode(kind, 1800, 900)).toBeUndefined();
    engine.selectResearch(research);
    engine.getSector().nodes[0].input.wood = 1;
    for (let step = 0; step < 50; step++) engine.tick(100);
    expect(engine.getState().research.completed).toContain(research);
    const id = engine.placeNode(kind, 1800, 900)!;
    expect(id).toBeTruthy();
    expect(engine.setRecipe(id, recipe)).toBe(true);
    const mill = engine.getSector().nodes.find(node => node.id === id)!;
    expect(getEffectiveNodeInputFamilies(mill, [])).toEqual(['copper']);
    mill.input.copper = 2;
    for (let step = 0; step < 10; step++) engine.tick(100);
    expect(mill.output[item]).toBe(3);
    expect(ITEM_NAMES[item]).toBe('Copper Powder');
    const restored = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))!, { autosave: false });
    expect(restored.getSector().nodes.find(node => node.id === id)?.output[item]).toBe(3);
    expect(() => restored.applyMod()).toThrow(/node type this mod would remove/);
    expect(getResearchProject(research)?.name).toBe('Powder Metallurgy');
    const unmodded = setup();
    expect(unmodded.getState().mod).toBeUndefined();
    expect(getResearchProject(research)).toBeUndefined();
    expect(RECIPES[recipe]).toBeUndefined();
  });

  it('generates custom reserves, builds logistics variants, and applies only selected preset rules', () => {
    const engine = setup();
    const mod = emptyMod();
    const reserve = createEntry(mod, 'obstructions', 'Zinc Outcrop', 'iron');
    const item = createEntry(mod, 'resources', 'Zinc');
    const junction = createEntry(mod, 'logistics', 'Zinc Junction', 'joint');
    const map = createEntry(mod, 'maps', 'Larger Fields');
    const cables = createEntry(mod, 'connections', 'Quick Cables');
    mod.nodes[reserve] = { name: 'Zinc Outcrop', template: 'iron', resourceItem: item, resourceCapacity: 1900, worldChance: 1 };
    mod.nodes[junction]!.unlockResearch = '';
    mod.rules.cableTravelMs = 900;
    mod.profiles!.maps!.entries[map].rules.mapWidthMultiplier = 2;
    mod.profiles!.connections!.entries[cables].rules.cableTravelMs = 250;
    engine.applyMod(mod);
    expect(modRule('mapWidthMultiplier')).toBe(2);
    expect(modRule('cableTravelMs')).toBe(250);
    expect(engine.placeNode(junction, 1500, 900)).toBeTruthy();
    const sector = generateSector(6, 5, 82);
    expect(sector.nodes.find(node => node.kind === reserve)).toMatchObject({ name: 'Zinc Outcrop', resourceItem: item, resourceRemaining: 1900 });
    delete mod.profiles!.connections!.selected;
    engine.applyMod(mod);
    expect(modRule('cableTravelMs')).toBe(900);
    expect(entriesFor('production', mod).some(([id]) => id === 'lakeIntake')).toBe(false);
    expect(entriesFor('obstructions', mod)).toEqual(expect.arrayContaining([['lake', 'Lake'], [reserve, 'Zinc Outcrop']]));
    expect(entriesFor('recipes', mod).some(([id]) => id === 'slagwashing')).toBe(false);
  });

  it('places seeded obstruction spawns on eligible new maps and restores their rules with the save', async () => {
    const engine = setup();
    const state = engine.getState();
    state.research.mapPoints = 3;
    expect(engine.unlockSector(4, 5)).toBe(true);
    const existing = structuredClone(state.sectors['4,5'].nodes);
    expect(engine.ensureSector(7, 5).nodes.some(node => node.kind === 'lake')).toBe(true);

    const mod = emptyMod();
    const reserve = createEntry(mod, 'obstructions', 'Zinc Outcrop', 'iron');
    const item = createEntry(mod, 'resources', 'Zinc');
    mod.nodes[reserve] = {
      name: 'Zinc Outcrop', template: 'iron', resourceItem: item, worldChance: 1,
      worldSpawn: { minTier: 1, maxTier: 1, chance: 1, count: 2, region: 'southeast' },
    };
    mod.nodes.lake = { worldSpawn: { mode: 'replace', chance: 0 } };
    engine.applyMod(await readModTextFile(new Blob([exportModText(mod)])));
    expect(engine.ensureSector(4, 5).nodes).toEqual(existing);
    expect(engine.ensureSector(7, 5).nodes.some(node => node.kind === 'lake' || node.kind === reserve)).toBe(false);

    const next = engine.ensureSector(6, 5);
    const field = getSectorWorldSize(next, state.research.completed);
    const outcrops = next.nodes.filter(node => node.kind === reserve);
    expect(outcrops).toHaveLength(2);
    expect(next.nodes.some(node => node.kind === 'iron')).toBe(true);
    for (const node of outcrops) {
      expect(node.x).toBeGreaterThanOrEqual(field.width / 2);
      expect(node.y).toBeGreaterThanOrEqual(field.height / 2);
      expect(node.resourceItem).toBe(item);
      expect(canPlaceNode(node, next.nodes, field)).toBe(true);
    }
    expect(engine.ensureSector(6, 5).nodes).toEqual(next.nodes);
    const reloaded = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))!);
    const base = setup();
    expect(base.ensureSector(6, 5).nodes.some(node => node.kind === reserve)).toBe(false);
    expect(reloaded.unlockSector(6, 5)).toBe(true);
    expect(reloaded.getState().sectors['6,5'].nodes).toEqual(next.nodes);
    expect(reloaded.getState().mod?.nodes[reserve]?.worldSpawn).toEqual(mod.nodes[reserve]?.worldSpawn);
  });

  it.each([
    ['lake', { resourceItem: 'water', obstructionWidth: expect.any(Number) }],
    ['big-hole', { resourceRemaining: expect.any(Number), obstructionRadius: expect.any(Number) }],
    ['monster-camp', { goblinSettlement: 'camp', attackRequirement: 3 }],
  ] as const)('generates a functional %s on a map where it does not usually spawn', (kind, fields) => {
    const engine = setup();
    expect(engine.ensureSector(6, 5).nodes.some(node => node.kind === kind)).toBe(false);
    const mod = emptyMod();
    mod.nodes[kind] = { worldSpawn: { region: 'northeast' } };
    engine.applyMod(mod);
    const sector = engine.ensureSector(6, 5);
    const field = getSectorWorldSize(sector, engine.getState().research.completed);
    const spawned = sector.nodes.find(node => node.kind === kind)!;
    expect(spawned).toMatchObject(fields);
    expect(spawned.x).toBeGreaterThanOrEqual(field.width / 2);
    expect(spawned.y).toBeLessThanOrEqual(field.height / 2);
    expect(canPlaceNode(spawned, sector.nodes, field)).toBe(true);
  });

  it('changes real recipe quantities and timings while leaving the base snapshot intact', () => {
    const kiln = machine('kiln'); kiln.recipeId = 'charcoal'; kiln.input.wood = 4;
    const engine = setup([kiln]); const mod = emptyMod();
    mod.recipes.charcoal = { inputs: { wood: 2 }, outputs: { charcoal: 3 }, cycleMs: 2000 };
    mod.nodes.kiln = { cycleMultiplier: 0.5, capacity: 10 };
    engine.applyMod(mod);
    for (let i = 0; i < 10; i++) engine.tick(100);
    expect(engine.getSector().nodes[0].output.charcoal).toBe(3);
    expect(engine.getSector().nodes[0].input.wood).toBe(2);
    expect(BASE_MOD_CONTENT.recipes.charcoal.inputs).toEqual({ wood: 1 });
  });
  it('supports chance products on a formerly deterministic base recipe', () => {
    const kiln = machine('kiln'); kiln.recipeId = 'charcoal'; kiln.input.wood = 1;
    const engine = setup([kiln]); const mod = emptyMod();
    mod.recipes.charcoal = { cycleMs: 100, chanceOutputs: [{ item: 'stone', amount: 2, probability: 1 }] };
    engine.applyMod(mod); engine.tick(100);
    expect(engine.getSector().nodes[0].output).toEqual({ charcoal: 1, stone: 2 });
  });
  it('applies construction, labels and capacities and restores base rules without deleting stock', () => {
    const cart = machine('woodenChest'); cart.output.wood = 8;
    const engine = setup([cart]); const mod = emptyMod();
    mod.nodes.woodenChest = { name: 'Carrier', capacity: 3 };
    mod.nodes.extractor = { constructionMs: 100 };
    mod.nodes.fluidStorage = { capacity: 500 };
    mod.resources.wood = { name: 'Timber' };
    engine.applyMod(mod);
    expect(cartCapacity(engine.getSector().nodes[0])).toBe(3);
    expect(engine.getSector().nodes[0].output.wood).toBe(8);
    expect(ITEM_NAMES.wood).toBe('Timber');
    const id = engine.placeNode('extractor', 1800, 500);
    expect(engine.getSector().nodes.find(n => n.id === id)?.constructionMs).toBe(100);
    engine.getState().research.unlocked.push('fluidRouting');
    const storageId = engine.placeNode('fluidStorage', 2400, 500)!;
    const storage = engine.getSector().nodes.find(n => n.id === storageId)!;
    expect(storage).toBeDefined();
    expect(storage.capacity).toBe(BASE_MOD_CONTENT.capabilities.fluidStorage.defaultCapacity);
    engine.applyMod();
    expect(engine.getSector().nodes[0].name).toBe('Cart');
    expect(cartCapacity(engine.getSector().nodes[0])).toBe(20);
    expect(ITEM_NAMES.wood).toBe('Wood');
    expect(engine.getSector().nodes[0].output.wood).toBe(8);
  });
  it('uses modded cable travel times and rejects connection counts beyond the declared limit', () => {
    const source = machine('woodenChest', 'a', 500), target = machine('woodenChest', 'b', 1000);
    source.output.wood = 1;
    const engine = setup([source, target]); const mod = emptyMod();
    mod.rules = { cableTravelMs: 300, cableLaunchMs: 100 };
    mod.nodes.woodenChest = { maxOutputConnections: 1 };
    engine.applyMod(mod); expect(engine.connect('a', 'b')).toBe(true); engine.tick(100);
    const transfer = engine.getState().inFlightTransfers!.find(t => !t.cosmeticOnly)!;
    expect(transfer.arrivesAtMs - transfer.launchedAtMs).toBe(300);
    engine.tick(100); engine.tick(100); engine.tick(100);
    const receiver = engine.getSector().nodes.find(n => n.id === 'b')!;
    expect((receiver.input.wood ?? 0) + (receiver.output.wood ?? 0)).toBe(1);
  });
  it('atomically rejects incompatible live cables and does not activate the rejected package', () => {
    const source = machine('woodenChest', 'a', 500), target = machine('woodenChest', 'b', 1000);
    const engine = setup([source, target]); expect(engine.connect('a', 'b')).toBe(true);
    const before = structuredClone(engine.getState()); const mod = emptyMod();
    mod.nodes.woodenChest = { output: [], customSockets: true, name: 'Broken' };
    expect(() => engine.applyMod(mod)).toThrow(/Disconnect/);
    expect(engine.getState()).toEqual(before);
    expect(NODE_DEFINITIONS.woodenChest.name).toBe('Cart');
    mod.nodes.woodenChest = { maxOutputConnections: 0 };
    expect(() => engine.applyMod(mod)).toThrow(/extra cables/);
  });
  it('keeps imported base socket definitions dynamic until explicitly overridden', () => {
    const assembler = machine('assembler'); assembler.recipeId = 'motor'; const engine = setup([assembler]);
    const mod = emptyMod(); mod.nodes.assembler = { input: ['ANY', 'ANY'], output: ['ANY'], recipeIds: ['motor', 'charcoal'] };
    engine.applyMod(mod);
    expect(getEffectiveNodeInputFamilies(engine.getSector().nodes[0], [])).toEqual(['iron-gear', 'copper-wire']);
    expect(RECIPE_GROUPS.assembler).toEqual(['motor', 'charcoal']);
    mod.nodes.assembler!.customSockets = true;
    engine.applyMod(mod);
    expect(getEffectiveNodeInputFamilies(engine.getSector().nodes[0], [])).toEqual(['ANY', 'ANY']);
  });
  it('updates research lookups and overrides the special Map Node pricing schedule', () => {
    const engine = setup(); const mod = emptyMod();
    mod.research.assembler = { name: 'Assembly studies', costs: { wood: 2 } };
    mod.research.mapNode = { costs: { stone: 7 }, costGrowth: 2 };
    engine.applyMod(mod);
    expect(getResearchProject('assembler')!.name).toBe('Assembly studies');
    expect(getResearchCosts(getResearchProject('assembler')!)).toEqual({ wood: 2 });
    expect(getResearchCosts(getResearchProject('mapNode')!, 2)).toEqual({ stone: 28 });
    engine.applyMod(); expect(getResearchProject('assembler')!.name).toBe('Assembler');
  });
  it('round-trips a modded save and keeps tutorial and other engines on their own rules', () => {
    const engine = setup([machine('kiln')]); const mod = emptyMod(); mod.nodes.kiln = { name: 'Oven' }; mod.rules.cableTravelMs = 250;
    engine.applyMod(mod);
    const saved = normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))!;
    const tutorial = setup(); expect(modRule('cableTravelMs')).toBe(1000);
    engine.getState(); expect(modRule('cableTravelMs')).toBe(250);
    tutorial.tick(100); expect(modRule('cableTravelMs')).toBe(1000);
    const loaded = new GameEngine(saved, { autosave: false });
    expect(loaded.getState().mod).toEqual(mod); expect(loaded.getSector().nodes[0].name).toBe('Oven');
    loaded.applyMod(); expect(loaded.getSector().nodes[0].name).toBe('Kiln');
  });
  it('restores the package with undo and activates it after replacing a save', () => {
    const engine = setup(); const mod = emptyMod(); mod.resources.iron = { name: 'Ferrous paperwork' };
    engine.applyMod(mod); engine.undo(); expect(engine.getState().mod).toBeUndefined(); expect(ITEM_NAMES.iron).toBe('Iron');
    const replacement = createInitialState(45); replacement.mod = mod;
    engine.replaceState(replacement); expect(ITEM_NAMES.iron).toBe('Ferrous paperwork');
    expect(RECIPES.charcoal).toEqual(BASE_MOD_CONTENT.recipes.charcoal);
  });
  it('changes generated reserves and field dimensions without rewriting an existing reserve', () => {
    const engine = new GameEngine(createInitialState(55), { autosave: false });
    const forest = engine.getSector().nodes.find(n => n.kind === 'forest')!;
    const before = forest.resourceRemaining;
    const mod = emptyMod(); mod.rules = { mapResourceMultiplier: 2, mapWidthMultiplier: 1.5 }; mod.nodes.forest = { resourceCapacity: 9000 };
    engine.applyMod(mod);
    expect(getMapNodeResourceCapacity(6, 5)).toBe(3000);
    expect(getSectorWorldSize({ x: 5, y: 5 }, []).width).toBe(5400);
    const fresh = generateSector(6, 5, 55);
    expect(fresh.nodes.find(n => n.kind === 'forest')!.resourceCapacity).toBe(9000);
    expect(forest.resourceRemaining).toBe(before);
  });
  it('uses the same modded obstruction footprint for rendering and collision geometry', () => {
    const hole = machine('big-hole'); const engine = setup([hole]); const before = getNodeSize(hole);
    const mod = emptyMod(); mod.nodes['big-hole'] = { obstructionScale: 0.5 }; engine.applyMod(mod);
    expect(getNodeSize(hole)).toEqual({ w: before.w / 2, h: before.h / 2 });
  });
  it('accepts and consumes modded research ingredients through the real Research Center socket', () => {
    const source = machine('woodenChest', 'supply', 500), center = machine('researchCenter', 'science', 1100);
    source.output.wood = 2;
    const engine = setup([source, center]); const mod = emptyMod();
    mod.research.assembler = { costs: { wood: 2 } };
    mod.nodes.researchCenter = { cycleMultiplier: 0.1 };
    mod.rules = { cableTravelMs: 100, cableLaunchMs: 100 };
    engine.applyMod(mod); engine.selectResearch('assembler');
    expect(engine.connect('supply', 'science')).toBe(true);
    for (let i = 0; i < 20; i++) engine.tick(100);
    expect(engine.getState().research.completed).toContain('assembler');
    expect(engine.getSector().nodes.find(n => n.id === 'supply')!.output.wood ?? 0).toBe(0);
  });
  it('keeps the Cart total-capacity rule even when a mod declares a larger input buffer', () => {
    const source = machine('woodenChest', 'source', 500), target = machine('woodenChest', 'target', 1000);
    source.output.wood = 2; target.output.wood = 2;
    const engine = setup([source, target]); const mod = emptyMod();
    mod.nodes.woodenChest = { capacity: 3, inputCapacity: 20 };
    mod.rules = { cableTravelMs: 100, cableLaunchMs: 100 };
    engine.applyMod(mod); expect(engine.connect('source', 'target')).toBe(true);
    for (let i = 0; i < 10; i++) engine.tick(100);
    const cart = engine.getSector().nodes.find(n => n.id === 'target')!;
    expect((cart.input.wood ?? 0) + (cart.output.wood ?? 0)).toBe(3);
  });
  it('creates clean base games and tutorials even while another factory uses modified natural nodes', () => {
    const engine = setup(); const mod = emptyMod();
    mod.nodes.forest = { name: 'Paperwork plantation', resourceCapacity: 9999 };
    engine.applyMod(mod);
    const clean = createInitialState(45);
    expect(clean.mod).toBeUndefined();
    expect(clean.sectors['5,5'].nodes.find(n => n.kind === 'forest')!.name).toBe('Forest');
    expect(clean.sectors['5,5'].nodes.find(n => n.kind === 'forest')!.resourceCapacity).toBe(1000);
    engine.getState(); expect(NODE_DEFINITIONS.forest.name).toBe('Paperwork plantation');
  });
  it('rejects invalid packages embedded in saves and leaves the loaded factory intact on failed replacement', () => {
    const engine = setup(); const invalid = createInitialState(88);
    invalid.mod = emptyMod(); invalid.mod.recipes.charcoal = { cycleMs: -1 };
    expect(normalizeLegacy(JSON.parse(JSON.stringify(invalid)))).toBeNull();
    const before = engine.getState(); expect(() => engine.replaceState(invalid)).toThrow();
    expect(engine.getState()).toBe(before);
  });
});
