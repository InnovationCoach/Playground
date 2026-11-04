/**
 * In-browser stand-in for the Phase A backend, implementing the §7 contract
 * over mockFixtures.js. It exists so the admin console can be built and
 * reviewed before the real API is deployed - it is not a security boundary,
 * and nothing it "saves" goes anywhere. State lives in memory and resets on
 * reload.
 *
 * It follows the contract's behaviour where the UI depends on it: the error
 * shape and codes, cursor pagination with `total`, the §6 permission matrix,
 * an audit entry for every change, and no raw activation links. Email is
 * reported as not configured (501 / activation.sent=false) because that is
 * the truth until the Microsoft 365 mailbox exists.
 */
import { buildFixtures, makePublicId, mulberry32, DEMO_PARENT_INVITE_CODE } from './mockFixtures.js';
import { generateJoinCode, normaliseJoinCode } from '../../utils/joinCode.js';
import { childRecords, profileFor } from './mockChildRecords.js';
import { buildChildProgress } from '../../features/parent/childProgress.js';

const ROLES = ['admin', 'supervisor', 'teacher', 'student', 'parent'];
const STATUSES = ['pending', 'active', 'suspended'];
const GENDERS = ['female', 'male', 'nonbinary', 'prefer_not_to_say'];
const AGE_BANDS = ['primary', '13-15', '16-18'];
const EDITABLE = ['salutation', 'givenNames', 'surname', 'phone', 'gender', 'cohortId', 'ageBand', 'yearLevel', 'dateOfBirth', 'programmeIds', 'locale'];
const SORTABLE = ['surname', 'givenNames', 'createdAt', 'status', 'publicId', 'email', 'role'];
const E164 = /^\+[1-9]\d{7,14}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LATENCY_MS = 180;

const ok = (body, status = 200) => ({ status, body });
const fail = (status, code, message, field) => ({ status, body: { error: { code, message, ...(field ? { field } : {}) } } });

const encodeToken = (offset) => btoa(`o:${offset}`);
const decodeToken = (token) => {
  try { const m = /^o:(\d+)$/.exec(atob(token)); return m ? Number(m[1]) : 0; } catch { return 0; }
};
const hashCode = (code) => {
  let h = 2166136261;
  for (const ch of code) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return `fnv1a:${(h >>> 0).toString(16)}`;
};

export function createMockBackend({ seed, latencyMs = LATENCY_MS } = {}) {
  const db = buildFixtures(seed);
  const rand = mulberry32(99);
  const takenIds = new Set(db.users.map((u) => u.publicId));
  const now = () => new Date().toISOString();
  let seq = 0;
  const newId = (prefix) => { seq += 1; return `${prefix}-new-${Date.now().toString(36)}-${seq}`; };

  // One pre-issued invite for the first WPR student with no parent, so the
  // parent flow can be tried directly.
  const demoChild = db.users.find((u) => u.role === 'student' && u.cohortId?.endsWith('-primary')
    && !db.parentLinks.some((l) => l.studentUid === u.uid));
  if (demoChild) {
    db.parentInvites.push({ inviteId: 'invite-demo', orgId: db.organization.orgId, studentUid: demoChild.uid, codeHash: hashCode(DEMO_PARENT_INVITE_CODE), expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), createdBy: 'mock-admin-001' });
  }

  // Links a reviewer redeems survive a reload (mock only), so the parent
  // dashboard can be reopened without a new invite code each time.
  const SAVED_LINKS = 'hearisland.mock.parentLinks.v1';
  const savedLinks = () => {
    try { return JSON.parse(globalThis.localStorage?.getItem(SAVED_LINKS) || '[]'); } catch { return []; }
  };
  const saveLink = (link) => {
    try { globalThis.localStorage?.setItem(SAVED_LINKS, JSON.stringify([...savedLinks(), link])); } catch { /* storage unavailable */ }
  };
  for (const l of savedLinks()) {
    if (db.users.some((u) => u.uid === l.studentUid) && !db.parentLinks.some((x) => x.parentUid === l.parentUid && x.studentUid === l.studentUid)) {
      db.parentLinks.push({ ...l, status: 'active' });
    }
  }

  const SAVED_USERS = 'hearisland.mock.users.v1';
  const savedUsers = () => {
    try { return JSON.parse(globalThis.localStorage?.getItem(SAVED_USERS) || '[]'); } catch { return []; }
  };
  const saveUser = (user) => {
    try {
      const current = savedUsers().filter((u) => u.uid !== user.uid);
      current.push(user);
      globalThis.localStorage?.setItem(SAVED_USERS, JSON.stringify(current));
    } catch { /* storage unavailable */ }
  };
  for (const u of savedUsers()) {
    const idx = db.users.findIndex((x) => x.uid === u.uid);
    if (idx >= 0) db.users[idx] = { ...db.users[idx], ...u };
    else db.users.push(u);
  }

  const findUser = (uid) => db.users.find((u) => u.uid === uid);
  const activeLinks = () => db.parentLinks.filter((l) => l.status === 'active');
  const actorFor = (caller) => ({ uid: caller.uid, name: caller.name });

  function audit(caller, subject, action, summary, details = {}) {
    db.history.push({
      logId: newId('log'), source: 'server', orgId: db.organization.orgId, schoolId: subject.schoolIds?.[0] || null,
      subjectUid: subject.uid, action, actorUid: caller.uid, actorName: caller.name, actorPublicId: null,
      summary, details, createdAt: now()
    });
  }

  function listItem(u) {
    const item = {
      uid: u.uid, publicId: u.publicId, role: u.role, status: u.status,
      givenNames: u.givenNames, surname: u.surname, displayName: u.displayName, email: u.email,
      schoolIds: u.schoolIds, classIds: u.classIds, createdAt: u.createdAt
    };
    if (u.role === 'student') Object.assign(item, { cohortId: u.cohortId, yearLevel: u.yearLevel, ageBand: u.ageBand });
    // ADDITION (docs/FRONTEND-PHASE-0-NOTES.md): child count for the parents list.
    if (u.role === 'parent') item.childCount = activeLinks().filter((l) => l.parentUid === u.uid).length;
    return item;
  }

  function linkSummaries(u) {
    const mine = activeLinks().filter((l) => (u.role === 'parent' ? l.parentUid : l.studentUid) === u.uid);
    return mine.map((l) => {
      const other = findUser(u.role === 'parent' ? l.studentUid : l.parentUid);
      return { linkId: l.linkId, uid: other?.uid, displayName: other?.displayName, publicId: other?.publicId, createdAt: l.createdAt };
    });
  }

  function fullRecord(u, caller) {
    const { auth, ...rest } = u;
    const record = { ...rest, auth: { ...auth } };
    if (caller.role !== 'admin') delete record.dateOfBirth;
    const links = linkSummaries(u);
    record.counts = { classes: u.classIds.length, ...(u.role === 'parent' ? { children: links.length } : {}), ...(u.role === 'student' ? { parents: links.length } : {}) };
    // ADDITION: the linked accounts themselves, so the detail page can show and unlink them.
    record.links = links;
    return record;
  }

  function paginate(rows, query) {
    const pageSize = Math.min(Math.max(Number(query.pageSize) || 30, 1), 100);
    const offset = query.pageToken ? decodeToken(query.pageToken) : 0;
    const items = rows.slice(offset, offset + pageSize);
    const next = offset + pageSize < rows.length ? encodeToken(offset + pageSize) : null;
    return { items, nextPageToken: next, total: rows.length };
  }

  function validateProfile(body, { creating }) {
    if (creating) {
      if (!ROLES.includes(body.role)) return fail(400, 'VALIDATION', 'Choose a role.', 'role');
      if (!EMAIL.test(body.email || '')) return fail(400, 'VALIDATION', 'Enter a valid email address.', 'email');
    }
    for (const f of ['givenNames', 'surname']) {
      if (f in body || creating) {
        const v = String(body[f] ?? '').trim();
        if (!v) return fail(400, 'VALIDATION', 'This field is required.', f);
        if (v.length > 80) return fail(400, 'VALIDATION', 'Keep this under 80 characters.', f);
      }
    }
    if (body.phone && !E164.test(body.phone)) return fail(400, 'VALIDATION', 'Use international format: + then 8–15 digits.', 'phone');
    if (body.gender && !GENDERS.includes(body.gender)) return fail(400, 'VALIDATION', 'Unknown gender value.', 'gender');
    const isStudent = creating ? body.role === 'student' : body.__role === 'student';
    if (isStudent) {
      if ((creating || 'cohortId' in body) && !db.cohorts.some((c) => c.cohortId === body.cohortId)) return fail(400, 'VALIDATION', 'Choose a cohort.', 'cohortId');
      if ((creating || 'ageBand' in body) && !AGE_BANDS.includes(body.ageBand)) return fail(400, 'VALIDATION', 'Choose an age band.', 'ageBand');
    }
    if (creating && (!Array.isArray(body.schoolIds) || !body.schoolIds.length)) return fail(400, 'VALIDATION', 'Choose a school.', 'schoolIds');
    return null;
  }

  // --- route handlers ---------------------------------------------------------

  const routes = [];
  const route = (method, pattern, allow, fn) => {
    const keys = [];
    const re = new RegExp(`^${pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; })}$`);
    routes.push({ method, re, keys, allow, fn });
  };
  const ADMIN = ['admin'];
  const CONSOLE = ['admin', 'supervisor'];

  route('GET', '/api/me', null, (req) => {
    const u = findUser(req.caller.uid);
    return ok({ uid: req.caller.uid, publicId: u?.publicId || null, role: req.caller.role, orgId: db.organization.orgId, schoolIds: u?.schoolIds || [], classIds: u?.classIds || [], status: u?.status || 'active', displayName: req.caller.name, email: req.caller.email, locale: u?.locale || 'en' });
  });

  route('GET', '/api/admin/users', CONSOLE, ({ query }) => {
    let rows = db.users.slice();
    if (query.role) {
      const roles = String(query.role).split(',').filter((r) => ROLES.includes(r));
      rows = rows.filter((u) => roles.includes(u.role));
    }
    if (query.status && STATUSES.includes(query.status)) rows = rows.filter((u) => u.status === query.status);
    if (query.schoolId) rows = rows.filter((u) => u.schoolIds.includes(query.schoolId));
    if (query.classId) rows = rows.filter((u) => u.classIds.includes(query.classId));
    if (query.cohortId) rows = rows.filter((u) => u.cohortId === query.cohortId);
    if (query.q) {
      // Prefix match on name, email or publicId, as the contract specifies.
      const q = String(query.q).trim().toLowerCase();
      const qId = q.replace(/[^a-z0-9]/g, '');
      rows = rows.filter((u) => u.givenNames.toLowerCase().startsWith(q) || u.surname.toLowerCase().startsWith(q)
        || u.displayName.toLowerCase().startsWith(q) || u.email.toLowerCase().startsWith(q)
        || (qId && u.publicId.replace(/-/g, '').toLowerCase().startsWith(qId)));
    }
    const sort = String(query.sort || 'surname');
    const desc = sort.startsWith('-');
    const field = SORTABLE.includes(sort.replace(/^-/, '')) ? sort.replace(/^-/, '') : 'surname';
    rows.sort((a, b) => {
      const av = String(a[field] ?? ''); const bv = String(b[field] ?? '');
      const c = av.localeCompare(bv) || a.givenNames.localeCompare(b.givenNames) || a.uid.localeCompare(b.uid);
      return desc ? -c : c;
    });
    const page = paginate(rows, query);
    return ok({ ...page, items: page.items.map(listItem) });
  });

  route('POST', '/api/admin/users', ADMIN, ({ body, caller }) => {
    body = body || {};
    const invalid = validateProfile(body, { creating: true });
    if (invalid) return invalid;
    const email = body.email.trim().toLowerCase();
    if (db.users.some((u) => u.email === email)) return fail(409, 'CONFLICT', 'That email is already in use.', 'email');
    const createdAt = now();
    const hasPassword = Boolean(body.password && String(body.password).trim().length >= 6);
    const user = {
      uid: newId('mock-user'), publicId: makePublicId(rand, takenIds), role: body.role,
      status: hasPassword ? 'active' : 'pending',
      givenNames: body.givenNames.trim(), surname: body.surname.trim(), displayName: `${body.givenNames.trim()} ${body.surname.trim()}`,
      salutation: body.salutation || null, email, phone: body.phone || null, gender: body.gender || null,
      orgId: db.organization.orgId, schoolIds: body.schoolIds, classIds: body.classIds || [], programmeIds: body.programmeIds || [],
      locale: 'en', createdAt, createdBy: actorFor(caller), updatedAt: null, updatedBy: null,
      auth: { lastSignInAt: null, createdAt, disabled: false, hasPassword }
    };
    if (body.role === 'student') {
      Object.assign(user, { cohortId: body.cohortId, ageBand: body.ageBand, yearLevel: body.yearLevel || null, dateOfBirth: body.dateOfBirth || null, consent: null });
    }
    db.users.push(user);
    saveUser(user);
    audit(caller, user, 'ACCOUNT_CREATED', hasPassword ? `Account created as ${user.role} with direct login password` : `Account created as ${user.role}`);
    const activation = hasPassword ? { sent: false, directPassword: true } : { sent: false, reason: 'EMAIL_NOT_CONFIGURED' };
    return ok({ ...fullRecord(user, caller), activation }, 201);
  });

  route('POST', '/api/admin/users/:uid/set-password', ADMIN, ({ params, body, caller }) => {
    const u = findUser(params.uid);
    if (!u) return fail(404, 'NOT_FOUND', 'No such account.');
    const password = String(body?.password || '').trim();
    if (password.length < 6) return fail(400, 'VALIDATION', 'Password must be at least 6 characters.', 'password');
    u.status = 'active';
    u.auth = { ...(u.auth || {}), disabled: false, hasPassword: true };
    u.updatedAt = now();
    u.updatedBy = actorFor(caller);
    saveUser(u);
    audit(caller, u, 'PASSWORD_RESET', 'Admin set login password');
    return ok(fullRecord(u, caller));
  });

  route('GET', '/api/admin/users/:uid', CONSOLE, ({ params, caller }) => {
    const u = findUser(params.uid);
    return u ? ok(fullRecord(u, caller)) : fail(404, 'NOT_FOUND', 'No such account.');
  });

  route('PATCH', '/api/admin/users/:uid', ADMIN, ({ params, body, caller }) => {
    const u = findUser(params.uid);
    if (!u) return fail(404, 'NOT_FOUND', 'No such account.');
    body = body || {};
    const forbidden = Object.keys(body).find((k) => !EDITABLE.includes(k));
    if (forbidden) return fail(400, 'VALIDATION', `${forbidden} cannot be changed here.`, forbidden);
    const invalid = validateProfile({ ...body, __role: u.role }, { creating: false });
    if (invalid) return invalid;
    const before = {}; const after = {};
    Object.entries(body).forEach(([k, v]) => {
      const next = typeof v === 'string' ? (v.trim() || null) : v;
      if (JSON.stringify(u[k] ?? null) !== JSON.stringify(next ?? null)) { before[k] = u[k] ?? null; after[k] = next; u[k] = next; }
    });
    if (!Object.keys(after).length) return ok(fullRecord(u, caller));
    u.displayName = `${u.givenNames} ${u.surname}`;
    u.updatedAt = now(); u.updatedBy = actorFor(caller);
    audit(caller, u, 'DETAILS_CHANGED', `Changed ${Object.keys(after).join(', ')}`, { before, after });
    return ok(fullRecord(u, caller));
  });

  route('PUT', '/api/admin/users/:uid/role', ADMIN, ({ params, body, caller }) => {
    const u = findUser(params.uid);
    if (!u) return fail(404, 'NOT_FOUND', 'No such account.');
    const role = body?.role;
    if (!ROLES.includes(role)) return fail(400, 'VALIDATION', 'Choose a role.', 'role');
    if (u.uid === caller.uid) return fail(403, 'FORBIDDEN', 'You cannot change your own role.');
    if (u.role === 'admin' && role !== 'admin' && db.users.filter((x) => x.role === 'admin').length <= 1) {
      return fail(409, 'CONFLICT', 'The last administrator cannot be removed.');
    }
    if (u.role === role) return ok(fullRecord(u, caller));
    const before = u.role; u.role = role; u.updatedAt = now(); u.updatedBy = actorFor(caller);
    audit(caller, u, 'ROLE_CHANGED', `Role changed from ${before} to ${role}`, { before: { role: before }, after: { role } });
    return ok(fullRecord(u, caller));
  });

  route('PUT', '/api/admin/users/:uid/assignments', ADMIN, ({ params, body, caller }) => {
    const u = findUser(params.uid);
    if (!u) return fail(404, 'NOT_FOUND', 'No such account.');
    const before = { schoolIds: u.schoolIds, classIds: u.classIds };
    if (Array.isArray(body?.schoolIds)) u.schoolIds = body.schoolIds;
    if (Array.isArray(body?.classIds)) u.classIds = body.classIds;
    u.updatedAt = now(); u.updatedBy = actorFor(caller);
    audit(caller, u, 'CLASSES_CHANGED', 'Schools and classes changed', { before, after: { schoolIds: u.schoolIds, classIds: u.classIds } });
    return ok(fullRecord(u, caller));
  });

  route('POST', '/api/admin/users/:uid/suspend', ADMIN, ({ params, body, caller }) => {
    const u = findUser(params.uid);
    if (!u) return fail(404, 'NOT_FOUND', 'No such account.');
    if (u.uid === caller.uid) return fail(403, 'FORBIDDEN', 'You cannot suspend yourself.');
    if (u.status === 'suspended') return fail(409, 'CONFLICT', 'Already suspended.');
    const reason = String(body?.reason || '').trim();
    if (!reason) return fail(400, 'VALIDATION', 'Give a reason.', 'reason');
    const before = u.status;
    Object.assign(u, { status: 'suspended', suspendedAt: now(), suspendedBy: actorFor(caller), statusBeforeSuspension: before });
    u.auth.disabled = true;
    audit(caller, u, 'ACCOUNT_SUSPENDED', 'Account suspended', { reason });
    return ok(fullRecord(u, caller));
  });

  route('POST', '/api/admin/users/:uid/unsuspend', ADMIN, ({ params, caller }) => {
    const u = findUser(params.uid);
    if (!u) return fail(404, 'NOT_FOUND', 'No such account.');
    if (u.status !== 'suspended') return fail(409, 'CONFLICT', 'Not suspended.');
    u.status = u.statusBeforeSuspension || (u.activatedAt ? 'active' : 'pending');
    u.auth.disabled = false; u.suspendedAt = null; u.suspendedBy = null;
    audit(caller, u, 'ACCOUNT_UNSUSPENDED', 'Account unsuspended');
    return ok(fullRecord(u, caller));
  });

  route('POST', '/api/admin/users/:uid/resend-activation', ADMIN, ({ params }) => {
    const u = findUser(params.uid);
    if (!u) return fail(404, 'NOT_FOUND', 'No such account.');
    if (u.status !== 'pending') return fail(409, 'CONFLICT', 'This account is already activated.');
    return fail(501, 'EMAIL_NOT_CONFIGURED', 'Email sending is not set up yet.');
  });

  route('POST', '/api/admin/users/:uid/change-email', ADMIN, ({ params, body }) => {
    const u = findUser(params.uid);
    if (!u) return fail(404, 'NOT_FOUND', 'No such account.');
    const email = String(body?.newEmail || '').trim().toLowerCase();
    if (!EMAIL.test(email)) return fail(400, 'VALIDATION', 'Enter a valid email address.', 'newEmail');
    if (db.users.some((x) => x.email === email)) return fail(409, 'CONFLICT', 'That email is already in use.', 'newEmail');
    return fail(501, 'EMAIL_NOT_CONFIGURED', 'Email sending is not set up yet.');
  });

  route('GET', '/api/admin/users/:uid/history', CONSOLE, ({ params, query }) => {
    if (!findUser(params.uid)) return fail(404, 'NOT_FOUND', 'No such account.');
    const rows = db.history.filter((h) => h.subjectUid === params.uid)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.logId.localeCompare(a.logId));
    return ok(paginate(rows, query));
  });

  route('GET', '/api/admin/organization', CONSOLE, () => ok(db.organization));
  route('GET', '/api/admin/schools', CONSOLE, () => ok({ items: db.schools, nextPageToken: null, total: db.schools.length }));
  route('GET', '/api/admin/classes', CONSOLE, ({ query }) => {
    const rows = query.schoolId ? db.classes.filter((c) => c.schoolId === query.schoolId) : db.classes;
    return ok({ items: rows, nextPageToken: null, total: rows.length });
  });
  route('GET', '/api/admin/cohorts', CONSOLE, () => ok({ items: db.cohorts, nextPageToken: null, total: db.cohorts.length }));
  route('GET', '/api/admin/programmes', CONSOLE, () => ok({ items: db.programmes, nextPageToken: null, total: db.programmes.length }));

  // --- Student Billing routes ---
  route('GET', '/api/admin/billing', CONSOLE, ({ query }) => {
    let rows = db.billing || [];
    if (query.status) rows = rows.filter((b) => b.status === query.status);
    if (query.cohortId) rows = rows.filter((b) => b.cohortId === query.cohortId);
    if (query.q) {
      const q = String(query.q).trim().toLowerCase();
      rows = rows.filter((b) => b.studentName.toLowerCase().includes(q) || b.email.toLowerCase().includes(q) || b.publicId.toLowerCase().includes(q));
    }

    const totalRevenue = (db.billing || []).reduce((sum, b) => sum + b.amountPaid, 0);
    const totalOutstanding = (db.billing || []).reduce((sum, b) => sum + b.remainingBalance, 0);
    const overdueCount = (db.billing || []).filter((b) => b.status === 'overdue').length;
    const paidCount = (db.billing || []).filter((b) => b.status === 'paid').length;

    const page = paginate(rows, query);
    return ok({
      ...page,
      summary: { totalRevenue, totalOutstanding, overdueCount, paidCount, totalStudents: (db.billing || []).length }
    });
  });

  route('POST', '/api/admin/billing/:uid/payment', ADMIN, ({ params, body }) => {
    const record = (db.billing || []).find((b) => b.uid === params.uid);
    if (!record) return fail(404, 'NOT_FOUND', 'No billing record found.');
    const amount = Number(body?.amount) || 0;
    if (amount <= 0) return fail(400, 'VALIDATION', 'Enter a valid payment amount.', 'amount');

    record.amountPaid += amount;
    if (record.amountPaid >= record.totalTuition) {
      record.amountPaid = record.totalTuition;
      record.remainingBalance = 0;
      record.status = 'paid';
    } else {
      record.remainingBalance = record.totalTuition - record.amountPaid;
      record.status = 'partial';
    }
    record.lastPaymentDate = new Date().toISOString().slice(0, 10);
    if (body?.nextBillingDate) record.nextBillingDate = body.nextBillingDate;

    return ok({ record });
  });

  // --- Material Requests routes ---
  route('GET', '/api/admin/materials', null, ({ query }) => {
    let rows = db.materialRequests || [];
    if (query.status) rows = rows.filter((m) => m.status === query.status);
    if (query.category) rows = rows.filter((m) => m.category === query.category);
    if (query.q) {
      const q = String(query.q).trim().toLowerCase();
      rows = rows.filter((m) => m.item.toLowerCase().includes(q) || m.requestedByName.toLowerCase().includes(q) || m.reason.toLowerCase().includes(q));
    }

    const pendingCount = (db.materialRequests || []).filter((m) => m.status === 'pending').length;
    const approvedCount = (db.materialRequests || []).filter((m) => m.status === 'approved').length;
    const fulfilledCount = (db.materialRequests || []).filter((m) => m.status === 'fulfilled').length;
    const totalEstimatedCost = (db.materialRequests || []).reduce((sum, m) => sum + m.totalCost, 0);

    const page = paginate(rows, query);
    return ok({
      ...page,
      summary: { pendingCount, approvedCount, fulfilledCount, totalEstimatedCost }
    });
  });

  route('POST', '/api/admin/materials', null, ({ body, caller }) => {
    if (!body?.item?.trim()) return fail(400, 'VALIDATION', 'Item name is required.', 'item');
    const qty = Math.max(1, Number(body.quantity) || 1);
    const cost = Math.max(0, Number(body.estimatedCost) || 0);

    const newReq = {
      requestId: `mat-req-${Date.now().toString(36)}`,
      item: body.item.trim(),
      category: body.category || 'Classroom Supplies',
      quantity: qty,
      estimatedCost: cost,
      totalCost: qty * cost,
      reason: body.reason?.trim() || '',
      requestedByUid: caller.uid,
      requestedByName: caller.name,
      requestedByEmail: caller.email,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      notes: ''
    };

    db.materialRequests = db.materialRequests || [];
    db.materialRequests.unshift(newReq);
    return ok({ request: newReq }, 201);
  });

  route('PATCH', '/api/admin/materials/:requestId', CONSOLE, ({ params, body }) => {
    const reqItem = (db.materialRequests || []).find((m) => m.requestId === params.requestId);
    if (!reqItem) return fail(404, 'NOT_FOUND', 'Material request not found.');
    if (body.status) reqItem.status = body.status;
    if (body.notes !== undefined) reqItem.notes = body.notes;
    return ok({ request: reqItem });
  });

  route('POST', '/api/students/:uid/parent-invite', ['admin', 'teacher'], ({ params, caller }) => {
    const u = findUser(params.uid);
    if (!u || u.role !== 'student') return fail(404, 'NOT_FOUND', 'No such student.');
    db.parentInvites = db.parentInvites.filter((i) => i.studentUid !== u.uid || i.redeemedAt);
    const code = generateJoinCode((n) => Math.floor(rand() * n));
    const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
    db.parentInvites.push({ inviteId: newId('invite'), orgId: db.organization.orgId, studentUid: u.uid, codeHash: hashCode(code), expiresAt, createdBy: caller.uid });
    audit(caller, u, 'PARENT_INVITE_ISSUED', 'Parent invite code issued');
    return ok({ code, expiresAt }, 201);
  });

  const redeemAttempts = new Map();
  route('POST', '/api/parent/redeem', ['parent'], ({ body, caller }) => {
    const windowStart = Date.now() - 15 * 60000;
    const attempts = (redeemAttempts.get(caller.uid) || []).filter((t) => t > windowStart);
    if (attempts.length >= 5) return fail(429, 'RATE_LIMITED', 'Too many attempts.');
    redeemAttempts.set(caller.uid, [...attempts, Date.now()]);

    const code = normaliseJoinCode(body?.code);
    const invite = code && db.parentInvites.find((i) => i.codeHash === hashCode(code) && !i.redeemedAt && i.expiresAt > now());
    // One message for wrong, used and expired codes: telling them apart helps a guesser.
    if (!invite) return fail(404, 'NOT_FOUND', 'That code is not valid. Check it with the school.', 'code');
    const child = findUser(invite.studentUid);
    invite.redeemedAt = now(); invite.redeemedBy = caller.uid;
    const already = activeLinks().some((l) => l.parentUid === caller.uid && l.studentUid === child.uid);
    if (!already) {
      const link = { linkId: newId('link'), orgId: db.organization.orgId, parentUid: caller.uid, studentUid: child.uid, status: 'active', createdAt: now(), createdVia: invite.inviteId };
      db.parentLinks.push(link);
      saveLink(link);
      audit(caller, child, 'PARENT_LINKED', `Parent ${caller.name} linked`);
    }
    return ok({ child: childSummary(child) });
  });

  function childSummary(u) {
    const school = db.schools.find((s) => s.schoolId === u.schoolIds[0]);
    const cohort = db.cohorts.find((c) => c.cohortId === u.cohortId);
    return { uid: u.uid, publicId: u.publicId, givenNames: u.givenNames, displayName: u.displayName, yearLevel: u.yearLevel || null, schoolName: school?.name || null, cohortCode: cohort?.code || null, status: u.status, consentStatus: u.consent?.status || null };
  }

  route('GET', '/api/parent/children', ['parent'], ({ caller }) => {
    const items = activeLinks().filter((l) => l.parentUid === caller.uid).map((l) => ({ linkId: l.linkId, ...childSummary(findUser(l.studentUid)) }));
    return ok({ items, nextPageToken: null, total: items.length });
  });

  // ADDITION (docs/PARENT-DASHBOARD-CONTRACT.md): one linked child's progress.
  // A child the caller is not actively linked to is NOT_FOUND, not FORBIDDEN,
  // so the response does not confirm that the uid exists.
  route('GET', '/api/parent/children/:uid/progress', ['parent'], ({ params, caller }) => {
    const link = activeLinks().find((l) => l.parentUid === caller.uid && l.studentUid === params.uid);
    const child = link && findUser(params.uid);
    if (!child) return fail(404, 'NOT_FOUND', 'No such child.');
    const records = childRecords(profileFor(child.uid, demoChild?.uid));
    return ok(buildChildProgress({ child: { linkId: link.linkId, ...childSummary(child) }, ...records }));
  });

  route('DELETE', '/api/admin/parent-links/:linkId', ADMIN, ({ params, caller }) => {
    const link = db.parentLinks.find((l) => l.linkId === params.linkId && l.status === 'active');
    if (!link) return fail(404, 'NOT_FOUND', 'No such link.');
    Object.assign(link, { status: 'revoked', revokedAt: now(), revokedBy: caller.uid });
    try { globalThis.localStorage?.setItem(SAVED_LINKS, JSON.stringify(savedLinks().filter((l) => l.linkId !== link.linkId))); } catch { /* storage unavailable */ }
    const student = findUser(link.studentUid);
    const parent = findUser(link.parentUid);
    audit(caller, student, 'PARENT_UNLINKED', `Parent ${parent?.displayName || link.parentUid} unlinked`);
    if (parent) audit(caller, parent, 'PARENT_UNLINKED', `Unlinked from ${student.displayName}`);
    return ok({ linkId: link.linkId, status: 'revoked' });
  });

  route('POST', '/api/admin/parent-links', CONSOLE, ({ body, caller }) => {
    const parentUid = body?.parentUid;
    const studentUid = body?.studentUid;
    if (!parentUid || !studentUid) return fail(400, 'VALIDATION', 'Parent and student are both required.');
    const parent = findUser(parentUid);
    const student = findUser(studentUid);
    if (!parent) return fail(404, 'NOT_FOUND', 'Parent not found.', 'parentUid');
    if (!student) return fail(404, 'NOT_FOUND', 'Student not found.', 'studentUid');
    if (parent.role !== 'parent') return fail(400, 'VALIDATION', 'Selected user is not a parent.', 'parentUid');
    if (student.role !== 'student') return fail(400, 'VALIDATION', 'Selected user is not a student.', 'studentUid');
    const already = activeLinks().some((l) => l.parentUid === parentUid && l.studentUid === studentUid);
    if (already) return fail(409, 'CONFLICT', 'This child is already linked to this parent.');
    const link = {
      linkId: newId('link'),
      orgId: db.organization.orgId,
      parentUid,
      studentUid,
      status: 'active',
      createdAt: now(),
      createdVia: 'admin-console'
    };
    db.parentLinks.push(link);
    saveLink(link);
    audit(caller, student, 'PARENT_LINKED', `Parent ${parent.displayName} linked by admin`);
    audit(caller, parent, 'PARENT_LINKED', `Linked to ${student.displayName} by admin`);
    return ok({ linkId: link.linkId, parentUid, studentUid, status: 'active', createdAt: link.createdAt }, 201);
  });

  route('GET', '/api/canva/connection', ['admin', 'supervisor', 'teacher', 'student'], () => {
    return ok({ connected: false });
  });

  route('GET', '/api/canva/oauth/start', ['admin', 'supervisor', 'teacher', 'student'], () => {
    const clientId = 'OC-AaFyafCLmW1w';
    const redirectUri = encodeURIComponent('http://127.0.0.1:3001/api/canva/oauth/callback');
    const scope = encodeURIComponent('design:content design:meta asset folder profile');
    const url = `https://www.canva.com/api/oauth/authorize?code_challenge=mock_challenge&code_challenge_method=s256&scope=${scope}&response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=mock_state`;
    return ok({ url, state: 'mock-canva-state' });
  });

  route('POST', '/api/canva/disconnect', ['admin', 'supervisor', 'teacher', 'student'], () => {
    return ok({ success: true, disconnected: true });
  });

  // --- Pilot Operations: Attendance, Leave, Inventory ---
  const pilotAttendanceStore = new Map();
  const pilotHistoryStore = new Map();
  const pilotLeaveStore = [
    {
      id: 'leave_mani_01',
      uid: '0rE6NrmlgyaZDTjTG6HOLGvIm8z1',
      name: 'Coach Mani',
      role: 'Senior STEM & PBL Coach',
      startDate: '2026-11-18',
      endDate: '2026-11-20',
      reason: 'Annual family visit and personal leave',
      status: 'approved',
      response: 'Approved by administration. Coverage arranged with Coach Alex.',
      createdAt: '2026-10-28T09:00:00.000Z',
      days: 3
    },
    {
      id: 'leave_sarah_02',
      uid: 'CETkvAzvYUhKwCxB97hZLvD9tZz2',
      name: 'Coach Sarah Jenkins',
      role: 'Lead Robotics & Maker Coach',
      startDate: '2026-12-24',
      endDate: '2026-12-28',
      reason: 'Year-end family holidays and cultural celebration',
      status: 'pending',
      response: '',
      createdAt: '2026-11-01T11:30:00.000Z',
      days: 5
    },
    {
      id: 'leave_alex_03',
      uid: '5ONInNle5ZWHoPFuWCjhKKqMiKP2',
      name: 'Coach Alex Rivera',
      role: 'Climate & Sustainability Coach',
      startDate: '2026-11-10',
      endDate: '2026-11-11',
      reason: 'Regional PBL STEM Educators Conference presentation',
      status: 'approved',
      response: 'Approved. Looking forward to the conference debrief!',
      createdAt: '2026-10-25T14:20:00.000Z',
      days: 2
    },
    {
      id: 'leave_david_04',
      uid: 'DuXWfOG0fnYn8kG8R6d4rMnlx2o1',
      name: 'Coach David Chen',
      role: 'Physics & Coding Coach',
      startDate: '2026-12-01',
      endDate: '2026-12-03',
      reason: 'Robotics competition chaperone & hardware workshop',
      status: 'approved',
      response: 'Approved by administration.',
      createdAt: '2026-10-20T16:00:00.000Z',
      days: 3
    }
  ];

  const defaultMockCoaches = [
    {
      uid: '0rE6NrmlgyaZDTjTG6HOLGvIm8z1',
      name: 'Coach Mani',
      role: 'Senior STEM & PBL Coach',
      email: 'mani@welearn.org',
      defaultStatus: 'present',
      defaultNote: 'On campus · Science Lab 201',
      daysOffUsed: 4,
      holidayTotal: 20
    },
    {
      uid: 'CETkvAzvYUhKwCxB97hZLvD9tZz2',
      name: 'Coach Sarah Jenkins',
      role: 'Lead Robotics & Maker Coach',
      email: 'coach@welearn.org',
      defaultStatus: 'present',
      defaultNote: 'Leading Robotics Workshop',
      daysOffUsed: 6,
      holidayTotal: 20
    },
    {
      uid: '5ONInNle5ZWHoPFuWCjhKKqMiKP2',
      name: 'Coach Alex Rivera',
      role: 'Climate & Sustainability Coach',
      email: 'demo.coach.report@welearn.org',
      defaultStatus: 'present',
      defaultNote: 'Climate Champions PBL mentoring',
      daysOffUsed: 2,
      holidayTotal: 20
    },
    {
      uid: 'DuXWfOG0fnYn8kG8R6d4rMnlx2o1',
      name: 'Coach David Chen',
      role: 'Physics & Coding Coach',
      email: 'al@welearn.org',
      defaultStatus: 'late',
      defaultNote: 'Commute delay (30 mins) · Coding lab',
      daysOffUsed: 8,
      holidayTotal: 20
    },
    {
      uid: 'EtbqHXNCP6fZM7WbeocihWcPpql2',
      name: 'Admin Test (Supervisor)',
      role: 'Head of Operations & Academics',
      email: 'admin.test@school.edu',
      defaultStatus: 'present',
      defaultNote: 'Admin Console & Inventory Review',
      daysOffUsed: 3,
      holidayTotal: 25
    }
  ];

  const handleAttendanceGet = ({ query }) => {
    const kind = query.kind || 'staff';
    const date = query.date || new Date().toISOString().slice(0, 10);

    if (kind === 'staff') {
      const items = defaultMockCoaches.map((c) => {
        const key = `${date}_${c.uid}`;
        const stored = pilotAttendanceStore.get(key);
        const coachLeaves = pilotLeaveStore.filter((l) => l.uid === c.uid);
        const upcoming = coachLeaves.find((l) => l.endDate >= date && l.status !== 'rejected') || null;
        const used = c.daysOffUsed || 0;
        const total = c.holidayTotal || 20;

        return {
          uid: c.uid,
          name: c.name,
          role: c.role,
          email: c.email,
          publicId: c.publicId || null,
          lastSignInAt: null,
          accountStatus: 'active',
          accountDisabled: false,
          status: stored?.status || c.defaultStatus || 'present',
          note: stored?.note !== undefined ? stored.note : (c.defaultNote || ''),
          daysOffUsed: used,
          holidayTotal: total,
          holidayRemaining: Math.max(0, total - used),
          upcomingLeave: upcoming ? {
            startDate: upcoming.startDate,
            endDate: upcoming.endDate,
            days: upcoming.days || 1,
            status: upcoming.status,
            reason: upcoming.reason
          } : null,
          updatedAt: stored?.updatedAt || null,
          updatedBy: stored?.updatedBy || null
        };
      });
      return ok({ items });
    }

    // Students attendance
    const students = db.users.filter((u) => u.role === 'student');
    const items = students.map((s) => {
      const key = `${date}_${s.uid}`;
      const stored = pilotAttendanceStore.get(key);
      return {
        uid: s.uid,
        name: s.displayName,
        classIds: s.classIds || [],
        publicId: s.publicId || null,
        email: s.email || null,
        lastSignInAt: s.auth?.lastSignInAt || null,
        accountStatus: s.status || 'active',
        accountDisabled: Boolean(s.auth?.disabled),
        status: stored?.status || 'unmarked',
        note: stored?.note || '',
        updatedAt: stored?.updatedAt || null,
        updatedBy: stored?.updatedBy || null
      };
    });
    return ok({ items });
  };

  const handleAttendancePut = ({ params, body, caller }) => {
    const { date, status, note = '', reason = '' } = body || {};
    const key = `${date}_${params.uid}`;
    const record = {
      date,
      status,
      note: note.trim(),
      reason: reason.trim(),
      updatedAt: now(),
      updatedBy: { uid: caller.uid, name: caller.name }
    };
    const before = pilotAttendanceStore.get(key) || null;
    pilotAttendanceStore.set(key, record);
    const hist = pilotHistoryStore.get(key) || [];
    hist.unshift({ id: newId('hist'), before, after: record, reason, updatedAt: now(), updatedBy: { uid: caller.uid, name: caller.name } });
    pilotHistoryStore.set(key, hist);
    return ok(record);
  };

  const handleAttendanceHistory = ({ params, query }) => {
    const key = `${query.date}_${params.uid}`;
    const items = pilotHistoryStore.get(key) || [];
    return ok({ items });
  };

  const handleLeaveGet = () => {
    return ok({ items: [...pilotLeaveStore] });
  };

  const handleLeavePost = ({ body, caller }) => {
    const { startDate, endDate, reason } = body || {};
    const days = Math.max(1, Math.round((new Date(endDate) - new Date(startDate)) / 86400000) + 1);
    const item = {
      id: newId('leave'),
      uid: caller.uid,
      name: caller.name,
      startDate,
      endDate,
      days,
      reason: String(reason || '').trim(),
      status: 'pending',
      response: '',
      createdAt: now()
    };
    pilotLeaveStore.unshift(item);
    return ok({ id: item.id }, 201);
  };

  const handleLeavePatch = ({ params, body, caller }) => {
    const target = pilotLeaveStore.find((l) => l.id === params.id);
    if (!target) return fail(404, 'NOT_FOUND', 'Leave request not found.');
    target.status = body.status;
    target.response = String(body.response || '').trim();
    target.updatedAt = now();
    target.updatedBy = { uid: caller.uid, name: caller.name };
    return ok({ ok: true });
  };

  // Register both /api/pilot and /pilot patterns
  ['/api/pilot', '/pilot'].forEach((base) => {
    route('GET', `${base}/attendance`, ['admin', 'supervisor', 'teacher', 'coach'], handleAttendanceGet);
    route('PUT', `${base}/attendance/:uid`, ['admin', 'supervisor'], handleAttendancePut);
    route('GET', `${base}/attendance/:uid/history`, ['admin', 'supervisor'], handleAttendanceHistory);
    route('GET', `${base}/leave`, null, handleLeaveGet);
    route('POST', `${base}/leave`, null, handleLeavePost);
    route('PATCH', `${base}/leave/:id`, ['admin', 'supervisor'], handleLeavePatch);
  });

  async function handle({ method, path, query = {}, body = null, caller }) {
    if (latencyMs) await new Promise((r) => setTimeout(r, latencyMs));
    if (!caller?.uid) return fail(401, 'UNAUTHENTICATED', 'Sign in again.');

    const [cleanPath, queryString] = (path || '').split('?');
    const parsedQuery = { ...query };
    if (queryString) {
      const sp = new URLSearchParams(queryString);
      for (const [k, v] of sp.entries()) {
        if (parsedQuery[k] === undefined) parsedQuery[k] = v;
      }
    }

    for (const r of routes) {
      if (r.method !== method) continue;
      const m = r.re.exec(cleanPath);
      if (!m) continue;
      if (r.allow && !r.allow.includes(caller.role) && !(r.allow.includes('teacher') && caller.role === 'coach')) {
        return fail(403, 'FORBIDDEN', 'You do not have permission to do that.');
      }
      const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
      // Deep copies both ways, like a network hop: callers cannot mutate state by reference.
      const res = r.fn({ params, query: parsedQuery, body: body ? JSON.parse(JSON.stringify(body)) : null, caller });
      return JSON.parse(JSON.stringify(res));
    }
    return fail(404, 'NOT_FOUND', `No route ${method} ${path}`);
  }

  return { handle, db };
}

let singleton = null;
export function handle(req) {
  singleton = singleton || createMockBackend();
  return singleton.handle(req);
}
