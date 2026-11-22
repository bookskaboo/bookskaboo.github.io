# Tutorials and discovery

[System index](README.md)

Tutorials teach controls in constrained practice states. The Discovery Journal and research hints track progress in the player's world. A practice lesson is not a normal-play balance run.

## Lessons

| Lesson | Main interactions |
| --- | --- |
| Basics | Placement, extraction, Charcoal, Plates, Gears, Simple Cores and lab delivery |
| Logistics | Joint placement/insertion, Splitter routing, Merger behavior and actual downstream Charcoal production |
| Expansion | Actual Wood production and Cart → Road pair → Cart delivery between practice sectors |
| Control Groups | Selection, creation, movement, independent selection and disbanding |
| Monster Camps | Obstruction boundaries and supplying bots until full suppression |

Definitions describe stages and target positions. Placement and choice guards restrict actions to the current lesson. Progress checks inspect actual state, so connecting a route without delivering its required output is insufficient where a lesson requires delivery. Dialogue and highlighting guide the same permitted action.

The [draft Mixed output and Filters outline](../master-plan/05-interface-and-learning.md#draft-optional-lesson-mixed-output-and-filters) specifies optional Controller/Fines separation, Waste Bin storage, whole-Filter blockage and repair under SR-17/E05 (NODE-0807). It is authoring work only: the five implemented lessons above, campaign unlocks and invitation behavior are unchanged. Its proposed unlock-time invitation, fixture and completion checks still need implementation and participant verification.

Guided Build, Options, Upgrades and expanded Map panels use the shared dialog focus controller while retaining access to the separate practice card. Their guided variants omit `aria-modal`; Tab includes enabled lesson navigation, Restart and Exit practice. Existing disabled choices and stage guards still apply. Ordinary tutorial-library, invitation and discovery dialogs use the same topmost Escape and opener restoration. See [dialog keyboard scopes](controls-and-factory-layouts.md#dialog-keyboard-scopes).

## Discovery and guidance

Gameplay milestones unlock tools and tutorial invitations. Visited map sectors populate encounter discovery. The journal keeps research completion timing, resource observations and saved discovery information rather than relying only on the short transient event list.

Research hints react to research completion, first production, visited sectors and corner-piece availability. They give a next useful clue while recipe, research and encounter panels retain exact requirements. The Dwarven discovery notice introduces the Mythril supply route without renaming the saved settlement fields.

Automatic Expansion/Monster Camps invitations and the Dwarven discovery notice share a developer-use suppression rule. Enabled Dev controls, direct unlock commands and Dev Source placement opt that factory into saved quiet prompts, preserved through undo/reload. Existing dev-revealed/research-granted or Dev Source saves are also quiet. Ordinary factories still receive their milestone prompts, and manual Tutorials availability is unchanged. Unseen lessons are not added to tutorialPromptsSeen merely because they were suppressed.

## Maintaining lessons and copy

### Practice completion and scope

- Basics requires actual production, delivery and research. Control Groups checks the actual selection and movement rules.
- Expansion's `expansion-road-place` body explains right-clicking either Road in the player's factory to reverse it and reconnecting both endpoints' cables afterward (NODE-0848). Practice disables reversal and Road travel shortcuts, retaining its authored Map travel sequence.
- Monster Camps advances only at full suppression, using the same `isCampFullySuppressed` predicate as guarded extraction (NODE-0850). Starting at 25%, the first success reaches 15% and does not advance; the next success reaches the 10% minimum. Checks remain sixty seconds apart, with the first fixture check near because its timer starts at 54 seconds. Live status distinguishes Check passed from Fully suppressed. The three stages and final understated reward hint (NODE-0539) remain. Neither extraction, reserve refill nor suppression loss is required. The active suppression explanation comes from `tutorialDialogue.ts`, overriding the obsolete original text.
- Logistics has sixteen stages (NODE-0852). After each Splitter/Merger rotation, an automatic production step waits for Charcoal in both Splitter-fed Kilns or the Merger-fed Kiln, respectively. Empty initial buffers make this evidence of actual downstream production. Required wiring must still exist; aggregate production elsewhere, delivered Wood alone and a single productive Splitter branch do not satisfy the checks. There is no Continue bypass. Existing completion explanations and Joint/Splitter/Merger insertion practice remain. These checks do not prove each Merger input contributed, require a blocked-branch diagnosis or require production again in the later insertion fixtures.

Source and automated functional checks are separate from a browser walkthrough or human learning assessment. The optional mixed-output lesson remains an unimplemented outline under NODE-0807. The [changelog](../changelog/README.md) retains the initial audit, its correction and the three reviewed changes.

Basics now opts into Upgrades dialogue in the actual unmodded game: inspect completed Joint, later select Assembler and press Queue research. The same existing 19 stages, project guards, production/delivery conditions and actual Assembler completion check remain in use. Selection alone does not advance; queue membership advances the selection step even while research is paused. One Assembler slot and disabled unrelated controls constrain practice. The payment step has no Continue bypass. After five processed Simple Cores, the completion copy explains the normal four-card queue and Simple upgrade unlocking Basic Cores. Restart/Exit/Finish preserve the established isolated-practice lifecycle. The entire lesson passed normal UI placement, production, delivery and payment checks; [integrated contracts](../../src/ui/UpgradesIntegration.test.tsx) and the [focused author fixture](../../previews/status-page/README.md#basics-research-transition) provide additional regression coverage.

The unmodded [Upgrades screen](research.md) uses an always-visible robot thought bubble with small backward/forward triangles in its bottom corners. Keep the card at the size needed for Your assignment at the current column width, so switching hints does not move the corner arrows or upgrade button. A hidden, inaccessible assignment-sized reference reserves that space and responds to width or wording changes. Retain 12 px top and 10 px bottom padding and a 2 px gap before the arrows. The character column places one next-upgrade button and Core count badges below it. Your assignment reads “You are a junior AI bot assigned to this world. Use its resources to build production systems, manufacture Cores, and upgrade yourself.” The mission is the bot’s own advancement through world resources and Core production. This hint is first in a fresh Junior example; the forward triangle acknowledges it and selects A promising Forest. Existing Wood/Kiln progress skips the introduction. World progress selects the current primary hint automatically. Arrow keys also browse hints. The scroll wheel does not change the selected hint; normal page or panel scrolling remains available. Once a hint becomes eligible, it stays available for rereading in that factory; future hints remain hidden until their original world conditions are satisfied. Unlocked hint history and assignment acknowledgement are saved with the factory. Closing the modal or reloading its saved state preserves them; new/reset stage or payment fixtures start fresh. Applied-mod factories retain their held guidance in the existing Research screen while support is deferred.

The [hint review page](../../outputs/status-page/hint-texts.html) lists all 46 author entries with text, eligibility and retirement conditions, backed by [review data](../../previews/status-page/hintReview.ts). It is not a fixed player sequence. The shared selector de-duplicates titles; Upgrades requests allCandidates for eligibility history and defaults to the primary progression clue. The retained modded Research component still uses the first-three/last-displayed behavior. Forest, Copper and Charcoal retain their original early eligibility; supporting clues become browsable once eligible. Dwarven guidance follows the saved world rules. New worlds use Dwarven Mythril: “Keep the Dwarven settlement fully suppressed, then connect an Extractor to its Mythril deposit. Cooperation now comes with a cable.” Legacy factories retain Dwarven Tribute and its cooperation text. Only the known obsolete title/detail pair is corrected in saved new-world hint history, including after the discovery is complete; custom text and other earned clues remain intact. The approved new-world correction supersedes NODE-0684’s earlier keep decision. [Status selection/history](../../src/ui/upgrades/statusHints.ts) and [HintBrowser](../../src/ui/upgrades/HintBrowser.tsx) own the actual Upgrades behavior.

The main game unlock Splitter and Merger together after production of the first Simple Core, with the shared requirement Produce 1 Simple Core. Simple Core itself has no research gate or card. Refiner access still controls where its recipe can be selected. Existing isolated Logistics practice fixtures remain independent. Complex Core research directly enables the half recipes and reveals all four corner locations, with no separate End of the World row or completion. Reactive guidance uses Complex Core completion to offer the corner and half-recipe steps; it does not wait for a produced Complex Core.

The review display places Iron prospects immediately after Simple Core. Its clue is “Copper can’t do everything.” in both the selector and review. Row numbers reflect that review order; this supporting clue retains its existing eligibility, is browsable once unlocked and does not replace the Upgrades primary hint.

Road uses “Resources don’t cross borders on their own.” in both its primary and optional selector branches and the review. It remains primary after Exploration until Road research completes; its eligibility and transport rules are unchanged.

Exploration uses “We should probably look around.” in both selector branches and the review. It remains primary after the first Basic Core until Exploration research completes; eligibility and discovery rules are unchanged.

The factory is thirsty uses “Dry land has its limits.” in the selector and review. It retains its Lake/Water Tools conditions and map or Extra Map Point routing.

When a control, recipe, research price or Road rule changes, inspect practice fixtures, allowed choices, completion conditions and dialogue together. Keep target highlights aligned with real sockets and controls. Use clear instructions and the project's dry, understated voice; humor must not hide an action or goal.

Read and update the [UI style guide](../node-ui-style-guide.md) and [review notes](../typography-style-review.md) for player-facing copy or style changes. Normal-play observations belong in playtest reports with elapsed game time and resource use, separate from tutorial fixtures.

Sources: [runtime exports](../../src/tutorials/tutorialRuntime.ts), [definitions](../../src/tutorials/tutorialDefinitions.ts), [practice states](../../src/tutorials/tutorialState.ts), [placement guards](../../src/tutorials/tutorialPlacement.ts), [choices](../../src/tutorials/tutorialChoices.ts), [progress](../../src/tutorials/tutorialProgress.ts), [dialogue](../../src/tutorials/tutorialDialogue.ts), [journal](../../src/ui/DiscoveryJournal.tsx), [hints](../../src/ui/ResearchHintCard.tsx).

Coverage: [tutorial runtime](../../src/tutorials/tutorialRuntime.test.ts), [choices](../../src/tutorials/tutorialChoices.test.ts), [unlock invitations](../../src/tutorials/tutorialUnlocks.test.ts), [Control Groups lesson](../../src/tutorials/controlGroupLesson.test.ts), [journal persistence](../../src/persistence/discoveryJournal.test.ts).

The unmodded game stores learned hint copies and assignment acknowledgement in optional researchHintHistory. FactoryApp records candidates on engine publications while the modal is closed; the thought bubble reads that record on remount. New progress and reopening/loading select the live primary while keeping earlier clues browsable. History is per factory, not per sector or global browser setting. Normal slots retain it; old saves seed only current candidates and use existing Wood/Kiln progress to suppress the introduction. [History tests](../../previews/status-page/hintHistory.test.ts) cover malformed metadata, slot/copy/autosave isolation and undo; [integrated slot tests](../../src/ui/UpgradesIntegration.test.tsx) cover the adopted screen. Applied-mod factories retain their existing held-guidance UI.
