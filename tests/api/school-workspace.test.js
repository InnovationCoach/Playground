import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { setupApiTestEnv } from './api-test-helper.js';
describe('School workspace: scoped programs, lessons, goals, academics and calendar', () => {
  let env,
    tokens = {},
    offeringId,
    code,
    codeId,
    lesson,
    goal,
    event;
  const school = 'workspace-school',
    cls = 'workspace-class',
    otherClass = 'workspace-other';
  const base = `/api/schools/${school}`;
  const request = (method, path, role = 'admin', body) => env.request(method, path, {
    token: tokens[role],
    body
  });
  beforeAll(async () => {
    env = await setupApiTestEnv();
    await env.db.collection('schools').doc(school).set({
      name: 'Workspace School',
      orgId: 'org-welearn',
      timezone: 'Asia/Bangkok'
    });
    await env.db.collection('schools').doc('workspace-foreign').set({
      name: 'Other school'
    });
    await env.db.collection('classes').doc(cls).set({
      schoolId: school,
      name: 'Year 11'
    });
    await env.db.collection('classes').doc(otherClass).set({
      schoolId: school,
      name: 'Other class'
    });
    for (const [name, role, classIds] of [['admin', 'admin', []], ['coach', 'teacher', [cls]], ['other', 'teacher', [otherClass]], ['student', 'student', [cls]], ['stranger', 'student', [otherClass]], ['parent', 'parent', []], ['supervisor', 'supervisor', []]]) {
      const uid = `workspace-${name}`,
        schoolIds = role === 'parent' ? [] : [school];
      await env.db.collection('users').doc(uid).set({
        uid,
        role,
        classIds,
        schoolIds,
        orgId: 'org-welearn',
        displayName: name,
        status: 'active',
        yearLevel: '11'
      });
      tokens[name] = await env.getIdToken(uid, {
        role,
        classIds,
        schoolIds,
        orgId: 'org-welearn'
      });
    }
    await env.db.collection('parentLinks').doc('workspace-link').set({
      parentUid: 'workspace-parent',
      studentUid: 'workspace-student',
      status: 'active'
    });
  });
  afterAll(async () => {
    await env?.teardown();
  });
  it('denies unsigned and foreign school requests', async () => {
    expect((await env.request('GET', `${base}/learners`)).status).toBe(401);
    expect((await request('GET', '/api/schools/workspace-foreign/learners')).status).toBe(403);
  });
  it('requires signed school claims and current profile scope', async () => {
    const noClaims = await env.getIdToken('workspace-profile-only');
    await env.db.collection('users').doc('workspace-profile-only').set({
      role: 'admin',
      schoolIds: [school],
      classIds: []
    });
    expect((await env.request('GET', '/api/learning-context', {
      token: noClaims
    })).status).toBe(403);
    const studentToken=await env.getIdToken('workspace-unsigned-school',{role:'student'});
    await env.db.collection('users').doc('workspace-unsigned-school').set({role:'student',schoolIds:[school],classIds:[cls]});
    expect((await env.request('GET',`${base}/calendar-events?from=2026-10-01&to=2026-10-31`,{token:studentToken})).status).toBe(403);
    expect((await env.request('GET','/api/learning-context',{token:studentToken})).body.schools).toEqual([]);
    await env.db.collection('users').doc('workspace-unsigned-school').delete();

  });
  it('returns linked parent school and only assigned coach learners', async () => {
    expect((await request('GET', '/api/learning-context', 'parent')).body.schools[0].id).toBe(school);
    const result = await request('GET', `${base}/learners`, 'coach');
    expect(result.body.items.map(l => l.id)).toEqual(['workspace-student']);
  });
  it('creates one semester offering without mutating legacy portfolios', async () => {
    const ref = env.db.collection('users').doc('workspace-student').collection('activityProgress').doc('pbl-term-2026-t3');
    await ref.set({
      termId: 'term-2026-t3',
      evidence: [{
        id: 'legacy',
        body: 'Keep this'
      }]
    });
    const result = await request('POST', `${base}/program-offerings`, 'admin', {
      programId: 'net-zero-microgrid',
      yearId: '2026-2027',
      classIds: [cls]
    });
    expect(result.status).toBe(201);
    offeringId = result.body.id;
    expect(result.body.semester).toBe(2);
    expect((await ref.get()).data().evidence[0].body).toBe('Keep this');
    expect((await request('POST', `${base}/program-offerings`, 'admin', {
      programId: 'net-zero-microgrid',
      yearId: '2026-2027',
      classIds: [cls]
    })).status).toBe(409);
  });
  it('denies coach offering creation and cross-class offering access', async () => {
    expect((await request('POST', `${base}/program-offerings`, 'coach', {})).status).toBe(403);
    expect((await request('GET', `${base}/program-offerings/${offeringId}/lessons`, 'other')).status).toBe(403);
  });
  it('issues admin-only codes and enrolls a learner idempotently', async () => {
    expect((await request('POST', `${base}/program-offerings/${offeringId}/codes`, 'coach', {
      classId: cls
    })).status).toBe(403);
    const issued = await request('POST', `${base}/program-offerings/${offeringId}/codes`, 'admin', {
      classId: cls
    });
    code = issued.body.code;
    codeId = issued.body.id;
    expect(issued.status).toBe(201);
    const first = await request('POST', '/api/program-enrollments/join', 'student', {
      code
    });
    expect(first.status).toBe(200);
    expect(first.body.alreadyEnrolled).toBe(false);
    const retry = await request('POST', '/api/program-enrollments/join', 'student', {
      code
    });
    expect(retry.body.alreadyEnrolled).toBe(true);
    expect((await request('GET', `${base}/program-offerings`, 'student')).body.items[0].id).toBe(offeringId);
  });
  it('rejects invalid/revoked codes and staff self-enrollment', async () => {
    expect((await request('POST', '/api/program-enrollments/join', 'coach', {
      code
    })).status).toBe(403);
    expect((await request('POST', '/api/program-enrollments/join', 'student', {
      code: 'INVALID'
    })).status).toBe(404);
    expect((await request('DELETE', `${base}/program-codes/${codeId}`, 'admin', {})).status).toBe(200);
    expect((await request('POST', '/api/program-enrollments/join', 'student', {
      code
    })).status).toBe(404);
  });
  it('keeps drafts private and validates class scope', async () => {
    const body = {
      title: 'Campus audit',
      outcome: 'Measure electricity use',
      instructions: 'Collect a dataset',
      milestoneId: 'phase-1',
      classId: cls
    };
    const result = await request('POST', `${base}/program-offerings/${offeringId}/lessons`, 'coach', body);
    expect(result.status).toBe(201);
    lesson = result.body;
    expect((await request('GET', `${base}/program-offerings/${offeringId}/lessons`, 'student')).body.items).toEqual([]);
    expect((await request('POST', `${base}/program-offerings/${offeringId}/lessons`, 'coach', {
      ...body,
      classId: otherClass
    })).status).toBe(403);
    expect((await request('POST', `${base}/program-offerings/${offeringId}/lessons`, 'student', body)).status).toBe(403);
  });
  it('publishes lessons with revision checks and preserves published content', async () => {
    const path = `${base}/program-offerings/${offeringId}/lessons/${lesson.id}`;
    expect((await request('POST', `${path}/publish`, 'coach', {
      revision: 0
    })).status).toBe(409);
    expect((await request('POST', `${path}/publish`, 'coach', {
      revision: lesson.revision
    })).status).toBe(200);
    expect((await request('GET', `${base}/program-offerings/${offeringId}/lessons`, 'student')).body.items[0].title).toBe('Campus audit');
    expect((await request('PATCH', path, 'coach', {
      ...lesson,
      title: 'Rewrite history',
      revision: 2
    })).status).toBe(409);
  });
  it('saves immutable lesson evidence, hides it from peers and publishes coach feedback', async () => {
    const path = `${base}/program-offerings/${offeringId}/submissions`;
    const body = {
      submissionId: 'evidence-v1',
      lessonId: lesson.id,
      body: 'Measured 18 seconds on design B.',
      link: 'https://example.com/project'
    };
    const result = await request('POST', path, 'student', body);
    expect(result.status).toBe(201);
    expect((await request('POST', path, 'student', body)).body.id).toBe(result.body.id);
    expect((await request('POST', path, 'student', {
      ...body,
      body: 'Altered evidence'
    })).status).toBe(409);
    expect((await request('GET', path, 'stranger')).status).toBe(403);
    expect((await request('GET', path, 'parent')).status).toBe(403);
    expect((await request('POST', `${path}/${result.body.id}/review`, 'student', {
      revision: 1,
      status: 'reviewed',
      feedback: 'Self approve'
    })).status).toBe(403);
    expect((await request('POST', `${path}/${result.body.id}/review`, 'coach', {
      revision: 1,
      status: 'revision_requested',
      feedback: 'Include your comparison data.'
    })).status).toBe(200);
    expect((await request('POST', `${path}/${result.body.id}/review`, 'coach', {
      revision: 1,
      status: 'reviewed',
      feedback: 'Stale review'
    })).status).toBe(409);
    expect((await request('GET', path, 'student')).body.items[0]).toMatchObject({
      status: 'revision_requested',
      feedback: 'Include your comparison data.'
    });
    expect((await request('POST', path, 'student', {
      ...body,
      submissionId: 'unsafe',
      link: 'javascript:alert(1)'
    })).status).toBe(400);
  });
  it('shows parent summaries without private artifact bodies or peer identities',async()=>{
    const view=await request('GET',`${base}/learner-program-summaries?learnerUid=workspace-student`,'parent');
    expect(view.status).toBe(200);expect(view.body.items[0]).toMatchObject({publishedLessons:1,lessonsSubmitted:1,revisionsRequested:1});
    expect(JSON.stringify(view.body)).not.toContain('Measured 18 seconds');
    expect((await request('GET',`${base}/learner-program-summaries?learnerUid=workspace-stranger`,'parent')).status).toBe(403);
  });
  it('sets coach goals only for assigned learners and the correct class', async () => {
    const body = {
      learnerUid: 'workspace-student',
      classId: cls,
      target: 'Compare two designs using recorded data',
      domain: 'pbl',
      dueDate: '2026-11-01'
    };
    const result = await request('POST', `${base}/learner-goals`, 'coach', body);
    expect(result.status).toBe(201);
    goal = result.body;
    expect((await request('POST', `${base}/learner-goals`, 'other', body)).status).toBe(403);
    expect((await request('POST', `${base}/learner-goals`, 'admin', {
      ...body,
      classId: otherClass
    })).status).toBe(403);
    expect((await request('POST', `${base}/learner-goals`, 'student', body)).status).toBe(403);
  });
  it('acknowledges student goals without allowing self-approval', async () => {
    const path = `${base}/learner-goals/${goal.id}`;
    expect((await request('PATCH', path, 'student', {
      revision: 1,
      state: 'achieved'
    })).status).toBe(200);
    const records = await request('GET', `${base}/learner-goals`, 'student');
    expect(records.body.items[0]).toMatchObject({
      state: 'active',
      acknowledged: true,
      revision: 2
    });
    expect((await request('PATCH', path, 'coach', {
      revision: 1,
      state: 'achieved'
    })).status).toBe(409);
    expect((await request('PATCH', path, 'coach', {
      revision: 2,
      state: 'achieved'
    })).status).toBe(200);
  });
  it('limits parent goals to their linked child and forbids writes', async () => {
    expect((await request('GET', `${base}/learner-goals?learnerUid=workspace-student`, 'parent')).body.items).toHaveLength(1);
    expect((await request('GET', `${base}/learner-goals?learnerUid=workspace-stranger`, 'parent')).status).toBe(403);
    expect((await request('PATCH', `${base}/learner-goals/${goal.id}`, 'parent', {
      revision: 3,
      state: 'achieved'
    })).status).toBe(403);
  });
  it('records zero academic progress with honest source and date', async () => {
    const body = {
      learnerUid: 'workspace-student',
      classId: cls,
      provider: 'cambrilearn',
      course: 'Mathematics',
      curriculum: 'Foundation I',
      completed: 0,
      total: 24,
      dataAsOf: '2026-10-03'
    };
    expect((await request('POST', `${base}/academic-progress`, 'student', body)).status).toBe(403);
    const result = await request('POST', `${base}/academic-progress`, 'coach', body);
    expect(result.status).toBe(201);
    expect(result.body).toMatchObject({
      completed: 0,
      sourceMethod: 'coach_recorded'
    });
    const view = await request('GET', `${base}/academic-progress?learnerUid=workspace-student`, 'parent');
    expect(view.body.items[0].completed).toBe(0);
    expect((await request('GET', `${base}/academic-progress?learnerUid=workspace-stranger`, 'parent')).status).toBe(403);
    expect((await request('POST', `${base}/academic-progress`, 'coach', {
      ...body,
      completed: 25
    })).status).toBe(400);
    for(const completed of ['',null,[]]) expect((await request('POST', `${base}/academic-progress`, 'coach', {...body,completed})).status).toBe(400);
  });
  it('only admin creates school calendar events', async () => {
    const body = {
      title: 'School showcase',
      startDate: '2026-10-30',
      endDate: '2026-10-30',
      allDay: true
    };
    for (const role of ['coach', 'student', 'parent', 'supervisor']) expect((await request('POST', `${base}/calendar-events`, role, body)).status).toBe(403);
    const result = await request('POST', `${base}/calendar-events`, 'admin', body);
    expect(result.status).toBe(201);
    event = result.body;
  });
  it('all dashboards read the same event and edit conflicts are surfaced', async () => {
    for (const role of ['admin', 'coach', 'student', 'parent']) expect((await request('GET', `${base}/calendar-events?from=2026-10-01&to=2026-10-31`, role)).body.items[0].title).toBe('School showcase');
    const path = `${base}/calendar-events/${event.id}`;
    for (const role of ['coach', 'student', 'parent', 'supervisor']) {
      expect((await request('PATCH', path, role, {
        ...event,
        title: 'Unauthorized'
      })).status).toBe(403);
      expect((await request('DELETE', path, role, {
        revision: 1
      })).status).toBe(403);
    }
    expect((await request('PATCH', path, 'admin', {
      ...event,
      title: 'Updated showcase'
    })).status).toBe(200);
    expect((await request('DELETE', path, 'admin', {
      revision: 1
    })).status).toBe(409);
    expect((await request('DELETE', path, 'admin', {
      revision: 2
    })).status).toBe(200);
  });
  it('rejects impossible calendar dates and backwards times', async () => {
    const body = {
      title: 'Bad date',
      startDate: '2026-02-30',
      endDate: '2026-02-30'
    };
    expect((await request('POST', `${base}/calendar-events`, 'admin', body)).status).toBe(400);
    expect((await request('POST', `${base}/calendar-events`, 'admin', {
      ...body,
      startDate: '2026-13-01'
    })).status).toBe(400);
    expect((await request('POST', `${base}/calendar-events`, 'admin', {
      title: 'Bad time',
      startDate: '2026-10-01',
      allDay: false,
      startTime: '15:00',
      endTime: '14:00'
    })).status).toBe(400);
  });
  it('imports school reference dates idempotently and preserves admin edits', async () => {
    const path = `${base}/calendar-reference/import`;
    expect((await request('POST', path, 'coach', {
      confirmYear: '2026-2027'
    })).status).toBe(403);
    expect((await request('POST', path, 'admin', {
      confirmYear: 'wrong'
    })).status).toBe(400);
    const first = await request('POST', path, 'admin', {
      confirmYear: '2026-2027'
    });
    expect(first.body.created).toBe(37);
    const ref = env.db.collection('schools').doc(school).collection('calendarEvents');
    const imported = (await ref.where('source', '==', 'school_reference_2026_2027').get()).docs[0];
    await imported.ref.update({
      title: 'Admin corrected school date'
    });
    const retry = await request('POST', path, 'admin', {
      confirmYear: '2026-2027'
    });
    expect(retry.body.created).toBe(0);
    expect((await imported.ref.get()).data().title).toBe('Admin corrected school date');
  });
  it('removing an offering class revokes student access while preserving evidence', async () => {
    const path = `${base}/program-offerings/${offeringId}`;
    expect((await request('PATCH', path, 'coach', {
      classIds: [otherClass],
      revision: 1
    })).status).toBe(403);
    expect((await request('PATCH', path, 'admin', {
      classIds: [otherClass],
      revision: 1
    })).status).toBe(200);
    expect((await request('GET', `${path}/lessons`, 'student')).status).toBe(403);
    const saved = await env.db.collection('schools').doc(school).collection('programOfferings').doc(offeringId).collection('submissions').get();
    expect(saved.size).toBe(1);
    expect((await request('PATCH', path, 'admin', {
      classIds: [cls],
      revision: 1
    })).status).toBe(409);
    expect((await request('PATCH', path, 'admin', {
      classIds: [cls],
      revision: 2
    })).status).toBe(200);
  });
  it('revokes a coach scope through profile changes even with an old token', async () => {
    await env.db.collection('users').doc('workspace-coach').update({
      classIds: []
    });
    expect((await request('GET', `${base}/program-offerings/${offeringId}/lessons`, 'coach')).status).toBe(403);
    expect((await request('GET', `${base}/learner-goals?learnerUid=workspace-student&classId=${cls}`, 'coach')).status).toBe(403);
  });
});
