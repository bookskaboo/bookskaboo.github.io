import type { GameState, MachineNode, NodeKind, SectorState } from '../domain/types';
import { landmarkName } from '../content/landmarks';
import { getNodeCapabilities } from '../content/nodeCapabilities';
import { sectorDistance, sectorForState, getWorldFieldSize, BASE_WORLD_SIZE } from './worldGeneration';
import { canPlaceGeneratedNode, borderTerrainInsets } from './borderTerrainClearance';
import { connectionBlockedByWorld } from './connectionRules';
import { worldGridSize } from '../domain/worldGrid';

function randomFor(seed: number) { let n=seed^0x4c414e44; return ()=>{n+=0x6d2b79f5;let t=Math.imul(n^(n>>>15),1|n);t^=t+Math.imul(t^(t>>>7),61|t);return((t^(t>>>14))>>>0)/4294967296;}; }
function shuffle<T>(values: readonly T[], random:()=>number) {const result=[...values];for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
type Slot = {type:NonNullable<MachineNode['landmark']>;kind:NodeKind;min:number;max:number;early?:boolean};

/** Independent RNG and saved natural layouts protect existing geography and discovery order. */
export function initializeLandmarks(state: GameState) {
  state.landmarkVersion=0;delete state.landmarkLayout;
  if (state.isTraining || worldGridSize(state)!==11) {state.landmarkVersion=0;delete state.landmarkLayout;return;}
  const random=randomFor(state.seed);
  const rapid=shuffle<NodeKind>(['refiner','smelter','smelter','assembler','advancedAssembler'],random);
  const doubler=shuffle<NodeKind>(['refiner','assembler','advancedAssembler'],random);
  const slots:Slot[]=[{type:'rapid',kind:'refiner',min:1,max:1,early:true},{type:'unknown',kind:'refiner',min:8,max:8}];
  for(const [min,max,rs,ts,ds,reclaimer] of [[1,2,0,1,0,0],[3,4,2,2,1,0],[5,6,1,2,1,1],[7,9,2,1,1,0]]) {
    for(let i=0;i<rs;i++)slots.push({type:'rapid',kind:rapid.shift()!,min,max});
    for(let i=0;i<ts;i++)slots.push({type:'tri',kind:'extractor',min,max});
    for(let i=0;i<ds;i++)slots.push({type:'doubler',kind:doubler.shift()!,min,max});
    if(reclaimer)slots.push({type:'reclaimer',kind:'recycler',min,max});
  }
  const coordinates=Array.from({length:121},(_,i)=>({x:i%11,y:Math.floor(i/11)}));
  const used:Array<{x:number;y:number}>=[];
  const counts=[0,0,0,0];
  const quadrant=(x:number,y:number)=>(x<5?0:1)+(y<5?0:2);
  const layout:NonNullable<GameState['landmarkLayout']>=[];
  for(const slot of slots) {
    const candidates=shuffle(coordinates.filter(c=>sectorDistance(c.x,c.y)>=slot.min&&sectorDistance(c.x,c.y)<=slot.max&&!used.some(p=>p.x===c.x&&p.y===c.y)),random);
    candidates.sort((a,b)=>{
      const score=(c:typeof a)=>counts[quadrant(c.x,c.y)]*4+used.filter(p=>Math.abs(p.x-c.x)+Math.abs(p.y-c.y)===1).length;
      return score(a)-score(b);
    });
    let chosen:SectorState|undefined;
    for(const c of candidates) {
      const sector=sectorForState(state,c.x,c.y);
      sector.lastSimulatedAt=0;
      if(slot.early&&sector.nodes.some(n=>getNodeCapabilities(n.kind).worldObstacle||['sortingStation','resourceGolem','abandonedFabricator'].includes(n.kind)))continue;
      const machine:MachineNode={id:`landmark-${sector.id}`,kind:slot.kind,landmark:slot.type,name:'',x:0,y:0,rotation:0,input:{},output:{},progressMs:0,cycleMs:slot.type==='unknown'||slot.type==='tri'?5000:0,constructedAt:0,constructionMs:0,triOutput:slot.type==='tri'?[0,0,0]:undefined};
      machine.name=landmarkName(machine);
      const insets=borderTerrainInsets(state,sector.id,{width:BASE_WORLD_SIZE.width*1.5,height:BASE_WORLD_SIZE.height*1.5});
      const field=getWorldFieldSize(state);
      const valid=()=>canPlaceGeneratedNode(machine,sector.nodes,field,insets)&&!sector.nodes.some(n=>n.kind==='resourceGolem'&&Math.hypot(n.x-machine.x,n.y-machine.y)<1000);
      let source:MachineNode|undefined;
      if(slot.type==='tri') {
        sources:for(const reserve of shuffle(sector.nodes.filter(n=>n.resourceItem&&['wood','stone','iron','copper'].includes(n.resourceItem)&&!n.guardedCampId&&!n.infiniteResource&&n.kind!=='lake'),random)) {
          for(const [dx,dy]of [[360,0],[-360,0],[0,360],[0,-360],[440,0],[-440,0]]) {
            machine.x=reserve.x+dx;machine.y=reserve.y+dy;machine.resourceItem=reserve.resourceItem;
            if(valid()&&!connectionBlockedByWorld(reserve,machine,{fromPort:0,toPort:0},sector.nodes)){source=reserve;break sources;}
          }
        }
        if(!source)continue;
      } else {
        let found=false;
        for(let attempt=0;attempt<400&&!found;attempt++) {machine.x=240+random()*(field.width-480);machine.y=220+random()*(field.height-440);found=valid();}
        if(!found)continue;
      }
      sector.nodes.push(machine);
      if(source)sector.connections.push({id:`landmark-source-${sector.id}`,from:source.id,to:machine.id,fromPort:0,toPort:0,item:source.resourceItem,createdAt:0});
      chosen=sector;break;
    }
    if(!chosen)throw new Error(`Cannot place ${slot.type} landmark for seed ${state.seed}, tiers ${slot.min}-${slot.max}`);
    used.push({x:chosen.x,y:chosen.y});counts[quadrant(chosen.x,chosen.y)]++;
    layout.push({sector:chosen,nodeId:`landmark-${chosen.id}`});
  }
  state.landmarkVersion=1;
  state.landmarkLayout=layout;
}
