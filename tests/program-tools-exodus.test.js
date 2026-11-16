/** Hands-on tools for Project Exodus (programs/tools/exodus.js). */
import { describe, it, expect } from 'vitest';
import * as m from '../src/features/pbl/programs/tools/exodus.js';
import { expectKitWiring, expectStorable, withTools } from './program-tools-shared.js';
import { toolkitFor } from '../src/features/pbl/programs/tools/index.js';
import { kitXp, levelFor } from '../src/features/pbl/programs/tools/kit.js';
import { newProgress, toggleSession } from '../src/features/pbl/programs/progress.js';

const {
  BADGES, LEVELS, COLONISTS, LIFE_SUPPORT, KCAL_TARGET, O2_TARGET_KG, WATER_TARGET_PCT, cleanEclss, eclssReport,
  CARDS, GAUGES, cleanCrisis, crisisGauges, crisisReport, SECTIONS, SIGNERS, RULEBOOK_SECTIONS, cleanRulebook, rulebookReport, earnedBadges
} = m;

describe('content wiring', () => {
  it('reads Don\'s badges, levels and 6 emergency cards, and auto-unlocks nothing', () => {
    const program = expectKitWiring(m, { auto: [] });
    expect(CARDS).toHaveLength(6);
    for (const c of CARDS) { expect(c.steps).toHaveLength(3); for (const g of GAUGES) expect(c.shock[g.id]).toBeGreaterThan(0); }
    expect(toolkitFor(m.PROGRAM_ID).levels).toBe(LEVELS);
    // Every session and badge together reach the top level.
    const max = program.sessions.length * 150 + BADGES.reduce((s, b) => s + b.xpAward, 0);
    expect(max).toBeGreaterThanOrEqual(LEVELS.at(-1).minXp);
    let p = toggleSession(newProgress(m.PROGRAM_ID), program.sessions[0].sessionNumber);
    p = { ...p, badges: [BADGES[0].id] };
    const xp = kitXp(p, program, BADGES, earnedBadges(p));
    expect(xp).toBe(150 + BADGES[0].xpAward);
    expect(levelFor(xp, LEVELS).level).toBe(2);
    expect(levelFor(0, LEVELS)).toMatchObject({ level: 1, pct: 0 });
    expect(levelFor(99999, LEVELS)).toMatchObject({ level: 7, next: null, pct: 100 });
  });

  it('tags every life-support number as an estimate or an assumption', () => {
    for (const a of Object.values(LIFE_SUPPORT)) { expect(['ESTIMATE', 'ASSUMPTION']).toContain(a.tag); expect(a.note).toBeTruthy(); expect(a.value).toBeGreaterThan(0); }
    expect(COLONISTS).toBe(500);
    expect(KCAL_TARGET).toBe(1250000);
    expect(O2_TARGET_KG).toBe(420);
  });
});

describe('recycling loop engine', () => {
  it('adds farm and algae calories against the 1,250,000 kcal target', () => {
    const r = eclssReport(cleanEclss({ farmM2: 10000, spirulinaL: 100000, recoveryPct: 90 }));
    expect(r.cropKcal).toBe(600000);
    expect(r.algaeKcal).toBe(290000);
    expect(r.kcal).toBe(890000);
    expect(r.kcalPct).toBe(71);
    expect(r.peopleFed).toBe(356);
    expect(r).toMatchObject({ foodOk: false, waterOk: false, closed: false });
  });

  it('balances oxygen and water, and closes only when all three loops do', () => {
    const r = eclssReport(cleanEclss({ farmM2: 21000, spirulinaL: 0, recoveryPct: 98, reserveL: 20000 }));
    expect(r.kcal).toBe(1260000);
    expect(r.o2Kg).toBe(705.6);
    expect(r.lostL).toBe(200);
    expect(r.reserveDays).toBe(100);
    expect(r).toMatchObject({ foodOk: true, o2Ok: true, waterOk: true, closed: true });
    expect(eclssReport(cleanEclss({ farmM2: 21000, recoveryPct: WATER_TARGET_PCT - 0.5 })).closed).toBe(false);
    expect(eclssReport(cleanEclss({ recoveryPct: 100 }))).toMatchObject({ lostL: 0, reserveDays: null });
    expect(cleanEclss({ farmM2: -1, spirulinaL: 9e9, recoveryPct: 12 })).toMatchObject({ farmM2: 0, spirulinaL: 300000, recoveryPct: 80 });
    expectStorable(m, 'eclss-engine', cleanEclss({ farmM2: 21000 }));
  });
});

describe('space emergency game', () => {
  it('knocks each gauge down by the card\'s shock and wins a third back per answer', () => {
    const card = CARDS[0];
    expect(card.shock).toEqual({ food: 50, water: 10, oxygen: 18, morale: 20 });
    const fresh = cleanCrisis(null).cards[card.id];
    expect(crisisGauges(card, fresh)).toMatchObject({ food: 50, water: 90, oxygen: 82, morale: 80, answered: 0, solved: false, foodDeficitPct: 50 });
    expect(crisisGauges(card, { ...fresh, steps: [true, false, false] })).toMatchObject({ food: 67, morale: 87, answered: 1 });
    expect(crisisGauges(card, { ...fresh, steps: [true, true, true] })).toMatchObject({ food: 100, water: 100, oxygen: 100, morale: 100, solved: true, foodDeficitPct: 0 });
  });

  it('counts solved cards and trims notes', () => {
    const d = cleanCrisis({ card: 'card-99', cards: { [CARDS[1].id]: { steps: [true, true, true, true], notes: ['x'.repeat(999)] }, [CARDS[2].id]: { steps: [true, 'yes', 1] }, bogus: {} } });
    expect(d.card).toBe(CARDS[0].id);
    expect(d.cards[CARDS[1].id].steps).toEqual([true, true, true]);
    expect(d.cards[CARDS[1].id].notes[0]).toHaveLength(140);
    expect(d.cards[CARDS[2].id].steps).toEqual([true, false, false]);
    expect(crisisReport(d)).toMatchObject({ solvedCount: 1, total: 6 });
    expect(Object.keys(d.cards)).toHaveLength(6);
    expectStorable(m, 'crisis-sim', d);
  });
});

describe('rulebook workshop', () => {
  const full = () => ({
    sections: Object.fromEntries(SECTIONS.map((s) => [s.n, { choice: s.options[0].id, text: 'We agree that this is fair.' }])),
    signers: SIGNERS.map((_, i) => `Kid ${i + 1}`)
  });

  it('has 7 sections, with Don\'s own titles marked as sourced', () => {
    expect(RULEBOOK_SECTIONS).toBe(7);
    expect(SIGNERS).toHaveLength(4);
    expect(SECTIONS.filter((s) => s.sourced).map((s) => s.title)).toEqual(['Sharing Jobs and Resources', 'Protecting Our New Planet\'s Nature', 'Solving Arguments Peacefully']);
  });

  it('is complete only with a rule and a sentence in each section and all 4 signatures', () => {
    expect(rulebookReport(cleanRulebook(full()))).toMatchObject({ count: 7, complete: true });
    const noText = full(); noText.sections[3].text = '   ';
    expect(rulebookReport(cleanRulebook(noText))).toMatchObject({ count: 6, complete: false });
    const badChoice = full(); badChoice.sections[6].choice = 'mean-punishments';
    expect(rulebookReport(cleanRulebook(badChoice)).complete).toBe(false);
    const unsigned = full(); unsigned.signers[2] = '';
    expect(rulebookReport(cleanRulebook(unsigned))).toMatchObject({ count: 6, signed: 3, complete: false });
    expect(rulebookReport(cleanRulebook(null))).toMatchObject({ count: 0, complete: false });
    // A finished rulebook does not unlock a badge on its own: the loop map and budget are checked by the coach.
    expect(earnedBadges(withTools(m, { rulebook: full() }))).toEqual([]);
    expectStorable(m, 'rulebook', cleanRulebook(full()));
  });
});
