/**
 * Course Studio client, implementing docs/course-studio-contract.md.
 *
 * MOCK ONLY. Nothing here calls a model or the server. Drafts are built from the
 * coach's own source text by a local, deterministic function, so the screens can
 * be built and reviewed before Gemini's routes exist. Results are clearly labelled
 * as mock drafts. State lives in memory and resets on reload.
 *
 * When the live routes land, swap `request` for fetch to /api/course/* with the
 * caller's ID token. The return shapes stay the same.
 */

export const LIMITS = Object.freeze({
  sourceChars: 30000,
  sourcesPerRequest: 10,
  instructionChars: 500,
  sourceTitleChars: 120,
  generatePerHour: 20,
  generatePerDay: 200
});

export const STAGES = Object.freeze([
  { id: 'explore', label: 'Explore', stageNumber: 1 },
  { id: 'empathise', label: 'Empathise', stageNumber: 2 },
  { id: 'define', label: 'Define', stageNumber: 3 },
  { id: 'ideate', label: 'Ideate', stageNumber: 4 },
  { id: 'prototype', label: 'Prototype', stageNumber: 5 },
  { id: 'test', label: 'Test', stageNumber: 6 },
  { id: 'reflect', label: 'Reflect', stageNumber: 7 },
  { id: 'showcase', label: 'Showcase', stageNumber: 8 }
]);

const AGE_BANDS = ['11-13', '14-16', '17-18'];
const TYPES = ['milestones', 'slides', 'quiz', 'script'];
const MOCK_NOTE = 'MOCK DRAFT: built from your source text on this device. No AI model was used.';

let sourceSeq = 0;
let draftSeq = 0;
const sources = new Map();
const drafts = new Map();
const generateLog = [];

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

export class CourseStudioError extends Error {
  constructor(status, code, message, field = null) {
    super(message);
    this.name = 'CourseStudioError';
    this.status = status;
    this.code = code;
    this.field = field;
  }
}

const sentencesOf = (text) =>
  String(text || '')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 20 && s.length <= 240);

function checkSources(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new CourseStudioError(400, 'VALIDATION', 'Choose at least one source.', 'sources');
  }
  if (ids.length > LIMITS.sourcesPerRequest) {
    throw new CourseStudioError(400, 'VALIDATION', `Use at most ${LIMITS.sourcesPerRequest} sources.`, 'sources');
  }
  const picked = ids.map((id) => sources.get(id)).filter(Boolean);
  if (picked.length !== ids.length) {
    throw new CourseStudioError(403, 'FORBIDDEN', 'One of those sources is not available.', 'sources');
  }
  const total = picked.reduce((n, s) => n + s.text.length, 0);
  if (total > LIMITS.sourceChars) {
    throw new CourseStudioError(413, 'SOURCES_TOO_LARGE', `Sources total ${total.toLocaleString()} characters; the limit is ${LIMITS.sourceChars.toLocaleString()}.`, 'sources');
  }
  return picked;
}

function checkRateLimit(now) {
  const hourAgo = now - 60 * 60 * 1000;
  const dayAgo = now - 24 * 60 * 60 * 1000;
  if (generateLog.filter((t) => t > hourAgo).length >= LIMITS.generatePerHour) {
    throw new CourseStudioError(429, 'RATE_LIMITED', 'You have reached the hourly limit for drafts. Try again later.');
  }
  if (generateLog.filter((t) => t > dayAgo).length >= LIMITS.generatePerDay) {
    throw new CourseStudioError(429, 'RATE_LIMITED', 'You have reached the daily limit for drafts.');
  }
}

/* ---------- Sources ---------- */

export async function listSources() {
  await delay();
  return [...sources.values()].filter((s) => !s.archived).sort((a, b) => b.createdAt - a.createdAt);
}

export async function createSource({ title, text }) {
  await delay();
  const cleanTitle = String(title || '').trim();
  const cleanText = String(text || '').trim();
  if (!cleanTitle) throw new CourseStudioError(400, 'VALIDATION', 'Give the source a title.', 'title');
  if (cleanTitle.length > LIMITS.sourceTitleChars) {
    throw new CourseStudioError(400, 'VALIDATION', `Titles can be ${LIMITS.sourceTitleChars} characters.`, 'title');
  }
  if (cleanText.length < 40) throw new CourseStudioError(400, 'VALIDATION', 'Paste at least a short paragraph.', 'text');
  if (cleanText.length > LIMITS.sourceChars) {
    throw new CourseStudioError(413, 'SOURCES_TOO_LARGE', `One source can be at most ${LIMITS.sourceChars.toLocaleString()} characters.`, 'text');
  }
  if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(cleanText)) {
    throw new CourseStudioError(400, 'VALIDATION', 'This text contains an email address. Remove personal details before saving.', 'text');
  }
  sourceSeq += 1;
  const source = { id: `src-${sourceSeq}`, title: cleanTitle, text: cleanText, kind: 'paste', createdAt: Date.now(), archived: false };
  sources.set(source.id, source);
  return source;
}

export async function archiveSource(id) {
  await delay();
  const source = sources.get(id);
  if (source) source.archived = true;
}

/* ---------- Generation ---------- */

function buildMilestones(picked) {
  const lines = picked.flatMap((s) => sentencesOf(s.text));
  return {
    milestones: STAGES.map((stage, i) => ({
      id: `ms-${stage.id}-1`,
      phaseId: stage.id,
      title: `${stage.label}: ${lines[i] ? lines[i].slice(0, 70) : 'add a title'}`,
      goal: lines[i] || 'Add the learning goal for this stage.',
      sessions: [lines[i + 1] || 'Add a session.'].map((x) => x.slice(0, 160)),
      deliverables: ['Note: a short written reflection'],
      coachCue: 'Check in on what the learner has tried and what they will change next.',
      sourceRefs: picked.map((s) => s.id).slice(0, 1)
    }))
  };
}

function buildSlides(picked, count = 8) {
  const lines = picked.flatMap((s) => sentencesOf(s.text));
  const slides = [];
  for (let i = 0; i < lines.length && slides.length < Math.min(count, 12); i += 3) {
    const chunk = lines.slice(i, i + 3);
    slides.push({
      id: `slide-${slides.length + 1}`,
      heading: chunk[0].slice(0, 80),
      bullets: chunk.slice(1).map((b) => b.slice(0, 120)).slice(0, 5),
      speakerNotes: 'Read the heading aloud, then ask learners what they notice.',
      visualHint: 'One simple diagram or photo that matches the heading.',
      altText: `Slide about ${chunk[0].slice(0, 60)}`,
      sourceRefs: [picked[0].id]
    });
  }
  return { title: picked[0].title, audience: 'Learners', slides };
}

function buildQuiz(picked, count = 6) {
  const lines = picked.flatMap((s) => sentencesOf(s.text)).slice(0, count);
  return {
    title: `Check: ${picked[0].title}`,
    items: lines.map((line, i) => ({
      id: `q-${i + 1}`,
      type: 'true_false',
      prompt: `True or false: ${line.replace(/[.!?]$/, '')}.`,
      options: ['True', 'False'],
      answers: [i % 2 === 0 ? 0 : 1],
      explanation: 'Check the source paragraph this came from.',
      difficulty: 1,
      phaseId: STAGES[i % STAGES.length].id,
      sourceRefs: [picked[0].id]
    }))
  };
}

function buildScript(picked) {
  const deck = buildSlides(picked, 6);
  return {
    title: deck.title,
    sections: deck.slides.map((s) => ({
      slideId: s.id,
      narration: `${s.heading}. ${s.bullets.join(' ')}`.slice(0, 500),
      durationSec: 30
    }))
  };
}

const OUTPUT = { milestones: buildMilestones, slides: buildSlides, quiz: buildQuiz, script: buildScript };

export async function generate({ type, ageBand, sourceIds, phaseId = null, programId = null, futureSkillId = null, instructions = '' }) {
  await delay(400);
  if (!TYPES.includes(type)) throw new CourseStudioError(400, 'VALIDATION', 'Choose what to make.', 'type');
  if (!AGE_BANDS.includes(ageBand)) throw new CourseStudioError(400, 'VALIDATION', 'Choose an age band.', 'ageBand');
  if (String(instructions).length > LIMITS.instructionChars) {
    throw new CourseStudioError(400, 'VALIDATION', `Instructions can be ${LIMITS.instructionChars} characters.`, 'instructions');
  }
  const picked = checkSources(sourceIds);
  const now = Date.now();
  checkRateLimit(now);
  generateLog.push(now);

  const output = OUTPUT[type](picked);
  draftSeq += 1;
  const draft = {
    id: `draft-${draftSeq}`,
    type,
    status: 'draft',
    ageBand,
    phaseId,
    programId,
    futureSkillId,
    output,
    sourceIds: picked.map((s) => s.id),
    flags: picked.length ? [] : [{ itemId: null, code: 'ASSUMPTION' }],
    note: MOCK_NOTE,
    createdAt: now,
    updatedAt: now
  };
  drafts.set(draft.id, draft);
  return { draftId: draft.id, type, output, sourcesUsed: draft.sourceIds, flags: draft.flags, model: 'mock-local', generatedAt: new Date(now).toISOString(), note: MOCK_NOTE };
}

export async function listDrafts({ programId = null, futureSkillId = null } = {}) {
  await delay(80);
  return [...drafts.values()]
    .filter((d) => d.status !== 'discarded')
    .filter((d) => !programId || d.programId === programId)
    .filter((d) => !futureSkillId || d.futureSkillId === futureSkillId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function discardDraft(id) {
  await delay(80);
  const draft = drafts.get(id);
  if (draft) draft.status = 'discarded';
}
