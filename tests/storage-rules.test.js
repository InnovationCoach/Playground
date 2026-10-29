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
    projectId: 'demo-hearisland-rules',
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
    const fileRef = ref(studentStorage, 'evidence/student_a/program_dt/phase_prototype/chassis_coach_read.jpg');
    await uploadBytes(fileRef, new Uint8Array([1, 2, 3]), { contentType: 'image/jpeg' });

    // Coach A teaches CLASS_A (same class as student_a)
    const coachStorage = coachA().storage();
    const coachRef = ref(coachStorage, 'evidence/student_a/program_dt/phase_prototype/chassis_coach_read.jpg');
    await assertSucceeds(getBytes(coachRef));
  });

  it('denies coach of another class (coachB) from reading learner evidence', async () => {
    const studentStorage = studentA().storage();
    const fileRef = ref(studentStorage, 'evidence/student_a/program_dt/phase_prototype/chassis_coach_b.jpg');
    await uploadBytes(fileRef, new Uint8Array([1, 2, 3]), { contentType: 'image/jpeg' });

    // Coach B teaches CLASS_B, student_a is in CLASS_A
    const coachBStorage = coachB().storage();
    const coachBRef = ref(coachBStorage, 'evidence/student_a/program_dt/phase_prototype/chassis_coach_b.jpg');
    await assertFails(getBytes(coachBRef));
  });

  it('denies parent from directly reading student evidence in storage', async () => {
    const studentStorage = studentA().storage();
    const fileRef = ref(studentStorage, 'evidence/student_a/program_dt/phase_prototype/chassis_parent.jpg');
    await uploadBytes(fileRef, new Uint8Array([1, 2, 3]), { contentType: 'image/jpeg' });

    const parentStorage = parentUser().storage();
    const parentRef = ref(parentStorage, 'evidence/student_a/program_dt/phase_prototype/chassis_parent.jpg');
    await assertFails(getBytes(parentRef));
  });

  it('denies admin from direct client read of evidence (no admin client read)', async () => {
    const studentStorage = studentA().storage();
    const fileRef = ref(studentStorage, 'evidence/student_a/program_dt/phase_prototype/chassis_admin.jpg');
    await uploadBytes(fileRef, new Uint8Array([1, 2, 3]), { contentType: 'image/jpeg' });

    const adminStorage = adminUser().storage();
    const adminRef = ref(adminStorage, 'evidence/student_a/program_dt/phase_prototype/chassis_admin.jpg');
    await assertFails(getBytes(adminRef));
  });

  it('denies file over 25 MB', async () => {
    const storage = studentA().storage();
    const fileRef = ref(storage, 'evidence/student_a/program_dt/phase_prototype/chassis_oversize.jpg');
    // 25 MB + 1 byte
    const oversizedPayload = new Uint8Array(25 * 1024 * 1024 + 1);

    await assertFails(uploadBytes(fileRef, oversizedPayload, { contentType: 'image/jpeg' }));
  });

  it('denies wrong file type (e.g. application/zip, application/json, text/html)', async () => {
    const storage = studentA().storage();
    const fileRef = ref(storage, 'evidence/student_a/program_dt/phase_prototype/chassis_badtype.zip');
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
    const fileRef = ref(studentStorage, 'evidence/student_a/program_dt/phase_prototype/chassis_delete.jpg');
    await uploadBytes(fileRef, new Uint8Array([1, 2, 3]), { contentType: 'image/jpeg' });

    // Coach cannot delete student evidence
    const coachStorage = coachA().storage();
    const coachRef = ref(coachStorage, 'evidence/student_a/program_dt/phase_prototype/chassis_delete.jpg');
    await assertFails(deleteObject(coachRef));

    // Student can delete own evidence
    await assertSucceeds(deleteObject(fileRef));
  });

  it('prevents learner from overwriting an existing evidence file (update: false + resource == null)', async () => {
    const studentStorage = studentA().storage();
    const uniquePath = 'evidence/student_a/program_dt/phase_prototype/overwrite_test.jpg';
    const fileRef = ref(studentStorage, uniquePath);
    // Initial upload (resource == null) succeeds
    await assertSucceeds(uploadBytes(fileRef, new Uint8Array([1, 2, 3]), { contentType: 'image/jpeg' }));
    // Overwrite attempt must be rejected because resource != null
    await assertFails(uploadBytes(fileRef, new Uint8Array([4, 5, 6]), { contentType: 'image/jpeg' }));
  });
});

describe('Cloud Storage: Messages Overwrite Prevention', () => {
  const CONV_ID = 'conv_test_1';
  const MSG_ID = 'msg_test_1';
  const MSG_PATH = `messages/${CONV_ID}/${MSG_ID}/attachment.png`;

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'conversations', CONV_ID), {
        participantIds: ['coach_a', 'student_a']
      });
    });
  });

  it('allows conversation member to upload message attachment, but prevents overwriting it', async () => {
    const coachStorage = coachA().storage();
    const fileRef = ref(coachStorage, MSG_PATH);
    const payload1 = new Uint8Array([10, 20, 30]);

    // Initial upload succeeds
    await assertSucceeds(uploadBytes(fileRef, payload1, { contentType: 'image/png' }));

    // Overwrite attempt fails
    const payload2 = new Uint8Array([40, 50, 60]);
    await assertFails(uploadBytes(fileRef, payload2, { contentType: 'image/png' }));
  });
});

describe('Cloud Storage: Equipment Inventory Assets (Section 3.3 of ASSET-INVENTORY-PLAN.md)', () => {
  const supervisorUser = () => testEnv.authenticatedContext('supervisor_1', { role: 'supervisor' });
  const ASSET_ID = 'asset_photo_1';
  const ASSET_PHOTO_PATH = `assets/${ASSET_ID}/photo.jpg`;

  it('allows admin to upload JPEG, PNG, and WebP up to 5 MB', async () => {
    const storage = adminUser().storage();

    // JPEG
    await assertSucceeds(uploadBytes(
      ref(storage, `assets/${ASSET_ID}/pic.jpg`),
      new Uint8Array([1, 2, 3]),
      { contentType: 'image/jpeg' }
    ));

    // PNG
    await assertSucceeds(uploadBytes(
      ref(storage, `assets/${ASSET_ID}/pic.png`),
      new Uint8Array([1, 2, 3]),
      { contentType: 'image/png' }
    ));

    // WebP
    await assertSucceeds(uploadBytes(
      ref(storage, `assets/${ASSET_ID}/pic.webp`),
      new Uint8Array([1, 2, 3]),
      { contentType: 'image/webp' }
    ));
  });

  it('denies disallowed file types (PDF, SVG, GIF)', async () => {
    const storage = adminUser().storage();

    // PDF
    await assertFails(uploadBytes(
      ref(storage, `assets/${ASSET_ID}/manual.pdf`),
      new Uint8Array([1, 2, 3]),
      { contentType: 'application/pdf' }
    ));

    // SVG
    await assertFails(uploadBytes(
      ref(storage, `assets/${ASSET_ID}/vector.svg`),
      new Uint8Array([1, 2, 3]),
      { contentType: 'image/svg+xml' }
    ));

    // GIF
    await assertFails(uploadBytes(
      ref(storage, `assets/${ASSET_ID}/anim.gif`),
      new Uint8Array([1, 2, 3]),
      { contentType: 'image/gif' }
    ));
  });

  it('denies file larger than 5 MB', async () => {
    const storage = adminUser().storage();
    const oversize = new Uint8Array(5 * 1024 * 1024 + 1);

    await assertFails(uploadBytes(
      ref(storage, `assets/${ASSET_ID}/large.jpg`),
      oversize,
      { contentType: 'image/jpeg' }
    ));
  });

  it('denies overwriting an existing photo (update: false and resource == null)', async () => {
    const storage = adminUser().storage();
    const photoRef = ref(storage, `assets/asset_overwrite/photo.jpg`);

    // First upload succeeds
    await assertSucceeds(uploadBytes(
      photoRef,
      new Uint8Array([1, 2, 3]),
      { contentType: 'image/jpeg' }
    ));

    // Second upload to the exact same path fails
    await assertFails(uploadBytes(
      photoRef,
      new Uint8Array([4, 5, 6]),
      { contentType: 'image/jpeg' }
    ));
  });

  it('denies coach from uploading an asset photo', async () => {
    const storage = coachA().storage();
    await assertFails(uploadBytes(
      ref(storage, `assets/asset_coach/coach-upload.jpg`),
      new Uint8Array([1, 2, 3]),
      { contentType: 'image/jpeg' }
    ));
  });

  it('allows admin, supervisor, and coach to read asset photo, but denies student and anon', async () => {
    // Admin uploads photo
    const adminStorage = adminUser().storage();
    const photoRef = ref(adminStorage, `assets/asset_read/photo.jpg`);
    await assertSucceeds(uploadBytes(photoRef, new Uint8Array([1, 2, 3]), { contentType: 'image/jpeg' }));

    // Admin read
    await assertSucceeds(getBytes(photoRef));

    // Supervisor read
    const supStorage = supervisorUser().storage();
    await assertSucceeds(getBytes(ref(supStorage, `assets/asset_read/photo.jpg`)));

    // Coach read
    const coachStorage = coachA().storage();
    await assertSucceeds(getBytes(ref(coachStorage, `assets/asset_read/photo.jpg`)));

    // Student read denied
    const stuStorage = studentA().storage();
    await assertFails(getBytes(ref(stuStorage, `assets/asset_read/photo.jpg`)));

    // Anon read denied
    const anonStorage = anon().storage();
    await assertFails(getBytes(ref(anonStorage, `assets/asset_read/photo.jpg`)));
  });

  it('allows admin to delete photo, but denies coach from deleting photo', async () => {
    const adminStorage = adminUser().storage();
    const photoRef = ref(adminStorage, `assets/asset_delete/photo.jpg`);
    await assertSucceeds(uploadBytes(photoRef, new Uint8Array([1, 2, 3]), { contentType: 'image/jpeg' }));

    // Coach delete denied
    const coachStorage = coachA().storage();
    await assertFails(deleteObject(ref(coachStorage, `assets/asset_delete/photo.jpg`)));

    // Admin delete succeeds
    await assertSucceeds(deleteObject(photoRef));
  });
});

