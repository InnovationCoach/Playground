/**
 * Security rule tests for missionSubmissions (GEMINI GO-4.md §5).
 *
 * Verifies:
 * - A client cannot create, update, or delete missionSubmissions (server write only)
 * - A learner reads only their own submissions
 * - A coach reads only submissions from their assigned classes
 * - Other learners and unrelated coaches are denied
 * - Unauthenticated callers are denied
 */
import { describe, it, beforeAll, afterAll, beforeEach, expect } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds
} from '@firebase/rules-unit-testing';
import fs from 'fs';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

let testEnv;

const CLASS_A = 'class_a';
const CLASS_B = 'class_b';

const coachA = () => testEnv.authenticatedContext('coach_a', { role: 'teacher', classIds: [CLASS_A] });
const coachB = () => testEnv.authenticatedContext('coach_b', { role: 'teacher', classIds: [CLASS_B] });
const studentA = () => testEnv.authenticatedContext('student_a');
const studentB = () => testEnv.authenticatedContext('student_b');
const adminUser = () => testEnv.authenticatedContext('admin_user', { role: 'admin' });
const anon = () => testEnv.unauthenticatedContext();

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-hearisland-rules',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8088
    }
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();

  // Seed documents as admin (bypassing rules)
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();

    // Submission for student A in class A
    await setDoc(doc(db, 'missionSubmissions', 'sub_a'), {
      learnerUid: 'student_a',
      classIds: [CLASS_A],
      missionId: 'spacecraft-journey',
      missionVersion: '0.1.0-draft',
      routeId: 'guided',
      reflection: 'We should use the chemical rocket because 42 days is manageable for our supplies.',
      status: 'submitted',
      coachUid: null,
      coachNote: null
    });

    // Submission for student B in class B
    await setDoc(doc(db, 'missionSubmissions', 'sub_b'), {
      learnerUid: 'student_b',
      classIds: [CLASS_B],
      missionId: 'spacecraft-journey',
      missionVersion: '0.1.0-draft',
      routeId: 'advanced',
      reflection: 'We recommend ion drive to minimize overall propellant mass for this 140-day trip.',
      status: 'submitted',
      coachUid: null,
      coachNote: null
    });
  });
});

describe('missionSubmissions security rules', () => {
  describe('write boundary (server-written only)', () => {
    it('denies learner creating a submission directly', async () => {
      const db = studentA().firestore();
      await assertFails(setDoc(doc(db, 'missionSubmissions', 'sub_sneaky'), {
        learnerUid: 'student_a',
        classIds: [CLASS_A],
        missionId: 'spacecraft-journey',
        status: 'approved'
      }));
    });

    it('denies coach creating a submission directly', async () => {
      const db = coachA().firestore();
      await assertFails(setDoc(doc(db, 'missionSubmissions', 'sub_coach'), {
        learnerUid: 'student_a',
        classIds: [CLASS_A],
        missionId: 'spacecraft-journey',
        status: 'approved'
      }));
    });

    it('denies learner modifying a submission', async () => {
      const db = studentA().firestore();
      await assertFails(updateDoc(doc(db, 'missionSubmissions', 'sub_a'), {
        status: 'approved'
      }));
    });

    it('denies coach modifying a submission directly via client SDK', async () => {
      const db = coachA().firestore();
      await assertFails(updateDoc(doc(db, 'missionSubmissions', 'sub_a'), {
        status: 'approved',
        coachUid: 'coach_a'
      }));
    });

    it('denies learner deleting a submission', async () => {
      const db = studentA().firestore();
      await assertFails(deleteDoc(doc(db, 'missionSubmissions', 'sub_a')));
    });
  });

  describe('read boundary (learner, assigned coach, admin)', () => {
    it('allows a learner to read their own submission', async () => {
      const db = studentA().firestore();
      await assertSucceeds(getDoc(doc(db, 'missionSubmissions', 'sub_a')));
    });

    it('denies a learner reading another learner submission', async () => {
      const db = studentB().firestore();
      await assertFails(getDoc(doc(db, 'missionSubmissions', 'sub_a')));
    });

    it('allows a coach to read submissions from their assigned class', async () => {
      const db = coachA().firestore();
      await assertSucceeds(getDoc(doc(db, 'missionSubmissions', 'sub_a')));
    });

    it('denies a coach reading submissions from another class', async () => {
      const db = coachA().firestore();
      await assertFails(getDoc(doc(db, 'missionSubmissions', 'sub_b')));
    });

    it('allows an admin to read any submission', async () => {
      const db = adminUser().firestore();
      await assertSucceeds(getDoc(doc(db, 'missionSubmissions', 'sub_a')));
      await assertSucceeds(getDoc(doc(db, 'missionSubmissions', 'sub_b')));
    });

    it('denies unauthenticated callers', async () => {
      const db = anon().firestore();
      await assertFails(getDoc(doc(db, 'missionSubmissions', 'sub_a')));
    });
  });
});
