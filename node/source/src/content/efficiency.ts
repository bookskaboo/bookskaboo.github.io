import { efficiencyDefinition, efficiencyFactors } from './machineEfficiency';

/** Shared by simulation and animation so upgraded cycles stay in sync. */
export function getEfficiencyMultiplier(family: string | undefined, completed: readonly string[]) {
  if (!family) return 1;
  const definition = efficiencyDefinition(family);
  if (!definition) return 1;
  const factors = efficiencyFactors(definition.start);
  for (let tier = 7; tier >= definition.start; tier--) {
    if (completed.includes(`${family}${tier}`)) return factors[tier - definition.start];
  }
  return 1;
}

export function getRecipeEfficiencyMultiplier(_recipeId: string | undefined, machineFamily: string | undefined, completed: readonly string[]) {
  return getEfficiencyMultiplier(machineFamily, completed);
}

export function getRecoveryMultiplier(_recipe: { recovery?: boolean } | undefined, _completed: readonly string[]) {
  return 1;
}
