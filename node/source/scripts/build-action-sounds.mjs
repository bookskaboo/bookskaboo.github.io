import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { cues, variants, actions, PALETTE } from '../previews/action-sounds/model.mjs';
import { loadPianoBank, nearestPianoNote, pianoValue } from './piano-sampler.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'outputs/action-sounds');
const rate = 44100;
const channels = 2;
const pianoBank = await loadPianoBank();
const releaseFor = cue => ['complete','upgrade','unlock','attention','victory'].includes(cue.id) ? .8 : .45;
function synth(cue) {
  const tail=releaseFor(cue);
  const samples = new Float64Array(Math.ceil((cue.duration+tail) * rate)*channels);
  for (const [start, length, f0, f1, gain, type] of cue.voices) {
    if (type !== 'piano' || f0 !== f1) throw Error(`Expected recorded piano notes in ${cue.id}`);
    const note = nearestPianoNote(pianoBank, f0);
    const release=(cue.id==='complete' && start===0) ? .16 : tail;
    for (let n = 0; n < Math.ceil((length+release) * rate); n++) {
      const t = n / rate, i = Math.round(start * rate) + n;
      if (i*channels >= samples.length) break;
      // Keep the recorded attack and stereo image. A key release damps a natural
      // tail rather than cutting the instrument off at the action's note length.
      const attack = Math.sin(Math.min(1, t / .001) * Math.PI / 2) ** 2;
      const elapsed=Math.max(0,t-length),damping=t<=length?1:Math.exp(-5*elapsed/release)*Math.min(1,(release-elapsed)/.025);
      for(let c=0;c<channels;c++)samples[i*channels+c] += gain * attack * damping * pianoValue(note, f0, t,c);
    }
  }
  // Preserve source tone; only fade file boundaries. Do not collapse stereo.
  const frames=samples.length/channels;
  for (let i = 0; i < frames; i++) for(let c=0;c<channels;c++)samples[i*channels+c] *= Math.min(1,i/44,(frames-1-i)/220);
  return samples;
}
function wav(samples) {
  const b = Buffer.alloc(44 + samples.length * 2);
  b.write('RIFF'); b.writeUInt32LE(b.length - 8, 4); b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(channels, 22);
  b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate * channels * 2, 28); b.writeUInt16LE(channels*2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((v, i) => {
    if (Math.abs(v) >= 1) throw new Error('Clipped audio');
    b.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  });
  return b;
}
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
await mkdir(resolve(out, 'wav'), { recursive: true });
const assets = [], reel = [], reelIndex = [];
let offset = .4;
for (const cue of [...cues, ...variants]) {
  const samples = synth(cue), bytes = wav(samples);
  await writeFile(resolve(out, `wav/${cue.id}.wav`), bytes);
  if(cue.id==='select')await writeFile(resolve(out,'select-single-chord.wav'),bytes);
  if(cue.id==='place')await writeFile(resolve(out,'place-open-f.wav'),bytes);
  if(cue.id==='move')await writeFile(resolve(out,'move-roll-down.wav'),bytes);
  if(cue.id==='move')await writeFile(resolve(out,'move-two-notes.wav'),bytes);
  // Measure with a loop to avoid argument limits on larger buffers.
  let maximum = 0, energy = 0, dc = 0, maxStep = 0;
  for (let i = 0; i < samples.length; i++) {
    maximum = Math.max(maximum, Math.abs(samples[i])); energy += samples[i] ** 2; dc += samples[i];
    if (i>=channels) maxStep = Math.max(maxStep, Math.abs(samples[i] - samples[i - channels]));
  }
  assets.push({ id: cue.id, name: cue.name, harmony:cue.harmony, key:PALETTE.key, file: `wav/${cue.id}.wav`, durationSeconds: samples.length / rate / channels, gestureSeconds:cue.duration,releaseSeconds:releaseFor(cue),
    peakDbfs: 20 * Math.log10(maximum), rmsDbfs: 20 * Math.log10(Math.sqrt(energy / samples.length)),
    dcOffset: dc / samples.length, maximumSampleStep: maxStep, sampleRate: rate, channels, bits: 16,
    sha256: createHash('sha256').update(bytes).digest('hex'), uri: `data:audio/wav;base64,${bytes.toString('base64')}` });
  if (cues.includes(cue)) {
    reelIndex.push({ id: cue.id, name: cue.name, startSeconds: Number(offset.toFixed(3)), durationSeconds: samples.length / rate / channels });
    reel.push(samples); offset += samples.length / rate / channels + .65;
  }
}
const reelSamples = new Float64Array(Math.ceil(offset * rate)*channels);
await writeFile(resolve(out, 'audio-data.json'), JSON.stringify(Object.fromEntries(assets.map(a => [a.id, a.uri]))) + '\n');
let cursor = Math.round(.4 * rate)*channels;
for (const samples of reel) { reelSamples.set(samples, cursor); cursor += samples.length + Math.round(.65 * rate)*channels; }
await writeFile(resolve(out, 'audition-reel.wav'), wav(reelSamples));
await writeFile(resolve(out, 'f-major-sampler.wav'), wav(reelSamples));
await writeFile(resolve(out, 'varied-f-major-sampler.wav'), wav(reelSamples));
await writeFile(resolve(out, 'revision-5-sampler.wav'), wav(reelSamples));
await writeFile(resolve(out, 'revision-6-sampler.wav'), wav(reelSamples));
const milestoneCues=cues.filter(cue=>['complete','upgrade','victory'].includes(cue.id));
const milestoneSamples=milestoneCues.map(synth);
const milestoneReel=new Float64Array(Math.round(.4*rate)*channels+milestoneSamples.reduce((total,samples)=>total+samples.length+Math.round(.65*rate)*channels,0));
let milestoneCursor=Math.round(.4*rate)*channels;
for(const samples of milestoneSamples){milestoneReel.set(samples,milestoneCursor);milestoneCursor+=samples.length+Math.round(.65*rate)*channels;}
await writeFile(resolve(out,'revision-6-milestones.wav'),wav(milestoneReel));
await writeFile(resolve(out, 'reel-index.json'), JSON.stringify(reelIndex, null, 2) + '\n');
await writeFile(resolve(out, 'manifest.json'), JSON.stringify({ format: 'NODE action-sound proposal v1', status: 'Draft assets; not integrated into gameplay', date: '2026-11-21',
  revision:'F major milestone runs 6',palette:PALETTE,
  synthesis: 'Recorded stereo Yamaha C5 grand-piano notes with near-native pitches, natural hammer attacks and extended release tails; no mono collapse or procedural instrument voices.',
  instrumentSource: pianoBank.source,
  comparisonVariants: variants.map(({ id, baseId, description }) => ({ id, baseId, description })),
  assets: assets.map(({ uri, ...asset }) => asset), actions: actions.map(([action, cue, priority, trigger, limit]) => ({ action, cue, priority, trigger, limit })) }, null, 2) + '\n');
const csv = [['Player action', 'Cue', 'Harmony / phrase', 'Recommendation', 'Trigger / reason', 'Repetition limit'], ...actions.map(([action,cue,priority,trigger,limit])=>[action,cue,cue.split('/').filter(Boolean).map(id=>cues.find(c=>c.id===id)?.harmony??'').join(' / '),priority,trigger,limit])]
  .map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\r\n') + '\r\n';
await writeFile(resolve(out, 'proposal.csv'), '\uFEFF' + csv);
const roles = (await readFile(resolve(root, 'src/styles/readability.css'), 'utf8')).match(/:root\s*\{[^}]+\}/)[0];
const cards = cues.map((cue, i) => `<article id="${cue.id}"><div class="cue-head"><h3>${String(i + 1).padStart(2, '0')} · ${escape(cue.name)}</h3><span>${Math.round(assets[i].durationSeconds * 1000)} ms incl. release</span></div><p class="meta">${escape(cue.harmony)}</p><p>${escape(cue.description)}</p><div class="buttons"><button data-cue="${cue.id}">Play ${escape(cue.name.toLowerCase())}</button><a download="node-${cue.id}.wav" href="${assets[i].uri}">WAV</a>${variants.filter(v => v.baseId === cue.id).map(v => `<button data-cue="${v.id}">Play lower pitch</button><a download="node-${v.id}.wav" href="${assets.find(a => a.id === v.id).uri}">Lower WAV</a>`).join('')}</div></article>`).join('\n');
const rows = actions.map(([action, cue, priority, trigger, limit]) => `<tr data-priority="${priority}"><th scope="row">${escape(action)}</th><td>${cue ? cue.split('/').map(id => `<button data-cue="${id}" aria-label="Play ${escape(id)} for ${escape(action)}">${escape(id)}</button>`).join(' ') : '—'}</td><td>${escape(priority)}</td><td>${escape(trigger)}</td><td>${escape(limit)}</td></tr>`).join('\n');
const template = await readFile(resolve(root, 'previews/action-sounds/index.html'), 'utf8');
const reference=await readFile(resolve(root,'previews/action-sounds/samples/grand-piano/a3.wav'));
const referenceFrames=(reference.length-44)/4,referenceRate=reference.readUInt32LE(24),referenceFade=Math.round(referenceRate*.15);
for(let frame=referenceFrames-referenceFade;frame<referenceFrames;frame++)for(let c=0;c<2;c++){
  const position=44+frame*4+c*2;reference.writeInt16LE(Math.round(reference.readInt16LE(position)*(referenceFrames-1-frame)/referenceFade),position);
}
await writeFile(resolve(out,'piano-source-reference.wav'),reference);
const html=template.replace('/* SHARED_ROLES */', roles).replace('<!-- CUE_CARDS -->', cards).replace('<!-- ACTION_ROWS -->', rows)
  .replace('<!-- PIANO_REFERENCE -->',`<audio controls preload="none" aria-label="Plain grand-piano reference" src="data:audio/wav;base64,${reference.toString('base64')}"></audio>`)
  .replace('/* AUDIO_DATA */', `const cues = ${JSON.stringify(Object.fromEntries(assets.map(a => [a.id, { name: a.name, uri: a.uri }])))}; const reelUri = ${JSON.stringify('data:audio/wav;base64,' + wav(reelSamples).toString('base64'))}; const reelIndex = ${JSON.stringify(reelIndex)};`);
await writeFile(resolve(out, 'proposal.html'),html);await writeFile(resolve(out, 'piano-review.html'),html);await writeFile(resolve(out,'f-major-review.html'),html);await writeFile(resolve(out,'f-major-variety.html'),html);
await writeFile(resolve(out,'f-major-revision-5.html'),html);
await writeFile(resolve(out,'f-major-revision-6.html'),html);
await writeFile(resolve(out,'PIANO-CREDITS.txt'),pianoBank.source.attribution+'\nSource: '+pianoBank.source.homepage+'\nLicense: '+pianoBank.source.licenseUrl+'\n');
console.log(`Wrote ${cues.length} stereo grand-piano cues and ${variants.length} comparison, ${reelSamples.length / rate / channels}s reel, plain reference and fresh piano-review.html`);
