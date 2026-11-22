# Recovery recipe lookup optimization

The approved lookup optimization is implemented locally (NODE-0815). Each expansion-shortage evaluation builds its producer lookup lazily, once, then reuses it while examining stocked items and their ingredients. The recovery calculation, rescue conditions, one-second check interval and existing recursion guards are unchanged. The index expires with the evaluation; budget results are not cached.

## Measured result

The preserved NODE-0808 bundles were compared with new bundles using the same deterministic factories and harness. Three before/after pairs were interleaved for each of the Shiny and late factories, alternating execution order. Baseline timing and instrumented attribution ran separately. Values below are medians of the three trial statistics for the 1,159-node/64-map late layout, over 300 measured ticks after 50 warmup ticks.

| Measurement | Before | After |
| --- | ---: | ---: |
| Recovery shortage evaluation, 30 calls, attributed | 328.86 ms | 64.48 ms |
| Average per shortage evaluation, derived from the row above | 10.96 ms | 2.15 ms |
| Total pristine engine time, 300 ticks | 1,053.48 ms | 806.68 ms |
| Pristine tick p95 | 14.62 ms | 6.06 ms |
| Pristine tick median | 1.94 ms | 2.06 ms |

Recovery evaluation used about 80.4 percent less attributed time. The complete window used about 23.4 percent less pristine engine time and its p95 fell about 58.6 percent. Typical-tick medians did not improve in this paired sample; the gain is concentrated in periodic recovery work. The Shiny factory normally exits that check early, so it has no meaningful recovery-index speed claim (about 0.026 ms total shortage evaluation before and after).

Separate before/after V8 allocation samples estimated cumulative recovery-branch allocation pressure of 384.02 MiB and 167.20 MiB for the late workload. These are illustrative sampled estimates including collected objects, not retained memory, exact allocated bytes, or a paired multi-trial memory comparison.

## What changed

`src/simulation/expansionRescue.ts` now creates one lazy evaluator per `nextExpansionShortages` call. Its producer map indexes positive recipe outputs, retaining original recipe order, output quantities and the existing exclusion of recovery and recycle/efficient/composite producer classes. All three mineral budgets share that map for the evaluation. Raw-item identity and recursion cycle checks still return before an index is needed.

The evaluator does not memoize numerical budgets: those depend on the current recursion path. New checks obtain the current catalog afresh, avoiding retained lookups across a mod/catalog change, load or undo. Automatic recovery continues to exclude modded/training/Dev Source worlds. The helper's catalog-switch tests establish lookup isolation; they do not enable recovery for mods.

`minimumCosts`, the stock ledger, Unknown Device funding, regeneration/Golem alternatives, payable Map bills and rescue actions retain their existing logic. No save schema, player copy, interface, simulation interval, undo representation or standalone refactor phase changed. This does not implement a simpler recovery policy or grant additional resources.

## Verification

Seven new regressions compare numerical budgets with the exhaustive pre-optimization calculation across assembled recipe inputs/outputs and all three rescue minerals. They also cover alternate and multi-output producers, quantities, excluded and nonpositive/chance-only outputs, path-dependent cycles, raw/unknown stock, catalog mutation avoidance, replacement/removal and return from a changed mod catalog.

The focused current-source run passed 85 tests across resource-potential, progression-recovery, Unknown Device and endgame suites. The standard workspace suite passed **2,372 tests**, zero failures and one existing skip: 1,576 current-tree passes and 796 preserved release-snapshot passes. TypeScript and the local production build passed with Vite's existing large-chunk warning. Catalog/link and history verification accompany the implementation record.

The complete six-case profile was repeated with 48 workers: three pristine trials, three attribution trials and separate CPU/allocation workers per case. All 48 final state hashes match the corresponding preserved pre-change outcome. Controlled active/blocked/idle routes continue to pass conservation, FIFO launch/receiver ordering, empty Road inventories and reservation-capacity checks. Another 24 paired workers compared old/new timing and also matched final state hashes. These are 72 fresh worker executions, not additional normal Vitest tests.

Among the 377 previously captured source files, only `expansionRescue.ts` changed; the new regression file was added. Both original playtest archives and the earlier profile reports/bundles were retained. The original recovery source is preserved as `expansionRescue.before.ts` for review; its relative imports belong to its original source directory, not this output folder.

## Evidence and limits

- [Paired timings and 48 historical outcome comparisons](comparison.json)
- [Repeated six-case results](results.json), [phase/allocation summary](summary.json) and [current run fingerprints](source-fingerprints.json)
- [Full test report](tests.json), [regression tests](../../src/simulation/resourcePotential.test.ts) and [current implementation](../../src/simulation/expansionRescue.ts)
- [Preserved pre-change profile and method](../transport-profile/README.md)

Use `build.mjs`, `run.mjs`, `compare.mjs` and `summarize.mjs` in this folder to reproduce the declared headless comparison; the comparison needs the preserved NODE-0808 bundles. New `baseline/` means the optimized uninstrumented bundle, while the preserved older bundles remain in `outputs/transport-profile/`. `compare.mjs` alternates before/after order and refuses different final states. Instrumentation remains confined to output bundles.

Results are from Node v24.19.0 on one Ryzen 9 9900X Windows desktop, with normal 100 ms tick deltas executed headlessly without wall-clock waiting, rendering, UI subscribers or autosave. Archived layouts retain legacy world rules and per-node pauses. They do not certify current-rule balance, browser FPS, slower/mobile performance, every mod/catalog, or every factory graph. No browser campaign or storage origin was accessed, and no release was published. Obstruction/index work and optional-screen loading remain separate review items.
