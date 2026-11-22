import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { cpus, platform } from 'node:os';
import { describe, expect, it } from 'vitest';
import { GameEngine, createInitialState } from '../src/simulation/engine';
import type { GameState, MachineNode, NodeKind, SectorState } from '../src/domain/types';

// Opt in: npm run stress. Synthetic valid graphs bypass placement and rendering.
const enabled = process.env.GAME_STRESS === '1';
const inventoryPerNetwork = 100_000;
const simulatedMs = 30_000;

function fixture(mapCount: number, networks: number, production: boolean) {
  const state = createInitialState(20261030);
  // Synthetic worlds are already current; do not migrate legacy discovery deposits.
  state.progressionVersion = 1;
  state.sectors = {};
  state.activeSectorId = '0,0';
  state.preferences.autosaveMinutes = 1_000_000;
  // Snake ordering keeps every outgoing road adjacent, including the final
  // sector, which sends back to its predecessor. A one-map control is local.
  const coordinates = Array.from({ length: 121 }, (_, i) => {
    const y = Math.floor(i / 11);
    return [y % 2 ? 10 - i % 11 : i % 11, y];
  }).slice(0, mapCount);
  const sectors: SectorState[] = coordinates.map(([x, y]) => ({
    id: `${x},${y}`, x, y, name: `${x},${y}`, label: 'TST', unlocked: true,
    nodes: [], connections: [], camera: { x: 0, y: 0, zoom: 1 }, lastSimulatedAt: Date.now(),
  }));
  sectors.forEach((sector) => { state.sectors[sector.id] = sector; });
  const makeNode = (sector: SectorState, id: string, kind: NodeKind): MachineNode => {
    const node: MachineNode = {
      id, kind, name: kind, x: 500, y: 500, rotation: 0,
      input: {}, output: {}, progressMs: 0, cycleMs: 3500,
      constructedAt: 0, constructionMs: 0,
    };
    sector.nodes.push(node);
    return node;
  };
  const connect = (sector: SectorState, from: MachineNode, to: MachineNode) => {
    sector.connections.push({ id: `${from.id}>${to.id}`, from: from.id, to: to.id, fromPort: 0, toPort: 0, createdAt: 0 });
  };
  sectors.forEach((sector, index) => {
    const target = sectors[index + 1] ?? sectors[Math.max(0, index - 1)];
    for (let n = 0; n < networks; n++) {
      const prefix = `${sector.id}/${n}`;
      const source = makeNode(sector, `${prefix}/source`, 'woodenChest');
      source.output.wood = inventoryPerNetwork;
      const processor = makeNode(sector, `${prefix}/processor`, production ? 'kiln' : 'joint');
      if (production) processor.recipeId = 'charcoal';
      const vehicle = makeNode(sector, `${prefix}/vehicle`, 'woodenChest');
      const exporter = makeNode(sector, `${prefix}/export`, 'road');
      const importer = makeNode(target, `${prefix}/import`, 'road');
      exporter.roadMode = 'export'; exporter.pairedSectorId = target.id; exporter.pairedRoadId = importer.id;
      importer.roadMode = 'import'; importer.pairedSectorId = sector.id; importer.pairedRoadId = exporter.id;
      const relay = makeNode(target, `${prefix}/relay`, 'woodenChest');
      const sink = makeNode(target, `${prefix}/sink`, 'warehouse');
      connect(sector, source, processor); connect(sector, processor, vehicle); connect(sector, vehicle, exporter);
      connect(target, importer, relay); connect(target, relay, sink);
    }
  });
  return state;
}

function itemCount(state: GameState) {
  let count = 0;
  for (const sector of Object.values(state.sectors)) for (const node of sector.nodes) {
    for (const bag of [node.input, node.output]) for (const amount of Object.values(bag)) {
      expect(Number.isInteger(amount) && amount! >= 0).toBe(true);
      count += amount ?? 0;
    }
  }
  return count + (state.inFlightTransfers ?? []).filter((transfer) => !transfer.cosmeticOnly).length;
}

describe.skipIf(!enabled)('current engine stress benchmark', () => {
  it('measures whole-world networks and checks conservation and remote delivery', () => {
    const results: object[] = [];
    const baseline = existsSync('outputs/stress/baseline.json')
      ? JSON.parse(readFileSync('outputs/stress/baseline.json', 'utf8')) as { fixtureVersion?: number; results: Array<{
        maps: number; networks: number; production: boolean; delivered: number; peakTransfers: number;
      }> } : undefined;
    const cases = [
      { maps: 1, networks: 4, production: true },
      { maps: 25, networks: 4, production: true },
      { maps: 121, networks: 4, production: true },
      { maps: 121, networks: 12, production: true },
      { maps: 121, networks: 32, production: true },
      { maps: 121, networks: 4, production: false },
      { maps: 121, networks: 12, production: false },
      { maps: 121, networks: 32, production: false },
    ];
    for (const scenario of cases) {
      const engine = new GameEngine(fixture(scenario.maps, scenario.networks, scenario.production));
      // Warm up separately, then measure 30 simulated seconds at the app's 100ms tick.
      for (let i = 0; i < 50; i++) engine.tick(100);
      const durations: number[] = [];
      let peakTransfers = 0;
      let publications = 0;
      engine.subscribe(() => { publications++; });
      const started = performance.now();
      for (let i = 0; i < simulatedMs / 100; i++) {
        const start = performance.now(); engine.tick(100); durations.push(performance.now() - start);
        peakTransfers = Math.max(peakTransfers, engine.getState().inFlightTransfers?.length ?? 0);
      }
      const wallMs = performance.now() - started;
      const state = engine.getState();
      const sectors = Object.values(state.sectors);
      const delivered = sectors.flatMap((sector) => sector.nodes).filter((node) => node.kind === 'warehouse')
        .reduce((sum, node) => sum + [...Object.values(node.input),...Object.values(node.output)].reduce((s, amount) => s + (amount ?? 0), 0), 0);
      expect(itemCount(state)).toBe(scenario.maps * scenario.networks * inventoryPerNetwork);
      for (const sector of sectors) {
        const sinks = sector.nodes.filter((node) => node.kind === 'warehouse');
        for (const sink of sinks) expect([...Object.values(sink.input),...Object.values(sink.output)].some((amount) => amount! > 0)).toBe(true);
      }
      if (scenario.production) expect(state.produced?.charcoal).toBeGreaterThan(0);
      const previous = baseline?.results.find((result) => result.maps === scenario.maps && result.networks === scenario.networks && result.production === scenario.production);
      if (previous && baseline?.fixtureVersion === 4) {
        expect(delivered).toBe(previous.delivered);
        expect(peakTransfers).toBe(previous.peakTransfers);
      }
      const sorted = [...durations].sort((a, b) => a - b);
      const startSerialize = performance.now();
      const serialized = JSON.stringify(state);
      const serializeMs = performance.now() - startSerialize;
      const startClone = performance.now(); structuredClone(state);
      const cloneMs = performance.now() - startClone;
      const result = {
        ...scenario, nodes: sectors.reduce((sum, s) => sum + s.nodes.length, 0),
        cables: sectors.reduce((sum, s) => sum + s.connections.length, 0),
        roadPairs: scenario.maps * scenario.networks, simulatedMs, wallMs,
        realtimeHeadroom: simulatedMs / wallMs,
        averageTickMs: durations.reduce((sum, n) => sum + n, 0) / durations.length,
        p95TickMs: sorted[Math.ceil(sorted.length * .95) - 1], maxTickMs: sorted.at(-1),
        ticksOver100Ms: durations.filter((n) => n > 100).length,
        peakTransfers, delivered, publications, serializeMs, cloneMs,
        saveBytes: Buffer.byteLength(serialized), conserved: true,
      };
      results.push(result);
      console.log('STRESS_RESULT', JSON.stringify(result));
      mkdirSync('outputs/stress', { recursive: true });
      writeFileSync('outputs/stress/latest.json', JSON.stringify({
        fixtureVersion: 4, generatedAt: new Date().toISOString(), cpu: cpus()[0]?.model, platform: platform(),
        node: process.version, warmupMs: 5000, results,
        limitations: ['Engine only; no React/Pixi rendering, browser scheduling, autosave writes, or undo history.',
          'Synthetic graphs bypass placement/collision checks; one-map control uses a local road pair.',
          'Production converts wood to charcoal one-for-one. Both Road endpoints have dedicated Carts. Fixtures with other layouts cannot be compared directly.'],
      }, null, 2));
    }
  }, 240_000);
});
