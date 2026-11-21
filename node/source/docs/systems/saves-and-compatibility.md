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

The optional hasProducedWithRefiner flag records a completed Refiner batch with positive item output and survives normal save/load even after the producer is removed. Missing flags remain unset; old produced totals and inventory are not treated as proof of machine provenance. Existing completed research IDs remain intact. This remains available to compatible catalogs; Splitter and Merger now use the saved produced['simple-core'] count instead. Their earlier completions remain valid even without that count. The retired simpleCore research ID remains readable while the recipe itself requires no completion marker. Existing complexCore completion directly grants the half recipes and four corner markers. Retain historical cornerComponents completion records and promote them to complexCore access on normalization, preserving already-earned recipes without a live retired project. Pre-project Final Core migration still uses the historical cornerComponents gate so Complex Core alone never grants the paid Final Core project. Revealing locations does not mark sectors visited or unlocked.

The saved research.queue stores up to four ordered projects and research.paused freezes only research processing. Unmodded migration initializes missing fields to an enabled queue, adopting a saved ordinary selection as its head while keeping bot priority outside the queue. Valid existing queue order, selected work, paid contribution bags, buffers and partial Center cycles persist. Reconciliation removes invalid/duplicate/completed/capped entries and limits the queue to four. Disabling a priority upgrade after reload returns to the saved queue while retaining explicit pause. [Queue coverage](../../src/simulation/researchQueue.test.ts) and [actual slot/replacement coverage](../../src/ui/UpgradesIntegration.test.tsx) exercise these rules.

Unmodded new, loaded and replaced factories use mapResearchMode: points. Existing destination quotes keep their exact bill/completion index and active or parked payments while releasing only the destination. Completion banks one point for later Map selection, without opening/visiting a sector. Existing points and map flags stay intact. Active bills remain quoted until completion; the next purchase uses the point schedule. Applied-mod factories are not automatically converted and retain their existing saved rule marker. Unsupported marker values are rejected. [Map conversion coverage](../../previews/status-page/mapPoints.test.ts) checks the retained bill and later spending.

The optional researchHintHistory stores assignmentAcknowledged and ordered unlocked hint title/detail copies for Upgrades. Slots, copies, autosaves and file-shaped JSON retain each factory's history. The game's factory observer records current candidates on engine publications even with the modal closed; the thought bubble uses the same record. Normalization drops malformed entries, de-duplicates titles and bounds loaded history to 256 copies without rejecting the factory. Old saves seed current candidates only; Wood/Kiln progress suppresses the introduction. Undo retains learned clues while replacing factories uses their own records. See [history coverage](../../previews/status-page/hintHistory.test.ts) and [integrated slot checks](../../src/ui/UpgradesIntegration.test.tsx).

The optional devTutorialPromptsSuppressed marker keeps automatic tutorial invitations and Dwarven discovery notices quiet in a Dev-used factory. It survives normal save channels and undo, while a new factory starts without it. Older explicit dev research/map flags or existing Dev Sources also suppress automatic notices without fabricating tutorialPromptsSeen entries. Manual lesson availability is unchanged.

## Saved world rules

Only new-game creation selects worldRulesVersion 2. Imports and loads without a marker normalize to version 1; explicit versions survive slot saves, copied slots, autosaves, exports, re-saves, undo and mod activation/removal. Unsupported world-rule versions are rejected rather than silently converted. Never infer a ruleset from the load date or explored-map count.

Version 2 enables guarded camp deposits, revised Deep Hole generation/completion and Lake access/capacity/relocation. Version 1 keeps Tribute and legacy obstruction behavior, including on unexplored maps generated later. New fields preserve guarded owner/lock and regeneration credit, generated/depletion hole origin, and completed grey terrain outside the active node graph. World generation selects the versioned algorithm from the saved marker and seed. Guarded-camp placement corrections apply to newly generated maps; loading a saved map preserves its node positions and cables. The camp’s reverse reserve link is rebuilt from guardedCampId. Default Stone Deposit titles become Stone on load and in templates without changing IDs, quantities or custom names.

The developer full-map reveal stores normal visited flags on every map, alongside its existing dev survey marker. Save/load preserves the explored appearance. Older dev saves with only the survey marker are not silently migrated; the enabled developer action can mark their maps visited on demand. Undo metadata for that command is transient and not serialized; it restores the earlier visit/discovery snapshot.

## Saved ground terrain

Ground terrain has a separate optional mapTerrainVersion (0 or 1) and authoritative mapTerrains coordinate-to-type record. Only new-game creation opts into version one. Missing/zero versions retain legacy generation and plain art on every map, including unexplored maps; neither worldRulesVersion 2 nor borderObstructionVersion 1 implies opt-in. Loading never reapplies reserve factors, generates missing assignments or resizes the layout. The rule version fixes the 1.5× placement weight and nine fixed sites; the saved endgame corner order retains encounter identity.

Slots, autosaves, copy, file interchange and undo preserve the complete assignment and adjusted node stocks/caps. Imports reject unsupported versions, incomplete/out-of-bounds layouts, unknown types, incorrect totals or invalid Home/corner/first-diagonal sites. An allowed early grid-size change rebuilds a version-one layout from seed and saved corner order; old worlds stay version zero. Training explicitly opts out. Tests: [terrain integration and compatibility](../../src/simulation/mapTerrain.test.ts).

Deep Holes no longer restrict exploration or purchases of adjacent maps under either world-rule version. This requires no saved marker migration: preserve hole origins, positions, stock, filling progress and completed ground, along with destination quotes and paid contributions. Existing quotes can resume without filling neighboring holes.

## Saved border layouts

Border terrain has an independent `borderObstructionVersion`. New games select version one and store the seeded shared-edge list in `borderObstructions`. Missing or zero versions normalize to an empty version-zero list; later discovery never retrofits terrain into an old world. Reload, imports, undo and mod activation preserve both layout and crossing research. Unsupported versions, malformed/duplicate/nonadjacent edges, right angles, protected-route violations and saved Roads lacking their terrain permission are rejected without deleting cargo or wiring. A permitted larger grid chosen before the first non-Home sector regenerates only a version-one border list at the new size; legacy worlds stay clear. Artwork clearance is a placement correction for subsequently generated sectors in border-version-one worlds. Already saved resource/obstruction positions and wiring are not moved on load, so older generated sectors can retain contact with a border. No new save marker or retrofit is introduced.

## Undo and recovery

The engine retains up to fifty state checkpoints for recorded commands such as placement, movement, deletion or wiring. Undo is not a continuously recorded simulation replay. Long-term recovery should use a saved slot or exported save rather than assuming every production event has an undo entry.

## Migration policy

Applied-mod Upgrades support is deliberately deferred. Factories with an applied package keep the existing Research screen and base/mod catalog, without automatic character/map conversion. No mod-price conversion policy has been selected. Removing the package adopts the ordinary unmodded Upgrades rules while retaining earned IDs/payments. Existing mod package persistence remains supported. See [mod scope](mods.md#content-and-rules).

[migrateUpgrades](../../src/simulation/upgradesMigration.ts) runs for unmodded save normalization, engine construction/replacement and return from a modded catalog. Existing Core migration runs first. The highest completed Core recipe project implies its preceding character upgrades; missing earlier milestones are filled without charging again. basicCore maps to Simple character completion, through finalCore mapping to Complex. Historical simpleCore alone and victory do not grant the new Final character upgrade; an explicitly saved finalBotUpgrade remains complete. No separate derived-tier field is stored. Reapplying migration has no further effect and the loader copies its input before normalization.

The integrated screen and migration preserve active/parked contributions, selection, queue, explicit pauses, inventory and partial lab progress. Actual Save / Load slots are covered by [integration tests](../../src/ui/UpgradesIntegration.test.tsx); the author study retains Test saved progress and Test saved map purchase for isolated compatibility examples. Normal game loads now adopt these reviewed unmodded rules. Existing campaign slots were not overwritten during browser verification; browser QA used a separate local origin and its own named test slot.

When a catalog change adds prerequisites to active research, selection reconciliation retains its already-paid Cores under the project ID before clearing the unavailable selection. Connector Mirroring now requires Complex Core research and adds Shiny/Complex inputs to its bill; old completed unlocks remain valid and unfinished lower-tier payments are not charged again.

Original version-one saves and earlier reconstruction payloads normalize into current state. Keep serialized IDs, schema fields and browser keys stable unless a deliberate migration handles them. **Complex Core** retains `command-core`; **Mythril** retains legacy `mithril` substrings in several recipe/item/research IDs. Dwarven settlements retain the `lizardSettlement` field and related module names.

Power equipment, cables, energy and affected in-flight cargo are archived under deferred infrastructure rather than simulated. Retired node aliases, old waste nodes, former recipe layouts and efficiency ranks have targeted migrations. Already-paid batches and cargo must not disappear when changing defaults. Existing reserves, overfilled buffers and legacy layouts can differ from newly generated content.

When changing a recipe, socket or capacity, inspect input/output stock, queues, committed batches, connections, in-flight transfers and templates. A display-name change should not become an item-ID change.

Sources: [slots](../../src/persistence/saves.ts), [keys](../../src/persistence/storageKeys.ts), [legacy normalization](../../src/persistence/legacyMigration.ts), [save types](../../src/persistence/saveTypes.ts), [retired equipment migration](../../src/content/retiredNodes.ts), [engine initialization](../../src/simulation/engine.ts).

Coverage: [retired nodes](../../src/persistence/retiredNodes.test.ts), [grid preference](../../src/persistence/gridPreference.test.ts), [efficiency migration](../../src/simulation/machineEfficiencyMigration.test.ts), [architecture and key compatibility](../../scripts/architecture.test.ts). See [mods](mods.md), [storage](storage-and-inventory.md) and [testing](testing-and-publishing.md).

Optional endgame.cornerMapAcknowledged and endgame.acknowledgedCorners persist discovery emphasis independently for the map and each corner. Missing values leave the newly revealed location pending until inspection. Acknowledgement does not spend resources, change research, visit sectors or purchase access.
