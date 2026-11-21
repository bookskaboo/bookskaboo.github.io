import { createInitialState, GameEngine } from '../../src/simulation/engine';

export function createRoadWorkshop() {
  const initial = createInitialState(37);
  const engine = new GameEngine(initial, { autosave: false }), state=engine.getState();
  state.paused = true; state.borderObstructions = [];
  state.research.unlocked.push('road'); state.research.completed.push('road', 'roadChannels1', 'roadChannels2');
  for (let y=4;y<=6;y++) for (let x=4;x<=6;x++) {
    const sector = engine.ensureSector(x,y);
    sector.unlocked=true; sector.visited=true; sector.nodes=[]; sector.connections=[];
    state.sectors[sector.id]=sector;
  }
  for (let y=4;y<=6;y++) for (let x=4;x<=6;x++) {
    engine.switchSector(`${x},${y}`);
    if (x<6 && !engine.placeNode('road',3590,1200)) throw new Error(`Workshop ${x},${y} east Road: ${engine.getNodePlacementError('road',3590,1200)}`);
    if (y<6 && !engine.placeNode('road',1800,2390)) throw new Error(`Workshop ${x},${y} south Road: ${engine.getNodePlacementError('road',1800,2390)}`);
  }
  for (const sector of Object.values(state.sectors)) for (const node of sector.nodes) node.constructionMs=0;
  engine.switchSector('5,5');
  return engine;
}
