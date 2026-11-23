import { EndgameNotice } from './components/EndgameNotice';
import { AutosaveWarning } from './components/AutosaveWarning';
import { Dialog } from './components/Dialog';
import { DwarvenDiscoveryNotice } from './components/DwarvenDiscoveryNotice';
import { firstSpottedDwarvenCamp } from '../tutorials/dwarvenDiscovery';
import { readShortcutBars, readShortcutBarGroups, readKnownShortcutUnlocks, readNewShortcutAssignments } from './shortcutPreferences';
import { SHORTCUT_BARS_KEY, SHORTCUT_BAR_GROUPS_KEY, SHORTCUT_UNLOCKS_KEY, SHORTCUT_NEW_ASSIGNMENTS_KEY } from '../persistence/storageKeys';
import { Stat } from './components/Stat';
import { formatTime } from './formatters';
import { BuildPanel } from './panels/BuildPanel';
import { InventoryPanel } from './panels/InventoryPanel';
import { useInventoryTotals } from './useInventoryTotals';
import { OptionsPanel } from './panels/OptionsPanel';
import { DevPanel } from './panels/DevPanel';
import { CommandsPanel } from './panels/CommandsPanel';
import { SavePanel } from './panels/SavePanel';
import { ModsModal } from './ModsModal';
import { WelcomeModal } from './components/WelcomeModal';
import { ConfirmModal } from './components/ConfirmModal';
import { RailButton } from './components/RailButton';
import { UiTooltipLayer } from './components/UiTooltipLayer';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BUILDABLE_NODES, isNodeUnlocked, NODE_DEFINITIONS } from '../content/nodes';
import { ITEM_NAMES } from '../content/items';
import { getNodeModule } from '../content/nodeModules';
import { CONNECTOR_MIRRORING_RESEARCH, isProductionMachine } from '../content/productionNodes';
import type { CameraState, GameEvent, GameState, ItemId, NodeKind } from '../domain/types';
import type { SaveSlot } from '../persistence/saves';
import { PixiPlayfield, type PlayfieldTooltip, type SelectionInfo } from '../renderer/PixiPlayfield';
import { CONTROL_GROUP_COLORS } from '../domain/controlGroups';
import { startingCamera } from './startingCamera';
import { snapNodePosition } from '../domain/nodeGrid';
import { getNodeSize } from '../domain/nodeGeometry';
import { useGridSnapKey } from './useGridSnapKey';
import { useRecipeIconToggle } from './useRecipeIconToggle';
import { SelectionActions } from './SelectionActions';
import { canDeleteNode } from '../renderer/playfieldNodeState';
import { GameEngine, createInitialState } from '../simulation/engine';
import { getWorldFieldSize, sectorDistance } from '../simulation/worldGeneration';
import { exteriorFieldOverviewSize } from '../domain/camera';
import { NodeMinimap } from './NodeMinimap';
import { cornerDiscoveryPending } from '../content/endgame';
import { NodeInspector } from './NodeInspector';
import { NodeRecipePicker } from './NodeRecipePicker';
import { BotPlantInspector } from './BotPlantPanel';
import { FilterPicker } from './FilterPicker';
import { RoadFlowPanel } from './RoadFlowPanel';
import { TributeResourcePicker } from './TributeResourcePicker';
import { RecipesPanel } from './RecipesPanel';
import { FactoryTemplates } from './FactoryTemplates';
import { DiscoveryJournal } from './DiscoveryJournal';
import { researchEventProject } from './unlockNavigation';
import { ResearchPanel } from './ResearchPanel';
import type { HintPanelContext } from './upgrades/hintPanelContext';
import { ASSIGNMENT, BOT_UPGRADES, STAGES, botUpgradeBenefits } from '../content/botUpgrades';
import { syncStatusHintHistory } from './upgrades/statusHints';
import { PanelHeader } from './PanelHeader';
import { InteractionNotice, type InteractionFailure } from './InteractionNotice';
import { TutorialUnlockInvitation } from './TutorialUnlockInvitation';
import { isTutorialUnlocked, nextTutorialInvitation } from '../tutorials/tutorialUnlocks';
import { TutorialGuide, TutorialMenu, type TrainingSession } from './Tutorials';
import { createTutorialState, correctTutorialPlacement, type TutorialStage, type TutorialPlacementTarget } from '../tutorials/tutorialRuntime';
import type { TutorialKind } from '../tutorials/tutorialRuntime';
import { permitsTutorialChoice, tutorialChoices, tutorialRecipeChoice } from '../tutorials/tutorialChoices';
import { measureFieldViewport, shortcutDockLayout } from './responsiveLayout';
import { useViewport } from './useViewport';
import { poolCapacity } from '../simulation/progression';
import { createDefaultShortcutBars, addUnlockedNodeShortcuts, DEFAULT_SHORTCUT_BAR_GROUPS, DEFAULT_SHORTCUT_BARS, reconcileShortcutBars, SHORTCUT_BAR_IDS, ShortcutBars, type ShortcutBarGroup, type ShortcutBarId, type ShortcutBarsState } from './ShortcutBars';

import { useFactoryPanels, type Panel } from './useFactoryPanels';
import { useFactoryKeyboard } from './useFactoryKeyboard';
import { useGameAudio } from './useGameAudio';
import type { GameAudio } from '../audio/GameAudio';
type NoticeTone = 'research' | 'warning';
interface Notice { id: string; message: string; label: string; tone: NoticeTone; projectId?: string }

function recordedNoticeIds(game: GameState) {
  return new Set([...(game.researchLog ?? []), ...(game.resourceDepletionLog ?? []), ...game.events].map(event => event.id));
}

// Preserve the live factory and each sector's camera across development updates.
const initialGame = import.meta.hot?.data.gameState ?? createInitialState();
let needsStartingCamera = !import.meta.hot?.data.gameState;
const ENGINE = new GameEngine(initialGame);
if (import.meta.hot) import.meta.hot.dispose((data) => { data.gameState = structuredClone(ENGINE.getState()); });
export function App({ engine: campaign = ENGINE, showWelcomeInitially = true }: { engine?: GameEngine; showWelcomeInitially?: boolean } = {}) {
  useEffect(() => {
    // Suppress the browser context menu while preserving in-game right-click handlers.
    const preventBrowserMenu = (event: MouseEvent) => event.preventDefault();
    const preventPageSelectAll = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey || event.key.toLowerCase() !== 'a') return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.matches('input, select, textarea') || target.isContentEditable)) return;
      event.preventDefault();
    };
    window.addEventListener('contextmenu', preventBrowserMenu, true);
    window.addEventListener('keydown', preventPageSelectAll, true);
    return () => {
      window.removeEventListener('contextmenu', preventBrowserMenu, true);
      window.removeEventListener('keydown', preventPageSelectAll, true);
    };
  }, []);
  const [, refreshMainFactory] = useState(0);
  useEffect(() => campaign.subscribe(() => refreshMainFactory(value => value + 1)), [campaign]);
  const [welcome, setWelcome] = useState(showWelcomeInitially);
  const [training, setTraining] = useState<TrainingSession>();
  const audio = useGameAudio(training?.engine ?? campaign, campaign);
  const [tutorialMenu, setTutorialMenu] = useState(false);
  const [hintReturn, setHintReturn] = useState<HintPanelContext>();
  const dwarvenDiscovery = !welcome && !training && !tutorialMenu ? firstSpottedDwarvenCamp(campaign.getState()) : undefined;
  const dismissDwarvenDiscovery = useCallback(() => { campaign.acknowledgeDwarvenDiscovery(); }, [campaign]);
  const tutorialInvitation = !welcome && !training && !tutorialMenu && !dwarvenDiscovery ? nextTutorialInvitation(campaign.getState()) : undefined;
  const dismissTutorialInvitation = useCallback(() => { if (tutorialInvitation) campaign.acknowledgeTutorialInvitation(tutorialInvitation); }, [tutorialInvitation, campaign]);
  const startTutorial = (kind: TutorialKind, origin?: HintPanelContext) => { if (!isTutorialUnlocked(kind, campaign.getState())) return; setHintReturn(origin); if (kind === 'expansion' || kind === 'monster-camps') campaign.acknowledgeTutorialInvitation(kind); setTraining({ id: crypto.randomUUID(), kind, engine: new GameEngine(createTutorialState(kind), { autosave: false }) }); setTutorialMenu(false); };
  const exitTutorial = () => { setTraining(undefined); setTutorialMenu(!hintReturn); };
  const finishTutorial = () => {
    setWelcome(false);
    if (!hintReturn) campaign.switchSector('5,5');
    setTraining(undefined);
    setTutorialMenu(false);
  };
  return <><FactoryApp key={training?.id ?? 'factory'} engine={training?.engine ?? campaign} audio={audio} audioPreferencesEngine={campaign} training={training} welcome={!training && welcome} onShowWelcome={() => setWelcome(true)} onCloseWelcome={() => setWelcome(false)} onTutorials={() => setTutorialMenu(true)} initialResearchContext={!training ? hintReturn : undefined} onResearchContextConsumed={() => setHintReturn(undefined)} onStartHintTutorial={startTutorial} onExitTutorial={exitTutorial} onFinishTutorial={finishTutorial} />{dwarvenDiscovery && <DwarvenDiscoveryNotice onDismiss={dismissDwarvenDiscovery} />}{tutorialMenu && <TutorialMenu game={campaign.getState()} onStart={startTutorial} onClose={() => setTutorialMenu(false)} />}{tutorialInvitation && <TutorialUnlockInvitation kind={tutorialInvitation} onStart={() => startTutorial(tutorialInvitation)} onLater={dismissTutorialInvitation} />}</>;
}

export function FactoryApp({ engine, audio, audioPreferencesEngine, training, welcome, onShowWelcome, onCloseWelcome, onTutorials, onExitTutorial, onFinishTutorial, initialResearchContext, onResearchContextConsumed, onStartHintTutorial }: { initialResearchContext?: HintPanelContext; onResearchContextConsumed?(): void; onStartHintTutorial?(kind: TutorialKind, context: HintPanelContext): void; engine: GameEngine; audio?: GameAudio; audioPreferencesEngine?: GameEngine; training?: TrainingSession; welcome: boolean; onShowWelcome(): void; onCloseWelcome(): void; onTutorials(): void; onExitTutorial(): void; onFinishTutorial(): void }) {
  const fieldViewportRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (training || !needsStartingCamera || !fieldViewportRef.current) return;
    engine.setCamera(startingCamera(engine.getSector().nodes, measureFieldViewport(fieldViewportRef.current)));
    needsStartingCamera = false;
  }, [engine, training]);
  const [, forceRender] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionInfo, setSelectionInfo] = useState<SelectionInfo>();
  const [pendingGroupNodes, setPendingGroupNodes] = useState<string[]>();
  const [pendingDisbandGroup, setPendingDisbandGroup] = useState<string>();
  const [inspectingNodeId, setInspectingNodeId] = useState<string>();
  const selectNodes = (ids: string[], info?: SelectionInfo) => {
    setSelectedIds(ids); setSelectionInfo(info); setInspectingNodeId(undefined);
    const node = ids.length === 1 ? engine.getSector().nodes.find(node => node.id === ids[0]) : undefined;
    setConfiguringNodeId(node && (!training || choices?.recipeKind === node.kind) && ['recipe', 'recipe-preview', 'filter', 'tribute', 'road'].includes(getNodeModule(node.kind, node).controls.configuration ?? '') ? node.id : undefined);
  };
  const [selectedConnection, setSelectedConnection] = useState<string>();
  const [hoveredNodeId, setHoveredNodeId] = useState<string>();
  const [placing, setPlacement] = useState<NodeKind>();
  const [pasting, setPasting] = useState(false);
  const gridSnapHeld = useGridSnapKey();
  const snapToGrid = Boolean(engine.getState().preferences.snapToGrid || gridSnapHeld);
  const [tutorialNodePositions, setTutorialNodePositions] = useState<Record<string, { x: number; y: number }>>();
  const [tutorialStage, setTutorialStage] = useState<TutorialStage>('build-open');
  const [tutorialTarget, setTutorialTarget] = useState<TutorialPlacementTarget>();
  const [placementCorrection, setPlacementCorrection] = useState<{ id: number; text: string }>();
  const correctionSequence = useRef(0);
  useEffect(() => {
    if (!placementCorrection) return;
    const timer = window.setTimeout(() => setPlacementCorrection(undefined), 12000);
    return () => window.clearTimeout(timer);
  }, [placementCorrection]);
  const [buildCategory, setBuildCategory] = useState('All');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const showRecipeIcons = useRecipeIconToggle(!training && !welcome && !confirmDelete && !pendingGroupNodes && !pendingDisbandGroup);
  const [configuringNodeId, setConfiguringNodeId] = useState<string>();
  const [skipRecipeWarnings, setSkipRecipeWarnings] = useState(false);
  const recipeCopySource = useRef<string | undefined>(undefined);
  useEffect(() => {
    const clear = () => { recipeCopySource.current = undefined; };
    const keyUp = (event: KeyboardEvent) => { if (event.key === 'Shift') clear(); };
    window.addEventListener('keyup', keyUp);
    window.addEventListener('blur', clear);
    return () => { window.removeEventListener('keyup', keyUp); window.removeEventListener('blur', clear); };
  }, []);
  const [tooltip, setTooltip] = useState<PlayfieldTooltip>();
  const positionPlayfieldTooltip = useCallback((element: HTMLDivElement | null) => {
    if (!element || !tooltip) return;
    const x = Math.max(8, Math.min(window.innerWidth - element.offsetWidth - 8, tooltip.x + 16));
    const below = tooltip.y + 16;
    const above = tooltip.y - element.offsetHeight - 10;
    const bottom = window.innerHeight - element.offsetHeight - 8;
    element.style.left = `${x}px`;
    element.style.top = `${Math.max(8, below > bottom && above >= 8 ? above : Math.min(below, bottom))}px`;
  }, [tooltip]);
  const tooltipHovered = useRef(false);
  const tooltipClearTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(tooltipClearTimer.current), []);
  const handleTooltip = (next?: PlayfieldTooltip) => {
    window.clearTimeout(tooltipClearTimer.current);
    if (next) {
      if (welcome || pendingGroupNodes || pendingDisbandGroup || minimapHovered.current) return;
      const productionHint = next.nodeId && sector.nodes.some(node => node.id === next.nodeId && node.kind === 'botPlant');
      if (!productionHint && next.eyebrow !== 'MULTI-CONNECTION PORT' && next.eyebrow !== 'CONNECTION') return;
      if (next.eyebrow === 'MULTI-CONNECTION PORT' && game.preferences.skipMultiConnectionTooltip) return;
      setTooltip(next);
    } else if (!tooltipHovered.current) tooltipClearTimer.current = window.setTimeout(() => setTooltip(undefined), 250);
  };
  useEffect(() => {
    if (welcome || pendingGroupNodes || pendingDisbandGroup) {
      setTooltip(undefined);
      setHoveredNodeId(undefined);
    }
  }, [welcome, pendingGroupNodes, pendingDisbandGroup]);
  const [interactionFailure, setInteractionFailure] = useState<InteractionFailure>();
  const dismissInteractionFailure = useCallback(() => setInteractionFailure(undefined), []);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [shortcutBars, setShortcutBars] = useState<ShortcutBarsState>(() => {
    const bars = reconcileShortcutBars(training ? Object.fromEntries(Object.entries(structuredClone(DEFAULT_SHORTCUT_BARS)).map(([id, bar], index) => [id, { ...bar, position: { x: 85, y: (training.kind === 'expansion' ? 75 : 17) + index * 8 } }])) as ShortcutBarsState : readShortcutBars({ recoverAllHidden: welcome }), engine.getState().research.unlocked);
    if (welcome && !training && bars.storage.assignments.every(kind => kind === null)) bars.storage.visible = false;
    return bars;
  });
  const [newShortcutAssignmentKeys, setNewShortcutAssignmentKeys] = useState<Set<string>>(() => training ? new Set() : readNewShortcutAssignments());
  const [shortcutBarGroups, setShortcutBarGroups] = useState<ShortcutBarGroup[]>(() => training ? [{ axis: 'vertical', barIds: [...SHORTCUT_BAR_IDS] }] : readShortcutBarGroups());
  const viewport = useViewport();
  const dockLayout = shortcutDockLayout(shortcutBars, shortcutBarGroups, viewport, Boolean(training));
  const [showAllBuildNodes, setShowAllBuildNodes] = useState(false);
  const [minimapVisible, setMinimapVisible] = useState(true);
  const minimapHovered = useRef(false);
  const handleMinimapHover = useCallback((hovered: boolean) => { minimapHovered.current = hovered; if (hovered) { setTooltip(undefined); setHoveredNodeId(undefined); } }, []);
  const [camera, setCamera] = useState<CameraState>(() => ({ ...engine.getSector().camera }));
  const seenNoticeIds = useRef(recordedNoticeIds(engine.getState()));
  const noticeTimers = useRef(new Map<string, number>());
  const loadSave = (slot: SaveSlot) => {
    engine.replaceState(slot.state);
    seenNoticeIds.current = recordedNoticeIds(engine.getState());
    noticeTimers.current.forEach(timer => window.clearTimeout(timer));
    noticeTimers.current.clear();
    setNotices([]);
  };
  const knownShortcutUnlocks = useRef(new Set((training ? undefined : readKnownShortcutUnlocks()) ?? SHORTCUT_BAR_IDS.flatMap((id) => shortcutBars[id].assignments.filter((kind): kind is NodeKind => Boolean(kind)))));

  useEffect(() => {
    const update = () => { if (!engine.getState().mod) syncStatusHintHistory(engine.getState(), ASSIGNMENT); forceRender(v => v + 1); };
    update(); return engine.subscribe(update);
  }, [engine]);
  useEffect(() => {
    engine.startRealtimeClock();
    const timer = window.setInterval(() => engine.tickRealtime(), 100);
    return () => {
      window.clearInterval(timer);
      engine.stopRealtimeClock();
    };
  }, [engine]);

  const choices = training ? tutorialChoices(training.kind, tutorialStage, engine.getState()) : undefined;
  const allowedPanel = choices?.panel;
  const canOpenPanel = (next: Exclude<Panel, null>) => !training || allowedPanel === next;
  const canBuild = (kind: NodeKind) => !training || choices?.buildKind === kind;
  const allowedBuildKind = choices?.buildKind;
  useEffect(() => { if (training && placing && placing !== allowedBuildKind) setPlacement(undefined); }, [training, placing, allowedBuildKind]);
  useEffect(() => { if (training) setBuildCategory('All'); }, [training, allowedBuildKind]);
  const game = engine.getState();
  const mapAvailable = game.devMapSurveysRevealed === true || game.research.completed.includes('exploration');
  const sector = engine.getSector();
  const selected = sector.nodes.filter((node) => selectedIds.includes(node.id));
  const selectedNode = selected.length === 1 ? selected[0] : undefined;
  const inspectingNode = inspectingNodeId ? sector.nodes.find(node => node.id === inspectingNodeId) : undefined;
  const configuringNode = configuringNodeId ? sector.nodes.find((node) => node.id === configuringNodeId) : undefined;
  const noticeEvents = [...new Map([
    ...(game.researchLog ?? []), ...game.events.filter(event => event.type === 'ResearchCompleted'), ...(game.resourceDepletionLog ?? []),
  ].map(event => [event.id, event])).values()];
  const noticeSignature = noticeEvents.map(event => event.id).join('|');
  useEffect(() => {
    if (training) return;
    const fresh = noticeEvents.filter(event => !seenNoticeIds.current.has(event.id)).sort((a, b) => b.at - a.at);
    if (!fresh.length) return;
    fresh.forEach((event) => seenNoticeIds.current.add(event.id));
    const next = fresh.map(event => eventNotice(event, game));
    setNotices((current) => [...next, ...current].slice(0, 4));
    next.forEach((notice) => { const timer = window.setTimeout(() => { setNotices((current) => current.filter((candidate) => candidate.id !== notice.id)); noticeTimers.current.delete(notice.id); }, 4500); noticeTimers.current.set(notice.id, timer); });
  }, [noticeSignature, training]);
  useEffect(() => () => { noticeTimers.current.forEach((timer) => window.clearTimeout(timer)); }, []);

  const { panel, setPanel, returnPanel, setReturnPanel, unlockFocus, unlockVisit,
    closePanels, dismissPanel, openResearchRecipe, togglePanel, openSubPanel, openUnlock } = useFactoryPanels({
    engine, training, allowedPanel, mapAvailable, setInspectingNodeId, setConfiguringNodeId,
    setPlacement, setPasting, setMinimapVisible, setBuildCategory,
  });
  useEffect(() => { if (initialResearchContext && !training) setPanel('research'); }, [initialResearchContext, training]);
  const requestDeleteNodes = useCallback((ids: string[]) => {
    const deletable = engine.getSector().nodes.filter(node => ids.includes(node.id) && canDeleteNode(node)).map(node => node.id);
    if (!deletable.length) return;
    setSelectedConnection(undefined);
    if (game.preferences.confirmDelete) { setSelectedIds(deletable); setConfirmDelete(true); }
    else { engine.deleteNodes(deletable); setSelectedIds([]); }
  }, [engine, game.preferences.confirmDelete]);
  const requestDelete = useCallback(() => {
    if (selectedConnection) { engine.deleteConnection(selectedConnection); setSelectedConnection(undefined); return; }
    requestDeleteNodes(selectedIds);
  }, [engine, requestDeleteNodes, selectedConnection, selectedIds]);
  const changeShortcutBars = useCallback((next: ShortcutBarsState) => { setShortcutBars(next); if (!training) localStorage.setItem(SHORTCUT_BARS_KEY, JSON.stringify(next)); }, []);
  const changeShortcutBarGroups = useCallback((next: ShortcutBarGroup[]) => { setShortcutBarGroups(next); if (!training) localStorage.setItem(SHORTCUT_BAR_GROUPS_KEY, JSON.stringify(next)); }, []);
  const acknowledgeShortcutAssignment = useCallback((barId: ShortcutBarId, slot: number) => {
    const prefix = `${barId}:${slot}:`;
    setNewShortcutAssignmentKeys((current) => {
      const next = new Set([...current].filter((key) => !key.startsWith(prefix)));
      if (next.size === current.size) return current;
      if (!training) localStorage.setItem(SHORTCUT_NEW_ASSIGNMENTS_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);
  useEffect(() => { setCamera({ ...engine.getSector().camera }); setSelectedConnection(undefined); setConfiguringNodeId(undefined); setTooltip(undefined); }, [engine, game, game.activeSectorId]);
  useEffect(() => { setTooltip(undefined); }, [panel]);
  useEffect(() => {
    const onBackdropMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!panel || !target.classList.contains('modal-backdrop') || target.classList.contains('welcome-backdrop') || document.querySelector('.confirm-modal')) return;
      dismissPanel();
    };
    document.addEventListener('mousedown', onBackdropMouseDown);
    return () => document.removeEventListener('mousedown', onBackdropMouseDown);
  }, [dismissPanel, panel]);
  useEffect(() => { if (!welcome && panel) audio?.play('panel'); }, [audio, panel, welcome]);
  useEffect(() => { if (!welcome && selectedIds.length) audio?.play('select'); }, [audio, selectedIds, welcome]);
  useEffect(() => { if (interactionFailure) audio?.play('reject'); }, [audio, interactionFailure]);
  const researchUnlockSignature = game.research.unlocked.join('|');
  useEffect(() => {
    const unlockedKinds = BUILDABLE_NODES.filter((node) => isNodeUnlocked(node.kind, game.research.unlocked)).map((node) => node.kind);
    const newlyUnlockedKinds = unlockedKinds.filter((kind) => !knownShortcutUnlocks.current.has(kind));
    knownShortcutUnlocks.current = new Set(unlockedKinds);
    if (!training) localStorage.setItem(SHORTCUT_UNLOCKS_KEY, JSON.stringify(unlockedKinds));
    const next = addUnlockedNodeShortcuts(reconcileShortcutBars(shortcutBars, game.research.unlocked), newlyUnlockedKinds, game.research.unlocked);
    if (JSON.stringify(next) === JSON.stringify(shortcutBars)) return;
    const addedKeys = newlyUnlockedKinds.flatMap((kind) => SHORTCUT_BAR_IDS.flatMap((barId) => {
      const slot = next[barId].assignments.indexOf(kind);
      return slot >= 0 && shortcutBars[barId].assignments[slot] !== kind ? [`${barId}:${slot}:${kind}`] : [];
    }));
    if (addedKeys.length) setNewShortcutAssignmentKeys((current) => {
      const merged = new Set([...current, ...addedKeys]);
      if (!training) localStorage.setItem(SHORTCUT_NEW_ASSIGNMENTS_KEY, JSON.stringify([...merged]));
      return merged;
    });
    setShortcutBars(next);
    if (!training) localStorage.setItem(SHORTCUT_BARS_KEY, JSON.stringify(next));
  }, [game.research.unlocked, researchUnlockSignature, shortcutBars]);

  useFactoryKeyboard({ changeShortcutBars, closePanels, configuringNodeId, confirmDelete, dismissPanel, engine, researchUnlocked: game.research.unlocked, hoveredNodeId, mapAvailable, panel, pendingGroupNodes, pendingDisbandGroup, requestDelete, nodes: sector.nodes, selectedIds, selectedNode, shortcutBars, togglePanel, welcome, training, tutorialStage, closeWelcome: () => closeWelcome(), setPendingGroupNodes, setPendingDisbandGroup, setConfirmDelete, setConfiguringNodeId, recipeCopySource, setPlacement, setPasting, setSelectedIds, setSelectedConnection, setTooltip, setMinimapVisible, choices, canBuild });

  useEffect(() => {
    if (!placing && !pasting) return;
    const cancelHeldNode = (event: PointerEvent) => {
      if (event.button !== 2) return;
      event.preventDefault(); event.stopPropagation(); setPlacement(undefined); setPasting(false);
    };
    const blockContextMenu = (event: MouseEvent) => { event.preventDefault(); event.stopPropagation(); };
    window.addEventListener('pointerdown', cancelHeldNode, true); window.addEventListener('contextmenu', blockContextMenu, true);
    return () => { window.removeEventListener('pointerdown', cancelHeldNode, true); window.removeEventListener('contextmenu', blockContextMenu, true); };
  }, [placing, pasting]);

  const inventory = useInventoryTotals(game, panel === 'inventory');

  const travelToSector = (id: string, sourceRoadId?: string) => {
    const target = game.sectors[id];
    if (!target?.unlocked || !permitsTutorialChoice(choices?.sectorId, id)) return;
    let arrivalRoadId: string | undefined;
    if (training || !fieldViewportRef.current) engine.switchSector(id);
    else if (sourceRoadId) arrivalRoadId=engine.travelThroughRoad(sourceRoadId, measureFieldViewport(fieldViewportRef.current), exteriorFieldOverviewSize(getWorldFieldSize(game)));
    else engine.travelToSector(id, measureFieldViewport(fieldViewportRef.current), exteriorFieldOverviewSize(getWorldFieldSize(game)));
    setSelectedIds(arrivalRoadId ? [arrivalRoadId] : []);
    setConfiguringNodeId(undefined);
  };
  const startPlacement = (kind: NodeKind) => {
    if (!canBuild(kind)) return;
    setPasting(false);
    setPlacement(kind);
    closePanels();
  };
  const place = (kind: NodeKind, x: number, y: number, repeat: boolean) => {
    if (!canBuild(kind)) { setPlacement(undefined); return; }
    const point = snapNodePosition({ x, y }, snapToGrid, getNodeSize({ kind }));
    const destination = correctTutorialPlacement(kind, point, training ? tutorialTarget : undefined);
    const id = engine.placeNode(kind, destination.x, destination.y);
    if (id) {
      if (destination.corrected) {
        const asides = ['The floor plan has opinions.', 'A small victory for the highlighted square.', 'Close enough for enthusiasm. The diagram was more specific.'];
        const sequence = correctionSequence.current++;
        setPlacementCorrection({ id: sequence, text: `${NODE_DEFINITIONS[kind].name} moved to the marked spot. ${asides[sequence % asides.length]}` });
      }
      setSelectedIds([id]);
      if (repeat && !training) return;
      setPlacement(undefined);
      const configuration = getNodeModule(kind).controls.configuration;
      if ((configuration === 'recipe' && kind !== 'recycler') || configuration === 'filter') setConfiguringNodeId(id);
    } else {
      setTooltip(undefined);
      setInteractionFailure({ title: kind === 'road' ? 'Road placement unavailable' : 'Placement unavailable', detail: engine.getNodePlacementError(kind, destination.x, destination.y), x: destination.x * camera.zoom + camera.x, y: destination.y * camera.zoom + camera.y });
    }
  };
  const finishShortcutBuildDrag = (kind: NodeKind, clientX: number, clientY: number, repeat: boolean) => {
    const target = document.elementFromPoint(clientX, clientY);
    if (!target?.closest('.pixi-host')) { setPlacement(undefined); return; }
    place(kind, (clientX - camera.x) / camera.zoom, (clientY - camera.y) / camera.zoom, repeat);
  };
  const closeWelcome = onCloseWelcome;
  const doDelete = () => { engine.deleteNodes(selectedIds); setSelectedIds([]); setConfirmDelete(false); };
  const requestDeleteNode = (id: string) => requestDeleteNodes([id]);
  const configureNode = (id: string) => {
    const node = sector.nodes.find((candidate) => candidate.id === id);
    if (!node) return;
    const configuration = getNodeModule(node.kind, node).controls.configuration;
    if (training && choices?.recipeKind !== node.kind && !(configuration === 'research' && allowedPanel === 'research')) return;
    setSelectedIds([id]);
    if (configuration === 'recipe' || configuration === 'recipe-preview' || configuration === 'filter' || configuration === 'tribute' || configuration === 'road') { closePanels(); setConfiguringNodeId(id); }
    else if (configuration === 'research') togglePanel('research');
    else { closePanels(); if (configuration) setInspectingNodeId(id); }
  };

  return (
    <main className={training ? "game-shell training-session" : "game-shell"} style={{ '--shortcut-dock-height': `${dockLayout.height}px` } as React.CSSProperties}>
      {!training && <AutosaveWarning engine={engine} />}
      <div className="ambient ambient-a" /><div className="ambient ambient-b" />
      <PixiPlayfield
        viewportRef={fieldViewportRef}
        engine={engine} revision={game.revision} training={Boolean(training)} selectableNodeId={choices?.selectableNodeId} selectedIds={selectedIds} selectedConnection={selectedConnection} placing={placing} snapToGrid={snapToGrid} showRecipeIcons={showRecipeIcons}
        onPaste={pasting ? point => {
          const ids = engine.pasteNodes(point);
          if (!ids.length) return;
          setPasting(false);
          setSelectedConnection(undefined);
          setSelectedIds(ids);
        } : undefined}
        roadPlacementPoint={training && placing === 'road' ? point => correctTutorialPlacement('road', point, tutorialTarget) : undefined}
        onCopyRecipe={id => {
          if (training || recipeCopySource.current === undefined) return false;
          const target = sector.nodes.find(node => node.id === id);
          const source = sector.nodes.find(node => node.id === recipeCopySource.current);
          if (!welcome && !panel && !placing && target && source?.recipeId) engine.copyRecipe(source.id, id);
          return true;
        }}
        onTravelToSector={travelToSector} onSelect={selectNodes} onNodeContextMenu={(id, priority, shiftKey) => {
          const node = sector.nodes.find(node => node.id === id);
          if (!node || welcome || panel || placing) return;
          setTooltip(undefined);
          if (shiftKey) { if (!training) recipeCopySource.current = node.recipeId ? node.id : ''; return; }
          if (!training && getNodeModule(node.kind, node).controls.configuration === 'road') {
            const error=engine.getRoadReversalError(id);
            if (error) setInteractionFailure({title:'Cannot reverse Road',detail:error,x:node.x*camera.zoom+camera.x,y:node.y*camera.zoom+camera.y});
            else engine.reverseRoad(id);
            return;
          }
          if ((!training || choices?.rotationKind === node.kind) && getNodeModule(node.kind, node).controls.rotatable && NODE_DEFINITIONS[node.kind].category === 'Logistics') { engine.rotateNode(node.id); return; }
          if (!training && isProductionMachine(node) && game.research.completed.includes(CONNECTOR_MIRRORING_RESEARCH)) { engine.mirrorProductionConnectors(id); return; }
          const group = sector.controlGroups?.find(group => group.nodeIds.includes(id));
          if (group && !priority && (!training || tutorialStage === 'control-group-disband')) { setPendingDisbandGroup(group.id); return; }
          if ((!training || tutorialStage === 'control-group-create') && selectedIds.length >= 2 && selectedIds.includes(id)) setPendingGroupNodes([...selectedIds]);
        }} onPlace={place} onConnect={(from, to, fromPort, toPort, replaceConnectionId) => engine.connectPorts(from, fromPort, to, toPort, replaceConnectionId)}
        onConnectionRejected={failure => { setTooltip(undefined); setInteractionFailure(failure); }}
        onConnectionSelect={setSelectedConnection} onDeleteConnection={(id) => { engine.deleteConnection(id); setSelectedConnection(undefined); }}
        onDeleteNode={requestDeleteNode} onCycleInputPorts={(id) => engine.cycleNodeInputOrder(id)} onCycleOutputPorts={(id) => engine.cycleNodeOutputPosition(id)} onRotate={(id) => engine.rotateNode(id)} onConfigure={configureNode}
        onClonePlacement={(kind) => { if (isNodeUnlocked(kind, game.research.unlocked)) startPlacement(kind); }} onHoverNode={setHoveredNodeId} onTooltip={handleTooltip}
        jointMoveHint={Boolean(training && tutorialStage === 'logistics-joint-move')}
        onDragPreview={training || selected.length > 1 ? setTutorialNodePositions : undefined}
        onCamera={(nextCamera) => { engine.setCamera(nextCamera); setCamera(nextCamera); }}
      />

      {!training && selected.length > 1 && !tutorialNodePositions && !placing && !pasting && !welcome && !panel && !configuringNode && !pendingGroupNodes && !pendingDisbandGroup && !confirmDelete && <SelectionActions nodes={selected} camera={camera} viewport={viewport} dockHeight={dockLayout.height} onDelete={() => requestDeleteNodes(selectedIds)} />}

      <header className="topbar glass">
        <button className="brand" disabled={Boolean(training)} onClick={onShowWelcome} aria-label="About NODE: Another Factory Game">
          <span className="brand-mark"><i /><i /><i /></span>
          <span><b>NODE</b><small>Another Factory Game</small></span>
        </button>
        <div className="sector-crumb"><span className="status-dot" /> <b>{sector.label}</b><span>/</span><strong>{sector.name}</strong><small>LVL {sectorDistance(sector.x, sector.y)}</small></div>
        <nav className="modal-trigger-strip" aria-label="Factory systems">
          {mapAvailable && <RailButton tone="map" icon="◎" label="Map" attention={cornerDiscoveryPending(game)} onInspect={() => engine.acknowledgeCornerDiscovery()} shortcut="⇧M" active={panel === 'map'} disabled={!canOpenPanel('map')} onClick={() => togglePanel('map')} />}
          <RailButton tone="research" icon="⌁" label={game.mod ? "Research" : "Upgrades"} shortcut="Q" active={panel === 'research'} disabled={!canOpenPanel('research')} onClick={() => togglePanel('research')} />
          <RailButton tone="build" icon="＋" label="Build" shortcut="B" active={panel === 'build'} disabled={!canOpenPanel('build')} onClick={() => togglePanel('build')} />
          <RailButton tone="options" icon="⚙" label="Options" shortcut="O" active={panel === 'options'} disabled={!canOpenPanel('options')} onClick={() => togglePanel('options')} />
          {!training && <RailButton tone="dev" icon="⚛" label="Dev" shortcut="" active={panel === 'dev'} onClick={() => togglePanel('dev')} />}
          <button className={`pause-button ${game.paused ? 'paused' : ''}`} disabled={Boolean(training && !game.paused)} onClick={() => engine.togglePause()} data-tooltip={game.paused ? 'Resume simulation' : 'Pause simulation'} data-tooltip-detail="Stops or resumes every unlocked sector. The entire workforce gets the memo.">{game.paused ? 'Resume' : 'Pause'} <span>{game.paused ? '▶' : 'Ⅱ'}</span></button>
        </nav>
        <div className="top-stats">
          <Stat label="Nodes" value={sector.nodes.length.toString().padStart(2, '0')} />
          <Stat label="Links" value={sector.connections.length.toString().padStart(2, '0')} />
          <Stat label="Map pts" value={game.research.mapPoints.toString().padStart(2, '0')} accent />
          <Stat label="Runtime" value={formatTime(game.playTimeMs)} />
        </div>
      </header>

      {panel === 'build' && <BuildPanel training={Boolean(training)} extra={!training ? <FactoryTemplates game={game} engine={engine} selectedIds={selectedIds}/> : undefined} canBuild={canBuild} key={unlockVisit} focusKind={unlockFocus?.panel === 'build' ? unlockFocus.nodeKind : undefined} game={game} category={buildCategory} setCategory={setBuildCategory} showAllNodes={showAllBuildNodes} onChoose={startPlacement} onClose={dismissPanel} />}
      {panel === 'inventory' && <InventoryPanel inventory={inventory} onClose={dismissPanel} />}
      {panel === 'inventory' && game.research.completed.includes('autonomousLogistics') && <section className="global-pool-panel"><h3>Global transfer pool</h3><p>Storage deposits here; Inventory withdraws through Filters. Limit: {poolCapacity(game)} per item.</p>{Object.entries(game.globalPool??{}).map(([i,n])=><p key={i}>{ITEM_NAMES[i as ItemId]} <b>{n} / {poolCapacity(game)}</b></p>)}</section>}
      {panel === 'journal' && <DiscoveryJournal game={game} onClose={dismissPanel} onOpen={(id, kind) => openUnlock(id, true, kind)} />}
      {panel === 'options' && <OptionsPanel game={game} engine={engine} audioEngine={audioPreferencesEngine} shortcutBars={shortcutBars} onShortcutBars={changeShortcutBars} onResetShortcutBars={() => { changeShortcutBars(createDefaultShortcutBars(window.innerWidth, window.innerHeight)); changeShortcutBarGroups(DEFAULT_SHORTCUT_BAR_GROUPS); }} onJournal={() => openSubPanel('journal', 'options')} onSaveLoad={() => openSubPanel('save', 'options')} onMods={() => openSubPanel('mods', 'options')} onCommands={() => openSubPanel('commands', 'options')} onRecipes={() => openSubPanel('recipes', 'options')} onTutorials={onTutorials} training={Boolean(training)} onClose={dismissPanel} />}
      {panel === 'recipes' && <RecipesPanel key={unlockVisit} initialNode={unlockFocus?.panel === 'recipes' ? unlockFocus.nodeKind : undefined} initialRecipeId={unlockFocus?.panel === 'recipes' ? unlockFocus.recipeId : undefined} backToResearch={returnPanel === 'research'} game={game} onClose={dismissPanel} />}
      {(panel === 'research' || (panel === 'recipes' && returnPanel === 'research')) && <div hidden={panel !== 'research'}>
        <ResearchPanel allowedProjectId={choices?.researchProjectId} showMilestones={!training} key={unlockVisit}
          initialContext={initialResearchContext} onContextConsumed={onResearchContextConsumed} onStartHintTutorial={!training ? onStartHintTutorial : undefined}
          focusProjectId={unlockFocus?.panel === 'research' ? unlockFocus.projectId : undefined} game={game} engine={engine}
          onClose={dismissPanel} onOpenRecipe={openResearchRecipe} onOpenMap={() => togglePanel('map')}
        />
      </div>}

      {panel === 'save' && !training && <SavePanel game={game} engine={engine} onSaved={() => audio?.play('save')} onLoad={loadSave} onClose={dismissPanel} />}
      {panel === 'commands' && <CommandsPanel onClose={dismissPanel} />}
      {panel === 'mods' && !training && <ModsModal game={game} engine={engine} onClose={dismissPanel} />}
      {panel === 'dev' && !training && <DevPanel game={game} engine={engine} showAllBuildNodes={showAllBuildNodes} onShowAllBuildNodes={setShowAllBuildNodes} onPlaceSource={() => startPlacement('devSource')} onClose={dismissPanel} />}

      <ShortcutBars training={Boolean(training)} dockLayout={dockLayout} canBuild={canBuild} bars={shortcutBars} groups={shortcutBarGroups} unlockedResearch={game.research.unlocked} completedResearch={game.research.completed} newAssignmentKeys={newShortcutAssignmentKeys} placing={placing} onChange={changeShortcutBars} onGroupsChange={changeShortcutBarGroups} onBuild={startPlacement} onBuildDragEnd={finishShortcutBuildDrag} onBuildDragCancel={() => setPlacement(undefined)} onAcknowledgeAssignment={acknowledgeShortcutAssignment} />
      {mapAvailable && (panel === 'map' || (!training && minimapVisible)) && <NodeMinimap expanded={panel === 'map'} dockHeight={dockLayout.height} allowedSectorId={choices?.sectorId} game={game} engine={engine} onTravel={id => { travelToSector(id); if (panel === 'map') closePanels(); }} onOpenMap={() => togglePanel('map')} onClose={() => { if (panel === 'map') dismissPanel(); else setMinimapVisible(false); }} onHoverChange={handleMinimapHover} />}
      {configuringNode && configuringNode.kind === 'road' && !panel && !welcome && <RoadFlowPanel node={configuringNode} game={game} engine={engine} training={Boolean(training)} onClose={() => setConfiguringNodeId(undefined)} />}
      {inspectingNode && !training && !panel && !welcome && !configuringNode && <NodeInspector node={inspectingNode} game={game} engine={engine} onFailure={setInteractionFailure} onClose={() => setInspectingNodeId(undefined)} onConfigureRecipe={() => configureNode(inspectingNode.id)} onOpenResearch={() => togglePanel('research')} onDelete={() => requestDeleteNode(inspectingNode.id)} />}

      {tooltip && !welcome && !pendingGroupNodes && !pendingDisbandGroup && !panel && !interactionFailure && <div ref={positionPlayfieldTooltip} className={`node-hover-tooltip ${tooltip.eyebrow === 'MULTI-CONNECTION PORT' ? 'multi-connection-tooltip' : ''}`} onPointerEnter={() => { tooltipHovered.current = true; window.clearTimeout(tooltipClearTimer.current); }} onPointerLeave={() => { tooltipHovered.current = false; setTooltip(undefined); }} style={{ '--tooltip-tone': tooltip.tone ?? '#87939b' } as React.CSSProperties}><small>{tooltip.eyebrow}</small><b>{tooltip.title}</b><span>{tooltip.detail}</span>{!training && tooltip.eyebrow === 'MULTI-CONNECTION PORT' && <button type="button" onPointerDown={event => event.stopPropagation()} onClick={() => { engine.updatePreferences({ skipMultiConnectionTooltip: true }); tooltipHovered.current = false; setTooltip(undefined); }}>Don't show this again</button>}</div>}
      {!training && !welcome && <EndgameNotice game={game} engine={engine} />}
      {interactionFailure && <InteractionNotice failure={interactionFailure} onDismiss={dismissInteractionFailure} />}
      {!welcome && !pendingGroupNodes && !pendingDisbandGroup && <UiTooltipLayer />}
      <div className="notification-stack" aria-live="polite">{notices.map((notice) => <article key={notice.id} className={`notification ${notice.tone}`} role={notice.tone === 'warning' ? 'alert' : undefined}><i>{notice.tone === 'warning' ? '!' : '⌁'}</i><button className="notification-content" disabled={!notice.projectId} aria-label={notice.projectId ? `View unlock: ${notice.message}` : undefined} onClick={() => { if (!notice.projectId) return; openUnlock(notice.projectId); const timer = noticeTimers.current.get(notice.id); if (timer) window.clearTimeout(timer); noticeTimers.current.delete(notice.id); setNotices(current => current.filter(candidate => candidate.id !== notice.id)); }}><small>{notice.label}</small><b>{notice.message}</b></button><button aria-label="Dismiss notification" onClick={() => { const timer = noticeTimers.current.get(notice.id); if (timer) window.clearTimeout(timer); noticeTimers.current.delete(notice.id); setNotices((current) => current.filter((candidate) => candidate.id !== notice.id)); }}>×</button><span /></article>)}</div>

      {welcome && <WelcomeModal onClose={closeWelcome} onTutorials={onTutorials} />}
      {pendingGroupNodes && <div className="modal-backdrop control-group-backdrop"><Dialog className="modal glass control-group-modal" aria-labelledby="control-group-title" onDismiss={() => setPendingGroupNodes(undefined)}>
        <PanelHeader eyebrow="CONTROL GROUPS" title="Choose a control group color" onClose={() => setPendingGroupNodes(undefined)} />
        <span id="control-group-title" className="control-group-sr-label">Choose a control group color</span>
        <p>{pendingGroupNodes.length} nodes will select and move together. They have agreed to cooperate.</p>
        <div className="control-group-palette" role="group" aria-label="Control group colors">{CONTROL_GROUP_COLORS.map(color => <button key={color.name} aria-label={`Create ${color.name} control group`} style={{ '--group-color': color.value } as React.CSSProperties} onClick={() => { const group = engine.createControlGroup(pendingGroupNodes, color.value); if (group) selectNodes(group.nodeIds); setPendingGroupNodes(undefined); }}><i /><b>{color.name}</b></button>)}</div>
        <p>Click or drag a member to control the group. Double-click to control one node. Right-click to disband.</p>
        <button className="primary-cta" onClick={() => setPendingGroupNodes(undefined)}>Cancel</button>
      </Dialog></div>}
      {pendingDisbandGroup && <ConfirmModal title="Disband this control group?" body={`The ${sector.controlGroups?.find(group => group.id === pendingDisbandGroup)?.colorName ?? 'selected'} group will be removed. Its nodes, cables, and positions stay unchanged. An administrative separation.`} confirm="DISBAND" onCancel={() => setPendingDisbandGroup(undefined)} onConfirm={() => { engine.disbandControlGroup(pendingDisbandGroup); setPendingDisbandGroup(undefined); }} />}
      {training && <TutorialGuide researchLayout={game.mod ? "current" : "upgrades"} session={training} game={game} camera={camera} nodePositions={tutorialNodePositions} onStageChange={setTutorialStage} onPlacementTarget={setTutorialTarget} placementCorrection={placementCorrection?.text} panel={panel} placing={placing} selectedIds={selectedIds} selectionInfo={selectionInfo} onPanel={value => { setPanel(value); setReturnPanel(null); setSelectedIds([]); setPlacement(undefined); }} onExit={onExitTutorial} onFinish={onFinishTutorial} />}
      {configuringNode?.kind === 'botPlant' && <BotPlantInspector node={configuringNode} completed={game.research.completed} onClose={() => setConfiguringNodeId(undefined)} />}
      {configuringNode && getNodeModule(configuringNode.kind, configuringNode).controls.configuration === 'recipe' && <NodeRecipePicker key={configuringNode.id} requiredRecipeId={training ? tutorialRecipeChoice(training.kind, configuringNode, sector.nodes) : undefined} game={game} engine={engine} node={configuringNode} skipWarnings={skipRecipeWarnings} onSkipWarnings={setSkipRecipeWarnings} onClose={() => setConfiguringNodeId(undefined)} />}
      {configuringNode?.kind === 'filter' && !panel && !welcome && <FilterPicker key={configuringNode.id} engine={engine} node={configuringNode} onClose={() => setConfiguringNodeId(undefined)} />}
      {configuringNode?.kind === 'goblinTribute' && <TributeResourcePicker key={configuringNode.id} game={game} engine={engine} node={configuringNode} onClose={() => setConfiguringNodeId(undefined)} />}
      {confirmDelete && <ConfirmModal title="Decommission selection?" body={`${selectedIds.length} node${selectedIds.length === 1 ? '' : 's'} will be dismantled. Attached cables will also be removed.`} confirm="DECOMMISSION" onCancel={() => setConfirmDelete(false)} onConfirm={doDelete} />}
    </main>
  );
}

function eventNotice(event: GameEvent, game: GameState): Notice {
  const tier = !game.mod ? BOT_UPGRADES.findIndex(upgrade => upgrade.id === event.projectId) : -1;
  if (tier >= 0) return { id: event.id, label: `${BOT_UPGRADES[tier].label} complete`, message: `${STAGES[tier + 1].role}. ${botUpgradeBenefits(BOT_UPGRADES[tier].id, true)}`, tone: 'research', projectId: event.projectId };
  if (event.type === 'DepositDepleted') return { id: event.id, message: event.message, label: 'RESOURCE DEPLETED', tone: 'warning' };
  return { id: event.id, message: event.message, label: event.projectId === 'mithrilTools' ? 'NEW RECIPES DISCOVERED' : 'RESEARCH COMPLETE', tone: 'research', projectId: researchEventProject(event) };
}

