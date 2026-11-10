import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { GameState } from '../domain/types';
import { PanelHeader } from './PanelHeader';
import { researchSection } from './researchPresentation';
import { buildResearchTree, researchAncestors, researchMainPath, researchPathSteps, researchTreeEdgePath, researchTreeGroups, researchTreeLayout, visibleResearchTreeNodes } from './researchTree';

const states = { active: 'Researching', available: 'Available', milestones: 'Milestone', completed: 'Complete', future: 'Locked' };

export function ResearchTreeModal({ game, focusProjectId, onInspect, onClose }: { game: GameState; focusProjectId?: string; onInspect(id: string): void; onClose(): void }) {
  const [query, setQuery] = useState('');
  const [previewId, setPreviewId] = useState(focusProjectId);
  const [pinnedId, setPinnedId] = useState<string>();
  const [width, setWidth] = useState(800);
  const scroll = useRef<HTMLDivElement>(null), search = useRef<HTMLInputElement>(null), modal = useRef<HTMLElement>(null);
  const tree = useMemo(() => buildResearchTree(), []);
  const groups = useMemo(() => researchTreeGroups(tree), [tree]);
  const mainPath = useMemo(() => researchMainPath(tree), [tree]);
  const [expanded, setExpanded] = useState(() => new Set(groups.filter(group => group.ranks.some(node => node.project.id === focusProjectId)).map(group => group.anchorId)));
  const pinnedPath = useMemo(() => pinnedId ? researchAncestors(tree, pinnedId) : new Set<string>(), [tree, pinnedId]);
  const pinnedGroup = groups.find(group => group.ranks.some(node => node.project.id === pinnedId));
  const openGroups = useMemo(() => pinnedGroup ? new Set([...expanded, pinnedGroup.anchorId]) : expanded, [expanded, pinnedGroup]);
  const searching = Boolean(query.trim());
  const visible = useMemo(() => visibleResearchTreeNodes(tree, groups, openGroups, query, pinnedPath), [tree, groups, openGroups, query, pinnedPath]);
  const layout = useMemo(() => researchTreeLayout(visible, width - 32, mainPath), [visible, width, mainPath]);
  const ordered = useMemo(() => [...visible].sort((a, b) => {
    const first = layout.positions.get(a.project.id)!;
    const second = layout.positions.get(b.project.id)!;
    return first.y - second.y || first.x - second.x;
  }), [visible, layout]);
  const paths = useMemo(() => tree.edges.flatMap(edge => {
    const from = layout.positions.get(edge.from), to = layout.positions.get(edge.to);
    return from && to ? [{ ...edge, path: researchTreeEdgePath(from, to, layout.positions.values(), layout.width) }] : [];
  }), [tree, layout]);
  const lineage = useMemo(() => pinnedId ? pinnedPath : previewId ? researchAncestors(tree, previewId) : new Set<string>(), [tree, pinnedId, pinnedPath, previewId]);
  const names = useMemo(() => new Map(tree.nodes.map(node => [node.project.id, node.project.name])), [tree]);
  const { ids: nextSteps, needsFinalCore } = researchPathSteps(tree, pinnedPath, game);
  const nextProject = tree.nodes.filter(node => nextSteps.has(node.project.id)).sort((a, b) => a.depth - b.depth)[0]?.project;
  const allExpanded = groups.every(group => openGroups.has(group.anchorId));
  const clearPin = () => { setPinnedId(undefined); setPreviewId(undefined); };
  const toggleGroup = (anchorId: string) => {
    if (pinnedGroup?.anchorId === anchorId) clearPin();
    setExpanded(current => {
      const next = new Set(current);
      if (openGroups.has(anchorId)) next.delete(anchorId);
      else next.add(anchorId);
      return next;
    });
  };
  const toggleAllGroups = () => {
    if (allExpanded && pinnedGroup) clearPin();
    setExpanded(allExpanded ? new Set() : new Set(groups.map(group => group.anchorId)));
  };
  const jumpToNext = () => {
    if (!nextProject) return;
    const node = scroll.current?.querySelector<HTMLButtonElement>(`[data-tree-research="${CSS.escape(nextProject.id)}"]`);
    node?.scrollIntoView({ block: 'center', inline: 'nearest' });
    node?.focus({ preventScroll: true });
  };
  useLayoutEffect(() => {
    const element = scroll.current; if (!element) return;
    const update = () => setWidth(element.clientWidth);
    update(); const observer = new ResizeObserver(update); observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => { search.current?.focus(); }, []);
  useEffect(() => { scroll.current?.scrollTo({ top: 0 }); }, [query]);
  return <div className="modal-backdrop research-tree-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }} onKeyDownCapture={event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); }
    if (event.key === 'Tab') {
      const controls = [...(modal.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input') ?? [])];
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }}>
    <section ref={modal} className="modal research-tree-modal glass" role="dialog" aria-modal="true" aria-label="Research dependency tree">
      <PanelHeader title="Research tree" onClose={onClose} />
      <div className="research-tree-tools">
        <div className="research-tree-tools-actions">
          {groups.length > 0 && <button type="button" disabled={searching} onClick={toggleAllGroups}>{allExpanded ? 'Collapse all upgrades' : 'Expand all upgrades'}</button>}
          <small aria-live="polite">{searching ? `${visible.length} projects with prerequisites${pinnedId ? ' and pinned path' : ''}` : `${tree.nodes.length} projects`}</small>
        </div>
        <label><span>Find research</span><input ref={search} type="search" value={query} placeholder="Find a project or upgrade…" onChange={event => { setQuery(event.target.value); setPreviewId(undefined); }} /></label>
        <div className="research-tree-legend" aria-label="Research states"><span className="main-path">Main path</span><span className="completed">Complete</span><span className="active">Researching</span><span className="available">Available</span><span className="future">Locked</span></div>
      </div>
      <div ref={scroll} className="research-tree-scroll" role="region" aria-label="Research connections, from foundations down to advanced projects">
        {visible.length ? <div className={`research-tree-board${pinnedId ? ' has-pin' : ''}`} style={{ width: layout.width, height: layout.height }} onMouseLeave={() => setPreviewId(undefined)}>
          <svg className="research-tree-lines" width={layout.width} height={layout.height} aria-hidden="true">
            <defs><marker id="research-tree-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 0 L 8 4 L 0 8 Z" fill="currentColor" /></marker></defs>
            {paths.map(edge => {
              const highlighted = lineage.has(edge.from) && lineage.has(edge.to);
              const main = mainPath.has(edge.from) && mainPath.has(edge.to);
              return <path key={`${edge.from}:${edge.to}`} data-from={edge.from} data-to={edge.to} className={highlighted ? 'highlighted' : main ? 'main-path' : ''} d={edge.path} markerEnd="url(#research-tree-arrow)" />;
            })}
          </svg>
          {ordered.map(node => {
            const project = node.project, position = layout.positions.get(project.id)!, state = researchSection(project, game);
            const prerequisites = node.dependencies.map(id => names.get(id)).join(', ') || 'None';
            const group = searching ? undefined : groups.find(group => group.anchorId === project.id);
            const groupExpanded = Boolean(group && openGroups.has(group.anchorId));
            const rankStates = group && !groupExpanded ? group.ranks.map(rank => researchSection(rank.project, game)) : [];
            const finishedRanks = rankStates.filter(rank => rank === 'completed').length;
            const groupState = rankStates.includes('active') ? 'active' : rankStates.find(rank => rank !== 'completed') ?? 'completed';
            const isNext = nextSteps.has(project.id);
            const tileClass = ['research-tree-tile', mainPath.has(project.id) && 'main-path', lineage.has(project.id) && 'in-branch', isNext && 'is-next', pinnedId === project.id && 'is-pinned'].filter(Boolean).join(' ');
            return <div key={project.id} className={tileClass} style={{ left: position.x, top: position.y, width: position.width, height: position.height }} onMouseEnter={() => setPreviewId(project.id)} onFocus={() => setPreviewId(project.id)}>
              {group && <button type="button" className={groupExpanded ? 'research-tree-collapse' : `research-tree-node research-tree-group ${groupState}`} data-tree-group={group.anchorId} aria-label={`${groupExpanded ? 'Collapse' : 'Expand'} ${group.name}`} aria-expanded={groupExpanded} onClick={() => toggleGroup(group.anchorId)}>
                {groupExpanded ? '−' : <><strong>{group.name}</strong><small>{finishedRanks ? `${finishedRanks} of ${group.ranks.length} complete` : `${group.ranks.length} ranks`} <span aria-hidden="true">+</span></small></>}
              </button>}
              {(!group || groupExpanded) && <>
                <button type="button" data-tree-research={project.id} data-depth={node.depth} className={`research-tree-node ${state}`} aria-label={`${project.name}. ${states[state]}.${isNext ? ' Next step.' : ''} Prerequisites: ${prerequisites}. View details.`} onClick={() => onInspect(project.id)}>
                  <strong>{project.name}</strong>
                </button>
                <button type="button" className="research-tree-pin" aria-label={`Pin path to ${project.name}`} aria-pressed={pinnedId === project.id} title={pinnedId === project.id ? 'Unpin path' : 'Pin path'} onClick={() => pinnedId === project.id ? clearPin() : setPinnedId(project.id)}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M8 10.5v4m-3-13h6m-5 0v5L3.5 9v1.5h9V9L10 6.5v-5" /></svg>
                </button>
              </>}
            </div>;
          })}
        </div> : <p className="empty-state">No matching projects. Even ambition has spelling requirements.</p>}
      </div>
      <footer className="research-tree-note">
        {pinnedId ? <>
          <div className="research-tree-pin-summary" aria-live="polite">
            <strong>Pinned · {names.get(pinnedId)}</strong>
            {nextProject ? <span>Next · <button type="button" onClick={jumpToNext}>{nextProject.name}</button>{nextSteps.size > 1 ? ` +${nextSteps.size - 1} more` : ''}{needsFinalCore ? ' · Produce a Final Core' : ''}</span>
              : <span>{needsFinalCore ? 'Next · Produce a Final Core' : 'Path complete'}</span>}
          </div>
          <button type="button" onClick={() => { clearPin(); search.current?.focus(); }}>Clear pin</button>
        </> : 'Click a project for details or use its pin to follow the prerequisites.'}
      </footer>
    </section>
  </div>;
}
