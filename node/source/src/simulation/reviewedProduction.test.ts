import { describe, expect, it } from 'vitest';
import type { ItemId, MachineNode, NodeKind } from '../domain/types';
import { GameEngine, createInitialState } from './engine';
import { RECIPES, isRecipeUnlocked } from '../content/recipes';
import { getResearchProject, isResearchAvailable } from '../content/research';
import { getLizardSettlementForMapTier } from '../content/lizardSettlements';
import { getEffectiveNodeOutputFamilies } from '../content/nodes';
import { normalizeLegacy } from '../persistence/saves';

const machine = (kind: NodeKind, id: string, extra: Partial<MachineNode> = {}): MachineNode => ({ kind, id, name: id, x: 300, y: 300, rotation: 0, input: {}, output: {}, progressMs: 0, cycleMs: 1000, constructedAt: 0, constructionMs: 0, ...extra });
function setup(nodes: MachineNode[], completed: string[] = []) {
  const state = createInitialState(204);
  state.sectors['5,5'].nodes = nodes;
  state.sectors['5,5'].connections = [];
  state.research.completed.push(...completed);
  return new GameEngine(state, { autosave: false });
}
const advance = (engine: GameEngine, ms: number) => { for (let t = 0; t < ms; t += 100) engine.tick(Math.min(100, ms - t)); };
const link = (engine: GameEngine, from: string, to: string, fromPort = 0) => engine.getSector().connections.push({ id: `${from}>${to}`, from, to, fromPort, toPort: 0, createdAt: 0 });
const stored = (node: MachineNode, item: ItemId) => (node.input[item] ?? 0) + (node.output[item] ?? 0);

describe('reviewed production implementation', () => {
  it('gates new global access at first Final Core production and retains legacy completed access', () => {
    const project = getResearchProject('autonomousLogistics')!;
    expect(isResearchAvailable(project, ['precisionControl'])).toBe(false);
    expect(isResearchAvailable(project, ['precisionControl', 'finalCoreProduction'])).toBe(true);
    const engine = setup([], ['precisionControl']);
    engine.selectResearch(project.id); expect(engine.getState().research.selected).toBeUndefined();
    engine.getState().finalCoreProduced = true; advance(engine, 100);
    engine.selectResearch(project.id); expect(engine.getState().research.selected).toBe(project.id);
    const legacy = setup([], ['autonomousLogistics']);
    expect(legacy.getState().research.completed).toContain('autonomousLogistics');
  });
  it('makes Shiny clean, Controller waste guaranteed and alternative research independent', () => {
    expect(RECIPES['refined-mithril'].outputs).toEqual({ 'refined-mithril': 2 });
    expect(RECIPES['precision-controller'].outputs).toEqual({ 'precision-controller': 1, 'metallic-fines': 1 });
    expect(RECIPES['precision-controller'].chanceOutputs).toBeUndefined();
    expect(RECIPES['advanced-actuator'].chanceOutputs).toBeUndefined();
    expect(getResearchProject('efficientHigherIntermediates')?.prerequisites).toEqual(['precisionControl']);
    expect(Object.values(getResearchProject('efficientIntermediates')!.costs)).toEqual([25,25,25,25,25,25]);
    expect(Object.values(getResearchProject('efficientHigherIntermediates')!.costs)).toEqual([50,50,50,50,50,50]);
    expect(isRecipeUnlocked('slagwashing', ['mineralRecovery'])).toBe(false);
    expect(isRecipeUnlocked('recover-fines', ['precisionControl'])).toBe(true);
  });

  it('finishes a saved Command Bot batch at the new cycle without charging the inputs again', () => {
    const recipeId = 'command-suppression-bot';
    const engine = setup([machine('advancedAssembler', 'command', {
      recipeId, cycleMs: 60000, progressMs: 59000, batch: { recipeId, outputs: { [recipeId]: 1 } },
    })], ['commandRobotics']);
    const assembler = engine.getSector().nodes[0];
    expect(assembler.cycleMs).toBe(90000);
    advance(engine, 30900);
    expect(assembler.output).toEqual({});
    advance(engine, 100);
    expect(assembler.output).toEqual({ [recipeId]: 1 });
    expect(assembler.batch).toBeUndefined();
  });

  it.each([[4,1],[5,1],[6,1],[7,1],[8,2],[9,2]])('uses adopted Dwarven map-tier %i AP, output and capacity', (tier, bots) => {
    const spec = getLizardSettlementForMapTier(tier);
    const camp = machine('monster-camp', 'camp', { lizardSettlement: spec.settlement, settlementMapTier: tier, campStrength: 10, suppressed: true });
    const engine = setup([camp]); advance(engine, 5000);
    const box = engine.getSector().nodes.find(node => node.kind === 'goblinTribute');
    // First normal check still occurs at sixty seconds, not at first delivery.
    expect(engine.getSector().nodes[0].attackRequirement).toBe(spec.attackRequirement);
    expect(box).toBeUndefined();
    engine.getSector().nodes[0].input['command-suppression-bot'] = bots;
    advance(engine, 60000);
    const tribute = engine.getSector().nodes.find(node => node.kind === 'goblinTribute')!;
    expect(tribute.capacity).toBe(spec.capacity);
    expect(tribute.output.mythril).toBe(spec.tributePerCycle);
    expect(engine.getState().dwarvenMythrilProduced).toBe(true);
    expect(engine.getState().research.completed).toContain('mithrilTools');
  });

  it('retains Dwarven overpayment, insufficient bots, Tribute and wiring and retries once', () => {
    const engine = setup([machine('monster-camp', 'camp', { lizardSettlement: 'village', settlementMapTier: 7, campStrength: 10, input: { 'command-suppression-bot': 1 } })]);
    advance(engine, 65000);
    const camp = engine.getSector().nodes[0];
    const tribute = engine.getSector().nodes.find(node => node.kind === 'goblinTribute')!;
    expect(camp.suppressionCredit).toBe(8); expect(tribute.output.mythril).toBe(5);
    link(engine, tribute.id, 'unconnected-legacy-destination');
    camp.input['medium-suppression-bot'] = 2;
    advance(engine, 55000);
    expect(camp.suppressionRetry).toBe(true); expect(camp.input['medium-suppression-bot']).toBe(2);
    expect(engine.getSector().nodes).toContain(tribute); expect(engine.getSector().connections).toHaveLength(1);
    const stock = tribute.output.mythril;
    advance(engine, 5000); expect(tribute.output.mythril).toBe(stock);
    camp.input['medium-suppression-bot'] = 3;
    advance(engine, 100);
    expect(camp.suppressionRetry).toBe(false); expect(camp.suppressionCredit).toBe(1);
    const after = camp.suppressionCredit;
    advance(engine, 100); expect(camp.suppressionCredit).toBe(after);
    const reloaded = new GameEngine(normalizeLegacy(structuredClone(engine.getState()))!);
    expect(reloaded.getSector().nodes[0].suppressionCredit).toBe(1);
    expect(reloaded.getSector().nodes.find(node => node.id === tribute.id)?.output).toEqual(tribute.output);
  });

  it('blocks both Filter outlets immediately and resumes with explicit product/remainder separation', () => {
    const engine = setup([
      machine('advancedAssembler', 'producer', { recipeId: 'precision-controller', processingPaused: true, output: { 'precision-controller': 1, 'metallic-fines': 1 } }),
      machine('filter', 'filter', { filterItem: 'precision-controller' }),
      machine('warehouse', 'product', { processingPaused: true }),
      machine('wasteHopper', 'waste', { processingPaused: true }),
    ], ['precisionControl']);
    link(engine, 'producer', 'filter'); link(engine, 'filter', 'product');
    advance(engine, 400);
    expect(engine.getState().inFlightTransfers).toHaveLength(0);
    expect(engine.getSector().nodes[1].filterBlocked).toBe('remainder');
    link(engine, 'filter', 'waste', 1);
    advance(engine, 2400);
    expect(stored(engine.getSector().nodes[2], 'precision-controller')).toBe(1);
    expect(stored(engine.getSector().nodes[3], 'metallic-fines')).toBe(1);
    expect(engine.getSector().nodes[1].filterBlocked).toBeUndefined();
    expect(getEffectiveNodeOutputFamilies(engine.getSector().nodes[0])).toEqual(['ANY']);
  });

  it('never sends a later product past unsent waste, including after save/load', () => {
    const engine = setup([machine('advancedAssembler', 'source', { recipeId: 'precision-controller', processingPaused: true, output: { 'precision-controller': 2, 'metallic-fines': 2 }, outputQueue: ['precision-controller','metallic-fines','precision-controller','metallic-fines'] }), machine('advancedAssembler','sink',{ recipeId: 'command-core', processingPaused: true })], ['precisionControl']);
    engine.getSector().connections.push({ id: 'wire', from: 'source', to: 'sink', fromPort: 0, toPort: 1, createdAt: 0 });
    advance(engine, 2000);
    expect(engine.getSector().nodes[1].input['precision-controller']).toBe(1);
    const reloaded = new GameEngine(normalizeLegacy(structuredClone(engine.getState()))!);
    advance(reloaded, 2000);
    expect(reloaded.getSector().nodes[1].input['precision-controller']).toBe(1);
    expect(reloaded.getSector().nodes[0].outputQueue).toEqual(['metallic-fines','precision-controller','metallic-fines']);
  });

  it('separates higher alternatives through chained Filters without treating already-separated products as waiting waste', () => {
    const engine=setup([
      machine('advancedAssembler','source',{recipeId:'efficient-hydro-piston',processingPaused:true,output:{'hydraulic-actuator':1,'spent-flux':2,'metallic-fines':1},outputQueue:['hydraulic-actuator','spent-flux','spent-flux','metallic-fines']}),
      machine('filter','products',{filterItem:'hydraulic-actuator'}),machine('filter','wastes',{filterItem:'spent-flux'}),
      machine('warehouse','piston',{processingPaused:true}),machine('warehouse','flux',{processingPaused:true}),machine('warehouse','fines',{processingPaused:true}),
    ],['precisionControl','efficientHigherIntermediates']);
    link(engine,'source','products');link(engine,'products','piston');link(engine,'products','wastes',1);link(engine,'wastes','flux');link(engine,'wastes','fines',1);
    advance(engine,3200);
    expect(stored(engine.getSector().nodes[3],'hydraulic-actuator')).toBe(1);
    expect(stored(engine.getSector().nodes[4],'spent-flux')).toBe(2);
    expect(stored(engine.getSector().nodes[5],'metallic-fines')).toBe(1);
    expect(engine.getSector().nodes[1].filterBlocked).toBeUndefined();expect(engine.getSector().nodes[2].filterBlocked).toBeUndefined();
  });

  it.each([[], ['trucks'], ['trucks','trains']].map(completed => [completed] as [string[]]))('conserves local vehicle shipments through cancellation and reload at %j', completed => {
    const engine = setup([machine('woodenChest','source',{output:{iron:10}}),machine('woodenChest','sink')], completed);
    link(engine,'source','sink'); advance(engine,400);
    const amount = completed.includes('trains') ? 4 : completed.includes('trucks') ? 2 : 1;
    expect(engine.getState().inFlightTransfers?.[0].amount).toBe(amount);
    const loaded = new GameEngine(normalizeLegacy(structuredClone(engine.getState()))!);
    loaded.deleteConnection('source>sink');
    expect(stored(loaded.getSector().nodes[0],'iron')).toBe(10);
    expect(loaded.getState().inFlightTransfers).toHaveLength(0);
    advance(engine,1000);
    expect(stored(engine.getSector().nodes[0],'iron') + stored(engine.getSector().nodes[1],'iron') + (engine.getState().inFlightTransfers ?? []).reduce((n,t)=>n+(t.amount??1),0)).toBe(10);
  });

  it('funds exactly one hundred growth, dispatches groups and preserves supply wiring on reload', () => {
    const engine = setup([machine('treePlanter','planter',{input:{wood:10,'iron-plate':1,stone:1}}),machine('forest','forest',{resourceItem:'wood',resourceRemaining:0,resourceCapacity:1000}),machine('warehouse','supplies')], ['treePlanter','planterThroughput']);
    link(engine,'planter','forest');
    engine.getSector().connections.push({id:'supply',from:'supplies',to:'planter',toPort:0,createdAt:0});
    advance(engine,400);
    expect(engine.getState().inFlightTransfers?.find(t=>!t.cosmeticOnly)?.amount).toBe(4);
    expect(engine.getSector().nodes[0].growthCredit).toBe(96);
    const loaded = new GameEngine(normalizeLegacy(structuredClone(engine.getState()))!);
    expect(loaded.getSector().connections.some(edge=>edge.id==='supply')).toBe(true);
    advance(loaded,20000);
    const planter = loaded.getSector().nodes[0], forest = loaded.getSector().nodes[1];
    expect(planter.growthCredit).toBe(0); expect(forest.resourceRemaining).toBe(100);
    expect(planter.input).toEqual({wood:0,'iron-plate':0,stone:0});
    advance(loaded,5000); expect(forest.resourceRemaining).toBe(100);
  });

  it.each([0,1,2])('delivers increasing local and Road throughput at vehicle tier %i', tier => {
    const completed = tier === 2 ? ['trucks','trains'] : tier === 1 ? ['trucks'] : [];
    const payload = [1,2,4][tier];
    const engine = setup([machine('woodenChest','source',{output:{iron:1000}}),machine('warehouse','sink',{processingPaused:true})],completed);
    link(engine,'source','sink');advance(engine,10000);
    expect(stored(engine.getSector().nodes[1],'iron')).toBe(22*payload);
    const roads = setup([machine('woodenChest','source',{output:{iron:1000}}),machine('road','out',{roadMode:'export',pairedSectorId:'6,5',pairedRoadId:'in'})],completed);
    link(roads,'source','out');
    roads.getState().sectors['6,5'] = { ...structuredClone(roads.getSector()), id:'6,5',x:6,nodes:[machine('road','in',{roadMode:'import',pairedSectorId:'5,5',pairedRoadId:'out'}),machine('woodenChest','sink')],connections:[{id:'receive',from:'in',to:'sink',createdAt:0}] };
    advance(roads,15000);
    expect(stored(roads.getState().sectors['6,5'].nodes[1],'iron')).toBe(3*payload);
    expect(stored(roads.getSector().nodes[0],'iron')+stored(roads.getState().sectors['6,5'].nodes[1],'iron')).toBe(1000);
  });

  it('restores cancelled mixed shipments ahead of later batches in their original order', () => {
    const engine=setup([machine('advancedAssembler','source',{recipeId:'precision-controller',processingPaused:true,output:{'precision-controller':2,'metallic-fines':2},outputQueue:['precision-controller','metallic-fines','precision-controller','metallic-fines']}),machine('filter','filter',{filterItem:'precision-controller'}),machine('warehouse','product',{processingPaused:true}),machine('warehouse','waste',{processingPaused:true})],['precisionControl']);
    link(engine,'source','filter');link(engine,'filter','product');link(engine,'filter','waste',1);
    advance(engine,800);
    expect(engine.getState().inFlightTransfers).toHaveLength(2);
    engine.deleteConnection('source>filter');
    expect(engine.getSector().nodes[0].outputQueue).toEqual(['precision-controller','metallic-fines','precision-controller','metallic-fines']);
    expect(engine.getSector().nodes[0].output).toEqual({'precision-controller':2,'metallic-fines':2});
  });

  it('archives unsupported legacy Mythril reserves and preserves Golem damage and paid recovery batches', () => {
    const engine=setup([machine('mythril','old',{resourceItem:'mythril',resourceRemaining:100}),machine('resourceGolem','golem',{golemMineral:'mythril',health:9875}),machine('hydroProcessor','legacy',{recipeId:'slagwashing',progressMs:11900,batch:{recipeId:'slagwashing',outputs:{'mineral-aggregate':2,'metal-residue':1}}})]);
    expect(engine.getSector().retiredMythril?.nodes[0].id).toBe('old');
    expect(engine.getSector().nodes.some(node=>node.id==='old')).toBe(false);
    expect(engine.getSector().nodes.find(node=>node.id==='golem')?.health).toBe(25);
    advance(engine,100);
    const legacy=engine.getSector().nodes.find(node=>node.id==='legacy')!;
    expect(legacy.output).toEqual({'mineral-aggregate':2,'metal-residue':1});expect(legacy.recipeId).toBeUndefined();
    const loaded=new GameEngine(normalizeLegacy(structuredClone(engine.getState()))!);
    expect(loaded.getSector().retiredMythril?.nodes).toHaveLength(1);
    expect(loaded.getSector().nodes.find(node=>node.id==='golem')?.health).toBe(25);
  });
});
