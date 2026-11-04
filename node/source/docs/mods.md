# Mods

Open **Options → Mods**. Edit the factory handbook. It has survived worse authors.

## Create and share

1. Name the draft and optionally add an author and description.
2. Open a category, search for an existing base-game entry, and edit its fields. The editors use text boxes, numeric inputs, item-and-quantity rows, socket selectors and recipe/prerequisite lists; JSON editing is not required.
3. Use **Import base settings** inside an entry to copy its supported catalog values into the draft. **Remove this entry’s changes** or a field’s **Reset** button returns that setting to inheritance. **New from base game** starts an empty draft without changing the active factory.
4. Choose **Review** to inspect the declared changes, then **Apply to factory**. Applying replaces the factory’s previous package. Attached cables that would lose their sockets, become incompatible, exceed the declared connection count or lose required sharing cause an error; disconnect those cables before retrying. The factory is unchanged when application fails.
5. Open **Import / export share code**, choose **Generate share code**, then **Copy share code**. Another player pastes it into **Paste mod share code**, chooses **Import into editor**, reviews it and applies it.

Drafts are stored in the browser under `nodefactory.mod-draft.v1`. Closing the modal retains the draft. Loading a factory does not replace that browser draft; **Load active mod** copies the loaded factory’s package into the editor. An applied package is part of manual saves, autosaves, save export/import and engine undo. Loading an unmodded factory or starting a tutorial activates base-game rules.

## Editors

| Category | Supported changes |
| --- | --- |
| Resources | Names and colors of existing raw resources and manufactured items |
| Production nodes | Names, descriptions, header glyphs, colors, unlock requirements, construction times, processing multipliers, buffers, explicit sockets and allowed recipes; includes Extractors and Lake Intakes |
| Logistics & storage | The same applicable node fields, socket sharing, and total incoming/outgoing cable limits; includes Carts, Trucks and Trains |
| Obstructions & world nodes | World-node fields, cable obstruction behavior, rendered/collision footprint scale, and reserve capacity for newly generated natural resource nodes |
| Research | Names, descriptions, costs, primary/additional prerequisites, repeatability and price growth; custom costs also work through the Research Center’s shared input |
| Map nodes | Field width/height multipliers, reserves on newly generated maps, and natural Forest regeneration time |
| Recipes | Names, ingredients, products, duration, unlock requirement and optional chance products; assign existing recipes to machines through the node editor |
| Connections & construction | Cable travel and dispatch intervals, Road shipment interval and global construction multiplier |

Numeric timing is in milliseconds. A processing-time multiplier of `0.5` halves the time; `2` doubles it. Efficiency research also applies. A node’s explicit construction time takes precedence over the global construction multiplier. Simulation checks still run every 100 ms, so very short requested intervals are bounded by the simulation cadence.

Socket selectors edit the node’s static definition. Changing a socket also enables **Use explicit sockets instead of dynamic recipe / resource sockets**. Turn that setting off to resume the ordinary sockets derived from the selected recipe or resource. Importing base settings preserves normal dynamic behavior. Recipe ingredients remain required even when explicit sockets are used.

## Applying and removing rules

Catalog edits affect the running factory and future maps/builds as appropriate. Names also update existing nodes while retaining their previous labels for restoration. Lowering a buffer or vehicle capacity retains stored items; the node waits for room before receiving or producing more. Carts, Trucks and Trains keep their combined input/output capacity rule and solid-only transport.

Resource reserve settings apply when a natural node/map is generated. Existing reserves are not refilled or rescaled. Field expansion affects current fields without moving their nodes. New build times affect future construction. New cable travel times affect future shipments; existing shipments retain their scheduled arrival. Production already committed to a mixed batch retains its paid output. Existing selected recipes remain configured when a chooser’s allowed list changes.

**Use base-game rules in this factory** restores the catalogs and rules. It retains stock, completed research, constructed nodes, generated maps and gameplay progress; it does not reverse a play session. Cable compatibility is checked on removal as well. A manual save before experimenting provides a complete factory checkpoint.

This version edits supported properties of existing base-game entries. It does not add new item IDs, node behaviors, executable scripts or arbitrary research effects. Existing special mechanics remain: automatic milestone triggers, scripted research effects/caps, retired content restrictions, recipe-specific progression gates, Road pairing, Filters and other routing roles. Unlock-description text is descriptive; the corresponding built-in research effect is unchanged. Modded runs are not base-game balance measurements.

## Share format and implementation

Share codes have the form `NODEMOD1.<base64url UTF-8 JSON>.<checksum>`. The eight-character checksum detects accidental damage; it is not a signature or proof of authorship. Spaces and line wraps can be removed during import. Codes are limited to 500,000 characters.

Version-one packages contain `version`, `name`, `author`, `description`, `resources`, `nodes`, `recipes`, `research` and `rules`. Only declared overrides are serialized; omitted fields inherit the installed game. Explicitly imported base values are pinned, so players who need those values should include them. Serialized IDs, including `command-core`, stay stable while display names such as Complex Core remain editable.

`src/mods/modValidation.ts` validates the complete package before activation: supported version, strict field allowlists, base catalog references, numeric ranges, whole-item quantities, colors, socket arrays and research dependency cycles. Invalid packages embedded in saves are rejected too. Imported text is rendered as React text, never evaluated as code or inserted as HTML.

Source-owned catalog snapshots provide the editor’s base templates and prevent active packages from contaminating them during development reloads. `activateMod` updates the shared runtime catalogs while retaining the objects used by cached research/build lookups. Engines reactivate their package at simulation/state access, research and template boundaries. Mod changes invalidate the active playfield’s scene, updating sockets, labels, colors and geometry even when nodes have not moved.

## Verification

`src/mods/mods.test.ts` covers Unicode share-code round-trips, damaged codes, unsafe/unknown fields, invalid quantities/references, research dependency cycles, live production/yields/chance products, construction, preserved stock, shipment timing, atomic cable rejection, dynamic sockets, research pricing and ingredient delivery, Cart total capacity, saves, undo, clean base-game creation, engine switching, new-map reserves and obstruction geometry.

The browser check at `http://127.0.0.1:4180/` used a separate paused factory. It verified Options → Mods, a named draft, searching/editing Wood to Timber, review/application, code generation/copy/reimport, invalid-code feedback and the Production node editor at the default 1280 × 720 viewport. This was an interface check, not a balance run or publication.
