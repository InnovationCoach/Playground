// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/app/i18n/LocaleProvider.jsx', () => ({ useLocale: () => ({ locale: 'en', t: (k) => k }) }));
vi.mock('../src/firebase.js', () => ({
  auth: { currentUser: { uid: 'learner' } }, storage: { ref: vi.fn() }, db: {}, usingEmulators: true,
  doc: vi.fn((...path) => path.slice(1).join('/')), getDoc: vi.fn(), setDoc: vi.fn(), collection: vi.fn(), query: vi.fn(),
  where: vi.fn(), getDocs: vi.fn(), updateDoc: vi.fn(), writeBatch: vi.fn(), arrayUnion: vi.fn(), serverTimestamp: vi.fn()
}));
vi.mock('../src/services/api/apiClient.js', () => ({ schoolRequest: vi.fn() }));
vi.mock('../src/features/coach/classCodes.js', () => ({ loadClasses: vi.fn() }));
vi.mock('../src/services/pblService.js', () => ({ getProgram: vi.fn() }));

import { getDoc } from '../src/firebase.js';
import { schoolRequest } from '../src/services/api/apiClient.js';
import { loadClasses } from '../src/features/coach/classCodes.js';
import { getProgram } from '../src/services/pblService.js';
import { ProgramLibrary } from '../src/features/pbl/programs/ProgramLibrary.jsx';
import { programIdentity } from '../src/features/pbl/programs/catalog.js';
import { saveCustomProgram } from '../src/features/coach/programs/customProgramsStore.js';
import { SchoolLearningPanel } from '../src/features/school/SchoolLearningPanel.jsx';
import { ErrorBoundary } from '../src/features/shell/ErrorBoundary.jsx';
import { hrefFor, parseRoute, redirectFor } from '../src/app/routes.js';
import { TERM } from '../src/features/pbl/content/pblModel.js';

let host, root;
const missing = { exists: () => false };
const found = { exists: () => true, data: () => ({}) };
const show = (ui) => act(async () => { root.render(ui); });

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  getProgram.mockResolvedValue({ status: 'not_found', program: null });
  getDoc.mockResolvedValue(missing);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.clearAllMocks();
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});

describe('assigned programs on the Programs tab', () => {
  const assign = (programId) => loadClasses.mockResolvedValue([{ id: 'c1', name: 'Class 7', programId, programMedia: [], programCovers: {} }]);
  const cards = () => [...host.querySelectorAll('.pg-assigned-card')];
  const library = () => show(<ProgramLibrary uid="learner" isCoach={false} classIds={['c1']} />);

  it('shows a program cached from Firestore that the static list does not have, instead of crashing', async () => {
    // My Courses caches Firestore programs on the device, so programById knows them and PROGRAMS does not.
    saveCustomProgram({ id: 'cached-unit', title: 'Cached unit', phases: [] });
    assign('cached-unit');
    await library();
    expect(cards()).toHaveLength(1);
    expect(cards()[0].textContent).toContain('Cached unit');
    expect(cards()[0].getAttribute('href')).toBe(hrefFor.program('cached-unit'));
  });

  it('resolves a Firestore-only program and survives it having no identity', async () => {
    assign('studio-unit');
    getProgram.mockResolvedValue({ status: 'found', program: { id: 'studio-unit', title: 'Studio unit' } });
    await library();
    expect(getProgram).toHaveBeenCalledWith('studio-unit');
    expect(cards()[0].textContent).toContain('Studio unit');
    expect(cards()[0].dataset.tone).toBe('purple');
  });

  it('leaves out a program that cannot be found, or fails to load, and keeps the library', async () => {
    assign('gone');
    await library();
    expect(cards()).toHaveLength(0);
    expect(host.querySelector('.pg-grid')).toBeTruthy();

    getProgram.mockRejectedValue(new Error('offline'));
    assign('also-gone');
    await act(async () => root.unmount());
    root = createRoot(host);
    await library();
    expect(cards()).toHaveLength(0);
    expect(host.querySelector('.pg-grid')).toBeTruthy();
  });

  it('gives a partial identity its defaults', () => {
    expect(programIdentity(null)).toMatchObject({ icon: 'Compass', tone: 'purple', short: 'Program' });
    expect(programIdentity({ title: 'T', identity: { tone: 'amber' } })).toMatchObject({ icon: 'Compass', tone: 'amber', short: 'T' });
  });
});

describe('error boundary', () => {
  it('contains a crash, offers a retry and leaves the rest of the page', async () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    let broken = true;
    const Flaky = () => { if (broken) throw new Error('boom'); return <p>Recovered</p>; };
    await show(<div><p>Menu</p><ErrorBoundary name="program library"><Flaky /></ErrorBoundary></div>);
    expect(host.textContent).toContain('Menu');
    expect(host.querySelector('[role=alert]').textContent).toContain('program library');
    broken = false;
    await act(async () => host.querySelector('[role=alert] button').click());
    expect(host.textContent).toContain('Recovered');
    quiet.mockRestore();
  });
});

describe('#/programs redirect', () => {
  const programs = parseRoute('#/programs');
  it('sends secondary learners to the PBL Programs tab', () => {
    expect(redirectFor(programs, 'student', false)).toBe('#/pbl/programs');
    expect(parseRoute(redirectFor(programs, 'student', false))).toEqual({ screen: 'pbl', tab: 'programs' });
  });
  it('leaves staff, primary learners and every other route alone', () => {
    for (const role of ['teacher', 'coach', 'admin', 'supervisor', 'parent', null]) expect(redirectFor(programs, role, false)).toBeNull();
    expect(redirectFor(programs, 'student', true)).toBeNull();
    expect(redirectFor(parseRoute('#/pbl/programs'), 'student', false)).toBeNull();
    expect(redirectFor(null, 'student', false)).toBeNull();
  });
});

describe('student enrolment state', () => {
  const context = { role: 'student', schools: [{ id: 'school', name: 'School', timezone: 'Asia/Bangkok' }], classes: [{ id: 'class', name: 'Class', schoolId: 'school' }] };
  const offering = { id: 'o1', programId: 'net-zero-microgrid', title: 'Microgrid', semester: 2, yearId: '2026', classIds: ['class'], status: 'published', revision: 1 };
  const NOT_JOINED = 'You have not joined this program';
  const hasForm = () => !!host.querySelector('.sw-inline-form input[maxlength="30"]');
  const pick = (title) => act(async () => [...host.querySelectorAll('.sw-program')].find((b) => b.textContent.includes(title)).click());
  const serve = (items = []) => schoolRequest.mockImplementation((_, path) => Promise.resolve(path === '/api/learning-context' ? context : path.endsWith('/program-offerings') ? { items } : { items: [] }));
  const panel = () => show(<SchoolLearningPanel initialArea="programs" hideTabs />);

  it('offers the code when there is no enrolment of any kind', async () => {
    serve();
    await panel();
    expect(getDoc).toHaveBeenCalled();
    expect(host.textContent).toContain(NOT_JOINED);
    expect(hasForm()).toBe(true);
  });

  it('treats a legacy cloud portfolio as enrolled in its program only', async () => {
    serve();
    getDoc.mockResolvedValue(found);
    await panel();
    expect(host.textContent).not.toContain(NOT_JOINED);
    expect(hasForm()).toBe(false);
    await pick('Net-Zero');
    expect(host.textContent).toContain(NOT_JOINED);
    expect(hasForm()).toBe(true);
  });

  it('treats a legacy portfolio saved only on this device as enrolled', async () => {
    serve();
    localStorage.setItem(`hearisland.pbl.v1:learner:${TERM.id}`, JSON.stringify({ termId: TERM.id, updatedAt: 5 }));
    await panel();
    expect(getDoc).not.toHaveBeenCalled();
    expect(host.textContent).not.toContain(NOT_JOINED);
    expect(hasForm()).toBe(false);
  });

  it('hides the code form on a program joined through an offering', async () => {
    serve([offering]);
    await panel();
    await pick('Net-Zero');
    expect(host.textContent).not.toContain(NOT_JOINED);
    expect(hasForm()).toBe(false);
  });

  it('stays usable when the legacy read fails', async () => {
    const quiet = vi.spyOn(console, 'warn').mockImplementation(() => {});
    serve();
    getDoc.mockRejectedValue(new Error('offline'));
    await panel();
    expect(hasForm()).toBe(true);
    quiet.mockRestore();
  });

  it('Check access spins on the button and keeps the page mounted', async () => {
    serve();
    await panel();
    const programs = host.querySelector('.sw-programs');
    expect(programs).toBeTruthy();
    let finish;
    schoolRequest.mockImplementation((_, path) => (path === '/api/learning-context' ? new Promise((r) => { finish = () => r(context); }) : Promise.resolve({ items: [] })));
    const button = () => [...host.querySelectorAll('button')].find((b) => b.textContent === 'Check access');
    await act(async () => button().click());
    expect(button().disabled).toBe(true);
    expect(button().querySelector('.sw-spin')).toBeTruthy();
    expect(host.querySelector('.sw-programs')).toBe(programs);
    expect(host.textContent).not.toContain('Checking your school access');
    await act(async () => finish());
    expect(button().disabled).toBe(false);
    expect(button().querySelector('.sw-spin')).toBeNull();
    expect(host.querySelector('.sw-programs')).toBe(programs);
  });

  it('Check access still shows a revoked school rather than stale records', async () => {
    serve();
    await panel();
    const denied = Object.assign(new Error('FORBIDDEN'), { status: 403 });
    schoolRequest.mockRejectedValue(denied);
    await act(async () => [...host.querySelectorAll('button')].find((b) => b.textContent === 'Check access').click());
    expect(host.querySelector('.sw-programs')).toBeNull();
    expect(host.querySelector('[role=alert]')).toBeTruthy();
  });
});
