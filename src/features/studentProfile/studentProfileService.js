/**
 * Student profiles and notifications, implementing docs/parent-engagement-contract.md
 * (v2, §2 and §3). MOCK ONLY: in-memory, resets on reload, uses synthetic learners.
 * Swap the bodies for fetch calls to /api/student-profiles and /api/notifications
 * when Gemini's routes land; the return shapes stay the same.
 */

export const PROFILE_LIMITS = Object.freeze({
  schoolStudentId: 32, progressNote: 200, gradeSubject: 60, gradeText: 10, gradeComment: 240,
  schoolSummary: 500, gradesMax: 40
});

export const COHORTS = Object.freeze([
  { id: 'primary', label: 'Primary (ages 6–11)' },
  { id: 'lower-secondary', label: 'Lower Secondary (ages 12–14)' },
  { id: 'higher-secondary', label: 'Higher Secondary (ages 15–18)' }
]);

export class ProfileError extends Error {
  constructor(status, code, message, field = null) {
    super(message);
    this.name = 'ProfileError';
    this.status = status;
    this.code = code;
    this.field = field;
  }
}

const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));
const isCoach = (role) => role === 'coach' || role === 'teacher' || role === 'admin';

/* ---------- Synthetic seed (test data only) ---------- */

const profiles = new Map([
  ['synthetic-learner-1', {
    learnerUid: 'synthetic-learner-1',
    givenName: 'Test Learner A',
    schoolStudentId: 'TEST-0001',
    dateOfBirth: '2014-03-12',
    cohort: 'primary',
    mentor: { uid: 'synthetic-coach-1', name: 'Test Coach', teamsUrl: 'https://teams.microsoft.com/l/chat/0/0' },
    academicProgress: { percent: 62, note: 'On track for Term 3 projects', setBy: 'synthetic-coach-1', setAt: Date.parse('2026-10-20') },
    grades: [
      { id: 'g1', subject: 'Mathematics', term: 'Term 2 2026', grade: 'B+', comment: 'Strong on patterns', enteredBy: 'synthetic-coach-1', enteredAt: Date.parse('2026-09-30') },
      { id: 'g2', subject: 'English', term: 'Term 2 2026', grade: 'A-', enteredBy: 'synthetic-coach-1', enteredAt: Date.parse('2026-09-30') }
    ],
    gpa: { value: 3.4, scale: 4.0, term: 'Term 2 2026', enteredBy: 'synthetic-coach-1', enteredAt: Date.parse('2026-09-30') },
    schoolSummary: { text: 'Curious and collaborative. Works best with a clear first step.', updatedBy: 'synthetic-coach-1', updatedAt: Date.parse('2026-10-18') },
    badges: [{ id: 'b1', title: 'First prototype', earnedAt: Date.parse('2026-10-10') }],
    parentUids: ['synthetic-parent-1'],
    updatedAt: Date.parse('2026-10-20')
  }]
]);

/**
 * Mock only: any learner the mock backend knows gets a synthetic default profile
 * the first time it is read or edited. Real profiles are created by the school
 * office; this default is labelled synthetic and never reaches live data.
 */
function profileOrDefault(learnerUid) {
  if (!profiles.has(learnerUid)) {
    profiles.set(learnerUid, {
      learnerUid,
      schoolStudentId: `TEST-${String(learnerUid).slice(-4)}`,
      dateOfBirth: '2014-03-12',
      cohort: 'primary',
      mentor: { uid: 'synthetic-coach-1', name: 'Test Coach', teamsUrl: null },
      academicProgress: null,
      grades: [],
      gpa: null,
      schoolSummary: null,
      badges: [],
      parentUids: [],
      synthetic: true,
      updatedAt: Date.now()
    });
  }
  return profiles.get(learnerUid);
}

const notifications = new Map([
  ['synthetic-parent-1', [
    { id: 'n1', type: 'profile_updated', title: 'Academic progress was updated', body: null, link: '#/parent', childUid: 'synthetic-learner-1', createdAt: Date.parse('2026-10-20'), readAt: null }
  ]]
]);

/* ---------- Validation ---------- */

const str = (v) => String(v ?? '').trim();

function checkText(value, field, max, { required = false } = {}) {
  const s = str(value);
  if (required && !s) throw new ProfileError(400, 'VALIDATION', `${field} is required.`, field);
  if (s.length > max) throw new ProfileError(400, 'VALIDATION', `${field} is over ${max} characters.`, field);
  return s;
}

export function validateTeamsUrl(raw) {
  const s = str(raw);
  if (!s) return null;
  let url;
  try { url = new URL(s); } catch { throw new ProfileError(400, 'VALIDATION', 'Teams link must be a full web address.', 'teamsUrl'); }
  const onTeams = url.hostname === 'teams.microsoft.com' || url.hostname.endsWith('.teams.microsoft.com');
  if (url.protocol !== 'https:' || !onTeams) {
    throw new ProfileError(400, 'VALIDATION', 'Teams link must be an https link to teams.microsoft.com.', 'teamsUrl');
  }
  return s;
}

function checkProgress(p) {
  if (!Number.isInteger(p.percent) || p.percent < 0 || p.percent > 100) {
    throw new ProfileError(400, 'VALIDATION', 'Progress must be a whole number from 0 to 100.', 'percent');
  }
  return { percent: p.percent, note: checkText(p.note, 'Progress note', PROFILE_LIMITS.progressNote) || undefined };
}

function checkGpa(g) {
  const value = Number(g.value);
  if (!Number.isFinite(value) || value < 0 || value > 4.0) {
    throw new ProfileError(400, 'VALIDATION', 'GPA must be between 0.0 and 4.0.', 'gpa');
  }
  return { value: Math.round(value * 100) / 100, scale: 4.0, term: checkText(g.term, 'GPA term', 40, { required: true }) };
}

function checkGrade(g, actor, now) {
  return {
    id: str(g.id) || `g-${now}-${Math.random().toString(36).slice(2, 7)}`,
    subject: checkText(g.subject, 'Subject', PROFILE_LIMITS.gradeSubject, { required: true }),
    term: checkText(g.term, 'Term', 40, { required: true }),
    grade: checkText(g.grade, 'Grade', PROFILE_LIMITS.gradeText, { required: true }),
    comment: checkText(g.comment, 'Comment', PROFILE_LIMITS.gradeComment) || undefined,
    enteredBy: actor, enteredAt: now
  };
}

/* ---------- Profiles ---------- */

function ageOn(dob, now = new Date()) {
  const d = new Date(`${dob}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  let age = now.getUTCFullYear() - d.getUTCFullYear();
  const m = now.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < d.getUTCDate())) age -= 1;
  return age;
}

/** Parent and student view. Admins and coaches get the same fields here; the editor is separate. */
export async function getStudentProfile(learnerUid, { viewerUid, role, linkedParentUids = [] } = {}) {
  await delay();
  const p = profileOrDefault(learnerUid);
  // Mock check only. The server must confirm the parent link itself (parentLinks, active).
  const canRead = viewerUid === learnerUid || isCoach(role) || linkedParentUids.includes(viewerUid);
  if (!canRead) throw new ProfileError(404, 'NOT_FOUND', 'No profile found.');
  return {
    schoolStudentId: p.schoolStudentId,
    age: ageOn(p.dateOfBirth),
    cohort: COHORTS.find((c) => c.id === p.cohort)?.label || p.cohort,
    mentor: { name: p.mentor.name, teamsUrl: p.mentor.teamsUrl || null },
    academicProgress: p.academicProgress || null,
    grades: p.grades.map(({ subject, term, grade, comment }) => ({ subject, term, grade, comment: comment || null })),
    gpa: p.gpa ? { value: p.gpa.value, scale: p.gpa.scale, term: p.gpa.term } : null,
    badges: p.badges,
    schoolSummary: p.schoolSummary ? { text: p.schoolSummary.text, updatedAt: p.schoolSummary.updatedAt } : null
  };
}

/** Coach or admin editor. Returns the full record, including the fields parents cannot change. */
export async function getProfileForEditing(learnerUid, { role }) {
  await delay();
  if (!isCoach(role)) throw new ProfileError(403, 'FORBIDDEN', 'Only coaches can edit profiles.');
  const p = profileOrDefault(learnerUid);
  if (!p) throw new ProfileError(404, 'NOT_FOUND', 'No profile found.');
  return structuredClone(p);
}

/**
 * Applies a coach edit. Only coach-editable fields change: progress, grades, GPA,
 * school summary and the Teams link. Admin-only fields (school ID, date of birth,
 * cohort, mentor) need the admin route, which this mock does not expose to coaches.
 */
export async function updateProfile(learnerUid, patch, { actorUid, role }) {
  await delay();
  if (!isCoach(role)) throw new ProfileError(403, 'FORBIDDEN', 'Only coaches can edit profiles.');
  const p = profileOrDefault(learnerUid);
  if (!p) throw new ProfileError(404, 'NOT_FOUND', 'No profile found.');
  const now = Date.now();
  const changed = [];

  if (patch.academicProgress) {
    p.academicProgress = { ...checkProgress(patch.academicProgress), setBy: actorUid, setAt: now };
    changed.push('academic progress');
  }
  if (patch.grades) {
    if (patch.grades.length > PROFILE_LIMITS.gradesMax) throw new ProfileError(400, 'VALIDATION', `Up to ${PROFILE_LIMITS.gradesMax} grades.`, 'grades');
    p.grades = patch.grades.map((g) => checkGrade(g, actorUid, now));
    changed.push('grades');
  }
  if (patch.gpa !== undefined) {
    p.gpa = patch.gpa === null ? null : { ...checkGpa(patch.gpa), enteredBy: actorUid, enteredAt: now };
    changed.push('GPA');
  }
  if (patch.schoolSummary !== undefined) {
    const text = checkText(patch.schoolSummary, 'School summary', PROFILE_LIMITS.schoolSummary);
    p.schoolSummary = text ? { text, updatedBy: actorUid, updatedAt: now } : null;
    changed.push('school summary');
  }
  if (patch.teamsUrl !== undefined) {
    p.mentor = { ...p.mentor, teamsUrl: validateTeamsUrl(patch.teamsUrl) };
    changed.push('Teams link');
  }
  p.updatedAt = now;

  if (changed.length) notifyParents(p, `${changed.join(', ')} updated`);
  return structuredClone(p);
}

/* ---------- Notifications (contract §3) ---------- */

function notifyParents(profile, what) {
  for (const parentUid of profile.parentUids) {
    const list = notifications.get(parentUid) || [];
    list.unshift({
      id: `n-${Date.now()}-${list.length}`,
      type: 'profile_updated',
      title: 'Your child’s profile was updated',
      body: what,
      link: '#/parent',
      childUid: profile.learnerUid,
      createdAt: Date.now(),
      readAt: null
    });
    notifications.set(parentUid, list);
  }
}

export async function listNotifications(uid, { limit = 20 } = {}) {
  await delay(60);
  const list = notifications.get(uid) || [];
  return { items: list.slice(0, limit), unreadCount: list.filter((n) => !n.readAt).length };
}

export async function markNotificationRead(uid, id) {
  await delay(40);
  const n = (notifications.get(uid) || []).find((x) => x.id === id);
  if (n && !n.readAt) n.readAt = Date.now();
}

export async function markAllRead(uid) {
  await delay(40);
  for (const n of notifications.get(uid) || []) if (!n.readAt) n.readAt = Date.now();
}

/** Test helper: lets a test reset the in-memory store. */
export function __resetForTests() {
  profiles.clear();
  notifications.clear();
}
