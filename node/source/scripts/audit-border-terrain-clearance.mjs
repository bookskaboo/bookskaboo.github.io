import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';

const server = await createServer({ configFile: false, server: { middlewareMode: true, watch: null } });
const outputDir = process.argv[2] ?? 'outputs/border-obstructions-cluster-clearance';
try {
  const { createInitialState } = await server.ssrLoadModule('/src/simulation/engine.ts');
  const { generateBorderObstructions } = await server.ssrLoadModule('/src/simulation/borderObstructions.ts');
  const { sectorForState, getWorldFieldSize, generateSector } = await server.ssrLoadModule('/src/simulation/worldGeneration.ts');
  const { borderTerrainInsets, clearsBorderTerrain } = await server.ssrLoadModule('/src/simulation/borderTerrainClearance.ts');
  const { setActiveModRules } = await server.ssrLoadModule('/src/mods/modRules.ts');
  const { emptyMod } = await server.ssrLoadModule('/src/mods/modTypes.ts');
  const groups = [], started = performance.now();
  for (const config of [
    { size:11, seeds:1000, expansion:false, scale:1, width:1, height:1 },
    ...[13,15,17,19,21].map(size => ({ size, seeds:5, expansion:false, scale:1, width:1, height:1 })),
    { size:11, seeds:20, expansion:true, scale:2, width:1, height:1 },
    { size:11, seeds:10, expansion:false, scale:1, width:4, height:1 },
    { size:11, seeds:10, expansion:false, scale:1, width:1, height:4 },
  ]) {
    const failures = [], kinds = {}, group = { ...config, required:config.width===1 && config.height===1, maps:0, bodies:0, failures, kinds };
    for (let seed=0; seed<config.seeds; seed++) {
      const state = createInitialState(seed), mod = emptyMod();
      mod.rules = { worldGridSize:config.size, mapWidthMultiplier:config.width, mapHeightMultiplier:config.height };
      setActiveModRules(mod); state.worldGridSize = config.size;
      state.fieldSizeScale = config.scale;
      state.mapTerrainVersion = 0; delete state.mapTerrains;
      state.research.completed = config.expansion ? ['areaExpansion2'] : [];
      state.borderObstructions = generateBorderObstructions(seed,config.size);
      const field = getWorldFieldSize(state), largest = { width:5400*config.scale*config.width, height:3600*config.scale*config.height };
      for (const id of new Set(state.borderObstructions.flatMap(e => [e.from,e.to]))) {
        const [x,y] = id.split(',').map(Number);
        try {
          const sector = sectorForState(state,x,y), insets = borderTerrainInsets(state,id,largest);
          group.maps++;
          for (const node of sector.nodes) {
            group.bodies++; kinds[node.kind] = (kinds[node.kind] ?? 0)+1;
            if (!clearsBorderTerrain(node,field,insets)) failures.push({seed,id,kind:node.kind,reason:'Visible border reservation violated'});
          }
        } catch (error) {
          let terrainFreeGeneration = 'succeeded';
          try { generateSector(x,y,seed,0,state.research.completed,5,2,config.size,config.scale,2); }
          catch { terrainFreeGeneration = 'also failed'; }
          failures.push({seed,id,reason:String(error),terrainFreeGeneration});
        }
      }
      setActiveModRules();
    }
    groups.push(group);
  }
  const report = { generatedAt:new Date().toISOString(), milliseconds:Math.round(performance.now()-started), groups,
    rules:['Artwork-derived conservative half-band bounds plus 32 world units', 'Full settlement growth and defeated Golem reserve footprint', 'Reserve maximum Area Expansion peak height at initial generation', 'Preserve existing generated sectors and legacy clear borders'],
    limits:['Static generation audit, not a normal-play progression or optimization balance run', 'Does not reposition existing saved nodes', 'Extreme asymmetric mod fields are exploratory limit cases; failures remain explicit and never return border overlaps', 'Extreme mod node sizes can still exhaust bounded generation retries'] };
  await mkdir(outputDir,{recursive:true});
  await writeFile(`${outputDir}/generation-audit.json`,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({maps:groups.reduce((n,g)=>n+g.maps,0),bodies:groups.reduce((n,g)=>n+g.bodies,0),requiredFailures:groups.filter(g=>g.required).flatMap(g=>g.failures),exploratoryLimitCases:groups.filter(g=>!g.required).map(g=>({width:g.width,height:g.height,rejections:g.failures.length,terrainFreeAlsoFailed:g.failures.filter(f=>f.terrainFreeGeneration==='also failed').length})),milliseconds:report.milliseconds}));
  if(groups.some(g=>g.required&&g.failures.length))process.exitCode=1;
} finally { await server.close(); }
