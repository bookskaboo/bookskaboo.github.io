import type { GameState, ResearchProject } from '../domain/types';
import { researchCardDetails } from './researchPresentation';
import { RESEARCH_GLYPHS, type RequirementFilter } from './researchUiConfig';

interface ResearchCardProps {
  project: ResearchProject;
  game: GameState;
  disabled: boolean;
  expanded: boolean;
  tutorialChoice: boolean;
  filters: RequirementFilter[];
  onToggle(id: string): void;
}

export function ResearchCard({ project, game, disabled, expanded, tutorialChoice, filters, onToggle }: ResearchCardProps) {
  const view = researchCardDetails(project, game);
  const matchesRequirement = filters.length === 0 || filters.includes(view.requirement);
  const className = [
    'research-card', view.active && 'active', view.complete && 'complete',
    !view.available && 'locked', view.milestone && 'milestone',
    tutorialChoice && 'tutorial-research-choice',
    filters.length > 0 && (matchesRequirement ? 'requirement-filter-match' : 'requirement-filter-muted'),
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      disabled={disabled}
      data-research-id={project.id}
      aria-label={`${project.name}: ${view.status}`}
      data-unavailable={!view.selectable}
      aria-current={view.active ? 'true' : undefined}
      aria-expanded={expanded}
      className={className}
      data-tooltip={project.name}
      data-tooltip-detail={view.tooltip}
      data-tooltip-flavor={project.flavorText}
      data-tooltip-tone={view.tooltipTone}
      onClick={() => onToggle(project.id)}
    >
      <span className="research-card-icon" aria-hidden="true">{view.complete ? '✓' : RESEARCH_GLYPHS[project.id] ?? '◇'}</span>
      <small className="research-card-name">{project.name}</small>
      <span className="research-card-status">{view.status}</span>
      {(view.section === 'available' || view.section === 'active') && <span className="research-card-cost">{view.costSummary}</span>}
    </button>
  );
}
