import { useState } from 'react';
import { mutateSchool, schoolPath, serviceMessage } from '../useSchoolWorkspace.js';
export function ProgramDetailsEditor({school,offering,onSaved}) {
  const [definition,setDefinition] = useState(offering.programDefinition), [busy,setBusy] = useState(false), [error,setError] = useState('');
  const update = (key,value) => setDefinition(d=>({...d,[key]:value}));
  return <details className="sw-card"><summary>Edit program overview and milestones</summary><form className="sw-form" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{await mutateSchool('PATCH',`${schoolPath(school.id,'program-offerings')}/${offering.id}/definition`,{revision:offering.revision,programDefinition:definition});onSaved();}catch(e){setError(serviceMessage(e));}finally{setBusy(false);}}}><fieldset disabled={busy}>
    {[['title','Program title',200],['drivingQuestion','Driving question',1000],['overview','Program overview',5000],['gradeBand','Grade band',100]].map(([key,label,max])=><label className="sw-field" key={key}><span>{label}</span><textarea maxLength={max} required={key==='title'||key==='drivingQuestion'} value={definition[key]||''} onChange={e=>update(key,e.target.value)}/></label>)}
    {definition.milestones.map((m,i)=><label className="sw-field" key={m.id}><span>Milestone {i+1}</span><input required maxLength={200} value={m.title} onChange={e=>update('milestones',definition.milestones.map((v,j)=>i===j?{...v,title:e.target.value}:v))}/></label>)}
    <button className="gh-btn" disabled={busy}>Save program details</button></fieldset>{error&&<p role="alert">{error}</p>}</form></details>;
}
