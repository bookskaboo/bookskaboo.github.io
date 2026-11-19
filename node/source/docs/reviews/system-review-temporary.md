# Temporary system review register

[Documentation hub](../README.md) · [Current systems](../systems/README.md) · [Primary history](../changelog/README.md)

Working issue queue from the November 18, 2026 document review. **27 items are open. No gameplay changes are implemented by this review.** Two items should precede future content implementation: world-rule compatibility and the outdated content compiler. The review also confirms two player-facing presentation defects and three errors or overstatements in the new system references. The newer Deep Hole exploration proposal has settled generated-only blocking; completed-purchase access and continued funding of already-started destination purchases are also settled. SR-26/SR-27 implementation checks are still pending.

## How to use this register

Address one issue at a time. Preserve SR IDs when reordering. For an unresolved policy, present one native question card with current behavior, concrete alternatives and a recommendation. For an already settled rule, do not ask for the same decision again: scope and implement it when implementation is authorized. A deliberate deferral settles the item for now and advances the queue.

Replace an item's **Outcome: pending** with the decision, implementation/deferral state, verification and its permanent NODE changelog ID. Update affected system documents and generated catalogs with the actual change. This file is a temporary work queue, not another history. Once every item has a permanent disposition, archive the completed register and retain a short pointer at this path if history cites it; preserve the supporting evidence and permanent records.

Priorities indicate work order: **P1** protects future releases or content editing; **P2** affects correctness, agreed mechanics, guidance or production decisions; **P3** covers validation and maintenance. An approved feature that is absent from current legacy rules is an implementation gap, not evidence of a new regression. No issue below establishes a live-site defect without checking the served build.

## Queue

| ID | Priority | Classification | Issue | State |
| --- | --- | --- | --- | --- |
| [SR-01](#sr-01-world-rule-persistence) | P1 | Approved implementation prerequisite | Preserve old/new world rules through saves and future exploration | Open |
| [SR-02](#sr-02-historical-content-compiler) | P1 | Confirmed tooling regression risk | Historical compiler would restore obsolete Core recipe gates | Open |
| [SR-03](#sr-03-unused-stone) | P2 | Approved implementation gap | Refund unused Stone on completed holes | Open |
| [SR-04](#sr-04-filled-terrain) | P2 | Approved implementation gap | Preserve non-blocking grey filled terrain | Open |
| [SR-05](#sr-05-hole-candidate-budgets) | P2 | Approved implementation gap | Implement five-candidate area and Stone budgets | Open |
| [SR-06](#sr-06-guarded-camp-resources) | P2 | Approved implementation gap | Replace new-world Tribute with guarded deposits | Open |
| [SR-07](#sr-07-intake-only-water) | P2 | Approved implementation gap | Require Intakes for all new-world Lake Water | Open |
| [SR-08](#sr-08-intake-count-upgrades) | P2 | Approved implementation gap | Raise Intake cap from two to three to four | Open |
| [SR-09](#sr-09-coupled-lake-relocation) | P2 | Approved implementation gap | Move connected Intakes automatically with Lakes | Open |
| [SR-10](#sr-10-freight-rate-display) | P2 | Confirmed game presentation defect | Road rate omits postgame payload ranks and mod timing | Open |
| [SR-11](#sr-11-pump-relay-reference) | P2 | Confirmed documentation error | Library denies implemented Pump relay behavior | Open |
| [SR-12](#sr-12-mythril-drill-reference) | P2 | Confirmed documentation error | Library advertises a rejected Mythril Drill target | Open |
| [SR-13](#sr-13-postgame-fluid-transport) | P2 | Confirmed documentation overstatement | Shared pool provides a postgame fluid transport exception | Open |
| [SR-14](#sr-14-copper-slurry-storage) | P2 | Policy clarification | Slurry is a fluid but Fluid Tanks reject it | Open |
| [SR-15](#sr-15-mod-recovery-control) | P2 | Confirmed game presentation defect | Mod checkbox promises a removed recovery speed effect | Open |
| [SR-16](#sr-16-research-shortage-navigation) | P2 | Approved implementation gap | Missing-Core links stop at recipes rather than shortages | Open |
| [SR-17](#sr-17-later-system-teaching) | P2 | Agreed scope needing specification | Teach fluids, mixed waste and later encounters contextually | Open |
| [SR-18](#sr-18-current-balance-baseline) | P2 | Balance validation gap | Pacing and upgrade payback evidence predates current rules | Open |
| [SR-19](#sr-19-sustained-world-feasibility) | P2 | Feasibility validation gap | Verify sustained six-Core and repeatable endgame supply | Open |
| [SR-20](#sr-20-supported-scale) | P2 | Performance acceptance gap | Define supported scale beyond the 150/300-node fixture | Open |
| [SR-21](#sr-21-accessibility) | P2 | Agreed validation scope | Complete the focused accessibility audit | Open |
| [SR-22](#sr-22-audio-scope) | P3 | Agreed scope needing specification | Adopted soundscape has no implemented audio system | Open |
| [SR-23](#sr-23-word-layout-verification) | P3 | Documentation QA gap | Current style references lack successful final render QA | Open |
| [SR-24](#sr-24-planning-status-conflicts) | P2 | Documentation reconciliation | Active plans still present obsolete rules as current | Open |
| [SR-25](#sr-25-history-supersession) | P2 | History reconciliation | Some replaced decisions lack clear replacement links | Open |
| [SR-26](#sr-26-depletion-and-exploration) | P1 | Settled scope; validation pending | Only generated holes trigger the exploration gate | Decision recorded (NODE-0601); checks pending |
| [SR-27](#sr-27-purchased-but-unvisited-maps) | P1 | Settled payment/access policy; validation pending | Honor completed purchases and let started purchases finish | Decisions recorded (NODE-0602/NODE-0603); checks pending |

Suggested batches: establish SR-01/SR-02 safeguards, preserve the settled SR-26/SR-27 rules before implementing the exploration gate; resolve SR-10/SR-15 presentation defects; correct SR-11–SR-13 and SR-24/SR-25; implement authorized new-world work SR-03–SR-09 behind its version boundary; address SR-14/SR-16/SR-17; then collect the acceptance evidence in SR-18–SR-23. Keep dependencies explicit rather than interpreting this order as approval to implement everything.

## Implementation safeguards and approved world changes

### SR-01 World rule persistence

**Finding:** NODE-0563 and NODE-0595 require guarded camps and revised Lake/hole rules only for newly created worlds, including preservation of old rules on unexplored maps. Current state has encounter/layout and migration versions, but no rule selection implementing this approved boundary.

**Concern and next action:** Add an explicit, saved world-rule selection before enabling those changes. Existing worlds and saves without the new marker must retain legacy behavior; newly created worlds select the new rules only when the feature is delivered. Generation and runtime both need the selection. Do not infer it from load date or whether a sector was already generated.

**Close when:** old/new worlds pass manual save, autosave, import, reload, re-save, undo and later-sector generation checks. Include mod activation/removal so it cannot silently change the world model.

**Evidence:** [compatibility decision](../obstruction-types-and-behavior.md#review-complete-new-world-rules), [initial state](../../src/simulation/createInitialState.ts), [state types](../../src/domain/types.ts), [normalization](../../src/persistence/legacyMigration.ts), [generation](../../src/simulation/worldGeneration.ts). **Outcome: pending.**

### SR-02 Historical content compiler

**Finding:** A write-intercepted run of `scripts/sync-progression-content.mjs` produces Hydro/Shiny/Complex recipe gates of `hydraulicAssembly` / `oreSeparation` / `precisionControl`. Current recipes correctly require `hydroCore` / `shinyCore` / `complexCore`. The script reads old analytical inputs and would overwrite `src/content/progression.ts`.

**Concern and next action:** Retire the compiler as a historical tool or update its authoritative inputs and transformations, then add a meaningful round-trip comparison. The file's generated header can otherwise encourage a future edit to rerun it and undo reviewed progression. The safe `docs:systems` generator is a different command and has no such source rewrite.

**Close when:** the supported workflow cannot overwrite current production/research rules with historical settings, and its output is compared against live gates, quantities, machine groups and timing. Preserve the historical inputs as evidence.

**Evidence:** [compiler](../../scripts/sync-progression-content.mjs), [review transformation](../../scripts/apply-reviewed-production.mjs), [Core projects](../../src/content/coreResearch.ts), [intercepted results](../../outputs/document-review-2026-11-18/results.json). **Outcome: pending.**

### SR-03 Unused Stone

**Finding:** `clearFilledHoles` cancels/refunds in-flight transfers, then deletes the hole, including buffered surplus. NODE-0571 adopts exactly-once refunds for buffered surplus too, including completion after Efficient Landfill changes the bill.

**Next action:** Implement the settled refund rule for the new world model, preserving the legacy-world boundary in SR-01. Define a valid return destination when the original supplier is gone or full without duplicating cargo.

**Close when:** normal filling, discount-triggered completion and save-load completion conserve unused Stone once, remove supply cables and stop further dispatch. **Evidence:** [hole clearing](../../src/simulation/engine.ts), [reviewed refund rule](../obstruction-types-and-behavior.md#deep-holes), NODE-0571. **Outcome: pending.**

### SR-04 Filled terrain

**Finding:** completed holes currently disappear. NODE-0569 requires their outlines/borders and uniform grey interiors to remain as buildable, non-blocking terrain; partial holes remain fully blocking.

**Next action:** Add a persistent terrain representation drawn beneath factories, with no active placement or cable obstruction. Coordinate with SR-03 and SR-01 rather than retaining a zero-bill active obstacle.

**Close when:** factories and cables can occupy the completed patch, partial fill never reduces its footprint, and save/load and field expansion preserve the visual result without recharging Stone. **Evidence:** [hole runtime](../../src/simulation/engine.ts), [geometry](../../src/domain/obstructionGeometry.ts), [review](../obstruction-types-and-behavior.md#deep-holes), NODE-0569. **Outcome: pending.**

### SR-05 Hole candidate budgets

**Finding:** current generation uses radius-based per-hole prices. The settled replacement sizes/prices five candidates against a 15%–35% area budget and 1,650–13,200 Stone tier budget, then selects one to five candidates with equal probability per count. Omitted cost/area is not redistributed.

**Next action:** implement NODE-0569/NODE-0570 and NODE-0606 behind SR-01, including deterministic integer allocation and persisted selection. In standard 11 × 11 new worlds, select exactly 28 eligible hole maps with tier-3/4 weight four and weight one elsewhere, then generate the approved one-to-five holes inside each selected map. Retain the separate 250-Stone depletion-hole rule and generated-obstruction exclusivity.

**Close when:** the standard-world hole-map quota is exactly 28, tier weighting and reserved-map exclusions match the adopted proposal, candidate bills sum exactly, selected bills retain their shares, counts/subsets follow the adopted policy, and seeded generation survives reload and later discovery without rerolling. Explicitly check Area Expansion and modded reserve/field settings. **Evidence:** [generation](../../src/simulation/worldGeneration.ts), [candidate rules](../obstruction-types-and-behavior.md#deep-holes). **Outcome: pending.**

The [28-map distribution calibration](../deep-hole-exploration-simulation.md#distribution-calibration-for-10515-targets) matched 10 / 5 / 15 median map-filling targets in separate validation. NODE-0606 adopts that global quota and tier-3/4 weighting alongside SR-05's settled within-map candidate rules. The design is settled; SR-05 implementation and gameplay checks remain pending.

### SR-06 Guarded camp resources

**Finding:** current settlements still make direct Tribute cargo. The completed proposal replaces new-world rewards with visible guarded resource reserves, suppression-gated extraction and upgraded refill, while existing worlds retain Tribute.

**Next action:** implement the settled proposal after SR-01, including first actual Dwarven extraction unlocking Mythril Refining, full-map capacities, retained reserve/wiring on suppression loss, gated new connections and coupled relocation. Integrate recovery budgets: visible but inaccessible guarded stock must not be counted as currently collectable supply.

**Close when:** all settlement families/subtypes, failed checks, credit/retry, refill upgrades, extraction routes, placement, relocation and both save-rule models pass their checks. **Evidence:** [isolated proposal](../previews/monster-camps/index.html), [proposal model](../previews/monster-camps/model.mjs), [Tribute runtime](../../src/simulation/goblinTribute.ts), [recovery budgets](../../src/simulation/progressionRecovery.ts), NODE-0558/NODE-0559/NODE-0561–NODE-0563. **Outcome: pending.**

### SR-07 Intake only Water

**Finding:** Lakes still create their own buffered Water as well as supplying connected Pumps. NODE-0580 requires new-world Lake Water to originate through Production Lake Intakes, removing direct generation and consumer/logistics bypasses.

**Next action:** apply the settled rule behind SR-01 while preserving free Water Tools discovery and actual Intake rates/buffers. Do not accidentally remove the implemented relay mode in SR-11.

**Close when:** direct Lake-to-consumer, Tank, router and Dev-source-adjacent bypass cases cannot extract Lake Water under new rules; Intake-first routes work; old worlds retain their routes. **Evidence:** [Lake simulation](../../src/simulation/engine.ts), [socket validation](../../src/simulation/connectionRules.ts), [reviewed access rule](../obstruction-types-and-behavior.md#lakes), NODE-0580. **Outcome: pending.**

### SR-08 Intake count upgrades

**Finding:** runtime enforces two direct Pumps at every rank. NODE-0578 adopts two at base, three after the upgrade mapped to `fluidLink5`, and four after `fluidLink6`, preserving current Water rates.

**Next action:** derive the permitted count from saved rule model and research. Clarify the displayed upgrade effects while keeping serialized IDs and migrated purchases stable.

**Close when:** the same Lake accepts exactly 2/3/4 direct Intakes at the relevant ranks across all four ports, with unchanged 4/5/6/8/11 Water rates and legacy-world limits. **Evidence:** [connection limit](../../src/simulation/engine.ts), [migration](../../src/simulation/machineEfficiencyMigration.ts), [rates](../systems/efficiency.md), NODE-0578. **Outcome: pending.**

### SR-09 Coupled Lake relocation

**Finding:** current Lake movement preserves cables but leaves Intakes in place unless explicitly selected. NODE-0581 replaces that behavior for new-rule worlds with automatic movement of every directly connected Intake.

**Next action:** collect attached Intakes, deduplicate selected members, translate them equally and validate the whole move atomically. Keep unrelated downstream nodes stationary.

**Close when:** collision, field-edge or cable failure rejects the whole move; IDs, stock, timers and cables survive success/undo/load; legacy behavior remains available. **Evidence:** [relocation plan](../master-plan/17-endgame-research-and-world-reshaping.md), [movement commands](../../src/simulation/engine.ts), NODE-0581/NODE-0595. **Outcome: pending.**

## Current presentation and documentation inconsistencies

### SR-10 Freight rate display

**Finding:** the Road panel calculates `12 × vehiclePayload(completedResearch)` and omits Train Freight Capacity rank. At rank two, actual base-interval payload is six items, or 72/minute, while the panel formula reports 48/minute. It also assumes a five-second interval despite supported mod overrides.

**Next action:** derive displayed theoretical capacity from the same payload rank and dispatch interval as simulation. Review Build descriptions too, because base-only capacity text may similarly omit Train ranks. Distinguish theoretical rate from measured deliveries.

**Close when:** Cart/Truck/Train, multiple postgame ranks and custom Road intervals agree between runtime and presentation, with blocked receiving stock still handled correctly. Update both style references if player-facing copy changes. **Evidence:** [Road panel](../../src/ui/RoadFlowPanel.tsx), [payload](../../src/content/cartUpgrades.ts), [dispatch](../../src/simulation/engine.ts), [results](../../outputs/document-review-2026-11-18/results.json). **Outcome: pending.**

### SR-11 Pump relay reference

**Finding:** the new fluids guide describes Pumps as requiring a Lake rather than serving as general fluid relays. Current pass-through routing supports Water/Coolant relay mode. The isolated audit delivered all eight supplied Coolant through a Pump with no Lake; existing regression coverage also switches a Pump from Lake draw to Coolant relay.

**Next action:** correct the fluids and production references to distinguish generation from routing, preserving NODE-0446. This is a documentation correction, not a request to remove working relay behavior.

**Close when:** source-backed explanations cover both modes and their actual socket restrictions. **Evidence:** [fluids guide](../systems/fluids.md), [routing](../../src/simulation/engine.ts), [existing regression](../../src/simulation/playtest.regressions.test.ts), [results](../../outputs/document-review-2026-11-18/results.json). **Outcome: pending.**

### SR-12 Mythril Drill reference

**Finding:** the new resource-use and sustainability guides advertise Mythril Drill deposits. The inspector offers only Iron/Copper/Stone and `setMiningTarget` explicitly rejects Mythril. The isolated audit confirms rejection. A legacy type union is not a selectable gameplay capability.

**Next action:** correct the references to the three selectable minerals and describe any retained legacy fields separately. Do not enable a Mythril bypass to make the game match the mistaken text.

**Close when:** all current descriptions agree with UI, engine and NODE-0295 source restrictions; compatible historical material remains described accurately. **Evidence:** [resource use](../systems/resource-use.md), [sustainability](../systems/sustainability-and-recovery.md), [inspector](../../src/ui/NodeInspector.tsx), [engine](../../src/simulation/engine.ts), [results](../../outputs/document-review-2026-11-18/results.json). **Outcome: pending.**

### SR-13 Postgame fluid transport

**Finding:** the fluids guide's broad geographic restriction omits global Storage/Inventory. An isolated fixture deposited eight Water at Home and withdrew all eight on the neighboring map through Inventory → Filter → Tank, without Roads. Autonomous Logistics is a post-first-Final-Core access path.

**Next action:** scope mandatory Lake-local production to ordinary pre-global transport and document the postgame shared-pool exception. Retain implemented behavior unless a separate design change is explicitly chosen.

**Close when:** fluids, storage and progression references explain the same boundary and a regression verifies the allowed postgame route plus locked pre-access behavior. **Evidence:** [fluids](../systems/fluids.md), [pool runtime](../../src/simulation/progression.ts), [global research](../../src/content/research.ts), [results](../../outputs/document-review-2026-11-18/results.json). **Outcome: pending.**

### SR-14 Copper Slurry storage

**Finding:** Copper Slurry is classified as a fluid and rejected by vehicles/Roads, but the `FLUID` family accepts only Water/Coolant, so the Fluid Tank rejects it. This split is documented but lacks an explicit current storage-policy decision in the reviewed records.

**Decision needed:** should Fluid Tanks/Pump relay accept all three fluids, or should Slurry retain a distinct storage/routing policy? Recommend one consistent fluid-family rule unless a deliberate gameplay reason justifies an exception; preserve early geographic constraints either way.

**Close when:** choose the policy, align classifier, sockets, recipes, storage descriptions, mods and compatibility checks, and verify Slurry cannot gain an unintended Road path. **Evidence:** [classification](../../src/content/items.ts), [socket family](../../src/simulation/connectionRules.ts), [fluids reference](../systems/fluids.md), [results](../../outputs/document-review-2026-11-18/results.json). **Outcome: pending.**

### SR-15 Mod recovery control

**Finding:** the recipe editor labels `recovery` as “Applies recovery efficiency research,” and the full mod guide advertises recovery efficiency. Current `getRecoveryMultiplier` always returns one: speed now belongs to the operating node, while the flag still identifies/group-lists recovery recipes.

**Next action:** describe the flag's actual classification role and node-owned timing. Do not restore a second stacking multiplier merely to match obsolete wording.

**Close when:** checkbox/help text, guide and recipe timing agree for flagged/unflagged recipes on the same machine; update both style documents with the copy change. **Evidence:** [editor](../../src/ui/ModEntryEditor.tsx), [timing lookup](../../src/content/efficiency.ts), [mod guide](../mods.md), NODE-0577, [results](../../outputs/document-review-2026-11-18/results.json). **Outcome: pending.**

## Guidance and validation work

### SR-16 Research shortage navigation

**Finding:** NODE-0332 adopts clicking a missing Core to find the first identifiable upstream shortage, with recipe/delivery fallback. Current selected-project badges open the Core recipe; no corresponding shortage-navigation path was found in the reviewed implementation.

**Next action:** implement the agreed diagnostic link when authorized, retaining a clear fallback and avoiding prescriptions about factory location.

**Close when:** a local shortage, a cross-map chain and a missing producer lead to correct evidence-backed destinations or fallback. **Evidence:** [adopted design](../master-plan/05-interface-and-learning.md#connect-research-to-the-factory), [research details](../../src/ui/ResearchProjectDetail.tsx), [status](../../src/ui/researchProgress.ts), NODE-0332. **Outcome: pending.**

### SR-17 Later system teaching

**Finding:** the five implemented lessons cover Basics, Logistics, Expansion, Groups and Camps. Agreed contextual teaching also covers fluids, mixed waste, Dwarven supply and corners; its detailed lessons and invitations remain unspecified. The deferred Power lesson does not defer all waste help.

**Next action:** specify small optional factual lessons, beginning with guaranteed Controller Fines and whole-Filter blockage before those rules can strand a newcomer. Keep Power deferred and avoid prescribing a factory solution.

**Close when:** relevant unlocks offer help, skipping it preserves progression, and newcomers can diagnose the stream independently. **Evidence:** [tutorial library](../systems/tutorials-and-discovery.md), [learning plan](../master-plan/05-interface-and-learning.md), [novice dispositions](../novice-playtest-findings.md). **Outcome: pending.**

### SR-18 Current balance baseline

**Finding:** adopted targets include 25–30 minutes Home→Automata, 28–35 Automata→Hydro, 40–55 Hydro→Shiny, 60–75 Shiny→Complex and 90–105 Complex→Final. Older matched runs and analysis predate the current Core projects, AP matrix, prices and 64-rank efficiency schedule; the live analysis README still describes six lab ranks ending at two seconds.

**Next action:** establish a fresh, version-identified baseline and compare optional upgrades including their payment and setup costs. Regenerate analytical reports from current catalogs and label headless results separately from normal gameplay. Incorporate pending world rules only after their implementation, as a separate baseline.

**Close when:** record phase times, raw use, productive maps, placed nodes/connections, actual deliveries and setup/waiting split on declared seeds. **Evidence:** [targets](../progression-and-scaling.md#problem-2-progression-demand-and-scaling), [balance proposal](../core-consumption-balance-proposal.md), [analysis status](../../outputs/progression/README.md), NODE-0544/NODE-0577. **Outcome: pending.**

### SR-19 Sustained world feasibility

**Finding:** historical runs reached victory but also recorded post-victory Shiny exhaustion, congested freight and inadequate factory space on their surveyed Lake layouts. Those results include harness restrictions and older rules; they do not prove a current softlock. First-item production does not prove sustainable six-Core or repeatable corner supply.

**Next action:** run current multi-seed tests of steady delivery, depletion/regeneration, bot upkeep, rebuilding, both corner pairing and location variation, repeated Final Cores and postgame research. Check guarded-deposit access against recovery accounting once delivered.

**Close when:** output remains sustained after initial buffers empty and representative setbacks have ordinary recovery paths, with no grants or save injection in balance runs. **Evidence:** [blind research report](../blind-research-playtest-2026-11-11.md), [blind Final Core report](../final-core-blind-run.md), [build guide](../playtest-build-guide.md), [quality plan](../master-plan/08-quality-and-playtesting.md). **Outcome: pending.**

### SR-20 Supported scale

**Finding:** NODE-0598 adds current-engine browser evidence at 150/300 nodes on one map. A 600-node experiment repeatedly crashed the in-app browser and was removed from the fixture controls; its cause and broader browser implications remain unconfirmed. Engine stress and that fixture do not establish long-lived undo, persistence or distributed-world budgets, and the support matrix remains undefined.

**Decision and next action:** choose representative environments/workloads, then measure frame/input responsiveness, simulation rate, memory, save/load/undo time and storage failures. Include a distributed 121-map workload and a dense usable factory rather than only synthetic engine graphs.

**Close when:** acceptance thresholds and repeatable measurements exist for the supported environment; investigate the observed 600-node failure without assuming its cause, and give custom 21×21 worlds explicit limits. **Evidence:** [active factory fixture](../../previews/active-factory/README.md), [technical plan](../master-plan/07-technical-design.md), [quality plan](../master-plan/08-quality-and-playtesting.md), [stress harness](../../scripts/stress.test.ts), NODE-0598. **Outcome: pending.**

### SR-21 Accessibility

**Finding:** Q17/NODE-0150 commits a focused desktop accessibility audit. Existing labels, responsive checks and reduced-motion styling do not constitute that complete audit or prove keyboard/screen-reader playability.

**Next action:** assess contrast/readability at supported zoom/viewport, non-color state cues, motion control, focus/dismissal, tooltip alternatives and socket/input precision. Record actual findings before adding a broad redesign.

**Close when:** each observed issue has environment, severity and a repeatable acceptance check, with prioritized fixes verified. **Evidence:** [accessibility commitment](../master-plan/05-interface-and-learning.md#accessibility-commitment), [style references](../node-ui-style-guide.docx), [UI system](../systems/interface-and-assets.md). **Outcome: pending.**

### SR-22 Audio scope

**Finding:** Q18 adopts effects, alerts, ambience and music with mute/volume controls. Source currently retains a `sound` preference but no dedicated playback system was found. The current system library does not give this committed but unfinished scope its own status section.

**Decision and next action:** retain the commitment with a concrete specification/asset plan, or explicitly defer it in the changelog. Define browser unlock, pause/tab-focus behavior, repetition/mix and visual equivalents before implementation.

**Close when:** a permanent disposition and accurate current reference exist; if implemented, test playback and saved controls. This is not an invitation to commission assets during this review. **Evidence:** [audio plan](../master-plan/06-art-audio-and-writing.md#audio), [preferences](../../src/domain/types.ts), [initial state](../../src/simulation/createInitialState.ts). **Outcome: pending.**

### SR-23 Word layout verification

**Finding:** recent style-review entries record structural preservation checks but failed final rendering because packaged LibreOffice was unavailable. This review extracted Word text, including tables, but did not certify page layout.

**Next action:** restore the bundled document rendering path and render/inspect both current style references, keeping their latest text intact. Do not treat old page images as current verification.

**Close when:** every current page is visually checked for clipping, overflow, glyphs and hierarchy, with results linked from the permanent history. **Evidence:** [guide](../node-ui-style-guide.docx), [review notes](../typography-style-review.docx), NODE-0577. **Outcome: pending.**

## Reference and history reconciliation

### SR-24 Planning status conflicts

**Finding:** active master-plan introductions and “current implementation” tables still quote 72 AP Final Bots, 10/30-second half/Final recipes, five-each victory/global access, ten-thousand-AP Golems or unfinished tier-seven mechanics. Current values are 70 AP, 20/60 seconds, one each and 100/150 AP, with a playable ending. The progression discussion still contains a present-tense two-Core access-price paragraph despite the current minimum of five.

**Next action:** add a concise current status/links to living plan sections and clearly delimit the dated original decisions. Preserve archive snapshots and measured historical numbers. The new system library should remain the mechanics reference; unfinished-work queues must not reintroduce already delivered features.

**Close when:** current-facing introductions, roadmap tasks and reconciliation tables agree with source/history, while old evidence remains identifiable by date. **Evidence:** [master overview](../master-plan/README.md), [implementation report](../master-plan/20-endgame-implementation.md), [reconciliation table](../master-plan/11-sources-and-reconciliation.md), [progression discussion](../progression-and-scaling.md), [live catalogs](../systems/README.md#reference-catalogs). **Outcome: pending.**

### SR-25 History supersession

**Finding:** the changelog is now primary history, but not every older recorded rule has a clear replacement link. NODE-0270 still records 10/30-second assembly while runtime uses 20/60. NODE-0474 records manual one-recipe Recycler selection; NODE-0477/NODE-0486 adopt automatic feed matching, yet NODE-0577 refers back to NODE-0474's one-recipe behavior without clarifying automatic selection.

**Next action:** trace the actual adoption records, add accurate supersession/reconciliation links and clarify partial replacements. Do not infer a new design decision from source alone or rewrite historical dates. Do not revert the automatic Recycler just because an older sentence says manual.

**Close when:** searches for current assembly times and Recycler selection resolve an unambiguous recorded chain; genuinely unrecorded discrepancies have a decision rather than a fabricated historical explanation. **Evidence:** [history source](../changelog/entries.json), [procedure](../changelog/README.md), [assembly](../../src/content/endgame.ts), [Recycler UI](../../src/ui/NodeRecipePicker.tsx), NODE-0270/NODE-0474/NODE-0477/NODE-0486/NODE-0577. **Outcome: pending.**

## New exploration gate questions

### SR-26 Depletion and exploration

**Finding:** NODE-0599 models the requested all-approaches gate around discovered generated holes. NODE-0601 settles the scope: depletion-created holes do not block exploration, even when present alongside generated holes. The earlier Home-depletion stress case is counterfactual analysis, not the adopted rule or an observed current-game softlock.

**Next action:** preserve the generated-only scope and its new-world boundary during implementation. Depletion holes retain their physical obstruction and 250-Stone base bill but cannot start, extend or reactivate an exploration lock. Preserve the already confirmed all-approaches rule; neither decision needs to be asked again.

**Close when:** test Home, sequential depletion, mixed generated/depletion holes, multiple neighboring blockers, zero accessible Stone and saved rule versions. Confirm filling the final generated hole lifts that map's exploration block even while a depletion hole remains. The offline adaptive estimate's median 45,986 Stone excludes depletion and assumes affordable bills; it is not a completion-time or solvability result. **Evidence:** [estimate and selected scope](../deep-hole-exploration-simulation.md#boundaries-to-settle-before-implementation), [recovery](../../src/simulation/progressionRecovery.ts), NODE-0599/NODE-0601. **Outcome: scope decided; implementation and gameplay checks pending (NODE-0601).**

### SR-27 Purchased but unvisited maps

**Finding:** the engine separates paying to unlock a map from visiting/discovering it. A visit-triggered gate that only blocks new purchases could be bypassed by buying a chain before visiting its holes. Conversely, revoking already-paid access can strand a destination quote or lose the value of Map Points. The new estimate visits immediately and does not resolve this case.

**Settled access (NODE-0602):** honor completed purchases and allow first entry to purchased-but-unvisited destinations despite a newly discovered neighboring generated hole. Keep those map cells enterable rather than disabled/greyed by this gate. Already explored maps remain accessible. Advance purchases can preserve routes; the existing immediate-visit simulation does not measure that strategy.

**Settled funding (NODE-0603):** let a destination purchase with Cores contributed before blocker discovery continue and finish. Preserve the quoted destination, price and contributions through project switching and reload, then unlock that destination and honor first entry. An unfunded quote does not establish an exception. Preserve saved Map Points without treating them as an already purchased destination. The policy questions for SR-27 are settled; do not ask them again.

**Close when:** test paid-unvisited chains, active/paused partially funded quotes, saved Map Points, multiple blockers, entry from every side, save/load and legacy worlds. No paid contribution or point may disappear or be charged twice. **Evidence:** [policy boundary](../deep-hole-exploration-simulation.md#boundaries-to-settle-before-implementation), [map pricing](../../src/simulation/mapExpansion.ts), [quotes](../../src/simulation/researchRuntime.ts), NODE-0599/NODE-0602/NODE-0603. **Outcome: access and funding policies decided; implementation checks pending (NODE-0602/NODE-0603).**

## Review coverage

The review read all 24 current system guides and their index, checked all six catalogs against assembled source, and recorded a hashed inventory of the Markdown/Word references. Related master-plan documents were checked for current status, dependencies and relevant unsettled work; their long dated interview histories and archived snapshots were used as historical evidence, not re-approved line by line. Both Word references were text-extracted, including table paragraphs (76 and 205 paragraphs respectively); no fresh render or browser inspection was performed.

| Current guide | Review result |
| --- | --- |
| Resource use | SR-12; acquisition accounting also feeds SR-06/SR-18/SR-19 |
| Production nodes | SR-07/SR-08/SR-11/SR-12 |
| Recipes | SR-02/SR-15/SR-25 |
| Research | SR-16/SR-18; assembled prerequisite references are valid |
| Progression tiers | SR-13/SR-18/SR-24 |
| Efficiency | SR-08/SR-15/SR-18; all 64 generated ranks checked |
| Connections and routing | SR-06/SR-07/SR-11/SR-14 |
| Roads and vehicles | SR-10/SR-19; solid-only rule remains consistent |
| Storage and inventory | SR-13/SR-14 |
| Fluids | SR-07–SR-09/SR-11/SR-13/SR-14 |
| Sustainability and recovery | SR-03/SR-06/SR-12/SR-19 |
| Waste and recycling | SR-15/SR-17/SR-18/SR-25; deterministic Controller Fines agrees with source |
| Map nodes and exploration | SR-01/SR-05/SR-18/SR-19/SR-26/SR-27 |
| Encounters and obstructions | SR-01/SR-03–SR-09 |
| Bots and attack power | SR-18/SR-24; current 25-build matrix is consistent |
| Endgame and victory | SR-09/SR-18/SR-19/SR-24/SR-25 |
| Controls and factory layouts | SR-09/SR-20/SR-21; no separate new control defect confirmed |
| Tutorials and discovery | SR-16/SR-17/SR-21 |
| Saves and compatibility | SR-01/SR-03/SR-04/SR-20/SR-27 |
| Mods | SR-01/SR-05/SR-10/SR-14/SR-15 |
| Interface and assets | SR-10/SR-15/SR-21–SR-23 |
| Development tools | Evidence boundaries retained; synthetic results below are not balance evidence |
| Architecture and simulation | SR-01/SR-02/SR-20 |
| Testing and publishing | SR-18–SR-23; no live publication claim made |

The [isolated audit](../../outputs/document-review-2026-11-18/audit.mjs) and [results](../../outputs/document-review-2026-11-18/results.json) confirm 128 live projects, 126 grouped recipes and 64 efficiency ranks, with no unknown recipe items or missing explicit prerequisite IDs. They reproduce Pump relay, cross-map Water through the global pool, rejected Mythril Drill selection, rejected Slurry Tank input and the Road display formula discrepancy. The historical content compiler was executed with writes intercepted; gameplay source was not overwritten. Fixtures used constructed states and are not ordinary-play or pacing results.

Generated-catalog and local-link checks passed. The isolated audit separately checks this register's 27 IDs, pending outcomes, local links and section anchors. Targeted existing regression tests passed: 113 tests across seven files. Historical tests, runs, Pages receipts and dates retain their original scope. This register does not convert hypotheses into confirmed bugs, reopen settled decisions, authorize a feature batch or certify live behavior.
