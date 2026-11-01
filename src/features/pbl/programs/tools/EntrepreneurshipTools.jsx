import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Play, Pause, RotateCcw, Square, SkipForward, Volume2, Crown, Lock, Timer } from 'lucide-react';
import {
  BADGES, PRESETS, FRICTION_MAX, cleanFriction, isCompleteFriction, frictionScore, topFrictions,
  CRAZY8_PANELS, CRAZY8_SECONDS, cleanCrazy8, crazy8Done, presetEconomics, cleanEconomics, unitEconomics, COST_ITEMS_MAX,
  PITCH_BLOCKS, PITCH_SECONDS, QA_SECONDS, QA_QUESTIONS, cleanPitch, runOnTime, earnedBadges, founderXp, founderLevel, autoBadge
} from './entrepreneurship.js';
import { confettiFrom, buzz } from '../../../goals/celebrate.js';
import { beep } from './sound.js';
import './tools.css';

/**
 * The Entrepreneurship program's hands-on tools. Each tool gets its saved
 * state (`data`, may be undefined) and `save(next)`. On a coach's read-only
 * view `save` keeps the change in memory only, so coaches can try a tool.
 */

const fmt = (sec) => `${Math.floor(sec / 60)}:${String(Math.max(0, Math.floor(sec % 60))).padStart(2, '0')}`;
const baht = (n) => `${Math.round(n).toLocaleString()} THB`;
const baht2 = (n) => `${(Math.round(n * 100) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })} THB`;

/** A ticking clock that only runs while `running`; returns elapsed seconds. */
function useClock(running) {
  const [elapsed, setElapsed] = useState(0);
  const start = useRef(null);
  const base = useRef(0);
  useEffect(() => {
    if (!running) { base.current = elapsed; start.current = null; return undefined; }
    start.current = performance.now();
    const id = setInterval(() => setElapsed(base.current + (performance.now() - start.current) / 1000), 200);
    return () => clearInterval(id);
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps
  const reset = () => { base.current = 0; start.current = running ? performance.now() : null; setElapsed(0); };
  return [elapsed, reset];
}

export function ToolFor({ id, data, save }) {
  if (id === 'friction-log') return <FrictionLogger data={data} save={save} />;
  if (id === 'crazy-8s') return <Crazy8s data={data} save={save} />;
  if (id === 'unit-economics') return <UnitEconomicsLab data={data} save={save} />;
  if (id === 'pitch-timer') return <PitchArena data={data} save={save} />;
  return null;
}

/* ---------------------------------------------------------- Friction log */

const PAIN = ['😐', '🙁', '😣', '😫', '🤬'];
const OFTEN = ['Rarely', 'Weekly', 'Few times a week', 'Daily', 'Many times a day'];

function Scale({ label, value, onChange, faces }) {
  return (
    <div className="pt-scale" role="group" aria-label={label}>
      <span className="pt-scale-label">{label}</span>
      <div className="pt-scale-row">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" className="pt-scale-btn" aria-pressed={value === n} onClick={() => onChange(value === n ? null : n)}
                  title={faces ? `${n} of 5` : OFTEN[n - 1]} aria-label={faces ? `${n} of 5` : OFTEN[n - 1]}>
            {faces ? faces[n - 1] : n}
          </button>
        ))}
      </div>
    </div>
  );
}

function FrictionLogger({ data, save }) {
  const d = cleanFriction(data);
  const complete = d.entries.filter(isCompleteFriction).length;
  const top = topFrictions(d.entries);
  const set = (entries) => save({ entries });
  const patch = (id, p) => set(d.entries.map((e) => (e.id === id ? { ...e, ...p } : e)));
  const add = () => set([...d.entries, { id: `f${Date.now().toString(36)}`, context: '', workaround: '', impact: null, frequency: null }]);

  return (
    <div className="pt-tool">
      <div className="pt-tool-head">
        <span className="pt-badge-progress">🔍 {Math.min(complete, 5)} of 5 entries for <strong>Friction Hunter</strong></span>
        <span className="pb-meter pt-meter" aria-hidden="true"><span style={{ width: `${Math.min(100, complete * 20)}%` }} /></span>
      </div>
      {d.entries.length === 0 && <p className="pt-empty">Every time something annoys you this week, log it here. Messy is fine.</p>}
      <ol className="pt-friction-list">
        {d.entries.map((e, i) => (
          <li key={e.id} className={top.includes(e.id) ? 'pt-friction is-top' : 'pt-friction'}>
            <span className="pt-friction-n">{top.includes(e.id) ? <Crown size={14} aria-label="top friction" /> : i + 1}</span>
            <div className="pt-friction-body">
              <input className="gh-input" value={e.context} maxLength={140} placeholder="What annoyed you, and where?"
                     aria-label={`Friction ${i + 1}: what and where`} onChange={(ev) => patch(e.id, { context: ev.target.value })} />
              <input className="gh-input" value={e.workaround} maxLength={140} placeholder="What do you do about it now?"
                     aria-label={`Friction ${i + 1}: current workaround`} onChange={(ev) => patch(e.id, { workaround: ev.target.value })} />
              <div className="pt-friction-scales">
                <Scale label="How annoying?" value={e.impact} faces={PAIN} onChange={(v) => patch(e.id, { impact: v })} />
                <Scale label="How often?" value={e.frequency} onChange={(v) => patch(e.id, { frequency: v })} />
              </div>
            </div>
            <button type="button" className="gh-btn gh-btn-ghost gh-btn-sm pt-icon" aria-label={`Remove friction ${i + 1}`}
                    onClick={() => set(d.entries.filter((x) => x.id !== e.id))}><Trash2 size={15} aria-hidden="true" /></button>
          </li>
        ))}
      </ol>
      {d.entries.length < FRICTION_MAX && (
        <button type="button" className="gh-btn gh-btn-sm" onClick={add}><Plus size={15} aria-hidden="true" />Log a friction</button>
      )}
      {complete > 0 && <FrictionMatrix entries={d.entries.filter(isCompleteFriction)} top={top} />}
    </div>
  );
}

/** Frequency across, annoyance up. The top-right corner is where the best problems live. */
function FrictionMatrix({ entries, top }) {
  const S = 260; const pad = 34; const cell = (S - pad) / 5;
  const at = (v) => pad + (v - 0.5) * cell;
  const stacked = {};
  return (
    <figure className="pt-matrix">
      <svg viewBox={`0 0 ${S} ${S}`} role="img" aria-label={`Friction matrix: ${entries.length} complete entries. Top 2 marked with a crown.`}>
        <rect x={pad + cell * 2.5} y={0} width={cell * 2.5} height={cell * 2.5} className="pt-matrix-hot" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <g key={i}>
            <line x1={pad + i * cell} y1={0} x2={pad + i * cell} y2={S - pad} className="pt-grid" />
            <line x1={pad} y1={i * cell} x2={S} y2={i * cell} className="pt-grid" />
          </g>
        ))}
        <text x={S - 4} y={14} textAnchor="end" className="pt-matrix-tag">Fix first</text>
        <text x={pad + (S - pad) / 2} y={S - 8} textAnchor="middle" className="pt-axis">How often →</text>
        <text x={12} y={(S - pad) / 2} textAnchor="middle" className="pt-axis" transform={`rotate(-90 12 ${(S - pad) / 2})`}>How annoying →</text>
        {entries.map((e) => {
          const key = `${e.frequency}-${e.impact}`;
          const k = stacked[key] = (stacked[key] || 0) + 1;
          const x = at(e.frequency) + (k - 1) * 7; const y = S - pad - at(e.impact) + pad - (k - 1) * 7;
          const isTop = top.includes(e.id);
          return (
            <g key={e.id} className={isTop ? 'pt-dot is-top' : 'pt-dot'}>
              <circle cx={x} cy={y} r={isTop ? 11 : 8} />
              <text x={x} y={y + 4} textAnchor="middle">{isTop ? '★' : ''}</text>
              <title>{`${e.context} (score ${frictionScore(e)})`}</title>
            </g>
          );
        })}
      </svg>
      <figcaption>
        <strong>Your top 2</strong>
        <ol>{top.map((id) => { const e = entries.find((x) => x.id === id); return <li key={id}>{e.context} <small>score {frictionScore(e)}</small></li>; })}</ol>
        <small>Score = how annoying × how often. These go into your empathy interviews.</small>
      </figcaption>
    </figure>
  );
}

/* -------------------------------------------------------------- Crazy 8s */

function Crazy8s({ data, save }) {
  const d = cleanCrazy8(data);
  const [running, setRunning] = useState(false);
  const [elapsed, reset] = useClock(running);
  const total = CRAZY8_SECONDS * 8;
  const panel = Math.min(7, Math.floor(elapsed / CRAZY8_SECONDS));
  const left = CRAZY8_SECONDS - (elapsed % CRAZY8_SECONDS);
  const lastPanel = useRef(-1);
  const inputs = useRef([]);
  const finishBtn = useRef(null);

  useEffect(() => {
    if (!running) return;
    if (elapsed >= total) {
      setRunning(false);
      beep(880, 0.4); buzz([30, 60, 30]);
      save({ ...d, sprints: d.sprints + 1 });
      confettiFrom(finishBtn.current, { big: crazy8Done({ ...d, sprints: 1 }) });
      lastPanel.current = -1;
      return;
    }
    if (panel !== lastPanel.current) {
      if (lastPanel.current >= 0) { beep(660, 0.15); buzz(); }
      lastPanel.current = panel;
      inputs.current[panel]?.focus();
    }
  }, [elapsed, running]); // eslint-disable-line react-hooks/exhaustive-deps

  const started = elapsed > 0;
  return (
    <div className="pt-tool">
      <p className="pt-hint">Sketch on folded A4 paper. Here, give each sketch a 3-word name. The timer moves you on every 60 seconds.</p>
      <div className="pt-sprint-bar">
        <span className="pt-clock" aria-live="off"><Timer size={16} aria-hidden="true" />{started ? `Panel ${panel + 1} · ${fmt(left)}` : '8 panels · 8:00'}</span>
        <span className="pb-meter pt-meter" aria-hidden="true"><span style={{ width: `${Math.min(100, (elapsed / total) * 100)}%` }} /></span>
        <button type="button" ref={finishBtn} className={running ? 'gh-btn gh-btn-sm' : 'gh-btn gh-btn-sm gh-btn-primary'} onClick={() => setRunning((r) => !r)}>
          {running ? <><Pause size={15} aria-hidden="true" />Pause</> : <><Play size={15} aria-hidden="true" />{started ? 'Resume' : 'Start sprint'}</>}
        </button>
        {started && !running && <button type="button" className="gh-btn gh-btn-ghost gh-btn-sm" onClick={reset}><RotateCcw size={15} aria-hidden="true" />Reset</button>}
      </div>
      <ol className="pt-panels">
        {CRAZY8_PANELS.map((c, i) => (
          <li key={i} className={`pt-panel${running && i === panel ? ' is-now' : ''}${d.panels[i].trim() ? ' is-named' : ''}`} data-kind={c.split(' ')[0].toLowerCase()}>
            <span className="pt-panel-head"><b>{i + 1}</b>{c}</span>
            <input ref={(el) => { inputs.current[i] = el; }} className="gh-input" maxLength={60} value={d.panels[i]} placeholder="Name this idea"
                   aria-label={`Panel ${i + 1} (${c}) idea name`}
                   onChange={(e) => save({ ...d, panels: d.panels.map((p, j) => (j === i ? e.target.value : p)) })} />
          </li>
        ))}
      </ol>
      <p className="pt-badge-progress">⚡ {crazy8Done(d) ? <strong>Crazy 8s Speed Sprinter unlocked</strong>
        : <>Name all 8 panels and finish one sprint for <strong>Crazy 8s Speed Sprinter</strong> ({d.panels.filter((p) => p.trim()).length}/8 named, {d.sprints} sprint{d.sprints === 1 ? '' : 's'})</>}</p>
    </div>
  );
}

/* --------------------------------------------------------- Unit economics */

function UnitEconomicsLab({ data, save }) {
  const d = cleanEconomics(data);
  const r = unitEconomics(d);
  const set = (p) => save({ ...d, ...p });
  const setItem = (i, p) => set({ items: d.items.map((it, j) => (j === i ? { ...it, ...p } : it)) });
  const [lo, hi] = r.band;

  return (
    <div className="pt-tool">
      <div className="pt-presets" role="group" aria-label="Start from an example product">
        <span className="pt-scale-label">Start from an example, then make it yours:</span>
        <div className="pt-chip-row">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" className="pt-chip" aria-pressed={d.presetId === p.id} onClick={() => save(presetEconomics(p))}
                    title={p.description}>
              {p.track === 'digital' ? '💻' : '🧵'} {p.name.replace(/\s*\(.*\)$/, '')}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-econ">
        <div className="pt-econ-inputs">
          <div className="pt-seg" role="group" aria-label="Product track">
            {['physical', 'digital'].map((t) => (
              <button key={t} type="button" aria-pressed={d.track === t} onClick={() => set({ track: t, presetId: null })}>
                {t === 'physical' ? '🧵 Physical' : '💻 Digital'}
              </button>
            ))}
          </div>

          <fieldset className="pt-fieldset">
            <legend>1. Cost of one unit (COGS)</legend>
            {d.items.map((it, i) => (
              <div key={i} className="pt-cost-row">
                <input className="gh-input" value={it.name} maxLength={60} placeholder="Item, e.g. zipper" aria-label={`Cost item ${i + 1}`}
                       onChange={(e) => setItem(i, { name: e.target.value })} />
                <label className="pt-num"><input className="gh-input" type="number" min="0" step="0.5" value={it.cost} aria-label={`Cost of item ${i + 1} in baht`}
                       onChange={(e) => setItem(i, { cost: e.target.value })} /><span>THB</span></label>
                <button type="button" className="gh-btn gh-btn-ghost gh-btn-sm pt-icon" aria-label={`Remove cost item ${i + 1}`}
                        onClick={() => set({ items: d.items.filter((_, j) => j !== i) })}><Trash2 size={14} aria-hidden="true" /></button>
              </div>
            ))}
            {d.items.length < COST_ITEMS_MAX && (
              <button type="button" className="gh-btn gh-btn-sm gh-btn-ghost" onClick={() => set({ items: [...d.items, { name: '', cost: 0 }] })}>
                <Plus size={14} aria-hidden="true" />Add cost item
              </button>
            )}
          </fieldset>

          <fieldset className="pt-fieldset">
            <legend>2. Gross margin: {Math.round(d.marginPct)}%</legend>
            <div className="pt-slider-wrap" style={{ '--lo': `${(lo / 95) * 100}%`, '--hi': `${(hi / 95) * 100}%` }}>
              <input type="range" min="0" max="95" step="0.5" value={d.marginPct} aria-label="Gross margin percent"
                     aria-valuetext={`${d.marginPct}% margin`} onChange={(e) => set({ marginPct: Number(e.target.value) })} />
            </div>
            <small className={r.inBand ? 'pt-ok' : 'pt-warn'}>
              {r.inBand ? `✓ Inside the ${d.track} benchmark (${lo}–${hi}%)` : `The ${d.track} benchmark is ${lo}–${hi}% (green band)`}
            </small>
          </fieldset>

          <fieldset className="pt-fieldset pt-grid2">
            <legend>3. Startup and market</legend>
            <label className="pt-field"><span>One-time startup costs</span>
              <span className="pt-num"><input className="gh-input" type="number" min="0" value={d.fixedTHB} onChange={(e) => set({ fixedTHB: e.target.value })} /><span>THB</span></span></label>
            <label className="pt-field"><span>Starting cash</span>
              <span className="pt-num"><input className="gh-input" type="number" min="0" value={d.cashTHB} onChange={(e) => set({ cashTHB: e.target.value })} /><span>THB</span></span></label>
            <label className="pt-field pt-span2"><span>Sales per week: {d.demandWeekly}</span>
              <input type="range" min="0" max="100" value={d.demandWeekly} onChange={(e) => set({ demandWeekly: Number(e.target.value) })} /></label>
          </fieldset>
        </div>

        <div className="pt-econ-out" aria-live="polite">
          <div className="pt-tiles">
            <Tile label="Unit floor cost" value={baht2(r.unitCost)} />
            <Tile label="Retail price" value={baht2(r.price)} strong />
            <Tile label="Profit per unit" value={baht2(r.profit)} />
            <Tile label="Break-even" value={r.breakEvenUnits == null ? '–' : `${r.breakEvenUnits} units`} strong />
          </div>
          <p className="pt-formula">
            Retail = {baht2(r.unitCost)} ÷ (1 − {(d.marginPct / 100).toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}) = <b>{baht2(r.price)}</b><br />
            Break-even = {baht(d.fixedTHB)} ÷ ({baht2(r.price)} − {baht2(r.unitCost)}) = <b>{r.breakEvenUnits ?? '–'} units</b>
          </p>
          <CashChart cash={r.cash} />
          <p className="pt-verdict">
            {r.weeksToBreakEven == null ? 'Set a cost, a margin above 0% and some weekly sales to see when you break even.'
              : r.weeksToBreakEven <= 12 ? `At ${d.demandWeekly} sales a week you pay back your startup costs in week ${r.weeksToBreakEven}. 🎉`
              : `At ${d.demandWeekly} sales a week it takes ${r.weeksToBreakEven} weeks, longer than the term. What could you change?`}
          </p>
          <p className="pt-badge-progress">📊 {data && r.itemised && r.inBadgeRange ? <strong>Unit Economics Prodigy unlocked</strong>
            : <>Break your cost into at least 2 named items, keep a 50–85% margin and reach break-even to unlock <strong>Unit Economics Prodigy</strong></>}</p>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, strong }) {
  return <div className={strong ? 'pt-tile is-strong' : 'pt-tile'}><small>{label}</small><b>{value}</b></div>;
}

function CashChart({ cash }) {
  const W = 320; const H = 150; const pad = 26;
  const min = Math.min(0, ...cash); const max = Math.max(1, ...cash);
  const x = (i) => pad + (i / (cash.length - 1)) * (W - pad - 22);
  const y = (v) => 8 + (1 - (v - min) / (max - min || 1)) * (H - pad - 8);
  const line = cash.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <figure className="pt-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Cash over the 12-week term: starts at ${baht(cash[0])}, ends at ${baht(cash.at(-1))}.`}>
        <line x1={pad} x2={W - 22} y1={y(0)} y2={y(0)} className="pt-zero" />
        <text x={pad - 4} y={y(0) + 4} textAnchor="end" className="pt-axis">0</text>
        <path d={`${line} L${x(cash.length - 1)},${y(0)} L${x(0)},${y(0)} Z`} className="pt-area" />
        <path d={line} className="pt-line" />
        {cash.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={2.5} className={v >= 0 ? 'pt-pt' : 'pt-pt is-neg'} />)}
        {[0, 4, 8, 12].map((w) => <text key={w} x={x(w)} y={H - 6} textAnchor="middle" className="pt-axis">wk {w}</text>)}
      </svg>
      <figcaption>Cash in hand each week, after paying startup costs in week 0.</figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------ Pitch arena */

const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

function PitchArena({ data, save }) {
  const d = cleanPitch(data);
  const [running, setRunning] = useState(false);
  const [elapsed, reset] = useClock(running);
  const [block, setBlock] = useState(0);
  const [block2At, setBlock2At] = useState(null);
  const [last, setLast] = useState(null);
  const stopBtn = useRef(null);
  const cum = PITCH_BLOCKS.reduce((a, b) => [...a, (a.at(-1) || 0) + b.sec], []);
  const cur = PITCH_BLOCKS[block];
  const blockLeft = cum[block] - elapsed;
  const C = 2 * Math.PI * 70;

  function next() {
    if (block < PITCH_BLOCKS.length - 1) {
      if (block === 0) setBlock2At(Math.round(elapsed));
      setBlock(block + 1); beep(660, 0.12);
    } else stop();
  }
  function stop() {
    setRunning(false);
    const run = { totalSec: Math.round(elapsed), block2AtSec: block2At, at: Date.now() };
    if (elapsed > 5) {
      save({ ...d, runs: [...d.runs, run] });
      setLast(run);
      if (runOnTime(run)) { confettiFrom(stopBtn.current, { big: true }); buzz([20, 40, 20]); }
    }
    setBlock(0); setBlock2At(null); reset();
  }

  return (
    <div className="pt-tool">
      <div className="pt-pitch">
        <div className="pt-ring" aria-hidden="true">
          <svg viewBox="0 0 160 160">
            {PITCH_BLOCKS.map((b, i) => {
              const startFrac = (cum[i] - b.sec) / PITCH_SECONDS;
              return <circle key={b.id} cx="80" cy="80" r="70" className={`pt-ring-seg s${i}`}
                             strokeDasharray={`${(b.sec / PITCH_SECONDS) * C - 3} ${C}`} strokeDashoffset={-startFrac * C} />;
            })}
            <circle cx="80" cy="80" r="70" className="pt-ring-prog" strokeDasharray={`${Math.min(1, elapsed / PITCH_SECONDS) * C} ${C}`} />
          </svg>
          <span className={elapsed > PITCH_SECONDS ? 'pt-ring-time is-over' : 'pt-ring-time'}>{fmt(elapsed)}<small>of 3:00</small></span>
        </div>
        <div className="pt-pitch-side">
          <ol className="pt-blocks">
            {PITCH_BLOCKS.map((b, i) => (
              <li key={b.id} className={`s${i}${running && i === block ? ' is-now' : ''}${running && i < block ? ' is-done' : ''}`}>
                <strong>{b.label}</strong><small>{b.sec}s · {b.cue}</small>
              </li>
            ))}
          </ol>
          {running && <p className={blockLeft < 0 ? 'pt-warn' : 'pt-hint'}>{blockLeft >= 0 ? `${Math.ceil(blockLeft)}s left in "${cur.label}"` : `${Math.ceil(-blockLeft)}s over on "${cur.label}". Move on!`}</p>}
          <div className="pt-actions">
            {!running
              ? <button type="button" className="gh-btn gh-btn-primary" onClick={() => { setLast(null); setRunning(true); }}><Play size={16} aria-hidden="true" />Start pitch</button>
              : <>
                  <button type="button" className="gh-btn gh-btn-accent" onClick={next}><SkipForward size={16} aria-hidden="true" />{block < 3 ? 'Next block' : 'Finish'}</button>
                  <button type="button" ref={stopBtn} className="gh-btn gh-btn-ghost" onClick={stop}><Square size={15} aria-hidden="true" />Stop</button>
                </>}
          </div>
          {last && (
            <p className={runOnTime(last) ? 'pt-ok' : 'pt-warn'} role="status">
              {runOnTime(last) ? `On time: ${fmt(last.totalSec)}, demo at ${fmt(last.block2AtSec)}. Ready for the arena!`
                : `${fmt(last.totalSec)} total${last.block2AtSec != null ? `, demo at ${fmt(last.block2AtSec)}` : ''}. Aim for 3:00 with the demo by 0:45.`}
            </p>
          )}
        </div>
      </div>
      {d.runs.length > 0 && (
        <ul className="pt-runs" aria-label="Your recent pitch runs">
          {d.runs.slice(-5).reverse().map((r) => <li key={r.at} className={runOnTime(r) ? 'is-ok' : ''}>{fmt(r.totalSec)}{runOnTime(r) ? ' ✓' : ''}</li>)}
        </ul>
      )}
      <QaDrill d={d} save={save} />
    </div>
  );
}

function QaDrill({ d, save }) {
  const [q, setQ] = useState(null);
  const [running, setRunning] = useState(false);
  const [elapsed, reset] = useClock(running);
  const [voice, setVoice] = useState(true);
  const avg = d.answers.length ? Math.round(d.answers.reduce((s, a) => s + a, 0) / d.answers.length) : null;

  useEffect(() => { if (running && elapsed >= QA_SECONDS) { beep(330, 0.3); } }, [running, elapsed >= QA_SECONDS]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { if (canSpeak()) window.speechSynthesis.cancel(); }, []);

  function ask() {
    const pool = QA_QUESTIONS.filter((x) => x !== q);
    const next = pool[Math.floor(Math.random() * pool.length)];
    setQ(next); reset(); setRunning(true);
    if (voice && canSpeak()) { window.speechSynthesis.cancel(); window.speechSynthesis.speak(new SpeechSynthesisUtterance(next)); }
  }
  function answered() {
    setRunning(false);
    save({ ...d, answers: [...d.answers, Math.round(elapsed)] });
    if (elapsed <= QA_SECONDS) buzz();
  }

  return (
    <section className="pt-qa" aria-label="20-second Q&A drill">
      <div className="pt-qa-head">
        <strong>20-second Q&A drill</strong>
        {canSpeak() && (
          <label className="pt-toggle"><input type="checkbox" checked={voice} onChange={(e) => setVoice(e.target.checked)} /><Volume2 size={14} aria-hidden="true" />Read questions aloud</label>
        )}
      </div>
      {q ? (
        <>
          <p className="pt-qa-q">“{q}”</p>
          <span className={`pt-qa-bar${elapsed > QA_SECONDS ? ' is-over' : ''}`} aria-hidden="true"><i style={{ width: `${Math.min(100, (elapsed / QA_SECONDS) * 100)}%` }} /></span>
          <div className="pt-actions">
            {running
              ? <button type="button" className="gh-btn gh-btn-primary" onClick={answered}>I answered ({Math.floor(elapsed)}s)</button>
              : <button type="button" className="gh-btn gh-btn-accent" onClick={ask}>Next question</button>}
          </div>
        </>
      ) : (
        <button type="button" className="gh-btn gh-btn-accent" onClick={ask}>Ask me a tough question</button>
      )}
      {avg != null && <p className="pt-hint">{d.answers.length} answered · average {avg}s {avg <= QA_SECONDS ? '✓ under 20s' : '(aim for under 20s)'}</p>}
    </section>
  );
}

/* --------------------------------------------------------- Founder panel */

/** Level, XP and Don's badge shelf, for the program hero. */
export function FounderPanel({ program, progress }) {
  const xp = founderXp(progress, program);
  const lvl = founderLevel(xp);
  const earned = new Set(earnedBadges(progress));
  return (
    <div className="pt-founder">
      <div className="pt-founder-level">
        <span className="pt-founder-n" aria-hidden="true">{lvl.level}</span>
        <div className="pb-grow">
          <strong>Level {lvl.level} · {lvl.title}</strong>
          <span className="pt-founder-bar" aria-hidden="true"><i style={{ width: `${lvl.pct}%` }} /></span>
          <small>{xp.toLocaleString()} XP{lvl.next ? ` · ${(lvl.next.minXp - xp).toLocaleString()} to ${lvl.next.title}` : ' · top level'}</small>
        </div>
      </div>
      <ul className="pt-shelf" aria-label="Badges">
        {BADGES.map((b) => {
          const got = earned.has(b.id);
          const how = autoBadge(b.id) ? b.condition : `Your coach awards this: ${b.condition}`;
          return (
            <li key={b.id} className={got ? 'pt-medal is-earned' : 'pt-medal'} title={`${b.name} (+${b.xpAward} XP). ${got ? b.description : how}`}>
              <span className="pt-medal-icon" aria-hidden="true">{b.icon}</span>
              {!got && <Lock size={11} className="pt-medal-lock" aria-hidden="true" />}
              <span className="pt-sr">{b.name}: {got ? 'earned' : `locked. ${how}`}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
