import { describe, expect, it } from 'vitest';
import type { GameState, ItemId, MachineNode } from '../domain/types';
import { ALPHA_AP, CORNER_MAPS, ENDGAME_CAPS, FOUNDRY_INPUTS, GROVE_GROWTH, PAIRS, SEVEN_CORES, atResearchCap, landfillTotal, reconcileHole, seededCornerOrder, seededPairIndex } from '../content/endgame';
import { applyCartUpgrades, vehiclePayload } from '../content/cartUpgrades';
import { isPlayerMovableNode } from '../content/nodeModules';
import { RECYCLER_BREAKDOWN_RECIPES, RECYCLER_RETURNS } from '../content/recycling';
import { getResearchCosts, getResearchProject } from '../content/research';
import { isRecipeAvailable } from '../content/recipeAvailability';
import { RECIPES } from '../content/recipes';
import { createInitialState, GameEngine } from './engine';
import { createCornerNodes, initializeEndgame, simulateCorner } from './endgameRuntime';
import { applyExpansionRescue, nextExpansionShortages, shortestRescuePath } from './expansionRescue';
import { generateSector, sectorDistance } from './worldGeneration';
import { roadChannels } from './progression';
import { researchCardDetails, researchSection } from '../ui/researchPresentation';
import { normalizeLegacy } from '../persistence/saves';
import { deepHoleStoneReadout } from '../renderer/playfieldNodeState';

function corner(type: NonNullable<MachineNode['cornerType']>) {
  const state=createInitialState(123); initializeEndgame(state);
  const sector=state.sectors['5,5'];sector.nodes=createCornerNodes(0,0,state.seed,{width:10000,height:8000},[type,'foundry','reclamation','grove']);
  return {state,sector,node:sector.nodes[0],box:sector.nodes[1]};
}
const machine=(kind:MachineNode['kind'],id='n',x=1500,y=1400):MachineNode=>({kind,id,name:id,x,y,rotation:0,input:{},output:{},progressMs:0,cycleMs:2000,constructedAt:0,constructionMs:0});
function ticks(engine:GameEngine,n:number){for(let i=0;i<n;i++)engine.tick(1000);}

describe('repeatable corner production and seeded assembly',()=>{
  it('permutes all four corners deterministically and independently selects all three pairings',()=>{
    const seen=new Set<number>();const layouts=new Set<string>();
    for(let seed=0;seed<100;seed++){
      const order=seededCornerOrder(seed);expect([...order].sort()).toEqual(['alpha','foundry','grove','reclamation']);
      expect(seededCornerOrder(seed)).toEqual(order);seen.add(seededPairIndex(seed));layouts.add(order.join(','));
      for(const [i,key]of CORNER_MAPS.entries()){const [x,y]=key.split(',').map(Number),s=generateSector(x,y,seed);expect(s.nodes[0].cornerType).toBe(order[i]);expect(s.nodes[1].tributeCampId).toBe(s.nodes[0].id);}
    }
    expect(seen.size).toBe(3);expect(layouts.size).toBeGreaterThan(10);
  });
  it('carries Alpha overpayment and stops consuming bots while output is full',()=>{
    const {state,sector,node,box}=corner('alpha');node.cornerProgress=ALPHA_AP-3;node.input['command-suppression-bot']=1;
    box.output.alpha=10;simulateCorner(state,sector,node);expect(node.input['command-suppression-bot']).toBe(1);
    box.output.alpha=9;simulateCorner(state,sector,node);expect(box.output.alpha).toBe(10);expect(node.cornerProgress).toBe(21);expect(node.input['command-suppression-bot']).toBe(0);
    expect(state.produced?.alpha).toBe(1);
  });
  it('requires all Foundry parts and converts atomically with no extra timer',()=>{
    const {state,sector,node,box}=corner('foundry');node.input={...FOUNDRY_INPUTS,'sealed-frame':FOUNDRY_INPUTS['sealed-frame']!-1};
    simulateCorner(state,sector,node);expect(node.input['ceramic-electrode']).toBe(FOUNDRY_INPUTS['ceramic-electrode']);expect(box.output).toEqual({});
    node.input['sealed-frame']=FOUNDRY_INPUTS['sealed-frame'];box.output['foundry-component']=10;simulateCorner(state,sector,node);expect(node.input['ceramic-electrode']).toBe(FOUNDRY_INPUTS['ceramic-electrode']);
    box.output['foundry-component']=9;simulateCorner(state,sector,node);expect(box.output['foundry-component']).toBe(10);expect(Object.values(node.input)).toEqual([0,0,0]);expect(node.batch).toBeUndefined();
  });
  it('carries Grove growth and preserves waiting supplies across full output',()=>{
    const {state,sector,node,box}=corner('grove');node.cornerProgress=GROVE_GROWTH-3;node.input['forest-growth']=10;simulateCorner(state,sector,node);
    expect(box.output['grove-component']).toBe(1);expect(node.cornerProgress).toBe(7);
    box.output['grove-component']=10;node.input['forest-growth']=10;simulateCorner(state,sector,node);expect(node.input['forest-growth']).toBe(10);expect(node.cornerProgress).toBe(7);
  });
  it('delivers paid Planter growth through a real cable, persists it and awards a component',()=>{
    const {state,sector,node,box}=corner('grove');
    state.research.completed=['treePlanter'];state.research.unlocked=['treePlanter'];
    const planter=machine('treePlanter','planter',node.x-700,node.y);
    planter.input={wood:20,'iron-plate':2,stone:2};
    sector.nodes.push(planter);
    const engine=new GameEngine(state,{autosave:false});
    expect(engine.connect(planter.id,node.id)).toBe(true);
    ticks(engine,110);
    const grown=engine.getSector().nodes.find(n=>n.id===node.id)!;
    expect(grown.cornerProgress).toBeGreaterThan(100);
    expect(engine.getSector().nodes.find(n=>n.id===planter.id)!.input.wood).toBe(0);
    const resumed=new GameEngine(structuredClone(engine.getState()),{autosave:false});
    const saved=resumed.getSector().nodes.find(n=>n.id===node.id)!;
    expect(saved.cornerProgress).toBe(grown.cornerProgress);
    saved.cornerProgress=GROVE_GROWTH-2;
    ticks(resumed,5);
    expect(resumed.getSector().nodes.find(n=>n.id===box.id)!.output['grove-component']).toBe(1);
    expect(resumed.getState().research.completed).not.toContain('cornerComponents');
    expect(saved.cornerProgress).toBeLessThan(10);
  });
  it('accepts mixed Reclamation waste with type-specific credits and conserved surplus',()=>{
    const {state,sector,node,box}=corner('reclamation');node.cornerProgress=.999999;node.input={'metallic-fines':1,'spent-flux':1};simulateCorner(state,sector,node);
    expect(box.output['reclamation-component']).toBe(1);expect(node.cornerProgress).toBeGreaterThan(0);expect(node.input['spent-flux']).toBe(0);
    box.output['reclamation-component']=10;node.input.slag=5;simulateCorner(state,sector,node);expect(node.input.slag).toBe(5);
  });
  it.each([0,1,2])('offers only the saved pair recipes for partition %i',pairIndex=>{
    const state=createInitialState();initializeEndgame(state);state.endgame!.pairIndex=pairIndex;state.research.completed=['assembler','cornerComponents'];state.research.unlocked=[...state.research.completed];
    expect(new Set(PAIRS[pairIndex].flat()).size).toBe(4);
    for(let p=0;p<3;p++)for(const half of ['a','b'])expect(isRecipeAvailable(`core-half-${half}-${p}`,state,'assembler')).toBe(p===pairIndex);
    expect(isRecipeAvailable('final-core',state,'assembler')).toBe(true);
  });
  it('completes End of the World on first Complex Core production even without a corner piece',()=>{
    const state = createInitialState(20);
    state.research.completed.push('assembler', 'precisionControl');
    state.research.unlocked.push('assembler');
    const assembler = machine('advancedAssembler', 'complex');
    const recipe = RECIPES['command-core'];
    assembler.recipeId = recipe.id;
    assembler.input = { ...recipe.inputs };
    state.sectors['5,5'].nodes = [assembler];
    const engine = new GameEngine(state, { autosave: false });
    const project = getResearchProject('cornerComponents')!;
    expect(researchCardDetails(project, engine.getState()).complete).toBe(false);
    ticks(engine, Math.ceil(recipe.cycleMs / 1000) + 1);
    expect(engine.getState().produced?.['command-core']).toBe(1);
    expect(researchCardDetails(project, engine.getState()).complete).toBe(true);
    expect(isRecipeAvailable('final-core', engine.getState(), 'assembler')).toBe(true);
  });
  it('produces both seeded halves and a Final Core through wired ordinary Assemblers',()=>{
    const s=createInitialState(28);initializeEndgame(s);s.research.completed=['assembler'];s.research.unlocked=['assembler'];
    s.produced!['command-core'] = 1;
    const a=machine('assembler','a',600,500),b=machine('assembler','b',600,1100),final=machine('assembler','final',1700,800);
    a.recipeId=`core-half-a-${s.endgame!.pairIndex}`;b.recipeId=`core-half-b-${s.endgame!.pairIndex}`;final.recipeId='final-core';
    const items={alpha:'alpha',foundry:'foundry-component',reclamation:'reclamation-component',grove:'grove-component'} as const;
    for(const [index,pair]of PAIRS[s.endgame!.pairIndex].entries())for(const c of pair)(index?b:a).input[items[c]]=1;
    s.sectors['5,5'].nodes=[a,b,final];const e=new GameEngine(s,{autosave:false});expect(e.connect('a','final')).toBe(true);expect(e.connect('b','final')).toBe(true);ticks(e,45);
    expect(e.getState().produced?.['core-half-a']).toBe(1);expect(e.getState().produced?.['core-half-b']).toBe(1);expect(e.getState().produced?.['final-core']).toBe(1);expect(e.getState().finalCoreProduced).toBe(true);expect(e.getState().research.completed).toContain('finalCoreProduction');
    expect(e.getState().researchLog?.some(event => event.projectId === 'finalCoreProduction')).toBe(false);
  });
});

describe('Recycler conservation',()=>{
  it('uses fixed standard constituents, including Wood, with no fluids and at most one each',()=>{
    expect(RECYCLER_RETURNS['iron-plate']).toEqual({iron:1,wood:1});
    for(const returns of Object.values(RECYCLER_RETURNS)){for(const [i,n]of Object.entries(returns??{})){expect(['iron','copper','stone','mythril','wood']).toContain(i);expect(n).toBe(1);}}
    for(const item of ['water','slag','metallic-fines','glassy-crust','spent-flux','final-core'] as ItemId[])expect(RECYCLER_RETURNS[item]).toBeUndefined();
  });
  it('lists one Water per breakdown and spends it only when the next item can finish', () => {
    for (const recipe of RECYCLER_BREAKDOWN_RECIPES) {
      expect(recipe.inputs.water, recipe.name).toBe(1);
    }
    const state = createInitialState();
    state.research.completed.push('recycler');
    state.research.unlocked.push('recycler');
    state.sectors['5,5'].nodes = [machine('recycler')];
    const engine = new GameEngine(state, { autosave: false });
    const recycler = engine.getSector().nodes[0];
    expect(engine.setRecipe(recycler.id, 'recycle-iron-plate')).toBe(true);
    recycler.input = { 'iron-plate': 1, wood: 1 };
    engine.tick(1000);
    engine.tick(1000);
    expect(recycler.input).toEqual({ 'iron-plate': 1, wood: 1 });
    expect(recycler.progressMs).toBe(0);

    recycler.input.water = 1;
    recycler.output = { iron: 9 };
    engine.tick(1000);
    expect(recycler.input).toEqual({ 'iron-plate': 1, wood: 1, water: 1 });
    expect(recycler.batch).toBeUndefined();

    recycler.output.iron = 8;
    engine.tick(1000);
    expect(engine.setRecipe(recycler.id, 'recycle-wood')).toBe(false);
    engine.tick(1000);
    expect(recycler.input).toEqual({ 'iron-plate': 0, wood: 1, water: 0 });
    expect(recycler.output).toEqual({ iron: 9, wood: 1 });

    recycler.input.water = 1;
    engine.tick(1000);
    expect(recycler.input.wood).toBe(1);
    expect(recycler.input.water).toBe(1);
    expect(engine.setRecipe(recycler.id, 'recycle-wood')).toBe(true);
    recycler.input = { wood: 1, water: 1 };
    engine.tick(1000);
    engine.tick(1000);
    expect(recycler.input).toEqual({ wood: 0, water: 0 });
    expect(recycler.output).toEqual({});
  });
});

describe('endgame research and preservation',()=>{
  it('quotes the shared independently rounded seven-Core ladder for separate projects',()=>{
    for(const id of ['resourceRegeneration','efficientLandfill','trainFreightCapacity','storagePlacementCapacity','inventoryPlacementCapacity','storageConnectionCapacity','inventoryConnectionCapacity']){
      const p=getResearchProject(id)!;expect([0,1,2,3,4].map(r=>getResearchCosts(p,r)['final-core'])).toEqual([1,2,3,4,6]);expect(Object.keys(p.costs)).toEqual(SEVEN_CORES);
    }
    expect(getResearchProject('autonomousLogistics')!.costs['final-core']).toBe(1);
  });
  it('pays victory through the ordinary lab cadence and persists acknowledgement separately',()=>{
    const s=createInitialState();s.sectors['5,5'].nodes=[machine('researchCenter','lab')];
    const e=new GameEngine(s,{autosave:false}),lab=e.getSector().nodes[0];
    expect(getResearchProject('victory')!.trigger).toBeUndefined();
    expect(getResearchProject('victory')!.costs).toEqual(Object.fromEntries(SEVEN_CORES.map(core=>[core,1])));
    lab.input=Object.fromEntries(SEVEN_CORES.map(core=>[core,1]));
    e.selectResearch('victory');
    expect(e.getState().research.selected).toBeUndefined();
    e.getState().produced!['final-core'] = 1;
    ticks(e,6);expect(e.getState().research.completed).not.toContain('victory');
    expect(lab.input['final-core']).toBe(1);
    delete lab.input['command-core'];e.selectResearch('victory');ticks(e,5);
    expect(e.getState().research.completed).not.toContain('victory');
    expect(lab.input['final-core']).toBe(1);expect(lab.input['simple-core']).toBe(1);
    lab.input['command-core']=1;
    ticks(e,4);expect(e.getState().research.completed).not.toContain('victory');ticks(e,1);expect(e.getState().research.completed).toContain('victory');
    expect(SEVEN_CORES.map(core=>lab.input[core])).toEqual(SEVEN_CORES.map(()=>0));
    expect(e.getState().endgame!.victoryAcknowledged).toBeUndefined();e.acknowledgeVictory();expect(new GameEngine(e.getState(),{autosave:false}).getState().endgame!.victoryAcknowledged).toBe(true);
  });
  it('retires Endgame Theory without dropping historical completion or archived payments',()=>{
    const s=createInitialState();s.research.completed.push('endgameTheory');
    s.research.selected='endgameTheory';s.research.contributed={'simple-core':1,'basic-core':1};
    const e=new GameEngine(s,{autosave:false});
    expect(getResearchProject('endgameTheory')).toBeUndefined();
    expect(e.getState().research.selected).toBeUndefined();expect(e.getState().research.contributed).toEqual({});
    expect(e.getState().research.projectContributions?.endgameTheory).toEqual({'simple-core':1,'basic-core':1});
    expect(e.getState().research.completed).toContain('endgameTheory');
    const loaded=new GameEngine(structuredClone(e.getState()),{autosave:false});
    expect(loaded.getState().research).toEqual(e.getState().research);
    loaded.selectResearch('endgameTheory');expect(loaded.getState().research.selected).toBeUndefined();
  });
  it('archives an original-format Endgame Theory payment during import',()=>{
    const loaded=normalizeLegacy({version:1,nodes:[],positions:{},connections:[],runtime:{research:{activeProject:'endgameTheory',progress:{endgameTheory:1}}}})!;
    expect(loaded.research.selected).toBeUndefined();
    expect(loaded.research.projectContributions?.endgameTheory).toMatchObject({'simple-core':1});
    expect(normalizeLegacy(loaded)).toEqual(loaded);
  });
  it('caps finite recurring lines and retains a single completed research entry',()=>{
    const s=createInitialState();s.research.completed=['victory','roadChannels2'];s.research.repeatableCompletions={advancedRoadChannels:2,efficientLandfill:45};
    for(const [id,cap]of Object.entries(ENDGAME_CAPS)){expect(atResearchCap(getResearchProject(id)!,s.research)).toBe(true);expect(s.research.repeatableCompletions[id]).toBe(cap);expect(researchSection(getResearchProject(id)!,s)).toBe('completed');expect(researchCardDetails(getResearchProject(id)!,s).selectable).toBe(false);}
    const e=new GameEngine(s,{autosave:false});e.selectResearch('advancedRoadChannels');expect(e.getState().research.selected).toBeUndefined();expect(roadChannels(e.getState())).toBe(5);
  });
  it('credits paid hole fill against exact compounded bills and never refunds',()=>{
    expect(landfillTotal(250,2)).toBe(160);expect(landfillTotal(20000,44)).toBe(2);expect(landfillTotal(20000,45)).toBe(1);
    expect([1, 3, 5].map(rank => landfillTotal(4000, rank))).toEqual([3200, 2048, 1311]);
    const s=createInitialState();s.research.repeatableCompletions={efficientLandfill:1};const n=machine('big-hole');n.holeBaseStone=250;n.holeStoneConsumed=100;reconcileHole(n,s);expect(n.resourceRemaining).toBe(100);
    s.research.repeatableCompletions.efficientLandfill=4;reconcileHole(n,s);expect(n.resourceRemaining).toBe(3);s.research.repeatableCompletions.efficientLandfill=5;reconcileHole(n,s);expect(n.resourceRemaining).toBe(0);expect(n.holeStoneConsumed).toBe(100);
  });
  it('counts Stone when it reaches the Deep Hole connector and retains the count after it is used', () => {
    const state = createInitialState(6);
    const source = machine('woodenChest', 'stone-cart', 1300);
    const hole = machine('big-hole', 'hole', 1800);
    source.output.stone = 1;
    hole.resourceRemaining = 250;
    state.sectors['5,5'].nodes = [source, hole];
    const engine = new GameEngine(state, { autosave: false });
    const liveHole = engine.getSector().nodes.find(node => node.id === hole.id)!;
    expect(engine.connect(source.id, hole.id)).toBe(true);
    liveHole.processingPaused = true;

    engine.tick(400);
    expect(engine.getActiveTransfers()).toHaveLength(1);
    expect(deepHoleStoneReadout(liveHole, 0)).toBe('STONE 0 / 250');
    engine.tick(1000);
    expect(liveHole.input.stone).toBe(1);
    expect(deepHoleStoneReadout(liveHole, 0)).toBe('STONE 1 / 250');
    liveHole.processingPaused = false;
    engine.tick(400);
    expect(liveHole.holeStoneConsumed).toBe(1);
    expect(deepHoleStoneReadout(liveHole, 0)).toBe('STONE 1 / 250');
  });
  it('reopens the field on the final Stone delivery and returns surplus Stone still in transit', () => {
    const state = createInitialState(6);
    const source = machine('woodenChest', 'stone-cart', 1300);
    const hole = machine('big-hole', 'hole', 1800);
    source.output.stone = 2;
    hole.resourceRemaining = 1;
    state.sectors['5,5'].nodes = [source, hole];
    const engine = new GameEngine(state, { autosave: false });
    expect(engine.connect(source.id, hole.id)).toBe(true);

    engine.tick(400);
    engine.tick(400);
    expect(engine.getActiveTransfers()).toHaveLength(2);
    expect(engine.getSector().nodes.some(node => node.id === hole.id)).toBe(true);

    engine.tick(600);
    expect(engine.getSector().nodes.map(node => node.id)).toEqual([source.id]);
    expect(engine.getSector().nodes[0].output.stone).toBe(1);
    expect(engine.getSector().connections).toHaveLength(0);
    expect(engine.getActiveTransfers()).toHaveLength(0);
    expect(engine.placeNode('kiln', hole.x, hole.y)).toBeTruthy();
  });
  it('uses the discounted bill even when Stone deliveries exceed the new total', () => {
    const state = createInitialState();
    const hole = machine('big-hole');
    hole.holeBaseStone = 250;
    hole.holeStoneConsumed = 100;
    hole.input.stone = 3;
    state.research.repeatableCompletions = { efficientLandfill: 4 };
    reconcileHole(hole, state);
    expect(deepHoleStoneReadout(hole, 4)).toBe('STONE 103 / 103');
    state.research.repeatableCompletions.efficientLandfill = 5;
    reconcileHole(hole, state);
    expect(deepHoleStoneReadout(hole, 5)).toBe('STONE 103 / 82');
  });
  it('retains the original save’s Stone requirement and fill progress', () => {
    const state = normalizeLegacy({
      version: 1, nodes: [], runtime: { bigHoles: { hole: { stoneRequirement: 250, stoneFilled: 75 } } },
    })!;
    const engine = new GameEngine(state, { autosave: false });
    const hole = engine.getSector().nodes.find(node => node.id === 'hole')!;
    expect(hole.resourceRemaining).toBe(175);
    expect(deepHoleStoneReadout(hole, 0)).toBe('STONE 75 / 250');
  });
  it('automatically clears an already-paid hole after a Landfill discount and preserves its unused Stone', () => {
    const state = createInitialState();
    state.research.repeatableCompletions = { efficientLandfill: 4 };
    const hole = machine('big-hole', 'hole');
    hole.holeBaseStone = 250;
    hole.holeStoneConsumed = 100;
    hole.input.stone = 3;
    state.sectors['5,5'].nodes = [hole];
    const engine = new GameEngine(state, { autosave: false });
    expect(engine.getSector().nodes[0].resourceRemaining).toBe(3);

    engine.getState().research.repeatableCompletions!.efficientLandfill = 5;
    engine.tick(100);
    expect(engine.getSector().nodes).toMatchObject([{ kind: 'woodenChest', output: { stone: 3 } }]);
  });
  it('clears already-filled saved holes on load, including holes with only a remaining bill', () => {
    const state = createInitialState();
    const filled = machine('big-hole', 'filled');
    Object.assign(filled, { holeBaseStone: 250, holeStoneConsumed: 250, resourceRemaining: 0 });
    const older = machine('big-hole', 'older', 2000);
    older.resourceRemaining = 0;
    const partial = machine('big-hole', 'partial', 2500);
    partial.resourceRemaining = 1;
    state.sectors['5,5'].nodes = [filled, older, partial];

    const engine = new GameEngine(state, { autosave: false });
    expect(engine.getSector().nodes).toMatchObject([{ id: partial.id, resourceRemaining: 1 }]);
  });
  it('adds the researched passive rate per endgame regeneration rank, including Forests',()=>{
    const s=createInitialState();s.research.completed=['mineralRegeneration','mineralRegeneration2'];s.research.repeatableCompletions={resourceRegeneration:2};const forest=machine('forest','forest'),iron=machine('iron','iron');
    Object.assign(forest,{resourceItem:'wood',resourceRemaining:0,resourceCapacity:100});Object.assign(iron,{resourceItem:'iron',resourceRemaining:0,resourceCapacity:100});s.sectors['5,5'].nodes=[forest,iron];const e=new GameEngine(s,{autosave:false});ticks(e,10);expect(e.getSector().nodes[0].resourceRemaining).toBe(1);expect(e.getSector().nodes[1].resourceRemaining).toBe(2);
  });
  it('upgrades custom-named vehicles and templates in place without changing stock or connections',()=>{
    const s=createInitialState();const n=machine('woodenChest');n.name='Copper department';n.output.copper=20;s.sectors['5,5'].nodes=[n];s.factoryTemplates=[{name:'route',nodes:[structuredClone(n)],connections:[]}];s.research.completed=['trains'];s.research.repeatableCompletions={trainFreightCapacity:2};applyCartUpgrades(s);
    expect(n.capacity).toBe(120);expect(n.name).toBe('Copper department');expect(n.output.copper).toBe(20);expect(s.factoryTemplates[0].nodes[0].capacity).toBe(120);expect(vehiclePayload(s.research.completed,2)).toBe(6);
  });
  it('dispatches six-item Train Road batches after two freight ranks without changing the five-second interval',()=>{
    const s=createInitialState(33),home=s.sectors['5,5'],remote=generateSector(6,5,s.seed);remote.unlocked=true;s.sectors[remote.id]=remote;
    s.research.completed=['road','trains'];s.research.unlocked=[...s.research.completed];s.research.repeatableCompletions={trainFreightCapacity:2};
    const source=machine('woodenChest','source'),sender=machine('road','send'),receiver=machine('road','receive'),sink=machine('woodenChest','sink');source.output.iron=10;
    Object.assign(sender,{roadMode:'export',pairedSectorId:remote.id,pairedRoadId:'receive'});Object.assign(receiver,{roadMode:'import',pairedSectorId:home.id,pairedRoadId:'send'});
    home.nodes=[source,sender];remote.nodes=[receiver,sink];home.connections=[{id:'feed',from:'source',to:'send',createdAt:0}];remote.connections=[{id:'exit',from:'receive',to:'sink',createdAt:0}];
    const e=new GameEngine(s,{autosave:false});ticks(e,4);expect(e.getSector().nodes[0].output.iron).toBe(10);ticks(e,1);expect(e.getSector().nodes[0].output.iron).toBe(4);const receiving=e.getState().sectors[remote.id].nodes[1];expect((receiving.input.iron??0)+(receiving.output.iron??0)).toBe(6);
  });
  it('moves a camp and Tribute together, rejects an invalid pair and supports undo',()=>{
    const s=createInitialState();s.research.completed=['campRelocation'];s.research.unlocked=[...s.research.completed];const camp=machine('monster-camp','camp',2200,1600),box=machine('goblinTribute','box',2600,1600);camp.campStrength=10;camp.lizardSettlement='camp';camp.suppressionCredit=7;box.tributeCampId=camp.id;box.output.mythril=8;s.sectors['5,5'].nodes=[camp,box];
    const e=new GameEngine(s,{autosave:false});expect(e.tryMoveNodesTo({camp:{x:2300,y:1700}})).toBe(true);expect(e.getSector().nodes[1]).toMatchObject({x:2700,y:1700,output:{mythril:8}});expect(e.getSector().nodes[0].suppressionCredit).toBe(7);
    expect(e.tryMoveNodesTo({camp:{x:10,y:10}})).toBe(false);expect(e.getSector().nodes[0].x).toBe(2300);e.undo();expect(e.getSector().nodes[0].x).toBe(2200);
  });
  it('moves a Lake without its Intake and preserves cleared-Golem state',()=>{
    const s=createInitialState();s.research.completed=['lakeRelocation','resourceRelocation'];const lake=machine('lake','lake',1600,1400);lake.obstructionWidth=150;lake.obstructionHeight=120;const intake=machine('fluidLink','intake',2500,1800);intake.output.water=20;s.sectors['5,5'].nodes=[lake,intake];s.sectors['5,5'].connections=[{id:'c',from:'lake',to:'intake',createdAt:0}];const e=new GameEngine(s,{autosave:false});expect(e.tryMoveNodesTo({lake:{x:1600,y:1800}})).toBe(true);expect(e.getSector().nodes[1].x).toBe(2500);expect(e.getSector().nodes[1].output.water).toBe(20);expect(e.getSector().connections).toHaveLength(1);
    const reserve=machine('iron');reserve.golemMineral='iron';reserve.defeated=true;reserve.infiniteResource=true;expect(isPlayerMovableNode(reserve.kind,s,reserve)).toBe(true);expect(isPlayerMovableNode('resourceGolem',s)).toBe(false);expect(isPlayerMovableNode('cornerChallenge',s)).toBe(false);
  });
});

describe('hidden expansion recovery',()=>{
  function depleted():GameState {const s=createInitialState(7);s.research.completed=['exploration'];s.research.unlocked=[...s.research.completed];s.sectors['5,5'].nodes.find(n=>n.resourceItem==='copper')!.resourceRemaining=0;initializeEndgame(s);return s;}
  it('distinguishes a permanent Copper shortage from slow production, available stock and paid research',()=>{
    const s=depleted();expect(nextExpansionShortages(s)).toEqual(['copper']);
    s.sectors['5,5'].nodes.find(n=>n.resourceItem==='copper')!.resourceRemaining=100;expect(nextExpansionShortages(s)).toEqual([]);
    s.sectors['5,5'].nodes.find(n=>n.resourceItem==='copper')!.resourceRemaining=0;s.globalPool={'simple-core':5};expect(nextExpansionShortages(s)).toEqual([]);
    s.globalPool={};s.research.projectContributions={mapNode:{'simple-core':5}};expect(nextExpansionShortages(s)).toEqual([]);s.research.projectContributions={};s.research.mapPoints=1;expect(nextExpansionShortages(s)).toEqual([]);
  });
  it.each([5, 6] as const)('opens a shortest path to a tier %i reserve once, retaining quote, paid progress and map points', tier => {
    const state = depleted();
    state.golemPlacementTier = tier;
    state.encounterLayoutVersion = tier === 6 ? 1 : 2;
    state.research.projectContributions = { mapNode: { 'simple-core': 1 } };
    expect(applyExpansionRescue(state)).toBe(true);
    expect(state.rescue!.resources).toEqual(['copper']);
    const pending = state.rescue!.pending!;
    const sector = state.sectors[pending.sectorId];
    expect(sectorDistance(sector.x, sector.y)).toBe(tier);
    expect(sector.nodes.some(node => node.infiniteResource && node.resourceItem === 'copper')).toBe(true);
    expect(state.research.projectContributions.mapNode['simple-core']).toBe(1);
    expect(state.research.mapPoints).toBe(0);
    expect(applyExpansionRescue(state)).toBe(false);
    expect(shortestRescuePath(state, pending.sectorId)).toEqual([]);
    const engine = new GameEngine(state, { autosave: false });
    engine.acknowledgeRescue();
    ticks(engine, 2);
    expect(engine.getState().rescue!.resources).toEqual(['copper']);
  });
  it('ignores renewable Wood and worlds without further map purchases',()=>{
    const s=createInitialState();s.research.completed=['exploration'];s.sectors['5,5'].nodes.find(n=>n.kind==='forest')!.resourceRemaining=0;expect(nextExpansionShortages(s)).toEqual([]);s.research.mapPoints=120;expect(nextExpansionShortages(s)).toEqual([]);
  });
});
