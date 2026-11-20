# Interface and assets

[System index](README.md)

The interface uses React panels alongside the Pixi factory field. Shared content names, colors, geometry and typography keep the Build menu, field nodes, recipe views and research presentation consistent.

## Typography and copy

The [UI style guide](../node-ui-style-guide.docx) owns current style rules and examples. The [style review notes](../typography-style-review.docx) record changes, applicability and checks. Read both before changing player-facing style or copy, and update both in the same change.

[Readability styles](../../src/styles/readability.css) define shared type roles, including a sans-serif UI family and a named monospace family for technical notation. Reserve heavier weight for hierarchy and essential warnings. Selected project descriptions remain 12 CSS px; Start/Cancel actions, Core badges and progress counts use regular weight. Core badge labels match research filters, such as Simple and Basic.

Dry, understated humor is the game's voice in modal subtext, tutorials, introductions and help. Keep control instructions, quantities and goals explicit. Use Complex Core and Mythril in player-facing text; retain compatibility IDs internally. Command Robotics and Command Bots keep their names.

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

## Panels and responsive behavior

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
