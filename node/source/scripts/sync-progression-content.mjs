import { applyReviewedProduction } from './apply-reviewed-production.mjs';
// Compile the reviewed proposal into a typed, standalone gameplay catalog.
import {readFileSync,writeFileSync} from 'node:fs';
const d=JSON.parse(readFileSync('outputs/progression/core-design.json','utf8'));
const w=JSON.parse(readFileSync('outputs/progression/waste-design.json','utf8'));
const id=s=>s[0].toLowerCase()+s.slice(1).replaceAll(' ','');
const oldNames={'Automata Core':'automataCore','Basic Electricity':'basicElectricity','Suppression Bot':'suppressionBot','Research Center 1':'researchCenter1','Area Expansion 1':'areaExpansion1','Tree Planter':'treePlanter','Road':'road'};
const rid=s=>oldNames[s]??id(s);
const shortItemNames={"conductive-slurry":"Copper Slurry","hydraulic-actuator":"Hydro Piston","ceramic-electrode":"Electrode","refined-mithril":"Pure Mythril","precision-controller":"Controller","advanced-actuator":"Servo Piston","logic-substrate":"Logic Wafer","mineral-aggregate":"Aggregate","medium-suppression-bot":"Medium Bot","heavy-suppression-bot":"Heavy Bot","command-suppression-bot":"Command Bot"};
const pretty=s=>shortItemNames[s]??(s==='mythril'?'Mythril':s==='circuit-a'?'Circuit A':s.replaceAll('mithril','mythril').split('-').map(x=>x[0].toUpperCase()+x.slice(1)).join(' '));
const recipeUnlock={coolant:'lakeTools','conductive-slurry':'hydrochemistry','hydraulic-actuator':'hydraulicAssembly','ceramic-electrode':'hydraulicAssembly','hydro-core':'hydraulicAssembly','refined-mithril':'mithrilTools','mithril-mesh':'oreSeparation','shiny-core':'oreSeparation','precision-controller':'precisionControl','advanced-actuator':'precisionControl','logic-substrate':'precisionControl','command-core':'precisionControl','sealed-frame':'sealedRobotics','cooled-gun':'sealedRobotics','medium-suppression-bot':'sealedRobotics','mithril-frame':'heavyRobotics','focused-gun':'heavyRobotics','heavy-suppression-bot':'heavyRobotics','servo-frame':'commandRobotics','pulse-cannon':'commandRobotics','command-suppression-bot':'commandRobotics'};
const machineKindByName={'Hydro Processor':'hydroProcessor','Hydro Plant':'hydroProcessor','Advanced Assembler':'advancedAssembler','Assembler II':'advancedAssembler','Separation Furnace':'separationFurnace','Separator':'separationFurnace','Refiner':'refiner'};
const recipes={};
const groups={hydroProcessor:[],advancedAssembler:['motor','iron-gear'],separationFurnace:[],refiner:[]};
for(const [key,r]of Object.entries(d.recipes).filter(([,r])=>r.proposed)){
 recipes[key]={id:key,name:pretty(key),inputs:r.inputs,outputs:r.outputs,cycleMs:r.seconds*1000,...(r.chanceOutputs?{chanceOutputs:r.chanceOutputs}:{}),unlockResearch:recipeUnlock[key]};
 groups[machineKindByName[r.node]].push(key);
}
for(const r of w.recovery){const key=id(r.name);recipes[key]={id:key,name:r.name,inputs:r.inputs,outputs:r.outputs,cycleMs:r.seconds*1000,unlockResearch:['Slag washing','Recovered brick','Recovered iron'].includes(r.name)?'mineralRecovery':'precisionControl',recovery:true};groups[machineKindByName[r.node]].push(key);}
const oldItems=new Set('wood iron copper mythril stone water brick charcoal iron-plate copper-plate mythril-plate iron-gear copper-gear mythril-gear iron-wire copper-wire mythril-wire motor circuit-a simple-core basic-core automata-core simple-robot-frame simple-robot-gun suppression-bot power forest-growth'.split(' '));
const items=[...new Set(Object.values(recipes).flatMap(r=>[...Object.keys(r.inputs),...Object.keys(r.outputs),...(r.chanceOutputs??[]).map(o=>o.item)]))].filter(i=>!oldItems.has(i));
const names=Object.fromEntries(items.map(i=>[i,pretty(i)]));
const colors=Object.fromEntries(items.map(i=>[i,i==='hydro-core'?0x4cbce6:i==='shiny-core'?0xb9e780:i==='command-core'?0xc59cf3:['slag','metallic-fines','spent-flux','glassy-crust'].includes(i)?0x9c9386:0x85bab2]));
const mainDeps={Hydrochemistry:['Automata Core','Basic Electricity'],'Hydraulic Assembly':['Hydrochemistry'],'Fluid Routing':['Hydraulic Assembly'],'Sealed Robotics':['Hydraulic Assembly','Suppression Bot'],'Ore Separation':['Fluid Routing'],'Mineral Recovery':['Ore Separation'],'Pressure Systems':['Ore Separation'],'Heavy Robotics':['Sealed Robotics','Ore Separation'],'Precision Control':['Ore Separation','Mineral Recovery'],'Autonomous Logistics':['Precision Control'],'Command Robotics':['Precision Control','Heavy Robotics'],'High Pressure Intakes':['Pressure Systems','Precision Control'],'Endgame Theory':['Autonomous Logistics','Command Robotics','Mineral Regeneration','Precision Control']};
const research=d.research.map(p=>({id:rid(p.name),name:p.name,category:p.pricingClass==='unlock'?'Progression':p.pricingClass==='quality-of-life'?'Logistics':'Efficiency',description:d.frameworkResearch.find(x=>x.name===p.name)?.effect??`Develop ${p.name} using synchronized core sets.`,unlock:d.frameworkResearch.find(x=>x.name===p.name)?.effect??`Unlocks ${p.name} recipes and systems.`,costs:p.costs,prerequisites:(mainDeps[p.name]??d.frameworkResearch.find(x=>x.name===p.name)?.prerequisites??[]).map(rid)}));
const recovery=research.find(p=>p.id==='mineralRecovery');
Object.assign(recovery,{category:'Discovery',description:'Discover Mythril processing to unlock recovery of its Slag.',unlock:'Unlocks Slag washing, Recovered Brick and Recovered Iron. Slag washing needs local Water.',costs:{},trigger:{id:'encounter',kinds:['mythril'],pending:'Discover Mythril processing',complete:'Mythril processing discovered'}});
delete recovery.prerequisites;
for(const [id,access]of [['mineralRecovery1','hydraulicAssembly'],['mineralRegeneration','oreSeparation']]){
 const project=research.find(p=>p.id===id);if(project&&!project.prerequisites.includes(access))project.prerequisites.push(access);
}
const encounter=[['lakeTools','Water Tools',['lake']],['mithrilTools','Mythril Refining',['mythril']],['fabricatorTools','Advanced Fabrication',['abandonedFabricator']],['sortingTools','Waste Handling',['sortingStation','mythril']]].map(([key,name,kinds])=>key==='fabricatorTools'?{id:key,name,category:'Fabrication',description:'Develop advanced assembly using Simple, Basic, and Automata Cores.',unlock:'Unlocks the Assembler II node.',costs:{'simple-core':2,'basic-core':2,'automata-core':2},prerequisite:'assembler',prerequisites:['automataCore']}:({id:key,name,category:'Discovery',description:`Encounter ${kinds.join(' or ')} in a visited map.`,unlock:`Unlocks ${name}.`,costs:{},trigger:{id:'encounter',kinds,pending:'Visit a map containing the landmark',complete:'Landmark encountered'}}));
for(const p of d.repeatableResearch.filter(p=>p.tier<=6))research.push({id:rid(p.name),name:p.name,category:'Repeatable',description:p.effect,unlock:p.effect,costs:Object.fromEntries(['simple-core','basic-core','automata-core','hydro-core','shiny-core','command-core'].map(c=>[c,p.firstCostEach])),prerequisites:[p.name==='Mineral Regeneration Rate'?'mineralRegeneration2':'autonomousLogistics'],repeatable:true,costGrowth:p.growth});
const nodes={},caps={},modules={};
const descriptions={
 lakeIntake:'Connect directly to a Lake. Draws 4 Water per second before upgrades; at most two Intakes per Lake.',
 hydroProcessor:'Processes Water and solids into Coolant, Copper Slurry and recovered materials. Choose a recipe.',
 advancedAssembler:'Builds advanced intermediates, independent research cores and stronger bots. Tier-6 recipes may also produce waste.',
 separationFurnace:'Refines Mythril with Charcoal and Coolant, producing guaranteed Slag alongside metal. Also runs recovery recipes.',
 slagHopper:'Buffers up to 200 Slag to keep Mythril separation running.',
 wasteHopper:'Buffers up to 200 mixed waste items for recovery.',
 fluidStorage:'Buffers up to 256 Water or Coolant for fluid production and transport.',
 warehouse:'Buffers up to 250 material items for larger factories.',
 wasteSorter:'Routes mixed waste fairly at up to 40 units per second. Each waste type has separate buffer space.',
 fluidLink:'Carries Water or Coolant at up to 16 units per second.',
 wasteLink:'Carries waste batches at up to 40 units per second.',
 powerConduit:'Carries Power at up to 25 units per second.',
 fluidRoad:'Transfers a connected fluid buffer every five seconds to an adjacent map, with a 256-unit receiving buffer.',
 abandonedFabricator:'Visit this map to discover Assembler IIs and familiar fabrication recipes.',
 sortingStation:'Visit this map to discover waste sorting and handling tools.',
 resourceGolem:'Supply 10,000 AP once after Resource Golem Survey. Victory creates an infinite mineral reserve with a star connection on each face for Extractors.',
};
function node(kind,name,category,input,output,behavior,unlockResearch,extra={},cap={}){
 nodes[kind]={kind,name,category,input,output,description:descriptions[kind]??name,accent:0x75bfc1,accentCss:'#75bfc1',icon:'◆',unlockResearch,...extra};
 caps[kind]={behavior,...cap};modules[kind]={appearance:{icon:category==='World'?'archive':category==='Production'?'cog':category==='Extraction'?'lake':'filter',shape:'standard'},controls:{deletable:category!=='World',movable:category!=='World',pauseable:category!=='World',rotatable:false,...(behavior==='recipe'?{configuration:'recipe'}:{})}};
}
node('lakeIntake','Lake Intake','Production',['water'],['water'],'intake','lakeTools',{}, {defaultCapacity:64,inputCapacity:64,multiOutput:true});
modules.lakeIntake.appearance.icon='lake';
node('hydroProcessor','Hydro Plant','Production',['ANY','ANY','ANY'],['ANY','ANY'],'recipe','lakeTools',{size:'large'},{inputCapacity:64,perItemInputCapacity:true,defaultCapacity:64,efficiencyFamily:'hydroProcessor'});
node('advancedAssembler','Assembler II','Production',['ANY','ANY','ANY'],['ANY','WASTE'],'recipe','fabricatorTools',{size:'large'},{inputCapacity:64,perItemInputCapacity:true,defaultCapacity:64,efficiencyFamily:'advancedAssembler'});
node('separationFurnace','Separator','Production',['ANY','ANY','ANY'],['ANY','WASTE'],'recipe','mithrilTools',{size:'large'},{inputCapacity:64,perItemInputCapacity:true,defaultCapacity:64,efficiencyFamily:'separationFurnace'});
for(const [kind,name,cap,unlock] of [['slagHopper','Slag Hopper',200,'mithrilTools'],['wasteHopper','Waste Bin',200,'sortingTools'],['fluidStorage','Fluid Tank',256,'fluidRouting'],['warehouse','Warehouse',250,'warehouseLogistics']])node(kind,name,'Storage',[kind.includes('aste')||kind==='slagHopper'?'WASTE':kind==='fluidStorage'?'water':'ANY'],[kind.includes('aste')||kind==='slagHopper'?'WASTE':kind==='fluidStorage'?'water':'ANY'],'buffer',unlock,{}, {inputCapacity:cap,defaultCapacity:cap,multiInput:true,multiOutput:true});
node('wasteSorter','Waste Sorter','Logistics',['WASTE'],['slag','metallic-fines','spent-flux','glassy-crust'],'router','sortingTools',{}, {inputCapacity:32,perItemInputCapacity:true,defaultCapacity:128,multiInput:true,passThrough:true});
node('fluidLink','Fluid Link','Logistics',['water'],['water'],'router','lakeTools',{size:'small'},{inputCapacity:64,defaultCapacity:64,passThrough:true,multiOutput:true});
node('wasteLink','Waste Link','Logistics',['WASTE'],['WASTE'],'router','sortingTools',{size:'small'},{inputCapacity:160,defaultCapacity:160,passThrough:true,multiOutput:true});
node('powerConduit','Power Line','Power',['POWER'],['POWER'],'router','powerDistribution',{size:'small'},{inputCapacity:100,defaultCapacity:100,passThrough:true,multiOutput:true});
node('fluidRoad','Fluid Road','Logistics',['water'],['water'],'road','fluidRouting',{size:'large'},{pairedSectorPlacement:true,duplicateAllowed:false,inputCapacity:256,defaultCapacity:256});
node('abandonedFabricator','Fabricator','World',[],[],'landmark',undefined,{hidden:true},{duplicateAllowed:false});
node('sortingStation','Sorting Ruin','World',[],[],'landmark',undefined,{hidden:true},{duplicateAllowed:false});
node('resourceGolem','Resource Golem','World',['ATTACK_POWER'],['RESOURCE','RESOURCE'],'golem','resourceGolemSurvey',{hidden:true,size:'large'},{worldObstacle:true,duplicateAllowed:false,multiInput:true,multiOutput:true,inputCapacity:1000});
modules.resourceGolem.appearance={icon:'camp',shape:'camp'};
modules.fluidRoad.appearance={icon:'road',shape:'road'};
const reviewedResearch = [...encounter, ...research];
applyReviewedProduction({ names, recipes, groups, research: reviewedResearch, nodes });
const out=`// Generated by scripts/sync-progression-content.mjs from the reviewed progression proposal.\nimport type { ItemId, NodeKind, NodeDefinition, Recipe, ResearchProject } from '../domain/types';\nimport type { NodeCapabilities } from './nodeCapabilities';\nimport type { NodeModule } from './nodeModules';\nexport const LATE_ITEM_NAMES = ${JSON.stringify(names,null,2)};\nexport const LATE_ITEM_COLORS = ${JSON.stringify(colors,null,2)};\nexport const LATE_RECIPES = ${JSON.stringify(recipes,null,2)} satisfies Record<string,Recipe>;\nexport const LATE_GROUPS: Partial<Record<NodeKind,string[]>> = ${JSON.stringify(groups,null,2)};\nexport const LATE_RESEARCH = ${JSON.stringify(reviewedResearch,null,2)} satisfies ResearchProject[];\nexport const LATE_NODES = ${JSON.stringify(nodes,null,2)} satisfies Partial<Record<NodeKind,NodeDefinition>>;\nexport const LATE_CAPABILITIES = ${JSON.stringify(caps,null,2)} satisfies Partial<Record<NodeKind,NodeCapabilities>>;\nexport const LATE_MODULES = ${JSON.stringify(modules,null,2)} satisfies Partial<Record<NodeKind,NodeModule>>;\nexport const CORE_ITEMS: ItemId[] = ['simple-core','basic-core','automata-core','hydro-core','shiny-core','command-core','final-core'];\nexport const WASTE_ITEMS: ItemId[] = ['slag','metallic-fines','spent-flux','glassy-crust'];\nexport const BOT_STRENGTH: Partial<Record<ItemId,number>> = {'suppression-bot':1,'medium-suppression-bot':3,'heavy-suppression-bot':8,'command-suppression-bot':20};\n`;
writeFileSync('src/content/progression.ts',out);
console.log(JSON.stringify({items,recipes:Object.keys(recipes).length,research:research.length,nodes:Object.keys(nodes)}));
