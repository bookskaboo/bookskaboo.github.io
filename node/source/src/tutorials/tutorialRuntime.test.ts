import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameEngine, createInitialState } from '../simulation/engine';
import { createTutorialState, lessonSatisfied, PRODUCTION_TARGETS, TARGETS, EXPANSION_HOME, EXPANSION_OUTPOST, EXPANSION_ROAD_TARGET, tutorialNode, BASIC_STAGES, MANUAL_STAGES } from './tutorialRuntime';
import { correctTutorialPlacement, tutorialPlacementTarget, basicTutorialPlacementKind } from './tutorialRuntime';
import { getNodeSize } from '../renderer/nodeLayout';
import { getPortAnchor } from '../renderer/nodeLayout';
import { getSectorWorldSize } from '../simulation/worldGeneration';

afterEach(() => vi.unstubAllGlobals());
const run = (engine: GameEngine, seconds: number) => { for (let i = 0; i < seconds * 10; i++) engine.tick(100); };

describe('imported tutorial practice', () => {
  it('only permits the intended Basics machine, including selection steps before placement', () => {
    const extractor = tutorialNode('extractor', 'wood', 650, 340);
    const gear = tutorialNode('refiner', 'gear', 1010, 1040, { recipeId: 'copper-gear' });
    const placements = { 'build-explain': 'extractor', 'build-place': 'extractor', 'chest-shortcut': 'woodenChest', 'chest-place': 'woodenChest', 'make-charcoal': 'kiln', 'mine-copper': 'extractor', 'make-plates': 'smelter', 'make-gears': 'refiner', 'make-core': 'refiner', 'build-lab': 'researchCenter' } as const;
    for (const stage of BASIC_STAGES) {
      const nodes = stage === 'make-core' ? [extractor, gear] : [extractor];
      const initialNodes = stage === 'build-explain' || stage === 'build-place' ? [] : nodes;
      const intended = placements[stage as keyof typeof placements];
      expect(basicTutorialPlacementKind(stage, initialNodes), stage).toBe(intended);
      if (intended) {
        const placed = tutorialNode(intended, 'new-machine', 1700, 1000);
        expect(basicTutorialPlacementKind(stage, [...initialNodes, placed]), `${stage} after placement`).toBeUndefined();
      }
    }
  });
  it('places the Core Refiner and Research Center to the right of the actual previous machine', () => {
    const gear = tutorialNode('refiner', 'gear', 1100, 990, { recipeId: 'copper-gear' });
    expect(tutorialPlacementTarget('make-core', [gear])).toEqual({ kind: 'refiner', x: 1460, y: 990 });
    const core = tutorialNode('refiner', 'core', 1500, 1010, { recipeId: 'simple-core' });
    expect(tutorialPlacementTarget('build-lab', [gear, core])).toEqual({ kind: 'researchCenter', x: 1860, y: 1010 });
  });
  it('keeps the final Basics step reachable by both Options and explicit continuation', () => {
    const last = BASIC_STAGES.at(-1)!;
    const penultimate = BASIC_STAGES.at(-2)!;
    expect(last).toBe('options-explain');
    expect(MANUAL_STAGES.has(last)).toBe(true);
    expect(MANUAL_STAGES.has(penultimate)).toBe(true);
    expect(lessonSatisfied(penultimate, createTutorialState('basic'), 'options')).toBe(true);
    expect(lessonSatisfied(last, createTutorialState('basic'), 'options')).toBe(false);
    const completed = createTutorialState('basic');
    completed.research.completed.push('assembler');
    expect(lessonSatisfied('cores-open', completed, null)).toBe(true);
  });
  it.each(['extractor','woodenChest','road'] as const)('leaves %s where placed when any of its footprint touches the marker',kind=>{
    const target={kind,x:1000,y:1000};
    const size=getNodeSize({kind} as Parameters<typeof getNodeSize>[0]);
    const point={x:target.x+size.w,y:target.y-size.h};
    expect(correctTutorialPlacement(kind,point,target)).toEqual({...point,corrected:false});
    const overlap={x:point.x-1,y:point.y+1};
    expect(correctTutorialPlacement(kind,overlap,target)).toEqual({...overlap,corrected:false});
    expect(correctTutorialPlacement(kind,{x:point.x+1,y:point.y},target)).toEqual({x:target.x,y:target.y,corrected:true});
    expect(correctTutorialPlacement(kind,{x:point.x,y:point.y-1},target)).toEqual({x:target.x,y:target.y,corrected:true});
  });
  it('places the lesson machine at the marker even when the clicked spot is blocked', () => {
    const engine=new GameEngine(createTutorialState('basic'),{autosave:false});
    const target=tutorialPlacementTarget('build-place',engine.getSector().nodes)!;
    expect(engine.getNodePlacementPreview('extractor',270,340)?.valid).toBe(false);
    const destination=correctTutorialPlacement('extractor',{x:270,y:340},target);
    expect(destination).toEqual({...TARGETS.extractor,corrected:true});
    const id=engine.placeNode('extractor',destination.x,destination.y);
    expect(engine.getSector().nodes.find(node=>node.id===id)).toMatchObject({...TARGETS.extractor,kind:'extractor'});
  });
  it('uses one target definition for production, Chests, and paired Roads without affecting ordinary placement', () => {
    expect(tutorialPlacementTarget('chest-place',[])).toEqual({kind:'woodenChest',...TARGETS.woodenChest});
    expect(tutorialPlacementTarget('make-charcoal',[])).toEqual({kind:'kiln',...PRODUCTION_TARGETS.kiln});
    expect(tutorialPlacementTarget('expansion-road-place',[])).toEqual({kind:'road',...EXPANSION_ROAD_TARGET});
    expect(correctTutorialPlacement('kiln',{x:900,y:300})).toEqual({x:900,y:300,corrected:false});
    expect(correctTutorialPlacement('extractor',TARGETS.extractor,{kind:'extractor',...TARGETS.extractor}).corrected).toBe(false);
  });
  it('activates, visits, and returns before physically shipping outpost Wood Home through a new Road pair', () => {
    const engine = new GameEngine(createTutorialState('expansion'), { autosave: false });
    const game = engine.getState();
    expect(game.research.mapPoints).toBe(1);
    expect(EXPANSION_OUTPOST).toBe('4,5');
    const home = game.sectors[EXPANSION_HOME], outpost = game.sectors[EXPANSION_OUTPOST];
    expect(outpost.x).toBeLessThan(home.x);
    expect(EXPANSION_ROAD_TARGET.x).toBe(getSectorWorldSize(outpost, game.research.completed).width - 67.5);
    for (const cable of outpost.connections) {
      const from = outpost.nodes.find(node => node.id === cable.from)!;
      const to = outpost.nodes.find(node => node.id === cable.to)!;
      expect(from.x + getPortAnchor(from, 'output', cable.fromPort ?? 0).x).toBeLessThan(to.x + getPortAnchor(to, 'input', cable.toPort ?? 0).x);
    }
    expect(Object.values(game.sectors).flatMap(sector => sector.nodes).every(node => !Object.values(node.input).some(Boolean) && !Object.values(node.output).some(Boolean))).toBe(true);
    engine.switchSector(EXPANSION_OUTPOST);
    expect(game.activeSectorId).toBe(EXPANSION_HOME);
    expect(lessonSatisfied('expansion-map-open', game, 'map')).toBe(true);
    expect(engine.unlockSector(4, 5)).toBe(true);
    expect(game.research.mapPoints).toBe(0);
    expect(game.activeSectorId).toBe(EXPANSION_HOME);
    expect(lessonSatisfied('expansion-activate', game, 'map')).toBe(true);
    expect(lessonSatisfied('expansion-travel', game, 'map')).toBe(false);
    expect(engine.unlockSector(4, 5)).toBe(false);
    engine.switchSector(EXPANSION_OUTPOST);
    expect(lessonSatisfied('expansion-travel', game, null)).toBe(true);
    run(engine, 15);
    const outpostChest = engine.getSector().nodes.find(node => node.id === 'expansion-outpost-chest')!;
    expect((outpostChest.input.wood ?? 0) + (outpostChest.output.wood ?? 0)).toBeGreaterThan(0);
    engine.switchSector(EXPANSION_HOME);
    expect(lessonSatisfied('expansion-return', game, null)).toBe(true);
    engine.switchSector(EXPANSION_OUTPOST);
    expect(lessonSatisfied('expansion-outpost', game, null)).toBe(true);
    const roadId = engine.placeNode('road', EXPANSION_ROAD_TARGET.x, EXPANSION_ROAD_TARGET.y)!;
    expect(roadId).toBeTruthy();
    const sender = engine.getSector().nodes.find(node => node.id === roadId)!;
    const receiver = game.sectors[EXPANSION_HOME].nodes.find(node => node.id === sender.pairedRoadId)!;
    sender.constructionMs = 0; receiver.constructionMs = 0;
    expect(sender).toMatchObject({ roadMode: 'export', pairedSectorId: EXPANSION_HOME });
    expect(receiver).toMatchObject({ roadMode: 'import', pairedSectorId: EXPANSION_OUTPOST, pairedRoadId: roadId });
    expect(receiver.x).toBe(67.5);
    expect(outpostChest.x + getPortAnchor(outpostChest, 'output', 0).x).toBeLessThan(sender.x + getPortAnchor(sender, 'input', 0).x);
    const homeChest = home.nodes.find(node => node.id === 'expansion-home-chest')!;
    expect(receiver.x + getPortAnchor(receiver, 'output', 0).x).toBeLessThan(homeChest.x + getPortAnchor(homeChest, 'input', 0).x);
    expect(lessonSatisfied('expansion-road-place', game, null)).toBe(true);
    expect(engine.connect(outpostChest.id, roadId)).toBe(true);
    expect(lessonSatisfied('expansion-road-feed', game, null)).toBe(true);
    run(engine, 5);
    expect(receiver.input).toEqual({}); expect(receiver.output).toEqual({});
    expect(lessonSatisfied('expansion-deliver', game, null)).toBe(false);
    engine.switchSector(EXPANSION_HOME);
    expect(lessonSatisfied('expansion-home-receive', game, null)).toBe(true);
    expect(engine.connect(receiver.id, 'expansion-home-chest')).toBe(true);
    run(engine, 5);
    expect(lessonSatisfied('expansion-deliver', game, null)).toBe(true);
    expect(game.sectors[EXPANSION_HOME].nodes.find(node => node.id === 'expansion-home-lab')!.input).toEqual({});
  });

  it('restarts Expansion with a fresh Map Point and never autosaves its practice progress', () => {
    const setItem = vi.fn(); vi.stubGlobal('localStorage', { setItem });
    const source = createTutorialState('expansion');
    const before = structuredClone(source);
    const engine = new GameEngine(source, { autosave: false });
    engine.unlockSector(4, 5); engine.switchSector(EXPANSION_OUTPOST);
    engine.updatePreferences({ autosaveMinutes: 1 }); run(engine, 65);
    expect(source).toEqual(before);
    expect(setItem).not.toHaveBeenCalled();
    engine.replaceState(createTutorialState('expansion'));
    expect(engine.getState()).toMatchObject({ activeSectorId: EXPANSION_HOME, research: { mapPoints: 1 } });
    expect(engine.getState().sectors[EXPANSION_OUTPOST].unlocked).toBe(false);
    expect(Object.values(engine.getState().sectors).flatMap(sector => sector.nodes).some(node => node.kind === 'road')).toBe(false);
  });

  it('produces the first Core from raw resources and spends it without resetting the factory', () => {
    const engine = new GameEngine(createTutorialState('basic'), { autosave: false });
    expect(engine.getSector().nodes.every(n => Object.keys(n.input).length === 0 && Object.keys(n.output).length === 0)).toBe(true);
    const place = (kind: Parameters<GameEngine['placeNode']>[0], point: {x:number;y:number}) => {
      const id = engine.placeNode(kind, point.x, point.y);
      expect(id).toBeTruthy();
      engine.getSector().nodes.find(n => n.id === id)!.constructionMs = 0;
      return id!;
    };
    const connect = (from:string, to:string, toPort=0) => expect(engine.connectPorts(from, 0, to, toPort)).toBe(true);
    const wood = place('extractor', TARGETS.extractor);
    const chest = place('woodenChest', TARGETS.woodenChest);
    connect('tutorial-forest', wood); connect(wood, chest); run(engine, 10);
    expect(lessonSatisfied('store-item', engine.getState(), null)).toBe(true);
    const kiln = place('kiln', PRODUCTION_TARGETS.kiln); connect(chest, kiln); run(engine, 10);
    expect(lessonSatisfied('make-charcoal', engine.getState(), null)).toBe(true);
    const copper = place('extractor', PRODUCTION_TARGETS.copperExtractor); connect('tutorial-copper', copper); run(engine, 7);
    expect(lessonSatisfied('mine-copper', engine.getState(), null)).toBe(true);
    const smelter = place('smelter', PRODUCTION_TARGETS.smelter); expect(engine.setRecipe(smelter, 'smelt-copper')).toBe(true); connect(copper, smelter); connect(kiln, smelter, 1); run(engine, 20);
    expect(lessonSatisfied('make-plates', engine.getState(), null)).toBe(true);
    const gears = place('refiner', PRODUCTION_TARGETS.gearRefiner); expect(engine.setRecipe(gears, 'copper-gear')).toBe(true); connect(smelter, gears); run(engine, 30);
    expect(lessonSatisfied('make-gears', engine.getState(), null)).toBe(true);
    expect(lessonSatisfied('make-core', engine.getState(), null)).toBe(false);
    const cores = place('refiner', PRODUCTION_TARGETS.coreRefiner); expect(engine.setRecipe(cores, 'simple-core')).toBe(true); connect(gears, cores); run(engine, 30);
    expect(lessonSatisfied('make-core', engine.getState(), null)).toBe(true);
    expect(engine.getState().extracted!.wood).toBeGreaterThan(0);
    expect(engine.getState().extracted!.copper).toBeGreaterThan(0);
    const lab = place('researchCenter', PRODUCTION_TARGETS.researchCenter); connect(cores, lab); run(engine, 5);
    expect(lessonSatisfied('deliver-core', engine.getState(), null)).toBe(true);
    engine.selectResearch('assembler'); run(engine, 20);
    expect(lessonSatisfied('cores-explain', engine.getState(), null)).toBe(true);
    expect(engine.getSector().nodes.some(n => n.id === wood)).toBe(true);
    expect(engine.getState().produced!['simple-core']).toBeGreaterThan(0);
  });

  it('never autosaves practice or mutates the original factory', () => {
    const setItem = vi.fn();
    vi.stubGlobal('localStorage', { setItem });
    const original = createInitialState(45);
    const before = structuredClone(original);
    const engine = new GameEngine(createTutorialState('basic'), { autosave: false });
    engine.updatePreferences({ autosaveMinutes: 1 });
    run(engine, 65);
    expect(setItem).not.toHaveBeenCalled();
    expect(original).toEqual(before);
    const normal = new GameEngine(original);
    normal.updatePreferences({ autosaveMinutes: 1 });
    run(normal, 65);
    expect(setItem).toHaveBeenCalledWith('factorinode.temporary-save.v1', expect.any(String));
  });

  it('accepts the supported Joint and Splitter exercises using real connection rules', () => {
    const engine = new GameEngine(createTutorialState('logistics'), { autosave: false });
    expect(engine.connectPorts('tutorial-forest', 0, 'tutorial-joint', 0)).toBe(true);
    expect(engine.connectPorts('tutorial-joint', 0, 'tutorial-extractor-a', 0)).toBe(true);
    expect(lessonSatisfied('logistics-joint-connect', engine.getState(), null)).toBe(true);
    engine.moveNodes(['tutorial-joint'], 0, 310);
    expect(lessonSatisfied('logistics-joint-move', engine.getState(), null)).toBe(true);
    engine.replaceState(createTutorialState('logistics', 'splitter'));
    expect(engine.connectPorts('tutorial-extractor-a', 0, 'tutorial-splitter', 0)).toBe(true);
    expect(engine.connectPorts('tutorial-splitter', 0, 'tutorial-kiln-a', 0)).toBe(true);
    expect(engine.connectPorts('tutorial-splitter', 1, 'tutorial-kiln-b', 0)).toBe(true);
    expect(lessonSatisfied('logistics-splitter-connect', engine.getState(), null)).toBe(true);
    run(engine, 25);
    expect(engine.getSector().nodes.filter(n => n.kind === 'kiln').every(n => (n.output.charcoal ?? 0) > 0)).toBe(true);
  });

  it('lets bot deliveries suppress the practice camp', () => {
    const engine = new GameEngine(createTutorialState('monster-camps'), { autosave: false });
    expect(engine.connectPorts('tutorial-bots', 0, 'tutorial-camp', 0)).toBe(true);
    run(engine, 10);
    expect(lessonSatisfied('monster-camp-suppression', engine.getState(), null)).toBe(true);
  });
});
