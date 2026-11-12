import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateMicrosoftIdentity,
  submitOrGetAccessRequest,
  reviewAccessRequest,
  assertAccessAllowed,
  verifyAccountLinking,
  APPROVED_ENTRA_TENANT_ID,
  APPROVED_DOMAIN,
  MANI_ADMIN_EMAIL
} from '../server/lib/microsoft-sso-auth.js';
import * as emailModule from '../server/lib/email.js';

/**
 * Lightweight in-memory Firestore mock for isolation and lightning-fast synthetic tests.
 */
function createMockDb() {
  const collections = new Map();

  const getCollection = (colName) => {
    if (!collections.has(colName)) collections.set(colName, new Map());
    return collections.get(colName);
  };

  return {
    _collections: collections,
    collection: (colName) => ({
      doc: (docId) => {
        const id = docId || `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        return {
          id,
          get: async () => {
            const col = getCollection(colName);
            const data = col.get(id);
            return {
              exists: !!data,
              id,
              data: () => (data ? JSON.parse(JSON.stringify(data)) : undefined)
            };
          },
          set: async (newData, options = {}) => {
            const col = getCollection(colName);
            const current = col.get(id) || {};
            const merged = options.merge ? { ...current, ...newData } : { ...newData };
            col.set(id, merged);
            return merged;
          },
          update: async (fields) => {
            const col = getCollection(colName);
            const current = col.get(id);
            if (!current) throw new Error(`Document ${id} does not exist to update`);
            const updated = { ...current, ...fields };
            col.set(id, updated);
            return updated;
          }
        };
      }
    })
  };
}

describe('Microsoft 365 SSO & First-Time Access Approval Workflow', () => {
  let mockDb;
  let mockAdminAuth;

  beforeEach(() => {
    mockDb = createMockDb();
    mockAdminAuth = {
      setCustomUserClaims: vi.fn().mockResolvedValue(undefined)
    };
    vi.restoreAllMocks();
  });

  // 1. Approved staff member and student access
  it('1. permits active, approved staff and students to access classes, records and resources', async () => {
    const staffUser = { uid: 'coach-123', email: 'sam.rivera@welearn.org', role: 'teacher', status: 'active', classIds: ['cls-1'] };
    const studentUser = { uid: 'student-456', email: 'alex.chen@welearn.org', role: 'student', status: 'active', classIds: ['cls-1'] };

    expect(() => assertAccessAllowed(staffUser, staffUser)).not.toThrow();
    expect(() => assertAccessAllowed(studentUser, studentUser)).not.toThrow();
  });

  // 2. First-time request creation & gate blocking
  it('2. registers a first-time user request as pending and blocks access to classes and Edmentum', async () => {
    vi.spyOn(emailModule, 'sendEmail').mockResolvedValue({ sent: true });

    const firstTimeToken = {
      uid: 'new-user-789',
      email: 'jordan.lee@welearn.org',
      name: 'Jordan Lee',
      firebase: { sign_in_provider: 'microsoft.com' },
      tid: APPROVED_ENTRA_TENANT_ID
    };

    const res = await submitOrGetAccessRequest(mockDb, firstTimeToken, {
      givenNames: 'Jordan',
      surname: 'Lee',
      requestedRole: 'staff',
      reason: 'Joining Lower Secondary Science Team'
    });

    expect(res.isNew).toBe(true);
    expect(res.duplicate).toBe(false);
    expect(res.request.status).toBe('pending');
    expect(res.request.notificationSent).toBe(true);
    expect(res.request.uid).toBe('new-user-789');

    // Confirm access is blocked at the data/API layer
    expect(() => assertAccessAllowed({ uid: 'new-user-789', status: 'pending' }, res.request))
      .toThrowError(/Access pending/);
  });

  // 3. Duplicate submissions idempotency
  it('3. returns existing request on repeated sign-ins or submissions without duplicating records', async () => {
    const emailSpy = vi.spyOn(emailModule, 'sendEmail').mockResolvedValue({ sent: true });

    const userToken = {
      uid: 'user-duplicate-test',
      email: 'taylor.swift@welearn.org',
      firebase: { sign_in_provider: 'microsoft.com' },
      tid: APPROVED_ENTRA_TENANT_ID
    };

    // First submission
    const res1 = await submitOrGetAccessRequest(mockDb, userToken, { reason: 'First try' });
    expect(res1.isNew).toBe(true);
    expect(emailSpy).toHaveBeenCalledTimes(1);

    // Repeated sign-in / re-submission
    const res2 = await submitOrGetAccessRequest(mockDb, userToken, { reason: 'Second try' });
    expect(res2.isNew).toBe(false);
    expect(res2.duplicate).toBe(true);
    expect(res2.request.requestId).toBe(res1.request.requestId);
    expect(res2.request.status).toBe('pending');

    // Notification is NOT duplicated
    expect(emailSpy).toHaveBeenCalledTimes(1);
  });

  // 4. Rejection flow & continued access denial
  it('4. records administrator rejection with reason and denies access to data layer', async () => {
    const userToken = {
      uid: 'user-to-reject',
      email: 'charlie.brown@welearn.org',
      firebase: { sign_in_provider: 'microsoft.com' },
      tid: APPROVED_ENTRA_TENANT_ID
    };
    await submitOrGetAccessRequest(mockDb, userToken, { reason: 'No affiliation' });

    const maniApprover = {
      uid: 'mani-admin-uid',
      email: MANI_ADMIN_EMAIL,
      role: 'admin',
      name: 'Mani'
    };

    const reviewRes = await reviewAccessRequest(mockDb, mockAdminAuth, maniApprover, 'req_user-to-reject', {
      decision: 'reject',
      rejectionReason: 'Applicant does not appear on current enrollment or staff rosters.'
    });

    expect(reviewRes.status).toBe('rejected');
    expect(reviewRes.rejectionReason).toContain('enrollment or staff rosters');

    // Verify request doc in db
    const snap = await mockDb.collection('accessRequests').doc('req_user-to-reject').get();
    expect(snap.data().status).toBe('rejected');
    expect(snap.data().reviewedByEmail).toBe(MANI_ADMIN_EMAIL);

    // Verify gate denies rejected user
    expect(() => assertAccessAllowed({ uid: 'user-to-reject', status: 'rejected' }))
      .toThrowError(/Access denied/);
  });

  // 5. Wrong tenant or wrong domain validation
  it('5. strictly rejects accounts from foreign Entra tenants or non-@welearn.org domains', () => {
    // Non-welearn domain
    const badDomainToken = {
      uid: 'bad-domain',
      email: 'attacker@other-school.edu',
      firebase: { sign_in_provider: 'microsoft.com' },
      tid: APPROVED_ENTRA_TENANT_ID
    };
    const domainCheck = validateMicrosoftIdentity(badDomainToken);
    expect(domainCheck.valid).toBe(false);
    expect(domainCheck.code).toBe('INVALID_DOMAIN');

    // Personal Microsoft account (@outlook.com)
    const personalAccountToken = {
      uid: 'personal-acct',
      email: 'learner@outlook.com',
      firebase: { sign_in_provider: 'microsoft.com' },
      tid: 'personal-consumer-tenant'
    };
    expect(validateMicrosoftIdentity(personalAccountToken).code).toBe('INVALID_DOMAIN');

    // Wrong Tenant ID with @welearn.org domain
    const wrongTenantToken = {
      uid: 'wrong-tenant',
      email: 'infiltrator@welearn.org',
      firebase: { sign_in_provider: 'microsoft.com' },
      tid: 'unauthorized-foreign-tenant-uuid'
    };
    const tenantCheck = validateMicrosoftIdentity(wrongTenantToken);
    expect(tenantCheck.valid).toBe(false);
    expect(tenantCheck.code).toBe('UNAPPROVED_TENANT');
  });

  // 6. Unauthorized approval attempt
  it('6. prevents non-Mani or non-admin accounts from approving or rejecting requests', async () => {
    const userToken = {
      uid: 'user-approval-gate',
      email: 'pat.guest@welearn.org',
      firebase: { sign_in_provider: 'microsoft.com' },
      tid: APPROVED_ENTRA_TENANT_ID
    };
    await submitOrGetAccessRequest(mockDb, userToken);

    // Another teacher or non-Mani admin attempts to approve
    const unauthorizedAdmin = {
      uid: 'other-admin-uid',
      email: 'someone.else@welearn.org',
      role: 'admin',
      name: 'Someone Else'
    };

    await expect(
      reviewAccessRequest(mockDb, mockAdminAuth, unauthorizedAdmin, 'req_user-approval-gate', {
        decision: 'approve',
        assignedRole: 'teacher'
      })
    ).rejects.toThrowError(/Unauthorized approval authority/);

    // Ensure claims were not called
    expect(mockAdminAuth.setCustomUserClaims).not.toHaveBeenCalled();
  });

  // 7. Preservation of existing user's Firebase UID upon account linking
  it('7. verifies that account linking preserves existing Firebase UID, roles, and class memberships', () => {
    const existingUserProfile = {
      uid: 'coach-sam-rivera-permanent-uid',
      email: 'sam.rivera@welearn.org',
      role: 'teacher',
      classIds: ['class_yr9_climate', 'class_yr12_eng'],
      status: 'active'
    };

    const existingClaims = {
      role: 'teacher',
      orgId: 'org-welearn',
      classIds: ['class_yr9_climate', 'class_yr12_eng']
    };

    const linkedAuthUser = {
      uid: 'coach-sam-rivera-permanent-uid', // UID preserved
      email: 'sam.rivera@welearn.org',
      providerData: [
        { providerId: 'password', email: 'sam.rivera@welearn.org' },
        { providerId: 'microsoft.com', email: 'sam.rivera@welearn.org' }
      ]
    };

    const check = verifyAccountLinking(existingUserProfile, existingClaims, linkedAuthUser);
    expect(check.valid).toBe(true);
    expect(check.uid).toBe('coach-sam-rivera-permanent-uid');
    expect(check.role).toBe('teacher');

    // Negative case: UID mismatch (e.g. if a new separate user was mistakenly created)
    const degradedAuthUser = { ...linkedAuthUser, uid: 'new-accidental-uid-999' };
    const degradedCheck = verifyAccountLinking(existingUserProfile, existingClaims, degradedAuthUser);
    expect(degradedCheck.valid).toBe(false);
    expect(degradedCheck.error).toContain('UID mismatch');
  });

  // 8. Resilient notification failure handling
  it('8. preserves access request in admin queue when email notification fails', async () => {
    // Mock sendEmail returning EMAIL_NOT_CONFIGURED or throwing
    vi.spyOn(emailModule, 'sendEmail').mockResolvedValue({ sent: false, reason: 'EMAIL_NOT_CONFIGURED' });

    const userToken = {
      uid: 'user-resilience-test',
      email: 'morgan.freeman@welearn.org',
      name: 'Morgan Freeman',
      firebase: { sign_in_provider: 'microsoft.com' },
      tid: APPROVED_ENTRA_TENANT_ID
    };

    const result = await submitOrGetAccessRequest(mockDb, userToken, {
      givenNames: 'Morgan',
      surname: 'Freeman',
      requestedRole: 'staff'
    });

    // Request is created successfully despite notification failure
    expect(result.isNew).toBe(true);
    expect(result.request.status).toBe('pending');
    expect(result.request.notificationSent).toBe(false);
    expect(result.request.notificationError).toBe('EMAIL_NOT_CONFIGURED');

    // Admin can still list and approve the request from the queue
    const maniApprover = {
      uid: 'mani-admin-uid',
      email: MANI_ADMIN_EMAIL,
      role: 'admin'
    };

    const approved = await reviewAccessRequest(mockDb, mockAdminAuth, maniApprover, 'req_user-resilience-test', {
      decision: 'approve',
      assignedRole: 'teacher'
    });

    expect(approved.success).toBe(true);
    expect(approved.assignedRole).toBe('teacher');

    const updatedUserSnap = await mockDb.collection('users').doc('user-resilience-test').get();
    expect(updatedUserSnap.data().status).toBe('active');
    expect(updatedUserSnap.data().role).toBe('teacher');
  });
});
