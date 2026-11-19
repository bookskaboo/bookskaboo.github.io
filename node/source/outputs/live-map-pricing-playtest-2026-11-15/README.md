# Live map pricing playtest comparison

November 15, 2026

None of the three live-price seeds reached first victory. All three reached Complex in both the unchanged-route and revised runs. Seed 10 eventually opened all four corners. Seeds 680312004 and 1361531576 opened three each. The last common milestone for comparison is the first Complex Core.

This headless comparison uses seeds `10`, `680312004`, and `1361531576`. The controls are the three completed peripheral runs with a flat five-Simple charge per extra map. The new runs use the unmodded source of live build `8437231`, including destination quotes, the five-Core starting bill and increments, and the Complex surcharge on corners. [Flat-price control runs](../first-balance-patch-2026-11-14/README.md) · [Live build receipt](../node-tier-map-prices-release-2026-11-15/publication-receipt.json)

Each run starts from Home, surveys maps before inspecting their contents, and uses the same 400 ms simulation step and 30 seconds per survey as the controls. Time includes production, research, freight, construction timers, and survey time. Factory placement and wiring clicks are outside the measurement. Resources are cumulative gross extraction, including Lake Water and Mythril received from Tribute and mines. Opened maps exclude Home. Nodes and connections count placements, including anything later removed or rebuilt. Research waits count time with a selected project and a required Core missing from the Research Center. Per-Core waits can overlap when several inputs are missing.

## Unchanged route under live prices

All three original routes reached Complex and completed Command Robotics. All stopped on the first run of corner-path expansion. At the stopped quotes, the Center had Simple and Basic Cores and no Automata. The route had retired its lower-Core freight after staging the fixed research bills.

| Seed | Time when stopped | Raw resources extracted | Maps opened | Nodes placed | Connections placed | Total research wait | Map research wait |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 10 | 5:52:23.2 | 54,863 | 32 | 982 | 1,414 | 3:36:42.8 | 2:46:44.4 |
| 680312004 | 7:36:08.4 | 69,772 | 47 | 1,252 | 1,757 | 4:24:07.2 | 3:34:02.4 |
| 1361531576 | 5:29:29.2 | 54,916 | 29 | 1,110 | 1,520 | 3:26:48.0 | 2:38:30.8 |

| Seed | Finished map bills | Destination that stopped the run | Automata Cores still needed |
| --- | ---: | --- | ---: |
| 10 | 1,115 Cores | N1.W5 | 15 |
| 680312004 | 2,285 Cores | W5 | 5 |
| 1361531576 | 1,010 Cores | W5 | 5 |

The first Simple and Basic were reached at 0:56.8 and 4:35.6 respectively in all six runs. The initial survey raised time from first Basic to first Automata from **24:34.4** to **1:09:07.2–1:09:12.0**. All three unchanged live attempts then spent **2:38–3:34** waiting on Map Point inputs, including their final timed-out quote.

Original live-run audits and paused checkpoints for [seed 10](10-original-audit.json) ([save](10-original-checkpoint.json)), [seed 680312004](680312004-original-audit.json) ([save](680312004-original-checkpoint.json)), and [seed 1361531576](1361531576-original-audit.json) ([save](1361531576-original-checkpoint.json)).

## Revised route under live prices

The revised runs keep lower-Core deliveries available and secure the Mythril Golem reserve before opening the corners. The continuations start from their own saved factories. They include time already spent waiting at stopped research, plus any later dismantling and rebuilding of freight or production through ordinary engine actions. No resources or research were granted. The engine, recipes, deposit yields, and prices are those of the published build.

- Seed 10 stopped at **11:14:05.2** after opening four corners. The route attempted another map to find an endgame factory site. It could not place and supply another Complex bank for the quote. [Audit](10-finish-audit.json) · [Paused save](10-finish-checkpoint.json)
- Seed 680312004 stopped at **18:09:01.2** after opening three corners. Even after paying for the third Road slot and securing the Mythril reserve with Medium Bots, the route could not place and supply another Complex bank for the fourth corner quote. [Audit](680312004-medium-audit.json) · [Paused save](680312004-medium-checkpoint.json)
- Seed 1361531576 stopped at **16:40:26.4** after opening three corners and paying for the third Road slot. A map quote reached 12 of 20 sets. The Center ran out of Shiny even though it still held the five other required types. [Audit](1361531576-finish-audit.json) · [Paused save](1361531576-finish-checkpoint.json)

| Seed | Run | Time | Raw extraction | Maps | Nodes | Connections | Research wait | Map research wait | Cores paid for maps |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 10 | Flat control | 4:52:36.4 | 64,242 | 60 | 1,644 | 2,230 | 1:00:48.4 | 0:07:29.2 | 295 |
| 10 | Live stopped | 11:14:05.2 | 136,378 | 63 | 6,016 | 8,027 | 6:55:25.2 | 6:05:23.6 | 3,374 |
| 680312004 | Flat control | 5:41:51.6 | 64,358 | 94 | 1,708 | 2,284 | 1:20:10.8 | 0:27:49.6 | 465 |
| 680312004 | Live stopped | 18:09:01.2 | 213,244 | 99 | 7,087 | 8,795 | 10:22:01.2 | 9:31:30.4 | 9,088 |
| 1361531576 | Flat control | 5:27:06.4 | 66,549 | 82 | 1,834 | 2,382 | 1:17:33.2 | 0:25:53.2 | 405 |
| 1361531576 | Live stopped | 16:40:26.4 | 168,832 | 72 | 6,080 | 7,320 | 11:22:07.6 | 10:33:48.0 | 5,108 |

Only completed payments are included in the map Core total. A stopped row is cumulative through the stop. Comparisons for completed phases use the same first-production boundaries in both runs.

## Cumulative costs at first Complex Core

| Seed | Run | Time | Raw extraction | Maps | Nodes | Connections | Research wait |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 10 | Flat control | 2:12:04.8 | 37,577 | 30 | 716 | 1,094 | 0:50:00.4 |
| 10 | Live stopped | 3:51:04.8 | 48,692 | 30 | 978 | 1,384 | 1:44:35.6 |
| 680312004 | Flat control | 2:33:24.0 | 38,676 | 47 | 753 | 1,132 | 0:56:24.8 |
| 680312004 | Live stopped | 5:53:26.0 | 66,313 | 47 | 1,345 | 1,796 | 2:47:12.0 |
| 1361531576 | Flat control | 2:08:03.6 | 39,494 | 27 | 800 | 1,160 | 0:48:55.6 |
| 1361531576 | Live stopped | 3:35:44.0 | 49,575 | 27 | 1,101 | 1,485 | 1:43:00.0 |

This milestone is the latest shared boundary for every live run and its control. Complex-to-Final and victory are blank for any attempt that never reached them.

By the first Complex Core, each seed had opened the **same number of maps** as its control. Gross extraction was already **26–71% higher**. All three had spent **54 minutes to 1 hour 51 minutes more** waiting for research inputs.

## Resources by material

| Seed | Run | Wood | Copper | Iron | Stone | Water | Mythril |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 10 | Flat control | 19,427 | 21,957 | 14,552 | 1,207 | 5,704 | 1,395 |
| 10 | Live stopped | 42,101 | 49,159 | 30,877 | 2,269 | 10,620 | 1,352 |
| 680312004 | Flat control | 19,427 | 21,957 | 14,552 | 1,207 | 5,768 | 1,447 |
| 680312004 | Live stopped | 67,222 | 81,708 | 47,552 | 4,102 | 11,643 | 1,017 |
| 1361531576 | Flat control | 20,114 | 22,965 | 14,900 | 1,245 | 5,970 | 1,355 |
| 1361531576 | Live stopped | 52,710 | 62,398 | 37,905 | 3,102 | 11,340 | 1,377 |

## Research waits by required Core

| Seed | Run | Simple | Basic | Automata | Hydro | Shiny | Complex | Final |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 10 | Flat control | 0:24:10.4 | 0:05:39.2 | 0:03:59.2 | 0:04:51.6 | 0:07:44.0 | 0:17:22.8 | 0:00:01.2 |
| 10 | Live stopped | 1:24:02.8 | 0:19:02.0 | 0:23:22.0 | 0:15:40.8 | 1:30:38.4 | 3:16:04.0 | 0:00:00.0 |
| 680312004 | Flat control | 0:44:20.4 | 0:05:23.6 | 0:03:59.2 | 0:04:51.6 | 0:07:28.0 | 0:17:13.2 | 0:00:01.2 |
| 680312004 | Live stopped | 3:28:10.8 | 0:50:24.0 | 1:28:50.8 | 1:20:28.8 | 1:54:34.8 | 1:53:36.0 | 0:00:00.0 |
| 1361531576 | Flat control | 0:41:13.6 | 0:05:36.8 | 0:03:59.2 | 0:04:51.6 | 0:07:27.6 | 0:17:27.6 | 0:00:01.2 |
| 1361531576 | Live stopped | 2:28:21.6 | 0:33:22.4 | 0:51:42.8 | 0:33:03.2 | 2:06:44.8 | 5:29:58.0 | 0:00:00.0 |

## Metrics by Core phase

### Seed 10

Cells show flat control → live-price run.

| Phase | Time | Raw extraction | Maps opened | Nodes placed | Connections placed | Research wait |
| --- | --- | --- | --- | --- | --- | --- |
| Home → Simple | 0:00:56.8 → 0:00:56.8 | 22 → 22 | 0 → 0 | 5 → 5 | 8 → 8 | 0:00:38.8 → 0:00:38.8 |
| Simple → Basic | 0:03:38.8 → 0:03:38.8 | 119 → 119 | 0 → 0 | 10 → 10 | 14 → 14 | 0:03:12.8 → 0:03:12.8 |
| Basic → Automata | 0:24:34.4 → 1:09:09.6 | 1,400 → 4,276 | 10 → 10 | 39 → 84 | 53 → 111 | 0:14:26.0 → 0:39:42.4 |
| Automata → Hydro | 0:13:34.8 → 0:10:26.4 | 2,864 → 2,525 | 0 → 0 | 88 → 76 | 137 → 116 | 0:10:33.2 → 0:07:27.2 |
| Hydro → Shiny | 0:53:55.6 → 1:22:59.2 | 22,337 → 27,220 | 14 → 14 | 344 → 501 | 544 → 719 | 0:06:49.6 → 0:27:39.6 |
| Shiny → Complex | 0:35:24.4 → 1:03:54.0 | 10,835 → 14,530 | 6 → 6 | 230 → 302 | 338 → 416 | 0:14:20.0 → 0:25:54.8 |
| Complex → Final | 2:40:24.0 → — | 26,665 → — | 30 → — | 928 → — | 1,135 → — | 0:10:46.8 → — |
| Final → victory | 0:00:07.6 → — | 0 → — | 0 → — | 0 → — | 1 → — | 0:00:01.2 → — |

### Seed 680312004

Cells show flat control → live-price run.

| Phase | Time | Raw extraction | Maps opened | Nodes placed | Connections placed | Research wait |
| --- | --- | --- | --- | --- | --- | --- |
| Home → Simple | 0:00:56.8 → 0:00:56.8 | 22 → 22 | 0 → 0 | 5 → 5 | 8 → 8 | 0:00:38.8 → 0:00:38.8 |
| Simple → Basic | 0:03:38.8 → 0:03:38.8 | 119 → 119 | 0 → 0 | 10 → 10 | 14 → 14 | 0:03:12.8 → 0:03:12.8 |
| Basic → Automata | 0:24:34.4 → 1:09:04.8 | 1,400 → 4,274 | 10 → 10 | 45 → 81 | 59 → 108 | 0:14:26.0 → 0:39:40.8 |
| Automata → Hydro | 0:13:34.8 → 0:10:31.6 | 2,864 → 2,536 | 0 → 0 | 86 → 64 | 135 → 106 | 0:10:33.2 → 0:07:29.6 |
| Hydro → Shiny | 1:20:48.8 → 3:59:20.8 | 23,679 → 49,138 | 37 → 37 | 405 → 997 | 608 → 1,262 | 0:13:30.0 → 1:41:49.6 |
| Shiny → Complex | 0:29:50.4 → 0:29:53.2 | 10,592 → 10,224 | 0 → 0 | 202 → 188 | 308 → 298 | 0:14:04.0 → 0:14:20.4 |
| Complex → Final | 3:08:20.0 → — | 25,682 → — | 47 → — | 955 → — | 1,151 → — | 0:23:44.8 → — |
| Final → victory | 0:00:07.6 → — | 0 → — | 0 → — | 0 → — | 1 → — | 0:00:01.2 → — |

### Seed 1361531576

Cells show flat control → live-price run.

| Phase | Time | Raw extraction | Maps opened | Nodes placed | Connections placed | Research wait |
| --- | --- | --- | --- | --- | --- | --- |
| Home → Simple | 0:00:56.8 → 0:00:56.8 | 22 → 22 | 0 → 0 | 5 → 5 | 8 → 8 | 0:00:38.8 → 0:00:38.8 |
| Simple → Basic | 0:03:38.8 → 0:03:38.8 | 119 → 119 | 0 → 0 | 10 → 10 | 14 → 14 | 0:03:12.8 → 0:03:12.8 |
| Basic → Automata | 0:24:34.4 → 1:09:04.8 | 1,400 → 4,274 | 10 → 10 | 42 → 84 | 56 → 112 | 0:14:26.0 → 0:39:40.8 |
| Automata → Hydro | 0:13:34.8 → 0:10:26.4 | 2,864 → 2,528 | 0 → 0 | 88 → 67 | 135 → 107 | 0:10:33.2 → 0:07:27.2 |
| Hydro → Shiny | 0:55:27.2 → 1:41:45.6 | 24,638 → 32,492 | 17 → 17 | 424 → 699 | 614 → 906 | 0:06:01.2 → 0:37:56.8 |
| Shiny → Complex | 0:29:51.6 → 0:29:51.6 | 10,451 → 10,140 | 0 → 0 | 231 → 236 | 333 → 338 | 0:14:03.6 → 0:14:03.6 |
| Complex → Final | 3:18:55.2 → — | 27,055 → — | 55 → — | 1,034 → — | 1,221 → — | 0:28:36.4 → — |
| Final → victory | 0:00:07.6 → — | 0 → — | 0 → — | 0 → — | 1 → — | 0:00:01.2 → — |

## Reproduction

Use Node 24 from the workspace. Repeat this command for each seed, changing the output paths accordingly. Omit `--maintain-map-supply` to repeat the unchanged route. The revised harness is experimental and the recorded results include continuations from earlier harness iterations. Each published audit records the earlier trace and payments carried into that continuation.

```powershell
node --disable-warning=ExperimentalWarning --experimental-transform-types scripts/final-core-engine-run.mjs --blind --protect-lakes --through-victory --shiny-survey=shiny-with-imports --peripheral-supply --balance-patch=standard-map-price --maintain-map-supply --seed=10 --audit=10-live-audit.json --checkpoint=10-live-checkpoint.json
```

For a continuation, supply `--resume=<saved-checkpoint>` and `--resume-audit=<matching-audit>`. The terminal reports above continue from [seed 10's third-corner checkpoint](10-recovery-checkpoint.json) ([audit](10-recovery-audit.json)), [seed 680312004's saved factory before the Medium Bot attack](680312004-supply-checkpoint.json) ([audit](680312004-supply-audit.json)), and [seed 1361531576's checkpoint after Road Channels 2](1361531576-roads-checkpoint.json) ([audit](1361531576-roads-audit.json)).
