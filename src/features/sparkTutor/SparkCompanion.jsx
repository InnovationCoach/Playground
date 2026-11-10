import { useEffect, useRef, useState } from 'react';
import { Flame, X, Send, ArrowLeft, LifeBuoy, Loader2 } from 'lucide-react';
import {
  startSparkSession, sendSparkMessage, getSparkHistory, startSparkDetour, returnSparkToProject,
  setSparkMentorMode, submitSparkPractice, requestSparkCoachSupport
} from './sparkTutorApi.js';
import { MODES, QUICK_ACTIONS, classifySparkError, levelLabel, messagesFromTurns, suggestionIntent, topicLabel } from './sparkTutorModel.js';
import '../admin/admin.css';
import './sparkTutor.css';

let turnSeq = 0;
const nextTurnId = () => `turn-${Date.now().toString(36)}-${(turnSeq += 1)}`;

/**
 * "Ask Spark": the learner's floating entry point and drawer.
 *
 * Every reply, assistance level, detour and practice result shown here comes
 * from /api/spark-tutor. When the service is off (503 FEATURE_DISABLED) or not
 * deployed (404), the button stays visible but rests instead of failing.
 */
export function SparkCompanion({ learnerName, projectContext = null }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | starting | ready | busy | disabled | error
  const [notice, setNotice] = useState('');
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [detourOffer, setDetourOffer] = useState(null);
  const [practice, setPractice] = useState(null); // { task, answer, result, showHint }
  const [returnBrief, setReturnBrief] = useState(null);
  const [escalation, setEscalation] = useState(null); // { question, reason, state, message }
  const [draft, setDraft] = useState('');
  const logRef = useRef(null);
  const sessionId = session?.sessionId;
  const detour = session?.activeDetour || null;

  useEffect(() => { logRef.current?.scrollTo?.({ top: logRef.current.scrollHeight }); }, [messages, practice, escalation]);

  const add = (...items) => setMessages((m) => [...m, ...items.map((it) => ({ id: nextTurnId(), ...it }))]);
  const patchSession = (patch) => setSession((s) => ({ ...s, ...patch }));

  function fail(err) {
    const { state, message } = classifySparkError(err, { hasSession: Boolean(session) });
    setStatus(state === 'disabled' ? 'disabled' : session ? 'ready' : 'error');
    setNotice(message);
  }

  async function start() {
    setStatus('starting');
    setNotice('');
    try {
      const res = await startSparkSession({ mode: 'pbl_mentor', projectContext });
      setSession(res.session);
      let earlier = [];
      if (res.isNew === false) {
        try { earlier = messagesFromTurns((await getSparkHistory(res.session.sessionId)).turns); } catch { /* history is optional */ }
      }
      setMessages([...earlier, res.initialMessage?.text && { id: nextTurnId(), role: 'spark', text: res.initialMessage.text }].filter(Boolean));
      setSuggestions(res.initialMessage?.suggestedActions || []);
      setStatus('ready');
    } catch (err) { fail(err); }
  }

  function openDrawer() {
    setOpen(true);
    if (status === 'idle' || status === 'error') start();
  }

  async function send(text) {
    const message = String(text || '').trim();
    if (!message || !sessionId || status === 'busy') return;
    setDraft('');
    setNotice('');
    add({ role: 'learner', text: message });
    setStatus('busy');
    try {
      const res = await sendSparkMessage(sessionId, { message, clientTurnId: nextTurnId() });
      add({ role: 'spark', text: res.reply, level: res.assistanceLevel });
      patchSession({ mode: res.mode, assistanceLevel: res.assistanceLevel, activeDetour: res.activeDetour ?? detour });
      setSuggestions(res.suggestedActions || []);
      setDetourOffer(res.detourOffer || null);
      if (res.recommendCoachEscalation) setEscalation({ question: message, reason: 'FRUSTRATION_DETECTED', state: 'confirm' });
      if (res.safeguardingFlagged) setNotice('If something is worrying you, please talk to your coach or another adult you trust.');
      setStatus('ready');
    } catch (err) { fail(err); }
  }

  async function enterDetour(detourId) {
    if (!sessionId) return;
    setStatus('busy');
    setNotice('');
    try {
      const res = await startSparkDetour(sessionId, detourId);
      patchSession({ mode: res.mode, activeDetour: res.activeDetour });
      setDetourOffer(null);
      setReturnBrief(null);
      setPractice(res.initialPracticeTask ? { task: res.initialPracticeTask, answer: '', result: null, showHint: false } : null);
      setStatus('ready');
    } catch (err) { fail(err); }
  }

  async function backToProject() {
    if (!sessionId) return;
    setStatus('busy');
    try {
      const res = await returnSparkToProject(sessionId);
      patchSession({ mode: res.mode, activeDetour: null });
      setPractice(null);
      setDetourOffer(null);
      setReturnBrief(null);
      if (res.brief?.prompt) add({ role: 'spark', text: res.brief.prompt });
      setStatus('ready');
    } catch (err) { fail(err); }
  }

  async function chooseMode(mode) {
    if (!sessionId || mode === session.mode || status === 'busy') return;
    if (mode === 'academic_tutor') return enterDetour();
    if (detour) return backToProject();
    setStatus('busy');
    try {
      const res = await setSparkMentorMode(sessionId);
      patchSession({ mode: res.mode });
      setStatus('ready');
    } catch (err) { fail(err); }
  }

  async function checkPractice(e) {
    e.preventDefault();
    if (!practice?.answer.trim() || !sessionId) return;
    setStatus('busy');
    try {
      const result = await submitSparkPractice(sessionId, { taskId: practice.task.taskId, answer: practice.answer.trim() });
      setPractice((p) => ({ ...p, result }));
      if (result.readyToReturn) setReturnBrief({ prompt: result.returnPrompt });
      setStatus('ready');
    } catch (err) { fail(err); }
  }

  function askCoach(reason = 'LEARNER_INITIATED') {
    const lastLearner = [...messages].reverse().find((m) => m.role === 'learner');
    setEscalation({ question: lastLearner?.text || '', reason, state: 'confirm' });
  }

  async function sendToCoach() {
    if (!sessionId || !escalation) return;
    setEscalation((x) => ({ ...x, state: 'sending' }));
    try {
      const res = await requestSparkCoachSupport(sessionId, { question: escalation.question, reason: escalation.reason });
      setEscalation((x) => ({ ...x, state: 'sent', message: res.message || 'Your coach has been notified.' }));
    } catch (err) {
      setEscalation((x) => ({ ...x, state: 'confirm', message: classifySparkError(err).message }));
    }
  }

  function onSuggestion(text) {
    const intent = suggestionIntent(text);
    if (intent === 'coach') return askCoach();
    if (intent === 'detour' && detourOffer) return enterDetour(detourOffer.detourId);
    return send(text);
  }

  const busy = status === 'busy' || status === 'starting';
  const disabled = status === 'disabled';
  const canTalk = Boolean(sessionId) && !disabled;
  const projectName = detour?.originatingProjectContext?.projectId || projectContext?.projectId;
  const level = levelLabel(session?.assistanceLevel);

  return (
    <div className="gh-app sk-root">
      {!open && (
        <button type="button" className={`sk-launcher${detour ? ' sk-launcher-detour' : ''}`} onClick={openDrawer}
          aria-label={disabled ? 'Ask Spark (resting)' : 'Ask Spark'} title={disabled ? notice : undefined} data-state={disabled ? 'disabled' : detour ? 'detour' : status}>
          <Flame size={18} aria-hidden="true" /> Ask Spark
          {detour && <span className="sk-badge">{topicLabel(detour.topic)} detour</span>}
        </button>
      )}

      {open && (
        <section className="sk-drawer" role="dialog" aria-modal="false" aria-label="Ask Spark">
          <header className="sk-head">
            <div><Flame size={18} aria-hidden="true" /><strong>Spark</strong><span className="sk-sub">Learning companion</span></div>
            <button type="button" className="sk-icon" aria-label="Close Spark" onClick={() => setOpen(false)}><X size={18} /></button>
          </header>

          {disabled ? (
            <div className="sk-rest" role="status"><Flame size={28} aria-hidden="true" /><p>{notice}</p></div>
          ) : (
            <>
              <div className="sk-modes" role="radiogroup" aria-label="How Spark helps">
                {MODES.map(([id, label, hint]) => (
                  <button key={id} type="button" role="radio" aria-checked={session?.mode === id} title={hint}
                    disabled={!canTalk || busy} onClick={() => chooseMode(id)}>{label}</button>
                ))}
              </div>

              {detour && (
                <div className="sk-detour" role="status">
                  <p><strong>Concept detour:</strong> Working on <em>{topicLabel(detour.topic)}</em>{projectName ? <> to help with <em>{projectName}</em></> : null}.</p>
                  <button type="button" className="gh-btn gh-btn-ghost" disabled={busy} onClick={backToProject}><ArrowLeft size={14} /> Return to project</button>
                </div>
              )}

              {level && <p className="sk-level" aria-live="polite">Right now: <strong>{level}</strong></p>}

              <div className="sk-log" ref={logRef} aria-live="polite">
                {status === 'starting' && <p className="sk-muted">Waking Spark up…</p>}
                {messages.map((m) => (
                  <div key={m.id} className={`sk-msg sk-${m.role}`}>
                    <p>{m.text}</p>
                  </div>
                ))}

                {detourOffer && !detour && (
                  <div className="sk-card">
                    <strong>Short detour: {topicLabel(detourOffer.topic)}</strong>
                    {detourOffer.reason && <p className="sk-muted">{detourOffer.reason}</p>}
                    <div className="sk-row">
                      <button type="button" className="gh-btn gh-btn-primary" disabled={busy} onClick={() => enterDetour(detourOffer.detourId)}>Let's do the detour</button>
                      <button type="button" className="gh-btn gh-btn-ghost" onClick={() => setDetourOffer(null)}>Not now</button>
                    </div>
                  </div>
                )}

                {practice && (
                  <form className="sk-card" onSubmit={checkPractice} aria-label="Practice question">
                    <span className="sk-eyebrow">PRACTICE</span>
                    <p>{practice.task.question}</p>
                    {practice.task.promptHint && (practice.showHint
                      ? <p className="sk-muted">Hint: {practice.task.promptHint}</p>
                      : <button type="button" className="sk-link" onClick={() => setPractice((p) => ({ ...p, showHint: true }))}>Show a hint</button>)}
                    <label className="sk-answer">
                      <span className="sk-sr">Your answer</span>
                      <input value={practice.answer} placeholder="Your answer" disabled={busy || practice.result?.correct}
                        onChange={(e) => setPractice((p) => ({ ...p, answer: e.target.value, result: p.result?.correct ? p.result : null }))} />
                      {practice.task.unit && <span>{practice.task.unit}</span>}
                    </label>
                    {!practice.result?.correct && <button type="submit" className="gh-btn gh-btn-primary" disabled={busy || !practice.answer.trim()}>Check my answer</button>}
                    {practice.result && (
                      <div className={`sk-result ${practice.result.correct ? 'sk-ok' : 'sk-retry'}`} role="status">
                        <p>{practice.result.feedback}</p>
                        {practice.result.evidenceCandidate && <small>Saved as practice for your coach to see. It does not change your grades or XP.</small>}
                        {practice.result.correct && !practice.result.readyToReturn && (practice.result.nextTask
                          ? <button type="button" className="gh-btn gh-btn-primary" onClick={() => setPractice({ task: practice.result.nextTask, answer: '', result: null, showHint: false })}>Next question</button>
                          : practice.result.nextTaskId && <small>Spark has another practice question ready. Ask Spark for the next one.</small>)}
                      </div>
                    )}
                  </form>
                )}

                {returnBrief?.prompt && (
                  <div className="sk-card sk-return">
                    <p>{returnBrief.prompt}</p>
                    <button type="button" className="gh-btn gh-btn-primary" disabled={busy} onClick={backToProject}>Return to project</button>
                  </div>
                )}

                {escalation && (
                  <div className="sk-card sk-coach" role={escalation.state === 'sent' ? 'status' : undefined}>
                    {escalation.state === 'sent' ? <p>{escalation.message}</p> : <>
                      <strong>Would you like your coach to take a look at what you're working on?</strong>
                      <label><span className="sk-muted">This is what your coach will see:</span>
                        <textarea rows={3} value={escalation.question} maxLength={500}
                          onChange={(e) => setEscalation((x) => ({ ...x, question: e.target.value }))} /></label>
                      {escalation.message && <p className="sk-warn" role="alert">{escalation.message}</p>}
                      <div className="sk-row">
                        <button type="button" className="gh-btn gh-btn-primary" disabled={escalation.state === 'sending'} onClick={sendToCoach}>Send to my coach</button>
                        <button type="button" className="gh-btn gh-btn-ghost" onClick={() => setEscalation(null)}>Not now</button>
                      </div>
                    </>}
                    {escalation.state === 'sent' && <button type="button" className="sk-link" onClick={() => setEscalation(null)}>Close</button>}
                  </div>
                )}
                {status === 'busy' && <p className="sk-muted sk-thinking"><Loader2 size={14} className="sk-spin" aria-hidden="true" /> Thinking…</p>}
              </div>

              {notice && <p className="sk-warn" role="alert">{notice}{status === 'error' && <> <button type="button" className="sk-link" onClick={start}>Try again</button></>}</p>}

              <div className="sk-chips" aria-label="Quick actions">
                {(suggestions.length ? suggestions : []).map((s) => (
                  <button key={`s-${s}`} type="button" disabled={!canTalk || busy} onClick={() => onSuggestion(s)}>{s}</button>
                ))}
                {QUICK_ACTIONS.map(([label, text]) => (
                  <button key={label} type="button" disabled={!canTalk || busy} onClick={() => send(text)}>{label}</button>
                ))}
                <button type="button" className="sk-chip-coach" disabled={!canTalk} onClick={() => askCoach()}><LifeBuoy size={13} aria-hidden="true" /> Ask my coach</button>
              </div>

              <form className="sk-input" onSubmit={(e) => { e.preventDefault(); send(draft); }}>
                <label className="sk-sr" htmlFor="sk-draft">Message Spark</label>
                <textarea id="sk-draft" rows={2} value={draft} maxLength={1200} disabled={!canTalk}
                  placeholder={learnerName ? `What are you working on, ${learnerName}?` : 'What are you working on?'}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(draft); } }} />
                <button type="submit" className="sk-icon sk-send" aria-label="Send" disabled={!canTalk || busy || !draft.trim()}><Send size={16} /></button>
              </form>
              <p className="sk-foot">Spark gives hints and steps, not answers to assessed work. Your coach can see how Spark is helping you.</p>
            </>
          )}
        </section>
      )}
    </div>
  );
}
