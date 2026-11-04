import { worldRecipeAllowed } from '../content/endgame';
import { applyCartUpgrades } from '../content/cartUpgrades';
import { NODE_DEFINITIONS } from '../content/nodes';
import { getNodeCapabilities } from '../content/nodeCapabilities';
import { isPlayerMovableNode } from '../content/nodeModules';
import { isRecipeUnlocked } from '../content/recipes';
import type { GameState } from '../domain/types';
import { getSectorWorldSize } from './worldGeneration';
import { canPlaceNode } from './collisions';
import { portFamiliesCompatible, connectionBlockedByWorld } from './connectionRules';

const clone = <T,>(value: T): T => structuredClone(value);

/** Saved layout construction is independent of the main simulation loop. */
export class FactoryTemplateRuntime {
  constructor(
    private readonly getState: () => GameState,
    private readonly checkpoint: () => void,
    private readonly publish: () => void,
    private readonly makeId: (prefix: string) => string,
  ) {}

  private get state() { return this.getState(); }
  private getSector() { return this.state.sectors[this.state.activeSectorId]; }

  saveFactoryTemplate(name:string,ids:string[]){
    if(!this.state.research.completed.includes('factoryTemplates'))return false;
    const nodes=this.getSector().nodes.filter(n=>ids.includes(n.id)&&isPlayerMovableNode(n.kind)&&!getNodeCapabilities(n.kind).globallyUnique&&!getNodeCapabilities(n.kind).pairedSectorPlacement&&!['storage','inventory'].includes(n.kind));
    if(!nodes.length||!name.trim())return false;
    const minX=Math.min(...nodes.map(n=>n.x)),minY=Math.min(...nodes.map(n=>n.y)),selected=new Set(nodes.map(n=>n.id));
    const template={name:name.trim().slice(0,40),nodes:nodes.map(n=>({...clone(n),x:n.x-minX,y:n.y-minY,input:{},output:{},batch:undefined,growthCredit:0,outputQueue:[],inputQueue:[],filterBlocked:undefined,progressMs:0,disabled:false,protected:false})),connections:clone(this.getSector().connections.filter(c=>selected.has(c.from)&&selected.has(c.to)))};
    this.checkpoint();const templates=this.state.factoryTemplates??=[];const index=templates.findIndex(t=>t.name===template.name);if(index<0)templates.push(template);else templates[index]=template;this.publish();return true;
  }
  getTemplatePreview(index:number,x:number,y:number){
    const t=this.state.factoryTemplates?.[index];if(!t?.nodes.length||!this.state.research.completed.includes('factoryTemplates'))return undefined;
    const nodes=t.nodes.map((n,i)=>({...clone(n),id:`__template-${i}`,x:x+n.x,y:y+n.y}));
    const map=new Map(t.nodes.map((n,i)=>[n.id,nodes[i].id]));
    const connections=t.connections.map(c=>({...c,from:map.get(c.from)!,to:map.get(c.to)!}));
    const field=getSectorWorldSize(this.getSector(),this.state.research.completed),placed=[...this.getSector().nodes];
    let valid=true;
    for(const n of nodes){if(!isPlayerMovableNode(n.kind)||(NODE_DEFINITIONS[n.kind].unlockResearch&&!this.state.research.unlocked.includes(NODE_DEFINITIONS[n.kind].unlockResearch!))||(n.recipeId&&(!isRecipeUnlocked(n.recipeId,this.state.research.completed)||!worldRecipeAllowed(n.recipeId,this.state)))||!canPlaceNode(n,placed,field))valid=false;placed.push(n);}
    for(const c of connections){const from=nodes.find(n=>n.id===c.from)!,to=nodes.find(n=>n.id===c.to)!;if(!portFamiliesCompatible(from,c.fromPort??0,to,c.toPort??0,this.state.research.completed)||connectionBlockedByWorld(from,to,{fromPort:c.fromPort??0,toPort:c.toPort??0},placed))valid=false;}
    return{nodes,connections,valid};
  }
  placeFactoryTemplate(index:number,x:number,y:number){
    const p=this.getTemplatePreview(index,x,y);if(!p?.valid)return false;
    this.checkpoint();const ids=new Map(p.nodes.map(n=>[n.id,this.makeId(n.kind)]));
    this.getSector().nodes.push(...p.nodes.map(n=>({...n,id:ids.get(n.id)!,constructedAt:Date.now(),constructionMs:1500,input:{},output:{},batch:undefined,growthCredit:0,outputQueue:[],inputQueue:[],filterBlocked:undefined,progressMs:0})));
    applyCartUpgrades(this.state);this.getSector().connections.push(...p.connections.map(c=>({...c,id:this.makeId('cable'),from:ids.get(c.from)!,to:ids.get(c.to)!,batchCredit:0,createdAt:Date.now()})));
    this.publish();return true;
  }
}
