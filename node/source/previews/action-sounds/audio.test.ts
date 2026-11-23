import {afterEach,expect,it,vi} from 'vitest';
vi.mock('../../outputs/action-sounds/audio-data.json',()=>({default:{select:'data:audio/wav;base64,AQID',complete:'data:audio/wav;base64,AQID'}}));
vi.mock('../../outputs/music/quiet-workshop-ambient-strings/audio-data.json',()=>({default:{uri:'data:audio/wav;base64,AQID',durationSeconds:60}}));
import {PreviewAudio} from './audio';

class Source {
  buffer?: {duration:number}; loop=false;loopStart=0;loopEnd=0;onended?:()=>void;
  connect=vi.fn();disconnect=vi.fn();start=vi.fn();
  stop=vi.fn(()=>this.onended?.());
}
class Context {
  static latest:Context;
  currentTime=10;destination={};sources:Source[]=[];
  gains:Array<{gain:{setValueAtTime:ReturnType<typeof vi.fn>};connect:ReturnType<typeof vi.fn>}>=[];
  resume=vi.fn(async()=>{});suspend=vi.fn(async()=>{});close=vi.fn(async()=>{});
  decodeAudioData=vi.fn(async()=>({duration:60}));
  constructor(){Context.latest=this;}
  createGain(){const gain={gain:{setValueAtTime:vi.fn()},connect:vi.fn()};this.gains.push(gain);return gain;}
  createBufferSource(){const source=new Source();this.sources.push(source);return source;}
}
const mixers:PreviewAudio[]=[];
function setup(){vi.stubGlobal('AudioContext',Context);vi.stubGlobal('document',{hidden:false});const audio=new PreviewAudio();mixers.push(audio);return audio;}
afterEach(async()=>{await Promise.all(mixers.splice(0).map(audio=>audio.dispose()));vi.unstubAllGlobals();});

it('starts one full-minute background loop at 15% only after explicit enable',async()=>{
 const audio=setup();expect(audio.enabled).toBe(false);expect(audio.musicVolume).toBe(.15);
 await audio.enable();const ctx=Context.latest,music=ctx.sources[0];
 expect(ctx.sources).toHaveLength(1);expect(music.loop).toBe(true);expect(music.loopEnd).toBe(60);
 expect(ctx.gains[0].gain.setValueAtTime).toHaveBeenLastCalledWith(.3,10);
 expect(ctx.gains[1].gain.setValueAtTime).toHaveBeenLastCalledWith(.15,10);
 await audio.enable();expect(ctx.sources).toHaveLength(1);expect(ctx.decodeAudioData).toHaveBeenCalledTimes(3);
 expect(audio.play('select')).toBe(true);expect(ctx.sources[1].loop).toBe(false);
 expect(audio.play('complete')).toBe(true);expect(music.stop).not.toHaveBeenCalled();
});
it('separates effects and music level, mutes both, and lets music turn off independently',async()=>{
 const audio=setup();await audio.enable();const ctx=Context.latest,music=ctx.sources[0];
 audio.volume=.2;audio.musicVolume=.08;audio.update();
 expect(ctx.gains[0].gain.setValueAtTime).toHaveBeenLastCalledWith(.2,10);expect(ctx.gains[1].gain.setValueAtTime).toHaveBeenLastCalledWith(.08,10);
 audio.muted=true;audio.update();for(const gain of ctx.gains)expect(gain.gain.setValueAtTime).toHaveBeenLastCalledWith(0,10);
 audio.muted=false;audio.music=false;audio.update();expect(music.stop).toHaveBeenCalledTimes(1);
 expect(audio.play('select')).toBe(true);audio.music=true;audio.update();expect(ctx.sources.at(-1)?.loop).toBe(true);
});
it('honors a music opt-out before enable and disposes the music source with the context',async()=>{
 const audio=setup();audio.music=false;await audio.enable();const ctx=Context.latest;
 expect(ctx.sources).toHaveLength(0);audio.music=true;audio.update();const music=ctx.sources[0];
 await audio.dispose();expect(music.stop).toHaveBeenCalledTimes(1);expect(ctx.close).toHaveBeenCalledTimes(1);
 mixers.splice(mixers.indexOf(audio),1);
});
it('suspends the shared clock while hidden and resumes the same loop without restarting it',async()=>{
 const audio=setup();await audio.enable();const ctx=Context.latest,music=ctx.sources[0];
 audio.play('select');await audio.setHidden(true);expect(ctx.suspend).toHaveBeenCalledTimes(1);
 expect(ctx.sources[1].stop).toHaveBeenCalledTimes(1);expect(music.stop).not.toHaveBeenCalled();
 await audio.setHidden(false);expect(ctx.resume).toHaveBeenCalled();expect(ctx.sources).toHaveLength(2);expect(music.start).toHaveBeenCalledTimes(1);
});
