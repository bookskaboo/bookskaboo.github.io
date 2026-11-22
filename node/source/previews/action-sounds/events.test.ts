import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSoundFactory } from './fixture';
import { soundSnapshot, changedSound } from './events';
import { getNodeSize } from '../../src/domain/nodeGeometry';

afterEach(() => vi.unstubAllGlobals());
describe('sound test factory event mapping', () => {
  it('constructs and runs without touching storage, and routine production stays silent', () => {
    const storage = {getItem: vi.fn(() => {throw Error('No storage');}), setItem: vi.fn(() => {throw Error('No storage');})};
    vi.stubGlobal('localStorage', storage);
    const engine = createSoundFactory(), before = soundSnapshot(engine.getState());
    for (let i=0;i<100;i++) engine.tick(100);
    expect(engine.getState().produced?.charcoal).toBeGreaterThan(0);
    expect(changedSound(before, soundSnapshot(engine.getState()))).toBeUndefined();
    expect(storage.getItem).not.toHaveBeenCalled(); expect(storage.setItem).not.toHaveBeenCalled();
  });
  it('sounds after valid placement, stays silent for an invalid attempt, and sounds once on committed movement', () => {
    const engine=createSoundFactory(); let before=soundSnapshot(engine.getState());
    const id=engine.placeNode('kiln',1900,600)!; expect(id).toBeTruthy();
    expect(changedSound(before,soundSnapshot(engine.getState()))).toBe('place');
    before=soundSnapshot(engine.getState()); expect(engine.placeNode('kiln',1900,600)).toBeUndefined();
    expect(changedSound(before,soundSnapshot(engine.getState()))).toBeUndefined();
    engine.beginMove(); expect(engine.tryMoveNodesTo({[id]:{x:1900,y:1100}})).toBe(true);engine.commitMove();
    expect(changedSound(before,soundSnapshot(engine.getState()))).toBe('move');
  });
  it('distinguishes disconnect, reconnect, rejected wiring and deletion that removes attached cables', () => {
    const engine=createSoundFactory(); let before=soundSnapshot(engine.getState());engine.deleteConnection('wood-route');
    expect(changedSound(before,soundSnapshot(engine.getState()))).toBe('disconnect');
    before=soundSnapshot(engine.getState());expect(engine.connect('wood-cart','test-kiln')).toBe(true);
    expect(changedSound(before,soundSnapshot(engine.getState()))).toBe('connect');
    before=soundSnapshot(engine.getState());expect(engine.connect('test-kiln','test-lab')).toBe(false);
    expect(changedSound(before,soundSnapshot(engine.getState()))).toBeUndefined();
    engine.deleteNodes(['test-kiln']);expect(changedSound(before,soundSnapshot(engine.getState()))).toBe('delete');
  });
  it('emits a single configuration cue and ignores choosing the same recipe', () => {
    const engine=createSoundFactory();let before=soundSnapshot(engine.getState());
    expect(engine.setRecipe('test-refiner','copper-wire')).toBe(true);
    expect(changedSound(before,soundSnapshot(engine.getState()))).toBe('configure');
    before=soundSnapshot(engine.getState());engine.setRecipe('test-refiner','copper-wire');
    expect(changedSound(before,soundSnapshot(engine.getState()))).toBeUndefined();
  });
  it('uses actual normal-speed Core payments for research and emits completion instead of queue changes', () => {
    const engine=createSoundFactory();let before=soundSnapshot(engine.getState());
    expect(engine.queueResearch('assembler')).toBe('added');
    expect(changedSound(before,soundSnapshot(engine.getState()))).toBe('queue');
    const heard: string[]=[];
    for(let i=0;i<260;i++){before=soundSnapshot(engine.getState());engine.tick(100);const cue=changedSound(before,soundSnapshot(engine.getState()));if(cue)heard.push(cue);}
    expect(engine.getState().research.completed).toContain('assembler');
    expect(engine.getSector().nodes.find(n=>n.id==='test-lab')!.input['simple-core']).toBe(5);
    expect(heard).toEqual(['complete']);
  });
  it('uses the upgrade cue in place of research completion for a real character upgrade', () => {
    const engine=createSoundFactory();engine.selectResearch('basicCore');const heard:string[]=[];
    for(let i=0;i<260;i++){const before=soundSnapshot(engine.getState());engine.tick(100);const cue=changedSound(before,soundSnapshot(engine.getState()));if(cue)heard.push(cue);}
    expect(engine.getState().research.completed).toContain('basicCore');expect(heard).toEqual(['upgrade']);
  });
  it('keeps activation separate from travel and silent on no-op navigation', () => {
    const engine=createSoundFactory();let before=soundSnapshot(engine.getState());
    expect(engine.unlockSector(6,5)).toBe(true);expect(changedSound(before,soundSnapshot(engine.getState()))).toBe('unlock');
    before=soundSnapshot(engine.getState());engine.switchSector('6,5');expect(changedSound(before,soundSnapshot(engine.getState()))).toBe('travel');
    before=soundSnapshot(engine.getState());engine.switchSector('6,5');expect(changedSound(before,soundSnapshot(engine.getState()))).toBeUndefined();
  });
  it('places fixture bodies clear of one another', () => {
    const nodes=createSoundFactory().getSector().nodes;
    for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
      const a=nodes[i],b=nodes[j],sa=getNodeSize(a),sb=getNodeSize(b);
      expect(Math.abs(a.x-b.x)>(sa.w+sb.w)/2||Math.abs(a.y-b.y)>(sa.h+sb.h)/2).toBe(true);
    }
  });
});
