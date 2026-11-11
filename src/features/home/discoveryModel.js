/**
 * Course discovery on the search page (#/search): source and type filters,
 * course competency outlines, and rule-based suggestions with plain reasons.
 *
 * Pure functions over the catalogue entries from courses/catalog.js and the
 * learner records the page already loads (goal plan, enrolled/assigned
 * courses). Unit-tested in tests/search-discovery.test.js.
 *
 * Honesty rules:
 * - Course competencies are course OUTCOMES ("works toward"), never learner
 *   achievement. Confirmed learner competencies come only from a connected
 *   competency service (see competencyContext); until then the UI says so.
 * - Suggestions are rules over real records (search, enrolment, assignment,
 *   current goal). No scores, no "you need", no AI.
 */
import { competencyById, domainById } from '../pbl/content/competencies.js';

export const SOURCE_TABS = ['all', 'welearn', 'external'];
export const TYPE_FILTERS = ['any', 'program', 'activity'];
const TAB_SOURCES = { welearn: ['activity', 'program'], external: ['partner'] };

const inTab = (item, tab) => !TAB_SOURCES[tab] || TAB_SOURCES[tab].includes(item.source);

/** Results for one source tab, and within WeLearn optionally one type. */
export function filterResults(items, { tab = 'all', type = 'any' } = {}) {
  return items.filter((item) => inTab(item, tab) && (type === 'any' || tab === 'external' || item.source === type));
}

export function tabCounts(items) {
  return Object.fromEntries(SOURCE_TABS.map((tab) => [tab, items.filter((item) => inTab(item, tab)).length]));
}

/** Counts for the type chips, inside the current tab. */
export function typeCounts(items, tab = 'all') {
  const pool = items.filter((item) => inTab(item, tab));
  return { any: pool.length, program: pool.filter((i) => i.source === 'program').length, activity: pool.filter((i) => i.source === 'activity').length };
}

/**
 * The competencies a course outline explicitly maps, strongest first (stage
 * targets weigh more than single sessions). Unknown framework ids are dropped,
 * and the original framework statement is kept. Course outcomes only.
 */
export function courseCompetencies(program) {
  if (!program) return [];
  const weight = new Map();
  const add = (id, w) => { if (competencyById(id)) weight.set(id, (weight.get(id) || 0) + w); };
  for (const phase of program.phases || []) {
    (phase.competencies || []).forEach((id) => add(id, 2));
    (phase.stretchCompetencies || []).forEach((id) => add(id, 1));
    for (const session of phase.sessions || []) (session.evidenceToCollect?.targetCompetencies || []).forEach((id) => add(id, 1));
  }
  return [...weight].sort((a, b) => b[1] - a[1]).map(([id]) => {
    const c = competencyById(id);
    return { id, code: c.code, title: c.title, statement: c.statement, domain: domainById(c.domain)?.title || '' };
  });
}

/** Where a course stands for this learner, from real enrolment/assignment records only. */
export function availability(item, courses = []) {
  if (item.source === 'partner') return 'external';
  if (item.source !== 'program') return 'open';
  const course = courses.find((c) => c.program?.id === item.id);
  if (!course) return 'open';
  return course.enrolment ? 'enrolled' : 'assigned';
}

const STOP = new Set(['about', 'after', 'again', 'also', 'and', 'because', 'before', 'being', 'build', 'could', 'from', 'have', 'into', 'learn', 'learning', 'like', 'make', 'more', 'need', 'project', 'should', 'some', 'that', 'their', 'them', 'then', 'there', 'these', 'thing', 'this', 'through', 'want', 'what', 'when', 'which', 'will', 'with', 'would', 'your']);
const norm = (s) => (s || '').toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}\s]/gu, ' ');

/** The meaningful words of a goal, so "Turn my garden idea into a prototype" looks for garden and prototype. */
export function goalWords(text) {
  return [...new Set(norm(text).split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w)))];
}

const haystack = (item) => norm(`${item.kicker} ${item.title} ${item.description} ${item.keywords} ${item.extra || ''}`);

/** Catalogue entries that share a meaningful word with a goal, most shared words first. */
export function relatedToGoal(items, goalText, ignore = new Set()) {
  const words = goalWords(goalText).filter((w) => !ignore.has(w));
  if (!words.length) return [];
  return items.map((item, order) => {
    const hay = haystack(item);
    const hits = words.filter((w) => hay.includes(w));
    return { item, word: hits[0], hits: hits.length, order };
  }).filter((x) => x.hits > 0).sort((a, b) => b.hits - a.hits || a.order - b.order);
}

/**
 * Up to three suggestions, each with the reasons it was picked:
 *   continue/assigned/enrolled (a real course record), goal (shares words
 *   with the chosen goal), search (matches what was typed).
 * While searching, suggestions come only from the search results, so nothing
 * unrelated sits above what the learner asked for. With no search and no
 * records, there are no suggestions: the UI offers to choose a focus instead.
 */
export function suggestions({ items = [], results = [], query = '', focusGoal = null, courses = [], limit = 3 }) {
  const q = query.trim();
  const pool = q ? results : items;
  const byKey = new Map(pool.map((item) => [item.key, item]));
  const searchReason = q ? [{ type: 'search', q }] : [];
  const out = [], seen = new Set();
  const push = (item, reasons) => {
    if (!item || seen.has(item.key) || out.length >= limit) return;
    seen.add(item.key);
    out.push({ item, reasons });
  };
  for (const course of courses) {
    const item = byKey.get(`program:${course.program?.id}`);
    if (!item) continue;
    const next = !course.progressUnavailable && !course.needsRecheck ? course.summary?.next : null;
    push(item, [...searchReason, next ? { type: 'continue', next: next.title } : { type: course.enrolment ? 'enrolled' : 'assigned' }]);
  }
  if (focusGoal?.explore) {
    for (const { item, word } of relatedToGoal(pool, focusGoal.explore)) push(item, [...searchReason, { type: 'goal', goal: focusGoal.explore, word }]);
  }
  if (q) for (const item of results) push(item, searchReason);
  return out;
}

/** Everyday names for courses whose official titles are hard to read at a glance. The dialog keeps the official title. */
const PLAIN_TITLES = {
  'EcoCool: Smart Urban Heat & Community Garden Monitor': 'Cool down a neighbourhood with a smart garden',
  'Entrepreneurship: Product Creation': 'Invent a product people want',
  'Project Genesis Engine: Storytelling IP': 'Create your own story world',
  'The Passion Project Blueprint': 'Plan a project about what you love',
  'Quantitative Biomechanics & Bio-Inspired Robotics': 'How animals move, and robots that copy them',
  'Hex-City Thailand: Modular Resilient Floating City': 'Design a floating city'
};
export const plainTitle = (item) => PLAIN_TITLES[item.title] || item.title.replace(/\s*\([^)]*\)\s*$/, '');

/** True of nearly every course, so sharing one of these says nothing about the fit. */
const WEAK_GOAL_WORDS = new Set(['idea', 'ideas', 'working', 'prototype', 'turn', 'real', 'good', 'better', 'help', 'world', 'people']);

/**
 * What Find a Quest offers: only quests this learner has not begun. Courses they
 * are enrolled in or assigned, things they added and activities they started
 * all belong to My Quests. Partner links stay in search because they leave SPARK.
 * Reasons are rules over real choices (goal, interests); with nothing to go on,
 * a couple of openers say so plainly. No scores, no AI.
 */
export function newQuests({ items = [], focusGoal = null, courses = [], interestMatches = [], started = [], added = [], limit = 3 }) {
  const taken = new Set([...courses.map((c) => `program:${c.program?.id}`), ...started.map((id) => `activity:${id}`), ...added]);
  const pool = items.filter((item) => item.source !== 'partner' && !taken.has(item.key));
  const out = [], seen = new Set();
  const push = (item, reason) => {
    if (!item || seen.has(item.key) || out.length >= limit) return;
    seen.add(item.key);
    out.push({ item, reason });
  };
  // Interests first: with goal matches capped at two, one goal can't fill the list with one reason.
  for (const match of interestMatches.slice(0, 1)) push(pool.find((item) => item.key === `activity:${match.id}`), { type: 'interest', interest: match.because[0] });
  if (focusGoal?.explore) for (const { item } of relatedToGoal(pool, focusGoal.explore, WEAK_GOAL_WORDS).slice(0, 2)) push(item, { type: 'goal', goal: focusGoal.explore });
  for (const match of interestMatches.slice(1)) push(pool.find((item) => item.key === `activity:${match.id}`), { type: 'interest', interest: match.because[0] });
  if (out.length < 2) for (const item of pool) push(item, { type: 'try' });
  return out;
}

export function questReason(reason) {
  if (reason.type === 'goal') return `It connects to your goal: ${reason.goal}`;
  if (reason.type === 'interest') return reason.interest === 'My community' ? 'You said you care about your community' : `You said you like ${reason.interest.toLowerCase()}`;
  return 'A good one to try if you’re not sure yet';
}

/**
 * Confirmed learner competencies come from a server contract that is not live
 * yet (docs: HANDOFF-SEARCH-DISCOVERY-BACKEND). The page renders whatever this
 * returns; the real app passes NOT_CONNECTED until that service exists.
 */
export const NOT_CONNECTED = Object.freeze({ status: 'not-connected', confirmed: [] });
export function normaliseCompetencyContext(ctx) {
  if (!ctx || ctx.status !== 'ready' || !Array.isArray(ctx.confirmed)) return NOT_CONNECTED;
  const confirmed = ctx.confirmed.filter((c) => c && competencyById(c.competencyId)).map((c) => ({ ...c, title: competencyById(c.competencyId).title }));
  return { status: 'ready', confirmed, sample: ctx.sample === true };
}
