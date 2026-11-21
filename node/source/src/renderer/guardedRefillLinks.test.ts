import { Container, Text } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { tutorialNode } from '../tutorials/tutorialRuntime';
import { createInitialState, GameEngine } from '../simulation/engine';
import { guardedRefillReceipt, regenerateGuardedResources } from '../simulation/guardedResources';
import { guardedDepositPosition } from '../domain/nodeGeometry';
import { GuardedRefillLinks, guardedRefillEndpoints } from './guardedRefillLinks';

function fixture(dwarven = true) {
  const state = createInitialState(37), sector = state.sectors[state.activeSectorId];
  const camp = tutorialNode('monster-camp','camp',1800,1200,{campStrength:10,suppressed:true,obstructionMaxRadius:600,
    ...(dwarven?{lizardSettlement:'camp' as const,settlementMapTier:4}:{goblinSettlement:'kingdom' as const})});
  const deposit = tutorialNode(dwarven?'mythril':'iron','deposit',0,0,{resourceItem:dwarven?'mythril':'iron',
    resourceCapacity:3000,resourceRemaining:2900,guardedCampId:camp.id,guardedLocked:false});
  Object.assign(deposit,guardedDepositPosition(camp,deposit));
  sector.nodes = [camp,deposit]; sector.connections = [];
  const layer = new Container(), links = new GuardedRefillLinks(layer);
  links.sync(sector);
  const options = {paused:false,particles:true,reducedMotion:false};
  links.update(0,options);
  return {state,sector,camp,deposit,layer,links,options};
}

describe('automatic guarded reserve feed',()=>{
  it('adds non-interactive ports and a link only while suppressed, without player cables',()=>{
    const f=fixture(); expect(f.layer.children).toHaveLength(1); expect(f.layer.eventMode).toBe('none');
    expect(f.layer.interactiveChildren).toBe(false);
    const engine=new GameEngine(f.state,{autosave:false});
    expect(engine.connectPorts('camp',0,'deposit',0)).toBe(false);
    engine.getSector().nodes.push(tutorialNode('chest','supply',100,100,{output:{mythril:2}}));
    expect(engine.connectPorts('supply',0,'deposit',0)).toBe(false);
    expect(engine.getSector().connections).toHaveLength(0);
    engine.getSector().nodes.push(tutorialNode('chest','bots',100,300,{output:{'suppression-bot':5}}));
    expect(engine.connectPorts('bots',0,'camp',1)).toBe(false);
    expect(engine.connectPorts('bots',0,'camp',0)).toBe(true);
    expect(engine.getSector().connections).toHaveLength(1);
    f.camp.suppressed=false;f.camp.campStrength=20;f.links.sync(f.sector);
    expect(f.layer.children).toHaveLength(0);
    f.camp.suppressed=true;f.camp.campStrength=10;f.links.sync(f.sector);
    expect(f.layer.children).toHaveLength(1);expect(f.sector.connections).toHaveLength(0);
    f.links.clear();f.layer.destroy();
  });

  it.each([true,false])('animates actual awarded batches, freezes on pause and stops at capacity (Dwarven=%s)',dwarven=>{
    const f=fixture(dwarven), packet=()=>f.layer.children[0].getChildByLabel('refill-packet')!;
    regenerateGuardedResources(f.state,f.sector,4999);f.links.update(100,f.options);
    expect(packet().visible).toBe(false);expect(guardedRefillReceipt(f.deposit)).toBeUndefined();
    regenerateGuardedResources(f.state,f.sector,1);f.links.update(200,f.options);
    const amount=dwarven?1:36;
    expect(f.deposit.resourceRemaining).toBe(2900+amount);expect(guardedRefillReceipt(f.deposit)?.amount).toBe(amount);
    expect(packet().children.find(child=>child instanceof Text)?.text).toBe(amount>1?'×36':'');
    f.links.update(650,f.options);const halfway=packet().x;
    expect(packet().visible).toBe(true);expect(halfway).toBeGreaterThan(0);
    expect(halfway).toBeLessThan(guardedRefillEndpoints(f.camp,f.deposit).end.x-guardedRefillEndpoints(f.camp,f.deposit).start.x);
    f.links.update(1200,{...f.options,paused:true});expect(packet().x).toBe(halfway);
    f.links.update(1800,f.options);expect(packet().visible).toBe(false);
    f.deposit.resourceRemaining=2999;regenerateGuardedResources(f.state,f.sector,5000);
    expect(guardedRefillReceipt(f.deposit)?.amount).toBe(1);
    const last=guardedRefillReceipt(f.deposit);regenerateGuardedResources(f.state,f.sector,5000);
    expect(f.deposit.resourceRemaining).toBe(3000);expect(guardedRefillReceipt(f.deposit)).toBe(last);
    f.links.clear();f.layer.destroy();
  });

  it('uses upgraded fractional awards without replaying old events after suppression loss or reload',()=>{
    const f=fixture();f.state.research.completed.push('mineralRegeneration2');
    f.state.research.repeatableCompletions!.mineralRegenerationRate=1;
    f.state.research.repeatableCompletions!.resourceRegeneration=1;
    regenerateGuardedResources(f.state,f.sector,5000);expect(guardedRefillReceipt(f.deposit)?.amount).toBe(4);
    regenerateGuardedResources(f.state,f.sector,5000);expect(guardedRefillReceipt(f.deposit)?.amount).toBe(5);
    f.camp.suppressed=false;f.camp.campStrength=20;f.links.sync(f.sector);
    const receipt=guardedRefillReceipt(f.deposit);regenerateGuardedResources(f.state,f.sector,10000);
    expect(guardedRefillReceipt(f.deposit)).toBe(receipt);expect(f.deposit.resourceRemaining).toBe(2909);
    f.camp.suppressed=true;f.camp.campStrength=10;f.links.sync(f.sector);f.links.update(100,f.options);
    expect(f.layer.children[0].getChildByLabel('refill-packet')?.visible).toBe(false);
    const restored=structuredClone(f.sector);f.links.sync(restored);f.links.update(200,f.options);
    expect(guardedRefillReceipt(restored.nodes[1])).toBeUndefined();
    expect(f.layer.children[0].getChildByLabel('refill-packet')?.visible).toBe(false);
    f.links.clear();f.layer.destroy();
  });

  it('honors particle/reduced-motion preferences and follows paired drag positions',()=>{
    const f=fixture();regenerateGuardedResources(f.state,f.sector,5000);
    f.links.update(100,{...f.options,reducedMotion:true});
    expect(f.layer.children[0].getChildByLabel('refill-packet')?.visible).toBe(false);
    regenerateGuardedResources(f.state,f.sector,5000);f.links.update(200,{...f.options,particles:false});
    f.links.update(300,f.options);expect(f.layer.children[0].getChildByLabel('refill-packet')?.visible).toBe(false);
    f.links.update(400,{...f.options,positions:{camp:{x:2000,y:1400},deposit:{x:f.deposit.x+200,y:1400}}});
    expect(f.layer.children[0].position).toMatchObject({x:2064,y:1400});
    f.links.clear();f.layer.destroy();
  });
});
