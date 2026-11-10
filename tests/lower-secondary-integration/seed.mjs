/** Synthetic accounts, created through the real admin API wherever one exists. Emulators only. */
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { SCHOOL_COHORTS } from '../../src/utils/schoolCohorts.js';

export const PASSWORD = 'synthetic-review-only-1';
const ORG = 'org-integration', SCHOOL = 'sch-integration', OTHER_SCHOOL = 'sch-other', CLASS = 'class-lower-sec', OTHER_CLASS = 'class-other';
const year = new Date().getUTCFullYear();
const dob = (age) => `${year - age}-01-15`;

function guard() {
  const local = (host) => /^(127\.0\.0\.1|localhost):\d+$/.test(host || '');
  const project = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
  if (!local(process.env.FIRESTORE_EMULATOR_HOST) || !local(process.env.FIREBASE_AUTH_EMULATOR_HOST) || !String(project).startsWith('demo-') || process.env.GOOGLE_APPLICATION_CREDENTIALS) throw new Error('Refusing to seed outside demo emulators.');
  return project;
}

export async function token(email) {
  const res = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: PASSWORD, returnSecureToken: true }) });
  const body = await res.json();
  if (!body.idToken) throw new Error(`Sign-in failed for ${email}: ${JSON.stringify(body)}`);
  return body.idToken;
}

export async function seed(apiBase, program, progressFor) {
  const projectId = guard();
  if (!getApps().length) initializeApp({ projectId, storageBucket: process.env.FIREBASE_STORAGE_BUCKET });
  const auth = getAuth(), db = getFirestore();
  const call = async (method, url, tok, body) => {
    const res = await fetch(`${apiBase}${url}`, { method, headers: { Authorization: `Bearer ${tok}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: res.status, body: await res.json().catch(() => null) };
  };
  await db.collection('organizations').doc(ORG).set({ name: 'Integration Org', status: 'active' });
  for (const [id, name] of [[SCHOOL, 'Integration School'], [OTHER_SCHOOL, 'Other School']]) await db.collection('schools').doc(id).set({ orgId: ORG, name, timezone: 'Asia/Bangkok', status: 'active', features: { questMode: true } });
  for (const c of SCHOOL_COHORTS) await db.collection('cohorts').doc(c.cohortId).set({ ...c, id: c.cohortId, orgId: ORG, status: 'active' });
  await db.collection('classes').doc(CLASS).set({ name: 'Lower Secondary A', orgId: ORG, schoolId: SCHOOL, cohortId: 'cohort-lower-secondary', status: 'active', learnerCount: 0 });
  await db.collection('classes').doc(OTHER_CLASS).set({ name: 'Other Class', orgId: ORG, schoolId: OTHER_SCHOOL, cohortId: 'cohort-lower-secondary', status: 'active', learnerCount: 0 });

  const admin = await auth.createUser({ email: 'admin@integration.test', password: PASSWORD, emailVerified: true, displayName: 'Synthetic Admin' });
  await auth.setCustomUserClaims(admin.uid, { role: 'admin', orgId: ORG, schoolIds: [SCHOOL, OTHER_SCHOOL], classIds: [] });
  await db.collection('users').doc(admin.uid).set({ uid: admin.uid, email: admin.email, displayName: 'Synthetic Admin', role: 'admin', orgId: ORG, schoolIds: [SCHOOL, OTHER_SCHOOL], classIds: [], status: 'active' });
  const adminToken = await token(admin.email);

  const accounts = {};
  // The admin API requires a cohort, so a learner with no verified age can only come from self-signup.
  const selfSignup = async (key, { ageBand = '13-15', school = SCHOOL, extra = {} } = {}) => {
    const email = `${key.toLowerCase()}@integration.test`;
    const user = await auth.createUser({ email, password: PASSWORD, emailVerified: true, displayName: `${key} Synthetic` });
    await auth.setCustomUserClaims(user.uid, { role: 'student', orgId: ORG, schoolIds: [school], classIds: [] });
    await db.collection('users').doc(user.uid).set({ uid: user.uid, email, displayName: `${key} Synthetic`, role: 'student', ...(ageBand ? { ageBand } : {}), orgId: ORG, schoolIds: [school], classIds: [], status: 'active', isFirstTimeUser: false, ...extra });
    accounts[key] = { uid: user.uid, email, name: key };
    return accounts[key];
  };
  const assign = async (key, school, klass) => {
    const assigned = await call('PUT', `/api/admin/users/${accounts[key].uid}/assignments`, adminToken, { schoolIds: [school], classIds: [klass] });
    if (assigned.status >= 300) throw new Error(`Assign ${key}: ${assigned.status} ${JSON.stringify(assigned.body)}`);
  };
  const staffCreated = async (key, { age, cohort, ageBand = '13-15', school = SCHOOL, klass = null, extra = {} }) => {
    const email = `${key.toLowerCase()}@integration.test`;
    const created = await call('POST', '/api/admin/users', adminToken, { email, givenNames: key, surname: 'Synthetic', displayName: `${key} Synthetic`, role: 'student', schoolIds: [school], cohortId: cohort, ageBand, dateOfBirth: dob(age), ...extra });
    if (created.status !== 201) throw new Error(`Create ${key}: ${created.status} ${JSON.stringify(created.body)}`);
    await auth.updateUser(created.body.uid, { password: PASSWORD, emailVerified: true });
    accounts[key] = { uid: created.body.uid, email, name: key };
    if (klass) await assign(key, school, klass);
    await db.collection('users').doc(created.body.uid).set({ isFirstTimeUser: false, status: 'active' }, { merge: true });
    return accounts[key];
  };
  const LOWER = 'cohort-lower-secondary', HIGHER = 'cohort-higher-secondary', PRIMARY = 'cohort-higher-primary', primary = { ageBand: 'primary', extra: { cohort: 'primary' } };
  await staffCreated('Age11', { age: 11, cohort: LOWER, klass: CLASS });
  await staffCreated('Age14', { age: 14, cohort: LOWER, klass: CLASS });
  await staffCreated('CatalogUser', { age: 12, cohort: LOWER, klass: CLASS });
  await staffCreated('Age15', { age: 15, cohort: HIGHER });
  await staffCreated('Age17', { age: 17, cohort: HIGHER, ageBand: '16-18' });
  await staffCreated('Age10', { age: 10, cohort: PRIMARY, ...primary });
  await staffCreated('Age11Primary', { age: 11, cohort: PRIMARY, ...primary });
  await staffCreated('OverrideOn', { age: 15, cohort: HIGHER });
  await staffCreated('OverrideOff', { age: 13, cohort: LOWER });
  await staffCreated('OverrideUnder', { age: 10, cohort: PRIMARY, ...primary });
  await staffCreated('Outsider', { age: 12, cohort: LOWER, school: OTHER_SCHOOL, klass: OTHER_CLASS });
  await selfSignup('NoAge', { ageBand: null });
  await selfSignup('BadDob', { ageBand: null });
  await db.collection('userLayoutAuthority').doc(accounts.BadDob.uid).set({ dobVerified: true, dateOfBirth: 'not-a-date' }, { merge: true });
  await selfSignup('Legacy', { extra: { dateOfBirth: dob(13), cohort: 'lower-secondary', yearLevel: 8 } });
  await selfSignup('ClassOnly');
  await assign('ClassOnly', SCHOOL, CLASS);
  // Joined by class code: on the profile, but never in the signed claims.
  await selfSignup('SelfEnrolled', { extra: { classIds: [CLASS] } });
  await selfSignup('Spoofer');

  const overrides = {
    on: await call('PATCH', `/api/admin/users/${accounts.OverrideOn.uid}`, adminToken, { layoutOverride: 'lower-secondary' }),
    off: await call('PATCH', `/api/admin/users/${accounts.OverrideOff.uid}`, adminToken, { layoutOverride: 'existing' }),
    under: await call('PATCH', `/api/admin/users/${accounts.OverrideUnder.uid}`, adminToken, { layoutOverride: 'lower-secondary' })
  };

  // Age14: an active course with counted progress, and earned XP and badges.
  const { uid } = accounts.Age14;
  await db.collection('enrolments').doc(`${uid}_${program.id}`).set({ learnerId: uid, programId: program.id, source: 'self-added', currentPhaseId: program.phases[0].id || program.phases[0].phaseId, status: 'active', startedAt: Date.now(), updatedAt: Date.now() });
  await db.collection('users').doc(uid).collection('activityProgress').doc(`pbl-program-${program.id}`).set(progressFor(program));
  await db.collection('learnerQuest').doc(uid).set({ schemaVersion: 1, xp: 262, level: 3, counters: { reflections: 3, evidence: 1, taskSteps: 4, goalsAcknowledged: 0, reviewed: 0, goalsAchieved: 0, bestStreak: 2 }, streak: { count: 2, lastActiveDate: null, freezes: 0 }, daily: { date: null, selfXp: 0 }, badges: [{ id: 'first-evidence', earnedAt: '2026-10-01T00:00:00Z' }, { id: 'curious-mind', earnedAt: '2026-10-20T00:00:00Z' }], celebrations: [], revision: 3 });
  return { accounts, adminToken, call, overrides, db };
}
