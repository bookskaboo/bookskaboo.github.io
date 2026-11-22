# Transport and queue profile

Bounded profiling completed November 21, 2026 (NODE-0808). **The measured samples favor targeted recovery-analysis and obstruction/index work over a queue rewrite.** That profiling did not change runtime source. The producer-lookup proposal has since been approved and implemented locally (NODE-0815); its [separate comparison](../recovery-recipe-index/README.md) preserves all original measurements below. Obstruction/index follow-ups still await review.

## Workloads and baseline results

Times are ranges of three uninstrumented Node trial medians/p95s. Each worker warmed up for fifty 100 ms ticks, then measured three hundred ticks (thirty simulated seconds). Headless ticks ran without wall-clock waiting, rendering, subscribers or autosave. They are engine costs on this desktop, not browser FPS or a capacity guarantee.

| Workload | Maps / nodes / cables | Tick median ms | Tick p95 ms |
| --- | --- | ---: | ---: |
| Fresh seed 10, current rules | 1 / 5 / 0 | 0.008–0.009 | 0.033–0.037 |
| Archived Shiny playtest | 31 / 469 / 333 | 0.636–0.795 | 1.991–2.602 |
| Archived late playtest | 64 / 1,159 / 1,033 | 2.076–2.284 | 14.691–15.874 |
| Controlled active routes | 2 / 9 / 5 | 0.012–0.014 | 0.072–0.095 |
| Controlled blocked routes | 2 / 9 / 5 | 0.008–0.010 | 0.043–0.066 |
| Controlled idle routes | 2 / 9 / 5 | 0.009–0.010 | 0.048–0.067 |

The two archives are `outputs/tribute-first-playtest-2026-11-12/10-tribute-first-checkpoint.json` and `outputs/live-map-pricing-playtest-2026-11-15/10-final-checkpoint.json`, normalized through the current loader. Global pause was released; per-node pause/disable settings remained as saved (99 and 22 nodes respectively). These legacy layouts are declared playtest workloads, not current-rule balance evidence. The Shiny case had 22 Roads and produced 90 additional units; the late case had 132 Roads and produced 296 additional units across warmup plus measurement. The late case's largest measured tick was 28.514 ms.

The controlled fixtures use a reciprocal Road pair with normally sized Carts, a 200-item mixed FIFO Warehouse source, a receiving Warehouse and two competing Carts feeding one 20-item Cart. Capacities come from current definitions/upgrades. The blocked case fills the Cart receivers and disables the Warehouse receiver; the idle case empties all sources. Training isolation suppresses rescue grants, and terrain/crossing layout is explicitly omitted. These are synthetic transport checks, with no normal-play progression claim or oversized stock. The active FIFO launched 87 alternating Iron/Copper items across the complete thirty-five simulated seconds; the Road sink received cargo and the competing receiver reached its reserved capacity.

## Attribution and allocation

Three separate attribution trials instrument only output bundles using parsed function boundaries. Runtime source files remain untouched. Nested inclusive time is tracked separately from time excluding instrumented children; inclusive rows overlap. Function hooks introduce overhead, so the table below is diagnostic attribution, not the pristine timing table above. Constructor body timings exclude class-field initialization; the lazy `sector` index work and baseline allocation samples are the useful index measurements.

| Late-factory work | Calls in 300 ticks | Median attributed ms | Sampled allocation estimate |
| --- | ---: | ---: | ---: |
| Shortage evaluation, including lower-cost analysis | 30 | 327.54 inclusive | 384.02 MiB, whole recovery branch |
| Obstruction checking, including signature creation | 10,545 | 198.61 | 179.23 MiB |
| Lazy sector index access/build, excluding obstruction child | 88,429 | 74.90 | 297.28 MiB, lookup category |
| Road material tracing | 1,185 | 40.86 | 57.22 MiB |
| FIFO reconciliation | 104,776 | 17.13 | 19.69 MiB |

The median attributed total was 1,119.55 ms over the measured window. Queue reconciliation was about 1.5 percent of that total, Road tracing 3.6 percent, obstruction checking 17.7 percent and shortage evaluation 29.3 percent. In the Shiny case, obstruction checking cost 68.02 ms of a 297.66 ms attributed total, while shortage checks returned almost immediately. These shares depend on the saved factory and active recovery conditions.

The late factory's every-tenth-tick medians were 15.52–16.35 ms, versus 1.99–2.04 ms for its other ticks. These boundaries run the periodic shortage evaluation and sometimes cable dispatch, so the grouping alone does not prove causality. The direct attribution and independent baseline CPU sample both identify shortage/resource-potential work as a major contributor. `resourcePotential` scans the current recipe catalog recursively; `minimumCosts` accounted for only 26.45 ms of the 327.54 ms shortage evaluation. This makes a per-evaluation producer index a more focused first proposal than caching whole shortage results or changing the rescue interval.

The obstruction cache still constructs a serialized geometry signature before comparing it with the prior signature. This profile includes both signature construction and any actual obstruction rebuilds; it does not measure a cache-hit percentage or isolate signature cost from geometric validation. Sector indexes are lazily populated for each simulation/delivery/routing phase rather than once per `sector` call. The 88,429 calls are accesses, not 88,429 full rebuilds. Broad cross-phase index reuse could retain stale cargo reservations or obstruction state.

CPU sampling and allocation sampling each ran in a separate pristine-bundle worker per case. CPU used a 1 ms sampling interval; allocation used a 16 KiB sampling interval with collected-object sampling enabled. Allocation estimates are cumulative allocation pressure over the window, including objects subsequently collected, **not retained memory, leaks, process RAM or exact bytes allocated**. Allocation buckets use the nearest relevant stack category and exclude the separate outside-tick/harness bucket. CPU sampling is sparse for tiny controlled cases and is not used to rank their hotspots. Raw profiles retain source maps and stacks for inspection.

## Correctness and preservation

All forty-eight final workers completed: three baseline trials, three attribution trials, one CPU sample and one allocation sample for each of six cases. Every mode/trial reached the same final state hash for its case. A deterministic clock and UUID/random stream made that comparison possible; the archived sources were copied, not edited. This is repeatability evidence, not proof that any future optimization preserves behavior.

Every controlled tick checked physical conservation across input/output buffers and non-cosmetic in-flight cargo. Competing sources never exceeded the receiver's twenty-item capacity including reservations. Roads retained no stock. The active mixed route preserved the launch sequence and the receiver's FIFO sequence; blocked and idle fixtures emitted no FIFO items. Cosmetic Road pulses were excluded from inventory. The checks concern these explicit routes, not every possible graph or malformed legacy save.

All 377 captured `src/` files and both original archive snapshots retained their SHA-256 hashes. No browser campaign, storage origin, normal test fixture, package script, legacy stress command or release was changed. No fresh gameplay-wide suite or production game build was needed for unchanged runtime source; the two one-off profiling bundles were built successfully. This does not replace whole-world browser performance coverage, slower-device checks or normal-play validation.

## Original proposals at profiling time

1. **Review first:** build an eligible-producer recipe index once per shortage evaluation and reuse it through `resourcePotential` recursion. Preserve recipe order/filtering, path-dependent cycle guards, current mod catalog, Unknown Device budgets and genuine shortage rescues. Compare outputs with the existing solver and measure the same workloads before accepting a change.
2. **Still pending:** investigate obstruction-signature allocations and lazy index construction before choosing a cache policy. Rewiring, movement, recipe/socket changes, camp growth, mods, undo and load all need correct invalidation; the current per-phase reservation boundary must remain safe.
3. Keep Road tracing and queues unchanged unless additional measurements justify work. A high call count alone does not make FIFO representation the main bottleneck.

At the time of NODE-0808, only the profiling was authorized and completed. The later approved producer-lookup implementation is linked above. The old stress benchmark stays retired; this profile executed no standalone organization-plan phase.

## Evidence and reproduction

- [Complete trials and per-tick timing series](results.json)
- [Computed comparisons, CPU/allocation buckets and top stacks](summary.json)
- [Runtime/archive fingerprints](source-fingerprints.json)
- [Instrumentation sites](instrumentation-sites.json), [build transform](build.mjs), [worker](worker.ts), [fixtures](fixtures.ts) and [summarizer](summarize.mjs)
- Individual `*.cpuprofile.json` and `*.heapprofile.json` files contain raw sampled stacks; baseline and instrumented bundles include source maps.

Node v24.19.0 ran on Windows with an AMD Ryzen 9 9900X. Reproduce this bounded, one-off audit from the project root using installed dependencies:

```powershell
node outputs/transport-profile/build.mjs
node outputs/transport-profile/run.mjs
node outputs/transport-profile/summarize.mjs
```

The runner enforces a sixty-second bound per worker and refuses differing final state hashes or changed runtime/archive fingerprints. The fixture is not installed as a supported benchmark command or part of the ordinary suite. CPU/allocator sampling and local concurrent load affect estimates; this is one desktop and declared windows, not a release performance target.
