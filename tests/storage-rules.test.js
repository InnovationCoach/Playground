/**
 * Security rule tests for Cloud Storage: PBL Student Evidence Uploads.
 * Tests class scoping, role boundaries, MIME types, and size limits.
 */
import { describe, it, beforeAll, afterAll, beforeEach, expect } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds
} from '@firebase/rules-unit-testing';
import fs from 'fs';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getBytes, deleteObject } from 'firebase/storage';

let testEnv;

const CLASS_A = 'class_a';
const CLASS_B = 'class_b';

const coachA = () => testEnv.authenticatedContext('coach_a', { role: 'teacher', classIds: [CLASS_A] });
const coachB = () => testEnv.authenticatedContext('coach_b', { role: 'teacher', classIds: [CLASS_B] });
const studentA = () => testEnv.authenticatedContext('student_a');
const parentUser = () => testEnv.authenticatedContext('parent_1', { role: 'parent' });
const adminUser = () => testEnv.authenticatedContext('admin_1', { role: 'admin' });
const anon = () => testEnv.unauthenticatedContext();

const EVIDENCE_PATH = 'evidence/student_a/program_dt/phase_prototype/chassis.jpg';

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-hearisland-local',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8088
    },
    storage: {
      rules: fs.readFileSync('storage.rules', 'utf8'),
      host: '127.0.0.1',
      port: 9199
    }
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.clearStorage();

  // Set up student in CLASS_A in Firestore so storage rule firestore.get can resolve classIds
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users', 'student_a'), {
      uid: 'student_a',
      email: 'student_a@welearn.test',
      role: 'student',
      classIds: [CLASS_A]
    });
  });
});

describe('Cloud Storage: PBL Evidence Security Rules', () => {
  it('allows learner to upload valid evidence file (<= 25 MB, valid type)', async () => {
    const storage = studentA().storage();
    const fileRef = ref(storage, EVIDENCE_PATH);
    const smallPayload = new Uint8Array([1, 2, 3, 4]);

    await assertSucceeds(uploadBytes(fileRef, smallPayload, { contentType: 'image/jpeg' }));
  });

  it('allows coach sharing the learner class to read evidence', async () => {
    // First upload as student
    const studentStorage = studentA().storage();
    const fileRef = ref(studentStorage, EVIDENCE_PATH);
    await uploadBytes(fileRef, new Uint8Array([1, 2, 3]), { contentType: 'image/jpeg' });

    // Coach A teaches CLASS_A (same class as student_a)
    const coachStorage = coachA().storage();
    const coachRef = ref(coachStorage, EVIDENCE_PATH);
    await assertSucceeds(getBytes(coachRef));
  });

  it('denies coach of another class (coachB) from reading learner evidence', async () => {
    const studentStorage = studentA().storage();
    const fileRef = ref(studentStorage, EVIDENCE_PATH);
    await uploadBytes(fileRef, new Uint8Array([1, 2, 3]), { contentType: 'image/jpeg' });

    // Coach B teaches CLASS_B, student_a is in CLASS_A
    const coachBStorage = coachB().storage();
    const coachBRef = ref(coachBStorage, EVIDENCE_PATH);
    await assertFails(getBytes(coachBRef));
  });

  it('denies parent from directly reading student evidence in storage', async () => {
    const studentStorage = studentA().storage();
    const fileRef = ref(studentStorage, EVIDENCE_PATH);
    await uploadBytes(fileRef, new Uint8Array([1, 2, 3]), { contentType: 'image/jpeg' });

    const parentStorage = parentUser().storage();
    const parentRef = ref(parentStorage, EVIDENCE_PATH);
    await assertFails(getBytes(parentRef));
  });

  it('denies admin from direct client read of evidence (no admin client read)', async () => {
    const studentStorage = studentA().storage();
    const fileRef = ref(studentStorage, EVIDENCE_PATH);
    await uploadBytes(fileRef, new Uint8Array([1, 2, 3]), { contentType: 'image/jpeg' });

    const adminStorage = adminUser().storage();
    const adminRef = ref(adminStorage, EVIDENCE_PATH);
    await assertFails(getBytes(adminRef));
  });

  it('denies file over 25 MB', async () => {
    const storage = studentA().storage();
    const fileRef = ref(storage, EVIDENCE_PATH);
    // 25 MB + 1 byte
    const oversizedPayload = new Uint8Array(25 * 1024 * 1024 + 1);

    await assertFails(uploadBytes(fileRef, oversizedPayload, { contentType: 'image/jpeg' }));
  });

  it('denies wrong file type (e.g. application/zip, application/json, text/html)', async () => {
    const storage = studentA().storage();
    const fileRef = ref(storage, EVIDENCE_PATH);
    const payload = new Uint8Array([1, 2, 3]);

    await assertFails(uploadBytes(fileRef, payload, { contentType: 'application/zip' }));
    await assertFails(uploadBytes(fileRef, payload, { contentType: 'application/json' }));
    await assertFails(uploadBytes(fileRef, payload, { contentType: 'text/html' }));
    await assertFails(uploadBytes(fileRef, payload, { contentType: 'application/x-msdownload' }));
  });

  it('denies non-conforming path (enforces evidence/{uid}/{programId}/{phaseId}/{filename})', async () => {
    const storage = studentA().storage();
    // Path missing phaseId / programId
    const flatRef = ref(storage, 'evidence/student_a/chassis.jpg');
    const payload = new Uint8Array([1, 2, 3]);

    await assertFails(uploadBytes(flatRef, payload, { contentType: 'image/jpeg' }));
  });

  it('allows learner to delete their own evidence, but denies coach from deleting it', async () => {
    const studentStorage = studentA().storage();
    const fileRef = ref(studentStorage, EVIDENCE_PATH);
    await uploadBytes(fileRef, new Uint8Array([1, 2, 3]), { contentType: 'image/jpeg' });

    // Coach cannot delete student evidence
    const coachStorage = coachA().storage();
    const coachRef = ref(coachStorage, EVIDENCE_PATH);
    await assertFails(deleteObject(coachRef));

    // Student can delete own evidence
    await assertSucceeds(deleteObject(fileRef));
  });
});
