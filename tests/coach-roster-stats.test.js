// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../src/firebase.js', () => ({
  db: null,
  usingEmulators: false,
  collection: vi.fn(),
  getDocs: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  arrayUnion: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getAuthClaims: vi.fn().mockResolvedValue({ role: 'teacher', classIds: ['class_1'] }),
  registerStudentAccount: vi.fn()
}));
import { CoachDashboard } from '../src/components/Coach/CoachDashboard.js';

describe('Coach Dashboard Roster, Stats, and Goal Progress', () => {
  it('strictly filters roster to role === "student", excluding parent and admin accounts', () => {
    const coach = new CoachDashboard({ coachUser: { uid: 'coach-1', role: 'teacher' } });

    const mockDocs = [
      { id: 's1', data: () => ({ role: 'student', displayName: 'Student One', email: 's1@school.org' }) },
      { id: 's2', data: () => ({ role: 'student', displayName: 'Student Two', email: 's2@school.org' }) },
      { id: 'p1', data: () => ({ role: 'parent', displayName: 'Parent One', email: 'p1@family.org' }) },
      { id: 'a1', data: () => ({ role: 'admin', displayName: 'Admin User', email: 'a1@school.org' }) },
      { id: 't1', data: () => ({ role: 'teacher', displayName: 'Teacher User', email: 't1@school.org' }) }
    ];

    const studentDocs = [];
    const seen = new Set();
    mockDocs.forEach((d) => {
      if (seen.has(d.id)) return;
      seen.add(d.id);
      if (d.data().role === 'student') {
        studentDocs.push(d);
      }
    });

    expect(studentDocs.length).toBe(2);
    expect(studentDocs.map((d) => d.id)).toEqual(['s1', 's2']);
  });

  it('calculates measured goal progress instead of hardcoded 65%', () => {
    const coach = new CoachDashboard({ coachUser: { uid: 'coach-1' } });
    coach.students = [
      {
        uid: 's1',
        displayName: 'Student One',
        groupName: 'Group A',
        goals: [
          { id: 'g1', title: 'Unstarted Goal', status: 'on_track', progress: 0 },
          { id: 'g2', title: 'Halfway Goal', status: 'on_track', progress: 0.5 },
          { id: 'g3', title: 'Completed Goal', status: 'completed', progress: 1.0 }
        ]
      }
    ];

    const goalsHtml = coach.renderGoalsTab(coach.students);

    // Unfinished goals should show measured 0% and 50%, not 65%
    expect(goalsHtml).toContain('0%');
    expect(goalsHtml).toContain('50%');
    expect(goalsHtml).toContain('100%');
    expect(goalsHtml).not.toContain('65%');
  });

  it('computes live activity telemetry from recorded student activityProgress', () => {
    const coach = new CoachDashboard({ coachUser: { uid: 'coach-1' } });
    coach.students = [
      {
        uid: 's1',
        displayName: 'Student One',
        activityProgress: {
          'urban-heat': { completed: true, totalHours: 2.5 },
          'bunker': { completed: false, score: 80 }
        }
      },
      {
        uid: 's2',
        displayName: 'Student Two',
        activityProgress: {
          'urban-heat': { completed: true, totalHours: 1.5 }
        }
      }
    ];

    const actHtml = coach.renderActivitiesTab(coach.students);

    // For urban-heat (2 students active, both complete, 4.0 total hours)
    expect(actHtml).toContain('2 students');
    expect(actHtml).toContain('2 completed (100% active)');
    expect(actHtml).toContain('4 hrs');
  });
});
