import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { setupApiTestEnv } from './api-test-helper.js';

describe('Competency decisions → learner choices → reviewed evidence', () => {
  let env, schoolRef, offeringRef;
  const school = 'pathway-pilot-school', cls = 'pathway-pilot-class', uid = 'pathway-pilot-learner', offering = 'pathway-pilot-offering';
  const tokens = {};
  const base = `/api/schools/${school}/learners/${uid}/pathway`;
  const call = (method, action = '', who = 'learner', body) => env.request(method, `${base}${action}?classId=${cls}`, { token: tokens[who], body });
  const view = async () => (await call('GET')).body;
  const decision = (patch = {}) => ({ competencyId: 'sdl-01', state: 'confirmed', offeringId: offering, submissionId: 'starting-evidence', reason: 'The work sets a measurable goal with steps and deadlines.', ...patch });
  beforeAll(async () => {
    env = await setupApiTestEnv();
    schoolRef = env.db.collection('schools').doc(school);
    await env.db.recursiveDelete(schoolRef);
    await schoolRef.set({ name: 'Pathway pilot school' });
    await env.db.collection('classes').doc(cls).set({ schoolId: school, name: 'Pilot class' });
    await env.db.collection('classes').doc('pathway-foreign-class').set({ schoolId: school });
    for (const [who, value] of Object.entries({
      learner: { uid, role: 'student', classIds: [cls] },
      peer: { uid: 'pathway-pilot-peer', role: 'student', classIds: [cls] },
      coach: { uid: 'pathway-pilot-coach', role: 'coach', classIds: [cls] },
      outsider: { uid: 'pathway-pilot-outsider', role: 'coach', classIds: ['pathway-foreign-class'] },
      parent: { uid: 'pathway-pilot-parent', role: 'parent', classIds: [] }
    })) {
      const profile = { ...value, schoolIds: [school], status: 'active' };
      await env.db.collection('users').doc(value.uid).set(profile);
      tokens[who] = await env.getIdToken(value.uid, profile);
    }
    offeringRef = schoolRef.collection('programOfferings').doc(offering);
    await offeringRef.set({ status: 'published', classIds: [cls], programId: 'sustainable-futures' });
    await offeringRef.collection('members').doc(uid).set({ status: 'active', classId: cls });
    const lesson = { status: 'published', revision: 1, title: 'Plan an investigation', classId: cls, milestoneId: 'explore',
      outcome: 'Set a measurable goal', competencyIds: ['sdl-01'], successCriteria: ['Name a goal, steps and deadline'],
      steps: [{ id: 'plan', title: 'Make a plan', instructions: 'Choose a goal and write steps and a deadline.' }] };
    await offeringRef.collection('lessons').doc('start').set(lesson);
    await offeringRef.collection('lessons').doc('stretch').set({ ...lesson, title: 'Think strategically', outcome: 'Align priorities with a goal', competencyIds: ['ctps-06'], prerequisiteCompetencyIds: ['sdl-01'] });
    await offeringRef.collection('submissions').doc('starting-evidence').set({ learnerUid: uid, classId: cls, lessonId: 'start', lessonRevision: 1, status: 'reviewed', reviewedAt: '2026-11-01T01:00:00Z', body: 'My plan', revision: 1 });
  });
  afterAll(async () => { if (env) { await env.db.recursiveDelete(schoolRef); await env.teardown(); } });

  it('rejects unauthenticated, other learner, unassigned coach and parent access', async () => {
    expect((await env.request('GET', `${base}?classId=${cls}`)).status).toBe(401);
    for (const who of ['peer', 'outsider', 'parent']) expect((await call('GET', '', who)).status).toBe(403);
    expect((await call('POST', '/decisions', 'learner', decision({ revision: 0 }))).status).toBe(403);
  });
  it('does not treat reviewed evidence as mastery until a coach decides', async () => {
    const data = await view();
    expect(data.revision).toBe(0); expect(data.achievements).toEqual([]);
    expect(data.recommendations.map(r => r.lessonId)).toEqual(['start']);
    expect(data.evidence).toEqual([]);
    expect((await call('GET', '', 'coach')).body.evidence).toHaveLength(1);
  });
  it('rejects invented, wrong-version, unmapped and unreviewed evidence', async () => {
    expect((await call('POST', '/decisions', 'coach', decision({ revision: 0, competencyId: '2.1.1' }))).status).toBe(400);
    expect((await call('POST', '/decisions', 'coach', decision({ revision: 0, competencyId: 'ctps-06' }))).status).toBe(400);
    expect((await call('POST', '/decisions', 'coach', decision({ revision: 0, submissionId: 'invented' }))).status).toBe(400);
    await offeringRef.collection('submissions').doc('wrong-version').set({ learnerUid: uid, classId: cls, lessonId: 'start', lessonRevision: 0, status: 'reviewed' });
    expect((await call('POST', '/decisions', 'coach', decision({ revision: 0, submissionId: 'wrong-version' }))).status).toBe(400);
    await offeringRef.collection('submissions').doc('pending').set({ learnerUid: uid, classId: cls, lessonId: 'start', lessonRevision: 1, status: 'submitted' });
    expect((await call('POST', '/decisions', 'coach', decision({ revision: 0, submissionId: 'pending' }))).status).toBe(400);
  });
  it('confirms achievement, unlocks a next goal and saves a canonical learner choice once', async () => {
    expect((await call('POST', '/decisions', 'coach', decision({ revision: 0 }))).status).toBe(201);
    let data = await view();
    expect(data.achievements[0]).toMatchObject({ competencyId: 'sdl-01', state: 'confirmed', reviewerUid: 'pathway-pilot-coach' });
    expect(data.recommendations.map(r => r.lessonId)).toEqual(['stretch']);
    expect((await call('POST', '/choose', 'coach', { recommendationId: `${offering}:stretch`, revision: 1 })).status).toBe(403);
    expect((await call('POST', '/choose', 'learner', { recommendationId: `${offering}:stretch`, revision: 0 })).status).toBe(409);
    const choice = { recommendationId: `${offering}:stretch`, revision: 1, target: 'Forged goal', competencyIds: ['unknown'] };
    const results = await Promise.all([call('POST', '/choose', 'learner', choice), call('POST', '/choose', 'learner', choice)]);
    expect(results.map(r => r.status).sort()).toEqual([200, 201]);
    data = await view();
    expect(data.quests).toHaveLength(1); expect(data.quests[0].target).toBe('Align priorities with a goal');
    expect(data.quests[0].competencyIds).toEqual(['ctps-06']); expect(data.recommendations).toEqual([]);
    expect((await call('POST', '/decisions', 'coach', decision({ revision: 1 }))).status).toBe(409);
  });
  it('submits quest work through the existing evidence flow without awarding mastery', async () => {
    const stale = await env.request('POST', `/api/schools/${school}/program-offerings/${offering}/submissions`, { token: tokens.learner,
      body: { submissionId: 'stale-stretch-evidence', lessonId: 'stretch', expectedLessonRevision: 0, body: 'Work against an older lesson version.' } });
    expect(stale.status).toBe(409);
    const res = await env.request('POST', `/api/schools/${school}/program-offerings/${offering}/submissions`, { token: tokens.learner,
      body: { submissionId: 'stretch-evidence', lessonId: 'stretch', expectedLessonRevision: 1, body: 'I compared priorities against my investigation goal.' } });
    expect(res.status).toBe(201);
    expect((await view()).achievements.some(a => a.competencyId === 'ctps-06')).toBe(false);
    const review = await env.request('POST', `/api/schools/${school}/program-offerings/${offering}/submissions/${uid}_stretch-evidence/review`, { token: tokens.coach,
      body: { revision: 1, status: 'reviewed', feedback: 'Clear priorities with reasons.' } });
    expect(review.status).toBe(200);
    expect((await view()).quests[0].state).toBe('active');
    expect((await call('POST', '/decisions', 'coach', decision({ revision: 2, competencyId: 'ctps-06', submissionId: `${uid}_stretch-evidence` }))).status).toBe(201);
    expect((await view()).quests[0].state).toBe('achieved');
  });
  it('reopens achievement with a reason and retains both assessment decisions', async () => {
    expect((await call('POST', '/decisions', 'coach', decision({ revision: 3, competencyId: 'ctps-06', state: 'reopened', reason: 'Further evidence is needed to establish independent application.' }))).status).toBe(201);
    const data = await view(); expect(data.quests[0].state).toBe('active');
    expect(data.achievements.find(a => a.competencyId === 'ctps-06').state).toBe('reopened');
    const history = await schoolRef.collection('learnerPathways').doc(uid).collection('classes').doc(cls).collection('decisions').get();
    expect(history.size).toBe(3);
  });
  it('allows assigned coach to view pathway when class has status: archived', async () => {
    await env.db.collection('classes').doc(cls).update({ status: 'archived' });
    const res = await call('GET', '', 'coach');
    expect(res.status).toBe(200);
    expect(res.body.achievements).toBeDefined();
    await env.db.collection('classes').doc(cls).update({ status: 'active' });
  });
  it('revokes access when class membership changes', async () => {
    await env.db.collection('users').doc(uid).update({ classIds: [] });
    expect((await call('GET')).status).toBe(403);
    expect((await call('GET', '', 'coach')).status).toBe(403);
  });
});
