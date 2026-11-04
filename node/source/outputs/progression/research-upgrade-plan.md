# Implemented linear machine research through Complex

The implemented progression for Extractor, Kiln, Smelter, Refiner, Assembler, Research Center, Hydro Processor, Advanced Assembler and Separation Furnace efficiency research uses the same six ranks. Cost per required core rises linearly by 10 each rank, and each rank adds the next core type through Complex, the sixth core. These settings replace the earlier uneven rank 1 and rank 2 prices.

| Rank | Highest required core | Amount of each required core | Total physical cores | Cycle time as a share of base |
| --- | --- | --- | --- | --- |
| 1 | Simple | 10 | 10 | 90% |
| 2 | Basic | 20 | 40 | 80% |
| 3 | Automata | 30 | 90 | 70% |
| 4 | Hydro | 40 | 160 | 60% |
| 5 | Shiny | 50 | 250 | 50% |
| 6 | Complex | 60 | 360 | 40% |

Each completed rank reduces cycle time by 10 percentage points of the original base time. The highest completed rank replaces the earlier modifier; reductions do not multiply together. Ingredient amounts and output yields stay unchanged. All nine lines remain optional for unlocking new core tiers.

| Research line | Projects | Rank 1 access requirement |
| --- | --- | --- |
| Extractor | Extractor 1, Extractor 2, Extractor 3, Extractor 4, Extractor 5, Extractor 6 | Starting Extractor access |
| Kiln | Kiln 1, Kiln 2, Kiln 3, Kiln 4, Kiln 5, Kiln 6 | Kiln unlocked |
| Smelter | Smelter 1, Smelter 2, Smelter 3, Smelter 4, Smelter 5, Smelter 6 | Smelter unlocked |
| Refiner | Refiner 1, Refiner 2, Refiner 3, Refiner 4, Refiner 5, Refiner 6 | Refiner unlocked |
| Assembler | Assembler 1, Assembler 2, Assembler 3, Assembler 4, Assembler 5, Assembler 6 | Assembler unlocked |
| Research Center | Research Center 1, Research Center 2, Research Center 3, Research Center 4, Research Center 5, Research Center 6 | Research Center unlocked |
| Hydro Processor | Hydro Processor 1, Hydro Processor 2, Hydro Processor 3, Hydro Processor 4, Hydro Processor 5, Hydro Processor 6 | Water Tools discovery |
| Advanced Assembler | Advanced Assembler 1, Advanced Assembler 2, Advanced Assembler 3, Advanced Assembler 4, Advanced Assembler 5, Advanced Assembler 6 | Advanced Fabrication |
| Separation Furnace | Separation Furnace 1, Separation Furnace 2, Separation Furnace 3, Separation Furnace 4, Separation Furnace 5, Separation Furnace 6 | Mythril Refining discovery |

Ranks 2–6 require the preceding rank in the same research line. Rank 3 also requires Automata Core research; rank 4 requires Hydraulic Assembly; rank 5 requires Ore Separation; rank 6 requires Precision Control. Rank 2 needs Basic Core supply but adds no separate Basic Core research. Machine access and core access remain independent of these optional efficiency upgrades.

For example, Extractor 4 costs 40 Simple + 40 Basic + 40 Automata + 40 Hydro Cores and reduces the five-second base cycle to three seconds. Extractor 6 costs 60 of each of all six core types and reduces that base cycle to two seconds. Research Center 6 uses a 0.4-second cycle from its one-second base; sustained operation needs 2.5 complete required core sets per second.

All 54 projects are implemented. Existing saved rank 1 and rank 2 completions retain their effects; later ranks can be researched in order.


The dedicated Automata Core Assembler is retired. Automata Cores use the regular Assembler recipe. Saved dedicated machines and factory templates convert to regular Assemblers while preserving their items, progress and connections. Mineral Recovery 1 applies its additional 10% time reduction to recovery recipes after the machine family modifier, including Separation Furnace upgrades.
