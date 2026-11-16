/**
 * A learner's progress through one PBL program: pure functions over one plain
 * object, unit-tested in tests/pbl-programs.test.js.
 *
 * Stored as users/{uid}/activityProgress/pbl-program-<programId>, which the
 * existing rules already make owner-writable and readable by the learner's
 * coach - so a coach review screen needs no new rules to read it. One
 * document per program, so two programs can never overwrite each other.
 *
 * Per session the learner records: done, which learner choice they made, a
 * short reflection, which "what happens" steps they ticked and how confident
 * they feel (1-5). Program tools (tools/) keep their own small object under
 * `tools`, cleaned by the tool that owns it. Evidence stays in the term
 * portfolio for now.
 */
export const LIMITS = { reflection: 1200, choiceId: 60, sessions: 60, toolBytes: 32000 };

const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');

export const progressDocId = (programId) => `pbl-program-${programId}`;

let programLookup = null;

/** Registry hook so progress can lookup session activities without circular dependencies. */
export function registerProgramLookup(fn) {
  programLookup = fn;
}

/**
 * `sessionKeys: 'course'` marks progress saved under course-wide session
 * numbers. Progress saved earlier for a course that had to be renumbered is
 * 'legacy': its numbers may point at the wrong sessions, so the learner is
 * asked to re-check rather than the app guessing.
 */
export function newProgress(programId) {
  return { version: 1, programId, sessionKeys: 'course', startedAt: null, sessions: {}, tools: {}, badges: [], updatedAt: null };
}

export const needsRecheck = (progress) => progress?.sessionKeys === 'legacy';

/** The learner has reviewed their sessions under the corrected numbering. */
export function confirmRecheck(progress, now = Date.now()) {
  return needsRecheck(progress) ? { ...progress, sessionKeys: 'course', updatedAt: now } : progress;
}

/** Whatever came back from storage, return well-formed progress for this program. */
export function hydrateProgress(stored, program) {
  const base = newProgress(program?.id);
  if (!stored || typeof stored !== 'object' || !program || stored.programId !== program.id) return base;
  const sessions = {};
  const rawSessions = stored.sessions && typeof stored.sessions === 'object' && !Array.isArray(stored.sessions) ? stored.sessions : {};
  for (const s of program.sessions || []) {
    const raw = rawSessions[s.sessionNumber] || rawSessions[String(s.sessionNumber)];
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const optionIds = (s.learnerChoices?.options || []).map((o) => o.id);
    const rawSteps = Array.isArray(raw.steps) ? raw.steps : [];
    const maxActivities = Array.isArray(s.activities) ? s.activities.length : 0;
    const steps = [...new Set(rawSteps.filter((i) => Number.isInteger(i) && i >= 0 && i < maxActivities))].sort((a, b) => a - b);
    const entry = {
      done: raw.done === true,
      choice: optionIds.includes(raw.choice) ? raw.choice : null,
      reflection: str(raw.reflection, LIMITS.reflection),
      steps,
      confidence: Number.isInteger(raw.confidence) && raw.confidence >= 1 && raw.confidence <= 5 ? raw.confidence : null
    };
    Object.defineProperty(entry, 'rawHasSteps', { value: Array.isArray(raw.steps), enumerable: false, writable: true });
    if (raw.submissions && typeof raw.submissions === 'object' && !Array.isArray(raw.submissions)) {
      const cleanSubmissions = {};
      for (const [k, sub] of Object.entries(raw.submissions)) {
        if (/^[a-z0-9_-]{1,40}$/i.test(k) && sub && typeof sub === 'object') {
          const url = str(sub.url || sub.link || '', 500);
          if (url) {
            cleanSubmissions[k] = {
              url,
              submittedAt: Number.isFinite(sub.submittedAt) ? sub.submittedAt : Date.now()
            };
          }
        }
      }
      if (Object.keys(cleanSubmissions).length > 0) {
        entry.submissions = cleanSubmissions;
      }
    }
    if (hasContent(entry)) sessions[s.sessionNumber] = entry;
  }
  const tools = {};
  if (stored.tools && typeof stored.tools === 'object' && !Array.isArray(stored.tools)) {
    for (const [k, v] of Object.entries(stored.tools)) {
      if (/^[a-z0-9_-]{1,64}$/i.test(k) && v && typeof v === 'object' && !Array.isArray(v)) {
        try {
          const serialized = JSON.stringify(v);
          if (serialized.length <= LIMITS.toolBytes) {
            tools[k] = JSON.parse(serialized);
          }
        } catch {
          /* ignore circular or un-serialisable data */
        }
      }
    }
  }
  const rawBadges = Array.isArray(stored.badges) ? stored.badges : [];
  const badges = [...new Set(rawBadges.filter((b) => typeof b === 'string' && /^[a-z0-9_-]{1,80}$/i.test(b)))].slice(0, 50);
  const legacy = stored.sessionKeys !== 'course' && program.renumbered === true && Object.keys(sessions).length > 0;
  return {
    ...base,
    sessionKeys: legacy ? 'legacy' : 'course',
    startedAt: Number.isFinite(stored.startedAt) && stored.startedAt > 0 ? stored.startedAt : null,
    sessions,
    tools,
    badges,
    updatedAt: Number.isFinite(stored.updatedAt) && stored.updatedAt > 0 ? stored.updatedAt : null
  };
}

const hasContent = (e) => e.done || e.choice || e.reflection || e.steps?.length > 0 || e.confidence || Object.keys(e.submissions || {}).length > 0;

const touch = (progress, patch, now) => ({ ...progress, ...patch, updatedAt: now });

export function startProgram(progress, now = Date.now()) {
  return progress.startedAt ? progress : touch(progress, { startedAt: now }, now);
}

function patchSession(progress, n, patch, now) {
  const prev = progress.sessions[n] || { done: false, choice: null, reflection: '', steps: [], confidence: null };
  const next = { steps: [], confidence: null, ...prev, ...patch };
  const sessions = { ...progress.sessions };
  if (hasContent(next)) sessions[n] = next; else delete sessions[n];
  return touch(progress, { sessions, startedAt: progress.startedAt || now }, now);
}

export function toggleSession(progress, sessionOrNum, now = Date.now()) {
  const n = typeof sessionOrNum === 'object' ? sessionOrNum.sessionNumber : sessionOrNum;
  let session = typeof sessionOrNum === 'object' ? sessionOrNum : null;
  if (!session && programLookup && progress.programId) {
    const prog = programLookup(progress.programId);
    session = prog?.sessions?.find((s) => s.sessionNumber === n) || null;
  }
  const cur = progress.sessions[n];
  const willBeDone = !cur?.done;
  const patch = { done: willBeDone };
  if (willBeDone) {
    if (session?.activities?.length > 0) {
      patch.steps = session.activities.map((_, i) => i);
    }
  } else {
    patch.steps = [];
  }
  return patchSession(progress, n, patch, now);
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

/** Tick or untick one "what happens" step (by its index in session.activities). */
export function toggleStep(progress, session, index, now = Date.now()) {
  if (!Number.isInteger(index) || index < 0 || index >= session.activities.length) return progress;
  const cur = progress.sessions[session.sessionNumber]?.steps || [];
  const steps = cur.includes(index) ? cur.filter((i) => i !== index) : [...cur, index].sort((a, b) => a - b);
  const allStepsDone = session.activities.length > 0 && steps.length === session.activities.length;
  const hasEvidence = Boolean(progress.sessions[session.sessionNumber]?.submissions && Object.keys(progress.sessions[session.sessionNumber].submissions).length > 0);
  const done = allStepsDone || hasEvidence;
  return patchSession(progress, session.sessionNumber, { steps, done }, now);
}

/** 1 (not yet) to 5 (I could teach it); picking the same value again clears it. */
export function setConfidence(progress, n, value, now = Date.now()) {
  const cur = progress.sessions[n]?.confidence;
  const v = Number.isInteger(value) && value >= 1 && value <= 5 && value !== cur ? value : null;
  return patchSession(progress, n, { confidence: v }, now);
}

/** Record multi-modal submission for a session: 'video' | 'github' | 'prototype' */
export function setSubmission(progress, n, kind, value, now = Date.now()) {
  const prev = progress.sessions[n] || { done: false, choice: null, reflection: '', steps: [], confidence: null, submissions: {} };
  const prevSubmissions = prev.submissions || {};
  const nextSubmissions = { ...prevSubmissions, [kind]: { url: str(value, 500), submittedAt: now } };
  return patchSession(progress, n, { submissions: nextSubmissions, done: true }, now);
}

/** Remove one multi-modal submission, recalculating completion status. */
export function removeSubmission(progress, n, kind, now = Date.now(), session = null) {
  const prev = progress.sessions[n] || { done: false, choice: null, reflection: '', steps: [], confidence: null, submissions: {} };
  const prevSubmissions = { ...(prev.submissions || {}) };
  delete prevSubmissions[kind];
  let s = session;
  if (!s && programLookup && progress.programId) {
    const prog = programLookup(progress.programId);
    s = prog?.sessions?.find((x) => x.sessionNumber === n) || null;
  }
  const totalSteps = s?.activities?.length || 0;
  const allStepsDone = totalSteps > 0 && (prev.steps || []).length === totalSteps;
  const hasEvidence = Object.keys(prevSubmissions).length > 0;
  const done = (allStepsDone || hasEvidence);
  return patchSession(progress, n, { submissions: prevSubmissions, done }, now);
}

/** Persistently record an unlocked badge so it is never revoked when tool state changes. */
export function unlockBadge(progress, badgeId, now = Date.now()) {
  if (!badgeId || typeof badgeId !== 'string') return progress;
  const cur = Array.isArray(progress.badges) ? progress.badges : [];
  if (cur.includes(badgeId)) return progress;
  return touch(progress, { badges: [...cur, badgeId] }, now);
}

/** Replace one tool's saved state. The tool cleans its own data before saving. */
export function setTool(progress, toolId, data, now = Date.now()) {
  if (!/^[a-z0-9_-]{1,64}$/i.test(toolId) || JSON.stringify(data).length > LIMITS.toolBytes) return progress;
  return touch(progress, { tools: { ...progress.tools, [toolId]: data }, startedAt: progress.startedAt || now }, now);
}

/**
 * A session counts as done only when its steps or evidence are done.
 */
export function isSessionDone(entry, session) {
  if (!entry?.done) return false;
  const totalSteps = session?.activities?.length || 0;
  if (totalSteps === 0) return true;
  const hasEvidence = Boolean(entry.submissions && Object.keys(entry.submissions).length > 0);
  if (hasEvidence) return true;
  if (entry.rawHasSteps === true && Array.isArray(entry.steps) && entry.steps.length === 0) {
    return false;
  }
  return true;
}

/** Summary for meters and the "next up" pointer. */
export function programProgress(progress, program) {
  const total = program.sessions.length;
  const isDone = (s) => isSessionDone(progress.sessions[s.sessionNumber], s);
  const done = program.sessions.filter(isDone).length;
  const next = program.sessions.find((s) => !isDone(s)) || null;
  const byPhase = Object.fromEntries(program.phases.map((ph) => {
    const n = ph.sessions.length;
    const d = ph.sessions.filter(isDone).length;
    return [ph.id || ph.phaseId, { done: d, total: n, complete: n > 0 && d === n }];
  }));
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0, next, byPhase };
}
