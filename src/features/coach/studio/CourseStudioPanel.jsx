import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Sparkles, Trash2, Plus, ChevronLeft, ChevronRight, AlertTriangle, RefreshCw, Check } from 'lucide-react';
import {
  LIMITS, STAGES, MILESTONE_LIMITS, listSources, createSource, archiveSource, generate, listDrafts, discardDraft, updateMilestones, CourseStudioError
} from '../../../services/courseStudioService.js';
import './courseStudio.css';

const TYPE_LABELS = {
  milestones: 'Milestones (8 stages)',
  slides: 'Slide deck',
  quiz: 'Interactive quiz',
  script: 'Narration script (text, for video later)'
};

const COHORT_LABELS = {
  primary: 'Primary (ages 6–11)',
  'lower-secondary': 'Lower Secondary (ages 12–14)',
  'higher-secondary': 'Higher Secondary (ages 15–18)'
};

const errorText = (err) => (err instanceof CourseStudioError ? err.message : 'Something went wrong. Try again.');

/**
 * Course Studio: the coach's source library, drafts of course material from it,
 * and review. Every draft is a draft until the coach publishes it; nothing here
 * reaches a learner. Uses the mock service until Gemini's routes land.
 */
export function CourseStudioPanel() {
  const [sources, setSources] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [picked, setPicked] = useState([]);
  const [type, setType] = useState('milestones');
  const [cohort, setCohort] = useState('lower-secondary');
  const [instructions, setInstructions] = useState('');
  const [status, setStatus] = useState({ kind: 'idle', message: '' });
  const [newTitle, setNewTitle] = useState('');
  const [newText, setNewText] = useState('');
  const [adding, setAdding] = useState(false);

  const refresh = useCallback(async () => {
    const [s, d] = await Promise.all([listSources(), listDrafts()]);
    setSources(s);
    setDrafts(d);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const activeDraft = drafts.find((d) => d.id === activeId) || drafts[0] || null;

  const togglePick = (id) => {
    setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };

  const onAddSource = async (e) => {
    e.preventDefault();
    setAdding(true);
    setStatus({ kind: 'working', message: 'Saving source…' });
    try {
      const created = await createSource({ title: newTitle, text: newText });
      setNewTitle('');
      setNewText('');
      setPicked((cur) => [...cur, created.id]);
      await refresh();
      setStatus({ kind: 'success', message: `Saved “${created.title}”.` });
    } catch (err) {
      setStatus({ kind: 'error', message: errorText(err) });
    } finally {
      setAdding(false);
    }
  };

  const onArchive = async (id) => {
    await archiveSource(id);
    setPicked((cur) => cur.filter((x) => x !== id));
    await refresh();
  };

  const onGenerate = async () => {
    setStatus({ kind: 'working', message: 'Drafting… this can take a little while.' });
    try {
      const result = await generate({ type, cohort, sourceIds: picked, instructions });
      setActiveId(result.draftId);
      await refresh();
      setStatus({ kind: 'success', message: 'Draft ready. Review it before anything is shared with learners.' });
    } catch (err) {
      setStatus({ kind: 'error', message: errorText(err) });
    }
  };

  const onSaveMilestones = async (id, milestones) => {
    await updateMilestones(id, milestones);
    await refresh();
  };

  const onDiscard = async (id) => {
    await discardDraft(id);
    if (activeId === id) setActiveId(null);
    await refresh();
  };

  const busy = status.kind === 'working';

  return (
    <section className="cs-panel cp-card" aria-labelledby="cs-title">
      <div className="cp-card-header">
        <h2 className="cp-card-title" id="cs-title"><Sparkles size={16} aria-hidden="true" /> Course material studio</h2>
        <span className="cp-badge-pill">Mock drafts</span>
      </div>
      <p className="cs-lede">
        Add your own source text, then draft milestones, slides, quizzes or a narration script. Drafts stay private until you publish.
      </p>

      <div className="cs-grid">
        <div className="cs-col">
          <h3 className="cs-h3"><BookOpen size={15} aria-hidden="true" /> Sources ({sources.length})</h3>
          {sources.length === 0 && <p className="cs-muted">No sources yet. Paste some text below to start.</p>}
          <ul className="cs-list">
            {sources.map((s) => (
              <li key={s.id} className="cs-source">
                <label>
                  <input type="checkbox" checked={picked.includes(s.id)} onChange={() => togglePick(s.id)} />
                  <span>{s.title}</span>
                </label>
                <button type="button" className="cs-icon-btn" aria-label={`Remove ${s.title}`} onClick={() => onArchive(s.id)}>
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>

          <form className="cs-form" onSubmit={onAddSource}>
            <label className="cs-field">
              <span>Source title</span>
              <input value={newTitle} maxLength={LIMITS.sourceTitleChars} onChange={(e) => setNewTitle(e.target.value)} required />
            </label>
            <label className="cs-field">
              <span>Source text (no learner names or personal details)</span>
              <textarea rows={5} value={newText} onChange={(e) => setNewText(e.target.value)} required />
            </label>
            <button type="submit" className="cs-btn" disabled={adding}>
              <Plus size={14} aria-hidden="true" /> {adding ? 'Saving…' : 'Add source'}
            </button>
          </form>
        </div>

        <div className="cs-col">
          <h3 className="cs-h3"><Sparkles size={15} aria-hidden="true" /> Make a draft</h3>
          <div className="cs-row">
            <label className="cs-field">
              <span>Type</span>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                {Object.entries(TYPE_LABELS).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
              </select>
            </label>
            <label className="cs-field">
              <span>Cohort</span>
              <select value={cohort} onChange={(e) => setCohort(e.target.value)}>
                {Object.entries(COHORT_LABELS).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
              </select>
            </label>
          </div>
          <label className="cs-field">
            <span>Instructions (optional, {LIMITS.instructionChars} characters max)</span>
            <textarea rows={2} maxLength={LIMITS.instructionChars} value={instructions} onChange={(e) => setInstructions(e.target.value)} />
          </label>
          <p className="cs-muted">Using {picked.length} source{picked.length === 1 ? '' : 's'}.</p>
          <button type="button" className="cs-btn cs-btn-primary" onClick={onGenerate} disabled={busy || picked.length === 0}>
            <Sparkles size={14} aria-hidden="true" /> {busy ? 'Drafting…' : 'Generate draft'}
          </button>

          <div role="status" aria-live="polite" className={`cs-status cs-status-${status.kind}`}>
            {status.kind === 'error' && <AlertTriangle size={14} aria-hidden="true" />}
            {status.kind === 'success' && <Check size={14} aria-hidden="true" />}
            {status.message}
            {status.kind === 'error' && (
              <button type="button" className="cs-link" onClick={onGenerate}><RefreshCw size={13} aria-hidden="true" /> Try again</button>
            )}
          </div>
        </div>
      </div>

      <div className="cs-drafts">
        <h3 className="cs-h3">Drafts ({drafts.length})</h3>
        {drafts.length === 0 && <p className="cs-muted">Nothing drafted yet.</p>}
        <div className="cs-draft-tabs" role="tablist" aria-label="Drafts">
          {drafts.map((d) => (
            <button
              key={d.id}
              type="button"
              role="tab"
              aria-selected={activeDraft?.id === d.id}
              className={`cs-draft-tab${activeDraft?.id === d.id ? ' is-active' : ''}`}
              onClick={() => setActiveId(d.id)}
            >
              {TYPE_LABELS[d.type].split(' (')[0]}
            </button>
          ))}
        </div>
        {activeDraft && (
          <DraftView draft={activeDraft} onDiscard={() => onDiscard(activeDraft.id)} onSaveMilestones={onSaveMilestones} />
        )}
      </div>
    </section>
  );
}

function DraftView({ draft, onDiscard, onSaveMilestones }) {
  return (
    <div className="cs-draft" role="tabpanel">
      <div className="cs-draft-head">
        <p className="cs-note">{draft.note}</p>
        <button type="button" className="cs-link" onClick={onDiscard}><Trash2 size={13} aria-hidden="true" /> Discard draft</button>
      </div>
      {draft.type === 'milestones' && <MilestoneEditor key={draft.id} draft={draft} onSave={onSaveMilestones} />}
      {draft.type === 'slides' && <SlideViewer output={draft.output} />}
      {draft.type === 'quiz' && <QuizPlayer output={draft.output} />}
      {draft.type === 'script' && <ScriptView output={draft.output} />}
    </div>
  );
}

function MilestoneEditor({ draft, onSave }) {
  const [form, setForm] = useState(() => draft.output.milestones.map((m) => ({ ...m, sessionsText: m.sessions.join('\n') })));
  const [saveState, setSaveState] = useState({ kind: 'idle', message: '' });

  const update = (index, patch) => {
    setForm((cur) => cur.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  };

  const save = async () => {
    setSaveState({ kind: 'working', message: 'Saving…' });
    const milestones = form.map(({ sessionsText, ...m }) => ({
      ...m,
      sessions: sessionsText.split('\n').map((s) => s.trim()).filter(Boolean)
    }));
    try {
      await onSave(draft.id, milestones);
      setSaveState({ kind: 'success', message: 'Saved. The draft is updated; nothing has been published.' });
    } catch (err) {
      setSaveState({ kind: 'error', message: errorText(err) });
    }
  };

  return (
    <div className="cs-editor">
      <ol className="cs-stages">
        {form.map((m, i) => {
          const stage = STAGES[i];
          const id = `cs-${draft.id}-${stage.id}`;
          return (
            <li key={stage.id} className="cs-stage">
              <strong>{stage.stageNumber}. {stage.label}</strong>
              <label className="cs-field" htmlFor={`${id}-title`}>
                <span>Title ({MILESTONE_LIMITS.title} characters)</span>
                <input id={`${id}-title`} value={m.title} maxLength={MILESTONE_LIMITS.title} onChange={(e) => update(i, { title: e.target.value })} />
              </label>
              <label className="cs-field" htmlFor={`${id}-goal`}>
                <span>Goal</span>
                <textarea id={`${id}-goal`} rows={2} maxLength={MILESTONE_LIMITS.goal} value={m.goal} onChange={(e) => update(i, { goal: e.target.value })} />
              </label>
              <label className="cs-field" htmlFor={`${id}-sessions`}>
                <span>Sessions (one per line, up to {MILESTONE_LIMITS.sessions})</span>
                <textarea id={`${id}-sessions`} rows={3} value={m.sessionsText} onChange={(e) => update(i, { sessionsText: e.target.value })} />
              </label>
              <label className="cs-field" htmlFor={`${id}-cue`}>
                <span>Coach cue</span>
                <textarea id={`${id}-cue`} rows={2} maxLength={MILESTONE_LIMITS.coachCue} value={m.coachCue} onChange={(e) => update(i, { coachCue: e.target.value })} />
              </label>
            </li>
          );
        })}
      </ol>
      <div className="cs-row">
        <button type="button" className="cs-btn cs-btn-primary" onClick={save} disabled={saveState.kind === 'working'}>
          <Check size={14} aria-hidden="true" /> {saveState.kind === 'working' ? 'Saving…' : 'Save milestone edits'}
        </button>
      </div>
      <div role="status" aria-live="polite" className={`cs-status cs-status-${saveState.kind}`}>{saveState.message}</div>
    </div>
  );
}

function SlideViewer({ output }) {
  const [index, setIndex] = useState(0);
  const slide = output.slides[index];
  if (!slide) return <p className="cs-muted">No slides from these sources.</p>;
  return (
    <div className="cs-slide">
      <h4>{slide.heading}</h4>
      <ul>{slide.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
      <p className="cs-muted">Coach notes: {slide.speakerNotes}</p>
      <div className="cs-row">
        <button type="button" className="cs-btn" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
          <ChevronLeft size={14} aria-hidden="true" /> Previous
        </button>
        <span className="cs-muted">Slide {index + 1} of {output.slides.length}</span>
        <button type="button" className="cs-btn" onClick={() => setIndex((i) => Math.min(output.slides.length - 1, i + 1))} disabled={index >= output.slides.length - 1}>
          Next <ChevronRight size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function QuizPlayer({ output }) {
  const [answers, setAnswers] = useState({});
  return (
    <ol className="cs-quiz">
      {output.items.map((item) => {
        const chosen = answers[item.id];
        const answered = chosen !== undefined;
        const correct = answered && item.answers.includes(chosen);
        return (
          <li key={item.id} className="cs-quiz-item">
            <p>{item.prompt}</p>
            <div className="cs-options" role="radiogroup" aria-label={item.prompt}>
              {item.options.map((opt, i) => (
                <button
                  key={opt}
                  type="button"
                  role="radio"
                  aria-checked={chosen === i}
                  className={`cs-option${chosen === i ? ' is-chosen' : ''}`}
                  onClick={() => setAnswers((cur) => ({ ...cur, [item.id]: i }))}
                >
                  {opt}
                </button>
              ))}
            </div>
            {answered && (
              <p className={correct ? 'cs-right' : 'cs-wrong'} role="status">
                {correct ? 'Correct.' : 'Not quite.'} {item.explanation}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function ScriptView({ output }) {
  return (
    <ol className="cs-script">
      {output.sections.map((s) => (
        <li key={s.slideId}>
          <span className="cs-muted">{s.slideId} · about {s.durationSec}s</span>
          <p>{s.narration}</p>
        </li>
      ))}
    </ol>
  );
}
