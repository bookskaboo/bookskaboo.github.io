// Explicit authoring step only. Ordinary preview builds work offline.
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const commit = '440300901dfe9275fd84e0b7763af1f8443ae62e';
const base = `https://raw.githubusercontent.com/sgossner/VSCO-2-CE/${commit}/`;
const out = 'previews/action-sounds/samples/piano';
await mkdir(out, { recursive: true });
const samples = await Promise.all([2,3,4,5,6].map(async octave => {
  const original = `Keys/Upright Nr1/UR1_C${octave}_mf_RR1.wav`;
  const url = base + original.split('/').map(encodeURIComponent).join('/');
  const response = await fetch(url); if (!response.ok) throw Error(`${response.status}: ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.toString('ascii',0,4) !== 'RIFF') throw Error('Expected recorded PCM WAV');
  const file = `c${octave}.wav`; await writeFile(`${out}/${file}`, bytes);
  return {file, original, url, nominalMidi: 12 * (octave + 1), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex')};
}));
const licenseResponse = await fetch(base + 'LICENSE'); if (!licenseResponse.ok) throw Error('Missing source license');
await writeFile(`${out}/LICENSE.txt`, await licenseResponse.text());
await writeFile(`${out}/source.json`, JSON.stringify({library:'VSCO 2 Community Edition — Upright Nr. 1',author:'Versilian Studios; VSCO 2 CE recorded by Sam Gossner and Simon Dalzell',license:'CC0-1.0',homepage:'https://versilian-studios.com/vsco-community/',repository:'https://github.com/sgossner/VSCO-2-CE',commit,samples},null,2)+'\n');
console.log(`Downloaded ${samples.length} recorded piano notes and the CC0 license (${samples.reduce((n,s)=>n+s.bytes,0)} bytes).`);
