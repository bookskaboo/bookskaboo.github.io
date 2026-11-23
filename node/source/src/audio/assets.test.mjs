import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {expect,it} from 'vitest';
import manifest from './assets/manifest.json';
import {FEEDBACK_CUES} from '../domain/playerFeedback';
it('ships the adopted recorded piano and exact continuous-loop music with credits',()=>{
 expect(manifest.assets.map(asset=>asset.id)).toEqual([...FEEDBACK_CUES]); expect(manifest.pianoRevision).toBe(7);
 for(const asset of [...manifest.assets,manifest.music]){
  const bytes=readFileSync(new URL(`./assets/${asset.file}`,import.meta.url));
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
  expect(bytes.toString('ascii',0,4)).toBe('RIFF');expect(bytes.readUInt32LE(24)).toBe(44100);
  expect(bytes.readUInt16LE(22)).toBe(2);expect(bytes.readUInt16LE(34)).toBe(16);
 }
 expect(manifest.music.durationSeconds).toBe(60);
 const credits=readFileSync(new URL('./assets/CREDITS.txt',import.meta.url),'utf8');
 expect(credits).toContain('Alexander Holm');expect(credits).toContain('CC BY 3.0');expect(credits).toContain('Sam Gossner');expect(credits).toContain('CC0');
});
