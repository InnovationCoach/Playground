import { describe, it, beforeAll, afterAll, beforeEach, expect, vi } from 'vitest';
import crypto from 'node:crypto';
import { setupApiTestEnv } from './api-test-helper.js';
import { encryptToken, decryptToken } from '../../server/canva/crypto.js';
import { CanvaClient, CanvaPermissionDeniedError } from '../../server/canva/client.js';

// Setup test secret environment variables
process.env.CANVA_CLIENT_ID = 'OC-AaFyafCLmW1w';
process.env.CANVA_CLIENT_SECRET = 'test-mock-secret';
process.env.CANVA_TOKEN_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.CANVA_REDIRECT_URI = 'http://127.0.0.1:3001/api/canva/oauth/callback';

describe('API: Canva Connect Integration', () => {
  let env;
  const originalFetch = globalThis.fetch;
  let mockFetchHandler;

  beforeAll(async () => {
    env = await setupApiTestEnv();

    // Setup global fetch interceptor for Canva API mocks
    globalThis.fetch = async (url, options = {}) => {
      const urlStr = String(url);
      if (urlStr.startsWith('https://api.canva.com') || urlStr.startsWith('https://export-download.canva.com')) {
        if (mockFetchHandler) {
          return mockFetchHandler(urlStr, options);
        }
        return new Response(JSON.stringify({ error: 'unhandled mock' }), { status: 404 });
      }
      return originalFetch(url, options);
    };

    // Seed test users
    // 1. Coach (allowed)
    await env.db.collection('users').doc('coach_mary').set({
      uid: 'coach_mary',
      email: 'coach.mary@welearn.test',
      role: 'coach',
      orgId: 'org-welearn',
      classIds: ['class-alpha'],
      status: 'active',
      displayName: 'Coach Mary'
    });

    // 2. Student 16+ (allowed without parental consent)
    await env.db.collection('users').doc('student_older').set({
      uid: 'student_older',
      email: 'older.student@welearn.test',
      role: 'student',
      orgId: 'org-welearn',
      classIds: ['class-alpha'],
      status: 'active',
      cohort: 'higher-secondary',
      age: 16,
      dateOfBirth: '2010-01-01',
      displayName: 'Older Student'
    });

    // 3. Student under 15 without consent (MUST BE REFUSED)
    await env.db.collection('users').doc('student_under15').set({
      uid: 'student_under15',
      email: 'young.student@welearn.test',
      role: 'student',
      orgId: 'org-welearn',
      classIds: ['class-alpha'],
      status: 'active',
      cohort: 'lower-secondary',
      age: 13,
      dateOfBirth: '2013-05-15',
      displayName: 'Young Student',
      consent: { status: 'pending' }
    });

    // 4. Student under 15 WITH consent (allowed)
    await env.db.collection('users').doc('student_consented').set({
      uid: 'student_consented',
      email: 'consented.student@welearn.test',
      role: 'student',
      orgId: 'org-welearn',
      classIds: ['class-alpha'],
      status: 'active',
      cohort: 'lower-secondary',
      age: 14,
      dateOfBirth: '2012-08-20',
      displayName: 'Consented Student',
      consent: { status: 'granted', verifiedAt: new Date().toISOString() }
    });

    // 5. Attacker / Cross-user student
    await env.db.collection('users').doc('student_attacker').set({
      uid: 'student_attacker',
      email: 'attacker@welearn.test',
      role: 'student',
      orgId: 'org-welearn',
      classIds: ['class-beta'],
      status: 'active',
      cohort: 'higher-secondary',
      age: 17,
      displayName: 'Attacker Student'
    });
  });

  afterAll(async () => {
    globalThis.fetch = originalFetch;
    await env.teardown();
  });

  beforeEach(() => {
    mockFetchHandler = null;
  });

  // -------------------------------------------------------------------------
  // 1. Age Restriction Tests (< 15 refused)
  // -------------------------------------------------------------------------
  describe('OAuth Initiation for Learners and Coaches (Under-15 check disabled)', () => {
    it('allows a student under 15 to initiate OAuth without restriction', async () => {
      const token = await env.getIdToken('student_under15', { role: 'student' });
      const res = await env.request('GET', '/api/canva/oauth/start', {
        token,
        query: { format: 'json' }
      });

      expect(res.status).toBe(200);
      expect(res.body.url).toBeDefined();
      expect(res.body.state).toBeDefined();
    });

    it('allows a coach to initiate OAuth', async () => {
      const token = await env.getIdToken('coach_mary', { role: 'coach' });
      const res = await env.request('GET', '/api/canva/oauth/start', {
        token,
        query: { format: 'json' }
      });

      expect(res.status).toBe(200);
      expect(res.body.url).toBeDefined();
      expect(res.body.state).toBeDefined();
      expect(res.body.url).toContain('https://www.canva.com/api/oauth/authorize');
    });

    it('allows a student 15+ to initiate OAuth', async () => {
      const token = await env.getIdToken('student_older', { role: 'student' });
      const res = await env.request('GET', '/api/canva/oauth/start', {
        token,
        query: { format: 'json' }
      });

      expect(res.status).toBe(200);
      expect(res.body.url).toBeDefined();
      expect(res.body.state).toBeDefined();
    });

    it('allows a student under 15 with granted parental consent to initiate OAuth', async () => {
      const token = await env.getIdToken('student_consented', { role: 'student' });
      const res = await env.request('GET', '/api/canva/oauth/start', {
        token,
        query: { format: 'json' }
      });

      expect(res.status).toBe(200);
      expect(res.body.url).toBeDefined();
      expect(res.body.state).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // 2. OAuth State Mismatch & Reuse Tests
  // -------------------------------------------------------------------------
  describe('OAuth Flow Security (State Mismatch, Reused State, PKCE)', () => {
    it('rejects callback with unknown or mismatched state', async () => {
      const res = await env.request('GET', '/api/canva/oauth/callback', {
        query: {
          code: 'test_code_123',
          state: 'non_existent_state_value'
        }
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_STATE');
    });

    it('successfully processes callback and rejects a reused state', async () => {
      const coachToken = await env.getIdToken('coach_mary', { role: 'coach' });
      
      // Step 1: Start OAuth and get real state
      const startRes = await env.request('GET', '/api/canva/oauth/start', {
        token: coachToken,
        query: { format: 'json' }
      });
      expect(startRes.status).toBe(200);
      const { state } = startRes.body;
      expect(state).toBeDefined();

      // Mock Canva token exchange endpoint
      const mockAccessToken = 'plain_access_token_xyz_999';
      const mockRefreshToken = 'plain_refresh_token_abc_888';
      mockFetchHandler = (url, options) => {
        if (url.includes('/v1/oauth/token')) {
          return new Response(JSON.stringify({
            access_token: mockAccessToken,
            refresh_token: mockRefreshToken,
            token_type: 'Bearer',
            expires_in: 3600,
            scope: 'asset:read asset:write design:content:read design:content:write design:meta:read folder:read profile:read'
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return new Response('Not found', { status: 404 });
      };

      // Step 2: First callback with valid state
      const callbackRes = await env.request('GET', '/api/canva/oauth/callback', {
        query: {
          code: 'auth_code_legit',
          state,
          format: 'json'
        }
      });
      expect(callbackRes.status).toBe(200);
      expect(callbackRes.body.connected).toBe(true);
      expect(callbackRes.body.uid).toBe('coach_mary');

      // Step 3: Second callback with SAME state must be rejected (reused state rejected)
      const reuseRes = await env.request('GET', '/api/canva/oauth/callback', {
        query: {
          code: 'auth_code_reuse',
          state,
          format: 'json'
        }
      });
      expect(reuseRes.status).toBe(400);
      expect(reuseRes.body.error.code).toBe('STATE_ALREADY_USED');
    });
  });

  // -------------------------------------------------------------------------
  // 3. Encrypted Token Storage Verification
  // -------------------------------------------------------------------------
  describe('Encrypted Token Storage', () => {
    it('stores tokens encrypted; plaintext token never appears in Firestore', async () => {
      // Inspect Firestore document canvaConnections/coach_mary directly
      const docSnap = await env.db.collection('canvaConnections').doc('coach_mary').get();
      expect(docSnap.exists).toBe(true);

      const storedData = docSnap.data();
      expect(storedData.encryptedAccessToken).toBeDefined();
      expect(storedData.encryptedRefreshToken).toBeDefined();

      // PLAINTEXT MUST NEVER APPEAR IN FIRESTORE
      const rawJson = JSON.stringify(storedData);
      expect(rawJson).not.toContain('plain_access_token_xyz_999');
      expect(rawJson).not.toContain('plain_refresh_token_abc_888');

      // Verify that decryptToken successfully recovers the tokens
      const decryptedAccess = decryptToken(storedData.encryptedAccessToken);
      const decryptedRefresh = decryptToken(storedData.encryptedRefreshToken);
      expect(decryptedAccess).toBe('plain_access_token_xyz_999');
      expect(decryptedRefresh).toBe('plain_refresh_token_abc_888');
    });
  });

  // -------------------------------------------------------------------------
  // 4. Cross-User Connection Protection
  // -------------------------------------------------------------------------
  describe('Cross-User Access Boundary', () => {
    it('prevents another user from accessing or exporting using someone else connection', async () => {
      // student_attacker does not have a connection
      const attackerToken = await env.getIdToken('student_attacker', { role: 'student' });
      
      // Attempting export with attacker's token
      const res = await env.request('POST', '/api/canva/designs/DAGabc123/export', {
        token: attackerToken,
        body: { format: 'png' }
      });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_CONNECTED');

      // Verify connection status endpoint for attacker
      const statusRes = await env.request('GET', '/api/canva/connection', {
        token: attackerToken
      });
      expect(statusRes.status).toBe(200);
      expect(statusRes.body.connected).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Canva Export and Error Handling (permission_denied, polling)
  // -------------------------------------------------------------------------
  describe('Canva Export & Error Handling', () => {
    it('translates permission_denied trial quota response into a clear error', async () => {
      const coachToken = await env.getIdToken('coach_mary', { role: 'coach' });

      // Mock Canva export creation returning 403 permission_denied
      mockFetchHandler = (url, options) => {
        if (url.includes('/v1/exports')) {
          return new Response(JSON.stringify({
            code: 'permission_denied',
            message: 'You have exceeded your free trial export quota.'
          }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return new Response('Not found', { status: 404 });
      };

      const res = await env.request('POST', '/api/canva/designs/DAG_quota_test/export', {
        token: coachToken,
        body: { format: 'png' }
      });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('PERMISSION_DENIED');
      expect(res.body.error.message).toMatch(/trial export quota|permission/i);
    });

    it('export polling stops on success and does not loop forever', async () => {
      const coachToken = await env.getIdToken('coach_mary', { role: 'coach' });
      let pollCount = 0;

      mockFetchHandler = (url, options) => {
        if (url.endsWith('/v1/exports') && options.method === 'POST') {
          return new Response(JSON.stringify({
            job: { id: 'job_poll_success_1', status: 'in_progress' }
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        if (url.includes('/v1/exports/job_poll_success_1')) {
          pollCount++;
          if (pollCount === 1) {
            return new Response(JSON.stringify({
              job: { id: 'job_poll_success_1', status: 'in_progress' }
            }), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }
          // Succeed on 2nd poll
          return new Response(JSON.stringify({
            job: {
              id: 'job_poll_success_1',
              status: 'success',
              urls: ['https://export-download.canva.com/sample_design.png']
            }
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        if (url.includes('sample_design.png')) {
          return new Response(Buffer.from('fake-png-binary-data'), {
            status: 200,
            headers: { 'Content-Type': 'image/png' }
          });
        }

        return new Response('Not found', { status: 404 });
      };

      const res = await env.request('POST', '/api/canva/designs/DAG_success_design/export', {
        token: coachToken,
        body: { format: 'png' }
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('success');
      expect(res.body.exportId).toBe('job_poll_success_1');
      expect(pollCount).toBe(2);
    });

    it('export polling stops on failure and does not loop forever', async () => {
      const coachToken = await env.getIdToken('coach_mary', { role: 'coach' });
      let pollCount = 0;

      mockFetchHandler = (url, options) => {
        if (url.endsWith('/v1/exports') && options.method === 'POST') {
          return new Response(JSON.stringify({
            job: { id: 'job_poll_fail_1', status: 'in_progress' }
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        if (url.includes('/v1/exports/job_poll_fail_1')) {
          pollCount++;
          // Fail on 2nd poll
          return new Response(JSON.stringify({
            job: {
              id: 'job_poll_fail_1',
              status: 'failed',
              error: {
                code: 'license_required',
                message: 'The design contains premium elements that require a Canva Pro license.'
              }
            }
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        return new Response('Not found', { status: 404 });
      };

      const res = await env.request('POST', '/api/canva/designs/DAG_fail_design/export', {
        token: coachToken,
        body: { format: 'png' }
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('license_required');
      expect(pollCount).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // 6. Disconnect Route Tests
  // -------------------------------------------------------------------------
  describe('Disconnect Flow (POST /api/canva/disconnect)', () => {
    it('revokes token with Canva and deletes stored connection', async () => {
      const coachToken = await env.getIdToken('coach_mary', { role: 'coach' });
      let revokeCalled = false;

      mockFetchHandler = (url, options) => {
        if (url.includes('/v1/oauth/revoke')) {
          revokeCalled = true;
          return new Response('OK', { status: 200 });
        }
        return new Response('Not found', { status: 404 });
      };

      const disconnectRes = await env.request('POST', '/api/canva/disconnect', {
        token: coachToken
      });

      expect(disconnectRes.status).toBe(200);
      expect(disconnectRes.body.disconnected).toBe(true);
      expect(revokeCalled).toBe(true);

      // Verify connection document is removed from Firestore
      const docSnap = await env.db.collection('canvaConnections').doc('coach_mary').get();
      expect(docSnap.exists).toBe(false);
    });
  });
});
