import { describe, expect, it } from 'vitest';
import { createInitialState, GameEngine } from './engine';
import { migrateMachineEfficiency } from './machineEfficiencyMigration';
import { tutorialNode } from '../tutorials/tutorialState';

describe('research schedule save migration',()=>{
  it('retains Core-tier purchases, refunds removed ranks and partial payments once, and preserves progress fraction',()=>{
    const s=createInitialState(3);delete s.machineEfficiencyVersion;
    s.research.completed=['extractor1','extractor2','refiner1','refiner2'];
    s.research.unlocked=[...s.research.completed];
    s.research.selected='assembler2';s.research.contributed={'simple-core':4,'basic-core':2};
    s.research.projectContributions={assembler2:{'simple-core':4,'basic-core':2}};
    const lab=tutorialNode('researchCenter','lab',2200,300,{input:{'simple-core':1}});
    const extractor=s.sectors['5,5'].nodes.find(n=>n.kind==='extractor')!;extractor.progressMs=2000;
    s.sectors['5,5'].nodes.push(lab);
    migrateMachineEfficiency(s);
    expect(s.research.completed).toEqual(['extractor2']);
    expect(s.research.selected).toBeUndefined();
    expect(s.research.contributed).toEqual({});
    expect(s.research.projectContributions).toEqual({});
    expect(lab.input).toEqual({'simple-core':40,'basic-core':17});
    expect(extractor.progressMs).toBe(2250);
    const once=structuredClone(s);migrateMachineEfficiency(s);expect(s).toEqual(once);
  });
  it('credits consolidated purchases and preserves paid batches without charging a migration deficit',()=>{
    const s=createInitialState(4);delete s.machineEfficiencyVersion;
    s.research.completed=['pressureSystems','highPressureIntakes','treePlanter1','planterThroughput','mineralRecovery1'];
    s.research.unlocked=[...s.research.completed];
    const recipe='recover-crust';
    s.sectors['5,5'].nodes=[tutorialNode('recycler','recovery',1200,500,{recipeId:recipe,input:{water:2},batch:{recipeId:recipe,outputs:{'copper-plate':1}},progressMs:4500}),tutorialNode('treePlanter','planter',1700,500,{progressMs:45,growthCredit:73})];
    const e=new GameEngine(s,{autosave:false}),state=e.getState();
    expect(state.research.completed).toEqual(expect.arrayContaining(['fluidLink4','fluidLink5','fluidLink6','treePlanter4','treePlanter5','treePlanter6','recycler4']));
    expect(state.research.completed).not.toContain('mineralRecovery1');
    expect(state.research.completed).not.toContain('planterThroughput');
    const recovery=e.getSector().nodes[0];
    expect(recovery.batch).toEqual({recipeId:recipe,outputs:{'copper-plate':1}});
    expect(recovery.input).toEqual({water:2});
    expect(recovery.progressMs).toBe(4250);
    expect(e.getSector().nodes[1]).toMatchObject({growthCredit:73,progressMs:62.5,cycleMs:250});
    const reloaded=new GameEngine(structuredClone(state),{autosave:false});
    expect(reloaded.getState()).toEqual(state);
  });
});
