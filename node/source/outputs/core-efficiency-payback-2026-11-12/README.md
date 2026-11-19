# Core Assembly Efficiency payback

The paired headless playtest uses seeds `10`, `680312004`, and `1361531576`. Both routes use the rounded research bills and revised recipes from the [balance proposal](../../docs/core-consumption-balance-proposal.md). One route buys Core Assembly Efficiency after first Hydro for five Cores of each tier through Hydro. Its 40% reduction applies to Hydro, Shiny, and Complex Core assembly only. The other route skips it. The five-Simple Map Point price and one-of-each victory bill apply to both.

The harness surveys before inspecting maps, produces the Core bills, buys research at Home, and finishes the four corners through normal engine actions. The [pilot data](../../scripts/core-efficiency-pilot.json) changes recipe inputs, cycle times and bills. The headless engine applies the assembly multiplier only after the upgrade is paid. Both routes use a 400 ms game step and a 30-second allowance per newly surveyed map. Elapsed time includes production, freight, research, surveys, and the game’s construction timers. Manual placement and wiring time are outside the clock.

The route reserves the selected Shiny Lake’s solids and adds Home buffers for the larger bills. Initial import trials competed for the same local ore or Road slots. The measured route selects a Lake with enough local solids and supplies Mythril by Road. Complex factories start with a target of 2.8 Cores per minute and try smaller layouts when the available sites cannot fit that factory. The upgraded builds use fewer assembly machines where the same production target allows it. Total placements count cleared attempts, temporary freight, and equipment used to pay the upgrade bill. This benchmark uses a single route policy and measures outcomes under that policy.

## Results through first victory

All six runs reached first victory. The upgrade paid for itself in both elapsed time and total nodes placed on two seeds. It placed fewer nodes on all three and finished 30 seconds later on seed 1361531576. Deltas are upgraded minus base.

| Seed | Base victory | Upgraded victory | Time delta | Nodes placed, base → upgraded | Node delta |
| --- | --- | --- | --- | --- | --- |
| 10 | 5:16:26.0 | 5:15:46.4 | −0:00:39.6 | 1,893 → 1,743 | −150 |
| 680312004 | 6:01:36.8 | 5:46:42.0 | −0:14:54.8 | 2,420 → 1,734 | −686 |
| 1361531576 | 5:42:17.2 | 5:42:47.2 | +0:00:30.0 | 2,337 → 2,329 | −8 |

| Seed | Connections placed | Standing nodes at victory | Gross resource units | Maps visited | Core Fabricators (Hydro / Shiny / Complex) |
| --- | --- | --- | --- | --- | --- |
| 10 | 2,536 → 2,455 | 1,371 → 1,329 | 66,001 → 65,981 | 74 | 4 / 3 / 3 → 3 / 2 / 2 |
| 680312004 | 3,510 → 2,318 | 1,368 → 1,400 | 67,313 → 67,402 | 100 | 4 / 3 / 2 → 3 / 2 / 2 |
| 1361531576 | 3,426 → 3,409 | 1,330 → 1,322 | 66,306 → 66,314 | 86 | 4 / 3 / 2 → 3 / 2 / 1 |

Each upgrade payment took 1:40 from project selection. Each arm followed the same route through first Hydro. The upgraded arm reached first Shiny 1:28–2:50 later. On seed 680312004 the base route cleared five failed Complex layouts before fitting a smaller one. The upgraded route fit its faster layout on the first attempt. That accounts for much of the large placement gap. The upgraded route finished that seed with 32 more standing nodes. On seed 1361531576 both routes had five failed layouts. With one Complex Fabricator instead of two, the upgraded route finished the Complex shipment 30 seconds later and carried that difference through victory.

| Seed | Automata to Hydro | Hydro to Shiny | Shiny to Complex | Complex to Final |
| --- | --- | --- | --- | --- |
| 10 | 0:13:34.8 → 0:13:34.8 | 1:19:50.0 → 1:22:40.4 | 0:30:53.6 → 0:28:02.8 | 2:42:50.0 → 2:42:10.8 |
| 680312004 | 0:13:34.8 → 0:13:34.8 | 2:06:20.4 → 2:07:48.4 | 0:43:26.0 → 0:29:12.0 | 2:28:58.0 → 2:26:49.2 |
| 1361531576 | 0:13:34.8 → 0:13:34.8 | 1:24:14.8 → 1:26:32.8 | 0:41:34.4 → 0:38:58.4 | 2:53:35.6 → 2:54:23.6 |

### Research Center wait

The total counts each game step with at least one required Core missing from the selected project’s input buffer once. Per-Core waits can overlap. Each cell shows base → upgraded.

| Seed | Any Core | Simple | Basic | Automata | Hydro | Shiny | Complex | Final |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 10 | 1:16:10.8 → 1:16:52.8 | 0:37:58.4 → 0:41:40.8 | 0:06:10.4 → 0:03:52.0 | 0:03:59.2 → 0:03:59.2 | 0:04:51.6 → 0:06:05.6 | 0:06:37.2 → 0:06:30.0 | 0:19:38.0 → 0:17:34.0 | 0:00:01.2 → 0:00:01.2 |
| 680312004 | 1:37:08.4 → 1:24:20.0 | 0:46:42.8 → 0:48:16.8 | 0:06:09.2 → 0:03:52.0 | 0:03:59.2 → 0:03:59.2 | 0:04:51.6 → 0:06:05.6 | 0:07:46.4 → 0:07:22.0 | 0:30:39.2 → 0:17:33.2 | 0:00:01.2 → 0:00:01.2 |
| 1361531576 | 1:30:38.8 → 1:32:46.4 | 0:41:54.0 → 0:43:41.2 | 0:05:30.0 → 0:03:52.0 | 0:03:59.2 → 0:03:59.2 | 0:04:51.6 → 0:06:05.6 | 0:06:52.8 → 0:06:35.6 | 0:30:39.2 → 0:31:21.6 | 0:00:01.2 → 0:00:01.2 |

The later phases still vary widely between seeds. The long Shiny phase included scouting for a Lake with enough local reserves. A follow-up should measure whether scouting for peripheral suppliers and shipping compact intermediates inward lets a central Complex line fit more readily and reach its intended throughput. This run measures the upgrade under the Lake-first layout.

| Seed | Base audit | Upgraded audit | Paused victory checkpoints |
| --- | --- | --- | --- |
| 10 | [Base](10-skip-final.json) | [Upgraded](10-buy-final.json) | [Base](10-skip-final-checkpoint.json) · [Upgraded](10-buy-final-checkpoint.json) |
| 680312004 | [Base](680312004-skip-fit.json) | [Upgraded](680312004-buy-final.json) | [Base](680312004-skip-fit-checkpoint.json) · [Upgraded](680312004-buy-final-checkpoint.json) |
| 1361531576 | [Base](1361531576-skip-fit.json) | [Upgraded](1361531576-buy-fit.json) | [Base](1361531576-skip-fit-checkpoint.json) · [Upgraded](1361531576-buy-fit-checkpoint.json) |

[Verification script](verify.mjs) checks the saved victories, pilot bills, recipes, payment of the upgrade, paired first-Hydro snapshots, and per-project wait totals.

## Reproduction

From the workspace with Node 24, run the following command once per seed and arm. Use `buy` for the upgraded route and `skip` for the base route.

```powershell
$seed = 10
$arm = 'buy'
$prefix = "outputs/core-efficiency-payback-2026-11-12/$seed-$arm-replay"
node --disable-warning=ExperimentalWarning --experimental-transform-types scripts/final-core-engine-run.mjs --blind --protect-lakes --balance-pilot --through-victory --shiny-survey=shiny-with-imports "--core-efficiency=$arm" "--seed=$seed" "--audit=$prefix.json" "--checkpoint=$prefix-checkpoint.json" > "$prefix-result.json"
```
