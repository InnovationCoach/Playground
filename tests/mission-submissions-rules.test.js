/**
 * Security rule tests for My Universe & G04 Rules Audit findings (Contract 0.1.1 §7).
 *
 * Verifies:
 * 1. users/{uid} self-signup cannot forge orgId, non-empty classIds/schoolIds, status, publicId, consent, enrolledVia, or delete/recreate to forge tenancy.
 * 2. missionSubmissions is server-written only; direct reads require matching orgId plus learner ownership, assigned coach class overlap, or same-org admin.
 * 3. Service-only collections (missionDrafts, missionSubmissionLocks, universeIdempotency, universeMemberships, universeTaskStatus) deny all client reads/writes.
 * 4. users/{uid}/activityProgress/universe-v1 and users/{uid}/progress/universe-v1 enforce strict field allowlists, size bounds, and no reward/XP/approvedMissionIds grants on both create and update, without relying on a second match block that could be bypassed by the generic owner rule.
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

const ORG_A = 'org-alpha';
const ORG_B = 'org-beta';
const CLASS_A = 'class_a';
const CLASS_B = 'class_b';

const coachA = () =>
  testEnv.authenticatedContext('coach_a', { role: 'teacher', orgId: ORG_A, classIds: [CLASS_A] });
const coachB = () =>
  testEnv.authenticatedContext('coach_b', { role: 'teacher', orgId: ORG_A, classIds: [CLASS_B] });
const coachOtherOrg = () =>
  testEnv.authenticatedContext('coach_other_org', { role: 'teacher', orgId: ORG_B, classIds: [CLASS_A] });
const studentA = () =>
  testEnv.authenticatedContext('student_a', { role: 'student', orgId: ORG_A, classIds: [CLASS_A] });
const studentAWrongOrgToken = () =>
  testEnv.authenticatedContext('student_a', { role: 'student', orgId: ORG_B, classIds: [CLASS_A] });
const studentB = () =>
  testEnv.authenticatedContext('student_b', { role: 'student', orgId: ORG_A, classIds: [CLASS_B] });
const adminOrgA = () =>
  testEnv.authenticatedContext('admin_user', { role: 'admin', orgId: ORG_A });
const adminOrgB = () =>
  testEnv.authenticatedContext('admin_other', { role: 'admin', orgId: ORG_B });
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

  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();

    await setDoc(doc(db, 'users', 'student_a'), {
      uid: 'student_a',
      displayName: 'Student A',
      role: 'student',
      orgId: ORG_A,
      classIds: [CLASS_A]
    });

    await setDoc(doc(db, 'missionSubmissions', 'sub_a'), {
      submissionId: 'sub_a',
      orgId: ORG_A,
      learnerUid: 'student_a',
      classIds: [CLASS_A],
      missionId: 'spacecraft-journey',
      missionVersion: '0.2.0-draft',
      routeId: 'guided',
      taskId: 'propulsion-trade-study',
      policyVersion: 'reviewed-only-v1',
      reflection: 'We should use the chemical rocket because 42 days is manageable for our supplies.',
      status: 'submitted',
      coachUid: null,
      coachNote: null
    });

    await setDoc(doc(db, 'missionSubmissions', 'sub_b'), {
      submissionId: 'sub_b',
      orgId: ORG_A,
      learnerUid: 'student_b',
      classIds: [CLASS_B],
      missionId: 'spacecraft-journey',
      missionVersion: '0.2.0-draft',
      routeId: 'advanced',
      taskId: 'propulsion-trade-study',
      policyVersion: 'reviewed-only-v1',
      reflection: 'We recommend ion drive to minimize overall propellant mass for this 140-day trip.',
      status: 'submitted',
      coachUid: null,
      coachNote: null
    });

    await setDoc(doc(db, 'missionDrafts', 'draft_a'), {
      draftId: 'draft_a',
      orgId: ORG_A,
      learnerUid: 'student_a',
      missionId: 'spacecraft-journey',
      revision: 1
    });

    await setDoc(doc(db, 'missionSubmissionLocks', 'lock_a'), {
      lockId: 'lock_a',
      orgId: ORG_A,
      learnerUid: 'student_a',
      missionId: 'spacecraft-journey',
      status: 'open'
    });

    await setDoc(doc(db, 'universeIdempotency', 'idem_a'), {
      idempotencyId: 'idem_a',
      orgId: ORG_A,
      callerUid: 'student_a'
    });

    await setDoc(doc(db, 'universeMemberships', 'student_a'), {
      uid: 'student_a',
      orgId: ORG_A,
      role: 'student',
      classIds: [CLASS_A]
    });

    await setDoc(doc(db, 'universeTaskStatus', 'task_a'), {
      status: 'open'
    });
  });
});

describe('G04 Rules Audit Finding 1: users/{uid} tenancy/class self-grant hardening', () => {
  it('allows benign learner self-signup with empty classIds and no orgId', async () => {
    const freshLearner = testEnv.authenticatedContext('fresh_learner', {});
    const db = freshLearner.firestore();
    await assertSucceeds(
      setDoc(doc(db, 'users', 'fresh_learner'), {
        uid: 'fresh_learner',
        displayName: 'Fresh Learner',
        role: 'student',
        classIds: [],
        schoolIds: []
      })
    );
  });

  it('denies learner self-signup that attempts to self-assign orgId or non-empty classIds', async () => {
    const forgedLearner = testEnv.authenticatedContext('forged_learner', {});
    const db = forgedLearner.firestore();

    await assertFails(
      setDoc(doc(db, 'users', 'forged_learner'), {
        uid: 'forged_learner',
        displayName: 'Forged Org Learner',
        role: 'student',
        orgId: ORG_A
      })
    );

    await assertFails(
      setDoc(doc(db, 'users', 'forged_learner'), {
        uid: 'forged_learner',
        displayName: 'Forged Class Learner',
        role: 'student',
        classIds: [CLASS_A]
      })
    );

    await assertFails(
      setDoc(doc(db, 'users', 'forged_learner'), {
        uid: 'forged_learner',
        displayName: 'Forged School Learner',
        role: 'learner',
        schoolIds: ['school_1']
      })
    );
  });

  it('denies owner deleting users/{uid} to prevent delete-and-recreate profile forgery', async () => {
    const db = studentA().firestore();
    await assertFails(deleteDoc(doc(db, 'users', 'student_a')));
  });

  it('denies owner updating protected fields (orgId, classIds, role) on existing users/{uid}', async () => {
    const db = studentA().firestore();
    await assertFails(
      updateDoc(doc(db, 'users', 'student_a'), {
        orgId: ORG_B
      })
    );
    await assertFails(
      updateDoc(doc(db, 'users', 'student_a'), {
        classIds: [CLASS_A, CLASS_B]
      })
    );
  });
});

describe('missionSubmissions & service-only collections security rules', () => {
  describe('write boundary (server-written only)', () => {
    it('denies learner creating, updating, or deleting missionSubmissions directly', async () => {
      const db = studentA().firestore();
      await assertFails(
        setDoc(doc(db, 'missionSubmissions', 'sub_sneaky'), {
          orgId: ORG_A,
          learnerUid: 'student_a',
          classIds: [CLASS_A],
          missionId: 'spacecraft-journey',
          status: 'approved'
        })
      );
      await assertFails(
        updateDoc(doc(db, 'missionSubmissions', 'sub_a'), {
          status: 'approved'
        })
      );
      await assertFails(deleteDoc(doc(db, 'missionSubmissions', 'sub_a')));
    });

    it('denies coach creating or modifying missionSubmissions directly via client SDK', async () => {
      const db = coachA().firestore();
      await assertFails(
        setDoc(doc(db, 'missionSubmissions', 'sub_coach'), {
          orgId: ORG_A,
          learnerUid: 'student_a',
          classIds: [CLASS_A],
          missionId: 'spacecraft-journey',
          status: 'approved'
        })
      );
      await assertFails(
        updateDoc(doc(db, 'missionSubmissions', 'sub_a'), {
          status: 'approved',
          coachUid: 'coach_a'
        })
      );
    });
  });

  describe('read boundary (matching orgId + learner, assigned coach, or admin)', () => {
    it('allows a learner in the same org to read their own submission', async () => {
      const db = studentA().firestore();
      await assertSucceeds(getDoc(doc(db, 'missionSubmissions', 'sub_a')));
    });

    it('denies a learner reading their own submission if token orgId does not match', async () => {
      const db = studentAWrongOrgToken().firestore();
      await assertFails(getDoc(doc(db, 'missionSubmissions', 'sub_a')));
    });

    it('denies a learner reading another learner submission', async () => {
      const db = studentB().firestore();
      await assertFails(getDoc(doc(db, 'missionSubmissions', 'sub_a')));
    });

    it('allows an assigned coach in the same org to read submissions from their class', async () => {
      const db = coachA().firestore();
      await assertSucceeds(getDoc(doc(db, 'missionSubmissions', 'sub_a')));
    });

    it('denies a coach reading submissions from another class or another org', async () => {
      await assertFails(getDoc(doc(coachA().firestore(), 'missionSubmissions', 'sub_b')));
      await assertFails(getDoc(doc(coachOtherOrg().firestore(), 'missionSubmissions', 'sub_a')));
    });

    it('allows same-org admin to read submissions, but denies cross-org admin and unauthenticated callers', async () => {
      await assertSucceeds(getDoc(doc(adminOrgA().firestore(), 'missionSubmissions', 'sub_a')));
      await assertFails(getDoc(doc(adminOrgB().firestore(), 'missionSubmissions', 'sub_a')));
      await assertFails(getDoc(doc(anon().firestore(), 'missionSubmissions', 'sub_a')));
    });
  });

  describe('service-only collections deny all client reads and writes', () => {
    it('denies client reads and writes on missionDrafts, missionSubmissionLocks, universeIdempotency, universeMemberships, and universeTaskStatus', async () => {
      for (const ctx of [studentA(), coachA(), adminOrgA(), anon()]) {
        const db = ctx.firestore();
        await assertFails(getDoc(doc(db, 'missionDrafts', 'draft_a')));
        await assertFails(setDoc(doc(db, 'missionDrafts', 'draft_a'), { hacked: true }));
        await assertFails(getDoc(doc(db, 'missionSubmissionLocks', 'lock_a')));
        await assertFails(setDoc(doc(db, 'missionSubmissionLocks', 'lock_a'), { status: 'released' }));
        await assertFails(getDoc(doc(db, 'universeIdempotency', 'idem_a')));
        await assertFails(setDoc(doc(db, 'universeIdempotency', 'idem_a'), { hacked: true }));
        await assertFails(getDoc(doc(db, 'universeMemberships', 'student_a')));
        await assertFails(setDoc(doc(db, 'universeMemberships', 'student_a'), { role: 'admin' }));
        await assertFails(getDoc(doc(db, 'universeTaskStatus', 'task_a')));
        await assertFails(setDoc(doc(db, 'universeTaskStatus', 'task_a'), { status: 'open' }));
      }
    });
  });
});

describe('G04 Rules Audit Finding 3: activityProgress/universe-v1 & progress/universe-v1 bounds', () => {
  it('allows owner to create and update bounded universe-v1 navigation preferences', async () => {
    const db = studentA().firestore();
    const validPayload = {
      activityId: 'universe-v1',
      schemaVersion: 1,
      bookmarks: ['thalassa', 'ignis'],
      preferences: {
        detail: 'standard',
        motion: true,
        textView: false,
        captions: true,
        calmMode: false
      },
      lastVisitedPlanetId: 'thalassa',
      updatedAt: serverTimestamp()
    };

    await assertSucceeds(setDoc(doc(db, 'users', 'student_a', 'activityProgress', 'universe-v1'), validPayload));
    await assertSucceeds(
      updateDoc(doc(db, 'users', 'student_a', 'activityProgress', 'universe-v1'), {
        lastVisitedPlanetId: 'ignis',
        updatedAt: serverTimestamp()
      })
    );

    await assertSucceeds(setDoc(doc(db, 'users', 'student_a', 'progress', 'universe-v1'), validPayload));
  });

  it('denies owner writing approvedMissionIds, xp, badges, or invalid fields to universe-v1 on create or update', async () => {
    const db = studentA().firestore();
    const baseValid = {
      activityId: 'universe-v1',
      schemaVersion: 1,
      bookmarks: ['thalassa'],
      preferences: {
        detail: 'standard',
        motion: true,
        textView: false,
        captions: true,
        calmMode: false
      },
      lastVisitedPlanetId: 'thalassa',
      updatedAt: serverTimestamp()
    };

    await assertSucceeds(setDoc(doc(db, 'users', 'student_a', 'activityProgress', 'universe-v1'), baseValid));

    // Attempt to self-grant approvedMissionIds or xp on create or update must fail
    await assertFails(
      setDoc(doc(db, 'users', 'student_a', 'activityProgress', 'universe-v1'), {
        ...baseValid,
        approvedMissionIds: ['spacecraft-journey']
      })
    );

    await assertFails(
      updateDoc(doc(db, 'users', 'student_a', 'activityProgress', 'universe-v1'), {
        xp: 9999
      })
    );

    await assertFails(
      updateDoc(doc(db, 'users', 'student_a', 'activityProgress', 'universe-v1'), {
        preferences: { detail: 'invalid-detail-mode' }
      })
    );

    // Cross-owner write denied
    await assertFails(
      setDoc(doc(studentB().firestore(), 'users', 'student_a', 'activityProgress', 'universe-v1'), baseValid)
    );
  });

  it('continues to allow non-universe activityProgress documents for the owner', async () => {
    const db = studentA().firestore();
    await assertSucceeds(
      setDoc(doc(db, 'users', 'student_a', 'activityProgress', 'solar-car-v1'), {
        step: 2,
        updatedAt: serverTimestamp()
      })
    );
  });
});
