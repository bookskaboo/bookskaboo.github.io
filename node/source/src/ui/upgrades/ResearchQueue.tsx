import { RESEARCH_QUEUE_LIMIT } from '../../content/researchQueue';
import { getResearchProject } from '../../content/research';
import type { GameState } from '../../domain/types';
import type { GameEngine } from '../../simulation/engine';
import { RESEARCH_GLYPHS } from '../researchUiConfig';
import { researchProgress } from '../researchProgress';

export function ResearchQueue({ game, engine, message, practice = false }: { game: GameState; engine: GameEngine; message: string; practice?: boolean }) {
  const queue = game.research.queue ?? [];
  const active = getResearchProject(game.research.selected);
  const status = practice && game.research.completed.includes('assembler') ? 'Assembler research complete.'
    : game.research.paused ? 'Research paused.'
    : !active && !queue.length ? 'Select a card and press Queue research, or double-click a card.'
    : game.paused ? 'Factory paused.' : active ? researchProgress(active, game).status : 'Waiting for prerequisites.';
  const limit = practice ? 1 : RESEARCH_QUEUE_LIMIT;
  return <section id="research-queue-panel" className={`research-queue${practice ? ' single-project-practice' : ''}`} aria-label="Research queue">
    <header><h3>Research queue</h3><span>{queue.length}/{limit}</span></header>
    <p id="research-queue-instructions" className="queue-message" role="status">{message || status}</p>
    <div className="research-queue-slots">{Array.from({ length: limit }, (_, index) => {
      const project = getResearchProject(queue[index]);
      if (!project) return <div className="research-queue-empty" key={index} aria-label={`Queue slot ${index + 1} empty`}><span>{index + 1}</span><small>Empty</small></div>;
      const progress = researchProgress(project, game);
      const paid = progress.rows.reduce((sum, row) => sum + row.researched, 0);
      const total = progress.rows.reduce((sum, row) => sum + row.required, 0);
      return <div className={`research-queue-slot${progress.active ? ' active' : ''}`} key={project.id} data-queue-project={project.id}>
        <div className="queue-project-card"><span className="queue-project-icon" aria-hidden="true">{RESEARCH_GLYPHS[project.id] ?? '◇'}</span><span>{project.name}</span>
          {progress.active && <progress aria-label={`${project.name} Core payments`} value={paid} max={total || 1} />}
        </div>
        <button className="queue-remove" disabled={practice} aria-label={`Remove ${project.name} from queue`} onClick={() => engine.removeQueuedResearch(project.id)}>×</button>
        <div className="queue-slot-meta"><span>{index + 1} · {progress.active ? 'Active' : 'Queued'}</span><span>{paid}/{total}</span></div>
      </div>;
    })}</div>
  </section>;
}
