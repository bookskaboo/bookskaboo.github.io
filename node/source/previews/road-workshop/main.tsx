import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PixiPlayfield } from '../../src/renderer/PixiPlayfield';
import type { CameraState } from '../../src/domain/types';
import { mapNodePosition } from '../../src/domain/worldGrid';
import { getWorldFieldSize } from '../../src/simulation/worldGeneration';
import { measureFieldViewport } from '../../src/ui/responsiveLayout';
import { createRoadWorkshop } from './fixture';
import '../../src/styles.css';
import './style.css';

function Workshop() {
  const [engine,setEngine]=useState(createRoadWorkshop), [revision,setRevision]=useState(0);
  const [selected,setSelected]=useState<string[]>([]), [placing,setPlacing]=useState(false), [status,setStatus]=useState('Ready. The Roads have somewhere to go.');
  const [focus,setFocus]=useState<{camera:CameraState;nonce:number}>();
  const viewport=useRef<HTMLDivElement>(null), toolbar=useRef<HTMLElement>(null), host=useRef<HTMLElement>(null);
  const game=engine.getState(), sector=engine.getSector(), roads=sector.nodes.filter(n=>n.kind==='road');
  useEffect(()=>engine.subscribe(()=>setRevision(n=>n+1)),[engine]);
  const view=(camera:CameraState)=>{engine.setCamera(camera);setFocus(old=>({camera,nonce:(old?.nonce??0)+1}));};
  const fit=()=>{const field=getWorldFieldSize(game), top=toolbar.current!.getBoundingClientRect().bottom+84;
    const width=Math.max(240,window.innerWidth-444), height=Math.max(180,window.innerHeight-top-90), zoom=Math.min(.32,width/field.width,height/field.height);
    view({x:(width-field.width*zoom)/2+72,y:top+(height-field.height*zoom)/2,zoom});};
  useLayoutEffect(()=>{let initial=true;const update=()=>{host.current!.style.setProperty('--hud-clear',`${toolbar.current!.getBoundingClientRect().height}px`);fit();
    if(initial){for(const target of Object.values(engine.getState().sectors))target.camera={...engine.getSector().camera};initial=false;}};
    const observer=new ResizeObserver(update);observer.observe(toolbar.current!);update();return()=>observer.disconnect();},[engine]);
  const travel=(id:string,sourceRoadId?:string)=>{const field=getWorldFieldSize(game),overview={width:field.width*2,height:field.height*2};let arrivalRoadId:string|undefined;if(sourceRoadId)arrivalRoadId=engine.travelThroughRoad(sourceRoadId,measureFieldViewport(viewport.current!),overview);else engine.travelToSector(id,measureFieldViewport(viewport.current!),overview);setSelected(arrivalRoadId?[arrivalRoadId]:[]);setPlacing(false);setStatus(`Arrived at ${mapNodePosition(engine.getSector().x,engine.getSector().y)}. Zoom retained.`);};
  const reverse=(id:string)=>{const error=engine.getRoadReversalError(id);if(error){setStatus(error);return;}engine.reverseRoad(id);setStatus('Road flow reversed on both maps. Attached Road cables are disconnected by the normal reversal rule.');};
  const focusRoad=(id:string)=>{const road=roads.find(n=>n.id===id)!;const target=game.sectors[road.pairedSectorId!]!;
    const zoom=.75, dx=target.x-sector.x,dy=target.y-sector.y;
    view({zoom,x:(window.innerWidth-260)/2-(road.x-dx*350)*zoom,y:(window.innerHeight+toolbar.current!.getBoundingClientRect().bottom)/2-(road.y-dy*220)*zoom});setSelected([id]);};
  const place=(x:number,y:number)=>{const id=engine.placeNode('road',x,y);setStatus(id?'New Road pair placed.':engine.getNodePlacementError('road',x,y));if(id)setPlacing(false);};
  return <main ref={host} className="road-workshop"><header ref={toolbar} className="road-workshop-toolbar">
    <div><h1>Road workshop</h1><p>Nine connected maps · temporary test factory · campaign saves untouched</p></div>
    <div className="road-workshop-actions"><button onClick={fit}>Fit field</button><button onClick={()=>setPlacing(!placing)}>{placing?'Cancel Road':'Place Road'}</button><button onClick={()=>{game.preferences.showGrid=!game.preferences.showGrid;setRevision(n=>n+1);}}>Toggle grid</button><button onClick={()=>{setEngine(createRoadWorkshop());setSelected([]);setPlacing(false);setStatus('Workshop reset.');}}>Reset workshop</button></div>
    <p role="status">{mapNodePosition(sector.x,sector.y)} · Zoom {Math.round(sector.camera.zoom*100)}% · {status}</p></header>
    <aside className="road-workshop-sidebar"><h2>Test maps</h2><nav className="road-workshop-maps" aria-label="Test maps">{Array.from({length:9},(_,i)=>{const x=4+i%3,y=4+Math.floor(i/3),id=`${x},${y}`,name=mapNodePosition(x,y);return <button key={id} aria-current={id===sector.id?'location':undefined} onClick={()=>travel(id)}>{name}</button>;})}</nav>
      <h2>Try the Road</h2><p>Right-click its body to reverse flow. Click the red arrow under Travel, or double-click the Road body, to visit its neighbor.</p><p>Drag a Road to move its pair. Use Place Road to try another channel.</p>
      <h2>Local Roads</h2>{roads.map(road=>{const target=game.sectors[road.pairedSectorId!]!,name=mapNodePosition(target.x,target.y);return <button className="road-workshop-route" key={road.id} onClick={()=>focusRoad(road.id)}><span>{road.roadMode==='export'?`${mapNodePosition(sector.x,sector.y)} → ${name}`:`${name} → ${mapNodePosition(sector.x,sector.y)}`}</span><small>Focus Road · {road.roadMode==='export'?'Sending':'Receiving'}</small></button>;})}
      <p className="road-workshop-note">Current Road controls: no gear, right-click flow reversal and a red Travel arrow. Changes in this window last until reset or reload.</p></aside>
    <PixiPlayfield engine={engine} revision={revision} viewportRef={viewport} selectedIds={selected} placing={placing?'road':undefined} snapToGrid={false} showRecipeIcons
      cameraFocus={focus} onSelect={setSelected} onNodeContextMenu={id=>reverse(id)} onTravelToSector={travel} onCopyRecipe={()=>false} onPlace={(_,x,y)=>place(x,y)} onConnect={(from,to,fromPort,toPort,replace)=>engine.connectPorts(from,fromPort,to,toPort,replace)} onConnectionRejected={failure=>setStatus(failure.detail)} onConnectionSelect={()=>{}} onDeleteConnection={id=>engine.deleteConnection(id)} onDeleteNode={id=>engine.deleteNodes([id])} onCycleInputPorts={()=>{}} onCycleOutputPorts={()=>{}} onRotate={reverse} onConfigure={()=>{}} onClonePlacement={()=>setPlacing(true)} onCamera={camera=>{engine.setCamera(camera);setRevision(n=>n+1);}} />
  </main>;
}
const root=createRoot(document.getElementById('root')!);root.render(<Workshop/>);
if(import.meta.hot)import.meta.hot.dispose(()=>root.unmount());
