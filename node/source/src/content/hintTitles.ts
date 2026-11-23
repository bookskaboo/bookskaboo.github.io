import { getResearchProject } from './research';

/** Reviewed presentation titles. Saved clue identities remain canonical. */
export const HINT_TITLES: Record<string, string> = {
  assignment: 'Terms of employment',
  wood: 'Available staff',
  copper: 'Grounds for optimism',
  fuel: 'Alternative employment',
  plate: 'Material progress',
  lab: 'Room for thought',
  simple: 'Career prospects',
  iron: 'A second opinion',
  assembler: 'Some assembly required',
  basic: 'Room to improve',
  exploration: 'Beyond the paperwork',
  detour: 'A useful detour',
  road: 'Across the line',
  automata: 'More responsibility',
  fabricatorTools: 'Equipment request',
  lake: 'The factory is thirsty',
  hydrochemistry: 'Liquid assets',
  hydraulicAssembly: 'Under pressure',
  hydro: 'Waterside ambitions',
  fluidRouting: 'A change of course',
  camp: 'The neighbours',
  sealedRobotics: 'A stronger argument',
  dwarves: 'A metallic glint',
  guardedMythril: 'Restricted access',
  tribute: 'Neighbourly obligations',
  bot: 'A staffing solution',
  oreSeparation: 'A promising impurity',
  shiny: 'A finer finish',
  precisionControl: 'Revised specifications',
  complex: 'Unfinished potential',
  complexUpgrade: 'Promotion pending',
  corners: 'Loose ends',
  grove: 'Delayed returns',
  reclamation: 'A second use',
  foundry: 'A demanding customer',
  dragon: 'Terms of negotiation',
  final: 'A complete picture',
  victory: 'One last form',
  finished: 'You’ve got this',
};
export const PRODUCTION_HINT_TITLES: Record<string, string> = {
  basic: 'Something to build on',
  automata: 'More moving parts',
  hydro: 'Another use for water',
  shiny: 'A polished prospect',
  complex: 'Unclaimed value',
};


const STATIC_HINT_IDS: Record<string, string> = {
  'Your assignment':'assignment', 'A promising Forest':'wood', 'Copper prospects':'copper', Charcoal:'fuel', 'First Plate':'plate',
  'Research Center':'lab', 'Simple Core':'simple', 'Iron prospects':'iron', 'A useful detour':'detour',
  'The factory is thirsty':'lake', 'The neighbours':'camp', 'A metallic glint':'dwarves', 'Dwarven Mythril':'guardedMythril',
  'Dwarven Tribute':'tribute', 'Suppression Bot':'bot', 'The four corners':'corners', 'Elder Grove':'grove',
  'Ancient Reclamation':'reclamation', 'Ancient Foundry':'foundry', 'Ancient Dragon':'dragon', 'Final Core':'final', 'You’ve got this':'finished',
};
const RESEARCH_HINT_IDS: Record<string, string> = { assembler:'assembler', basicCore:'basic', exploration:'exploration', road:'road',
  automataCore:'automata', fabricatorTools:'fabricatorTools', hydrochemistry:'hydrochemistry', hydraulicAssembly:'hydraulicAssembly',
  hydroCore:'hydro', fluidRouting:'fluidRouting', sealedRobotics:'sealedRobotics', oreSeparation:'oreSeparation', shinyCore:'shiny',
  precisionControl:'precisionControl', complexCore:'complex', finalCore:'complexUpgrade', victory:'victory' };
const PRODUCTION_HINT_IDS: Record<string,string> = {'Basic Core':'basic','Automata Core':'automata','Hydro Core':'hydro','Shiny Core':'shiny','Complex Core':'complex'};

/** Transform display only, including earned historical copies; unknown/custom titles survive. */
export function hintDisplayTitle(title: string) {
  const production = PRODUCTION_HINT_IDS[title];
  if (production) return PRODUCTION_HINT_TITLES[production];
  const fixed = STATIC_HINT_IDS[title];
  if (fixed) return HINT_TITLES[fixed];
  const project = Object.entries(RESEARCH_HINT_IDS).find(([id]) => getResearchProject(id)?.name === title);
  return project ? HINT_TITLES[project[1]] : title;
}
