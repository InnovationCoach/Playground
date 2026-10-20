/**
 * A learner's progress through one PBL program: pure functions over one plain
 * object, unit-tested in tests/pbl-programs.test.js.
 *
 * Stored as users/{uid}/activityProgress/pbl-program-<programId>, which the
 * existing rules already make owner-writable and readable by the learner's
 * coach - so a coach review screen needs no new rules to read it. One
 * document per program, so two programs can never overwrite each other.
 *
 * Per session the learner records: done, which learner choice they made, and
 * a short reflection. Evidence stays in the term portfolio for now.
 */
export const LIMITS = { reflection: 1200, choiceId: 60, sessions: 60 };

const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');

export const progressDocId = (programId) => `pbl-program-${programId}`;

export function newProgress(programId) {
  return { version: 1, programId, startedAt: null, sessions: {}, updatedAt: null };
}

/** Whatever came back from storage, return well-formed progress for this program. */
export function hydrateProgress(stored, program) {
  const base = newProgress(program.id);
  if (!stored || typeof stored !== 'object' || stored.programId !== program.id) return base;
  const sessions = {};
  for (const s of program.sessions) {
    const raw = stored.sessions?.[s.sessionNumber];
    if (!raw || typeof raw !== 'object') continue;
    const optionIds = (s.learnerChoices?.options || []).map((o) => o.id);
    const entry = {
      done: raw.done === true,
      choice: optionIds.includes(raw.choice) ? raw.choice : null,
      reflection: str(raw.reflection, LIMITS.reflection)
    };
    if (entry.done || entry.choice || entry.reflection) sessions[s.sessionNumber] = entry;
  }
  return {
    ...base,
    startedAt: Number.isFinite(stored.startedAt) ? stored.startedAt : null,
    sessions,
    updatedAt: Number.isFinite(stored.updatedAt) ? stored.updatedAt : null
  };
}

const touch = (progress, patch, now) => ({ ...progress, ...patch, updatedAt: now });

export function startProgram(progress, now = Date.now()) {
  return progress.startedAt ? progress : touch(progress, { startedAt: now }, now);
}

function patchSession(progress, n, patch, now) {
  const prev = progress.sessions[n] || { done: false, choice: null, reflection: '' };
  const next = { ...prev, ...patch };
  const sessions = { ...progress.sessions };
  if (next.done || next.choice || next.reflection) sessions[n] = next; else delete sessions[n];
  return touch(progress, { sessions, startedAt: progress.startedAt || now }, now);
}

export function toggleSession(progress, n, now = Date.now()) {
  return patchSession(progress, n, { done: !progress.sessions[n]?.done }, now);
}

/** Choosing the option already chosen clears it, like a pill toggle. */
export function chooseOption(progress, session, optionId, now = Date.now()) {
  const valid = (session.learnerChoices?.options || []).some((o) => o.id === optionId);
  if (!valid) return progress;
  const current = progress.sessions[session.sessionNumber]?.choice;
  return patchSession(progress, session.sessionNumber, { choice: current === optionId ? null : optionId }, now);
}

export function setReflection(progress, n, text, now = Date.now()) {
  return patchSession(progress, n, { reflection: str(text, LIMITS.reflection) }, now);
}

/** Summary for meters and the "next up" pointer. */
export function programProgress(progress, program) {
  const total = program.sessions.length;
  const done = program.sessions.filter((s) => progress.sessions[s.sessionNumber]?.done).length;
  const next = program.sessions.find((s) => !progress.sessions[s.sessionNumber]?.done) || null;
  const byPhase = Object.fromEntries(program.phases.map((ph) => {
    const n = ph.sessions.length;
    const d = ph.sessions.filter((s) => progress.sessions[s.sessionNumber]?.done).length;
    return [ph.id, { done: d, total: n, complete: n > 0 && d === n }];
  }));
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0, next, byPhase };
}
