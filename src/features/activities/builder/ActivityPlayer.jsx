import { useEffect, useId, useState } from 'react';
import { SimulationLab } from '../../school/SimulationLab.jsx';
import { schoolRequest } from '../../../services/api/apiClient.js';
import { validateActivity, validateActivityResponses } from '../spec/activitySpec.js';
import { useActivityText } from './activityMessages.js';
import './activityBuilder.css';

const empty=()=>({responses:{version:1,answers:{}},body:'',bodyEdited:false,submissionId:null,submitted:false});
function restore(spec,key,preview) {
 if(preview) return empty();
 try {
  const saved=JSON.parse(localStorage.getItem(key));
  if(!saved || typeof saved.body!=='string' || saved.body.length>5000) return empty();
  return {...empty(),responses:validateActivityResponses(spec,saved.responses),body:saved.body,bodyEdited:saved.bodyEdited===true,submissionId:typeof saved.submissionId==='string'?saved.submissionId:null,submitted:saved.submitted===true};
 } catch {return empty();}
}
export default function ActivityPlayer({spec,uid,schoolId,offeringId,lessonId,revision=1,preview=false}) {
 const {t}=useActivityText();
 let clean;
 try{clean=validateActivity(spec);}catch{return <p role="alert">{t('error')}</p>;}
 const storageKey=`activityResponses:${uid}:${schoolId}:${offeringId}:${lessonId}:${revision}`;
 return <Player key={`${storageKey}:${preview}`} spec={clean} {...{uid,schoolId,offeringId,lessonId,preview,storageKey}}/>;
}
function Player({spec,uid,schoolId,offeringId,lessonId,preview,storageKey}) {
 const {t}=useActivityText();
 const [work,setWork]=useState(()=>restore(spec,storageKey,preview)),[storageFailed,setStorageFailed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const prefix=useId();
 useEffect(()=>{if(!preview&&uid)try{localStorage.setItem(storageKey,JSON.stringify(work));}catch{setStorageFailed(true);}},[work,storageKey,preview,uid]);
 function answer(index,value) {
  setWork(old=>{const answers={...old.responses.answers,[index]:value};if(typeof value.text==='string'&&!value.text.trim())delete answers[index];return {...old,responses:{version:1,answers},body:spec.blocks[index].type==='reflection'&&!old.bodyEdited?value.text:old.body,submissionId:null,submitted:false};});setError('');
 }
 async function submit(e) {
  e.preventDefault();if(busy||work.submitted)return;
  const id=work.submissionId||crypto.randomUUID();setWork(old=>({...old,submissionId:id}));setBusy(true);setError('');
  try {
   const responses=validateActivityResponses(spec,work.responses);
   await schoolRequest('POST',`/api/schools/${encodeURIComponent(schoolId)}/program-offerings/${encodeURIComponent(offeringId)}/submissions`,{body:{submissionId:id,lessonId,body:work.body,responses}});
   setWork(old=>({...old,submitted:true}));
  } catch(e){setError(t(e.code==='FORBIDDEN'?'denied':'submitFailed'));}finally{setBusy(false);}
 }
 return <section className="ab-player" aria-label={spec.title}>
  <header><span className="ab-badge">{t('activity')} · {spec.durationMinutes} {t('minutes')} · {spec.ageBand}</span>{spec.provenance.reviewedBy&&<span className="ab-badge">{t('reviewed')}</span>}<h3>{spec.title}</h3><p>{spec.summary}</p></header>
  <p className="ab-muted">{t(preview?'previewOnly':'local')}</p>{storageFailed&&<p role="alert">{t('localFailed')}</p>}
  {(spec.materials.length>0||spec.safety.notes||spec.safety.hazards.length>0)&&<details className="ab-card"><summary>{t('materials')} / {t('safety')}</summary><ul>{spec.materials.map((m,i)=><li key={i}>{m.name} · {m.quantity}{m.safetyNote&&<p>{m.safetyNote}</p>}</li>)}</ul><ul>{spec.safety.hazards.map((h,i)=><li key={i}>{h}</li>)}</ul><p>{spec.safety.notes}</p></details>}
  <fieldset disabled={busy} className="ab-unbordered">{spec.blocks.map((block,i)=><section className="ab-card" key={i} aria-label={`${i+1}. ${t(block.type)}`}><h4>{i+1}. {t(block.type)}</h4><Block block={block} value={work.responses.answers[i]||{}} spec={spec} answers={work.responses.answers} name={`${prefix}-${i}`} onAnswer={value=>answer(i,value)} t={t}/></section>)}</fieldset>
  {spec.resources.length>0&&<aside><h4>{t('resources')}</h4><ul>{spec.resources.map((r,i)=><li key={i}><a href={r.url} target="_blank" rel="noopener noreferrer">{r.title}</a></li>)}</ul></aside>}
  {!preview&&<form className="ab-card" onSubmit={submit}><label className="ab-field">{t('body')}<textarea aria-label={t('body')} maxLength={5000} required value={work.body} disabled={busy} onChange={e=>{setWork(old=>({...old,body:e.target.value,bodyEdited:true,submitted:false,submissionId:null}));setError('');}}/></label>{error&&<p role="alert">{error}</p>}{work.submitted&&<p role="status">{t('submitted')}</p>}<button className="ab-primary" disabled={busy||work.submitted||!uid||!work.body.trim()}>{t(busy?'submitting':'submit')}</button></form>}
 </section>;
}
function Block({block:b,value:v,spec,answers,name,onAnswer,t}) {
 const [copyState,setCopyState]=useState('');
 if(b.type==='intro')return <p className="ab-preserve">{b.text}</p>;
 if(b.type==='steps')return <ol className="ab-steps">{b.items.map((item,j)=><li key={j}><label><input type="checkbox" checked={(v.done||[]).includes(j)} onChange={e=>onAnswer({done:e.target.checked?[...(v.done||[]),j]:(v.done||[]).filter(k=>k!==j)})}/>{item.text}</label>{item.evidenceHint&&<small>{item.evidenceHint}</small>}</li>)}</ol>;
 if(b.type==='prediction')return <fieldset className="ab-unbordered"><legend>{b.question}</legend>{b.choices?b.choices.map((ch,j)=><label className="ab-choice" key={j}><input type="radio" name={name} checked={v.choice===j} onChange={()=>onAnswer({choice:j})}/>{ch}</label>):<label className="ab-field">{t('answer')}<textarea aria-label={t('answer')} value={v.text||''} maxLength={2000} onChange={e=>onAnswer({text:e.target.value})}/></label>}</fieldset>;
 if(b.type==='simulation')return <SimulationLab settings={b.simulation} initialTrials={v.trials||[]} onTrialsChange={trials=>onAnswer({trials})} activityLabels={t}/>;
 if(b.type==='dataTable')return <div className="ab-table-scroll" tabIndex={0} aria-label={t('dataTable')}><table><caption>{t('dataTable')}</caption><thead><tr><th>{t('row')}</th>{b.columns.map(c=><th scope="col" key={c.key}>{c.label}{c.unit&&` (${c.unit})`}</th>)}</tr></thead><tbody>{Array.from({length:b.rows},(_,j)=><tr key={j}><th scope="row">{j+1}</th>{b.columns.map(c=><td key={c.key}><input aria-label={`${t('row')} ${j+1}: ${c.label}`} maxLength={60} value={v.rows?.[j]?.[c.key]??''} onChange={e=>{const rows=Array.from({length:b.rows},(_,k)=>({...v.rows?.[k]}));rows[j][c.key]=e.target.value;onAnswer({rows});}}/></td>)}</tr>)}</tbody></table></div>;
 if(b.type==='chart')return <Chart block={b} table={spec.blocks[b.table]} rows={answers[b.table]?.rows||[]} t={t}/>;
 if(b.type==='check')return <>{b.questions.map((q,j)=><fieldset key={j} className="ab-check"><legend>{q.prompt}</legend>{q.choices.map((ch,k)=><label className="ab-choice" key={k}><input type="radio" name={`${name}-${j}`} checked={v.selected?.[j]===k} onChange={()=>{const selected=Array.from({length:b.questions.length},(_,idx)=>v.selected?.[idx]??null);selected[j]=k;onAnswer({selected});}}/>{ch}</label>)}{v.selected?.[j]!=null&&<div role="status"><strong>{t(v.selected[j]===q.answerIndex?'correct':'retry')}</strong><p>{q.explanation}</p></div>}</fieldset>)}</>;
 if(b.type==='code')return <><p>{b.language}</p><pre><code>{b.code}</code></pre><p>{b.explanation}</p><button type="button" onClick={async()=>{try{await navigator.clipboard.writeText(b.code);onAnswer({copied:true});setCopyState('copied');}catch{setCopyState('copyFailed');}}}>{t('copy')}</button><span role="status">{copyState&&t(copyState)}</span></>;
 return <label className="ab-field">{b.prompt}<textarea aria-label={b.prompt} maxLength={2000} value={v.text||''} onChange={e=>onAnswer({text:e.target.value})}/></label>;
}
function Chart({block:b,table,rows,t}) {
 const points=rows.filter(r=>String(r[b.y]??'').trim()!==''&&Number.isFinite(Number(r[b.y]))).map(r=>({x:String(r[b.x]??''),y:Number(r[b.y])}));
 const xcol=table.columns.find(c=>c.key===b.x),ycol=table.columns.find(c=>c.key===b.y);
 if(!points.length)return <p>{t('emptyChart')}</p>;
 const min=Math.min(0,...points.map(p=>p.y)),max=Math.max(0,...points.map(p=>p.y));const scale=y=>160-(y-min)/(max-min||1)*140;
 const base=scale(0),step=300/points.length;
 return <figure className="ab-chart"><figcaption>{xcol.label} → {ycol.label}{ycol.unit&&` (${ycol.unit})`}</figcaption><svg viewBox="0 0 320 180" aria-hidden="true"><line x1="10" x2="310" y1={base} y2={base} stroke="currentColor"/>{b.kind==='line'?<polyline fill="none" stroke="#285766" strokeWidth="3" points={points.map((p,i)=>`${10+step*(i+.5)},${scale(p.y)}`).join(' ')}/>:points.map((p,i)=><rect key={i} x={10+step*i+step*.12} y={Math.min(scale(p.y),base)} width={step*.76} height={Math.max(1,Math.abs(scale(p.y)-base))} fill="#285766"/>)}{points.map((p,i)=><circle key={i} cx={10+step*(i+.5)} cy={scale(p.y)} r="3" fill="#285766"/>)}</svg><ul aria-label={t('chart')}>{points.map((p,i)=><li key={i}>{p.x}: {p.y} {ycol.unit||''}</li>)}</ul></figure>;
}
