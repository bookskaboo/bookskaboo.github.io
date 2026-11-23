import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'vite';
import react from '@vitejs/plugin-react';

const result = await build({ configFile: false, plugins: [react()], define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: { lib: { entry: resolve('previews/status-page/hint-navigation.tsx'), formats: ['iife'], name: 'NodeHintNavigationStudy' }, write: false, minify: true } });
const files = (Array.isArray(result) ? result : [result]).flatMap(bundle => bundle.output);
const script = files.find(file => file.type === 'chunk' && file.isEntry);
const styles = files.find(file => file.type === 'asset' && file.fileName.endsWith('.css'));
if (!script || !styles) throw new Error('Missing hint study JavaScript or CSS');
const template = await readFile('previews/status-page/hint-navigation.html', 'utf8');
const html = template.replace('</head>', () => `<style>${styles.source}</style></head>`)
  .replace('<script type="module" src="./hint-navigation.tsx"></script>', () => `<script>${script.code.replace(/<\/script/gi, '<\\/script')}</script>`);
await mkdir('outputs/hint-navigation', { recursive: true });
await writeFile('outputs/hint-navigation/index.html', html);
console.log('Wrote outputs/hint-navigation/index.html');
