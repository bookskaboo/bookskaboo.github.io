import type { GameState, ItemId, ResearchProject } from '../domain/types';

export const CORE_RESEARCH = [
  { item: 'simple-core', id: 'simpleCore', name: 'Simple Core', machine: 'Refiner', prerequisite: 'refiner' },
  { item: 'basic-core', id: 'basicCore', name: 'Basic Core', machine: 'Assembler', prerequisite: 'assembler' },
  { item: 'automata-core', id: 'automataCore', name: 'Automata Core', machine: 'Assembler', prerequisite: 'exploration' },
  { item: 'hydro-core', id: 'hydroCore', name: 'Hydro Core', machine: 'Fabricator', prerequisite: 'hydraulicAssembly' },
  { item: 'shiny-core', id: 'shinyCore', name: 'Shiny Core', machine: 'Fabricator', prerequisite: 'oreSeparation' },
  { item: 'command-core', id: 'complexCore', name: 'Complex Core', machine: 'Fabricator', prerequisite: 'precisionControl' },
  { item: 'final-core', id: 'finalCore', name: 'Final Core', machine: 'Assembler', prerequisite: 'complexCore' },
] as const satisfies ReadonlyArray<{ item: ItemId; id: string; name: string; machine: string; prerequisite: string }>;

// Simple Core is a starting recipe; retain its tier descriptor and historical ID.
export const CORE_RECIPE_PROJECTS = CORE_RESEARCH.flatMap(({ id, name, machine, prerequisite }, index): ResearchProject[] => {
  if (index === 0) return [];
  const previous = CORE_RESEARCH[index - 1];
  return [{
    id, name, prerequisite,
    category: 'Fabrication',
    description: `Unlock the ${name} recipe in the ${machine}.`,
    unlock: `Unlocks the ${name} recipe in the ${machine}.` + (id === 'complexCore' ? ' Unlocks the Yin and Yang recipes and reveals all four map corners.' : ''),
    costs: Object.fromEntries(CORE_RESEARCH.slice(0, index).map(({ item }) => [item, 5])),
    ...(index > 1 ? { prerequisites: [previous.id] } : {}),
  }];
});

export function migrateCoreResearch(state: Pick<GameState, 'coreResearchVersion' | 'research'>) {
  const { completed, unlocked } = state.research;
  // Retain access earned through the retired End of the World milestone.
  if (completed.includes('cornerComponents')) {
    if (!completed.includes('complexCore')) completed.push('complexCore');
    if (!unlocked.includes('complexCore')) unlocked.push('complexCore');
  }
  if (state.coreResearchVersion) return;
  // Automata Core already had its own project in older saves.
  for (const { id, prerequisite } of CORE_RESEARCH) {
    const bundledPrerequisite = id === 'finalCore' ? 'cornerComponents' : prerequisite;
    if (id === 'automataCore' || !completed.includes(bundledPrerequisite)) continue;
    if (!completed.includes(id)) completed.push(id);
    if (!unlocked.includes(id)) unlocked.push(id);
  }
  state.coreResearchVersion = 1;
}
