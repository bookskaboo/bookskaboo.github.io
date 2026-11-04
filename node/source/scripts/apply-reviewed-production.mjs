// Q32–Q60: settled production decisions override the older analytical proposal.
export function applyReviewedProduction({ names, recipes, groups, research, nodes }) {
  names['command-core'] = 'Complex Core';
  recipes['command-core'].name = 'Complex Core';
  names['ceramic-electrode'] = 'Circuit B';
  names['logic-substrate'] = 'Circuit C';
  recipes['ceramic-electrode'].name = 'Circuit B';
  recipes['logic-substrate'].name = 'Circuit C';
  delete recipes['refined-mithril'].outputs.slag;
  recipes['precision-controller'].outputs = { 'precision-controller': 1, 'metallic-fines': 1 };
  delete recipes['precision-controller'].chanceOutputs;
  delete recipes['advanced-actuator'].chanceOutputs;
  const add = (id, name, machine, inputs, outputs, cycleMs, unlockResearch, recovery = false) => {
    recipes[id] = { id, name, inputs, outputs, cycleMs, unlockResearch, ...(recovery ? { recovery } : {}) };
    (groups[machine] ??= []).push(id);
  };
  const retired = ['slagwashing', 'finessettling', 'fluxstabilization', 'crustmilling', 'recoveredbrick', 'recoverediron'];
  // Keep definitions for completing paid legacy batches, but remove selectable recipes.
  for (const kind of Object.keys(groups)) groups[kind] = groups[kind].filter(id => !retired.includes(id));
  add('recover-fines', 'Fines Recovery', 'hydroProcessor', { 'metallic-fines': 4, water: 1 }, { 'iron-plate': 1 }, 10000, 'precisionControl', true);
  add('recover-flux', 'Flux Recovery', 'hydroProcessor', { 'spent-flux': 4, water: 1 }, { coolant: 1 }, 10000, 'efficientHigherIntermediates', true);
  add('recover-crust', 'Crust Recovery', 'separationFurnace', { 'glassy-crust': 4, water: 1 }, { 'copper-plate': 1 }, 10000, 'efficientHigherIntermediates', true);
  add('recover-slag', 'Slag Recovery', 'hydroProcessor', { slag: 4, water: 1 }, { brick: 1 }, 10000, 'efficientHigherIntermediates', true);
  add('efficient-circuit-a', 'Efficient Circuit A', 'advancedAssembler', { 'copper-plate': 2, 'iron-plate': 1 }, { 'circuit-a': 1, 'metallic-fines': 1 }, 4500, 'efficientIntermediates');
  add('efficient-motor', 'Efficient Motor', 'advancedAssembler', { 'iron-plate': 2, 'copper-plate': 2 }, { motor: 1, 'metallic-fines': 1 }, 6000, 'efficientIntermediates');
  add('efficient-bot-frame', 'Efficient Bot Frame', 'advancedAssembler', { 'iron-plate': 1, motor: 1 }, { 'simple-robot-frame': 1, 'metallic-fines': 1 }, 6000, 'efficientIntermediates');
  add('efficient-hydro-piston', 'Efficient Hydro Piston', 'advancedAssembler', { 'iron-plate': 1, motor: 1, coolant: 1 }, { 'hydraulic-actuator': 1, 'spent-flux': 2, 'metallic-fines': 1 }, 9000, 'efficientHigherIntermediates');
  add('efficient-mythril-mesh', 'Efficient Mythril Mesh', 'advancedAssembler', { 'refined-mithril': 1, 'copper-plate': 2, coolant: 1 }, { 'mithril-mesh': 1, 'glassy-crust': 2, 'spent-flux': 1 }, 16000, 'efficientHigherIntermediates');
  add('efficient-circuit-c', 'Efficient Circuit C', 'advancedAssembler', { 'circuit-a': 1, 'ceramic-electrode': 1, 'mythril-wire': 1 }, { 'logic-substrate': 1, slag: 2, 'glassy-crust': 1 }, 27000, 'efficientHigherIntermediates');
  const cores = ['simple-core', 'basic-core', 'automata-core', 'hydro-core', 'shiny-core', 'command-core'];
  for (const [id, name, amount, unlock] of [
    ['efficientIntermediates', 'Efficient Intermediates', 50, 'Unlocks efficient Circuit A, Motor and Bot Frame recipes. Products and waste share one output; use Filters.'],
    ['efficientHigherIntermediates', 'Efficient Higher Intermediates', 100, 'Unlocks efficient Hydro Piston, Mythril Mesh and Circuit C, plus direct Flux, Crust and Slag recovery.'],
    ['planterThroughput', 'Industrial Forestry', 100, 'Tree Planters produce ten times faster and send up to ten funded growth units per local shipment.'],
  ]) research.push({ id, name, category: 'Efficiency', description: unlock, unlock, costs: Object.fromEntries(cores.map(core => [core, amount])), prerequisites: id === 'planterThroughput' ? ['precisionControl', 'treePlanter'] : ['precisionControl'] });
  research.push({ id: 'finalCoreProduction', name: 'Final Core Production', category: 'Discovery', description: 'Produce the first Final Core to make global transport research available. The Final Core route is still under development.', unlock: 'Makes Autonomous Logistics research available.', costs: {}, trigger: { id: 'final-core-produced', pending: 'Produce the first Final Core', complete: 'First Final Core produced' } });
  for (const project of research) {
    if (project.id === 'autonomousLogistics') project.prerequisites = [...new Set([...project.prerequisites, 'finalCoreProduction'])];
    if (project.id === 'endgameTheory') project.prerequisites = project.prerequisites.filter(id => id !== 'autonomousLogistics');
    if (project.id === 'mithrilTools') {
      project.description = 'A Dwarven settlement must produce its first Mythril Tribute.';
      project.trigger = { id: 'dwarven-mythril-produced', pending: 'Produce Mythril Tribute at a Dwarven settlement', complete: 'First Dwarven Mythril Tribute produced' };
    }
    if (['sortingTools', 'mineralRecovery'].includes(project.id)) {
      project.description = 'Basic waste handling is included with Precision Control.';
      project.unlock = 'Unlocks waste buffering, routing and direct Fines recovery.';
      project.trigger = { id: 'precision-control', pending: 'Complete Precision Control', complete: 'Precision Control completed' };
    }
    if (project.id === 'precisionControl') {
      project.prerequisites = project.prerequisites.filter(id => id !== 'mineralRecovery');
      project.unlock = 'Unlocks Complex production, Waste Bin, Waste Link, sorting and direct Fines-to-Iron recovery.';
    }
    if (project.id === 'mineralRecovery1') project.description = project.unlock = 'Direct waste recovery recipes take 10% less time after machine efficiency; quantities stay unchanged.';
  }
  if (nodes) {
    nodes.slagHopper.unlockResearch = 'sortingTools';
    nodes.slagHopper.description = 'Buffers up to 200 Slag from researched Complex alternatives.';
    nodes.separationFurnace.description = 'Produces Pure Mythril without waste, and recovers Copper Plates from Glassy Crust after higher alternative research.';
    nodes.advancedAssembler.output = ['ANY'];
    nodes.separationFurnace.output = ['ANY'];
  }
}
