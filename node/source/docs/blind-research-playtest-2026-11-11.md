# Blind headless research playtest

November 11, 2026 · Vanilla workspace engine · Seed `680312004`

**Victory at 7:39:29.2.** The Research Center completed **A Remarkably Indirect Conclusion** with the first Final Core and one of each earlier Core. At victory, 33 of 118 catalog entries had been completed at least once, and 76 new maps had been surveyed. The paused checkpoint retained the research completion and victory journal entry when loaded through the game’s save normalizer. [Victory checkpoint](../outputs/blind-research-playtest-2026-11-11/victory-milestone.json)

**78 of 118 research entries at 9:46:32.4.** The post-victory run stopped on Mineral Regeneration. The Shiny supply was exhausted, and no eligible surveyed Lake could fit the replacement factory. [Final checkpoint](../outputs/blind-research-playtest-2026-11-11/final-checkpoint.json)

## Review outline

1. **Home through Automata.** Trace the starter factory, Exploration, and the first production districts that funded the survey.
2. **Hydro and scouting.** Review where the survey spent its lower Cores, when it opened the fourth Core line, and how Road capacity affected the route.
3. **Shiny and Complex.** Follow the Medium Bots to Dwarven Tribute, then the Shiny and Complex supply lines that unlocked Command Robotics.
4. **Final and victory.** Check the two Golem attacks, the four corner awards, the return freight, and the seven-Core payment for A Remarkably Indirect Conclusion.
5. **Research coverage.** Compare the completed projects against the vanilla catalog and check where the attempt stopped.

## Measurement

Each phase ends when the engine records the first unit of its named Core. The victory and subsequent research have separate endpoints. Phase totals include all active factories and their overlapping work. Gross extraction counts harvested resources and Tribute, including material left in buffers or on retired routes. The research ledger counts Cores actually paid, including any contribution to an unfinished project.

The 400 ms simulation steps ran ordinary engine actions. The survey learned resource and encounter details by paying for adjacent maps and visiting them. It used known recipes and budgeted 30 seconds of game time per new visit. Production continued during those visits. Construction timers, freight and research ran on the game clock. Scripted placement, wiring, route repair, and real-world troubleshooting took no game time. The run used no grants, resource rescue, or browser save.

## Time and gross extraction by Core phase

| Phase endpoint | Game clock | Time in phase | Survey time | New maps | Wood | Copper | Iron | Stone | Water | Mythril |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Simple | 0:00:56.8 | 0:00:56.8 | 0:00:00 | 0 | 11 | 11 | 0 | 0 | 0 | 0 |
| Basic | 0:04:35.6 | 0:03:38.8 | 0:00:00 | 0 | 55 | 54 | 10 | 0 | 0 | 0 |
| Automata | 0:29:10.0 | 0:24:34.4 | 0:05:00 | 10 | 488 | 650 | 242 | 20 | 0 | 0 |
| Hydro | 4:52:02.0 | 4:22:52.0 | 0:33:00 | 66 | 14,666 | 19,053 | 9,583 | 1,157 | 150 | 0 |
| Shiny | 5:51:56.8 | 0:59:54.8 | 0:00:00 | 0 | 5,638 | 5,601 | 5,185 | 500 | 1,910 | 73 |
| Complex | 6:02:40.0 | 0:10:43.2 | 0:00:00 | 0 | 457 | 534 | 336 | 11 | 184 | 129 |
| Final | 7:39:21.6 | 1:36:41.6 | 0:00:00 | 0 | 4,386 | 4,222 | 3,448 | 284 | 1,436 | 933 |
| Victory payment | 7:39:29.2 | 0:00:07.6 | 0:00:00 | 0 | 0 | 0 | 0 | 0 | 0 | 2 |
| **Through victory** | **7:39:29.2** | **7:39:29.2** | **0:38:00** | **76** | **25,701** | **30,125** | **18,804** | **1,972** | **3,680** | **1,137** |
| Post-victory research | 9:46:32.4 | 2:07:03.2 | 0:00:00 | 0 | 26,530 | 26,831 | 19,210 | 1,843 | 3,198 | 412 |
| **Through stop** | **9:46:32.4** | **9:46:32.4** | **0:38:00** | **76** | **52,231** | **56,956** | **38,014** | **3,815** | **6,878** | **1,549** |

## Cores paid into research by phase

The catalog count is cumulative. It includes automatic milestones and counts a repeatable project once when it is first purchased. The research ledger includes 75 purchases of Extra Map Point through victory. Exploration supplied the other Map Point.

| Phase endpoint | Simple | Basic | Automata | Hydro | Shiny | Complex | Final | Catalog entries |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Simple | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 5 |
| Basic | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 8 |
| Automata | 60 | 15 | 0 | 0 | 0 | 0 | 0 | 14 |
| Hydro | 1,135 | 1,135 | 1,060 | 0 | 0 | 0 | 0 | 19 |
| Shiny | 45 | 45 | 45 | 45 | 0 | 0 | 0 | 26 |
| Complex | 10 | 10 | 10 | 10 | 10 | 0 | 0 | 31 |
| Final | 5 | 5 | 5 | 5 | 5 | 5 | 0 | 32 |
| Victory payment | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 33 |
| **Through victory** | **1,261** | **1,211** | **1,121** | **61** | **16** | **6** | **1** | **33** |
| Post-victory research | 770 | 680 | 545 | 315 | 0 | 0 | 0 | 78 |
| **Through stop** | **2,031** | **1,891** | **1,666** | **376** | **16** | **6** | **1** | **78** |

## What drove the clock

- **Home and the survey.** Home produced Simple at 0:00:56.8 and Basic at 0:04:35.6. The Automata district at `(5,4)` produced its first Core at 0:29:10.0. The winning route surveyed all 76 new maps before making Hydro. That capped survey prices at three Core types during the long search for the Golems and industrial Lakes, while pushing the first Hydro Core to 4:52:02.0. [Survey and first Hydro trace](../outputs/blind-research-playtest-2026-11-11/campaign-progress.log)
- **Tribute through Complex.** The Dwarven supply district produced 76 Suppression Bots at 3 AP each. Staging 34 before connecting the camp gave the Tribute line time to reach full suppression. The first Tribute arrived about 8 minutes after the staged supply was connected. Shiny paid for Heavy Robotics and Precision Control, and Complex opened Command Robotics. The factory reserved one Core of each of the six tiers at Home for victory. [Dwarven and Complex trace](../outputs/blind-research-playtest-2026-11-11/recovery-progress.log)
- **Golems and the corners.** Seven 24 AP Bots defeated the Mythril Golem and five defeated the Iron Golem. The Iron build moved to the surveyed Lake at `(0,7)`, then the Foundry parts reused that floor space. Smelting Grove Iron Plate in the neighboring map avoided a cross-world run through a crowded crossing. The Dragon factory produced nine 24 AP Bots, and its Controller line furnished 20 Metallic Fines for Reclamation. [Golem and corner traces](../outputs/blind-research-playtest-2026-11-11/grove-progress.log) · [Dragon and victory trace](../outputs/blind-research-playtest-2026-11-11/victory-progress.log)
- **Return freight.** All four pieces traveled ten Road crossings to Home. The Foundry crossing became usable after removing 166 nodes from the retired Shiny and Complex district at `(3,5)`. The six Cores staged at Home remained available. [Freight and victory trace](../outputs/blind-research-playtest-2026-11-11/victory-progress.log)

## Survey and recovery notes

The first randomly drawn seed, `358368470`, stopped at 4:13:50 with 71 visited maps including Home. The harness could not place and supply a Hydro bank through the existing freight network. On seed `680312004`, a separate replay that moved Hydro earlier produced it at about 0:40:21, but stalled when it could not place another Extractor on a surveyed Lake. The winning route on the same seed retained late Hydro and resumed its own checkpoints at the Bot Plant setup, after the Mythril Golem, and after the first two corner awards. The harness update made Bot Plants use normal frame and gun inputs. Relocating the Iron factory, retrying Road endpoint positions, and clearing the retired district all used normal build and freight actions. [First attempt](../outputs/blind-research-playtest-2026-11-11/first-audit.json) · [Early-Hydro replay](../outputs/blind-research-playtest-2026-11-11/replay-audit.json)

## Research coverage after victory

The attempt targeted all 118 vanilla catalog entries. Fixed upgrade ranks counted separately. Repeatable projects counted once toward coverage after their first purchase. The harness prioritized projects without a Final Core bill before trying further corner rounds.

After victory, the Research Center completed 45 more entries, including Intermediate Recycling, Warehouse Logistics, and Trains. Trucks could deliver two items at once, which required a harness fix for production quotas. The recovered run also put 85 stranded Hydro Cores back on a route to Home. Remaining Hydro production then covered the last fourth-rank machine upgrades and Trains. [Post-victory payment and milestone ledger](../outputs/blind-research-playtest-2026-11-11/final-audit.json)

All 40 remaining catalog entries require Shiny Cores, and 13 also require another Final Core. Mineral Regeneration called for five each of Simple, Basic, Automata, Hydro, and Shiny. The replacement Shiny bank could not fit on the eligible Lakes, and 12 more minutes of existing factory operation delivered no Shiny Cores. The selected project had zero contributions at the stop. This stopping point applies to the surveyed layout and the harness’s placement and freight policy. [Final placement and supply trace](../outputs/blind-research-playtest-2026-11-11/final-progress.log)
