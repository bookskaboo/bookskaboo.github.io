/** Shared by simulation and animation so upgraded cycles stay in sync. */
export function getEfficiencyMultiplier(family: string | undefined, completed: readonly string[]) {
  if (!family) return 1;
  for (let rank = 6; rank >= 1; rank--) {
    if (completed.includes(`${family}${rank}`)) return (10 - rank) / 10;
  }
  return 1;
}

const retainedRecipeFamilies = new Map([
  ['mithril-mesh', 'advancedAssembler'],
  ['efficient-mythril-mesh', 'advancedAssembler'],
  ['composite-mythril-gear', 'assembler'],
  ['composite-mythril-wire', 'assembler'],
  ['recover-crust', 'separationFurnace'],
]);

export function getRecipeEfficiencyMultiplier(recipeId: string | undefined, machineFamily: string | undefined, completed: readonly string[]) {
  return getEfficiencyMultiplier(retainedRecipeFamilies.get(recipeId ?? '') ?? machineFamily, completed);
}

export function getRecoveryMultiplier(recipe: { recovery?: boolean } | undefined, completed: readonly string[]) {
  return recipe?.recovery && completed.includes('mineralRecovery1') ? 0.9 : 1;
}
