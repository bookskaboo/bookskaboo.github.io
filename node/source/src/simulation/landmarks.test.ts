import { describe, expect, it } from 'vitest';
// @ts-expect-error Node-only report writer; browser build intentionally omits Node ambient types.
import { mkdirSync, writeFileSync } from 'node:fs';
import { createInitialState, GameEngine } from './engine';
import { sectorDistance, sectorForState, getWorldFieldSize } from './worldGeneration';
import { validateLandmarks } from './landmarkValidation';
import { normalizeLegacy } from '../persistence/saves';
import { canPlaceGeneratedNode, borderTerrainInsets } from './borderTerrainClearance';
import { CORE_ITEMS, landmarkName, landmarkRecipeAllowed, LANDMARK_COLORS } from '../content/landmarks';
import { getEffectiveNodeInputFamilies, getNodeDisplayDefinition } from '../content/nodes';
import { getNodeModule, isPlayerMovableNode } from '../content/nodeModules';
import { RECIPES, RECIPE_GROUPS } from '../content/recipes';
import { RESEARCH_PROJECTS } from '../content/research';
import { getEfficiencyMultiplier } from '../content/efficiency';
import { getResearchCosts, isResearchAvailable } from '../content/research';
import { takeOutput } from './mixedOutput';
import { emptyMod } from '../mods/modTypes';
import { mapLandmarkSurvey, mapNodeSurvey } from '../ui/mapNodePresentation';
import type { Connection, MachineNode, NodeKind } from '../domain/types';

const advance=(engine:GameEngine,ms:number)=>{for(let t=0;t<ms;t+=100)engine.tick(Math.min(100,ms-t));};
const total=(bag:MachineNode['output'])=>Object.values(bag).reduce<number>((n,q)=>n+(q??0),0);
const machine=(kind:NodeKind,landmark?:MachineNode['landmark'],recipeId?:string):MachineNode=>({id:'subject',kind,landmark,name:landmark?landmarkName({kind,landmark}):kind,x:1000,y:1000,rotation:0,input:{},output:{},cycleMs:recipeId?RECIPES[recipeId].cycleMs:5000,progressMs:0,constructedAt:0,constructionMs:0,recipeId,triOutput:landmark==='tri'?[0,0,0]:undefined});
function fixture(node:MachineNode,dev=false,upgrades=false) {
  const state=createInitialState(81);
  state.sectors['5,5'].nodes=[node];state.sectors['5,5'].connections=[];
  state.research.unlocked=RESEARCH_PROJECTS.map(p=>p.id);
  state.research.completed=RESEARCH_PROJECTS.map(p=>p.id).filter(id=>!id.startsWith('mineralRegeneration')&&(upgrades||!/(?:[2-7]|Expansion[12])$/.test(id)));
  if(dev){const source={...machine('devSource'),id:'dev',x:300};state.sectors['5,5'].nodes.push(source);getEffectiveNodeInputFamilies(node,state.research.completed).forEach((_,port)=>state.sectors['5,5'].connections.push({id:`dev-${port}`,from:source.id,to:node.id,fromPort:0,toPort:port,createdAt:0}));}
  const engine=new GameEngine(state,{autosave:false});return {engine,node:engine.getSector().nodes.find(n=>n.id==='subject')!};
}
const edge=(from:string,to:string,fromPort=0,toPort=0):Connection=>({id:`${from}-${to}-${fromPort}-${toPort}`,from,to,fromPort,toPort,createdAt:0});

describe('seeded landmark generation',()=>{
  it('validates exact allocations, early access and collision-free footprints for 1,000 seeds',()=>{
    const quadrants=new Map<string,number>();let adjacentPairs=0;
    for(let seed=1;seed<=1000;seed++){
      const state=createInitialState(seed);validateLandmarks(state);
      expect(state.landmarkLayout).toHaveLength(17);
      const early=state.landmarkLayout![0];expect(sectorDistance(early.sector.x,early.sector.y)).toBe(1);
      expect(early.sector.nodes.some(n=>['monster-camp','big-hole','lake','resourceGolem','sortingStation'].includes(n.kind))).toBe(false);
      const q=[0,0,0,0];
      for(const entry of state.landmarkLayout!){
        const n=entry.sector.nodes.find(n=>n.id===entry.nodeId)!;
        expect(canPlaceGeneratedNode(n,entry.sector.nodes,getWorldFieldSize(state),borderTerrainInsets(state,entry.sector.id,{width:5400,height:3600}))).toBe(true);
        expect(getNodeDisplayDefinition(n).accent).toBe(n.landmark==='unknown'?LANDMARK_COLORS.unknown:LANDMARK_COLORS.ordinary);
        q[(entry.sector.x<5?0:1)+(entry.sector.y<5?0:2)]++;
        if(n.landmark==='tri')expect(entry.sector.connections.some(c=>c.to===n.id)).toBe(true);
      }
      quadrants.set(q.join('/'),(quadrants.get(q.join('/'))??0)+1);
      const coords=state.landmarkLayout!.map(e=>e.sector);
      adjacentPairs+=coords.flatMap((a,i)=>coords.slice(i+1).filter(b=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y)===1)).length;
      if(seed<=20)expect(createInitialState(seed).landmarkLayout).toEqual(state.landmarkLayout);
    }
    mkdirSync('outputs/landmark-implementation',{recursive:true});
    writeFileSync('outputs/landmark-implementation/generation-audit.json',JSON.stringify({seeds:1000,totalPerWorld:17,bandCounts:[2,5,5,5],unknownDeviceTier:8,quadrantDistributions:Object.fromEntries(quadrants),adjacentPairs},null,2));
  },120000);
  it('keeps saved discovery order authoritative and old worlds free of landmarks',()=>{
    const state=createInitialState(52);const layout=structuredClone(state.landmarkLayout!);
    const ids=layout.map(e=>e.sector.id).reverse();
    for(const id of ids){const [x,y]=id.split(',').map(Number);const sector=sectorForState(state,x,y);expect(sector.nodes.find(n=>n.landmark)?.id).toBe(`landmark-${id}`);state.sectors[id]=sector;}
    expect(state.landmarkLayout).toEqual(layout);
    const loaded=normalizeLegacy(JSON.parse(JSON.stringify(state)))!;expect(loaded.landmarkLayout).toEqual(layout);
    delete state.landmarkVersion;delete state.landmarkLayout;delete state.landmarkEligible;state.sectors={'5,5':state.sectors['5,5']};
    const old=normalizeLegacy(state)!;expect(old.landmarkLayout).toBeUndefined();
    for(const entry of layout)expect(sectorForState(old,entry.sector.x,entry.sector.y).nodes.some(n=>n.landmark)).toBe(false);
    const engine=new GameEngine(createInitialState(52),{autosave:false});engine.applyMod({...emptyMod(),rules:{worldGridSize:21}});expect(engine.getState().landmarkVersion).toBe(0);
    engine.applyMod({...emptyMod(),rules:{worldGridSize:11}});expect(engine.getState().landmarkVersion).toBe(1);expect(engine.getState().landmarkLayout).toHaveLength(17);
    const oldEngine=new GameEngine(old,{autosave:false});oldEngine.applyMod({...emptyMod(),rules:{worldGridSize:21}});oldEngine.applyMod({...emptyMod(),rules:{worldGridSize:11}});expect(oldEngine.getState().landmarkVersion).toBe(0);expect(oldEngine.getState().landmarkLayout).toBeUndefined();
  });
  it('keeps generated natural contents intact and centers dormant landmarks after expansion',()=>{
    const state=createInitialState(83),entry=state.landmarkLayout![0],plain=structuredClone(state);delete plain.landmarkLayout;delete plain.landmarkVersion;
    expect(entry.sector.nodes.filter(n=>!n.landmark)).toEqual(sectorForState(plain,entry.sector.x,entry.sector.y).nodes);
    state.research.completed.push('areaExpansion1','areaExpansion2');const sector=sectorForState(state,entry.sector.x,entry.sector.y),original=entry.sector.nodes.find(n=>n.landmark)!,node=sector.nodes.find(n=>n.landmark)!;
    expect(node.x-original.x).toBe(900);expect(node.y-original.y).toBe(600);expect(canPlaceGeneratedNode(node,sector.nodes,getWorldFieldSize(state))).toBe(true);
  });
  it('rejects malformed layout versions, allocations, tiers and active Cores on import',()=>{
    const corruptions:Array<(s:ReturnType<typeof createInitialState>)=>void>=[s=>{s.landmarkVersion=2 as 1;},s=>{s.landmarkLayout!.pop();},s=>{const n=s.landmarkLayout![1].sector.nodes.find(n=>n.landmark)!;n.activeCore='wood';}];
    for(const corrupt of corruptions){const s=createInitialState(52);corrupt(s);expect(normalizeLegacy(s)).toBeNull();}
  });
});

describe('landmark processing through the real headless engine',()=>{
  it('retains the post-victory seven-Core Resource Relocation bill',()=>{
    const project=RESEARCH_PROJECTS.find(p=>p.id==='resourceRelocation')!,completed=RESEARCH_PROJECTS.map(p=>p.id);
    expect(getResearchCosts(project)).toEqual(Object.fromEntries(CORE_ITEMS.map(core=>[core,1])));expect(isResearchAvailable(project,completed.filter(id=>id!=='victory'))).toBe(false);expect(isResearchAvailable(project,completed)).toBe(true);
  });
  it('retains completed oversized output in its paid batch through save/load without enlarging the output buffer',()=>{
    const recipe=RECIPES['efficient-hydro-piston'],subject=machine('advancedAssembler','doubler',recipe.id);subject.input={...recipe.inputs};const first=fixture(subject,false,true);advance(first.engine,recipe.cycleMs*.35);
    expect(total(first.node.output)).toBe(5);expect(total(first.node.batch!.outputs)).toBe(3);expect(first.node.batch!.finished).toBe(true);
    const replay=new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(first.engine.getState())))!,{autosave:false}),node=replay.getSector().nodes.find(n=>n.id===subject.id)!;advance(replay,10000);expect(total(node.output)).toBe(5);expect(total(node.batch!.outputs)).toBe(3);
    node.output={};node.outputQueue=[];replay.tick(1);expect(node.output).toEqual({'spent-flux':1,'metallic-fines':2});expect(node.batch).toBeUndefined();expect(total(node.input)).toBe(0);
  });
  it('keeps ordinary Recycler Water requirements while Reclaimer runs without Water',()=>{
    const recipeId=RECIPE_GROUPS.recycler.find(id=>RECIPES[id].inputs.brick)!;
    const normal=machine('recycler',undefined,recipeId);normal.input={brick:1};const a=fixture(normal);
    const recovered=machine('recycler','reclaimer',recipeId);recovered.input={brick:1};const b=fixture(recovered);
    advance(a.engine,RECIPES[recipeId].cycleMs);advance(b.engine,RECIPES[recipeId].cycleMs*.25);expect(total(a.node.output)).toBe(0);expect(b.node.output.stone).toBe(1);expect(b.node.input.water).toBeUndefined();
  });
  it('executes every eligible fixed-family Doubler recipe with unchanged ingredients and doubled outputs',()=>{
    const audit:Array<{family:string;recipe:string;maximumOutput:number}>=[];
    for(const kind of ['refiner','assembler','advancedAssembler'] as const)for(const recipeId of RECIPE_GROUPS[kind]){
      const subject=machine(kind,'doubler',recipeId),recipe=RECIPES[recipeId];
      if(!landmarkRecipeAllowed(subject,recipe))continue;
      subject.input={...recipe.inputs};const {engine,node}=fixture(subject,false,true);
      advance(engine,recipe.cycleMs*.35);
      const expected=Object.fromEntries(Object.entries(recipe.outputs).map(([item,n])=>[item,n!*2]));
      const emitted={...node.output};
      while(node.batch?.finished){expect(total(node.output)).toBeLessThanOrEqual(5);node.output={};node.outputQueue=[];engine.tick(1);for(const[item,n]of Object.entries(node.output))emitted[item as keyof typeof emitted]=(emitted[item as keyof typeof emitted]??0)+n!;}
      expect(emitted,`${kind}: ${recipeId}`).toEqual(expected);
      expect(total(node.input),`${recipeId} ingredient consumption`).toBe(0);
      audit.push({family:kind,recipe:recipeId,maximumOutput:total(recipe.outputs)*2+(recipe.chanceOutputs??[]).reduce((n,o)=>n+o.amount*2,0)});
    }
    mkdirSync('outputs/landmark-implementation',{recursive:true});writeFileSync('outputs/landmark-implementation/recipe-audit.json',JSON.stringify(audit,null,2));
  });
  it('rolls chance outputs once, doubles the resolved result and retains it across loading',()=>{
    const recipeId='mod-landmark-chance';const recipe={id:recipeId,name:'Test chance batch',inputs:{stone:1},outputs:{brick:1},cycleMs:1000,chanceOutputs:[{item:'iron' as const,amount:1,probability:.5}]};
    RECIPES[recipeId]=recipe;const results=new Set<number>();
    try {for(const seed of [1,10000,12345678,4294967295]){
      const ordinary=machine('refiner',undefined,recipeId);ordinary.input={stone:1};const doubled=machine('refiner','doubler',recipeId);doubled.input={stone:1};
      const a=fixture(ordinary),b=fixture(doubled);a.engine.getState().randomState=seed;b.engine.getState().randomState=seed;
      a.engine.tick(100);b.engine.tick(100);expect(b.engine.getState().randomState).toBe(a.engine.getState().randomState);
      const savedBatch=structuredClone(b.node.batch);const savedRandom=b.engine.getState().randomState;
      const replay=new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(b.engine.getState())))!,{autosave:false});advance(a.engine,900);advance(replay,900);
      const live=replay.getSector().nodes.find(n=>n.id==='subject')!;
      expect(live.output).toEqual(Object.fromEntries(Object.entries(a.node.output).map(([item,n])=>[item,n!*2])));expect(replay.getState().randomState).toBe(savedRandom);expect(savedBatch?.outputs).toEqual(live.output);results.add(live.output.iron??0);
    }expect([...results].sort()).toEqual([0,2]);}finally{delete RECIPES[recipeId];}
  });
  it.each([['refiner','iron-gear'],['smelter','smelt-iron'],['assembler','motor'],['advancedAssembler','hydraulic-actuator']] as const)('runs Rapid %s at 10% base time with Dev Sources, without upgrade stacking',(kind,recipeId)=>{
    const recipe=RECIPES[recipeId],{engine,node}=fixture(machine(kind,'rapid',recipeId),true,true);
    const duration=recipe.cycleMs*.1;advance(engine,duration-1);expect(total(node.output)).toBe(0);engine.tick(1);expect(node.output).toEqual(recipe.outputs);
  });
  it('keeps unreached machine and recipe unlocks gated',()=>{
    const node=machine('refiner','rapid','iron-gear');node.input={'iron-plate':5};const {engine,node:live}=fixture(node);engine.getState().research.unlocked=['extractor'];advance(engine,10000);expect(total(live.output)).toBe(0);
    expect(engine.setRecipe(live.id,'simple-core')).toBe(false);
  });
  it('gives three independent outputs from one reserve unit and pauses the shared cycle behind any full branch',()=>{
    const {engine,node}=fixture(machine('extractor','tri'));const reserve={...machine('iron'),id:'reserve',x:500,resourceItem:'iron' as const,resourceRemaining:100,resourceCapacity:100};engine.getSector().nodes.push(reserve);engine.getSector().connections=[edge('reserve',node.id)];
    advance(engine,5000);expect(reserve.resourceRemaining).toBe(99);expect(node.triOutput).toEqual([1,1,1]);expect(node.output.iron).toBe(3);
    advance(engine,20000);expect(node.triOutput).toEqual([5,5,5]);expect(reserve.resourceRemaining).toBe(95);
    takeOutput(node,'iron',5,0);advance(engine,10000);expect(node.triOutput).toEqual([0,5,5]);expect(reserve.resourceRemaining).toBe(95);
    takeOutput(node,'iron',1,1);takeOutput(node,'iron',1,2);advance(engine,5000);expect(node.triOutput).toEqual([1,5,5]);expect(reserve.resourceRemaining).toBe(94);
  });
  it('applies ordinary Extractor research to Tri Extractors and clears stock on a different source',()=>{
    const {engine,node}=fixture(machine('extractor','tri'),false,true);const reserve={...machine('iron'),id:'reserve',x:500,resourceItem:'iron' as const,resourceRemaining:100,resourceCapacity:100};engine.getSector().nodes.push(reserve);engine.getSector().connections=[edge('reserve',node.id)];
    advance(engine,5000*getEfficiencyMultiplier('extractor',engine.getState().research.completed));expect(node.output.iron).toBe(3);
    reserve.resourceItem='copper' as 'iron';engine.tick(1);expect(node.output.iron).toBeUndefined();expect(node.triOutput).toEqual([0,0,0]);
    reserve.guardedCampId='guarded';advance(engine,10000);expect(total(node.output)).toBe(0);
  });
  it('routes exactly one branch per output cable with ordinary transport rates',()=>{
    const {engine,node}=fixture(machine('extractor','tri'));node.resourceItem='iron';node.triOutput=[2,0,1];node.output={iron:3};
    engine.getState().research.completed=engine.getState().research.completed.filter(id=>!['trucks','trains'].includes(id));
    for(let port=0;port<3;port++){engine.getSector().nodes.push({...machine('woodenChest'),id:`cart-${port}`,x:1800,y:500+port*500});engine.getSector().connections.push(edge(node.id,`cart-${port}`,port));}
    engine.tick(400);expect(node.triOutput).toEqual([1,0,0]);expect(engine.getState().inFlightTransfers!.filter(t=>!t.cosmeticOnly).map(t=>t.sourcePort)).toEqual([0,2]);
    engine.deleteConnection(`${node.id}-cart-2-2-0`);expect(node.triOutput).toEqual([1,0,1]);expect(node.output.iron).toBe(2);
  });
  it('doubles all resolved products and waste, uses ordinary research and allows the Brick recovery loop',()=>{
    const {engine,node}=fixture(machine('refiner','doubler','brick'),true,true);advance(engine,4000*.35);expect(node.output.brick).toBe(2);
    const recycle=RECIPE_GROUPS.recycler.find(id=>RECIPES[id].inputs.brick)!;const r=machine('recycler','reclaimer',recycle);r.input={brick:2};const f=fixture(r,false,true);advance(f.engine,RECIPES[recycle].cycleMs*.25*2);expect(f.node.output.stone).toBe(2);expect(f.node.input.water).toBeUndefined();
    expect(engine.setRecipe(node.id,'simple-core')).toBe(false);
    const c=fixture(machine('advancedAssembler','doubler','precision-controller'),true,true);advance(c.engine,RECIPES['precision-controller'].cycleMs*.35);expect(c.node.output).toEqual({'precision-controller':2,'metallic-fines':2});
  });
  it.each(CORE_ITEMS)('duplicates %s in an unchangeable five seconds with an explicit reservation',core=>{
    const f=fixture(machine('refiner','unknown'),false,true);f.node.input={[core]:2};f.node.inputQueue=[core,core];f.node.output={[core]:4};
    advance(f.engine,6000);expect(f.node.input[core]).toBe(2);expect(f.node.activeCore).toBeUndefined();
    takeOutput(f.node,core);f.engine.tick(1);expect(f.node.activeCore).toBe(core);expect(f.node.input[core]).toBe(1);
    advance(f.engine,4998);expect(f.node.output[core]).toBe(3);f.engine.tick(1);expect(f.node.output[core]).toBe(5);
    expect(f.engine.setRecipe(f.node.id,'simple-core')).toBe(false);
  });
  it('preserves mixed arrival order and an active paid Core through save/load, pause and relocation',()=>{
    const {engine,node}=fixture(machine('refiner','unknown'));node.input={'simple-core':1,'final-core':1};node.inputQueue=['final-core','simple-core'];engine.tick(1000);expect(node.activeCore).toBe('final-core');
    const loaded=normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))!;expect(loaded).not.toBeNull();const resumed=new GameEngine(loaded,{autosave:false});const live=resumed.getSector().nodes.find(n=>n.id===node.id)!;
    live.processingPaused=true;advance(resumed,6000);expect(live.progressMs).toBe(1000);live.processingPaused=false;
    resumed.getState().research.completed.push('resourceRelocation');expect(resumed.tryMoveNodesTo({[live.id]:{x:1200,y:1000}})).toBe(true);advance(resumed,4000);expect(live.output['final-core']).toBe(2);expect(live.inputQueue).toEqual(['simple-core']);advance(resumed,5000);expect(live.output['simple-core']).toBe(2);
  });
  it('keeps all landmarks non-deletable and uncopyable, and gates moves on existing relocation research',()=>{
    for(const [kind,type]of [['refiner','rapid'],['extractor','tri'],['assembler','doubler'],['recycler','reclaimer'],['refiner','unknown']] as const){const {engine,node}=fixture(machine(kind,type));engine.getState().research.completed=engine.getState().research.completed.filter(id=>id!=='resourceRelocation');
      expect(isPlayerMovableNode(kind,engine.getState(),node)).toBe(false);expect(getNodeModule(kind,node).controls.deletable).toBe(false);engine.deleteNodes([node.id]);expect(engine.getSector().nodes).toContain(node);
      const before=engine.getSector().nodes.length;engine.duplicateNodes([node.id]);expect(engine.getSector().nodes).toHaveLength(before);expect(engine.saveFactoryTemplate('No copies',[node.id])).toBe(false);
      engine.getState().research.completed.push('resourceRelocation');expect(engine.tryMoveNodesTo({[node.id]:{x:1300,y:1000}})).toBe(true);
    }
  });
  it('reveals one combined Landmarks filter only after a visit and keeps Unknown Device unidentified beyond its name',()=>{
    const state=createInitialState(52),entry=state.landmarkLayout![1],sector=structuredClone(entry.sector);sector.unlocked=true;state.sectors[sector.id]=sector;
    expect(mapLandmarkSurvey(state).bySector.has(sector.id)).toBe(false);expect(mapNodeSurvey(state,sector.id).obstructions).toEqual([]);
    sector.visited=true;expect(mapLandmarkSurvey(state).bySector.get(sector.id)).toContain('landmarks');expect(mapNodeSurvey(state,sector.id).obstructions.map(o=>o.name)).toContain('Unknown Device');expect(getNodeDisplayDefinition(sector.nodes.find(n=>n.landmark)!).description).toBe('');
  });
});
