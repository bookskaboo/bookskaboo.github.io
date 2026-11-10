# Factorinode Current and Planned Research

**November 5 update (NODE-0321):** Endgame Theory is retired. Victory is A Remarkably Indirect Conclusion, manually selected at the Research Center after first Final Core production, costing one each of Simple, Basic, Automata, Hydro, Shiny, Complex and Final Cores. The dated baseline below predates current endgame implementation; live prices are authoritative in src/content/research.ts and src/content/endgame.ts.

**November 8 update:** Standard paid research now costs at least five of each required Core. This raises Assembler to five Simple Cores and Victory to five of all seven types. The Research Center credits each set only after a complete cycle, including when its inputs are already stocked.

Updated November 2, 2026. Factorinode currently has six core types and 103 research entries: 12 free milestones and discoveries, 85 fixed paid projects, and 6 repeatable projects. Nine machine research lines now have six ranks through Complex; tier 7 research remains planned. Power is removed pending a useful integration design: Basic Electricity and Power Distribution are no longer live projects. Tree Planters operate without Power. This catalog includes every live entry, its requirements and its effect, followed by the remaining planned research.

# Research rules

A price of **5 each through Hydro** means 5 Simple + 5 Basic + 5 Automata + 5 Hydro Cores. At the end of each cycle, the Research Center consumes and credits one of every Core it still needs together. A missing Core stops the cycle. The single Research Center is anchored at Home. Its base cycle is five seconds for new and loaded nodes; six upgrades use 90%, 80%, 70%, 60%, 50% and 40% of base time, giving 4.5, 4, 3.5, 3, 2.5 and 2 seconds per synchronized set. The highest completed rank replaces earlier effects.

Use **Research tree** at the top right of the research header to browse prerequisites from top to bottom. Search keeps matching projects and their prerequisite paths visible. Click a tree node to open its details; click the same research card again to collapse the details. Tree cards show names only, with colors indicating research status.

Core production follows Simple → Basic → Automata → Hydro → Shiny → Complex → Final. The first six Cores use intermediate parts; the Final Core uses the two halves assembled from corner pieces. Research opening a new core uses the preceding available core tiers. Listed prerequisites are explicit research requirements; production also needs the appropriate machines, recipes, discoveries and material supply.

# Core progression

| Core tier | Access | Status |
| --- | --- | --- |
| 1 Simple | Refiner milestone grants the recipe | Implemented |
| 2 Basic | Assembler production; no separate Basic Core research | Implemented |
| 3 Automata | Automata Core research | Implemented |
| 4 Hydro | Hydraulic Assembly after Hydrochemistry; Water Tools for processing | Implemented |
| 5 Shiny | Ore Separation; Mythril Refining discovery for processing | Implemented |
| 6 Complex | Precision Control; Advanced Fabrication for assembly | Implemented; Complex Core is the canonical name |
| 7 Final Core | Acquire corner components and assemble both seeded halves | Implemented; research victory with all seven Core types |

## Obligatory hand holding in Research

Obligatory hand holding has one card at the right of the Research panel. Hold the left mouse button on it to read the clue, then release to hide it. The hint reacts to completed research, first production, visited sectors, and available corner pieces. Selecting a research card shows its details between the active project and the hint, or below them on narrow screens. For an available project, choose **Start research** beside its title. Recipes, research details, and encounter panels give the exact requirements. The catalog includes paid research and automatic unlocks. Blue cards are within reach. Grey cards show what still needs to be unlocked.

| Stage | Suggested route |
| --- | --- |
| Open the factory | Extract Wood and ore, turn Wood into Charcoal, and smelt a Plate to unlock the Refiner and Research Center. Make Simple Cores, then install the lab at Home. |
| Open the map | Research Assembler and make Basic Cores. Complete Exploration for the first Map Point and Road to ship between sectors. Repeat Extra Map Point as needed. |
| Build Automata and Hydro | Research Automata Core and Advanced Fabrication. Scout for a large puddle; visiting a Lake grants Water Tools. Follow Hydrochemistry and Hydraulic Assembly to Hydro Cores, then Fluid Routing. |
| Get Mythril | Scout for an occupied sector to unlock the Bot Plant, then research Sealed Robotics. Find a Dwarven settlement and start Mythril Tribute. A starter Camp takes two 3 AP Suppression Bots per minute. An outpost can supply their parts while Hydro production continues. |
| Grow the factory | Research Ore Separation and make Shiny Cores, then research Precision Control and make Complex Cores. Keep Controller waste. Optional Golem clues point toward the outer sectors; Resource Golem Survey and Bots let a player turn a Golem into a permanent mineral reserve. |
| Find the four pieces | Open routes to all four corners of the Node Map. Their locations vary by world. Once visited, the guide can name the corner and its job: Bots for the Dragon, parts for the Foundry, local Tree Planter growth for the Grove, and waste for Reclamation. |
| Win and keep playing | Assemble the world's paired pieces into Yin and Yang, then assemble the Final Core. Start A Remarkably Indirect Conclusion and supply one of each of the seven Cores. After victory, the final card is “You’ve got this” with the hint “Maybe a speed run next?” |

# Production chain revision

The revised Shiny chain smelts Mythril Plate, dry-alloys 1 Plate + 4 Iron Plates + 1 Charcoal into 2 Pure Mythril + 2 Slag in 12 seconds, then makes Mesh from 2 Pure Mythril + 1 Copper Wire + 2 Coolant in 18 seconds. Final Shiny assembly remains 24 seconds.

Precision Control also unlocks two regular Assembler recipes: 4 Copper Gears + 1 Mythril Plate produce 4 Mythril Gears, and 4 Iron Wires + 1 Mythril Plate produce 4 Mythril Wires, each in 12 seconds. Existing Refiner alternatives remain. Controllers consume Mythril Gear instead of Pure Mythril; Logic Wafers consume Mythril Wire; Servo Pistons consume 1 Hydro Piston + 1 Mesh + 3 Coolant. Each Complex component takes 30 seconds, and final Complex assembly takes 36 seconds. Research prices and optional efficiency upgrades are unchanged. See the [progression design](progression-and-scaling.md) for complete recipes and supply estimates.

# Map exploration and Extra Map Point research

Every sector in a new world starts with a 3,600 × 2,400 field. Area Expansion grows both dimensions across the whole world. Older saves use their largest previously generated field as the shared baseline so existing factories keep their space.

Extra Map Point appears first in the Research list once available. It keeps the first half of the world affordable, then charges progressively more for filling out the remaining maps. The six-Core price schedule and safeguards below are implemented.

## Half map baseline

The world contains 121 maps. Round half upward to **61 unlocked maps including Home**. Home is available initially and Exploration grants the first Map Point, so reaching this baseline requires **59 Extra Map Point completions**. The remaining 60 maps bring the total to 121, requiring 119 completions overall.

This is a budget for unlocked territory. Which maps become available depends on the player’s connected expansion route; productive-map coverage and reaching particular corners are separate goals.

## Prices for the first 59 completions

Each price applies equally to every required Core from Simple through the named Core. The first nine purchases stay at 5 Simple. Each new tier resets the bill to 5 of each Core. The next nine purchases rise evenly to that tier's ceiling, rounded to the nearest whole Core. The table assumes each Core is available when its phase is scheduled.

| Extra Map Point completions | Highest scheduled core | Cost of each required core | Total maps affordable including Home and Exploration |
| --- | --- | --- | --- |
| 1–9 | Simple | 5 | 11 |
| 10–19 | Basic | 5–10 | 21 |
| 20–29 | Automata | 5–15 | 31 |
| 30–39 | Hydro | 5–20 | 41 |
| 40–49 | Shiny | 5–25 | 51 |
| 50–59 | Complex | 5–30 | 61 |

Exploration costs 5 Simple + 5 Basic Cores, unlocks the world map and awards the first Map Point. Extra Map Point is repeatable after Exploration and starts at 5 Simple Cores. Every completion awards one Map Point, used to activate a locked map directly north, south, east or west of an unlocked map. Enter the activated map to discover its resources. Area Expansion instead enlarges the working field inside maps. With each Core available by its scheduled phase, research for the half-world baseline costs **2,805 Cores in 675 synchronized sets**, including Exploration. Map Points remain freely assignable to adjacent locked maps.

## Scaling beyond half the map

When Complex enters at #50, the remaining **60 maps** after its ten-purchase ramp increase by **1 of each Core every five purchases**, starting at 31 each and ending at 42 each.

| Total maps affordable | Cost of each required core for the indicated extra maps |
| --- | --- |
| 62–66 | 31 |
| 67–71 | 32 |
| 72–76 | 33 |
| 77–81 | 34 |
| Continue in groups of five | Add 1 per group |
| 117–121 | 42 |

For extra map number n after the 61-map baseline, the price is **30 + ceil(n / 5)** of each required Core, for n = 1 through 60. With all scheduled Cores available, full-world map research costs **15,945 Cores in 2,865 synchronized sets**, including Exploration. At five seconds per set this is 3 hours 58 minutes 45 seconds of uninterrupted lab work, or 1 hour 35 minutes 30 seconds with Research Center 6 throughout. Production, transport, construction, combat and other research add elapsed time.

## Preventing exploration dead ends

A Core joins the bill after its recipe unlock and its first scheduled purchase. If the unlock comes later, the existing phase continues and adds 1 of each Core every five purchases after its ramp. The first quote with the new tier starts at 5 of each Core, followed by its own ten-purchase ramp. For example, if Shiny is still locked at #40 after ten Hydro purchases, #40 costs 21 each through Hydro. The first quote after Shiny unlocks costs 5 each through Shiny.

Use the lesser of the scheduled Core tier and highest unlocked Core tier when calculating a new purchase. A selected quote holds until the purchase completes or the player changes projects. Saves preserve the quote, its pricing phase and earned Map Points. Older saves use the scheduled phase as a starting point for their current tier and retain any active quote. After all maps are unlocked or banked points cover the remaining maps, further purchases are unavailable.

## Verification and pacing

Automated checks cover the 59-completion half-world budget, all 119 full-world purchases and connected map activation, every price boundary, core-access fallback, fixed active quotes, saved progress and the fully explored map limit. Sustainable production, resource scouting, combat and real player waiting still need playthrough measurements. The current 37–60 and 109 productive-map endgame targets remain separate from these access budgets.

# Implemented milestones and discoveries

These entries consume no cores. Discoveries require visiting the relevant map; Precision Control also grants Waste Handling.

| Research | Completion condition | Unlock or benefit |
| --- | --- | --- |
| Water Tools | Encounter a Lake in a visited map | Pump, Hydro Plant and Coolant production. |
| Mythril Refining | Produce Mythril Tribute at a Dwarven settlement | Separator and Mythril production recipes. |
| Mineral Recovery | Complete Precision Control | Fines Recovery turns Metallic Fines and Water into Iron Plates in the Hydro Plant. |
| Waste Handling | Complete Precision Control | Waste Bin. Chain Filters to send each waste type to its own recovery line. |
| Joint | Connect two nodes | Unlocks the Joint node |
| Kiln | Extract 1 Wood with an Extractor | Unlocks the Kiln node |
| Smelter | Extract 1 metal with an Extractor | Unlocks the Smelter node |
| Refiner | Produce at least 1 metal Plate | Unlocks the Refiner, its Simple Core recipe, and the Research Center |
| Research Center | Unlock the Refiner | Unlocks the Research Center node |
| Splitter | Build an Assembler | Unlocks the Splitter node |
| Merger | Produce a Basic Core | Unlocks the Merger node |
| Suppression Bot | Encounter a Monster Camp | Unlocks the Bot Plant and the Bot Frame and Bot Gun recipes |
| End of the World | Produce the first Complex Core | Unlocks Yin, Yang and Final Core assembly |

# Implemented access and expansion research

| Research | Core cost | Research prerequisites | Unlock or benefit |
| --- | --- | --- | --- |
| Advanced Fabrication | 5 each through Automata | Assembler + Automata Core | Unlocks the Assembler II node. |
| Assembler | 5 Simple Cores | None specified | Unlocks the Assembler node |
| Road | 5 each through Basic | None specified | Unlocks Roads and Carts. Connect a freight vehicle directly to each Road endpoint. |
| Automata Core | 5 each through Basic | Exploration | Unlocks the Automata Core recipe in the Assembler |
| Area Expansion 1 | 10 each through Automata | None specified | Increases every map node field by 25% in both dimensions |
| Tree Planter | 10 each through Automata | None specified | Unlocks the Tree Planter node |
| Mining Drill | 10 each through Automata | None specified | Unlocks the Mining Drill node |

# Implemented advanced progression

Endgame Theory was retired on November 5. The first corner piece unlocks the seeded Yin and Yang recipes. Assembling one Yin and one Yang produces a Final Core. Victory is a separate paid Research Center project.

| Research | Core cost | Research prerequisites | Unlock or benefit |
| --- | --- | --- | --- |
| Hydrochemistry | 5 each through Automata | Automata Core | Copper Slurry recipe. |
| Hydraulic Assembly | 5 each through Automata | Hydrochemistry | Hydro Piston, Electrode and Hydro Core recipes. |
| Fluid Routing | 5 each through Hydro | Hydraulic Assembly | Fluid Road and Fluid Tank for inter-map fluid logistics. |
| Sealed Robotics | 5 each through Hydro | Hydraulic Assembly + Suppression Bot | Sealed Frame and Cooled Gun. The matched parts make a Suppression Bot 3 AP in the Bot Plant. |
| Ore Separation | 5 each through Hydro | Fluid Routing | Mythril Mesh and Shiny Core recipes. |
| Heavy Robotics | 5 each through Shiny | Sealed Robotics + Ore Separation | Mythril Frame and Focused Gun. The matched parts make a Suppression Bot 8 AP. |
| Precision Control | 5 each through Shiny | Ore Separation + Mineral Recovery | Logic Wafer, Controller, Servo Piston and Complex Core; advanced recovery recipes and Waste Handling fallback. |
| Autonomous Logistics | 1 each through Final | Precision Control + first Final Core produced | Storage and Inventory use one global transfer pool. Inventory initially outputs through Filters. Pool capacity is currently 1,000 per item. |
| Command Robotics | 5 each through Complex | Precision Control + Heavy Robotics | Servo Frame and Pulse Cannon. The matched parts make a Suppression Bot 24 AP. |
| Final Robotics | 1 each through Final | First Final Core produced + Command Robotics | Final Frame and Final Cannon. The matched parts make a Suppression Bot 72 AP every 210 seconds at base speed. |
| A Remarkably Indirect Conclusion | 1 each through Final | First Final Core produced | Select at the Research Center and pay one set to record victory and open the modal. |
| Resource Golem Survey | 3 each through Hydro | Sealed Robotics | Allows Bot attacks on four mineral Golems in separate sectors. Iron, Copper and Stone cost 100 AP each. Mythril costs 150 AP. Defeated Golems become infinite mineral reserves with four star connections for Extractors. |
| Mineral Regeneration | 5 each through Shiny | Mineral Recovery + Ore Separation | Ordinary non-wood deposits recover 1 unit every 30 seconds up to capacity. Depleted deposits remain after this unlock; existing Deep Holes are not restored. |

# Implemented efficiency and logistics research

Cycle upgrades replace the earlier speed factor unless the effect explicitly says otherwise. Their costs can use earlier core tiers even when the prerequisites are later in progression. The nine machine lines extend through Complex with six ranks each, as detailed below.

| Research | Core cost | Research prerequisites | Unlock or benefit |
| --- | --- | --- | --- |
| Pressure Systems | 45 each through Shiny | Ore Separation | A Pump connected directly to a Lake draws 8 Water/s instead of 4. |
| Mineral Regeneration 2 | 30 each through Shiny | Mineral Regeneration + Precision Control | Ordinary mineral recovery improves to 1 unit every 15 seconds and opens repeatable rate research. |
| High Pressure Intakes | 60 each through Shiny | Pressure Systems + Precision Control | A Pump connected directly to a Lake draws 16 Water/s. |
| Industrial Forestry | 25 each through Complex | Tree Planter + Precision Control | Tree Planters produce ten times faster and send up to ten funded growth units per local shipment. |
| Connector Mirroring | 10 each through Hydro | Hydraulic Assembly | Right-click a production node to mirror its input/output banks left-to-right. Cables, buffers and port identities are retained. Left-click recipe selection and the connector-order button remain available. |
| Factory Templates | 15 each through Automata | Hydraulic Assembly | Paid core research for saved layouts and batch placement previews; existing duplicate controls remain available. |
| Tree Planter 1 | 10 each through Automata | Tree Planter | Tree Planter cycles use 90% of base time. |
| Mineral Recovery 1 | 10 each through Hydro | Mineral Recovery + Hydraulic Assembly | Slag washing and recovered Brick/Iron recipes take 10% less time after any applicable family modifier; no extra material recovery. |
| Warehouse Logistics | 20 each through Hydro | Ore Separation + Fluid Routing | Dedicated one-item Warehouse holds 250 items with a filtered outlet; Inventory retrieval stays a later unlock. |
| Trucks | 15 each through Automata | Road + Automata Core | Doubles vehicle storage to 40 solid items and raises the Road limit to 24 items per minute. |
| Trains | 40 each through Hydro | Trucks + Hydraulic Assembly | Upgrades all existing and future vehicles to 80 solid items, retaining stock and cables. Every solid tier is allowed; fluids are excluded. |
| Road Channels 1 | 5 each through Hydro | Road + Hydraulic Assembly | Adds the second Road slot per map face. Sending and receiving endpoints share the limit. |
| Area Expansion 2 | 50 each through Shiny | Area Expansion 1 + Precision Control | Each sector grows from 1.25 to 1.5 times its base width and height. That gives 44% more field area than Area Expansion 1. |
| Road Channels 2 | 20 each through Hydro | Road Channels 1 + Ore Separation | Adds the third Road slot per map face. Sending and receiving endpoints share the limit. |
| Extractor 1 | 10 each through Simple | None specified | All Extractor cycles use 90% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Extractor 2 | 15 each through Basic | Extractor 1 | All Extractor cycles use 80% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Extractor 3 | 20 each through Automata | Extractor 2 + Automata Core | All Extractor cycles use 70% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Extractor 4 | 25 each through Hydro | Extractor 3 + Hydraulic Assembly | All Extractor cycles use 60% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Extractor 5 | 30 each through Shiny | Extractor 4 + Ore Separation | All Extractor cycles use 50% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Extractor 6 | 35 each through Complex | Extractor 5 + Precision Control | All Extractor cycles use 40% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Kiln 1 | 10 each through Simple | Kiln | All Kiln cycles use 90% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Kiln 2 | 15 each through Basic | Kiln 1 | All Kiln cycles use 80% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Kiln 3 | 20 each through Automata | Kiln 2 + Automata Core | All Kiln cycles use 70% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Kiln 4 | 25 each through Hydro | Kiln 3 + Hydraulic Assembly | All Kiln cycles use 60% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Kiln 5 | 30 each through Shiny | Kiln 4 + Ore Separation | All Kiln cycles use 50% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Kiln 6 | 35 each through Complex | Kiln 5 + Precision Control | All Kiln cycles use 40% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Smelter 1 | 10 each through Simple | Smelter | All Smelter cycles use 90% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Smelter 2 | 15 each through Basic | Smelter 1 | All Smelter cycles use 80% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Smelter 3 | 20 each through Automata | Smelter 2 + Automata Core | All Smelter cycles use 70% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Smelter 4 | 25 each through Hydro | Smelter 3 + Hydraulic Assembly | All Smelter cycles use 60% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Smelter 5 | 30 each through Shiny | Smelter 4 + Ore Separation | All Smelter cycles use 50% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Smelter 6 | 35 each through Complex | Smelter 5 + Precision Control | All Smelter cycles use 40% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Refiner 1 | 10 each through Simple | Refiner | All Refiner cycles use 90% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Refiner 2 | 15 each through Basic | Refiner 1 | All Refiner cycles use 80% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Refiner 3 | 20 each through Automata | Refiner 2 + Automata Core | All Refiner cycles use 70% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Refiner 4 | 25 each through Hydro | Refiner 3 + Hydraulic Assembly | All Refiner cycles use 60% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Refiner 5 | 30 each through Shiny | Refiner 4 + Ore Separation | All Refiner cycles use 50% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Refiner 6 | 35 each through Complex | Refiner 5 + Precision Control | All Refiner cycles use 40% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Assembler 1 | 10 each through Simple | Assembler | All Assembler cycles use 90% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Assembler 2 | 15 each through Basic | Assembler 1 | All Assembler cycles use 80% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Assembler 3 | 20 each through Automata | Assembler 2 + Automata Core | All Assembler cycles use 70% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Assembler 4 | 25 each through Hydro | Assembler 3 + Hydraulic Assembly | All Assembler cycles use 60% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Assembler 5 | 30 each through Shiny | Assembler 4 + Ore Separation | All Assembler cycles use 50% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Assembler 6 | 35 each through Complex | Assembler 5 + Precision Control | All Assembler cycles use 40% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Research Center 1 | 10 each through Simple | Research Center | All Research Center cycles use 90% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Research Center 2 | 15 each through Basic | Research Center 1 | All Research Center cycles use 80% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Research Center 3 | 20 each through Automata | Research Center 2 + Automata Core | All Research Center cycles use 70% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Research Center 4 | 25 each through Hydro | Research Center 3 + Hydraulic Assembly | All Research Center cycles use 60% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Research Center 5 | 30 each through Shiny | Research Center 4 + Ore Separation | All Research Center cycles use 50% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Research Center 6 | 35 each through Complex | Research Center 5 + Precision Control | All Research Center cycles use 40% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Hydro Plant 1 | 10 each through Simple | Water Tools | All Hydro Plant cycles use 90% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Hydro Plant 2 | 15 each through Basic | Hydro Plant 1 | All Hydro Plant cycles use 80% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Hydro Plant 3 | 20 each through Automata | Hydro Plant 2 + Automata Core | All Hydro Plant cycles use 70% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Hydro Plant 4 | 25 each through Hydro | Hydro Plant 3 + Hydraulic Assembly | All Hydro Plant cycles use 60% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Hydro Plant 5 | 30 each through Shiny | Hydro Plant 4 + Ore Separation | All Hydro Plant cycles use 50% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Hydro Plant 6 | 35 each through Complex | Hydro Plant 5 + Precision Control | All Hydro Plant cycles use 40% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Assembler II 1 | 10 each through Simple | Advanced Fabrication | All Assembler II cycles use 90% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Assembler II 2 | 15 each through Basic | Assembler II 1 | All Assembler II cycles use 80% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Assembler II 3 | 20 each through Automata | Assembler II 2 + Automata Core | All Assembler II cycles use 70% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Assembler II 4 | 25 each through Hydro | Assembler II 3 + Hydraulic Assembly | All Assembler II cycles use 60% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Assembler II 5 | 30 each through Shiny | Assembler II 4 + Ore Separation | All Assembler II cycles use 50% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Assembler II 6 | 35 each through Complex | Assembler II 5 + Precision Control | All Assembler II cycles use 40% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Separator 1 | 10 each through Simple | Mythril Refining | All Separator cycles use 90% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Separator 2 | 15 each through Basic | Separator 1 | All Separator cycles use 80% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Separator 3 | 20 each through Automata | Separator 2 + Automata Core | All Separator cycles use 70% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Separator 4 | 25 each through Hydro | Separator 3 + Hydraulic Assembly | All Separator cycles use 60% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Separator 5 | 30 each through Shiny | Separator 4 + Ore Separation | All Separator cycles use 50% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |
| Separator 6 | 35 each through Complex | Separator 5 + Precision Control | All Separator cycles use 40% of base time, replacing earlier ranks. Ingredient quantities and output yields stay unchanged. |

# Implemented repeatable research

| Research | First rank cost | Research prerequisites | Benefit per completion |
| --- | --- | --- | --- |
| Mineral Regeneration Rate | 10 each through Complex | Mineral Regeneration 2 | Each rank adds 0.8 mineral units per minute per ordinary deposit. Players can buy further ranks indefinitely. |
| Storage Placement Capacity | 1 each through Final | Autonomous Logistics | Each rank adds one Storage placement to the global cap; no maximum rank. |
| Inventory Placement Capacity | 1 each through Final | Autonomous Logistics | Each rank adds one Inventory placement to the global cap; no maximum rank. |
| Storage Connection Capacity | 1 each through Final | Autonomous Logistics | Each rank adds one permitted connection per Storage; no maximum rank. |
| Inventory Connection Capacity | 1 each through Final | Autonomous Logistics | Each rank adds one permitted output connection per Inventory; Inventory still initially connects only to Filters. |

At rank r, repeatables charge **ceil(base × 1.5^(r−1))** of each required Core. Final Core research uses that price directly, so Storage and Inventory prices start at 1, 2, 3, 4 and 6 of each Core. The five-Core minimum applies through Complex. Mineral Regeneration Rate starts at 10, 15, 23, 34 and 51 of each Core. Players can buy further ranks indefinitely.

# Implemented linear machine research through Complex

The nine machine lines use the same six ranks. Since November 8, 2026 (NODE-0350), the price per required Core starts at 10 and rises by five per rank. Each rank adds the next Core type through Complex. Completing one line costs 560 Cores. Completing all nine costs 5,040 Cores.

| Rank | Highest required core | Amount of each required core | Total physical cores | Cycle time as a share of base |
| --- | --- | --- | --- | --- |
| 1 | Simple | 10 | 10 | 90% |
| 2 | Basic | 15 | 30 | 80% |
| 3 | Automata | 20 | 60 | 70% |
| 4 | Hydro | 25 | 100 | 60% |
| 5 | Shiny | 30 | 150 | 50% |
| 6 | Complex | 35 | 210 | 40% |

Each completed rank reduces cycle time by 10 percentage points of the original base time. The highest completed rank replaces the earlier modifier; reductions do not multiply together. Ingredient amounts and output yields stay unchanged. All nine lines remain optional for unlocking new core tiers.

| Research line | Projects | Rank 1 access requirement |
| --- | --- | --- |
| Extractor | Extractor 1, Extractor 2, Extractor 3, Extractor 4, Extractor 5, Extractor 6 | Starting Extractor access |
| Kiln | Kiln 1, Kiln 2, Kiln 3, Kiln 4, Kiln 5, Kiln 6 | Kiln unlocked |
| Smelter | Smelter 1, Smelter 2, Smelter 3, Smelter 4, Smelter 5, Smelter 6 | Smelter unlocked |
| Refiner | Refiner 1, Refiner 2, Refiner 3, Refiner 4, Refiner 5, Refiner 6 | Refiner unlocked |
| Assembler | 5 Simple Cores | Assembler unlocked |
| Research Center | Research Center 1, Research Center 2, Research Center 3, Research Center 4, Research Center 5, Research Center 6 | Research Center unlocked |
| Hydro Plant | Hydro Plant 1, Hydro Plant 2, Hydro Plant 3, Hydro Plant 4, Hydro Plant 5, Hydro Plant 6 | Water Tools discovery |
| Assembler II | Assembler II 1, Assembler II 2, Assembler II 3, Assembler II 4, Assembler II 5, Assembler II 6 | Advanced Fabrication |
| Separator | Separator 1, Separator 2, Separator 3, Separator 4, Separator 5, Separator 6 | Mythril Refining discovery |

Ranks 2–6 require the preceding rank in the same research line. Rank 3 also requires Automata Core research; rank 4 requires Hydraulic Assembly; rank 5 requires Ore Separation; rank 6 requires Precision Control. Rank 2 needs Basic Core supply but adds no separate Basic Core research. Machine access and core access remain independent of these optional efficiency upgrades.

For example, Extractor 4 costs 40 Simple + 40 Basic + 40 Automata + 40 Hydro Cores and reduces the five-second base cycle to three seconds. Extractor 6 costs 60 of each of all six core types and reduces that base cycle to two seconds. Research Center 6 uses a two-second cycle from its five-second base; sustained operation needs 0.5 complete required core sets per second.

All 54 projects are implemented. Existing saved rank 1 and rank 2 completions retain their effects; later ranks can be researched in order.


The dedicated Automata Core Assembler is retired. Automata Cores use the regular Assembler recipe. Saved dedicated machines and factory templates convert to regular Assemblers while preserving their items, progress and connections. Mineral Recovery 1 applies its additional 10% time reduction to recovery recipes after the machine family modifier, including Separator upgrades.

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

Hydro, Shiny and Complex chains, machine upgrades, logistics upgrades, regeneration and the five late repeatables are now implemented. Advanced Fabrication costs 5 each of Simple, Basic and Automata Cores after Assembler and Automata Core research. Resource Golem Survey allows Bot attacks on four mineral Golems. New worlds place them in separate tier 5 sectors. Iron, Copper and Stone take 100 AP each, and Mythril takes 150 AP. Defeated Golems become infinite reserves with four Extractor sockets. Road research unlocks both Roads and Carts. Road limits are one, two and three per map face, counting imports and exports together; each Road carries up to 12, 24 or 48 items per minute at Cart, Truck or Train level. Roads hold no inventory and leave cargo at the source when the receiver is disconnected or full. Trucks and Trains upgrade vehicle storage globally to 40 and 80 items. All solid tiers are available from the first Cart; fluids are excluded. The earlier whole-chest batch proposal remains historical.

# Sources

Live snapshot: `src/content/research.ts`, `src/content/progression.ts`, `src/content/recipes.ts`, `src/simulation/progression.ts` and `src/simulation/engine.ts` in the Node Factory v2 project. Live implementation takes precedence over older proposal wording.

Planned research and open decisions: [Research Core Progression and Bot Upgrade Proposal](https://chatgpt.com/space/page_3f63cbe142508191a73e41bc10b7f530). Progression targets: `README.md`.
