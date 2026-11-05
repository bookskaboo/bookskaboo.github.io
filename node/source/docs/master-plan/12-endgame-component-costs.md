# Endgame component cost model

**Current revision — November 5, 2026 (NODE-0321):** explicit user quotas replace five-minute sizing for Alpha (50 AP), Foundry (50 Circuit B / 25 Sealed Frames / 100 Mythril Gears) and Grove (500 growth). Reclamation retains its five-minute credits. Endgame Theory is retired. Victory is a manually selected Research Center project costing one each of all seven Core types; producing a Final Core alone does not win. See [current implementation](20-endgame-implementation.md).

## Agreed target

Q73, November 3, 2026: one unit of each of the four corner components should have a similar overall base-resource cost. Derive corner recipe amounts and AP requirements together against a shared budget. The Foundry ten-of-each suggestion is not adopted. This unit comparison does not settle the ingredient counts in the final Core recipe.

Each corner can emphasize different materials, logistics and mechanics. Use the same accounting assumptions for all four. Keep resource quantities, aggregate machine work, acquisition and delivery constraints visible; Q80 adopts a provisional equal-unit material score with Water reported separately. Q81 adopts a plus/minus ten percent band around the eventual common score. Q87 adopts 10,000 AP per Alpha as the starting anchor, approximately 290,824 reference material points per component.

## Adopted comparison baseline

Q79, adopted November 3, 2026: first compare all four components using standard ingredient recipes, including their full upstream supplies and adopted mandatory recovery/upkeep rules. Declare acquisition assumptions for Mythril and the AP-bot mix, account for co-products once, and report resource-saving composite/alternative recipes as separate optimization scenarios. This reference does not force a player recipe choice. Speed upgrades, transport and setup remain distinct from per-unit material cost.

The user selected standard recipes first, with optimization savings reported separately. Q80 subsequently adopts provisional material-score weights; Q81 adopts plus/minus ten percent tolerance; Q87 subsequently adopts the derived starting common material target. The gross manufacturing tables below remain explicitly limited reference calculations under their stated assumptions.

## What is still needed

| Component | Agreed input mechanism | Missing for unit costing |
| --- | --- | --- |
| Alpha | 10,000 accumulated bot AP per Alpha (Q87), surplus carries | Runtime implementation, supply/delivery and pacing validation; Q82 fixes the material reference |
| Foundry component | Fixed node; 3,000 each Circuit B, Sealed Frame, Mythril Gear → 1 component (Q88) | Craft cycle, consumption/storage, output/full-box rules and runtime implementation |
| Reclamation component | Q74 adopts acceptance of all four waste types and factory-wide collection | Type-specific credit values, threshold, yield and timing; Q76 settles lossless full-box pause |
| Grove component | 2,000,000 supplied regeneration → 1 component (Q89); upkeep Q78A | Intake, progress/output rules, runtime implementation and validation |

Finish reclamation co-product accounting and derive the remaining corner quantities against the adopted starting target. Compare per-unit resource cost separately from component production rate and first-victory travel/setup work. Alpha has a repeated cost per defeat; the Mythril Golem 20,000-AP cost is a separate one-time supply investment, not the Alpha threshold.

## Transparent manufacturing reference

The following is a calculation from the current recipe catalog using ordinary recipes, including ordinary Mythril Gear/Wire recipes. It excludes composite/optional variants, recycling credits, Dwarven suppression supply, Golem investment, extraction/transport work and the Foundry craft itself. Mythril is shown as raw material here; its acquisition costs must be added before claiming complete cost parity. Machine-seconds sum all crafting work at base cycles and are not elapsed player time. Per-unit bills average multi-output recipes over complete batches; producing the first isolated item can require extra inputs and leave intermediate stock.

| One manufactured item | Iron | Copper | Wood | Stone | Water | Mythril | Machine-seconds |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Circuit B | 0 | 9 | 5 | 1 | 1 | 0 | 67 |
| Sealed Frame | 18 | 12 | 15 | 2 | 4 | 0 | 219 |
| Mythril Gear | 0 | 0 | 2 | 0 | 0 | 4 | 22 |
| One of each | 18 | 21 | 22 | 3 | 5 | 4 | 308 |

The unadopted ten-of-each example therefore costs 180 Iron, 210 Copper, 220 Wood, 30 Stone, 50 Water and 40 Mythril, with 3,080 aggregate machine-seconds before Foundry processing and omitted acquisition/transport. This is a reference example, not a selected recipe.

| One standard bot | AP | Iron | Copper | Wood | Stone | Water | Mythril | Machine-seconds |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Medium | 3 | 34 | 20 | 27 | 2 | 8 | 0 | 402.5 |
| Heavy | 8 | 72 | 57 | 70 | 3 | 17 | 5 | 990 |
| Command | 20 | 153 | 171 | 188.5 | 3 | 67 | 33 | 2,765.75 |

The Foundry ten-of-each example is roughly on the manufacturing scale of one Command Bot, before the listed omissions. A very high-AP Alpha defeat can require many bots. This demonstrates why arbitrary Foundry counts cannot establish parity. Do not assume Command Bots are the least-resource route: compare feasible bot mixes, ordinary/composite recipes, alternative production and resource acquisition consistently.

## Waste diversion and shared production

Q74 assigns a component to waste reclamation, intended to encourage restructuring the overall factory. Accept all four current waste types. Q75 adopts any-mixture credit accumulation in one meter, with no mandatory all-type quotas. Type-specific values, threshold and timing remain to calculate; a single waste type is a valid supply scenario.

Waste is co-produced with useful parts, including parts serving the other corners. Compare the resource bill for producing the combined component set and record incremental/allocated per-component cost transparently. Do not charge all manufacturing inputs independently to both the useful output and its waste. The agreed comparable-cost target remains; a final allocation/credit model is still needed.

Local recycling remains a meaningful alternative to endgame delivery:

| Diverted waste | Foregone adopted local recovery | Recovery inputs/work avoided when diverting |
| --- | --- | --- |
| 4 Metallic Fines | 1 Iron Plate | 1 Water, 10 Hydro Plant base seconds |
| 4 Spent Flux | 1 Coolant | 1 Water, 10 Hydro Plant base seconds |
| 4 Glassy Crust | 1 Copper Plate | 1 Water, 10 Separator base seconds |
| 4 Slag | 1 Brick | 1 Water, 10 Hydro Plant base seconds |

This is an opportunity-cost reference, not assigned reclamation credits. Include the saved recovery inputs/work and the component route's own logistics; do not value diversion only as the full recovered product or treat every byproduct as cost-free. Count effects once across the combined factory.

## Complete comparison checklist

- Expand every required intermediate through its chosen recipes to raw-resource quantities.
- Include AP-bot manufacturing and the chosen Mythril acquisition route. Dwarven upkeep can itself consume Mythril through advanced bots, so account for net supply without double-counting it.
- Credit recovered resources once, including their Water and machine requirements. Apply the adopted waste changes when modeling intended design rather than retaining obsolete Slag/chance-output assumptions.
- State how ordinary, composite and optional researched recipes are used. Keep a common reference and report optimization scenarios separately.
- Compare full-batch quantities and carryover, not fractional bot payments at individual checks.
- Report resource baskets and production work alongside delivery capacity, travel, setup and geographic constraints. Water and Mythril do not acquire equal value merely because both are counted as one item.
- Use Q87's starting common unit-cost target to derive Foundry and Grove quantities, then reconcile reclamation co-product accounting and combined-factory costs before claiming four-corner parity. Set cycle/rate targets separately.

No balanced endgame component prices, elapsed completion time or playtest result is claimed here. Q80 adopts a provisional analytical score, not validated final prices. Source recipes are in [progression.ts](../../src/content/progression.ts) and [recipes.ts](../../src/content/recipes.ts); adopted changes are in [economy design](03-progression-and-economy.md) and [world design](04-world-and-encounters.md).

Q76 adopts pausing intake/consumption while the component box is full, preserving credit and existing stock and resuming when space returns. This can back up a factory-wide waste route; include overflow/recycling infrastructure in the comparison. Continued disposal while full is not adopted. Q77 adopts regeneration supplied by Tree Planters. Q78A adopts upkeep; Grove conversion still needs definition before its unit cost can be compared. Current runtime free operation is not the intended cost basis.

Q77A randomizes challenge-to-corner assignments at new-game creation. Cost rows identify mechanisms/components, not fixed compass positions. Q78 requires Wood plus small amounts of other resources. Q78A adopts ten Wood + one Iron Plate + one Stone funding one hundred growth; ordinary manufacturing gives 0.11 Wood, 0.02 Iron, 0.01 Stone and 0.095 Smelter/Kiln machine-seconds per growth before extraction, planter processing and delivery. These upkeep values are adopted design, not implemented runtime. Grove threshold remains open. If Wood supply itself uses paid Tree Planters, account for their net usable Wood and supporting inputs rather than counting the same growth for both Forests and Grove.


## Expanded standard supply reference (Q79)

The [analytical resource vectors](../../outputs/planning/endgame-standard-reference.json) expand ordinary recipes with the adopted future rules, rather than claiming current runtime balance. Two declared supply scenarios pay Dwarven upkeep with standard Medium Bots: the tier-4 starter (6 AP for 12 Mythril/minute) and tier-9 Kingdom (72 AP for 288 Mythril/minute). These are comparison scenarios, not a required player strategy. Both assume full suppression, continuous demand, no lost stock and whole batches averaged over sustained output. Golem capital, initial suppression, research, extraction work and transport are excluded and must be compared separately.

All replacement Wood in these scenarios uses paid Tree Planters, with natural regeneration excluded. Harvesting G Wood costs 0.11G Wood in upkeep, leaving 0.89G for manufacturing. Thus net manufacturing demand W requires G = W / 0.89 harvested Wood, plus 0.02G Iron and 0.01G Stone. This closes the forestry feedback loop; Grove growth cannot also replenish a Forest.

| Reference unit / supply scenario | Iron | Copper | Harvested Wood | Stone | Water | Raw Mythril flow |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| One each B/Frame/Gear, starter Mythril | 41.566 | 34.333 | 44.944 | 4.783 | 10.333 | 4 |
| One each B/Frame/Gear, tier-9 Mythril | 30.030 | 27.667 | 34.831 | 4.015 | 7.667 | 4 |
| One AP supplied by Medium Bots | 11.536 | 6.667 | 10.112 | 0.768 | 2.667 | 0 |
| One Grove regeneration, including forestry self-upkeep | 0.02247 | 0 | 0.12360 | 0.01124 | 0 | 0 |

One each is a costing reference, not an adopted Foundry recipe. Raw Mythril flow is retained alongside the resources spent acquiring it. The JSON also compares Heavy and Command AP supply. Intended standard Complex production yields four guaranteed Fines per bot; keeping those for reclamation and recovering them locally are mutually exclusive cases, not two simultaneous credits. Medium Bots use fewer raw units per AP in these illustrative scenarios, while stronger bots deliver more AP per transported item. Neither establishes the best factory without machine/transport comparisons.

### Adopted provisional material score (Q80)

Q80, adopted November 3, 2026: for the first numerical pass, use one point per raw Iron, Copper, harvested Wood, Stone and Mythril unit, with all upstream supplies included. Report Water quantity/rate separately alongside processing and delivery. Preserve each resource basket so this simple index can be replaced after validation; it is not a claim of equal scarcity or equal player effort.

Counting every raw unit equally, including Water, makes the foregone-recovery score for four Slag zero: one Brick replaces one Stone but recycling spends one Water. That cancellation is an artifact of the weights, not proof that Slag has no value. Q75 still requires positive credit for every accepted waste type. A material-only index avoids that specific cancellation; it does not settle final reclamation credit values or co-product allocation. The user selected option 1. Equal weighting including Water and deferring the score are not adopted. No component budget, Alpha threshold, reclamation credits or Grove conversion is adopted by this score choice.


The provisional score is Iron + Copper + harvested Wood + Stone + raw Mythril flow, after upstream expansion and declared acquisition/recovery treatment. Water remains a reported quantity and throughput requirement. The raw Mythril flow counts material gathered, while its upstream bot bill counts the resources spent gathering it; keep both visible. Do not add another hidden scarcity multiplier.

| Reference unit | Material points | Separate Water units |
| --- | ---: | ---: |
| One B/Frame/Gear group, starter Mythril scenario | 129.6255 | 10.3333 |
| One B/Frame/Gear group, tier-9 Mythril scenario | 100.5431 | 7.6667 |
| One AP from standard Medium Bots | 29.0824 | 2.6667 |
| One Grove regeneration, including paid forestry | 0.15730 | 0 |

Foregone local recovery scores per diverted waste unit are approximately 0.78933 for Fines, 0.39466 for Flux, 0.78933 for Crust and 0.25 for Slag under these forestry assumptions. These are analytical opportunity costs, not adopted meter credits or additional factory input charges. Joint useful-product/waste costs must still be reconciled once. The chosen score does not select one Mythril source or bot mix for all players.

### Adopted cost-parity tolerance (Q81)

Q81, adopted November 3, 2026: use a provisional plus/minus ten percent band around the eventual common material-point target for each component, under the same declared standard-recipe supply scenario. This allows whole recipe batches and distinct material mixes while preserving meaningful parity. Compare different Mythril routes and bot mixes as sensitivity cases; do not switch scenarios between corners just to make the totals match. Water, machine work and delivery remain separate constraints and do not need equal rates. The user selected option 1; plus/minus twenty percent is not adopted. Q87 subsequently adopts approximately 290,824 reference material points as the starting common target. The earlier 100,000-point example remains illustrative. Derive and review concrete corner amounts after the reference supply scenario is settled.


### Adopted endgame supply reference (Q82)

Q82, adopted November 3, 2026: use tier-9 Dwarven supply maintained with ordinary Medium Bots as the primary material-cost reference. Value Alpha AP with ordinary Medium Bots too. Continue using paid forestry with natural regeneration excluded, as in the existing analytical scenarios. This selects a calculation reference only: it neither requires players to use those bots or settlements nor removes starter settlements, stronger bots, the Mythril Golem or researched optimization routes. Compare those separately, including their setup and delivery constraints. Do not silently substitute Golem Mythril with zero acquisition cost.

Under the two already-calculated scenarios, a B/Frame/Gear group costs 100.5431 material points with tier-9 Mythril and 129.6255 with starter Mythril, about 28.9% more. That exceeds the agreed per-component deviation, so the scenario must be declared before deriving quantities. Standard Medium AP costs 29.0824 points per AP in either scenario because it uses no Mythril. Among the four ordinary bot recipes examined, Medium has the lowest material score per AP in these declared scenarios; this says nothing about the best delivered throughput. The JSON now includes the Small Bot comparison as well. All bot types remain valid supply options under the existing AP rules.

The user selected option 1. Starter-camp Mythril remains a sensitivity case rather than the primary reference. Q87 subsequently adopts 10,000 AP per Alpha and the derived common material target. Reclamation co-product allocation and Grove conversion still need explicit derivation; do not interpret foregone-recovery values as adopted meter credits.


## Throughput consequences before selecting the common budget

Hypothetical Alpha requirements illustrate the scale implied by material parity. Q87 subsequently adopts the 10,000-AP row as the starting Alpha/common-cost anchor; its Foundry/Grove equivalents remain illustrations until separately adopted. The 5,000-AP row remains a comparison. Values average whole manufacturing batches and use the Q82 reference.

| Hypothetical Alpha AP | Reference material points | Equal-count Foundry inputs, each | Grove regeneration at the same score | Grove-only hours with 100 base planters |
| --- | ---: | ---: | ---: | ---: |
| 5,000 | 145,412 | about 1,446 | about 924,405 | 2.57 |
| 10,000 | 290,824 | about 2,893 | about 1,848,810 | 5.14 |

The planter-hour illustration assumes all one hundred planters continuously emit sixty growth/minute to the Grove, without output or delivery constraints. Extra Forest renewal to fund upkeep, extraction, routing, travel and setup are additional work; this is not a feasible-layout claim or elapsed-time prediction. Applying the existing 900 ms upgrade does not remove the order-of-magnitude issue. Material parity alone can produce large item volumes and machine counts.

For the 10,000-AP illustration, 368,446 Fines have the same foregone-local-recovery score. That is an opportunity-value illustration, not a proposed waste quota or a completed allocation of joint manufacturing cost. Do not count the entire useful-part recipe bill again against its waste. Reclamation meter credits and combined-factory accounting remain unresolved.

### Adopted late-game planter throughput research (Q83)

Q83, adopted November 3, 2026: add a Complex-era research path, available before the first final Core, that substantially increases Tree Planter regeneration output while charging the same adopted resource cost per regeneration unit. Faster output therefore requires proportionally faster Wood, Iron Plate and Stone supply; preserve funded credit and blocked-output behavior. This aims to make the Grove a practical throughput/forestry challenge without requiring hundreds of unchanged planters. It grants no material discount and does not reintroduce Power.

The user selected option 1, adopting the research direction. Q84 subsequently adopts a tenfold multiplier and sufficient growth delivery. Q85 adopts grouped growth on existing connections; Q86 adopts the shared 100-of-each-Core research price. Size those against a target Grove rate and verify that output buffers, connection capacity and Grove intake can deliver the advertised throughput. Merely accelerating the internal cycle is insufficient if transport caps useful delivery. Keep ordinary Forest use and positive net Wood yield in the review. Retaining current rates and relying solely on parallel planters is not the adopted direction. Runtime research remains to implement; Q87 adopts Alpha AP and the common reference target, while Grove quota remains open.


### Adopted tenfold output with sufficient growth delivery (Q84)

Q84, adopted November 3, 2026: make the new upgrade multiply existing Tree Planter output by ten. This is 600 regeneration/minute before Tree Planter 1 and 666.67/minute with its existing 900 ms cycle. Preserve the adopted funding ratio and unused credit: at 600/minute, continuous direct upkeep is 60 Wood, 6 Iron Plates and 6 Stone/minute; with Tree Planter 1 it is about 66.67 Wood, 6.67 Plates and 6.67 Stone/minute. Supporting smelting/forestry is additional work. Apply to ordinary Forest and Grove supply.

The advertised rate must be deliverable on a normal valid growth route when supplied and unblocked. Current planters have one output connection, ordinary routing launches one item each 400 ms (150/minute), and output storage is five. Raising only production would therefore cap one route far below 600/minute. Include sufficient regeneration-only transfer capacity and output storage in this upgrade's design; preserve travel semantics, explicit growth-unit accounting, capacity reservations and lossless blocking. General material/Road transport rates are not increased by this adopted upgrade direction. Q85 subsequently selects grouped growth on existing connections; every growth unit must still be funded and counted.

The funding batch is twelve physical input items for one hundred growth. Tenfold base production needs six batches/minute, or 72 direct input items/minute combined; with Tree Planter 1, 80/minute. This is below the current ordinary launch ceiling under continuous, compatible routing, but it does not validate scheduling, twelve-item storage or actual delivery. The existing five-unit output buffer needs review for batching/in-flight handling.

For the hypothetical 10,000-AP comparison, one hundred tenfold planters would emit the Grove quota in about 30.81 minutes before supporting forestry and delivery constraints, versus 5.14 hours at base output. These remain illustrative AP/quota/layout values. A fivefold alternative gives 300/minute (333.33 with Tree Planter 1), requires half the direct supplies and needs about 61.63 Grove-only minutes in that example. The user selected tenfold output with sufficient growth delivery; the fivefold alternative is not adopted. Q85 settles the grouped transfer mechanism and Q86 the shared price. Prerequisites beyond Complex-era/pre-first-final-Core availability, buffer/integration details and final corner quantities remain open.


### Adopted grouped growth over existing connections (Q85)

Q85, adopted November 3, 2026: after the new research, ordinary within-map connections may carry up to ten funded forest-growth units together in one dispatch. Keep existing wiring, compatibility, transparent routing and the one-second route travel time. Do not add a new item, buildable logistics node, processing delay or mandatory wait for a full group: send the available quantity, limited by ten and the destination's unreserved free capacity. Every transmitted unit is one existing regeneration unit, paid for under the adopted funding ratio.

At the current 400 ms launch cadence, ten-unit dispatch permits up to 1,500 growth units/minute on one unconstrained route. That exceeds a single upgraded planter's 600/666.67 output, allowing its advertised rate when all other conditions permit. This is an analytical service ceiling, not a guarantee after merging many planters or under blocked delivery. Buffers, Forest/Grove acceptance and combined routes still need sufficient unit capacity.

Apply grouping only to forest-growth after this research. Ordinary materials and Road transfers retain their existing per-unit rates. A Road crossing does not inherit ten growth units per Road dispatch; local planters at the Grove remain a valid route. Preserve lossless partial groups, whole-unit destination reservations, disconnection returns and save/load. Existing saved transfers without a quantity retain one unit; cosmetic pulses deliver none. Show regeneration quantities in units so a moving group cannot be mistaken for one unit or free growth.

Current in-flight transfers have no quantity field, pending accounting counts one per transfer, and delivery/cancellation move one item. This adopted mechanism requires coordinated amount-aware routing, reservation, persistence and display work. The user selected existing connections; a dedicated regeneration logistics node is not adopted. Q86 adopts the shared research price; exact buffer sizes and runtime implementation remain pending.


### Adopted shared research price (Q86)

Q86, adopted November 3, 2026: price the tenfold planter output and grouped-growth delivery together at 100 of every Core from Simple through Complex: 600 physical Cores, paid once for the research bundle. This is the same price as the adopted higher alternative-recipe research and above the existing six-Core machine-efficiency rank's 60-of-each price. The upgrade applies to Tree Planters through the research system; its ongoing material demand is still paid per growth under Q78A. No final Core is part of the price, preserving Q83 availability before the first final Core.

The user selected option 1. This is an adopted starting design price, not a measured payback result. A 200-of-each alternative costs 1,200 Cores. At the five-second base Research Center cycle, 100 synchronized sets require 500 supplied lab-seconds (8 minutes 20 seconds), versus 1,000 for 200 sets; supply, delivery and lab efficiency determine actual completion. Price selection does not choose the Alpha threshold, Grove quota or common component budget. Research naming, exact prerequisite integration and buffer sizes still need implementation design. The 200-of-each alternative is not adopted. Runtime research remains to implement.


### Adopted repeatable Alpha requirement and cost anchor (Q87)

Q87, adopted November 3, 2026: use 10,000 AP for one Alpha as the initial paper balance target. Keep accumulation, full-AP respawn, surplus carry and lossless full-box pause already agreed. This matches the ordinary mineral Golems' current one-time AP amount and is half the adopted Mythril Golem's 20,000-AP investment; Alpha differs because its payment repeats for every component. At current strength it requires 500 Command Bots, 1,250 Heavy Bots or initially 3,334 Medium Bots with two AP carried forward. Mixed supplies remain valid.

Under Q82's standard Medium-Bot reference, this anchors the common per-component material target at approximately 290,824 points, with Q81 bounds approximately 261,742–319,906. This uses sustained costs with surplus carried; a first whole-bot payment can cost slightly more. It does not claim that supplying the same AP with other bot types has an equal material bill.

For a reviewable sense of scale, 2,900 each of the three Foundry inputs score approximately 291,575 points, and 1,850,000 Grove regeneration scores approximately 291,011. Both are close to the adopted starting reference target. These are unadopted recipe illustrations, not new input requirements or final-Core ingredient counts. At 600 growth/minute from one hundred tenfold planters the Grove illustration takes about 30.83 Grove-only minutes before supporting forestry, intake or delivery constraints. This is not a feasible-layout or elapsed gameplay claim.

A smaller 5,000-AP target halves the reference material budget and associated equivalents. A larger 20,000-AP target doubles them. Reclamation credits still need the joint useful-product/byproduct cost treatment; an opportunity-equivalent waste count alone does not prove full-factory parity. Actual sustained supply, logistics, first-victory pace and repeat research costs remain to validate. The user selected option 1: 10,000 AP and its derived starting reference material target are adopted. The 5,000/20,000 alternatives and illustrated corner recipe quantities are not adopted. Runtime implementation and measured balance remain pending.


### Adopted Foundry batch (Q88)

Q88, adopted November 3, 2026: use 3,000 Circuit B + 3,000 Sealed Frames + 3,000 Mythril Gears to craft one Foundry component. This keeps the adopted unusual three-chain combination and rounds the earlier equal-cost illustration to readable whole thousands. It requires 9,000 delivered parts total. Under Q82, the standard upstream bill scores approximately 301,629 material points, 3.72% above the 290,824 anchor and inside the Q81 band of approximately 261,742–319,906. Separate Water demand is 23,000 units upstream, not an added Foundry Water ingredient.

The user selected option 1, adopting this batch and one-component yield. Runtime implementation remains pending. The immovable assembler-like node needs storage sufficient for the full selected recipe if using atomic consumption; three thousand per input means nine thousand total input capacity, not an ordinary assembler's default storage. Keep delivery progress visible and preserve stock across save/load. Consumption timing, craft duration, output capacity/full-box behavior and exact modifier rules need review. Existing transport rates still apply, so 9,000 parts is a substantial delivery requirement; resource parity alone does not establish a reasonable completion time. Future balance revisions should preserve the selected identities and shared material band unless explicitly amended. No final-Core ingredient counts are selected here.


### Adopted Grove quantity and yield (Q89)

Q89, modified and adopted November 3, 2026: require exactly 2,000,000 supplied Tree Planter regeneration for one Elder Grove component. The user requested an even two million rather than the proposed 1,850,000. This is 20,000 adopted funding batches of one hundred growth. Direct planter funding totals 200,000 Wood, 20,000 Iron Plates and 20,000 Stone before upstream manufacturing and forestry self-upkeep.

Under Q82 paid forestry, the expanded basket is about 247,191.01 harvested Wood, 44,943.82 Iron and 22,471.91 Stone: 314,606.74 material points, about 8.18% above the Alpha anchor and within the agreed ±10% band (upper bound about 319,906). No Copper, Mythril or Water enters this standard Grove supply basket. The additional Wood/mineral supplies fund ordinary smelting and Forest regeneration replacing upkeep Wood; each growth unit serves either Forest renewal or Grove progress once.

One hundred continuously supplied tenfold planters emit two million growth in about 33.33 minutes, or 30 minutes with Tree Planter 1. Supporting forestry, material supply, construction, geometry and routing are additional constraints. One up-to-ten-unit/400 ms route has an arithmetic ceiling of 1,500 growth/minute and would take about 22.22 hours alone. Parallel intake is therefore necessary for the illustrative fast completion. These are analytical service/production comparisons, not a measured layout or elapsed playtime claim.

Quantity and one-component yield are adopted. Q91 subsequently adopts cumulative progress, immediate threshold rewards, surplus carry and full-box pause. Component/input capacity and runtime handling remain to define. No requirement to hold two million growth in an ordinary input buffer is adopted. Runtime implementation and balance validation remain pending.

### Adopted parallel Grove intake (Q90)

Q90, adopted November 3, 2026: let the Grove accept multiple simultaneous forest-growth connections directly on its growth input, using the existing multiple-connection convention. Players may connect separate planters or parallel routed networks to the immovable Grove. Preserve normal compatibility, travel, funded unit accounting, up-to-ten-unit groups and route-specific limits. Merging many planters into one delivery route still shares that route's capacity; separate incoming routes can deliver in parallel.

Do not impose an additional aggregate processing delay or Grove-wide intake-rate limit on top of incoming routes. Input space/reservations and Q91's full-component-box pause can still block acceptance; size and validate buffers/progress handling for the chosen target layout. This is not unlimited free throughput or a guarantee that one hundred planters fit a corner map. World geometry, node limits and material delivery remain part of validation.

The user selected option 1, adopting intake topology. Q91 subsequently adopts the lossless progress/full-box cycle with immediate threshold rewards. Existing multiple-input capability supports the connection convention, but the new Grove world node and its simulation still require implementation. Separate fixed root-intake nodes are not adopted. Runtime world-node/intake implementation and validation remain pending.


### Adopted lossless repeating Grove meter (Q91)

Q91, adopted November 3, 2026: accumulate delivered regeneration toward two million with no time limit. Whenever the meter reaches 2,000,000 and the component Tribute box has space, immediately create one Grove component, subtract exactly the threshold and retain surplus toward the next component. There is no separate reward-processing timer in this adopted cycle. Preserve progress across supply interruptions, save/load and pauses.

When the component box is full, pause new growth acceptance and consumption, retaining all credited progress, buffered/in-flight growth and existing components. Resume automatically when transport creates space. Do not dispose of growth while full. For example, a meter seven growth short receiving ten growth yields one component and leaves three credited growth if output space permits; if a completion cannot be awarded, preserve all paid growth/progress until it can. Concurrent incoming routes must not duplicate rewards, exceed reserved input/output space or lose residual growth.

The user selected option 1, adopting this complete repeat/full-box cycle. Q92 subsequently sets component capacity to ten per corner box. Q143 sets the input buffer to 100 growth units; visual form remains implementation work. Routing/progress transactions and runtime implementation still require validation.


### Adopted corner Tribute capacity (Q92)

Q92, adopted November 3, 2026: give each of the four corner Tribute boxes capacity for ten units of its own component: ten Alpha, ten Foundry components, ten reclamation components and ten Grove components. This is ten per box, forty total across the world, not a shared pool. The items are costly repeatable outputs, so ten provides a substantial production buffer while allowing full-box behavior to matter when collection stops.

The user selected option 1, adopting output storage only. It does not set growth/waste/bot input storage, change the adopted lossless pause rules, or settle the remaining Foundry crafting/full-box policy. Existing Goblin and adopted Dwarven capacities remain outside this decision. The current generic Tribute baseline is one hundred; one hundred per corner box is not adopted. Runtime implementation of per-corner capacity remains pending. Runtime must use each box's own capacity consistently for reward reservations, production, display and persistence rather than the old shared production ceiling.


### Q93 provisional recycling-value reference; calibration deferred

Q93, November 3, 2026: the user selects option 1 provisionally, with final calibration deferred pending representative factory waste evidence. For the reference, treat reclamation as diversion of byproducts from useful factory work and value each waste unit by the materials its adopted local recovery would return, less recovery inputs avoided by diverting it. Keep Q80 Water/work comparisons separate and count the shared manufacturing bill once in the combined factory. Do not charge all part-making inputs again to both the useful output and its waste. Verify actual useful-product demand, waste production and delivery alongside the credit model; material value does not establish availability.

Under Q82, the resulting material opportunity values per waste unit are about 0.78933 Fines, 0.39466 Flux, 0.78933 Crust and 0.25 Slag. Each is positive. A single-type supply hypothetically matching the Alpha anchor would require about 368,446 Fines/Crust, 736,892 Flux or 1,163,296 Slag. These are unrounded analytical equivalents, not adopted quotas or a meter recipe. They reveal the substantial collection/throughput requirement that any later threshold must be tested against.

This provisional baseline assumes the useful co-products actually serve factory demand. If recipes are run primarily to manufacture waste and their useful outputs are stockpiled or discarded, include that additional production bill and investment in the whole-factory comparison; it is not free supply. Standard Complex Controller Fines provide the baseline available route, while optional alternatives supply additional waste streams and require separate optimization/capacity scenarios. Do not claim four-corner full manufacturing-cost parity from recycling values alone.

The alternative is explicitly allocating a share of each source recipe's joint production cost to its waste, deducting the same share from the useful output's accounting. That needs an allocation rule for different recipes and multiple wastes, plus separate opportunity-value checks. The user requires representative factory waste output to guide actual credits/quota: absorb roughly an average factory's sustained waste and encourage collecting existing byproducts or deliberately producing waste. Final numerical values and cadence are deferred; this reference does not establish measured balance.


Q93 also requests intermediate recycling into basic materials for unwanted main products from waste-focused lines. See [recycling and waste benchmark](13-recycling-and-waste-benchmark.md) for the adopted intent and Q94 output-level proposal. Earlier opportunity-equivalent volumes are not targets. Define representative factory composition and component cadence, then compare empirical waste flow with the existing resource-parity constraint and surface conflicts before changing it.


Q94 specifies early/Hydro research for a dedicated Recycler: star/ANY input, raw resources destroyed for zero output, intermediates returning one of each constituent raw type in a mixed line for player filtering. Existing cost vectors exclude this newly requested node. Q95 subsequently rejects batch exceptions and confirms at most one of each qualifying solid resource per recycled item. No source recipes are changed. Final reclamation calibration remains deferred to factory evidence. See [recycling design](13-recycling-and-waste-benchmark.md).


## Adopted Final Core assembly quantities (Q108–Q110)

Q108 originally adopted one of each corner component directly into one Final Core. Q109 replaces the direct recipe with two seed-paired intermediate recipes and a third recipe combining their two products. All three use regular Assemblers and unlock automatically when the first of any corner component is obtained. Each component type belongs to exactly one pair, fixed per world seed and saved. No extra material ingredient or dedicated machine is adopted.

Q110 adopts one unit of each paired component per intermediate batch. One of each half produces one Final Core: total one Alpha, one Foundry, one Reclamation and one Grove component, without additional materials. This preserves the original per-Core corner-component bill while changing its assembly topology. Individual corner cost targets and the unresolved Reclamation calibration remain unchanged. See [Final Core and postgame design](15-final-core-victory-and-postgame.md) for pairing, automatic unlock and Q111 adopted base cycles (10 seconds per half, 30 seconds per Final Core) and Q112 adopted one-Core victory research. No runtime change or new pacing measurement.

## Adopted Foundry processing transaction (Q142, November 4, 2026)

The user selects option 2: consume the complete set of **3,000 Circuit B + 3,000 Sealed Frames + 3,000 Mythril Gears** and add one Foundry component **immediately**, once output space is available. Input debit and output credit form one atomic transaction; there is no extra crafting delay or active timed batch. The sixty-second alternative was not selected. The ten-component output box stops conversion when full; preserve waiting inputs, ownership and output stock through save/load without charging twice or awarding duplicate components. Q143 adopts the input-buffer sizes below. This is adopted design, not measured factory cadence or implemented runtime behavior.

## Adopted corner input storage (Q143, November 4, 2026)

The user selects option 1: the Foundry holds **one complete recipe**, with separate limits of **3,000 Circuit B, 3,000 Sealed Frames and 3,000 Mythril Gears** (9,000 parts total). One oversupplied ingredient cannot occupy another ingredient's reserved space. Adopt **100 incoming units total** at each other corner: 100 bots at Alpha, 100 mixed waste items at Reclamation, and 100 regeneration units at the Grove. Saved AP, reclamation credit and cumulative Grove progress are separate from these delivery buffers and do not consume their space.

The two-recipe/1,000-unit alternative was not selected. These adopted buffers preserve the ten-component output capacities, adopted per-corner full-output behavior, surplus/progress carry and normal route constraints. Buffering adds no processing delay or separate transfer-rate cap; implementation must drain/process arrivals consistently with the already adopted instantaneous thresholds and growth grouping. Reserve receiving space for in-flight deliveries so concurrent arrivals cannot duplicate, overflow or discard items; reject or backpressure new deliveries when capacity is unavailable. Buffer sizes are starting design values to validate, not demonstrated sustained throughput.
