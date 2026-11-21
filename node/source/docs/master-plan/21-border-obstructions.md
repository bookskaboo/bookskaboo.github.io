# Map border obstructions and Road crossing research

Chasms, rivers and mountains add visible geography to shared Map Node borders. They prevent Road placement across the affected border until the matching research is complete. Clear routes should remain practical; crossing research should reward shorter supply networks and better layouts.

Status: published November 20, 2026, in [7c4abe4](https://github.com/bookskaboo/bookskaboo.github.io/commit/7c4abe4d8d1162e544f23d143f19576db860d015). BO01–BO07, the crossing projects and the standard 16/12/8 layout are live for new games. Normal-play balance tuning remains pending. The design sections retain original starting recommendations; the implementation section records enforced safeguards and measured coverage.

## Local implementation

New games save border layout version one and a single authoritative seeded list of shared edges. Old worlds normalize to clear version zero, including future discoveries. Road creation, invalid previews and paired movement share the terrain permission query; imported saves reject invalid layouts and unresearched crossings. Factory templates reject paired-sector nodes. Three ordinary paid projects cost five each through Hydro, Shiny and Complex respectively, with Road and corresponding Core prerequisites. Permission is independent and worldwide, without automatic placement or transport penalties.

The adopted generator enforces both-endpoint corner rules, two clear neighbors per map, protected Home and E1–E2 edges, a connected clear graph, clear Home-to-every-sector Manhattan shortest routes and three-hop local bypasses. It uses the recommended tier ranges, at least three quadrants per type when the complete target fits, 48 bounded deterministic attempts and a valid-subset fallback. Grid-size changes before generating a non-Home sector scale new-world quotas/ranges; no independent terrain-count mod override is added.

The [reproducible audit](../../scripts/audit-border-obstructions.mjs) checked seeds 0–999 on 11 × 11 and 0–19 on each of 13, 15, 17, 19 and 21. All 1,100 worlds reached exact scaled quotas, all safeguards passed, no reduced-quota fallback occurred, and every type covered at least three quadrants. Standard worlds touched 59–70 unique maps. This exceeds the initial 45–60 recommendation because clear-route and corner constraints spread terrain; retain the agreed counts and report the difference instead of relaxing safeguards or claiming a balance result. [Raw results](../../outputs/border-obstructions-implementation/seed-audit.json).

Pixi draws the agreed vectors at the unchanged specimen width, centered on shared boundaries, with canonical orientation and clipped halves. Width stays fixed through Area Expansion; length follows the edge. Only the selected Road placement/move ghost reveals its neighbor. Main Node Map symbols and side/terrain rows match the approved modal test and omit research requirement text. The [real-engine test screen](../../previews/border-obstructions/runtime.html) and its [standalone copy](../../outputs/border-obstructions-page/runtime.html) keep generated borders but replace factories with empty synthetic fields, disable autosave/layout persistence, and label their research grants as fixtures.

This is static graph and functional validation. Bypass sectors can still require purchase and Deep Hole completion. Normal-play comparison of routing choices, purchases, Core flow and progression time remains pending; the initial counts and prices are tuning starting points. Earlier art/modal evidence remains presentation history rather than proof of implemented gameplay. Current rules live in [map nodes](../systems/map-nodes-and-exploration.md#shared-border-obstructions), [Roads](../systems/roads-and-vehicles.md#border-crossing-research) and [save compatibility](../systems/saves-and-compatibility.md#saved-border-layouts).

## Design decisions

| ID | Decision | Status |
| --- | --- | --- |
| BO01 | Each obstruction blocks the entire shared border, seen consistently from either map | Agreed in the planning review |
| BO02 | Rivers at Hydro, mountains at Shiny, chasms at Complex | Agreed in the planning review |
| BO03 | Start with 16 river borders, 12 mountain borders and 8 chasm borders on the standard map | Agreed as the starting distribution for validation |
| BO04 | Make each crossing project a permanent worldwide permission for ordinary Roads, with normal channels and no extra crossing fee or upkeep | Agreed in the planning review |
| BO05 | Obstructed sides on one Map Node cannot meet at a right angle; two obstructed sides must be opposite | Agreed from the requested simulation rule |
| BO06 | Center terrain on the shared border at its existing total width, showing half in each adjacent Map Node | Agreed from the shared-border art clarification |
| BO07 | Normal play clips to the current field; Road placement shows the selected neighbor's terrain half in its adjacent-map ghost | Agreed from the visibility clarification |

The requested scope includes all three terrain types, visible field art, blocked Road placement and separate research at different Core tiers. Prices, generation thresholds and acceptance targets below are starting recommendations for implementation and playtesting.

## Current systems

The standard world has 121 Map Nodes in an 11 by 11 grid. It has `2 × 11 × 10 = 220` internal shared borders, counted once each. The outer world boundary has no neighboring Map Node and is excluded. A terrain count refers to an obstructed shared border, not to a map, a Road endpoint, or an entire continuous river system.

Roads already create paired endpoints on adjacent unlocked maps and consume a channel on each facing side. Each side starts with one channel, increases to two and three through research, and can reach five after victory. New fields begin at 3,600 by 2,400 world units and expand together. Crossing permission must work with these systems.

Current Deep Holes can restrict exploration, camps guard resource access, and Lakes provide local Water. Border obstructions introduce a separate Road-placement rule. Their addition should not change those systems, normal Map Node prices, movement between maps, fluid shipping, or vehicle payloads.

References: [map and exploration](../systems/map-nodes-and-exploration.md), [Roads and vehicles](../systems/roads-and-vehicles.md), [research](../systems/research.md), [existing obstructions](../systems/encounters-and-obstructions.md).

## Placement and crossing rules

One shared border has zero or one terrain type. Both neighboring sectors refer to the same border identity and permission. Before research, reject creation of either endpoint atomically; attempting from the other side, changing direction, dragging along the wall, or adding more channels cannot bypass the restriction.

On each Map Node, any two obstructed sides must be opposite. North and South may coexist; East and West may coexist. North/East, East/South, South/West and West/North are forbidden, including mixed terrain types. Thus zero sides, one side, or two opposite sides are the only valid arrangements. For example, existing East and West obstructions prohibit adding North or South. Research permits Road placement but does not remove this terrain-generation rule.

Check both neighboring Map Nodes before assigning a shared border. A candidate must satisfy the right-angle rule at both ends, in addition to the clear-route safeguards below. Changing a terrain type on an occupied side does not change its adjacency; rejecting a new candidate must preserve existing assignments. The local simulation enforces the single-map rule and the integrated generator validates both endpoints.

Completing a terrain's research permanently grants permission to place ordinary Roads across every border of that type worldwide. Roads can cross anywhere along the border, subject to the existing paired-position, collision, unlocked-neighbor and channel checks. Players still place each Road themselves. There is no additional crossing fee or upkeep. Existing and future Carts, Trucks and Trains use the same permission. The starting design also adds no shipment delay, cargo loss or capacity penalty.

Terrain remains visible after research and after Road removal. Research simply allows ordinary Road nodes on the terrain; no bridge, span, tunnel portal or separate after-research artwork is required. Terrain cannot be removed or relocated through resource, Lake or camp relocation research.

The terrain art occupies a narrow band centered on the shared boundary at its existing total width. Show half on the current Map Node and the matching other half on its neighbor; do not put a full-width copy inside each field or halve the total width. Use one canonical geometry and clip it to each sector's field during game integration. Reserve no additional interior factory footprint in this version; its gameplay obstruction is the Road crossing rule. Existing endpoint positions and clearance remain authoritative. This keeps the art from quietly introducing another restriction on Production nodes or ordinary connections.

During ordinary play, render only what lies inside the active field boundary. Hide neighboring field surfaces and the obstruction halves outside that field. While the player attempts to place a Road, show the selected adjacent map's cropped ghost with its corresponding half of the same terrain. Reuse the existing near-half crop, normal orientation and Road-preview gap. The ghost's half aligns with the active field's half across that display gap; the gap is a preview layout feature, not extra terrain width. Switching sides changes the ghost; canceling placement hides it and restores the current-field-only view. Show the ghost even when crossing research is missing, with rejected placement feedback. Research allows ordinary Road nodes without changing the terrain artwork.

## Crossing research proposal

| Terrain | Working research name | Highest Core tier | Starting bill | Explicit prerequisite | Effect |
| --- | --- | --- | --- | --- | --- |
| River | River Bridges | Hydro | 5 each of Simple, Basic, Automata and Hydro | Road and Hydro Core access | Permit Roads across all river borders |
| Mountain | Mountain Tunnels | Shiny | 5 each of Simple, Basic, Automata, Hydro and Shiny | Road and Shiny Core access | Permit Roads across all mountain borders |
| Chasm | Chasm Spans | Complex | 5 each of Simple, Basic, Automata, Hydro, Shiny and Complex | Road and Complex Core access | Permit Roads across all chasm borders |

These are independent one-time Logistics projects. A later crossing project does not require an earlier crossing project. Terrain discovery can provide guidance, but should not add a hidden availability prerequisite. Highest Core tier means the research progression tier, not distance from Home.

The equal five-per-type bills follow the existing affordable capability-access model. Each takes five synchronized payment cycles, or 25 seconds at the base Research Center rate when every required Core is available. Core manufacturing, delivery and time spent on other projects are additional. Later efficiency research reduces lab time normally. Use the existing payment, cancellation and save behavior.

The agreed sequence is Hydro river crossings, Shiny mountain crossings and Complex chasm crossings. Roads begin at Basic, so clear routes must support the first inter-map supply networks without any crossing research. Hydro river permission arrives alongside Trains and extra Road channels; Shiny mountain permission offers another optimization, while Complex chasm permission improves established late-game supply routes. Project names, prices and explicit prerequisites remain recommendations; final player-facing wording and art treatment need the required style review before implementation.

## Estimated whole map distribution

The standard-world counts below are adopted as the starting distribution for validation, with practical clear bypasses required. Placement ranges, detailed generation constraints and tuning targets remain recommendations.

| Terrain | Blocked shared borders | Share of 220 | Initial placement range by the nearer endpoint tier |
| --- | ---: | ---: | --- |
| River | 16 | 7.3% | 1–6 |
| Mountain | 12 | 5.5% | 3–8 |
| Chasm | 8 | 3.6% | 5–9 |
| Total | 36 | 16.4% | Distributed across all four quadrants |
| Clear | 184 | 83.6% | Available without crossing research |

Use exact standard-world quotas with seeded placement, rather than independent rolls that can accidentally create crowded worlds. Different terrain ranges overlap so geography is not a sequence of complete rings. Keep terrain types mixed across quadrants; aim for each type in at least three quadrants. Do not form a continuous enclosing barrier around Home or a progression destination.

The adopted thirty-six borders cover roughly one in six adjacencies, with an average of 3.04 clear neighbors per map before crossing research. An average is not an accessibility guarantee. The placement constraints below must also pass. Aim to touch 45–60 distinct Map Nodes; each border appears in two fields, so 36 borders produce 72 visible border appearances, with repeat maps accounting for the difference.

Rivers are most common because their research arrives first. Mountains provide a second round of useful shortcuts. Chasms are rarer because their permission arrives last. The adopted terrain mix follows the agreed research sequence. Early river borders should provide visible future shortcuts while leaving clear Basic- and Automata-era supply routes practical. A complete game need not use every obstructed border.

| Calibration profile | Rivers | Mountains | Chasms | Total | Share blocked | Intended comparison |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Light | 11 | 8 | 5 | 24 | 10.9% | Comparison if adopted density adds too much detouring |
| Adopted starting distribution | 16 | 12 | 8 | 36 | 16.4% | Validate repeated encounters with open routing |
| Dense | 21 | 16 | 11 | 48 | 21.8% | Comparison only if terrain rarely affects useful routes |

Adopting the starting counts does not establish measured player encounter rates or balance. Placement and the roads a player chooses matter more than the raw percentage. Prefer improving useful shortcut locations before changing the adopted density; record a replacement decision if validation supports different counts. The light and dense profiles remain comparison proposals.

For supported larger mod grids, scale each count by `2 × n × (n - 1) / 220` and round each type separately. A 21 by 21 grid starts at 61 rivers, 46 mountains and 31 chasms across 840 borders. Apply the same accessibility checks and allow explicit mod overrides. Reduced quotas are preferable to invalid maps; record any generator fallback for diagnosis.

## Accessibility and optimization safeguards

Treat all three terrain types as impassable when validating a new world's clear Road graph. The following are proposed release requirements:

1. Keep the clear graph connected across all 121 maps. Every map retains at least two clear in-world neighbors. Corners therefore keep both connections clear; boundary maps with three neighbors may have at most one blocked border, and interior maps at most two.
2. Protect all four Home borders and the guaranteed Home to east outpost to Lake corridor. Preserve a clear route to every progression-critical discovery, starter Mythril source, rescue Golem and corner challenge before any crossing project is purchased.
3. Give every obstructed border a clear alternate path of at most three border hops between its endpoints. Crossing then saves at most two hops on that local comparison. This is a graph test, not a promise that those bypass maps are already unlocked.
4. Validate the practical discovery and purchase sequence as well as connectivity. Keep at least one critical progression route with no additional required Map Node purchases caused solely by the new terrain, compared with the same seed without border terrain. A clear global graph alone can hide an expensive early detour.
5. Validate alongside generated Deep Hole exploration restrictions, settlement placement and scarce discoveries. A geometric bypass is insufficient if its maps cannot be opened at the relevant stage. Ordinary hole-filling costs remain part of the baseline comparison.
6. Keep successful supply branches functional. Players may add a direct crossing and rewire voluntarily; research must not relocate Roads or factories automatically.

Generate the border layout after reserving progression locations and protected routes. Reject candidates that create a right angle at either endpoint or break the clear graph, local bypasses or clear-neighbor minimum. Use bounded deterministic retries and a documented repair/fallback order. Do not keep retrying forever to meet the exact quota. Test whether all proposed constraints, the adopted right-angle rule and the adopted counts are jointly feasible before implementation. The 16/12/8 counts remain the starting target, pending that combined feasibility check.

## Visual and interaction plan

Render the terrain continuously along the affected field edge, readable from either side: river water with banks, a dark chasm with broken lips, and a mountain ridge with rock shapes. Use distinct silhouettes and contrast as well as color. Keep Road sockets, endpoint labels, cables and placement ghosts readable above the terrain treatment. Terrain decorations can vary by seed while the shared type stays identical. The local [border art study](../../previews/border-obstructions/index.html) includes an interactive Map Node simulation with one selector per side. Its default view clips to the current field. Place Road reveals the selected neighbor's cropped ghost and terrain half; cancel hides it. A research-complete example changes ordinary Road preview permission, without adding crossing art. The simulation rejects right angles without changing existing sides. The gallery retains all three illustrations, enlargement and downloads. The study does not implement game Road placement permission or world generation.

On the Node Map, show the obstruction on the shared edge once either adjacent map is visited. Reveal no unseen resource or encounter information. Field inspection and invalid Road previews identify the terrain and its required project, including the highest Core tier. Completed research changes the availability indication while retaining the geographic art. A researched border still requires an unlocked neighbor and available Road channel.

The [Node Map modal test](../../previews/border-obstructions/map-modal.html) uses the existing game modal with nine isolated display samples, three per type. Distinguish rivers with wave marks, mountains with peaks and chasms with paired fracture marks on the shared tile edge. Hover shows the terrain and two map positions; selecting a map shows its named sides and terrain in Border obstructions. Omit research requirement and permission text from these summaries, tooltips and accessible marker labels. The research-stage and survey controls outside the modal remain review examples. These samples validate presentation and discovery handling, not whole-world density, game placement permission or generator feasibility.

Check north, east, south and west edges, paired alignment, all channel ranks, field expansion, camera zoom and narrow screens. Before adding final copy or changing player-facing style, read and update both Word style references and reuse shared readability roles. Humor belongs in optional supporting text; the obstruction type and required action stay clear.

## Save and technical plan

Store each border once under a canonical pair of neighboring sector coordinates, with a saved layout version. Generate the whole border assignment from the saved world seed and layout version, independently of discovery order. Persist or deterministically reproduce the authoritative assignment so visiting the opposite side never rerolls it.

New games receive the feature. Existing saves retain their current clear borders, including undiscovered sectors, through an explicit legacy layout marker. Do not introduce terrain under established Roads. Imports, undo, reload and mods must preserve the version and crossing research. Keep current serialized item, recipe and research IDs intact.

Centralize the border-permission query and use it in Road creation, preview, paired dragging, template placement and validation of imported state. Keep placement atomic if either endpoint is invalid. Saved ordinary Roads in legacy worlds continue working; malformed or incompatible new-world data needs explicit validation rather than silently deleting stock or factory wiring.

| Area | Existing implementation entry points |
| --- | --- |
| Coordinates and shared border identities | [world grid](../../src/domain/worldGrid.ts), [domain types](../../src/domain/types.ts) |
| Seeded layout and protected discoveries | [world generation](../../src/simulation/worldGeneration.ts), [world rules](../../src/simulation/worldRules.ts) |
| Road pairing and placement enforcement | [Road geometry](../../src/simulation/roadPlacement.ts), [engine](../../src/simulation/engine.ts) |
| Research projects and effects | [research content](../../src/content/research.ts), [progression](../../src/simulation/progression.ts), [research runtime](../../src/simulation/researchRuntime.ts) |
| Field art and Node Map indicators | [play field renderer](../../src/renderer/PixiPlayfield.tsx), [Node Map](../../src/ui/NodeMinimap.tsx), [map details](../../src/ui/MapNodeDetails.tsx) |
| Save normalization and validation | [saves](../../src/persistence/saves.ts), [validation](../../src/persistence/saveValidation.ts) |

## Implementation sequence

1. Check generation feasibility with the adopted quotas and progression routes, and refine proposed prices, placement ranges and validation thresholds. Keep new terrain analysis separate from a gameplay balance claim.
2. Add versioned border data, seeded assignment and shared queries. Verify mirrored identity, bounded generation and old-save preservation.
3. Add research definitions and enforce permission on every placement path. Verify atomic paired rejection, channel behavior, template/import handling and payment persistence.
4. Add field art, map indicators and clear placement feedback, retaining ordinary Road node art after research. Complete both style references and visually review representative edges and viewport sizes.
5. Run normal-play routing comparisons, tune placement before density, and update current system references and generated catalogs when the feature is implemented. Record actual outcomes and limits in the changelog. Publication remains a separate request.

## Validation and tuning

Run a graph and generator sweep over at least 1,000 fixed seeds on the standard grid and a representative sample of every supported larger grid. Report quotas reached, reduced-quota fallbacks, unique maps touched, clear-neighbor counts, zero right-angle violations, graph connectivity, local bypass lengths and protected discovery-route purchase differences. Test the seven allowed occupancy arrangements against all sixteen possible side masks, mixed terrain types, both endpoints of every candidate border and discovery-order independence. Evaluate settlement layouts using their current documented state and preserve earlier calibration as historical where it differs.

Use engine tests for each terrain type before and after its own project, permission independence, direction reversal, extra channels, paired dragging, templates, reload, imports and legacy worlds. Verify previews and actual placements share the same rule. Research should grant access only when paid completion occurs.

Then play at least three seeds through the crossing tiers with normal gameplay. Export resource totals and elapsed game time, separating setup and interaction overhead from production waiting. Record encountered borders, bypass maps purchased only for terrain, Roads/vehicles/channels used, chosen research and rewiring effort. Compare the same seed's intended routes against a terrain-free analytical baseline without injecting resources into the run.

Starting tuning targets are two to four useful crossing opportunities per type over a run through Complex, no mandatory crossing project for progression, and no terrain-only extra purchases on the protected critical route. A useful opportunity is a discovered border where crossing avoids at least one relay map or a meaningful local transport layout burden. These are playtest targets, not automatic generator guarantees. If players ignore terrain, improve the shortcut locations first; reconsider the agreed research tiers only through a new design decision. If detours dominate, shorten bypasses, reduce early placement or use the light profile before adding more systems.

## Planning evidence

Map dimensions, Road channels, research rules and implementation entry points were checked against the linked references and source during planning. Counts use unique internal grid edges; density and larger-grid scaling arithmetic were checked directly. BO01–BO07 record the explicit planning directions, including opposite-side-only obstruction pairs, shared-border art at unchanged total width, current-field clipping and temporary Road ghost visibility. The local implementation now adopts the proposed bills, tier ranges and static route thresholds, with the measured coverage difference and remaining normal-play balance work recorded above. Earlier simulation and modal evidence remains presentation evidence rather than a balance run.
