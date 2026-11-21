import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { MapNodeDetails } from './MapNodeDetails';
import { NodeMinimap } from './NodeMinimap';
import { createInitialState, GameEngine } from '../simulation/engine';
import { NAMES } from '../domain/mapTerrain';
import { DevPanel } from './panels/DevPanel';

describe('terrain discovery presentation',()=>{
  it('lets older dev-revealed saves reapply full exploration, then disables the completed action',()=>{
    const engine=new GameEngine(createInitialState(37),{autosave:false}),game=engine.getState();engine.developerUnlockAllSectors();
    for(const sector of Object.values(game.sectors))sector.visited=sector.id===game.activeSectorId;
    const button=()=>renderToStaticMarkup(<DevPanel game={game} engine={engine} showAllBuildNodes={false} onShowAllBuildNodes={()=>{}} onPlaceSource={()=>{}} onClose={()=>{}}/>).match(/<button\b[^>]*>(?:(?!<\/button>)[\s\S])*?Unlock all map nodes(?:(?!<\/button>)[\s\S])*?<\/button>/)![0];
    expect(button()).not.toContain('disabled');engine.developerUnlockAllSectors();expect(button()).toContain('disabled');
  });
  it('shows the active and visited terrain using ordinary help text',()=>{
    const engine=new GameEngine(createInitialState(37),{autosave:false}),game=engine.getState();
    const html=()=>renderToStaticMarkup(<MapNodeDetails game={game} engine={engine} selectedId="4,5" onActivate={()=>{}}/>);
    game.sectors['4,5']=engine.ensureSector(4,5);game.sectors['4,5'].visited=true;game.sectors['4,5'].unlocked=true;
    expect(html()).toContain(`Terrain: ${NAMES[game.mapTerrains!['4,5']]}`);
    expect(html()).toContain('aria-label="Terrain"');
    expect(html()).toContain('<h3 style="color:');
    expect(html().indexOf('Terrain:')).toBeLessThan(html().indexOf('aria-label="Resources"'));
    const withSummary=renderToStaticMarkup(<MapNodeDetails game={game} engine={engine} selectedId="4,5" onActivate={()=>{}} borderPointsOfInterest={[{name:'East · Mountain'}]}/>);
    expect(withSummary.indexOf('East · Mountain')).toBeGreaterThan(withSummary.indexOf('aria-label="Points of Interest"'));
    expect(withSummary).not.toContain('Border obstructions');
  });
  it.each([false,true])('hides an unvisited terrain after purchase, including developer survey=%s',survey=>{
    const engine=new GameEngine(createInitialState(37),{autosave:false}),game=engine.getState();
    game.sectors['4,5']=engine.ensureSector(4,5);game.sectors['4,5'].unlocked=true;
    if(survey)game.devMapSurveysRevealed=true;
    const html=renderToStaticMarkup(<MapNodeDetails game={game} engine={engine} selectedId="4,5" onActivate={()=>{}}/>);
    expect(html).not.toContain('Terrain:');
  });
  it('leaves legacy selected-map text unchanged',()=>{
    const state=createInitialState(37);delete state.mapTerrainVersion;delete state.mapTerrains;
    const engine=new GameEngine(state,{autosave:false});
    expect(renderToStaticMarkup(<MapNodeDetails game={engine.getState()} engine={engine} selectedId="5,5" onActivate={()=>{}}/>)).not.toContain('Terrain:');
  });
  it('colors only visited expanded-map cells, preserving hidden purchased terrain and the compact map',()=>{
    vi.stubGlobal('window',{innerWidth:1280,innerHeight:900});
    try {
      const engine=new GameEngine(createInitialState(37),{autosave:false}),game=engine.getState();
      const visited=new Set<string>();
      for(const terrain of ['badlands','grassland','desert','rocky']) {
        const id=Object.keys(game.mapTerrains!).find(id=>game.mapTerrains![id]===terrain && id!=='5,5')!;
        const [x,y]=id.split(',').map(Number);game.sectors[id]=engine.ensureSector(x,y);game.sectors[id].unlocked=true;game.sectors[id].visited=true;visited.add(id);
      }
      const hidden=Object.keys(game.mapTerrains!).find(id=>id!=='5,5'&&!visited.has(id))!;
      const [x,y]=hidden.split(',').map(Number);game.sectors[hidden]=engine.ensureSector(x,y);game.sectors[hidden].unlocked=true;game.sectors[hidden].visited=false;game.devMapSurveysRevealed=true;
      const render=(expanded:boolean)=>renderToStaticMarkup(<NodeMinimap expanded={expanded} persistLayout={false} game={game} engine={engine} onTravel={()=>{}} onOpenMap={()=>{}} onClose={()=>{}} onHoverChange={()=>{}}/>);
      const expanded=render(true);
      for(const terrain of ['badlands','grassland','desert','rocky'])expect(expanded).toContain(`data-map-terrain="${terrain}"`);
      const hiddenTag=expanded.match(new RegExp(`<button[^>]*data-map-sector="${hidden}"[^>]*>`))![0];
      expect(hiddenTag).not.toContain('data-map-terrain');
      expect(render(false)).not.toContain('data-map-terrain');
      game.mapTerrainVersion=0;expect(render(true)).not.toContain('data-map-terrain');
    }finally{vi.unstubAllGlobals();}
  });
});
