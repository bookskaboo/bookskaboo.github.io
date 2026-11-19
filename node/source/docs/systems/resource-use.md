# Resource use

[System index](README.md) · [Material catalog](catalogs/items.md) · [Recipe catalog](catalogs/recipes.md)

Resources support production, research, transport and world challenges. A material in a buffer is stock; a natural deposit is a reserve; a produced or extracted counter is historical output. Treating all three as interchangeable gives misleading balance results.

## Acquisition and demand

| Resource | Acquisition | Main uses |
| --- | --- | --- |
| Wood | Forest extraction; Goblin tribute; recycling | Charcoal, paid Forest Growth and downstream fuel demand |
| Iron | Finite deposits, Goblin tribute, Drills, regeneration and defeated Golem reserve | Plates, wire, gears, machinery and all later chains |
| Copper | Finite deposits, Goblin tribute, Drills, regeneration and defeated Golem reserve | Plates, gears, wire, circuitry and early Cores |
| Stone | Deposits, Goblin tribute, Drills, regeneration and defeated Golem reserve | Brick, Tree Planter funding and filling Deep Holes |
| Water | Lakes through Lake Intakes called Pumps; local Lake output | Coolant, Copper Slurry and Recycler input |
| Mythril | Dwarven tribute, defeated Mythril Golem, selected Drill deposits and compatible saved reserves | Mythril Plates, parts, Pure Mythril, Mesh, advanced bots and later Cores |

New ordinary maps do not roll natural Mythril deposits. Dwarven tribute is the early Mythril supply route. A Golem becomes an inexhaustible reserve after its AP payment, but still needs extraction. Earlier saved worlds can retain deposits absent from new generation.

## Consumption outside recipes

| Sink | What it consumes | Accounting rule |
| --- | --- | --- |
| Research Center | One of each still-required Core per completed cycle | Paid contributions persist per project |
| Settlements | Suppression Bots at recurring AP checks | Distinguish Goblin payments from Dwarven surplus credit |
| Golems and Ancient Dragon | Bots counted as AP | One-time Golem damage versus repeatable Dragon pieces |
| Tree Planter | 10 Wood + 1 Iron Plate + 1 Stone | Funds 100 Forest Growth units |
| Mining Drill | 20 Motors | Converts into a 1,000-unit selected mineral reserve |
| Deep Hole | Stone | Delivered Stone reduces the outstanding landfill bill |
| Ancient Foundry | 50 Circuit B + 25 Sealed Frames + 100 Mythril Gears | One complete set per piece |
| Ancient Reclamation | Accepted waste | Fractional credit by waste type |
| Elder Grove | Forest Growth | 1,000 growth per piece |

Ordinary node placement has a construction delay rather than a general ingredient bill. Moving items into vehicles or the shared pool transfers stock; it does not consume it. Recycling may destroy an item while returning only its fixed listed constituents.

## Bills and rates

Expand a recipe bill recursively as `required output / output per batch × inputs per batch`. State which alternative was chosen. For example, one Simple Core needs two Copper Gears, four Copper Plates, eight Copper and four Charcoal; with standard Charcoal production that means four Wood. One Basic Core needs one Copper Plate and one Iron Wire, giving two Copper, six Iron and four Wood through standard smelting.

For a fully supplied recipe, ideal output per minute is `60,000 / (base cycle ms × efficiency multiplier) × output per batch`. This excludes startup, delivery, output blockage and tick rounding. A 12/minute Road stream can constrain a faster factory; larger vehicle payloads raise that ceiling.

Mythril tribute requires continuing bot supply. Include that acquisition support when comparing regional factories. Include paid forestry inputs if passive regeneration is insufficient. Count input bags, output bags, committed batches, shared stock and non-cosmetic cargo once each. Do not count already-delivered research Cores again as spendable inventory.

## Implementation and related systems

[Items](../../src/content/items.ts), [recipes](../../src/content/recipes.ts), [world generation](../../src/simulation/worldGeneration.ts), [tribute](../../src/simulation/goblinTribute.ts), [progression recovery budgets](../../src/simulation/progressionRecovery.ts).

See [production](production-nodes.md), [sustainability](sustainability-and-recovery.md), [research](research.md) and [encounters](encounters-and-obstructions.md). Balance discussions remain in [progression and scaling](../progression-and-scaling.md); analytical bills do not establish normal-play completion times.
