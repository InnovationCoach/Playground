/**
 * Universe HTTP Transport, Headers, Idempotency-Key & Error Envelope Helpers
 * Conforms to MY-UNIVERSE-PILOT-CONTRACT-2026-11-02.md (§5, §6, §9.3, §9.5).
 */

import { randomUUID } from 'node:crypto';
import { API_CONTRACT_VERSION, MAX_REQUEST_BYTES } from '../../../shared/universe/index.js';

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{16,128}$/;

export function setUniverseHeaders(req, res) {
  if (!req.universeRequestId) {
    const incomingId = req.headers['x-request-id'];
    req.universeRequestId =
      typeof incomingId === 'string' && /^[A-Za-z0-9._:-]{1,128}$/.test(incomingId)
        ? incomingId
        : randomUUID();
  }
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Universe-Contract-Version', API_CONTRACT_VERSION);
  res.setHeader('X-Request-Id', req.universeRequestId);
}

export function sendUniverseError(req, res, status, code, message, { field = null, details = null, retryAfter = null } = {}) {
  setUniverseHeaders(req, res);
  if (retryAfter !== null && retryAfter !== undefined) {
    res.setHeader('Retry-After', String(retryAfter));
  }
  return res.status(status).json({
    contractVersion: API_CONTRACT_VERSION,
    error: {
      code,
      message,
      retryable: status === 429 || status === 503,
      requestId: req.universeRequestId,
      field: field ?? null,
      details: details ?? null
    }
  });
}

export function statusForErrorCode(code) {
  switch (code) {
    case 'PAYLOAD_TOO_LARGE':
      return 413;
    case 'UNAUTHENTICATED':
      return 401;
    case 'FORBIDDEN':
    case 'ORG_CONTEXT_REQUIRED':
      return 403;
    case 'NOT_FOUND':
      return 404;
    case 'MISSION_NOT_OPEN':
    case 'MISSION_WITHDRAWN':
    case 'MISSION_RETIRED':
    case 'CONTENT_VERSION_UNAVAILABLE':
    case 'POLICY_VERSION_UNAVAILABLE':
    case 'SUBMISSION_ALREADY_OPEN':
    case 'DRAFT_CONFLICT':
    case 'REVIEW_CONFLICT':
    case 'IDEMPOTENCY_KEY_REUSED':
      return 409;
    case 'RATE_LIMITED':
      return 429;
    case 'SERVICE_UNAVAILABLE':
      return 503;
    case 'VALIDATION_ERROR':
    case 'CONTRACT_VERSION_UNSUPPORTED':
    case 'IDEMPOTENCY_KEY_REQUIRED':
    default:
      return 400;
  }
}

/**
 * Middleware: attach headers, enforce 64 KiB incoming UTF-8 transport byte budget,
 * and verify contractVersion header/body agreement (§3, §5, §9.5).
 */
export function universeTransportGuard(req, res, next) {
  setUniverseHeaders(req, res);

  const contentLength = Number(req.headers['content-length']);
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return sendUniverseError(req, res, 413, 'PAYLOAD_TOO_LARGE', 'Request body exceeds the 64 KiB limit.');
  }
  if (typeof req.rawBodyBytes === 'number' && req.rawBodyBytes > MAX_REQUEST_BYTES) {
    return sendUniverseError(req, res, 413, 'PAYLOAD_TOO_LARGE', 'Request body exceeds the 64 KiB limit.');
  }

  const headerContractVersion = req.headers['x-universe-contract-version'];
  if (headerContractVersion !== undefined && headerContractVersion !== API_CONTRACT_VERSION) {
    return sendUniverseError(
      req,
      res,
      400,
      'CONTRACT_VERSION_UNSUPPORTED',
      'This mission request uses an unsupported contract version.',
      { field: 'X-Universe-Contract-Version' }
    );
  }

  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return sendUniverseError(req, res, 400, 'VALIDATION_ERROR', 'Expected a JSON object request body.');
    }
    try {
      const rawUtf8Bytes = Buffer.byteLength(JSON.stringify(body), 'utf8');
      if (rawUtf8Bytes > MAX_REQUEST_BYTES) {
        return sendUniverseError(req, res, 413, 'PAYLOAD_TOO_LARGE', 'Keep this work within 64 KiB.');
      }
    } catch {
      return sendUniverseError(req, res, 400, 'VALIDATION_ERROR', 'Invalid JSON body.');
    }

    if (body.contractVersion !== API_CONTRACT_VERSION) {
      return sendUniverseError(
        req,
        res,
        400,
        'CONTRACT_VERSION_UNSUPPORTED',
        'This mission request uses an unsupported contract version.',
        { field: 'contractVersion' }
      );
    }
    if (headerContractVersion !== undefined && headerContractVersion !== body.contractVersion) {
      return sendUniverseError(
        req,
        res,
        400,
        'CONTRACT_VERSION_UNSUPPORTED',
        'X-Universe-Contract-Version header must match body.contractVersion.',
        { field: 'contractVersion' }
      );
    }
  }

  return next();
}

/**
 * Extract and validate Idempotency-Key header (16..128 safe ASCII characters).
 */
export function requireIdempotencyKey(req, res) {
  const rawKey = req.headers['idempotency-key'];
  if (typeof rawKey !== 'string' || !IDEMPOTENCY_KEY_PATTERN.test(rawKey)) {
    sendUniverseError(
      req,
      res,
      400,
      'IDEMPOTENCY_KEY_REQUIRED',
      'Provide a valid Idempotency-Key header (16 to 128 safe ASCII characters).',
      { field: 'Idempotency-Key' }
    );
    return null;
  }
  return rawKey;
}
