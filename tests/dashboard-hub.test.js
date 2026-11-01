import { describe, it, expect, vi } from 'vitest';
import { signInDestination } from '../src/app/landing.js';
import { hrefFor } from '../src/app/routes.js';

vi.mock('../src/firebase.js', () => ({
  db: {}, collection: (_db, name) => name, query: (ref, filter) => ({ ref, filter }),
  where: (...args) => args, getDocs: vi.fn(), getDoc: vi.fn(), doc: (_db, ...path) => path.join('/')
}));
vi.mock('../src/services/pblService.js', () => ({ getProgram: vi.fn() }));
vi.mock('../src/features/coach/classCodes.js', () => ({ loadClasses: vi.fn() }));
vi.mock('../src/features/pbl/programs/useProgramProgress.js', () => ({ readLocalProgress: vi.fn() }));
import { loadDashboardCourses } from '../src/features/dashboard/dashboardCourses.js';

const program = (id) => ({ id, sessions: [{ sessionNumber: 1, title: 'First investigation', activities: [] }], phases: [] });
const snap = (rows) => ({ forEach: (fn) => rows.forEach((data) => fn({ data: () => data })) });
const services = (overrides = {}) => ({
  getDocs: vi.fn().mockResolvedValue(snap([])), loadClasses: vi.fn().mockResolvedValue([]),
  getProgram: vi.fn(async (id) => ({ status: 'found', program: program(id) })),
  getDoc: vi.fn().mockResolvedValue({ exists: false }), readLocalProgress: vi.fn().mockReturnValue(null), ...overrides
});

describe('student landing and role boundaries', () => {
  it('lands students on their dashboard and preserves other role defaults', () => {
    expect(signInDestination('student', false, '')).toBe(hrefFor.dashboard());
    for (const role of ['coach', 'teacher', 'parent', 'admin', 'supervisor']) expect(signInDestination(role, false, '')).toBe(hrefFor.spark());
    expect(signInDestination('student', true, '')).toBeNull();
  });
  it('preserves requested deep links including student courses and staff pages', () => {
    for (const route of ['#/courses', '#/pbl/programs/garden/plan', '#/settings', '#/coach/learners/one']) expect(signInDestination('student', false, route)).toBeNull();
  });
});

describe('dashboard course loading', () => {
  it('queries only this learner, combines assignments, deduplicates and prioritises the active program', async () => {
    const api = services({ getDocs: vi.fn().mockResolvedValue(snap([{ programId: 'garden' }, { programId: 'past', status: 'completed' }])), loadClasses: vi.fn().mockResolvedValue([{ programId: 'garden' }, { programId: 'city' }]) });
    const result = await loadDashboardCourses('student-a', ['class-a'], 'city', api);
    expect(api.getDocs).toHaveBeenCalledWith({ ref: 'enrolments', filter: ['learnerId', '==', 'student-a'] });
    expect(result.courses.map((c) => c.program.id)).toEqual(['city', 'garden']);
    expect(api.getProgram).toHaveBeenCalledTimes(2);
    expect(result.warnings).toEqual([]);
  });
  it('reports permission/network failure while retaining readable assignments', async () => {
    const api = services({ getDocs: vi.fn().mockRejectedValue(new Error('denied')), loadClasses: vi.fn().mockResolvedValue([{ programId: 'garden' }, { error: true }]), getDoc: vi.fn().mockRejectedValue(new Error('offline')) });
    const result = await loadDashboardCourses('student-a', ['class-a'], null, api);
    expect(result.warnings).toHaveLength(2);
    expect(result.courses[0]).toMatchObject({ summary: null, progressUnavailable: true });
  });
  it('uses newer account progress and never invents progress for an empty account', async () => {
    const api = services({ getDoc: vi.fn().mockResolvedValue({ exists: true, data: () => ({ programId: 'garden', startedAt: 1, updatedAt: 5, sessions: { 1: { done: true } } }) }) });
    const result = await loadDashboardCourses('student-a', [], 'garden', api);
    expect(result.courses[0].summary).toMatchObject({ done: 1, total: 1, pct: 100 });
    expect((await loadDashboardCourses('student-b', [], null, services())).courses).toEqual([]);
  });
});

describe('dashboard course loading: renumbered courses', () => {
  it('does not count progress saved under the old per-stage numbers', async () => {
    const renumbered = (id) => ({ ...program(id), renumbered: true });
    const api = services({ getProgram: vi.fn(async (id) => ({ status: 'found', program: renumbered(id) })),
      getDoc: vi.fn().mockResolvedValue({ exists: true, data: () => ({ programId: 'garden', startedAt: 1, updatedAt: 5, sessions: { 1: { done: true } } }) }) });
    const result = await loadDashboardCourses('student-a', [], 'garden', api);
    expect(result.courses[0]).toMatchObject({ summary: null, needsRecheck: true, progressUnavailable: false });
  });
});
