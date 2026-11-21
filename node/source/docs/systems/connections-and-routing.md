# Connections and routing

[System index](README.md) · [Node socket templates](catalogs/nodes.md)

Connections join compatible output and input sockets within a Map Node. Socket families describe accepted materials; validation also follows concrete materials through existing routing chains and buffers.

## Socket rules

Configure recipe machines before wiring. Their effective sockets come from the selected ingredients and products. Connector Mirroring is a Complex-tier utility project: it requires Complex Core research and costs 10 each of Simple, Basic, Automata, Hydro, Shiny and Complex Cores. Visual input/output order, rotation and Connector Mirroring preserve semantic port indexes, so rearranging a bank does not change which ingredient a cable supplies.

Generic families include ANY, RESOURCE, METAL, PLATE, CORE, WASTE, ROBOT_FRAME, ROBOT_WEAPON and ATTACK_POWER. ANY excludes deferred Power and Forest Growth. The general fluid classifier includes Water, Coolant and Copper Slurry, while the FLUID socket family currently accepts Water and Coolant. A generic socket does not override Road, vehicle, Recycler or natural-resource restrictions.

Natural reserves feed Extractors directly or through permitted pass-through routing. Inventory outputs feed Filters. Both ends of a Road require a directly connected freight vehicle. Forest Growth uses a dedicated matching socket. A Stone reserve cannot fill a Deep Hole without extraction. New-world guarded reserves reject new extraction connections until fully suppressed; retained connections pause during suppression loss. Once unlocked, the interior deposit’s outgoing cable may cross its own camp border, while other obstructions and unrelated cables remain blocked. New-world Lakes connect directly only to Lake Intakes, with a research-based limit of two/three/four distinct Intakes.

Guarded camps also have a system-owned refill connection, visible only while fully suppressed. Its dedicated camp output and deposit inlet cannot be used by player wiring, routing or cable deletion. It depicts the existing reserve regeneration with actual awarded quantities; it is not an ordinary cargo connection, consumes no player socket capacity and adds no second stockpile. The centered AP input and resource-to-Extractor route remain ordinary player connections. See [guarded refill behavior](encounters-and-obstructions.md#automatic-reserve-refill-connection).

[Landmark](landmarks.md) sockets retain ordinary transport rates. Tri Extractors have three independent five-item output buffers; a shipment removes stock only from its source outlet, and refunds retain that outlet. Unknown Device accepts any Core on one shared input and dispatches a FIFO mixed output; in-flight reservations count against its shared five-Core waiting limit. Reclaimer has no Water inlet.

## Routing nodes

Splitter and Merger unlock together automatically when the factory produces its first Simple Core. Their shared requirement is Produce 1 Simple Core. Stock alone, other Refiner output, Assembler construction and Basic Core production do not count. Previously completed routing research remains completed.

| Node | Rule |
| --- | --- |
| Joint | Transparent route shaping; adds a cable bend without its own production recipe |
| Splitter | Alternates incoming items between two smart outputs |
| Merger | Combines matching material streams; retained material constrains later wiring |
| Filter | Sends its selected material to the chosen outlet and everything else to the opposite outlet |

A Filter retains cables and stock when its assignment changes. If the outlet required by a queued item is blocked, the stream waits and both paths can stop. Suppression Bot strengths compare as one logistics material while stock retains AP.

Validation checks the proposed graph, including generic chains wired before their source. For example, Charcoal cannot reach an ore socket by passing through a Splitter. Mixed-product branches remain valid when the route can deliver an accepted product; wrong materials still cannot be inserted into a specific socket at runtime.

## Transfers and capacity

The separate [landmark proposal](../master-plan/23-map-power-ups.md) selects ordinary cable, vehicle and Road rates and their normal upgrades for Landmarks. Processing and yield bonuses do not add a connection transfer-rate bonus, so delivered throughput still depends on supply and routing. Landmark behavior is not implemented; current transfer rules remain unchanged.

The base cable launch interval is 400 ms and base travel time is 1,000 ms. Reservations include cargo already in flight so multiple sources cannot overfill the same target. Transparent routes retain their complete cable path for animation and delivery validation. Certain fluid, tribute and waste routes use batch rates rather than the ordinary one-item launch behavior.

Obstruction boundaries constrain cable geometry as well as placement. Active borders block unrelated cables with no extra clearance halo; buildings retain 12 world units. Completed grey hole terrain in new worlds permits both construction and cable crossings. Changing camp size can invalidate routes. When diagnosing a stopped line, inspect the actual source material, selected recipe, target room, required Filter outlet, in-flight reservations and obstruction path before assuming a production-rate fault.

Sources: [socket validation](../../src/simulation/connectionRules.ts), [material tracing](../../src/simulation/connectionMaterials.ts), [route planning](../../src/simulation/logisticsRoutes.ts), [routing and reservations](../../src/simulation/engine.ts), [lookup indexes](../../src/simulation/simulationLookups.ts), [obstructed connections](../../src/simulation/obstructedConnections.ts).

Coverage: [routing](../../src/simulation/engine.routing.test.ts), [logistics](../../src/simulation/logisticsRouting.test.ts), [mixed recipe resources](../../src/simulation/recipeCopyAndResources.test.ts). See [roads](roads-and-vehicles.md), [storage](storage-and-inventory.md) and [waste](waste-and-recycling.md).
