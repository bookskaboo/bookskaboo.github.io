import { writeFile, readFile } from 'node:fs/promises';
import { createServer } from 'vite';
const server = await createServer({configFile:false,server:{middlewareMode:true,ws:false,watch:null}});
try {
  const {hintCatalogExample}=await server.ssrLoadModule('/previews/status-page/hintNavigationCatalog.ts');
  const {getResearchMilestones}=await server.ssrLoadModule('/src/ui/researchMilestones.ts');
  const {mapCornerMarkers}=await server.ssrLoadModule('/src/ui/mapNodePresentation.ts');
  const {worldCornerIds}=await server.ssrLoadModule('/src/domain/worldGrid.ts');
  const {RECIPES,isRecipeUnlocked}=await server.ssrLoadModule('/src/content/recipes.ts');
  const {botUpgradeBenefits}=await server.ssrLoadModule('/src/content/botUpgrades.ts');
  const traces=[];
  for(const pairIndex of [0,1,2]){
    const engine=hintCatalogExample('complexUpgrade'),game=engine.getState();
    game.endgame={...game.endgame,version:1,pairIndex,cornerOrder:['alpha','foundry','reclamation','grove']};
    game.research.mapPoints=1;
    const capture=label=>traces.push({pairIndex,checkpoint:label,primary:getResearchMilestones(game)[0],cornerMarkerCount:mapCornerMarkers(game).size,halvesUnlocked:isRecipeUnlocked(`core-half-a-${pairIndex}`,game.research.completed),factoryMutation:'Synthetic checkpoint setup; not earned gameplay.'});
    capture('Before Complex upgrade');
    game.research.completed.push('finalCore');capture('After Complex upgrade; corners not visited');
    for(const id of worldCornerIds(11)){const [x,y]=id.split(',').map(Number);const sector=game.sectors[id]=engine.ensureSector(x,y);sector.unlocked=true;sector.visited=true;}
    capture('Corners visited; pieces missing');
    const yin=RECIPES[`core-half-a-${pairIndex}`],yang=RECIPES[`core-half-b-${pairIndex}`];
    game.globalPool={...yin.inputs,...yang.inputs};capture('All required pieces owned; halves missing');
    game.globalPool={'core-half-a':1,...yang.inputs};capture('Yin owned; Yang pieces owned');
    game.globalPool={'core-half-a':1,'core-half-b':1};capture('Both halves owned');
    game.globalPool={};const home=game.sectors['5,5'];const finalAssembler={id:'walkthrough-assembler',kind:'assembler',name:'Assembler',x:1200,y:1000,rotation:0,input:{},output:{},recipeId:'final-core',batch:{recipeId:'final-core',outputs:{'final-core':1}},progressMs:100,cycleMs:60000,constructedAt:0,constructionMs:0};home.nodes.push(finalAssembler);capture('Final Core batch running; halves consumed');home.nodes=home.nodes.filter(node=>node!==finalAssembler);
    game.globalPool={'core-half-a':1};capture('One half absent again; recovery');
    game.globalPool={'final-core':1};game.research.completed.push('finalCoreProduction');capture('Final Core produced; victory not paid');
  }
  const report={date:'2026-11-22',method:'Developer-informed synthetic cognitive walkthrough and shared-selector trace. Scenario checkpoints are constructed; no novice participant or blind agent is represented.',limits:['Prior source knowledge cannot be erased. No measured human attention, comprehension, enjoyment, error probability or completion time.','Constructed checkpoints and supplied inventory are not a normal-play progression or balance run. No campaign saves are read or written.','Browser observations are recorded separately; source traces do not establish control discoverability.'],benefits:{shiny:botUpgradeBenefits('complexCore'),complex:botUpgradeBenefits('finalCore')},traces,findings:[{status:'implemented',observation:'After the Assembler consumes both halves, a running Final Core batch could be mistaken for missing supply and send guidance back to corners.',remedy:'Keep Final Core assembly guidance during a committed Final Core batch; pairing regressions cover the consumed-input interval.'},{status:'implemented',observation:'The old promotion clue used the assembly wording before any corner pieces were available.',remedy:'Give Complex upgrade its own chassis clue.'},{status:'implemented',observation:'When all pieces were owned but halves were missing, the old fallback pointed to Final Core assembly.',remedy:'Use the existing Final Core clue with a combining-pieces phase and the world-matching missing-half recipe; switch to Final Core only once both halves are owned.'},{status:'implemented',observation:'Revealed corner locations could be mistaken for opened destinations.',remedy:'State ordinary expansion is still required in upgrade benefits and the locked-corner detail panel.'},{status:'unverified hypothesis',observation:'A newcomer may not discover recipe inspection or identify the relevant Assembler when Show me is deliberately absent.',nextCheck:'Observe recipe-guide discovery and delivery planning without coaching in a participant session.'},{status:'unverified hypothesis',observation:'World-owned pieces and halves can be spread across maps; ownership does not establish delivery to the same Assembler.',nextCheck:'Include a distributed-stock checkpoint in human observation; inspect ordinary missing-input feedback.'}],proposedParticipantProtocol:{prompts:['What are you trying to achieve?','What would you do next?','What tells you that action worked?'],observeBeforeHelping:['Notices changed hint after upgrade','Understands revealed location versus unlocked route','Finds this world’s half recipes','Delivers both halves and makes Final Core','Finds separate victory research'],record:['First intended action','Actual action and visible outcome','Wrong turns and recovery','Every coaching prompt','Setup/interaction versus production waiting time'],success:'Uncoached task completion and accurate explanation at each encountered checkpoint. No result claimed until real participants are observed.'}};
  await writeFile('outputs/hint-navigation/first-time-walkthrough.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({scenarios:3,checkpoints:traces.length,phases:traces.slice(0,8).map(x=>({checkpoint:x.checkpoint,hint:x.primary.title,target:x.primary.action}))},null,2));
} finally {await server.close();}
