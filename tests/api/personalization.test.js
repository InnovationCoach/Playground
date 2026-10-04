import {beforeAll,afterAll,describe,it,expect,vi} from 'vitest';
const files=vi.hoisted(()=>({}));
vi.mock('firebase-admin/storage',()=>({getStorage:()=>({bucket:()=>({file:path=>({getMetadata:async()=>{if(!files[path])throw new Error('Not found');return [files[path]];},setMetadata:async value=>{files[path]={...files[path],...value};},getSignedUrl:async()=>[`https://media.example/temporary/${encodeURIComponent(path)}`]})})})}));
import {setupApiTestEnv} from './api-test-helper.js';
import {defaults} from '../../src/features/personalization/personalizationModel.js';
describe('Private personalization and scoped portfolio sharing',()=>{
  let env,tokens={},revision=0,items=[];
  const uid='personal-learner',school='personal-school',cls='personal-class';
  const call=(method,path,who='owner',body)=>env.request(method,path,{token:tokens[who],body});
  beforeAll(async()=>{
    env=await setupApiTestEnv();await env.db.collection('schools').doc(school).set({name:'School'});await env.db.collection('classes').doc(cls).set({schoolId:school,status:'active'});
    const accounts={owner:{uid,role:'student',schoolIds:[school],classIds:[cls]},peer:{uid:'personal-peer',role:'student',schoolIds:[school],classIds:[cls]},coach:{uid:'personal-coach',role:'coach',schoolIds:[school],classIds:[cls]},other:{uid:'personal-other',role:'student',schoolIds:['other-school'],classIds:['other-class']},admin:{uid:'personal-admin',role:'admin',schoolIds:[school],classIds:[]},parent:{uid:'personal-parent',role:'parent',schoolIds:[school],classIds:[]}};
    for(const [key,value] of Object.entries(accounts)){await env.db.collection('users').doc(value.uid).set({...value,status:'active'});tokens[key]=await env.getIdToken(value.uid,value);}
    for(const collection of ['learnerSpaces','learnerPortfolios','portfolioAudienceGrants'])await env.db.collection(collection).doc(uid).delete();
  });
  afterAll(async()=>env?.teardown());
  it('requires authentication and reserves private customization for the learner',async()=>{
    expect((await env.request('GET','/api/learner-space')).status).toBe(401);
    for(const who of ['coach','parent','admin'])expect((await call('GET','/api/learner-space',who)).status).toBe(403);
    const result=await call('GET','/api/learner-space');expect(result.body.revision).toBe(0);
  });
  it('saves private settings separately and ignores arbitrary fields',async()=>{
    const body=defaults();body.dashboard.goals='SECRET GOAL';body.dashboard.introduction='PRIVATE INTRO';body.portfolio.introduction='Public introduction';body.portfolio.goals='Attempted leak';body.portfolio.support='Private support';body.html='<script>bad()</script>';
    const result=await call('PUT','/api/learner-space','owner',body);expect(result.status).toBe(200);revision=result.body.revision;
    const stored=await env.db.collection('learnerPortfolios').doc(uid).get();expect(JSON.stringify(stored.data())).not.toContain('SECRET GOAL');expect(stored.data().portfolio).not.toHaveProperty('goals');expect(stored.data().portfolio).not.toHaveProperty('support');
    expect((await call('GET','/api/learner-space','peer')).body.dashboard.goals).toBe('');
  });
  it('rejects stale updates, unsupported layouts and cross-owner files',async()=>{
    const body={...defaults(),revision};expect((await call('PUT','/api/learner-space','owner',{...body,revision:0})).status).toBe(409);
    body.dashboard.appearance.accent='arbitrary';expect((await call('PUT','/api/learner-space','owner',body)).status).toBe(400);
    body.dashboard.appearance.accent='plum';body.portfolio.appearance.picture={path:'learnerMedia/other/id/p.jpg',name:'p.jpg'};expect((await call('PUT','/api/learner-space','owner',body)).status).toBe(400);
  });
  it('stores design-thinking stage evidence and one reflection per stage, and rejects bad stages',async()=>{
    const ok=await call('POST','/api/learner-space/items','owner',{title:'Explore reflection',kind:'writing',body:'I learned how to measure energy.',audiences:[],phase:'explore',phaseReflection:true});
    expect(ok.status).toBe(201);expect(ok.body.items[0]).toMatchObject({phase:'explore',phaseReflection:true,audiences:[]});
    expect((await call('POST','/api/learner-space/items','owner',{title:'Bad',kind:'writing',body:'x',audiences:[],phase:'nowhere'})).status).toBe(400);
    expect((await call('POST','/api/learner-space/items','owner',{title:'Bad',kind:'writing',body:'x',audiences:[],phaseReflection:true})).status).toBe(400);
    const id=ok.body.items[0].id;const removed=await call('DELETE',`/api/learner-space/items/${id}`,'owner',{revision:ok.body.items[0].revision});
    expect(removed.status).toBe(200);
  });
  it('adds private, coach, classmate and pending wider work',async()=>{
    for(const [title,audiences] of [['Private',[]],['Coach',['coaches']],['Class',['classmates']],['Wider',['wider']]]){
      const result=await call('POST','/api/learner-space/items','owner',{title,kind:'writing',body:title+' content',audiences});expect(result.status).toBe(201);items=result.body.items;
    }
  });
  it('filters every shared response and never returns personal goals or support',async()=>{
    for(const [who,title] of [['coach','Coach'],['peer','Class']]){
      const result=await call('GET',`/api/learner-portfolios/${uid}`,who);expect(result.status).toBe(200);expect(result.body.items.map(i=>i.title)).toEqual([title]);expect(result.body).not.toHaveProperty('dashboard');expect(JSON.stringify(result.body)).not.toContain('SECRET GOAL');expect(JSON.stringify(result.body)).not.toContain('PRIVATE INTRO');expect(result.body.portfolio).not.toHaveProperty('goals');
    }
    for(const who of ['other','parent','admin'])expect((await call('GET',`/api/learner-portfolios/${uid}`,who)).status).toBe(403);
  });
  it('requires administrator approval before wider work reaches named viewers',async()=>{
    const path=`/api/learner-portfolios/${uid}/audience`,body={viewerUids:['personal-other'],revision:0};
    expect((await call('PUT',path,'owner',body)).status).toBe(403);expect((await call('PUT',path,'coach',body)).status).toBe(403);
    expect((await call('PUT',path,'admin',body)).status).toBe(200);expect((await call('GET',`/api/learner-portfolios/${uid}`,'other')).body.items.map(i=>i.title)).toEqual(['Wider']);
    expect((await call('PUT',path,'admin',{viewerUids:[],revision:1})).status).toBe(200);expect((await call('GET',`/api/learner-portfolios/${uid}`,'other')).status).toBe(403);
  });
  it('learner audience edits revoke access immediately and enforce revisions',async()=>{
    const item=items.find(i=>i.title==='Class');const path=`/api/learner-space/items/${item.id}`;
    expect((await call('PATCH',path,'peer',{...item,audiences:[]})).status).toBe(404);
    expect((await call('PATCH',path,'owner',{...item,audiences:[]})).status).toBe(200);
    expect((await call('GET',`/api/learner-portfolios/${uid}`,'peer')).status).toBe(403);
    expect((await call('PATCH',path,'owner',item)).status).toBe(409);
  });
  it('validates uploaded media and serves only authorized temporary URLs',async()=>{
    const path=`learnerMedia/${uid}/upload/picture.png`;files[path]={contentType:'image/png',size:500,metadata:{firebaseStorageDownloadTokens:'permanent-token'}};
    const body={title:'Photo',kind:'image',body:'Caption',audiences:['coaches'],media:{path,name:'picture.png',url:'https://evil.example'}};
    const result=await call('POST','/api/learner-space/items','owner',body);expect(result.status).toBe(201);expect(files[path].metadata.firebaseStorageDownloadTokens).toBeNull();
    const shared=await call('GET',`/api/learner-portfolios/${uid}`,'coach');const photo=shared.body.items.find(i=>i.title==='Photo');expect(photo.media.url).toContain('https://media.example/temporary/');expect(photo.media).not.toHaveProperty('path');
    files[path]={contentType:'text/html',size:500};expect((await call('POST','/api/learner-space/items','owner',body)).status).toBe(400);
    files[path]={contentType:'image/png',size:30*1024*1024};expect((await call('POST','/api/learner-space/items','owner',body)).status).toBe(400);
    files[path]={contentType:'image/png',size:500};
  });
  it('supports code and 3D files without executing them',async()=>{
    for(const [kind,name,mime] of [['code','project.zip','application/zip'],['model','robot.glb','model/gltf-binary'],['recording','reflection.webm','audio/webm']]){
      const path=`learnerMedia/${uid}/upload/${name}`;files[path]={contentType:mime,size:200};expect((await call('POST','/api/learner-space/items','owner',{title:name,kind,body:'description',audiences:[],media:{path,name}})).status).toBe(201);
    }
    expect((await call('POST','/api/learner-space/items','owner',{title:'Unsafe',kind:'code',body:'code',link:'javascript:alert(1)',audiences:[]})).status).toBe(400);
  });
  it('revokes coach access after current class assignments are removed',async()=>{
    await env.db.collection('users').doc('personal-coach').update({classIds:[]});expect((await call('GET',`/api/learner-portfolios/${uid}`,'coach')).status).toBe(403);
    await env.db.collection('users').doc('personal-coach').update({classIds:[cls]});
  });
  it('settings saves preserve portfolio entries and deletion requires current revision',async()=>{
    const current=await call('GET','/api/learner-space');const saved=await call('PUT','/api/learner-space','owner',{...current.body,items:[]});expect(saved.body.items).toHaveLength(current.body.items.length);
    const item=saved.body.items[0];expect((await call('DELETE',`/api/learner-space/items/${item.id}`,'owner',{revision:0})).status).toBe(409);expect((await call('DELETE',`/api/learner-space/items/${item.id}`,'owner',{revision:item.revision})).status).toBe(200);
  });
});
