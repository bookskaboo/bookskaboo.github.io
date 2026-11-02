# Factorinode Current and Planned Research

Updated November 1, 2026. Factorinode currently has six core types and 105 research entries: 13 free milestones and discoveries, 86 fixed paid projects, and 6 repeatable projects. Nine machine research lines now have six ranks through Command; tier 7 research remains planned. This catalog includes every live entry, its requirements and its effect, followed by the remaining planned research.

# Research rules

A price of **2 each through Hydro** means 2 Simple + 2 Basic + 2 Automata + 2 Hydro Cores. Every successful Research Center cycle consumes one of every required core together; the slowest missing core stream stops progress. The single Research Center is anchored at Home. Its base cycle is one second; its six upgrades use 90%, 80%, 70%, 60%, 50% and 40% of base time.

Use **Research tree** at the top right of the research header to browse prerequisites from top to bottom. Search keeps matching projects and their prerequisite paths visible. Click a tree node to open its details; click the same research card again to collapse the details. Tree cards show names only, with colors indicating research status.

Core production follows Simple → Basic → Automata → Hydro → Shiny → Command → future endgame core. Cores never consume other cores as ingredients. Research opening a new core uses the preceding available core tiers. Listed prerequisites are explicit research requirements; production also needs the appropriate machines, recipes, discoveries and material supply.

# Core progression

| Core tier | Access | Status |
| --- | --- | --- |
| 1 Simple | Refiner milestone grants the recipe | Implemented |
| 2 Basic | Assembler production; no separate Basic Core research | Implemented |
| 3 Automata | Automata Core research | Implemented |
| 4 Hydro | Hydraulic Assembly after Hydrochemistry; Water Tools for processing | Implemented |
| 5 Shiny | Ore Separation; Mythril Refining discovery for processing | Implemented |
| 6 Command | Precision Control; Advanced Fabrication for assembly | Implemented; Command remains the working design name |
| 7 Endgame core | Endgame Theory is the current entry checkpoint | Core name, recipe and full progression undecided |

# Production chain revision

The revised Shiny chain smelts Mythril Plate, dry-alloys 1 Plate + 4 Iron Plates + 1 Charcoal into 2 Refined Mythril + 2 Slag in 12 seconds, then makes Mesh from 2 Refined Mythril + 1 Copper Wire + 2 Coolant in 18 seconds. Final Shiny assembly remains 24 seconds.

Precision Control also unlocks two regular Assembler recipes: 4 Copper Gears + 1 Mythril Plate produce 4 Mythril Gears, and 4 Iron Wires + 1 Mythril Plate produce 4 Mythril Wires, each in 12 seconds. Existing Refiner alternatives remain. Precision Controllers consume Mythril Gear instead of Refined Mythril; Logic Substrates consume Mythril Wire; Advanced Actuators consume 1 Hydraulic Actuator + 1 Mesh + 3 Coolant. Each Command component takes 30 seconds, and final Command assembly takes 36 seconds. Research prices and optional efficiency upgrades are unchanged. See the [progression design](progression-and-scaling.md) for complete recipes and supply estimates.

# Map exploration and Map Node research

Map Node research keeps the first half of the world affordable, then charges progressively more for filling out the remaining maps. The six-core price schedule and safeguards below are implemented.

## Half map baseline

The world contains 121 maps. Round half upward to **61 unlocked maps including Home**. Home is available initially and Exploration grants the first Map Point, so reaching this baseline requires **59 Map Node research completions**. The remaining 60 maps bring the total to 121, requiring 119 Map Node completions overall.

This is a budget for unlocked territory. Which maps become available depends on the player’s connected expansion route; productive-map coverage and reaching particular corners are separate goals.

## Prices for the first 59 completions

Each price applies equally to every required core from Simple through the named core. The first nine purchases stay at 5 Simple, making exploration the first sustained reason to expand copper smelting and Simple Core production while Assembler remains inexpensive. Each later phase introduces its new core at the previous phase's final price plus 1, then rises by 1 every two purchases. The first phase covers nine repeat purchases because Exploration already supplies a point; each later phase covers ten purchases.

| Map Node completions | Highest scheduled core | Cost of each required core | Total maps affordable including Home and Exploration |
| --- | --- | --- | --- |
| 1–9 | Simple | 5 | 11 |
| 10–19 | Basic | 6–10, two purchases per price | 21 |
| 20–29 | Automata | 11–15, two purchases per price | 31 |
| 30–39 | Hydro | 16–20, two purchases per price | 41 |
| 40–49 | Shiny | 21–25, two purchases per price | 51 |
| 50–59 | Command | 26–30, two purchases per price | 61 |

Exploration costs 1 Simple + 1 Basic Core, unlocks the world map and awards the first Map Point. Map Node is repeatable after Exploration and starts at 5 Simple Cores. Every completion awards one Map Point, used to activate a locked map directly north, south, east or west of an unlocked map. Enter the activated map to discover its resources. Area Expansion instead enlarges the working field inside maps. With each core available by its scheduled phase, research for the half-world baseline costs **4,147 physical cores in 946 synchronized sets**, including Exploration. Map Points remain freely assignable to adjacent locked maps.

## Scaling beyond half the map

For the remaining **60 maps**, increase the price by **1 of each required core every five purchases**, starting at 31 each and ending at 42 each.

| Total maps affordable | Cost of each required core for the indicated extra maps |
| --- | --- |
| 62–66 | 31 |
| 67–71 | 32 |
| 72–76 | 33 |
| 77–81 | 34 |
| Continue in groups of five | Add 1 per group |
| 117–121 | 42 |

For extra map number n after the 61-map baseline, the price is **30 + ceil(n / 5)** of each required core, for n = 1 through 60. With all scheduled cores available, full-world map research costs **17,287 physical cores in 3,136 synchronized sets**, including Exploration. This is 52 minutes 16 seconds of uninterrupted base-speed lab work, or about 20 minutes 54 seconds with Research Center 6 throughout. Production, transport, construction, combat and other research add elapsed time; the upgraded figure is a lower bound rather than a progression forecast.

## Preventing exploration dead ends

Require a newly scheduled core only after its recipe has been unlocked. Until then, keep Map Node payable with all available earlier core types at the same per-core price. For example, a scheduled Shiny-phase purchase costs 25 each through Hydro while Shiny remains locked; once Ore Separation unlocks Shiny, subsequent purchases add Shiny. This lets the player scout for the water or Mythril needed for the next core without requiring that core first.

Use the lesser of the scheduled core tier and highest unlocked core tier when calculating a new purchase. Hold a selected project’s quoted requirements steady until it completes or the player changes projects, so unlocking a core during research cannot change the active bill. Preserve earned Map Points and completion counts in existing saves. After all maps are unlocked or remaining maps are covered by banked points, stop offering further Map Node purchases.

## Verification and pacing

Automated checks cover the 59-completion half-world budget, all 119 full-world purchases and connected map activation, every price boundary, core-access fallback, fixed active quotes, saved progress and the fully explored map limit. Sustainable production, resource scouting, combat and real player waiting still need playthrough measurements. The current 37–60 and 109 productive-map endgame targets remain separate from these access budgets.

# Implemented milestones and discoveries

These entries consume no cores. Discoveries require visiting the relevant map; Precision Control also grants Waste Handling.

| Research | Completion condition | Unlock or benefit |
| --- | --- | --- |
| Water Tools | Encounter a Lake in a visited map | Lake Intake, Hydro Processor, Coolant and local fluid links; visit a map containing a Lake. |
| Mythril Refining | Encounter a Mythril Deposit in a visited map | Separation Furnace, Refined Mythril and Slag Hopper; also grants Mineral Recovery and Waste Handling. |
| Mineral Recovery | Discover Mythril processing | Slag washing, Recovered Brick and Recovered Iron; Slag washing requires local Water. No core cost. |
| Waste Handling | Discover Mythril processing or encounter a Derelict Sorting Station | Waste Sorter, Waste Hopper and Waste Link; also granted by Precision Control as a fallback. |
| Joint | Connect two nodes | Unlocks the Joint node |
| Kiln | Extract 1 Wood with an Extractor | Unlocks the Kiln node |
| Smelter | Extract 1 metal with an Extractor | Unlocks the Smelter node |
| Refiner | Produce at least 1 metal Plate | Unlocks the Refiner, its Simple Core recipe, and the Research Center |
| Research Center | Unlock the Refiner | Unlocks the Research Center node |
| Splitter | Build an Assembler | Unlocks the Splitter node |
| Merger | Produce a Basic Core | Unlocks the Merger node |
| Suppression Bot | Encounter a Monster Camp | Unlocks the Simple Robot Frame, Simple Robot Gun, and Small Suppression Bot recipes |
| Basic Electricity | Produce at least 1 Motor | Unlocks the Charcoal Generator and Power Splitter nodes |

# Implemented access and expansion research

| Research | Core cost | Research prerequisites | Unlock or benefit |
| --- | --- | --- | --- |
| Advanced Fabrication | 2 each through Basic | Assembler | Unlocks the Advanced Assembler node. |
| Assembler | 1 each through Simple | None specified | Unlocks the Assembler node |
| Road | 2 each through Basic | None specified | Unlocks the Road node |
| Automata Core | 2 each through Basic | Exploration | Unlocks the Automata Core recipe in the Assembler |
| Area Expansion 1 | 10 each through Automata | None specified | Increases every map node field by 25% in both dimensions |
| Tree Planter | 10 each through Automata | None specified | Unlocks the Tree Planter node |
| Mining Drill | 10 each through Automata | None specified | Unlocks the Mining Drill node |

# Implemented advanced progression

Endgame Theory is a research checkpoint; completing it does not provide a playable tier 7 chain or victory condition.

| Research | Core cost | Research prerequisites | Unlock or benefit |
| --- | --- | --- | --- |
| Hydrochemistry | 1 each through Automata | Automata Core + Basic Electricity | Copper–Carbon Dispersion recipe. |
| Hydraulic Assembly | 2 each through Automata | Hydrochemistry | Hydraulic Actuator, Ceramic Electrode and Hydro Core recipes. |
| Fluid Routing | 2 each through Hydro | Hydraulic Assembly | Fluid Road and Fluid Storage for inter-map fluid logistics. |
| Sealed Robotics | 2 each through Hydro | Hydraulic Assembly + Suppression Bot | Sealed Frame, Cooled Gun and Medium Suppression Bot recipes. |
| Ore Separation | 2 each through Hydro | Fluid Routing | Mythril Mesh and Shiny Core recipes. |
| Heavy Robotics | 2 each through Shiny | Sealed Robotics + Ore Separation | Mythril Frame, Focused Gun and Heavy Suppression Bot recipes. |
| Precision Control | 2 each through Shiny | Ore Separation + Mineral Recovery | Logic Substrate, Precision Controller, Advanced Actuator and Command Core; advanced recovery recipes and Waste Handling fallback. |
| Autonomous Logistics | 2 each through Command | Precision Control | Storage and Inventory use one global transfer pool. Inventory initially outputs through Filters. Pool capacity is currently 1,000 per item. |
| Command Robotics | 2 each through Command | Precision Control + Heavy Robotics | Servo Frame, Pulse Cannon and Command Suppression Bot recipes. |
| Endgame Theory | 2 each through Command | Autonomous Logistics + Command Robotics + Mineral Regeneration + Precision Control | Implemented research checkpoint marking access to future tier 7. The tier 7 core, research tree and final objective are not implemented. |
| Power Distribution | 2 each through Hydro | Basic Electricity + Hydraulic Assembly | Dedicated Power Conduits carry 25 existing power units per second, without single-unit cable particles or a change in generation yield. |
| Resource Golem Survey | 3 each through Hydro | Sealed Robotics | Reveals four mineral Golems in separate clear tier 6 sectors. Each requires 10,000 AP once, then becomes an infinite mineral reserve with four star connections for Extractors. |
| Mineral Regeneration | 2 each through Shiny | Mineral Recovery + Ore Separation | Ordinary non-wood deposits recover 1 unit every 30 seconds up to capacity. Depleted deposits remain after this unlock; existing Deep Holes are not restored. |

# Implemented efficiency and logistics research

Cycle upgrades replace the earlier speed factor unless the effect explicitly says otherwise. Their costs can use earlier core tiers even when the prerequisites are later in progression. The nine machine lines extend through Command with six ranks each, as detailed below.

| Research | Core cost | Research prerequisites | Unlock or benefit |
| --- | --- | --- | --- |
| Pressure Systems | 45 each through Shiny | Ore Separation | Lake Intake output increases from 4 to 8 Water/s. |
| Mineral Regeneration 2 | 90 each through Shiny | Mineral Regeneration + Precision Control | Ordinary mineral recovery improves to 1 unit every 15 seconds and opens repeatable rate research. |
| High Pressure Intakes | 100 each through Shiny | Pressure Systems + Precision Control | Lake Intake output increases to 16 Water/s. |
| Connector Mirroring | 100 each through Hydro | Hydraulic Assembly | Right-click a production node to mirror its input/output banks left-to-right. Cables, buffers and port identities are retained. Left-click recipe selection and the connector-order button remain available. |
| Factory Templates | 30 each through Automata | Hydraulic Assembly | Paid core research for saved layouts and batch placement previews; existing duplicate controls remain available. |
| Tree Planter 1 | 30 each through Automata | Tree Planter + Power Distribution | Tree Planter cycles use 90% of base time; each growth unit still consumes five power units. |
| Mineral Recovery 1 | 55 each through Hydro | Mineral Recovery + Hydraulic Assembly | Slag washing and recovered Brick/Iron recipes take 10% less time after any applicable family modifier; no extra material recovery. |
| Warehouse Logistics | 55 each through Hydro | Ore Separation + Fluid Routing | Dedicated one-item Warehouse holds 250 items with a filtered outlet; Inventory retrieval stays a later unlock. |
| Road Channels 1 | 2 each through Hydro | Road + Ore Separation | Allows two one-way Road channels per direction. Each carries one item every five seconds; fluids cannot use roads. |
| Area Expansion 2 | 150 each through Shiny | Area Expansion 1 + Precision Control | Field dimensions use a 1.5 multiplier over tier-scaled base dimensions, replacing 1.25. |
| Road Channels 2 | 130 each through Shiny | Road Channels 1 + Precision Control | Allows four one-way Road channels per direction. Each carries one item every five seconds; fluids cannot use roads. |
| Extractor 1 | 10 each through Simple | None specified | All Extractor cycles use 90% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Extractor 2 | 20 each through Basic | Extractor 1 | All Extractor cycles use 80% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Extractor 3 | 30 each through Automata | Extractor 2 + Automata Core | All Extractor cycles use 70% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Extractor 4 | 40 each through Hydro | Extractor 3 + Hydraulic Assembly | All Extractor cycles use 60% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Extractor 5 | 50 each through Shiny | Extractor 4 + Ore Separation | All Extractor cycles use 50% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Extractor 6 | 60 each through Command | Extractor 5 + Precision Control | All Extractor cycles use 40% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Kiln 1 | 10 each through Simple | Kiln | All Kiln cycles use 90% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Kiln 2 | 20 each through Basic | Kiln 1 | All Kiln cycles use 80% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Kiln 3 | 30 each through Automata | Kiln 2 + Automata Core | All Kiln cycles use 70% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Kiln 4 | 40 each through Hydro | Kiln 3 + Hydraulic Assembly | All Kiln cycles use 60% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Kiln 5 | 50 each through Shiny | Kiln 4 + Ore Separation | All Kiln cycles use 50% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Kiln 6 | 60 each through Command | Kiln 5 + Precision Control | All Kiln cycles use 40% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Smelter 1 | 10 each through Simple | Smelter | All Smelter cycles use 90% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Smelter 2 | 20 each through Basic | Smelter 1 | All Smelter cycles use 80% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Smelter 3 | 30 each through Automata | Smelter 2 + Automata Core | All Smelter cycles use 70% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Smelter 4 | 40 each through Hydro | Smelter 3 + Hydraulic Assembly | All Smelter cycles use 60% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Smelter 5 | 50 each through Shiny | Smelter 4 + Ore Separation | All Smelter cycles use 50% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Smelter 6 | 60 each through Command | Smelter 5 + Precision Control | All Smelter cycles use 40% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Refiner 1 | 10 each through Simple | Refiner | All Refiner cycles use 90% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Refiner 2 | 20 each through Basic | Refiner 1 | All Refiner cycles use 80% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Refiner 3 | 30 each through Automata | Refiner 2 + Automata Core | All Refiner cycles use 70% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Refiner 4 | 40 each through Hydro | Refiner 3 + Hydraulic Assembly | All Refiner cycles use 60% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Refiner 5 | 50 each through Shiny | Refiner 4 + Ore Separation | All Refiner cycles use 50% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Refiner 6 | 60 each through Command | Refiner 5 + Precision Control | All Refiner cycles use 40% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Assembler 1 | 10 each through Simple | Assembler | All Assembler cycles use 90% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Assembler 2 | 20 each through Basic | Assembler 1 | All Assembler cycles use 80% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Assembler 3 | 30 each through Automata | Assembler 2 + Automata Core | All Assembler cycles use 70% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Assembler 4 | 40 each through Hydro | Assembler 3 + Hydraulic Assembly | All Assembler cycles use 60% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Assembler 5 | 50 each through Shiny | Assembler 4 + Ore Separation | All Assembler cycles use 50% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Assembler 6 | 60 each through Command | Assembler 5 + Precision Control | All Assembler cycles use 40% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Research Center 1 | 10 each through Simple | Research Center | All Research Center cycles use 90% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Research Center 2 | 20 each through Basic | Research Center 1 | All Research Center cycles use 80% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Research Center 3 | 30 each through Automata | Research Center 2 + Automata Core | All Research Center cycles use 70% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Research Center 4 | 40 each through Hydro | Research Center 3 + Hydraulic Assembly | All Research Center cycles use 60% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Research Center 5 | 50 each through Shiny | Research Center 4 + Ore Separation | All Research Center cycles use 50% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Research Center 6 | 60 each through Command | Research Center 5 + Precision Control | All Research Center cycles use 40% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Hydro Processor 1 | 10 each through Simple | Water Tools | All Hydro Processor cycles use 90% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Hydro Processor 2 | 20 each through Basic | Hydro Processor 1 | All Hydro Processor cycles use 80% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Hydro Processor 3 | 30 each through Automata | Hydro Processor 2 + Automata Core | All Hydro Processor cycles use 70% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Hydro Processor 4 | 40 each through Hydro | Hydro Processor 3 + Hydraulic Assembly | All Hydro Processor cycles use 60% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Hydro Processor 5 | 50 each through Shiny | Hydro Processor 4 + Ore Separation | All Hydro Processor cycles use 50% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Hydro Processor 6 | 60 each through Command | Hydro Processor 5 + Precision Control | All Hydro Processor cycles use 40% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Advanced Assembler 1 | 10 each through Simple | Advanced Fabrication | All Advanced Assembler cycles use 90% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Advanced Assembler 2 | 20 each through Basic | Advanced Assembler 1 | All Advanced Assembler cycles use 80% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Advanced Assembler 3 | 30 each through Automata | Advanced Assembler 2 + Automata Core | All Advanced Assembler cycles use 70% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Advanced Assembler 4 | 40 each through Hydro | Advanced Assembler 3 + Hydraulic Assembly | All Advanced Assembler cycles use 60% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Advanced Assembler 5 | 50 each through Shiny | Advanced Assembler 4 + Ore Separation | All Advanced Assembler cycles use 50% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Advanced Assembler 6 | 60 each through Command | Advanced Assembler 5 + Precision Control | All Advanced Assembler cycles use 40% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Separation Furnace 1 | 10 each through Simple | Mythril Refining | All Separation Furnace cycles use 90% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Separation Furnace 2 | 20 each through Basic | Separation Furnace 1 | All Separation Furnace cycles use 80% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Separation Furnace 3 | 30 each through Automata | Separation Furnace 2 + Automata Core | All Separation Furnace cycles use 70% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Separation Furnace 4 | 40 each through Hydro | Separation Furnace 3 + Hydraulic Assembly | All Separation Furnace cycles use 60% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Separation Furnace 5 | 50 each through Shiny | Separation Furnace 4 + Ore Separation | All Separation Furnace cycles use 50% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Separation Furnace 6 | 60 each through Command | Separation Furnace 5 + Precision Control | All Separation Furnace cycles use 40% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |

# Implemented repeatable research

| Research | First rank cost | Research prerequisites | Benefit per completion |
| --- | --- | --- | --- |
| Mineral Regeneration Rate | 40 each through Command | Mineral Regeneration 2 | Each rank adds 20% of the post-Regeneration-2 base regeneration rate; no maximum rank. |
| Storage Placement Capacity | 50 each through Command | Autonomous Logistics | Each rank adds one Storage placement to the global cap; no maximum rank. |
| Inventory Placement Capacity | 50 each through Command | Autonomous Logistics | Each rank adds one Inventory placement to the global cap; no maximum rank. |
| Storage Connection Capacity | 40 each through Command | Autonomous Logistics | Each rank adds one permitted connection per Storage; no maximum rank. |
| Inventory Connection Capacity | 40 each through Command | Autonomous Logistics | Each rank adds one permitted output connection per Inventory; Inventory still initially connects only to Filters. |

For the five repeatables other than Map Node, rank r costs **ceil(base × 1.5^(r−1)) of each required core**. Base 40 gives 40, 60, 90, 135, 203 each for ranks 1–5; base 50 gives 50, 75, 113, 169, 254. These have no maximum rank.

# Implemented linear machine research through Command

The implemented progression for Extractor, Kiln, Smelter, Refiner, Assembler, Research Center, Hydro Processor, Advanced Assembler and Separation Furnace efficiency research uses the same six ranks. Cost per required core rises linearly by 10 each rank, and each rank adds the next core type through Command, the sixth core. These settings replace the earlier uneven rank 1 and rank 2 prices.

| Rank | Highest required core | Amount of each required core | Total physical cores | Cycle time as a share of base |
| --- | --- | --- | --- | --- |
| 1 | Simple | 10 | 10 | 90% |
| 2 | Basic | 20 | 40 | 80% |
| 3 | Automata | 30 | 90 | 70% |
| 4 | Hydro | 40 | 160 | 60% |
| 5 | Shiny | 50 | 250 | 50% |
| 6 | Command | 60 | 360 | 40% |

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

# Planned tier 7 research

The following entries are retained from the design proposal and are absent from the live research catalog. Prices are sample design values.

| Research or design item | Status and proposed cost | Intended benefit and unresolved decisions |
| --- | --- | --- |
| Endgame core and research chain | Planned; name, recipe, costs and dependencies undecided | Build on Endgame Theory. Define regional inputs and sustainable map output so endgame factory coverage follows from production requirements. |
| Global Pool Item Capacity | Planned repeatable; sample first rank 50 each through tier 7, growing by 1.5 per rank with rounding up | Increase per-item capacity of the shared Storage/Inventory pool indefinitely. Capacity gain per rank and whether upgrades affect all or selected items remain open. Live starting capacity is 1,000 per item. |
| Automatic Inventory Selection | Candidate; sample 150 each through tier 7 | Permit direct Inventory connections to infer an exact configured destination input. Ambiguous ports still require a Filter. Research versus a world or endgame condition remains undecided. |
| Monster Node Assault | Candidate; sample 30 each through tier 7 | Prepare access or targeting for world-map tier 10 Monster Nodes. Combat deliveries must defeat the targets; research alone does not win. Target count, strength, victory conditions and exact access gate remain open. |

# Remaining progression decisions

- Define the tier 7 core, regional specialization, full research tree and final combat objective.
- Set Global Pool Item Capacity gains and item scope; decide how Automatic Inventory Selection unlocks.
- Decide whether special world-tier-10 access research or research-bundled survey rewards are needed. These are options rather than additional approved catalog entries.
- Calibrate costs and geography with playthroughs. Saved targets are tier 6 completion including tier 7 access within three hours for perfect play, 20–30 hours to endgame for efficient play, 37–60 productive maps at minimum throughput and about 109 at maximum. These remain design targets.
- Keep the separate higher-cost one-hour speedrun candidate outside the live prices unless explicitly adopted.

# Changes since the earlier proposal

Hydro, Shiny and Command chains, machine upgrades, logistics upgrades, regeneration and the five late repeatables are now implemented. Advanced Fabrication is paid research costing 2 Simple + 2 Basic Cores after Assembler; an Abandoned Fabricator encounter does not grant it. Resource Golem Survey now reveals four mineral Golems in separate tier 6 sectors; each takes 10,000 AP once and becomes an infinite reserve with four Extractor sockets. Road channel upgrades are live; the current catalog describes each channel as one item per five seconds, while the earlier proposal described whole-chest batches. Their channel counts are two and then four per direction.

# Sources

Live snapshot: `src/content/research.ts`, `src/content/progression.ts`, `src/content/recipes.ts`, `src/simulation/progression.ts` and `src/simulation/engine.ts` in the Node Factory v2 project. Live implementation takes precedence over older proposal wording.

Planned research and open decisions: [Research Core Progression and Bot Upgrade Proposal](https://chatgpt.com/space/page_3f63cbe142508191a73e41bc10b7f530). Progression targets: `README.md`.
