import {readFileSync} from 'node:fs';
import {beforeAll,afterAll,describe,it} from 'vitest';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc} from 'firebase/firestore';
import {ref,uploadBytes} from 'firebase/storage';
describe('Learning resource Storage rules',()=>{
  let env;
  const projectId='demo-hearisland-local',school='storage-media-school',offering='storage-media-program',cls='storage-media-class';
  const types=['application/pdf','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation'];
  beforeAll(async()=>{
    env=await initializeTestEnvironment({projectId,firestore:{host:'127.0.0.1',port:8088},storage:{host:'127.0.0.1',port:9199,rules:readFileSync('storage.rules','utf8')}});
    await env.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      await setDoc(doc(db,'schools',school),{status:'active'});
      await setDoc(doc(db,'schools',school,'programOfferings',offering),{createdBy:'storage-coach',status:'published',classIds:[cls]});
      await setDoc(doc(db,'schools',school,'programOfferings',offering,'lessons','draft'),{authorUid:'storage-coach',status:'draft',classId:cls});
      await setDoc(doc(db,'schools',school,'programOfferings',offering,'lessons','published'),{authorUid:'storage-coach',status:'published',classId:cls});
      for(const [uid,role] of [['storage-coach','coach'],['storage-peer','coach'],['storage-student','student']])await setDoc(doc(db,'users',uid),{role,status:'active',schoolIds:[school],classIds:[cls]});
    });
  });
  afterAll(async()=>env?.cleanup());
  function upload(uid,role,path,contentType,classes=[cls]) {
    const storage=env.authenticatedContext(uid,{role,schoolIds:[school],classIds:classes}).storage();
    return uploadBytes(ref(storage,path),new Uint8Array([1,2,3]),{contentType});
  }
  it('permits coaches to add verified PDF and PowerPoint types to their programs and draft lessons',async()=>{
    for(let i=0;i<types.length;i++){
      await assertSucceeds(upload('storage-coach','coach',`programMedia/${school}/${offering}/storage-coach/slides-${i}`,types[i]));
      await assertSucceeds(upload('storage-coach','coach',`lessonMedia/${school}/${offering}/draft/storage-coach/slides-${i}`,types[i]));
    }
  });
  it('rejects other authors, students, removed classes, published lessons and unsafe types',async()=>{
    await assertFails(upload('storage-peer','coach',`programMedia/${school}/${offering}/storage-peer/file`,'application/pdf'));
    await assertFails(upload('storage-student','student',`programMedia/${school}/${offering}/storage-student/file`,'application/pdf'));
    await assertFails(upload('storage-coach','coach',`programMedia/${school}/${offering}/storage-coach/removed`,'application/pdf',[]));
    await assertFails(upload('storage-coach','coach',`lessonMedia/${school}/${offering}/published/storage-coach/file`,'application/pdf'));
    await assertFails(upload('storage-coach','coach',`programMedia/${school}/${offering}/storage-coach/html`,'text/html'));
  });
});
