import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { createInitialState, GameEngine } from '../simulation/engine';
import { ResearchPanel } from './ResearchPanel';

it('renders one active card beside three milestone cards and merges triggers into the research catalog', () => {
  const state = createInitialState(1);
  state.research.completed = ['kiln', 'smelter', 'refiner', 'researchCenter'];
  state.research.selected = 'assembler';
  const engine = new GameEngine(state, { autosave: false });
  const html = renderToStaticMarkup(<ResearchPanel game={engine.getState()} engine={engine}
    onClose={() => {}} onOpenRecipe={() => {}} />);
  const active = html.indexOf('aria-label="Active project"');
  const milestones = html.indexOf('aria-label="Obligatory hand holding"');
  const catalog = html.indexOf('aria-label="Research"');
  expect(active).toBeGreaterThan(-1);
  expect(milestones).toBeGreaterThan(active);
  expect(catalog).toBeGreaterThan(milestones);
  expect(html.slice(active, milestones)).toContain('data-research-id="assembler"');
  expect(html.match(/data-research-id="assembler"/g)).toHaveLength(1);
  expect(html.slice(milestones, catalog).match(/<li class="research-milestone">/g)).toHaveLength(3);
  expect(html.slice(catalog)).toMatch(/data-research-id="joint"[^>]+class="research-card reachable milestone"/);
  expect(html.slice(catalog)).toMatch(/data-research-id="victory"[^>]+class="research-card locked"/);
  expect(html).not.toContain('Automatic unlocks');
});
