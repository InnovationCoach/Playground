/**
 * Who belongs on a coach's roster. Shared so the workspace, the management
 * tools and the studio cannot drift apart.
 *
 * Test accounts are matched on a whole "test" word in the address, so
 * latest.kim@ and @contest.org stay on the roster while test.student@ does not.
 */
export function isTestAccount(user = {}) {
  if (user.isTest === true) return true;
  const email = String(user.email || '').toLowerCase();
  return email.endsWith('@hearisland-test.org') || email.split(/[.@]/).includes('test');
}

/**
 * Self-enrolled learners have no status (the rules forbid setting it on sign-up)
 * and invited learners stay `pending` until they finish setup; both are real
 * learners the coach must see. Suspended and archived accounts are not listed.
 */
export function isRosterLearner(user = {}) {
  const status = user.status ?? 'active';
  return user.role === 'student' && (status === 'active' || status === 'pending') && !isTestAccount(user);
}

/**
 * Whether a learner belongs in the class picker's selection: 'all', a class id,
 * or 'cohort:<id>'. Invited and self-enrolled learners often have no cohortId of
 * their own, so they follow the cohort of the class they are in.
 */
export function isLearnerInScope(learner = {}, scope = 'all', classes = []) {
  if (scope === 'all') return true;
  const classIds = Array.isArray(learner.classIds) ? learner.classIds : [];
  if (!scope.startsWith('cohort:')) return classIds.includes(scope);
  const cohortId = scope.slice('cohort:'.length);
  if (learner.cohortId) return learner.cohortId === cohortId;
  return classes.some(c => c.cohortId === cohortId && classIds.includes(c.id));
}
