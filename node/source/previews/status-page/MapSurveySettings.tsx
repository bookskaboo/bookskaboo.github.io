import { useState } from 'react';
import { STAGES } from './model';
import { MAP_SURVEYS, defaultSurveyPrices, type SurveyPrices } from './mapUpgrades';

export function MapSurveySettings({ prices, onApply }: { prices: SurveyPrices; onApply(prices: SurveyPrices): void }) {
  const [draft, setDraft] = useState(prices);
  const valid = MAP_SURVEYS.every(survey => Number.isInteger(draft[survey.id]) && draft[survey.id] >= 1 && draft[survey.id] <= 50);
  return <details className="map-survey-settings"><summary>Adjust survey prices</summary><form onSubmit={event => { event.preventDefault(); if (valid) onApply({ ...draft }); }}>
    <p>Each price is the amount of every Core tier from Simple through the named tier. Applying resets this example and its research queue.</p>
    <div className="map-price-grid">{MAP_SURVEYS.map(survey => <label key={survey.id}><span>{survey.name}<small>Each Core through {STAGES[survey.tier].label}</small></span><input type="number" min="1" max="50" step="1" required aria-label={`${survey.name} price`} value={draft[survey.id] || ''} onChange={event => setDraft(current => ({ ...current, [survey.id]: Number(event.target.value) }))} /></label>)}</div>
    <div className="map-price-actions"><button type="submit" disabled={!valid}>Apply prices and reset example</button><button type="button" onClick={() => { const defaults = defaultSurveyPrices(); setDraft(defaults); onApply(defaults); }}>Restore five-per-Core prices</button></div>
  </form></details>;
}
