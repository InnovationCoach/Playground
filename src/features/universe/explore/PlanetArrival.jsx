import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, MapPin, PlayCircle } from 'lucide-react';
import { captionsVtt } from './arrivalVideos.js';
import { createArrivalState, advanceArrival, reduceArrival } from '../../../../shared/universe/planetArrival.js';
import { findPilotMission } from '../pilot/missionSession.js';
import { visibleMission } from '../missions/registry.js';
import { planetMissions } from '../missions/MissionList.jsx';

/**
 * Planet arrival (O04): look around first, optionally place one piece of equipment, then choose
 * when to start a mission. Orientation only: nothing here is assessed, saved, sent or unlocked.
 */

export const ARRIVAL_TICK_MS = 1000;
const NO_VISITS = Object.freeze({});

/**
 * Visit memory for one learner/org (`owner`) and planet. A different owner never sees another's
 * visits, even for one render; unmounting the explorer discards everything. Time counts only while
 * every flag is true, in ticks the effect owns, so no callback outlives its planet, owner or flags.
 */
export function usePlanetArrival({ owner, planetId, design, flags }) {
  const [store, setStore] = useState({ owner, visits: NO_VISITS });
  const scope = useRef({ owner, planetId });
  scope.current = { owner, planetId };
  const visits = store.owner === owner ? store.visits : NO_VISITS;
  // Any account change discards every visit, so switching back never restores another session's memory.
  useEffect(() => { setStore((s) => (s.owner === owner ? s : { owner, visits: NO_VISITS })); }, [owner]);
  const state = design ? visits[planetId] || null : null;
  const view = state || (design ? createArrivalState() : null);

  const update = useCallback((fn) => setStore((s) => {
    if (scope.current.owner !== owner || scope.current.planetId !== planetId) return s; // stale caller
    const mine = s.owner === owner ? s.visits : NO_VISITS;
    const prev = mine[planetId] || createArrivalState(), next = fn(prev);
    return next === prev && s.owner === owner ? s : { owner, visits: { ...mine, [planetId]: next } };
  }), [owner, planetId]);

  // While the learner is using the card (its control has focus), a timed change waits so that control stays put.
  // The card supplies the check; it reads document.activeElement, which survives the window losing focus.
  const hold = useRef(null);
  const eligible = !!design && flags.active && flags.visible && flags.ready && !flags.missionOpen;
  const counting = eligible && view?.phase === 'exploring' && !view.postponed;
  useEffect(() => {
    if (!counting) return undefined;
    let last = Date.now(), alive = true;
    const id = setInterval(() => {
      if (!alive) return;
      const now = Date.now(), delta = Math.min(now - last, ARRIVAL_TICK_MS * 2); // a throttled tab never jumps ahead
      last = now;
      const held = !!hold.current?.();
      update((s) => { const next = advanceArrival(s, delta, { active: true, visible: true, ready: true, missionOpen: false }); return next.phase !== s.phase && held ? s : next; });
    }, ARRIVAL_TICK_MS);
    return () => { alive = false; clearInterval(id); };
  }, [counting, update]);

  const dispatch = useCallback((action) => { if (design) update((s) => reduceArrival(s, action, design)); }, [design, update]);
  return [view, dispatch, hold];
}

/** The expedition card's mission, only if the trusted registry has it on that planet (and route). */
export function resolveExpedition(arrival, registry, opts) {
  if (!arrival?.planetId || !arrival.missionId) return null;
  const pilot = findPilotMission(registry, arrival.missionId);
  if (pilot) {
    if (!pilot.mission.planetIds.includes(arrival.planetId)) return null;
    const route = arrival.routeId ? pilot.mission.routes.find((r) => r.id === arrival.routeId) : null;
    if (arrival.routeId && !route) return null;
    return { planetId: arrival.planetId, choice: { id: pilot.mission.id, title: pilot.mission.title, routeId: route?.id || null, routeName: route?.name || null } };
  }
  const legacy = visibleMission(arrival.missionId, opts);
  return legacy && legacy.planetIds.includes(arrival.planetId)
    ? { planetId: arrival.planetId, choice: { id: legacy.id, title: legacy.title, routeId: null, routeName: null } } : null;
}

/** What the offer may show: the expedition's own mission, or only missions actually present for the planet. */
export function arrivalChoices(planetId, expedition, opts) {
  if (expedition && expedition.planetId === planetId) return [expedition.choice];
  return planetMissions(planetId, opts).map((m) => ({ id: m.id, title: m.title, routeId: null, routeName: null }));
}

const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const siteName = (design, id) => design.sites.find((s) => s.id === id)?.name || '';

/**
 * Small, nonmodal card on the surface. A timer may change its content but never moves focus,
 * reopens a postponed card or opens a mission; only the learner's own buttons do anything.
 */
export function ArrivalCard({ design, state, dispatch, planetName, choices, onStart, onSelectSite, inline = false, hold = null,
  video = null, videoState = null, onVideo = () => {} }) {
  const heading = useRef(null), pill = useRef(null), live = useRef(null), moveFocus = useRef(false);
  const act = (action) => { moveFocus.current = true; dispatch(action); };
  const collapsed = state.phase === 'exploring' && state.postponed;
  const equipment = design.equipment;

  useEffect(() => {
    if (moveFocus.current) { moveFocus.current = false; (collapsed ? pill.current : heading.current)?.focus(); }
    const say = state.phase === 'placing' ? `${design.title}: you can set up equipment when you’re ready.`
      : state.phase === 'ready' ? (state.placedSiteId ? `${equipment.name} placed: ${lower(siteName(design, state.placedSiteId))}.` : 'Ready for the mission when you are.') : '';
    if (live.current && say) live.current.textContent = say;
  }, [state.phase, state.placedSiteId, collapsed, videoState]); // eslint-disable-line react-hooks/exhaustive-deps

  // O05 how-to clip: offered first on arrival, played only on request, captions on by default.
  const captions = useMemo(() => (video?.cues?.length && typeof URL.createObjectURL === 'function'
    ? URL.createObjectURL(new Blob([captionsVtt(video.cues)], { type: 'text/vtt' })) : null), [video]);
  useEffect(() => () => { if (captions) URL.revokeObjectURL(captions); }, [captions]);
  const watch = () => { moveFocus.current = true; onVideo('playing'); };
  const finishVideo = () => { moveFocus.current = true; onVideo('seen'); };
  const transcript = video && <details className="px-optional mx-arrival-transcript"><summary>Read it instead</summary>
    <p>{video.cues.map((c) => c[2]).join(' ')}</p></details>;
  const watchAgain = video && <button type="button" className="mx-link" onClick={watch}><PlayCircle size={15} aria-hidden="true" /> Watch how this mission works ({video.duration})</button>;

  const cls = `mx-arrival${inline ? ' is-inline' : ''}`;
  // Keys used in the card stay in the card: no camera orbit, zoom, reset or Back from the explorer's shortcuts.
  const box = useRef(null);
  const own = { onKeyDown: (e) => e.stopPropagation() };
  // In use = a card control has focus. The 3D view takes no focus, so a press on the world leaves it there too;
  // the change then waits until focus moves elsewhere, rather than removing the focused control.
  useEffect(() => {
    if (!hold) return undefined;
    hold.current = () => !!box.current?.contains(document.activeElement);
    return () => { hold.current = null; };
  }, [hold]);
  const liveRegion = <p className="mx-sr" aria-live="polite" ref={live} />;
  if (collapsed) {
    const label = state.placedSiteId ? `${equipment.name} placed · Next mission` : state.skipped ? 'Next mission' : 'Set up equipment';
    return <div ref={box} className={`${cls} is-pill`} {...own}>
      <button ref={pill} type="button" className="mx-arrival-pill" onClick={() => act({ type: 'ready-now' })}><MapPin size={15} aria-hidden="true" />{label}</button>
      {liveRegion}
    </div>;
  }

  if (video && videoState === 'playing') return <section ref={box} className={`${cls} is-video`} aria-labelledby="mx-arrival-title" {...own}>
    <span className="mx-eyebrow">Arrived · {planetName} · {video.duration}</span>
    <h3 id="mx-arrival-title" ref={heading} tabIndex={-1}>{video.title}</h3>
    <video className="mx-arrival-video" src={video.src} poster={video.poster || undefined} controls autoPlay playsInline preload="metadata" onEnded={finishVideo}>
      {captions && <track kind="captions" srcLang="en" label="English" src={captions} default />}
    </video>
    <div className="mx-arrival-actions"><button type="button" className="mx-primary" onClick={finishVideo}>Done</button></div>
    {transcript}
    {liveRegion}
  </section>;
  if (video && !videoState && state.phase === 'exploring') return <section ref={box} className={`${cls} is-offer`} aria-labelledby="mx-arrival-title" {...own}>
    <span className="mx-eyebrow">Arrived · {planetName}</span>
    <h3 id="mx-arrival-title" ref={heading} tabIndex={-1}>{design.title}</h3>
    <p>Before you explore, see how this mission works. {video.summary}</p>
    <div className="mx-arrival-actions">
      <button type="button" className="mx-arrival-watch" onClick={watch}>
        {video.poster && <img src={video.poster} alt="" />}
        <span><PlayCircle size={18} aria-hidden="true" /> Watch the video · {video.duration}</span>
      </button>
      <button type="button" className="mx-link" onClick={finishVideo}>Skip video</button>
    </div>
    {transcript}
    {liveRegion}
  </section>;

  const moving = state.phase === 'placing' && !!state.placedSiteId;
  const chosen = design.sites.find((s) => s.id === state.siteId);
  return <section ref={box} className={cls} aria-labelledby="mx-arrival-title" {...own}>
    {state.phase === 'exploring' && <>
      <span className="mx-eyebrow">Arrived · {planetName}</span>
      <h3 id="mx-arrival-title" ref={heading} tabIndex={-1}>{design.title}</h3>
      <p>{design.lookPrompt}</p>
      {watchAgain}
      <div className="mx-arrival-actions">
        <button type="button" onClick={() => act({ type: 'ready-now' })}>Ready now</button>
        <button type="button" onClick={() => act({ type: 'keep-exploring' })}>Keep exploring</button>
        <button type="button" className="mx-link" onClick={() => act({ type: 'skip-setup' })}>Skip setup</button>
      </div>
    </>}

    {state.phase === 'placing' && <>
      <span className="mx-eyebrow">Set up · {planetName}</span>
      <h3 id="mx-arrival-title" ref={heading} tabIndex={-1}>{moving ? `Move the ${lower(equipment.name)}` : `Place a ${lower(equipment.name)}`}</h3>
      <p>{equipment.purpose}{moving ? ` Now: ${lower(siteName(design, state.placedSiteId))}.` : ''}</p>
      <fieldset className="mx-arrival-sites"><legend className="mx-sr">Choose a site</legend>
        {design.sites.map((s) => <label key={s.id} className={state.siteId === s.id ? 'is-on' : ''}>
          <input type="radio" name="mx-arrival-site" value={s.id} checked={state.siteId === s.id}
            onChange={() => { dispatch({ type: 'select-site', siteId: s.id }); onSelectSite?.(s.locationId); }} />{s.name}</label>)}
      </fieldset>
      {chosen && <p className="mx-muted">To think about: {chosen.prompt}</p>}
      <div className="mx-arrival-actions">
        <button type="button" className="mx-primary" disabled={!chosen} onClick={() => act({ type: 'place' })}>Place equipment</button>
        {moving ? <button type="button" onClick={() => act({ type: 'skip-setup' })}>Keep it where it is</button>
          : <button type="button" className="mx-link" onClick={() => act({ type: 'skip-setup' })}>Skip setup</button>}
        <button type="button" onClick={() => act({ type: 'keep-exploring' })}>Keep exploring</button>
      </div>
      {!chosen && <p className="mx-muted">Choose a site, then place it.</p>}
    </>}

    {state.phase === 'ready' && <>
      <span className="mx-eyebrow">Ready · {planetName}</span>
      <h3 id="mx-arrival-title" ref={heading} tabIndex={-1}>{state.placedSiteId ? `${equipment.name} placed` : 'Ready for a mission'}</h3>
      {state.placedSiteId ? <>
        <p>{siteName(design, state.placedSiteId)}. To think about: {design.sites.find((s) => s.id === state.placedSiteId)?.prompt}</p>
        <p className="mx-muted">{design.placementNote}</p>
      </> : <p className="mx-muted">Equipment setup skipped. You can set it up any time.</p>}
      <button type="button" className="mx-link" onClick={() => act({ type: 'move' })}>{state.placedSiteId ? 'Move equipment' : 'Set up equipment'}</button>
      <div className="mx-arrival-offer">
        <h4>Next mission</h4>
        {choices.length ? choices.map((c) => <div key={`${c.id}|${c.routeId || ''}`} className="mx-arrival-choice">
          <strong>{c.title}</strong>{c.routeName && <span className="mx-muted">{c.routeName}</span>}
          <button type="button" className="mx-primary" onClick={() => onStart(c)}>Start mission<ChevronRight size={16} aria-hidden="true" /></button>
        </div>) : <p className="mx-muted">No missions are open on {planetName} yet.</p>}
        <button type="button" onClick={() => act({ type: 'keep-exploring' })}>Explore more</button>
        {watchAgain}
      </div>
    </>}
    {liveRegion}
  </section>;
}
