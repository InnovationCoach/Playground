/**
 * Roles, per the Phase A contract (docs/BACKEND-PHASE-A-PROMPT-FOR-GEMINI.md §6).
 *
 * The claim value for a teacher stays `teacher`; "Course Coordinator" is only
 * the label the UI shows. Nothing here is a privilege check - the API and the
 * Firestore rules enforce access. This only decides which screens to draw.
 */
export const ROLES = ['admin', 'supervisor', 'teacher', 'student', 'parent'];
export const STAFF_ROLES = ['admin', 'supervisor', 'teacher'];

/** Roles that open the admin console rather than a learner or coach view. */
export const CONSOLE_ROLES = ['admin', 'supervisor'];

/**
 * The role the UI renders for, from the signed ID-token claim.
 *
 * admin, supervisor and parent are accepted from the CLAIM ONLY. The profile
 * document is client-writable in places and is a display mirror, so trusting a
 * `role: 'admin'` there would reopen the privilege-escalation bug fixed in
 * Phase 0 of the security work.
 *
 * Teachers keep their existing resolution (claim, or the legacy `coach`
 * mirror) so coaches granted before claims existed are not locked out.
 */
export function resolveRole(claims, profile) {
  const claimRole = claims?.role;
  if (claimRole === 'admin' || claimRole === 'supervisor' || claimRole === 'parent') return claimRole;

  const profileRole = profile?.role;
  const isTeacher = claimRole === 'teacher' || claimRole === 'coach'
    || profileRole === 'teacher' || profileRole === 'coach';
  return isTeacher ? 'teacher' : 'student';
}

/** What each role may do in the console. Mirrors the §6 matrix; the API is the authority. */
export function consolePermissions(role) {
  const isAdmin = role === 'admin';
  return {
    viewAccounts: isAdmin || role === 'supervisor',
    editAccounts: isAdmin,
    viewHistory: isAdmin || role === 'supervisor',
    issueParentInvite: isAdmin
  };
}
