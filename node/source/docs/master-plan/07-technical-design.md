# Technical design and delivery

## Existing architecture

| Area | Current structure | Planning implication |
| --- | --- | --- |
| Domain and content | Typed state plus item, recipe, node and research catalogs | Keep design names separate from serialized IDs |
| Simulation | Renderer-independent engine, fixed 100 ms step | Test production and conservation without UI dependencies |
| Research timing | Shared five-second base for new/loaded centers; six upgrades reduce it to two seconds at rank 6 | Normalize legacy timing and use the same base in live calculations before balancing |
| Presentation | React UI, PixiJS active-sector graph, 750 ms UI publication | Measure responsiveness as well as engine cost |
| World | Inactive sectors continue simulating; only active sector renders | Large-world cost includes factories outside the viewport |
| Persistence | Local save slots, autosave, migration and up to 50 undo checkpoints | Treat save size, migration and undo memory as budgets |
| Tooling | TypeScript/Vite, Vitest, progression analyses and opt-in stress scenarios | Distinguish analytical assumptions from gameplay evidence |

The permanent save keys include `factorinode.save-slots.v1` and `factorinode.temporary-save.v1`. Offline catch-up is disabled in the documented baseline to avoid duplicate production. Save and timing changes need an explicit compatibility design.

Q10 removes Power from the playable game. Load and state replacement archive Power equipment, wiring, stored energy and affected in-flight cargo under `deferredPower` on each sector or template, outside the active graph. Existing IDs remain loadable. Tree Planters retain their Forest Growth output without a Power input. Keep the archive during future save migrations; automatic Power restoration is not implemented.

## Risks and technical questions

Browser frame rate, input latency, long-session memory, serialization time and undo costs remain unbudgeted for the intended world scale. Historical engine-only stress reports do not establish acceptable browser performance. The 6,540-node estimate comes from 109 maps at 60 nodes per map; both map coverage and readability remain design assumptions.

**Agreed performance priority (Q20, November 2, 2026):** first measure a representative late-game factory in the actual browser on specified hardware, then run larger stress workloads for headroom. Include rendering, interaction/input latency, simulation, memory, saving and undo. Record browser/version, hardware, viewport, factory composition, active/unlocked maps and workload duration. The largest synthetic world is not the initial acceptance workload.

The reference factory, hardware/browser matrix and numerical budgets remain to be defined before testing. For stabilization through Complex, use representative implemented late production; extend the workload when tier-7 content exists. Do not turn the provisional 6,540-node estimate into a verified support claim. This is a future validation commitment, not a completed benchmark.

`package.json` uses `latest` dependency ranges. **Proposed delivery check:** establish the lockfile/install policy and test a clean production build before release. Do not update dependencies merely as part of this plan.

**Agreed milestone platform (Q04, November 2, 2026):** desktop browser with mouse and keyboard. Touch support and packaged desktop delivery are outside this milestone.

**Agreed development save policy (Q21, November 2, 2026):** compatibility is best effort during development; changes may require a fresh start. Existing migrations and the Power archive remain in place, but preserving every older save is not a release blocker under this policy. Choose and document supported versions or intentional breaks for each affected change. This decision does not erase current saves, remove working migrations or change browser storage keys.

Fresh-game behavior and saving/loading within a supported version still need verification. Earlier migration/preservation recommendations in this plan are candidates to evaluate under this policy, not a blanket backward-compatibility guarantee. A later stable-release compatibility commitment remains to be defined if needed.

**Open:** supported browsers, minimum hardware, viewport, import/export expectations, offline behavior and deployment process. Q20 establishes the testing priority; its hardware/browser matrix and budgets remain work to specify. Q22 next covers distribution.

## Content change workflow

Exact higher-tier design data and generation instructions live in the existing progression tools. Before changing content, identify the authored input and generated outputs. Regenerate the live catalog and reports in the documented order, inspect the difference, check recursive Core independence, and run relevant checks. Editing a generated value alone can be lost on regeneration.

## Proposed delivery checklist

**Agreed distribution (Q22, November 2, 2026):** release the completed stabilization-through-Complex version publicly in the browser using static hosting. Desktop packaging remains outside the milestone. This selects the delivery direction; it does not publish the current build or establish that release gates have passed. Choose the concrete release build, destination and version identity when preparing publication.

1. Record the supported environment and expected scale.
2. Run applicable unit/regression checks and a production build.
3. Verify a fresh game and save/load after the changed feature. Check older saves only within the chosen support boundary; document intentional development-version breaks under Q21.
4. Measure browser performance on a representative factory when scale or rendering changes.
5. Record what was tested and which limitations remain.
6. Update change history. Associate a release only after publication is confirmed.

Publication is separate from a local build or commit. Verify the hosted build after delivery and associate change-history release records only with confirmed publication. This planning decision makes no deployment changes.

Evidence: [package scripts](../../package.json), [engine](../../src/simulation/engine.ts), [storage keys](../../src/persistence/storageKeys.ts), [migration](../../src/persistence/legacyMigration.ts), [architecture checks](../../scripts/architecture.test.ts), [historical stress results](../../outputs/stress/latest.md).

## Shared product and waste routing design

Q53 requires waste and primary products on the same production output port, with explicit filtering by the player. Current `getEffectiveNodeOutputFamilies` in `src/content/nodes.ts` emits separate product and WASTE families; `engine.ts` chooses source items using target acceptance. Both need coordinated design changes so an unsorted output is not implicitly purified by typed destinations. Changing the displayed port alone is insufficient.

Q53A adopts extending Filter to selected/remainder outlets. Q53B adopts immediate whole-Filter stop on a needed blocked outlet: pause intake and both forwarding paths, preserve items, resume when clear, and show an on-node notification while blocked. An unused empty output does not count as blocked. Derive the notification from the actual blocked state and avoid repeated per-tick alerts. Review shared-stream representation and order, total throughput, item conservation across complete batches and in-flight transfers, capacity/backpressure, source fan-out and pass-through routing. Preserve early filtering access, type-specific post-filter waste links and recovery. Inspect Filter/Inventory behavior, recipe switching, templates, undo and saved output-port indexes under Q21 before implementation. Existing separate waste-port connections require a documented conversion or development compatibility boundary. No runtime changes have been made by this planning decision.

Q57 adopts immediate filtering/sorting with no added node-processing delay or independent Filter throughput budget. The proposed 150/minute cap is withdrawn. Current 400 ms ordinary launch cadence and 1,000 ms cable travel describe transport, not an approved Filter processing speed. Filter chains must not add a per-node wait; transport constraints and Q53B immediate blockage still apply. Audit existing Filter/Waste Sorter paths, simulation-step effects and route resolution against this direction. Q58 adopts batch-preserving product-then-waste sending order. Preserve ordered pending output across recipe changes, save/load and transfers so destination compatibility cannot cherry-pick a later product. This does not add a production pause when normal buffer capacity permits further batches; runtime changes remain pending.

Q68 adopts a Mythril-specific Golem clearing cost of 20,000 AP; runtime implementation is pending. Current `src/content/resourceGolems.ts` exposes a shared 10,000 `GOLEM_AP_COST`. Applying a new Mythril cost must not raise Iron/Copper/Stone costs unintentionally. Audit fresh initialization, partially damaged Golems, defeated reserves and legacy health handling under Q21 before implementation. No automatic revival/reset or save migration policy is selected by this cost decision.

Q70 adopts per-Dwarven Tribute capacities 100/100/120/216/360/576 at tiers 4–9; runtime implementation is pending. Current `goblinTribute.ts` uses shared `TRIBUTE_CAPACITY` both when creating a node and in production capacity checks. A future per-node Dwarven capacity change must reconcile both paths and UI/save state, while retaining unrelated Goblin and Alpha policies. Updating only a displayed capacity would not change the production guard.

Q72 defines the Ancient Foundry as an immovable advanced-assembler-like world node at its seeded assigned corner under Q77A. Plan recipe inputs, progress and repeat crafting with the same clarity as production machines, while retaining unique world placement and agreed Tribute collection. Do not add a commission-selection workflow or make it a placeable/movable copy of an ordinary Assembler II. Q72A adopts input identities Circuit B/Sealed Frame/Mythril Gear. Q73 requires cost parity per corner component instead of adopting ten each. Derive quantities/yield before sizing bespoke input storage; it must fit the eventual full batch. Cycle and other runtime details remain unapproved; no feature is implemented.

Q76 adopts a lossless pause in reclamation intake/consumption when the component box is full. Preserve accumulated credit, buffered waste and in-flight reservations across blockage, save/load and resumption; do not turn the corner into an implicit disposal node. Actual credit values, threshold and input/output capacities remain undefined. Numeric state and capacity rules need design/verification before implementation.

Q77A requires a one-time seeded permutation of the four challenge identities across the four reserved corner maps. Persist the mapping and bind component IDs, progress, stock and damage to challenge identity; do not recompute a different assignment on load or generator updates. Check each role exactly once and preserve other seeded world systems. Q77 adds Grove compatibility with Tree Planter Forest Growth output; no universal new transport behavior is implied. Q78 upkeep must cover both `treePlanter` and its legacy alias, funded regeneration credit, blocking and persistence if adopted. No runtime changes are implemented.

Q78 requires mixed upkeep using Wood plus small quantities of other resources. Q78A adopts a whole twelve-item funding batch (10 Wood, 1 Iron Plate, 1 Stone) for 100 regeneration; current planter input capacity is ten total, so implementation must add appropriate inputs and sufficient total/per-item storage. Preserve unused funded output across blocked periods/save-load and cover the legacy planter alias. Supporting materials, quantities, gradual emission and preserved unused funding are adopted. Grove conversion and runtime implementation remain pending.


Q83 adopts substantial Complex-era/pre-first-final-Core Tree Planter throughput research with unchanged resource cost per growth. Q84 adopts tenfold production plus sufficient growth-only delivery. Current planter output is single-connection, output buffer five, ordinary dispatch one unit per 400 ms; a production-only multiplier cannot meet 600/666.67 growth per minute on that route. Review bulk transfer representation, item-unit capacity reservations, buffers, blocking, source/destination accounting, save/load and legacy aliases before implementation. Preserve travel timing and ordinary material/Road rates. Q85 adopts up-to-ten-unit growth transfers on existing within-map routes; Q86 adopts the shared research price and runtime remains unchanged. Current InFlightTransfer has no quantity, pending counts add one, total-capacity reservations use transfer count and delivery/cancellation move one item; all must become unit-aware for grouped growth. Preserve legacy default-one transfers and non-delivering cosmetic pulses, transparent routing, travel timing, lossless partial groups and destination capacity. Ordinary materials/Road dispatch stay unchanged. This mechanism is adopted design with implementation pending. Q86 adopts a shared 100-of-each-Core-through-Complex price for output and delivery together; do not split the two effects into separately paid unlocks that leave the advertised rate unusable.


Q89 fixes Grove regeneration at 2,000,000 per component. Q91 adopts an accumulating progress meter, not a two-million-item input buffer. Q90 adopts direct multi-connection Grove input using the existing multiInput convention, with independent growth routes and unit-based reservations. Preserve route limits through mergers and validate actual intake/progress service capacity and world geometry. Do not infer the illustrative 100-planter rate from a single input route. Q91 adopts accumulated progress, immediate two-million-threshold awards, surplus and a lossless full-box pause. Handle simultaneous arrivals and box-slot reservations atomically and preserve credited/buffered/in-flight growth through full output, disconnection and save/load. This cycle is adopted design; runtime implementation remains pending. Q92 adopts ten components per corner output box. Use per-box capacity for atomic reward reservations, runtime production, display and save/load; do not inherit the old generic one-hundred ceiling. Input buffer sizes remain separate.


Q93 requests intermediate recycling. Specify supported items and fixed recovery recipes, compare all ordinary/composite/alternative input bills for shared item IDs and check complete production-recycling/waste loops. Define machine, buffers, multiple outputs, blockage, research and save integration after design review. Q94 adopts a dedicated early/Hydro-target Recycler, automatic star input, zero-output basic-resource disposal and one-of-each constituent raw returns in a mixed stream for filtering. Exact composition, throughput and input coverage remain open; no provenance system is selected. Q95 confirms the per-item cap; Q96 includes upstream fuel; Q97 adopts fixed standard-recipe contents. Keep future-design analytical rates distinct from measured runtime waste.


Q94A requires a solid-only Recycler output table and routing family. Exclude all fluid returns even when an accepted intermediate has fluid inputs/content; do not emit an additional liquid byproduct. Input eligibility remains subject to the star/ANY design and pending classification. Q95 confirms the cap without a batching exception; Q96 includes upstream fuel; Q97 adopts fixed standard-recipe contents.


Q95 rejects automatic recycling batch exceptions and confirms the per-item maximum of one unit per qualifying solid resource. Implement the eventual constituent table with that cap; do not multiply recovery by ingredient counts or item complexity. Do not infer source-recipe changes. Q96 includes upstream fuel; Q97 adopts fixed standard-recipe contents, and runtime remains unchanged.


Q97 adopts a fixed ordinary-manufacturing composition table with no production-origin tracking. Derive solid types from designated standard recipes (including Charcoal/Wood), not all recovery paths; ignore recipe quantities for type membership and emit at most one per resource. The generated analytical reference resolves forty primary products and excludes fluids/retired recovery sources. Input eligibility and runtime catalog remain pending. Q98 base cycle is a proposal.


Q98 adopts a 2,000 ms Recycler base cycle. Its expansion-rescue extension needs an incrementally invalidated feasibility/budget model, frozen Map Node quote and contribution handling, whole-stock allocation, multi-source shortest map paths, atomic once-only unlock/rescue flags, modal ordering and persistent achievement progress. Existing achievement IDs persist, but new display/event handling is required. Preserve factories, paid research and Map Points during direct rescue unlocks. Q98B completes the rescued target's access/AP; the exact deadlock solver, renewable horizon and extraction readiness remain unresolved; no rescue implementation exists yet. See [design and source evidence](14-expansion-solvability-and-golem-rescue.md).


Q98B adopts target-specific access/AP completion during rescue. Reuse the normal defeated-to-infinite conversion outcome, with no bot debit; apply it atomically with path unlock and rescue flags. Review survey gating without granting unrelated research, preexisting defeated targets, save/load idempotency and readiness for ordinary extraction. This remains a design requirement, not implemented runtime behavior.


Q100A excludes Wood from automatic rescue candidates while preserving renewable-Wood requirements in the budget model. Persist only actual qualifying emergency events; do not create a Wood event for achievement completion. Reopen achievement scope pending Q102. Q101 input eligibility has no answer and must not be inferred from the user's Wood correction.


Q101 adopts the forty-entry current craftable-item input set, including six Core/four bot types; update Recycler validation and preview from one reviewed table. Raw basics use zero outputs. Unmapped waste/future special goods need explicit policy. Do not track production origin or refund contributions already consumed by research. Q103 exact research gate/price are proposals; runtime is unchanged.


Q103 fixes Recycling prerequisite to Hydraulic Assembly and research costs to ten each Simple/Basic/Automata/Hydro. Q104 reviews whether the input predicate excludes the four WASTE_ITEMS or treats them as zero-output destruction; no fallback may silently assign them intermediate refunds. Preserve mixed-source ordering and stock if an item is incompatible. Runtime remains pending.


Q104 fixes Recycler input exclusion for all four WASTE_ITEMS. Q105 proposes ordered input/output queues, ten-item total capacities, all-or-nothing result commitment and retained progress while blocked. A zero-output input requires zero return space but cannot overtake the queue head. Current bag-only storage/order is insufficient if it silently changes arrival/batch order; define explicit persisted queue/progress state during implementation. Preserve normal routing rates and mixed-output filtering. No queue/buffer policy adopted yet.


Q105 adopts explicit persisted Recycler input/output order, ten-item total buffers, atomic consume/complete-return commitment and retained blocked cycle progress. Zero-output head items require no return storage. Implement queue identity/progress, safe cancellation and save compatibility under this rule. Q106 proposes evaluating rescue from stable completed updates and recalculating after each atomic path/reserve unlock, with once-per-resource flags and revalidated queued modals; the multiple-deficit policy remains under review.


Q106 adopts one atomic rescue plus fresh feasibility before another, selecting fewest extra map unlocks with deterministic ties. Queue/revalidate subsequent modals only after the previous closes; evaluate stable completed state updates. Q107 keeps the cached live expansion-budget model internal, updating independently of mounted panels. Preserve quote/contribution and stock-accounting semantics.


Q107 places feasibility/budget calculation entirely in internal game logic, independent of mounted UI; do not wire a player-facing budget selector/panel. Developer validation can inspect internal diagnostics separately. Only proven stable-state failures may dispatch the adopted once-only rescue transaction and outcome modal. Ordinary research quote/progress UI is distinct from this hidden calculation.


Q109 adopts per-world seeded pairing of four component types into two ordinary Assembler recipes, then a third ordinary Assembler recipe combining their products. Persist the resolved pairing and first-component acquisition milestone; unlock all three together when any component is first awarded/owned, retaining access after spending it. Recipe UI, simulation and save/load must share the same world-specific resolution without mutating the global recipe registry or leaking between worlds/tutorials. No dedicated four-input node or Endgame Theory assembly gate is required. Q110 adopts one unit of each paired component per half and one of each half per Final Core. Q111 adopts base cycles of 10,000 ms per half and 30,000 ms per Final Core with ordinary Assembler efficiency rules. Migration details remain open. Add the new goods to fixed standard-composition Recycler coverage before enabling their recycling. See [Final Core design](15-final-core-victory-and-postgame.md).


Q112 adopts a selected one-time victory research costing one Final Core. Commit payment, project completion and victory together; persist separate modal acknowledgement to show an unacknowledged completion after load and suppress already dismissed/repeated celebrations. Keep first-production global transport availability independent. Same-world Continue preserves factory, camera, stock, progress and pause setting; focus returns when the dialog closes. [Modal design/preview](16-victory-modal.md) is authored; no runtime integration or end-to-end save/payment verification is claimed.


Q113 world relocation requires research-aware permissions shared by drag/group moves, collision previews, commands, undo and save/load; current world controls are statically immovable by kind. Keep protected feature identity/state and linked Tribute/connections intact, without enabling duplication or globally mutating definitions based on one save. Efficient Landfill needs consistent remaining-fill accounting and display once its rank formula/partial-progress policy is selected. Q114 requires same-map movement and forbids transferring these features to another sector. [Requirements](17-endgame-research-and-world-reshaping.md).


Q115 integration must extend Road face accounting/UI and endpoint placement to five without separating incoming/outgoing quotas. Coordinate capacity updates with real batch shipment and relevant vehicle loading/unloading, preserving existing vehicle IDs, cargo, templates and all-map effects. Current Road inventory commits and cosmetic pulses must not duplicate batched goods. Q116A fixes inter-map payloads at 1/2/4 per 5,000 ms; endpoint and later-rank details remain open; no global ordinary-material, fluid or growth speed change is implied. [Transport requirements](18-endgame-transport-research.md).


User clarification after Q116: transfer increases within a map node are confirmed. Numerical quantities are not chosen; Q116A adopts matching 1/2/4 inter-map batches every five seconds. Interpret prior shipment requirements conditionally until that scope is resolved.


Forest-inclusive regeneration must reconcile current separate Forest (engine) and mineral (progression) paths. Q117 adopts a separate new Final-Core project; preserve the existing mineral IDs/ranks and assign the new line its own stable ID during implementation. Define one coherent effective-rate calculation without double-applying ranks or multiplying Tree Planter/Grove delivery by accident. Preserve node capacity, stored stock and earned cycle progress through rank changes/save-load. Q119 adopts effective rate = ordinary-researched rate × (1 + endgame rank).


Lower-tier throughput effects must resolve from ordinary Road/Truck/Train research and canonical Cart node identity, including serialized aliases, rather than a display-name check or Final-Core-only repeat count. Apply capacity and transfer effects to existing/new/custom-named vehicles, templates and every map while preserving stock/wiring. Q118 adopts local 1/2/4 batches; Q116A adopts inter-map 1/2/4 per five seconds.


Q116A/Q116 resolved: inter-map Roads now have adopted design batches of up to 1/2/4 items for Cart/Truck/Train every 5,000 ms (12/24/48 items/minute theoretical per Road). Q118 local 400 ms launches and 1,000 ms travel stay distinct. Source/receiver availability constrains delivery; neither change is implemented yet. Q117 separate-line integration is adopted; Q119 bonus is adopted; Q120 adopts all-seven-Core ceil(1.5^(rank−1)) pricing; Q121 requires victory completion plus Mineral Regeneration 2; Q122 adopts no maximum rank.


Q120 requires synchronized seven-Core contributions, including the future Final Core, for the separate regeneration project. Derive the rank quote from its unrounded base with ceil(1.5^(rank−1)); preserve contributions, stable quotes and completed ranks across load. Extend content/UI/Core acceptance consistently during integration, without treating the new Final Core as an existing implemented item.


Q121 availability is the conjunction of recorded victory-project completion and Mineral Regeneration 2. Do not substitute first-Core production, victory-modal acknowledgement or an older repeatable rank. Persist/reconcile those existing progress flags across load; subsequent ranks follow ordinary repeatable completion. Q11A global transport retains its independent first-production gate.


Q122 regeneration has no maximum rank. Preserve the adopted formulas and completed ranks; validate cost/rate precision, display and multi-unit regeneration at short periods without imposing an unapproved gameplay cap. This does not decide Efficient Landfill or Train rank limits.


Q123 Landfill uses exact upward rounding of original base × (4/5)^rank, minimum one Stone total. Define original-base and consumed-fill provenance independently from unused buffer/in-flight stock; Apply the adopted Q124 consumed-fill credit rule and define an explicit legacy migration policy before runtime recalculation. No research-rank change may duplicate goods or invent consumed history.


Q124 requires original whole-hole requirement plus cumulative consumed-fill history, separate from buffered/in-flight Stone. On rank change recompute the 20%-per-rank total once, subtract consumed fill, clamp remaining to zero and leave eligible holes ready for normal clearing. Preserve unused goods and suppress refunds/duplicate fill. Follow Q21 best-effort development-save policy when provenance is unrecoverable; do not invent historical payments.


Q125 Landfill uses the seven-Core price/quote/payment convention already adopted for regeneration, but its own completed-rank counter and future access/cap policy. Preserve partial research contributions and apply rank/whole-hole recalculation consistently at completion; never infer an unlimited Landfill counter or Mineral Regeneration 2 prerequisite from the shared price curve.


Q126 Landfill first-rank availability follows recorded victory-project completion, without another ordinary research prerequisite or modal acknowledgement. Keep normal pre-victory fill/clear actions and explicit research selection/payment intact. Q127 cap implementation remains open; source generator currently bounds natural original requirements at 20,000 Stone.


Q127/127A recurring endgame UI uses one stable project entry plus a saved completion count. Compute the current level/quote from that state, advance after completion, preserve paid progress/focus and stop capped purchases at the chosen maximum. Landfill ends at 45; regeneration is uncapped. Add max-rank eligibility/completed-state handling consistently across list/tree/details/selection without inventing per-level IDs or enabling auto-research.


Q128 Train capacity and local/Road batch limits must derive from the same saved completed-rank count: 80 + 20r and 4 + r. Apply during ordinary vehicle normalization, load/new placement/template handling and dispatch, retaining stock/IDs/custom names and all-map effects. Keep source/receiver room reservations in real units. No direct global mutation of other worlds/tutorials or automatic price/cap inheritance is implied.


Q129 recurring Train research uses its own completion counter with the shared seven-Core rank-price formula. On completion update that rank and normalize effective capacity/batches for existing vehicles/templates/all maps without dropping cargo; do not change ordinary Trucks/Trains prices or auto-purchase the next level. Q130 prerequisites are adopted; Q131 adopts no maximum Train rank.


Q130 recurring Train availability requires recorded victory completion and completed ordinary Trains research together. No vehicle-placement, notice-dismissal or Mineral Regeneration 2 dependency is implied. Preserve old vehicle research availability/prices and global transport’s separate first-production gate. Q131 adopts no maximum Train rank.


Q131 Train ranks are uncapped. Preserve dedicated completed counts, exact increasing prices and capacity/batch formulas at larger values without imposing another line’s maximum. Ordinary tier transfer code is now implemented under NODE-0297; the recurring counter/gain integration still needs implementation. Advanced Road ranks remain a separate two-level line ending at five slots.


Q132 advanced Road line uses one project identity with two paid completion levels: endgame r=0/1/2 corresponds to three/four/five slots after the earlier three-slot project. Quote one/two each of all seven Core types, require the preceding level and prevent level three purchases at five slots. Preserve paired/shared face accounting. Q133 initial access requires victory plus Road Channels 2.


Q133 advanced Road first-level availability is recorded victory completion AND Road Channels 2 completion; second level also needs the first endgame level. Do not add an ordinary Trains/placed-vehicle/notice gate. Keep earlier Road availability and separate first-production global transport access intact.


Q134 adds three independent one-time completion flags/bills: Resource Relocation, Lake Relocation and Monster Camp Relocation. Charge one of each of seven Core types per project once globally, not per instance/map/move. Derive each feature family’s movement permission from its matching completed project; preserve stock/state and map identity and charge no further material fee. Q135 post-victory gate is adopted; precise targets/handling remain open.


Q135 relocation availability requires recorded victory completion, with no other research/feature-placement/notice prerequisite. Availability alone must not grant movement: each family’s separate completed project is still required. Global first-production transport access stays independent. Q136 adopts cleared-Golem resource coverage alongside Forests and ordinary valid deposits; retain ID, resource stock/capacity, regeneration and infinite/defeated history. Living encounters remain excluded. Q137 adopts a coupled camp/box relocation transaction with equal displacement, identity/stock/timer preservation, group deduplication and all-or-nothing placement validation; recompute encroachment without resetting upkeep or suppression. Q138 adopts moving a Lake alone while keeping connected Intakes in place, preserving connections, stock and progress; include Intakes only through explicit group selection. Lake relocation does not change the two-Intake limit or connection-based production. Runtime relocation remains pending.

Q139 adopted access-price integration: preserve autonomousLogistics identity and first-production gate; quote and consume one of each of all seven Core types through normal synchronized Research Center payment. Retain Precision Control prerequisite and separate victory/access completion. Buying access grants the initial one-Storage/one-Inventory global allowances, not placement ranks. Existing paid progress needs compatible reconciliation without double charging or duplicating Cores. Runtime price update remains pending.

Q140 placement-price integration: retain storagePlacementCapacity and inventoryPlacementCapacity as separate counters and synchronized seven-Core bills of ceil(1.5^(rank - 1)) each, independently rounded from the original base. Derive global allowances as one initial placement plus the corresponding completed rank; one project must not grant or charge for the other. Keep the single updating entry and saved rank/progress; avoid double charging on compatibility reconciliation. Runtime pricing remains pending.

Q141 connection-price integration: retain storageConnectionCapacity and inventoryConnectionCapacity as separate counters, each quoting ceil(1.5^(rank - 1)) of all seven Core types through synchronized payment. Each completed rank adds one permitted connection to every matching node; retain destination validation, including Inventory-to-Filter restrictions. Do not grant placements, new throughput or ranks of the other line. Preserve saved counters/progress and one updating entry. Runtime pricing remains pending.

Q142 Foundry conversion is an immediate atomic input/output transaction, not a timed processing batch. Require the full three-part recipe and one available component slot before debiting inputs; persist the resulting stocks together. Prevent double award/charge under save/load or repeated update calls and preserve incomplete/full-output stock. No sixty-second timer or ordinary Assembler efficiency modifier is needed. Runtime pending.

Q143 input-storage integration: Foundry has separate 3,000-item limits for Circuit B, Sealed Frame and Mythril Gear, totaling one full recipe. Alpha has 100 bot spaces, Reclamation 100 mixed-waste spaces and Grove 100 incoming-growth spaces, totals rather than per-type limits. Persistent AP/reclamation/growth meters are separate. Include in-flight receiving reservations in capacity checks, preserve accepted stock on blockage and drain threshold-processing arrivals without adding a rate cap or delay. Preserve per-corner output-full rules and ten-component boxes. Runtime pending.
