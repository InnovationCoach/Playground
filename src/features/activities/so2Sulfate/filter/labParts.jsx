/**
 * Presentational pieces for the filter lab: dialogs, the price formula, the
 * sweep chart, and the history and ledger tables.
 */
import { useMemo, useState } from 'react';
import { explainQuote, formatCredits, WHY_COSTS_MORE, ACTIONS } from './pricing.js';
import { MODEL_OUTPUT } from './filterModel.js';

export const GLOSSARY = {
  au: {
    title: 'Au nanoparticle',
    text: 'A cluster of a few hundred to many thousands of gold atoms, a few nanometres across. Bulk gold is famously unreactive, but gold nanoparticles on an oxide support can bind and activate molecules at their edges. In this model the gold is a catalyst: it is never consumed.'
  },
  tio2: {
    title: 'TiO₂ support',
    text: 'Titanium dioxide, the solid the gold particles sit on. It is not just a holder: electronic interaction between Au and TiO₂, and oxygen at the oxide surface, are thought to make the Au/TiO₂ perimeter the reactive region. Set the support to inert in the catalyst comparison to see the model without that effect.'
  },
  so2: {
    title: 'SO₂ (sulfur dioxide)',
    text: 'A toxic gas released by burning sulfur-containing fuels. Its sulfur is in the +4 oxidation state. The filter\'s job in this model is to capture it and oxidise it to sulfate, where sulfur is +6.'
  },
  so3: {
    title: 'SO₃-like intermediate (SO₃*)',
    text: 'A surface species formed after SO₂* is oxidised. Sulfur is now +6. The asterisk means it is bound to a surface site. This is a simplified intermediate: real surfaces can hold several different sulfur-oxygen species.'
  },
  so4: {
    title: 'SO₄²⁻ (sulfate)',
    text: 'The product. Sulfur is +6, bonded to four oxygens, with a 2− charge. In the model it forms on the surface (SO₄*), then leaves in the water film into the sulfate-containing output. Sulfate that stays on the surface blocks sites.'
  },
  adsorption: {
    title: 'Adsorption',
    text: 'Binding of a gas molecule onto a surface site: SO₂ + * → SO₂*. Nothing happens to SO₂ in this model until it adsorbs. Adsorption is reversible, and higher temperature makes SO₂* leave again faster.'
  },
  oxidation: {
    title: 'Oxidation',
    text: 'Loss of electrons. Here sulfur goes from +4 to +6, so each SO₂ gives up 2 electrons. The simplified equation SO₂ + 2H₂O → SO₄²⁻ + 4H⁺ + 2e⁻ shows where the extra oxygen (water) and the electrons go. It does not show what accepts the electrons in a real filter (often O₂).'
  },
  surface: {
    title: 'Catalytic surface',
    text: 'The surface where adsorption and reaction happen. More catalytic area means more sites. A catalyst speeds a reaction without being used up, but its sites can be blocked by products that do not leave.'
  },
  h2o: {
    title: 'Water (H₂O)',
    text: 'In the conceptual pathway, water supplies the extra oxygen that turns SO₃* into sulfate, and carries sulfate away from the surface. Set water availability to 0 and the model shows the pathway stall at SO₃*.'
  },
  site: {
    title: 'Available catalytic site',
    text: 'A free place on the surface where an SO₂ molecule can bind. Bright green sites sit at the Au/TiO₂ perimeter, where the model puts the activity. When every site is occupied, capture slows.'
  },
  unconverted: {
    title: 'Unconverted SO₂',
    text: 'SO₂ that passed through the filter without adsorbing. Faster gas flow, a thinner filter, fewer sites or blocked sites all let more through.'
  }
};

export function Modal({ title, tone = 'info', children, onClose, actions }) {
  return (
    <div className="gf-modal-back" role="presentation" onClick={onClose}>
      <div className={`gf-modal gf-modal-${tone}`} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <div className="gf-modal-body">{children}</div>
        <div className="gf-modal-actions">{actions}</div>
      </div>
    </div>
  );
}

export function Formula({ q }) {
  const { parts, formula } = explainQuote(q);
  return (
    <div className="gf-formula">
      <ul>
        {parts.map((p) => <li key={p.label}><span>{p.label}</span><b>{p.value}</b></li>)}
      </ul>
      <code>{formula}</code>
    </div>
  );
}

export function WhyCost({ action, onOpen }) {
  if (!WHY_COSTS_MORE[action]) return null;
  return <button type="button" className="gf-why" onClick={() => onOpen(action)}>Why does this cost more?</button>;
}

export function WhyModal({ action, onClose }) {
  return (
    <Modal title={`Why does ${ACTIONS[action].label.toLowerCase()} cost more?`} onClose={onClose} actions={<button type="button" className="gf-btn" onClick={onClose}>Close</button>}>
      <p>{WHY_COSTS_MORE[action]}</p>
      <p className="gf-muted">These are virtual simulation credits. They show how computing effort adds up. They are not real prices.</p>
    </Modal>
  );
}

/** Small x/y chart for sweeps and the performance graph. */
export function XYChart({ title, xLabel, yLabel, points, color = '#7dd3fc', scatter = false }) {
  const W = 360, H = 200, M = { l: 46, r: 12, t: 12, b: 34 };
  const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
  const x0 = Math.min(...xs, 0), x1 = Math.max(...xs, 1);
  const y1 = Math.max(1, ...ys) * 1.08;
  const X = (v) => M.l + ((v - x0) / (x1 - x0 || 1)) * (W - M.l - M.r);
  const Y = (v) => H - M.b - (v / y1) * (H - M.t - M.b);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join('');
  return (
    <figure className="gf-xy">
      <figcaption>{title}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}. ${MODEL_OUTPUT}.`}>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={M.l} x2={W - M.r} y1={Y(f * y1)} y2={Y(f * y1)} className="so2-grid" />
            <text x={M.l - 6} y={Y(f * y1) + 3} className="so2-tick" textAnchor="end">{(f * y1).toFixed(y1 < 10 ? 1 : 0)}</text>
          </g>
        ))}
        {[x0, (x0 + x1) / 2, x1].map((v) => (
          <text key={v} x={X(v)} y={H - M.b + 14} className="so2-tick" textAnchor="middle">{Number(v.toPrecision(3))}</text>
        ))}
        <text x={(M.l + W - M.r) / 2} y={H - 4} className="so2-axis-label" textAnchor="middle">{xLabel}</text>
        <text x={12} y={(M.t + H - M.b) / 2} className="so2-axis-label" textAnchor="middle" transform={`rotate(-90 12 ${(M.t + H - M.b) / 2})`}>{yLabel}</text>
        {!scatter && <path d={d} fill="none" stroke={color} strokeWidth="2" />}
        {points.map((p, i) => (
          <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={scatter ? 4.5 : 3} fill={color}>
            <title>{`${p.label ? `${p.label}: ` : ''}${p.x} → ${p.y.toFixed(1)}`}</title>
          </circle>
        ))}
      </svg>
      <span className="so2-sim-tag">{MODEL_OUTPUT}</span>
    </figure>
  );
}

const pad = (n) => String(n).padStart(2, '0');
export const fmtDate = (d) => `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
export const fmtTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const tsDate = (ts) => (ts?.toDate ? ts.toDate() : ts instanceof Date ? ts : new Date());

export function csv(rows) {
  return rows.map((r) => r.map((v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(',')).join('\n');
}

export function download(filename, content, type = 'text/csv') {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const HISTORY_COLS = [
  { key: 'label', label: 'Run ID' },
  { key: 'date', label: 'Date' },
  { key: 'time', label: 'Time' },
  { key: 'so2', label: 'SO₂', num: true },
  { key: 'temp', label: 'Temperature', num: true },
  { key: 'flow', label: 'Flow rate', num: true },
  { key: 'au', label: 'Au loading', num: true },
  { key: 'duration', label: 'Duration', num: true },
  { key: 'conversion', label: 'Conversion', num: true },
  { key: 'sulfate', label: 'Sulfate output', num: true },
  { key: 'cost', label: 'Total cost', num: true },
  { key: 'costPerPct', label: 'Cost / 1% conv.', num: true }
];

/** Flatten runs + ledger into history rows. RUN-0001 is the oldest run. */
export function historyRows(runs, costByRun) {
  const ordered = [...runs].sort((a, b) => a.createdMs - b.createdMs);
  return ordered.map((r, i) => {
    const d = new Date(r.createdMs);
    const s = r.result?.summary;
    const cost = costByRun[r.runId] || r.startCost || 0;
    return {
      id: r.runId,
      label: `RUN-${String(i + 1).padStart(4, '0')}`,
      date: fmtDate(d),
      time: fmtTime(d),
      ms: r.createdMs,
      so2: r.parameters?.so2Ppm,
      temp: r.parameters?.temperatureK,
      flow: r.parameters?.flowLpm,
      au: r.parameters?.auLoading,
      duration: r.parameters?.durationMin,
      conversion: s ? s.conversionPct : null,
      sulfate: s ? s.sulfateUg : null,
      cost,
      costPerPct: s && s.conversionPct > 0 ? cost / s.conversionPct : null,
      complete: Boolean(s),
      run: r
    };
  });
}

export function HistoryTable({ rows }) {
  const [sort, setSort] = useState({ key: 'ms', dir: -1 });
  const [text, setText] = useState('');
  const [minConv, setMinConv] = useState('');
  const [onlyComplete, setOnlyComplete] = useState(false);

  const shown = useMemo(() => {
    const t = text.trim().toLowerCase();
    const mc = Number(minConv);
    const key = sort.key === 'date' || sort.key === 'time' ? 'ms' : sort.key;
    return rows
      .filter((r) => !t || `${r.label} ${r.date} ${r.so2} ${r.temp} ${r.flow} ${r.au}`.toLowerCase().includes(t))
      .filter((r) => !minConv || (r.conversion != null && r.conversion >= mc))
      .filter((r) => !onlyComplete || r.complete)
      .sort((a, b) => {
        const va = a[key], vb = b[key];
        if (va == null) return 1;
        if (vb == null) return -1;
        return (va > vb ? 1 : va < vb ? -1 : 0) * sort.dir;
      });
  }, [rows, sort, text, minConv, onlyComplete]);

  const head = (c) => (
    <th key={c.key} aria-sort={sort.key === c.key ? (sort.dir > 0 ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={() => setSort((s) => ({ key: c.key, dir: s.key === c.key ? -s.dir : -1 }))}>
        {c.label}{sort.key === c.key ? (sort.dir > 0 ? ' ▲' : ' ▼') : ''}
      </button>
    </th>
  );

  return (
    <div>
      <div className="gf-filters">
        <label>Search <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Run ID, date, value…" /></label>
        <label>Min. conversion % <input type="number" min="0" max="100" value={minConv} onChange={(e) => setMinConv(e.target.value)} /></label>
        <label className="gf-check"><input type="checkbox" checked={onlyComplete} onChange={(e) => setOnlyComplete(e.target.checked)} /> Completed runs only</label>
      </div>
      <div className="gf-table-scroll">
        <table className="gf-table">
          <thead><tr>{HISTORY_COLS.map(head)}</tr></thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id}>
                <td><code>{r.label}</code></td>
                <td>{r.date}</td>
                <td>{r.time}</td>
                <td>{r.so2} ppm</td>
                <td>{r.temp} K</td>
                <td>{r.flow} L/min</td>
                <td>{r.au}% Au</td>
                <td>{r.duration} min</td>
                <td>{r.conversion != null ? <>{r.conversion.toFixed(1)}% <small className="gf-tag">MODEL OUTPUT</small></> : <span className="gf-muted">not completed</span>}</td>
                <td>{r.sulfate != null ? `${r.sulfate.toPrecision(3)} µg` : '—'}</td>
                <td>{formatCredits(r.cost)}</td>
                <td>{r.costPerPct != null ? `$${r.costPerPct.toFixed(2)}` : '—'}</td>
              </tr>
            ))}
            {!shown.length && <tr><td colSpan={HISTORY_COLS.length} className="gf-muted">No runs match.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function LedgerTable({ rows, max = 200 }) {
  return (
    <div className="gf-table-scroll gf-ledger">
      <table className="gf-table">
        <thead><tr><th>Date</th><th>Time</th><th>Action</th><th>Cost</th><th>Balance</th><th>Formula</th></tr></thead>
        <tbody>
          {rows.slice(0, max).map((t) => {
            const d = tsDate(t.timestamp);
            const credit = t.action === 'RESET_BUDGET';
            return (
              <tr key={t.transactionId || t.id}>
                <td>{fmtDate(d)}</td>
                <td>{fmtTime(d)}</td>
                <td>{t.label || t.action}</td>
                <td className={credit ? 'gf-credit' : 'gf-debit'}>{credit ? `reset → ${formatCredits(t.balanceAfter)}` : `−${formatCredits(t.cost)}`}</td>
                <td>{formatCredits(t.balanceAfter)}</td>
                <td><code>{credit ? '—' : ledgerFormula(t)}</code></td>
              </tr>
            );
          })}
          {!rows.length && <tr><td colSpan={6} className="gf-muted">No transactions yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export function ledgerFormula(t) {
  const f = [`$${t.baseCost}`];
  if (t.quantity !== 1) f.push(t.quantity);
  for (const k of ['resolutionMultiplier', 'particleMultiplier', 'timeMultiplier', 'nanoparticleMultiplier']) if (t[k] !== 1) f.push(t[k]);
  return `${f.join(' × ')} = $${t.cost}`;
}

export function ledgerCsv(rows) {
  return csv([
    ['transactionId', 'date', 'time', 'action', 'label', 'baseCost', 'quantity', 'resolutionMultiplier', 'particleMultiplier', 'timeMultiplier', 'nanoparticleMultiplier', 'cost', 'balanceBefore', 'balanceAfter', 'simulationRunId', 'note'],
    ...[...rows].reverse().map((t) => {
      const d = tsDate(t.timestamp);
      return [t.transactionId, fmtDate(d), fmtTime(d), t.action, t.label, t.baseCost, t.quantity, t.resolutionMultiplier, t.particleMultiplier, t.timeMultiplier, t.nanoparticleMultiplier, t.cost, t.balanceBefore, t.balanceAfter, t.simulationRunId || '', 'virtual simulation credits'];
    })
  ]);
}
