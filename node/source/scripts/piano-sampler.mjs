import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = resolve(dirname(fileURLToPath(import.meta.url)), '../previews/action-sounds/samples/grand-piano');
export function decodePianoWav(bytes) {
  if (bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WAVE') throw Error('Invalid source WAV');
  let fmt, data;
  for (let at = 12; at + 8 <= bytes.length;) {
    const tag = bytes.toString('ascii', at, at + 4), size = bytes.readUInt32LE(at + 4);
    if (at + 8 + size > bytes.length) throw Error('Truncated WAV chunk');
    if (tag === 'fmt ') fmt = {encoding:bytes.readUInt16LE(at+8),channels:bytes.readUInt16LE(at+10),rate:bytes.readUInt32LE(at+12),align:bytes.readUInt16LE(at+20),bits:bytes.readUInt16LE(at+22)};
    if (tag === 'data') data = bytes.subarray(at + 8, at + 8 + size);
    at += 8 + size + size % 2;
  }
  if (!fmt || !data || fmt.encoding !== 1 || ![16,24,32].includes(fmt.bits)) throw Error('Unsupported recorded piano PCM');
  const samples = new Float64Array(Math.floor(data.length / fmt.align)), width = fmt.bits / 8;
  const channelData=Array.from({length:fmt.channels},()=>new Float64Array(samples.length));
  let peak=0;
  for (let i=0; i<samples.length; i++) for(let c=0;c<fmt.channels;c++) {
    const value=data.readIntLE(i * fmt.align + c * width, width) / 2 ** (fmt.bits-1);
    channelData[c][i]=value;samples[i]+=value/fmt.channels;peak=Math.max(peak,Math.abs(value));
  }
  // Require a short energy window, so a single room-noise sample cannot hide padding.
  const window=Math.round(fmt.rate*.002);let onset=0;
  for(let at=0;at+window<samples.length;at+=window){let energy=0;for(let i=at;i<at+window;i++)for(const channel of channelData)energy+=channel[i]**2;
    if(Math.sqrt(energy/(window*fmt.channels))>peak*.008){onset=Math.max(0,at-Math.round(fmt.rate*.003));break;}}
  return {...fmt,samples,channelData,onset,peak};
}
export async function loadPianoBank() {
  const source = JSON.parse(await readFile(resolve(directory,'source.json'),'utf8'));
  const notes = await Promise.all(source.samples.map(async sample => {
    const bytes=await readFile(resolve(directory,sample.file));
    if(createHash('sha256').update(bytes).digest('hex')!==sample.sha256)throw Error(`Recorded source changed: ${sample.file}`);
    return {...decodePianoWav(bytes),rootHz:440*2**((sample.nominalMidi-69)/12),file:sample.file};
  }));
  return {notes,source};
}
export function nearestPianoNote(bank, frequency) {
  return bank.notes.reduce((best,note)=>Math.abs(Math.log2(frequency/note.rootHz))<Math.abs(Math.log2(frequency/best.rootHz))?note:best);
}
export function pianoValue(note, frequency, time, channel = 0) {
  const position=note.onset + time * note.rate * frequency / note.rootHz;
  const i=Math.floor(position), fraction=position-i;
  const samples=note.channelData[channel%note.channels];
  if(i+1>=samples.length)return 0;
  return ((1-fraction)*samples[i]+fraction*samples[i+1]) / note.peak;
}
