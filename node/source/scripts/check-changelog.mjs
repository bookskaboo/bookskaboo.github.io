import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { Script } from 'node:vm';
import { searchEntries, validate } from './changelog.mjs';

const data = JSON.parse(await readFile(new URL('../docs/changelog/entries.json', import.meta.url), 'utf8'));

test('records resolve source, publication, evidence, and supersession references', () => {
  assert.doesNotThrow(() => validate(data));
  const duplicate = structuredClone(data);
  duplicate.entries.push(duplicate.entries[0]);
  assert.throws(() => validate(duplicate), /Duplicate entry ID/);
  const missingSource = structuredClone(data);
  missingSource.entries[0].sources = ['unknown-source'];
  assert.throws(() => validate(missingSource), /unknown source/);
  const falsePublication = structuredClone(data);
  falsePublication.entries.find((entry) => entry.delivery === 'local').publishedBy = 'e177479';
  assert.throws(() => validate(falsePublication), /only published entries/);
});

test('search finds current and superseded grid controls', () => {
  const matches = searchEntries(data, { query: 'grid snap' });
  assert.ok(matches.some((entry) => entry.id === 'NODE-0096' && entry.state === 'superseded'));
  assert.ok(matches.some((entry) => entry.id === 'NODE-0105' && entry.supersedes.includes('NODE-0096')));
  assert.deepEqual(searchEntries(data, { query: 'NODE-0105', delivery: 'local' }).map((entry) => entry.id), ['NODE-0105']);
});

test('topic, publication, state, type, and date filters combine', () => {
  const matches = searchEntries(data, { topic: 'Research', delivery: 'local', state: 'implemented', kind: 'changed', from: '2026-11-02', to: '2026-11-02' });
  assert.ok(matches.length >= 3);
  assert.ok(matches.every((entry) => entry.topics.includes('Research') && entry.delivery === 'local' && entry.kind === 'changed' && entry.date === '2026-11-02'));
  const datedFixture = { ...data, entries: [
    { ...data.entries[0], id: 'before-cutoff', date: '2000-01-01' },
    { ...data.entries[0], id: 'at-cutoff', date: '2000-01-02' },
  ] };
  assert.deepEqual(searchEntries(datedFixture, { from: '2000-01-02' }).map((entry) => entry.id), ['at-cutoff']);
  assert.equal(searchEntries(datedFixture, { from: '2000-01-03' }).length, 0);
  assert.equal(searchEntries(data, { query: 'not-a-real-node-history-word' }).length, 0);
});

test('old spelling and source identifiers remain searchable', () => {
  assert.deepEqual(searchEntries(data, { query: 'mithril' }), searchEntries(data, { query: 'mythril' }));
  assert.ok(searchEntries(data, { query: '01a19abf-34b1-7b93-b2d9-ca4f50819ece' }).some((entry) => entry.id === 'NODE-0042'));
  assert.ok(searchEntries(data, { query: 'connector mirroring' }).some((entry) => entry.id === 'NODE-0071'));
});

test('generated viewer embeds the current records and valid offline JavaScript', async () => {
  const html = await readFile(new URL('../docs/changelog/index.html', import.meta.url), 'utf8');
  assert.ok(!html.includes('/* HISTORY_DATA */'));
  assert.ok(!html.includes('/* SEARCH_FUNCTION */'));
  assert.ok(!/<script[^>]+src=|<link[^>]+href="https?:/i.test(html));
  const inline = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  assert.doesNotThrow(() => new Script(inline));
  const embedded = JSON.parse(inline.match(/const data = (.*);\nconst escapeHtml/)[1]);
  assert.deepEqual(embedded, data);
});

test('changelog documentation links and explicit history anchors resolve', async () => {
  const pages = ['CHANGELOG.md', 'docs/changelog/README.md', 'docs/changelog/sources.md', ...new Set(data.entries.map((entry) => `docs/changelog/${entry.date.slice(0, 7)}.md`))];
  for (const page of pages) {
    const url = new URL(`../${page}`, import.meta.url);
    const markdown = await readFile(url, 'utf8');
    for (const match of markdown.matchAll(/\[[^\]]*\]\((?:<([^>]+)>|([^\s)]+))\)/g)) {
      const target = new URL(match[1] ?? match[2], url);
      if (target.protocol !== 'file:') continue;
      const anchor = target.hash.slice(1);
      target.hash = '';
      target.search = '';
      await access(target);
      if (anchor && target.pathname.endsWith('.md')) {
        const text = await readFile(target, 'utf8');
        assert.ok(text.includes(`id="${anchor}"`), `${page}: missing anchor ${anchor}`);
      }
    }
  }
});
