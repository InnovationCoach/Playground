/**
 * Learner progress is stored by session number, so every session needs a
 * number unique across its course. Shared by both program readers
 * (catalog.normaliseProgram and pblService.normaliseContractProgram) so they
 * always agree on which session a stored number means.
 */

/** True when session numbers are missing or repeated anywhere in the course. */
export function needsCourseNumbering(sessions) {
  const numbers = sessions.map((s) => s.sessionNumber);
  return numbers.some((n) => !Number.isInteger(n) || n < 1) || new Set(numbers).size !== numbers.length;
}

/**
 * Give phases' sessions 1..N in course order when their numbers can't be
 * trusted. `renumbered` lets progress saved under the old numbers be flagged
 * for the learner to re-check (see progress.js).
 */
export function numberCourseSessions(phases, alreadyRenumbered = false) {
  const misnumbered = needsCourseNumbering(phases.flatMap((ph) => ph.sessions));
  if (!misnumbered) return { phases, misnumbered, renumbered: alreadyRenumbered === true };
  let n = 0;
  return {
    phases: phases.map((ph) => ({ ...ph, sessions: ph.sessions.map((s) => ({ ...s, sessionNumber: ++n })) })),
    misnumbered,
    renumbered: true
  };
}
