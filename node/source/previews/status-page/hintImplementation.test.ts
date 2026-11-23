import { afterEach, describe, expect, it } from 'vitest';
import { getResearchProject, RESEARCH_PROJECTS, refreshResearchLookup } from '../../src/content/research';
import { nextBotUpgrade } from '../../src/content/botUpgrades';
import { researchCardDetails } from '../../src/ui/researchPresentation';
import { HINT_EXAMPLES, hintExampleVariants } from './hintNavigationCatalog';
import { implementationHintSnapshot, implementationHintDestination, implementationResearchView, implementationHintRecommendation } from './hintImplementation';
import { MAP_RESEARCH_IDS, MAP_SURVEYS, isMapSurvey, mapStudyResearchList } from './mapUpgrades';
import { hintTutorialPractice } from './hintNavigation';

afterEach(() => { for(let i=RESEARCH_PROJECTS.length-1;i>=0;i--) if(isMapSurvey(RESEARCH_PROJECTS[i].id)) RESEARCH_PROJECTS.splice(i,1); refreshResearchLookup(); });
const cases=HINT_EXAMPLES.flatMap(entry=>hintExampleVariants(entry.id).map(variant=>({id:entry.id,variant:variant.id})));
describe('newer Upgrades implementation preview',()=>{
  it.each(cases)('$id/$variant exposes its ordered snapshot without activating its destination',({id,variant})=>{
    const snapshot=implementationHintSnapshot(id,variant);
    const game=snapshot.engine.getState();
    const before=JSON.stringify(game);
    const target=implementationHintDestination(game,id,snapshot.clue.title);
    const suggestion=implementationHintRecommendation(game,id,snapshot.clue.title);
    expect(suggestion.why.length).toBeGreaterThan(20);
    expect(suggestion.next.length).toBeGreaterThan(20);
    if(target?.kind==='research'){
      expect(researchCardDetails(getResearchProject(target.id)!,game).selectable).toBe(true);
      const list=mapStudyResearchList(game,implementationResearchView(target.id));
      expect(list.mapProject?.id===target.id||list.projects.some(p=>p.id===target.id)||nextBotUpgrade(game)?.id===target.id).toBe(true);
    }
    expect(JSON.stringify(game)).toBe(before);
    expect(game.research.queue).toEqual([]);
    expect(snapshot.engine.retryAutosave()).toBe(false);
    if(game.research.completed.includes('exploration'))expect(game.research.completed).toContain('road');
  });
  it('shows all six locked surveys in the opening Map upgrades tab without completing them',()=>{
    const {engine}=implementationHintSnapshot('assignment');
    const game=engine.getState();
    const map=mapStudyResearchList(game,'map');
    expect(map.mapProject?.id).toBe('mapNode');
    expect(map.projects.slice(0,2).map(p=>p.id)).toEqual(['exploration','surveyGoblinCamps']);
    for(const survey of MAP_SURVEYS){
      expect(map.projects.some(p=>p.id===survey.id)).toBe(true);
      expect(game.research.completed).not.toContain(survey.id);
      expect(engine.queueResearch(survey.id)).toBe('unavailable');
    }
    expect(map.projects.some(p=>p.id==='road')).toBe(false);
    for(const view of ['nodes','upgrades'] as const)expect(mapStudyResearchList(game,view).projects.some(p=>MAP_RESEARCH_IDS.has(p.id))).toBe(false);
  });
  it('turns the retained Road clue into an Expansion invitation, with no hidden second project',()=>{
    const {engine,clue}=implementationHintSnapshot('road');
    expect(clue.title).toBe('Road');
    expect(implementationHintDestination(engine.getState(),'road',clue.title)).toEqual({kind:'tutorial',id:'expansion'});
    expect(engine.getState().research.completed).toEqual(expect.arrayContaining(['exploration','road']));
    expect(mapStudyResearchList(engine.getState(),'map','',true).projects.some(p=>p.id==='road')).toBe(false);
  });
  it('restores the proposal after practice creation without leaking practice progress to its snapshot',()=>{
    const {engine}=implementationHintSnapshot('guardedMythril');
    const before=JSON.stringify(engine.getState());
    const practice=hintTutorialPractice('monster-camps');
    practice.togglePause();
    expect(JSON.stringify(engine.getState())).toBe(before);
    expect(mapStudyResearchList(engine.getState(),'map').projects.some(p=>p.id==='surveyLakes')).toBe(true);
  });
});
