# Saves and compatibility

[System index](README.md)

NODE stores game state locally in the browser. Three manual slots and an autosave retain the factory, world, research and applied mod. Undo uses a separate in-memory command history.

## Persistence boundaries

| Data | Storage |
| --- | --- |
| Three manual save slots | `factorinode.save-slots.v1` |
| Autosave | `factorinode.temporary-save.v1` |
| Shortcut assignments, geometry and attachments | Dedicated `factorinode.shortcut-*` keys |
| Node Map layout | `factorinode.node-map-layout.v1` |
| Unapplied mod draft | `nodefactory.mod-draft.v1` |

New-game autosave defaults to five minutes. Slot metadata includes name, saved time, game time and sector name. The Save / Load panel handles slot actions and file interchange. Browser storage is local to its origin/profile, so different development ports or the published URL can have separate saves.

An applied mod is embedded in game state and restored with the save. The editor draft remains separate unless explicitly loaded from the active mod. Templates and Control Groups live with game state; shortcut and map-layout browser preferences have their own persistence.

## Undo

The engine retains up to fifty state checkpoints for recorded commands such as placement, movement, deletion or wiring. Undo is not a continuously recorded simulation replay. Long-term recovery should use a saved slot or exported save rather than assuming every production event has an undo entry.

## Migration policy

Original version-one saves and earlier reconstruction payloads normalize into current state. Keep serialized IDs, schema fields and browser keys stable unless a deliberate migration handles them. **Complex Core** retains `command-core`; **Mythril** retains legacy `mithril` substrings in several recipe/item/research IDs. Dwarven settlements retain the `lizardSettlement` field and related module names.

Power equipment, cables, energy and affected in-flight cargo are archived under deferred infrastructure rather than simulated. Retired node aliases, old waste nodes, former recipe layouts and efficiency ranks have targeted migrations. Already-paid batches and cargo must not disappear when changing defaults. Existing reserves, overfilled buffers and legacy layouts can differ from newly generated content.

When changing a recipe, socket or capacity, inspect input/output stock, queues, committed batches, connections, in-flight transfers and templates. A display-name change should not become an item-ID change.

Sources: [slots](../../src/persistence/saves.ts), [keys](../../src/persistence/storageKeys.ts), [legacy normalization](../../src/persistence/legacyMigration.ts), [save types](../../src/persistence/saveTypes.ts), [retired equipment migration](../../src/content/retiredNodes.ts), [engine initialization](../../src/simulation/engine.ts).

Coverage: [retired nodes](../../src/persistence/retiredNodes.test.ts), [grid preference](../../src/persistence/gridPreference.test.ts), [efficiency migration](../../src/simulation/machineEfficiencyMigration.test.ts), [architecture and key compatibility](../../scripts/architecture.test.ts). See [mods](mods.md), [storage](storage-and-inventory.md) and [testing](testing-and-publishing.md).
