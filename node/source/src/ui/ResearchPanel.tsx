import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Dialog } from './components/Dialog';
import { researchTriggerCopy } from '../content/researchGuidance';
import { getResearchProject } from '../content/research';
import { ASSIGNMENT, BOT_UPGRADES } from '../content/botUpgrades';
import type { GameState } from '../domain/types';
import type { GameEngine } from '../simulation/engine';
import { permitsTutorialChoice, type TutorialChoice } from '../tutorials/tutorialChoices';
import { PanelHeader } from './PanelHeader';
import { LegacyResearchPanel } from './LegacyResearchPanel';
import { HintBrowser } from './upgrades/HintBrowser';
import { acknowledgeStatusAssignment } from './upgrades/statusHints';
import { BotUpgrade } from './upgrades/BotUpgrade';
import { ResearchListRow } from './upgrades/ResearchListRow';
import { ResearchQueue } from './upgrades/ResearchQueue';
import { statusResearchList, type ResearchListFilter } from './upgrades/researchList';
import { RobotPortrait } from './upgrades/RobotPortrait';
import { researchCardDetails } from './researchPresentation';
import { hintDestination, type HintDestination } from './upgrades/hintNavigation';
import { HintTutorialInvitation } from './upgrades/HintTutorialInvitation';
import type { HintPanelContext } from './upgrades/hintPanelContext';
import type { TutorialKind } from '../tutorials/tutorialRuntime';

interface ResearchPanelProps {
  focusProjectId?: string; allowedProjectId?: TutorialChoice; showMilestones?: boolean;
  game: GameState; engine: GameEngine; onClose(): void;
  onOpenRecipe(recipeId: string): void; onOpenMap?(): void;
  initialContext?: HintPanelContext;
  onContextConsumed?(): void;
  onStartHintTutorial?(kind: TutorialKind, context: HintPanelContext): void;
}

export function ResearchPanel(props: ResearchPanelProps) {
  return props.game.mod ? <LegacyResearchPanel {...props} /> : <UpgradesPanel {...props} />;
}

function UpgradesPanel({ game, engine, focusProjectId, allowedProjectId, showMilestones = true, onClose, onOpenRecipe,
  initialContext, onContextConsumed, onStartHintTutorial }: ResearchPanelProps) {
  const resume = useRef(initialContext).current;
  const [filter, setFilter] = useState<ResearchListFilter>(resume?.filter ?? 'nodes');
  const [query, setQuery] = useState(resume?.query ?? '');
  const [showCompleted, setShowCompleted] = useState(resume?.showCompleted ?? false);
  const [selected, setSelected] = useState(resume?.selected ?? focusProjectId);
  const [highlight, setHighlight] = useState<string>();
  const [focusRequest, setFocusRequest] = useState(0);
  const [invitation, setInvitation] = useState<{ kind: TutorialKind; hintKey: string }>();
  const [message, setMessage] = useState('');
  const [, refreshHints] = useState(0);
  const dialog = useRef<HTMLElement>(null);
  const guided = allowedProjectId !== undefined;
  const { projects, mapProject } = statusResearchList(game, filter, query, showCompleted);
  const guidedProject = allowedProjectId ? getResearchProject(allowedProjectId) : undefined;
  const listed = guided ? guidedProject && (!game.research.completed.includes(guidedProject.id) || showCompleted) ? [guidedProject] : [] : projects;
  const isBot = (id?: string) => BOT_UPGRADES.some(upgrade => upgrade.id === id);
  const canInspect = (id: string) => permitsTutorialChoice(allowedProjectId, id);
  const inspect = (id: string) => { if (canInspect(id)) { setSelected(id); setMessage(''); } };
  const navigateHint = (destination: HintDestination, title: string) => {
    const current = hintDestination(engine.getState(), title);
    if (!current || current.kind !== destination.kind || current.id !== destination.id) return;
    if (current.kind === 'tutorial') { if (onStartHintTutorial) setInvitation({ kind: current.id, hintKey: title }); return; }
    setQuery(''); setShowCompleted(false); setFilter(/\d+$/.test(current.id) ? 'upgrades' : 'nodes');
    setSelected(current.id); setHighlight(current.id); setMessage(''); setFocusRequest(value => value + 1);
  };
  const startHintTutorial = () => {
    if (!invitation || !onStartHintTutorial) return;
    const current = hintDestination(engine.getState(), invitation.hintKey);
    if (current?.kind !== 'tutorial' || current.id !== invitation.kind) { setInvitation(undefined); return; }
    const context: HintPanelContext = { hintKey: invitation.hintKey, filter, query, showCompleted, selected,
      scrollTop: dialog.current?.querySelector('.status-stage-list')?.scrollTop ?? 0 };
    setInvitation(undefined);
    onStartHintTutorial(invitation.kind, context);
  };
  useLayoutEffect(() => {
    if (!highlight) return;
    const target = dialog.current?.querySelector<HTMLElement>(`[data-research-id="${highlight}"], [data-bot-upgrade="${highlight}"] .bot-upgrade-button`);
    target?.scrollIntoView({ block: 'nearest' }); target?.focus({ preventScroll: true });
  }, [highlight, focusRequest, filter, query]);
  useEffect(() => {
    if (!resume) return;
    const list = dialog.current?.querySelector('.status-stage-list');
    if (list) list.scrollTop = resume.scrollTop;
    onContextConsumed?.();
  }, [resume]);
  const enqueue = (id?: string) => {
    if (!id || isBot(id)) { setMessage('Select a research card from the list first.'); return; }
    if (!canInspect(id)) return;
    const project = getResearchProject(id);
    if (!project) return;
    const details = researchCardDetails(project, game);
    if (!details.selectable) { setMessage(researchTriggerCopy(project, game)?.pending ?? details.status); return; }
    const result = engine.queueResearch(id, { adoptSelected: !isBot(game.research.selected) });
    setMessage(result === 'added' ? '' : result === 'full' ? 'Queue full. Remove a project to add another.'
      : result === 'duplicate' ? 'That project is already queued.' : 'This research is not available yet.');
  };
  useEffect(() => {
    if (allowedProjectId === undefined) return;
    setSelected(undefined); setQuery(''); setFilter('nodes'); setMessage('');
  }, [allowedProjectId]);
  useEffect(() => {
    if (!focusProjectId || guided) return;
    if (isBot(focusProjectId)) return;
    const project = getResearchProject(focusProjectId);
    if (!project) return;
    setShowCompleted(game.research.completed.includes(focusProjectId));
    setFilter(/\d+$/.test(focusProjectId) ? 'upgrades' : 'nodes');
  }, [focusProjectId]);
  return <><div className="upgrades-modal-scope"><div className="modal-backdrop">
    <Dialog panel ref={dialog} className="modal research-modal status-modal glass" modal={!guided} aria-label="Upgrades" onDismiss={onClose}
      initialFocus={() => resume ? dialog.current?.querySelector<HTMLElement>('.hint-context-action')
        : focusProjectId ? dialog.current?.querySelector<HTMLElement>(`[data-research-id="${focusProjectId}"], [data-bot-upgrade="${focusProjectId}"] .bot-upgrade-button`) : undefined}>
      <PanelHeader title="Upgrades" onClose={onClose} />
      <div className="status-layout">
        <aside className="character-column" aria-label="Your AI bot">
          <RobotPortrait game={game} />
          {showMilestones && <div className="robot-thought"><HintBrowser game={game} assignment={ASSIGNMENT} initialHintKey={resume?.hintKey}
            allowTutorials={Boolean(onStartHintTutorial)} onNavigate={guided ? undefined : navigateHint}
            onAssignmentRead={() => { acknowledgeStatusAssignment(game); refreshHints(value => value + 1); }} /></div>}
          <BotUpgrade disabled={guided} highlighted={highlight !== undefined && isBot(highlight)} game={game} engine={engine} onInspect={inspect} onOpenRecipe={onOpenRecipe} />
        </aside>
        <div className="status-research-column">
          <div className="status-research-tools">
            <div className="status-filter-bar"><div className="status-filters" role="group" aria-label="Research view">
              <button disabled={guided} aria-pressed={filter === 'nodes'} onClick={() => setFilter('nodes')}>Production nodes</button>
              <button disabled={guided} aria-pressed={filter === 'upgrades'} onClick={() => setFilter('upgrades')}>Node upgrades</button>
              <button disabled={guided && allowedProjectId !== 'assembler'} className="queue-research-button" aria-controls="research-queue-panel" aria-description="Add the selected research card to the queue. You can also double-click a card." onClick={() => enqueue(selected)}>Queue research</button>
              <button disabled={guided && allowedProjectId !== 'assembler'} className="pause-research-toggle" aria-label={game.research.paused ? 'Resume research' : 'Pause research'} title={game.research.paused ? 'Resume research' : 'Pause research'} aria-pressed={Boolean(game.research.paused)} onClick={() => { engine.setResearchPaused(!game.research.paused); setMessage(''); }}>
                <svg viewBox="0 0 16 16" aria-hidden="true">{game.research.paused ? <path d="M4 2L14 8L4 14Z" /> : <><rect x="3" y="2" width="3" height="12" /><rect x="10" y="2" width="3" height="12" /></>}</svg>
              </button>
            </div>{filter === 'nodes' && <label className="completed-toggle"><input type="checkbox" disabled={guided && allowedProjectId !== 'joint'} checked={showCompleted} onChange={event => setShowCompleted(event.target.checked)} /> Show completed projects</label>}</div>
            <label className="research-search-field"><span aria-hidden="true">⌕</span><input type="search" disabled={guided} aria-label="Search research projects" placeholder="Search research or upgrades..." value={query} onChange={event => setQuery(event.target.value)} /></label>
          </div>
          {(!guided || allowedProjectId === 'assembler') && <ResearchQueue practice={guided} game={game} engine={engine} message={message} />}
          <div className="status-stage-list status-project-list" role="list" aria-label="Research projects">
            {!guided && mapProject && <ResearchListRow project={mapProject} game={game} selected={selected} highlighted={highlight === mapProject.id} onInspect={inspect} onQueue={enqueue} onOpenRecipe={onOpenRecipe} />}
            {listed.map(project => <ResearchListRow key={project.id} project={project} game={game} selected={selected} highlighted={highlight === project.id} onInspect={inspect} onQueue={enqueue} onOpenRecipe={onOpenRecipe} disabled={!canInspect(project.id)} tutorialChoice={guided && allowedProjectId === project.id} recipesDisabled={guided} />)}
            {!listed.length && <p className="no-results" role="status">{guided ? 'Follow the current practice step.' : query.trim() ? 'No projects match this search.' : filter === 'upgrades' ? 'No node upgrades are available yet.' : 'No projects remain in this view.'}</p>}
          </div>
        </div>
      </div>
    </Dialog>
  </div></div>{invitation && <HintTutorialInvitation kind={invitation.kind} onDismiss={() => setInvitation(undefined)} onStart={startHintTutorial} />}</>;
}
