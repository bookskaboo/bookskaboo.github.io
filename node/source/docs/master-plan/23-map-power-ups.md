# NODE map power up proposal

[Editable proposal Page](https://chatgpt.com/space/page_17b0874940808191ab88e9a0b4ad953c) · [Master plan](README.md) · [Current map rules](../systems/map-nodes-and-exploration.md)

Proposal only. Selected direction and initial tuning for review; no runtime implementation. Selected direction recorded November 20, 2026 in NODE-0699 and NODE-0704. Keep this repository reference and the editable Page aligned when revising the design.

Permanent power-up landmarks give players a reason to move production, build new supply routes, and explore another sector. Start with 16 landmarks on the standard 121-sector world. Their positions are chosen at world creation and revealed on a sector’s first visit.

# Agreed direction

| Decision | Selected rule |
| --- | --- |
| Lifetime | Permanent landmarks assigned by the world seed, discovered through exploration. No timed arrivals or respawning. |
| High-efficiency Production node | Cannot be deleted. Each cycle takes 10% of the ordinary base cycle time, giving 10× base processing speed. |
| Tri Extractor | One shared progress bar. A completed cycle consumes one reserve unit and creates one item at each of three outputs. |
| Standard-world frequency | Start with 16 landmarks. Guarantee an early discovery to encourage further exploration. |
| Early discovery | Randomize a clear near-Home location, away from monster camps and other obstructions. Vary the exploration hint with the actual spawn direction. |
| Catalogue allocation | 6 Rapid machines, 6 Tri Extractors, 3 Doublers and 1 Reclaimer. Exclude High-volume Lake Intakes and Freight Depots. |
| Reclaimer Water | No Water input or Water cost. Retain the ordinary non-Water ingredients and recovery quantities. |
| Rapid machine mix | Fixed machine types: 2 Refiners, 2 Smelters, 1 Assembler and 1 Fabricator. The early landmark is a Refiner. |
| Movement and deletion | All landmarks are non-deletable. Relocation research permits moving them, subject to valid placement and connections. |
| Rapid speed research | Keep 10% base cycle time. Normal speed upgrades do not stack with the landmark bonus. |
| Extractor blocking | Pause the shared cycle whenever any of the three output buffers is full. Each completed cycle delivers one item to every output. |
| Progression spread | 2 landmarks at tiers 1–2, 5 at tiers 3–4, 5 at tiers 5–6 and 4 at tiers 7–9. Keep Home and the four corners free of landmarks. The early pair is a Refiner and a Tri Extractor; Reclaimer is at tiers 5–6. |
| Relocation project | Extend the existing Resource Relocation project to cover all four landmark types. No separate landmark project or per-type project. |
| Relocation availability | The expanded Resource Relocation project remains available only after recorded victory-research completion. First Final Core production alone is insufficient. |
| Relocation research price | Keep the one-time bill of 1 each Simple, Basic, Automata, Hydro, Shiny, Complex and Final Core: 7 Cores total. |
| Relocation scope | Move landmarks only within their current Map Node. Resource Relocation grants no transfer between Map Nodes. |
| Relocation move fee | Once Resource Relocation is completed, landmark moves have no additional material fee. |
| Extractor relocation grouping | Move the Tri Extractor alone unless the player explicitly selects its reserve too. When both are selected, move them together subject to valid group placement and connections. |
| Extractor reconnection | Allow reconnection to another eligible ordinary Wood, Stone, Copper or Iron reserve within the same Map Node. Guarded and Golem reserves are excluded from this initial version. |
| Extractor resource-switch stock | Switching resource type discards old stock in all three output buffers, matching ordinary Extractor rewiring. Reconnecting to the same resource type keeps matching stock; no empty-buffer prerequisite is added. |
| Doubler recipe scope | Support broader deterministic, single-product manufacturing, including advanced components. Exclude Cores, bots and bot parts, corner pieces, recycling, chance-output recipes and material recovery loops. |
| Landmark names | Use Rapid Refiner, Rapid Smelter, Rapid Assembler and Rapid Fabricator for their fixed machine families, plus Tri Extractor, Doubler and Reclaimer. |
| Doubler machine family | Each Doubler has a fixed normal machine family and can run only eligible unlocked recipes from that family. Keep the node title Doubler; its icon and inspector identify the family. Use one Refiner, one Assembler and one Fabricator across the three landmarks. |
| Reclaimer speed | Use 25% of the ordinary base Recycler cycle time, giving 4× base processing speed. Normal Recycler speed research does not stack with this bonus. |
| Tri Extractor speed research | Apply ordinary Extractor speed upgrades to the shared 5-second base cycle. Keep one reserve unit consumed and three items produced per completed cycle, with the shared blocking rule unchanged. |
| Doubler speed research | Apply the fixed family's ordinary speed upgrades: Refiner research for the Refiner Doubler, Assembler research for the Assembler Doubler and Fabricator research for the Fabricator Doubler. Keep twice the ordinary output per batch. |
| Landmark use cost | Free to use once discovered and the normal machine and recipe unlocks are satisfied. No activation or repair fee; ordinary production ingredients remain required. |
| Quadrant distribution | On the standard world, aim for a balanced spread of roughly 3–5 landmarks per quadrant. Keep the total 16, progression-band quotas and randomized positions; eligible sources and valid placement take priority. |
| Landmark sector spacing | Prefer sectors that do not share an edge with another landmark sector. This is a placement preference, with needed exceptions for the early discovery, eligible sources and valid placement. |
| Family assignment across bands | Keep the introductory landmark's family as Refiner and its location randomized. Shuffle the remaining Rapid families and all three Doubler families across their remaining band slots by seed, preserving global family counts and agreed band/type totals. |

# Proposed landmark catalogue

The counts below are selected for the agreed 16. Machine assignments and operating details beyond the agreed direction remain proposals; Reclaimer requires no Water.

| Landmark | Count | Proposed effect | How it changes a factory |
| --- | ---: | --- | --- |
| Rapid machines | 6 | One fixed machine family; normal recipe inputs and outputs at 10% base cycle time. | Move several production lines toward one powerful processing site. |
| Tri Extractor | 6 | One ordinary extraction cycle creates three identical items from one reserve unit, with a separate buffer and cable outlet for each. | Build three branches around a deposit that lasts three times as long per delivered item. |
| Doubler | 3 | One each Refiner, Assembler and Fabricator. Consume the ordinary recipe inputs but produce twice its normal guaranteed outputs at ordinary cycle time. Restrict to deterministic, single-product recipes. | Concentrate scarce ingredients here, then rebuild downstream transport to handle the extra output. |
| Reclaimer | 1 | Perform unlocked Recycler recipes without Water, retaining ordinary non-Water ingredients and recovery quantities. Use four times base processing speed without stacking speed research. | Build a recovery hub away from a Lake and route waste there. |

# Landmark names

| Landmark | Selected node title |
| --- | --- |
| 10× production | Rapid Refiner, Rapid Smelter, Rapid Assembler or Rapid Fabricator, matching the fixed machine family |
| Three-output extraction | Tri Extractor |
| Double manufacturing output | Doubler |
| Water-free recycling | Reclaimer |

Keep the full bonus explanation in the inspector or tooltip: 10× base speed for Rapid machines; three items from one reserve unit for Tri Extractor; twice the selected output from ordinary ingredients for Doubler; no Water requirement for Reclaimer. Retain the current node body widths and title typography. These names are selected for the proposal. Approximate 17 px Segoe UI Bold measurements range from 65 to 134 px; final renderer, font fallback and hover-control layout still need visual verification.

# Operating rules

All four landmark types are non-deletable. The existing Resource Relocation project will cover moving all four types while preserving their type, bonus, buffers and progress. Players may pause, disconnect and reconfigure recipes within each fixed machine family. Landmarks cannot be copied into templates, sold or converted into ordinary machines. Moving a Tri Extractor leaves its connected reserve in place unless the player explicitly selects both. When both are selected, move them together subject to valid group placement and connections. The Extractor still needs a permitted reserve connection after movement. The project becomes available only after recorded victory-research completion, retaining its current availability. Keep its one-time research bill of one of each of the seven Core types, seven Cores total. Landmarks may move only within their current Map Node; they cannot transfer between Map Nodes. After the one-time research purchase, eligible landmark moves have no additional material fee.

Landmarks are free to use once discovered and their normal machine and recipe unlocks are satisfied. There is no activation or repair fee; ordinary production ingredients remain required. Discovering a landmark does not unlock its recipes or bypass suppression, Lake access, corner encounters, research, or the existing shared Inventory gate. Ordinary factories remain sufficient to complete the game.

Each Rapid machine has a fixed family: two Rapid Refiners, two Rapid Smelters, one Rapid Assembler and one Rapid Fabricator across the six landmarks. One Rapid Refiner is the introductory landmark so it is useful early. Shuffle the remaining one Rapid Refiner, two Rapid Smelters, one Rapid Assembler and one Rapid Fabricator across the remaining Rapid slots by seed: two at tiers 3–4, one at 5–6 and two at 7–9. An advanced family may be found before it is unlocked and remain inactive. Recipe selection remains available within the assigned family.

Rapid machines always use 0.10 of base cycle time, giving 10× unupgraded processing speed. Ordinary family speed research does not stack with this bonus. Reclaimer always uses 0.25 of the ordinary base Recycler cycle time, giving 4× base processing speed. Normal Recycler speed research does not stack with this bonus. Tri Extractors use ordinary Extractor speed upgrades on their shared cycle. Each Doubler uses its fixed family's normal speed upgrades; its separate doubled-output effect does not compound with another landmark.

Give recipe landmarks room for at least two complete input and output batches. Retain ordinary cable, vehicle and Road rates. Faster processing is available capacity; actual delivery still depends on ingredients, buffers and transport. This is part of the incentive to redesign the line. Reclaimer has no Water inlet, Water buffer or Water debit; all non-Water inputs, research gates and output blocking still apply. Its ordinary Recycler counterpart continues to require Water.

The Tri Extractor starts with the ordinary 5-second base extraction cycle, shortened by ordinary Extractor speed research. It uses atomic batches: every completed cycle writes one item to each of its three buffers, each holding five items. If any buffer is full, the shared progress bar waits. An unused output eventually stops all three, so exploiting triple yield requires routing all three branches. Source access, guarded-deposit suppression, regeneration and natural depletion retain their ordinary rules. Triple yield also multiplies effective output from a replenishing reserve while stock is available.

Doubler doubles the chosen normal product for broader deterministic, single-product manufacturing, including advanced components. Exclude Cores, bots and bot parts, corner pieces, recycling, chance-output recipes and recipes that form a material recovery loop. The basic-material-only restriction was not selected. Each Doubler has a fixed normal machine family and offers only that family's eligible unlocked recipes; it cannot convert between families. The icon and inspector identify the family while the node title remains Doubler. The three Doublers are one Refiner, one Assembler and one Fabricator, each using its family's ordinary recipe cycle times and speed upgrades while retaining twice the ordinary output per batch. Shuffle the three fixed families by seed across the one Doubler slot at each of tiers 3–4, 5–6 and 7–9; family complexity does not determine its band. Exact eligible recipes still need specification and a conservation audit before implementation.

# Frequency and distribution

Count sectors, not the individual machine positions inside a sector. Home and the four corner sectors receive no landmarks, leaving 116 eligible sectors. Sixteen landmarks occupy 13.8% of those sectors, or about one in seven. Place at most one in any sector. Fixed totals avoid worlds with no useful discoveries or an accidental surplus.

Place the introductory Rapid Refiner in a seeded random eligible sector directly adjacent to Home. Exclude sectors containing monster camps or other interior obstructions, including Deep Holes, Lakes, living Golems and ruins. The existing clear E1 sector supplies a fallback candidate without moving existing encounters. Choose uniformly among the eligible first-ring candidates. Reveal its direction through the early exploration hint; show its type and bonus only on visiting. The guarantee is a reachable, signposted discovery within one sector purchase, while the player retains the choice of where to explore. Propose a Tri Extractor for the other tier 1–2 slot, randomized among eligible sectors with a usable ordinary reserve.

| Manhattan tier from Home | Sectors in band | Landmarks | Selected type allocation |
| --- | ---: | ---: | --- |
| 1–2 | 12 | 2 | 1 introductory Rapid Refiner; 1 Tri Extractor |
| 3–4 | 28 | 5 | 2 Rapid machines; 2 Tri Extractors; 1 Doubler |
| 5–6 | 40 | 5 | 1 Rapid machine; 2 Tri Extractors; 1 Doubler; 1 Reclaimer |
| 7–9 | 36 | 4 | 2 Rapid machines; 1 Tri Extractor; 1 Doubler |
| Home and tier-10 corners | 5 | 0 | Preserve starting and final challenge sectors |
| Total | 121 | 16 | Shuffle remaining Rapid and Doubler families across their slots by seed |

These bands specify density, not independent roll chances. The denominator includes sectors that individual landmark types cannot occupy. Randomize among eligible sectors within each band. Mix terrain and resource advantages rather than stacking every bonus on Rocky sectors. Do not change terrain quotas, Lake locations, existing ruins, settlement quotas, Golems, border obstructions or corner assignments to make room for a landmark.

After placing the introductory machine, distribute the other fifteen as evenly as the band quotas and eligible sources allow among the four quadrants. Assign center-axis sectors to a quadrant for counting only. The selected standard-world target is roughly three to five landmarks per quadrant overall, minimizing quadrant-count differences while allowing eligible sources and valid placement to take priority. Prefer sectors that do not share an edge with another landmark sector. This is a selected spacing preference rather than a hard prohibition; the early discovery, eligible sources and valid placement may require exceptions.

Tri Extractors need a usable reserve: select one of ordinary Wood, Stone, Copper or Iron, varying targets by seed. Players may reconnect the landmark to another eligible ordinary Wood, Stone, Copper or Iron reserve within the same Map Node, including after its first source is depleted. Reconnection does not grant movement before Resource Relocation is researched. Never add natural Mythril. Guarded and Golem reserves are excluded for both initial placement and reconnection in this initial version. Switching resource type discards the old stock in all three output buffers, matching ordinary Extractors. Reconnecting to the same resource type retains matching stock; switching does not require empty buffers. Reclaimer needs no Lake or Water supply and can occupy an otherwise eligible sector without either. Keep landmark footprints separate from all existing obstructions.

# Placement and discovery

Choose the complete landmark assignment with an independent seeded random stream after the existing world layout is assigned. Fix the introductory family as Refiner, keeping its location seeded, then independently shuffle the remaining Rapid family multiset and the three Doubler families across their respective slots before final footprint validation. Save a landmark layout version, each sector and position, type, machine family and linked reserve when applicable. The same seed and version must reproduce the same assignment; exploration order, reloads and research must not reroll it.

Reserve each footprint, sockets and usable connection approaches alongside existing generation reservations. Keep landmarks clear of Lakes, active Deep Holes, maximum settlement growth, Golem footprints, border art and required Road access. Linked Extractors sit beside their reserve rather than overlapping it. A landmark must fit in the initial field without Area Expansion or a late crossing upgrade.

Before the first visit, hide the type, exact position and bonus. After discovery, show a persistent Power-ups filter and a Points of Interest entry on the Node Map. The early exploration hint may give a direction without revealing the machine or its bonus. Detailed names and final player-facing copy belong to a later interface review.

New campaigns receive this layout version. Existing saves keep their current fields, including unexplored sectors; training maps keep their authored layouts. Any future opt-in migration requires a separate collision and compatibility design.

# Larger worlds

For supported odd world sizes, start with round(16 × (N² − 5) / 116) landmarks, counting Home and four corners as excluded. This gives 16 at 11 × 11 and 60 at 21 × 21. Allocate type counts proportionally with largest remainders, using catalogue order to break ties. Preserve the introductory guarantee and scale progression bands by their fraction of maximum Manhattan distance. Validate reserve eligibility and clear placement separately; a formula alone does not establish a feasible layout.

# Review and validation

Implementation specification still needs the exact eligible Doubler recipes and remaining catalogue tuning. The agreed direction above records the selected landmark counts, accelerated machine mix, speed behavior, movement rules, Extractor blocking and progression spread.

Before implementation approval, audit eligible sectors against existing encounter and resource assignments. Test at least 1,000 standard seeds and representative larger mod worlds for exact counts, early access, band and quadrant distribution, collisions and repeatable assignment. If hard constraints cannot fit, retain the seed and report the conflict for generator correction.

Implementation checks must cover save/load, undo, templates, deletion and relocation restrictions, unlocks, suppression, depletion, three-output atomicity, output reservations, and upgrade arithmetic. Verify moving the Tri Extractor alone leaves the reserve fixed, while explicitly selecting both moves each exactly once as a valid group. Check that Reclaimer can complete batches with no Water supply or stock while ordinary Recyclers still require Water. Audit Doubler recipes and water-free recovery for self-sustaining material loops. Then use normal gameplay to measure first discovery time, landmark use, production relocation, delivered throughput and reserve consumption, with game time separated from setup and interaction overhead.

All figures beyond the agreed decisions are initial tuning proposals. Generator feasibility, normal-play pacing and throughput have not been established.

# Current system context

The current world is an 11 × 11 Node Map. Map tiers use Manhattan distance from Home, and all unlocked sectors keep simulating. E1 is reserved clear and E2 contains a guaranteed Lake. Existing family efficiency upgrades shorten cycles without reducing ingredients; normal Extractors have a five-second base cycle and five-item output buffer.

Local references: `docs/systems/map-nodes-and-exploration.md`, `docs/systems/production-nodes.md`, `docs/systems/efficiency.md`, `docs/systems/connections-and-routing.md`, `docs/systems/storage-and-inventory.md`, and `docs/systems/encounters-and-obstructions.md`.

