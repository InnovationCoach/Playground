import { useState } from 'react';
import { runSimulation, simulationFromPrompt } from './simulationModel.js';
export function SimulationBuilder({value,onChange}) {
  const [prompt,setPrompt]=useState(''),[error,setError]=useState('');
  return <details className="sw-card"><summary>Build an interactive simulation</summary>
    <p>Describe a resource challenge: solar power, rainwater collection, or supplying a community. This starter builds a simple resource model you can adapt. It does not generate arbitrary code or use AI.</p>
    <label className="sw-field">Activity prompt<textarea maxLength={2000} value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Students design a solar system for a school, balance cost and energy, and compare three experiments."/></label>
    <button type="button" className="gh-btn" onClick={()=>{try {onChange(simulationFromPrompt(prompt));setError('');}catch(e){setError(e.message);}}}>Build simulation draft</button>{error&&<p role="alert">{error}</p>}
    {value&&<><p>Edit the assumptions, then test the preview before publishing.</p>{[['title','Simulation title'],['question','Challenge question'],['resource','Resource label'],['unit','Measurement unit'],['reflection','Reflection prompt']].map(([key,label])=><label className="sw-field" key={key}>{label}<input maxLength={key==='question'||key==='reflection'?1000:key==='unit'?30:key==='resource'?60:200} value={value[key]} onChange={e=>onChange({...value,[key]:e.target.value})}/></label>)}
      {[['demand','Resource needed',10000],['capacity','Output per unit at 100% efficiency',10000],['cost','Cost per unit',1000],['budget','Available budget',100000]].map(([key,label,max])=><label className="sw-field" key={key}>{label}<input type="number" min="1" max={max} required value={value[key]} onChange={e=>onChange({...value,[key]:Number(e.target.value)})}/></label>)}
      <SimulationLab key={JSON.stringify(value)} settings={value}/><button type="button" className="gh-btn" onClick={()=>onChange(null)}>Remove simulation</button></>}
  </details>;
}
export function SimulationLab({settings}) {
  const [units,setUnits]=useState(5),[efficiency,setEfficiency]=useState(80),[prediction,setPrediction]=useState(''),[trials,setTrials]=useState([]),[reflection,setReflection]=useState('');
  const result=runSimulation(settings,units,efficiency);
  return <section className="sw-card sw-simulation" aria-label={settings.title}><small>Interactive resource lab · simplified model</small><h4>{settings.title}</h4><p>{settings.question}</p>
    <p>Challenge: supply {settings.demand} {settings.unit} within a budget of {settings.budget} credits. Model: units × output per unit × efficiency; cost = units × cost per unit.</p>
    <label className="sw-field">My prediction<input value={prediction} maxLength={500} onChange={e=>setPrediction(e.target.value)} placeholder="I predict that…"/></label>
    <label className="sw-field">Number of units: {units}<input aria-label="Number of units" type="range" min="0" max="30" value={units} onChange={e=>setUnits(Number(e.target.value))}/></label>
    <label className="sw-field">Efficiency: {efficiency}%<input aria-label="Efficiency" type="range" min="10" max="100" value={efficiency} onChange={e=>setEfficiency(Number(e.target.value))}/></label>
    <div role="status"><strong>{settings.resource}: {result.supplied} {settings.unit}</strong><progress aria-label="Resource target reached" max={settings.demand} value={Math.min(result.supplied,settings.demand)}/><p>Cost: {result.cost} credits · Unmet need: {result.unmet} {settings.unit}</p><p>{result.success?'Challenge met! Compare your evidence.':result.cost>settings.budget?'Over budget — try another design.':'Try adjusting your design to meet the need.'}</p></div>
    <button type="button" className="gh-btn" disabled={!prediction.trim()||trials.length>=10} onClick={()=>setTrials(t=>[...t,{units,efficiency,prediction,...result}])}>Record experiment</button>
    {trials.length>0&&<><ol>{trials.map((trial,i)=><li key={i}>Experiment {i+1}: {trial.units} units at {trial.efficiency}% → {trial.supplied} {settings.unit}, {trial.cost} credits. Prediction: {trial.prediction}</li>)}</ol><button type="button" className="gh-btn" onClick={()=>{const report=[settings.title,...trials.map((t,i)=>`Experiment ${i+1}: ${t.units} units, ${t.efficiency}% efficiency, ${t.supplied} ${settings.unit}, ${t.cost} credits. Prediction: ${t.prediction}`),`Reflection: ${reflection}`].join('\n');const url=URL.createObjectURL(new Blob([report],{type:'text/plain'}));const a=document.createElement('a');a.href=url;a.download='simulation-evidence.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}}>Download experiment evidence</button></>}
    <label className="sw-field">{settings.reflection}<textarea maxLength={2000} value={reflection} onChange={e=>setReflection(e.target.value)}/></label><small>Experiments stay in this tab. Download your evidence before leaving, then submit it with your lesson work. These are simulated values, not real-world predictions.</small>
  </section>;
}
