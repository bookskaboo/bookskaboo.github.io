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

The separate [ground-terrain proposal](../master-plan/22-map-terrain-tiles.md#corner-quadrant-preferences) associates each encounter identity with a mild quadrant preference: Dragon/Badlands, Grove/Grassland, Reclamation/Desert and Foundry/Rocky. Its isolated preview reuses the current seeded corner order, guarantees the preferred terrain at each first diagonal from Home, and uses 1.5x preferred weight for the remaining maps. This planned terrain layer does not move encounters, change payments/rewards or implement game terrain generation.

## Halves and Final Core

Complex Core research directly unlocks Yin and Yang recipes and reveals all four corner locations on the Node Map. End of the World is retired as a separate research entry. No Complex Core production or corner visit is required. Locked corners keep anonymous markers until their challenges are unlocked; the reveal does not purchase maps, mark visits, reveal resource surveys or bypass ordinary map adjacency or prices. Existing completed Complex Core research applies these effects on load. One of three pairing patterns determines which two corner pieces make each half in the Assembler. Each half takes twenty base seconds. Only the recipes matching the world's saved pairing index are available.

Final Core research costs five of every earlier Core and requires Complex Core research. Its Assembler recipe combines one Yin and one Yang over sixty base seconds. First Final Core production records an internal milestone and unlocks access to victory and Final Robotics subject to their prerequisites.

A Remarkably Indirect Conclusion costs one Simple, Basic, Automata, Hydro, Shiny, Complex and Final Core. The player must select it and fund it at the Research Center. First Final Core production alone does not trigger victory.

## Continued play

Victory unlocks resource, Lake and Monster Camp relocation; Efficient Landfill; expanded Road channels; Train Freight Capacity; and Resource Regeneration, with each project's additional prerequisites still applying. Advanced Road Channels caps at two completions; Efficient Landfill caps at 45. Other repeatables use their listed growth prices.

Resource relocation applies within a map and preserves reserve stock. In new worlds, Lake relocation automatically moves directly connected Lake Intakes, and Camp relocation moves the linked guarded deposit. Guarded deposits cannot move separately with Resource Relocation. Legacy worlds retain optional Intake grouping and linked Tribute movement. Corner challenges remain fixed. The Recycler is unlocked earlier by Intermediate Recycling, rather than requiring victory.

Sources: [quotas, pairings and research](../../src/content/endgame.ts), [corner runtime](../../src/simulation/endgameRuntime.ts), [victory milestone](../../src/simulation/researchRuntime.ts), [relocation controls](../../src/content/nodeModules.ts).

Coverage: [endgame](../../src/simulation/endgame.test.ts), [corner layout](../../src/simulation/cornerLayout.test.ts), [corner pacing](../../src/simulation/cornerPacing.test.ts). The [implementation report](../master-plan/20-endgame-implementation.md) and [Final Core run reports](../final-core-dry-run.md) retain their dated evidence; use current catalogs for revised numbers.
