import { useState } from 'react';
import { ArrowRight, Target, X } from 'lucide-react';
import { hrefFor } from '../../app/routes.js';
import './goals.css';

export const inviteStorageKey = (uid) => `goalsInviteDismissed_${uid || 'signed-out'}`;

export function inviteDismissed(uid) {
  try { return localStorage.getItem(inviteStorageKey(uid)) === '1'; } catch { return false; }
}

/**
 * The invitation to set goals, shown in the page's own flow on My Dashboard so
 * it can never cover a learner's work. Once dismissed it stays gone for that
 * learner on this device; a blocked store still hides it for this visit.
 */
export function GoalsInviteBanner({ uid }) {
  const [dismissed, setDismissed] = useState(() => inviteDismissed(uid));
  if (dismissed) return null;
  const dismiss = () => {
    try { localStorage.setItem(inviteStorageKey(uid), '1'); } catch { /* private mode: hide for this visit */ }
    setDismissed(true);
  };
  return <aside className="gl-invite" aria-labelledby="gl-invite-title">
    <span className="gl-invite-icon"><Target size={18} aria-hidden="true" /></span>
    <div className="gl-invite-text">
      <strong id="gl-invite-title">Set your goals for this term</strong>
      <p>Start from what you love: pick your strengths, one big goal and one small daily habit.</p>
    </div>
    <a className="gh-btn gh-btn-sm gh-btn-accent" href={hrefFor.goals()} onClick={dismiss}>Set my goals<ArrowRight size={14} aria-hidden="true" /></a>
    <button type="button" className="gh-btn gh-btn-sm gh-btn-ghost" onClick={dismiss}><X size={14} aria-hidden="true" />Not now</button>
  </aside>;
}
