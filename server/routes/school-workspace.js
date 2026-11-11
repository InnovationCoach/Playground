import { validateCompetencyIds } from '../../src/features/pbl/content/competencyValidation.js';
import { installPathwayRoutes } from '../lib/learnerPathway.js';
import { validateProgram } from '../../src/features/school/programs/programSpec.js';
import { programPrompt, generateProgram } from '../lib/ai/programGeneration.js';
import { installDraftRoutes, linkedActivity, runGeneration } from '../lib/ai/activityDrafts.js';
import { validateActivity, validateActivityResponses, ActivityValidationError } from '../../src/features/activities/spec/activitySpec.js';
import { validateSimulation } from '../../src/features/school/simulationModel.js';
import { Router } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { validateLessonAttachments } from '../lib/lessonMedia.js';
import { randomBytes, createHash } from 'node:crypto';
import { requireClaims } from '../middleware/auth.js';
import { questContext, prepareXp, countSquadEvidence } from '../lib/quest.js';
import { sendError } from '../lib/errors.js';
import { PROGRAM_CATALOGUE, programById } from '../../src/features/pbl/content/programCatalogue.js';
import { CALENDAR_REFERENCE } from '../../src/features/school/calendarReference.js';
import { schoolCaller, schoolAccess, assignedClass, learnerAccess, staff, adminOnly, requireId, requireText, fail, validId, validateSupportCategory, validateSupportStatus } from '../lib/schoolScope.js';
const router = Router();
const now = () => new Date().toISOString();
const hash = code => createHash('sha256').update(code).digest('hex');
const root = id => getFirestore().collection('schools').doc(id);
const wrap = fn => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error instanceof ActivityValidationError) return res.status(400).json({error:{code:error.code,message:error.message,details:error.errors}});
    const aiStatus = {AI_KEY_INVALID:400,AI_NOT_CONFIGURED:409,RATE_LIMITED:429,AI_RATE_LIMITED:429,AI_CAP_REACHED:429,AI_BAD_OUTPUT:422,AI_TIMEOUT:504,AI_UNAVAILABLE:503,VALIDATION:400}[error.code];
    if (error.status || aiStatus) return sendError(res, error.status || aiStatus, error.code === 'AI_RATE_LIMITED' ? 'RATE_LIMITED' : error.code, error.message);
    next(error);
  }
};
const items = snap => snap.docs.map(d => ({
  ...d.data(),
  id: d.id
}));
const date = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};
const audit = (tx, schoolId, caller, action, entityId, details = {}) => tx.set(root(schoolId).collection('auditEvents').doc(), {
  actorUid: caller.uid,
  action,
  entityId,
  ...details,
  createdAt: now()
});
router.use((req, res, next) => /^\/(learning-context|schools|program-enrollments)(\/|$)/.test(req.path) ? next() : next('router'));
router.use(requireClaims);
router.use((req, res, next) => {
  if (!['GET', 'HEAD'].includes(req.method) && (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))) return sendError(res, 400, 'VALIDATION', 'A JSON object is required.');
  next();
});
router.use(async (req, res, next) => {
  try {
    req.schoolCaller = await schoolCaller(req);
    next();
  } catch (error) {
    if (error.status) return sendError(res, error.status, error.code, error.message);
    next(error);
  }
});
router.get('/learning-context', wrap(async (req, res) => {
  const caller = req.schoolCaller,
    db = getFirestore();
  const ids = new Set(caller.schoolIds);
  if (caller.role === 'parent') {
    const links = await db.collection('parentLinks').where('parentUid', '==', caller.uid).where('status', '==', 'active').get();
    for (const link of links.docs) {
      const child = await db.collection('users').doc(link.data().studentUid).get();
      if (child.exists) (child.data().schoolIds || []).filter(validId).forEach(id => ids.add(id));
    }
  }
  const schools = [];
  for (const id of ids) {
    const s = await root(id).get();
    if (s.exists && s.data().status !== 'suspended') schools.push({
      id,
      name: s.data().name || id,
      timezone: s.data().timezone || 'Asia/Bangkok',
      features: { questMode: s.data().features?.questMode === true }
    });
  }
  const classes = [];
  for (const id of caller.role === 'student' ? (caller.profile.classIds || []).filter(validId) : caller.classIds) {
    const c = await db.collection('classes').doc(id).get();
    if (c.exists && ids.has(c.data().schoolId) && c.data().status !== 'archived') classes.push({
      id,
      name: c.data().name || id,
      schoolId: c.data().schoolId
    });
  }
  if (caller.role === 'admin') for (const school of schools) {
    const cs = await db.collection('classes').where('schoolId', '==', school.id).get();
    cs.docs.forEach(c => {
      if (!classes.some(x => x.id === c.id) && c.data().status !== 'archived') classes.push({
        id: c.id,
        name: c.data().name || c.id,
        schoolId: school.id
      });
    });
  }
  res.json({
    role: caller.role,
    schools,
    classes,
    providerStatus: {
      cambrilearn: 'access_pending',
      edmentum: 'access_pending'
    }
  });
}));
router.use('/schools/:schoolId', async (req, res, next) => {
  try {
    req.school = await schoolAccess(req.schoolCaller, req.params.schoolId);
    req.schoolId = req.params.schoolId;
    next();
  } catch (error) {
    if (error.status) return sendError(res, error.status, error.code, error.message);
    next(error);
  }
});
async function offeringAccess(req, id, write = false) {
  requireId(id);
  const caller = req.schoolCaller;
  const ref = root(req.schoolId).collection('programOfferings').doc(id),
    snap = await ref.get(),
    value = snap.data();
  if (!value) fail(404, 'NOT_FOUND', 'This program offering was not found.');
  if (caller.role === 'admin') return {
    ref,
    value
  };
  if (staff(caller) && value.classIds?.some(c => caller.classIds.includes(c))) return {
    ref,
    value
  };
  if (!write && caller.role === 'student' && value.status === 'published') {
    const member = await ref.collection('members').doc(caller.uid).get();
    if (member.exists && member.data().status === 'active' && value.classIds?.includes(member.data().classId) && caller.profile.classIds?.includes(member.data().classId)) return {
      ref,
      value
    };
  }
  fail(403, 'FORBIDDEN', 'You do not have access to this program offering.');
}
installDraftRoutes(router, wrap, offeringAccess, programById);

// School feature switches (admin only). Pilots such as Teen Quest are turned on
// one school at a time; learning-context exposes the result to every role.
router.patch('/schools/:schoolId/features', wrap(async (req, res) => {
  const caller = req.schoolCaller;
  adminOnly(caller);
  if (typeof req.body.questMode !== 'boolean') fail(400, 'VALIDATION', 'questMode must be true or false.');
  let features;
  await getFirestore().runTransaction(async tx => {
    const ref = root(req.schoolId), snap = await tx.get(ref);
    features = { ...(snap.data()?.features || {}), questMode: req.body.questMode };
    tx.update(ref, { features, updatedAt: now() });
    audit(tx, req.schoolId, caller, req.body.questMode ? 'FEATURE_QUEST_ON' : 'FEATURE_QUEST_OFF', req.schoolId);
  });
  res.json({ features: { questMode: features.questMode === true } });
}));
router.get('/schools/:schoolId/program-offerings', wrap(async (req, res) => {
  const caller = req.schoolCaller;
  if (caller.role === 'parent') return res.json({
    items: []
  });
  const snap = await root(req.schoolId).collection('programOfferings').get(),
    list = [];
  for (const d of snap.docs) {
    const value = d.data();
    if (caller.role === 'admin' || staff(caller) && value.classIds?.some(c => caller.classIds.includes(c))) list.push({
      ...value,
      id: d.id
    });else if (caller.role === 'student' && value.status === 'published') {
      const m = await d.ref.collection('members').doc(caller.uid).get();
      if (m.exists && m.data().status === 'active' && value.classIds?.includes(m.data().classId) && caller.profile.classIds?.includes(m.data().classId)) list.push({
        ...value,
        id: d.id
      });
    }
  }
  res.json({
    items: await Promise.all(list.sort((a, b) => a.semester - b.semester).map(async offering => ({...offering, attachments: await signedMedia(offering.attachments)})))
  });
}));
router.post('/schools/:schoolId/program-drafts/convert', wrap(async (req, res) => {
  const caller = req.schoolCaller;
  if (caller.role !== 'admin' && !staff(caller)) fail(403,'FORBIDDEN','Only coaches and admins can design programs.');
  await assignedClass(caller, req.schoolId, requireId(req.body.classId));
  const prompt = programPrompt(req.body);
  const result = await runGeneration(req, adapter => generateProgram(adapter, prompt), async tx => {
    const user = await tx.get(getFirestore().collection('users').doc(caller.uid));
    const cls = await tx.get(getFirestore().collection('classes').doc(req.body.classId));
    const school = await tx.get(root(req.schoolId));
    const profile = user.data();
    if (!school.exists || school.data().status === 'suspended' || !profile || profile.status === 'suspended' || profile.role !== caller.role || !profile.schoolIds?.includes(req.schoolId) || (caller.role !== 'admin' && !profile.classIds?.includes(req.body.classId)) || !cls.exists || cls.data().schoolId !== req.schoolId || cls.data().status === 'archived') fail(403,'FORBIDDEN','Your school or class assignment changed during conversion.');
    return () => audit(tx,req.schoolId,caller,'PROGRAM_CONVERTED',req.body.classId);
  });
  res.json({program:result});
}));
router.post('/schools/:schoolId/program-offerings', wrap(async (req, res) => {
  const caller = req.schoolCaller;
  if (caller.role !== 'admin' && !staff(caller)) fail(403, 'FORBIDDEN', 'Only coaches and admins can create program offerings.');
  const custom = req.body.programId === 'custom';
  let designed;
  try { if (req.body.programDraft !== undefined) { if (!custom) fail(400,'VALIDATION','Program drafts require a custom program.'); designed = validateProgram(req.body.programDraft); } } catch (e) { fail(400,'VALIDATION',e.message); }
  const program = custom ? {
    id: `custom-${randomBytes(8).toString('hex')}`,
    title: designed?.title || requireText(req.body.title, 'Program title', 200),
    drivingQuestion: designed?.drivingQuestion || requireText(req.body.drivingQuestion, 'Driving question', 1000),
    semester: Number(req.body.semester || 1), gradeBand: designed?.gradeBand || 'Coach-created program',
    ...(designed ? {overview:designed.overview} : {}),
    milestones: designed?.milestones || [{id:'explore',title:'Explore and predict'},{id:'experiment',title:'Build and experiment'},{id:'reflect',title:'Reflect and share'}], rubric: []
  } : programById(req.body.programId);
  if (!program) fail(400, 'VALIDATION', 'Choose a school program or create a custom program.');
  if (!Number.isInteger(program.semester) || program.semester < 1 || program.semester > 3) fail(400, 'VALIDATION', 'Choose semester 1–3.');
  const yearId = requireId(req.body.yearId),
    classIds = req.body.classIds;
  if (!Array.isArray(classIds) || !classIds.length || classIds.length > 20 || new Set(classIds).size !== classIds.length) fail(400, 'VALIDATION', 'Choose 1–20 unique classes.');
  if (designed && classIds.length !== 1) fail(400,'VALIDATION','Assign a program draft to one class at a time.');
  for (const id of classIds) await assignedClass(caller, req.schoolId, id);
  const ref = root(req.schoolId).collection('programOfferings').doc(`${yearId}-${program.id}`);
  const value = {
    programId: program.id,
    title: program.title,
    ...(custom ? { programDefinition: program } : {}),
    semester: program.semester,
    yearId,
    classIds,
    status: designed ? 'draft' : 'published',
    revision: 1,
    createdAt: now(),
    createdBy: caller.uid
  };
  // No legacy term record is renamed or migrated by this operation.
  await getFirestore().runTransaction(async tx => {
    if ((await tx.get(ref)).exists) fail(409, 'CONFLICT', 'This offering already exists for the school year.');
    tx.create(ref, value);
    if (designed) for (const classId of classIds) for (const item of [...designed.activities,...designed.simulations]) {
      const lesson = ref.collection('lessons').doc();
      tx.create(lesson,{...item,classId,simulation:item.simulation || null,attachments:[],status:'draft',revision:1,authorUid:caller.uid,createdAt:now(),updatedAt:now()});
    }
    audit(tx, req.schoolId, caller, 'OFFERING_CREATED', ref.id);
  });
  res.status(201).json({
    ...value,
    id: ref.id
  });
}));
router.patch('/schools/:schoolId/program-offerings/:offeringId/media', wrap(async (req,res) => {
  const {ref,value} = await offeringAccess(req,req.params.offeringId,true), caller=req.schoolCaller;
  if (caller.role !== 'admin' && value.createdBy !== caller.uid) fail(403,'FORBIDDEN','Only the program creator can manage its resources.');
  for (const id of value.classIds) await assignedClass(caller,req.schoolId,id);
  const attachments=await validateLessonAttachments(req.body.attachments,`programMedia/${req.schoolId}/${ref.id}/`,lessonBucket);
  let revision;
  await getFirestore().runTransaction(async tx => {
    const snap=await tx.get(ref), current=snap.data();
    if (!current || current.revision !== req.body.revision) fail(409,'CONFLICT','The program changed. Reload before saving its resources.');
    if (caller.role !== 'admin' && current.createdBy !== caller.uid) fail(403,'FORBIDDEN','Program ownership changed.');
    if (JSON.stringify(current.classIds) !== JSON.stringify(value.classIds)) fail(409,'CONFLICT','Program classes changed. Reload before saving.');
    revision=current.revision+1;
    tx.update(ref,{attachments,revision,updatedAt:now()});
    audit(tx,req.schoolId,caller,'PROGRAM_MEDIA_UPDATED',ref.id);
  });
  res.json({saved:true,revision});
}));
router.patch('/schools/:schoolId/program-offerings/:offeringId/definition', wrap(async (req,res) => {
  const {ref,value} = await offeringAccess(req,req.params.offeringId,true);
  for (const id of value.classIds) await assignedClass(req.schoolCaller,req.schoolId,id);
  let definition;
  try { definition=validateProgram({...req.body.programDefinition,activities:[],simulations:[]}); } catch(e) {fail(400,'VALIDATION',e.message);}
  await getFirestore().runTransaction(async tx => {
    const snap=await tx.get(ref), current=snap.data();
    if (!current?.programDefinition || current.status !== 'draft' || current.revision !== req.body.revision) fail(409,'CONFLICT','The program changed. Reload before saving.');
    const lessons=await tx.get(ref.collection('lessons'));
    if (lessons.docs.some(d=>!definition.milestones.some(m=>m.id===d.data().milestoneId))) fail(400,'VALIDATION','A milestone still has linked lessons.');
    const {activities,simulations,...details}=definition;
    tx.update(ref,{title:details.title,programDefinition:{...details,id:current.programId,semester:current.semester,rubric:current.programDefinition.rubric || []},revision:current.revision+1,updatedAt:now()});
    audit(tx,req.schoolId,req.schoolCaller,'PROGRAM_DETAILS_UPDATED',ref.id);
  });
  res.json({saved:true});
}));
router.post('/schools/:schoolId/program-offerings/:offeringId/publish', wrap(async (req,res) => {
  const {ref,value} = await offeringAccess(req,req.params.offeringId,true);
  // Publishing affects the whole offering, so require authority over every assigned class.
  for (const id of value.classIds) await assignedClass(req.schoolCaller,req.schoolId,id);
  await getFirestore().runTransaction(async tx => {
    const snap = await tx.get(ref);
    const current = snap.data();
    if (!current || current.revision !== req.body.revision || current.status !== 'draft') fail(409,'CONFLICT','The program changed. Reload before publishing.');
    const lessons = await tx.get(ref.collection('lessons'));
    if (!lessons.size || lessons.size > 40) fail(400,'VALIDATION','Add 1–40 lessons before publishing.');
    for (const d of lessons.docs) {
      const lesson = d.data();
      if (lesson.status === 'draft' && lesson.authorUid !== req.schoolCaller.uid && req.schoolCaller.role !== 'admin') fail(403,'FORBIDDEN','Only the author can publish a draft lesson.');
      if (lesson.status === 'draft' && lesson.activity?.provenance?.aiAssisted && req.body.safetyConfirmed !== true) fail(400,'SAFETY_CONFIRMATION_REQUIRED','Confirm the activity safety review before publishing.');
      if (!current.classIds.includes(lesson.classId)) fail(400,'VALIDATION','A lesson is outside the program class.');
      lessonBody(lesson,current.programDefinition || programById(current.programId));
    }
    for (const d of lessons.docs) if (d.data().status === 'draft') tx.update(d.ref,{...(d.data().activity ? {activity:{...d.data().activity,provenance:{...d.data().activity.provenance,reviewedBy:req.schoolCaller.uid,reviewedAt:now()}}} : {}),status:'published',revision:d.data().revision+1,publishedAt:now(),updatedAt:now()});
    tx.update(ref,{status:'published',revision:current.revision+1,updatedAt:now()});
    audit(tx,req.schoolId,req.schoolCaller,'PROGRAM_PUBLISHED',ref.id);
  });
  res.json({published:true});
}));
router.patch('/schools/:schoolId/program-offerings/:offeringId', wrap(async (req, res) => {
  const caller = req.schoolCaller;
  adminOnly(caller);
  const {
      ref
    } = await offeringAccess(req, req.params.offeringId, true),
    classIds = req.body.classIds;
  if (!Array.isArray(classIds) || !classIds.length || classIds.length > 20 || new Set(classIds).size !== classIds.length) fail(400, 'VALIDATION', 'Choose 1–20 unique classes.');
  for (const id of classIds) await assignedClass(caller, req.schoolId, id);
  await getFirestore().runTransaction(async tx => {
    const snap = await tx.get(ref),
      value = snap.data();
    if (value.revision !== req.body.revision) fail(409, 'CONFLICT', 'Program assignments changed. Reload before saving.');
    tx.update(ref, {
      classIds,
      revision: value.revision + 1,
      updatedAt: now()
    });
    audit(tx, req.schoolId, caller, 'OFFERING_CLASSES_UPDATED', ref.id);
  });
  res.json({
    saved: true
  });
}));
router.post('/schools/:schoolId/program-offerings/:offeringId/codes', wrap(async (req, res) => {
  const caller = req.schoolCaller;
  const {
    value
  } = await offeringAccess(req, req.params.offeringId, true);
  const classId = requireId(req.body.classId);
  await assignedClass(caller, req.schoolId, classId);
  if (!value.classIds.includes(classId)) fail(400, 'VALIDATION', 'Choose a class in this offering.');
  const days = Number(req.body.days || 30);
  if (!Number.isInteger(days) || days < 1 || days > 180) fail(400, 'VALIDATION', 'Code expiry must be 1–180 days.');
  const code = randomBytes(6).toString('hex').toUpperCase(),
    ref = getFirestore().collection('programEnrollmentCodes').doc(hash(code));
  const record = {
    schoolId: req.schoolId,
    offeringId: req.params.offeringId,
    classId,
    expiresAt: new Date(Date.now() + days * 86400000).toISOString(),
    revoked: false,
    createdBy: caller.uid,
    createdAt: now()
  };
  const batch = getFirestore().batch();
  batch.create(ref, record);
  audit(batch, req.schoolId, caller, 'ENROLLMENT_CODE_ISSUED', ref.id);
  await batch.commit();
  res.status(201).json({
    id: ref.id,
    code,
    ...record
  });
}));
router.delete('/schools/:schoolId/program-codes/:codeId', wrap(async (req, res) => {
  const ref = getFirestore().collection('programEnrollmentCodes').doc(requireId(req.params.codeId));
  const codeRecord = await ref.get();
  if (!codeRecord.exists || codeRecord.data().schoolId !== req.schoolId) fail(404, 'NOT_FOUND', 'Code not found.');
  await offeringAccess(req, codeRecord.data().offeringId, true);
  await assignedClass(req.schoolCaller, req.schoolId, codeRecord.data().classId);
  await getFirestore().runTransaction(async tx => {
    const s = await tx.get(ref);
    if (!s.exists || s.data().schoolId !== req.schoolId) fail(404, 'NOT_FOUND', 'Code not found.');
    tx.update(ref, {
      revoked: true
    });
    audit(tx, req.schoolId, req.schoolCaller, 'CODE_REVOKED', ref.id);
  });
  res.json({
    revoked: true
  });
}));
router.post('/program-enrollments/join', wrap(async (req, res) => {
  const caller = req.schoolCaller;
  if (caller.role !== 'student') fail(403, 'FORBIDDEN', 'Only learners can join a program.');
  const rate = getFirestore().collection('programJoinAttempts').doc(caller.uid);
  await getFirestore().runTransaction(async tx => {
    const s = await tx.get(rate),
      attempts = (s.data()?.attempts || []).filter(t => t > Date.now() - 900000);
    if (attempts.length >= 10) fail(429, 'RATE_LIMITED', 'Please wait before trying more codes.');
    tx.set(rate, {
      attempts: [...attempts, Date.now()]
    });
  });
  const code = requireText(req.body.code, 'Class code', 30).replace(/[\s-]/g, '').toUpperCase();
  const ref = getFirestore().collection('programEnrollmentCodes').doc(hash(code));
  let result;
  await getFirestore().runTransaction(async tx => {
    const snap = await tx.get(ref),
      value = snap.data();
    if (!value || value.revoked || !Number.isFinite(Date.parse(value.expiresAt)) || Date.parse(value.expiresAt) <= Date.now()) fail(404, 'NOT_FOUND', 'This code is invalid, expired or disabled. Ask your coach for a current code.');
    const school = await tx.get(root(value.schoolId)),
      c = await tx.get(getFirestore().collection('classes').doc(value.classId));
    if (!school.exists || !c.exists || c.data().schoolId !== value.schoolId || !caller.schoolIds.includes(value.schoolId) || c.data().status === 'archived') fail(403, 'FORBIDDEN', 'Ask your school to check your learner membership before joining.');
    const offering = root(value.schoolId).collection('programOfferings').doc(value.offeringId),
      o = await tx.get(offering);
    if (!o.exists || o.data().status !== 'published' || !o.data().classIds?.includes(value.classId)) fail(409, 'CONFLICT', 'This program is not accepting enrollment.');
    const membership = offering.collection('members').doc(caller.uid),
      m = await tx.get(membership);
    result = {
      offeringId: value.offeringId,
      programId: o.data().programId,
      schoolId: value.schoolId,
      classId: value.classId,
      title: o.data().title,
      alreadyEnrolled: m.exists && m.data().status === 'active'
    };
    if (result.alreadyEnrolled) return;
    const userRef = getFirestore().collection('users').doc(caller.uid),
      user = await tx.get(userRef);
    if (!user.exists || user.data().role !== 'student' || user.data().status === 'suspended' || !user.data().schoolIds?.includes(value.schoolId)) fail(403, 'FORBIDDEN', 'Learner membership changed. Ask your school to check access.');
    tx.set(membership, {
      learnerUid: caller.uid,
      classId: value.classId,
      status: 'active',
      enrolledAt: now(),
      source: 'class_code'
    });
    tx.update(userRef, {
      classIds: [...new Set([...(user.data().classIds || []), value.classId])]
    });
    audit(tx, value.schoolId, caller, 'PROGRAM_ENROLLED', membership.path);
  });
  res.json(result);
}));
router.get('/schools/:schoolId/program-offerings/:offeringId/lessons', wrap(async (req, res) => {
  const {
      ref,
      value
    } = await offeringAccess(req, req.params.offeringId),
    caller = req.schoolCaller;
  let list = items(await ref.collection('lessons').get());
  if (caller.role !== 'admin') list = list.filter(l => value.classIds.includes(l.classId) && (staff(caller) ? caller.classIds : caller.profile.classIds || []).includes(l.classId) && (staff(caller) || l.status === 'published'));
  // URLs are issued only after program/class/publication access has been checked.
  list = await Promise.all(list.map(async lesson => ({ ...lesson, attachments: await Promise.all((lesson.attachments || []).map(async attachment => {
    const [url] = await lessonBucket().file(attachment.path).getSignedUrl({ action: 'read', expires: Date.now() + 60 * 60 * 1000 });
    return { ...attachment, url };
  })) })));
  res.json({ items: list.sort((a, b) => a.createdAt.localeCompare(b.createdAt)) });
}));
const lessonBucket = () => getStorage().bucket(process.env.FIREBASE_STORAGE_BUCKET || 'dnd-master-73449.firebasestorage.app');
async function signedMedia(attachments = []) {
  return Promise.all(attachments.map(async attachment => {
    const [url] = await lessonBucket().file(attachment.path).getSignedUrl({action:'read', expires:Date.now()+60*60*1000});
    return {...attachment,url};
  }));
}


function lessonBody(body, program) {
  const title = requireText(body.title, 'Lesson title'),
    outcome = requireText(body.outcome, 'Learning outcome', 1000);

  let instructions = typeof body.instructions === 'string' ? body.instructions.trim() : '';
  if (!instructions && Array.isArray(body.steps) && body.steps.length > 0) {
    instructions = body.steps.map((s, i) => `Step ${i + 1}: ${s.title || ''}\n${s.instructions || ''}`).join('\n\n').trim();
  }
  if (!instructions) fail(400, 'VALIDATION', 'Lesson instructions or steps are required.');
  if (instructions.length > 10000) fail(400, 'VALIDATION', 'Instructions must contain at most 10000 characters.');

  if (!program.milestones.some(m => m.id === body.milestoneId)) fail(400, 'VALIDATION', 'Choose a milestone in this program.');
  let simulation;
  try { simulation = validateSimulation(body.simulation); } catch (error) { fail(400, 'VALIDATION', error.message); }

  if (body.steps !== undefined && (!Array.isArray(body.steps) || body.steps.length > 20)) fail(400, 'VALIDATION', 'Choose up to 20 learning steps. Nothing has been saved.');
  const steps = Array.isArray(body.steps) ? body.steps.slice(0, 20).map((s, idx) => ({
    id: typeof s.id === 'string' && s.id ? s.id.slice(0, 80) : `step-${idx + 1}`,
    order: idx + 1,
    title: typeof s.title === 'string' ? s.title.slice(0, 200).trim() : `Step ${idx + 1}`,
    type: ['introduction', 'task', 'resource', 'practice', 'reflection', 'submission'].includes(s.type) ? s.type : 'task',
    instructions: typeof s.instructions === 'string' ? s.instructions.slice(0, 5000) : '',
    durationMinutes: Number.isFinite(Number(s.durationMinutes)) ? Math.max(1, Math.min(240, Number(s.durationMinutes))) : 15,
    competencyIds: validateCompetencyIds(s.competencyIds, {label: `Step ${idx + 1} competencies`, max: 10})
  })) : [];

  const competencyIds = validateCompetencyIds(body.competencyIds);
  const prerequisiteCompetencyIds = validateCompetencyIds(body.prerequisiteCompetencyIds, { label: 'Prerequisite competencies' });
  if (prerequisiteCompetencyIds.some(id => competencyIds.includes(id))) fail(400, 'VALIDATION', 'A target competency cannot also be its own prerequisite.');
  const successCriteria = Array.isArray(body.successCriteria) ? body.successCriteria.slice(0, 15).map(c => typeof c === 'string' ? c.slice(0, 500).trim() : '').filter(Boolean) : [];
  const estimatedMinutes = Number.isFinite(Number(body.estimatedMinutes)) ? Math.max(5, Math.min(600, Number(body.estimatedMinutes))) : 45;
  const prerequisites = typeof body.prerequisites === 'string' ? body.prerequisites.slice(0, 1000).trim() : '';

  const evidenceSpec = body.evidenceSpec && typeof body.evidenceSpec === 'object' ? {
    type: body.evidenceSpec.type === 'team' ? 'team' : 'individual',
    acceptedFormats: Array.isArray(body.evidenceSpec.acceptedFormats) ? body.evidenceSpec.acceptedFormats.slice(0, 10) : ['document', 'media'],
    reviewer: typeof body.evidenceSpec.reviewer === 'string' ? body.evidenceSpec.reviewer.slice(0, 100) : 'coach',
    completionRule: typeof body.evidenceSpec.completionRule === 'string' ? body.evidenceSpec.completionRule.slice(0, 100) : 'rubric'
  } : {
    type: 'individual',
    acceptedFormats: ['document', 'media'],
    reviewer: 'coach',
    completionRule: 'rubric'
  };

  return {
    title,
    outcome,
    instructions,
    steps,
    competencyIds,
    prerequisiteCompetencyIds,
    successCriteria,
    estimatedMinutes,
    prerequisites,
    evidenceSpec,
    simulation,
    ...(body.activity === undefined ? {} : {activity: validateActivity({...body.activity, provenance: {aiAssisted: false}})}),
    milestoneId: body.milestoneId,
    classId: requireId(body.classId)
  };
}
router.post('/schools/:schoolId/program-offerings/:offeringId/lessons', wrap(async (req, res) => {
  const caller = req.schoolCaller,
    {
      ref,
      value
    } = await offeringAccess(req, req.params.offeringId, true),
    content = lessonBody(req.body, value.programDefinition || programById(value.programId));
  await assignedClass(caller, req.schoolId, content.classId);
  if (!value.classIds.includes(content.classId)) fail(403, 'FORBIDDEN', 'This class is not in the program.');
  if (req.body.attachments?.length) fail(400, 'VALIDATION', 'Save the draft before uploading media.');
  const lesson = ref.collection('lessons').doc(),
    record = {
      ...content,
      attachments: [],
      status: 'draft',
      revision: 1,
      authorUid: caller.uid,
      createdAt: now(),
      updatedAt: now()
    };
  await getFirestore().runTransaction(async tx => {
    const provenance = await linkedActivity(req, ref, req.body, content.classId, tx);
    if (provenance) {
      if (!record.activity) fail(400, 'VALIDATION', 'Include the activity for this AI draft.');
      record.activity = validateActivity({...record.activity, provenance});
      record.activityDraftId = req.body.activityDraftId;
    }
    tx.create(lesson, record);
    audit(tx, req.schoolId, caller, 'LESSON_DRAFTED', lesson.path);
  });
  res.status(201).json({
    ...record,
    id: lesson.id
  });
}));
router.patch('/schools/:schoolId/program-offerings/:offeringId/lessons/:lessonId', wrap(async (req, res) => {
  const caller = req.schoolCaller,
    {
      ref,
      value
    } = await offeringAccess(req, req.params.offeringId, true),
    content = lessonBody(req.body, value.programDefinition || programById(value.programId));
  await assignedClass(caller, req.schoolId, content.classId);
  if (!value.classIds.includes(content.classId)) fail(403, 'FORBIDDEN', 'Class is not in this program.');
  const lesson = ref.collection('lessons').doc(requireId(req.params.lessonId));
  const attachments = req.body.attachments === undefined ? undefined : await validateLessonAttachments(req.body.attachments, `lessonMedia/${req.schoolId}/${ref.id}/${lesson.id}/`, lessonBucket);
  await getFirestore().runTransaction(async tx => {
    const snap = await tx.get(lesson),
      old = snap.data();
    if (!old) fail(404, 'NOT_FOUND', 'Lesson not found.');
    if (old.status !== 'draft' || old.revision !== req.body.revision) fail(409, 'CONFLICT', 'Published lessons are preserved. Create a new lesson version, or reload this draft.');
    if (old.authorUid !== caller.uid && caller.role !== 'admin') fail(403, 'FORBIDDEN', 'Only the author can edit this draft.');
    if (caller.role !== 'admin' && !caller.classIds.includes(old.classId)) fail(403, 'FORBIDDEN', 'Previous class is not assigned to you.');
    const linked = await linkedActivity(req, ref, req.body, content.classId, tx);
    if (linked && !content.activity) fail(400, 'VALIDATION', 'Include the activity for this AI draft.');
    if (content.activity && (linked || old.activity?.provenance?.aiAssisted)) {
      const source = linked || old.activity.provenance;
      content.activity = validateActivity({...content.activity, provenance:{aiAssisted:true,provider:source.provider,model:source.model}});
    }
    tx.update(lesson, {
      ...content,
      ...(linked ? {activityDraftId:req.body.activityDraftId} : {}),
      ...(attachments === undefined ? {} : { attachments }),
      revision: old.revision + 1,
      updatedAt: now()
    });
    audit(tx, req.schoolId, caller, 'LESSON_UPDATED', lesson.path);
  });
  res.json({
    saved: true
  });
}));
router.post('/schools/:schoolId/program-offerings/:offeringId/lessons/:lessonId/publish', wrap(async (req, res) => {
  const caller = req.schoolCaller,
    {
      ref
    } = await offeringAccess(req, req.params.offeringId, true),
    lesson = ref.collection('lessons').doc(requireId(req.params.lessonId));
  let provenance;
  await getFirestore().runTransaction(async tx => {
    const s = await tx.get(lesson),
      value = s.data();
    if (!value) fail(404, 'NOT_FOUND', 'Lesson not found.');
    if (value.authorUid !== caller.uid && caller.role !== 'admin') fail(403, 'FORBIDDEN', 'Only the author can publish this lesson.');
    if (caller.role !== 'admin' && !caller.classIds.includes(value.classId)) fail(403, 'FORBIDDEN', 'Class access changed.');
    if (value.revision !== req.body.revision || value.status !== 'draft') fail(409, 'CONFLICT', 'This lesson changed. Reload before publishing.');
    if (value.activity?.provenance?.aiAssisted && req.body.safetyConfirmed !== true) fail(400, 'SAFETY_CONFIRMATION_REQUIRED', 'Confirm the safety review before publishing.');
    validateCompetencyIds(value.competencyIds);
    const prerequisites = validateCompetencyIds(value.prerequisiteCompetencyIds, { label: 'Prerequisite competencies' });
    if (prerequisites.some(id => value.competencyIds?.includes(id))) fail(400, 'VALIDATION', 'A target competency cannot also be its own prerequisite.');
    if (Array.isArray(value.steps)) for (const step of value.steps) validateCompetencyIds(step.competencyIds, {label: 'Step competencies', max: 10});
    if(value.activity) provenance={...value.activity.provenance,reviewedBy:caller.uid,reviewedAt:now()};
    tx.update(lesson, {
      ...(value.activity ? {activity: {...value.activity, provenance}} : {}),
      status: 'published',
      revision: value.revision + 1,
      publishedAt: now()
    });
    audit(tx, req.schoolId, caller, 'LESSON_PUBLISHED', lesson.path, {aiAssisted: value.activity?.provenance?.aiAssisted === true});
  });
  res.json({
    published: true,
    ...(provenance?{provenance}:{})
  });
}));
router.get('/schools/:schoolId/program-offerings/:offeringId/submissions', wrap(async (req, res) => {
  const caller = req.schoolCaller,
    {
      ref
    } = await offeringAccess(req, req.params.offeringId);
  if (caller.role === 'parent') fail(403, 'FORBIDDEN', 'Private learner evidence is not available to parents.');
  let list = items(await ref.collection('submissions').get());
  if (caller.role === 'student') list = list.filter(s => s.learnerUid === caller.uid);
  if (staff(caller)) {
    const permitted = [];
    for (const submission of list.filter(s => caller.classIds.includes(s.classId))) {
      try {
        await learnerAccess(caller, req.schoolId, submission.learnerUid, submission.classId);
        permitted.push(submission);
      } catch (error) {
        if (error.status !== 403) throw error;
      }
    }
    list = permitted;
  }
  res.json({
    items: list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  });
}));
router.post('/schools/:schoolId/program-offerings/:offeringId/submissions', wrap(async (req, res) => {
  const caller = req.schoolCaller;
  if (caller.role !== 'student') fail(403, 'FORBIDDEN', 'Only learners can submit their work.');
  const {
    ref
  } = await offeringAccess(req, req.params.offeringId);
  const submissionId = requireId(req.body.submissionId),
    lessonId = requireId(req.body.lessonId),
    body = requireText(req.body.body, 'Evidence and reflection', 5000);
  const link = req.body.link || '';
  if (link) {
    try {
      const url = new URL(link);
      if (url.protocol !== 'https:' || url.username || url.password || link.length > 2000) throw new Error();
    } catch {
      fail(400, 'VALIDATION', 'Evidence links must be a valid HTTPS address.');
    }
  }
  const submission = ref.collection('submissions').doc(`${caller.uid}_${submissionId}`);
  const questCtx = await questContext(req.schoolId, req.school);
  let result;
  await getFirestore().runTransaction(async tx => {
    const lesson = await tx.get(ref.collection('lessons').doc(lessonId)),
      l = lesson.data(),
      member = await tx.get(ref.collection('members').doc(caller.uid));
    if (!l || l.status !== 'published' || !member.exists || member.data().status !== 'active' || member.data().classId !== l.classId || !caller.profile.classIds?.includes(l.classId)) fail(403, 'FORBIDDEN', 'You are not enrolled in this lesson class.');
    if (req.body.responses !== undefined && !l.activity) fail(400, 'VALIDATION', 'This lesson has no activity responses.');
    const responses = req.body.responses === undefined ? undefined : validateActivityResponses(l.activity, req.body.responses);
    const existing = await tx.get(submission);
    if (existing.exists) {
      const old = existing.data();
      if (old.lessonId !== lessonId || old.body !== body || old.link !== link || JSON.stringify(old.responses ?? null) !== JSON.stringify(responses ?? null)) fail(409, 'CONFLICT', 'This submission ID already belongs to different evidence.');
      result = {
        ...old,
        id: submission.id
      };
      return;
    }
    if (req.body.expectedLessonRevision !== undefined && req.body.expectedLessonRevision !== l.revision) fail(409, 'CONFLICT', 'The lesson changed since you chose this quest. Keep your work and ask your coach to check the updated lesson before submitting.');
    result = {
      learnerUid: caller.uid,
      classId: l.classId,
      lessonId,
      lessonRevision: l.revision,
      ...(responses === undefined ? {} : {responses}),
      milestoneId: l.milestoneId,
      body,
      link,
      status: 'submitted',
      revision: 1,
      createdAt: now(),
      id: submission.id
    };
    const xp = await prepareXp(tx, questCtx, { uid: caller.uid, type: 'evidence_submitted', sourceId: submission.id, classId: l.classId, schoolId: req.schoolId });
    tx.create(submission, result);
    audit(tx, req.schoolId, caller, 'LESSON_EVIDENCE_SUBMITTED', submission.path);
    xp.apply();
    countSquadEvidence(tx, l.classId);
  });
  res.status(201).json(result);
}));
router.post('/schools/:schoolId/program-offerings/:offeringId/submissions/:submissionId/review', wrap(async (req, res) => {
  const caller = req.schoolCaller,
    {
      ref
    } = await offeringAccess(req, req.params.offeringId, true);
  const submission = ref.collection('submissions').doc(requireId(req.params.submissionId));
  const feedback = requireText(req.body.feedback, 'Feedback', 4000),
    status = req.body.status;
  if (!['reviewed', 'revision_requested'].includes(status)) fail(400, 'VALIDATION', 'Choose a review outcome.');
  const questCtx = await questContext(req.schoolId, req.school);
  await getFirestore().runTransaction(async tx => {
    const snap = await tx.get(submission),
      value = snap.data();
    if (!value) fail(404, 'NOT_FOUND', 'Submission not found.');
    await learnerAccess(caller, req.schoolId, value.learnerUid, value.classId);
    if (value.revision !== req.body.revision) fail(409, 'CONFLICT', 'Another review changed this evidence. Reload before reviewing.');
    // Feedback earns XP whether it approves or asks for a revision: improving counts.
    const xp = await prepareXp(tx, questCtx, { uid: value.learnerUid, type: 'evidence_reviewed', sourceId: submission.id, classId: value.classId, schoolId: req.schoolId });
    xp.apply();
    tx.update(submission, {
      status,
      feedback,
      reviewerUid: caller.uid,
      reviewedAt: now(),
      revision: value.revision + 1
    });
    audit(tx, req.schoolId, caller, 'LESSON_EVIDENCE_REVIEWED', submission.path);
  });
  res.json({
    reviewed: true
  });
}));
router.get('/schools/:schoolId/learner-goals', wrap(async (req, res) => {
  const caller = req.schoolCaller;
  let list = items(await root(req.schoolId).collection('learnerGoals').get());
  if (req.query.learnerUid) {
    await learnerAccess(caller, req.schoolId, req.query.learnerUid, req.query.classId);
    list = list.filter(g => g.learnerUid === req.query.learnerUid);
  } else if (caller.role === 'parent') fail(400, 'VALIDATION', 'Select a linked child.');else if (caller.role === 'student') list = list.filter(g => g.learnerUid === caller.uid);
  if (staff(caller)) {
    const permitted = [];
    for (const goal of list.filter(g => caller.classIds.includes(g.classId))) {
      try {
        await learnerAccess(caller, req.schoolId, goal.learnerUid, goal.classId);
        permitted.push(goal);
      } catch (error) {
        if (error.status !== 403) throw error;
      }
    }
    list = permitted;
  }
  // Parents never receive unpublished or coach-private fields.
  if (caller.role === 'parent') list = list.map(g => g.source === 'competency-pathway' ? {
    id: g.id, learnerUid: g.learnerUid, classId: g.classId, target: g.target, domain: g.domain,
    dueDate: g.dueDate, state: g.state, acknowledged: g.acknowledged, revision: g.revision
  } : g);
  res.json({
    items: list
  });
}));
router.post('/schools/:schoolId/learner-goals', wrap(async (req, res) => {
  const caller = req.schoolCaller;
  if (!staff(caller) && caller.role !== 'admin') fail(403, 'FORBIDDEN', 'Only assigned staff can set learner goals.');
  const {
    learnerUid,
    classId
  } = req.body;
  await learnerAccess(caller, req.schoolId, learnerUid, classId);
  await assignedClass(caller, req.schoolId, classId);
  const learner = await getFirestore().collection('users').doc(learnerUid).get();
  if (!learner.data().classIds?.includes(classId)) fail(403, 'FORBIDDEN', 'The learner is not assigned to this class.');
  const target = requireText(req.body.target, 'Goal', 1000),
    dueDate = req.body.dueDate;
  if (!date(dueDate)) fail(400, 'VALIDATION', 'Choose a valid due date.');
  const domain = req.body.domain;
  if (!['pbl', 'steam', 'academic'].includes(domain)) fail(400, 'VALIDATION', 'Choose a learning area.');
  const ref = root(req.schoolId).collection('learnerGoals').doc(),
    record = {
      learnerUid,
      classId,
      target,
      dueDate,
      domain,
      state: 'active',
      creatorUid: caller.uid,
      revision: 1,
      createdAt: now(),
      acknowledged: false
    };
  const batch = getFirestore().batch();
  batch.create(ref, record);
  audit(batch, req.schoolId, caller, 'GOAL_ASSIGNED', ref.path);
  await batch.commit();
  res.status(201).json({
    ...record,
    id: ref.id
  });
}));
router.patch('/schools/:schoolId/learner-goals/:goalId', wrap(async (req, res) => {
  const caller = req.schoolCaller,
    ref = root(req.schoolId).collection('learnerGoals').doc(requireId(req.params.goalId));
  const questCtx = await questContext(req.schoolId, req.school);
  await getFirestore().runTransaction(async tx => {
    const s = await tx.get(ref),
      g = s.data();
    if (!g) fail(404, 'NOT_FOUND', 'Goal not found.');
    await learnerAccess(caller, req.schoolId, g.learnerUid, g.classId);
    if (g.revision !== req.body.revision) fail(409, 'CONFLICT', 'This goal changed. Reload and try again.');
    let update;
    if (caller.role === 'student') update = {
      acknowledged: true
    };else {
      if (!staff(caller) && caller.role !== 'admin') fail(403, 'FORBIDDEN', 'Only assigned staff can review a goal.');
      if (!['active', 'achieved', 'archived'].includes(req.body.state)) fail(400, 'VALIDATION', 'Choose a valid goal state.');
      if (g.source === 'competency-pathway' && req.body.state !== 'archived') fail(400, 'VALIDATION', 'Assess the quest competencies using reviewed evidence to change achievement.');
      update = {
        state: req.body.state
      };
    }
    let xp = null;
    if (caller.role === 'student' && !g.acknowledged) xp = await prepareXp(tx, questCtx, { uid: g.learnerUid, type: 'goal_acknowledged', sourceId: ref.id, classId: g.classId, schoolId: req.schoolId });
    if (caller.role !== 'student' && update.state === 'achieved' && g.state !== 'achieved') xp = await prepareXp(tx, questCtx, { uid: g.learnerUid, type: 'goal_achieved', sourceId: ref.id, classId: g.classId, schoolId: req.schoolId });
    tx.update(ref, {
      ...update,
      revision: g.revision + 1,
      updatedAt: now()
    });
    audit(tx, req.schoolId, caller, 'GOAL_UPDATED', ref.path);
    xp?.apply();
  });
  res.json({
    saved: true
  });
}));
function calendarBody(body, timezone) {
  const title = requireText(body.title, 'Event title'),
    startDate = body.startDate,
    endDate = body.endDate || startDate;
  if (!date(startDate) || !date(endDate) || endDate < startDate) fail(400, 'VALIDATION', 'Choose a valid event date range.');
  const allDay = body.allDay !== false,
    startTime = allDay ? '' : body.startTime,
    endTime = allDay ? '' : body.endTime;
  const time = t => typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
  if (!allDay && (!time(startTime) || !time(endTime) || startDate === endDate && endTime <= startTime)) fail(400, 'VALIDATION', 'Choose a valid start and end time.');
  return {
    title,
    startDate,
    endDate,
    allDay,
    startTime,
    endTime,
    timezone,
    description: typeof body.description === 'string' ? body.description.slice(0, 4000) : '',
    location: typeof body.location === 'string' ? body.location.slice(0, 200) : '',
    category: typeof body.category === 'string' ? body.category.slice(0, 80) : 'School event',
    status: body.status === 'cancelled' ? 'cancelled' : 'scheduled'
  };
}
router.get('/schools/:schoolId/calendar-events', wrap(async (req, res) => {
  const {
    from,
    to
  } = req.query;
  if (!date(from) || !date(to) || to < from || Date.parse(to) - Date.parse(from) > 366 * 86400000) fail(400, 'VALIDATION', 'Choose a calendar range up to one year.');
  const snapshot = await root(req.schoolId).collection('calendarEvents').where('startDate', '<=', to).get();
  res.json({
    items: items(snapshot).filter(e => e.endDate >= from).sort((a, b) => `${a.startDate}${a.startTime}`.localeCompare(`${b.startDate}${b.startTime}`)),
    timezone: req.school.timezone || 'Asia/Bangkok'
  });
}));
router.post('/schools/:schoolId/calendar-events', wrap(async (req, res) => {
  const caller = req.schoolCaller;
  if (caller.role !== 'admin' && !staff(caller)) fail(403, 'FORBIDDEN', 'Only coaches and admins can manage school events.');
  const content = calendarBody(req.body, req.school.timezone || 'Asia/Bangkok');
  const ref = root(req.schoolId).collection('calendarEvents').doc(),
    value = {
      ...content,
      revision: 1,
      createdBy: caller.uid,
      createdAt: now(),
      updatedAt: now()
    };
  const batch = getFirestore().batch();
  batch.create(ref, value);
  audit(batch, req.schoolId, caller, 'CALENDAR_CREATED', ref.id);
  await batch.commit();
  res.status(201).json({
    ...value,
    id: ref.id
  });
}));
router.post('/schools/:schoolId/calendar-reference/import', wrap(async (req, res) => {
  const caller = req.schoolCaller;
  adminOnly(caller);
  if (req.body.confirmYear !== '2026-2027') fail(400, 'VALIDATION', 'Review and confirm the 2026–2027 reference calendar before importing.');
  let count = 0;
  await getFirestore().runTransaction(async tx => {
    const refs = CALENDAR_REFERENCE.map(e => root(req.schoolId).collection('calendarEvents').doc(e.id));
    const existing = await tx.getAll(...refs);
    count = 0;
    refs.forEach((ref, i) => {
      if (!existing[i].exists) {
        tx.create(ref, {
          ...calendarBody(CALENDAR_REFERENCE[i], req.school.timezone || 'Asia/Bangkok'),
          revision: 1,
          createdBy: caller.uid,
          createdAt: now(),
          updatedAt: now(),
          source: 'school_reference_2026_2027'
        });
        count++;
      }
    });
    if (count) audit(tx, req.schoolId, caller, 'CALENDAR_REFERENCE_IMPORTED', '2026-2027');
  });
  res.json({
    created: count,
    alreadyPresent: CALENDAR_REFERENCE.length - count
  });
}));
router.patch('/schools/:schoolId/calendar-events/:eventId', wrap(async (req, res) => {
  const caller = req.schoolCaller;
  if (caller.role !== 'admin' && !staff(caller)) fail(403, 'FORBIDDEN', 'Only coaches and admins can manage school events.');
  const content = calendarBody(req.body, req.school.timezone || 'Asia/Bangkok'),
    ref = root(req.schoolId).collection('calendarEvents').doc(requireId(req.params.eventId));
  await getFirestore().runTransaction(async tx => {
    const s = await tx.get(ref);
    if (!s.exists) fail(404, 'NOT_FOUND', 'Event not found.');
    if (s.data().revision !== req.body.revision) fail(409, 'CONFLICT', 'This event changed. Reload before saving.');
    tx.update(ref, {
      ...content,
      revision: s.data().revision + 1,
      updatedBy: caller.uid,
      updatedAt: now()
    });
    audit(tx, req.schoolId, caller, 'CALENDAR_UPDATED', ref.id);
  });
  res.json({
    saved: true
  });
}));
router.delete('/schools/:schoolId/calendar-events/:eventId', wrap(async (req, res) => {
  const caller = req.schoolCaller;
  if (caller.role !== 'admin' && !staff(caller)) fail(403, 'FORBIDDEN', 'Only coaches and admins can manage school events.');
  const ref = root(req.schoolId).collection('calendarEvents').doc(requireId(req.params.eventId));
  await getFirestore().runTransaction(async tx => {
    const s = await tx.get(ref);
    if (!s.exists) fail(404, 'NOT_FOUND', 'Event not found.');
    if (s.data().revision !== req.body.revision) fail(409, 'CONFLICT', 'This event changed. Reload before deleting.');
    tx.delete(ref);
    audit(tx, req.schoolId, caller, 'CALENDAR_DELETED', ref.id);
  });
  res.json({
    deleted: true
  });
}));
router.get('/schools/:schoolId/learners', wrap(async (req, res) => {
  const caller = req.schoolCaller,
    db = getFirestore();
  let list = [];
  if (caller.role === 'parent') {
    const links = await db.collection('parentLinks').where('parentUid', '==', caller.uid).where('status', '==', 'active').get();
    for (const link of links.docs) {
      const child = await db.collection('users').doc(link.data().studentUid).get();
      if (child.exists && child.data().schoolIds?.includes(req.schoolId)) list.push({
        ...child.data(),
        id: child.id
      });
    }
  } else if (caller.role === 'student') list = [{
    ...caller.profile,
    id: caller.uid
  }];else {
    const snap = await db.collection('users').where('schoolIds', 'array-contains', req.schoolId).get();
    list = items(snap).filter(l => l.role === 'student' && (caller.role === 'admin' || staff(caller) && l.classIds?.some(c => caller.classIds.includes(c))));
  }
  res.json({
    items: list.map(l => ({
      id: l.id,
      displayName: l.displayName || l.givenNames || 'Learner',
      classIds: l.classIds || []
    })).sort((a, b) => a.displayName.localeCompare(b.displayName))
  });
}));
router.get('/schools/:schoolId/learner-program-summaries', wrap(async(req,res)=>{
  const caller=req.schoolCaller,learnerUid=requireId(req.query.learnerUid);
  const learner=await learnerAccess(caller,req.schoolId,learnerUid,req.query.classId);
  const offerings=await root(req.schoolId).collection('programOfferings').get(),list=[];
  for(const offering of offerings.docs) {
    const value=offering.data(),member=await offering.ref.collection('members').doc(learnerUid).get();
    const classId=member.data()?.classId;
    if(value.status!=='published' || !member.exists || member.data().status!=='active' || !value.classIds?.includes(classId) || !learner.classIds?.includes(classId) || staff(caller) && !caller.classIds.includes(classId))continue;
    const lessons=await offering.ref.collection('lessons').where('classId','==',classId).get();
    const published=lessons.docs.filter(l=>l.data().status==='published');
    const submissions=await offering.ref.collection('submissions').where('learnerUid','==',learnerUid).get();
    const latest=new Map();items(submissions).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).forEach(record=>{if(!latest.has(record.lessonId))latest.set(record.lessonId,record);});
    const records=[...latest.values()];
    list.push({id:offering.id,title:value.title,semester:value.semester,yearId:value.yearId,publishedLessons:published.length,lessonsSubmitted:records.length,lessonsReviewed:records.filter(r=>r.status==='reviewed').length,revisionsRequested:records.filter(r=>r.status==='revision_requested').length});
  }
  res.json({items:list.sort((a,b)=>a.semester-b.semester)});
}));

router.get('/schools/:schoolId/academic-progress', wrap(async (req, res) => {
  const caller = req.schoolCaller,
    learnerUid = requireId(req.query.learnerUid);
  const learner = await learnerAccess(caller, req.schoolId, learnerUid, req.query.classId);
  const snap = await root(req.schoolId).collection('academicSnapshots').where('learnerUid', '==', learnerUid).get();
  const list = items(snap).filter(r => !staff(caller) || caller.classIds.includes(r.classId) && learner.classIds?.includes(r.classId));
  res.json({
    items: list.sort((a, b) => b.dataAsOf.localeCompare(a.dataAsOf) || b.importedAt.localeCompare(a.importedAt)),
    providerStatus: {
      cambrilearn: 'access_pending',
      edmentum: 'access_pending'
    }
  });
}));
router.post('/schools/:schoolId/academic-progress', wrap(async (req, res) => {
  const caller = req.schoolCaller;
  if (!staff(caller) && caller.role !== 'admin') fail(403, 'FORBIDDEN', 'Only assigned staff can record academic observations.');
  const {
    learnerUid,
    classId,
    provider
  } = req.body;
  const learner = await learnerAccess(caller, req.schoolId, learnerUid, classId);
  await assignedClass(caller, req.schoolId, classId);
  if (!learner.classIds?.includes(classId)) fail(403, 'FORBIDDEN', 'The learner is not in this class.');
  if (!['cambrilearn', 'edmentum'].includes(provider)) fail(400, 'VALIDATION', 'Choose an academic provider.');
  const course = requireText(req.body.course, 'Course', 200),
    curriculum = requireText(req.body.curriculum, 'Curriculum / level', 200);
  if ([req.body.completed, req.body.total].some(value => value === null || value === undefined || !['number', 'string'].includes(typeof value) || typeof value === 'string' && !value.trim())) fail(400, 'VALIDATION', 'Enter observed completed and total units. Missing data is not zero.');
  const completed = Number(req.body.completed),
    total = Number(req.body.total);
  if (!Number.isInteger(completed) || !Number.isInteger(total) || completed < 0 || total <= 0 || completed > total) fail(400, 'VALIDATION', 'Completed units must be between zero and the total units.');
  if (!date(req.body.dataAsOf)) fail(400, 'VALIDATION', 'Choose the observation date.');
  const record = {
    learnerUid,
    classId,
    provider,
    course,
    curriculum,
    completed,
    total,
    dataAsOf: req.body.dataAsOf,
    sourceMethod: 'coach_recorded',
    recordedBy: caller.uid,
    importedAt: now()
  };
  const ref = root(req.schoolId).collection('academicSnapshots').doc(),
    batch = getFirestore().batch();
  batch.create(ref, record);
  audit(batch, req.schoolId, caller, 'ACADEMIC_OBSERVATION_RECORDED', ref.id);
  await batch.commit();
  res.status(201).json({
    ...record,
    id: ref.id
  });
}));

router.post('/schools/:schoolId/support-requests', wrap(async (req, res) => {
  const caller = req.schoolCaller;
  if (caller.role !== 'student') fail(403, 'FORBIDDEN', 'Only learners can submit support requests.');
  const classId = requireId(req.body.classId);
  if (!caller.profile.classIds?.includes(classId)) fail(403, 'FORBIDDEN', 'You are not enrolled in this class.');
  const category = validateSupportCategory(req.body.category);
  const note = req.body.note ? requireText(req.body.note, 'Note', 500) : '';
  const offeringId = req.body.offeringId && validId(req.body.offeringId) ? req.body.offeringId : null;
  const lessonId = req.body.lessonId && validId(req.body.lessonId) ? req.body.lessonId : null;
  const record = {
    learnerUid: caller.uid,
    classId,
    offeringId,
    lessonId,
    category,
    note,
    status: 'submitted',
    createdAt: now(),
    acknowledgedAt: null,
    resolvedAt: null,
    assignedCoachUid: null,
    revision: 1
  };
  const ref = root(req.schoolId).collection('supportRequests').doc();
  const batch = getFirestore().batch();
  batch.create(ref, record);
  audit(batch, req.schoolId, caller, 'SUPPORT_REQUEST_SUBMITTED', ref.id);
  await batch.commit();
  res.status(201).json({
    ...record,
    id: ref.id
  });
}));

router.get('/schools/:schoolId/support-requests', wrap(async (req, res) => {
  const caller = req.schoolCaller;
  if (caller.role === 'parent') return res.json({ items: [] });
  const snap = await root(req.schoolId).collection('supportRequests').get();
  let list = items(snap);
  if (caller.role === 'student') {
    list = list.filter(r => r.learnerUid === caller.uid);
  } else if (staff(caller)) {
    list = list.filter(r => caller.classIds.includes(r.classId));
  } else if (caller.role !== 'admin') {
    return res.json({ items: [] });
  }
  res.json({
    items: list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  });
}));

router.patch('/schools/:schoolId/support-requests/:requestId', wrap(async (req, res) => {
  const caller = req.schoolCaller;
  const reqId = requireId(req.params.requestId);
  const status = validateSupportStatus(req.body.status);
  const ref = root(req.schoolId).collection('supportRequests').doc(reqId);
  let updatedRecord = null;
  await getFirestore().runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists) fail(404, 'NOT_FOUND', 'Support request not found.');
    const value = snap.data();
    if (value.revision !== req.body.revision) fail(409, 'CONFLICT', 'Support request status changed. Reload before updating.');

    if (caller.role === 'student') {
      if (value.learnerUid !== caller.uid) fail(403, 'FORBIDDEN', 'You can only update your own support request.');
    } else if (staff(caller)) {
      if (!caller.classIds.includes(value.classId)) fail(403, 'FORBIDDEN', 'You are not assigned to this class.');
    } else if (caller.role !== 'admin') {
      fail(403, 'FORBIDDEN', 'Access denied.');
    }

    const updates = {
      status,
      revision: value.revision + 1,
      updatedAt: now()
    };
    if (['acknowledged', 'checked_in'].includes(status) && !value.acknowledgedAt) {
      updates.acknowledgedAt = now();
    }
    if (status === 'resolved' && !value.resolvedAt) {
      updates.resolvedAt = now();
    }
    if (staff(caller) && !value.assignedCoachUid) {
      updates.assignedCoachUid = caller.uid;
    }

    tx.update(ref, updates);
    audit(tx, req.schoolId, caller, 'SUPPORT_REQUEST_UPDATED', ref.id);
    updatedRecord = { ...value, ...updates, id: ref.id };
  });
  res.json({ saved: true, record: updatedRecord });
}));

router.get('/schools/:schoolId/learner-preferences', wrap(async (req, res) => {
  const caller = req.schoolCaller;
  const learnerUid = req.query.learnerUid ? requireId(req.query.learnerUid) : caller.uid;
  if (caller.role === 'parent') fail(403, 'FORBIDDEN', 'Parents do not have access to private learner preferences.');
  if (caller.role === 'student' && learnerUid !== caller.uid) fail(403, 'FORBIDDEN', 'Learners can only view their own preferences.');
  if (staff(caller)) {
    const classId = req.query.classId;
    await learnerAccess(caller, req.schoolId, learnerUid, classId);
  }
  const ref = root(req.schoolId).collection('learnerPreferences').doc(learnerUid);
  const snap = await ref.get();
  if (!snap.exists) {
    return res.json({
      learnerUid,
      displayMode: 'explore',
      preferredEvidenceFormats: [],
      quietWorkspace: false,
      interests: [],
      updatedAt: null
    });
  }
  res.json({ id: snap.id, ...snap.data() });
}));

router.put('/schools/:schoolId/learner-preferences', wrap(async (req, res) => {
  const caller = req.schoolCaller;
  if (caller.role !== 'student') fail(403, 'FORBIDDEN', 'Only learners can update their learning preferences.');
  const displayMode = ['focus', 'explore'].includes(req.body.displayMode) ? req.body.displayMode : 'explore';
  const quietWorkspace = Boolean(req.body.quietWorkspace);
  const rawFormats = Array.isArray(req.body.preferredEvidenceFormats) ? req.body.preferredEvidenceFormats : [];
  const preferredEvidenceFormats = rawFormats.filter(f => typeof f === 'string' && f.length <= 50).slice(0, 10);
  const rawInterests = Array.isArray(req.body.interests) ? req.body.interests : [];
  const interests = rawInterests.filter(i => typeof i === 'string' && i.length <= 50).slice(0, 10);

  const record = {
    learnerUid: caller.uid,
    displayMode,
    preferredEvidenceFormats,
    quietWorkspace,
    interests,
    updatedAt: now()
  };
  const ref = root(req.schoolId).collection('learnerPreferences').doc(caller.uid);
  const batch = getFirestore().batch();
  batch.set(ref, record, { merge: true });
  audit(batch, req.schoolId, caller, 'LEARNER_PREFERENCES_UPDATED', ref.id);
  await batch.commit();
  res.status(200).json({ id: caller.uid, ...record });
}));

// Compatibility endpoint: fixed learner scaffolds, explicitly not AI inference.
router.post('/schools/:schoolId/ai-drafts', wrap(async (req, res) => {
  const caller = req.schoolCaller;
  if (caller.role === 'parent') fail(403, 'FORBIDDEN', 'Parents cannot generate AI drafts.');

  const allowedKinds = ['plan', 'rephrase', 'deeper-question', 'feedback-prompt'];
  const kind = req.body.kind;
  if (!allowedKinds.includes(kind)) fail(400, 'VALIDATION', 'Provide a valid draft kind.');

  const offeringId = requireId(req.body.offeringId);
  await offeringAccess(req, offeringId);
  const lessonId = req.body.lessonId && validId(req.body.lessonId) ? req.body.lessonId : null;
  const inputText = req.body.input?.text ? requireText(req.body.input.text, 'Input text', 1000) : '';

  const draftTemplates = {
    plan: `1. Choose one game or device context.\n2. Record its power rating (e.g. 50W-200W).\n3. Calculate total kWh used over 1 hour of play.\n4. Document assumptions and ask your coach to review.`,
    rephrase: `Break the campus investigation into 3 short actions: observe 1 room, list 3 energy users, and note which uses the most power.`,
    'deeper-question': `What changes in system energy draw when display graphics settings are reduced from High to Low?`,
    'feedback-prompt': `Which observation data point best supports your conclusion about peak energy consumption?`
  };

  const draftText = draftTemplates[kind] || draftTemplates.plan;
  const createdAtTime = now();
  const expiresAtTime = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

  const record = {
    creatorUid: caller.uid,
    aiAssisted: false,
    source: 'learning-scaffold',
    kind,
    offeringId,
    lessonId,
    inputText,
    text: draftText,
    sources: [{ type: 'program_catalogue', offeringId }],
    status: 'draft',
    createdAt: createdAtTime,
    expiresAt: expiresAtTime
  };

  const ref = root(req.schoolId).collection('aiDrafts').doc();
  const batch = getFirestore().batch();
  batch.create(ref, record);
  audit(batch, req.schoolId, caller, 'LEARNING_SCAFFOLD_CREATED', ref.id);
  await batch.commit();

  res.status(201).json({
    draftId: ref.id,
    kind,
    text: draftText,
    aiAssisted: false,
    source: 'learning-scaffold',
    sources: record.sources,
    createdAt: createdAtTime,
    expiresAt: expiresAtTime
  });
}));

router.post('/schools/:schoolId/ai-drafts/:draftId/accept', wrap(async (req, res) => {
  const caller = req.schoolCaller;
  const draftId = requireId(req.params.draftId);
  const ref = root(req.schoolId).collection('aiDrafts').doc(draftId);

  await getFirestore().runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists) fail(404, 'NOT_FOUND', 'AI draft not found.');
    const value = snap.data();
    if (value.creatorUid !== caller.uid) {
      fail(403, 'FORBIDDEN', 'You do not have access to accept this draft.');
    }
    if (Date.parse(value.expiresAt) <= Date.now()) fail(404, 'NOT_FOUND', 'Learning scaffold expired.');
    await offeringAccess(req, value.offeringId);
    tx.update(ref, {
      status: 'accepted',
      acceptedAt: now(),
      acceptedBy: caller.uid
    });
    audit(tx, req.schoolId, caller, 'AI_DRAFT_ACCEPTED', ref.id);
  });

  res.json({ accepted: true, draftId });
}));

installPathwayRoutes(router, { wrap, root, audit });

export default router;
