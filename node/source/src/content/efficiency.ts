/** Shared by simulation and animation so upgraded cycles stay in sync. */
export function getEfficiencyMultiplier(family: string | undefined, completed: readonly string[]) {
  if (!family) return 1;
  for (let rank = 6; rank >= 1; rank--) {
    if (completed.includes(`${family}${rank}`)) return (10 - rank) / 10;
  }
  return 1;
}
