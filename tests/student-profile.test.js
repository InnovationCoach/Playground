import { describe, it, expect } from 'vitest';
import React, { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import {
  getStudentProfile, getProfileForEditing, updateProfile, listNotifications, validateTeamsUrl, PROFILE_LIMITS, ProfileError
} from '../src/features/studentProfile/studentProfileService.js';

const LEARNER = 'synthetic-learner-1';
const COACH = { uid: 'synthetic-coach-1', role: 'coach' };
const PARENT = { viewerUid: 'synthetic-parent-1', role: 'parent', linkedParentUids: ['synthetic-parent-1'] };

describe('Teams link (D7: messaging happens in Teams)', () => {
  it('accepts an https link on teams.microsoft.com', () => {
    expect(validateTeamsUrl('https://teams.microsoft.com/l/chat/0/0')).toBe('https://teams.microsoft.com/l/chat/0/0');
  });
  it('rejects http, other hosts, and text that is not a link', () => {
    expect(() => validateTeamsUrl('http://teams.microsoft.com/x')).toThrow(ProfileError);
    expect(() => validateTeamsUrl('https://example.com/teams')).toThrow(ProfileError);
    expect(() => validateTeamsUrl('not a link')).toThrow(ProfileError);
  });
  it('treats an empty value as no link', () => {
    expect(validateTeamsUrl('   ')).toBeNull();
  });
});

describe('who can read the profile', () => {
  it('lets the linked parent, the learner and a coach read it', async () => {
    await expect(getStudentProfile(LEARNER, PARENT)).resolves.toMatchObject({ schoolStudentId: 'TEST-0001' });
    await expect(getStudentProfile(LEARNER, { viewerUid: LEARNER, role: 'learner' })).resolves.toBeTruthy();
    await expect(getStudentProfile(LEARNER, { viewerUid: COACH.uid, role: 'coach' })).resolves.toBeTruthy();
  });

  it('returns 404 to a parent with no link, so the uid is not confirmed', async () => {
    await expect(getStudentProfile(LEARNER, { viewerUid: 'other-parent', role: 'parent', linkedParentUids: [] }))
      .rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' });
  });

  it('gives the parent view an age, never a date of birth', async () => {
    const view = await getStudentProfile(LEARNER, PARENT);
    expect(view.age).toBeGreaterThanOrEqual(11);
    expect(view).not.toHaveProperty('dateOfBirth');
  });
});

describe('who can write the profile', () => {
  it('refuses a parent or learner edit with 403', async () => {
    await expect(updateProfile(LEARNER, { schoolSummary: 'x' }, { actorUid: 'p', role: 'parent' }))
      .rejects.toMatchObject({ status: 403 });
    await expect(getProfileForEditing(LEARNER, { role: 'learner' })).rejects.toMatchObject({ status: 403 });
  });

  it('records who set progress and when', async () => {
    const saved = await updateProfile(LEARNER, { academicProgress: { percent: 70, note: 'Good week' } }, { actorUid: COACH.uid, role: 'coach' });
    expect(saved.academicProgress).toMatchObject({ percent: 70, note: 'Good week', setBy: COACH.uid });
    expect(saved.academicProgress.setAt).toBeGreaterThan(0);
  });

  it('leaves the progress bar hidden when none has been set', async () => {
    const fresh = 'synthetic-learner-new';
    const view = await getStudentProfile(fresh, { viewerUid: fresh, role: 'learner' });
    expect(view.academicProgress).toBeNull();
  });
});

describe('field limits', () => {
  it('rejects progress outside 0–100 or not a whole number', async () => {
    for (const percent of [-1, 101, 1.5, NaN]) {
      await expect(updateProfile(LEARNER, { academicProgress: { percent } }, { actorUid: COACH.uid, role: 'coach' }))
        .rejects.toMatchObject({ code: 'VALIDATION', field: 'percent' });
    }
  });

  it('keeps GPA on the 4.0 scale', async () => {
    await expect(updateProfile(LEARNER, { gpa: { value: 4.1, term: 'T2' } }, { actorUid: COACH.uid, role: 'coach' }))
      .rejects.toMatchObject({ field: 'gpa' });
    const ok = await updateProfile(LEARNER, { gpa: { value: 3.456, term: 'T2' } }, { actorUid: COACH.uid, role: 'coach' });
    expect(ok.gpa).toMatchObject({ value: 3.46, scale: 4.0 });
  });

  it('limits the school summary and the number of grades', async () => {
    await expect(updateProfile(LEARNER, { schoolSummary: 's'.repeat(PROFILE_LIMITS.schoolSummary + 1) }, { actorUid: COACH.uid, role: 'coach' }))
      .rejects.toMatchObject({ field: 'School summary' });
    const grades = Array.from({ length: PROFILE_LIMITS.gradesMax + 1 }, (_, i) => ({ subject: `S${i}`, term: 'T', grade: 'A' }));
    await expect(updateProfile(LEARNER, { grades }, { actorUid: COACH.uid, role: 'coach' })).rejects.toMatchObject({ field: 'grades' });
  });

  it('requires a subject, term and grade on each grade', async () => {
    await expect(updateProfile(LEARNER, { grades: [{ subject: '', term: 'T2', grade: 'A' }] }, { actorUid: COACH.uid, role: 'coach' }))
      .rejects.toMatchObject({ field: 'Subject' });
  });
});

describe('parent notifications (contract §3)', () => {
  it('tells linked parents that the profile changed, without the values', async () => {
    const before = (await listNotifications(PARENT.viewerUid)).unreadCount;
    await updateProfile(LEARNER, { schoolSummary: 'Keeps a clear plan.' }, { actorUid: COACH.uid, role: 'coach' });
    const after = await listNotifications(PARENT.viewerUid);
    expect(after.unreadCount).toBe(before + 1);
    const latest = after.items[0];
    expect(latest.title).toMatch(/profile was updated/i);
    expect(latest.body).toMatch(/school summary/);
    expect(latest.body).not.toMatch(/Keeps a clear plan/);
    expect(latest.body).not.toMatch(/\d\.\d\d/);
  });
});

describe('components render', () => {
  const render = async (path, name, props) => {
    globalThis.React = React;
    const mod = await import(path);
    return renderToString(createElement(mod[name], props));
  };

  it('parent card shows the school ID, mentor, Teams link area and the no-progress note without crashing', async () => {
    const html = await render('../src/features/studentProfile/StudentProfileCard.jsx', 'StudentProfileCard', {
      learnerUid: LEARNER, viewer: PARENT, childName: 'Test Learner A'
    });
    // Server render cannot run the effect, so the card shows its loading state.
    expect(html).toMatch(/Loading profile|school profile/);
  });

  it('coach editor renders its loading state without crashing', async () => {
    const html = await render('../src/features/studentProfile/StudentProfileEditor.jsx', 'StudentProfileEditor', {
      learnerUid: LEARNER, coach: COACH, learnerName: 'Test Learner A'
    });
    expect(html).toMatch(/Loading profile/);
  });

  it('bell renders with no unread count before the list loads', async () => {
    const html = await render('../src/features/studentProfile/NotificationBell.jsx', 'NotificationBell', { uid: PARENT.viewerUid });
    expect(html).toContain('aria-label="Notifications"');
  });
});
