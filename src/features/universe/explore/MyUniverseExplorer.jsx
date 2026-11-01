import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Canvas } from '@react-three/fiber';
import { ArrowLeft, ChevronRight, List, Box, RotateCcw, LogOut, Lock, Sparkles } from 'lucide-react';
import { SpaceLevel, Starfield, Nebulae, CameraRig, SpikeMetrics, shotFor } from './ExplorerScene.jsx';
import { environmentById, planetById } from './cosmosFixture.js';
import {
  initialNav, reduce, current, childrenOf, itemFor, breadcrumbs, describeView, planetAccess, canLand,
  pathTo, transitionBetween, framedSelection, LEVEL_LABEL
} from './explorerModel.js';
import { ExplorerTextView, StatusChip } from './ExplorerTextView.jsx';
import './explorer.css';

export function hasWebGL2() {
  try { return typeof document !== 'undefined' && !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
}
function autoLowQuality() {
  if (typeof navigator === 'undefined') return true;
  const touch = navigator.maxTouchPoints > 1;
  return touch || (navigator.hardwareConcurrency || 4) < 6;
}
const defaultLoader = ({ fail }) => (fail ? Promise.reject(new Error('Simulated landing failure')) : import('./ExplorerEnvironment.jsx'));


/**
 * My Universe exploration spike (Stage B, UNIVERSE.md §13.6): Universe → Galaxy →
 * Star system → Planet → Surface, with a complete text view. Fixture data only;
 * no backend, saves, XP or unlocks. Rendered in a full-viewport layer above the
 * dashboard deck so camera gestures never fight slide swipes or arrow keys.
 */
export function MyUniverseExplorer({ preview = true, calm = false, active = true, onClose, showMetrics = false, forceTextView = false, failLanding = false, loadEnvironment = defaultLoader }) {
  const opts = useMemo(() => ({ preview }), [preview]);
  const webgl = useMemo(() => !forceTextView && hasWebGL2(), [forceTextView]);
  const [state, setState] = useState(() => ({ nav: initialNav(), travel: { from: 'approach', duration: 1.8 } }));
  const { nav, travel } = state;
  const [view, setView] = useState(webgl ? '3d' : 'text');
  const [contextLost, setContextLost] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [low, setLow] = useState(autoLowQuality);
  const [traveling, setTraveling] = useState(false);
  const [env, setEnv] = useState({ status: 'idle', Comp: null });
  const [metrics, setMetrics] = useState(null);
  const [, tick] = useState(0);
  useEffect(() => { if (!showMetrics) return undefined; const id = setInterval(() => tick((n) => n + 1), 1000); return () => clearInterval(id); }, [showMetrics]);
  const api = useRef(null), live = useRef(null), heading = useRef(null), root = useRef(null), mounted = useRef(true);

  const here = current(nav);
  const motion = !reduced && !calm;
  const environment = here.level === 'environment' ? environmentById(here.id) : null;
  const planet = here.level === 'planet' ? planetById(here.id) : null;
  const landable = canLand(planet, opts);
  const in3d = view === '3d' && webgl && !contextLost;

  const go = useCallback((action) => setState((s) => {
    const next = reduce(s.nav, { ...action, opts });
    if (next === s.nav) return s;
    const t = transitionBetween(s.nav, next);
    return { nav: next, travel: t.kind === 'none' ? s.travel : t };
  }), [opts]);

  useEffect(() => {
    mounted.current = true;
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(!!mq?.matches); sync(); mq?.addEventListener?.('change', sync);
    const vis = () => setHidden(document.visibilityState === 'hidden'); document.addEventListener('visibilitychange', vis);
    const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    heading.current?.focus();
    return () => { mounted.current = false; mq?.removeEventListener?.('change', sync); document.removeEventListener('visibilitychange', vis); document.body.style.overflow = overflow; document.body.style.cursor = ''; };
  }, []);

  // Announce each new view, and keep keyboard focus inside the explorer when the focused button disappears.
  useEffect(() => {
    if (live.current) live.current.textContent = describeView(nav, opts);
    if (root.current && !root.current.contains(document.activeElement)) heading.current?.focus();
  }, [nav, opts]);

  // Browser Back follows the explorer's back stack: each level inward adds a same-URL history entry
  // (the hash router ignores these). Leaving or jumping outward removes them again quietly.
  const histDepth = useRef(0), skipPop = useRef(0), closing = useRef(false), onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const depth = nav.path.length - 1;
    while (histDepth.current < depth) { histDepth.current += 1; window.history.pushState({ mxDepth: histDepth.current, mxPath: nav.path.slice(0, histDepth.current + 1) }, ''); }
    if (histDepth.current > depth) { skipPop.current += 1; window.history.go(depth - histDepth.current); histDepth.current = depth; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav.path.length]);
  useEffect(() => {
    const onPop = (e) => {
      const depth = e.state?.mxDepth ?? 0;
      if (closing.current) { closing.current = false; histDepth.current = 0; onCloseRef.current?.(); return; }
      if (skipPop.current) { skipPop.current -= 1; return; }
      // Back keeps the place you came from focused; Forward restores the deeper path saved with the entry.
      const forward = depth > histDepth.current && Array.isArray(e.state?.mxPath);
      histDepth.current = depth;
      go(forward ? { type: 'jump', path: e.state.mxPath } : { type: 'goto', depth });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [go]);
  const leave = useCallback(() => {
    if (!histDepth.current) { onCloseRef.current?.(); return; }
    closing.current = true; window.history.go(-histDepth.current);
    setTimeout(() => { if (closing.current) { closing.current = false; onCloseRef.current?.(); } }, 600);
  }, []);

  const load = useCallback(() => {
    setEnv({ status: 'loading', Comp: null });
    loadEnvironment({ fail: failLanding })
      .then((m) => { if (mounted.current) setEnv({ status: 'ready', Comp: m.default }); })
      .catch(() => { if (mounted.current) setEnv({ status: 'failed', Comp: null }); });
  }, [loadEnvironment, failLanding]);

  // Prefetch the surface while its planet is inspected (or when arriving straight from the text view).
  useEffect(() => { if ((landable || environment) && in3d && env.status === 'idle') load(); }, [landable, environment, in3d, env.status, load]);

  const shotKey = JSON.stringify([nav.path, framedSelection(nav)]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const shot = useMemo(() => shotFor(here, framedSelection(nav), environment), [shotKey]);

  function onKeyDown(e) {
    e.stopPropagation(); // the dashboard deck must not change slides underneath
    if (e.target.closest?.('input, textarea, select')) return;
    const k = e.key;
    if (k === 'Escape') { if (nav.path.length > 1 || nav.selected) { e.preventDefault(); go({ type: 'back' }); } return; }
    if (k === 'l' || k === 'L') { if (webgl && !contextLost) setView((v) => (v === '3d' ? 'text' : '3d')); return; }
    if (!in3d || !api.current) return;
    if (k === 'ArrowLeft') { e.preventDefault(); api.current.orbit(-12); }
    else if (k === 'ArrowRight') { e.preventDefault(); api.current.orbit(12); }
    else if (k === '+' || k === '=') api.current.zoom(0.85);
    else if (k === '-' || k === '_') api.current.zoom(1.18);
    else if (k === 'r' || k === 'R') api.current.reset();
  }

  const running = active && !hidden && (traveling || (here.level === 'environment' && motion));
  const select = (id) => go({ type: 'select', id });

  const scene = in3d && <div className="mx-canvas">
    <Canvas dpr={low ? [1, 1.25] : [1, 1.75]} gl={{ antialias: !low, powerPreference: 'high-performance' }}
      frameloop={!active ? 'never' : running ? 'always' : 'demand'} camera={{ fov: 45, near: 0.1, far: 1200, position: shot.position }}
      onCreated={({ gl }) => gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); setContextLost(true); })}>
      <color attach="background" args={['#05101f']} />
      {here.level !== 'environment' && <><Starfield low={low} /><Nebulae low={low} /><SpaceLevel entry={here} selected={nav.selected} onSelect={select} low={low} /></>}
      {environment && env.status === 'ready' && <env.Comp environment={environment} selected={nav.selected} onSelect={select} motion={motion} low={low} />}
      <CameraRig shot={shot} travel={travel} motion={motion} onTravel={setTraveling} api={api} />
      {showMetrics && <SpikeMetrics onSample={(m) => setMetrics((prev) => (prev && Object.keys(m).every((k) => prev[k] === m[k]) ? prev : m))} />}
    </Canvas>
  </div>;

  const crumbs = breadcrumbs(nav);
  const ui = <div className={`mx-root${motion ? '' : ' is-still'}`} ref={root} onKeyDown={onKeyDown} role="region" aria-label="My Universe explorer">
    <header className="mx-top">
      <div className="mx-brand"><Sparkles size={16} aria-hidden="true" /><span>WeLearn <b>SPARK</b></span></div>
      <nav aria-label="Where you are" className="mx-crumbs"><ol>
        {crumbs.map((c, i) => <li key={c.depth}>{i > 0 && <ChevronRight size={14} aria-hidden="true" />}
          {i === crumbs.length - 1 ? <span aria-current="location">{c.label}</span> : <button type="button" onClick={() => go({ type: 'goto', depth: c.depth })}>{c.label}</button>}
        </li>)}
      </ol></nav>
      <div className="mx-actions">
        {nav.path.length > 1 && <button type="button" onClick={() => go({ type: 'back' })}><ArrowLeft size={16} aria-hidden="true" />Back</button>}
        {webgl && !contextLost && <button type="button" onClick={() => setView(in3d ? 'text' : '3d')} aria-pressed={!in3d}>{in3d ? <><List size={16} aria-hidden="true" />Text view</> : <><Box size={16} aria-hidden="true" />3D view</>}</button>}
        {in3d && <button type="button" onClick={() => api.current?.reset()}><RotateCcw size={16} aria-hidden="true" />Reset view</button>}
        {in3d && <button type="button" onClick={() => setLow((v) => !v)} aria-pressed={!low} title="Rendering detail">Detail: {low ? 'Standard' : 'High'}</button>}
        <button type="button" className="mx-leave" onClick={leave}><LogOut size={16} aria-hidden="true" />Leave universe</button>
      </div>
    </header>
    {preview && <p className="mx-banner">Sample universe · fictional fixture data · nothing is saved · no XP, rewards or unlocks</p>}
    <div className="mx-stage">
      {scene}
      {in3d && <div className={`mx-fade${traveling ? '' : ' is-done'}`} key={`${nav.path.length}-${here.id || ''}`} aria-hidden="true" />}
      {!in3d && <ExplorerTextView opts={opts} canUse3d={webgl && !contextLost}
        notice={contextLost ? 'The 3D view stopped on this device, so here is the text view. Your place is kept.' : !webgl ? '3D isn’t available on this device, so here is the text view. It has the same destinations and details.' : null}
        onShow3d={(level, id) => { const path = pathTo(level, id); if (path) { go({ type: 'jump', path }); setView('3d'); } }} />}
      {in3d && <aside className="mx-panel" aria-labelledby="mx-panel-title">
        <span className="mx-eyebrow">{LEVEL_LABEL[here.level]}</span>
        <h2 id="mx-panel-title" ref={heading} tabIndex={-1}>{here.level === 'universe' ? 'My Universe' : itemFor(here)?.name}</h2>
        <Panel nav={nav} opts={opts} go={go} select={select} env={env} onRetry={load} onTextView={() => setView('text')} />
        <p className="mx-hint">Drag to look around · pinch or scroll to zoom · arrow keys rotate · Esc goes back · L for text view</p>
      </aside>}
      {!in3d && <h2 className="mx-sr" ref={heading} tabIndex={-1}>My Universe text view</h2>}
      {showMetrics && in3d && <div className="mx-metrics" aria-hidden="true">
        {metrics ? <>{metrics.at && performance.now() - metrics.at < 1600 ? `${metrics.fps} fps` : 'idle · renders on demand'} · {metrics.calls} draw calls · {metrics.triangles.toLocaleString()} tris · {metrics.geometries} geometries · {metrics.textures} textures · {low ? 'standard' : 'high'} detail</> : 'measuring…'}
      </div>}
    </div>
    <p className="mx-sr" aria-live="polite" ref={live} />
  </div>;

  return typeof document === 'undefined' ? ui : createPortal(ui, document.body);
}

function Destinations({ nav, opts, select }) {
  const here = current(nav);
  const kids = childrenOf(here);
  if (!kids.length) return null;
  const title = { universe: 'Galaxies', galaxy: 'Star systems', system: 'Planets', environment: 'Places to inspect' }[here.level];
  return <div className="mx-dest"><h3>{title}</h3><ul>
    {kids.map(({ id, level, item }) => <li key={id}>
      <button type="button" aria-pressed={nav.selected === id} onClick={() => select(id)}>
        <span>{item.name}</span>{level === 'planet' && <StatusChip access={planetAccess(item, opts)} />}
      </button>
    </li>)}
  </ul></div>;
}

function Panel({ nav, opts, go, select, env, onRetry, onTextView }) {
  const here = current(nav);
  const item = itemFor(here);
  const kids = childrenOf(here);
  const chosen = kids.find((k) => k.id === nav.selected)?.item;
  if (here.level === 'universe') return <>
    <p>Deep space, not to scale. Choose a galaxy to explore. Charted places are listed here and lit in the view.</p>
    <Destinations nav={nav} opts={opts} select={select} />
    {chosen && <div className="mx-detail"><h3>{chosen.name}</h3><p>{chosen.summary}</p>
      <button type="button" className="mx-primary" onClick={() => go({ type: 'open', id: chosen.id })}>Explore {chosen.name}<ChevronRight size={16} aria-hidden="true" /></button></div>}
  </>;
  if (here.level === 'galaxy') return <>
    <p>{item.summary}</p>
    <Destinations nav={nav} opts={opts} select={select} />
    {!kids.length && <p className="mx-muted">No star systems are charted here yet.</p>}
    {item.uncharted > 0 && <p className="mx-muted">{item.uncharted} more systems are visible but not charted.</p>}
    {chosen && <div className="mx-detail"><h3>{chosen.name}</h3><p>{chosen.starClass}. {chosen.summary}</p>
      <button type="button" className="mx-primary" onClick={() => go({ type: 'open', id: chosen.id })}>Visit {chosen.name}<ChevronRight size={16} aria-hidden="true" /></button></div>}
  </>;
  if (here.level === 'system') return <>
    <p>{item.starClass}. Orbits are drawn closer together than real ones.</p>
    <Destinations nav={nav} opts={opts} select={select} />
    {chosen && <div className="mx-detail"><h3>{chosen.name}</h3><p>{chosen.summary}</p>
      <button type="button" className="mx-primary" onClick={() => go({ type: 'open', id: chosen.id })}>Inspect {chosen.name}<ChevronRight size={16} aria-hidden="true" /></button></div>}
  </>;
  if (here.level === 'planet') {
    const access = planetAccess(item, opts);
    const land = canLand(item, opts);
    return <>
      <StatusChip access={access} />
      <p>{item.summary}</p>
      <h3>What it’s like</h3>
      <ul className="mx-facts">{item.facts.map((f) => <li key={f}>{f}<span className="mx-tag">Fictional world</span></li>)}</ul>
      {access.status === 'locked' && <p className="mx-req"><Lock size={14} aria-hidden="true" />{access.requirementText}</p>}
      {access.status === 'not-connected' && <p className="mx-muted">Access to this planet will come from your learning record once that service is connected.</p>}
      {!item.environmentId && access.status !== 'locked' && <p className="mx-muted">No landing site is charted yet.</p>}
      <h3>Missions here</h3><p className="mx-muted">No missions yet. Reviewed missions will appear here later.</p>
      {land && env.status === 'failed' && <div className="mx-fail" role="alert"><p>Landing failed. The surface didn’t load.</p>
        <button type="button" className="mx-primary" onClick={onRetry}>Try again</button>
        <button type="button" onClick={onTextView}>Explore in text view</button></div>}
      {land && env.status !== 'failed' && <button type="button" className="mx-primary" disabled={env.status !== 'ready'} onClick={() => go({ type: 'open' })}>
        {env.status === 'ready' ? <>Land on {item.name}<ChevronRight size={16} aria-hidden="true" /></> : 'Preparing landing…'}</button>}
    </>;
  }
  if (here.level === 'environment') return <>
    <p>{item.summary}</p>
    {env.status === 'loading' && <p role="status">Loading the surface…</p>}
    {env.status === 'failed' && <div className="mx-fail" role="alert"><p>The surface didn’t load.</p><button type="button" className="mx-primary" onClick={onRetry}>Try again</button><button type="button" onClick={() => go({ type: 'back' })}>Back to orbit</button></div>}
    <Destinations nav={nav} opts={opts} select={select} />
    {chosen && <div className="mx-detail"><h3>{chosen.name}</h3><p>{chosen.purpose}</p>
      <ul className="mx-facts">{chosen.observations.map((o) => <li key={o}>{o}</li>)}</ul>
      <p className="mx-muted">Workstations and projects here are coming later.</p></div>}
  </>;
  return null;
}
