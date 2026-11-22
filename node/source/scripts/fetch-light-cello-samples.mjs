// Reuse the retained low cello samples; add native D3 and F3 recordings.
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const originalSource=JSON.parse(await readFile('previews/action-sounds/samples/cello/source.json'));
const out='previews/action-sounds/samples/cello-lighter';await mkdir(out,{recursive:true});
const samples=originalSource.samples.map(sample=>({...sample,file:'../cello/'+sample.file}));
const base=`https://raw.githubusercontent.com/sgossner/VSCO-2-CE/${originalSource.commit}/`;
for(const name of ['D2','F2']){
 const original=`Strings/Cello Section/susvib/susvib_${name}_v1_1.wav`;
 const url=base+original.split('/').map(encodeURIComponent).join('/');
 const response=await fetch(url);if(!response.ok)throw Error(`${response.status}: ${original}`);
 const bytes=Buffer.from(await response.arrayBuffer()),file=name.toLowerCase()+'.wav';await writeFile(`${out}/${file}`,bytes);
 samples.push({file,sourceNote:name,original,url,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length});
 console.log(`Downloaded soft bowed cello ${name}`);
}
await writeFile(`${out}/LICENSE.txt`,await readFile('previews/action-sounds/samples/cello/LICENSE.txt'));
await writeFile(`${out}/source.json`,JSON.stringify({...originalSource,samples},null,2)+'\n');
