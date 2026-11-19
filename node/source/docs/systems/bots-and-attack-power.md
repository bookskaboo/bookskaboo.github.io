# Bots and attack power

[System index](README.md) · [All 25 builds](catalogs/bots.md)

Suppression Bots are consumable cargo carrying attack power, abbreviated AP. A Bot Plant combines one frame and one gun; the supplied parts select the build automatically. Bots supply settlements, mineral Golems and Ancient Dragon.

## Part tiers

| Tier | Frame | Frame AP | Gun | Gun multiplier | Matched AP | Base assembly seconds |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Basic Frame | 1 | Basic Gun | 1 | 1 | 20 |
| 2 | Sealed Frame | 2 | Cooled Gun | 2 | 4 | 40 |
| 3 | Mythril Frame | 3 | Focused Gun | 3 | 9 | 60 |
| 4 | Servo Frame | 5 | Pulse Cannon | 5 | 25 | 70 |
| 5 | Final Frame | 7 | Final Cannon | 10 | 70 | 100 |

AP equals frame AP multiplied by gun multiplier. Mixed tiers are allowed. The higher of the two tiers determines assembly time and required robotics research. For example, a Sealed Frame and Basic Gun produce 2 AP using tier-two assembly time and access.

The Bot Plant has separate frame and gun inputs. Basic parts are Assembler recipes; advanced parts use the Fabricator. Part manufacturing time is additional to Bot Plant assembly time. The [recipe catalog](catalogs/recipes.md) contains all part bills.

## Storage and payments

Bots with equal AP share the same stock bucket. Their saved item does not preserve the exact manufacturing combination. Logistics treats all AP buckets as one Suppression Bot material, while encounter calculations multiply each stored bucket's count by its AP.

Settlement checks recur every minute; Dwarven surplus credit differs from Goblin payment. Golem damage is cumulative until defeat. Ancient Dragon awards a piece per 200 AP and preserves surplus progress. Compare complete manufacturing and delivery costs per AP when choosing a build.

Final Robotics becomes available after first Final Core production and Command Robotics. It does not gate the first Final Core. Earlier descriptions of 72 AP Final Bots or 1/3/8/20 matched strengths are historical values.

Sources: [part matrix and AP normalization](../../src/content/botAssembly.ts), [automatic build choice](../../src/content/recipes.ts), [AP payments](../../src/simulation/progression.ts), [encounter simulation](../../src/simulation/engine.ts), [Final Robotics](../../src/content/endgame.ts).

Coverage: [production and bot behavior](../../src/simulation/engine.progression.test.ts), [AP payments](../../src/simulation/campBotPayment.test.ts), [settlement tribute](../../src/simulation/goblinTribute.test.ts), [endgame](../../src/simulation/endgame.test.ts). See [encounters](encounters-and-obstructions.md), [roads](roads-and-vehicles.md) and [resource use](resource-use.md).
