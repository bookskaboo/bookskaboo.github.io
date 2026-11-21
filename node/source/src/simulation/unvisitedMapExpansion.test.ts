import { describe, expect, it } from 'vitest';
import { createInitialState, GameEngine } from './engine';
import { generateSector, getWorldFieldSize } from './worldGeneration';
import { expandMapsAroundCenter, redistributeUnvisitedMaps } from './unvisitedMapExpansion';
import { borderTerrainInsets, clearsBorderTerrain } from './borderTerrainClearance';
import { canPlaceNode } from './collisions';
import { getResearchProject } from '../content/research';
import { RESEARCH_CENTER_BASE_CYCLE_MS } from '../content/researchTiming';
import { tutorialNode } from '../tutorials/tutorialRuntime';
import { normalizeLegacy } from '../persistence/saves';
import { emptyMod } from '../mods/modTypes';
import { worldGridBounds } from '../domain/worldGrid';
import type { MachineNode } from '../domain/types';

const contents=(node:MachineNode)=>{const {x:_,y:__,...data}=node;return data;};

describe('unvisited fields spread after expansion',()=>{
  it.each([1,37,301])('spreads generated contents without rerolling them, preserving clear terrain for seed %i',seed=>{
    const engine=new GameEngine(createInitialState(seed),{autosave:false}),game=engine.getState();
    const visited=engine.ensureSector(6,5);visited.visited=true;game.sectors[visited.id]=visited;
    for(let y=0;y<11;y++)for(let x=0;x<11;x++){const sector=engine.ensureSector(x,y);game.sectors[sector.id]=sector;}
    const before=structuredClone(game), first={width:4500,height:3000};
    const changed=redistributeUnvisitedMaps(game,{width:3600,height:2400},first);
    expect(changed).toHaveLength(115);
    for(const id of changed){
      const old=before.sectors[id],sector=game.sectors[id];
      expect(sector.nodes.map(n=>n.id)).toEqual(old.nodes.map(n=>n.id));
      expect(sector.visited).toBe(old.visited);expect(sector.unlocked).toBe(old.unlocked);
      const insets=borderTerrainInsets(game,id,first);
      for(const node of sector.nodes){
        const previous=old.nodes.find(n=>n.id===node.id)!;
        expect(contents(node)).toEqual(contents(previous));
        const owner=old.nodes.find(n=>n.id===(previous.guardedCampId??previous.tributeCampId))??previous;
        expect(node.x).toBeCloseTo(previous.x+owner.x*.25);
        expect(node.y).toBeCloseTo(previous.y+owner.y*.25);
        expect(canPlaceNode(node,sector.nodes,first)).toBe(true);
        expect(clearsBorderTerrain(node,first,insets)).toBe(true);
      }
    }
    expect(game.sectors['5,5']).toEqual(before.sectors['5,5']);
    expect(game.sectors['6,5']).toEqual(before.sectors['6,5']);
    expect(game.mapTerrains).toEqual(before.mapTerrains);
    expect(redistributeUnvisitedMaps(game,first,{width:5400,height:3600})).toEqual(changed);
    expect(redistributeUnvisitedMaps(game,first,first)).toEqual([]);
  });

  it('preserves unusual unvisited factories and connected maps',()=>{
    const engine=new GameEngine(createInitialState(37),{autosave:false}),game=engine.getState();
    for(const [x,y]of [[6,5],[5,6],[4,5]]){const sector=engine.ensureSector(x,y);sector.unlocked=true;game.sectors[sector.id]=sector;}
    game.activeSectorId='4,5';
    game.sectors['6,5'].nodes.push(tutorialNode('woodenChest','existing-cart',800,600,{output:{wood:7}}));
    const sector=game.sectors['5,6'];sector.connections.push({id:'saved-cable',from:sector.nodes[0].id,to:sector.nodes[1].id,createdAt:0});
    const before=structuredClone(game);
    expect(redistributeUnvisitedMaps(game,{width:3600,height:2400},{width:4500,height:3000})).toEqual([]);
    expect(game).toEqual(before);
  });

  it('runs on actual research completion, keeps the incoming Road and is stable through reload',()=>{
    const engine=new GameEngine(createInitialState(37),{autosave:false}),game=engine.getState();
    const unseen=engine.ensureSector(6,5);unseen.unlocked=true;game.sectors[unseen.id]=unseen;
    const seen=engine.ensureSector(5,6);seen.unlocked=true;seen.visited=true;game.sectors[seen.id]=seen;
    game.research.completed=['road','basicCore','automataCore','hydroCore','shinyCore','complexCore','precisionControl'];
    game.research.queue=[];game.research.paused=false;
    const roadId=engine.placeNode('road',3590,1200)!,road=engine.getSector().nodes.find(n=>n.id===roadId)!;
    expect(roadId).toBeTruthy();
    const before=structuredClone(unseen),seenPositions=seen.nodes.map(n=>[n.id,n.x,n.y]);
    const lab=tutorialNode('researchCenter','expansion-lab',900,1800,{input:{...getResearchProject('areaExpansion1')!.costs}});
    engine.getSector().nodes.push(lab);engine.selectResearch('areaExpansion1');
    for(let elapsed=0;elapsed<10*RESEARCH_CENTER_BASE_CYCLE_MS+10000&&!game.research.completed.includes('areaExpansion1');elapsed+=1000)engine.tick(1000);
    expect(game.research.completed).toContain('areaExpansion1');
    for(const node of unseen.nodes.filter(n=>n.kind!=='road')){
      const old=before.nodes.find(n=>n.id===node.id)!;
      expect(node.x).toBeCloseTo(old.x*1.25);expect(node.y).toBeCloseTo(old.y*1.25);
      expect(node.resourceCapacity).toBe(old.resourceCapacity);
    }
    expect(unseen.visited).toBeFalsy();expect(seen.nodes.map(n=>[n.id,n.x,n.y])).toEqual(seenPositions.map(([id,x,y])=>[id,Number(x)+450,Number(y)+300]));
    expect(road.x).toBe(4432.5);expect(unseen.nodes.find(n=>n.id===road.pairedRoadId)?.x).toBe(67.5);
    const restored=new GameEngine(normalizeLegacy(structuredClone(game))!,{autosave:false});
    const snapshot=(nodes:MachineNode[])=>nodes.map(n=>[n.id,n.x,n.y,n.resourceRemaining,n.resourceCapacity,n.regenMs]);
    expect(snapshot(restored.getState().sectors[unseen.id].nodes)).toEqual(snapshot(unseen.nodes));
  });

  it('gives future generated resources the expanded field footprint and unchanged reserves',()=>{
    const small=generateSector(6,5,37,0,[]),large=generateSector(6,5,37,0,['areaExpansion1']);
    expect(large.nodes.map(n=>[n.kind,n.resourceCapacity])).toEqual(small.nodes.map(n=>[n.kind,n.resourceCapacity]));
    for(let i=0;i<small.nodes.length;i++){
      expect(large.nodes[i].x).toBeCloseTo(small.nodes[i].x*1.25);
      expect(large.nodes[i].y).toBeCloseTo(small.nodes[i].y*1.25);
    }
  });

  it('supports legacy worlds and wider modded fields without changing resource data',()=>{
    const engine=new GameEngine(createInitialState(37),{autosave:false});
    engine.applyMod({...emptyMod(),rules:{worldGridSize:21,mapWidthMultiplier:1.4,mapHeightMultiplier:1.1}});
    const game=engine.getState();delete game.mapTerrainVersion;delete game.mapTerrains;
    const {min,max}=worldGridBounds(21);expect(max-min+1).toBe(21);
    const sector=engine.ensureSector(6,5);game.sectors[sector.id]=sector;
    const field=getWorldFieldSize(game),before=structuredClone(sector.nodes);
    expect(redistributeUnvisitedMaps(game,field,{width:field.width*1.25,height:field.height*1.25})).toContain(sector.id);
    expect(sector.nodes.map(contents)).toEqual(before.map(contents));
    expect(game.mapTerrainVersion).toBeUndefined();
  });

  it('adds equal space on all sides without changing built layouts, views, stock or cable records',()=>{
    const engine=new GameEngine(createInitialState(37),{autosave:false}),game=engine.getState();
    const home=engine.getSector(),sector=engine.ensureSector(6,5);sector.unlocked=true;sector.visited=true;game.sectors[sector.id]=sector;
    const a=tutorialNode('woodenChest','built-cart',600,400,{output:{wood:7}}),b=tutorialNode('kiln','built-kiln',1100,400);
    sector.nodes.push(a,b);sector.connections.push({id:'built-cable',from:a.id,to:b.id,createdAt:0});
    sector.filledHoles=[{id:'filled',x:1400,y:800,radius:80,rotation:1}];
    home.camera={x:90,y:-150,zoom:.55};sector.camera={x:-120,y:40,zoom:.8};
    for(const [before,after]of [[{width:3600,height:2400},{width:4500,height:3000}],[{width:4500,height:3000},{width:5400,height:3600}]] as const){
      const old=structuredClone(game),dx=(after.width-before.width)/2,dy=(after.height-before.height)/2;
      expandMapsAroundCenter(game,before,after);
      for(const id of [home.id,sector.id]){
        const previous=old.sectors[id],next=game.sectors[id];
        expect(next.connections).toEqual(previous.connections);expect(next.camera.zoom).toBe(previous.camera.zoom);
        for(const node of next.nodes){
          const prior=previous.nodes.find(n=>n.id===node.id)!;
          expect(contents(node)).toEqual(contents(prior));
          expect(node.x-prior.x).toBeCloseTo(dx);expect(node.y-prior.y).toBeCloseTo(dy);
          // Same on-screen geometry, despite rebasing the field coordinate origin.
          expect(next.camera.x+node.x*next.camera.zoom).toBeCloseTo(previous.camera.x+prior.x*previous.camera.zoom);
          expect(next.camera.y+node.y*next.camera.zoom).toBeCloseTo(previous.camera.y+prior.y*previous.camera.zoom);
          expect(node.x-after.width/2).toBeCloseTo(prior.x-before.width/2);
          expect(node.y-after.height/2).toBeCloseTo(prior.y-before.height/2);
        }
      }
      expect(sector.filledHoles![0]).toEqual({...old.sectors[sector.id].filledHoles![0],x:old.sectors[sector.id].filledHoles![0].x+dx,y:old.sectors[sector.id].filledHoles![0].y+dy});
    }
  });

  it('keeps a built corner challenge and its cables unchanged through expansion, travel and reload',()=>{
    const engine=new GameEngine(createInitialState(37),{autosave:false}),game=engine.getState();
    const corner=engine.ensureSector(0,0);corner.unlocked=true;corner.visited=true;game.sectors[corner.id]=corner;
    const cart=tutorialNode('woodenChest','corner-supply',3100,2100);
    corner.nodes.push(cart);corner.connections.push({id:'corner-cable',from:cart.id,to:corner.nodes[1].id,createdAt:0});
    const before=structuredClone(corner);
    game.research.completed=['basicCore','automataCore','hydroCore','shinyCore','complexCore','precisionControl'];game.research.queue=[];
    engine.getSector().nodes.push(tutorialNode('researchCenter','corner-expansion-lab',900,1800,{input:{...getResearchProject('areaExpansion1')!.costs}}));
    engine.selectResearch('areaExpansion1');for(let t=0;t<60000&&!game.research.completed.includes('areaExpansion1');t+=1000)engine.tick(1000);
    expect(game.research.completed).toContain('areaExpansion1');
    const compare=(nodes:MachineNode[])=>nodes.map(n=>({id:n.id,x:n.x,y:n.y,w:n.obstructionWidth,h:n.obstructionHeight}));
    const expected=before.nodes.map(n=>({id:n.id,x:n.x+450,y:n.y+300,w:n.obstructionWidth,h:n.obstructionHeight}));
    expect(compare(corner.nodes)).toEqual(expected);expect(corner.connections).toEqual(before.connections);
    engine.switchSector(corner.id);expect(compare(corner.nodes)).toEqual(expected);
    const restored=new GameEngine(normalizeLegacy(structuredClone(game))!,{autosave:false});
    expect(compare(restored.getSector().nodes)).toEqual(expected);expect(restored.getSector().connections).toEqual(before.connections);
  });

  it('does not redistribute an unvisited reserve onto the final incoming Road footprint',()=>{
    const engine=new GameEngine(createInitialState(37),{autosave:false}),game=engine.getState();
    const unseen=engine.ensureSector(6,5);unseen.unlocked=true;unseen.visited=false;game.sectors[unseen.id]=unseen;
    const reserve=tutorialNode('stoneDeposit','road-clear-stone',210,360,{resourceItem:'stone',resourceRemaining:300,resourceCapacity:300});
    unseen.nodes=[reserve];game.research.completed.push('road');game.research.unlocked.push('road');
    const roadId=engine.placeNode('road',3590,150)!;expect(roadId).toBeTruthy();
    expect(canPlaceNode(reserve,unseen.nodes,{width:3600,height:2400})).toBe(true);
    const stock=contents(reserve);game.research.completed.push('areaExpansion1');
    expect(expandMapsAroundCenter(game,{width:3600,height:2400},{width:4500,height:3000})).not.toContain(unseen.id);
    const restored=new GameEngine(game,{autosave:false}),current=restored.getState().sectors[unseen.id];
    expect(reserve.x).toBe(660);expect(reserve.y).toBe(660);
    expect(canPlaceNode(reserve,unseen.nodes,getWorldFieldSize(game))).toBe(true);
    expect(contents(reserve)).toMatchObject(stock);
    expect(unseen.visited).toBe(false);
    const road=current.nodes.find(n=>n.kind==='road')!;expect([road.x,road.y]).toEqual([67.5,450]);
    expect(canPlaceNode(current.nodes.find(n=>n.id===reserve.id)!,current.nodes,getWorldFieldSize(restored.getState()))).toBe(true);
  });
});
