import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { GameState } from '../domain/types';
import { PanelHeader } from './PanelHeader';
import { researchSection } from './researchPresentation';
import { buildResearchTree, researchAncestors, researchTreeEdgePath, researchTreeLayout } from './researchTree';

const states = { active: 'Researching', available: 'Available', milestones: 'Milestone', completed: 'Complete', future: 'Locked' };

export function ResearchTreeModal({ game, focusProjectId, onInspect, onClose }: { game: GameState; focusProjectId?: string; onInspect(id: string): void; onClose(): void }) {
  const [query, setQuery] = useState(''), [focusedId, setFocusedId] = useState(focusProjectId), [width, setWidth] = useState(800);
  const scroll = useRef<HTMLDivElement>(null), search = useRef<HTMLInputElement>(null), modal = useRef<HTMLElement>(null);
  const tree = useMemo(() => buildResearchTree(), []);
  const visible = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return tree.nodes;
    const ids = new Set(tree.nodes.filter(node => node.project.name.toLowerCase().includes(value)).flatMap(node => [...researchAncestors(tree, node.project.id)]));
    return tree.nodes.filter(node => ids.has(node.project.id));
  }, [query, tree]);
  const layout = useMemo(() => researchTreeLayout(visible, width - 32), [visible, width]);
  const paths = useMemo(() => tree.edges.flatMap(edge => {
    const from = layout.positions.get(edge.from), to = layout.positions.get(edge.to);
    return from && to ? [{ ...edge, path: researchTreeEdgePath(from, to, layout.positions.values(), layout.width) }] : [];
  }), [tree, layout]);
  const lineage = useMemo(() => focusedId ? researchAncestors(tree, focusedId) : new Set<string>(), [tree, focusedId]);
  const names = new Map(tree.nodes.map(node => [node.project.id, node.project.name]));
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
      <PanelHeader eyebrow="PREREQUISITES" title="Research tree" onClose={onClose} />
      <div className="research-tree-tools">
        <p>Start at the top. The obligations accumulate below.</p>
        <label><span>Find research</span><input ref={search} type="search" value={query} placeholder="Find a project or upgrade…" onChange={event => { setQuery(event.target.value); setFocusedId(undefined); }} /></label>
        <div className="research-tree-legend" aria-label="Research states"><span className="completed">Complete</span><span className="active">Researching</span><span className="available">Available</span><span className="future">Locked</span></div>
        <small aria-live="polite">{visible.length} of {tree.nodes.length} projects{query.trim() ? ' · with prerequisites' : ''}</small>
      </div>
      <div ref={scroll} className="research-tree-scroll" role="region" aria-label="Research connections, from foundations down to advanced projects">
        {visible.length ? <div className="research-tree-board" style={{ width: layout.width, height: layout.height }}>
          <svg className="research-tree-lines" width={layout.width} height={layout.height} aria-hidden="true">
            <defs><marker id="research-tree-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 0 L 8 4 L 0 8 Z" fill="currentColor" /></marker></defs>
            {paths.map(edge => {
              const highlighted = lineage.has(edge.from) && lineage.has(edge.to);
              return <path key={`${edge.from}:${edge.to}`} data-from={edge.from} data-to={edge.to} className={highlighted ? 'highlighted' : ''} d={edge.path} markerEnd="url(#research-tree-arrow)" />;
            })}
          </svg>
          {visible.map(node => {
            const project = node.project, position = layout.positions.get(project.id)!, state = researchSection(project, game);
            const prerequisites = node.dependencies.map(id => names.get(id)).join(', ') || 'None';
            return <button type="button" key={project.id} data-tree-research={project.id} data-depth={node.depth} className={`research-tree-node ${state} ${lineage.has(project.id) ? 'in-branch' : ''}`} style={{ left: position.x, top: position.y, width: position.width, height: position.height }} aria-label={`${project.name}. ${states[state]}. Prerequisites: ${prerequisites}. View details.`} onMouseEnter={() => setFocusedId(project.id)} onFocus={() => setFocusedId(project.id)} onClick={() => onInspect(project.id)}>
              <strong>{project.name}</strong>
            </button>;
          })}
        </div> : <p className="empty-state">No matching projects. Even ambition has spelling requirements.</p>}
      </div>
      <footer className="research-tree-note">Click a project for details. Repeatable projects show their initial dependencies.</footer>
    </section>
  </div>;
}
