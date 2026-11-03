import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Canvas } from '@react-three/fiber';
import { ArrowLeft, ChevronRight, ChevronDown, ChevronUp, List, Box, RotateCcw, LogOut, Lock, Sparkles, RefreshCw } from 'lucide-react';
import { SpaceLevel, Starfield, Nebulae, CameraRig, SpikeMetrics, shotFor } from './ExplorerScene.jsx';
import { CATALOG_URL, loadCosmos } from './cosmosCatalog.js';
import * as firebase from '../../../firebase.js';
import { API_BASE } from '../../../services/apiBase.js';
import { PUBLISHED_RELEASES } from '../../../../shared/universe/index.js';
import { createDefaultUniverseClient, scopeKey } from '../pilot/universeClient.js';
import { findPilotMission } from '../pilot/missionSession.js';
import { PilotMissionSheet, MissionSignInNotice } from '../pilot/PilotMissionSheet.jsx';
import {
  initialNav, reduce, current, childrenOf, itemFor, breadcrumbs, describeView, planetAccess, canLand,
  pathTo, transitionBetween, framedSelection, LEVEL_LABEL
} from './explorerModel.js';
import { ExplorerTextView, SurfaceTextView, StatusChip, FactList } from './ExplorerTextView.jsx';
import { ArrivalCard, usePlanetArrival, resolveExpedition, arrivalChoices } from './PlanetArrival.jsx';
import { getPlanetArrivalDesign } from '../../../../shared/universe/planetArrival.js';
import { MissionSheet } from '../missions/MissionSheet.jsx';
import { MISSIONS, visibleMission } from '../missions/registry.js';
import { MissionList } from '../missions/MissionList.jsx';
import { Workstations } from '../missions/Workstations.jsx';
import './explorer.css';

// Production uses only published releases (none yet) and the signed-in user's token.
let productionClient = null;
const defaultClient = () => (productionClient ||= createDefaultUniverseClient({ auth: firebase.auth, baseUrl: API_BASE }));

export function hasWebGL2() {
  try { return typeof document !== 'undefined' && !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
}
function autoLowQuality() {
  if (typeof navigator === 'undefined') return true;
  const touch = navigator.maxTouchPoints > 1;
  return touch || (navigator.hardwareConcurrency || 4) < 6;
}

/**
 * Where a normal learner entry starts: on the planet's surface when it can be landed on (the
 * world first, no mission over it), otherwise at the planet so its access message is shown.
 */
export function arrivalNav(arrival, cosmos, opts) {
  const planet = arrival?.planetId ? cosmos.planetById(arrival.planetId) : null;
  if (!planet) return initialNav();
  const path = canLand(planet, opts) ? pathTo('environment', planet.environmentId, cosmos) : pathTo('planet', planet.id, cosmos);
  return path ? { path, selected: null } : initialNav();
}

/** True when this view is a surface that opens with the arrival card: the details dock then starts collapsed. */
export function arrivesOn(nav, cosmos) {
  const here = current(nav);
  if (here.level !== 'environment') return false;
  const design = getPlanetArrivalDesign(cosmos.environmentById(here.id)?.planetId);
  return !!design && design.environmentId === here.id;
}

/**
 * Decides whether the details panel should be open after a navigation step.
 * Opens automatically when moving to another level or selecting a new destination,
 * stays closed after the learner hides it until the next selection or level change,
 * and never reopens while the learner is dragging the camera.
 */
export function nextPanelOpen(open, prevNav, nextNav, { dragging = false } = {}) {
  if (dragging || !nextNav || nextNav === prevNav) return open;
  const prevHere = current(prevNav), nextHere = current(nextNav);
  const levelChanged = prevNav.path.length !== nextNav.path.length
    || prevHere.level !== nextHere.level
    || prevHere.id !== nextHere.id;
  const selectionChanged = nextNav.selected !== null && nextNav.selected !== prevNav.selected;
  if (levelChanged || selectionChanged) return true;
  return open;
}

// Surface renderers by the catalog's environment sceneKind; each is its own lazy chunk.
const SCENE_LOADERS = {
  'ocean-station': () => import('./ExplorerEnvironment.jsx'),
  'basalt-fissures': () => import('./ExplorerBasaltEnvironment.jsx')
};
const defaultLoader = ({ fail, sceneKind }) => (fail ? Promise.reject(new Error('Simulated landing failure'))
  : SCENE_LOADERS[sceneKind] ? SCENE_LOADERS[sceneKind]() : Promise.reject(new Error(`No renderer for ${sceneKind}`)));

/** Always visible: previews say they are samples; the live app still says the worlds are fictional and nothing is kept. */
function Banner({ preview, missions = false }) {
  // With pilot missions, mission work can be saved to the learner's account; exploring itself still saves nothing.
  const saved = missions ? 'exploring saves nothing · mission work is saved only to your account' : 'nothing is saved';
  return <p className="mx-banner">{preview ? `Sample universe · fictional worlds · ${saved} · no XP, rewards or unlocks`
    : `Fictional worlds for exploring · ${saved} · no XP, rewards or unlocks`}</p>;
}

function Chrome({ onClose, preview, children }) {
  const ui = <div className="mx-root" role="region" aria-label="My Universe explorer" onKeyDown={(e) => e.stopPropagation()}>
    <header className="mx-top">
      <div className="mx-brand"><Sparkles size={16} aria-hidden="true" /><span>WeLearn <b>SPARK</b></span></div>
      <div className="mx-crumbs"><span className="mx-crumb-solo">My Universe</span></div>
      <div className="mx-actions"><button type="button" className="mx-leave" onClick={onClose}><LogOut size={16} aria-hidden="true" />Leave universe</button></div>
    </header>
    <Banner preview={preview} />
    <div className="mx-stage"><div className="mx-status">{children}</div></div>
  </div>;
  return typeof document === 'undefined' ? ui : createPortal(ui, document.body);
}

/**
 * My Universe: loads the published cosmos catalog (one version per visit),
 * then opens the explorer. A missing or invalid catalog shows a clear error
 * with Retry instead of a partial universe.
 */
export function MyUniverseExplorer({ catalogUrl = CATALOG_URL, loadCatalog = loadCosmos, ...props }) {
  const [state, setState] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    setState({ status: 'loading' });
    loadCatalog(catalogUrl).then((cosmos) => { if (live) setState({ status: 'ready', cosmos }); }).catch((error) => { if (live) setState({ status: 'failed', error }); });
    return () => { live = false; };
  }, [catalogUrl, loadCatalog, attempt]);
  // Called when a learner returns to the overview: is a newer catalog published? Never interrupts a visit.
  const checkNewer = useCallback(async (version) => {
    try { const next = await loadCatalog(catalogUrl, { fresh: true }); return next.version !== version ? next : null; } catch { return null; }
  }, [catalogUrl, loadCatalog]);
  if (state.status === 'ready') return <ExplorerShell key={state.cosmos.version} cosmos={state.cosmos} checkNewer={checkNewer} onAdopt={(cosmos) => setState({ status: 'ready', cosmos })} {...props} />;
  if (state.status === 'loading') return <Chrome onClose={props.onClose} preview={props.preview ?? true}><p role="status">Charting your universe…</p></Chrome>;
  return <Chrome onClose={props.onClose} preview={props.preview ?? true}>
    <div className="mx-fail" role="alert"><p>The universe map didn’t load, so nothing is shown rather than an incomplete universe.</p>
      <button type="button" className="mx-primary" onClick={() => setAttempt((n) => n + 1)}><RefreshCw size={16} aria-hidden="true" />Try again</button>
      {(props.preview ?? true) && state.error?.problems && <details><summary>Catalog problems ({state.error.problems.length})</summary><ul>{state.error.problems.slice(0, 20).map((p) => <li key={p}>{p}</li>)}</ul></details>}
    </div>
  </Chrome>;
}


/**
 * The explorer itself: Universe → Galaxy → Star system → Planet → Surface, with a
 * complete text view. Catalog data only; no backend, saves, XP or unlocks.
 * Rendered in a full-viewport layer above the dashboard deck so camera gestures
 * never fight slide swipes or arrow keys.
 */
function ExplorerShell({ cosmos, checkNewer, onAdopt, onOpenActivity, preview = true, calm = false, active = true, onClose, showMetrics = false, forceTextView = false, failLanding = false, loadEnvironment = defaultLoader,
  missionRegistry = PUBLISHED_RELEASES, missionClient, viewer = null, initialMission = null, initialArrival = null, allowInReviewMissions = false }) {
  // Mission service calls are bound to one learner in one verified organization. Until the host
  // supplies both, nothing is requested and no mission opens (fail closed).
  const viewerKey = scopeKey(viewer);
  const base = missionClient || defaultClient();
  const client = useMemo(() => (viewerKey ? base.withScope({ uid: viewer.uid, orgId: viewer.orgId }) : null), [base, viewerKey]); // eslint-disable-line react-hooks/exhaustive-deps
  // Access answers are tagged with the scope that asked; a different viewer never sees them, even for one render.
  const [accessReply, setAccessReply] = useState(null);
  const serverAccess = accessReply && accessReply.key === viewerKey ? accessReply.destinations : null;
  const opts = useMemo(() => ({ preview, serverAccess, pilotRegistry: missionRegistry }), [preview, serverAccess, missionRegistry]);
  const webgl = useMemo(() => !forceTextView && hasWebGL2(), [forceTextView]);
  // initialMission is the explicit technical deep link (tests, drafts, device checks); it wins over an arrival.
  const arrivalEntry = initialMission ? null : initialArrival;
  const [state, setState] = useState(() => {
    const nav = arrivalNav(arrivalEntry, cosmos, { preview, serverAccess: null, pilotRegistry: missionRegistry });
    return { nav, travel: { from: 'approach', duration: 1.8 }, panelOpen: !arrivesOn(nav, cosmos), sheetExpanded: false };
  });
  const { nav, travel, panelOpen, sheetExpanded } = state;
  const [view, setView] = useState(webgl ? '3d' : 'text');
  const [contextLost, setContextLost] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.visibilityState === 'hidden'); // opened in a background tab counts as hidden
  const [low, setLow] = useState(autoLowQuality);
  const [traveling, setTraveling] = useState(false);
  const [env, setEnv] = useState({ status: 'idle', Comp: null, kind: null });
  const [newer, setNewer] = useState(null);
  const [missionId, setMissionId] = useState(initialMission?.id ?? null); // deep link (previews and device tests)
  const [missionInitial, setMissionInitial] = useState(initialMission); // the route (and deep-link state) to open with
  const openMission = useCallback((id, start = null) => { setMissionInitial(start); setMissionId(id); }, []);
  const pilotEntry = missionId ? findPilotMission(missionRegistry, missionId) : null;
  const mission = !pilotEntry && MISSIONS.find((m) => m.id === missionId) || null;
  const [metrics, setMetrics] = useState(null);
  const [, tick] = useState(0);
  useEffect(() => { if (!showMetrics) return undefined; const id = setInterval(() => tick((n) => n + 1), 1000); return () => clearInterval(id); }, [showMetrics]);
  const api = useRef(null), live = useRef(null), heading = useRef(null), root = useRef(null), mounted = useRef(true);
  const toggleBtn = useRef(null), dragging = useRef(false), wasPanelOpen = useRef(true);

  const here = current(nav);
  const motion = !reduced && !calm;
  const environment = here.level === 'environment' ? cosmos.environmentById(here.id) : null;
  const planet = here.level === 'planet' ? cosmos.planetById(here.id) : null;
  const landable = canLand(planet, opts);
  const in3d = view === '3d' && webgl && !contextLost;

  // Arrival on a supported surface: time, placement and choice belong to this learner/org and planet only.
  const arrivalPlanetId = environment?.planetId || null;
  const designFor = arrivalPlanetId ? getPlanetArrivalDesign(arrivalPlanetId) : null;
  const arrivalDesign = designFor && designFor.environmentId === environment.id ? designFor : null;
  const missionOpen = !!(mission || pilotEntry);
  const surfaceReady = !environment ? false : in3d ? env.status === 'ready' && env.kind === environment.sceneKind && !traveling : true;
  const [arrival, arrivalDo, arrivalHold] = usePlanetArrival({ owner: viewerKey || 'guest', planetId: arrivalPlanetId, design: arrivalDesign,
    flags: { active, visible: !hidden, ready: surfaceReady, missionOpen } });
  const expedition = useMemo(() => resolveExpedition(arrivalEntry, missionRegistry, opts), [arrivalEntry, missionRegistry, opts]);
  const choices = useMemo(() => (arrivalPlanetId ? arrivalChoices(arrivalPlanetId, expedition, opts) : []), [arrivalPlanetId, expedition, opts]);
  const siteAt = (id) => {
    const site = arrivalDesign?.sites.find((x) => x.id === id), loc = site && environment.locations.find((l) => l.id === site.locationId);
    return loc ? { id, x: loc.position[0] + site.offset[0], z: loc.position[2] + site.offset[2] } : null;
  };
  const equipment = arrivalDesign && arrival ? {
    kind: arrivalDesign.equipment.id,
    placed: arrival.placedSiteId ? siteAt(arrival.placedSiteId) : null,
    preview: arrival.phase === 'placing' && arrival.siteId && arrival.siteId !== arrival.placedSiteId ? siteAt(arrival.siteId) : null
  } : null;

  const go = useCallback((action) => setState((s) => {
    const next = reduce(s.nav, { ...action, opts, cosmos });
    if (next === s.nav) return s;
    const t = transitionBetween(s.nav, next);
    const landing = arrivesOn(next, cosmos) && !arrivesOn(s.nav, cosmos);
    const open = landing ? false : action.quiet ? s.panelOpen : nextPanelOpen(s.panelOpen, s.nav, next, { dragging: dragging.current });
    const resetExpand = open && (!s.panelOpen || s.nav.path.length !== next.path.length || s.nav.selected !== next.selected);
    return {
      nav: next,
      travel: t.kind === 'none' ? s.travel : t,
      panelOpen: open,
      sheetExpanded: resetExpand ? false : s.sheetExpanded
    };
  }), [opts, cosmos]);

  const togglePanel = useCallback(() => {
    setState((s) => {
      if (dragging.current) return s;
      return { ...s, panelOpen: !s.panelOpen, sheetExpanded: false };
    });
  }, []);

  const onDragChange = useCallback((isDragging) => {
    dragging.current = isDragging;
  }, []);

  useEffect(() => {
    mounted.current = true;
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(!!mq?.matches); sync(); mq?.addEventListener?.('change', sync);
    const vis = () => setHidden(document.visibilityState === 'hidden'); vis(); document.addEventListener('visibilitychange', vis);
    const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    heading.current?.focus();
    return () => { mounted.current = false; mq?.removeEventListener?.('change', sync); document.removeEventListener('visibilitychange', vis); document.body.style.overflow = overflow; document.body.style.cursor = ''; };
  }, []);

  // Announce each new view, and keep keyboard focus inside the explorer when the focused button disappears.
  useEffect(() => {
    if (live.current) live.current.textContent = describeView(nav, opts, cosmos);
    if (root.current && !root.current.contains(document.activeElement)) {
      (panelOpen ? heading.current : toggleBtn.current)?.focus();
    }
  }, [nav, opts, cosmos, panelOpen]);

  // When the details panel hides, move focus to the toggle button so focus stays inside the explorer.
  useEffect(() => {
    if (wasPanelOpen.current && !panelOpen && in3d) {
      toggleBtn.current?.focus();
    }
    wasPanelOpen.current = panelOpen;
  }, [panelOpen, in3d]);

  // Ensure landing errors and the newer-version offer are always visible in the panel.
  useEffect(() => {
    if (env.status === 'failed' || (newer && here.level === 'universe')) {
      setState((s) => (s.panelOpen ? s : { ...s, panelOpen: true }));
    }
  }, [env.status, newer, here.level]);

  // Destination access from the mission service. Any failed refresh (or a different signed-in
  // learner) clears the previous answer: an old "available" is never authority for a new entry.
  const planetIds = useMemo(() => (cosmos.planets || []).map((p) => p.id), [cosmos]);
  useEffect(() => {
    let alive = true;
    setAccessReply(null);
    if (!planetIds.length || !client) return undefined;
    client.access(planetIds).then((res) => {
      if (alive) setAccessReply(res.state === 'loaded' && res.data?.destinations ? { key: viewerKey, destinations: res.data.destinations } : null);
    });
    return () => { alive = false; };
  }, [planetIds, missionId, client, viewerKey]);

  // Session pinning: the visit keeps the catalog it opened with. Coming back to the overview checks quietly
  // for a newer published version and offers it; it is never swapped in mid-journey.
  const wentDeeper = useRef(false);
  useEffect(() => {
    if (nav.path.length > 1) { wentDeeper.current = true; return; }
    if (!wentDeeper.current || !checkNewer) return;
    wentDeeper.current = false;
    checkNewer(cosmos.version).then((next) => { if (next && mounted.current) setNewer(next); });
  }, [nav.path.length, checkNewer, cosmos.version]);

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

  // The surface to prepare: the one we are on, or the landing site of the planet being inspected.
  const targetKind = (environment || (landable ? cosmos.environmentById(planet.environmentId) : null))?.sceneKind || null;
  const load = useCallback((kind = targetKind) => {
    if (!kind) return;
    setEnv({ status: 'loading', Comp: null, kind });
    loadEnvironment({ fail: failLanding, sceneKind: kind })
      .then((m) => { if (mounted.current) setEnv({ status: 'ready', Comp: m.default, kind }); })
      .catch(() => { if (mounted.current) setEnv({ status: 'failed', Comp: null, kind }); });
  }, [loadEnvironment, failLanding, targetKind]);

  // Prefetch the surface while its planet is inspected (or when arriving straight from the text view).
  useEffect(() => {
    if (in3d && targetKind && (env.kind !== targetKind || env.status === 'idle') && env.status !== 'loading') load(targetKind);
  }, [targetKind, in3d, env.kind, env.status, load]);

  const shotKey = JSON.stringify([nav.path, framedSelection(nav)]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const shot = useMemo(() => shotFor(here, framedSelection(nav), environment, cosmos), [shotKey]);

  function onKeyDown(e) {
    e.stopPropagation(); // the dashboard deck must not change slides underneath
    if (mission || pilotEntry) return; // the mission sheet handles its own keys
    if (e.target.closest?.('input, textarea, select')) return;
    const k = e.key;
    if (k === 'Escape') { if (nav.path.length > 1 || nav.selected) { e.preventDefault(); go({ type: 'back' }); } return; }
    if (k === 'l' || k === 'L') { if (webgl && !contextLost) setView((v) => (v === '3d' ? 'text' : '3d')); return; }
    if (!in3d) return;
    if ((k === 'd' || k === 'D') && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); togglePanel(); return; }
    if (!api.current) return;
    if (k === 'ArrowLeft') { e.preventDefault(); api.current.orbit(-12, 0); }
    else if (k === 'ArrowRight') { e.preventDefault(); api.current.orbit(12, 0); }
    else if (k === 'ArrowUp') { e.preventDefault(); api.current.orbit(0, -10); }
    else if (k === 'ArrowDown') { e.preventDefault(); api.current.orbit(0, 10); }
    else if (k === '+' || k === '=') api.current.zoom(0.85);
    else if (k === '-' || k === '_') api.current.zoom(1.18);
    else if (k === 'r' || k === 'R') api.current.reset();
  }

  const running = active && !hidden && (traveling || (here.level === 'environment' && motion));
  const select = (id) => { if (!dragging.current) go({ type: 'select', id }); };
  const selectQuietly = (id) => go({ type: 'select', id, quiet: true }); // a site chosen in the card frames it without reopening the dock

  const scene = in3d && <div className="mx-canvas">
    <Canvas dpr={low ? [1, 1.25] : [1, 1.75]} gl={{ antialias: !low, powerPreference: 'high-performance' }}
      frameloop={!active ? 'never' : running ? 'always' : 'demand'} camera={{ fov: 45, near: 0.1, far: 1200, position: shot.position }}
      onCreated={({ gl }) => gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); setContextLost(true); })}>
      <color attach="background" args={['#05101f']} />
      {here.level !== 'environment' && <><Starfield low={low} /><Nebulae low={low} /><SpaceLevel cosmos={cosmos} entry={here} selected={nav.selected} onSelect={select} low={low} /></>}
      {environment && env.status === 'ready' && env.kind === environment.sceneKind && <env.Comp environment={environment} selected={nav.selected} onSelect={select} motion={motion} low={low} equipment={equipment} />}
      <CameraRig shot={shot} travel={travel} motion={motion} onTravel={setTraveling} onDragChange={onDragChange} panelOpen={panelOpen} api={api} />
      {showMetrics && <SpikeMetrics onSample={(m) => setMetrics((prev) => (prev && Object.keys(m).every((k) => prev[k] === m[k]) ? prev : m))} />}
    </Canvas>
  </div>;

  const textNotice = contextLost ? 'The 3D view stopped on this device, so here is the text view. Your place is kept.'
    : !webgl ? '3D isn’t available on this device, so here is the text view. It has the same destinations and details.' : null;
  // The text view's explicit way onto a surface; the same access rule as the 3D landing button.
  const land = (planetId) => {
    const p = cosmos.planetById(planetId), path = canLand(p, opts) && pathTo('environment', p.environmentId, cosmos);
    if (path) go({ type: 'jump', path });
  };
  const arrivalCard = (inline) => arrivalDesign && arrival && !missionOpen && <ArrivalCard key={`${viewerKey}|${arrivalPlanetId}`} inline={inline}
    design={arrivalDesign} state={arrival} dispatch={arrivalDo} hold={arrivalHold} planetName={cosmos.planetById(arrivalPlanetId)?.name} choices={choices}
    onSelectSite={selectQuietly} onStart={(c) => openMission(c.id, c.routeId ? { id: c.id, route: c.routeId } : null)} />;

  const crumbs = breadcrumbs(nav, cosmos);
  const newerNotice = newer && <div className="mx-newer" role="status"><p>A newer version of this universe is available.</p>
    <button type="button" className="mx-primary" onClick={() => onAdopt(newer)}><RefreshCw size={16} aria-hidden="true" />Load it</button></div>;
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
    <Banner preview={preview} missions={missionRegistry.length > 0} />
    <div className="mx-stage">
      {scene}
      {in3d && <div className={`mx-fade${traveling ? '' : ' is-done'}`} key={`${nav.path.length}-${here.id || ''}`} aria-hidden="true" />}
      {!in3d && environment && <SurfaceTextView cosmos={cosmos} environment={environment} opts={opts} selected={nav.selected} onSelect={select} headingRef={heading}
        notice={textNotice} canUse3d={webgl && !contextLost} onShow3d={() => setView('3d')} onBack={() => go({ type: 'back' })}
        onOpenMission={openMission} onOpenActivity={onOpenActivity} arrivalCard={arrivalCard(true)} />}
      {!in3d && !environment && <ExplorerTextView cosmos={cosmos} opts={opts} header={newerNotice} onOpenMission={openMission} onOpenActivity={onOpenActivity} canUse3d={webgl && !contextLost}
        notice={textNotice} onLand={land}
        onShow3d={(level, id) => { const path = pathTo(level, id, cosmos); if (path) { go({ type: 'jump', path }); setView('3d'); } }} />}
      {in3d && arrivalCard(false)}
      {in3d && <div className={`mx-panel-dock${panelOpen ? ' is-open' : ' is-collapsed'}${sheetExpanded ? ' is-expanded' : ''}`}>
        <div className="mx-panel-controls">
          {panelOpen && <button type="button" className="mx-sheet-size" aria-expanded={sheetExpanded} aria-controls="mx-panel" onClick={() => setState((s) => ({ ...s, sheetExpanded: !s.sheetExpanded }))}>
            <span className="mx-sheet-grip" aria-hidden="true" />
            <span>{sheetExpanded ? 'Compact view' : 'Expand details'}</span>
          </button>}
          <button ref={toggleBtn} type="button" className="mx-panel-toggle" aria-expanded={panelOpen} aria-controls="mx-panel" onClick={togglePanel}>
            {panelOpen ? <><ChevronDown size={15} aria-hidden="true" />Hide details</> : <><ChevronUp size={15} aria-hidden="true" />Show details</>}
          </button>
        </div>
        <aside id="mx-panel" className="mx-panel" aria-labelledby="mx-panel-title" hidden={!panelOpen}>
          <span className="mx-eyebrow">{LEVEL_LABEL[here.level]}</span>
          <h2 id="mx-panel-title" ref={heading} tabIndex={-1}>{here.level === 'universe' ? 'My Universe' : itemFor(here, cosmos)?.name}</h2>
          {here.level === 'universe' && newerNotice}
          <Panel cosmos={cosmos} nav={nav} opts={opts} onOpenMission={openMission} onOpenActivity={onOpenActivity} go={go} select={select} env={env} onRetry={load} onTextView={() => setView('text')} />
          <p className="mx-hint">Drag to look around · pinch or scroll to zoom · arrow keys rotate · D toggles details · Esc goes back · L for text view</p>
        </aside>
      </div>}
      {!in3d && !environment && <h2 className="mx-sr" ref={heading} tabIndex={-1}>My Universe text view</h2>}
      {mission && <MissionSheet mission={mission} onClose={() => setMissionId(null)} />}
      {pilotEntry && !client && <MissionSignInNotice mission={pilotEntry.mission} onClose={() => setMissionId(null)} />}
      {pilotEntry && client && <PilotMissionSheet key={`${viewerKey}|${pilotEntry.mission.id}`} entry={pilotEntry} initial={missionInitial?.id === pilotEntry.mission.id ? missionInitial : null} allowInReview={allowInReviewMissions} registry={missionRegistry} client={client} preview={preview} onClose={() => setMissionId(null)} />}
      {showMetrics && in3d && <div className="mx-metrics" aria-hidden="true">
        {metrics ? <>{metrics.at && performance.now() - metrics.at < 1600 ? `${metrics.fps} fps` : 'idle · renders on demand'} · {metrics.calls} draw calls · {metrics.triangles.toLocaleString()} tris · {metrics.geometries} geometries · {metrics.textures} textures · {low ? 'standard' : 'high'} detail</> : 'measuring…'}
      </div>}
    </div>
    <p className="mx-sr" aria-live="polite" ref={live} />
  </div>;

  return typeof document === 'undefined' ? ui : createPortal(ui, document.body);
}

function Destinations({ cosmos, nav, opts, select }) {
  const here = current(nav);
  const kids = childrenOf(here, cosmos);
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

function Panel({ cosmos, nav, opts, go, select, env, onRetry, onTextView, onOpenMission, onOpenActivity }) {
  const here = current(nav);
  const item = itemFor(here, cosmos);
  const kids = childrenOf(here, cosmos);
  const chosen = kids.find((k) => k.id === nav.selected)?.item;
  if (here.level === 'universe') return <>
    <p>Deep space, not to scale. Choose a galaxy to explore. Charted places are listed here and lit in the view.</p>
    <Destinations cosmos={cosmos} nav={nav} opts={opts} select={select} />
    {chosen && <div className="mx-detail"><h3>{chosen.name}</h3><p>{chosen.summary}</p>
      <button type="button" className="mx-primary" onClick={() => go({ type: 'open', id: chosen.id })}>Explore {chosen.name}<ChevronRight size={16} aria-hidden="true" /></button></div>}
  </>;
  if (here.level === 'galaxy') return <>
    <p>{item.summary}</p>
    <Destinations cosmos={cosmos} nav={nav} opts={opts} select={select} />
    {!kids.length && <p className="mx-muted">No star systems are charted here yet.</p>}
    {item.uncharted > 0 && <p className="mx-muted">{item.uncharted} more systems are visible but not charted.</p>}
    {chosen && <div className="mx-detail"><h3>{chosen.name}</h3><p>{chosen.starClass}. {chosen.summary}</p>
      <button type="button" className="mx-primary" onClick={() => go({ type: 'open', id: chosen.id })}>Visit {chosen.name}<ChevronRight size={16} aria-hidden="true" /></button></div>}
  </>;
  if (here.level === 'system') return <>
    <p>{item.starClass}. Orbits are drawn closer together than real ones.</p>
    <Destinations cosmos={cosmos} nav={nav} opts={opts} select={select} />
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
      <FactList facts={item.facts} />
      {access.status === 'locked' && <p className="mx-req"><Lock size={14} aria-hidden="true" />{access.requirementText}</p>}
      {access.status === 'not-connected' && <p className="mx-muted">Access to this planet will come from your learning record once that service is connected.</p>}
      {!item.environmentId && access.status !== 'locked' && <p className="mx-muted">No landing site is charted yet.</p>}
      <MissionList planetId={item.id} opts={opts} onOpen={onOpenMission} />
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
    <Destinations cosmos={cosmos} nav={nav} opts={opts} select={select} />
    {chosen && <div className="mx-detail"><h3>{chosen.name}</h3><p>{chosen.purpose}</p>
      <ul className="mx-facts">{chosen.observations.map((o) => <li key={o}>{o}</li>)}</ul>
      <Workstations location={chosen} opts={opts} onOpenMission={onOpenMission} onOpenActivity={onOpenActivity} /></div>}
  </>;
  return null;
}
