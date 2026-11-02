/**
 * EMULATOR-ONLY DEMO ENTRY. Drives the real learner and coach UI and the real
 * createDefaultUniverseClient against the local mission service (127.0.0.1:3018), signed in
 * through the local Auth emulator (127.0.0.1:9299) with in-memory persistence.
 *
 * - Refuses to run anywhere but localhost, before any Firebase app exists.
 * - Hard-coded demo project and dummy key; never imports src/firebase.js or its live config.
 * - Fixtures (registry and reference examples) are imported only by this explicit test entry.
 * - Synthetic actors only. The demo password is a published fixture value for the local emulator.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

const LOCAL = ['localhost', '127.0.0.1'].includes(location.hostname);
const root = createRoot(document.getElementById('root'));

const DEMO = Object.freeze({
  firebase: { projectId: 'demo-universe-phase1', apiKey: 'demo-api-key-not-a-secret', authDomain: 'demo-universe-phase1.firebaseapp.com' },
  authEmulator: 'http://127.0.0.1:9299',
  api: 'http://127.0.0.1:3018',
  password: 'Synthetic-Pilot-Only-2026!',
  actors: {
    learner: { email: 'learner@universe.example', label: 'Synthetic learner (phase1-demo-school)' },
    coach: { email: 'coach@universe.example', label: 'Synthetic coach (phase1-demo-school)' },
    other: { email: 'other@universe.example', label: 'Other-organization admin (phase1-demo-other-school)' }
  }
});
const TASKS = [
  { id: 'wind', missionId: 'thalassa-wind-survey', routeId: 'guided', label: 'Thalassa wind · guided (wind-capacity-factor)' },
  { id: 'journey-guided', missionId: 'spacecraft-journey', routeId: 'guided', label: 'Spacecraft journey · guided (journey-rates)' },
  { id: 'journey-advanced', missionId: 'spacecraft-journey', routeId: 'advanced', label: 'Spacecraft journey · advanced (journey-mass-power)' }
];

if (!LOCAL) {
  root.render(<div className="sv-refuse" role="alert"><h1>Local demo only</h1><p>This page runs only on localhost against local emulators. Nothing was initialised.</p></div>);
} else {
  start();
}

async function start() {
  const [{ initializeApp }, fa, { MyUniverseExplorer }, { CoachUniverseSubmissions }, { createDefaultUniverseClient, describeFailure }, session, fixtures, { default: catalogUrl }] = await Promise.all([
    import('firebase/app'), import('firebase/auth'),
    import('../../src/features/universe/explore/MyUniverseExplorer.jsx'),
    import('../../src/features/coach/universe/CoachUniverseSubmissions.jsx'),
    import('../../src/features/universe/pilot/universeClient.js'),
    import('../../src/features/universe/pilot/missionSession.js'),
    // Fixture registry and reference examples: this explicit emulator demo entry only, never the app.
    import('../../shared/universe/fixtures/index.js'),
    import('../../public/cosmos/v1/catalog.json?url')
  ]);
  const { FIXTURE_RELEASES, REFERENCE_ARTIFACTS } = fixtures;
  const app = initializeApp(DEMO.firebase, 'universe-phase1-demo');
  const auth = fa.initializeAuth(app, { persistence: fa.inMemoryPersistence });
  fa.connectAuthEmulator(auth, DEMO.authEmulator, { disableWarnings: true });
  // One shared client for the page, exactly as the app builds it; screens bind it to the verified scope.
  const client = createDefaultUniverseClient({ auth, baseUrl: DEMO.api });
  const seen = { learnerSubmissionIds: [] };

  const taskEntry = (t) => {
    const entry = session.findPilotMission(FIXTURE_RELEASES, t.missionId);
    const route = entry.mission.routes.find((r) => r.id === t.routeId);
    return { entry, route, identity: session.identityFor(entry.bundle, entry.mission, route) };
  };
  const examplesFor = (t) => REFERENCE_ARTIFACTS.filter((a) => a.endpoint.includes(`/${t.missionId}/`) && a.request.routeId === t.routeId);
  const short = (r) => (r.state === 'loaded' ? { state: r.state, status: r.status, ...r.data } : r);

  function Harness() {
    const [ctx, setCtx] = useState({ state: 'signed-out' });
    const [view, setView] = useState('home');
    const [taskId, setTaskId] = useState('wind');
    const [exampleName, setExampleName] = useState('');
    const [log, setLog] = useState([]);
    const [busy, setBusy] = useState(false);
    const [open, setOpen] = useState(0);
    const task = TASKS.find((t) => t.id === taskId);
    const examples = useMemo(() => examplesFor(task), [task]);
    useEffect(() => { setExampleName(examples[0]?.name || ''); }, [examples]);
    const note = (title, value) => setLog((l) => [{ at: new Date().toLocaleTimeString('en-GB'), title, value }, ...l].slice(0, 12));

    // Scope comes only from the signed demo token's claims, as in the app's AuthProvider.
    useEffect(() => fa.onIdTokenChanged(auth, async (user) => {
      if (!user) { setCtx({ state: 'signed-out' }); return; }
      setCtx({ state: 'resolving', uid: user.uid });
      const { claims } = await user.getIdTokenResult();
      if (auth.currentUser !== user) return;
      setCtx({ state: 'ready', uid: user.uid, email: user.email, role: claims.role ?? null, orgId: typeof claims.orgId === 'string' && claims.orgId ? claims.orgId : null, classIds: claims.classIds ?? [] });
    }), []);
    const viewer = ctx.state === 'ready' && ctx.orgId ? { uid: ctx.uid, orgId: ctx.orgId } : null;

    async function signIn(actor) {
      setBusy(true); setView('home');
      try {
        await fa.signOut(auth);
        await fa.signInWithEmailAndPassword(auth, DEMO.actors[actor].email, DEMO.password);
        note(`Signed in: ${DEMO.actors[actor].label}`, { uid: auth.currentUser.uid });
      } catch (e) { note('Sign-in failed (is the Auth emulator seeded?)', { code: e.code, message: e.message }); }
      setBusy(false);
    }

    async function loadExample() {
      const artifact = examples.find((a) => a.name === exampleName);
      if (!viewer || !artifact) return;
      setBusy(true);
      const scoped = client.withScope(viewer);
      const { route, identity } = taskEntry(task);
      const before = await scoped.getDraft(identity);
      if (before.state !== 'loaded') { note('Draft load failed: example not saved', short(before)); setBusy(false); return; }
      const revision = before.data.draft?.revision ?? 0;
      const work = session.workFromSaved(route, { ...artifact.request, previousSubmissionId: before.data.draft?.previousSubmissionId ?? null });
      const body = session.draftBody(route, identity, work, revision);
      const saved = await scoped.saveDraft(identity.missionId, body, `demo-${crypto.randomUUID()}`);
      const after = await scoped.getDraft(identity);
      note(`Reference example "${artifact.name}" → server draft`, {
        currentRevisionBefore: revision, save: short(saved),
        reload: after.state === 'loaded' ? { revision: after.data.draft?.revision, updatedAt: after.data.draft?.updatedAt, evidenceParts: after.data.draft?.evidence?.map((e) => e.partId) } : short(after)
      });
      setBusy(false);
    }

    async function crossOrgCheck() {
      if (!viewer) return;
      setBusy(true);
      const scoped = client.withScope(viewer);
      const queue = {};
      for (const status of ['submitted', 'returned', 'approved']) {
        const r = await scoped.coachQueue({ status, limit: 20 });
        queue[status] = r.state === 'loaded' ? { count: r.data.submissions.length, learners: [...new Set(r.data.submissions.map((s) => s.learnerUid))], nextCursor: r.data.nextCursor } : short(r);
      }
      const target = seen.learnerSubmissionIds[0];
      const review = target ? short(await scoped.review(target, { decision: 'approved', note: 'Cross-organization check', expectedSubmissionRevision: 1 }, `demo-${crypto.randomUUID()}`)) : 'No learner submission seen yet: sign in as the learner and open My attempts first.';
      note('Cross-organization check (real adapter)', { viewer, queue, reviewOfLearnerSubmission: { submissionId: target ?? null, result: review } });
      setBusy(false);
    }

    async function rememberLearnerSubmissions() {
      if (!viewer) return;
      const r = await client.withScope(viewer).mySubmissions({ limit: 20 });
      if (r.state === 'loaded') seen.learnerSubmissionIds = r.data.submissions.map((s) => s.submissionId);
      note('Learner submissions (real adapter)', r.state === 'loaded' ? r.data.submissions.map((s) => ({ id: s.submissionId, attempt: s.attemptNumber, task: s.taskId, status: s.status, outcome: s.outcome ?? null, previous: s.previousSubmissionId ?? null })) : short(r));
    }

    const t = taskEntry(task);
    const bar = <details className="sv-bar" open aria-label="Emulator demo controls">
      <summary>EMULATOR DEMO CONTROLS · not part of the learner UI</summary>
      <p>Local Auth emulator <code>{DEMO.authEmulator}</code> · mission service <code>{DEMO.api}</code> · project <code>{DEMO.firebase.projectId}</code>. Synthetic actors and fixture tasks only.</p>
      <h3>1. Actor</h3>
      <div className="sv-row">{Object.entries(DEMO.actors).map(([id, a]) => <button key={id} type="button" disabled={busy} onClick={() => signIn(id)}>{a.label}</button>)}
        <button type="button" disabled={busy || ctx.state === 'signed-out'} onClick={() => fa.signOut(auth)}>Sign out</button></div>
      <p>{ctx.state === 'ready' ? <>Signed in <code>{ctx.uid}</code> · claims: role <code>{String(ctx.role)}</code>, org <code>{String(ctx.orgId)}</code>, classes <code>{JSON.stringify(ctx.classIds)}</code>{!ctx.orgId && <strong> · no orgId claim: screens stay closed</strong>}</> : ctx.state === 'resolving' ? 'Reading signed token claims…' : 'Signed out: nothing is requested.'}</p>
      <h3>2. Task and reference example</h3>
      <div className="sv-row"><select value={taskId} onChange={(e) => setTaskId(e.target.value)} aria-label="Task">{TASKS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select></div>
      <div className="sv-row"><select value={exampleName} onChange={(e) => setExampleName(e.target.value)} aria-label="Reference example">{examples.map((a) => <option key={a.name} value={a.name}>REFERENCE EXAMPLE · {a.name}</option>)}</select>
        <button type="button" disabled={busy || !viewer} onClick={loadExample}>Load into server draft</button></div>
      <h3>3. Open the real screens</h3>
      <div className="sv-row">
        <button type="button" disabled={!viewer} onClick={() => { setOpen((n) => n + 1); setView('explorer'); }}>Open mission sheet</button>
        <button type="button" disabled={!viewer} onClick={() => setView('coach')}>Open coach queue</button>
        <button type="button" disabled={!viewer} onClick={rememberLearnerSubmissions}>List my submissions</button>
        <button type="button" disabled={busy || !viewer} onClick={crossOrgCheck}>Cross-organization check</button>
        <button type="button" onClick={() => setView('home')}>Home</button></div>
      <h3>Results (real adapter answers)</h3>
      {log.length ? log.map((e, i) => <div key={i}><p><strong>{e.at} · {e.title}</strong></p><pre>{JSON.stringify(e.value, null, 2)}</pre></div>) : <p>Nothing yet.</p>}
    </details>;

    if (view === 'explorer' && viewer) return <>{bar}<MyUniverseExplorer key={`${viewer.uid}|${viewer.orgId}|${open}`} preview catalogUrl={catalogUrl} forceTextView={new URLSearchParams(location.search).get('text') === '1'}
      missionRegistry={FIXTURE_RELEASES} missionClient={client} viewer={viewer} allowInReviewMissions onClose={() => setView('home')}
      initialMission={{ id: t.entry.mission.id, route: t.route.id }} /></>;
    if (view === 'coach' && viewer) return <>{bar}<main className="sv-coach">
      <CoachUniverseSubmissions coachUser={{ uid: viewer.uid, displayName: ctx.email }} orgId={viewer.orgId} client={client} registry={FIXTURE_RELEASES} /></main></>;
    return <>{bar}<main className="sv-home"><h1>My Universe · local service demo</h1>
      <p>Real learner and coach screens, the real mission client, a local mission service and the local Auth emulator. Fixture missions and synthetic actors only. Nothing here reaches a Firebase project.</p>
      <p>{viewer ? `Ready as ${ctx.email}.` : describeFailure({ state: 'unauthenticated' })}</p></main></>;
  }

  root.render(<Harness />);
}
