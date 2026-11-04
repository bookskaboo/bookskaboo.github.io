import { describe, expect, it } from 'vitest';
import { GameEngine } from './engine';
import { createTutorialState, tutorialInsertionTarget, tutorialNode, lessonSatisfied, LOGISTICS_STAGES, lessonCopy } from '../tutorials/tutorialRuntime';
import type { MachineNode, NodeKind } from '../domain/types';
import { getNodeModule } from '../content/nodeModules';
import { getPortAnchor } from '../renderer/nodeLayout';

function fixture() {
  const engine = new GameEngine(createTutorialState('basic'), { autosave: false });
  const sector = engine.getSector(); sector.nodes = []; sector.connections = [];
  const add = (kind: NodeKind, id: string, extra: Partial<MachineNode> = {}) => {
    const node = tutorialNode(kind, id, 300 + sector.nodes.length * 350, 400, { processingPaused: true, ...extra });
    sector.nodes.push(node); return node;
  };
  const link = (from: MachineNode, to: MachineNode, fromPort = 0, toPort = 0) => {
    const cable = { id: `${from.id}>${to.id}`, from: from.id, to: to.id, fromPort, toPort, createdAt: 0 };
    sector.connections.push(cable); return cable;
  };
  return { engine, sector, add, link };
}

describe('continuous logistics routes', () => {
  it('animates extraction from the actual resource through the complete Joint route', () => {
    const engine = new GameEngine(createTutorialState('logistics'), { autosave: false });
    const sector = engine.getSector();
    expect(engine.connect('tutorial-forest', 'tutorial-joint')).toBe(true);
    expect(engine.connect('tutorial-joint', 'tutorial-extractor-a')).toBe(true);
    for (let second = 0; second < 5; second++) engine.tick(1000);
    const pulse = engine.getState().inFlightTransfers?.find(transfer => transfer.cosmeticOnly);
    expect(pulse).toMatchObject({ from: 'tutorial-forest', to: 'tutorial-extractor-a' });
    expect(pulse?.routeConnectionIds).toHaveLength(2);
    expect(pulse!.arrivesAtMs - pulse!.launchedAtMs).toBe(1000);
    expect(sector.nodes.find(node => node.kind === 'joint')?.input).toEqual({});
  });
  it('crosses a Joint, Filter, Splitter, and Merger in one transfer with no intermediate inventory', () => {
    const { engine, add, link } = fixture();
    const source = add('woodenChest', 'source', { output: { wood: 1 } });
    const routers = [add('joint', 'joint'), add('filter', 'filter', { filterItem: 'wood' }), add('splitter', 'splitter'), add('merger', 'merger')];
    const target = add('woodenChest', 'target');
    [source, ...routers].forEach((node, index) => link(node, [...routers, target][index]));
    engine.tick(400);
    const transfer = engine.getState().inFlightTransfers![0];
    expect(transfer.from).toBe(source.id); expect(transfer.to).toBe(target.id);
    expect(transfer.routeConnectionIds).toHaveLength(5);
    expect(transfer.arrivesAtMs - transfer.launchedAtMs).toBe(1000);
    engine.tick(1000);
    expect(((target.input.wood??0)+(target.output.wood??0))).toBe(1);
    for (const router of routers) { expect(router.input).toEqual({}); expect(router.output).toEqual({}); expect(router.processingPaused).toBe(false); }
  });
  it('reserves final destination capacity across routes and refunds a transfer if any route leg is removed', () => {
    const { engine, add, link } = fixture();
    const source = add('woodenChest', 'source', { output: { wood: 3 } });
    const joint = add('joint', 'joint');
    const target = add('woodenChest', 'target', { input: { wood: 19 } });
    link(source, joint); const last = link(joint, target);
    engine.tick(800);
    expect(engine.getState().inFlightTransfers).toHaveLength(1);
    engine.deleteConnection(last.id);
    expect(engine.getState().inFlightTransfers).toHaveLength(0);
    expect(source.output.wood).toBe(3);
    expect(((target.input.wood??0)+(target.output.wood??0))).toBe(19);
  });
  it('skips full splitter routes through Joints, respects Filters, and avoids loops', () => {
    const { engine, add, link } = fixture();
    const source = add('woodenChest', 'source', { output: { wood: 2 } });
    const splitter = add('splitter', 'splitter'), joint = add('joint', 'joint');
    const full = add('woodenChest', 'full', { input: { wood: 20 } });
    const target = add('woodenChest', 'target');
    link(source, splitter); link(splitter, joint); link(joint, full); link(splitter, target, 1);
    engine.tick(400);
    expect(engine.getState().inFlightTransfers?.map(transfer => transfer.to)).toEqual(['target']);
    engine.tick(1000); expect(((target.input.wood??0)+(target.output.wood??0))).toBeGreaterThan(0);
    const isolated = fixture();
    const box = isolated.add('woodenChest', 'box', { output: { wood: 1 } });
    const filter = isolated.add('filter', 'filter', { filterItem: 'stone' });
    isolated.link(box, filter); isolated.link(filter, isolated.add('woodenChest', 'sink'));
    isolated.engine.tick(400); expect(isolated.engine.getState().inFlightTransfers).toHaveLength(0);
    filter.filterItem = 'wood';
    isolated.sector.connections = isolated.sector.connections.filter(cable => cable.from !== filter.id);
    const loop = isolated.add('joint', 'loop'); isolated.link(filter, loop); isolated.link(loop, filter);
    isolated.engine.tick(400); expect(isolated.engine.getState().inFlightTransfers).toHaveLength(0);
  });
});

describe('logistics editing and tutorial', () => {
  it.each(['joint', 'splitter', 'merger'] as const)('inserts a moved %s into a cable atomically and undoes the complete move', kind => {
    const stage = `logistics-${kind}-insert` as const;
    const engine = new GameEngine(createTutorialState('logistics', `${kind}-insert`), { autosave: false });
    const target = tutorialInsertionTarget(stage, engine.getState())!;
    const original = structuredClone(engine.getSector());
    const router = engine.getSector().nodes.find(node => node.kind === kind)!;
    expect(lessonSatisfied(stage, engine.getState(), null)).toBe(false);
    const snapshot = JSON.stringify(engine.getState());
    const preview = engine.getCableInsertionPreview({ ...router, ...target });
    expect(preview?.connections.map(cable => [cable.from, cable.to])).toEqual([
      [kind === 'joint' ? 'tutorial-forest' : 'tutorial-extractor-a', router.id],
      [router.id, kind === 'joint' ? 'tutorial-extractor-a' : 'tutorial-kiln-a'],
    ]);
    expect(JSON.stringify(engine.getState())).toBe(snapshot);
    expect(engine.getCableInsertionPreview({ ...router, x: 2200, y: 1700 })).toBeUndefined();
    engine.beginMove(); expect(engine.tryMoveNodesTo({ [router.id]: target })).toBe(true); engine.commitMove();
    expect(lessonSatisfied(stage, engine.getState(), null)).toBe(true);
    expect(engine.getSector().connections).toHaveLength(original.connections.length + 1);
    engine.undo(); expect(engine.getSector().connections).toEqual(original.connections);
    const before = original.nodes.find(node => node.id === router.id)!;
    expect(engine.getSector().nodes.find(node => node.id === router.id)).toMatchObject({ x: before.x, y: before.y });
  });
  it('keeps in-flight items and their clocks when inserting a Joint into their route', () => {
    const { engine, add, link } = fixture();
    const source = add('woodenChest', 'source', { output: { wood: 1 } });
    const target = add('woodenChest', 'target');
    const joint = add('joint', 'joint', { x: 1000, y: 700 });
    const cable = link(source, target);
    engine.tick(400); const before = structuredClone(engine.getState().inFlightTransfers![0]);
    const a = getPortAnchor(source, 'output', 0), b = getPortAnchor(target, 'input', 0);
    engine.beginMove(); expect(engine.tryMoveNodesTo({ [joint.id]: { x: (source.x + a.x + target.x + b.x) / 2, y: (source.y + a.y + target.y + b.y) / 2 } })).toBe(true); engine.commitMove();
    const after = engine.getState().inFlightTransfers![0];
    expect(after.id).toBe(before.id); expect(after.launchedAtMs).toBe(before.launchedAtMs); expect(after.arrivesAtMs).toBe(before.arrivesAtMs);
    expect(after.routeConnectionIds).toHaveLength(2); expect(engine.getSector().connections.some(connection => connection.id === cable.id)).toBe(false);
    engine.tick(1000); expect(((target.input.wood??0)+(target.output.wood??0))).toBe(1);
  });
  it('removes logistics pausing and rotates Filter sockets through the same controls', () => {
    const { engine, add } = fixture(); const filter = add('filter', 'filter');
    expect(getNodeModule('filter').controls.pauseable).toBe(false);
    engine.tick(100); engine.toggleNodeProcessingPause(filter.id); expect(filter.processingPaused).toBe(false);
    const before = getPortAnchor(filter, 'input', 0); engine.rotateNode(filter.id);
    expect(filter.rotation).toBe(90); expect(getPortAnchor(filter, 'input', 0)).toEqual({ x: -before.y, y: before.x });
    expect(LOGISTICS_STAGES).toContain('logistics-splitter-rotate'); expect(LOGISTICS_STAGES).toContain('logistics-merger-insert');
    for (const stage of LOGISTICS_STAGES) expect(lessonCopy(stage).instruction.length, stage).toBeGreaterThan(0);
  });
});
