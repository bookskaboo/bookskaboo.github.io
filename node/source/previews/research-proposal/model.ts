import { CORE_RESEARCH } from '../../src/content/coreResearch';
import historical from './baseline.json';
export const HISTORICAL_RESEARCH = historical.projects as ResearchProject[];
export const MACHINE_EFFICIENCY_FAMILIES = historical.families as Array<[string,string]>;
import type { ItemId, ResearchProject } from '../../src/domain/types';

export const UPGRADE_PLAN = [
  { tier: 'Automata', access: 'automataCore', savedRank: 3, reduction: 30, each: 10 },
  { tier: 'Hydro', access: 'hydroCore', savedRank: 4, reduction: 40, each: 15 },
  { tier: 'Shiny', access: 'shinyCore', savedRank: 5, reduction: 50, each: 20 },
  { tier: 'Complex', access: 'complexCore', savedRank: 6, reduction: 60, each: 25 },
] as const;

const progressionProjects = new Set<string>([
  ...CORE_RESEARCH.map(({ id }) => id),
  'assembler', 'exploration', 'mapNode', 'road', 'fabricatorTools',
  'hydrochemistry', 'hydraulicAssembly', 'fluidRouting', 'oreSeparation', 'precisionControl',
  'sealedRobotics', 'heavyRobotics', 'commandRobotics', 'finalRobotics', 'victory',
]);

export const isOptionalProject = (project: ResearchProject) =>
  !project.trigger && !progressionProjects.has(project.id);

const machineAccess: Record<string, string | undefined> = {
  extractor: undefined, hydroProcessor: 'lakeTools', advancedAssembler: 'fabricatorTools',
  separationFurnace: 'mithrilTools', botPlant: 'suppressionBot',
};

export function proposedResearchCatalog(current: readonly ResearchProject[]): ResearchProject[] {
  const machineRanks = new Set(MACHINE_EFFICIENCY_FAMILIES.flatMap(([family]) =>
    Array.from({ length: 6 }, (_, index) => `${family}${index + 1}`)));
  const remaining = structuredClone(current.filter(project => !machineRanks.has(project.id)));
  const upgrades = MACHINE_EFFICIENCY_FAMILIES.flatMap(([family, name]) =>
    UPGRADE_PLAN.map((rank, index): ResearchProject => {
      const original = current.find(project => project.id === `${family}${rank.savedRank}`)!;
      const access = family in machineAccess ? machineAccess[family] : family;
      return {
        ...structuredClone(original),
        name: `${name} ${index + 1}`,
        costs: Object.fromEntries(CORE_RESEARCH.slice(0, rank.savedRank)
          .map(({ item }) => [item, rank.each])) as Partial<Record<ItemId, number>>,
        prerequisite: index ? `${family}${UPGRADE_PLAN[index - 1].savedRank}` : access,
        prerequisites: [rank.access],
      };
    }));
  return [...remaining, ...upgrades].map(project => {
    if (project.id === 'road' || project.id === 'exploration') return {
      ...project,
      costs: { 'simple-core': 5 },
    };
    if (project.id === 'splitter' || project.id === 'merger') return {
      ...project,
      trigger: { id: 'refiner-produced' as const, pending: 'Produce any item in a Refiner', complete: 'First Refiner item produced' },
    };
    return isOptionalProject(project) ? {
      ...project,
      prerequisites: [...new Set([...(project.prerequisites ?? []), 'automataCore'])],
    } : project;
  });
}

export const pricePerLine = (catalog: readonly ResearchProject[], family = 'extractor') =>
  catalog.filter(project => new RegExp(`^${family}[1-6]$`).test(project.id))
    .reduce((sum, project) => sum + Object.values(project.costs).reduce<number>((total, amount) => total + (amount ?? 0), 0), 0);
