/**
 * Activity 6 - SO₂ → Sulfate: Gold Nanoparticle Catalytic Conversion.
 *
 * A virtual research instrument around a deliberately simple kinetic model
 * (so2Model.js). The activity's rule, stronger even than Solar Car's: nothing
 * on this page is a measurement. Every curve, readout and saved number is
 * labelled as simulated / illustrative model output, every tunable number is
 * labelled a MODEL PARAMETER, and the literature panel cites what published
 * work actually reported rather than inventing figures for it.
 */
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  MODES, PARAMETERS, PARAMETER_GROUPS, SOURCES, SPECIES, MODEL_CONSTANTS,
  MODEL_VERSION, BASELINE_DATE, BASELINE_DATE_LABEL, OUTPUT_LABEL,
  defaultParameters, normaliseParameters, simulate, stateAt
} from './so2Model.js';
import { LineChart, fmt } from './LineChart.jsx';
import { MoleculeScene, SceneLegend } from './MoleculeScene.jsx';
import { saveSimulation, listSimulations } from './simulationStore.js';
import { GoldFilterLab } from './filter/GoldFilterLab.jsx';
import './so2.css';

// Validated categorical pair (dataviz palette slots 1-2, dark steps): colour
// follows the MODEL, so Surface is always blue and Electrochemical always
// orange, in every chart and in comparison mode.
const SERIES_COLOUR = { surface: '#3987e5', electrochemical: '#d95926' };

// A full run plays in ~30 s of wall time at 1×, 3 s at 10×.
const PLAY_SECONDS = 30;

const PARAMS_KEY = 'hearisland.so2.params.v1';

function readStoredParams() {
  try {
    const raw = localStorage.getItem(PARAMS_KEY);
    return raw ? normaliseParameters(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

const CHARTS = [
  { field: 'so2', title: 'SO₂ concentration', unit: 'mM (model)' },
  { field: 'sulfate', title: 'Sulfate (SO₄²⁻) released', unit: 'mM (model)' },
  { field: 'surfaceSO2', title: 'Surface-bound SO₂*', unit: 'mM-eq (model)' },
  { field: 'surfaceSulfate', title: 'Surface sulfate SO₄*', unit: 'mM-eq (model)' },
  { field: 'activeSites', title: 'Active sites occupied', unit: 'fraction θ', yCap: 1 },
  { field: 'electronTransfer', title: 'Electron-transfer rate', unit: 'mM e⁻ / τ (model)' }
];

function ParamControl({ def, value, onChange, disabled }) {
  return (
    <div className={`so2-param${disabled ? ' is-off' : ''}`}>
      <div className="so2-param-head">
        <label htmlFor={`so2-${def.key}`}>{def.label}</label>
        <output>{value}<small> {def.unit}</small></output>
      </div>
      <input
        id={`so2-${def.key}`}
        type="range"
        min={def.min}
        max={def.max}
        step={def.step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(def.key, Number(e.target.value))}
      />
    </div>
  );
}

function Panel({ title, children, defaultOpen = false }) {
  return (
    <details className="so2-panel" open={defaultOpen}>
      <summary>{title}</summary>
      <div className="so2-panel-body">{children}</div>
    </details>
  );
}

const LAB_KEY = 'hearisland.so2.lab.v1';
const LABS = [
  { id: 'filter', label: 'Gold nanoparticle SO₂ filter', sub: 'Filter simulator + simulation-credit economy · SO2-Au-TiO2-v1.1', isNew: true },
  { id: 'kinetic', label: 'Kinetic instrument', sub: 'Surface vs electrochemical kinetic model · SO2-Au-TiO2-v1.0' }
];

export function So2SulfateSimulation({ uid }) {
  const [lab, setLab] = useState(() => {
    try { return localStorage.getItem(LAB_KEY) === 'kinetic' ? 'kinetic' : 'filter'; } catch { return 'filter'; }
  });
  const choose = (id) => {
    setLab(id);
    try { localStorage.setItem(LAB_KEY, id); } catch { /* per-device convenience only */ }
  };
  return (
    <div className="so2 container">
      <nav className="so2-labtabs" aria-label="Activity 6 labs">
        {LABS.map((l) => (
          <button key={l.id} type="button" className={lab === l.id ? 'is-active' : ''} aria-pressed={lab === l.id} onClick={() => choose(l.id)}>
            <span>{l.label}{l.isNew && <span className="so2-new">NEW</span>}</span>
            <small>{l.sub}</small>
          </button>
        ))}
      </nav>
      {lab === 'filter' ? <GoldFilterLab uid={uid} /> : <KineticInstrument uid={uid} />}
    </div>
  );
}

function KineticInstrument({ uid }) {
  const [mode, setMode] = useState('surface');
  const [params, setParams] = useState(() => readStoredParams() || defaultParameters());
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [fast, setFast] = useState(false);
  const [saveState, setSaveState] = useState({ status: 'idle' });
  const [saved, setSaved] = useState({ status: 'idle', rows: [] });

  // The stiff corner of parameter space costs a few hundred ms to integrate;
  // deferring keeps slider drags responsive while the model catches up.
  const deferredParams = useDeferredValue(params);

  const runModes = mode === 'comparison' ? ['surface', 'electrochemical'] : [mode];
  const runs = useMemo(
    () => runModes.map((m) => simulate(deferredParams, m)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deferredParams, mode]
  );
  const duration = runs[0].parameters.duration;

  useEffect(() => {
    try { localStorage.setItem(PARAMS_KEY, JSON.stringify(params)); } catch { /* per-device convenience only */ }
  }, [params]);

  // Simulation clock.
  const lastFrame = useRef(null);
  useEffect(() => {
    if (!playing) { lastFrame.current = null; return undefined; }
    let raf;
    const tick = (now) => {
      const dt = lastFrame.current == null ? 0 : (now - lastFrame.current) / 1000;
      lastFrame.current = now;
      setT((prev) => {
        const next = prev + dt * (duration / PLAY_SECONDS) * (fast ? 10 : 1);
        if (next >= duration) { setPlaying(false); return duration; }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, fast, duration]);

  useEffect(() => { if (t > duration) setT(duration); }, [t, duration]);

  const refreshSaved = async () => {
    if (!uid) return;
    setSaved((s) => ({ ...s, status: 'loading' }));
    try {
      setSaved({ status: 'ready', rows: await listSimulations(uid) });
    } catch (err) {
      console.warn('[SO2] Could not load saved runs:', err?.message);
      setSaved({ status: 'error', rows: [] });
    }
  };
  useEffect(() => { refreshSaved(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [uid]);

  const setParam = (key, value) => setParams((p) => ({ ...p, [key]: value }));
  const start = () => { if (t >= duration) setT(0); setPlaying(true); };
  const reset = () => { setPlaying(false); setT(0); };
  const stepForward = () => { setPlaying(false); setT((v) => Math.min(duration, v + duration / 50)); };

  async function onSave() {
    if (!uid) return;
    setSaveState({ status: 'saving' });
    try {
      const id = await saveSimulation(uid, mode, runs[0].parameters, runs);
      setSaveState({ status: 'saved', id });
      refreshSaved();
    } catch (err) {
      console.warn('[SO2] Save failed:', err?.message);
      setSaveState({ status: 'error', message: err?.message || 'Save failed' });
    }
  }

  const live = runs.map((r) => ({ run: r, s: stateAt(r.samples, t) }));
  const primary = live[0];
  const series = (field) => runs.map((r) => ({
    id: r.mode, label: MODES[r.mode].short, color: SERIES_COLOUR[r.mode], samples: r.samples, field
  }));

  const activeParam = (def) => !def.modes || def.modes.some((m) => runModes.includes(m));

  return (
    <div>
      <header className="so2-hero">
        <div className="so2-hero-text">
          <span className="so2-eyebrow">Activity 6 · Chemistry · Computational model</span>
          <h2>SO₂ → Sulfate: Gold Nanoparticle Catalytic Conversion</h2>
          <p>
            A virtual instrument for exploring how SO₂ could be oxidised toward sulfate at supported gold
            nanoparticles. It runs a simplified kinetic model: change the model parameters, watch the
            molecules and curves respond, and ask which assumptions drive the result.
          </p>
        </div>
        <dl className="so2-hero-meta">
          <div><dt>Model status</dt><dd className="so2-status">COMPUTATIONAL SIMULATION</dd></div>
          <div><dt>Model baseline date</dt><dd>{BASELINE_DATE_LABEL}</dd></div>
          <div><dt>Model version</dt><dd><code>{MODEL_VERSION}</code></dd></div>
        </dl>
      </header>

      <div className="so2-warning" role="note">
        <strong>⚠ Safety</strong>
        SO₂ is a hazardous gas. This simulation is a computational educational model and does not provide
        laboratory operating instructions.
      </div>

      <section className="so2-cards" aria-label="Scientific dashboard">
        <div className="so2-card"><span>SO₂ oxidation state (S)</span><b>+4</b></div>
        <div className="so2-card"><span>Sulfate oxidation state (S)</span><b>+6</b></div>
        <div className="so2-card"><span>Electrons transferred</span><b>2 e⁻</b><small>per S atom</small></div>
        <div className="so2-card"><span>Catalyst</span><b className="so2-card-text">Au/TiO₂</b><small>conceptual model</small></div>
        <div className="so2-card"><span>Primary product</span><b>SO₄²⁻</b></div>
        <div className="so2-card"><span>Model status</span><b className="so2-card-text so2-status">COMPUTATIONAL SIMULATION</b></div>
        <div className="so2-card"><span>Baseline</span><b className="so2-card-text">{BASELINE_DATE_LABEL}</b></div>
      </section>

      <nav className="so2-modes" aria-label="Model mode">
        {Object.values(MODES).map((m) => (
          <button
            key={m.id}
            type="button"
            className={mode === m.id ? 'is-active' : ''}
            aria-pressed={mode === m.id}
            onClick={() => setMode(m.id)}
          >
            {m.id !== 'comparison' && <i style={{ background: SERIES_COLOUR[m.id] }} />}
            {m.label}
          </button>
        ))}
      </nav>
      <p className="so2-mode-blurb">{MODES[mode].blurb}</p>

      <div className="so2-layout">
        <aside className="so2-params" aria-label="Model parameters">
          <div className="so2-params-head">
            <h3>MODEL PARAMETERS</h3>
            <button type="button" className="so2-link" onClick={() => setParams(defaultParameters())}>Restore defaults</button>
          </div>
          <p className="so2-params-note">
            Adjustable inputs to the model. Defaults are illustrative - they are not experimentally
            validated operating conditions for any real catalyst or electrode.
          </p>
          {PARAMETER_GROUPS.map((g) => (
            <fieldset key={g.id} className="so2-group">
              <legend>{g.label}</legend>
              {PARAMETERS.filter((d) => d.group === g.id).map((def) => (
                <ParamControl
                  key={def.key}
                  def={def}
                  value={params[def.key]}
                  onChange={setParam}
                  disabled={!activeParam(def)}
                />
              ))}
              {g.id === 'conditions' && mode === 'electrochemical' && (
                <p className="so2-param-why">O₂ is not used in electrochemical mode - water supplies the oxygen and the electrode takes the electrons.</p>
              )}
              {g.id === 'electro' && mode === 'surface' && (
                <p className="so2-param-why">No potential is applied in surface-catalysis mode.</p>
              )}
            </fieldset>
          ))}
        </aside>

        <main className="so2-main">
          <div className="so2-controls" role="group" aria-label="Simulation controls">
            <button type="button" className="so2-btn primary" onClick={start} disabled={playing}>▶ Start Simulation</button>
            <button type="button" className="so2-btn" onClick={() => setPlaying(false)} disabled={!playing}>❚❚ Pause</button>
            <button type="button" className="so2-btn" onClick={reset}>↺ Reset</button>
            <button type="button" className="so2-btn" onClick={stepForward} disabled={t >= duration}>⏭ Step Forward</button>
            <button type="button" className={`so2-btn${fast ? ' is-on' : ''}`} aria-pressed={fast} onClick={() => setFast((f) => !f)}>
              ⏩ Run 10× Faster
            </button>
            <div className="so2-clock" aria-live="off">
              <span>Simulation clock</span>
              <b>τ = {t.toFixed(1)}</b>
              <small>/ {duration} τ {fast ? '· 10×' : ''}</small>
            </div>
          </div>
          <div className="so2-progress" aria-hidden="true"><div style={{ width: `${(t / duration) * 100}%` }} /></div>

          <div className={`so2-scenes${live.length > 1 ? ' is-split' : ''}`}>
            {live.map(({ run, s }) => (
              <MoleculeScene
                key={run.mode}
                mode={run.mode}
                state={s}
                parameters={run.parameters}
                peakElectron={run.summary.peakElectronTransfer}
                playing={playing}
                caption={live.length > 1 ? MODES[run.mode].label : null}
              />
            ))}
          </div>
          <SceneLegend />

          <div className="so2-readouts">
            {live.map(({ run, s }) => (
              <div key={run.mode} className="so2-readout" style={{ '--so2-series': SERIES_COLOUR[run.mode] }}>
                <div className="so2-readout-head">{MODES[run.mode].label} <span className="so2-sim-tag">{OUTPUT_LABEL}</span></div>
                <dl>
                  <div><dt>SO₂ remaining</dt><dd>{fmt(s.so2)} <small>mM</small></dd></div>
                  <div><dt>SO₄²⁻ released</dt><dd>{fmt(s.sulfate)} <small>mM</small></dd></div>
                  <div><dt>Sites occupied</dt><dd>{(s.activeSites * 100).toFixed(0)}<small>%</small></dd></div>
                  <div>
                    <dt>{run.mode === 'electrochemical' ? 'e⁻ to electrode' : 'e⁻ to O₂'}</dt>
                    <dd>{fmt(s.electronTransfer)} <small>mM/τ</small></dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>

          <section className="so2-charts" aria-label="Live graphs">
            {CHARTS.map((c) => (
              <LineChart
                key={c.field}
                title={c.title}
                unit={c.unit}
                field={c.field}
                yCap={c.yCap}
                series={series(c.field)}
                tNow={t}
                tMax={duration}
                note={c.field === 'electronTransfer'
                  ? '2 e⁻ per S(+4) → S(+6). Electrochemical: proportional to current. Surface: electrons passed to O₂.'
                  : null}
              />
            ))}
          </section>

          <details className="so2-table">
            <summary>Show the graphed values as a table</summary>
            <div className="so2-table-scroll">
              <table>
                <caption>{OUTPUT_LABEL} - {MODEL_VERSION}</caption>
                <thead>
                  <tr>
                    {runs.length > 1 && <th>Model</th>}
                    <th>τ</th>
                    {CHARTS.map((c) => <th key={c.field}>{c.title}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {runs.flatMap((r) => r.samples.filter((_, i) => i % 30 === 0).map((s) => (
                    <tr key={`${r.mode}-${s.t}`}>
                      {runs.length > 1 && <td>{MODES[r.mode].short}</td>}
                      <td>{s.t.toFixed(0)}</td>
                      {CHARTS.map((c) => <td key={c.field}>{fmt(s[c.field])}</td>)}
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </details>

          <section className="so2-save">
            <div>
              <h3>Save this run</h3>
              <p>
                Stores the parameters, mode and {runs.length * 40} sampled time points under model version{' '}
                <code>{MODEL_VERSION}</code>. Saved runs are never overwritten, so results from future model
                versions can be compared with this one.
              </p>
            </div>
            <button type="button" className="so2-btn primary" onClick={onSave} disabled={!uid || saveState.status === 'saving'}>
              {saveState.status === 'saving' ? 'Saving…' : '💾 Save run'}
            </button>
            {saveState.status === 'saved' && <p className="so2-ok">Saved.</p>}
            {saveState.status === 'error' && <p className="so2-err">Could not save: {saveState.message}</p>}
          </section>

          {saved.rows.length > 0 && (
            <section className="so2-saved">
              <h3>Your saved runs</h3>
              <ul>
                {saved.rows.map((r) => {
                  const res = r.results || {};
                  const date = r.createdAt?.toDate?.();
                  return (
                    <li key={r.id}>
                      <div>
                        <b>{MODES[r.mode]?.label || r.mode}</b>
                        <span className="so2-muted"> · {date ? date.toLocaleString() : 'just now'}</span>
                        <code className={r.modelVersion === MODEL_VERSION ? '' : 'so2-old'}>{r.modelVersion}</code>
                        {r.modelVersion !== MODEL_VERSION && <span className="so2-muted"> (older model)</span>}
                      </div>
                      <div className="so2-muted">
                        {Object.entries(res).map(([m, v]) => (
                          <span key={m}>
                            {MODES[m]?.short}: {v.so2Removed != null ? `${(v.so2Removed * 100).toFixed(0)}% SO₂ removed` : '—'},{' '}
                            {v.sulfateYield != null ? `${(v.sulfateYield * 100).toFixed(0)}% released as SO₄²⁻` : '—'}.{' '}
                          </span>
                        ))}
                        (simulated)
                      </div>
                      <button
                        type="button"
                        className="so2-link"
                        onClick={() => { setParams(normaliseParameters(r.parameters)); if (MODES[r.mode]) setMode(r.mode); reset(); }}
                      >
                        Load parameters
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          {saved.status === 'error' && <p className="so2-err">Could not load your saved runs.</p>}
        </main>
      </div>

      <section className="so2-info">
        <div className="so2-callout">
          Gold nanoparticles can modify the chemistry of a support surface. Experimental studies of Au/TiO₂ have
          shown enhanced SO₂ adsorption/dissociation compared with isolated metallic gold or stoichiometric TiO₂
          under certain conditions.
        </div>

        <Panel title="Mechanism" defaultOpen>
          <h4>The oxidation</h4>
          <p className="so2-eq">SO₂ → SO₄²⁻ &nbsp; · &nbsp; S(+4) → S(+6)</p>
          <p>Sulfur's oxidation state rises by two, so sulfur is <b>oxidised</b> and loses the equivalent of <b>2 electrons</b>. Gold is a catalyst: it is not consumed and appears on neither side of any equation below.</p>

          <h4>Electrochemical half-reaction (acidic, conceptual)</h4>
          <p className="so2-eq">SO₂ + 2H₂O → SO₄²⁻ + 4H⁺ + 2e⁻</p>
          <table className="so2-balance">
            <thead><tr><th>Check</th><th>Left</th><th>Right</th></tr></thead>
            <tbody>
              <tr><td>S</td><td>1</td><td>1</td></tr>
              <tr><td>O</td><td>2 + 2 = 4</td><td>4</td></tr>
              <tr><td>H</td><td>4</td><td>4</td></tr>
              <tr><td>Charge</td><td>0</td><td>−2 + 4 − 2 = 0</td></tr>
            </tbody>
          </table>
          <p>This is an <b>electrochemical model</b> equation. In surface-catalysis mode the same two electrons go to an oxidant (O₂) instead of an electrode.</p>

          <h4>Adsorption</h4>
          <p className="so2-eq">SO₂ + * ⇌ SO₂*</p>
          <p><code>*</code> is an available catalyst surface site. Nothing happens to SO₂ in this model until it occupies one.</p>

          <h4>Simplified surface sequence</h4>
          <p className="so2-eq">SO₂* (S +4) → SO₃* (S +6) → SO₄* (S +6) → SO₄²⁻ + *</p>
          <p className="so2-caveat">
            Simplified mechanistic visualization. These are generic adsorbed species, not a claim that they are
            the only - or necessarily the actual - intermediates in any real reaction environment. Note that only
            the first arrow is the redox step; SO₃* → SO₄* adds oxygen without changing sulfur's oxidation state.
            A fraction (1 − Y_sulfate) of SO₃* is routed to "other adsorbed sulfur" whose identity the model does not claim.
          </p>

          <h4>Lumped rate form</h4>
          <p className="so2-eq">d[SO₂]/dt = −k_oxidation [SO₂] θ_active</p>
          <p className="so2-eq">d[SO₄²⁻]/dt = Y_sulfate · k_oxidation [SO₂] θ_active</p>
          <p>
            The simulation resolves these into separate adsorption, oxidation and release steps (below), so θ_active
            is computed rather than assumed, and sulfate that stays on the surface is seen to block sites.
          </p>

          <h4>Equations actually integrated (RK4)</h4>
          <pre className="so2-code">{`θ_free = 1 − θ_SO2 − θ_SO3 − θ_SO4 − θ_other
r_ads = k_ads [SO₂] θ_free      r_des = k_des θ_SO2
r_1   = k_1 θ_SO2   (redox, 2e⁻)   r_2 = k_2 θ_SO3   r_rel = k_rel θ_SO4

d[SO₂]/dt    = −Γ (r_ads − r_des)
dθ_SO2/dt    =  r_ads − r_des − r_1
dθ_SO3/dt    =  r_1 − r_2
dθ_SO4/dt    =  Y r_2 − r_rel
dθ_other/dt  = (1 − Y) r_2
d[SO₄²⁻]/dt  =  Γ r_rel
electron rate = 2 Γ r_1`}</pre>
          <h4>Rate constants in use (derived from your parameters)</h4>
          <table className="so2-balance">
            <thead><tr><th>Quantity</th>{runs.map((r) => <th key={r.mode}>{MODES[r.mode].short}</th>)}</tr></thead>
            <tbody>
              {[
                ['Γ surface capacity (mM-eq)', 'capacity'],
                ['Au/TiO₂ interface factor', 'interface'],
                ['Interface activity (× support)', 'interfaceActivity'],
                ['Arrhenius factor vs 298 K', 'arrhenius'],
                ['Potential factor', 'potential'],
                ['k_ads', 'kAds'], ['k_des', 'kDes'], ['k_1 (redox)', 'k1'], ['k_2', 'k2'], ['k_rel', 'kRel']
              ].map(([label, key]) => (
                <tr key={key}><td>{label}</td>{runs.map((r) => <td key={r.mode}>{r.rates[key] == null ? 'n/a' : fmt(r.rates[key])}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Model assumptions">
          <ul>
            <li>All curves are <b>{OUTPUT_LABEL.toLowerCase()}</b>. None are experimental data, and the model is not fitted to any experiment.</li>
            <li>Time is in model units (τ) and concentrations in model mM. They are not calibrated to seconds or to any real reactor, electrode or gas stream.</li>
            <li>Default parameter values are illustrative. Where no reliable experimental value exists for this exact system, the quantity is exposed as an adjustable MODEL PARAMETER rather than presented as fact.</li>
            <li>The Au/TiO₂ interface is modelled as the active region: interface factor = Au loading × ({MODEL_CONSTANTS.referenceSizeNm} nm / particle size) × support activity. No Au, or an inert support, gives no interface. The 1/size scaling is a gentle proxy for "smaller particles expose more perimeter", not a derived law.</li>
            <li>Bare TiO₂ keeps a small adsorption and oxidation activity (model constants {MODEL_CONSTANTS.bareSupportAffinity} and {MODEL_CONSTANTS.bareSupportOxidation}); metallic Au away from the support adsorbs weakly ({MODEL_CONSTANTS.bareGoldAffinity}) and does not oxidise SO₂ in surface mode.</li>
            <li>Surface mode: the redox step scales with dissolved O₂ availability. Electrochemical mode: O₂ is ignored and the redox step scales with exp(αF(E − E_onset)/RT), α = {MODEL_CONSTANTS.transferCoefficient}, capped at {MODEL_CONSTANTS.potentialFactorCap}×. Potentials are against a model reference, not a named reference electrode.</li>
            <li>Temperature enters through a single Arrhenius factor with an adjustable apparent activation energy, applied to oxidation and release.</li>
            <li>Any rate constant above {MODEL_CONSTANTS.maxRate} τ⁻¹ is capped: it is "fast on this timescale".</li>
            <li>Mass transport, pH changes, sulfate/sulfite speciation, surface oxide formation, particle sintering and catalyst poisoning chemistry beyond site blocking are not modelled.</li>
            <li>Sulfur is conserved exactly; this is checked by automated tests.</li>
          </ul>
          <h4>Species represented</h4>
          <table className="so2-balance">
            <thead><tr><th>Formula</th><th>Name</th><th>S oxidation state</th></tr></thead>
            <tbody>
              {SPECIES.map((s) => <tr key={s.formula}><td>{s.formula}</td><td>{s.name}</td><td>{s.sulfurOx || '—'}</td></tr>)}
            </tbody>
          </table>
        </Panel>

        <Panel title="Scientific basis">
          <p>
            Published research has demonstrated strong interactions between SO₂ and Au/TiO₂ surfaces, and
            electrochemical SO₂ oxidation has been investigated using gold catalysts and electrodes. The model's
            structure - interface-dominated adsorption, a 2-electron oxidation, and a strong dependence on potential
            and surface state - follows these findings qualitatively. It does not reproduce any measured value from them.
          </p>
          <ol className="so2-sources">
            {SOURCES.map((s) => (
              <li key={s.id}>
                <p>{s.cite} <a href={s.url} target="_blank" rel="noopener noreferrer">Link</a></p>
                <p className="so2-muted">{s.relevance}</p>
              </li>
            ))}
          </ol>
          <p className="so2-caveat">
            The mechanism can depend strongly on electrolyte, support material, potential, surface structure and
            reaction environment. Treat the comparison mode as a comparison of two sets of model assumptions.
          </p>
        </Panel>

        <Panel title="Safety / educational use">
          <p><b>SO₂ is a hazardous gas. This simulation is a computational educational model and does not provide laboratory operating instructions.</b></p>
          <ul>
            <li>Nothing here is a procedure, recipe or set of operating conditions. Do not attempt to reproduce it with real SO₂.</li>
            <li>Simulated values must not be quoted as measured values. When you use a number from this page, label it "simulated".</li>
            <li>Model baseline date: {BASELINE_DATE_LABEL} ({BASELINE_DATE}). Model version: {MODEL_VERSION}.</li>
          </ul>
        </Panel>
      </section>
    </div>
  );
}
