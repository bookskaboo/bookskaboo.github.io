import { useState, type CSSProperties } from 'react';
import { itemColorCss, ITEM_NAMES } from '../content/items';
import { NODE_DEFINITIONS } from '../content/nodes';
import { RECIPES, RECIPE_GROUPS } from '../content/recipes';
import { isRecipeAvailable } from '../content/recipeAvailability';
import type { GameState, ItemId, MachineNode } from '../domain/types';
import type { GameEngine } from '../simulation/engine';
import { permitsTutorialChoice, type TutorialChoice } from '../tutorials/tutorialChoices';
import { NodeIcon } from './NodeIcon';
import { RecipeIcon } from './RecipeIcon';
import { RecipeViewToggle, useRecipeIconView } from './RecipeViewToggle';
import { recipeIngredientName, recipeTooltip } from './recipePresentation';
import { recipeGuideCycle } from './recipeGuide';

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
  const { compact, toggle } = useRecipeIconView();
  const choices = (RECIPE_GROUPS[node.kind] ?? []).filter(id => isRecipeAvailable(id, game, node.kind));
  const recycler = node.kind === 'recycler';
  const activeId = node.batch?.recipeId ?? node.recipeId;
  const activeRecipe = recycler && activeId ? RECIPES[activeId] : undefined;
  const waitingForWater = activeRecipe && !node.batch && (node.input.water ?? 0) < (activeRecipe.inputs.water ?? 0);
  const Card = recycler ? 'div' : 'button';
  const machineName = NODE_DEFINITIONS[node.kind].name;
  const groups = !compact && node.kind === 'refiner' ? [
    { title: 'Gear', choices: choices.filter(id => id.endsWith('-gear')) },
    { title: 'Wire', choices: choices.filter(id => id.endsWith('-wire')) },
    { title: 'Other products', choices: choices.filter(id => !id.endsWith('-gear') && !id.endsWith('-wire')) },
  ] : recycler ? [
    { title: 'Active recipe', choices: activeRecipe ? [activeRecipe.id] : [] },
    { title: 'Waste recovery', choices: choices.filter(id => id !== activeId && RECIPES[id].recovery) },
    { title: 'Breakdown', choices: choices.filter(id => id !== activeId && !RECIPES[id].recovery) },
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
          <div><h2 id="recipe-picker-title">{machineName} recipes</h2>{requiredRecipeId && <p>Select {RECIPES[requiredRecipeId].name}, highlighted below.</p>}{waitingForWater && <p>Waiting for Water.</p>}</div>
          <button onClick={onClose} aria-label="Close recipe picker">×</button>
        </header>
        <div className="recipe-view-toolbar">
          <RecipeViewToggle compact={compact} onToggle={toggle} />
        </div>
        <div className={`recipe-picker-list ${compact ? 'compact-recipe-view' : ''}`}>
          <div role="listbox" aria-readonly={recycler || undefined} aria-label={`${machineName} recipes`}>
          {groups.filter(group => group.choices.length).map(group => <div key={group.title} role={compact ? undefined : 'group'} aria-label={compact ? undefined : group.title || `${machineName} recipes`} className={`recipe-picker-group ${group.title === 'Gear' || group.title === 'Wire' ? 'material-variants' : ''} ${group.title === 'Active recipe' ? 'active-recycler-recipe' : ''}`}>
          {group.title && <h3>{group.title}</h3>}
          <div className="recipe-picker-group-choices">{group.choices.map((recipeId) => {
            const recipe = RECIPES[recipeId];
            const selected = (recycler ? activeId : node.recipeId) === recipeId;
            const inputs = (Object.entries(recipe.inputs) as Array<[ItemId, number]>).map(([item, amount]) => `${amount} ${recipeIngredientName(recipe, item)}`);
            const displayItem = (Object.keys(recipe.outputs)[0] ?? Object.keys(recipe.inputs)[0]) as ItemId | undefined;
            const color = displayItem ? itemColorCss(displayItem) : NODE_DEFINITIONS[node.kind].accentCss;
            const cycleMs = recipeGuideCycle(recipe, node.kind, game);
            return <Card
              {...(recycler ? { tabIndex: 0 } : { type: 'button' as const, disabled: !permitsTutorialChoice(requiredRecipeId, recipeId), onClick: () => choose(recipeId) })}
              role="option"
              aria-selected={selected}
              aria-label={recipe.name}
              data-tooltip={recipe.name}
              data-tooltip-detail={recipeTooltip(recipe, cycleMs)}
              data-tooltip-tone={color}
              className={`recipe-picker-card ${selected ? 'selected' : ''} ${requiredRecipeId === recipeId ? 'tutorial-recipe-choice' : ''}`}
              key={recipeId}
              style={{ '--recipe-color': color } as CSSProperties}
            >
              <span className="recipe-picker-icon"><RecipeIcon recipe={recipe} node={node.kind} /></span>
              <span className="recipe-picker-copy"><span className="recipe-card-title"><strong>{recipe.name}</strong><span className="recipe-card-time" aria-label={`${cycleMs / 1000} seconds per batch`}>{Number((cycleMs / 1000).toFixed(2))} sec</span></span><small>{inputs.join(' + ')} → {Object.entries(recipe.outputs).map(([i,n])=>`${n} ${ITEM_NAMES[i as ItemId]}`).join(' + ') || 'No output'}</small>{recipe.chanceOutputs?.map(o=><small key={o.item}>+ {o.amount} {ITEM_NAMES[o.item]} · {o.probability*100}% independent chance</small>)}</span>
            </Card>;
          })}</div></div>)}
          </div>
          {!choices.length && !activeRecipe && <p className="empty-state">No recipes unlocked yet. Complete the required research or discoveries first. The paperwork precedes production.</p>}
        </div>
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
