import { useEffect, useRef, useState } from 'react';
import { CONTROL_GROUP_NODE_IDS, tutorialStages } from '../tutorials/tutorialRuntime';
import { tutorialInsertionTarget, tutorialPlacementTarget, type TutorialPlacementTarget } from '../tutorials/tutorialRuntime';
import type { SelectionInfo } from '../renderer/PixiPlayfield';
import type { GameEngine } from '../simulation/engine';
import type { CameraState, GameState, MachineNode, NodeKind } from '../domain/types';
import { getNodeSize, getPortAnchor } from '../domain/nodeGeometry';
import { attackPower } from '../simulation/progression';
import { availableTutorials } from '../tutorials/tutorialUnlocks';
import { getGoblinAttackRequirement } from '../content/goblinSettlements';
import { type GuidedTutorialKind } from '../tutorials/originalTutorials';
import { BASIC_STAGES, createTutorialState, EXPANSION_HOME, EXPANSION_OUTPOST, expansionDelivered, type TutorialKind, lessonCopy, lessonSatisfied, MANUAL_STAGES, TUTORIAL_NAMES } from '../tutorials/tutorialRuntime';

export interface TrainingSession { id: string; kind: TutorialKind; engine: GameEngine }

export function TutorialMenu({ game, onStart, onClose }: { game: GameState; onStart(kind: TutorialKind): void; onClose(): void }) {
  const [reference, setReference] = useState<GuidedTutorialKind>();
  return <div className="modal-backdrop tutorial-menu-backdrop"><section className="modal glass tutorial-menu" aria-label="Tutorial library">
    <header className="panel-header"><div><small>LEARN TO PLAY</small><h2>{reference ? `${TUTORIAL_NAMES[reference]} guide` : 'Tutorials'}</h2></div><button aria-label="Close tutorials" onClick={onClose}>×</button></header>
    {reference ? <><p className="tutorial-library-note">Reference guides for routing, cable insertion, and factory controls. The cables have a syllabus.</p><button onClick={() => setReference(undefined)}>← Back to tutorials</button><div className="tutorial-reference">{tutorialStages(reference).map((stage, index) => { const copy = lessonCopy(stage); return <article key={stage}><small>STEP {index + 1}</small><h3>{copy.title}</h3><p>{copy.body}</p><b>{copy.instruction}</b></article>; })}</div></> : <>
    <p className="tutorial-library-note">Practice in a separate factory. Your main game stays paused. No lasting evidence.</p>
    {availableTutorials(game).map(kind => <article className="tutorial-choice" key={kind}><h3>{TUTORIAL_NAMES[kind]}</h3><p>{kind === 'basic' ? 'Turn Wood and Copper into a Simple Core, then research. A small industrial incident.' : kind === 'expansion' ? 'Visit another map and bring Wood Home by Road. Local Wood was apparently insufficient.' : kind === 'logistics' ? 'Route, split, and merge materials. Untangle your intentions.' : kind === 'monster-camps' ? 'Learn camp borders and recurring Attack Power checks. The neighbors keep a schedule.' : 'Group machines, move them together, and control individual members. A committee that actually works.'}</p><div>{<button className="primary-cta" onClick={() => onStart(kind)}>Start {TUTORIAL_NAMES[kind]}</button>}{kind !== 'expansion' && <button onClick={() => setReference(kind)}>Read guide</button>}</div></article>)}
    </>}
  </section></div>;
}

export function TutorialGuide({ session, game, camera, nodePositions, panel, placing, selectedIds = [], selectionInfo, onPlacementTarget, onStageChange, placementCorrection, onPanel, onExit, onFinish }: { session: TrainingSession; game: GameState; camera: CameraState; nodePositions?: Record<string, { x: number; y: number }>; panel: string | null; placing?: NodeKind; selectedIds?: string[]; selectionInfo?: SelectionInfo; onPlacementTarget(target?: TutorialPlacementTarget): void; onStageChange(stage: typeof BASIC_STAGES[number]): void; placementCorrection?: string; onPanel(value: 'research' | 'map' | 'options' | null): void; onExit(): void; onFinish(): void }) {
  const { kind, engine } = session;
  const stages = tutorialStages(kind);
  const groupMoveOrigins = useRef<Record<string, { x: number; y: number }>>({});
  const [index, setIndex] = useState(0);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const stage = stages[index];
  const copy = lessonCopy(stage);
  const stepComplete = lessonSatisfied(stage, game, panel, placing, { selectedIds, selectionInfo, moveOrigins: groupMoveOrigins.current });
  useEffect(() => { onStageChange(stage); }, [stage, onStageChange]);
  const expectedPlacement = tutorialPlacementTarget(stage, game.sectors[game.activeSectorId].nodes);
  useEffect(() => {
    onPlacementTarget(expectedPlacement);
    return () => onPlacementTarget(undefined);
  }, [onPlacementTarget, expectedPlacement?.kind, expectedPlacement?.x, expectedPlacement?.y]);
  const advance = () => {
    const next = stages[index + 1];
    if (next === 'options-explain') onPanel('options');
    if (!next) { onFinish(); return; }
    if (next === 'control-group-move') groupMoveOrigins.current = Object.fromEntries(game.sectors[game.activeSectorId].nodes.filter(node => CONTROL_GROUP_NODE_IDS.includes(node.id)).map(node => [node.id, { x: node.x, y: node.y }]));
    if (['control-group-click', 'control-group-double-click', 'control-group-move', 'control-group-select-forward', 'control-group-select-reverse', 'control-group-disband'].includes(next)) onPanel(null);
    if (next === 'make-charcoal') { const state = structuredClone(engine.getState()); state.sectors[state.activeSectorId].camera = { x: 10, y: 10, zoom: .5 }; engine.replaceState(state); onPanel(null); }
    else if (['logistics-joint-insert', 'logistics-splitter-insert', 'logistics-merger-insert'].includes(next)) { engine.replaceState(createTutorialState('logistics', next.replace('logistics-', ''))); onPanel(null); }
    else if (next === 'cores-open') onPanel('research');
    else if (next === 'logistics-splitter-connect') { engine.replaceState(createTutorialState('logistics', 'splitter')); onPanel(null); }
    else if (next === 'logistics-merger-connect') { engine.replaceState(createTutorialState('logistics', 'merger')); onPanel(null); }
    else if (next === 'cores-explain' || next === 'shortcuts') onPanel(null);
    setIndex(index + 1);
  };
  useEffect(() => {
    if (stepComplete) advance();
  }, [stage, stepComplete]);
  useEffect(() => {
    const target = stage === 'research-explain' ? 'joint' : stage === 'cores-open' ? 'assembler' : undefined;
    if (!target || panel !== 'research') return;
    const frame = requestAnimationFrame(() => { const card = document.querySelector(`[data-research-id="${target}"]`); const completed = card?.closest('details'); if (completed) completed.open = true; card?.scrollIntoView({ block: 'center' }); });
    return () => cancelAnimationFrame(frame);
  }, [stage, panel]);

  const nodes = game.sectors[game.activeSectorId].nodes.map(node => nodePositions?.[node.id] ? { ...node, ...nodePositions[node.id] } : node);
  let target: { x: number; y: number; w: number; h: number } | undefined;
  if (expectedPlacement) target = { ...expectedPlacement, ...getNodeSize({ kind: expectedPlacement.kind } as MachineNode) };
  const insertionTarget = tutorialInsertionTarget(stage, game);
  if (insertionTarget) target = insertionTarget;
  if (stage === 'logistics-joint-move') target = { x: 680, y: 650, w: 90, h: 90 };
  if (stage === 'control-group-move') {
    const origin = groupMoveOrigins.current[CONTROL_GROUP_NODE_IDS[0]];
    const first = nodes.find(node => node.id === CONTROL_GROUP_NODE_IDS[0]);
    if (origin && first) target = { x: origin.x + 240, y: origin.y + 160, ...getNodeSize(first) };
  }
  const selectionHint = stepComplete ? undefined
    : stage === 'control-group-double-click' ? 'SELECT THIS NODE'
    : stage === 'control-group-select-forward' ? 'BOX SELECT ↘'
    : stage === 'control-group-select-reverse' ? 'BOX SELECT ↖' : undefined;
  if (selectionHint) {
    const node = nodes.find(node => node.id === CONTROL_GROUP_NODE_IDS[0]);
    if (node) target = { x: node.x, y: node.y, ...getNodeSize(node) };
  }
  const source = stage === 'connect-resource' ? nodes.find(n => n.kind === 'forest') : stage === 'store-item' ? nodes.find(n => n.kind === 'extractor') : undefined;
  const destination = stage === 'connect-resource' ? nodes.find(n => n.kind === 'extractor') : stage === 'store-item' ? nodes.find(n => n.kind === 'woodenChest') : undefined;
  let ports = source && destination ? [{ node: source, direction: 'output' as const, port: 0, label: 'DRAG FROM HERE' }, { node: destination, direction: 'input' as const, port: 0, label: 'TO HERE' }] : [];
  const node = (kind: NodeKind) => nodes.find(n => n.kind === kind);
  const copperExtractor = nodes.find(n => n.kind === 'extractor' && game.sectors[game.activeSectorId].connections.some(c => c.from === 'tutorial-copper' && c.to === n.id)) ?? nodes.filter(n => n.kind === 'extractor')[1];
  const gearRefiner = nodes.find(n => n.kind === 'refiner' && n.recipeId?.endsWith('-gear'));
  const coreRefiner = nodes.find(n => n.kind === 'refiner' && n.recipeId === 'simple-core');
  const hints: Array<[MachineNode | undefined, MachineNode | undefined, number]> = stage === 'make-charcoal' ? [[node('woodenChest'), node('kiln'), 0]]
    : stage === 'mine-copper' ? [[node('copper'), copperExtractor, 0]]
    : stage === 'make-plates' ? [[copperExtractor, node('smelter'), 0], [node('kiln'), node('smelter'), 1]]
    : stage === 'make-gears' ? [[node('smelter'), gearRefiner, 0]]
    : stage === 'make-core' ? [[gearRefiner, coreRefiner, 0]]
    : stage === 'deliver-core' ? [[coreRefiner, node('researchCenter'), 0]] : [];
  const pending = hints.find(([from, to, port]) => from && to && !game.sectors[game.activeSectorId].connections.some(c => c.from === from.id && c.to === to.id && (c.toPort ?? 0) === port));
  if (pending) ports = [{ node: pending[0]!, direction: 'output', port: 0, label: 'DRAG FROM HERE' }, { node: pending[1]!, direction: 'input', port: pending[2], label: 'TO HERE' }];
  if (stage === 'expansion-road-feed' || stage === 'expansion-deliver') {
    const road = nodes.find(n => n.kind === 'road' && n.roadMode === (stage === 'expansion-road-feed' ? 'export' : 'import') && n.pairedSectorId === (stage === 'expansion-road-feed' ? EXPANSION_HOME : EXPANSION_OUTPOST));
    const chest = nodes.find(n => n.id === (stage === 'expansion-road-feed' ? 'expansion-outpost-chest' : 'expansion-home-chest'));
    const from = stage === 'expansion-road-feed' ? chest : road;
    const to = stage === 'expansion-road-feed' ? road : chest;
    if (from && to && !game.sectors[game.activeSectorId].connections.some(c => c.from === from.id && c.to === to.id)) ports = [{ node: from, direction: 'output', port: 0, label: 'DRAG FROM HERE' }, { node: to, direction: 'input', port: 0, label: 'TO HERE' }];
  }
  const camp = kind === 'monster-camps' ? nodes.find(n => n.id === 'tutorial-camp') : undefined;
  const finish = index === stages.length - 1;
  const movedMembers = CONTROL_GROUP_NODE_IDS.filter(id => {
    const origin = groupMoveOrigins.current[id], node = nodes.find(node => node.id === id);
    return origin && node && Math.hypot(node.x - origin.x, node.y - origin.y) > 30;
  }).length;
  return <div className={`tutorial-layer ${kind}`} data-stage={stage} data-sector={game.activeSectorId}>
    {ports.map(({node, direction, port, label}) => { const anchor = getPortAnchor(node, direction, port); return <div className="tutorial-port-target" key={direction} style={{ left: camera.x + (node.x + anchor.x)*camera.zoom, top: camera.y + (node.y + anchor.y)*camera.zoom }}><span>{label}</span></div>; })}
    {target && <div key={stage} className="tutorial-placement-target" style={{ left: camera.x + (target.x-target.w/2)*camera.zoom, top: camera.y + (target.y-target.h/2)*camera.zoom, width: target.w*camera.zoom, height: target.h*camera.zoom }}><span>{selectionHint ?? (stage === 'control-group-move' ? 'MOVE GROUP HERE' : stage === 'logistics-joint-move' ? 'MOVE HERE' : stage.endsWith('-insert') ? 'DROP HERE' : 'PLACE HERE')}</span></div>}
    <aside className={`tutorial-callout glass ${detailsExpanded ? 'details-expanded' : ''}`} aria-label={`${TUTORIAL_NAMES[kind]} tutorial`}>
      <div className="tutorial-heading"><small>{TUTORIAL_NAMES[kind].toUpperCase()} · {index + 1} / {stages.length}</small><button className="tutorial-details-toggle" aria-expanded={detailsExpanded} onClick={() => setDetailsExpanded(value => !value)}>{detailsExpanded ? 'Less detail ▴' : 'Details ▾'}</button></div>
      <h2>{copy.title}</h2><p className="tutorial-description">{copy.body}</p><strong role="status">{copy.instruction}</strong>
      {placementCorrection && <p className="tutorial-correction" role="status">{placementCorrection}</p>}
      {stage === 'control-group-move' && <p className="tutorial-goal" role="status">{movedMembers} / 3 nodes moved{movedMembers === 3 ? ' · Release to confirm.' : ' · Drag a node header, away from its sockets.'}</p>}
      {kind === 'basic' && <p className="tutorial-goal">Goal: make a Simple Core · {(game.produced?.['simple-core'] ?? 0) > 0 ? <span className="tutorial-goal-achieved">Achieved ✓</span> : 'In progress'}</p>}
      {kind === 'expansion' && <p className="tutorial-goal">Goal: bring Wood Home · {expansionDelivered(game) ? <span className="tutorial-goal-achieved">Achieved ✓</span> : 'In progress'}</p>}
      {camp && <p className="tutorial-camp-status">Attack Power: {attackPower(camp)} / {getGoblinAttackRequirement(camp)} · Next check: {Math.ceil((60000 - camp.progressMs % 60000) / 1000)}s · {camp.suppressed ? 'Suppressed' : 'Not suppressed'}</p>}
      <div className="tutorial-guide-actions"><button onClick={() => { engine.replaceState(createTutorialState(kind)); onPanel(null); setIndex(0); }}>Restart lesson</button>{!finish && MANUAL_STAGES.has(stage) && <button className="tutorial-continue" onClick={advance}>{stage === 'options-open' ? 'Open Options →' : 'Continue →'}</button>}</div>
      <footer className="tutorial-footer"><small className="tutorial-safe-note">Practice factory · Your real factory is spared the experiment</small><button className="tutorial-exit" onClick={finish ? onFinish : onExit}>{finish ? 'Finish tutorial' : 'Exit practice'}</button></footer>
    </aside>
  </div>;
}
