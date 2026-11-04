import {beforeAll,afterAll,describe,it,expect,vi} from 'vitest';
const media=vi.hoisted(()=>({getMetadata:vi.fn(),getSignedUrl:vi.fn(),setMetadata:vi.fn()}));
vi.mock('firebase-admin/storage',()=>({getStorage:()=>({bucket:()=>({file:()=>media})})}));
import {setupApiTestEnv} from './api-test-helper.js';
describe('Program resources and student access',()=>{
  let env,tokens={};
  const school='program-media-school',cls='program-media-class',id='2026-custom-media';
  const base=`/api/schools/${school}/program-offerings`,path=`${base}/${id}/media`;
  const resources=[{path:`programMedia/${school}/${id}/media-coach/poster`,name:'Poster.png'}, {path:`programMedia/${school}/${id}/media-coach/slides`,name:'Slides.pdf'}];
  const request=(method,url,role='coach',body)=>env.request(method,url,{token:tokens[role],body});
  beforeAll(async()=>{
    env=await setupApiTestEnv();await env.db.recursiveDelete(env.db.collection('schools').doc(school));
    await env.db.collection('schools').doc(school).set({status:'active'});
    await env.db.collection('classes').doc(cls).set({schoolId:school,status:'active'});
    for(const [name,role] of [['coach','coach'],['peer','coach'],['student','student']]){
      const uid=`media-${name}`,claims={role,classIds:[cls],schoolIds:[school]};
      await env.db.collection('users').doc(uid).set({...claims,status:'active'});
      tokens[name]=await env.getIdToken(uid,claims);
    }
    await env.db.collection('schools').doc(school).collection('programOfferings').doc(id).set({createdBy:'media-coach',classIds:[cls],status:'published',revision:1,semester:1});
    media.getMetadata.mockResolvedValue([{contentType:'application/pdf',size:1024}]);
    media.getSignedUrl.mockResolvedValue(['https://example.test/temporary-resource']);
  });
  afterAll(async()=>env?.teardown());
  it('rejects learners and other coaches editing program resources',async()=>{
    expect((await request('PATCH',path,'student',{revision:1,attachments:resources})).status).toBe(403);
    expect((await request('PATCH',path,'peer',{revision:1,attachments:resources})).status).toBe(403);
  });
  it('saves verified resources, rejects stale edits and foreign program paths',async()=>{
    expect((await request('PATCH',path,'coach',{revision:1,attachments:[{path:'programMedia/foreign/program/coach/slides',name:'Foreign.pdf'}]})).status).toBe(400);
    media.getMetadata.mockResolvedValueOnce([{contentType:'image/png',size:1024}]);
    const result=await request('PATCH',path,'coach',{revision:1,attachments:resources});
    expect(result.status).toBe(200);expect(result.body.revision).toBe(2);
    expect((await request('PATCH',path,'coach',{revision:1,attachments:[]})).status).toBe(409);
  });
  it('issues resource URLs only to enrolled students and revokes access when membership changes',async()=>{
    expect((await request('GET',base,'student')).body.items).toEqual([]);
    const member=env.db.collection('schools').doc(school).collection('programOfferings').doc(id).collection('members').doc('media-student');
    await member.set({classId:cls,status:'active'});
    const result=await request('GET',base,'student');expect(result.status).toBe(200);
    expect(result.body.items[0].attachments).toHaveLength(2);
    expect(result.body.items[0].attachments[1].url).toBe('https://example.test/temporary-resource');
    await member.update({status:'inactive'});
    expect((await request('GET',base,'student')).body.items).toEqual([]);
  });
});
