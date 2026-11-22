import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'vite';
import react from '@vitejs/plugin-react';

const result = await build({configFile:false,plugins:[react()],define:{'process.env.NODE_ENV':JSON.stringify('production')},
  build:{lib:{entry:resolve('previews/action-sounds/playground.tsx'),formats:['iife'],name:'NodeSoundPlayground'},write:false,minify:true}});
const files=(Array.isArray(result)?result:[result]).flatMap(r=>r.output);
const js=files.find(f=>f.type==='chunk'&&f.isEntry),css=files.find(f=>f.type==='asset'&&f.fileName.endsWith('.css'));
if(!js||!css)throw Error('Missing sound playground bundle');
const html=(await readFile('previews/action-sounds/playground.html','utf8')).replace('</head>',()=>`<style>${css.source}</style></head>`)
  .replace('<script type="module" src="./playground.tsx"></script>',()=>`<script>${js.code.replace(/<\/script/gi,'<\\/script')}</script>`);
await writeFile('outputs/action-sounds/playground.html',html);
await writeFile('outputs/action-sounds/factory-with-music.html',html);
console.log('Wrote standalone outputs/action-sounds/playground.html');
