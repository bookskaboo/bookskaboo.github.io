# Endgame and victory

[System index](README.md)

Four seeded world-corner challenges produce pieces for Yin and Yang. The two halves combine into a Final Core. Victory is then a separate manually selected research project, after which the world remains playable.

## Corner challenges

| Encounter | Payment per piece | Output |
| --- | --- | --- |
| Ancient Dragon | 200 AP of supplied Suppression Bots | α Piece |
| Ancient Foundry | 50 Circuit B + 25 Sealed Frames + 100 Mythril Gears | β Piece |
| Elder Grove | 1,000 Forest Growth | γ Piece |
| Ancient Reclamation | 20 Metallic Fines, or equivalent mixed waste credit | δ Piece |

Reclamation values one Fines at 1/20 piece, Spent Flux at 1/132, Glassy Crust at 1/72 and Slag at 1/44. Accepted waste adds fractions. The Foundry requires its complete three-material bill. Grove uses dedicated Planter growth, so the growth supply must be local rather than shipped as ordinary cargo.

Each camp has a linked reward node with capacity ten pieces. New-world reward titles identify α/β/γ/δ Piece; legacy titles retain Corner Tribute. Challenges repeat while output has room. Fractional progress and excess supplied material survive saturation; Foundry can collect its next complete bill while its Tribute waits for collection. Camp locations and which pieces form each half are seeded and saved.

Factories with mapTerrainVersion 1 use implemented, saved [ground-terrain generation](map-nodes-and-exploration.md#ground-terrain-for-new-games). The saved corner order sets each quadrant's preference: Ancient Dragon/Badlands, Elder Grove/Grassland, Ancient Reclamation/Desert and Ancient Foundry/Rocky. Home and all four corner maps are Grassland; each first diagonal from Home has its quadrant's preferred terrain. Remaining assignments use 1.5× preferred weight within the fixed world quotas. Missing/zero terrain versions retain plain ground and legacy resource generation, including unexplored maps. The terrain reference owns reserve factors and size-change compatibility; the [dated design](../master-plan/22-map-terrain-tiles.md#corner-quadrant-preferences) remains supporting evidence.

## Halves and Final Core

Completing the Complex character upgrade (serialized finalCore) unlocks Yin, Yang and Final Core recipes and reveals all four corner locations on the Node Map. Shiny upgrade (complexCore) unlocks Complex Core only. End of the World remains retired as a separate project. Locked corners retain anonymous markers until their challenges are unlocked; revealing locations does not buy maps, mark visits, reveal surveys or bypass adjacency or prices. Visiting one corner before the upgrade reveals only that known corner in new factories. Older saves retain previously earned half recipes and all-corner knowledge through independent compatibility flags, without a free Complex upgrade or changed payments. One of three saved pairing patterns determines which two corner pieces make each half in the Assembler. Each half takes twenty base seconds; only this world's matching recipes are available.

Complex upgrade costs five of every earlier Core through Complex and follows Shiny upgrade. The unlocked Final Core Assembler recipe combines one Yin and one Yang over sixty base seconds. First Final Core production records an internal milestone and unlocks access to victory and Final Robotics subject to their prerequisites.

A Remarkably Indirect Conclusion costs one Simple, Basic, Automata, Hydro, Shiny, Complex and Final Core. The player must select it and fund it at the Research Center. First Final Core production alone does not trigger victory.

## Continued play

Victory unlocks resource, Lake and Monster Camp relocation; Efficient Landfill; expanded Road channels; Train Freight Capacity; and Resource Regeneration, with each project's additional prerequisites still applying. Advanced Road Channels caps at two completions; Efficient Landfill caps at 45. Other repeatables use their listed growth prices.

Resource relocation applies within a map and preserves reserve stock. In new worlds, Lake relocation automatically moves directly connected Lake Intakes, and Camp relocation moves the linked guarded deposit. Guarded deposits cannot move separately with Resource Relocation. Legacy worlds retain optional Intake grouping and linked Tribute movement. Corner challenges remain fixed. The Recycler is unlocked earlier by Intermediate Recycling, rather than requiring victory.

Sources: [quotas, pairings and research](../../src/content/endgame.ts), [corner runtime](../../src/simulation/endgameRuntime.ts), [victory milestone](../../src/simulation/researchRuntime.ts), [relocation controls](../../src/content/nodeModules.ts).

Coverage: [endgame](../../src/simulation/endgame.test.ts), [corner layout](../../src/simulation/cornerLayout.test.ts), [corner pacing](../../src/simulation/cornerPacing.test.ts). The [implementation report](../master-plan/20-endgame-implementation.md) and [Final Core run reports](../final-core-dry-run.md) retain their dated evidence; use current catalogs for revised numbers.

Guidance handoff (NODE-0859): give Promotion pending / Complex upgrade its own clue, “The current chassis is starting to feel temporary.” After completion, prioritize missing corner work. When its required pieces are owned but halves are missing, reuse Final Core / A complete picture with “The pieces are ready. The Assembler can introduce them.” and the saved world's first missing-half recipe. Only point to Final Core assembly with “It’s like they fit together.” once both halves are owned. A committed Final Core batch retains that assembly clue after its halves are consumed. Do not restore separate Yin/Yang cards. The author review retains 39 entries and now has 50 situations, including both assembly phases. Owned stock can be distributed; this does not establish delivery to one Assembler.
