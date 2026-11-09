import { describe, expect, it } from 'vitest';
import { GameEngine, createInitialState } from './engine';
import { createHomeSector, generateSector, getBigHoleStoneRequirementForRadius, getMapNodeMaximumResourceCapacity, getMapNodeResourceCapacity, getMythrilSpawnChance, getSectorWorldSize, sectorDistance } from './worldGeneration';
import { nodesOverlap } from './collisions';
import { NODE_MODULES } from '../content/nodeModules';
import { getEffectiveNodeInputFamilies, getNodeInputFamilies, INVENTORY_UNLOCK_ID, isNodeUnlocked, NODE_DEFINITIONS } from '../content/nodes';
import { RECIPES } from '../content/recipes';
import { getResearchCosts, isResearchAvailable, RESEARCH_PROJECTS } from '../content/research';
import { normalizeLegacy } from '../persistence/saves';
import { portFamiliesCompatible } from './connectionRules';
import type { MachineNode } from '../domain/types';
import { getPortAnchor } from '../renderer/nodeLayout';

describe('simulation architecture', () => {
  it('places new Extractors with the same five-second base cycle as the starting ones', () => {
    const engine = new GameEngine(createInitialState(23));
    const id = engine.placeNode('extractor', 2850, 300)!;
    expect(id).toBeTruthy();
    expect(engine.getSector().nodes.find((node) => node.id === id)?.cycleMs).toBe(5000);
    expect(engine.getSector().nodes.filter((node) => node.kind === 'extractor').every((node) => node.cycleMs === 5000)).toBe(true);
  });
  it('normalizes older fast Extractors on initial load and save replacement', () => {
    const state = createInitialState(23);
    state.sectors['5,5'].nodes.find((node) => node.kind === 'extractor')!.cycleMs = 1000;
    const engine = new GameEngine(state);
    expect(engine.getSector().nodes.filter((node) => node.kind === 'extractor').every((node) => node.cycleMs === 5000)).toBe(true);
    engine.replaceState(state);
    expect(engine.getSector().nodes.filter((node) => node.kind === 'extractor').every((node) => node.cycleMs === 5000)).toBe(true);
    engine.getState().research.completed.push('extractor2');
    const extractor = engine.getSector().nodes.find((node) => node.kind === 'extractor')!;
    const forest = engine.getSector().nodes.find((node) => node.kind === 'forest')!;
    expect(engine.connect(forest.id, extractor.id)).toBe(true);
    for (let i = 0; i < 39; i++) engine.tick(100);
    expect(extractor.output.wood ?? 0).toBe(0);
    engine.tick(100);
    expect(extractor.output.wood).toBe(1);
    expect(extractor.cycleMs).toBe(5000);
  });
  it('previews node placement with the same collision rules as construction', () => {
    const engine = new GameEngine(createInitialState(23)); const forest = engine.getSector().nodes.find((node) => node.kind === 'forest')!;
    expect(engine.getNodePlacementPreview('extractor', forest.x, forest.y)?.valid).toBe(false);
    expect(engine.getNodePlacementPreview('extractor', 2850, 300)?.valid).toBe(true);
  });

  it('keeps Inventory behind its reserved future unlock', () => {
    expect(isNodeUnlocked('inventory', [])).toBe(false);
    expect(isNodeUnlocked('inventory', [INVENTORY_UNLOCK_ID])).toBe(true);
  });

  it('keeps the Forest reforestation input locked until Tree Planter research completes', () => {
    const engine = new GameEngine(createInitialState(24));
    const state = engine.getState();
    const forest = engine.getSector().nodes.find((node) => node.kind === 'forest')!;
    const planter: MachineNode = {
      id: 'test-planter', kind: 'treePlanter', name: 'Tree Planter', x: 900, y: 900, rotation: 0,
      input: {}, output: { 'forest-growth': 1 }, progressMs: 0, cycleMs: 1000, constructedAt: 0, constructionMs: 0,
    };

    expect(getNodeInputFamilies('forest', state.research.completed)).toEqual([]);
    expect(portFamiliesCompatible(planter, 0, forest, 0, state.research.completed)).toBe(false);
    expect((engine as unknown as { accepts(node: MachineNode, item: 'forest-growth'): boolean }).accepts(forest, 'forest-growth')).toBe(false);

    state.research.completed.push('treePlanter');
    expect(getNodeInputFamilies('forest', state.research.completed)).toEqual(['forest-growth']);
    expect(portFamiliesCompatible(planter, 0, forest, 0, state.research.completed)).toBe(true);
    expect((engine as unknown as { accepts(node: MachineNode, item: 'forest-growth'): boolean }).accepts(forest, 'forest-growth')).toBe(true);
  });

  it('removes locked Forest input connections when loading an older save', () => {
    const state = createInitialState(25);
    const forest = state.sectors[state.activeSectorId].nodes.find((node) => node.kind === 'forest')!;
    forest.input['forest-growth'] = 1;
    state.sectors[state.activeSectorId].connections.push({ id: 'legacy-growth', from: 'ironExtractor', to: forest.id, fromPort: 0, toPort: 0, createdAt: 0 });
    state.inFlightTransfers = [{ id: 'legacy-transfer', connectionId: 'legacy-growth', sectorId: state.activeSectorId, from: 'ironExtractor', to: forest.id, item: 'forest-growth', launchedAtMs: 0, arrivesAtMs: 1000 }];

    const engine = new GameEngine(state);
    expect(engine.getSector().connections).toHaveLength(0);
    expect(engine.getState().inFlightTransfers).toHaveLength(0);
    expect(engine.getSector().nodes.find((node) => node.id === forest.id)?.input['forest-growth']).toBeUndefined();
  });

  it('generates remote sectors deterministically from seed and coordinate', () => {
    const first = generateSector(8, 4, 12345, 1);
    const second = generateSector(8, 4, 12345, 1);
    expect(second.nodes).toEqual(first.nodes);
  });

  it('starts every generated field without node collisions', () => {
    [createHomeSector(1), generateSector(8, 4, 12345, 1), generateSector(10, 10, 98765, 1)].forEach((sector) => {
      const field = getSectorWorldSize(sector, []);
      sector.nodes.forEach((node, index) => {
        expect(node.x).toBeGreaterThan(0);
        expect(node.x).toBeLessThan(field.width);
        sector.nodes.slice(index + 1).forEach((other) => expect(nodesOverlap(node, other)).toBe(false));
      });
    });
  });

  it('starts with the exact source-game home node setup', () => {
    const home = createHomeSector(1);
    expect(home.nodes.map((node) => ({ id: node.id, kind: node.kind }))).toEqual([
      { id: 'forest', kind: 'forest' },
      { id: 'copper', kind: 'copper' },
      { id: 'iron', kind: 'iron' },
      { id: 'ironExtractor', kind: 'extractor' },
      { id: 'extractor-2', kind: 'extractor' },
    ]);
    expect(home.connections).toEqual([]);
    expect(home.nodes.filter((node) => node.resourceItem).map((node) => ({
      item: node.resourceItem,
      remaining: node.resourceRemaining,
      capacity: node.resourceCapacity,
    }))).toEqual([
      { item: 'wood', remaining: 1000, capacity: 1000 },
      { item: 'copper', remaining: 1000, capacity: 1000 },
      { item: 'iron', remaining: 1000, capacity: 1000 },
    ]);
    expect(home.nodes.filter((node) => node.kind === 'extractor').every((node) => node.cycleMs === 5000 && node.constructionMs === 0)).toBe(true);
  });

  it('uses the source-game world-map tier resource rules', () => {
    expect(getMapNodeMaximumResourceCapacity(5, 5)).toBe(1000);
    expect(getMapNodeMaximumResourceCapacity(5, 4)).toBe(1500);
    expect(getMapNodeMaximumResourceCapacity(0, 1)).toBe(5500);
    expect(getMapNodeMaximumResourceCapacity(0, 0)).toBe(6000);
    expect(getMapNodeResourceCapacity(5, 4)).toBe(1500);
    expect(getMapNodeResourceCapacity(0, 1)).toBe(5500);
    expect(getMapNodeResourceCapacity(0, 0)).toBe(0);
    expect(getMythrilSpawnChance(3)).toBe(0);
    expect(getMythrilSpawnChance(4)).toBe(0);
    expect(getMythrilSpawnChance(9)).toBe(0);
    expect(getMythrilSpawnChance(10)).toBe(0);

    const tierNine = generateSector(0, 1, 12345, 1);
    expect(tierNine.nodes.filter((node) => node.resourceItem).map((node) => node.resourceItem)).toEqual(expect.arrayContaining(['iron', 'copper', 'stone', 'wood']));
    const tierTen = generateSector(0, 0, 12345, 1);
    expect(tierTen.nodes.map(n=>n.kind)).toEqual(['cornerChallenge','cornerTribute']);
  });

  it('reserves room for the tier-one and tier-two camps and guaranteed Lake', () => {
    const tierOne = [[5, 4], [6, 5], [5, 6], [4, 5]].map(([x, y]) => generateSector(x, y, 98765, 1));
    const tierTwoCoordinates = Array.from({ length: 121 }, (_, index) => [index % 11, Math.floor(index / 11)] as const)
      .filter(([x, y]) => Math.abs(x - 5) + Math.abs(y - 5) === 2);
    const tierTwo = tierTwoCoordinates.map(([x, y]) => generateSector(x, y, 98765, 1));
    expect(tierOne.filter((sector) => sector.nodes.some((node) => node.kind === 'monster-camp'))).toHaveLength(1);
    expect(tierTwo.filter((sector) => sector.nodes.some((node) => node.kind === 'monster-camp'))).toHaveLength(2);
    expect(tierTwo.filter((sector) => sector.nodes.some((node) => node.kind === 'lake')).length).toBeGreaterThanOrEqual(5);
    expect(tierTwo.filter((sector) => sector.nodes.some((node) => node.kind === 'lake')).length).toBeLessThanOrEqual(6);
    expect(tierTwo.find(sector => sector.id === '7,5')!.nodes.some(node => node.kind === 'lake')).toBe(true);
  });

  it('uses the source-game obstruction area, geometry, and fill rules', () => {
    const tierOne = generateSector(5, 4, 98765, 1);
    const field = getSectorWorldSize(tierOne, []);
    const holes = tierOne.nodes.filter((node) => node.kind === 'big-hole');
    const holeArea = holes.reduce((total, hole) => total + Math.PI * (hole.obstructionRadius ?? 0) ** 2, 0);
    expect(holeArea / (field.width * field.height)).toBeCloseTo(.15, 5);
    expect(holes.length).toBeGreaterThanOrEqual(1);
    expect(holes.length).toBeLessThanOrEqual(5);
    expect(holes.every((hole) => (hole.resourceRemaining ?? 0) >= 20 && (hole.resourceRemaining ?? 0) <= 500)).toBe(true);

    const tierTwo = Array.from({ length: 121 }, (_, index) => [index % 11, Math.floor(index / 11)] as const)
      .filter(([x, y]) => Math.abs(x - 5) + Math.abs(y - 5) === 2)
      .map(([x, y]) => generateSector(x, y, 98765, 1));
    const lakeSector = tierTwo.find((sector) => sector.nodes.some((node) => node.kind === 'lake'))!;
    const lake = lakeSector.nodes.find((node) => node.kind === 'lake')!;
    const lakeField = getSectorWorldSize(lakeSector, []);
    const lakeAreaRatio = Math.PI * (lake.obstructionWidth ?? 0) * (lake.obstructionHeight ?? 0) / 4 / (lakeField.width * lakeField.height);
    expect(lakeAreaRatio).toBeGreaterThanOrEqual(.15);
    expect(lakeAreaRatio).toBeLessThan(.25);
    expect(tierTwo.flatMap((sector) => sector.nodes).filter((node) => node.kind === 'monster-camp').every((camp) => camp.obstructionMaxRadius === 600 && camp.campStrength === 25)).toBe(true);
  });

  it.each([
    { x: 5, y: 4, tier: 1, coverage: .15, maximum: 500 },
    { x: 5, y: 0, tier: 5, coverage: .25, maximum: 2250 },
    { x: 1, y: 0, tier: 9, coverage: .35, maximum: 4000 },
  ])('prices tier-$tier holes by their relative field size', ({ x, y, tier, coverage, maximum }) => {
    const field = getSectorWorldSize({ x, y }, []);
    const largeRadius = Math.sqrt(field.width * field.height * coverage / Math.PI);
    const smallRadius = largeRadius / 2;
    const smallBill = getBigHoleStoneRequirementForRadius(smallRadius, tier, field);
    expect(getBigHoleStoneRequirementForRadius(largeRadius, tier, field)).toBe(maximum);
    expect(smallBill).toBeLessThan(maximum);
    const expandedField = getSectorWorldSize({ x, y }, ['areaExpansion2']);
    expect(getBigHoleStoneRequirementForRadius(smallRadius * 1.5, tier, expandedField)).toBe(smallBill);
  });

  it.each([1, 26, 37, 98765, 2147483647])('balances encounters by quadrant and keeps 20 clear outposts for seed %i', seed => {
    const clearByTier = Array<number>(10).fill(0);
    const lakesByTier = Array<number>(11).fill(0);
    const quadrants = Array.from({ length: 4 }, () => ({ camps: 0, lakes: 0, golems: 0 }));
    for (let y = 0; y < 11; y++) for (let x = 0; x < 11; x++) {
      const tier = sectorDistance(x, y);
      if (tier === 0) continue;
      const sector = generateSector(x, y, seed, 1);
      const { nodes } = sector;
      const quadrant = x <= 5 && y < 5 ? 0 : x > 5 && y <= 5 ? 1 : x >= 5 && y > 5 ? 2 : 3;
      const counts = quadrants[quadrant];
      if (nodes.some(node => node.kind === 'monster-camp')) counts.camps++;
      if (nodes.some(node => node.kind === 'resourceGolem')) {
        expect(x).not.toBe(5);
        expect(y).not.toBe(5);
        counts.golems++;
      }
      const holes = nodes.filter(node => node.kind === 'big-hole');
      if (nodes.some(node => node.kind === 'lake')) {
        lakesByTier[tier]++;
        counts.lakes++;
        expect(nodes.some(node => ['big-hole', 'monster-camp', 'resourceGolem'].includes(node.kind))).toBe(false);
        expect(nodes.filter(node => node.kind !== 'lake').map(node => node.resourceItem).filter(Boolean).sort()).toEqual(['copper', 'iron', 'stone', 'wood']);
        continue;
      }
      if (tier === 10) continue;
      if (nodes.some(node => node.kind === 'monster-camp')) expect(holes.length).toBeGreaterThan(0);
      if (holes.length) {
        const field = getSectorWorldSize(sector, []);
        const holeArea = holes.reduce((total, hole) => total + Math.PI * (hole.obstructionRadius ?? 0) ** 2, 0);
        expect(holeArea / (field.width * field.height)).toBeCloseTo(.15 + .025 * (tier - 1), 5);
        continue;
      }
      if (nodes.some(node => ['lake', 'resourceGolem', 'monster-camp'].includes(node.kind))) continue;
      clearByTier[tier]++;
      expect(nodes.map(node => node.resourceItem).sort()).toEqual(['copper', 'iron', 'stone', 'wood']);
    }
    expect(lakesByTier.slice(3)).toEqual([1, 1, 1, 1, 1, 1, 1, 0]);
    expect(quadrants.map(counts => counts.golems)).toEqual([1, 1, 1, 1]);
    expect(quadrants.map(counts => counts.camps).sort()).toEqual([7, 7, 8, 8]);
    const lakesByQuadrant = quadrants.map(counts => counts.lakes).sort();
    expect(lakesByQuadrant).toEqual(lakesByTier[2] === 5 ? [3, 3, 3, 3] : [3, 3, 3, 4]);
    expect(clearByTier).toEqual([0, 1, 0, 3, 3, 3, 4, 3, 2, 1]);
    expect(generateSector(6, 5, seed, 1).nodes.map(node => node.resourceItem).sort()).toEqual(['copper', 'iron', 'stone', 'wood']);
  });

  it('opens a clear E1 through normal expansion and keeps Deep Holes already saved there', () => {
    const state = createInitialState(98765);
    state.research.mapPoints = 1;
    const engine = new GameEngine(state);
    expect(engine.unlockSector(6, 5)).toBe(true);
    expect(engine.getState().sectors['6,5'].nodes.map(node => node.resourceItem).sort()).toEqual(['copper', 'iron', 'stone', 'wood']);

    const saved = structuredClone(engine.getState());
    const previousHole = generateSector(5, 4, 98765, 1).nodes.find(node => node.kind === 'big-hole')!;
    saved.sectors['6,5'].nodes.push(previousHole);
    const loaded = new GameEngine(normalizeLegacy(saved)!);
    expect(loaded.getState().sectors['6,5'].nodes.find(node => node.id === previousHole.id)).toMatchObject({
      kind: 'big-hole', x: previousHole.x, y: previousHole.y, resourceRemaining: previousHole.resourceRemaining,
    });
  });

  it('keeps deposits passive and lets Extractors mine their connected reserve', () => {
    const engine = new GameEngine(createInitialState(17));
    const sector = engine.getSector();
    const forest = sector.nodes.find((node) => node.id === 'forest')!;
    const extractor = sector.nodes.find((node) => node.id === 'ironExtractor')!;
    engine.tick(5000);
    expect(forest.resourceRemaining).toBe(1000);
    expect(forest.output.wood ?? 0).toBe(0);

    forest.resourceRemaining = 999;
    for (let index = 0; index < 29; index++) engine.tick(1000);
    engine.tick(999);
    expect(forest.resourceRemaining).toBe(999);
    engine.tick(1);
    expect(forest.resourceRemaining).toBe(1000);

    expect(engine.connect(forest.id, extractor.id)).toBe(true);
    for (let index = 0; index < 4; index++) engine.tick(1000);
    engine.tick(999);
    expect(extractor.output.wood ?? 0).toBe(0);
    engine.tick(1);
    expect(forest.resourceRemaining).toBe(999);
    expect(extractor.output.wood).toBe(1);
    expect(engine.getState().inFlightTransfers?.some((transfer) => transfer.cosmeticOnly && transfer.connectionId === sector.connections[0].id)).toBe(true);
  });

  it('collapses depleted deposits into a 250-stone hole and waits for the player to clear it', () => {
    const engine = new GameEngine(createInitialState(21));
    const sector = engine.getSector();
    const copper = sector.nodes.find((node) => node.id === 'copper')!;
    const extractor = sector.nodes.find((node) => node.id === 'extractor-2')!;
    copper.resourceRemaining = 1;
    expect(engine.connect(copper.id, extractor.id)).toBe(true);
    for (let index = 0; index < 5; index++) engine.tick(1000);
    engine.tick(1);
    expect(copper.kind).toBe('big-hole');
    expect(copper.resourceRemaining).toBe(250);
    expect(copper.obstructionRadius).toBeCloseTo(38 * Math.sqrt(10));
    copper.holeStoneConsumed = 249;
    copper.resourceRemaining = 1;
    copper.input.stone = 1;
    engine.tick(1);
    expect(sector.nodes).toContain(copper);
    expect(copper.resourceRemaining).toBe(0);
    expect(engine.clearFilledBigHole(copper.id)).toBe(true);
    expect(sector.nodes).not.toContain(copper);
  });

  it('keeps simulation state independent of renderer state', () => {
    const engine = new GameEngine(createInitialState(7));
    const before = engine.getSector().nodes.length;
    const id = engine.placeNode('kiln', 2800, 1200);
    expect(id).toBeTruthy();
    expect(engine.getSector().nodes).toHaveLength(before + 1);
    engine.undo();
    expect(engine.getSector().nodes).toHaveLength(before);
  });

  it('copies selected buildable nodes and their internal links into valid nearby space', () => {
    const engine = new GameEngine(createInitialState(71));
    const kilnId = engine.placeNode('kiln', 1900, 500)!;
    const smelterId = engine.placeNode('smelter', 2200, 500)!;
    expect(engine.setRecipe(smelterId, 'smelt-iron')).toBe(true);
    expect(engine.connect(kilnId, smelterId)).toBe(true);
    const source = engine.getSector().nodes.filter((node) => [kilnId, smelterId].includes(node.id));
    const copyIds = engine.duplicateNodes([kilnId, smelterId]);
    expect(copyIds).toHaveLength(2);
    const copies = engine.getSector().nodes.filter((node) => copyIds.includes(node.id));
    expect(copies).toHaveLength(2);
    expect(copies[1].x - copies[0].x).toBe(source[1].x - source[0].x);
    expect(copies[1].y - copies[0].y).toBe(source[1].y - source[0].y);
    expect(engine.getSector().connections.some((connection) => copyIds.includes(connection.from) && copyIds.includes(connection.to))).toBe(true);
  });

  it('undoes keyboard-style logistics rotation', () => {
    const engine = new GameEngine(createInitialState(72));
    const id = engine.placeNode('splitter', 1900, 700)!;
    const node = engine.getSector().nodes.find((candidate) => candidate.id === id)!;
    engine.rotateNode(id);
    expect(node.rotation).toBe(90);
    engine.undo();
    expect(engine.getSector().nodes.find((candidate) => candidate.id === id)?.rotation).toBe(0);
  });

  it('repositions production connectors without changing their stable connection indexes', () => {
    const engine = new GameEngine(createInitialState(73));
    const id = engine.placeNode('smelter', 1900, 700)!;
    const node = engine.getSector().nodes.find((candidate) => candidate.id === id)!;
    const firstInputBefore = getPortAnchor(node, 'input', 0);
    const outputBefore = getPortAnchor(node, 'output', 0);

    engine.cycleNodeInputOrder(id);
    expect(node.inputPortOrder).toEqual([1, 0]);
    expect(getPortAnchor(node, 'input', 0).y).toBeGreaterThan(firstInputBefore.y);

    engine.cycleNodeOutputPosition(id);
    expect(node.outputRowOffset).toBe(1);
    expect(getPortAnchor(node, 'output', 0).y).toBeGreaterThan(outputBefore.y);

    engine.undo();
    expect(engine.getSector().nodes.find((candidate) => candidate.id === id)?.outputRowOffset).toBeUndefined();
  });

  it('routes switched Smelter sockets by ingredient and keeps a separate buffer for each input', () => {
    const engine = new GameEngine(createInitialState(74));
    const sector = engine.getSector();
    engine.getState().research.unlocked.push('road');
    const chestId = engine.placeNode('woodenChest', 1900, 700)!;
    const smelterId = engine.placeNode('smelter', 2350, 700)!;
    expect(engine.setRecipe(smelterId, 'smelt-iron')).toBe(true);
    const chest = sector.nodes.find((node) => node.id === chestId)!;
    const smelter = sector.nodes.find((node) => node.id === smelterId)!;

    engine.cycleNodeInputOrder(smelterId);
    expect(smelter.inputPortOrder).toEqual([1, 0]);
    expect(engine.connectPorts(chestId, 0, smelterId, 0)).toBe(true);
    expect(engine.connectPorts(chestId, 0, smelterId, 1)).toBe(true);

    smelter.input.iron = 5;
    chest.output.charcoal = 1;
    chest.output.iron = 1;
    engine.tick(400);

    expect(chest.output.charcoal).toBe(0);
    expect(chest.output.iron).toBe(1);
    expect(engine.getState().inFlightTransfers).toHaveLength(1);
    expect(engine.getState().inFlightTransfers?.[0].item).toBe('charcoal');
    expect(engine.getState().inFlightTransfers?.[0].connectionId).toBe(sector.connections.find((connection) => connection.toPort === 1)?.id);

    engine.tick(1000);
    expect(smelter.input.iron).toBe(5);
    expect(smelter.input.charcoal).toBe(1);
  });

  it('keeps the selected Smelter recipe fixed instead of adapting to incoming metal', () => {
    const engine = new GameEngine(createInitialState(75));
    const sector = engine.getSector();
    engine.getState().research.unlocked.push('road');
    const chestId = engine.placeNode('woodenChest', 1900, 700)!;
    const smelterId = engine.placeNode('smelter', 2350, 700)!;
    const chest = sector.nodes.find(node => node.id === chestId)!;
    const smelter = sector.nodes.find(node => node.id === smelterId)!;
    expect(engine.setRecipe(smelterId, 'smelt-copper')).toBe(true);
    smelter.input.charcoal = 3;
    chest.output = { iron: 1, copper: 1 };

    expect(engine.connectPorts(chestId, 0, smelterId, 0)).toBe(true);
    engine.tick(400);
    expect(smelter.recipeId).toBe('smelt-copper');
    expect(smelter.input.charcoal).toBe(3);
    expect(getEffectiveNodeInputFamilies(smelter, [])).toEqual(['copper', 'charcoal']);
    engine.tick(1000);
    expect(smelter.input.copper).toBe(1);
    expect(smelter.input.iron).toBeUndefined();
    expect(chest.output.iron).toBe(1);
  });

  it('keeps Refiner material fixed until the player changes the recipe', () => {
    const engine = new GameEngine(createInitialState(76));
    const sector = engine.getSector();
    engine.getState().research.unlocked.push('road');
    const chestId = engine.placeNode('woodenChest', 1900, 700)!;
    const refinerId = engine.placeNode('refiner', 2350, 700)!;
    const chest = sector.nodes.find((node) => node.id === chestId)!;
    const refiner = sector.nodes.find((node) => node.id === refinerId)!;
    expect(refiner.recipeId).toBeUndefined();
    expect(engine.setRecipe(refinerId, 'iron-gear')).toBe(true);
    chest.output['mythril-plate'] = 1;

    expect(engine.connectPorts(chestId, 0, refinerId, 0)).toBe(false);
    engine.tick(400);
    expect(refiner.recipeId).toBe('iron-gear');
    expect(chest.output['mythril-plate']).toBe(1);
    expect(refiner.input).toEqual({});
    expect(getEffectiveNodeInputFamilies(refiner, [])).toEqual(['iron-plate']);

    engine.getState().research.completed.push('mithrilTools');
    expect(engine.setRecipe(refinerId, 'mythril-gear')).toBe(true);
    expect(engine.connectPorts(chestId, 0, refinerId, 0)).toBe(true);
    engine.tick(400);
    expect(refiner.recipeId).toBe('mythril-gear');
    expect(getEffectiveNodeInputFamilies(refiner, [])).toEqual(['mythril-plate']);

    engine.setRecipe(refinerId, 'brick');
    expect(getEffectiveNodeInputFamilies(refiner, [])).toEqual(['stone']);
  });

  it('keeps Assembler ingredients bound to their stable sockets after visual swapping', () => {
    const engine = new GameEngine(createInitialState(77));
    const sector = engine.getSector();
    engine.getState().research.unlocked.push('road');
    const firstChestId = engine.placeNode('woodenChest', 1750, 650)!;
    engine.getState().research.unlocked.push('road');
    const secondChestId = engine.placeNode('woodenChest', 1750, 1000)!;
    const assemblerId = engine.placeNode('assembler', 2350, 800)!;
    const firstChest = sector.nodes.find((node) => node.id === firstChestId)!;
    const secondChest = sector.nodes.find((node) => node.id === secondChestId)!;
    const assembler = sector.nodes.find((node) => node.id === assemblerId)!;
    expect(assembler.recipeId).toBeUndefined();
    expect(engine.setRecipe(assemblerId, 'motor')).toBe(true);
    engine.cycleNodeInputOrder(assemblerId);

    expect(getEffectiveNodeInputFamilies(assembler, [])).toEqual(['iron-gear', 'copper-wire']);
    expect(engine.connectPorts(firstChestId, 0, assemblerId, 0)).toBe(true);
    expect(engine.connectPorts(secondChestId, 0, assemblerId, 1)).toBe(true);
    firstChest.output['copper-wire'] = 1;
    secondChest.output['copper-wire'] = 1;
    engine.tick(400);

    expect(firstChest.output['copper-wire']).toBe(1);
    expect(secondChest.output['copper-wire']).toBe(0);
    expect(engine.getState().inFlightTransfers?.[0].to).toBe(assemblerId);
    expect(engine.getState().inFlightTransfers?.[0].item).toBe('copper-wire');
  });

  it('uses the source-game configurable recipe lifecycle', () => {
    const engine = new GameEngine(createInitialState(79));
    const sector = engine.getSector();
    const sourceId = engine.placeNode('refiner', 1750, 650)!;
    const assemblerId = engine.placeNode('assembler', 2350, 800)!;
    engine.getState().research.unlocked.push('road');
    const chestId = engine.placeNode('woodenChest', 2900, 800)!;
    const source = sector.nodes.find((node) => node.id === sourceId)!;
    const assembler = sector.nodes.find((node) => node.id === assemblerId)!;

    expect(assembler.recipeId).toBeUndefined();
    expect(assembler.cycleMs).toBe(0);
    expect(engine.setRecipe(sourceId, 'iron-gear')).toBe(true);
    expect(engine.setRecipe(assemblerId, 'motor')).toBe(true);
    expect(assembler.cycleMs).toBe(RECIPES.motor.cycleMs);
    expect(engine.connectPorts(sourceId, 0, assemblerId, 0)).toBe(true);
    expect(engine.connectPorts(assemblerId, 0, chestId, 0)).toBe(true);

    source.output['iron-gear'] = 1;
    assembler.input['copper-wire'] = 4;
    assembler.output.motor = 2;
    assembler.progressMs = 900;

    expect(engine.setRecipe(assemblerId, 'circuit-a')).toBe(true);
    expect(assembler.input).toEqual({});
    expect(assembler.output).toEqual({});
    expect(assembler.progressMs).toBe(0);
    expect(assembler.cycleMs).toBe(RECIPES['circuit-a'].cycleMs);
    expect(sector.connections.some((connection) => connection.from === sourceId && connection.to === assemblerId)).toBe(false);
    expect(sector.connections.some((connection) => connection.from === assemblerId && connection.to === chestId)).toBe(true);
  });

  it('gates advanced configurable recipes behind their original research', () => {
    const engine = new GameEngine(createInitialState(80));
    const assemblerId = engine.placeNode('assembler', 2350, 800)!;
    const assembler = engine.getSector().nodes.find((node) => node.id === assemblerId)!;

    expect(engine.setRecipe(assemblerId, 'automata-core')).toBe(false);
    expect(engine.setRecipe(assemblerId, 'suppression-bot')).toBe(false);
    expect(assembler.recipeId).toBeUndefined();

    engine.getState().research.completed.push('automataCore', 'suppressionBot');
    expect(engine.setRecipe(assemblerId, 'automata-core')).toBe(true);
    expect(engine.setRecipe(assemblerId, 'suppression-bot')).toBe(true);
  });

  it('only lets a Merger combine matching typed streams', () => {
    const engine = new GameEngine(createInitialState(78));
    const kilnId = engine.placeNode('kiln', 1750, 650)!;
    const smelterId = engine.placeNode('smelter', 1750, 1000)!;
    expect(engine.setRecipe(smelterId, 'smelt-iron')).toBe(true);
    const mergerId = engine.placeNode('merger', 2350, 800)!;

    expect(engine.connectPorts(kilnId, 0, mergerId, 0)).toBe(true);
    expect(engine.connectPorts(smelterId, 0, mergerId, 1)).toBe(false);
  });

  it('keeps source-game world nodes fixed when movement is requested', () => {
    const engine = new GameEngine(createInitialState(5));
    const forest = engine.getSector().nodes.find((node) => node.kind === 'forest')!;
    const before = { x: forest.x, y: forest.y };
    engine.moveNodes([forest.id], 300, 200);
    expect({ x: forest.x, y: forest.y }).toEqual(before);
  });

  it('delivers routed items only when their one-second cable animation arrives', () => {
    const engine = new GameEngine(createInitialState(6));
    const sector = engine.getSector();
    const kilnId = engine.placeNode('kiln', 1900, 500)!;
    const smelterId = engine.placeNode('smelter', 2350, 500)!;
    expect(engine.setRecipe(smelterId, 'smelt-iron')).toBe(true);
    expect(engine.connect(kilnId, smelterId)).toBe(true);
    const kiln = sector.nodes.find((node) => node.id === kilnId)!;
    const smelter = sector.nodes.find((node) => node.id === smelterId)!;
    kiln.output.charcoal = 1;
    engine.tick(400);
    expect(kiln.output.charcoal).toBe(0);
    expect(smelter.input.charcoal ?? 0).toBe(0);
    expect(engine.getState().inFlightTransfers).toHaveLength(1);
    engine.tick(999);
    expect(smelter.input.charcoal ?? 0).toBe(0);
    engine.tick(1);
    expect(smelter.input.charcoal).toBe(1);
    expect(engine.getState().inFlightTransfers).toHaveLength(0);
  });

  it('pauses node processing while allowing completed output to drain', () => {
    const engine = new GameEngine(createInitialState(61));
    const sector = engine.getSector();
    const assemblerId = engine.placeNode('assembler', 2200, 700)!;
    engine.getState().research.unlocked.push('road');
    const chestId = engine.placeNode('woodenChest', 2700, 700)!;
    const assembler = sector.nodes.find((node) => node.id === assemblerId)!;
    const chest = sector.nodes.find((node) => node.id === chestId)!;

    expect(engine.setRecipe(assemblerId, 'motor')).toBe(true);
    expect(engine.connect(assemblerId, chestId)).toBe(true);
    assembler.constructedAt = 0;
    chest.constructedAt = 0;
    assembler.input['iron-gear'] = 1;
    assembler.input['copper-wire'] = 1;
    assembler.output.motor = 1;
    assembler.progressMs = 3000;

    engine.toggleNodeProcessingPause(assemblerId);
    engine.tick(400);

    expect(assembler.processingPaused).toBe(true);
    expect(assembler.progressMs).toBe(3000);
    expect(assembler.input['iron-gear']).toBe(1);
    expect(assembler.input['copper-wire']).toBe(1);
    expect(assembler.output.motor).toBe(0);
    expect(engine.getState().inFlightTransfers).toHaveLength(1);

    engine.tick(1000);
    expect(assembler.progressMs).toBe(3000);

    engine.toggleNodeProcessingPause(assemblerId);
    engine.tick(1000);
    expect(assembler.processingPaused).toBe(false);
    expect(assembler.progressMs).toBe(4000);
  });

  it('preserves Research Center project contributions while switching projects', () => {
    const engine = new GameEngine(createInitialState(8));
    const state = engine.getState();
    state.research.unlocked.push('refiner', 'assembler');
    engine.selectResearch('assembler');
    state.research.contributed['simple-core'] = 3;
    engine.selectResearch('exploration');
    engine.selectResearch('assembler');
    expect(state.research.contributed['simple-core']).toBe(3);
  });

  it('rejects special-family cable pairings', () => {
    const engine = new GameEngine(createInitialState(7));
    const generator = engine.placeNode('generator', 2700, 400)!;
    const kiln = engine.placeNode('kiln', 3000, 400)!;
    const planter = engine.placeNode('tree-planter', 3000, 750)!;
    expect(engine.connect(generator, kiln)).toBe(false);
    expect(generator).toBeUndefined();
    expect(engine.connect(generator, planter)).toBe(false);
  });

  it('applies original single-port rewiring and multi-port fan-out rules', () => {
    const engine = new GameEngine(createInitialState(11)); const sector = engine.getSector();
    const forest = sector.nodes.find((node) => node.kind === 'forest')!;
    const firstExtractor = sector.nodes.find((node) => node.id === 'ironExtractor')!;
    expect(engine.connect(forest.id, firstExtractor.id)).toBe(true);
    const secondExtractor = engine.placeNode('extractor', 1300, 1500)!;
    expect(engine.connect(forest.id, secondExtractor)).toBe(true);
    expect(sector.connections.filter((connection) => connection.from === forest.id)).toHaveLength(2);

    const kiln = engine.placeNode('kiln', 1900, 500)!;
    const smelter = engine.placeNode('smelter', 2350, 500)!;
    expect(engine.setRecipe(smelter, 'smelt-iron')).toBe(true);
    expect(engine.connect(kiln, smelter)).toBe(true);
    expect(sector.connections.find((connection) => connection.from === kiln && connection.to === smelter)?.toPort).toBe(1);
    engine.getState().research.unlocked.push('road');
    const chest = engine.placeNode('woodenChest', 2800, 500)!;
    expect(engine.connect(kiln, chest)).toBe(true);
    expect(sector.connections.filter((connection) => connection.from === kiln)).toHaveLength(1);
    expect(sector.connections.some((connection) => connection.from === kiln && connection.to === chest)).toBe(true);
  });

  it('honors the exact sockets chosen by a drag and rewires an existing input atomically', () => {
    const engine = new GameEngine(createInitialState(12)); const sector = engine.getSector();
    const kiln = engine.placeNode('kiln', 1900, 500)!;
    const smelter = engine.placeNode('smelter', 2350, 500)!;
    expect(engine.setRecipe(smelter, 'smelt-iron')).toBe(true);
    expect(engine.connectPorts(kiln, 0, smelter, 0)).toBe(false);
    expect(engine.connectPorts(kiln, 0, smelter, 1)).toBe(true);
    expect(sector.connections.find((connection) => connection.from === kiln)?.toPort).toBe(1);

    const forest = sector.nodes.find((node) => node.id === 'forest')!;
    const firstExtractor = sector.nodes.find((node) => node.id === 'ironExtractor')!;
    const secondExtractor = sector.nodes.find((node) => node.id === 'extractor-2')!;
    expect(engine.connectPorts(forest.id, 0, firstExtractor.id, 0)).toBe(true);
    const original = sector.connections.find((connection) => connection.from === forest.id && connection.to === firstExtractor.id)!;
    expect(engine.connectPorts(forest.id, 0, secondExtractor.id, 0, original.id)).toBe(true);
    expect(sector.connections.some((connection) => connection.id === original.id)).toBe(false);
    expect(sector.connections.some((connection) => connection.from === forest.id && connection.to === secondExtractor.id)).toBe(true);
  });

  it('restricts Inventory output to Filters', () => {
    const engine = new GameEngine(createInitialState(13));
    const inventory = engine.placeNode('inventory', 2850, 300)!;
    engine.getState().research.unlocked.push('road');
    const chest = engine.placeNode('woodenChest', 3200, 300)!;
    const filter = engine.placeNode('filter', 2850, 650)!;
    expect(engine.connect(inventory, chest)).toBe(false);
    expect(engine.connect(inventory, filter)).toBe(true);
  });

  it('creates and preserves paired road endpoints across sectors', () => {
    const engine = new GameEngine(createInitialState(19));
    engine.getState().research.mapPoints = 1;
    expect(engine.unlockSector(6, 5)).toBe(true);
    expect(engine.getState().activeSectorId).toBe('5,5');
    const road = engine.placeNode('road', 3550, 1200);
    expect(road).toBeTruthy();
    const local = engine.getSector().nodes.find((node) => node.id === road)!;
    const remote = engine.getState().sectors['6,5'].nodes.find((node) => node.id === local.pairedRoadId);
    expect(local.roadMode).toBe('export');
    expect(remote?.roadMode).toBe('import');
    expect(remote?.pairedRoadId).toBe(local.id);
  });

  it('contains the complete source-game node, recipe, and research catalogs', () => {
    expect(NODE_DEFINITIONS.powerSplitter.name).toBe('Power Splitter');
    expect(NODE_DEFINITIONS.miningDrill.name).toBe('Mining Drill');
    expect(NODE_DEFINITIONS.inventory.name).toBe('Inventory');
    expect(NODE_DEFINITIONS.filter.name).toBe('Filter');
    expect(RECIPES['smelt-mythril'].name).toBe('Mythril Plate');
    expect(RECIPES['suppression-bot'].name).toBe('Small Bot');
    expect(RESEARCH_PROJECTS.map((project) => project.id)).toEqual(expect.arrayContaining([
      'joint', 'splitter', 'merger', 'researchCenter1', 'areaExpansion1',
      'extractor2', 'kiln2', 'smelter2', 'refiner2', 'assembler2', 'treePlanter', 'miningDrill',
    ]));
    expect(Object.keys(NODE_MODULES).sort()).toEqual(Object.keys(NODE_DEFINITIONS).sort());
    expect(NODE_MODULES.smelter.appearance.icon).toBe('smelter');
  });

  it('uses the current research core requirements and prerequisites', () => {
    const project = (id: string) => RESEARCH_PROJECTS.find((candidate) => candidate.id === id)!;
    expect(getResearchCosts(project('assembler'))).toEqual({ 'simple-core': 1 });
    expect(getResearchCosts(project('exploration'))).toEqual({ 'simple-core': 1, 'basic-core': 1 });
    expect(getResearchCosts(project('road'))).toEqual({ 'simple-core': 2, 'basic-core': 2 });
    expect(getResearchCosts(project('extractor1'))).toEqual({ 'simple-core': 10 });
    expect(getResearchCosts(project('researchCenter1'))).toEqual({ 'simple-core': 10 });
    expect(isResearchAvailable(project('road'), [])).toBe(true);
    expect(isResearchAvailable(project('areaExpansion1'), [])).toBe(true);
    expect(isResearchAvailable(project('mapNode'), [])).toBe(false);
    expect(isResearchAvailable(project('mapNode'), ['exploration'])).toBe(true);
    expect(isResearchAvailable(project('extractor2'), [])).toBe(false);
    expect(isResearchAvailable(project('extractor2'), ['extractor1'])).toBe(true);
  });

  it('does not treat a revealed node schematic as completed research', () => {
    const engine = new GameEngine(createInitialState(32));
    const state = engine.getState();
    state.research.unlocked.push('exploration', 'extractor1', 'areaExpansion1');

    engine.selectResearch('mapNode');
    expect(state.research.selected).toBeUndefined();
    expect(getSectorWorldSize(engine.getSector(), state.research.completed).width).toBe(3600);

    state.research.completed.push('exploration', 'extractor1', 'areaExpansion1');
    engine.selectResearch('mapNode');
    expect(state.research.selected).toBe('mapNode');
    expect(getSectorWorldSize(engine.getSector(), state.research.completed).width).toBe(4500);
  });

  it('keeps developer node reveals separate from research completion', () => {
    const engine = new GameEngine(createInitialState(33));
    engine.developerUnlockAllNodes();

    expect(engine.getState().research.unlocked).toContain('kiln');
    expect(engine.getState().research.completed).not.toContain('kiln');
    engine.selectResearch('kiln1');
    expect(engine.getState().research.selected).toBeUndefined();
  });

  it('uses the original trigger requirements and keeps them out of manual research selection', () => {
    const triggerRequirements = Object.fromEntries(RESEARCH_PROJECTS.filter((project) => project.trigger && project.trigger.id!=='encounter').map((project) => [project.id, project.trigger?.pending]));
    expect(triggerRequirements).toEqual({
      cornerComponents: 'Obtain any corner piece',
      finalCoreProduction: 'Produce the first Final Core',
      mithrilTools: 'Produce Mythril Tribute at a Dwarven settlement',
      sortingTools: 'Complete Precision Control',
      mineralRecovery: 'Complete Precision Control',
      joint: 'Connect two nodes',
      kiln: 'Extract 1 Wood with an Extractor',
      smelter: 'Extract 1 metal with an Extractor',
      refiner: 'Produce at least 1 metal Plate',
      researchCenter: 'Unlock the Refiner',
      splitter: 'Build an Assembler',
      merger: 'Produce a Basic Core',
      suppressionBot: 'Encounter a Monster Camp',
    });
    const engine = new GameEngine(createInitialState(31));
    Object.keys(triggerRequirements).forEach((id) => engine.selectResearch(id));
    expect(engine.getState().research.selected).toBeUndefined();
  });

  it('unlocks every triggered research project only after its original condition is met', () => {
    const engine = new GameEngine(createInitialState(37));
    const state = engine.getState();
    const sector = engine.getSector();
    const camp = [[5, 4], [6, 5], [5, 6], [4, 5]]
      .flatMap(([x, y]) => generateSector(x, y, 37, 1).nodes)
      .find((node) => node.kind === 'monster-camp')!;
    const evaluate = () => (engine as unknown as { evaluateMilestones(): void }).evaluateMilestones();

    evaluate();
    expect(state.research.completed).not.toContain('joint');
    expect(state.research.completed).not.toContain('suppressionBot');

    state.hasCreatedConnection = true;
    state.extracted = { wood: 1, iron: 1 };
    state.produced = { motor: 1, 'basic-core': 1, 'iron-plate': 1 };
    const template = sector.nodes.find((node) => node.kind === 'extractor')!;
    sector.nodes.push({ ...structuredClone(template), id: 'trigger-assembler', kind: 'assembler', name: 'Assembler' });
    sector.nodes.push(camp);
    evaluate();

    expect(state.research.completed).toEqual(expect.arrayContaining([
      'joint', 'kiln', 'smelter', 'refiner', 'researchCenter', 'splitter', 'merger', 'suppressionBot',
    ]));
  });

  it('prices early Map Node research with Simple cores and adds later tiers gradually', () => {
    const mapNode = RESEARCH_PROJECTS.find((project) => project.id === 'mapNode')!;
    expect(getResearchCosts(mapNode, 0)).toEqual({ 'simple-core': 5 });
    expect(getResearchCosts(mapNode, 8)).toEqual({ 'simple-core': 5 });
    expect(getResearchCosts(mapNode, 9)).toEqual({ 'simple-core': 5, 'basic-core': 5 });
    expect(getResearchCosts(mapNode, 19)).toEqual({ 'simple-core': 5, 'basic-core': 5, 'automata-core': 5 });
  });

  it('resets and requires reselection after each repeatable research completion', () => {
    const engine = new GameEngine(createInitialState(29));
    const state = engine.getState();
    state.research.unlocked.push('exploration');
    state.research.completed.push('exploration');
    state.research.selected = 'mapNode';
    state.research.contributed = { 'simple-core': 5, 'basic-core': 5 };
    (engine as unknown as { research: { completeResearch(projectId: string): void } }).research.completeResearch('mapNode');
    expect(state.research.repeatableCompletions?.mapNode).toBe(1);
    expect(state.research.mapPoints).toBe(1);
    expect(state.research.selected).toBeUndefined();
    expect(state.research.contributed).toEqual({});
    expect(state.research.unlocked).not.toContain('mapNode');
    engine.selectResearch('mapNode');
    expect(state.research.selected).toBe('mapNode');
    expect(getResearchCosts(RESEARCH_PROJECTS.find((project) => project.id === 'mapNode')!, state.research.repeatableCompletions?.mapNode)).toEqual({ 'simple-core': 5 });
  });

  it('turns a completed Mining Drill into the selected 1,000-unit deposit', () => {
    const engine = new GameEngine(createInitialState(23));
    const id = engine.placeNode('miningDrill', 3000, 1400)!;
    const drill = engine.getSector().nodes.find((node) => node.id === id)!;
    drill.constructedAt = 0;
    drill.input.motor = 20;
    expect(engine.setMiningTarget(id, 'mythril')).toBe(false);
    engine.setMiningTarget(id, 'copper');
    for (let index = 0; index < 20; index++) engine.tick(1000);
    expect(drill.kind).toBe('copper');
    expect(drill.resourceItem).toBe('copper');
    expect(drill.resourceRemaining).toBe(1000);
  });

  it('configures Filters safely and makes the change undoable', () => {
    const engine = new GameEngine(createInitialState(31));
    const id = engine.placeNode('filter', 3000, 1400)!;
    const filter = engine.getSector().nodes.find((node) => node.id === id)!;
    filter.input.wood = 2;
    filter.output.wood = 1;

    expect(engine.setFilterItem(id, 'copper')).toBe(true);
    expect(filter.filterItem).toBe('copper');
    expect(filter.input).toEqual({});
    expect(filter.output).toEqual({});
    expect(engine.setFilterItem(id, 'power')).toBe(false);

    engine.undo();
    const restored = engine.getSector().nodes.find((node) => node.id === id)!;
    expect(restored.filterItem).toBe('wood');
    expect(restored.input.wood).toBe(2);
    expect(restored.output.wood).toBe(1);
  });

  it('locks and preserves a Mining Drill target after construction starts', () => {
    const engine = new GameEngine(createInitialState(32));
    const id = engine.placeNode('miningDrill', 3000, 1400)!;
    const drill = engine.getSector().nodes.find((node) => node.id === id)!;

    expect(engine.setMiningTarget(id, 'stone')).toBe(true);
    drill.miningProgress = 1;
    expect(engine.setMiningTarget(id, 'mythril')).toBe(false);
    expect(drill.miningTarget).toBe('stone');
  });

  it('migrates original version-1 save payloads that use the shared storage key', () => {
    const migrated = normalizeLegacy({
      version: 1,
      nodes: [{ id: 'iron', kind: 'iron', title: 'Iron' }, { id: 'chest-1', kind: 'woodenChest', title: 'Wooden Chest' }],
      positions: { iron: { x: 100, y: 200 }, 'chest-1': { x: 500, y: 200 } },
      connections: [{ id: 'wire-1', sourceNode: 'iron', targetNode: 'chest-1', type: 'IRON' }],
      runtime: {
        iron: { remaining: 42, capacity: 100 }, copper: { remaining: 0, capacity: 0 }, stone: { remaining: 0, capacity: 0 }, forest: { remaining: 0, capacity: 0 },
        research: { kilnUnlocked: true, activeProject: null, progress: {}, mapNodeResearchCompletions: 0 }, mapPoints: 2,
        woodenChests: { 'chest-1': { itemType: 'IRON', stored: 7 } }, produced: { IRON: 9 }, extractorProduced: { IRON: 3 },
      },
      gameElapsedMs: 1234, isRunning: true, activeMapSector: '5,5', zoom: 1, viewport: { scrollLeft: 0, scrollTop: 0 },
    });
    expect(migrated?.sectors['5,5'].nodes.find((node) => node.id === 'iron')?.resourceRemaining).toBe(42);
    expect(migrated?.sectors['5,5'].nodes.find((node) => node.id === 'chest-1')?.output.iron).toBe(7);
    expect(migrated?.research.unlocked).toContain('kiln');
    expect(migrated?.produced?.iron).toBe(9);
  });
});
