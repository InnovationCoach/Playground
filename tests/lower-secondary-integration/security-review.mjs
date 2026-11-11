import { readFileSync } from 'node:fs';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { resolveUserLayoutSelection } from '../../server/lib/layoutSelection.js';
const host=process.env.FIRESTORE_EMULATOR_HOST;
if(host!=='127.0.0.1:8388') throw new Error('Private emulator required');
const env=await initializeTestEnvironment({projectId:'demo-ls-security-review',firestore:{host:'127.0.0.1',port:8388,rules:readFileSync('firestore.rules','utf8')}});
const evidence={};
try {
 await env.withSecurityRulesDisabled(async c=>{
  const db=c.firestore();
  await setDoc(doc(db,'auditLogs/other-school-dob'),{source:'server',orgId:'org-other',schoolId:'school-other',subjectUid:'other-student',details:{after:{dateOfBirth:'2013-01-15'}}});
  await setDoc(doc(db,'users/self'),{role:'student',ageBand:'13-15'});
 });
 const foreignCoach=env.authenticatedContext('coach',{role:'coach',orgId:'org-a',schoolIds:['school-a'],classIds:['class-a']}).firestore();
 evidence.crossSchoolCoachCanReadAuditDob=(await getDoc(doc(foreignCoach,'auditLogs/other-school-dob'))).data()?.details?.after?.dateOfBirth==='2013-01-15';
 const learner=env.authenticatedContext('self',{role:'student'}).firestore();
 await updateDoc(doc(learner,'users/self'),{ageBand:'primary',dateOfBirth:'2014-01-15',layoutOverride:'lower-secondary'});
 evidence.learnerCanChangeOwnAgeFields=true;
 try {await setDoc(doc(learner,'userLayoutAuthority/self'),{dobVerified:true,dateOfBirth:'2014-01-15'});evidence.learnerCanWriteAuthority=true;}catch{evidence.learnerCanWriteAuthority=false;}
 // Pure resolver probe: coach-created profile says 16–18, class authority says 11–14.
 const data={userLayoutAuthority:{self:{cohortVerified:true,cohortId:'lower',ageBand:'16-18'}},cohorts:{lower:{minAge:11,maxAgeExclusive:15,status:'active'}}};
 const db={collection:name=>({doc:id=>({get:async()=>({exists:!!data[name]?.[id],data:()=>data[name]?.[id]})})})};
 evidence.conflictingOlderBandSelection=await resolveUserLayoutSelection(db,{uid:'self',role:'student',userData:{ageBand:'16-18'},signedClaims:{}});
 console.log(JSON.stringify(evidence,null,2));
}finally{await env.cleanup();}
