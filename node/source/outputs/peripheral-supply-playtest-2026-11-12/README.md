# Peripheral suppliers through first victory

The two arms use the rounded milestone bills and revised recipes from the earlier [Core Assembly Efficiency playtest](../core-efficiency-payback-2026-11-12/README.md). The upgraded arm pays five of each Core through Hydro to reduce Hydro, Shiny, and Complex assembly cycles by 40%. Both arms use five Simple per Map Point and one of each Core for victory. The run starts at fresh Home, uses a 400 ms engine step and gives each new survey 30 game seconds. The clock includes production, freight, research and construction timers. Manual placement and wiring time are outside the benchmark.

The Shiny line receives 243 Circuit A from a surveyed neighboring map one step farther from Home. The Complex line receives 124 Circuit A and 31 Hydro Pistons from two outward suppliers. The Piston supplier requires its own Lake for wet work. The Complex site search allows supplier paths of up to four crossings. Two seeds exhausted the one-crossing search in preliminary trials, so all six comparison runs use the wider search. The harness selects sites from revealed maps, reserves the planned materials before building, keeps Mythril Tribute separate from solid freight, and runs the same corner policy after the industrial bills. The layout treatment includes the sites and map openings this supply plan requires.

An opened map counts as useful if it sends or receives cargo on a Road with a successful transfer. This measures production sources, destinations and working freight relays, including Roads later retired. Home is excluded from both opened and useful totals. Exploration that revealed a possibility without a successful freight transfer is outside the useful count. Gross extraction includes unused inventory and Water. Total placements include failed construction attempts and temporary logistics.

Useful-map counts use the same freight-ledger rule for the earlier local-solid runs. The [verification script](../core-efficiency-payback-2026-11-12/verify.mjs) also checks paused victories, both research bills, matched first-Hydro snapshots, completed inward freight and per-project wait totals.

On seed `10`, both arms waited for the Dragon piece and released its completed freight before returning the Reclamation piece. The preliminary attempts ran out of open Road crossings for the return. The other two seeds had a working path and used the normal return order.

## Peripheral layout, base versus upgraded

All six runs reached first victory. The peripheral layout was faster than the earlier local-solid layout in every matched comparison and reduced total placements, connections and Research Center wait in all six. Within the peripheral layout, the upgrade saved both time and placements on zero seeds. It lowered total Research Center wait on all three, but first Shiny arrived later on each upgraded route. The peripheral layout eliminated the failed Complex construction attempts observed in the earlier runs, removing a large source of the earlier upgrade's placement savings.

All arrows show base → upgraded. Time deltas are upgraded minus base.

| Seed | First victory | Time delta | Gross extraction | Useful / opened | Nodes placed | Connections placed | Wait for any Core |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 10 | 4:52:36.4 → 4:53:34.0 | +0:00:57.6 | 64,242 → 64,248 | 51/60 → 51/60 | 1,644 → 1,642 | 2,230 → 2,218 | 1:00:48.4 → 0:59:44.0 |
| 680312004 | 5:41:51.6 → 5:42:56.4 | +0:01:04.8 | 64,358 → 64,358 | 65/94 → 65/94 | 1,708 → 1,705 | 2,284 → 2,271 | 1:20:10.8 → 1:20:05.6 |
| 1361531576 | 5:27:06.4 → 5:26:56.8 | −0:00:09.6 | 66,549 → 66,561 | 67/82 → 67/82 | 1,834 → 1,836 | 2,382 → 2,371 | 1:17:33.2 → 1:17:10.0 |

| Seed | Standing nodes at victory | Standing connections at victory | Shiny production nodes | Complex production nodes |
| --- | --- | --- | --- | --- |
| 10 | 1,342 → 1,338 | 1,150 → 1,146 | 48 → 47 | 57 → 56 |
| 680312004 | 1,378 → 1,373 | 1,136 → 1,131 | 48 → 47 | 57 → 56 |
| 1361531576 | 1,458 → 1,456 | 1,213 → 1,210 | 48 → 47 | 57 → 56 |

## Layout comparison against the earlier Lake route

The deltas below are peripheral layout minus earlier local-solid layout, paired on the same seed and upgrade choice. The comparison measures the whole route, including the survey and freight choices it leads to.

| Seed | Upgrade choice | Victory delta | Extraction delta | Useful / opened | Placement delta | Connection delta | Any-Core wait delta |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 10 | Base | −0:23:49.6 | −1,759 | 56/73 → 51/60 | −249 | −306 | −0:15:22.4 |
| 10 | Upgraded | −0:22:12.4 | −1,733 | 56/73 → 51/60 | −101 | −237 | −0:17:08.8 |
| 680312004 | Base | −0:19:45.2 | −2,955 | 66/99 → 65/94 | −712 | −1,226 | −0:16:57.6 |
| 680312004 | Upgraded | −0:03:45.6 | −3,044 | 66/99 → 65/94 | −29 | −47 | −0:04:14.4 |
| 1361531576 | Base | −0:15:10.8 | +243 | 65/85 → 67/82 | −503 | −1,044 | −0:13:05.6 |
| 1361531576 | Upgraded | −0:15:50.4 | +247 | 65/85 → 67/82 | −493 | −1,038 | −0:15:36.4 |

## Research Center wait by Core

Each row shows base → upgraded. A wait starts when an active research project still needs a Core and none is in its input buffer. The any-Core total counts a blocked step once. Individual Core waits can overlap.

| Seed | Simple | Basic | Automata | Hydro | Shiny | Complex | Final |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 10 | 0:24:10.4 → 0:23:51.6 | 0:05:39.2 → 0:06:16.4 | 0:03:59.2 → 0:03:59.2 | 0:04:51.6 → 0:06:05.6 | 0:07:44.0 → 0:07:22.0 | 0:17:22.8 → 0:15:07.2 | 0:00:01.2 → 0:00:01.2 |
| 680312004 | 0:44:20.4 → 0:44:46.8 | 0:05:23.6 → 0:06:09.2 | 0:03:59.2 → 0:03:59.2 | 0:04:51.6 → 0:06:05.6 | 0:07:28.0 → 0:07:10.4 | 0:17:13.2 → 0:14:57.2 | 0:00:01.2 → 0:00:01.2 |
| 1361531576 | 0:41:13.6 → 0:43:14.0 | 0:05:36.8 → 0:03:56.8 | 0:03:59.2 → 0:03:59.2 | 0:04:51.6 → 0:06:05.6 | 0:07:27.6 → 0:07:20.0 | 0:17:27.6 → 0:15:28.0 | 0:00:01.2 → 0:00:01.2 |

## Gross extraction by material

| Seed | Wood | Copper | Iron | Stone | Water | Mythril |
| --- | --- | --- | --- | --- | --- | --- |
| 10 | 19,427 → 19,427 | 21,957 → 21,957 | 14,552 → 14,552 | 1,207 → 1,207 | 5,704 → 5,704 | 1,395 → 1,401 |
| 680312004 | 19,427 → 19,427 | 21,957 → 21,957 | 14,552 → 14,552 | 1,207 → 1,207 | 5,768 → 5,768 | 1,447 → 1,447 |
| 1361531576 | 20,114 → 20,114 | 22,965 → 22,965 | 14,900 → 14,900 | 1,245 → 1,245 | 5,970 → 5,982 | 1,355 → 1,355 |

## Inward shipments

The two arms of each seed use the same supplier, destination, and crossing count for every shipment. Each run delivered all 398 intermediates.

| Seed | Shiny Circuit A | Complex Hydro Pistons | Complex Circuit A | Item-crossings per delivered Shiny or Complex Core |
| --- | --- | --- | --- | --- |
| 10 | 4,3 → 5,3 (1 crossing) | 4,7 → 6,6 (3 crossings) | 3,6 → 6,6 (3 crossings) | 6.32 |
| 680312004 | 5,2 → 5,3 (1 crossing) | 5,2 → 4,4 (3 crossings) | 4,3 → 4,4 (1 crossing) | 4.11 |
| 1361531576 | 4,3 → 4,4 (1 crossing) | 4,3 → 6,4 (3 crossings) | 6,2 → 6,4 (4 crossings) | 7.43 |

## Core phase times

| Seed | Automata → Hydro | Hydro → Shiny | Shiny → Complex | Complex → Final |
| --- | --- | --- | --- | --- |
| 10 | 0:13:34.8 → 0:13:34.8 | 0:53:55.6 → 0:57:46.4 | 0:35:24.4 → 0:34:48.4 | 2:40:24.0 → 2:38:06.8 |
| 680312004 | 0:13:34.8 → 0:13:34.8 | 1:20:48.8 → 1:23:54.0 | 0:29:50.4 → 0:29:14.4 | 3:08:20.0 → 3:06:55.6 |
| 1361531576 | 0:13:34.8 → 0:13:34.8 | 0:55:27.2 → 0:57:50.4 | 0:29:51.6 → 0:29:15.6 | 3:18:55.2 → 3:16:58.4 |

## Saved evidence

| Seed | Base audit | Upgraded audit | Paused victories |
| --- | --- | --- | --- |
| 10 | [Base](10-skip-victory.json) | [Upgraded](10-buy-victory.json) | [Base](10-skip-victory-checkpoint.json) · [Upgraded](10-buy-victory-checkpoint.json) |
| 680312004 | [Base](680312004-skip-matched.json) | [Upgraded](680312004-buy-matched.json) | [Base](680312004-skip-matched-checkpoint.json) · [Upgraded](680312004-buy-matched-checkpoint.json) |
| 1361531576 | [Base](1361531576-skip-matched.json) | [Upgraded](1361531576-buy-matched.json) | [Base](1361531576-skip-matched-checkpoint.json) · [Upgraded](1361531576-buy-matched-checkpoint.json) |

## Reproduction

From the workspace with Node 24, choose `buy` or `skip` and repeat for seeds `10`, `680312004`, and `1361531576`.

```powershell
$seed = 10
$arm = 'buy'
$prefix = "outputs/peripheral-supply-playtest-2026-11-12/$seed-$arm-replay"
node --disable-warning=ExperimentalWarning --experimental-transform-types scripts/final-core-engine-run.mjs --blind --protect-lakes --balance-pilot --through-victory --shiny-survey=shiny-with-imports --peripheral-supply "--core-efficiency=$arm" "--seed=$seed" "--audit=$prefix.json" "--checkpoint=$prefix-checkpoint.json" > "$prefix-result.json"
```
