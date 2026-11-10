import { describe, expect, it } from 'vitest';
import { researchEventProject, unlockDestination } from './unlockNavigation';

describe('unlock navigation', () => {
  it('opens the relevant catalog without a placement or research-selection action', () => {
    expect(unlockDestination('kiln')).toEqual({ panel: 'build', nodeKind: 'kiln' });
    expect(unlockDestination('joint')).toEqual({ panel: 'build', nodeKind: 'joint' });
    expect(unlockDestination('automataCore')).toEqual({ panel: 'recipes', recipeId: 'automata-core' });
    expect(unlockDestination('suppressionBot')).toEqual({ panel: 'recipes', recipeId: 'robot-frame' });
    expect(unlockDestination('extractor1')).toEqual({ panel: 'research', projectId: 'extractor1' });
    expect(unlockDestination('mithrilTools')).toEqual({ panel: 'recipes', recipeId: 'mythril-gear' });
    expect(unlockDestination('mithrilTools', 'separationFurnace')).toEqual({ panel: 'build', nodeKind: 'separationFurnace' });
  });

  it('recovers destinations for research notifications saved before project IDs existed', () => {
    const event = { id: 'old', type: 'ResearchCompleted' as const, message: 'Kiln research complete. Unlocks the Kiln node', at: 10 };
    expect(researchEventProject(event)).toBe('kiln');
    expect(researchEventProject({ ...event, projectId: 'joint' })).toBe('joint');
    expect(researchEventProject({ ...event, message: 'Map Node research complete. Awards 1 Map Point.' })).toBe('mapNode');
    expect(researchEventProject({ ...event, message: 'Extra Map Point research complete. Awards 1 Map Point.' })).toBe('mapNode');
    expect(researchEventProject({ ...event, message: 'Unknown old message' })).toBeUndefined();
  });
});
