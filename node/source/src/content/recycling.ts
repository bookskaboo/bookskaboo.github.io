import type { ItemId } from '../domain/types';
/** Q97/Q101 fixed standard constituents, including fuel Wood. Never derived from a selected alternative. */
export const RECYCLER_RETURNS: Partial<Record<ItemId, Partial<Record<ItemId, number>>>> = {
  "iron": {},
  "copper": {},
  "wood": {},
  "stone": {},
  "mythril": {},
  "water": {},
  "charcoal": {
    "wood": 1
  },
  "iron-plate": {
    "iron": 1,
    "wood": 1
  },
  "copper-plate": {
    "copper": 1,
    "wood": 1
  },
  "mythril-plate": {
    "wood": 1,
    "mythril": 1
  },
  "iron-gear": {
    "iron": 1,
    "wood": 1
  },
  "copper-gear": {
    "copper": 1,
    "wood": 1
  },
  "mythril-gear": {
    "wood": 1,
    "mythril": 1
  },
  "iron-wire": {
    "iron": 1,
    "wood": 1
  },
  "copper-wire": {
    "copper": 1,
    "wood": 1
  },
  "mythril-wire": {
    "wood": 1,
    "mythril": 1
  },
  "brick": {
    "stone": 1
  },
  "simple-core": {
    "copper": 1,
    "wood": 1
  },
  "motor": {
    "iron": 1,
    "copper": 1,
    "wood": 1
  },
  "circuit-a": {
    "iron": 1,
    "copper": 1,
    "wood": 1
  },
  "basic-core": {
    "iron": 1,
    "copper": 1,
    "wood": 1
  },
  "automata-core": {
    "iron": 1,
    "copper": 1,
    "wood": 1,
    "stone": 1
  },
  "simple-robot-frame": {
    "iron": 1,
    "copper": 1,
    "wood": 1
  },
  "simple-robot-gun": {
    "iron": 1,
    "copper": 1,
    "wood": 1
  },
  "suppression-bot": {
    "iron": 1,
    "copper": 1,
    "wood": 1
  },
  "coolant": {
    "iron": 1,
    "wood": 1
  },
  "conductive-slurry": {
    "copper": 1,
    "wood": 1
  },
  "hydraulic-actuator": {
    "iron": 1,
    "copper": 1,
    "wood": 1
  },
  "hydro-core": {
    "iron": 1,
    "copper": 1,
    "wood": 1,
    "stone": 1
  },
  "refined-mithril": {
    "iron": 1,
    "wood": 1,
    "mythril": 1
  },
  "shiny-core": {
    "iron": 1,
    "copper": 1,
    "wood": 1,
    "mythril": 1
  },
  "precision-controller": {
    "iron": 1,
    "copper": 1,
    "wood": 1,
    "mythril": 1
  },
  "advanced-actuator": {
    "iron": 1,
    "copper": 1,
    "wood": 1,
    "mythril": 1
  },
  "command-core": {
    "iron": 1,
    "copper": 1,
    "wood": 1,
    "stone": 1,
    "mythril": 1
  },
  "ceramic-electrode": {
    "copper": 1,
    "wood": 1,
    "stone": 1
  },
  "mithril-mesh": {
    "iron": 1,
    "copper": 1,
    "wood": 1,
    "mythril": 1
  },
  "logic-substrate": {
    "iron": 1,
    "copper": 1,
    "wood": 1,
    "stone": 1,
    "mythril": 1
  },
  "sealed-frame": {
    "iron": 1,
    "copper": 1,
    "wood": 1,
    "stone": 1
  },
  "cooled-gun": {
    "iron": 1,
    "copper": 1,
    "wood": 1
  },
  "medium-suppression-bot": {
    "iron": 1,
    "copper": 1,
    "wood": 1,
    "stone": 1
  },
  "mithril-frame": {
    "iron": 1,
    "copper": 1,
    "wood": 1,
    "stone": 1,
    "mythril": 1
  },
  "focused-gun": {
    "iron": 1,
    "copper": 1,
    "wood": 1,
    "mythril": 1
  },
  "heavy-suppression-bot": {
    "iron": 1,
    "copper": 1,
    "wood": 1,
    "stone": 1,
    "mythril": 1
  },
  "servo-frame": {
    "iron": 1,
    "copper": 1,
    "wood": 1,
    "stone": 1,
    "mythril": 1
  },
  "pulse-cannon": {
    "iron": 1,
    "copper": 1,
    "wood": 1,
    "mythril": 1
  },
  "command-suppression-bot": {
    "iron": 1,
    "copper": 1,
    "wood": 1,
    "stone": 1,
    "mythril": 1
  }
};
export const recyclerAccepts = (item: ItemId) => Object.hasOwn(RECYCLER_RETURNS, item);
