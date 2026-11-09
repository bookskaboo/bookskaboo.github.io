import {describe,it,expect} from 'vitest';
import {createInitialState,GameEngine} from './engine';
import {RECIPES,isRecipeUnlocked} from '../content/recipes';
import {CORE_ITEMS,WASTE_ITEMS} from '../content/progression';
import {getResearchCosts,isResearchAvailable,RESEARCH_PROJECTS} from '../content/research';
import {generateSector} from './worldGeneration';
import {normalizeLegacy} from '../persistence/saves';
import type {MachineNode,NodeKind,ItemId} from '../domain/types';
const machine=(kind:NodeKind,id=kind as string,extra:Partial<MachineNode>={}):MachineNode=>({id,kind,name:kind,x:400,y:400,rotation:0,input:{},output:{},progressMs:0,cycleMs:1000,constructedAt:0,constructionMs:0,...extra});
function setup(nodes:MachineNode[],completed:string[]=[]){const state=createInitialState(204);state.sectors['5,5'].nodes=nodes;state.research.completed=completed;state.research.unlocked.push(...completed);const e=new GameEngine(state);return e;}
const tick=(e:GameEngine,seconds:number)=>{for(let i=0;i<seconds*10;i++)e.tick(100);};
describe('six-tier gameplay progression',()=>{
 it('normalizes saved Mythril display names without changing stored resources or research IDs',()=>{
  const state=createInitialState(204);
  state.progressionVersion=1;
  state.sectors['5,5'].name='Mithril works';
  state.sectors['5,5'].nodes=[machine('advancedAssembler','saved',{name:'Mithril assembler',recipeId:'mithril-mesh',input:{'refined-mithril':2},output:{'mithril-mesh':1}})];
  state.research.completed=['mithrilTools'];
  state.research.unlocked.push('mithrilTools');
  state.factoryTemplates=[{name:'Mithril line',nodes:[machine('advancedAssembler','template',{name:'Mithril assembler',recipeId:'mithril-mesh'})],connections:[]}];
  const engine=new GameEngine(state);
  const loaded=engine.getState();
  expect(loaded.sectors['5,5'].name).toBe('Mythril works');
  expect(loaded.sectors['5,5'].nodes[0]).toMatchObject({name:'Mythril assembler',recipeId:'mithril-mesh',input:{'refined-mithril':2},output:{'mithril-mesh':1}});
  expect(loaded.research.completed).toContain('mithrilTools');
  expect(loaded.factoryTemplates?.[0]).toMatchObject({name:'Mythril line',nodes:[{name:'Mythril assembler',recipeId:'mithril-mesh'}]});
 });
 it.each([
  ['assembler','composite-mythril-gear'],['assembler','composite-mythril-wire'],
  ['separationFurnace','refined-mithril'],['advancedAssembler','mithril-mesh'],
  ['advancedAssembler','precision-controller'],['advancedAssembler','logic-substrate'],
  ['advancedAssembler','advanced-actuator'],['advancedAssembler','command-core'],
 ] as const)('produces %s recipe %s at its base time within five-item buffers',(kind,id)=>{
  const r=RECIPES[id];
  const e=setup([machine(kind,'producer',{capacity:5})],['assembler','fabricatorTools','mithrilTools','oreSeparation','precisionControl']);
  expect(e.setRecipe('producer',id)).toBe(true);
  const n=e.getSector().nodes[0];n.input={...r.inputs};
  tick(e,r.cycleMs/1000-.1);expect(n.output).toEqual({});
  tick(e,.1);
  for(const [item,amount] of Object.entries(r.outputs))expect(n.output[item as ItemId]).toBe(amount);
  expect(Object.values(n.output).reduce((sum,n)=>sum+(n??0),0)).toBeLessThanOrEqual(5);
  expect(Object.values(n.input).every(n=>!n)).toBe(true);
 });
 it('gates composite recipes at Precision Control and retains the Refiner alternatives',()=>{
  for(const id of ['composite-mythril-gear','composite-mythril-wire']){
   expect(isRecipeUnlocked(id,['oreSeparation'])).toBe(false);
   expect(isRecipeUnlocked(id,['precisionControl'])).toBe(true);
  }
  expect(RECIPES['mythril-gear'].inputs).toEqual({'mythril-plate':2});
  expect(RECIPES['mythril-wire'].inputs).toEqual({'mythril-plate':3});
 });
 it('refreshes old recipe times on load without discarding a committed batch or stored inputs',()=>{
  const savedInput={'refined-mithril':3};
  const e=setup([machine('advancedAssembler','old',{recipeId:'precision-controller',cycleMs:12000,progressMs:1000,input:savedInput,batch:{recipeId:'precision-controller',outputs:{'precision-controller':1,'metallic-fines':1}}})],['precisionControl']);
  const n=e.getSector().nodes[0];expect(n.cycleMs).toBe(30000);expect(n.input).toEqual(savedInput);
  tick(e,29);expect(n.output).toEqual({'precision-controller':1,'metallic-fines':1});
  expect(n.batch).toBeUndefined();expect(n.input).toEqual(savedInput);
 });
 it('keeps researched fabrication after undo and prevents Inventory copying',()=>{
  const e=setup([machine('inventory','i',{x:500,y:500})],['autonomousLogistics','fabricatorTools']);
  expect(e.duplicateNodes(['i'])).toEqual([]);
  e.getState().research.mapPoints=2;e.unlockSector(6,5);e.switchSector('6,5');e.undo();
  expect(e.getState().research.completed).toContain('fabricatorTools');
 });
 it('sends exactly one item every five seconds and preserves the remainder',()=>{
  const e=setup([machine('woodenChest','chest',{input:{copper:8},output:{copper:4}}),machine('road','out',{roadMode:'export',pairedSectorId:'6,5',pairedRoadId:'in'})]);
  const other=generateSector(6,5,204,0);other.unlocked=true;other.nodes=[machine('road','in',{roadMode:'import'}),machine('woodenChest','sink',{output:{copper:10}})];other.connections=[{id:'receive',from:'in',to:'sink',fromPort:0,toPort:0,createdAt:0}];e.getState().sectors[other.id]=other;
  const received=()=> (other.nodes[1].input.copper??0)+(other.nodes[1].output.copper??0);
  e.getSector().connections=[{id:'c',from:'chest',to:'out',fromPort:0,toPort:0,createdAt:0}];
  tick(e,4.9);expect(received()).toBe(10);tick(e,.1);
  expect(Object.values(e.getSector().nodes[0].input).reduce((a,b)=>a+(b??0),0)+Object.values(e.getSector().nodes[0].output).reduce((a,b)=>a+(b??0),0)).toBe(11);
  expect(received()).toBe(11);tick(e,5);
  expect(received()).toBe(12);expect(other.nodes[0].output).toEqual({});
 });
 it('drains a legacy forty-item sending chest directly into a receiving Cart without losing items',()=>{
  const chest=machine('woodenChest','chest',{input:{copper:20},output:{copper:20}});
  const e=setup([chest,machine('road','out',{roadMode:'export',pairedSectorId:'6,5',pairedRoadId:'in'})]);
  const sender=e.getSector().nodes[0];
  const other=generateSector(6,5,204,0);other.unlocked=true;other.nodes=[machine('road','in',{roadMode:'import'}),machine('woodenChest','sink')];other.connections=[{id:'receive',from:'in',to:'sink',fromPort:0,toPort:0,createdAt:0}];e.getState().sectors[other.id]=other;
  const received=()=> (other.nodes[1].input.copper??0)+(other.nodes[1].output.copper??0);
  e.getSector().connections=[{id:'c',from:'chest',to:'out',fromPort:0,toPort:0,createdAt:0}];
  tick(e,100);expect(received()).toBe(20);
  expect((sender.input.copper??0)+(sender.output.copper??0)).toBe(20);
  tick(e,30);expect(received()).toBe(20);
  expect((sender.input.copper??0)+(sender.output.copper??0)).toBe(20);
  other.nodes[1].input={};other.nodes[1].output={};tick(e,4.9);expect(received()).toBe(0);
  tick(e,.1);expect(received()).toBe(1);
  expect((sender.input.copper??0)+(sender.output.copper??0)).toBe(19);
  tick(e,95);expect(received()).toBe(20);expect(other.nodes[0].output).toEqual({});
  expect((sender.input.copper??0)+(sender.output.copper??0)).toBe(0);
 });
 it('has no direct or indirect core ingredients and names Copper Slurry',()=>{
  const walk=(id:string,path:string[]=[])=>{expect(path).not.toContain(id);for(const input of Object.keys(RECIPES[id]?.inputs??{})){expect(CORE_ITEMS).not.toContain(input);walk(input,[...path,id]);}};
  CORE_ITEMS.forEach(id=>walk(id));expect(RECIPES['conductive-slurry'].name).toBe('Copper Slurry');
 });
 it('requires every paid prerequisite, not just a revealed schematic',()=>{
  const p=RESEARCH_PROJECTS.find(p=>p.id==='precisionControl')!;
  expect(isResearchAvailable(p,['oreSeparation'])).toBe(true);
  expect(isResearchAvailable(p,['oreSeparation','mineralRecovery'])).toBe(true);
  expect(isRecipeUnlocked('command-core',[])).toBe(false);
 });
 it('consumes a whole six-core set and waits without draining partial sets',()=>{
  const e=setup([machine('researchCenter','lab')],['mineralRegeneration2']);e.selectResearch('mineralRegenerationRate');
  const lab=e.getSector().nodes[0];lab.input=Object.fromEntries(CORE_ITEMS.slice(0,5).map(i=>[i,2]));tick(e,2);expect(e.getState().research.contributed).toEqual({});
  lab.input['command-core']=1;tick(e,5);expect(Object.values(e.getState().research.contributed)).toEqual([1,1,1,1,1,1]);expect(lab.input['command-core']).toBe(0);
 });
 it('completes saved contributions above a newly reduced price without more inputs',()=>{
  const e=setup([machine('researchCenter')]);e.selectResearch('assembler');e.getState().research.contributed={'simple-core':3};tick(e,.1);expect(e.getState().research.completed).toContain('assembler');
 });
 it('does not grant a discovery merely by generating or activating a map',()=>{
  const e=setup([]);const map=generateSector(7,5,204,0);map.unlocked=true;e.getState().sectors[map.id]=map;tick(e,.1);
  expect(e.getState().research.completed).not.toContain('lakeTools');e.switchSector(map.id);expect(e.getState().research.completed).toContain('lakeTools');expect(e.getState().research.completed).not.toContain('mithrilTools');
 });
 it('does not interrupt a selected paid project on discovery',()=>{
  const e=setup([machine('researchCenter')]);e.selectResearch('extractor1');e.getState().research.contributed={'simple-core':3,'basic-core':3};
  const map=generateSector(6,5,204,0);map.unlocked=true;e.getState().sectors[map.id]=map;e.switchSector(map.id);
  expect(e.getState().research.completed).not.toContain('fabricatorTools');expect(e.getState().research.selected).toBe('extractor1');expect(e.getState().research.contributed['simple-core']).toBe(3);
 });
 it('does not grant Mythril processing or waste handling for merely visiting a deposit',()=>{
  const e=setup([machine('researchCenter')]);e.selectResearch('extractor1');e.getState().research.contributed={'simple-core':3};
  const map=generateSector(9,5,204);map.unlocked=true;map.nodes=[machine('mythril','deposit')];e.getState().sectors[map.id]=map;e.switchSector(map.id);
  expect(e.getState().research.completed).not.toContain('mithrilTools');
  expect(e.getState().research.completed).not.toContain('sortingTools');
  expect(e.getState().research.selected).toBe('extractor1');
 });
 it('grants basic handling and direct Fines recovery with Precision Control, without Complex Cores',()=>{
  const r=RECIPES['recover-fines'];const e=setup([machine('hydroProcessor','wash',{recipeId:r.id,input:{...r.inputs}})],['precisionControl']);
  expect(e.getState().research.completed).toEqual(expect.arrayContaining(['sortingTools','mineralRecovery']));
  tick(e,10);expect(e.getSector().nodes[0].output).toEqual({'iron-plate':1});
  expect(isRecipeUnlocked('slagwashing',e.getState().research.completed)).toBe(false);
 });
 it('replaces the fabrication landmark while preserving water and Mythril tier rules',()=>{
  for(const seed of [1,7,204,999]){expect(generateSector(6,5,seed).nodes.some(n=>n.kind==='abandonedFabricator')).toBe(false);const map=generateSector(7,5,seed);expect(map.nodes.some(n=>n.kind==='lake')).toBe(true);expect(map.nodes.some(n=>n.kind==='mythril')).toBe(false);expect(map.nodes.some(n=>n.kind==='monster-camp')).toBe(false);}
 });
 it('credits already visited legacy maps and supplies the waste fallback on load',()=>{
  const s=createInitialState(204);const map=generateSector(6,5,204);map.unlocked=true;s.sectors[map.id]=map;s.research.completed.push('precisionControl');
  const e=new GameEngine(normalizeLegacy(s)!);expect(e.getState().research.completed).not.toContain('fabricatorTools');expect(e.getState().research.completed).toContain('sortingTools');
 });
 it('researches Advanced Fabrication with tier-three Core sets and no landmark or advanced machine',()=>{
  const project=RESEARCH_PROJECTS.find(p=>p.id==='fabricatorTools')!;
  expect(project.trigger).toBeUndefined();
  expect(project.costs).toEqual({'simple-core':2,'basic-core':2,'automata-core':2});
  expect(isResearchAvailable(project,[])).toBe(false);
  expect(isResearchAvailable(project,['assembler'])).toBe(false);
  expect(isResearchAvailable(project,['assembler','automataCore'])).toBe(true);
  expect(isRecipeUnlocked('basic-core',['assembler'])).toBe(true);
  const e=setup([machine('researchCenter','lab',{input:{'simple-core':2,'basic-core':2,'automata-core':2}})],['assembler','automataCore']);
  e.selectResearch('fabricatorTools');tick(e,15);
  expect(e.getState().research.completed).toContain('fabricatorTools');
  expect(e.getSector().nodes[0].input).toEqual({'simple-core':0,'basic-core':0,'automata-core':0});
 });
 it('keeps Mythril refining deterministic and waste chances exclusive to tier-six intermediates',()=>{
  expect(RECIPES['refined-mithril'].chanceOutputs).toBeUndefined();
  for(const r of Object.values(RECIPES))if(r.chanceOutputs?.length)expect(r.unlockResearch).toBe('precisionControl');
 });
 it('reserves worst-case waste space before consuming any inputs',()=>{
  const r=RECIPES['precision-controller'];const e=setup([machine('advancedAssembler','a',{recipeId:r.id,cycleMs:r.cycleMs,capacity:64,input:{...r.inputs},output:{'metallic-fines':32}})],['precisionControl']);
  tick(e,1);const n=e.getSector().nodes[0];expect(n.batch).toBeUndefined();expect(n.input).toEqual(r.inputs);
 });
 it('persists a random batch through reload without consuming inputs or rerolling',()=>{
  const r=RECIPES['precision-controller'];const e=setup([machine('advancedAssembler','a',{recipeId:r.id,cycleMs:r.cycleMs,capacity:64,input:{...r.inputs}})],['precisionControl']);
  tick(e,.1);const n=e.getSector().nodes[0];expect(n.batch).toBeDefined();const outcome=structuredClone(n.batch!.outputs);const rng=e.getState().randomState;
  expect(e.setRecipe(n.id,'logic-substrate')).toBe(false);
  const loaded=new GameEngine(normalizeLegacy(structuredClone(e.getState()))!);tick(e,r.cycleMs/1000-.1);tick(loaded,r.cycleMs/1000-.1);
  expect(loaded.getSector().nodes[0].output).toEqual(outcome);expect(loaded.getSector().nodes[0].output).toEqual(n.output);expect(loaded.getState().randomState).toBe(rng);
 });
 it('never duplicates an in-progress batch when copying nodes',()=>{
  const r=RECIPES['precision-controller'];const e=setup([machine('advancedAssembler','a',{x:900,y:900,recipeId:r.id,cycleMs:r.cycleMs,capacity:64,input:{...r.inputs}})],['precisionControl']);tick(e,.1);
  const ids=e.duplicateNodes(['a']);expect(ids.length).toBe(1);const copied=e.getSector().nodes.find(n=>n.id===ids[0])!;expect(copied.batch).toBeUndefined();expect(copied.input).toEqual({});
 });
 it('draws four Water per second and limits each lake to two Intakes',()=>{
  const e=setup([machine('lake','lake',{x:500,y:800,resourceItem:'water'}),machine('lakeIntake','a',{x:1500,y:300}),machine('lakeIntake','b',{x:1500,y:800}),machine('lakeIntake','c',{x:1500,y:1300})],['lakeTools']);
  expect(e.connectPorts('lake',0,'a',0)).toBe(true);expect(e.connectPorts('lake',1,'b',0)).toBe(true);expect(e.connectPorts('lake',2,'c',0)).toBe(false);tick(e,1);expect(e.getSector().nodes.find(n=>n.id==='a')!.output.water).toBe(4);
 });
 it('regenerates an empty ordinary deposit without collapsing it',()=>{
  const e=setup([machine('iron','ore',{resourceItem:'iron',resourceRemaining:0,resourceCapacity:10})],['mineralRegeneration']);tick(e,30);expect(e.getSector().nodes[0].kind).toBe('iron');expect(e.getSector().nodes[0].resourceRemaining).toBe(1);
 });
 it('scales repeatable costs from the original base with upward rounding',()=>{
  const p=RESEARCH_PROJECTS.find(p=>p.id==='storagePlacementCapacity')!;expect([0,1,2,3,4].map(rank=>getResearchCosts(p,rank)['command-core'])).toEqual([1,2,3,4,6]);
 });
 it('uses one global pool across maps, preserves overflow and respects the per-item cap',()=>{
  const e=setup([machine('storage','s',{input:{iron:1010}})],['autonomousLogistics']);const other=generateSector(6,5,204,0);other.nodes=[machine('inventory','i'),machine('filter','f',{filterItem:'iron'}),machine('warehouse','drain',{processingPaused:true})];other.unlocked=true;other.connections=[{id:'c',from:'i',to:'f',fromPort:0,toPort:0,createdAt:0},{id:'filtered',from:'f',to:'drain',createdAt:0}];e.getState().sectors[other.id]=other;
  tick(e,.1);expect(e.getState().globalPool?.iron).toBe(1000);expect(e.getSector().nodes[0].input.iron).toBe(10);tick(e,1);expect((other.nodes[1].input.iron??0)+(other.nodes[1].output.iron??0)+(other.nodes[2].input.iron??0)+(e.getState().inFlightTransfers??[]).filter(t=>!t.cosmeticOnly&&t.sectorId===other.id).length).toBeGreaterThan(0);expect(e.getState().globalPool!.iron).toBeLessThanOrEqual(1000);
 });
 it('converts stronger bots to strength and makes defeated Golems permanent sources',()=>{
  const e=setup([machine('resourceGolem','g',{health:24,golemCostVersion:2,input:{'command-suppression-bot':1},golemOutputs:['copper','stone']})],['resourceGolemSurvey']);tick(e,.1);const n=e.getSector().nodes[0];expect(n.defeated).toBe(true);expect(n.kind).toBe('copper');expect(n.infiniteResource).toBe(true);expect(n.input['command-suppression-bot']).toBeUndefined();tick(e,1);expect(n.output).toEqual({});
 });
 it('shares stronger bot strength with camp checks',()=>{
  const e=setup([machine('monster-camp','m',{campStrength:50,attackRequirement:20,input:{'heavy-suppression-bot':1,'medium-suppression-bot':4}})]);tick(e,60);expect(e.getSector().nodes[0].campStrength).toBe(40);expect(e.getSector().nodes[0].input).toEqual({});
 });
 it('saves empty factory layouts with a collision preview and atomic placement',()=>{
  const e=setup([machine('extractor','a',{x:500,y:500,output:{wood:4}})],['factoryTemplates']);expect(e.saveFactoryTemplate('test',['a'])).toBe(true);expect(e.getTemplatePreview(0,500,500)?.valid).toBe(false);expect(e.placeFactoryTemplate(0,500,500)).toBe(false);expect(e.getSector().nodes.length).toBe(1);expect(e.placeFactoryTemplate(0,1500,500)).toBe(true);expect(e.getSector().nodes[1].output).toEqual({});
 });
 it('gives waste a separate routable output and never accepts it on a product-only port',()=>{
  expect(WASTE_ITEMS).toContain('spent-flux');const r=RECIPES['refined-mithril'];expect(r.outputs.slag).toBeUndefined();expect(Object.keys(r.inputs).some(i=>CORE_ITEMS.includes(i as ItemId))).toBe(false);
 });
});
