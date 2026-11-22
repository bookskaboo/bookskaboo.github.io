import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { getResearchProject, RESEARCH_PROJECTS } from '../../src/content/research';
import { researchTriggerCopy } from '../../src/content/researchGuidance';
import { GameEngine } from '../../src/simulation/engine';
import { ResearchProjectDetail } from '../../src/ui/ResearchProjectDetail';
import { HintBrowser } from './HintBrowser';
import { RecipesPanel } from '../../src/ui/RecipesPanel';
import { PanelHeader } from '../../src/ui/PanelHeader';
import { UiTooltipLayer } from '../../src/ui/components/UiTooltipLayer';
import { ASSIGNMENT, BOT_UPGRADES, STAGES, characterStage, presentProject, previewState, installBotUpgradeProposal } from './model';
import { robotSvg } from './robotArt';
import { RobotPortrait } from '../../src/ui/upgrades/RobotPortrait';
import { RobotAnimationGallery } from './RobotAnimationGallery';
import { HintReviewPage } from './HintReviewPage';
import { BotUpgrade } from './BotUpgrade';
import { ResearchListRow } from './ResearchListRow';
import { statusResearchList, type ResearchListFilter } from './researchList';
import { upgradePaymentExample } from './upgradeExamples';
import { ResearchQueue } from './ResearchQueue';
import { queueLabExample, supplyQueueExample, completeQueueExample } from './queueExamples';
import { researchCardDetails } from '../../src/ui/researchPresentation';
import { NodeMinimap } from '../../src/ui/NodeMinimap';
import { UpgradeCompletionNotice } from './UpgradeCompletionNotice';
import { acknowledgeStatusAssignment, syncStatusHintHistory } from './statusHints';
import { restoreStatusFactory, savedProgressExample, savedMapPurchaseExample } from './savedProgress';
import { TutorialGuide, type TrainingSession } from '../../src/ui/Tutorials';
import { permitsTutorialChoice, queueTutorialResearch, tutorialChoices } from '../../src/tutorials/tutorialChoices';
import type { TutorialStage } from '../../src/tutorials/tutorialRuntime';
import { researchPracticeExample } from './researchPractice';
import { MapSurveySettings } from './MapSurveySettings';
import { defaultSurveyPrices, mapStudyResearchList, mapUpgradeExample, syncCombinedExploration, type MapStudyFilter } from './mapUpgrades';
import '../../src/styles.css';
import './preview.css';

installBotUpgradeProposal();
const SHOW_SELECTED_PROJECT = false;

const portraits = STAGES.map((_, tier) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(robotSvg(tier))}`);
const mapStudy = location.pathname.endsWith('/map-upgrades.html') || new URLSearchParams(location.search).get('view') === 'map-upgrades';
const requestedTier = STAGES.findIndex(stage => stage.label.toLowerCase() === new URLSearchParams(location.search).get('stage'));
const initialTier = requestedTier < 0 ? mapStudy ? 3 : 0 : requestedTier;
const requestedView = new URLSearchParams(location.search).get('view');
const initialView = requestedView === 'hints' || location.pathname.endsWith('/hint-texts.html') ? 'hints'
  : requestedView === 'animations' || location.pathname.endsWith('/robot-upgrade-animations.html') ? 'animations'
  : requestedView === 'art' || location.pathname.endsWith('/robot-tier-art.html') ? 'art' : 'status';

function Preview() {
  const [tier, setTier] = useState(initialTier);
  const [view, setView] = useState(initialView);
  const [engine, setEngine] = useState(() => mapStudy ? mapUpgradeExample(initialTier) : new GameEngine(previewState(initialTier), { autosave: false }));
  const [surveyPrices, setSurveyPrices] = useState(defaultSurveyPrices);
  const [, render] = useState(0);
  const [selected, setSelected] = useState<string>();
  const [filter, setFilter] = useState<MapStudyFilter>(mapStudy ? 'map' : 'nodes');
  const [query, setQuery] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [queueMessage, setQueueMessage] = useState('');
  const [queueTesting, setQueueTesting] = useState(mapStudy);
  const [noticeExample, setNoticeExample] = useState<string>();
  const [practice, setPractice] = useState<TrainingSession>();
  const [practiceStage, setPracticeStage] = useState<TutorialStage>('cores-open');
  const practiceOrigin = useRef<{ engine: GameEngine; queueTesting: boolean } | undefined>(undefined);
  const practiceRun = useRef(0);
  const [open, setOpen] = useState(true);
  const [mapOpen, setMapOpen] = useState(false);
  const [recipe, setRecipe] = useState<string>();
  const [editor, setEditor] = useState(false);
  const [assignment, setAssignment] = useState<string>(ASSIGNMENT);
  const [hintExample, setHintExample] = useState(0);
  const [stageCopy, setStageCopy] = useState(STAGES.map(stage => ({ ...stage, role: stage.role as string })));
  const detailRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const reopenRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const update = () => { if (mapStudy) syncCombinedExploration(engine.getState()); syncStatusHintHistory(engine.getState(), assignment); render(value => value + 1); };
    update();
    return engine.subscribe(update);
  }, [engine, assignment]);
  useEffect(() => {
    engine.startRealtimeClock();
    const timer = setInterval(() => engine.tickRealtime(), 100);
    return () => { clearInterval(timer); engine.stopRealtimeClock(); };
  }, [engine]);
  useEffect(() => {
    if (!open || view !== 'status' || recipe) return;
    const currentDialog = mapOpen ? document.querySelector<HTMLElement>('.status-study .map-modal') : dialogRef.current;
    const first = currentDialog?.querySelector<HTMLButtonElement>('button');
    first?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { if (mapOpen) setMapOpen(false); else { setOpen(false); requestAnimationFrame(() => reopenRef.current?.focus()); } }
      if (event.key !== 'Tab') return;
      const nodes = [...(currentDialog?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), summary, [tabindex="0"]') ?? []),
        ...document.querySelectorAll<HTMLElement>('.upgrade-completion-stack button:not(:disabled), .tutorial-callout button:not(:disabled)')].filter(node => node.getClientRects().length > 0);
      if (!nodes.length) return;
      if (event.shiftKey && document.activeElement === nodes[0]) { event.preventDefault(); nodes.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === nodes.at(-1)) { event.preventDefault(); nodes[0].focus(); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [open, view, recipe, mapOpen]);
  const game = engine.getState();
  const currentTier = characterStage(game);
  const stage = stageCopy[currentTier];
  const { active, mapProject, projects: listed } = mapStudy ? mapStudyResearchList(game, filter, query, showCompleted) : statusResearchList(game, filter as ResearchListFilter, query, showCompleted);
  const inspected = getResearchProject(selected);
  const practiceChoices = practice ? tutorialChoices('basic', practiceStage, game) : undefined;
  const displayed = practice ? [getResearchProject('assembler')!] : listed;
  const resetStage = (next: number, prices = surveyPrices) => {
    setPractice(undefined); practiceOrigin.current = undefined;
    setNoticeExample(undefined);
    setMapOpen(false);
    setQueueMessage(''); setQueueTesting(mapStudy);
    setHintExample(value => value + 1);
    setTier(next); setEngine(mapStudy ? mapUpgradeExample(next, prices) : new GameEngine(previewState(next), { autosave: false }));
    setSelected(undefined); setFilter(mapStudy ? 'map' : 'nodes'); setQuery(''); setRecipe(undefined); setOpen(true);
  };
  const inspect = (id: string, keyboard = false) => {
    if (practice && !permitsTutorialChoice(practiceChoices?.researchProjectId, id)) return;
    setSelected(id);
    setQueueMessage('');
    if (!SHOW_SELECTED_PROJECT) return;
    detailRef.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    if (keyboard) requestAnimationFrame(() => detailRef.current?.querySelector<HTMLElement>('[data-project-detail]')?.focus());
  };
  const showPaymentExample = (sets: 2 | 5) => {
    setPractice(undefined); practiceOrigin.current = undefined;
    setNoticeExample(sets === 5 ? BOT_UPGRADES[currentTier]?.id : undefined);
    setMapOpen(false);
    setQueueMessage(''); setQueueTesting(false);
    const example = upgradePaymentExample(currentTier, sets);
    const state = example.getState();
    setEngine(example); setTier(characterStage(state)); setSelected(undefined);
    setHintExample(value => value + 1); setRecipe(undefined); setOpen(true); setView('status');
  };
  const queueProject = (id?: string) => {
    if (practice && id && !permitsTutorialChoice(practiceChoices?.researchProjectId, id)) { setQueueMessage('Follow the current practice step.'); return; }
    if (!id || BOT_UPGRADES.some(upgrade => upgrade.id === id)) { setQueueMessage('Select a research card from the list first.'); return; }
    const project = getResearchProject(id);
    if (!project) return;
    const details = researchCardDetails(project, game);
    if (!details.selectable) { setQueueMessage(researchTriggerCopy(project, game)?.pending ?? details.status); return; }
    const result = practice ? queueTutorialResearch(engine, 'basic', practiceStage, id) : engine.queueResearch(id, { adoptSelected: !BOT_UPGRADES.some(upgrade => upgrade.id === game.research.selected) });
    setQueueMessage(result === 'added' ? '' : result === 'full' ? 'Queue full. Remove a project to add another.'
      : result === 'duplicate' ? 'That project is already queued.' : result === 'map-destination' ? 'Choose a destination in the Node Map first.' : 'This research is not available yet.');
  };
  const loadQueueExample = () => {
    setPractice(undefined); practiceOrigin.current = undefined;
    setNoticeExample(undefined);
    setMapOpen(false);
    const example = queueLabExample();
    setEngine(example); setTier(characterStage(example.getState())); setSelected(undefined);
    setQueueTesting(true); setQueueMessage(''); setFilter('upgrades'); setQuery('');
    setHintExample(value => value + 1); setRecipe(undefined); setOpen(true); setView('status');
  };
  const reloadFactorySnapshot = () => {
    if (practice) return;
    syncStatusHintHistory(game, assignment);
    const loaded = restoreStatusFactory(JSON.parse(JSON.stringify(game)));
    if (!loaded) return;
    setEngine(new GameEngine(loaded, { autosave: false }));
    setTier(characterStage(loaded)); setSelected(undefined); setQueueMessage('');
    setNoticeExample(undefined); setRecipe(undefined); setMapOpen(false);
    setHintExample(value => value + 1); setOpen(true); setView('status');
  };
  const loadSavedProgressExample = (mapPurchase = false) => {
    setPractice(undefined); practiceOrigin.current = undefined;
    const example = mapPurchase ? savedMapPurchaseExample() : savedProgressExample();
    setEngine(example); setTier(characterStage(example.getState())); setQueueTesting(true);
    setSelected(undefined); setFilter('upgrades'); setQuery(''); setShowCompleted(false);
    setQueueMessage(''); setNoticeExample(undefined); setRecipe(undefined); setMapOpen(false);
    setHintExample(value => value + 1); setOpen(true); setView('status');
  };
  const startResearchPractice = () => {
    if (!practice) practiceOrigin.current = { engine, queueTesting };
    const example = researchPracticeExample();
    setPractice({ id: `research-practice-${++practiceRun.current}`, kind: 'basic', engine: example });
    setPracticeStage('cores-open'); setEngine(example); setQueueTesting(true);
    setTier(0); setSelected(undefined); setFilter('nodes'); setQuery(''); setShowCompleted(false);
    setQueueMessage(''); setNoticeExample(undefined); setRecipe(undefined); setMapOpen(false);
    setHintExample(value => value + 1); setOpen(true); setView('status');
  };
  const finishResearchPractice = () => {
    const origin = practiceOrigin.current;
    setPractice(undefined); practiceOrigin.current = undefined;
    if (origin) { setEngine(origin.engine); setQueueTesting(origin.queueTesting); setTier(characterStage(origin.engine.getState())); }
    setSelected(undefined); setFilter('nodes'); setQuery(''); setQueueMessage('');
    setNoticeExample(undefined); setMapOpen(false); setRecipe(undefined); setOpen(true);
    setHintExample(value => value + 1);
  };
  const updateCopy = (key: 'role', value: string) => setStageCopy(current => current.map((copy, index) => index === currentTier ? { ...copy, [key]: value } : copy));

  return <main className={`status-study${mapStudy ? ' map-upgrades-study' : ''}`}><UiTooltipLayer /><UpgradeCompletionNotice engine={engine} previewCompletion={noticeExample} />
    <header className="study-toolbar">
      <div><strong>NODE</strong><span>{mapStudy ? 'Map upgrades study' : 'Status page study'}</span><small>Local prototype</small></div>
      {!mapStudy && <nav aria-label="Preview views"><button disabled={Boolean(practice)} aria-pressed={view === 'status'} onClick={() => { setView('status'); setOpen(true); setMapOpen(false); }}>Test modal</button><button disabled={Boolean(practice)} aria-pressed={view === 'art'} onClick={() => setView('art')}>Robot tier art</button><button disabled={Boolean(practice)} aria-pressed={view === 'animations'} onClick={() => setView('animations')}>Upgrade animations</button><button disabled={Boolean(practice)} aria-pressed={view === 'hints'} onClick={() => setView('hints')}>Hints and triggers</button></nav>}
      <label>Stage example <select disabled={Boolean(practice)} aria-label="Stage example" value={tier} onChange={event => resetStage(Number(event.target.value))}>{STAGES.map((entry, index) => <option key={entry.label} value={index}>{entry.label}</option>)}</select></label>
      <button disabled={Boolean(practice)} aria-expanded={editor} onClick={() => setEditor(!editor)}>Adjust wording</button>
      <button disabled={Boolean(practice)} onClick={() => resetStage(tier)}>Reset example</button>
      <button aria-label="Open Node Map" disabled={Boolean(practice) || !game.research.completed.includes('exploration')} onClick={() => { setView('status'); setOpen(true); setRecipe(undefined); setMapOpen(true); }}>Node Map · {game.research.mapPoints}</button>
      {view === 'status' && <details className="upgrade-test-controls"><summary>Payment tests</summary><div><button disabled={Boolean(practice) || currentTier >= 7} onClick={() => showPaymentExample(2)}>Test 2 payments</button><button disabled={Boolean(practice) || currentTier >= 7} onClick={() => showPaymentExample(5)}>Test completion</button><button disabled={Boolean(practice)} onClick={loadQueueExample}>Load live queue lab</button><button disabled={Boolean(practice)} onClick={() => loadSavedProgressExample()}>Test saved progress</button><button disabled={Boolean(practice)} onClick={() => loadSavedProgressExample(true)}>Test saved map purchase</button><button disabled={Boolean(practice)} onClick={reloadFactorySnapshot}>Reload factory snapshot</button><button disabled={Boolean(practice)} onClick={startResearchPractice}>Test Basics research</button><button disabled={!queueTesting} onClick={() => { supplyQueueExample(engine); render(value => value + 1); }}>Supply test Cores</button><button disabled={!queueTesting || game.research.paused || !game.research.selected} onClick={() => { completeQueueExample(engine); if (mapStudy) syncCombinedExploration(engine.getState()); render(value => value + 1); }}>Complete current test project</button><p>Synthetic lab supply and ordinary engine cycles; the queue lab also runs at normal speed.</p></div></details>}
    </header>
    <p className="study-note">{mapStudy ? 'Survey research proposal. Queue and payment tests use an isolated lab. Worldwide map reveals are not connected yet. Browser saves are untouched.' : 'Local proposal. Stage examples are paused; the supplied queue lab runs at normal speed. Browser saves are untouched.'}</p>
    {mapStudy && <MapSurveySettings prices={surveyPrices} onApply={prices => { setSurveyPrices(prices); resetStage(tier, prices); }} />}
    {editor && <section className="copy-editor" aria-label="Wording editor"><label>Assignment<textarea value={assignment} onChange={event => setAssignment(event.target.value)} /></label><label>Art sheet role<input value={stage.role} onChange={event => updateCopy('role', event.target.value)} /></label><p>Edits stay in this tab. Reload restores the draft. Assignment edits change the first hint. Later hints retain the current game guidance.</p></section>}
    {view === 'animations' ? <RobotAnimationGallery /> : view === 'hints' ? <HintReviewPage game={game} assignment={assignment} /> : view === 'art' ? <section className="tier-art-page" aria-labelledby="art-title"><header><small>Character development</small><h1 id="art-title">One bot. Increasing responsibility.</h1><p>The same face through seven Core upgrades. Each stage develops a distinct chassis, stance and outline.</p><p>Existing NODE line art, charcoal panels and material accents. Character titles follow the approved promotion ladder; hardware remains draft fiction.</p></header><div className="tier-art-grid">{STAGES.map((entry, index) => <article key={entry.label}><div className="tier-art-heading"><span>{index === 0 ? 'Arrival' : `Upgrade ${index}`}</span><h2>{entry.label}</h2></div><img src={portraits[index]} alt={`${stageCopy[index].role} (${entry.label}): ${entry.hardware}`} /><h3>{stageCopy[index].role}</h3><p>{entry.hardware}</p><p className="robot-aside">{entry.thought}</p><button onClick={() => { resetStage(index); setView('status'); }}>Try {entry.label} stage</button><a href={portraits[index]} download={`node-bot-${entry.label.toLowerCase()}.svg`}>Download SVG</a></article>)}</div></section>
      : <><button className="reopen-status" ref={reopenRef} onClick={() => setOpen(true)}>Open upgrades modal</button>{open && (mapOpen ? <NodeMinimap expanded persistLayout={false} game={game} engine={engine} onTravel={id => { engine.switchSector(id); setMapOpen(false); }} onOpenMap={() => setMapOpen(true)} onClose={() => setMapOpen(false)} onHoverChange={() => {}} /> : recipe ? <RecipesPanel game={game} initialRecipeId={recipe} backToResearch onClose={() => setRecipe(undefined)} /> : <div className="status-preview-backdrop"><section ref={dialogRef} className="modal research-modal status-modal glass" role="dialog" aria-modal="true" aria-labelledby="status-title">
        <PanelHeader title="Upgrades" onClose={() => { setOpen(false); requestAnimationFrame(() => reopenRef.current?.focus()); }} />
        <h1 className="sr-only" id="status-title">Upgrades</h1>
        <div className="status-layout">
          <aside className="character-column" aria-label="Your AI bot">
            <RobotPortrait game={game} />
            <div className="robot-thought"><HintBrowser key={hintExample} game={game} assignment={assignment} onAssignmentRead={() => { acknowledgeStatusAssignment(game, assignment); render(value => value + 1); }} /></div>
            <BotUpgrade disabled={Boolean(practice)} game={game} engine={engine} onInspect={inspect} onOpenRecipe={setRecipe} />
          </aside>
          <div className="status-research-column">
            <div className="status-research-tools">
              <div className="status-filter-bar">
                <div className="status-filters" role="group" aria-label="Research view">
                  <div className="status-view-tabs" role={mapStudy ? 'tablist' : undefined} aria-label={mapStudy ? 'Research categories' : undefined} onKeyDown={event => {
                    if (!mapStudy || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                    const tabs = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
                    const current = tabs.indexOf(document.activeElement as HTMLButtonElement);
                    const index = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
                    event.preventDefault(); tabs[index]?.click(); tabs[index]?.focus();
                  }}>
                  {(['nodes', 'upgrades', ...(mapStudy ? ['map'] : [])] as MapStudyFilter[]).map(viewFilter => <button key={viewFilter} id={`research-view-${viewFilter}`} role={mapStudy ? 'tab' : undefined} aria-selected={mapStudy ? filter === viewFilter : undefined} aria-controls={mapStudy ? 'research-projects-panel' : undefined} tabIndex={mapStudy && filter !== viewFilter ? -1 : 0} disabled={Boolean(practice)} aria-pressed={mapStudy ? undefined : filter === viewFilter} onClick={() => { setFilter(viewFilter); setSelected(undefined); setQueueMessage(''); }}>{viewFilter === 'nodes' ? 'Production nodes' : viewFilter === 'upgrades' ? 'Node upgrades' : 'Map upgrades'}</button>)}
                  </div>
                  {mapStudy && filter !== 'upgrades' && <label className="completed-toggle"><input disabled={Boolean(practice)} type="checkbox" checked={showCompleted} onChange={event => setShowCompleted(event.target.checked)} /> Show completed</label>}
                  <div className="status-research-actions">
                  <button disabled={Boolean(practice) && practiceChoices?.researchProjectId !== 'assembler'} className="queue-research-button" aria-controls="research-queue-panel" aria-description="Add the selected research card to the queue. You can also double-click a card." onClick={() => queueProject(selected)}>Queue research</button>
                  <button className={`pause-research-toggle${game.research.paused ? ' paused' : ''}`} aria-label={game.research.paused ? 'Resume research' : 'Pause research'} title={game.research.paused ? 'Resume research' : 'Pause research'} aria-pressed={Boolean(game.research.paused)} onClick={() => { engine.setResearchPaused(!game.research.paused); setQueueMessage(''); }}>
                    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">{game.research.paused ? <path d="M4 2L14 8L4 14Z" /> : <><rect x="3" y="2" width="3" height="12" /><rect x="10" y="2" width="3" height="12" /></>}</svg>
                  </button>
                  </div>
                </div>
                {!mapStudy && filter !== 'upgrades' && <label className="completed-toggle"><input disabled={Boolean(practice)} type="checkbox" checked={showCompleted} onChange={event => setShowCompleted(event.target.checked)} /> Show completed projects</label>}
              </div>
              <label className="research-search-field"><span aria-hidden="true">⌕</span><input disabled={Boolean(practice)} type="search" aria-label="Search research projects" placeholder="Search research or upgrades..." value={query} onChange={event => setQuery(event.target.value)} /></label>
            </div>
            <ResearchQueue practice={Boolean(practice)} game={game} engine={engine} message={queueMessage} />
            {SHOW_SELECTED_PROJECT && <div className="status-preview-top" ref={detailRef}><div className="status-research-heading"><h3>Selected project</h3><span>{active ? `Active: ${presentProject(active).name}` : 'No active project'}</span></div>{inspected ? <ResearchProjectDetail project={presentProject(inspected)} game={game} engine={engine} onPrerequisite={id => inspect(id)} onOpenRecipe={setRecipe} onOpenMap={() => setMapOpen(true)} /> : <p>Select a project to preview its requirements.</p>}{inspected?.id === 'mapNode' && <p className="upgrade-note">Complete Extra Map Point research, then spend the point in the Node Map.</p>}</div>}
            <div id="research-projects-panel" className="status-stage-list status-project-list" role={mapStudy ? 'tabpanel' : 'list'} aria-labelledby={mapStudy ? `research-view-${filter}` : undefined} aria-label={mapStudy ? undefined : 'Research projects'}>
              <div role={mapStudy ? 'list' : undefined} aria-label={mapStudy ? 'Research projects' : undefined}>
              {!practice && mapProject && <ResearchListRow project={mapProject} game={game} selected={selected} onInspect={inspect} onQueue={queueProject} onOpenRecipe={setRecipe} />}
              {displayed.map(project => <ResearchListRow disabled={Boolean(practice) && !permitsTutorialChoice(practiceChoices?.researchProjectId, project.id)} tutorialChoice={Boolean(practice) && practiceChoices?.researchProjectId === project.id} recipesDisabled={Boolean(practice)} key={project.id} project={project} game={game} selected={selected} onInspect={inspect} onQueue={queueProject} onOpenRecipe={setRecipe} />)}
              {!displayed.length && <p className="no-results" role="status">{query.trim() ? 'No projects match this search.' : filter === 'upgrades' ? 'No node upgrades are available yet.' : 'No projects remain in this view.'}</p>}
              </div>
            </div>
          </div>
        </div>
      </section></div>)}</>}
    {practice && <TutorialGuide key={practice.id} session={practice} game={game} camera={engine.getSector().camera}
      panel={open ? 'research' : null} researchLayout="upgrades" stageRange={{ first: 'cores-open', last: 'cores-complete' }}
      onPlacementTarget={() => {}} onStageChange={setPracticeStage} onPanel={() => {}}
      onRestart={startResearchPractice} onExit={finishResearchPractice} onFinish={finishResearchPractice} />}
    <footer className="study-footer">{RESEARCH_PROJECTS.length} projects · Draft bot upgrade bills · Standard research cycles</footer>
  </main>;
}

const root = createRoot(document.getElementById('root')!);
root.render(<Preview />);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
