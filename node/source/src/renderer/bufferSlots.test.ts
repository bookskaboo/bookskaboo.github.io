import { describe, expect, it } from 'vitest';
import { bufferSlots, isStorageNode } from './bufferSlots';
import { NODE_DEFINITIONS } from '../content/nodes';

describe('node buffer squares', () => {
  it('distinguishes empty and occupied slots in small production buffers', () => {
    expect(bufferSlots(0,5)).toEqual([0,0,0,0,0]);
    expect(bufferSlots(2,5)).toEqual([1,1,0,0,0]);
    expect(bufferSlots(8,5)).toEqual([1,1,1,1,1]);
    expect(bufferSlots(-1,5)).toEqual([0,0,0,0,0]);
  });
  it('scales large storage without hundreds of squares and retains proportional fill', () => {
    expect(bufferSlots(3,200)).toHaveLength(40);
    expect(bufferSlots(3,200)[0]).toBe(.6);
    expect(bufferSlots(200,200).every(fill=>fill===1)).toBe(true);
    expect(bufferSlots(0,0)).toEqual([]);
  });
  it('omits production progress from every storage category and Inventory', () => {
    for(const node of Object.values(NODE_DEFINITIONS).filter(node=>node.category==='Storage')) expect(isStorageNode(node.kind)).toBe(true);
    expect(isStorageNode('inventory')).toBe(true);
    expect(isStorageNode('kiln')).toBe(false);
    expect(isStorageNode('researchCenter')).toBe(false);
  });
});
