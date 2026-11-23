import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const out='outputs/music/quiet-workshop-ambient-strings';
const manifest=JSON.parse(await readFile(`${out}/manifest.json`)),score=JSON.parse(await readFile(`${out}/score.json`));
const bytes=await readFile(`${out}/quiet-workshop-ambient-strings-60s.wav`),rate=44100,frames=60*rate;
const embedded=JSON.parse(await readFile(`${out}/audio-data.json`));assert.equal(embedded.uri,'data:audio/wav;base64,'+bytes.toString('base64'));assert.equal(embedded.sha256,manifest.sha256);assert.equal(embedded.durationSeconds,60);
assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.readUInt32LE(4),bytes.length-8);assert.equal(bytes.readUInt16LE(20),1);assert.equal(bytes.readUInt16LE(22),2);assert.equal(bytes.readUInt32LE(24),rate);assert.equal(bytes.readUInt16LE(34),16);assert.equal(bytes.length,44+frames*4);
assert.equal(manifest.sha256,createHash('sha256').update(bytes).digest('hex'));
assert.equal(score.cello.length,16);assert.equal(score.bass.length,12);assert.equal(score.tempo,64);assert.equal(score.bars,16);assert.equal(score.piano,undefined);
assert.equal(score.cello.reduce((sum,note)=>sum+note[2],0),60);assert.ok(new Set(score.cello.map(note=>note[2])).size>=3);
const celloEvents=score.events.filter(event=>event.instrument==='cello'),steps=celloEvents.slice(1).map((event,index)=>event.midi-celloEvents[index].midi);
assert.ok(steps.some(step=>step>0)&&steps.some(step=>step<0));assert.ok(new Set(celloEvents.map(event=>event.midi%12)).size>=6);
assert.ok(celloEvents.every(event=>event.expression.edgeGain>0&&event.expression.edgeGain<event.expression.peakGain&&event.expression.peakGain<=1));
assert.ok(new Set(celloEvents.map(event=>event.expression.peakGain)).size>=4);assert.equal(manifest.transitions.cello.crossfadeSeconds,1.2);
assert.ok(score.events.every(e=>['cello','bass'].includes(e.instrument)));assert.ok(manifest.sources.every(s=>s.license==='CC0-1.0'&&!/piano/i.test(s.library)));
assert.equal(score.bass[0][0],'F2');assert.equal(score.bass.at(-1)[0],'F2');
assert.ok(score.events.every(e=>[0,2,4,5,7,9,10].includes(e.midi%12)&&e.startSeconds>=0&&e.startSeconds<60));
assert.equal(manifest.mix.celloStemRmsDbfs-manifest.mix.bassStemRmsDbfs,12);
for(const instrument of ['cello','bass']){
 assert.ok(manifest.transitions[instrument].minimumEnvelopePower>.99999);
 assert.ok(manifest.transitions[instrument].maximumEnvelopePower<1.00001);
 assert.ok(score.events.some(e=>e.instrument===instrument&&e.continuesAcrossFileBoundary&&e.note.startsWith('F')));
 assert.ok(score.events.filter(e=>e.instrument===instrument).every(e=>e.sustainLoop.blendSeconds>.5));
}
let peak=0,energy=0,sum=0;const seams=[];
for(let c=0;c<2;c++){const steps=[];let head=0,tail=0;for(let i=0;i<frames;i++){const v=bytes.readInt16LE(44+i*4+c*2)/32768;peak=Math.max(peak,Math.abs(v));energy+=v*v;sum+=v;if(i<4410)head+=v*v;if(i>=frames-4410)tail+=v*v;if(i&&i%29===0)steps.push(Math.abs(v-bytes.readInt16LE(44+(i-1)*4+c*2)/32768));}steps.sort((a,b)=>a-b);const step=Math.abs(bytes.readInt16LE(44+c*2)-bytes.readInt16LE(44+(frames-1)*4+c*2))/32768,p999=steps[Math.floor(steps.length*.999)];assert.ok(step<p999*1.5);assert.ok(head>1e-8&&tail>1e-8);seams.push({channel:c,seamStep:step,interiorP999Step:p999,headRms:Math.sqrt(head/4410),tailRms:Math.sqrt(tail/4410)});}
assert.ok(20*Math.log10(peak)<-18);assert.ok(Math.abs(sum/(frames*2))<1e-5);
const excerpt=await readFile(`${out}/loop-boundary-preview.wav`);assert.deepEqual(excerpt.subarray(44,44+6*176400),bytes.subarray(bytes.length-6*176400));assert.deepEqual(excerpt.subarray(44+6*176400),bytes.subarray(44,44+6*176400));
const html=await readFile(`${out}/index.html`,'utf8');new vm.Script(html.match(/<script>([\s\S]*)<\/script>/)[1]);assert.ok(!html.includes('autoplay'));assert.ok(html.includes('controls loop'));assert.ok(html.includes('CC0'));
assert.deepEqual(await readFile(`${out}/quiet-workshop-ambient-legato-60s.wav`),bytes);
assert.ok((await readFile(`${out}/legato.html`,'utf8')).includes('quiet-workshop-ambient-legato-60s.wav'));
for(const page of ['index.html','legato.html','low-volume.html']){
 const players=Array.from({length:2},()=>({volume:1,addEventListener(){},pause(){}}));
 const document={getElementById:id=>id==='music'?players[0]:{addEventListener(){}},querySelectorAll:()=>players};
 const source=(await readFile(`${out}/${page}`,'utf8')).match(/<script>([\s\S]*)<\/script>/)[1];
 new vm.Script(source).runInNewContext({document});assert.deepEqual(players.map(player=>player.volume),[.15,.15]);
}
const files=['quiet-workshop-ambient-strings-60s.wav','quiet-workshop-ambient-legato-60s.wav','loop-boundary-preview.wav','score.json','manifest.json','audio-data.json','index.html','legato.html','low-volume.html','CREDITS.txt'];
const hashes=async()=>Object.fromEntries(await Promise.all(files.map(async file=>[file,createHash('sha256').update(await readFile(`${out}/${file}`)).digest('hex')])));
const before=await hashes();execFileSync(process.execPath,['scripts/build-ambient-music.mjs'],{stdio:'pipe'});assert.deepEqual(await hashes(),before);
const report={date:'2026-11-22',passed:true,durationSeconds:60,celloPositions:16,bassPositions:12,key:'F major',transitions:manifest.transitions,
 checks:['Pinned recorded cello and bass source hashes checked during build','Only cello and bass events/sources; no piano music','F-major musical events and sixteen bars at 64 BPM','Sixteen varied-length cello positions cover sixty seconds with rising and falling motion','Cello notes have multiple bow strengths and smooth nonzero edge-to-peak swells','Exactly sixty-second 44.1 kHz/16-bit stereo PCM','At least 18 dB headroom, negligible DC and WAV hash','Bass stem twelve dB below cello before shared final scaling','Continuous equal-power handoff envelope coverage on both instruments, before cello expression','Merged F regions continue across the file boundary','Crossfaded recorded-source sustains support long tones','Circular boundary within normal waveform changes; nonzero energy on both sides','Exact last-six/first-six-second excerpt PCM','Generated player script syntax, explicit Play and loop controls','Both audio elements initialize at 15% volume on all three player routes','Fresh full-loop WAV alias matches and fresh player links to it','Factory embedding data matches WAV bytes/hash/duration','Byte-identical offline rerender of all ten deliverables'],
 measured:{peakDbfs:20*Math.log10(peak),rmsDbfs:10*Math.log10(energy/(frames*2)),dc:sum/(frames*2),seams},
 feedback:{previousStringLedVersions:'Rejected as not pleasant',requestedDirection:'Quiet and ambient',instrumentConstraint:'No piano in background music; complement the separate piano action cues',currentDraft:'User liked the low volume and requested more cello inflection; gentle melody and bow swells await audition at 15%'},
 limits:['User low-volume feedback is recorded; no independent long-session comfort or browser/hardware-audio test is claimed','No campaign music integration or publication']};
await writeFile(`${out}/verification.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
