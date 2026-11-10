/**
 * Reads the server's layout decision from GET /api/me (`layoutSelection`,
 * contractVersion 1). Unit-tested in tests/lower-secondary-contract.test.jsx.
 *
 * Off until the backend contract has passed emulator tests and coordinator
 * review: while LAYOUT_CONTRACT_ENABLED is false nothing is requested and every
 * account keeps the existing layout.
 *
 * Fails closed. A missing, malformed, unsupported, late, failed or disagreeing
 * response keeps the existing layout, and only this response is an input: never
 * the profile, the email address, localStorage or a query parameter.
 */
import { useEffect, useState } from 'react';
import { getMe } from '../../services/api/endpoints.js';
import { LAYOUTS, REASONS, selectLayout } from './layoutSelector.js';

export const LAYOUT_CONTRACT_ENABLED = false;
export const LAYOUT_CONTRACT_VERSION = 1;
const RESPONSE_TIMEOUT_MS = 5000;
const SERVER_LAYOUTS = { 'lower-secondary': LAYOUTS.LOWER_SECONDARY, existing: LAYOUTS.EXISTING };
const EXISTING = Object.freeze({ layout: LAYOUTS.EXISTING, reason: REASONS.MISSING });

/** One /api/me response for this account → the layout to use. */
export function resolveLayout({ me, uid, role }) {
  const selection = me?.layoutSelection;
  // A response for another account or role is never applied to this one.
  if (!uid || me?.uid !== uid || me?.role !== role) return EXISTING;
  if (!selection || typeof selection !== 'object' || selection.contractVersion !== LAYOUT_CONTRACT_VERSION || selection.verified !== true) return EXISTING;
  const serverLayout = Object.hasOwn(SERVER_LAYOUTS, selection.layout) ? SERVER_LAYOUTS[selection.layout] : null;
  if (!serverLayout) return { layout: LAYOUTS.EXISTING, reason: REASONS.INVALID };
  const choice = selectLayout({ role, contract: selection });
  // The server's decision and its own evidence must agree before a learner's layout changes.
  return choice.layout === serverLayout ? choice : { layout: LAYOUTS.EXISTING, reason: REASONS.INVALID };
}

function withTimeout(promise, ms) {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Layout response timed out')), ms); })]).finally(() => clearTimeout(timer));
}

/**
 * The signed-in account's layout, scoped by uid: a response is only kept for the
 * account that asked, and a new account starts from nothing. `pending` lets the
 * caller avoid showing one layout and swapping to another.
 */
export function useLayoutSelection({ uid, role, enabled = LAYOUT_CONTRACT_ENABLED, fetchMe = getMe, timeoutMs = RESPONSE_TIMEOUT_MS }) {
  const asks = Boolean(enabled && uid && role === 'student');
  const [settled, setSettled] = useState(null);
  useEffect(() => {
    setSettled(null);
    if (!asks) return undefined;
    let live = true;
    withTimeout(Promise.resolve().then(fetchMe), timeoutMs)
      .then((me) => resolveLayout({ me, uid, role }), () => EXISTING)
      .then((choice) => { if (live) setSettled({ uid, choice }); });
    return () => { live = false; };
  }, [asks, uid, role, fetchMe, timeoutMs]);
  if (!asks) return { ...EXISTING, pending: false };
  if (settled?.uid !== uid) return { ...EXISTING, pending: true };
  return { ...settled.choice, pending: false };
}
