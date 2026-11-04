# Game vision and scope

## Current identity

**Implemented:** NODE: Another Factory Game is a local-first, single-player factory game built around a visual network of machines, typed connections and connected map sectors. Players turn natural resources into increasingly complex products and physical research Cores. React supplies the interface and PixiJS draws the active factory.

**Working pitch, proposed wording:** Build a network of specialized factories, solve competing supply problems, and bring their research output home. The factory has expansion plans. The neighbors have objections.

The mechanical basis is established. Production optimization and geographic decisions are the agreed main attraction (Q05); the pitch wording remains reviewable.

## Existing design pillars

| Pillar | Existing direction | Design consequence |
| --- | --- | --- |
| Readable automation | Players build and troubleshoot actual material flows | Show real buffers, production and rejected interactions clearly |
| Distributed production | Specialized outposts and branching routes converge on Home | Geography and transport should reward factory placement |
| Distinct tier problems | Each Core tier adds a different supply challenge | Complexity should change decisions, rather than only increase bills |
| Choice within constraints | Efficient local processing is advantageous; slower solid shipping remains viable | Avoid scripted layouts and mandatory off-Home assembly checks |
| Useful growth | Earlier Core streams remain relevant; upgrades are optional | Scale earns throughput without making upgrades access gates |
| Understated character | Dry humor is canonical | Keep controls, quantities and objectives unambiguous |

These summarize existing decisions in [progression and scaling](../progression-and-scaling.md), rather than introduce new rules.

## Audience and play experience

**Implemented:** mouse and keyboard interactions, a desktop browser workflow, optional tutorials, pause and local save slots. **Open:** supported minimum screen and hardware, exact session lengths and accessibility commitments.

**Agreed audience (Q02, November 2, 2026):** automation enthusiasts are the primary audience, with support for newcomers learning the rules. Design satisfying production and routing problems, and provide clear instructions and optional teaching that do not assume prior factory-game knowledge.

**Agreed gameplay emphasis (Q05, November 2, 2026):** production optimization and geographic decisions are the main source of satisfaction. Construction, exploration and encounters support the work of improving supply chains and choosing where to process and transport materials. Use this priority when allocating development effort. This choice does not specify difficulty, add geographic restrictions or reopen settled transport rules.

**Agreed session rhythm (Q03, November 2, 2026):** support both short sessions with useful progress and longer, focused sessions for planning, building and troubleshooting. Players should be able to pause and resume unfinished work. Exact session durations and measurable resumption criteria remain to be defined.

**Agreed setback philosophy (Q12, November 2, 2026):** setbacks are recoverable, with clear causes and repair paths, and no game-over state. Factory problems should lead to diagnosis and improvement, with ordinary-gameplay recovery remaining possible. This establishes direction; it does not certify that all current failure paths have been validated.

**Agreed milestone platform (Q04, November 2, 2026):** desktop browser with mouse and keyboard. Touch support and desktop packaging are outside the stabilization-through-Complex milestone. Supported browsers, minimum hardware and viewport remain to be defined.

## Scope boundaries

**Agreed encounter roles (Q14):** Goblin settlements are an early optional bonus. Dwarven settlements, formerly Lizard settlements, provide regular Mythril supply through Tribute. Q14B1 retains the Mythril Golem and its infinite reserve as an explicit exception, on a random tier-6 map with increased clearing AP; ordinary deposits and other unsupported sources remain excluded. The source transition and discovery rules still need implementation design. The four final-Core corner challenges remain a separate requirement.

**Agreed and implemented locally (Q10, November 2, 2026):** Power is removed from the playable game pending a clear integration design. Do not plan a broader Power requirement for stabilization. Tree Planters remain usable without Power; old Power infrastructure is archived in saves.

The current architecture has no cloud persistence, analytics or remote gameplay service. Multiplayer, accounts, mobile touch controls, monetization, localization and achievements have no committed scope in this plan. Decide them explicitly if they become relevant; do not treat their absence as a defect.

The design intends seven progression levels. Six physical Core types are implemented; Endgame Theory opens the future seventh level and is not final victory.

**Agreed endgame direction (Q06, November 2, 2026):** each of the world's four corners has a unique obstruction. Solving each obstruction provides a distinct component for the final Core. Producing that Core enables the player to create a victory project, comparable in purpose to Factorio's rocket launch. Victory allows continued play. Final Cores remain reproducible and fund research supporting further optimization and play. The victory project's identity, component production rules, recipes, costs and post-victory research effects remain open. See the [endgame specification](03-progression-and-economy.md#final-core-victory-and-continued-play).

## Success criteria to settle

**Agreed late-game transport (Q11–Q11A):** producing the first final Core makes shared Storage/Inventory access research available. Completing that research initially allows one of each globally; progressive research expands each type's global placement allowance at increasing costs. Initial corner-component collection and first final-Core assembly use ordinary transport. Delivery and victory are not prerequisites for making the access research available.

**Agreed endgame supply detail (Q07):** solved corners create component-specific Tribute boxes. The Alpha monster, provisionally a dragon and assigned to a seeded corner under Q77A, awards one Alpha per high-AP defeat and respawns at full AP. Players bring the corner components together in another area to assemble the final Core, then deliver it to the Research Center. Other corner mechanics and the precise victory trigger remain open.

The established pacing aspirations are 20–30 hours for efficient endgame play and a separate three-hour perfect-play checkpoint through tier 6. These are targets, not demonstrated completion times. See [economy](03-progression-and-economy.md).

**Agreed next milestone (Q01, November 2, 2026):** stabilize and validate the existing route through Complex, while defining tier 7 on paper. This gives the final tier a measured foundation. The audience and session rhythm are settled in Q02–Q03; Q24 adopts the stabilization completion checklist and deferred scope, with numerical thresholds still to be specified.

Evidence: [project overview](../../README.md), [agreed progression](../progression-and-scaling.md), [player-facing flavor](../../src/content/flavor.ts).
