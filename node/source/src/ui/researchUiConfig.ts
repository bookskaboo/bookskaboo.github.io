import { ITEM_NAMES, itemColorCss } from '../content/items';

export type RequirementFilter = 'simple-core' | 'basic-core' | 'automata-core' | 'hydro-core' | 'shiny-core' | 'command-core' | 'trigger';
export type ResearchBrowserSection = 'active' | 'milestones' | 'available' | 'future' | 'completed' | 'search';

const efficiencyGlyphs = {
  extractor: '⛏', kiln: '♨', smelter: '◈', refiner: '⚙', assembler: '⌑',
  researchCenter: '⌬', hydroProcessor: '≈', advancedAssembler: '⌑', separationFurnace: '♨',
};

export const RESEARCH_GLYPHS: Record<string, string> = {
  ...Object.fromEntries(Object.entries(efficiencyGlyphs).flatMap(([family, glyph]) =>
    Array.from({ length: 6 }, (_, rank) => [`${family}${rank + 1}`, glyph]))),
  connectorMirroring: '⇄', joint: '⌁', kiln: '♨', smelter: '◈', refiner: '⚙',
  researchCenter: '⌬', assembler: '⌑', splitter: '⑂', merger: '⋈', suppressionBot: '♟',
  exploration: '◎', mapNode: '◇', road: '⇥', automataCore: '◉', areaExpansion1: '⌗',
  basicElectricity: 'ϟ', treePlanter: '♧', miningDrill: '⇣',
};

const filterCores = ['simple-core', 'basic-core', 'automata-core', 'hydro-core', 'shiny-core', 'command-core'] as const;
export const RESEARCH_FILTER_OPTIONS: Array<{ id: RequirementFilter; label: string; color: string }> = [
  ...filterCores.map(id => ({ id, label: ITEM_NAMES[id].replace(' Core', ''), color: itemColorCss(id) })),
  { id: 'trigger', label: 'Trigger', color: '#83c6f1' },
];

export const RESEARCH_SECTIONS = {
  active: { name: 'Active project', description: 'Your current project. The next breakthrough is processing.', empty: 'No project selected. Science is awaiting direction.' },
  milestones: { name: 'Next milestones', description: 'Complete these actions to unlock tools. Accidental progress still counts.', empty: 'No new milestones yet. Carry on looking industrious.' },
  available: { name: 'Available research', description: 'New tools first, optional efficiency upgrades below. Your bottlenecks may have opinions.', empty: 'Develop production to unlock more research. Science has a supply problem.' },
  future: { name: 'Future research', description: 'Inspect future tools and their prerequisites. Ambition, itemized.', empty: 'All future projects are within reach. Your schedule may disagree.' },
  completed: { name: 'Completed research', description: 'Completed projects. Filed under things that finally worked.', empty: '' },
  search: { name: 'Search results', description: 'Matches names, descriptions, prerequisites, and Core costs. Sadly, not intentions.', empty: 'No matches. Try a project, material, or Core type. The archive takes things literally.' },
};
