import type { Container, Graphics, Text } from 'pixi.js';
import type { CameraState, InFlightTransfer, NodeKind } from '../domain/types';
import type { GameEngine } from '../simulation/engine';
import type { CampNodeStatus } from './campNodeStatus';
import type { ResearchNodeStatus } from './researchNodeStatus';
import type { NodeSize } from '../domain/nodeGeometry';

export interface PlayfieldTooltip { title: string; detail: string; x: number; y: number; tone?: string; eyebrow?: string }
export interface SelectionInfo { source: 'node' | 'box'; individual?: boolean; priority?: boolean; forward?: boolean; }

export interface PixiPlayfieldProps {
  engine: GameEngine;
  revision: number;
  selectedIds: string[];
  selectableNodeId?: string;
  selectedConnection?: string;
  placing?: NodeKind;
  snapToGrid: boolean;
  connectionSource?: string;
  cameraFocus?: { camera: CameraState; nonce: number };
  onSelect(ids: string[], info?: SelectionInfo): void;
  onNodeContextMenu(id: string, priority: boolean, shiftKey: boolean): void;
  onCopyRecipe(id: string): boolean;
  onPlace(kind: NodeKind, x: number, y: number, repeat: boolean): void;
  onConnect(from: string, to: string, fromPort: number, toPort: number, replaceConnectionId?: string): boolean;
  onConnectionRejected(failure: { title: string; detail: string; x: number; y: number }): void;
  onConnectionSource(id?: string): void;
  onConnectionSelect(id?: string): void;
  onDeleteConnection(id: string): void;
  onDeleteNode(id: string): void;
  onCycleInputPorts(id: string): void;
  onCycleOutputPorts(id: string): void;
  onRotate(id: string): void;
  onConfigure(id: string): void;
  onClonePlacement(kind: NodeKind): void;
  onHoverNode?(id?: string): void;
  onTooltip?(tooltip?: PlayfieldTooltip): void;
  onDragPreview?(positions?: Record<string, { x: number; y: number }>): void;
  jointMoveHint?: boolean;
  onCamera(camera: CameraState): void;
}

export interface DragState { ids: string[]; anchorId: string; anchorSize: NodeSize; start: { x: number; y: number }; origins: Map<string, { x: number; y: number }>; moved: boolean; desired?: Record<string, { x: number; y: number }>; valid: boolean }
export interface NodeView { root: Container; campStatus?: CampNodeStatus; filterNotice?: Text; jointMoveHandle?: Container; researchStatus?: ResearchNodeStatus; productionCue: Graphics; progress: Graphics; progressLabel?: Text; bufferLabel?: Text; bufferSquares?: Graphics; bufferSignature?: string; inputSquares?: Graphics; inputSignature?: string; coreStorageLabels?: Text[]; coreStorageSquares?: Graphics[]; readabilityLabels: Text[]; flash: Graphics; marqueeHighlight: Graphics; invalidOverlay: Graphics; invalidVisible: boolean; displayedProgress: number }
export interface PortHandle { nodeId: string; direction: 'input' | 'output'; index: number }
export interface PortView extends PortHandle { root: Container; highlight: Graphics; pulse: Graphics; pulseColor: number; pulseStartedAt: number; hovered: boolean; materialShape?: Graphics; materialLabel?: Text; materialBuffer?: Graphics; materialSignature?: string }
export interface ConnectionDragState { originNodeId: string; active: PortHandle; replaceConnectionId?: string; adaptiveJointDirection: boolean; startX: number; startY: number; moved: boolean; snapped?: PortHandle }
export interface ConnectionRejection { origin: PortHandle; target?: PortHandle; point: { x: number; y: number }; startedAt: number }
export interface CurveMotionSample { x: number; y: number; distance: number }
export interface FlowParticle { root: Container; connectionId: string; transfer: InFlightTransfer; path: CurveMotionSample[]; passages: Array<{ nodeId: string; phase: number }>; passed: Set<string> }
export interface PlacementView { kind: NodeKind; view: NodeView; status: Text }

