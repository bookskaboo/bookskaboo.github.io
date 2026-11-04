// Development fixture only. No autosave, storage access, or live game changes.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { GameEngine, createInitialState } from '../../src/simulation/engine';
import { PixiPlayfield } from '../../src/renderer/PixiPlayfield';
import { NodeInspector } from '../../src/ui/NodeInspector';
import { tutorialNode } from '../../src/tutorials/tutorialState';
import '../../src/styles.css';

const state = createInitialState(204);
state.research.completed = ['precisionControl'];
state.research.unlocked.push('precisionControl','sortingTools');
const sector = state.sectors['5,5'];
sector.camera = { x: 100, y: 60, zoom: .6 };
sector.nodes = [
  tutorialNode('advancedAssembler','producer',400,500,{name:'Controller production',recipeId:'precision-controller',processingPaused:true,output:{'precision-controller':1,'metallic-fines':1}}),
  tutorialNode('filter','filter',1050,500,{name:'Filter',filterItem:'precision-controller'}),
  tutorialNode('warehouse','product',1500,300,{name:'Controllers',processingPaused:true}),
  tutorialNode('wasteHopper','waste',1500,800,{name:'Waste Bin',processingPaused:true}),
];
sector.connections = [{id:'feed',from:'producer',to:'filter',createdAt:0},{id:'selected',from:'filter',to:'product',fromPort:0,createdAt:0}];
const engine = new GameEngine(state,{autosave:false});
engine.tick(400);engine.getState().paused=true;
function Preview(){
  const [selected,select]=useState(['filter']);const [,refresh]=useState(0);const noop=()=>{};
  const node=engine.getSector().nodes.find(node=>node.id===selected[0]);
  const step=()=>{engine.getState().paused=false;for(let i=0;i<24;i++)engine.tick(100);engine.getState().paused=true;refresh(v=>v+1);};
  return <><header style={{position:'fixed',top:15,left:20,zIndex:30,display:'flex',gap:12,alignItems:'center'}}><b>PRODUCTION QA · ISOLATED</b><button onClick={()=>{engine.connectPorts('filter',1,'waste',0);step();}}>Connect remainder and advance</button><button onClick={()=>select(['producer'])}>Inspect production</button><button onClick={()=>select(['filter'])}>Inspect Filter</button></header>
    <PixiPlayfield engine={engine} revision={engine.getState().revision} selectedIds={selected} snapToGrid={false} onSelect={select} onConfigure={id=>select([id])} onNodeContextMenu={noop} onCopyRecipe={()=>false} onPlace={noop} onConnect={()=>false} onConnectionRejected={noop} onConnectionSource={noop} onConnectionSelect={noop} onDeleteConnection={noop} onDeleteNode={noop} onCycleInputPorts={noop} onCycleOutputPorts={noop} onRotate={noop} onClonePlacement={noop} onCamera={noop}/>
    {node&&<NodeInspector node={node} game={engine.getState()} engine={engine} onClose={()=>select([])} onConfigureRecipe={noop} onOpenResearch={noop} onDelete={noop}/>}
    <p style={{position:'fixed',bottom:12,left:20,zIndex:30}}>Controllers delivered: {engine.getSector().nodes[2].input['precision-controller']??0} · Fines delivered: {engine.getSector().nodes[3].input['metallic-fines']??0}</p>
  </>;
}
const qaRoot = import.meta.hot?.data.qaRoot ?? createRoot(document.getElementById('root')!);
qaRoot.render(<Preview/>);
if (import.meta.hot) import.meta.hot.dispose(data => { data.qaRoot = qaRoot; });
