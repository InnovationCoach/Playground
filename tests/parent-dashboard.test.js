import { describe, it, expect } from 'vitest';
import { buildChildProgress, conversationStarters } from '../src/features/parent/childProgress.js';
import { childRecords, profileFor, PROFILES } from '../src/services/api/mockChildRecords.js';
import { createMockBackend } from '../src/services/api/mockBackend.js';
import { DEMO_PARENT_INVITE_CODE } from '../src/services/api/mockFixtures.js';
import { TERM } from '../src/features/pbl/content/pblModel.js';
import { COMPETENCIES } from '../src/features/pbl/content/competencies.js';

const NOW = new Date('2026-10-22T12:00:00');
const child = { uid: 'kid-1', givenNames: 'Ana', displayName: 'Ana Lee' };
const build = (records) => buildChildProgress({ child, now: NOW, ...records });

describe('buildChildProgress', () => {
  it('a child with nothing saved shows empty states, not zeros dressed up as results', () => {
    const p = build(childRecords('new', NOW.getTime()));
    expect(p.goals).toBeNull();
    expect(p.pbl.started).toBe(false);
    expect(p.pbl.tasks.done).toBe(0);
    expect(p.competencies.shown).toBe(0);
    expect(p.activities.done).toBe(0);
    expect(p.edmentum).toEqual({ status: 'not_connected', courses: [] });
    expect(p.lastActiveAt).toBeNull();
    expect(p.recent).toEqual([]);
    expect(p.starters.length).toBe(1);
  });

  it('counts PBL tasks, goal steps, habit days and competencies from the saved records', () => {
    const p = build(childRecords('active', NOW.getTime()));
    expect(p.pbl.currentPhase.id).toBe('prototype');
    expect(p.pbl.tasks.done).toBe(14);
    expect(p.pbl.question).toMatch(/school bags/);
    expect(p.pbl.evidence.total).toBe(7);
    // Goal 1: 2 of 3 steps; goal 2 achieved (1 unit) -> 3 of 4.
    expect(p.goals.steps).toEqual({ done: 3, total: 4, percent: 75 });
    expect(p.goals.achieved).toBe(1);
    expect(p.goals.habit.count).toBe(5);
    expect(p.goals.habit.target).toBe(5);
    expect(p.activities.done).toBe(2);
    const tagged = new Set(childRecords('active', NOW.getTime()).pblProject.evidence.flatMap((e) => e.competencies));
    expect(p.competencies.shown).toBe(tagged.size);
    expect(p.competencies.total).toBe(COMPETENCIES.length);
    expect(p.competencies.confirmed).toBe(0);
  });

  it('never returns the child\'s private writing or Goal setting strengths', () => {
    const records = childRecords('active', NOW.getTime());
    records.goalPlan.strengthsOwn = 'SECRET-STRENGTH';
    records.pblProject.evidence[0].body = 'SECRET-BODY';
    records.pblProject.evidence[6].ai = { asked: 'SECRET-ASK', gave: 'x', kept: 'y' };
    records.pblProject.sparks = 'SECRET-SPARKS';
    const out = build(records);
    const json = JSON.stringify(out);
    for (const secret of ['SECRET-STRENGTH', 'SECRET-BODY', 'SECRET-ASK', 'SECRET-SPARKS']) expect(json).not.toContain(secret);
    const keys = new Set();
    const walk = (v) => { if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { keys.add(k); walk(x); } };
    walk(out);
    for (const k of ['strengths', 'strengthsOwn', 'supports', 'mood', 'body', 'ai', 'sparks', 'recharge', 'phrases']) expect(keys.has(k)).toBe(false);
  });

  it('marks coach-confirmed competencies only when the backend supplies them', () => {
    const records = childRecords('active', NOW.getTime());
    const p = buildChildProgress({ child, now: NOW, ...records, confirmedCompetencies: ['ctps-04', 'not-a-real-id'] });
    expect(p.competencies.confirmed).toBe(1);
    const ctps = p.competencies.domains.find((d) => d.id === 'ctps');
    expect(ctps.items.find((i) => i.id === 'ctps-04').confirmed).toBe(true);
  });

  it('Edmentum: drops malformed scores, averages recent results and sorts courses by last activity', () => {
    const p = build({ edmentum: { status: 'connected', courses: [
      { id: 'a', title: 'Old', lastActivityAt: NOW.getTime() - 9e8, recent: [{ title: 'Q', scoreGiven: 5, scoreMaximum: 10 }] },
      { id: 'b', title: 'New', progressPercent: 140, lastActivityAt: NOW.getTime() - 1e6, recent: [
        { title: 'T1', scoreGiven: 9, scoreMaximum: 10 }, { title: 'bad', scoreGiven: 3, scoreMaximum: 0 }, { scoreGiven: 1, scoreMaximum: 2 }
      ] }
    ] } });
    expect(p.edmentum.courses.map((c) => c.id)).toEqual(['b', 'a']);
    expect(p.edmentum.courses[0].recent).toHaveLength(1);
    expect(p.edmentum.courses[0].averageScore).toBe(90);
    expect(p.edmentum.courses[0].progressPercent).toBe(100);
  });

  it('ignores a project saved for another term', () => {
    const records = childRecords('active', NOW.getTime());
    records.pblProject.termId = 'term-2025-t1';
    expect(build(records).pbl.started).toBe(false);
    expect(TERM.id).not.toBe('term-2025-t1');
  });

  it('recent work lists only the last two weeks, newest first', () => {
    const p = build(childRecords('active', NOW.getTime()));
    expect(p.recent.length).toBeGreaterThan(0);
    const times = p.recent.map((r) => r.at);
    expect([...times].sort((a, b) => b - a)).toEqual(times);
    expect(Math.min(...times)).toBeGreaterThanOrEqual(NOW.getTime() - 14 * 86400000);
  });

  it('conversation starters follow the phase and goals, at most three', () => {
    const p = build(childRecords('active', NOW.getTime()));
    expect(p.starters.length).toBeLessThanOrEqual(3);
    expect(p.starters.join(' ')).toMatch(/Ana/);
    expect(p.starters.some((s) => /show you what they are building/.test(s) || /school bags/.test(s))).toBe(true);
    expect(conversationStarters('', build(childRecords('new', NOW.getTime())))[0]).toMatch(/your child/);
  });
});

describe('mock GET /api/parent/children/:uid/progress', () => {
  const parent = { uid: 'caller-parent-pd', role: 'parent', name: 'P', email: 'p@welearn.test' };
  const other = { uid: 'caller-parent-other', role: 'parent', name: 'O', email: 'o@welearn.test' };
  const call = (api, caller, method, path, extra = {}) => api.handle({ method, path, caller, ...extra });

  it('returns progress for a linked child, and NOT_FOUND for anyone else', async () => {
    const api = createMockBackend({ latencyMs: 0 });
    const linked = await call(api, parent, 'POST', '/api/parent/redeem', { body: { code: DEMO_PARENT_INVITE_CODE } });
    const uid = linked.body.child.uid;
    const res = await call(api, parent, 'GET', `/api/parent/children/${uid}/progress`);
    expect(res.status).toBe(200);
    expect(res.body.child.uid).toBe(uid);
    expect(res.body.pbl.started).toBe(true); // the demo child is always the active profile
    expect((await call(api, other, 'GET', `/api/parent/children/${uid}/progress`)).status).toBe(404);
    expect((await call(api, parent, 'GET', '/api/parent/children/nobody/progress')).status).toBe(404);
    expect((await call(api, { ...parent, role: 'student' }, 'GET', `/api/parent/children/${uid}/progress`)).status).toBe(403);
  });

  it('spreads non-demo children across every profile deterministically', () => {
    const seen = new Set(Array.from({ length: 30 }, (_, i) => profileFor(`student-${i}`, 'demo')));
    expect([...seen].sort()).toEqual([...PROFILES].sort());
    expect(profileFor('student-3', 'demo')).toBe(profileFor('student-3', 'demo'));
  });
});
