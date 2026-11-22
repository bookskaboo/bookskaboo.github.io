// One-time authoring tool. Builds consume the prepared WAVs without a decoder or network.
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { FLACDecoder } from '../.artifact-work/audio-tools/node_modules/@wasm-audio-decoders/flac/index.js';
const commit='3382bf9496bba2486f5ab0de55a264d1dfc38404';
const repository='https://github.com/sfzinstruments/SalamanderGrandPiano';
const base=`https://raw.githubusercontent.com/sfzinstruments/SalamanderGrandPiano/${commit}/`;
const out='previews/action-sounds/samples/grand-piano';
await mkdir(out,{recursive:true});
const samples=[];
for(const [name,midi]of [['C2',36],['D#2',39],['F#2',42],['A2',45],['C3',48],['D#3',51],['F#3',54],['A3',57],['C4',60],['D#4',63],['F#4',66],['A4',69],['C5',72],['D#5',75]]){
  const original=`Samples/${name}v10.flac`,url=base+original.split('/').map(encodeURIComponent).join('/');
  const response=await fetch(url);if(!response.ok)throw Error(`${response.status}: ${url}`);
  const raw=new Uint8Array(await response.arrayBuffer());
  const decoder=new FLACDecoder();await decoder.ready;
  const decoded=await decoder.decodeFile(raw);decoder.free();
  if(decoded.errors.length||decoded.channelData.length!==2)throw Error(`Grand sample decode failed: ${name}`);
  const frames=Math.min(decoded.samplesDecoded,Math.floor(decoded.sampleRate*4));
  const wav=Buffer.alloc(44+frames*4);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);
  wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(2,22);wav.writeUInt32LE(decoded.sampleRate,24);
  wav.writeUInt32LE(decoded.sampleRate*4,28);wav.writeUInt16LE(4,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(frames*4,40);
  for(let i=0;i<frames;i++)for(let c=0;c<2;c++)wav.writeInt16LE(Math.round(Math.max(-1,Math.min(.999969,decoded.channelData[c][i]))*32767),44+i*4+c*2);
  const file=name.replace('#','s').toLowerCase()+'.wav';await writeFile(`${out}/${file}`,wav);
  samples.push({file,original,url,nominalMidi:midi,sha256:createHash('sha256').update(wav).digest('hex'),originalSha256:createHash('sha256').update(raw).digest('hex'),originalSampleRate:decoded.sampleRate,originalBits:decoded.bitDepth,preparedFrames:frames});
  console.log(`Prepared grand piano ${name}, stereo ${decoded.sampleRate} Hz.`);
}
const license=await fetch(base+'LICENSE');if(!license.ok)throw Error('Missing license');await writeFile(`${out}/LICENSE.txt`,await license.text());
await writeFile(`${out}/source.json`,JSON.stringify({library:'Salamander Grand Piano V3 — Yamaha C5',author:'Alexander Holm',license:'CC-BY-3.0',licenseUrl:'https://creativecommons.org/licenses/by/3.0/',homepage:'https://sfzinstruments.github.io/pianos/salamander/',repository,commit,attribution:'Salamander Grand Piano V3 by Alexander Holm, licensed CC BY 3.0. Modified for NODE: selected velocity-10 notes, first four seconds converted from 24-bit FLAC to 16-bit stereo WAV; arranged, repitched and released as interaction cues.',samples},null,2)+'\n');
