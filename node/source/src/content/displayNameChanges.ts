/** Normalize old human-readable Core names without touching serialized item IDs. */
export function canonicalCoreText(text: string) {
  return text.replace(/\bcommand([ -])core(s?)\b/gi, (match, separator: string, plural: string) => {
    const replacement = `Complex${separator}Core${plural}`;
    return match === match.toUpperCase() ? replacement.toUpperCase() : match[0] === match[0].toLowerCase() ? replacement.toLowerCase() : replacement;
  });
}

/** Old generated titles remain recognizable when loading factories and templates. */
export const LEGACY_NODE_DISPLAY_NAMES: Record<string, string> = {
  'Charcoal Generator': 'Generator',
  'Hydro Processor': 'Hydro Plant',
  'Advanced Assembler': 'Assembler II',
  'Separation Furnace': 'Separator',
  'Abandoned Fabricator': 'Fabricator',
  'Derelict Sorting Station': 'Sorting Ruin',
  'Power Conduit': 'Power Line',
  'Fluid Storage': 'Fluid Tank',
  'Waste Hopper': 'Waste Bin',
  'Waste Batch Link': 'Waste Link',
  'Goblin Tribute': 'Tribute',
};
