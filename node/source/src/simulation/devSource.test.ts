import { describe, expect, it } from 'vitest';
import { BUILDABLE_NODES, getEffectiveNodeInputFamilies, NODE_DEFINITIONS } from '../content/nodes';
import { RESEARCH_PROJECTS } from '../content/research';
import type { GameState, MachineNode, NodeKind } from '../domain/types';
import { normalizeLegacy } from '../persistence/saves';
import { productionPortRow } from '../renderer/productionPortRows';
import { productionVisual } from '../renderer/productionVisuals';
import { createInitialState, GameEngine } from './engine';
import { portFamiliesCompatible } from './connectionRules';
import { devInputItems, supplyDevInputs } from './devSource';
import { SimulationLookups } from './simulationLookups';
import { FOUNDRY_INPUTS } from '../content/endgame';
import { RECIPES, RECIPE_GROUPS, RETIRED_RECIPES } from '../content/recipes';
import { BOT_BUILDS, BOT_ITEMS } from '../content/botAssembly';
import { emptyMod } from '../mods/modTypes';
import { activateMod } from '../mods/modContent';

const machine = (kind: NodeKind, id: string, x = 1500, extra: Partial<MachineNode> = {}): MachineNode => ({ kind, id, name: NODE_DEFINITIONS[kind].name, x, y: 900, rotation: 0, input: {}, output: {}, progressMs: 0, cycleMs: kind === 'extractor' ? 5000 : 1000, constructedAt: 0, constructionMs: 0, ...extra });
function setup(nodes: MachineNode[], configure?: (state: GameState) => void) {
  const state = createInitialState(37);
  state.research.completed = RESEARCH_PROJECTS.filter(p => !p.repeatable).map(p => p.id);
  state.research.unlocked = RESEARCH_PROJECTS.map(p => p.id);
  state.sectors['5,5'].nodes = [machine('devSource', 'dev', 400), ...nodes];
  state.sectors['5,5'].connections = [];
  configure?.(state);
  const engine = new GameEngine(state, { autosave: false });
  return { engine, node: (id: string) => engine.getSector().nodes.find(n => n.id === id)! };
}
const advance = (engine: GameEngine, seconds: number) => { for (let i = 0; i < seconds * 10; i++) engine.tick(100); };

describe('Dev Source', () => {
  it('fills every ingredient socket of every registered selectable recipe',()=>{
    let checked=0;
    for(const [kind,recipes] of Object.entries(RECIPE_GROUPS))for(const recipeId of recipes){
      if(!NODE_DEFINITIONS[kind as NodeKind]||kind==='botPlant'||RETIRED_RECIPES.has(recipeId))continue;
      const state=createInitialState(37);state.research.completed=RESEARCH_PROJECTS.filter(p=>!p.repeatable).map(p=>p.id);
      const target=machine(kind as NodeKind,'recipe',1500,{recipeId}),sector=state.sectors['5,5'];
      sector.nodes=[machine('devSource','dev',400),target];
      sector.connections=getEffectiveNodeInputFamilies(target,state.research.completed).map((_,port)=>({id:`feed-${port}`,from:'dev',to:'recipe',fromPort:0,toPort:port,createdAt:0}));
      supplyDevInputs(state,sector,new SimulationLookups(state),()=>5);
      for(const [item,count] of Object.entries(RECIPES[recipeId].inputs)) {
        const amount=target.kind==='recycler'&&item==='suppression-bot'?BOT_ITEMS.reduce((n,bot)=>n+(target.input[bot]??0),0):target.input[item as keyof typeof target.input]??0;
        expect(amount,`${kind}/${recipeId}: ${item}`).toBeGreaterThanOrEqual(count!);
      }
      checked++;
    }
    expect(checked).toBeGreaterThan(80);
  });

  it('supplies all Foundry quotas independently and produces its corner piece',()=>{
    const {engine,node}=setup([machine('cornerChallenge','foundry',1500,{cornerType:'foundry'}),machine('cornerTribute','reward',2400,{cornerType:'foundry',tributeCampId:'foundry',capacity:10})]);
    for(let port=0;port<Object.keys(FOUNDRY_INPUTS).length;port++)expect(engine.connectPorts('dev',0,'foundry',port)).toBe(true);
    advance(engine,.1);
    expect(node('reward').output['foundry-component']).toBe(1);
    advance(engine,.1);expect(node('reward').output['foundry-component']).toBe(2);
  });

  it('automatically starts Recycler processing when a Dev Source supplies material and Water',()=>{
    const {engine,node}=setup([machine('recycler','recycler',1500)]);
    expect(engine.connectPorts('dev',0,'recycler',0)).toBe(true);expect(engine.connectPorts('dev',0,'recycler',1)).toBe(true);
    advance(engine,.1);
    expect(node('recycler').recipeId).toBeTruthy();expect(node('recycler').batch?.recipeId).toBe(node('recycler').recipeId);
    expect(node('recycler').input.iron).toBeLessThan(10);expect(node('recycler').input.water).toBeLessThan(10);
  });

  it.each(BOT_BUILDS)('supplies the $frame and $gun inputs of automatic Bot assembly',build=>{
    const {engine,node}=setup([machine('botPlant','plant',1500,{input:{[build.frame]:1,[build.gun]:1}})]);
    expect(engine.connectPorts('dev',0,'plant',0)).toBe(true);expect(engine.connectPorts('dev',0,'plant',1)).toBe(true);
    advance(engine,.1);
    expect(node('plant').batch).toMatchObject({recipeId:build.recipe.id,outputs:{[build.item]:1}});
    expect(node('plant').input[build.frame]).toBeGreaterThan(0);expect(node('plant').input[build.gun]).toBeGreaterThan(0);
  });

  it('infers a mod-defined reserve material for a Dev-fed Extractor',()=>{
    const {engine}=setup([machine('extractor','extractor',1100),machine('smelter','smelter',1900)]);
    try {
      engine.applyMod({...emptyMod(),resources:{'mod-ore':{name:'Test Ore',color:'#aabbcc'}},nodes:{'mod-ore-vein':{template:'iron',name:'Test Vein',resourceItem:'mod-ore'},smelter:{recipeIds:['mod-smelt']}},recipes:{'mod-smelt':{name:'Test Smelting',inputs:{'mod-ore':1,charcoal:1},outputs:{'iron-plate':1},cycleMs:1000}}});
      expect(engine.setRecipe('smelter','mod-smelt')).toBe(true);expect(engine.connectPorts('extractor',0,'smelter',0)).toBe(true);expect(engine.connect('dev','extractor')).toBe(true);expect(engine.connectPorts('dev',0,'smelter',1)).toBe(true);
      expect(devInputItems(engine.getSector().nodes.find(n=>n.id==='extractor')!,0,engine.getSector(),engine.getState())).toEqual(['mod-ore']);
      advance(engine,10);expect(engine.getState().extracted?.['mod-ore']).toBeGreaterThan(0);expect(engine.getState().produced?.['iron-plate']).toBeGreaterThan(0);
    } finally {activateMod();}
  });
  it('recognizes POWER inputs without reintroducing deferred power nodes into normal play', () => {
    const state = createInitialState(37), sector = state.sectors['5,5'];
    const power = machine('powerSplitter', 'power');
    sector.nodes = [machine('devSource', 'dev', 400), power];
    sector.connections = [{ id: 'power-feed', from: 'dev', to: 'power', fromPort: 0, toPort: 0, createdAt: 0 }];
    expect(devInputItems(power, 0, sector, state)).toEqual(['power']);
    supplyDevInputs(state, sector, new SimulationLookups(state), () => 5);
    expect(power.input).toEqual({ power: 5 });
  });

  it('keeps mismatched ordinary production outputs invalid while accepting the Dev Source', () => {
    const { engine } = setup([machine('kiln', 'kiln', 1100, { recipeId: 'charcoal' }), machine('smelter', 'smelter', 2000, { recipeId: 'smelt-copper' })]);
    expect(engine.connectPorts('kiln', 0, 'smelter', 0)).toBe(false);
    expect(engine.connectPorts('dev', 0, 'smelter', 0)).toBe(true);
  });

  it('never refunds cosmetic supply pulses as physical source stock when disconnected', () => {
    const { engine, node } = setup([machine('kiln', 'kiln', 1100, { recipeId: 'charcoal' })]);
    engine.connect('dev', 'kiln'); engine.tick(100);
    expect(engine.getState().inFlightTransfers?.some(t => t.cosmeticOnly)).toBe(true);
    engine.deleteConnection(engine.getSector().connections[0].id);
    expect(node('dev').output).toEqual({});
  });
  it('is placed, moved, removed and saved as a normal node while remaining outside the build catalog', () => {
    const { engine } = setup([]);
    expect(BUILDABLE_NODES.some(n => n.kind === 'devSource')).toBe(false);
    const id = engine.placeNode('devSource', 1000, 900)!;
    expect(id).toBeTruthy();
    expect(engine.tryMoveNodesTo({ [id]: { x: 1200, y: 900 } })).toBe(true);
    const loaded = new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))!, { autosave: false });
    expect(loaded.getSector().nodes.find(n => n.id === id)).toMatchObject({ kind: 'devSource', x: 1200 });
    loaded.deleteNodes([id]);
    expect(loaded.getSector().nodes.some(n => n.id === id)).toBe(false);
    loaded.undo();
    expect(loaded.getSector().nodes.some(n => n.id === id)).toBe(true);
  });

  it('supports ordinary input sockets, including power and unconfigured recipes, and respects the Road feed rule', () => {
    const source = machine('devSource', 'dev');
    for (const kind of Object.keys(NODE_DEFINITIONS) as NodeKind[]) {
      const target = machine(kind, 'target', 1800, { roadMode: 'export' });
      for (const [port] of getEffectiveNodeInputFamilies(target, ['treePlanter']).entries()) {
        expect(portFamiliesCompatible(source, 0, target, port, ['treePlanter']), `${kind} input ${port}`).toBe(kind !== 'road');
      }
    }
  });

  it('feeds both Smelter ingredients independently from one output and produces the selected plate', () => {
    const { engine, node } = setup([machine('smelter', 'smelter')]);
    expect(engine.getConnectionFailure('dev', 0, 'smelter', 0)).toBeUndefined();
    expect(engine.connectPorts('dev', 0, 'smelter', 0)).toBe(true);
    expect(engine.connectPorts('dev', 0, 'smelter', 1)).toBe(true);
    advance(engine, 1);
    expect(node('smelter').input).toEqual({}); // A recipe has not been chosen.
    expect(engine.setRecipe('smelter', 'smelt-copper')).toBe(true);
    const cables = engine.getSector().connections.map(c => c.id);
    advance(engine, 15);
    expect(node('smelter').output['copper-plate']).toBeGreaterThan(0);
    expect(node('smelter').input.copper).toBeLessThanOrEqual(5);
    expect(node('smelter').input.charcoal).toBeLessThanOrEqual(5);
    expect(node('dev').output).toEqual({});
    expect(engine.setRecipe('smelter', 'smelt-iron')).toBe(true);
    expect(engine.getSector().connections.map(c => c.id)).toEqual(cables);
    advance(engine, 15);
    expect(node('smelter').output['iron-plate']).toBeGreaterThan(0);
    expect(node('smelter').input.copper).toBeUndefined();
  });

  it('supplies every recipe input of advanced production machines without a shared material choice', () => {
    const { engine, node } = setup([machine('hydroProcessor', 'hydro')]);
    expect(engine.setRecipe('hydro', 'coolant')).toBe(true);
    const inputs = getEffectiveNodeInputFamilies(node('hydro'), engine.getState().research.completed);
    inputs.forEach((_, port) => expect(engine.connectPorts('dev', 0, 'hydro', port)).toBe(true));
    advance(engine, .1);
    for (const item of inputs) expect(node('hydro').input[item as keyof MachineNode['input']]).toBeGreaterThan(0);
  });

  it('fills all outstanding research Core types through a single CORE input', () => {
    const { engine, node } = setup([machine('researchCenter', 'lab')], state => {
      state.research.completed = state.research.completed.filter(id => id !== 'connectorMirroring');
    });
    engine.selectResearch('connectorMirroring');
    expect(engine.getState().research.selected).toBe('connectorMirroring');
    expect(engine.connect('dev', 'lab')).toBe(true);
    advance(engine, 2);
    const contributions = engine.getState().research.contributed;
    for (const item of ['simple-core', 'basic-core', 'automata-core', 'hydro-core', 'shiny-core', 'command-core'] as const) {
      expect(contributions[item]).toBeGreaterThan(0);
      expect(node('lab').input[item]).toBeLessThanOrEqual(5);
    }
    expect(node('lab').input['final-core']).toBeUndefined();
  });

  it('supplies Final Cores when selected research needs them', () => {
    const { engine, node } = setup([machine('researchCenter', 'lab')], state => {
      state.research.completed = state.research.completed.filter(id => id !== 'finalRobotics');
      state.finalCoreProduced = true;
    });
    expect(engine.connect('dev', 'lab')).toBe(true);
    advance(engine, .1);
    expect(node('lab').input['final-core']).toBeUndefined();
    engine.selectResearch('finalRobotics');
    expect(engine.getState().research.selected).toBe('finalRobotics');
    advance(engine, .1);
    expect(node('lab').input['final-core']).toBe(5);
  });

  it('supplies growth, bots and Stone and funds Tree Planters without Power', () => {
    const { engine, node } = setup([
      machine('treePlanter', 'planter', 1100),
      machine('monster-camp', 'camp', 2400, { y: 1500, campStrength: 25, attackRequirement: 24, progressMs: 59900 }),
      machine('big-hole', 'hole', 1100, { y: 1900, resourceRemaining: 20 }),
      machine('forest', 'forest', 3100, { resourceItem: 'wood', resourceRemaining: 995, resourceCapacity: 1000 }),
    ]);
    for (const id of ['camp', 'hole', 'forest', 'planter']) {
      expect(engine.getConnectionFailure('dev', 0, id, 0), id).toBeUndefined();
      expect(engine.connect('dev', id), id).toBe(true);
    }
    expect(engine.connectPorts('dev',0,'planter',1)).toBe(true);
    expect(engine.connectPorts('dev',0,'planter',2)).toBe(true);
    advance(engine, .1);
    expect(node('planter').input.power).toBeUndefined();
    expect(node('camp').campStrength).toBe(15);
    expect(node('camp').suppressed).toBe(true);
    expect(node('hole').resourceRemaining).toBe(19);
    expect(node('forest').resourceRemaining).toBe(1000);
    advance(engine, 1);
    expect(node('planter').output['forest-growth']).toBeGreaterThan(0);
  });

  it('supplies an Extractor with an infinite reserve inferred from its downstream recipe', () => {
    const { engine, node } = setup([machine('extractor', 'extractor', 1100), machine('smelter', 'smelter', 1900)]);
    engine.setRecipe('smelter', 'smelt-copper');
    expect(engine.connectPorts('extractor', 0, 'smelter', 0)).toBe(true);
    expect(engine.connect('dev', 'extractor')).toBe(true);
    advance(engine, 6);
    expect(engine.getState().extracted?.copper).toBeGreaterThan(0);
    expect(productionPortRow(node('extractor'), 'input', 0, engine.getSector())).toMatchObject({ name: 'Copper', amount: 1, capacity: 1 });
    expect(productionVisual(node('extractor'), engine.getState(), engine.getSector()).missingInputs).toEqual([]);
    expect(node('extractor').input).toEqual({});
  });

  it('supplies Pumps and Golem fights without pretending to be a Lake or deposit', () => {
    const { engine, node } = setup([machine('fluidLink', 'pump', 1100), machine('resourceGolem', 'golem', 2700, { health: 180, golemCostVersion: 2, golemMineral: 'iron' })]);
    expect(engine.connect('dev', 'pump')).toBe(true);
    expect(engine.connect('dev', 'golem')).toBe(true);
    advance(engine, 1);
    expect(node('pump').output.water).toBeGreaterThan(0);
    expect(engine.getState().extracted?.water ?? 0).toBe(0);
    expect(node('golem').health).toBeLessThan(180);
  });

  it('retains ordinary compatibility checks for player production sources', () => {
    const { engine } = setup([machine('kiln', 'kiln', 1100, { recipeId: 'charcoal' }), machine('treePlanter', 'planter', 2000)]);
    expect(engine.connect('kiln', 'planter')).toBe(false);
    expect(engine.getConnectionFailure('dev', 0, 'planter', 0)).toBeUndefined();
    expect(engine.connect('dev', 'planter')).toBe(true);
  });
});
