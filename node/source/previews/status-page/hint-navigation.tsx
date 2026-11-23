import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ASSIGNMENT, BOT_UPGRADES } from '../../src/content/botUpgrades';
import { PanelHeader } from '../../src/ui/PanelHeader';
import { Dialog } from '../../src/ui/components/Dialog';
import { FactoryApp } from '../../src/ui/App';
import type { TrainingSession } from '../../src/ui/Tutorials';
import { TUTORIAL_NAMES, type TutorialKind } from '../../src/tutorials/tutorialRuntime';
import { RecipesPanel } from '../../src/ui/RecipesPanel';
import { UiTooltipLayer } from '../../src/ui/components/UiTooltipLayer';
import { RobotPortrait } from '../../src/ui/upgrades/RobotPortrait';
import { BotUpgrade } from '../../src/ui/upgrades/BotUpgrade';
import { ResearchListRow } from '../../src/ui/upgrades/ResearchListRow';
import { ResearchQueue } from '../../src/ui/upgrades/ResearchQueue';
import { destinationDescription, hintTutorialPractice, type HintDestination } from './hintNavigation';
import { HINT_EXAMPLES, hintExampleVariants, type HintVariant } from './hintNavigationCatalog';
import { mapStudyResearchList, type MapStudyFilter } from './mapUpgrades';
import { implementationHintSnapshot, implementationHintDestination, implementationHintRecommendation, implementationResearchView, implementationDestinationName } from './hintImplementation';
import { hintPreviewTitle } from './hintTitles';
import '../../src/styles.css';
import './hint-navigation.css';

/** Production-shaped thought control. Its supplied review sequence is deliberately unrestricted. */
function ActionHint({ clue, index, proposed, destination, onBrowse, onNavigate }: {
  clue: { title: string; detail: string }; index: number; proposed: boolean; destination?: HintDestination;
  onBrowse(index: number): void; onNavigate(): void;
}) {
  return <section className="robot-hint-browser proposed-hint" aria-label="Robot thoughts" tabIndex={0}
    onKeyDown={event => { const next = event.key === 'ArrowLeft' ? index - 1 : event.key === 'ArrowRight' ? index + 1 : -1;
      if (next >= 0 && next < HINT_EXAMPLES.length) { event.preventDefault(); onBrowse(next); } }}>
    <div className="robot-hint-content"><div className="robot-hint-sizer" aria-hidden="true"><strong>Your assignment</strong><p>{ASSIGNMENT}</p></div>
      <div className="robot-hint-copy" aria-live="polite" aria-atomic="true"><strong>{clue.title}</strong><p>{clue.detail}</p></div></div>
    <nav className="robot-hint-navigation" aria-label="Browse all preview hints">
      <button className="hint-previous" aria-label="Previous hint" disabled={index === 0} onClick={() => onBrowse(index - 1)}><span aria-hidden="true"/></button>
      {proposed && destination && <button className="hint-context-action"
      aria-label={destinationDescription(destination)} title={destinationDescription(destination)}
      onClick={onNavigate}>Show me</button>}
      <button className="hint-next" aria-label="Next hint" disabled={index >= HINT_EXAMPLES.length - 1} onClick={() => onBrowse(index + 1)}><span aria-hidden="true"/></button>
    </nav>
  </section>;
}

function Study() {
  const [snapshot, setSnapshot] = useState(() => implementationHintSnapshot('assignment'));
  const { id: example, variant, engine, clue } = snapshot;
  const [showNotes, setShowNotes] = useState(false);
  const [proposed, setProposed] = useState(true);
  const [, update] = useState(0);
  const [filter, setFilter] = useState<MapStudyFilter>('map');
  const [query, setQuery] = useState('');
  const [completed, setCompleted] = useState(false);
  const [selected, setSelected] = useState<string>();
  const [highlight, setHighlight] = useState<string>();
  const [focusRequest, setFocusRequest] = useState(0);
  const [recipe, setRecipe] = useState<string>();
  const [tutorial, setTutorial] = useState<TutorialKind>();
  const [practice, setPractice] = useState<TrainingSession>();
  const [open, setOpen] = useState(true);
  const [message, setMessage] = useState('');
  const [receipt, setReceipt] = useState('');
  const actionRef = useRef<HTMLElement | null>(null);
  const game = engine.getState();
  const reviewIndex = HINT_EXAMPLES.findIndex(entry => entry.id === example);
  const review = HINT_EXAMPLES[reviewIndex];
  const recommendation = implementationHintRecommendation(game, example, clue.title);
  const destination = implementationHintDestination(game, example, clue.title);
  const variants = hintExampleVariants(example);
  const displayClue = { ...clue, title: proposed ? hintPreviewTitle(example, variant) : clue.title };
  const { projects, mapProject } = mapStudyResearchList(game, filter, query, completed);
  useEffect(() => engine.subscribe(() => update(value => value + 1)), [engine]);
  const reset = (next: string, nextVariant: HintVariant = 'default') => { setSnapshot(implementationHintSnapshot(next, nextVariant)); setFilter('map'); setQuery(''); setCompleted(false);
    setSelected(undefined); setHighlight(undefined); setRecipe(undefined); setTutorial(undefined); setPractice(undefined); setOpen(true); setMessage(''); setReceipt(''); };
  const browse = (index: number) => { reset(HINT_EXAMPLES[index].id);
    requestAnimationFrame(() => document.querySelector<HTMLElement>('.proposed-hint')?.focus({ preventScroll: true })); };
  const returnToHints = () => { setRecipe(undefined); setTutorial(undefined); setPractice(undefined); setOpen(true);
    requestAnimationFrame(() => actionRef.current?.isConnected && actionRef.current.focus({ preventScroll: true })); };
  const navigate = (target: HintDestination) => {
    actionRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (target.kind === 'tutorial') { setTutorial(target.id); setReceipt(`${TUTORIAL_NAMES[target.id]} tutorial opened. Practice starts only when you choose Start.`); return; }
    setQuery(''); setFilter(implementationResearchView(target.id)); setCompleted(false); setSelected(target.id); setHighlight(target.id);
    setFocusRequest(value => value + 1);
    const bot = BOT_UPGRADES.find(upgrade => upgrade.id === target.id);
    setReceipt(bot ? `${bot.label} highlighted. Choose Upgrade when you are ready.` : `${implementationDestinationName(target.id)} selected. Choose Queue research when you are ready.`);
  };
  useLayoutEffect(() => { const list = document.querySelector<HTMLElement>('.hint-study .status-stage-list'); if (list) list.scrollTop = 0; }, [engine]);
  useLayoutEffect(() => { if (!highlight || recipe) return;
    const card = document.querySelector<HTMLElement>(`[data-research-id="${highlight}"], [data-bot-upgrade="${highlight}"] .bot-upgrade-button`); card?.scrollIntoView({ block: 'nearest', behavior: 'auto' }); card?.focus({ preventScroll: true });
  }, [highlight, focusRequest, recipe]);
  const openRecipe = (id: string) => { actionRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; setRecipe(id); };
  const queue = (id?: string) => { if (!id) { setMessage('Select a research card first.'); return; }
    const result = engine.queueResearch(id); setMessage(result === 'added' ? '' : result === 'duplicate' ? 'That project is already queued.' : result === 'full' ? 'Queue full.' : 'This research is not available yet.'); };
  const startPractice = (kind: TutorialKind) => { setTutorial(undefined); setPractice({ id: crypto.randomUUID(), kind, engine: hintTutorialPractice(kind) }); };
  return <><main hidden={Boolean(practice)} className={`hint-study hint-implementation upgrades-modal-scope${showNotes ? ' show-review-notes' : ''}`}>
    <header className="hint-study-header"><div><strong>NODE</strong><span>Implementation preview</span></div>
      <div className="hint-study-controls"><label>Hint <select aria-label="Hint example" value={example} onChange={event => reset(event.target.value)}>{HINT_EXAMPLES.map((item, index) => <option key={item.id} value={item.id}>{proposed ? `${String(index + 1).padStart(2, '0')} · ${hintPreviewTitle(item.id)}` : item.name}</option>)}</select></label>
        {variants.length > 1 && <label>Situation <select aria-label="Hint situation" value={variant} onChange={event => reset(example, event.target.value as HintVariant)}>{variants.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
        <button aria-expanded={showNotes} aria-controls="hint-author-notes" onClick={() => setShowNotes(!showNotes)}>Review notes</button><button onClick={() => reset(example, variant)}>Reset example</button></div>
    </header>
    <div className="hint-preview-exception">Preview exception: all {HINT_EXAMPLES.length} hint snapshots are available. Choosing a hint loads its stage so you can try the whole progression.</div>
    <section id="hint-author-notes" hidden={!showNotes} className="hint-author-notes" aria-label="Review notes">
    <div role="group" aria-label="Compare hint designs"><button aria-pressed={!proposed} onClick={() => { setProposed(false); setHighlight(undefined); }}>Current</button><button aria-pressed={proposed} onClick={() => setProposed(true)}>With navigation</button></div>
    <div className="hint-review-navigation"><button disabled={reviewIndex === 0} onClick={() => reset(HINT_EXAMPLES[reviewIndex - 1].id)}>Previous review hint</button><span>{reviewIndex + 1} / {HINT_EXAMPLES.length} · Existing hint order</span><button disabled={reviewIndex === HINT_EXAMPLES.length - 1} onClick={() => reset(HINT_EXAMPLES[reviewIndex + 1].id)}>Next review hint</button>
      </div>
    <section className="hint-review-recommendation" aria-label="Hint recommendation"><div><small>{review.group} · {proposed ? 'Proposed title' : 'Current title'}</small><h1>{displayClue.title}</h1><p>{clue.detail}</p><details><summary>Reference and appearance</summary><p>Reference: {clue.title}</p><p>{review.appears}</p><p>{review.advances}</p></details></div>
      <div><small>{recommendation.status}</small><h2>{recommendation.label}</h2><p>{recommendation.why}</p><h3>Suggested expansion</h3><p>{recommendation.next}</p></div></section>
    <details className="hint-review-catalog"><summary>All {HINT_EXAMPLES.length} hints in order</summary><ol>{HINT_EXAMPLES.map(item => <li key={item.id}><button aria-current={item.id === example ? 'step' : undefined} onClick={() => reset(item.id)}>{proposed ? hintPreviewTitle(item.id) : item.title}</button></li>)}</ol></details>
    <p className="hint-study-note"><b>Show me</b> focuses research or offers an existing, relevant tutorial. New lesson outlines are proposals, not playable lessons. The preview exception exposes every snapshot; the game’s unlock rules are unchanged.</p>
    </section>
    {!open && <button onClick={() => setOpen(true)}>Open Upgrades</button>}
    <section hidden={!open || Boolean(recipe)} inert={Boolean(tutorial)} aria-hidden={tutorial ? true : undefined} data-highlight-project={highlight} className="modal research-modal status-modal glass hint-study-modal" aria-label="Upgrades preview">
      <PanelHeader title="Upgrades" onClose={() => setOpen(false)} />
      <div className="status-layout"><aside className="character-column" aria-label="Your AI bot"><RobotPortrait game={game}/>
        <div className="robot-thought"><ActionHint clue={displayClue} index={reviewIndex} proposed={proposed} destination={destination} onBrowse={browse}
          onNavigate={() => { const live = implementationHintDestination(game, example, clue.title); if (live) navigate(live); }}/></div>
        <BotUpgrade game={game} engine={engine} onInspect={setSelected} onOpenRecipe={openRecipe}/>
      </aside><div className="status-research-column"><div className="status-research-tools">
        <div className="status-filter-bar"><div className="status-filters" role="group" aria-label="Research view">
          <div className="status-view-tabs" role="tablist" aria-label="Research categories" onKeyDown={event => {
            if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
            const tabs = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
            const current = tabs.indexOf(document.activeElement as HTMLButtonElement);
            const index = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
            event.preventDefault(); tabs[index]?.click(); tabs[index]?.focus();
          }}>{(['nodes','upgrades','map'] as MapStudyFilter[]).map(view => <button key={view} role="tab" id={`hint-view-${view}`} aria-selected={filter === view} aria-controls="hint-projects-panel" tabIndex={filter === view ? 0 : -1} onClick={() => { setFilter(view); setSelected(undefined); setMessage(''); }}>{view === 'nodes' ? 'Production nodes' : view === 'upgrades' ? 'Node upgrades' : 'Map upgrades'}</button>)}</div>
          {filter !== 'upgrades' && <label className="completed-toggle"><input type="checkbox" checked={completed} onChange={event => setCompleted(event.target.checked)}/> Show completed</label>}
          <div className="status-research-actions"><button className="queue-research-button" onClick={() => queue(selected)}>Queue research</button><button className={`pause-research-toggle${game.research.paused ? ' paused' : ''}`} aria-pressed={Boolean(game.research.paused)} aria-label={game.research.paused ? 'Resume research' : 'Pause research'} onClick={() => engine.setResearchPaused(!game.research.paused)}>
            <svg viewBox="0 0 16 16" aria-hidden="true">{game.research.paused ? <path d="M4 2L14 8L4 14Z"/> : <><rect x="3" y="2" width="3" height="12"/><rect x="10" y="2" width="3" height="12"/></>}</svg>
          </button></div></div></div>
        <label className="research-search-field"><span aria-hidden="true">⌕</span><input type="search" aria-label="Search research projects" placeholder="Search research or upgrades..." value={query} onChange={event => setQuery(event.target.value)}/></label>
      </div><ResearchQueue game={game} engine={engine} message={message}/>
      <div id="hint-projects-panel" className="status-stage-list status-project-list" role="tabpanel" aria-labelledby={`hint-view-${filter}`} data-highlight-project={highlight}><div role="list" aria-label="Research projects">
        {[...(mapProject ? [mapProject] : []), ...projects].map(project => <ResearchListRow key={project.id} project={project} game={game} selected={selected} onInspect={setSelected} onQueue={queue} onOpenRecipe={openRecipe}/>)}
        {!projects.length && !mapProject && <p className="no-results">No projects match this view.</p>}
      </div></div></div></div>
    </section>
    {recipe && <RecipesPanel key={recipe} persistView={false} game={game} initialRecipeId={recipe} backToResearch onClose={returnToHints}/>}
    {tutorial && <div className="modal-backdrop tutorial-menu-backdrop hint-tutorial-backdrop"
      onClick={event => { if (event.target === event.currentTarget) returnToHints(); }}><Dialog className="modal glass tutorial-dialog tutorial-invitation hint-tutorial-invitation" aria-label={`${TUTORIAL_NAMES[tutorial]} tutorial`} aria-describedby="hint-tutorial-invitation-copy" onDismiss={returnToHints}
      initialFocus={() => document.querySelector('.hint-tutorial-later')}>
      <PanelHeader title={`${TUTORIAL_NAMES[tutorial]} tutorial`} onClose={returnToHints}/>
      <div className="tutorial-modal-content"><p className="tutorial-intro" id="hint-tutorial-invitation-copy">We have a tutorial for this. It’s almost suspiciously relevant. Want to try it?</p>
        <p className="hint-tutorial-note">Practice in a separate factory.</p>
        <footer className="tutorial-actions"><button className="tutorial-button hint-tutorial-later" onClick={returnToHints}>Not now</button>
          <button className="tutorial-button tutorial-primary hint-tutorial-start" onClick={() => startPractice(tutorial)}>Start {TUTORIAL_NAMES[tutorial]}</button></footer>
      </div></Dialog></div>}
    <footer className="hint-study-footer"><span role="status" aria-live="polite">{receipt}</span><span>Paused review snapshots · separate optional practice · no campaign saves</span></footer>
    <UiTooltipLayer/>
  </main>{practice && <div className="hint-study-practice"><FactoryApp key={practice.id} engine={practice.engine} training={practice} welcome={false}
    onShowWelcome={() => {}} onCloseWelcome={() => {}} onTutorials={() => {}} onExitTutorial={returnToHints} onFinishTutorial={returnToHints}/></div>}</>;
}

createRoot(document.getElementById('root')!).render(<Study/>);
