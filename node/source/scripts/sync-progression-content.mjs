// Compatibility entry point only. The historical compiler must not rewrite current gameplay.
process.stderr.write(
  'Retired: scripts/sync-progression-content.mjs no longer generates gameplay catalogs.\n' +
  'Maintain the owned content modules directly; see docs/systems/recipes.md.\n' +
  'Historical compiler and inputs: scripts/archive/progression-proposal/README.md.\n' +
  'Use npm run docs:systems to refresh documentation catalogs after reviewed content edits.\n',
);
process.exitCode = 1;
