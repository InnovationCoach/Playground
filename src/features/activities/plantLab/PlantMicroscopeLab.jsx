/**
 * Activity 7 - Plant Microscope Lab.
 *
 * A guided experiment book for learners who love the microscope but find long
 * writing hard. Every experiment follows the same five steps - get ready, guess,
 * do it, look & record, what happened - and every step is answered by tapping:
 * picture cards for a hypothesis, chips for colour and shape, a big tap counter,
 * and a round "microscope view" to draw in. Any text on screen can be read
 * aloud. The lab book at the end turns her taps back into a results table.
 *
 * Content and logic live in plantLabModel.js; this file is presentation only.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  EXPERIMENTS, EXPERIMENT_BY_ID, STAGES, LENSES, COLOURS, SHAPES, CLARITY, SURE, VERDICTS,
  hypothesisSentence, analyseRecord, stageDone, starsFor, sampleStarted, sampleSummary, stageSpeech
} from './plantLabModel.js';
import { useLabBook } from './useLabBook.js';
import { DrawPad } from './DrawPad.jsx';
import './plantLab.css';

// --- read aloud ------------------------------------------------------------

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

function SayIt({ text, label = 'Read this to me' }) {
  return (
    <button type="button" className="pl-say" onClick={() => speak(text)} aria-label={label} title={label}>
      🔊
    </button>
  );
}

// --- small pieces ----------------------------------------------------------

// Also used by the Junior Explorers engine, which runs these experiments for primary.
export function ShapeIcon({ id }) {
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 2 };
  const art = {
    bricks: (<>
      <rect x="4" y="6" width="16" height="10" {...s} /><rect x="20" y="6" width="16" height="10" {...s} />
      <rect x="12" y="16" width="16" height="10" {...s} /><rect x="4" y="26" width="16" height="10" {...s} />
      <rect x="20" y="26" width="16" height="10" {...s} />
    </>),
    round: (<>
      <circle cx="13" cy="13" r="8" {...s} /><circle cx="28" cy="15" r="7" {...s} /><circle cx="18" cy="29" r="8" {...s} />
    </>),
    jigsaw: <path d="M5 8 q6 -5 10 2 t10 -2 t10 4 v8 q-5 4 0 8 v6 q-8 4 -12 -2 t-10 2 t-8 -4 v-8 q5 -4 0 -8 z" {...s} />,
    tubes: (<>
      <rect x="6" y="4" width="7" height="32" rx="3" {...s} /><rect x="17" y="4" width="7" height="32" rx="3" {...s} />
      <rect x="28" y="4" width="7" height="32" rx="3" {...s} />
    </>),
    dots: [[10, 10], [24, 8], [31, 20], [15, 22], [8, 31], [24, 31]].map(([x, y]) => (
      <circle key={`${x}${y}`} cx={x} cy={y} r="3" fill="currentColor" />
    )),
    blobs: <path d="M8 14 q4 -10 14 -6 q12 2 10 12 q-2 12 -14 12 q-12 0 -10 -18 z" {...s} />
  }[id];
  return <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">{art}</svg>;
}

/** Big tappable choice cards. `multi` makes it a set of toggles. */
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
        <button
          key={o.id}
          type="button"
          className={`pl-choice${selected(o.id) ? ' is-on' : ''}`}
          aria-pressed={selected(o.id)}
          onClick={() => tap(o)}
        >
          {render ? render(o) : <span className="pl-choice-icon">{o.icon}</span>}
          <span className="pl-choice-label">{o.label}</span>
          {selected(o.id) ? <span className="pl-tick" aria-hidden="true">✓</span> : null}
        </button>
      ))}
    </div>
  );
}

function Stars({ n, of = 5 }) {
  return (
    <span className="pl-stars" aria-label={`${n} of ${of} stars`}>
      {Array.from({ length: of }, (_, i) => <span key={i} className={i < n ? 'on' : ''}>★</span>)}
    </span>
  );
}

function Question({ children, speakText }) {
  return (
    <div className="pl-q">
      <h3>{children}</h3>
      <SayIt text={speakText || (typeof children === 'string' ? children : '')} />
    </div>
  );
}

// --- one field of the observation table -------------------------------------

function Field({ field, value, onChange, readAloud }) {
  let control;
  switch (field.kind) {
    case 'lens':
      control = <Choices options={LENSES.map((l) => ({ ...l, icon: '🔬' }))} value={value} onChange={onChange} readAloud={readAloud} columns={3} />;
      break;
    case 'colours':
      control = (
        <Choices
          multi
          options={COLOURS}
          value={value}
          onChange={onChange}
          readAloud={readAloud}
          render={(o) => <span className={`pl-swatch${o.id === 'clear' ? ' is-clear' : ''}`} style={{ background: o.swatch }} />}
        />
      );
      break;
    case 'shape':
      control = <Choices options={SHAPES} value={value} onChange={onChange} readAloud={readAloud} render={(o) => <ShapeIcon id={o.id} />} />;
      break;
    case 'clarity':
      control = <Choices options={CLARITY} value={value} onChange={onChange} readAloud={readAloud} columns={3} />;
      break;
    case 'choice':
      control = <Choices options={field.options} value={value} onChange={onChange} readAloud={readAloud} columns={field.options.length} />;
      break;
    case 'count': {
      const n = Number.isFinite(value) ? value : null;
      control = (
        <div className="pl-counter">
          <button type="button" className="pl-count-big" onClick={() => { onChange((n ?? 0) + 1); if (readAloud) speak(String((n ?? 0) + 1)); }}>
            <span className="pl-choice-icon">{field.icon || '👆'}</span>
            <span className="pl-count-n">{n ?? 0}</span>
            <span className="pl-choice-label">Tap for each one</span>
          </button>
          <div className="pl-count-side">
            <button type="button" className="pl-btn" onClick={() => onChange(Math.max(0, (n ?? 0) - 1))} disabled={!n}>− 1 oops</button>
            <button type="button" className="pl-btn" onClick={() => onChange(0)} disabled={n === 0}>I saw none</button>
            <button type="button" className="pl-btn ghost" onClick={() => onChange(null)} disabled={n === null}>Start again</button>
          </div>
        </div>
      );
      break;
    }
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
        {bank.map((w) => <button key={w} type="button" className="pl-word" onClick={() => add(w)}>+ {w}</button>)}
      </div>
      <input
        type="text"
        className="pl-words"
        maxLength={60}
        value={value || ''}
        placeholder="Tap words above, or type"
        onChange={(e) => onChange(e.target.value)}
      />
    </section>
  );
}

// --- the five stages ----------------------------------------------------------

function ReadyStage({ exp, record, update, readAloud }) {
  const toggle = (i) => update((r) => ({
    ...r,
    checklist: r.checklist.includes(i) ? r.checklist.filter((x) => x !== i) : [...r.checklist, i]
  }));
  return (
    <>
      <Question>Tap each thing when you have it</Question>
      <div className="pl-choices">
        {exp.needs.map((n, i) => {
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
        <ul>{exp.safety.map((s) => <li key={s}>{s}</li>)}</ul>
        <SayIt text={`Stay safe. ${exp.safety.join(' ')}`} />
      </div>
    </>
  );
}

function GuessStage({ exp, record, update, readAloud }) {
  const h = record.hypothesis;
  const sentence = hypothesisSentence(exp, h);
  const set = (changes) => update((r) => ({ ...r, hypothesis: { ...r.hypothesis, ...changes } }));
  return (
    <>
      <div className="pl-bigq">
        <span className="pl-bigq-icon">❓</span>
        <p>{exp.question}</p>
        <SayIt text={exp.question} />
      </div>
      <Question>{exp.guessPrompt}</Question>
      <Choices options={exp.options} value={h.choice} onChange={(choice) => set({ choice })} readAloud={readAloud} />
      {h.choice ? (
        <>
          <Question>How sure are you?</Question>
          <Choices options={SURE} value={h.sure} onChange={(sure) => set({ sure })} readAloud={readAloud} columns={3} />
          <div className="pl-hypothesis">
            <span className="pl-tag">My hypothesis</span>
            <p>{sentence}</p>
            <SayIt text={sentence} />
          </div>
        </>
      ) : null}
    </>
  );
}

function DoStage({ exp, record, update, readAloud }) {
  const next = exp.steps.findIndex((_, i) => !record.stepsDone.includes(i));
  useEffect(() => {
    if (readAloud && next >= 0) speak(`Step ${next + 1}. ${exp.steps[next].text}`);
  }, [next, readAloud, exp]);

  const toggle = (i) => update((r) => ({
    ...r,
    stepsDone: r.stepsDone.includes(i) ? r.stepsDone.filter((x) => x !== i) : [...r.stepsDone, i]
  }));

  return (
    <ol className="pl-steps">
      {exp.steps.map((s, i) => {
        const done = record.stepsDone.includes(i);
        const current = i === next;
        return (
          <li key={s.text} className={`pl-step${done ? ' is-done' : ''}${current ? ' is-current' : ''}`}>
            <span className="pl-step-n">{done ? '✓' : i + 1}</span>
            <span className="pl-step-icon">{s.icon}</span>
            <div className="pl-step-body">
              <p>{s.text}</p>
              {s.adult ? <span className="pl-adult">🧑‍🏫 Ask an adult</span> : null}
            </div>
            <SayIt text={s.text} />
            <button type="button" className={`pl-btn${done ? ' ghost' : ' go'}`} onClick={() => toggle(i)}>
              {done ? 'Undo' : 'Done ✓'}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function LookStage({ exp, record, update, readAloud }) {
  const [sampleId, setSampleId] = useState(exp.samples[0].id);
  const obs = record.observations[sampleId] || {};
  const setObs = (key, value) => update((r) => ({
    ...r,
    observations: { ...r.observations, [sampleId]: { ...(r.observations[sampleId] || {}), [key]: value } }
  }));
  const idx = exp.samples.findIndex((s) => s.id === sampleId);
  const nextSample = exp.samples[idx + 1];

  return (
    <>
      <div className="pl-samples" role="tablist">
        {exp.samples.map((s) => (
          <button key={s.id} type="button" role="tab" aria-selected={s.id === sampleId}
            className={`pl-sample${s.id === sampleId ? ' is-on' : ''}`}
            onClick={() => { setSampleId(s.id); if (readAloud) speak(s.label); }}>
            <span>{s.icon}</span> {s.label}
            {sampleStarted(exp, record.observations[s.id]) ? <span className="pl-tick-inline">✓</span> : null}
          </button>
        ))}
      </div>

      <div className="pl-now-looking">🔬 Now looking at: <strong>{exp.samples[idx].label}</strong></div>

      {exp.fields.map((f) => (
        <Field key={f.id} field={f} value={obs[f.id]} onChange={(v) => setObs(f.id, v)} readAloud={readAloud} />
      ))}
      <WordsBox value={obs.words} onChange={(v) => setObs('words', v)} bank={exp.wordBank} />

      {nextSample ? (
        <button type="button" className="pl-btn go wide" onClick={() => { setSampleId(nextSample.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          Next: {nextSample.icon} {nextSample.label} →
        </button>
      ) : null}
    </>
  );
}

function ResultStage({ exp, record, update, readAloud }) {
  const [showScience, setShowScience] = useState(false);
  const analysis = analyseRecord(exp, record);
  const guess = hypothesisSentence(exp, record.hypothesis);
  const setOutcome = (changes) => update((r) => ({
    ...r,
    outcome: { ...r.outcome, ...changes },
    finishedAt: changes.verdict ? (r.finishedAt || Date.now()) : r.finishedAt
  }));

  return (
    <>
      <div className="pl-hypothesis">
        <span className="pl-tag">My guess</span>
        <p>{guess || 'You have not made a guess yet.'}</p>
        {guess ? <SayIt text={guess} /> : null}
      </div>

      <div className="pl-data">
        <span className="pl-tag">My data says</span>
        <p>{analysis.dataSays || 'Record your slides on the "Look & record" step first.'}</p>
        {analysis.dataSays ? <SayIt text={analysis.dataSays} /> : null}
        {analysis.warning ? <p className="pl-warn">⚖️ {analysis.warning}</p> : null}
      </div>

      <Question>Was your guess right?</Question>
      {analysis.suggested ? (
        <p className="pl-hint">💡 Your data suggests: <strong>{VERDICTS.find((v) => v.id === analysis.suggested).label}</strong>. You decide!</p>
      ) : null}
      <Choices options={VERDICTS} value={record.outcome.verdict} onChange={(verdict) => setOutcome({ verdict })} readAloud={readAloud} columns={2} />

      <WordsBox value={record.outcome.words} onChange={(words) => setOutcome({ words })} bank={['I learned', 'cells', 'water', 'green', 'more', 'less', 'surprised', 'try again']} />

      {record.outcome.verdict ? (
        <>
          <button type="button" className="pl-btn wide" onClick={() => setShowScience((v) => !v)}>
            🧑‍🔬 {showScience ? 'Hide' : 'Show'} what scientists often see
          </button>
          {showScience ? (
            <div className="pl-science">
              <p>{exp.scientists}</p>
              <SayIt text={exp.scientists} />
              <p className="pl-hint">If your result is different, that is still real science. Write down what YOU saw - never change it to match.</p>
            </div>
          ) : null}

          <div className="pl-words-new">
            <strong>📚 New science words</strong>
            {exp.newWords.map((w) => (
              <div key={w.word} className="pl-newword">
                <b>{w.word}</b> <span>{w.meaning}</span>
                <SayIt text={`${w.word}. ${w.meaning}`} />
              </div>
            ))}
          </div>

          <div className="pl-celebrate">
            <div className="pl-badge">{exp.icon}</div>
            <p>Great science! You finished <strong>{exp.title}</strong>.</p>
            <Stars n={starsFor(exp, record)} />
          </div>
        </>
      ) : null}
    </>
  );
}

const STAGE_VIEWS = { ready: ReadyStage, guess: GuessStage, do: DoStage, look: LookStage, result: ResultStage };

// --- screens -----------------------------------------------------------------

function RecordView({ exp, record, update, onHome, onBook, readAloud }) {
  const stage = record.stage || 'ready';
  const i = STAGES.findIndex((s) => s.id === stage);
  const View = STAGE_VIEWS[stage];
  const go = (id) => { update((r) => ({ ...r, stage: id })); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  useEffect(() => {
    if (readAloud && stage !== 'do') speak(stageSpeech(exp, stage));
  }, [stage, readAloud, exp]);

  return (
    <>
      <div className="pl-exp-head">
        <button type="button" className="pl-btn ghost" onClick={onHome}>← All experiments</button>
        <h2>{exp.icon} {exp.title}{record.trial > 1 ? <small> · try {record.trial}</small> : null}</h2>
      </div>

      <nav className="pl-stages" aria-label="Experiment steps">
        {STAGES.map((s, j) => (
          <button key={s.id} type="button"
            className={`pl-stage${s.id === stage ? ' is-on' : ''}${stageDone(exp, record, s.id) ? ' is-done' : ''}`}
            aria-current={s.id === stage ? 'step' : undefined}
            onClick={() => go(s.id)}>
            <span className="pl-stage-icon">{stageDone(exp, record, s.id) ? '✅' : s.icon}</span>
            <span className="pl-stage-t">{j + 1}. {s.label}</span>
          </button>
        ))}
      </nav>

      <div className="pl-card">
        <View exp={exp} record={record} update={update} readAloud={readAloud} />
      </div>

      <div className="pl-nav">
        {i > 0 ? <button type="button" className="pl-btn big ghost" onClick={() => go(STAGES[i - 1].id)}>← Back</button> : <span />}
        {i < STAGES.length - 1
          ? <button type="button" className="pl-btn big go" onClick={() => go(STAGES[i + 1].id)}>Next: {STAGES[i + 1].label} →</button>
          : <button type="button" className="pl-btn big go" onClick={onBook}>📒 See my Lab Book</button>}
      </div>
    </>
  );
}

function Home({ records, onOpen, onStart, onBook }) {
  return (
    <>
      <div className="pl-grid">
        {EXPERIMENTS.map((exp) => {
          const mine = records.filter((r) => r.experimentId === exp.id);
          const latest = mine[mine.length - 1];
          const finished = mine.filter((r) => r.finishedAt).length;
          return (
            <article key={exp.id} className="pl-exp">
              <div className="pl-exp-icon">{exp.icon}</div>
              <h3>{exp.title} <SayIt text={`${exp.title}. ${exp.short}`} /></h3>
              <p>{exp.short}</p>
              {latest ? <Stars n={starsFor(exp, latest)} /> : null}
              {finished ? <span className="pl-done-badge">🏅 Done {finished > 1 ? `${finished} times` : ''}</span> : null}
              <div className="pl-exp-actions">
                {latest && !latest.finishedAt
                  ? <button type="button" className="pl-btn go" onClick={() => onOpen(latest.id)}>Carry on →</button>
                  : <button type="button" className="pl-btn go" onClick={() => onStart(exp.id)}>{latest ? 'Do it again' : 'Start'} →</button>}
                {latest && latest.finishedAt ? <button type="button" className="pl-btn ghost" onClick={() => onOpen(latest.id)}>Look back</button> : null}
              </div>
            </article>
          );
        })}
      </div>
      <button type="button" className="pl-btn big wide" onClick={onBook}>📒 Open my Lab Book</button>
    </>
  );
}

function LabBook({ records, onOpen, onDelete, onHome }) {
  const rows = [...records].sort((a, b) => b.createdAt - a.createdAt);
  return (
    <>
      <div className="pl-exp-head">
        <button type="button" className="pl-btn ghost" onClick={onHome}>← All experiments</button>
        <h2>📒 My Lab Book</h2>
        <button type="button" className="pl-btn ghost pl-print" onClick={() => window.print()}>🖨️ Print</button>
      </div>
      {!rows.length ? <div className="pl-card"><p>Your experiments will appear here.</p></div> : (
        <div className="pl-table-wrap">
          <table className="pl-table">
            <thead>
              <tr><th>Date</th><th>Experiment</th><th>My guess</th><th>What I saw</th><th>Was I right?</th><th /></tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const exp = EXPERIMENT_BY_ID.get(r.experimentId);
                if (!exp) return null;
                const verdict = VERDICTS.find((v) => v.id === r.outcome?.verdict);
                const guess = exp.options.find((o) => o.id === r.hypothesis?.choice);
                return (
                  <tr key={r.id}>
                    <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td><strong>{exp.icon} {exp.title}</strong>{r.trial > 1 ? <div className="pl-muted">Try {r.trial}</div> : null}</td>
                    <td>{guess ? `${guess.icon} ${guess.label}` : <span className="pl-muted">—</span>}</td>
                    <td>
                      {exp.samples.map((s) => {
                        const o = r.observations?.[s.id];
                        if (!sampleStarted(exp, o)) return null;
                        return (
                          <div key={s.id} className="pl-seen">
                            {o.drawing ? <img src={o.drawing} alt={`Drawing of ${s.label}`} /> : null}
                            <div><b>{s.icon} {s.label}</b><br />{sampleSummary(exp, o)}</div>
                          </div>
                        );
                      })}
                    </td>
                    <td>{verdict ? `${verdict.icon} ${verdict.label}` : <span className="pl-muted">Not finished</span>}
                      {r.outcome?.words ? <div className="pl-muted">"{r.outcome.words}"</div> : null}</td>
                    <td className="pl-row-actions">
                      <button type="button" className="pl-btn ghost" onClick={() => onOpen(r.id)}>Open</button>
                      <button type="button" className="pl-btn ghost danger" onClick={() => {
                        if (window.confirm(`Remove "${exp.title}" from your lab book?`)) onDelete(r.id);
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

// ---------------------------------------------------------------------------

export function PlantMicroscopeLab({ uid }) {
  const { book, startRecord, updateRecord, deleteRecord, setSetting, syncState } = useLabBook(uid);
  const [screen, setScreen] = useState({ name: 'home' });
  const { readAloud, bigText } = book.settings;
  const topRef = useRef(null);

  const record = screen.name === 'record' ? book.records.find((r) => r.id === screen.id) : null;
  const exp = record ? EXPERIMENT_BY_ID.get(record.experimentId) : null;
  const recordId = record?.id;
  const update = useMemo(() => (fn) => { if (recordId) updateRecord(recordId, fn); }, [recordId, updateRecord]);

  const show = (next) => { setScreen(next); topRef.current?.scrollIntoView({ behavior: 'smooth' }); };
  useEffect(() => () => { try { window.speechSynthesis?.cancel(); } catch { /* ignore */ } }, []);

  return (
    <div ref={topRef} className={`container pl${bigText ? ' pl-big' : ''}`}>
      <div className="pl-hero">
        <div>
          <h2>🔬 Plant Microscope Lab</h2>
          <p>Guess. Look. Record. Be a plant scientist!</p>
        </div>
        <div className="pl-tools">
          <button type="button" className={`pl-toggle${readAloud ? ' is-on' : ''}`} aria-pressed={readAloud}
            onClick={() => { setSetting('readAloud', !readAloud); if (!readAloud) speak('I will read to you.'); }}>
            🔊 Read to me {readAloud ? 'ON' : 'OFF'}
          </button>
          <button type="button" className={`pl-toggle${bigText ? ' is-on' : ''}`} aria-pressed={bigText}
            onClick={() => setSetting('bigText', !bigText)}>
            🔠 Big text {bigText ? 'ON' : 'OFF'}
          </button>
          <span className={`pl-sync ${syncState}`}>
            {{ idle: '', saving: 'Saving…', saved: '✓ Saved', 'local-only': 'Saved on this device' }[syncState]}
          </span>
        </div>
      </div>

      {record && exp ? (
        <RecordView
          exp={exp}
          record={record}
          update={update}
          readAloud={readAloud}
          onHome={() => show({ name: 'home' })}
          onBook={() => show({ name: 'book' })}
        />
      ) : screen.name === 'book' ? (
        <LabBook
          records={book.records}
          onOpen={(id) => show({ name: 'record', id })}
          onDelete={deleteRecord}
          onHome={() => show({ name: 'home' })}
        />
      ) : (
        <Home
          records={book.records}
          onOpen={(id) => show({ name: 'record', id })}
          onStart={(id) => show({ name: 'record', id: startRecord(id) })}
          onBook={() => show({ name: 'book' })}
        />
      )}
    </div>
  );
}
