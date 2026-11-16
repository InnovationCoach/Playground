import { useEffect, useRef, useState } from 'react';
import { Languages } from 'lucide-react';
import { playToolSound } from './sound.js';
import './tools.css';

/**
 * Small building blocks shared by the program toolkits. Everything here is
 * tap-first and keyboard-friendly: no free audio or video capture anywhere,
 * so the same tools are safe for under-13 learners.
 */

export function Slider({ label, value, min, max, step = 1, unit = '', onChange, hint, band }) {
  const style = band ? { '--lo': `${((band[0] - min) / (max - min)) * 100}%`, '--hi': `${((band[1] - min) / (max - min)) * 100}%` } : undefined;
  return (
    <label className="pt-field pt-slider">
      <span className="pt-slider-top"><span>{label}</span><b>{value}{unit}</b></span>
      <span className={band ? 'pt-slider-wrap' : undefined} style={style}>
        <input type="range" min={min} max={max} step={step} value={value} aria-valuetext={`${value}${unit}`}
               onChange={(e) => onChange(Number(e.target.value))} />
      </span>
      {hint && <small className="pt-hint">{hint}</small>}
    </label>
  );
}

export function Seg({ label, options, value, onChange }) {
  return (
    <div className="pt-seg pt-seg-wrap" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" aria-pressed={value === o.id} onClick={() => onChange(o.id)}>{o.label}</button>
      ))}
    </div>
  );
}

export function Tile({ label, value, strong, tone }) {
  return <div className={`pt-tile${strong ? ' is-strong' : ''}`} data-state={tone}><small>{label}</small><b>{value}</b></div>;
}

/** A 0-100 bar with a label; `state` is ok | warn | bad. `target` draws a goal mark. */
export function Gauge({ label, value, text: shown, state = 'ok', target }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="pt-gauge" data-state={state}>
      <span className="pt-gauge-top"><span>{label}</span><b>{shown ?? `${Math.round(pct)}%`}</b></span>
      <span className="pt-gauge-bar" role="img" aria-label={`${label}: ${shown ?? `${Math.round(pct)}%`}`}>
        <i style={{ width: `${pct}%` }} />
        {target != null && <em style={{ left: `${target}%` }} />}
      </span>
    </div>
  );
}

export function Check({ checked, onChange, children }) {
  return (
    <label className={checked ? 'pt-check is-on' : 'pt-check'}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}

/** Tap-to-choose chips. `multi` lets several be on at once. */
export function Chips({ label, options, value, onChange, multi = false }) {
  const on = (id) => (multi ? value.includes(id) : value === id);
  const tap = (id) => {
    if (multi) onChange(on(id) ? value.filter((x) => x !== id) : [...value, id]);
    else onChange(on(id) ? null : id);
  };
  return (
    <div role="group" aria-label={label}>
      <span className="pt-scale-label">{label}</span>
      <div className="pt-chip-row">
        {options.map((o) => (
          <button key={o.id} type="button" className="pt-chip" aria-pressed={on(o.id)} onClick={() => tap(o.id)}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}

/** English / Thai word cards for ESL learners. Closed by default so it never crowds the tool. */
export function Vocab({ terms }) {
  return (
    <details className="pt-vocab">
      <summary><Languages size={15} aria-hidden="true" />Word cards · คำศัพท์ ({terms.length})</summary>
      <ul>
        {terms.map((t) => (
          <li key={t.en}>
            <b>{t.en}</b>
            <span lang="th">{t.th}</span>
            {t.note && <small>{t.note}</small>}
          </li>
        ))}
      </ul>
    </details>
  );
}

/** One line saying how a badge is earned here: by this tool, or by the coach. */
export function BadgeLine({ badge, earned, auto, children }) {
  if (!badge) return null;
  return (
    <p className={earned ? 'pt-badge-progress is-earned' : 'pt-badge-progress'}>
      <span aria-hidden="true">{badge.icon}</span>{' '}
      {earned ? <strong>{badge.name} unlocked</strong>
        : auto ? <>{children} to unlock <strong>{badge.name}</strong> (+{badge.xpAward} XP).</>
        : <><strong>{badge.name}</strong> is awarded by your coach: {children}</>}
    </p>
  );
}

/** A model, not a measurement: say so wherever a simulator shows numbers. */
export function ModelNote({ children }) {
  return <p className="pt-model"><b>Model, not a measurement.</b> {children}</p>;
}

/** Play 'ding' once each time `ok` turns true (not on first render). */
export function useDing(ok) {
  const prev = useRef(ok);
  useEffect(() => {
    if (ok && !prev.current) playToolSound('ding');
    prev.current = ok;
  }, [ok]);
}

/** Elapsed seconds while `running`; `reset()` returns to zero. */
export function useTicker(running, stepMs = 200) {
  const [elapsed, setElapsed] = useState(0);
  const base = useRef(0);
  useEffect(() => {
    if (!running) { base.current = elapsed; return undefined; }
    const t0 = performance.now();
    const id = setInterval(() => setElapsed(base.current + (performance.now() - t0) / 1000), stepMs);
    return () => clearInterval(id);
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps
  const reset = () => { base.current = 0; setElapsed(0); };
  return [elapsed, reset];
}

export const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
