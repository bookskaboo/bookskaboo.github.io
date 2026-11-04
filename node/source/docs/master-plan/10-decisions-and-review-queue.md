# Decisions and review queue

## Review state

The initial Q01–Q24 review is complete. The milestone remains stabilization through Complex, with tier-7 design on paper. Approved requirements and historical proposals are recorded in the ledger and detail logs below; the system documents summarize current intended behavior separately from live implementation.

Current focus: Q144 closes the design interview and defers the six extra QoL candidates. Authorized local implementation is delivered; document 20 records verification and limits. Reclamation uses a subsequently authorized temporary reference pending measurements. No interview questions remain in this pass.

The costing reference uses standard recipes, tier-9 Dwarven Mythril paid with Medium Bots and paid forestry; optimization scenarios remain separate. Q83–Q86 adopt tenfold planter output, grouped growth delivery and a shared 600-Core research price. Power remains removed. These recent encounter/planter designs still need runtime implementation and normal-play validation.

Q73 requires comparable base-resource cost per corner-component unit. All four input mechanisms are identified; Alpha AP, Foundry quantities, Grove upkeep/conversion and the common reference budget are adopted. Reclamation credits/allocation and the remaining progress, crafting, storage/output and victory/research rules remain open. Review one unresolved question per native card; record each answer before moving on. Unanswered proposals are not adopted.

## Existing constraints to preserve

| Area | Recorded outcome | Evidence |
| --- | --- | --- |
| Naming and voice | Mythril; Extractors are Production; dry humor with clear instructions | [Project instructions](../../AGENTS.md) |
| Research | Equal required Core quantities, independent Core recipes, affordable capability access | [Progression constraints](../progression-and-scaling.md#existing-design-constraints) |
| Efficiency | Current optional six-rank system; further balance discussion deferred | [Efficiency status](../progression-and-scaling.md#problem-1-efficiency-research) |
| Geography | Sole Home Research Center; local fluids; viable alternative solid routes | [Agreed direction](../progression-and-scaling.md#agreed-direction) |
| Transport | Single-material, solid-only Roads at one item per five seconds; retain channel rules | [Route decisions](../progression-and-scaling.md#problem-3-exploration-and-useful-transport-routes) |
| Recipes | Revised Shiny and Complex branches retained for testing | [Recipe status](../progression-and-scaling.md#problem-5-recipe-complexity-and-intermediate-reuse) |
| Teaching | Do not prescribe off-Home assembly as a task or required strategy | [Automata direction](../progression-and-scaling.md#adopted-automata-core-scaling-and-delivery-to-home) |
| Novice review | Accepted findings resolved; N15 deferred pending power design | [Current status](../novice-playtest-findings.md#current-implementation-status) |

## First decision

**Q01 What should the next major development milestone deliver?**

Current context: a substantial playable route through Complex exists, while sustained late throughput, human learning and the final tier remain unfinished.

1. **Stabilize through Complex — recommended.** Validate and polish the existing route, while defining tier 7 on paper. This establishes a measured foundation for the ending.
2. **Build tier 7 and the ending first.** Establish a complete playable arc sooner, accepting that existing pacing and usability may need larger revisions afterward.
3. **Prepare a smaller public demo.** Select a polished early-game cutoff and delivery criteria; defer the rest of the full-game route for that milestone.

Outcome: **Selected option 1, November 2, 2026.** Stabilize through Complex, with tier 7 design work on paper alongside it. Updated the plan overview, vision and roadmap. Detailed scope and acceptance criteria remain in the review queue.

## Queued questions

Each row is one future question. Recommendations are provisional and can change after earlier answers.

| ID | One decision to resolve | Current context and concrete alternatives | Recommendation and reason |
| --- | --- | --- | --- |
| Q02 | Settled: who is the primary player? | Selected automation enthusiasts, with newcomer support, November 2, 2026 | Recorded in vision, learning and testing guidance |
| Q03 | Settled: what session rhythm should the game favor? | Selected support for both short and long sessions, November 2, 2026 | Useful short-session progress and longer focused play; exact durations remain open |
| Q04 | Settled: what is the next milestone's supported platform? | Selected desktop browser with mouse and keyboard, November 2, 2026 | Touch and desktop packaging outside this milestone; browser/hardware matrix remains open |
| Q05 | Settled: which activities should dominate the experience? | Selected production optimization and geographic decisions, November 2, 2026 | Construction, exploration and encounters support improving supply chains; guides development priority |
| Q06 | Settled: what should count as final victory? | User-defined four unique corner obstructions, each providing a component for the final Core; final Core enables a victory project; continued play and optimization research afterward | Recorded November 2, 2026; final Cores remain reproducible, detailed rules pending |
| Q07 | Settled: how should solving a corner enable repeatable component supply? | Component-specific Tribute box; top-left large monster awards one Alpha per high-AP defeat and respawns at full AP | User-defined November 2, 2026; transport components to another assembly area, then final Core to Research Center; other corner repeat rules open |
| Q07A | Settled: how should AP supplied to the top-left monster count toward a defeat? | Selected accumulation of delivered AP without a time limit, November 2, 2026 | Partial payments count until defeat; a single full-AP check is not required |
| Q07B | Settled: what happens to AP exceeding the amount needed for a defeat? | Selected carryover into the next defeat, November 2, 2026 | Reset to full AP, then credit the surplus; supplied bots retain their full AP value |
| Q07C | Settled: what should happen when the Alpha Tribute box is full? | Selected pause of bot consumption and defeat rewards, preserving accumulated AP and surplus until space is available, November 2, 2026 | Resume when transport frees space; do not discard paid AP or blocked Alpha rewards |
| Q08 | Settled: which pacing evidence should guide the next balance pass? | Selected normal-gameplay sustained six-Core production first, November 2, 2026 | Follow with human learning and pacing tests; measurement window/rates remain open; no run launched during review |
| Q09 | Settled: how should world coverage targets be treated? | Selected retention as provisional targets to test, November 2, 2026 | 37–60 productive maps at minimum viable endgame throughput, about 109 at maximum; no productive-map count required for victory |
| Q10 | Settled: what role should Power play? | User directed removal from the current game until a useful integration is designed, November 2, 2026 | Removed playable Power equipment/research, released Hydro prerequisites, kept Tree Planters operational without Power and archived old infrastructure; no committed reintroduction |
| Q11 | Settled: how should shared Inventory affect logistics? | Endgame-research-gated global transport; initially one Storage and one Inventory globally; progressive placement increases at increasing research costs | User-defined November 2, 2026; access checkpoint settled in Q11A; runtime gate/prices and dependency changes pending |
| Q11A | Settled: which checkpoint makes endgame Storage/Inventory access research available? | Selected first final Core produced, November 2, 2026 | Research becomes available after production; completion still required for placement; delivery and victory are not prerequisites for availability |
| Q12 | Settled: how severe should factory setbacks be? | Selected recoverable setbacks with clear causes and repair paths, no game over, November 2, 2026 | Validate ordinary-gameplay recovery from shortages, blocked outputs/waste, depletion and settlement pressure; existing recovery paths are not yet certified |
| Q13 | Settled: how predictable should discoveries outside the four endgame corners be? | Selected guaranteed access within appropriate progression ranges, with locations/layouts varying by seed, November 2, 2026 | Lakes, Mythril and progression landmarks remain accessible; four corner locations stay fixed; exact guarantees and bounds require specification/testing |
| Q14 | Recorded direction: how central should settlements and Golems be? | Goblins are an early optional bonus; former Lizard settlements are Dwarven; their Tribute supplies Mythril with the Q14B1 Golem exception | Absolute exclusivity superseded by Q14B1; natural/Goblin/Drill exclusions and first-Tribute processing trigger remain |
| Q14A | Settled: when should Mythril processing unlock under the Tribute gate? | Selected first Mythril Tribute produced by a Dwarven settlement, November 2, 2026 | Discovery alone is insufficient; transport is not an added requirement; preserve the production milestone, free recovery/waste access and legacy progress |
| Q14B | Settled: retain or replace/remove the existing Mythril Golem? | User answered keep it, November 2, 2026 | Retain the Mythril Golem; clarify its reward exception separately in Q14B1 |
| Q14B1 | Settled: does the retained Mythril Golem keep its infinite Mythril reward as an exception? | Keep encounter and current reward; random tier-6 map; increase clearing AP, November 2, 2026 | Explicit exception to Q14 exclusivity; exact AP above current 10,000 remains a balance task; other Golems unchanged |
| Q15 | Settled: what should renewable supply accomplish? | Selected reduced maintenance with continuing capacity/logistics challenges, November 2, 2026 | Sustainable resources still need sufficient production and delivery; rates/costs remain to be validated; Dwarven/Golem source decisions retained |
| Q16 | Settled: how should later systems be taught? | Selected option 1, optional contextual lessons and help, November 2, 2026 | Explain rules/controls and factual feedback without prescribing layouts or requiring lesson completion; Power teaching stays deferred |
| Q17 | Settled: what accessibility scope belongs in the next milestone? | Selected option 1, focused accessibility audit and prioritized fixes, November 2, 2026 | Audit readability, contrast, non-color cues, motion and input precision; full keyboard-only/screen-reader playability not promised; findings pending |
| Q18 | Settled: what audio scope should come next? | Selected option 2, adding ambience and music alongside interaction sounds/alerts, November 2, 2026 | Broader stabilization soundscape with mute/volume controls and visual equivalents; direction/assets/implementation remain pending |
| Q19 | Settled: how much fiction should frame the factory? | Selected option 2, light framing through introduction, milestones and ending, November 2, 2026 | Keep dry humor and clear goals; draft implemented progression framing for stabilization and the ending alongside tier-7 design; no full campaign commitment |
| Q20 | Settled: what scale should performance support first? | Selected option 1, representative late-game factory in browser on specified hardware, then larger stress tests, November 2, 2026 | Measure rendering, controls, simulation, memory and save/undo; hardware/browser matrix, factory and numerical budgets remain pending |
| Q21 | Settled: what save compatibility promise should be made? | Selected option 3, best effort during development; fresh starts may be required, November 2, 2026 | Keep current migrations; define support/break boundaries per change; verify fresh-game and same-version persistence; no existing saves erased by this decision |
| Q22 | Settled: how should the next browser version be distributed? | Selected option 1, public browser release through static hosting, November 2, 2026 | Publish completed stabilization after acceptance checks; no publication now; desktop packaging stays outside milestone |
| Q23 | Settled: what is the first human playtest cohort? | Selected option 1, small mixed group of enthusiasts/newcomers, November 2, 2026 | Keep findings separate by experience; participant count, tasks and recruitment pending; follow Q08 sustained-production validation first |
| Q24 | Settled: what must be true to call the chosen milestone complete? | User adopted the concrete completion checklist and deferred scope for now, November 2, 2026 | Current baseline in roadmap; later revisions must be recorded; numerical thresholds and implementation evidence remain pending |

## Decision log

| Question | Local date | Outcome and reason | Plan updates and remaining work |
| --- | --- | --- | --- |
| Q01 | 2026-11-02 | User selected stabilization through Complex, including tier 7 design on paper. The recommendation was to establish a measured foundation for the ending. | Updated overview, vision and roadmap. Establish audience, scope and acceptance criteria through the remaining questions; no gameplay changes made by this decision record. |
| Q02 | 2026-11-02 | User selected automation enthusiasts as the primary audience, with newcomer support. The recommendation preserves satisfying factory problems while helping first-time players learn the rules. | Updated overview, vision, learning and playtesting guidance. Session rhythm, platform, difficulty emphasis and acceptance criteria remain under review; no gameplay changes made. |
| Q03 | 2026-11-02 | User selected support for both short and long sessions. Support useful progress in short visits and extended planning, building and troubleshooting, with the ability to pause and resume unfinished work. | Updated vision, pacing, validation matrix and review status. Exact session lengths and acceptance measures remain open; total-playtime targets and offline-production behavior unchanged. No gameplay changes made. |
| Q04 | 2026-11-02 | User selected desktop browser with mouse and keyboard for stabilization through Complex. The recommendation focuses validation on the current platform. | Updated vision, technical scope, testing guidance and review status; narrowed Q22 to browser distribution. Specific browsers, minimum hardware and viewport remain open. No gameplay changes made. |
| Q05 | 2026-11-02 | User selected production optimization and geographic decisions as the main source of satisfaction. Construction, exploration and encounters support improving supply chains. | Updated vision, core loop guidance, roadmap priorities and review status. Final victory is next in Q06; difficulty and specific new mechanics remain separate decisions. No gameplay changes made. |
| Q06 | 2026-11-02 | User supplied the endgame structure: four unique corner obstructions each provide a component for the final Core; that Core enables creation of a victory project, analogous in purpose to Factorio's rocket launch. Play continues after victory, and reproducible final Cores fund further optimization research. | Updated overview, vision, gameplay, progression specification, world design, roadmap and reconciliation. Narrowed Q07 from broad tier demand to repeatable corner-component supply; adjusted Q13 to preserve fixed corners. Challenge identities, supply mechanics, recipe, victory project and research effects remain open. Planning only; no gameplay changes. |

For each answer append the question ID, local date, outcome, reason, affected documents, authorized work and remaining validation. If a decision replaces an earlier one, preserve the old record and link its replacement. Deliberate deferrals should include the current behavior to retain and, when known, a reopening condition.

### Q07A detail recorded November 2 2026

The user selected accumulation of delivered AP until defeat, including the question's no-time-limit condition. Partial AP remains credited while more bots arrive. One completed payment awards one Alpha and resets the monster to its full requirement. Updated progression, world, validation, roadmap and review status. Exact AP, surplus across respawns and full-box behavior remain open. Q07B is an added follow-up on surplus AP before Q08; existing IDs are preserved. Planning only; no gameplay changes or playtest.

### Q07 detail recorded November 2 2026

The user specified component Tribute boxes rather than selecting the proposed producer model. The top-left obstruction is a large monster, provisionally a dragon, with a very high AP requirement. Each defeat adds one Alpha to its Tribute box and respawns the monster at full AP. Components from across the world are transported to another area for final-Core assembly, then the Core goes into the Research Center. Updated vision, progression, world design, roadmap, validation and overview. Other corner mechanics, AP value/payment behavior, Tribute capacity and the exact victory trigger remain open. Q07A is an added follow-up before Q08; existing IDs are preserved. No gameplay implementation or playtest was performed.

### Q07B detail recorded November 2 2026

The user selected surplus AP carryover into the next defeat. On defeat, award one Alpha, reset the monster to its full AP requirement, then apply surplus AP toward the next defeat. Updated progression, world, validation, roadmap and review status. Exact AP and full-Tribute-box behavior remain open; Q07C addresses full-box behavior next without renumbering existing questions. Planning only; no gameplay changes or playtest.

### Q07C detail recorded November 2 2026

The user selected pausing consumption and preserving AP until the Alpha Tribute box has space. While full, stop further bot consumption and defeat rewards, keep accumulated AP and surplus, and resume once transport frees space. Updated progression, world design, validation, roadmap and review status. Exact AP, box capacity, other corner mechanics and victory details remain open. Return to the broader review at Q08. Planning only; no gameplay changes or playtest.

### Q08 detail recorded November 2 2026

The user selected sustained production of all six Core types as the first evidence for the next balance pass through Complex, followed by human playtests for learning and pacing. Updated progression, validation priorities, roadmap and overview. Specify the checkpoint, measurement window and rate criteria before running; distinguish genuine upstream supply from finite stored inputs. This sets validation priority and does not start a gameplay run during the planning review. Q09 is next.

### Q09 detail recorded November 2 2026

The user selected keeping existing world-coverage numbers as provisional targets to test: 37–60 productive maps for minimum viable endgame throughput and about 109 for maximum throughput. Validate against actual demand and sustainable supply; distinguish productive utilization from corner access, visits and transit. No productive-map count is required for victory. Updated progression, world design, roadmap risk and overview. Q10 on Power is next. Planning only; no gameplay changes or new playtest.

### Q10 detail recorded November 2 2026

The user directed removal of Power from the current game until a useful integration can be designed, questioning whether the added complexity fits the game direction. Implemented locally: hide Generators, Power Splitters and Power Lines; remove Basic Electricity and Power Distribution from live research; remove their prerequisite gates; keep Tree Planters as Production nodes operating without Power. Save and template migration archives retired equipment, wiring, buffered Power and affected in-flight cargo without simulating it; retained research payments remain recorded. Update vision, systems, technical notes, teaching scope, research catalog and roadmap. Power integration is deferred with no scheduled return. Q11 on shared Inventory is next. Verification is recorded in the change history; no browser balance run or publication was performed.

### Q11 detail recorded November 2 2026

The user specified endgame-research-gated global transport, replacing the proposed limited-convenience role. Start with one Storage and one Inventory allowed globally; progressive research increases each node type's placement allowance with progressive research costs. Updated vision, systems, economy, validation and roadmap. Existing live limits and escalating placement research provide a baseline, but the unlock still uses autonomousLogistics, which currently gates Endgame Theory. Q11A resolves the intended endgame checkpoint before altering gates; prevent a circular prerequisite and specify compatibility for old placements, ranks and pool contents. Exact increments, costs and required Core tiers remain open. Planning update only; no runtime gate or price change made.

### Q11A detail recorded November 2 2026

The user selected availability of global Storage/Inventory access research after the first final Core is produced. Production, rather than delivery or victory, is the trigger; research completion still gates placement. This preserves ordinary transport for collecting the first set of corner components and assembling the first final Core. Updated vision, systems, economy, validation and roadmap. Final-Core content, persistent production milestone, access/placement costs, prerequisite restructuring and save compatibility remain implementation work. No runtime gate change or new playtest; Q12 on setbacks is next.

### Q12 detail recorded November 2 2026

The user selected recoverable setbacks with clear causes and repair paths, without a game-over state. Keep challenges centered on diagnosing and improving factories. Preserve existing depletion and settlement pressure as mechanics, but require workable recovery through ordinary gameplay instead of a forced restart. Updated vision, systems, validation matrix, roadmap risk and review status. Exact setback duration and guidance remain open; no gameplay changes or recovery playtest performed. Q13 on discovery geography outside the four fixed endgame corners is next.

### Q13 detail recorded November 2 2026

The user selected guaranteed access to important discoveries within appropriate progression ranges, with seed-dependent locations and layouts. This includes Lakes, Mythril and progression landmarks; the four endgame corner obstructions retain their fixed positions. Updated world direction, validation matrix, roadmap risk and review status. Exact range bounds, counts, variation and reachability rules remain open. No live generation change or cross-seed validation performed. Q14 on existing settlements and Golems is next.

### Q14 detail recorded November 2 2026

The user specified Mythril exclusively through Tribute from Dwarven camps, formerly Lizard camps, replacing Mythril resource-node access. Goblins are an early optional bonus; Dwarven management is required for Mythril progression. Updated vision, systems, progression, world design, presentation terminology, validation, roadmap and reconciliation. Inspected current Dwarven display names, Tribute options, generation, drilling and Golem sources; alternate Mythril sources still exist in runtime. Record the need to remove continuing bypasses and preserve a viable pre-Mythril suppression path. Q13's Mythril-access guarantee now applies through reachable/manageable Dwarven settlements. Q14A resolves processing discovery and Q14B the Mythril Golem; exact AP/output balance and old-source migration remain open. No runtime source-gate change or new playtest performed in this decision update.

### Q14A detail recorded November 2 2026

The user selected first Mythril Tribute production as the Mythril-processing unlock trigger. Finding a Dwarven settlement alone does not unlock processing; delivery/consumption is not additionally required. Update the future trigger and persist earned access even after Tribute stock is drained or suppression fails, retaining prior recovery/waste access and legacy progress. Updated world, economy, validation, roadmap and review status. No runtime discovery change or new playtest performed. Q14B on the existing Mythril Golem is next.

### Q14B detail recorded November 2 2026

The user answered keep it when offered replacement or removal of the Mythril Golem. Retain the encounter and leave its runtime behavior unchanged. Its current infinite Mythril reward conflicts with the previously specified Dwarven-only supply; Q14B1 asks whether to keep that reward as an exception or redesign the reward while retaining the encounter. Do not infer either outcome from retention alone. Updated world, economy, roadmap and review status; no gameplay change or new playtest.

### Q14B1 detail recorded November 2 2026

The user retained the Mythril Golem and its current infinite Mythril reserve reward, requested random tier-6 placement, and increased AP for clearing. This is an explicit exception to Q14's absolute Dwarven-only Mythril supply; other source restrictions and the Q14A first-Dwarven-Tribute processing trigger remain. Current Golem placement already uses seeded tier-6 selection. Set a higher cost than the current 10,000 AP in a later balance task; no exact amount or increase for other Golems is approved. Updated current planning summaries, economy, world, presentation, validation and roadmap; retained earlier decision records as history. No live AP/source-generation change or new playtest. Q15 on renewable supply is next.

### Q15 detail recorded November 2 2026

The user selected renewable supply that reduces repetitive resource maintenance while preserving capacity and logistics challenges. Sustainable reserves still require enough gathering, processing, suppression where applicable, and delivery. Updated systems, economy, world sustainability, validation, roadmap risk and review status. This establishes a design purpose, not new rates, AP costs or regeneration values. Dwarven Tribute and the Mythril Golem exception remain in force. No gameplay change or new playtest; Q16 on later-system teaching is next.

### Q16 detail recorded November 2 2026

The user answered 1, selecting the first offered option: optional contextual lessons and help. Explain later-system rules, controls and factual feedback while leaving factory layouts and strategies to players; tutorial completion is not a progression requirement. Power teaching remains deferred. Updated learning guidance, validation, roadmap and review status. Lesson content, invitation triggers and human comprehension remain design/validation work; no new tutorials implemented. Q17 on accessibility scope is next.

### Q17 detail recorded November 2 2026

The user answered 1, selecting the focused accessibility audit and prioritized fixes for stabilization through Complex. Scope covers text readability, contrast, color-independent cues, motion and input precision in the desktop mouse/keyboard experience. Record concrete findings, severity, environment and acceptance checks before sizing fixes. This does not commit full keyboard-only or screen-reader interaction redesign or certify compliance. Updated learning/accessibility, validation, roadmap and review status. No audit or fixes performed in this planning turn; Q18 on audio scope is next.

### Q18 detail recorded November 2 2026

The user answered 2 to numbered chat choices after reporting that native cards disappear on their phone. Include ambience and music alongside subtle interaction sounds and useful alerts, with mute/volume controls and visual equivalents for essential information. Updated presentation scope, validation, stabilization roadmap and review status. Musical direction, assets/licensing, mix, playback behavior and estimates remain work to specify; no audio system or assets created. Continue one-question-at-a-time review with numbered choices in ordinary chat while the phone-card limitation persists. Q19 on fiction scope is next.

### Q19 detail recorded November 2 2026

The user answered 2, selecting light narrative framing: a brief introduction, context for milestones and an ending. Connect the factory, Dwarven settlements and corner challenges without committing to a full campaign. Preserve the established dry humor and clear goals. Updated presentation, validation, roadmap and review status. Player identity/motivation and actual copy remain writing work; draft the ending alongside tier-7 design. No story content implemented in this planning turn. Q20 on performance scale is next.

### Q20 detail recorded November 2 2026

The user answered 1, selecting browser performance testing of a representative late-game factory on specified hardware before larger synthetic stress workloads. Cover rendering, interaction/input latency, simulation, memory and saving/undo. Define the reference factory, hardware/browser matrix, viewport, duration and numerical budgets before testing; extend the implemented late-game workload when tier 7 exists. Updated technical design, validation, roadmap and review status. No benchmark or supported-scale guarantee established in this turn. Q21 on save compatibility is next.

### Q21 detail recorded November 2 2026

The user answered 3, selecting best-effort save compatibility during development, with fresh starts potentially required. Older-save migration is not a universal release blocker. Retain existing working migrations and archives; this policy decision does not delete saves or alter storage keys. Define supported versions or intentional breaks per affected change, while verifying fresh-game and same-version save/load. Earlier plan migration suggestions are evaluated within this support boundary rather than treated as unconditional guarantees. Updated technical design, validation, roadmap and review status. No persistence code or saved data changed. Q22 on browser distribution is next.

### Q22 detail recorded November 2 2026

The user answered 1, selecting a public browser release through static hosting for the completed stabilization version. This delivery does not require waiting for the later implemented ending, and desktop packaging remains outside scope. Define acceptance gates in Q24 and select/verify the hosted release build and destination when preparing publication. Updated technical delivery, validation, roadmap and review status. No deployment or publication performed. Q23 on the first human playtest cohort is next.

### Q23 detail recorded November 2 2026

The user answered 1, selecting a small mixed group of automation enthusiasts and factory-game newcomers for the first human playtests. Keep findings separate by experience, covering depth and independent learning; retain Q08's order after sustained-production evidence. Updated validation, roadmap and review status. No participant count, recruitment or test sessions established. Prepared a proposed concrete stabilization-readiness checklist and deferred scope for Q24 review; it is not yet adopted.

### Q24 detail recorded November 2 2026

After initially selecting modification, the user explicitly chose to adopt the presented checklist for now, without wording changes. Adopt the roadmap's stabilization completion gate and deferred scope as the current baseline: stable six-Core progression, agreed system changes, recoverable problems, human learning/accessibility validation, adopted audio/framing, defined browser/persistence checks and passing engineering checks. Tier-7 implementation, final victory/continued-play systems and post-victory research remain later work; design continues in parallel. Updated roadmap, overview and definition of done. The initial Q01–Q24 review and follow-ups are complete; concrete prices, thresholds, tasks and unfinished design details remain in the roadmap register. Adoption is not milestone completion, new gameplay implementation or publication.

## Detailed Dwarven supply review

| ID | Decision | Status and next work |
| --- | --- | --- |
| Q25 | First reliable Mythril supply after Hydro, using Medium Bots | Selected option 1, November 2, 2026. Balance target; no new hard bot restriction or map-tier assignment. Validate the complete pre-Mythril bot/AP chain. |
| Q26 | One starter camp supports a modest Shiny Core factory with some expansion room | Selected option 1, November 2, 2026; exact output/AP remains pending. |
| Q26A | Research Center consumes a synchronized Core set every five seconds initially, with reductions through research | Direct user instruction before further calculations; implemented for new/loaded centers and live analysis. Six ranks yield 4.5, 4, 3.5, 3, 2.5 and 2 seconds. |
| Q27 | A small dedicated line around one continuously supplied Medium Bot assembler maintains a starter camp | Selected option 1, November 2, 2026; upstream component/Core capacity is additional; no efficiency upgrade required. |
| Q28 | Starter upkeep is 6 AP every 60 seconds | Selected option 1, November 2, 2026: two Medium Bots/check; about 83% supplied base-assembler utilization; other settlement costs unchanged by this decision. Runtime pending complete starter specification. |
| Q29 | Starter Tribute produces one Mythril every five seconds while fully suppressed | Selected option 1, November 2, 2026: 12 Mythril/minute; runtime implementation pending completed starter specification. |
| Q30 | Pause new Dwarven Tribute after failed checks while keeping the box, stock and wiring | Selected option 1, November 2, 2026. Stored stock remains transportable; production resumes at full suppression; camp pressure continues. Goblin behavior unchanged by this decision. |
| Q31 | Easiest camp uses starter values; harder Dwarven settlements increase AP cost and Mythril reward rate | Clarified November 2, 2026: all provide Mythril; no uniform starter values across all Camps. Exact numeric/difficulty/type/distance mapping and ratios remain open. |
| Q32 | Introduce waste with Complex Cores instead of Shiny | Direct user instruction, November 2, 2026. Shiny is waste-free in intended design; Complex tooling/recipes/teaching need transition; runtime unchanged. |
| Q32A | Guaranteed byproduct plus researched alternative intermediate recipes | Selected option 1 and added alternatives that may reduce resource/node demand but create waste, locked behind Complex-Core-requiring research, November 2, 2026. Standard recipes remain available; quantities, candidates and prices pending. |
| Q33 | Standard Complex production requires at least one waste-producing recipe | Selected option 2 with explicit mandatory-recipe requirement, November 2, 2026. Combined with Q32A, guarantee a waste stream in every valid Complex route. Researched alternatives add efficiency/additional waste; Shiny remains clean. |
| Q34 | Standard Controller batches produce one guaranteed Metallic Fines | Selected option 1, November 2, 2026. Replace the 65% Fines roll; retain Controller inputs and 30-second cycle; runtime implementation pending. |
| Q35 | Guaranteed Controller Fines is the only standard Complex waste stream | Selected option 1, November 2, 2026. Remove other standard Controller/Servo Piston chance wastes in the intended design; additional types belong to researched alternatives. Runtime pending. |
| Q36 | Buffer and recycle Fines using Water into a useful resource | Selected option 1 with useful-output requirement, November 2, 2026; no permanent-disposal feature or delayed-recycling choice. Recipe/output details pending. |
| Q37 | Initial Fines recycling returns Iron Plates | Selected option 1, November 2, 2026; output only, with exact process/yield pending. |
| Q38 | Direct Hydro Plant recycling: four Fines + one Water to one Iron Plate in ten base seconds | Selected option 1, November 2, 2026. No additional Residue, Separator or Charcoal requirement for the first recovery route; runtime pending. |
| Q39 | Precision Control grants Waste Bin, Waste Link and direct Fines-to-Iron recovery with Complex production | Selected option 1, November 2, 2026. No separate payment or Complex Core required for basic handling; efficient alternatives remain later Complex-paid research; prerequisite audit pending. |
| Q40 | Circuit A gets the first researched efficiency/waste alternative; include Circuit B and C using existing intermediates | Selected option 1 and added circuit-family direction, November 2, 2026. Specific B/C mapping and alternative formula remain pending. |
| Q41 | Electrode becomes Circuit B at Hydro; Logic Wafer becomes Circuit C at Complex | Selected option 1, November 2, 2026. Preserve IDs, recipes, timing and unlocks; Controller remains distinct; runtime names pending. |
| Q42 | Adopt Circuit A alternative inputs/outputs in Assembler II, but make it slightly faster | Selected option 1 with faster-cycle amendment, November 2, 2026. Two Copper Plates + one Iron Plate -> one Circuit A + one Fines; Complex-paid research; standard retained. Original five-second alternative duration not adopted. |
| Q43 | Efficient Circuit A uses a 4.5-second base cycle | Selected option 1, November 2, 2026. Existing Assembler II efficiency research applies; input/output formula unchanged. |
| Q44 | One research project costing five of each Core through Complex unlocks a set of alternatives | Selected option 1 with bundle amendment, November 2, 2026. Price clause superseded by Q46: both projects must be expensive, Q46A adopts 50/100 of each Core through Complex. Circuit A included; shared payment per set remains. |
| Q45 | Earlier set: Circuit A/Motor/Bot Frame; separate higher set: Hydro Piston/Mythril Mesh/Circuit C | User selected option 3 and delegated selections, November 2, 2026. Membership retained; Q46 replaces earlier pricing with expensive research for both. Earlier formulas resolved in Q47–Q48; Hydro Piston resolved in Q49; Mesh inputs/cycle resolved Q51; higher waste counts resolved Q52B; Circuit C inputs/cycle resolved Q56; runtime pending. |
| Q46 | Both alternative-recipe research projects should be expensive | User requested this November 2, 2026; supersedes Q44's five-of-each price and withdraws the higher ten-of-each proposal. Equal-tier payment and membership retained. |
| Q46A | Earlier set 50 of each Core through Complex; higher set 100 of each | Selected option 2, November 2, 2026. 300/600 physical Cores, one payment per set; 4m10s/8m20s fully supplied base lab time. Runtime implementation pending. |
| Q47 | Adopt Motor alternative: 2 Iron Plates + 2 Copper Plates -> 1 Motor + 1 Fines in 6 seconds, Assembler II | Selected option 1, November 2, 2026. Earlier research set; standard retained. Saves one Copper Plate and skips Gear/Wire processing; runtime pending. |
| Q48 | Adopt Bot Frame alternative: 1 Iron Plate + 1 Motor -> 1 Frame + 1 Fines in 6 seconds, Assembler II | Selected option 1, November 2, 2026. Earlier research set; accepts either Motor recipe; standard retained; runtime pending. |
| Q49 | Adopt Hydro Piston alternative: 1 Iron Plate + 1 Motor + 1 Coolant -> 1 Piston + 1 Spent Flux in 9 seconds, Assembler II | Selected option 1, November 2, 2026. Inputs/cycle retained; Q51 supersedes the one-Flux amount with increased waste, exact count pending Q52. Q50 adopts recovery; runtime unchanged. |
| Q50 | Adopt Flux recovery: 4 Spent Flux + 1 Water -> 1 Coolant in 10 seconds, Hydro Plant | Selected option 1, November 2, 2026. Granted with higher research, no separate payment or secondary waste; ordinary Coolant retained. Runtime pending. |
| Q51 | Adopt Mesh inputs/cycle at 16 seconds, but increase waste for all higher alternatives | Selected option 1 with amendment, November 2, 2026. Mesh uses 1 Pure Mythril + 2 Copper Plates + 1 Coolant, yields 1 Mesh and increased Crust. Higher waste counts pending Q52; clean standards retained. |
| Q52 | Increased waste quantity for higher-set alternatives | Single-type quantity proposal replaced by Q52B adopted mixed outputs. |
| Q52A | Each higher alternative must produce multiple types of waste | User clarified November 2, 2026. Mixed-output direction settled; Q52B subsequently adopts exact pairings/counts. |
| Q52B | Adopt Piston 2 Flux + 1 Fines; Mesh 2 Crust + 1 Flux; Circuit C 2 Slag + 1 Crust | Selected option 1, November 2, 2026. Three guaranteed waste items across two types per batch; shared product/waste outlet. Circuit C inputs/cycle and recovery subsequently resolved Q54–Q56; routing/runtime changes pending. |
| Q53 | Product and waste leave the same machine output port; player must filter | User specified November 2, 2026. Applies to waste-producing recipes, including mandatory Controller; replaces separate-port auto-separation in intended design. Runtime unchanged. |
| Q53A | Extend existing Filter to selected-item and remainder outlets | Selected option 1, November 2, 2026. One mixed input, selected-item output and remainder output; no new separator node. Runtime pending; Q53B settles blocking; rates/ordering/migration remain to design. |
| Q53B | Stop the whole Filter immediately when a needed outlet is blocked; notify on the Filter | Selected option 2 with notification request, November 2, 2026. Pause intake and both forwarding paths, preserve items, resume when clear. Show blocked outlet/cause on-node; unused empty output is not blocked. Runtime pending. |
| Q54 | Adopt Glassy Crust recovery: 4 Crust + 1 Water -> 1 Copper Plate in 10 seconds, Separator | Selected option 1, November 2, 2026. Included with higher research at no extra payment; no secondary waste; ordinary smelting retained. Runtime pending. |
| Q55 | Adopt Slag recovery: 4 Slag + 1 Water -> 1 Brick in 10 seconds, Hydro Plant | Selected option 1, November 3, 2026. Included with higher research; no secondary waste, ordinary Brick production retained. Runtime pending. |
| Q56 | Adopt Circuit C alternative: 1 Circuit A + 1 Circuit B + 1 Mythril Wire -> 1 C + 2 Slag + 1 Crust in 27 seconds, Assembler II | Selected option 1, November 3, 2026. Saves one Circuit A; both A supplies and clean standard C retained. All six variants now designed; runtime pending. |
| Q57 | Logistics filtering adds no processing time or independent throughput cap | User clarified November 3, 2026. Immediate classification; withdraw 150/minute and sixty/minute proposals. Transport and Q53B blocking still constrain flow. Runtime pending. |
| Q58 | Finish sending each mixed batch before the next, product then waste | Selected option 1, November 3, 2026. Preserve order across pauses/save-load; no later product skips earlier waste. No added sorting delay or new production-pause rule. Runtime pending. |
| Q59 | Keep both alternative research projects independent | Selected option 2, November 3, 2026. Either available after Precision Control; prices remain 50/100 of each through Complex. Earlier is not required for higher; all necessary recovery must be available. |
| Q60 | Replace old Aggregate/Metal Residue chains with the four direct recovery recipes | Selected option 1, November 3, 2026; typed/card responses recorded once. Retire old branches from intended play, preserve ordinary production. Compatibility/unlock integration and runtime changes pending. |
| Q61 | Adopt six Dwarven difficulty steps across map tiers 4–9 | Selected option 1, November 3, 2026. Camps 4–5, Villages 6–7, Kingdoms 8–9; AP and Mythril rise at every step. Q62–Q63 adopt AP/reward values; guaranteed reachability remains open. |
| Q62 | Adopt upkeep AP 6/12/18/30/48/72 per sixty-second check across tiers 4–9 | Selected option 2, November 3, 2026. Starting balance targets; Q63 adopts higher reward rates; Q64 subsequently adopts successful-check overflow credit; Q65 subsequently preserves insufficient supply; Q66 subsequently adopts immediate retry after sufficient supply arrives. Runtime unchanged. |
| Q63 | Adopt Mythril/minute 12/36/60/108/180/288 across tiers 4–9 | Selected option 1, November 3, 2026. Five-second batches 1/3/5/9/15/24 while fully suppressed. Design targets; runtime and sustained supply validation pending. |
| Q64 | Carry successful Dwarven-check overpayment into later upkeep checks | Selected option 1, November 3, 2026. Local AP credit used before more bot consumption; unused whole bots remain. Visibility/persistence and runtime implementation pending. |
| Q65 | Preserve AP credit and bots when supply cannot cover a Dwarven check | Selected option 1, November 3, 2026. Check fails with pressure/Tribute effects but spends no partial supply. Goblins unchanged; runtime pending. |
| Q66 | Retry a failed Dwarven check immediately once enough AP arrives | Selected option 1, November 3, 2026. One ordinary success, next upkeep sixty seconds after payment; no charge while already paid. Full-suppression condition still governs Tribute; runtime pending. |
| Q67 | Keep fifteen Dwarven settlements: 2/3 at tier pairs 4/5, 6/7, 8/9 | Selected option 1, November 3, 2026. Five Camps, Villages and Kingdoms each; current seeded distribution retained. Does not require managing every settlement. |
| Q68 | Raise Mythril Golem clearing AP to 20,000 | Selected option 1, November 3, 2026. Seeded random tier-6 placement/infinite reward retained; only Mythril cost changes. Runtime/migration pending. |
| Q69 | Keep Dwarven upkeep running while the Tribute box is full | Selected option 1, November 3, 2026. Pause only new Mythril; upkeep, pressure/checks and stock transport remain active. Alpha pause rule remains separate. |
| Q70 | Adopt Dwarven capacity: two minutes of output, minimum 100 | Selected option 1, November 3, 2026. Capacities 100/100/120/216/360/576 across tiers 4–9. Goblin/Alpha capacities unaffected; runtime pending. |
| Q71 | Ancient Foundry role, clarified by Q72 as a fixed assembler | Role adopted November 3, 2026; input identities adopted Q72A. Q77A supersedes its original top-right binding. Quantities/cycle/output details pending. |
| Q72 | Immovable advanced-assembler-like Foundry; use a novel intermediate combination | User rejected the Complex Core trio, November 3, 2026. Bring intermediates to fixed world node; repeat recipe creates the final-Core component. Q72A subsequently adopts parts; counts/cycle/yield remain open. |
| Q72A | Adopt Foundry inputs: Circuit B + Sealed Frame + Mythril Gear | Selected option 1, November 3, 2026. Existing items with no directly co-consumed pair in the reviewed catalog. Quantities/cycle/yield and runtime remain open. |
| Q73 | Similar overall base-resource cost per unit of each endgame component | User specified November 3, 2026. Derive Foundry amounts from a shared cost model; ten each is not adopted. Alpha AP, bottom-corner inputs and final accounting scenario remain open. |
| Q74 | Reclamation role accepts all waste types for its final-Core component | User specified November 3, 2026. Factory-wide waste use; Q75/Q76 settle contribution/blockage. Q77A supersedes original bottom-right binding. Numeric conversion pending. |
| Q75 | Shared reclamation meter accepting any waste mix | Selected option 1, November 3, 2026. Type-specific credits; single-type supply allowed, no all-type quotas. Numeric values/threshold/yield/timing remain open. |
| Q76 | Pause reclamation waste intake/consumption while its component box is full | Selected option 1, November 3, 2026. Preserve credit and stock, resume when space returns; no continued disposal. Capacities and numeric conversion remain open. |
| Q77 | Elder Grove receives regeneration from Tree Planters; reevaluate planter upkeep | User approved/clarified November 3, 2026. Existing Forest Growth output is the input; no extra harvesting quota adopted. Q78A subsequently adopts upkeep; Grove conversion remains open. |
| Q77A | Shuffle challenge identities across the four corners at new-game creation | User specified November 3, 2026. One of each; seeded/persisted assignment. Physical corner maps stay fixed; earlier identity bindings are superseded. |
| Q78 | Tree Planter upkeep uses Wood plus small quantities of other resources | User specified November 3, 2026; Charcoal-only and Wood-only proposals rejected. Q78A subsequently adopts supporting resources/quantities. |
| Q78A | Adopt 10 Wood + 1 Iron Plate + 1 Stone funding 100 regeneration | Selected option 1, November 3, 2026. All planters, current cycle speeds, unused funding preserved while blocked. Requires twelve-item input storage; runtime pending. |
| Q79 | Standard ingredient recipes first; optimization savings separately | Selected option 1, November 3, 2026. Include full upstream supplies, AP-bot production, planter upkeep and adopted recovery; keep speed/delivery separate. Numeric weights/budget remain open. |
| Q80 | Adopt equal material units; report Water separately | Selected option 1, November 3, 2026. One point per raw Iron/Copper/harvested Wood/Stone/Mythril unit, full upstream supplies included. Provisional analysis metric; budgets and meter credits remain open. |
| Q81 | Adopt ±10% cost parity around the eventual common score | Selected option 1, November 3, 2026. Use the same declared standard-recipe supply scenario; preserve separate Water/work/delivery comparisons. The 100,000-point example is not an adopted budget. |
| Q82 | Adopt tier-9 Dwarven supply with standard Medium Bots as primary costing reference | Selected option 1, November 3, 2026. Also use standard Medium Bots for Alpha AP and retain paid forestry. Other acquisition/bot routes remain sensitivity/logistics comparisons and valid player choices. |
| Q83 | Adopt substantial late-game Tree Planter throughput research before the first final Core | Selected option 1, November 3, 2026. Complex-era availability, unchanged upkeep per growth, proportionally faster supplies; multiplier, price and delivery mechanism remain open. Runtime pending. |
| Q84 | Adopt tenfold planter output with sufficient regeneration-only delivery capacity | Selected option 1, November 3, 2026. 600/minute or 666.67 with Tree Planter 1; upkeep proportional. General material/Road rates unchanged; exact growth routing/buffering and research price remain open. |
| Q85 | Adopt up-to-ten-unit growth transfers on existing within-map connections | Selected option 1, November 3, 2026. Preserve one-second travel, partial dispatch, unit-based capacity/stock and normal material/Road rates. No dedicated logistics node. Runtime pending. |
| Q86 | Adopt 100 of each Core through Complex for planter output/delivery research | Selected option 1, November 3, 2026. 600 physical Cores paid once for both effects, no final Core in the price. Runtime pending. |
| Q87 | Adopt 10,000 AP per Alpha and derived shared cost anchor | Selected option 1, November 3, 2026. 500 Complex/1,250 Heavy/or initially 3,334 Medium Bots with 2 AP carried. About 290,824 reference points/component under Q82; ±10% band about 261,742–319,906. Runtime/pacing validation pending. |
| Q88 | Adopt 3,000 each Circuit B/Sealed Frame/Mythril Gear → 1 Foundry component | Selected option 1, November 3, 2026. 9,000 delivered parts; about 301,629 reference points (+3.72%). Craft time, consumption/storage and output rules remain open; runtime pending. |
| Q89 | Adopt exactly 2,000,000 supplied regeneration → 1 Grove component | User modified proposal November 3, 2026: make it two million even. About 314,607 reference points (+8.18%), 20,000 funding batches, within ±10%. Intake/progress/output rules remain open; runtime pending. |
| Q90 | Adopt multiple direct incoming growth connections to the Grove | Selected option 1, November 3, 2026. Existing multiple-connection convention and individual route limits, no extra aggregate intake cooldown/cap. Separate roots not adopted; runtime pending. |
| Q91 | Adopt lossless repeating Grove meter with full-box pause | Selected option 1, November 3, 2026. Accumulate without timeout, immediate component per 2,000,000, carry surplus, pause intake/consumption while full and preserve progress/all stock. Box/input capacities and runtime remain pending. |
| Q92 | Adopt ten components in each corner Tribute box | Selected option 1, November 3, 2026. Ten of its own component per box, forty total across four independent boxes. Settlement/input capacities and Foundry craft/full-box rules remain separate; runtime pending. |
| Q93 | Provisional recycling-value reference; defer calibration to factory evidence; add intermediate recycling | User selects 1 with clarification, November 3, 2026. Practical waste consumption follows representative factory output; support existing-line collection or deliberate waste lines, with unwanted intermediates reverting to basic materials. Final credits/quota deliberately deferred; detailed recycling pending. |
| Q94 | Adopt early Recycler with star input and raw-material returns | User selects 1 with specification, November 3, 2026. Early research targeting Hydro; dedicated node accepts any intermediate, basics are consumed for zero output, intermediates return one of each constituent basic resource in a mixed line requiring filters. Composition, timing/access and fractional-cost treatment pending. |
| Q94A | Recycler outputs exclude all fluids | User clarification, November 3, 2026. Only solid basic resources are recovered; no Water or other fluid return. Q95 subsequently confirms the per-resource cap. |
| Q95 | Confirm maximum one per resource per recycled item regardless of complexity | User rejects batch proposal, November 3, 2026. Keep per-item recovery, no scaling with complexity/ingredient counts; no batch exception or source-recipe changes adopted. Constituent table still pending. |
| Q96 | Include Wood from upstream fuel | User instructs Wood return too, November 3, 2026. Motor returns one Iron/one Copper/one Wood; count each solid basic resource once and exclude fluids. Fuel exclusion not adopted. |
| Q97 | Adopt fixed standard-recipe composition per item | Selected option 1, November 3, 2026. Include upstream fuel, exclude fluids and deduplicate to at most one per solid resource. Mythril Gear always returns Mythril/Wood. Forty current primary-product entries derived; eligibility/runtime pending. |
| Q98 | Adopt two-second Recycler processing per input | Selected option 1, November 3, 2026. Thirty inputs/minute before blockage, same cycle for zero-output basics. No new efficiency family/faster output transport. Runtime pending. |
| Q98A | Add next-Map-Node solvability calculation and automatic resource-Golem rescue | User request, November 3, 2026. On genuine resource deadlock, large escalating congratulations modal, unlock matching Golem map/shortest explored-map path, achievement for four rescues. Budget scope, Wood roster and post-unlock bootstrap need design. |
| Q98B | Rescue completes the target Golem unlock/clearing requirement | User addition, November 3, 2026. Complete target access/AP and convert to usable infinite reserve without bot/material payment. Extraction readiness/integration remain to verify; ordinary Golems unchanged. |
| Q99 | Wood Golem addition withdrawn by Q102 | Earlier planned addition is canceled. Keep the original Iron/Copper/Stone/Mythril roster. Historical detail remains below. |
| Q100 | Count future usable passive regrowth; require permanent shortage | Selected option 2, November 3, 2026. Temporary Wood depletion does not trigger if regeneration can still meet the finite bill. No passive-regrowth exception or Forest rule change. Q100A subsequently excludes Wood rescue and reopens achievement scope; the strict renewable-supply rule remains. |
| Q100A | Exclude naturally regenerating Wood from softlock rescues | User correction, November 3, 2026. Wood remains in the budget but cannot trigger emergency rescue. Reopen the four-event achievement count; Q102 subsequently cancels the separate Wood Golem encounter. |
| Q101 | Accept research Cores and bots in the Recycler | Selected option 1, November 3, 2026. Forty current recipe-made goods use standard composition, solid one-per-resource returns and two-second cycle; six Cores/four bots included. Basic resources destroy for zero; waste/future special inputs remain separate. |
| Q102 | Scrap Wood Golem/Wood rescue; retain the three other named rescues | User instruction, November 3, 2026. No Wood encounter or emergency role. Achievement and three modal stages cover Iron/Copper/Stone; original Mythril encounter stays. Return to Q101. |
| Q103 | Adopt Recycling after Hydraulic Assembly for ten of each Core through Hydro | Selected option 1, November 3, 2026. Forty physical Cores, one project for node and adopted coverage/rules. Runtime integration pending. |
| Q104 | Reject all four waste types at the Recycler | Selected option 1, November 3, 2026. Fines/Flux/Crust/Slag use recovery/reclamation; no direct Recycler disposal/refund. Raw-basic destruction and forty crafted inputs remain as adopted. |
| Q105 | Adopt ten-item buffers and complete-result processing | Selected option 1, November 3, 2026. Ten input/ten output total, FIFO, preserve blocked stock/progress; zero-output raw head item needs no return space. Runtime pending. |
| Q106 | Adopt one rescue then recalculate | Selected option 1, November 3, 2026. Fewest additional map unlocks, deterministic ties; revalidate after route/reserve and before another modal. No all-at-once grants. Runtime pending. |
| Q107 | Keep expansion-solvability calculation internal only | User clarification, November 3, 2026. No research/map/HUD/modal budget or diagnostics; retain requested humorous rescue outcome and achievement. Runtime pending. |
| Q108 | Historical direct recipe: one of each corner component → one Final Core | Selected option 1, November 3, 2026; direct structure replaced by Q109. One-Core yield and no extras retained; Q110 confirms one of each paired component. |
| Q109 | Adopt seeded two-component intermediate recipes in regular Assemblers | User-defined November 3, 2026: partition four component types into two seed-fixed pairs; two intermediates combine into one Final Core. All three recipes unlock on first obtaining any component. Dedicated-machine proposal replaced; Q110 confirms one of each paired component. |
| Q110 | Adopt one of each paired component per half | Selected option 1, November 3, 2026. Each half consumes one of each assigned component; one of each half yields one Final Core. Total one of each corner component, no extras. Pairing, regular Assemblers and automatic unlock unchanged. |
| Q111 | Adopt 10-second halves and 30-second Final Core assembly | Selected option 1, November 3, 2026. Base cycles, before ordinary Assembler efficiency upgrades; runtime pending. |
| Q112 | Adopt one-Final-Core victory research and glowing victory modal | Selected option 1 with custom brief, November 3, 2026. One-time selected project, no extras, ordinary research cadence; completion grants victory and same-world Continue. Authored developer thanks, modding invitation and two game homages; local preview created. Runtime pending; rendered checks blocked. |
| Q113 | Adopt four user-defined world-reshaping endgame research tracks | November 3, 2026: one-time Resource Relocation, Lake Relocation and Monster Camp Relocation; increasingly expensive repeatable Deep Hole Stone-reduction research. Exact bills, effect sizes/ranges and coverage remain open. Generic speed/yield proposal not selected. |
| Q114 | Adopt same-map relocation only | Selected option 1, November 3, 2026. Resource, Lake and monster-camp relocation each preserve the feature’s map; no cross-map transfer. |
| Q115 | Adopt endgame Road channels and coordinated Train capacity/transfer research | User-defined November 3, 2026: increasingly expensive Road ranks raise the per-face limit from three to four then five; increasingly expensive Train research raises inventory and associated transfer amounts together. Exact gains/prices remain open; previous QoL alternatives not selected. |
| Q116 | Adopt tier-scaled inter-map Road shipments | Resolved by Q116A option 1, November 3, 2026: Cart/Truck/Train 1/2/4 items per five-second dispatch, bounded by stock and space. Full-load alternative not selected; runtime pending. |
| Q116A | Adopt increased inter-map Road quantities | Selected option 1, November 3, 2026. Road batches 1/2/4 per five seconds; theoretical 12/24/48 items/minute per supplied/unblocked Road. Local Q118 cadence remains 400 ms. |
| Q117 | Adopt a separate Final-Core regeneration line | Selected option 1, November 3, 2026. New Forest-inclusive repeatable alongside existing mineral-only research; earlier projects/ranks remain. Q119 adopts bonus/stacking and Q120 the seven-Core bill; Q121 prerequisites and Q122 unlimited ranks adopted. |
| Q118 | Adopt 1/2/4 items per local Cart/Truck/Train transfer | Selected option 1, November 3, 2026 after timing clarification: 400 ms launch cadence, 1,000 ms travel, overlapping transfers; theoretical 150/300/600 items/minute before stock/space limits. Road shipments are separate; runtime pending. |
| Q119 | Adopt +100% of the ordinary-researched passive rate per endgame rank | Selected option 1, November 3, 2026. Rate = ordinary-researched rate × (1 + endgame rank); ranks one/two/three give 2×/3×/4×. Forests give 4/6/8 Wood/minute while depleted. Capacity and planter/Grove output stay separate; runtime pending. |
| Q120 | Adopt all-seven-Core regeneration price ladder | Selected option 1, November 3, 2026. Cost each required type = ceil(1.5^(rank−1)); ranks one–five cost 1/2/3/4/6 each from Simple through Final. Other project prices unchanged; Q121 prerequisites adopted; cap open. |
| Q121 | Adopt victory + Mineral Regeneration 2 as regeneration prerequisites | Selected option 1, November 3, 2026. Both required for first rank; no earlier mineral-repeatable rank or modal acknowledgement gate. Other endgame availability unchanged; Q122 adopts no maximum rank. |
| Q122 | Adopt no maximum endgame regeneration rank | Selected option 1, November 3, 2026. Continue linear baseline gains and growing all-seven-Core prices; capacity and paid planter/Grove mechanics stay separate. Runtime pending. |
| Q123 | Adopt 20% compounded Stone reduction per Efficient Landfill rank | Selected option 2, November 3, 2026. Total = max(1, ceil(original base × 0.8^rank)); 250 becomes 200/160/128 at ranks one/two/three. Partial progress, research prices and cap remain open. |
| Q124 | Adopt consumed-Stone credit against the discounted total | Selected option 1, November 3, 2026. Remaining = max(0, discounted whole-hole total − consumed Stone). No refund; if already paid, ready for normal clearing. Unused stock is not consumed fill. Legacy reconstruction remains implementation work. |
| Q125 | Adopt regeneration’s seven-Core price ladder for Efficient Landfill | Selected option 1, November 3, 2026. Rank cost ceil(1.5^(rank−1)) each Simple through Final; first five per-type amounts 1/2/3/4/6. Q126 adopts availability; cap remains separate/open. |
| Q126 | Adopt post-victory Efficient Landfill access | Selected option 1, November 3, 2026. Requires recorded victory-project completion; no extra ordinary research or notice-acknowledgement gate. Ordinary hole clearing unchanged; cap open. |
| Q127 | Adopt a rank-45 Efficient Landfill cap | Selected option 1, November 3, 2026. Rank 45 reaches one Stone for the current 20,000-base maximum; no rank 46 purchase. User also adopts one current-level updating entry for recurring endgame research. |
| Q127A | Adopt one updating Research entry per recurring endgame line | User-defined with Q127, November 3, 2026. Show only the current purchasable/in-progress level and cost; advance after completion. Capped lines end with one completed entry; no future-level row list. |
| Q128 | Adopt +20 Train storage and +1 local/Road batch item per rank | Selected option 1, November 3, 2026. Capacity 80 + 20r, batch 4 + r; existing local/Road timings retained. Source/room/route limits apply; price/access/cap remain open. |
| Q129 | Adopt the shared seven-Core price ladder for Train research | Selected option 1, November 3, 2026. Rank cost ceil(1.5^(rank−1)) each Simple through Final; first five per-type amounts 1/2/3/4/6. Ordinary vehicle research prices unchanged; access/cap open. |
| Q130 | When should recurring Train research unlock? | Recommend recorded victory + ordinary Trains research; alternative first Final Core production + Trains. Neither availability package adopted; rank cap open. |

### Q25 detail recorded November 2 2026

The user answered 1, selecting first reliable Mythril supply after Hydro using Medium Bots. Update world/economy/readiness guidance and validate sustainable Medium Bot supply without Mythril. Exact AP and reward rates are not chosen by this answer; set the intended supported factory scale in Q26 before tuning them. This starts the detailed Dwarven supply design pass after the completed overview review. No runtime balance change or new playtest.

### Q26 and Q26A detail recorded November 2 2026

The user selected option 1 for starter-camp supply: a modest Shiny Core factory with room to expand. They also instructed that the Research Center start by consuming Cores every five seconds, reduced through research, before further calculations. Found a mismatch between new one-second labs, original-import five-second labs and one-second analytical assumptions. Implemented a shared five-second base across placement, save/template normalization, legacy imports and research execution; preserved existing six upgrade factors and Core-set synchronization. Refreshed live research-time and base-throughput analysis, separating iteration counts from seconds. Marked older experiments for revalidation before further balance use. Exact AP/reward values remain open. Q27 on starter-camp bot upkeep capacity is next.

### Q27 detail recorded November 2 2026

The user selected option 1: starter-camp upkeep uses a small dedicated line around one continuously supplied Medium Bot assembler. Upstream component and Basic Core production are additional. Read the live 25-second Medium Bot cycle, 3 AP strength and 60-second settlement interval: capacity is 2.4 bots/minute, suggesting two bots/6 AP per check with about 83% final-assembler utilization. Current earliest 24 AP needs eight bots/check, around 3.33 base final assemblers. Record 6 AP as the Q28 review proposal; no runtime cost change. Full-chain supply, startup and delivery remain unvalidated.

### Q28 detail recorded November 2 2026

The user selected option 1: starter-camp upkeep is 6 AP every 60 seconds, supplied by two Medium Bots per check. Record it as agreed design replacing the current earliest 24-AP requirement in the eventual implementation, without changing other settlement costs. Runtime remains unchanged while the camp specification is completed. Q29 proposes one Mythril/five seconds (12/minute), based on two raw Mythril per Shiny Core and 2.5 Cores/minute per base Shiny assembler. Two such assemblers use 10 Mythril/minute; proposal leaves 2 spare and fits one raw-material Road's 12/minute capacity if other supply/processing/transport works. Exact reward is not yet adopted; no new gameplay run.

### Q29 detail recorded November 2 2026

The user selected option 1: starter Dwarven Tribute produces one Mythril every five seconds while fully suppressed. Adopt 12/minute as the design reward alongside Q28's 6 AP/60-second upkeep. Current recipes imply enough Mythril for two base Shiny assemblers with a small surplus, subject to complete processing/supply/delivery. Runtime camp values remain unchanged until the specification is completed; other settlement rewards are not set by this decision. Q30 next reviews how a failed suppression check affects the Tribute box, earned stock and wiring.

### Q30 detail recorded November 2 2026

The user selected option 1: missed Dwarven suppression checks pause new Tribute but preserve the box, stored Mythril and attached wiring. Earned stock remains transportable; new production resumes when full suppression returns. Camp growth/pressure and retained Mythril-processing discovery remain. This is a design change from current inactive-box removal, awaiting implementation and interruption/save-load testing; Goblin behavior is outside this decision. Q31 next clarifies whether the starter AP/reward values apply to all Dwarven Camps or only an introductory encounter.

### Q32 detail recorded November 2 2026

The user redirected the active design discussion to introducing waste with Complex Cores instead of Shiny. Adopt Shiny as waste-free and Complex as the first waste-management challenge. The shared Pure Mythril recipe must not produce pre-Complex Slag or retroactively add waste to Shiny supply after Complex unlock; align basic waste tools, recovery and optional teaching with Complex access without a self-gating first-Core requirement. Current Complex intermediates already produce probabilistic waste. Exact first source, guaranteed/probabilistic behavior, types, amounts and unlock triggers remain open, starting with Q32A. Q31 camp-scaling was not answered and is parked for later. Update current planning claims; retain old runtime/playtest evidence as historical or still-live until implementation. No runtime recipe/unlock change or new playtest in this turn.

### Q31 clarification recorded November 2 2026

The user clarified the parked question: only the easiest Dwarven camp uses the adopted 6 AP/60-second and one-Mythril/five-second values. Harder camps increase both AP cost and reward rate; all Dwarven camps provide Mythril. Record this as the settlement difficulty direction, without inventing step values, geography/type mappings or cost-to-reward ratios. Updated world, economy, validation, roadmap and current review status. Q32A on Complex waste remains unanswered and is next. No runtime changes or playtest.

### Q32A detail recorded November 2 2026

The user selected guaranteed byproducts and added alternative recipes for selected intermediates, potentially needing fewer resources and nodes while creating waste, unlocked through research requiring Complex Cores. Keep standard recipes and a viable first-Complex supply so the research can be funded. Preserve equal-Core-tier research rules unless separately changed. Candidate bills must include waste handling and recycling when comparing equal primary output. Q33 next clarifies whether standard Complex recipes remain waste-free or retain a baseline waste challenge; do not silently infer that part from the alternate-recipe instruction. Exact recipes, waste types/rates, research price and handling access remain open. No runtime recipe/research change or new playtest.

### Q33 detail recorded November 2 2026

The user selected option 2 and explicitly required Complex Core production to include at least one waste-producing recipe. Combined with Q32A's guaranteed-byproduct choice, standard Complex production must produce waste; this is not limited to optional researched alternatives. Preserve clean standard Shiny production. Additional efficient intermediate recipes require Complex-Core research and add waste; do not let alternative routing bypass the mandatory Complex waste requirement. Basic handling must be available for the first Core before that research can be funded. Updated economy, validation, learning, roadmap and review status. Q34 proposes making Controller Fines guaranteed, with recipe placement/yield still awaiting review. No runtime changes or new playtest.

### Q34 detail recorded November 2 2026

The user selected option 1: one guaranteed Metallic Fines per Controller batch. Replace the existing 65% Fines output rather than double-counting it; primary yield, ingredients and 30-second cycle remain unchanged by this decision. Controllers remain a required standard Complex ingredient, providing the mandatory waste step. Record batch/full-buffer safety and first-Core handling validation. Q35 next reviews the other existing chance outputs; Q34 alone does not remove them. Updated economy, learning, validation, roadmap and review status. No runtime recipe change or new playtest.

### Q35 detail recorded November 2 2026

The user selected option 1: standard Complex introduces only guaranteed Metallic Fines from Controllers, with additional waste types through researched alternatives. Remove standard Controller Crust and Servo Piston Flux/Crust probabilities in the intended design; keep primary ingredients, yields and cycles unchanged. Exact alternative waste recipes/types/rates remain pending. Updated economy, learning, validation, roadmap and review status. Q36 next reviews first-stream handling, using the existing water-based Fines-to-Residue recovery as a proposal. No runtime recipe change or new playtest.

### Q36 detail recorded November 2 2026

The user selected option 1, buffering and water-based recycling, and required conversion into a useful resource. Make recovery usable with the first required waste before the first Complex Core; storage is temporary and does not destroy waste. Read the existing Fines-to-Metal-Residue and Residue/Charcoal-to-Iron-Plate recipes as a baseline. Q37 proposes Iron Plates because an existing production/recovery path can consume them; actual recovered output, process simplification and yields still need review. Updated economy, learning, validation, roadmap and review status. No runtime recipe/unlock changes or new playtest.

### Q37 detail recorded November 2 2026

The user selected option 1: Iron Plates are the useful recovered resource from initial water-based Fines handling. Exact yield/process remains open. Inspected existing Hydro Plant settling (4 Fines + 1 Water -> 3 Metal Residue, 10s) and Separator recovery (2 Residue + 1 Charcoal -> 1 Iron Plate, 6s). Q38 proposes a simpler direct Hydro Plant recipe (4 Fines + 1 Water -> 1 Iron Plate, 10s), comparing lower direct yield with fewer processing stages and no Charcoal. No automatic removal of other Residue/recovery uses. Updated economy, learning, validation, roadmap and review status; no runtime changes or playtest.

### Q38 detail recorded November 2 2026

The user selected option 1: one Hydro Plant step consumes four Metallic Fines plus one Water to produce one Iron Plate in ten base seconds. No Metal Residue intermediate, Separator or Charcoal is required for this initial recovery. Keep unrelated recovery recipes for separate review; do not automatically delete their uses. Updated economy, learning, validation, roadmap and review status. Q39 proposes unlocking the basic storage/link/recycling bundle alongside Complex production, with prerequisite auditing so no first-Core self-gate remains. No runtime recipe/unlock changes or new playtest.

### Q39 detail recorded November 2 2026

The user selected option 1: Precision Control grants Complex production plus Waste Bin, Waste Link and direct Hydro Plant Fines-to-Iron recycling with no additional research payment. Basic handling must not require Complex Cores; alternative-recipe research remains a later Complex-funded purchase. Audit the existing Mineral Recovery prerequisite and early discovery grants to keep the tier progression and no-self-gate requirement coherent. Updated economy, learning, validation, roadmap and review status. Q40 next selects the first alternative intermediate candidate. No runtime unlock/recipe changes or new playtest.

### Q40 detail recorded November 2 2026

The user selected Circuit A as the first efficient waste-recipe target and requested Circuit B and Circuit C somewhere in progression, repurposing current intermediates. Inspected Electrode, Logic Wafer, Controller and their consumers/unlocks. Q41 proposes Electrode as B at Hydro and Logic Wafer as C at Complex: the latter already consumes two Circuit A, one Electrode and one Mythril Wire, so the identity change adds no recipe stage. Controller remains the mandatory Fines source. Alternate Controller/Logic Wafer mapping is available. Mapping, labels and formulas are not changed by this proposal. Updated economy, presentation, validation, roadmap and review status; no runtime changes or playtest.

### Q41 detail recorded November 2 2026

The user selected option 1: repurpose Electrode as Circuit B at Hydro and Logic Wafer as Circuit C at Complex, keeping existing IDs, ingredients, timing and unlocks. Controller remains separately named and produces required Fines in the intended design. Updated economy, presentation, validation and roadmap. Prepare Q42 formula: two Copper Plates + one Iron Plate -> one Circuit A + one Fines in five seconds in Assembler II. Current standard uses one Wire from three Copper Plates plus one Iron Plate; proposal saves one Plate and skips conversion, but adds waste support. At twelve Circuits/minute, adopted recycling handles twelve Fines via three ten-second batches, using three Water and returning three Iron Plates/minute. This is an analytical proposal; runtime names/formulas remain unchanged.

### Q42 detail recorded November 2 2026

The user selected option 1 for the efficient Circuit A formula and requested slightly faster production as well. Adopt Assembler II, two Copper Plates + one Iron Plate -> one Circuit A + one Fines, later Complex-Core research, and retained standard recipe. Do not treat the originally proposed five-second duration as final. Q43 proposes 4.5 seconds: 10% shorter cycle/about 11.1% higher output, yielding 13⅓ Circuits/Fines per minute and requiring 3⅓ recycling batches per minute with 33⅓ Hydro Plant machine-seconds. Include unchanged Road limits and recovery support; exact timing/price remains pending. No runtime recipe changes or new playtest.

### Q43 detail recorded November 2 2026

The user selected option 1: efficient Circuit A uses a 4.5-second base cycle. Retain adopted Assembler II inputs/outputs, standard recipe access and existing machine efficiency factors. Updated timing/throughput status and proposed Q44 research at five of each Core through Complex after Precision Control. Live standard-Core bills imply thirty total Cores and twenty-five seconds base lab time; production/delivery are additional. Compared five versus ten/twenty of each and labeled the Copper-only savings comparison separately from full payback. No price is adopted yet. No runtime recipe/research changes or gameplay validation.

### Q44 detail recorded November 2 2026

The user selected five of each Core through Complex and required bundling other alternative recipes as a set. Apply the price once to the whole initial project, including efficient Circuit A; do not charge it separately per recipe. This is thirty physical Cores/five synchronized sets, twenty-five base lab seconds when fully supplied. Q45 proposes Circuits A/B/C as a coherent initial set, or Circuit A/Hydro Piston/Mythril Mesh. Other formulas and exact membership remain unapproved. Update Copper-only savings discussion as an illustration for Circuit A rather than total bundle payback. No runtime research/recipe changes or new playtest.

### Q45 detail recorded November 2 2026

The user chose another composition, delegating two earlier-tier Assembler components alongside Circuit A and requesting a separate three-member higher-tier Assembler set/research. Select Motor and Bot Frame for the earlier set, with Hydro Piston, Mythril Mesh and Circuit C for the higher set. Checked standard regular-Assembler versus Assembler II recipe grouping. Earlier project retains five of each Core through Complex, paid once. Higher research requires Complex Cores; propose ten of each in Q46. Do not assume a prerequisite sequence or formulas/waste types for the five undesigned variants. Circuit B identity remains without an automatic variant. Updated economy, validation, roadmap and review status; no runtime changes or playtest.

### Q46 detail recorded November 2 2026

The user requested that both research projects be expensive. Replace the earlier adopted five-of-each price and withdraw the proposed ten-of-each higher price; retain shared payment per set, membership and equal Core quantities through Complex. Q46A proposes 100 of each for the earlier set and 250 of each for the higher set. At five seconds per synchronized set, base lab times are 8m20s/20m50s. At the current 36-second Complex recipe, one fully supplied unupgraded final assembler takes 60/150 minutes for their Complex shares alone. These are analytical comparisons, not measured progression or approved prices. Review all-recipe payback when formulas are ready. No runtime changes or playtest.

### Q46A detail recorded November 2 2026

The user selected option 2: earlier alternative set costs 50 of each Core through Complex; higher set costs 100 of each. Shared payment per three-recipe set and item membership remain. Totals are 300/600 physical Cores; corrected five-second base lab processing is 250/500 seconds (4m10s/8m20s), excluding delivery and production. One fully supplied base Complex final assembler takes 30/60 minutes for the Complex share alone. These are analytical consequences, not playtest measurements. Q47 proposes a Motor alternative in Assembler II: two Iron Plates plus two Copper Plates produce one Motor and one Fines in six seconds. Compared with standard Gear/Wire inputs, it saves one Copper Plate and skips two conversion steps; full waste support and combined Bot Frame economics remain to review. No runtime changes or playtest.

### Q47 detail recorded November 2 2026

The user selected option 1: adopt the six-second Motor alternative in Assembler II, two Iron Plates plus two Copper Plates for one Motor and one guaranteed Metallic Fines. Earlier research-set access, existing machine efficiencies, and the standard Motor recipe remain. Q48 proposes Bot Frame at one Iron Plate plus one Motor for one Frame and one Fines in six seconds, also Assembler II. It saves one direct Iron Plate and keeps Motor production relevant. Checked combined direct ingredients and both waste streams without double-counting Motor savings. No runtime changes or playtest.

### Q48 detail recorded November 2 2026

The user selected option 1: adopt the six-second Bot Frame alternative in Assembler II, one Iron Plate plus one Motor for one Frame and one guaranteed Metallic Fines. Earlier set membership/payment and standard recipe access remain; either Motor recipe is usable. This completes formula/cycle design for the earlier three-recipe set, not implementation. Q49 proposes Hydro Piston with one Iron Plate, one Motor and one Coolant for one Piston and one Spent Flux in nine seconds, Assembler II. Compared with standard Gear/Motor/two-Coolant inputs it saves a direct Iron Plate and half the Coolant, but Flux recovery is unapproved and must be usable with higher-set access. Checked standard recipe/Coolant inputs; no runtime change or playtest.

### Q49 detail recorded November 2 2026

The user selected option 1: adopt the nine-second Hydro Piston alternative in Assembler II, one Iron Plate plus one Motor plus one Coolant for one Piston and one guaranteed Spent Flux. Higher-set access and clean standard recipe remain. Q50 proposes direct Hydro Plant recovery of four Flux plus one Water into one Coolant in ten seconds, granted with higher research at no additional payment. Compared with current Flux stabilization into Aggregate, this returns a directly useful Piston input while requiring continued fresh Coolant supply; unrelated Aggregate uses are not removed. Reviewed current Flux/Coolant recipes and average recovery workload, with no runtime change or playtest.

### Q50 detail recorded November 2 2026

The user selected option 1: adopt Hydro Plant recovery, four Spent Flux plus one Water into one Coolant in ten base seconds, granted with higher alternative research without additional payment. No secondary waste; ordinary Coolant remains necessary and available. Unrelated Aggregate uses are not automatically removed. Q51 proposes Mythril Mesh from one Pure Mythril, two Copper Plates and one Coolant, yielding one Mesh and one Glassy Crust in sixteen seconds, Assembler II. This retains Mythril demand, reduces standard resource inputs and skips Wire conversion, while requiring a usable Crust recovery route to be reviewed next if adopted. Checked live standard Mesh, Wire and Crust recovery baselines. No runtime changes or playtest.

### Q51 detail recorded November 2 2026

The user selected the sixteen-second Mythril Mesh alternative, with an amendment that the higher-tier alternatives should make more waste. Adopt Mesh inputs, machine, primary yield and cycle; do not adopt its proposed one-Crust amount. Apply increased waste to Hydro Piston, Mesh and the future Circuit C alternative, superseding Piston's earlier one-Flux count while retaining its other recipe decisions. Q52 proposes three waste items per batch for each; this is not yet an adopted count. Updated current one-Flux throughput/recovery claims so they no longer appear valid. Three Flux would recover 0.75 Coolant per Piston, keep fresh demand and create twenty Flux/minute at base speed. Crust recovery and Circuit C design follow quantity review. No runtime changes or playtest.

### Q52 follow-up recorded November 2 2026

The user added “And different types of waste” without selecting a quantity. Record waste variety as required; do not adopt three per batch or infer whether the user intends mixed outputs. Q52A proposes multiple types per recipe: Piston Flux/Fines, Mesh Crust/Flux and Circuit C Slag/Crust, with one distinct type per recipe as the other interpretation. Exact counts remain unresolved. Existing single-type throughput examples are conditional only; future recovery calculations must distinguish each type and simultaneous output capacity. No runtime changes or playtest.

### Q52A clarification recorded November 2 2026

The user clarified “I meant multiple types of waste.” Record multiple waste types per higher-tier alternative as settled; do not ask again about single versus mixed outputs. This does not adopt the proposed pairings or any quantities. Q52B makes the proposal concrete: Piston two Flux plus one Fines, Mesh two Crust plus one Flux, Circuit C two Slag plus one Crust, with one of each type or custom outputs as alternatives. Replaced current single-type quantity illustrations with mixed-stream recovery accounting; earlier historical discussions remain intact. No runtime changes or playtest.

### Q53 detail recorded November 2 2026

The user requires waste and desired products on the same connection port so players must filter the stream. Record as adopted for waste-producing production, including Controller and both alternative sets; no approval needed for this explicit direction. Current machine ports auto-separate product/WASTE, Filter has no remainder outlet and engine routing can pick compatible source items, so cosmetic port changes alone would bypass the intent. Q53A proposes extending existing Filter with selected/remainder outputs; exact node behavior and amounts remain unsettled. Required filtering must be available for the first Controller without Complex-Core payment. Q52B did not receive a choice and remains open. Updated systems, economy, learning, technical, validation and roadmap notes. No runtime changes or playtest.

### Q53A detail recorded November 2 2026

The user selected option 1: extend the existing Filter with one mixed input, selected-item output and everything-else output. This settles node choice, not output quantities, throughput, buffer sizes or blocked-output rules. Q53B proposes independently draining bounded outlet buffers: either full buffer pauses new mixed intake, while already separated items in the other can still leave. This allows brief interruptions but eventually backs up production if waste is not handled. No items are discarded. Q52B pairings/counts remain unanswered. Updated systems, economy, learning, technical, validation and roadmap records; no runtime changes or playtest.

### Q53B detail recorded November 2 2026

The user selected option 2 and requested a notification on the Filter. Adopt immediate whole-Filter stop when waiting material cannot move through its needed outlet: no new intake or forwarding through either side until clear. Reject the proposed independent-drain buffering grace behavior; preserve all items and resume after recovery. Empty unused output alone does not block a single-item feed. Show a persistent notification on the affected Filter with blocked outlet/cause and recovery guidance, clearing it when resolved without per-tick spam. This is a design decision, not implementation. Return to still-unanswered Q52B mixed waste pairings/counts, then remaining recycling and Circuit C design. No runtime changes or playtest.

### Q52B resolution recorded November 2 2026

The user selected option 1 in the native card: adopt the two-plus-one mixtures, Piston two Flux plus one Fines; Mesh two Crust plus one Flux; Circuit C two Slag plus one Crust. Counts are guaranteed and leave through the shared product/waste port. Circuit C inputs/cycle remain to design; do not treat waste selection as adoption of its full recipe. Updated affected quantities, current analytical rates and review status; preserved historical proposals. Q54 proposes Separator recovery of four Crust plus one Water into one Copper Plate in ten seconds, included with higher research at no extra cost. Current Crust -> Aggregate -> Brick remains a comparison baseline; unrelated recovery uses are not automatically removed. No runtime change or playtest.

### Q54 detail recorded November 2 2026

The user selected option 1 in the native card: adopt Separator recovery of four Glassy Crust plus one Water into one Copper Plate in ten base seconds, included with higher research at no extra cost. No secondary waste; ordinary Copper smelting and unrelated recovery uses remain. Q55 proposes Hydro Plant recovery of four Slag plus one Water into one Brick in ten seconds, also included with higher research. This simplifies the existing Slag -> Aggregate -> Brick handling but does not automatically remove unrelated Aggregate/Residue uses. Circuit C cycle/ingredients remain to design, so only per-Circuit Slag workload can currently be stated. No runtime change or playtest.

### Q55 detail recorded November 3 2026

The user selected option 1 in the native card: adopt Hydro Plant recovery of four Slag plus one Water into one Brick in ten base seconds, included with higher research at no extra cost. No secondary waste; retain ordinary Stone-to-Brick production and unrelated Aggregate/Residue uses. Q56 proposes Circuit C inputs/cycle: one Circuit A, one Circuit B and one Mythril Wire for one Circuit C plus its already-adopted two Slag and one Crust, twenty-seven seconds in Assembler II. It saves one Circuit A and slightly speeds the standard thirty-second cycle while retaining B/Wire branches. Checked source standard recipe and analytical per-minute recovery with no assumption of earlier-set research dependency. No runtime change or playtest.

### Q56 detail recorded November 3 2026

The user selected option 1 in the native card: adopt Circuit C at one A plus one B plus one Mythril Wire, yielding one C plus two Slag and one Crust in twenty-seven seconds in Assembler II. Retain clean standard C and either A supply. This completes six alternative and four direct-recovery formulas/cycles on paper; routing, ordering, research relationships and runtime implementation are still unfinished. Q57 proposes 150 items/minute shared across Filter outputs, with no extra processing cycle and immediate blocking as adopted Q53B. Read ordinary 400 ms launch cadence separately from 1,000 ms travel; calculated single-machine offered load with existing efficiency factors, without asserting measured throughput. No gameplay changes or playtest.

### Q57 clarification recorded November 3 2026

The user clarified that the Filter should not add throughput time and neither should logistics filtering. Adopt immediate filtering/sorting, with no additional processing cycle, per-node filtering delay or separate Filter cap. Withdraw both proposed numerical limits; do not treat ordinary cable launch cadence as a Filter machine speed. Normal transport travel/capacity and Q53B immediate blockage/notification remain. Q58 proposes completing each mixed production batch in predictable product-then-waste order before the next, with fair interleaving as an alternative; this is not yet adopted. Updated current rate proposals and validation notes while preserving historical discussions. No runtime change or playtest.

### Q58 detail recorded November 3 2026

The user selected option 1: finish sending each batch in predictable product-then-waste order before sending the next. For Piston: Piston, Flux, Flux, Fines, then the next batch. Preserve order and items across blocking/resume and persistence; do not add a separate processing wait or require production to stop if ordinary output capacity allows further batches. Q59 proposes earlier alternative research as a prerequisite for higher, retaining separate fifty/one-hundred-of-each payments; cumulative 150 of each is 900 physical Cores and 750 fully supplied base lab seconds. Dependency remains unapproved, and either A recipe remains a valid physical input regardless of eventual project sequencing. No runtime change or playtest.

### Q59 detail recorded November 3 2026

The user selected option 2: keep the two alternative projects independent after Precision Control. Earlier remains fifty of each Core through Complex; higher one hundred of each. Either may be bought alone or first, with no implicit earlier prerequisite or 150-each cost for higher-only access. Verify standard A/Motor inputs and all required filtering/recovery for that route. Q60 proposes replacing old Aggregate/Metal Residue branches with the four adopted direct recovery recipes, or retaining them as optional routes. Read current recovery recipe producers/consumers; no retirement, stock deletion or runtime change is authorized by the proposal. No playtest.

### Q60 detail recorded November 3 2026

The user selected option 1 in typed text and the native card; record this as one decision. Replace the old Aggregate/Metal Residue branches with the four adopted direct recovery recipes. Retire six old intermediate-chain formulas from intended play; preserve ordinary production and review legacy stock/IDs, active batches, templates and research dependencies rather than silently deleting data. Earlier notes leaving retention open are superseded as planned availability; live implemented records remain current until code changes. Q61 returns to Dwarven scaling, proposing six steps across existing map tiers 4–9, with AP and Mythril rising at every step. Source currently uses Camp/Village/Kingdom grouping across those tiers with six AP values but type-only reward amounts. Exact new rates and guaranteed placement remain undecided. No runtime change or playtest.

### Q61 detail recorded November 3 2026

The user selected option 1: adopt six Dwarven steps across map tiers 4–9, with Camp at 4–5, Village 6–7, Kingdom 8–9. Increasing AP and Mythril per step remains in force. Higher values and guaranteed access are not resolved by this mapping. Q62 proposes AP 6/12/24/48/96/192 per sixty-second check; starter six is already adopted. Compared current bot AP/cycles: three Heavy Bots provide twenty-four AP and ten Command Bots provide two hundred AP, with final assembly and all upstream costs still needing normal-play validation. Higher Mythril rewards are next after AP selection. No runtime change or playtest.

### Q62 detail recorded November 3 2026

The user selected option 2: adopt gentler AP upkeep 6/12/18/30/48/72 per sixty-second check at tiers 4–9. The earlier doubling ladder is not adopted. Recomputed bot comparison: nine Heavy Bots exactly supply seventy-two AP; six base forty-second final assemblers supply nine/minute before upstream costs. Q63 proposes rewards 12/36/60/108/180/288 Mythril/minute (whole five-second batches 1/3/5/9/15/24), improving raw Mythril per AP with difficulty. Proportional 12/24/36/60/96/144 is the alternative. Rewards remain unapproved and AP efficiency is not full resource efficiency. No runtime change or playtest.

### Q63 detail recorded November 3 2026

The user selected option 1: adopt Mythril/minute 12/36/60/108/180/288 at tiers 4–9 while fully suppressed, as five-second batches 1/3/5/9/15/24. Pair with adopted AP 6/12/18/30/48/72 per sixty-second check. The proportional alternative is not adopted; improved Mythril/AP does not establish improved full bot-resource efficiency. Q64 proposes carrying successful-check surplus as local AP credit and consuming only needed bots after credit. Current payment chooses minimum sufficient whole-bot AP and keeps unused bots, but spent overpayment has no retained credit and failed checks consume insufficient supply. Failure policy remains separate. No runtime change or playtest.

### Q64 detail recorded November 3 2026

The user selected option 1: retain successful Dwarven-check overpayment as local AP credit used before consuming additional bots, leaving unused whole bots buffered. Four Command Bots against seventy-two AP leave eight credit. Preserve visibility/save-load in implementation. Failed checks remain a separate policy: Q65 proposes keeping insufficient bots and credit, with check failure, existing pressure and Q30 Tribute pause still applying. Example eighteen-AP requirement, four credit and three Medium Bots fail at thirteen; two later Medium Bots enable nineteen and leave one credit after payment. Do not infer Goblin or recovery-timing changes. No runtime change or playtest.

### Q65 detail recorded November 3 2026

The user selected option 1: preserve insufficient whole bots and AP credit on a failed Dwarven check. Failure, settlement pressure and Q30 Tribute pause still apply; only full successful payment consumes supply, with surplus under Q64. Goblins are unchanged. Q66 proposes an immediate single retry when a failed check has sufficient AP, then a fresh sixty-second interval from payment. It preserves existing successful strength reduction/full-suppression conditions, so one payment is not promised to restore Mythril instantly. Insufficient arrivals do not themselves trigger extra growth penalties. Current engine checks run on the sixty-second interval and apply strength minus/plus ten; no runtime change or playtest.

### Q66 detail recorded November 3 2026

The user selected option 1: retry a failed Dwarven check immediately when full AP is available, apply one ordinary successful suppression step and schedule the next upkeep sixty seconds after payment. No repeated charging while paid or extra per-arrival failure penalties. Full suppression still gates new Mythril, and Q64–Q65 preserve surplus/insufficient supply. Q67 proposes retaining current fifteen-settlement distribution, two/three in each tier pair (five of each type); six one-per-tier settlements are the alternative. Read current seeded generation and summed nominal AP/reward targets without claiming sustainable delivery or requiring every settlement. No runtime change or playtest.

### Q67 detail recorded November 3 2026

The user selected option 1: retain fifteen Dwarven settlements, two/three across tier pairs 4/5, 6/7 and 8/9, five of each type. This is the current seeded count/distribution, not adoption of any unchanged legacy reward/AP values. Players need not manage all settlements. Q68 proposes increasing only Mythril Golem clearing AP to twenty thousand, with fifteen thousand as the alternative, keeping the adopted random tier-six location and infinite-reserve conversion. Read shared source Golem cost and bot AP; noted per-mineral initialization/legacy health concerns and aggregate assembly versus elapsed time. No runtime change or playtest.

### Q68 detail recorded November 3 2026

The user selected option 1: adopt 20,000 AP for clearing the Mythril Golem only. Preserve seeded random tier-six placement and one-time infinite-reserve conversion; other Golems stay at current cost. This remains a design target pending implementation, compatibility and measured payback. Q69 proposes continuing Dwarven suppression upkeep while a full Tribute box stops only new Mythril, with full-box hibernation as the alternative. Read current independent Tribute-production capacity check; do not import the Alpha corner full-box pause into settlement upkeep without a decision. No runtime change or playtest.

### Q69 detail recorded November 3 2026

The user selected option 1: a full Dwarven Tribute box pauses only new Mythril, while AP upkeep and settlement pressure/checks continue normally. Stored Mythril remains transportable; no full-box hibernation. Alpha full-box pause remains separate. Q70 proposes Dwarven capacity equal to two minutes of output with minimum one hundred, giving 100/100/120/216/360/576; fixed one hundred is the alternative. Current shared production guard and node capacity must be reconciled if changed. Stock duration comparisons are nominal output arithmetic, not exact five-second batch fill time. Shortened the master index status row for review readability; historical decision records remain. No runtime change or playtest.

### Q70 detail recorded November 3 2026

The user selected option 1: adopt two minutes of nominal output with minimum one hundred for Dwarven Tribute capacity, giving 100/100/120/216/360/576 at tiers 4–9. Upkeep still runs while full; Goblin/Alpha capacities are unaffected. Runtime creation/production/display/save handling remain to implement and validate. Return to undefined endgame corners on paper: Q71 proposes top-right Ancient Foundry production/delivery commissions awarding its component through Tribute, with fluid/cooling or another theme as alternatives. No component name, recipe, reward quantity or detailed corner behavior is adopted by this proposal. No runtime change or playtest.

### Q71 detail recorded November 3 2026

The user selected option 1: top-right Ancient Foundry with repeatable manufactured-part delivery commissions awarding its final-Core component through Tribute. This adopts the role/location, not input identities, quantities, reward count, timing or component name. Q72 proposes Circuit C, Controller and Servo Piston, the three existing Complex Core intermediates. Mythril Mesh/Gear/Wire is the alternative input focus. Preserve standard supply paths and do not impose optional alternative-research prerequisites. Updated remaining-corner status; bottom two themes remain open. No runtime change or playtest.

### Q72 clarification recorded November 3 2026

The user rejected the proposed Complex Core trio, asking for intermediates not already used together and a node essentially an immovable advanced assembler that crafts the intermediate for the last Core. Record fixed world-node crafting as adopted; keep the Ancient Foundry role/location and agreed Tribute collection. Do not introduce a separate commission-selection interface. Q72A proposes Circuit B, Sealed Frame and Mythril Gear: inspected all forty-eight current recipes and found no direct recipe using any candidate pair together. This establishes novelty of the proposed combination, not adoption, quantities, cycle or measured balance. No runtime change or playtest.

### Q72A detail recorded November 3 2026

The user selected option 1: adopt Circuit B, Sealed Frame and Mythril Gear as the Foundry input identities. Retain the immovable assembler-like world node, ordinary upstream supply and agreed Tribute collection. Counts, cycle and component yield/name are not selected by choosing identities. Q73 proposes ten of each for one component, with five each as the alternative; dedicated input storage must fit the chosen batch. Equal counts are not equal upstream costs, and no throughput/endgame cost comparison is established before timing and other corners are defined. No runtime change or playtest.

### Q73 clarification recorded November 3 2026

The user requires similar overall base-resource cost for one unit of each corner component. Record the shared unit-cost constraint, not ten-of-each or a final-Core recipe of exactly one each. Added the endgame component cost model and recursively calculated standard manufacturing bills: one B/Frame/Gear group costs 18 Iron, 21 Copper, 22 Wood, 3 Stone, 5 Water and 4 Mythril before acquisition/recycling; ten each is roughly one Command Bot manufacturing basket, so it is not an established match for a high-AP Alpha. Alpha AP and bottom two mechanisms are not defined. Q74 proposes bottom-right Ancient Waterworks fluid/cooling engineering, with local Water guaranteed, before deriving numerical costs. No runtime change or playtest.

### Q74 clarification recorded November 3 2026

The user rejects repeating existing Core challenges and requests a corner accepting waste of all kinds, encouraging restructuring the overall factory to use it and obtain an endgame component. Adopt bottom-right global waste reclamation; withdraw Waterworks and its unadopted Water guarantee. Retain explicit source filtering, existing transport limits, ordinary recycling as a competing use and Tribute collection. All-kind acceptance does not decide any-mixture credits versus all-type quotas; Q75 recommends shared credits with values to calibrate. Added co-product and foregone-recovery accounting to the cost model; no resource input may be charged twice to useful parts and their waste. No runtime change or playtest.

### Q75 detail recorded November 3 2026

The user selected option 1: any mixture of Fines, Flux, Crust and Slag contributes type-specific credit to one reclamation meter; no mandatory all-type quotas. Numeric values/threshold/yield/timing remain to define. A single type is valid and higher alternative research is not implicitly required solely for waste diversity. Q76 proposes pausing waste acceptance/consumption while the component box is full, retaining credits and stock; this can back up central waste flow and keeps local recycling/overflow useful. The alternative is continued disposal with progress frozen and no new rewards while full. Neither full-box policy is adopted yet. No runtime change or playtest.

### Q76 detail recorded November 3 2026

The user selected option 1: pause reclamation waste intake/consumption when the component box is full, preserving stored waste, in-flight stock and meter credit; resume when space returns. Continued disposal is not adopted. This may back up the central waste route and keep local recycling/overflow useful; numeric credit/capacity values remain open. Q77 proposes the remaining bottom-left role as Elder Grove renewable forestry/regrowth, with terrain/routing or another concept as alternatives. Material expenditure and repeatability must be defined before unit-cost comparison; waiting/free planter operation alone is not a resource bill. No runtime change or playtest.

### Q77 and Q77A recorded November 3 2026

The user approves Elder Grove and specifies regeneration from Tree Planters, with upkeep reevaluated. Record growth supply, not the unadopted harvesting/local-health ideas. Current planters cost no consumables, emit one growth per 1,000 ms (900 with upgrade) and stop at five buffered output; one growth restores one Forest reserve unit. Q78 proposes one Charcoal funding ten growth at existing cycles, with direct Wood as the alternative.

The user also requires randomized corner placement at game start. Interpret as one seeded permutation of the four challenge identities over the four physical corner maps; persist it and keep progress/components bound to identity. Earlier fixed compass assignments are superseded, while challenge mechanics remain. Current summaries/tables are reconciled; dated historical discussions retain their original wording. No runtime change or playtest.

### Q78 clarification recorded November 3 2026

The user rejects the proposed single-resource upkeep and requires Wood plus a small amount of other resources. Record composition direction, not the old Charcoal-only or Wood-only quantities. Q78A proposes ten Wood, one Iron Plate and one Stone funding one hundred regeneration, emitted at current cycles; unused funding is retained and blocked output incurs no ongoing charge. At full base output direct average demand is six Wood and 0.6 of each supporting item/minute; ordinary smelting gives eleven Wood/two Iron/one Stone gross per funding batch. It needs twelve input capacity rather than the current ten total. Exact recipe and funding behavior remain unapproved. No runtime change or playtest.

### Q78A detail recorded November 3 2026

The user selected option 1: adopt ten Wood plus one Iron Plate plus one Stone funding one hundred regeneration for all Tree Planters. Emit gradually at existing cycles, preserve unused funding while blocked and retain ordinary Forest/Grove use. Input storage must fit twelve items, and persistence/legacy aliases need implementation. Gross ordinary manufacturing is eleven Wood/two Iron/one Stone plus 9.5 Smelter/Kiln seconds per funding batch, before planter/extraction/delivery. Q79 proposes standard ingredient recipes as the common initial per-unit cost reference, with full upstream acquisition/upkeep and separate composite/optional optimization scenarios. No baseline/common budget or Grove threshold is adopted yet. No runtime change or playtest.


### Q79 detail recorded November 3 2026

The user selected option 1: standard ingredient recipes first, including full upstream supplies, bot manufacture, adopted Tree Planter upkeep and agreed recovery rules; show composite/optional savings separately. Expanded reference vectors compare starter and tier-9 Mythril upkeep using Medium Bots and close the paid-forestry Wood feedback loop. Natural regeneration, one-time capital and extraction/transport work are explicitly excluded from these scenarios, not assumed costless. Intended guaranteed Controller Fines replace obsolete standard chance outputs. Local recovery versus retaining waste are separate cases. Q80 proposes an equal-unit non-Water material score with Water quantity/rate reported separately; the flat index is provisional, and neither weights nor a common component budget are adopted. Analysis only, with arithmetic checks; no runtime change or playtest.


### Q80 detail recorded November 3 2026

The user selected option 1: provisional one point per raw Iron, Copper, harvested Wood, Stone and Mythril unit, with Water quantity/rate reported separately. Include full upstream supplies and preserve resource baskets, machine work and delivery comparisons. This does not adopt equal scarcity, final prices, a Mythril route, bot mix or reclamation credits. Published analytical vectors now identify the adopted score separately from the rejected Water-inclusive comparison. Q81 proposes each corner component within plus/minus ten percent of the eventual common score under one declared supply scenario, allowing rounded batches; plus/minus twenty percent is the alternative. Tolerance, target and exact corner quantities remain unadopted. Documentation and arithmetic review only; no runtime change or playtest.


### Q81 detail recorded November 3 2026

The user selected option 1: each corner component should fall within plus/minus ten percent of the eventual common material-score target under the same declared standard-recipe supply scenario. Preserve separate Water, processing and delivery comparisons. The 100,000-point example is not a selected budget. The existing starter/tier-9 Mythril scenarios differ by about 28.9% for the same Foundry group, so Q82 proposes tier-9 Dwarven upkeep paid with ordinary Medium Bots as the primary reference, also using Medium Bots for Alpha AP. Keep other routes/bot mixes as sensitivity and logistics comparisons. Added a Small Bot material comparison to check all four ordinary AP recipes; Medium is lowest per AP in these scenarios, not necessarily the best delivered factory. No primary scenario, Alpha threshold, corner recipe quantities or common budget adopted. Analysis/documentation only; no runtime change or playtest.


### Q82 detail recorded November 3 2026

The user selected option 1: tier-9 Dwarven Mythril maintained with standard Medium Bots anchors material costing; use the same bots for Alpha AP and retain paid forestry. Keep other player supply routes as sensitivity/logistics comparisons. Calculated hypothetical 5,000/10,000-AP scales without selecting either: the latter corresponds to about 1.85 million Grove regeneration, over five Grove-only hours from one hundred unconstrained base planters, plus supporting work. This exposes a throughput issue rather than establishing a workable factory. Q83 proposes substantial Complex-era planter throughput research available before the first final Core, with unchanged material cost per growth and proportionally higher supplies. Exact multiplier, research cost, transport/intake design and all corner quantities remain open. Resource discounts and Power are not part of the proposal. No runtime change or playtest.


### Q83 detail recorded November 3 2026

The user selected option 1: adopt substantial Complex-era Tree Planter throughput research before the first final Core. Keep Wood/Iron Plate/Stone cost per regeneration unchanged, so faster output needs proportionally faster supplies. Exact multiplier, price and delivery mechanism are not yet selected. Inspected one-output connection capability, five-unit output storage and ordinary one-item/400 ms dispatch: a speed-only change cannot deliver the proposed tenfold rate through one route. Q84 proposes tenfold production with sufficient regeneration-only delivery capacity, preserving funding, explicit unit conservation and general material/Road rates. Base/upgraded targets 600/666.67 growth per minute need 72/80 direct physical input items per minute on average. Alternative fivefold; neither multiplier is adopted. No runtime change or playtest.


### Q84 detail recorded November 3 2026

The user selected option 1: adopt tenfold Tree Planter output and enough regeneration-only delivery capacity to sustain it when supplied/unblocked. Targets are 600 growth/minute, or 666.67 with Tree Planter 1; full direct upkeep is 60 Wood/6 Iron Plates/6 Stone per minute before Tree Planter 1 and 66.67/6.67/6.67 afterward. General material/Road rates remain unchanged. Q85 proposes dispatching up to ten existing paid growth units together over current within-map connections, preserving travel, partial groups and capacity-based blocking, without adding a new node/item. Read transfer shape, pending counts, delivery/cancellation and Road dispatch: current accounting assumes one item, so unit amounts/save compatibility must be handled together. Price, buffer sizes and exact delivery mechanism remain unsettled. No runtime change or playtest.


### Q85 detail recorded November 3 2026

The user selected option 1: growth travels in groups of up to ten on existing within-map connections after the new research. Preserve one-second travel, immediate partial groups, funding per growth, unit-based capacity reservations and lossless stock. Ordinary material and Road rates stay unchanged; no dedicated regeneration logistics node is adopted. Buffers and runtime transfer/save/display work remain pending. Q86 proposes a shared price of one hundred of each Core from Simple through Complex for output and delivery together, 600 total, paid once; two hundred each is the alternative. No final Core price or extra per-planter research payment is proposed. Research price remains undecided; no Alpha AP, Grove quota or common budget is adopted. Documentation/analysis only; no runtime change or playtest.


### Q86 detail recorded November 3 2026

The user selected option 1: tenfold planter output and grouped growth delivery unlock together for one hundred of each Core through Complex, six hundred physical Cores total, paid once. No final Core in the price; ongoing upkeep per growth is unchanged. Runtime project, exact prerequisite integration and buffers remain to implement. Q87 returns to the endgame common-cost anchor: proposes ten thousand AP per repeatable Alpha, equivalent to five hundred Command Bots, twelve hundred fifty Heavy Bots or initially 3,334 Medium Bots with two surplus AP. Q82 material reference gives about 290,824 points; unadopted rounded Foundry/Grove examples fall within the agreed tolerance. AP target, common budget and corner recipes remain unadopted, with sustained supply, waste allocation and pacing still to validate. No runtime change or playtest.


### Q87 detail recorded November 3 2026

The user replied 1 to Q87: adopt ten thousand AP per repeatable Alpha, anchoring the shared Q82 standard-reference material target at about 290,824 points. Q81's ±10% bounds are about 261,742–319,906. Preserve accumulation, surplus, full-AP respawn and full-box pause. At current strengths, five hundred Complex or twelve hundred fifty Heavy Bots pay exactly; the first 3,334 Medium Bots leave two AP for later cycles. This does not imply every bot mix has the same resource cost. Q88 proposes 3,000 Circuit B, 3,000 Sealed Frames and 3,000 Mythril Gears for one Foundry component: 9,000 delivered parts, about 301,629 points (+3.72%). Recipe quantities, duration, storage/consumption and output behavior remain unadopted. Reclamation allocation and sustained factory pacing still need validation. No runtime change or playtest.


### Q88 detail recorded November 3 2026

The user replied 1: adopt 3,000 Circuit B + 3,000 Sealed Frames + 3,000 Mythril Gears for one Foundry component. The fixed world node receives 9,000 parts; its Q82 upstream score is about 301,629 (+3.72% versus Alpha), inside Q81 bounds. Consumption/storage, craft time and output/full-box rules remain open. Q89 proposes 1,850,000 supplied regeneration for one Grove component: 18,500 funding batches, about 291,011 reference points (+0.064%). The illustrative 100-planter emission time requires appropriate parallel intake and support; one growth route alone cannot deliver at that rate. Grove quantity/yield and progress/full-box rules remain unadopted. Shortened current queue summary while preserving detailed history. No runtime change or playtest.


### Q89 modification recorded November 3 2026

The user requests an even two million instead of the proposed 1,850,000. Adopt exactly 2,000,000 supplied regeneration for one Grove component: 20,000 funding batches; direct 200,000 Wood/20,000 Iron Plates/20,000 Stone. Under Q82 forestry, expanded cost is about 314,607 material points (+8.18% versus Alpha), still inside the ±10% band. One hundred tenfold planters emit this in 33.33 Grove-only minutes, or thirty with Tree Planter 1; one incoming grouped route alone takes 22.22 hours. Q90 proposes multiple direct Grove growth connections, permitting parallel routes under existing per-route accounting; separate root-intake nodes are the alternative. Topology, progress/surplus, output/full-box behavior and exact capacity remain open. No runtime change or playtest.


### Q90 detail recorded November 3 2026

The user replied 1: Grove accepts multiple direct incoming growth connections using the existing multiple-connection convention. Each route keeps its transfer limit; merging into one path still shares that path's limit. No added central intake cooldown or aggregate rate cap, while input-space/reservation and future full-box behavior can block acceptance. Separate fixed root intakes are not adopted. Q91 proposes a lossless repeating meter: accumulate with no timeout, award immediately at two million, carry surplus, pause intake/consumption when the component box is full and preserve all progress, buffered/in-flight growth and stock. Exact box/buffer capacity remains open. Cycle policy is not adopted yet. No runtime change or playtest.


### Q91 detail recorded November 3 2026

The user replied 1: adopt Grove accumulation without deadline, immediate component at two million growth, surplus carry and full-box pause of intake/consumption preserving credited, buffered/in-flight growth and components. Resume automatically when output space returns; no extra reward timer. Component/input capacity and runtime transactions remain pending. Q92 proposes a uniform ten components in each of the four corner Tribute boxes (forty worldwide, separate stocks), with one hundred each as the alternative. This covers output capacity only, leaving settlement/input capacities and pending Foundry craft/full-box details separate. No box capacity adopted yet. No runtime change or playtest.


### Q92 detail recorded November 3 2026

The user replied 1: each corner Tribute box holds ten of its own component, forty components total across four independent boxes. Preserve existing lossless pauses; this does not choose input-buffer capacity, settlement capacity or pending Foundry craft/full-box policy. Q93 proposes foregone local recycling material value as the waste-credit reference, counting shared manufacturing once and checking useful-product demand, deliberate waste manufacturing and actual collection throughput separately. Analytical single-type equivalents are roughly 368k Fines/Crust, 737k Flux or 1.16m Slag against the Alpha anchor, not adopted quotas. Alternative explicit joint production-cost allocation. Valuation and numerical meter recipe remain unadopted. No runtime change or playtest.


### Q93 clarification and deferral recorded November 3 2026

The user selects 1 but requires representative factory waste measurements before deciding final credits/quota. Keep recycling opportunity value provisionally; the corner should absorb roughly normal factory waste, supporting existing-line collection or deliberate waste production. Also adopt the requested intermediate-to-basic-material recovery capability for unwanted main products. Average factory composition/cadence and waste rates remain unknown; compare empirical flow with the recorded resource-parity constraint and surface conflicts. Added a dedicated recycling/benchmark document. Q94 proposes raw resources versus basic processed returns; machine, eligibility, quantities, cycle/access and output handling remain open. Final reclamation calibration is deliberately deferred, settled for now. No runtime change or playtest.


### Q94 specification recorded November 3 2026

The user selects raw resources and specifies early research, perhaps Hydro, unlocking a dedicated star/ANY-input node. Any intermediate may be sent; basic resources are consumed with zero output. An intermediate returns one of each constituent basic resource on a mixed line requiring filtering. Record automatic input-driven recovery, not a recipe-selected Separator. Exact gate/price, constituents (including fuel/Water and variants), other item eligibility, cycle, buffers and blocked-output policy remain open. Composite Mythril Gear/Wire use two raw Mythril for four outputs, so one-Mythril per-item recovery exceeds input. Q95 proposes small batch exceptions; source-recipe changes or retained material gains are alternatives, neither adopted. Reclamation calibration remains deferred. No runtime change or playtest.


### Q94A fluid-output clarification recorded November 3 2026

The user instructs that fluids must not be included as outputs. Adopt solid-only raw-resource returns from the Recycler; fluid constituents are not recovered as liquid outputs. This settles the output restriction, not input eligibility or whether upstream solid fuel counts as composition. Q95 remains open because its Mythril example concerns a solid resource; no batching exception, source-recipe revision or permitted material gain has been selected. No runtime change or playtest.


### Q95 cap clarification recorded November 3 2026

The user rejects the batching proposal and clarifies maximum return is one of any individual resource regardless of complexity. Record per-item, per-resource cap; no quantity scaling, batching exception or source-production change is adopted. Do not convert this clarification into a separate approval of an accounting label or repeat the batch decision. Constituent eligibility is still to define. Q96 proposes excluding upstream consumed fuel: Motor returns Iron/Copper but not Wood used for smelting Charcoal. Including fuel-derived Wood is the alternative. No runtime change or playtest.


### Q96 fuel inclusion recorded November 3 2026

The user instructs Wood return too. Adopt upstream fuel inclusion: Motor returns one Iron, one Copper and one Wood; repeated upstream branches do not multiply any resource beyond one. Fluid outputs remain excluded. Q97 proposes a fixed table from each item's standard recipe chain, so identical items recycle predictably; Mythril Gear would always return Mythril/Wood. Actual production-path contents are the alternative, with composite gears also returning Copper and origin retained through mixing/storage/save-load. No composition basis is adopted yet. No runtime change or playtest.


### Q97 standard composition recorded November 3 2026

The user selects 1: each item has fixed contents from its designated standard manufacturing chain, including upstream fuel and excluding fluids, with at most one of each solid resource returned. No production-origin tracking. Generated a readable/JSON reference for forty standard primary products, excluding optional composites and six retired recovery recipes as composition sources; all dependencies resolve and outputs have at most five types. Table presence does not approve non-intermediate eligibility. Q98 proposes two seconds per input, thirty/minute and at most 150 outputs/minute; one second is the alternative with possible output limits. No runtime change or playtest.


### Q98 cycle and expansion-rescue extension recorded November 3 2026

The user selects two-second Recycler processing and requests an always-maintained next-Map-Node resource calculation. If depletion makes the next purchase impossible, show a large congratulatory dry-humor modal, thank them for testing the game, unlock the matching Golem map plus a shortest path from explored maps, escalate jokes for subsequent resources and award an achievement for four rescues. Added a detailed design with four modal drafts and Destructive Testing achievement draft. Current Golems cover Iron/Copper/Stone/Mythril, not Wood; Q99 proposes adding Wood while retaining Mythril and counting the four named basic-resource rescues. Need true feasibility accounting (stored goods, contributions, renewable supply, available recipes/Map Points), frozen research quote handling, AP/survey/extraction bootstrap and natural Wood-regrowth semantics. No automatic Golem defeat or Wood roster change is adopted. No runtime change or playtest.


### Q98B rescued-Golem activation recorded November 3 2026

The user also requires completing the Golem unlock requirement. In the context of the preceding AP/bootstrap concern, include target access and AP clearance in the rescue, converting the rescued Golem to its usable infinite reserve without consuming bots/materials. Preserve ordinary encounter requirements elsewhere and verify extraction readiness; no unrelated global research grant is assumed. Apply target conversion, path unlock and rescue history atomically and once. Updated modal drafts to describe the cleared reserve. Q99 remains unanswered: adding a Wood Golem and the four-resource achievement scope still need resolution. No runtime change or playtest.


### Q99 Wood Golem recorded November 3 2026

The user instructs that a Wood Golem be added. Retain the four existing resources including Mythril; planned five-resource roster, with the achievement counting the four named Wood/Iron/Copper/Stone rescue events. Ordinary Wood encounter placement/AP/form and runtime integration remain pending; rescue target activation is already adopted in Q98B. Current protected Forests renew one Wood per thirty seconds, so a strict infinite-future supply test can prevent any Wood rescue. Q100 proposes excluding future passive Forest regrowth from the Wood rescue budget while counting present/recoverable reserves and funded/affordable active growth; actual Forest regrowth remains unchanged. This trigger exception and alternatives are unadopted. No runtime change or playtest.


### Q100 permanent-shortage choice recorded November 3 2026

The user selects option 2: include future usable passive regrowth and require genuine permanent shortage. Temporary Wood exhaustion cannot trigger when reachable regenerative supply can eventually meet the finite research bill; no arbitrary waiting-time exception. Preserve natural Forest behavior, Wood Golem and four-resource achievement scope, while recording that protected usable Forests can prevent the Wood rescue from occurring in ordinary play. Actual source access, feasibility and achievement attainability require validation. Q101 proposes accepting research Cores and bots alongside components in the Recycler using their existing composition entries; parts-only is the alternative. Eligibility remains unadopted. No runtime change or playtest.


### Q100A renewable-Wood correction recorded November 3 2026

The user remembers natural Forest regrowth and states the player cannot softlock on Wood. Remove Wood from emergency trigger conditions, retaining it in the resource budget and preserving Forest behavior. Reopen the prior four-event achievement requirement instead of inventing a Wood failure. The separate explicit Wood Golem addition remains recorded as ordinary content; it has not been expressly canceled. Q102 proposes three distinct Iron/Copper/Stone rescues for Destructive Testing. Q101 Recycler Cores/bots eligibility remains unanswered, queued while this rescue correction is resolved. No runtime change or playtest.


### Q102 Wood cancellation recorded November 3 2026

The user explicitly scraps the Wood Golem and Wood from the rescue plan. Remove the encounter addition and Wood emergency/achievement requirement. Remaining named events are Iron/Copper/Stone; Destructive Testing requires all three in one world, with three escalating modal stages. Retain Iron/Copper/Stone/Mythril Golems, ordinary Forest regrowth and Wood budget accounting. No Mythril rescue is inferred. Return to unanswered Q101 Recycler Cores/bots eligibility. No runtime change or playtest.


### Q101 manufactured-input coverage recorded November 3 2026

The user selects 1: Recycler accepts research Cores and bots alongside intermediate goods. Adopt eligibility for the forty current standard primary-product entries, including six Cores/four bots, with existing capped solid returns and two-second processing. Basic resources remain zero-output destruction; spent contributions are not item stock. Waste/future special inputs remain to classify. Updated the readable/JSON table eligibility status. Q103 proposes Recycling after Hydraulic Assembly for ten each Simple/Basic/Automata/Hydro (forty total), with twenty each as the alternative. Gate/price remain unadopted; no runtime change or playtest.


### Q103 Recycler research recorded November 3 2026

The user selects 1: Recycling requires Hydraulic Assembly and costs ten each Simple, Basic, Automata and Hydro Cores (forty total), unlocking the node and adopted coverage together. No separate price per supported item. Q104 proposes rejecting the four wastes so they use existing recovery/reclamation paths; zero-output waste destruction at two seconds/item is the alternative. Neither policy is adopted. Existing raw-resource zero-output destruction and forty crafted-item recovery remain as agreed. No runtime change or playtest.


### Q104 waste rejection recorded November 3 2026

The user selects 1: Recycler rejects all four waste types, retaining their dedicated recovery recipes and endgame reclamation role. Do not consume, refund, void or skip waste to reach later output items. Basic-resource destruction and forty mapped crafted inputs remain adopted. Q105 proposes ten total input/output spaces each, FIFO, whole-result space before input consumption and lossless blocked-cycle preservation; zero-output basics may process at the queue head without output space. Buffer/commit policy remains unadopted. No runtime change or playtest.


### Q105 buffers and processing recorded November 3 2026

The user selects 1: ten total input and ten total output items, input arrival order, complete-return space before consuming at cycle completion, preserved stock/progress while blocked and item-return-set output FIFO. Zero-output basic resources need no output space but cannot overtake an older input. Core Recycler design is now settled, runtime pending. Q106 proposes one deficient-resource rescue at a time, selecting fewest additional map unlocks (fixed ties), reevaluating after the new route/reserve before another modal. All initial deficits at once is the alternative; no policy adopted yet.


### Q106 sequential rescue recorded November 3 2026

The user selects 1: rescue one deficient resource, selecting the Golem needing fewest new map unlocks (deterministic ties), then recalculate after the route and reserve are applied. Revalidate before any further rescue; queue the next modal after the prior closes. Newly opened supply can remove other deficits. Q107 proposes resource-budget views in Map Node research details and expanded-map information, with an optional persistent HUD summary alternative. Continuous calculation/automatic rescue operates regardless of view state; display placement is not adopted yet. No runtime change or playtest.


### Q107 hidden-failsafe clarification recorded November 3 2026

The user rejects visible calculation: it is only the game's softlock failsafe. Remove proposed research/map/HUD budget views and numerical diagnostic content from rescue modals. Retain automatic hidden checks and the requested congratulatory rescue/route/reserve/achievement outcome. No new warning/approval gate. Return to endgame assembly with Q108 proposing one of each corner component for one Final Core, no extras. Counts/yield remain unadopted; machine, cycle, gate and victory activation remain open. No runtime change or playtest.


### Q108 Final Core recipe recorded November 3 2026

The user selects 1: one each Alpha, Foundry, reclamation and Grove component makes one Final Core with no extra material ingredient. Added dedicated Final Core/victory/postgame document. Source Assembler II has three inputs; Q109 proposes a new player-placeable four-input Core Assembler, with adapting Assembler II as the alternative. Endgame Theory currently depends on Autonomous Logistics, conflicting with the post-first-Core transport gate if used for assembly; revise that path before runtime implementation. No machine, cycle or new research bill is adopted. No game change or playtest.

### Q109 seeded two-stage Final Core assembly recorded November 3 2026

The user replaces the four-input machine proposal with two seed-randomized intermediate recipes, each taking a different pair of the four corner component types, followed by one of each intermediate into one Final Core. All three run in regular two-input Assemblers. Unlock all three automatically upon first obtaining any corner component; no paid research or Endgame Theory assembly gate. Count the first award into its accessible Tribute box as acquisition, persist the milestone and pair mapping, and isolate world-specific recipe data across worlds/tutorials. Global transport access remains after first Core production. “Two each” leaves numerical component quantities ambiguous; Q110 asks one versus two units of each paired component rather than silently doubling the previous bill. Q108 direct assembly is replaced; one-Core yield/no extra materials remain. New half names and cycles, legacy migration, Recycler contents and victory/postgame specifics remain open. Documentation/analytical metadata only; no runtime implementation or playtest.

### Q110 component quantities recorded November 3 2026

The user selects option 1: each intermediate consumes one unit of each of its two seed-paired corner components and produces one half. One Half A plus one Half B produces one Final Core, so net consumption remains one of each corner component without extra ingredients. Updated assembly, costing, progression, technical, QA and roadmap summaries and analytical metadata. The four challenges retain their individual quantities/cost targets; Reclamation quota remains deferred. All three recipes still use regular Assemblers and unlock together on first acquisition of any corner component. Q111 proposes base cycles of ten seconds per half and thirty seconds per Final Core, with ordinary Assembler efficiency rules; the slower alternative is thirty/sixty seconds. Timing is not adopted. Documentation/metadata only; no runtime change or gameplay test.

### Q111 assembly timing recorded November 3 2026

The user selects option 1: ten seconds for either Core half and thirty seconds for the Final Core, before ordinary Assembler efficiency upgrades. Quantities, seeded pair mapping, automatic first-component recipe unlock and all corner requirements remain unchanged. Theoretical base capacities are six halves/minute and two Final Cores/minute per respective supplied/unblocked Assembler; these do not establish sustained corner-network output. Updated plan summaries and analytical metadata. Q112 proposes an explicitly selected one-time Research Center project consuming one Final Core without extras to record victory, with same-world Continue; global transport availability still follows first Core production independently. The alternative is research enabling a separate player-activated finale. Victory mechanism/cost remains unadopted. Documentation/metadata only; no runtime change or gameplay test.

### Q112 victory research and modal recorded November 3 2026

The user selects option 1: one Final Core, without extra ingredients, completes a selected one-time Research Center victory project. They request a fancy glowing modal in NODE’s dry voice: the developer has now offered the intended journey and hopes the player enjoyed it; invite modding to make it actually fun; include original affectionate homages to Factorio’s planets/rockets and Satisfactory’s corporate planetary resource extraction. Authored document 16 and a self-contained local preview with a warm-gold Core, charcoal panel, four passages and Continue playing. Specify saved victory/notice acknowledgement, same-world continuation and unchanged first-production global transport availability. The invitation does not claim a mod loader or a working external modding action. Static preview syntax and copy correspondence passed; headless inspection was unavailable and browser policy blocked file URLs, so no rendered-layout/interaction pass is claimed. No runtime integration, research/save test or new balance measurement. Q113 next reviews faster production cycles versus a material-saving/yield benefit for the first repeatable Final-Core optimization project; neither is adopted.

### Modal review deferred November 3 2026

The user will review the victory modal later and asks to move to the next topic. Preserve the draft without claiming presentation approval. Continue with Q113 post-victory research; no choice of its production-speed or material-yield alternatives was supplied. No runtime change or new verification.

### Research inventory requested November 3 2026

The user asks to list what exists before choosing the first repeatable Final-Core optimization benefit. Reviewed current research assembly, late data and implemented mineral/intake/global-pool effects against the adopted master-plan additions. Added a research inventory to document 15: nine six-rank machine families, five non-Map indefinite repeatables, other current resource/logistics/utility upgrades, adopted planter/alternative/Recycler/global-access/victory work and older unadopted pool-capacity/automatic-selection candidates. Current repeatables use Cores through Complex, not Final Cores. Q113 remains pending rather than interpreting this request as a speed/yield choice; no new card is required to supply the requested list. Documentation/source review only; no runtime change or balance test.

### Q113 endgame world-reshaping research recorded November 3 2026

The user adopts four research directions: resources movable via one-time research; progressively cheaper Stone filling of Deep Holes via increasingly expensive repeatable research; Lakes movable via separate one-time research; monster camps movable via separate one-time research. This resolves Q113 with a user-defined portfolio rather than generic production speed/yield. Created document 17, preserving exact prices, reduction/range/coverage and first-Core/victory availability details as open. Relocation should preserve existing object state and not imply copying/replenishing it. Inspected static immovable world controls, movement entry points and hole progress: depleted deposits currently leave 250-fill-unit holes; natural holes vary by size/tier. Suggested Priority Overflow Routing, Global Pool Item Capacity, Bulk Retrofitting, Factory Telemetry, Compact Installations and Research Automation as candidates only. Q114 next reviews within-map versus cross-map scope. Planning only; no game code or gameplay test.

### Q114 relocation scope recorded November 3 2026

The user selects option 1: all three relocation researches allow repositioning within the same map only. Preserve sector identity, geographic resource distribution and long-distance supply needs. Cross-map relocation is not adopted. Updated world-reshaping design, current summaries and analytical metadata. Additional QoL candidates remain proposals; Q115 next asks which to adopt, with Priority Overflow Routing recommended and Global Pool Item Capacity as another strong fit. No runtime change or gameplay test.

### Q115 endgame transport research recorded November 3 2026

The user supplies increasing research to raise Road limits to five per map-node face, plus increasing Train capacity research and transfer quantities that scale with it and associated vehicle research. Preserve current three-slot progression, extend to four then five with rising prices, and keep incoming/outgoing endpoints sharing each face cap. Current Cart/Truck/Train inventories are 20/40/80; solid Road dispatch remains one item/five seconds, so capacity alone is not throughput. Created document 18 requiring coordinated shipment and loading/unloading support while leaving exact formulas, prices and Train rank cap open. Q116 proposes smaller proportional 1/2/4 batches at existing capacities versus full-load 20/40/80, keeping five seconds in either proposal; neither payload policy is adopted. The prior six QoL candidates remain unadopted. No game code change, new test or balance run.

### Within-map transfer clarification recorded November 3 2026

The user replies “Within a map node yes.” Record within-map transfer increases as confirmed, without treating this as option 1 or 2 of Q116 and without inferring an inter-map payload policy. Current Road one-item/five-second figures remain the baseline, not a selected future rule. Q116A asks whether larger transfer quantities should also cross Roads between maps. Five-slot face cap, rising Train capacity research and prior relocation scope are unchanged. No runtime change or new test.

### Forest-inclusive repeatable regeneration recorded November 3 2026

The user requests repeating research granting increasing regeneration to resource nodes, explicitly including Forests. Record the benefit/coverage, not a per-rank bonus, price, cap or stacking formula. Current Forests passively restore one Wood/30 seconds; current mineral repeatables exclude Forests. Q117 proposes a separate Final-Core line alongside earlier mineral research versus broadening the existing mineral repeatable. Preserve paid Tree Planter/Grove mechanics and the declared standard costing reference; this direction is not free direct Grove input. Q116A Road scope and Q116 shipment figures remain unanswered, since this message adds research rather than selecting those alternatives. Planning only; no runtime change or balance test.

### Lower-tier vehicle throughput requirement recorded November 3 2026

The user requires throughput increases in the lower-level research too, from Carts to Trains. Make ordinary Truck research increase supported local loading/unloading throughput over Cart and ordinary Train research improve over Truck, available when those earlier projects complete. Later repeatable Train research continues that progression; larger buffers alone do not satisfy it. Preserve existing/new/custom-named vehicles and templates across maps. No numerical amount or inter-map shipment scope is chosen, and the message does not answer Q117 regeneration integration. Q118 proposes local 1/2/4 transfer quantities at existing connection cadence/travel, with deferral of exact values as the alternative. Planning only; no game code or gameplay test.

### Q118 local transfer amounts recorded November 3 2026

After learning ordinary local launches occur every 0.4 seconds with one-second overlapping travel, the user selects option 1: Cart/Truck/Train move up to one/two/four items per relevant local transfer. Adopt theoretical 150/300/600 items/minute per supplied/unblocked connection, with partial stock/room limits and matching lower-tier research effects. No Road payload or later Train rank gain is selected. Next combine pending Q116A scope and Q116 Road amounts in one concrete review: matching one/two/four per five-second Road dispatch, or keeping one-item Roads. Forest-inclusive regeneration integration Q117 remains unanswered. Planning/metadata only; no runtime implementation or gameplay rate test.

### Q116A inter-map Road shipments recorded November 3 2026

The user selects option 1: Cart/Truck/Train Road batches of up to one/two/four items every five seconds. This resolves the earlier Q116 numeric policy and Q116A inter-map scope together. Theoretical per-Road rates are twelve/twenty-four/forty-eight items/minute, with up to 240/minute from five outbound Train Roads before other limits. Preserve source/receiving bounds, shared directional slot accounting and independently adopted local one/two/four per 400 ms with 1,000 ms travel. Lower-tier research grants both effects; later Train rank gains/prices remain open. Full-load Road alternative not selected. Return to unanswered Q117 regeneration integration. Documentation/metadata only; no runtime implementation or throughput test.

### Q117 separate endgame regeneration line recorded November 3 2026

The user selects option 1: create a new Final-Core repeatable regeneration line alongside earlier mineral-only research, with Forest coverage already agreed. Preserve earlier projects, serialized IDs and completed ranks. Final Cores fund the new line; exact bill, other Core requirements, bonus/stacking, prerequisites and rank cap remain open. Q119 proposes each rank adding 100% of the current ordinary-researched passive rate (ranks one/two/three give 2×/3×/4×); gentler alternative +50% (1.5×/2×/2.5×). Neither formula is adopted. The Forest baseline example is two Wood/minute; proposed outputs are four/six/eight. Keep paid Tree Planter/Grove output separate and do not silently change the standard costing baseline. Documentation/metadata only; no runtime change or balance test.

### Q119 endgame regeneration rank effect recorded November 3 2026

The user selects option 1: each endgame rank adds 100% of the current passive rate after ordinary research. Adopt rate = ordinary-researched rate × (1 + endgame rank), with ranks one/two/three giving 2×/3×/4× rather than exponential doubling. Forest baseline two Wood/minute becomes four/six/eight; preserve existing mineral effects, stock capacity and paid Tree Planter/Grove mechanics. Q120 proposes a first price of one of every Core through Final, then 1.5× exponential price growth from the original base rounded up per rank (1/2/3/4/6 each). Alternative uses that same ladder of Final Cores only. Currency/price package remains unadopted, as do prerequisites and rank cap. Documentation/metadata only; no runtime or balance test.

### Q120 regeneration prices recorded November 3 2026

The user selects option 1: each rank costs equal quantities of all seven Core types, Simple through Final, beginning at one each and growing by 1.5× from the unrounded base with each rank rounded up independently. Adopt ceil(1.5^(rank−1)), giving one/two/three/four/six of each type for ranks one–five; total physical bills seven/fourteen/twenty-one/twenty-eight/forty-two. Final-Cores-only alternative not selected; prices of other research remain open. Preserve seven-type synchronized payment and ordinary research cadence. Q121 proposes access after completed victory and Mineral Regeneration 2, versus after first Final Core production and that same project. No access/cap decision is inferred. Documentation/metadata only; no runtime or payback test.

### Q121 regeneration availability recorded November 3 2026

The user selects option 1: completed victory research plus Mineral Regeneration 2 are both required for the first endgame regeneration rank. Earlier ordinary Mineral Regeneration Rate ranks remain optional; no modal acknowledgement gate is added. Preserve first-Final-Core global transport availability and do not extend this victory requirement to other endgame projects. Q122 proposes no maximum rank with the adopted linear benefit/exponential price, versus ten ranks capped at eleven times the ordinary-researched passive rate. Cap choice remains open. Documentation/metadata only; no runtime or unlock test.

### Q122 unlimited regeneration ranks recorded November 3 2026

The user selects option 1: no maximum rank for the separate endgame regeneration line. Preserve Q119 linear baseline gains, Q120 all-seven-Core exponential prices and Q121 victory/Mineral Regeneration 2 prerequisites. Main regeneration rules are complete on paper; content integration, compatibility, performance and sustainable factory payback remain unverified. Q123 returns to Efficient Landfill, proposing total unstarted-hole Stone cost max(1, ceil(original base × 0.9^rank)); alternative 0.8^rank. A 250-Stone example yields 225/203/183 versus 200/160/128. Neither discount/minimum nor partial-fill handling, research bill or cap is adopted. Documentation/metadata only; no runtime or balance test.

### Q123 Efficient Landfill reduction recorded November 3 2026

The user selects option 2: 20% compounded Stone reduction per rank, calculated from the original whole-hole requirement and rounded up with a minimum total of one Stone. Adopt max(1, ceil(base × 0.8^rank)), giving 200/160/128 for a 250-Stone example; preserve natural/depletion base differences and avoid floating-point extra units. Q124 proposes recalculating the whole total and crediting already-consumed fill (100 more in a 250-base/100-consumed/rank-one example), no refunds and normal ready-to-clear behavior; alternative discounts only remaining fill (120 more). Partial policy, research prices, cap, prerequisites and legacy migration remain unresolved. Documentation/metadata only; no runtime or hole-fill test.

### Q124 partial-fill credit recorded November 3 2026

The user selects option 1: recompute each hole’s discounted whole-hole bill and credit all Stone actually consumed as fill. Adopt remaining = max(0, discountedTotal − consumedStone); original 250 with 100 consumed at rank one needs 100 more. If paid fill already meets/exceeds the new bill, make it ready for the normal clear action without refund or automatic removal. Preserve unused buffered/in-flight Stone separately. Original-base/consumed-fill provenance and best-effort legacy migration remain implementation work under Q21. Q125 proposes Efficient Landfill all-seven-Core prices matching regeneration (1/2/3/4/6 via 1.5 growth), versus a linear 1/2/3/4/5-each ladder. Price, availability and cap remain unadopted. Documentation/metadata only; no runtime or migration test.

### Q125 Efficient Landfill prices recorded November 3 2026

The user selects option 1: match regeneration’s price curve, ceil(1.5^(rank−1)) each of all seven Core types from Simple through Final. First five ranks cost one/two/three/four/six each (seven/fourteen/twenty-one/twenty-eight/forty-two physical Cores). Preserve synchronized research payment and independently rounded quotes from the original base. This does not adopt regeneration’s prerequisites or uncapped ranks for Landfill. Q126 proposes Landfill availability after completed victory, versus first Final Core production, without an additional ordinary research project in either package. Access, cap and legacy reconstruction remain unresolved. Documentation/metadata only; no runtime or material/space payback test.

### Q126 Efficient Landfill availability recorded November 3 2026

The user selects option 1: Efficient Landfill research becomes available after recorded completion of victory research, without another ordinary project prerequisite or requiring the victory notice to be dismissed. Selection/payment remains explicit; regular hole filling/clearing and first-production global transport access are unchanged. Q127 proposes stopping at rank forty-five, the last beneficial rank against current normal-content maximum base twenty thousand: rank forty-four costs two Stone, forty-five one, forty-six also one. A shorter ten-rank cap leaves twenty-seven Stone for a 250-base hole and 2,148 for a twenty-thousand-base hole. Neither cap is adopted. This ceiling is not a pacing/payback claim. Documentation/source inspection/metadata only; no runtime or unlock test.

### Q127 cap and recurring-research presentation recorded November 3 2026

The user selects option 1: cap Efficient Landfill at rank 45. They add that recurring endgame research should show only one entry, with levels/costs changing after the previous level completes; apply this across the level’s recurring lines. Record one stable project identity, current offered/in-progress level/quote, no separate future/completed-rank rows and a final completed state at capped rank. Existing repeatables already use project completion counters and dynamic costs; current completion clears selection, so presentation alone does not approve automated purchasing. Added detailed UI requirements and cap checks. Q128 proposes Train rank increments +20 storage/+1 local and Road batch item, versus +40/+2; neither is adopted. Documentation/source/metadata only; no new runtime UI or vehicle implementation.

### Q128 Train rank gains recorded November 3 2026

The user selects option 1: each completed endgame Train rank adds twenty inventory slots and one item to relevant local transfer and inter-map Road batches. Adopt capacity 80 + 20r and both batch limits 4 + r, keeping local 400 ms launches/1,000 ms travel and Road 5,000 ms dispatch. Ranks one/two yield 100/120 storage and five/six-item batches. Preserve stock/room/routing constraints and existing/new/template/all-map application; this is offered capacity, not proof of sustained throughput. Q129 proposes matching the regeneration/Landfill all-seven-Core 1.5-growth ladder versus linear rank-each pricing. No price, unlock or maximum Train rank is inferred. Documentation/metadata only; no runtime vehicle or delivered-rate test.

### Q129 Train research prices recorded November 3 2026

The user selects option 1: recurring Train rank r costs ceil(1.5^(r−1)) of each of all seven Core types, Simple through Final. First five per-type amounts are one/two/three/four/six, totaling seven/fourteen/twenty-one/twenty-eight/forty-two physical Cores. Preserve synchronized payment, independently rounded quotes and one updating entry. Ordinary vehicle prices and earlier throughput effects remain separate. Q130 proposes victory plus ordinary Trains research as prerequisites, versus first Final Core production plus Trains. No unlock/cap is inferred. Documentation/metadata only; no runtime payment or throughput/payback test.

### Q130 recurring Train availability recorded November 3 2026

The user selects option 1: recorded victory-project completion and ordinary Trains research are both required before the first recurring Train rank. No placed vehicle, additional unrelated ordinary project or dismissed victory notice is required; earlier vehicle upgrades/throughput and first-production global transport access remain unchanged. Q131 proposes no maximum Train rank, versus ten endgame ranks yielding 280 storage and fourteen-item batches. No cap choice is inferred. Existing +20/+1 effects, seven-Core price ladder, transfer cadences and single updating entry remain adopted. Documentation/metadata only; no runtime gate or vehicle test.

### Q131 unlimited Train ranks recorded November 3 2026

The user selects option 1: no maximum recurring Train rank. Preserve +20 capacity/+1 local/Road batch per rank, seven-Core 1.5-growth prices, victory plus ordinary Trains prerequisites and one updating research entry. Q132 returns to the two-level fourth/fifth Road-slot line, proposing one/two each of all seven Core types versus two/three each; price/access remain open. Reconciled transport baseline with separately completed NODE-0297: ordinary local/Road 1/2/4 shipments are implemented, while the recurring Train and extra slot lines remain planned. Inspected vehiclePayload and both local/Road dispatch usage, plus implementation-status limits; this turn adds no runtime changes or fresh gameplay tests.

### Q132 advanced Road prices recorded November 4 2026

The user selects option 1: the fourth Road slot costs one of each of all seven Core types, and the fifth two each. Adopt the first two prices of the base-one/1.5-growth convention, totaling seven/fourteen physical Cores per purchase and three of each Core across both. Preserve the two-level single-entry presentation, previous one/two/three-slot progression and shared incoming/outgoing five-per-face maximum. Q133 proposes victory plus existing Road Channels 2 (three slots) as prerequisites, versus first Final Core production plus the same project. Neither access package is adopted. Documentation/metadata only; no runtime research, slot placement or payback test.

### Q133 advanced Road availability recorded November 4 2026

The user selects option 1: advanced Road research requires recorded victory completion plus Road Channels 2, the existing three-slot-per-face project. The fifth-slot level follows the fourth; no ordinary Trains, placed vehicle or dismissed victory notice is required. Preserve earlier Road progression, one/two each of all seven Core prices, two levels/one entry and shared five-slot face cap. Main advanced Road rules are now settled on paper. Q134 proposes pricing each of the three separate one-time relocation projects at one each of all seven Core types, versus three each, with no extra material fee for subsequent eligible same-map moves. No relocation price/access policy is adopted. Documentation/metadata only; no runtime gate, relocation or balance test.

### Q134 one-time relocation prices recorded November 4 2026

The user selects option 1: each of the three separate Resource/Lake/Monster Camp Relocation projects costs one of each of all seven Core types. Buy each once globally; seven physical Cores each and twenty-one across all three, including three Final Cores. Eligible moves afterward within the same map are free of extra material fees. Preserve original resources/state and do not infer cross-map or unique-corner movement. Q135 proposes availability after recorded victory, versus first Final Core production, with no additional ordinary project or placed-feature/notice gate proposed. Shared availability does not grant all three effects in one purchase. Availability and exact movement handling remain open. Documentation/metadata only; no runtime relocation, payment or balance test.

### Q135 relocation availability recorded November 4 2026

The user selects option 1: all three relocation projects become available after recorded completion of victory research. No ordinary research, placed-feature or notice-dismissal gate is added. Keep three independent one-time seven-Core purchases, no extra material fee for eligible same-map moves, state preservation and independent first-production global transport access. Q136 proposes including cleared-Golem mineral reserves along with Forests/normal deposits under Resource Relocation, versus keeping the cleared reserves anchored. Inspected actual defeat conversion into resource kinds and infinite state; scope remains unadopted. Exact movement/linked-object and legacy integration remain implementation/design work. Documentation/source/metadata only; no runtime movement or unlock test.

### Q136 Resource Relocation coverage recorded November 4 2026

The user selects option 1: include cleared-Golem reserves alongside Forests and ordinary valid mineral deposits, preserving resource identity, stock/capacity, regeneration, infinite status and defeated history. The fixed-reserve alternative was not selected. Lakes have their own project; living Golems, Deep Holes, camps and unique corner challenges are outside this resource unlock. No fresh Mythril supply or Wood Golem is introduced. Q137 proposes coupled movement of ordinary camps and linked Tribute boxes versus independent repositioning; neither policy is adopted. Inspected Tribute ownership and creation; documentation/metadata only, no runtime relocation test.

### Q137 camp and Tribute movement recorded November 4 2026

The user selects option 1: move an ordinary Goblin/Dwarven Camp, Village or Kingdom and its existing linked Tribute box together by the same displacement, preserving relative placement. Reject the whole move if either footprint is invalid; move a camp alone if it has no box yet. Preserve IDs, stock, suppression/AP credit, timers and connections; grant no rewards or reset. Deduplicate group selections and recompute encroachment. Independent repositioning was not selected. Q138 proposes moving a Lake alone with connections retained versus automatically carrying its directly connected Intakes; neither policy is adopted. Inspected current connection-driven Intake production and two-Intake limit. Documentation/metadata only; no runtime relocation tests.

### Q138 Lake movement recorded November 4 2026

The user selects option 1: moving a Lake leaves connected Intakes in place and preserves connections. Players can explicitly group-select Intakes when wanted; automatic inclusion was not selected. Preserve identity, Water stock, progress, transfers, same-map scope, existing two-Intake limit and connection-based production. Intakes remain Production nodes. Q139 proposes one of all seven Core types for global Storage/Inventory access versus retaining the current two of each of the six earlier types. Neither price is adopted; access availability remains first Final Core production, not victory. Documentation/metadata only; no runtime movement or payment test.

### Q139 global transport access price recorded November 4 2026

The user selects option 1: Autonomous Logistics access research costs one each of all seven Core types, seven physical Cores including one Final Core. Keep first-production availability independent of victory and initial global limits of one Storage and one Inventory. A Core spent on victory cannot also pay this bill. Preserve research identity and compatible progress in later integration; runtime pricing remains pending. Q140 proposes matching the shared seven-Core 1.5-growth ladder for both separate placement lines versus retaining fifty-each six-Core bases. Neither recurring price is adopted. Inspected existing gains and prices; documentation/metadata only, no runtime payment or balance test.

### Q140 global placement prices recorded November 4 2026

The user selects option 1: Storage Placement Capacity and Inventory Placement Capacity each cost ceil(1.5^(rank - 1)) of every Core type, Simple through Final, per rank. First five per-type quotes are one/two/three/four/six; total bills are seven/fourteen/twenty-one/twenty-eight/forty-two physical Cores. Projects remain separate and each rank adds one global placement of its own type; buying both requires two bills. Preserve the single updating entry per line and existing gains, limits and prerequisites. Runtime pricing remains pending. Q141 proposes the same ladder for separate Storage/Inventory connection projects versus retaining forty-each six-Core bases. Neither connection price is adopted. Documentation/metadata only; no runtime payment or balance test.

### Q141 global connection prices recorded November 4 2026

The user selects option 1: Storage Connection Capacity and Inventory Connection Capacity each cost ceil(1.5^(rank - 1)) of every Core type, Simple through Final. First five per-type quotes are one/two/three/four/six; the lines remain independent purchases and each rank adds one permitted connection per node of its own type. Keep Inventory-to-Filter destination rules, existing gains, rank limits, prerequisites and one-entry display. Runtime pricing remains pending. The user asks how many questions remain; scope the current pass to three closeout topics (Foundry processing, corner input buffers, optional QoL scope), with waste calibration and victory-copy review deferred. This boundary is an assistant work plan, not user adoption of new mechanics. Documentation/metadata only; no runtime payment or balance test.

### Q142 Foundry processing recorded November 4 2026

The user selects option 2: complete immediately once the full 3,000-each Circuit B/Sealed Frame/Mythril Gear batch and output space are available. Debit inputs and credit one component atomically; no extra sixty-second timer or active timed batch. Preserve the ten-component box, blocked stock and save/load conservation. Q143 proposes one-recipe Foundry storage plus 100-unit buffers at the other corners versus two recipes plus 1,000-unit buffers; neither package is adopted. Two closeout topics remain. Documentation/metadata only; no runtime conversion or balance test.

### Q143 corner input buffers recorded November 4 2026

The user selects option 1: Foundry input storage holds one recipe, 3,000 of each required part in separate ingredient reservations (9,000 parts total). Alpha holds 100 bots total, Reclamation 100 mixed waste items total, and Grove 100 incoming growth units. AP, waste credit and cumulative growth meters stay separate from delivery-buffer capacity. Preserve ten-component boxes, each corner's prior full-output behavior, surplus carry and normal routing; no new processing delay/rate cap. Reserve receiving space for in-flight deliveries. The larger-capacity alternative was not selected. Runtime implementation and throughput validation remain pending. Q144 is the final scope question, proposing deferral of optional additions versus prioritizing two or retaining all six for later design; none is adopted.

### Q144 QoL deferral recorded November 4 2026

The user selects option 1: defer all six extra QoL candidates until initial endgame playtesting. No candidate effects or prices are adopted. The bounded design interview is complete; waste calibration and victory-copy review remain deferred. The subsequent request authorizes implementing the agreed chat scope locally and pushing it to Git.

### Implementation clarification recorded November 4 2026

The user explicitly selects temporary use of the documented provisional recycling-value Reclamation model so the ending can operate before factory-waste measurements. This does not settle the final average-factory quota. The existing deployment checkout identifies bookskaboo/bookskaboo.github.io as its actual Git remote; an earlier bookskaboo/node guess was corrected from that evidence. Implementation is prepared on a separate branch with only NODE-directory changes. See document 20 for actual runtime scope and validation limits.
