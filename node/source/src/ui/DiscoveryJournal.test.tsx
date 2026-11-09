import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import type { GameEvent } from '../domain/types';
import { createInitialState } from '../simulation/engine';
import { DiscoveryJournal } from './DiscoveryJournal';

it('renders discoveries, research, and achievements newest first, with untimed entries last', () => {
  const game = createInitialState(301);
  game.research.unlocked = ['kiln'];
  game.research.completed = ['exploration', 'assembler'];
  game.discoveryTimes = { kiln: 18002 };
  game.achievements = ['oops'];
  game.achievementTimes = { oops: 12344 };
  const exploration: GameEvent = {
    id: 'explored', type: 'ResearchCompleted', projectId: 'exploration', message: 'Exploration completed.',
    at: 20000, elapsedMs: 12341,
  };
  game.researchLog = [exploration];
  game.events = [exploration];

  const html = renderToStaticMarkup(<DiscoveryJournal game={game} onClose={() => {}} onOpen={() => {}} />);
  const titles = [...html.matchAll(/<h3>([^<]+)<\/h3>/g)].map(match => match[1]);
  expect(titles.slice(0, 3)).toEqual(['Kiln', 'Oops.', 'Exploration']);
  expect(titles.filter(title => title === 'Exploration')).toHaveLength(1);
  expect(titles.at(-1)).toBe('Assembler');
  expect(html.match(/>0:12\.34<\/time>/g)).toHaveLength(2);
  expect(html).toContain('Time not recorded');
});
