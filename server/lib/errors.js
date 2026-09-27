/**
 * Standard error shape for Phase 0 / Phase A API contract:
 * { "error": { "code": "VALIDATION", "message": "Human readable.", "field": "phone" } }
 */

export function formatError(code, message, field = null) {
  const errObj = { code, message };
  if (field) errObj.field = field;
  return { error: errObj };
}

export function sendError(res, status, code, message, field = null) {
  return res.status(status).json(formatError(code, message, field));
}
