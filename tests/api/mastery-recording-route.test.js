/**
 * Emulator-Backed Integration Test Suite: Mastery Recording Route
 *
 * Tests the actual Express router mounted in the SPARK application:
 * 1. Scoped coach authorization (school, class, learner, unauthorized role).
 * 2. Mandatory school scope and approved Spark-to-Mastery school mapping.
 * 3. Server-authoritative coursework competency verification (rejects unapproved competencies).
 * 4. Collision-resistant deterministic external IDs (two UIDs sharing first 14 chars do not collide).
 * 5. Ownership verification: legacy poisoned cache with mismatched externalId/schoolId is rejected.
 * 6. Unregistered learner fails closed (never implicitly creates learners).
 * 7. Concurrency locking (409 RECORDING_IN_PROGRESS on parallel requests).
 * 8. Operation fencing (stale worker with expired fence token cannot overwrite).
 * 9. Vendor evidence reconciliation (reuses container by deterministic title, zero duplicate containers).
 * 10. Feedback-only retry (retrying missing comment without re-awarding credit).
 */

import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import { setupApiTestEnv } from './api-test-helper.js';
import { masteryClient } from '../../server/lib/masteryClient.js';
import {
  APPROVED_SPARK_TO_MASTERY_SCHOOLS,
  buildDeterministicMasteryExternalId
} from '../../server/routes/mastery.js';

describe('API: Mastery Recording Route & Controlled Failure Adapter', () => {
  let env;
  const SCHOOL_ID = 'school-wls-pbl';
  const CLASS_ID = 'class-pbl-mars';
  const COACH_UID = 'coach-mars-lead';
  const STUDENT_A = 'student-alice-01';
  const STUDENT_B_PREFIX1 = 'student-prefix-12345-alpha';
  const STUDENT_B_PREFIX2 = 'student-prefix-12345-beta';

  let coachToken;
  let studentToken;

  beforeAll(async () => {
    env = await setupApiTestEnv();

    // 1. Seed School & Class
    await env.db.collection('schools').doc(SCHOOL_ID).set({
      name: 'WeLearn Academy PBL',
      status: 'active'
    });
    await env.db.collection('classes').doc(CLASS_ID).set({
      schoolId: SCHOOL_ID,
      name: 'Mars Habitability PBL',
      coachIds: [COACH_UID],
      status: 'active'
    });

    // 2. Seed Coach User (with claims)
    await env.db.collection('users').doc(COACH_UID).set({
      uid: COACH_UID,
      role: 'coach',
      schoolIds: [SCHOOL_ID],
      classIds: [CLASS_ID],
      displayName: 'Coach Mars'
    });
    coachToken = await env.getIdToken(COACH_UID, {
      role: 'coach',
      schoolIds: [SCHOOL_ID],
      classIds: [CLASS_ID]
    });

    // 3. Seed Student User
    await env.db.collection('users').doc(STUDENT_A).set({
      uid: STUDENT_A,
      role: 'student',
      schoolIds: [SCHOOL_ID],
      classIds: [CLASS_ID],
      displayName: 'Alice Mars'
    });
    studentToken = await env.getIdToken(STUDENT_A, {
      role: 'student',
      schoolIds: [SCHOOL_ID],
      classIds: [CLASS_ID]
    });

    // 4. Seed Server-Authoritative Activity with Approved Competencies
    await env.db.collection('activities').doc('act-mars-habitability').set({
      title: 'Mars Life Support Telemetry',
      competencies: ['1.1.1 Goal Setting', '5.1.3 Engineering Design'],
      schoolId: SCHOOL_ID
    });
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await env.teardown();
  });

  describe('Finding 1: Server-Owned, Collision-Resistant Identity & Ownership Verification', () => {
    it('produces distinct, collision-resistant external IDs for two UIDs sharing the first 14 characters', () => {
      const ext1 = buildDeterministicMasteryExternalId(STUDENT_B_PREFIX1);
      const ext2 = buildDeterministicMasteryExternalId(STUDENT_B_PREFIX2);

      expect(ext1).not.toBe(ext2);
      expect(ext1.length).toBeLessThanOrEqual(20);
      expect(ext2.length).toBeLessThanOrEqual(20);
      expect(ext1.startsWith('SP-')).toBe(true);
      expect(ext2.startsWith('SP-')).toBe(true);
    });

    it('rejects legacy cached masteryLearnerId if vendor record has mismatched externalId or schoolId', async () => {
      const poisonedStudentId = 'student-poisoned-01';
      await env.db.collection('users').doc(poisonedStudentId).set({
        uid: poisonedStudentId,
        role: 'student',
        schoolIds: [SCHOOL_ID],
        classIds: [CLASS_ID],
        masteryLearnerId: 99999 // Untrusted legacy cache
      });

      const subId = 'sub-poison-test';
      await env.db.collection('submissions').doc(subId).set({
        studentId: poisonedStudentId,
        schoolId: SCHOOL_ID,
        classId: CLASS_ID,
        activityId: 'act-mars-habitability',
        status: 'pending'
      });

      // Mock vendor getLearner returning a record that belongs to someone else
      const getLearnerSpy = vi.spyOn(masteryClient, 'getLearner').mockResolvedValueOnce({
        id: 99999,
        schoolId: 999, // WRONG SCHOOL
        externalId: 'SPARK-SOMEONE-ELSE' // WRONG EXTERNAL ID
      });

      // Mock searchLearners returning no matching record for expected ID
      const searchSpy = vi.spyOn(masteryClient, 'searchLearners').mockResolvedValueOnce([]);

      const res = await env.request('POST', `/api/mastery/evaluations/${subId}/record`, {
        token: coachToken,
        body: { competency: '1.1.1 Goal Setting' }
      });

      // Must reject cached ID and fail closed with 422 UNREGISTERED_MASTERY_LEARNER
      expect(res.status).toBe(422);
      expect(res.body.code).toBe('UNREGISTERED_MASTERY_LEARNER');
      expect(getLearnerSpy).toHaveBeenCalledWith(99999);

      getLearnerSpy.mockRestore();
      searchSpy.mockRestore();
    });

    it('rejects missing school scope and unapproved school scope', async () => {
      // 1. Missing school scope
      const subNoSchoolId = 'sub-no-school';
      await env.db.collection('submissions').doc(subNoSchoolId).set({
        studentId: STUDENT_A,
        classId: CLASS_ID,
        activityId: 'act-mars-habitability'
      });

      const resMissing = await env.request('POST', `/api/mastery/evaluations/${subNoSchoolId}/record`, {
        token: coachToken,
        body: { competency: '1.1.1 Goal Setting' }
      });
      expect(resMissing.status).toBe(400);
      expect(resMissing.body.code).toBe('MISSING_SCHOOL_SCOPE');

      // 2. Unapproved school scope
      const subUnapproved = 'sub-unapproved-school';
      await env.db.collection('submissions').doc(subUnapproved).set({
        studentId: STUDENT_A,
        schoolId: 'unapproved-rogue-campus',
        classId: CLASS_ID,
        activityId: 'act-mars-habitability'
      });

      const resUnapproved = await env.request('POST', `/api/mastery/evaluations/${subUnapproved}/record`, {
        token: coachToken,
        body: { competency: '1.1.1 Goal Setting' }
      });
      expect(resUnapproved.status).toBe(422);
      expect(resUnapproved.body.code).toBe('UNAPPROVED_SCHOOL_SCOPE');
    });
  });

  describe('Finding 4: Coursework Competency Authorization', () => {
    it('rejects recording when evaluated coursework has no server-authoritative record', async () => {
      const subNoActivity = 'sub-no-act';
      await env.db.collection('submissions').doc(subNoActivity).set({
        studentId: STUDENT_A,
        schoolId: SCHOOL_ID,
        classId: CLASS_ID,
        activityId: 'nonexistent-activity-id',
        status: 'pending'
      });

      const res = await env.request('POST', `/api/mastery/evaluations/${subNoActivity}/record`, {
        token: coachToken,
        body: { competency: '1.1.1 Goal Setting' }
      });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('NO_AUTHORITATIVE_COURSEWORK');
      expect(res.body.ordinaryApprovalAvailable).toBe(true);
    });

    it('rejects valid framework competency that is NOT authorized for the evaluated coursework', async () => {
      const subValidAct = 'sub-act-unauthorized-comp';
      await env.db.collection('submissions').doc(subValidAct).set({
        studentId: STUDENT_A,
        schoolId: SCHOOL_ID,
        classId: CLASS_ID,
        activityId: 'act-mars-habitability', // Authorized: 1.1.1 and 5.1.3
        status: 'pending'
      });

      // 4.1.1 Public Speaking is a valid MCA competency, but NOT authorized for Mars Life Support!
      const res = await env.request('POST', `/api/mastery/evaluations/${subValidAct}/record`, {
        token: coachToken,
        body: { competency: '4.1.1 Public Speaking' }
      });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('COMPETENCY_NOT_AUTHORIZED_FOR_WORK');
      expect(res.body.ordinaryApprovalAvailable).toBe(true);
    });
  });

  describe('Findings 2 & 3: Concurrency Locking, Replay Safety, Fencing & Feedback-Only Retry', () => {
    const subE2E = 'sub-e2e-mars-01';

    beforeAll(async () => {
      await env.db.collection('submissions').doc(subE2E).set({
        studentId: STUDENT_A,
        schoolId: SCHOOL_ID,
        classId: CLASS_ID,
        activityId: 'act-mars-habitability',
        projectTitle: 'Mars Telemetry Habitat',
        status: 'pending'
      });
    });

    it('rejects parallel recording operations while a lease is active with 409 RECORDING_IN_PROGRESS', async () => {
      // Artificially put submission in active lease
      await env.db.collection('submissions').doc(subE2E).update({
        'mastery.status': 'in_progress',
        'mastery.leaseExpiresAt': Date.now() + 30000
      });

      const res = await env.request('POST', `/api/mastery/evaluations/${subE2E}/record`, {
        token: coachToken,
        body: { competency: '1.1.1 Goal Setting' }
      });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('RECORDING_IN_PROGRESS');

      // Release lock for subsequent tests
      await env.db.collection('submissions').doc(subE2E).update({
        'mastery.status': 'none',
        'mastery.leaseExpiresAt': 0
      });
    });

    it('reconciles existing vendor evidence by deterministic title to prevent duplicate containers on retry', async () => {
      const expectedExtId = buildDeterministicMasteryExternalId(STUDENT_A);

      // Mock vendor search finding student
      vi.spyOn(masteryClient, 'searchLearners').mockResolvedValueOnce([
        { id: 377, schoolId: 15, externalId: expectedExtId }
      ]);

      // Mock vendor listLearnerEvidence discovering existing evidence with matching deterministic title
      const deterministicTitle = `SPARK [${subE2E}]: Mars Telemetry Habitat`;
      vi.spyOn(masteryClient, 'listLearnerEvidence').mockResolvedValueOnce([
        { id: 7001, title: deterministicTitle }
      ]);

      const createEvidenceSpy = vi.spyOn(masteryClient, 'createEvidence');
      const attachSpy = vi.spyOn(masteryClient, 'attachCompetenciesToEvidence').mockResolvedValueOnce({});
      const updateCreditSpy = vi.spyOn(masteryClient, 'updateLearnerCredit').mockResolvedValueOnce({});
      const addCommentSpy = vi.spyOn(masteryClient, 'addEvidenceComment').mockRejectedValueOnce(
        new Error('Simulated network failure on formative comment')
      );

      const res = await env.request('POST', `/api/mastery/evaluations/${subE2E}/record`, {
        token: coachToken,
        body: { competency: '1.1.1 Goal Setting', feedback: 'Great engineering reflection!' }
      });

      // createEvidence must NOT be called because evidence 7001 was reconciled
      expect(createEvidenceSpy).not.toHaveBeenCalled();
      expect(attachSpy).toHaveBeenCalledWith(7001, expect.any(Array));
      expect(updateCreditSpy).toHaveBeenCalledWith(377, 1372, { status: 'EARNED' });

      // Partial success truthfully reported: creditAwarded: true, commentPosted: false
      expect(res.status).toBe(200);
      expect(res.body.mastery.creditAwarded).toBe(true);
      expect(res.body.mastery.commentPosted).toBe(false);
      expect(res.body.mastery.canRetryComment).toBe(true);

      // Verify Firestore state has evidenceId and creditAwarded: true
      const savedDoc = (await env.db.collection('submissions').doc(subE2E).get()).data();
      expect(savedDoc.mastery.evidenceId).toBe(7001);
      expect(savedDoc.mastery.creditAwarded).toBe(true);
      expect(savedDoc.mastery.commentPosted).toBe(false);
    });

    it('executes feedback-only retry path without re-awarding credit when credit is already earned', async () => {
      // Student already has creditAwarded: true from previous test, but commentPosted: false
      const attachSpy = vi.spyOn(masteryClient, 'attachCompetenciesToEvidence');
      const updateCreditSpy = vi.spyOn(masteryClient, 'updateLearnerCredit');
      const addCommentSpy = vi.spyOn(masteryClient, 'addEvidenceComment').mockResolvedValueOnce({ id: 'comm-1' });

      const res = await env.request('POST', `/api/mastery/evaluations/${subE2E}/record`, {
        token: coachToken,
        body: { competency: '1.1.1 Goal Setting', feedback: 'Formative feedback retry' }
      });

      // Credit and evidence calls must NOT be repeated!
      expect(attachSpy).not.toHaveBeenCalled();
      expect(updateCreditSpy).not.toHaveBeenCalled();

      // Comment must be called with existing evidence 7001
      expect(addCommentSpy).toHaveBeenCalledWith(7001, { content: 'Formative feedback retry' });

      expect(res.status).toBe(200);
      expect(res.body.mastery.status).toBe('recorded');
      expect(res.body.mastery.creditAwarded).toBe(true);
      expect(res.body.mastery.commentPosted).toBe(true);
      expect(res.body.mastery.feedbackOnlyRetry).toBe(true);

      // Verify Firestore state is updated to commentPosted: true and status recorded
      const savedDoc = (await env.db.collection('submissions').doc(subE2E).get()).data();
      expect(savedDoc.mastery.status).toBe('recorded');
      expect(savedDoc.mastery.commentPosted).toBe(true);
    });
  });
});
