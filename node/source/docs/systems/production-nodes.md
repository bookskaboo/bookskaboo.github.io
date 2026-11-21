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

[Landmarks](landmarks.md) are permanent seeded Production nodes in new standard worlds: Rapid machines, Tri Extractors, fixed-family Doublers, water-free Reclaimer and Unknown Device. Recipe landmarks use their ordinary unlocks without activation or repair fees. Unknown Device accepts any supplied Core, keeps a fixed five-second cycle, has shared five/five buffers and reserves two output spaces before consuming the oldest input. Its effect and recipes remain hidden in the interface.

[Tri Extractors](landmarks.md) have three independent five-item outlets and consume one ordinary reserve unit per three-item shared cycle. A full branch pauses the cycle. They use ordinary Extractor speed research, reject guarded/Golem sources and discard old branch stock when rewired to a different resource. Moving one leaves its reserve in place unless both are selected.

Select a recipe before connecting a configurable machine. Availability follows research and machine access, so a factory can be configured before its first ingredients arrive. Recipe sockets use ingredient identities rather than the generic sockets in the node definition.

Production needs complete inputs and output space. Advanced batches reserve inputs and determine chance outputs when committed. Pausing a production node stops processing; completed stock can still route. Construction and global pause also affect when work occurs.

Extractor rewiring keeps matching stock and discards stock of a different resource. In new worlds, guarded camp reserves accept new extraction connections only while fully suppressed. Suppression loss pauses extraction while preserving progress and existing connections; empty guarded reserves refill instead of collapsing. Lake Intakes are the sole source of new-world Lake Water, with the upgraded two/three/four connection cap.

Actual positive Refiner output sets the optional saved hasProducedWithRefiner production milestone. Both ordinary and extended/chance recipe paths set it only when a completed batch creates an item; access, placement, partial cycles, blocked output and stock do not count. The refiner-produced research trigger consumes that milestone when a catalog opts into it.

A depleted reserve cannot be replaced by feeding ordinary manufactured stock into the resource socket. Forest Growth is a dedicated material connection, rather than ordinary Wood cargo.

## Changes and verification

Node definitions own names, categories and base sockets; capabilities own behavior, capacities and efficiency families; node modules own appearance and embedded controls. A new recipe-driven machine generally needs entries in all three and in recipe groups. A new behavior also needs simulation and validation support.

Sources: [definitions](../../src/content/nodes.ts), [capabilities](../../src/content/nodeCapabilities.ts), [modules](../../src/content/nodeModules.ts), [simulation](../../src/simulation/engine.ts), [extended processing](../../src/simulation/progression.ts).

Relevant regression coverage: [recipe selection](../../src/simulation/recipeSelection.test.ts), [Extractor storage](../../src/simulation/engine.extractorStorage.test.ts), [reviewed production](../../src/simulation/reviewedProduction.test.ts), [efficiency](../../src/simulation/engine.efficiency.test.ts). See [recipes](recipes.md), [fluids](fluids.md) and [efficiency](efficiency.md).

Dev Source debugging uses each node’s real input grouping, including independent Foundry quotas and Recycler material/Water buffers. A directly supplied Recycler uses the same automatic recipe selection as ordinary material delivery. This does not change normal recipe inputs, cycle timing or ordinary routing. See [development tools](development-tools.md).
