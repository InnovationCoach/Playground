// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import { simulate, gridCells, hexKey } from '../src/features/activities/hexGrid/hexGridModel.js';
import { THALASSA_STATION as S, scenarioCity, scenarioById, evaluateChallenges } from '../src/features/activities/hexGrid/scenarios.js';
import { SCENARIO_INFO } from '../src/features/activities/hexGrid/scenarioInfo.js';
import { projectStorage, DEFAULT_PROJECT_ID } from '../src/features/activities/hexGrid/useHexGridProject.js';
import { ScenarioPanel } from '../src/features/activities/hexGrid/ScenarioPanel.jsx';
import { WIND_SURVEY_RESULT } from '../src/features/universe/missions/thalassaWindSurvey.js';

/** A design found by search that meets every goal, but only with wind data from the survey. */
function provenDesign(windCapacityFactor) {
  const fixed = { '0,0': { type: 'hub' }, '1,0': { type: 'housing', floors: 3 }, '-1,0': { type: 'housing', floors: 3 }, '0,1': { type: 'desal' }, '-1,1': { type: 'wastewater' }, '-2,1': { type: 'biogas' }, '2,-1': { type: 'recycling' } };
  const free = gridCells().map(({ q, r }) => hexKey(q, r)).filter((k) => !fixed[k]);
  const plan = { ...fixed }; let i = 0;
  const take = (n, v) => { for (let j = 0; j < n; j += 1) plan[free[i++]] = v; };
  take(16, { type: 'hydro' }); take(1, { type: 'battery' }); take(9, { type: 'wind' }); take(4, { type: 'solar' });
  const city = scenarioCity(S);
  city.params = { ...city.params, windKW: 1000, windCapacityFactor };
  city.hexes = gridCells().map(({ q, r }) => ({ q, r, ...(plan[hexKey(q, r)] || { type: 'open' }) }));
  return city;
}
const met = (city) => Object.fromEntries(evaluateChallenges(S, simulate(city)).map((r) => [r.id, r.met]));

describe('Thalassa Research Station scenario (draft)', () => {
  it('starts from Thalassa values in its own project, leaving the Bangkok city untouched', () => {
    const city = scenarioCity(S);
    expect(city.params.population).toBe(200);
    expect(city.params.rainMm).toBe(1800);
    expect(city.params.windCapacityFactor).toBeNull();
    expect(city.hexes.filter((h) => h.type !== 'open').map((h) => h.type).sort()).toEqual(['housing', 'housing', 'hub']);
    expect(projectStorage(DEFAULT_PROJECT_ID, 'u1')).toEqual({ local: 'hearisland.hexGrid.v1:u1', cloudPath: 'u1/activityProgress/hex-grid', activityId: 'hex-grid' });
    expect(projectStorage(S.projectId, 'u1')).toEqual({ local: 'hearisland.hexGrid.v1:hex-grid-thalassa:u1', cloudPath: 'u1/activityProgress/hex-grid-thalassa', activityId: 'hex-grid-thalassa' });
    expect(scenarioById('nope')).toBeNull();
    expect(S.status).toBe(SCENARIO_INFO[S.id].status);
  });

  it('is achievable, but only with the weather-mast wind survey', () => {
    const cf = Math.round(WIND_SURVEY_RESULT.capacityFactor * 100) / 100; // 0.34, the survey's answer
    expect(Object.values(met(provenDesign(cf))).every(Boolean)).toBe(true);
    const noWind = met(provenDesign(null));
    expect(noWind.night).toBe(false);
    expect(noWind.all).toBe(false);
  });

  it('the starting city meets only the easy goals, so there is work to do', () => {
    const start = met(scenarioCity(S));
    expect(start.afloat).toBe(true);
    expect(start.all).toBe(false);
    expect(start.food).toBe(false);
  });

  it('shows live challenge status, the draft label and the model limits', async () => {
    const host = document.createElement('div'); document.body.append(host);
    const root = createRoot(host);
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    await act(async () => root.render(<ScenarioPanel scenario={S} sim={simulate(provenDesign(0.34))} onExit={() => {}} />));
    expect(host.textContent).toMatch(/Draft challenge · awaiting educator review/);
    expect(host.textContent).toMatch(/6 of 6 met/);
    expect(host.textContent).toMatch(/no tides, waves, storms or seasons/);
    expect(host.textContent).toMatch(/Back to My Dashboard/);
    await act(async () => root.unmount()); host.remove();
  });
});
