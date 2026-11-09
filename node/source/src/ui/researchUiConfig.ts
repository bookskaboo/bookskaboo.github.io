import { ITEM_NAMES, itemColorCss } from '../content/items';

export type RequirementFilter = 'simple-core' | 'basic-core' | 'automata-core' | 'hydro-core' | 'shiny-core' | 'command-core' | 'final-core' | 'trigger';

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

const filterCores = ['simple-core', 'basic-core', 'automata-core', 'hydro-core', 'shiny-core', 'command-core', 'final-core'] as const;
export const RESEARCH_FILTER_OPTIONS: Array<{ id: RequirementFilter; label: string; color: string }> = [
  ...filterCores.map(id => ({ id, label: ITEM_NAMES[id].replace(' Core', ''), color: itemColorCss(id) })),
  { id: 'trigger', label: 'Trigger', color: '#83c6f1' },
];
