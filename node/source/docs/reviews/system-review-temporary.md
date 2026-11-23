# Temporary system review register

[Documentation hub](../README.md) · [Current systems](../systems/README.md) · [Primary history](../changelog/README.md)

Working issue queue from the November 18, 2026 document review. New-world implementation and related reference corrections completed November 19 (NODE-0608) are recorded below; unrelated tooling, policy and validation work remains open. The review itself did not implement gameplay. The original findings remain dated evidence.

## Live game audit review

The separate [NODE Live Game Audit and Review Page](https://chatgpt.com/space/page_e7453b10ac2c81919d88f5c40ab191c5) owns the new live-release audit queue recorded in NODE-0764. It contains eleven prioritized findings, five optimization and organization proposals, reproducible evidence and verification limits. Save-slot protection (NODE-0766), fresh Mining Drill template payments (NODE-0767), automatic autosave recovery with portable files (NODE-0768), dialog keyboard protection (NODE-0771), funded Unknown Device recovery budgets (NODE-0775), world-specific Mythril guidance (NODE-0778), accurate Road maximum-rate display (NODE-0783/SR-10), historical compiler retirement (NODE-0786/SR-02), obsolete benchmark retirement (NODE-0788) and current-reference reconciliation (NODE-0790) were approved and implemented. The shipped safeguards and current-reference/tooling corrections are now verified live in a8a8d12 (NODE-0835); [publication receipt](../../outputs/node-refactor-preflight-2026-11-21/publication-receipt.json). The mod recovery control (SR-15) is deferred to a separate full mod-page review (NODE-0784). The eleven primary audit findings now have review outcomes; optimization proposals and the separately noted preference-storage/Build-copy follow-ups remain for review. Whole-world multi-map performance coverage stays open under SR-20; the retired benchmark is not being repaired. Separate preference-storage hardening is outside the approved autosave fix. SR-02, SR-10 and SR-15 were independently reconfirmed and retain their existing IDs. Earlier entries below remain dated review evidence rather than a fresh statement that every recorded mechanic is still current.

The code-organization opportunity has an adopted targeted-extraction guideline and a [standalone execution plan](../master-plan/07-technical-design.md#standalone-code-organization-refactor-plan) prepared in NODE-0793. Its baseline and Road-direction pilot are complete locally (NODE-0817), followed by Phase 2 transport ownership (NODE-0819) and Phase 3 factory command planning (NODE-0823); Phase 4 UI/renderer coordination (NODE-0829) and Phase 5 lifecycle operations/final integration (NODE-0831) complete all six phases, now verified live under NODE-0835. Their [evidence](../../outputs/ui-lifecycle-refactor/README.md) retains startup/disposal and live-state contracts, original-source comparisons and isolated browser checks. Serial renderer samples showed host variation without a consistent refactor regression; the open whole-world performance gap is unchanged. The [pilot evidence](../../outputs/road-command-refactor/README.md) retains the dependency map, recoverable snapshots, baseline factory sample and before/after contract checks. The [transport evidence](../../outputs/transport-refactor/README.md) retains three independently verified extraction slices, original-engine comparisons, lifecycle regressions and current owner/invalidation rules. The [factory command evidence](../../outputs/factory-command-refactor/README.md) retains read-only planning boundaries, four frozen original-engine comparisons, lifecycle/history regressions and isolated placement/wiring/movement/decommission-Undo browser checks. The shared layout-reset fix remains shared. The focused interface-update optimization is implemented and verified live (NODE-0798): closed Inventory consumers no longer scan the world, and Save / Load caches its autosave preview with explicit write, browser-event and reopen invalidation. Both engine subscriptions remain because their consumers still require updates. Verification and its limits are retained in [the interface optimization evidence](../../outputs/interface-update-optimization/browser-observations.json) and on the audit Page. Transport performance follow-up proposals and optional-screen loading remain for review; that optimization did not change undo history or execute the standalone refactor plan.

Undo/save profiling is complete (NODE-0801): [declared factory copies and measurements](../../outputs/undo-save-profile/README.md) show bounded fifty-checkpoint retention, source/archive preservation and successful native quota-failure recovery. The user adopted retaining the current fifty-checkpoint behavior and deferring a byte-budget or history-representation redesign (NODE-0802). Revisit only if slower-device testing or larger current factories demonstrate a problem; manual-save phase profiling remains a possible separately scoped task. Transport follow-up proposals and optional-screen loading remain unresolved.

Bounded transport/queue profiling is complete (NODE-0808): [declared workloads, phase attribution and allocation samples](../../outputs/transport-profile/README.md) preserved source/archive hashes and identical baseline/profiled outcomes, with controlled conservation, FIFO and reservation checks. The approved per-evaluation recipe-producer lookup is implemented and verified live (NODE-0815), retaining recovery rules and matching the old outcomes. Its [paired timing comparison](../../outputs/recovery-recipe-index/README.md) shows reduced periodic recovery cost in the late layout. Obstruction-signature/index work remains a separate pending follow-up; no queue rewrite or cross-phase cache overhaul was implemented. Optional-screen loading also remains unresolved; the audit Page owns these decisions.

Local evidence is retained in [the audit output directory](../../outputs/live-audit-2026-11-21/). The [live verification](../../outputs/live-audit-2026-11-21/live-verification.json) binds the audit to release c4284d4; [isolated reproductions](../../outputs/live-audit-2026-11-21/reproductions.json) distinguish observed defects from proposed fixes. Record later decisions and implementation in the primary changelog and update the Page instead of starting another queue.

## Player enjoyment audit

Recorded under NODE-0799. This is a current-local-source audit against the fourteen enjoyment criteria discussed with the user, followed by five factory-game priorities. It complements the correctness audit above; it does not replace its findings or reopen settled design choices. Review one criterion at a time, following the current cursor below. Dispositions distinguish approved testing from unresolved proposals; this audit authorizes no gameplay changes.

### Expanded discussion format

Under NODE-0841, the user requested discussion of every item with good/weak categories and concrete improvement plans. Revisit E01–E14, then the five factory priorities, one at a time. For each, identify strengths to preserve, confirmed weak implementation or design opportunities, unresolved evidence, a specific improvement/validation plan and its success check. Distinguish an authored plan from an approved feature and executed result. Existing E01–E11 decisions remain intact: do not re-ask their approvals. The previous unanswered E12 presentation question is set aside until its expanded discussion; no answer or keep/change decision is inferred. E01 implementation is now adopted under normal gates; the user deferred a separate player-test mode and requested moving on to E02, then temporarily redirected work to this adoption. Resume expanded E02 after implementation; do not re-ask the already approved machine-versus-upgrade comparison.

### Scope, evidence and ratings

The baseline is the local unmodded implementation, including character Upgrades, banked Map Points, terrain, guarded deposits and seventeen Landmarks. Existing/legacy worlds and applied-mod factories can expose different mechanics. Local safeguards and interface optimizations recorded through NODE-0798 are included; they are not assumed published. No live-site comparison or new browser session was performed for this audit.

Ratings describe implementation support for an enjoyable experience, not measured player enjoyment: **0** absent, **1** weak, **2** working foundation with material gaps, **3** strong structural support, **U** insufficient experience/balance evidence, **N/A** optional for the current promise. A 3 is not proof of fun or optimal balance. Confidence concerns the stated finding, not whether a player will enjoy it. There is no aggregate score. Observe player intention, choices, frustration, satisfaction and ability to stop; time played alone is not the enjoyment measure.

Research basis: [Ryan, Rigby and Przybylski's four studies](https://selfdeterminationtheory.org/SDT/documents/2006_RyanRigbyPrzybylski_MandE.pdf) associate competence, autonomy and relatedness with enjoyment; [GameFlow](https://doi.org/10.1145/1077246.1077253) organizes enjoyment heuristics around goals, feedback, challenge, skills, control, concentration, immersion and social interaction; [Malone](https://onlinelibrary.wiley.com/doi/10.1207/s15516709cog0504_2) discusses challenge, curiosity and fantasy. [LeBlanc's design framework](https://8kindsoffun.com/) distinguishes several kinds of fun. [GameFlow Affordances](https://researchportalplus.anu.edu.au/en/publications/gameflow-affordances-towards-a-tool-for-designing-gameful-experie/) moves toward broader opportunities for enjoyable experiences. The following rubric, ratings, factory-specific interpretations and suggested acceptance tasks are this audit's synthesis, not a validated research instrument.

Fresh verification: **68 tests passed across eight explicitly selected current-tree files**, zero failures/skips. [Raw results](../../outputs/enjoyment-audit-2026-11-21/focused-tests.json) cover local production explanations, research shortage status, queues, fresh template work, dialog focus, learned hints and banked-point fixtures. An initial path-filtered invocation also discovered eleven preserved-release tests; the final run explicitly excludes `.artifact-work` and `outputs`, and only the final current-tree result supports this count. Engine tests and synthetic Upgrades fixtures establish contracts, not human comprehension, rendered accessibility, current campaign feasibility or enjoyment. No new tests, gameplay source, saves, balance rules, audio integration or deployment were changed.

### Criteria overview

| ID | Criterion | Rating | Finding | Confidence |
| --- | --- | --- | --- | --- |
| E01 | Clear purpose | 2 | Assignment, next character upgrade and reactive hints give direction; independent comprehension needs checking | Medium |
| E02 | Meaningful choices | 3 | Factory location, freight, scaling, optional upgrades and resource use create tradeoffs | High for mechanics; optimal-strategy diversity untested |
| E03 | Agency | 3 | Player controls layouts, recipes, routes, research order and expansion | High for mechanics |
| E04 | Appropriate challenge | U | Difficulty changes with geography and supply constraints; target-player challenge is unmeasured | Low for challenge fit |
| E05 | Learning and mastery | 2 | Five practice lessons and saved clues support learning; later-system teaching and transfer remain open | Medium |
| E06 | Clear feedback | 2 | Local shortage/blockage explanations exist; research-to-upstream diagnosis is incomplete | High |
| E07 | Satisfying progress | 2 | Real Core payments, robot assembly and unlocks show accomplishments; value and payoff timing need playtests | Medium |
| E08 | Curiosity and discovery | 3 | Hidden sectors, terrain, Landmarks and Unknown Device support investigation | High for mechanics; discovery appeal untested |
| E09 | Variety and development | 3 | Fluids, suppression, mixed output and four corner tasks introduce distinct problems | High for structural variety |
| E10 | Experimentation and recovery | 2 | Undo, isolated practice, payment retention and save/recovery safeguards support trying ideas | Medium |
| E11 | Comfortable control | 2 | Layout tools, travel and dialog protection help; precision/accessibility/distributed-scale limits remain open | Medium |
| E12 | Absorbing presentation | 2 | Shared visual language, robot progression and dry voice are established; campaign audio remains absent | High for integration status; subjective appeal untested |
| E13 | Expression and ownership | 3 | Free factory layout, groups, templates and mod support permit personal approaches | High for mechanics |
| E14 | Connection | N/A | Single-player is the current promise; multiplayer is not a requirement | High for scope |

### E01 Clear purpose

**Criterion:** the player can state a goal they care about and identify an available next action without being forced into a layout.

**Current support:** the assignment explicitly asks the junior AI to use world resources, manufacture Cores and upgrade itself. Upgrades presents one next character upgrade, real payment badges and an always-visible primary thought; learned hints remain browsable. Basics teaches actual Simple Core production and paid research. See [tutorials/guidance](../systems/tutorials-and-discovery.md), [assignment and upgrades](../../src/content/botUpgrades.ts), [hint selection](../../src/ui/researchMilestones.ts) and [HintBrowser](../../src/ui/upgrades/HintBrowser.tsx).

**Concern:** hints such as “The trees look employable.” and “We should probably look around.” intentionally favor dry suggestion. They do not by themselves establish whether a newcomer can identify the action, its interface location and the reason to take it. The Upgrades character tooltips explain benefits; absence of permanent expanded details is an adopted choice, not a newly discovered defect. This is a comprehension hypothesis, not a confirmed copy failure.

**Selected approach:** test current guidance before changing it. At fresh Home, after Basics and at first Exploration, ask the player to name their goal, explain its benefit and demonstrate the next action; record requests for outside help and wrong turns. A useful acceptance task is successful independent action at each checkpoint, allowing deliberate self-directed alternatives. If a checkpoint fails, specify a contextual literal action beside or behind the existing hint without prescribing factory placement. Preserve the adopted voice and compact Upgrades layout. **Disposition: test-first approach approved (NODE-0803); participant testing pending.** The 2/3 structural rating remains provisional. This is not a passed comprehension test or authorization to rewrite guidance.

**Prepared observation tasks:** use a newcomer who has not read this audit or received an explanation of the expected actions. Use the same neutral prompt, “What would you do next, and why? Show me.” Present one prompt at a time, record the answer before assisting, and allow normal in-game help. Record any facilitator hint separately; a coached completion is not independent success.

| Checkpoint | Setup through ordinary play | What to observe |
| --- | --- | --- |
| Fresh Home | Fresh isolated campaign before Basics; preserve any existing player campaign | Whether the player finds a goal and a usable first action from the welcome, assignment and current hints; distinguish choosing Learn to Play from being unable to proceed |
| After Basics | Complete the ordinary practice lesson and return to that campaign | Whether the player transfers the production/research lesson to Home without tutorial placement targets; document their chosen next action and benefit |
| First Exploration opportunity | Reach Exploration eligibility through ordinary campaign production | Whether the player understands research funding, the banked Map Point, activation and travel as the opportunity becomes available; observe each step without explaining the sequence first |

Retain seed, current rule/version identifiers, viewport/input device, prior factory-game experience, hint/help use, the player's own explanation, attempted action, wrong turns, outside assistance, elapsed game time, resource totals and interaction versus waiting time. Before browser work follow the browser/build guides and preserve the existing game. A self-directed useful alternative counts; the observer's preferred layout is not an answer key. Source/automated checks can verify visible hints and triggers but cannot substitute for this participant evidence. No participant session has been run for this decision.

**Expanded discussion — clear purpose:**

| Category | Assessment |
| --- | --- |
| Good: preserve | A concrete personal assignment ties world resources and Core production to robot upgrades. One next character upgrade, paid/required Core badges, learned/reactive hints and actual first-Core practice provide direction and milestones. |
| Weak design opportunity | Some supporting thoughts are evocative rather than literal next-action instructions. The current HintBrowser presents text and previous/next controls, without an action that opens the relevant Build/research/recipe/map destination; milestone definitions already carry action metadata. This is an observed presentation limitation and potential improvement, not proof that players cannot proceed. |
| Unproven: validate | Independent goal comprehension, ability to find the appropriate control and perceived benefit have not been demonstrated by a newcomer session. Missing permanent expanded project details is an adopted presentation choice, not a defect to reverse. |

**Concrete improvement plan:** retain the already approved Home/after-Basics/first-Exploration tests and current wording until their results. Classify each failure as unclear goal, difficulty locating the control, unclear benefit, or production/transport diagnosis (the latter stays SR-16). If the goal is understood but the control cannot be found, a candidate is optional contextual navigation opening the relevant available panel/entry while leaving factory strategy to the player. For example, an Exploration thought could lead to the available Exploration project; the player still chooses research and frontier destination. If the instruction itself is misunderstood, revise only that failed instruction or add short on-demand factual help. Explain an unclear reward using the existing promotion/benefit surface rather than restoring permanent expanded details by default. Re-test the same failed checkpoint for independent action and correct explanation, without facilitator coaching. Preserve the dry voice, existing layout/agency and hidden discoveries.

**Original planning question: resolved by the reviewed prototype and subsequent adoption.** Optional research navigation and explicitly matched lesson invitations are the accepted direction; the prior conditional-preference question is no longer open. The later explicit adoption authorizes the reviewed runtime work; it does not claim a human comprehension result. Navigation uses currently valid, discoverable targets rather than blindly following stale learned-hint text.

**Interactive review requested and prepared (NODE-0843):** the user asked to see the idea in a test page before choosing. The [isolated hint comparison](../../outputs/hint-navigation/index.html) provides Current/With navigation and three examples using actual shared destinations, with Show me in the existing arrow row. [Usage/evidence](../../previews/status-page/README.md#hint-navigation-comparison) covers eligible targets, no automatic queue/payment, return focus and desktop/narrow checks. This request authorizes the prototype only; conditional priority, participant testing and main-game adoption remain unresolved. Stay on expanded E01 while the user reviews the page; do not advance to E02 or re-present the earlier test-first question.

**Prototype feedback applied (NODE-0844):** the user likes research shortcuts and finds map/node manipulation shortcuts unhelpful. The [updated comparison](../../outputs/hint-navigation/index.html) now renders Show me only for eligible research thoughts; recipes, map/sector, Build/node actions and stale/unavailable destinations omit it. Exploration, Assembler and Road examples focus real projects without automatic queue/payment; Forest and Simple Core examples retain clues without an action. This settles the prototype's research-only direction and supersedes its mixed-destination scope. The earlier broader conditional-remedy question is no longer being asked. Participant tests and main-game adoption remain pending, and the user is still reviewing expanded E01.

**Associated tutorial refinement (NODE-0845):** the user suggested opening the matching tutorial modal for some early clues. The [preview](../../outputs/hint-navigation/index.html) now maps explicit Basics-covered extraction/production actions to its lesson dialog, retaining research-card shortcuts and omitting unsupported direct manipulation. Forest and Simple Core demonstrate the dialog and optional real separate practice; opening never auto-starts. Practice Exit and modal close return to the same hint/focus. This refines NODE-0844 with a known-tutorial exception; it does not approve campaign integration or replace pending newcomer tests.

**Invitation refinement (NODE-0846):** the user rejected the formal/interrupting modal wording and requested a casual dry invitation and outside-click dismissal. The preview now uses one short invitation, Not now/Start Basics, lighter compact treatment and backdrop dismissal that returns to the same hint. Matching tutorial/research rules and separate practice remain. This is preview iteration during E01; no main-game adoption or participant validation.

**Complete ordered hint prototype (NODE-0849):** the user requested every hint and an expansion suggestion, preserving the existing order. The [page](../../outputs/hint-navigation/index.html) now covers 48 entries and 60 live situations, beginning at Your assignment. The previously omitted A useful detour follows Exploration; all earlier relative order remains. Each has a recommendation, reason and proposed teaching expansion. Research/upgrade focus, relevant existing optional tutorials and deliberately omitted shortcuts are distinguished from unimplemented lesson ideas. No campaign integration or new-lesson scope decision is implied; expanded E01 and participant tests remain pending.

**Newer implementation presentation and preview exception (NODE-0851):** the user requested the latest Map upgrades version, constructed as an implementation preview and unlocked for start-to-end inspection. The page now uses the three tabs, cumulative survey bills and combined Exploration/Road; author notes are hidden initially. All 48 hint snapshots are available from the start via bubble arrows and selector, loading each matching paused context as an explicit review exception. Sixty situations have functional research focus or existing optional practice where appropriate. Retained Road guidance offers Expansion instead of a second research bill. Main-game adoption, campaign gates and new-lesson scope remain unchanged.

**User hint cleanup (NODE-0853):** remove AP from Suppression Bot; remove Tree Planter and all seven former entries following You’ve got this; place Complex upgrade before corners/Yin/Yang, with separate Final Core assembly after Yang. Applied to shared guidance and the implementation preview, including exact-known saved-copy reconciliation. The review now has 41 entries and 51 situations and ends at You’ve got this. Research availability and encounter mechanics are unchanged.

**Less explicit title draft (NODE-0854):** the user asked for more hint-like headings. The preview now uses short dry suggestions across the 41 entries, with separate production variants, while keeping literal action labels and original source references under Review notes. This presentation draft preserves all earlier removals/order, body copy, raw destination resolution and campaign history. Full adoption and human comprehension remain pending.

**Title/body repetition refinement (NODE-0856):** the user asked to avoid using the same words in both. Revised nine overlapping preview titles, including flat/flatter and growth. Reviewed all 51 rendered situations; keep ordinary function words natural and preserve bodies, order and action resolution. This remains preview copy rather than main-game title adoption.

**Unlock and final-list refinement (NODE-0857):** remove the individual Yin/Yang hints (former rows 37/38), leaving 39 entries/49 situations ending at You’ve got this. The user also authorized moving Yin/Yang recipes and four-corner reveal to actual Complex upgrade completion (finalCore); Shiny now grants Complex Core only. Shared recipe processing/selection/feedback, map presentation, guidance, upgrade benefits and compatibility are updated locally. Older earned access and partial paid research survive. Preview navigation/Map adoption and human testing remain separate pending work; remain on expanded E01.

**Applied handoff and simulated walkthrough (NODE-0859):** the user authorized the suggested clue/reveal/handoff refinements. Guidance handoff (NODE-0859): give Promotion pending / Complex upgrade its own clue, “The current chassis is starting to feel temporary.” After completion, prioritize missing corner work. When its required pieces are owned but halves are missing, reuse Final Core / A complete picture with “The pieces are ready. The Assembler can introduce them.” and the saved world's first missing-half recipe. Only point to Final Core assembly with “It’s like they fit together.” once both halves are owned. A committed Final Core batch retains that assembly clue after its halves are consumed. Do not restore separate Yin/Yang cards. The author review retains 39 entries and now has 50 situations, including both assembly phases. Owned stock can be distributed; this does not establish delivery to one Assembler. Upgrade benefits and locked-corner details distinguish location revelation from ordinary map expansion. The [27-checkpoint trace](../../outputs/hint-navigation/first-time-walkthrough.json) uses constructed states across all three pairings; the [UI walkthrough](../../outputs/hint-navigation/handoff-browser.json) checks ten visible checkpoints/actions. The operator already knows the implementation: these are developer-informed cognitive and functional checks, not a blind novice simulation, participant results, fun ratings or balance evidence. Found and repaired the premature Final Core target when pieces were owned but halves were missing, plus the backward corner clue while a committed Final Core batch was running. Source/UI checks now agree, and recipe links reach the correct world-matching halves.

**Participant test protocol prepared; execution pending:** at the existing approved Home/after-Basics/first-Exploration moments and the late-game upgrade/corners/pieces/halves/Final/victory checkpoints, first observe without coaching. Ask what goal the player has, what they would do next and what shows that it worked. Record their first intended action, actual action/outcome, wrong turns, recovery, every coaching prompt and setup/interaction versus production waiting time. Check that they distinguish revealed locations from opened routes, discover recipe inspection, find the pairing, deliver both halves and identify separate victory research. World-owned stock is not proof of co-located delivery. Success requires observed uncoached completion and an accurate explanation at each encountered checkpoint. No artificial confusion/attention probabilities or completion-time estimates are asserted. Recipe-guide discoverability remains a hypothesis for real participants. Keep the prior test-first decision and score provisional; remain on expanded E01.

**Quieter copy and map emphasis (NODE-0861):** the user chose softer Area Expansion descriptions while retaining their names, then requested removing the corner-reveal promise from the Upgrade tooltip and highlighting corners on opening the map. Shared source implements both copy choices and persistent expanded-map corner glow after earned revelation; compact unread indicators keep their saved acknowledgements. The [browser record](../../outputs/hint-navigation/map-corner-glow-browser.json) and six-size regression cover the new behavior, with four glows retained after both Escape/reopen and Close/reopen once the overlapping author test menu was collapsed. These changes do not establish newcomer discovery or fun; the E01 participant protocol remains pending.

**Normal-gate adoption (NODE-0864):** the user first deliberately deferred the separate progression-test-mode gap and moved toward E02, then requested implementing the reviewed guidance without the author page's full unlock. The unmodded game renders optional Show me between the hint arrows for currently eligible/selectable research or an explicitly associated unlocked lesson (NODE-0864). Research takes priority. Navigation clears obstructing search, selects the existing view and focuses/outlines the actual card or character Upgrade button, without queueing, paying or enabling it. Basics covers only its seven reviewed opening clues. Eligible scouting clues can offer Expansion; guarded Mythril can offer Monster Camps as a suppression refresher. Iron, legacy Tribute, unsupported production and stale/unavailable thoughts have no invented shortcut. Re-resolve current eligibility at activation rather than following saved text alone. Hint-linked lessons use the compact optional invitation: “We have a tutorial for this. It’s almost suspiciously relevant. Want to try it?” Keep Practice in a separate factory as metadata, Not now as initial focus and literal Start [lesson]. Opening never starts practice. Use the reviewed 400 CSS px width and light backdrop without blur. Backdrop, Not now, Close and Escape dismiss only the invitation and restore action focus; clicks inside preserve it. Explicit Start uses existing separate autosave-disabled practice. Exit/Finish from this entry restores the originating factory/map, earned hint, research view, search, completed toggle, selection, list position and Show me focus. Normal tutorial-library entry keeps its existing behavior. Return context is temporary UI state, consumed on restoration without a save field or grant. Guided practice keeps its project/queue restrictions and omits hint actions. The all-39-hints/50-situations exception remains author-only. The game browses currently eligible and previously earned canonical hint copies; the opening exposes the assignment and existing early alternatives, not the entire catalog. No review selector, unrestricted arrows, stage reset or free research/survey progress enters gameplay. The Map upgrades/combined Exploration-Road proposal remains separate; normal gameplay retains its current projects and destinations. A separate player-test mode was deliberately deferred. Participant comprehension remains unverified. Shared display titles do not rewrite saved clue identities. Browser verified only four opening hints, real research/upgrade focus without activation, invitation Escape/outside dismissal and the same hint/query/view/focus after practice Exit. Tests and source cover the remaining return wiring; no complete lesson replay or participant comprehension result is claimed. E01 remains provisionally 2/3. No additional test mode or worldwide survey integration was adopted. The next expanded criterion is E02; its prior comparison approval remains settled.

### E02 Meaningful choices

**Criterion:** alternatives lead to understandable differences and worthwhile tradeoffs.

**Current support:** fluids favor local processing; solids can travel by vehicles/Roads; earlier Core production competes with upgrades, map purchases and new tiers. Optional efficiency, recycling versus Reclamation, location-bound Landmarks and terrain supply add competing investments. See [progression](../systems/progression-tiers.md), [efficiency](../systems/efficiency.md), [routing](../systems/connections-and-routing.md), [waste](../systems/waste-and-recycling.md) and [Landmarks](../systems/landmarks.md).

**Risk and proposed task:** several choices may converge on one dominant strategy once real costs are measured. Compare at least two player-chosen solutions to the same bottleneck, including their Core/material cost, setup work, delivered output and player's reason for choosing. Three means choices exist; it does not establish equal viability. Do not require every option to perform equally.

**Disposition: comparison approved (NODE-0804); normal-play execution pending.** Compare parallel ordinary machines with an available speed upgrade against the same production shortage. Keep existing mechanics and the provisional 3/3 structural rating. This settles the same comparison under F02; do not ask for it again.

**Prepared comparison:** use comparable checkpoints reached through ordinary play on the same declared seed/rules, preferably in separate normal campaigns so a family-wide upgrade does not also accelerate the parallel-machine case. Preserve successful supply branches. Record comparison order and differences in the factories/stock rather than claiming perfectly controlled human runs. Select a demonstrated processing bottleneck with an eligible, unpurchased upgrade; exclude fixed-speed Rapid/Reclaimer/Unknown Device cases. Let the player explain and choose the expansion/configuration in each approach.

For each approach retain baseline and sustained post-change delivery to the same kind of receiver over declared observation windows after startup buffers settle; machine family/count, selected recipes, upstream supply and downstream room; added nodes/cables/space and build/wiring time; research bill, paid Cores, production waiting and opportunity cost; total resource use and elapsed game time. Family upgrades can benefit several machines, so include those affected producers when discussing payoff. No grants, save injection, acceleration or balance edits. Distinguish an improved bottleneck from congestion merely moving upstream/downstream, and count a failed diagnosis separately from an unattractive investment. Unequal gains do not themselves make the choices meaningless: document the conditions and player intentions favoring each. No outcome or optimal strategy is established until the comparison is run.

### E03 Agency

**Criterion:** players can form intentions, act on them and recognize their consequences.

**Current support:** layouts, recipe selection, routing, queue order, bot-upgrade priority and frontier selection are player-controlled. Banked Map Points separate funding from destination choice; disabling an upgrade returns to queued research while retaining paid contributions. See [controls](../systems/controls-and-factory-layouts.md), [research](../systems/research.md), [map access](../systems/map-nodes-and-exploration.md) and [BotUpgrade](../../src/ui/upgrades/BotUpgrade.tsx).

**Risk and proposed task:** machine gates, physical obstructions and hidden recipes can be legitimate constraints, but unexplained rejection can undermine control. Ask a player to pursue a different research/expansion plan and recover from a rejected connection; check that they can explain the constraint and choose another action. Preserve Unknown Device's deliberately hidden effect.

**Disposition: keep current agency design (NODE-0805).** The user accepted the current approach; no agency redesign or new feature is requested. Retain the provisional 3/3 structural rating. The approved E02 comparison can supply evidence about practical freedom without another decision or a separate agency test commitment. Existing constraint observations remain hypotheses for later play, not confirmed defects. Preserve player control over layouts, recipes, routing, research order and frontier choice, along with paid-progress retention and deliberately hidden Unknown Device behavior.

### E04 Appropriate challenge

**Criterion:** the intended audience finds problems engaging at their preferred intensity, with manageable setbacks.

**Current support:** typed routing, finite reserves, Lake geography, camp suppression, mixed outputs and corner supply create real problems. That establishes complexity, not suitable difficulty. Later rules, prices, terrain, Landmarks and efficiency changes prevent older runs from settling current challenge fit.

**Recommendation:** use current normal gameplay with a newcomer and an experienced factory player, covering multiple declared seeds. Record where they feel bored, stretched, confused or overwhelmed and whether their next attempt improves. Retain phase time/resource/setup/wait data under [SR-18](#sr-18-current-balance-baseline) and sustained-supply evidence under [SR-19](#sr-19-sustained-world-feasibility). Do not increase bills or waiting based on this audit alone.

**Disposition: test current challenge first (NODE-0806); participant execution pending.** The user approved ordinary-play observations with a newcomer and an experienced factory player before price/timer changes. Combine these with the E01/E02 sessions where practical; no additional campaign is required merely to give this criterion a separate report. Retain U until suitable evidence exists. Automation enthusiasts remain the primary audience, with optional teaching for newcomers and recoverable setbacks; this does not reopen audience or setback policy.

**Prepared observations:** after the player has attempted an encountered problem, ask one neutral question about how it felt, then separately ask what they would try next. Sample the first production bottleneck, expansion/freight, fluids, camp suppression and mixed-output blockage as reached through ordinary play. Record the player's words, boredom/engagement/confusion/overwhelm, mistakes, assistance, revised strategy and whether an ordinary repair succeeds. Distinguish unclear information, difficult reasoning and production waiting before suggesting a remedy. Preserve seed/rules, experience, phase/game time, resource totals and setup/interaction/waiting evidence using SR-18/SR-19; retain failed attempts and unfinished phases. A small number of participants/seeds yields exploratory observations, not population-wide difficulty claims. Do not manufacture setbacks with injected states, recruit/message participants without authorization, or treat this prepared protocol as a completed playtest. Carry this challenge-observation decision into F05 without re-asking it; detailed pacing/payback questions remain separate.

### E05 Learning and mastery

**Criterion:** understanding and practice let the player solve increasingly capable tasks independently.

**Current support:** Basics, Logistics, Expansion, Control Groups and Monster Camps use isolated practice with real action/delivery checks; saved hints and the journal retain information. The older simulated-novice report explicitly does not establish human novice transfer. See [tutorial system](../systems/tutorials-and-discovery.md) and [historical novice evidence](../novice-playtest-findings.md).

**Gap and proposed task:** [SR-17](#sr-17-later-system-teaching) already owns contextual fluids, mixed-waste, Dwarven and corner teaching. First test whether a player can reproduce a useful line in their campaign after practice, then diagnose a blocked Controller/Filter stream without a supplied layout. Specify small optional help only for demonstrated gaps; keep Power deferred. Do not duplicate SR-17 as a new feature request.

**Disposition: draft lesson outline completed (NODE-0807).** The user selected Draft the lesson outline. The [five-stage Mixed output and Filters draft](../master-plan/05-interface-and-learning.md#draft-optional-lesson-mixed-output-and-filters) covers guaranteed Controller/Fines output, player-chosen separation, finite storage, required-outlet blockage and actual repair. Proposed invitation, lesson fixture and completion checks remain unimplemented. Keep the provisional 2/3 rating and SR-17 open; authoring the outline does not establish learning or complete later-system teaching. The after-Basics transfer test remains the already approved E01 task. Apply the same teaching disposition within F01 without asking again.

### E06 Clear feedback

**Criterion:** the player can connect an action, the resulting state and its cause.

**Current support:** live cargo, progress, buffers and [production explanations](../../src/renderer/productionVisuals.ts) distinguish missing ingredients, paid batches and output/waste blockage. [NodeInspector](../../src/ui/NodeInspector.tsx) exposes available/required amounts; [research status](../../src/renderer/researchCenterView.ts) names missing Cores. The corrected [Road inspector](../../src/ui/RoadFlowPanel.tsx) labels a maximum theoretical rate, not measured delivery.

**Confirmed gap:** [BotUpgrade](../../src/ui/upgrades/BotUpgrade.tsx) and [ResearchListRow](../../src/ui/upgrades/ResearchListRow.tsx) Core buttons call `onOpenRecipe`; they do not locate the first upstream shortage. This is the existing [SR-16](#sr-16-research-shortage-navigation)/NODE-0332 implementation gap. Local feedback is present; following a multi-map cause remains the burden. Prioritize scoping that already adopted diagnostic feature when implementation is authorized. Test a missing producer, one local shortage, a blocked output and a cross-map delivery shortage, retaining a recipe fallback where evidence is ambiguous.

**Disposition: implementation plan completed (NODE-0809).** The user selected Plan shortage navigation. The [source-grounded plan](../master-plan/05-interface-and-learning.md#shortage-navigation-implementation-plan) specifies project-aware callbacks, a read-only bounded resolver, real connected routes/stock/cargo, multiple-producer ambiguity, cross-map Road constraints, target inspection/return, architecture boundaries and acceptance cases. It preserves missing-producer and uncertain-cause recipe/delivery fallback, current payments/queue and hidden discovery behavior. Implementation/new tests remain pending; keep SR-16 open and the 2/3 structural rating. Apply this same diagnosis-plan decision to F01 without asking again.

### E07 Satisfying progress

**Criterion:** effort produces a visible accomplishment that matters to the player's goals.

**Current support:** paid Core sets visibly assemble the robot, queue progress reflects actual payment and promotions unlock recipes/possibilities. Discovery, working delivery and separately chosen victory provide milestones. See [research progression](../systems/research.md), [robot assembly](../../src/ui/upgrades/robotAssembly.ts) and [ending](../systems/endgame-and-victory.md).

**Risk and proposed task:** visible progress can coexist with low-value spending or long unrewarding waits. At each milestone ask what changed, what the player wants to do with it and whether the effort felt worthwhile. Measure time from an investment to an observable improvement in sustained delivery; do not count buffered startup output as lasting payoff. Optional-upgrade payback belongs to SR-18, not to this structural rating.

**Disposition: milestone payoff checks approved (NODE-0810); participant execution pending.** Add brief observations to the existing E01/E02/E04 normal-play sessions rather than create a separate run. Retain the provisional 2/3 rating. Reuse E02's parallel-machine/upgrade comparison for measured delivery gains and SR-18 for actual investment payback; do not repeat or treat that comparison as completed. Apply the same milestone-value checks within F03/F04 without asking again.

**Prepared observation:** sample representative naturally reached milestones such as an early character promotion, a first working outpost delivery and a later recipe/tool unlock; observe victory only if reached in the declared session. After the player notices the milestone, ask one question at a time: what changed, what they want to do next with it, then whether the effort felt worthwhile and why. Record their answers before explaining any benefit. Note missed or misunderstood rewards, disappointment and deliberate alternatives as valid evidence, not incorrect responses. Reuse the session's seed/rules, elapsed game time, resource totals, setup/interaction/waiting and assistance record; distinguish actual new possibilities from a changed number or portrait alone. Do not interrupt every small completion or force the player to use an unlock. A milestone not reached remains unobserved, and a positive response is not a required outcome. No session, satisfaction result, price/copy change or additional delivery test has occurred for this decision.

### E08 Curiosity and discovery

**Criterion:** players have appealing unanswered questions they can investigate through play.

**Current support:** unknown sectors, seeded geography, seventeen Landmarks, the direction-specific early detour and unexplained Unknown Device create discoveries with mechanical uses. See [Landmarks](../systems/landmarks.md) and [world exploration](../systems/map-nodes-and-exploration.md). First-visit reveal and hidden device effects are deliberate adopted decisions. Proposed global surveys/Map upgrades are author-study work and are not counted as main-game support.

**Risk and proposed task:** discovery can become costly blind scouting; a powerful landmark can also flatten later decisions. Observe whether players voluntarily investigate, understand ordinary landmark uses and find an experiment for Unknown Device. Track discovery expense and subsequent route/production changes across seeds. Keep the mystery; do not add a formula explanation merely to satisfy this checklist.

**Disposition: discovery observations approved (NODE-0811); participant execution pending.** Add these to the existing normal-play sessions, preserving first-visit reveal and hidden effects. Retain the provisional 3/3 structural rating. Reuse E07's milestone payoff questions after a discovery rather than duplicate them. Carry this discovery-observation decision into F04 without asking again; it does not authorize surveys, new landmark hints or revealed Unknown Device recipes.

**Prepared observation:** record what the player voluntarily investigates, including whether they notice/use the early detour hint, choose a frontier for a particular reason, inspect a found landmark, try an experiment without outside help and change their production/routing plan afterward. Observe before offering an explanation; a deliberate choice to postpone scouting or ignore a landmark is valid evidence. Reuse the session's seed/world rules, discovery order, actual map-purchase Core/point costs, setup/interaction/waiting time and resources; distinguish spending to reach a production goal from optional investigative detours. Do not show the participant seeded locations, source descriptions or the Unknown Device formula. Only record discoveries actually encountered; an unreached device is unobserved, not a failed curiosity test. Check the campaign's version/eligibility because legacy worlds do not gain the new landmark layout. Preserve any existing campaign and use declared ordinary-play sessions rather than developer reveals or forced visits. No discovery appeal, scouting-cost balance or player outcome has been established by preparing these observations.

### E09 Variety and development

**Criterion:** later play invites new reasoning rather than only repetition at larger quantities.

**Current support:** early single-stream processing develops into assembly, local fluids, suppression-dependent Mythril, mixed Controller output and four different corner payment tasks. World pairings and geography vary supply planning. See [tier reference](../systems/progression-tiers.md), [camps](../systems/encounters-and-obstructions.md), [waste](../systems/waste-and-recycling.md) and [corners](../systems/endgame-and-victory.md).

**Risk and proposed task:** research can expose a new recipe without changing the player's actual decisions. At each transition record the new decision/problem, a strategy the player changed and the amount of routine rebuilding. A longer bill alone does not establish useful variety. No extra system is recommended before observing the existing sequence.

**Disposition: keep current tier variety (NODE-0812).** The user accepted the existing progression from processing/assembly through local fluids, suppression-dependent Mythril, mixed output and distinct corner tasks. Retain the provisional 3/3 structural rating. Use approved E04 challenge and E07 milestone observations to record whether encountered transitions change the player's strategy and where routine rebuilding feels repetitive; this creates no separate test commitment. Preserve the current mechanics while those results remain pending. No additional system or larger bill is requested by this decision. Apply the same tier-variety disposition within F04 without asking again; specific future issues can be recorded from actual evidence.

### E10 Experimentation and recovery

**Criterion:** trying an idea and correcting a mistake have understandable, acceptable costs.

**Current support:** recorded-command undo, reusable layouts, independent practice, retained research payments, local resource recovery and autosave/export/import safeguards reduce avoidable loss. Recent fixes protect unreadable sibling slots and prevent copied Drills from inheriting paid work. See [controls](../systems/controls-and-factory-layouts.md), [saves](../systems/saves-and-compatibility.md), [resource recovery](../systems/sustainability-and-recovery.md) and NODE-0766–NODE-0768/NODE-0775.

**Limits and proposed task:** undo is not a promise to reverse every consequence of elapsed simulation; extraction rewired to another resource can discard incompatible stock. Long-lived depletion and cross-map rebuilding remain under SR-19. Observe an ordinary mistaken cable, recipe change and failed layout, then ask the player to recover and explain any loss. Respect intentional costs; require no grants or save injection in balance evidence.

**Disposition: keep current recovery design (NODE-0813).** The user accepted the current undo/practice/layout, retained-payment and save/resource recovery approach. Keep the provisional 2/3 structural rating and intentional costs; this decision does not promise that undo reverses all elapsed simulation or that changing an Extractor resource preserves incompatible stock. Use already approved E04 setback observations to record whether the player understands any loss and can repair through ordinary play, without a separate test commitment. Sustained depletion/cross-map rebuilding remains open under SR-19 and participant outcomes remain pending. Apply the same recovery disposition within F02 without asking again; no recovery redesign, new grants or gameplay change is requested.

### E11 Comfortable control

**Criterion:** players can execute intentions without disproportionate interface effort.

**Current support:** 32-unit snapping, groups, copy/paste/templates, recipe copying, shortcut bars, Road travel/focus and shared dialog keyboard scopes reduce repeated work. Fresh focus/template tests support selected contracts. See [controls](../systems/controls-and-factory-layouts.md), [dialog focus](../../src/ui/dialogFocus.ts) and [keyboard boundary](../../src/ui/factoryKeyboard.ts).

**Limits and proposed task:** crowded socket precision, text at 15% zoom, tooltip access and complete accessibility remain [SR-21](#sr-21-accessibility); distributed-world performance remains [SR-20](#sr-20-supported-scale). Recent 600/2,400-node synthetic rendering work supersedes treating the earliest 600-node failure as a current limit, but is not supported-scale certification. Measure time/mistakes to wire, duplicate and repair a crowded line at normal and narrow viewports; separately measure response/save/load/undo under declared workloads.

**Disposition: focused control audit checklist prepared (NODE-0814).** The user selected Prepare control audit checklist. The [twelve-task desktop checklist](../master-plan/05-interface-and-learning.md#focused-desktop-control-audit-checklist) specifies environments, tasks, functional acceptance, evidence and separate comfort observations. It covers crowded wiring, overview versus inspection readability, layout tools, focus/shortcuts, tooltips, clipping/contrast/non-color cues, motion and travel/context. All new execution results remain Not tested. Keep SR-21 open and the provisional 2/3 rating; SR-20 distributed-world performance remains separate. Apply the same control-checklist disposition within F01 without asking again.

### E12 Absorbing presentation

**Criterion:** art, sound, theme and voice reinforce the intended activity and mood without obscuring information.

**Current support:** the charcoal/gold interface, typed material colors, physical transfers, ground/border art, robot silhouettes and dry junior-AI voice form a consistent direction. Reduced-motion handling exists. See [interface/assets](../systems/interface-and-assets.md), [style guide](../node-ui-style-guide.md) and [review notes](../typography-style-review.md).

**Confirmed incompleteness:** recorded-piano cues and the sound-test factory are author artifacts; campaign event playback, saved audio controls, ambience and music remain future work under [SR-22](#sr-22-audio-scope) and the [audio plan](../master-plan/06-art-audio-and-writing.md#audio). Their existence is not main-game integration. Check legibility/non-color meaning through SR-21 and let the user finish the current sound audition; later test repetition and comfort in actual play. Sound is an opportunity, not proof that silent play cannot be fun.

### E13 Expression and ownership

**Criterion:** players can recognize their own choices in what they have built.

**Current support:** free layouts, local processing versus freight, group colors, templates, chosen expansion paths and [data mods](../systems/mods.md) permit personal solutions. [Controls](../systems/controls-and-factory-layouts.md) preserve configuration while copies start fresh work. The game does not need decorative construction to support expression through engineering.

**Risk and proposed task:** economic dominance could narrow practical expression despite formal freedom. Compare two players' solutions to the same objective and ask what each chose for personal reasons, including layout clarity and maintenance. Do not infer that a cosmetic editor or public sharing service is required.

### E14 Connection

**Criterion:** where it is part of the promise, relationships and shared play add enjoyment.

**Current scope:** NODE is [local-first and single-player](../master-plan/01-vision-and-scope.md); no cooperative/competitive multiplayer is counted as implemented. Mod share codes provide a limited sharing mechanism, not evidence of a thriving community. The robot character may support attachment, but this audit has no player evidence for it.

**Recommendation:** retain N/A for required gameplay connection. If community enjoyment becomes a goal, first test whether players want to share factories, strategies or mod codes. Do not add multiplayer or grade the game down for lacking it. Any scope expansion requires its own decision.

### Five factory-game priorities

These are cross-cutting lenses on the same fourteen criteria, not five extra features or an independent score total.

| ID | Priority | Related criteria | Rating | Concrete conclusion and acceptance task |
| --- | --- | --- | --- | --- |
| F01 | Diagnosing problems is interesting | E01/E05/E06/E11 | 2 | Local causes are explained; upstream research-shortage navigation remains SR-16. Ask a player to trace a stopped Core through a multi-map chain, identify the cause and demonstrate recovery. Record searches, wrong turns and outside help; do not measure only whether the output eventually resumes. |
| F02 | Solutions involve choices | E02/E03/E10/E13 | 3 | Scaling, transport, production location and optional upgrades are actual alternatives. Compare two ordinary solutions with full costs and delivered results, plus the player's reasons; check whether at least two remain attractive for different intentions. |
| F03 | Improvements are visible | E06/E07/E12 | 2 | Cargo/buffers/cycles and paid robot hardware show changes. Measure sustained before/after delivery at a fixed receiver after transient buffers settle, and ask the player to predict and explain the change. A higher theoretical maximum alone is insufficient. |
| F04 | Progress expands possibilities | E03/E07/E08/E09 | 3 | Fluids, bots, routing, Landmarks and corner recipes enable distinct activity. Record one newly possible action and a changed plan after representative milestones; verify that players notice the opportunity without prescribing the solution. |
| F05 | Pacing sustains interest | E04/E05/E07/E09 | U | Current complete-campaign pacing, wait quality and efficiency payback are unverified (SR-18/SR-19). Run ordinary gameplay on declared seeds; preserve successful supply branches and separately record active planning/building, interaction overhead, wanted observation and unwanted waiting, together with game time and resource totals. |

The [November 14 peripheral report](../../outputs/first-balance-patch-2026-11-14/README.md) is historical warning evidence, not a current benchmark: matched victories used a flat-five-Simple test mod, excluded manual placement/wiring time, and preceded later systems. Its three default-price route stops do not establish a present softlock. Do not quote those victory times as current session lengths or tune today's game against them without a fresh baseline.

### Review order and acceptance boundaries

Review E01 through E14 sequentially, then F01 through F05 as a cross-check; a decision applying to a linked finding settles that decision everywhere and must not be asked again. Deliberate deferrals advance the review. E14 may be acknowledged as out of scope without a permission question. The active expanded-discussion cursor is **E01**. The earlier disposition sequence reached E12 without an answer; E12 remains unresolved until its expanded turn. E01's guidance test, E02's parallel-machine/upgrade comparison and E04's challenge observations are settled; participant/normal-play execution remains pending. E03 is settled as keep current agency design. E05's optional mixed-output outline is drafted; implementation/testing remains open under SR-17. E06's shortage-navigation implementation plan is complete; code/testing remains open under SR-16. E07's milestone payoff observations are approved; participant execution remains pending. E08's discovery observations are approved, with execution pending and the same F04 decision settled. E09 is settled as keep current tier variety and reuse E04/E07 observations, including the same F04 disposition. E10 is settled as keep current recovery design and reuse E04 setback observations, including the same F02 disposition. E11's focused control checklist is prepared; execution/SR-21 remains pending and the same F01 disposition is settled. Apply E01 to the clarity/comprehension portions of F01/F04, E02 to the same F02 comparison, E03 to the same agency questions within F02/F04, E04 to F05's same challenge observations, E05 to F01's same teaching outline and E06 to F01's same diagnosis plan without asking again; other linked questions remain open. Record actual decisions/deferrals in the primary changelog, then update this working disposition; do not treat a preselected card option as consent.

For implementation triage, the strongest concrete existing gap is SR-16 (diagnosis), followed by SR-17 (later learning). The highest uncertainty to resolve is SR-18/SR-19 (challenge, payoff and pacing). SR-21 (accessible control/presentation), SR-20 (distributed scale) and SR-22 (audio integration) retain their existing scope and separate review. This order is a recommendation, not authorization to implement those batches. No new currency, forced layout, mandatory efficiency gate, added grind, revealed Unknown Device formula or multiplayer is proposed.

## How to use this register

Address one issue at a time. Preserve SR IDs when reordering. For an unresolved policy, present one native question card with current behavior, concrete alternatives and a recommendation. For an already settled rule, do not ask for the same decision again: scope and implement it when implementation is authorized. A deliberate deferral settles the item for now and advances the queue.

Replace an item's **Outcome: pending** with the decision, implementation/deferral state, verification and its permanent NODE changelog ID. Update affected system documents and generated catalogs with the actual change. This file is a temporary work queue, not another history. Once every item has a permanent disposition, archive the completed register and retain a short pointer at this path if history cites it; preserve the supporting evidence and permanent records.

Priorities indicate work order: **P1** protects future releases or content editing; **P2** affects correctness, agreed mechanics, guidance or production decisions; **P3** covers validation and maintenance. An approved feature that is absent from current legacy rules is an implementation gap, not evidence of a new regression. No issue below establishes a live-site defect without checking the served build.

## Queue

| ID | Priority | Classification | Issue | State |
| --- | --- | --- | --- | --- |
| [SR-01](#sr-01-world-rule-persistence) | P1 | Approved implementation prerequisite | Preserve old/new world rules through saves and future exploration | Completed (NODE-0608) |
| [SR-02](#sr-02-historical-content-compiler) | P1 | Confirmed tooling regression risk | Historical compiler would restore obsolete Core recipe gates | Completed locally (NODE-0786) |
| [SR-03](#sr-03-unused-stone) | P2 | Approved implementation gap | Refund unused Stone on completed holes | Completed (NODE-0608) |
| [SR-04](#sr-04-filled-terrain) | P2 | Approved implementation gap | Preserve non-blocking grey filled terrain | Completed (NODE-0608) |
| [SR-05](#sr-05-hole-candidate-budgets) | P2 | Approved implementation gap | Implement five-candidate area and Stone budgets | Completed (NODE-0608) |
| [SR-06](#sr-06-guarded-camp-resources) | P2 | Approved implementation gap | Replace new-world Tribute with guarded deposits | Completed (NODE-0608) |
| [SR-07](#sr-07-intake-only-water) | P2 | Approved implementation gap | Require Intakes for all new-world Lake Water | Completed (NODE-0608) |
| [SR-08](#sr-08-intake-count-upgrades) | P2 | Approved implementation gap | Raise Intake cap from two to three to four | Completed (NODE-0608) |
| [SR-09](#sr-09-coupled-lake-relocation) | P2 | Approved implementation gap | Move connected Intakes automatically with Lakes | Completed (NODE-0608) |
| [SR-10](#sr-10-freight-rate-display) | P2 | Confirmed game presentation defect | Road rate omits postgame payload ranks and mod timing | Road inspector completed locally (NODE-0783); Build copy follow-up |
| [SR-11](#sr-11-pump-relay-reference) | P2 | Confirmed documentation error | Library denies implemented Pump relay behavior | Completed (NODE-0608) |
| [SR-12](#sr-12-mythril-drill-reference) | P2 | Confirmed documentation error | Library advertises a rejected Mythril Drill target | Completed (NODE-0608) |
| [SR-13](#sr-13-postgame-fluid-transport) | P2 | Confirmed documentation overstatement | Shared pool provides a postgame fluid transport exception | Completed (NODE-0608) |
| [SR-14](#sr-14-copper-slurry-storage) | P2 | Policy clarification | Slurry is a fluid but Fluid Tanks reject it | Open |
| [SR-15](#sr-15-mod-recovery-control) | P2 | Confirmed game presentation defect | Mod checkbox promises a removed recovery speed effect | Deferred to separate full mod-page review (NODE-0784) |
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
| [SR-26](#sr-26-depletion-and-exploration) | P1 | Settled scope; validation pending | Only generated holes trigger the exploration gate | Completed (NODE-0608) |
| [SR-27](#sr-27-purchased-but-unvisited-maps) | P1 | Settled payment/access policy; validation pending | Honor completed purchases and let started purchases finish | Completed (NODE-0608) |

Suggested batches: establish SR-01/SR-02 safeguards, preserve the settled SR-26/SR-27 rules before implementing the exploration gate; resolve SR-10/SR-15 presentation defects; correct SR-11–SR-13 and SR-24/SR-25; implement authorized new-world work SR-03–SR-09 behind its version boundary; address SR-14/SR-16/SR-17; then collect the acceptance evidence in SR-18–SR-23. Keep dependencies explicit rather than interpreting this order as approval to implement everything.

## Implementation safeguards and approved world changes

### SR-01 World rule persistence

**Finding:** NODE-0563 and NODE-0595 require guarded camps and revised Lake/hole rules only for newly created worlds, including preservation of old rules on unexplored maps. Current state has encounter/layout and migration versions, but no rule selection implementing this approved boundary.

**Concern and next action:** Add an explicit, saved world-rule selection before enabling those changes. Existing worlds and saves without the new marker must retain legacy behavior; newly created worlds select the new rules only when the feature is delivered. Generation and runtime both need the selection. Do not infer it from load date or whether a sector was already generated.

**Close when:** old/new worlds pass manual save, autosave, import, reload, re-save, undo and later-sector generation checks. Include mod activation/removal so it cannot silently change the world model.

**Evidence:** [compatibility decision](../obstruction-types-and-behavior.md#review-complete-new-world-rules), [initial state](../../src/simulation/createInitialState.ts), [state types](../../src/domain/types.ts), [normalization](../../src/persistence/legacyMigration.ts), [generation](../../src/simulation/worldGeneration.ts). **Outcome: completed locally (NODE-0608).** Implemented saved version selection with legacy fallback and unknown-version rejection. Slot, copied-slot, autosave, JSON import/re-save, mod activation/removal, undo and later-generation regression checks pass.

### SR-02 Historical content compiler

**Finding:** A write-intercepted run of `scripts/sync-progression-content.mjs` produces Hydro/Shiny/Complex recipe gates of `hydraulicAssembly` / `oreSeparation` / `precisionControl`. Current recipes correctly require `hydroCore` / `shinyCore` / `complexCore`. The script reads old analytical inputs and would overwrite `src/content/progression.ts`.

**Approved resolution:** retire the source-writing compiler and retain an explicit compatibility refusal. Preserve exact original compiler/helper/input copies as historical evidence and replace the generated-file header with current content ownership guidance. The safe `docs:systems` documentation generator remains separate and does not rewrite gameplay.

**Close when:** the retired command refuses without source writes for direct execution and import, historical inputs and source are preserved with verified checksums, and the maintained gameplay catalog remains unchanged. A supported content generator or historical round-trip is not part of the selected retirement.

**Evidence:** [compiler](../../scripts/sync-progression-content.mjs), [review transformation](../../scripts/apply-reviewed-production.mjs), [Core projects](../../src/content/coreResearch.ts), [intercepted results](../../outputs/document-review-2026-11-18/results.json). **Outcome: completed locally (NODE-0786), not published.** The command exits with status 1 and guidance, without imports, input reads or writes. Six new regressions verify refusal, file preservation and exact archive checksums in disposable workspaces. The 169 focused and 2,344 workspace tests passed, with two existing workspace skips; TypeScript/local build and documentation checks passed. The catalog body is byte-identical and the original helper/input files remain intact. See the [historical bundle](../../scripts/archive/progression-proposal/README.md) and [verification](../../outputs/compiler-retirement/source-verification.json).

### SR-03 Unused Stone

**Finding:** `clearFilledHoles` cancels/refunds in-flight transfers, then deletes the hole, including buffered surplus. NODE-0571 adopts exactly-once refunds for buffered surplus too, including completion after Efficient Landfill changes the bill.

**Next action:** Implement the settled refund rule for the new world model, preserving the legacy-world boundary in SR-01. Define a valid return destination when the original supplier is gone or full without duplicating cargo.

**Close when:** normal filling, discount-triggered completion and save-load completion conserve unused Stone once, remove supply cables and stop further dispatch. **Evidence:** [hole clearing](../../src/simulation/engine.ts), [reviewed refund rule](../obstruction-types-and-behavior.md#deep-holes), NODE-0571. **Outcome: completed locally (NODE-0608).** Implemented exactly-once buffered and in-flight refunds, including missing suppliers and paused holes completed by Efficient Landfill. Regression checks and engine fixture filling pass.

### SR-04 Filled terrain

**Finding:** completed holes currently disappear. NODE-0569 requires their outlines/borders and uniform grey interiors to remain as buildable, non-blocking terrain; partial holes remain fully blocking.

**Next action:** Add a persistent terrain representation drawn beneath factories, with no active placement or cable obstruction. Coordinate with SR-03 and SR-01 rather than retaining a zero-bill active obstacle.

**Close when:** factories and cables can occupy the completed patch, partial fill never reduces its footprint, and save/load and field expansion preserve the visual result without recharging Stone. **Evidence:** [hole runtime](../../src/simulation/engine.ts), [geometry](../../src/domain/obstructionGeometry.ts), [review](../obstruction-types-and-behavior.md#deep-holes), NODE-0569. **Outcome: completed locally (NODE-0608).** Implemented persistent decorative grey terrain using the same outline, outside the active obstacle graph. Construction/cable, reload and desktop fixture checks pass.

### SR-05 Hole candidate budgets

**Finding:** current generation uses radius-based per-hole prices. The settled replacement sizes/prices five candidates against a 15%–35% area budget and 1,650–13,200 Stone tier budget, then selects one to five candidates with equal probability per count. Omitted cost/area is not redistributed.

**Next action:** implement NODE-0569/NODE-0570 and NODE-0606 behind SR-01, including deterministic integer allocation and persisted selection. In standard 11 × 11 new worlds, select exactly 28 eligible hole maps with tier-3/4 weight four and weight one elsewhere, then generate the approved one-to-five holes inside each selected map. Retain the separate 250-Stone depletion-hole rule and generated-obstruction exclusivity.

**Close when:** the standard-world hole-map quota is exactly 28, tier weighting and reserved-map exclusions match the adopted proposal, candidate bills sum exactly, selected bills retain their shares, counts/subsets follow the adopted policy, and seeded generation survives reload and later discovery without rerolling. Explicitly check Area Expansion and modded reserve/field settings. **Evidence:** [generation](../../src/simulation/worldGeneration.ts), [candidate rules](../obstruction-types-and-behavior.md#deep-holes). **Outcome: completed locally (NODE-0608).** Implemented the exact standard-world 28-map mask, seeded tier weights, five-candidate integer budgets, uniform count/subset and mod-aware Stone pool. Three full seeded worlds and mod reserve/field settings are covered; no normal-play balance claim.

The [28-map distribution calibration](../deep-hole-exploration-simulation.md#distribution-calibration-for-10515-targets) matched 10 / 5 / 15 median map-filling targets in separate validation. NODE-0606 adopts that global quota and tier-3/4 weighting alongside SR-05's settled within-map candidate rules. The design and local implementation are complete; the analytical targets remain conditional rather than guaranteed campaign outcomes.

### SR-06 Guarded camp resources

**Finding:** current settlements still make direct Tribute cargo. The completed proposal replaces new-world rewards with visible guarded resource reserves, suppression-gated extraction and upgraded refill, while existing worlds retain Tribute.

**Next action:** implement the settled proposal after SR-01, including first actual Dwarven extraction unlocking Mythril Refining, full-map capacities, retained reserve/wiring on suppression loss, gated new connections and coupled relocation. Integrate recovery budgets: visible but inaccessible guarded stock must not be counted as currently collectable supply.

**Close when:** all settlement families/subtypes, failed checks, credit/retry, refill upgrades, extraction routes, placement, relocation and both save-rule models pass their checks. **Evidence:** [isolated proposal](../previews/monster-camps/index.html), [proposal model](../previews/monster-camps/model.mjs), [Tribute runtime](../../src/simulation/goblinTribute.ts), [recovery budgets](../../src/simulation/progressionRecovery.ts), NODE-0558/NODE-0559/NODE-0561–NODE-0563. **Outcome: completed locally (NODE-0608).** Implemented guarded camp deposits, all camp rates/multipliers, suppression pause/resume, actual-extraction Mythril unlock, recovery exclusion and paired movement. Regression and desktop/narrow fixture checks pass; full campaign pacing remains unmeasured.

### SR-07 Intake only Water

**Finding:** Lakes still create their own buffered Water as well as supplying connected Pumps. NODE-0580 requires new-world Lake Water to originate through Production Lake Intakes, removing direct generation and consumer/logistics bypasses.

**Next action:** apply the settled rule behind SR-01 while preserving free Water Tools discovery and actual Intake rates/buffers. Do not accidentally remove the implemented relay mode in SR-11.

**Close when:** direct Lake-to-consumer, Tank, router and Dev-source-adjacent bypass cases cannot extract Lake Water under new rules; Intake-first routes work; old worlds retain their routes. **Evidence:** [Lake simulation](../../src/simulation/engine.ts), [socket validation](../../src/simulation/connectionRules.ts), [reviewed access rule](../obstruction-types-and-behavior.md#lakes), NODE-0580. **Outcome: completed locally (NODE-0608).** Implemented Intake-only Water for new worlds while preserving legacy direct output and the existing Pump behavior/rates. Regression and fixture checks pass.

### SR-08 Intake count upgrades

**Finding:** runtime enforces two direct Pumps at every rank. NODE-0578 adopts two at base, three after the upgrade mapped to `fluidLink5`, and four after `fluidLink6`, preserving current Water rates.

**Next action:** derive the permitted count from saved rule model and research. Clarify the displayed upgrade effects while keeping serialized IDs and migrated purchases stable.

**Close when:** the same Lake accepts exactly 2/3/4 direct Intakes at the relevant ranks across all four ports, with unchanged 4/5/6/8/11 Water rates and legacy-world limits. **Evidence:** [connection limit](../../src/simulation/engine.ts), [migration](../../src/simulation/machineEfficiencyMigration.ts), [rates](../systems/efficiency.md), NODE-0578. **Outcome: completed locally (NODE-0608).** Implemented the new-world two/three/four distinct-Intake cap with existing rate progression. Regression and fixture checks pass.

### SR-09 Coupled Lake relocation

**Finding:** current Lake movement preserves cables but leaves Intakes in place unless explicitly selected. NODE-0581 replaces that behavior for new-rule worlds with automatic movement of every directly connected Intake.

**Next action:** collect attached Intakes, deduplicate selected members, translate them equally and validate the whole move atomically. Keep unrelated downstream nodes stationary.

**Close when:** collision, field-edge or cable failure rejects the whole move; IDs, stock, timers and cables survive success/undo/load; legacy behavior remains available. **Evidence:** [relocation plan](../master-plan/17-endgame-research-and-world-reshaping.md), [movement commands](../../src/simulation/engine.ts), NODE-0581/NODE-0595. **Outcome: completed locally (NODE-0608).** Implemented atomic same-displacement movement of directly connected Intakes with Lakes, deduplicating selections and rejecting invalid groups. Regression and fixture checks pass.

## Current presentation and documentation inconsistencies

### SR-10 Freight rate display

**Finding:** the Road panel calculates `12 × vehiclePayload(completedResearch)` and omits Train Freight Capacity rank. At rank two, actual base-interval payload is six items, or 72/minute, while the panel formula reports 48/minute. It also assumes a five-second interval despite supported mod overrides.

**Approved correction:** derive displayed theoretical capacity from the same payload rank and dispatch interval as simulation and distinguish it from measured deliveries. The Road inspector correction is implemented and verified live. Reviewed Build descriptions still quote base Train storage/payload; correcting those descriptions remains a separate copy follow-up outside this approved panel change.

**Close when:** Cart/Truck/Train, multiple postgame ranks and custom Road intervals agree between runtime and presentation, with blocked receiving stock still handled correctly. Update both style references if player-facing copy changes. **Evidence:** [Road panel](../../src/ui/RoadFlowPanel.tsx), [payload](../../src/content/cartUpgrades.ts), [dispatch](../../src/simulation/engine.ts), [results](../../outputs/document-review-2026-11-18/results.json). **Outcome: Road inspector completed locally in NODE-0783, not published.** All 23 new regressions and 106 focused checks passed; the full workspace suite passed 2,333 tests with two existing skips. TypeScript/local build, system catalogs/links and browser checks at 1280 × 720 and 390 × 845 passed. The panel uses actual freight rank and active mod/profile timing, reports Maximum transfer rate and explains stock/receiver limits. Blocked deliveries preserve stock. Build-menu base-only vehicle descriptions remain the follow-up identified above.

### SR-11 Pump relay reference

**Finding:** the new fluids guide describes Pumps as requiring a Lake rather than serving as general fluid relays. Current pass-through routing supports Water/Coolant relay mode. The isolated audit delivered all eight supplied Coolant through a Pump with no Lake; existing regression coverage also switches a Pump from Lake draw to Coolant relay.

**Next action:** correct the fluids and production references to distinguish generation from routing, preserving NODE-0446. This is a documentation correction, not a request to remove working relay behavior.

**Close when:** source-backed explanations cover both modes and their actual socket restrictions. **Evidence:** [fluids guide](../systems/fluids.md), [routing](../../src/simulation/engine.ts), [existing regression](../../src/simulation/playtest.regressions.test.ts), [results](../../outputs/document-review-2026-11-18/results.json). **Outcome: completed locally (NODE-0608).** Corrected the fluid reference to describe the existing direct-Lake draw and material relay modes. Documentation correction only; no relay-rule change.

### SR-12 Mythril Drill reference

**Finding:** the new resource-use and sustainability guides advertise Mythril Drill deposits. The inspector offers only Iron/Copper/Stone and `setMiningTarget` explicitly rejects Mythril. The isolated audit confirms rejection. A legacy type union is not a selectable gameplay capability.

**Next action:** correct the references to the three selectable minerals and describe any retained legacy fields separately. Do not enable a Mythril bypass to make the game match the mistaken text.

**Close when:** all current descriptions agree with UI, engine and NODE-0295 source restrictions; compatible historical material remains described accurately. **Evidence:** [resource use](../systems/resource-use.md), [sustainability](../systems/sustainability-and-recovery.md), [inspector](../../src/ui/NodeInspector.tsx), [engine](../../src/simulation/engine.ts), [results](../../outputs/document-review-2026-11-18/results.json). **Outcome: completed locally (NODE-0608).** Corrected resource/recovery references: Mining Drill accepts Iron, Copper and Stone, not Mythril. Documentation correction only; no Drill-rule change.

### SR-13 Postgame fluid transport

**Finding:** the fluids guide's broad geographic restriction omits global Storage/Inventory. An isolated fixture deposited eight Water at Home and withdrew all eight on the neighboring map through Inventory → Filter → Tank, without Roads. Autonomous Logistics is a post-first-Final-Core access path.

**Next action:** scope mandatory Lake-local production to ordinary pre-global transport and document the postgame shared-pool exception. Retain implemented behavior unless a separate design change is explicitly chosen.

**Close when:** fluids, storage and progression references explain the same boundary and a regression verifies the allowed postgame route plus locked pre-access behavior. **Evidence:** [fluids](../systems/fluids.md), [pool runtime](../../src/simulation/progression.ts), [global research](../../src/content/research.ts), [results](../../outputs/document-review-2026-11-18/results.json). **Outcome: completed locally (NODE-0608).** Qualified the direct solid-only transport rule with the existing post-victory shared-pool fluid exception. Documentation correction only; no fluid-policy change.

### SR-14 Copper Slurry storage

**Finding:** Copper Slurry is classified as a fluid and rejected by vehicles/Roads, but the `FLUID` family accepts only Water/Coolant, so the Fluid Tank rejects it. This split is documented but lacks an explicit current storage-policy decision in the reviewed records.

**Decision needed:** should Fluid Tanks/Pump relay accept all three fluids, or should Slurry retain a distinct storage/routing policy? Recommend one consistent fluid-family rule unless a deliberate gameplay reason justifies an exception; preserve early geographic constraints either way.

**Close when:** choose the policy, align classifier, sockets, recipes, storage descriptions, mods and compatibility checks, and verify Slurry cannot gain an unintended Road path. **Evidence:** [classification](../../src/content/items.ts), [socket family](../../src/simulation/connectionRules.ts), [fluids reference](../systems/fluids.md), [results](../../outputs/document-review-2026-11-18/results.json). **Outcome: pending.**

### SR-15 Mod recovery control

**Finding:** the recipe editor labels `recovery` as “Applies recovery efficiency research,” and the full mod guide advertises recovery efficiency. Current `getRecoveryMultiplier` always returns one: speed now belongs to the operating node, while the flag still identifies/group-lists recovery recipes.

**Next action:** revisit this finding during the user-requested full mod-page review in another chat. Retain the proposed “Recovery recipe” label and “Groups this recipe under Waste recovery. Processing speed follows the machine’s upgrades.” help as an unapproved alternative. Do not restore a second stacking multiplier merely to match obsolete wording.

**Close when:** checkbox/help text, guide and recipe timing agree for flagged/unflagged recipes on the same machine; update both style documents with the copy change. **Evidence:** [editor](../../src/ui/ModEntryEditor.tsx), [timing lookup](../../src/content/efficiency.ts), [mod guide](../mods.md), NODE-0577, [results](../../outputs/document-review-2026-11-18/results.json). **Outcome: deliberately deferred (NODE-0784).** The user chose a separate full review of the mod page rather than this narrow wording change. No player-facing copy, runtime or mod data was changed.

## Guidance and validation work

### SR-16 Research shortage navigation

**Finding:** NODE-0332 adopts clicking a missing Core to find the first identifiable upstream shortage, with recipe/delivery fallback. Current selected-project badges open the Core recipe; no corresponding shortage-navigation path was found in the reviewed implementation.

**Next action:** implement the agreed diagnostic link when authorized, retaining a clear fallback and avoiding prescriptions about factory location.

**Close when:** a local shortage, a cross-map chain and a missing producer lead to correct evidence-backed destinations or fallback. **Evidence:** [adopted design](../master-plan/05-interface-and-learning.md#connect-research-to-the-factory), [research details](../../src/ui/ResearchProjectDetail.tsx), [status](../../src/ui/researchProgress.ts), NODE-0332. **Outcome: pending implementation/testing.** The user requested the [E06 implementation plan](../master-plan/05-interface-and-learning.md#shortage-navigation-implementation-plan), completed under NODE-0809; navigation behavior remains unimplemented.

### SR-17 Later system teaching

**Finding:** the five implemented lessons cover Basics, Logistics, Expansion, Groups and Camps. Agreed contextual teaching also covers fluids, mixed waste, Dwarven supply and corners; its detailed lessons and invitations remain unspecified. The deferred Power lesson does not defer all waste help.

**Next action:** specify small optional factual lessons, beginning with guaranteed Controller Fines and whole-Filter blockage before those rules can strand a newcomer. Keep Power deferred and avoid prescribing a factory solution.

**Close when:** relevant unlocks offer help, skipping it preserves progression, and newcomers can diagnose the stream independently. **Evidence:** [tutorial library](../systems/tutorials-and-discovery.md), [learning plan](../master-plan/05-interface-and-learning.md), [novice dispositions](../novice-playtest-findings.md). **Outcome: pending implementation/testing.** E05 authorized the [mixed-output lesson outline](../master-plan/05-interface-and-learning.md#draft-optional-lesson-mixed-output-and-filters), now drafted under NODE-0807; no new lesson is implemented, and fluids/Dwarven/corner teaching remains separately open.

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

**Close when:** acceptance thresholds and repeatable measurements exist for the supported environment; investigate the observed 600-node failure without assuming its cause, and give custom 21×21 worlds explicit limits. **Evidence:** [active factory fixture](../../previews/active-factory/README.md), [technical plan](../master-plan/07-technical-design.md), [quality plan](../master-plan/08-quality-and-playtesting.md), [retired stress archive](../../scripts/archive/engine-stress/README.md), NODE-0598. **Outcome: pending.** The old engine benchmark is now retired at the user’s request (NODE-0788); its reports remain historical evidence. This closes the obsolete-tool audit finding, not this supported-scale requirement. Whole-world multi-map performance measurement remains open, with a smaller current benchmark deferred until cross-map optimization needs it.

### SR-21 Accessibility

**Finding:** Q17/NODE-0150 commits a focused desktop accessibility audit. Existing labels, responsive checks and reduced-motion styling do not constitute that complete audit or prove keyboard/screen-reader playability.

**Next action:** assess contrast/readability at supported zoom/viewport, non-color state cues, motion control, focus/dismissal, tooltip alternatives and socket/input precision. Record actual findings before adding a broad redesign.

**Close when:** each observed issue has environment, severity and a repeatable acceptance check, with prioritized fixes verified. **Evidence:** [accessibility commitment](../master-plan/05-interface-and-learning.md#accessibility-commitment), [style references](../node-ui-style-guide.md), [UI system](../systems/interface-and-assets.md). **Outcome: pending audit execution.** The user-authorized [E11 checklist](../master-plan/05-interface-and-learning.md#focused-desktop-control-audit-checklist) is prepared (NODE-0814); all twelve new task results remain Not tested, and no redesign or certification is implied.

### SR-22 Audio scope

**Finding:** Q18 adopts effects, alerts, ambience and music with mute/volume controls. Source currently retains a `sound` preference but no dedicated playback system was found. The current system library does not give this committed but unfinished scope its own status section.

**Decision and next action:** retain the commitment with a concrete specification/asset plan, or explicitly defer it in the changelog. Define browser unlock, pause/tab-focus behavior, repetition/mix and visual equivalents before implementation.

**Close when:** a permanent disposition and accurate current reference exist; if implemented, test playback and saved controls. This is not an invitation to commission assets during this review. **Evidence:** [audio plan](../master-plan/06-art-audio-and-writing.md#audio), [preferences](../../src/domain/types.ts), [initial state](../../src/simulation/createInitialState.ts). **Outcome: pending.**

### SR-23 Style reference format

**Finding:** recent style-review entries record structural preservation checks but failed final rendering because packaged LibreOffice was unavailable. This review extracted Word text, including tables, but did not certify page layout.

**Disposition:** the user chose Markdown for both maintained style references. Preserve the Word originals only as archived evidence; the former Word page-rendering requirement is retired. Future updates check Markdown headings, tables and links.

**Verification:** conversion preserves all 290 source paragraphs and six tables; the archived originals retain their source hashes. **Evidence:** [guide](../node-ui-style-guide.md), [review notes](../typography-style-review.md), [conversion checks](../../outputs/style-markdown-conversion/verification.json). **Outcome: resolved by the requested format change; historical Word page layout was not certified.**

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

**Close when:** test Home, sequential depletion, mixed generated/depletion holes, multiple neighboring blockers, zero accessible Stone and saved rule versions. Confirm filling the final generated hole lifts that map's exploration block even while a depletion hole remains. The offline adaptive estimate's median 45,986 Stone excludes depletion and assumes affordable bills; it is not a completion-time or solvability result. **Evidence:** [estimate and selected scope](../deep-hole-exploration-simulation.md#boundaries-to-settle-before-implementation), [recovery](../../src/simulation/progressionRecovery.ts), NODE-0599/NODE-0601. **Outcome: completed locally (NODE-0608).** Implemented generated-only exploration blocking, all four neighboring approaches, multiple blockers and depletion exclusion. Tests verify the final generated fill unblocks entry even with depletion terrain remaining, and recovery cannot bypass a known gate. Whole-campaign Stone feasibility remains a separate balance task.

### SR-27 Purchased but unvisited maps

**Finding:** the engine separates paying to unlock a map from visiting/discovering it. A visit-triggered gate that only blocks new purchases could be bypassed by buying a chain before visiting its holes. Conversely, revoking already-paid access can strand a destination quote or lose the value of Map Points. The new estimate visits immediately and does not resolve this case.

**Settled access (NODE-0602):** honor completed purchases and allow first entry to purchased-but-unvisited destinations despite a newly discovered neighboring generated hole. Keep those map cells enterable rather than disabled/greyed by this gate. Already explored maps remain accessible. Advance purchases can preserve routes; the existing immediate-visit simulation does not measure that strategy.

**Settled funding (NODE-0603):** let a destination purchase with Cores contributed before blocker discovery continue and finish. Preserve the quoted destination, price and contributions through project switching and reload, then unlock that destination and honor first entry. An unfunded quote does not establish an exception. Preserve saved Map Points without treating them as an already purchased destination. The policy questions for SR-27 are settled; do not ask them again.

**Close when:** test paid-unvisited chains, active/paused partially funded quotes, saved Map Points, multiple blockers, entry from every side, save/load and legacy worlds. No paid contribution or point may disappear or be charged twice. **Evidence:** [policy boundary](../deep-hole-exploration-simulation.md#boundaries-to-settle-before-implementation), [map pricing](../../src/simulation/mapExpansion.ts), [quotes](../../src/simulation/researchRuntime.ts), NODE-0599/NODE-0602/NODE-0603. **Outcome: completed locally (NODE-0608).** Implemented completed-purchase entry and started-funding protection across switching/reload. Tests cover unfunded quotes, remaining funding, multiple blockers and spare Map Points without duplicate payment. Buying-ahead balance remains unmeasured.

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
