import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const pianoRoot='outputs/action-sounds',musicRoot='outputs/music/quiet-workshop-ambient-strings',out='src/audio/assets';
const piano=JSON.parse(await readFile(`${pianoRoot}/manifest.json`)),music=JSON.parse(await readFile(`${musicRoot}/manifest.json`));
await mkdir(out,{recursive:true});
const assets=[];
for(const asset of piano.assets.filter(asset=>asset.id!=='select-low')){
 const bytes=await readFile(`${pianoRoot}/${asset.file}`);assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);
 const file=`${asset.id}.wav`;await writeFile(`${out}/${file}`,bytes);assets.push({id:asset.id,file,sha256:asset.sha256});
}
assert.equal(assets.length,19);
const bytes=await readFile(`${musicRoot}/quiet-workshop-ambient-strings-60s.wav`);assert.equal(createHash('sha256').update(bytes).digest('hex'),music.sha256);
await writeFile(`${out}/workshop.wav`,bytes);
const credits='NODE: Another Factory Game — Audio\n\nPiano player-action cues:\n'+await readFile(`${pianoRoot}/PIANO-CREDITS.txt`,'utf8')+'\nAmbient cello and double bass:\n'+await readFile(`${musicRoot}/CREDITS.txt`,'utf8');
await writeFile(`${out}/CREDITS.txt`,credits);await mkdir('public',{recursive:true});await writeFile('public/AUDIO-CREDITS.txt',credits);
await writeFile(`${out}/manifest.json`,JSON.stringify({pianoRevision:piano.palette.revision,key:piano.palette.key,register:piano.palette.register,pianoLicense:'CC-BY-3.0',musicLicense:'CC0-1.0',assets,music:{file:'workshop.wav',durationSeconds:60,sha256:music.sha256}},null,2)+'\n');
console.log(`Adopted piano revision ${piano.palette.revision}: ${assets.length} cues and the current 60-second strings.`);
