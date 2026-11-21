import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createInitialState, GameEngine } from '../simulation/engine';
import { NodeInspector } from './NodeInspector';
import { NodeRecipePicker } from './NodeRecipePicker';
import { getNodeDisplayDefinition, getEffectiveNodeOutputFamilies } from '../content/nodes';
import { getPortAnchor, getNodeSize } from '../domain/nodeGeometry';
import { getResearchMilestones } from './researchMilestones';
import { RESEARCH_PROJECTS } from '../content/research';
import { nodeDrawingKey } from '../renderer/sceneUpdates';
import type { MachineNode } from '../domain/types';
const noop=()=>{};
function setup(type:NonNullable<MachineNode['landmark']>){
  const state=createInitialState(52),entry=state.landmarkLayout!.find(e=>e.sector.nodes.some(n=>n.landmark===type))!;
  state.sectors[entry.sector.id]=structuredClone(entry.sector);state.activeSectorId=entry.sector.id;state.sectors[entry.sector.id].unlocked=true;state.sectors[entry.sector.id].visited=true;
  state.research.unlocked=RESEARCH_PROJECTS.map(p=>p.id);state.research.completed=RESEARCH_PROJECTS.map(p=>p.id);
  const engine=new GameEngine(state,{autosave:false});return {engine,game:engine.getState(),node:engine.getSector().nodes.find(n=>n.landmark===type)!};
}
describe('landmark interface contracts',()=>{
  it('keeps Unknown Device pink, unexplained and without recipe controls or formulas',()=>{
    const {engine,game,node}=setup('unknown');node.input={'basic-core':2};node.activeCore='final-core';node.progressMs=2500;
    const html=renderToStaticMarkup(<NodeInspector game={game} engine={engine} node={node} onClose={noop} onConfigureRecipe={noop} onOpenResearch={noop} onDelete={noop}/>);
    expect(html).toContain('Unknown Device');expect(html).toContain('#f29ac2');expect(html).toContain('Active: Final Core');expect(html).toContain('50%');
    expect(html).not.toMatch(/Production recipe|Choose recipe|Production requirements|Refiner|doubl|duplicat|→|Decommission node/i);
    expect(renderToStaticMarkup(<NodeRecipePicker game={game} engine={engine} node={node} onClose={noop} onSkipWarnings={noop} skipWarnings={false}/>)).toBe('');
  });
  it('keeps Tri Extractor sockets inside the existing body and distinguishes cached landmark colors',()=>{
    const {node}=setup('tri');const size=getNodeSize(node);expect(size.w).toBe(256);
    expect(getEffectiveNodeOutputFamilies(node)).toHaveLength(3);
    for(let port=0;port<3;port++)expect(Math.abs(getPortAnchor(node,'output',port).y)).toBeLessThan(size.h/2);
    expect(getNodeDisplayDefinition(node).accentCss).toBe('#b584ef');expect(nodeDrawingKey(node)).not.toBe(nodeDrawingKey({...node,landmark:undefined}));
  });
  it('points the early hint toward the actual random spawn and retires it once visited',()=>{
    const directions=new Set<string>();
    for(let seed=1;seed<=20;seed++){
      const game=createInitialState(seed);game.research.completed=['exploration'];game.research.unlocked=['extractor','exploration'];game.research.mapPoints=1;
      const entry=game.landmarkLayout![0];const hint=getResearchMilestones(game,{allCandidates:true}).find(h=>h.title==='A useful detour')!;expect(hint).toBeDefined();
      const direction=entry.sector.x>5?'east':entry.sector.x<5?'west':entry.sector.y>5?'south':'north';directions.add(direction);expect(hint.detail).toContain(direction);expect(hint.detail).not.toMatch(/Refiner|10×/);
      game.sectors[entry.sector.id]={...structuredClone(entry.sector),visited:true,unlocked:true};expect(getResearchMilestones(game,{allCandidates:true}).some(h=>h.title==='A useful detour')).toBe(false);
    }
    expect(directions.size).toBeGreaterThan(1);
  });
});
