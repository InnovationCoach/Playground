import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, Lightbulb, Eye, ChevronLeft, ChevronRight, Send, RefreshCw, History, ClipboardList, BookOpen, CloudOff, Cloud, AlertTriangle, PenLine } from 'lucide-react';
import { checkNumber, displayAnswer, canonicalStringify, getMissionDecision, getSupportDescription } from '../../../../shared/universe/index.js';
import {
  identityFor, identityKey, sameIdentity, routeDatasets, emptyWork, withAnswer, partStatus,
  draftBody, submissionBody, checkSubmission, checkDraft, workFromSaved, codePoints, evidenceFromWork
} from './missionSession.js';
import { NotebookPart, EvidenceView, Counter, partTitle } from './NotebookParts.jsx';
import { learningDesign, buildActions, firstActionOf, stepsUsingPart, actionCopy, gradeLabel, standardsAcross } from './focusFlow.js';
import { newIdempotencyKey, describeFailure } from './universeClient.js';
import { DatasetView } from './DatasetView.jsx';
import { useDialogFocus } from './dialogFocus.js';
import './pilot.css';

const AUTOSAVE_MS = 1200;
const AVAIL_TEXT = {
  'in-review': 'This mission is still being reviewed, so work can’t be started or sent yet.',
  withdrawn: 'This mission is paused for a correction. Your saved work and earlier attempts are kept.',
  retired: 'This mission is no longer offered. Your earlier attempts stay in your history.',
  unknown: 'We couldn’t confirm that this mission is open right now.'
};
const DRAFT_FIELDS = ['supportMode', 'activeStepId', 'answers', 'evidence', 'reflection', 'previousSubmissionId'];
/** Only a saved draft that validates for this exact task (same shared rules as the server) is restored. */
export function restorable(registry, identity, d) {
  if (!d) return false;
  const body = { ...Object.fromEntries(['releaseId', 'missionVersion', 'routeId', 'taskId', 'policyVersion'].map((k) => [k, identity[k]])), expectedRevision: d.revision };
  for (const k of DRAFT_FIELDS) if (d[k] !== undefined) body[k] = d[k];
  return checkDraft(registry, identity, body).ok;
}
const STATUS_TEXT = { submitted: 'Sent · waiting for your coach', returned: 'Returned for revision', approved: 'Reviewed by your coach' };

export function timeMs(ts) {
  if (!ts) return NaN;
  return typeof ts === 'string' ? Date.parse(ts) : ts.seconds != null ? ts.seconds * 1000 + Math.floor((ts.nanoseconds || 0) / 1e6) : ts._seconds != null ? ts._seconds * 1000 : NaN;
}

export function formatTime(ts) {
  const ms = timeMs(ts);
  if (!Number.isFinite(ms)) return '';
  return new Date(ms).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/** Answers that mean this screen may no longer speak for the signed-in learner: drop what it holds privately. */
export const isScopeFailure = (r) => r?.state === 'unauthenticated' || (r?.state === 'error' && (r.status === 403 || r.code === 'FORBIDDEN'));

/**
 * Revising a returned attempt continues from whichever is newer: the account draft (kept,
 * with its revision, when work is sent) or the returned attempt. A draft already linked to
 * this attempt, or saved after it was sent, holds newer work and is never overwritten.
 */
export function draftIsNewer(draft, attempt) {
  if (!draft) return false;
  if (draft.previousSubmissionId === attempt.submissionId) return true;
  const saved = timeMs(draft.updatedAt), sent = timeMs(attempt.createdAt);
  return Number.isFinite(saved) && Number.isFinite(sent) && saved > sent;
}

export const availabilityOf = (result) => (result?.state === 'loaded' ? result.data.availability : null);
/**
 * Assessed work needs both the right status and the service's explicit permission:
 * withdrawn, retired and unknown stay paused whatever the booleans say. `in-review`
 * counts only inside an explicitly trusted fixture preview (never in production).
 */
const statusAllows = (a, allowInReview) => a.status === 'open' || (allowInReview && a.status === 'in-review');
export const canWork = (a, allowInReview = false) => !!a && statusAllows(a, allowInReview) && (a.canStart === true || a.canResume === true);
export const canSend = (a, allowInReview = false) => canWork(a, allowInReview) && a.canSubmit === true;

export function outcomeText(item) {
  if (item.status !== 'approved') return null;
  if (item.outcome?.type === 'reviewed-only') return 'Your coach reviewed this attempt. A review records feedback only; it doesn’t open new places.';
  if (item.outcome?.type) return `Outcome: ${item.outcome.type}.`;
  return 'Your coach reviewed this attempt.';
}

/**
 * A pilot mission (contract 0.1.1) over the explorer, identical in 3D and text view.
 * All work stays in memory until the mission service confirms a save. Closing the
 * sheet, signing out or switching account/organization discards it (the parent
 * re-keys this component), and late responses from a closed sheet are ignored.
 */
export function PilotMissionSheet({ entry, registry, client, preview = false, onClose, initial = null, allowInReview = false, plan = null }) {
  const { bundle, mission } = entry;
  const [routeId, setRouteId] = useState(null);
  const [view, setView] = useState('work');
  const [works, setWorks] = useState({});
  const [saves, setSaves] = useState({});
  const [avail, setAvail] = useState({});
  const [history, setHistory] = useState({ state: 'idle', items: [], nextCursor: null });
  const [send, setSend] = useState({ state: 'idle' });
  const [reviseFrom, setReviseFrom] = useState(null);
  const alive = useRef(true);
  const heading = useRef(null);
  const saveKeys = useRef({}), sendKey = useRef({ body: null, key: null }), edited = useRef({}), latest = useRef(works);
  latest.current = works;
  // Set in setup as well as cleared in cleanup, so React StrictMode's effect replay can't leave it false.
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const route = mission.routes.find((r) => r.id === routeId) || null;
  const identity = useMemo(() => (route ? identityFor(bundle, mission, route) : null), [bundle, mission, route]);
  const key = identity ? identityKey(identity) : null;
  const work = key ? works[key] : null;
  const save = key ? saves[key] || { state: 'not-saved' } : null;
  const availability = key ? availabilityOf(avail[key]) : null;
  const open = canWork(availability, allowInReview);
  const sendable = canSend(availability, allowInReview);
  const setWork = useCallback((fn) => {
    if (!key) return;
    edited.current[key] = true;
    setWorks((all) => ({ ...all, [key]: typeof fn === 'function' ? fn(all[key]) : fn }));
    setSaves((all) => (all[key]?.state === 'conflict' ? all : { ...all, [key]: { ...(all[key] || {}), state: 'not-saved' } }));
  }, [key]);

  const body = useRef(null);
  useEffect(() => { heading.current?.focus(); const sheet = body.current?.closest('.px-sheet'); if (sheet) sheet.scrollTop = 0; }, [routeId, view]);

  const loadHistory = useCallback(async (cursor) => {
    setHistory((h) => ({ ...h, state: cursor ? 'more' : 'loading' }));
    const res = await client.mySubmissions({ missionId: mission.id, limit: 20, cursor });
    if (!alive.current) return;
    if (res.state === 'loaded') setHistory((h) => ({ state: 'loaded', items: cursor ? [...h.items, ...(res.data.submissions || [])] : res.data.submissions || [], nextCursor: res.data.nextCursor || null }));
    else setHistory((h) => (isScopeFailure(res) ? { state: 'error', result: res, items: [], nextCursor: null } : { ...h, state: 'error', result: res }));
  }, [client, mission.id]);
  useEffect(() => { loadHistory(); }, [loadHistory]);
  // Optional deep link ({ route, view, step }) so previews and device checks can open a state directly.
  useEffect(() => {
    const r = initial?.route && mission.routes.find((x) => x.id === initial.route);
    if (!r) return;
    chooseRoute(r).then(() => {
      if (!alive.current) return;
      if (initial.view) setView(initial.view);
      const step = r.steps[Number(initial.step) - 1];
      if (step) setWorks((all) => { const k = identityKey(identityFor(bundle, mission, r)); return all[k] ? { ...all, [k]: { ...all[k], activeStepId: step.id } } : all; });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAvailability = useCallback(async (id, k) => {
    setAvail((all) => ({ ...all, [k]: null }));
    const res = await client.availability(id);
    if (alive.current) setAvail((all) => ({ ...all, [k]: res }));
  }, [client]);

  // Choosing a route opens that exact task's own draft: work never moves between routes.
  // `revising` (a returned attempt) waits for the account draft, then continues from the newer of the two.
  async function chooseRoute(r, { seed, revising } = {}) {
    const id = identityFor(bundle, mission, r), k = identityKey(id);
    setRouteId(r.id); setView('work'); setSend({ state: 'idle' });
    if (seed) { edited.current[k] = true; setWorks((all) => ({ ...all, [k]: seed })); setSaves((all) => ({ ...all, [k]: { ...(all[k] || {}), state: 'not-saved' } })); }
    else if (!revising) setWorks((all) => (all[k] ? all : { ...all, [k]: emptyWork(r, { supportMode: (plan?.missionId === mission.id && plan.routeId === r.id && plan.supportMode) || Object.values(all)[0]?.supportMode }) }));
    checkAvailability(id, k);
    if (saves[k]?.loaded && !revising) return;
    setSaves((all) => ({ ...all, [k]: { ...(all[k] || {}), state: all[k]?.state || 'not-saved', loading: true, loadError: null } }));
    const res = await client.getDraft(id);
    if (!alive.current) return;
    const fromAttempt = revising ? workFromSaved(r, revising, { previousSubmissionId: revising.submissionId }) : null;
    if (res.state !== 'loaded') {
      // The attempt stays readable; saving is paused (loadError) so an unseen account draft is never overwritten.
      if (fromAttempt) setWorks((all) => ({ ...all, [k]: fromAttempt }));
      setSaves((all) => ({ ...all, [k]: { ...(all[k] || {}), loading: false, state: all[k]?.state || 'not-saved', loadError: res } }));
      return;
    }
    const d = res.data.draft;
    if (revising && (!d || restorable(registry, id, d))) {
      const keep = draftIsNewer(d, revising);
      const linked = keep && d.previousSubmissionId === revising.submissionId;
      edited.current[k] = !linked;
      setWorks((all) => ({ ...all, [k]: keep ? workFromSaved(r, d, { previousSubmissionId: revising.submissionId }) : fromAttempt }));
      // Saving continues from the account draft's revision, so there is no false conflict and nothing newer is lost.
      setSaves((all) => ({ ...all, [k]: { state: linked ? 'saved' : 'not-saved', loading: false, loaded: true, revision: d?.revision ?? 0, updatedAt: d?.updatedAt } }));
      return;
    }
    if (d && !restorable(registry, id, d)) {
      if (fromAttempt) setWorks((all) => ({ ...all, [k]: fromAttempt }));
      // A saved draft that doesn't fit this exact task is never restored as blank or relabelled work.
      setSaves((all) => ({ ...all, [k]: { ...(all[k] || {}), loading: false, state: all[k]?.state || 'not-saved', loadError: { state: 'error', code: 'MALFORMED_RESPONSE', message: 'Your saved work for this task couldn’t be read, so it wasn’t loaded. Nothing has been overwritten.' } } }));
      return;
    }
    if (!d) { setSaves((all) => ({ ...all, [k]: { ...(all[k] || {}), loading: false, loaded: true, revision: 0 } })); return; }
    if (edited.current[k]) {
      // Local edits started before the saved draft arrived: never overwrite either silently.
      setSaves((all) => ({ ...all, [k]: { state: 'conflict', loading: false, loaded: true, revision: all[k]?.revision ?? 0, currentDraft: d } }));
      return;
    }
    setWorks((all) => ({ ...all, [k]: workFromSaved(r, d) }));
    setSaves((all) => ({ ...all, [k]: { state: 'saved', loading: false, loaded: true, revision: d.revision, updatedAt: d.updatedAt } }));
  }

  const doSave = useCallback(async ({ expectedRevision } = {}) => {
    if (!route || !work || !open || save.loadError) return;
    const rev = expectedRevision ?? save.revision ?? 0;
    const body = draftBody(route, identity, work, rev);
    const text = canonicalStringify(body);
    const ks = saveKeys.current[key];
    const idem = ks && ks.body === text ? ks.key : newIdempotencyKey();
    saveKeys.current[key] = { body: text, key: idem };
    const submitted = work;
    setSaves((all) => ({ ...all, [key]: { ...(all[key] || {}), state: 'saving' } }));
    const res = await client.saveDraft(identity.missionId, body, idem);
    if (!alive.current) return false;
    if (res.state === 'loaded') {
      const d = res.data.draft ?? res.data;
      // Edits made while the save was in flight stay "not saved" until the next save.
      setSaves((all) => ({ ...all, [key]: { state: latest.current[key] === submitted ? 'saved' : 'not-saved', loaded: true, revision: d.revision, updatedAt: d.updatedAt } }));
      // R4: true only if the exact work now on screen is what was saved (edits made meanwhile are not).
      return latest.current[key] === submitted;
    } else if (res.state === 'error' && res.code === 'DRAFT_CONFLICT') {
      setSaves((all) => ({ ...all, [key]: { ...(all[key] || {}), state: 'conflict', currentDraft: res.details?.currentDraft || null } }));
    } else {
      setSaves((all) => ({ ...all, [key]: { ...(all[key] || {}), state: 'error', failure: res } }));
    }
    return false;
  }, [route, work, open, save, identity, key, client]);

  // Autosave after a pause, only while the service says the mission is open and nothing conflicts.
  useEffect(() => {
    if (!key || !open || save?.state !== 'not-saved' || !edited.current[key] || save?.loading || save?.loadError) return undefined;
    const t = setTimeout(() => doSave(), AUTOSAVE_MS);
    return () => clearTimeout(t);
  }, [key, open, save?.state, save?.loading, work, doSave]);

  function resolveConflict(useAccount) {
    const d = save.currentDraft;
    if (useAccount && d) {
      edited.current[key] = false;
      setWorks((all) => ({ ...all, [key]: workFromSaved(route, d) }));
      setSaves((all) => ({ ...all, [key]: { state: 'saved', loaded: true, revision: d.revision, updatedAt: d.updatedAt } }));
    } else {
      doSave({ expectedRevision: d?.revision ?? save.revision ?? 0 });
    }
  }

  const items = history.items || [];
  const openAttempt = items.find((s) => s.missionId === mission.id && s.status === 'submitted') || null;

  async function sendForReview() {
    const body = submissionBody(route, identity, work);
    const text = canonicalStringify(body);
    if (sendKey.current.body !== text) sendKey.current = { body: text, key: newIdempotencyKey() };
    setSend({ state: 'sending' });
    const res = await client.submit(identity.missionId, body, sendKey.current.key);
    if (!alive.current) return;
    if (res.state === 'loaded') { setSend({ state: 'sent', data: res.data }); setReviseFrom(null); loadHistory(); return; }
    setSend({ state: 'error', result: res });
    if (res.state === 'error' && ['SUBMISSION_ALREADY_OPEN', 'MISSION_WITHDRAWN', 'MISSION_NOT_OPEN', 'MISSION_RETIRED'].includes(res.code)) {
      loadHistory(); checkAvailability(identity, key);
    }
  }

  function revise(item) {
    const r = mission.routes.find((x) => x.id === item.routeId);
    const k = identityKey(identityFor(bundle, mission, r)), w = works[k], s = saves[k];
    setReviseFrom(item);
    // Work already on this screen that is newer than the returned attempt (unsaved edits, or saved after it was sent) is kept and linked.
    if (s?.loaded && !s.loadError && w && (w.previousSubmissionId === item.submissionId || (edited.current[k] && s.state !== 'saved') || draftIsNewer({ updatedAt: s.updatedAt }, item))) {
      chooseRoute(r, { seed: { ...w, previousSubmissionId: item.submissionId } });
      return;
    }
    chooseRoute(r, { revising: item });
  }

  // Focus flow: one action at a time. The cursor is UI-only; the wire keeps the authored activeStepId.
  const design = useMemo(() => (route ? learningDesign(bundle, mission, route) : null), [bundle, mission, route]);
  const actions = useMemo(() => (route ? buildActions(route, design) : []), [route, design]);
  const [cursor, setCursor] = useState(null);
  const at = work ? (cursor && cursor.key === key && cursor.stepId === work.activeStepId ? cursor.index : firstActionOf(actions, work.activeStepId)) : 0;
  const actionHeading = useRef(null), moved = useRef(false);
  const go = (index) => {
    const a = actions[Math.max(0, Math.min(actions.length - 1, index))];
    moved.current = true;
    setCursor({ key, stepId: a.stepId, index: a.index });
    if (a.stepId !== work.activeStepId) setWork((w) => ({ ...w, activeStepId: a.stepId }));
  };
  useEffect(() => { if (moved.current) { moved.current = false; actionHeading.current?.focus(); } }, [at, view]);
  const [partViews, setPartViews] = useState({});
  const partView = (partId) => partViews[`${key}|${partId}`] || {};
  const onPartView = (partId) => (patch) => setPartViews((all) => ({ ...all, [`${key}|${partId}`]: { ...(all[`${key}|${partId}`] || {}), ...patch } }));

  // Closing with work that isn't saved to the account says so at the moment of closing.
  const [closing, setClosing] = useState(false);
  const closingNow = useRef(false);
  closingNow.current = closing;
  const savesNow = useRef(saves);
  savesNow.current = saves;
  const pendingKeys = (all = saves) => Object.keys(latest.current).filter((k) => edited.current[k] && (all[k]?.state || 'not-saved') !== 'saved');
  const unsavedKeys = pendingKeys();
  const routeNameOf = (k) => mission.routes.find((r) => identityKey(identityFor(bundle, mission, r)) === k)?.name || 'Another task';
  const requestClose = () => {
    if (closing) { setClosing(false); return; } // Escape on the close question means "keep working"
    if (unsavedKeys.length) setClosing(true); else onClose();
  };
  // R3: "Save and close" is offered only when the open task is the only unsaved one, and closes only if,
  // after its save, nothing anywhere is still unsaved (otherwise the question stays, naming what is pending).
  async function saveAndClose() {
    const ok = await doSave();
    // "Keep working" pressed while the save was in flight wins: never close behind the learner's back.
    if (!alive.current || !closingNow.current) return;
    if (ok && pendingKeys(savesNow.current).filter((k) => k !== key).length === 0) onClose(); else setClosing(!ok ? false : true);
  }

  const sheetRef = useRef(null);
  const onKeyDown = useDialogFocus(sheetRef, requestClose, heading);
  const routeLabel = route ? scenarioLabel(bundle, mission, route, design) : '';

  const draftLabel = bundle.status !== 'published';
  // AI Creator overlay: shown beside the reviewed mission, which it can't change.
  const myPlan = plan?.missionId === mission.id && (!route || plan.routeId === route.id) ? plan : null;
  return <div className="mx-mission-wrap" onMouseDown={(e) => { if (e.target === e.currentTarget) requestClose(); }}>
    <section className="mx-mission px-sheet is-focus" role="dialog" aria-modal="true" aria-labelledby="px-title" onKeyDown={onKeyDown} ref={sheetRef}>
      <header className="mx-mission-top">
        <div>
          <span className="mx-eyebrow">Mission{route ? ` · ${route.name}` : ' · Briefing'}</span>
          <h2 id="px-title" ref={heading} tabIndex={-1}>{mission.title}</h2>
          {route && <p className="px-meta">{routeLabel} · Challenge {route.challengeLevel} of 5 · {gradeLabel(route, design)}</p>}
        </div>
        <button type="button" className="mx-icon" onClick={requestClose} aria-label="Close mission"><X size={20} aria-hidden="true" /></button>
      </header>
      {draftLabel && <p className="mx-draft">{preview ? 'Synthetic preview · ' : ''}Draft mission awaiting educator review · not a published task</p>}
      {route && !closing && <nav className="px-tabs" aria-label="Mission sections">
        <button type="button" aria-pressed={view === 'work'} onClick={() => { moved.current = true; setView('work'); }}><PenLine size={15} aria-hidden="true" />Work</button>
        <button type="button" aria-pressed={view === 'review'} onClick={() => { moved.current = true; setView('review'); }}><ClipboardList size={15} aria-hidden="true" />Review and send</button>
        <button type="button" aria-pressed={view === 'history'} onClick={() => setView('history')}><History size={15} aria-hidden="true" />My attempts{items.length ? ` (${items.length})` : ''}</button>
        <button type="button" onClick={() => { setRouteId(null); setSend({ state: 'idle' }); }}><ChevronLeft size={15} aria-hidden="true" />Routes</button>
      </nav>}
      <div className="mx-mission-body" ref={body}>
        {myPlan && !closing && <details className="px-optional px-my-plan" open={!route}><summary>My plan</summary><p>{myPlan.hook}</p>
          <ol>{myPlan.sittings.map((s) => <li key={s.number}><strong>About {s.minutes} minutes:</strong> {s.stepTitles.join(', ')}</li>)}</ol></details>}
        {closing && <ClosePanel names={unsavedKeys.map(routeNameOf)} otherTask={unsavedKeys.some((k) => k !== key)} canSave={!!route && open && !save?.loadError && save?.state !== 'saving' && unsavedKeys.length === 1 && unsavedKeys[0] === key}
          onKeep={() => setClosing(false)} onSave={saveAndClose} onDiscard={onClose} saving={save?.state === 'saving'} />}
        {!closing && !route && <Briefing bundle={bundle} mission={mission} onChoose={(r) => chooseRoute(r)} history={history} onHistory={() => { setRouteId(mission.routes[0].id); chooseRoute(mission.routes[0]); setView('history'); }} />}
        {!closing && route && <>
          <StatusLine availResult={avail[key]} availability={availability} save={save} onSave={() => doSave()} onRetryAvail={() => checkAvailability(identity, key)} open={open}
            support={<Support route={route} work={work} setWork={setWork} />} />
          {save.loadError && <div className="px-alert" role="alert"><AlertTriangle size={16} aria-hidden="true" />
            <p>{save.loadError.message ? save.loadError.message : `Your saved work couldn’t be loaded. ${describeFailure(save.loadError)}`} Saving is paused so nothing is overwritten. <button type="button" className="px-link" onClick={() => chooseRoute(route)}>Try loading again</button></p></div>}
          {save.state === 'conflict' && <div className="px-alert" role="alert"><AlertTriangle size={16} aria-hidden="true" />
            <div><p>Your account has a different saved version of this task{save.currentDraft ? ` (saved ${formatTime(save.currentDraft.updatedAt)})` : ''}. Nothing has been overwritten.</p>
              <div className="px-row">{save.currentDraft && restorable(registry, identity, save.currentDraft) && <button type="button" className="px-ghost" onClick={() => resolveConflict(true)}>Load the account version</button>}
                <button type="button" className="px-ghost" disabled={!open} onClick={() => resolveConflict(false)}>Keep this screen’s work and save it</button></div></div></div>}
          {reviseFrom && view !== 'history' && <details className="px-note px-revising"><summary><strong>Revising attempt {reviseFrom.attemptNumber ?? ''}</strong>{reviseFrom.coachNote ? ' · your coach’s note' : ''}</summary>
            {reviseFrom.coachNote && <p>“{reviseFrom.coachNote}”</p>}<p>Sending creates a new attempt linked to the returned one; the returned attempt stays as it was.</p></details>}
          {view === 'work' && work && <FocusWork bundle={bundle} mission={mission} route={route} design={design} actions={actions} at={at} go={go} headingRef={actionHeading}
            work={work} setWork={setWork} open={open} partView={partView} onPartView={onPartView} onReview={() => { moved.current = true; setView('review'); }} />}
          {view === 'review' && work && <ReviewView route={route} routeLabel={routeLabel} identity={identity} registry={registry} work={work} setWork={setWork} open={open} sendable={sendable} availability={availability} headingRef={actionHeading}
            openAttempt={openAttempt} historyState={history.state} send={send} onSend={sendForReview} onJump={(partId) => { setView('work'); go(actions.findIndex((a) => a.partId === partId)); }} />}
          {view === 'history' && <HistoryView bundle={bundle} mission={mission} history={history} onMore={() => loadHistory(history.nextCursor)} onRetry={() => loadHistory()} onRevise={revise} openAttempt={openAttempt} />}
        </>}
      </div>
    </section>
  </div>;
}

/** Route and scenario named together, so cases with different authored numbers never blur together. */
function scenarioLabel(bundle, mission, route, design) {
  if (design?.routeNote) return design.routeNote;
  const cases = routeDatasets(bundle, mission, route).map((d) => d.id.replace(/-\d+$/, '').replace(/-/g, ' ')).join(' + ');
  return `${route.name}${cases ? ` · ${cases}` : ''}`;
}

function ClosePanel({ names, otherTask, canSave, onKeep, onSave, onDiscard, saving }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return <div className="px-close" role="alertdialog" aria-labelledby="px-close-h" aria-describedby="px-close-p">
    <h3 id="px-close-h" ref={ref} tabIndex={-1}>Close this mission?</h3>
    <p id="px-close-p">{names.length > 1 || otherTask ? 'Changes in these tasks aren’t saved to your account yet:' : 'Your latest changes aren’t saved to your account yet.'} If you close now, they will be lost. Work already saved stays saved.</p>
    {(names.length > 1 || otherTask) && <ul className="px-close-list">{names.map((n, i) => <li key={i}>{n}</li>)}</ul>}
    {!canSave && <p className="px-fine">To keep them, choose Keep working, open each task and save it (or wait for “Saved”).</p>}
    <div className="px-row">
      <button type="button" className="mx-primary" onClick={onKeep}>Keep working</button>
      {canSave && <button type="button" className="px-ghost" disabled={saving} onClick={onSave}>{saving ? 'Saving…' : 'Save and close'}</button>}
      <button type="button" className="px-ghost" onClick={onDiscard}>Close without saving</button>
    </div>
  </div>;
}

function Briefing({ bundle, mission, onChoose, history, onHistory }) {
  const designs = mission.routes.map((r) => learningDesign(bundle, mission, r));
  const d = designs.find(Boolean);
  const ngss = standardsAcross(designs);
  return <>
    <p className="mx-question">{d?.situation || mission.drivingQuestion}</p>
    <dl className="px-brief">
      <div><dt>Your role</dt><dd>{d?.role || mission.role}</dd></div>
      <div><dt>Your decision</dt><dd>{d?.decision || getMissionDecision(mission)}</dd></div>
      {d?.objective && <div><dt>Goal</dt><dd>{d.objective}</dd></div>}
    </dl>
    <h3>Choose a route</h3>
    <div className="mx-routes">{mission.routes.map((r, i) => <button type="button" key={r.id} className="mx-route" onClick={() => onChoose(r)}>
      <strong>{r.name}</strong>
      <span className="px-route-tags"><span>Challenge {r.challengeLevel} of 5</span><span>{gradeLabel(r, designs[i])}</span><span>{r.planningMinutes?.join('–')} min</span></span>
      {designs[i]?.routeNote && <span>{designs[i].routeNote}</span>}
    </button>)}</div>
    <p className="px-fine">Grade ranges are suggestions, not limits. You choose; you can switch help style inside any route.</p>
    <details className="px-optional"><summary>The full story</summary>
      {mission.storyOpening && <p className="px-story">{mission.storyOpening}</p>}
      <p>{mission.drivingQuestion}</p><p>{mission.scenario}</p>
    </details>
    <details className="px-optional"><summary><BookOpen size={15} aria-hidden="true" />Evidence and sources</summary>
      {(mission.evidenceRefs || []).map((id) => bundle.datasets.find((x) => x.id === id)).filter(Boolean).map((x) => <DatasetView key={x.id} dataset={x} />)}
    </details>
    <details className="px-optional mx-limits"><summary>What this model leaves out</summary><ul>{mission.limitations.map((l) => <li key={l}>{l}</li>)}</ul></details>
    {ngss.length > 0 && <details className="px-optional"><summary>Science standards (NGSS)</summary>
      <ul>{ngss.map((n) => <li key={n.code}><a href={n.url} target="_blank" rel="noreferrer">{n.code}</a>{n.scope ? ` · ${n.scope}` : ''}</li>)}</ul></details>}
    <button type="button" className="px-ghost" onClick={onHistory}><History size={15} aria-hidden="true" />My attempts{history.state === 'loaded' && history.items.length ? ` (${history.items.length})` : ''}</button>
  </>;
}

/** One compact line: whether the mission is open, the save state, and the help style. Failures keep their actions. */
function StatusLine({ availResult, availability, save, onSave, onRetryAvail, open, support }) {
  let avail;
  if (!availResult) avail = <span role="status">Checking…</span>;
  else if (availResult.state !== 'loaded') avail = <span>{describeFailure(availResult)} You can still read everything. <button type="button" className="px-link" onClick={onRetryAvail}>Check again</button></span>;
  else if (!open) avail = <span>{availability.reason || AVAIL_TEXT[availability.status] || AVAIL_TEXT.unknown} You can still read everything. <button type="button" className="px-link" onClick={onRetryAvail}>Check again</button></span>;
  else avail = <span>{availability.status === 'open' ? 'Open' : `Open in this preview (${availability.status})`}</span>;
  const saveText = { 'not-saved': 'Not saved yet', saving: 'Saving…', saved: `Saved${save.updatedAt ? ` · ${formatTime(save.updatedAt)}` : ''}`, error: 'Not saved', conflict: 'Not saved · two versions' }[save.state] || 'Not saved yet';
  return <div className={`px-status is-compact${open ? '' : ' is-closed'}`}>
    <p className="px-avail">{avail}</p>
    <p className={`px-save is-${save.state}`} role="status">{save.state === 'saved' ? <Cloud size={14} aria-hidden="true" /> : <CloudOff size={14} aria-hidden="true" />}{save.loading ? 'Loading saved work…' : saveText}
      {save.state === 'error' && <> — {describeFailure(save.failure)}</>}
      {(save.state === 'not-saved' || save.state === 'error') && open && !save.loadError && <button type="button" className="px-link" onClick={onSave}>Save now</button>}</p>
    {support}
  </div>;
}

function Support({ route, work, setWork }) {
  if (!work || route.supportModes.length < 2) return null;
  return <fieldset className="px-support is-compact"><legend>Help</legend>
    {route.supportModes.map((m) => <label key={m}><input type="radio" name="px-support" checked={work.supportMode === m} onChange={() => setWork((w) => ({ ...w, supportMode: m }))} />
      {m === 'guided' ? 'Guided' : 'Independent'}</label>)}
    <details className="px-optional px-inline"><summary>What changes?</summary><p>{getSupportDescription(work.supportMode)} Either help style is an equal way to do this task.</p></details>
  </fieldset>;
}

const ACTION_LABEL = { practice: 'Try it', part: 'Your notebook', read: 'Read' };

/** The work view: exactly one action (a practice check or one notebook part) and its response, then Back / Next. */
function FocusWork({ bundle, mission, route, design, actions, at, go, headingRef, work, setWork, open, partView, onPartView, onReview }) {
  const a = actions[at];
  const step = route.steps[a.stepIndex];
  const copy = actionCopy(a, step, design);
  const inStep = actions.filter((x) => x.stepId === a.stepId);
  const guided = work.supportMode === 'guided';
  const lab = mission.optionalLab && !mission.optionalLab.enabledInAssessedFlow;
  const rule = a.partId ? route.requiredParts.find((r) => r.partId === a.partId) : null;
  const shared = a.partId ? stepsUsingPart(actions, a.partId) : [];
  const last = at === actions.length - 1;
  return <>
    <p className="px-progress">Step {a.stepIndex + 1} of {route.steps.length}{inStep.length > 1 ? ` · part ${inStep.indexOf(a) + 1} of ${inStep.length}` : ''}</p>
    <div className={`px-action-card is-${a.type}`}>
      <span className="mx-eyebrow">{ACTION_LABEL[a.type]}</span>
      <h3 ref={headingRef} tabIndex={-1} className="px-action-title">{a.type === 'part' ? `${copy.title}: ${partTitle(a.partId).toLowerCase()}` : copy.title}</h3>
      {copy.action && <p className="px-action">{copy.action}</p>}
      {a.type === 'part' && !copy.action && <p className="px-action">Add what this step found to your notebook.</p>}
      {lab && /\blab\b/i.test(step.prompt) && <p className="px-note">The lab link is hidden in this pilot. Use the equivalent plan table instead.</p>}

      {a.type === 'practice' && step.kind === 'number' && <NumberPractice key={step.id} step={step} value={work.answers[step.id]?.rawText ?? ''} onChange={(rawText) => setWork((w) => withAnswer(w, step.id, { rawText }))} />}
      {a.type === 'practice' && step.kind === 'choose' && <ChoicePractice key={step.id} step={step} value={work.answers[step.id]?.selectedId ?? ''} onChange={(selectedId) => setWork((w) => withAnswer(w, step.id, { selectedId }))} />}

      {a.type === 'part' && <>
        {shared.length > 1 && <p className="px-fine">One shared notebook part for steps {shared.join(', ')}. Fill in what you can now; you can finish it at any of those steps.</p>}
        {!open && <p className="px-fine">Notebook editing is paused until the mission service confirms this mission is open.</p>}
        <NotebookPart key={a.partId} route={route} partId={a.partId} work={work} setWork={setWork} disabled={!open} guided={guided} focus view={partView(a.partId)} onView={onPartView(a.partId)} />
      </>}

      <div className="px-optionals">
        {a.type === 'practice' && route.workedExample?.practiceStepId === step.id && <WorkedExample ex={route.workedExample} />}
        {a.type === 'practice' && (step.hints?.length > 0 || step.solution) && <details className="px-optional"><summary><Lightbulb size={15} aria-hidden="true" />Hints</summary><Help key={`h-${step.id}`} step={step} /></details>}
        {copy.reference && <details className="px-optional"><summary>Reference: what this means</summary><p>{copy.reference}</p></details>}
        {rule && <details className="px-optional"><summary>What your coach reviews</summary><p>{rule.evidenceCriterion}</p></details>}
        {copy.action !== step.prompt && <details className="px-optional"><summary>Full task</summary><p>{step.prompt}</p></details>}
        <details className="px-optional"><summary><BookOpen size={15} aria-hidden="true" />Evidence for this task</summary>
          {routeDatasets(bundle, mission, route).map((d) => <DatasetView key={d.id} dataset={d} />)}
          {lab && <p className="px-note">The station’s Hex-Grid lab isn’t part of this assessed task yet. Use the plan cards and your table.</p>}
        </details>
      </div>
    </div>
    <nav className="mx-step-nav" aria-label="Move between actions">
      <button type="button" disabled={at === 0} onClick={() => go(at - 1)}><ChevronLeft size={16} aria-hidden="true" />Back</button>
      {last ? <button type="button" className="mx-primary" onClick={onReview}>Review your work<ClipboardList size={16} aria-hidden="true" /></button>
        : <button type="button" className="mx-primary" onClick={() => go(at + 1)}>Next<ChevronRight size={16} aria-hidden="true" /></button>}
    </nav>
    <details className="px-optional px-allsteps"><summary>All steps</summary>
      <ol className="mx-stepper" aria-label="Steps">{route.steps.map((s, i) => <li key={s.id}>
        <button type="button" aria-current={i === a.stepIndex ? 'step' : undefined} onClick={() => go(firstActionOf(actions, s.id))}>{i + 1}<span className="mx-sr"> {s.title}</span></button></li>)}</ol>
    </details>
  </>;
}

function WorkedExample({ ex }) {
  return <details className="px-worked px-optional"><summary>Worked example: {ex.title}</summary><ol>{ex.steps.map((s) => <li key={s}>{s}</li>)}</ol></details>;
}

function formatRule(step) {
  const f = step.answerFormat;
  if (f.roundingMultiple) return `to the nearest ${f.roundingMultiple}`;
  return f.decimalPlaces ? `to ${f.decimalPlaces} decimal place${f.decimalPlaces > 1 ? 's' : ''}` : 'as a whole number';
}
const unitWord = (u) => (u === 'dimensionless' ? 'no unit' : u);

function NumberPractice({ step, value, onChange }) {
  const [result, setResult] = useState(null);
  const id = `px-num-${step.id}`;
  const message = {
    correct: 'Correct for this practice check.',
    close: `Close. Check your rounding: give the answer ${formatRule(step)}.`,
    incorrect: 'Not yet. Check the inputs, the operation and the units.',
    invalid: step.unit === 'dimensionless' ? 'That isn’t a number this step can read. Use a decimal such as 0.5, or a percentage such as 50%.' : `That isn’t a number this step can read. Use digits, and you may add the unit (${step.unit}).`
  }[result];
  return <form className="mx-answer" onSubmit={(e) => { e.preventDefault(); setResult(checkNumber(step, value)); }}>
    <label htmlFor={id}>Your answer ({unitWord(step.unit)}, {formatRule(step)})</label>
    <div><input id={id} inputMode="decimal" autoComplete="off" maxLength={64} value={value} onChange={(e) => { onChange(e.target.value); setResult(null); }} aria-describedby={`${id}-fb`} />
      <button type="submit" className="mx-primary">Check</button></div>
    <p id={`${id}-fb`} className={`mx-feedback${result ? ` is-${result}` : ''}`} role="status">{message}{result ? ' Practice only: this doesn’t mark or send anything.' : ''}</p>
  </form>;
}

function ChoicePractice({ step, value, onChange }) {
  const [result, setResult] = useState(null);
  return <fieldset className="mx-choices"><legend className="mx-sr">{step.prompt}</legend>
    {step.choices.map((c) => <label key={c.id}><input type="radio" name={`px-${step.id}`} value={c.id} checked={value === c.id} onChange={() => { onChange(c.id); setResult(null); }} />{c.label}</label>)}
    <button type="button" className="mx-primary" disabled={!value} onClick={() => setResult(value === step.answer ? 'correct' : 'incorrect')}>Check</button>
    <p className={`mx-feedback${result ? ` is-${result}` : ''}`} role="status">{result === 'correct' ? 'That matches the reasoning in this task. Practice only.' : result ? 'Not yet. Think about how each band contributes. Practice only.' : ''}</p>
  </fieldset>;
}

function Help({ step }) {
  const [hints, setHints] = useState(0);
  const [solution, setSolution] = useState(false);
  return <>
    <div className="mx-help">
      {step.hints?.length > 0 && hints < step.hints.length && <button type="button" onClick={() => setHints(hints + 1)}><Lightbulb size={15} aria-hidden="true" />{hints ? 'Another hint' : 'Show a hint'}</button>}
      {step.solution && !solution && <button type="button" onClick={() => setSolution(true)}><Eye size={15} aria-hidden="true" />Show worked solution</button>}
    </div>
    {hints > 0 && <ul className="mx-hints">{step.hints.slice(0, hints).map((h) => <li key={h}>{h}</li>)}</ul>}
    {solution && <div className="mx-solution"><p>{step.solution}</p>{step.kind === 'number' && <p><strong>Reference answer:</strong> {displayAnswer(step)}</p>}</div>}
  </>;
}

function ReviewView({ route, routeLabel, identity, registry, work, setWork, open, sendable, availability, openAttempt, historyState, send, onSend, onJump, headingRef }) {
  const statuses = route.requiredParts.map((r) => ({ rule: r, ...partStatus(route, r.partId, work.parts[r.partId]) }));
  const local = checkSubmission(registry, identity, submissionBody(route, identity, work));
  const reflectionOk = codePoints(work.reflection.trim()) >= 20 && codePoints(work.reflection) <= 2000;
  const blockers = [];
  if (!open) blockers.push(availability ? (availability.reason || AVAIL_TEXT[availability.status] || AVAIL_TEXT.unknown) : 'The mission service hasn’t confirmed this mission is open.');
  if (availability && open && !sendable) blockers.push(availability.reason || 'Sending isn’t open for this mission right now.');
  if (historyState !== 'loaded') blockers.push(historyState === 'error' ? 'Your earlier attempts couldn’t be checked, so sending waits until they can.' : 'Checking your earlier attempts…');
  if (openAttempt) blockers.push(`Attempt ${openAttempt.attemptNumber ?? ''} is already waiting for your coach. You can send again after it is reviewed.`);
  if (statuses.some((s) => !s.complete)) blockers.push('Finish every notebook part.');
  if (!reflectionOk) blockers.push('Write a reflection of at least 20 characters.');
  if (!local.ok && !blockers.length) blockers.push(local.error.message);
  const sending = send.state === 'sending';
  const ready = statuses.filter((s) => s.complete).length;
  return <>
    <h3 ref={headingRef} tabIndex={-1} className="px-action-title">Review and send</h3>
    <p className="px-fine">{routeLabel}</p>
    <p className="px-progress">{ready} of {statuses.length} notebook parts ready</p>
    <ul className="px-checklist">{statuses.map((s) => <li key={s.rule.partId} className={s.complete ? 'is-done' : ''}>
      <span>{s.complete ? 'Ready' : 'Not finished'}</span> <strong>{partTitle(s.rule.partId)}</strong>
      {!s.complete && s.reason && <small> · {s.reason}</small>}
      <button type="button" className="px-link" onClick={() => onJump(s.rule.partId)}>Go to this part</button>
    </li>)}</ul>
    <div className="px-field">
      <label htmlFor="px-reflection">Reflection for your coach: what did you decide, and what would you check next?</label>
      <textarea id="px-reflection" rows={4} value={work.reflection} disabled={!open} onChange={(e) => setWork((w) => ({ ...w, reflection: e.target.value }))} />
      <Counter value={work.reflection} min={20} />
    </div>
    <details className="px-optional"><summary>See everything you’ll send</summary><EvidenceView evidence={evidenceFromWork(route, work)} route={route} /></details>
    {blockers.length > 0 && <div className="px-blockers" role="status"><p><strong>Not ready to send yet:</strong></p><ul>{blockers.map((b) => <li key={b}>{b}</li>)}</ul></div>}
    <p className="px-fine">Sending records your work for review. It doesn’t mark it correct or open new places.</p>
    <button type="button" className="mx-primary" disabled={blockers.length > 0 || sending} onClick={onSend}><Send size={15} aria-hidden="true" />{sending ? 'Sending…' : work.previousSubmissionId ? 'Send revised work for review' : 'Send for review'}</button>
    <SendResult send={send} />
  </>;
}

function SendResult({ send }) {
  if (send.state === 'sent') {
    const d = send.data;
    return <div className="mx-sub-status is-submitted" role="status"><strong>Sent to your coach{d.attemptNumber ? ` · attempt ${d.attemptNumber}` : ''}</strong>
      <p>The mission service recorded it{d.createdAt ? ` at ${formatTime(d.createdAt)}` : ''}. Your coach will review it; you’ll see their feedback in My attempts.</p></div>;
  }
  if (send.state === 'error') {
    const r = send.result;
    const open = r.state === 'error' && r.code === 'SUBMISSION_ALREADY_OPEN';
    return <div className="px-alert" role="alert"><AlertTriangle size={16} aria-hidden="true" />
      <p>{open ? 'You already have an attempt waiting for your coach, so this one wasn’t sent. It’s shown in My attempts.' : `Not sent. ${describeFailure(r)}`}{r.state === 'not-connected' || r.retryable ? ' Your work is still here; try again when the service is reachable.' : ''}</p></div>;
  }
  return null;
}

function HistoryView({ bundle, mission, history, onMore, onRetry, onRevise, openAttempt }) {
  if (history.state === 'loading' || history.state === 'idle') return <p role="status">Loading your attempts…</p>;
  if (history.state === 'error') return <div className="px-alert" role="alert"><AlertTriangle size={16} aria-hidden="true" /><p>Your attempts couldn’t be loaded. {describeFailure(history.result)} <button type="button" className="px-link" onClick={onRetry}><RefreshCw size={14} aria-hidden="true" />Try again</button></p></div>;
  const more = history.nextCursor && <button type="button" className="px-ghost" disabled={history.state === 'more'} onClick={onMore}>{history.state === 'more' ? 'Loading…' : 'Show older attempts'}</button>;
  // A page can be empty while more follow; only a final empty page means there are none.
  if (!history.items.length) return history.nextCursor ? <><p>No attempts on this page yet. Older attempts may follow.</p>{more}</> : <p>No attempts sent for this mission yet.</p>;
  return <>
    <h3>My attempts</h3>
    <ul className="px-history">{history.items.map((s) => {
      const r = mission.routes.find((x) => x.id === s.routeId);
      const exact = !!r && sameIdentity(s, identityFor(bundle, mission, r));
      const superseded = history.items.some((x) => x.previousSubmissionId === s.submissionId);
      const canRevise = s.status === 'returned' && !s.legacyFormat && exact && !openAttempt && !superseded;
      return <li key={s.submissionId} className={`px-attempt is-${s.status}`}>
        <header><strong>Attempt {s.attemptNumber ?? '?'}</strong><span className={`px-pill is-${s.status}`}>{STATUS_TEXT[s.status] || s.status}</span></header>
        <p className="px-meta">{s.legacyFormat ? 'Earlier reflection-only format · ' : ''}Version {s.missionVersion} · {r?.name || s.routeId} · {s.supportMode === 'independent' ? 'Independent' : s.supportMode === 'guided' ? 'Guided' : 'help style not recorded'} help · sent {formatTime(s.createdAt)}{s.reviewedAt ? ` · reviewed ${formatTime(s.reviewedAt)}` : ''}</p>
        {s.previousCoachNote && <p className="px-fine">Earlier feedback: “{s.previousCoachNote}”</p>}
        {s.coachNote && <p className="mx-coach-note">Coach: “{s.coachNote}”</p>}
        {outcomeText(s) && <p>{outcomeText(s)}</p>}
        {!exact && !s.legacyFormat && <p className="px-fine">This attempt used a different version of the task. It stays read-only.</p>}
        <details><summary>What was sent</summary><p className="px-pre">{s.reflection}</p>{!s.legacyFormat && <EvidenceView evidence={s.evidence} route={r} />}</details>
        {canRevise && <button type="button" className="mx-primary" onClick={() => onRevise(s)}><PenLine size={15} aria-hidden="true" />Revise and resend</button>}
        {s.status === 'returned' && (openAttempt || superseded) && <p className="px-fine">{superseded ? 'You already sent a revision of this attempt.' : 'A newer attempt is waiting for review.'}</p>}
      </li>;
    })}</ul>
    {more}
  </>;
}

/** Shown instead of a mission when the signed-in learner's organization isn't confirmed: nothing is requested or kept. */
export function MissionSignInNotice({ mission, onClose }) {
  const ref = useRef(null), heading = useRef(null);
  const onKeyDown = useDialogFocus(ref, onClose, heading);
  useEffect(() => { heading.current?.focus(); }, []);
  return <div className="mx-mission-wrap" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="mx-mission px-sheet" role="dialog" aria-modal="true" aria-labelledby="px-signin-title" onKeyDown={onKeyDown} ref={ref}>
      <header className="mx-mission-top">
        <div><span className="mx-eyebrow">Mission</span><h2 id="px-signin-title" ref={heading} tabIndex={-1}>{mission.title}</h2></div>
        <button type="button" className="mx-icon" onClick={onClose} aria-label="Close mission"><X size={20} aria-hidden="true" /></button>
      </header>
      <div className="mx-mission-body"><p role="status">Missions open once you’re signed in with a school account we can confirm. Nothing from this mission has been loaded or saved.</p></div>
    </section>
  </div>;
}
