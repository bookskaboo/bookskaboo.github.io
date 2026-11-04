# Gameplay and systems design

## Core loop

Discover resources → place Production nodes → choose recipes → connect inputs and outputs → diagnose shortages or blocked buffers → produce and deliver Cores → research capabilities and map access → establish new factories → repeat at greater complexity.

The short loop is a working production chain. The medium loop is a new capability and its supporting network. The agreed long loop reaches four unique corner obstructions, obtains their components for a final Core, and uses that Core to enable a victory project. After victory, reproducible final Cores support further optimization research (Q06); the detailed mechanics remain to be designed.

**Agreed emphasis (Q05):** production optimization and geographic decisions lead the experience. Evaluate new systems by how they enrich supply, processing location, throughput or routing choices. Construction, exploration and encounters support that central activity.

## Current system inventory

| System | Implemented behavior | Design or validation need |
| --- | --- | --- |
| Production | Extractors, Kilns, Smelters, Refiners, Assemblers and later processors; explicit recipe selection for configurable machines | Confirm every tier's bottleneck is understandable |
| Material routing | Typed ports, Joints, Splitters, Mergers, Filters and buffers | Test empty-chain inference, mixed buffers and recovery from wiring mistakes |
| Local construction | Collision checks, movement, selection, Control Groups, grid alignment, copying and undo | Check complex edits at normal zoom and dense layouts |
| Research | Automatic milestones and selected paid projects; synchronized Core sets | Keep capability access distinct from optional investment |
| Transport | Single-material solid Road pairs across adjacent sectors; one item every five seconds | Validate route capacity and reversal enforcement |
| Fluids | Lakes, Intakes, local processing, links and storage | Preserve local Water use; no inter-map fluid roads |
| Waste | Live: Shiny Slag and later probabilistic waste, with buffering/sorting/recovery | Q32 moves the first waste challenge to Complex and makes Shiny waste-free; tooling/recipes pending; retain clear full-buffer stops and optional rare outputs |
| Alternative production recipes | Existing standard recipe system and some composite variants | Q32A adds Complex-researched intermediate alternatives trading reduced resource/node demand for guaranteed waste; candidates and baseline Complex waste scope remain pending |
| Resources | Depletion, forests, planting, drills, regeneration and defeated Golem reserves | Q15: reduce repetitive maintenance while keeping capacity/logistics challenges; test long-term supply against the intended game length |
| Encounters | Recurring bot suppression, Tribute and one-time Golem AP payments | Q14 keeps Goblins optional; Dwarven Tribute supplies Mythril with the Q14B1 Mythril Golem exception; validate bootstrap, AP economy and remaining source exclusions |
| Persistence | Autosave, three manual slots, legacy migration and undo checkpoints | Preserve player progress through changes |

Extractors are **Production** nodes. Stable internal names may differ from player-facing names; preserve serialized IDs for compatibility.

## Power and shared storage

**Agreed and implemented locally (Q10, November 2, 2026):** remove Power from the playable game until a useful integration is designed. Its complexity may not fit the direction of the game. Generators, Power Splitters, Power Lines, Basic Electricity and Power Distribution are no longer playable catalog entries. Hydrochemistry no longer requires Basic Electricity. Tree Planters remain as Production nodes, restoring Forest without Power; their existing upgrade remains available without Power Distribution.

Old saves and templates archive removed Power equipment, wiring and energy; affected in-flight cargo is archived too. These archives do not simulate or render. Stable identifiers and completed research records remain for compatibility, and contributions to a selected retired research project are retained separately. Current shortcut assignments are reconciled against the playable catalog. Power has no scheduled reintroduction; a clear gameplay role is the condition for reopening it. Expanded Power teaching remains deferred; review waste teaching independently if needed.

**Implemented baseline:** Storage and Inventory use a shared global pool and currently unlock through `autonomousLogistics`. Their initial placement limits are one of each across the world. Existing separate repeatable placement projects add one node per rank and escalate costs by 1.5 per rank. These existing numbers describe the live baseline, not newly approved endgame prices.

**Agreed direction (Q11, November 2, 2026):** lock both nodes behind endgame research and use them as a late-game global transport system. Begin with one Storage and one Inventory allowed globally, rather than per map. Progressive research raises the permitted placement count for each node type at progressively increasing research costs. This replaces the proposed limited-convenience role.

**Agreed access checkpoint (Q11A, November 2, 2026):** producing the first final Core makes the Storage/Inventory access research available. Production is the milestone; delivery to the Research Center and first victory are not required to make that research available. Players must still complete the research before placing either node. The initial corner-component collection and first final-Core assembly therefore use ordinary transport.

Upgrade increments, access price, price curve, required Core tiers, connection rates and pool capacity still need specification. The current `endgameTheory` project requires `autonomousLogistics`; moving that unlock later must remove or restructure this dependency so access does not depend on itself. Saved placements, completed ranks and pool contents also need a compatibility policy. These decisions specify the intended endgame design; the runtime gate has not yet moved and the final Core is not implemented.

## Failure and recovery

**Implemented:** production can stall from input shortage, full outputs or waste; deposits can deplete; settlements can grow and disable nearby nodes. Undo and save/load support recovery. Camp suppression is recurring, whereas Golem conversion is permanent.

**Agreed direction (Q12, November 2, 2026):** setbacks are recoverable, with clear causes and repair paths, and there is no game-over state. Keep the challenge focused on diagnosing and improving the factory. This does not remove resource depletion or settlement pressure; their design must preserve a workable route to recovery through ordinary gameplay.

**Needs validation:** players can understand and repair shortages, blocked outputs/waste, depleted supply and settlement encroachment without a forced restart. Exact setback duration and the amount of recovery guidance remain to be designed. Check current recovery paths before adding further failure systems.

## Review checks

For a proposed mechanic, specify the player's new decision, inputs and outputs, throughput, buffers, unlock, failure behavior, recovery, save representation and feedback. Then test it with the systems it can bypass or congest. Q10 removes and defers Power; Q11–Q11A establish endgame global transport, placement research and access after first final-Core production; Q12 requires recoverable setbacks without game over. Q13 next addresses discovery geography outside the fixed endgame corners.

Evidence: [node capabilities](../../src/content/nodeCapabilities.ts), [node catalog](../../src/content/nodes.ts), [connection rules](../../src/simulation/connectionRules.ts), [road rules](../../src/simulation/roadMaterials.ts), [runtime](../../src/simulation/engine.ts).

**Shared product/waste outlet (Q53, November 2, 2026):** the user requires waste to leave through the same connection port as the desired product, creating a mixed stream that players must filter. Apply this to waste-producing production recipes, including the mandatory Controller stream and both alternative sets. This replaces automatic separation at a dedicated machine waste port. Typed downstream inputs, branching and item-choice routing must not silently extract only useful products and bypass the intended filtering task. Exact stream ordering, capacity, blocking and filter behavior still need specification. All batch outputs must be preserved; required separation must be usable before the first Controller batch, without paying Complex Cores for initial access. Waste Bin/Link and recovery remain useful after separation. This is adopted design; runtime still has separate product/WASTE ports.

The live baseline automatically exposes separate product and WASTE ports. The current selected-item Filter has one output; Waste Sorter accepts only waste. Q53A adopts extending Filter to selected-item and remainder outlets; runtime implementation is pending. Q53B adopts an immediate whole-Filter stop when a needed outlet is blocked, preserving items and showing a notification on the Filter until resolved. A shared port label alone cannot satisfy the design if downstream compatibility still chooses product-only items automatically.

Q57 establishes immediate logistics filtering/sorting: no extra processing delay or independent Filter speed limit. Actual transport capacity, travel and destination availability still constrain the stream; Q53B whole-Filter blockage and notification remain. Current runtime must be audited against this direction before implementation is considered complete.

Q77 adopts the Elder Grove receiving Tree Planter regeneration and reopens planter upkeep design. Planters currently restore Forest without consumables after Q10; that remains implemented baseline, not a permanent free-operation commitment. Q78 requires Wood plus small amounts of other resources, without reintroducing Power. Q78A adopts ten Wood/one Iron Plate/one Stone funding one hundred regeneration at current cycles, with preserved unused funding while blocked. Input/capacity/persistence implementation remains pending.


Q83 adopts substantial Complex-era Tree Planter throughput research available before the first final Core, with unchanged material cost per regeneration and proportionally faster supplies. This serves both ordinary Forest renewal and the Grove. Q84 adopts tenfold output with sufficient growth-delivery capacity. Q85 adopts groups of up to ten growth units on existing within-map connections after research. Q86 adopts 100 of each Core through Complex, paid once for output and grouped delivery together. Exact buffer sizes and runtime implementation remain open. Funding/upgrades and all pending Grove behavior still require implementation and normal-play validation.


Q93 adds intermediate recycling to basic materials for unwanted main products of waste-focused lines. Existing waste recovery remains distinct. Final reclamation calibration is deferred pending representative factory waste evidence, with existing-line collection and deliberate waste production as meaningful choices. Q94 adopts raw returns through a dedicated Hydro-era Production Recycler with star/ANY input. Basic resources are destroyed with zero output; intermediates return one of each constituent basic-resource type on a mixed line requiring filters. Q95 confirms the per-item cap; Q96 includes upstream fuel; Q97 adopts fixed standard-recipe contents; detailed design is in [recycling and waste benchmark](13-recycling-and-waste-benchmark.md).


Q94A restricts Recycler returns to solid resources. Fluids are excluded from the mixed recovered-output line. Q95 confirms the one-unit cap; Q96 includes upstream fuel; Q97 adopts fixed standard-recipe contents.


Q98 adopts the uniform two-second Recycler cycle. The user also requires expansion-deadlock rescue: continuously calculate next Map Node requirements, and on genuine depletion show escalating congratulatory modals and open a resource-Golem route, with an achievement after four resource rescues. [Rescue design](14-expansion-solvability-and-golem-rescue.md) records requirements and recovery gaps; Q99 adopts the Wood Golem; Q100 requires permanent shortage counting future usable regrowth.


Q109 adopts two seed-randomized, disjoint component-pair recipes producing Core Half A/B, then one of each half into one Final Core. All three use regular two-input Assemblers and unlock automatically upon first obtaining any corner component. Pairing is fixed per world and saved; Q110 adopts one unit of each paired component per half, preserving one of each corner component per Final Core. This replaces Q108 direct assembly and the dedicated-machine proposal. Q111 adopts 10-second half recipes and a 30-second Final Core recipe before ordinary Assembler efficiency upgrades. Q112 adopts victory on completing a one-time Research Center project costing one Final Core without extras, followed by the glowing modal and same-world Continue; later optimization research remains to design. See [final assembly and postgame](15-final-core-victory-and-postgame.md).


Q113 adopts endgame research making resource nodes, Lakes and monster camps movable through three separate one-time projects, plus increasingly expensive repeatable research reducing Stone needed to fill Deep Holes. [World-reshaping research](17-endgame-research-and-world-reshaping.md) records scope and state-conservation requirements. Q114 adopts same-map movement; Q123 fixes the Stone reduction at 20% compounded per rank with a one-Stone minimum; Q124 credits consumed Stone against the discounted total; Q125 adopts all-seven-Core ceil(1.5^(rank−1)) pricing; Q126 adopts Landfill access after victory; Q127 adopts Landfill cap 45. These are new world-feature capabilities, not a selected generic speed/yield bonus.


Q115 adds endgame Road-channel ranks increasing the shared per-face cap to four then five, plus increasing-cost Train capacity research with matching transfer quantities and relevant loading/unloading improvements. Larger inventory alone does not satisfy that transfer requirement. [Transport design](18-endgame-transport-research.md) preserves current Road inventory/material rules and leaves payload amounts/interval and rank prices to Q116 and later decisions.


User clarification after Q116: transfer increases within a map node are confirmed. Numerical quantities are not chosen; Q116A adopts matching 1/2/4 inter-map batches every five seconds. Interpret prior shipment requirements conditionally until that scope is resolved.


The user adds repeatable resource regeneration including Forests. Improve passive resource-stock renewal up to existing capacity; paid Tree Planter/Grove input remains a separate mechanic. Q117 adopts a separate Final-Core line alongside earlier mineral research; Q119 adopts rate × (1 + endgame rank); Q120 adopts all-seven-Core ceil(1.5^(rank−1)) pricing; Q121 requires victory completion plus Mineral Regeneration 2; Q122 adopts no maximum rank. [Research portfolio](17-endgame-research-and-world-reshaping.md).


The user explicitly extends throughput gains to ordinary Cart → Truck → Train progression: Truck research increases real local transfer capacity over Cart, then Train research increases it over Truck. These gains arrive with those lower-tier projects; repeatable endgame Train research extends them later. Q118 adopts local 1/2/4 quantities at 400 ms launch cadence and 1,000 ms travel, and no inter-map payload answer is inferred.


Q116A/Q116 resolved: inter-map Roads now have adopted design batches of up to 1/2/4 items for Cart/Truck/Train every 5,000 ms (12/24/48 items/minute theoretical per Road). Q118 local 400 ms launches and 1,000 ms travel stay distinct. Source/receiver availability constrains delivery; neither change is implemented yet. Q117 separate-line integration is adopted; Q119 bonus is adopted; Q120 pricing remains open.
