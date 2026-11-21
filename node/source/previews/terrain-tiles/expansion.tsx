import { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { expansionComparison } from './expansionComparison';
import results from '../../outputs/unvisited-map-expansion/centered-test-summary.json';
import spawning from '../../outputs/unvisited-map-expansion/spawn-test-summary.json';
import '../../src/styles.css';
import './expansion.css';

type Comparison=ReturnType<typeof expansionComparison>;
type Snapshot=Comparison['before']['built'];
const near=(a:number,b:number)=>Math.abs(a-b)<1e-6;
const centered=(p:{x:number;y:number},field:{width:number;height:number})=>({x:p.x-field.width/2,y:p.y-field.height/2});
function checks(data:Comparison){
  const old=data.before.built,next=data.after.built;
  const fixed=old.nodes.filter(n=>n.kind!=='road').every(n=>{const after=next.nodes.find(a=>a.id===n.id)!;const a=centered(n,old.field),b=centered(after,next.field);return near(a.x,b.x)&&near(a.y,b.y)&&n.w===after.w&&n.h===after.h;});
  const cables=old.cables.every(c=>{const after=next.cables.find(a=>a.id===c.id)!;if(!after||c.from!==after.from||c.to!==after.to)return false;
    if([c.from,c.to].some(id=>old.nodes.find(n=>n.id===id)?.kind==='road'))return true;
    return (['start','end','first','second']as const).every(key=>{const a=centered(c[key],old.field),b=centered(after[key],next.field);return near(a.x,b.x)&&near(a.y,b.y);});});
  const stock=(['built','unexplored']as const).every(key=>data.before[key].nodes.every(n=>{const after=data.after[key].nodes.find(a=>a.id===n.id);return after?.stock===n.stock&&after?.cap===n.cap&&after?.kind===n.kind;})&&data.before[key].nodes.length===data.after[key].nodes.length);
  const spread=data.before.unexplored.nodes.filter(n=>n.kind!=='road').every(n=>{const after=data.after.unexplored.nodes.find(a=>a.id===n.id)!;return near(after.x,n.x*next.field.width/old.field.width)&&near(after.y,n.y*next.field.height/old.field.height);});
  const camera=old.nodes.filter(n=>n.kind!=='road').every(n=>{const after=next.nodes.find(a=>a.id===n.id)!;return old.camera.zoom===next.camera.zoom&&near(old.camera.x+n.x*old.camera.zoom,next.camera.x+after.x*next.camera.zoom)&&near(old.camera.y+n.y*old.camera.zoom,next.camera.y+after.y*next.camera.zoom);});
  const roads=(['built','unexplored']as const).every(key=>data.before[key].nodes.filter(n=>n.kind==='road').every(n=>{const after=data.after[key].nodes.find(a=>a.id===n.id)!;return near(after.x,key==='built'?data.after[key].field.width-67.5:67.5)&&near(after.y-data.after[key].field.height/2,n.y-data.before[key].field.height/2);}));
  return [['Built node/resource positions and sizes stay fixed',fixed],['Internal cable curves and all connections stay intact',cables],['Resource stock, caps, types and counts stay unchanged',stock],['Unexplored resources spread around the center',spread],['Built-map camera and zoom keep the same view',camera],['Both Road endpoints follow their new field borders',roads]]as const;
}
function Plot({map,reference,maximum,after}:{map:Snapshot;reference:Snapshot;maximum:Snapshot;after:boolean}){
  const host=useRef<HTMLDivElement>(null),[width,setWidth]=useState(500);
  useEffect(()=>{const observer=new ResizeObserver(([entry])=>setWidth(entry.contentRect.width));observer.observe(host.current!);return()=>observer.disconnect();},[]);
  const scale=(width-40)/maximum.field.width,height=maximum.field.height*scale+50;
  const ox=20+(maximum.field.width-map.field.width)*scale/2,oy=20+(maximum.field.height-map.field.height)*scale/2;
  const x=(v:number)=>ox+v*scale,y=(v:number)=>oy+v*scale;
  const extraX=(maximum.field.width-reference.field.width)/2,extraY=(maximum.field.height-reference.field.height)/2;
  return <div className="expansion-plot" ref={host}><svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label={`${after?'After':'Before'} ${map.visited?'built':'unexplored'} map, ${map.field.width} by ${map.field.height}`}>
    <rect x={ox} y={oy} width={map.field.width*scale} height={map.field.height*scale} className={after?'expanded-ground':'original-ground'}/>
    {after&&<rect x={x(extraX)} y={y(extraY)} width={reference.field.width*scale} height={reference.field.height*scale} className="former-field"/>}
    {map.cables.map(c=><path key={c.id} className="map-cable" d={`M${x(c.start.x)} ${y(c.start.y)}C${x(c.first.x)} ${y(c.first.y)} ${x(c.second.x)} ${y(c.second.y)} ${x(c.end.x)} ${y(c.end.y)}`}/>)}
    {map.nodes.map(n=>{const built=['woodenChest','kiln','road'].includes(n.kind),w=Math.max(8,n.w*scale),h=Math.max(8,n.h*scale);return <g key={n.id} className={built?'built-mark':'resource-mark'}><title>{n.name} · {Math.round(n.x-map.field.width/2)}, {Math.round(n.y-map.field.height/2)} from field center{n.cap===undefined?'':` · ${n.stock}/${n.cap}`}</title>{built?<rect x={x(n.x)-w/2} y={y(n.y)-h/2} width={w} height={h}/>:<ellipse cx={x(n.x)} cy={y(n.y)} rx={w/2} ry={h/2}/>}<text x={Math.max(34,Math.min(width-34,x(n.x)))} y={y(n.y)+h/2+16} textAnchor="middle">{n.name}</text></g>;})}
  </svg></div>;
}
function Review(){
  const [level,setLevel]=useState<1|2>(1),data=useMemo(()=>expansionComparison(level),[level]),tests=checks(data);
  const dx=(data.after.built.field.width-data.before.built.field.width)/2,dy=(data.after.built.field.height-data.before.built.field.height)/2;
  return <main className="expansion-review"><header><div><p className="review-kicker">NODE · author review</p><h1>Equal growth on every side</h1><p>Actual engine snapshots around paid research completion. Synthetic fixtures; no browser-save writes.</p></div><label>Research step<select value={level} onChange={e=>setLevel(Number(e.target.value)as 1|2)}><option value={1}>Area Expansion 1</option><option value={2}>Area Expansion 2</option></select></label></header>
    <p className="expansion-dimensions">{data.before.built.field.width.toLocaleString()} × {data.before.built.field.height.toLocaleString()} → {data.after.built.field.width.toLocaleString()} × {data.after.built.field.height.toLocaleString()} · +{dx} west/east · +{dy} north/south · common scale</p>
    {(['built','unexplored']as const).map(key=><section key={key}><h2>{key==='built'?'Explored, built · E1':'Unexplored · E2'}</h2><p>{key==='built'?'Factory, resources and internal cables stay fixed. Only the Road and its vehicle cable change.':'The same resources spread across the larger field; stock and capacity stay unchanged.'}</p><div className="comparison-panels">{(['before','after']as const).map(stage=><figure key={stage}><figcaption>{stage==='before'?'Before':`After ${data.project}`}</figcaption><Plot map={data[stage][key]} reference={data.before[key]} maximum={data.after[key]} after={stage==='after'}/></figure>)}</div></section>)}
    <div className="expansion-legend"><span><i className="resource-key"/>Resources</span><span><i className="built-key"/>Built nodes</span><span><i className="new-key"/>Added area</span><span>Faint rectangle: former field border</span></div>
    <section className="expansion-results"><h2>Test results</h2><ul>{tests.map(([name,pass])=><li key={name}><span className={pass?'test-pass':'test-fail'}>{pass?'PASS':'FAIL'}</span>{name}</li>)}</ul><p>Workspace: {results.workspace} · Focused expansion checks: {results.focused} · Production build: {results.build}</p><p><a href="/outputs/unvisited-map-expansion/centered-workspace-tests.log" target="_blank" rel="noreferrer">Workspace test log</a> · <a href="/outputs/unvisited-map-expansion/centered-focused-tests.log" target="_blank" rel="noreferrer">Focused test log</a> · <a href="/outputs/unvisited-map-expansion/centered-build.log" target="_blank" rel="noreferrer">Build log</a></p>
      <h2>Obstruction-aware spawning</h2><p>Reserve the visible River, Mountain and Chasm artwork plus 32 world units, maximum camp growth and future Golem reserves. Unexplored redistribution also reserves final incoming Road positions. A layout that cannot fit keeps its centered arrangement.</p><p>Generation audit: {spawning.audit} · Regression checks: {spawning.focused} · Workspace: {spawning.workspace} · Build: {spawning.build}</p><p><a href="/outputs/unvisited-map-expansion/spawn-clearance/generation-audit.json" target="_blank" rel="noreferrer">Detailed generation audit</a> · <a href="/outputs/unvisited-map-expansion/spawn-focused-tests.log" target="_blank" rel="noreferrer">Spawn regression log</a> · <a href="/outputs/unvisited-map-expansion/spawn-workspace-tests.log" target="_blank" rel="noreferrer">Workspace test log</a></p>
    </section>
  </main>;
}
const root=createRoot(document.getElementById('root')!);root.render(<Review/>);if(import.meta.hot)import.meta.hot.dispose(()=>root.unmount());
