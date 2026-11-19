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

Each camp has a linked Corner Tribute with capacity ten pieces. Challenges repeat while output has room. Fractional progress and excess supplied material survive saturation; Foundry can collect its next complete bill while its Tribute waits for collection. Camp locations and which pieces form each half are seeded and saved.

## Halves and Final Core

Producing the first Complex Core triggers End of the World, unlocking Yin and Yang recipes. One of three pairing patterns determines which two corner pieces make each half in the Assembler. Each half takes twenty base seconds. Only the recipes matching the world's saved pairing index are available.

Final Core research costs five of every earlier Core and requires End of the World and Complex Core research. Its Assembler recipe combines one Yin and one Yang over sixty base seconds. First Final Core production records an internal milestone and unlocks access to victory and Final Robotics subject to their prerequisites.

A Remarkably Indirect Conclusion costs one Simple, Basic, Automata, Hydro, Shiny, Complex and Final Core. The player must select it and fund it at the Research Center. First Final Core production alone does not trigger victory.

## Continued play

Victory unlocks resource, Lake and Monster Camp relocation; Efficient Landfill; expanded Road channels; Train Freight Capacity; and Resource Regeneration, with each project's additional prerequisites still applying. Advanced Road Channels caps at two completions; Efficient Landfill caps at 45. Other repeatables use their listed growth prices.

Resource relocation applies within a map and preserves reserve stock. Lake relocation keeps Pump connections; selecting the Pumps too moves their bodies together. Camp relocation moves linked Tribute nodes. Corner challenges remain fixed. The Recycler is unlocked earlier by Intermediate Recycling, rather than requiring victory.

Sources: [quotas, pairings and research](../../src/content/endgame.ts), [corner runtime](../../src/simulation/endgameRuntime.ts), [victory milestone](../../src/simulation/researchRuntime.ts), [relocation controls](../../src/content/nodeModules.ts).

Coverage: [endgame](../../src/simulation/endgame.test.ts), [corner layout](../../src/simulation/cornerLayout.test.ts), [corner pacing](../../src/simulation/cornerPacing.test.ts). The [implementation report](../master-plan/20-endgame-implementation.md) and [Final Core run reports](../final-core-dry-run.md) retain their dated evidence; use current catalogs for revised numbers.
