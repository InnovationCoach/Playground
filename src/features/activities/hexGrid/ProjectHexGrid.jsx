/**
 * Activity 8 - Project Hex-Grid.
 *
 * The class project brief: Bangkok is drowning, so the team designs a
 * self-sufficient floating city of hexagonal platforms, each learner owning one
 * system. This screen gives each role a working model of the whole city, so an
 * idea can be tested rather than asserted:
 *
 *   Mission  - the real flood data, and pick your role
 *   Build    - edit the hex map; every system recalculates live
 *   Test     - lock a baseline, write a hypothesis, change the city, run it
 *   Lab log  - every test kept, with what moved for teammates
 *   Sources  - every number's origin, and what the model leaves out
 *
 * The model lives in hexGridModel.js; this file is presentation only.
 */
import { useMemo, useState } from 'react';
import {
  MODULES, CROPS, ANIMALS, ROLES, METRICS, PARAMS, GROUPS, K, LIMITATIONS, MODEL_VERSION,
  simulate, evaluateHypothesis, describeChanges, showMetric, hexKey, starterCity
} from './hexGridModel.js';
import { SOURCES, BANGKOK_FACTS } from './hexGridSources.js';
import { HexMap, OVERLAYS } from './HexMap.jsx';
import { useHexGridProject } from './useHexGridProject.js';
import { HowToPlay } from './HowToPlay.jsx';
import './hexGrid.css';

const TABS = [
  { id: 'mission', label: '🌊 Mission' },
  { id: 'guide', label: '📖 How to play' },
  { id: 'build', label: '🗺️ Build & explore' },
  { id: 'test', label: '🔬 Test a hypothesis' },
  { id: 'log', label: '📓 Lab log' },
  { id: 'sources', label: '📚 Sources & limits' }
];

const EXPECT = { increase: 'go up', decrease: 'go down', same: 'stay about the same' };
const ARROW = { increase: '▲', decrease: '▼', same: '●' };

// --- small pieces ------------------------------------------------------------

function Tag({ tag, src }) {
  if (!tag) return null;
  const s = src ? SOURCES[src] : null;
  const cls = { DATA: 'data', ESTIMATE: 'est', ASSUMPTION: 'you' }[tag];
  const text = { DATA: 'DATA', ESTIMATE: 'ESTIMATE', ASSUMPTION: 'YOUR ASSUMPTION' }[tag];
  return s
    ? <a className={`hx-tag ${cls}`} href={s.url} target="_blank" rel="noreferrer" title={s.label}>{text} ↗</a>
    : <span className={`hx-tag ${cls}`}>{text}</span>;
}

/** good | ok | bad for colouring a metric. Thresholds are display only. */
function health(id, v, params) {
  if (!Number.isFinite(v)) return id === 'maxWalk' ? 'bad' : 'ok';
  const m = METRICS[id];
  if (id === 'maxLoad') return v <= 85 ? 'good' : v <= 100 ? 'ok' : 'bad';
  if (m.unit === '%' && m.better === 'higher') return v >= 100 ? 'good' : v >= 60 ? 'ok' : 'bad';
  if (id === 'peoplePerRoom') return v <= K.crowdingLimit.v ? 'good' : 'bad';
  if (id === 'greenPerPerson') return v >= params.greenTarget ? 'good' : 'ok';
  if (['overloaded', 'housingShortfall', 'nuisanceHomes'].includes(id)) return v === 0 ? 'good' : 'bad';
  if (id === 'energySurplus') return v >= 0 ? 'good' : 'bad';
  if (id === 'foodGroups') return v >= 4 ? 'good' : v >= 2 ? 'ok' : 'bad';
  return 'ok';
}

function MetricCard({ id, sim, params, open, onToggle }) {
  const v = sim.metrics[id];
  const m = METRICS[id];
  const h = health(id, v, params);
  const bar = m.unit === '%' && Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : null;
  return (
    <div className={`hx-metric ${h}`}>
      <button type="button" className="hx-metric-top" onClick={onToggle} aria-expanded={open}>
        <span className="hx-metric-v">{showMetric(id, v)}</span>
        <span className="hx-metric-k">{m.label}</span>
        {bar !== null ? <span className="hx-bar"><span style={{ width: `${bar}%` }} /></span> : null}
        <span className="hx-how">{open ? 'Hide working ▴' : 'How is this worked out? ▾'}</span>
      </button>
      {open ? (
        <ul className="hx-working">
          {(sim.workings[id] || []).map((l, i) => (
            <li key={i}><span>{l.text}</span> <Tag tag={l.tag} src={l.src} /></li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ParamControl({ id, value, onChange }) {
  const meta = PARAMS[id];
  if (!meta) return null;
  let control;
  if (meta.options) {
    control = (
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {Object.entries(meta.options).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
    );
  } else if (meta.bool) {
    control = (
      <label className="hx-switch">
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} /> {value ? 'On' : 'Off'}
      </label>
    );
  } else {
    const empty = value === null || value === '';
    control = (
      <div className="hx-range">
        <input
          type="range" min={meta.min} max={meta.max} step={meta.step}
          value={empty ? meta.min : value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={meta.label}
        />
        <input
          type="number" min={meta.min} max={meta.max} step={meta.step}
          value={empty ? '' : value}
          placeholder={meta.nullable ? 'no data' : ''}
          onChange={(e) => onChange(e.target.value === '' ? (meta.nullable ? null : meta.min) : Number(e.target.value))}
          aria-label={`${meta.label} value`}
        />
        <span className="hx-unit">{meta.pct ? `= ${Math.round((Number(value) || 0) * 100)}%` : meta.unit}</span>
      </div>
    );
  }
  return (
    <div className="hx-param">
      <div className="hx-param-top"><label>{meta.label}</label> <Tag tag={meta.tag} src={meta.src} /></div>
      {control}
      {meta.hint ? <div className="hx-hint">{meta.hint}</div> : null}
    </div>
  );
}

function MixControl({ mix, onChange }) {
  const total = Object.values(mix).reduce((s, v) => s + (Number(v) || 0), 0) || 1;
  return (
    <div className="hx-param">
      <div className="hx-param-top"><label>Who lives here (age mix)</label> <Tag tag="ASSUMPTION" /></div>
      {Object.entries(GROUPS).map(([g, meta]) => (
        <div key={g} className="hx-mix">
          <span>{meta.label}</span>
          <input type="range" min="0" max="1" step="0.05" value={mix[g]} onChange={(e) => onChange({ ...mix, [g]: Number(e.target.value) })} aria-label={meta.label} />
          <b>{Math.round((mix[g] / total) * 100)}%</b>
        </div>
      ))}
    </div>
  );
}

// --- tabs ---------------------------------------------------------------------

function Mission({ project, update, go }) {
  return (
    <>
      <section className="hx-card hx-brief">
        <h3>The brief</h3>
        <p>
          Bangkok is drowning and there is only one way out: up, above the waves. Each of you owns one
          platform system. Together the platforms become a self-sufficient floating city.
        </p>
        <div className="hx-facts">
          {BANGKOK_FACTS.map((f) => (
            <div key={f.text} className="hx-fact"><b>{f.value}</b><span>{f.text}</span></div>
          ))}
        </div>
        <p className="hx-cite">
          Source: <a href={SOURCES.nation2026.url} target="_blank" rel="noreferrer">{SOURCES.nation2026.label}</a>. Figures as the article reports them.
        </p>
      </section>

      <h3 className="hx-h">Choose your role</h3>
      <div className="hx-roles">
        {Object.entries(ROLES).map(([id, r]) => (
          <button
            key={id}
            type="button"
            className={`hx-role${project.role === id ? ' is-on' : ''}`}
            aria-pressed={project.role === id}
            onClick={() => update((p) => ({ ...p, role: id }))}
          >
            <span className="hx-role-icon">{r.icon}</span>
            <strong>{r.title}</strong>
            <ul>{r.deliverables.map((d) => <li key={d}>{d}</li>)}</ul>
          </button>
        ))}
      </div>

      {project.role ? (
        <section className="hx-card">
          <label className="hx-label" htmlFor="hx-portfolio">Evidence portfolio link (optional)</label>
          <input
            id="hx-portfolio" type="url" className="hx-input" placeholder="https://…"
            value={project.portfolioUrl}
            onChange={(e) => update((p) => ({ ...p, portfolioUrl: e.target.value.slice(0, 300) }))}
          />
          <button type="button" className="hx-btn go" onClick={() => go('build')}>Start designing →</button>
        </section>
      ) : null}
    </>
  );
}

function HexInspector({ hex, sim, onChange }) {
  if (!hex) return <p className="hx-muted">Choose a hex on the map to change it.</p>;
  const res = sim.hexes.find((h) => h.q === hex.q && h.r === hex.r);
  return (
    <div className="hx-inspect">
      <div className="hx-inspect-head">
        <strong>Hex {hex.q},{hex.r}</strong>
        {hex.type !== 'open' ? <span>Load: {showMetric('maxLoad', res.use)} ({Math.round(res.loadKg / 1000)} t)</span> : null}
      </div>
      <div className="hx-palette">
        {Object.entries(MODULES).map(([id, m]) => (
          <button
            key={id} type="button"
            className={`hx-mod${hex.type === id ? ' is-on' : ''}`}
            style={{ '--c': m.colour }}
            aria-pressed={hex.type === id}
            onClick={() => onChange({
              q: hex.q, r: hex.r, type: id,
              ...(id === 'farm' ? { crop: 'rice' } : {}),
              ...(id === 'livestock' ? { animal: 'broiler' } : {}),
              ...(id === 'housing' ? { floors: 3 } : {})
            })}
          >
            <span>{m.icon}</span>{m.label}
          </button>
        ))}
      </div>
      {hex.type === 'farm' ? (
        <div className="hx-sub">
          <label>Crop</label>
          <div className="hx-seg">
            {Object.entries(CROPS).map(([id, c]) => (
              <button key={id} type="button" className={hex.crop === id ? 'is-on' : ''} onClick={() => onChange({ ...hex, crop: id })}>{c.label}</button>
            ))}
          </div>
          {CROPS[hex.crop]?.src ? <div className="hx-hint">Yield {CROPS[hex.crop].yieldTHa} t/ha per harvest <Tag tag="DATA" src={CROPS[hex.crop].src} /></div> : null}
        </div>
      ) : null}
      {hex.type === 'livestock' ? (
        <div className="hx-sub">
          <label>Animal</label>
          <div className="hx-seg">
            {Object.entries(ANIMALS).map(([id, a]) => (
              <button key={id} type="button" className={hex.animal === id ? 'is-on' : ''} onClick={() => onChange({ ...hex, animal: id })}>{a.label}</button>
            ))}
          </div>
        </div>
      ) : null}
      {hex.type === 'housing' ? (
        <div className="hx-sub">
          <label>Floors: {hex.floors || 1}</label>
          <input type="range" min="1" max="8" value={hex.floors || 1} onChange={(e) => onChange({ ...hex, floors: Number(e.target.value) })} aria-label="Floors" />
        </div>
      ) : null}
    </div>
  );
}

function Build({ project, update, sim, go }) {
  const role = project.role;
  const [selected, setSelected] = useState(null);
  const [overlay, setOverlay] = useState('modules');
  const [open, setOpen] = useState(null);
  const [showAllParams, setShowAllParams] = useState(false);
  const city = project.city;
  const hex = selected ? city.hexes.find((h) => hexKey(h.q, h.r) === selected) : null;

  const setHex = (next) => update((p) => ({
    ...p,
    city: { ...p.city, hexes: p.city.hexes.map((h) => (h.q === next.q && h.r === next.r ? next : h)) }
  }));
  const setParam = (k, v) => update((p) => ({ ...p, city: { ...p.city, params: { ...p.city.params, [k]: v } } }));

  const myMetrics = role ? ROLES[role].metrics : ['energyCoverage', 'kcalCoverage', 'maxLoad', 'wasteManaged'];
  const otherMetrics = Object.keys(METRICS).filter((m) => !myMetrics.includes(m));
  const myParams = role ? ROLES[role].params : [];
  const otherParams = Object.keys(PARAMS).filter((k) => !myParams.includes(k));

  const toggle = (id) => setOpen((o) => (o === id ? null : id));

  return (
    <>
    {!project.guideSeen ? (
      <div className="hx-newbie">
        <span>👋 New to Hex-Grid? The 2-minute guide shows how to test an idea, with ready-made ideas for your role.</span>
        <button type="button" className="hx-btn go" onClick={() => go('guide')}>📖 How to play</button>
        <button type="button" className="hx-btn ghost" aria-label="Hide this tip" onClick={() => update((p) => ({ ...p, guideSeen: true }))}>✕</button>
      </div>
    ) : null}
    <div className="hx-build">
      <div className="hx-left">
        <div className="hx-overlays" role="radiogroup" aria-label="Map view">
          {Object.entries(OVERLAYS).map(([id, l]) => (
            <button key={id} type="button" role="radio" aria-checked={overlay === id} className={overlay === id ? 'is-on' : ''} onClick={() => setOverlay(id)}>{l}</button>
          ))}
        </div>
        <HexMap sim={sim} selected={selected} onSelect={setSelected} overlay={overlay} highlightRole={role} />
        <div className="hx-legend">
          {overlay === 'load' && <><i style={{ background: '#16a34a' }} /> under 60% <i style={{ background: '#eab308' }} /> 60-85% <i style={{ background: '#f97316' }} /> 85-100% <i style={{ background: '#dc2626' }} /> over safe load</>}
          {overlay === 'nuisance' && <><i style={{ background: '#16a34a' }} /> home, fine <i style={{ background: '#dc2626' }} /> home next to a plant <i style={{ background: '#a16207' }} /> smelly/noisy plant</>}
          {overlay === 'walk' && <><i style={{ background: '#16a34a' }} /> 1 hex <i style={{ background: '#eab308' }} /> 2 hexes <i style={{ background: '#dc2626' }} /> 3+ hexes from a hub</>}
          {overlay === 'modules' && <span>Hexes outlined in white belong to your role.</span>}
        </div>
        <section className="hx-card">
          <HexInspector hex={hex} sim={sim} onChange={setHex} />
        </section>
        <button type="button" className="hx-btn ghost" onClick={() => {
          if (window.confirm('Reset the whole city to the starter design?')) update((p) => ({ ...p, city: starterCity() }));
        }}>↺ Reset city to starter design</button>
      </div>

      <div className="hx-right">
        {sim.flags.length ? (
          <div className="hx-flags">
            {sim.flags.map((f, i) => (
              <p key={i} className={f.role === role ? 'mine' : ''}>
                <b>{ROLES[f.role]?.icon} {ROLES[f.role]?.title}:</b> {f.text}
              </p>
            ))}
          </div>
        ) : null}

        <h3 className="hx-h">{role ? `${ROLES[role].icon} Your system: ${ROLES[role].title}` : 'Key numbers (choose a role on the Mission tab)'}</h3>
        <div className="hx-metrics">
          {myMetrics.map((id) => <MetricCard key={id} id={id} sim={sim} params={city.params} open={open === id} onToggle={() => toggle(id)} />)}
        </div>

        {myParams.length ? (
          <>
            <h3 className="hx-h">Your settings</h3>
            <div className="hx-params">
              {myParams.map((k) => (k === 'mix'
                ? <MixControl key={k} mix={city.params.mix} onChange={(v) => setParam('mix', v)} />
                : k === 'floors'
                  ? <p key={k} className="hx-hint">Floors: choose a housing hex on the map.</p>
                  : <ParamControl key={k} id={k} value={city.params[k]} onChange={(v) => setParam(k, v)} />))}
            </div>
          </>
        ) : null}

        <h3 className="hx-h">The rest of the city (your teammates' systems)</h3>
        <div className="hx-metrics small">
          {otherMetrics.map((id) => <MetricCard key={id} id={id} sim={sim} params={city.params} open={open === id} onToggle={() => toggle(id)} />)}
        </div>

        <button type="button" className="hx-btn ghost" onClick={() => setShowAllParams((v) => !v)} aria-expanded={showAllParams}>
          {showAllParams ? 'Hide' : 'Show'} all city settings
        </button>
        {showAllParams ? (
          <div className="hx-params">
            {otherParams.map((k) => <ParamControl key={k} id={k} value={city.params[k]} onChange={(v) => setParam(k, v)} />)}
            {!myParams.includes('mix') ? <MixControl mix={city.params.mix} onChange={(v) => setParam('mix', v)} /> : null}
          </div>
        ) : null}
      </div>
    </div>
    </>
  );
}

function Test({ project, update, go }) {
  const [result, setResult] = useState(null);
  const role = project.role;
  const d = project.draft;
  const setDraft = (patch) => update((p) => ({ ...p, draft: { ...p.draft, ...patch } }));
  const changes = project.baseline ? describeChanges(project.baseline.city, project.city) : [];
  const metricOptions = [...(role ? ROLES[role].metrics : []), ...Object.keys(METRICS).filter((m) => !role || !ROLES[role].metrics.includes(m))];
  const baseValue = project.baseline && d.metric ? simulate(project.baseline.city).metrics[d.metric] : null;
  const ready = project.baseline && d.metric && d.because.trim().length >= 5 && changes.length > 0;

  const run = () => {
    const res = evaluateHypothesis(project.baseline.city, project.city, { metric: d.metric, expect: d.expect, role });
    const entry = {
      id: `exp-${Date.now()}`,
      createdAt: Date.now(),
      role,
      hypothesis: { metric: d.metric, expect: d.expect, predicted: d.predicted === '' ? null : Number(d.predicted), because: d.because.trim() },
      changes: res.changes,
      target: res.target,
      verdict: res.verdict,
      ripples: res.ripples.map((r) => ({ roleId: r.roleId, title: r.title, moved: r.moved })),
      version: res.version
    };
    setResult(res);
    update((p) => ({ ...p, experiments: [...p.experiments, entry] }));
  };

  return (
    <div className="hx-test">
      <p className="hx-muted">New to testing? <button type="button" className="hx-link" onClick={() => go('guide')}>Read how to test an idea →</button></p>
      <section className="hx-card">
        <h3><span className="hx-step">1</span> Lock a baseline</h3>
        <p className="hx-muted">Your city as it is now becomes the "before". You then change one thing and compare.</p>
        {project.baseline
          ? <p>✅ Baseline locked {new Date(project.baseline.lockedAt).toLocaleString()}.</p>
          : null}
        <div className="hx-row">
          <button type="button" className="hx-btn go" onClick={() => { setResult(null); update((p) => ({ ...p, baseline: { city: JSON.parse(JSON.stringify(p.city)), lockedAt: Date.now() } })); }}>
            🔒 {project.baseline ? 'Lock the city as it is now (new baseline)' : 'Lock current city as baseline'}
          </button>
          {project.baseline && changes.length ? (
            <button type="button" className="hx-btn ghost" onClick={() => {
              if (window.confirm('Undo every change since the baseline?')) { setResult(null); update((p) => ({ ...p, city: JSON.parse(JSON.stringify(p.baseline.city)) })); }
            }}>↺ Put the city back to the baseline</button>
          ) : null}
        </div>
      </section>

      <section className={`hx-card${project.baseline ? '' : ' is-dim'}`}>
        <h3><span className="hx-step">2</span> Your hypothesis</h3>
        <div className="hx-hyp">
          <span>If I make my change, then</span>
          <select value={d.metric} onChange={(e) => setDraft({ metric: e.target.value })} aria-label="Which number">
            <option value="">choose a number…</option>
            {metricOptions.map((m) => <option key={m} value={m}>{METRICS[m].label}</option>)}
          </select>
          <span>will</span>
          <select value={d.expect} onChange={(e) => setDraft({ expect: e.target.value })} aria-label="Which way">
            {Object.entries(EXPECT).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        {baseValue !== null ? <p className="hx-muted">Right now (baseline) it is <b>{showMetric(d.metric, baseValue)}</b>.</p> : null}
        <div className="hx-grid2">
          <div>
            <label className="hx-label" htmlFor="hx-pred">My predicted value (optional)</label>
            <input id="hx-pred" className="hx-input" type="number" value={d.predicted} onChange={(e) => setDraft({ predicted: e.target.value })} />
          </div>
          <div>
            <label className="hx-label" htmlFor="hx-because">…because (your reasoning)</label>
            <textarea id="hx-because" className="hx-input" rows={3} maxLength={500} value={d.because}
              placeholder="e.g. hydroponics grows 11× more lettuce per m², so food will go up - but it needs lighting…"
              onChange={(e) => setDraft({ because: e.target.value })} />
          </div>
        </div>
      </section>

      <section className={`hx-card${project.baseline ? '' : ' is-dim'}`}>
        <h3><span className="hx-step">3</span> Change the city</h3>
        {d.idea ? <p>💡 Your planned change: <b>{d.idea}</b></p> : null}
        {changes.length ? (
          <>
            <p>Changes since your baseline:</p>
            <ul className="hx-changes">{changes.map((c) => <li key={c}>{c}</li>)}</ul>
            {changes.length > 1 ? <p className="hx-warn">⚖️ You changed {changes.length} things. A fair test changes one - otherwise, which one caused the result?</p> : null}
          </>
        ) : <p className="hx-muted">Nothing changed yet.</p>}
        <button type="button" className="hx-btn" onClick={() => go('build')}>🗺️ Go to the map to make your change</button>
      </section>

      <section className="hx-card">
        <h3><span className="hx-step">4</span> Run the test</h3>
        <button type="button" className="hx-btn go big" disabled={!ready} onClick={run}>▶ Run the simulation</button>
        {!ready ? <p className="hx-muted">Needs: a baseline, a number to watch, your reasoning, and at least one change.</p> : null}
        {result ? <Result res={result} hypothesis={d} /> : null}
      </section>
    </div>
  );
}

function Result({ res, hypothesis }) {
  const t = res.target;
  const predicted = hypothesis.predicted === '' ? null : Number(hypothesis.predicted);
  return (
    <div className="hx-result">
      <div className={`hx-verdict ${res.verdict}`}>
        {res.verdict === 'supported' ? '✅ Your hypothesis was supported' : '🔄 Your hypothesis was not supported - that is a real finding too'}
      </div>
      <p className="hx-big">
        {METRICS[t.id].label}: <b>{showMetric(t.id, t.before)}</b> → <b>{showMetric(t.id, t.after)}</b> {ARROW[t.dir]}
        <span className="hx-muted"> (you expected it to {EXPECT[hypothesis.expect]})</span>
      </p>
      {predicted !== null && Number.isFinite(t.after) ? (
        <p>Your predicted value was {predicted}; the model gave {showMetric(t.id, t.after)}
          {' '}({t.after !== 0 ? `${Math.round(Math.abs(predicted - t.after) / Math.abs(t.after) * 100)}% off` : 'compare them'}).</p>
      ) : null}

      {res.ripples.length ? (
        <div className="hx-ripples">
          <h4>📣 Your change also moved your teammates' numbers</h4>
          {res.ripples.map((r) => (
            <div key={r.roleId} className="hx-ripple">
              <b>{ROLES[r.roleId].icon} {r.title}</b>
              <ul>{r.moved.map((m) => <li key={m.id}>{METRICS[m.id].label}: {showMetric(m.id, m.before)} → {showMetric(m.id, m.after)} {ARROW[m.dir]}</li>)}</ul>
            </div>
          ))}
        </div>
      ) : <p className="hx-muted">No teammate's key numbers moved.</p>}

      <details className="hx-details">
        <summary>Every number, before and after</summary>
        <table className="hx-table">
          <thead><tr><th>Number</th><th>Before</th><th>After</th><th /></tr></thead>
          <tbody>
            {res.rows.map((r) => (
              <tr key={r.id} className={r.dir !== 'same' ? 'moved' : ''}>
                <td>{METRICS[r.id].label}</td><td>{showMetric(r.id, r.before)}</td><td>{showMetric(r.id, r.after)}</td><td>{ARROW[r.dir]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
      <p className="hx-muted">Saved to your lab log. Model {res.version}. This is a model - check its working and its limits before you trust it.</p>
    </div>
  );
}

function LabLog({ project }) {
  const rows = [...project.experiments].sort((a, b) => b.createdAt - a.createdAt);
  if (!rows.length) return <section className="hx-card"><p>Your tested hypotheses will appear here.</p></section>;
  return (
    <>
      <div className="hx-row"><button type="button" className="hx-btn ghost" onClick={() => window.print()}>🖨️ Print lab log</button></div>
      {rows.map((e) => (
        <article key={e.id} className="hx-card hx-entry">
          <div className="hx-entry-head">
            <span>{new Date(e.createdAt).toLocaleString()}</span>
            <span>{ROLES[e.role]?.icon} {ROLES[e.role]?.title || 'No role'}</span>
            <span className={`hx-verdict-chip ${e.verdict}`}>{e.verdict === 'supported' ? 'Supported' : 'Not supported'}</span>
          </div>
          <p><b>Change:</b></p>
          <ul className="hx-changes">{e.changes.map((c) => <li key={c}>{c}</li>)}</ul>
          <p><b>Hypothesis:</b> {METRICS[e.hypothesis.metric]?.label} will {EXPECT[e.hypothesis.expect]}, because {e.hypothesis.because}</p>
          <p><b>Result:</b> {showMetric(e.target.id, e.target.before)} → {showMetric(e.target.id, e.target.after)} {ARROW[e.target.dir]}
            {e.hypothesis.predicted !== null ? ` (predicted ${e.hypothesis.predicted})` : ''}</p>
          {e.ripples?.length ? <p className="hx-muted">Also moved: {e.ripples.map((r) => r.title).join(', ')}</p> : null}
          <p className="hx-muted">Model {e.version}</p>
        </article>
      ))}
    </>
  );
}

function Sources() {
  const byTag = (tag) => Object.entries(K).filter(([, c]) => c.tag === tag);
  return (
    <>
      <section className="hx-card">
        <h3>Where the numbers come from</h3>
        <ul className="hx-sources">
          {Object.entries(SOURCES).map(([id, s]) => (
            <li key={id}><a href={s.url} target="_blank" rel="noreferrer">{s.label}</a>{s.checked === false ? <span className="hx-tag est">NOT RE-CHECKED</span> : null}</li>
          ))}
        </ul>
      </section>
      <section className="hx-card">
        <h3>Estimates - challenge these with your own research</h3>
        <table className="hx-table">
          <tbody>
            {byTag('ESTIMATE').map(([k, c]) => <tr key={k}><td>{k}</td><td>{c.v} {c.unit}</td><td className="hx-muted">{c.note || ''}</td></tr>)}
          </tbody>
        </table>
      </section>
      <section className="hx-card">
        <h3>What this model leaves out</h3>
        <ul>{LIMITATIONS.map((l) => <li key={l}>{l}</li>)}</ul>
        <p className="hx-muted">Model version {MODEL_VERSION}.</p>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------

export function ProjectHexGrid({ uid }) {
  const { project, update, syncState } = useHexGridProject(uid);
  const [tab, setTab] = useState(project.role ? 'build' : 'mission');
  const sim = useMemo(() => simulate(project.city), [project.city]);
  const go = (t) => { setTab(t); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <div className="container hx">
      <div className="hx-hero">
        <div>
          <h2>⬡ Project Hex-Grid</h2>
          <p>A floating city for a drowning Bangkok. Test your ideas against real data.</p>
        </div>
        <div className="hx-hero-side">
          {project.role ? <span className="hx-you">{ROLES[project.role].icon} {ROLES[project.role].title}</span> : null}
          <span className={`hx-sync ${syncState}`}>{{ idle: '', saving: 'Saving…', saved: '✓ Saved', 'local-only': 'Saved on this device' }[syncState]}</span>
        </div>
      </div>

      <nav className="hx-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'is-on' : ''} onClick={() => go(t.id)}>
            {t.label}{t.id === 'log' && project.experiments.length ? ` (${project.experiments.length})` : ''}
          </button>
        ))}
      </nav>

      {tab === 'mission' && <Mission project={project} update={update} go={go} />}
      {tab === 'guide' && <HowToPlay project={project} update={update} go={go} />}
      {tab === 'build' && <Build project={project} update={update} sim={sim} go={go} />}
      {tab === 'test' && <Test project={project} update={update} go={go} />}
      {tab === 'log' && <LabLog project={project} />}
      {tab === 'sources' && <Sources />}
    </div>
  );
}
