import { describe, expect, it } from 'vitest';
import { MACHINE_EFFICIENCY, EFFICIENCY_CORES, EFFICIENCY_ACCESS, efficiencyFactors } from './machineEfficiency';
import { getEfficiencyMultiplier, getRecipeEfficiencyMultiplier, getRecoveryMultiplier } from './efficiency';
import { RESEARCH_PROJECTS, isResearchAvailable } from './research';
import { buildResearchTree } from '../ui/researchTree';

describe('Core-tier machine efficiency', () => {
  it('has 64 paid ranks, gated by the machine, previous rank and matching Core', () => {
    let total = 0;
    for (const definition of MACHINE_EFFICIENCY) {
      const factors = efficiencyFactors(definition.start);
      expect(factors.at(-1)).toBe(.35);
      for (let index = 0; index < factors.length; index++) {
        const tier = definition.start + index;
        const project = RESEARCH_PROJECTS.find(p => p.id === `${definition.family}${tier}`)!;
        const access = [EFFICIENCY_ACCESS[tier - 1], ...(index ? [`${definition.family}${tier - 1}`] : definition.access ? [definition.access] : [])];
        expect(project.name).toBe(`${definition.name} ${index + 1}`);
        expect(Object.keys(project.costs)).toEqual(EFFICIENCY_CORES.slice(0, tier));
        expect(Object.values(project.costs)).toEqual(Array(tier).fill(5 + tier * 5));
        expect(isResearchAvailable(project, access)).toBe(true);
        expect(isResearchAvailable(project, access.filter(id => id !== EFFICIENCY_ACCESS[tier - 1]))).toBe(false);
        expect(getEfficiencyMultiplier(definition.family, [project.id])).toBe(factors[index]);
        total++;
      }
    }
    expect(total).toBe(64);
    expect(() => buildResearchTree()).not.toThrow();
  });
  it('uses the agreed rounded factors and no retired speed projects', () => {
    expect(efficiencyFactors(1)).toEqual([.9,.8,.7,.65,.55,.45,.35]);
    expect(efficiencyFactors(2)).toEqual([.9,.8,.65,.55,.45,.35]);
    expect(efficiencyFactors(3)).toEqual([.85,.75,.6,.5,.35]);
    expect(efficiencyFactors(4)).toEqual([.85,.65,.5,.35]);
    expect(efficiencyFactors(5)).toEqual([.8,.55,.35]);
    for (const id of ['extractor1','refiner2','assembler1','treePlanter1','planterThroughput','mineralRecovery1','pressureSystems','highPressureIntakes']) expect(RESEARCH_PROJECTS.some(p=>p.id===id)).toBe(false);
  });
  it('every recipe uses only the machine that performs the work', () => {
    expect(getRecipeEfficiencyMultiplier('composite-mythril-wire','separationFurnace',['assembler7'])).toBe(1);
    expect(getRecipeEfficiencyMultiplier('mithril-mesh','separationFurnace',['advancedAssembler7','separationFurnace5'])).toBe(.8);
    expect(getRecipeEfficiencyMultiplier('recover-crust','recycler',['separationFurnace7','recycler4'])).toBe(.85);
    expect(getRecoveryMultiplier({recovery:true},['mineralRecovery1'])).toBe(1);
  });
});
