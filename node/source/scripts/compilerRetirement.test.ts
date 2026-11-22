import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const root = resolve('.');
const archive = join(root, 'scripts/archive/progression-proposal');
const fixtures: string[] = [];
afterEach(() => {
  for (const directory of fixtures.splice(0)) {
    const target = resolve(directory);
    if (dirname(target) !== resolve(tmpdir()) || !basename(target).startsWith('node-retired-compiler-')) {
      throw new Error(`Unexpected compiler fixture cleanup target: ${target}`);
    }
    rmSync(target, { recursive: true, force: true });
  }
});
function tree(directory: string): Record<string, string> {
  return Object.fromEntries(readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile()).map(entry => {
      const path = join(entry.parentPath, entry.name);
      return [path.slice(directory.length + 1), createHash('sha256').update(readFileSync(path)).digest('hex')];
    }));
}
function sandbox(populated: boolean) {
  const directory = mkdtempSync(join(tmpdir(), 'node-retired-compiler-'));
  fixtures.push(directory);
  const copy = (source: string, target: string) => {
    const path = join(directory, target); mkdirSync(dirname(path), { recursive: true }); copyFileSync(source, path);
  };
  // Run a copy in a disposable workspace: a regression must never invoke the old writer in this checkout.
  copy(join(root, 'scripts/sync-progression-content.mjs'), 'scripts/sync-progression-content.mjs');
  if (populated) {
    copy(join(archive, 'apply-reviewed-production.mjs.txt'), 'scripts/apply-reviewed-production.mjs');
    copy(join(archive, 'core-design.json'), 'outputs/progression/core-design.json');
    copy(join(archive, 'waste-design.json'), 'outputs/progression/waste-design.json');
    copy(join(root, 'src/content/progression.ts'), 'src/content/progression.ts');
    writeFileSync(join(directory, 'src/content/unrelated.ts'), 'export const keep = "untouched";\n');
  }
  return directory;
}
function expectRefusal(directory: string, args: string[]) {
  const before = tree(directory);
  const result = spawnSync(process.execPath, args, { cwd: directory, encoding: 'utf8', timeout: 10000 });
  expect(result.error).toBeUndefined();
  expect(result.signal).toBeNull();
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('Retired');
  expect(result.stderr).toContain('docs/systems/recipes.md');
  expect(result.stderr).toContain('scripts/archive/progression-proposal/README.md');
  expect(tree(directory)).toEqual(before);
}

describe('retired progression proposal compiler', () => {
  it('refuses the old command even with the original inputs and a current catalog present', () => {
    expectRefusal(sandbox(true), ['scripts/sync-progression-content.mjs']);
  });
  it('reports retirement without reading missing inputs or creating a catalog', () => {
    expectRefusal(sandbox(false), ['scripts/sync-progression-content.mjs']);
  });
  it.each([['--force'], ['--output', 'src/content/progression.ts']])('has no source-write bypass for %j', (...args) => {
    expectRefusal(sandbox(true), ['scripts/sync-progression-content.mjs', ...args]);
  });
  it('has no source-write side effect when imported by other tooling', () => {
    expectRefusal(sandbox(true), ['--input-type=module', '--eval', 'await import("./scripts/sync-progression-content.mjs")']);
  });
  it('retains the original compiler, helper and analytical inputs as inert, checksummed evidence', () => {
    const manifest = JSON.parse(readFileSync(join(archive, 'manifest.json'), 'utf8')) as {
      files: Array<{ originalPath: string; path: string; bytes: number; sha256: string }>;
    };
    expect(manifest.files.map(file => file.originalPath)).toEqual([
      'scripts/sync-progression-content.mjs', 'scripts/apply-reviewed-production.mjs',
      'outputs/progression/core-design.json', 'outputs/progression/waste-design.json',
    ]);
    for (const file of manifest.files) {
      const bytes = readFileSync(join(archive, file.path));
      expect(bytes.length).toBe(file.bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(file.sha256);
      if (file.originalPath.endsWith('.mjs')) expect(file.path.endsWith('.mjs.txt')).toBe(true);
    }
  });
});
