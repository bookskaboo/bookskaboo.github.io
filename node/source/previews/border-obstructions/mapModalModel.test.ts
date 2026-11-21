import { expect, it } from 'vitest';
import { bordersVisibleInMap, MAP_BORDER_EXAMPLES, mapModalFixture, sideOfBorder, validateDisplayBorders } from './mapModalModel';
import { hasObstructedCorner } from '../../src/domain/borderObstructionLayout';
it('keeps nine unique orthogonal samples without corner conflicts at either endpoint', () => {
  expect(MAP_BORDER_EXAMPLES).toHaveLength(9);
  expect(new Set(MAP_BORDER_EXAMPLES.map(edge => [edge.from, edge.to].sort().join(':'))).size).toBe(9);
  for (const kind of ['river', 'mountain', 'chasm']) expect(MAP_BORDER_EXAMPLES.filter(edge => edge.kind === kind)).toHaveLength(3);
  for (const layout of validateDisplayBorders().values()) expect(hasObstructedCorner(layout)).toBe(false);
});
it('reveals borders after either adjacent map is visited without revealing unseen borders', () => {
  const game = mapModalFixture(false), border = MAP_BORDER_EXAMPLES.find(edge => edge.from === '2,2')!;
  expect(bordersVisibleInMap(game)).not.toContain(border);
  game.sectors[border.to].visited = true;
  expect(bordersVisibleInMap(game)).toContain(border);
  expect(bordersVisibleInMap(mapModalFixture())).toHaveLength(9);
});
it('describes the same shared border from opposite sides', () => {
  expect(sideOfBorder(MAP_BORDER_EXAMPLES[1], '6,5')).toBe('east');
  expect(sideOfBorder(MAP_BORDER_EXAMPLES[1], '7,5')).toBe('west');
});
