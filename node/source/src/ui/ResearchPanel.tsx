import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { getResearchProject } from '../content/research';
import type { GameState } from '../domain/types';
import type { GameEngine } from '../simulation/engine';
import { permitsTutorialChoice, type TutorialChoice } from '../tutorials/tutorialChoices';
import { PanelHeader } from './PanelHeader';
import { ResearchCard } from './ResearchCard';
import { ResearchProjectDetail } from './ResearchProjectDetail';
import { ResearchTreeModal } from './ResearchTreeModal';
import { groupResearch, searchResearch } from './researchPresentation';
import { RESEARCH_FILTER_OPTIONS, RESEARCH_SECTIONS, type RequirementFilter, type ResearchBrowserSection } from './researchUiConfig';

interface ResearchPanelProps {
  focusProjectId?: string;
  allowedProjectId?: TutorialChoice;
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

export function ResearchPanel({ focusProjectId, allowedProjectId, game, engine, onClose, onOpenRecipe }: ResearchPanelProps) {
  const [treeOpen, setTreeOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [requirementFilters, setRequirementFilters] = useState<RequirementFilter[]>([]);
  const [inspectedId, setInspectedId] = useState<string | undefined>(focusProjectId ?? game.research.selected);
  const treeButton = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const browseScrollTop = useRef(0);

  const normalizedQuery = query.trim().toLowerCase();
  const groups = groupResearch(game);
  const results = normalizedQuery ? searchResearch(game, query) : [];
  const sections: ResearchBrowserSection[] = normalizedQuery
    ? ['search'] : ['active', 'milestones', 'available', 'future', 'completed'];
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

  const renderSection = (section: ResearchBrowserSection) => {
    const copy = RESEARCH_SECTIONS[section];
    const entries = section === 'search' ? results : groups[section];
    const inspected = entries.find(project => project.id === inspectedId && canInspect(project.id));
    const detail = inspected && (
      <ResearchProjectDetail
        canInspect={canInspect} project={inspected} game={game} engine={engine}
        onPrerequisite={inspectPrerequisite} onOpenRecipe={onOpenRecipe}
      />
    );
    const cards = (
      <div className="research-grid">
        {entries.map(project => (
          <ResearchCard
            key={project.id} project={project} game={game}
            disabled={!canInspect(project.id)} expanded={inspectedId === project.id}
            tutorialChoice={allowedProjectId === project.id} filters={requirementFilters}
            onToggle={toggleProject}
          />
        ))}
      </div>
    );
    if (section === 'completed') {
      return (
        <details className="research-section research-completed" key={section}>
          <summary>{copy.name} · {entries.length}</summary>
          <p>{copy.description}</p>
          {cards}{detail}
        </details>
      );
    }
    return (
      <section className="research-section" key={section} aria-label={copy.name}>
        <h3>{copy.name} <small>{entries.length}</small></h3>
        <p>{copy.description}</p>
        {detail}
        {entries.length ? cards : <p className="research-section-empty">{copy.empty}</p>}
      </section>
    );
  };

  return (
    <>
      <div className="modal-backdrop" style={treeOpen ? { display: 'none' } : undefined}>
        <section className="modal research-modal glass">
          <PanelHeader
            eyebrow="RESEARCH" title="Research projects" onClose={onClose}
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
              <div className="research-sections" ref={listRef}>{sections.map(renderSection)}</div>
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
