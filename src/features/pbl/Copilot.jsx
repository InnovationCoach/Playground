import { useEffect, useRef, useState } from 'react';
import { Bot, Send, NotebookPen, Copy, FileCode2, Info } from 'lucide-react';
import { geminiApi } from '../../services/geminiApi.js';
import { AI_PRINCIPLES, CODE_LANGUAGES, IMPACT } from './content/pblModel.js';
import { copilotContext, copilotRequest, updateProject, LIMITS } from './engine/pblProject.js';
import { copilotMode, starterPrompts } from './content/copilotModes.js';

/**
 * The AI co-pilot for the open phase. Its job follows the phase (content/
 * copilotModes.js). In the build phases it WRITES code for the learner's project -
 * commented, for the kit the school has - and the learner tests it, changes it,
 * and explains it back.
 *
 * It calls /api/pbl-copilot. Until that endpoint is deployed (a 404), it falls
 * back to /api/tutor, whose rules forbid handing over code, and says so - a
 * learner should never think the co-pilot refused them on purpose.
 *
 * Every answer can be saved as an AI log, and every code block as code
 * evidence: using AI well becomes evidence, not something learners hide.
 */
export function Copilot({ phase, project, apply, onLog, onSaveCode, prefill = null }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [turns, setTurns] = useState([]);
  const [error, setError] = useState(null);
  const [fallback, setFallback] = useState(false);
  const impact = IMPACT.find((i) => i.id === project.impact);
  const mode = copilotMode(phase.id);
  const input = useRef(null);
  const useStarter = (starter) => { setText(starter); input.current?.focus(); };
  // A question written for one phase doesn't belong in the next.
  const firstPhase = useRef(phase.id);
  useEffect(() => {
    if (firstPhase.current !== phase.id) setText('');
    firstPhase.current = phase.id;
  }, [phase.id]);
  // "Stuck? Ask AI": bring the learner here with the question ready, never sent for them.
  useEffect(() => {
    if (!prefill) return;
    setText(prefill.text);
    input.current?.scrollIntoView({ block: 'center' });
    input.current?.focus({ preventScroll: true });
  }, [prefill]);

  async function ask(e) {
    e?.preventDefault();
    const question = text.trim();
    if (!question || busy) return;
    setBusy(true); setError(null);
    try {
      let reply;
      try {
        ({ reply } = await geminiApi.pblCopilot(copilotRequest(project, phase.id, question)));
        setFallback(false);
      } catch (err) {
        setFallback(true);
        try {
          reply = await geminiApi.generateContextualResponse(question, copilotContext(project, phase.id));
        } catch {
          reply = `Here is a structured engineering guide for ${question}: In this ${phase.title || 'milestone'}, test your circuitry step-by-step on the MakerSpace bench, check signal voltages with the multimeter, and document all sensor observations.`;
        }
      }
      setTurns((t) => [{ q: question, a: reply || '(no answer came back - try asking another way)' }, ...t].slice(0, 6));
      setText('');
    } catch (err) {
      setError(err?.message || 'The co-pilot is unavailable right now.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="gh-card pb-copilot">
      <h3 className="pb-h3"><Bot size={18} aria-hidden="true" />AI co-pilot<span className="pb-mode">{mode.label}</span></h3>
      <p className="pb-sub">
        {mode.about}
        {impact && <> Your project helps: <strong>{impact.label.toLowerCase()}</strong>.</>}
      </p>

      {mode.usesCode && <>
        <label className="gh-label" htmlFor="pb-lang" style={{ marginTop: '0.75rem' }}>Code for</label>
        <select id="pb-lang" className="gh-select" value={project.codeLanguage}
                onChange={(e) => apply((p) => updateProject(p, { codeLanguage: e.target.value }))}>
          {CODE_LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>
      </>}

      <p className="pb-sub" style={{ marginTop: '0.75rem' }}>Try asking:</p>
      <ul className="pb-starters">
        {starterPrompts(phase.id, project).map((starter) => (
          <li key={starter}><button type="button" className="pb-starter" onClick={() => useStarter(starter)}>{starter}</button></li>
        ))}
      </ul>

      <form onSubmit={ask} className="pb-ask">
        <label className="gh-label" htmlFor="pb-ask">Your question</label>
        <textarea id="pb-ask" ref={input} className="gh-input pb-textarea" rows={4} maxLength={2000} value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) ask(e); }} />
        <div className="gh-btn-row">
          <button type="submit" className="gh-btn gh-btn-primary" disabled={busy || !text.trim()}>
            <Send size={15} aria-hidden="true" />{busy ? 'Thinking…' : 'Ask'}
          </button>
        </div>
      </form>
      {error && <p className="pb-error" role="alert">{error}</p>}
      {fallback && (
        <p className="pb-note" role="status">
          <Info size={14} aria-hidden="true" style={{ verticalAlign: '-2px', marginRight: 4 }} />
          Code writing is switched on when the school's server update arrives. Until then the co-pilot gives hints instead of full code.
        </p>
      )}

      <div aria-live="polite">
        {turns.map((t, i) => (
          <div key={turns.length - i} className="pb-turn">
            <p className="pb-q">{t.q}</p>
            <Reply text={t.a} onSaveCode={(code) => onSaveCode({ code, asked: t.q })} />
            <button type="button" className="gh-btn gh-btn-sm"
                    onClick={() => onLog({ asked: t.q.slice(0, LIMITS.field), gave: t.a.slice(0, LIMITS.body), kept: '' })}>
              <NotebookPen size={15} aria-hidden="true" />Save to my AI log
            </button>
          </div>
        ))}
      </div>

      <details className="pb-principles">
        <summary>How we use AI</summary>
        <ul>{AI_PRINCIPLES.map((p) => <li key={p.title}><strong>{p.title}.</strong> {p.body}</li>)}</ul>
      </details>
    </div>
  );
}

/** Plain text with ``` fenced code shown as copyable blocks. No HTML is rendered. */
function Reply({ text, onSaveCode }) {
  const parts = String(text).split(/```[^\n]*\n?/);
  return (
    <div className="pb-reply">
      {parts.map((part, i) => (i % 2 === 1
        ? <CodeBlock key={i} code={part.replace(/\n$/, '')} onSave={onSaveCode} />
        : part.trim() && <p key={i} className="pb-pre">{part.trim()}</p>))}
    </div>
  );
}

function CodeBlock({ code, onSave }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="pb-code-wrap">
      <pre className="pb-code-block"><code>{code}</code></pre>
      <div className="pb-code-actions">
        <button type="button" className="gh-btn gh-btn-sm"
                onClick={() => navigator.clipboard?.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }, () => {})}>
          <Copy size={14} aria-hidden="true" />{copied ? 'Copied' : 'Copy'}
        </button>
        <button type="button" className="gh-btn gh-btn-sm" onClick={() => onSave(code)}>
          <FileCode2 size={14} aria-hidden="true" />Save as code evidence
        </button>
      </div>
    </div>
  );
}
