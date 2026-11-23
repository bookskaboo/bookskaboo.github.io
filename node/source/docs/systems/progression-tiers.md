# Progression tiers

[System index](README.md) · [Core recipe projects](../../src/content/coreResearch.ts)

The seven Core tiers are Simple, Basic, Automata, Hydro, Shiny, Complex and Final. Core recipes do not consume lower Cores. Research creates the continuing demand for all earlier tiers.

## Tier reference

| Tier | Core and machine | Direct recipe | Main dependency |
| --- | --- | --- | --- |
| 1 | Simple — Refiner | 2 Copper Gears → 1 Core, 5 seconds | Copper extraction, smelting, Charcoal and gear production |
| 2 | Basic — Assembler | 1 Copper Plate + 1 Iron Wire → 1 Core, 10 seconds | Balanced plate streams and Assembler research |
| 3 | Automata — Assembler | 1 Circuit A + 1 Brick → 1 Core, 15 seconds | Exploration, circuitry and Stone processing |
| 4 | Hydro — Fabricator | 1 Hydro Piston + 2 Circuit B + 2 Coolant → 1 Core, 20 seconds | Lake access, local fluid production and Hydraulic Assembly |
| 5 | Shiny — Fabricator | 1 Mythril Mesh + 1 Hydro Piston + 3 Circuit A → 1 Core, 30 seconds | Dwarven Mythril supply, refining, separation and fluid-dependent Mesh |
| 6 | Complex — Fabricator | 1 Circuit C + 1 Controller + 1 Servo Piston → 1 Core, 45 seconds | Precision Control, advanced parts and mixed Controller waste |
| 7 | Final — Assembler | 1 Yin + 1 Yang → 1 Core, 60 seconds | Four world-corner pieces and world-specific half recipes |

These are base cycles. Exact inputs, alternatives and unlocks remain in the [recipe catalog](catalogs/recipes.md) and [research catalog](catalogs/research.md). Complex Core keeps serialized item/recipe ID `command-core`; Command Robotics and Command Bots retain their names.

## Access and geography

Simple Core has no research gate and is selectable in an accessible Refiner. In unmodded factories, Simple character upgrade is available immediately and costs five Simple Cores to unlock the Basic Core recipe. Later upgrades require only their predecessor and five of each Core through the named tier, unlocking the next Core. Machine/technology access is still needed to build the producer and make its ingredients. Splitter and Merger unlock together on first Simple Core production. Applied-mod factories retain their existing Core research gates until support is revisited.

Exploration opens adjacent Map Nodes; Roads carry solids between them. Hydro introduces local Water-dependent processing because Roads exclude fluids. Shiny adds Mythril acquisition and refining. Complex depends on advanced parts and makes Metallic Fines through Controllers. Completing Complex character upgrade (finalCore) opens Yin, Yang and Final Core recipes and reveals all four corner locations; Shiny upgrade (complexCore) grants Complex Core only, with no separate End of the World research entry. Their maps still require ordinary exploration purchases and travel.

The corner challenges can be supplied repeatedly. Yin and Yang each combine two pieces determined by the world's pairing index. Producing a Final Core makes the victory project available; victory requires manually researching A Remarkably Indirect Conclusion with one of all seven Cores.

## Scaling and balance scope

Keep earlier lines productive while introducing new bottlenecks. Character/research bills, Map Point prices, machine upgrades, encounter supply and corner deliveries all compete for resources. A factory's rate is bounded by its slowest sustained production or delivery stage.

Pacing targets and strategies are recorded in [progression and scaling](../progression-and-scaling.md) and the [master economy plan](../master-plan/03-progression-and-economy.md). Their older numeric examples can predate the current recipes. Validate elapsed game time, setup overhead, resource use and delivered output together before treating an analytical rate as playthrough evidence.

Sources: [Core projects](../../src/content/coreResearch.ts), [recipes](../../src/content/recipes.ts), [later recipes](../../src/content/progression.ts), [endgame](../../src/content/endgame.ts). See [resource use](resource-use.md), [map nodes](map-nodes-and-exploration.md) and [endgame](endgame-and-victory.md).

## Character progression

The adopted unmodded [Upgrades screen](research.md#character-progression) maps stable next-Core recipe IDs onto their preceding character upgrade. Final character upgrade spends five of all seven Core types and remains separate from victory. The [migration](saves-and-compatibility.md#migration-policy) preserves recipe access and payments, fills implied earlier milestones and derives the robot stage from completions. Character bills and exact current prerequisites are in the generated research catalog.
