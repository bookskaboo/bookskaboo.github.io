# Waste and recycling

[System index](README.md) · [Recipe quantities](catalogs/recipes.md)

Waste is material stock with routing and storage costs. Metallic Fines, Spent Flux, Glassy Crust and Slag can be separated, stored, recovered or supplied to Ancient Reclamation. Their actual sources and any chance rolls are listed per live recipe.

## Production and routing

The current Controller recipe guarantees one Metallic Fines alongside one Controller per 36-second base cycle. Earlier reports of probabilistic Controller waste describe an older rule. Read the current recipe catalog before assuming a former probability or waste source remains active.

Machines producing mixed output use a shared output stream and queue. Filters separate products from waste. If a required outlet blocks, the queue can stop useful output too. Waste Bins hold 200 units and support waste routing; they do not destroy their contents automatically.

## Recycler behavior

Intermediate Recycling unlocks the Recycler. Incoming material selects its matching live breakdown or unlocked waste recovery recipe. Water enters through the dedicated second inlet. Mixed recovery output uses the normal queue and should be sorted with Filters.

Standard breakdown consumes one item and one Water over two base seconds. Its returns are a fixed constituent map, rather than a reversal of the exact recipe used to create that item. Fuel Wood can be included, returns are deliberately limited, and raw-resource disposal recipes can have no output. Bot AP variants use the shared bot material for recipe matching.

Recovery recipes have their own input quantities, outputs and gates. Retired waste recipes remain defined only so paid legacy batches can finish. Recycler efficiency applies to its machine cycle; there is no separate stacking recovery multiplier.

## Reclamation

Ancient Reclamation accepts fractional credits: one piece requires the equivalent of 20 Metallic Fines, 132 Spent Flux, 72 Glassy Crust or 44 Slag. Mixed accepted waste adds fractions toward the same piece. Tribute stores ten pieces; output saturation preserves remaining progress and supplied material.

Rare waste should not be inferred as a mandatory progression ingredient merely because an older proposal lists it. The actual corner accepts alternatives. Compare recovery value against keeping waste for Reclamation and the production lost when mixed output backs up.

Sources: [waste and recovery recipes](../../src/content/progression.ts), [fixed breakdown maps](../../src/content/recycling.ts), [batch processing](../../src/simulation/progression.ts), [queues](../../src/simulation/mixedOutput.ts), [corner credits](../../src/content/endgame.ts).

Coverage: [reviewed production](../../src/simulation/reviewedProduction.test.ts), [endgame](../../src/simulation/endgame.test.ts), [routing](../../src/simulation/logisticsRouting.test.ts). See [recipes](recipes.md), [storage](storage-and-inventory.md), [endgame](endgame-and-victory.md) and [historical waste benchmark](../master-plan/13-recycling-and-waste-benchmark.md).
