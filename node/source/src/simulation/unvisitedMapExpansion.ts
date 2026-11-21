import { hasNodeBehavior, isResourceBehavior, isWorldObstacle } from '../content/nodeCapabilities';
import { HOME_SECTOR_ID } from '../domain/worldGrid';
import type { GameState, MachineNode } from '../domain/types';
import { borderTerrainInsets, canPlaceGeneratedNode } from './borderTerrainClearance';
import { roadPairLayoutForField } from './roadPlacement';

type Field = {width:number;height:number};

/** Rebase the old field into the center of the new positive-coordinate field.
 * Built layouts move as one rigid coordinate frame, so only border Roads and
 * their incident cable curves change relative to the factory or its camera.
 */
export function expandMapsAroundCenter(state: GameState, before: Field, after: Field) {
  if(before.width<=0 || before.height<=0 || after.width<before.width || after.height<before.height
    || after.width===before.width && after.height===before.height)return [];
  const redistributed=new Set(redistributeUnvisitedMaps(state,before,after));
  const dx=(after.width-before.width)/2,dy=(after.height-before.height)/2;
  const translate=(node:{x:number;y:number})=>{node.x+=dx;node.y+=dy;};
  for(const sector of Object.values(state.sectors)){
    // Redistributed natural positions already use the new field's center.
    // Roads always retain their old parallel position relative to the factory.
    for(const node of sector.nodes)if(!redistributed.has(sector.id)||hasNodeBehavior(node.kind,'road'))translate(node);
    if(!redistributed.has(sector.id))for(const patch of sector.filledHoles??[])translate(patch);
    for(const archive of [sector.deferredPower,sector.retiredMythril])for(const node of archive?.nodes??[])translate(node);
    sector.camera.x-=dx*sector.camera.zoom;
    sector.camera.y-=dy*sector.camera.zoom;
  }
  return [...redistributed];
}

/** Keep generated groups intact while spreading their centers across a larger field. */
export function redistributeUnvisitedMaps(state: GameState, before: Field, after: Field) {
  const changed: string[]=[];
  if(before.width<=0 || before.height<=0 || after.width<before.width || after.height<before.height
    || after.width===before.width && after.height===before.height)return changed;
  const sx=after.width/before.width, sy=after.height/before.height;
  for(const sector of Object.values(state.sectors)){
    if(sector.id===HOME_SECTOR_ID || sector.id===state.activeSectorId || sector.visited || sector.connections.length)continue;
    // Corner challenges have their own authored field-relative layout.
    if(sector.nodes.some(node=>node.kind==='cornerChallenge'))continue;
    const byId=new Map(sector.nodes.map(node=>[node.id,node]));
    const natural=(node:MachineNode)=>isResourceBehavior(node.kind)||isWorldObstacle(node.kind)
      || node.kind==='resourceGolem'||node.kind==='sortingStation'||node.kind==='abandonedFabricator'
      || Boolean(node.tributeCampId && byId.has(node.tributeCampId));
    // Unusual/legacy saves may contain a factory without a visit flag. Preserve it.
    if(sector.nodes.some(node=>!natural(node)&&!hasNodeBehavior(node.kind,'road')))continue;
    const proposals=sector.nodes.filter(node=>natural(node)&&!['cornerChallenge','cornerTribute'].includes(node.kind)).map(node=>{
      const owner=byId.get(node.guardedCampId??node.tributeCampId??'')??node;
      return {...node,x:node.x+owner.x*(sx-1),y:node.y+owner.y*(sy-1)};
    });
    if(!proposals.length)continue;
    const insets=borderTerrainInsets(state,sector.id,after);
    // Reserve the same endpoint geometry that the engine will align afterwards.
    const roads=sector.nodes.filter(node=>hasNodeBehavior(node.kind,'road')).map(node=>{
      const point={...node,x:node.x+(after.width-before.width)/2,y:node.y+(after.height-before.height)/2};
      return roadPairLayoutForField(state,sector,node,point,after)?.node??point;
    });
    const placements=[...proposals,...roads];
    if(proposals.some(node=>!canPlaceGeneratedNode(node,placements,after,insets)))continue;
    for(const node of proposals){const original=byId.get(node.id)!;original.x=node.x;original.y=node.y;}
    for(const patch of sector.filledHoles??[]){patch.x*=sx;patch.y*=sy;}
    changed.push(sector.id);
  }
  return changed;
}
