import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Dialog } from './components/Dialog';
import { getResearchProject } from '../content/research';
import type { GameState, ResearchProject } from '../domain/types';
import type { GameEngine } from '../simulation/engine';
import { permitsTutorialChoice, type TutorialChoice } from '../tutorials/tutorialChoices';
import { PanelHeader } from './PanelHeader';
import { ResearchCard } from './ResearchCard';
import { ResearchProjectDetail } from './ResearchProjectDetail';
import { ResearchTreeModal } from './ResearchTreeModal';
import { searchResearch } from './researchPresentation';
import { researchCatalog } from './researchCatalog';
import { ResearchHintCard } from './ResearchHintCard';
import { RESEARCH_FILTER_OPTIONS, type RequirementFilter } from './researchUiConfig';

interface ResearchPanelProps {
  focusProjectId?: string;
  allowedProjectId?: TutorialChoice;
  showMilestones?: boolean;
  game: GameState;
  engine: GameEngine;
  onClose(): void;
  onOpenRecipe(recipeId: string): void;
  onOpenMap?(): void;
}

function openResearchCard(id: string, focus = false) {
  const card = document.querySelector<HTMLElement>(`[data-research-id="${id}"]`);
  const archive = card?.closest('details');
  if (archive) archive.open = true;
  if (focus) card?.focus({ preventScroll: true });
}

function researchScroller(content: HTMLDivElement | null, list: HTMLDivElement | null) {
  return content && getComputedStyle(content).overflowY === 'auto' ? content : list;
}

export function LegacyResearchPanel({ focusProjectId, allowedProjectId, showMilestones = true, game, engine, onClose, onOpenRecipe, onOpenMap }: ResearchPanelProps) {
  const [treeOpen, setTreeOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [requirementFilters, setRequirementFilters] = useState<RequirementFilter[]>([]);
  const [inspectedId, setInspectedId] = useState(focusProjectId);
  const treeButton = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const browseScrollTop = useRef(0);

  const normalizedQuery = query.trim().toLowerCase();
  const { active, projects, completed } = researchCatalog(game);
  const guided = allowedProjectId !== undefined;
  const results = normalizedQuery ? searchResearch(game, query) : [];
  const listed = guided ? projects.filter(project => project.id === allowedProjectId)
    : normalizedQuery ? results.filter(project => project.id !== active?.id) : projects;
  const completedList = guided ? completed.filter(project => project.id === allowedProjectId) : completed;
  const canInspect = (id: string) => permitsTutorialChoice(allowedProjectId, id);

  useEffect(() => {
    if (!focusProjectId) return;
    const frame = requestAnimationFrame(() => openResearchCard(focusProjectId, true));
    return () => cancelAnimationFrame(frame);
  }, [focusProjectId]);

  useEffect(() => {
    if (!inspectedId) return;
    const frame = requestAnimationFrame(() => {
      const content = contentRef.current;
      if (researchScroller(content, listRef.current) === content) content?.scrollTo({ top: 0 });
    });
    return () => cancelAnimationFrame(frame);
  }, [inspectedId]);

  useEffect(() => {
    if (allowedProjectId === undefined) return;
    setQuery('');
    setRequirementFilters([]);
    setInspectedId(undefined);
  }, [allowedProjectId]);

  useEffect(() => {
    researchScroller(contentRef.current, listRef.current)?.scrollTo({ top: normalizedQuery ? 0 : browseScrollTop.current });
  }, [normalizedQuery]);

  const closeTree = () => {
    setTreeOpen(false);
    requestAnimationFrame(() => treeButton.current?.focus());
  };
  const changeQuery = (value: string) => {
    if (!normalizedQuery && value.trim()) browseScrollTop.current = researchScroller(contentRef.current, listRef.current)?.scrollTop ?? 0;
    setQuery(value);
    setInspectedId(undefined);
  };
  const inspectPrerequisite = (id: string) => {
    if (!canInspect(id)) return;
    if (normalizedQuery && !results.some(project => project.id === id)) changeQuery(getResearchProject(id)?.name ?? id);
    setInspectedId(id);
    requestAnimationFrame(() => openResearchCard(id));
  };
  const toggleProject = (id: string, keyboard: boolean) => {
    if (!canInspect(id)) return;
    const next = !guided && inspectedId === id ? undefined : id;
    setInspectedId(next);
    if (next && keyboard) requestAnimationFrame(() => {
      const detail = contentRef.current?.querySelector<HTMLElement>('[data-project-detail]');
      const action = detail?.querySelector<HTMLButtonElement>('.research-detail-action');
      (action ?? detail)?.focus({ preventScroll: true });
    });
  };
  const toggleRequirement = (id: RequirementFilter) => setRequirementFilters(current =>
    current.includes(id) ? current.filter(filter => filter !== id) : [...current, id]);
  const card = (project: ResearchProject, filters = requirementFilters) => (
    <ResearchCard key={project.id} project={project} game={game}
      disabled={!canInspect(project.id)} expanded={inspectedId === project.id}
      tutorialChoice={allowedProjectId === project.id} filters={filters} onToggle={toggleProject} />
  );
  const inspected = inspectedId && canInspect(inspectedId) ? getResearchProject(inspectedId) : undefined;

  return (
    <>
      <div className="modal-backdrop" style={treeOpen ? { display: 'none' } : undefined}>
        <Dialog panel className="modal research-modal glass" aria-label="Research projects" active={!treeOpen} modal={!guided} onDismiss={onClose}>
          <PanelHeader
            title="Research projects" onClose={onClose}
            actions={!guided && (
              <button
                ref={treeButton} type="button" className="research-tree-trigger"
                onClick={() => setTreeOpen(true)}
              >
                <span aria-hidden="true">⑂</span> Research tree
              </button>
            )}
          />
          <div className="research-layout">
            <div className="research-browser">
              {!guided && <div className="research-tools">
                <div className="research-requirement-filters" aria-label="Highlight research by requirement">
                  {RESEARCH_FILTER_OPTIONS.map(option => (
                    <button
                      type="button" key={option.id}
                      className={`research-requirement-filter ${requirementFilters.includes(option.id) ? 'selected' : ''}`}
                      aria-pressed={requirementFilters.includes(option.id)}
                      style={{ '--research-filter-color': option.color } as CSSProperties}
                      onClick={() => toggleRequirement(option.id)}
                    >
                      <i /><span>{option.label}</span>
                    </button>
                  ))}
                </div>
                <label className="research-search-field">
                  <span aria-hidden="true">⌕</span>
                  <input
                    type="search" value={query}
                    placeholder="Search research..." aria-label="Search research projects"
                    onChange={event => changeQuery(event.target.value)}
                  />
                </label>
                {normalizedQuery && (
                  <div className="research-search-summary">
                    <span role="status">{results.length} {results.length === 1 ? 'result' : 'results'}</span>
                    <button onClick={() => changeQuery('')}>Clear search</button>
                  </div>
                )}
              </div>}
              <div className="research-content" ref={contentRef}>
                <div className="research-summary-row">
                  {(!guided || active?.id === allowedProjectId) && <section className="research-active-slot" aria-label="Active project">
                    <h3>Active project</h3>
                    {active ? card(active, []) : <div className="research-active-empty">
                      <strong>No project selected</strong><span>Science is awaiting direction.</span>
                    </div>}
                  </section>}
                  {inspected && <section className="research-inspected-slot" aria-label="Selected project">
                    <h3>Selected project</h3>
                    <ResearchProjectDetail canInspect={canInspect} guided={guided} project={inspected} game={game} engine={engine}
                      onPrerequisite={inspectPrerequisite} onOpenRecipe={onOpenRecipe} onOpenMap={onOpenMap} />
                  </section>}
                  {showMilestones && <ResearchHintCard game={game} />}
                </div>
                <div className="research-sections" ref={listRef}>
                  {(!guided || listed.length > 0) && <section className="research-section" aria-label={normalizedQuery ? 'Search results' : 'Research'}>
                    <div className="research-catalog-heading">
                      <h3>{normalizedQuery ? 'Search results' : 'Research'}</h3>
                      <span className="research-catalog-key"><i /> Within reach <i /> Requires progress</span>
                    </div>
                    {listed.length > 0 && <div className="research-grid">{listed.map(project => card(project))}</div>}
                    {normalizedQuery && !results.length && <p className="research-section-empty">No matches. Try a project, material, or Core type.</p>}
                    {normalizedQuery && results.length > listed.length && <p className="research-section-empty">The active project matches your search.</p>}
                  </section>}
                  {!normalizedQuery && completedList.length > 0 && <details className="research-section research-completed" open={guided || undefined}>
                    <summary>Completed research · {completedList.length}</summary>
                    <div className="research-grid">{completedList.map(project => card(project))}</div>
                  </details>}
                </div>
              </div>
            </div>
          </div>
        </Dialog>
      </div>
      {treeOpen && (
        <ResearchTreeModal
          game={game} focusProjectId={inspectedId} onClose={closeTree}
          onInspect={id => { setTreeOpen(false); inspectPrerequisite(id); }}
        />
      )}
    </>
  );
}
