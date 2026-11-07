// @vitest-environment jsdom
/**
 * A coach preview renders the real student course view, and writes nothing:
 * no enrolment, no progress document, no local save.
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const firebase = vi.hoisted(() => ({
  listeners: new Map(),
  batchSet: vi.fn(),
  getDoc: vi.fn(async () => ({ exists: false, data: () => null })),
  setDoc: vi.fn(async () => {}),
  updateDoc: vi.fn(async () => {}),
  addDoc: vi.fn(async () => ({ id: 'x' })),
  commit: vi.fn(async () => {}),
  runTransaction: vi.fn(async () => {})
}));

vi.mock('../src/firebase.js', () => ({
  db: {},
  auth: {},
  storage: {},
  usingEmulators: true,
  doc: (_d, ...p) => ({ path: p.join('/') }),
  collection: (_d, ...p) => ({ path: p.join('/') }),
  getDoc: firebase.getDoc,
  getDocs: async () => ({ forEach: () => {}, docs: [] }),
  setDoc: firebase.setDoc,
  updateDoc: firebase.updateDoc,
  addDoc: firebase.addDoc,
  writeBatch: () => ({ set: firebase.batchSet, update: () => {}, commit: firebase.commit }),
  runTransaction: firebase.runTransaction,
  query: (r) => r,
  where: () => ({}),
  orderBy: () => ({}),
  limit: () => ({}),
  onSnapshot: (ref, cb) => { firebase.listeners.set(ref.path, cb); return () => {}; },
  arrayUnion: (...x) => x,
  arrayRemove: (...x) => x,
  serverTimestamp: () => 0,
  increment: () => 0
}));

const { StudentProgramPreview } = await import('../src/features/pbl/programs/ProgramDetail.jsx');
const { programFromUnit } = await import('../src/features/coach/library/programLibraryModel.js');
const { PBL_STAGES } = await import('../shared/pblUnitSchema.js');
const { CoachNotificationBell } = await import('../src/features/coach/library/CoachNotificationBell.jsx');
const { getProgram } = await import('../src/services/pblService.js');
const { saveCustomProgram } = await import('../src/features/coach/programs/customProgramsStore.js');

const unit = {
  id: 'prog-1', unitTitle: 'Rainwater Rescue', theme: 'Water', drivingQuestion: 'How might we reuse rainwater?',
  realProblem: { summary: 'The courtyard floods.', peopleImpact: 'Safer paths', environmentalImpact: 'Less mains water' },
  makerSpaceSpecs: [{ toolType: 'Microcontroller', specs: 'micro:bit', safetyGuidelines: 'Stay dry' }],
  coachCues: { leadCoach: 'Lead' },
  milestones: PBL_STAGES.map((s) => ({
    id: `ms-${s.stageNumber}`, stageNumber: s.stageNumber, stageName: s.stageName, title: `${s.stageName} work`, week: s.week,
    durationMin: 90, learningGoal: 'Goal', activities: ['Do it'], makerSpaceTools: ['Bench'], evidencePrompt: 'Show it',
    allowedSubmissions: ['video'], coachCue: 'Secret coach cue', competencies: []
  }))
};
const program = programFromUnit(unit, 'coach-a').view;
const linkFor = (_id, section) => `#/program-library/prog-1/preview/draft${section ? `/${section}` : ''}`;

let host;
let root;
const render = (section) => act(async () => {
  root.render(<StudentProgramPreview program={program} section={section} linkFor={linkFor} backHref="#/program-library" />);
});
const expectNoWrites = () => {
  expect(firebase.setDoc).not.toHaveBeenCalled();
  expect(firebase.updateDoc).not.toHaveBeenCalled();
  expect(firebase.addDoc).not.toHaveBeenCalled();
  expect(firebase.commit).not.toHaveBeenCalled();
  expect(firebase.runTransaction).not.toHaveBeenCalled();
};

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  Object.values(firebase).forEach((f) => f.mockClear?.());
  firebase.listeners.clear();
  localStorage.clear();
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.useRealTimers();
});

describe('StudentProgramPreview', () => {
  it('shows the learner view with all eight stages, and no coach-only sections', async () => {
    await render(null);
    expect(host.querySelector('h1').textContent).toBe('Rainwater Rescue');
    expect(host.querySelectorAll('.pb-term-strip li')).toHaveLength(8);
    const tabs = [...host.querySelectorAll('.pb-tabs a')].map((a) => a.textContent);
    expect(tabs.join()).toMatch(/Term plan/);
    expect(tabs.join()).not.toMatch(/Teaching guide|Checks/);
    expect(host.textContent).not.toContain('Secret coach cue');
  });

  it('keeps navigation inside the preview', async () => {
    await render(null);
    const hrefs = [...host.querySelectorAll('.pb-tabs a')].map((a) => a.getAttribute('href'));
    hrefs.forEach((href) => expect(href).toMatch(/^#\/program-library\/prog-1\/preview\/draft/));
    expect(host.querySelector('.pg-back').getAttribute('href')).toBe('#/program-library');
    expect(host.querySelector('.pg-learner-bar a').getAttribute('href')).toBe(linkFor('prog-1', 'plan'));
  });

  it('starting and working through the course changes the screen but saves nothing', async () => {
    await render(null);
    await act(async () => host.querySelector('.pg-learner-bar a').click());
    expect(host.querySelector('.pg-learner-meter')).toBeTruthy();

    await render('plan');
    const done = host.querySelector('.pg-done');
    expect(done).toBeTruthy();
    await act(async () => done.click());
    expect(host.querySelector('.pg-learner-meter').textContent).toContain('1 of 8');

    await act(async () => { vi.advanceTimersByTime(10000); });
    expectNoWrites();
    expect(localStorage.length).toBe(0);
  });
});

describe('getProgram after a republish', () => {
  const liveDoc = (title) => ({ exists: true, id: 'prog-1', data: () => ({ ...programFromUnit({ ...unit, unitTitle: title }, 'coach-a').data }) });

  it('serves the published copy, not this device\'s older cache', async () => {
    saveCustomProgram({ ...program, title: 'Old title' });
    firebase.getDoc.mockResolvedValueOnce(liveDoc('New title'));
    await expect(getProgram('prog-1')).resolves.toMatchObject({ status: 'found', program: { title: 'New title' } });
  });

  it('still falls back to the cache when Firestore cannot be reached', async () => {
    saveCustomProgram({ ...program, title: 'Cached title' });
    firebase.getDoc.mockRejectedValueOnce(new Error('offline'));
    await expect(getProgram('prog-1')).resolves.toMatchObject({ status: 'found', program: { title: 'Cached title' } });
  });
});

describe('CoachNotificationBell', () => {
  const snapshot = (docs) => ({ docs: docs.map((d) => ({ id: d.id, data: () => d })) });
  const note = (id, actorUid = 'other') => ({ id, type: 'program_review', programId: id, orgId: 'org-welearn', actorUid, actorName: 'Manni', programTitle: `Program ${id}`, createdAt: 1 });
  const emit = (docs, reads = []) => act(async () => {
    firebase.listeners.get('coach_notifications')(snapshot(docs));
    firebase.listeners.get('users/me/notificationReads')(snapshot(reads.map((id) => ({ id }))));
  });
  const bell = () => act(async () => { root.render(<CoachNotificationBell uid="me" orgId="org-welearn" />); });
  const label = () => host.querySelector('.sp-bell-btn').getAttribute('aria-label');

  it('toasts a coach\'s very first notification, after an empty first load', async () => {
    await bell();
    await emit([]);
    expect(host.querySelector('.pl-toast')).toBeNull();
    await emit([note('a')]);
    expect(host.querySelector('.pl-toast').textContent).toContain('Manni added Program a for review.');
    expect(label()).toBe('Notifications, 1 unread');
  });

  it('shows waiting notifications as unread at sign-in, without a toast', async () => {
    await bell();
    await emit([note('a'), note('b')]);
    expect(label()).toBe('Notifications, 2 unread');
    expect(host.querySelector('.pl-toast')).toBeNull();
  });

  it('never shows a coach their own program, and honours read state', async () => {
    await bell();
    await emit([note('mine', 'me'), note('a')], ['a']);
    expect(label()).toBe('Notifications');
    await act(async () => host.querySelector('.sp-bell-btn').click());
    expect(host.querySelectorAll('.sp-bell-item')).toHaveLength(1);
    expect(host.querySelector('.sp-bell-item').className).not.toContain('is-unread');
  });

  it('marks as read and opens the draft preview on click', async () => {
    await bell();
    await emit([note('a')]);
    await act(async () => host.querySelector('.sp-bell-btn').click());
    await act(async () => host.querySelector('.sp-bell-item').click());
    expect(firebase.commit).toHaveBeenCalledTimes(1);
    expect(window.location.hash).toBe('#/program-library/a/preview/draft');
  });
});
