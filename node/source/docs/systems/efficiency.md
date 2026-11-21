# Efficiency

[System index](README.md) · [Rank and multiplier catalog](catalogs/efficiency.md)

Machine efficiency belongs to node families. The highest completed rank replaces the family's earlier multiplier. It shortens processing time without reducing recipe ingredients or stacking with the earlier ranks.

## Rank model

Ranks use the seven Core tiers. Families begin at different tiers: Research Center at Simple; Extractor, Kiln and Smelter at Basic; Refiner, Assembler, Fabricator and Bot Plant at Automata; Hydro Plant, Pump, Tree Planter and Recycler at Hydro; Synthesizer at Shiny. Each family continues through Final.

For a family beginning at tier `start`, there are `8 - start` ranks. The cycle multiplier for zero-based rank index `i` is `(100 - 5 × round(13 × (i + 1) / rankCount)) / 100`. Every family ends at 0.35. IDs retain numeric suffixes such as `smelter2` so saved completions keep their identity.

The Research Center's seven multipliers are 0.90, 0.80, 0.70, 0.65, 0.55, 0.45 and 0.35, producing intervals of 4.5, 4, 3.5, 3.25, 2.75, 2.25 and 1.75 seconds. Processing occurs on simulation updates, so observed completion can include tick rounding.

## Throughput and exceptions

Ideal throughput scales by `1 / multiplier` only while fully supplied and unblocked. Additional machine capacity can expose an upstream shortage, output congestion or Road limit. Pump Water draw uses `round(4 / multiplier)` per second. New-world Lake Intake limits also rise from two to three with fluidLink5 and four with fluidLink6 (or its later rank); legacy Lakes retain two. Tree Planter upgrades speed credit emission, and the designated capacity rank also raises its output buffer.

Recipe alternatives use the machine's multiplier. Recovery does not receive a separate stacking efficiency factor. Vehicle upgrades, Road payload research, storage limits, mineral regeneration and area expansion have separate rules.

## Implementation and checks

[Family definitions and formula](../../src/content/machineEfficiency.ts), [multiplier lookup](../../src/content/efficiency.ts), [generated research](../../src/content/research.ts), [save migration](../../src/simulation/machineEfficiencyMigration.ts).

Coverage: [family definitions](../../src/content/machineEfficiency.test.ts), [simulation](../../src/simulation/engine.efficiency.test.ts), [migration](../../src/simulation/machineEfficiencyMigration.test.ts). Update the generated [efficiency](catalogs/efficiency.md) and [research](catalogs/research.md) catalogs after changing ranks.

The isolated [Upgrades prototype](../../previews/status-page/README.md) lists only the lowest available or active rank per machine family in Node upgrades. It chooses that rank before applying search, hides future/completed ranks and advances after completion when the next rank becomes eligible. Research Center remains a separate Research family; Extractors and Lake Intakes retain Production classification. The main Research screen and saved rank IDs are unchanged.

Queued research uses these same rank-adjusted Center intervals. A completed queued Research Center rank affects the following project's cycles. Research pause freezes partial research cycle time and suppresses active-cycle status; it does not change the stored rank, multiplier or other machine processing.
