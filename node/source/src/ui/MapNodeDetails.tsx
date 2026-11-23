import { useEffect, useState } from 'react';
import { PALETTE as TERRAIN_PALETTE } from '../art/mapTerrainArt';
import { mapBorderPointsOfInterest } from './MapBorderObstructions';
import { ITEM_NAMES } from '../content/items';
import { NAMES as TERRAIN_NAMES } from '../domain/mapTerrain';
import { revealedMapTerrain } from '../simulation/mapTerrain';
import type { GameState, ItemId } from '../domain/types';
import type { GameEngine } from '../simulation/engine';
import { mapNodeName, mapNodePosition, mapNodeSurvey } from './mapNodePresentation';
import { permitsTutorialChoice, type TutorialChoice } from '../tutorials/tutorialChoices';
import { MaterialIcon } from './MaterialIcon';
import { destinationMapCosts, isMapFrontier, pendingMapPayment, mapPurchaseProtected } from '../simulation/mapExpansion';

/** Inspection and actions for the expanded state of the minimap. */
export function MapNodeDetails({ game, engine, selectedId, cornerName, allowedSectorId, onActivate, borderPointsOfInterest }: {
  game: GameState; engine: GameEngine; selectedId: string | null;
  cornerName?: string; allowedSectorId?: TutorialChoice; onActivate(): void;
  borderPointsOfInterest?: Array<{ name: string }>;
}) {
  const displayId = selectedId ?? game.activeSectorId;
  const selected = game.sectors[displayId];
  const terrain = revealedMapTerrain(game, displayId);
  const [selectedX, selectedY] = displayId.split(',').map(Number);
  const selectedUnlocked = Boolean(selected?.unlocked);
  const selectedActive = displayId === game.activeSectorId;
  const selectedAdjacent = Boolean(selectedId) && isMapFrontier(game, selectedX, selectedY);
  const hasPoint = game.research.mapPoints > 0 && !mapPurchaseProtected(game,displayId);
  const price = selectedAdjacent && !hasPoint ? destinationMapCosts(game, selectedX, selectedY) : undefined;
  const quoted = game.research.mapNodeQuote?.destination === selectedId;
  const funding = quoted && game.research.selected === 'mapNode';
  const anotherPayment = !quoted && pendingMapPayment(game);
  const action = !selectedId ? 'Select a node' : selectedActive ? 'Current node' : selectedUnlocked ? 'Travel to node'
    : !selectedAdjacent ? 'Locked' : hasPoint ? 'Activate node · 1 point' : !price ? 'Need 1 Map Point'
    : funding ? 'Research in progress' : anotherPayment ? 'Another map has a payment' : quoted ? 'Resume research' : 'Start research';
  const selectedName = selected ? mapNodeName(selected) : '';
  const [draftName, setDraftName] = useState(selectedName);
  const [draftLabel, setDraftLabel] = useState(selected?.label ?? '');
  useEffect(() => { setDraftName(selectedName); setDraftLabel(selected?.label ?? ''); }, [selectedId, selected?.label, selectedName]);
  const { explored, resources, obstructions } = mapNodeSurvey(game, displayId);
  const pointsOfInterest: Array<{ name: string; count?: number }> = [
    ...(explored ? obstructions : cornerName ? [{ name: cornerName }] : []),
    ...(borderPointsOfInterest ?? mapBorderPointsOfInterest(game, displayId)),
  ];
  return <div className="map-info">
    <div className="map-info-scroll">
      <div className="map-coordinates"><b>{mapNodePosition(selectedX, selectedY)}</b></div>
      {selectedId && explored && <div className="map-node-editor">
        <label>Node name<input disabled={allowedSectorId !== undefined} value={draftName} maxLength={30} onChange={(event) => setDraftName(event.target.value)} /></label>
        <label>Map label<input disabled={allowedSectorId !== undefined} value={draftLabel} maxLength={3} onChange={(event) => setDraftLabel(event.target.value.toUpperCase())} /></label>
        <button disabled={allowedSectorId !== undefined || draftName.trim() === selectedName && draftLabel.trim().toUpperCase() === selected.label} onClick={() => engine.renameSector(draftName, draftLabel, selectedId)}>Save name</button>
      </div>}
      {cornerName && !selectedUnlocked && <p className="map-unexplored">Location revealed. Reach it through adjacent maps; ordinary expansion costs still apply.</p>}
      <hr />
      {price && <section className="map-survey-list" aria-label="Core cost">
        <h3>Core cost</h3>
        <ul>{Object.entries(price).map(([key, amount]) => {
          const item = key as ItemId;
          return <li key={item}><MaterialIcon item={item} /><span>{ITEM_NAMES[item]}</span><b>{amount}</b></li>;
        })}</ul>
      </section>}
      {terrain && <section className="map-survey-list" aria-label="Terrain"><h3 style={{ color: TERRAIN_PALETTE[terrain].accent }}>Terrain: {TERRAIN_NAMES[terrain]}</h3></section>}
      {explored ? (
        <section className="map-survey-list" aria-label="Resources">
          <h3>Resources</h3>
          {resources.length ? <ul>{resources.map(({ item, remaining }) => <li key={item}>
            <MaterialIcon item={item} />
            <span>{ITEM_NAMES[item]}</span><b>{Math.floor(remaining).toLocaleString()}</b>
          </li>)}</ul> : <p>No mapped resources. A scenic investment.</p>}
        </section>
      ) : <p className="map-unexplored">Map Node Unexplored</p>}
      {(explored || cornerName || pointsOfInterest.length > 0) && (
        <section className="map-survey-list map-obstruction-list" aria-label="Points of Interest">
          <h3>Points of Interest</h3>
          {pointsOfInterest.length ? <ul>{pointsOfInterest.map(({ name, count }) => <li key={name}><span>{name}</span>{count !== undefined && <b>{count}</b>}</li>)}</ul> : <p>None. A rare lack of complications.</p>}
        </section>
      )}
    </div>
    <div className="map-action-footer">
      <div className="map-points"><span>Map Points</span><b>{game.research.mapPoints}</b></div>
      <button className="map-primary-action" disabled={!selectedId || !permitsTutorialChoice(allowedSectorId, selectedId) || selectedActive || (!selectedUnlocked && (!selectedAdjacent || (!hasPoint && (!price || funding || anotherPayment))))} onClick={onActivate}>
        {action}
      </button>
    </div>
  </div>;
}
