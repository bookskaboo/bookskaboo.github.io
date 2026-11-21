import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {GameEngine} from '../../src/simulation/engine';
import {PixiPlayfield} from '../../src/renderer/PixiPlayfield';
import {NodeInspector} from '../../src/ui/NodeInspector';
import {NodeMinimap} from '../../src/ui/NodeMinimap';
import {UiTooltipLayer} from '../../src/ui/components/UiTooltipLayer';
import type {CameraState} from '../../src/domain/types';
import {getNodeSize} from '../../src/domain/nodeGeometry';
import {obstructionFixture,type Scenario} from './model';
import '../../src/styles.css';
import '../active-factory/preview.css';
import './preview.css';

function Preview(){
  const [scenario,setScenario]=useState<Scenario>('Dwarven camp'),[rules,setRules]=useState<1|2>(2);
  const [engine]=useState(()=>new GameEngine(obstructionFixture('Dwarven camp'),{autosave:false}));
  const [revision,setRevision]=useState(0),[selected,setSelected]=useState<string[]>(['deposit']);
  const [connection,setConnection]=useState<string>(),[message,setMessage]=useState(''),[showMap,setShowMap]=useState(false);
  const [cameraFocus,setCameraFocus]=useState<{camera:CameraState;nonce:number}>();
  const [running,setRunning]=useState(false);
  const viewportRef=useRef<HTMLDivElement>(null),headerRef=useRef<HTMLElement>(null);
  const state=engine.getState(),sector=engine.getSector(),inspected=sector.nodes.find(n=>selected.includes(n.id));
  const refresh=()=>setRevision(n=>n+1);
  const focus=()=>{const box=viewportRef.current?.getBoundingClientRect();if(!box)return;const nodes=engine.getSector().nodes;
    const left=Math.min(...nodes.map(n=>n.x-getNodeSize(n).w/2)),right=Math.max(...nodes.map(n=>n.x+getNodeSize(n).w/2));
    const top=Math.min(...nodes.map(n=>n.y-getNodeSize(n).h/2)),bottom=Math.max(...nodes.map(n=>n.y+getNodeSize(n).h/2));
    const width=box.width>850?box.width-360:box.width-24,zoom=Math.min(.6,(width-40)/(right-left),(box.height-50)/(bottom-top));
    const camera={x:(width-(left+right)*zoom)/2,y:box.top+(box.height-(top+bottom)*zoom)/2,zoom};engine.setCamera(camera);setCameraFocus(p=>({camera,nonce:(p?.nonce??0)+1}));};
  useEffect(()=>engine.subscribe(refresh),[engine]);
  useEffect(()=>{if(!running)return;const timer=window.setInterval(()=>engine.tick(100),100);return()=>window.clearInterval(timer);},[running,engine]);
  useLayoutEffect(()=>{const head=headerRef.current!;const update=()=>{head.parentElement!.style.setProperty('--test-header-height',`${head.getBoundingClientRect().height}px`);requestAnimationFrame(focus);};const observer=new ResizeObserver(update);observer.observe(head);update();return()=>observer.disconnect();},[engine]);
  const reset=(next=scenario,version=rules)=>{setRunning(false);setScenario(next);setRules(version);engine.replaceState(obstructionFixture(next,version));setSelected(next.endsWith('camp')?['deposit']:next==='Lake'?['lake']:next==='Corner reward'?['corner-tribute-0-0']:[]);setConnection(undefined);setMessage('');refresh();requestAnimationFrame(focus);};
  const advance=(ms:number)=>{for(let i=0;i<ms;i+=100)engine.tick(Math.min(100,ms-i));refresh();};
  const run=(action:()=>void)=>{action();refresh();};
  const deposit=sector.nodes.find(n=>n.id==='deposit'),camp=sector.nodes.find(n=>n.id==='camp');
  return <main className="active-factory-test obstruction-preview"><header className="factory-test-header" ref={headerRef}>
    <div className="factory-test-title"><strong>New world obstruction test</strong><span>Real engine fixtures · browser saves untouched</span></div>
    <div className="factory-test-controls">
      <label>Scenario <select value={scenario} onChange={e=>reset(e.target.value as Scenario)}>{(['Dwarven camp','Goblin camp','Deep Holes','Lake','Corner reward'] as Scenario[]).map(s=><option key={s}>{s}</option>)}</select></label>
      <label>Rules <select value={rules} onChange={e=>reset(scenario,Number(e.target.value) as 1|2)}><option value={2}>New world</option><option value={1}>Legacy world</option></select></label>
      <button onClick={()=>reset()}>Reset fixture</button><button disabled={running} onClick={()=>advance(5000)}>Advance 5 seconds</button><button onClick={()=>setRunning(v=>!v)}>{running?'Stop clock':'Run clock'}</button><button onClick={()=>setShowMap(v=>!v)}>Toggle Node Map</button><button onClick={focus}>Fit field</button>
      {camp&&<><button onClick={()=>run(()=>{camp.input['suppression-bot']=40;advance(120000);})}>Run two funded checks</button><button onClick={()=>run(()=>{camp.suppressed=false;camp.campStrength=20;camp.campLastCheck={passed:false,atMs:state.playTimeMs,suppliedAp:0,requiredAp:camp.attackRequirement??3};engine.tick(100);})}>Suppression lost preset</button><button onClick={()=>run(()=>setMessage(engine.connect('deposit','extractor')?'Extractor connected':'Connection blocked'))}>Connect Extractor</button><button onClick={()=>run(()=>{deposit!.resourceRemaining=2980;})}>Reserve minus 20 preset</button></>}
      {scenario==='Deep Holes'&&<button onClick={()=>run(()=>{const hole=engine.getSector().nodes.find(n=>n.kind==='big-hole');if(hole){hole.input.stone=4;engine.tick(100);}})}>Deliver final Stone to one hole</button>}
      {scenario==='Lake'&&<><button onClick={()=>run(()=>{const next=sector.nodes.find(n=>n.kind==='fluidLink'&&!sector.connections.some(c=>c.from==='lake'&&c.to===n.id));setMessage(next&&engine.connect('lake',next.id)?'Intake connected':'Intake connection blocked');})}>Connect next Intake</button><button onClick={()=>run(()=>{for(const id of ['fluidLink5','fluidLink6'])if(!state.research.completed.includes(id)){state.research.completed.push(id);break;}})}>Add Intake upgrade</button><button onClick={()=>run(()=>setMessage(engine.tryMoveNodesTo({lake:{x:sector.nodes[0].x+100,y:sector.nodes[0].y+100}})?'Lake moved':'Move blocked'))}>Move Lake</button></>}
    </div>
    <div className="factory-test-stats"><span>Connections: {sector.connections.length}</span><span>Filled patches: {sector.filledHoles?.length??0}</span>{deposit&&<span>Reserve: {deposit.resourceRemaining}/{deposit.resourceCapacity} · {deposit.guardedLocked?'Locked':'Accessible'}</span>}<span role="status">{message}</span></div>
    <p>Presets set up test conditions; they do not measure normal-play balance. Select a node to inspect it. Grey map cells explain nearby generated holes.</p>
  </header>
  <PixiPlayfield viewportRef={viewportRef} engine={engine} revision={revision} selectedIds={selected} selectedConnection={connection} snapToGrid={false} showRecipeIcons={true} cameraFocus={cameraFocus}
    onSelect={setSelected} onNodeContextMenu={id=>setSelected([id])} onCopyRecipe={()=>false} onPlace={()=>{}} onConnect={(a,b,c,d,replace)=>engine.connectPorts(a,c,b,d,replace)} onConnectionRejected={f=>setMessage(`${f.title}: ${f.detail}`)}
    onConnectionSelect={setConnection} onDeleteConnection={id=>engine.deleteConnection(id)} onDeleteNode={id=>engine.deleteNodes([id])} onCycleInputPorts={id=>engine.cycleNodeInputOrder(id)} onCycleOutputPorts={id=>engine.cycleNodeOutputPosition(id)} onRotate={id=>engine.rotateNode(id)} onConfigure={id=>setSelected([id])} onClonePlacement={()=>{}} onCamera={camera=>engine.setCamera(camera)}/>
  {inspected&&!showMap&&<NodeInspector node={inspected} game={state} engine={engine} onClose={()=>setSelected([])} onConfigureRecipe={()=>{}} onOpenResearch={()=>{}} onDelete={()=>engine.deleteNodes([inspected.id])}/>}
  {showMap&&<NodeMinimap game={state} engine={engine} expanded onHoverChange={()=>{}} onClose={()=>setShowMap(false)} onOpenMap={()=>{}} onTravel={id=>engine.switchSector(id)}/>}
  <UiTooltipLayer/>
  </main>;
}
const root=createRoot(document.getElementById('root')!);root.render(<Preview/>);if(import.meta.hot)import.meta.hot.dispose(()=>root.unmount());
