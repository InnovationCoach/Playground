import { lazy, Suspense, useState } from 'react';
import { useActivityText } from './activityMessages.js';
import './activityBuilder.css';
const ActivityPlayer=lazy(()=>import('./ActivityPlayer.jsx'));
const ActivityStudio=lazy(()=>import('./ActivityStudio.jsx'));
export function ActivityLesson({lesson,uid,schoolId,offeringId}) {
 const {t}=useActivityText();const [open,setOpen]=useState(false);
 return <div className="ab-entry"><button type="button" className="gh-btn" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>{t('open')}: {lesson.title}</button>{open&&<Suspense fallback={<p role="status">{t('loading')}</p>}><ActivityPlayer spec={lesson.activity} {...{uid,schoolId,offeringId}} lessonId={lesson.id} revision={lesson.revision}/></Suspense>}</div>;
}
export function ActivityCoachTools({school,offering,classes,template,lessons,onSaved}) {
 const {t}=useActivityText();const [editing,setEditing]=useState(null);
 return <div className="ab-entry"><button type="button" className="gh-btn gh-btn-primary" onClick={()=>setEditing({key:crypto.randomUUID()})}>{t('studio')}</button>{lessons.filter(l=>l.activity&&l.status==='draft').map(l=><button type="button" className="gh-btn" key={l.id} onClick={()=>setEditing({key:l.id,lesson:l})}>{t('studio')}: {l.title}</button>)}{editing&&<Suspense fallback={<p role="status">{t('loading')}</p>}><ActivityStudio key={editing.key} {...{school,offering,classes,template,onSaved}} lesson={editing.lesson} onClose={()=>setEditing(null)}/></Suspense>}</div>;
}
