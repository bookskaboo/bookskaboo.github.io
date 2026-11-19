# Fluids

[System index](README.md) · [Fluid recipes](catalogs/recipes.md)

Water, Coolant and Copper Slurry are classified as fluids. They support local processing and cannot travel in freight vehicles or over Roads. Water-dependent factories normally need local Lake access. Post-victory global Storage/Inventory can move fluids through the shared pool; Roads remain solid-only.

## Water acquisition

A Lake is a World node with four directional outlets. Its Lake Intake is called a Pump in the current interface and uses kind `fluidLink`; it is a Production node. A directly connected Pump draws from a Lake. New-world Lakes require this Intake route for all Water and allow two direct Intakes at base, three with fluidLink5 and four with fluidLink6 or later. Legacy Lakes retain direct Water output and their two-Pump limit.

Each Pump draws `round(4 / Pump efficiency multiplier)` Water per second, limited by output room. Its base output capacity is 64. Base draw is 4 Water/second; at the final 0.35 multiplier the rounded draw is 11 Water/second. Incoming Lake-to-Pump wiring establishes the source; the Pump does not wait for a one-unit Lake shipment to create that draw.

## Processing and storage

Coolant uses four Water and one Iron Plate to make two Coolant in six base seconds at a Hydro Plant. Copper Slurry uses two Water, one Copper Wire and one Charcoal to make two Slurry in eight seconds. Downstream recipes use these fluids in pistons, circuits, Mesh and advanced components.

The `FLUID` socket family currently expands to Water and Coolant. Copper Slurry is a fluid for transport exclusion but does not pass a generic FLUID socket. It can reach its explicitly typed recipe inputs through compatible routes. A Fluid Tank's 256 capacity therefore does not imply it accepts every item classified as fluid.

Water transfer uses a higher batch rate than ordinary solids. Selected Coolant routes involving a Pump also have a special transfer rate, and a Pump fed by another node retains its existing fluid relay behavior. Inspect the actual route and input socket rather than assuming pressure, pipes or universal relay behavior. There is no pressure model.

## Geographic consequences

Hydro production introduces mandatory local fluid processing. Shiny and Complex continue using Lake-based production while solid Mythril intermediates can move between regions. Ship solids toward the fluid consumer or ship completed solid components outward. Fluid Routing unlocks local storage options; it does not activate fluid Roads.

Sources: [fluid classifier](../../src/content/items.ts), [socket families](../../src/simulation/connectionRules.ts), [Pump draw](../../src/simulation/progression.ts), [connection limit and transfer rates](../../src/simulation/engine.ts), [recipes](../../src/content/progression.ts).

Coverage: [progression](../../src/simulation/engine.progression.test.ts), [routing](../../src/simulation/logisticsRouting.test.ts), [Road materials](../../src/simulation/roadMaterials.test.ts). See [efficiency](efficiency.md), [storage](storage-and-inventory.md) and [progression tiers](progression-tiers.md).
