// Update local review records without resetting enrollments or submitted work.
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { SCHOOL_COHORTS } from '../src/utils/schoolCohorts.js';

const host = process.env.FIRESTORE_EMULATOR_HOST;
if (!host || !/^(127\.0\.0\.1|localhost):\d+$/.test(host)) {
  throw new Error('This migration requires a localhost Firestore emulator.');
}
const app = initializeApp({ projectId: 'demo-hearisland-local' });
const db = getFirestore(app);
const apply = process.argv.includes('--apply');
const cohortIdForYear = year => {
  const n = Number(String(year || '').match(/\d+/)?.[0]);
  return n > 0 && n <= 3 ? 'cohort-lower-primary' : n <= 5 && n > 0 ? 'cohort-higher-primary' : n <= 9 && n > 0 ? 'cohort-lower-secondary' : n >= 10 ? 'cohort-higher-secondary' : null;
};
const classes = await db.collection('classes').get();
const classCohorts = new Map();
const updates = [];
for (const doc of classes.docs) {
  const row = doc.data();
  if (!['cohort-wpr', 'cohort-w2e'].includes(row.cohortId)) continue;
  const cohortId = cohortIdForYear(row.yearLevel);
  if (!cohortId) throw new Error(`Cannot infer cohort for class ${doc.id}`);
  classCohorts.set(doc.id, cohortId);
  const cohort = SCHOOL_COHORTS.find(c => c.cohortId === cohortId);
  updates.push([doc.ref, { cohortId, name: cohort.name.en }]);
}
const users = await db.collection('users').get();
for (const doc of users.docs) {
  const row = doc.data();
  if (row.role === 'teacher' && row.classIds?.length === 1 && classCohorts.has(row.classIds[0])) {
    const cohort = SCHOOL_COHORTS.find(c => c.cohortId === classCohorts.get(row.classIds[0]));
    updates.push([doc.ref, { groupName: cohort.name.en }]);
  }
  if (!['cohort-wpr', 'cohort-w2e'].includes(row.cohortId)) continue;
  const cohortId = cohortIdForYear(row.yearLevel);
  if (!cohortId) throw new Error(`Cannot infer cohort for learner ${doc.id}`);
  const cohort = SCHOOL_COHORTS.find(c => c.cohortId === cohortId);
  updates.push([doc.ref, { cohortId, groupName: cohort.name.en }]);
}
console.log(`${apply ? 'Applying' : 'Previewing'} ${updates.length} local record updates and four cohort definitions.`);
if (apply) {
  const batch = db.batch();
  for (const c of SCHOOL_COHORTS) batch.set(db.collection('cohorts').doc(c.cohortId), { ...c, orgId: 'org-welearn' }, { merge: true });
  for (const [ref, data] of updates) batch.update(ref, data);
  for (const id of ['cohort-wpr', 'cohort-w2e']) batch.set(db.collection('cohorts').doc(id), { status: 'inactive' }, { merge: true });
  await batch.commit();
  console.log('Local records updated. Enrollment and evidence records preserved.');
}
