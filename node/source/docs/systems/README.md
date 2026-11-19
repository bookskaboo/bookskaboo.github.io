# NODE system reference

Current local implementation reference, established November 18, 2026. Use these documents to understand how the systems interact and where to change them. Follow the generated catalogs for exact base-game data; active mods and migrated saves can retain different values.

## Factory and economy

| System | Covers |
| --- | --- |
| [Resource use](resource-use.md) | Acquisition, direct consumers, special sinks, raw bills and throughput accounting |
| [Production nodes](production-nodes.md) | Extractors, Lake Intakes, recipe machines, Bot Plants, Planters and Drills |
| [Recipes](recipes.md) | Availability, ingredients, batches, output blocking and alternatives |
| [Research](research.md) | Automatic discoveries, paid projects, synchronized Core sets and repeatables |
| [Progression tiers](progression-tiers.md) | Seven Core tiers, recipe access and the continuing demand for early production |
| [Efficiency](efficiency.md) | Node-owned upgrades, tier ranks and realistic throughput limits |
| [Connections and routing](connections-and-routing.md) | Socket families, material validation, Splitters, Mergers, Joints and Filters |
| [Roads and vehicles](roads-and-vehicles.md) | Paired Roads, direct vehicles, payloads, capacities, directions and channels |
| [Storage and inventory](storage-and-inventory.md) | Local buffers, shared pool, withdrawal and placement limits |
| [Fluids](fluids.md) | Lakes, Pump draw, Water, Coolant, Copper Slurry and geographic limits |
| [Sustainability and recovery](sustainability-and-recovery.md) | Forest Growth, regeneration, Drills, depletion and automatic recovery |
| [Waste and recycling](waste-and-recycling.md) | Mixed outputs, waste storage, recovery and fixed breakdown returns |

## World and objectives

| System | Covers |
| --- | --- |
| [Map nodes and exploration](map-nodes-and-exploration.md) | Grid, Home, destination prices, discovery, generation and field expansion |
| [Encounters and obstructions](encounters-and-obstructions.md) | Settlements, tribute, Golems, Deep Holes and ruins |
| [Bots and attack power](bots-and-attack-power.md) | Part tiers, automatic assembly, AP buckets and encounter payments |
| [Endgame and victory](endgame-and-victory.md) | Four corners, pieces, world pairings, Final Core and post-victory research |

## Interaction and maintenance

| System | Covers |
| --- | --- |
| [Controls and factory layouts](controls-and-factory-layouts.md) | Placement, grid, groups, recipe copy, shortcuts and templates |
| [Tutorials and discovery](tutorials-and-discovery.md) | Practice lessons, milestone invitations, journal and research hints |
| [Saves and compatibility](saves-and-compatibility.md) | Slots, autosave, imports, undo, migrations and serialized IDs |
| [Mods](mods.md) | Data content, profiles, validation, activation and share codes |
| [Interface and assets](interface-and-assets.md) | Typography, voice, icon/art ownership, panels and responsive behavior |
| [Development tools](development-tools.md) | Dev Sources, debugging grants and separation from normal-play evidence |
| [Architecture and simulation](architecture-and-simulation.md) | State ownership, ticks, renderer boundary, routing and content modules |
| [Testing and publishing](testing-and-publishing.md) | Verification scope, playtests, benchmarks, documentation upkeep and release checks |

## Reference catalogs

| Catalog | Exact data |
| --- | --- |
| [Materials and resource use](catalogs/items.md) | Every named item, ID, transport classification and direct recipe consumers |
| [Nodes](catalogs/nodes.md) | Definitions, categories, unlocks, behaviors, socket templates and default capacities |
| [Recipes](catalogs/recipes.md) | Live recipe groups, ingredient/output quantities, chance outputs, cycles and gates |
| [Research](catalogs/research.md) | All live projects, prerequisites, first-purchase prices and effects |
| [Efficiency](catalogs/efficiency.md) | Every machine rank and its cycle multiplier |
| [Bot assembly](catalogs/bots.md) | All 25 frame/gun combinations, AP, assembly times and unlocks |

Generate these six catalogs with `npm run docs:systems`. Check freshness and local links with `npm run docs:systems:check`. The generator imports the assembled runtime catalogs, including price normalization and recipe grouping, without loading saves or running a game.

## Maintaining the library

Each system document owns its current behavior, system boundaries and implementation entry points. Keep exact catalog rows generated; explain formulas and special behaviors in the system documents. Update both when a rule changes. Use **Complex Core** and **Mythril** in prose while preserving compatibility IDs. Extractors and Lake Intakes are Production nodes; Carts, Trucks and Trains are Logistics nodes.

Every future NODE chat must update affected documents and catalogs in the same change, without a separate reminder. Extend an existing reference where possible; add and index a document for a new major system. Use the [changelog](../changelog/README.md) as the primary history for implementations, decisions, reversals and deferrals. System documents hold the current state and link relevant NODE records; they should not accumulate a second chronological change log. Detailed plans, playtest reports and required style review notes remain supporting records.

The current implementation calls the Lake Intake a **Pump** (`fluidLink`); this library uses that label when discussing its controls and runtime behavior. The [documentation hub](../README.md) separates system references from proposals, design history, style rules and dated playtest evidence. Earlier documents remain in place so existing links and decision records continue to work.
