# Factorinode novice playtest findings

Date: November 1, 2026

## Current implementation status

November 2 Power update (master-plan Q10): Power is removed from the playable game pending a useful integration design. Tree Planters operate without Power, and Hydrochemistry no longer requires Basic Electricity. N15's Power teaching remains deferred; any future waste lesson should be evaluated independently. Earlier references to Power below describe the previous system.

November 2 update: Smelters now require an explicit recipe, and incoming metal
does not change it. All configurable production nodes reject new connections
until a recipe is selected, using the ordinary invalid-connection feedback.
Basics explicitly chooses Copper Plate before wiring the Smelter. Earlier
observations about automatic Smelter typing below describe the previous behavior.

The accepted changes for N01–N14 and N16–N22 are implemented or addressed by the agreed reassessment. They are not outstanding proposals. Some findings share an implementation, and some original suggestions were deliberately reduced or replaced during review.

One finding remains deferred:

- N15: Power and waste teaching waits for power-system development. Those proposed lessons are not implemented.

N20 is now implemented and browser-verified at the user's request: rejected cable drops show a temporary X marker and cable recoil, without new text or persistent controls.

Original observations and “Suggested change” paragraphs below are historical context, not a pending task list. Each current status or resolution describes the agreed outcome. The latest implementation checks passed: 290 active tests, 1 existing skip, and the production build. Human novice validation and the remaining browser coverage listed at the final checkpoint are testing follow-ups, not unimplemented accepted fixes.

This simulated novice playtest examines whether a player with no gaming or factory-game experience can discover the next useful action. The initial run lacked the original game's tutorial system. Basics now sets making a Simple Core as its goal and guides actual production from raw Wood and Copper through research. N01 has been addressed for players who follow the tutorial; the remaining evaluation is how well they transfer that learning to Home. Other observations below retain their original scope unless updated explicitly.

## First tutorial production goal

The Basics tutorial now has 22 stages and opens with “Goal: make your first Simple Core.” After the original placement, connection, storage, and automatic research lessons, the player builds a Kiln, a Copper Extractor, a Smelter, a Gear Refiner, a Simple Core Refiner, and a Research Center. Placement targets and port markers identify the next construction and missing cable. The Refiner recipe picker opens on placement.

The same factory stays active throughout. No Cores, Plates, Gears, Charcoal, or other intermediate materials are supplied. A step advances only when the simulation records real production or delivery. After making a Core, the player routes it into the Research Center and completes Assembler research using that production. The persistent goal changes to Achieved after the first Simple Core is produced. The isolated practice/save protection is unchanged.

Verification: the full raw-resource production and research route passes an automated simulation test using normal placement, recipe, connection, milestone, and research rules. The fresh reassessment below also completed all 22 stages in the browser, including all seven added production stages, real Core delivery, and paid Assembler completion.

## Tutorial import and reassessment

The original authored source is `D:/Node Game/game/tutorials/guided-tutorials.ts`. All four lesson families are preserved in `src/tutorials/originalTutorials.ts` and readable from the new tutorial library. The welcome screen offers Learn to Play; Options offers Tutorials for replay.

Interactive Basics covers Build, placement, resource connections, Chest storage, automatic milestones, selecting paid research, processing Cores, shortcut bars, and Options. It uses action checks, placement targets, port markers, and highlighted research cards. Interactive Logistics covers Joint, Splitter, and Merger exercises. Monster Camps provides a live bot-delivery practice board and recurring AP countdown. Control Groups now has an interactive practice board covering group creation, normal and individual selection, group movement, directional marquee selection, and confirmed disbanding. Dropping nodes into existing cables remains unavailable; the reference lessons retain that availability note.

Practice uses its own GameEngine with autosave disabled. It cannot open manual Save / Load, write the player's shortcut settings, or grant tutorial unlocks to the real factory. Exiting resumes the original engine with its prior paused state. The original copy remains verbatim in the imported file; runtime adapters correct obsolete UI references and use the current research payment. Assembler now costs 1 Simple Core after the balance overrides at the end of `src/content/research.ts`; the initial report incorrectly relied on its earlier 5-Core declaration.

Live reassessment: completed all 15 Basics stages through storage delivery, the paid Assembler research demonstration, and Options, then verified return to the original paused Home session. Build passes. Automated checks pass: 238 tests, with 1 existing skipped test. Tutorial-specific checks cover real research delivery, disabled practice autosave, normal autosave preservation, Joint movement, distinct Splitter output connections and production, and successful camp suppression. Logistics and Camp completion are verified by simulation tests, not yet full browser walkthroughs.

The original Basics lesson supplies the research payment in a Chest. It teaches how research consumes Cores, but it does not make the player build the Wood → Charcoal and Copper → Plate → Gear → Simple Core chain. Restoring the original lesson therefore substantially resolves the opening control problem without establishing that the entire first progression loop is obvious.

## Method and scope

The live browser session uses a separate localhost origin on port 4181, keeping its browser save data separate from other ports. Desktop mouse and keyboard control are not used. The player simulation assumes no familiarity with factory games, visual programming, keyboard shortcuts, buffers, or research trees. Predicted player reactions below are hypotheses, not observations from a human participant.

Live coverage: welcome screen; Home; Forest to Extractor; Joint and Kiln unlocks; first Kiln and Wood connection; Copper extraction and Smelter unlock; Copper Plate production; Refiner and Research Center unlocks; Copper Gear and Simple Core production; physical Core delivery; paid Assembler research completed and Assembler verified available in Build; Research search. Later progression observations are explicitly identified as source review.

The test factory is paused after the first paid research unlock. Screenshot: [First research factory](../outputs/novice-playtest-first-research.png).

## Findings from the live interface

### N01 The opening gives controls without a first objective

Updated status: Addressed for tutorial participants. Basics now explicitly sets and guides the production of a Simple Core from raw resources, then uses the produced Core for research. Transfer to unguided Home play still benefits from future human playtesting. The initial observation below describes the version before the import.

Originally observed: the welcome screen taught Place, Connect, and Automate, then dropped the player into a field with unconnected resource sources and Extractors. There was no persistent first task.

Likely novice reaction: “What am I trying to achieve, and which thing should I click?” The nearby Forest and Extractor make a useful implicit starting arrangement, but recognizing that arrangement requires inference.

Implemented solution: make “Make your first Simple Core” the goal of Basics itself. Guide the entire production chain and spend its output on research, without switching to a preloaded demonstration board. The player learns both how to produce Cores and how to use them before returning to Home.

### N02 Output socket instructions do not match the second connection

Priority: High. Observed: the welcome screen says “Drag an output star to an input circle.” The Forest has a star; the Extractor output used to feed the Kiln is a circle. The first connection therefore teaches a rule that does not describe the next one.

Updated status: the welcome instruction now says to drag a right output to a left input. The restored tutorial also explicitly explains star versus circle connection capacity and requires both a resource connection and an Extractor-to-Chest connection. This specific instructional mismatch is resolved; later port discoverability can still be evaluated separately.

Likely novice reaction: “This machine has no star, so how do I get its Wood out?”

Suggested change: teach direction directly: “Drag from a node’s output on the right to an input on the left.” Explain resource stars separately and highlight usable output sockets during the first few connections.

### N03 Research opens with advanced projects instead of useful beginner steps

Updated status: Resolved. Research now groups Active project, Next milestones, Available research, Future research, and Completed research. Capabilities precede optional efficiency upgrades. Milestone cards show their required action; available projects show Core costs. Projects needing undiscovered Core production stay in Future research. Completed is collapsed by default, and the tutorial opens it when highlighting Joint.

Player choice: Future research remains expanded and fully browsable. Players can inspect locked projects, read their benefits, and follow prerequisite links to plan long-term goals. Future projects are not hidden to force a prescribed route. Browser verification covered the new ordering and inspecting Endgame Theory; automated checks verify that every project appears exactly once, distant goals remain present, capabilities precede efficiency upgrades, and repeatable projects remain usable.

Priority: High. Observed: the first Research view begins with Water Tools, Mythril Refining, Advanced Fabrication, Waste Handling, and Hydrochemistry. The opening milestones such as Smelter and Refiner are much farther down the catalog. At the tested viewport, the initial view is dominated by unavailable projects.

Likely novice reaction: “Everything is locked; I must have missed something.” Search requires knowing an unfamiliar research name in advance.

Implemented change: put reachable milestones and available capability unlocks first, preserve a visible Future research section with inspectable projects and prerequisite navigation, and put completed projects in a collapsible archive.

### N04 Research mixes automatic milestones and paid projects without an upfront explanation

Priority: High. Observed: connecting nodes automatically completes Joint research; extracting Wood completes Kiln research. The same catalog also contains selectable projects that require Cores. Trigger is a filter label, but the difference is not explained in the opening instructions.

Updated status: Resolved by the tutorial plus Research organization. Next milestones explicitly explains automatic unlocks and shows each trigger action on the card. Available research is separate and shows Core payment requirements. Players who skip the tutorial can now see this distinction in the catalog itself.

Likely novice reaction: “Did I buy that? Do I click the next one, wait, or build something?”

Suggested change: label entries “Automatic milestone” or “Requires Cores.” Show the exact action for a milestone directly on its card. When paid research becomes relevant, explain selecting a project and delivering Cores to a Research Center.

### N05 Production and bottlenecks need visual feedback

Updated status: Implemented using visual feedback, as requested. The generic health word has been removed from both the inspector and canvas tooltips. Production bottlenecks are not replaced with visible status sentences.

Working machines show a rotor driven by their actual production cycle. Hollow rings and empty chevrons mark the input socket missing ingredients. Stationary caps and stacked blocks identify an output bank that must drain; fill pips show accumulating stock. Waste congestion uses its separate output socket. Shape and motion distinguish the cues as well as color. Stalled machines no longer display a full cycle bar that could be mistaken for completed production. The inspector's permanent green health dot and ingredient/output waiting sentences were also removed.

The production cues use simulation readiness and production progress. They do not invent throughput. Committed batches keep animating after paying their ingredients, while paused or disabled machines stop. Global pause freezes cycle motion. Existing cable particles continue to represent actual transfers. Extractors trace their resource source through Joints, and research checks the required synchronized Core set.

Verification: live browser inspection showed producing machines alongside backed-up machines; starting research drained the Core queue and restarted production. Build passes and 255 active tests pass. Focused checks cover the exact missing Smelter input, output saturation and recovery, waste congestion, committed batches, extraction through a Joint, processing pause, and synchronized research. Future novice playtesting should confirm that the shapes are understood without explanation.

### N06 The basic production connection is visually less discoverable than the resource connection

Updated status: Implemented. Hovering a socket now enlarges it, draws a bright halo and an inward/outward arrow, and changes the cursor to a drag hand. The origin stays highlighted while wiring; the snapped destination uses a contrasting highlight. Hit areas retain at least 10 screen pixels of radius while zoomed out, and the node-body fallback uses the same distance. Existing nearest-socket selection and compatibility checks remain in effect. The feedback adds no new explanatory text and does not animate as if the machine were producing. Build passes; novice interpretation remains subject to playtesting.

Priority: Medium. Observed: connecting Forest to Extractor produces a clear unlock notification. Subsequent work requires finding small, labeled sockets on machines and recognizing that their circular outputs can be dragged. At the tested scale, socket labels are very small.

Likely novice reaction: “Do I drag the whole box, click it, or drag the tiny circle?”

Suggested change: briefly pulse the Extractor output and Kiln input after the Kiln is placed. Use larger invisible hit areas and show full item names on hover. Confirm a successful connection with an unmistakable short animation.

### N07 Shortcut bars compete with the first factory for space and attention

Updated status: Resolved for fresh games and reset layouts. Production, Logistics, and Storage now form one compact horizontal group at the bottom edge. All three remain visible. The camera frames every starter resource and both Extractors above the row; controls help sits above it. Initial geometry is sized for the viewport, and attached groups reflow when their dimensions or the viewport change. Existing saved custom bar layouts and loaded-save cameras are preserved. Options → Reset shortcut bars applies the new arrangement to existing profiles. Training keeps its separate practice layout.

Verification: fresh-origin browser inspection confirmed the entire starter factory above the row at 1280 × 720. Automated checks cover nonoverlapping bar placement, bottom clearance, preservation of custom positions, and starter-node framing at 800 × 600, 1280 × 720, and 1920 × 1080.

Priority: Medium. Observed: the starting view displays three shortcut bars, numerous empty plus slots, rotation controls, and modifier-key labels. In the initial 1280 by 720 view, the bars partially covered the lower Extractor. Iron was below the visible field.

Likely novice reaction: “Are these plus buttons the things I need to build? What do these symbols mean?” A player may also miss resources beyond the viewport.

Suggested change: begin with one compact labeled build control, reveal more shortcut customization later, and keep starting machines clear of overlays. Teach panning with plain language such as “Hold the right mouse button and drag to look around.”

### N08 Brief unlock notifications identify new tools but do not give the next action

Priority: Medium. Observed: notifications announce Joint and Kiln unlocks, and new shortcuts appear. They explain what unlocked, but not a complete next task such as placing a Kiln and feeding it extracted Wood.

Likely novice reaction: “I saw a message, but what should I do now?”

Resolution: keep the factory workspace clear. Research and milestone notifications are clickable and open Build focused on the newly unlocked node, Recipes focused on the newly unlocked recipe, or Research for an upgrade. Opening a notification does not place a node or select a research project. Dismissal and automatic expiry remain available.

Restored the original Discovery Journal under Options → Journal (also J), adapting its discovered-node count, category filters, descriptions, newest-discovery ordering, elapsed unlock times, and achievements. Added persistent completed-research history and View unlock links, so players can recover missed notifications. Closing an entry returns to the journal. Historical completed projects from older saves remain visible even when their original timestamps are unavailable. Original-game unlockTimes and achievements import with the factory.

Verification: clicked a live Joint notification and observed Build focus Joint; opened Options → Journal, followed Kiln's View unlock link, and verified closing Build returns to the journal. The Research filter shows both milestone completions. Automated tests cover node/recipe/upgrade destinations, older notification messages, discovery retention after the 12-event activity feed rolls over, original-save migration, and version 1 round-trip preservation of the factory, research, and journal. Full suite: 262 active tests pass, 1 existing skip. Production build passes. Screenshot: [Discovery Journal](../outputs/discovery-journal.png).

### N09 Free construction is not stated clearly

Reassessment: low-confidence prediction. Free placement is likely apparent through experimentation; no human playtest established confusion here. Moved the existing free-building sentence to the beginning of the tutorial's Build explanation: “Nodes are free to build, so feel free to experiment.” No extra tutorial steps, mandatory undo exercise, or in-game notices were added. Further changes should depend on observed player hesitation.

Priority: Medium. Observed: selecting Build allows placement without a visible material bill. The interface does not explicitly explain that basic node construction is free.

Likely novice reaction: “Can I afford this? Am I wasting my resources by experimenting?”

Suggested change: add “Free to build” to the early catalog and explain undo when the player first places a machine.

### N16 The Gear recipe suggests the wrong metal for the first Core chain

Priority: High. Observed: Simple Core requires 2 Copper Gear. The Refiner recipe picker shows “Gear” with “2 Metal Plate → 1 Iron Gear.” Selecting it initially gives the inspector an Iron Gear recipe label. Connecting Copper Plates changes it to Copper Gear and production succeeds.

Likely novice reaction: “Simple Core needs Copper Gear, but I only have an Iron Gear recipe. I must need more research.” This is a false progression gate caused by the displayed recipe.

Resolution: replaced adaptive Gear/Wire modes with explicit Iron, Copper, and Mythril recipes, grouped under Gear and Wire in the picker. Each option shows its exact ingredient and product. Selecting Copper Gear keeps Copper Gear selected; other metals cannot silently change the recipe. The inspector and canvas sockets show the chosen material immediately. Material changes use the existing recipe-change confirmation. Smelter ore adaptation is unchanged. Basics now explicitly selects Copper Gear.

Mythril Gear, Mythril Wire, and Mythril Plate stay hidden in both recipe interfaces until the player visits a map containing Mythril. Generating or unlocking that map is not enough. The existing automatic Mythril discovery milestone announces these recipes through a clickable “New recipes discovered” notification, which opens the recipe guide at Mythril Gear. The Journal retains the discovery and its current unlock description; individual discovered-node links still open their Build entry. Long-term research remains visible. Older saves retain their actual recipe IDs, buffers, progress, and connections; existing Mythril materials also preserve discovery when an older save lacks encounter history. Save version remains 1.

Verification: browser inspection confirmed the grouped options, exact Copper Gear selection in the inspector, material-change confirmation, and only Iron/Copper options before Mythril discovery. Tests cover all six production recipes, rejection of wrong-material transfers and cables, version 1 factory round trips, original-format material migration, discovery on visiting rather than merely unlocking a map, one persistent discovery announcement, saved-material discovery recovery, unlock navigation, and the full tutorial Core-production route. Screenshot: [Refiner recipes before Mythril discovery](../outputs/explicit-refiner-recipes.png).

### N17 Research search highlights matches without bringing the target into view

Priority: High. Observed: typing “Assembler” keeps the full catalog and its scroll position. Advanced Fabrication near the top is highlighted because its prerequisite mentions Assembler. The actual Assembler capability remains far down the list. Selecting the actual Assembler card starts research, but reaching it requires additional navigation.

Likely novice reaction: “The search found Advanced Fabrication. Is that how I get an Assembler?”

Resolution: Research search now filters the catalog into one ranked results view. Exact project names come first, followed by name prefixes, other name matches, then related descriptions, prerequisite names, and Core costs. Future and completed projects are searchable, with completed matches visible directly rather than inside the collapsed archive. A result count, Clear search action, and explanatory empty state appear only while searching. Searching starts at the top; clearing restores the progression sections and the previous browsing scroll position. Prerequisite links can open a new search when their target is outside the current results. Typing and clearing do not select or cancel research; card actions retain their existing behavior for separate review under N18.

Verification: live search for Assembler showed the actual Assembler capability first among 16 matches. Following its Refiner prerequisite opened matching results and Refiner details. Joint appeared directly as a single completed result. An unknown query showed 0 results; clearing restored all progression sections. Scroll-position check: 720 before search, 0 during search, 720 after clearing. Automated tests cover ranking, exclusion of unrelated projects, prerequisite display names, Core costs, completed/future access, whitespace/case normalization, empty results, cleared queries, and unchanged game state. Screenshot: [Filtered Research search](../outputs/research-search.png).

### N18 Paid research has little persistent detail on its own screen

Priority: High. Observed: selecting Assembler changes its card to active. Its card still shows an icon and name rather than a persistent cost, progress count, or missing-delivery explanation. The Research Center inspector provides more useful detail, but is hidden while this modal is open.

Likely novice reaction: “I clicked it. Did I buy it, and is it doing anything?” Clicking the active card again deselects the project in the UI implementation, which can add confusion if the player clicks repeatedly looking for confirmation.

Resolution: research cards only inspect a project. Details provide explicit Start, Switch, and Cancel controls. Active-project details open by default when Research is reopened and remain available in the normal progression view. They show the result, researched/required counts for every Core, remaining payments, and the current delivery condition. Waiting checks use complete Core sets within one Research Center rather than adding stock across separate Centers. Paused simulation, missing Centers, disabled/paused Centers, construction, and actual processing have distinct messages. Cards also retain each project's previously researched payments when it is inactive. Switching and canceling retain those payments and restart partial cycles; the UI states this beside the action. Completion removes the action and shows the final counts. The Basics tutorial now tells the player to inspect Assembler and press Start Assembler research, with the Start control highlighted during that step.

Verification: used the production ResearchPanel and GameEngine in an isolated browser fixture with autosave disabled. Inspecting Road did not start it; Start explicitly activated it; one real cycle updated both Core payments to 1/2; repeated card inspection left it active. Switched to Exploration, canceled, returned to Road, and verified its 1/2 payments survived switching and canceling. Clearing search preserved the active detail view. A second cycle completed Road, opened its completed entry, displayed both payments at 2/2, and removed Cancel. Unit coverage checks missing deliveries, split Core sets, paused/disabled/constructing Centers, retained payments, and completion after resuming. Full suite: 281 active tests pass, 1 existing skip. Production build passes. Screenshot: [Explicit research controls and progress](../outputs/research-explicit-controls.png). The fixture files are outputs/research-controls-preview.html and outputs/research-controls-preview.tsx; they use manual simulation and do not touch saved player factories.

## Additional progression findings

The first research loop below was followed up in the browser. Remaining findings in this section come from source review and require live follow-up; they are not completed late-game playtests.

### N10 The first paid research loop needs a concrete bridge

Updated status: addressed by the expanded Basics tutorial and N18's research details. The current lesson produces a Simple Core from raw Wood and Copper, physically delivers it, explicitly starts Assembler research, and waits for completion. It supplies no practice Cores or other intermediate materials. The older observation below describes the initial tutorial import.

Priority: High. Live follow-up confirmed that producing a Copper Plate unlocks Refiner and Research Center, and a second Refiner produces Simple Cores from Copper Gears. The restored tutorial now teaches physical delivery into a placed Research Center and selecting a project. It supplies practice Cores, however, so discovering and building Core production in Home remains a separate learning task. Assembler's live cost is 1 Simple Core after balance overrides.

Suggested change: introduce that entire loop as a sequence: make a Plate; build and configure a Refiner for Simple Core; build the Research Center; select Assembler; deliver Simple Cores. Show progress and missing deliveries beside the selected project.

Evidence: src/content/research.ts, src/ui/NodeRecipePicker.tsx, src/ui/NodeInspector.tsx.

### N11 Useful recipe help is placed under Options

Priority: High. The Recipes guide is opened through Options. Players looking for how to make their first Core may not look in a settings menu. The guide already supports ingredient navigation, which could help if discovered.

Resolution: every Core name in research details is a recipe link. It opens the production guide focused on that Core's exact recipe, showing its ingredients and producing machine. Existing ingredient links continue tracing the production chain. A Back to research control and Escape return to the same project, search, filters, scroll position, and keyboard focus. The Research panel stays mounted but hidden during the visit; this does not select, switch, or cancel research. There are no additional permanent HUD controls.

Locked Core recipes are available as explicit planning previews, labelled with their required research or producing-machine unlock. Viewing them does not unlock production. Only the specifically requested locked recipe is added to the guide; normal browsing continues to hide undiscovered Mythril recipe options. The original Options entry remains available, and Basics already introduces it.

Verification: in the actual game, opened Assembler details and followed Simple Core directly to its Refiner recipe (2 Copper Gears). Back to research and Escape both restored the Assembler search and focused Core link. A direct click preserved the selected Simple Core requirement filter and a nonzero scroll offset (92.31 before and after the recipe visit). Extractor 6 exposed links for all six Core tiers. Complex Core opened a preview requiring Precision Control, and Automata Core correctly identified its own research requirement. Production build and all 281 active tests pass; 1 existing skip remains. Screenshot: [Direct Core recipe help](../outputs/research-core-recipe.png).

Evidence: src/ui/App.tsx, src/ui/RecipesPanel.tsx.

### N12 Multiple Core types require simultaneous supply

Resolution: the existing Basics research-completion step now explains that an Assembler makes Basic Cores, Exploration needs Simple and Basic Cores together, and the player should keep the Simple Core production line running. No additional tutorial step or HUD notice was added. Research cards join Core requirements with +. Every mixed-Core project detail also states its total cost and full breakdown, followed by: “Every listed type is required; higher-tier Cores do not replace earlier ones.” N18 already provides individual remaining payments and complete-set delivery status.

Verification: browser inspection of Road showed 4 Cores total, explicitly broken down as 2 Simple Cores + 2 Basic Cores. Tests verify Exploration's total of 2, Road's total of 4, and the absence of unnecessary mixed-Core explanations for a single-Core project. All 282 active tests and the production build pass; 1 existing skip remains. Screenshot: [Summed Core requirements](../outputs/mixed-core-requirements.png).

Priority: High. Research Center copy states that a cycle consumes one of every required Core together. Exploration needs both Simple and Basic Cores. A novice could assume Basic replaces Simple and dismantle the earlier chain.

Suggested change: at the first mixed-Core project, explicitly say “Keep making Simple Cores too.” Show missing Core types and live deliveries in the Research panel, not only the selected Center inspector.

Evidence: src/content/research.ts, src/ui/NodeInspector.tsx.

### N13 Optional efficiency projects can distract from progression unlocks

Updated status: Addressed alongside N03. Available research puts capability unlocks before Efficiency projects, and projects requiring undiscovered Core production are grouped under Future research. Players can still inspect and plan all optional upgrades.

Priority: Medium. Extractor 1 and Kiln 1 can appear available before a Research Center or Core production exists. Efficiency projects sit before the early milestone entries in catalog order.

Suggested change: distinguish “New capability” from “Optional speed upgrade” and recommend the capability needed for the next production chain. Make availability account for whether the player can actually produce the payment, or explain that missing capability.

Evidence: src/content/research.ts, src/ui/App.tsx.

### N14 Expansion introduces new currencies and transport assumptions

Resolution: activation now keeps the selected map selected, for both the primary action and double-click activation. The action immediately changes to Travel to node, and activation itself does not travel. Added an optional 11-stage Expansion lesson under Options → Tutorials. It starts in an isolated Home factory with Exploration and Road research complete and one practice Map Point. The player activates map 6,5, travels out and Home, returns to the sending outpost, places a Road at its west edge, feeds it from the outpost Chest, returns Home, and connects the receiving endpoint to the Home Chest. The goal advances only after real Wood arrives. The outpost produces its Wood from a Forest and Extractor; no Wood is prefilled. Port and placement markers guide the actual connections. The lesson explains free travel, Map Node research for more points, one material per Road pair, one item per five seconds, local fluid use, and physical Core delivery to the Home Research Center. Expansion has its own lower-left practice bars to keep the Home receiving endpoint accessible; player layouts are unaffected.

Verification: completed the full browser walkthrough, including retained selection and Travel to node immediately after activation, both travel directions, real Road-pair placement, both cable connections, arrival in the Home Chest, and the final Achieved state. Finishing returned to the original factory with its original research access. Automated checks cover Map Point spending without travel, locked-sector access, production and cross-map delivery, fresh restart, source-state preservation, and disabled practice autosave. All 284 active tests and the production build pass; 1 existing skip remains. Screenshots: [Activation retains selection](../outputs/expansion-map-activation.png), [Expansion completed](../outputs/expansion-tutorial-complete.png).

Priority: Medium. Exploration awards a Map Point; Map Node research awards more; roads pair adjacent map edges and transport one material per pair. The Research Center stays in Home. These rules need teaching at the moment expansion becomes available.

Suggested change: guide the first map activation, travel, return Home, and first road pair with a visible destination and material. Explain how off-map production reaches Home research.

Evidence: src/ui/App.tsx MapPanel, src/content/nodes.ts, src/ui/NodeInspector.tsx.

### N15 Waste and power introduce distinct reasons for production to stop

Status: deferred at the user's request. Develop the power system first, then revisit N15 against the resulting gameplay before deciding on teaching or feedback changes. The proposed Power and Waste practice lessons are on hold and have not been implemented. N05's existing visual production feedback remains in place.

Proposal retained for later reassessment: a Power exercise could restore supply to a stopped consumer, and a Waste exercise could drain a blocked output and demonstrate production resuming. Re-evaluate these scenarios after power development rather than committing to the current Generator/Tree Planter example. Keep normal-play feedback visual rather than adding persistent warning text. This supersedes the initial warning-panel suggestion below.

Priority: Medium. Later recipes can fill waste buffers and halt batches; power uses special sockets and cannot be treated as an ordinary material stream. Inspector help exists but assumes the player opens the relevant machine.

Suggested change: introduce each system when its first recipe or machine unlocks. Surface a persistent local warning that identifies the blocked machine and offers to focus it.

Evidence: src/ui/NodeInspector.tsx, src/ui/NodeRecipePicker.tsx, src/content/nodes.ts.

## What already helps

- Starting Extractors sit near resources, suggesting the first action.
- A successful first connection produces an immediate milestone notification.
- Extracting Wood and metal automatically unlocks relevant machines.
- The Build catalog uses readable machine names and short descriptions.
- Connections adapt to the material: feeding Copper changes the Smelter output label to Copper Plate.
- The inspector makes stored ingredients and output visible.

## Original recommendations (historical)

1. Add a persistent guided path through the first working research loop.
2. Put beginner milestones and useful capability unlocks first in Research.
3. Correct the socket instruction and teach one machine-to-machine connection.
4. Replace generic idle OPERATIONAL labels with the actual missing condition.
5. Make recipe help accessible beside required items and research payments.

## Fresh reassessment and follow-up queue

### Fresh novice reassessment — November 1, 2026

Completed: a separate `novice-retest.localhost:4181` origin protects the existing player tab and browser saves. All actions used the visible game controls, with no grants, injected saves, accelerated simulation, or game-rule edits. This is a simulated novice audit, not a human usability study. No game code was changed during the run. The isolated test factory is paused in Home.

Completed the full revised 22-stage Basics tutorial in the browser. Built the entire Wood/Copper → Charcoal/Plate → Gear → Simple Core chain, physically delivered Cores, completed Assembler research, and finished the Options lesson. The target and port markers remained usable at 1280 × 720. The two-input Smelter marker moved to the missing ingredient socket after the first cable. The blocked Kiln visibly resumed when downstream consumption became possible. No gameplay workaround was required. Report: [Basics resource and time snapshot](../outputs/novice-retest-basics-report.json). The Assembler completion was recorded at 182.1 seconds of game time; the report snapshot was taken at 211.2 seconds. These include interaction and inspection overhead, not just production waiting.

#### N19 Finishing first-time Basics leaves two navigation layers

Priority: Low. Observed: entering Basics through the welcome screen, then using Finish tutorial, returns to the tutorial library. Closing the library reveals the welcome screen again. The lesson says “Finish to return to your factory,” but the player must still close the library and choose Enter Home Sector. The actual factory is preserved correctly.

Resolution: Finish tutorial now has a separate completion handler. It dismisses the first-time welcome, closes the lesson library, and returns to Home using the original factory engine and saved Home camera. The same completion behavior applies to all interactive lessons, including Basics. Exit practice still returns to the lesson library, and Options → Tutorials remains the replay route. Practice machinery, materials, research, and shortcut settings are not transferred.

Verification: on the fresh `tutorial-finish.localhost:4181` origin, entered through the first-time welcome, completed all three Monster Camps stages through a real successful Attack Power check, and clicked Finish tutorial. This exercises the same final-stage callback used by Basics without repeating its already completed 22-stage production walkthrough. Home appeared directly, with no welcome or library layer. The visible export confirmed exactly the original five starter nodes, no completed research, no production or extraction, and no practice camp or bots. Paused Home, reopened Tutorials through Options, started Basics, used Exit practice, and verified that the library returned. Closing it exposed the still-paused factory with no returning welcome. All 290 active tests and the production build pass; 1 existing skipped test remains. Screenshot: [Finish returns directly Home](../outputs/tutorial-finish-direct-home.png). Report: [Original Home factory preserved](../outputs/tutorial-finish-home-report.json).

#### Home transfer and recovery results

Rebuilt the raw-resource Simple Core chain in fresh Home without tutorial markers, completed Assembler research, then used Exploration's Basic Core recipe link to discover its Copper Plate + Iron Wire ingredients. The Iron Wire ingredient link correctly traced to 3 Iron Plates in a Refiner. Home opens a newly placed configurable machine's inspector with Choose recipe; this differs from the tutorial's automatic picker but remained discoverable in this simulated run. Mythril production options stayed hidden.

Built an Assembler, observed its Splitter milestone, and used two Splitters to share Charcoal between Smelters and Copper Plates between Gear production and Basic Core production. Routing an existing output into the Splitter moved its old cable; reconnecting both Splitter outputs restored the original branch. The Splitter inspector explained its alternating outputs. This was possible with Basics knowledge and normal inspection, but does not prove human novices will discover branching without Logistics practice.

Tested recipe changes on the working Copper Gear Refiner. Cancel retained Copper Gear. Confirming Copper Wire displayed the warning about destroyed contents/progress and disconnected the incompatible Gear output cable while preserving the compatible Copper Plate input. Attempting Wire → Simple Core Refiner did not create a cable. Restoring Copper Gear and reconnecting the output resumed Simple Core production. One Copper Wire was actually produced during this deliberate detour. The exported snapshot confirms the incompatible cable was absent; a drawn or transient cable was not treated as a successful connection.

Full-output feedback was visible on the Extractors and Kiln; connecting downstream consumption freed output and restarted production. Exploration explicitly stated its 1 Simple Core + 1 Basic Core total, identified Basic Core as the missing delivery while Simple Cores were stored, processed the combined payment, and awarded its Map Point. Activated map 6,5, retained its selection, scrolled to Travel, visited it, then returned Home with zero remaining Map Points. Free return travel worked and the Home factory remained intact.

Report: [Home resource/time snapshot and factory](../outputs/novice-retest-home-report.json). Final game time was 584.8 seconds; Assembler completed at 301.4 seconds and Exploration at 504.4 seconds. The first Home connection occurred at 123.0 seconds, so connection-to-Exploration was 381.4 seconds. These times include welcome/navigation, reading, inspection, export overhead, and the deliberate recipe detour. They are not production-only waiting times or a human completion-time estimate. Extracted totals: 69 Wood, 77 Copper, 30 Iron. Produced totals: 66 Charcoal, 38 Copper Plates, 13 Copper Gears, 6 Simple Cores, 1 Copper Wire, 14 Iron Plates, 4 Iron Wires, and 4 Basic Cores. All remained within ordinary game rules.

Screenshots: [Completed Home factory](../outputs/novice-retest-home-complete.png), [Map activation](../outputs/novice-retest-home-activation.png).

#### N20 Incompatible connections fail without a clear rejection cue

Status: resolved. After the recheck below found unreliable feedback, the user explicitly authorized implementing a clear visual rejection cue here.

Implemented solution: an unsuccessful cable drag shows a red outlined diamond with a white X at the attempted socket or drop position. The cable recoils toward its origin, and the marker gives a small shake before fading; the entire cue clears after one second. Its shape distinguishes failure independently of color. Reduced-motion preferences disable the recoil and shake while retaining the X and fade. The cue follows the current camera and clears on a new connection attempt, sector/state replacement, or lost interaction. It is an interaction overlay and does not animate machine productivity or alter production state.

The generic blocked tooltip was removed from this interaction. Ordinary hover tooltips and the target's yellow hover halo cannot replace or compete with the rejection cue during its brief lifetime. No new text, persistent HUD element, notification, save field, or connection rule was added. Existing Road-specific error notices are unchanged. Successful engine connections return their result to the renderer so a later validation failure also receives the visual cue. A socket click without dragging does not trigger rejection.

Browser verification after implementation: attempted Iron Wire → the Simple Core Refiner's Copper Gear input and Copper Plate → the Kiln's Wood input. Both displayed the X and red cable, with no replacement tooltip; the marker then cleared. Public UI exports show the exact same 17 cables, machine states, and paused game time (614,493.3 ms) before and after the rejected attempts. A deliberate Copper Plate Smelter → Assembler Copper Plate input reroute succeeded without the rejection cue. Undo restored all original cables, nodes, in-flight transfers, and game time exactly. Clicking a socket without dragging showed ordinary hover feedback only. Drawing an already existing connection is rejected by the existing connection rules and correctly shows rejection; it was not used as the valid control. The playtest was returned to map 5,4 and left paused, with the original player tab untouched. Reduced-motion behavior was source-reviewed, not browser-emulated.

Current evidence: [Wire rejection cue](../outputs/n20-visual-rejection.png), [Kiln rejection cue](../outputs/n20-visual-rejection-kiln.png), [cue cleared](../outputs/n20-cue-cleared.png), [valid connection](../outputs/n20-valid-connection.png), [click without dragging](../outputs/n20-click-without-drag.png), [baseline report](../outputs/n20-fixed-before.json), [after rejected attempts](../outputs/n20-fixed-after-rejections.json), [valid reroute report](../outputs/n20-fixed-valid-control.json), [restored factory report](../outputs/n20-fixed-restored.json).

Historical recheck before this fix:

In the preserved, paused Home factory, attempted Iron Wire → the Simple Core Refiner's Copper Gear input and Copper Plate → the Kiln's Wood input. Neither incompatible cable was committed. Public UI exports before and after all attempts showed the exact same 17 cables, unchanged machine states, and unchanged game time. No game code, research, recipes, resources, or saved factory layouts were changed for that verification. The playtest was returned to its prior map, 5,4, and left paused.

Feedback was present in code but unreliable in the live interaction. One accessibility observation briefly showed “Connection blocked — Choose a compatible socket and route around lakes or holes”; the following screenshot already showed the ordinary Kiln hover tooltip. The Wire attempt and a repeated Plate attempt also showed only ordinary machine hover text. There was no dedicated rejected-cable recoil, shake, or failure pulse in that renderer. Existing yellow socket enlargement/arrows were hover cues and did not distinguish a rejected connection.

Source explanation for the old behavior: PixiPlayfield's pointer-up handler requested the generic blocked tooltip after an unsnapped drag, while normal machine/socket hover handlers also controlled the same tooltip and could schedule a delayed update. That was consistent with the observed warning being replaced, but the exact event ordering is an inference from source and the observed snapshots, not an instrumented trace. The warning also did not name the expected ingredient. This recheck kept the finding open until the implementation above.

Evidence from this recheck: [Wire rejection](../outputs/n20-wire-rejection.png), [Plate rejection](../outputs/n20-current-feedback.png), [accessibility snapshot showing ordinary hover text](../outputs/n20-rejection-feedback.txt), [before](../outputs/n20-verification-before.json), [after](../outputs/n20-verification-after.json). The current local build was inspected; this does not establish the state of unintegrated work in another chat.

Priority: Medium. Observed: Copper → Kiln and Copper Wire → the Simple Core Refiner's Copper Gear input gave no visible explanation of the rejection. The latter exported state confirms the Wire Refiner retained its Plate input but had no cable to the Core Refiner. The idle Core machine's existing missing-input marker remained, which signals a need but does not distinguish a wrong material from a missed drag. The recipe-change warning itself worked correctly.

Do not conflate this with aiming at the wrong socket: Copper aimed at a Smelter's Charcoal socket was automatically routed to its metal socket. The [earlier input-target report](../outputs/novice-retest-wrong-input-report.json) confirms that helpful correction. Only the incompatible-material cases are the finding.

Original proposed solution: briefly retract or shake the rejected cable and pulse the destination's existing required-material marker. The implemented version above uses a temporary X at the attempted drop to cover incompatible sockets and missed drops alike. Useful automatic socket selection for compatible ingredients is preserved. A short wrong-material recovery exercise in Logistics remains an optional follow-up only if human playtests still show confusion.

Evidence: [Recipe mismatch screenshot](../outputs/novice-retest-recipe-mismatch.png), [exported incompatible-cable state](../outputs/novice-retest-recipe-mismatch-report.json).

#### N21 Map activation pushes Travel below the visible panel

Priority: High for progression clarity. Observed at 1280 × 720: before activation, Activate node was visible. Activating map 6,5 expanded its name fields and four surveyed resources, pushing Travel to node below the panel's visible bottom. Only the top edge of the button remained visible. Selection was correctly retained; scrolling down exposed Travel and it worked. This is a layout issue, not a failed activation or lost Map Point.

Likely novice reaction (prediction): “I spent the point; how do I enter the map?” The corrected activation flow still hides its next useful action at this viewport.

Resolution: the existing Map Point total and primary Activate/Travel action now sit in a fixed footer within the selected-map detail pane. Names, resource details, and the legend scroll independently above it. The modal header and footer cannot shrink, and the grid fits the available content height so short windows cannot stretch the action outside the modal. The compact layout stacks the map above the scrolling details and retains the same footer. No new HUD control, notification, or game rule was added.

Verification: on the preserved Home test, selected the surveyed four-resource map 6,5 at 1280 × 720 without scrolling. Travel was fully visible (top 651.2, bottom 685.2), and those coordinates stayed identical while the detail pane scrolled. The action also remained visible at 1280 × 600 (bottom 565.2) and 640 × 720 (bottom 695.2); temporary viewport overrides were reset. In isolated Expansion practice, selected the locked outpost, clicked the visible Activate action, observed the same footer change to Travel with selection retained and the point spent, then used it to enter the outpost. Exiting practice restored the paused Home test. All 284 active tests pass, with 1 existing skip; the production build passes. Screenshots: [Fixed footer with four resources](../outputs/map-travel-footer.png), [short window](../outputs/map-travel-footer-short.png), [compact layout](../outputs/map-travel-footer-compact.png).

Evidence: [Travel clipped after activation](../outputs/novice-retest-home-activation.png). Scrolling revealed the button, after which normal travel and free return Home succeeded.

#### N22 First travel centers an empty area and clips the resources

Priority: Medium. Observed on the first visit to generated map 6,5 at 1280 × 720: the camera showed a mostly empty center, large partial holes at the edges, a resource mostly cut off above the HUD, Copper partly cut off below, and Iron obscured by the open minimap. The surveyed resources existed and travel succeeded, but the arrival view did not clearly frame the new work area. This observation is from Home seed 472715628, map 6,5; other layouts and viewport sizes are untested. The separate Basics practice report uses seed 1.

Resolution: first entry to a new sector uses the furthest zoom level, which now adapts to field and viewport size. The entire field fits below the navigation with side and bottom margins; zoom can extend beyond the old 25% limit. Both map views use this same entry path. Later visits retain a valid chosen camera, and authored tutorial cameras remain intact. Camera clamping uses the same fitted limit as first entry and preserves valid positions instead of forcibly recentering them. Initial renderer setup also synchronizes the actual applied camera to the engine. No save fields or gameplay rules were added.

Live verification: used normal wheel controls on the preserved, paused map 5,4 to reach the new limit. Its 3,960 × 2,640 field fit at 1280 × 720 (23.03%, field top 94 and bottom 702), 800 × 600 (18.48%, top 94 and bottom 582), and 640 × 720 (15.25%, left 18 and right 622). Temporary viewport overrides were reset. Zoomed in to 25.33%, returned Home, then revisited the sector: the chosen camera was restored exactly. The test remains paused. The first-entry travel path was browser-verified before this refinement; the fitted first-entry behavior has engine/helper tests, and this live check verifies the renderer's fitted wheel limit and saved revisits without generating another map or granting resources.

Automated coverage checks whole-field projection below navigation for several field tiers, normal and Area Expansion 2 field sizes, and four viewport sizes. It also covers the renderer clamp, reachable wheel limit, valid saved views, first entry versus revisits and restored saves, locked-sector protection, legacy cameras, and authored tutorial views. All 290 active tests and the production build pass; 1 existing skipped test remains.

Screenshots: [Fitted overview](../outputs/fitted-sector-overview.png), [short desktop window](../outputs/fitted-sector-overview-short.png), [compact viewport](../outputs/fitted-sector-overview-compact.png). Reports: [desktop](../outputs/fitted-sector-overview-report.json), [short window](../outputs/fitted-sector-overview-short-report.json), [compact](../outputs/fitted-sector-overview-compact-report.json), [chosen view retained](../outputs/fitted-sector-return-report.json).

Scope: this resolves field cropping and navigation overlap at the overview. Floating, movable shortcut bars, the minimap, and temporary tooltips can still cover part of the field at their chosen positions; no automatic rearrangement of those controls was added. The earlier [25% first-entry screenshot](../outputs/first-entry-maximum-zoom-out.png) records the limitation that prompted this refinement.

Evidence: [First sector arrival](../outputs/novice-retest-first-sector.png).

Review checkpoint: the current review sequence is complete. All 18 original findings and the four fresh-pass findings have implementation, reassessment, or deliberate deferral notes. N19's direct tutorial completion, N20's visual cable rejection, N21's visible Travel footer, and N22's fitted first-entry overview are implemented and verified. N15 alone remains deferred until power development. No other finding in this review queue is pending. Human novice validation, broader sector/viewport coverage, a full browser Logistics walkthrough, and later waste/power teaching remain possible follow-up testing. The Monster Camps walkthrough is now browser-verified as part of N19's shared-completion check.
