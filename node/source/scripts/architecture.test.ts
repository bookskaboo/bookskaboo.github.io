import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getResearchProject, RESEARCH_PROJECTS } from '../src/content/research';
import * as keys from '../src/persistence/storageKeys';

function runtimeFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = join(directory, entry.name);
    return entry.isDirectory() ? runtimeFiles(file) : /\.tsx?$/.test(file) && !file.endsWith('.test.ts') ? [file] : [];
  });
}

describe('game module contracts', () => {
  it('keeps domain, simulation, and persistence independent of renderer and UI modules', () => {
    const files = ['domain', 'simulation', 'persistence'].flatMap(directory => runtimeFiles(resolve('src', directory)));
    for (const file of files) {
      const imports = [...readFileSync(file, 'utf8').matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)];
      for (const [, source] of imports) {
        if (!source.startsWith('.')) continue;
        const target = resolve(file, '..', source);
        expect(relative(resolve('src'), target), file).not.toMatch(/^(renderer|ui)[\\/]/);
      }
    }
  });

  it('retains every persisted browser key verbatim', () => {
    expect(keys).toMatchObject({
      SAVE_KEY: 'factorinode.save-slots.v1',
      AUTOSAVE_KEY: 'factorinode.temporary-save.v1',
      SHORTCUT_BARS_KEY: 'factorinode.shortcut-bars.v1',
      SHORTCUT_BAR_GROUPS_KEY: 'factorinode.shortcut-bar-groups.v1',
      SHORTCUT_UNLOCKS_KEY: 'factorinode.shortcut-unlocks.v1',
      SHORTCUT_NEW_ASSIGNMENTS_KEY: 'factorinode.shortcut-new-assignments.v1',
      NODE_MAP_LAYOUT_KEY: 'factorinode.node-map-layout.v1',
    });
  });

  it('returns the existing catalog objects from indexed research lookups', () => {
    for (const project of RESEARCH_PROJECTS) expect(getResearchProject(project.id)).toBe(project);
    expect(getResearchProject(undefined)).toBeUndefined();
    expect(getResearchProject('not-a-research-project')).toBeUndefined();
  });
});
