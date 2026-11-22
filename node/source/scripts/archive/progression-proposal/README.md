# Historical progression proposal compiler

This bundle preserves the proposal compiler and analytical inputs as historical evidence. It is not a supported source generator. The `.mjs.txt` files are inert source snapshots; do not restore or run them against the current checkout. Their output contains retired gameplay rules.

The original command, `node scripts/sync-progression-content.mjs`, now reports retirement and exits with status 1 without reading inputs or writing files. It has no force or output-path override. The original helper at `scripts/apply-reviewed-production.mjs` remains readable for earlier evidence links; the retired entry point does not import it.

| Snapshot | Original location |
| --- | --- |
| [Compiler source](sync-progression-content.mjs.txt) | `scripts/sync-progression-content.mjs` |
| [Review transformation](apply-reviewed-production.mjs.txt) | `scripts/apply-reviewed-production.mjs` |
| [Core design input](core-design.json) | `outputs/progression/core-design.json` |
| [Waste design input](waste-design.json) | `outputs/progression/waste-design.json` |

The [manifest](manifest.json) records each original path, exact byte length and SHA-256 hash. The original input files remain in place. These copies preserve the retirement boundary even if a supported analytical report later updates its own output files.

Maintain gameplay through the existing content modules described in the [recipe reference](../../../docs/systems/recipes.md). Run `npm run docs:systems` to regenerate documentation catalogs, then the appropriate tests, build and documentation/history checks. This documentation generator does not replace gameplay definitions.

The [retirement regression](../../compilerRetirement.test.ts) runs copies of the compatibility entry point in disposable workspaces, including the exact old inputs and a current catalog. It checks failure status, useful guidance and unchanged file hashes for direct execution, extra arguments and module import, plus the archive checksums. It never invokes the historical writer in the real workspace.
