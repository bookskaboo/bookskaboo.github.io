import fs from 'node:fs';
import vm from 'node:vm';
const file=process.argv[2];
const html=fs.readFileSync(file,'utf8');
const json=html.match(/<script type="application\/json" id="node-expansion-data">([\s\S]*?)<\/script>/)[1];
const script=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
const results=[];
for(const width of [288,352,480]){
  const marks=[];
  const element=()=>({attributes:{},children:[],setAttribute(k,v){if(/NaN|undefined|Infinity/.test(String(v)))throw Error(`${k}=${v}`);this.attributes[k]=v;},append(el){this.children.push(el);marks.push(el);},replaceChildren(){this.children=[];}});
  const plots=['built','unexplored'].flatMap(map=>['before','after'].map(stage=>({...element(),dataset:{map,stage},parentElement:{clientWidth:width}})));
  const root={querySelectorAll:()=>plots};
  vm.runInNewContext(script,{document:{getElementById:id=>id==='node-expansion-data'?{textContent:json}:root,createElementNS:()=>element()},ResizeObserver:class{observe(){}}});
  for(const plot of plots)if(!plot.children.length)throw Error('Empty plot');
  results.push({width,plots:plots.length,marks:marks.length,finiteGeometry:true});
}
if(/__EXPANSION_DATA__|<!doctype|<html|<head|<body/i.test(html))throw Error('Invalid fragment');
console.log(JSON.stringify({bytes:Buffer.byteLength(html),results,renderInspected:false},null,2));
