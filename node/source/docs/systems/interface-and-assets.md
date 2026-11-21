# Interface and assets

[System index](README.md)

The interface uses React panels alongside the Pixi factory field. Shared content names, colors, geometry and typography keep the Build menu, field nodes, recipe views and research presentation consistent.

## Typography and copy

The [UI style guide](../node-ui-style-guide.docx) owns current style rules and examples. The [style review notes](../typography-style-review.docx) record changes, applicability and checks. Read both before changing player-facing style or copy, and update both in the same change.

[Readability styles](../../src/styles/readability.css) define shared type roles, including a sans-serif UI family and a named monospace family for technical notation. Reserve heavier weight for hierarchy and essential warnings. Selected project descriptions remain 12 CSS px; Start/Cancel actions, Core badges and progress counts use regular weight. Core badge labels match research filters, such as Simple and Basic.

Dry, understated humor is the game's voice in modal subtext, tutorials, introductions and help. Keep control instructions, quantities and goals explicit. Use Complex Core and Mythril in player-facing text; retain compatibility IDs internally. Command Robotics and Command Bots keep their names. Stone resource nodes use the title Stone, retaining the serialized stoneDeposit kind. Existing default Stone Deposit titles normalize on load, while custom titles remain. Guarded camps keep their AP socket to the left and their AP/check readout below the interior deposit.

## Asset ownership

| Module | Role |
| --- | --- |
| [Line art](../../src/art/lineArt.ts) | Shared vector icon family |
| [Node art](../../src/art/nodeArt.ts) | Node illustration assets |
| [Item art](../../src/art/itemArt.ts) | Material illustration assets |
| [Recipe art](../../src/art/recipeArt.ts) | Recipe presentation assets |
| [Corner illustrations](../../src/art/cornerIllustrations.ts) | Corner encounter imagery |
| [Dragon illustration](../../src/art/dragonIllustration.ts) | Ancient Dragon imagery |

Node modules select icon, shape and embedded controls; shared domain geometry supplies dimensions and sockets. The renderer and React icon components should reuse these sources rather than introduce independent silhouettes or ingredient identities. Material colors come from the item catalog.

The game and [border obstruction art study](../../previews/border-obstructions/README.md) share the [river, mountain and chasm vectors](../../src/art/borderObstructionArt.ts). [Pixi terrain](../../src/renderer/borderTerrain.ts) keeps each band centered on the boundary at the current local review width (cross-band scale 3.75 in world units, 25% wider than the first published bands), with a common orientation on both sides. Length follows the field edge while width remains fixed during Area Expansion. A per-field mask exposes only that sector's half. The selected Road placement/move ghost includes the adjacent half using the existing crop, orientation and 48-unit gap; canceling hides it. Cables and ordinary Road endpoints remain above terrain. Research changes placement permission, with no after-research artwork. Individual mountain faces are narrower inside the wider ridge, with base cross-band offsets at 55% and along-band offsets at 75% of the original shapes. Stable per-border variation adds irregular spacing, lateral positions, face scale, lean and shade; lower faces overlap upper ones. The world seed and canonical shared-border identity preserve matching halves and repeatable redraws. Use dense, irregular mountain clusters with two to four faces per pocket, spread across the ridge and allowed to overlap. Keep every peak upright on all four borders; counter-project peak vertices for north/south bands rather than rotating the mountain silhouettes sideways. Bias the upright mountain faces toward the upper half of each horizontal shared band so more complete bases remain visible on a south border. Apply the same canonical shift to its north-side view and Road ghost; keep the ridge band centered and east/west faces in place. Generation clearance follows the shifted peak bounds. Retain the current widened bands and slim individual faces. Rivers retain water/banks/current strokes without exterior four-sided debris or caret marks. Chasms retain lips and interior cliff contours without exterior diamonds or Y marks. Shared art geometry also supplies conservative generation bounds; newly generated resource and obstruction bodies leave a 32-world-unit gap, including maximum settlement growth, future Golem reserves and Area Expansion. This does not add a player-building exclusion. Explicit path vertices keep native SVG and Pixi consistent; Pixi does not apply nested SVG group transforms. The gallery's side selectors, enlargement and SVG downloads remain art review tools. This sizing revision is local and has not been republished.

## Panels and responsive behavior

The main Node Map uses [shared-edge symbols and summaries](../../src/ui/MapBorderObstructions.tsx): waves, peaks and paired fractures, revealed after either neighbor is visited. Researched terrain stays visible at reduced emphasis; Road markers sit above it. Selected-map rows list only side and terrain; hover and accessible marker labels identify terrain and the two positions without research text. The [nine-sample modal test](../../previews/border-obstructions/README.md#node-map-modal-test) retains its explicit overlay/summary overrides and external author research controls. The [real engine fixture](../../previews/border-obstructions/runtime.html) uses the generated 36-border layout and ordinary map defaults. Both disable autosave and minimap-layout persistence; main-game persistence defaults remain enabled.

Build, Research, Recipes, Inventory, Journal, Options, Saves and Mods provide distinct tasks. Research includes the prerequisite tree, selected-project details and reactive hints. The Node Map expands from the minimap and retains its position and zoom preferences. Shortcut bars fit available space without replacing the player's saved preferred layout.

Changes should preserve keyboard dismissal, tooltip access, narrow-window scrolling, recipe links and existing tutorial restrictions. Source modules and automated tests can check behavior; browser inspection is still needed for clipping, contrast, focus and pointer interaction.

On the factory field, secondary labels and buffer details appear at 40 percent
zoom and above. Selection, hover, dragging or a cable endpoint restores detail
for the affected node at smaller zoom. Recipe icons, node bodies, sockets,
progress and low-zoom waiting/blockage indicators remain available. Deep Hole
and Golem readouts keep their existing special treatment. Culling is visual
only: offscreen machines continue producing. Native display density is capped
at two for the playfield and canvas labels to bound pixel and texture costs.

Low-zoom ordinary node artwork is shared as small cached images of the existing
vectors. Progress bars and waiting/arrival overlays stay dynamic. Generic socket
labels follow the same detail threshold as Production labels; full text and
buffers return on inspection. Natural resources, Extractors and Research Centers
retain specialized live views. Cable neighborhoods cache their existing colors
and curves at overview scale, and refresh locally when an endpoint moves or a
route changes. Zooming in returns to vector drawing and the original controls.

Sources: [UI components](../../src/ui/App.tsx), [node modules](../../src/content/nodeModules.ts), [shared geometry](../../src/domain/nodeGeometry.ts), [stylesheet entry](../../src/styles.css), [responsive layout](../../src/ui/responsiveLayout.ts). Broader art/audio direction and unfinished production work remain in the [art audio and writing plan](../master-plan/06-art-audio-and-writing.md).
