import {beforeAll,afterAll,beforeEach,describe,it,expect,vi} from 'vitest';
import {setupApiTestEnv} from './api-test-helper.js';
import {sampleActivity} from '../../src/features/activities/spec/activitySpec.js';
import {createMockAdapter,aiError} from '../../server/lib/ai/adapter.js';

describe('Phase 2 authorized AI drafts and usage',()=>{
 let env,tokens={},provider,offering;
 const school='activity-ai-school',cls='activity-ai-class',foreign='activity-ai-other';
 const base=`/api/schools/${school}/program-offerings/offering`, draftPath=`${base}/activity-drafts`;
 const input={prompt:'Design a solar microgrid investigation.',ageBand:'16-18',durationMinutes:45,materials:['Paper'],standards:['HS-ETS1-2'],milestoneId:'explore',keySource:'school'};
 const request=(method,path,body,role='coach')=>env.request(method,path,{body,token:tokens[role]});
 const usageRef=()=>env.db.collection('schools').doc(school).collection('aiUsage').doc(new Date().toISOString().slice(0,7));
 const rateRef=()=>env.db.collection('programJoinAttempts').doc('coach-ai-activity-ai-coach');
 const fresh=()=>({...sampleActivity(),ageBand:'16-18',durationMinutes:45});
 const useReplies=replies=>{provider={...createMockAdapter(replies.map(reply=>reply.spec?JSON.stringify(reply.spec):reply.text)),provider:'gemini'};env.app.locals.activityAdapterFactory=()=>provider;};
 beforeAll(async()=>{
  env=await setupApiTestEnv();await env.db.recursiveDelete(env.db.collection('schools').doc(school));
  await env.db.collection('schools').doc(school).set({name:'AI school'});
  for(const id of [cls,foreign])await env.db.collection('classes').doc(id).set({schoolId:school,name:id});
  for(const [name,role,classes] of [['coach','coach',[cls]],['other','teacher',[foreign]],['student','student',[cls]],['admin','admin',[]]]){
   const uid=`activity-ai-${name}`;await env.db.collection('users').doc(uid).set({role,schoolIds:[school],classIds:classes,status:'active'});
   tokens[name]=await env.getIdToken(uid,{role,schoolIds:[school],classIds:classes});
  }
  offering=env.db.collection('schools').doc(school).collection('programOfferings').doc('offering');
  await offering.set({programId:'custom-ai',programDefinition:{title:'District microgrid',drivingQuestion:'How can a district keep clean power available?',milestones:[{id:'explore',title:'Explore'}]},classIds:[cls],status:'published'});
 });
 beforeEach(async()=>{await usageRef().delete();await rateRef().delete();useReplies([{spec:fresh()}]);});
 afterAll(async()=>{await env?.teardown();});
 it('denies unsigned, learners and staff in another class before provider calls',async()=>{
  provider.complete=vi.fn(provider.complete);
  expect((await env.request('POST',`${draftPath}/generate`,{body:input})).status).toBe(401);
  for(const role of ['student','other'])expect((await request('POST',`${draftPath}/generate`,input,role)).status).toBe(403);
  expect(provider.complete).not.toHaveBeenCalled();expect((await usageRef().get()).exists).toBe(false);
 });
 it('rejects malformed inputs and personal key requests without usage',async()=>{
  for(const body of [{...input,ageBand:'7-10'},{...input,durationMinutes:1},{...input,prompt:'a'.repeat(2001)},{...input,materials:[{name:'bad'}]},{...input,milestoneId:'bad'}])expect((await request('POST',`${draftPath}/generate`,body)).status).toBe(400);
  expect((await request('POST',`${draftPath}/generate`,{...input,keySource:'personal'})).body.error.code).toBe('AI_NOT_CONFIGURED');
  expect((await usageRef().get()).exists).toBe(false);
 });
 it('rejects personal details before outbound provider calls and never sends learner context',async()=>{
  provider.complete=vi.fn(provider.complete);
  expect((await request('POST',`${draftPath}/generate`,{...input,prompt:'For student alice@example.test'})).status).toBe(400);
  const result=await request('POST',`${draftPath}/generate`,{...input,learnerUid:'secret-student',evidence:'private learner work'});
  expect(result.status).toBe(201);const prompt=JSON.stringify(provider.complete.mock.calls[0][0]);
  expect(prompt).not.toContain('secret-student');expect(prompt).not.toContain('private learner work');expect(prompt).toContain('District microgrid');
 });
 it('reports missing school configuration without attempting a provider call',async()=>{
  delete env.app.locals.activityAdapterFactory;
  expect((await request('POST',`${draftPath}/generate`,input)).body.error.code).toBe('AI_NOT_CONFIGURED');expect((await rateRef().get()).exists).toBe(false);
 });
 it('stores own draft, revision, warnings and known usage atomically',async()=>{
  const result=await request('POST',`${draftPath}/generate`,input);expect(result.status).toBe(201);expect(result.body.revision).toBe(1);expect(result.body.spec.provenance.aiAssisted).toBe(true);
  const draft=(await offering.collection('activityDrafts').doc(result.body.draftId).get()).data();expect(draft.creatorUid).toBe('activity-ai-coach');expect(Date.parse(draft.expiresAt)-Date.parse(draft.createdAt)).toBeGreaterThan(6*86400000);
  const usage=(await usageRef().get()).data();expect(usage.requests).toBe(1);expect(usage.reservations).toEqual({});expect(usage.inputTokens).toBe(result.body.usage.inputTokens);
 });
 it('repairs once and accounts for both malformed and repaired completions',async()=>{
  useReplies([{text:'bad json'},{spec:fresh()}]);provider.complete=vi.fn(provider.complete);
  const result=await request('POST',`${draftPath}/generate`,input);expect(result.status).toBe(201);expect(provider.complete).toHaveBeenCalledTimes(2);expect(result.body.usage.inputTokens).toBe(200);
  expect((await usageRef().get()).data().inputTokens).toBe(200);
 });
 it('returns bad output after one repair but still records billable completions',async()=>{
  useReplies([{text:'bad'},{text:'bad'}]);provider.complete=vi.fn(provider.complete);
  const result=await request('POST',`${draftPath}/generate`,input);expect(result.status).toBe(422);expect(result.body.error.code).toBe('AI_BAD_OUTPUT');expect(provider.complete).toHaveBeenCalledTimes(2);expect((await usageRef().get()).data().inputTokens).toBe(200);
 });
 it('limits a coach to 10 globally stored attempts in a rolling hour',async()=>{
  await rateRef().set({attempts:Array(10).fill(Date.now())});provider.complete=vi.fn(provider.complete);
  const result=await request('POST',`${draftPath}/generate`,input);expect(result.status).toBe(429);expect(result.body.error.code).toBe('RATE_LIMITED');expect(provider.complete).not.toHaveBeenCalled();
 });
 it('reserves allowance before concurrent provider calls and prevents oversubscription',async()=>{
  await usageRef().set({cap:116000,inputTokens:0,outputTokens:0});let release,started;
  const gate=new Promise(resolve=>release=resolve),ready=new Promise(resolve=>started=resolve);
  const original=provider.complete;provider.complete=async(...args)=>{started();await gate;return original(...args);};
  const first=request('POST',`${draftPath}/generate`,input);await ready;
  const second=await request('POST',`${draftPath}/generate`,input);expect(second.status).toBe(429);expect(second.body.error.code).toBe('AI_CAP_REACHED');
  release();expect((await first).status).toBe(201);expect((await usageRef().get()).data().requests).toBe(1);
 });
 it('charges unknown provider billing conservatively and maps throttling safely',async()=>{
  provider.complete=async()=>{throw aiError('AI_RATE_LIMITED','Provider busy.');};
  expect((await request('POST',`${draftPath}/generate`,input)).body.error.code).toBe('RATE_LIMITED');
  const usage=(await usageRef().get()).data();expect(usage.outputTokens).toBe(116000);expect(usage.reservations).toEqual({});
 });
 it('charges abandoned reservations rather than releasing unknown spend',async()=>{
  await usageRef().set({cap:116000,reservations:{lost:{uid:'activity-ai-coach',tokens:116000,expiresAt:'2020-01-01T00:00:00Z'}}});
  const result=await request('POST',`${draftPath}/generate`,input);expect(result.body.error.code).toBe('AI_CAP_REACHED');
  // A refused transaction does not erase the reservation; it continues to consume the cap.
  expect((await usageRef().get()).data().reservations.lost.tokens).toBe(116000);
 });
 it('validates edited drafts, rejects stale revisions and regenerates only one same-type block',async()=>{
  const generated=(await request('POST',`${draftPath}/generate`,input)).body;
  const edited={...generated.spec,title:'My edited microgrid'};
  const patch=await request('PATCH',`${draftPath}/${generated.draftId}`,{revision:1,spec:edited});expect(patch.body.revision).toBe(2);
  expect((await request('PATCH',`${draftPath}/${generated.draftId}`,{revision:1,spec:edited})).status).toBe(409);
  useReplies([{spec:{type:'intro',text:'New introduction'}}]);
  const result=await request('POST',`${draftPath}/${generated.draftId}/regenerate-block`,{revision:2,blockIndex:0,instruction:'Use a storm scenario.'});
  expect(result.status).toBe(200);expect(result.body.revision).toBe(3);expect(result.body.spec.title).toBe(edited.title);expect(result.body.spec.blocks.slice(1)).toEqual(edited.blocks.slice(1));
 });
 it('keeps linked lesson provenance after edits and requires safety confirmation',async()=>{
  const generated=(await request('POST',`${draftPath}/generate`,input)).body;
  const body={title:'AI microgrid',outcome:'Compare',instructions:'Test',classId:cls,milestoneId:'explore',activity:{...generated.spec,provenance:{aiAssisted:false}},activityDraftId:generated.draftId,activityDraftRevision:1};
  const lesson=await request('POST',`${base}/lessons`,body);expect(lesson.status).toBe(201);expect(lesson.body.activity.provenance.aiAssisted).toBe(true);
  const patch={...body,revision:1};delete patch.activityDraftId;delete patch.activityDraftRevision;
  expect((await request('PATCH',`${base}/lessons/${lesson.body.id}`,patch)).status).toBe(200);
  expect((await request('POST',`${base}/lessons/${lesson.body.id}/publish`,{revision:2})).body.error.code).toBe('SAFETY_CONFIRMATION_REQUIRED');
  const published=await request('POST',`${base}/lessons/${lesson.body.id}/publish`,{revision:2,safetyConfirmed:true});expect(published.status).toBe(200);expect(published.body.provenance.reviewedBy).toBe('activity-ai-coach');
  expect((await offering.collection('lessons').doc(lesson.body.id).get()).data().activity.provenance.reviewedBy).toBe('activity-ai-coach');
 });
 it('blocks linking another coach draft, wrong class or expired draft',async()=>{
  const generated=(await request('POST',`${draftPath}/generate`,input)).body;
  const draft=offering.collection('activityDrafts').doc(generated.draftId);
  const body={title:'AI',outcome:'Compare',instructions:'Test',classId:cls,milestoneId:'explore',activity:generated.spec,activityDraftId:generated.draftId,activityDraftRevision:1};
  await draft.update({creatorUid:'someone-else'});expect((await request('POST',`${base}/lessons`,body)).status).toBe(403);
  await draft.update({creatorUid:'activity-ai-coach',expiresAt:'2020-01-01T00:00:00Z'});expect((await request('POST',`${base}/lessons`,body)).status).toBe(404);
  expect((await request('POST',`${draftPath}/${draft.id}/regenerate-block`,{revision:1,blockIndex:0,instruction:'Improve.'})).status).toBe(404);
 });
 it('does not overwrite concurrent draft edits while a regeneration is in flight',async()=>{
  const generated=(await request('POST',`${draftPath}/generate`,input)).body;let release,started;
  const gate=new Promise(resolve=>release=resolve),ready=new Promise(resolve=>started=resolve);
  useReplies([{spec:{type:'intro',text:'Improved'}}]);const original=provider.complete;
  provider.complete=async(...args)=>{started();await gate;return original(...args);};
  const first=request('POST',`${draftPath}/${generated.draftId}/regenerate-block`,{revision:1,blockIndex:0,instruction:'Improve.'});await ready;
  expect((await request('PATCH',`${draftPath}/${generated.draftId}`,{revision:1,spec:generated.spec})).status).toBe(409);
  expect((await request('DELETE',`${draftPath}/${generated.draftId}`,{})).status).toBe(409);
  release();expect((await first).status).toBe(200);
 });
 it('lists only own current drafts and deletes without changing linked lessons',async()=>{
  const generated=(await request('POST',`${draftPath}/generate`,input)).body;
  const list=await request('GET',draftPath);expect(list.body.items.some(d=>d.draftId===generated.draftId)).toBe(true);
  expect((await request('GET',draftPath,undefined,'admin')).body.items).toEqual([]);
  expect((await request('DELETE',`${draftPath}/${generated.draftId}`,{})).status).toBe(200);
  expect((await request('DELETE',`${draftPath}/${generated.draftId}`,{})).status).toBe(404);
 });
 it('refuses persistence after current coach assignments change during inference',async()=>{
  const original=provider.complete;
  provider.complete=async(...args)=>{const result=await original(...args);await env.db.collection('users').doc('activity-ai-coach').update({classIds:[foreign]});return result;};
  try{const result=await request('POST',`${draftPath}/generate`,input);expect(result.status).toBe(403);expect((await usageRef().get()).data().inputTokens).toBe(100);}
  finally{await env.db.collection('users').doc('activity-ai-coach').update({classIds:[cls]});}
 });
 it('enforces draft privacy on edits and invalid block requests before provider calls',async()=>{
  const generated=(await request('POST',`${draftPath}/generate`,input)).body;provider.complete=vi.fn(provider.complete);
  expect((await request('PATCH',`${draftPath}/${generated.draftId}`,{revision:1,spec:{...generated.spec,title:'alice@example.test'}})).status).toBe(400);
  expect((await request('POST',`${draftPath}/${generated.draftId}/regenerate-block`,{revision:1,blockIndex:999,instruction:'Improve'})).status).toBe(400);
  expect((await request('POST',`${draftPath}/${generated.draftId}/regenerate-block`,{revision:1,blockIndex:0,instruction:'a'.repeat(501)})).status).toBe(400);
  expect(provider.complete).not.toHaveBeenCalled();
 });

});
