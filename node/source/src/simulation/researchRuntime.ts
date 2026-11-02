import { getResearchCosts, getResearchCostsForState, getResearchProject, isResearchAvailable, remainingMapNodePurchases, RESEARCH_PROJECTS } from '../content/research';
import { NODE_DEFINITIONS } from '../content/nodes';
import { hasNodeBehavior } from '../content/nodeCapabilities';
import type { GameEvent, GameState, ItemId, MachineNode, NodeKind } from '../domain/types';
import { isResearchCycleActive } from './researchStatus';

/** Research lifecycle owns payments, milestones, and project selection. State is read lazily so undo/load remain valid. */
export class ResearchRuntime {
  constructor(
    private readonly getState: () => GameState,
    private readonly publish: () => void,
    private readonly event: (type: GameEvent['type'], message: string, projectId?: string) => void,
    private readonly efficiencyMultiplier: (kind: NodeKind) => number,
  ) {}

  private get state() { return this.getState(); }

  reconcileResearchSelection() {
    const selectedId = this.state.research.selected;
    if (selectedId !== 'mapNode') delete this.state.research.mapNodeQuote;
    if (!selectedId) return;
    const project = getResearchProject(selectedId);
    const invalid = !project || project.trigger || !isResearchAvailable(project, this.state.research.completed)
      || (!project.repeatable && this.state.research.completed.includes(selectedId))
      || (selectedId === 'mapNode' && remainingMapNodePurchases(this.state) === 0);
    if (!invalid) { if (selectedId === 'mapNode') this.quoteMapNodeResearch(); return; }
    this.state.research.selected = undefined;
    this.state.research.contributed = {};
    delete this.state.research.mapNodeQuote;
  }


  quoteMapNodeResearch() {
    const research = this.state.research;
    const completion = research.repeatableCompletions?.mapNode ?? 0;
    if (research.mapNodeQuote?.completion === completion) return;
    research.mapNodeQuote = { completion, costs: getResearchCosts(getResearchProject('mapNode')!, completion, research.completed) };
  }


  completeResearch(projectId: string) {
    const project = getResearchProject(projectId);
    if (!project) return;
    if (!project.repeatable && !this.state.research.unlocked.includes(projectId)) this.state.research.unlocked.push(projectId);
    if (project.repeatable) {
      const repeatable = this.state.research.repeatableCompletions ??= {};
      repeatable[projectId] = (repeatable[projectId] ?? 0) + 1;
    } else if (!this.state.research.completed.includes(projectId)) {
      this.state.research.completed.push(projectId);
    }
    if (projectId === 'exploration' || projectId === 'mapNode') this.state.research.mapPoints++;
    if (projectId === 'mapNode') delete this.state.research.mapNodeQuote;
    if (this.state.research.projectContributions) delete this.state.research.projectContributions[projectId];
    if (this.state.research.selected === projectId) { this.state.research.contributed = {}; this.state.research.selected = undefined; this.resetResearchCycles(); }
    if(projectId==='precisionControl'&&!this.state.research.completed.includes('sortingTools'))this.completeResearch('sortingTools');
    for (const definition of Object.values(NODE_DEFINITIONS)) {
      if (!definition.hidden && definition.unlockResearch === projectId) (this.state.discoveryTimes ??= {})[definition.kind] ??= this.state.playTimeMs;
    }
    this.event('ResearchCompleted', `${project.name} research complete. ${project.unlock}`, projectId);
  }


  evaluateMilestones() {
    const produced = this.state.produced ?? {};
    const extracted = this.state.extracted ?? {};
    const nodes = Object.values(this.state.sectors).flatMap((sector) => sector.nodes);
    for (const project of RESEARCH_PROJECTS) {
      if (!project.trigger || this.state.research.completed.includes(project.id)) continue;
      const complete = project.trigger.id === 'encounter' ? (project.trigger.kinds??[]).some(kind=>this.state.encounters?.includes(kind))
        : project.trigger.id === 'connection' ? Boolean(this.state.hasCreatedConnection)
        : project.trigger.id === 'assembler-built' ? nodes.some((node) => node.kind === 'assembler')
        : project.trigger.id === 'basic-core-produced' ? (produced['basic-core'] ?? 0) > 0
        : project.trigger.id === 'wood-extracted' ? (extracted.wood ?? 0) > 0
        : project.trigger.id === 'motor-produced' ? (produced.motor ?? 0) > 0
        : project.trigger.id === 'metal-extracted' ? (extracted.iron ?? 0) + (extracted.copper ?? 0) + (extracted.mythril ?? 0) > 0
        : project.trigger.id === 'plate-produced' ? (produced['iron-plate'] ?? 0) + (produced['copper-plate'] ?? 0) + (produced['mythril-plate'] ?? 0) > 0
        : project.trigger.id === 'refiner-unlocked' ? this.state.research.completed.includes('refiner')
        : project.trigger.id === 'monster-camp' ? nodes.some((node) => node.kind === 'monster-camp')
        : false;
      if (complete) this.completeResearch(project.id);
    }
  }


  simulateResearch(node: MachineNode, dt: number) {
    const selected = getResearchProject(this.state.research.selected);
    if (!selected || selected.trigger || !isResearchAvailable(selected, this.state.research.completed) || (!selected.repeatable && this.state.research.completed.includes(selected.id))) { node.progressMs = 0; return; }
    if (selected.id === 'mapNode') {
      if (remainingMapNodePurchases(this.state) === 0) { this.reconcileResearchSelection(); node.progressMs = 0; return; }
      this.quoteMapNodeResearch();
    }
    const costs = getResearchCostsForState(selected, this.state.research);
    const outstanding = Object.keys(costs).filter((item) => (this.state.research.contributed[item as ItemId] ?? 0) < (costs[item as ItemId] ?? 0)) as ItemId[];
    if (!outstanding.length) {node.progressMs=0;this.completeResearch(selected.id);return;}
    if (outstanding.some((item) => (node.input[item] ?? 0) <= 0)) { node.progressMs = 0; return; }
    node.progressMs += dt;
    const duration = node.cycleMs * this.efficiencyMultiplier(node.kind);
    if (node.progressMs < duration) return;
    node.progressMs %= duration;
    // One research iteration consumes a complete synchronized core set.
    // Credit every still-required type atomically, so a slow input cannot
    // drain faster core streams while research waits for its next batch.
    for (const item of outstanding) {
      node.input[item]!--;
      this.state.research.contributed[item] = (this.state.research.contributed[item] ?? 0) + 1;
    }
    const complete = Object.entries(costs).every(([item, cost]) => (this.state.research.contributed[item as ItemId] ?? 0) >= (cost ?? 0));
    if (complete) this.completeResearch(selected.id);
    if (!isResearchCycleActive(node, this.state.research)) node.progressMs = 0;
  }


  selectResearch(id?: string) {
    const contributions = this.state.research.projectContributions ??= {};
    const current = this.state.research.selected;
    if (current) contributions[current] = { ...this.state.research.contributed };
    if (!id) { this.state.research.selected = undefined; this.state.research.contributed = {}; delete this.state.research.mapNodeQuote; this.resetResearchCycles(); this.publish(); return; }
    const project = getResearchProject(id);
    if (!project || project.trigger || !isResearchAvailable(project, this.state.research.completed) || (!project.repeatable && this.state.research.completed.includes(id)) || (id === 'mapNode' && remainingMapNodePurchases(this.state) === 0)) return;
    this.state.research.selected = id;
    if (id === 'mapNode') this.quoteMapNodeResearch();
    else delete this.state.research.mapNodeQuote;
    this.state.research.contributed = { ...(contributions[id] ?? {}) };
    this.resetResearchCycles();
    this.publish();
  }

  resetResearchCycles() { Object.values(this.state.sectors).forEach((sector) => sector.nodes.filter((node) => hasNodeBehavior(node.kind, 'research')).forEach((node) => { node.progressMs = 0; })); }
}
