import { useState, type CSSProperties } from 'react';
import { itemColorCss, ITEM_NAMES } from '../content/items';
import { NODE_DEFINITIONS } from '../content/nodes';
import { RECIPES, RECIPE_GROUPS } from '../content/recipes';
import { isRecipeAvailable } from '../content/recipeAvailability';
import { getNodeCapabilities } from '../content/nodeCapabilities';
import type { GameState, ItemId, MachineNode } from '../domain/types';
import type { GameEngine } from '../simulation/engine';
import { permitsTutorialChoice, type TutorialChoice } from '../tutorials/tutorialChoices';
import { NodeIcon } from './NodeIcon';

const SUPPRESSION_RECIPES = new Set(['robot-frame', 'robot-gun', 'suppression-bot']);

const duration = (ms: number) => ms % 1000 === 0 ? `${ms / 1000}s` : `${(ms / 1000).toFixed(1)}s`;

export function NodeRecipePicker({ game, engine, node, requiredRecipeId, skipWarnings, onSkipWarnings, onClose }: {
  game: GameState;
  engine: GameEngine;
  node: MachineNode;
  requiredRecipeId?: TutorialChoice;
  skipWarnings: boolean;
  onSkipWarnings(value: boolean): void;
  onClose(): void;
}) {
  const [pending, setPending] = useState<string>();
  const choices = (RECIPE_GROUPS[node.kind] ?? [])
    .filter(id => isRecipeAvailable(id, game, node.kind))
    .filter((recipeId) => recipeId !== 'automata-core' || game.research.completed.includes('automataCore'))
    .filter((recipeId) => !SUPPRESSION_RECIPES.has(recipeId) || game.research.completed.includes('suppressionBot'));
  const machineName = NODE_DEFINITIONS[node.kind].name;
  const groups = node.kind === 'refiner' ? [
    { title: 'Gear', choices: choices.filter(id => id.endsWith('-gear')) },
    { title: 'Wire', choices: choices.filter(id => id.endsWith('-wire')) },
    { title: 'Other products', choices: choices.filter(id => !id.endsWith('-gear') && !id.endsWith('-wire')) },
  ] : [{ title: '', choices }];

  const apply = (recipeId: string) => {
    if (!isRecipeAvailable(recipeId, engine.getState(), node.kind)) return;
    if (!permitsTutorialChoice(requiredRecipeId, recipeId)) return;
    if (engine.setRecipe(node.id, recipeId)) onClose();
  };
  const choose = (recipeId: string) => {
    if (!isRecipeAvailable(recipeId, engine.getState(), node.kind)) return;
    if (!permitsTutorialChoice(requiredRecipeId, recipeId)) return;
    if (node.recipeId === recipeId) { onClose(); return; }
    if (node.recipeId && !skipWarnings) setPending(recipeId);
    else apply(recipeId);
  };

  return <>
      <aside className="inspector recipe-picker-panel glass" aria-label={`${machineName} recipes`} aria-labelledby="recipe-picker-title">
        <header className="recipe-picker-header">
          <span><NodeIcon kind={node.kind} /></span>
          <div><small>CONFIGURE PRODUCTION</small><h2 id="recipe-picker-title">{machineName} recipes</h2><p>{requiredRecipeId ? `Select ${RECIPES[requiredRecipeId].name}, highlighted below. The lesson has a specific shopping list.` : 'Choose what this machine makes. It has declined to guess.'}</p></div>
          <button onClick={onClose} aria-label="Close recipe picker">×</button>
        </header>
        <div className="recipe-picker-list" role="listbox" aria-label={`${machineName} recipes`}>
          {groups.filter(group => group.choices.length).map(group => <div key={group.title} role="group" aria-label={group.title || `${machineName} recipes`} className={`recipe-picker-group ${group.title === 'Gear' || group.title === 'Wire' ? 'material-variants' : ''}`}>
          {group.title && <h3>{group.title}</h3>}
          <div className="recipe-picker-group-choices">{group.choices.map((recipeId) => {
            const recipe = RECIPES[recipeId];
            const selected = node.recipeId === recipeId;
            const inputs = (Object.entries(recipe.inputs) as Array<[ItemId, number]>).map(([item, amount]) => `${amount} ${ITEM_NAMES[item]}`);
            const outputItem = Object.keys(recipe.outputs)[0] as ItemId;
            const color = itemColorCss(outputItem);
            return <button
              type="button"
              role="option"
              aria-selected={selected}
              disabled={!permitsTutorialChoice(requiredRecipeId, recipeId)}
              className={`recipe-picker-card ${selected ? 'selected' : ''} ${requiredRecipeId === recipeId ? 'tutorial-recipe-choice' : ''}`}
              key={recipeId}
              style={{ '--recipe-color': color } as CSSProperties}
              onClick={() => choose(recipeId)}
            >
              <span className="recipe-picker-icon"><NodeIcon kind={node.kind} /></span>
              <span className="recipe-picker-copy"><strong>{recipe.name}</strong><small>{inputs.join(' + ')} → {Object.entries(recipe.outputs).map(([i,n])=>`${n} ${ITEM_NAMES[i as ItemId]}`).join(' + ')}</small>{recipe.chanceOutputs?.map(o=><small key={o.item}>+ {o.amount} {ITEM_NAMES[o.item]} · {o.probability*100}% independent chance</small>)}</span>
              <span className="recipe-picker-duration">{duration(recipe.cycleMs)}</span>
              <em>{requiredRecipeId === recipeId ? 'CHOOSE THIS' : selected ? 'ACTIVE' : 'SELECT'}</em>
            </button>;
          })}</div></div>)}
          {!choices.length && <p className="empty-state">No recipes unlocked yet. Complete the required research or discoveries first. The paperwork precedes production.</p>}
        </div>
        <footer className="recipe-picker-note"><b>{getNodeCapabilities(node.kind).inputCapacity??5} per ingredient</b><span>{node.batch?'Finish the active batch before changing recipes.':'Each input has its own buffer. Waste needs its own route. It rarely leaves voluntarily.'}</span></footer>
      </aside>
    {pending && <div className="modal-backdrop recipe-change-confirm" onMouseDown={(event) => { if (event.target === event.currentTarget) setPending(undefined); }}>
      <section className="confirm-modal glass">
        <span className="warning-icon">!</span>
        <h2>Change {machineName} recipe?</h2>
        <p>Changing recipes destroys all ingredients, completed output, and current progress stored in this machine. Incompatible cables will be disconnected.</p>
        <label className="recipe-warning-suppression"><input type="checkbox" checked={skipWarnings} onChange={(event) => onSkipWarnings(event.target.checked)} /><span><b>Never show again</b><small>Change recipes immediately, including the losses. Fewer interruptions, same consequences.</small></span></label>
        <div><button onClick={() => setPending(undefined)}>CANCEL</button><button className="danger-button" onClick={() => apply(pending)}>CONFIRM</button></div>
      </section>
    </div>}
  </>;
}
