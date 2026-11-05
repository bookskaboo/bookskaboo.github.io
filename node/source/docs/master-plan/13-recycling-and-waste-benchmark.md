# Intermediate recycling and the waste-output benchmark

**November 5 balance revision (NODE-0320):** Reclamation uses the user's five-minute base-producer target: ten standard Controller Fines, or 66 Flux / 36 Crust / 22 Slag from their respective alternative-recipe producers. Mixed credits add proportionally. This replaces the temporary recycling-value quota and old shared-material-parity requirement below; recycling rules and the historical benchmark discussion remain intact. These rates are analytically sized and engine-tested, not measured average-factory waste. See [current implementation](20-endgame-implementation.md).

## Recorded direction (Q93, November 3, 2026)

The user provisionally favors local recycling value as the waste-credit reference, but defers final reclamation calibration until representative factory waste output is known. The corner should absorb roughly an average factory's ongoing waste, creating a choice between collecting existing byproducts and building lines deliberately for waste. Average factory composition and desired component cadence are undefined; there is no measured average waste rate.

Add a mechanism that consumes unwanted intermediates and reverts them to basic materials. This gives unwanted main products from deliberate waste-producing lines a recycling destination. These are adopted design goals. Q94 subsequently specifies a dedicated node and one-of-each raw-resource recovery; detailed composition, cycle/access and runtime integration remain open.

The existing four waste-recovery recipes and the corner's shared any-mixture meter remain in the plan. Waste Bins are storage. Intermediate recycling is a distinct requested capability.

## Representative factory evidence

- Define comparable output/service demand through Complex: all six Cores, research consumption and efficiency, Dwarven bot demand and forestry upkeep. Distinguish sustained output from depletion of stored stock.
- Compare a standard-recipe baseline with declared earlier/higher alternative-recipe scenarios. Measure each waste type separately; an optimized recipe mix is not automatically an average factory.
- Record waste produced, recycled, exported, delivered and buffered; blocked production; unwanted main products; game time; and resource/intermediate stock changes. Distinguish source output from constrained delivered flow.
- Compare collecting existing waste against deliberate waste production, with and without intermediate recycling. Count raw supplies, recovery returns, useful-product demand, machines and routing once across the combined factory.
- Current runtime differs from adopted waste recipes. Label previews as analytical scenarios and validate rates in ordinary gameplay after implementation. Follow browser-playtest and balance-run rules when a run is authorized. No run starts here.

For measured available waste-credit flow W per minute and desired component cadence C per minute, a candidate quota is W / C credits per component. Both depend on reviewed assumptions; C is still open. Intake and transport must carry W. Earlier 368k/1.16m waste equivalents are illustrations, not requirements.

The ±10% resource-parity target remains recorded. Compare it with the empirical waste-flow/pacing target and surface conflicts for review. Recovery value alone does not establish manufacturing-cost, resource and completion-time parity simultaneously.

## Adopted Recycler direction (Q94, November 3, 2026)

Unlock a dedicated Production node through early research around Hydro. Exact research prerequisite/name and price remain open. It has a star/ANY connector input accepting intermediates without selecting a different machine recipe for each incoming type. Basic resources may also be supplied: consume them with zero output. This is an explicitly requested destruction route for unwanted raw resources, distinct from Waste Bin storage.

An intermediate is consumed and can return at most one unit of each qualifying solid basic raw-resource type it was composed of, regardless of complexity or original ingredient amounts. Returned materials share one mixed output line and the player must filter it. Preserve the intended mixed-stream ordering and blockage behavior; typed destinations must not silently select convenient resources past other outputs and bypass sorting. Recovered outputs are raw resources, not Plates/Bricks. Q94A, November 3, 2026: the user excludes all fluid outputs. Return no Water or other fluid; fluid contents are not recovered. Remaining material in an intermediate is not promised as a proportional/full refund.

The user's one-of-each rule is recorded as requested, not replaced by an arbitrary refund percentage. Exact constituent classification is still needed: upstream solid fuel is included by Q96, while Q97 selects a fixed standard-recipe basis for ordinary/composite/alternative items, and treatment of non-intermediate goods/fluids. One star/ANY input does not itself decide multiple simultaneous connections. Exact port count, buffering, cycle/throughput, research and blocked-output handling also need design.

## Adopted per-item, per-resource cap (Q95)

Q95, November 3, 2026: the user rejects the batching recommendation and clarifies that maximum recovery is one of any individual resource, regardless of intermediate complexity. Keep per-item recovery; never scale resource quantities with the number of parts or raw units used to manufacture it. No batching exception or source-production recipe change is adopted.

Earlier fractional-cost recipe observations remain documented in the analytical reference and history. They do not authorize overriding this cap, silently grouping inputs or changing source recipes. Constituent eligibility still needs a reviewed table before runtime implementation.

## Adopted upstream fuel inclusion (Q96)

Q96, November 3, 2026: include Wood from fuel consumed upstream. The user instructs that the Motor should return Wood too. Motor recovery therefore returns one Iron, one Copper and one Wood in its mixed output. Count each raw-resource type once per input item even if many upstream branches use it. The one-unit cap and exclusion of all fluid outputs remain in force.

Trace fuel through its raw source for the eventual composition table: Charcoal contributes Wood. Do not multiply the Wood return by the quantity of Charcoal or number of smelting steps. The prior fuel-exclusion proposal is not adopted.

## Adopted fixed standard-recipe contents (Q97)

Q97, adopted November 3, 2026: give each intermediate one predictable recovery entry, derived from its designated standard manufacturing recipe chain. Include upstream solid fuel, exclude all fluids and deduplicate the basic-resource types to a maximum of one each. Basic resources themselves retain zero output. Use designated manufacturing recipes rather than recursively following every recycling/recovery route, which can lead back to the same item.

For example, every Mythril Gear returns one Mythril and one Wood under this design, including gears made with the composite recipe. Standard gear manufacture uses Mythril Plates and Charcoal/Wood, while the composite route also uses Copper. The fixed standard entry does not return that additional Copper. This is a partial, predictable recovery rule; it does not refund the actual bill of every source recipe.

The alternative is actual production-path contents: composite-made gears could return one Copper, one Mythril and one Wood, while standard-made gears return Mythril and Wood. This would require keeping origin information as identical items travel, mix, enter storage and survive save/load, with a rule for old items whose origin is unknown. The user selected option 1: use the fixed standard-recipe basis. Actual production-path tracking is not adopted. A generated composition reference is linked below; exact input eligibility and runtime integration still need review.

## Follow-up

After Q98, review the remaining input classifications, input coverage, the per-item recovery table, research access/price, production and mixed-output throughput, blockage, and save compatibility. Raw-resource destruction is adopted; output blockage behavior is still open and must not silently lose intermediate returns. Recheck complete production/recycling/waste loops and keep final reclamation calibration deferred until representative factory evidence and component cadence are available. Earlier corner cost vectors exclude this new Recycler; report its effects in explicit scenarios before revising parity or waste quotas.

See [component costing](12-endgame-component-costs.md), [economy](03-progression-and-economy.md) and [validation](08-quality-and-playtesting.md).


## Generated standard composition reference

The [readable return table](../../outputs/planning/recycler-standard-contents.md) and [JSON reference](../../outputs/planning/recycler-standard-contents.json) expand forty current standard primary products through their designated ordinary manufacturing inputs. Include upstream fuel Wood, discard fluid types, deduplicate solid types and cap each return at one. The graph resolves without missing standard dependencies or cycles; all entries have at most five solid outputs. Optional composites, six retired recovery recipes and secondary/chance waste outputs do not define standard composition.

Q101 subsequently accepts the forty current recipe-made goods represented here, including six Core types and four bots. Basic resources retain zero return. Waste and future special goods without a reviewed entry remain to classify; runtime integration is pending.

## Adopted two-second base cycle (Q98)

Q98, adopted November 3, 2026: process one input item every two seconds, the same base cycle for all eligible intermediates and zero-output basic-resource destruction. This is thirty input items/minute before blockage. With the current maximum five returned solid types, output load is at most 150 items/minute, matching one ordinary one-item/400 ms output connection. A Motor yields three outputs, so thirty Motors/minute offer ninety recovered items/minute. Travel, destination capacity, strict mixed-stream order and blocked Filters can reduce delivered rates; this is a processing target, not a measured factory rate.

The alternative is a one-second base cycle, sixty nominal inputs/minute, whose five-output cases offer three hundred items/minute and are constrained by the ordinary output line unless wiring/capacity changes. No Recycler efficiency-research family or special faster output transport is granted by this decision. Buffers must support whole result batches without item loss; exact capacity and blocking still need design. The user selected option 1: the two-second cycle is adopted; the one-second alternative is not. Runtime implementation remains pending.


## Expansion-rescue dependency (Q98 extension)

The user requests a persistent next-Map-Node resource budget and automatic Golem-path rescue if destruction/depletion makes expansion impossible. Escalating congratulatory modals and the three-rescue Iron/Copper/Stone achievement are part of the current requirement after Wood removal. See [expansion solvability and Golem rescue](14-expansion-solvability-and-golem-rescue.md) for draft text, source findings and open recovery rules. Q102 cancels Wood Golem/rescue and keeps the original four mineral encounters; further runtime integration remains pending.


## Adopted manufactured-input coverage (Q101)

Q101, adopted November 3, 2026: let the Recycler accept current recipe-made goods including research Cores and bots, using the same fixed standard composition, at most one of each solid resource and two-second cycle. This extends input coverage beyond component parts to other unwanted manufactured products. The generated forty-item table includes six Core types and four bot types; their input eligibility is now adopted design.

Use those entries for current craftable inputs; consumed research contributions are not physical Core stock and cannot be recovered. Basic resources retain zero-output destruction. Waste types, future corner/final components and any other goods without a reviewed composition entry still need explicit classification; do not infer refunds for them from this proposal.

The user selected option 1. A parts-only restriction is not adopted. This does not recover already consumed research contributions or retroactively change production costs. Reclamation calibration remains deferred to representative factory waste evidence.


## Adopted Hydro-era Recycling research (Q103)

Q103, adopted November 3, 2026: unlock the Recycler through a Recycling project after Hydraulic Assembly, priced at ten each of Simple, Basic, Automata and Hydro Cores: forty physical Cores in one research payment. This refines the requested early/Hydro timing. Hydraulic Assembly already unlocks Hydro Core manufacture, and recycling is not needed to make those Cores, so the project can be funded normally. The higher-tier items become recyclable when obtained without requiring another Recycler-specific tier unlock.

The alternative price is twenty of each, eighty Cores total, at the same gate. At the five-second base lab cycle, ten synchronized sets need fifty supplied lab-seconds; twenty sets need one hundred. These are lab work comparisons, not elapsed progression estimates. The project includes the dedicated node and accepted material/recovery rules together. The user selected option 1: the Hydraulic Assembly prerequisite and ten-of-each/four-Core price are adopted. The twenty-of-each alternative is not adopted. Q104 subsequently rejects waste inputs. Machine buffering, blockage and efficiency research remain to design; runtime integration is pending.


## Adopted waste-input rejection (Q104)

Q104, adopted November 3, 2026: reject Metallic Fines, Spent Flux, Glassy Crust and Slag as Recycler inputs. They are byproducts with explicit direct-recovery recipes and a future reclamation destination, not primary manufactured goods with a standard composition entry. Use their adopted Hydro Plant/Separator recovery or the endgame corner; basic resources and forty current recipe-made goods keep their adopted Recycler behavior.

Incompatible waste cannot enter or be consumed by this node; preserve existing stock and the intended need to filter mixed source batches. Do not silently skip waste to route a later useful product past the shared output queue. The alternative is accepting all four waste types as zero-output destruction at the ordinary two-second cycle. That would be a new direct waste-disposal route available through Hydro-era Recycling; Waste Bins themselves remain storage under either choice.

The user selected option 1. Direct zero-output waste disposal through the Recycler is not adopted. No waste composition/refund is inferred from the forty-item table. Q105 subsequently adopts buffers and blocked-processing behavior. Unsupported-item presentation and runtime integration remain to design.


## Adopted buffers and complete-result space (Q105)

Q105, adopted November 3, 2026: give the Recycler ten input-item spaces total and ten output-item spaces total, not ten per item type. Process accepted inputs in arrival order. Before consuming a resource-returning input, require room for its entire fixed return set; consume the input and add all returns together at cycle completion. If space is unavailable, pause processing and preserve input, returns and accumulated cycle progress. Intake can fill available input-buffer space, then ordinary backpressure stops further delivery.

Send each processed item's return set before sending any later item's returns, in fixed Iron/Copper/Wood/Stone/Mythril order for types present. Do not select a later compatible item past a blocked head item. Preserve the mixed stream's need for player filtering. Production can overlap output dispatch when complete-result storage permits; there is no extra sorting delay or independent output-speed upgrade.

Basic-resource destruction returns zero items and therefore needs no output space. It may continue at two seconds/item when that basic resource is at the input queue head, even if older returned solids are blocked. It cannot jump ahead of an older input that is waiting for return space. This retains predictable order and the dedicated disposal behavior.

Ten output spaces hold two current maximum-size five-resource return sets. That is a buffer allowance, not extra throughput. Show ordinary blocked/output-full status when processing cannot proceed, preserve stock and queue/progress across save/load, and retain normal conservation on route cancellation. Exact deletion/recovery semantics for manually removing the machine remain a separate implementation review.

The user selected option 1, adopting these buffer, FIFO and cycle-commit rules. Core Recycler design is settled; runtime catalog/queue/routing/research/save integration and validation remain to implement.
