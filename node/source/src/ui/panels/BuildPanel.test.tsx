import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { createInitialState } from '../../simulation/engine';
import { BuildPanel } from './BuildPanel';

it('lists the unlocked Mining Drill in Production after removing the Extraction tab', () => {
  const game = createInitialState(1);
  game.research.unlocked.push('miningDrill');
  const html = renderToStaticMarkup(<BuildPanel game={game} category="Production" showAllNodes={false}
    canBuild={() => true} setCategory={() => {}} onChoose={() => {}} onClose={() => {}} />);

  expect(html).toContain('class="active">Production</button>');
  expect(html).toContain('data-build-kind="miningDrill"');
  expect(html).not.toContain('>Extraction</button>');
});
