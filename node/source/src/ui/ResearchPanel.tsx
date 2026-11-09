import { useEffect, useRef, useState, type CSSProperties } from 'react';
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
import { getResearchMilestones } from './researchMilestones';
import { RESEARCH_FILTER_OPTIONS, type RequirementFilter } from './researchUiConfig';

const MILESTONES_HEADING = 'Obligatory hand holding';

interface ResearchPanelProps {
  focusProjectId?: string;
  allowedProjectId?: TutorialChoice;
  showMilestones?: boolean;
  game: GameState;
  engine: GameEngine;
  onClose(): void;
  onOpenRecipe(recipeId: string): void;
}

function revealResearchElement(selector: string, block: ScrollLogicalPosition, focus = false) {
  const target = document.querySelector<HTMLElement>(selector);
  const archive = target?.closest('details');
  if (archive) archive.open = true;
  target?.scrollIntoView({ block });
  if (focus) target?.focus({ preventScroll: true });
}

export function ResearchPanel({ focusProjectId, allowedProjectId, showMilestones = true, game, engine, onClose, onOpenRecipe }: ResearchPanelProps) {
  const [treeOpen, setTreeOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [requirementFilters, setRequirementFilters] = useState<RequirementFilter[]>([]);
  const [inspectedId, setInspectedId] = useState(focusProjectId);
  const treeButton = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const browseScrollTop = useRef(0);

  const normalizedQuery = query.trim().toLowerCase();
  const { active, projects, completed } = researchCatalog(game);
  const results = normalizedQuery ? searchResearch(game, query) : [];
  const listed = normalizedQuery ? results.filter(project => project.id !== active?.id) : projects;
  const canInspect = (id: string) => permitsTutorialChoice(allowedProjectId, id);

  useEffect(() => {
    if (!focusProjectId) return;
    const frame = requestAnimationFrame(() => revealResearchElement(`[data-research-id="${focusProjectId}"]`, 'center', true));
    return () => cancelAnimationFrame(frame);
  }, [focusProjectId]);

  useEffect(() => {
    if (!inspectedId) return;
    const frame = requestAnimationFrame(() => revealResearchElement(`[data-project-detail="${inspectedId}"]`, 'nearest'));
    return () => cancelAnimationFrame(frame);
  }, [inspectedId, game.research.selected, game.research.completed.length]);

  useEffect(() => {
    if (allowedProjectId === undefined) return;
    setQuery('');
    setRequirementFilters([]);
    setInspectedId(allowedProjectId ?? undefined);
  }, [allowedProjectId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: normalizedQuery ? 0 : browseScrollTop.current });
  }, [normalizedQuery]);

  const closeTree = () => {
    setTreeOpen(false);
    requestAnimationFrame(() => treeButton.current?.focus());
  };
  const changeQuery = (value: string) => {
    if (!normalizedQuery && value.trim()) browseScrollTop.current = listRef.current?.scrollTop ?? 0;
    setQuery(value);
    setInspectedId(undefined);
  };
  const inspectPrerequisite = (id: string) => {
    if (!canInspect(id)) return;
    if (normalizedQuery && !results.some(project => project.id === id)) changeQuery(getResearchProject(id)?.name ?? id);
    setInspectedId(id);
    requestAnimationFrame(() => revealResearchElement(`[data-research-id="${id}"]`, 'center'));
  };
  const toggleProject = (id: string) => setInspectedId(current => current === id ? undefined : id);
  const toggleRequirement = (id: RequirementFilter) => setRequirementFilters(current =>
    current.includes(id) ? current.filter(filter => filter !== id) : [...current, id]);
  const card = (project: ResearchProject, filters = requirementFilters) => (
    <ResearchCard key={project.id} project={project} game={game}
      disabled={!canInspect(project.id)} expanded={inspectedId === project.id}
      tutorialChoice={allowedProjectId === project.id} filters={filters} onToggle={toggleProject} />
  );
  const inspected = inspectedId && canInspect(inspectedId) ? getResearchProject(inspectedId) : undefined;
  const archived = !normalizedQuery && completed.some(project => project.id === inspectedId);
  const detail = inspected && (
    <ResearchProjectDetail canInspect={canInspect} project={inspected} game={game} engine={engine}
      onPrerequisite={inspectPrerequisite} onOpenRecipe={onOpenRecipe} />
  );

  return (
    <>
      <div className="modal-backdrop" style={treeOpen ? { display: 'none' } : undefined}>
        <section className="modal research-modal glass">
          <PanelHeader
            title="Research projects" onClose={onClose}
            actions={(
              <button
                ref={treeButton} type="button" className="research-tree-trigger"
                disabled={allowedProjectId !== undefined} onClick={() => setTreeOpen(true)}
              >
                <span aria-hidden="true">⑂</span> Research tree
              </button>
            )}
          />
          <div className="research-layout">
            <div className="research-browser">
              <div className="research-tools">
                <div className="research-requirement-filters" aria-label="Highlight research by requirement">
                  {RESEARCH_FILTER_OPTIONS.map(option => (
                    <button
                      type="button" key={option.id} disabled={allowedProjectId !== undefined}
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
                    disabled={allowedProjectId !== undefined} type="search" value={query}
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
              </div>
              <div className="research-sections" ref={listRef}>
                <div className="research-summary-row">
                  <section className="research-active-slot" aria-label="Active project">
                    <h3>Active project</h3>
                    {active ? card(active, []) : <div className="research-active-empty">
                      <strong>No project selected</strong><span>Science is awaiting direction.</span>
                    </div>}
                  </section>
                  {showMilestones && <section className="research-next-slot" aria-label={MILESTONES_HEADING}>
                    <h3>{MILESTONES_HEADING}</h3>
                    <ul className="research-milestone-grid">
                      {getResearchMilestones(game).map((milestone, index) => (
                        <li className="research-milestone" key={milestone.title}>
                          <small>{index === 0 ? 'Recommended' : 'Also useful'}</small>
                          <strong>{milestone.title}</strong>
                          <span>{milestone.detail}</span>
                        </li>
                      ))}
                    </ul>
                  </section>}
                </div>
                {!archived && detail}
                <section className="research-section" aria-label={normalizedQuery ? 'Search results' : 'Research'}>
                  <div className="research-catalog-heading">
                    <h3>{normalizedQuery ? 'Search results' : 'Research'}</h3>
                    <span className="research-catalog-key"><i /> Within reach <i /> Requires progress</span>
                  </div>
                  {listed.length > 0 && <div className="research-grid">{listed.map(project => card(project))}</div>}
                  {normalizedQuery && !results.length && <p className="research-section-empty">No matches. Try a project, material, or Core type.</p>}
                  {normalizedQuery && results.length > listed.length && <p className="research-section-empty">The active project matches your search.</p>}
                </section>
                {!normalizedQuery && completed.length > 0 && <details className="research-section research-completed">
                  <summary>Completed research · {completed.length}</summary>
                  {archived && detail}
                  <div className="research-grid">{completed.map(project => card(project))}</div>
                </details>}
              </div>
            </div>
          </div>
        </section>
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
