# Final Core, victory and continued play

**November 8 update.** The Ancient Dragon now requires 500 AP per α Piece. Final Robotics requires a Final Core and unlocks the 72 AP Final Bot. See the [current implementation](20-endgame-implementation.md).

**November 5, 2026 balance record (NODE-0321):** explicit user quotas replace five-minute sizing for Alpha (50 AP), Foundry (50 Circuit B / 25 Sealed Frames / 100 Mythril Gears) and Grove (500 growth). Reclamation retains its five-minute credits. Endgame Theory is retired. Victory is a manually selected Research Center project costing one each of all seven Core types; producing a Final Core alone does not win. See [current implementation](20-endgame-implementation.md).

## Adopted direction

The four seeded corner challenges repeatedly supply distinct components. Players transport them into an assembly network, make Final Cores and deliver those to the Research Center. Final Core production enables the win condition, comparable in purpose to a Factorio rocket launch. Q112 adopts victory upon completion of a one-time Research Center project consuming one Final Core without extra ingredients.

The player can continue in the same world after victory. Final Cores remain reproducible and fund further optimization research. Preserve factories, inventory, world assignments and progress when victory is recorded.

## Seeded two-stage assembly (Q109, November 3, 2026)

Use **regular two-input Assemblers** for all three recipes. Partition the four distinct corner component types into two disjoint pairs once at world creation. Each pair produces its own intermediate, provisionally **Core Half A** and **Core Half B**. Combine one Half A and one Half B into **one Final Core**, without additional ingredients. No dedicated Core Assembler or fourth Assembler II input is needed.

The unordered pairings are:

| Pairing | One intermediate uses | The other uses |
| --- | --- | --- |
| 1 | Alpha + Foundry component | Reclamation component + Grove component |
| 2 | Alpha + Reclamation component | Foundry component + Grove component |
| 3 | Alpha + Grove component | Foundry component + Reclamation component |

Choose the pairing from the world seed, separately from the seeded placement of corner challenges. Every component type appears in exactly one pair; do not randomly choose each recipe independently and risk duplicated or missing components. Save the resolved pairing and its assignment to the two intermediate recipes. Reloading, recipe selection or learning a recipe must not reroll it. A given world's recipe UI and simulation must agree.

**Q110 adopted November 3, 2026:** consume **one unit of each paired component** to produce one half. Then consume one Half A + one Half B to produce one Final Core. Net corner inputs are exactly **one Alpha, one Foundry component, one Reclamation component and one Grove component per Final Core**, with no additional ingredients. The two intermediate recipes retain Q108's total corner-component cost while allowing regular Assemblers to handle the seeded pairs.

Q109 replaces Q108's direct four-input recipe and the unadopted dedicated-machine proposal. Half names remain open; Q111 adopts all three processing times below. See [component costing](12-endgame-component-costs.md) for individual corner costs; reclamation calibration remains deferred to representative factory evidence.

## Adopted assembly times (Q111, November 3, 2026)

Base processing times are **10 seconds for either half** and **30 seconds for the Final Core**, using ordinary Assembler efficiency rules. The user selected option 1. At base speed with continuous supply and no blockage, one half Assembler has a theoretical capacity of six halves/minute, and one Final Core Assembler two Cores/minute. These are machine capacities, not a claim that the corner network sustains them. Corner supply, transport and actual factory pacing still need validation.

## Automatic recipe unlock

Unlock **both intermediate recipes and the Final Core recipe together as soon as the player obtains any one of the four corner components**. This is an acquisition milestone, not merely discovering a corner. Treat the first component awarded into its player-accessible Tribute box as obtained; no extra transport step or paid research is needed to reveal these recipes. Persist the milestone after that item is moved, consumed or recycled, and reconcile existing owned component stock when loading compatible older saves.

This unlock does not grant the other components. Players still solve all four challenges and supply the paired recipes. Assembly does not require Endgame Theory, global Storage/Inventory or producing a Final Core first.

Q11A still makes global Storage/Inventory research available only after the first Final Core is produced, with research payment required before placement. The first Core must therefore remain possible using ordinary transport. Current Endgame Theory price/prerequisites are source evidence, not a newly adopted assembly gate; its remaining role needs later review. This decision does not change its live research data.

## Implementation and compatibility requirements

Resolve seeded recipes per world and use the same data for recipe menus, machine validation, simulation and saves. Do not mutate the global recipe registry with one world's pairing or leak it into another save or tutorial. Preserve existing factories and stock during migration; exact legacy-save handling remains implementation work. Add fixed standard-composition coverage for both halves and the Final Core before making them Recycler inputs, consistent with the adopted per-resource return cap and no-fluid rule.

## Adopted victory through the Research Center (Q112, November 3, 2026)

A one-time victory research project becomes available after first Final Core production. The player explicitly selects A Remarkably Indirect Conclusion and the Research Center consumes **one each of Simple, Basic, Automata, Hydro, Shiny, Complex and Final Cores**, using its ordinary researched consumption cadence. Completing that project records victory and opens the victory modal; delivery or production alone does not complete it. Continue returns to the same world, with repeatable Final Core production and later optimization research. The user selected option 1; no separate player-activated finale is required.

Global Storage/Inventory research remains independently available after first Final Core production; victory or delivery is not an added gate. Do not consume a Core merely upon arrival if no applicable project is selected. The project name and postgame research still need review. The user requests a fancy glowing victory modal with a developer thank-you, modding invitation and affectionate Factorio/Satisfactory homages; [finished draft copy and presentation](16-victory-modal.md) and the [interactive design preview](../../outputs/planning/victory-modal-preview.html) make that request concrete. The preview is not integrated runtime.

## Victory and postgame questions

- What should the one-time victory research project be named?
- Should Resource Relocation include cleared-Golem reserves (Q136), followed by remaining Lake/camp linked-object handling? Q134 prices/free same-map moves and Q135 post-victory unlocks are adopted.
- Which optimizations use later Final Cores, with what prices, effects and repeatability?
- How do postgame research and escalating Storage/Inventory allowances interact without bypassing first-Core transport?

The current victory bill is one of every Core, Simple through Final (seven total). The former one-Final-Core-only bill was superseded on November 5. Resource Regeneration has adopted Q119 effects and Q120 prices; Efficient Landfill has Q123/Q124 effects and Q125 prices. Both use all seven Core types; other projects’ unresolved prices/effects remain open. Avoid repeated victory interruptions on later Core production/research; save victory completion persistently.

## Research inventory before choosing another Final-Core upgrade

Reviewed November 3, 2026 at the user's request. This lists optimization/convenience research relevant to Q113, rather than every machine unlock, discovery or Core-access project. Source defines current behavior; adopted master-plan changes may still be unimplemented. The later Q113 answer adopts four world-reshaping tracks; this inventory remains the baseline against which they were selected.

| Current research track | Existing benefit | Repeatability |
| --- | --- | --- |
| Nine machine efficiency families | Extractor, Kiln, Smelter, Refiner, Assembler, Research Center, Hydro Plant, Assembler II and Separator: six ranks, cycles at 90/80/70/60/50/40% of base; quantities/yields unchanged | Six ranks per family; 54 projects |
| Tree Planter 1 | Cycles at 90% of base | One upgrade |
| Mineral Regeneration / 2 / Rate | Enables ordinary mineral recovery at one unit/30 seconds, then one/15 seconds; Rate ranks each add 20% of the second-stage base rate | Rate has no maximum rank |
| Storage Placement Capacity | One additional Storage allowed globally per rank | No maximum rank |
| Inventory Placement Capacity | One additional Inventory allowed globally per rank | No maximum rank |
| Storage Connection Capacity | One additional permitted connection per Storage per rank | No maximum rank |
| Inventory Connection Capacity | One additional output connection per Inventory per rank; current Inventory supplies Filters | No maximum rank |
| Pressure Systems / High Pressure Intakes | Lake Intake production 4 → 8 → 16 Water/second when supplied and unblocked | Two upgrades |
| Mineral Recovery 1 | Recovery recipes take 10% less time after the applicable machine modifier; no extra recovered material | One upgrade; relevance to replacement recovery recipes needs integration review |
| Road Channels / vehicles | Additional Road slots per map face, plus Cart → Truck → Train capacity progression | Fixed upgrades |
| Area Expansion / Warehouse / Blueprints / Connector Mirroring | More buildable space, local buffering, saved-layout tools and flexible Production-node port orientation | Fixed utility projects |

The five non-Map repeatables currently cost Cores only through Complex. Regeneration Rate and connection upgrades start at 40 of each of the six Core types; placement upgrades at 50 each. Per-Core prices grow by 1.5 per rank, rounded up. Map Node is also repeatable, but is a finite-world exploration purchase rather than an indefinite optimization line. Existing regular machine ranks and these five repeatables are not already Final-Core research.

| Agreed master-plan addition/change | Adopted direction | Still open |
| --- | --- | --- |
| Global transport access | Research becomes available after first Final Core production, starts at one Storage plus one Inventory globally; progressively more placements through research | Q139: access costs one each of all seven Core types; Q140 adopts the same seven-Core growth ladder for separate placement lines; Q141 adopts the same ladder for separate connection lines; runtime integration remains pending |
| Late Tree Planter output | Tenfold growth production and grouped delivery together for 100 of each Core through Complex; same upkeep per growth | Runtime integration, buffers and measured factory pacing |
| Earlier alternative recipe set | Circuit A, Motor and Bot Frame; 50 of each Core through Complex | Runtime integration and measured savings/payback |
| Higher alternative recipe set | Hydro Piston, Mythril Mesh and Circuit C; 100 of each Core through Complex; independent of earlier set; includes adopted higher-waste recovery recipes | Runtime integration and measured savings/payback |
| Recycler access | Hydro-era research, ten each Simple/Basic/Automata/Hydro; all adopted manufactured-item coverage together | Runtime integration; not itself a postgame Final-Core project |
| Victory research | Manually select A Remarkably Indirect Conclusion and research one of every Core, Simple through Final; continue the same world afterward | Implemented locally; modal review deferred |
| Continued Final-Core optimization | Q113–Q115 adopt three one-time relocation projects, repeatable Deep Hole Stone efficiency, Road channels up to five per face, Train capacity with associated transfer gains, and Forest-inclusive repeatable regeneration | Q114: same-map relocation; local/Road 1/2/4 batches adopted at distinct cadences; target coverage, prices, later rank effects and regeneration integration remain open; see documents 17–18 |

An older **Global Pool Item Capacity** repeatable proposal would enlarge the shared pool per-item limit; **Automatic Inventory Selection** is also an older candidate. Neither is adopted in this interview. Earlier catalog sample prices are proposals, not decisions; automatic destination selection must be reconciled with the agreed filtering role before adoption.

Sources: [live research assembly and prices](../../src/content/research.ts), [late research data](../../src/content/progression.ts), [implemented effects](../../src/simulation/progression.ts), [existing research catalog](../research-catalog.md), [adopted progression changes](03-progression-and-economy.md). This is a source/document review, not a fresh gameplay or balance test.

## Adopted world-reshaping research (Q113)

The user supplies four tracks instead of selecting generic speed/yield research: one-time Resource Relocation, one-time Lake Relocation, one-time Monster Camp Relocation, and repeatable Efficient Landfill with increasing research costs and reduced Deep Hole Stone demand. [Endgame research and world reshaping](17-endgame-research-and-world-reshaping.md) records the adopted directions, unresolved prices/eligible target coverage and additional unadopted QoL candidates. Q114 adopts relocation only within the same map. Q115 adds increasing-cost Road-channel ranks up to five per face and Train capacity/transfer research; [transport design](18-endgame-transport-research.md) records Q118 local and Q116A Road batches, both 1/2/4 at different cadences. The user also adopts repeatable resource regeneration explicitly including Forests; Q117 adopts a separate new Final-Core line alongside the earlier mineral projects. Per-rank values/prices remain open. Generic speed/yield research is not adopted.

## Required verification after implementation

Check all three valid partitions, deterministic seed resolution and stable save/load; each of four component types must occur in exactly one pair. Verify all three recipes work in regular two-input Assemblers and unlock together on the first actual corner-component award, never on discovery alone, with no relock after spending it. Test world/tutorial isolation, compatible migration, atomic stock preservation through blockage/save/load and the final recipe's one-of-each-half consumption. Verify one unit of each paired component per half and exactly one of each corner component per Final Core over repeated batches. Validate first-Core production without global transport, subsequent transport-research availability, one-Core payment and once-only victory/Continue behavior, saved notice acknowledgement and repeatable Core production/research. Check base half cycles at 10,000 ms and Final Core at 30,000 ms, ordinary Assembler efficiency effects, stopped/blocked cycles and saved processing progress. Paper cost parity and theoretical machine rates are not throughput or pacing evidence.


Transfer scope clarification after Q116: within-map quantity increases are confirmed; Q116A now adopts matching inter-map Road batches of 1/2/4 every five seconds. See [transport design](18-endgame-transport-research.md).


Lower-tier transport clarification: ordinary Cart → Truck → Train research must improve local throughput at each step, before Final-Core research; the later repeatable extends it. Q118 adopts local 1/2/4 batches at 400 ms launches with 1,000 ms travel. This does not resolve Q117 regeneration integration or Q116A inter-map payload scope.


Q116A/Q116 resolved: inter-map Roads now have adopted design batches of up to 1/2/4 items for Cart/Truck/Train every 5,000 ms (12/24/48 items/minute theoretical per Road). Q118 local 400 ms launches and 1,000 ms travel stay distinct. Source/receiver availability constrains delivery; neither change is implemented yet. Q117 separate-line integration is adopted; Q119 bonus is adopted; Q120 adopts all-seven-Core ceil(1.5^(rank−1)) pricing; Q121 requires victory completion plus Mineral Regeneration 2; Q122 adopts no maximum rank.

## Adopted global transport access price (Q139, November 4, 2026)

Availability is already adopted: after the first Final Core is produced, players may research access to global Storage and Inventory, initially allowing one of each globally. Research payment is still required; producing a Core does not grant access automatically. Victory completion is not required.

The user selects option 1: a one-time bill of **one each of Simple, Basic, Automata, Hydro, Shiny, Complex and Final Cores**: seven physical Cores including one Final Core, matching the new endgame projects' initial seven-type bill. The former bill of two each through Complex, twelve physical Cores with no Final Core, was not selected. This is adopted design; runtime pricing remains pending. The initial production milestone can persist after its Core is spent, but a Final Core spent on victory cannot also pay for transport access.

This price decision does not change placement allowances, progressive placement/connection research or pool capacity. Preserve serialized research identity and compatible progress during later integration. Current source: [Autonomous Logistics](../../src/content/progression.ts), requiring Precision Control and the first-production milestone. Q139 adds no prerequisites and retains the already adopted milestone.

## Adopted recurring global placement prices (Q140, November 4, 2026)

Storage Placement Capacity and Inventory Placement Capacity remain separate repeatable projects. Each rank adds one allowed node of that type globally; access starts at one of each. Their current runtime bills start at fifty each of the six Core types through Complex, growing by 1.5 per rank.

The user selects option 1: replace both lines' prices with the shared endgame curve: rank r costs **ceil(1.5^(r - 1)) each of all seven Core types**. First five ranks cost **1 / 2 / 3 / 4 / 6 each**, or **7 / 14 / 21 / 28 / 42 physical Cores per project**. The former six-Core ladder starting at fifty each was not selected. This price is adopted design; runtime pricing remains pending.

Each bill buys one rank of one line, not one rank in both. With access and one rank in each, the global allowance is two Storage plus two Inventory nodes. This price question does not change gains, rank limits, connection limits, pool capacity or unlock prerequisites. Keep the single updating research-entry presentation already adopted in Q127A.

## Adopted recurring global connection prices (Q141, November 4, 2026)

Storage Connection Capacity and Inventory Connection Capacity remain separate projects. Each rank increases the permitted connections on every node of its type by one; Inventory output remains restricted to Filters under the existing rule. These are connection-limit upgrades, not additional placement allowances or a new transfer-speed bonus.

The user selects option 1: use the same adopted placement-price curve for each line: **ceil(1.5^(rank - 1)) each of all seven Core types**, first five **1 / 2 / 3 / 4 / 6 each**, totaling **7 / 14 / 21 / 28 / 42 physical Cores per project**. The former forty-each six-Core ladder was not selected. This is adopted design; runtime pricing remains pending.

Buying one line does not buy the other. This pricing question changes no gains, rank limits, prerequisites, pool limits or Inventory destination rules. Keep serialized IDs storageConnectionCapacity and inventoryConnectionCapacity and one updating entry per recurring line. Current bills and effects are source evidence in [progression content](../../src/content/progression.ts); runtime pricing remains unchanged here.
