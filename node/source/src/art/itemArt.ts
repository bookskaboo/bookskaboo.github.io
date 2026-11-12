import { LINE_ART, type LineArtId } from './lineArt';
import { BOT_BUILDS, BOT_ITEMS } from '../content/botAssembly';
import { BASE_ITEM_NAMES } from '../content/items';
import type { CustomContentId, ItemId } from '../domain/types';

type BuiltInItem = Exclude<ItemId, CustomContentId>;
type ItemDrawing = readonly [outline: string, accent?: string, color?: string];

const lineArt = (id: LineArtId, accent?: string, color?: string): ItemDrawing => [LINE_ART[id], accent, color];
const plate = LINE_ART.plate;
const gear = LINE_ART.cog;
const wire = LINE_ART.spool;

const groups = {
  'Raw resources': {
    wood: ['M3 10L13 4L19 7V13L9 19L3 16Z M3 10L9 13L19 7 M9 13V19', 'M5.4 13L7 14V16 M11 10L16 7'],
    iron: ['M3 16L6 8L12 4L20 8L21 17L15 21L7 20Z M6 8L12 12L20 8 M12 12L15 21', 'M7 14L9 16 M16 13L18 12'],
    copper: ['M3 15L7 7L13 5L21 10L20 17L14 21L6 19Z M7 7L10 14L6 19 M10 14L16 14L21 10', 'M12 8L15 10 M14 17L17 16'],
    mythril: ['M3 18L7 10L10 13L12 4L16 2L19 7L18 12L21 17L16 21H8Z M12 4L14 10L16 2', 'M10 13L12 18L14 10L18 12'],
    stone: lineArt('stone-rune', 'M13 15L16 16'),
    water: ['M12 3C10 7 5 11 5 15A7 7 0 0 0 19 15C19 11 14 7 12 3Z', 'M8 15Q9 18 12 18'],
  },
  'Processed materials': {
    brick: lineArt('brick', 'M6 12H12 M6 15H10', '#b1aaa5'),
    charcoal: lineArt('charcoal', 'M7 13L9 14 M15 9L18 10', '#a3abb6'),
    'iron-plate': [plate, 'M9 9L15 6'],
    'copper-plate': [plate, 'M8 9L14 6 M11 11L17 8'],
    'mythril-plate': [plate, 'M8 9L12 7L16 9L12 11Z'],
    'iron-gear': [gear],
    'copper-gear': [gear, 'M11 12H13'],
    'mythril-gear': [gear, 'M12 10.5L13.5 12L12 13.5L10.5 12Z'],
    'iron-wire': [wire],
    'copper-wire': [wire, 'M19 15L22 15'],
    'mythril-wire': [wire, 'M17 17L21 13H23'],
    'refined-mithril': lineArt('gem', 'M7 17L5 20 M19 2V5 M17.5 3.5H20.5', '#82e2a8'),
    'mithril-mesh': lineArt('mesh', 'M5 19L19 5', '#70ce91'),
    'mineral-aggregate': ['M2 20L7 13L10 15L13 9L18 12L22 20Z M7 13L9 20 M13 9L15 16L18 12', 'M5 9L7 6L10 7 M15 16L18 20', '#c8c3ab'],
  },
  'Fluids and byproducts': {
    coolant: lineArt('coolant', 'M12 9V14 M10 11.5H14', '#8cd8ed'),
    'conductive-slurry': lineArt('slurry', 'M10 17H13', '#de976f'),
    slag: lineArt('slag', 'M15 6L16 12L21 11', '#c48469'),
    'metallic-fines': ['M4 17H6 M8 12H10 M11 18H13 M14 8H16 M16 14H18 M19 18H21', 'M4 21H21 M10 7H11', '#aebac9'],
    'glassy-crust': lineArt('crust', 'M15 11L18 9 M12 13L14 14', '#9cc2db'),
    'spent-flux': lineArt('flux', 'M15 11L16 13', '#c5a8cf'),
    'metal-residue': ['M3 18L5 14L9 15L11 20H4Z M10 13L12 8L17 9L19 13L16 16Z M15 19L18 17L22 19L20 21H15Z', 'M13 11L15 12 M5 17H7', '#c3a78e'],
  },
  'Mechanical and electrical parts': {
    motor: lineArt('motor', 'M16 10V14'),
    'circuit-a': lineArt('circuit-a', 'M12 10V14'),
    'ceramic-electrode': lineArt('circuit-b', 'M12 9V15', '#8bd6c3'),
    'logic-substrate': lineArt('circuit-c', 'M11 10.5H13 M11 13.5H13', '#b6b2ed'),
    'precision-controller': lineArt('controller', 'M6 3H18 M6 21H18', '#8ec5d9'),
    'hydraulic-actuator': lineArt('piston', 'M9 17H15', '#8cbede'),
    'advanced-actuator': lineArt('servo-piston', 'M9 6H15', '#d5b184'),
  },
  'Cores and corner pieces': {
    'simple-core': lineArt('core', 'M12 11V13', '#f07979'),
    'basic-core': ['M3 7L12 2L21 7V17L12 22L3 17Z M7 8H17V16H7Z', 'M10 12H14', '#fc985d'],
    'automata-core': ['M3 7L12 2L21 7V17L12 22L3 17Z M7 12L12 7L17 12L12 17Z', 'M12 7V3 M7 12H3 M17 12H21 M12 17V21'],
    'hydro-core': ['M3 7L12 2L21 7V17L12 22L3 17Z M12 7Q8 11 8 13A4 4 0 0 0 16 13Q16 11 12 7Z', 'M11 14L13 15', '#68d9e7'],
    'shiny-core': ['M3 7L12 2L21 7V17L12 22L3 17Z M12 6L14 10L18 12L14 14L12 18L10 14L6 12L10 10Z', 'M12 11V13', '#d8bdff'],
    'command-core': ['M3 7L12 2L21 7V17L12 22L3 17Z M7 8L12 6L17 8V16L12 18L7 16Z', 'M9 12L12 9L15 12 M9 15L12 12L15 15', '#f7cb8b'],
    alpha: ['M4 8L12 3L20 8V16L12 21L4 16Z', 'M14 7L8 13H12L10 17L16 11H12Z'],
    'foundry-component': ['M3 8L11 4L21 7V17L13 21L3 18Z M3 8L13 12L21 7 M13 12V21', 'M6 11V16 M9 12V17'],
    'reclamation-component': ['M3 7H21L17 16H14V21H10V16H7Z', 'M7 10H17 M9 13H15'],
    'grove-component': ['M4 12L12 3L20 12L12 21Z', 'M8 14Q8 9 16 8Q16 15 10 15 M8 16L13 11'],
    'core-half-a': lineArt('core-half-a', 'M8 12H10'),
    'core-half-b': lineArt('core-half-b', 'M14 12H16'),
    'final-core': lineArt('final-core', 'M12 10L14 12L12 14L10 12Z'),
  },
  'Bot parts': {
    'simple-robot-frame': lineArt('bot-frame'),
    'sealed-frame': lineArt('sealed-frame', 'M6 8H8 M16 8H18', '#90b5cd'),
    'mithril-frame': lineArt('mythril-frame', 'M12 3V8 M12 16V20', '#7cd5a0'),
    'servo-frame': lineArt('servo-frame', 'M10 10V14 M14 10V14', '#dbb58d'),
    'final-frame': ['M3 8L8 4H16L21 8V17L16 21H8L3 17Z M7 10L10 7H14L17 10V15L14 18H10L7 15Z', 'M3 8L7 10 M21 8L17 10 M17 15L21 17 M7 15L3 17'],
    'simple-robot-gun': lineArt('bot-gun'),
    'cooled-gun': lineArt('cooled-gun', 'M5 10H13', '#8dd2ed'),
    'focused-gun': lineArt('focused-gun', 'M10 9V13 M13 9V13', '#7ed9a0'),
    'pulse-cannon': lineArt('pulse-cannon', 'M17 10H19 M17 13H19', '#ceacee'),
    'final-cannon': ['M2 7H13L18 5H22V15H17L12 17L10 20H6L8 15H2Z M2 11H13L18 9H22', 'M6 7V11 M10 7V11 M18 12H22'],
  },
  'Power and growth': {
    power: lineArt('zap'),
    'forest-growth': lineArt('sprout', 'M4 21H20'),
  },
} satisfies Record<string, Partial<Record<BuiltInItem, ItemDrawing>>>;

const botChassis = [
  'M5 8H14V17H5Z M9 8V5 M6 17V20 M13 17V20',
  'M4 7H15L16 10V17H3V10Z M5 17V20 M14 17V20',
  'M3 9L9 5L16 9V17L13 20H6L3 17Z M9 5V8',
  'M4 6H14L17 9V17L14 20H4L2 17V9Z M4 6V9 M14 6V9',
  'M3 9L7 5H13L17 9V17L13 21H7L3 17Z M7 5L5 2 M13 5L15 2',
];
const botWeapons = [
  'M18 11H22V14H18Z',
  'M18 9H22V15H18Z M20 10V14',
  'M18 9L22 11V13L18 15Z',
  'M18 8H22V16H18Z M20 10H22 M20 14H22',
  'M19 7H22V11H19Z M19 13H22V17H19Z',
];
const weaponColors = ['#d37b6f', '#8dd2ed', '#7ed9a0', '#ceacee', '#ffd77d'];

export interface ItemArt {
  id: BuiltInItem;
  name: string;
  drawing: ItemDrawing;
  detail?: string;
  accentColor?: string;
}

const items = Object.entries(groups).map(([title, group]) => ({
  title,
  items: (Object.entries(group) as [BuiltInItem, ItemDrawing][]).map(([id, drawing]): ItemArt => ({
    id, name: BASE_ITEM_NAMES[id], drawing,
  })),
}));

items.push({
  title: 'Suppression Bots',
  items: BOT_BUILDS.map(({ frame, gun, frameTier, gunTier }, index): ItemArt => {
    const id = BOT_ITEMS[index];
    return {
      id, name: BASE_ITEM_NAMES[id],
      detail: `${BASE_ITEM_NAMES[frame]} · ${BASE_ITEM_NAMES[gun]}`,
      drawing: [`${botChassis[frameTier - 1]} M7 11H8 M11 11H12 M8 14H11`, botWeapons[gunTier - 1]],
      accentColor: weaponColors[gunTier - 1],
    };
  }),
});

export const ITEM_ART_GROUPS = items;
export const ITEM_ART = new Map<ItemId, ItemArt>(items.flatMap(group => group.items.map(art => [art.id, art])));
export const ITEM_ART_ACCENT = '#e7e3d9';
