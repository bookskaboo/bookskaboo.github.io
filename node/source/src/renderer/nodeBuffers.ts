import { type ProductionVisual } from './productionVisuals';
import { isProductionMachine, productionPortRow } from './productionPortRows';
import { inputBufferRows } from './inputBufferRows';
import { bufferSlots, isStorageNode } from './bufferSlots';
import { Graphics } from 'pixi.js';
import { ITEM_COLORS } from '../content/items';
import { getEffectiveNodeInputFamilies, NODE_DEFINITIONS } from '../content/nodes';
import { getNodeModule } from '../content/nodeModules';
import { RECIPES } from '../content/recipes';
import type { ItemId, MachineNode, SectorState } from '../domain/types';
import { getPortSide } from '../simulation/connectionRules';
import { getNodeSize, getPortAnchor, isOrganicNode, isResourceNode } from '../domain/nodeGeometry';
import type { NodeView, PortView } from './playfieldTypes';
import { outputTotal, inputTotal, outputCapacity, portLabelText } from './playfieldNodeState';

export function updateProductionPort(view: PortView, node: MachineNode, sector: SectorState) {
  if (!view.materialBuffer || !view.materialShape || !view.materialLabel) return;
  const row = productionPortRow(node, view.direction, view.index, sector);
  const left = getPortSide(node, view.direction, view.index) === 'west';
  const signature = `${left}:${JSON.stringify(row)}`;
  if (signature === view.materialSignature) return;
  view.materialSignature = signature;
  view.materialShape.clear().circle(0, 0, 10).fill(row.color);
  const text = view.materialLabel;
  text.anchor.set(left ? 0 : 1, .5); text.position.set(left ? 18 : -18, -9);
  text.text = portLabelText(row.name);
  const available = getNodeSize(node).w / 2 - 26;
  while (text.width > available && text.text.length > 4) text.text = text.text.replace(/…$/, '').slice(0, -1) + '…';
  const graphics = view.materialBuffer; graphics.clear();
  bufferSlots(row.amount, row.capacity, 5).forEach((fill, index) => {
    const x = left ? 18 + index * 14 : -28 - index * 14;
    graphics.roundRect(x, 5, 10, 10, 1).fill(0x171c21).stroke({ color: fill > 0 ? row.color : 0x596570, width: 1, alpha: fill > 0 ? 1 : .75 });
    if (fill > 0) graphics.rect(x + 1.5, 6.5 + 7 * (1 - fill), 7, 7 * fill).fill(row.color);
  });
}

export function drawBufferSquares(graphics: Graphics, amount: number, capacity: number, color: number, cell = 11, gap = 4, columns = 10, maximumSquares = 40) {
  graphics.clear();
  const slots = bufferSlots(amount, capacity, maximumSquares);
  slots.forEach((fill, index) => {
    const x = (index % columns) * (cell + gap), y = Math.floor(index / columns) * (cell + gap);
    graphics.roundRect(x, y, cell, cell, 1.5).fill({ color: 0x14191e, alpha: 1 }).stroke({ color: fill > 0 ? color : 0x697580, width: 1.2, alpha: fill > 0 ? 1 : .65 });
    if (fill > 0) graphics.roundRect(x + 1.5, y + 1.5 + (cell - 3) * (1 - fill), cell - 3, (cell - 3) * fill, 1).fill({ color, alpha: 1 });
  });
}

export function updateBufferSquares(view: NodeView, node: MachineNode) {
  if (!view.bufferSquares) return;
  const chest = getNodeModule(node.kind).appearance.shape === 'chest';
  const amount = outputTotal(node) + (chest ? inputTotal(node) : 0), capacity = outputCapacity(node);
  const item = (Object.keys({ ...node.input, ...node.output }) as ItemId[]).find(item => (node.output[item] ?? 0) + (chest ? node.input[item] ?? 0 : 0) > 0) ?? Object.keys(RECIPES[node.recipeId ?? '']?.outputs ?? {})[0] as ItemId | undefined;
  const color = item ? ITEM_COLORS[item] : NODE_DEFINITIONS[node.kind].accent;
  const signature = `${amount}|${capacity}|${color}`;
  if (signature === view.bufferSignature) return;
  view.bufferSignature = signature;
  const size = getNodeSize(node), columns = chest ? 5 : Math.min(10, Math.max(1, Math.floor((size.w - 24) / 15)));
  const cell = chest ? 10 : 11, gap = chest ? 3 : 4, stride = cell + gap;
  const count = bufferSlots(amount, capacity, chest ? 20 : 40).length, rows = Math.ceil(count / columns);
  drawBufferSquares(view.bufferSquares, amount, capacity, color, cell, gap, columns, chest ? 20 : 40);
  view.bufferSquares.position.set(-(Math.min(count, columns) * stride - gap) / 2, size.h / 2 - (isStorageNode(node.kind) ? 14 : 42) - (rows * stride - gap));
}

export function drawProductionCue(graphics: Graphics, node: MachineNode, cue: ProductionVisual | undefined, completed: readonly string[]) {
  graphics.clear();
  if (!cue || isResourceNode(node) || isOrganicNode(node) || isProductionMachine(node)) return;
  // Hollow sockets identify the exact ingredient feed that is short.
  cue.missingInputs.forEach(index => {
    if (index >= getEffectiveNodeInputFamilies(node, completed).length) return;
    const anchor = getPortAnchor(node, 'input', index);
    graphics.circle(anchor.x, anchor.y, 15).stroke({ color: 0x8cbfd7, width: 2, alpha: .9 });
    graphics.moveTo(anchor.x - 23, anchor.y - 7).lineTo(anchor.x - 30, anchor.y).lineTo(anchor.x - 23, anchor.y + 7).stroke({ color: 0x8cbfd7, width: 2, alpha: .8 });
  });
}


export function updateInputSquares(view: NodeView, node: MachineNode) {
  if (!view.inputSquares) return;
  const rows = inputBufferRows(node);
  const signature = JSON.stringify(rows);
  if (signature === view.inputSignature) return;
  view.inputSignature = signature;
  const graphics = view.inputSquares;
  graphics.clear();
  for (const row of rows) {
    const color = ITEM_COLORS[row.item];
    const slots = bufferSlots(row.amount, row.capacity, 10);
    const x = -(slots.length * 15 - 4) / 2;
    slots.forEach((fill, index) => {
      const left = x + index * 15;
      graphics.roundRect(left, row.y, 11, 11, 1.5).fill({ color: 0x14191e }).stroke({ color, width: 1.2, alpha: fill > 0 ? 1 : .45 });
      if (fill > 0) graphics.roundRect(left + 1.5, row.y + 1.5 + 8 * (1 - fill), 8, 8 * fill, 1).fill({ color });
    });
  }
}
