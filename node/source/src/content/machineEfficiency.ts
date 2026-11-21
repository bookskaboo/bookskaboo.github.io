/** Numeric research suffixes retain their Core tier, so existing purchases keep their identity. */
export const EFFICIENCY_CORES = ['simple-core', 'basic-core', 'automata-core', 'hydro-core', 'shiny-core', 'command-core', 'final-core'] as const;
export const EFFICIENCY_ACCESS = ['refiner', 'basicCore', 'automataCore', 'hydroCore', 'shinyCore', 'complexCore', 'finalCore'] as const;
export const MACHINE_EFFICIENCY = [
  { family: 'extractor', name: 'Extractor', start: 2, access: undefined },
  { family: 'kiln', name: 'Kiln', start: 2, access: 'kiln' },
  { family: 'smelter', name: 'Smelter', start: 2, access: 'smelter' },
  { family: 'refiner', name: 'Refiner', start: 3, access: 'refiner' },
  { family: 'assembler', name: 'Assembler', start: 3, access: 'assembler' },
  { family: 'researchCenter', name: 'Research Center', start: 1, access: 'researchCenter' },
  { family: 'hydroProcessor', name: 'Hydro Plant', start: 4, access: 'lakeTools' },
  { family: 'advancedAssembler', name: 'Fabricator', start: 3, access: 'fabricatorTools' },
  { family: 'separationFurnace', name: 'Synthesizer', start: 5, access: 'mithrilTools' },
  { family: 'botPlant', name: 'Bot Plant', start: 3, access: 'suppressionBot' },
  { family: 'fluidLink', name: 'Pump', start: 4, access: 'lakeTools' },
  { family: 'treePlanter', name: 'Tree Planter', start: 4, access: 'treePlanter' },
  { family: 'recycler', name: 'Recycler', start: 4, access: 'recycler' },
] as const;
export type EfficiencyFamily = typeof MACHINE_EFFICIENCY[number]['family'];
export function efficiencyFactors(start: number) {
  const count = 8 - start;
  return Array.from({ length: count }, (_, index) => (100 - 5 * Math.round(13 * (index + 1) / count)) / 100);
}
export function efficiencyDefinition(family: string | undefined) {
  return MACHINE_EFFICIENCY.find(definition => definition.family === family);
}
export function hasForestryCapacity(completed: readonly string[]) { return completed.includes('treePlanter6'); }
