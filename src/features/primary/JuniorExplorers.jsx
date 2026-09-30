/**
 * Junior Explorers - the primary (ages 6-11) section.
 *
 * Home → activity → investigation, where every investigation is played by the
 * same five-step player (get ready, my guess, do it, look & record, what
 * happened). Activities are content (features/primary/activities); this file
 * is the one player that runs them all.
 *
 * Designed for iPads: 56px+ touch targets, pointer-event drawing, read-aloud
 * and big text on by default. No AI, no camera, no free chat - see the
 * 2026-09-25 primary plan. The styles reuse Plant Lab's `pl-*` classes (the
 * engine grew out of it) plus `jx-*` for what is new.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  LEVELS, VERDICTS, stagesFor, fieldVisible, usesTrials, valueOf, hypothesisSentence, analyseRecord,
  stageDone, starsFor, sampleStarted, sampleSummary, stageSpeech
} from './engine/investigationModel.js';
import { useExplorerBook, useJuniorSettings } from './engine/useExplorerBook.js';
import { JUNIOR_ACTIVITIES, JUNIOR_BY_ID, isPlayable } from './activities/index.js';
import { LENSES, COLOURS, SHAPES, CLARITY, SURE } from '../activities/plantLab/plantLabModel.js';
import { ShapeIcon } from '../activities/plantLab/PlantMicroscopeLab.jsx';
import { DrawPad } from '../activities/plantLab/DrawPad.jsx';
import '../activities/plantLab/plantLab.css';
import './juniorExplorers.css';

// --- read aloud ---------------------------------------------------------------

function speak(text) {
  try {
    const synth = window.speechSynthesis;
    if (!synth || !text) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    synth.speak(u);
  } catch { /* no speech on this device - the text is still on screen */ }
}

function SayIt({ text }) {
  return <button type="button" className="pl-say" onClick={() => speak(text)} aria-label="Read this to me" title="Read this to me">🔊</button>;
}

function Question({ children, speakText }) {
  return (
    <div className="pl-q">
      <h3>{children}</h3>
      <SayIt text={speakText || (typeof children === 'string' ? children : '')} />
    </div>
  );
}

function Choices({ options, value, onChange, multi = false, readAloud, render, columns }) {
  const selected = (id) => (multi ? (value || []).includes(id) : value === id);
  const tap = (o) => {
    if (readAloud) speak(o.label);
    if (multi) {
      const cur = value || [];
      onChange(cur.includes(o.id) ? cur.filter((x) => x !== o.id) : [...cur, o.id]);
    } else {
      onChange(value === o.id ? null : o.id);
    }
  };
  return (
    <div className="pl-choices" style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}>
      {options.map((o) => (
        <button key={o.id} type="button" className={`pl-choice${selected(o.id) ? ' is-on' : ''}`} aria-pressed={selected(o.id)} onClick={() => tap(o)}>
          {render ? render(o) : <span className="pl-choice-icon">{o.icon}</span>}
          <span className="pl-choice-label">{o.label}</span>
          {selected(o.id) ? <span className="pl-tick" aria-hidden="true">✓</span> : null}
        </button>
      ))}
    </div>
  );
}

function Stars({ n, of }) {
  return (
    <span className="pl-stars" aria-label={`${n} of ${of} stars`}>
      {Array.from({ length: of }, (_, i) => <span key={i} className={i < n ? 'on' : ''}>★</span>)}
    </span>
  );
}

// --- fields --------------------------------------------------------------------

function Counter({ field, value, onChange, readAloud, small }) {
  const n = Number.isFinite(value) ? value : null;
  const bump = () => { onChange((n ?? 0) + 1); if (readAloud) speak(String((n ?? 0) + 1)); };
  return (
    <div className={`pl-counter${small ? ' jx-counter-small' : ''}`}>
      <button type="button" className="pl-count-big" onClick={bump}>
        <span className="pl-choice-icon">{field.icon || '👆'}</span>
        <span className="pl-count-n">{n ?? 0}</span>
        <span className="pl-choice-label">Tap for each one</span>
      </button>
      <div className="pl-count-side">
        <button type="button" className="pl-btn" onClick={() => onChange(Math.max(0, (n ?? 0) - 1))} disabled={!n}>− 1 oops</button>
        <button type="button" className="pl-btn" onClick={() => onChange(0)} disabled={n === 0}>None</button>
        <button type="button" className="pl-btn ghost" onClick={() => onChange(null)} disabled={n === null}>Start again</button>
      </div>
    </div>
  );
}

/** Explorer level: the same count, three times, with the middle one shown. */
function Trials({ field, value, onChange, readAloud }) {
  const tries = Array.isArray(value) ? value : [null, null, null];
  const setTry = (i, v) => onChange(tries.map((t, j) => (j === i ? v : t)));
  const middle = valueOf(tries);
  return (
    <div className="jx-trials">
      {tries.map((t, i) => (
        <div key={i} className="jx-try">
          <div className="jx-try-head">Try {i + 1}</div>
          <Counter field={field} value={t} onChange={(v) => setTry(i, v)} readAloud={readAloud} small />
        </div>
      ))}
      <div className="jx-middle">
        {middle === null ? 'Do all your tries' : <>Middle result: <b>{middle}</b> {field.unit || ''}</>}
        <SayIt text="The middle result is the one in the middle when you put your three tries in order." />
      </div>
    </div>
  );
}

/**
 * A reading such as a temperature. Big +/- buttons, no typing: a 6-year-old on
 * an iPad can set 31 without a keyboard. Starts empty (null), because "not
 * measured yet" is not the same as any number; the first tap starts from
 * `field.start` so nobody taps +1 thirty times.
 */
function NumberStepper({ field, value, onChange, readAloud }) {
  const n = Number.isFinite(value) ? value : null;
  const { min = 0, max = 100, start = 0, unit = '' } = field;
  const set = (next) => {
    const v = Math.min(max, Math.max(min, next));
    onChange(v);
    if (readAloud) speak(`${v} ${field.unitSpoken || unit}`);
  };
  const step = (d) => set((n ?? start) + (n === null ? 0 : d));
  return (
    <div className="pl-counter">
      <div className="pl-count-big" style={{ cursor: 'default' }} aria-live="polite">
        <span className="pl-choice-icon">{field.icon || '🔢'}</span>
        <span className="pl-count-n">{n === null ? '–' : n}{n !== null && unit ? <small style={{ fontSize: '0.45em', marginLeft: 4 }}>{unit}</small> : null}</span>
        <span className="pl-choice-label">{n === null ? 'Tap a button to start' : field.label}</span>
      </div>
      <div className="pl-count-side" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        <button type="button" className="pl-btn" onClick={() => step(-5)} aria-label={`minus 5 ${unit}`}>− 5</button>
        <button type="button" className="pl-btn" onClick={() => step(5)} aria-label={`plus 5 ${unit}`}>+ 5</button>
        <button type="button" className="pl-btn" onClick={() => step(-1)} aria-label={`minus 1 ${unit}`}>− 1</button>
        <button type="button" className="pl-btn" onClick={() => step(1)} aria-label={`plus 1 ${unit}`}>+ 1</button>
        <button type="button" className="pl-btn ghost" onClick={() => onChange(null)} disabled={n === null} style={{ gridColumn: '1 / -1' }}>Start again</button>
      </div>
    </div>
  );
}

/**
 * One big button: tap to start, tap to stop. Records seconds to one decimal.
 * The running clock is local; only the stopped time is saved.
 */
function Stopwatch({ field, value, onChange, readAloud }) {
  const [startedAt, setStartedAt] = useState(null);
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (startedAt === null) return undefined;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [startedAt]);
  const running = startedAt !== null;
  const shown = running ? (now - startedAt) / 1000 : (Number.isFinite(value) ? value : null);
  const toggle = () => {
    if (running) {
      const secs = Math.round((Date.now() - startedAt) / 100) / 10;
      setStartedAt(null);
      onChange(secs);
      if (readAloud) speak(`${secs} seconds`);
    } else {
      const t = Date.now();
      setStartedAt(t); setNow(t);
      if (readAloud) speak('Go!');
    }
  };
  return (
    <div className="pl-counter">
      <button type="button" className="pl-count-big" onClick={toggle} aria-pressed={running}
              style={running ? { outline: '4px solid #f97316' } : undefined}>
        <span className="pl-choice-icon">{running ? '⏹️' : '⏱️'}</span>
        <span className="pl-count-n">{shown === null ? '0.0' : shown.toFixed(1)}<small style={{ fontSize: '0.45em', marginLeft: 4 }}>s</small></span>
        <span className="pl-choice-label">{running ? 'Tap to STOP' : 'Tap to START'}</span>
      </button>
      <div className="pl-count-side">
        <button type="button" className="pl-btn ghost" onClick={() => { setStartedAt(null); onChange(null); }} disabled={running || value == null}>Start again</button>
      </div>
    </div>
  );
}

function Field({ field, value, onChange, readAloud, level }) {
  let control;
  switch (field.kind) {
    case 'lens':
      control = <Choices options={LENSES.map((l) => ({ ...l, icon: '🔬' }))} value={value} onChange={onChange} readAloud={readAloud} columns={3} />;
      break;
    case 'colours':
      control = (
        <Choices multi options={COLOURS} value={value} onChange={onChange} readAloud={readAloud}
          render={(o) => <span className={`pl-swatch${o.id === 'clear' ? ' is-clear' : ''}`} style={{ background: o.swatch }} />} />
      );
      break;
    case 'shape':
      control = <Choices options={SHAPES} value={value} onChange={onChange} readAloud={readAloud} render={(o) => <ShapeIcon id={o.id} />} />;
      break;
    case 'clarity':
      control = <Choices options={CLARITY} value={value} onChange={onChange} readAloud={readAloud} columns={3} />;
      break;
    case 'choice':
      control = <Choices options={field.options} value={value} onChange={onChange} readAloud={readAloud} columns={Math.min(field.options.length, 3)} />;
      break;
    case 'count':
      control = usesTrials(field, level)
        ? <Trials field={field} value={value} onChange={onChange} readAloud={readAloud} />
        : <Counter field={field} value={Array.isArray(value) ? valueOf(value) : value} onChange={onChange} readAloud={readAloud} />;
      break;
    case 'number':
      control = <NumberStepper field={field} value={value} onChange={onChange} readAloud={readAloud} />;
      break;
    case 'stopwatch':
      control = <Stopwatch field={field} value={value} onChange={onChange} readAloud={readAloud} />;
      break;
    case 'draw':
      control = <DrawPad value={value} onChange={onChange} />;
      break;
    default:
      control = null;
  }
  return (
    <section className="pl-field">
      <Question>{field.label}</Question>
      {control}
    </section>
  );
}

function WordsBox({ value, onChange, bank }) {
  const add = (w) => onChange(`${value ? `${value} ` : ''}${w}`.slice(0, 60));
  return (
    <section className="pl-field">
      <Question speakText="Add a few words if you want. Tap a word to add it.">A few words (if you want)</Question>
      <div className="pl-bank">
        {(bank || []).map((w) => <button key={w} type="button" className="pl-word" onClick={() => add(w)}>+ {w}</button>)}
      </div>
      <input type="text" className="pl-words" maxLength={60} value={value || ''} placeholder="Tap words above, or type"
        onChange={(e) => onChange(e.target.value)} />
    </section>
  );
}

const summaryLookups = {
  lens: (v) => LENSES.find((l) => l.id === v)?.label,
  colours: (v) => v.map((c) => COLOURS.find((x) => x.id === c)?.label.toLowerCase()).join(', '),
  shape: (v) => SHAPES.find((s) => s.id === v)?.label.toLowerCase(),
  clarity: (v) => CLARITY.find((c) => c.id === v)?.label.toLowerCase()
};

// --- the five stages -------------------------------------------------------------

function ReadyStage({ inv, record, update, readAloud }) {
  const toggle = (i) => update((r) => ({
    ...r, checklist: r.checklist.includes(i) ? r.checklist.filter((x) => x !== i) : [...r.checklist, i]
  }));
  return (
    <>
      <Question>Tap each thing when you have it</Question>
      <div className="pl-choices">
        {inv.needs.map((n, i) => {
          const on = record.checklist.includes(i);
          return (
            <button key={n.label} type="button" className={`pl-choice${on ? ' is-on' : ''}`} aria-pressed={on}
              onClick={() => { toggle(i); if (readAloud) speak(n.label); }}>
              <span className="pl-choice-icon">{n.icon}</span>
              <span className="pl-choice-label">{n.label}</span>
              {on ? <span className="pl-tick" aria-hidden="true">✓</span> : null}
            </button>
          );
        })}
      </div>
      <div className="pl-safety">
        <strong>🦺 Stay safe</strong>
        <ul>{inv.safety.map((s) => <li key={s}>{s}</li>)}</ul>
        <SayIt text={`Stay safe. ${inv.safety.join(' ')}`} />
      </div>
    </>
  );
}

function GuessStage({ inv, record, update, readAloud }) {
  const h = record.hypothesis;
  const sentence = hypothesisSentence(inv, h);
  const set = (changes) => update((r) => ({ ...r, hypothesis: { ...r.hypothesis, ...changes } }));
  return (
    <>
      <div className="pl-bigq">
        <span className="pl-bigq-icon">❓</span>
        <p>{inv.question}</p>
        <SayIt text={inv.question} />
      </div>
      <Question>{inv.guessPrompt}</Question>
      <Choices options={inv.options} value={h.choice} onChange={(choice) => set({ choice })} readAloud={readAloud} />
      {h.choice ? (
        <>
          <Question>How sure are you?</Question>
          <Choices options={SURE} value={h.sure} onChange={(sure) => set({ sure })} readAloud={readAloud} columns={3} />
          <div className="pl-hypothesis">
            <span className="pl-tag">My guess</span>
            <p>{sentence}</p>
            <SayIt text={sentence} />
          </div>
        </>
      ) : null}
    </>
  );
}

function DoStage({ inv, record, update, readAloud }) {
  const next = inv.steps.findIndex((_, i) => !record.stepsDone.includes(i));
  useEffect(() => {
    if (readAloud && next >= 0) speak(`Step ${next + 1}. ${inv.steps[next].text}`);
  }, [next, readAloud, inv]);
  const toggle = (i) => update((r) => ({
    ...r, stepsDone: r.stepsDone.includes(i) ? r.stepsDone.filter((x) => x !== i) : [...r.stepsDone, i]
  }));
  return (
    <ol className="pl-steps">
      {inv.steps.map((s, i) => {
        const done = record.stepsDone.includes(i);
        return (
          <li key={s.text} className={`pl-step${done ? ' is-done' : ''}${i === next ? ' is-current' : ''}`}>
            <span className="pl-step-n">{done ? '✓' : i + 1}</span>
            <span className="pl-step-icon">{s.icon}</span>
            <div className="pl-step-body">
              <p>{s.text}</p>
              {s.adult ? <span className="pl-adult">🧑‍🏫 Ask an adult</span> : null}
            </div>
            <SayIt text={s.text} />
            <button type="button" className={`pl-btn${done ? ' ghost' : ' go'}`} onClick={() => toggle(i)}>{done ? 'Undo' : 'Done ✓'}</button>
          </li>
        );
      })}
    </ol>
  );
}

function LookStage({ inv, record, update, readAloud, level }) {
  const [sampleId, setSampleId] = useState(inv.samples[0].id);
  const obs = record.observations[sampleId] || {};
  const setObs = (key, value) => update((r) => ({
    ...r, observations: { ...r.observations, [sampleId]: { ...(r.observations[sampleId] || {}), [key]: value } }
  }));
  const idx = inv.samples.findIndex((s) => s.id === sampleId);
  const nextSample = inv.samples[idx + 1];
  return (
    <>
      {inv.samples.length > 1 ? (
        <div className="pl-samples" role="tablist">
          {inv.samples.map((s) => (
            <button key={s.id} type="button" role="tab" aria-selected={s.id === sampleId}
              className={`pl-sample${s.id === sampleId ? ' is-on' : ''}`}
              onClick={() => { setSampleId(s.id); if (readAloud) speak(s.label); }}>
              <span>{s.icon}</span> {s.label}
              {sampleStarted(inv, record.observations[s.id], level) ? <span className="pl-tick-inline">✓</span> : null}
            </button>
          ))}
        </div>
      ) : null}
      <div className="pl-now-looking">{inv.samples[idx].icon} Now recording: <strong>{inv.samples[idx].label}</strong></div>
      {inv.fields.filter((f) => fieldVisible(f, level)).map((f) => (
        <Field key={`${sampleId}-${f.id}`} field={f} value={obs[f.id]} onChange={(v) => setObs(f.id, v)} readAloud={readAloud} level={level} />
      ))}
      <WordsBox value={obs.words} onChange={(v) => setObs('words', v)} bank={inv.wordBank} />
      {nextSample ? (
        <button type="button" className="pl-btn go wide" onClick={() => { setSampleId(nextSample.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          Next: {nextSample.icon} {nextSample.label} →
        </button>
      ) : null}
    </>
  );
}

function ScienceAndWords({ inv }) {
  return (
    <>
      <div className="pl-science">
        <p>{inv.scientists}</p>
        <SayIt text={inv.scientists} />
        {inv.kind !== 'build' ? <p className="pl-hint">If your result is different, that is still real science. Write down what YOU saw.</p> : null}
      </div>
      <div className="pl-words-new">
        <strong>📚 New science words</strong>
        {inv.newWords.map((w) => (
          <div key={w.word} className="pl-newword"><b>{w.word}</b> <span>{w.meaning}</span><SayIt text={`${w.word}. ${w.meaning}`} /></div>
        ))}
      </div>
    </>
  );
}

function ResultStage({ inv, record, update, readAloud, level }) {
  const [showScience, setShowScience] = useState(false);
  const nStages = stagesFor(inv).length;

  if (inv.kind === 'build') {
    const finish = () => update((r) => ({ ...r, finishedAt: r.finishedAt || Date.now() }));
    return (
      <>
        {!record.finishedAt ? (
          <button type="button" className="pl-btn go big wide" onClick={finish}>🎉 I built it!</button>
        ) : (
          <div className="pl-celebrate">
            <div className="pl-badge">{inv.icon}</div>
            <p>Great building! Now test it with the next challenges.</p>
            <Stars n={starsFor(inv, record, level)} of={nStages} />
          </div>
        )}
        <ScienceAndWords inv={inv} />
      </>
    );
  }

  const analysis = analyseRecord(inv, record);
  const guess = hypothesisSentence(inv, record.hypothesis);
  const setOutcome = (changes) => update((r) => ({
    ...r, outcome: { ...r.outcome, ...changes }, finishedAt: changes.verdict ? (r.finishedAt || Date.now()) : r.finishedAt
  }));
  return (
    <>
      <div className="pl-hypothesis">
        <span className="pl-tag">My guess</span>
        <p>{guess || 'You have not made a guess yet.'}</p>
        {guess ? <SayIt text={guess} /> : null}
      </div>
      <div className="pl-data">
        <span className="pl-tag">My results say</span>
        <p>{analysis.dataSays || 'Record your tests on the "Look & record" step first.'}</p>
        {analysis.dataSays ? <SayIt text={analysis.dataSays} /> : null}
        {analysis.warning ? <p className="pl-warn">⚖️ {analysis.warning}</p> : null}
      </div>
      <Question>Was your guess right?</Question>
      {analysis.suggested ? (
        <p className="pl-hint">💡 Your results suggest: <strong>{VERDICTS.find((v) => v.id === analysis.suggested).label}</strong>. You decide!</p>
      ) : null}
      <Choices options={VERDICTS} value={record.outcome.verdict} onChange={(verdict) => setOutcome({ verdict })} readAloud={readAloud} columns={2} />
      <WordsBox value={record.outcome.words} onChange={(words) => setOutcome({ words })} bank={['I learned', 'more', 'less', 'surprised', 'try again', ...(inv.wordBank || []).slice(0, 4)]} />
      {record.outcome.verdict ? (
        <>
          <button type="button" className="pl-btn wide" onClick={() => setShowScience((v) => !v)}>
            🧑‍🔬 {showScience ? 'Hide' : 'Show'} what scientists often see
          </button>
          {showScience ? <ScienceAndWords inv={inv} /> : null}
          <div className="pl-celebrate">
            <div className="pl-badge">{inv.icon}</div>
            <p>Great science! You finished <strong>{inv.title}</strong>.</p>
            <Stars n={starsFor(inv, record, level)} of={nStages} />
          </div>
        </>
      ) : null}
    </>
  );
}

const STAGE_VIEWS = { ready: ReadyStage, guess: GuessStage, do: DoStage, look: LookStage, result: ResultStage };

// --- screens ---------------------------------------------------------------------

function Player({ inv, record, update, readAloud, level, onBack, onBook }) {
  const stages = stagesFor(inv);
  const stage = stages.some((s) => s.id === record.stage) ? record.stage : 'ready';
  const i = stages.findIndex((s) => s.id === stage);
  const View = STAGE_VIEWS[stage];
  const go = (id) => { update((r) => ({ ...r, stage: id })); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  useEffect(() => {
    if (readAloud && stage !== 'do') speak(stageSpeech(inv, stage));
  }, [stage, readAloud, inv]);

  return (
    <>
      <div className="pl-exp-head">
        <button type="button" className="pl-btn ghost" onClick={onBack}>← Back</button>
        <h2>{inv.icon} {inv.title}{record.trial > 1 ? <small> · try {record.trial}</small> : null}</h2>
      </div>
      <nav className="pl-stages jx-stages" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }} aria-label="Steps">
        {stages.map((s, j) => (
          <button key={s.id} type="button"
            className={`pl-stage${s.id === stage ? ' is-on' : ''}${stageDone(inv, record, s.id, level) ? ' is-done' : ''}`}
            aria-current={s.id === stage ? 'step' : undefined} onClick={() => go(s.id)}>
            <span className="pl-stage-icon">{stageDone(inv, record, s.id, level) ? '✅' : s.icon}</span>
            <span className="pl-stage-t">{j + 1}. {s.label}</span>
          </button>
        ))}
      </nav>
      <div className="pl-card">
        <View inv={inv} record={record} update={update} readAloud={readAloud} level={level} />
      </div>
      <div className="pl-nav">
        {i > 0 ? <button type="button" className="pl-btn big ghost" onClick={() => go(stages[i - 1].id)}>← Back</button> : <span />}
        {i < stages.length - 1
          ? <button type="button" className="pl-btn big go" onClick={() => go(stages[i + 1].id)}>Next: {stages[i + 1].label} →</button>
          : <button type="button" className="pl-btn big go" onClick={onBook}>📒 My lab book</button>}
      </div>
    </>
  );
}

function LabBook({ activity, records, level, onOpen, onDelete, onBack }) {
  const rows = [...records].sort((a, b) => b.createdAt - a.createdAt);
  const byId = new Map(activity.investigations.map((i) => [i.id, i]));
  return (
    <>
      <div className="pl-exp-head">
        <button type="button" className="pl-btn ghost" onClick={onBack}>← Back</button>
        <h2>📒 My Lab Book: {activity.title}</h2>
        <button type="button" className="pl-btn ghost pl-print" onClick={() => window.print()}>🖨️ Print</button>
      </div>
      {!rows.length ? <div className="pl-card"><p>Your tests will appear here.</p></div> : (
        <div className="pl-table-wrap">
          <table className="pl-table">
            <thead><tr><th>Date</th><th>Test</th><th>My guess</th><th>What I found</th><th>Was I right?</th><th /></tr></thead>
            <tbody>
              {rows.map((r) => {
                const inv = byId.get(r.investigationId);
                if (!inv) return null;
                const verdict = VERDICTS.find((v) => v.id === r.outcome?.verdict);
                const guess = inv.options?.find((o) => o.id === r.hypothesis?.choice);
                return (
                  <tr key={r.id}>
                    <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td><strong>{inv.icon} {inv.title}</strong>{r.trial > 1 ? <div className="pl-muted">Try {r.trial}</div> : null}</td>
                    <td>{inv.kind === 'build' ? <span className="pl-muted">Build</span> : guess ? `${guess.icon} ${guess.label}` : <span className="pl-muted">—</span>}</td>
                    <td>
                      {inv.samples.map((s) => {
                        const o = r.observations?.[s.id];
                        if (!sampleStarted(inv, o, level)) return null;
                        return (
                          <div key={s.id} className="pl-seen">
                            {o.drawing ? <img src={o.drawing} alt={`Drawing of ${s.label}`} /> : null}
                            <div><b>{s.icon} {s.label}</b><br />{sampleSummary(inv, o, level, summaryLookups)}</div>
                          </div>
                        );
                      })}
                    </td>
                    <td>{inv.kind === 'build'
                      ? (r.finishedAt ? '🎉 Built' : <span className="pl-muted">Not finished</span>)
                      : verdict ? `${verdict.icon} ${verdict.label}` : <span className="pl-muted">Not finished</span>}</td>
                    <td className="pl-row-actions">
                      <button type="button" className="pl-btn ghost" onClick={() => onOpen(r.id)}>Open</button>
                      <button type="button" className="pl-btn ghost danger" onClick={() => {
                        if (window.confirm(`Remove "${inv.title}" from your lab book?`)) onDelete(r.id);
                      }}>Remove</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function ActivityScreen({ uid, activity, settings, onHome }) {
  const { book, startRecord, updateRecord, deleteRecord, syncState } = useExplorerBook(uid, activity.id);
  const [screen, setScreen] = useState({ name: 'list' });
  const { readAloud, level } = settings;

  const record = screen.name === 'record' ? book.records.find((r) => r.id === screen.id) : null;
  const inv = record ? activity.investigations.find((i) => i.id === record.investigationId) : null;
  const recordId = record?.id;
  const update = useMemo(() => (fn) => { if (recordId) updateRecord(recordId, fn); }, [recordId, updateRecord]);
  const show = (next) => { setScreen(next); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  if (record && inv) {
    return <Player inv={inv} record={record} update={update} readAloud={readAloud} level={level}
      onBack={() => show({ name: 'list' })} onBook={() => show({ name: 'book' })} />;
  }
  if (screen.name === 'book') {
    return <LabBook activity={activity} records={book.records} level={level}
      onOpen={(id) => show({ name: 'record', id })} onDelete={deleteRecord} onBack={() => show({ name: 'list' })} />;
  }

  return (
    <>
      <div className="pl-exp-head">
        <button type="button" className="pl-btn ghost" onClick={onHome}>← All activities</button>
        <h2>{activity.icon} {activity.title}</h2>
        <span className={`pl-sync ${syncState}`}>{{ idle: '', saving: 'Saving…', saved: '✓ Saved', 'local-only': 'Saved on this iPad' }[syncState]}</span>
      </div>
      {activity.story ? (
        <div className="jx-story" style={{ '--c': activity.colour }}>
          <p>{activity.story}</p>
          <SayIt text={activity.story} />
        </div>
      ) : null}
      <div className="pl-grid">
        {activity.investigations.map((i, n) => {
          const mine = book.records.filter((r) => r.investigationId === i.id);
          const latest = mine[mine.length - 1];
          const finished = mine.filter((r) => r.finishedAt).length;
          return (
            <article key={i.id} className="pl-exp">
              <div className="jx-inv-top">
                <span className="jx-step-no">{i.kind === 'build' ? 'Start here' : `Test ${n}`}</span>
              </div>
              <div className="pl-exp-icon">{i.icon}</div>
              <h3>{i.title} <SayIt text={`${i.title}. ${i.short}`} /></h3>
              <p>{i.short}</p>
              {latest ? <Stars n={starsFor(i, latest, level)} of={stagesFor(i).length} /> : null}
              {finished ? <span className="pl-done-badge">🏅 Done{finished > 1 ? ` ${finished} times` : ''}</span> : null}
              <div className="pl-exp-actions">
                {latest && !latest.finishedAt
                  ? <button type="button" className="pl-btn go" onClick={() => show({ name: 'record', id: latest.id })}>Carry on →</button>
                  : <button type="button" className="pl-btn go" onClick={() => show({ name: 'record', id: startRecord(i) })}>{latest ? 'Do it again' : 'Start'} →</button>}
                {latest?.finishedAt ? <button type="button" className="pl-btn ghost" onClick={() => show({ name: 'record', id: latest.id })}>Look back</button> : null}
              </div>
            </article>
          );
        })}
      </div>
      <button type="button" className="pl-btn big wide" onClick={() => show({ name: 'book' })}>📒 Open my lab book</button>
      {/* The paper version for the hands-on part: same steps, pencil and clipboard. */}
      <a className="pl-btn wide" href={`#/worksheet/${activity.id}`} style={{ marginTop: 10, textAlign: 'center', textDecoration: 'none' }}>🖨️ Print my worksheet</a>
    </>
  );
}

function Home({ onOpen }) {
  return (
    <div className="jx-home">
      {JUNIOR_ACTIVITIES.map((a) => {
        const ready = isPlayable(a);
        return (
          <button key={a.id} type="button" className={`jx-card${ready ? '' : ' is-soon'}`} style={{ '--c': a.colour }}
            onClick={() => (ready ? onOpen(a.id) : speak(`${a.title}. Coming soon.`))} aria-disabled={!ready}>
            <span className="jx-num">{a.number}</span>
            <span className="jx-card-icon">{a.icon}</span>
            <span className="jx-card-title">{a.title}</span>
            <span className="jx-card-short">{a.short}</span>
            <span className="jx-card-foot">{ready ? 'Let\'s go! →' : '🔜 Coming soon'}</span>
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------------

export function JuniorExplorers({ uid, displayName }) {
  const [settings, setSetting] = useJuniorSettings(uid);
  const [activityId, setActivityId] = useState(null);
  const activity = activityId ? JUNIOR_BY_ID.get(activityId) : null;
  const { readAloud, bigText, level } = settings;

  useEffect(() => () => { try { window.speechSynthesis?.cancel(); } catch { /* ignore */ } }, []);

  return (
    <div className={`container pl jx${bigText ? ' pl-big' : ''}`}>
      <div className="pl-hero jx-hero">
        <div>
          <h2>🧭 Junior Explorers</h2>
          <p>{displayName ? `Hi ${displayName}! ` : ''}Guess. Test. Find out. Be a scientist!</p>
        </div>
        <div className="pl-tools">
          <button type="button" className={`pl-toggle${readAloud ? ' is-on' : ''}`} aria-pressed={readAloud}
            onClick={() => { setSetting('readAloud', !readAloud); if (!readAloud) speak('I will read to you.'); }}>
            🔊 Read to me {readAloud ? 'ON' : 'OFF'}
          </button>
          <button type="button" className={`pl-toggle${bigText ? ' is-on' : ''}`} aria-pressed={bigText}
            onClick={() => setSetting('bigText', !bigText)}>🔠 Big text {bigText ? 'ON' : 'OFF'}</button>
          <div className="jx-level" role="radiogroup" aria-label="Level">
            {Object.entries(LEVELS).map(([id, l]) => (
              <button key={id} type="button" role="radio" aria-checked={level === id}
                className={`pl-toggle${level === id ? ' is-on' : ''}`} onClick={() => setSetting('level', id)}>
                {l.icon} {l.label} <small>({l.ages})</small>
              </button>
            ))}
          </div>
        </div>
      </div>

      {activity
        ? <ActivityScreen key={activity.id} uid={uid} activity={activity} settings={settings} onHome={() => setActivityId(null)} />
        : <Home onOpen={(id) => { setActivityId(id); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />}
    </div>
  );
}
