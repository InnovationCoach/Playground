import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { setupApiTestEnv } from './api-test-helper.js';
import { createMockAdapter } from '../../server/lib/ai/adapter.js';
import { emptyProgram } from '../../src/features/school/programs/programSpec.js';
import { simulationFromPrompt } from '../../src/features/school/simulationModel.js';
import { sampleActivity } from '../../src/features/activities/spec/activitySpec.js';
const draft = () => ({...emptyProgram(),title:'Rainwater program',drivingQuestion:'How can we collect water?',overview:'Design a water system.',activities:[{title:'Measure rain',outcome:'Measure volume',instructions:'Record daily rainfall.',milestoneId:'explore'}],simulations:[{title:'Water lab',outcome:'Compare designs',instructions:'Record three trials.',milestoneId:'experiment',simulation:simulationFromPrompt('Collect rainwater')}]});
describe('Coach program maker API',()=>{
 let env,tokens={},id;
 const school='program-maker-school',cls='program-maker-class',foreign='program-maker-other',base=`/api/schools/${school}`;
 const request=(method,path,role='coach',body)=>env.request(method,path,{token:tokens[role],body});
 beforeAll(async()=>{
  env=await setupApiTestEnv();await env.db.recursiveDelete(env.db.collection('schools').doc(school));
  await env.db.collection('schools').doc(school).set({name:'Program Maker School',status:'active'});
  for(const c of [cls,foreign])await env.db.collection('classes').doc(c).set({schoolId:school,status:'active'});
  for(const [name,role,classes] of [['coach','teacher',[cls]],['other','teacher',[foreign]],['student','student',[cls]]]){
   const uid=`program-maker-${name}`;await env.db.collection('users').doc(uid).set({role,classIds:classes,schoolIds:[school],status:'active'});
   await env.db.collection('programJoinAttempts').doc(`coach-ai-${uid}`).delete();
   tokens[name]=await env.getIdToken(uid,{role,classIds:classes,schoolIds:[school]});
  }
 });
 afterAll(async()=>env?.teardown());
 it('converts a curriculum with the school AI allowance and excludes unassigned users',async()=>{
  const adapter=createMockAdapter([JSON.stringify(draft())]);env.app.locals.activityAdapterFactory=()=>adapter;
  expect((await request('POST',`${base}/program-drafts/convert`,'student',{classId:cls,prompt:'Water program'})).status).toBe(403);
  expect((await request('POST',`${base}/program-drafts/convert`,'other',{classId:cls,prompt:'Water program'})).status).toBe(403);
  const result=await request('POST',`${base}/program-drafts/convert`,'coach',{classId:cls,prompt:'Water program',pdf:Buffer.from('%PDF-1.7\nfixture').toString('base64')});
  expect(result.status).toBe(200);expect(result.body.program.simulations).toHaveLength(1);expect(adapter.calls[0].document.mimeType).toBe('application/pdf');
  const usage=await env.db.collection('schools').doc(school).collection('aiUsage').get();expect(usage.docs[0].data().requests).toBe(1);
 });
 it('creates a draft offering and linked draft lessons atomically',async()=>{
  const result=await request('POST',`${base}/program-offerings`,'coach',{programId:'custom',programDraft:draft(),yearId:'2026-2027',semester:1,classIds:[cls]});
  expect(result.status).toBe(201);id=result.body.id;expect(result.body.status).toBe('draft');
  const lessons=await request('GET',`${base}/program-offerings/${id}/lessons`);expect(lessons.body.items).toHaveLength(2);expect(lessons.body.items.every(l=>l.status==='draft'&&l.classId===cls)).toBe(true);
  expect((await request('GET',`${base}/program-offerings`,'student')).body.items).toEqual([]);
  expect((await request('GET',`${base}/program-offerings/${id}/lessons`,'student')).status).toBe(403);
  expect((await request('GET',`${base}/program-offerings/${id}/lessons`,'other')).status).toBe(403);
 });
 it('rejects invalid program lessons before writing any offering',async()=>{
  const invalid=draft();invalid.activities[0].milestoneId='missing';
  expect((await request('POST',`${base}/program-offerings`,'coach',{programId:'custom',programDraft:invalid,yearId:'2026-2027',classIds:[cls]})).status).toBe(400);
  expect((await request('POST',`${base}/program-offerings`,'other',{programId:'custom',programDraft:draft(),yearId:'2026-2027',classIds:[cls]})).status).toBe(403);
 });
 it('lets a coach edit draft details and rejects stale revisions or orphaning milestones',async()=>{
  const definition={...draft(),overview:'Updated overview'};
  expect((await request('PATCH',`${base}/program-offerings/${id}/definition`,'coach',{revision:1,programDefinition:definition})).status).toBe(200);
  expect((await request('PATCH',`${base}/program-offerings/${id}/definition`,'coach',{revision:1,programDefinition:definition})).status).toBe(409);
  definition.milestones=[{id:'new',title:'New milestone'}];
  expect((await request('PATCH',`${base}/program-offerings/${id}/definition`,'coach',{revision:2,programDefinition:definition})).status).toBe(400);
 });
 it('preserves author and safety checks when publishing the whole program',async()=>{
  const ref=env.db.collection('schools').doc(school).collection('programOfferings').doc(id).collection('lessons').doc('interactive');
  const activity=sampleActivity();activity.provenance={aiAssisted:true,provider:'gemini',model:'test'};
  await ref.set({title:'Interactive',outcome:'Learn',instructions:'Investigate',milestoneId:'explore',classId:cls,status:'draft',revision:1,createdAt:new Date().toISOString(),authorUid:'another-author',activity});
  expect((await request('POST',`${base}/program-offerings/${id}/publish`,'coach',{revision:2,safetyConfirmed:true})).status).toBe(403);
  await ref.update({authorUid:'program-maker-coach'});
  expect((await request('POST',`${base}/program-offerings/${id}/publish`,'coach',{revision:2})).status).toBe(400);
  await ref.delete();
 });
 it('publishes the program and exposes separate linked lesson content to enrolled students',async()=>{
  expect((await request('POST',`${base}/program-offerings/${id}/publish`,'other',{revision:2})).status).toBe(403);
  expect((await request('POST',`${base}/program-offerings/${id}/publish`,'coach',{revision:1})).status).toBe(409);
  expect((await request('POST',`${base}/program-offerings/${id}/publish`,'coach',{revision:2})).status).toBe(200);
  await env.db.collection('schools').doc(school).collection('programOfferings').doc(id).collection('members').doc('program-maker-student').set({classId:cls,status:'active'});
  const offerings=await request('GET',`${base}/program-offerings`,'student');expect(offerings.body.items[0].programDefinition.overview).toBe('Updated overview');
  const lessons=await request('GET',`${base}/program-offerings/${id}/lessons`,'student');expect(lessons.body.items).toHaveLength(2);expect(lessons.body.items.filter(l=>l.simulation)).toHaveLength(1);expect(lessons.body.items.every(l=>l.status==='published')).toBe(true);
 });
 it('restricts archiving library-managed pbl_programs to the creator or an admin',async()=>{
  const progId='lib-prog-archive-test';
  await env.db.collection('program_library').doc(progId).set({programId:progId,creatorUid:'program-maker-coach',status:'published'});
  await env.db.collection('pbl_programs').doc(progId).set({id:progId,authorId:'program-maker-coach',libraryManaged:true,status:'published'});
  expect((await request('POST',`/api/pbl/programs/${progId}/archive`,'other',{})).status).toBe(403);
  const ok=await request('POST',`/api/pbl/programs/${progId}/archive`,'coach',{});
  expect(ok.status).toBe(200);
  expect((await env.db.collection('pbl_programs').doc(progId).get()).data().status).toBe('archived');
 });
});
