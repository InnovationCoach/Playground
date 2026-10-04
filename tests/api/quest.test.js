import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { setupApiTestEnv } from './api-test-helper.js';
import { TERM } from '../../src/features/pbl/content/pblModel.js';

describe('Teen Quest: server-awarded XP, badges, streaks and scoped summaries', () => {
  let env;
  const tokens = {};
  const school = 'quest-school', cls = 'quest-class', otherCls = 'quest-other-class', offering = 'quest-offering', lesson = 'quest-lesson';
  const uid = 'quest-learner';
  const call = (method, path, who = 'learner', body) => env.request(method, path, { token: tokens[who], body });
  const me = async () => (await call('GET', '/api/quest/me')).body;

  beforeAll(async () => {
    env = await setupApiTestEnv();
    await env.db.recursiveDelete(env.db.collection('schools').doc(school));
    await env.db.recursiveDelete(env.db.collection('learnerQuest').doc(uid));
    await env.db.recursiveDelete(env.db.collection('classes').doc(cls));
    await env.db.collection('schools').doc(school).set({ name: 'Quest School', timezone: 'Asia/Bangkok', features: { questMode: true } });
    await env.db.collection('classes').doc(cls).set({ schoolId: school, name: 'Climate Champions 7A' });
    await env.db.collection('classes').doc(otherCls).set({ schoolId: school, name: 'Other class' });
    const accounts = {
      learner: { uid, role: 'student', schoolIds: [school], classIds: [cls] },
      peer: { uid: 'quest-peer', role: 'student', schoolIds: [school], classIds: [cls] },
      coach: { uid: 'quest-coach', role: 'teacher', schoolIds: [school], classIds: [cls] },
      otherCoach: { uid: 'quest-other-coach', role: 'teacher', schoolIds: [school], classIds: [otherCls] },
      parent: { uid: 'quest-parent', role: 'parent', schoolIds: [], classIds: [] }
    };
    for (const [key, value] of Object.entries(accounts)) {
      await env.db.collection('users').doc(value.uid).set({ ...value, status: 'active', displayName: key });
      tokens[key] = await env.getIdToken(value.uid, { role: value.role, schoolIds: value.schoolIds, classIds: value.classIds });
    }
    await env.db.collection('parentLinks').doc('quest-link').set({ parentUid: 'quest-parent', studentUid: uid, status: 'active' });
    const off = env.db.collection('schools').doc(school).collection('programOfferings').doc(offering);
    await off.set({ status: 'published', classIds: [cls], programId: 'sustainable-futures', title: 'Sustainable Futures' });
    await off.collection('members').doc(uid).set({ status: 'active', classId: cls });
    await off.collection('lessons').doc(lesson).set({ status: 'published', classId: cls, revision: 1, milestoneId: 'explore', title: 'Energy hotspots' });
    await env.db.collection('users').doc(uid).collection('activityProgress').doc(`pbl-${TERM.id}`).delete();
  });
  afterAll(async () => env?.teardown());

  it('requires sign-in and is for learners only', async () => {
    expect((await env.request('GET', '/api/quest/me')).status).toBe(401);
    for (const who of ['coach', 'parent']) expect((await call('GET', '/api/quest/me', who)).status).toBe(403);
  });

  it('gives a new learner a welcoming starting state', async () => {
    const res = await call('GET', '/api/quest/me');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ level: { level: 1, xp: 0 }, streak: { count: 0 }, todaysQuest: { phaseId: 'explore', index: 0 }, squad: { className: 'Climate Champions 7A', count: 0, goal: 120 } });
    expect(res.body.stages).toHaveLength(7);
    expect(res.body.badges.every(b => !b.earned)).toBe(true);
  });

  it('exposes the school quest flag through learning context', async () => {
    const res = await call('GET', '/api/learning-context');
    expect(res.body.schools.find(s => s.id === school).features.questMode).toBe(true);
  });

  it('rewards one private reflection per school day', async () => {
    expect((await call('POST', '/api/quest/events', 'learner', { type: 'reflection', text: 'too short' })).status).toBe(400);
    const text = 'Today I noticed the projector draws power even when nobody is using it.';
    const first = await call('POST', '/api/quest/events', 'learner', { type: 'reflection', text });
    expect(first.status).toBe(201);
    expect(first.body.awarded).toBe(15);
    const again = await call('POST', '/api/quest/events', 'learner', { type: 'reflection', text: text + ' Again.' });
    expect(again.body).toMatchObject({ duplicate: true, awarded: 0 });
    expect(again.body.quest.level.xp).toBe(15);
  });

  it('only rewards project tasks the learner has actually ticked, once each', async () => {
    expect((await call('POST', '/api/quest/events', 'learner', { type: 'task_step', phaseId: 'explore', index: 0 })).status).toBe(409);
    expect((await call('POST', '/api/quest/events', 'learner', { type: 'task_step', phaseId: 'nowhere', index: 0 })).status).toBe(400);
    await env.db.collection('users').doc(uid).collection('activityProgress').doc(`pbl-${TERM.id}`).set({ termId: TERM.id, currentPhase: 'explore', tasksDone: { explore: [0] } });
    const ok = await call('POST', '/api/quest/events', 'learner', { type: 'task_step', phaseId: 'explore', index: 0 });
    expect(ok.body.awarded).toBe(10);
    expect(ok.body.quest.todaysQuest).toMatchObject({ phaseId: 'explore', index: 1 });
    expect((await call('POST', '/api/quest/events', 'learner', { type: 'task_step', phaseId: 'explore', index: 0 })).body.duplicate).toBe(true);
  });

  it('refuses self-awarded verified events', async () => {
    for (const type of ['evidence_submitted', 'goal_achieved', 'evidence_reviewed', 'free_xp']) {
      expect((await call('POST', '/api/quest/events', 'learner', { type })).status).toBe(400);
    }
  });

  it('awards evidence XP and the squad count with the submission, exactly once', async () => {
    const body = { submissionId: 'hotspots-1', lessonId: lesson, body: 'The air conditioner in room 4 uses the most energy.' };
    const path = `/api/schools/${school}/program-offerings/${offering}/submissions`;
    expect((await call('POST', path, 'learner', body)).status).toBe(201);
    expect((await call('POST', path, 'learner', body)).status).toBe(201); // idempotent retry
    const q = await me();
    expect(q.level.xp).toBe(65);
    expect(q.counters.evidence).toBe(1);
    expect(q.squad.count).toBe(1);
    expect(q.badges.find(b => b.id === 'first-evidence').earned).toBe(true);
    expect(q.celebrations.some(c => c.kind === 'badge' && c.badgeId === 'first-evidence')).toBe(true);
  });

  it('awards feedback XP to the learner when a coach reviews', async () => {
    const id = `${uid}_hotspots-1`;
    const res = await call('POST', `/api/schools/${school}/program-offerings/${offering}/submissions/${id}/review`, 'coach', { feedback: 'Good measurement. Which device could you switch off?', status: 'revision_requested', revision: 1 });
    expect(res.status).toBe(200);
    const q = await me();
    expect(q.level.xp).toBe(90);
    expect(q.counters.reviewed).toBe(1);
    // A second review of the same evidence does not pay again.
    await call('POST', `/api/schools/${school}/program-offerings/${offering}/submissions/${id}/review`, 'coach', { feedback: 'Great revision.', status: 'reviewed', revision: 2 });
    expect((await me()).level.xp).toBe(90);
  });

  it('awards goal acknowledgement and coach-confirmed achievement once', async () => {
    const created = await call('POST', `/api/schools/${school}/learner-goals`, 'coach', { learnerUid: uid, classId: cls, target: 'Measure three rooms', dueDate: '2026-12-01', domain: 'pbl' });
    expect(created.status).toBe(201);
    const goalPath = `/api/schools/${school}/learner-goals/${created.body.id}`;
    expect((await call('PATCH', goalPath, 'learner', { revision: 1 })).status).toBe(200);
    expect((await call('PATCH', goalPath, 'coach', { revision: 2, state: 'achieved' })).status).toBe(200);
    expect((await call('PATCH', goalPath, 'coach', { revision: 3, state: 'achieved' })).status).toBe(200);
    const q = await me();
    expect(q.level).toMatchObject({ xp: 180, level: 2 });
    expect(q.badges.find(b => b.id === 'goal-getter').earned).toBe(true);
    expect(q.celebrations.some(c => c.kind === 'level' && c.level === 2)).toBe(true);
  });

  it('saves preferences with revision checks and clears celebrations', async () => {
    const q = await me();
    expect((await call('PATCH', '/api/quest/me', 'learner', { calmView: true, revision: q.revision - 1 })).status).toBe(409);
    expect((await call('PATCH', '/api/quest/me', 'learner', { calmView: 'yes', revision: q.revision })).status).toBe(400);
    const saved = await call('PATCH', '/api/quest/me', 'learner', { calmView: true, ackCelebrations: true, revision: q.revision });
    expect(saved.status).toBe(200);
    expect(saved.body.preferences.calmView).toBe(true);
    expect(saved.body.celebrations).toEqual([]);
    expect(saved.body.level.xp).toBe(180);
  });

  it('shares scoped summaries: staff see progress, parents see badges only', async () => {
    const path = `/api/quest/learners/${uid}?schoolId=${school}&classId=${cls}`;
    const coach = await call('GET', path, 'coach');
    expect(coach.status).toBe(200);
    expect(coach.body.level.level).toBe(2);
    expect(coach.body.recentVerified.length).toBeGreaterThan(0);
    expect(JSON.stringify(coach.body)).not.toContain('projector'); // private reflection text never leaves
    const parent = await call('GET', `/api/quest/learners/${uid}?schoolId=${school}`, 'parent');
    expect(parent.status).toBe(200);
    expect(Object.keys(parent.body)).toEqual(['badges']);
    expect((await call('GET', `/api/quest/learners/${uid}?schoolId=${school}&classId=${otherCls}`, 'otherCoach')).status).toBe(403);
    expect((await call('GET', `/api/quest/learners/${uid}?schoolId=${school}`, 'peer')).status).toBe(403);
  });

  it('keeps the ledger and quest record server-side', async () => {
    const events = await env.db.collection('learnerQuest').doc(uid).collection('xpEvents').get();
    expect(events.size).toBe(6);
    expect(events.docs.every(d => typeof d.data().verified === 'boolean')).toBe(true);
  });
});
