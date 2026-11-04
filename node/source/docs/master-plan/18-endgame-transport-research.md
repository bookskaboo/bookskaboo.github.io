# Endgame transport research

## Adopted direction (Q115, November 3, 2026)

The user adds two endgame research tracks, with associated transfer improvements:

| Working project name | Structure | Adopted benefit |
| --- | --- | --- |
| Advanced Road Channels | Increasing-cost ranks, stopping at five Roads per map face | Extend the current three-slot maximum to four, then five |
| Train Freight Capacity | Repeatable research with increasing costs | Increase Train inventory capacity and associated transfer quantities together |

Q118/Q116A fix ordinary local/Road quantities and Q128 the Train per-rank gains below. Q129 adopts Train prices below; Q132 adopts Advanced Road prices below; Q133 adopts Advanced Road availability below; Q130 adopts Train access and Q131 no maximum Train rank below. The new recurring Train and fourth/fifth slot projects remain planned; ordinary shipment implementation is recorded separately below. The six previously suggested QoL candidates remain unadopted; the user supplied these transport directions instead.

## Current runtime baseline (reconciled with NODE-0297)

- Road access begins with one slot per map face; Road Channels 1 and 2 raise this to two and three. Sending and receiving endpoints share each face's slot limit. Each face has its own limit.
- Cart, Truck and Train inventories hold 20, 40 and 80 solid items respectively. Existing vehicle research upgrades saved vehicles and templates in place, retaining stock, IDs and wiring.
- Solid Roads have no inventory of their own. Current Cart/Truck/Train Road dispatch budgets are **1/2/4 items per five seconds** from valid connected source stock into remote receiving space. Local vehicle transfers use **1/2/4** at the ordinary **400 ms** launch cadence and **1,000 ms** travel, with partial quantities constrained by stock/room.
- The lower-tier Q118/Q116A changes are implemented locally under [NODE-0297](../changelog/2026-11.md#node-0297); [implementation status](19-implementation-status.md) records the separate verification/migration limits. The new recurring Train ranks and fourth/fifth Road slots remain unimplemented.

Sources: [vehicle upgrades](../../src/content/cartUpgrades.ts), [research](../../src/content/research.ts), [existing Road channel projects](../../src/content/progression.ts), [dispatch interval](../../src/simulation/roadTransport.ts), [inventory transfer](../../src/simulation/engine.ts), [slot accounting tests](../../src/simulation/roadCapacity.test.ts). Source inspection is not a fresh transport playtest.

## Road channel extension

Preserve the existing one/two/three-slot progression. Add an increasing-cost fourth-slot rank and a more expensive fifth-slot rank, then stop offering further ranks. Five is the maximum **per face**, not five for the whole map and not five separately for imports and exports. Preserve paired endpoints, reversal/deletion behavior and per-face accounting.

This research supplies more parallel routes and increases aggregate face capacity. Q116A separately adopts vehicle-tier payloads of 1/2/4 per five-second Road dispatch. A slot unlock alone adds parallel routes rather than changing those vehicle-tier quantities.

## Coordinated vehicle capacity and transfer research

**User clarification after Q116:** increased transfer quantities apply **within a map node**. That clarification initially left amounts and inter-map scope open; Q118 subsequently adopts local 1/2/4 and Q116A adopts matching inter-map batches below. Train inventory gains must be accompanied by larger relevant within-map transfer quantities. The user further confirms that the lower-level **Cart → Truck → Train research progression itself must increase real throughput at each step**. Truck research grants a transfer improvement over the Cart baseline, and Train research another over Truck, when those ordinary lower-tier projects complete. These benefits do not wait for Final-Core research. Later repeatable Train research continues the same capacity/transfer progression.

Apply the confirmed transfer intent to relevant within-map loading/unloading paths. Q116A adopts matching 1/2/4 payloads across Roads between map nodes at the existing five-second interval. Identify local input/output limits that would otherwise strand the advertised gain. Filters and other logistics classification still add no independent processing delay/cap; preserve material compatibility, required waste separation, actual destination space and ordinary route rules. This is not a general speed-up of all material connections, fluid transport or Tree Planter growth.

Keep capacity, payload, departure interval and actual delivered rate distinct in controls/help. A buffer is measured in stored items; a shipment in items per dispatch; throughput depends on interval, routes, supply and receiving space.

## Lower-tier throughput requirements

| Stage | Current storage baseline | Required within-map transfer progression |
| --- | ---: | --- |
| Cart | 20 solid items | Establish the starting transfer capacity |
| Truck | 40 solid items | Higher loading/unloading and delivered-throughput capacity than Cart |
| Train | 80 solid items | Higher loading/unloading and delivered-throughput capacity than Truck |
| Researched Train ranks | Gain per rank open | Continue raising capacity and the relevant transfer amounts together |

These storage values are current runtime evidence, not a newly selected transfer amount. Apply each unlocked effect to existing/new vehicles and templates in every map, including custom-named vehicles. Use research state and canonical vehicle identity rather than display names to resolve the effect.

**Q118 adopted November 3, 2026:** the user selects option 1, granting **up to 1 / 2 / 4 items per relevant within-map transfer for Cart / Truck / Train**. Keep the existing ordinary launch cadence of **400 ms** and travel time of **1,000 ms**, with overlapping in-flight transfers. This gives theoretical per-connection ceilings of **150 / 300 / 600 items per minute** under continuous supply and unblocked receiving capacity. The ordinary 1/2/4 implementation is recorded in NODE-0297; the arithmetic ceilings are not measured sustainable factory rates. Partial quantities are bounded by available stock and receiving space; do not wait for a full vehicle/batch. Preserve mixed-output filtering and item conservation. Q128 adopts later Train rank gains below; Q116A separately adopts the matching Road payload below.

Acceptance must show Cart < Truck < Train in actual supported local loading/unloading capacity under the same continuously supplied/unblocked conditions. A larger buffer or faster visual pulse is not sufficient. Preserve stock, current batches, legal routing, destination-room limits and ordinary sorting rules; report real bottlenecks separately from the tier's offered transfer capacity.

## Adopted inter-map Road shipments (Q116A/Q116, November 3, 2026)

The user selects option 1: use the same **1 / 2 / 4-item Cart / Truck / Train progression** for inter-map Road shipments, while retaining **one dispatch every five seconds**. This resolves both whether the increase crosses map boundaries (Q116A) and the pending Road batch choice (Q116). Ordinary lower-tier research grants the relevant vehicle benefits; Q128 adopts later Train gains of +20 capacity and +1 item per local/Road batch per rank.

| Vehicle tier | Items per Road dispatch | Theoretical items/minute per Road |
| --- | ---: | ---: |
| Cart | Up to 1 | 12 |
| Truck | Up to 2 | 24 |
| Train | Up to 4 | 48 |

Actual batches remain limited by source stock, receiving room and valid endpoints. Five outbound Train-equipped Roads could offer **240 items/minute per face** before local supply, blockage and other limits. This is an arithmetic ceiling, not a sustainable-factory measurement. Preserve the shared import/export five-slot maximum; five inbound plus five outbound on one face is not granted.

The earlier full-load 20/40/80 alternative was not selected. The adopted Road interval is 5,000 ms, independent of the adopted 400 ms local launch interval and 1,000 ms local travel. Both ordinary tier packet policies are implemented locally under NODE-0297; the new recurring ranks remain planned. Q128 fixes later Train gains below; endpoint eligibility and material-order integration remain implementation/design work.

## Adopted Train research gain per rank (Q128, November 3, 2026)

The user selects option 1: **+20 stored items and +1 item per relevant local transfer and Road dispatch per rank**. For r completed ranks, Train capacity = **80 + 20r**, and both batch limits = **4 + r**. Ranks one/two give **100 / 120 capacity** and **5 / 6-item batches**. Keep local 400 ms launch/1,000 ms travel and Road 5,000 ms dispatch timing unchanged.

The +40/+2 alternative was not selected. The adopted effect preserves the ratio of one batch item per twenty inventory slots. At rank one, theoretical offered rates are 750 items/minute per relevant local connection and 60/minute per Road; rank two gives 900 and 72. These are ceilings, not measured sustainable delivery. Stock, receiving room and route rules still bound actual transfers. Q129 adopts Train price/growth; Q130 adopts availability below; Q131 adopts no maximum Train rank.

Use the Q127 one-entry recurring-research presentation for this line and the finite advanced Road-channel progression. Only the currently available/in-progress level is shown, with level/cost updating after completion. No research candidate or automated purchasing is adopted by that presentation rule.

## Adopted Train research prices (Q129, November 3, 2026)

The user selects option 1: rank r costs **ceil(1.5^(r − 1)) of each of all seven Core types, Simple through Final**, matching regeneration and Landfill. First five ranks cost **1 / 2 / 3 / 4 / 6 each**, totaling **7 / 14 / 21 / 28 / 42 physical Cores**. Quote each rank from the unrounded base and round up independently; consume required Core sets together. The linear alternative was not selected.

Existing ordinary Cart/Truck/Train research prices and their Q118/Q116A effects remain distinct. Shared pricing does not automatically import either regeneration's extra Mineral Regeneration 2 gate or Landfill's rank-45 cap. Q130 adopts Train availability below; Q131 adopts no cap; actual capacity/throughput payback remains unvalidated.

## Adopted Train research availability (Q130, November 3, 2026)

The user selects option 1: require **completed victory research AND ordinary Trains research** before the first rank is available. This establishes the 80-capacity/four-item-batch base tier before recurring gains. First Final Core production alone is insufficient; the pre-victory alternative was not selected.

No further ordinary research project, placed vehicle or victory-modal acknowledgement is required. Normal lower-tier Cart/Truck/Train research and its Q118/Q116A throughput gains remain available on their earlier progression path. Global Storage/Inventory access still follows first Final Core production independently. Q131 adopts no maximum Train rank.

## Adopted unlimited Train research (Q131, November 3, 2026)

The user selects option 1: **no maximum Train research rank**. Continue +20 storage/+1 local and Road batch item per rank with the approved increasing all-seven-Core price. Each rank increases offered capacity; production, source stock, receiving space and route rules still determine delivery. Actual sustainable rates and payback remain unvalidated.

The ten-rank cap was not selected. Keep one updating research entry with current level/cost. Do not inherit Landfill's rank-45 cap; preserve uncapped regeneration as a separate line. Handle large counters/cost displays and unit reservations without adding an unapproved gameplay cap.

## Adopted fourth/fifth Road-slot prices (Q132, November 4, 2026)

The existing one/two/three-slot chain stays intact. The endgame line has **two levels**: completed level one grants **four Roads per face**, level two grants **five**, then it is complete. Show one updating entry under Q127A rather than two future-level cards. Slot/UI direction and Q132 prices are adopted; Q133 access is adopted below.

The user selects option 1: **one of each of all seven Core types for the fourth slot**, then **two of each for the fifth**. This uses the first two prices of the shared base-one/1.5-growth ladder and totals **seven/fourteen physical Cores**. Both purchases together cost three of each Core type, including three Final Cores. Each bill is paid once globally for its research level, not once per map, face or placed Road. The two/three-each alternative was not selected.

These are global per-face slot limits, shared by incoming/outgoing endpoints, not vehicle storage or per-Road payload upgrades. Earlier Road-channel project prices are unchanged by this proposal. Q133 availability is adopted below; actual layout/throughput value remains unvalidated.

## Adopted advanced Road availability (Q133, November 4, 2026)

The user selects option 1: require **completed victory research AND the existing three-Road-per-face research (Road Channels 2)** before the first endgame level becomes available. First Final Core production alone is insufficient; the pre-victory alternative was not selected.

Preserve the earlier one/two/three-slot progression and require completion of the fourth-slot level before buying the fifth. No ordinary Trains research, placed vehicle or victory-modal acknowledgement is required. Global Storage/Inventory access keeps its separate first-production rule. These choices affect the new two-level line only; previous Road-channel project prices and availability stay unchanged.

## Conservation and integration requirements## Conservation and integration requirements

Preserve single-material Road compatibility and solid-only vehicles. Decide shipment limits using actual sender stock, receiver room and the supported capabilities of both ends. A partially available/receivable batch should not require a full vehicle to fill before useful movement; exact partial-batch handling remains to specify with the chosen payload model.

Batch transfers must remove and deliver each real item exactly once. Retain the current distinction between inventory commits and cosmetic pulses, or explicitly replace it with a conserved in-flight model; never credit both. Preserve stock, paired endpoints, routing and rank effects through research, undo and save/load. Apply researched vehicle capacities consistently to existing vehicles, new ones, templates and all maps without dropping existing cargo. Capacity calculation/normalization must read repeatable rank counts as well as completed vehicle-tier projects, so loading a save does not reset an upgraded Train to the current 80-item baseline.

## Verification required after implementation

Verify the full one/two/three/four/five-slot chain, rising fourth/fifth research prices, the five-slot cap, mixed-direction accounting, independent faces and restored paired slots after deletion/reversal. Test the final rank does not remain purchasable without a benefit.

Verify ordinary Truck research increases local throughput over Cart and ordinary Train research increases it over Truck, without requiring Final-Core research; then verify repeatable Train capacity and local loading/unloading quantities increase together at chosen rank boundaries. Q116A/Q116 inter-map expectations are 1/2/4 items per 5,000 ms dispatch; test minimum/partial/full batches, weaker endpoints, output blockage, mixed-item rejection, all relevant local logistics, existing/new vehicles and templates, cargo preservation and migration. Measure sustained delivered rates rather than using theoretical capacity or a cosmetic pulse count. No new rates or rank prices are validated by this design document alone.
