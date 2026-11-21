import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build, createServer } from 'vite';
import react from '@vitejs/plugin-react';

const root = fileURLToPath(new URL('../previews/border-obstructions/', import.meta.url));
const outDir = fileURLToPath(new URL('../outputs/border-obstructions-page/', import.meta.url));
await build({ configFile: false, root, base: './', build: { outDir, emptyOutDir: true } });
let standalone = await readFile(`${outDir}/index.html`, 'utf8');
const script = standalone.match(/<script type="module" crossorigin src="\.\/([^\"]+)"><\/script>/);
const stylesheet = standalone.match(/<link rel="stylesheet" crossorigin href="\.\/([^\"]+)">/);
if (!script || !stylesheet) throw new Error('Expected one preview script and stylesheet.');
const js = (await readFile(`${outDir}/${script[1]}`, 'utf8')).replaceAll('</script', '<\\/script');
const css = await readFile(`${outDir}/${stylesheet[1]}`, 'utf8');
standalone = standalone.replace(script[0], () => `<script type="module">${js}</script>`).replace(stylesheet[0], () => `<style>${css}</style>`);
await writeFile(`${outDir}/border-obstructions.html`, standalone);
const server = await createServer({ configFile: false, server: { middlewareMode: true, watch: null } });
try {
  const { BORDER_ART, borderObstructionSvg } = await server.ssrLoadModule('/src/art/borderObstructionArt.ts');
  await mkdir(`${outDir}/art`, { recursive: true });
  for (const art of BORDER_ART) await writeFile(`${outDir}/art/${art.id}.svg`, borderObstructionSvg(art.id));
  console.log('Built border art page, self-contained border-obstructions.html and three terrain SVGs.');
} finally { await server.close(); }

for (const page of [{ name: 'map-modal', entry: 'mapModal.tsx', global: 'BorderMapModal' }, { name: 'runtime', entry: 'runtime.tsx', global: 'BorderRuntime' }]) {
const mapResult = await build({
  configFile: false, plugins: [react()], define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: { lib: { entry: `${root}/${page.entry}`, formats: ['iife'], name: page.global }, write: false, minify: true },
});
const mapFiles = (Array.isArray(mapResult) ? mapResult : [mapResult]).flatMap(bundle => bundle.output);
const mapScript = mapFiles.find(file => file.type === 'chunk' && file.isEntry);
const mapStyles = mapFiles.find(file => file.type === 'asset' && file.fileName.endsWith('.css'));
if (!mapScript || !mapStyles) throw new Error('Map modal build is missing script or stylesheet');
const mapTemplate = await readFile(`${root}/${page.name}.html`, 'utf8');
const mapHtml = mapTemplate.replace('</head>', () => `<style>${mapStyles.source}</style></head>`)
  .replace(`<script type="module" src="./${page.entry}"></script>`, () => `<script>${mapScript.code.replaceAll('</script', '<\\/script')}</script>`);
await writeFile(`${outDir}/${page.name}.html`, mapHtml);
console.log(`Built standalone ${page.name}.html with actual game components.`);
}
