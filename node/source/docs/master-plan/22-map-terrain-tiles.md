# Map terrain tiles and spawning proposal

[Master plan](README.md) · [Current map rules](../systems/map-nodes-and-exploration.md) · [Art test page](../../previews/terrain-tiles/README.md)

Create four unobtrusive terrain tile sets covering the whole Map Node playfield: Badlands, Grassland, Desert and Rocky. Assign terrain once at game start and preserve it for the save. The resource rules, standard-world distribution and current irregular artwork are selected for the proposal. Runtime generation, rendering and save integration are now implemented locally for new games. The current system reference owns runtime rules; recorded decisions below preserve the review history. Normal-play balance testing remains pending. See NODE-0646 for the original decisions and NODE-0672 for local runtime integration in the [primary history](../changelog/entries.json).

## Recorded design

| Decision | Direction |
| --- | --- |
| TT01 | Four terrain types cover each Map Node's entire factory field, with unobtrusive art and test views for review. |
| TT02 | Badlands spawns no Forests. Stone, Copper, Iron and eligible Mythril use **50% of expected capacity under current rules**. This user correction replaces the initial “50% increase” wording; 150% is not the intended rule. Mythril remains conditional on an applicable linked Dwarven settlement rather than becoming a new natural spawn. |
| TT03 | Grassland Forests use 100% cap and 100% default natural regeneration. Desert uses 50% cap for starting finite mineral reserves, and Forests use 10% cap and 10% default regeneration. Rocky uses 200% cap for Stone, Copper, Iron and eligible Mythril, with 50% Forest cap and normal Forest regeneration. |
| TT04 | Standard world: 31 Grassland and 30 each Badlands, Desert and Rocky. Home and all four corners must be Grassland. These five maps count toward Grassland's total; shuffle 26 remaining Grassland plus 30 of each other terrain across the remaining 116 positions. Terrain assignments are seeded at game start and fixed for the save. Existing encounters and special-map rules still apply. |
| TT05 | Apply terrain cap multipliers to both starting stock and the lasting reserve maximum, including camp-guarded deposits. Refill stops at the adjusted cap. Mineral regeneration and Dwarven suppression rates are unchanged. Lakes, infinite Golem reserves and player-created Drill deposits retain current rules. |
| TT06 | Apply new terrain rules only to new games. Preserve existing saves' resources, caps and regeneration everywhere, including unexplored maps. Decorative terrain migration for older saves is outside the adopted scope. |
| TT07 | The first visual review selected **Revise the terrain shapes**. The initial small repeated clay, grass, dune and slate marks are retained as review references, not accepted final artwork. TT08 supplies the subsequently selected replacement direction; the resource/spawning decisions above stay settled. |
| TT08 | The user selected **Broader natural ground forms**: connected clay cracks for Badlands, sprawling grass patches, long soft dune contours and joined rock slabs. The direction is agreed; the resulting revised illustrations remain subject to visual review. |
| TT09 | The next visual review requested **Make the shapes less regular**. Vary sizes, spacing, outlines and directions rather than retaining the row-like clay/stone structure, repeated grass silhouette and similarly shaped dune bands. Keep the broad, quiet direction and settled resource/spawning rules. |
| TT10 | The user selected **Keep this irregular draft**. Keep the current clay, grass, dune and stone illustrations as the selected proposal artwork, at their current quiet default detail. Preserve both earlier drafts for comparison. This completes the current art selection; runtime integration, combined generator checks and balance validation remain pending. |
| TT11 | The user selected **Keep terrain hidden until visited**. Reveal a Map Node's terrain only after its first visit. Adjacent frontier maps and purchased-but-unvisited maps keep terrain hidden; discovery does not reroll the game-start assignment. The author review page may show the full assignment for inspection. |
| TT12 | The user selected **Scale proportions** for larger supported odd mod worlds. For side length `N`, assign `floor(N² / 4)` each Badlands, Desert and Rocky, with one extra Grassland. Home and all four corners count toward Grassland's quota. TT13–TT16 add quadrant preferences and guaranteed entries without changing these totals; integration and validation remain pending. |
| TT13 | Add a slight terrain preference to the quadrant containing each seeded corner encounter: Ancient Dragon → Badlands; Elder Grove → Grassland; Ancient Reclamation → Desert; Ancient Foundry → Rocky. The user's “plains” and “elder forest” refer to the existing Grassland terrain and Elder Grove encounter. Follow encounter identity rather than a fixed compass assignment. |
| TT14 | The user selected option 1: **1.2× placement weight** for the preferred terrain, with other weights at 1×. Preserve exact global quotas and Grassland Home/corners. The center row and column through Home use neutral weights. This initial strength is replaced by TT15; the neutral-axis and exact-total boundaries remain. |
| TT15 | For the one-third weighting target, the user selected **1.5× for the remaining maps**, replacing the initial 1.2× strength. The other three terrain weights remain 1×. With equal remaining quotas, 1.5 / (1.5 + 1 + 1 + 1) = one third; remaining quotas and fixed sites affect actual shares. |
| TT16 | The user confirmed **N1.W1, N1.E1, S1.W1 and S1.E1** as guaranteed preferred-terrain Map Nodes for their respective seeded encounter quadrants. Count these four inside the existing world quotas. They are outside the weighted draw. Home/corner Grassland and neutral center axes remain. |

## Resource matrix

Percentages multiply each resource's expected current capacity, after its current baseline rules. They do not change node counts, extraction speed or resource eligibility. A corner's absent ordinary reserve remains absent. Existing Dwarven guarded Mythril remains available only through its linked settlement and normal suppression/extraction requirements. Do not introduce natural Mythril; its current base-game spawn chance is zero.

| Terrain | Forest starting stock and lasting cap | Forest natural regeneration rate | Stone, Copper and Iron stock/cap | Eligible Mythril stock/cap |
| --- | --- | --- | --- | --- |
| Badlands | No Forest spawn | Not applicable | 50% | 50% |
| Grassland | 100% | 100% default | 100% default | 100% default |
| Desert | 10% | 10% default | 50% | 50% |
| Rocky | 50% | 100% default | 200% | 200% |

At tier four, current base-game ordinary reserve capacity is 3,000. Badlands minerals start at and cap at 1,500, without a Forest. Grassland Forest starts/caps at 3,000 and restores one Wood per 30 seconds. Desert Forest starts/caps at 300 and restores one per 300 seconds; eligible minerals start/cap at 1,500. Rocky Forest starts/caps at 1,500 and restores one per 30 seconds; eligible minerals start/cap at 6,000. Guarded Mythril uses the applicable map maximum as its baseline, not a separate free Tribute output.

Grassland minerals remain at their current 100% baseline as the neutral terrain. The Forest regeneration multiplier changes natural reserve refill, not paid Tree Planter growth, costs or Extractor output. The agreed cap applies to all growth. Mineral regeneration stays at current rates, including guarded-deposit suppression gates and research multipliers. Faster or slower storage depletion is a consequence of changed capacity, not a new mineral-rate modifier.

## Artwork and review views

Use the existing dark field palette and outlined vector family, with flatter, quieter ground marks than the factory artwork. The current revision supplies sixteen editable 768 × 768 SVG tiles, four per terrain, with irregular periodic ground forms that continue across tile edges. Clay and stone use uneven adjoining polygons rather than a row/column lattice. Grass varies patch outline, scale and angle; dune bands bend independently with changing widths. Shape draft defaults to Irregular natural forms and retains Earlier broad forms (sixteen 768-unit tiles) and Initial small marks (sixteen 256-unit tiles). Each field repeats one variant selected from its seed; randomized variant mosaics remain integration work.

| Terrain | Selected visual language | Avoid |
| --- | --- | --- |
| Badlands | Muted clay ground, uneven adjoining plates and a branching crack network | Row-like divisions, bright fissures, trees or apparent mineral hotspots |
| Grassland | Dark green-grey ground, asymmetrical patches at varied scales and angles, a few quiet blades | Repeated patch silhouettes or foliage resembling Forest resource nodes |
| Desert | Muted sand-brown ground, independently bending contours with variable-width sand bands | Parallel repeated waves, bright sand or decorative water |
| Rocky | Cool slate ground, differently sized adjoining slabs and sparse flat facets | A row/column slab grid or raised boulders resembling obstacles/deposits |

The [local test page](../../previews/terrain-tiles/index.html) includes an individual view for each terrain and a four-way comparison, a Shape draft selector for all three drafts, grid and Production/cable toggles, dense routing, 50/100/150% zoom, default/half/stress detail, a four-variant sheet, SVG download, numeric reserve examples and a seeded world preview with a JSON rule snapshot. Downloads, accessible field descriptions and dimensions follow the selected draft. Names and controls remain outside the art. Review normal and low zoom, sparse and dense examples and repetition across a full field. Shared line-art examples illustrate visibility; they are not real game fixtures.

Suggested layer order is base ground, terrain detail, completed-hole ground and border obstruction art, grid, then cables, node bodies, sockets, labels and interaction feedback according to the existing renderer's foreground order. Texture never changes placement or routing. Draw it across Area Expansion without exposing unpainted strips. Keep static terrain cached and avoid per-frame generation. Shared-border art and its opposite-side restriction follow the [current border rules](../systems/map-nodes-and-exploration.md#shared-border-obstructions) and their [design and validation record](21-border-obstructions.md); these four ground types create no additional border blockage.

## Proportional world quotas

The accepted formula keeps all four terrains as close to equal as an odd square allows. Set `q = floor(N² / 4)`: Grassland has `q + 1` maps, and each other terrain has `q`. Reserve Home/corners plus the four preferred first diagonals. This fixes six Grassland maps and one of each other terrain. Place `q - 5` remaining Grassland and `q - 1` each other terrain with the weighted draw. The fixed nine are included in the quotas, never added afterward.

| World size | Maps | Grassland | Badlands | Desert | Rocky |
| --- | ---: | ---: | ---: | ---: | ---: |
| 11 × 11 | 121 | 31 | 30 | 30 | 30 |
| 13 × 13 | 169 | 43 | 42 | 42 | 42 |
| 15 × 15 | 225 | 57 | 56 | 56 | 56 |
| 17 × 17 | 289 | 73 | 72 | 72 | 72 |
| 19 × 19 | 361 | 91 | 90 | 90 | 90 |
| 21 × 21 | 441 | 111 | 110 | 110 | 110 |

The review page provides every supported World size with a seeded assignment and matching JSON download. Home stays at serialized `5,5`; a 21 × 21 world spans `-5,-5` through `15,15`. Reuse the current [grid helpers](../../src/domain/worldGrid.ts), not standard-world array indices, to locate the center and corners. Assignment still reveals only after first visit in the planned player interface; full author review stays available.

## Corner quadrant preferences

Use the existing saved corner encounter assignment. Corners are seeded and shuffled; the Dragon is not always northwest and the Grove is not always southwest. The review fixture reuses [seededCornerOrder and canonical names](../../src/content/endgame.ts), with the same northwest, northeast, southeast, southwest ordering as [corner generation](../../src/simulation/endgameRuntime.ts).

| Encounter in a quadrant | Preferred terrain | Placement weight |
| --- | --- | ---: |
| Ancient Dragon | Badlands | 1.5× |
| Elder Grove | Grassland | 1.5× |
| Ancient Reclamation | Desert | 1.5× |
| Ancient Foundry | Rocky | 1.5× |

Quadrants are strictly north/south and east/west of Home. The central row and column are neutral. The four corner maps themselves remain Grassland even when their quadrant prefers another terrain. Also reserve each first diagonal for its preferred terrain: N1.W1 at serialized 4,4; N1.E1 at 6,4; S1.E1 at 6,6; S1.W1 at 4,6. These positions stay one step from Home on all supported grids. Reserve all nine fixed sites before any weighted draw. Since the mapping is one-to-one, visiting a guaranteed first diagonal also lets players infer its quadrant's corner encounter.

Shuffle all eligible placement positions using a separate deterministic terrain stream. At each position, draw from the remaining terrain quotas with weight `remaining count × 1.5` for its preferred terrain and `remaining count × 1` for the other terrains. Neutral-axis positions use 1 for every terrain. Decrement the selected remaining quota after each draw. Shuffled placement order avoids giving early draws to one compass direction. This preserves exact totals while mildly changing where each terrain occurs. The four first-diagonal sites are guaranteed; the other placements are a soft bias. A particular seed can still have fewer preferred maps than its unbiased comparison despite the stronger mean tendency.

The author page defaults to 1.5× plus guaranteed entries and retains Earlier unbiased layout, which reproduces the previous uniform assignment without first-diagonal guarantees. It shows each seed's corner mapping, preferred terrain count across the full quadrant and guaranteed entry label. Gold-inset cells mark those four sites; names and hover/accessibility text also identify them. Version-four snapshots contain all fixed assignments, weight, mapping, full/weighted counts and the complete assignment. This is author-only information; visited-only player discovery is unchanged.

The final isolated audit of seeds 0–999 at every supported size measured an aggregate preferred share of 32.92–33.37% among the remaining weighted maps inside quadrants, excluding neutral axes. Including fixed sites, full-quadrant averages were 33.73–35.56%; the guaranteed entries explain the increase above the raw one-third weighting target. These are means across seeds, not per-quadrant quotas. The [current audit](../../outputs/terrain-tiles-qa/quadrant-audit.json) measures assignment arithmetic, not actual sector-generation or progression balance. Preserve the [earlier 1.2× audit](../../outputs/terrain-tiles-qa/quadrant-audit-1.2.json) as historical evidence preceding the one-third target and diagonal guarantees.

## Adopted game start generation

1. Compute current reserved encounter, Lake, Golem, clear-map, hole and corner assignments using the existing seed stream. Terrain is an overlay; it must not reroll these systems.
2. Reserve Home/corners as Grassland and the four first diagonals as their preferred terrain. Shuffle the other `N² - 9` positions, then draw within the remaining exact quotas using the corner-identity quadrant weights above. The specimen implements this for every supported size from 11 through 21. Unbiased comparison preserves earlier layouts; the weighted default intentionally changes terrain positions.
3. Save the complete terrain assignment and terrain-rule version; version one fixes the 1.5× weight and nine fixed sites, and saved endgame state retains the corner mapping when creating the game, even for undiscovered sectors. Sector materialization reads the saved assignment. Do not depend on travel order, suppression state or current active mods to reroll it.
4. On sector materialization, compute the current eligible starting resources and baseline caps, then apply terrain stock/cap changes once. Badlands removes the starting Forest. Preserve guarded ownership, visibility, access, suppression and regeneration. Keep all existing no-spawn and special-map exclusions.
5. Compose the Forest rate multiplier with existing default/research/mod rate rules. Keep paid growth separate, clamp at the new maximum and retain fractional refill behavior. Rate is multiplied, so the default Desert period is ten times longer, not ten times shorter.
6. Derive decorative variants from a separate stable visual seed. Field expansion, camera changes and reload do not alter resource rules or terrain identity. In the player interface, reveal terrain only after the first visit (TT11), including for a purchased but unvisited map. Do not reveal terrain just because a map is on the adjacent frontier. The author-only preview reveals all assignments.

For standard grid indices, the fixture fixes 0, 10, 60, 110 and 120 to Grassland. Larger sizes derive the matching corner and center indices from their dimensions and use shared grid bounds for serialized coordinates. Exact quotas are adopted for all six supported sizes. Runtime integration honors the existing early mod grid-size editing boundary, preserving Home and regenerating assignments only when the current rules permit a size change; later visits never reroll terrain.

## Compatibility and boundaries

Use an explicit new terrain rule marker for newly created games; missing markers retain legacy resource generation everywhere, including future exploration. Do not retroactively shrink, refill, remove or relabel existing reserves. Save/load, import/export, undo and cache keys must preserve terrain version and assignments. Keep existing serialized resource and research IDs.

Home's fixed Grassland keeps its current Forest/Copper/Iron start and does not add Stone. The four Grassland corners retain their current ordinary-resource exclusion and corner objectives. Preserve encounter counts, Deep Hole costs/distribution and eligibility, Lakes and their Water behavior, Golems and infinite rewards, Drill-created deposits, camp suppression/output rates, resource relocation and all current progression-recovery checks. Resource relocation should retain the moved reserve's assigned cap/rate rather than reapplying terrain; cross-map movement is not introduced. Training explicitly keeps terrain version zero. Terrain factors apply after mod baseline capacity and explicit spawns, including resource variants; Badlands removes generated Forests. Mod choices retain resource eligibility. Existing modded reserves keep saved caps. In new terrain worlds, early starting recovery refills available room without raising the lasting cap; legacy recovery remains unchanged.

## Local implementation and remaining validation

The current proposal includes selected irregular artwork and quiet default detail (TT10), visited-only discovery (TT11), proportional world quotas (TT12), and the added identity-based 1.5× bias and guaranteed first diagonals (TT13–TT16). Preserve earlier art drafts and unbiased layout comparison. Runtime integration and balance validation remain pending. Single-round integer caps, composition with mod/research regeneration and explicit mod override precedence remain technical integration checks rather than additional adopted gameplay changes.

The specimen checks deterministic weighted assignments across at least 1,000 seeds per supported size, exact proportional quotas, all nine fixed sites, seeded encounter mapping, neutral axes, full/weighted favored shares and the agreed resource examples. It does not run the actual world generator. The runtime integration tests exercise actual generation, saved layouts, adjusted reserves, rate composition, paid growth clamping and legacy future maps. Existing encounter and obstruction suites remain required alongside those tests. Synthetic tests do not establish solvability or balance.

Then run normal gameplay across varied seeds, including early Badlands and Desert Wood supply, without grants or simulation acceleration. Retain resource totals and elapsed game time, separating setup/interaction overhead from production waiting. Changed capacities may alter expansion pacing, paid forestry demand and demonstrated recovery budgets. Review those results before claiming balance or changing another system to compensate.

Current runtime entry points: [world generation](../../src/simulation/worldGeneration.ts), [initial state](../../src/simulation/createInitialState.ts), [guarded resources](../../src/simulation/guardedResources.ts), [regeneration](../../src/simulation/progression.ts), [renderer](../../src/renderer/playfieldDrawing.ts), [save rules](../systems/saves-and-compatibility.md). The game now uses these systems together with src/domain/mapTerrain.ts, src/simulation/mapTerrain.ts, src/art/mapTerrainArt.ts and src/renderer/mapTerrain.ts. The author preview imports the same current distribution and tile functions.
