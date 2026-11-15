# First peripheral production balance patch

November 14, 2026

The local game catalog now charges the rounded milestone bills and uses the revised Hydro, Shiny, Complex and Final recipes from the [balance proposal](../../docs/core-consumption-balance-proposal.md). The early Core recipes are the original versions. Hydro uses two Circuit B and a 20-second cycle. Shiny uses three Circuit A and a 30-second cycle. The Controller uses three Copper Slurry, the three Complex components take 36 seconds each, and Complex assembly takes 45 seconds. Yin and Yang each take 20 seconds, and Final assembly takes 60 seconds. Milestone prices are 15 of each required Core for Hydraulic Assembly, 20 for Ore Separation and Heavy Robotics, and 30 for Precision Control and Command Robotics. The patch uses existing optional efficiency research and standard Road and encounter rules.

The three fresh matched runs used the local catalog, a Map Point price of five Simple Cores through a test mod, and no efficiency upgrade. Circuit A and Hydro Pistons travelled inward as in the earlier peripheral route. Each run delivered all 398 planned intermediates and paid the first-victory bill. Time includes production, freight, research, construction timers and 30 game seconds per newly surveyed map. Manual placement and wiring time are outside the measurement. Useful maps supplied or received cargo on a working Road, with Home excluded.

## Matched victory results

Every matched run reproduced its prior unupgraded pilot run exactly for milestone times, resources, nodes, connections, paid bills and research waits. The patch promotes the tested recipe and bill changes to the local catalog. This comparison verifies that moving them to the catalog preserves their behavior.

| Seed | Victory | Gross extraction | Useful / opened maps | Nodes placed | Connections placed | Research wait |
| --- | --- | --- | --- | --- | --- | --- |
| 10 | 4:52:36.4 | 64,242 | 51 / 60 | 1,644 | 2,230 | 1:00:48.4 |
| 680312004 | 5:41:51.6 | 64,358 | 65 / 94 | 1,708 | 2,284 | 1:20:10.8 |
| 1361531576 | 5:27:06.4 | 66,549 | 67 / 82 | 1,834 | 2,382 | 1:17:33.2 |

| Phase | Matched game time | Target |
| --- | --- | --- |
| Home to Automata | 29:10 | 25–30 min |
| Automata to Hydro | 13:35 | 28–35 min |
| Hydro to Shiny | 53:56–1:20:49 | 40–55 min |
| Shiny to Complex | 29:50–35:24 | 60–75 min |
| Complex to Final | 2:40:24–3:18:55 | 90–105 min |

Simple was the largest source of research waiting on all three seeds, at 24:10–44:20. Complex was next at 17:13–17:28. The audits include exact waits by Core and by project. Research wait counts active projects with at least one missing required input.

## What still needs tuning

- **Map Points.** The standard escalating schedule remains in the game catalog. The flat five-Simple price makes the matched comparison reproducible. See the standard-price checks below for the cost of reaching the same suppliers under the default schedule.

- **Automata and Complex progression.** Add reasons to scale these lines before the next milestone. Automata → Hydro is about 14–21 minutes short. Shiny → Complex is about 25–45 minutes short. Test visible demand and actual factory work at these points before adding more final assembly time.

- **Shiny variation and the Final phase.** Two seeds reached Shiny close to the target. Seed 680312004 spent about 81 minutes after Hydro while finding and supplying the Dwarven and Shiny sites. The final phase is still about 55–109 minutes over its target ceiling. The tested route opened the corner paths after the production bills and built a second Tribute supply. Test starting corner scouting and supply work alongside Shiny and Complex production.

## Standard Map Point checks

The three fresh default-price checks used the same peripheral route and no mod. All stopped at an Extra Map Point purchase. These are route failures with the current prices. A player who preserves supply or chooses a different path may continue.

| Seed | Maps opened | Cores already paid for Map Points | Installment that stalled the route | Evidence |
| --- | ---: | ---: | --- | --- |
| 10 | 30 | 495 | Five of each Core through Hydro. The Center had paid four sets and lacked Hydro for the last set after the route released Hydro freight. | [Audit](10-standard-map-price.json) · [Checkpoint](10-standard-map-price-checkpoint.json) |
| 680312004 | 50 | 1,696 | Five of each Core through Complex. Precision Control unlocked the Complex recipe, so the price included Complex while the route was still scouting for the factory site. | [Audit](680312004-standard-map-price.json) · [Checkpoint](680312004-standard-map-price-checkpoint.json) |
| 1361531576 | 28 | 408 | Fourteen of each Core through Automata. The Center had paid eleven sets and its Basic buffer was empty during the corner survey. | [Audit](1361531576-standard-map-price.json) · [Checkpoint](1361531576-standard-map-price-checkpoint.json) |

The next Map Point pricing test should check a schedule that introduces a higher Core after its first production and shows the upcoming tier and price in advance. Retest the route with lower-Core supply available during later scouting. The fixed-route dry run also reports insufficient local reserves and initial Tribute after the recipe and bill changes, which is another reason to use the surveyed supplier route for balance testing.

## Evidence and reproduction

| Seed | Matched audit | Paused victory |
| --- | --- | --- |
| 10 | [Audit](10-matched-map-price.json) | [Checkpoint](10-matched-map-price-checkpoint.json) |
| 680312004 | [Audit](680312004-matched-map-price.json) | [Checkpoint](680312004-matched-map-price-checkpoint.json) |
| 1361531576 | [Audit](1361531576-matched-map-price.json) | [Checkpoint](1361531576-matched-map-price-checkpoint.json) |

Run from the workspace with Node 24. Change the seed and output prefix for each run. Use `standard-map-price` to run the patched game with its normal Map Point schedule.

```powershell
node --disable-warning=ExperimentalWarning --experimental-transform-types scripts/final-core-engine-run.mjs --blind --protect-lakes --through-victory --shiny-survey=shiny-with-imports --peripheral-supply --balance-patch=matched-map-price --seed=10 --audit=patch-audit.json --checkpoint=patch-checkpoint.json
```
