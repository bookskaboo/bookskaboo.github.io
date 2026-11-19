# Grid contact test page

Run `npm run dev -- --port 4187` from the project root, then open
`http://127.0.0.1:4187/previews/grid-contact/`.

The page compares the previous 64-unit snapping with its 12-unit collision clearance,
64-unit and 32-unit snapping with zero clearance between player-built rectangular bodies,
and 16-unit snapping with the current clearance. The 32-unit contact proposal is
selected by default. Their nearest aligned gaps are 64, 0, 0 and 16 world units
respectively. The local game now uses the selected 32-unit grid and zero clearance
between player-built bodies. The older comparisons retain explicit grid and
clearance settings to remain reproducible.

Drag the gold-outlined node, or focus it and use arrow keys. Invalid positions
remain as a red preview; Reset layout restores the last arrangement. Try touching
edges demonstrates the same request in each mode. Side-by-side, stacked and mixed
size layouts use real game body sizes. Socket inspection lists nearby overlapping
socket targets; actual connection selection and wiring are not implemented here.

The preview imports game dimensions, socket anchors, catalog icons, grid snapping,
collision checks and shared typography. SVG rendering is a simplified specimen,
not the Pixi playfield. It has no game state, simulation, persistence or save access.
Contact keeps resource, obstacle and field-boundary clearance. The actual game
resolves coincident origin sockets by approaching from the intended body's side.
The comparison's socket inspection remains an illustration, not a wiring UI.

`http://127.0.0.1:4187/previews/grid-contact/game.html` is an isolated fixture using
the actual Pixi renderer and engine, with no save access. It supports real placement,
dragging and wiring. Run transfers advances that fixture by two seconds and pauses.
It is for interaction checks, not balance measurements.

Checks:

```powershell
npx tsc -p previews/grid-contact/tsconfig.json
npx vitest run previews/grid-contact/model.test.ts src/domain/nodeGrid.test.ts
npx vite build previews/grid-contact --outDir ../../outputs/grid-contact-dist
```
