import { completionReading, COMPLETION_UNIT } from './instrumentModel.js';

const R = 52, CIRCLE = 2 * Math.PI * R;

/** The SPARK logo's four-point sparkle, centred on (x, y). Decorative. */
export const sparkPath = (x, y, r) => `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`;
export function Spark({ size = 22, className = '' }) {
  return <svg className={`ig-spark-mark ${className}`} viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false"><path d={sparkPath(12, 12, 11)} /></svg>;
}

/**
 * A plain circle chart for recorded sessions, with the count written in words.
 * It shows how much is done, not how fast.
 */
export function SessionRing({ label, done, total, unit = COMPLETION_UNIT }) {
  const reading = completionReading(done, total);
  if (!reading) return null;
  const left = reading.total - reading.done;
  const status = left === 0 ? 'All done' : reading.done === 0 ? 'Not started yet' : `${left} to go`;
  return <div className="ig-ring" role="progressbar" aria-label={label} aria-valuemin={0}
    aria-valuemax={reading.total} aria-valuenow={reading.done} aria-valuetext={`${reading.done} of ${reading.total} ${unit} by you`}>
    <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <circle className="ig-ring-track" cx="60" cy="60" r={R} />
      {reading.done > 0 && <circle className="ig-ring-value" cx="60" cy="60" r={R} strokeDasharray={`${CIRCLE * reading.fraction} ${CIRCLE}`} transform="rotate(-90 60 60)" />}
    </svg>
    <div className="ig-readout" aria-hidden="true">
      <strong>{reading.done} of {reading.total}</strong>
      <small>sessions done</small>
      <em>{status}</em>
    </div>
  </div>;
}

/** A chart with no verified source: an empty dashed circle, so it can't read as zero. */
export function NotConnectedRing({ label, status, detail }) {
  return <div className="ig-ring ig-ring-empty" role="img" aria-label={`${label}: ${status}. ${detail}`}>
    <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false"><circle className="ig-ring-track" cx="60" cy="60" r={R} /></svg>
    <div className="ig-readout"><strong>{status}</strong></div>
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
