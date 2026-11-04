import { describe, expect, it } from 'vitest';
import { cartUpgrade } from '../content/cartUpgrades';
import { FILTERABLE_ITEMS, isFluidItem } from '../content/items';
import { getBuildNodeDefinition, isNodeUnlocked } from '../content/nodes';
import { getResearchProject, isResearchAvailable } from '../content/research';
import { getPortSide, inputPortAcceptsItem } from './connectionRules';
import { getPortAnchor } from '../domain/nodeGeometry';
import { normalizeLegacy } from '../persistence/saves';
import { tutorialNode } from '../tutorials/tutorialRuntime';
import { createInitialState, GameEngine } from './engine';

function advance(engine: GameEngine, ms: number) {
  while (ms > 0) { const step = Math.min(100, ms); engine.tick(step); ms -= step; }
}

describe('Cart, Truck and Train progression', () => {
  it('unlocks both saved Cart identifiers with Road research, allowing every solid tier from the start', () => {
    const engine = new GameEngine(createInitialState(301), { autosave: false });
    for (const kind of ['woodenChest', 'chest'] as const) {
      expect(isNodeUnlocked(kind, ['woodenChest'])).toBe(false);
      expect(engine.placeNode(kind, 1100, 650)).toBeUndefined();
      expect(isNodeUnlocked(kind, ['road'])).toBe(true);
      expect(getBuildNodeDefinition(kind, ['road']).category).toBe('Logistics');
      const cart = tutorialNode(kind, 'cart', 0, 0);
      for (const direction of ['input', 'output'] as const) {
        const anchor = getPortAnchor(cart, direction, 0);
        for (const rotation of [90, 180, 270]) {
          expect(getPortAnchor({ ...cart, rotation }, direction, 0)).toEqual(anchor);
          expect(getPortSide({ ...cart, rotation }, direction, 0)).toBe(direction === 'input' ? 'west' : 'east');
        }
      }
      for (const item of FILTERABLE_ITEMS) expect(inputPortAcceptsItem(tutorialNode(kind, 'cart', 0, 0), 0, item), item).toBe(!isFluidItem(item));
    }
    engine.getState().research.unlocked.push('road');
    const id = engine.placeNode('woodenChest', 1100, 650)!;
    expect(engine.getSector().nodes.find(node => node.id === id)).toMatchObject({ name: 'Cart', capacity: 20 });
  });

  it('completes sequential paid research and upgrades existing vehicles and templates without replacing them', () => {
    const state = createInitialState(301);
    state.research.completed = ['road', 'automataCore', 'hydraulicAssembly']; state.research.unlocked.push(...state.research.completed);
    const cart = tutorialNode('woodenChest', 'cart', 400, 500, { input: { 'command-core': 3 }, output: { wood: 4 }, transferProgressMs: 1200 });
    state.sectors['5,5'].nodes = [cart, tutorialNode('chest', 'legacy', 800, 500), tutorialNode('researchCenter', 'lab', 1400, 500)];
    state.sectors['5,5'].connections = [{ id: 'keep', from: 'cart', to: 'legacy', createdAt: 0 }];
    state.factoryTemplates = [{ name: 'Vehicle', nodes: [structuredClone(cart)], connections: [] }];
    const engine = new GameEngine(state, { autosave: false });
    const original = structuredClone(engine.getSector().nodes[0]);
    for (const id of ['trucks', 'trains']) {
      const project = getResearchProject(id)!;
      engine.getState().research.projectContributions = { [id]: Object.fromEntries(Object.entries(project.costs).map(([core, cost]) => [core, cost! - 1])) };
      const lab = engine.getSector().nodes.find(node => node.id === 'lab')!;
      lab.input = Object.fromEntries(Object.keys(project.costs).map(core => [core, 1]));
      engine.selectResearch(id);
      if (!engine.getState().research.completed.includes(id)) advance(engine, 5000);
      const expected = cartUpgrade(engine.getState().research.completed);
      expect(engine.getState().research.completed).toContain(id);
      expect(engine.getSector().nodes[0]).toMatchObject({ id: original.id, kind: original.kind, x: original.x, y: original.y, ...expected });
      expect(engine.getSector().nodes[1]).toMatchObject({ kind: 'chest', ...expected });
      expect(engine.getState().factoryTemplates![0].nodes[0]).toMatchObject(expected);
      expect(engine.getSector().connections).toHaveLength(1);
      expect(engine.getSector().connections[0]).toMatchObject(state.sectors['5,5'].connections[0]);
      expect(getBuildNodeDefinition('woodenChest', engine.getState().research.completed).name).toBe(expected.name);
    }
    // The test factory ran while the second research interval elapsed: no items vanished.
    const stored = engine.getSector().nodes.filter(node => node.id !== 'lab').reduce((sum, node) => sum + Object.values(node.input).reduce((n, q) => n + (q ?? 0), 0) + Object.values(node.output).reduce((n, q) => n + (q ?? 0), 0), 0);
    expect(stored + (engine.getState().inFlightTransfers ?? []).filter(transfer => !transfer.cosmeticOnly).length).toBe(7);
    const future = engine.placeNode('woodenChest', 1100, 1100)!;
    expect(engine.getSector().nodes.find(node => node.id === future)).toMatchObject({ name: 'Train', capacity: 80 });
  });

  it.each([[[], 20, 'Cart'], [['trucks'], 40, 'Truck'], [['trucks', 'trains'], 80, 'Train']] as const)('uses upgrades %j for capacity %i (%s)', (completed, capacity, name) => {
    const state = createInitialState(301);
    state.research.completed = [...completed];
    state.research.unlocked.push('road');
    state.sectors['5,5'].nodes = [tutorialNode('devSource', 'supply', 400, 500), tutorialNode('woodenChest', 'cart', 900, 500)];
    state.sectors['5,5'].connections = [{ id: 'supply-cart', from: 'supply', to: 'cart', createdAt: 0 }];
    const engine = new GameEngine(state, { autosave: false });
    advance(engine, 6000);
    const cart = engine.getSector().nodes[1];
    expect(cart).toMatchObject({ capacity, name });
    expect(Object.values(cart.input).reduce((n, q) => n + (q ?? 0), 0) + Object.values(cart.output).reduce((n, q) => n + (q ?? 0), 0)).toBe(capacity);
    expect(cart.output.iron).toBe(capacity); // Intake no longer adds a second timed hop to local transport.
    const restored = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))!, { autosave: false });
    expect(restored.getSector().nodes[1]).toEqual(cart);
  });

  it('preserves old stock above the new nominal limit and normalizes saved generated titles', () => {
    const state = createInitialState(301);
    state.sectors['5,5'].nodes = [tutorialNode('woodenChest', 'old', 500, 500, { name: 'Wooden Chest 4', input: { wood: 25 }, output: { wood: 25 } })];
    const engine = new GameEngine(state, { autosave: false });
    expect(engine.getSector().nodes[0]).toMatchObject({ name: 'Cart 4', input: { wood: 25 }, output: { wood: 25 }, capacity: 20 });
  });

  it('requires sequential research with increasing Core tiers', () => {
    expect(isResearchAvailable(getResearchProject('trucks')!, ['road'])).toBe(false);
    expect(isResearchAvailable(getResearchProject('trucks')!, ['road', 'automataCore'])).toBe(true);
    expect(isResearchAvailable(getResearchProject('trains')!, ['hydraulicAssembly'])).toBe(false);
    expect(isResearchAvailable(getResearchProject('trains')!, ['trucks', 'hydraulicAssembly'])).toBe(true);
    expect(Object.keys(getResearchProject('trucks')!.costs)).toHaveLength(3);
    expect(Object.keys(getResearchProject('trains')!.costs)).toHaveLength(4);
  });
});
