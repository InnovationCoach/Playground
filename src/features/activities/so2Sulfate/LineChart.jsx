/**
 * Small SVG line chart for the SO₂ simulation.
 *
 * Axes are fixed to the whole simulated run (x: 0..duration, y: 0..max over the
 * full trajectory), and the line is revealed up to the clock. Rescaling as the
 * line grew would make every curve look like it was racing to the top corner.
 *
 * Every chart carries the "Simulated / illustrative model output" tag - it is
 * part of the chart, not something a caller can forget to add.
 */
import { useMemo, useRef, useState } from 'react';
import { OUTPUT_LABEL } from './so2Model.js';

const W = 360;
const H = 190;
const M = { top: 12, right: 14, bottom: 30, left: 46 };
const IW = W - M.left - M.right;
const IH = H - M.top - M.bottom;

function niceMax(v) {
  if (!(v > 0)) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / exp;
  const step = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((c) => n <= c + 1e-9);
  return step * exp;
}

export function fmt(v) {
  if (!Number.isFinite(v)) return '—';
  const a = Math.abs(v);
  if (a === 0) return '0';
  if (a >= 100) return v.toFixed(0);
  if (a >= 1) return v.toFixed(2);
  if (a >= 0.001) return v.toFixed(3);
  return v.toExponential(1);
}

/**
 * @param {object} props
 * @param {string} props.title
 * @param {string} props.unit
 * @param {{id:string,label:string,color:string,samples:object[]}[]} props.series
 * @param {string} props.field    key read from each sample
 * @param {number} props.tNow     simulation clock
 * @param {number} props.tMax     run duration
 * @param {number} [props.yCap]   fixed y maximum (e.g. 1 for a fraction)
 * @param {string} [props.note]
 */
export function LineChart({ title, unit, series, field, tNow, tMax, yCap, note, xLabel = 'simulated time (τ)', tUnit = 'τ', tag = OUTPUT_LABEL }) {
  const svgRef = useRef(null);
  const [hoverT, setHoverT] = useState(null);

  const yMax = useMemo(() => {
    if (yCap) return yCap;
    let m = 0;
    for (const s of series) for (const p of s.samples) m = Math.max(m, p[field]);
    return niceMax(m * 1.05);
  }, [series, field, yCap]);

  const x = (t) => M.left + (t / tMax) * IW;
  const y = (v) => M.top + IH - (Math.max(0, v) / yMax) * IH;

  const paths = series.map((s) => {
    let d = '';
    let last = null;
    for (const p of s.samples) {
      if (p.t > tNow + 1e-9) break;
      d += `${d ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p[field]).toFixed(1)}`;
      last = p;
    }
    return { ...s, d, last };
  });

  const ticksY = [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax);
  const ticksX = [0, 0.25, 0.5, 0.75, 1].map((f) => f * tMax);

  // Hover reads the nearest revealed sample; nothing past the clock is shown,
  // so the tooltip cannot leak the ending of a run the student is watching.
  const hover = hoverT == null ? null : series.map((s) => {
    const i = Math.round((Math.min(hoverT, tNow) / tMax) * (s.samples.length - 1));
    return { ...s, p: s.samples[Math.max(0, Math.min(s.samples.length - 1, i))] };
  });

  function onMove(e) {
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const t = ((px - M.left) / IW) * tMax;
    setHoverT(t < 0 || t > tMax ? null : t);
  }

  const hx = hover ? x(hover[0].p.t) : null;

  return (
    <figure className="so2-chart">
      <figcaption>
        <span className="so2-chart-title">{title}</span>
        <span className="so2-chart-unit">{unit}</span>
      </figcaption>
      {series.length > 1 && (
        <div className="so2-legend">
          {series.map((s) => (
            <span key={s.id}><i style={{ background: s.color }} />{s.label}</span>
          ))}
        </div>
      )}
      <div className="so2-chart-plot">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`${title}, ${OUTPUT_LABEL}`}
          onMouseMove={onMove}
          onMouseLeave={() => setHoverT(null)}
        >
          {ticksY.map((v) => (
            <g key={`y${v}`}>
              <line x1={M.left} x2={W - M.right} y1={y(v)} y2={y(v)} className="so2-grid" />
              <text x={M.left - 6} y={y(v) + 3} className="so2-tick" textAnchor="end">{fmt(v)}</text>
            </g>
          ))}
          {ticksX.map((t) => (
            <text key={`x${t}`} x={x(t)} y={H - M.bottom + 14} className="so2-tick" textAnchor="middle">{t.toFixed(tMax < 10 ? 1 : 0)}</text>
          ))}
          <text x={M.left + IW / 2} y={H - 3} className="so2-axis-label" textAnchor="middle">{xLabel}</text>
          <line x1={M.left} x2={W - M.right} y1={M.top + IH} y2={M.top + IH} className="so2-axis" />

          {tNow > 0 && tNow < tMax && (
            <line x1={x(tNow)} x2={x(tNow)} y1={M.top} y2={M.top + IH} className="so2-now" />
          )}

          {paths.map((s) => (
            <g key={s.id}>
              <path d={s.d} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              {s.last && (
                <circle cx={x(s.last.t)} cy={y(s.last[field])} r="4" fill={s.color} stroke="var(--so2-surface)" strokeWidth="2" />
              )}
            </g>
          ))}

          {hover && (
            <g pointerEvents="none">
              <line x1={hx} x2={hx} y1={M.top} y2={M.top + IH} className="so2-crosshair" />
              {hover.map((s) => (
                <circle key={s.id} cx={hx} cy={y(s.p[field])} r="4" fill={s.color} stroke="var(--so2-surface)" strokeWidth="2" />
              ))}
            </g>
          )}
        </svg>
        {hover && (
          <div
            className="so2-tooltip"
            style={{ left: `${(hx / W) * 100}%`, transform: hx > W * 0.6 ? 'translateX(calc(-100% - 10px))' : 'translateX(10px)' }}
          >
            <div className="so2-tooltip-t">{tUnit === 'τ' ? `τ = ${hover[0].p.t.toFixed(1)}` : `${hover[0].p.t.toFixed(2)} ${tUnit}`}</div>
            {hover.map((s) => (
              <div key={s.id}>
                <i style={{ background: s.color }} />
                {series.length > 1 ? `${s.label}: ` : ''}<b>{fmt(s.p[field])}</b> {unit}
              </div>
            ))}
            <div className="so2-tooltip-note">simulated</div>
          </div>
        )}
      </div>
      <div className="so2-chart-foot">
        <span className="so2-sim-tag">{tag}</span>
        {note ? <span className="so2-chart-note">{note}</span> : null}
      </div>
    </figure>
  );
}
