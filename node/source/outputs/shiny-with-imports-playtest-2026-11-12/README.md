# Shiny factory siting and solid imports

November 12, 2026

Each pair starts at fresh Home on the same seed, builds the Medium Bot factory during scouting, and stops at the first Shiny Core. Both use the Core consumption pilot and the existing headless clock, including production, freight, construction timers, research, and 30 seconds per new survey. Hands-on placement and wiring time are outside that clock. The new route selects the closest viable surveyed Lake to Home and budgets for 30 Shiny Cores. It can bring in solids from other surveyed maps and smelts imported Copper and Iron into plates at the source. The previous route reserved local materials for 35 Shiny and 21 Complex Cores at the same Lake.

| Seed | Hydro → Shiny, previous → new | Time saved | Map openings, previous → new | Gross extraction, previous → new |
| --- | ---: | ---: | ---: | ---: |
| 680312004 | 1:11:03.6 → 47:48.0 | 23:15.6 | 37 → 4 | 17,349 → 14,685 |
| 10 | 59:03.6 → 59:03.2 | 0:00.4 | 20 → 14 | 16,323 → 15,986 |
| 1361531576 | 1:01:18.4 → 1:01:24.4 | −0:06.0 | 17 → 16 | 16,206 → 16,083 |

All three chosen Lakes had enough local ordinary solids for the Shiny budget. Each run imported Mythril from Dwarven Tribute. The time differences therefore measure Shiny-only siting and the freight routes it made possible. The new route met the 40–55 minute target on one seed. On the other two, both runs reached first Tribute on the same tick, and the earlier site choice changed first-Shiny time by six seconds or less. The comparison ends at first Shiny.

A separate check on seed 680312004 set the harness's local Copper budget to zero. The supplier smelted Copper Plates on surveyed map `5,4` and sent them one crossing to the Shiny Lake at `5,3`. The last Road dispatched 133 Plates by first Shiny, which came 51:48.4 after first Hydro. The paused save shows no Copper Extractor wired at the Shiny site. [Copper import audit](680312004-copper-import-check.json)

| Seed | Nodes placed during phase | Connections placed during phase | Nodes standing at first Shiny | Connections standing at first Shiny |
| --- | ---: | ---: | ---: | ---: |
| 680312004 | 272 → 203 | 359 → 291 | 367 → 304 | 379 → 352 |
| 10 | 212 → 174 | 303 → 262 | 310 → 274 | 333 → 304 |
| 1361531576 | 230 → 213 | 323 → 294 | 330 → 313 | 346 → 327 |

Phase counts include temporary placements and connections, including those later removed. Standing counts cover the world at the milestone and include paused machines, but exclude natural and encounter nodes. Each Road pair contributes two nodes. Standing Production nodes dropped from 181 to 170 on each seed. Standing Logistics nodes fell from 185 to 133, 128 to 103, and 148 to 142, respectively.

| Seed | Wood | Copper | Iron | Stone | Water | Mythril | Simple Cores saved on Map Points |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 680312004 | −752 | −1,402 | −239 | −27 | −244 | 0 | 165 |
| 10 | −126 | −163 | −48 | 0 | 0 | 0 | 30 |
| 1361531576 | −53 | −130 | +59 | 0 | 0 | +1 | 5 |

Material changes are new minus previous gross extraction during Hydro → Shiny. These totals include stock in buffers and other consumers. The paid one-time research bills matched within each pair.

For the next endgame route, plan solid intermediate factories near their sources and ship to assembly nearer Home for the first six Core tiers, with Water-dependent processing at Lakes. Use surveyed peripheral maps to manufacture corner supplies and deliver them along Roads. This playtest exercised that layout only through Shiny.

## Evidence and reproduction

| Seed | Previous route audit | New route audit |
| --- | --- | --- |
| 680312004 | [Audit](680312004-control.json) | [Audit](680312004-measured.json) |
| 10 | [Audit](10-control.json) | [Audit](10-measured.json) |
| 1361531576 | [Audit](1361531576-control.json) | [Audit](1361531576-measured.json) |

```powershell
node --disable-warning=ExperimentalWarning --experimental-transform-types scripts/final-core-engine-run.mjs --blind --protect-lakes --balance-pilot --shiny-survey=shiny-with-imports --seed=680312004 --audit=shiny-audit.json --checkpoint=shiny-checkpoint.json
```

Use `--shiny-survey=bots-during-survey` to reproduce the control. Add `--shiny-local-copper-budget=0` to the new route to reproduce the import check.
