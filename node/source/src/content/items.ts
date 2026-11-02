import type { ItemId } from '../domain/types';
import { LATE_ITEM_NAMES, LATE_ITEM_COLORS } from './progression';

export const ITEM_NAMES: Record<ItemId, string> = {
  ...LATE_ITEM_NAMES,
  wood: 'Wood', iron: 'Iron', copper: 'Copper', mythril: 'Mythril', stone: 'Stone', water: 'Water',
  brick: 'Brick', charcoal: 'Charcoal', 'iron-plate': 'Iron Plate', 'copper-plate': 'Copper Plate', 'mythril-plate': 'Mythril Plate',
  'iron-gear': 'Iron Gear', 'copper-gear': 'Copper Gear', 'mythril-gear': 'Mythril Gear', 'iron-wire': 'Iron Wire', 'copper-wire': 'Copper Wire', 'mythril-wire': 'Mythril Wire',
  motor: 'Motor', 'circuit-a': 'Circuit A', 'simple-core': 'Simple Core', 'basic-core': 'Basic Core', 'automata-core': 'Automata Core',
  'simple-robot-frame': 'Simple Robot Frame', 'simple-robot-gun': 'Simple Robot Gun', 'suppression-bot': 'Small Suppression Bot', power: 'Power', 'forest-growth': 'Forest Growth',
};

export const ITEM_COLORS: Record<ItemId, number> = {
  ...LATE_ITEM_COLORS,
  wood: 0xd29a5a, iron: 0x8296a6, copper: 0xd98a62, mythril: 0x55c97a, stone: 0xa6aaa7, water: 0x55bde8,
  brick: 0x666b70, charcoal: 0x6f7782, 'iron-plate': 0x8296a6, 'copper-plate': 0xdb8f69, 'mythril-plate': 0x62d287,
  'iron-gear': 0x8296a6, 'copper-gear': 0xd69a72, 'mythril-gear': 0x58bd78, 'iron-wire': 0x8296a6, 'copper-wire': 0xe79a70, 'mythril-wire': 0x73dd96,
  motor: 0xd9a54a, 'circuit-a': 0x6fcf9b, 'simple-core': 0xe45757, 'basic-core': 0xff6b00, 'automata-core': 0xf2c94c,
  'simple-robot-frame': 0x7eb0c7, 'simple-robot-gun': 0xd37b6f, 'suppression-bot': 0xa7df67, power: 0xf2d45c, 'forest-growth': 0x82d982,
};

/** Physical materials that can be routed through a Filter. */
export const FILTERABLE_ITEMS: ItemId[] = (Object.keys(ITEM_NAMES) as ItemId[]).filter((item) => item !== 'power' && item !== 'forest-growth');

/** CSS representation of the canonical material color. */
export const itemColorCss = (item: ItemId) => `#${ITEM_COLORS[item].toString(16).padStart(6, '0')}`;
