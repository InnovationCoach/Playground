import { describe, expect, it } from 'vitest';
import { SPACECRAFT_JOURNEY as M, WORLD } from '../src/features/universe/missions/spacecraftJourney.js';
import { missionsForPlanet } from '../src/features/universe/missions/registry.js';
import { parseNumber, checkNumber, checkChoice, displayAnswer } from '../src/features/universe/missions/missionModel.js';

const step = (route, id) => M.routes.find((r) => r.id === route).steps.find((s) => s.id === id);

describe('Spacecraft journey mission (draft)', () => {
  it('stays a draft that only labelled previews can show', () => {
    expect(M.status).toBe('draft');
    expect(missionsForPlanet('thalassa', { preview: true }).map((m) => m.id)).toEqual(['spacecraft-journey', 'thalassa-wind-survey']);
    expect(missionsForPlanet('thalassa', { preview: false })).toEqual([]);
    expect(missionsForPlanet('boreas', { preview: true })).toEqual([]);
  });

  it('has two routes on one driving question, and lists its model limitations', () => {
    expect(M.routes.map((r) => r.id)).toEqual(['guided', 'advanced']);
    expect(M.limitations.length).toBeGreaterThanOrEqual(4);
    expect(M.drivingQuestion).toMatch(/Thalassa.*Ignis/);
  });

  // Independent hand calculations, so a slip in the mission's formulas would show up here.
  it('answer key matches independent calculations', () => {
    expect(step('guided', 'compare').answer).toBe('chemical');
    expect(step('guided', 'seconds').answer).toBe(3_600_000);
    expect(step('guided', 'days').answer).toBeCloseTo(41.7, 5);
    expect(step('guided', 'food').answer).toBeCloseTo(1.8 * 3 * 42, 6); // 226.8 kg
    expect(step('advanced', 'chem-propellant').answer).toBeCloseTo(12000 * (Math.exp(4200 / (450 * 9.81)) - 1), 3); // ≈ 19,070 kg
    expect(Math.round(step('advanced', 'chem-propellant').answer / 10) * 10).toBe(19070);
    expect(Math.round(step('advanced', 'ion-propellant').answer / 10) * 10).toBe(1840);
    expect(step('advanced', 'supplies').answer).toBeCloseTo(5.3 * 3 * (140 - 42), 6); // 1,558.2 kg
    expect(WORLD.tripDaysChemical).toBe(Math.ceil(step('guided', 'days').answer));
    expect(Math.round(step('advanced', 'panels').answer)).toBe(256);
  });

  it('labels every given: fictional values, real science with a source, unit facts and methods', () => {
    const givens = M.routes.flatMap((r) => r.steps.flatMap((s) => s.given || []));
    expect(givens.every((g) => ['fictional-world', 'real-science', 'unit-fact', 'method'].includes(g.tag))).toBe(true);
    for (const g of givens.filter((x) => x.tag === 'real-science')) expect(g.source).toMatch(/educator review pending/);
    expect(WORLD.distanceKm).toBe(72_000_000);
  });

  it('reads typed answers kindly and separates rounding slips from method errors', () => {
    expect(parseNumber('19,070')).toBe(19070);
    expect(parseNumber('3 600 000 s')).toBe(3600000);
    expect(parseNumber('41.7 days')).toBe(41.7);
    expect(parseNumber('256 m²')).toBe(256);
    expect(parseNumber('about forty')).toBeNull();
    const days = step('guided', 'days');
    expect(checkNumber(days, '41.7')).toBe('correct');
    expect(checkNumber(days, '40')).toBe('close');
    expect(checkNumber(days, '1000')).toBe('incorrect');
    expect(checkNumber(days, 'soon')).toBe('invalid');
    expect(checkChoice(step('guided', 'compare'), 'sail')).toBe('incorrect');
    expect(displayAnswer(step('advanced', 'chem-propellant'))).toBe('19,070 kg');
  });
});

describe('Thalassa wind survey (draft)', () => {
  it('answer key matches independent calculation and points to the station', async () => {
    const { THALASSA_WIND_SURVEY: W } = await import('../src/features/universe/missions/thalassaWindSurvey.js');
    const st = (id) => W.routes[0].steps.find((s) => s.id === id);
    expect(st('hours').answer).toBe(20 + 50 + 60 + 30 + 8);
    expect(st('full-power').answer).toBeCloseTo(0 + 50 * 0.1 + 60 * 0.35 + 30 * 0.75 + 8, 6); // 56.5
    expect(st('capacity-factor').answer).toBe(0.34);
    expect(st('why-not-average').answer).toBe('cube');
    expect(W.status).toBe('draft');
    expect(W.locationId).toBe('weather-mast');
    expect(missionsForPlanet('thalassa', { preview: false })).toEqual([]);
  });
});
