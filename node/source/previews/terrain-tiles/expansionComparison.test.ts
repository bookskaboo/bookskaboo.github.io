import { expect,it } from 'vitest';
import { expansionComparison } from './expansionComparison';

it.each([1,2]as const)('compares centered built and unexplored snapshots around actual Area Expansion %i completion',level=>{
  const data=expansionComparison(level),scale=data.after.built.field.width/data.before.built.field.width;
  const dx=(data.after.built.field.width-data.before.built.field.width)/2,dy=(data.after.built.field.height-data.before.built.field.height)/2;
  expect(data.before.built.visited).toBe(true);expect(data.after.unexplored.visited).toBe(false);
  expect(data.before.built.cables).toHaveLength(3);
  expect(data.after.built.cables.map(c=>[c.id,c.from,c.to])).toEqual(data.before.built.cables.map(c=>[c.id,c.from,c.to]));
  for(const cable of data.before.built.cables){
    const next=data.after.built.cables.find(c=>c.id===cable.id)!;
    const touchesRoad=[cable.from,cable.to].some(id=>data.before.built.nodes.find(n=>n.id===id)?.kind==='road');
    const unchanged=(['start','end','first','second']as const).every(key=>Math.abs(next[key].x-cable[key].x-dx)<1e-6&&Math.abs(next[key].y-cable[key].y-dy)<1e-6);
    expect(unchanged).toBe(!touchesRoad);
  }
  expect(data.after.built.camera.zoom).toBe(data.before.built.camera.zoom);
  for(const key of ['built','unexplored']as const){
    expect(data.after[key].field).toEqual(level===1?{width:4500,height:3000}:{width:5400,height:3600});
    expect(data.after[key].nodes.map(n=>[n.id,n.kind,n.stock,n.cap])).toEqual(data.before[key].nodes.map(n=>[n.id,n.kind,n.stock,n.cap]));
    for(const node of data.after[key].nodes.filter(n=>n.kind!=='road')){
      const old=data.before[key].nodes.find(n=>n.id===node.id)!;
      expect(node.x).toBeCloseTo(key==='built'?old.x+dx:old.x*scale);
      expect(node.y).toBeCloseTo(key==='built'?old.y+dy:old.y*scale);
      if(key==='built'){
        expect(node.x-data.after.built.field.width/2).toBeCloseTo(old.x-data.before.built.field.width/2);
        expect(node.y-data.after.built.field.height/2).toBeCloseTo(old.y-data.before.built.field.height/2);
        expect(node.x*data.after.built.camera.zoom+data.after.built.camera.x).toBeCloseTo(old.x*data.before.built.camera.zoom+data.before.built.camera.x);
        expect(node.y*data.after.built.camera.zoom+data.after.built.camera.y).toBeCloseTo(old.y*data.before.built.camera.zoom+data.before.built.camera.y);
      }
    }
  }
});
