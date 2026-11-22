# Storage and inventory

[System index](README.md) · [Node capacities](catalogs/nodes.md)

Local storage buffers material inside a Map Node. Storage and Inventory also provide access to a shared global pool after Autonomous Logistics. These are separate from research contributions and unextracted resource reserves.

## Local buffers

Rapid machines, Doublers and Reclaimer retain ordinary machine input/output capacities. Doubled output does not double a Doubler's buffer; a finished oversized batch drains through the ordinary output buffer before another batch starts. Reclaimer has no Water inlet or Water buffer. [Landmark stock and batch rules](landmarks.md#stock-batches-and-routing) describe the implemented behavior.

| Node | Base capacity | Material policy |
| --- | --- | --- |
| Cart / Truck / Train | 20 / 40 / 80 | Solids of every Core tier; fluids excluded; Logistics category |
| Warehouse | 250 | Generic physical materials through its sockets |
| Waste Bin | 200 | WASTE family |
| Fluid Tank | 256 | FLUID family, currently Water and Coolant |
| Settlement Tribute | Goblins 100; Dwarven variants 100 / 120 / 288 | Encounter reward stock |
| Corner Tribute | 10 | Its corner piece |

[Landmarks](landmarks.md) retain ordinary recipe-machine capacities. Oversized completed Doubler batches wait in saved paid-batch state and enter the ordinary output buffer in order as space opens. Unknown Device instead has shared five-Core waiting and finished limits, with its consumed active Core held separately; it reserves two output spaces before starting.

Machine input and output buffers have their own rules and should not be inferred from these storage capacities. Per-item capacity, total capacity and in-flight reservation checks differ. FIFO queues preserve mixed-material order in buffers and production output.

## Shared pool

Storage deposits connected material into the global pool. The base cap is 1,000 per material across the world. Bot variants share a combined Suppression Bot cap while their AP buckets remain distinct. Historical overflow can remain when compatibility recovery preserves cargo.

Inventory withdraws one selected item per connected Filter per second when the Filter can accept it. Configure the Filter to select the desired material. Inventory is not a general output cable that can connect straight to an arbitrary machine.

Storage and Inventory initially allow one placement each. Placement repeatables add one each time. Storage begins with two incoming connections and Inventory with one outgoing connection; their respective connection repeatables add one. These limits are world-level capabilities, separate from the number of items a local buffer contains.

## Unlocks and compatibility

Autonomous Logistics and its placement/connection upgrades use Final-inclusive bills in the assembled research catalog. Do not infer early access from an older description of a shared storage pool. Carts instead unlock with Road and remain Logistics throughout Truck/Train upgrades. The saved `woodenChest` and `chest` kinds retain vehicle behavior.

Sources: [capabilities](../../src/content/nodeCapabilities.ts), [pool and withdrawal behavior](../../src/simulation/progression.ts), [research prices](../../src/content/research.ts), [vehicle capacities](../../src/content/cartUpgrades.ts), [queue handling](../../src/simulation/mixedOutput.ts).

See [routing](connections-and-routing.md), [roads](roads-and-vehicles.md), [fluids](fluids.md) and [saves](saves-and-compatibility.md). Relevant coverage includes [engine progression](../../src/simulation/engine.progression.test.ts) and [Road storage](../../src/simulation/roadStorage.test.ts).
