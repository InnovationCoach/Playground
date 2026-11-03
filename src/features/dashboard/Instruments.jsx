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
 * it shows how much is recorded, not how fast. One lit cell per recorded
 * session (a continuous arc once there are too many to tell apart).
 */
export function SessionGauge({ label, done, total, milestones = [], unit = COMPLETION_UNIT }) {
  const uid = useId().replace(/:/g, '');
  const reading = gaugeReading(done, total);
  if (!reading) return null;
  const cellular = reading.total <= 40;
  const span = GAUGE.sweep / reading.total, gap = cellular && reading.total > 1 ? Math.min(2.4, span * 0.3) : 0;
  const cells = cellular ? Array.from({ length: reading.total }, (_, i) => ({
    d: arcPath(CX, CY, R, GAUGE.start + span * i + gap / 2, GAUGE.start + span * (i + 1) - gap / 2), on: i < reading.done
  })) : [];
  const nextMark = milestones.find((mark) => !mark.complete);
  const left = reading.total - reading.done;
  const status = left === 0 ? 'All sessions marked' : reading.done === 0 ? 'Ready to start' : `${left} to go`;
  const text = `${reading.done} of ${reading.total} ${unit} by you`;
  const tip = polar(CX, CY, R, reading.angle);
  return <div className="ig-gauge sd-gauge" role="progressbar" aria-label={label} aria-valuemin={0}
    aria-valuemax={reading.total} aria-valuenow={reading.done} aria-valuetext={text} data-full={left === 0 || undefined}>
    <svg viewBox="0 0 260 200" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${uid}-arc`} gradientUnits="userSpaceOnUse" x1={CX - R} y1="0" x2={CX + R} y2="0">
          <stop offset="0" className="ig-stop-a" /><stop offset=".5" className="ig-stop-b" /><stop offset="1" className="ig-stop-c" />
        </linearGradient>
        <radialGradient id={`${uid}-core`}><stop offset="0" className="ig-stop-glow" /><stop offset="1" className="ig-stop-glow" stopOpacity="0" /></radialGradient>
        <filter id={`${uid}-glow`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5" /></filter>
      </defs>
      <circle className="ig-core" cx={CX} cy={CY} r={R - 20} fill={`url(#${uid}-core)`} />
      <path className="ig-inner-ring" d={arcPath(CX, CY, R - 24, GAUGE.start, END)} />
      {cellular ? <>
        <g className="ig-cells">{cells.map((cell, i) => <path key={i} className="ig-cell" d={cell.d} />)}</g>
        <g className="ig-glow" filter={`url(#${uid}-glow)`}>{cells.map((cell, i) => cell.on && <path key={i} d={cell.d} stroke={`url(#${uid}-arc)`} />)}</g>
        <g className="ig-value">{cells.map((cell, i) => cell.on && <path key={i} className="ig-cell-on" style={{ '--i': i }} d={cell.d} stroke={`url(#${uid}-arc)`} />)}</g>
      </> : <>
        <path className="ig-track" d={arcPath(CX, CY, R, GAUGE.start, END)} />
        <path className="ig-glow" filter={`url(#${uid}-glow)`} d={arcPath(CX, CY, R, GAUGE.start, reading.angle)} stroke={`url(#${uid}-arc)`} />
        <path className="ig-value" d={arcPath(CX, CY, R, GAUGE.start, reading.angle)} stroke={`url(#${uid}-arc)`} />
      </>}
      {milestones.map((mark) => {
        const [lx, ly] = polar(CX, CY, R + 24, mark.angle);
        return <g key={mark.id} className="ig-milestone" data-complete={mark.complete || undefined} data-next={mark === nextMark || undefined}>
          {mark === nextMark && <circle className="ig-milestone-pulse" cx={lx} cy={ly} r="11" />}
          <circle cx={lx} cy={ly} r="10" style={mark.complete ? { fill: `url(#${uid}-arc)` } : undefined} />
          {mark.complete ? <path className="ig-milestone-check" d={`M${lx - 4} ${ly}l2.8 2.8 5.2-5.6`} /> : <text x={lx} y={ly + 3.6}>{mark.index + 1}</text>}
        </g>;
      })}
      <g className="ig-needle" style={{ transform: `rotate(${reading.angle}deg)`, transformOrigin: `${CX}px ${CY}px` }}>
        <path d={`M${CX} ${CY - R + 14}L${CX - 5.5} ${CY - R + 27}L${CX + 5.5} ${CY - R + 27}Z`} fill={`url(#${uid}-arc)`} />
      </g>
      <circle className="ig-tip-halo" cx={tip[0]} cy={tip[1]} r="13" />
      <circle className="ig-tip" cx={tip[0]} cy={tip[1]} r="6.5" />
    </svg>
    <div className="ig-readout" aria-hidden="true">
      <strong><b>{reading.done}</b><span> / {reading.total}</span></strong>
      <small>{unit}</small>
      <em className="ig-chip">{status}</em>
    </div>
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
