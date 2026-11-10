import { useEffect, useRef, useState } from 'react';
import { CONTROL_GROUP_NODE_IDS, tutorialStages } from '../tutorials/tutorialRuntime';
import { tutorialInsertionTarget, tutorialPlacementTarget, type TutorialPlacementTarget } from '../tutorials/tutorialRuntime';
import type { SelectionInfo } from '../renderer/PixiPlayfield';
import type { GameEngine } from '../simulation/engine';
import type { CameraState, GameState, MachineNode, NodeKind } from '../domain/types';
import { getNodeSize, getPortAnchor } from '../domain/nodeGeometry';
import { campStatus } from '../simulation/campStatus';
import { availableTutorials } from '../tutorials/tutorialUnlocks';
import { BASIC_STAGES, createTutorialState, expansionCable, type TutorialKind, lessonCopy, lessonSatisfied, MANUAL_STAGES, TUTORIAL_NAMES } from '../tutorials/tutorialRuntime';
import { PanelHeader } from './PanelHeader';

export interface TrainingSession { id: string; kind: TutorialKind; engine: GameEngine }

const TUTORIAL_DESCRIPTIONS: Record<TutorialKind, string> = {
  basic: 'Make a Simple Core and complete your first research.',
  expansion: 'Ship Wood Home with a Cart at each end of a Road pair.',
  logistics: 'Route, split, and merge materials.',
  'monster-camps': 'Supply Attack Power and collect Tribute.',
  'control-groups': 'Select and move machines as a group.',
};

export function TutorialMenu({ game, onStart, onClose }: { game: GameState; onStart(kind: TutorialKind): void; onClose(): void }) {
  const [reference, setReference] = useState<TutorialKind>();
  const title = reference ? `${TUTORIAL_NAMES[reference]} guide` : 'Tutorials';
  return <div className="modal-backdrop tutorial-menu-backdrop">
    <section className="modal glass tutorial-menu" role="dialog" aria-modal="true" aria-label={title}>
      <PanelHeader title={title} onClose={onClose} />
      <div className="tutorial-modal-content" key={title}>
        {reference ? <>
          <button className="tutorial-button" onClick={() => setReference(undefined)}>← Back to tutorials</button>
          <ol className="tutorial-reference">
            {tutorialStages(reference).map(stage => {
              const copy = lessonCopy(stage);
              return <li key={stage}><h3>{copy.title}</h3>{copy.instruction && <p>{copy.instruction}</p>}{copy.body && <p>{copy.body}</p>}</li>;
            })}
          </ol>
        </> : <>
          <p className="tutorial-library-note">Practice in a separate factory.</p>
          {availableTutorials(game).map(kind => <article className="tutorial-choice" key={kind}>
            <div><h3>{TUTORIAL_NAMES[kind]}</h3><p>{TUTORIAL_DESCRIPTIONS[kind]}</p></div>
            <div className="tutorial-choice-actions">
              <button className="tutorial-button tutorial-primary" onClick={() => onStart(kind)}>Start {TUTORIAL_NAMES[kind]}</button>
              {kind !== 'expansion' && <button className="tutorial-button" onClick={() => setReference(kind)} aria-label={`Read ${TUTORIAL_NAMES[kind]} guide`}>Read guide</button>}
            </div>
          </article>)}
        </>}
      </div>
    </section>
  </div>;
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
  const expectedPlacement = tutorialPlacementTarget(stage, game);
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
  const sending = stage === 'expansion-road-feed';
  const roadCable = sending || stage === 'expansion-deliver' ? expansionCable({ ...game.sectors[game.activeSectorId], nodes }, sending) : undefined;
  if (roadCable && !roadCable.connected) {
    ports = [{ node: roadCable.from, direction: 'output', port: 0, label: sending ? 'CART OUTPUT' : 'ROAD OUTPUT' },
      { node: roadCable.to, direction: 'input', port: 0, label: sending ? 'ROAD INPUT' : 'CART INPUT' }];
  }
  const instruction = stage === 'expansion-deliver' && roadCable?.connected
    ? game.paused ? 'Resume the factory to let Wood reach the Home Cart.' : 'Wait for Wood to reach the Home Cart.'
    : copy.instruction;
  const camp = kind === 'monster-camps' ? nodes.find(n => n.id === 'tutorial-camp') : undefined;
  const campProgress = camp && campStatus(camp);
  const finish = index === stages.length - 1;
  const movedMembers = CONTROL_GROUP_NODE_IDS.filter(id => {
    const origin = groupMoveOrigins.current[id], node = nodes.find(node => node.id === id);
    return origin && node && Math.hypot(node.x - origin.x, node.y - origin.y) > 30;
  }).length;
  return <div className={`tutorial-layer ${kind}`} data-stage={stage} data-sector={game.activeSectorId}>
    {ports.map(({node, direction, port, label}) => { const anchor = getPortAnchor(node, direction, port); return <div className="tutorial-port-target" key={direction} style={{ left: camera.x + (node.x + anchor.x)*camera.zoom, top: camera.y + (node.y + anchor.y)*camera.zoom }}><span>{label}</span></div>; })}
    {target && <div key={stage} className="tutorial-placement-target" style={{ left: camera.x + (target.x-target.w/2)*camera.zoom, top: camera.y + (target.y-target.h/2)*camera.zoom, width: target.w*camera.zoom, height: target.h*camera.zoom }}><span>{selectionHint ?? (stage === 'control-group-move' ? 'MOVE GROUP HERE' : stage === 'logistics-joint-move' ? 'MOVE HERE' : stage.endsWith('-insert') ? 'DROP HERE' : 'PLACE HERE')}</span></div>}
    <aside className={`tutorial-callout glass ${detailsExpanded ? 'details-expanded' : ''}`} aria-label={`${TUTORIAL_NAMES[kind]} tutorial`}>
      <div className="tutorial-heading">
        <h2>{copy.title}</h2>
        <div className="tutorial-step-tools">
          <span aria-label={`Step ${index + 1} of ${stages.length}`}>{index + 1} / {stages.length}</span>
          {copy.body && <button className="tutorial-button tutorial-details-toggle" aria-expanded={detailsExpanded} onClick={() => setDetailsExpanded(value => !value)}>{detailsExpanded ? 'Less' : 'Details'}</button>}
        </div>
      </div>
      {instruction && <p className="tutorial-instruction" role="status">{instruction}</p>}
      {copy.body && <p className="tutorial-description">{copy.body}</p>}
      {stage === 'expansion-intro' && <p className="tutorial-road-route" aria-label="Sending Cart to Road pair to receiving Cart">Cart → Road pair → Cart</p>}
      {placementCorrection && <p className="tutorial-correction" role="status">{placementCorrection}</p>}
      {stage === 'control-group-move' && <p className="tutorial-status" role="status">{movedMembers} / 3 moved{movedMembers === 3 ? ' · Release to confirm' : ''}</p>}
      {campProgress && <p className="tutorial-status">{campProgress.suppliedAp} / {campProgress.requiredAp} AP · {campProgress.secondsRemaining}s to check{camp.suppressed ? ' · Suppressed' : ''}</p>}
      <footer className="tutorial-footer">
        <button className="tutorial-button" onClick={() => { engine.replaceState(createTutorialState(kind)); onPanel(null); setDetailsExpanded(false); setIndex(0); }}>Restart</button>
        {!finish && <button className="tutorial-button" onClick={onExit}>Exit practice</button>}
        {finish ? <button className="tutorial-button tutorial-primary" onClick={onFinish}>Finish tutorial</button>
          : MANUAL_STAGES.has(stage) && <button className="tutorial-button tutorial-primary" onClick={advance}>{stage === 'options-open' ? 'Open Options' : 'Continue'}</button>}
      </footer>
    </aside>
  </div>;
}
