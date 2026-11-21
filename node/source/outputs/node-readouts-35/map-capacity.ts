import { createDenseFactory, factoryActivity } from '../../previews/active-factory/model';
import { getWorldFieldSize } from '../../src/simulation/worldGeneration';
import { nodeInsideField, nodesOverlap } from '../../src/simulation/collisions';
import { GameEngine } from '../../src/simulation/engine';
import { writeFileSync } from 'node:fs';

const reports = [];
for (const rows of [6]) {
  const state = createDenseFactory(1200), sector = state.sectors[state.activeSectorId];
  state.fieldSizeScale = 1;
  sector.nodes = sector.nodes.filter(n => Number(n.id.split('-')[1]) < 5 * rows);
  const ids = new Set(sector.nodes.map(n => n.id));
  sector.connections = sector.connections.filter(c => ids.has(c.from) && ids.has(c.to));
  for (const n of sector.nodes) {
    const cell = Number(n.id.split('-')[1]);
    n.x += 256 + cell % 5 * 1024 - (256 + cell % 8 * 1024);
    n.y += 256 + Math.floor(cell / 5) * 512 - (256 + Math.floor(cell / 8) * 512);
  }
  const field = getWorldFieldSize(state);
  const outside = sector.nodes.filter(n => !nodeInsideField(n, field)).map(n => n.id);
  let overlaps = 0;
  sector.nodes.forEach((n, i) => sector.nodes.slice(i + 1).forEach(o => { if (nodesOverlap(n, o)) overlaps++; }));
  const engine = new GameEngine(state, { autosave: false });
  const invalidConnections = sector.connections.filter(c => engine.getConnectionFailure(c.from, c.fromPort ?? 0, c.to, c.toPort ?? 0, c.id)).length;
  for (let i = 0; i < 1200; i++) engine.tick(100);
  reports.push({rows, field, outside, overlaps, invalidConnections, ...factoryActivity(engine.getState()), syntheticSupply: true, fpsMeasured: false});
}
writeFileSync('outputs/node-readouts-35/map-capacity.json', JSON.stringify(reports, null, 2) + '\n');
console.log(JSON.stringify(reports));

