/** Hands-on tools for StreetPaws (programs/tools/streetPaws.js). */
import { describe, it, expect } from 'vitest';
import * as m from '../src/features/pbl/programs/tools/streetPaws.js';
import { expectKitWiring, expectStorable, withTools } from './program-tools-shared.js';

const {
  PILLARS, SLIDES, FOOD_DEFAULT, cleanFood, foodMath, cleanPins, cleanSos, sosReport, cleanApp, pillarsTried, swipe, ANIMALS,
  cleanPersonas, personaReport, statementFor, PERSONA_KINDS, CLICK_MAX, SPEAKERS, PITCH_SECONDS, parseLine, blankKey, BLANKS, cleanPitch, pitchReport, earnedBadges
} = m;

describe('content wiring', () => {
  it('reads Don\'s badges, 4 pillars, 8 slides and 4 speakers', () => {
    expectKitWiring(m, { auto: ['streetpaws-three-click-architect'] });
    expect(PILLARS.map((p) => p.title)).toEqual(['Food Donation Hub', 'Volunteer Feeding Map', 'SOS Vet & Medical Care', 'Adoption Matchmaker']);
    expect(SLIDES).toHaveLength(8);
    expect(SPEAKERS.map((s) => s.sec)).toEqual([120, 150, 150, 180]);
    expect(PITCH_SECONDS).toBe(600);
  });
});

describe('food donation maths', () => {
  it('matches the week 5 example: 600 THB bag, 10 dogs, 5 days = 12 THB a dog a day', () => {
    const r = foodMath(cleanFood(FOOD_DEFAULT));
    expect(r.perDogDay).toBe(12);
    expect(r.gramsPerDogDay).toBe(300);
    expect(r.bowlsPerBag).toBe(40);
    expect(r.dogDaysPerBowl).toBe(1.25);
    expect(r.extraPerBowl).toBe(3);
    expect(r.monthlyTHB).toBe(3600);
    expect(foodMath(cleanFood({ ...FOOD_DEFAULT, bowls: 8 }))).toMatchObject({ raisedTHB: 120, dogDaysFunded: 10 });
  });

  it('never divides by zero or accepts negative numbers', () => {
    const f = cleanFood({ bagTHB: -5, bagKg: 0, dogs: 0, daysPerBag: 'x', bowlTHB: 0, bowls: -3 });
    expect(f).toMatchObject({ bagTHB: 1, bagKg: 0.5, dogs: 1, daysPerBag: 5, bowlTHB: 1, bowls: 0 });
    for (const v of Object.values(foodMath(f))) expect(Number.isFinite(v)).toBe(true);
  });
});

describe('app prototype', () => {
  it('keeps pins on the map and turns red to green', () => {
    const pins = cleanPins([{ id: 'market', x: 500, y: -4, fed: true }, { id: 'nowhere', x: 1, y: 1, fed: true }, null]);
    expect(pins).toHaveLength(5);
    expect(pins[0]).toEqual({ id: 'market', x: 96, y: 6, fed: true });
    expect(pins.filter((p) => p.fed)).toHaveLength(1);
  });

  it('sends an SOS in exactly 3 clicks and flags urgent cases', () => {
    expect(sosReport(cleanSos({ photo: true, location: true })).ready).toBe(false);
    expect(sosReport(cleanSos({ photo: true, location: true, injury: 'skin' }))).toMatchObject({ clicks: 3, ready: true, priority: 'normal', billPct: 60 });
    expect(sosReport(cleanSos({ injury: 'hit-by-car' })).priority).toBe('urgent');
    expect(cleanSos({ injury: 'dragon bite' }).injury).toBeNull();
  });

  it('swipes each animal into exactly one pile and counts pillars tried', () => {
    let d = cleanApp(null);
    expect(pillarsTried(d)).toEqual([]);
    d = swipe(d, 'somchai', true);
    d = swipe(d, 'mochi', false);
    d = swipe(d, 'mochi', true);
    d = swipe(d, 'godzilla', true);
    expect(d.liked).toEqual(['somchai', 'mochi']);
    expect(d.passed).toEqual([]);
    d = cleanApp({ ...d, food: { bowls: 2 }, pins: [{ id: 'bts', fed: true }], sos: { photo: true, location: true, injury: 'broken-leg' } });
    expect(pillarsTried(d)).toHaveLength(4);
    expect(ANIMALS.filter((a) => !a.sample).map((a) => a.id)).toEqual(['somchai']);
    expectStorable(m, 'app-prototype', d);
  });
});

describe('personas and the 3-click rule', () => {
  const persona = (name) => ({ name, age: 45, goal: 'Wants to feed cats', problem: 'Nobody knows her schedule', action: 'share a schedule', reason: 'she gets sick', solution: 'show a live feeding map' });
  const clicks = (n) => Object.fromEntries(PILLARS.map((p) => [p.id, Array.from({ length: n }, (_, i) => `tap ${i + 1}`)]));

  it('fills Don\'s problem-statement frame', () => {
    const d = cleanPersonas({ personas: { feeder: persona('Auntie Mali') } });
    expect(statementFor(d.personas.feeder)).toBe('Auntie Mali needs a way to share a schedule because she gets sick, so our app will show a live feeding map.');
    expect(statementFor(d.personas.donor)).toBe('[User Name] needs a way to [Action] because [Reason], so our app will [Solution].');
    expect(PERSONA_KINDS.find((k) => k.id === 'feeder').example.name).toBe('Auntie Mali');
  });

  it('unlocks the 3-click badge only with 3 complete personas and every pillar in 1 to 3 taps', () => {
    const all = Object.fromEntries(PERSONA_KINDS.map((k) => [k.id, persona(k.label)]));
    expect(personaReport(cleanPersonas({ personas: all, clicks: clicks(3) })).done).toBe(true);
    expect(personaReport(cleanPersonas({ personas: all, clicks: clicks(4) })).done).toBe(false);
    expect(personaReport(cleanPersonas({ personas: all, clicks: clicks(0) })).done).toBe(false);
    expect(personaReport(cleanPersonas({ personas: { ...all, donor: { ...all.donor, reason: ' ' } }, clicks: clicks(2) })).done).toBe(false);
    expect(cleanPersonas({ clicks: clicks(20) }).clicks[PILLARS[0].id]).toHaveLength(CLICK_MAX);
    const good = cleanPersonas({ personas: all, clicks: clicks(2) });
    expect(earnedBadges(withTools(m, { 'persona-builder': good }))).toEqual(['streetpaws-three-click-architect']);
    expectStorable(m, 'persona-builder', good);
  });
});

describe('pitch script', () => {
  it('turns [blanks] into shared fill-ins', () => {
    const parts = parseLine('donate just [Amount, e.g., 15 Baht] for [App Name].');
    expect(parts.map((p) => p.blank || 'text')).toEqual(['text', 'amount', 'text', 'app-name', 'text']);
    expect(parts[1]).toMatchObject({ label: 'Amount', example: '15 Baht' });
    expect(blankKey('Problem 1, e.g., hunger')).toBe('problem-1');
    // "App Name" appears in several speakers' lines but is one blank.
    expect(BLANKS.filter((b) => b.blank === 'app-name')).toHaveLength(1);
    expect(BLANKS.length).toBeGreaterThan(8);
  });

  it('keeps only known blanks and judges each speaker within 15 seconds', () => {
    const d = cleanPitch({ fills: { 'app-name': '  StreetPaws  ', hacker: 'x' }, times: [120, 165, 149, 300, 77], slides: [1, 1, 8, 9], names: ['Mali'] });
    expect(d.fills).toEqual({ 'app-name': 'StreetPaws ' });
    expect(d.slides).toEqual([1, 8]);
    expect(d.times).toHaveLength(4);
    const r = pitchReport(d);
    expect(r.speakers.map((s) => s.onTime)).toEqual([true, true, true, false]);
    expect(r).toMatchObject({ filled: 1, slidesReady: 2, allRehearsed: true, onTime: false, totalSec: 734 });
    expect(pitchReport(cleanPitch(null)).allRehearsed).toBe(false);
    expectStorable(m, 'pitch-script', d);
  });
});
