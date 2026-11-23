import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { cues, variants, PALETTE, pianoNoteFrequency } from '../previews/action-sounds/model.mjs';
import { loadPianoBank, nearestPianoNote, pianoValue } from './piano-sampler.mjs';
import {cues as previousCues} from '../previews/action-sounds/archive/revision-6-model.mjs';

test('all numbered cues and the comparison use only fixed-pitch recorded piano notes', () => {
  assert.equal(cues.length,19); assert.equal(variants.length,1);
  for(const cue of [...cues,...variants])for(const [start,length,f0,f1,gain,instrument]of cue.voices){
    assert.equal(instrument,'piano');assert.equal(f0,f1);assert.ok(f0>0&&gain>0);
    assert.ok(start+length<=cue.duration+1e-9);
  }
});
test('piano source recordings pass pinned hashes and provide real non-silent PCM', async () => {
  const bank=await loadPianoBank();assert.equal(bank.source.license,'CC-BY-3.0');assert.equal(bank.notes.length,14);
  for(const note of bank.notes){assert.equal(note.channels,2);assert.equal(note.bits,16);assert.ok(note.peak>.05);assert.ok(note.samples.length>note.rate);}
  for(const cue of [...cues,...variants])for(const [,length,hz]of cue.voices){
    const note=nearestPianoNote(bank,hz);let energy=0;
    assert.ok(Math.abs(12*Math.log2(hz/note.rootHz))<1.51,'Excessive piano repitching');
    for(let i=1;i<200;i++){const value=pianoValue(note,hz,length*i/200);assert.ok(Number.isFinite(value));energy+=value*value;}
    assert.ok(energy>.001,`Silent sampled note: ${cue.id}`);
  }
});
test('the low ta-da, single rejection strike and octave comparison retain their shapes',()=>{
  const complete=cues.find(c=>c.id==='complete'),reject=cues.find(c=>c.id==='reject'),select=cues.find(c=>c.id==='select');
  assert.equal(complete.duration,2.05);assert.deepEqual([...new Set(complete.voices.map(v=>v[0]))],[0,.2,.35,.5,.65,.88]);
  assert.equal(complete.voices[0][2],pianoNoteFrequency('C3'));assert.equal(complete.voices.at(-3)[2],pianoNoteFrequency('F3'));
  assert.equal(reject.voices.length,1);assert.equal(variants[0].duration,select.duration);
  for(let i=0;i<select.voices.length;i++)assert.equal(variants[0].voices[i][2],select.voices[i][2]/2);
});

test('gentler phrases keep instant feedback and note counts with more spacing and lower gains',()=>{
  assert.equal(PALETTE.revision,7);
  for(const cue of cues){
    const previous=previousCues.find(item=>item.id===cue.id);
    const starts=[...new Set(cue.voices.map(voice=>voice[0]))].sort((a,b)=>a-b);
    const oldStarts=[...new Set(previous.voices.map(voice=>voice[0]))].sort((a,b)=>a-b);
    assert.equal(starts[0],0);assert.equal(cue.voices.length,previous.voices.length);
    for(let i=1;i<starts.length;i++){assert.ok(starts[i]-starts[i-1]>=.105-1e-9);assert.ok(starts[i]-starts[i-1]>oldStarts[i]-oldStarts[i-1]);}
    for(let i=0;i<cue.voices.length;i++)assert.ok(cue.voices[i][4]<previous.voices[i][4]);
    if(!['complete','upgrade','unlock','attention','victory'].includes(cue.id))assert.ok(cue.duration<=.54);
  }
  for(const id of ['connect','disconnect','delete','configure','queue','resume','complete','upgrade','unlock','travel','save','victory']){
    const cue=cues.find(item=>item.id===id),last=Math.max(...cue.voices.map(voice=>voice[0]));
    for(const voice of cue.voices.filter(voice=>voice[0]===last))assert.ok([0,5,9].includes(Math.round(69+12*Math.log2(voice[2]/440))%12));
  }
});
test('all phrases are distinct, diatonic to F major and voiced between C2 and C4',()=>{
  assert.equal(PALETTE.key,'F major');const signatures=new Set();
  for(const cue of [...cues,...variants])for(const voice of cue.voices){const exact=69+12*Math.log2(voice[2]/440),midi=Math.round(exact);
    assert.ok(Math.abs(exact-midi)<1e-8);assert.ok([0,2,4,5,7,9,10].includes(midi%12),`Out-of-key note: ${cue.id}`);assert.ok(midi>=36&&midi<=60,`Out-of-register note: ${cue.id}`);}
  for(const cue of cues){const signature=JSON.stringify(cue.voices.map(v=>[v[0],v[1],v[2]]));assert.ok(!signatures.has(signature),`Duplicate phrase: ${cue.id}`);signatures.add(signature);}
});
test('selection and movement strike single triads with movement one octave lower',()=>{
  for(const cue of [cues.find(c=>c.id==='select'),variants.find(c=>c.id==='select-low')]){
    assert.equal(cue.voices.length,3);assert.deepEqual([...new Set(cue.voices.map(v=>v[0]))],[0]);assert.equal(new Set(cue.voices.map(v=>v[1])).size,1);
  }
  const moving=cues.find(c=>c.id==='move');
  assert.equal(moving.voices.length,3);assert.deepEqual(moving.voices.map(v=>v[2]),['F2','A2','C3'].map(pianoNoteFrequency));
  assert.deepEqual([...new Set(moving.voices.map(v=>v[0]))],[0]);assert.equal(new Set(moving.voices.map(v=>v[1])).size,1);
});
test('the broader palette uses every F-major degree and fifteen distinct pitches',()=>{
  const pitches=new Set(cues.flatMap(c=>c.voices.map(v=>Math.round(69+12*Math.log2(v[2]/440)))));
  assert.equal(pitches.size,15);assert.deepEqual([...new Set([...pitches].map(n=>n%12))].sort((a,b)=>a-b),[0,2,4,5,7,9,10]);
});
test('every rendered piano WAV matches its manifest and both embedded preview bundles',async()=>{
  const manifest=JSON.parse(await readFile('outputs/action-sounds/manifest.json'));
  const embedded=JSON.parse(await readFile('outputs/action-sounds/audio-data.json'));
  const html=await readFile('outputs/action-sounds/playground.html','utf8');
  assert.equal(manifest.instrumentSource.license,'CC-BY-3.0');assert.equal(manifest.assets.length,20);
  for(const asset of manifest.assets){
    const bytes=await readFile(`outputs/action-sounds/${asset.file}`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);
    assert.equal(embedded[asset.id],`data:audio/wav;base64,${bytes.toString('base64')}`);assert.ok(html.includes(embedded[asset.id]));
    assert.equal(bytes.readUInt16LE(22),2);assert.equal(bytes.readInt16LE(44),0);assert.equal(bytes.readInt16LE(bytes.length-2),0);assert.ok(asset.peakDbfs< -12);
    assert.ok(asset.durationSeconds>=asset.gestureSeconds+.44);
    assert.equal(asset.attackSeconds,.003);assert.equal(asset.intermediateReleaseSeconds,.18);
    const first=Math.round((asset.gestureSeconds+.03)*asset.sampleRate),last=Math.min(first+2205,(bytes.length-44)/4);
    let tailEnergy=0;for(let frame=first;frame<last;frame++)tailEnergy+=(bytes.readInt16LE(44+frame*4)/32768)**2;
    assert.ok(tailEnergy>1e-8,`Missing recorded decay: ${asset.id}`);
  }
});
