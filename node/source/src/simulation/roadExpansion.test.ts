import { describe, expect, it } from 'vitest';
import { getResearchProject } from '../content/research';
import { RESEARCH_CENTER_BASE_CYCLE_MS } from '../content/researchTiming';
import { GameEngine } from './engine';
import { getWorldFieldSize } from './worldGeneration';
import { connectionBlockedByWorld } from './connectionRules';
import { tutorialNode } from '../tutorials/tutorialRuntime';
import { createRoadWorkshop } from '../../previews/road-workshop/fixture';

function completeExpansion(engine: GameEngine, project: 'areaExpansion1'|'areaExpansion2') {
  const game=engine.getState();game.paused=false;game.research.paused=false;game.research.queue=[];
  const lab=tutorialNode('researchCenter','expansion-lab',1000,1800,{input:{...getResearchProject(project)!.costs}});
  engine.getSector().nodes.push(lab);engine.selectResearch(project);
  expect(game.research.selected).toBe(project);
  const budget=Math.max(...Object.values(getResearchProject(project)!.costs).map(n=>n??0))*RESEARCH_CENTER_BASE_CYCLE_MS+10000;
  for(let elapsed=0;elapsed<budget&&!game.research.completed.includes(project);elapsed+=1000)engine.tick(1000);
  expect(game.research.completed).toContain(project);
  engine.getSector().nodes=engine.getSector().nodes.filter(n=>n!==lab);
}

describe('Road pairs follow Area Expansion',()=>{
  it.each([false,true])('moves every pair through both completed expansions with reversed flow %s',reversed=>{
    const engine=createRoadWorkshop(),game=engine.getState();
    game.research.completed=['road','roadChannels1','roadChannels2','basicCore','automataCore','hydroCore','shinyCore','complexCore','precisionControl'];
    const home=engine.getSector(), records=home.nodes.map(road=>{
      if(reversed)engine.reverseRoad(road.id);
      const neighbor=game.sectors[road.pairedSectorId!],pair=neighbor.nodes.find(n=>n.id===road.pairedRoadId)!;
      neighbor.visited=false;
      const localCart=tutorialNode('woodenChest','local-'+road.id,road.x/2,road.y/2);
      const remoteCart=tutorialNode('woodenChest','remote-'+road.id,900,900);
      home.nodes.push(localCart);neighbor.nodes.push(remoteCart);
      home.connections.push({id:'local-cable-'+road.id,from:road.roadMode==='export'?localCart.id:road.id,to:road.roadMode==='export'?road.id:localCart.id,fromPort:0,toPort:0,createdAt:0});
      neighbor.connections.push({id:'remote-cable-'+road.id,from:pair.roadMode==='export'?remoteCart.id:pair.id,to:pair.roadMode==='export'?pair.id:remoteCart.id,fromPort:0,toPort:0,createdAt:0});
      return {road,pair,neighbor,mode:road.roadMode,pairMode:pair.roadMode,dx:neighbor.x-home.x,dy:neighbor.y-home.y,parallel:neighbor.x!==home.x?road.y:road.x};
    });
    const connections=structuredClone(Object.fromEntries(Object.values(game.sectors).map(s=>[s.id,s.connections])));
    for(const project of ['areaExpansion1','areaExpansion2'] as const){
      completeExpansion(engine,project);const field=getWorldFieldSize(game);
      expect(field).toEqual(project==='areaExpansion1'?{width:4500,height:3000}:{width:5400,height:3600});
      for(const {road,pair,neighbor,mode,pairMode,dx,dy,parallel}of records){
        expect(road.pairedRoadId).toBe(pair.id);expect(pair.pairedRoadId).toBe(road.id);
        expect(road.pairedSectorId).toBe(neighbor.id);expect(pair.pairedSectorId).toBe(home.id);
        expect([road.roadMode,pair.roadMode]).toEqual([mode,pairMode]);
        expect(neighbor.visited).toBe(false);
        const centeredParallel=parallel+(dx?field.height-2400:field.width-3600)/2;
        if(dx){expect(road.x).toBe(dx>0?field.width-67.5:67.5);expect(pair.x).toBe(dx>0?67.5:field.width-67.5);expect([road.y,pair.y]).toEqual([centeredParallel,centeredParallel]);}
        else {expect(road.y).toBe(dy>0?field.height-67.5:67.5);expect(pair.y).toBe(dy>0?67.5:field.height-67.5);expect([road.x,pair.x]).toEqual([centeredParallel,centeredParallel]);}
      }
      for(const [id,cables]of Object.entries(connections))expect(game.sectors[id].connections).toEqual(cables);
    }
  });

  it('keeps pair and cable IDs when automatic reanchoring fails ordinary placement checks',()=>{
    const engine=createRoadWorkshop(),game=engine.getState(),home=engine.getSector();
    game.research.completed=['road','basicCore','automataCore','hydroCore','shinyCore','complexCore','precisionControl'];
    const road=home.nodes.find(n=>n.pairedSectorId==='6,5')!,remote=game.sectors['6,5'],pair=remote.nodes.find(n=>n.id===road.pairedRoadId)!;
    const cart=tutorialNode('woodenChest','connected-cart',2000,600);
    const futureBlocker=tutorialNode('lake','future-endpoint-blocker',3982.5,1200,{obstructionWidth:300,obstructionHeight:300});
    home.nodes.push(cart,futureBlocker);
    home.connections.push({id:'retained-cable',from:cart.id,to:road.id,fromPort:0,toPort:0,createdAt:0});
    expect(connectionBlockedByWorld(cart,road,{fromPort:0,toPort:0},home.nodes)).toBe(false);
    completeExpansion(engine,'areaExpansion1');
    expect(road.x).toBe(4432.5);expect(pair.x).toBe(67.5);
    expect(connectionBlockedByWorld(cart,road,{fromPort:0,toPort:0},home.nodes)).toBe(true);
    expect(home.connections).toContainEqual({id:'retained-cable',from:cart.id,to:road.id,fromPort:0,toPort:0,createdAt:0});
    expect(road.pairedRoadId).toBe(pair.id);expect(pair.pairedRoadId).toBe(road.id);
    expect(engine.getRoadMovePreview(road.id,road)?.valid).toBe(false);
    const restored=new GameEngine(structuredClone(game),{autosave:false});
    expect(restored.getSector().nodes.find(n=>n.id===road.id)?.x).toBe(4432.5);
    expect(restored.getSector().connections).toEqual(home.connections);
  });

  it('repairs an expanded saved pair still at the old border without changing cargo or cables',()=>{
    const engine=createRoadWorkshop(),game=engine.getState(),home=engine.getSector();
    const road=home.nodes.find(n=>n.pairedSectorId==='6,5')!,remote=game.sectors['6,5'],pair=remote.nodes.find(n=>n.id===road.pairedRoadId)!;
    const cart=tutorialNode('woodenChest','stocked-cart',2800,1200,{output:{wood:12}});
    home.nodes.push(cart,tutorialNode('woodenChest','future-position-occupied',5332.5,1200));
    home.connections.push({id:'saved-cable',from:cart.id,to:road.id,createdAt:0});
    game.research.completed.push('areaExpansion1','areaExpansion2');
    const restored=new GameEngine(structuredClone(game),{autosave:false}),state=restored.getState();
    expect(restored.getSector().nodes.find(n=>n.id===road.id)?.x).toBe(5332.5);
    expect(state.sectors['6,5'].nodes.find(n=>n.id===pair.id)?.pairedRoadId).toBe(road.id);
    expect(restored.getSector().connections).toEqual(home.connections);
    expect(restored.getSector().nodes.find(n=>n.id===cart.id)?.output).toEqual({wood:12});
  });
});
