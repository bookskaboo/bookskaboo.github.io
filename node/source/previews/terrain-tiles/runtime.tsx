import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PixiPlayfield } from '../../src/renderer/PixiPlayfield';
import { NodeMinimap } from '../../src/ui/NodeMinimap';
import { GameEngine, createInitialState } from '../../src/simulation/engine';
import { sectorForState, getWorldFieldSize } from '../../src/simulation/worldGeneration';
import { mapTerrain } from '../../src/simulation/mapTerrain';
import { normalizeLegacy } from '../../src/persistence/saves';
import { NAMES, TERRAINS, type Terrain } from '../../src/domain/mapTerrain';
import '../../src/styles.css';
import './runtime.css';

function fixture(terrain: Terrain, legacy: boolean) {
  const state=createInitialState(37);
  const id=Object.keys(state.mapTerrains!).find(id=>state.mapTerrains![id]===terrain && id!=='5,5' && (()=>{
    const [x,y]=id.split(',').map(Number), sector=sectorForState(state,x,y);
    return sector.nodes.some(n=>n.resourceItem==='iron') && !sector.nodes.some(n=>['monster-camp','big-hole','resourceGolem','lake'].includes(n.kind));
  })())!;
  if(legacy) {delete state.mapTerrainVersion;delete state.mapTerrains;}
  const [x,y]=id.split(',').map(Number),sector=sectorForState(state,x,y);
  state.sectors[id]=sector;sector.unlocked=true;sector.visited=true;state.activeSectorId=id;state.paused=true;
  sector.camera={x:40,y:180,zoom:.27};
  const engine=new GameEngine(state,{autosave:false});
  // Review-only Production context; generated reserves and their placement remain intact.
  const extractor=state.sectors['5,5'].nodes.find(n=>n.kind==='extractor')!;
  for(const [i,reserve] of engine.getSector().nodes.filter(n=>n.resourceCapacity!==undefined).entries()) {
    const copy={...structuredClone(extractor),id:`review-extractor-${i}`,x:Math.min(3400,reserve.x+420),y:reserve.y};
    engine.getSector().nodes.push(copy);engine.connect(reserve.id,copy.id);
  }
  return engine;
}
function Review() {
  const [terrain,setTerrain]=useState<Terrain>('badlands'), [legacy,setLegacy]=useState(false);
  const [engine,setEngine]=useState(()=>fixture('badlands',false)),[revision,setRevision]=useState(0),[map,setMap]=useState(false);
  useEffect(()=>engine.subscribe(()=>setRevision(n=>n+1)),[engine]);
  const viewportRef=useRef<HTMLDivElement>(null);
  const game=engine.getState(), sector=engine.getSector();
  const [focus,setFocus]=useState<{camera:typeof sector.camera;nonce:number}>();
  const choose=(next:Terrain,old=legacy)=>{setTerrain(next);setLegacy(old);setEngine(fixture(next,old));setFocus(undefined);setMap(false);};
  const reviewHoleExploration=()=>{const next=createInitialState(37),east=sectorForState(next,6,5);east.unlocked=true;east.visited=true;const template=next.sectors['5,5'].nodes.find(n=>n.kind==='extractor')!;east.nodes.push({...structuredClone(template),id:'review-deep-hole',kind:'big-hole',name:'Deep Hole',x:300,y:1900,holeOrigin:'generated',resourceRemaining:300,holeBaseStone:300,holeStoneConsumed:0,obstructionRadius:100});next.sectors[east.id]=east;next.activeSectorId=east.id;next.research.completed.push('exploration');next.research.mapPoints=1;next.paused=true;setEngine(new GameEngine(next,{autosave:false}));setFocus(undefined);setMap(true);};
  const reviewMap=()=>{for(let y=0;y<=6;y++)for(let x=0;x<11;x++){const target=engine.ensureSector(x,y);game.sectors[target.id]=target;target.unlocked=true;target.visited=true;}const unvisited=engine.ensureSector(5,7);game.sectors[unvisited.id]=unvisited;unvisited.unlocked=true;unvisited.visited=false;setRevision(n=>n+1);setMap(true);};
  const fit=()=>{const field=getWorldFieldSize(game),rect=viewportRef.current!.getBoundingClientRect();const zoom=Math.min((rect.width-60)/field.width,(rect.height-60)/field.height);setFocus({camera:{x:(rect.width-field.width*zoom)/2,y:(rect.height-field.height*zoom)/2,zoom},nonce:Date.now()});};
  return <main className="terrain-engine-review"><header><h1>Terrain · real engine review</h1><p>Generated reserves and actual renderer · seed 37 · synthetic review controls · browser saves untouched</p><div className="terrain-engine-controls"><label>Terrain<select value={terrain} onChange={e=>choose(e.target.value as Terrain)}>{TERRAINS.map(t=><option key={t} value={t}>{NAMES[t]}</option>)}</select></label><label><input type="checkbox" checked={legacy} onChange={e=>choose(terrain,e.target.checked)}/> Existing-save comparison</label><button onClick={fit}>Fit field</button><button onClick={()=>{game.preferences.showGrid=!game.preferences.showGrid;setRevision(n=>n+1);}}>Toggle grid</button><button onClick={()=>{setEngine(new GameEngine(normalizeLegacy(JSON.parse(JSON.stringify(game)))!,{autosave:false}));setRevision(n=>n+1);}}>Reload snapshot</button><button onClick={()=>{if(!game.research.completed.includes('areaExpansion2'))game.research.completed.push('areaExpansion2');setRevision(n=>n+1);}}>Expand field</button><button onClick={()=>setMap(true)}>Open Node Map</button><button onClick={reviewMap}>Review explored terrain map</button><button onClick={reviewHoleExploration}>Review exploration near holes</button><button onClick={()=>{engine.developerUnlockAllSectors();setMap(true);}}>Developer unlock all maps</button></div><p role="status">{mapTerrain(game,sector.id)?NAMES[mapTerrain(game,sector.id)!]:'Legacy plain ground'} · Map {sector.id} · terrain rules {game.mapTerrainVersion ?? 0} · field {getWorldFieldSize(game).width} × {getWorldFieldSize(game).height} · {sector.nodes.filter(n=>n.resourceCapacity!==undefined).map(n=>`${n.name} ${n.resourceRemaining}/${n.resourceCapacity}`).join(' · ')}</p></header>
    <PixiPlayfield engine={engine} revision={revision} viewportRef={viewportRef} selectedIds={[]} snapToGrid={false} showRecipeIcons cameraFocus={focus}
      onSelect={()=>{}} onNodeContextMenu={()=>{}} onCopyRecipe={()=>false} onPlace={()=>{}} onConnect={()=>false} onConnectionRejected={()=>{}} onConnectionSelect={()=>{}} onDeleteConnection={()=>{}} onDeleteNode={()=>{}} onCycleInputPorts={()=>{}} onCycleOutputPorts={()=>{}} onRotate={()=>{}} onConfigure={()=>{}} onClonePlacement={()=>{}} onCamera={camera=>{engine.getSector().camera=camera;}} />
    {map&&<NodeMinimap expanded persistLayout={false} game={game} engine={engine} onTravel={id=>{engine.switchSector(id);setMap(false);}} onOpenMap={()=>setMap(true)} onClose={()=>setMap(false)} onHoverChange={()=>{}}/>}
  </main>;
}
const root=createRoot(document.getElementById('root')!);root.render(<Review/>);
if(import.meta.hot)import.meta.hot.dispose(()=>root.unmount());
