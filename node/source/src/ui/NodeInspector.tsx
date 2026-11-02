import { itemColorCss, FILTERABLE_ITEMS, ITEM_NAMES } from '../content/items';
import { getNodeModule } from '../content/nodeModules';
import { getNodeDisplayDefinition } from '../content/nodes';
import { getResearchProject, getResearchCostsForState } from '../content/research';
import { RECIPES } from '../content/recipes';
import type { GameState, ItemId, MachineNode } from '../domain/types';
import type { GameEngine } from '../simulation/engine';
import { NodeIcon } from './NodeIcon';
import { WASTE_ITEMS } from '../content/progression';
import { getGoblinAttackRequirement, getMonsterSettlementDefinition } from '../content/goblinSettlements';
import { attackPower } from '../simulation/progression';
import { getTributeItems, tributeAmount, TRIBUTE_CAPACITY, type TributeItem } from '../simulation/goblinTribute';
import { GOLEM_AP_COST } from '../content/resourceGolems';
import { isResearchCycleActive, researchCoreStorage } from '../simulation/researchStatus';
import { productionExplanation } from '../renderer/productionVisuals';
import { isStorageNode } from '../renderer/bufferSlots';
import type { InteractionFailure } from './InteractionNotice';

const MINING_TARGETS: Array<NonNullable<MachineNode['miningTarget']>> = ['iron', 'copper', 'mythril', 'stone'];

const progressPercent = (node: MachineNode) => node.cycleMs > 0 ? Math.max(0, Math.min(100, node.progressMs / node.cycleMs * 100)) : 0;

function Buffer({ title, values }: { title: string; values: Partial<Record<ItemId, number>> }) {
  const entries = (Object.entries(values) as Array<[ItemId, number]>).filter(([, amount]) => amount > 0);
  return <div className="buffer"><span>{title}</span><div>{entries.length ? entries.map(([item, amount]) => <b key={item} style={{ borderColor: `${itemColorCss(item)}55` }}>{ITEM_NAMES[item]} <em>{Math.floor(amount)}</em></b>) : <small>Empty</small>}</div></div>;
}

export function NodeInspector({ node, game, engine, onClose, onConfigureRecipe, onOpenResearch, onDelete, onFailure }: {
  node: MachineNode;
  game: GameState;
  engine: GameEngine;
  onClose(): void;
  onConfigureRecipe(): void;
  onOpenResearch(): void;
  onDelete(): void;
  onFailure?(failure: InteractionFailure): void;
}) {
  const definition = getNodeDisplayDefinition(node);
  const module = getNodeModule(node.kind);
  const configuration = module.controls.configuration;
  const recipe = node.recipeId ? RECIPES[node.recipeId] : undefined;
  const research = getResearchProject(game.research.selected);
  const researchCosts = research ? getResearchCostsForState(research, game.research) : undefined;
  const constructing = Date.now() - node.constructedAt < node.constructionMs;
  const coreStorage = configuration === 'research' ? researchCoreStorage(node, game.research) : [];
  const progress = configuration === 'research' && !isResearchCycleActive(node, game.research) ? 0 : progressPercent(node);
  const roadMaterial = engine.getRoadTransportStatus(node.id);
  const sector = game.sectors[game.activeSectorId];
  const production = productionExplanation(node, game, sector);
  const tributeCamp = node.kind === 'monster-camp' ? node : node.kind === 'goblinTribute' ? sector.nodes.find(camp => camp.id === node.tributeCampId && camp.kind === 'monster-camp') : undefined;
  const tributeNode = tributeCamp ? sector.nodes.find(candidate => candidate.kind === 'goblinTribute' && candidate.tributeCampId === tributeCamp.id) : undefined;
  const tributeBusy = Boolean(tributeNode && (Object.values(tributeNode.output).some(amount => (amount ?? 0) > 0) || game.inFlightTransfers?.some(transfer => transfer.from === tributeNode.id)));
  const status = node.disabled ? 'DISABLED' : constructing ? 'CONSTRUCTING' : roadMaterial?.fluid ? 'FLUID TRANSPORT DISABLED' : roadMaterial?.mixed ? 'MIXED MATERIALS · TRANSPORT BLOCKED' : node.processingPaused && definition.category !== 'Logistics' ? 'PROCESSING PAUSED' : configuration === 'recipe' && !recipe ? 'RECIPE REQUIRED' : '';

  return <aside className="inspector glass" style={{ '--node-color': definition.accentCss } as React.CSSProperties}>
    <div className="panel-header"><div><small>{definition.category.toUpperCase()}</small><h2>{node.name}</h2></div><button onClick={onClose} aria-label="Close inspector">×</button></div>
    <div className="node-hero"><i><NodeIcon kind={node.kind} /></i><span>{node.infiniteResource ? 'An inexhaustible mineral reserve. Connect Extractors to the star output on any face.' : definition.description}{status && <b>{status}</b>}</span></div>
    <div className="inspector-body">
      {configuration === 'recipe' && <button className="inspector-configure" onClick={onConfigureRecipe}><span>Production recipe</span><b>{recipe?.name ?? 'Choose recipe'}</b></button>}
      {production.summary && <p className="production-status" role="status">{production.summary}</p>}
      {recipe && <section className="ingredient-status" aria-label="Production requirements"><span className="field-label">INGREDIENTS · AVAILABLE / REQUIRED</span>{production.ingredients.map(input => <p key={input.item}><span>{ITEM_NAMES[input.item]}</span><b>{input.available}/{input.required}</b><small>stored {input.available}/{input.capacity}</small></p>)}<p className="field-help">Output and waste share {production.capacity} spaces: {production.used} used. {production.committed ? 'Current batch has reserved its output room.' : `Next batch reserves ${production.requiredRoom}, including possible waste.`}</p></section>}
      {configuration === 'filter' && <label className="field-label">FILTER MATERIAL<select value={node.filterItem ?? 'wood'} onChange={(event) => engine.setFilterItem(node.id, event.target.value as ItemId)}>{FILTERABLE_ITEMS.map((item) => <option value={item} key={item}>{ITEM_NAMES[item]}</option>)}</select></label>}
      {configuration === 'mining-target' && <label className="field-label">DEPOSIT MATERIAL<select value={node.miningTarget ?? 'iron'} disabled={(node.miningProgress ?? 0) > 0} onChange={(event) => engine.setMiningTarget(node.id, event.target.value as NonNullable<MachineNode['miningTarget']>)}>{MINING_TARGETS.map((item) => <option value={item} key={item}>{ITEM_NAMES[item]}</option>)}</select><small className="field-help">The target locks after the first Motor is consumed.</small></label>}
      {configuration === 'research' && <div className="research-center-controls"><button className="inspector-configure" onClick={onOpenResearch}><span>Active research</span><b>{research?.name ?? 'Choose project'}</b></button><p className="field-help">Each cycle consumes one of every required Core together.</p>{research && researchCosts && <><div className="research-core-grid">{(Object.entries(researchCosts) as Array<[ItemId, number]>).map(([item, cost]) => <div className="required" key={item}><span>{ITEM_NAMES[item]}</span><b>{game.research.contributed[item] ?? 0}/{cost}</b><small>researched</small></div>)}</div></>}</div>}
      {roadMaterial && <div className="research-center-controls">
        <p className="field-help" role="status">{roadMaterial.fluid ? 'Fluids cannot use roads. Produce and use Water, Coolant and Copper–Carbon Dispersion locally. Existing stored contents are preserved.' : roadMaterial.mixed ? `Mixed feed blocked: ${roadMaterial.materials.map(i => ITEM_NAMES[i]).join(', ')}. Disconnect the mixed feed and use Filters to separate existing stock. Items are preserved.` : roadMaterial.materials.length ? `Transport material: ${ITEM_NAMES[roadMaterial.materials[0]]}. Both connected buffers must use this material.` : 'One material per road pair. Connecting a material source sets the allowed material on both sides.'}</p>
        {node.kind === 'road' && <>
          <p className="field-help">One item every five seconds · {node.roadMode === 'import' ? 'Receiving from' : 'Sending to'} map {node.pairedSectorId}. The single socket faces into this map.</p>
          <button className="inspector-configure" onClick={event => { const detail = engine.getRoadReversalError(node.id); if (detail) onFailure?.({ title: 'Road direction unavailable', detail, x: event.clientX, y: event.clientY }); else engine.reverseRoad(node.id); }}><span>Transport direction</span><b>REVERSE DIRECTION</b></button>
          <p className="field-help">Reversing both endpoints removes their cables. Buffered items are retained.</p>
        </>}
      </div>}
      {node.resourceItem && <div className="resource-readout"><span>{ITEM_NAMES[node.resourceItem]}</span><b>{node.infiniteResource ? 'INFINITE' : Math.floor(node.resourceRemaining ?? 0).toLocaleString()}</b><small>{node.infiniteResource ? 'Permanent reserve · Connect Extractors to any face' : `of ${Math.floor(node.resourceCapacity ?? node.resourceRemaining ?? 0).toLocaleString()}`}</small></div>}
      {node.kind === 'miningDrill' && <div className="resource-readout"><span>MOTORS INSTALLED</span><b>{node.miningProgress ?? 0}</b><small>of 20</small></div>}
      {node.kind === 'big-hole' && <div className="resource-readout"><span>STONE REQUIRED</span><b>{Math.floor(node.resourceRemaining ?? 0).toLocaleString()}</b><small>remaining</small></div>}
      {node.kind === 'goblinTribute' && <div className="resource-readout"><span>TRIBUTE STORED</span><b>{Object.values(node.output).reduce((sum, count) => sum + (count ?? 0), 0)} / {TRIBUTE_CAPACITY}</b><small>Lost entirely if suppression fails</small></div>}
      {tributeCamp && <><label className="field-label">TRIBUTE MATERIAL<select value={tributeCamp.tributeItem ?? 'iron'} disabled={tributeBusy} onChange={event => engine.setGoblinTributeItem(node.id, event.target.value as TributeItem)}>{getTributeItems(game, tributeCamp).map(item => <option key={item} value={item}>{ITEM_NAMES[item]}</option>)}</select></label><p className="field-help">{tributeAmount(tributeCamp)} materials every 5 seconds, delivered directly from the tribute node without an Extractor. {tributeCamp.suppressed ? tributeNode ? 'Tribute active. Keep meeting every AP check to retain it.' : 'Suppressed. Clear room nearby; tribute placement retries at the next successful AP check.' : 'Meet the next AP check to activate tribute.'} A failed check removes the tribute node, its stored output and its cables. {tributeBusy ? 'Drain output and wait for deliveries before changing material.' : ''}</p></>}
      {node.kind === 'monster-camp' && <><div className="resource-readout"><span>ATTACK POWER SUPPLIED</span><b>{attackPower(node)} / {getGoblinAttackRequirement(node)} AP</b><small>required every 60 seconds</small></div><p className="field-help">Next check in {Math.ceil((60000 - node.progressMs % 60000) / 1000)}s. All supplied bots are consumed at each check. Meet the requirement to shrink the settlement; otherwise it grows. Suggested research: {getMonsterSettlementDefinition(node).research}.</p></>}
      {configuration === 'research' ? <section className="research-core-storage" aria-label="Core storage"><span className="field-label">CORE STORAGE</span><div className="research-core-grid">{coreStorage.map(({ item, amount, capacity }) => <div key={item}><span style={{ color: itemColorCss(item) }}>{ITEM_NAMES[item]}</span><b>{amount}/{capacity}</b><small>stored</small></div>)}</div></section> : <><Buffer title="Input buffer" values={node.input} /><Buffer title="Output buffer" values={Object.fromEntries(Object.entries(node.output).filter(([i])=>!WASTE_ITEMS.includes(i as ItemId)))} /></>}
      {(recipe?.chanceOutputs?.length||Object.keys(node.output).some(i=>WASTE_ITEMS.includes(i as ItemId)))?<Buffer title="Waste buffer · route separately" values={Object.fromEntries(Object.entries(node.output).filter(([i])=>WASTE_ITEMS.includes(i as ItemId)))} />:null}
      {recipe?.chanceOutputs?.map(o=><p className="field-help" key={o.item}>{o.amount} {ITEM_NAMES[o.item]} · {o.probability*100}% independent chance per batch</p>)}
      {node.batch&&<p className="field-help">Batch ingredients consumed. Outcome saved; finish this batch before changing recipes.</p>}
      {node.kind==='resourceGolem'&&<div className="resource-readout"><span>ONE TIME ATTACK POWER</span><b>{(node.health ?? GOLEM_AP_COST).toLocaleString()} AP</b><small>remaining · Bot deliveries deal permanent damage</small><p className="field-help">Requires Resource Golem Survey. Defeat this Golem to create an infinite mineral reserve with four star outputs. No recurring bot cost after victory.</p></div>}
      {!isStorageNode(node.kind) && <><div className="cycle-row"><span>{recipe?.name ?? (node.kind === 'monster-camp' || node.lizardSettlement ? node.name : definition.name)}</span><b>{Math.round(progress)}%</b></div>
      <div className="thin-progress"><i style={{ width: `${progress}%` }} /></div></>}
      {node.kind === 'big-hole' && (node.resourceRemaining ?? 1) <= 0 && <button className="inspector-configure ready" onClick={() => { if (engine.clearFilledBigHole(node.id)) onClose(); }}><span>Obstruction filled</span><b>CLEAR FIELD</b></button>}
      {module.controls.deletable && <button className="danger-button" onClick={onDelete}>DECOMMISSION NODE</button>}
    </div>
  </aside>;
}
