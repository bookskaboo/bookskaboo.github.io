import { useState } from 'react';
import { BUILDABLE_NODES, isNodeUnlocked } from '../content/nodes';
import { getResearchProject, RESEARCH_PROJECTS } from '../content/research';
import type { GameState, NodeKind } from '../domain/types';
import { NodeIcon } from './NodeIcon';
import { researchEventProject } from './unlockNavigation';
import { DEFERRED_POWER_RESEARCH } from '../content/deferredPower';

function JournalTime({ elapsedMs }: { elapsedMs?: number }) {
  if (elapsedMs === undefined || !Number.isFinite(elapsedMs) || elapsedMs < 0) {
    return <small>Time not recorded</small>;
  }
  const hundredths = Math.round(elapsedMs / 10);
  const minutes = Math.floor(hundredths / 6000);
  const seconds = String(Math.floor(hundredths / 100) % 60).padStart(2, '0');
  const fraction = String(hundredths % 100).padStart(2, '0');
  return <time className="discovery-time" dateTime={`PT${minutes}M${seconds}.${fraction}S`} title="Elapsed game time">
    {minutes}:{seconds}.{fraction}
  </time>;
}

// Adapted from the original Discovery Journal in Node Game/app/page.tsx:
// discovered node count, category filters, newest discoveries, achievements.
export function DiscoveryJournal({ game, onClose, onOpen }: { game: GameState; onClose(): void; onOpen(projectId: string, nodeKind?: NodeKind): void }) {
  const [category, setCategory] = useState('All');
  const categories = ['All', 'Production', 'Logistics', 'Storage', 'Research', 'Achievements'];
  const nodeCategory = (value: string) => value === 'Logistics' || value === 'Storage' ? value : 'Production';
  const logs = [...(game.researchLog ?? []), ...game.events.filter(event => event.type === 'ResearchCompleted')]
    .filter((event, index, all) => !DEFERRED_POWER_RESEARCH.has(researchEventProject(event) ?? '') && all.findIndex(other => other.id === event.id) === index)
    .sort((a, b) => (b.elapsedMs ?? -1) - (a.elapsedMs ?? -1) || b.at - a.at);
  const logged = new Set(logs.map(researchEventProject));
  const olderProjects = RESEARCH_PROJECTS.filter(project => game.research.completed.includes(project.id) && !logged.has(project.id));
  const firstCompletion = new Map<string, number>();
  // The log is newest first, so the final value for a project is its earliest recorded completion.
  for (const event of logs) {
    const projectId = researchEventProject(event);
    if (projectId && event.elapsedMs !== undefined) firstCompletion.set(projectId, event.elapsedMs);
  }
  const nodes = BUILDABLE_NODES.filter(node => isNodeUnlocked(node.kind, game.research.unlocked))
    .map(node => ({
      node,
      elapsedMs: game.discoveryTimes?.[node.kind] ?? (node.unlockResearch ? firstCompletion.get(node.unlockResearch) : 0),
    }))
    .sort((a, b) => (b.elapsedMs ?? -1) - (a.elapsedMs ?? -1));
  const shownNodes = nodes.filter(({ node }) => category === 'All' || nodeCategory(node.category) === category);
  const showResearch = category === 'All' || category === 'Research';
  const showAchievements = category === 'All' || category === 'Achievements';
  return <div className="modal-backdrop"><section className="modal journal-modal glass discovery-journal" aria-label="Discovery Journal">
    <header className="panel-header"><div><small>DISCOVERIES</small><h2>Discovery Journal</h2></div><button aria-label="Close journal" onClick={onClose}>×</button></header>
    <p className="discovery-intro">A record of discoveries. Memory has other commitments.</p>
    <div className="discovery-summary">Discovered nodes <b>{nodes.length} / {BUILDABLE_NODES.length}</b></div>
    <div className="category-tabs" role="group" aria-label="Filter journal by category">{categories.map(name => <button key={name} aria-pressed={category === name} className={category === name ? 'active' : ''} onClick={() => setCategory(name)}>{name}</button>)}</div>
    <div className="discovery-list">
      {shownNodes.map(({ node, elapsedMs }) => (
        <article className="discovery-entry" key={node.kind}>
          <i><NodeIcon kind={node.kind} completedResearch={game.research.completed} /></i>
          <div>
            <small>{nodeCategory(node.category)}</small>
            <h3>{node.name}</h3>
            <p>{node.description}</p>
            {node.unlockResearch && <small>{getResearchProject(node.unlockResearch)?.name}</small>}
          </div>
          <div className="discovery-entry-actions">
            <JournalTime elapsedMs={elapsedMs} />
            {node.unlockResearch && <button onClick={() => onOpen(node.unlockResearch!, node.kind)}>View unlock →</button>}
          </div>
        </article>
      ))}
      {showResearch && logs.map(event => {
        const project = researchEventProject(event);
        return <article className="discovery-entry" key={event.id}>
          <i>⌁</i>
          <div><small>Research completed</small><h3>{getResearchProject(project)?.name ?? 'Research'}</h3><p>{getResearchProject(project)?.unlock ?? event.message}</p></div>
          <div className="discovery-entry-actions">
            <JournalTime elapsedMs={event.elapsedMs} />
            {project && <button onClick={() => onOpen(project)}>View unlock →</button>}
          </div>
        </article>;
      })}
      {showResearch && olderProjects.map(project => (
        <article className="discovery-entry" key={project.id}>
          <i>✓</i>
          <div><small>Previously completed</small><h3>{project.name}</h3><p>{project.unlock}</p></div>
          <div className="discovery-entry-actions">
            <JournalTime />
            <button onClick={() => onOpen(project.id)}>View unlock →</button>
          </div>
        </article>
      ))}
      {showAchievements && game.achievements.map(id => (
        <article className="discovery-entry" key={id}>
          <i>★</i>
          <div>
            <small>Achievement unlocked</small>
            <h3>{id === 'oops' ? 'Oops.' : id.replace(/[-_]/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase())}</h3>
            {id === 'destructive-testing' && <><p>Trigger the Iron, Copper and Stone emergency rescues in one world.</p><small>Thank you. We have enough data.</small></>}
            {id === 'oops' && <><p>Create a Big Hole by rapidly clicking an empty part of the field.</p><small>The ground has filed a complaint.</small></>}
          </div>
          <div className="discovery-entry-actions"><JournalTime elapsedMs={game.achievementTimes?.[id]} /></div>
        </article>
      ))}
      {((category === 'Achievements' && !game.achievements.length) || (category === 'Research' && !logs.length && !olderProjects.length) || (!['Research', 'Achievements'].includes(category) && !shownNodes.length)) && <p className="empty-state">No discoveries here yet. A pristine record.</p>}
    </div>
  </section></div>;
}
