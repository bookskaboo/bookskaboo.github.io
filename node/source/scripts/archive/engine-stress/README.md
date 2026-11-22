# Retired whole-world engine benchmark

This bundle preserves the old synthetic benchmark, runner, report formatter and their existing reports. It is historical evidence, not a supported performance measurement tool. The original fixture used overfilled Carts and does not satisfy current terrain-crossing validation. Its timings do not establish ordinary-play capacity or current browser performance.

`npm run stress` has been removed from the package scripts. Direct calls to `scripts/run-stress.mjs` and `scripts/summarize-stress.mjs` report retirement and exit with status 1 without launching a workload or updating reports. The old `scripts/stress.test.ts` path is a retirement notice containing no benchmark excluded from current Vitest discovery; it retains a destination for earlier evidence links. Archived source files use `.txt` suffixes and must not be restored into the current test run.

| Original source | Preserved snapshot |
| --- | --- |
| `scripts/run-stress.mjs` | [Runner](run-stress.mjs.txt) |
| `scripts/stress.test.ts` | [Fixture](stress.test.ts.txt) |
| `scripts/summarize-stress.mjs` | [Report formatter](summarize-stress.mjs.txt) |

The original [baseline JSON](../../../outputs/stress/baseline.json), [baseline report](../../../outputs/stress/baseline.md), [latest JSON](../../../outputs/stress/latest.json) and [latest report](../../../outputs/stress/latest.md) remain byte-for-byte intact at their existing locations. The `reports/` directory contains matching frozen copies. [Manifest](manifest.json) records all seven original paths, sizes and SHA-256 hashes. Older report headings and reproduction instructions are retained as historical text, not current guidance.

Use the [active-factory browser tool](../../../previews/active-factory/README.md) for its documented simulation/rendering comparisons and existing Road tests for correctness and conservation. These do not replace whole-world multi-map performance coverage. A smaller current multi-map benchmark remains deferred until cross-map optimization requires it; no new benchmark is introduced by this retirement. See [verification scope](../../../docs/systems/testing-and-publishing.md).
