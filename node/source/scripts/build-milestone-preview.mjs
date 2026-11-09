import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import react from '@vitejs/plugin-react';

const localFile = path => fileURLToPath(new URL(path, import.meta.url));
const bundle = await build({
  configFile: false,
  plugins: [react()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    lib: {
      entry: localFile('../src/preview/milestoneModals.tsx'),
      formats: ['iife'],
      name: 'NodeMilestonePreview',
    },
    minify: true,
    write: false,
  },
});
const output = (Array.isArray(bundle) ? bundle : [bundle]).flatMap(result => result.output);
const script = output.find(file => file.type === 'chunk' && file.isEntry);
const styles = output.find(file => file.type === 'asset' && file.fileName.endsWith('.css'));
if (!script || !styles) throw new Error('The milestone preview build did not produce JavaScript and CSS.');

const template = await readFile(localFile('../docs/milestone-modals.html'), 'utf8');
const html = template
  .replace('</head>', () => `<style>${styles.source}</style>\n  </head>`)
  .replace('<script type="module" src="../src/preview/milestoneModals.tsx"></script>',
    () => `<script>${script.code.replace(/<\/script/gi, '<\\/script')}</script>`);
await writeFile(localFile('../outputs/milestone-modals.html'), html);
console.log('Wrote outputs/milestone-modals.html');
