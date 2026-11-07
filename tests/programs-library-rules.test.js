/**
 * Permission boundaries of the shared Programs library.
 *
 * Until Gemini applies the handoff in docs/implementation/programs-library/, this
 * loads the proposed rules; afterwards point RULES_FILE at firestore.rules.
 * Run: firebase emulators:exec --only firestore --project demo-hearisland-rules \
 *        --config firebase.programs-library.local.json "vitest run tests/programs-library-rules.test.js"
 */
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import fs from 'fs';
import { collection, doc, getDoc, getDocs, query, runTransaction, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';

const RULES_FILE = process.env.PROGRAMS_RULES_FILE || 'docs/implementation/programs-library/firestore.rules.proposed';
const host = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8288';
const projectId = process.env.GCLOUD_PROJECT || 'demo-hearisland-rules';
if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host) || !/^demo-[a-z0-9-]+$/.test(projectId)) {
  throw new Error('Rules tests require a local emulator and a demo project.');
}

let env;
const ORG = 'org-welearn';
const coach = (uid, claims = {}) => env.authenticatedContext(uid, { role: 'teacher', classIds: [], ...claims }).firestore();
const creator = () => coach('creator', { orgId: ORG });
const reviewer = () => coach('reviewer', { orgId: ORG });
const legacyCoach = () => coach('legacy_coach');
const otherOrg = () => coach('other_org', { orgId: 'org-other' });
const admin = () => env.authenticatedContext('admin', { role: 'admin', orgId: ORG }).firestore();
const supervisor = () => env.authenticatedContext('sup', { role: 'supervisor', orgId: ORG }).firestore();
const student = () => env.authenticatedContext('student', { role: 'student', orgId: ORG }).firestore();
const noRole = () => env.authenticatedContext('student2').firestore();
const anon = () => env.unauthenticatedContext().firestore();

const record = (over = {}) => ({
  programId: 'p1', orgId: ORG, creatorUid: 'creator', creatorName: 'Creator', title: 'T', description: 'D',
  unit: { id: 'p1', unitTitle: 'T' }, status: 'draft', draftVersion: 1, publishedVersion: null,
  hasUnpublishedChanges: false, createdAt: 1, updatedAt: 1, publishedAt: null, ...over
});
const notification = (over = {}) => ({
  type: 'program_review', programId: 'p1', orgId: ORG, actorUid: 'creator', actorName: 'Creator', programTitle: 'T', createdAt: 1, ...over
});
const comment = (over = {}) => ({
  authorUid: 'reviewer', authorName: 'R', orgId: ORG, body: 'Looks good', view: 'draft', version: 1, createdAt: 2, ...over
});
const edit = { title: 'T2', draftVersion: 2, hasUnpublishedChanges: false, updatedAt: 2 };
const live = (over = {}) => ({ title: 'T', status: 'published', visibility: 'centre', authorId: 'creator', libraryManaged: true, libraryVersion: 1, ...over });

function publishAs(db, uid, version = 1) {
  const batch = writeBatch(db);
  batch.set(doc(db, 'pbl_programs', 'p1'), live({ libraryVersion: version }), { merge: true });
  batch.update(doc(db, 'program_library', 'p1'), {
    status: 'published', publishedVersion: version, hasUnpublishedChanges: false, publishedAt: 3, lastPublishedAt: 3, lastPublishedBy: uid, updatedAt: 3
  });
  return batch.commit();
}

const seed = (fn) => env.withSecurityRulesDisabled((ctx) => fn(ctx.firestore()));
const seedRecord = (over) => seed((db) => setDoc(doc(db, 'program_library', 'p1'), record(over)));

beforeAll(async () => {
  const [hostname, port] = host.split(':');
  env = await initializeTestEnvironment({ projectId, firestore: { rules: fs.readFileSync(RULES_FILE, 'utf8'), host: hostname, port: Number(port) } });
});
afterAll(async () => { await env?.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); });

describe('saving a draft', () => {
  it('lets a coach create a draft and its notification together', async () => {
    const db = creator();
    const batch = writeBatch(db);
    batch.set(doc(db, 'program_library', 'p1'), record());
    batch.set(doc(db, 'coach_notifications', 'program-review_p1'), notification());
    await assertSucceeds(batch.commit());
  });

  it('works as the transaction the app runs: it reads the id before the record exists', async () => {
    const db = creator();
    await assertSucceeds(runTransaction(db, async (tx) => {
      const ref = doc(db, 'program_library', 'p1');
      await tx.get(ref);
      tx.set(ref, record());
      tx.set(doc(db, 'coach_notifications', 'program-review_p1'), notification());
    }));
    await assertFails(getDoc(doc(student(), 'program_library', 'missing')));
  });

  it('treats a coach with no org claim as the default organization', async () => {
    const db = legacyCoach();
    await assertSucceeds(setDoc(doc(db, 'program_library', 'p1'), record({ creatorUid: 'legacy_coach' })));
    await assertFails(setDoc(doc(db, 'program_library', 'p2'), record({ programId: 'p2', creatorUid: 'legacy_coach', orgId: 'org-other' })));
  });

  it('refuses a forged creator, org, or a record already marked published', async () => {
    const db = creator();
    await assertFails(setDoc(doc(db, 'program_library', 'p1'), record({ creatorUid: 'someone' })));
    await assertFails(setDoc(doc(db, 'program_library', 'p1'), record({ orgId: 'org-other' })));
    await assertFails(setDoc(doc(db, 'program_library', 'p1'), record({ status: 'published' })));
  });

  it('refuses students and signed-out visitors', async () => {
    for (const db of [student(), noRole(), anon()]) {
      await assertFails(setDoc(doc(db, 'program_library', 'p1'), record({ creatorUid: 'student' })));
    }
  });
});

describe('reading drafts and feedback', () => {
  beforeEach(async () => {
    await seedRecord();
    await seed((db) => setDoc(doc(db, 'program_library', 'p1', 'comments', 'c1'), comment()));
    await seed((db) => setDoc(doc(db, 'coach_notifications', 'program-review_p1'), notification()));
  });

  it('lets every coach and administrator in the organization read them', async () => {
    for (const db of [creator(), reviewer(), legacyCoach(), admin(), supervisor()]) {
      await assertSucceeds(getDoc(doc(db, 'program_library', 'p1')));
      await assertSucceeds(getDocs(query(collection(db, 'program_library'), where('orgId', '==', ORG))));
      await assertSucceeds(getDocs(collection(db, 'program_library', 'p1', 'comments')));
      await assertSucceeds(getDocs(query(collection(db, 'coach_notifications'), where('orgId', '==', ORG))));
    }
  });

  it('refuses students by direct read and by query', async () => {
    for (const db of [student(), noRole(), anon()]) {
      await assertFails(getDoc(doc(db, 'program_library', 'p1')));
      await assertFails(getDocs(collection(db, 'program_library')));
      await assertFails(getDocs(query(collection(db, 'program_library'), where('orgId', '==', ORG))));
      await assertFails(getDoc(doc(db, 'program_library', 'p1', 'comments', 'c1')));
      await assertFails(getDocs(collection(db, 'program_library', 'p1', 'comments')));
      await assertFails(getDoc(doc(db, 'coach_notifications', 'program-review_p1')));
      await assertFails(getDocs(collection(db, 'coach_notifications')));
    }
  });

  it('refuses a coach from another organization', async () => {
    const db = otherOrg();
    await assertFails(getDoc(doc(db, 'program_library', 'p1')));
    await assertFails(getDocs(query(collection(db, 'program_library'), where('orgId', '==', ORG))));
    await assertFails(getDocs(collection(db, 'program_library', 'p1', 'comments')));
    await assertFails(setDoc(doc(db, 'program_library', 'p1', 'comments', 'x'), comment({ authorUid: 'other_org', orgId: 'org-other' })));
    await assertFails(getDoc(doc(db, 'coach_notifications', 'program-review_p1')));
  });
});

describe('feedback', () => {
  beforeEach(() => seedRecord());

  it('lets a reviewer comment as themselves, on a version', async () => {
    await assertSucceeds(setDoc(doc(reviewer(), 'program_library', 'p1', 'comments', 'c1'), comment()));
  });

  it('refuses impersonation, empty or oversized comments, and students', async () => {
    const col = (db, id) => doc(db, 'program_library', 'p1', 'comments', id);
    await assertFails(setDoc(col(reviewer(), 'a'), comment({ authorUid: 'creator' })));
    await assertFails(setDoc(col(reviewer(), 'b'), comment({ body: '' })));
    await assertFails(setDoc(col(reviewer(), 'c'), comment({ body: 'x'.repeat(2001) })));
    await assertFails(setDoc(col(student(), 'd'), comment({ authorUid: 'student' })));
  });

  it('keeps feedback append-only', async () => {
    await seed((db) => setDoc(doc(db, 'program_library', 'p1', 'comments', 'c1'), comment()));
    await assertFails(updateDoc(doc(reviewer(), 'program_library', 'p1', 'comments', 'c1'), { body: 'changed' }));
  });
});

describe('editing and publishing', () => {
  beforeEach(() => seedRecord());

  it('lets the creator and an administrator edit, one version at a time', async () => {
    await assertSucceeds(updateDoc(doc(creator(), 'program_library', 'p1'), edit));
    await assertSucceeds(updateDoc(doc(admin(), 'program_library', 'p1'), { ...edit, draftVersion: 3 }));
    await assertFails(updateDoc(doc(creator(), 'program_library', 'p1'), { ...edit, draftVersion: 9 }));
  });

  it('refuses edits by another coach, a supervisor, a student', async () => {
    for (const db of [reviewer(), supervisor(), student(), otherOrg()]) {
      await assertFails(updateDoc(doc(db, 'program_library', 'p1'), edit));
    }
  });

  it('never lets ownership move', async () => {
    await assertFails(updateDoc(doc(creator(), 'program_library', 'p1'), { ...edit, creatorUid: 'reviewer' }));
    await assertFails(updateDoc(doc(creator(), 'program_library', 'p1'), { ...edit, orgId: 'org-other' }));
  });

  it('lets the creator and an administrator publish', async () => {
    await assertSucceeds(publishAs(creator(), 'creator'));
    await seed((db) => updateDoc(doc(db, 'program_library', 'p1'), { draftVersion: 2 }));
    await assertSucceeds(publishAs(admin(), 'admin', 2));
  });

  it('refuses publishing by another coach, including directly into pbl_programs', async () => {
    await assertFails(publishAs(reviewer(), 'reviewer'));
    await assertFails(setDoc(doc(reviewer(), 'pbl_programs', 'p1'), live()));
    await assertFails(setDoc(doc(student(), 'pbl_programs', 'p1'), live()));
    await assertFails(setDoc(doc(supervisor(), 'pbl_programs', 'p1'), live()));
  });

  it('refuses marking a record published without publishing it', async () => {
    await assertFails(updateDoc(doc(creator(), 'program_library', 'p1'), {
      status: 'published', publishedVersion: 1, hasUnpublishedChanges: false, publishedAt: 3, lastPublishedAt: 3, lastPublishedBy: 'creator', updatedAt: 3
    }));
  });

  it('protects a published copy from other coaches, and leaves legacy programs as they were', async () => {
    await seed((db) => setDoc(doc(db, 'pbl_programs', 'p1'), live()));
    await assertFails(updateDoc(doc(reviewer(), 'pbl_programs', 'p1'), { title: 'Hijacked' }));
    await assertFails(updateDoc(doc(creator(), 'pbl_programs', 'p1'), { libraryManaged: false }));
    await assertSucceeds(updateDoc(doc(creator(), 'pbl_programs', 'p1'), { title: 'New' }));

    await seed((db) => setDoc(doc(db, 'pbl_programs', 'legacy'), { title: 'L', status: 'published', authorId: 'creator' }));
    await assertSucceeds(updateDoc(doc(reviewer(), 'pbl_programs', 'legacy'), { title: 'Edited' }));
    await assertSucceeds(setDoc(doc(reviewer(), 'pbl_programs', 'legacy-2'), { title: 'L2', status: 'published', authorId: 'reviewer' }));
  });

  it('shows students the published copy, and nothing before it exists', async () => {
    await assertFails(getDoc(doc(student(), 'program_library', 'p1')));
    await assertSucceeds(publishAs(creator(), 'creator'));
    await assertSucceeds(getDoc(doc(student(), 'pbl_programs', 'p1')));
    await assertFails(getDoc(doc(student(), 'program_library', 'p1')));
  });
});

describe('notifications', () => {
  it('cannot be created for a program that is already saved, so retries cannot duplicate', async () => {
    await seedRecord();
    await assertFails(setDoc(doc(creator(), 'coach_notifications', 'program-review_p1'), notification()));
  });

  it('cannot be created alone, forged, updated or removed', async () => {
    await assertFails(setDoc(doc(creator(), 'coach_notifications', 'program-review_p1'), notification()));
    await seedRecord();
    await seed((db) => setDoc(doc(db, 'coach_notifications', 'program-review_p1'), notification()));
    await assertFails(updateDoc(doc(creator(), 'coach_notifications', 'program-review_p1'), { programTitle: 'X' }));
    const db = reviewer();
    const batch = writeBatch(db);
    batch.set(doc(db, 'program_library', 'p9'), record({ programId: 'p9', creatorUid: 'reviewer' }));
    batch.set(doc(db, 'coach_notifications', 'program-review_p9'), notification({ programId: 'p9', actorUid: 'creator' }));
    await assertFails(batch.commit());
  });

  it('keeps read state private to each coach', async () => {
    await assertSucceeds(setDoc(doc(reviewer(), 'users', 'reviewer', 'notificationReads', 'n1'), { readAt: 5 }));
    await assertSucceeds(getDoc(doc(reviewer(), 'users', 'reviewer', 'notificationReads', 'n1')));
    await assertFails(getDoc(doc(creator(), 'users', 'reviewer', 'notificationReads', 'n1')));
    await assertFails(setDoc(doc(creator(), 'users', 'reviewer', 'notificationReads', 'n2'), { readAt: 5 }));
    await assertFails(setDoc(doc(student(), 'users', 'student', 'notificationReads', 'n3'), { readAt: 5 }));
  });
});
