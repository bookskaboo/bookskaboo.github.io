# Production nodes

[System index](README.md) · [Node catalog](catalogs/nodes.md)

Production nodes gather resources, process recipes, assemble bots or create Forest Growth. Extractors and Lake Intakes are Production nodes. Carts, Trucks and Trains belong to Logistics even though they contain stock.

## Roles

| Node | Role and configuration |
| --- | --- |
| Extractor | Connect a natural reserve; the source determines the resource. Base cycle is 5 seconds with a five-item output buffer. |
| Lake Intake / Pump | Connect directly to a Lake; draws Water on its own rate. Uses serialized kind `fluidLink`. |
| Kiln | Runs Charcoal in the base game. |
| Smelter | Select Iron, Copper or unlocked Mythril Plate production before wiring. |
| Refiner | Select a one-stream part recipe or Simple Core. |
| Assembler | Select early components, Basic or Automata Cores, basic bot parts, Yin, Yang or Final Core. |
| Hydro Plant | Select local fluid processing such as Coolant or Copper Slurry. |
| Fabricator | Select multi-input advanced components, Hydro through Complex Cores or advanced bot parts. |
| Synthesizer | Select Mythril processing and applicable composite/recovery recipes. |
| Bot Plant | Feed one frame and one gun through their marked sockets; their combination selects the build automatically. |
| Recycler | Incoming recyclable material selects the recipe; supply Water separately. |
| Tree Planter | Fund growth with Wood, Iron Plate and Stone; connect the dedicated growth output to a Forest or Elder Grove. |
| Mining Drill | Select the target mineral; consume 20 Motors, then become a deposit. The Build catalog retains its Extraction category. |

The [recipe catalog](catalogs/recipes.md) lists actual machine assignments. Names such as Assembler II, Separator and Hydro Processor in older documents refer to Fabricator, Synthesizer and Hydro Plant respectively.

## Operation

Select a recipe before connecting a configurable machine. Availability follows research and machine access, so a factory can be configured before its first ingredients arrive. Recipe sockets use ingredient identities rather than the generic sockets in the node definition.

Production needs complete inputs and output space. Advanced batches reserve inputs and determine chance outputs when committed. Pausing a production node stops processing; completed stock can still route. Construction and global pause also affect when work occurs.

Extractor rewiring keeps matching stock and discards stock of a different resource. A depleted reserve cannot be replaced by feeding ordinary manufactured stock into the resource socket. Forest Growth is a dedicated material connection, rather than ordinary Wood cargo.

## Changes and verification

Node definitions own names, categories and base sockets; capabilities own behavior, capacities and efficiency families; node modules own appearance and embedded controls. A new recipe-driven machine generally needs entries in all three and in recipe groups. A new behavior also needs simulation and validation support.

Sources: [definitions](../../src/content/nodes.ts), [capabilities](../../src/content/nodeCapabilities.ts), [modules](../../src/content/nodeModules.ts), [simulation](../../src/simulation/engine.ts), [extended processing](../../src/simulation/progression.ts).

Relevant regression coverage: [recipe selection](../../src/simulation/recipeSelection.test.ts), [Extractor storage](../../src/simulation/engine.extractorStorage.test.ts), [reviewed production](../../src/simulation/reviewedProduction.test.ts), [efficiency](../../src/simulation/engine.efficiency.test.ts). See [recipes](recipes.md), [fluids](fluids.md) and [efficiency](efficiency.md).
