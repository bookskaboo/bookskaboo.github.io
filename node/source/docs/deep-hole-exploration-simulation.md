# Deep Hole exploration restriction: design estimate

November 18–19, 2026 offline design estimate. The reviewed rules were subsequently implemented locally for new worlds (NODE-0608); see [current mechanics](systems/encounters-and-obstructions.md). The numerical results below retain their original simulation scope and are not a normal-gameplay completion or balance test.

The [distribution calibration](#distribution-calibration-for-10515-targets) supports the **adopted 28-hole-map distribution** with tier-3/4 selection weight four (NODE-0606). It is now part of the new-world-only implementation. Its balance targets are median maps filled of 10 / 5 / 15; the earlier results below retain their original 49–50-hole-map distribution as comparison evidence.

## Adopted rule

Discovering a map with unfinished **generated** Deep Holes prevents exploration of its four edge-sharing unexplored neighbors until **all generated** Deep Holes in that blocking map are filled. The user confirmed that another approach cannot bypass the restriction. Already explored maps remain accessible; this does not suspend their factories or Roads. A completed purchase also preserves access to an unvisited map: a later-discovered neighboring generated hole cannot prevent its first visit (NODE-0602). Apply the gate to new destination purchases after a blocker is known, without disabling entry or greying out a map whose purchase was already completed. Filling keeps the agreed grey buildable terrain, which no longer blocks exploration.

Grey out affected unexplored map cells. Their hover explanation must identify the nearby discovered hole map preventing exploration. Give the same reason in the selected-map details and keyboard/touch interaction. When multiple discovered neighbors block a cell, all must be resolved; the explanation must not disappear when only one blocker is cleared. Do not reveal undiscovered terrain. The local implementation provides grey map cells, hover/focus explanations and selected-map details; this analysis retains the original interface requirement.

**Confirmed scope (NODE-0601): only generated Deep Holes block exploration.** Depletion-created holes never start, extend or reactivate this gate, including when they appear in a map that also has generated holes. They retain their physical obstruction and fixed 250-Stone base filling bill. The main estimate already excludes them, so no rerun is needed for the generated-only scope. The estimates remain conditional on immediate visits; advance-purchase behavior under the completed-purchase exception has not been simulated. Existing worlds retain their rules, including on unexplored maps.

## Main finding

For the immediate-visit policies tested, filling Deep Holes is a substantial exploration requirement. With no clearing, those discovery policies stalled long before endgame. Route-conscious players can reduce the bill, but unknown terrain still produces a wide spread in cost and additional scouting. Completed advance purchases preserve access under the selected exception; the results below do not estimate a player who buys maps ahead of discovery.

The main comparison uses **2,000 deterministic world seeds and four player decision sequences per seed: 8,000 runs per policy**. Players know the grid and endgame corner destinations, but **do not know the obstruction distribution, source locations or undiscovered Stone bills**. Decisions consult only revealed maps and bills. Hidden-information experiments are supplementary controls and are excluded from the main recommendation.

### Players who never fill holes

| Discovery behavior | Reachable maps, median | Middle 80% of runs | Full observed range | Reached all four corners |
| --- | ---: | --- | --- | ---: |
| Open nearer frontier maps first | 24 of 121 | 16–36 | 10–58 | 0 of 8,000 |
| Choose randomly among available frontier maps | 25 of 121 | 14–39 | 8–67 | 0 of 8,000 |

The nearer-first policy still discovered a Lake in every run, but found any Dwarven source in only **65.05%** of runs. Thus Water remained available in that policy while Mythril access was unreliable. Random frontier play found the guaranteed E2 Lake in **82.6%** of runs; discovery order can block that cell before it is visited.

An exact connectivity control gives a useful limit: only **11 of 2,000 seeds (0.55%)** connected Home to all four corners through non-hole maps. A hypothetical player who knew which holes to avoid discovering could exploit those seeds. This is not a strategy available to the uninformed player, and the sampled zero successes above is not a proof that every possible uninformed sequence must fail.

### Players who clear for endgame logistics

Both policies first search for a Lake and a Dwarven Mythril source without knowing their locations, then explore routes to all four corners. A discovered Dwarven source is an access target; its suppression, extraction and factory supply are not simulated.

- **Direct routes:** survey nearer frontier maps first for supply discoveries; then commit to randomly selected shortest geographic paths to the corners. Fill known blocking maps as needed.
- **Adaptive routes:** avoid known filling bills while searching for supplies; replan corner paths after each discovery using known blocker costs. Unknown maps have no assumed hole bill. This can spend extra map purchases to avoid an expensive known hole.

| Policy | Stone: 10th percentile | Stone: median | Stone: 90th percentile | Hole maps filled: median | Individual holes filled: median | Maps explored: median | Shared Road links: median |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Direct routes, no terrain foreknowledge | 51,087 | 70,771 | 92,008 | 17 | 50 | 57 | 38 |
| Adaptive routes, revealed information only | 27,202 | 45,986 | 67,400 | 13 | 33 | 61 | 38 |
| Adaptive plus discovering all four optional Golems | 57,715 | 83,031 | 110,972 | 23 | 65 | 84 | 41 |

All clearing runs reached their modeled destinations, assuming their quoted bills can be funded. This is **destination access**, not a completed victory playtest. All four Home-to-corner routes were checked to be exactly **10 adjacent-map hops**, their Manhattan lower bound. Total shared Road-network size is improved heuristically; it is not a certified globally minimum network. A Road link is one inter-map connection with paired endpoints, not one local cable or a throughput measurement.

Adaptive play reduced mean Stone use by **34.18%** (71,296 → 46,929), with a paired median saving of **24,027 Stone**. It was cheaper in **88.46%** of paired runs and more expensive in **11.54%**. A policy that avoids a known bill can discover a worse bill later. It explored a paired median **four additional maps**. Across four decision sequences on the same world seed, the median range in adaptive Stone spending was **18,174 Stone**; the 90th-percentile within-seed range was **33,728**. Choice of route matters even with identical terrain.

For adaptive play, the middle 80% of runs varied by about **2.48×** in Stone demand (27,202–67,400). Its full observed range was **1,755–107,838 Stone**; those extremes are not typical expectations.

The generated worlds had 49–50 hole maps. Filling every generated hole would cost a median **236,162 Stone**, with a middle-80% range of **214,034–259,622**. Endgame routes do not require clearing the whole world. The optional Golem row is separate because all four Golems are not required for victory.

## Interaction and supply implications

The gate adds discovery work rather than changing the existing inter-map Road interval or payload. Once maps are explored, their Roads remain usable. Local hole geometry can still affect actual factory placement and cable routing; this graph experiment does not resolve that geometry.

Adaptive players filled a median **33 individual holes** across **13 maps**, so clearing involves multiple Stone delivery branches rather than one payment per map. Their median remaining hole bill beyond each blocking map's own starting Stone reserve summed to **11,027 Stone**, spread across a median **five maps**. Direct players had a median **23,121 Stone** of such local shortfall. This measures supply that must come from elsewhere or regeneration; it is not a complete freight schedule. It assumes a map's whole Stone reserve can be dedicated to filling and ignores other Stone uses.

The scouting tradeoff also appears in research payments. Median exploration-only Core bags were:

| Policy | Simple | Basic | Automata | Hydro | Shiny | Complex |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Direct routes | 1,200 | 815 | 260 | 160 | 130 | 104 |
| Adaptive routes | 1,175 | 960 | 525 | 190 | 145 | 104 |

Each column is a separate median, not one representative run. These costs use the current destination-price formula, one initial Exploration purchase and its free Map Point. They exclude every other research project, production node, bot and factory input. Avoiding Stone does not necessarily minimize the player's total work.

Efficient Landfill is post-victory research. The main estimates therefore use the agreed undiscounted candidate bills; they do not assume an unavailable discount on the route to first victory. No credible hours-to-victory estimate follows from this experiment: parallel mining, upgrades, local stock, freight bottlenecks, suppression supply and UI time would determine that.

## Generation model and checks

The script imports the real version-2 standard-world encounter layout function from `src/simulation/worldGeneration.ts`. It exposes that private function only inside an in-memory analysis module; game source is not edited. The standard 11 × 11 grid, reserved E1 clear map, E2 Lake, settlement selection and tier-5 Golems therefore use actual seeded placement rather than independent random obstacle probabilities.

On eligible hole-only maps, the proposed generator is modeled as follows:

1. Create five candidate circular areas from normalized radius weights 0.75 / 0.875 / 1 / 1.125 / 1.25, borrowing the existing five-hole radius spread. This distribution is an **analysis assumption**, not an additional adopted generation rule. Spatial placement is not simulated.
2. Allocate the exact tier pool bill `round(1650 × (1 + 7 × (tier - 1) / 8))` proportionally to candidate areas, with largest-remainder integer rounding.
3. Choose one through five candidates with equal 20% probabilities, then a uniform distinct subset. Selected sizes and prices are retained. All holes on a blocking map must be filled to release its neighbors.

An equal-candidate-area sensitivity run used the first decision sequence for each of the same 2,000 seeds. Adaptive median cost was **46,368 Stone**, with a 28,339–67,526 middle-80% range, versus 45,986 and 27,202–67,400 in the four-sequence main run. This does not eliminate generation uncertainty, but the main conclusion did not depend on the chosen moderate size spread.

Executable checks cover a clear world, a blocked Home stress case, a four-hole ring, exact integer candidate budgets at every tier, representative terrain classification against actual sector generation, legal adjacency, clearing all known neighboring blockers before exploration, destination access and shortest corner route lengths. A separate three-seed run exactly reproduced the saved examples, and the actual destination-pricing function independently matched both online policies' example Core bags. The generation source hash was checked after the run. The no-interaction control excludes depletion holes and compares both nearer-first and random frontier discovery. Four sequences from one seed are correlated observations, not four independent world samples.

Source SHA-256 for the generation module used in this run: `b6c64da5a7ac4878fdb6b545a2090390754ccf6b81bdaf94cdf07f31b4c0cd1a`.

Reproduce from the workspace root:

```powershell
node scripts/analysis/deep-hole-exploration.mjs
```

The default is 2,000 seeds. `HOLE_SIM_SEEDS` can select a smaller smoke run. Results overwrite the dated analysis output, never game saves. [Simulation source](../scripts/analysis/deep-hole-exploration.mjs) and [machine-readable results](../outputs/deep-hole-exploration-2026-11-18/results.json) include supplementary hidden-information and alternate-rule controls. Those controls are not the basis of the uninformed-player recommendation.

## Distribution calibration for 10/5/15 targets

Treat the user's requested counts as **median hole-bearing maps filled**, rather than individual holes, average counts or guarantees for every world. The same world distribution must serve all three play styles. Players continue to use revealed terrain only, with no knowledge of hidden obstruction or source locations.

**Adopted for the proposal (NODE-0606).** The selected distribution uses **28 hole-bearing maps out of the 49–50 eligible locations**, about **23.1% of the 121-map world** instead of roughly 40.7%. Favor eligible maps at tiers **3 and 4**; use ordinary clear resource maps for the 21–22 eligible locations omitted from the selection. Keep existing Lakes, settlements, Golems, clear outposts, Home and corners unchanged. Each selected hole map retains the agreed **one-to-five holes**, candidate costs, sizes and random subset rules.

Use a fixed total of 28 with seeded weighted sampling without replacement: give tier-3 and tier-4 eligible locations weight **4**, every other eligible location weight **1**. Assign each eligible map an independent seeded uniform value `U`, rank by `-ln(U) / weight`, and select the 28 smallest values. The weight increases selection priority; it does not promise a fourfold final probability. Persist the selected layout through saves and later map discovery when implementing the adopted proposal. This is a global hole-map selection step, separate from choosing one to five holes inside each selected map.

### Independent validation

The search examined 44 combinations of quota and tier weighting using 384 world seeds, with four decision sequences per policy per candidate. The 28-map / tier-3-and-4 weight-4 candidate was selected before running **1,000 additional world seeds**, disjoint from both the calibration sample and the original 2,000-world study. Each validation policy had **4,000 runs**. All validation scenarios used the same seeds and decision sequences for comparison.

| Hole-map distribution | Direct routes: median filled | Adaptive: median filled | Adaptive plus all Golems: median filled |
| --- | ---: | ---: | ---: |
| Original 49–50 maps | 17 | 13 | 23 |
| Uniformly choose 30 eligible maps | 10 | 6 | 13 |
| Choose 28, favoring tiers 3–4 | **10** | **5** | **15** |
| Requested target | **10** | **5** | **15** |

The uniform 30-map candidate produced 10 / 5 / 13 in the smaller search sample; its adaptive median was 6 in validation. The selected weighted candidate retained all three target medians in the separate validation sample. This is a tested starting point, not a uniquely determined distribution or proof of an optimal generator.

| Policy, selected distribution | Maps filled: 10th percentile | Median | 90th percentile | Mean | Individual holes filled: median | Stone spent: median |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Direct routes | 8 | **10** | 13 | 10.40 | 31 | 40,136 |
| Adaptive routes | 3 | **5** | 8 | 5.31 | 12 | 15,341 |
| Adaptive plus all Golems | 11 | **15** | 18 | 14.74 | 43 | 49,509 |

Full observed map-filling ranges were 4–19, 0–13 and 1–22 respectively. Targets do not cap clearing or prescribe the same count in each seed. Four sequences from a common seed are correlated. Every tested corner route still met its exact ten-hop geographic lower bound; shared network optimization remained heuristic.

### Where the 28 maps fall

These are measured averages and middle-80% ranges across the 1,000 validation worlds, not fixed per-tier quotas. Only the world total is fixed at 28; rounded means need not add exactly.

| Map tier | Original eligible hole maps | Candidate mean | Candidate middle 80% |
| --- | --- | ---: | --- |
| 1 | 2 | 0.85 | 0–2 |
| 2 | 0–1 | 0.09 | 0 |
| 3 | 6 | 5.36 | 4–6 |
| 4 | 8 | 7.21 | 6–8 |
| 5 | 7 | 3.08 | 1–5 |
| 6 | 12 | 5.23 | 3–7 |
| 7 | 7 | 3.09 | 2–5 |
| 8 | 5 | 2.22 | 1–4 |
| 9 | 2 | 0.88 | 0–2 |

In simpler terms, expect about **thirteen hole maps at tiers 3–4 and fifteen across the other tiers**, including roughly one at tiers 1–2. About 90% of the eligible tier-3/4 locations and 44% of the other eligible locations survive selection. Home and tier-ten corners have no generated holes. A world contains a median **84 individual generated holes**, with 75–94 in the middle 80%, compared with 147 in the validation baseline.

The inner concentration matters because the restriction acts on neighbors. Extra searches for tier-five Golems can require filling tier-four holes that efficient main routes left alone. Uniformly reducing density mostly lowers all three counts together; it does not preserve the larger Golem-search bill as effectively. Source discovery, incidental blockers and shared routes are included in the measured outcomes, so the effect is not a simple linear count formula.

With no clearing, the nearer-first policy explored a median **54 maps** under this distribution, and reached all four corners in **12 of 4,000 runs (0.3%)**. This is more permissive than the original immediate-visit distribution while still making clearing necessary for most of those sampled runs.

### Reproduction and limits

The calibration reuses the original policy functions through module exports. The original standalone study still runs directly; its saved three-seed examples reproduced exactly after that refactor. Scan runs reduce only the final shared-Road tie-order trials from 16 to one; executable comparisons checked that this does not change discovery order, hole maps filled or Stone cost. Validation restores all 16 trials. Checks also confirm selected maps are a subset of eligible terrain, the selected quota is exact, retained hole counts/costs are unchanged, zero hole maps imply zero clearing cost, and the first two validation worlds reproduce exactly. The generation source hash remains the same as the original study.

Run the validation configuration from the workspace root:

```powershell
$env:HOLE_DENSITY_SCENARIOS='[{"n":28,"weight":4},{"n":30,"weight":1},{"n":49,"weight":1}]'
$env:HOLE_DENSITY_FOCUS_TIERS='3,4'
$env:HOLE_DENSITY_SEEDS='1000'
$env:HOLE_DENSITY_OFFSET='2000'
$env:HOLE_DENSITY_ROUTE_ORDERS='16'
$env:HOLE_DENSITY_LABEL='validation'
node scripts/analysis/deep-hole-density.mjs
```

The default command without these settings runs the initial uniform-density scan. The `49` scenario denotes the original unthinned 49–50-map layout, rather than truncating it to 49. [Calibration source](../scripts/analysis/deep-hole-density.mjs), [uniform scan](../outputs/deep-hole-exploration-2026-11-19/scan.json), [selected-candidate search](../outputs/deep-hole-exploration-2026-11-19/tier34-scan.json) and [independent validation](../outputs/deep-hole-exploration-2026-11-19/validation.json) retain the numerical evidence.

This estimate preserves generated-only gating and existing-map access. It still assumes each purchase is visited immediately. The adopted exceptions for completed advance purchases and already-started funding can reduce clearing further; no claim is made that 10 / 5 / 15 applies to those behaviors. Factory affordability, physical node/cable placement, mining time and victory completion remain outside this graph study. **The user adopted the 28-map quota and tier-3/4 weighting in NODE-0606. They are agreed proposal rules, pending gameplay implementation.**

<a id="boundaries-to-settle-before-implementation"></a>

## Settled boundaries and implementation requirements

The exploration-gate policy review is complete: NODE-0601 defines generated-only blocking, NODE-0602 preserves completed purchases and NODE-0603 preserves started funding. Runtime, UI and save validation remain pending.

**Depletion-created holes: scope settled.** They are excluded from exploration blocking. The following counterfactual stress result is retained as analysis evidence, not the selected rule: if included, ordinary mining could re-block an unexplored neighboring cell after the initial generated holes were filled. A forced stress case in which Home acquires an unfinished depletion hole after the first expansion reduced nearer-first no-clearing reach to a median **10 maps**, versus 24 without that event. This is a hypothetical event, not a measured probability or simulated production timeline. An unfinished Home hole before any expansion blocks all four initial neighbors in the graph; access to Stone and current progression recovery would need explicit handling. The current engine retains pre-Exploration deposits and includes recovery logic, so the stress case must not be described as an observed runtime softlock.

**Completed purchases: access settled (NODE-0602).** Honor a completed destination purchase and allow its first visit even if a neighboring generated hole is discovered afterward. Preserve the map's unlocked state and apply no new entry charge or disabled-map treatment. Already explored maps also remain accessible. A purchased chain can therefore preserve an exploration route before holes are discovered; this is the selected exception, not a defect to close without another decision. Affordability and research prerequisites still constrain buying ahead. The immediate-visit simulations do not measure this behavior, so their no-clearing outcome is conditional on their tested policies.

**Started purchases: funding settled (NODE-0603).** A destination quote that has received contributed Cores before a neighboring generated hole is discovered may continue funding and complete despite that blocker. Honor its original destination, quoted price and paid contributions, including when the project is switched away from and later resumed or the world is reloaded. On completion, unlock that destination normally and retain first-entry access under NODE-0602; do not replace the destination with an unrelated Map Point solely because of the hole gate. Selecting or viewing a quote without contributing any Cores does not establish a started purchase. New unfunded purchases remain blocked while a known neighboring generated hole is unfinished. Preserve saved Map Points; they are not a completed purchase of an unspecified destination. Protected purchases need an available continuation action rather than a generic disabled-cell treatment. The immediate-visit simulation does not estimate this advance-funding strategy.

**Scope and implementation.** Keep the new-world rules version and legacy-world behavior. Validate engine eligibility as well as disabled map controls, multiple blockers, filled-grey terrain, discovery, save/load and recovery. These are implementation requirements, not tests already completed. No normal-gameplay balance run, crafting simulation, UI change, commit or publication was performed for this estimate.
