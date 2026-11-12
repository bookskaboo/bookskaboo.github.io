import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';

const server = await createServer({ configFile: false, server: { middlewareMode: true, watch: null } });
try {
  const { ITEM_ART_GROUPS, escapeMarkup, itemSvg } = await server.ssrLoadModule('/src/preview/itemArt.ts');
  const { BASE_ITEM_NAMES } = await server.ssrLoadModule('/src/content/items.ts');
  const items = ITEM_ART_GROUPS.flatMap(group => group.items);
  const catalog = new Set(Object.keys(BASE_ITEM_NAMES));
  for (const { id } of items) {
    if (!catalog.delete(id)) throw new Error(`Unexpected or duplicate item art ID: ${id}`);
  }
  if (catalog.size) throw new Error(`Missing item art: ${[...catalog].join(', ')}`);

  const pageUrl = new URL('../docs/art-preview.html', import.meta.url);
  const artDir = new URL('./item-art/', pageUrl);
  const page = await readFile(pageUrl, 'utf8');
  const start = '<!-- BEGIN GENERATED ITEM ART -->';
  const end = '<!-- END GENERATED ITEM ART -->';
  const startIndex = page.indexOf(start);
  const endIndex = page.indexOf(end);
  if (startIndex < 0 || endIndex < startIndex) throw new Error('Item art markers are missing from the preview.');

  const sections = ITEM_ART_GROUPS.map(({ title, items }) => `    <section>
      <h3>${escapeMarkup(title)}</h3>
      <div class="item-gallery">
${items.map(({ id, name, detail }) => {
    const label = escapeMarkup(detail ? `${name} · ${detail}` : name);
    return `        <figure>
          <a href="item-art/${id}.svg" download aria-label="Download ${label} SVG"><img src="item-art/${id}.svg" width="64" height="64" alt=""></a>
          <figcaption>${escapeMarkup(name)}${detail ? `<small>${escapeMarkup(detail)}</small>` : ''}</figcaption>
        </figure>`;
  }).join('\n')}
      </div>
    </section>`).join('\n');

  await mkdir(artDir, { recursive: true });
  await Promise.all(items.map(item => writeFile(new URL(`${item.id}.svg`, artDir), itemSvg(item))));
  await writeFile(pageUrl, `${page.slice(0, startIndex + start.length)}\n${sections}\n    ${page.slice(endIndex)}`);
  console.log(`Wrote ${items.length} item SVGs and refreshed docs/art-preview.html`);
} finally {
  await server.close();
}
