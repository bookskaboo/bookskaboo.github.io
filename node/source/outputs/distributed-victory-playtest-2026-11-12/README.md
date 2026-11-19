# Distributed factory layout through first victory

November 12, 2026

The control is the earlier two-channel route, which surveys the corners before producing Shiny and reuses the Shiny factory site for Complex. The new route starts Medium Bots while scouting, sizes the first Lake for Shiny, allows shipments of missing solids from surveyed outposts, and finds a separate Lake for Complex nearer Home. It surveys the corners after establishing Complex and supplies the corner challenges by Road. Both routes use the same three seeds and research prices, skip Road Channels 2, and pay the first victory bill.

The measured new route replenishes Dwarven Tribute with a second 65-Bot factory after the corner survey. The first Bot batch expired before the Mythril Golem attack finished on two exploratory seeds. The harness also reconciles its Simple Core stock at Home before restarting Map Point research because the early staging step retired the original Core Roads. The three measured new runs use the same replenishment policy, with its costs included. Their Shiny Lakes covered ordinary solids locally, and they received Mythril Tribute by Road. A prior dedicated run verified Copper Plate imports. [Copper import check](../shiny-with-imports-playtest-2026-11-12/README.md)

The headless clock includes production, construction timers, research, freight, and 30 seconds per new survey. It excludes the time a person would spend placing and wiring nodes. Gross extraction includes Water and unused stock. Placement counts include temporary nodes and connections. Standing counts exclude natural and encounter nodes and include paused machinery.

Research wait time is sampled at the Research Center immediately before its normal research update on each 400 ms tick. A Core counts as missing when the selected project still needs it and the Center has none in its input buffer. The total counts each blocked tick once. Per-Core times can overlap when several required Cores are missing. Time with no project selected is outside this measure.

## First-victory comparison

Every arrow reads control → new layout.

The new layout reached Shiny 67–81 minutes sooner, then spent 67–100 more minutes between first Complex and first Final. Seed 10 won 32.4 seconds sooner. The other two finished 18:16.4 and 18:46.4 later. The new layout extracted 14–17% more resources through victory and left more infrastructure standing on all three seeds. The runs combine a new survey order, separate Core sites, and Tribute replenishment, so the totals measure the route as a package.

| Seed | First victory | Gross extraction | Nodes placed | Connections placed | Maps opened |
| --- | ---: | ---: | ---: | ---: | ---: |
| 680312004 | 4:47:30.4 → 5:05:46.8 | 40,594 → 46,505 | 1,432 → 1,430 | 1,736 → 1,791 | 76 → 81 |
| 10 | 4:43:26.4 → 4:42:54.0 | 40,556 → 46,315 | 1,302 → 1,324 | 1,633 → 1,702 | 74 → 63 |
| 1361531576 | 4:47:55.6 → 5:06:42.0 | 40,676 → 47,752 | 1,464 → 1,471 | 1,763 → 1,819 | 76 → 81 |

| Seed | Nodes standing at victory | Connections standing at victory | Simple Cores paid | Wait for any Core |
| --- | ---: | ---: | ---: | ---: |
| 680312004 | 1,016 → 1,096 | 763 → 882 | 466 → 491 | 1:17:47.6 → 1:16:28.4 |
| 10 | 955 → 1,041 | 710 → 816 | 456 → 401 | 1:17:23.6 → 1:10:25.6 |
| 1361531576 | 1,033 → 1,119 | 788 → 880 | 466 → 491 | 1:17:42.4 → 1:16:52.4 |

## Research Center wait by Core

Simple was the largest source of wait on every seed, at 35:31.6 to 42:04.8 in the new layout. Map Point research accounted for 22:31.2 to 29:09.2 of that. Complex was next at 15:41.2. Total time blocked on at least one Core fell on all three seeds, even though total time to victory rose on two. Late surveying and rebuilding Tribute supply can consume time outside an active research project.

| Seed | Simple | Basic | Automata | Hydro | Shiny | Complex | Final |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 680312004 | 40:12.8 → 41:39.2 | 4:21.2 → 4:21.2 | 3:59.2 → 3:59.2 | 5:46.8 → 5:46.8 | 9:56.8 → 7:30.8 | 16:06.0 → 15:41.2 | 0:01.2 → 0:01.2 |
| 10 | 39:39.2 → 35:31.6 | 4:21.2 → 4:21.2 | 3:59.2 → 3:59.2 | 5:51.6 → 5:51.6 | 9:56.4 → 7:35.6 | 16:06.0 → 15:41.2 | 0:01.2 → 0:01.2 |
| 1361531576 | 40:12.8 → 42:04.8 | 4:21.2 → 4:21.2 | 3:59.2 → 3:59.2 | 5:46.8 → 5:46.8 | 9:51.6 → 7:29.2 | 16:06.0 → 15:41.2 | 0:01.2 → 0:01.2 |

## Gross extraction by material

| Seed | Wood | Copper | Iron | Stone | Water | Mythril |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 680312004 | 12,320 → 14,038 | 13,576 → 15,222 | 9,300 → 10,937 | 715 → 888 | 3,684 → 4,029 | 999 → 1,391 |
| 10 | 12,262 → 13,770 | 13,443 → 14,637 | 9,355 → 11,177 | 715 → 915 | 3,822 → 4,411 | 959 → 1,405 |
| 1361531576 | 12,300 → 14,292 | 13,576 → 15,648 | 9,301 → 11,225 | 695 → 895 | 3,822 → 4,411 | 982 → 1,281 |

## Phase comparisons

Each interval starts at the previous milestone. Production counts use the first Core made on any map. Wait totals count the time an active project was missing at least one Core.

### Seed 680312004

| Phase | Time | Gross extraction | Nodes placed | Connections placed | Research wait |
| --- | ---: | ---: | ---: | ---: | ---: |
| Home to Simple | 0:56.8 → 0:56.8 | 22 → 22 | 5 → 5 | 8 → 8 | 0:38.8 → 0:38.8 |
| Simple to Basic | 3:38.8 → 3:38.8 | 119 → 119 | 10 → 10 | 14 → 14 | 3:12.8 → 3:12.8 |
| Basic to Automata | 24:34.4 → 24:34.4 | 1,400 → 1,400 | 45 → 45 | 59 → 59 | 14:26.0 → 14:26.0 |
| Automata to Hydro | 11:11.2 → 11:11.2 | 2,358 → 2,358 | 49 → 49 | 78 → 78 | 9:01.6 → 9:01.6 |
| Hydro to Shiny | 2:08:46.8 → 47:48.0 | 19,091 → 14,685 | 313 → 203 | 402 → 291 | 26:26.4 → 6:22.4 |
| Shiny to Complex | 24:12.0 → 23:48.4 | 3,059 → 3,164 | 89 → 84 | 125 → 120 | 19:48.8 → 19:24.8 |
| Complex to Final | 1:34:02.8 → 3:13:41.6 | 14,543 → 24,755 | 921 → 1,034 | 1,049 → 1,220 | 4:12.0 → 23:20.8 |
| Final to victory | 0:07.6 → 0:07.6 | 2 → 2 | 0 → 0 | 1 → 1 | 0:01.2 → 0:01.2 |

### Seed 10

| Phase | Time | Gross extraction | Nodes placed | Connections placed | Research wait |
| --- | ---: | ---: | ---: | ---: | ---: |
| Home to Simple | 0:56.8 → 0:56.8 | 22 → 22 | 5 → 5 | 8 → 8 | 0:38.8 → 0:38.8 |
| Simple to Basic | 3:38.8 → 3:38.8 | 119 → 119 | 10 → 10 | 14 → 14 | 3:12.8 → 3:12.8 |
| Basic to Automata | 24:34.4 → 24:34.4 | 1,400 → 1,400 | 39 → 39 | 53 → 53 | 14:26.0 → 14:26.0 |
| Automata to Hydro | 11:11.2 → 11:11.2 | 2,358 → 2,358 | 54 → 54 | 83 → 83 | 9:01.6 → 9:01.6 |
| Hydro to Shiny | 2:06:06.4 → 59:03.2 | 19,095 → 15,986 | 306 → 174 | 391 → 262 | 25:56.8 → 8:17.6 |
| Shiny to Complex | 24:18.0 → 23:52.8 | 3,057 → 3,184 | 105 → 90 | 140 → 126 | 19:54.4 → 19:29.6 |
| Complex to Final | 1:32:33.2 → 2:39:29.2 | 14,503 → 23,244 | 783 → 952 | 943 → 1,155 | 4:12.0 → 15:18.0 |
| Final to victory | 0:07.6 → 0:07.6 | 2 → 2 | 0 → 0 | 1 → 1 | 0:01.2 → 0:01.2 |

### Seed 1361531576

| Phase | Time | Gross extraction | Nodes placed | Connections placed | Research wait |
| --- | ---: | ---: | ---: | ---: | ---: |
| Home to Simple | 0:56.8 → 0:56.8 | 22 → 22 | 5 → 5 | 8 → 8 | 0:38.8 → 0:38.8 |
| Simple to Basic | 3:38.8 → 3:38.8 | 119 → 119 | 10 → 10 | 14 → 14 | 3:12.8 → 3:12.8 |
| Basic to Automata | 24:34.4 → 24:34.4 | 1,400 → 1,400 | 42 → 42 | 56 → 56 | 14:26.0 → 14:26.0 |
| Automata to Hydro | 11:11.2 → 11:11.2 | 2,358 → 2,358 | 53 → 53 | 80 → 80 | 9:01.6 → 9:01.6 |
| Hydro to Shiny | 2:08:36.0 → 1:01:24.4 | 19,227 → 16,083 | 322 → 213 | 410 → 294 | 26:20.4 → 8:36.8 |
| Shiny to Complex | 24:12.8 → 23:46.8 | 3,042 → 3,184 | 105 → 96 | 140 → 131 | 19:49.6 → 19:23.2 |
| Complex to Final | 1:34:38.0 → 3:01:02.0 | 14,506 → 24,586 | 927 → 1,052 | 1,054 → 1,235 | 4:12.0 → 21:32.0 |
| Final to victory | 0:07.6 → 0:07.6 | 2 → 0 | 0 → 0 | 1 → 1 | 0:01.2 → 0:01.2 |

## Evidence and reproduction

| Seed | Control audit | New layout audit |
| --- | --- | --- |
| 680312004 | [Audit](680312004-control.json) | [Audit](680312004-replenished.json) |
| 10 | [Audit](10-control.json) | [Audit](10-replenished.json) |
| 1361531576 | [Audit](1361531576-control.json) | [Audit](1361531576-replenished.json) |

Run the harness from the workspace with Node 24. Use a separate audit and checkpoint for each seed and arm.

~~~powershell
node --disable-warning=ExperimentalWarning --experimental-transform-types scripts/final-core-engine-run.mjs --blind --protect-lakes --balance-pilot --through-victory --shiny-survey=shiny-with-imports --seed=680312004 --audit=layout.json --checkpoint=layout-checkpoint.json
~~~

Use the flag --road-channels-comparison=skip in place of --shiny-survey=shiny-with-imports to reproduce the control. The audit includes research wait by project and cumulative waits at each Core milestone.
