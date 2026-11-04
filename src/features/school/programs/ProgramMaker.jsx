import { useEffect, useState } from 'react';
import { mutateSchool, schoolPath, serviceMessage } from '../useSchoolWorkspace.js';
import { SimulationBuilder } from '../SimulationLab.jsx';
import { emptyProgram, validateProgram } from './programSpec.js';
import { ProgramCompetencyPicker } from './ProgramCompetencyPicker.jsx';

const Field = ({label,children}) => <label className="sw-field"><span>{label}</span>{children}</label>;
export function ProgramMaker({school,classes,onCreated,onCancel}) {
  const [program,setProgram] = useState(emptyProgram), [prompt,setPrompt] = useState(''), [pdf,setPdf] = useState(null);
  const [classId,setClassId] = useState(classes[0]?.id || ''), [yearId,setYearId] = useState('2026-2027'), [semester,setSemester] = useState(1);
  const [busy,setBusy] = useState(false), [error,setError] = useState(''), [status,setStatus] = useState(''), [dirty,setDirty] = useState(false), [edited,setEdited] = useState(false);
  useEffect(() => { const guard = e => {if(dirty){e.preventDefault();e.returnValue='';}}; window.addEventListener('beforeunload',guard); return () => window.removeEventListener('beforeunload',guard); },[dirty]);
  const update = (key,value) => {setDirty(true);setEdited(true);setProgram(p=>({...p,[key]:value}));};
  const itemUpdate = (section,index,key,value) => update(section,program[section].map((item,i)=>i===index?{...item,[key]:value}:item));
  async function convert() {
    if (edited && !window.confirm('Replace your program edits with a new converted draft?')) return;
    setBusy(true);setError('');setStatus('Converting your program…');
    try {
      let encoded;
      if (pdf) {
        if (pdf.size > 4*1024*1024 || pdf.size === 0) throw new Error('Choose a PDF up to 4 MB.');
        encoded = await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(new Error('The PDF could not be read.'));reader.readAsDataURL(pdf);});
      }
      const result = await mutateSchool('POST',schoolPath(school.id,'program-drafts/convert'),{classId,prompt,...(encoded?{pdf:encoded}:{})});
      setProgram(validateProgram(result.program));setDirty(true);setEdited(true);setStatus('Draft converted. Review every section before saving.');
    } catch(e) {setError(serviceMessage(e));setStatus('');} finally {setBusy(false);}
  }
  async function save(e) {
    e.preventDefault();setBusy(true);setError('');
    try {
      const clean=validateProgram(program);
      const created=await mutateSchool('POST',schoolPath(school.id,'program-offerings'),{programId:'custom',programDraft:clean,yearId,semester,classIds:[classId]});
      setDirty(false);onCreated(created);
    } catch(e) {setError(serviceMessage(e));} finally {setBusy(false);}
  }
  return <section className="sw-card sw-program-maker" aria-label="Program maker"><h3>Design a learning program</h3><p>Write your program or convert a curriculum PDF into an editable draft. Activities and simulations stay linked to the program milestones.</p>
    <fieldset disabled={busy} className="sw-form"><legend>Program source</legend>
      <Field label="Assigned class"><select value={classId} onChange={e=>setClassId(e.target.value)}><option value="">Choose a class</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
      <Field label="Describe your program"><textarea rows={4} maxLength={10000} value={prompt} onChange={e=>{setPrompt(e.target.value);setDirty(true);}}/></Field>
      <Field label="Program PDF (up to 4 MB)"><input type="file" accept="application/pdf,.pdf" onChange={e=>{setPdf(e.target.files?.[0]||null);setDirty(true);}}/></Field>
      <small>Conversion uses your school AI connection. Upload curriculum materials without student names or personal records.</small>
      <button type="button" className="gh-btn" disabled={!classId||(!prompt.trim()&&!pdf)} onClick={convert}>Convert to program draft</button>
    </fieldset>
    <form className="sw-form" onSubmit={save}><fieldset disabled={busy}><legend>Review program</legend>
      <Field label="Program title"><input required maxLength={200} value={program.title} onChange={e=>update('title',e.target.value)}/></Field>
      <Field label="Driving question"><textarea required maxLength={1000} value={program.drivingQuestion} onChange={e=>update('drivingQuestion',e.target.value)}/></Field>
      <Field label="Program overview"><textarea rows={4} maxLength={5000} value={program.overview} onChange={e=>update('overview',e.target.value)}/></Field>
      <Field label="Grade band"><input maxLength={100} value={program.gradeBand} onChange={e=>update('gradeBand',e.target.value)}/></Field>
      <Field label="School year"><input required pattern="[A-Za-z0-9_-]+" value={yearId} onChange={e=>setYearId(e.target.value)}/></Field>
      <Field label="Semester"><select value={semester} onChange={e=>setSemester(Number(e.target.value))}>{[1,2,3].map(n=><option key={n}>{n}</option>)}</select></Field>
      <h4>Program milestones</h4>{program.milestones.map((m,i)=><div className="sw-inline-form" key={m.id}><Field label={`Milestone ${i+1}`}><input required maxLength={200} value={m.title} onChange={e=>update('milestones',program.milestones.map((v,j)=>j===i?{...v,title:e.target.value}:v))}/></Field><button type="button" className="gh-btn gh-btn-ghost" disabled={program.milestones.length===1||[...program.activities,...program.simulations].some(l=>l.milestoneId===m.id)} onClick={()=>update('milestones',program.milestones.filter(v=>v.id!==m.id))}>Remove milestone</button></div>)}
      <button type="button" className="gh-btn" disabled={program.milestones.length>=12} onClick={()=>update('milestones',[...program.milestones,{id:`phase-${crypto.randomUUID()}`,title:''}])}>Add milestone</button>
      {['activities','simulations'].map(section=><section key={section} aria-label={section==='activities'?'Program activities':'Program simulations'}><h4>{section==='activities'?'Activities':'Simulations'}</h4>{!program[section].length&&<p>No {section} linked yet.</p>}{program[section].map((item,i)=><div className="sw-card" key={i}>
        <Field label="Lesson title"><input required maxLength={200} value={item.title} onChange={e=>itemUpdate(section,i,'title',e.target.value)}/></Field>
        <Field label="Milestone"><select value={item.milestoneId} onChange={e=>itemUpdate(section,i,'milestoneId',e.target.value)}>{program.milestones.map(m=><option key={m.id} value={m.id}>{m.title}</option>)}</select></Field>
        <Field label="Learning outcome"><textarea required maxLength={1000} value={item.outcome} onChange={e=>itemUpdate(section,i,'outcome',e.target.value)}/></Field>
        <Field label="Instructions and evidence"><textarea required rows={3} maxLength={10000} value={item.instructions} onChange={e=>itemUpdate(section,i,'instructions',e.target.value)}/></Field>
        <ProgramCompetencyPicker value={item.competencyIds || []} onChange={value=>itemUpdate(section,i,'competencyIds',value)}/>
        {section==='simulations'&&<SimulationBuilder value={item.simulation} onChange={value=>itemUpdate(section,i,'simulation',value)}/>}
        <button type="button" className="gh-btn gh-btn-ghost" onClick={()=>update(section,program[section].filter((_,j)=>j!==i))}>Remove {section==='activities'?'activity':'simulation'}</button>
      </div>)}<button type="button" className="gh-btn" disabled={program[section].length>=20} onClick={()=>update(section,[...program[section],{title:'',outcome:'',instructions:'',milestoneId:program.milestones[0].id,...(section==='simulations'?{simulation:null}:{})}])}>Add {section==='activities'?'activity':'simulation'}</button></section>)}
      <p>Save to continue editing lessons in the LMS. Students see this program after you publish it.</p>
      <div className="sw-actions"><button className="gh-btn gh-btn-primary" disabled={!classId}>{busy?'Saving…':'Save program draft'}</button><button type="button" className="gh-btn gh-btn-ghost" onClick={()=>{if(!dirty||window.confirm('Discard this unsaved program?'))onCancel();}}>Cancel</button></div>
    </fieldset></form>{error&&<p role="alert" className="sw-error">{error}</p>}{status&&<p role="status">{status}</p>}
  </section>;
}
