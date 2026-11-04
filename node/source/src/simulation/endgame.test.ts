import { describe, expect, it } from 'vitest';
import type { GameState, ItemId, MachineNode } from '../domain/types';
import { ALPHA_AP, CORNER_MAPS, ENDGAME_CAPS, GROVE_GROWTH, PAIRS, SEVEN_CORES, atResearchCap, landfillTotal, reconcileHole, seededCornerOrder, seededPairIndex } from '../content/endgame';
import { applyCartUpgrades, vehiclePayload } from '../content/cartUpgrades';
import { isPlayerMovableNode } from '../content/nodeModules';
import { RECYCLER_RETURNS, recyclerAccepts } from '../content/recycling';
import { getResearchCosts, getResearchProject } from '../content/research';
import { isRecipeAvailable } from '../content/recipeAvailability';
import { createInitialState, GameEngine } from './engine';
import { createCornerNodes, initializeEndgame, simulateCorner, simulateRecycler } from './endgameRuntime';
import { applyExpansionRescue, nextExpansionShortages, shortestRescuePath } from './expansionRescue';
import { generateSector } from './worldGeneration';
import { roadChannels } from './progression';
import { researchCardDetails, researchSection } from '../ui/researchPresentation';

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
    box.output.alpha=9;simulateCorner(state,sector,node);expect(box.output.alpha).toBe(10);expect(node.cornerProgress).toBe(17);expect(node.input['command-suppression-bot']).toBe(0);
    expect(state.endgame?.componentObtained).toBe(true);
  });
  it('requires all Foundry parts and converts atomically with no extra timer',()=>{
    const {state,sector,node,box}=corner('foundry');node.input={'ceramic-electrode':3000,'sealed-frame':2999,'mythril-gear':3000};
    simulateCorner(state,sector,node);expect(node.input['ceramic-electrode']).toBe(3000);expect(box.output).toEqual({});
    node.input['sealed-frame']=3000;box.output['foundry-component']=10;simulateCorner(state,sector,node);expect(node.input['ceramic-electrode']).toBe(3000);
    box.output['foundry-component']=9;simulateCorner(state,sector,node);expect(box.output['foundry-component']).toBe(10);expect(Object.values(node.input)).toEqual([0,0,0]);expect(node.batch).toBeUndefined();
  });
  it('carries Grove growth and preserves waiting supplies across full output',()=>{
    const {state,sector,node,box}=corner('grove');node.cornerProgress=GROVE_GROWTH-3;node.input['forest-growth']=10;simulateCorner(state,sector,node);
    expect(box.output['grove-component']).toBe(1);expect(node.cornerProgress).toBe(7);
    box.output['grove-component']=10;node.input['forest-growth']=10;simulateCorner(state,sector,node);expect(node.input['forest-growth']).toBe(10);expect(node.cornerProgress).toBe(7);
  });
  it('accepts mixed Reclamation waste with provisional type-specific credits and conserved surplus',()=>{
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
  it('unlocks recipes from a real corner award, not discovery, and retains the unlock after spending',()=>{
    const s=createInitialState(20);const cornerSector=generateSector(0,0,s.seed);cornerSector.unlocked=true;s.sectors[cornerSector.id]=cornerSector;
    const e=new GameEngine(s,{autosave:false});expect(e.getState().research.completed).not.toContain('cornerComponents');
    e.getState().endgame!.componentObtained=true;e.tick(1);expect(e.getState().research.completed).toContain('cornerComponents');
    const loaded=new GameEngine(structuredClone(e.getState()),{autosave:false});expect(loaded.getState().endgame).toEqual(e.getState().endgame);expect(loaded.getState().research.completed).toContain('cornerComponents');
  });
  it('produces both seeded halves and a Final Core through wired ordinary Assemblers',()=>{
    const s=createInitialState(28);initializeEndgame(s);s.research.completed=['assembler'];s.research.unlocked=['assembler'];
    const a=machine('assembler','a',600,500),b=machine('assembler','b',600,1100),final=machine('assembler','final',1700,800);
    a.recipeId=`core-half-a-${s.endgame!.pairIndex}`;b.recipeId=`core-half-b-${s.endgame!.pairIndex}`;final.recipeId='final-core';
    const items={alpha:'alpha',foundry:'foundry-component',reclamation:'reclamation-component',grove:'grove-component'} as const;
    for(const [index,pair]of PAIRS[s.endgame!.pairIndex].entries())for(const c of pair)(index?b:a).input[items[c]]=1;
    s.sectors['5,5'].nodes=[a,b,final];const e=new GameEngine(s,{autosave:false});expect(e.connect('a','final')).toBe(true);expect(e.connect('b','final')).toBe(true);ticks(e,45);
    expect(e.getState().produced?.['core-half-a']).toBe(1);expect(e.getState().produced?.['core-half-b']).toBe(1);expect(e.getState().produced?.['final-core']).toBe(1);expect(e.getState().finalCoreProduced).toBe(true);expect(e.getState().research.completed).toContain('finalCoreProduction');
  });
});

describe('Recycler conservation',()=>{
  it('uses fixed standard constituents, including Wood, with no fluids and at most one each',()=>{
    expect(RECYCLER_RETURNS['iron-plate']).toEqual({iron:1,wood:1});
    for(const returns of Object.values(RECYCLER_RETURNS)){for(const [i,n]of Object.entries(returns??{})){expect(['iron','copper','stone','mythril','wood']).toContain(i);expect(n).toBe(1);}}
    for(const item of ['slag','metallic-fines','glassy-crust','spent-flux','final-core'] as ItemId[])expect(recyclerAccepts(item)).toBe(false);
  });
  it('preserves FIFO and a blocked return set; zero-return raw items can process with full output',()=>{
    const n=machine('recycler');n.input={'iron-plate':1,wood:1};n.inputQueue=['iron-plate','wood'];n.output={iron:9};n.progressMs=1000;
    simulateRecycler(n,1000);expect(n.input['iron-plate']).toBe(1);expect(n.progressMs).toBe(1000);expect(n.input.wood).toBe(1);
    n.output.iron=8;simulateRecycler(n,1000);expect(n.input['iron-plate']).toBe(0);expect(n.output).toEqual({iron:9,wood:1});
    simulateRecycler(n,2000);expect(n.input.wood).toBe(0);expect(n.output).toEqual({iron:9,wood:1});
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
    const s=createInitialState();s.sectors['5,5'].nodes=[machine('researchCenter','lab')];s.produced!['final-core']=1;
    const e=new GameEngine(s,{autosave:false});e.selectResearch('victory');e.getSector().nodes[0].input['final-core']=1;
    ticks(e,4);expect(e.getState().research.completed).not.toContain('victory');ticks(e,1);expect(e.getState().research.completed).toContain('victory');
    expect(e.getState().endgame!.victoryAcknowledged).toBeUndefined();e.acknowledgeVictory();expect(new GameEngine(e.getState(),{autosave:false}).getState().endgame!.victoryAcknowledged).toBe(true);
  });
  it('caps finite recurring lines and retains a single completed research entry',()=>{
    const s=createInitialState();s.research.completed=['victory','roadChannels2'];s.research.repeatableCompletions={advancedRoadChannels:2,efficientLandfill:45};
    for(const [id,cap]of Object.entries(ENDGAME_CAPS)){expect(atResearchCap(getResearchProject(id)!,s.research)).toBe(true);expect(s.research.repeatableCompletions[id]).toBe(cap);expect(researchSection(getResearchProject(id)!,s)).toBe('completed');expect(researchCardDetails(getResearchProject(id)!,s).selectable).toBe(false);}
    const e=new GameEngine(s,{autosave:false});e.selectResearch('advancedRoadChannels');expect(e.getState().research.selected).toBeUndefined();expect(roadChannels(e.getState())).toBe(5);
  });
  it('credits paid hole fill against exact compounded bills and never refunds',()=>{
    expect(landfillTotal(250,2)).toBe(160);expect(landfillTotal(20000,44)).toBe(2);expect(landfillTotal(20000,45)).toBe(1);
    const s=createInitialState();s.research.repeatableCompletions={efficientLandfill:1};const n=machine('big-hole');n.holeBaseStone=250;n.holeStoneConsumed=100;reconcileHole(n,s);expect(n.resourceRemaining).toBe(100);
    s.research.repeatableCompletions.efficientLandfill=4;reconcileHole(n,s);expect(n.resourceRemaining).toBe(3);s.research.repeatableCompletions.efficientLandfill=5;reconcileHole(n,s);expect(n.resourceRemaining).toBe(0);expect(n.holeStoneConsumed).toBe(100);
  });
  it('preserves unused Stone when a discounted, already-paid hole is cleared',()=>{
    const s=createInitialState();s.research.repeatableCompletions={efficientLandfill:5};const n=machine('big-hole','hole');n.holeBaseStone=250;n.holeStoneConsumed=100;n.input.stone=3;s.sectors['5,5'].nodes=[n];
    const e=new GameEngine(s,{autosave:false});expect(e.getSector().nodes[0].resourceRemaining).toBe(0);expect(e.clearFilledBigHole('hole')).toBe(true);expect(e.getSector().nodes.some(n=>n.kind==='big-hole')).toBe(false);expect(e.getSector().nodes.reduce((q,n)=>q+(n.output.stone??0)+(n.input.stone??0),0)).toBe(3);
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
    const s=createInitialState();s.research.completed=['lakeRelocation','resourceRelocation'];const lake=machine('lake','lake',1600,1400);lake.obstructionWidth=150;lake.obstructionHeight=120;const intake=machine('lakeIntake','intake',2500,1800);intake.output.water=20;s.sectors['5,5'].nodes=[lake,intake];s.sectors['5,5'].connections=[{id:'c',from:'lake',to:'intake',createdAt:0}];const e=new GameEngine(s,{autosave:false});expect(e.tryMoveNodesTo({lake:{x:1600,y:1800}})).toBe(true);expect(e.getSector().nodes[1].x).toBe(2500);expect(e.getSector().nodes[1].output.water).toBe(20);expect(e.getSector().connections).toHaveLength(1);
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
  it('opens a shortest path and usable reserve once, retaining quote, paid progress and map points',()=>{
    const s=depleted();s.research.projectContributions={mapNode:{'simple-core':1}};expect(applyExpansionRescue(s)).toBe(true);expect(s.rescue!.resources).toEqual(['copper']);const p=s.rescue!.pending!;expect(s.sectors[p.sectorId].nodes.some(n=>n.infiniteResource&&n.resourceItem==='copper')).toBe(true);expect(s.research.projectContributions.mapNode['simple-core']).toBe(1);expect(s.research.mapPoints).toBe(0);expect(applyExpansionRescue(s)).toBe(false);expect(shortestRescuePath(s,p.sectorId)).toEqual([]);
    const e=new GameEngine(s,{autosave:false});e.acknowledgeRescue();ticks(e,2);expect(e.getState().rescue!.resources).toEqual(['copper']);
  });
  it('ignores renewable Wood and worlds without further map purchases',()=>{
    const s=createInitialState();s.research.completed=['exploration'];s.sectors['5,5'].nodes.find(n=>n.kind==='forest')!.resourceRemaining=0;expect(nextExpansionShortages(s)).toEqual([]);s.research.mapPoints=120;expect(nextExpansionShortages(s)).toEqual([]);
  });
});
