import React, { useState } from 'react';
import { BAND_LABELS, gradeLevel, suggestedGrade } from './curriculum.js';
export function LearningSettings({state,act}) {
 const [age,setAge]=useState('');
 const canChange=['shore','shop','flight','surface'].includes(state.stage);
 const suggestion=suggestedGrade(Number(age));
 return <details className="fc-learning"><summary>Grade {state.grade} · {state.support} support · Learning settings</summary>
 <div className="fc-learning-fields"><label>School grade <select value={state.grade} disabled={!canChange} onChange={e=>act('set-grade',{grade:Number(e.target.value)})}>{[6,7,8,9,10,11,12].map(g=><option key={g} value={g}>Grade {g}</option>)}</select></label>
 <label>Support <select value={state.support} onChange={e=>act('set-support',{support:e.target.value})}><option value="guided">Guided · show hints</option><option value="independent">Independent · hints on request</option><option value="stretch">Stretch · add design questions</option></select></label></div>
 <p>{BAND_LABELS[gradeLevel(state.grade)]}. Grade sets the science expectations; support changes the scaffolding, not your rewards.</p>
 {!canChange && <p>Finish this mission or return to the shoreline to change grade.</p>}
 <label>Age (optional, for a starting suggestion) <input type="number" min="11" max="19" value={age} onChange={e=>setAge(e.target.value)} /></label>
 {age && (suggestion?<p>Suggested starting point: grade {suggestion}. School systems differ; choose your actual grade. <button type="button" disabled={!canChange} onClick={()=>{act('set-grade',{grade:suggestion});setAge('');}}>Use grade {suggestion}</button></p>:<p>Choose grade 6–12 directly, or enter an age from 11–19.</p>)}
 <small>Age is not sent to Gemini or stored. Your teacher can help choose the right starting level.</small>
 </details>;
}
export function StandardsNote({standard}) {
 return <details className="fc-standards"><summary>NGSS learning target · {standard.id}</summary><p><a href={standard.url} target="_blank" rel="noreferrer">Read {standard.id}</a></p><p>Practice: {standard.practice}</p><p>Core idea: {standard.core}</p><p>{standard.connection}</p><small>This activity supports part of the performance expectation. A correct choice alone does not demonstrate mastery of the full standard; investigation and an evidence-based explanation are still needed.</small></details>;
}
