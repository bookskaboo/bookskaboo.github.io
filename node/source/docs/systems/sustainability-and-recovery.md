# Sustainability and recovery

[System index](README.md)

Expansion exposes finite mineral reserves and renewable Wood. Regeneration, Tree Planters, Mining Drills, tribute and defeated Golems offer different ways to sustain supply. Automatic recovery addresses demonstrated progression shortages.

## Forests and growth

A Forest naturally restores one Wood reserve unit every 30 seconds while below its capacity. Extractors remove stock from that reserve. Tree Planter research adds the Forest Growth inlet.

A Tree Planter consumes ten Wood, one Iron Plate and one Stone to fund 100 growth units. It emits four units per second before efficiency upgrades. The base growth output buffer is five; the designated forestry capacity rank raises it to twenty. Connected growth restores Forest stock up to its capacity. The same dedicated material can supply Elder Grove directly.

Post-victory Resource Regeneration adds the original regeneration rate again per completion, so Forest period becomes `30,000 / (1 + rank)` ms before mod overrides. Growth restores reserves; it does not bypass Extractors to create ordinary Wood in a factory buffer.

## Minerals

Without mineral regeneration, depleted mineral nodes normally convert to Deep Holes and lose their old reserve role. Base-game pre-Exploration reserves are retained for starting recovery. Mineral Regeneration lets surviving mineral reserves refill at one unit per 30 seconds; its second upgrade uses 15 seconds. Repeatable mineral rate ranks divide the period by `1 + 0.2 × ranks`, and post-victory Resource Regeneration divides it again by `1 + rank`.

A Mining Drill consumes one Motor per base second until twenty have been consumed, then becomes a 1,000-unit deposit of the selected Iron, Copper or Stone. Mythril is not an accepted Drill target. A defeated mineral Golem becomes an infinite reserve of its mineral. Both still require extraction. Legacy Tribute instead outputs ordinary material stock directly. New-world camps guard finite, capped deposits that refill without regeneration research while fully suppressed. Their camp-specific base rates use all existing mineral regeneration multipliers, never collapse when empty and pause without losing stock or fractional credit when suppression lapses. The first actual Dwarven deposit extraction unlocks Mythril Refining.

## Progression recovery

Recovery calculations compare available stocks, reserves, recipe alternatives, research access and relevant acquisition options. Ordinary slow or disconnected production is not enough to establish a shortage. Locked guarded reserves are excluded from collectable stock; automatic expansion recovery does not route through a known generated-hole exploration block. Checks exclude training, modded games and worlds using Dev Sources.

Starting recovery can restore local mineral capacity when the next required early progression step has a demonstrated deficit, including a later recurrence before Exploration. Expansion recovery evaluates the next map bill, preserves already-paid quotes and can open a route to a relevant Golem reserve and defeat that target. Each expansion-rescued mineral is tracked to prevent repeating that rescue. The three-mineral expansion rescue sequence can award Destructive Testing.

These checks use conservative budgets and relaxed alternatives to avoid treating uncertain production as proof of a softlock. They are implementation recovery behavior, not tools for a normal-play balance run. Do not inject saves or grants to claim progression has been validated.

Sources: [Planter behavior](../../src/content/forestry.ts), [depletion](../../src/simulation/engine.ts), [regeneration](../../src/simulation/progression.ts), [progression budgets](../../src/simulation/progressionRecovery.ts), [recovery actions](../../src/simulation/expansionRescue.ts).

Coverage: [Planter supply and delivery](../../src/simulation/cornerPacing.test.ts), [progression recovery](../../src/simulation/progressionRecovery.test.ts), [Golems](../../src/simulation/resourceGolems.test.ts). See [resource use](resource-use.md), [encounters](encounters-and-obstructions.md) and the [recovery design history](../master-plan/14-expansion-solvability-and-golem-rescue.md).
