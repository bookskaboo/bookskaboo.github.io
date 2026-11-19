# Grid contact test page

Run `npm run dev -- --port 4187` from the project root, then open
`http://127.0.0.1:4187/previews/grid-contact/`.

The page compares current 64-unit snapping with its 12-unit collision clearance,
64-unit snapping with zero clearance between player-built rectangular bodies,
and 16-unit snapping with the current clearance. Their nearest aligned gaps are
64, 0 and 16 world units respectively. Only the preview changes its collision
arguments; the game retains its existing rules.

Drag the gold-outlined node, or focus it and use arrow keys. Invalid positions
remain as a red preview; Reset layout restores the last arrangement. Try touching
edges demonstrates the same request in each mode. Side-by-side, stacked and mixed
size layouts use real game body sizes. Socket inspection lists nearby overlapping
socket targets; actual connection selection and wiring are not implemented here.

The preview imports game dimensions, socket anchors, catalog icons, grid snapping,
collision checks and shared typography. SVG rendering is a simplified specimen,
not the Pixi playfield. It has no game state, simulation, persistence or save access.
Contact keeps resource, obstacle and field-boundary clearance. The proposal still
needs integration testing for actual cables, controls and overlapping socket hits
before adoption in the main game.

Checks:

```powershell
npx tsc -p previews/grid-contact/tsconfig.json
npx vitest run previews/grid-contact/model.test.ts src/domain/nodeGrid.test.ts
npx vite build previews/grid-contact --outDir ../../outputs/grid-contact-dist
```
