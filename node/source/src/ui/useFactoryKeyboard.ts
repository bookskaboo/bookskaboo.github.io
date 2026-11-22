import { useEffect, type Dispatch, type SetStateAction, type RefObject } from 'react';
import { blocksFactoryShortcut } from './factoryKeyboard';
import { dialogBlocksPanelNavigation, hasOpenDialog } from './dialogFocus';
import { getNodeModule } from '../content/nodeModules';
import { isNodeUnlocked } from '../content/nodes';
import { SHORTCUT_BAR_IDS, type ShortcutBarsState } from './ShortcutBars';
import type { GameEngine } from '../simulation/engine';
import type { MachineNode, NodeKind } from '../domain/types';
import type { PlayfieldTooltip } from '../renderer/playfieldTypes';
import type { TrainingSession } from './Tutorials';
import type { TutorialStage } from '../tutorials/tutorialRuntime';
import type { tutorialChoices } from '../tutorials/tutorialChoices';
import type { Panel } from './useFactoryPanels';
interface KeyboardContext {
  changeShortcutBars(next: ShortcutBarsState): void;
  closePanels(): void; dismissPanel(): void; requestDelete(): void; closeWelcome(): void;
  togglePanel(panel: Exclude<Panel, null>): void;
  engine: Pick<GameEngine, 'undo' | 'copyNodes' | 'hasCopiedNodes' | 'rotateNode'>;
  researchUnlocked: string[]; nodes: MachineNode[]; selectedIds: string[]; selectedNode?: MachineNode;
  configuringNodeId?: string; hoveredNodeId?: string; pendingGroupNodes?: string[]; pendingDisbandGroup?: string;
  confirmDelete: boolean; mapAvailable: boolean; panel: Panel; shortcutBars: ShortcutBarsState;
  welcome: boolean; training?: TrainingSession; tutorialStage: TutorialStage;
  recipeCopySource: RefObject<string | undefined>;
  choices?: ReturnType<typeof tutorialChoices>; canBuild(kind: NodeKind): boolean;
  setPendingGroupNodes: Dispatch<SetStateAction<string[] | undefined>>;
  setPendingDisbandGroup: Dispatch<SetStateAction<string | undefined>>;
  setConfirmDelete: Dispatch<SetStateAction<boolean>>;
  setConfiguringNodeId: Dispatch<SetStateAction<string | undefined>>;
  setPlacement: Dispatch<SetStateAction<NodeKind | undefined>>;
  setPasting: Dispatch<SetStateAction<boolean>>;
  setSelectedIds: Dispatch<SetStateAction<string[]>>;
  setSelectedConnection: Dispatch<SetStateAction<string | undefined>>;
  setTooltip: Dispatch<SetStateAction<PlayfieldTooltip | undefined>>;
  setMinimapVisible: Dispatch<SetStateAction<boolean>>;
}
/** Preserve factory shortcut ordering, dialog guards and the original effect dependencies. */
export function useFactoryKeyboard({ changeShortcutBars, closePanels, configuringNodeId, confirmDelete, dismissPanel, engine, researchUnlocked, hoveredNodeId, mapAvailable, panel, pendingGroupNodes, pendingDisbandGroup, requestDelete, nodes, selectedIds, selectedNode, shortcutBars, togglePanel, welcome, training, tutorialStage, closeWelcome, setPendingGroupNodes, setPendingDisbandGroup, setConfirmDelete, setConfiguringNodeId, recipeCopySource, setPlacement, setPasting, setSelectedIds, setSelectedConnection, setTooltip, setMinimapVisible, choices, canBuild }: KeyboardContext) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const target = event.target as HTMLElement | null;
      const key = event.key.toLowerCase();
      const commandModifier = event.ctrlKey || event.metaKey;
      const plainKey = !commandModifier && !event.altKey && !event.shiftKey;
      if (welcome) { if (key === 'escape') { event.preventDefault(); closeWelcome(); } return; }
      if (pendingGroupNodes || pendingDisbandGroup) { if (key === 'escape') { event.preventDefault(); setPendingGroupNodes(undefined); setPendingDisbandGroup(undefined); } return; }
      if (confirmDelete) { if (key === 'escape') { event.preventDefault(); setConfirmDelete(false); } return; }
      if (configuringNodeId && key === 'escape') { event.preventDefault(); setConfiguringNodeId(undefined); return; }
      if (key === 'escape') { event.preventDefault(); recipeCopySource.current = undefined; setPlacement(undefined); setPasting(false); dismissPanel(); setSelectedIds([]); setSelectedConnection(undefined); setTooltip(undefined); return; }
      if (target?.matches('input, select, textarea') || target?.isContentEditable) return;
      if (blocksFactoryShortcut(event, Boolean(panel) || hasOpenDialog())) { event.preventDefault(); return; }
      if (dialogBlocksPanelNavigation()) return;
      if (!event.repeat && commandModifier && !event.altKey && !event.shiftKey && key === 'z') { event.preventDefault(); if (!training) { engine.undo(); setSelectedIds([]); setSelectedConnection(undefined); } return; }
      if (commandModifier && !event.altKey && !event.shiftKey && (key === 'c' || key === 'v')) {
        if (training || panel || event.repeat) return;
        if (key === 'c') {
          if (!window.getSelection()?.toString() && engine.copyNodes(selectedIds)) {
            event.preventDefault();
            setPasting(false);
          }
          return;
        }
        if (!engine.hasCopiedNodes()) return;
        event.preventDefault();
        closePanels();
        setPlacement(undefined);
        setTooltip(undefined);
        setPasting(true);
        return;
      }
      if (!event.repeat && plainKey && (key === 'delete' || key === 'backspace')) { event.preventDefault(); if (!training) requestDelete(); return; }
      if (!event.repeat && plainKey && key === 'b') { event.preventDefault(); togglePanel('build'); return; }
      if (!event.repeat && plainKey && key === 'j') { event.preventDefault(); togglePanel('journal'); return; }
      if (!event.repeat && plainKey && key === 'o') { event.preventDefault(); togglePanel('options'); return; }
      if (!event.repeat && plainKey && key === 'q') { event.preventDefault(); togglePanel('research'); return; }
      if (!event.repeat && !commandModifier && !event.altKey && event.shiftKey && key === 'm') { event.preventDefault(); if (mapAvailable) togglePanel('map'); return; }
      if (!event.repeat && plainKey && key === 'm') { event.preventDefault(); if (!training && mapAvailable) { if (panel === 'map') { dismissPanel(); setMinimapVisible(false); } else setMinimapVisible((visible) => !visible); } return; }
      if (!event.repeat && !commandModifier && !event.altKey && (key === '?' || (key === '/' && event.shiftKey))) { event.preventDefault(); togglePanel('commands'); return; }
      if (!event.repeat && plainKey && key === 'r') { const node = nodes.find((candidate) => candidate.id === hoveredNodeId) ?? selectedNode; if (node && (!training || choices?.rotationKind === node.kind) && getNodeModule(node.kind, node).controls.rotatable) { event.preventDefault(); engine.rotateNode(node.id); } return; }
      const functionBarShortcut = /^F([1-3])$/.exec(event.code);
      if (!event.repeat && plainKey && functionBarShortcut) { event.preventDefault(); if (!training) { const id = SHORTCUT_BAR_IDS[Number(functionBarShortcut[1]) - 1]; changeShortcutBars({ ...shortcutBars, [id]: { ...shortcutBars[id], visible: !shortcutBars[id].visible } }); } return; }
      const digitShortcut = /^Digit([1-5])$/.exec(event.code);
      if (!event.repeat && !event.metaKey && !event.altKey && !(event.ctrlKey && event.shiftKey) && digitShortcut) {
        const digit = Number(digitShortcut[1]);
        const barId = event.ctrlKey ? 'storage' : event.shiftKey ? 'logistics' : 'production'; const quick = shortcutBars[barId].assignments[digit - 1];
        if (quick && canBuild(quick) && isNodeUnlocked(quick, researchUnlocked)) { event.preventDefault(); setPasting(false); setPlacement(quick); closePanels(); }
      }
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [changeShortcutBars, closePanels, configuringNodeId, confirmDelete, dismissPanel, engine, researchUnlocked, hoveredNodeId, mapAvailable, panel, pendingGroupNodes, pendingDisbandGroup, requestDelete, nodes, selectedIds, selectedNode, shortcutBars, togglePanel, welcome, training?.kind, tutorialStage]);
}
