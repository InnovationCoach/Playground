/**
 * Phase 0 (front-end groundwork): the pure pieces behind the admin console,
 * settings, My Courses and parent portal.
 *
 * The mock backend is tested against the Phase A contract because the screens
 * are built on it: if it drifts from docs/BACKEND-PHASE-A-PROMPT-FOR-GEMINI.md,
 * the UI will break the day the real API replaces it.
 */
import { describe, it, expect } from 'vitest';
import { createMockBackend } from '../src/services/api/mockBackend.js';
import { DEMO_PARENT_INVITE_CODE } from '../src/services/api/mockFixtures.js';
import { pageRange, nextTokens, toggleSort } from '../src/features/admin/ui/pagination.js';
import { parseRoute } from '../src/app/routes.js';
import { resolveRole, consolePermissions } from '../src/app/roles.js';
import { messages, translate } from '../src/app/i18n/messages.js';

const admin = { uid: 'caller-admin', role: 'admin', name: 'Test Admin', email: 'admin@welearn.test' };
const supervisor = { uid: 'caller-sup', role: 'supervisor', name: 'Test Sup', email: 'sup@welearn.test' };
const teacher = { uid: 'caller-teacher', role: 'teacher', name: 'Test Teacher', email: 't@welearn.test' };
const parent = { uid: 'caller-parent', role: 'parent', name: 'Test Parent', email: 'p@welearn.test' };
const student = { uid: 'caller-student', role: 'student', name: 'Kid', email: 'k@welearn.test' };

const fresh = () => createMockBackend({ latencyMs: 0 });
const call = (api, caller, method, path, extra = {}) => api.handle({ method, path, caller, ...extra });

describe('mock backend follows the §7 contract', () => {
  it('lists students 30 at a time with a total, like "Displaying 1–30 of 129"', async () => {
    const api = fresh();
    const page1 = await call(api, admin, 'GET', '/api/admin/users', { query: { role: 'student', pageSize: 30 } });
    expect(page1.status).toBe(200);
    expect(page1.body.total).toBe(129);
    expect(page1.body.items).toHaveLength(30);
    expect(page1.body.nextPageToken).toBeTruthy();

    // Walk every page: 129 unique students, the last page has 9, then no token.
    const seen = new Set(page1.body.items.map((u) => u.uid));
    let token = page1.body.nextPageToken;
    let last;
    while (token) {
      last = await call(api, admin, 'GET', '/api/admin/users', { query: { role: 'student', pageSize: 30, pageToken: token } });
      last.body.items.forEach((u) => seen.add(u.uid));
      token = last.body.nextPageToken;
    }
    expect(seen.size).toBe(129);
    expect(last.body.items).toHaveLength(9);
  });

  it('accepts several roles for the staff list and never returns dateOfBirth in lists', async () => {
    const api = fresh();
    const res = await call(api, admin, 'GET', '/api/admin/users', { query: { role: 'admin,supervisor,teacher', pageSize: 100 } });
    expect(new Set(res.body.items.map((u) => u.role))).toEqual(new Set(['admin', 'supervisor', 'teacher']));
    const students = await call(api, admin, 'GET', '/api/admin/users', { query: { role: 'student', pageSize: 100 } });
    students.body.items.forEach((u) => expect(u).not.toHaveProperty('dateOfBirth'));
  });

  it('has unique public IDs in the documented format, and parent child counts that match links', async () => {
    const api = fresh();
    const ids = api.db.users.map((u) => u.publicId);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id).toMatch(/^[BCDFGHJKMNPQRSTVWXYZ2-9]{3}(-[BCDFGHJKMNPQRSTVWXYZ2-9]{3}){3}$/));

    const parents = await call(api, admin, 'GET', '/api/admin/users', { query: { role: 'parent', pageSize: 100 } });
    parents.body.items.forEach((p) => {
      const links = api.db.parentLinks.filter((l) => l.parentUid === p.uid && l.status === 'active');
      expect(p.childCount).toBe(links.length);
    });
  });

  it('matches q as a prefix of name, email or public ID', async () => {
    const api = fresh();
    const target = api.db.users.find((u) => u.role === 'student');
    for (const q of [target.surname.slice(0, 3), target.email.slice(0, 4), target.publicId.slice(0, 5)]) {
      const res = await call(api, admin, 'GET', '/api/admin/users', { query: { role: 'student', q, pageSize: 100 } });
      expect(res.body.items.map((u) => u.uid)).toContain(target.uid);
    }
  });

  it('enforces the §6 matrix: supervisors read, only admins write, students and parents get 403', async () => {
    const api = fresh();
    const uid = api.db.users.find((u) => u.role === 'student').uid;
    expect((await call(api, supervisor, 'GET', `/api/admin/users/${uid}`)).status).toBe(200);
    expect((await call(api, supervisor, 'GET', `/api/admin/users/${uid}/history`)).status).toBe(200);
    expect((await call(api, supervisor, 'PATCH', `/api/admin/users/${uid}`, { body: { surname: 'X' } })).body.error.code).toBe('FORBIDDEN');
    expect((await call(api, teacher, 'GET', '/api/admin/users')).status).toBe(403);
    expect((await call(api, student, 'GET', '/api/admin/users')).status).toBe(403);
    expect((await call(api, parent, 'GET', `/api/admin/users/${uid}`)).status).toBe(403);
  });

  it('writes an audit entry with before/after for every change, newest first', async () => {
    const api = fresh();
    const u = api.db.users.find((x) => x.role === 'student' && x.status === 'active');
    const res = await call(api, admin, 'PATCH', `/api/admin/users/${u.uid}`, { body: { surname: 'Newname' } });
    expect(res.status).toBe(200);
    expect(res.body.surname).toBe('Newname');
    const hist = await call(api, admin, 'GET', `/api/admin/users/${u.uid}/history`, { query: {} });
    expect(hist.body.items[0].action).toBe('DETAILS_CHANGED');
    expect(hist.body.items[0].details.after).toEqual({ surname: 'Newname' });
    expect(hist.body.items[0].source).toBe('server');
  });

  it('refuses to edit role, email or tenancy through PATCH', async () => {
    const api = fresh();
    const uid = api.db.users.find((u) => u.role === 'student').uid;
    for (const body of [{ role: 'admin' }, { email: 'x@y.test' }, { classIds: [] }, { status: 'active' }]) {
      const res = await call(api, admin, 'PATCH', `/api/admin/users/${uid}`, { body });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION');
    }
  });

  it('validates creates field by field and rejects a duplicate email with CONFLICT', async () => {
    const api = fresh();
    const base = { role: 'student', email: 'new.kid@welearn.test', givenNames: 'New', surname: 'Kid', schoolIds: ['sch-bkk'], cohortId: 'cohort-w2e', ageBand: '13-15' };
    expect((await call(api, admin, 'POST', '/api/admin/users', { body: { ...base, phone: '0812345678' } })).body.error.field).toBe('phone');
    expect((await call(api, admin, 'POST', '/api/admin/users', { body: { ...base, cohortId: undefined } })).body.error.field).toBe('cohortId');
    const created = await call(api, admin, 'POST', '/api/admin/users', { body: base });
    expect(created.status).toBe(201);
    expect(created.body.status).toBe('pending');
    // Email is not configured until the Microsoft 365 mailbox exists; never a raw link.
    expect(created.body.activation).toEqual({ sent: false, reason: 'EMAIL_NOT_CONFIGURED' });
    expect(JSON.stringify(created.body)).not.toMatch(/https?:\/\//);
    const dup = await call(api, admin, 'POST', '/api/admin/users', { body: base });
    expect(dup.status).toBe(409);
    expect(dup.body.error.field).toBe('email');
  });

  it('creates primary learners as pending with consent required', async () => {
    const api = fresh();
    const res = await call(api, admin, 'POST', '/api/admin/users', { body: { role: 'student', email: 'little@welearn.test', givenNames: 'Little', surname: 'One', schoolIds: ['sch-bkk'], cohortId: 'cohort-wpr', ageBand: 'primary' } });
    expect(res.body.status).toBe('pending');
    expect(res.body.consent).toEqual({ status: 'required' });
  });

  it('suspends with a reason, cannot suspend self, and unsuspends back to the right status', async () => {
    const api = fresh();
    const u = api.db.users.find((x) => x.role === 'teacher' && x.status === 'active');
    expect((await call(api, admin, 'POST', `/api/admin/users/${u.uid}/suspend`, { body: {} })).body.error.field).toBe('reason');
    const s = await call(api, admin, 'POST', `/api/admin/users/${u.uid}/suspend`, { body: { reason: 'test' } });
    expect(s.body.status).toBe('suspended');
    expect(s.body.auth.disabled).toBe(true);
    expect((await call(api, { ...admin, uid: u.uid }, 'POST', `/api/admin/users/${u.uid}/suspend`, { body: { reason: 'x' } })).status).toBe(403);
    const un = await call(api, admin, 'POST', `/api/admin/users/${u.uid}/unsuspend`);
    expect(un.body.status).toBe('active');
  });

  it('protects the last administrator', async () => {
    const api = fresh();
    const onlyAdmin = api.db.users.find((u) => u.role === 'admin');
    const res = await call(api, admin, 'PUT', `/api/admin/users/${onlyAdmin.uid}/role`, { body: { role: 'teacher' } });
    expect(res.status).toBe(409);
  });

  it('parent invite: code shown once, redeemable once, same error for wrong and used codes', async () => {
    const api = fresh();
    const kid = api.db.users.find((u) => u.role === 'student');
    const issued = await call(api, admin, 'POST', `/api/students/${kid.uid}/parent-invite`);
    expect(issued.status).toBe(201);
    expect(issued.body.code).toMatch(/^[BCDFGHJKMNPQRSTVWXYZ2-9]{4}-[BCDFGHJKMNPQRSTVWXYZ2-9]{4}$/);
    // Only a hash is stored.
    expect(JSON.stringify(api.db.parentInvites)).not.toContain(issued.body.code);

    const redeemed = await call(api, parent, 'POST', '/api/parent/redeem', { body: { code: issued.body.code.toLowerCase().replace('-', ' ') } });
    expect(redeemed.status).toBe(200);
    expect(redeemed.body.child.uid).toBe(kid.uid);
    const children = await call(api, parent, 'GET', '/api/parent/children');
    expect(children.body.items.map((c) => c.uid)).toContain(kid.uid);
    // Minimal profile only.
    expect(children.body.items[0]).not.toHaveProperty('email');

    const reused = await call(api, parent, 'POST', '/api/parent/redeem', { body: { code: issued.body.code } });
    const wrong = await call(api, parent, 'POST', '/api/parent/redeem', { body: { code: 'BBBB-2222' } });
    expect(reused.status).toBe(404);
    expect(reused.body.error.message).toBe(wrong.body.error.message);
  });

  it('rate-limits redeem attempts to 5 per 15 minutes', async () => {
    const api = fresh();
    for (let i = 0; i < 5; i += 1) await call(api, parent, 'POST', '/api/parent/redeem', { body: { code: 'BBBB-2222' } });
    expect((await call(api, parent, 'POST', '/api/parent/redeem', { body: { code: 'BBBB-2222' } })).status).toBe(429);
  });

  it('ships a working demo invite code for reviewers', async () => {
    const api = fresh();
    const res = await call(api, parent, 'POST', '/api/parent/redeem', { body: { code: DEMO_PARENT_INVITE_CODE } });
    expect(res.status).toBe(200);
  });

  it('revoking a link removes the child from the parent view', async () => {
    const api = fresh();
    const kid = api.db.users.find((u) => u.role === 'student');
    const { body: { code } } = await call(api, admin, 'POST', `/api/students/${kid.uid}/parent-invite`);
    await call(api, parent, 'POST', '/api/parent/redeem', { body: { code } });
    const link = api.db.parentLinks.find((l) => l.parentUid === parent.uid);
    expect((await call(api, admin, 'DELETE', `/api/admin/parent-links/${link.linkId}`)).status).toBe(200);
    expect((await call(api, parent, 'GET', '/api/parent/children')).body.items).toHaveLength(0);
  });

  it('uses the contract error shape for unknown routes and signed-out callers', async () => {
    const api = fresh();
    expect((await api.handle({ method: 'GET', path: '/api/nope', caller: admin })).body.error.code).toBe('NOT_FOUND');
    expect((await api.handle({ method: 'GET', path: '/api/me', caller: null })).status).toBe(401);
  });
});

describe('pagination helpers', () => {
  it('formats ranges', () => {
    expect(pageRange({ pageIndex: 0, pageSize: 30, count: 30, total: 129 })).toEqual({ from: 1, to: 30, total: 129 });
    expect(pageRange({ pageIndex: 4, pageSize: 30, count: 9, total: 129 })).toEqual({ from: 121, to: 129, total: 129 });
    expect(pageRange({ pageIndex: 0, pageSize: 30, count: 0, total: 0 })).toEqual({ from: 0, to: 0, total: 0 });
  });
  it('keeps the cursor for every visited page', () => {
    expect(nextTokens([null], 0, 'a')).toEqual([null, 'a']);
    expect(nextTokens([null, 'a', 'b'], 1, 'b2')).toEqual([null, 'a', 'b2']);
  });
  it('toggles sort direction', () => {
    expect(toggleSort('surname', 'surname')).toBe('-surname');
    expect(toggleSort('-surname', 'surname')).toBe('surname');
    expect(toggleSort('surname', 'createdAt')).toBe('createdAt');
  });
});

describe('routes', () => {
  it('parses console, settings, courses and parent routes', () => {
    expect(parseRoute('#/admin/staff')).toEqual({ screen: 'admin', page: 'list', kind: 'staff' });
    expect(parseRoute('#/admin/users/abc%2F1')).toEqual({ screen: 'admin', page: 'detail', uid: 'abc/1' });
    expect(parseRoute('#/admin/new/parents')).toEqual({ screen: 'admin', page: 'create', kind: 'parents' });
    expect(parseRoute('#/admin/new/wizards')).toEqual({ screen: 'admin', page: 'list', kind: 'students' });
    expect(parseRoute('#/settings')).toEqual({ screen: 'settings' });
    expect(parseRoute('#/courses')).toEqual({ screen: 'courses' });
    expect(parseRoute('#/coach/dashboard')).toBeNull();
    expect(parseRoute('')).toBeNull();
  });
});

describe('roles', () => {
  it('takes admin, supervisor and parent from the signed claim only', () => {
    expect(resolveRole({ role: 'admin' }, { role: 'student' })).toBe('admin');
    expect(resolveRole({ role: 'parent' }, {})).toBe('parent');
    // A profile document claiming admin must never produce the console.
    expect(resolveRole({}, { role: 'admin' })).toBe('student');
    expect(resolveRole({}, { role: 'supervisor' })).toBe('student');
    // Legacy coaches keep working.
    expect(resolveRole({}, { role: 'coach' })).toBe('teacher');
    expect(resolveRole({ role: 'teacher' }, {})).toBe('teacher');
  });
  it('lets supervisors view but not edit', () => {
    expect(consolePermissions('supervisor')).toMatchObject({ viewAccounts: true, editAccounts: false, viewHistory: true });
    expect(consolePermissions('admin')).toMatchObject({ viewAccounts: true, editAccounts: true });
    expect(consolePermissions('teacher').viewAccounts).toBe(false);
  });
});

describe('interface text', () => {
  const en = Object.keys(messages.en);
  it.each(['zh', 'th'])('%s has every English key and no extras', (locale) => {
    expect(Object.keys(messages[locale]).sort()).toEqual([...en].sort());
  });
  it.each(['zh', 'th'])('%s keeps every {placeholder}', (locale) => {
    en.forEach((key) => {
      const want = (messages.en[key].match(/\{\w+\}/g) || []).sort();
      const got = (messages[locale][key].match(/\{\w+\}/g) || []).sort();
      expect(got, key).toEqual(want);
    });
  });
  it('fills placeholders and falls back to English', () => {
    expect(translate('en', 'table.displaying', { from: 1, to: 30, total: 129 })).toBe('Displaying 1–30 of 129');
    expect(translate('xx', 'common.save')).toBe('Save');
    expect(translate('en', 'no.such.key')).toBe('no.such.key');
  });
});
