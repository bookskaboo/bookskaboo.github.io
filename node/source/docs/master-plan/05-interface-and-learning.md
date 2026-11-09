# Interface learning and accessibility

## Current player tools

The interface includes Build, recipe selection and guide, Research and prerequisite navigation, Node Map, discovery journal, inspector, save/load, options and command help. The graph supports panning, zoom, selection, groups, recipe copying, grid alignment, shortcut bars and undo. Production uses motion, shapes and buffer indicators; rejected cable drops have visual feedback.

Research separates active work, guidance under Obligatory hand holding, available capabilities, future projects and completed projects. Future research stays browsable. Configurable machines require a recipe before connections; Basics explicitly teaches Copper Plate selection.

## Learning baseline

**Agreed audience (Q02):** automation enthusiasts, with newcomer support. Preserve satisfying factory problems while teaching controls and rules clearly; evaluate whether newcomers can apply that teaching independently.

Tutorials cover Basics, Logistics, Expansion, Monster Camps and Control Groups. Basics builds a Simple Core from raw resources and spends it on real research. Practice uses an isolated engine and protects the real factory and its save data.

The novice findings are mostly resolved implementation history. N15's expanded waste and Power teaching remains deferred. Q10 removes Power from play until a useful integration is designed, so do not add Power instruction now; assess any waste-teaching need independently. Do not recreate N01–N14 or N16–N22 as new feature requests. Some tutorial coverage is automated or agent-operated; transfer of learning to ordinary Home play still needs human observation.

## Proposed player journey checks

| Moment | What a player should be able to do | Evidence to collect |
| --- | --- | --- |
| First minute | Identify a useful action and manipulate the field | Observe without coaching |
| First Core | Explain the raw-resource chain and where research consumes its output | Repeat on Home after practice |
| First blocked machine | Distinguish missing input from full output or waste | Ask for diagnosis before giving hints |
| First outpost | Activate, travel, establish production and deliver cargo | Observe map and Road mistakes |
| First fluid chain | Understand lake-local fluid production and transport rules | Test at Hydro and later Mesh production |
| First waste chain | Understand secondary outputs and blocked waste buffers | Q32 introduces this at Complex; test with its first waste recipe and available handling tools |
| Late factory | Trace a shared shortage across maps and repair it | Use a stable six-Core network |

These are proposed acceptance checks, not claims of completed human testing. Tutorials should explain rules and controls without prescribing the preferred outpost strategy.

**Agreed later-system teaching (Q16, November 2, 2026):** use optional contextual lessons and help for later systems such as fluids, waste, Dwarven Tribute and corner challenges. Explain controls, rules and factual state feedback while leaving factory layouts and strategies for players to discover. Do not require tutorial completion for progression or prescribe off-Home assembly. Power teaching remains deferred while Power is removed. Specific lesson content, invitations and trigger conditions remain to be designed and tested; no new lessons are implemented by this decision.

Q32 moves the waste introduction to Complex. Shiny help should focus on Mythril supply, fluid-dependent Mesh and competing production branches without requiring waste handling. Offer any future optional waste lesson with Complex tooling; its first explanation must be available before a blocked waste buffer can prevent players learning the system.

Q33 makes baseline Complex waste mandatory; the first lesson should cover its guaranteed stream before introducing Complex-researched, more efficient waste-producing alternatives. Players can skip the lesson, but cannot avoid the underlying standard-production waste requirement.

Q34–Q35 assign the single initial waste stream to Controllers: one Metallic Fines alongside each Controller. Standard Controller/Servo Piston chance wastes are removed in the intended design. Explain this predictable secondary output, waste-buffer blockage and handling before the first batch; introduce additional waste types when researched efficient alternatives arrive. Q36 settles the initial handling path as recycling, described below.

Q36–Q39 adopt one-step Hydro Plant recycling: four Fines plus one Water produce one Iron Plate in ten base seconds, unlocked alongside Waste Bin and Waste Link by Precision Control without extra payment. The first waste lesson should arrive with this access, distinguish buffering from recovery and show where Plates can join existing production. No permanent-disposal behavior is assumed for a Waste Bin. Efficient alternative recipes remain a later research purchase.

### Connect Research to the factory

**Adopted November 7, 2026 (NODE-0332).** Lead with the next milestone the player can act on. When active Research is waiting on a Core, let the player select that Core to jump to the first shortage the game can identify along its supply line. For example, a Hydro Core shortage can lead to an assembler waiting for a Hydro Piston. Select the affected machine and show the missing ingredient with its stored and required counts. If the game cannot identify a shortage, show the Core recipe and the outstanding delivery requirement.

Check the jump on a known missing input, on an existing supply route that crosses a sector border, and with no producer for the missing Core. Verify that a fresh player can find the next milestone when there is no active research. Implementation and player testing are pending. [Playtest notes](../../outputs/live-ui-playtest-2026-11-05-replacement/queued-ui-improvements.txt)

## Accessibility commitment

Some controls have accessible labels and production cues use shape and motion as well as color. The canvas remains a major interaction surface. This is not a completed accessibility audit.

**Agreed milestone scope (Q17, November 2, 2026):** include a focused accessibility audit and prioritize fixes from its findings during stabilization through Complex. Audit text readability, contrast, color-independent cues, motion and input precision for the desktop mouse/keyboard experience. Inspect keyboard reachability, focus, tooltip alternatives and remapping where they affect the findings, without committing to a full interaction redesign.

Record affected actions, severity, reproduction environment and a concrete acceptance check for each finding before sizing fixes. This commitment does not establish full keyboard-only or screen-reader playability, certify compliance with an accessibility standard, or claim an audit has already occurred. The supported viewport and hardware still need definition.

**Audit starting checks:** readable controls at the minimum supported viewport; non-color cues for essential states; no mandatory rapid or precise action without a workable alternative. Q16 settles optional contextual teaching; Q17 commits the focused audit and prioritized fixes. Exact thresholds and the resulting fix list remain to be established.

Evidence: [novice findings and resolutions](../novice-playtest-findings.md), [tutorial stages](../../src/tutorials/tutorialDefinitions.ts), [tutorial runtime](../../src/tutorials/tutorialRuntime.ts), [production visuals](../../src/renderer/productionVisuals.ts), [options](../../src/ui/panels/OptionsPanel.tsx).

Q53 makes the first waste lesson a mixed-output filtering task: show the desired product and waste leaving the same machine port, explain how players separate them and then route waste to buffering/recovery. Teach the cause of a blocked mixed stream with clear item/count feedback. Q53A adopts the existing Filter with selected-item and remainder outlets; exact control wording and lesson steps depend on the remaining behavior specifications. Both filtering and basic recovery must be usable before the first Controller batch. Runtime UI still displays a separate waste port.

Q53B adopts immediate whole-Filter stop when a needed outlet is blocked, with a visible notification on that Filter. Identify the blocked selected-item/remainder outlet and cause when known; details should explain how to restore flow. Use icon/text as well as color, retain the notification while blocked and clear it on recovery without per-tick alert spam. Proposed copy: “Filter blocked — remainder output full. Free space downstream.” Neither side keeps forwarding while stopped; preserve all items.

Q57 clarifies that filtering adds no processing time or independent speed cap. Help should explain that a stopped Filter is waiting for an output path, not working through a sorting countdown. Preserve visible cause/outlet notifications and the distinction between transport travel and instant classification.

Q58 adopts predictable batch sending order: desired product, then that batch's waste, then the next batch. Optional help can show the short Piston/Flux/Flux/Fines example and explain that queued waste must clear before newer product can leave. Filters still add no sorting delay; blocked-output notification explains any stop. This is intended behavior, not current runtime UI.

Q65 preserves insufficient Dwarven bot stock/AP credit while a check fails. Feedback should distinguish available AP from the full requirement and explain that stored supply remains for a later payment; failed suppression still affects Tribute. Q66 adopts immediate retry once a failed check has enough supply, with the next upkeep sixty seconds after payment. Explain that suppression recovery still applies; do not promise immediate Tribute resumption from one payment.

Q69 keeps Dwarven upkeep active while a full Tribute box pauses new Mythril. Full-box feedback should distinguish blocked output from failed suppression and show that upkeep still runs. Q70 adopts scaled Dwarven capacities 100/100/120/216/360/576; display remains to implement, so distinguish design targets from current runtime values.


Q98 extension requires an internal next-Map-Node resource calculation and large congratulatory resource-deadlock modals with escalating dry humor. Show the affected resource, Golem destination and opened route without calculation figures. Draft Show route/Continue actions and four escalation texts are in [rescue design](14-expansion-solvability-and-golem-rescue.md); exact budget placement, pause behavior and simultaneous notices remain open. Q98B adds automatic target-Golem clearance, making the reserve ready for extraction. Rescue applies automatically rather than waiting for approval in the modal.


After Q100A, show Wood in the research budget without presenting temporary Wood depletion as an emergency. Reopen the four-stage achievement/escalation count; Q102 proposes three Iron/Copper/Stone rescue events. Hold the fourth modal draft until a qualifying scope is adopted.


Q106 adopts sequential rescue, fresh checks and successive modals. Q107 rejects additional resource-budget views and keeps the maintained calculation internal. Show only the requested rescue outcome. Wood is counted internally as renewable, without a rescue trigger. No resource-budget placement is planned.


Q107 overrides earlier proposed budget placement: internal failsafe only, with no research/map/HUD resource-budget panel and no diagnostic totals in the rescue modal. Keep the requested dry congratulatory outcome, actual resource, route and reserve information and achievement feedback. No advance warning/approval flow for destruction is introduced.


## Victory presentation (Q112, November 3, 2026)

Complete a selected one-time Research Center project for one Final Core, then show a glowing victory modal. [Victory modal copy and presentation](16-victory-modal.md) provides the requested developer thank-you, invitation to mod, and Factorio/Satisfactory homages. The single clear Continue playing action keeps the same world and progress; preserve pause state and restore focus. Save acknowledgement so later Cores and ordinary reloads do not repeat the celebration. Use a labelled, keyboard-contained dialog, reduced-motion styling and a scrollable message with reachable Continue on small screens. Standalone preview created; rendered behavior and game integration remain unverified.


## One updating entry per recurring endgame research line (Q127)

**Adopted November 3, 2026:** use one stable project entry per recurring endgame research line, with the current level and current cost. Do not show a separate card for each future level. While a level is available or in progress, show that level, its benefit, quoted Core requirements and contribution progress. The completed-level count can appear on the same entry.

After completion, commit the completed-level count, then refresh that same entry to the next level and its cost. Example: Landfill has two completed levels; its entry offers Level 3 / 45 for three of each of the seven Cores. After Level 3 completes, the same entry offers Level 4 / 45 for four each. The prior level does not remain as a second row. Price/progress must not advance while a level is still being paid.

At completed Landfill level 45, retain one completed line showing 45 / 45 and remove its purchase action. Never offer Level 46. Uncapped regeneration continues to show just its current next level and cost. Completed/history views summarize a line and achieved level rather than duplicating every rank.

Use this presentation for recurring endgame regeneration, Landfill, Train capacity and global Storage/Inventory placement/connection research, plus the finite advanced Road-channel sequence. Future candidates inherit the pattern only if later adopted. It does not require redesigning unrelated earlier fixed research families in this decision.

Keep one stable project identity and saved completion counter; derive the current offered level/cost from that counter and any selected quote. Existing runtime clears active selection on project completion. Refreshing the entry does not itself buy/select another rank or grant the unadopted Research Automation candidate. Preserve keyboard focus/accessibility identity and expanded details when practical as the card updates, without moving focus to an invented next-row card.

Implementation checks: one visible entry per line, no future rank rows, correct level/cost before/during/after completion, preserved contributions on load, no duplicate purchase on rerender, consistent search/tree/detail views, and completed-cap state without an extra offered rank. Existing [card](../../src/ui/ResearchCard.tsx), [presentation](../../src/ui/researchPresentation.ts), [panel](../../src/ui/ResearchPanel.tsx) and [completion behavior](../../src/simulation/researchRuntime.ts) are inspected baseline evidence, not proof the future endgame UI exists.


Q134 relocation projects each show their own one-time seven-Core price and completion state. Completing Resource Relocation must not display Lakes/camps as unlocked unless their own projects are completed. Once eligible, moving within the same map uses no extra material charge; communicate the remaining legal-footprint/state rules clearly. Q135 requires recorded victory completion for availability.
