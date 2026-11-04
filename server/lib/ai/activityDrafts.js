/** Offering-scoped AI draft workflow. Cloud configuration belongs to the deployment lead. */
import { getFirestore } from 'firebase-admin/firestore';
import { randomUUID } from 'node:crypto';
import { validateActivity, safetyWarnings } from '../../../src/features/activities/spec/activitySpec.js';
import { generateActivity, regenerateActivityBlock } from './activityGeneration.js';
import { createAdapter } from './gemini.js';
import { assignedClass, requireId, requireText, fail } from '../schoolScope.js';

const RESERVE = 116000, LEASE = 15 * 60000;
const iso = () => new Date().toISOString();
const total = usage => (usage.inputTokens || 0) + (usage.outputTokens || 0);
const fresh = draft => draft && Date.parse(draft.expiresAt) > Date.now();
const locked = draft => draft.operation && Date.parse(draft.operation.expiresAt) > Date.now();
export function privacyCheck(values) {
  const text = values.join('\n');
  if (/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(text) || /(?:\+?\d[\s().-]*){8,}/.test(text)) fail(400, 'VALIDATION', 'Remove personal information such as email addresses and phone numbers before using AI.');
}
export function configuredAdapter(req) {
  // Test injection is held on the server, never accepted from a request body.
  if (req.app.locals.activityAdapterFactory) return req.app.locals.activityAdapterFactory();
  const apiKey = process.env.SCHOOL_GEMINI_API_KEY || process.env['school-gemini-api-key'];
  const model = process.env.COACH_ACTIVITY_GEMINI_MODEL || 'gemini-3.5-flash';
  if (!apiKey || apiKey === 'NOT_CONFIGURED' || !model) fail(409, 'AI_NOT_CONFIGURED', 'The school AI connection is not configured. You can still create a manual activity.');
  return createAdapter({ apiKey, model });
}
export async function activeClasses(req, offering) {
  const ids = (offering.classIds || []).filter(id => req.schoolCaller.role === 'admin' || req.schoolCaller.classIds.includes(id));
  const active = [];
  for (const id of ids) {
    try { await assignedClass(req.schoolCaller, req.schoolId, id); active.push(id); }
    catch (error) { if (error.code !== 'FORBIDDEN') throw error; }
  }
  if (!active.length) fail(403, 'FORBIDDEN', 'No active assigned class is available for this program.');
  return active;
}
/** Recheck current provisioned access after inference, before persisting its result. */
async function persistenceClasses(req, offeringRef, tx) {
  const db=getFirestore(), uid=req.schoolCaller.uid;
  const [user,school,offering]=await Promise.all([tx.get(db.collection('users').doc(uid)),tx.get(db.collection('schools').doc(req.schoolId)),tx.get(offeringRef)]);
  const profile=user.data(), value=offering.data();
  if(!profile || profile.status==='suspended' || profile.role!==req.schoolCaller.role || !profile.schoolIds?.includes(req.schoolId) || !school.exists || school.data().status==='suspended' || !value)fail(403,'FORBIDDEN','Your school assignment changed during generation.');
  const ids=(value.classIds||[]).filter(id=>req.schoolCaller.role==='admin'||(req.schoolCaller.classIds.includes(id)&&profile.classIds?.includes(id)));
  const classes=await Promise.all(ids.map(id=>tx.get(db.collection('classes').doc(id))));
  const active=classes.filter(c=>c.exists&&c.data().schoolId===req.schoolId&&c.data().status!=='archived').map(c=>c.id);
  if(!active.length)fail(403,'FORBIDDEN','Your active class assignment changed during generation.');
  return active;
}
export function checkDraft(req, value, classes) {
  if (!fresh(value)) fail(404, 'NOT_FOUND', 'This AI draft is unavailable or expired.');
  if (value.creatorUid !== req.schoolCaller.uid || !value.classIds?.some(id => classes.includes(id))) fail(403, 'FORBIDDEN', 'This AI draft does not belong to your assigned workspace.');
}
export async function linkedActivity(req, offeringRef, body, classId, tx) {
  if (!body.activityDraftId) return null;
  const ref = offeringRef.collection('activityDrafts').doc(requireId(body.activityDraftId));
  const snap = tx ? await tx.get(ref) : await ref.get(), draft = snap.data();
  checkDraft(req, draft, [classId]);
  if (locked(draft) || draft.revision !== body.activityDraftRevision) fail(409, 'CONFLICT', 'The AI draft changed. Reload before saving the lesson.');
  return { aiAssisted: true, provider: draft.provider, model: draft.model };
}
function counters(old, uid, usage, requests = 1) {
  const coach = old.byCoach?.[uid] || {};
  return { ...old, requests: (old.requests || 0) + requests,
    inputTokens: (old.inputTokens || 0) + usage.inputTokens, outputTokens: (old.outputTokens || 0) + usage.outputTokens,
    byCoach: { ...old.byCoach, [uid]: { requests: (coach.requests || 0) + requests,
      inputTokens: (coach.inputTokens || 0) + usage.inputTokens, outputTokens: (coach.outputTokens || 0) + usage.outputTokens } } };
}
async function reserve(req) {
  const db = getFirestore(), uid = req.schoolCaller.uid, id = randomUUID();
  const ref = db.collection('schools').doc(req.schoolId).collection('aiUsage').doc(iso().slice(0, 7));
  const rate = db.collection('programJoinAttempts').doc(`coach-ai-${uid}`);
  await db.runTransaction(async tx => {
    const [usageSnap, rateSnap] = await Promise.all([tx.get(ref), tx.get(rate)]);
    let usage = usageSnap.data() || { requests: 0, inputTokens: 0, outputTokens: 0, byCoach: {}, cap: 2000000 };
    const reservations = { ...usage.reservations };
    // A process crash must never make potentially billable provider work free.
    for (const [key, value] of Object.entries(reservations)) {
      if (Date.parse(value.expiresAt) <= Date.now()) {
        usage = counters(usage, value.uid, {inputTokens:0,outputTokens:value.tokens}); delete reservations[key];
      }
    }
    const attempts = (rateSnap.data()?.attempts || []).filter(t => t > Date.now() - 3600000);
    if (attempts.length >= 10) fail(429, 'RATE_LIMITED', 'You have used 10 AI requests this hour. Please try later.');
    const cap = Number.isSafeInteger(usage.cap) && usage.cap >= 0 ? usage.cap : 2000000;
    if (total(usage) + Object.values(reservations).reduce((sum, r) => sum + r.tokens, 0) + RESERVE > cap) fail(429, 'AI_CAP_REACHED', 'The school AI allowance has insufficient room for another request. You can still edit manually.');
    reservations[id] = { uid, tokens: RESERVE, expiresAt: new Date(Date.now() + LEASE).toISOString() };
    tx.set(ref, { ...usage, cap, reservations }); tx.set(rate, { attempts: [...attempts, Date.now()] });
  });
  return { ref, id, uid };
}
async function settle(reservation, usage, persist) {
  await getFirestore().runTransaction(async tx => {
    const snap = await tx.get(reservation.ref), old = snap.data();
    if (!old?.reservations?.[reservation.id]) fail(409, 'CONFLICT', 'This AI request expired. Please reload.');
    // Read all dependent documents before writing counters or the draft.
    const writeDraft = persist ? await persist(tx) : null;
    const reservations = { ...old.reservations }; delete reservations[reservation.id];
    tx.set(reservation.ref, { ...counters(old, reservation.uid, usage), reservations });
    writeDraft?.();
  });
}
export async function runGeneration(req, task, persist) {
  const adapter = configuredAdapter(req); // Configuration checked before consuming quota.
  const reservation = await reserve(req);
  const usage = { inputTokens: 0, outputTokens: 0 };
  let dispatched = false, completed = 0, calls = 0;
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 45000);
  const tracked = { ...adapter, async complete(prompt, options) {
    if (Buffer.byteLength(prompt.system + prompt.user, 'utf8') > 50000) fail(400, 'VALIDATION', 'The AI prompt is too large. Shorten the selected activity block.');
    if (controller.signal.aborted) fail(504, 'AI_TIMEOUT', 'The AI request timed out.');
    dispatched = true; calls++;
    const result = await adapter.complete(prompt, {...options, signal:controller.signal});
    if (!Number.isSafeInteger(result?.usage?.inputTokens) || !Number.isSafeInteger(result?.usage?.outputTokens) || result.usage.inputTokens < 0 || result.usage.outputTokens < 0) fail(422, 'AI_BAD_OUTPUT', 'The AI provider returned invalid usage.');
    usage.inputTokens += result.usage.inputTokens; usage.outputTokens += result.usage.outputTokens; completed++;
    return result;
  }};
  try {
    const result = await task(tracked, controller.signal);
    await settle(reservation, usage, tx => persist(tx, result));
    return result;
  } catch (error) {
    // On unknown billing retain a conservative debit; known malformed output is still billed.
    if (dispatched && completed < calls) usage.outputTokens += Math.max(0, RESERVE - total(usage));
    await settle(reservation, usage).catch(() => {}); // Unsettled reservation remains charged against admission.
    if (!error.status && !['AI_KEY_INVALID','AI_RATE_LIMITED','AI_BAD_OUTPUT','AI_TIMEOUT','AI_UNAVAILABLE'].includes(error.code)) fail(503,'AI_UNAVAILABLE','The AI draft could not be saved. Your current activity is still available.');
    throw error;
  } finally { clearTimeout(timer); }
}
export function generationContext(body, program) {
  if (body.keySource !== 'school') {
    if (body.keySource === 'personal') fail(409, 'AI_NOT_CONFIGURED', 'Personal AI connections are available in Phase 3. Choose the school connection.');
    fail(400, 'VALIDATION', 'Choose the school AI connection.');
  }
  const prompt = requireText(body.prompt, 'Activity description', 2000);
  if (!['13-15','16-18'].includes(body.ageBand) || !Number.isInteger(body.durationMinutes) || body.durationMinutes < 10 || body.durationMinutes > 240) fail(400, 'VALIDATION', 'Choose an age band and 10–240 minutes.');
  const list = (key, count, length) => {
    const value = body[key] || [];
    if (!Array.isArray(value) || value.length > count) fail(400, 'VALIDATION', `Too many ${key}.`);
    return value.map(item => requireText(item, key, length));
  };
  const milestone = body.milestoneId ? program.milestones.find(m => m.id === body.milestoneId) : null;
  if (body.milestoneId && !milestone) fail(400, 'VALIDATION', 'Choose a milestone in this program.');
  const context = {programTitle:program.title,drivingQuestion:program.drivingQuestion,ageBand:body.ageBand,durationMinutes:body.durationMinutes,materials:list('materials',25,80),standards:list('standards',10,40),...(milestone?{milestoneTitle:milestone.title}:{})};
  privacyCheck([prompt, ...Object.values(context).flat().map(String)]);
  return {prompt,context};
}
export function installDraftRoutes(router, wrap, offeringAccess, programById) {
  const base = '/schools/:schoolId/program-offerings/:offeringId/activity-drafts';
  async function access(req) {
    const offering = await offeringAccess(req, req.params.offeringId, true);
    const classes = await activeClasses(req, offering.value);
    return {...offering,classes};
  }
  async function draftAccess(req) {
    const scope = await access(req), draftRef = scope.ref.collection('activityDrafts').doc(requireId(req.params.draftId));
    const value = (await draftRef.get()).data(); checkDraft(req,value,scope.classes);
    return {...scope,draftRef,draft:value};
  }
  router.post(`${base}/generate`, wrap(async(req,res) => {
    const {ref,value,classes} = await access(req), input = generationContext(req.body,value.programDefinition || programById(value.programId));
    const draftRef = ref.collection('activityDrafts').doc();
    const result = await runGeneration(req, (adapter,signal) => generateActivity({...input,adapter,signal}), async (tx,result) => {
      const currentClasses=(await persistenceClasses(req,ref,tx)).filter(id=>classes.includes(id));
      if(!currentClasses.length)fail(403,'FORBIDDEN','Your original class assignment changed during generation.');
      return () => tx.create(draftRef,{creatorUid:req.schoolCaller.uid,classIds:currentClasses,prompt:input.prompt,...result,keySource:'school',revision:1,createdAt:iso(),updatedAt:iso(),expiresAt:new Date(Date.now()+7*86400000).toISOString()});
    });
    res.status(201).json({draftId:draftRef.id,...result,revision:1});
  }));
  router.get(base, wrap(async(req,res) => {
    const {ref,classes} = await access(req);
    const snap = await ref.collection('activityDrafts').where('creatorUid','==',req.schoolCaller.uid).get();
    const items = snap.docs.map(d=>({...d.data(),draftId:d.id})).filter(d=>fresh(d)&&d.classIds.some(id=>classes.includes(id))).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,20).map(({operation,...d})=>d);
    res.json({items});
  }));
  router.patch(`${base}/:draftId`, wrap(async(req,res) => {
    const scope = await draftAccess(req);
    const spec = validateActivity({...req.body.spec,provenance:{aiAssisted:true,provider:scope.draft.provider,model:scope.draft.model}});
    privacyCheck([JSON.stringify(spec)]);
    let revision;
    await getFirestore().runTransaction(async tx=>{
      const draft=(await tx.get(scope.draftRef)).data();checkDraft(req,draft,scope.classes);
      if(locked(draft)||draft.revision!==req.body.revision)fail(409,'CONFLICT','The draft changed. Reload before editing.');
      revision=draft.revision+1;tx.update(scope.draftRef,{spec,warnings:safetyWarnings(spec),revision,updatedAt:iso()});
    });
    res.json({draftId:scope.draftRef.id,spec,warnings:safetyWarnings(spec),revision});
  }));
  router.post(`${base}/:draftId/regenerate-block`, wrap(async(req,res) => {
    const scope = await draftAccess(req), {draftRef,draft}=scope;
    const instruction=requireText(req.body.instruction,'Block instructions',500), index=req.body.blockIndex;
    if(!Number.isInteger(index)||index<0||index>=draft.spec.blocks.length)fail(400,'VALIDATION','Choose a block in this activity.');
    privacyCheck([instruction,JSON.stringify(draft.spec)]);
    const operation={id:randomUUID(),expiresAt:new Date(Date.now()+LEASE).toISOString()};
    await getFirestore().runTransaction(async tx=>{
      const current=(await tx.get(draftRef)).data();checkDraft(req,current,scope.classes);
      if(locked(current)||current.revision!==req.body.revision)fail(409,'CONFLICT','The draft changed. Reload before regenerating.');
      tx.update(draftRef,{operation});
    });
    try {
      const result=await runGeneration(req,(adapter,signal)=>regenerateActivityBlock({adapter,signal,spec:draft.spec,blockIndex:index,instruction}),async(tx,result)=>{
        const current=(await tx.get(draftRef)).data();const currentClasses=await persistenceClasses(req,scope.ref,tx);checkDraft(req,current,currentClasses);
        if(current.operation?.id!==operation.id||current.revision!==req.body.revision)fail(409,'CONFLICT','This draft changed during generation. Reload it.');
        return ()=>tx.update(draftRef,{spec:result.spec,warnings:result.warnings,usage:{inputTokens:current.usage.inputTokens+result.usage.inputTokens,outputTokens:current.usage.outputTokens+result.usage.outputTokens},revision:current.revision+1,updatedAt:iso(),operation:null});
      });
      res.json({...result,revision:draft.revision+1});
    } finally {
      await getFirestore().runTransaction(async tx=>{const current=(await tx.get(draftRef)).data();if(current?.operation?.id===operation.id)tx.update(draftRef,{operation:null});}).catch(()=>{});
    }
  }));
  router.delete(`${base}/:draftId`,wrap(async(req,res)=>{
    const scope=await draftAccess(req);
    await getFirestore().runTransaction(async tx=>{const draft=(await tx.get(scope.draftRef)).data();checkDraft(req,draft,scope.classes);if(locked(draft))fail(409,'CONFLICT','Wait for regeneration to finish.');tx.delete(scope.draftRef);});
    res.json({deleted:true});
  }));
}
