import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { NodeKind } from '../domain/types';
import type { GameEngine } from '../simulation/engine';
import type { TrainingSession } from './Tutorials';
import { unlockDestination, type UnlockDestination } from './unlockNavigation';

export type Panel = 'build' | 'inventory' | 'journal' | 'research' | 'map' | 'options' | 'save' | 'commands' | 'recipes' | 'dev' | 'mods' | null;
interface PanelActions {
  engine: Pick<GameEngine, 'acknowledgeCornerDiscovery'>;
  training?: TrainingSession;
  allowedPanel?: string;
  mapAvailable: boolean;
  setInspectingNodeId: Dispatch<SetStateAction<string | undefined>>;
  setConfiguringNodeId: Dispatch<SetStateAction<string | undefined>>;
  setPlacement: Dispatch<SetStateAction<NodeKind | undefined>>;
  setPasting: Dispatch<SetStateAction<boolean>>;
  setMinimapVisible: Dispatch<SetStateAction<boolean>>;
  setBuildCategory: Dispatch<SetStateAction<string>>;
}

/** Own panel/recipe return state while Dialog retains focus and top-dialog policy. */
export function useFactoryPanels({ engine, training, allowedPanel, mapAvailable, setInspectingNodeId,
  setConfiguringNodeId, setPlacement, setPasting, setMinimapVisible, setBuildCategory }: PanelActions) {
  const [panel, setPanel] = useState<Panel>(null);
  const [returnPanel, setReturnPanel] = useState<Exclude<Panel, null> | null>(null);
  const [unlockFocus, setUnlockFocus] = useState<UnlockDestination>();
  const [unlockVisit, setUnlockVisit] = useState(0);
  const researchRecipeParent = useRef<Panel>(null);
  const researchRecipeFocus = useRef<HTMLElement | null>(null);
  const researchRecipeScroll = useRef(0);

  const closePanels = useCallback(() => { setPanel(null); setReturnPanel(null); setInspectingNodeId(undefined); setConfiguringNodeId(undefined); }, []);
  const dismissPanel = useCallback(() => {
    if (panel === 'recipes' && returnPanel === 'research') { setPanel('research'); setReturnPanel(researchRecipeParent.current); researchRecipeParent.current = null; }
    else if (returnPanel) { setPanel(returnPanel); setReturnPanel(null); }
    else setPanel(null);
  }, [panel, returnPanel]);
  useEffect(() => { if (panel === 'map' && !mapAvailable) dismissPanel(); }, [panel, mapAvailable, dismissPanel]);
  const openResearchRecipe = (recipeId: string) => {
    if (training) return;
    researchRecipeParent.current = returnPanel;
    researchRecipeFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    researchRecipeScroll.current = document.querySelector('.status-stage-list, .research-sections')?.scrollTop ?? 0;
    setUnlockFocus({ panel: 'recipes', recipeId }); setReturnPanel('research'); setPanel('recipes');
  };
  useEffect(() => {
    if (panel !== 'research' || !researchRecipeFocus.current) return;
    const target = researchRecipeFocus.current; researchRecipeFocus.current = null;
    const frame = requestAnimationFrame(() => {
      document.querySelector('.status-stage-list, .research-sections')?.scrollTo({ top: researchRecipeScroll.current });
      if (target.isConnected) target.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [panel]);
  const togglePanel = useCallback((next: Exclude<Panel, null>) => {
    if (training && allowedPanel !== next) return;
    if (next === 'map') { setMinimapVisible(true); engine.acknowledgeCornerDiscovery(); }
    setUnlockFocus(undefined); setReturnPanel(null); setPanel((current) => current === next ? null : next); setPlacement(undefined); setPasting(false); setInspectingNodeId(undefined); setConfiguringNodeId(undefined);
  }, [training, allowedPanel, engine]);
  const openSubPanel = useCallback((next: Exclude<Panel, null>, parent: Exclude<Panel, null>) => { setUnlockFocus(undefined); setReturnPanel(parent); setPanel(next); }, []);
  const openUnlock = (projectId: string, fromJournal = false, nodeKind?: NodeKind) => {
    const destination = unlockDestination(projectId, nodeKind);
    setUnlockFocus(destination); setUnlockVisit(value => value + 1);
    setPlacement(undefined); setConfiguringNodeId(undefined);
    setReturnPanel(fromJournal ? 'journal' : null); setPanel(destination.panel);
    if (destination.panel === 'build') setBuildCategory('All');
  };

  return { panel, setPanel, returnPanel, setReturnPanel, unlockFocus, unlockVisit,
    closePanels, dismissPanel, openResearchRecipe, togglePanel, openSubPanel, openUnlock };
}
