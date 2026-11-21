import { expect, it } from 'vitest';
import { createRoadWorkshop } from '../../previews/road-workshop/fixture';
import { cameraViewport } from '../domain/camera';
import { getNodeSize } from '../domain/nodeGeometry';

const viewport={width:1280,height:720,top:115};
it.each(['north','east','south','west'] as const)('keeps zoom and focuses the paired %s Road on arrival and return', direction=>{
  const engine=createRoadWorkshop(), home=engine.getSector(), game=engine.getState();
  const delta={north:[0,-1],east:[1,0],south:[0,1],west:[-1,0]}[direction];
  const road=home.nodes.find(n=>{const target=game.sectors[n.pairedSectorId!];return target.x-home.x===delta[0]&&target.y-home.y===delta[1];})!;
  const target=game.sectors[road.pairedSectorId!], pair=target.nodes.find(n=>n.id===road.pairedRoadId)!;
  const before=structuredClone([road,pair]);
  target.visited=false;target.camera={x:10000,y:-10000,zoom:2};
  engine.setCamera({x:-100,y:-200,zoom:.8});
  const sourceCamera={...home.camera};
  expect(engine.travelThroughRoad(road.id,viewport)).toBe(pair.id);
  expect(engine.getSector().id).toBe(target.id);
  expect(target.visited).toBe(true);
  expect(target.camera.zoom).toBe(.8);
  expect(home.camera).toEqual(sourceCamera);
  const usable=cameraViewport(viewport), size=getNodeSize(pair);
  const x=target.camera.x+pair.x*target.camera.zoom,y=target.camera.y+pair.y*target.camera.zoom;
  expect(x-size.w*.8/2).toBeGreaterThanOrEqual(usable.x);
  expect(x+size.w*.8/2).toBeLessThanOrEqual(usable.x+usable.width);
  expect(y-size.h*.8/2).toBeGreaterThanOrEqual(usable.y);
  expect(y+size.h*.8/2).toBeLessThanOrEqual(usable.y+usable.height);
  expect(Math.abs(x-(usable.x+usable.width/2))).toBeLessThan(usable.width*.35);
  expect(Math.abs(y-(usable.y+usable.height/2))).toBeLessThan(usable.height*.35);
  engine.setCamera({...target.camera,zoom:1.2});
  expect(engine.travelThroughRoad(pair.id,viewport)).toBe(road.id);
  expect(home.camera.zoom).toBe(1.2);
  expect([road,pair]).toEqual(before);
});

it('retains the wider workshop zoom when focusing a Road',()=>{
  const engine=createRoadWorkshop(),road=engine.getSector().nodes[0];
  engine.setCamera({x:70,y:190,zoom:.18});
  engine.travelThroughRoad(road.id,viewport,{width:7200,height:4800});
  expect(engine.getSector().camera.zoom).toBe(.18);
});

it('does not travel or change cameras when a Road pair is invalid',()=>{
  const engine=createRoadWorkshop(), road=engine.getSector().nodes[0];
  engine.getState().sectors[road.pairedSectorId!].nodes=[];
  const before=structuredClone(engine.getState());
  expect(engine.travelThroughRoad(road.id,viewport)).toBeUndefined();
  expect(engine.getState()).toEqual(before);
});
