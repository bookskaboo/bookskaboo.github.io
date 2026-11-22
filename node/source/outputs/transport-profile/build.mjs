import { build,parseSync } from 'vite';
import { mkdirSync,writeFileSync } from 'node:fs';
const out='outputs/transport-profile';
mkdirSync(out,{recursive:true});
const sites=[];
const engineMethods=new Set(['tick','deliverTransfers','simulateSector','routeSector','dispatchRoadItem','evaluateMilestones','resolveDeliveryRoute','resolveExtractorInput','resolveResourceRoute','inputRoom','inputCapacity']);
const modules=new Set(['roadMaterials.ts','mixedOutput.ts','simulationLookups.ts','obstructedConnections.ts','logisticsRoutes.ts','expansionRescue.ts']);
for(const instrumented of [false,true]){
  await build({configFile:false,plugins:instrumented?[{name:'one-off-transport-attribution',enforce:'pre',transform(code,id){
    const file=id.replaceAll('\\','/').split('/').at(-1);
    if(!id.replaceAll('\\','/').includes('/src/simulation/')||(!modules.has(file)&&file!=='engine.ts'))return;
    const parsed=parseSync(id,code);if(parsed.errors.length)throw Error(JSON.stringify(parsed.errors));const ast=parsed.program;const edits=[];
    function visit(n){
      const method=n.type==='MethodDefinition',fn=n.type==='FunctionDeclaration';
      const name=method?n.key?.name:n.id?.name;const body=method?n.value?.body:n.body;
      if(body&&(method||fn)&&(file!=='engine.ts'||engineMethods.has(name))&&(file!=='expansionRescue.ts'||['applyExpansionRescue','nextExpansionShortages','minimumCosts'].includes(name))){
        const label=file+':'+name;sites.push(label);
        const volume=file==='mixedOutput.ts'&&name==='reconcileQueue'?'queue?.length??0':'0';
        edits.push({at:body.start+1,text:`const __tp=globalThis.__transportProbe.enter(${JSON.stringify(label)},${volume});try{`});
        edits.push({at:body.end-1,text:'}finally{globalThis.__transportProbe.exit(__tp);}'});
      }
      for(const value of Object.values(n))if(Array.isArray(value)){for(const child of value)if(child&&typeof child.type==='string')visit(child);}else if(value&&typeof value.type==='string')visit(value);
    }
    visit(ast);edits.sort((a,b)=>b.at-a.at||(a.text.startsWith('}')?-1:1));for(const e of edits)code=code.slice(0,e.at)+e.text+code.slice(e.at);
    return{code,map:null};
  }}]:[],build:{ssr:out+'/worker.ts',outDir:out+'/'+(instrumented?'instrumented':'baseline'),minify:false,sourcemap:true,rollupOptions:{output:{entryFileNames:'worker.mjs'}}}});
}
writeFileSync(out+'/instrumentation-sites.json',JSON.stringify(sites,null,2)+'\n');
