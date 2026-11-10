import { useRef, useState } from 'react';
import { PanelHeader } from '../PanelHeader';

const COMMAND_GROUPS = [
  {
    id: 'general',
    title: 'General',
    commands: [
      ['Ctrl / Cmd + Z', 'Undo the last recorded change, such as placing, moving or deleting nodes, or editing a cable.'],
      ['Ctrl / Cmd + C', 'Duplicate eligible selected nodes and the cables between them in a nearby open space. Available outside tutorials.'],
      ['Esc', 'Cancel placement or wiring, dismiss the current dialog or panel, or clear the selection.'],
      ['Delete / Backspace', 'Remove the selected cable or request deletion of selected nodes that can be removed.'],
      ['B', 'Toggle Build.'],
      ['J', 'Toggle the Discovery Journal.'],
      ['O', 'Toggle Options.'],
      ['Q', 'Toggle Research.'],
      ['M', 'Toggle the field minimap once Exploration unlocks it. If the full map is open, close it and hide the minimap.'],
      ['Shift + M', 'Toggle the full Node Map once Exploration unlocks it.'],
      ['?', 'Toggle this Commands panel.'],
    ],
  },
  {
    id: 'pointer',
    title: 'Mouse and trackpad',
    commands: [
      ['Mouse wheel / trackpad pinch', 'Zoom around the pointer.'],
      ['Two-finger scroll', 'Pan the field with a trackpad.'],
      ['Right or middle drag', 'Pan the factory field, including from a node. When holding a node for placement, right-click cancels it.'],
      ['Space + left drag', 'Pan the field.'],
      ['Left drag on empty field', 'Draw a selection box around movable nodes. Hold Shift to add to the current selection.'],
      ['Drag a node', 'Move the node or its current selection together, if there is room at the destination.'],
      ['Drag between output and input', 'Connect compatible sockets on different nodes. You can start from either end.'],
      ['Drag from a wired input', 'Reroute the attached cable when there is a single incoming cable or one of its cables is selected.'],
      ['Click a cable', 'Select the cable and reveal its delete button.'],
    ],
  },
  {
    id: 'nodes',
    title: 'Nodes and shortcut bars',
    commands: [
      ['Ctrl / Cmd + click a node', 'Pick up a new node of the same type when that node can be built.'],
      ['Hold A', 'Snap node corners to the grid when placing or moving nodes. Options can keep grid snapping on. Groups keep their spacing.'],
      ['Shift + right-click, then Shift + left-click', 'Copy a recipe from a configured machine to another of the same type. Keep Shift held between clicks.'],
      ['Ctrl / Cmd + click or Shift + click to place', 'Place a node and keep another of the same type ready outside tutorials. Configure repeated nodes after placement.'],
      ['Click a configurable node', 'Open the recipe chooser for a recipe machine, the configuration for a Road or settlement Tribute, or Research from the Research Center.'],
      ['Click the gear on a node', 'Open settings on nodes that show a gear when hovered, such as a Filter.'],
      ['Right-click a production node', 'Swap its input and output sides after Connector Mirroring research. Cables stay attached.'],
      ['Right-click supported logistics nodes', 'Rotate connectors on supported nodes, such as a Splitter, Merger or Road. Cables stay attached.'],
      ['R', 'Rotate a supported node under the pointer. If you are not hovering over a node, use the selected node.'],
      ['Click / right-click the ⇅ node button', 'On supported machines, click to cycle input order or right-click to cycle output position. Zoom in if the button is too small.'],
      ['1–5', 'Pick up the assigned, unlocked node from the matching Production bar slot.'],
      ['Shift + 1–5', 'Pick up the assigned, unlocked node from the matching Logistics bar slot.'],
      ['Ctrl + 1–5', 'Pick up the assigned, unlocked node from the matching Storage bar slot.'],
      ['F1 / F2 / F3', 'Show or hide the Production, Logistics or Storage bar, respectively.'],
      ['Click or drag an assigned slot', 'Click to pick up the node, or drag it onto the field to place it.'],
      ['Right-click a slot', 'Assign a node or clear the slot. Clicking an empty slot also opens the assignment menu.'],
      ['Drag the six-dot handle', 'Move an unlocked bar or its attached group. Drag close to another bar to attach them.'],
      ['Click the attach padlock', 'Detach that bar. The remaining bars stay attached.'],
      ['Right-click an attached bar frame', 'Separate every bar in the attached group.'],
      ['Click the bar’s rotate button', 'Turn an unlocked bar or its attached group between horizontal and vertical.'],
      ['Click the bar’s lock button', 'Lock or unlock the bar’s layout.'],
      ['Drag the bar’s resize corner', 'Resize an unlocked shortcut bar.'],
    ],
  },
  {
    id: 'groups',
    title: 'Control groups',
    commands: [
      ['Shift + click / drag a selection box', 'Add nodes to the current selection.'],
      ['Right-click a selected node', 'With at least two nodes selected, right-click one that is ungrouped to choose a group color. Rotation and Connector Mirroring take priority on nodes that support those actions.'],
      ['Click or drag a group member', 'Select or move the group together.'],
      ['Double-click a group member', 'Select that node on its own. Hold the second click and drag to move it independently.'],
      ['Drag a selection box down-right', 'Include the full group of each touched node.'],
      ['Drag a selection box up-left', 'Select only the touched nodes and move them independently of their groups.'],
      ['Right-click a group member', 'Choose Disband when the node’s right-click action opens the group dialog. Rotation and Connector Mirroring take priority on nodes that support those actions.'],
      ['Ctrl / Cmd + C', 'When every member can be duplicated and is selected, the copy gets its own control group.'],
    ],
  },
] as const;

type CommandFilter = 'all' | typeof COMMAND_GROUPS[number]['id'];
const normalizeSearch = (value: string) => value.toLowerCase().replace(/[–—]/g, '-');

export function CommandsPanel({ onClose }: { onClose(): void }) {
  const [filter, setFilter] = useState<CommandFilter>('all');
  const [query, setQuery] = useState('');
  const results = useRef<HTMLDivElement>(null);
  const words = normalizeSearch(query).trim().split(/\s+/).filter(Boolean);
  const groups = COMMAND_GROUPS.filter(group => filter === 'all' || group.id === filter).map(group => ({
    ...group,
    commands: group.commands.filter(([keys, description]) => {
      const text = normalizeSearch(`${group.title} ${keys} ${description}`);
      return words.every(word => text.includes(word));
    }),
  })).filter(group => group.commands.length > 0);
  const count = groups.reduce((total, group) => total + group.commands.length, 0);
  const scrollToTop = () => { if (results.current) results.current.scrollTop = 0; };

  return (
    <div className="modal-backdrop">
      <section className="modal commands-modal glass" role="dialog" aria-label="Commands"
        onKeyDown={event => { if (event.code === 'Space') event.stopPropagation(); }}>
        <PanelHeader title="Commands" onClose={onClose} />
        <div className="commands-toolbar">
          <div className="commands-filters" role="group" aria-label="Filter by category">
            <button type="button" aria-pressed={filter === 'all'} onClick={() => { setFilter('all'); scrollToTop(); }}>All</button>
            {COMMAND_GROUPS.map(group => (
              <button type="button" key={group.id} aria-pressed={filter === group.id}
                onClick={() => { setFilter(group.id); scrollToTop(); }}>
                {group.title}
              </button>
            ))}
          </div>
          <div className="commands-search">
            <label className="commands-search-field">
              <span aria-hidden="true">⌕</span>
              <input type="search" aria-label="Search commands" placeholder="Search commands"
                value={query} onChange={event => { setQuery(event.target.value); scrollToTop(); }}
                onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); } }} />
            </label>
            <span role="status">{count} {count === 1 ? 'command' : 'commands'}</span>
          </div>
        </div>
        <div className="commands-results" ref={results} role="region" aria-label="Command results" tabIndex={0}>
          {groups.map(group => (
            <section key={group.id}>
              <h3>{group.title}</h3>
              <ul className="command-list">
                {group.commands.map(([keys, description]) => (
                  <li className="command-row" key={keys}><kbd>{keys}</kbd><span>{description}</span></li>
                ))}
              </ul>
            </section>
          ))}
          {count === 0 && <div className="commands-empty">
            <p>No matching commands.</p>
            <button type="button" onClick={() => { setFilter('all'); setQuery(''); scrollToTop(); }}>Clear search and filters</button>
          </div>}
        </div>
      </section>
    </div>
  );
}
