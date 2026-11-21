# Roads and vehicles

[System index](README.md)

Roads carry one solid material stream between adjacent unlocked Map Nodes. The sending and receiving Road endpoints each require a directly connected Cart, Truck or Train. Roads store no cargo.

## Route construction

New-world river, mountain and chasm borders block Road placement across their entire shared edge until the matching project is complete. Preview and paired placement use the same permission query from either side; both endpoints are rejected together. Extra channels and moving along the wall do not bypass the restriction. Paired dragging also checks permission. Factory templates exclude paired-sector nodes, including imported template payloads.

Build production or routing → sending vehicle → exporting Road, then importing Road → receiving vehicle → local consumers or routing. Filters, Joints and Splitters belong before the sending vehicle or after the receiving vehicle. Fluids cannot use this route.

Placement creates both facing endpoints together only if both positions and face slots are legal. The chosen face must lead to an unlocked neighbor. A stationary plain right-click on either Road body reverses direction, swaps endpoint roles and disconnects endpoint cables for rewiring. Right-drag still pans; modifier-clicks retain their existing controls. Selecting the existing direction through the engine is a no-op. The direction panel describes flow relative to the current map.

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

The base shipment interval is five seconds. The ideal rates require stock at the sender and room at the receiver. Vehicle upgrades apply to existing and future vehicles and templates while retaining IDs, wiring and stock. A vehicle is a Logistics buffer, without a second timed production hop between its input and output stock.

Train Freight Capacity adds 20 capacity per Train and one item per Road shipment per completion. Its effects combine: rank `r` gives `80 + 20r` capacity and `4 + r` payload. A Road sends up to its payload, subject to actual eligible sender stock and receiver room.

## Channels and blocking

Each map face starts with one Road slot. Road Channels 1 raises this to two; Road Channels 2 raises it to three. Post-victory Advanced Road Channels adds one per completion, capped at two completions and five slots total. Sending and receiving endpoints share the face limit. Existing saved endpoints above a revised limit remain usable.

Missing or full receivers leave cargo at its source. Invalid double-export pairs do not dispatch. Loading older buffered Roads returns their cargo to eligible connected vehicles and preserves overflow in the shared pool. Old ineligible cables remain idle until rewired. `fluidRoad` persists as a hidden compatibility definition; fluid Road shipping is inactive.

Sources: [vehicle upgrades](../../src/content/cartUpgrades.ts), [Road dispatch](../../src/simulation/engine.ts), [placement geometry](../../src/simulation/roadPlacement.ts), [material tracing](../../src/simulation/roadMaterials.ts), [legacy cargo recovery](../../src/simulation/roadTransport.ts), [channel limits](../../src/simulation/progression.ts).

Coverage: [Road flow](../../src/simulation/roadFlow.test.ts), [capacity](../../src/simulation/roadCapacity.test.ts), [storage recovery](../../src/simulation/roadStorage.test.ts), [materials](../../src/simulation/roadMaterials.test.ts). See [map nodes](map-nodes-and-exploration.md), [routing](connections-and-routing.md) and [storage](storage-and-inventory.md).
