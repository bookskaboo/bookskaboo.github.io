import { campStatus } from '../simulation/campStatus';
import { ALPHA_AP, GROVE_GROWTH, FOUNDRY_INPUTS } from '../content/endgame';
import { vehiclePayload } from '../content/cartUpgrades';
import { itemColorCss, FILTERABLE_ITEMS, ITEM_NAMES } from '../content/items';
import { getNodeModule } from '../content/nodeModules';
import { getNodeDisplayDefinition } from '../content/nodes';
import { getResearchProject, getResearchCostsForState } from '../content/research';
import { RECIPES } from '../content/recipes';
import type { GameState, ItemId, MachineNode } from '../domain/types';
import type { GameEngine } from '../simulation/engine';
import { NodeIcon } from './NodeIcon';
import { WASTE_ITEMS } from '../content/progression';
import { getMonsterSettlementDefinition } from '../content/goblinSettlements';
import { getTributeItems, isCampFullySuppressed, tributeAmount, tributeMaterial, tributeCapacity, type TributeItem } from '../simulation/goblinTribute';
import { golemApCost } from '../content/resourceGolems';
import { isResearchCycleActive, researchCoreStorage } from '../simulation/researchStatus';
import { productionExplanation } from '../renderer/productionVisuals';
import { isStorageNode } from '../renderer/bufferSlots';
import type { InteractionFailure } from './InteractionNotice';
const MINING_TARGETS: Array<NonNullable<MachineNode['miningTarget']>> = ['iron', 'copper', 'stone'];
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
  const progress = node.kind === 'monster-camp' ? campStatus(node).fraction * 100 : configuration === 'research' && !isResearchCycleActive(node, game.research) ? 0 : progressPercent(node);
  const roadMaterial = engine.getRoadTransportStatus(node.id);
  const sector = game.sectors[game.activeSectorId];
  const production = productionExplanation(node, game, sector);
  const tributeCamp = node.kind === 'monster-camp' ? node : node.kind === 'goblinTribute' ? sector.nodes.find(camp => camp.id === node.tributeCampId && camp.kind === 'monster-camp') : undefined;
  const tributeNode = tributeCamp ? sector.nodes.find(candidate => candidate.kind === 'goblinTribute' && candidate.tributeCampId === tributeCamp.id) : undefined;
  const status = node.disabled ? 'DISABLED' : constructing ? 'CONSTRUCTING' : roadMaterial?.fluid ? 'FLUID TRANSPORT DISABLED' : roadMaterial?.mixed ? 'MIXED MATERIALS · TRANSPORT BLOCKED' : node.processingPaused && definition.category !== 'Logistics' ? 'PROCESSING PAUSED' : configuration === 'recipe' && !recipe ? 'RECIPE REQUIRED' : '';
  return <aside className="inspector glass" style={{ '--node-color': definition.accentCss } as React.CSSProperties}>
    <div className="panel-header"><div><small>{definition.category.toUpperCase()}</small><h2>{node.name}</h2></div><button onClick={onClose} aria-label="Close inspector">×</button></div>
    <div className="node-hero"><i><NodeIcon kind={node.kind} node={node} completedResearch={game.research.completed} /></i><span>{node.infiniteResource ? 'An inexhaustible mineral reserve. Connect Extractors to the star output on any face.' : definition.description}{status && <b>{status}</b>}</span></div>
    <div className="inspector-body">
      {configuration === 'recipe' && <button className="inspector-configure" onClick={onConfigureRecipe}><span>Production recipe</span><b>{recipe?.name ?? 'Choose recipe'}</b></button>}
      {production.summary && <p className="production-status" role="status">{production.summary}</p>}
      {recipe && <section className="ingredient-status" aria-label="Production requirements"><span className="field-label">INGREDIENTS · AVAILABLE / REQUIRED</span>{production.ingredients.map(input => <p key={input.item}><span>{ITEM_NAMES[input.item]}</span><b>{input.available}/{input.required}</b><small>stored {input.available}/{input.capacity}</small></p>)}<p className="field-help">Output and waste share {production.capacity} spaces: {production.used} used. {production.committed ? 'Current batch has reserved its output room.' : `Next batch needs ${production.requiredRoom} spaces for all outputs.`}</p></section>}
      {node.filterBlocked && <p className="production-status" role="status">Filter blocked — {node.filterBlocked} outlet cannot forward waiting material. Connect that outlet and free space downstream; both outlets resume together.</p>}
      {configuration === 'filter' && <label className="field-label">SELECTED OUTPUT MATERIAL<select value={node.filterItem ?? 'wood'} onChange={(event) => engine.setFilterItem(node.id, event.target.value as ItemId)}>{FILTERABLE_ITEMS.map((item) => <option value={item} key={item}>{ITEM_NAMES[item]}</option>)}</select></label>}
      {configuration === 'mining-target' && <label className="field-label">DEPOSIT MATERIAL<select value={node.miningTarget ?? 'iron'} disabled={(node.miningProgress ?? 0) > 0} onChange={(event) => engine.setMiningTarget(node.id, event.target.value as NonNullable<MachineNode['miningTarget']>)}>{MINING_TARGETS.map((item) => <option value={item} key={item}>{ITEM_NAMES[item]}</option>)}</select><small className="field-help">The target locks after the first Motor is consumed.</small></label>}
      {configuration === 'research' && <div className="research-center-controls"><button className="inspector-configure" onClick={onOpenResearch}><span>Active research</span><b>{research?.name ?? 'Choose project'}</b></button><p className="field-help">Each cycle consumes one of every required Core together.</p>{research && researchCosts && <><div className="research-core-grid">{(Object.entries(researchCosts) as Array<[ItemId, number]>).map(([item, cost]) => <div className="required" key={item}><span>{ITEM_NAMES[item]}</span><b>{game.research.contributed[item] ?? 0}/{cost}</b><small>researched</small></div>)}</div></>}</div>}
      {roadMaterial && <div className="research-center-controls">
        <p className="field-help" role="status">{roadMaterial.fluid ? 'Fluids cannot use roads. Produce and use Water, Coolant and Copper Slurry locally. Existing stored contents are preserved.' : roadMaterial.mixed ? `Mixed feed blocked: ${roadMaterial.materials.map(i => ITEM_NAMES[i]).join(', ')}. Disconnect the mixed feed and use Filters to separate existing stock. Items are preserved.` : roadMaterial.materials.length ? `Transport material: ${ITEM_NAMES[roadMaterial.materials[0]]}. Both connected buffers must use this material.` : 'One material per road pair. Connecting a material source sets the allowed material on both sides.'}</p>
        {node.kind === 'road' && <>
          <p className="field-help">Up to {vehiclePayload(game.research.completed,game.research.repeatableCompletions?.trainFreightCapacity??0)} items every five seconds · {node.roadMode === 'import' ? 'Receiving from' : 'Sending to'} map {node.pairedSectorId}. The single socket faces into this map.</p>
          <button className="inspector-configure" onClick={event => { const detail = engine.getRoadReversalError(node.id); if (detail) onFailure?.({ title: 'Road direction unavailable', detail, x: event.clientX, y: event.clientY }); else engine.reverseRoad(node.id); }}><span>Transport direction</span><b>REVERSE DIRECTION</b></button>
          <p className="field-help">Reversing both endpoints removes their cables. Buffered items are retained.</p>
        </>}
      </div>}
      {node.kind==='cornerChallenge'&&<div className="resource-readout"><span>{node.name}</span>{node.cornerType==='foundry'?<>{Object.entries(FOUNDRY_INPUTS).map(([i,n])=><p key={i}>{ITEM_NAMES[i as import('../domain/types').ItemId]}: {(node.input[i as import('../domain/types').ItemId]??0).toLocaleString()} / {n!.toLocaleString()}</p>)}<small>One complete set → one piece immediately. Input capacity: one set.</small></>:<><b>{node.cornerType==='reclamation'?((node.cornerProgress??0)*100).toFixed(3)+'%':(node.cornerProgress??0).toLocaleString()}</b><small>{node.cornerType==='alpha'?'of '+ALPHA_AP.toLocaleString()+' AP · 100-bot input buffer':node.cornerType==='grove'?'of '+GROVE_GROWTH.toLocaleString()+' growth · 100-growth input buffer':'Any waste mix · 100-item input buffer · waste types contribute different credits'}</small></>}<p className="field-help">Collect pieces from the linked Tribute box. Full output preserves supplies and progress.</p></div>}
      {node.kind==='cornerTribute'&&<p className="field-help">Ten pieces maximum. Route these to this world’s Yin and Yang recipes.</p>}
      {node.kind==='recycler'&&<p className="field-help">2 seconds per input · 10 inputs / 10 mixed outputs. At most one of each constituent solid resource, including fuel Wood. Basic resources return nothing; waste is not accepted.</p>}
      {node.resourceItem && <div className="resource-readout"><span>{ITEM_NAMES[node.resourceItem]}</span><b>{node.infiniteResource ? 'INFINITE' : Math.floor(node.resourceRemaining ?? 0).toLocaleString()}</b><small>{node.infiniteResource ? 'Permanent reserve · Connect Extractors to any face' : `of ${Math.floor(node.resourceCapacity ?? node.resourceRemaining ?? 0).toLocaleString()}`}</small></div>}
      {node.kind === 'miningDrill' && <div className="resource-readout"><span>MOTORS INSTALLED</span><b>{node.miningProgress ?? 0}</b><small>of 20</small></div>}
      {node.kind === 'big-hole' && <div className="resource-readout"><span>STONE REQUIRED</span><b>{Math.floor(node.resourceRemaining ?? 0).toLocaleString()}</b><small>remaining</small></div>}
      {node.kind === 'goblinTribute' && <div className="resource-readout"><span>TRIBUTE STORED</span><b>{Object.values(node.output).reduce<number>((sum, count) => sum + (count ?? 0), 0)} / {tributeCamp ? tributeCapacity(tributeCamp) : node.capacity ?? 100}</b><small>{tributeCamp?.lizardSettlement ? 'Stock and wiring survive missed suppression checks' : 'Lost entirely if suppression fails'}</small></div>}
      {tributeCamp && <><label className="field-label">TRIBUTE MATERIAL<select value={tributeMaterial(tributeCamp)} onChange={event => engine.setGoblinTributeItem(node.id, event.target.value as TributeItem)}>{getTributeItems(game, tributeCamp).map(item => <option key={item} value={item}>{ITEM_NAMES[item]}</option>)}</select></label><p className="field-help">{tributeAmount(tributeCamp)} materials every 5 seconds, delivered directly from the tribute node without an Extractor. {isCampFullySuppressed(tributeCamp) ? tributeNode ? 'Tribute active. Keep meeting every AP check to retain it.' : 'Suppressed. Clear room nearby; tribute placement retries at the next successful AP check.' : 'Shrink the settlement to 10% to activate tribute.'} {tributeCamp.lizardSettlement ? 'Missed checks pause new Mythril; stock, wiring and insufficient bots are preserved. Payment retries as soon as enough AP arrives.' : 'A failed check removes the tribute node, its stored output and its cables. Changing material discards other stored tribute.'}</p></>}
      {node.kind === 'monster-camp' && <><div className="resource-readout"><span>ATTACK POWER SUPPLIED</span><b>{campStatus(node).suppliedAp} / {campStatus(node).requiredAp} AP</b><small>required every 60 seconds{node.lizardSettlement ? ` · ${node.suppressionCredit ?? 0} AP credit retained` : ''}</small></div><p className="field-help">Next check in {campStatus(node).secondsRemaining}s. {node.campLastCheck ? `Last check ${node.campLastCheck.passed ? 'passed' : 'failed'} (${node.campLastCheck.suppliedAp} / ${node.campLastCheck.requiredAp} AP).` : 'No check completed yet.'} Each successful check consumes only the bots needed; surplus bots remain. {node.lizardSettlement ? 'Overpaid AP carries forward. Failed checks preserve bots and credit.' : 'Failed checks consume insufficient bots.'} Meet the requirement to shrink the settlement; otherwise it grows. Suggested research: {getMonsterSettlementDefinition(node).research}.</p></>}
      {configuration === 'research' ? <section className="research-core-storage" aria-label="Core storage"><span className="field-label">CORE STORAGE</span><div className="research-core-grid">{coreStorage.map(({ item, amount, capacity }) => <div key={item}><span style={{ color: itemColorCss(item) }}>{ITEM_NAMES[item]}</span><b>{amount}/{capacity}</b><small>stored</small></div>)}</div></section> : <><Buffer title="Input buffer" values={node.input} /><Buffer title="Output buffer" values={Object.fromEntries(Object.entries(node.output).filter(([i])=>!WASTE_ITEMS.includes(i as ItemId)))} /></>}
      {(recipe?.chanceOutputs?.length||Object.keys(node.output).some(i=>WASTE_ITEMS.includes(i as ItemId)))?<Buffer title="Waste stock · shared output" values={Object.fromEntries(Object.entries(node.output).filter(([i])=>WASTE_ITEMS.includes(i as ItemId)))} />:null}
      {recipe?.chanceOutputs?.map(o=><p className="field-help" key={o.item}>{o.amount} {ITEM_NAMES[o.item]} · {o.probability*100}% independent chance per batch</p>)}
      {['treePlanter','tree-planter'].includes(node.kind)&&<p className="field-help">Paid growth remaining: {node.growthCredit??0}. One set of 10 Wood, 1 Iron Plate and 1 Stone funds 100 units. Both production and delivery count individual growth units.</p>}
      {node.batch&&<p className="field-help">Batch ingredients consumed. Outcome saved; finish this batch before changing recipes.</p>}
      {node.kind==='resourceGolem'&&<div className="resource-readout"><span>ONE TIME ATTACK POWER</span><b>{(node.health ?? golemApCost(node)).toLocaleString()} AP</b><small>remaining · Bot deliveries deal permanent damage</small><p className="field-help">Requires Resource Golem Survey. Defeat this Golem to create an infinite mineral reserve with four star outputs. No recurring bot cost after victory.</p></div>}
      {!isStorageNode(node.kind) && node.kind !== 'goblinTribute' && <><div className="cycle-row"><span>{recipe?.name ?? (node.kind === 'monster-camp' || node.lizardSettlement ? node.name : definition.name)}</span><b>{Math.round(progress)}%</b></div>
      <div className="thin-progress"><i style={{ width: `${progress}%` }} /></div></>}
      {node.kind === 'big-hole' && (node.resourceRemaining ?? 1) <= 0 && <button className="inspector-configure ready" onClick={() => { if (engine.clearFilledBigHole(node.id)) onClose(); }}><span>Obstruction filled</span><b>CLEAR FIELD</b></button>}
      {module.controls.deletable && <button className="danger-button" onClick={onDelete}>DECOMMISSION NODE</button>}
    </div>
  </aside>;
}
