import { PROGRAM_CATALOGUE } from '../../src/features/pbl/content/programCatalogue.js';
const role=new URLSearchParams(location.search).get('role')||'teacher';
const offerings=PROGRAM_CATALOGUE.map(p=>({id:`2026-${p.id}`,programId:p.id,title:p.title,semester:p.semester,yearId:'2026-2027',classIds:['demo-class'],status:'published'}));
let sequence=10;
const lessons=[{id:'sample-lesson',title:'Compare prototype designs',outcome:'Use recorded test data to choose a design.',instructions:'Test two designs. Record results, then explain your choice.',milestoneId:'phase-1',classId:'demo-class',status:'published',revision:2,createdAt:'2026-10-01',authorUid:'demo-coach'}];
const goals=[{id:'sample-goal',learnerUid:'demo-learner',classId:'demo-class',target:'Compare two prototype designs using measured results.',domain:'pbl',dueDate:'2026-10-16',state:'active',revision:1,acknowledged:false}];
const academics=[{id:'sample-academic',learnerUid:'demo-learner',provider:'cambrilearn',course:'Mathematics',curriculum:'Foundation I',completed:0,total:24,dataAsOf:'2026-10-03',importedAt:'2026-10-03',sourceMethod:'coach_recorded'}];
const events=[{id:'sample-event',title:'School project showcase',startDate:'2026-10-23',endDate:'2026-10-23',allDay:true,startTime:'',endTime:'',timezone:'Asia/Bangkok',category:'School event',description:'Share your project evidence with families.',location:'School hall',status:'scheduled',revision:1}];
const submissions=[{id:'sample-submission',learnerUid:'demo-learner',lessonId:'sample-lesson',classId:'demo-class',body:'Design A completed the route in 22 seconds. Design B completed it in 18 seconds.',status:'submitted',revision:1,createdAt:'2026-10-03'}];
export async function schoolRequest(method,path,{body={}}={}) {
  if(new URLSearchParams(location.search).get('scenario')==='error') throw new Error('Sample connection failure. No school data was changed.');
  const clean=path.split('?')[0], id=clean.split('/').at(-1);
  if(clean==='/api/learning-context')return {role,schools:[{id:'demo-school',name:'Sample WeLearn School',timezone:'Asia/Bangkok'}],classes:[{id:'demo-class',name:'Sample Year 11',schoolId:'demo-school'}]};
  if(method==='GET') {
    if(clean.endsWith('/learner-program-summaries'))return {items:[{id:'sample-program',title:'Sustainable Futures',semester:1,yearId:'2026-2027',publishedLessons:3,lessonsSubmitted:1,lessonsReviewed:0,revisionsRequested:1}]};
    if(clean.endsWith('/learners'))return {items:[{id:'demo-learner',displayName:'Sample learner — Mia',classIds:['demo-class']}]};
    if(clean.endsWith('/program-offerings'))return {items:role==='student'?offerings.filter(o=>o.semester===1):offerings};// sample learner is enrolled in Semester 1 only, so the home catalogue shows both states
    if(clean.endsWith('/lessons'))return {items:lessons.filter(l=>role!=='student'||l.status==='published')};
    if(clean.endsWith('/submissions'))return {items:submissions};
    if(clean.endsWith('/learner-goals'))return {items:goals};
    if(clean.endsWith('/academic-progress'))return {items:academics};
    if(clean.endsWith('/calendar-events'))return {items:events};
  }
  const fresh=()=>({...body,id:`sample-${++sequence}`,revision:1,createdAt:'2026-10-03'});
  if(method==='POST'&&clean.endsWith('/lessons')){const x={...fresh(),status:'draft'};lessons.push(x);return x;}
  if(method==='PATCH'&&clean.includes('/lessons/')){Object.assign(lessons.find(l=>l.id===id),body);return {saved:true};}
  if(clean.endsWith('/publish')){const key=clean.split('/').at(-2);Object.assign(lessons.find(l=>l.id===key),{status:'published',revision:2});return {published:true};}
  if(method==='POST'&&clean.endsWith('/learner-goals')){const x={...fresh(),state:'active',acknowledged:false};goals.push(x);return x;}
  if(method==='PATCH'&&clean.includes('/learner-goals/')){Object.assign(goals.find(g=>g.id===id),role==='student'?{acknowledged:true}:body);return {saved:true};}
  if(method==='POST'&&clean.endsWith('/academic-progress')){const x={...fresh(),sourceMethod:'coach_recorded',importedAt:'2026-10-03'};academics.unshift(x);return x;}
  if(method==='POST'&&clean.endsWith('/calendar-events')){const x=fresh();events.push(x);return x;}
  if(method==='PATCH'&&clean.includes('/calendar-events/')){Object.assign(events.find(e=>e.id===id),body);return {saved:true};}
  if(method==='DELETE'&&clean.includes('/calendar-events/')){events.splice(events.findIndex(e=>e.id===id),1);return {deleted:true};}
  if(method==='POST'&&clean.endsWith('/submissions')){const x={...fresh(),learnerUid:'demo-learner',status:'submitted'};submissions.unshift(x);return x;}
  if(clean.endsWith('/review')){Object.assign(submissions.find(s=>s.id===clean.split('/').at(-2)),body);return {reviewed:true};}
  if(clean.endsWith('/codes'))return {id:'sample-code',code:'SAMPLEONLY12'};
  if(clean.includes('/program-codes/'))return {revoked:true};
  if(clean==='/api/program-enrollments/join')return {title:'Sample program'};
  throw new Error('This action is not available in the isolated design preview.');
}
