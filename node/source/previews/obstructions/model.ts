import type { MachineNode, NodeKind } from '../../src/domain/types';
import { createInitialState } from '../../src/simulation/createInitialState';
import { generateSector } from '../../src/simulation/worldGeneration';
import { guardedDepositPosition } from '../../src/domain/nodeGeometry';

export type Scenario = 'Dwarven camp' | 'Goblin camp' | 'Deep Holes' | 'Lake' | 'Corner reward';
const node=(kind:NodeKind,id:string,x:number,y:number,extra:Partial<MachineNode>={}):MachineNode=>({kind,id,name:id,x,y,rotation:0,input:{},output:{},cycleMs:5000,progressMs:0,constructedAt:0,constructionMs:0,...extra});
export function obstructionFixture(scenario:Scenario,rules:1|2=2){
  const state=createInitialState(37);state.worldRulesVersion=rules;state.progressionVersion=1;
  state.research.completed=['exploration','researchCenter','lakeTools','campRelocation','lakeRelocation'];
  state.research.unlocked=['extractor','fluidLink',...state.research.completed];state.research.mapPoints=5;
  const home=state.sectors['5,5'];home.nodes=[];home.connections=[];home.visited=true;
  if(scenario.endsWith('camp')){
    const dwarf=scenario==='Dwarven camp';
    home.nodes=[node('monster-camp','camp',2600,1400,{name:dwarf?'Dwarven Camp':'Goblin Camp',campStrength:25,attackRequirement:dwarf?6:3,obstructionMaxRadius:600,...(dwarf?{lizardSettlement:'camp' as const,settlementMapTier:4}:{goblinSettlement:'camp' as const})}),
      node(dwarf?'mythril':'iron','deposit',rules===2?2600:800,rules===2?1400:700,{name:dwarf?'Mythril Deposit':'Iron Deposit',resourceItem:dwarf?'mythril':'iron',resourceRemaining:3000,resourceCapacity:3000,...(rules===2?{guardedCampId:'camp',guardedLocked:true}:{})}),
      node('extractor','extractor',rules===2?3350:1300,rules===2?1400:700,{name:'Extractor'}),
      node('chest','bot-supply',2000,1400,{name:'Bot supply',output:{'suppression-bot':40}})];
    if (rules === 2) Object.assign(home.nodes[1], guardedDepositPosition(home.nodes[0], home.nodes[1]));
  }else if(scenario==='Deep Holes'){
    home.nodes=[node('big-hole','hole-a',900,700,{name:'Deep Hole',obstructionRadius:240,resourceRemaining:1,holeBaseStone:300,holeStoneConsumed:299,holeOrigin:'generated'}),node('big-hole','hole-b',1800,700,{name:'Deep Hole',obstructionRadius:340,resourceRemaining:1,holeBaseStone:700,holeStoneConsumed:699,holeOrigin:'generated'})];
  }else if(scenario==='Lake'){
    home.nodes=[node('lake','lake',1200,1000,{name:'Lake',resourceItem:'water',cycleMs:1000,obstructionWidth:480,obstructionHeight:320}),...Array.from({length:4},(_,i)=>node('fluidLink',`intake-${i}`,2100,400+i*380,{name:`Lake Intake ${i+1}`}))];
  }else{
    state.sectors['0,0']=generateSector(0,0,state.seed,0,[],5,2,11,1,rules);state.sectors['0,0'].unlocked=true;state.sectors['0,0'].visited=true;state.activeSectorId='0,0';
  }
  return state;
}
