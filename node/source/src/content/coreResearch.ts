import type { GameState, ItemId, ResearchProject } from '../domain/types';

export const CORE_RESEARCH = [
  { item: 'simple-core', id: 'simpleCore', name: 'Simple Core', machine: 'Refiner', prerequisite: 'refiner' },
  { item: 'basic-core', id: 'basicCore', name: 'Basic Core', machine: 'Assembler', prerequisite: 'assembler' },
  { item: 'automata-core', id: 'automataCore', name: 'Automata Core', machine: 'Assembler', prerequisite: 'exploration' },
  { item: 'hydro-core', id: 'hydroCore', name: 'Hydro Core', machine: 'Fabricator', prerequisite: 'hydraulicAssembly' },
  { item: 'shiny-core', id: 'shinyCore', name: 'Shiny Core', machine: 'Fabricator', prerequisite: 'oreSeparation' },
  { item: 'command-core', id: 'complexCore', name: 'Complex Core', machine: 'Fabricator', prerequisite: 'precisionControl' },
  { item: 'final-core', id: 'finalCore', name: 'Final Core', machine: 'Assembler', prerequisite: 'cornerComponents' },
] as const satisfies ReadonlyArray<{ item: ItemId; id: string; name: string; machine: string; prerequisite: string }>;

export const CORE_RECIPE_PROJECTS = CORE_RESEARCH.map(({ id, name, machine, prerequisite }, index): ResearchProject => {
  const previous = CORE_RESEARCH[index - 1];
  return {
    id, name, prerequisite,
    category: previous ? 'Fabrication' : 'Milestone',
    description: `Unlock the ${name} recipe in the ${machine}.`,
    unlock: `Unlocks the ${name} recipe in the ${machine}.`,
    costs: Object.fromEntries(CORE_RESEARCH.slice(0, index).map(({ item }) => [item, 5])),
    ...(previous ? { prerequisites: [previous.id] } : {
      trigger: { id: 'refiner-unlocked', pending: 'Unlock the Refiner', complete: 'Refiner unlocked' },
    }),
  };
});

export function migrateCoreResearch(state: Pick<GameState, 'coreResearchVersion' | 'research'>) {
  if (state.coreResearchVersion) return;
  const { completed, unlocked } = state.research;
  // Automata Core already had its own project in older saves.
  for (const { id, prerequisite } of CORE_RESEARCH) {
    if (id === 'automataCore' || !completed.includes(prerequisite)) continue;
    if (!completed.includes(id)) completed.push(id);
    if (!unlocked.includes(id)) unlocked.push(id);
  }
  state.coreResearchVersion = 1;
}
