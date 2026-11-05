import React, { useEffect, useReducer, useRef, useState } from 'react';
import { SHOP, newAdventure, play, credits, nextTip } from './adventure.js';
import './firstContact.css';
import { PlanetExpedition } from './PlanetExpedition.jsx';
import { LearningSettings, StandardsNote } from './LearningSettings.jsx';
import { signalChallenge, STEAM } from './curriculum.js';
import { PARTS, missionById } from './expeditions.js';
import { ShipArt } from './ShipArt.jsx';
import { MissionWorkshop } from './MissionWorkshop.jsx';

export function FirstContact({ inline = false, allowGemini = false }) {
  const [state, dispatch] = useReducer(play, undefined, newAdventure);
  const [hint, setHint] = useState(false);
  const heading = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) heading.current?.focus();
    started.current = true;
    setHint(false);
    return () => globalThis.speechSynthesis?.cancel();
  }, [state.stage]);
  const act = (type, extra = {}) => dispatch({ type, ...extra });
  const mission = missionById(state.mission,state.grade);
  const challenge = signalChallenge(state.grade);
  const sites = challenge.sites, reasons = challenge.reasons;
  const titles = { shore: 'A signal from Thalassa', receiver: 'Place your receiver', signal: 'Which receiver site meets the criteria?', reason: 'Show why', reward: 'You heard us.', ship: 'Let’s build your ship', shop: 'The shoreline trading post', beacon: 'A light beyond the bay', pier: 'Delivery to the outer pier' };
  const intro = { shore: 'Beside a broken spacecraft, a Tidekeeper flashes three symbols: ◇ ≋ ✧. It points to the ship, then to you. Someone needs your help.', receiver: 'The Tidekeeper lifts a receiver and points down toward the ground. Choose one of the two marked sites.', signal: challenge.criteria, reason: 'Compare the evidence with every design criterion. Choose the argument that supports your decision, then revise if needed.', reward: 'Your Translator Key reveals the first message: “You heard us. Let’s build your ship.”', ship: 'The Tidekeeper shares a hull, an engine and a navigation light. Fit the parts together to repair your starter ship.', shop: 'Spend Star Credits on something you want to investigate. Your XP stays with you when you shop.', beacon: 'The signal lens reveals a hidden beacon across the bay. It flashes the same three symbols as your new friend.', pier: 'Your cargo rack carries receiver parts to the outer pier. Another Tidekeeper waves as your ship approaches.' };
  const read = () => { if (!globalThis.speechSynthesis) return; speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(`${(mission?.title || titles[state.stage])}. ${(mission?.story || intro[state.stage])}`)); };
  if(['flight','landing-guide','surface','base-challenge'].includes(state.stage)) return <PlanetExpedition state={state} act={act}/>;
  return <section className={`fc ${inline ? 'fc-inline' : 'mx-arrival'}`} aria-labelledby="fc-title" onKeyDown={e => e.stopPropagation()}>
    <header><span>{mission?.world === 'Ignis' ? 'IGNIS · EMBERKIN EXPEDITION' : 'THALASSA · FIRST CONTACT'}</span><span>{state.bestScore + state.completed.length * 15} XP · {credits(state)} Star Credits</span></header>
    <LearningSettings state={state} act={act}/>
    <div className={`fc-scene ${mission?.world === 'Ignis' ? 'fc-ignis' : ''} ${state.owned.includes('hull') ? 'fc-violet' : ''}`} aria-label={mission?.world === 'Ignis' ? 'An Emberkin beside your ship on a volcanic world' : 'A Tidekeeper beside a ship on an ocean shore'} role="img"><span className="fc-moon"/><span className="fc-alien">◇<br/>≋</span><div className="fc-scene-ship"><ShipArt compact fitted={state.repaired ? state.fitted : ['frame']} upgrades={state.upgrades} violet={state.owned.includes('hull')}/></div><span className="fc-symbols">◇ ≋ ✧</span></div>
    <h2 id="fc-title" ref={heading} tabIndex={-1}>{(mission?.title || titles[state.stage])}</h2>
    <p>{(mission?.story || intro[state.stage])}</p>
    {globalThis.speechSynthesis && <button className="fc-quiet" onClick={read}>Read aloud</button>}
    {state.stage === 'shore' && <button onClick={() => act('meet')}>Meet the Tidekeeper →</button>}
    {state.stage === 'receiver' && <div className="fc-options">{sites.map(s => <button key={s.id} onClick={() => act('place', { site: s.id })}>📡 {s.name}<small>{s.clue}</small></button>)}</div>}
    {['signal', 'reason'].includes(state.stage) && <figure><figcaption>Fictional signal trials · same instrument, scale 0–10 · bars show means</figcaption>{sites.map(s => <div className="fc-reading" key={s.id}><span>{s.name}<small>Trials: {s.trials.join(', ')}</small></span><meter min="0" max="10" value={s.value} aria-label={`${s.name} mean signal`}/><strong>{s.value}</strong></div>)}</figure>}
    {state.stage === 'signal' && <div className="fc-options">{sites.map(s => <button key={s.id} onClick={() => act('compare', { site: s.id })}>Choose {s.name}</button>)}</div>}
    {state.stage === 'reason' && <><p className="fc-note">{challenge.criteria}</p><p>You chose: <strong>{sites.find(s => s.id === state.signal)?.name}</strong></p><div className="fc-options">{reasons.map(r => <button key={r.id} onClick={() => act('finish-card', { reason: r.id })}>{r.text}</button>)}</div></>}
    {['signal', 'reason'].includes(state.stage) && <>{state.support !== 'guided' && <button className="fc-quiet" onClick={() => setHint(!hint)}>{hint ? 'Hide hint' : 'Show a strategy'}</button>}{(hint || state.support === 'guided') && <p className="fc-note">{challenge.hint}</p>}</>}
    {['receiver', 'signal', 'reason'].includes(state.stage) && state.stage !== 'receiver' && <button className="fc-quiet" onClick={() => act('back')}>Back</button>}
    {['signal','reason'].includes(state.stage) && <><StandardsNote standard={challenge.standard}/><details open={state.support === 'stretch' || undefined}><summary>STEAM design extension</summary><p>Sketch a receiver-site plan. Label the measurements and cost, communicate your decision with words and symbols, and propose a test that could change your recommendation.</p><p>{STEAM}</p></details></>}
    {state.stage === 'reward' && <><p className="fc-note">✧ Translator Key unlocked</p><dl><dt>Site meets criteria</dt><dd>{state.lastResult.choice}/10</dd><dt>Reading the evidence</dt><dd>{state.lastResult.evidence}/10</dd><dt>Explaining your choice</dt><dd>{state.lastResult.reasoning}/10</dd></dl><p role="status">{state.lastResult.total}/30 · +{state.lastResult.gained} XP and credits. {nextTip(state.lastResult)}</p><button onClick={() => act('next-reward')}>{state.repaired ? 'Back to the shop' : 'Collect your ship parts'}</button><button className="fc-quiet" onClick={() => act('revise')}>Revise my answer</button></>}
    {state.stage === 'ship' && <><ShipArt fitted={state.fitted}/><div className="fc-parts">{PARTS.map(part=><article key={part.id}><ShipArt item={part.id}/><h3>{part.name}</h3><p>{part.purpose}</p><button disabled={state.fitted.includes(part.id)} onClick={()=>act('fit',{part:part.id})}>{state.fitted.includes(part.id)?'Fitted':`Fit ${part.name}`}</button></article>)}</div><button disabled={state.fitted.length!==PARTS.length} onClick={() => act('build')}>Assemble starter ship →</button></>}
    {state.stage === 'shop' && <><button onClick={()=>act('launch')}>Launch planetary expedition →</button><div className="fc-options">{SHOP.map(item => <article key={item.id}><strong>{item.name}</strong><p>{item.detail}</p><button disabled={state.owned.includes(item.id) || credits(state) < item.price} onClick={() => act('buy', { item: item.id })}>{state.owned.includes(item.id) ? 'Owned' : `${item.price} credits`}</button></article>)}</div>{state.owned.includes('lens') && <button onClick={() => act('travel', { destination: 'beacon' })}>{state.visitedBeacon ? 'Visit the beacon again' : 'Find the hidden beacon'}</button>}{state.owned.includes('rack') && <button onClick={() => act('travel', { destination: 'pier' })}>{state.delivered ? 'Visit the outer pier' : 'Start a delivery'}</button>}<button className="fc-quiet" onClick={() => act('practice')}>Improve my mission score</button></>}
    {['beacon', 'pier'].includes(state.stage) && <button onClick={() => act('finish-trip')}>{state.stage === 'beacon' ? 'Decode the beacon and return' : 'Deliver the parts and return'}</button>}
    {state.stage === 'shop' && <MissionWorkshop state={state} act={act} allowGemini={allowGemini}/>}
    {state.stage === 'expedition' && mission && <><p className="fc-tag">{mission.world} · {mission.skill}</p><p className="fc-note">{mission.data}</p><div className="fc-options">{mission.options.map((option,i)=><button key={option} onClick={()=>act('answer-mission',{choice:i})}>{option}</button>)}</div><details open={state.support === 'guided' || undefined}><summary>Need a hint?</summary><p>{mission.hint}</p></details><StandardsNote standard={mission.standard}/><details open={state.support === 'stretch' || undefined}><summary>STEAM design notebook</summary><p>{mission.extension}</p><label>Your evidence, design and limitations<textarea maxLength={2000} value={state.notes[`${mission.id}:${state.grade}`] || ''} onChange={e=>act('note',{text:e.target.value})}/></label><small>Visit-only notes. Not automatically graded or sent to AI.</small><p>{STEAM}</p></details><p role="status">{state.missionFeedback}</p><button className="fc-quiet" onClick={()=>act('leave-mission')}>Return to the shoreline</button></>}
    <footer>Practice adventure · progress and rewards last for this visit. Evidence cards are checked with fixed rules.</footer>
  </section>;
}
