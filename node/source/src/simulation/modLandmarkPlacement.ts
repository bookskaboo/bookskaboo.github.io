import type { GameState, MachineNode, SectorState } from '../domain/types';
import { canPlaceGeneratedNode, borderTerrainInsets } from './borderTerrainClearance';
import { connectionBlockedByWorld } from './connectionRules';

/** Applying a world-spawn mod still generates its natural contents normally. */
export function addLandmarkToModSector(state: GameState, sector: SectorState, original: MachineNode, field:{width:number;height:number}) {
  const node=structuredClone(original);
  node.x+=(field.width-3600)/2;node.y+=(field.height-2400)/2;
  const insets=borderTerrainInsets(state,sector.id,field);
  const valid=()=>canPlaceGeneratedNode(node,sector.nodes,field,insets);
  let source:MachineNode|undefined;
  if(node.landmark==='tri') {
    const eligible=sector.nodes.filter(n=>n.resourceItem&&['wood','stone','iron','copper'].includes(n.resourceItem)&&!n.guardedCampId&&!n.infiniteResource&&n.kind!=='lake');
    for(const reserve of eligible) {
      for(const [dx,dy]of [[360,0],[-360,0],[0,360],[0,-360]]) {
        node.x=reserve.x+dx;node.y=reserve.y+dy;
        if(valid()&&!connectionBlockedByWorld(reserve,node,{fromPort:0,toPort:0},sector.nodes)){source=reserve;break;}
      }
      if(source)break;
    }
  }
  if(!source&&!valid()) {
    let fit=false;
    search:for(let y=220;y<field.height-220;y+=96)for(let x=240;x<field.width-240;x+=96){node.x=x;node.y=y;if(valid()){fit=true;break search;}}
    if(!fit)throw new Error(`No clear landmark position in modded sector ${sector.id}`);
  }
  sector.nodes.push(node);
  if(source){node.resourceItem=source.resourceItem;sector.connections.push({id:`landmark-source-${sector.id}`,from:source.id,to:node.id,fromPort:0,toPort:0,item:source.resourceItem,createdAt:0});}
}
