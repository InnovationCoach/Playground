import { useEffect, useState } from 'react';
import { auth } from '../../../firebase.js';
import { schoolRequest } from '../../../services/api/apiClient.js';
import { useActivityText } from './activityMessages.js';
import { ActivityLesson } from './ActivityEntry.jsx';
export default function PublishedActivities({school}) {
 const {t}=useActivityText();const [state,setState]=useState({loading:true,items:[],error:null}),[attempt,setAttempt]=useState(0);
 useEffect(()=>{let active=true;setState({loading:true,items:[],error:null});
  async function load(){try{
   const base=`/api/schools/${encodeURIComponent(school.id)}/program-offerings`;
   const offerings=await schoolRequest('GET',base);
   const results=await Promise.all(offerings.items.map(async o=>{const lessons=await schoolRequest('GET',`${base}/${encodeURIComponent(o.id)}/lessons`);return lessons.items.filter(l=>l.status==='published'&&l.activity).map(l=>({...l,offeringId:o.id}));}));
   if(active)setState({loading:false,items:results.flat(),error:null});
  }catch(error){if(active)setState({loading:false,items:[],error});}}
  load();return()=>{active=false;};
 },[school.id,attempt]);
 return <section className="qx-card" aria-label={t('today')}><h2>{t('today')}</h2>{state.loading?<p role="status">{t('loading')}</p>:state.error?<><p role="alert">{t(state.error.code==='FORBIDDEN'?'denied':'error')}</p><button type="button" className="qx-btn" onClick={()=>setAttempt(n=>n+1)}>{t('retry')}</button></>:!state.items.length?<p>{t('empty')}</p>:state.items.map(l=><ActivityLesson key={`${l.offeringId}:${l.id}`} lesson={l} uid={auth.currentUser?.uid} schoolId={school.id} offeringId={l.offeringId}/>)}</section>;
}
