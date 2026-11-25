/**
 * SPARK Goal Coach: the pure logic behind the conversational goal assistant
 * (GoalCoach.jsx). Unit-tested in tests/goal-coach.test.js.
 *
 * Everything here runs on the device, so the coach still works when the AI
 * endpoint is unavailable. The steps themselves come from
 * goalAiService.suggestGoalMilestones (Gemini when it answers, the local
 * scaffold otherwise), and the UI says which one produced them.
 *
 * It reads only what the learner typed and the academic context already on
 * the page. It never guesses grades or scores.
 */
import { LIMITS, newId, dayKey } from './goalPlan.js';

const KEYWORDS = {
  academic: [
    'exam', 'test', 'quiz', 'grade', 'score', 'mark', 'gpa', 'homework', 'assignment', 'unit', 'study',
    'revise', 'revision', 'math', 'maths', 'algebra', 'calculus', 'geometry', 'equation', 'fraction',
    'science', 'biology', 'chemistry', 'physics', 'english', 'essay', 'grammar', 'vocabulary', 'history',
    'geography', 'thai', 'language', 'ielts', 'sat', 'subject', 'class', 'course', 'graduat', 'diploma', 'pass'
  ],
  pbl: [
    'project', 'prototype', 'team', 'pitch', 'showcase', 'exhibition', 'sensor', 'robot', 'launch',
    'interview', 'deliverable', 'client', 'milestone', 'research', 'survey', 'campaign', 'invention', 'solar', 'pbl'
  ],
  skills: [
    'learn to', 'learn how', 'coding', 'code', 'python', 'javascript', 'scratch', 'cad', '3d', 'blender',
    'figma', 'video editing', 'public speaking', 'speak', 'present', 'skill', 'tutorial', 'draw', 'animation',
    'typing', 'excel', 'photography', 'music', 'guitar', 'piano'
  ],
  personal: [
    'sleep', 'focus', 'organis', 'organiz', 'habit', 'routine', 'wellbeing', 'well-being', 'exercise',
    'confiden', 'stress', 'phone', 'screen time', 'procrastinat', 'time management', 'journal', 'calm',
    'anxious', 'friends', 'healthy', 'ask for help', 'on time', 'planner', 'morning'
  ]
};

/** Keyword -> subject, matched against MANUAL_SUBJECT_OPTIONS names. */
const SUBJECT_HINTS = [
  [/\b(math|maths|algebra|calculus|geometry|equation|fraction|statistic|trigonometr)/i, 'Mathematics'],
  [/\b(english|essay|grammar|vocabulary|literature|poem|novel|reading|writing)/i, 'English Language & Literature'],
  [/\bbiolog|\bcell|\bplant|\bgenetic/i, 'Biology'],
  [/\bchemi|\bmolecul|\breaction/i, 'Chemistry'],
  [/\bphysic|\bforce|\bmotion|\belectric/i, 'Physics'],
  [/\bscience\b/i, 'Integrated Science'],
  [/\b(coding|code|python|javascript|computer|program|ai\b|machine learning)/i, 'Computer Science & AI'],
  [/\b(robot|engineer|cad|circuit|arduino)/i, 'Engineering & Robotics'],
  [/\b(history|geography|world war|civili)/i, 'World History & Geography'],
  [/\b(art|design|media|drawing|animation|film)/i, 'Art, Design & Media'],
  [/\bthai\b/i, 'Thai Language & Culture'],
  [/\b(business|economic|entrepreneur|startup|money)/i, 'Entrepreneurship & Economics']
];

const clean = (v, max = LIMITS.text) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');

function addDays(today, n) {
  const d = new Date(`${today}T12:00:00`);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

/** Days between two YYYY-MM-DD keys (b - a). */
export function daysBetween(a, b) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
}

/** Read a time frame out of free text: "in 3 weeks", "next month", "by Friday" is ignored (too vague). */
export function parseTimeframe(text, today = dayKey()) {
  const t = String(text || '').toLowerCase();
  const m = t.match(/\b(?:in|within|for|over)\s+(\d{1,3}|a|one|two|three|four|six|eight)\s+(day|week|month)s?\b/);
  const words = { a: 1, one: 1, two: 2, three: 3, four: 4, six: 6, eight: 8 };
  if (m) {
    const n = Number(m[1]) || words[m[1]] || 1;
    const per = m[2] === 'day' ? 1 : m[2] === 'week' ? 7 : 30;
    const days = Math.min(365, Math.max(1, n * per));
    return { days, date: addDays(today, days) };
  }
  if (/\bnext week\b|\bthis week\b/.test(t)) return { days: 7, date: addDays(today, 7) };
  if (/\bnext month\b|\bthis month\b/.test(t)) return { days: 30, date: addDays(today, 30) };
  const iso = t.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (iso && daysBetween(today, iso[1]) > 0) return { days: daysBetween(today, iso[1]), date: iso[1] };
  return null;
}

/** Match a subject the learner already has (from their academic record) before the standard list. */
export function detectSubject(text, knownSubjects = []) {
  const t = String(text || '');
  const lower = t.toLowerCase();
  for (const s of knownSubjects) {
    const name = typeof s === 'string' ? s : s?.subject;
    if (name && name.length > 2 && lower.includes(name.toLowerCase())) return name;
  }
  for (const [re, subject] of SUBJECT_HINTS) {
    if (re.test(t)) {
      // Prefer the learner's own wording of that subject if they have it.
      const own = knownSubjects
        .map((s) => (typeof s === 'string' ? s : s?.subject))
        .find((n) => n && n.toLowerCase().includes(subject.split(' ')[0].toLowerCase()));
      return own || subject;
    }
  }
  return '';
}

/** What kind of goal this sounds like. Returns the category and how sure we are. */
export function analyseGoalText(text, { subjects = [], pblProjects = [], today = dayKey() } = {}) {
  const t = ` ${String(text || '').toLowerCase()} `;
  const scores = { academic: 0, pbl: 0, skills: 0, personal: 0 };
  for (const [cat, list] of Object.entries(KEYWORDS)) {
    for (const k of list) if (t.includes(k)) scores[cat] += 1;
  }
  const project = pblProjects.find((p) => p?.title && t.includes(p.title.toLowerCase().slice(0, 18)));
  if (project) scores.pbl += 3;
  const subject = detectSubject(text, subjects);
  if (subject) scores.academic += 1;
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [top, topScore] = ranked[0];
  const category = topScore === 0 ? (subject ? 'academic' : 'skills') : top;
  const confidence = topScore === 0 ? 'low' : topScore - ranked[1][1] >= 2 ? 'high' : 'medium';
  return {
    category,
    confidence,
    subject: category === 'academic' ? subject : '',
    project: project ? { id: project.id, title: project.title } : null,
    timeframe: parseTimeframe(text, today),
    hasNumber: /\d/.test(t)
  };
}

/** The goal type within a category, from the wording. */
export function inferGoalType(category, text) {
  const t = String(text || '').toLowerCase();
  if (category === 'academic') {
    if (/graduat|diploma/.test(t)) return 'graduation-target';
    if (/exam|test|quiz|assignment|essay|homework/.test(t)) return 'assignment-exam';
    if (/grade|score|mark|%|gpa|average/.test(t)) return 'performance-target';
    if (/this week|tomorrow|today/.test(t)) return 'short-term-learning';
    return 'subject-goal';
  }
  if (category === 'pbl') {
    if (/research|survey|interview|data/.test(t)) return 'research-target';
    if (/team|group|role/.test(t)) return 'teamwork-objective';
    if (/pitch|present|deliver|submit|showcase|deadline/.test(t)) return 'deliverable-deadline';
    if (/milestone|stage|phase/.test(t)) return 'project-milestone';
    return 'project-objective';
  }
  if (category === 'skills') {
    if (/speak|present|talk|communicat|pitch/.test(t)) return 'communication-skill';
    if (/problem|think|logic|puzzle|debate/.test(t)) return 'critical-thinking';
    return 'technical-skill';
  }
  if (/confid|ask|advoca|speak up/.test(t)) return 'self-advocacy';
  if (/sleep|stress|wellbeing|well-being|exercise|calm|healthy|creative/.test(t)) return 'wellbeing-growth';
  return 'executive-habit';
}

export const TIMEFRAMES = [
  { id: '1w', label: 'In 1 week', days: 7 },
  { id: '2w', label: 'In 2 weeks', days: 14 },
  { id: '1m', label: 'In a month', days: 30 },
  { id: '8w', label: 'In 8 weeks', days: 56 }
];

export function timeframeDate(id, today = dayKey()) {
  const tf = TIMEFRAMES.find((x) => x.id === id);
  return tf ? addDays(today, tf.days) : '';
}

/** Three measurable "I'll know I've done it when…" options. Numbers are targets the learner picks, not data. */
export function outcomeSuggestions({ category, subject = '', projectTitle = '', explore = '', goalType = '' } = {}) {
  const topic = clean(subject || projectTitle || explore, 60) || 'this';
  // Use the learner's own target number when they gave one ("get 85% on…").
  const pct = String(explore).match(/(\d{1,3})\s*(?:%|percent)/i)?.[1];
  const target = pct && Number(pct) <= 100 ? `${pct}%` : '80%';
  const out = {
    academic: goalType === 'assignment-exam'
      ? [
          `Score ${target} or more on a practice test in ${topic} before the real one`,
          `Finish every revision topic for ${topic} and explain each one to someone`,
          `Hand in my ${topic} work on time with all parts complete`
        ]
      : goalType === 'performance-target'
      ? [
          `Raise my ${topic} result by one grade band on the next check-in`,
          `Get 4 of 5 weekly ${topic} checkpoints right first time`,
          `Complete all ${topic} units due this term on schedule`
        ]
      : [
          `Complete 3 ${topic} practice sets and get ${target}+ on the last one`,
          `Explain the key ideas of ${topic} to my coach without notes`,
          `Finish every ${topic} unit due before my target date`
        ],
    pbl: [
      `Share a working prototype of ${topic} and test it with 3 people`,
      `Log 5 pieces of evidence for ${topic} in PBL Studio`,
      `Present my ${topic} milestone to my coach and get feedback`
    ],
    skills: [
      `Build one small thing that uses ${topic} and show it to my class`,
      `Practise ${topic} 4 times a week and record what improved`,
      `Finish a full beginner tutorial on ${topic} and make my own version`
    ],
    personal: [
      `Do this on 5 days each week for the next 3 weeks`,
      `Track it daily and see fewer missed days each week`,
      `Tell my coach one thing that changed because of this`
    ]
  };
  return (out[category] || out.skills).map((s) => s.slice(0, LIMITS.outcome));
}

const MEASURE_WORDS = /\d|%|percent|score|complete|finish|submit|hand in|present|publish|demo|build|record|log|track|every|each|times|days|pages|units/i;

/**
 * SMART check on the draft. Each item says what is still missing, so the coach
 * can nudge instead of grading.
 */
export function smartCheck(draft = {}, today = dayKey()) {
  const explore = clean(draft.explore);
  const words = explore ? explore.split(' ').length : 0;
  const steps = (draft.steps || []).filter((s) => clean(s?.text));
  const daysLeft = draft.targetDate ? daysBetween(today, draft.targetDate) : null;
  const items = [
    {
      id: 'specific', letter: 'S', label: 'Specific',
      met: words >= 4,
      tip: 'Say exactly what you will learn, make or improve.'
    },
    {
      id: 'measurable', letter: 'M', label: 'Measurable',
      met: MEASURE_WORDS.test(clean(draft.measurableOutcome, LIMITS.outcome)),
      tip: 'Pick how you will know you have done it.'
    },
    {
      id: 'achievable', letter: 'A', label: 'Achievable',
      met: steps.length >= 2,
      tip: 'Break it into at least two small steps.'
    },
    {
      id: 'relevant', letter: 'R', label: 'Relevant',
      met: words >= 1 && Boolean(draft.category) && (draft.category !== 'academic' || Boolean(draft.subject)) && (draft.category !== 'pbl' || Boolean(draft.projectTitle) || words >= 4),
      tip: draft.category === 'academic' ? 'Link it to a subject.' : 'Link it to something you care about.'
    },
    {
      id: 'timebound', letter: 'T', label: 'Time-bound',
      met: daysLeft !== null && daysLeft > 0,
      tip: 'Choose a target date.'
    }
  ];
  return { items, score: items.filter((i) => i.met).length, total: items.length };
}

/** Idea chips for the opening question, from the learner's own subjects and projects first. */
export function coachIdeas({ subjects = [], pblProjects = [], presetCategory = null, presetSubject = '' } = {}) {
  const ideas = [];
  const subjectNames = subjects.map((s) => (typeof s === 'string' ? s : s?.subject)).filter(Boolean);
  if (presetSubject) {
    ideas.push(
      `Improve my ${presetSubject} result this term`,
      `Get ready for my next ${presetSubject} test`,
      `Hand in every ${presetSubject} assignment on time this month`,
      `Understand the hardest ${presetSubject} topic well enough to teach it`
    );
    return ideas;
  }
  if (!presetCategory || presetCategory === 'academic') {
    for (const s of subjectNames.slice(0, 2)) if (!presetSubject || s !== presetSubject) ideas.push(`Get more confident in ${s}`);
  }
  if (!presetCategory || presetCategory === 'pbl') {
    const p = pblProjects[0];
    if (p?.title) ideas.push(`Finish my next milestone for ${clean(p.title, 50)}`);
  }
  const fallback = {
    academic: ['Score 80%+ on my next maths test', 'Finish my science unit before the deadline'],
    pbl: ['Build and test a prototype for my team project', 'Interview 3 people for my project research'],
    skills: ['Learn to code a simple game in Python', 'Give a 3-minute talk without notes'],
    personal: ['Plan my week every Sunday evening', 'Start homework within 5 minutes of sitting down']
  };
  const pool = presetCategory ? fallback[presetCategory] : [
    fallback.academic[0], fallback.pbl[0], fallback.skills[0], fallback.personal[0]
  ];
  for (const f of pool) if (ideas.length < 4 && !ideas.includes(f)) ideas.push(f);
  return ideas.slice(0, 4);
}

/** A coach reply that reflects back what it understood. */
export function coachReadback(analysis) {
  const label = { academic: 'an academic goal', pbl: 'a project (PBL) goal', skills: 'a skills goal', personal: 'a personal growth goal' }[analysis.category];
  let s = `That sounds like ${label}`;
  if (analysis.subject) s += ` in ${analysis.subject}`;
  if (analysis.project?.title) s += ` for ${analysis.project.title}`;
  return `${s}.`;
}

/** The plan goal built from the coach's draft. */
export function buildCoachGoal(draft, { supports = [], now = Date.now() } = {}) {
  const steps = (draft.steps || [])
    .filter((s) => clean(s?.text))
    .slice(0, LIMITS.steps)
    .map((s) => ({
      id: s.id || newId('s'),
      text: clean(s.text),
      done: false,
      ...(s.frequency ? { frequency: s.frequency } : {}),
      ...(s.aiSuggested ? { aiSuggested: true } : {})
    }));
  const goal = {
    id: newId('g'),
    explore: clean(draft.explore),
    showHow: null,
    supports: supports.slice(0, 3),
    steps,
    done: false,
    createdAt: now,
    source: 'coach',
    category: draft.category || 'academic',
    goalType: draft.goalType || inferGoalType(draft.category, draft.explore),
    updatedAt: now
  };
  if (goal.category === 'academic' && clean(draft.subject, 80)) goal.subject = clean(draft.subject, 80);
  if (goal.category === 'academic' && clean(draft.gradeLevel, 40)) goal.gradeLevel = clean(draft.gradeLevel, 40);
  if (goal.category === 'pbl' && draft.projectId) goal.projectId = clean(draft.projectId, 80);
  if (goal.category === 'pbl' && draft.projectTitle) goal.projectTitle = clean(draft.projectTitle, 120);
  if (draft.targetDate && /^\d{4}-\d{2}-\d{2}$/.test(draft.targetDate)) goal.targetDate = draft.targetDate;
  if (clean(draft.measurableOutcome, LIMITS.outcome)) goal.measurableOutcome = clean(draft.measurableOutcome, LIMITS.outcome);
  return goal;
}

/**
 * Subject lanes for the Academic planner: the learner's record first, then any
 * subject they have set a goal in. Progress is only what the record reports.
 */
export function academicLanes(plan, academicContext, today = dayKey()) {
  const lanes = new Map();
  for (const s of academicContext?.subjects || []) {
    if (!s?.subject) continue;
    lanes.set(s.subject.toLowerCase(), {
      subject: s.subject,
      provider: s.provider || '',
      recordPct: Number.isFinite(s.progressPct) ? s.progressPct : null,
      recordGrade: s.grade || '',
      goals: []
    });
  }
  for (const g of plan?.goals || []) {
    if ((g.category || 'academic') !== 'academic') continue;
    const name = g.subject || 'General academic';
    const key = name.toLowerCase();
    if (!lanes.has(key)) lanes.set(key, { subject: name, provider: '', recordPct: null, recordGrade: '', goals: [] });
    lanes.get(key).goals.push(g);
  }
  return [...lanes.values()].map((lane) => {
    const steps = lane.goals.flatMap((g) => g.steps || []);
    const done = steps.filter((s) => s.done).length;
    const open = lane.goals.filter((g) => !g.done && g.targetDate).sort((a, b) => a.targetDate.localeCompare(b.targetDate));
    const next = open[0] || null;
    return {
      ...lane,
      activeCount: lane.goals.filter((g) => !g.done).length,
      doneCount: lane.goals.filter((g) => g.done).length,
      stepsDone: done,
      stepsTotal: steps.length,
      stepPct: steps.length ? Math.round((done / steps.length) * 100) : 0,
      next: next ? { goal: next, daysLeft: daysBetween(today, next.targetDate) } : null
    };
  }).sort((a, b) => (b.activeCount - a.activeCount) || a.subject.localeCompare(b.subject));
}

/** Goals with target dates placed in week buckets for the roadmap (overdue first, then 8 weeks). */
export function roadmapWeeks(goals = [], today = dayKey(), weeks = 8) {
  const cols = [{ id: 'overdue', label: 'Overdue', items: [] }];
  for (let i = 0; i < weeks; i += 1) {
    const start = addDays(today, i * 7);
    const d = new Date(`${start}T12:00:00`);
    cols.push({
      id: `w${i}`,
      label: i === 0 ? 'This week' : i === 1 ? 'Next week' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
      items: []
    });
  }
  const later = { id: 'later', label: 'Later', items: [] };
  for (const g of goals) {
    if (g.done || !g.targetDate) continue;
    const days = daysBetween(today, g.targetDate);
    if (days < 0) cols[0].items.push({ goal: g, days });
    else if (days < weeks * 7) cols[1 + Math.floor(days / 7)].items.push({ goal: g, days });
    else later.items.push({ goal: g, days });
  }
  if (later.items.length) cols.push(later);
  return cols;
}
