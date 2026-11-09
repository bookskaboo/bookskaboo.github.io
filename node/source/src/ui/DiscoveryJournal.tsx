import { useState } from 'react';
import { BUILDABLE_NODES, isNodeUnlocked } from '../content/nodes';
import { getResearchProject, RESEARCH_PROJECTS } from '../content/research';
import type { GameState, NodeKind } from '../domain/types';
import { NodeIcon } from './NodeIcon';
import { researchEventProject } from './unlockNavigation';
import { DEFERRED_POWER_RESEARCH } from '../content/deferredPower';

const categories = ['All', 'Production', 'Logistics', 'Storage', 'Research', 'Achievements'] as const;
type JournalCategory = typeof categories[number];
type JournalEntry = {
  key: string;
  category: Exclude<JournalCategory, 'All'>;
  label: string;
  title: string;
  description?: string;
  note?: string;
  elapsedMs?: number;
  at?: number;
  glyph?: string;
  nodeKind?: NodeKind;
  projectId?: string;
};

const recordedTime = (ms: number | undefined) => ms !== undefined && Number.isFinite(ms) && ms >= 0 ? ms : undefined;

function JournalTime({ elapsedMs }: { elapsedMs?: number }) {
  const time = recordedTime(elapsedMs);
  if (time === undefined) return <small>Time not recorded</small>;
  const hundredths = Math.round(time / 10);
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
  const [category, setCategory] = useState<JournalCategory>('All');
  const logs = [...(game.researchLog ?? []), ...game.events.filter(event => event.type === 'ResearchCompleted')]
    .filter((event, index, all) => !DEFERRED_POWER_RESEARCH.has(researchEventProject(event) ?? '') && all.findIndex(other => other.id === event.id) === index);
  const logged = new Set(logs.map(researchEventProject));
  const olderProjects = RESEARCH_PROJECTS.filter(project => game.research.completed.includes(project.id) && !logged.has(project.id));
  const firstCompletion = new Map<string, number>();
  for (const event of logs) {
    const projectId = researchEventProject(event);
    const time = recordedTime(event.elapsedMs);
    if (projectId && time !== undefined) {
      firstCompletion.set(projectId, Math.min(firstCompletion.get(projectId) ?? time, time));
    }
  }
  const nodes = BUILDABLE_NODES.filter(node => isNodeUnlocked(node.kind, game.research.unlocked));
  const entries = [
    ...nodes.map((node): JournalEntry => {
      const group = node.category === 'Logistics' || node.category === 'Storage' ? node.category : 'Production';
      return {
        key: `node:${node.kind}`, category: group, label: group, title: node.name,
        description: node.description, note: getResearchProject(node.unlockResearch)?.name,
        nodeKind: node.kind, projectId: node.unlockResearch,
        elapsedMs: game.discoveryTimes?.[node.kind] ?? (node.unlockResearch ? firstCompletion.get(node.unlockResearch) : 0),
      };
    }),
    ...logs.map((event): JournalEntry => {
      const projectId = researchEventProject(event);
      const project = getResearchProject(projectId);
      return {
        key: `event:${event.id}`, category: 'Research', label: 'Research completed', glyph: '⌁',
        title: project?.name ?? 'Research', description: project?.unlock ?? event.message,
        elapsedMs: event.elapsedMs, at: event.at, projectId,
      };
    }),
    ...olderProjects.map((project): JournalEntry => ({
      key: `research:${project.id}`, category: 'Research', label: 'Previously completed', glyph: '✓',
      title: project.name, description: project.unlock, projectId: project.id,
    })),
    ...game.achievements.map((id): JournalEntry => ({
      key: `achievement:${id}`, category: 'Achievements', label: 'Achievement unlocked', glyph: '★',
      title: id === 'oops' ? 'Oops.' : id.replace(/[-_]/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase()),
      description: id === 'oops' ? 'Create a Big Hole by rapidly clicking an empty part of the field.' : id === 'destructive-testing' ? 'Trigger the Iron, Copper and Stone emergency rescues in one world.' : undefined,
      note: id === 'oops' ? 'The ground has filed a complaint.' : id === 'destructive-testing' ? 'Thank you. We have enough data.' : undefined,
      elapsedMs: game.achievementTimes?.[id],
    })),
  ].filter(entry => category === 'All' || entry.category === category)
    .sort((a, b) => (recordedTime(b.elapsedMs) ?? -1) - (recordedTime(a.elapsedMs) ?? -1) || (b.at ?? 0) - (a.at ?? 0));

  return <div className="modal-backdrop"><section className="modal journal-modal glass discovery-journal" aria-label="Discovery Journal">
    <header className="panel-header"><div><h2>Discovery Journal</h2></div><button aria-label="Close journal" onClick={onClose}>×</button></header>
    <p className="discovery-intro">A record of discoveries. Memory has other commitments.</p>
    <div className="discovery-summary">Discovered nodes <b>{nodes.length} / {BUILDABLE_NODES.length}</b></div>
    <div className="category-tabs" role="group" aria-label="Filter journal by category">{categories.map(name => <button key={name} aria-pressed={category === name} className={category === name ? 'active' : ''} onClick={() => setCategory(name)}>{name}</button>)}</div>
    <div className="discovery-list">
      {entries.map(({ key, label, title, description, note, glyph, elapsedMs, nodeKind, projectId }) => (
        <article className="discovery-entry" key={key}>
          <i>{nodeKind ? <NodeIcon kind={nodeKind} completedResearch={game.research.completed} /> : glyph}</i>
          <div>
            <small>{label}</small>
            <h3>{title}</h3>
            {description && <p>{description}</p>}
            {note && <small>{note}</small>}
          </div>
          <div className="discovery-entry-actions">
            <JournalTime elapsedMs={elapsedMs} />
            {projectId && <button onClick={() => onOpen(projectId, nodeKind)}>View unlock →</button>}
          </div>
        </article>
      ))}
      {!entries.length && <p className="empty-state">No discoveries here yet. A pristine record.</p>}
    </div>
  </section></div>;
}
