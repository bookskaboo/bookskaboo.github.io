// One-time authoring download. Offline builds consume the retained WAVs.
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const commit='440300901dfe9275fd84e0b7763af1f8443ae62e';
const repository='https://github.com/sgossner/VSCO-2-CE';
const base=`https://raw.githubusercontent.com/sgossner/VSCO-2-CE/${commit}/`;
const out='previews/action-sounds/samples/cello';await mkdir(out,{recursive:true});
const samples=[];
for(const name of ['C1','E1','G1','B1']){
 const original=`Strings/Cello Section/susvib/susvib_${name}_v1_1.wav`;
 const url=base+original.split('/').map(encodeURIComponent).join('/');
 const response=await fetch(url);if(!response.ok)throw Error(`${response.status}: ${original}`);
 const bytes=Buffer.from(await response.arrayBuffer()),file=name.toLowerCase()+'.wav';await writeFile(`${out}/${file}`,bytes);
 samples.push({file,sourceNote:name,original,url,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length});
 console.log(`Downloaded soft bowed cello ${name}`);
}
const license=await fetch(base+'LICENSE');if(!license.ok)throw Error('Missing source license');
await writeFile(`${out}/LICENSE.txt`,await license.text());
await writeFile(`${out}/source.json`,JSON.stringify({library:'VSCO 2 Community Edition — Cello Section',author:'Versilian Studios / Sam Gossner',repository,commit,license:'CC0-1.0',licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0/',articulation:'Soft sustained bowed cello section, vibrato, v1 round robin 1',samples},null,2)+'\n');
