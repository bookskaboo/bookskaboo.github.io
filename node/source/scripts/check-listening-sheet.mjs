import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const out='outputs/action-sounds',html=await readFile(`${out}/listen-with-music.html`,'utf8');
class Element{
 listeners=new Map();volume=1;muted=false;paused=true;currentTime=0;ended=false;textContent='';src='';value='';checked=false;dataset={};
 addEventListener(name,fn){const list=this.listeners.get(name)??[];list.push(fn);this.listeners.set(name,list);}
 async fire(name){for(const fn of this.listeners.get(name)??[])await fn();}
 async play(){this.paused=false;for(const event of ['play','playing'])for(const fn of this.listeners.get(event)??[])fn();}
 pause(){if(this.paused)return;this.paused=true;for(const fn of this.listeners.get('pause')??[])fn();}
}
const contexts=[];
class AudioContext{
 currentTime=0;destination={};sources=[];decodes=0;closed=false;
 constructor(){contexts.push(this);}
 async resume(){if(this.resumePending)await this.resumePending;}
 async close(){this.closed=true;}
 createGain(){return {gain:{value:1,setValueAtTime(value){this.value=value;}},connect(){}};}
 async decodeAudioData(bytes){this.decodes++;const wav=Buffer.from(bytes);assert.equal(wav.toString('ascii',0,4),'RIFF');return {duration:(wav.length-44)/wav.readUInt32LE(28)};}
 createBufferSource(){const source={starts:[],stops:0,connect(){},disconnect(){},start(...args){this.starts.push(args);},stop(){this.stops++;this.onended?.();}};this.sources.push(source);return source;}
}
const ids=['player','status','volume','mute','level','music-progress','music-time','music-volume','music-toggle','music-status','music-level','reel','stop'];
const elements=Object.fromEntries(ids.map(id=>[id,new Element()])),reference=new Element();
elements.volume.value=html.match(/id="volume"[^>]*value="(\d+)"/)[1];elements['music-volume'].value=html.match(/id="music-volume"[^>]*value="(\d+)"/)[1];
const buttons=[...html.matchAll(/<button data-cue="([^"]+)"/g)].map(([,cue])=>{const button=new Element();button.dataset.cue=cue;return button;});
const listeners=new Map(),windowListeners=new Map(),timers=new Map();let timerId=0;
const document={hidden:false,getElementById:id=>elements[id],querySelector:()=>reference,querySelectorAll:selector=>selector==='[data-cue]'?buttons:[],addEventListener:(name,fn)=>listeners.set(name,fn)};
const context=vm.createContext({document,window:{addEventListener:(name,fn)=>windowListeners.set(name,fn)},AudioContext,atob,
 setInterval:fn=>{timers.set(++timerId,fn);return timerId;},clearInterval:id=>timers.delete(id)});
new vm.Script(html.match(/<script>([\s\S]*)<\/script>/)[1]).runInContext(context);
const music=new vm.Script('backgroundMusic').runInContext(context),player=elements.player;
assert.equal(music.volume,.15);assert.equal(player.volume,.3);assert.equal(reference.volume,.3);assert.ok(music.paused&&player.paused&&reference.paused);assert.equal(contexts.length,0);
assert.ok(!html.includes('autoplay'));
const musicData=JSON.parse(await readFile('outputs/music/quiet-workshop-ambient-strings/audio-data.json'));assert.equal(music.uri,musicData.uri);
assert.ok((await readFile(`${out}/factory-with-music.html`,'utf8')).includes(musicData.uri),'Music PCM must match the existing factory bundle');
await elements['music-toggle'].fire('click');assert.equal(music.paused,false);
const clock=contexts[0],source=clock.sources[0];assert.equal(source.loop,true);assert.equal(source.loopStart,0);assert.equal(source.loopEnd,60);assert.equal(clock.decodes,1);assert.equal(music.gain.gain.value,.15);
// Exercise multiple minute boundaries on the same running source, without stop/restart.
for(const seconds of [59.99,60.01,119.99,120.5]){clock.currentTime=seconds;for(const tick of timers.values())tick();assert.ok(Math.abs(music.currentTime-seconds%60)<1e-8);assert.equal(clock.sources.length,1);assert.equal(source.starts.length,1);assert.equal(source.stops,0);assert.equal(music.paused,false);}
assert.equal(elements['music-time'].textContent,'0:00 / 1:00');assert.equal(elements['music-progress'].value,.5);
clock.currentTime=143;
for(const id of ['select','move','complete']){await buttons.find(button=>button.dataset.cue===id).fire('click');assert.equal(music.paused,false);assert.equal(music.currentTime,23);}
await reference.play();assert.equal(player.paused,true);assert.equal(music.paused,false);
await elements.reel.fire('click');assert.equal(music.paused,false);
await elements.stop.fire('click');assert.ok(player.paused&&reference.paused);assert.equal(music.paused,false);assert.equal(music.currentTime,23);
elements.volume.value='37';await elements.volume.fire('input');assert.equal(player.volume,.37);assert.equal(music.volume,.15);
elements['music-volume'].value='7';await elements['music-volume'].fire('input');assert.equal(music.volume,.07);assert.equal(music.gain.gain.value,.07);assert.equal(player.volume,.37);
elements.mute.checked=true;await elements.mute.fire('change');assert.ok(player.muted&&reference.muted&&music.muted);assert.equal(music.gain.gain.value,0);assert.equal(music.paused,false);
elements.mute.checked=false;await elements.mute.fire('change');assert.ok(!player.muted&&!reference.muted&&!music.muted);assert.equal(music.gain.gain.value,.07);
await elements['music-toggle'].fire('click');assert.equal(music.paused,true);clock.currentTime=200;await elements['music-toggle'].fire('click');assert.equal(music.paused,false);assert.equal(music.currentTime,23);assert.equal(clock.decodes,1);assert.deepEqual(clock.sources[1].starts[0],[0,23]);
document.hidden=true;await listeners.get('visibilitychange')();assert.ok(player.paused&&reference.paused&&music.paused);assert.equal(music.currentTime,23);assert.equal(timers.size,0);
// A pending activation must not create a source after a hidden-page pause or disposal.
let release;clock.resumePending=new Promise(resolve=>{release=resolve;});const pending=music.play();music.pause();release();await pending;assert.equal(clock.sources.length,2);assert.equal(music.paused,true);
const disposing=music.play();await music.dispose();await disposing;assert.equal(clock.closed,true);assert.equal(clock.sources.length,2);
assert.equal(new Set(buttons.map(button=>button.dataset.cue)).size,20);
const report={date:'2026-11-22',technical:{passed:true,defaultMusicVolume:.15,defaultEffectsVolume:.3,numberedCues:19,comparisonCues:1,exactMusicUriEmbedded:true,musicSha256:musicData.sha256,musicMatchesExistingFactory:true,
 checks:['Actual generated script executes with Web Audio/media/DOM stubs','Initial silence with lazy context creation; music 15%, effects/reference 30%','One decoded 60-second buffer, loopStart 0 and loopEnd 60','Same source stays running across first and second minute boundaries without another start or stop','Progress display wraps with the audio clock','Individual cues, reference, reel and Stop sounds preserve background playback','Independent sliders and shared mute update actual gains','Pause/resume preserves offset without decoding again','Hidden page pauses players and removes progress timer','Pending activation cancels on pause/disposal','Nineteen cue buttons plus lower selection comparison']},limits:['Clock/lifecycle checks use Web Audio/DOM stubs; browser observations are recorded separately','No subjective hardware listening result, campaign audio integration or publication']};
await writeFile(`${out}/listening-music-verification.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.technical,null,2));
