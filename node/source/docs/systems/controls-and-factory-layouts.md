# Controls and factory layouts

[System index](README.md)

The factory field supports direct placement, socket wiring, selection groups and reusable layouts. Options → Commands, also opened with `?`, is the full in-game command reference.

## Common controls

| Action | Control |
| --- | --- |
| Pan | Right/middle drag, Space + left drag, or trackpad scroll |
| Zoom | Wheel or pinch around the pointer |
| Select | Click or drag a box; Shift adds to selection |
| Connect | Drag between compatible sockets in either direction |
| Reroute | Drag a wired input when its attached cable is unambiguous or selected |
| Cancel | Escape; right-click cancels a held placement |
| Delete | Delete/Backspace or selection delete control, subject to preference |
| Undo | Ctrl/Cmd + Z for a recorded command |
| Copy and paste layout | Ctrl/Cmd + C, then Ctrl/Cmd + V |
| Copy recipe | Shift + right-click source, then Shift + left-click same-type target while holding Shift |
| Grid snap | Hold A; Options can keep snapping enabled |
| Recipe icons | Alt |
| Research / Build / Journal / Options | Q / B / J / O |
| Field minimap / full Node Map | M / Shift + M after Exploration |
| Visit a Road's connected Map Node | Click the exterior Travel arrow or double-click the Road body away from sockets |
| Reverse Road flow | Stationary right-click on either Road body; disconnects endpoint cables for rewiring |

## Placement and socket arrangement

Travel through the Node Map or a Road retains the previous field’s zoom. Road double-click and the Travel button focus and highlight the paired Road on arrival, within camera bounds. Ordinary Node Map travel centers a new field and retains a revisited destination’s saved center. Tutorial practice keeps its authored camera.

Grid snapping aligns top-left corners to a 32-unit world grid. Selected groups preserve internal spacing. Player-built bodies may touch but cannot overlap; natural resources, obstructions and field edges retain clearance. Dragging near a zoomed field edge scrolls the field while preserving the drag.

Connector Mirroring is Complex-tier research requiring Complex Core research and 10 of each Core from Simple through Complex (60 total). Previously completed mirroring stays completed. It makes production-node right-click swap input/output banks while preserving semantic ports and cables. A Road right-click reverses shipment direction; other supported logistics nodes rotate their connectors. Recipe-machine order controls cycle input order or output position separately. These right-click actions can take priority over group dialogs.

Node and group dragging retain their drawing objects while updating affected
cables and cargo paths against preview positions. Zooming and panning recalculate
visual visibility; socket hit areas remain camera-aware. At low zoom, selecting
or hovering a node reveals its secondary labels and buffers. View detail and
visibility never pause production or alter delivery timing.

## Groups and templates

Control Groups persist membership and color. Clicking or dragging a member selects or moves the group. Double-click selects one member independently; holding the second click permits an individual drag. A down-right selection box expands touched groups, while up-left selection selects only the touched nodes. Group copies receive independent group IDs.

Copy/paste retains eligible selected nodes and their internal cables; world obstacles and disallowed nodes cannot be duplicated freely. Saved factory templates reuse layouts subject to current unlocks, world recipe pairing, placement and connection rules. Copies do not provide free stock or committed production batches.

Paired-sector nodes such as Roads are excluded from factory templates, including imported template entries. Construct Road pairs through ordinary border placement so both endpoints share the crossing permission, clearance and channel checks. Border terrain is fixed world geography and cannot be copied or relocated.

Area Expansion automatically moves existing Road pairs to the resized field borders and preserves their pairing and cables. This automatic alignment is separate from manual Road dragging, which still checks clearance and cable paths. See [Road borders after expansion](roads-and-vehicles.md#area-expansion-and-road-borders).

Landmarks cannot be deleted, copied or placed from imported templates. Resource Relocation permits same-Map-Node moves after victory, retaining stock, paid batches and progress without a per-move bill. A Tri Extractor moves independently unless its ordinary reserve is explicitly selected too. See [Landmark relocation](landmarks.md#relocation-and-compatibility).

## Shortcut bars

Production uses 1–5, Logistics Shift + 1–5 and Storage Ctrl + 1–5. F1/F2/F3 toggle the bars. Slots can be assigned or cleared. Attached bars share a drag handle; detaching one preserves the remaining attachment. Preferred positions are saved separately from temporary viewport fitting.

Sources: [Commands panel](../../src/ui/panels/CommandsPanel.tsx), [grid](../../src/domain/nodeGrid.ts), [groups](../../src/domain/controlGroups.ts), [template runtime](../../src/simulation/factoryTemplateRuntime.ts), [shortcuts](../../src/ui/ShortcutBars.tsx), [engine commands](../../src/simulation/engine.ts).

Coverage: [groups](../../src/simulation/controlGroups.test.ts), [mirroring](../../src/simulation/engine.connectorMirroring.test.ts), [grid](../../src/domain/nodeGrid.test.ts), [shortcut preferences](../../src/ui/shortcutPreferences.test.ts). For changes to player-facing style or copy, follow the [style guide](../node-ui-style-guide.md) and update the [review notes](../typography-style-review.md) in the same change.
