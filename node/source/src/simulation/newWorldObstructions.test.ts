import { describe, expect, it, vi } from 'vitest';
import type { MachineNode, NodeKind, SectorState } from '../domain/types';
import { normalizeLegacy, saveSlot, readSlots, copySaveToSlot, readAutosave, AUTOSAVE_KEY } from '../persistence/saves';
import { createInitialState, GameEngine } from './engine';
import { generateSector, sectorForState, sectorDistance } from './worldGeneration';
import { canPlaceNode } from './collisions';
import { canPurchaseMap, destinationMapCosts } from './mapExpansion';
import { mapNodeHoverDetails } from '../ui/mapNodePresentation';
import { connectionBlockedByWorld } from './connectionRules';
import { tributeAmount } from './goblinTribute';
import { progressionDeficits } from './progressionRecovery';
import { emptyMod } from '../mods/modTypes';
import { shortestRescuePath } from './expansionRescue';
import { reconcileHole } from '../content/endgame';
import { getPortAnchor } from '../domain/nodeGeometry';
import { footprintsOverlap, overlapsMaximumCampRadius } from '../domain/obstructionGeometry';
import { obstructedConnections } from './obstructedConnections';

const makeNode = (kind: NodeKind, id: string, x=600,y=500, extra: Partial<MachineNode> = {}): MachineNode => ({
  kind,id,name:id,x,y,rotation:0,input:{},output:{},progressMs:0,cycleMs:5000,constructedAt:0,constructionMs:0,...extra,
});
const blank = (x:number,y:number): SectorState => ({id:`${x},${y}`,x,y,name:'Map',label:'',nodes:[],connections:[],camera:{x:0,y:0,zoom:1},unlocked:true,lastSimulatedAt:0});
const advance = (engine:GameEngine,ms:number) => {for(let i=0;i<ms;i+=100)engine.tick(Math.min(100,ms-i));};
function fixture(nodes:MachineNode[], rules:1|2=2) {
  const state=createInitialState(37);state.worldRulesVersion=rules;state.progressionVersion=2;state.sectors['5,5'].nodes=nodes;
  return state;
}
function guarded(dwarven=true, subtype:'camp'|'village'|'kingdom'='camp') {
  const camp=makeNode('monster-camp','camp',2800,1700,{campStrength:10,suppressed:true,obstructionMaxRadius:100,
    ...(dwarven?{lizardSettlement:subtype,settlementMapTier:subtype==='camp'?4:subtype==='village'?6:8}:{goblinSettlement:subtype})});
  const deposit=makeNode(dwarven?'mythril':'iron','guarded',600,500,{resourceItem:dwarven?'mythril':'iron',resourceCapacity:3000,resourceRemaining:0,guardedCampId:'camp',guardedLocked:false});
  return {camp,deposit};
}

describe('new-world rules and saved legacy worlds',()=>{
  it.each([1,2] as const)('preserves rules through real slot, copy and autosave serialization (%i)',rules=>{
    const data=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>data.set(key,value)});
    try{
      const state=fixture([],rules);if(rules===1)delete state.worldRulesVersion;
      saveSlot(0,state);const saved=readSlots()[0]!;expect(saved.state.worldRulesVersion).toBe(rules);
      copySaveToSlot(1,saved);expect(readSlots()[1]!.state.worldRulesVersion).toBe(rules);
      localStorage.setItem(AUTOSAVE_KEY,JSON.stringify(saved.state));expect(readAutosave()!.state.worldRulesVersion).toBe(rules);
      const engine=new GameEngine(saved.state);saveSlot(2,engine.getState());expect(readSlots()[2]!.state.worldRulesVersion).toBe(rules);
    }finally{vi.unstubAllGlobals();}
  });
  it('opts in only at creation and preserves explicit and missing versions through import and engine load',()=>{
    const fresh=createInitialState(37);expect(fresh.worldRulesVersion).toBe(2);
    const old=structuredClone(fresh);delete old.worldRulesVersion;
    for(const rules of [undefined,1,2] as const){const saved=structuredClone(fresh);saved.worldRulesVersion=rules;
      const loaded=normalizeLegacy(JSON.parse(JSON.stringify(saved)))!;
      expect(new GameEngine(loaded).getState().worldRulesVersion).toBe(rules??1);
    }
    expect(normalizeLegacy({...fresh,worldRulesVersion:99})).toBeNull();
    const loaded=normalizeLegacy(old)!;
    expect(sectorForState(loaded,7,5).nodes.find(n=>n.kind==='lake')?.lakeIntakeOnly).toBeUndefined();
    expect(sectorForState(fresh,7,5).nodes.find(n=>n.kind==='lake')?.lakeIntakeOnly).toBe(true);
  });
  it.each([37,1,98765])('generates exactly 28 compatible hole maps and fixed guarded mineral rewards for seed %i',seed=>{
    let holeMaps=0,goblins=0,dwarves=0,fullPools=0;
    for(let y=0;y<11;y++)for(let x=0;x<11;x++){
      const sector=generateSector(x,y,seed,0,[],5,2,11,1,2),holes=sector.nodes.filter(n=>n.kind==='big-hole');
      for(const reserve of sector.nodes.filter(n=>n.kind==='stoneDeposit'))expect(reserve.name).toBe('Stone');
      if(holes.length){holeMaps++;expect(holes.length).toBeLessThanOrEqual(5);expect(holes.every(n=>n.holeOrigin==='generated')).toBe(true);
        expect(sector.nodes.some(n=>['lake','monster-camp','resourceGolem','cornerChallenge'].includes(n.kind))).toBe(false);
        const budget=Math.round(1650*(1+7*(sectorDistance(x,y)-1)/8));
        expect(holes.reduce((s,n)=>s+n.resourceRemaining!,0)).toBeLessThanOrEqual(budget);
        if(holes.length===5){fullPools++;expect(holes.reduce((s,n)=>s+n.resourceRemaining!,0)).toBe(budget);}
      }
      const camp=sector.nodes.find(n=>n.kind==='monster-camp');
      if(camp){const deposit=sector.nodes.find(n=>n.guardedCampId===camp.id)!;expect(deposit).toBeDefined();expect(deposit.guardedLocked).toBe(true);
        expect(deposit.y).toBe(camp.y);expect(camp.guardedDepositId).toBe(deposit.id);
        expect(footprintsOverlap(deposit,{...camp,campStrength:10})).toBe(false);
        expect(footprintsOverlap(deposit,{...camp,campStrength:20})).toBe(true);
        for(const other of sector.nodes.filter(n=>n.resourceItem&&n.id!==deposit.id))expect(overlapsMaximumCampRadius(other,camp,12)).toBe(false);
        expect(deposit.resourceRemaining).toBe(1000+500*sectorDistance(x,y));
        expect(sector.nodes.some(n=>n.kind==='goblinTribute')).toBe(false);
        if(camp.lizardSettlement){dwarves++;expect(deposit.resourceItem).toBe('mythril');expect(sector.nodes.filter(n=>n.resourceItem&&n.kind!=='lake')).toHaveLength(5);}
        else {goblins++;expect(['iron','copper','stone']).toContain(deposit.resourceItem);expect(sector.nodes.filter(n=>n.resourceItem===deposit.resourceItem)).toHaveLength(1);}
        const again=generateSector(x,y,seed,0,[],5,2,11,1,2);
        expect(again.nodes.find(n=>n.guardedCampId)?.resourceItem).toBe(deposit.resourceItem);
      }
      const output=sector.nodes.find(n=>n.kind==='cornerTribute');if(output)expect(output.name).toMatch(/^[αβγδ] Piece$/);
    }
    expect(holeMaps).toBe(28);expect(goblins).toBe(15);expect(dwarves).toBe(15);expect(fullPools).toBeGreaterThan(0);
  });
  it.each([1,2] as const)('retains world rules when mods are activated, removed and undone (%i)',rules=>{
    const engine=new GameEngine(fixture([],rules));engine.applyMod(emptyMod());expect(engine.getState().worldRulesVersion).toBe(rules);
    engine.applyMod(undefined);expect(engine.getState().worldRulesVersion).toBe(rules);engine.undo();expect(engine.getState().worldRulesVersion).toBe(rules);
  });
});

describe('guarded deposits',()=>{
  it.each([false,true])('keeps an interior deposit usable through suppression, growth and paired relocation (Dwarven=%s)',dwarven=>{
    const generated=Array.from({length:121},(_,i)=>generateSector(i%11,Math.floor(i/11),37,0,[],5,2,11,1,2))
      .find(s=>s.nodes.some(n=>n.kind==='monster-camp'&&Boolean(n.lizardSettlement)===dwarven))!;
    const originalCamp=generated.nodes.find(n=>n.kind==='monster-camp')!,originalDeposit=generated.nodes.find(n=>n.guardedCampId===originalCamp.id)!;
    const startingPosition={x:originalDeposit.x,y:originalDeposit.y};
    const startingOffset=originalDeposit.x-originalCamp.x;
    const extractor=makeNode('extractor','interior-worker',originalCamp.x+800,originalCamp.y);
    const engine=new GameEngine(fixture([...generated.nodes,extractor]));
    const camp=engine.getSector().nodes.find(n=>n.id===originalCamp.id)!,deposit=engine.getSector().nodes.find(n=>n.id===originalDeposit.id)!;
    expect(canPlaceNode(deposit,engine.getSector().nodes,{width:3600,height:2400})).toBe(true);
    expect(canPlaceNode(makeNode('extractor','intruder',camp.x,camp.y),engine.getSector().nodes,{width:3600,height:2400})).toBe(false);
    expect(engine.connect(deposit.id,extractor.id)).toBe(false);
    camp.suppressed=true;camp.campStrength=10;engine.tick(100);
    expect(getPortAnchor(camp,'input',0)).toEqual({x:0,y:0});
    expect(engine.connect(deposit.id,extractor.id)).toBe(true);
    advance(engine,5000);expect(engine.getSector().nodes.find(n=>n.id===extractor.id)!.output[deposit.resourceItem!]).toBe(1);
    const cable=engine.getSector().connections[0];expect(obstructedConnections(engine.getSector()).has(cable.id)).toBe(false);
    camp.campStrength=100;
    expect(obstructedConnections(engine.getSector()).has(cable.id)).toBe(false);
    deposit.guardedLocked=true;expect(obstructedConnections(engine.getSector()).has(cable.id)).toBe(true);
    deposit.guardedLocked=false;expect(obstructedConnections(engine.getSector()).has(cable.id)).toBe(false);
    camp.campStrength=25;camp.suppressed=false;
    const stock=deposit.resourceRemaining;advance(engine,5000);
    expect(deposit.resourceRemaining).toBe(stock);expect(engine.getSector().connections).toHaveLength(1);
    camp.campStrength=10;camp.suppressed=true;engine.tick(100);
    const unrelated=makeNode('monster-camp','other-camp',camp.x+600,camp.y,{campStrength:100,obstructionMaxRadius:100});
    expect(connectionBlockedByWorld(deposit,extractor,{fromPort:0,toPort:0},[...engine.getSector().nodes,unrelated])).toBe(true);
    engine.getState().research.completed.push('campRelocation');
    expect(engine.tryMoveNodesTo({[camp.id]:{x:camp.x+32,y:camp.y+32}})).toBe(true);
    expect(deposit.x-camp.x).toBeCloseTo(startingOffset);expect(deposit.y).toBe(camp.y);
    const reloaded=new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))!);
    expect(reloaded.getSector().nodes.find(n=>n.id===deposit.id)).toMatchObject({x:deposit.x,y:deposit.y,guardedCampId:camp.id});
    engine.undo();expect(engine.getSector().nodes.find(n=>n.id===deposit.id)).toMatchObject(startingPosition);
  });
  it.each([false,true])('preserves stock, progress and wiring through suppression loss (Dwarven=%s)',dwarven=>{
    const {camp,deposit}=guarded(dwarven);camp.suppressed=false;camp.campStrength=25;deposit.resourceRemaining=50;
    const extractor=makeNode('extractor','extractor',1100,500);
    const engine=new GameEngine(fixture([camp,deposit,extractor]));
    expect(engine.connect('guarded','extractor')).toBe(false);
    const activeCamp=engine.getSector().nodes[0];activeCamp.suppressed=true;activeCamp.campStrength=10;engine.tick(100);
    expect(engine.connect('guarded','extractor')).toBe(true);advance(engine,5000);
    expect(engine.getSector().nodes.find(n=>n.id==='extractor')!.output[dwarven?'mythril':'iron']).toBe(1);
    if(dwarven)expect(engine.getState().dwarvenMythrilProduced).toBe(true);
    const resource=engine.getSector().nodes.find(n=>n.id==='guarded')!,worker=engine.getSector().nodes.find(n=>n.id==='extractor')!;
    const reserve=resource.resourceRemaining,progress=worker.progressMs,carry=resource.regenMs;
    activeCamp.suppressed=false;activeCamp.campStrength=20;advance(engine,10000);
    expect(resource.resourceRemaining).toBe(reserve);expect(worker.progressMs).toBe(progress);expect(resource.regenMs).toBe(carry);expect(engine.getSector().connections).toHaveLength(1);
    activeCamp.suppressed=true;activeCamp.campStrength=10;advance(engine,5000);expect(worker.output[dwarven?'mythril':'iron']).toBe(2);
  });
  it.each([false,true])('refills empty reserves without research, respects upgrades and never collapses (Dwarven=%s)',dwarven=>{
    for(const subtype of ['camp','village','kingdom'] as const)for(const factor of [1,2,2.4,4.8]){
      const {camp,deposit}=guarded(dwarven,subtype),state=fixture([camp,deposit]);
      if(factor>=2)state.research.completed.push('mineralRegeneration2');
      if(factor>=2.4)state.research.repeatableCompletions!.mineralRegenerationRate=1;
      if(factor===4.8)state.research.repeatableCompletions!.resourceRegeneration=1;
      const amount=tributeAmount(camp),engine=new GameEngine(state);advance(engine,25000);
      const reserve=engine.getSector().nodes.find(n=>n.id==='guarded')!;
      expect(reserve.kind).toBe(deposit.kind);expect(reserve.resourceRemaining).toBeCloseTo(amount*factor*5,6);
      expect(engine.getState().dwarvenMythrilProduced).toBeUndefined();
      reserve.resourceRemaining=2999;advance(engine,5000);expect(reserve.resourceRemaining).toBe(3000);expect(reserve.guardedRegenCarry).toBe(0);
    }
  });
  it('moves the camp and deposit together, rejects separate offsets and preserves them through undo',()=>{
    const {camp,deposit}=guarded(),state=fixture([camp,deposit]);state.research.completed.push('campRelocation');
    const engine=new GameEngine(state);
    expect(engine.tryMoveNodesTo({camp:{x:2900,y:1800}})).toBe(true);
    expect(engine.getSector().nodes.find(n=>n.id==='guarded')).toMatchObject({x:700,y:600});
    expect(engine.tryMoveNodesTo({camp:{x:3000,y:1900},guarded:{x:900,y:900}})).toBe(false);
    engine.undo();expect(engine.getState().worldRulesVersion).toBe(2);expect(engine.getSector().nodes.find(n=>n.id==='guarded')).toMatchObject({x:600,y:500});
  });
  it('does not count locked stock as available recovery supply',()=>{
    const {camp,deposit}=guarded(false);camp.suppressed=false;deposit.resourceRemaining=3000;
    const locked=new GameEngine(fixture([camp,deposit])).getState();
    const without=structuredClone(locked);without.sectors['5,5'].nodes=[];
    expect(progressionDeficits(locked,'exploration')).toEqual(progressionDeficits(without,'exploration'));
  });
});

describe('filled holes and exploration',()=>{
  it('completes paused terrain and refunds surplus when a landfill upgrade pays the remaining bill',()=>{
    const hole=makeNode('big-hole','hole',1400,500,{processingPaused:true,resourceRemaining:40,holeBaseStone:250,holeStoneConsumed:210,input:{stone:5},obstructionRadius:100,holeOrigin:'generated'});
    const engine=new GameEngine(fixture([hole]));engine.getState().research.repeatableCompletions!.efficientLandfill=1;
    reconcileHole(engine.getSector().nodes[0],engine.getState());engine.tick(100);
    expect(engine.getSector().nodes).toHaveLength(0);expect(engine.getSector().filledHoles).toHaveLength(1);expect(engine.getState().globalPool?.stone).toBe(5);
  });
  it('refunds buffered and in-flight surplus exactly once when a supplier is missing',()=>{
    const hole=makeNode('big-hole','hole',1400,500,{resourceRemaining:0,input:{stone:3},obstructionRadius:100});
    const state=fixture([hole]);state.sectors['5,5'].connections=[{id:'c',from:'gone',to:'hole',createdAt:0}];
    state.inFlightTransfers=[{id:'t',sectorId:'5,5',connectionId:'c',from:'gone',to:'hole',item:'stone',amount:2,launchedAtMs:0,arrivesAtMs:10000}];
    const engine=new GameEngine(state);expect(engine.getState().globalPool?.stone).toBe(5);expect(engine.getSector().filledHoles).toHaveLength(1);
    engine.replaceState(normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))!);engine.tick(100);expect(engine.getState().globalPool?.stone).toBe(5);expect(engine.getSector().filledHoles).toHaveLength(1);
  });
  it.each([1,2] as const)('allows exploration and recovery routes beside unfinished generated holes for rules %i',rules=>{
    const state=fixture([],rules);for(const[x,y]of[[6,5],[7,4]])state.sectors[`${x},${y}`]={...blank(x,y),visited:true,nodes:[makeNode('big-hole',`${x},${y}`,800,500,{holeOrigin:'generated',resourceRemaining:1})]};
    expect(canPurchaseMap(state,7,5)).toBe(true);expect(shortestRescuePath(state,'7,5')).toEqual(['7,5']);
    expect(canPurchaseMap(state,10,9)).toBe(false);expect(canPurchaseMap(state,11,5)).toBe(false);
    expect(state.sectors['6,5'].nodes[0].resourceRemaining).toBe(1);
  });
  it('funds an unfunded destination beside an unfinished generated hole',()=>{
    const state=fixture([makeNode('researchCenter','lab',600,500,{input:{'simple-core':5}})]);
    state.research.completed.push('exploration');state.research.selected='mapNode';state.research.mapNodeQuote={destination:'7,5',completion:0,costs:{'simple-core':5}};
    state.sectors['6,5']={...blank(6,5),visited:true,nodes:[makeNode('big-hole','hole',1400,500,{holeOrigin:'generated',resourceRemaining:300})]};
    state.mod=emptyMod();delete state.mapResearchMode;
    const engine=new GameEngine(state);advance(engine,10000);
    expect(engine.getSector().nodes[0].input['simple-core']).toBeLessThan(5);expect(engine.getState().research.contributed['simple-core']).toBeGreaterThan(0);
    const resumed=new GameEngine(normalizeLegacy(engine.getState())!);advance(resumed,30000);
    expect(resumed.getSector().nodes[0].input['simple-core']).toBe(0);expect(resumed.getState().sectors['7,5'].unlocked).toBe(true);expect(resumed.getState().sectors['6,5'].nodes[0].resourceRemaining).toBe(300);
  });
  it.each([1,2] as const)('conserves the selected refund behavior and persists completed terrain for rules %i',rules=>{
    const source=makeNode('woodenChest','source',400,500),hole=makeNode('big-hole','hole',1400,500,{holeOrigin:'generated',resourceRemaining:1,holeBaseStone:1,holeStoneConsumed:0,input:{stone:4},obstructionRadius:200});
    const state=fixture([source,hole],rules);state.sectors['5,5'].connections=[{id:'c',from:'source',to:'hole',createdAt:0}];
    state.inFlightTransfers=[{id:'t',sectorId:'5,5',connectionId:'c',from:'source',to:'hole',item:'stone',amount:2,launchedAtMs:0,arrivesAtMs:10000}];
    const engine=new GameEngine(state);engine.tick(100);
    expect(engine.getSector().nodes.find(n=>n.id==='source')!.output.stone).toBe(rules===2?5:2);
    expect(engine.getSector().connections).toHaveLength(0);expect(engine.getState().inFlightTransfers).toHaveLength(0);
    expect(engine.getSector().filledHoles?.length??0).toBe(rules===2?1:0);
    expect(canPlaceNode(makeNode('extractor','new',1400,500),engine.getSector().nodes,{width:3600,height:2400})).toBe(true);
    expect(connectionBlockedByWorld(source,makeNode('woodenChest','right',1800,500),{fromPort:0,toPort:0},engine.getSector().nodes)).toBe(false);
    const restored=new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(engine.getState())))!);
    expect(restored.getSector().filledHoles).toEqual(engine.getSector().filledHoles);
    expect(restored.getSector().nodes[0].output.stone).toBe(rules===2?5:2);
  });
  it('opens maps beside discovered holes while retaining paid-project point protection',()=>{
    const state=fixture([]);state.mod=emptyMod();delete state.mapResearchMode;state.research.completed.push('exploration');state.research.mapPoints=1;
    state.sectors['6,5']={...blank(6,5),visited:true,nodes:[makeNode('big-hole','generated',600,500,{holeOrigin:'generated',resourceRemaining:300})]};
    state.sectors['7,4']={...blank(7,4),visited:true};
    expect(canPurchaseMap(state,7,5)).toBe(true);expect(destinationMapCosts(state,7,5)).toBeDefined();
    expect(mapNodeHoverDetails(state,'7,5')).toEqual(['Map Node Unexplored']);
    const engine=new GameEngine(state);expect(engine.unlockSector(7,5)).toBe(true);expect(engine.getState().research.mapPoints).toBe(0);
    expect(engine.getState().sectors['6,5'].nodes[0].resourceRemaining).toBe(300);
    const loaded=new GameEngine(normalizeLegacy(engine.getState())!);expect(loaded.getState().sectors['7,5'].unlocked).toBe(true);
    state.research.mapNodeQuote={destination:'7,5',completion:0,costs:{'simple-core':5}};
    expect(canPurchaseMap(state,7,5)).toBe(true);
    state.research.projectContributions={mapNode:{'simple-core':1}};expect(canPurchaseMap(state,7,5)).toBe(true);
    const reservedPoint=new GameEngine(state);expect(reservedPoint.unlockSector(7,5)).toBe(false);expect(reservedPoint.getState().research.mapPoints).toBe(1);
    state.research.selected='mapNode';state.research.contributed={'simple-core':1};state.research.mapPoints=0;
    state.sectors['5,5'].nodes=[makeNode('researchCenter','research',600,500,{input:{'simple-core':4},cycleMs:1000})];
    const funded=new GameEngine(state);advance(funded,20000);
    expect(funded.getState().sectors['7,5'].unlocked).toBe(true);funded.switchSector('7,5');expect(funded.getState().activeSectorId).toBe('7,5');
    state.research.projectContributions={};state.research.contributed={};delete state.research.mapNodeQuote;
    state.sectors['6,5'].nodes[0].holeOrigin='depletion';expect(canPurchaseMap(state,7,5)).toBe(true);
    state.sectors['6,5'].nodes[0].holeOrigin='generated';state.sectors['6,5'].visited=false;
    expect(canPurchaseMap(state,7,5)).toBe(true);
    state.sectors['6,5'].visited=true;state.worldRulesVersion=1;expect(canPurchaseMap(state,7,5)).toBe(true);
  });
});

describe('Lake intake access and coupled relocation',()=>{
  it.each([1,2] as const)('uses versioned direct Water and Intake capacity for rules %i',rules=>{
    const lake=makeNode('lake','lake',1700,1100,{resourceItem:'water',obstructionWidth:300,obstructionHeight:200,cycleMs:1000});
    const intakes=Array.from({length:4},(_,i)=>makeNode('fluidLink',`intake${i}`,2300,400+i*350));
    const tank=makeNode('fluidStorage','tank',1000,1100),engine=new GameEngine(fixture([lake,...intakes,tank],rules));
    expect(engine.connect('lake','tank')).toBe(rules===1);
    if(rules===1)engine.deleteConnection(engine.getSector().connections[0].id);
    for(let i=0;i<2;i++)expect(engine.connectPorts('lake',i,`intake${i}`,0)).toBe(true);
    expect(engine.connectPorts('lake',2,'intake2',0)).toBe(false);
    engine.getState().research.completed.push('fluidLink5');expect(engine.connectPorts('lake',2,'intake2',0)).toBe(rules===2);
    engine.getState().research.completed.push('fluidLink6');expect(engine.connectPorts('lake',3,'intake3',0)).toBe(rules===2);
    advance(engine,1000);expect(engine.getSector().nodes[0].output.water??0).toBe(rules===2?0:1);
    expect(engine.getSector().nodes[1].output.water).toBe(8);
    engine.getState().research.completed.push('lakeRelocation');
    expect(engine.tryMoveNodesTo({lake:{x:1800,y:1200}})).toBe(true);
    expect(engine.getSector().nodes[1]).toMatchObject(rules===2?{x:2400,y:500}:{x:2300,y:400});
    const before=engine.getSector().nodes.map(n=>({id:n.id,x:n.x,y:n.y}));
    expect(engine.tryMoveNodesTo({lake:{x:3500,y:1200}})).toBe(false);expect(engine.getSector().nodes.map(n=>({id:n.id,x:n.x,y:n.y}))).toEqual(before);
  });
});
