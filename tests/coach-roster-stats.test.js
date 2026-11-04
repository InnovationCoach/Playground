// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDocs, getAuthClaims } from '../src/firebase.js';

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
  getAuthClaims: vi.fn(),
  registerStudentAccount: vi.fn()
}));
import { CoachDashboard } from '../src/components/Coach/CoachDashboard.js';

describe('Coach Dashboard Roster, Stats, and Goal Progress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exercises loadData() and strictly filters roster to role === "student", excluding parent and admin accounts', async () => {
    getAuthClaims.mockResolvedValueOnce({ role: 'teacher', classIds: ['class_1'] });

    const mockDocs = [
      { id: 's1', data: () => ({ role: 'student', displayName: 'Student One', email: 's1@school.org' }) },
      { id: 's2', data: () => ({ role: 'student', displayName: 'Student Two', email: 's2@school.org' }) },
      { id: 'p1', data: () => ({ role: 'parent', displayName: 'Parent One', email: 'p1@family.org' }) },
      { id: 'a1', data: () => ({ role: 'admin', displayName: 'Admin User', email: 'a1@school.org' }) },
      { id: 't1', data: () => ({ role: 'teacher', displayName: 'Teacher User', email: 't1@school.org' }) }
    ];

    getDocs.mockImplementation(async (q) => {
      return { docs: mockDocs, forEach: (fn) => mockDocs.forEach(fn) };
    });

    const coach = new CoachDashboard({ coachUser: { uid: 'coach-1', role: 'teacher' } });
    await coach.loadData();

    expect(coach.students.length).toBe(2);
    expect(coach.students.map((s) => s.uid)).toEqual(['s1', 's2']);
  });

  it('enforces school/class isolation: empty class roster stays empty without fallback to demo or global queries', async () => {
    getAuthClaims.mockResolvedValueOnce({ role: 'teacher', classIds: ['class_empty'] });

    getDocs.mockImplementation(async () => {
      return { docs: [], forEach: () => {} };
    });

    const coach = new CoachDashboard({ coachUser: { uid: 'coach-1', role: 'teacher', classIds: ['class_empty'] } });
    await coach.loadData();

    expect(coach.students).toEqual([]);
    // Scoped queries run for users, assignments, weeklyTasks on class_empty (3 calls), never falling back to demo class or global users
    expect(getDocs).toHaveBeenCalledTimes(3);
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

  it('does not read any roster when signed class access is absent', async () => {
    getAuthClaims.mockResolvedValueOnce({ role: 'teacher', classIds: [] });
    const coach = new CoachDashboard({ coachUser: { uid:'coach-1', classIds:['forged-class'], groupName:'Demo class' } });
    await coach.loadData();
    expect(getDocs).not.toHaveBeenCalled();
    expect(coach.students).toEqual([]);
    expect(coach.loadError).toContain('access is missing');
  });

  it('renders student names, goals and activity text literally', () => {
    const payload = '<img src=x onerror="window.pwned=true">';
    const coach = new CoachDashboard({ coachUser:{ uid:'coach-1' } });
    const student = { uid:'s1', displayName:payload, email:'anna@pilot.test', groupName:payload, dailyStats:[], goals:[{ title:payload }], activityProgress:{ 'urban-heat':{ notes:payload, cooling:0 } } };
    const host = document.createElement('div');
    host.innerHTML = coach.renderStudentModal(student) + coach.renderGoalsTab([student]);
    expect(host.querySelector('img')).toBeNull();
    expect(host.textContent).toContain(payload);
    expect(host.textContent).toContain('Completion not recorded');
    expect(host.textContent).not.toContain('365 Days');
  });

  it('restores the previous rating and reports a failed save', async () => {
    const { setDoc } = await import('../src/firebase.js');
    setDoc.mockRejectedValueOnce(new Error('permission denied'));
    const coach = new CoachDashboard({ coachUser:{ uid:'coach-1' } });
    coach.container.innerHTML = '<label><select class="student-rating" data-uid="s1"><option value="0">Not rated</option><option value="4">4</option></select><small class="rating-status"></small></label>';
    coach.attachInspectEvents();
    const select = coach.container.querySelector('select');
    select.value = '4'; select.dispatchEvent(new Event('change'));
    await vi.waitFor(() => expect(select.disabled).toBe(false));
    expect(select.value).toBe('0');
    expect(coach.container.textContent).toContain('not saved');
    expect(coach.studentRatings.s1).toBeUndefined();
  });

  it('computes live activity telemetry without adding an estimated 0.5hr duration fallback when missing', () => {
    const coach = new CoachDashboard({ coachUser: { uid: 'coach-1' } });
    coach.students = [
      {
        uid: 's1',
        displayName: 'Student One',
        activityProgress: {
          'urban-heat': { completed: true, totalHours: 2.5 },
          'bunker': { completed: false, score: 80 } // no duration field
        }
      },
      {
        uid: 's2',
        displayName: 'Student Two',
        activityProgress: {
          'urban-heat': { completed: true, totalHours: 1.5 },
          'bunker': { completed: true } // no duration field
        }
      }
    ];

    const actHtml = coach.renderActivitiesTab(coach.students);

    // For urban-heat (2 students active, both complete, 4.0 total hours)
    expect(actHtml).toContain('2 students');
    expect(actHtml).toContain('2 completed (100% active)');
    expect(actHtml).toContain('4 hrs');

    // For bunker (2 active, 1 complete, 0 recorded hours - MUST NOT add 0.5 hrs per student)
    expect(actHtml).toContain('0 hrs');
    expect(actHtml).not.toContain('1 hrs');
  });
});
