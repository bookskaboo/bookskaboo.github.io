import { mkdirSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { RECIPES } from '../src/content/recipes';
import { getResearchCosts, RESEARCH_PROJECTS } from '../src/content/research';
import { CORE_ITEMS } from '../src/content/progression';
import { RESEARCH_CENTER_BASE_CYCLE_MS } from '../src/content/researchTiming';

const ANALYSIS_CORES=CORE_ITEMS.filter(i=>i!=='final-core');
type Bag = Record<string, number>;
type Bill = { raw: Bag; workSeconds: Bag };
type ModelRecipe = { inputs: Bag; seconds: number };
const model: Record<string, ModelRecipe> = {};
for (const recipe of Object.values(RECIPES)) {
  if(recipe.recovery || recipe.id.startsWith('efficient-'))continue;
  // Prefer the later composite Gear/Wire recipes for Complex; retain the legacy Refiner alternatives in gameplay.
  for (const [item, amount] of Object.entries(recipe.outputs).slice(0,1)) model[item] = {
    inputs: Object.fromEntries(Object.entries(recipe.inputs).map(([key, count]) => [key, count! / amount!])),
    seconds: recipe.cycleMs / 1000 / amount!,
  };
}

function add(target: Bag, source: Bag, multiplier = 1) {
  for (const [item, amount] of Object.entries(source)) target[item] = (target[item] ?? 0) + amount * multiplier;
}

function expand(items: Bag): Bill {
  const result: Bill = { raw: {}, workSeconds: {} };
  for (const [item, amount] of Object.entries(items)) {
    const recipe = model[item];
    if (!recipe) {
      result.raw[item] = (result.raw[item] ?? 0) + amount;
      result.workSeconds[`extract:${item}`] = (result.workSeconds[`extract:${item}`] ?? 0) + amount * (item==='water'?.25:5);
    } else {
      result.workSeconds[item] = (result.workSeconds[item] ?? 0) + recipe.seconds * amount;
      const nested = expand(recipe.inputs);
      add(result.raw, nested.raw, amount); add(result.workSeconds, nested.workSeconds, amount);
    }
  }
  return result;
}

const moneyless = 'Building nodes and cables currently has no item purchase cost. Raw totals are research consumption only, not building costs, buffered surplus, defense, land clearing, roads, or extra map points. Power is removed pending integration design.';
const buckets = ANALYSIS_CORES.map((core,i)=>({level:i+1,name:core,ids:RESEARCH_PROJECTS.filter(p=>!p.costs['final-core']&&!p.trigger&&!p.repeatable&&Math.max(...Object.keys(p.costs).map(id=>ANALYSIS_CORES.indexOf(id as typeof core)))===i).map(p=>p.id)}));
const baseLabSetSeconds = RESEARCH_CENTER_BASE_CYCLE_MS / 1000;

function analyze() {
  const paid = RESEARCH_PROJECTS.filter((project) => !project.costs['final-core'] && !project.trigger && !project.repeatable);
  const projects = paid.map((project) => {
    const costs = Object.fromEntries(Object.entries(getResearchCosts(project)).map(([key, amount]) => [key, amount!]));
    return { id: project.id, name: project.name, prerequisite: project.prerequisite, costs, ...expand(costs),
      researchIterations: Math.max(...Object.values(costs)), researchSeconds: Math.max(...Object.values(costs)) * baseLabSetSeconds };
  });
  const stages = buckets.map((bucket) => {
    const costs: Bag = {};
    for (const id of bucket.ids) add(costs, projects.find((project) => project.id === id)!.costs);
    const bill = expand(costs);
    return { ...bucket, costs, ...bill, singleRecipeMachineFloorMinutes: Math.max(...Object.values(bill.workSeconds)) / 60,
      researchIterations: Math.max(...Object.values(costs)), researchSeconds: Math.max(...Object.values(costs)) * baseLabSetSeconds };
  });
  const totals: Bag = {}; for (const project of projects) add(totals, project.costs);
  const worldCosts: Bag = {};
  for (let i = 0; i < 119; i++) add(worldCosts, getResearchCosts(RESEARCH_PROJECTS.find((p) => p.id === 'mapNode')!, i) as Bag);
  add(worldCosts, getResearchCosts(RESEARCH_PROJECTS.find(p => p.id === 'exploration')!) as Bag);
  const coreTypes = ANALYSIS_CORES;
  const throughput = coreTypes.map((core, index) => {
    const costs = Object.fromEntries(coreTypes.slice(0, index + 1).map((item) => [item, 1]));
    const bill = expand(costs);
    const peakMachines = Object.fromEntries(Object.entries(bill.workSeconds).map(([item, seconds]) => [item, Math.ceil(seconds / baseLabSetSeconds)]));
    const leanSetSeconds = Math.max(baseLabSetSeconds, ...Object.values(bill.workSeconds));
    return {
      level: index + 1, coreTypes: Object.keys(costs), rawPerSet: bill.raw,
      leanProductionAndLabNodes: Object.keys(bill.workSeconds).length + 1,
      leanSetSeconds,
      leanCoreItemsPerMinute: 60 * (index + 1) / leanSetSeconds,
      peakProductionAndLabNodes: Object.values(peakMachines).reduce((sum, n) => sum + n, 1), peakMachines,
      note: 'Lean = one machine per operation plus one lab. Peak supplies one of each core every five seconds to match the unupgraded lab. Support and waste handling are additional.',
    };
  });
  return {
    baseLabSetSeconds,
    assumptions: [moneyless, 'All Extractors and Research Centers use a 5s base cycle, including newly placed and loaded nodes. Lab upgrades reduce the cycle to 4.5, 4, 3.5, 3, 2.5 and 2 seconds.',
      'Baseline uses unupgraded cycle times, new Extractors, and no manual building or travel time. Efficiency upgrades and parallel machines shorten production.',
      'Machine counts are analytical lower bounds; sources/deposits, logistics, renewable support, roads and the single research center are separate. Tree Planters operate without Power.',
      'Current stages are analytical buckets, not enforced in the current research prerequisite graph.',
      'Tiers 4–6 use the implemented independent core recipes; Final-Core research is excluded from this six-Core analysis; its corner acquisition and provisional Reclamation balance require separate validation. Endgame coverage target is 37–60 productive maps minimum and 109 at maximum, out of 121 total.',
      '20–30 hours targets efficient play; low-throughput factories may take substantially longer.'],
    coreBills: Object.fromEntries([...ANALYSIS_CORES, 'motor', 'suppression-bot'].map((item) => [item, expand({ [item]: 1 })])),
    projects, stages, fixedResearch: { costs: totals, ...expand(totals) },
    worldExpansion: { repeatCount: 119, costs: worldCosts, ...expand(worldCosts), note: 'Includes Exploration and 119 Map Node purchases, assuming each core tier is available by its scheduled phase. Delayed core access lowers the bill. All-world access is separate from productive-map endgame targets.' },
    throughput,
  };
}

describe('progression consumption analysis', () => {
  it('accounts for each paid research once and verifies recursive core costs', () => {
    const report = analyze();
    expect(report.coreBills['simple-core'].raw).toEqual({ copper: 8, wood: 4 });
    expect(report.coreBills['basic-core'].raw).toEqual({ copper: 2, iron: 6, wood: 4 });
    expect(report.coreBills['automata-core'].raw).toEqual({ copper: 6, iron: 2, wood: 4, stone: 1 });
    expect(buckets.flatMap((bucket) => bucket.ids).sort()).toEqual(report.projects.map((p) => p.id).sort());
    expect(report.fixedResearch.costs).toEqual({ 'simple-core': 1710, 'basic-core': 1619, 'automata-core': 1479, 'hydro-core': 1224, 'shiny-core': 878, 'command-core': 417 });
    expect(report.fixedResearch.raw).toEqual({ copper: 88159, wood: 80046, iron: 63861, stone: 3120, water: 25129, mythril: 3007 });
    expect(report.coreBills['shiny-core'].raw).toEqual({mythril:2,iron:24,copper:24,wood:26,water:8});
    expect(report.coreBills['command-core'].raw).toEqual({mythril:3,iron:37,copper:55,wood:50,water:17,stone:1});
    expect(report.worldExpansion.costs).toEqual({ 'simple-core': 2861, 'basic-core': 2816, 'automata-core': 2740, 'hydro-core': 2640, 'shiny-core': 2515, 'command-core': 2365 });
    expect(report.throughput.slice(0,3).map((stage) => stage.leanProductionAndLabNodes)).toEqual([7, 11, 16]);
    expect(report.throughput.slice(0,3).map((stage) => stage.peakProductionAndLabNodes)).toEqual([24, 47, 74]);
    expect(report.baseLabSetSeconds).toBe(5);
    for (const project of report.projects) expect(project.researchSeconds).toBe(project.researchIterations * 5);
    if (process.env.GAME_PROGRESSION === '1') {
      mkdirSync('outputs/progression', { recursive: true });
      writeFileSync('outputs/progression/analysis.json', JSON.stringify(report, null, 2));
      console.log(JSON.stringify({ stages: report.stages, throughput: report.throughput }, null, 2));
    }
  });
});
