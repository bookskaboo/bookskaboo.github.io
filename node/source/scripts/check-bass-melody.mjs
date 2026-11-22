import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {bassMelody,bassEvents} from '../previews/action-sounds/bass-melody.mjs';
import {celloMelody,celloEvents} from '../previews/action-sounds/cello-melody.mjs';
const soft=process.argv.includes('--soft'),lighter=soft||process.argv.includes('--lighter');
const cello=!process.argv.includes('--bass')&&(lighter||process.argv.includes('--cello'));
const melody=lighter?celloMelody:bassMelody,events=lighter?celloEvents:bassEvents;
const out=soft?`outputs/music/quiet-workshop-soft-${cello?'cello':'bass'}`:lighter?'outputs/music/quiet-workshop-cello-lighter':cello?'outputs/music/quiet-workshop-cello':'outputs/music/quiet-workshop';
const audioFile=soft?`quiet-workshop-soft-${cello?'cello':'bass'}-f-major-60s.wav`:lighter?'quiet-workshop-lighter-cello-f-major-60s.wav':cello?'quiet-workshop-cello-f-major-60s.wav':'quiet-workshop-f-major-60s.wav';
const read=async file=>JSON.parse(await readFile(`${out}/${file}`));
const bytes=await readFile(`${out}/${audioFile}`),manifest=await read('manifest.json');
assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.readUInt32LE(4),bytes.length-8);
assert.equal(bytes.readUInt16LE(20),1);assert.equal(bytes.readUInt16LE(22),2);assert.equal(bytes.readUInt16LE(34),16);assert.equal(bytes.readUInt32LE(24),44100);
assert.equal(bytes.length,44+60*44100*4);assert.equal(manifest.sha256,createHash('sha256').update(bytes).digest('hex'));
assert.equal(events.at(-1).beat+events.at(-1).beats,64);assert.equal(melody.tempo,64);
assert.ok(events.every(e=>[0,2,4,5,7,9,10].includes(e.midi%12)));assert.equal(events[0].note,lighter?'F3':'F2');assert.equal(events.at(-1).note,lighter?'F3':'F2');
let peak=0,sum=0,energy=0;const frames=60*44100,seams=[];
for(let c=0;c<2;c++){
 const steps=[];let maxStep=0,headEnergy=0,tailEnergy=0;
 for(let i=0;i<frames;i++){
  const v=bytes.readInt16LE(44+i*4+c*2)/32768;peak=Math.max(peak,Math.abs(v));sum+=v;energy+=v*v;
  if(i<4410)headEnergy+=v*v;if(i>=frames-4410)tailEnergy+=v*v;
  if(i){const step=Math.abs(v-bytes.readInt16LE(44+(i-1)*4+c*2)/32768);maxStep=Math.max(maxStep,step);if(i%29===0)steps.push(step);}
 }
 steps.sort((a,b)=>a-b);const p999=steps[Math.floor(steps.length*.999)];
 const seam=Math.abs(bytes.readInt16LE(44+c*2)-bytes.readInt16LE(44+(frames-1)*4+c*2))/32768;
 assert.ok(seam<=p999*1.5,`Boundary click candidate in channel ${c}`);
 assert.ok(headEnergy>1e-5&&tailEnergy>1e-5,'Loop must retain audible sound across boundary');
 const ratio=Math.sqrt(headEnergy/tailEnergy);assert.ok(ratio>.33&&ratio<3,'Large boundary level change');
 seams.push({channel:c,seamStep:seam,interiorP999Step:p999,interiorMaximumStep:maxStep,boundaryRmsRatio:ratio});
}
assert.ok(peak<10**(-12/20));assert.ok(Math.abs(sum/(frames*2))<1e-5);
const midi=await readFile(`${out}/quiet-workshop.mid`);assert.equal(midi.toString('ascii',0,4),'MThd');assert.equal(midi.readUInt16BE(12),480);
let tick=0,at=22,tempo,ons=0,offs=0,lastNoteOff=0;
const vlq=()=>{let v=0,b;do{b=midi[at++];v=(v<<7)|(b&127);}while(b&128);return v;};
while(at<midi.length){tick+=vlq();const status=midi[at++];if(status===0xff){const type=midi[at++],length=vlq();if(type===0x51)tempo=midi.readUIntBE(at,3);at+=length;}else if(status===0xc0){assert.equal(midi[at++],cello?42:43);}else{if(status===0x90)ons++;else if(status===0x80){offs++;lastNoteOff=tick;}else throw Error('Unexpected MIDI event');at+=2;}}
assert.equal(ons,events.length);assert.equal(offs,events.length);assert.equal(tempo,937500);assert.equal(lastNoteOff/480*tempo/1e6,60);
const seamPreview=await readFile(`${out}/loop-boundary-preview.wav`);
assert.deepEqual(seamPreview.subarray(44,44+6*176400),bytes.subarray(bytes.length-6*176400));
assert.deepEqual(seamPreview.subarray(44+6*176400),bytes.subarray(44,44+6*176400));
const files=[audioFile,'loop-boundary-preview.wav','quiet-workshop.mid','manifest.json','score.json','index.html','CREDITS.txt'];
const hashes=async()=>Promise.all(files.map(async file=>[file,createHash('sha256').update(await readFile(`${out}/${file}`)).digest('hex')]));
const before=await hashes();execFileSync(process.execPath,['scripts/build-bass-melody.mjs',...(soft?['--soft',...(cello?[]:['--bass'])]:lighter?['--lighter']:cello?['--cello']:[])],{stdio:'pipe'});assert.deepEqual(await hashes(),before);
const report={date:'2026-11-21',passed:true,durationSeconds:60,notes:events.length,key:'F major',tempo:64,
 checks:[`${cello?(lighter?'Six':'Four'):'Eight'} pinned CC0 source recording hashes`,'All melody pitches in F major','Exactly 64 beats / 60 seconds','Stereo 44.1 kHz / 16-bit PCM and file sizes','At least 12 dB peak headroom and negligible DC','Circular boundary steps within ordinary waveform changes','Audible energy on both sides of seam','Exact end/start PCM in 12-second join preview','MIDI note counts, tempo, instrument and 60-second timing','Byte-identical offline rerender of all seven deliverables'],
 measured:{peakDbfs:20*Math.log10(peak),rmsDbfs:10*Math.log10(energy/(frames*2)),dc:sum/(frames*2),seams},
 limits:['No subjective listener acceptance or hardware-audio/browser playback is claimed','No campaign music integration or publication']};
await writeFile(`${out}/verification.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
