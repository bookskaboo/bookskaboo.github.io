import { describe, expect, it } from 'vitest';
import { createInitialState, GameEngine } from './engine';
import { applyExpansionRescue } from './expansionRescue';
import { progressionDeficits } from './progressionRecovery';
import { getResearchProject } from '../content/research';
import { RECIPES } from '../content/recipes';
import type { GameState } from '../domain/types';

function stranded() {
  const state=createInitialState(123);
  state.research.completed=['kiln','smelter','refiner','researchCenter','simpleCore'];
  state.research.unlocked=[...state.research.completed];
  state.sectors['5,5'].nodes.find(node=>node.resourceItem==='copper')!.resourceRemaining=0;
  state.sectors['5,5'].nodes.find(n=>n.kind==='extractor')!.output={'copper-wire':166,'copper-plate':2};
  return state;
}
const copper=(s:GameState)=>s.sectors['5,5'].nodes.find(n=>n.resourceItem==='copper')!;
describe('production-only depletion recovery',()=>{
  it('restores only the missing raw Copper before Assembler and Exploration',()=>{
    const s=stranded();
    expect(progressionDeficits(s,'exploration')).toEqual({copper:36});
    expect(applyExpansionRescue(s)).toBe(true);
    expect(copper(s).resourceRemaining).toBe(36);
    expect(s.sectors['5,5'].nodes.find(n=>n.kind==='extractor')!.output).toEqual({'copper-wire':166,'copper-plate':2});
    expect(s.research.completed).not.toContain('exploration');
    expect(s.rescue?.pending).toMatchObject({kind:'local',amount:36,sectorId:'5,5',newMaps:0});
    expect(Object.keys(s.sectors)).toEqual(['5,5']);
    expect(applyExpansionRescue(s)).toBe(false);
    delete s.rescue!.pending;
    expect(applyExpansionRescue(s)).toBe(false);
    copper(s).resourceRemaining=0;
    expect(applyExpansionRescue(s)).toBe(true);
    expect(s.rescue!.restored!.copper).toBe(72);
  });
  it('does not refill intact, slow or disconnected reserves and handles paid research',()=>{
    expect(applyExpansionRescue(createInitialState(1))).toBe(false);
    const s=stranded();copper(s).resourceRemaining=36;
    expect(applyExpansionRescue(s)).toBe(false);
    copper(s).resourceRemaining=0;s.research.selected='assembler';s.research.contributed={'simple-core':4};s.research.projectContributions={assembler:{'simple-core':4}};
    expect(progressionDeficits(s,'exploration')).toEqual({copper:4});
    s.sectors['5,5'].nodes.find(n=>n.kind==='extractor')!.output['simple-core']=1;
    expect(applyExpansionRescue(s)).toBe(false);
  });
  it('counts available intermediate stock, batches and real shipments once',()=>{
    const s=stranded();s.sectors['5,5'].nodes.find(n=>n.kind==='extractor')!.output={'copper-gear':9};
    const node=s.sectors['5,5'].nodes.find(n=>n.kind==='extractor')!;
    node.batch={recipeId:'copper-gear',outputs:{'copper-gear':1}};
    expect(progressionDeficits(s,'exploration')).toEqual({});
    delete node.batch;s.inFlightTransfers=[{id:'a',sectorId:'5,5',connectionId:'a',from:'a',to:'b',item:'copper-gear',amount:1,launchedAtMs:0,arrivesAtMs:1000}];
    expect(progressionDeficits(s,'exploration')).toEqual({});
    s.inFlightTransfers![0].cosmeticOnly=true;
    expect(progressionDeficits(s,'exploration')).toEqual({copper:4});
  });
  it('recovers Iron trapped in Gears before Basic Core access',()=>{
    const s=stranded();s.research.completed.push('assembler','basicCore');s.sectors['5,5'].nodes.find(n=>n.kind==='extractor')!.output={'simple-core':5,'copper-plate':5,'iron-gear':250};
    s.sectors['5,5'].nodes.find(n=>n.resourceItem==='iron')!.resourceRemaining=0;
    expect(progressionDeficits(s,'exploration')).toEqual({iron:30});
    expect(applyExpansionRescue(s)).toBe(true);
    expect(s.rescue?.pending?.resource).toBe('iron');
  });
  it('derives the plan from a Simple-only Exploration bill as well',()=>{
    const p=getResearchProject('exploration')!,old=p.costs;
    try {p.costs={'simple-core':5};const s=stranded();expect(progressionDeficits(s,'exploration')).toEqual({copper:36});}
    finally {p.costs=old;}
  });
  it('preserves a pending refill on load and can recover again after acknowledgment',()=>{
    const s=stranded();applyExpansionRescue(s);
    const e=new GameEngine(s,{autosave:false});e.tick(1000);
    expect(copper(e.getState()).resourceRemaining).toBe(36);
    e.acknowledgeRescue();copper(e.getState()).resourceRemaining=0;e.tick(1000);
    expect(copper(e.getState()).resourceRemaining).toBe(36);
    expect(e.getState().rescue?.restored?.copper).toBe(72);
  });
  it('uses renewable mineral supply and accessible recycling without granting stock',()=>{
    const s=stranded();s.research.completed.push('mineralRegeneration');
    expect(applyExpansionRescue(s)).toBe(false);
    s.research.completed=s.research.completed.filter(id=>id!=='mineralRegeneration');
    s.research.completed.push('recycler','lakeTools');s.sectors['5,5'].nodes.find(n=>n.kind==='extractor')!.output.water=100;
    expect(progressionDeficits(s,'exploration')).toEqual({});
  });
  it('restores a collapsed legacy Home deposit without opening maps or repeating a saved refill',()=>{
    const s=stranded(),deposit=copper(s);deposit.kind='big-hole';deposit.resourceItem=undefined;deposit.resourceCapacity=undefined;deposit.resourceRemaining=250;deposit.obstructionRadius=120;
    const e=new GameEngine(s,{autosave:false});e.tick(1000);
    expect(copper(e.getState())).toMatchObject({kind:'copper',resourceRemaining:36});
    const reloaded=new GameEngine(structuredClone(e.getState()),{autosave:false});reloaded.tick(1000);
    expect(copper(reloaded.getState()).resourceRemaining).toBe(36);
  });
  it('does not count an inaccessible global pool as early supply',()=>{
    const s=stranded();s.globalPool={'simple-core':1000,copper:1000};
    expect(progressionDeficits(s,'exploration')).toEqual({copper:36});
  });
  it('accounts for a Recycler unlock that is affordable from existing Cores',()=>{
    const s=stranded();s.research.completed.push('assembler','basicCore','automataCore','hydroCore','hydraulicAssembly','exploration','lakeTools');
    s.sectors['5,5'].nodes.find(n=>n.kind==='extractor')!.output={'simple-core':10,'basic-core':10,'automata-core':10,'hydro-core':10,'copper-wire':500,water:1000};
    expect(progressionDeficits(s,'mapNode',{'simple-core':30})).toEqual({});
    expect(s.research.completed).not.toContain('recycler');
  });
  it('can afford a complete recycling unlock path without spending stock twice',()=>{
    const s=stranded();s.research.completed.push('assembler','basicCore','automataCore','hydraulicAssembly','fabricatorTools','exploration','lakeTools');
    const output=s.sectors['5,5'].nodes.find(n=>n.kind==='extractor')!.output;
    Object.assign(output,{'simple-core':100,'basic-core':100,'automata-core':100,'copper-wire':1000,water:2000});
    for(const [item,count] of Object.entries(RECIPES['hydro-core'].inputs)) output[item as keyof typeof output]=(output[item as keyof typeof output]??0)+count!*10;
    expect(progressionDeficits(s,'mapNode',{'simple-core':200})).toEqual({});
    output['automata-core']=0;
    expect(progressionDeficits(s,'mapNode',{'simple-core':200})).toEqual({copper:796});
  });
});
