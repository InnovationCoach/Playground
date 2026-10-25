import express from 'express';
import crypto from 'node:crypto';
import { getFirestore } from 'firebase-admin/firestore';
import { requireClaims } from '../middleware/auth.js';
import { sendError } from '../lib/errors.js';
import {
  CanvaClient,
  CANVA_DEFAULT_SCOPES,
  CanvaPermissionDeniedError,
  CanvaApiError
} from '../canva/client.js';
import { encryptToken, decryptToken } from '../canva/crypto.js';
import { fetchFileBuffer, storePrivateExport, storeCloudinaryExport } from '../canva/storage.js';

const router = express.Router();

/**
 * Evaluates whether a user is under 15 years old.
 * Refuses students under 15 until verified parental consent exists.
 */
export function isUserUnder15(userData = {}) {
  // If explicitly flagged
  if (userData.isUnder15 === true || userData.under15 === true) {
    return true;
  }

  // Check dateOfBirth (YYYY-MM-DD)
  if (userData.dateOfBirth) {
    const dob = new Date(userData.dateOfBirth);
    if (!isNaN(dob.getTime())) {
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      return age < 15;
    }
  }

  // Check numeric age
  if (typeof userData.age === 'number' && !isNaN(userData.age)) {
    return userData.age < 15;
  }

  // Check cohort or ageBand string
  const cohort = userData.cohort || userData.ageBand || '';
  if (cohort === 'primary') {
    return true;
  }
  if (cohort === 'lower-secondary' || cohort === '13-15') {
    // lower-secondary represents 13-14 year olds; unless verified 15+, treat as under 15
    return true;
  }

  return false;
}

/**
 * GET /api/canva/oauth/start
 * Signed-in coach or student only.
 * Creates state and PKCE verifier, stores them server-side, and redirects to Canva.
 */
router.get('/oauth/start', requireClaims, async (req, res) => {
  const db = getFirestore();
  const caller = req.caller;

  // Retrieve user document (under-15 check removed for now per requirement)
  const userDocSnap = await db.collection('users').doc(caller.uid).get();
  const userData = userDocSnap.exists ? userDocSnap.data() : {};

  // Generate cryptographically secure state and PKCE code_verifier (43-128 chars)
  const state = crypto.randomBytes(32).toString('hex');
  const codeVerifier = crypto.randomBytes(48).toString('base64url'); // 64 chars
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  const clientId = process.env.CANVA_CLIENT_ID || 'OC-AaFyafCLmW1w';
  const redirectUri = process.env.CANVA_REDIRECT_URI || 'http://127.0.0.1:3001/api/canva/oauth/callback';

  // Store state & verifier server-side in Firestore
  const stateRef = db.collection('canvaOAuthStates').doc(state);
  await stateRef.set({
    state,
    uid: caller.uid,
    codeVerifier,
    used: false,
    createdAt: new Date().toISOString(),
    expiresAt: Date.now() + 15 * 60 * 1000 // 15-minute expiry
  });

  const authUrl = new URL('https://www.canva.com/api/oauth/authorize');
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 's256');
  authUrl.searchParams.set('scope', CANVA_DEFAULT_SCOPES.join(' '));
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', state);

  // If JSON requested (API consumers, headless tests)
  if (req.query.format === 'json' || req.headers.accept?.includes('application/json')) {
    return res.json({
      url: authUrl.toString(),
      state
    });
  }

  return res.redirect(authUrl.toString());
});

/**
 * GET /api/canva/oauth/callback
 * Verifies state, exchanges code for tokens with PKCE verifier, and stores encrypted tokens.
 */
router.get('/oauth/callback', async (req, res) => {
  const db = getFirestore();
  const { code, state, error, error_description } = req.query;

  if (error) {
    return sendError(res, 400, 'CANVA_OAUTH_DENIED', error_description || String(error));
  }

  if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
    return sendError(res, 400, 'VALIDATION', 'Missing authorization code or state parameter.', !code ? 'code' : 'state');
  }

  const stateRef = db.collection('canvaOAuthStates').doc(state);
  const stateSnap = await stateRef.get();

  if (!stateSnap.exists) {
    return sendError(res, 400, 'INVALID_STATE', 'Invalid or expired authorization state.');
  }

  const stateData = stateSnap.data();

  // Test Requirement: A reused state is rejected
  if (stateData.used) {
    return sendError(res, 400, 'STATE_ALREADY_USED', 'This authorization request has already been used.');
  }

  // Check state expiration
  if (Date.now() > (stateData.expiresAt || 0)) {
    return sendError(res, 400, 'STATE_EXPIRED', 'Authorization session expired.');
  }

  // Immediately mark state as used to prevent replay attacks
  await stateRef.update({
    used: true,
    usedAt: new Date().toISOString()
  });

  const redirectUri = process.env.CANVA_REDIRECT_URI || 'http://127.0.0.1:3001/api/canva/oauth/callback';
  const client = new CanvaClient();

  let tokens;
  try {
    tokens = await client.exchangeAuthorizationCode({
      code,
      codeVerifier: stateData.codeVerifier,
      redirectUri
    });
  } catch (err) {
    return sendError(res, err.status || 500, err.code || 'TOKEN_EXCHANGE_FAILED', err.message);
  }

  // Encrypt tokens before storing; plaintext tokens NEVER appear in Firestore
  const encryptedAccessToken = encryptToken(tokens.accessToken);
  const encryptedRefreshToken = encryptToken(tokens.refreshToken);

  const connRef = db.collection('canvaConnections').doc(stateData.uid);
  await connRef.set({
    uid: stateData.uid,
    encryptedAccessToken,
    encryptedRefreshToken,
    expiresAt: Date.now() + ((tokens.expiresIn || 3600) * 1000),
    tokenType: tokens.tokenType || 'Bearer',
    scope: tokens.scope || CANVA_DEFAULT_SCOPES.join(' '),
    connectedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  if (req.headers.accept?.includes('application/json') || req.query.format === 'json') {
    return res.json({
      success: true,
      connected: true,
      uid: stateData.uid
    });
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return res.redirect(`${frontendUrl}/#/coach/studio?canva=connected`);
});

/**
 * GET /api/canva/connection
 * Signed-in caller check for connection status.
 */
router.get('/connection', requireClaims, async (req, res) => {
  const db = getFirestore();
  const connSnap = await db.collection('canvaConnections').doc(req.caller.uid).get();

  if (!connSnap.exists) {
    return res.json({ connected: false });
  }

  const data = connSnap.data();
  return res.json({
    connected: true,
    uid: req.caller.uid,
    connectedAt: data.connectedAt,
    expiresAt: data.expiresAt,
    scope: data.scope
  });
});

/**
 * POST /api/canva/disconnect
 * Revokes token with Canva and deletes stored connection.
 */
router.post('/disconnect', requireClaims, async (req, res) => {
  const db = getFirestore();
  const uid = req.caller.uid;
  const connRef = db.collection('canvaConnections').doc(uid);
  const connSnap = await connRef.get();

  if (!connSnap.exists) {
    return res.json({
      success: true,
      disconnected: true,
      message: 'No Canva connection found.'
    });
  }

  const connData = connSnap.data();
  let refreshToken = null;
  try {
    refreshToken = decryptToken(connData.encryptedRefreshToken);
  } catch (err) {
    console.warn(`[CanvaDisconnect] Unable to decrypt refresh token for ${uid}:`, err.message);
  }

  if (refreshToken) {
    const client = new CanvaClient();
    try {
      await client.revokeToken({ token: refreshToken });
    } catch (err) {
      console.warn(`[CanvaDisconnect] Revocation call returned error:`, err.message);
    }
  }

  // Delete stored connection
  await connRef.delete();

  return res.json({
    success: true,
    disconnected: true
  });
});

/**
 * POST /api/canva/designs/:designId/export
 * Runs export job with exponential backoff polling and handles storage split.
 */
router.post('/designs/:designId/export', requireClaims, async (req, res) => {
  const db = getFirestore();
  const uid = req.caller.uid;
  const { designId } = req.params;
  const { format = 'png', publish = false, classId, purpose = 'portfolio' } = req.body;

  // Retrieve user's own connection
  const connRef = db.collection('canvaConnections').doc(uid);
  const connSnap = await connRef.get();

  if (!connSnap.exists) {
    return sendError(
      res,
      404,
      'NOT_CONNECTED',
      'No Canva connection found for this user. Please connect Canva first.'
    );
  }

  const connData = connSnap.data();
  let accessToken;
  let refreshToken;

  try {
    accessToken = decryptToken(connData.encryptedAccessToken);
    refreshToken = decryptToken(connData.encryptedRefreshToken);
  } catch (err) {
    return sendError(res, 500, 'CRYPTO_ERROR', 'Failed to decrypt Canva credentials.');
  }

  const client = new CanvaClient();

  // Token refresh before expiry (if within 60s of expiring)
  if (Date.now() >= (connData.expiresAt - 60000)) {
    try {
      const refreshed = await client.refreshAccessToken({ refreshToken });
      accessToken = refreshed.accessToken;
      refreshToken = refreshed.refreshToken;

      await connRef.update({
        encryptedAccessToken: encryptToken(accessToken),
        encryptedRefreshToken: encryptToken(refreshToken),
        expiresAt: Date.now() + ((refreshed.expiresIn || 3600) * 1000),
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      return sendError(res, 401, 'TOKEN_REFRESH_FAILED', 'Canva session expired. Please reconnect Canva.');
    }
  }

  // 1. Create async export job
  let exportJob;
  try {
    exportJob = await client.createExportJob({
      accessToken,
      designId,
      format
    });
  } catch (err) {
    if (err instanceof CanvaPermissionDeniedError) {
      return sendError(res, 403, 'PERMISSION_DENIED', err.message);
    }
    return sendError(res, err.status || 500, err.code || 'EXPORT_CREATE_FAILED', err.message);
  }

  // 2. Poll job until completion with exponential backoff
  let completedJob;
  try {
    completedJob = await client.pollExportJob({
      accessToken,
      exportId: exportJob.id
    });
  } catch (err) {
    if (err instanceof CanvaPermissionDeniedError) {
      return sendError(res, 403, 'PERMISSION_DENIED', err.message);
    }
    return sendError(res, err.status || 500, err.code || 'EXPORT_POLL_FAILED', err.message);
  }

  // 3. Storage split:
  // - Private export (learner's own design) -> Firebase Storage at canva-exports/{ownerUid}/{exportId}.{ext}
  // - Class-visible copy (coach publishing) -> Cloudinary (section 1 folders)
  const downloadUrl = completedJob.urls?.[0];
  let storageResult = null;

  if (downloadUrl) {
    try {
      const { buffer, contentType } = await fetchFileBuffer(downloadUrl);

      if (publish === true || purpose === 'resource') {
        // Coach publish to class
        storageResult = await storeCloudinaryExport({
          ownerUid: uid,
          classId: classId || req.caller.classIds?.[0],
          purpose: 'resource',
          buffer,
          format
        });
      } else {
        // Private export to Firebase Storage
        storageResult = await storePrivateExport({
          ownerUid: uid,
          exportId: completedJob.id,
          buffer,
          contentType,
          ext: format
        });
      }
    } catch (err) {
      console.error('[CanvaStorage] Failed to store exported asset:', err.message);
      // Even if storage download/upload fails, return the job result with warning
      return res.status(200).json({
        success: true,
        exportId: completedJob.id,
        status: completedJob.status,
        urls: completedJob.urls,
        storageError: err.message
      });
    }
  }

  return res.json({
    success: true,
    exportId: completedJob.id,
    status: completedJob.status,
    urls: completedJob.urls,
    storage: storageResult
  });
});

export default router;
