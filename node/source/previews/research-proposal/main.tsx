import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CORE_RESEARCH } from '../../src/content/coreResearch';
import { RESEARCH_PROJECTS, refreshResearchLookup } from '../../src/content/research';
import { createInitialState, GameEngine } from '../../src/simulation/engine';
import { HISTORICAL_RESEARCH, MACHINE_EFFICIENCY_FAMILIES, UPGRADE_PLAN, pricePerLine, proposedResearchCatalog } from './model';
import '../../src/styles.css';
import './preview.css';

const params = new URLSearchParams(location.search);
const mode = params.get('mode') === 'current' ? 'current' : 'planned';
const stages = ['Refiner', 'Basic', 'Automata', 'Hydro', 'Shiny', 'Complex'] as const;
const stage = stages.find(value => value.toLowerCase() === params.get('stage')) ?? 'Automata';
const baseline = structuredClone(HISTORICAL_RESEARCH);
const state = createInitialState(204);
state.paused = true;
state.tutorialPromptsSeen = ['expansion', 'monster-camps'];
state.research.completed = [
  'kiln', 'smelter', 'refiner', 'simpleCore', 'researchCenter', 'joint',
];
if (stage !== 'Refiner') state.research.completed.push('assembler', 'basicCore', 'splitter', 'merger');
if (!['Refiner', 'Basic'].includes(stage)) state.research.completed.push(
  'exploration', 'road', 'automataCore', 'fabricatorTools', 'lakeTools', 'suppressionBot', 'treePlanter',
);
if (['Hydro', 'Shiny', 'Complex'].includes(stage)) state.research.completed.push(
  'hydrochemistry', 'hydraulicAssembly', 'hydroCore', 'fluidRouting', 'sealedRobotics',
);
if (['Shiny', 'Complex'].includes(stage)) state.research.completed.push('mithrilTools', 'oreSeparation', 'shinyCore');
if (stage === 'Complex') state.research.completed.push(
  'precisionControl', 'complexCore', 'sortingTools', 'mineralRecovery', 'heavyRobotics', 'commandRobotics',
);
const tier = CORE_RESEARCH.findIndex(core => core.name === `${stage} Core`);
state.produced = Object.fromEntries(CORE_RESEARCH.slice(0, tier + 1).map(({ item }) => [item, 1]));
state.research.unlocked = ['extractor', ...state.research.completed];
const engine = new GameEngine(state, { autosave: false });
// This catalog exists only in this preview document's JavaScript context.
if (mode === 'planned') {
  RESEARCH_PROJECTS.splice(0, RESEARCH_PROJECTS.length, ...proposedResearchCatalog(baseline));
  refreshResearchLookup();
}

// Load the shared catalog browser after installing this document's proposal.
const [{ ResearchPanel }, { ResearchTreeModal }, { RecipesPanel }] = await Promise.all([
  import('../../src/ui/ResearchPanel'), import('../../src/ui/ResearchTreeModal'), import('../../src/ui/RecipesPanel'),
]);

function navigate(key: string, value: string) {
  const query = new URLSearchParams(location.search);
  query.set(key, value);
  location.search = query.toString();
}

function revealTreeProject(id: string | undefined) {
  if (!id) return;
  const button = document.querySelector<HTMLElement>(`[data-tree-research="${id}"]`);
  const tile = button?.closest<HTMLElement>('.research-tree-tile');
  const scroller = button?.closest<HTMLElement>('.research-tree-scroll');
  if (tile && scroller) scroller.scrollTo({ top: Math.max(0, tile.offsetTop - scroller.clientHeight * .4) });
}

function ResearchPreview() {
  const [view, setView] = useState(params.get('view') === 'tree' ? 'tree' : 'page');
  const [focused, setFocused] = useState<string | undefined>(mode === 'planned' ? 'extractor3' : 'extractor1');
  const [recipe, setRecipe] = useState<string>();
  const [open, setOpen] = useState(true);
  const [, render] = useState(0);
  useEffect(() => engine.subscribe(() => render(value => value + 1)), []);
  useEffect(() => {
    if (view !== 'tree') return;
    let nextFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      nextFrame = requestAnimationFrame(() => revealTreeProject(focused));
    });
    return () => { cancelAnimationFrame(firstFrame); cancelAnimationFrame(nextFrame); };
  }, [view, focused]);
  const originalPrice = pricePerLine(baseline);
  const proposedPrice = pricePerLine(proposedResearchCatalog(baseline));
  const switchView = (next: string) => { setView(next); setRecipe(undefined); setOpen(true); };
  const inspect = (id: string) => { setFocused(id); switchView('page'); };

  return <main className="research-preview">
    <header className="proposal-toolbar">
      <div className="proposal-heading"><h1>Research proposal</h1><span>Preview</span></div>
      <div className="proposal-controls">
        <div className="proposal-segment" aria-label="Research version">
          <button aria-pressed={mode === 'planned'} onClick={() => navigate('mode', 'planned')}>Planned</button>
          <button aria-pressed={mode === 'current'} onClick={() => navigate('mode', 'current')}>Current</button>
        </div>
        <label>Progress <select value={stage} onChange={event => navigate('stage', event.target.value.toLowerCase())}>
          {stages.map(value => <option key={value}>{value}</option>)}
        </select></label>
        <div className="proposal-segment" aria-label="Research view">
          <button aria-pressed={view === 'page' && !recipe} onClick={() => switchView('page')}>Research page</button>
          <button aria-pressed={view === 'tree' && !recipe} onClick={() => switchView('tree')}>Research tree</button>
        </div>
        {view === 'tree' && <button onClick={() => revealTreeProject(focused)}>Jump to selected project</button>}
        <button className="proposal-reset" onClick={() => location.reload()}>Reset preview</button>
      </div>
    </header>
    <div className="proposal-layout">
      <section className="proposal-stage" aria-label="Interactive research preview">
        {!open ? <button className="proposal-reopen" onClick={() => setOpen(true)}>Open research</button>
          : recipe ? <RecipesPanel game={engine.getState()} initialRecipeId={recipe} backToResearch onClose={() => setRecipe(undefined)} />
          : view === 'tree' ? <ResearchTreeModal key={mode} game={engine.getState()} focusProjectId={focused}
            onInspect={inspect} onClose={() => switchView('page')} />
          : <ResearchPanel key={focused} game={engine.getState()} engine={engine} focusProjectId={focused}
            showMilestones={false} onClose={() => setOpen(false)} onOpenRecipe={setRecipe}
            onOpenMap={() => setFocused('exploration')} />}
      </section>
      <aside className="proposal-schedule">
        <h2>Planned upgrade schedule</h2>
        <p>Optional paid projects start after Automata Core research. Each machine has four efficiency ranks.</p>
        <div className="proposal-table-wrap">
          <table>
            <caption>Each price includes every Core from Simple through the named tier.</caption>
            <thead><tr><th>Rank / tier</th><th>Cycle</th><th>Core cost</th></tr></thead>
            <tbody>{UPGRADE_PLAN.map((rank, index) => <tr key={rank.access}>
              <th scope="row">{index + 1} · {rank.tier}</th>
              <td>{100 - rank.reduction}%</td><td>{rank.each} each<br /><small>{rank.each * rank.savedRank} total</small></td>
            </tr>)}</tbody>
          </table>
        </div>
        <p className="proposal-budget"><strong>{originalPrice} → {proposedPrice} Cores</strong><span>All ranks for one machine, {Math.round((1 - proposedPrice / originalPrice) * 100)}% fewer Cores.</span></p>
        <p>{MACHINE_EFFICIENCY_FAMILIES.length * 6} → {MACHINE_EFFICIENCY_FAMILIES.length * 4} machine-upgrade projects. Fully researched cycles still take 40% of base time.</p>
        <p>Splitter and Merger unlock together after any Refiner produces its first item.</p>
        <p>Road and Exploration cost 5 Simple Cores each and open after Simple Core research.</p>
        <p>Other optional projects keep their current prices in this draft.</p>
        <p className="proposal-scope">Preview selections and project starts stay in this page. Reset preview restores the example.</p>
      </aside>
    </div>
  </main>;
}

createRoot(document.getElementById('root')!).render(<ResearchPreview />);
