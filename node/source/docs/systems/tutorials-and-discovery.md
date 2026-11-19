# Tutorials and discovery

[System index](README.md)

Tutorials teach controls in constrained practice states. The Discovery Journal and research hints track progress in the player's world. A practice lesson is not a normal-play balance run.

## Lessons

| Lesson | Main interactions |
| --- | --- |
| Basics | Placement, extraction, Charcoal, Plates, Gears, Simple Cores and lab delivery |
| Logistics | Joint placement/insertion, Splitter routing and Merger behavior |
| Expansion | Actual Wood production and Cart → Road pair → Cart delivery between practice sectors |
| Control Groups | Selection, creation, movement, independent selection and disbanding |
| Monster Camps | Obstruction boundaries, suppression and regrowth |

Definitions describe stages and target positions. Placement and choice guards restrict actions to the current lesson. Progress checks inspect actual state, so connecting a route without delivering its required output is insufficient where a lesson requires delivery. Dialogue and highlighting guide the same permitted action.

## Discovery and guidance

Gameplay milestones unlock tools and tutorial invitations. Visited map sectors populate encounter discovery. The journal keeps research completion timing, resource observations and saved discovery information rather than relying only on the short transient event list.

Research hints react to research completion, first production, visited sectors and corner-piece availability. They give a next useful clue while recipe, research and encounter panels retain exact requirements. The Dwarven discovery notice introduces the Mythril supply route without renaming the saved settlement fields.

## Maintaining lessons and copy

When a control, recipe, research price or Road rule changes, inspect practice fixtures, allowed choices, completion conditions and dialogue together. Keep target highlights aligned with real sockets and controls. Use clear instructions and the project's dry, understated voice; humor must not hide an action or goal.

Read and update the [UI style guide](../node-ui-style-guide.docx) and [review notes](../typography-style-review.docx) for player-facing copy or style changes. Normal-play observations belong in playtest reports with elapsed game time and resource use, separate from tutorial fixtures.

Sources: [runtime exports](../../src/tutorials/tutorialRuntime.ts), [definitions](../../src/tutorials/tutorialDefinitions.ts), [practice states](../../src/tutorials/tutorialState.ts), [placement guards](../../src/tutorials/tutorialPlacement.ts), [choices](../../src/tutorials/tutorialChoices.ts), [progress](../../src/tutorials/tutorialProgress.ts), [dialogue](../../src/tutorials/tutorialDialogue.ts), [journal](../../src/ui/DiscoveryJournal.tsx), [hints](../../src/ui/ResearchHintCard.tsx).

Coverage: [tutorial runtime](../../src/tutorials/tutorialRuntime.test.ts), [choices](../../src/tutorials/tutorialChoices.test.ts), [unlock invitations](../../src/tutorials/tutorialUnlocks.test.ts), [Control Groups lesson](../../src/tutorials/controlGroupLesson.test.ts), [journal persistence](../../src/persistence/discoveryJournal.test.ts).
