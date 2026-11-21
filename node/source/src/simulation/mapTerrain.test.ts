import { describe, expect, it, vi } from 'vitest';
import { CAP, CORNER_TERRAIN, TERRAINS, fixedTerrainSites, quadrantEntrySites, terrainCounts } from '../domain/mapTerrain';
import { worldCornerIds } from '../domain/worldGrid';
import { createInitialState, GameEngine } from './engine';
import { applyMapTerrain, generateMapTerrains, mapTerrain, revealedMapTerrain } from './mapTerrain';
import { sectorForState } from './worldGeneration';
import { normalizeLegacy, saveSlot, readSlots, copySaveToSlot, readAutosave, AUTOSAVE_KEY } from '../persistence/saves';
import { emptyMod } from '../mods/modTypes';
import { activateMod } from '../mods/modContent';
import { createTutorialState } from '../tutorials/tutorialState';
import { regenerateGuardedResources } from './guardedResources';

const advance = (engine: GameEngine, ms: number) => { for (let t=0;t<ms;t+=100) engine.tick(Math.min(100,ms-t)); };
describe('new-game terrain integration', () => {
  it.each([11,13,15,17,19,21])('saves exact quotas and fixed sites at world size %i', size => {
    const engine = new GameEngine(createInitialState(37), { autosave:false });
    const home = structuredClone(engine.getSector().nodes);
    engine.applyMod({ ...emptyMod(), rules:{ worldGridSize:size } });
    const state = engine.getState(), layout = state.mapTerrains!;
    expect(state.mapTerrainVersion).toBe(1);
    for (const terrain of TERRAINS) expect(Object.values(layout).filter(t=>t===terrain)).toHaveLength(terrainCounts(size)[terrain]);
    expect(layout['5,5']).toBe('grassland');
    for (const id of worldCornerIds(size)) expect(layout[id]).toBe('grassland');
    for (const site of quadrantEntrySites(37,size)) expect(layout[`${site.x},${site.y}`]).toBe(site.terrain);
    expect(engine.getSector().nodes).toEqual(home);
    expect(normalizeLegacy(JSON.parse(JSON.stringify(state)))!.mapTerrains).toEqual(layout);
    state.sectors['4,5']=engine.ensureSector(4,5);
    if (size!==11) expect(()=>engine.applyMod({...emptyMod(),rules:{worldGridSize:11}})).toThrow(/before opening/);
    activateMod();
  });
  it('follows the saved encounter identities when an allowed size change rebuilds assignments', () => {
    const engine=new GameEngine(createInitialState(37),{autosave:false});
    engine.getState().endgame!.cornerOrder=['grove','reclamation','foundry','alpha'];
    engine.applyMod({...emptyMod(),rules:{worldGridSize:21}});
    for (const [i,id] of ['4,4','6,4','6,6','4,6'].entries()) expect(engine.getState().mapTerrains![id]).toBe(CORNER_TERRAIN[engine.getState().endgame!.cornerOrder[i]]);
    activateMod();
  });
  it.each([1,37,2718])('applies the matrix once to actual generated reserves and retains encounter contents for seed %i', seed => {
    activateMod();
    const fresh=createInitialState(seed), legacy=structuredClone(fresh);
    delete legacy.mapTerrainVersion; delete legacy.mapTerrains;
    let guarded=0, forests=0, minerals=0;
    for(let y=0;y<11;y++)for(let x=0;x<11;x++) {
      const id=`${x},${y}`, terrain=fresh.mapTerrains![id];
      const baseline=sectorForState(legacy,x,y), sector=sectorForState(fresh,x,y);
      expect(sector.nodes).toEqual(applyMapTerrain(baseline.nodes,terrain));
      for(const node of sector.nodes) {
        if(node.guardedCampId)guarded++;
        if(node.kind==='forest')forests++;
        if(node.resourceItem==='iron')minerals++;
      }
      fresh.sectors[id]=sector;
      expect(sectorForState(fresh,x,y).nodes).toEqual(sector.nodes);
    }
    expect(guarded).toBeGreaterThan(0);expect(forests).toBeGreaterThan(0);expect(minerals).toBeGreaterThan(0);
    expect(fresh.sectors['5,5'].nodes.some(n=>n.resourceItem==='stone')).toBe(false);
    for(const id of worldCornerIds(11))expect(fresh.sectors[id].nodes.some(n=>n.resourceCapacity!==undefined)).toBe(false);
    const reloaded=new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(fresh)))!,{autosave:false});
    expect(reloaded.getState().mapTerrains).toEqual(fresh.mapTerrains);
    for(const id of Object.keys(fresh.sectors))expect(reloaded.getState().sectors[id].nodes.map(n=>[n.id,n.resourceCapacity,n.resourceRemaining])).toEqual(fresh.sectors[id].nodes.map(n=>[n.id,n.resourceCapacity,n.resourceRemaining]));
  });
  it.each([undefined,0] as const)('keeps legacy version %s unchanged through slots, copy, autosave, engine and future generation', version => {
    const data=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v)});
    try {
      const state=createInitialState(37); state.mapTerrainVersion=version;
      // Even a saved new obstruction/world-rules version must not imply terrain opt-in.
      const before=structuredClone(state.sectors['5,5'].nodes);
      saveSlot(0,state);copySaveToSlot(1,readSlots()[0]!);
      localStorage.setItem(AUTOSAVE_KEY,JSON.stringify(readSlots()[1]!.state));
      const engine=new GameEngine(readAutosave()!.state,{autosave:false}), loaded=engine.getState();
      expect(loaded.mapTerrainVersion).toBe(0);expect(loaded.mapTerrains).toBeUndefined();
      expect(loaded.sectors['5,5'].nodes.map(n=>[n.resourceCapacity,n.resourceRemaining])).toEqual(before.map(n=>[n.resourceCapacity,n.resourceRemaining]));
      const baseline=structuredClone(loaded);delete baseline.mapTerrainVersion;
      expect(sectorForState(loaded,4,4).nodes).toEqual(sectorForState(baseline,4,4).nodes);
      engine.applyMod({...emptyMod(),rules:{worldGridSize:21}});expect(loaded.mapTerrainVersion).toBe(0);expect(loaded.mapTerrains).toBeUndefined();
    } finally { vi.unstubAllGlobals();activateMod(); }
  });
  it('round-trips saved assignments without rerolling and rejects partial, unknown or unsupported layouts', () => {
    const state=createInitialState(37), saved=structuredClone(state.mapTerrains);
    expect(normalizeLegacy(state)!.mapTerrains).toEqual(saved);
    const partial=structuredClone(state);delete partial.mapTerrains!['0,0'];expect(normalizeLegacy(partial)).toBeNull();
    expect(normalizeLegacy({...state,mapTerrainVersion:2})).toBeNull();
    expect(normalizeLegacy({...state,mapTerrains:{...saved,'0,0':'ocean'}})).toBeNull();
    expect(normalizeLegacy({...state,mapTerrains:undefined})).toBeNull();
    const wrongCounts=structuredClone(state);wrongCounts.mapTerrains!['0,1']='grassland';
    if(state.mapTerrains!['0,1']!=='grassland')expect(normalizeLegacy(wrongCounts)).toBeNull();
    const wrongCorner=structuredClone(state), other=Object.keys(state.mapTerrains!).find(id=>state.mapTerrains![id]==='badlands')!;
    wrongCorner.mapTerrains!['0,0']='badlands';wrongCorner.mapTerrains![other]='grassland';expect(normalizeLegacy(wrongCorner)).toBeNull();
  });
  it('preserves a partially mined new-world reserve through real save channels and early-size undo',()=>{
    const data=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v)});
    try {
      const engine=new GameEngine(createInitialState(37),{autosave:false}),initial=structuredClone(engine.getState().mapTerrains);
      engine.applyMod({...emptyMod(),rules:{worldGridSize:21}});expect(Object.keys(engine.getState().mapTerrains!)).toHaveLength(441);
      engine.undo();expect(engine.getState().mapTerrains).toEqual(initial);
      const state=engine.getState(),id=Object.keys(state.mapTerrains!).find(id=>state.mapTerrains![id]==='rocky')!;
      const [x,y]=id.split(',').map(Number);state.sectors[id]=sectorForState(state,x,y);
      const reserve=state.sectors[id].nodes.find(n=>n.resourceItem==='iron')!;reserve.resourceRemaining!-=7;
      saveSlot(0,state);copySaveToSlot(1,readSlots()[0]!);localStorage.setItem(AUTOSAVE_KEY,JSON.stringify(readSlots()[1]!.state));
      const loaded=new GameEngine(readAutosave()!.state,{autosave:false}).getState();
      expect(loaded.mapTerrains).toEqual(initial);expect(loaded.mapTerrainVersion).toBe(1);
      expect(loaded.sectors[id].nodes.find(n=>n.id===reserve.id)).toMatchObject({resourceCapacity:reserve.resourceCapacity,resourceRemaining:reserve.resourceRemaining});
    }finally{vi.unstubAllGlobals();activateMod();}
  });
  it('reveals terrain only after visiting, even when a map is purchased or developer surveys are revealed', () => {
    const state=createInitialState(37);state.devMapSurveysRevealed=true;
    const sector=sectorForState(state,4,5);state.sectors[sector.id]=sector;sector.unlocked=true;
    expect(mapTerrain(state,sector.id)).toBeDefined();expect(revealedMapTerrain(state,sector.id)).toBeUndefined();
    sector.visited=true;expect(revealedMapTerrain(state,sector.id)).toBe(state.mapTerrains![sector.id]);
    expect(revealedMapTerrain(state,'5,5')).toBe('grassland');
  });
  it.each(TERRAINS.filter(t=>t!=='badlands'))('%s natural refill composes with research while paid growth keeps its amount and cap', terrain => {
    activateMod();
    const state=createInitialState(37), id=Object.keys(state.mapTerrains!).find(id=>state.mapTerrains![id]===terrain && id!=='5,5' && sectorForState(state,...id.split(',').map(Number) as [number,number]).nodes.some(n=>n.kind==='forest'))!;
    const [x,y]=id.split(',').map(Number), sector=sectorForState(state,x,y);state.sectors[id]=sector;sector.unlocked=true;state.activeSectorId=id;
    const forest=sector.nodes.find(n=>n.kind==='forest')!;forest.resourceRemaining=0;sector.nodes=[forest];
    state.research.completed=['exploration','treePlanter','resourceRegeneration'];state.research.repeatableCompletions={resourceRegeneration:1};
    const engine=new GameEngine(state,{autosave:false}), live=engine.getSector().nodes[0];
    const period=terrain==='desert'?150000:15000;
    advance(engine,period-100);expect(live.resourceRemaining).toBe(0);advance(engine,100);expect(live.resourceRemaining).toBe(1);
    live.input['forest-growth']=7;advance(engine,100);expect(live.resourceRemaining).toBe(8);
    live.resourceRemaining=live.resourceCapacity!-1;live.input['forest-growth']=7;advance(engine,100);expect(live.resourceRemaining).toBe(live.resourceCapacity);expect(live.input['forest-growth']).toBe(6);
  });
  it('keeps tutorial ground and rates legacy',()=>expect(createTutorialState('basic').mapTerrainVersion).toBe(0));
  it.each([11,13,15,17,19,21])('materializes every map alongside the existing encounter/border generator on a %i grid',size=>{
    const engine=new GameEngine(createInitialState(37),{autosave:false});
    engine.applyMod({...emptyMod(),rules:{worldGridSize:size}});
    const state=engine.getState(), legacy=structuredClone(state);delete legacy.mapTerrainVersion;delete legacy.mapTerrains;
    for(const [id,terrain] of Object.entries(state.mapTerrains!)) {
      const [x,y]=id.split(',').map(Number), old=sectorForState(legacy,x,y), next=sectorForState(state,x,y);
      expect(next.nodes.filter(n=>!n.resourceCapacity).map(n=>[n.id,n.kind,n.x,n.y])).toEqual(old.nodes.filter(n=>!n.resourceCapacity).map(n=>[n.id,n.kind,n.x,n.y]));
      for(const node of next.nodes.filter(n=>n.resourceCapacity!==undefined)) {
        const baseline=old.nodes.find(n=>n.id===node.id)!;
        const factor=CAP[terrain][node.kind==='forest'?'forest':'mineral'];
        expect(node.resourceCapacity).toBe(Math.round(baseline.resourceCapacity!*factor));
        expect([node.x,node.y]).toEqual([baseline.x,baseline.y]);
      }
      if(terrain==='badlands')expect(next.nodes.some(n=>n.kind==='forest')).toBe(false);
    }
    activateMod();
  });
  it.each(TERRAINS)('%s guarded minerals retain refill rates, suppression credit and adjusted hard caps',terrain=>{
    const state=createInitialState(37), legacy=structuredClone(state);delete legacy.mapTerrainVersion;
    let base:ReturnType<typeof sectorForState>|undefined;
    for(let y=0;y<11&&!base;y++)for(let x=0;x<11&&!base;x++){const sector=sectorForState(legacy,x,y);if(sector.nodes.some(n=>n.guardedCampId))base=sector;}
    const old=structuredClone(base!), next=structuredClone(base!);next.nodes=applyMapTerrain(next.nodes,terrain);
    const reset=(sector:typeof next)=>{const reserve=sector.nodes.find(n=>n.guardedCampId)!;reserve.resourceRemaining=0;const camp=sector.nodes.find(n=>n.id===reserve.guardedCampId)!;camp.suppressed=true;camp.campStrength=10;return reserve;};
    const a=reset(old),b=reset(next);
    regenerateGuardedResources(state,old,20000);regenerateGuardedResources(state,next,20000);
    expect(b.resourceRemaining).toBeGreaterThan(0);expect(b.resourceRemaining).toBe(a.resourceRemaining);expect(b.guardedRegenCarry).toBe(a.guardedRegenCarry);
    const camp=next.nodes.find(n=>n.id===b.guardedCampId)!;camp.suppressed=false;
    const paused=[b.resourceRemaining,b.regenMs,b.guardedRegenCarry];regenerateGuardedResources(state,next,20000);
    expect([b.resourceRemaining,b.regenMs,b.guardedRegenCarry]).toEqual(paused);
    camp.suppressed=true;b.resourceRemaining=b.resourceCapacity!-1;regenerateGuardedResources(state,next,20000);expect(b.resourceRemaining).toBe(b.resourceCapacity);
  });
  it('does not multiply a Drill-created reserve on a Rocky map or on snapshot reload',()=>{
    const state=createInitialState(37),id=Object.keys(state.mapTerrains!).find(id=>state.mapTerrains![id]==='rocky')!;
    const [x,y]=id.split(',').map(Number),sector=sectorForState(state,x,y);state.sectors[id]=sector;state.activeSectorId=id;sector.unlocked=true;
    const template=state.sectors['5,5'].nodes.find(n=>n.kind==='extractor')!;
    sector.nodes=[{...structuredClone(template),id:'test-drill',kind:'miningDrill',miningProgress:19,miningTarget:'iron',input:{motor:1}}];
    const engine=new GameEngine(state,{autosave:false});advance(engine,1000);
    expect(engine.getSector().nodes[0]).toMatchObject({kind:'iron',resourceCapacity:1000,resourceRemaining:1000});
    const loaded=new GameEngine(normalizeLegacy(engine.getState())!,{autosave:false});expect(loaded.getSector().nodes[0].resourceCapacity).toBe(1000);
  });
  it('keeps legacy Forest refill at its normal period on a coordinate assigned Desert in a new game',()=>{
    const state=createInitialState(37),id=Object.keys(state.mapTerrains!).find(id=>state.mapTerrains![id]==='desert')!;
    delete state.mapTerrainVersion;delete state.mapTerrains;
    const [x,y]=id.split(',').map(Number),sector=sectorForState(state,x,y);state.sectors[id]=sector;state.activeSectorId=id;sector.unlocked=true;
    const forest=sector.nodes.find(n=>n.kind==='forest')!;forest.resourceRemaining=0;sector.nodes=[forest];
    const engine=new GameEngine(state,{autosave:false});advance(engine,30000);expect(engine.getSector().nodes[0].resourceRemaining).toBe(1);
  });
  it('preserves mod resource baselines, lakes and infinite reserves', () => {
    const state=createInitialState(37), nodes=state.sectors['5,5'].nodes;
    const iron=nodes.find(n=>n.resourceItem==='iron')!;
    const custom={...iron,resourceCapacity:1234,resourceRemaining:1234,guardedCampId:'camp'};
    for(const terrain of TERRAINS)expect(applyMapTerrain([custom],terrain)[0].resourceCapacity).toBe(Math.round(1234*CAP[terrain].mineral));
    expect(applyMapTerrain([{...iron,infiniteResource:true},{...iron,kind:'lake'}],'rocky')).toEqual([{...iron,infiniteResource:true},{...iron,kind:'lake'}]);
    // The transform runs on starting reserves only; Drill completion never calls it.
    expect(fixedTerrainSites(37)).toHaveLength(9);expect(generateMapTerrains(37)).toEqual(state.mapTerrains);
    activateMod({...emptyMod(),nodes:{'mod-scrub':{template:'forest',name:'Scrub',resourceItem:'wood',resourceCapacity:1234}}});
    try {
      const scrub={...custom,kind:'mod-scrub' as const,resourceItem:'wood' as const};
      expect(applyMapTerrain([scrub],'badlands')).toHaveLength(0);
      expect(applyMapTerrain([scrub],'desert')[0].resourceCapacity).toBe(123);
    } finally { activateMod(); }
  });
});
