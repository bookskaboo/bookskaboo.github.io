import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { createInitialState, GameEngine } from '../simulation/engine';
import { ResearchPanel } from './ResearchPanel';

it.each([
  ['extractor1', 'Start research'],
  ['assembler', 'Cancel research'],
  ['victory', 'Locked'],
  ['joint', 'Automatic'],
  ['kiln', 'Complete'],
])('shows the appropriate action or status for %s in the center card', (focusProjectId, action) => {
  const state = createInitialState(1);
  state.research.completed = ['kiln', 'smelter', 'refiner', 'researchCenter'];
  state.research.selected = 'assembler';
  const engine = new GameEngine(state, { autosave: false });
  const html = renderToStaticMarkup(<ResearchPanel game={engine.getState()} engine={engine} focusProjectId={focusProjectId}
    onClose={() => {}} onOpenRecipe={() => {}} />);
  const active = html.indexOf('aria-label="Active project"');
  const inspected = html.indexOf(`data-project-detail="${focusProjectId}"`);
  const milestones = html.indexOf('aria-label="Obligatory hand holding"');
  const catalog = html.indexOf('aria-label="Research"');
  expect(active).toBeGreaterThan(-1);
  expect(inspected).toBeGreaterThan(active);
  expect(milestones).toBeGreaterThan(inspected);
  expect(catalog).toBeGreaterThan(milestones);
  expect(html.slice(active, milestones)).toContain('data-research-id="assembler"');
  expect(html.match(/data-research-id="assembler"/g)).toHaveLength(1);
  const header = html.slice(inspected, html.indexOf('</header>', inspected));
  expect(header).toContain(`>${action}</`);
  if (action === 'Start research') {
    expect(header).toMatch(/<button [^>]*data-start-research="extractor1"[^>]*>Start research<\/button>/);
    expect(header).not.toMatch(/<button [^>]*disabled[^>]*>Start research/);
  } else {
    expect(header).not.toContain('data-start-research');
  }
  const hint = html.slice(milestones, catalog);
  expect(hint.match(/class="research-milestone"/g)).toHaveLength(1);
  expect(hint).toContain('class="research-milestone" aria-label="Hold to reveal research hint"');
  expect(hint).toContain('Hold to reveal hint');
  expect(hint).not.toContain('role="switch"');
  expect(html.slice(catalog)).toMatch(/data-research-id="joint"[^>]+class="research-card reachable milestone"/);
  expect(html.slice(catalog)).toMatch(/data-research-id="victory"[^>]+class="research-card locked"/);
  expect(html).not.toContain('Automatic unlocks');
});
