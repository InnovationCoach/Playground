import { describe, expect, it, vi } from 'vitest';
import { EdmentumApiClient } from '../server/lib/edmentumClient.js';
import {
  emptyStudentDashboardVariables,
  emptyCoachDashboardVariables,
  emptyAdminDashboardVariables,
  mapStudentDashboardVariables,
  mapCoachDashboardVariables,
  mapAdminDashboardVariables
} from '../shared/edmentumVariables.js';

function makeJsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'application/json' },
    json: async () => body,
    text: async () => JSON.stringify(body)
  };
}

describe('EdmentumApiClient', () => {
  it('reports unconfigured state truthfully and lists missing variables', async () => {
    const client = new EdmentumApiClient({
      clientId: '',
      clientSecret: '',
      username: '',
      password: '',
      bearerToken: ''
    });

    expect(client.isConfigured()).toBe(false);
    expect(client.getConfigStatus()).toMatchObject({
      configured: false,
      authMode: 'unconfigured',
      missingVariables: [
        'EDMENTUM_CLIENT_ID',
        'EDMENTUM_CLIENT_SECRET',
        'EDMENTUM_USERNAME',
        'EDMENTUM_PASSWORD'
      ]
    });
    await expect(client.getPrograms()).rejects.toMatchObject({
      status: 503,
      code: 'EDMENTUM_NOT_CONFIGURED'
    });
  });

  it('acquires and caches OAuth2 password grant token and calls v2 endpoints', async () => {
    const fetchMock = vi.fn(async (url, opts) => {
      if (url === 'https://auth.edmentum.com/connect/token') {
        expect(opts.method).toBe('POST');
        expect(opts.headers.Authorization).toBe(`Basic ${Buffer.from('cid:csec').toString('base64')}`);
        expect(opts.body).toContain('grant_type=password');
        expect(opts.body).toContain('username=jsmith%40MySchool');
        return makeJsonResponse(200, { access_token: 'tok-1', expires_in: 3600 });
      }
      if (url === 'https://app.edmentum.com/api/admincenter/v2.0/programs') {
        expect(opts.headers.Authorization).toBe('Bearer tok-1');
        return makeJsonResponse(200, { Results: [{ ProgramId: 101, ProgramTitle: 'Courseware' }] });
      }
      if (url.startsWith('https://app.edmentum.com/api/courseware/v2.0/classes/55/gradetracker/activityscores')) {
        return makeJsonResponse(200, { Results: [{ ResourceNodeId: 9, LearnerUserId: 7, Score: 92 }] });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    const client = new EdmentumApiClient({
      clientId: 'cid',
      clientSecret: 'csec',
      username: 'jsmith@MySchool',
      password: 'pw',
      fetchImpl: fetchMock
    });

    const programs = await client.getPrograms();
    expect(programs.Results[0].ProgramId).toBe(101);

    const scores = await client.getClassActivityScores(55, { learnerUserId: 7 });
    expect(scores.Results[0].Score).toBe(92);

    // Token endpoint called once due to caching
    const tokenCalls = fetchMock.mock.calls.filter(([u]) => u.includes('/connect/token'));
    expect(tokenCalls).toHaveLength(1);
  });

  it('supports direct bearer token mode without calling tokenUrl', async () => {
    const fetchMock = vi.fn(async (url, opts) => {
      expect(opts.headers.Authorization).toBe('Bearer static-jwt');
      return makeJsonResponse(200, { Results: [] });
    });
    const client = new EdmentumApiClient({
      bearerToken: 'static-jwt',
      fetchImpl: fetchMock
    });
    expect(client.getConfigStatus().authMode).toBe('bearer_token');
    await client.getLocations();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('Edmentum dashboard variable mappers', () => {
  it('returns truthful empty states for student, coach, and admin', () => {
    expect(emptyStudentDashboardVariables().providerStatus).toBe('not_connected');
    expect(emptyCoachDashboardVariables().providerStatus).toBe('not_connected');
    expect(emptyAdminDashboardVariables().providerStatus).toBe('not_connected');
  });

  it('maps Student Dashboard starting variables', () => {
    const result = mapStudentDashboardVariables({
      user: { UserId: 7, PlatoName: 'ava.m', FirstName: 'Ava', LastName: 'M', SisId: 'SIS-7', Grade: '8', IsActive: true },
      classes: [{ ClassId: 55, ProgramId: 101, Name: 'Algebra 1', ResourceNodeName: 'Algebra 1A', IsActive: true, IsComplete: false, MasteryTestThreshold: 80 }],
      progressByClass: { 55: { Results: [{ LearnerUserId: 7, ActivitiesCompleted: 6, ActivitiesTotal: 10 }] } },
      gradesByClass: { 55: { Results: [{ LearnerUserId: 7, CurrentGrade: 88.5, CourseGrade: 86, OnTargetGrade: 85 }] } },
      timeOnTaskByClass: { 55: { Results: [{ LearnerUserId: 7, TimeOnTaskInMilliseconds: 1800000 }] } },
      activitiesByClass: { 55: { Results: [{ ResourceNodeId: 9, ActivityTitle: 'Linear Equations', GradetrackerCategoryName: 'Mastery Test', GradetrackerPossibleScore: 100 }] } },
      activityScoresByClass: { 55: { Results: [{ ResourceNodeId: 9, LearnerUserId: 7, Score: 92, ScoreDate: '2026-11-19T10:00:00Z' }] } }
    });

    expect(result.providerStatus).toBe('connected');
    expect(result.student.edmentumUserId).toBe(7);
    expect(result.summary).toEqual({
      enrolledClassCount: 1,
      completedClassCount: 0,
      overallProgressPercent: 60,
      averageCurrentGrade: 88.5,
      totalTimeOnTaskSeconds: 1800
    });
    expect(result.recentScores[0]).toMatchObject({
      activityTitle: 'Linear Equations',
      score: 92,
      possibleScore: 100
    });
  });

  it('maps Coach Dashboard starting variables', () => {
    const result = mapCoachDashboardVariables({
      program: { ProgramId: 101, ProgramTitle: 'WeLearn Courseware' },
      classDetails: [{ ClassId: 55, Name: 'Biology', ResourceNodeName: 'Biology A', IsActive: true, Teachers: [{}], Learners: [] }],
      classUsersByClass: { 55: { Results: [{ UserId: 7, PlatoName: 'ava.m', FirstName: 'Ava', LastName: 'M', Role: 'Learner', Grade: '8' }] } },
      progressByClass: { 55: { Results: [{ LearnerUserId: 7, ActivitiesCompleted: 4, ActivitiesTotal: 8 }] } },
      gradesByClass: { 55: { Results: [{ LearnerUserId: 7, CurrentGrade: 91, CourseGrade: 90, OnTargetGrade: 88 }] } },
      timeOnTaskByClass: { 55: { Results: [{ LearnerUserId: 7, TimeOnTaskInMilliseconds: 600000 }] } },
      alertsSummary: { Results: [{ UserId: 7, AlertSummary: { MasteryTestLocks: 1 } }] }
    });

    expect(result.program.programId).toBe(101);
    expect(result.summary).toMatchObject({
      classCount: 1,
      activeClassCount: 1,
      learnerCount: 1,
      averageProgressPercent: 50,
      averageCurrentGrade: 91,
      alertCount: 1
    });
    expect(result.learners[0].alertSummary).toEqual({ MasteryTestLocks: 1 });
  });

  it('maps Admin Dashboard starting variables', () => {
    const result = mapAdminDashboardVariables({
      programs: { Results: [{ ProgramId: 101, ProgramTitle: 'Courseware', Application: 'Courseware', AccessType: 'Full', IsEOAProgram: false }] },
      locations: { Locations: [{ LocationId: 1, Name: 'Main Campus' }] },
      users: {
        Results: [
          { UserId: 1, Role: 'Administrator', IsActive: true },
          { UserId: 2, Role: 'Instructor', IsActive: true },
          { UserId: 3, Role: 'Learner', IsActive: false }
        ]
      },
      classes: { Results: [{ ClassId: 55, IsActive: true }] },
      timeOnSystem: { Results: [{ UserId: 3, Date: '2026-11-19', TimeOnSystemSeconds: 2400 }] }
    });

    expect(result.summary).toEqual({
      programCount: 1,
      locationCount: 1,
      totalUsers: 3,
      activeUsers: 2,
      learnerCount: 1,
      instructorCount: 1,
      adminCount: 1,
      totalClasses: 1,
      activeClasses: 1,
      graduatedCourseCount: 0,
      totalTimeOnSystemSeconds: 2400
    });
  });

  it('sends compliant Courseware v2.0 lock/unlock and roster write requests', async () => {
    const calls = [];
    const mockFetch = async (url, init = {}) => {
      calls.push({ url, method: init.method || 'GET', body: init.body ? JSON.parse(init.body) : null });
      return {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ ok: true })
      };
    };

    const client = new EdmentumApiClient({
      baseUrl: 'https://app.edmentum.com/api',
      bearerToken: 'test-token',
      fetchImpl: mockFetch
    });

    await client.setClassResourceNodeStatus(330, 9001, { isLocked: true });
    await client.setClassUserResourceNodeStatus(330, 210501054, 9001, { isLocked: false });
    await client.getEnrollableUsers(330, { pageSize: 50, skip: 0 });
    await client.enrollUserInClass(330, 210501054, { startDate: '2026-11-23' });
    await client.withdrawUserFromClass(330, 210501054);
    await client.transferClassUser(331, { learnerUserId: 210501054, sourceClassroomId: 330 });
    await client.createUser({ PlatoName: 'new.learner', FirstName: 'New', LastName: 'Learner', Role: 'Learner', Grade: 10, IsActive: true, Password: 'Pass123!' });
    await client.deleteUser(210501054);

    expect(calls[0]).toEqual({
      url: 'https://app.edmentum.com/api/courseware/v2.0/classes/330/resourcenodes/9001/status',
      method: 'PUT',
      body: { ClassId: 330, ResourceNodeId: 9001, IsLocked: true }
    });
    expect(calls[1]).toEqual({
      url: 'https://app.edmentum.com/api/courseware/v2.0/classes/330/users/210501054/resourcenodes/9001/status',
      method: 'PUT',
      body: { ClassId: 330, UserId: 210501054, ResourceNodeId: 9001, IsLocked: false }
    });
    expect(calls[2].url).toBe('https://app.edmentum.com/api/courseware/v2.0/classes/330/enrollableusers?%24pagesize=50&%24skip=0');
    expect(calls[3]).toEqual({
      url: 'https://app.edmentum.com/api/courseware/v2.0/classes/330/users/210501054?startDate=2026-11-23',
      method: 'POST',
      body: null
    });
    expect(calls[4].method).toBe('DELETE');
    expect(calls[5]).toEqual({
      url: 'https://app.edmentum.com/api/courseware/v2.0/classes/331/transfer',
      method: 'POST',
      body: { LearnerUserId: 210501054, SourceClassroomId: 330 }
    });
    expect(calls[6].method).toBe('POST');
    expect(calls[7]).toEqual({
      url: 'https://app.edmentum.com/api/admincenter/v2.0/users/210501054',
      method: 'DELETE',
      body: null
    });
  });
});
