import { useId } from 'react';
import { GAUGE, gaugeReading, arcPath, polar, COMPLETION_UNIT } from './instrumentModel.js';

const CX = 130, CY = 124, R = 96, END = GAUGE.start + GAUGE.sweep;

/** The SPARK logo's four-point sparkle, centred on (x, y). Decorative. */
export const sparkPath = (x, y, r) => `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`;
export function Spark({ size = 22, className = '' }) {
  return <svg className={`ig-spark-mark ${className}`} viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false"><path d={sparkPath(12, 12, 11)} /></svg>;
}

/**
 * Completion dial for recorded sessions. Needle angle and arc length come from
 * the same reading as the printed numbers. No scale words, red zones or rates:
 * it shows how much is recorded, not how fast.
 */
export function SessionGauge({ label, done, total, milestones = [], unit = COMPLETION_UNIT }) {
  const reading = gaugeReading(done, total);
  if (!reading) return null;
  const step = Math.max(1, Math.ceil(reading.total / 48));
  const ticks = [];
  for (let i = 0; i <= reading.total; i += step) ticks.push(GAUGE.start + GAUGE.sweep * i / reading.total);
  const text = `${reading.done} of ${reading.total} ${unit} by you`;
  return <div className="ig-gauge sd-gauge" role="progressbar" aria-label={label} aria-valuemin={0}
    aria-valuemax={reading.total} aria-valuenow={reading.done} aria-valuetext={text}>
    <svg viewBox="0 0 260 200" aria-hidden="true" focusable="false">
      <path className="ig-track" d={arcPath(CX, CY, R, GAUGE.start, END)} />
      <path className="ig-value" d={arcPath(CX, CY, R, GAUGE.start, reading.angle)} />
      {ticks.map((angle, i) => {
        const [x0, y0] = polar(CX, CY, R - 12, angle), [x1, y1] = polar(CX, CY, R - 19, angle);
        return <line key={i} className="ig-tick" x1={x0} y1={y0} x2={x1} y2={y1} />;
      })}
      {milestones.map((mark) => {
        const [x0, y0] = polar(CX, CY, R + 9, mark.angle), [x1, y1] = polar(CX, CY, R - 22, mark.angle);
        const [lx, ly] = polar(CX, CY, R + 20, mark.angle);
        return <g key={mark.id} className="ig-milestone" data-complete={mark.complete || undefined}>
          <line x1={x0} y1={y0} x2={x1} y2={y1} />
          <circle cx={lx} cy={ly} r="8.5" /><text x={lx} y={ly + 3.5}>{mark.index + 1}</text>
        </g>;
      })}
      <g className="ig-needle" style={{ transform: `rotate(${reading.angle}deg)`, transformOrigin: `${CX}px ${CY}px` }}>
        <line x1={CX} y1={CY + 12} x2={CX} y2={CY - R + 26} />
      </g>
      <circle className="ig-pivot" cx={CX} cy={CY} r="6" />
      <path className="ig-pivot-spark" d={sparkPath(CX, CY, 15)} />
    </svg>
    <div className="ig-readout" aria-hidden="true"><strong>{reading.done}<span> of </span>{reading.total}</strong><small>{unit}</small></div>
  </div>;
}

/** An instrument with no verified source: no needle and no value, so it can't read as zero. */
export function UnavailableDial({ label, status, detail }) {
  const hatch = useId().replace(/:/g, '');
  return <div className="ig-gauge ig-unavailable" role="img" aria-label={`${label}: ${status}. ${detail}`}>
    <svg viewBox="0 0 260 200" aria-hidden="true" focusable="false">
      <defs><pattern id={hatch} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" /></pattern></defs>
      <path className="ig-hatch" d={arcPath(CX, CY, R, GAUGE.start, END)} stroke={`url(#${hatch})`} />
    </svg>
    <div className="ig-readout"><strong className="ig-status">{status}</strong><small>{detail}</small></div>
  </div>;
}

/** Personal steps, one segment per step. Self-reported check-ins, not assessment. */
export function StepMeter({ states, done = states?.filter(Boolean).length, total = states?.length, label }) {
  if (!total) return null;
  const segments = total <= 12;
  const on = (i) => states ? states[i] : i < done;
  return <div className="ig-steps" role="img" aria-label={label || `${done} of ${total} personal steps checked`}>
    {segments ? Array.from({ length: total }, (_, i) => <span key={i} data-on={on(i) || undefined} />)
      : <span className="ig-steps-fill" style={{ width: `${100 * done / total}%` }} />}
  </div>;
}
