// Stable calculation identifiers are separate from player-facing names.
export const displayText = value => String(value)
  .replaceAll('Conductive Slurry', 'Copper–Carbon Dispersion')
  .replaceAll('conductive slurry', 'Copper–Carbon Dispersion')
  .replaceAll('conductive-slurry', 'Copper–Carbon Dispersion');
