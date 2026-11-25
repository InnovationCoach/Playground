/**
 * A learner's goal plan: pure functions over one plain object, unit-tested in
 * tests/goal-plan.test.js.
 *
 * Strength-based, written with twice-exceptional (2e) learners in mind:
 *   - big goals pair something the learner wants to explore with how they will
 *     show it and what helps them (dual-goal objectives);
 *   - supports Academic Goals, Project-Based Learning (PBL) Goals, Personal
 *     Development, and Skills Development categories with target dates,
 *     measurable outcomes, subjects/projects, and daily/weekly action steps;
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

export const LIMITS = { goals: 3, maxGoals: 12, steps: 8, text: 160, outcome: 240, own: 200, days: 21 };

export const GOAL_CATEGORIES = [
  {
    id: 'academic',
    label: 'Academic Goals',
    shortLabel: 'Academic',
    description: 'Subject targets, grades, assignments, exams, and graduation milestones.',
    subtypes: [
      { id: 'subject-goal', label: 'Subject-specific goal' },
      { id: 'performance-target', label: 'Academic performance target' },
      { id: 'assignment-exam', label: 'Assignment & examination target' },
      { id: 'short-term-learning', label: 'Short-term learning objective' },
      { id: 'graduation-target', label: 'Graduation target & date' }
    ]
  },
  {
    id: 'pbl',
    label: 'Project-Based Learning (PBL)',
    shortLabel: 'PBL',
    description: 'Project objectives, milestones, research, teamwork, and deliverables.',
    subtypes: [
      { id: 'project-objective', label: 'Project objective' },
      { id: 'project-milestone', label: 'Project milestone' },
      { id: 'research-target', label: 'Research target' },
      { id: 'teamwork-objective', label: 'Teamwork objective' },
      { id: 'deliverable-deadline', label: 'Deliverable & deadline' }
    ]
  },
  {
    id: 'skills',
    label: 'Skills Development',
    shortLabel: 'Skills',
    description: 'Future skills, coding, maker tools, design, and communication.',
    subtypes: [
      { id: 'technical-skill', label: 'Technical or maker skill' },
      { id: 'communication-skill', label: 'Communication & presentation' },
      { id: 'critical-thinking', label: 'Critical thinking & problem solving' }
    ]
  },
  {
    id: 'personal',
    label: 'Personal Development',
    shortLabel: 'Personal',
    description: 'Wellbeing, self-advocacy, executive habits, and personal growth.',
    subtypes: [
      { id: 'executive-habit', label: 'Organization & time management' },
      { id: 'self-advocacy', label: 'Self-advocacy & confidence' },
      { id: 'wellbeing-growth', label: 'Wellbeing & creative balance' }
    ]
  }
];

/**
 * Goal tracks (from main's Teen Quest work), aligned with the Coach/School
 * Workspace domains (academic, pbl, steam). Categories above stay the stored
 * model; a track is an alias kept in step with the category via
 * TRACK_TO_CATEGORY / CATEGORY_TO_TRACK, so goals saved on live (category only)
 * and goals saved with a track (no category) both read correctly.
 */
export const GOAL_TRACKS = [
  {
    id: 'academic',
    label: 'Academy / Academic',
    shortLabel: 'Academy',
    description: 'Core subjects, Edmentum mastery, study habits & academic growth',
    placeholder: 'e.g. master quadratic equations, finish Unit 4 in Science, strengthen essay structure',
    subjects: ['Mathematics', 'Science', 'English & Writing', 'Edmentum Course', 'Languages', 'Humanities', 'Study Mastery'],
    ideas: ['Finish my next Edmentum unit with 85%+', 'Master fractions and algebra equations', 'Write a clear persuasive essay outline']
  },
  {
    id: 'pbl',
    label: 'PBL Studio',
    shortLabel: 'PBL',
    description: 'Project-Based Learning missions, prototypes, research & real-world impact',
    placeholder: 'e.g. design a cooling plan for Townsville, build a working solar car prototype',
    subjects: ['Urban Heat Battle', 'Solar Car', 'Bio-Inspired Robotics', 'Bangkok Coastal Challenge', 'Bunker Survival', 'Entrepreneurship', 'Custom PBL'],
    ideas: ['Prototype a cooler city block in Urban Heat Battle', 'Test two gear ratios on my Solar Car', 'Interview 3 people for my PBL research']
  },
  {
    id: 'steam',
    label: 'STEAM & Makerspace',
    shortLabel: 'STEAM',
    description: '3D design, coding, robotics, science labs & creative technology',
    placeholder: 'e.g. model a 3D print part in TinkerStudio, code a Micro:bit sensor game',
    subjects: ['3D TinkerStudio', 'Python & Micro:bit', 'Science Lab', 'Digital Art & Canva', 'Robotics'],
    ideas: ['Design and inspect a 3D printable model', 'Build a Python mini-game with a score counter', 'Run a controlled plant-growth experiment']
  },
  {
    id: 'personal',
    label: 'Personal & Curiosity',
    shortLabel: 'Personal',
    description: 'Passion projects, creative skills, leadership & independent exploration',
    placeholder: 'e.g. compose a beat, draw a 6-panel comic, learn chess openings',
    subjects: ['Creative Art', 'Music & Audio', 'Game Design', 'Writing & Comics', 'Leadership & Community'],
    ideas: ['Draw a 4-panel comic strip from scratch', 'Learn one full song on my instrument', 'Organise a mini tournament with classmates']
  }
];

export const TRACK_TO_CATEGORY = { academic: 'academic', pbl: 'pbl', steam: 'skills', personal: 'personal' };
export const CATEGORY_TO_TRACK = { academic: 'academic', pbl: 'pbl', skills: 'steam', personal: 'personal' };

export const trackById = (id) => GOAL_TRACKS.find((t) => t.id === id) || GOAL_TRACKS[GOAL_TRACKS.length - 1];

/** A goal's track: explicit track, else coach `domain`, else derived from its category, else personal. */
export function trackForGoal(g) {
  if (!g) return 'personal';
  if (TRACK_TO_CATEGORY[g.track]) return g.track;
  if (TRACK_TO_CATEGORY[g.domain]) return g.domain;
  return CATEGORY_TO_TRACK[g.category] || 'personal';
}

export const STEP_FREQUENCIES = [
  { id: 'daily', label: 'Daily action' },
  { id: 'weekly', label: 'Weekly milestone' },
  { id: 'once', label: 'Key step' }
];

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
const CATEGORY_IDS = ids(GOAL_CATEGORIES);
const SUBTYPE_IDS = new Set(GOAL_CATEGORIES.flatMap((c) => c.subtypes.map((s) => s.id)));
const FREQ_IDS = ids(STEP_FREQUENCIES);

const str = (v, max) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const pick = (v, allowed) => [...new Set(Array.isArray(v) ? v.filter((x) => allowed.has(x)) : [])];
const isDay = (k) => typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k);

/** Local calendar day, so "today" turns over at the learner's midnight. */
export function dayKey(date = new Date()) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const DEFAULT_NOTIFICATION_PREFS = Object.freeze({
  dailyReminder: true,
  academicAlerts: true,
  pblAlerts: true,
  deadlineAlerts: true
});

export function newPlan() {
  return {
    version: 2, strengths: [], strengthsOwn: '', supports: [], supportsOwn: '',
    phrases: [], phraseOwn: '', goals: [], focus: null, recharge: [], days: {}, updatedAt: null
  };
}

const FIRST_STEP_BY_SHOW = {
  slides: 'Write down what my first slide should say',
  talk: 'Say my idea out loud for one minute',
  model: 'Sketch a first idea for my model',
  video: 'Write down the first three shots of my video',
  diagram: 'Draw a rough first sketch',
  code: 'Write down what my code or app should do',
  poster: 'Sketch where things go on my poster',
  writing: 'Write my first two sentences'
};

/** Small first steps to choose from at the end of the goal flow; each is doable in one sitting. */
export function firstStepOptions(explore, showHow = null, category = null, subjectOrProject = '') {
  const topic = str(explore, 70);
  const context = str(subjectOrProject, 40);
  if (category === 'academic') {
    return [
      `Review my current progress and notes in ${context || topic}`,
      `Complete 1 focused practice set or unit for ${topic}`,
      `Write 3 specific questions for my coach about ${topic}`
    ].map((step) => step.slice(0, LIMITS.text));
  }
  if (category === 'pbl') {
    return [
      `Outline my next milestone deliverable for ${context || topic}`,
      `Gather 3 research sources or test data points for ${topic}`,
      FIRST_STEP_BY_SHOW[showHow] || `Share my draft plan for ${topic} with my team or coach`
    ].map((step) => step.slice(0, LIMITS.text));
  }
  return [
    `Write 3 questions I have about ${topic}`,
    `Find one good video or article about ${topic}`,
    FIRST_STEP_BY_SHOW[showHow] || 'Tell my coach what I want to find out'
  ].map((step) => step.slice(0, LIMITS.text));
}

let seq = 0;
export const newId = (prefix) => `${prefix}_${Date.now().toString(36)}${(seq++).toString(36)}`;

function cleanStep(s) {
  if (!s || typeof s !== 'object') return null;
  const text = str(s.text, LIMITS.text);
  if (!text) return null;
  const out = {
    id: str(s.id, 40) || newId('s'),
    text,
    done: s.done === true
  };
  if (s.frequency && FREQ_IDS.has(s.frequency)) out.frequency = s.frequency;
  if (s.dueDate && isDay(s.dueDate)) out.dueDate = s.dueDate;
  if (s.aiSuggested === true) out.aiSuggested = true;
  return out;
}

function cleanGoal(g) {
  if (!g || typeof g !== 'object') return null;
  const explore = str(g.explore || g.title, LIMITS.text);
  if (!explore) return null;
  const steps = (Array.isArray(g.steps) ? g.steps : [])
    .map(cleanStep)
    .filter(Boolean)
    .slice(0, LIMITS.steps);

  const out = {
    id: str(g.id, 40) || newId('g'),
    explore,
    showHow: SHOW_IDS.has(g.showHow) ? g.showHow : null,
    supports: pick(g.supports, SUPPORT_IDS),
    steps,
    done: g.done === true,
    createdAt: Number.isFinite(g.createdAt) ? g.createdAt : Date.now()
  };

  // Optional extended fields (omitted when absent so legacy unit tests match exact shapes)
  if (g.category && CATEGORY_IDS.has(g.category)) out.category = g.category;
  // Tracks: only goals that carry a track, domain or category get one, so legacy
  // uncategorised goals keep their exact shape. A track with no category also
  // sets the matching category, so the category views show the goal.
  if (g.track !== undefined || g.domain !== undefined || out.category) {
    out.track = trackForGoal({ ...g, category: out.category });
    if (!out.category) out.category = TRACK_TO_CATEGORY[out.track];
  }
  if (g.goalType && SUBTYPE_IDS.has(g.goalType)) out.goalType = g.goalType;
  if (g.subject && str(g.subject, 80)) out.subject = str(g.subject, 80);
  if (g.projectId && str(g.projectId, 80)) out.projectId = str(g.projectId, 80);
  if (g.projectTitle && str(g.projectTitle, 120)) out.projectTitle = str(g.projectTitle, 120);
  if (g.gradeLevel && str(g.gradeLevel, 40)) out.gradeLevel = str(g.gradeLevel, 40);
  if (g.graduationTarget && str(g.graduationTarget, 100)) out.graduationTarget = str(g.graduationTarget, 100);
  if (g.targetDate && isDay(g.targetDate)) out.targetDate = g.targetDate;
  if (g.measurableOutcome && str(g.measurableOutcome, LIMITS.outcome)) {
    out.measurableOutcome = str(g.measurableOutcome, LIMITS.outcome);
  }
  if (g.priority && ['high', 'medium', 'low'].includes(g.priority)) out.priority = g.priority;
  // Set with the AI goal coach: the learner's own wording is the goal, not "I will explore…".
  if (g.source === 'coach') out.source = 'coach';
  if (Number.isFinite(g.updatedAt)) out.updatedAt = g.updatedAt;
  return out;
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

  const rawGoals = (Array.isArray(stored.goals) ? stored.goals : []).map(cleanGoal).filter(Boolean);
  // If any goal uses v3 categories or plan version >= 3, allow up to maxGoals (12); otherwise enforce LIMITS.goals (3)
  const hasCategorizedGoals = stored.version >= 3 || rawGoals.some((g) => Boolean(g.category));
  const goalCap = hasCategorizedGoals ? LIMITS.maxGoals : LIMITS.goals;

  const hydrated = {
    ...base,
    version: hasCategorizedGoals ? 3 : 2,
    strengths: pick(stored.strengths, STRENGTH_IDS),
    strengthsOwn: str(stored.strengthsOwn, LIMITS.own),
    supports: pick(stored.supports, SUPPORT_IDS),
    supportsOwn: str(stored.supportsOwn, LIMITS.own),
    phrases: pick(stored.phrases, PHRASE_IDS),
    phraseOwn: str(stored.phraseOwn, LIMITS.own),
    goals: rawGoals.slice(0, goalCap),
    focus,
    recharge: pick(stored.recharge, RECHARGE_IDS),
    days,
    updatedAt: Number.isFinite(stored.updatedAt) ? stored.updatedAt : null
  };

  if (stored.academicProfile && typeof stored.academicProfile === 'object') {
    const gradeLevel = str(stored.academicProfile.gradeLevel, 40);
    const graduationDate = str(stored.academicProfile.graduationDate, 40);
    const performanceTarget = str(stored.academicProfile.performanceTarget, 120);
    if (gradeLevel || graduationDate || performanceTarget) {
      hydrated.academicProfile = {
        ...(gradeLevel ? { gradeLevel } : {}),
        ...(graduationDate ? { graduationDate } : {}),
        ...(performanceTarget ? { performanceTarget } : {})
      };
    }
  }

  if (stored.notificationPrefs && typeof stored.notificationPrefs === 'object') {
    hydrated.notificationPrefs = {
      dailyReminder: stored.notificationPrefs.dailyReminder !== false,
      academicAlerts: stored.notificationPrefs.academicAlerts !== false,
      pblAlerts: stored.notificationPrefs.pblAlerts !== false,
      deadlineAlerts: stored.notificationPrefs.deadlineAlerts !== false
    };
  }

  return hydrated;
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

export const hasPlan = (plan) => Boolean(plan && (plan.goals?.length > 0 || !!plan.focus));

const labelOf = (list, id) => list.find((x) => x.id === id)?.label || '';

export function categoryMeta(categoryId) {
  return GOAL_CATEGORIES.find((c) => c.id === categoryId) || GOAL_CATEGORIES[0];
}

export function subtypeLabel(goalType) {
  for (const cat of GOAL_CATEGORIES) {
    const found = cat.subtypes.find((s) => s.id === goalType);
    if (found) return found.label;
  }
  return '';
}

/** "I will explore X and show it as a slide deck, with small steps and a timer helping me." */
export function goalSentence(goal) {
  let s = `I will explore ${goal.explore}`;
  if (goal.showHow) s += ` and show what I learn as ${labelOf(SHOW_HOW, goal.showHow).toLowerCase()}`;
  if (goal.supports?.length) {
    const helps = goal.supports.map((id) => labelOf(SUPPORTS, id).toLowerCase()).filter(Boolean);
    if (helps.length) {
      const joined = helps.length > 1 ? `${helps.slice(0, -1).join(', ')} and ${helps.at(-1)}` : helps[0];
      s += `, with ${joined} helping me`;
    }
  }
  return `${s}.`;
}

/**
 * Compute deadline status for a goal relative to `today` (YYYY-MM-DD).
 * Returns { hasDeadline, targetDate, daysLeft, isOverdue, isApproaching, isDueToday, label }
 */
export function goalDeadlineStatus(goal, today = dayKey()) {
  if (!goal?.targetDate || !isDay(goal.targetDate)) {
    return { hasDeadline: false, targetDate: null, daysLeft: null, isOverdue: false, isApproaching: false, isDueToday: false, label: '' };
  }
  const targetMs = Date.parse(`${goal.targetDate}T00:00:00Z`);
  const todayMs = Date.parse(`${today}T00:00:00Z`);
  const daysLeft = Math.round((targetMs - todayMs) / 86400000);
  if (goal.done) {
    return { hasDeadline: true, targetDate: goal.targetDate, daysLeft, isOverdue: false, isApproaching: false, isDueToday: false, label: `Completed (Target ${goal.targetDate})` };
  }
  const isOverdue = daysLeft < 0;
  const isDueToday = daysLeft === 0;
  const isApproaching = daysLeft >= 0 && daysLeft <= 3;
  let label = `Due ${goal.targetDate}`;
  if (isOverdue) label = `Overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? '' : 's'}`;
  else if (isDueToday) label = 'Due today';
  else if (daysLeft === 1) label = 'Due tomorrow';
  else if (daysLeft <= 7) label = `${daysLeft} days left`;
  return { hasDeadline: true, targetDate: goal.targetDate, daysLeft, isOverdue, isApproaching, isDueToday, label };
}

/**
 * Calculate overall and per-category progress metrics for the Goal Dashboard.
 */
export function computeGoalDashboardMetrics(plan, today = dayKey()) {
  const goals = Array.isArray(plan?.goals) ? plan.goals : [];
  const activeGoals = goals.filter((g) => !g.done);
  const completedGoals = goals.filter((g) => g.done);
  const academicGoals = goals.filter((g) => g.category === 'academic');
  const pblGoals = goals.filter((g) => g.category === 'pbl');
  const otherGoals = goals.filter((g) => g.category && !['academic', 'pbl'].includes(g.category));
  const uncategorizedGoals = goals.filter((g) => !g.category);

  let totalSteps = 0;
  let completedSteps = 0;
  for (const g of goals) {
    const steps = Array.isArray(g.steps) ? g.steps : [];
    totalSteps += steps.length;
    completedSteps += steps.filter((s) => s.done).length;
  }

  let overallProgressPct = 0;
  if (goals.length > 0) {
    const sum = goals.reduce((acc, g) => {
      if (g.done) return acc + 100;
      const st = Array.isArray(g.steps) ? g.steps : [];
      if (!st.length) return acc;
      return acc + Math.round((st.filter((s) => s.done).length / st.length) * 100);
    }, 0);
    overallProgressPct = Math.round(sum / goals.length);
  }

  const upcomingDeadlines = activeGoals
    .map((g) => ({ goal: g, deadline: goalDeadlineStatus(g, today) }))
    .filter((item) => item.deadline.hasDeadline)
    .sort((a, b) => a.deadline.daysLeft - b.deadline.daysLeft);

  const overdueGoals = upcomingDeadlines.filter((item) => item.deadline.isOverdue).map((item) => item.goal);
  const approachingGoals = upcomingDeadlines.filter((item) => item.deadline.isApproaching).map((item) => item.goal);

  return {
    totalGoals: goals.length,
    activeCount: activeGoals.length,
    completedCount: completedGoals.length,
    academicCount: academicGoals.length,
    pblCount: pblGoals.length,
    otherCount: otherGoals.length + uncategorizedGoals.length,
    totalSteps,
    completedSteps,
    overallProgressPct,
    upcomingDeadlines,
    overdueGoals,
    approachingGoals
  };
}

/**
 * Today's checklist: the focus habit, the next unfinished step of each open
 * goal, and a recharge break. Small on purpose - at most five items. A step
 * ticked today stays on today's list (ticked); the next one shows tomorrow.
 */
export function todayItems(plan, day = dayKey()) {
  const items = [];
  if (!plan || typeof plan !== 'object') return items;
  const days = plan.days || {};
  const ticked = new Set(days[day] || []);
  if (plan.focus?.habit) items.push({ id: 'habit', kind: 'habit', text: plan.focus.habit });
  for (const g of (plan.goals || [])) {
    if (g.done) continue;
    const steps = Array.isArray(g.steps) ? g.steps : [];
    const next = steps.find((s) => ticked.has(`step:${g.id}:${s.id}`)) || steps.find((s) => !s.done);
    if (next) {
      const item = {
        id: `step:${g.id}:${next.id}`,
        kind: 'step',
        text: next.text,
        goal: g.explore,
        goalId: g.id,
        stepId: next.id
      };
      if (g.category) item.category = g.category;
      if (g.track) item.track = g.track;
      if (g.subject) item.subject = g.subject;
      if (g.projectTitle) item.projectTitle = g.projectTitle;
      if (g.targetDate) item.targetDate = g.targetDate;
      if (next.frequency) item.frequency = next.frequency;
      items.push(item);
    }
  }
  if (plan.recharge?.length) {
    items.push({ id: 'recharge', kind: 'recharge', text: `Recharge break: ${labelOf(RECHARGE, plan.recharge[0]).toLowerCase()}` });
  }
  const isV3 = plan.version >= 3 || (plan.goals || []).some((g) => Boolean(g.category));
  return items.slice(0, isV3 ? 10 : 5);
}

export function checkedToday(plan, day = dayKey()) {
  return new Set(plan?.days?.[day] || []);
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
    out.push({ day: key, done: (plan?.days?.[key] || []).includes('habit') });
  }
  return { days: out, count: out.filter((d) => d.done).length, target: plan?.focus?.daysPerWeek || 0 };
}

/** One users/{uid}/goals document per big goal and for the focus skill, for the coach dashboard. */
export function coachGoalDocs(plan, now = Date.now()) {
  const docs = (plan.goals || []).map((g) => {
    const total = g.steps.length;
    const done = g.steps.filter((s) => s.done).length;
    const doc = {
      goalId: `plan_${g.id}`,
      title: g.explore,
      summary: g.source === 'coach' ? [g.explore, g.measurableOutcome].filter(Boolean).join(' · ') : goalSentence(g),
      kind: 'big-goal',
      status: g.done ? 'achieved' : 'on_track',
      completed: g.done,
      progress: g.done ? 1 : (total ? Math.round((done / total) * 100) / 100 : 0),
      createdAt: g.createdAt,
      updatedAt: now,
      source: 'goals-page'
    };
    if (g.category) doc.category = g.category;
    // Coach and School Workspace goals use `domain` (academic | pbl | steam | personal).
    if (g.track) doc.domain = g.track;
    if (g.goalType) doc.goalType = g.goalType;
    if (g.subject) doc.subject = g.subject;
    if (g.projectId) doc.projectId = g.projectId;
    if (g.projectTitle) doc.projectTitle = g.projectTitle;
    if (g.targetDate) doc.targetDate = g.targetDate;
    if (g.measurableOutcome) doc.measurableOutcome = g.measurableOutcome;
    return doc;
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

/*
 * Game layer for the goals page. Points come only from things the learner
 * actually did and that stay in the plan (no decay, no streak penalties), so
 * the level never drops because days age out of `days`.
 */
export const XP = { setup: 10, focus: 15, goal: 20, step: 10, achieved: 40, perLevel: 100 };
export const LEVELS = ['Starter', 'Explorer', 'Builder', 'Trailblazer', 'Innovator', 'Visionary'];

export function planXp(plan) {
  let xp = 0;
  for (const list of [plan.strengths, plan.supports, plan.phrases, plan.recharge]) if (list?.length) xp += XP.setup;
  if (plan.focus) xp += XP.focus;
  for (const g of (plan.goals || [])) {
    xp += XP.goal + g.steps.filter((s) => s.done).length * XP.step;
    if (g.done) xp += XP.achieved;
  }
  return xp;
}

export function planLevel(plan) {
  const xp = planXp(plan);
  const n = Math.floor(xp / XP.perLevel);
  return { xp, level: n + 1, title: LEVELS[Math.min(n, LEVELS.length - 1)], into: xp % XP.perLevel, perLevel: XP.perLevel };
}

/** Days in a row with at least one item ticked, ending today (or yesterday, so today is not yet a break). */
export function streak(plan, today = new Date()) {
  const ticked = (d) => (plan.days[dayKey(d)] || []).length > 0;
  const d = new Date(today);
  if (!ticked(d)) d.setDate(d.getDate() - 1);
  let n = 0;
  while (ticked(d) && n < LIMITS.days) { n += 1; d.setDate(d.getDate() - 1); }
  return n;
}

/** The four stations of the quest map, in order, and which one to do next. */
export function questStations(plan, day = dayKey()) {
  const items = todayItems(plan, day);
  const ticked = checkedToday(plan, day);
  const stations = [
    { id: 'strengths', title: 'Spot your strengths', done: plan.strengths.length > 0 },
    { id: 'goal', title: 'Set a big goal', done: plan.goals.length > 0 },
    { id: 'focus', title: 'Pick a tiny habit', done: !!plan.focus },
    { id: 'today', title: 'Tick off today', done: items.length > 0 && items.every((i) => ticked.has(i.id)) }
  ];
  return { stations, next: stations.find((s) => !s.done)?.id || null };
}
