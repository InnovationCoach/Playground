import { describe, it, expect } from 'vitest';
import {
  levelFor, levelThreshold, LEVELS, recordActivity, currentStreak, schoolDaysBetween, isSchoolDay, localDate,
  applyEvent, emptyQuest, hydrateQuest, newlyEarnedBadges, badgeProgress, nextBadge, todaysQuest, schoolWeek,
  DAILY_SELF_XP_CAP, MAX_STREAK_FREEZES, XP_RULES
} from '../src/features/quest/questModel.js';
import { PHASES } from '../src/features/pbl/content/pblModel.js';

// 2026-10-05 is a Monday.
const MON = '2026-10-05', TUE = '2026-10-06', WED = '2026-10-07', THU = '2026-10-08', FRI = '2026-10-09', SAT = '2026-10-10', NEXT_MON = '2026-10-12';

describe('levels', () => {
  it('starts at level 1 and reaches each table threshold exactly', () => {
    expect(levelFor(0)).toMatchObject({ level: 1, title: 'Curious Starter', toNext: 100 });
    for (const row of LEVELS) expect(levelFor(row.xp).level).toBe(row.level);
    expect(levelFor(99).level).toBe(1);
  });
  it('matches the design: 1,240 XP is level 7 with 260 to level 8', () => {
    expect(levelFor(1240)).toMatchObject({ level: 7, title: 'Systems Thinker', toNext: 260 });
  });
  it('continues past the table and tolerates bad input', () => {
    expect(levelThreshold(11)).toBe(levelThreshold(10) + 600);
    expect(levelFor(3100).level).toBe(11);
    expect(levelFor(-5).level).toBe(1);
    expect(levelFor(Number.NaN).level).toBe(1);
  });
});

describe('school days', () => {
  it('treats weekends and holidays as non-school days', () => {
    expect(isSchoolDay(MON)).toBe(true);
    expect(isSchoolDay(SAT)).toBe(false);
    expect(isSchoolDay(WED, new Set([WED]))).toBe(false);
    expect(schoolDaysBetween(FRI, NEXT_MON)).toBe(0);
    expect(schoolDaysBetween(MON, THU)).toBe(2);
  });
  it('uses the school timezone for the local date', () => {
    const instant = new Date('2026-10-04T18:30:00Z');
    expect(localDate(instant, 'Asia/Bangkok')).toBe('2026-10-05');
    expect(localDate(instant, 'Europe/London')).toBe('2026-10-04');
  });
  it('lists the Monday-to-Friday week', () => {
    expect(schoolWeek(WED)).toEqual([MON, TUE, WED, THU, FRI]);
    expect(schoolWeek('2026-10-11')).toEqual([MON, TUE, WED, THU, FRI]);
  });
});

describe('weekday streak', () => {
  it('grows on consecutive school days and ignores repeat activity', () => {
    let s = recordActivity(null, MON);
    expect(s.count).toBe(1);
    s = recordActivity(s, MON);
    expect(s.changed).toBe(false);
    s = recordActivity(s, TUE);
    expect(s.count).toBe(2);
  });
  it('never breaks over a weekend and weekend activity does not count', () => {
    let s = { count: 3, lastActiveDate: FRI, freezes: 0 };
    expect(recordActivity(s, SAT)).toMatchObject({ count: 3, changed: false });
    expect(recordActivity(s, NEXT_MON).count).toBe(4);
  });
  it('skips school holidays', () => {
    const holidays = new Set([TUE]);
    expect(recordActivity({ count: 2, lastActiveDate: MON, freezes: 0 }, WED, holidays).count).toBe(3);
  });
  it('earns a freeze every five days, capped, and spends it on a missed day', () => {
    let s = { count: 4, lastActiveDate: THU, freezes: 0 };
    s = recordActivity(s, FRI);
    expect(s).toMatchObject({ count: 5, freezes: 1 });
    s = recordActivity(s, '2026-10-13'); // missed Monday 12th
    expect(s).toMatchObject({ count: 6, freezes: 0 });
    expect(recordActivity({ count: 9, lastActiveDate: THU, freezes: MAX_STREAK_FREEZES }, FRI).freezes).toBe(MAX_STREAK_FREEZES);
  });
  it('restarts at 1 when missed days exceed the freezes held', () => {
    expect(recordActivity({ count: 7, lastActiveDate: MON, freezes: 1 }, THU).count).toBe(1);
  });
  it('shows today\'s streak honestly', () => {
    const s = { count: 4, lastActiveDate: MON, freezes: 0 };
    expect(currentStreak(s, MON)).toMatchObject({ count: 4, activeToday: true });
    expect(currentStreak(s, TUE)).toMatchObject({ count: 4, atRisk: true });
    expect(currentStreak(s, WED).count).toBe(0);
    expect(currentStreak({ ...s, freezes: 1 }, WED).count).toBe(4);
  });
});

describe('applying XP events', () => {
  const opts = { today: MON, now: '2026-10-05T03:00:00.000Z' };
  it('adds XP, counts the behaviour and starts the streak', () => {
    const { quest, awarded } = applyEvent(null, { type: 'evidence_submitted' }, opts);
    expect(awarded).toBe(XP_RULES.evidence_submitted.xp);
    expect(quest).toMatchObject({ xp: 40, counters: { evidence: 1 }, streak: { count: 1, lastActiveDate: MON } });
  });
  it('caps self-reported XP per day but never caps verified XP', () => {
    let quest = null;
    let total = 0;
    for (let i = 0; i < 8; i++) {
      const r = applyEvent(quest, { type: 'task_step' }, opts);
      quest = r.quest; total += r.awarded;
    }
    expect(total).toBe(DAILY_SELF_XP_CAP);
    expect(applyEvent(quest, { type: 'goal_achieved' }, opts).awarded).toBe(80);
    expect(applyEvent(quest, { type: 'task_step' }, { ...opts, today: TUE }).awarded).toBe(10);
  });
  it('raises a level-up celebration and earns badges once', () => {
    const start = { ...emptyQuest(), xp: 90, counters: { ...emptyQuest().counters, evidence: 0 } };
    const r = applyEvent(start, { type: 'evidence_submitted' }, opts);
    expect(r.levelUp).toMatchObject({ level: 2 });
    expect(r.earned.map(b => b.id)).toEqual(['first-evidence']);
    expect(r.quest.celebrations.map(c => c.kind)).toEqual(['level', 'badge']);
    const again = applyEvent(r.quest, { type: 'evidence_submitted' }, opts);
    expect(again.earned).toEqual([]);
  });
  it('rejects unknown event types', () => {
    expect(() => applyEvent(null, { type: 'free_xp' }, opts)).toThrow();
  });
});

describe('badges and hydration', () => {
  it('reports progress and the closest next badge', () => {
    const quest = { ...emptyQuest(), counters: { ...emptyQuest().counters, reflections: 2 } };
    const curious = badgeProgress(quest).find(b => b.id === 'curious-mind');
    expect(curious).toMatchObject({ earned: false, value: 2, target: 3 });
    expect(nextBadge(quest).id).toBe('curious-mind');
    expect(newlyEarnedBadges({ bestStreak: 5 }, []).map(b => b.id)).toEqual(['spark-5']);
  });
  it('drops malformed stored fields', () => {
    const q = hydrateQuest({ xp: -4, counters: { evidence: 'x' }, badges: [{ id: 'nope' }, { id: 'momentum' }], streak: { lastActiveDate: 'soon', freezes: 9 } });
    expect(q).toMatchObject({ xp: 0, level: 1, counters: { evidence: 0 }, streak: { lastActiveDate: null, freezes: MAX_STREAK_FREEZES } });
    expect(q.badges.map(b => b.id)).toEqual(['momentum']);
  });
});

describe('today\'s quest', () => {
  it('picks the first unfinished task of the current phase', () => {
    const q = todaysQuest({ currentPhase: 'explore', tasksDone: { explore: [0] } }, PHASES);
    expect(q).toMatchObject({ phaseId: 'explore', index: 1, done: 1, total: PHASES[0].tasks.length });
  });
  it('moves on when the current phase is finished and handles a new learner', () => {
    const all = PHASES[0].tasks.map((_, i) => i);
    expect(todaysQuest({ currentPhase: 'explore', tasksDone: { explore: all } }, PHASES).phaseId).toBe(PHASES[1].id);
    expect(todaysQuest(null, PHASES)).toMatchObject({ phaseId: 'explore', index: 0 });
    expect(todaysQuest(null, [])).toBeNull();
  });
});
