import { expect, it } from 'vitest';
import { boxControlSelection, ControlGroupSelection, CONTROL_GROUP_COLORS } from '../domain/controlGroups';
import { GameEngine } from '../simulation/engine';
import { CONTROL_GROUP_NODE_IDS as ids, CONTROL_GROUP_STAGES, createTutorialState, lessonSatisfied } from './tutorialRuntime';

it('finishes every active Control Groups step using the real selection and movement rules', () => {
  const engine = new GameEngine(createTutorialState('control-groups'), { autosave: false });
  const game = engine.getState(), sector = engine.getSector();
  const selection = new ControlGroupSelection();
  const context = { selectedIds: [...ids], selectionInfo: { source: 'box' as 'node' | 'box', individual: false, priority: false, forward: true }, moveOrigins: Object.fromEntries(sector.nodes.map(node => [node.id, { x: node.x, y: node.y }])) };
  const satisfied = (stage: typeof CONTROL_GROUP_STAGES[number]) => lessonSatisfied(stage, game, null, undefined, context);
  expect(satisfied('control-group-select')).toBe(true);
  const group = engine.createControlGroup(ids, CONTROL_GROUP_COLORS[0].value)!;
  expect(satisfied('control-group-create')).toBe(true);
  selection.clear();
  context.selectedIds = selection.press(ids[1], [], [group], { x: 500, y: 300 }, 1000);
  context.selectionInfo.source = 'node';
  expect(satisfied('control-group-click')).toBe(true);
  engine.moveNodes([ids[0]], 80, 100);
  expect(satisfied('control-group-move')).toBe(false);
  engine.moveNodes([ids[0]], -80, -100);
  engine.moveNodes(ids, 240, 160);
  expect(satisfied('control-group-move')).toBe(true);
  selection.clear();
  selection.press(ids[0], [], [group], { x: 700, y: 500 }, 2000);
  context.selectedIds = selection.press(ids[0], [], [group], { x: 700, y: 500 }, 2100);
  context.selectionInfo.individual = selection.individualId === ids[0];
  expect(satisfied('control-group-double-click')).toBe(true);
  for (const reverse of [false, true]) {
    const box = boxControlSelection([ids[0]], [group], reverse ? { x: 900, y: 600 } : { x: 500, y: 300 }, reverse ? { x: 500, y: 300 } : { x: 900, y: 600 });
    selection.box(box.ids, box.priority);
    context.selectedIds = box.ids;
    context.selectionInfo = { source: 'box', individual: false, priority: box.priority, forward: !reverse };
    expect(satisfied(reverse ? 'control-group-select-reverse' : 'control-group-select-forward')).toBe(true);
  }
  expect(engine.disbandControlGroup(group.id)).toBe(true);
  expect(satisfied('control-group-disband')).toBe(true);
  expect(CONTROL_GROUP_STAGES).toHaveLength(9);
  expect(CONTROL_GROUP_STAGES.indexOf('control-group-move')).toBeLessThan(CONTROL_GROUP_STAGES.indexOf('control-group-double-click'));
});
