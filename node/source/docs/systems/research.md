# Research

[System index](README.md) · [Complete research catalog](catalogs/research.md)

Research combines free discoveries with paid projects. The single Research Center is anchored at Home. It consumes synchronized Core sets for the manually selected paid project; higher tiers continue requiring earlier Core supply.

## Discoveries and projects

Automatic milestones complete when their trigger occurs, such as extracting Wood, producing a Plate, encountering a Lake or producing the first Complex Core. They are not paid projects to start in the lab. Ordinary projects require all named prerequisites, including both the singular and plural prerequisite fields.

Each Core has its own recipe project. Simple Core unlocks automatically with the Refiner. Every later Core project costs five of each earlier Core and also requires the prior Core project and its machine/technology prerequisite. Unlocking a machine alone does not unlock all its recipes.

## Payment cycle

The base research interval is five seconds, including the first payment after selection. At each completed interval the lab consumes one of every still-outstanding Core type together. If any outstanding type is missing, cycle progress resets and stocked types wait. A type already fully paid is omitted from subsequent sets.

For an equal bill of five each through Basic, one cycle consumes one Simple and one Basic. Five continuously supplied base cycles take 25 seconds after selection, excluding delivery. This is five payment cycles, rather than ten separate Core-processing cycles.

Switching or canceling projects stores paid contributions under the project ID. Starting another project resets the cycle; returning restores the paid quantities. Completion applies effects, clears selection for that project and records its event. The UI's overall count totals consumed Cores, while badge details retain each type's cost and progress.

Standard paid Core costs have a minimum of five per required type. Projects whose bill includes Final Core retain their smaller listed amounts, including victory and postgame projects costing one of every Core. Mods may override bills. Use assembled prices in the generated catalog rather than raw literal values in an earlier definition.

## Repeatables and map purchases

Repeatables track completion counts separately. Growth prices round upward and apply the applicable Core minimum. Extra Map Point normally takes a destination quote from the Node Map; paid quotes preserve their target and price across switching and saving. Training and compatible mod overrides use the fallback schedule.

Efficiency research belongs to a node family. Research Center ranks cover Simple through Final, ending at 35% of the five-second base. [Efficiency](efficiency.md) explains rank replacement; [map exploration](map-nodes-and-exploration.md) owns destination pricing. Research availability, affordability and completed status are distinct.

## Implementation and checks

[Catalog and pricing](../../src/content/research.ts), [Core projects](../../src/content/coreResearch.ts), [research runtime](../../src/simulation/researchRuntime.ts), [cycle status](../../src/simulation/researchStatus.ts), [tree model](../../src/ui/researchTree.ts).

Relevant coverage: [timing](../../src/simulation/researchTiming.test.ts), [selection](../../src/simulation/researchSelection.test.ts), [research engine](../../src/simulation/engine.research.test.ts), [tree prerequisites](../../src/ui/researchTree.test.ts). The [older research catalog](../research-catalog.md) retains dated summaries and planning context; use this reference and its generated table for current implementation.
