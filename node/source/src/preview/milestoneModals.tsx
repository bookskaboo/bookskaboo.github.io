import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createInitialState, GameEngine } from '../simulation/engine';
import { generateSector } from '../simulation/worldGeneration';
import { UiTooltipLayer } from '../ui/components/UiTooltipLayer';
import { RecipesPanel } from '../ui/RecipesPanel';
import { ResearchPanel } from '../ui/ResearchPanel';
import '../styles.css';

const stages = { opening: 'Opening factory', hydro: 'Hydro to Mythril', endgame: 'The four corners' };
type Stage = keyof typeof stages;
type Preview = { kind: 'recipe'; id: string } | { kind: 'closed' };

function makePreviewEngine(stage: Stage) {
  const game = createInitialState(321);
  if (stage === 'opening') return new GameEngine(game, { autosave: false });

  const completed = ['joint', 'kiln', 'smelter', 'refiner', 'researchCenter', 'assembler', 'splitter', 'merger',
    'exploration', 'road', 'automataCore', 'fabricatorTools', 'lakeTools', 'hydrochemistry', 'hydraulicAssembly',
    'fluidRouting', 'suppressionBot'];
  if (stage === 'endgame') completed.push('sealedRobotics', 'mithrilTools', 'oreSeparation', 'precisionControl', 'heavyRobotics', 'treePlanter');
  game.research.completed = completed;
  game.research.unlocked.push(...completed);
  game.research.selected = stage === 'endgame' ? 'commandRobotics' : 'sealedRobotics';
  game.research.contributed = { 'simple-core': 1, 'basic-core': 1, 'automata-core': 1, 'hydro-core': 1 };
  game.research.mapPoints = 1;
  game.produced = { 'simple-core': 20, 'basic-core': 20, 'automata-core': 10, 'hydro-core': 4,
    ...(stage === 'endgame' ? { 'shiny-core': 4, 'command-core': 2 } : {}) };
  game.encounters = ['lake'];
  game.dwarvenMythrilProduced = stage === 'endgame';
  game.sectors['5,5'].nodes.push({
    id: 'preview-lab', name: 'Research Center', kind: 'researchCenter', x: 650, y: 420, rotation: 0,
    input: {}, output: {}, progressMs: 0, cycleMs: 5000, constructedAt: 0, constructionMs: 0,
  });
  const path = stage === 'hydro' ? [[6, 5], [7, 5]] : [
    [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [10, 6], [10, 7], [10, 8], [10, 9], [10, 10],
  ];
  for (const [x, y] of path) {
    const sector = generateSector(x, y, game.seed, 0, completed);
    game.sectors[sector.id] = { ...sector, unlocked: true, visited: true };
  }
  return new GameEngine(game, { autosave: false });
}

function ModalPreview() {
  const [stage, setStage] = useState<Stage>('hydro');
  const [engine, setEngine] = useState(() => makePreviewEngine('hydro'));
  const [preview, setPreview] = useState<Preview>();
  const [, refresh] = useState(0);
  useEffect(() => engine.subscribe(() => refresh(value => value + 1)), [engine]);
  const game = engine.getState();
  const showResearch = () => setPreview(undefined);

  return <>
    <UiTooltipLayer />
    <header className="milestone-preview-toolbar">
      <h1>NODE · Milestone modal preview</h1>
      <label>Example factory
        <select value={stage} onChange={event => {
          const next = event.target.value as Stage;
          setStage(next);
          setEngine(makePreviewEngine(next));
          showResearch();
        }}>
          {Object.entries(stages).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      </label>
      <button type="button" onClick={showResearch}>Open Research</button>
    </header>
    {(!preview || preview.kind === 'recipe') && <div hidden={Boolean(preview)}>
      <ResearchPanel key={stage} game={game} engine={engine}
        onClose={() => setPreview({ kind: 'closed' })}
        onOpenRecipe={id => setPreview({ kind: 'recipe', id })} />
    </div>}
    {preview?.kind === 'recipe' && <RecipesPanel game={game} initialRecipeId={preview.id} backToResearch onClose={showResearch} />}
    {preview?.kind === 'closed' && <p className="milestone-preview-status" role="status">
      Choose an example factory or reopen Research.
    </p>}
  </>;
}

createRoot(document.getElementById('root')!).render(<ModalPreview />);
