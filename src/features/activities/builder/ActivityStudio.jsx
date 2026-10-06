import { cloneElement, lazy, Suspense, useEffect, useId, useMemo, useRef, useState } from 'react';
import { BLOCK_TYPES, sampleActivity, safetyWarnings, validateActivity } from '../spec/activitySpec.js';
import { simulationFromPrompt } from '../../school/simulationModel.js';
import { schoolRequest } from '../../../services/api/apiClient.js';
import { useActivityText } from './activityMessages.js';
import './activityBuilder.css';
const ActivityPlayer=lazy(()=>import('./ActivityPlayer.jsx'));
export function blankActivity(){return {version:1,title:'',summary:'',ageBand:'13-15',durationMinutes:30,standards:[],materials:[],safety:{hazards:[],notes:''},resources:[],blocks:[{type:'intro',text:''},{type:'reflection',prompt:''}],provenance:{aiAssisted:false}};}
export function reorderBlocks(blocks,from,to){
 const order=blocks.map((_,i)=>i);const [moved]=order.splice(from,1);order.splice(to,0,moved);
 return order.map(i=>blocks[i].type==='chart'?{...blocks[i],table:order.indexOf(blocks[i].table)}:blocks[i]);
}
function newBlock(type,blocks){
 const table=blocks.findIndex(b=>b.type==='dataTable'),columns=blocks[table]?.columns;
 return ({intro:{type,text:''},steps:{type,items:[{text:'',evidenceHint:''}]},prediction:{type,question:''},simulation:{type,simulation:simulationFromPrompt('Design a resource system')},dataTable:{type,columns:[{key:'input',label:''},{key:'output',label:''}],rows:3},chart:{type,table,x:columns?.[0]?.key||'input',y:columns?.[1]?.key||columns?.[0]?.key||'output',kind:'bar'},check:{type,questions:[{prompt:'',choices:['',''],answerIndex:0,explanation:''}]},code:{type,language:'micropython',code:'',explanation:''},reflection:{type,prompt:''}})[type];
}
export default function ActivityStudio({school,offering,classes,template,lesson,onSaved,onClose}) {
 const {t,diagnostic,warning}=useActivityText();
 const choices=classes.filter(c=>offering.classIds.includes(c.id));
 const [spec,setSpec]=useState(()=>lesson?.activity||blankActivity());
 const [blockKeys,setBlockKeys]=useState(()=>(lesson?.activity||blankActivity()).blocks.map(()=>crypto.randomUUID()));
 const [content,setContent]=useState(()=>({classId:lesson?.classId||choices[0]?.id||'',milestoneId:lesson?.milestoneId||template.milestones[0]?.id||'',outcome:lesson?.outcome||'',instructions:lesson?.instructions||''}));
 const [saved,setSaved]=useState(lesson||null),[dirty,setDirty]=useState(!lesson),[busy,setBusy]=useState(false),[status,setStatus]=useState(''),[error,setError]=useState(''),[apiErrors,setApiErrors]=useState([]),[blockType,setBlockType]=useState('intro'),[width,setWidth]=useState('desktop'),[review,setReview]=useState(false);
 const [aiPrompt,setAiPrompt]=useState(''),[aiKit,setAiKit]=useState(''),[aiStandards,setAiStandards]=useState(''),[aiAge,setAiAge]=useState('13-15'),[aiMinutes,setAiMinutes]=useState(30),[aiDraft,setAiDraft]=useState(null),[aiState,setAiState]=useState(''),[drafts,setDrafts]=useState([]),[draftState,setDraftState]=useState('loading'),[draftError,setDraftError]=useState(''),[instructions,setInstructions]=useState({}),[replace,setReplace]=useState(false),[aiUsage,setAiUsage]=useState(null);
 const [submitted,setSubmitted]=useState(false);
 const mounted=useRef(true);useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 useEffect(()=>{
  const onBeforeUnload=(e)=>{if(dirty){e.preventDefault();e.returnValue='';}};
  window.addEventListener('beforeunload',onBeforeUnload);
  return ()=>window.removeEventListener('beforeunload',onBeforeUnload);
 },[dirty]);
 function confirmDiscardIfDirty(){
  if(dirty && (saved || spec.title.trim()) && typeof window!=='undefined' && window.confirm && !window.confirm('You have unsaved changes in this activity. Are you sure you want to discard them?')) return false;
  return true;
 }
 function handleClose(){
  if(dirty && typeof window!=='undefined' && window.confirm && !window.confirm('You have unsaved changes in this activity. Are you sure you want to close?')) return;
  onClose?.();
 }
 const base=`/api/schools/${encodeURIComponent(school.id)}/program-offerings/${encodeURIComponent(offering.id)}/lessons`;
 const aiBase=base.replace(/\/lessons$/,'/activity-drafts');
 function aiFailure(e){return t(`ai_${e.code}`)===`ai_${e.code}`?t(e.code==='FORBIDDEN'?'denied':'aiError'):t(`ai_${e.code}`);}
 async function reloadDrafts(){setDraftState('loading');setDraftError('');try{const result=await schoolRequest('GET',aiBase);if(mounted.current){setDrafts(result.items||[]);if(lesson?.activityDraftId&&!aiDraft){const linked=result.items?.find(d=>d.draftId===lesson.activityDraftId);if(linked)setAiDraft({draftId:linked.draftId,revision:linked.revision});}setDraftState('ready');}}catch(e){if(mounted.current){setDraftState('error');setDraftError(aiFailure(e));}}}
 useEffect(()=>{reloadDrafts();},[aiBase]);
 function acceptDraft(result){setInstructions({});setAiUsage(result.usage||null);setSpec(result.spec);setBlockKeys(result.spec.blocks.map(()=>crypto.randomUUID()));setAiDraft({draftId:result.draftId,revision:result.revision});setSaved(null);setDirty(true);setApiErrors([]);setError('');setStatus('aiGenerated');setReplace(false);setContent(old=>({...old,outcome:result.spec.summary,instructions:result.spec.summary}));}
 async function generate(e){e.preventDefault();setBusy(true);setSubmitted(true);setAiState('generate');setError('');try{const result=await schoolRequest('POST',`${aiBase}/generate`,{body:{prompt:aiPrompt,ageBand:aiAge,durationMinutes:aiMinutes,materials:aiKit.split('\n').filter(v=>v.trim()),standards:aiStandards.split('\n').filter(v=>v.trim()),milestoneId:content.milestoneId,keySource:'school'}});if(mounted.current){acceptDraft(result);reloadDrafts();}}catch(e){if(mounted.current)setError(aiFailure(e));}finally{if(mounted.current){setBusy(false);setAiState('');}}}
 async function syncAiDraft(clean){if(!aiDraft)return null;const result=await schoolRequest('PATCH',`${aiBase}/${aiDraft.draftId}`,{body:{revision:aiDraft.revision,spec:clean}});const next={draftId:aiDraft.draftId,revision:result.revision};setAiDraft(next);return next;}
 async function regenerate(index){setBusy(true);setSubmitted(true);setAiState(`block-${index}`);setError('');try{const clean=validateActivity(spec);const synced=await syncAiDraft(clean);const result=await schoolRequest('POST',`${aiBase}/${synced.draftId}/regenerate-block`,{body:{revision:synced.revision,blockIndex:index,instruction:instructions[blockKeys[index]]}});if(mounted.current){setAiUsage(result.usage);setSpec(result.spec);setAiDraft({...synced,revision:result.revision});setDirty(true);setStatus('aiGenerated');reloadDrafts();}}catch(e){if(mounted.current){setError(aiFailure(e));setApiErrors(e.details||e.errors||[]);}}finally{if(mounted.current){setBusy(false);setAiState('');}}}
 const validated=useMemo(()=>{try{return {clean:validateActivity(spec),errors:[]};}catch(e){return {clean:null,errors:e.errors||[]};}},[spec]);
 const warnings=validated.clean?safetyWarnings(validated.clean):[];
 const errors=[...validated.errors,...apiErrors];
 const frozen=saved?.status==='published';
 function update(next){setSpec(next);setDirty(true);setStatus('');setApiErrors([]);setError('');}
 function updateContent(key,value){setContent(old=>({...old,[key]:value}));setDirty(true);setStatus('');setError('');}
 function reset(next){if(!confirmDiscardIfDirty()) return;setInstructions({});setBlockKeys(next.blocks.map(()=>crypto.randomUUID()));update(next);setSaved(null);setAiDraft(null);setAiUsage(null);setReplace(false);setSubmitted(false);}
 function changeBlock(i,next){update({...spec,blocks:spec.blocks.map((b,j)=>i===j?next:b)});}
 function move(i,d){const to=i+d;if(to<0||to>=spec.blocks.length)return;setBlockKeys(keys=>{const next=[...keys];next.splice(to,0,next.splice(i,1)[0]);return next;});update({...spec,blocks:reorderBlocks(spec.blocks,i,to)});}
 function remove(i){setBlockKeys(keys=>keys.filter((_,idx)=>idx!==i));const order=spec.blocks.map((_,idx)=>idx).filter(idx=>idx!==i);update({...spec,blocks:order.map(idx=>spec.blocks[idx].type==='chart'?{...spec.blocks[idx],table:order.indexOf(spec.blocks[idx].table)}:spec.blocks[idx])});}
 async function save(){
  setBusy(true);setSubmitted(true);setError('');setApiErrors([]);
  try {
   const clean=validateActivity(spec);
   const synced=await syncAiDraft(clean);
   const body={...content,title:clean.title,activity:clean,...(synced?{activityDraftId:synced.draftId,activityDraftRevision:synced.revision}:{}),...(saved?{revision:saved.revision}:{})};
   const result=await schoolRequest(saved?'PATCH':'POST',saved?`${base}/${saved.id}`:base,{body});
   setSaved(saved?{...saved,...body,revision:saved.revision+1}:result);setDirty(false);setStatus('saved');onSaved?.();
  }catch(e){setError(aiDraft?aiFailure(e):t(e.code==='FORBIDDEN'?'denied':'saveFailed'));setApiErrors(e.details||e.errors||[]);}finally{setBusy(false);}
 }
 async function publish(){
  setBusy(true);setSubmitted(true);setError('');
  try{const result=await schoolRequest('POST',`${base}/${saved.id}/publish`,{body:{revision:saved.revision,safetyConfirmed:true}});if(result.provenance)setSpec(old=>({...old,provenance:result.provenance}));setSaved(old=>({...old,status:'published',revision:old.revision+1}));setReview(false);setStatus('published');onSaved?.();}
  catch(e){setError(t(e.code==='FORBIDDEN'?'denied':'publishFailed'));}finally{setBusy(false);}
 }
 const fieldErrors=path=>errors.filter(e=>e.path===path);
 const problem=(path)=>fieldErrors(path).map((e,i)=><small className="ab-error" role="alert" key={i}>{e.path}: {diagnostic(e.message)}</small>);
 const field=(key,control,path=key)=><ValidationField label={t(key)} {...{path,errors,diagnostic}}>{control}</ValidationField>;
 return <section className="ab-studio" aria-label={t('studio')}>
  <header className="ab-header"><div><span className="ab-badge">{spec.provenance.aiAssisted?t(spec.provenance.reviewedBy?'aiReviewed':'aiBadge',{model:spec.provenance.model,coach:spec.provenance.reviewedBy}):t('manual')}</span><h3>{t('studio')}</h3></div><button type="button" disabled={busy} onClick={handleClose}>{t('close')}</button></header>
  <div className="ab-actions"><button type="button" disabled={busy} onClick={()=>reset(blankActivity())}>{t('blank')}</button><button type="button" disabled={busy} onClick={()=>reset(sampleActivity())}>{t('sample')}</button></div>
  {!saved&&<section className="ab-ai ab-card" aria-label={t('aiDescribe')}>
   <h4>{t('aiDescribe')}</h4><p className="ab-muted">{t('aiPrivacy')}</p>
   <form onSubmit={generate}><fieldset className="ab-unbordered" disabled={busy}>
    {field('aiPrompt',<textarea required maxLength={2000} value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)}/>)}
    <div className="ab-grid">{field('age',<select value={aiAge} onChange={e=>setAiAge(e.target.value)}><option>13-15</option><option>16-18</option></select>,'ai.age')}{field('minutes',<input type="number" min={10} max={240} value={aiMinutes} onChange={e=>setAiMinutes(Number(e.target.value))}/>,'ai.minutes')}</div>
    {field('aiKit',<textarea value={aiKit} onChange={e=>setAiKit(e.target.value)}/>)}{field('standards',<textarea value={aiStandards} onChange={e=>setAiStandards(e.target.value)}/>,'ai.standards')}
    {spec.title.trim()&&<label className="ab-choice"><input type="checkbox" checked={replace} onChange={e=>setReplace(e.target.checked)}/>{t('aiReplace')}</label>}
    <button className="ab-primary" disabled={busy||!aiPrompt.trim()||Boolean(spec.title.trim()&&!replace)}>{t(aiState==='generate'?'aiGenerating':'aiGenerate')}</button>
   </fieldset></form>
   <details><summary>{t('aiDrafts')}</summary>{draftState==='loading'&&<p role="status">{t('aiLoading')}</p>}{draftError&&<p role="alert">{draftError}</p>}{draftState==='ready'&&!drafts.length&&<p>{t('aiEmpty')}</p>}<button type="button" disabled={busy||draftState==='loading'} onClick={reloadDrafts}>{t('aiRefresh')}</button>{drafts.map(d=><div className="ab-card" key={d.draftId}><strong>{d.spec.title}</strong><small className="ab-muted"> {d.model}</small><div className="ab-actions"><button type="button" disabled={busy||Boolean(spec.title.trim()&&!replace)} onClick={()=>{if(confirmDiscardIfDirty()) acceptDraft(d);}}>{t('aiResume')}</button><button type="button" disabled={busy||aiDraft?.draftId===d.draftId} onClick={async()=>{setBusy(true);try{await schoolRequest('DELETE',`${aiBase}/${d.draftId}`,{body:{}});if(aiDraft?.draftId===d.draftId)setAiDraft(null);reloadDrafts();}catch(e){setError(aiFailure(e));}finally{setBusy(false);}}}>{t('aiDelete')}</button></div></div>)}</details>
  </section>}
  {busy&&aiState&&<p role="status">{t(aiState==='generate'?'aiGenerating':'aiRegenerating')}</p>}
  {aiUsage&&<p className="ab-muted">{t('aiUsage',{input:aiUsage.inputTokens,output:aiUsage.outputTokens})}</p>}
  {spec.provenance.aiAssisted&&!frozen&&<p>{t('aiUnreviewed')}</p>}
  {frozen&&<p role="status">{t('frozen')}</p>}
  <fieldset disabled={busy||frozen} className="ab-unbordered">
   <div className="ab-grid">
    {field('title',<input maxLength={120} aria-invalid={fieldErrors('title').length>0} value={spec.title} onChange={e=>update({...spec,title:e.target.value})}/>)}
    {field('age',<select value={spec.ageBand} onChange={e=>update({...spec,ageBand:e.target.value})}><option>13-15</option><option>16-18</option></select>,'ageBand')}
    {field('minutes',<input type="number" min={10} max={240} value={spec.durationMinutes} onChange={e=>update({...spec,durationMinutes:Number(e.target.value)})}/>,'durationMinutes')}
   </div>
   {field('summary',<textarea maxLength={500} value={spec.summary} onChange={e=>update({...spec,summary:e.target.value})}/>)}
   {field('standards',<textarea value={spec.standards.join('\n')} onChange={e=>update({...spec,standards:e.target.value?e.target.value.split('\n'):[]})}/>)}
   <details className="ab-card"><summary>{t('materials')} / {t('safety')} / {t('resources')}</summary>
    <ListEditor title={t('materials')} items={spec.materials} create={()=>({name:'',quantity:'',safetyNote:''})} onChange={materials=>update({...spec,materials})} render={(m,onChange,i)=><>{['name','quantity','safetyNote'].map(k=>field(k,<input maxLength={k==='name'?80:k==='quantity'?40:200} value={m[k]||''} onChange={e=>onChange({...m,[k]:e.target.value})}/>,`materials[${i}].${k}`))}</>} t={t}/>{problem('materials')}
    {field('hazards',<textarea value={spec.safety.hazards.join('\n')} onChange={e=>update({...spec,safety:{...spec.safety,hazards:e.target.value?e.target.value.split('\n'):[]}})}/>,'safety.hazards')}
    {field('notes',<textarea maxLength={1000} value={spec.safety.notes} onChange={e=>update({...spec,safety:{...spec.safety,notes:e.target.value}})}/>,'safety.notes')}
    <ListEditor title={t('resources')} items={spec.resources} create={()=>({title:'',url:''})} onChange={resources=>update({...spec,resources})} render={(r,onChange,i)=><>{['title','url'].map(k=>field(k,<input maxLength={k==='title'?120:500} value={r[k]} onChange={e=>onChange({...r,[k]:e.target.value})}/>,`resources[${i}].${k}`))}</>} t={t}/>{problem('resources')}
   </details>
   <h4>{t('blocks')}</h4><p className="ab-muted">{t('keyboard')}</p>
   {spec.blocks.map((b,i)=><article className="ab-card" key={blockKeys[i]}>
    <div className="ab-header"><h4>{i+1}. {t(b.type)}</h4><div className="ab-actions">{[-1,1].map(d=><button type="button" key={d} disabled={i+d<0||i+d>=spec.blocks.length} aria-label={`${t(d===-1?'up':'down')} ${i+1}`} onClick={()=>move(i,d)} onKeyDown={e=>{if(e.altKey&&(e.key==='ArrowUp'||e.key==='ArrowDown')){e.preventDefault();move(i,e.key==='ArrowUp'?-1:1);}}}>{t(d===-1?'up':'down')}</button>)}<button type="button" disabled={spec.blocks.length===1} onClick={()=>remove(i)} aria-label={`${t('remove')} ${i+1}`}>{t('remove')}</button></div></div>
    {aiDraft&&<div className="ab-ai-block"><label>{t('aiInstruction')} {i+1}<textarea maxLength={500} value={instructions[blockKeys[i]]||''} onChange={e=>setInstructions(old=>({...old,[blockKeys[i]]:e.target.value}))}/></label><button type="button" disabled={busy||!validated.clean||!instructions[blockKeys[i]]?.trim()} onClick={()=>regenerate(i)}>{t('aiRegenerate')} {i+1}</button></div>}
    <BlockEditor block={b} onChange={v=>changeBlock(i,v)} {...{t,errors,diagnostic}} path={`blocks[${i}]`}/>{problem(`blocks[${i}]`)}{warnings.filter(w=>w.path.startsWith(`blocks[${i}]`)).map((w,j)=><p className="ab-warning" key={j}>{warning(w.message)}</p>)}
   </article>)}
   <div className="ab-actions"><label>{t('blocks')} <select value={blockType} onChange={e=>setBlockType(e.target.value)}>{BLOCK_TYPES.map(type=><option key={type} value={type}>{t(type)}</option>)}</select></label><button type="button" disabled={spec.blocks.length>=20} onClick={()=>{setBlockKeys(keys=>[...keys,crypto.randomUUID()]);update({...spec,blocks:[...spec.blocks,newBlock(blockType,spec.blocks)]});}}>{t('add')}</button></div>{problem('blocks')}
   <details className="ab-card" open><summary>{t('lesson')}</summary><div className="ab-grid">{field('class',<select value={content.classId} onChange={e=>updateContent('classId',e.target.value)}>{choices.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>)}{field('milestone',<select value={content.milestoneId} onChange={e=>updateContent('milestoneId',e.target.value)}>{template.milestones.map(m=><option key={m.id} value={m.id}>{m.title}</option>)}</select>)}</div>{field('outcome',<textarea maxLength={1000} value={content.outcome} onChange={e=>updateContent('outcome',e.target.value)}/>)}{field('instructions',<textarea maxLength={10000} value={content.instructions} onChange={e=>updateContent('instructions',e.target.value)}/>)}</details>
  </fieldset>
  {warnings.length>0&&<aside className="ab-warning"><h4>{t('warnings')}</h4><ul>{warnings.map((w,i)=><li key={i}>{w.path}: {warning(w.message)}</li>)}</ul></aside>}
  {errors.length>0&&<p role="status">{t('validation')}</p>}{error&&<p role="alert" className="ab-error">{error}</p>}{status&&<p role="status">{t(status)}</p>}
  <div className="ab-actions"><button type="button" className="ab-primary" disabled={busy||frozen||!dirty||!validated.clean||!content.classId||!content.outcome.trim()||!content.instructions.trim()} onClick={save}>{t(busy?'saving':'save')}</button><button type="button" disabled={busy||frozen||dirty||!saved} onClick={()=>setReview(true)}>{t('publish')}</button>{dirty&&saved&&<small>{t('edited')}</small>}</div>
  <section className="ab-preview"><div className="ab-header"><h4>{t('preview')}</h4><div className="ab-actions">{['desktop','mobile'].map(w=><button type="button" key={w} aria-pressed={width===w} onClick={()=>setWidth(w)}>{t(w)}</button>)}</div></div><div style={{width:width==='mobile'?390:'100%',maxWidth:'100%',margin:'auto'}}>{validated.clean?<Suspense fallback={<p role="status">{t('loading')}</p>}><ActivityPlayer key={JSON.stringify(validated.clean)} spec={validated.clean} preview/></Suspense>:<p>{t('validation')}</p>}</div></section>
  {review&&<PublishDialog {...{warnings,t,warning,busy,error}} onCancel={()=>{if(!busy)setReview(false);}} onPublish={publish}/>}
 </section>;
}
function ListEditor({title,items,create,onChange,render,t}) {
 return <fieldset className="ab-list"><legend>{title}</legend>{items.map((item,i)=><div className="ab-card" key={i}>{render(item,next=>onChange(items.map((old,j)=>j===i?next:old)),i)}<button type="button" onClick={()=>onChange(items.filter((_,j)=>i!==j))}>{t('remove')} {i+1}</button></div>)}<button type="button" onClick={()=>onChange([...items,create()])}>{t('add')} {title}</button></fieldset>;
}
function ValidationField({label,path,errors,diagnostic,children}) {
 const id=useId();
 const ownErrors=errors.filter(e=>e.path===path);
 return <label className="ab-field" htmlFor={id}>{label}{cloneElement(children,{id,'aria-label':label,'aria-invalid':ownErrors.length>0,'aria-describedby':ownErrors.length?`${id}-errors`:undefined})}<span id={`${id}-errors`}>{ownErrors.map((e,i)=><small className="ab-error" role="alert" key={i}>{e.path}: {diagnostic(e.message)}</small>)}</span></label>;
}
function BlockEditor({block:b,onChange,t,path,errors,diagnostic}) {
 const field=(key,control,sub=key)=><ValidationField key={sub} label={t(key)} path={`${path}.${sub}`} {...{errors,diagnostic}}>{control}</ValidationField>;
 const text=(key,max=2000)=>field(key,<textarea maxLength={max} value={b[key]||''} onChange={e=>onChange({...b,[key]:e.target.value})}/>);
 const list=(key,create,render)=><ListEditor title={t(key)} items={b[key]} create={create} onChange={items=>onChange({...b,[key]:items})} {...{render,t}}/>;
 if(b.type==='intro')return text('text');
 if(b.type==='reflection')return text('prompt',500);
 if(b.type==='steps')return list('items',()=>({text:'',evidenceHint:''}),(it,change,i)=><>{['text','evidenceHint'].map(k=>field(k,<textarea maxLength={k==='text'?500:200} value={it[k]||''} onChange={e=>change({...it,[k]:e.target.value})}/>,`items[${i}].${k}`))}</>);
 if(b.type==='prediction')return <>{text('question',300)}{field('choices',<textarea value={b.choices?.join('\n')||''} onChange={e=>onChange({...b,choices:e.target.value?e.target.value.split('\n'):undefined})}/>)}</>;
 if(b.type==='dataTable')return <>{list('columns',()=>({key:'',label:'',unit:''}),(col,change,i)=><>{['key','label','unit'].map(k=>field(k,<input value={col[k]||''} onChange={e=>change({...col,[k]:e.target.value})}/>,`columns[${i}].${k}`))}</>)}{field('rows',<input type="number" min={1} max={30} value={b.rows} onChange={e=>onChange({...b,rows:Number(e.target.value)})}/>)}</>;
 if(b.type==='chart')return <><p>{t('oneBased')}</p>{field('table',<input type="number" min={1} value={b.table+1} onChange={e=>onChange({...b,table:Number(e.target.value)-1})}/>)}{['x','y'].map(k=>field(k,<input value={b[k]} onChange={e=>onChange({...b,[k]:e.target.value})}/>))}{field('kind',<select value={b.kind||'bar'} onChange={e=>onChange({...b,kind:e.target.value})}>{['bar','line'].map(k=><option key={k} value={k}>{t(k)}</option>)}</select>)}</>;
 if(b.type==='simulation')return <>{['title','question','resource','unit','reflection'].map(k=>field(k,<textarea value={b.simulation[k]} onChange={e=>onChange({...b,simulation:{...b.simulation,[k]:e.target.value}})}/>,`simulation.${k}`))}{['demand','capacity','cost','budget'].map(k=>field(k,<input type="number" min={1} value={b.simulation[k]} onChange={e=>onChange({...b,simulation:{...b.simulation,[k]:Number(e.target.value)}})}/>,`simulation.${k}`))}</>;
 if(b.type==='code')return <>{field('language',<select value={b.language} onChange={e=>onChange({...b,language:e.target.value})}><option>micropython</option><option>makecode-text</option></select>)}{text('code',6000)}{text('explanation',1000)}</>;
 return list('questions',()=>({prompt:'',choices:['',''],answerIndex:0,explanation:''}),(q,change,i)=><>{['prompt','explanation'].map(k=>field(k,<textarea maxLength={k==='prompt'?300:500} value={q[k]} onChange={e=>change({...q,[k]:e.target.value})}/>,`questions[${i}].${k}`))}{field('choices',<textarea value={q.choices.join('\n')} onChange={e=>change({...q,choices:e.target.value.split('\n')})}/>,`questions[${i}].choices`)}{field('answerIndex',<input type="number" min={1} max={q.choices.length} value={q.answerIndex+1} onChange={e=>change({...q,answerIndex:Number(e.target.value)-1})}/>,`questions[${i}].answerIndex`)}</>);
}
function PublishDialog({warnings,t,warning,busy,error,onCancel,onPublish}) {
 const [confirmed,setConfirmed]=useState(false);const ref=useRef();const labelId=useId();const initialCancel=useRef(onCancel);initialCancel.current=onCancel;
 useEffect(()=>{const previous=document.activeElement;ref.current?.querySelector('input')?.focus();return()=>previous?.focus?.();},[]);
 return <div className="ab-overlay" onClick={e=>{if(e.target===e.currentTarget)onCancel();}}><section className="ab-dialog" ref={ref} role="dialog" aria-modal="true" aria-labelledby={labelId} onKeyDown={e=>{
  if(e.key==='Escape'){e.preventDefault();initialCancel.current();}
  if(e.key==='Tab'){const nodes=[...ref.current.querySelectorAll('button,input')].filter(node=>!node.disabled);if(!nodes.length){e.preventDefault();return;}if(e.shiftKey&&document.activeElement===nodes[0]){e.preventDefault();nodes.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===nodes.at(-1)){e.preventDefault();nodes[0].focus();}}
 }} tabIndex={-1}><h3 id={labelId}>{t('review')}</h3><ul>{warnings.map((w,i)=><li key={i}>{warning(w.message)}</li>)}</ul><label className="ab-choice"><input type="checkbox" disabled={busy} checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>{t('confirm')}</label>{error&&<p role="alert">{error}</p>}<div className="ab-actions"><button type="button" disabled={busy} onClick={onCancel}>{t('cancel')}</button><button type="button" className="ab-primary" disabled={!confirmed||busy} onClick={onPublish}>{t(busy?'saving':'publish')}</button></div></section></div>;
}
