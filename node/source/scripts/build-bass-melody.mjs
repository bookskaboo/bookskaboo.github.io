import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {decodePianoWav} from './piano-sampler.mjs';
import {bassMelody,bassEvents,midiNote} from '../previews/action-sounds/bass-melody.mjs';
import {celloMelody,celloEvents} from '../previews/action-sounds/cello-melody.mjs';
const soft=process.argv.includes('--soft'),lighter=soft||process.argv.includes('--lighter');
const cello=!process.argv.includes('--bass')&&(lighter||process.argv.includes('--cello'));
const melody=lighter?celloMelody:bassMelody,events=lighter?celloEvents:bassEvents;
const out=soft?`outputs/music/quiet-workshop-soft-${cello?'cello':'bass'}`:lighter?'outputs/music/quiet-workshop-cello-lighter':cello?'outputs/music/quiet-workshop-cello':'outputs/music/quiet-workshop';
const sampleDir=`previews/action-sounds/samples/${cello?(lighter?'cello-lighter':'cello'):'double-bass'}`;
const audioFile=soft?`quiet-workshop-soft-${cello?'cello':'bass'}-f-major-60s.wav`:lighter?'quiet-workshop-lighter-cello-f-major-60s.wav':cello?'quiet-workshop-cello-f-major-60s.wav':'quiet-workshop-f-major-60s.wav';
const title=soft?`Quiet Workshop · Soft ${cello?'Cello':'Bass'}`:lighter?melody.title:cello?'Quiet Workshop · Cello':melody.title;
const instrument=soft&&!cello?'Solo bowed double bass':cello?'Soft bowed cello section':melody.instrument;
const instrumentLabel=cello?'Bowed cello':'Bowed double bass';
const sourceLabel=cello?'soft bowed cello-section recordings':'soft solo contrabass recordings';
const midiProgram=cello?42:43,maxRepitch=cello?2:1;
const rate=44100,channels=2,frames=rate*60,beatSeconds=60/melody.tempo;
const source=JSON.parse(await readFile(`${sampleDir}/source.json`));
const bank=[];
for(const sample of source.samples){
 const bytes=await readFile(`${sampleDir}/${sample.file}`);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),sample.sha256);
 const decoded=decodePianoWav(bytes);
 // VSCO names middle C as C3: its C1 recording sounds C2 in scientific notation.
 const rootMidi=midiNote(sample.sourceNote)+12;
 let energy=0,count=0;
 for(let i=Math.round(.6*decoded.rate);i<Math.round(1.8*decoded.rate);i++)for(const channel of decoded.channelData){energy+=channel[i]**2;count++;}
 bank.push({...decoded,file:sample.file,rootMidi,rms:Math.sqrt(energy/count)});
}
assert.equal(melody.phrases.length,16);
assert.ok(melody.phrases.every(bar=>bar.reduce((n,[,beats])=>n+beats,0)===4));
assert.equal(64*beatSeconds,60);
const dry=[new Float64Array(frames),new Float64Array(frames)],renderEvents=[];
const cosine=t=>.5-.5*Math.cos(Math.PI*Math.max(0,Math.min(1,t)));
for(const event of events){
 const note=bank.reduce((best,n)=>Math.abs(event.midi-n.rootMidi)<Math.abs(event.midi-best.rootMidi)?n:best);
 const semitones=event.midi-note.rootMidi;assert.ok(Math.abs(semitones)<=maxRepitch);
 const ratio=2**(semitones/12),start=Math.round(event.beat*beatSeconds*rate);
 const hold=event.beats*beatSeconds-(soft?.03:lighter?.08:.04),release=soft?.42:lighter?.28:.38,length=Math.ceil((hold+release)*rate);
 const sourceOffset=soft?Math.round(.35*note.rate):0;
 assert.ok(sourceOffset+(length/rate)*note.rate*ratio+2<note.samples.length,'Source is too short');
 for(let i=0;i<length;i++){
  const t=i/rate,position=sourceOffset+t*note.rate*ratio,at=Math.floor(position),fraction=position-at;
  const envelope=cosine(t/(soft?.22:lighter?.1:.18))*(t<hold?1:1-cosine((t-hold)/release));
  const breath=.97+.03*Math.sin(Math.PI*Math.min(1,t/hold));
  for(let c=0;c<channels;c++){
   const recorded=note.channelData[c%note.channels];
   dry[c][(start+i)%frames]+=((1-fraction)*recorded[at]+fraction*recorded[at+1])/note.rms*.085*event.expression*envelope*breath;
  }
 }
 renderEvents.push({...event,startSeconds:event.beat*beatSeconds,holdSeconds:hold,sourceFile:note.file,rootMidi:note.rootMidi,repitchSemitones:semitones});
}
// Filter a full period to initialize state, then retain the next period. This
// avoids an artificial startup transient at the circular file boundary.
const alpha=1-Math.exp(-2*Math.PI*(lighter?3200:2300)/rate);
for(const channel of dry){let state=channel.at(-1);for(let pass=0;pass<2;pass++)for(let i=0;i<frames;i++){state+=alpha*(channel[i]-state);if(pass===1)channel[i]=state;}}
if(soft){
 // Run each EQ stage for a full period before retaining output, preserving the
 // circular filter state instead of introducing a startup edge at the join.
 const biquad=(coefficients)=>{const [b0,b1,b2,a1,a2]=coefficients;for(const channel of dry){let x1=0,x2=0,y1=0,y2=0;for(let pass=0;pass<2;pass++)for(let i=0;i<frames;i++){const x=channel[i],y=b0*x+b1*x1+b2*x2-a1*y1-a2*y2;x2=x1;x1=x;y2=y1;y1=y;if(pass===1)channel[i]=y;}}};
 const w=2*Math.PI*(cello?1100:900)/rate,A=10**((cello?-4:-2.5)/40),q=.8,al=Math.sin(w)/(2*q),a0=1+al/A;
 biquad([(1+al*A)/a0,-2*Math.cos(w)/a0,(1-al*A)/a0,-2*Math.cos(w)/a0,(1-al/A)/a0]);
 const cutoff=cello?1600:1800,wl=2*Math.PI*cutoff/rate,cl=Math.cos(wl),bl=Math.sin(wl)/(2*Math.SQRT1_2),norm=1+bl;
 biquad([(1-cl)/2/norm,(1-cl)/norm,(1-cl)/2/norm,-2*cl/norm,(1-bl)/norm]);
}
// Circular room reflections: the previous iteration's tail is present at t=0.
const wet=[new Float64Array(frames),new Float64Array(frames)];
const taps=[[.073,.055],[.113,.045],[.179,.038],[.263,.032],[.379,.027],[.541,.022],[.757,.017],[1.019,.012],[1.337,.008]];
for(let c=0;c<channels;c++)for(let i=0;i<frames;i++){
 let value=dry[c][i];for(const [seconds,gain]of taps){const delay=Math.round((seconds+c*.007)*rate);value+=gain*(soft?.9:lighter?.65:1)*dry[1-c][(i-delay+frames)%frames];}wet[c][i]=value;
}
for(const channel of wet){let sum=0;for(const v of channel)sum+=v;const mean=sum/frames;for(let i=0;i<frames;i++)channel[i]-=mean;}
let peak=0,energy=0;for(const channel of wet)for(const value of channel){peak=Math.max(peak,Math.abs(value));energy+=value**2;}
const rms=Math.sqrt(energy/frames/channels),gain=Math.min(10**((soft?-28:-24)/20)/rms,10**((soft?-14.1:cello?-12.1:-12)/20)/peak);
function wav(data){const bytes=Buffer.alloc(44+data[0].length*4);bytes.write('RIFF');bytes.writeUInt32LE(bytes.length-8,4);bytes.write('WAVEfmt ',8);bytes.writeUInt32LE(16,16);bytes.writeUInt16LE(1,20);bytes.writeUInt16LE(2,22);bytes.writeUInt32LE(rate,24);bytes.writeUInt32LE(rate*4,28);bytes.writeUInt16LE(4,32);bytes.writeUInt16LE(16,34);bytes.write('data',36);bytes.writeUInt32LE(bytes.length-44,40);for(let i=0;i<data[0].length;i++)for(let c=0;c<2;c++)bytes.writeInt16LE(Math.round(data[c][i]*gain*32767),44+i*4+c*2);return bytes;}
const bytes=wav(wet);
await mkdir(out,{recursive:true});await writeFile(`${out}/${audioFile}`,bytes);
// Listening evidence includes the actual 60s → 0s join, without a crossfade.
const seam=wet.map(channel=>{const data=new Float64Array(rate*12);data.set(channel.subarray(frames-rate*6));data.set(channel.subarray(0,rate*6),rate*6);return data;});
await writeFile(`${out}/loop-boundary-preview.wav`,wav(seam));
function vlq(value){let bytes=[value&127];while(value>>=7)bytes.unshift((value&127)|128);return bytes;}
const midiEvents=[{tick:0,order:0,data:[0xff,0x51,3,0x0e,0x4e,0x1c]}, // 937500 us = 64 BPM
 {tick:0,order:0,data:[0xff,0x58,4,4,2,24,8]},
 {tick:0,order:0,data:[0xff,0x59,2,0xff,0]},
 {tick:0,order:0,data:[0xc0,midiProgram]}];
for(const event of events){midiEvents.push({tick:Math.round(event.beat*480),order:1,data:[0x90,event.midi,Math.round(54*event.expression)]},{tick:Math.round((event.beat+event.beats)*480),order:0,data:[0x80,event.midi,0]});}
midiEvents.sort((a,b)=>a.tick-b.tick||a.order-b.order);let previous=0,track=[];
for(const event of midiEvents){track.push(...vlq(event.tick-previous),...event.data);previous=event.tick;}
track.push(0,0xff,0x2f,0);const header=Buffer.from([77,84,104,100,0,0,0,6,0,0,0,1,1,224]);const chunk=Buffer.alloc(8);chunk.write('MTrk');chunk.writeUInt32BE(track.length,4);
await writeFile(`${out}/quiet-workshop.mid`,Buffer.concat([header,chunk,Buffer.from(track)]));
await writeFile(`${out}/score.json`,JSON.stringify({...melody,...(soft?{title}:{}),instrument,events:renderEvents},null,2)+'\n');
const seamSteps=wet.map(channel=>Math.abs(channel[0]-channel.at(-1))*gain);
const manifest={title,status:'Author music draft; not integrated into game playback',key:melody.key,tempo:melody.tempo,bars:16,notes:events.length,durationSeconds:60,format:'44.1 kHz / 16-bit stereo PCM',source,
 arrangement:soft?'The flowing 57-note F-major melody on a softened bowed instrument, retaining F2–F3 and 64 BPM. Begin within the sustained source tone, use longer attack/release blends, reduce upper-mid resonance and roll off bright bow noise. No piano accompaniment.':lighter?'Original F-major cello variation with a higher F2–F3 register, rising major-triad figures, gentle passing notes and lighter bow envelopes/room reflections. No piano accompaniment.':cello?'Original monophonic melody played by soft sampled bowed cellos, gently shaped attacks/releases and light circular room reflections. Same pitches, tempo and note timing as the double-bass version. No piano accompaniment.':'Original monophonic melody; soft sampled bowed double bass, gently shaped attacks/releases, light circular room reflections. No piano accompaniment.',
 loop:{frames,method:'Wrap note releases and room reflections across the 60-second period; no fade to silence or appended tail',seamSteps},
 peakDbfs:20*Math.log10(peak*gain),rmsDbfs:20*Math.log10(rms*gain),sha256:createHash('sha256').update(bytes).digest('hex'),maximumRepitchSemitones:Math.max(...renderEvents.map(e=>Math.abs(e.repitchSemitones)))};
await writeFile(`${out}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');
const roles=(await readFile('src/styles/readability.css','utf8')).match(/:root\s*\{[^}]+\}/)[0];
await writeFile(`${out}/index.html`,`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${soft?title:lighter?'Quiet Workshop · lighter cello loop':cello?'Quiet Workshop · cello loop':'Quiet Workshop · double-bass loop'}</title><style>${roles}body{background:#151b20;color:#e3e6e2;font:var(--modal-reading-font);margin:0;padding:32px}main{max-width:780px;margin:auto}h1{font:var(--ui-title-font);color:#edd39b}p{line-height:1.55}a{color:#edd39b}audio{display:block;width:100%;margin:18px 0}label{font:var(--ui-control-font)}.meta{font:var(--ui-meta-font)}</style></head><body><main><h1>${title}</h1><p class="meta">${instrumentLabel} · F major · 64 BPM · 60 seconds</p><p>${soft?'A flowing melody with a gentler bowed tone.':lighter?'A gently flowing melody in a higher cello register.':"A slow melody for the factory's quieter opinions."} Music draft for listening alongside the F-major piano cues.</p><audio id="music" controls loop preload="metadata" src="${audioFile}"></audio><label><input id="repeat" type="checkbox" checked> Repeat continuously</label><p><a href="${audioFile}" download>Download one-minute WAV</a> · <a href="quiet-workshop.mid" download>Download MIDI</a></p><p>Check the join: the following excerpt plays the last six seconds followed directly by the first six seconds.</p><audio controls preload="none" src="loop-boundary-preview.wav"></audio><p class="meta">Original melody rendered with <a href="${source.repository}">VSCO 2 Community Edition</a> ${sourceLabel} by Versilian Studios / Sam Gossner, CC0. No campaign audio integration.</p><script>document.getElementById('repeat').addEventListener('change',event=>{document.getElementById('music').loop=event.target.checked;});</script></main></body></html>`);
await writeFile(`${out}/CREDITS.txt`,`Quiet Workshop: original melody composed for NODE.\nInstrument: ${source.library} by ${source.author}, CC0 1.0.\n${source.repository}\nPinned commit: ${source.commit}\nSource notes repitched by at most ${cello?'two semitones':'one semitone'}, shaped and mixed with circular room reflections.\n`);
console.log(JSON.stringify({file:`${out}/${audioFile}`,notes:manifest.notes,seconds:60,peakDbfs:manifest.peakDbfs,rmsDbfs:manifest.rmsDbfs,seamSteps}));
