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
export const LIMITS = { reflection: 1200, choiceId: 60, sessions: 60, toolBytes: 12000 };

const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');

export const progressDocId = (programId) => `pbl-program-${programId}`;

export function newProgress(programId) {
  return { version: 1, programId, startedAt: null, sessions: {}, tools: {}, updatedAt: null };
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
      reflection: str(raw.reflection, LIMITS.reflection),
      steps: [...new Set(Array.isArray(raw.steps) ? raw.steps.filter((i) => Number.isInteger(i) && i >= 0 && i < s.activities.length) : [])].sort((a, b) => a - b),
      confidence: Number.isInteger(raw.confidence) && raw.confidence >= 1 && raw.confidence <= 5 ? raw.confidence : null
    };
    if (raw.submissions && typeof raw.submissions === 'object' && Object.keys(raw.submissions).length > 0) {
      entry.submissions = raw.submissions;
    }
    if (hasContent(entry)) sessions[s.sessionNumber] = entry;
  }
  const tools = {};
  if (stored.tools && typeof stored.tools === 'object' && !Array.isArray(stored.tools)) {
    for (const [k, v] of Object.entries(stored.tools)) {
      if (/^[a-z0-9-]{1,40}$/.test(k) && v && typeof v === 'object' && JSON.stringify(v).length <= LIMITS.toolBytes) tools[k] = v;
    }
  }
  return {
    ...base,
    startedAt: Number.isFinite(stored.startedAt) ? stored.startedAt : null,
    sessions,
    tools,
    updatedAt: Number.isFinite(stored.updatedAt) ? stored.updatedAt : null
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

/** Tick or untick one "what happens" step (by its index in session.activities). */
export function toggleStep(progress, session, index, now = Date.now()) {
  if (!Number.isInteger(index) || index < 0 || index >= session.activities.length) return progress;
  const cur = progress.sessions[session.sessionNumber]?.steps || [];
  const steps = cur.includes(index) ? cur.filter((i) => i !== index) : [...cur, index].sort((a, b) => a - b);
  return patchSession(progress, session.sessionNumber, { steps }, now);
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
  return patchSession(progress, n, { submissions: nextSubmissions }, now);
}

/** Replace one tool's saved state. The tool cleans its own data before saving. */
export function setTool(progress, toolId, data, now = Date.now()) {
  if (!/^[a-z0-9-]{1,40}$/.test(toolId) || JSON.stringify(data).length > LIMITS.toolBytes) return progress;
  return touch(progress, { tools: { ...progress.tools, [toolId]: data }, startedAt: progress.startedAt || now }, now);
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
