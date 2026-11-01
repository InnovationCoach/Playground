/**
 * A learner's portfolio for one PBL program: pure functions over one plain
 * object, unit-tested in tests/program-portfolio.test.js.
 *
 * The page is shaped by the program itself: one section per competency the
 * program develops (from its phases and session evidence targets), each with
 * the program's own evidence prompts. A program without a competency mapping
 * falls back to one section per phase and says so.
 *
 * Stored as users/{uid}/activityProgress/portfolio-<programId>: owner-writable
 * and readable by the learner's coach under the existing Firestore rules.
 * Images live in Storage under portfolio/{uid}/{programId}/ and only their
 * URL and path are kept here. Nothing here is an assessment: evidence is what
 * the learner chose to show, not a coach-verified mastery level.
 */
import { competencyById, domainById } from '../pbl/content/competencies.js';

export const LIMITS = { entries: 120, images: 4, title: 120, note: 2000, link: 500, headline: 120, about: 600, imageBytes: 10 * 1024 * 1024 };
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const LAYOUTS = [{ id: 'gallery', label: 'Gallery' }, { id: 'journal', label: 'Journal' }];

export const portfolioDocId = (programId) => `portfolio-${programId}`;
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const safeLink = (v) => { const s = str(v, LIMITS.link); return /^https?:\/\//i.test(s) ? s : ''; };

export function newPortfolio(programId) {
  return { version: 1, programId, headline: '', about: '', layout: 'gallery', entries: [], updatedAt: null };
}

function cleanImage(img) {
  if (!img || typeof img !== 'object') return null;
  const url = str(img.url, 2000), path = str(img.path, 300);
  if (!/^(https?:|blob:)/.test(url)) return null;
  return { url, path, name: str(img.name, 120) };
}

function cleanEntry(e, sectionIds) {
  if (!e || typeof e !== 'object' || !sectionIds.has(e.sectionId)) return null;
  const title = str(e.title, LIMITS.title);
  if (!title) return null;
  return {
    id: str(e.id, 60) || `pe-${Date.now().toString(36)}`,
    sectionId: e.sectionId, title, note: str(e.note, LIMITS.note), link: safeLink(e.link),
    images: (Array.isArray(e.images) ? e.images : []).map(cleanImage).filter(Boolean).slice(0, LIMITS.images),
    createdAt: Number.isFinite(e.createdAt) ? e.createdAt : Date.now()
  };
}

/** Whatever came back from storage, return a well-formed portfolio for this program. */
export function hydratePortfolio(stored, program) {
  const base = newPortfolio(program.id);
  if (!stored || typeof stored !== 'object' || stored.programId !== program.id) return base;
  const ids = new Set(portfolioSections(program).map((s) => s.id));
  return {
    ...base,
    headline: str(stored.headline, LIMITS.headline), about: str(stored.about, LIMITS.about),
    layout: LAYOUTS.some((l) => l.id === stored.layout) ? stored.layout : 'gallery',
    entries: (Array.isArray(stored.entries) ? stored.entries : []).map((e) => cleanEntry(e, ids)).filter(Boolean).slice(0, LIMITS.entries),
    updatedAt: Number.isFinite(stored.updatedAt) ? stored.updatedAt : null
  };
}

/**
 * The program's sections, most-developed competency first. Each lists the
 * phases that build it and the program's own evidence prompts for it.
 */
export function portfolioSections(program) {
  const phases = program?.phases || [];
  const byId = new Map();
  const ensure = (id) => {
    const c = competencyById(id);
    if (!c) return null;
    if (!byId.has(id)) byId.set(id, { id, kind: 'competency', code: c.code, title: c.title, statement: c.statement, domain: domainById(c.domain)?.title || '', weight: 0, phases: [], prompts: [] });
    return byId.get(id);
  };
  for (const phase of phases) {
    const mark = (id, w) => { const s = ensure(id); if (!s) return; s.weight += w; if (!s.phases.includes(phase.title)) s.phases.push(phase.title); };
    (phase.competencies || []).forEach((id) => mark(id, 2));
    (phase.stretchCompetencies || []).forEach((id) => mark(id, 1));
    for (const session of phase.sessions || []) {
      const ev = session.evidenceToCollect || {};
      for (const id of ev.targetCompetencies || []) {
        mark(id, 1);
        const prompt = str(ev.prompt, 240);
        const s = byId.get(id);
        if (s && prompt && !s.prompts.some((p) => p.text === prompt)) s.prompts.push({ text: prompt, session: session.sessionNumber });
      }
    }
  }
  const sections = [...byId.values()].sort((a, b) => b.weight - a.weight);
  if (sections.length) return sections.map((s) => ({ ...s, prompts: s.prompts.slice(0, 3) }));
  return phases.map((phase, index) => ({
    id: `phase:${phase.id || phase.phaseId || index}`, kind: 'phase', code: `Phase ${index + 1}`, title: phase.title, statement: phase.summary || phase.description || '',
    domain: '', phases: [phase.title],
    prompts: (phase.sessions || []).map((s) => ({ text: str(s.evidenceToCollect?.prompt, 240), session: s.sessionNumber })).filter((p) => p.text).slice(0, 3)
  }));
}

/** Validate and add one evidence entry. Returns { portfolio } or { error } in plain words. */
export function addEntry(portfolio, draft, now = Date.now()) {
  if (portfolio.entries.length >= LIMITS.entries) return { error: `This portfolio is full (${LIMITS.entries} pieces). Ask your coach to archive older ones.` };
  if (!str(draft?.title, LIMITS.title)) return { error: 'Give this evidence a short title.' };
  if (str(draft.link, LIMITS.link) && !safeLink(draft.link)) return { error: 'Links need to start with http:// or https://.' };
  if (!str(draft.note, LIMITS.note) && !safeLink(draft.link) && !(draft.images || []).length) return { error: 'Add an image, a link or a few words about what this shows.' };
  const entry = { ...draft, id: `pe-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`, createdAt: now };
  const clean = cleanEntry(entry, new Set([draft.sectionId]));
  if (!clean) return { error: 'This evidence could not be saved to that section.' };
  return { portfolio: { ...portfolio, entries: [clean, ...portfolio.entries], updatedAt: now } };
}

export function removeEntry(portfolio, id, now = Date.now()) {
  return { ...portfolio, entries: portfolio.entries.filter((e) => e.id !== id), updatedAt: now };
}

export function setDetails(portfolio, patch, now = Date.now()) {
  const next = { ...portfolio, updatedAt: now };
  if ('headline' in patch) next.headline = String(patch.headline || '').slice(0, LIMITS.headline);
  if ('about' in patch) next.about = String(patch.about || '').slice(0, LIMITS.about);
  if (LAYOUTS.some((l) => l.id === patch.layout)) next.layout = patch.layout;
  return next;
}

/** How many sections have at least one piece of evidence. Never a score. */
export function coverage(portfolio, sections) {
  const filled = new Set(portfolio.entries.map((e) => e.sectionId));
  return { filled: sections.filter((s) => filled.has(s.id)).length, total: sections.length, pieces: portfolio.entries.length };
}

/** Client-side check before an upload; Storage rules enforce the same limits. */
export function imageProblem(file) {
  if (!IMAGE_TYPES.includes(file?.type)) return `${file?.name || 'This file'} isn’t a JPG, PNG, WebP or GIF image.`;
  if (file.size > LIMITS.imageBytes) return `${file.name} is larger than 10 MB.`;
  return null;
}
export const imagePath = (uid, programId, name, now = Date.now()) =>
  `portfolio/${uid}/${programId}/${now.toString(36)}_${String(name || 'image').replace(/[^\w.-]+/g, '_').slice(-80)}`;
