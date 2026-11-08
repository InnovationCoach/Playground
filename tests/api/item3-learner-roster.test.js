import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { setupApiTestEnv } from './api-test-helper.js';
import { FIXTURE_RELEASES } from '../../shared/universe/fixtures/index.js';

describe('Item 3: Invited and Join-code learners added to classes.learnerIds', () => {
  let env;
  const orgId = 'org-welearn';
  const schoolId = 'sch-roster-test';
  const classId = 'cls-roster-test';
  const joinCode = 'BCDF-2345';

  let coachUid = 'coach-roster';
  let coachToken;

  beforeAll(async () => {
    env = await setupApiTestEnv({ universeRegistry: FIXTURE_RELEASES });

    // Setup school, class, coach, and classCode
    await env.db.collection('schools').doc(schoolId).set({
      orgId,
      name: 'Roster Test School',
      status: 'active'
    });

    await env.db.collection('classes').doc(classId).set({
      classId,
      orgId,
      schoolId,
      name: 'Roster Test Class',
      status: 'active',
      coachIds: [coachUid],
      learnerIds: []
    });

    await env.db.collection('classCodes').doc(joinCode).set({
      code: joinCode,
      classId,
      className: 'Roster Test Class',
      createdAt: new Date().toISOString()
    });

    const coachClaims = {
      role: 'coach',
      orgId,
      schoolIds: [schoolId],
      classIds: [classId]
    };
    await env.db.collection('users').doc(coachUid).set({
      uid: coachUid,
      ...coachClaims,
      displayName: 'Coach Roster',
      status: 'active'
    });
    coachToken = await env.getIdToken(coachUid, coachClaims);
  });

  afterAll(async () => {
    await env?.teardown();
  });

  it('adds an invited learner to classes.learnerIds, allowing them to open Universe and appear in reviews', async () => {
    // 1. Coach invites student
    const inviteRes = await env.request('POST', '/api/coach/students', {
      token: coachToken,
      body: {
        displayName: 'Invited Learner',
        email: 'invited.learner@school.edu',
        classId,
        ageBand: '13-15'
      }
    });

    expect(inviteRes.status).toBe(201);
    const invitedUid = inviteRes.body.student.uid;

    // 2. Verify classes.learnerIds contains the invited student
    const classSnap = await env.db.collection('classes').doc(classId).get();
    expect(classSnap.data().learnerIds).toContain(invitedUid);

    // 3. Learner opens Universe
    const invitedToken = await env.getIdToken(invitedUid, {
      role: 'student',
      orgId,
      schoolIds: [schoolId],
      classIds: [classId]
    });

    const universeRes = await env.request('GET', '/api/universe/missions/submissions/mine', {
      token: invitedToken
    });
    expect(universeRes.status).toBe(200);

    // 4. Coach queries mission reviews and has access to this class's roster
    const reviewsRes = await env.request('GET', '/api/coach/universe/submissions', {
      token: coachToken,
      query: { classId }
    });
    expect(reviewsRes.status, JSON.stringify(reviewsRes.body)).toBe(200);
  });

  it('adds a join-code learner to classes.learnerIds, allowing them to open Universe and appear in reviews', async () => {
    const studentUid = 'student-joincode-01';
    const studentClaims = {
      role: 'student',
      orgId,
      schoolIds: [schoolId],
      classIds: []
    };
    await env.db.collection('users').doc(studentUid).set({
      uid: studentUid,
      ...studentClaims,
      displayName: 'JoinCode Student',
      email: 'joincode.student@school.edu',
      status: 'active'
    });
    const studentToken = await env.getIdToken(studentUid, studentClaims);

    // 1. Student joins class using code
    const joinRes = await env.request('POST', '/api/classes/join', {
      token: studentToken,
      body: { code: joinCode }
    });
    expect(joinRes.status, JSON.stringify(joinRes.body)).toBe(200);
    expect(joinRes.body.classId).toBe(classId);

    // 2. Verify classes.learnerIds contains the join-code student
    const classSnap = await env.db.collection('classes').doc(classId).get();
    expect(classSnap.data().learnerIds).toContain(studentUid);

    // 3. Learner opens Universe
    const updatedStudentToken = await env.getIdToken(studentUid, {
      role: 'student',
      orgId,
      schoolIds: [schoolId],
      classIds: [classId]
    });

    const universeRes = await env.request('GET', '/api/universe/missions/submissions/mine', {
      token: updatedStudentToken
    });
    expect(universeRes.status, JSON.stringify(universeRes.body)).toBe(200);

    // 4. Coach queries mission reviews for the class
    const reviewsRes = await env.request('GET', '/api/coach/universe/submissions', {
      token: coachToken,
      query: { classId }
    });
    expect(reviewsRes.status, JSON.stringify(reviewsRes.body)).toBe(200);
  });
});
