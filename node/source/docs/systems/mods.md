# Mods

[System index](README.md) · [Full mod authoring guide](../mods.md)

Options → Mods edits a data package for the current factory. Supported fields change existing catalogs or create custom entries based on supported behaviors. Applying a draft changes the active factory after validation; editing a draft alone does not activate it.

## Content and rules

Applied-mod factories keep the existing Research screen and their base/mod research catalog. The new [Upgrades screen](research.md) is adopted only for unmodded factories; applied-mod pricing and character-progression support remain deliberately deferred. Existing packages, validation and loading remain supported. Removing a package adopts ordinary unmodded progression with earned IDs/payments preserved. No mod-price replacement policy is implied by that fallback.

Packages can override resource names/colors, nodes, recipes, research, world spawns, map dimensions and connection/construction timing. Custom IDs begin with `mod-`. Custom nodes inherit an available production, router, buffer or world template; a data package does not add arbitrary executable simulation behavior.

Map and connection profiles are named presets, with one selected preset per category. Unspecified fields inherit defaults. Explicit socket overrides replace dynamic recipe/resource sockets only when enabled; ingredient requirements still apply.

## Applying changes

Validation checks references, fields, recipes and the factory's active content. Applying a package that would invalidate attached sockets, cable sharing, connection limits or material compatibility fails before changing the factory. Removing a mod also validates the resulting graph.

Changes affect the appropriate boundary: future construction and shipments use new timing; generated reserves and existing shipments retain prior state; committed batches retain paid output. Lower capacities retain stock and wait for space rather than deleting excess. Already generated maps are not recreated when spawn rules change.

Grid size can change before generating another map beyond Home. Larger worlds preserve Home's coordinate and move the four corner destinations to the new boundaries. Existing factories retain generated maps and progress when returning to base rules.

Changing grid size at that early boundary regenerates version-one border terrain from the same seed with scaled quotas and ranges. Existing version-zero worlds remain clear. Border assignments persist when removing a mod without changing the retained world size. Crossing projects use the normal research override system; there is no separate border-count or terrain-layout mod override in this version.

New games also save [ground terrain](map-nodes-and-exploration.md#ground-terrain-for-new-games) for all six supported sizes. An allowed early size change regenerates exact proportional quotas, Grassland Home/corners and the four preferred diagonals using the saved encounter order. Removing a mod retains the current layout and world size; older terrain-version-zero worlds never opt in. Existing maps keep their stocks and caps. Future generated finite Forest/mineral reserves apply terrain factors after mod baseline capacities and mapResourceMultiplier, including explicit world spawns and resource variants. Badlands removes all generated Forests. Explicit spawn choices still determine whether a source exists; terrain never creates one. Other custom resource items retain their baseline capacities. forestRegenMs and research compose with the map's natural Forest-rate multiplier; paid Tree Planter output and Drill-created deposits are unchanged. Training keeps legacy terrain.

## Sharing and saves

The editor draft is browser-local. Text export produces editable JSON; share codes provide another validated exchange format. Imports replace the draft after validation. Apply to factory activates the package. Saves embed the entire applied package, so loading restores it independently of the latest draft or external file.

The generated system catalogs describe the unmodified base game. Use the active package and runtime state to diagnose a modded factory. Balance runs using base rules must not silently include overrides or Dev Sources.

Sources: [types and templates](../../src/mods/modTypes.ts), [catalog activation](../../src/mods/modContent.ts), [rules](../../src/mods/modRules.ts), [validation](../../src/mods/modValidation.ts), [application](../../src/mods/modRuntime.ts), [sharing](../../src/mods/modSharing.ts).

Coverage: [mods](../../src/mods/mods.test.ts), [text files](../../src/mods/modTextFiles.test.ts), [world grids](../../src/mods/worldGrid.test.ts). The detailed [mod guide](../mods.md) owns authoring steps, supported fields and file examples.
