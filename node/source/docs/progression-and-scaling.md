# Progression and Scaling Design

**November 8 revision.** Corner quotas are 500 Dragon AP, 50 Circuit B / 25 Sealed Frames / 100 Mythril Gears at the Foundry, and 1,000 Grove growth. Reclamation takes 20 Metallic Fines or equivalent mixed waste. Final Robotics and Victory each cost one of every Core through Final. See the [current implementation](master-plan/20-endgame-implementation.md).

Updated November 2, 2026.

Research timing correction: new and loaded Research Centers now use a five-second base synchronized-set cycle, reduced through the existing six ranks to 4.5, 4, 3.5, 3, 2.5 and 2 seconds. Refresh live analysis with `npm run progression`; older analytical timing/throughput conclusions require revalidation as described in [analysis status](../outputs/progression/README.md). Historical runs below retain their original-build evidence and do not validate the corrected timing or the proposed Dwarven supply transition.

The intended progression encourages exploration, growing production at every core tier, and distributed factories that make intermediates and cores for delivery toward Home. Each tier should introduce a different production bottleneck. Efficiency research remains an optional bonus whose value grows with the size of the player's factory.

This is the ongoing discussion and decision record. Implemented decisions are identified below; other recipe changes and pacing targets remain proposals until agreed.

## Agreed direction

- Advanced Fabrication now requires Automata Core research and costs 2 each of Simple, Basic, and Automata Cores. Its first unique Assembler II intermediates are Hydro Piston and Electrode, unlocked by Hydraulic Assembly for Hydro Core production. Existing completed research remains completed.

- Encourage scaling with every new core tier, with different bottlenecks to overcome at each tier.
- Use Map Nodes to support exploration and productive expansion. Count working outposts and sustainable output when evaluating scale, rather than unlocked territory alone.
- Encourage intermediate production near resources and increasingly complex products and cores moving toward Home. The single Research Center is anchored at Home.
- Keep earlier core factories useful as later tiers increase research demand. Core recipes remain independent; higher cores do not consume lower cores.
- Keep the game completable without efficiency upgrades. Investment in those upgrades should feel worthwhile across a large production network.
- Review problems individually in conversation. Efficiency balance is on hold; progression demand and distinct tier bottlenecks are the current topic.

## Existing design constraints

The [project design goals](../README.md#progression-design-goals) retain affordable capability access, optional larger investments in efficiency and convenience, and equal quantities of each required core in paid research. Research opening a new core must use previously available core tiers.

Existing pacing goals distinguish completing tier 6 and opening tier 7 within three hours of perfect play from the longer 20–30 hour efficient endgame goal. Endgame Theory is currently the entry checkpoint for a future tier 7, not an implemented final victory. Neither those goals nor the equal-core rule has been changed by this discussion.

Planning, construction, troubleshooting and research should overlap. A project taking time to fund can support useful building activity; forced waiting means research blocks the next useful challenge and no useful progression work remains. Existing goals target zero forced waiting for efficient play and brief gaps for typical first playthroughs.

## Problem 1 Efficiency research

**Status: on hold. Keep the current implementation.**

The player wants efficiency research to feel like an optional bonus that becomes worthwhile at scale. The earlier suggestion to replace the first upgrade with a cheaper, stronger upgrade was withdrawn after checking the recent implementation.

Nine machine families now have six ranks. Rank r costs 10r of every core from Simple through tier r. Cycle time becomes 90%, 80%, 70%, 60%, 50% and 40% of base time across ranks 1–6. The highest rank replaces earlier effects; ingredient quantities and yields stay unchanged. These ranks are optional for access to later cores.

The future evaluation question is whether upgrading an established production network repays the diverted cores while that network remains useful. No new efficiency price or effect is agreed.

Current details: [research catalog](research-catalog.md#implemented-linear-machine-research-through-command) and [efficiency research plan](../outputs/progression/research-upgrade-plan.md).

## Problem 2 Progression demand and scaling

**Status: Simple through Hydro roles agreed. The revised Shiny and Complex recipes, work times and Map Node scaling are implemented. Throughput figures below are analytical estimates pending gameplay validation.**

Most main progression projects currently cost 2 of each required core; Hydrochemistry costs 1 each through Automata. A few batches can therefore establish access to the next capability without demonstrating sustained production at the current tier. The concern is that larger factories may have too little opportunity to show their value before the player moves to the next chain.

Affordable access is already an intentional design rule. The next decision is where to place meaningful production demand while preserving that rule: which milestones should reward sustained output, and which unlocks should remain inexpensive introductions to new tools and recipes?

### Adopted Simple Core scaling and exploration

Keep Assembler research at 1 Simple Core so the starter factory can introduce Basic Core production quickly. Exploration remains 1 Simple + 1 Basic and grants the first Map Point. The first nine repeatable Map Node purchases cost 5 Simple Cores each; exploration is the first sustained reason to expand Simple Core production.

One Simple Core consumes two Copper Gears, requiring four Copper Plates and eight Copper Ore plus smelting charcoal. Without upgrades, one fully supplied Copper Smelter supports 2.5 Simple Cores per minute. Five adequately supplied Smelters can support one core Refiner at its limit of 12 per minute. A 5-core purchase therefore takes approximately two minutes versus 25 seconds of sustained production, excluding startup and delivery. Additional extraction, charcoal supply and smelting create the scaling benefit; efficiency research remains optional.

### Adopted Basic Core scaling

Keep the Basic Core recipe unchanged: one Copper Plate plus one Iron Wire. Each Iron Wire consumes three Iron Plates, so Basic production requires a 3:1 ratio of iron to copper plate supply. This tier teaches balancing unequal material streams while established Simple Core production continues competing for copper and charcoal.

Without upgrades, a fully supplied Basic Core Assembler produces 6 cores per minute. Its inputs require 18 Iron Plates and 6 Copper Plates per minute: 1.8 Iron Smelters and 0.6 Copper Smelters of sustained capacity, plus adequate ore, charcoal and wire processing. These figures exclude the continuing demand from Simple Cores and other consumers.

The implemented Basic phase starts at 5 of each Core through Basic and rises to 10 each over ten purchases. Validate whether players can identify the Iron Wire bottleneck and resolve it through extraction, smelting and deliberate supply branches before changing ingredients or adding further costs. Efficiency upgrades remain optional.

### Adopted Automata Core scaling and delivery to Home

Automata should encourage specialized outposts and introduce delivery to the Home Research Center through ordinary production and transport decisions. Efficient players should discover that processing near resources and combining ingredients before shipping reduces transport demand. Shipping resources or intermediates into Home and assembling there must remain a viable, less efficient approach. Players choose where to assemble and which intermediates to trade between outposts.

Keep the existing Automata recipe as the evaluation baseline: one Circuit A plus one Brick per core. Shipping those two ingredients into Home requires two material streams and two item transfers per core across the Home boundary. Shipping the completed core uses one material stream and one transfer per core. Routes may span multiple map boundaries; total network cost depends on the layout.

The existing fixed road rate of one item every five seconds (12 items per minute) and single-material road pairs already make local processing valuable. Show factual contents, rates and blocked states so players can understand their factories; let the advantage of finished-product delivery follow from those rules. Inefficient layouts should still progress through longer delivery times, more routes or additional expansion. New cargo weights, transport tiers or raw-material bans are not part of this decision.

Delivery design constraints:

- Do not add an outpost task, journal prompt or strategy comparison telling players to assemble cores outside Home. The earlier instructional proposals are withdrawn.
- Do not require off-Home assembly for research or progression, or prohibit otherwise permitted resource and intermediate shipments.
- Balance resource availability, production ratios and transport capacity so efficient layouts reward local processing while slower layouts remain workable.
- Playtest both an outpost-assembly route and a Home-assembly route. Compare completion, delivery throughput, material costs, required routes and elapsed time; efficient play should gain an advantage without making the alternative a dead end.

### Adopted Hydro scaling and local fluid processing

Hydro is the deliberate point where geography requires local production. Earlier stone can be transported to Home; water cannot currently be moved between maps. Keep fluid transport off roads. Inter-map water transport may be considered later, but is not required to make Hydro's less efficient layouts viable.

Players must establish water-dependent processing near a lake and ship transportable solid products outward. Producing Hydro Cores at the lake and delivering them Home is the intended progression. Players retain choices about which solid ingredients to import, which supporting production to build locally, and where to assemble products that no longer require fluids.

The constraint applies to water-dependent processing, rather than a mandatory off-Home core-assembly check. Other solid-material arrangements can remain slower but workable. This is an intentional geographic restriction within the broader principle that inefficient play should still progress.

Use the current recipes as the evaluation baseline. Hydro scaling should expose shared supply constraints in water intake, iron plates, Coolant processing and assembly: increasing one consumer can starve another. Evaluate expansion around the actual constrained input while established Simple, Basic and Automata streams continue operating. Do not add an alternative inter-map fluid method or an overt strategy tutorial as part of this decision.

### Shiny regional production and waste handling

The desired Shiny flow starts with local processing near the Mythril deposit. Players can send waste to another map for handling and send an early Mythril intermediate to a lake map for further processing through to Shiny Core production. Waste export should be a useful option alongside valid local handling, rather than a mandatory third-map check.

Before this revision, the Pure Mythril recipe combined raw Mythril, Charcoal and Coolant in one step, producing Pure Mythril and Slag. Because Coolant cannot travel between maps, it drew raw Mythril to a lake before any of that refining can happen. This did not provide the intended dry processing stage near the deposit.

The player also wants increasing processing times with recipe complexity to encourage additional parallel production, and more demand for common resources with less dependence on scarce Mythril. Use three processing stages before final core assembly, drawing on established intermediates. The earlier new Mythril Concentrate proposal is superseded.

Implemented Shiny chain:

| Stage | Machine | Inputs | Outputs | Base cycle |
| --- | --- | --- | --- | --- |
| Smelting | Smelter | 2 Mythril + 1 Charcoal | 1 Mythril Plate | 6 seconds, existing recipe |
| Dry alloying | Separator | 1 Mythril Plate + 4 Iron Plates + 1 Charcoal | 2 Pure Mythril + 2 Slag | 12 seconds |
| Fluid processing | Assembler II | 2 Pure Mythril + 1 Copper Wire + 2 Coolant | 1 Mythril Mesh | 18 seconds |
| Core assembly | Assembler II | 1 Mythril Mesh + 1 Hydro Piston + 2 Circuit A | 1 Shiny Core | 24 seconds, existing recipe |

This uses existing Mythril Plate, Pure Mythril and Mythril Mesh items; no new intermediate is needed. Smelting and dry alloying can operate near the Mythril deposit. Pure Mythril travels toward the lake; Mesh production now consumes local Coolant, followed by core assembly. Slag branches from dry alloying to local buffering or another suitable processing map.

Per Mesh, the Mythril-processing portion changes from 4 raw Mythril + 2 Charcoal + 2 Coolant + 1 Copper Wire to 2 raw Mythril + 4 Iron Plates + 2 Charcoal + 2 Coolant + 1 Copper Wire. Mythril demand halves, while four additional Iron Plates require eight Iron Ore and four more smelting Charcoal. Existing Hydro Piston and Circuit requirements for the final core remain unchanged. These costs are now implemented.

Increasing machine work creates a reason to scale parallel stages. With full inputs and no upgrades, one dry alloying furnace supplies 10 Pure Mythril and generates 10 Slag per minute. One Mesh assembler produces about 3.33 Mesh per minute; one core assembler produces 2.5 cores per minute. Supporting two core assemblers at 5 cores per minute therefore needs two Mesh assemblers and one fully supplied alloying furnace, plus smelting, circuits, actuators and Coolant. Ingredient buffers stay within five per type, and the alloying batch's four combined output items fit the five-item output limit.

The distinction is sustained pipeline throughput, rather than adding mandatory waiting after production. Optional upgrades may shorten the work; sufficient parallel base machines must also support progress. Exact cycle choices still need playtesting against the broader pacing goals.

Smelting and dry alloying together can send two Pure Mythril toward the lake instead of importing their eight solid supply items there: two raw Mythril, four Iron Plates and two Charcoal. That comparison assumes all those supplies would otherwise cross the lake boundary. Actual total transport depends on the location of iron, fuel, smelting and waste handling. Slag remains a separate cargo stream. One unupgraded alloying furnace generates 10 items per minute on each product branch, below a dedicated road's 12-item-per-minute rate, but the branches need separate material routes. Default road-channel limits must be considered when both outputs need the same adjacent sector.

Players can still transport raw Mythril and perform all stages at a lake. Pure Mythril is now a dry-produced solid; the mandatory lake-local step moves to Mesh production. Complex consumers are updated below. The old wet raw-Mythril recipe is replaced rather than retained as a bypass.

Mythril processing discovery now grants Mineral Recovery and Waste Handling immediately, alongside the Slag Hopper. Slag washing, Recovered Brick and Recovered Iron require no Shiny Core payment. Waste Bins, Sorters and Links are available with the same discovery; a Sorting Station still independently grants Waste Handling. Slag washing continues to consume local Water, so a recovery outpost needs a lake. Later tier-6 recovery recipes retain their Precision Control requirement. A Hopper alone only buffers waste. Waste export remains optional, and more storage can support less efficient layouts.

This discovery change is implemented. Existing Mythril processing discoveries receive the unlocks on load, and new encounters leave unrelated paid research selected. Mineral Recovery 1 still waits for Hydro access and Mineral Regeneration for Shiny access; their optional prices are unchanged. Verification: 234 tests passed, one skipped; TypeScript, production build and the progression analysis passed. The three-stage recipe changes above are now implemented.

### Implemented Complex production

Before this revision, Complex production consumed three Pure Mythril across Logic Wafer, Controller and Servo Piston. The agreed direction is to replace those direct inputs with Mythril Gear, Mythril Wire and Mythril Mesh respectively, reusing established production lines rather than bot components.

The earlier candidate of five Coolant in Servo Pistons is superseded by the Mesh decision. With the proposed wet Mesh recipe contributing two Coolant, three Coolant in the actuator preserves the current total of seven per Complex: two in its Hydro Piston, two in Mesh and three in final actuator processing. The quantities and work times below are now implemented.

The player requests another production layer using underused established intermediates, excluding bot components. Apply this direction to Complex by bringing Mythril Gear and Mythril Wire into its component branches. Both items already exist but currently have no manufacturing consumers. Copper Gear and Iron Wire have narrow uses in earlier cores, so use those production lines to supply the new preparation stage.

Implemented Complex recipes:

| Stage | Inputs | Output | Machine |
| --- | --- | --- | --- |
| Composite gear preparation | 4 Copper Gears + 1 Mythril Plate | 4 Mythril Gears | Assembler |
| Composite wire preparation | 4 Iron Wires + 1 Mythril Plate | 4 Mythril Wires | Assembler |
| Controller | 2 Circuit A + 1 Mythril Gear + 2 Copper Slurry | 1 Controller | Assembler II |
| Logic Wafer | 2 Circuit A + 1 Electrode + 1 Mythril Wire | 1 Logic Wafer | Assembler II |
| Servo Piston | 1 Hydro Piston + 1 Mythril Mesh + 3 Coolant | 1 Servo Piston | Assembler II |
| Complex Core | 1 Logic Wafer + 1 Controller + 1 Servo Piston | 1 Complex Core | Assembler II |

The new gear and wire recipes are alternate batch recipes unlocked with Precision Control. Retain the existing single-metal Refiner recipes as a rare-resource-intensive alternative. A Refiner has one input, so the two-input batch recipes belong on the regular Assembler. Four-item outputs and all ingredient quantities fit the five-item buffers. No new item types, bot parts or additional research gate are needed.

This adds preparation stages before the Complex components while retaining the actuator branch's alloying, fluid and waste requirements. At sustained batch utilization, one Complex consumes one Mythril Gear and one Mythril Wire, together averaging half a Mythril Plate, plus one Mesh containing two Pure Mythril. Combined with the proposed dry alloying recipe, this requires three raw Mythril per Complex on average, compared with six before this revision. Initial batches require whole plates and leave spare gears and wire; the average is not a first-core shopping list. Common-resource demand shifts toward Copper Gears, Iron Wire and Mesh supplies rather than disappearing with the reduction in Mythril.

Reusing Mesh in Servo Pistons is implemented. It makes Shiny's Mesh infrastructure useful again at Complex and creates competition between the two core lines for its output. Increase upstream Mesh capacity to sustain both; do not require Shiny Cores as an ingredient. Motors remain present through Hydro Pistons, so no additional direct Motor ingredient is added at this point.

Set preparation cycles below component cycles and component cycles below final Complex assembly, consistent with the agreed increase in work time with complexity. The implemented times and analytical machine ratios follow below. The intended bottleneck is supplying several specialized branches in parallel; avoid making any one branch require an efficiency upgrade to function. Final core assembly still has three ingredients, and all solid stages can be placed wherever the player chooses.

### Implemented work times and combined supply assessment

The following base times are implemented as the initial balance. Gameplay pacing still needs validation. Existing earlier recipes and optional efficiency research remain unchanged.

| Operation | Base cycle | Fully supplied output per minute |
| --- | --- | --- |
| Composite Mythril Gear or Wire batch | 12 seconds for four items | 20 |
| Dry alloying | 12 seconds for two Pure Mythril and two Slag | 10 Pure Mythril and 10 Slag |
| Mythril Mesh | 18 seconds | 3.33 |
| Shiny Core | 24 seconds, unchanged | 2.5 |
| Controller, Logic Wafer or Servo Piston | 30 seconds each | 2 of each component |
| Complex Core | 36 seconds | 1.67 |

The Complex component cycles increase from 12 seconds for Controllers and 16 seconds for Logic Wafers and Servo Pistons. Final Complex assembly increases from 30 seconds. Equal component cycles make the three branches easy to match; complexity comes from their different upstream supplies. Longer cycles require parallel production for high output but introduce no additional timer or mandatory upgrade.

At five Shiny and five Complex Cores per minute, the core stages require two Shiny assemblers, three Complex assemblers and three assemblers for each Complex component. Together they consume ten Mesh per minute, supplied by three Mesh assemblers and two dry alloying furnaces. One composite Gear assembler and one composite Wire assembler each have ample capacity for Complex's five-per-minute demand. These are theoretical capacities with continuous inputs and clear outputs, excluding the many upstream machines, delivery delays and waste-handling interruptions; no throughput reserve is included at fully utilized stages.

The same combined target generates 20 Slag per minute and consumes 20 Pure Mythril per minute. Neither stream fits on one 12-item-per-minute road. Split production across suitable maps and routes or use unlocked road channels. Two furnace branches at ten items per minute each fit separate dedicated roads. This is an intended reason for distributed processing, not a reason to increase road speed.

Gross primary inputs below assume the proposed efficient composite recipes, sustained batch utilization, no waste recovery credits, no bots, and no construction or research costs beyond producing the cores:

| Core | Raw Mythril, previous to current | Iron Ore, live to proposed | Copper Ore, live to proposed | Wood, live to proposed | Water, live to proposed |
| --- | --- | --- | --- | --- | --- |
| Shiny | 4 to 2 | 16 to 24 | 24 to 24 | 22 to 26 | 8 to 8 |
| Complex | 6 to 3 | 23 to 37 | 45 to 55 | 38.5 to 50 | 17 to 17 |

Complex also consumes one Stone per core in both versions. Fractional costs represent averages over whole batches. Reducing rare Mythril therefore still increases extraction, smelting and fuel demand for common resources. At five of each core per minute, gross supply is 25 Mythril, 305 Iron Ore, 395 Copper Ore, 380 Wood, 125 Water and five Stone per minute. This scale needs substantial upstream capacity; extra final assemblers alone will not achieve it.

A purchase priced at 26 of each core takes at least 15.6 minutes of Complex output from one final assembler, versus 5.2 minutes from three, after startup and provided every earlier core arrives fast enough. These are production bounds, not complete purchase times. The result supports scaling, but also cautions against increasing research or Map Node prices again before playtesting: expensive common-resource supply and the slower component stages already add meaningful work.

Implementation verification: 255 tests passed, one skipped; TypeScript, production build and progression analysis passed. Simulation coverage exercises the revised recipes at their base times with five-item buffers, composite recipe unlocks, output backpressure and preservation of committed batches on reload. Existing factories need their ingredient connections updated for the changed recipes. Recipe references and analytical cost reports are regenerated; these checks do not substitute for a new pacing playtest.

### Implemented Map Node scaling after Simple

Later phases introduce the next scheduled core at one more than the preceding phase's final price, then increase the amount by 1 every two purchases. Every required core uses the same amount. Keep the existing core-access fallback, fixed active quotes, earned Map Points and full-world purchase limit.

| Purchase numbers | Highest scheduled core | Amount of each required core |
| --- | --- | --- |
| 1–9 | Simple | 5 throughout |
| 10–19 | Basic | 6, 6, 7, 7, 8, 8, 9, 9, 10, 10 |
| 20–29 | Automata | 11 through 15, each price lasting two purchases |
| 30–39 | Hydro | 16 through 20, each price lasting two purchases |
| 40–49 | Shiny | 21 through 25, each price lasting two purchases |
| 50–59 | Complex | 26 through 30, each price lasting two purchases |
| 60–119 | Complex | 31 through 42, each price lasting five purchases |

This gives a newly required production chain a lower entry price before demanding more sustained output. It adjusts exploration demand without increasing capability-unlock prices or changing efficiency research. Supply ratios, transport and productive use of the new maps still need playtesting; this schedule alone does not establish the final pacing.

### Bottleneck emphasis by tier

Simple, Basic, Automata and Hydro retain their existing recipes. The revised Shiny and Complex requirements and timings are implemented.

| Core tier | Bottleneck to emphasize | Scaling response |
| --- | --- | --- |
| Simple | Copper extraction and smelting volume | Expand extraction, charcoal supply and smelting capacity. |
| Basic | Balance copper plates against iron-intensive wire | Build separate supply branches with suitable production ratios. |
| Automata | Coordinate specialized production and delivery to Home | Let players discover the transport advantage of outpost assembly; Home assembly and ingredient delivery remain viable. |
| Hydro | Water cannot currently travel between maps; shared Coolant supply constrains growth | Establish lake-local fluid processing, balance imported and local solids, and ship transportable products toward Home. |
| Shiny | Separate mining, alloying, waste handling and slower lake-based production | Reuse Mythril Plate, Pure Mythril and Mesh; shift bulk demand toward common iron and scale parallel stages. Recipes and timing implemented. |
| Complex | Prepare underused gears and wire, then synchronize advanced component branches | Expand Copper Gear and Iron Wire supply, prepare Mythril Gear and Wire, and balance fluid processing and waste outlets. Recipes implemented. |

Scaling often means more upstream machines and working outposts. Adding core assemblers helps only when their ingredient supply can sustain them. Optional efficiency investment should improve either approach without becoming a required gate.

### Proposed evaluation plan

1. Keep introductory access affordable so the player can build and understand the new chain.
2. Identify a meaningful production milestone within each tier that benefits noticeably from sustained output.
3. Keep earlier core supply relevant as later research progresses. Evaluate changes within the existing equal-core rule; unequal quantities would be a separate design decision.
4. Model achievable throughput from extraction through processing and transport to the Home Research Center, both with and without optional upgrades.
5. Set research prices from those production targets, then playtest overlapping exploration, construction and research. Increasing prices alone is not evidence of a better scaling challenge.

The conversation suggested 6–10 minutes for a modest line versus 2–3 minutes for an expanded factory to fund a major milestone. These are unapproved test candidates, not adopted pacing goals or mandatory idle waits. They must be reconciled with the existing three-hour tier-6 and longer endgame goals before use.

### Next discussion

Assess exploration and outpost value, including route access for the separate Pure Mythril and waste streams. Validate the implemented recipe costs and work times during the next playtest. Preserve Hydro's deliberate water restriction and the flexibility of solid-material routes. No additional price increase is proposed from this assessment.

The next problem is whether discovered maps offer enough useful route choices for this distributed production. One alloying furnace can export each of its two outputs within separate road limits, but a single-channel boundary cannot carry both materials. Road Channels 1 already provides an optional solution after Ore Separation at 2 each through Hydro; local buffering and different destinations remain alternatives. The channel-access price is now reduced as recorded below; evaluate workable layouts before adding a new logistics system. The aim is to make an additional map useful for production or routing, while avoiding an accidental requirement to buy many unused maps just to find a viable route.

## Problem 3 Exploration and useful transport routes

**Status: Road Channels 1 reduced to 2 each through Hydro. Normal-play outpost use verified through Shiny and Precision Control on November 1. Complex routes and transported waste remain untested.**

The first constraint is at Home, not at the Mythril deposit. Maps have four cardinal neighbors. Under the intended one-channel-per-direction limit and single-material road rule, Home can receive four distinct continuously imported materials before Road Channels 1. Shiny introduces a fifth core type and Complex a sixth. Buying a wider outer network cannot create a fifth Home neighbor. Players can still produce some cores at Home or switch deliveries and buffer them locally, so this does not prove progression is impossible; it makes the desired permanent distributed-core network depend on increased channel access.

Road Channels 1 unlocks after Road and Ore Separation. Its previous price was 60 each through Hydro, or 240 cores total; its current price is 2 each through Hydro, or eight cores total. It doubles channels per direction, allowing up to eight distinct incoming streams around Home when all four neighboring maps are connected and there is space for the endpoints. That capability also helps separate product and waste streams, but its current price makes basic access to the intended late-tier layout a substantial investment.

Implemented fix: keep its prerequisites and two-channel effect, but price Road Channels 1 at 2 each through Hydro, consistent with other capability unlocks. Leave Road Channels 2 at 130 each through Shiny as the larger optional capacity investment. Keep roads single-material, solid-only and fixed at one item every five seconds. Do not change map prices or generation as part of this fix. This makes more routes affordable without making bulk shipments faster or teaching an overt preferred strategy.

**Road Channels 2 (November 7, 2026, NODE-0331).** The third slot costs 20 each of Simple, Basic, Automata and Hydro Cores, for 80 total. Completing Road Channels 1 and Ore Separation makes this purchase available. It adds a third slot to every map face, counting sending and receiving endpoints together. The lower price gives players a way to connect new supply sectors when both slots on an existing border are in use.

Next, assess the value of the maps themselves. Ordinary resource-bearing non-Home maps already provide Iron, Copper, Stone and Forest, with larger reserves farther from Home. Lakes, Mythril and special encounters add geographic differences. A map can therefore support supplies or processing as well as transit; determine through playtesting whether this works in actual layouts before adding new map rewards or mandatory expansion requirements.

Implementation issue noted during inspection: `reverseRoad` does not check the outgoing channel limit in its new direction, whereas placement checks it. Queue a regression check and matching validation when revisiting road enforcement; exploiting reversal is not a valid solution in balance calculations.

### Next discussion

Assess whether ordinary and special maps provide enough productive reasons to expand. Road Channels 1 is now affordable at Shiny entry; no other research or map prices changed.

Verification of the price change: 257 tests passed, one skipped; TypeScript, production build, the core design model and the progression analysis passed. Fixed paid research now consumes 58 fewer of each of the first four cores, a reduction of 232 cores total. Map purchase totals and production recipes are unchanged by this adjustment.

### Ordinary outpost value assessment

Ordinary resource-bearing non-Home maps already contain Iron, Copper, Stone and Forest. Their reserve limit grows from Home's 1,000 to 1,500 at distance one and 3,000 at distance four. Greater reserves extend the useful life of a mining outpost; they do not directly increase extraction speed. This guarantee does not apply to exhausted tier-ten maps.

The revised recipes give these existing resources a use near the special resource: a Mythril map can supply iron and fuel for dry alloying, and a lake map can support solid inputs for fluid-dependent production. No extra loot or map-specific bonus is proposed yet. The next gameplay evaluation should record which purchased maps supply resources, manufacture goods, handle waste or only relay transport. Check whether relay-only purchases consume a disproportionate share of expansion before changing generation or prices. Do not impose a required count or percentage of productive maps on the player.

### November 1 playtest evidence through Shiny

Seed `1875186765`, normal simulation and normal UI actions. No grants, accelerated time, save injection, gameplay source edits or balance changes were used. The browser was recovered using the procedure in [browser-playtest.md](browser-playtest.md). No progression blocker required a code fix. The game is paused at a preserved checkpoint; this is not a completed Complex or endgame run.

| Map | Observed role |
| --- | --- |
| Home 5,5 | Simple and Basic Core production; sole Research Center; receives Automata, Hydro and Shiny. |
| 6,5 | Makes Automata Cores from local resources and Motors for the lake; relays Hydro and Shiny on separate routes. |
| Lake 7,5 | Local Water, Stone, Copper and Wood processing; makes Hydro components and cores, Mythril Mesh, Circuits and Shiny Cores. Copper extraction was expanded when shared wire supply constrained the new tier. |
| 8,5 | Makes Iron Plates for the lake and mine; also relays Pure Mythril. |
| Mythril 9,5 | Makes Mythril Plate and Pure Mythril near the deposit. Stores Slag in a separate hopper. The deposit spawned naturally. |
| Lake 6,6 | Hydro relay only so far; its water and other resources have not been used. |
| 5,6 | Hydro relay only. |

Four of six purchased maps currently support production; two serve only as transit. This is a description of one layout, not a target ratio. Six map activations used the initial Exploration point plus five Map Node purchases. The direct research price for those points was 26 Simple and 1 Basic Core, including Exploration. The two Hydro bypass maps accounted for 10 Simple Cores. No additional map reward or price increase is justified by this single run.

Fluid Routing completed at 62:35, Ore Separation at 67:32, Road Channels 1 at 69:14 and Precision Control at 82:01 of elapsed game time. The saved checkpoint is 85:55, with 54 Simple, 28 Basic, 86 Automata, 37 Hydro and 3 Shiny Cores produced. These are cumulative production totals, including buffered cores, not research expenditure. Extraction totals are 1,878 Wood, 2,002 Copper, 1,420 Iron, 204 Stone, 525 Water and 76 Mythril. Building, routing, inspecting reports and repairing operator mistakes consumed substantial elapsed time; this run does not isolate minimum production waiting or establish an optimized completion time.

The intended division of work is viable through Shiny: dry separation at the mine, fluid-dependent Mesh and core assembly at a lake, and finished cores delivered Home. Common inputs became relevant bottlenecks: Iron Plates supply both alloying and lake processing; Copper Wire supplies fluid chemistry, Mesh and Circuits. Dedicated Filters allow a single-material road to feed a machine or Research Center that stores several ingredients or core types.

The first Hydro route needed two extra maps because the existing east-to-Home boundary already carried Automata before Road Channels 1 was available. This was a workable layout cost, not a demonstrated progression deadlock. Extra road endpoints can also fail placement when their paired endpoints lack clearance on the neighboring map. Compact sockets, unclear cable rejection and placement overlays added interface friction; queue these separately from production balance.

The next unresolved transport test is Complex entry. The lake's eastern incoming routes currently carry Iron Plate and Pure Mythril; Complex's composite intermediates also need Mythril Plate. An in-game option is to produce Iron Plates from the lake's unused local deposit and repurpose that supply route for Mythril Plate. Another is to expand the route network. Neither option has been performed yet, and no channel or recipe change is proposed before testing it. Slag buffering worked, but exporting waste and recovering it on another map remain unverified.

Evidence: [checkpoint](../outputs/outpost-playtest/precision-control-checkpoint.json), [run log](../outputs/outpost-playtest/run-log.txt), [measured results and limitations](../outputs/outpost-playtest/results.txt).

### Completed Complex and remote waste test, November 1

The same seed `1875186765` continued from the preserved 85:55 checkpoint. Autonomous Logistics completed at **133:30**, using two normally delivered sets of all six core types. The run was paused at **134:38** before any queued source change. This completes Complex production/delivery and remote Slag recovery; Endgame Theory and the camp/robotics branches were not tested to completion.

Mythril Plate and Slag used separate northern routes from 9,5 through 9,4, 8,4 and 7,4 into lake 7,5. Complex Cores returned through 7,6, 6,6 and 5,6 to Home. Four new Map Node purchases cost 20 Simple Cores; total direct map-access research cost was 46 Simple + 1 Basic including Exploration. Eleven maps were active: Home, four productive outposts and six relay-only maps. This layout demonstrates alternative routes, while also showing that a relay-heavy solution is possible. It does not establish a mandatory expansion cost or justify a generation/price change.

The lake washed **56 imported Slag**, producing **28 Aggregate and 14 Residue**, and made **5 recovered Bricks and 7 recovered Iron Plates** that joined ordinary production. Eighteen Aggregate remained buffered. Recovery backed up when its product consumers filled. Complex's actual one Metallic Fines and one Glassy Crust reached the normally unlocked Waste Bin; every random waste-recovery variant was not exercised.

Cumulative extraction at pause was 3,855 Wood, 3,798 Copper, 2,770 Iron, 274 Stone, 1,038 Water and 588 Mythril. Core production was 76 Simple, 30 Basic, 88 Automata, 69 Hydro, 12 Shiny and 2 Complex. These totals include research, buffers, surplus and operator routing mistakes; they are not minimum recipe costs. Copper Wire competed among Dispersion, Ceramic, Mesh and Circuit production. An additional Copper Extractor, Copper Smelter and Wood/Kiln branch increased normal capacity; Circuits were temporarily prioritized for Logic Wafer, then the split restored.

The clock includes substantial building, routing, controller and inspection overhead. A mistaken late Wood cable also replaced the coolant relay supply, leaving the saved coolant branch contaminated; earlier legitimate component stock allowed the final two Complex Cores. Another unused relay retained mistakenly supplied Copper Plates. Both have ordinary in-game repairs through filtering/draining and reconnection. Do not interpret those operator mistakes as recipe failures, or claim this checkpoint proves sustained Complex throughput. Improved socket targeting and rejection feedback address the observed interaction friction. No grants, save injection, time acceleration, efficiency upgrades or gameplay-rule edits were used during the measured run.

Evidence: [final report](../outputs/outpost-playtest/command-complete.json), [research completion screenshot](../outputs/outpost-playtest/command-complete.png), [full results and limitations](../outputs/outpost-playtest/results.txt). Efficiency research remains deferred. A future pacing test should measure a repaired, stable network over time and separate active setup from production waiting before changing resource costs or timers.

## Problem 4 Production branches converging on Home

**Status: Design direction confirmed November 1. Complex delivery through an alternative route verified; retain current transport rules.**

The player should be able to design production networks like a tree, with outer branches supplying increasingly central processing and core deliveries that converge on Home. Alternative paths through map nodes are part of this planning challenge. A full boundary on one particular route is a reason to consider another path, specialize another outpost, or process available resources locally; it is not by itself a transport-rule defect.

At lake 7,5, producing Iron Plates locally to free an import channel for Mythril Plate is one valid response. Expanding through other map nodes is also valid. Do not treat that lake, that route, or local iron production as a prescribed solution. The tree is a desired network pattern, not a new restriction requiring an acyclic graph or forbidding cross-connections.

Continue to make finished-product transport an efficiency advantage that players discover through production ratios and fixed road throughput. Bulk resource or intermediate delivery remains viable. No extra transport pricing, material tiers, channel increase, or overt tutorial rule is adopted here. The existing affordable Road Channels 1 supports convergence near Home. The pending Complex test should respect those rules and explore normal routing and factory choices.

## Problem 5 Recipe complexity and intermediate reuse

**Status: Agreed recipe structure implemented and Complex delivery verified. Sustained production pacing remains unmeasured.**

The adopted Shiny stages and Complex's three parallel component branches already reuse the established intermediates recorded above. Retain that structure for the next gameplay test rather than reopening those decisions or adding another recipe layer. Distinguish missing production capacity from confusing UI feedback when evaluating the resulting bottlenecks. Efficiency research remains deferred as agreed.

## Problem 6 Connection feedback

**Status: Approved interface changes implemented after the completed, paused run on November 1.**

During this run it was difficult to distinguish a cable blocked by an obstruction, an incompatible ingredient socket, and a drag that never attached. Existing road-material conflicts already have a warning notice in `App.tsx`; other rejected connections do not have equivalent feedback. The renderer also excludes world-blocked targets from its valid snap candidates, so a release can fail before the application can explain the obstruction.

Approved design: when a player releases an invalid connection, show a small but noticeable notification near the mouse cursor. Give a short, specific reason, such as the blocking obstruction or required socket material. Clicking the notification opens a fuller explanation of the failure and an actionable remedy. Preserve all collision, material, capacity and progression rules. Use consistent feedback for road-material conflicts and other rejected connections; intentional cancellation should not produce an error.

Dismiss the compact notification when the player takes another action. Treat clicking the notification as its own action: open the explanation before any general dismissal handler clears the notice. Passive pointer movement must allow the player to reach the notice. Place it with a small offset from the failure position, keep it within the viewport, and avoid covering the attempted socket. Opening its explanation must not also start a canvas action underneath. The notice should be a keyboard-accessible control, and the explanation should be dismissible. These interaction details support the approved cursor-local design; they do not add gameplay rules. Implemented after the playtest ended, as recorded below.

### Approved: compact socket targeting

At low zoom, neighboring socket hit regions and compact logistics bodies can overlap enough to make the intended target difficult to select. Zooming was an in-game workaround during testing, but the interaction overhead should not be mistaken for production difficulty.

Approved fix: preserve compact visuals while making socket targeting resolve predictably to the nearest socket under the pointer. Expand interaction targets only where neighboring targets do not compete, highlight the socket that would receive the cable before release, and retain a reliable area for selecting or configuring the node body. Keep invalid targets identifiable so the approved rejection notice can explain a failed attempt. The player chose this option rather than visually enlarging sockets while dragging. Implemented after the run.

### Approved trial: explaining production waits and full buffers on hover

The canvas already indicates missing inputs and blocked outputs, and the inspector shows stored materials. However, the inspector omits zero-count ingredients from its buffer list and does not consistently state the ordinary production reason for an idle machine. A player may have to compare the recipe with several buffers to tell whether a machine lacks an ingredient or cannot empty its output. This can make a valid production bottleneck look like a broken factory.

Approved trial: explain the existing production cues on node hover, with precise available/required ingredient counts and output or waste-capacity details in the inspector. Use the simulation's actual production conditions, including an active committed batch, when explaining the state. Keep the canvas compact and avoid generating notifications for routine production waits. No recipe, storage or timing change is adopted. Implemented after the active run; evaluate the trial wording during subsequent play.

### Approved: teach Shift-repeat placement

The Build catalog instructs players to choose a node and click repeatedly, but a successful plain placement currently clears the selected schematic. The renderer passes Shift as the repeat flag, and `App.tsx` retains placement only when that flag is set. The playtest therefore involved repeatedly opening Build to scale production. This is an interaction mismatch, separate from machine construction time or resource cost.

Decision: retain the current placement controls. A normal successful placement ends placement mode; holding Shift while placing retains the same schematic for another placement. The player rejected making repeat placement the default and requested that the tutorial explain the Shift option clearly.

Implemented tutorial wording: "Click to place one node. Hold Shift while clicking to keep placing the same node. Press Escape or right-click to cancel placement." Introduce this alongside the tutorial's first construction instruction and align the Build catalog's misleading repeated-click hint with the existing controls. This is an instruction change, with no construction-time, cost, unlock, collision or road-channel changes. Implemented after the active run.

### Approved: road-placement rejection feedback

A road can fit on the current map but fail because its paired endpoint overlaps something on the adjacent map. Available channel count also constrains placement. The current placement feedback gives a generic instruction to find open space and an available channel, leaving the player to work out which map or condition caused the failure.

Approved wording: use **"Road placement unavailable"** for the compact cursor-local notice. Keep the brief message simple; clicking it opens the specific reason, such as local clearance, a blocked endpoint on an adjacent map, or a full channel allowance. Identify the affected map when relevant. Preserve the approved next-action dismissal behavior. Retain all placement and channel rules, and make the preview and committed placement use consistent validity checks. Implemented after the run.

### Approved: placement hints pass clicks through to the field

The placement banner sits over the playfield and intercepts clicks on its text or background. Several attempted placements during the run landed on that banner instead of the canvas. The banner should help the player place a node without making the underlying location inaccessible.

Approved fix: let pointer input pass through the banner's informational text and background to the field while retaining an interactive cancel button. Keep the hint legible and preserve Escape/right-click cancellation. Clicking Cancel must cancel placement without placing a node underneath it. Implemented after the active run.

### Post-run implementation and verification

All six approved interface changes below are implemented: cursor-local expandable connection/placement failures, nearest-socket targeting with compact selectable bodies, live production-wait hover/inspector explanations, clear Shift-repeat instructions, specific road-placement explanations with consistent preview/commit checks, and click-through placement guidance with an interactive Cancel button. Invalid socket targets remain identifiable and highlight before release; cancellation does not report an error. A related queued road-reversal bug is also fixed: reversal cannot exceed the existing outgoing-channel allowance, and rejected reversal leaves cables and stock intact.

Verification: 296 tests passed and one skipped; TypeScript and production build passed. Browser checks on the preserved game confirmed incompatible-socket and road-channel explanations and exact ingredient quantities. Isolated Basics practice confirmed the tutorial wording, Shift-repeat, plain single placement and successful placement through banner text/background. No recipe, rate, research price or generation rule was changed by this interface work. The earlier references to queued implementation in this design record describe the agreement before the run ended.

## Remaining discussion sequence

| Order | Topic | Current status |
| --- | --- | --- |
| 1 | Efficiency research payoff at scale | Deferred; current six-rank system retained. |
| 2 | Progression demand and distinct tier bottlenecks | Tier roles agreed; Shiny and Complex recipe changes implemented, pacing needs playtesting. |
| 3 | Exploration costs, discovery guidance and useful outposts | Current prices and two-channel access retained. Complex delivery and remote Slag recovery verified; relay-heavy layout costs recorded. |
| 4 | Permanent intermediate and core routes toward Home | Tree-like convergence and alternative paths confirmed. Local processing and route expansion are intended responses to bottlenecks. Retain current rules; alternative Complex route verified. |
| 5 | Recipe complexity and the reuse of intermediates | Previously agreed structure implemented. Retain recipes for the next test; Complex pacing remains unverified. |
| 6 | Placement, socket and buffer feedback | All six agreed interface changes implemented and checked after the measured run. |

Road Channels 1 now has the adopted cheaper access price. Earlier suggestions for broad clues about unvisited sectors and larger main research bills remain unapproved discussion options.

The current interface review and requested Complex/remote-waste test are complete. Preserve the final paused 134:38 checkpoint and its evidence. Before further balance changes, repair the retained operator routing mistakes through normal gameplay and measure stable Complex throughput, setup time and active production waiting separately. Keep the efficiency-research discussion deferred until explicitly revisited.

## Evidence and related documents

- [Current research catalog](research-catalog.md): implemented costs, prerequisites, optional upgrades and planned tier 7 content.
- [Map expansion plan](../outputs/progression/map-expansion-proposal.md): the implemented six-core schedule for access to 121 maps, core-access safeguards and active research quotes.
- [Completed browser playtest](../outputs/fresh-run-3/results.txt): observed resource costs, elapsed time, route and issues. Its 1:45:42 clock includes UI operation and exploration detours. It predates the revised efficiency ranks and Map Node price schedule, so its older prices and timing do not establish the balance of the current version.
- [Playtest log](../outputs/fresh-run-3/run-log.txt): detailed observations and preserved checkpoints.

This document is the continuation point for the conversation. Update agreed direction, proposal status and the next discussion as each problem is settled; keep implementation facts in the research catalog.
