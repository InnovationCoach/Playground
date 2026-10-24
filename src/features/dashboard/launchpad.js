/**
 * The Launchpad on My Dashboard: where each section lives, and turning what a
 * learner types or says ("open focus", "show my badges", "go to PBL",
 * "next") into one destination. Pure; tested in tests/launchpad.test.js.
 *
 * Commands are English only for now. The learner always sees what was heard
 * and where it is going, so a wrong match is one tap to undo.
 */
import { hrefFor } from '../../app/routes.js';

/** Look and words for every dashboard section (ids match dashboardModel WIDGETS). */
export const SECTION_LOOK = {
  today: { emoji: '✅', tone: '#5f9a00', words: ['today', 'checklist', 'to do', 'todo', 'tasks', 'daily'] },
  focus: { emoji: '🎧', tone: '#2f7fc1', words: ['focus', 'music', 'sounds', 'sound', 'timer', 'study', 'pomodoro', 'rain', 'ocean'] },
  progress: { emoji: '📈', tone: '#003c69', words: ['progress', 'stats', 'how am i doing', 'score'] },
  nextStep: { emoji: '👉', tone: '#c27a00', words: ['next step', 'what now', 'what should i do', 'what next'] },
  goals: { emoji: '🎯', tone: '#8250a0', words: ['my goals', 'goal', 'goals'] },
  journey: { emoji: '🗺️', tone: '#1d5a8f', words: ['journey', 'project journey', 'term project', 'where am i'] },
  checkin: { emoji: '💬', tone: '#ae266c', words: ['check in', 'checkin', 'mood', 'feeling', 'feelings', 'reflect', 'reflection'] },
  skill: { emoji: '🚀', tone: '#6e3f8b', words: ['skill', 'future skill', 'skill of the week'] },
  picked: { emoji: '✨', tone: '#c27a00', words: ['picked', 'for me', 'recommended', 'recommend', 'activities', 'activity', 'something to do'] },
  notes: { emoji: '📝', tone: '#4a6a00', words: ['notes', 'note', 'my notes', 'write'] },
  badges: { emoji: '🏅', tone: '#b07f00', words: ['badges', 'badge', 'awards', 'achievements', 'trophies'] },
  readiness: { emoji: '🎤', tone: '#003c69', words: ['showcase', 'readiness', 'ready', 'presentation'] }
};

/** Other places in the app a learner can ask for. */
export const PAGES = [
  { id: 'goal-setting', label: 'Goal setting', emoji: '🎯', href: () => hrefFor.goals(), words: ['goal setting', 'set a goal', 'new goal', 'goals page'] },
  { id: 'pbl', label: 'PBL Studio', emoji: '🛠️', href: () => hrefFor.pbl(), words: ['pbl', 'p b l', 'pbl studio', 'studio', 'project', 'my project'] },
  { id: 'programs', label: 'PBL programs', emoji: '📚', href: () => hrefFor.pbl('programs'), words: ['programs', 'program', 'program library'] },
  { id: 'portfolio', label: 'Evidence portfolio', emoji: '🗂️', href: () => hrefFor.pbl('portfolio'), words: ['portfolio', 'evidence'] },
  { id: 'courses', label: 'My Courses', emoji: '📖', href: () => hrefFor.courses(), words: ['courses', 'course', 'my courses', 'lessons'] },
  { id: 'future-skills', label: 'Future Skills', emoji: '🌱', href: () => hrefFor.futureSkills(), words: ['future skills', 'skills page'] },
  { id: 'community', label: 'Community', emoji: '👥', href: () => hrefFor.community(), words: ['community', 'friends', 'class feed'] },
  { id: 'search', label: 'Search for Programs', emoji: '🔎', href: () => hrefFor.homeSearch(), words: ['search', 'find'] },
  { id: 'home', label: 'Home', emoji: '🏠', href: () => hrefFor.spark(), words: ['home', 'home page', 'spark'] },
  { id: 'settings', label: 'Settings', emoji: '⚙️', href: () => hrefFor.settings(), words: ['settings', 'preferences', 'language', 'dark mode'] }
];

/** Things the Launchpad can do, checked before places. Longest phrase wins. */
const ACTIONS = [
  { action: 'focus-start', label: 'Start a focus block', words: ['start focus', 'start a focus', 'start timer', 'start the timer', 'focus mode', 'lets focus', "let's focus", 'start studying'] },
  { action: 'sound-play', label: 'Play focus sounds', words: ['play music', 'play sounds', 'play some music', 'music on', 'sounds on', 'play focus sounds'] },
  { action: 'sound-stop', label: 'Stop the sounds', words: ['stop music', 'stop sounds', 'stop the music', 'stop the sounds', 'music off', 'sounds off', 'quiet', 'silence', 'mute'] },
  { action: 'next', label: 'Next section', words: ['next', 'next one', 'forward', 'right', 'swipe left'] },
  { action: 'prev', label: 'Previous section', words: ['previous', 'back', 'go back', 'last one', 'left', 'swipe right'] },
  { action: 'grid', label: 'Show everything', words: ['show all', 'show everything', 'grid', 'all sections', 'overview'] },
  { action: 'slides', label: 'One section at a time', words: ['slides', 'slide view', 'one at a time'] }
];

const FILLER = /\b(please|can you|could you|i want to|i wanna|i'd like to|let me|take me to|bring me to|go to|goto|open up|open|show me|show|see|view|switch to|jump to|navigate to|my|the|a|an|page|section|tab|now|hey|ok|okay)\b/g;

export function normalise(text) {
  return String(text || '').toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

const strip = (t) => t.replace(FILLER, ' ').replace(/\s+/g, ' ').trim();

/** Whole-word (or whole-phrase) match, so "note" does not fire inside "notebook". */
const hasPhrase = (text, phrase) => new RegExp(`(^| )${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`).test(text);

/** Small typo tolerance for single words: "badgs", "focuss". */
function nearWord(a, b) {
  if (Math.abs(a.length - b.length) > 1 || b.length < 4) return false;
  let i = 0; let j = 0; let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i += 1; j += 1; continue; }
    edits += 1;
    if (edits > 1) return false;
    if (a.length > b.length) i += 1; else if (b.length > a.length) j += 1; else { i += 1; j += 1; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

function score(text, words) {
  let best = 0;
  for (const w of words) {
    if (hasPhrase(text, w)) best = Math.max(best, 10 + w.length);
    else if (!w.includes(' ') && text.split(' ').some((t) => nearWord(t, w))) best = Math.max(best, 5 + w.length);
  }
  return best;
}

/**
 * Every possible destination for `text`, best first:
 * { kind: 'action' | 'section' | 'page', id, label, emoji?, href?, score }.
 * `sections` is the list of dashboard section ids the learner has visible.
 */
export function rankCommands(text, sections, titles = {}) {
  const raw = normalise(text);
  if (!raw) return [];
  const plain = strip(raw) || raw;
  const out = [];
  for (const a of ACTIONS) {
    // Actions match on the raw words: "go back" must not lose "go" to the filler list.
    const s = Math.max(score(raw, a.words), score(plain, a.words));
    if (s) out.push({ kind: 'action', id: a.action, label: a.label, score: s + 2 });
  }
  for (const id of sections) {
    const look = SECTION_LOOK[id];
    if (!look) continue;
    const s = Math.max(score(raw, look.words), score(plain, look.words), score(raw, [normalise(titles[id] || '')].filter(Boolean)));
    if (s) out.push({ kind: 'section', id, label: titles[id] || id, emoji: look.emoji, score: s + 1 });
  }
  for (const p of PAGES) {
    const s = Math.max(score(raw, p.words), score(plain, p.words));
    if (s) out.push({ kind: 'page', id: p.id, label: p.label, emoji: p.emoji, href: p.href(), score: s });
  }
  return out.sort((a, b) => b.score - a.score);
}

export const matchCommand = (text, sections, titles) => rankCommands(text, sections, titles)[0] || null;

/** Wraps around, so "next" on the last section goes to the first. */
export function step(order, current, dir) {
  if (!order.length) return null;
  const i = order.indexOf(current);
  return order[((i < 0 ? 0 : i) + dir + order.length) % order.length];
}
