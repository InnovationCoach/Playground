import { installCourseSuggestionRoute } from '../routes/course-suggestions.js';
import { getFirestore } from 'firebase-admin/firestore';
import { createHash } from 'node:crypto';
import { assignedClass, learnerAccess, staff, requireId, requireText, fail } from './schoolScope.js';
import { competencyById } from '../../src/features/pbl/content/competencies.js';
import { FRAMEWORK_VERSION, PATHWAY_VERSION, confirmedIds, recommendPathway } from '../../src/features/quest/pathwayModel.js';

const now = () => new Date().toISOString();
const values = snap => snap.docs.map(d => ({ ...d.data(), id: d.id }));
const bounded = snap => {
  if (snap.size > 100) fail(409, 'PATHWAY_SCOPE_TOO_LARGE', 'This class has more records than the pilot pathway supports. Ask your school to review the pathway scope.');
  return values(snap);
};

export function installPathwayRoutes(router, { wrap, root, audit }) {
  async function scope(req, write = false, uid = requireId(req.params.learnerUid), classId = requireId(req.query.classId)) {
    const caller = req.schoolCaller;
    if (!['student', 'coach', 'teacher', 'admin'].includes(caller.role)) fail(403, 'FORBIDDEN', 'Pathways are available to learners and their assigned coaches.');
    if (write && !staff(caller) && caller.role !== 'admin') fail(403, 'FORBIDDEN', 'Only assigned coaches can confirm competencies.');
    const learner = await learnerAccess(caller, req.schoolId, uid, classId);
    if (!learner.classIds?.includes(classId)) fail(403, 'FORBIDDEN', 'This learner is not in the selected class.');
    if (caller.role !== 'student') await assignedClass(caller, req.schoolId, classId);
    else {
      const cls = await getFirestore().collection('classes').doc(classId).get();
      if (!cls.exists || cls.data().schoolId !== req.schoolId || cls.data().status === 'archived') fail(403, 'FORBIDDEN', 'This learning class is unavailable.');
    }
    return { uid, classId, ref: root(req.schoolId).collection('learnerPathways').doc(uid).collection('classes').doc(classId) };
  }

  async function context(req, scoped, tx) {
    const read = ref => tx ? tx.get(ref) : ref.get();
    const [state, mastery, offeringSnap, goalSnap] = await Promise.all([
      read(scoped.ref), read(scoped.ref.collection('mastery').limit(101)),
      read(root(req.schoolId).collection('programOfferings').where('classIds', 'array-contains', scoped.classId).limit(101)),
      read(root(req.schoolId).collection('learnerGoals').where('learnerUid', '==', scoped.uid).limit(101))
    ]);
    const achievements = bounded(mastery);
    const goals = bounded(goalSnap).filter(g => g.classId === scoped.classId);
    const lessons = [], evidence = [], programs = [];
    for (const offering of bounded(offeringSnap).filter(o => o.status === 'published')) {
      const ref = root(req.schoolId).collection('programOfferings').doc(offering.id);
      const member = await read(ref.collection('members').doc(scoped.uid));
      if (!member.exists || member.data().status !== 'active' || member.data().classId !== scoped.classId) continue;
      if (offering.programDefinition?.id) programs.push(offering.programDefinition);
      const [lessonSnap, submissionSnap] = await Promise.all([
        read(ref.collection('lessons').where('classId', '==', scoped.classId).limit(101)),
        read(ref.collection('submissions').where('learnerUid', '==', scoped.uid).limit(101))
      ]);
      const published = bounded(lessonSnap).filter(l => l.status === 'published').map(l => ({ ...l, offeringId: offering.id }));
      lessons.push(...published);
      // Evidence is version-bound. A later lesson edit must not silently change
      // what an earlier submission proves.
      for (const submission of bounded(submissionSnap)) {
        const lesson = published.find(l => l.id === submission.lessonId && l.revision === submission.lessonRevision);
        if (submission.classId !== scoped.classId || submission.status !== 'reviewed' || !lesson) continue;
        evidence.push({ offeringId: offering.id, submissionId: submission.id, lessonId: lesson.id, lessonRevision: lesson.revision,
          title: lesson.title, reviewedAt: submission.reviewedAt,
          competencyIds: (lesson.competencyIds || []).filter(id => competencyById(id)) });
      }
    }
    const revision = state.data()?.revision || 0;
    return { revision, frameworkVersion: FRAMEWORK_VERSION, pathwayVersion: PATHWAY_VERSION, achievements,
      recommendations: recommendPathway({ lessons, achievements, goals }),
      quests: goals.filter(g => g.source === 'competency-pathway'),
      evidence: req.schoolCaller.role === 'student' ? [] : evidence, lessons, reviewedEvidence: evidence, programs, goals };
  }

  installCourseSuggestionRoute(router, { wrap, scope, context });

  const path = '/schools/:schoolId/learners/:learnerUid/pathway';
  router.get(path, wrap(async (req, res) => {
    const data = await context(req, await scope(req));
    const { lessons, reviewedEvidence, programs, goals, ...view } = data;
    res.json(view);
  }));

  router.post(`${path}/decisions`, wrap(async (req, res) => {
    const scoped = await scope(req, true), caller = req.schoolCaller;
    const competencyId = requireId(req.body.competencyId), state = req.body.state;
    if (!competencyById(competencyId) || !['confirmed', 'reopened'].includes(state)) fail(400, 'VALIDATION', 'Choose a framework competency and assessment decision.');
    const reason = requireText(req.body.reason, 'Assessment reason', 2000);
    await getFirestore().runTransaction(async tx => {
      const data = await context(req, scoped, tx);
      if (data.revision !== req.body.revision) fail(409, 'CONFLICT', 'The competency record changed. Reload before assessing.');
      const prior = data.achievements.find(d => d.competencyId === competencyId);
      if (state === 'reopened' && prior?.state !== 'confirmed') fail(409, 'CONFLICT', 'Only a confirmed competency can be reopened.');
      const evidence = state === 'confirmed' ? data.reviewedEvidence.find(e => e.offeringId === req.body.offeringId && e.submissionId === req.body.submissionId && e.competencyIds.includes(competencyId)) : prior.evidence;
      if (!evidence) fail(400, 'VALIDATION', 'Select reviewed evidence mapped to this competency and the current lesson version.');
      const decision = { competencyId, state, reason, evidence, frameworkVersion: FRAMEWORK_VERSION,
        reviewerUid: caller.uid, assessedAt: now(), revision: data.revision + 1 };
      const history = scoped.ref.collection('decisions').doc();
      tx.create(history, decision);
      tx.set(scoped.ref.collection('mastery').doc(competencyId), { ...decision, decisionId: history.id });
      tx.set(scoped.ref, { revision: data.revision + 1, updatedAt: now() });
      const achieved = confirmedIds([...data.achievements.filter(d => d.competencyId !== competencyId), decision]);
      for (const goal of data.quests.filter(g => g.state !== 'archived')) {
        const complete = goal.competencyIds?.length && goal.competencyIds.every(id => achieved.has(id));
        const nextState = complete ? 'achieved' : 'active';
        if (goal.state !== nextState) tx.update(root(req.schoolId).collection('learnerGoals').doc(goal.id), { state: nextState, revision: goal.revision + 1, updatedAt: now() });
      }
      audit(tx, req.schoolId, caller, state === 'confirmed' ? 'COMPETENCY_CONFIRMED' : 'COMPETENCY_REOPENED', history.path);
    });
    res.status(201).json({ saved: true });
  }));

  router.post(`${path}/choose`, wrap(async (req, res) => {
    const scoped = await scope(req);
    if (req.schoolCaller.role !== 'student') fail(403, 'FORBIDDEN', 'The learner chooses their own quest.');
    const recommendationId = requireText(req.body.recommendationId, 'Suggested quest', 330);
    const goalId = `pathway-${createHash('sha256').update(JSON.stringify([scoped.uid, scoped.classId, recommendationId])).digest('hex')}`;
    const ref = root(req.schoolId).collection('learnerGoals').doc(goalId);
    let duplicate = false;
    await getFirestore().runTransaction(async tx => {
      const data = await context(req, scoped, tx);
      const previous = data.quests.find(g => g.id === goalId);
      if (previous) { duplicate = true; return; }
      if (data.revision !== req.body.revision) fail(409, 'CONFLICT', 'Your achievements changed. Reload the suggestions before choosing.');
      const choice = data.recommendations.find(r => r.id === recommendationId);
      if (!choice) fail(409, 'CONFLICT', 'This suggestion is no longer available. Reload to see your next choices.');
      tx.create(ref, { learnerUid: scoped.uid, classId: scoped.classId, target: choice.goal, domain: 'pbl',
        dueDate: null, state: 'active', creatorUid: req.schoolCaller.uid, acknowledged: true, revision: 1,
        source: 'competency-pathway', recommendationId, competencyIds: choice.competencyIds,
        quest: choice, frameworkVersion: FRAMEWORK_VERSION, createdAt: now() });
      tx.set(scoped.ref, { revision: data.revision + 1, updatedAt: now() });
      audit(tx, req.schoolId, req.schoolCaller, 'PATHWAY_QUEST_CHOSEN', ref.path);
    });
    res.status(duplicate ? 200 : 201).json({ saved: true, goalId, duplicate });
  }));
}
