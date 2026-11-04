import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const historyDir = resolve(root, 'docs/changelog');
const allowed = {
  kind: ['added', 'changed', 'fixed', 'refactored', 'decision', 'review', 'docs'],
  state: ['implemented', 'superseded', 'historical', 'recorded', 'planned', 'deferred'],
  delivery: ['published', 'local', 'unconfirmed', 'not-applicable'],
  dateBasis: ['chat', 'known-by', 'backfill'],
};
const label = (value) => value.replaceAll('-', ' ').replace(/^./, (c) => c.toUpperCase());
const link = (path, text = path) => `[${text}](<${path}>)`;
const sorted = (entries) => [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
const dateText = (entry) => entry.dateBasis === 'known-by' ? `Known by ${entry.date}` : entry.dateBasis === 'backfill' ? `Backfilled ${entry.date}; original date uncertain` : entry.date;
const deliveryText = (entry) => entry.delivery === 'published' ? `Published by ${entry.publishedBy}` : label(entry.delivery);
const recordPath = (entry) => `${entry.date.slice(0, 7)}.md#${entry.id.toLowerCase()}`;

export function validate(data) {
  const errors = [];
  if (data.schemaVersion !== 1) errors.push('Unsupported schemaVersion');
  const sources = new Set(data.sources.map((source) => source.id));
  const releases = new Set(data.releases.map((release) => release.id));
  const ids = new Set(data.entries.map((entry) => entry.id));
  if (sources.size !== data.sources.length) errors.push('Duplicate source ID');
  if (releases.size !== data.releases.length) errors.push('Duplicate release ID');
  if (ids.size !== data.entries.length) errors.push('Duplicate entry ID');
  for (const entry of data.entries) {
    if (!/^NODE-\d{4,}$/.test(entry.id)) errors.push(`Invalid ID ${entry.id}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date) || Number.isNaN(Date.parse(entry.date)) || new Date(entry.date).toISOString().slice(0, 10) !== entry.date) errors.push(`${entry.id}: invalid date`);
    for (const [key, values] of Object.entries(allowed)) if (!values.includes(entry[key])) errors.push(`${entry.id}: invalid ${key}`);
    for (const key of ['title', 'summary']) if (typeof entry[key] !== 'string' || !entry[key].trim()) errors.push(`${entry.id}: missing ${key}`);
    for (const key of ['topics', 'sources']) if (!Array.isArray(entry[key]) || !entry[key].length || new Set(entry[key]).size !== entry[key].length) errors.push(`${entry.id}: invalid ${key}`);
    for (const source of entry.sources ?? []) if (!sources.has(source)) errors.push(`${entry.id}: unknown source ${source}`);
    if (entry.delivery === 'published' && !releases.has(entry.publishedBy)) errors.push(`${entry.id}: published entry needs a known publication`);
    if (entry.delivery !== 'published' && entry.publishedBy) errors.push(`${entry.id}: only published entries have publishedBy`);
    if (entry.delivery === 'published' && entry.dateBasis !== 'backfill') {
      const release = data.releases.find((item) => item.id === entry.publishedBy);
      if (release && entry.date > release.date) errors.push(`${entry.id}: change is dated after its publication`);
    }
    for (const target of entry.supersedes ?? []) {
      if (!ids.has(target) || target === entry.id) errors.push(`${entry.id}: invalid supersession ${target}`);
      else if (data.entries.find((item) => item.id === target).state !== 'superseded') errors.push(`${entry.id}: superseded target must have superseded state`);
    }
    for (const path of entry.evidence ?? []) if (!existsSync(resolve(root, path))) errors.push(`${entry.id}: missing evidence ${path}`);
  }
  for (const source of data.sources) if (source.path && !existsSync(resolve(root, source.path))) errors.push(`Missing source path ${source.path}`);
  const visit = (id, stack = new Set()) => {
    if (stack.has(id)) { errors.push(`Supersession cycle at ${id}`); return; }
    const next = new Set(stack).add(id);
    for (const target of data.entries.find((entry) => entry.id === id)?.supersedes ?? []) visit(target, next);
  };
  for (const id of ids) visit(id);
  if (errors.length) throw new Error(errors.join('\n'));
}

// Shared by the command-line search and the offline viewer.
export function searchEntries(data, filters = {}) {
  const normalize = (value) => String(value).toLowerCase().replaceAll('mithril', 'mythril').replace(/\bcommand(?=[ -]cores?\b)/g, 'complex');
  const words = normalize(filters.query ?? '').trim().split(/\s+/).filter(Boolean);
  const sources = new Map(data.sources.map((source) => [source.id, source]));
  return data.entries.filter((entry) => {
    for (const key of ['kind', 'state', 'delivery']) if (filters[key] && entry[key] !== filters[key]) return false;
    if (filters.topic && !entry.topics.includes(filters.topic)) return false;
    if (filters.from && entry.date < filters.from) return false;
    if (filters.to && entry.date > filters.to) return false;
    const text = normalize(JSON.stringify(entry) + entry.sources.map((id) => JSON.stringify(sources.get(id))).join(' '));
    return words.every((word) => text.includes(word));
  });
}

function renderEntry(entry, data) {
  const later = data.entries.filter((item) => item.supersedes?.includes(entry.id));
  const lines = [`<a id="${entry.id.toLowerCase()}"></a>`, `### ${entry.id} · ${entry.title}`, '', `**${dateText(entry)} · ${label(entry.kind)} · ${label(entry.state)} · ${deliveryText(entry)}**`, '', entry.summary, ''];
  if (entry.details?.length) lines.push(...entry.details.map((detail) => `- ${detail}`), '');
  lines.push(`Topics: ${entry.topics.join(' · ')}`, '');
  if (entry.supersedes?.length) lines.push(`Supersedes: ${entry.supersedes.map((id) => link(recordPath(data.entries.find((item) => item.id === id)), id)).join(', ')}`, '');
  if (later.length) lines.push(`Replaced by: ${later.map((item) => link(recordPath(item), item.id)).join(', ')}`, '');
  if (entry.validation) lines.push(`Verification: ${entry.validation}`, '');
  if (entry.evidence?.length) lines.push(`Files: ${entry.evidence.map((path) => link(`../../${path}`)).join(', ')}`, '');
  lines.push(`Sources: ${entry.sources.map((id) => link(`sources.md#${id}`, data.sources.find((source) => source.id === id).title)).join('; ')}`, '');
  return lines.join('\n');
}

function renderIndex(data) {
  const current = sorted(data.entries.filter((entry) => entry.delivery === 'local' && entry.state === 'implemented'));
  const months = [...new Set(data.entries.map((entry) => entry.date.slice(0, 7)))].sort().reverse();
  const topics = [...new Set(data.entries.flatMap((entry) => entry.topics))].sort();
  return [
    '# NODE: Another Factory Game — Changelog', '',
    'A searchable record of completed changes, design decisions, and relevant review findings. Stable NODE IDs can be cited in chats and searched in the repository.', '',
    `**${data.entries.length} records · ${[...data.entries].sort((a, b) => a.date.localeCompare(b.date))[0].date}–${sorted(data.entries)[0].date} · ${data.timezone}**`, '',
    `${link('docs/changelog/index.html', 'Open searchable history')} · ${link('docs/changelog/README.md', 'How to review and maintain it')} · ${link('docs/changelog/sources.md', 'Sources and coverage gaps')}`, '',
    '## Local changes awaiting publication', '',
    'These changes follow the latest confirmed game publication, e177479. Creating this log did not publish them.', '',
    '| ID | Change | Topics |', '| --- | --- | --- |',
    ...current.map((entry) => `| ${link(`docs/changelog/${recordPath(entry)}`, entry.id)} | ${entry.title} | ${entry.topics.join(', ')} |`), '',
    '## Dated history', '',
    ...months.map((month) => `- ${link(`docs/changelog/${month}.md`, month)} — ${data.entries.filter((entry) => entry.date.startsWith(month)).length} records`), '',
    '“Known by” dates are implementation/publication bounds, not exact change dates. “Backfilled” dates mark records with uncertain original dates. Supersession links explain reversals. Original-game records do not certify current rebuild behavior.', '',
    '## Published releases', '',
    ...data.releases.map((release) => `- ${release.date} — [${release.id}: ${release.title}](${release.url})${release.notes ? ` — ${release.notes}` : ''}`), '',
    'A record marked “Published by” was known in that snapshot; it may have appeared earlier. Local publication history was inspected without a network fetch.', '',
    '## Topics', '',
    ...topics.map((topic) => `- ${link(`docs/changelog/index.html?topic=${encodeURIComponent(topic)}`, topic)} (${data.entries.filter((entry) => entry.topics.includes(topic)).length})`), '',
    '## Search from the repository', '',
    '```powershell', 'npm run changelog -- --search "connector mirroring"', 'npm run changelog -- --search "grid snap"', 'rg -n -i "splitter|mythril|control group" docs/changelog/entries.json', '```', '',
    'The canonical records are in `docs/changelog/entries.json`. Markdown and the offline viewer are generated from that file; edit the records, then run `npm run changelog`.', '',
  ].join('\n');
}

function renderSources(data) {
  return ['# Sources and coverage', '', `Initial backfill: ${data.backfilledOn}. Dates use ${data.timezone}.`, '', data.coverage.summary, '', '## Gaps and evidence limits', '', ...data.coverage.gaps.map((gap) => `- ${gap}`), '',
    '## Sources', '', ...data.sources.flatMap((source) => [
      `<a id="${source.id}"></a>`, `### ${source.title}`, '',
      `Source ID: \`${source.id}\` · Type: ${source.type}`, '',
      ...(source.chatId ? [`Chat ID: \`${source.chatId}\``, ''] : []),
      ...(source.path ? [`File: ${link(`../../${source.path}`, source.path)}`, ''] : []),
      ...(source.url ? [`[Open source](${source.url})`, ''] : []),
      ...(source.notes ? [source.notes, ''] : []),
    ])].join('\n');
}

function renderViewer(data, template) {
  return template.replace('/* SEARCH_FUNCTION */', searchEntries.toString()).replace('/* HISTORY_DATA */', JSON.stringify(data).replaceAll('<', '\\u003c'));
}

export async function generate(data, check = false) {
  validate(data);
  const template = await readFile(resolve(historyDir, 'viewer.template.html'), 'utf8');
  const files = new Map([
    [resolve(root, 'CHANGELOG.md'), renderIndex(data)],
    [resolve(historyDir, 'sources.md'), renderSources(data)],
    [resolve(historyDir, 'index.html'), renderViewer(data, template)],
  ]);
  for (const month of new Set(data.entries.map((entry) => entry.date.slice(0, 7)))) {
    const records = sorted(data.entries.filter((entry) => entry.date.startsWith(month)));
    files.set(resolve(historyDir, `${month}.md`), [`# ${month} — NODE change history`, '', `${link('../../CHANGELOG.md', 'Changelog index')} · ${link('index.html', 'Searchable view')} · ${link('sources.md', 'Sources and date limits')}`, '', 'Generated from entries.json. Known-by dates are bounds; backfilled dates do not assert the original sequence. Follow supersession links for reversals.', '', ...records.map((entry) => renderEntry(entry, data))].join('\n'));
  }
  const stale = [];
  for (const [path, content] of files) {
    if (check) {
      let actual;
      try { actual = await readFile(path, 'utf8'); } catch { /* Missing generated files are reported as stale. */ }
      if (actual !== content) stale.push(relative(root, path));
    } else {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, content, 'utf8');
    }
  }
  if (stale.length) throw new Error(`Regenerate changelog: ${stale.join(', ')}`);
  return files;
}

async function main() {
  const data = JSON.parse(await readFile(resolve(historyDir, 'entries.json'), 'utf8'));
  const args = process.argv.slice(2);
  if (args.includes('--search')) {
    const query = args.slice(args.indexOf('--search') + 1).join(' ');
    for (const entry of sorted(searchEntries(data, { query }))) console.log(`${entry.id} | ${dateText(entry)} | ${deliveryText(entry)} | ${entry.title}\n  ${entry.summary}`);
  } else if (args.includes('--next-id')) {
    console.log(`NODE-${String(Math.max(...data.entries.map((entry) => Number(entry.id.slice(5)))) + 1).padStart(4, '0')}`);
  } else {
    const files = await generate(data, args.includes('--check'));
    console.log(`${args.includes('--check') ? 'Checked' : 'Generated'} ${files.size} files from ${data.entries.length} changelog entries.`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
