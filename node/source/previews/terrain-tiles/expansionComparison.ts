import { GameEngine, createInitialState } from '../../src/simulation/engine';
import { getWorldFieldSize } from '../../src/simulation/worldGeneration';
import { getResearchProject } from '../../src/content/research';
import { RESEARCH_CENTER_BASE_CYCLE_MS } from '../../src/content/researchTiming';
import { getNodeSize, getPortAnchor } from '../../src/domain/nodeGeometry';
import { getConnectionControlPoints, getPortSide } from '../../src/simulation/connectionRules';
import { tutorialNode } from '../../src/tutorials/tutorialRuntime';
import type { GameState } from '../../src/domain/types';

function snapshot(game:GameState,id:string){
  const sector=game.sectors[id],byId=new Map(sector.nodes.map(n=>[n.id,n]));
  return {id,visited:Boolean(sector.visited),field:getWorldFieldSize(game),camera:{...sector.camera},
    nodes:sector.nodes.map(n=>({id:n.id,kind:n.kind,name:n.name,x:n.x,y:n.y,...getNodeSize(n),stock:n.resourceRemaining,cap:n.resourceCapacity})),
    cables:sector.connections.map(c=>{const from=byId.get(c.from)!,to=byId.get(c.to)!;
      const a=getPortAnchor(from,'output',c.fromPort??0),b=getPortAnchor(to,'input',c.toPort??0);
      const start={x:from.x+a.x,y:from.y+a.y},end={x:to.x+b.x,y:to.y+b.y};
      return {id:c.id,from:c.from,to:c.to,start,end,...getConnectionControlPoints(start,end,getPortSide(from,'output',c.fromPort??0),getPortSide(to,'input',c.toPort??0))};}),
  };
}

/** Actual generated snapshots around one normally completed research project; no storage. */
export function expansionComparison(level:1|2=1){
  const engine=new GameEngine(createInitialState(37),{autosave:false}),game=engine.getState();
  const built=engine.ensureSector(6,5),unseen=engine.ensureSector(7,5);
  built.unlocked=true;built.visited=true;unseen.unlocked=true;unseen.visited=false;
  game.sectors[built.id]=built;game.sectors[unseen.id]=unseen;
  game.research.completed=['road','kiln','basicCore','automataCore','hydroCore','shinyCore','complexCore','precisionControl'];
  game.research.unlocked.push('road','kiln');game.research.queue=[];game.research.paused=false;
  engine.switchSector(built.id);
  const first=engine.placeNode('woodenChest',600,350),kiln=engine.placeNode('kiln',1100,350),last=engine.placeNode('woodenChest',1600,350),road=engine.placeNode('road',3590,350);
  if(!first||!kiln||!last||!road)throw new Error(`Comparison factory did not fit: ${JSON.stringify({first,kiln,last,road})}; ${engine.getNodePlacementError('road',3590,350)}; ${engine.getNodePlacementError('kiln',1100,350)}`);
  engine.setRecipe(kiln,'charcoal');
  if(!engine.connect(first,kiln)||!engine.connect(kiln,last)||!engine.connect(last,road))throw new Error('Comparison factory could not be wired.');
  for(const sector of [built,unseen])for(const node of sector.nodes)node.constructionMs=0;
  let before={built:snapshot(game,built.id),unexplored:snapshot(game,unseen.id)};
  engine.switchSector('5,5');
  for(const project of (level===1?['areaExpansion1']:['areaExpansion1','areaExpansion2'])as Array<'areaExpansion1'|'areaExpansion2'>){
    if(project==='areaExpansion2')before={built:snapshot(game,built.id),unexplored:snapshot(game,unseen.id)};
    const lab=tutorialNode('researchCenter',`comparison-lab-${project}`,900,1800,{input:{...getResearchProject(project)!.costs}});
    engine.getSector().nodes.push(lab);engine.selectResearch(project);
    const budget=Math.max(...Object.values(getResearchProject(project)!.costs).map(n=>n??0))*RESEARCH_CENTER_BASE_CYCLE_MS+10000;
    for(let elapsed=0;elapsed<budget&&!game.research.completed.includes(project);elapsed+=1000)engine.tick(1000);
    if(!game.research.completed.includes(project))throw new Error('Comparison expansion did not complete.');
    engine.getSector().nodes=engine.getSector().nodes.filter(n=>n.id!==lab.id);
  }
  return {seed:37,project:`Area Expansion ${level}`,before,after:{built:snapshot(game,built.id),unexplored:snapshot(game,unseen.id)}};
}

