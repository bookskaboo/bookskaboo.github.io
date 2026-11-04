import { useState } from 'react';

const VIEW_KEY = 'factorinode.recipe-icon-view.v1';

export function useRecipeIconView() {
  const [compact, setCompact] = useState(() => {
    try { return localStorage.getItem(VIEW_KEY) === 'true'; } catch { return false; }
  });
  const toggle = () => setCompact(current => {
    try { localStorage.setItem(VIEW_KEY, String(!current)); } catch { /* The view still works without storage. */ }
    return !current;
  });
  return { compact, toggle };
}

export function RecipeViewToggle({ compact, onToggle }: { compact: boolean; onToggle(): void }) {
  return <button type="button" className="recipe-view-toggle" aria-label="Compact recipe cards" aria-pressed={compact} onClick={onToggle}
    data-tooltip={compact ? 'Show recipe details' : 'Show recipe icons'} data-tooltip-detail={compact ? 'Restore names and ingredients on every card.' : 'Use smaller cards. Hover or focus an icon for its recipe. The ingredients still apply.'}>
    <span aria-hidden="true">{compact ? '☷' : '▦'}</span>{compact ? 'Details' : 'Icons'}
  </button>;
}
