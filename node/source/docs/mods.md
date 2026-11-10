# Mods

Open **Options → Mods**. Edit the factory handbook. It has survived worse authors.

## Create and share

1. Name the draft and optionally add an author and description.
2. Open a category and search for an entry, or choose **Create entry**. New items, recipes and research can reference one another in the same draft. New nodes inherit a supported built-in template. Map and connection entries are named presets, and each category can select one preset for the factory.
3. Use **Import base settings** inside an entry to copy its supported catalog values into the draft. **Remove this entry’s changes** or a field’s **Reset** button returns that setting to inheritance. **New from base game** starts an empty draft without changing the active factory.
4. Choose **Review** to inspect the declared changes, then **Apply to factory**. Applying replaces the factory’s previous package. Attached cables that would lose their sockets, become incompatible, exceed the declared connection count or lose required sharing cause an error; disconnect those cables before retrying. The factory is unchanged when application fails.
5. Open **Import / export mods** and choose **Export text file** to save an editable copy. Use **Import mod text file** to load an edited pack. You can also generate and copy a share code. Both forms of import replace the editor draft after validation. **Apply to factory** activates the imported pack.

Drafts are stored in the browser under `nodefactory.mod-draft.v1`. Closing the modal retains the draft. Loading a factory does not replace that browser draft; **Load active mod** copies the loaded factory’s package into the editor. Manual saves and autosaves embed the complete applied pack and show its name in **Save / Load**. Loading the save restores its pack even if the exported text file or editor draft has since changed.

## Editors

| Category | Supported changes |
| --- | --- |
| Resources | Names and colors for base and custom items |
| Production nodes | Names, descriptions, glyphs, colors, unlocks, construction and processing times, buffers, sockets and allowed recipes. Custom variants use a recipe machine template. |
| Logistics & storage | The same applicable fields, socket sharing and cable limits. Custom variants use a router or buffer template. |
| Obstructions & world nodes | Spawn rules, cable obstruction, footprint and reserve capacity. Edit Lakes here and Pumps under Production. Custom mineral reserves can supply a custom material. |
| Research | Names, descriptions, costs, primary/additional prerequisites, repeatability and price growth; custom costs also work through the Research Center’s shared input |
| Map nodes | Default or preset world grid size, field dimensions, new-map reserves and natural Forest regeneration time |
| Recipes | Names, ingredients, products, duration, unlocks, recovery efficiency and chance products. Assign a custom recipe through the machine’s **Available recipes** field. |
| Connections & construction | Default or preset cable travel and dispatch intervals, Road dispatch and global construction time |

Numeric timing is in milliseconds. A processing-time multiplier of `0.5` halves the time; `2` doubles it. Efficiency research also applies. A node’s explicit construction time takes precedence over the global construction multiplier. Simulation checks still run every 100 ms, so very short requested intervals are bounded by the simulation cadence.

Socket selectors edit the node’s static definition. Changing a socket also enables **Use explicit sockets instead of dynamic recipe / resource sockets**. Turn that setting off to resume the ordinary sockets derived from the selected recipe or resource. Importing base settings preserves normal dynamic behavior. Recipe ingredients remain required even when explicit sockets are used.

### World map size

In **Mods → Map nodes**, set **World map size** in the draft’s defaults or in a selected map preset. New factories start at 11×11. Choose 13×13, 15×15, 17×17, 19×19, or 21×21 for more room around Home. Apply the mod before activating your first map beyond Home. Once a map has been generated, start a new factory to choose a different size.

The factory save keeps its grid size. A pack with no explicit size uses the factory’s current grid. The four unique camps occupy the outer corners of that grid, and normal Map Point research can fund every map. Extra purchases beyond the standard grid use the existing maximum price for the current research tier. In a mod text file, set `"worldGridSize": 21` under `rules` or a map preset’s `rules`.

### Spawning and placement

Open **Obstructions & world nodes**, choose an entry, and select **Add spawn rule**. Lakes, Deep Holes, Goblin camps, Forests, and natural reserves support rules. Choose a tier range, a percentage chance per map, a count of 1–8, and where to place the center of each obstruction. The standard world has eligible tiers 1–9. A 21×21 world reaches tier 19 before its corner maps. Placement uses the world seed and checks available space, so a crowded map may place fewer than the requested count.

**Add to normal spawns** keeps the usual generation and adds this rule’s spawns. **Replace normal spawns** removes the selected entry’s usual spawns across new maps, including outside the rule’s tier range. Set the chance to 0% in replace mode to disable those spawns. Dwarven settlements, progression Golems, Home, and the four corner maps retain their normal generation. Generated maps retain their existing nodes when a rule changes.

Custom reserves use their own spawns while a rule is present. Removing the rule restores their template replacement chance. Mod packs store rules under each entry’s `worldSpawn` field. For example, this `nodes` section places up to two Lakes with centers in the northwest on 60% of new tier 3–5 maps and replaces the usual Lake schedule.

```json
{
  "lake": {
    "worldSpawn": { "mode": "replace", "minTier": 3, "maxTier": 5, "chance": 0.6, "count": 2, "region": "northwest" }
  }
}
```

## Applying and removing rules

Catalog edits affect the running factory and future maps/builds as appropriate. Names also update existing nodes while retaining their previous labels for restoration. Lowering a buffer or vehicle capacity retains stored items; the node waits for room before receiving or producing more. Carts, Trucks and Trains keep their combined input/output capacity rule and solid-only transport.

Resource reserve settings apply when a natural node/map is generated. Existing reserves are not refilled or rescaled. Field expansion affects current fields without moving their nodes. New build times affect future construction. New cable travel times affect future shipments; existing shipments retain their scheduled arrival. Production already committed to a mixed batch retains its paid output. Existing selected recipes remain configured when a chooser’s allowed list changes.

**Use base-game rules in this factory** restores the catalogs and rules. It retains stock, completed research, constructed nodes, generated maps and gameplay progress; it does not reverse a play session. Cable compatibility is checked on removal as well. A manual save before experimenting provides a complete factory checkpoint.

Custom content gets a stable `mod-` ID when created. A custom research project can unlock nodes and recipes that list it as a requirement. Nodes reuse supported built-in behaviors. A mod that would remove a node, selected recipe, or material still in use is rejected before it changes the factory. Retired definitions remain available to load older saves and share codes, and the editor lists active base-game content by its display name.

## Editable mod file

The exported `.node-mod.txt` file is UTF-8 JSON formatted with indentation. The file picker also accepts `.json`. A hand-written pack needs `format`, `version`, and `name`. Empty catalog sections, `author`, and `description` can be omitted. New IDs start with `mod-` and use lowercase letters, digits, and hyphens. References use IDs, so changing a display name leaves recipes and requirements connected. For example, this pack adds an item and a recipe. Assign the recipe to a machine in its **Available recipes** editor to produce the item.

```json
{
  "format": "NODE Mod Pack",
  "version": 1,
  "name": "Workshop alloy",
  "resources": {
    "mod-workshop-alloy": { "name": "Workshop Alloy", "color": "#aaffcc" }
  },
  "recipes": {
    "mod-make-workshop-alloy": {
      "name": "Make Workshop Alloy",
      "inputs": { "copper-plate": 1 },
      "outputs": { "mod-workshop-alloy": 2 },
      "cycleMs": 5000
    }
  }
}
```

Files may be up to 2 MB. The import checks the file format, references, and settings before replacing the draft. A rejected file leaves the draft available for editing. The game reads the chosen file and exports a separate download. **Import base settings** copies values into the draft, and applying a mod uses runtime overrides for that factory. The installed base definitions are read-only to the editor.

## Share codes and implementation

Share codes have the form `NODEMOD1.<base64url UTF-8 JSON>.<checksum>`. The eight-character checksum detects accidental damage; it is not a signature or proof of authorship. Spaces and line wraps can be removed during import. Codes are limited to 500,000 characters.

Version-one packages contain `version`, `name`, `author`, `description`, `resources`, `nodes`, `recipes`, `research`, `rules`, and optional `profiles`. Custom entries and declared overrides are serialized. Omitted fields inherit the installed game or the node template. Explicitly imported base values are pinned. Serialized IDs, including `command-core`, stay stable while display names such as Complex Core remain editable.

`src/mods/modValidation.ts` validates the complete package before activation, including base and custom references, numeric ranges, whole-item quantities, colors, sockets, presets, and research dependency cycles. Save import uses the same package validation.

Frozen base catalog snapshots provide the editor’s templates. `activateMod` copies the templates into the runtime catalogs and applies the saved package’s overrides there. Engines reactivate their package at simulation/state access, research and template boundaries. Mod changes invalidate the active playfield’s scene so it refreshes sockets, labels, colors and geometry.

## Verification

`src/mods/mods.test.ts` covers Unicode share-code round-trips, damaged codes, unsafe/unknown fields, invalid quantities/references, research dependency cycles, live production/yields/chance products, construction, preserved stock, shipment timing, atomic cable rejection, dynamic sockets, research pricing and ingredient delivery, Cart total capacity, saves, undo, clean base-game creation, engine switching, new-map reserves and obstruction geometry.

The browser check at `http://127.0.0.1:4180/` used a separate paused factory. It verified Options → Mods, a named draft, searching/editing Wood to Timber, review/application, code generation/copy/reimport, invalid-code feedback and the Production node editor at the default 1280 × 720 viewport. This was an interface check, not a balance run or publication.
