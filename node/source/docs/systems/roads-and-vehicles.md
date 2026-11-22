# Roads and vehicles

[System index](README.md)

Roads carry one solid material stream between adjacent unlocked Map Nodes. The sending and receiving Road endpoints each require a directly connected Cart, Truck or Train. Roads store no cargo.

The engine owns Road shipment timing and payload iteration during sector simulation. [Road transport](../../src/simulation/roadTransport.ts) commits each item through existing material and direct-vehicle checks, using [TransportRuntime](../../src/simulation/transportRuntime.ts) for remote readiness and capacity. Existing pending physical cargo still reserves receiver room. Cosmetic cable pulses retain their deadlines without reserving cargo or inventory; cable removal delegates cancellation/refunds to the same transport owner. Legacy stored-Road recovery remains in its existing function and reuses the shared readiness/capacity helpers.

## Route construction

New-world river, mountain and chasm borders block Road placement across their entire shared edge until the matching project is complete. Preview and paired placement use the same permission query from either side; both endpoints are rejected together. Extra channels and moving along the wall do not bypass the restriction. Paired dragging also checks permission. Factory templates exclude paired-sector nodes, including imported template payloads.

Build production or routing → sending vehicle → exporting Road, then importing Road → receiving vehicle → local consumers or routing. Filters, Joints and Splitters belong before the sending vehicle or after the receiving vehicle. Fluids cannot use this route.

Placement creates both facing endpoints together only if both positions and face slots are legal. The chosen face must lead to an unlocked neighbor. A stationary plain right-click on either Road body reverses direction, swaps endpoint roles and disconnects endpoint cables for rewiring. Right-drag still pans; modifier-clicks retain their existing controls. Selecting the existing direction through the engine is a no-op. The direction panel describes flow relative to the current map.

[NodePlacementPlanner](../../src/simulation/nodePlacementPlanner.ts) plans paired placement; [NodeMovementPlanner](../../src/simulation/nodeMovementPlanner.ts) validates manual pair moves and attached cables. Both reuse the existing Road geometry and border permission queries. Their plans do not mutate either endpoint; the engine commits them under the existing checkpoint/publication protocol. Automatic expansion/load alignment continues to use its separate unconditional path and is not routed through manual move validation. Decommission still removes both endpoints and incident cables under the original engine command and Undo snapshot.

Direction commands belong to [RoadCommandRuntime](../../src/simulation/roadCommandRuntime.ts), behind the existing engine methods. Reversal requires both Road endpoints and rejects conflicting reciprocal references; missing optional back-references on older pairs remain accepted. This compatibility check is deliberately separate from travel's unlocked-adjacent reciprocal-pair validation. A real change records one undo checkpoint, refunds canceled physical cargo through the engine before removing each endpoint's cables, swaps input/output only for a changed mode, resets both progress values and publishes once. Cosmetic pulses do not refund stock. Unrelated cables and cargo retain their order. The owner reads the current factory on every call after load/undo. [Facade contracts](../../src/simulation/roadCommandRuntime.test.ts) cover these boundaries without changing placement, dispatch or navigation.

## Area Expansion and Road borders

Completing either Area Expansion level grows every field equally on all four sides and automatically reanchors every valid existing Road pair to the new borders, including inactive and unvisited maps. Both endpoints keep their IDs, reciprocal map/Road references, shipment direction, port assignments and attached cable records. The pair keeps its shared position along the border relative to the field center. The engine rebases positive coordinates and saved cameras together; on a built map, only the Roads and their vehicle cable curves change relative to the factory. All other node/resource geometry and internal cable shapes stay fixed.

Automatic border alignment does not use new-placement or manual-drag validation. An occupied destination or obstructed stretched cable cannot leave the endpoints behind at an old border. It does not delete or move other nodes, remove cables or grant crossing research. Ordinary cable obstruction rules still determine whether a retained cable can transfer. Manual placement and paired dragging retain their permission, collision and cable-path checks.

The same alignment runs when loading an expanded save or synchronizing field size after a mod change, repairing previously stranded pairs without a new save-version marker. Unavailable or conflicting endpoint references are not fabricated or reassigned. Coverage: [expansion completion, reversal, blocked placement and save repair](../../src/simulation/roadExpansion.test.ts).

Separately, completing Area Expansion redistributes the existing natural contents of eligible unvisited maps across the larger field before Road alignment. The incoming Road can remain on such a map while its unwired natural contents move. Maps with local cables or player-built infrastructure retain their natural layout. See [unvisited field layouts](map-nodes-and-exploration.md#field-layout-and-resources).

Natural redistribution reserves each incoming endpoint at its final border position before accepting a layout. Spawn checks and actual moves use the shared pair-layout function, so they agree on the endpoint's field-center parallel coordinate and reciprocal references. An incompatible natural proposal keeps the map's centered arrangement instead; Roads still follow their unconditional alignment rule. Built maps retain every non-Road position and internal cable shape.

## Traveling through a Road

Click the red Travel arrow outside the playable field, or double-click the body of either Road endpoint, to visit its connected adjacent Map Node, regardless of shipment direction. Navigation requires an unlocked destination and a reciprocal endpoint pair. It carries the previous map’s zoom and focuses and highlights the paired Road on arrival, on both first visits and revisits. Camera bounds keep that endpoint visible; its old saved center does not override Road arrival. Ordinary Node Map travel keeps its separate saved-center behavior. It does not alter the Road, its cables, or cargo. Single-click still selects and configures the Road. Dragging, socket wiring and modifier-clicks retain their existing controls; tutorial practice keeps its scripted travel.

Implementation: [validated Road pairs](../../src/domain/roadNavigation.ts), [click tracking](../../src/renderer/roadNodeTravel.ts), [field input](../../src/renderer/PixiPlayfield.tsx), [travel callback](../../src/ui/App.tsx). Coverage: [focused Road arrival](../../src/simulation/roadTravel.test.ts), [Road navigation](../../src/renderer/roadNodeTravel.test.ts), [sector travel](../../src/simulation/sectorTravel.test.ts).

## Road control test sandbox

The isolated [Road workshop](../../previews/road-workshop/README.md) contains nine connected test maps with twelve ordinary Road pairs and uses the main game’s adopted Road controls. Roads have no gear. Their external Travel arrows use one 32 × 32 CSS pixel shape in every direction, with Travel above in 12 CSS px UI sans. Stationary right-click reverses flow. Both Travel and double-click retain zoom and focus the paired endpoint. Zoom-out and panning leave room around the unchanged playable field for these controls. The workshop remains available for further review without campaign save storage. Tutorial practice keeps its authored views and scripted travel.

## Border crossing research

| Project | Highest Core tier | Bill | Prerequisites |
| --- | --- | --- | --- |
| River Bridges | Hydro | Five each, Simple through Hydro | Road, Hydro Core |
| Mountain Tunnels | Shiny | Five each, Simple through Shiny | Road, Shiny Core |
| Chasm Spans | Complex | Five each, Simple through Complex | Road, Complex Core |

Each independent project permanently permits ordinary Roads across every matching border worldwide. Players still place Road pairs and need an unlocked neighbor, clearance and a free channel on both sides. There is no crossing fee, upkeep, shipment delay, cargo loss or capacity penalty. Terrain remains after research and Road removal; no separate bridge or tunnel artwork is added. The normal field clips to its boundary; Road placement or movement shows the selected neighbor's matching terrain half in the existing cropped ghost. Legacy worlds keep clear borders and their existing Roads.

## Vehicle capacity and rate

| Global vehicle stage | Solid capacity per vehicle | Items per Road shipment | Ideal Road rate |
| --- | --- | --- | --- |
| Cart | 20 | 1 | 12/minute |
| Truck | 40 | 2 | 24/minute |
| Train | 80 | 4 | 48/minute |

The base shipment interval is five seconds. The ideal rates require stock at the sender and room at the receiver. The Road inspector labels this theoretical capacity Maximum transfer rate and explicitly explains those delivery constraints. It calculates `60000 × vehiclePayload(completed, freightRank) / roadTransferMs` using the runtime payload/rank helpers and active mod timing, including selected connection-profile overrides. Display fractional rates with at most two decimal places. A rank-two Train has six items per shipment: 72/minute at five seconds or 180/minute at a two-second mod interval. This is capacity for the pair in either endpoint’s inspector, not an observed delivery counter; empty stock or full receiving inventory leaves the maximum unchanged. Vehicle upgrades apply to existing and future vehicles and templates while retaining IDs, wiring and stock. A vehicle is a Logistics buffer, without a second timed production hop between its input and output stock.

Train Freight Capacity adds 20 capacity per Train and one item per Road shipment per completion. Its effects combine: rank `r` gives `80 + 20r` capacity and `4 + r` payload. A Road sends up to its payload, subject to actual eligible sender stock and receiver room.

## Channels and blocking

Each map face starts with one Road slot. Road Channels 1 raises this to two; Road Channels 2 raises it to three. Post-victory Advanced Road Channels adds one per completion, capped at two completions and five slots total. Sending and receiving endpoints share the face limit. Existing saved endpoints above a revised limit remain usable.

Missing or full receivers leave cargo at its source. Invalid double-export pairs do not dispatch. Loading older buffered Roads returns their cargo to eligible connected vehicles and preserves overflow in the shared pool. Old ineligible cables remain idle until rewired. `fluidRoad` persists as a hidden compatibility definition; fluid Road shipping is inactive.

Sources: [vehicle upgrades](../../src/content/cartUpgrades.ts), [Road dispatch and legacy cargo recovery](../../src/simulation/roadTransport.ts), [delivery/reservations](../../src/simulation/transportRuntime.ts), [shipment cadence](../../src/simulation/engine.ts), [placement geometry](../../src/simulation/roadPlacement.ts), [material tracing](../../src/simulation/roadMaterials.ts), [channel limits](../../src/simulation/progression.ts).

Coverage: [inspector capacity and runtime agreement](../../src/ui/RoadFlowPanel.test.tsx), [Road flow](../../src/simulation/roadFlow.test.ts), [capacity](../../src/simulation/roadCapacity.test.ts), [storage recovery](../../src/simulation/roadStorage.test.ts), [materials](../../src/simulation/roadMaterials.test.ts). See [map nodes](map-nodes-and-exploration.md), [routing](connections-and-routing.md) and [storage](storage-and-inventory.md).
