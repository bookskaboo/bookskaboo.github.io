import type { GameState } from '../domain/types';
import { RECIPES } from './recipes';

/** Retain old factories and templates while removing the dedicated machine kind. */
export function migrateRetiredNodes(state: GameState) {
  const groups = [
    ...Object.values(state.sectors).map(sector => sector.nodes),
    ...(state.factoryTemplates ?? []).map(template => template.nodes),
  ];
  for (const nodes of groups) for (const node of nodes) {
    if ((node.kind as string) !== 'automataCoreAssembler') continue;
    node.kind = 'assembler';
    if (node.name === 'Automata Core Assembler') node.name = 'Assembler';
    node.recipeId = 'automata-core';
    node.cycleMs = RECIPES['automata-core'].cycleMs;
  }
}
