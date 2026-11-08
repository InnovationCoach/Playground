import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, setLogLevel } from 'firebase/firestore';
import { setupApiTestEnv } from './api-test-helper.js';
import {
  LAYOUT_CONTRACT_VERSION,
  parseVerifiedDob,
  evaluateCohortRange,
  evaluateLayoutSelection,
  validateLayoutOverrideWrite
} from '../../server/lib/layoutSelection.js';
import { SCHOOL_COHORTS } from '../../src/utils/schoolCohorts.js';
import { LAYOUTS, selectLayout } from '../../src/features/lowerSecondary/layoutSelector.js';

vi.mock('../../src/firebase.js', () => ({ auth: {}, db: {}, storage: {} }));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RULES_PATH = path.resolve(__dirname, '../../firestore.rules');

describe('Lower-secondary trusted layout-selection contract (unit + API + rules)', () => {
  const refDate = '2026-06-15';

  describe('1. Pure contract & frontend layoutSelector compatibility', () => {
    it('parses verified DOBs and rejects non-ISO, impossible dates, and implausible learner ages', () => {
      expect(parseVerifiedDob(null, refDate)).toEqual({ status: 'missing', age: null, dob: null });
      expect(parseVerifiedDob('15/06/2013', refDate).status).toBe('invalid');
      expect(parseVerifiedDob('2014-02-29', refDate).status).toBe('invalid');
      expect(parseVerifiedDob('2025-01-01', refDate).status).toBe('invalid'); // age 1 (<4)
      expect(parseVerifiedDob('1990-01-01', refDate).status).toBe('invalid'); // age 36 (>25)

      expect(parseVerifiedDob('2015-06-15', refDate)).toEqual({ status: 'valid', age: 11, dob: '2015-06-15' });
      expect(parseVerifiedDob('2015-06-16', refDate)).toEqual({ status: 'valid', age: 10, dob: '2015-06-16' });
      expect(parseVerifiedDob('2011-06-16', refDate)).toEqual({ status: 'valid', age: 14, dob: '2011-06-16' });
      expect(parseVerifiedDob('2011-06-15', refDate)).toEqual({ status: 'valid', age: 15, dob: '2011-06-15' });
    });

    it('classifies SCHOOL_COHORTS against 11..14 rollout bounds', () => {
      const byId = Object.fromEntries(SCHOOL_COHORTS.map((c) => [c.cohortId, c]));
      expect(evaluateCohortRange(byId['cohort-lower-primary']).classification).toBe('outside-rollout');
      expect(evaluateCohortRange(byId['cohort-higher-primary']).classification).toBe('outside-rollout');
      expect(evaluateCohortRange(byId['cohort-lower-secondary'])).toEqual({
        status: 'valid',
        classification: 'eligible',
        range: { min: 11, max: 14, cohortId: 'cohort-lower-secondary' }
      });
      expect(evaluateCohortRange(byId['cohort-higher-secondary']).classification).toBe('older');
      expect(evaluateCohortRange({ cohortId: 'cohort-w2e', status: 'inactive' }).status).toBe('ambiguous');
    });

    it('produces contract payloads that drive src/features/lowerSecondary/layoutSelector.js identically', () => {
      // Verified age 11..14 (including age-11 primary) -> lower-secondary / lowerSecondary
      for (const age of [11, 12, 13, 14]) {
        const contract = evaluateLayoutSelection({
          role: 'student',
          isPrimary: age === 11,
          trustedAge: age,
          trustedAgeStatus: 'valid'
        });
        expect(contract.layout).toBe('lower-secondary');
        expect(contract.reason).toBe('eligible');
        expect(contract.isPrimary).toBe(age === 11);
        expect(selectLayout({ role: 'student', contract })).toEqual({
          layout: LAYOUTS.LOWER_SECONDARY,
          reason: 'eligible'
        });
      }

      // Verified age 10 -> existing / outside-rollout
      const age10 = evaluateLayoutSelection({
        role: 'student',
        isPrimary: true,
        trustedAge: 10,
        trustedAgeStatus: 'valid'
      });
      expect(age10.layout).toBe('existing');
      expect(selectLayout({ role: 'student', contract: age10 })).toEqual({
        layout: LAYOUTS.EXISTING,
        reason: 'outside-rollout'
      });

      // Verified age 15 -> existing / older
      const age15 = evaluateLayoutSelection({
        role: 'student',
        trustedAge: 15,
        trustedAgeStatus: 'valid'
      });
      expect(age15.layout).toBe('existing');
      expect(selectLayout({ role: 'student', contract: age15 })).toEqual({
        layout: LAYOUTS.EXISTING,
        reason: 'older'
      });

      // Unverified legacy 13-15 band -> existing / ambiguous
      const legacy1315 = evaluateLayoutSelection({
        role: 'student',
        trustedAgeStatus: 'missing',
        hasUnverifiedAgeSignal: true
      });
      expect(legacy1315.layout).toBe('existing');
      expect(legacy1315.reason).toBe('ambiguous');
      expect(selectLayout({ role: 'student', contract: legacy1315 })).toEqual({
        layout: LAYOUTS.EXISTING,
        reason: 'ambiguous'
      });

      // Bare learner with no age/cohort signal -> existing / missing
      const bare = evaluateLayoutSelection({
        role: 'student',
        trustedAgeStatus: 'missing',
        hasUnverifiedAgeSignal: false
      });
      expect(bare.layout).toBe('existing');
      expect(bare.reason).toBe('missing');
      expect(selectLayout({ role: 'student', contract: bare })).toEqual({
        layout: LAYOUTS.EXISTING,
        reason: 'missing'
      });

      // Staff override to lower-secondary on ambiguous secondary learner -> lower-secondary
      const overridden = evaluateLayoutSelection({
        role: 'student',
        trustedAgeStatus: 'missing',
        hasUnverifiedAgeSignal: true,
        staffOverride: 'lower-secondary'
      });
      expect(overridden.layout).toBe('lower-secondary');
      expect(overridden.reason).toBe('staff-override');
      expect(selectLayout({ role: 'student', contract: overridden })).toEqual({
        layout: LAYOUTS.LOWER_SECONDARY,
        reason: 'override-lower-secondary'
      });

      // Staff override to lower-secondary blocked on under-11 and unverified-age primary
      const blockedPrimary = evaluateLayoutSelection({
        role: 'student',
        isPrimary: true,
        trustedAgeStatus: 'missing',
        staffOverride: 'lower-secondary'
      });
      expect(blockedPrimary.layout).toBe('existing');
      expect(blockedPrimary.overrideBlocked).toBe(true);
      expect(selectLayout({ role: 'student', contract: blockedPrimary }).layout).toBe(LAYOUTS.EXISTING);
    });
  });

  describe('2. Emulator API & Provenance Verification (GET /api/me, Admin Users, Coach Students)', () => {
    let env;
    let adminToken;
    let coachAssignedToken;
    let coachOtherToken;
    let parentToken;
    const schoolId = 'ls-test-school';
    const classLowerSec = 'ls-class-11-14';
    const classHigherSec = 'ls-class-15-18';
    const classHigherPri = 'ls-class-9-10';
    const classOther = 'ls-class-other';

    beforeAll(async () => {
      env = await setupApiTestEnv();

      // Seed active school cohorts
      for (const cohort of SCHOOL_COHORTS) {
        await env.db.collection('cohorts').doc(cohort.cohortId).set(cohort);
      }

      // Seed school and classes
      await env.db.collection('schools').doc(schoolId).set({
        orgId: 'org-welearn',
        name: 'Lower Secondary Test School',
        status: 'active'
      });
      await env.db.collection('classes').doc(classLowerSec).set({
        schoolId,
        name: 'Year 8 Lower Sec',
        cohortId: 'cohort-lower-secondary',
        status: 'active'
      });
      await env.db.collection('classes').doc(classHigherSec).set({
        schoolId,
        name: 'Year 11 Higher Sec',
        cohortId: 'cohort-higher-secondary',
        status: 'active'
      });
      await env.db.collection('classes').doc(classHigherPri).set({
        schoolId,
        name: 'Year 5 Higher Primary',
        cohortId: 'cohort-higher-primary',
        status: 'active'
      });
      await env.db.collection('classes').doc(classOther).set({
        schoolId,
        name: 'Other Coach Class',
        cohortId: 'cohort-lower-secondary',
        status: 'active'
      });

      // Seed admin, assigned coach, other coach, and parent
      await env.db.collection('users').doc('ls-admin').set({
        uid: 'ls-admin',
        email: 'ls-admin@welearn.test',
        role: 'admin',
        orgId: 'org-welearn',
        schoolIds: [schoolId],
        classIds: [],
        status: 'active'
      });
      adminToken = await env.getIdToken('ls-admin', {
        role: 'admin',
        orgId: 'org-welearn',
        schoolIds: [schoolId],
        classIds: []
      });

      await env.db.collection('users').doc('ls-coach-assigned').set({
        uid: 'ls-coach-assigned',
        email: 'ls-coach-assigned@welearn.test',
        role: 'coach',
        orgId: 'org-welearn',
        schoolIds: [schoolId],
        classIds: [classLowerSec, classHigherSec, classHigherPri],
        status: 'active'
      });
      coachAssignedToken = await env.getIdToken('ls-coach-assigned', {
        role: 'coach',
        orgId: 'org-welearn',
        schoolIds: [schoolId],
        classIds: [classLowerSec, classHigherSec, classHigherPri]
      });

      await env.db.collection('users').doc('ls-coach-other').set({
        uid: 'ls-coach-other',
        email: 'ls-coach-other@welearn.test',
        role: 'coach',
        orgId: 'org-welearn',
        schoolIds: [schoolId],
        classIds: [classOther],
        status: 'active'
      });
      coachOtherToken = await env.getIdToken('ls-coach-other', {
        role: 'coach',
        orgId: 'org-welearn',
        schoolIds: [schoolId],
        classIds: [classOther]
      });

      await env.db.collection('users').doc('ls-parent').set({
        uid: 'ls-parent',
        email: 'ls-parent@welearn.test',
        role: 'parent',
        orgId: 'org-welearn',
        schoolIds: [schoolId],
        classIds: [],
        status: 'active'
      });
      parentToken = await env.getIdToken('ls-parent', {
        role: 'parent',
        orgId: 'org-welearn',
        schoolIds: [schoolId],
        classIds: []
      });
    });

    afterAll(async () => {
      await env?.teardown();
    });

    it('resolves verified DOB students (ages 10, 11 primary, 13, 15) accurately on GET /api/me and Admin GET', async () => {
      const yearNow = new Date().getUTCFullYear();
      const dobAge12 = `${yearNow - 12}-01-15`;
      const dobAge11 = `${yearNow - 11}-01-15`;
      const dobAge10 = `${yearNow - 10}-01-15`;
      const dobAge15 = `${yearNow - 15}-01-15`;

      // 1. Age 12 student -> lower-secondary (eligible)
      const create12 = await env.request('POST', '/api/admin/users', {
        token: adminToken,
        body: {
          email: `ls-dob12-${Date.now()}@welearn.test`,
          givenNames: 'Verified',
          surname: 'Twelve',
          displayName: 'Verified 12yo',
          role: 'student',
          schoolIds: [schoolId],
          cohortId: 'cohort-lower-secondary',
          dateOfBirth: dobAge12,
          ageBand: '13-15'
        }
      });
      expect(create12.status).toBe(201);
      expect(create12.body.layoutSelection).toMatchObject({
        contractVersion: LAYOUT_CONTRACT_VERSION,
        layout: 'lower-secondary',
        reason: 'eligible',
        verified: true,
        evidenceVerified: true,
        source: 'verified_dob',
        trustedAge: 12,
        age: 12
      });

      const token12 = await env.getIdToken(create12.body.uid, { role: 'student' });
      const me12 = await env.request('GET', '/api/me', { token: token12 });
      expect(me12.status).toBe(200);
      expect(me12.body.layoutSelection).toMatchObject({
        layout: 'lower-secondary',
        reason: 'eligible',
        source: 'verified_dob',
        age: 12
      });
      expect(selectLayout({ role: 'student', contract: me12.body.layoutSelection })).toEqual({
        layout: LAYOUTS.LOWER_SECONDARY,
        reason: 'eligible'
      });

      // 2. Age 11 primary student -> lower-secondary (eligible) while keeping isPrimary: true
      const create11Pri = await env.request('POST', '/api/admin/users', {
        token: adminToken,
        body: {
          email: `ls-dob11pri-${Date.now()}@welearn.test`,
          givenNames: 'Verified',
          surname: 'ElevenPrimary',
          displayName: 'Verified 11yo Primary',
          role: 'student',
          schoolIds: [schoolId],
          cohortId: 'cohort-higher-primary',
          dateOfBirth: dobAge11,
          ageBand: 'primary',
          cohort: 'primary'
        }
      });
      expect(create11Pri.status).toBe(201);
      expect(create11Pri.body.layoutSelection).toMatchObject({
        layout: 'lower-secondary',
        reason: 'eligible',
        source: 'verified_dob',
        isPrimary: true,
        trustedAge: 11,
        age: 11
      });

      // 3. Age 10 student -> existing (outside-rollout)
      const create10 = await env.request('POST', '/api/admin/users', {
        token: adminToken,
        body: {
          email: `ls-dob10-${Date.now()}@welearn.test`,
          givenNames: 'Verified',
          surname: 'Ten',
          displayName: 'Verified 10yo',
          role: 'student',
          schoolIds: [schoolId],
          cohortId: 'cohort-higher-primary',
          dateOfBirth: dobAge10,
          ageBand: 'primary'
        }
      });
      expect(create10.status).toBe(201);
      expect(create10.body.layoutSelection).toMatchObject({
        layout: 'existing',
        reason: 'outside-rollout',
        source: 'verified_dob',
        trustedAge: 10,
        age: 10
      });

      // 4. Age 15 student -> existing (older)
      const create15 = await env.request('POST', '/api/admin/users', {
        token: adminToken,
        body: {
          email: `ls-dob15-${Date.now()}@welearn.test`,
          givenNames: 'Verified',
          surname: 'Fifteen',
          displayName: 'Verified 15yo',
          role: 'student',
          schoolIds: [schoolId],
          cohortId: 'cohort-lower-secondary',
          dateOfBirth: dobAge15,
          ageBand: '13-15'
        }
      });
      expect(create15.status).toBe(201);
      expect(create15.body.layoutSelection).toMatchObject({
        layout: 'existing',
        reason: 'older',
        source: 'verified_dob',
        trustedAge: 15,
        age: 15
      });
    });

    it('resolves staff-assigned class cohorts (11..14 eligible, 15..18 older, 9..10 outside-rollout)', async () => {
      const resLower = await env.request('POST', '/api/coach/students', {
        token: coachAssignedToken,
        body: {
          displayName: 'Class Lower Sec Student',
          email: `ls-cls-lower-${Date.now()}@welearn.test`,
          classId: classLowerSec,
          ageBand: '13-15'
        }
      });
      expect(resLower.status).toBe(201);
      const uidLower = resLower.body.student.uid;
      const tokenLower = await env.getIdToken(uidLower, {
        role: 'student',
        orgId: 'org-welearn',
        schoolIds: [schoolId],
        classIds: [classLowerSec]
      });
      const meLower = await env.request('GET', '/api/me', { token: tokenLower });
      expect(meLower.status).toBe(200);
      expect(meLower.body.layoutSelection).toMatchObject({
        layout: 'lower-secondary',
        reason: 'eligible',
        verified: true,
        evidenceVerified: true,
        source: 'verified_cohort',
        ageRange: { min: 11, max: 14 }
      });

      const resHigher = await env.request('POST', '/api/coach/students', {
        token: coachAssignedToken,
        body: {
          displayName: 'Class Higher Sec Student',
          email: `ls-cls-higher-${Date.now()}@welearn.test`,
          classId: classHigherSec,
          ageBand: '16-18'
        }
      });
      expect(resHigher.status).toBe(201);
      const uidHigher = resHigher.body.student.uid;
      const tokenHigher = await env.getIdToken(uidHigher, {
        role: 'student',
        orgId: 'org-welearn',
        schoolIds: [schoolId],
        classIds: [classHigherSec]
      });
      const meHigher = await env.request('GET', '/api/me', { token: tokenHigher });
      expect(meHigher.body.layoutSelection).toMatchObject({
        layout: 'existing',
        reason: 'older',
        ageRange: { min: 15, max: 18 }
      });
    });

    it('keeps legacy self-editable users/{uid} data and student spoofing unresolved (ambiguous -> existing)', async () => {
      // Simulate a student who self-wrote dateOfBirth, cohortId, cohort, ageBand, layoutOverride on users/{uid}
      // AND self-enrolled into a lower-secondary class via joinCode (without signedClaims.classIds or authority)
      const spoofUid = `ls-spoof-${Date.now()}`;
      await env.db.collection('users').doc(spoofUid).set({
        uid: spoofUid,
        email: `${spoofUid}@welearn.test`,
        role: 'student',
        status: 'active',
        orgId: 'org-welearn',
        schoolIds: [schoolId],
        classIds: [classLowerSec], // self-written / self-enrolled on profile doc
        enrolledVia: { method: 'joinCode', classId: classLowerSec },
        dateOfBirth: '2013-05-10', // self-written 13yo DOB
        cohortId: 'cohort-lower-secondary', // self-written cohortId
        cohort: 'lower-secondary',
        ageBand: '13-15',
        layoutOverride: 'lower-secondary' // self-written override
      });

      // Token has only role: 'student' (no staff-assigned classIds in custom claims)
      const spoofToken = await env.getIdToken(spoofUid, { role: 'student' });
      const meSpoof = await env.request('GET', '/api/me', { token: spoofToken });
      expect(meSpoof.status).toBe(200);
      expect(meSpoof.body.layoutSelection).toMatchObject({
        layout: 'existing',
        reason: 'ambiguous',
        evidenceVerified: false,
        source: 'none',
        trustedAge: null,
        trustedAgeStatus: 'unverified',
        trustedCohortStatus: 'unverified',
        staffOverride: null
      });
      expect(selectLayout({ role: 'student', contract: meSpoof.body.layoutSelection })).toEqual({
        layout: LAYOUTS.EXISTING,
        reason: 'ambiguous'
      });

      // Furthermore, a coach of classLowerSec cannot use the student's spoofed classIds to override them
      const coachAttempt = await env.request('PATCH', `/api/coach/students/${spoofUid}/layout-override`, {
        token: coachAssignedToken,
        body: { layoutOverride: 'lower-secondary' }
      });
      expect(coachAttempt.status).toBe(403);
    });

    it('resolves bare learner accounts (no age/cohort fields) as missing -> existing', async () => {
      const bareUid = `ls-bare-${Date.now()}`;
      await env.db.collection('users').doc(bareUid).set({
        uid: bareUid,
        email: `${bareUid}@welearn.test`,
        role: 'student',
        status: 'active',
        orgId: 'org-welearn',
        schoolIds: [],
        classIds: []
      });
      const bareToken = await env.getIdToken(bareUid, { role: 'student' });
      const meBare = await env.request('GET', '/api/me', { token: bareToken });
      expect(meBare.status).toBe(200);
      expect(meBare.body.layoutSelection).toMatchObject({
        layout: 'existing',
        reason: 'missing',
        evidenceVerified: false,
        source: 'none'
      });
      expect(selectLayout({ role: 'student', contract: meBare.body.layoutSelection })).toEqual({
        layout: LAYOUTS.EXISTING,
        reason: 'missing'
      });
    });

    it('enforces staff override validation, under-11 safeguard, and class/role scope across Admin and Coach endpoints', async () => {
      // Provision an ambiguous 13-15 student in classHigherSec (so cohort is 15-18) and a primary student in classHigherPri (9-10)
      const secRes = await env.request('POST', '/api/coach/students', {
        token: coachAssignedToken,
        body: {
          displayName: 'Override Target Student',
          email: `ls-override-target-${Date.now()}@welearn.test`,
          classId: classHigherSec,
          ageBand: '13-15'
        }
      });
      expect(secRes.status).toBe(201);
      const secUid = secRes.body.student.uid;

      const priRes = await env.request('POST', '/api/coach/students', {
        token: coachAssignedToken,
        body: {
          displayName: 'Primary Target Student',
          email: `ls-pri-target-${Date.now()}@welearn.test`,
          classId: classHigherPri,
          ageBand: 'primary'
        }
      });
      expect(priRes.status).toBe(201);
      const priUid = priRes.body.student.uid;

      // 1. Student, parent, and unassigned coach cannot call coach override endpoint
      const secStudentToken = await env.getIdToken(secUid, {
        role: 'student',
        orgId: 'org-welearn',
        schoolIds: [schoolId],
        classIds: [classHigherSec]
      });
      for (const badToken of [secStudentToken, parentToken, coachOtherToken]) {
        const denied = await env.request('PATCH', `/api/coach/students/${secUid}/layout-override`, {
          token: badToken,
          body: { layoutOverride: 'lower-secondary' }
        });
        expect(denied.status).toBe(403);
      }

      // 2. Invalid override value rejected with 400
      const invalidVal = await env.request('PATCH', `/api/coach/students/${secUid}/layout-override`, {
        token: coachAssignedToken,
        body: { layoutOverride: 'invalid-layout' }
      });
      expect(invalidVal.status).toBe(400);

      // 3. Under-11 / primary student cannot be opted into lower-secondary by Coach or Admin
      const priCoachDenied = await env.request('PATCH', `/api/coach/students/${priUid}/layout-override`, {
        token: coachAssignedToken,
        body: { layoutOverride: 'lower-secondary' }
      });
      expect(priCoachDenied.status).toBe(400);

      const priAdminDenied = await env.request('PATCH', `/api/admin/users/${priUid}`, {
        token: adminToken,
        body: { layoutOverride: 'lower-secondary' }
      });
      expect(priAdminDenied.status).toBe(400);

      // 4. Assigned coach CAN set layoutOverride: 'lower-secondary' on the secondary student
      const coachOptIn = await env.request('PATCH', `/api/coach/students/${secUid}/layout-override`, {
        token: coachAssignedToken,
        body: { layoutOverride: 'lower-secondary' }
      });
      expect(coachOptIn.status).toBe(200);
      expect(coachOptIn.body.layoutOverride).toBe('lower-secondary');
      expect(coachOptIn.body.layoutSelection).toMatchObject({
        layout: 'lower-secondary',
        reason: 'staff-override',
        source: 'staff_override',
        staffOverride: 'lower-secondary',
        override: 'lowerSecondary'
      });

      // Verify GET /api/me reflects the coach override
      const meAfterOptIn = await env.request('GET', '/api/me', { token: secStudentToken });
      expect(meAfterOptIn.body.layoutSelection.layout).toBe('lower-secondary');
      expect(selectLayout({ role: 'student', contract: meAfterOptIn.body.layoutSelection })).toEqual({
        layout: LAYOUTS.LOWER_SECONDARY,
        reason: 'override-lower-secondary'
      });

      // 5. Assigned coach or Admin can clear the override back to null
      const coachClear = await env.request('PATCH', `/api/coach/students/${secUid}/layout-override`, {
        token: coachAssignedToken,
        body: { layoutOverride: null }
      });
      expect(coachClear.status).toBe(200);
      expect(coachClear.body.layoutOverride).toBeNull();
      expect(coachClear.body.layoutSelection.layout).toBe('existing');
      expect(coachClear.body.layoutSelection.reason).toBe('older');
    });
  });

  describe('3. Firestore Security Rules Verification (Current & Proposed Diff)', () => {
    beforeAll(() => {
      setLogLevel('error');
    });

    it('denies all client read/write access to userLayoutAuthority/{uid} under current firestore.rules', async () => {
      const currentRules = fs.readFileSync(RULES_PATH, 'utf8');
      const testEnv = await initializeTestEnvironment({
        projectId: 'demo-hearisland-layout-rules-current',
        firestore: { rules: currentRules }
      });

      try {
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
          await setDoc(doc(ctx.firestore(), 'userLayoutAuthority/student-1'), {
            uid: 'student-1',
            role: 'student',
            dobVerified: true,
            dateOfBirth: '2013-04-10',
            layoutOverride: null
          });
        });

        const studentDb = testEnv.authenticatedContext('student-1', { role: 'student' }).firestore();
        const coachDb = testEnv.authenticatedContext('coach-1', { role: 'coach' }).firestore();
        const adminClientDb = testEnv.authenticatedContext('admin-1', { role: 'admin' }).firestore();

        for (const db of [studentDb, coachDb, adminClientDb]) {
          await assertFails(getDoc(doc(db, 'userLayoutAuthority/student-1')));
          await assertFails(setDoc(doc(db, 'userLayoutAuthority/student-1'), { layoutOverride: 'lower-secondary' }));
          await assertFails(updateDoc(doc(db, 'userLayoutAuthority/student-1'), { layoutOverride: 'lower-secondary' }));
          await assertFails(deleteDoc(doc(db, 'userLayoutAuthority/student-1')));
        }
      } finally {
        await testEnv.cleanup();
      }
    });

    it('verifies the proposed firestore.rules diff blocks client writes to age/DOB/cohort/layoutOverride on users/{uid}', async () => {
      const currentRules = fs.readFileSync(RULES_PATH, 'utf8');

      // Apply the exact proposed rules diff for users/{userId} in memory
      const proposedRules = currentRules
        .replace(
          `        && !request.resource.data.keys().hasAny(['orgId', 'status', 'publicId', 'consent', 'enrolledVia'])`,
          `        && !request.resource.data.keys().hasAny(['orgId', 'status', 'publicId', 'consent', 'enrolledVia', 'dateOfBirth', 'cohortId', 'cohort', 'yearLevel', 'layoutOverride', 'layoutSelection', 'createdBy', 'updatedBy'])\n        && (!('ageBand' in request.resource.data) || request.resource.data.ageBand in ['13-15', '16-18'])`
        )
        .replace(
          `             .hasAny(['role', 'orgId', 'schoolIds', 'classIds', 'status', 'publicId', 'consent', 'enrolledVia'])`,
          `             .hasAny(['role', 'orgId', 'schoolIds', 'classIds', 'status', 'publicId', 'consent', 'enrolledVia', 'dateOfBirth', 'cohortId', 'cohort', 'ageBand', 'yearLevel', 'layoutOverride', 'layoutSelection', 'createdBy', 'updatedBy'])`
        );

      expect(proposedRules).not.toBe(currentRules);

      const testEnv = await initializeTestEnvironment({
        projectId: 'demo-hearisland-layout-rules-proposed',
        firestore: { rules: proposedRules }
      });

      try {
        const newStudentDb = testEnv.authenticatedContext('student-signup', { role: 'student' }).firestore();

        // Allowed self-signup create with '13-15' ageBand and no protected age/layout fields
        await assertSucceeds(
          setDoc(doc(newStudentDb, 'users/student-signup'), {
            displayName: 'New Student',
            email: 'new@welearn.test',
            ageBand: '13-15'
          })
        );

        // Blocked self-signup create with dateOfBirth, cohortId, layoutOverride, or primary ageBand
        const blockedCreateDb = testEnv.authenticatedContext('student-bad-create', { role: 'student' }).firestore();
        for (const forbiddenField of [
          { dateOfBirth: '2013-01-01' },
          { cohortId: 'cohort-lower-secondary' },
          { cohort: 'lower-secondary' },
          { yearLevel: 8 },
          { layoutOverride: 'lower-secondary' },
          { layoutSelection: { verified: true, age: 12 } },
          { createdBy: { uid: 'admin-1' } },
          { ageBand: 'primary' }
        ]) {
          await assertFails(
            setDoc(doc(blockedCreateDb, 'users/student-bad-create'), {
              displayName: 'Bad Create',
              ...forbiddenField
            })
          );
        }

        // Allowed profile update (e.g., displayName, avatarUrl)
        await assertSucceeds(
          updateDoc(doc(newStudentDb, 'users/student-signup'), {
            displayName: 'Updated Name'
          })
        );

        // Blocked profile updates on protected age/cohort/override fields
        for (const forbiddenUpdate of [
          { dateOfBirth: '2013-01-01' },
          { cohortId: 'cohort-lower-secondary' },
          { cohort: 'lower-secondary' },
          { ageBand: 'primary' },
          { yearLevel: 8 },
          { layoutOverride: 'lower-secondary' },
          { layoutSelection: { verified: true, age: 12 } },
          { updatedBy: { uid: 'admin-1' } }
        ]) {
          await assertFails(
            updateDoc(doc(newStudentDb, 'users/student-signup'), forbiddenUpdate)
          );
        }
      } finally {
        await testEnv.cleanup();
      }
    });
  });
});
