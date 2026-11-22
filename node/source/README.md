# NODE: Another Factory Game

A local-first factory automation game built with React, PixiJS and TypeScript. React owns the interface, PixiJS draws the active factory field, and the simulation runs independently of both renderers.

Start with the [documentation hub](docs/README.md) or the [system reference library](docs/systems/README.md). The library covers current mechanics and includes generated material, node, recipe, research, efficiency and bot catalogs.

## Run locally

```powershell
npm install
npm run dev
```

Open `http://127.0.0.1:4173/`. Use the same origin and port to retain access to that browser's local saves.

## Implemented game

Use the [system index](docs/systems/README.md) to find current behavior. Exact definitions come from the assembled catalogs; active mods and older saves can differ. The game uses local browser persistence and has no cloud-save service.

| Topic | Reference |
| --- | --- |
| Resources, production and recipes | [Resource use](docs/systems/resource-use.md), [production nodes](docs/systems/production-nodes.md), [recipes](docs/systems/recipes.md) |
| Research and tiers | [Research](docs/systems/research.md), [progression tiers](docs/systems/progression-tiers.md) |
| Maps, encounters and victory | [Exploration](docs/systems/map-nodes-and-exploration.md), [encounters](docs/systems/encounters-and-obstructions.md), [endgame](docs/systems/endgame-and-victory.md) |
| Logistics and storage | [Routing](docs/systems/connections-and-routing.md), [Roads](docs/systems/roads-and-vehicles.md), [storage](docs/systems/storage-and-inventory.md) |
| Saves, mods and controls | [Saves](docs/systems/saves-and-compatibility.md), [mods](docs/systems/mods.md), [controls](docs/systems/controls-and-factory-layouts.md) |

## Progression design goals

The [master development plan](docs/master-plan/README.md) owns intended direction and unresolved work. The [progression discussion](docs/progression-and-scaling.md) retains adopted balance decisions and dated evidence. Current implementation and intended design remain distinct where changes are pending.

The former README's detailed goals and numerical assumptions are preserved in the [November 18 snapshot](docs/archive/reference-snapshots/project-readme-2026-11-18.md#progression-design-goals).

### Map readability and factory size estimates

See the [historical estimates](docs/archive/reference-snapshots/project-readme-2026-11-18.md#map-readability-and-factory-size-estimates) and the [world design plan](docs/master-plan/04-world-and-encounters.md). These estimates are not new playtest measurements.

## Adding or editing nodes

Read [production nodes](docs/systems/production-nodes.md), [recipes](docs/systems/recipes.md) and [architecture](docs/systems/architecture-and-simulation.md). Keep definitions, capabilities, visual modules, recipe groups and connection validation aligned. Preserve saved IDs or provide a migration. Edit the owned content modules directly; the historical `scripts/sync-progression-content.mjs` source generator is retired and cannot regenerate the current catalog. Its [archive](scripts/archive/progression-proposal/README.md) preserves the original tool and inputs. `npm run docs:systems` refreshes documentation only.

## Verification

```powershell
npm test
npm run build
npm run docs:systems:check
npm run changelog:check
```

After catalog changes, regenerate with `npm run docs:systems`. After meaningful completed work, update `docs/changelog/entries.json` and run `npm run changelog`. See [testing and publishing](docs/systems/testing-and-publishing.md) for playtests, benchmarks and verification scope.

## Progression follow-up decisions

The [master review queue](docs/master-plan/10-decisions-and-review-queue.md) and [progression discussion](docs/progression-and-scaling.md) retain decisions and pending work. The [former README follow-up list](docs/archive/reference-snapshots/project-readme-2026-11-18.md#progression-follow-up-decisions) is a historical snapshot.

### Linear machine efficiency research

Current ranks and formulas live in the [efficiency reference](docs/systems/efficiency.md) and [generated rank catalog](docs/systems/catalogs/efficiency.md).

### Extra Map Point research and full world access

Current banked Map Point purchases, retained destination-quote compatibility and activation/travel rules live in [map exploration](docs/systems/map-nodes-and-exploration.md).

## Publishing the live game

The live game is [NODE](https://bookskaboo.github.io/node/). Follow [project instructions](AGENTS.md) and the [publishing reference](docs/systems/testing-and-publishing.md) for the complete authorized release and verification workflow.

## History and archived material

The [change history](CHANGELOG.md) and [searchable viewer](docs/changelog/index.html) track completed work and verified publications. The [archive index](docs/archive/README.md) identifies superseded references. Historical records, playtest saves and publication receipts remain available; use the system library for current mechanics.
