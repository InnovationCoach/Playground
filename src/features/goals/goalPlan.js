/**
 * A learner's goal plan: pure functions over one plain object, unit-tested in
 * tests/goal-plan.test.js.
 *
 * Strength-based, written with twice-exceptional (2e) learners in mind:
 *   - big goals pair something the learner wants to explore with how they will
 *     show it and what helps them (dual-goal objectives);
 *   - one executive-function skill at a time, practised as a tiny daily habit;
 *   - strengths, supports and "what I can say" phrases for self-advocacy;
 *   - a recharge plan built from activities that put them in flow.
 *
 * It never asks for a diagnosis, an IEP/504 or any medical detail: those
 * belong with the school team, not in a learner-editable record that coaches
 * can read.
 *
 * Stored on users/{uid} as `goalPlan` (owner-writable, coach-readable under
 * the existing rules). Each big goal and the focus skill are also mirrored to
 * users/{uid}/goals/{id}, which is what the coach dashboard lists.
 */

export const LIMITS = { goals: 3, steps: 5, text: 160, own: 200, days: 21 };

export const STRENGTHS = [
  { id: 'big-picture', label: 'Seeing the big picture' },
  { id: 'deep-questions', label: 'Asking deep questions' },
  { id: 'creative', label: 'Coming up with creative ideas' },
  { id: 'building', label: 'Building and making things' },
  { id: 'patterns', label: 'Spotting patterns' },
  { id: 'talking', label: 'Explaining ideas out loud' },
  { id: 'art', label: 'Art and design' },
  { id: 'tech', label: 'Coding and technology' },
  { id: 'expert', label: 'Knowing a lot about things I love' },
  { id: 'persistence', label: 'Sticking with things I care about' },
  { id: 'empathy', label: 'Understanding how others feel' },
  { id: 'humour', label: 'Humour' }
];

export const SUPPORTS = [
  { id: 'small-steps', label: 'Breaking work into small steps' },
  { id: 'checklist', label: 'A visual checklist' },
  { id: 'timer', label: 'A timer or time blocks' },
  { id: 'quiet', label: 'A quiet place to work' },
  { id: 'movement', label: 'Movement breaks' },
  { id: 'say-it', label: 'Saying my answer instead of writing it' },
  { id: 'typing', label: 'Typing instead of handwriting' },
  { id: 'read-aloud', label: 'Hearing text read aloud' },
  { id: 'extra-time', label: 'Extra time' },
  { id: 'headphones', label: 'Headphones' },
  { id: 'example', label: 'Seeing a finished example first' },
  { id: 'check-ins', label: 'Short check-ins with my coach' },
  { id: 'harder', label: 'A harder version when I already get it' }
];

/** Ways to show learning, so output never has to mean a long written essay. */
export const SHOW_HOW = [
  { id: 'slides', label: 'A slide deck' },
  { id: 'talk', label: 'A talk or discussion' },
  { id: 'model', label: 'A model or prototype' },
  { id: 'video', label: 'A video' },
  { id: 'diagram', label: 'A drawing or diagram' },
  { id: 'code', label: 'Code or an app' },
  { id: 'poster', label: 'A poster' },
  { id: 'writing', label: 'A short piece of writing' }
];

/** Executive-function skills. The learner works on one at a time. */
export const FOCUS_SKILLS = [
  { id: 'starting', label: 'Getting started on tasks',
    habits: ['Set a 5-minute timer and just begin', 'Write the first tiny step before I start', 'Start with the easiest part'] },
  { id: 'planning', label: 'Planning my day',
    habits: ['Pick my top 3 tasks each morning', 'Check my planner before class', 'Put each task in a time slot'] },
  { id: 'time', label: 'Keeping track of time',
    habits: ['Use a visual timer for each task', 'Guess how long a task takes, then check', 'Set an alarm 10 minutes before I need to stop'] },
  { id: 'organised', label: 'Keeping my things organised',
    habits: ['Pack my bag and chargers the night before', 'Put everything back in my launch pad spot', 'Clear my desk for 2 minutes at the end of the day'] },
  { id: 'finishing', label: 'Finishing what I start',
    habits: ['Finish one small step before switching', 'Tick off each step as I finish it', 'Save and name my work before I stop'] },
  { id: 'remembering', label: 'Remembering what is due',
    habits: ['Write every due date in one place', 'Check what is due on Mondays and Thursdays', 'Set a reminder the day before'] },
  { id: 'asking', label: 'Asking for help early',
    habits: ['Ask one question when I first get stuck', 'Tell my coach what helps me this week', 'Use one of my "what I can say" phrases'] }
];

export const PHRASES = [
  { id: 'say-it', text: 'Could I explain my answer out loud instead of writing it all?' },
  { id: 'break', text: 'I need a 5-minute brain break, then I will come back to this.' },
  { id: 'steps', text: 'Could you help me break this into smaller steps?' },
  { id: 'example', text: 'Can I see an example of a finished one?' },
  { id: 'quiet', text: 'I work better somewhere quieter. Can I move?' },
  { id: 'harder', text: 'I already understand this part. Could I try a harder version?' },
  { id: 'time', text: 'Could I have a bit more time to finish this well?' }
];

/** Things that put a learner in flow and help them recover after a hard day. */
export const RECHARGE = [
  { id: 'building', label: 'Building or robotics' },
  { id: 'drawing', label: 'Drawing or art' },
  { id: 'music', label: 'Music' },
  { id: 'puzzles', label: 'Chess or puzzles' },
  { id: 'stories', label: 'Writing or reading stories' },
  { id: 'coding', label: 'Coding for fun' },
  { id: 'sport', label: 'Sport or movement' },
  { id: 'outside', label: 'Time outside' },
  { id: 'quiet', label: 'Quiet time on my own' }
];

const ids = (list) => new Set(list.map((x) => x.id));
const STRENGTH_IDS = ids(STRENGTHS);
const SUPPORT_IDS = ids(SUPPORTS);
const SHOW_IDS = ids(SHOW_HOW);
const SKILL_IDS = ids(FOCUS_SKILLS);
const PHRASE_IDS = ids(PHRASES);
const RECHARGE_IDS = ids(RECHARGE);

const str = (v, max) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const pick = (v, allowed) => [...new Set(Array.isArray(v) ? v.filter((x) => allowed.has(x)) : [])];
const isDay = (k) => /^\d{4}-\d{2}-\d{2}$/.test(k);

/** Local calendar day, so "today" turns over at the learner's midnight. */
export function dayKey(date = new Date()) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function newPlan() {
  return {
    version: 2, strengths: [], strengthsOwn: '', supports: [], supportsOwn: '',
    phrases: [], phraseOwn: '', goals: [], focus: null, recharge: [], days: {}, updatedAt: null
  };
}

let seq = 0;
export const newId = (prefix) => `${prefix}_${Date.now().toString(36)}${(seq++).toString(36)}`;

function cleanGoal(g) {
  if (!g || typeof g !== 'object') return null;
  const explore = str(g.explore, LIMITS.text);
  if (!explore) return null;
  const steps = (Array.isArray(g.steps) ? g.steps : []).map((s) => (s && typeof s === 'object' ? {
    id: str(s.id, 40) || newId('s'), text: str(s.text, LIMITS.text), done: s.done === true
  } : null)).filter((s) => s && s.text).slice(0, LIMITS.steps);
  return {
    id: str(g.id, 40) || newId('g'),
    explore,
    showHow: SHOW_IDS.has(g.showHow) ? g.showHow : null,
    supports: pick(g.supports, SUPPORT_IDS),
    steps,
    done: g.done === true,
    createdAt: Number.isFinite(g.createdAt) ? g.createdAt : Date.now()
  };
}

/** Whatever came back from storage, return a well-formed plan. */
export function hydratePlan(stored) {
  const base = newPlan();
  if (!stored || typeof stored !== 'object') return base;
  const focus = stored.focus && SKILL_IDS.has(stored.focus.skill) ? {
    skill: stored.focus.skill,
    habit: str(stored.focus.habit, LIMITS.text),
    daysPerWeek: Math.min(7, Math.max(1, Math.round(Number(stored.focus.daysPerWeek) || 5)))
  } : null;
  const days = {};
  if (stored.days && typeof stored.days === 'object') {
    for (const k of Object.keys(stored.days).filter(isDay).sort().slice(-LIMITS.days)) {
      const v = stored.days[k];
      if (Array.isArray(v)) days[k] = [...new Set(v.filter((x) => typeof x === 'string').map((x) => x.slice(0, 80)))];
    }
  }
  return {
    ...base,
    strengths: pick(stored.strengths, STRENGTH_IDS),
    strengthsOwn: str(stored.strengthsOwn, LIMITS.own),
    supports: pick(stored.supports, SUPPORT_IDS),
    supportsOwn: str(stored.supportsOwn, LIMITS.own),
    phrases: pick(stored.phrases, PHRASE_IDS),
    phraseOwn: str(stored.phraseOwn, LIMITS.own),
    goals: (Array.isArray(stored.goals) ? stored.goals : []).map(cleanGoal).filter(Boolean).slice(0, LIMITS.goals),
    focus,
    recharge: pick(stored.recharge, RECHARGE_IDS),
    days,
    updatedAt: Number.isFinite(stored.updatedAt) ? stored.updatedAt : null
  };
}

/**
 * The old wizard saved { learningPath, topic, goals: [string], completedGoals: [index] }.
 * Its goals become big goals (what to explore), finished ones marked done.
 */
export function migrateLegacy(legacy) {
  const plan = newPlan();
  const list = Array.isArray(legacy?.goals) ? legacy.goals : [];
  const done = new Set((legacy?.completedGoals || []).map(String));
  plan.goals = list.map((g, i) => cleanGoal({
    explore: typeof g === 'string' ? g : g?.title || g?.text,
    done: done.has(String(i))
  })).filter(Boolean).slice(0, LIMITS.goals);
  return plan;
}

export const touch = (plan, patch, now = Date.now()) => ({ ...plan, ...patch, updatedAt: now });

export const hasPlan = (plan) => plan.goals.length > 0 || !!plan.focus;

const labelOf = (list, id) => list.find((x) => x.id === id)?.label || '';

/** "I will explore X and show it as a slide deck, with small steps and a timer helping me." */
export function goalSentence(goal) {
  let s = `I will explore ${goal.explore}`;
  if (goal.showHow) s += ` and show what I learn as ${labelOf(SHOW_HOW, goal.showHow).toLowerCase()}`;
  if (goal.supports.length) {
    const helps = goal.supports.map((id) => labelOf(SUPPORTS, id).toLowerCase());
    const joined = helps.length > 1 ? `${helps.slice(0, -1).join(', ')} and ${helps.at(-1)}` : helps[0];
    s += `, with ${joined} helping me`;
  }
  return `${s}.`;
}

/**
 * Today's checklist: the focus habit, the next unfinished step of each open
 * goal, and a recharge break. Small on purpose - at most five items. A step
 * ticked today stays on today's list (ticked); the next one shows tomorrow.
 */
export function todayItems(plan, day = dayKey()) {
  const items = [];
  const ticked = new Set(plan.days[day] || []);
  if (plan.focus?.habit) items.push({ id: 'habit', kind: 'habit', text: plan.focus.habit });
  for (const g of plan.goals) {
    if (g.done) continue;
    const next = g.steps.find((s) => ticked.has(`step:${g.id}:${s.id}`)) || g.steps.find((s) => !s.done);
    if (next) items.push({ id: `step:${g.id}:${next.id}`, kind: 'step', text: next.text, goal: g.explore, goalId: g.id, stepId: next.id });
  }
  if (plan.recharge.length) {
    items.push({ id: 'recharge', kind: 'recharge', text: `Recharge break: ${labelOf(RECHARGE, plan.recharge[0]).toLowerCase()}` });
  }
  return items.slice(0, 5);
}

export function checkedToday(plan, day = dayKey()) {
  return new Set(plan.days[day] || []);
}

/**
 * Tick or untick a today item. Ticking a goal step also marks that step done,
 * so tomorrow shows the next one; unticking the same day undoes it.
 */
export function toggleToday(plan, item, day = dayKey(), now = Date.now()) {
  const set = checkedToday(plan, day);
  const on = !set.has(item.id);
  if (on) set.add(item.id); else set.delete(item.id);
  const days = { ...plan.days, [day]: [...set] };
  const trimmed = Object.fromEntries(Object.keys(days).filter(isDay).sort().slice(-LIMITS.days).map((k) => [k, days[k]]));
  let goals = plan.goals;
  if (item.kind === 'step') {
    goals = plan.goals.map((g) => (g.id !== item.goalId ? g : {
      ...g, steps: g.steps.map((s) => (s.id === item.stepId ? { ...s, done: on } : s))
    }));
  }
  return touch(plan, { days: trimmed, goals }, now);
}

/** The last 7 days (oldest first) and whether the focus habit was done on each. */
export function habitWeek(plan, today = new Date()) {
  const out = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    out.push({ day: key, done: (plan.days[key] || []).includes('habit') });
  }
  return { days: out, count: out.filter((d) => d.done).length, target: plan.focus?.daysPerWeek || 0 };
}

/** One users/{uid}/goals document per big goal and for the focus skill, for the coach dashboard. */
export function coachGoalDocs(plan, now = Date.now()) {
  const docs = plan.goals.map((g) => {
    const total = g.steps.length;
    const done = g.steps.filter((s) => s.done).length;
    return {
      goalId: `plan_${g.id}`,
      title: g.explore,
      summary: goalSentence(g),
      kind: 'big-goal',
      status: g.done ? 'achieved' : 'on_track',
      completed: g.done,
      progress: g.done ? 1 : (total ? Math.round((done / total) * 100) / 100 : 0),
      createdAt: g.createdAt,
      updatedAt: now,
      source: 'goals-page'
    };
  });
  if (plan.focus) {
    const wk = habitWeek(plan);
    docs.push({
      goalId: 'plan_focus',
      title: `Focus skill: ${labelOf(FOCUS_SKILLS, plan.focus.skill)}`,
      summary: plan.focus.habit ? `Daily habit: ${plan.focus.habit} (${plan.focus.daysPerWeek} days a week)` : '',
      kind: 'focus-skill',
      status: 'on_track',
      completed: false,
      daysThisWeek: wk.count,
      progress: wk.target ? Math.min(1, Math.round((wk.count / wk.target) * 100) / 100) : 0,
      createdAt: now,
      updatedAt: now,
      source: 'goals-page'
    });
  }
  return docs;
}
