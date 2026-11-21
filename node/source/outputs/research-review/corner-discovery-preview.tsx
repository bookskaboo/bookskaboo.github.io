import React, { useReducer, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { GameEngine, createInitialState } from '../../src/simulation/engine';
import { NodeMinimap } from '../../src/ui/NodeMinimap';
import { RailButton } from '../../src/ui/components/RailButton';
import { cornerDiscoveryPending, SEVEN_CORES } from '../../src/content/endgame';
import { worldCornerIds } from '../../src/domain/worldGrid';
import '../../src/styles.css';

const initial = createInitialState(41);
initial.paused = false;
initial.research.completed = ['exploration', 'assembler', 'precisionControl', 'shinyCore'];
initial.research.unlocked = ['extractor', ...initial.research.completed];
initial.sectors['5,5'].nodes = [{ id:'lab', kind:'researchCenter', name:'Research Center', x:1000,y:1000,rotation:0,
  input:Object.fromEntries(SEVEN_CORES.slice(0,5).map(core=>[core,5])),output:{},progressMs:0,cycleMs:5000,constructedAt:0,constructionMs:0 }];
let engine = new GameEngine(initial, { autosave:false });
function Review() {
  const [,refresh] = useReducer(n=>n+1,0);
  const [expanded,expand] = useState(false);
  React.useEffect(()=>engine.subscribe(refresh),[]);
  const game=engine.getState();
  const open=()=>{engine.acknowledgeCornerDiscovery();expand(true);};
  return <><section style={{padding:20,color:'#d3dbe2',fontFamily:'var(--ui-font-family)'}}>
    <h1>Corner discovery review</h1><p>Synthetic UI fixture using actual research payments and map components. No browser saves.</p>
    <button onClick={()=>{engine.selectResearch('complexCore');for(let i=0;i<250;i++)engine.tick(100);refresh();}}>Complete Complex Core research</button>
    <button onClick={()=>{engine=new GameEngine(structuredClone(initial),{autosave:false});engine.subscribe(refresh);expand(false);refresh();}}>Reset example</button>
    <button onClick={()=>{engine.replaceState(JSON.parse(JSON.stringify(engine.getState())));refresh();}}>Reload saved acknowledgement</button>
    <RailButton tone="map" icon="◎" label="Map" active={expanded} attention={cornerDiscoveryPending(game)} onInspect={()=>engine.acknowledgeCornerDiscovery()} onClick={open}/>
    <p role="status">Map flash: {cornerDiscoveryPending(game)?'pending':'cleared'} · Corner flashes: {worldCornerIds(11).filter(id=>cornerDiscoveryPending(game,id)).length} · Complex Core: {game.research.completed.includes('complexCore')?'unlocked':'locked'}</p>
  </section><NodeMinimap game={game} engine={engine} expanded={expanded} persistLayout={false} onTravel={()=>{}} onOpenMap={open} onClose={()=>expand(false)} onHoverChange={()=>{}}/></>;
}
createRoot(document.getElementById('root')!).render(<Review/>);
