import { useEffect, useState } from 'react';
import { ITEM_NAMES } from '../content/items';
import type { GameState } from '../domain/types';
import type { GameEngine } from '../simulation/engine';
import { mapNodeName, mapNodePosition, mapNodeSurvey } from './mapNodePresentation';
import { permitsTutorialChoice, type TutorialChoice } from '../tutorials/tutorialChoices';
import { MaterialIcon } from './MaterialIcon';

/** Inspection and actions for the expanded state of the minimap. */
export function MapNodeDetails({ game, engine, selectedId, cornerName, allowedSectorId, onActivate }: {
  game: GameState; engine: GameEngine; selectedId: string | null;
  cornerName?: string; allowedSectorId?: TutorialChoice; onActivate(): void;
}) {
  const displayId = selectedId ?? game.activeSectorId;
  const selected = game.sectors[displayId];
  const [selectedX, selectedY] = displayId.split(',').map(Number);
  const selectedUnlocked = Boolean(selected?.unlocked);
  const selectedActive = displayId === game.activeSectorId;
  const selectedAdjacent = Boolean(selectedId) && !selectedUnlocked && Object.values(game.sectors).some((candidate) => candidate.unlocked && Math.abs(candidate.x - selectedX) + Math.abs(candidate.y - selectedY) === 1);
  const selectedName = selected ? mapNodeName(selected) : '';
  const [draftName, setDraftName] = useState(selectedName);
  const [draftLabel, setDraftLabel] = useState(selected?.label ?? '');
  useEffect(() => { setDraftName(selectedName); setDraftLabel(selected?.label ?? ''); }, [selectedId, selected?.label, selectedName]);
  const { explored, resources, obstructions } = mapNodeSurvey(game, displayId);
  const pointsOfInterest = explored ? obstructions : cornerName ? [{ name: cornerName, count: undefined }] : [];
  return <div className="map-info">
    <div className="map-info-scroll">
      <div className="map-coordinates"><b>{mapNodePosition(selectedX, selectedY)}</b></div>
      {selectedId && explored && <div className="map-node-editor">
        <label>Node name<input disabled={allowedSectorId !== undefined} value={draftName} maxLength={30} onChange={(event) => setDraftName(event.target.value)} /></label>
        <label>Map label<input disabled={allowedSectorId !== undefined} value={draftLabel} maxLength={3} onChange={(event) => setDraftLabel(event.target.value.toUpperCase())} /></label>
        <button disabled={allowedSectorId !== undefined || draftName.trim() === selectedName && draftLabel.trim().toUpperCase() === selected.label} onClick={() => engine.renameSector(draftName, draftLabel, selectedId)}>Save name</button>
      </div>}
      <hr />
      {explored ? (
        <section className="map-survey-list" aria-label="Resources">
          <h3>Resources</h3>
          {resources.length ? <ul>{resources.map(({ item, remaining }) => <li key={item}>
            <MaterialIcon item={item} />
            <span>{ITEM_NAMES[item]}</span><b>{Math.floor(remaining).toLocaleString()}</b>
          </li>)}</ul> : <p>No mapped resources. A scenic investment.</p>}
        </section>
      ) : <p className="map-unexplored">Map Node Unexplored</p>}
      {(explored || cornerName) && (
        <section className="map-survey-list map-obstruction-list" aria-label="Points of Interest">
          <h3>Points of Interest</h3>
          {pointsOfInterest.length ? <ul>{pointsOfInterest.map(({ name, count }) => <li key={name}><span>{name}</span>{count !== undefined && <b>{count}</b>}</li>)}</ul> : <p>None. A rare lack of complications.</p>}
        </section>
      )}
    </div>
    <div className="map-action-footer">
      <div className="map-points"><span>Map Points</span><b>{game.research.mapPoints}</b></div>
      <button className="map-primary-action" disabled={!selectedId || !permitsTutorialChoice(allowedSectorId, selectedId) || selectedActive || (!selectedUnlocked && (!selectedAdjacent || game.research.mapPoints < 1))} onClick={onActivate}>
        {!selectedId ? 'Select a node' : selectedActive ? 'Current node' : selectedUnlocked ? 'Travel to node' : selectedAdjacent && game.research.mapPoints > 0 ? 'Activate node · 1 point' : selectedAdjacent ? 'Need 1 Map Point' : 'Locked'}
      </button>
    </div>
  </div>;
}
