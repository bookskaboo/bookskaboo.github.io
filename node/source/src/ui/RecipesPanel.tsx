import { useEffect, useMemo, useRef, useState } from 'react';
import { itemColorCss, ITEM_NAMES } from '../content/items';
import { isNodeUnlocked, NODE_DEFINITIONS } from '../content/nodes';
import { isRecipeUnlocked, RECIPES, RECIPE_GROUPS } from '../content/recipes';
import { accessibleRecipeMaterials, isRecipeAvailable } from '../content/recipeAvailability';
import { RECIPE_GUIDE_GROUPS, recipeGuideGroups, recipeGuideCycle } from './recipeGuide';
import { WASTE_ITEMS } from '../content/progression';
import { getResearchProject } from '../content/research';
import type { GameState, ItemId, NodeKind, Recipe } from '../domain/types';
import { NodeIcon } from './NodeIcon';
import { RecipeIcon } from './RecipeIcon';
import { RecipeViewToggle, useRecipeIconView } from './RecipeViewToggle';
import { recipeTooltip } from './recipePresentation';

const ALL_FILTER = 'all';
const GROUPS = RECIPE_GUIDE_GROUPS;


const recipeColor = (recipe: Recipe) => {
  const output = Object.keys(recipe.outputs)[0] as ItemId | undefined;
  return output ? itemColorCss(output) : '#d5b77f';
};

export function RecipesPanel({ game, onClose, initialRecipeId, backToResearch = false }: { game: GameState; onClose(): void; initialRecipeId?: string; backToResearch?: boolean }) {
  const [previewRecipeId, setPreviewRecipeId] = useState(initialRecipeId);
  const { compact, toggle } = useRecipeIconView();
  const [expandedCompactRecipe, setExpandedCompactRecipe] = useState<string>();
  const materials = useMemo(() => accessibleRecipeMaterials(game), [game, game.revision]);
  const groups = useMemo(() => recipeGuideGroups(game, previewRecipeId), [game, game.revision, previewRecipeId]);
  const [filters, setFilters] = useState<string[]>([]);
  const [filterOrder, setFilterOrder] = useState(() => [ALL_FILTER, ...GROUPS.map((group) => group.id)]);
  const [draggedFilter, setDraggedFilter] = useState<string>();
  const [navigationTarget, setNavigationTarget] = useState<string | undefined>(initialRecipeId);
  const suppressFilterClick = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);

  const producers = useMemo(() => {
    const result = new Map<ItemId, { recipeId: string; groupId: string; node: NodeKind }>();
    // Index the complete catalog so ingredient links can open an explicit preview.
    const candidates = GROUPS.flatMap(group => (RECIPE_GROUPS[group.id] ?? []).map(recipeId => ({ ...group, recipe: RECIPES[recipeId] })))
      .filter(entry => entry.recipe)
      .sort((a, b) => Number(isRecipeAvailable(b.recipe.id, game, b.node)) - Number(isRecipeAvailable(a.recipe.id, game, a.node)));
    candidates.forEach(({ id, node, recipe }) => {
      const outputs = [...Object.keys(recipe.outputs), ...(recipe.chanceOutputs ?? []).map(output => output.item)] as ItemId[];
      outputs.forEach(item => { if (!result.has(item)) result.set(item, { recipeId: recipe.id, groupId: id, node }); });
    });
    return result;
  }, [game, game.revision, materials]);

  useEffect(() => {
    if (!navigationTarget) return;
    const target = listRef.current?.querySelector<HTMLElement>(`[data-recipe-id="${navigationTarget}"]`);
    target?.scrollIntoView({ behavior: navigationTarget === initialRecipeId ? 'auto' : 'smooth', block: 'center' });
    target?.focus({ preventScroll: true });
    const timer = window.setTimeout(() => setNavigationTarget(undefined), 1400);
    return () => window.clearTimeout(timer);
  }, [navigationTarget, filters, initialRecipeId, previewRecipeId]);

  const reorderFilter = (targetId: string) => {
    if (!draggedFilter || draggedFilter === targetId) return;
    suppressFilterClick.current = true;
    setFilterOrder((current) => {
      const sourceIndex = current.indexOf(draggedFilter);
      const targetIndex = current.indexOf(targetId);
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const next = [...current];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  return <div className="modal-backdrop"><section className="modal recipes-modal glass" aria-labelledby="recipes-title">
    <header className="recipes-dialog-header">
      <div className="recipes-title-mark"><NodeIcon kind="researchCenter" /></div>
      <div><small>PRODUCTION GUIDE</small><h2 id="recipes-title">Recipes</h2><p>Exact ingredients. Optimism is not a substitute.</p></div>
      <button className={`recipes-close ${backToResearch ? 'recipes-back' : ''}`} onClick={onClose} aria-label={backToResearch ? 'Back to research' : 'Close Recipes'} data-tooltip={backToResearch ? 'Back to research' : 'Close Recipes'} data-tooltip-detail={backToResearch ? 'Return to the same research project.' : 'Close the recipe guide.'}>{backToResearch ? '← Research' : '×'}</button>
    </header>
    <div className="recipe-view-toolbar"><RecipeViewToggle compact={compact} onToggle={toggle} /></div>
    <div className="recipe-node-filters" role="group" aria-label="Filter recipes by production node. Drag filters to reorder them.">
      {filterOrder.map((filterId) => {
        const group = filterId === ALL_FILTER ? undefined : groups.find((candidate) => candidate.id === filterId);
        if (filterId !== ALL_FILTER && !group) return null;
        const selected = group ? filters.includes(group.id) : filters.length === 0;
        return <button
          type="button"
          draggable
          key={filterId}
          className={`recipe-node-filter ${selected ? 'selected' : ''} ${draggedFilter === filterId ? 'dragging' : ''}`}
          aria-pressed={selected}
          aria-label={`${group ? NODE_DEFINITIONS[group.node].name : 'All'} recipes. Drag to reorder.`}
          onClick={() => {
            if (suppressFilterClick.current) return;
            if (!group) setFilters([]);
            else setFilters((current) => current.includes(group.id) ? current.filter((id) => id !== group.id) : [...current, group.id]);
          }}
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', filterId);
            suppressFilterClick.current = false;
            setDraggedFilter(filterId);
          }}
          onDragEnter={(event) => { event.preventDefault(); reorderFilter(filterId); }}
          onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }}
          onDrop={(event) => event.preventDefault()}
          onDragEnd={() => {
            setDraggedFilter(undefined);
            window.setTimeout(() => { suppressFilterClick.current = false; }, 0);
          }}
        >{group && <NodeIcon kind={group.node} />}{group ? NODE_DEFINITIONS[group.node].name : 'All'}</button>;
      })}
    </div>
    <div className={`recipe-guide-groups ${compact ? 'compact-recipe-view' : ''}`} aria-label="Production recipes" ref={listRef}>
      {groups.filter((group) => filters.length === 0 || filters.includes(group.id)).map((group) => <section className="recipe-guide-group" key={group.id}>
        <div className="recipe-guide-group-heading"><strong>{NODE_DEFINITIONS[group.node].name}</strong><span>{group.recipes.length} {group.recipes.length === 1 ? 'recipe' : 'recipes'}</span></div>
        <div className="recipe-guide-list">
          {group.recipes.map((recipe) => {
            const color = recipeColor(recipe);
            const missingMaterials = (Object.keys(recipe.inputs) as ItemId[]).filter(item => !materials.has(item));
            const cycleMs = recipeGuideCycle(recipe, group.node, game);
            const recipeResearch = recipe.unlockResearch ?? (recipe.id === 'automata-core' ? 'automataCore' : undefined);
            const machineResearch = NODE_DEFINITIONS[group.node].unlockResearch;
            const requiredResearch = !isRecipeUnlocked(recipe.id, game.research.completed) ? recipeResearch : !isNodeUnlocked(group.node, game.research.unlocked) ? machineResearch : undefined;
            const locked = !isRecipeUnlocked(recipe.id, game.research.completed) || Boolean(requiredResearch);
            const hasWaste = Boolean(recipe.chanceOutputs?.length || Object.keys(recipe.outputs).some(item => WASTE_ITEMS.includes(item as ItemId)));
            const hoverDetail = `Produced in ${NODE_DEFINITIONS[group.node].name}. ${recipeTooltip(recipe, cycleMs)}${locked ? ` Requires ${getResearchProject(requiredResearch)?.name ?? 'research'}.` : ''}${missingMaterials.length ? ` Source materials needed: ${missingMaterials.map(item => ITEM_NAMES[item]).join(', ')}.` : ''}${group.node === 'smelter' ? ' Choose a Plate recipe. Feed Charcoal separately.' : ''}${hasWaste ? ' Give waste its own route. Each chance output rolls independently.' : ''}`;
            const flavor = group.node === 'smelter' ? 'The metal awaits instructions.' : undefined;
            return <article
              className={`recipe-guide-card ${navigationTarget === recipe.id ? 'navigation-target' : ''} ${expandedCompactRecipe === recipe.id || navigationTarget === recipe.id ? 'compact-expanded' : ''}`}
              key={recipe.id}
              data-recipe-id={recipe.id}
              data-tooltip={flavor ? '' : undefined}
              data-tooltip-flavor={flavor}
              data-tooltip-tone={color}
              aria-description={hoverDetail}
              tabIndex={-1}
              style={{ '--recipe-color': color } as React.CSSProperties}
            >
              {compact ? <button type="button" className="recipe-guide-icon recipe-guide-icon-button" aria-label={`Show ${recipe.name} recipe details`} aria-description={hoverDetail} aria-expanded={expandedCompactRecipe === recipe.id || navigationTarget === recipe.id} onClick={() => setExpandedCompactRecipe(current => current === recipe.id ? undefined : recipe.id)}><RecipeIcon recipe={recipe} node={group.node} /></button>
                : <span className="recipe-guide-icon"><RecipeIcon recipe={recipe} node={group.node} /></span>}
              <div className="recipe-guide-copy">
                <div className="recipe-guide-title"><strong>{recipe.name}</strong></div>
                <div className="recipe-guide-formula" aria-label={`${recipe.name} ingredients: ${(Object.entries(recipe.inputs) as Array<[ItemId, number]>).map(([item, amount]) => `${amount} ${ITEM_NAMES[item]}`).join(', ')}`}>
                  <span className="recipe-guide-materials inputs">
                    {(Object.entries(recipe.inputs) as Array<[ItemId, number]>).map(([item, amount]) => {
                      const producer = producers.get(item);
                      const content = <><MaterialBoxes item={item} amount={amount} /><b>{amount}</b>{ITEM_NAMES[item]}</>;
                      return producer ? <button
                        type="button"
                        className="recipe-guide-material ingredient-link"
                        key={`${recipe.id}-${item}`}
                        aria-label={`${amount} ${ITEM_NAMES[item]}: view recipe`}
                        aria-description={`Created in ${NODE_DEFINITIONS[producer.node].name}.`}
                        onClick={() => { setPreviewRecipeId(producer.recipeId); setExpandedCompactRecipe(producer.recipeId); setFilters([producer.groupId]); setNavigationTarget(producer.recipeId); }}
                      >{content}</button> : <span className="recipe-guide-material" key={`${recipe.id}-${item}`}>{content}</span>;
                    })}
                  </span>
                  <span className="recipe-guide-arrow" aria-hidden="true">→</span>
                  <span className="recipe-guide-materials outputs">
                    {(Object.entries(recipe.outputs) as Array<[ItemId, number]>).map(([item, amount]) => <span className="recipe-guide-material" key={item}><MaterialBoxes item={item} amount={amount} /><b>{amount}</b>{ITEM_NAMES[item]}</span>)}
                    {recipe.chanceOutputs?.map((output, index) => <span className="recipe-guide-material chance-output" key={output.item + index} title="Independent chance per batch"><MaterialBoxes item={output.item} amount={output.amount} /><b>{output.amount}</b>{ITEM_NAMES[output.item]}<small>{Number((output.probability * 100).toFixed(2))}% chance</small></span>)}
                  </span>
                </div>
                <span className="recipe-card-time" aria-label={`${cycleMs / 1000} seconds per batch`}>{Number((cycleMs / 1000).toFixed(2))} sec</span>
              </div>
            </article>;
          })}
        </div>
      </section>)}
      {!groups.length && <p className="empty-state">No recipes unlocked yet. Complete the required research or discoveries first. The paperwork precedes production.</p>}
    </div>
  </section></div>;
}

function MaterialBoxes({ item, amount }: { item: ItemId; amount: number }) {
  return <span className="recipe-material-boxes" aria-hidden="true" style={{ color: itemColorCss(item) }}>
    {Array.from({ length: Math.min(5, Math.max(1, Math.ceil(amount))) }, (_, index) => <i key={index} />)}
  </span>;
}
