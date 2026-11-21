import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build, createServer } from 'vite';

const root = fileURLToPath(new URL('../previews/terrain-tiles/', import.meta.url));
const outDir = fileURLToPath(new URL('../outputs/terrain-tiles-page/', import.meta.url));
await build({ configFile: false, root, base: './', build: { outDir, emptyOutDir: true } });
let standalone = await readFile(`${outDir}/index.html`, 'utf8');
const script = standalone.match(/<script type="module" crossorigin src="\.\/([^\"]+)"><\/script>/);
const stylesheet = standalone.match(/<link rel="stylesheet" crossorigin href="\.\/([^\"]+)">/);
if (!script || !stylesheet) throw new Error('Expected one preview script and stylesheet.');
const js = (await readFile(`${outDir}/${script[1]}`, 'utf8')).replaceAll('</script', '<\\/script');
const css = await readFile(`${outDir}/${stylesheet[1]}`, 'utf8');
standalone = standalone.replace(script[0], () => `<script type="module">${js}</script>`).replace(stylesheet[0], () => `<style>${css}</style>`);
await writeFile(`${outDir}/terrain-proposal.html`, standalone);
const server = await createServer({ configFile: false, server: { middlewareMode: true, watch: null } });
try {
  const { tileSvg } = await server.ssrLoadModule('/previews/terrain-tiles/art.ts');
  await mkdir(`${outDir}/art`, { recursive: true });
  for(const terrain of ['badlands','grassland','desert','rocky']) for(let v=0;v<4;v++) {
    await writeFile(`${outDir}/art/${terrain}-${v+1}.svg`,tileSvg(terrain,v));
  }
  await mkdir(`${outDir}/art/initial`, { recursive: true });
  for(const terrain of ['badlands','grassland','desert','rocky']) for(let v=0;v<4;v++) {
    await writeFile(`${outDir}/art/initial/${terrain}-${v+1}.svg`,tileSvg(terrain,v,1,'initial'));
  }
  await mkdir(`${outDir}/art/regular`, { recursive: true });
  for(const terrain of ['badlands','grassland','desert','rocky']) for(let v=0;v<4;v++) {
    await writeFile(`${outDir}/art/regular/${terrain}-${v+1}.svg`,tileSvg(terrain,v,1,'regular'));
  }
  console.log('Built terrain proposal, offline HTML, sixteen irregular ground tiles and thirty-two earlier comparison tiles.');
} finally { await server.close(); }
