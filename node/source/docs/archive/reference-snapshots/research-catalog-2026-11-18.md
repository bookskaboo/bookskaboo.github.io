> Historical snapshot archived November 18, 2026. Numeric rules and pending-work summaries may be superseded. Use the [system library](../../systems/README.md) for current mechanics. Original path: `docs/research-catalog.md`.

# Factorinode Current and Planned Research

**Current reference:** [Research system](../../systems/research.md) and the [generated live research catalog](../../systems/catalogs/research.md) describe the assembled local implementation. This document retains dated summaries, former schedules and planning context.

**November 5 update (NODE-0321):** Endgame Theory is retired. Victory is A Remarkably Indirect Conclusion, manually selected at the Research Center after first Final Core production, costing one each of Simple, Basic, Automata, Hydro, Shiny, Complex and Final Cores. The dated baseline below predates current endgame implementation; live prices are authoritative in src/content/research.ts and src/content/endgame.ts.

**November 8 update:** Standard paid research now costs at least five of each required Core. Assembler costs five Simple Cores. Victory uses the Final-tier price of one of each Core. The Research Center credits each set only after a complete cycle, including when its inputs are already stocked.

**November 16 update:** Each of the seven Core recipes has its own research project. Simple Core is a free discovery when the Refiner unlocks. Each later project requires five of every earlier Core. The research tree traces Core access through these projects. Power is removed pending a useful integration design: Basic Electricity and Power Distribution are no longer live projects. Tree Planters operate without Power. This catalog includes every live entry, its requirements and its effect, followed by the remaining planned research.

# Research rules

A price of **5 each through Hydro** means 5 Simple + 5 Basic + 5 Automata + 5 Hydro Cores. At the end of each cycle, the Research Center consumes and credits one of every Core it still needs together. A missing Core stops the cycle. The single Research Center is anchored at Home. Its base cycle is five seconds for new and loaded nodes; seven upgrades use 90%, 80%, 70%, 65%, 55%, 45% and 35% of base time, giving 4.5, 4, 3.5, 3.25, 2.75, 2.25 and 1.75 seconds per synchronized set. The highest completed rank replaces earlier effects.

Use **Research tree** at the top right of the research header to browse prerequisites from top to bottom. Search keeps matching projects and their prerequisite paths visible. Click a tree node to open its details; click the same research card again to collapse the details. Tree cards show names only, with colors indicating research status.

Core production follows Simple → Basic → Automata → Hydro → Shiny → Complex → Final. The first six Cores use intermediate parts; the Final Core uses the two halves assembled from corner pieces. Each paid Core project uses every earlier Core tier. Listed prerequisites are explicit research requirements; production also needs the appropriate machines, recipes, discoveries and material supply.

# Core progression

| Recipe project | Price | Prerequisites | Machine |
| --- | --- | --- | --- |
| Simple Core | Free discovery | Refiner | Refiner |
| Basic Core | 5 Simple | Assembler and Simple Core | Assembler |
| Automata Core | 5 each through Basic | Exploration and Basic Core | Assembler |
| Hydro Core | 5 each through Automata | Hydraulic Assembly and Automata Core | Fabricator |
| Shiny Core | 5 each through Hydro | Ore Separation and Hydro Core | Fabricator |
| Complex Core | 5 each through Shiny | Precision Control and Shiny Core | Fabricator |
| Final Core | 5 each through Complex | End of the World and Complex Core | Assembler |

## Obligatory hand holding in Research

Obligatory hand holding has one card at the right of the Research panel. Hold the left mouse button on it to read the clue, then release to hide it. The hint reacts to completed research, first production, visited sectors, and available corner pieces. Selecting a research card shows its details between the active project and the hint, or below them on narrow screens. For an available project, choose **Start research** beside its title. Recipes, research details, and encounter panels give the exact requirements. The catalog includes paid research and automatic unlocks. Blue cards are within reach. Grey cards show what still needs to be unlocked.

| Stage | Suggested route |
| --- | --- |
| Open the factory | Extract Wood and ore, turn Wood into Charcoal, and smelt a Plate to unlock the Refiner and Research Center. Make Simple Cores, then install the lab at Home. |
| Open the map | Research Assembler, then Basic Core. Complete Exploration for the first Map Point and Road to ship between sectors. Select a neighboring map to see its Core cost and start research. |
| Build Automata and Hydro | Research Automata Core and Advanced Fabrication. Scout for a large puddle; visiting a Lake grants Water Tools. Research Hydrochemistry, Hydraulic Assembly, Hydro Core, and then Fluid Routing. |
| Get Mythril | Scout for an occupied sector to unlock the Bot Plant, then research Sealed Robotics. Find a Dwarven settlement and start Mythril Tribute. A starter Camp requires 6 AP per minute. Two 4 AP Suppression Bots cover a check, and surplus AP carries forward. |
| Grow the factory | Research Ore Separation and Shiny Core, then Precision Control and Complex Core. Keep Controller waste. Visit Golem camps in the outer sectors and deliver Suppression Bots to turn them into permanent mineral reserves. |
| Find the four pieces | Open routes to all four corners of the Node Map. Their locations vary by world. Once visited, the guide can name the corner and its job: Bots for the Dragon, parts for the Foundry, local Tree Planter growth for the Grove, and waste for Reclamation. |
| Win and keep playing | Assemble the world's paired pieces into Yin and Yang. Complete Final Core research, then combine the two halves. Start A Remarkably Indirect Conclusion and supply one of each of the seven Cores. After victory, the final card is “You’ve got this” with the hint “Maybe a speed run next?” |

# Production chain revision

The revised Shiny chain smelts Mythril Plate, dry-alloys 1 Plate + 4 Iron Plates + 1 Charcoal into 2 Pure Mythril + 2 Slag in 12 seconds, then makes Mesh from 2 Pure Mythril + 1 Copper Wire + 2 Coolant in 18 seconds. Final Shiny assembly remains 24 seconds.

Precision Control also unlocks two regular Assembler recipes: 4 Copper Gears + 1 Mythril Plate produce 4 Mythril Gears, and 4 Iron Wires + 1 Mythril Plate produce 4 Mythril Wires, each in 12 seconds. Existing Refiner alternatives remain. Controllers consume Mythril Gear instead of Pure Mythril; Logic Wafers consume Mythril Wire; Servo Pistons consume 1 Hydro Piston + 1 Mesh + 3 Coolant. Each Complex component takes 30 seconds, and final Complex assembly takes 36 seconds. Research prices and optional efficiency upgrades are unchanged. See the [progression design](../../progression-and-scaling.md) for complete recipes and supply estimates.

# Map exploration and Extra Map Point research

Every sector in a new world starts with a 3,600 × 2,400 field. Area Expansion grows both dimensions across the whole world. Older saves use their largest previously generated field as the shared baseline so existing factories keep their space.

Exploration costs 5 Simple and 5 Basic Cores and grants one Map Point. Use it to open a map directly north, south, east, or west of Home. After spending saved Map Points, select a neighboring destination on the Node Map to see its Core bill before starting Extra Map Point research. Completing the bill opens that map. Enter it to discover its resources.

Each band starts at five of each required Core. Tiers 1–2 use Simple and rise by five after each opening. Tiers 3–4 add Basic, tiers 5–6 add Automata, tier 7 adds Hydro, tier 8 adds Shiny, and tiers 9–10 add Complex. Those bands rise by five of each required Core after every two openings within the band. The free opening counts and corners add one Complex Core. Opening the full standard board costs 12,539 Cores after Exploration. A partially paid quote keeps its destination and price when switching research or reloading. Existing points and already quoted purchases without a destination can still be used on adjacent maps. [Balance proposal](../../core-consumption-balance-proposal.md#map-prices-by-destination-tier)

The earlier generic Map Point schedule follows for reference. It also applies to training and is the base schedule for compatible overrides.

## Former half map baseline

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
| Mythril Refining | Produce Mythril Tribute at a Dwarven settlement | Synthesizer and Mythril production recipes. |
| Mineral Recovery | Complete Precision Control | Feed Metallic Fines and Water into a Recycler to make Iron Plates. Efficient Higher Intermediates adds Flux, Crust, and Slag Recovery. A Recycler matches its incoming material and runs one recipe at a time. |
| Waste Handling | Complete Precision Control | Waste Bin. Chain Filters to send each waste type to its own recovery line. |
| Joint | Connect two nodes | Unlocks the Joint node |
| Kiln | Extract 1 Wood with an Extractor | Unlocks the Kiln node |
| Smelter | Extract 1 metal with an Extractor | Unlocks the Smelter node |
| Refiner | Produce at least 1 metal Plate | Unlocks the Refiner node |
| Simple Core | Unlock the Refiner | Unlocks the Simple Core recipe in the Refiner |
| Research Center | Unlock the Refiner | Unlocks the Research Center node |
| Splitter | Build an Assembler | Unlocks the Splitter node |
| Merger | Produce a Basic Core | Unlocks the Merger node |
| Suppression Bot | Encounter a Monster Camp | Unlocks the Bot Plant and the Basic Frame and Basic Gun recipes |
| End of the World | Produce the first Complex Core | Unlocks the Yin and Yang recipes |

# Implemented access and expansion research

| Research | Core cost | Research prerequisites | Unlock or benefit |
| --- | --- | --- | --- |
| Advanced Fabrication | 5 each through Automata | Assembler + Automata Core | Unlocks the Fabricator node. |
| Assembler | 5 Simple Cores | None specified | Unlocks the Assembler node |
| Road | 5 each through Basic | None specified | Unlocks Roads and Carts. Connect a freight vehicle directly to each Road endpoint. |
| Area Expansion 1 | 10 each through Automata | None specified | Increases every map node field by 25% in both dimensions |
| Tree Planter | 10 each through Automata | None specified | Unlocks the Tree Planter node |
| Mining Drill | 10 each through Automata | None specified | Unlocks the Mining Drill node |

# Implemented advanced progression

Endgame Theory was retired on November 5. Producing the first Complex Core unlocks the seeded Yin and Yang recipes. Final Core research unlocks the recipe that combines one Yin with one Yang. Victory is a separate paid Research Center project.

The [NODE Bot Production reference](https://chatgpt.com/space/page_f61bbb51dba88191b758234023997faa) lists the frame and gun recipes, base times, and AP for every pairing.

| Research | Core cost | Research prerequisites | Unlock or benefit |
| --- | --- | --- | --- |
| Hydrochemistry | 5 each through Automata | Automata Core | Copper Slurry recipe. |
| Hydraulic Assembly | 15 each through Automata | Hydrochemistry | Hydro Piston and Circuit B recipes. |
| Fluid Routing | 5 each through Hydro | Hydraulic Assembly | Fluid Road and Fluid Tank for inter-map fluid logistics. |
| Sealed Robotics | 5 each through Hydro | Hydraulic Assembly + Suppression Bot | Sealed Frame and Cooled Gun. |
| Ore Separation | 20 each through Hydro | Fluid Routing | Mythril Mesh in the Synthesizer. |
| Heavy Robotics | 20 each through Shiny | Sealed Robotics + Ore Separation | Mythril Frame and Focused Gun. |
| Precision Control | 30 each through Shiny | Ore Separation | Controller, Servo Piston, and Circuit C recipes. Unlocks Mineral Recovery and Waste Handling. |
| Autonomous Logistics | 1 each through Final | Precision Control + first Final Core produced | Storage and Inventory use one global transfer pool. Inventory initially outputs through Filters. Pool capacity is currently 1,000 per item. |
| Command Robotics | 30 each through Complex | Precision Control + Heavy Robotics | Servo Frame and Pulse Cannon. |
| Final Robotics | 1 each through Final | First Final Core produced + Command Robotics | Final Frame and Final Cannon. |
| A Remarkably Indirect Conclusion | 1 each through Final | First Final Core produced | Select at the Research Center and pay one set to record victory and open the modal. |
| Mineral Regeneration 1 | 5 each through Hydro | Ore Separation | Ordinary non-wood deposits recover 1 unit every 30 seconds up to capacity. Depleted deposits remain after this unlock; existing Deep Holes are not restored. |

# Implemented production efficiency through Final

There are 64 node-owned efficiency projects: 57 Production upgrades and seven Research Center upgrades. Names count ranks within each node, while serialized numeric suffixes retain their Core tier for compatibility. Every rank requires the machine unlock, the matching Core recipe research and the preceding rank in its chain.

Extractor, Kiln and Smelter start at Basic; Refiner, Assembler, Fabricator and Bot Plant at Automata; Hydro Plant, Pump, Tree Planter and Recycler at Hydro; Synthesizer at Shiny; Research Center at Simple. The final cycle factor is 35% of base time. Intermediate reductions round to multiples of five percentage points, with halfway values toward the larger reduction.

Each rank costs 10 of every Core through Simple, 15 through Basic, 20 through Automata, 25 through Hydro, 30 through Shiny, 35 through Complex or 40 through Final. These optional upgrades are not prerequisites for the Core progression or victory.

| Research | Core cost | Research prerequisites | Benefit |
| --- | --- | --- | --- |
| Extractor 1 | 15 each through Basic | Basic Core | Extractor cycles take 10% less time than the base cycle. |
| Extractor 2 | 20 each through Automata | Extractor 1 + Automata Core | Extractor cycles take 20% less time than the base cycle. |
| Extractor 3 | 25 each through Hydro | Extractor 2 + Hydro Core | Extractor cycles take 35% less time than the base cycle. |
| Extractor 4 | 30 each through Shiny | Extractor 3 + Shiny Core | Extractor cycles take 45% less time than the base cycle. |
| Extractor 5 | 35 each through Complex | Extractor 4 + Complex Core | Extractor cycles take 55% less time than the base cycle. |
| Extractor 6 | 40 each through Final | Extractor 5 + Final Core | Extractor cycles take 65% less time than the base cycle. |
| Kiln 1 | 15 each through Basic | Kiln + Basic Core | Kiln cycles take 10% less time than the base cycle. |
| Kiln 2 | 20 each through Automata | Kiln 1 + Automata Core | Kiln cycles take 20% less time than the base cycle. |
| Kiln 3 | 25 each through Hydro | Kiln 2 + Hydro Core | Kiln cycles take 35% less time than the base cycle. |
| Kiln 4 | 30 each through Shiny | Kiln 3 + Shiny Core | Kiln cycles take 45% less time than the base cycle. |
| Kiln 5 | 35 each through Complex | Kiln 4 + Complex Core | Kiln cycles take 55% less time than the base cycle. |
| Kiln 6 | 40 each through Final | Kiln 5 + Final Core | Kiln cycles take 65% less time than the base cycle. |
| Smelter 1 | 15 each through Basic | Smelter + Basic Core | Smelter cycles take 10% less time than the base cycle. |
| Smelter 2 | 20 each through Automata | Smelter 1 + Automata Core | Smelter cycles take 20% less time than the base cycle. |
| Smelter 3 | 25 each through Hydro | Smelter 2 + Hydro Core | Smelter cycles take 35% less time than the base cycle. |
| Smelter 4 | 30 each through Shiny | Smelter 3 + Shiny Core | Smelter cycles take 45% less time than the base cycle. |
| Smelter 5 | 35 each through Complex | Smelter 4 + Complex Core | Smelter cycles take 55% less time than the base cycle. |
| Smelter 6 | 40 each through Final | Smelter 5 + Final Core | Smelter cycles take 65% less time than the base cycle. |
| Refiner 1 | 20 each through Automata | Refiner + Automata Core | Refiner cycles take 15% less time than the base cycle. |
| Refiner 2 | 25 each through Hydro | Refiner 1 + Hydro Core | Refiner cycles take 25% less time than the base cycle. |
| Refiner 3 | 30 each through Shiny | Refiner 2 + Shiny Core | Refiner cycles take 40% less time than the base cycle. |
| Refiner 4 | 35 each through Complex | Refiner 3 + Complex Core | Refiner cycles take 50% less time than the base cycle. |
| Refiner 5 | 40 each through Final | Refiner 4 + Final Core | Refiner cycles take 65% less time than the base cycle. |
| Assembler 1 | 20 each through Automata | Assembler + Automata Core | Assembler cycles take 15% less time than the base cycle. |
| Assembler 2 | 25 each through Hydro | Assembler 1 + Hydro Core | Assembler cycles take 25% less time than the base cycle. |
| Assembler 3 | 30 each through Shiny | Assembler 2 + Shiny Core | Assembler cycles take 40% less time than the base cycle. |
| Assembler 4 | 35 each through Complex | Assembler 3 + Complex Core | Assembler cycles take 50% less time than the base cycle. |
| Assembler 5 | 40 each through Final | Assembler 4 + Final Core | Assembler cycles take 65% less time than the base cycle. |
| Research Center 1 | 10 each through Simple | Research Center + Simple Core | Research Center cycles take 10% less time than the base cycle. |
| Research Center 2 | 15 each through Basic | Research Center 1 + Basic Core | Research Center cycles take 20% less time than the base cycle. |
| Research Center 3 | 20 each through Automata | Research Center 2 + Automata Core | Research Center cycles take 30% less time than the base cycle. |
| Research Center 4 | 25 each through Hydro | Research Center 3 + Hydro Core | Research Center cycles take 35% less time than the base cycle. |
| Research Center 5 | 30 each through Shiny | Research Center 4 + Shiny Core | Research Center cycles take 45% less time than the base cycle. |
| Research Center 6 | 35 each through Complex | Research Center 5 + Complex Core | Research Center cycles take 55% less time than the base cycle. |
| Research Center 7 | 40 each through Final | Research Center 6 + Final Core | Research Center cycles take 65% less time than the base cycle. |
| Hydro Plant 1 | 25 each through Hydro | Water Tools + Hydro Core | Hydro Plant cycles take 15% less time than the base cycle. |
| Hydro Plant 2 | 30 each through Shiny | Hydro Plant 1 + Shiny Core | Hydro Plant cycles take 35% less time than the base cycle. |
| Hydro Plant 3 | 35 each through Complex | Hydro Plant 2 + Complex Core | Hydro Plant cycles take 50% less time than the base cycle. |
| Hydro Plant 4 | 40 each through Final | Hydro Plant 3 + Final Core | Hydro Plant cycles take 65% less time than the base cycle. |
| Fabricator 1 | 20 each through Automata | Advanced Fabrication + Automata Core | Fabricator cycles take 15% less time than the base cycle. |
| Fabricator 2 | 25 each through Hydro | Fabricator 1 + Hydro Core | Fabricator cycles take 25% less time than the base cycle. |
| Fabricator 3 | 30 each through Shiny | Fabricator 2 + Shiny Core | Fabricator cycles take 40% less time than the base cycle. |
| Fabricator 4 | 35 each through Complex | Fabricator 3 + Complex Core | Fabricator cycles take 50% less time than the base cycle. |
| Fabricator 5 | 40 each through Final | Fabricator 4 + Final Core | Fabricator cycles take 65% less time than the base cycle. |
| Synthesizer 1 | 30 each through Shiny | Mythril Refining + Shiny Core | Synthesizer cycles take 20% less time than the base cycle. |
| Synthesizer 2 | 35 each through Complex | Synthesizer 1 + Complex Core | Synthesizer cycles take 45% less time than the base cycle. |
| Synthesizer 3 | 40 each through Final | Synthesizer 2 + Final Core | Synthesizer cycles take 65% less time than the base cycle. |
| Bot Plant 1 | 20 each through Automata | Suppression Bot + Automata Core | Bot Plant cycles take 15% less time than the base cycle. |
| Bot Plant 2 | 25 each through Hydro | Bot Plant 1 + Hydro Core | Bot Plant cycles take 25% less time than the base cycle. |
| Bot Plant 3 | 30 each through Shiny | Bot Plant 2 + Shiny Core | Bot Plant cycles take 40% less time than the base cycle. |
| Bot Plant 4 | 35 each through Complex | Bot Plant 3 + Complex Core | Bot Plant cycles take 50% less time than the base cycle. |
| Bot Plant 5 | 40 each through Final | Bot Plant 4 + Final Core | Bot Plant cycles take 65% less time than the base cycle. |
| Pump 1 | 25 each through Hydro | Water Tools + Hydro Core | Each Lake Pump draws up to 5 Water per second. |
| Pump 2 | 30 each through Shiny | Pump 1 + Shiny Core | Each Lake Pump draws up to 6 Water per second. |
| Pump 3 | 35 each through Complex | Pump 2 + Complex Core | Each Lake Pump draws up to 8 Water per second. |
| Pump 4 | 40 each through Final | Pump 3 + Final Core | Each Lake Pump draws up to 11 Water per second. |
| Tree Planter 1 | 25 each through Hydro | Tree Planter + Hydro Core | Tree Planter cycles take 15% less time than the base cycle. |
| Tree Planter 2 | 30 each through Shiny | Tree Planter 1 + Shiny Core | Tree Planter cycles take 35% less time than the base cycle. |
| Tree Planter 3 | 35 each through Complex | Tree Planter 2 + Complex Core | Tree Planter cycles take 50% less time than the base cycle. Also expands growth buffers and allows ten growth units per transfer. |
| Tree Planter 4 | 40 each through Final | Tree Planter 3 + Final Core | Tree Planter cycles take 65% less time than the base cycle. |
| Recycler 1 | 25 each through Hydro | Intermediate Recycling + Hydro Core | Recycler cycles take 15% less time than the base cycle. |
| Recycler 2 | 30 each through Shiny | Recycler 1 + Shiny Core | Recycler cycles take 35% less time than the base cycle. |
| Recycler 3 | 35 each through Complex | Recycler 2 + Complex Core | Recycler cycles take 50% less time than the base cycle. |
| Recycler 4 | 40 each through Final | Recycler 3 + Final Core | Recycler cycles take 65% less time than the base cycle. |

All recipes use the efficiency of the node performing the work. Mythril Mesh and composite Mythril Gears and Wire use Synthesizer upgrades. Crust Recovery uses Recycler upgrades. Mineral Recovery discovery and recipe yields are retained; the extra Mineral Recovery 1 speed project is retired.

Pumps draw 4 Water/s before research, then 5, 6, 8 and 11 Water/s. These rounded whole-number rates are the explicit exception to the exact 35% interval endpoint. Two Pumps per Lake and routing capacity rules remain.

Tree Planters fund 100 growth units with 10 Wood, one Iron Plate and one Stone. Their base interval is 250 ms, followed by 212.5, 162.5, 125 and 87.5 ms at Hydro through Final. Complex also expands the buffers and enables ten growth units per transfer. Pressure Systems, High Pressure Intakes and Industrial Forestry no longer appear as separate projects.

Older saves keep valid purchases at the same Core tier. Removed lower-tier purchases and partial payments are refunded once, to an existing Research Center when possible. Consolidated special upgrades receive equivalent new-chain credit. Paid production batches retain their contents and fractional progress.

# Resource recovery from the start

Before Exploration, a typed stock ledger checks the first unpaid prerequisite on the actual path to Exploration, including Core recipe access. It counts accessible reserves, real buffers and shipments, paid research and available renewable or recycling routes. Unusable Copper Wire is not treated as Copper Gears, and global-pool stock is not spendable before Inventory access. Slow delivery and blocked outputs do not constitute a shortage.

If materials cannot fund progression, restore only the missing raw Iron, Copper or Stone in an accessible starting deposit. Early exhausted deposits stay in place; a collapsed legacy Home deposit can be restored without opening maps or charging AP. If production consumes the restored stock into another dead end, recovery can run again. The existing expansion/Golem safeguard remains available after Exploration. Refill state and research migration persist across save reloads.

# Other efficiency and logistics research

| Research | Core cost | Research prerequisites | Unlock or benefit |
| --- | --- | --- | --- |
| Mineral Regeneration 2 | 30 each through Shiny | Mineral Regeneration 1 + Precision Control | Ordinary mineral recovery improves to 1 unit every 15 seconds and opens repeatable rate research. |
| Connector Mirroring | 10 each through Hydro | Hydraulic Assembly | Right-click a production node to mirror its input/output banks left-to-right. Cables, buffers and port identities are retained. Left-click recipe selection and the connector-order button remain available. |
| Factory Templates | 15 each through Automata | Hydraulic Assembly | Paid core research for saved layouts and batch placement previews; existing duplicate controls remain available. |
| Warehouse Logistics | 20 each through Hydro | Ore Separation + Fluid Routing | Dedicated one-item Warehouse holds 250 items with a filtered outlet; Inventory retrieval stays a later unlock. |
| Trucks | 15 each through Automata | Road + Automata Core | Doubles vehicle storage to 40 solid items and raises the Road limit to 24 items per minute. |
| Trains | 40 each through Hydro | Trucks + Hydraulic Assembly | Upgrades all existing and future vehicles to 80 solid items, retaining stock and cables. Every solid tier is allowed; fluids are excluded. |
| Road Channels 1 | 5 each through Hydro | Road + Hydraulic Assembly | Adds the second Road slot per map face. Sending and receiving endpoints share the limit. |
| Area Expansion 2 | 50 each through Shiny | Area Expansion 1 + Precision Control | Each sector grows from 1.25 to 1.5 times its base width and height. That gives 44% more field area than Area Expansion 1. |
| Road Channels 2 | 20 each through Shiny | Road Channels 1 + Ore Separation | Adds the third Road slot per map face. Sending and receiving endpoints share the limit. |
| Research | First rank cost | Research prerequisites | Benefit per completion |
| --- | --- | --- | --- |
| Mineral Regeneration Rate | 10 each through Complex | Mineral Regeneration 2 | Each rank adds 0.8 mineral units per minute per ordinary deposit. Players can buy further ranks indefinitely. |
| Storage Placement Capacity | 1 each through Final | Autonomous Logistics | Each rank adds one Storage placement to the global cap; no maximum rank. |
| Inventory Placement Capacity | 1 each through Final | Autonomous Logistics | Each rank adds one Inventory placement to the global cap; no maximum rank. |
| Storage Connection Capacity | 1 each through Final | Autonomous Logistics | Each rank adds one permitted connection per Storage; no maximum rank. |
| Inventory Connection Capacity | 1 each through Final | Autonomous Logistics | Each rank adds one permitted output connection per Inventory; Inventory still initially connects only to Filters. |

The dedicated Automata Core Assembler remains retired. Saved machines and templates retain their items and connections while converting to regular Assemblers.

# Historical tier 7 design notes

The dated notes below predate the implemented endgame. They are historical design context; the Core progression, efficiency schedule above and source catalog take precedence.


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

Hydro, Shiny and Complex chains, machine upgrades, logistics upgrades, regeneration and the five late repeatables are now implemented. Advanced Fabrication costs 5 each of Simple, Basic and Automata Cores after Assembler and Automata Core research. New worlds place four Golem camps in separate tier 5 sectors. Deliver Suppression Bots to fight them. Iron, Copper and Stone take 100 AP each, and Mythril takes 150 AP. Defeated Golems become infinite reserves with four Extractor sockets. Road research unlocks both Roads and Carts. Road limits are one, two and three per map face, counting imports and exports together; each Road carries up to 12, 24 or 48 items per minute at Cart, Truck or Train level. Roads hold no inventory and leave cargo at the source when the receiver is disconnected or full. Trucks and Trains upgrade vehicle storage globally to 40 and 80 items. All solid tiers are available from the first Cart; fluids are excluded. The earlier whole-chest batch proposal remains historical.

# Sources

Current catalog: `src/content/machineEfficiency.ts`, `src/content/research.ts`, `src/content/progression.ts`, `src/content/recipes.ts`, `src/simulation/progression.ts` and `src/simulation/engine.ts` in the Node Factory v2 project. Live implementation takes precedence over older proposal wording.

See `README.md` for progression targets and the [bot production archive](../bot-production/README.md) for earlier design proposals.
