import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build, createServer } from 'vite';
import react from '@vitejs/plugin-react';

// A single-file build can be opened directly without a server or browser storage.
const result = await build({
  configFile: false, plugins: [react()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: { lib: { entry: resolve('previews/status-page/main.tsx'), formats: ['iife'], name: 'NodeStatusStudy' }, write: false, minify: true },
});
const output = (Array.isArray(result) ? result : [result]).flatMap(bundle => bundle.output);
const script = output.find(file => file.type === 'chunk' && file.isEntry);
const styles = output.find(file => file.type === 'asset' && file.fileName.endsWith('.css'));
if (!script || !styles) throw new Error('Missing preview JavaScript or CSS');
const template = await readFile('previews/status-page/index.html', 'utf8');
const html = template.replace('</head>', () => `<style>${styles.source}</style></head>`)
  .replace('<script type="module" src="./main.tsx"></script>', () => `<script>${script.code.replace(/<\/script/gi, '<\\/script')}</script>`);
await mkdir('outputs/status-page/art', { recursive: true });
await Promise.all(['status-modal.html', 'robot-tier-art.html', 'robot-upgrade-animations.html', 'hint-texts.html'].map(file => writeFile(`outputs/status-page/${file}`, html)));
const server = await createServer({ configFile: false, server: { middlewareMode: true, watch: null } });
try {
  const { robotSvg } = await server.ssrLoadModule('/previews/status-page/robotArt.ts');
  const { STAGES } = await server.ssrLoadModule('/previews/status-page/model.ts');
  await Promise.all(STAGES.map((stage, index) => writeFile(`outputs/status-page/art/node-bot-${stage.label.toLowerCase()}.svg`, robotSvg(index))));
} finally { await server.close(); }
console.log('Wrote standalone status modal, robot art, seven upgrade animations, hints review and eight editable SVGs in outputs/status-page/');
