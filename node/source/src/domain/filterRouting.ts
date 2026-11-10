import type { ItemId, MachineNode } from './types';
import { cargoMaterial } from '../content/botAssembly';

export type FilterPort = 0 | 1;

export const selectedFilterPort = (node: MachineNode): FilterPort => node.filterOutputPort === 1 ? 1 : 0;
export const otherFilterPort = (port: FilterPort): FilterPort => port === 0 ? 1 : 0;
export const filterOutlet = (node: MachineNode, item: ItemId): FilterPort =>
  node.filterItem && cargoMaterial(item) === cargoMaterial(node.filterItem) ? selectedFilterPort(node) : otherFilterPort(selectedFilterPort(node));

export const blockedFilterPort = (node: MachineNode): FilterPort | undefined =>
  node.filterBlocked === 'selected' ? selectedFilterPort(node) :
    node.filterBlocked === 'remainder' ? otherFilterPort(selectedFilterPort(node)) : undefined;
