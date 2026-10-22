/**
 * My Dashboard: the learner's own home screen. Pure functions only, so the
 * rules are unit-tested (tests/my-dashboard.test.js) without React or Firestore.
 *
 * Every number on the dashboard comes from something the learner did, saved
 * by the platform in one of three places: the Goals page (goalPlan, see
 * features/goals/goalPlan.js), the PBL term project (pblProject.js) and the
 * STEAM activities' own saved records. A bar only moves on real work, and
 * nothing is invented to fill one.
 */
import { PHASES, TERM, INTERESTS } from '../pbl/content/pblModel.js';
import { readiness, hydrateProject } from '../pbl/engine/pblProject.js';
import { ACTIVITY_NAV } from '../activities/activityHost.js';
import { hydratePlan, hasPlan, todayItems, checkedToday, habitWeek } from '../goals/goalPlan.js';
import { SKILLS } from '../futureSkills/content.js';

export const DAY_MS = 86400000;
const pct = (done, total) => (total ? Math.round((100 * done) / total) : 0);
const part = (done, total) => ({ done, total, percent: pct(done, total) });

/* ------------------------------------------------------------------ widgets */

export const WIDGETS = [
  { id: 'progress', title: 'Your progress', hint: 'Academic study and your PBL work', wide: true },
  { id: 'today', title: 'Today', hint: 'Your daily checklist from Goal setting' },
  { id: 'nextStep', title: 'Your next step', hint: 'The one thing that moves you forward' },
  { id: 'goals', title: 'My goals', hint: 'Big goals, their steps and your daily habit' },
  { id: 'journey', title: 'Project journey', hint: 'Where you are in the term project', wide: true },
  { id: 'checkin', title: 'Check-in and reflection', hint: 'How today feels, and a prompt to think about' },
  { id: 'skill', title: 'Future skill of the week', hint: 'One skill to notice and practise this week' },
  { id: 'picked', title: 'Picked for you', hint: 'Activities that match your interests' },
  { id: 'notes', title: 'My notes', hint: 'Quick notes on what you learned' },
  { id: 'badges', title: 'Badges', hint: 'Milestones you have reached' },
  { id: 'readiness', title: 'Showcase readiness', hint: 'What your showcase still needs' }
];
const WIDGET_IDS = WIDGETS.map((w) => w.id);

export const ACCENTS = [
  { id: 'purple', label: 'Purple', value: '#8250a0' },
  { id: 'green', label: 'Green', value: '#5d8f00' },
  { id: 'navy', label: 'Navy', value: '#1d5a8f' },
  { id: 'magenta', label: 'Magenta', value: '#ae266c' }
];

export const COVERS = [
  { id: 'aurora', label: 'Aurora', css: 'linear-gradient(135deg, #003c69 0%, #3b2a6b 60%, #8250a0 100%)' },
  { id: 'meadow', label: 'Meadow', css: 'linear-gradient(135deg, #2f5d1a 0%, #5d8f00 60%, #96d700 100%)' },
  { id: 'sunrise', label: 'Sunrise', css: 'linear-gradient(135deg, #ae266c 0%, #8250a0 55%, #ceaaee 100%)' },
  { id: 'ocean', label: 'Ocean', css: 'linear-gradient(135deg, #003c69 0%, #1d5a8f 55%, #9bd2ff 100%)' }
];

export const MAX_INTERESTS = 6;
export const MAX_TAGLINE = 60;

export const DEFAULT_PREFS = {
  order: WIDGET_IDS,
  hidden: [],
  accent: 'purple',
  cover: 'aurora',
  tagline: '',
  interests: [],
  calm: false,
  updatedAt: 0
};

/** Whatever came back from storage, return well-formed preferences. */
export function hydratePrefs(stored) {
  const s = stored && typeof stored === 'object' ? stored : {};
  const known = Array.isArray(s.order) ? s.order.filter((id) => WIDGET_IDS.includes(id)) : [];
  return {
    // Widgets added after a learner last saved keep their default place at the end.
    order: [...new Set([...known, ...WIDGET_IDS])],
    hidden: Array.isArray(s.hidden) ? [...new Set(s.hidden.filter((id) => WIDGET_IDS.includes(id)))] : [],
    accent: ACCENTS.some((a) => a.id === s.accent) ? s.accent : DEFAULT_PREFS.accent,
    cover: COVERS.some((c) => c.id === s.cover) ? s.cover : DEFAULT_PREFS.cover,
    tagline: typeof s.tagline === 'string' ? s.tagline.slice(0, MAX_TAGLINE) : '',
    interests: Array.isArray(s.interests)
      ? [...new Set(s.interests.filter((i) => INTERESTS.includes(i)))].slice(0, MAX_INTERESTS)
      : [],
    calm: s.calm === true,
    updatedAt: Number.isFinite(s.updatedAt) ? s.updatedAt : 0
  };
}

export function toggleHidden(prefs, id) {
  const hidden = prefs.hidden.includes(id) ? prefs.hidden.filter((h) => h !== id) : [...prefs.hidden, id];
  return { ...prefs, hidden };
}

/** Move one widget up (-1) or down (+1). Edges are a no-op, not an error. */
export function moveWidget(prefs, id, step) {
  const from = prefs.order.indexOf(id);
  const to = from + step;
  if (from < 0 || to < 0 || to >= prefs.order.length) return prefs;
  const order = [...prefs.order];
  [order[from], order[to]] = [order[to], order[from]];
  return { ...prefs, order };
}

export function toggleInterest(prefs, label) {
  if (prefs.interests.includes(label)) return { ...prefs, interests: prefs.interests.filter((i) => i !== label) };
  if (prefs.interests.length >= MAX_INTERESTS) return prefs;
  return { ...prefs, interests: [...prefs.interests, label] };
}

/* ----------------------------------------------------------- saved records */

/**
 * The STEAM activities whose saved progress is keyed by learner, so it can be
 * read here. SO₂ is left out: its saved state is per device, not per learner,
 * and on a shared device it would show another child's work.
 */
export const TRACKED_ACTIVITIES = [
  { id: 'solar', label: 'Solar Car' },
  { id: 'plants', label: 'Plant Microscope Lab' },
  { id: 'hexgrid', label: 'Project Hex-Grid' }
];

const ACTIVITY_KEYS = {
  solar: (uid) => `hearisland.solarCar.build.v1:${uid}`,
  plants: (uid) => `hearisland.plantLab.v1:${uid}`,
  hexgrid: (uid) => `hearisland.hexGrid.v1:${uid}`
};

export const STORAGE_KEYS = {
  goals: (uid) => `goalPlan_${uid}`,
  project: (uid) => `hearisland.pbl.v1:${uid}:${TERM.id}`,
  visits: (uid) => `hearisland.dashboard.visits.v1:${uid}`,
  mood: (uid) => `hearisland.dashboard.mood.v1:${uid}`,
  prefs: (uid) => `hearisland.dashboard.prefs.v1:${uid}`
};

export const CLOUD_PREFS_PATH = (uid) => `${uid}/activityProgress/dashboard-prefs`;
export const CLOUD_PBL_PATH = (uid) => `${uid}/activityProgress/pbl-${TERM.id}`;

/** Local calendar day as YYYY-MM-DD. Days are kept local so a streak follows the child's clock. */
export function dayKey(date) {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

function hasRecord(value) {
  return Boolean(value) && typeof value === 'object' && Object.keys(value).length > 0;
}

/**
 * The learner's goal plan from the Goals page, summarised, or null when they
 * have not set one. A big goal counts as one unit per step (at least one), and
 * a goal marked "I did it" counts in full, so finishing steps and finishing
 * goals both move the bar.
 */
export function goalSummary(plan, now = new Date()) {
  if (!plan || !hasPlan(plan)) return null;
  const day = dayKey(now);
  const items = plan.goals.map((g) => {
    const stepsDone = g.steps.filter((st) => st.done).length;
    return {
      id: g.id, text: g.explore, done: g.done, stepsDone, stepsTotal: g.steps.length,
      nextStep: g.done ? null : (g.steps.find((st) => !st.done)?.text || null)
    };
  });
  let done = 0;
  let total = 0;
  for (const g of items) {
    const units = Math.max(1, g.stepsTotal);
    total += units;
    done += g.done ? units : Math.min(g.stepsDone, units);
  }
  const habit = plan.focus ? habitWeek(plan, now) : null;
  const list = todayItems(plan, day);
  const ticked = checkedToday(plan, day);
  const open = items.find((g) => !g.done);
  return {
    items,
    ...part(done, total),
    achieved: items.filter((g) => g.done).length,
    goalsTotal: items.length,
    stepsDone: items.reduce((n, g) => n + g.stepsDone, 0),
    habit,
    focusHabit: plan.focus?.habit || '',
    today: { done: list.filter((i) => ticked.has(i.id)).length, total: list.length },
    next: open ? { text: open.nextStep || `Add a first small step to "${open.text}"`, goal: open.text } : null
  };
}

/** Consecutive days visited, counting today, or yesterday if today has not started yet. */
export function streakDays(visits, today) {
  const seen = new Set(visits);
  const [y, m, d] = today.split('-').map(Number);
  const cursor = new Date(y, m - 1, d);
  if (!seen.has(today)) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (seen.has(dayKey(cursor))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export function recordVisit(visits, day) {
  return [...new Set([...visits, day])].sort().slice(-60);
}

/**
 * Everything the dashboard reads from this device, in one object. Storage is
 * passed in so the tests can hand it a fake.
 */
export function loadSignals(uid, storage, now = new Date()) {
  const read = (key) => {
    try {
      const raw = storage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };
  const today = dayKey(now);
  const mood = read(STORAGE_KEYS.mood(uid));
  const visits = read(STORAGE_KEYS.visits(uid));
  return {
    today,
    started: TRACKED_ACTIVITIES.filter((a) => hasRecord(read(ACTIVITY_KEYS[a.id](uid)))).map((a) => a.id),
    goals: goalSummary(hydratePlan(read(STORAGE_KEYS.goals(uid))), now),
    project: hydrateProject(read(STORAGE_KEYS.project(uid)), TERM.id),
    visits: Array.isArray(visits) ? visits.filter((v) => typeof v === 'string') : [],
    mood: mood && mood.day === today && MOODS.some((m) => m.id === mood.mood) ? mood.mood : null
  };
}

/* ---------------------------------------------------------------- progress */

export function academicProgress(signals) {
  const items = TRACKED_ACTIVITIES.map((a) => ({ ...a, started: signals.started.includes(a.id) }));
  const done = items.filter((i) => i.started).length;
  return { ...part(done, items.length), items };
}

/**
 * PBL progress is the average of whichever parts exist: goal steps and goals
 * from Goal setting (only once set), the daily habit this week (only once a
 * focus skill is chosen), STEAM activities explored, Design Thinking tasks
 * ticked, and showcase readiness checks passed. A part the learner has not
 * started yet is left out rather than counted as zero.
 */
export function projectProgress(project, goals, started = []) {
  const ready = readiness(project);
  const tasksTotal = PHASES.reduce((n, p) => n + p.tasks.length, 0);
  const tasksDone = PHASES.reduce((n, p) => n + (project.tasksDone[p.id] || []).length, 0);
  const goalPart = goals ? part(goals.done, goals.total) : null;
  const habitPart = goals?.habit && goals.habit.target
    ? part(Math.min(goals.habit.count, goals.habit.target), goals.habit.target) : null;
  const activities = part(started.length, TRACKED_ACTIVITIES.length);
  const tasks = part(tasksDone, tasksTotal);
  const readyPart = part(ready.done, ready.total);
  const parts = [goalPart, habitPart, activities, tasks, readyPart].filter(Boolean);
  return {
    overall: pct(parts.reduce((s, p) => s + p.percent, 0), parts.length * 100),
    goals: goalPart,
    habit: habitPart,
    activities,
    tasks,
    readiness: readyPart,
    checks: ready.checks,
    evidence: project.evidence.length
  };
}

/* ---------------------------------------------------------- XP and badges */

export const XP = { activity: 40, goal: 15, achieved: 30, habit: 5, task: 5, evidence: 10, check: 10 };

export function xpSummary({ started, goals, project, readyDone }) {
  const tasksDone = PHASES.reduce((n, p) => n + (project.tasksDone[p.id] || []).length, 0);
  const xp = started.length * XP.activity
    + (goals?.stepsDone || 0) * XP.goal
    + (goals?.achieved || 0) * XP.achieved
    + (goals?.habit?.count || 0) * XP.habit
    + tasksDone * XP.task
    + project.evidence.length * XP.evidence
    + readyDone * XP.check;
  return { xp, level: Math.floor(xp / 100) + 1, intoLevel: xp % 100 };
}

export const BADGES = [
  { id: 'first-steps', label: 'First steps', hint: 'Start any STEAM activity', earned: (c) => c.started.length >= 1 },
  { id: 'lab-explorer', label: 'Lab explorer', hint: 'Start the Plant Microscope Lab', earned: (c) => c.started.includes('plants') },
  { id: 'engineer', label: 'Engineer', hint: 'Start the Solar Car challenge', earned: (c) => c.started.includes('solar') },
  { id: 'city-builder', label: 'City builder', hint: 'Start Project Hex-Grid', earned: (c) => c.started.includes('hexgrid') },
  { id: 'full-explorer', label: 'Full explorer', hint: 'Start every tracked activity', earned: (c) => c.started.length === TRACKED_ACTIVITIES.length },
  { id: 'goal-setter', label: 'Goal setter', hint: 'Set a big goal or a focus skill', earned: (c) => Boolean(c.goals) },
  { id: 'first-step', label: 'First step', hint: 'Tick off a step towards a big goal', earned: (c) => (c.goals?.stepsDone || 0) >= 1 },
  { id: 'goal-getter', label: 'Goal getter', hint: 'Finish one of your big goals', earned: (c) => (c.goals?.achieved || 0) >= 1 },
  { id: 'habit-hero', label: 'Habit hero', hint: 'Do your daily habit 5 days in one week', earned: (c) => (c.goals?.habit?.count || 0) >= 5 },
  { id: 'problem-finder', label: 'Problem finder', hint: 'Write your How-might-we problem', earned: (c) => c.project.problem.hmw.trim().length >= 15 },
  { id: 'collector', label: 'Evidence collector', hint: 'Add three pieces of evidence', earned: (c) => c.project.evidence.length >= 3 },
  { id: 'ai-keeper', label: 'AI log keeper', hint: 'Log what you asked AI and what you kept', earned: (c) => c.project.evidence.some((e) => e.kind === 'ai') },
  { id: 'on-a-roll', label: 'On a roll', hint: 'Visit three days in a row', earned: (c) => c.streak >= 3 }
];

export function badgeStatus(context) {
  return BADGES.map((b) => ({ id: b.id, label: b.label, hint: b.hint, earned: Boolean(b.earned(context)) }));
}

/* ---------------------------------------------------- next step and check-in */

/**
 * The single most useful thing to do next, in the order a learner should meet
 * it. `target` is a plain description; the page turns it into a link or action.
 */
export function nextStep({ started, goals, project }) {
  if (goals?.next) {
    return {
      id: 'goal',
      title: goals.next.text,
      body: `A step towards your goal: ${goals.next.goal}. Tick it off on Goal setting when it is done.`,
      cta: 'Open my goals',
      target: { type: 'goals' }
    };
  }
  if (project.problem.hmw.trim().length < 15) {
    return {
      id: 'problem',
      title: 'Write your How-might-we problem',
      body: 'Choose a problem inside the theme that affects people or the environment.',
      cta: 'Open my project',
      target: { type: 'pbl', tab: 'project' }
    };
  }
  if (!goals) {
    return {
      id: 'set-goals',
      title: 'Set your first big goal',
      body: 'Pick something you want to explore and a few small steps. This dashboard counts every step you finish.',
      cta: 'Open Goal setting',
      target: { type: 'goals' }
    };
  }
  const untried = TRACKED_ACTIVITIES.find((a) => !started.includes(a.id));
  if (untried) {
    return {
      id: 'try',
      title: `Try ${untried.label}`,
      body: 'A STEAM activity counts toward your Explore phase.',
      cta: 'Open activity',
      target: { type: 'activity', id: untried.id }
    };
  }
  if (project.evidence.length < 3) {
    return {
      id: 'evidence',
      title: 'Add a piece of evidence',
      body: 'A note, a link, a test result or an AI log all count.',
      cta: 'Open portfolio',
      target: { type: 'pbl', tab: 'portfolio' }
    };
  }
  return {
    id: 'reflect',
    title: 'Write a reflection',
    body: 'Name one thing you learned and one thing you would change.',
    cta: 'Open portfolio',
    target: { type: 'pbl', tab: 'portfolio' }
  };
}

export const MOODS = [
  { id: 'energised', label: 'Energised', tip: 'Use the energy: push one step further on your project today.' },
  { id: 'steady', label: 'Steady', tip: 'Steady is a good place to build from. Finish one small task.' },
  { id: 'unsure', label: 'Not sure', tip: 'Being unsure is part of Design Thinking. Write down the one question you cannot answer yet.' },
  { id: 'stuck', label: 'Stuck', tip: 'Stuck is part of the process. Try a quick activity to reset, or ask your coach.' }
];

export const REFLECTIONS = [
  'What surprised you today?',
  'What would you do differently next time?',
  'Which skill do you want to get better at this week?',
  'Who could you ask for feedback, and what would you ask them?',
  'What is one thing you are proud of so far?',
  'What is the smallest next step you could finish before tomorrow?'
];

/** One prompt per day, the same all day, so it can be thought about rather than skipped. */
export function reflectionPrompt(day) {
  const seed = [...String(day)].reduce((n, ch) => n + ch.charCodeAt(0), 0);
  return REFLECTIONS[seed % REFLECTIONS.length];
}

/* ------------------------------------------------------------- interests */

const INTEREST_WORDS = {
  'Sport and fitness': 'sport fitness body health',
  Music: 'music sound',
  Games: 'game play coding',
  Animals: 'animal plant biology',
  Food: 'food water waste',
  Fashion: 'fashion textile design',
  Health: 'health body safety',
  Environment: 'environment climate energy waste',
  Transport: 'transport car vehicle solar',
  'Art and design': 'design art model build',
  Space: 'space solar sun',
  Robots: 'robot coding microbit engineering',
  Water: 'water flood coastal sea',
  'My community': 'city community bangkok'
};

/** Activities whose keywords match a chosen interest, with the interests that matched. */
export function matchActivities(interests) {
  const found = new Map();
  for (const a of ACTIVITY_NAV) {
    if (a.id === 'home') continue;
    const hay = `${a.keywords || ''} ${a.description || ''}`.toLowerCase();
    const matched = interests.filter((i) => (INTEREST_WORDS[i] || '').split(' ').some((w) => hay.includes(w)));
    if (matched.length) found.set(a.id, { id: a.id, label: a.label, description: a.description || '', because: matched });
  }
  return [...found.values()];
}

/* ------------------------------------------------------ future skill */

/** One Future Skill per week of the year, the same all week. */
export function skillOfTheWeek(now = new Date()) {
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.floor((now - start) / (7 * DAY_MS));
  return SKILLS[week % SKILLS.length];
}
