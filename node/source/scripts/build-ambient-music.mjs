import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {ambientMusic as music} from '../previews/action-sounds/ambient-music.mjs';
import {midiNote} from '../previews/action-sounds/bass-melody.mjs';
import {decodePianoWav as decodeRecordedWav} from './piano-sampler.mjs';
const out='outputs/music/quiet-workshop-ambient-strings',rate=44100,frames=rate*60;
const pair=()=>[new Float64Array(frames),new Float64Array(frames)];
async function bank(directory){const source=JSON.parse(await readFile(`${directory}/source.json`)),notes=[];for(const sample of source.samples){const bytes=await readFile(`${directory}/${sample.file}`);assert.equal(createHash('sha256').update(bytes).digest('hex'),sample.sha256);const n=decodeRecordedWav(bytes);let energy=0,count=0;for(let i=Math.round(.8*n.rate);i<Math.round(2*n.rate);i++)for(const channel of n.channelData){energy+=channel[i]**2;count++;}notes.push({...n,file:sample.file,midi:midiNote(sample.sourceNote)+12,rms:Math.sqrt(energy/count)});}return {source,notes};}
const celloBank=await bank('previews/action-sounds/samples/cello-lighter'),bassBank=await bank('previews/action-sounds/samples/double-bass');
const cosine=t=>.5-.5*Math.cos(Math.PI*Math.max(0,Math.min(1,t))),events=[];
const transitionMetrics={};
function render(part,recordings,instrument,crossfade,maxShift){
 const data=pair(),coverage=new Float64Array(frames),regions=[];
 for(const [name,start,span,level=1]of part){const previous=regions.at(-1);if(previous?.name===name&&previous.level===level)previous.span+=span;else regions.push({name,start,span,level});}
 if(regions.length>1&&regions[0].name===regions.at(-1).name&&regions[0].level===regions.at(-1).level){regions.at(-1).span+=regions[0].span;regions.shift();}
 for(const {name,start,span,level}of regions){
  const midi=midiNote(name),note=recordings.notes.reduce((best,n)=>Math.abs(midi-n.midi)<Math.abs(midi-best.midi)?n:best),shift=midi-note.midi,ratio=2**(shift/12);
  assert.ok(Math.abs(shift)<=maxShift);
  // Repeat only a sustained body region. Crossfade the source loop itself so
  // long notes never expose a raw sample jump or restart the recorded attack.
  const loopStart=.85*note.rate,rootHz=440*2**((note.midi-69)/12),hop=Math.round(2.4*rootHz)*note.rate/rootHz,blend=.65*note.rate;
  assert.ok(loopStart+hop+blend+2<note.samples.length);
  const read=(position,c)=>{const at=Math.floor(position),fraction=position-at,source=note.channelData[c%note.channels];return ((1-fraction)*source[at]+fraction*source[at+1])/note.rms;};
  const first=Math.round((start-crossfade/2)*rate),length=Math.round((span+crossfade)*rate);
  for(let i=0;i<length;i++){
   const t=i/rate,incoming=Math.sin(Math.PI/2*Math.min(1,t/crossfade)),outgoing=t<span?1:Math.cos(Math.PI/2*Math.min(1,(t-span)/crossfade)),env=incoming*outgoing;
   const phase=(t*note.rate*ratio)%hop,weight=cosine(phase/blend),frame=((first+i)%frames+frames)%frames;
   coverage[frame]+=env*env;
   // Gentle bow swell within each sustained note; preserve natural recorded vibrato.
   const expression=instrument==='cello'?level*(.78+.22*Math.sin(Math.PI*t/(span+crossfade))**2):1;
   for(let c=0;c<2;c++){const current=read(loopStart+phase,c),value=phase<blend?(1-weight)*read(loopStart+hop+phase,c)+weight*current:current;data[c][frame]+=value*env*expression;}
  }
  events.push({instrument,note:name,midi,startSeconds:start,regionSeconds:span,crossfadeSeconds:crossfade,continuesAcrossFileBoundary:start+span>60,expression:instrument==='cello'?{peakGain:level,edgeGain:level*.78,curve:'Smooth sine-squared bow swell'}:undefined,source:note.file,repitchSemitones:shift,sustainLoop:{startSeconds:loopStart/note.rate,hopSeconds:hop/note.rate,blendSeconds:blend/note.rate}});
 }
 let minimum=Infinity,maximum=0;for(const value of coverage){minimum=Math.min(minimum,value);maximum=Math.max(maximum,value);}
 assert.ok(minimum>.99999&&maximum<1.00001,'Unexpected transition energy gap');
 transitionMetrics[instrument]={crossfadeSeconds:crossfade,regions:regions.length,minimumEnvelopePower:minimum,maximumEnvelopePower:maximum};
 return data;
}
const cello=render(music.cello,celloBank,'cello',1.2,2),bass=render(music.bass,bassBank,'bass',2.8,1);
function biquad(data,coefficients){const [b0,b1,b2,a1,a2]=coefficients;for(const channel of data){let x1=0,x2=0,y1=0,y2=0;for(let pass=0;pass<2;pass++)for(let i=0;i<frames;i++){const x=channel[i],y=b0*x+b1*x1+b2*x2-a1*y1-a2*y2;x2=x1;x1=x;y2=y1;y1=y;if(pass===1)channel[i]=y;}}}
function lowpass(data,cutoff){const w=2*Math.PI*cutoff/rate,c=Math.cos(w),al=Math.sin(w)/(2*Math.SQRT1_2),a0=1+al;biquad(data,[(1-c)/2/a0,(1-c)/a0,(1-c)/2/a0,-2*c/a0,(1-al)/a0]);}
const w=2*Math.PI*850/rate,A=10**(-3/40),al=Math.sin(w)/(2*.8),a0=1+al/A;biquad(cello,[(1+al*A)/a0,-2*Math.cos(w)/a0,(1-al*A)/a0,-2*Math.cos(w)/a0,(1-al/A)/a0]);
lowpass(cello,1200);lowpass(bass,600);
const rms=data=>Math.sqrt(data.reduce((sum,channel)=>{for(const v of channel)sum+=v*v;return sum;},0)/(frames*2));
const celloGain=10**(-33/20)/rms(cello),bassGain=10**(-45/20)/rms(bass),dry=pair();
for(let c=0;c<2;c++)for(let i=0;i<frames;i++)dry[c][i]=cello[c][i]*celloGain+bass[c][i]*bassGain;
const wet=pair(),taps=[[.107,.05],[.239,.045],[.397,.04],[.613,.035],[.887,.027],[1.193,.02],[1.561,.014],[1.967,.008]];
for(let c=0;c<2;c++)for(let i=0;i<frames;i++){let value=dry[c][i];for(const [delay,gain]of taps)value+=gain*dry[1-c][(i-Math.round((delay+c*.013)*rate)+frames)%frames];wet[c][i]=value;}
for(const channel of wet){let mean=0;for(const v of channel)mean+=v;mean/=frames;for(let i=0;i<frames;i++)channel[i]-=mean;}
let peak=0;for(const channel of wet)for(const v of channel)peak=Math.max(peak,Math.abs(v));const gain=Math.min(1,10**(-34.4/20)/rms(wet),10**(-18.1/20)/peak);
function wav(data){const b=Buffer.alloc(44+data[0].length*4);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(2,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*4,28);b.writeUInt16LE(4,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(b.length-44,40);for(let i=0;i<data[0].length;i++)for(let c=0;c<2;c++)b.writeInt16LE(Math.round(data[c][i]*gain*32767),44+i*4+c*2);return b;}
await mkdir(out,{recursive:true});const bytes=wav(wet);await writeFile(`${out}/quiet-workshop-ambient-strings-60s.wav`,bytes);await writeFile(`${out}/quiet-workshop-ambient-legato-60s.wav`,bytes);
const seam=wet.map(channel=>{const a=new Float64Array(12*rate);a.set(channel.subarray(frames-6*rate));a.set(channel.subarray(0,6*rate),6*rate);return a;});await writeFile(`${out}/loop-boundary-preview.wav`,wav(seam));
await writeFile(`${out}/score.json`,JSON.stringify({...music,events},null,2)+'\n');
const manifest={title:music.title,status:'Quiet ambient string-only audition; expressive cello revision awaits listening',key:music.key,tempo:music.tempo,bars:16,durationSeconds:60,celloNotes:music.cello.length,bassNotes:music.bass.length,format:'44.1 kHz / 16-bit stereo PCM',arrangement:'Four gentle cello phrases with sixteen varied-length notes, individual bow strength and soft swells over the unchanged twelve-position bass bed. Shorter cello blends reveal the melodic contour; merged F regions continue across the file boundary. Only bowed strings in the background; piano action cues remain separate.',transitions:transitionMetrics,mix:{celloStemRmsDbfs:-33,bassStemRmsDbfs:-45,finalGain:gain,peakDbfs:20*Math.log10(peak*gain),rmsDbfs:20*Math.log10(rms(wet)*gain)},loop:{frames,method:'Merged F regions continue through the file boundary; equal-power note handoffs, continuous bow swells, crossfaded source sustains, circular filters and room reflections',seamSteps:wet.map(c=>Math.abs(c[0]-c.at(-1))*gain)},sources:[celloBank.source,bassBank.source],sha256:createHash('sha256').update(bytes).digest('hex')};
await writeFile(`${out}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');
await writeFile(`${out}/audio-data.json`,JSON.stringify({title:music.title,durationSeconds:60,sha256:manifest.sha256,uri:'data:audio/wav;base64,'+bytes.toString('base64')})+'\n');
await writeFile(`${out}/CREDITS.txt`,`${music.title}: original string-only arrangement for NODE.\nCello: ${celloBank.source.library}. Bass: ${bassBank.source.library}.\nBoth by Versilian Studios / Sam Gossner, CC0 1.0.\n${bassBank.source.repository}\nPinned commit: ${bassBank.source.commit}\nSource sustains shaped, repitched at most two semitones for cello / one for bass, filtered and mixed with circular room reflections.\n`);
const roles=(await readFile('src/styles/readability.css','utf8')).match(/:root\s*\{[^}]+\}/)[0];
await writeFile(`${out}/index.html`,`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Quiet Workshop · Ambient Strings</title><style>${roles}body{margin:0;padding:32px;background:#151b20;color:#e3e6e2;font:var(--modal-reading-font)}main{max-width:780px;margin:auto}h1{font:var(--ui-title-font);color:#edd39b}.meta{font:var(--ui-meta-font)}audio{display:block;width:100%;margin:20px 0}p{line-height:1.55}a{color:#edd39b}label{font:var(--ui-control-font)}</style></head><body><main><h1>Quiet Workshop · Ambient Strings</h1><p class="meta">Bowed cello and double bass · F major · 64 BPM · 60 seconds</p><p>Continuously blended string tones, with space for the piano action cues. The factory can supply its own urgency.</p><audio id="music" controls loop preload="metadata" src="quiet-workshop-ambient-strings-60s.wav"></audio><label><input id="repeat" type="checkbox" checked> Repeat continuously</label><p class="meta">Starts at 15% volume. Adjust with the audio player’s volume control.</p><p><a href="quiet-workshop-ambient-strings-60s.wav" download>Download one-minute WAV</a> · <a href="score.json" download>Download editable score</a></p><p>Loop join: the last six seconds followed directly by the first six seconds.</p><audio controls preload="none" src="loop-boundary-preview.wav"></audio><p class="meta">Recorded cello section and solo contrabass: VSCO 2 Community Edition by Versilian Studios / Sam Gossner, CC0. <a href="CREDITS.txt">Source credits and modifications</a>. Listening draft; game integration remains pending.</p><script>document.getElementById('repeat').addEventListener('change',event=>{document.getElementById('music').loop=event.target.checked});for(const player of document.querySelectorAll('audio')){player.volume=.15;player.addEventListener('play',()=>{for(const other of document.querySelectorAll('audio'))if(other!==player)other.pause()});}</script></main></body></html>`);
await writeFile(`${out}/legato.html`,(await readFile(`${out}/index.html`,'utf8')).replaceAll('quiet-workshop-ambient-strings-60s.wav','quiet-workshop-ambient-legato-60s.wav'));
await writeFile(`${out}/low-volume.html`,await readFile(`${out}/legato.html`));
console.log(JSON.stringify({file:`${out}/quiet-workshop-ambient-strings-60s.wav`,...manifest.mix,seamSteps:manifest.loop.seamSteps}));
