import { Router } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { requireClaims } from '../middleware/auth.js';
import { sendError } from '../lib/errors.js';
import { schoolCaller, schoolAccess, learnerAccess, staff, requireId, fail, validId } from '../lib/schoolScope.js';
import { questRef, squadRef, questContext, awardXp, DEFAULT_SQUAD_GOAL } from '../lib/quest.js';
import { hydrateQuest, levelFor, currentStreak, badgeProgress, nextBadge, todaysQuest, badgeById, SELF_EVENT_TYPES, REFLECTION_MIN_LENGTH, REFLECTION_MAX_LENGTH } from '../../src/features/quest/questModel.js';
import { TERM, PHASES } from '../../src/features/pbl/content/pblModel.js';

const router = Router();
const wrap = fn => async (req, res, next) => {
  try { await fn(req, res); } catch (e) { if (e.status) return sendError(res, e.status, e.code, e.message); next(e); }
};
router.use((req, res, next) => /^\/quest(\/|$)/.test(req.path) ? next() : next('router'));
router.use(requireClaims);
router.use((req, res, next) => {
  if (!['GET', 'HEAD'].includes(req.method) && (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))) return sendError(res, 400, 'VALIDATION', 'A JSON object is required.');
  next();
});
router.use(async (req, res, next) => {
  try { req.questCaller = await schoolCaller(req); next(); }
  catch (e) { if (e.status) return sendError(res, e.status, e.code, e.message); next(e); }
});

function learner(req) {
  const caller = req.questCaller;
  if (caller.role !== 'student') fail(403, 'FORBIDDEN', 'Quests are available to learners only.');
  return caller;
}

/** The learner's school (first signed school grant) and its record, for timezone and holidays. */
async function learnerSchool(caller) {
  const schoolId = caller.schoolIds[0];
  if (!schoolId) return { schoolId: null, school: {} };
  const snap = await getFirestore().collection('schools').doc(schoolId).get();
  return { schoolId, school: snap.exists ? snap.data() : {} };
}

async function projectFor(uid) {
  const snap = await getFirestore().collection('users').doc(uid).collection('activityProgress').doc(`pbl-${TERM.id}`).get();
  return snap.exists ? snap.data() : null;
}

async function squadFor(caller) {
  const classId = (caller.profile.classIds || []).find(id => validId(id) && caller.classIds.includes(id)) || (caller.profile.classIds || []).find(validId);
  if (!classId) return null;
  const [cls, squad] = await Promise.all([getFirestore().collection('classes').doc(classId).get(), squadRef(classId).get()]);
  if (!cls.exists) return null;
  // Totals only: the squad goal never names or ranks classmates.
  return { classId, className: cls.data().name || classId, count: squad.data()?.count || 0, goal: squad.data()?.goal || DEFAULT_SQUAD_GOAL };
}

function stagePath(project) {
  const done = project?.tasksDone || {};
  return PHASES.map(p => ({ id: p.id, title: p.title, weeks: p.weeks, done: Math.min(p.tasks.length, (done[p.id] || []).length), total: p.tasks.length, current: p.id === (project?.currentPhase || PHASES[0].id) }));
}

async function questView(caller) {
  const { schoolId, school } = await learnerSchool(caller);
  const ctx = await questContext(schoolId, school);
  const [questSnap, project, squad, recent] = await Promise.all([
    questRef(caller.uid).get(),
    projectFor(caller.uid),
    squadFor(caller),
    questRef(caller.uid).collection('xpEvents').orderBy('createdAt', 'desc').limit(5).get()
  ]);
  const quest = hydrateQuest(questSnap.data());
  return {
    schemaVersion: quest.schemaVersion,
    revision: quest.revision,
    today: ctx.today,
    timezone: ctx.timezone,
    holidays: [...ctx.holidays].sort(),
    level: levelFor(quest.xp),
    streak: { ...quest.streak, ...currentStreak(quest.streak, ctx.today, ctx.holidays) },
    counters: quest.counters,
    badges: badgeProgress(quest),
    nextBadge: nextBadge(quest),
    celebrations: quest.celebrations,
    dailySelfXp: quest.daily.date === ctx.today ? quest.daily.selfXp : 0,
    todaysQuest: todaysQuest(project, PHASES),
    stages: stagePath(project),
    squad,
    recent: recent.docs.map(d => ({ type: d.data().type, xp: d.data().xp, createdAt: d.data().createdAt })),
    preferences: { calmView: quest.calmView, showOnPortfolio: quest.showOnPortfolio }
  };
}

router.get('/quest/me', wrap(async (req, res) => {
  res.json(await questView(learner(req)));
}));

router.post('/quest/events', wrap(async (req, res) => {
  const caller = learner(req);
  const type = req.body.type;
  if (!SELF_EVENT_TYPES.includes(type)) fail(400, 'VALIDATION', 'This kind of activity is recorded automatically.');
  const { schoolId, school } = await learnerSchool(caller);
  const ctx = await questContext(schoolId, school);
  let event;
  if (type === 'task_step') {
    const phase = PHASES.find(p => p.id === req.body.phaseId);
    const index = req.body.index;
    if (!phase || !Number.isInteger(index) || index < 0 || index >= phase.tasks.length) fail(400, 'VALIDATION', 'Choose a valid project task.');
    // The project document is learner-written, which is why task XP is small and capped.
    const project = await projectFor(caller.uid);
    if (!(project?.tasksDone?.[phase.id] || []).includes(index)) fail(409, 'CONFLICT', 'Tick the task in your project first, then try again.');
    event = { uid: caller.uid, type, sourceId: `${TERM.id}.${phase.id}.${index}`, schoolId };
  } else {
    const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
    if (text.length < REFLECTION_MIN_LENGTH || text.length > REFLECTION_MAX_LENGTH) fail(400, 'VALIDATION', `Write at least ${REFLECTION_MIN_LENGTH} characters (maximum ${REFLECTION_MAX_LENGTH}).`);
    // One reflection reward per school-local day; the text stays private to the learner.
    event = { uid: caller.uid, type, sourceId: ctx.today, schoolId, note: text };
  }
  const result = await awardXp(ctx, event);
  if (!result) return res.json({ duplicate: true, awarded: 0, quest: await questView(caller) });
  res.status(201).json({
    duplicate: false,
    awarded: result.awarded,
    capped: result.capped,
    levelUp: result.levelUp,
    earned: result.earned.map(b => ({ id: b.id, name: b.name })),
    quest: await questView(caller)
  });
}));

router.patch('/quest/me', wrap(async (req, res) => {
  const caller = learner(req);
  const patch = {};
  for (const key of ['calmView', 'showOnPortfolio']) {
    if (key in req.body) {
      if (typeof req.body[key] !== 'boolean') fail(400, 'VALIDATION', `${key} must be true or false.`);
      patch[key] = req.body[key];
    }
  }
  const ack = req.body.ackCelebrations === true;
  if (!Object.keys(patch).length && !ack) fail(400, 'VALIDATION', 'Nothing to change.');
  await getFirestore().runTransaction(async tx => {
    const snap = await tx.get(questRef(caller.uid));
    const quest = hydrateQuest(snap.data());
    if (quest.revision !== req.body.revision) fail(409, 'CONFLICT', 'Your quest changed in another window. Reload and try again.');
    tx.set(questRef(caller.uid), { ...quest, ...patch, ...(ack ? { celebrations: [] } : {}), revision: quest.revision + 1, updatedAt: new Date().toISOString() });
  });
  res.json(await questView(caller));
}));

/**
 * Read-only summary for assigned staff, admins and linked parents. Parents get
 * badges only: no streaks (no pressure at home) and no self-reported detail.
 */
router.get('/quest/learners/:uid', wrap(async (req, res) => {
  const caller = req.questCaller;
  const uid = requireId(req.params.uid);
  const schoolId = requireId(req.query.schoolId);
  await schoolAccess(caller, schoolId);
  await learnerAccess(caller, schoolId, uid, req.query.classId);
  const quest = hydrateQuest((await questRef(uid).get()).data());
  const badges = quest.badges.map(b => ({ id: b.id, name: badgeById(b.id)?.name || b.id, competency: badgeById(b.id)?.competency || '', earnedAt: b.earnedAt }));
  if (caller.role === 'parent') return res.json({ badges });
  if (!staff(caller) && caller.role !== 'admin' && caller.uid !== uid) fail(403, 'FORBIDDEN', 'Quest summaries are for assigned staff.');
  // Filter in memory: a verified+createdAt query would need a composite index.
  const recent = await questRef(uid).collection('xpEvents').orderBy('createdAt', 'desc').limit(40).get();
  const verified = { docs: recent.docs.filter(d => d.data().verified === true).slice(0, 10) };
  const { school } = await learnerSchool({ schoolIds: [schoolId] });
  const ctx = await questContext(schoolId, school);
  res.json({
    level: levelFor(quest.xp),
    streak: currentStreak(quest.streak, ctx.today, ctx.holidays),
    counters: { evidence: quest.counters.evidence, reviewed: quest.counters.reviewed, goalsAchieved: quest.counters.goalsAchieved, reflections: quest.counters.reflections },
    badges,
    recentVerified: verified.docs.map(d => ({ type: d.data().type, xp: d.data().xp, createdAt: d.data().createdAt }))
  });
}));

export default router;
