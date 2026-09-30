/**
 * Gold Nanoparticle SO₂ Filter: Activity 6's v1.1 lab.
 *
 * A research simulator combined with a resource-management game. Learners
 * configure a virtual Au/TiO₂ filter, run the model, watch it at four zoom
 * levels, and pay for every computational action in virtual Simulation
 * Credits from a budget kept in Firestore.
 *
 * Two rules hold everywhere on this page:
 *   1. Every number the model produces is labelled MODEL OUTPUT. None of them
 *      is a measurement (see filterModel.js).
 *   2. Every price is labelled as virtual simulation credits. None is a real
 *      price. The formula behind each price is shown, never hidden
 *      (see pricing.js). The balance itself is enforced by firestore.rules.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FILTER_PARAMETERS, FILTER_MODEL_VERSION, FILTER_BASELINE_LABEL, MODEL_OUTPUT, CATALYST_CONFIGS, SWEEPS, AVOGADRO,
  defaultFilterParameters, normaliseFilterParameters, simulateFilter, filterStateAt, filterRates, runSweep
} from './filterModel.js';
import {
  ACTIONS, BUDGET_PRESETS, DEFAULT_PRESET, ECONOMY_VERSION, VIRTUAL_NOTICE, CREDIT_LABEL, FREE_ACTIONS,
  PARTICLE_TIERS, RESOLUTIONS, STARTING_PARTICLE_CAP, STARTING_NANOPARTICLES, MAX_NANOPARTICLES, MAX_TRACKED,
  CONFIRM_THRESHOLD, RESET_COOLDOWN_HOURS, quote, formatCredits
} from './pricing.js';
import {
  InsufficientCreditsError, getBudget, createBudget, charge, resetBudget, listTransactions, newId, startRun,
  saveRunResults, listRuns, saveConfiguration, listSavedConfigurations, saveReport
} from './ledger.js';
import { FilterScene, VIEWS, PATHWAY, SPECIES_COLORS } from './FilterScene.jsx';
import {
  GLOSSARY, Modal, Formula, WhyCost, WhyModal, XYChart, HistoryTable, LedgerTable,
  historyRows, csv, download, ledgerCsv, fmtDate, fmtTime
} from './labParts.jsx';
import { LineChart } from '../LineChart.jsx';
import { getAuthClaims } from '../../../../firebase.js';
import './filterLab.css';

const PARAMS_KEY = 'hearisland.so2filter.params.v1';
const SECONDS_PER_SIM_MIN = 6;
const SPEEDS = { slow: 0.25, normal: 1, fast: 5 };
const RUN_COLOR = '#7dd3fc';
// Validated categorical palette (dataviz slots), one colour per configuration.
const COMPARE_COLORS = ['#3987e5', '#d95926', '#2ca58d', '#c94f9b', '#e0b400', '#8a63d2', '#6b7a8f'];

const CHARTS = [
  { field: 'so2Out', title: 'SO₂ concentration vs time', unit: 'outlet ppm' },
  { field: 'sulfateUg', title: 'Sulfate formation vs time', unit: 'µg SO₄²⁻ formed' },
  { field: 'conversionPct', title: 'Conversion percentage', unit: '% of SO₂ fed → sulfate' },
  { field: 'throughputNmolMin', title: 'Filter throughput', unit: 'nmol SO₂ removed / min' },
  { field: 'siteUtilization', title: 'Estimated active-site utilization', unit: 'fraction of sites occupied', yCap: 1 },
  { field: 'surfaceResidenceMin', title: 'Particle residence time', unit: 'mean min on the surface' },
  { field: 'turnoversPerSite', title: 'Catalyst utilization', unit: 'sulfate formed per site' },
  { field: 'computeMops', title: 'Energy / computational usage', unit: 'million operations (estimate)' }
];

const METERED = ['HIGH_RESOLUTION_SIMULATION', 'FAST_FORWARD', 'NANOPARTICLE_VIEW', 'ACTIVE_SITE_VIEW'];
const VIEW_ACTION = { nano: 'NANOPARTICLE_VIEW', site: 'ACTIVE_SITE_VIEW' };

function readStoredParams() {
  try {
    const raw = localStorage.getItem(PARAMS_KEY);
    return raw ? normaliseFilterParameters(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

const sig = (v, n = 3) => (Number.isFinite(v) ? (Math.abs(v) >= 1000 ? Math.round(v).toLocaleString('en-US') : Number(v.toPrecision(n)).toString()) : '—');
const pct = (v, d = 1) => (Number.isFinite(v) ? `${v.toFixed(d)}%` : '—');
const sci = (v) => (Number.isFinite(v) && v !== 0 ? (Math.abs(v) < 0.01 || Math.abs(v) >= 1e6 ? v.toExponential(2) : v.toFixed(2)) : '—');

/** A zero state for the scene before any run exists. Nothing has been computed. */
function idleState(params, slices) {
  return {
    t: 0, so2Out: params.so2Ppm, removal: 0, fedMol: 0, releasedMol: 0, siteUtilization: 0,
    thetaSO2: 0, thetaSO3: 0, thetaSO4: 0,
    slices: Array.from({ length: slices }, () => ({ so2Ppm: params.so2Ppm, thetaSO2: 0, thetaSO3: 0, thetaSO4: 0 }))
  };
}

/** Adds the computational-usage estimate to each sample: model steps plus animated particle updates. */
function withComputeEstimate(sim, compute) {
  const perMinModel = (sim.integrationSteps / sim.parameters.durationMin) * sim.rates.slices * 12;
  const perMinParticles = compute.particleCount * SECONDS_PER_SIM_MIN * 60;
  return { ...sim, samples: sim.samples.map((s) => ({ ...s, computeMops: ((perMinModel + perMinParticles) * s.t) / 1e6 })) };
}

export function GoldFilterLab({ uid }) {
  const [params, setParams] = useState(() => readStoredParams() || defaultFilterParameters());
  const [compute, setCompute] = useState({ particleCount: 200, resolution: 'standard', nanoparticles: STARTING_NANOPARTICLES, tracked: 0 });
  const [unlocks, setUnlocks] = useState({ particleCap: STARTING_PARTICLE_CAP, highRes: false });
  const [budget, setBudget] = useState({ status: 'loading', data: null });
  const [ledger, setLedger] = useState([]);
  const [runs, setRuns] = useState([]);
  const [saved, setSaved] = useState([]);
  const [staff, setStaff] = useState(false);
  const [run, setRun] = useState(null);
  const [runKey, setRunKey] = useState(0);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speedMode, setSpeedMode] = useState('normal');
  const [view, setView] = useState('filter');
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [session, setSession] = useState({ cost: 0, units: 0, last: null });
  const [sweeps, setSweeps] = useState({});
  const [comparison, setComparison] = useState({ selected: ['current', 'au-only', 'control', 'small-np', 'large-np'], result: null });
  const [perfGraph, setPerfGraph] = useState(null);
  const [saveName, setSaveName] = useState('');
  const [resetPreset, setResetPreset] = useState(DEFAULT_PRESET);
  const acked = useRef(new Set());
  const billed = useRef(new Set());
  const completed = useRef(new Set());
  const prevT = useRef(0);
  const chartsRef = useRef(null);

  const balance = budget.data?.balance ?? 0;
  const duration = run ? run.sim.parameters.durationMin : params.durationMin;

  useEffect(() => {
    try { localStorage.setItem(PARAMS_KEY, JSON.stringify(params)); } catch { /* per-device convenience only */ }
  }, [params]);

  // ------------------------------------------------------------------ load
  async function reload() {
    if (!uid) return;
    try {
      const [b, tx, r, s, claims] = await Promise.all([
        getBudget(uid), listTransactions(uid), listRuns(uid), listSavedConfigurations(uid), getAuthClaims()
      ]);
      setBudget({ status: 'ready', data: b });
      setLedger(tx);
      setRuns(r);
      setSaved(s);
      setStaff(['teacher', 'admin', 'supervisor'].includes(claims?.role));
    } catch (err) {
      console.warn('[SO2 filter] load failed:', err?.message);
      setBudget({ status: 'error', data: null });
    }
  }
  useEffect(() => { reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [uid]);

  // ------------------------------------------------------------------ clock
  const lastFrame = useRef(null);
  useEffect(() => {
    if (!playing) { lastFrame.current = null; return undefined; }
    let raf;
    const tick = (now) => {
      const dt = lastFrame.current == null ? 0 : (now - lastFrame.current) / 1000;
      lastFrame.current = now;
      setT((prev) => {
        const next = prev + (dt / SECONDS_PER_SIM_MIN) * SPEEDS[speedMode];
        if (next >= duration) { setPlaying(false); return duration; }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speedMode, duration]);

  // Save results once, when a run reaches its end.
  useEffect(() => {
    if (!run || t < duration || completed.current.has(run.id)) return;
    completed.current.add(run.id);
    const summary = run.sim.summary;
    saveRunResults(uid, run.id, run.sim)
      .then(() => setRuns((rs) => rs.map((r) => (r.runId === run.id ? { ...r, result: { summary } } : r))))
      .catch((err) => setNotice({ tone: 'error', text: `Results were not saved: ${err.message}` }));
  }, [t, duration, run, uid]);

  // ------------------------------------------------------------------ paying
  function applyPaid(res) {
    setBudget({ status: 'ready', data: res.budget });
    setLedger((l) => [res.tx, ...l]);
    setSession((s) => ({ cost: s.cost + res.tx.cost, units: s.units + res.tx.units, last: { label: res.tx.label, cost: res.tx.cost } }));
    return res;
  }

  function showInsufficient(required, available, alternatives = []) {
    setModal({ type: 'insufficient', required, available, alternatives });
  }

  function handleError(err, alternatives) {
    if (err instanceof InsufficientCreditsError) showInsufficient(err.required, err.available, alternatives);
    else setNotice({ tone: 'error', text: err?.message || 'That action failed.' });
  }

  /**
   * Price check → (confirmation) → perform. `perform` does the charging itself,
   * so records and payment can be written in one transaction.
   */
  function request(quotes, perform, { confirm, alternatives = [], notes = [] } = {}) {
    if (!budget.data) { setNotice({ tone: 'error', text: 'Choose a simulation budget first.' }); return; }
    const list = (Array.isArray(quotes) ? quotes : [quotes]).filter(Boolean);
    const total = list.reduce((s, q) => s + q.cost, 0);
    if (total > balance) { showInsufficient(total, balance, alternatives); return; }
    const go = async () => {
      setModal(null);
      setBusy(true);
      try { await perform(); } catch (err) { handleError(err, alternatives); } finally { setBusy(false); }
    };
    if (confirm ?? total >= CONFIRM_THRESHOLD) setModal({ type: 'confirm', quotes: list, total, balance, notes, onConfirm: go });
    else go();
  }

  // ------------------------------------------------------------------ run
  const runQuotes = (c = compute, p = params) => [
    quote('START_SIMULATION', { resolution: c.resolution, particleCount: c.particleCount, minutes: p.durationMin, nanoparticles: c.nanoparticles }),
    c.tracked > 0 ? quote('MOLECULAR_TRAJECTORY_TRACKING', { quantity: c.tracked, resolution: c.resolution }) : null
  ].filter(Boolean);
  const runTotal = (c, p) => runQuotes(c, p).reduce((s, q) => s + q.cost, 0);

  function runAlternatives() {
    const alts = [];
    const add = (label, c, p) => alts.push({ label, cost: runTotal(c, p), apply: () => { setCompute(c); setParams(p); setModal(null); } });
    if (compute.resolution === 'high') add('Reduce resolution to standard', { ...compute, resolution: 'standard' }, params);
    if (params.durationMin > 1) {
      let m = params.durationMin - 1;
      while (m > 1 && runTotal(compute, { ...params, durationMin: m }) > balance) m--;
      add(`Reduce simulation time to ${m} min`, compute, { ...params, durationMin: m });
    }
    if (compute.particleCount > 200) add('Reduce particle count to 200', { ...compute, particleCount: 200 }, params);
    if (compute.tracked > 0) add('Disable molecular tracking', { ...compute, tracked: 0 }, params);
    if (compute.nanoparticles > STARTING_NANOPARTICLES) add(`Simulate ${STARTING_NANOPARTICLES} Au nanoparticles`, { ...compute, nanoparticles: STARTING_NANOPARTICLES }, params);
    return alts;
  }

  function onRun() {
    const quotes = runQuotes();
    const notes = [];
    if (compute.resolution === 'high') {
      const hr = quote('HIGH_RESOLUTION_SIMULATION', { quantity: 1, particleCount: compute.particleCount });
      notes.push(`High resolution is also metered at ${formatCredits(hr.cost)} per simulated minute while the run plays (about ${formatCredits(hr.cost * params.durationMin)} for ${params.durationMin} min).`);
    }
    if (VIEW_ACTION[view]) notes.push(`The ${VIEWS.find((v) => v.id === view).label.toLowerCase()} is metered per simulated minute while it is open.`);
    request(quotes, async () => {
      const c = { ...compute };
      const p = normaliseFilterParameters(params);
      const [start, track] = runQuotes(c, p);
      const runId = newId('simulationRuns');
      const sim = withComputeEstimate(simulateFilter(p, { resolution: c.resolution }), c);
      applyPaid(await startRun(uid, start, { runId, parameters: sim.parameters, compute: c }));
      if (track) applyPaid(await charge(uid, track, { simulationRunId: runId }));
      billed.current = new Set();
      acked.current = new Set(VIEW_ACTION[view] ? [view] : []);
      prevT.current = 0;
      setRun({ id: runId, sim, compute: c });
      setRuns((rs) => [{ runId, parameters: sim.parameters, compute: c, createdMs: Date.now(), startCost: start.cost, result: null }, ...rs]);
      setT(0);
      setRunKey((k) => k + 1);
      setPlaying(true);
    }, { confirm: quotes.reduce((s, q) => s + q.cost, 0) >= CONFIRM_THRESHOLD || notes.length > 0, alternatives: runAlternatives(), notes });
  }

  function onReset() {
    if (!run) return;
    const q = quote('RESET_SIMULATION');
    setPlaying(false);
    request(q, async () => {
      applyPaid(await charge(uid, q, { simulationRunId: run.id }));
      billed.current = new Set();
      prevT.current = 0;
      setT(0);
      setRunKey((k) => k + 1);
    }, { confirm: false });
  }

  function onStep() {
    if (!run || t >= duration) return;
    const q = quote('STEP_MODE', { quantity: 1, resolution: run.compute.resolution, particleCount: run.compute.particleCount });
    setPlaying(false);
    request(q, async () => {
      applyPaid(await charge(uid, q, { simulationRunId: run.id }));
      setT((v) => Math.min(duration, v + duration / 20));
    }, { confirm: false });
  }

  function meteredQuote(action, c = run?.compute || compute) {
    return quote(action, { quantity: 1, resolution: c.resolution, particleCount: c.particleCount, nanoparticles: c.nanoparticles });
  }

  // Metered charges: one ledger row per item per simulated minute, billed as
  // the clock enters that minute.
  useEffect(() => {
    if (!run) { prevT.current = 0; return; }
    const from = prevT.current;
    prevT.current = t;
    if (t <= from || from >= duration) return;
    const items = [];
    if (run.compute.resolution === 'high') items.push('HIGH_RESOLUTION_SIMULATION');
    if (speedMode === 'fast' && playing) items.push('FAST_FORWARD');
    if (VIEW_ACTION[view]) items.push(VIEW_ACTION[view]);
    const last = Math.floor(Math.min(t, duration) - 1e-9);
    for (let m = Math.floor(from); m <= last; m++) {
      for (const action of items) {
        const key = `${runKey}:${action}:${m}`;
        if (billed.current.has(key)) continue;
        billed.current.add(key);
        const q = meteredQuote(action);
        charge(uid, q, { simulationRunId: run.id }).then(applyPaid).catch((err) => {
          billed.current.delete(key);
          setPlaying(false);
          setT(m);
          prevT.current = m;
          handleError(err, [
            VIEW_ACTION[view] && { label: 'Switch to the filter view (free)', cost: 0, apply: () => { setView('filter'); setModal(null); } },
            speedMode === 'fast' && { label: 'Turn off fast-forward (free)', cost: 0, apply: () => { setSpeedMode('normal'); setModal(null); } }
          ].filter(Boolean));
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  function guardMetered(action, onOk, key) {
    const q = meteredQuote(action);
    if (q.cost > balance) { showInsufficient(q.cost, balance, [{ label: 'Stay in the free filter view', cost: 0, apply: () => setModal(null) }]); return; }
    if (!run || acked.current.has(key)) { onOk(); return; }
    setModal({
      type: 'confirm',
      quotes: [q],
      total: q.cost,
      balance,
      perMinute: true,
      notes: [`Charged ${formatCredits(q.cost)} for each simulated minute that plays while this is on. Nothing is charged while paused.`],
      onConfirm: () => { acked.current.add(key); setModal(null); onOk(); }
    });
  }

  function chooseView(v) {
    if (VIEW_ACTION[v]) guardMetered(VIEW_ACTION[v], () => setView(v), v);
    else setView(v);
  }

  function toggleFast() {
    if (speedMode === 'fast') { setSpeedMode('normal'); return; }
    guardMetered('FAST_FORWARD', () => setSpeedMode('fast'), 'fast');
  }

  // ------------------------------------------------------------------ purchases
  function buy(action, onDone) {
    const q = quote(action);
    request(q, async () => { applyPaid(await charge(uid, q, { simulationRunId: run?.id ?? null })); onDone(); });
  }

  function onSweep(id) {
    const q = quote(id, { resolution: compute.resolution });
    request(q, async () => {
      applyPaid(await charge(uid, q, { simulationRunId: run?.id ?? null }));
      const ids = id === 'FULL_PARAMETER_SWEEP' ? Object.keys(SWEEPS) : [id];
      const res = {};
      for (const s of ids) res[s] = { points: runSweep(s, params, { resolution: compute.resolution }), params: { ...params } };
      setSweeps((prev) => ({ ...prev, ...res }));
    }, {
      alternatives: compute.resolution === 'high'
        ? [{ label: 'Reduce resolution to standard', cost: quote(id, { resolution: 'standard' }).cost, apply: () => { setCompute((c) => ({ ...c, resolution: 'standard' })); setModal(null); } }]
        : []
    });
  }

  function onCompare() {
    const ids = comparison.selected;
    if (!ids.length) return;
    const q = quote('CATALYST_COMPARISON', { quantity: ids.length, resolution: compute.resolution });
    request(q, async () => {
      applyPaid(await charge(uid, q, { simulationRunId: run?.id ?? null }));
      const share = q.cost / ids.length;
      const rows = ids.map((id, i) => {
        const cfg = CATALYST_CONFIGS.find((c) => c.id === id);
        const sim = simulateFilter(cfg.apply(normaliseFilterParameters(params)), { resolution: compute.resolution });
        return { id, label: cfg.label, color: COMPARE_COLORS[i % COMPARE_COLORS.length], sim, cost: share };
      });
      setComparison((c) => ({ ...c, result: { rows, params: { ...params } } }));
    });
  }

  function onPerfGraph() {
    const q = quote('GENERATE_PERFORMANCE_GRAPH');
    request(q, async () => {
      applyPaid(await charge(uid, q, { simulationRunId: run?.id ?? null }));
      setPerfGraph({ at: new Date(), points: history.filter((h) => h.complete).map((h) => ({ x: h.cost, y: h.conversion, label: h.label })) });
    });
  }

  function onExportData() {
    if (!run) return;
    const q = quote('EXPORT_DATA');
    request(q, async () => {
      applyPaid(await charge(uid, q, { simulationRunId: run.id }));
      const fields = ['t', 'so2Out', 'removal', 'sulfateUg', 'releasedUg', 'conversionPct', 'throughputNmolMin', 'siteUtilization', 'thetaSO2', 'thetaSO3', 'thetaSO4', 'surfaceResidenceMin', 'turnoversPerSite', 'waterUsedNmol', 'protonsNmol', 'electronsNmol', 'computeMops'];
      const rows = [[`# ${MODEL_OUTPUT} - ${FILTER_MODEL_VERSION} - run ${run.id} - not measured data`], fields,
        ...run.sim.samples.map((s) => fields.map((f) => (Number.isFinite(s[f]) ? Number(s[f].toPrecision(6)) : '')))];
      download(`so2-filter-${run.id}.csv`, csv(rows));
    }, { confirm: false });
  }

  async function onExportGraphics() {
    if (!run) return;
    const q = quote('EXPORT_HIGH_RES_GRAPHICS');
    request(q, async () => {
      applyPaid(await charge(uid, q, { simulationRunId: run.id }));
      const blob = await chartsToPng(chartsRef.current, `${MODEL_OUTPUT} · ${FILTER_MODEL_VERSION} · run ${run.id}`);
      download(`so2-filter-${run.id}-charts.png`, blob);
    });
  }

  function onReport() {
    if (!run || !runComplete) return;
    const q = quote('GENERATE_DETAILED_REPORT');
    request(q, async () => {
      const title = `Au/TiO₂ SO₂ filter - ${historyLabel(run.id)}`;
      const res = await saveReport(uid, q, { simulationRunId: run.id, summary: run.sim.summary, title });
      applyPaid(res);
      const rows = [res.tx, ...ledger].filter((x) => x.simulationRunId === run.id);
      download(`so2-filter-report-${run.id}.html`, buildReport({ title, run, ledgerRows: rows, runCost: rows.reduce((s, x) => s + x.cost, 0) }), 'text/html');
    });
  }

  function onSave() {
    const q = quote('SAVE_SIMULATION');
    request(q, async () => {
      applyPaid(await saveConfiguration(uid, q, { name: saveName || `Configuration ${saved.length + 1}`, parameters: normaliseFilterParameters(params), compute, simulationRunId: run?.id ?? null }));
      setSaveName('');
      setSaved(await listSavedConfigurations(uid));
    }, { confirm: false });
  }

  function onLoad(s) {
    const q = quote('LOAD_SAVED_SIMULATION');
    request(q, async () => {
      applyPaid(await charge(uid, q, { simulationRunId: null, refId: s.id }));
      setParams(normaliseFilterParameters(s.parameters));
      const c = s.compute || {};
      setCompute({
        // Paid upgrades stay paid: a saved setting above what this session unlocked is capped.
        particleCount: Math.min(c.particleCount || 200, unlocks.particleCap),
        resolution: c.resolution === 'high' && unlocks.highRes ? 'high' : 'standard',
        nanoparticles: Math.min(c.nanoparticles || STARTING_NANOPARTICLES, compute.nanoparticles),
        tracked: Math.min(MAX_TRACKED, c.tracked || 0)
      });
    }, { confirm: false });
  }

  // ------------------------------------------------------------------ budget
  async function onCreateBudget(preset) {
    setBusy(true);
    try {
      const b = await createBudget(uid, preset);
      setBudget({ status: 'ready', data: b });
    } catch (err) {
      setNotice({ tone: 'error', text: `Could not create the budget: ${err.message}` });
    } finally { setBusy(false); }
  }

  const resetAvailableAt = budget.data?.lastResetAt?.toDate
    ? new Date(budget.data.lastResetAt.toDate().getTime() + RESET_COOLDOWN_HOURS * 3600e3)
    : null;
  const canReset = resetAvailableAt && Date.now() > resetAvailableAt.getTime();

  function onResetBudget() {
    const amount = BUDGET_PRESETS[resetPreset].amount;
    setModal({
      type: 'plain',
      title: 'Reset simulation budget?',
      body: (
        <>
          <p>Your balance will be set to <b>{formatCredits(amount)}</b> ({BUDGET_PRESETS[resetPreset].label}). The reset is recorded in your ledger, and the next reset is possible in {RESET_COOLDOWN_HOURS} hours.</p>
          <p className="gf-muted">Virtual simulation budget only. No real money is involved.</p>
        </>
      ),
      onConfirm: async () => {
        setModal(null);
        setBusy(true);
        try {
          await resetBudget(uid, resetPreset);
          await reload();
          setNotice({ tone: 'ok', text: `Budget reset to ${formatCredits(amount)}.` });
        } catch (err) {
          setNotice({ tone: 'error', text: `Reset refused: ${err.message}` });
        } finally { setBusy(false); }
      }
    });
  }

  // ------------------------------------------------------------------ derived
  const slices = compute.resolution === 'high' ? 10 : 5;
  const previewRates = useMemo(() => filterRates(params, { slices }), [params, slices]);
  const live = run ? filterStateAt(run.sim.samples, t) : idleState(normaliseFilterParameters(params), slices);
  const sceneParams = run ? run.sim.parameters : normaliseFilterParameters(params);
  const sceneCompute = run
    ? { ...run.compute, slices: run.sim.rates.slices }
    : { ...compute, slices };
  const runComplete = run && t >= duration;

  const costByRun = useMemo(() => {
    const m = {};
    for (const x of ledger) if (x.simulationRunId) m[x.simulationRunId] = (m[x.simulationRunId] || 0) + x.cost;
    return m;
  }, [ledger]);
  const history = useMemo(() => historyRows(runs, costByRun), [runs, costByRun]);
  const historyLabel = (id) => history.find((h) => h.id === id)?.label || id;
  const runCost = run ? costByRun[run.id] || 0 : 0;

  const nextQuotes = runQuotes();
  const nextTotal = nextQuotes.reduce((s, q) => s + q.cost, 0);
  const activeMeters = run ? [
    run.compute.resolution === 'high' && playing ? 'HIGH_RESOLUTION_SIMULATION' : null,
    speedMode === 'fast' && playing ? 'FAST_FORWARD' : null,
    VIEW_ACTION[view] && playing ? VIEW_ACTION[view] : null
  ].filter(Boolean) : [];

  const efficiency = run ? (() => {
    const s = runComplete ? run.sim.summary : live;
    const conv = s.conversionPct;
    const sulfateG = (s.sulfateUg ?? 0) / 1e6;
    const molecules = (runComplete ? run.sim.samples.at(-1).removedMol : live.removedMol) * AVOGADRO;
    const util = runComplete ? run.sim.summary.catalystUtilization : live.turnoversPerSite;
    return {
      conv,
      cost: runCost,
      perPct: conv > 0 ? runCost / conv : null,
      perGram: sulfateG > 0 ? runCost / sulfateG : null,
      perThousand: molecules > 0 ? (runCost / molecules) * 1000 : null,
      perMin: runCost / Math.max(1e-9, runComplete ? duration : Math.max(t, 1e-9)),
      utilPerDollar: runCost > 0 ? util / runCost : null
    };
  })() : null;

  const setParam = (key, value) => setParams((p) => ({ ...p, [key]: value }));
  const openInfo = (term) => setModal({ type: 'info', term });

  // ------------------------------------------------------------------ render
  if (!uid) {
    return <div className="gf"><p className="gf-empty">Sign in to use the filter lab. Simulation credits are kept per learner.</p></div>;
  }

  return (
    <div className="gf">
      <header className="gf-hero">
        <div>
          <span className="gf-eyebrow">Activity 6 · New · Research simulator + resource game</span>
          <h2>GOLD NANOPARTICLE SO₂ FILTER</h2>
          <p>
            Configure a virtual filter of gold nanoparticles on titanium dioxide, send SO₂ through it and watch the model
            convert it toward sulfate at four zoom levels. Every action costs virtual Simulation Credits. Manage your
            research budget and decide which experiments are worth running.
          </p>
        </div>
        <dl className="gf-version">
          <div><dt>Model</dt><dd><code>{FILTER_MODEL_VERSION}</code></dd></div>
          <div><dt>Baseline date</dt><dd>{FILTER_BASELINE_LABEL}</dd></div>
          <div><dt>Economy model</dt><dd><code>{ECONOMY_VERSION}</code></dd></div>
          <div><dt>Platform</dt><dd>Firebase</dd></div>
        </dl>
      </header>

      <div className="gf-virtual" role="note">
        <strong>VIRTUAL CREDITS</strong> {VIRTUAL_NOTICE} They are an educational cost metric, not prices for gold,
        chemicals, laboratory equipment or industrial filtration.
      </div>
      <div className="so2-warning" role="note">
        <strong>⚠ Safety</strong>
        SO₂ is a hazardous gas. This is a computational educational model. It is not a filter design and does not give laboratory operating instructions.
      </div>

      {notice && (
        <div className={`gf-notice gf-notice-${notice.tone}`} role="status">
          {notice.text} <button type="button" className="so2-link" onClick={() => setNotice(null)}>Dismiss</button>
        </div>
      )}

      {budget.status === 'loading' && <p className="gf-muted">Loading your simulation budget…</p>}
      {budget.status === 'error' && <p className="so2-err">Could not load your simulation budget. <button type="button" className="so2-link" onClick={reload}>Try again</button></p>}
      {budget.status === 'ready' && !budget.data && (
        <section className="gf-onboard">
          <h3>Choose a virtual research budget</h3>
          <p className="gf-muted">Pick a starting balance of Simulation Credits. These are virtual budgets only. No real money is involved, and nothing can be bought.</p>
          <div className="gf-presets">
            {Object.entries(BUDGET_PRESETS).map(([id, p]) => {
              const locked = p.staffOnly && !staff;
              return (
                <button key={id} type="button" className="gf-preset" disabled={busy || locked} onClick={() => onCreateBudget(id)}>
                  <span>{p.label.toUpperCase()}</span>
                  <b>{formatCredits(p.amount)}</b>
                  <small>{locked ? 'Teacher or admin accounts only' : 'Simulation credits'}</small>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {budget.data && (
        <>
          {/* ----------------------------------------------------- cost panel */}
          <section className="gf-costbar" aria-label="Cost panel">
            <div className="gf-stat gf-stat-main"><span>Simulation credit</span><b>{formatCredits(balance)}</b><small>{CREDIT_LABEL}</small></div>
            <div className="gf-stat"><span>Session cost</span><b>{formatCredits(session.cost)}</b><small>since this page opened</small></div>
            <div className="gf-stat"><span>Total simulation cost</span><b>{formatCredits(budget.data.totalSpent)}</b><small>all time</small></div>
            <div className="gf-stat">
              <span>Current action</span>
              {activeMeters.length
                ? activeMeters.map((a) => <b key={a} className="gf-meter">{ACTIONS[a].label.toUpperCase()} −{formatCredits(meteredQuote(a).cost)}/min</b>)
                : session.last ? <b className="gf-meter">{session.last.label.toUpperCase()} −{formatCredits(session.last.cost)}</b> : <b className="gf-meter">—</b>}
              <small>cost per action</small>
            </div>
            <div className="gf-stat"><span>Computational units used</span><b>{sig(budget.data.totalUnits || 0)}</b><small>{sig(session.units)} this session</small></div>
            <div className="gf-stat"><span>Budget</span><b className="gf-meter">{BUDGET_PRESETS[budget.data.preset]?.label.toUpperCase()}</b><small>{formatCredits(budget.data.startingBalance)} start</small></div>
          </section>

          <div className="gf-layout">
            {/* --------------------------------------------------- controls */}
            <aside className="gf-side" aria-label="Simulation controls">
              <h3>FILTER CONFIGURATION</h3>
              <p className="gf-muted">Model inputs. Defaults are illustrative, not validated operating conditions.</p>
              {FILTER_PARAMETERS.map((def) => (
                <div key={def.key} className="so2-param">
                  <div className="so2-param-head">
                    <label htmlFor={`gf-${def.key}`}>{def.label}</label>
                    <output>{params[def.key]}<small> {def.unit}</small></output>
                  </div>
                  <input id={`gf-${def.key}`} type="range" min={def.min} max={def.max} step={def.step} value={params[def.key]}
                    onChange={(e) => setParam(def.key, Number(e.target.value))} />
                </div>
              ))}
              <button type="button" className="so2-link" onClick={() => setParams(defaultFilterParameters())}>Restore defaults</button>

              <h3 className="gf-side-h">COMPUTATION</h3>
              <label className="gf-field">Number of simulated particles
                <select value={compute.particleCount} onChange={(e) => setCompute((c) => ({ ...c, particleCount: Number(e.target.value) }))}>
                  {PARTICLE_TIERS.map((tier) => (
                    <option key={tier.count} value={tier.count} disabled={tier.count > unlocks.particleCap}>
                      {tier.count} particles (×{tier.multiplier}){tier.count > unlocks.particleCap ? ' - locked' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label className="gf-field">Resolution
                <select value={compute.resolution} onChange={(e) => setCompute((c) => ({ ...c, resolution: e.target.value }))}>
                  {Object.entries(RESOLUTIONS).map(([id, r]) => (
                    <option key={id} value={id} disabled={id === 'high' && !unlocks.highRes}>{r.label} (×{r.multiplier}){id === 'high' && !unlocks.highRes ? ' - locked' : ''}</option>
                  ))}
                </select>
              </label>
              <div className="gf-field">
                <span>Simulated Au nanoparticles: <b>{compute.nanoparticles}</b> (×{quote('START_SIMULATION', { nanoparticles: compute.nanoparticles }).multipliers.nanoparticles})</span>
                <small className="gf-muted">Detail of the catalyst representation. Chemistry follows the loading and size above.</small>
                {compute.nanoparticles > STARTING_NANOPARTICLES && (
                  <button type="button" className="so2-link" onClick={() => setCompute((c) => ({ ...c, nanoparticles: c.nanoparticles - 100 }))}>Use 100 fewer (free)</button>
                )}
              </div>
              <label className="gf-field">Molecular trajectory tracking
                <select value={compute.tracked} onChange={(e) => setCompute((c) => ({ ...c, tracked: Number(e.target.value) }))}>
                  {Array.from({ length: MAX_TRACKED + 1 }, (_, i) => <option key={i} value={i}>{i === 0 ? 'Off' : `${i} tracked molecule${i > 1 ? 's' : ''} (${formatCredits(quote('MOLECULAR_TRAJECTORY_TRACKING', { quantity: i, resolution: compute.resolution }).cost)})`}</option>)}
                </select>
                <WhyCost action="MOLECULAR_TRAJECTORY_TRACKING" onOpen={(a) => setModal({ type: 'why', action: a })} />
              </label>

              <div className="gf-upgrades">
                <UpgradeButton action="INCREASE_PARTICLE_RESOLUTION" disabled={busy || unlocks.highRes} done={unlocks.highRes} doneLabel="High resolution unlocked"
                  onClick={() => buy('INCREASE_PARTICLE_RESOLUTION', () => { setUnlocks((u) => ({ ...u, highRes: true })); setCompute((c) => ({ ...c, resolution: 'high' })); })} />
                <UpgradeButton action="DOUBLE_PARTICLE_COUNT" disabled={busy || unlocks.particleCap >= 3200} done={unlocks.particleCap >= 3200} doneLabel="Maximum particles unlocked"
                  onClick={() => buy('DOUBLE_PARTICLE_COUNT', () => { const cap = Math.min(3200, unlocks.particleCap * 2); setUnlocks((u) => ({ ...u, particleCap: cap })); setCompute((c) => ({ ...c, particleCount: cap })); })} />
                <UpgradeButton action="ADD_100_AU_NANOPARTICLES" disabled={busy || compute.nanoparticles >= MAX_NANOPARTICLES}
                  onClick={() => buy('ADD_100_AU_NANOPARTICLES', () => setCompute((c) => ({ ...c, nanoparticles: Math.min(MAX_NANOPARTICLES, c.nanoparticles + 100) })))} />
                <p className="gf-muted">Upgrades last for this session and affect your next run.</p>
              </div>

              <div className="gf-next">
                <span>COST OF NEXT ACTION: RUN SIMULATION</span>
                <b>{formatCredits(nextTotal)}</b>
                {nextQuotes.map((q) => <Formula key={q.action} q={q} />)}
                <WhyCost action="START_SIMULATION" onOpen={(a) => setModal({ type: 'why', action: a })} />
              </div>
            </aside>

            {/* --------------------------------------------------- main */}
            <main className="gf-main">
              <section className="gf-screen">
                <div className="gf-screen-head">
                  <span className="gf-live">{run ? (playing ? '● LIVE MICROSCOPIC SIMULATION' : runComplete ? '■ RUN COMPLETE' : '❚❚ PAUSED') : '○ READY'}</span>
                  <span className="gf-route">SO₂ → Au/TiO₂ → SO₄²⁻</span>
                  <span className="gf-kpi">Conversion: <b>{run ? pct(live.conversionPct) : '—'}</b> <small>{MODEL_OUTPUT}</small></span>
                  <span className="gf-kpi">Sulfate: <b>{run ? `${sig(live.sulfateUg)} µg` : '—'}</b> <small>{MODEL_OUTPUT}</small></span>
                  <span className="gf-kpi">Filter efficiency: <b>{run ? pct(100 * live.removal) : '—'}</b> <small>{MODEL_OUTPUT}</small></span>
                </div>

                <div className="gf-controls" role="group" aria-label="Run controls">
                  <button type="button" className="gf-btn gf-primary" onClick={onRun} disabled={busy || playing}>▶ RUN <small>{formatCredits(nextTotal)}</small></button>
                  {playing
                    ? <button type="button" className="gf-btn" onClick={() => setPlaying(false)}>❚❚ PAUSE <small>$0</small></button>
                    : <button type="button" className="gf-btn" onClick={() => setPlaying(true)} disabled={!run || runComplete}>▶ RESUME <small>$0</small></button>}
                  <button type="button" className="gf-btn" onClick={onReset} disabled={busy || !run}>↺ RESET <small>$10</small></button>
                  <button type="button" className="gf-btn" onClick={onStep} disabled={busy || !run || runComplete}>⏭ STEP <small>{formatCredits(quote('STEP_MODE', { resolution: run?.compute.resolution, particleCount: run?.compute.particleCount }).cost)}</small></button>
                  <button type="button" className={`gf-btn${speedMode === 'fast' ? ' is-on' : ''}`} aria-pressed={speedMode === 'fast'} onClick={toggleFast}>⏩ FAST FORWARD <small>{formatCredits(meteredQuote('FAST_FORWARD').cost)}/min</small></button>
                  <button type="button" className={`gf-btn${speedMode === 'slow' ? ' is-on' : ''}`} aria-pressed={speedMode === 'slow'} onClick={() => setSpeedMode((s) => (s === 'slow' ? 'normal' : 'slow'))}>🐢 SLOW MOTION <small>$0</small></button>
                  <div className="gf-clock"><span>Simulated time</span><b>{t.toFixed(2)}</b><small>/ {duration} min · {SPEEDS[speedMode]}×</small></div>
                </div>
                <div className="so2-progress" aria-hidden="true"><div style={{ width: `${(t / duration) * 100}%` }} /></div>

                <nav className="gf-zoom" aria-label="Zoom level">
                  {VIEWS.map((v, i) => {
                    const action = VIEW_ACTION[v.id];
                    return (
                      <button key={v.id} type="button" className={view === v.id ? 'is-active' : ''} aria-pressed={view === v.id} onClick={() => chooseView(v.id)}>
                        <b>{v.label.toUpperCase()}</b>
                        <small>{v.scale} · {action ? `${formatCredits(meteredQuote(action).cost)}/min` : 'free'}</small>
                        {i < VIEWS.length - 1 && <i aria-hidden="true">→</i>}
                      </button>
                    );
                  })}
                </nav>

                <FilterScene
                  view={view}
                  state={live}
                  rates={run ? run.sim.rates : previewRates}
                  params={sceneParams}
                  compute={sceneCompute}
                  playing={playing}
                  speed={SPEEDS[speedMode]}
                  runKey={runKey}
                  onPick={openInfo}
                />
                <div className="gf-legend">
                  {[
                    ['so2', 'SO₂ gas'], ['A', 'SO₂* adsorbed'], ['B', 'SO₃* intermediate'], ['C', 'SO₄* surface sulfate'],
                    ['rel', 'SO₄²⁻ output'], ['h2o', 'H₂O'], ['au', 'Au nanoparticle'], ['tio2', 'TiO₂'], ['site', 'free site']
                  ].map(([k, l]) => <span key={k}><i style={{ background: SPECIES_COLORS[k] }} />{l}</span>)}
                  <span className="gf-muted">Click anything in the view to learn what it is. Each dot stands for very many molecules; surface and output counts follow the model, individual paths are illustrative.</span>
                </div>

                <ol className="gf-pathway" aria-label="Conceptual reaction pathway">
                  {PATHWAY.map((p, i) => {
                    const value = !run ? '—' : [
                      `${sig(live.so2Out)} ppm out`,
                      `${pct(100 * live.thetaSO2, 0)} of sites`,
                      `S +4 → +6, 2e⁻`,
                      `${pct(100 * live.thetaSO3, 0)} of sites`,
                      `${pct(100 * live.thetaSO4, 0)} of sites`,
                      `${sig(live.releasedUg)} µg out`
                    ][i];
                    const term = ['so2', 'adsorption', 'oxidation', 'so3', 'so4', 'so4'][i];
                    return (
                      <li key={p.id}>
                        <button type="button" onClick={() => openInfo(term)}><b>{p.label}</b><small>{value}</small></button>
                      </li>
                    );
                  })}
                </ol>
                <div className="gf-equation">
                  <p className="so2-eq">SO₂ + 2H₂O → SO₄²⁻ + 4H⁺ + 2e⁻</p>
                  <p className="so2-caveat">Simplified oxidation representation, not a complete mechanistic description. Real surfaces can involve other intermediates and pathways, and something (often O₂) must accept the two electrons. This model does not represent that acceptor.</p>
                </div>
              </section>

              {/* ------------------------------------------------- summary */}
              <section className="gf-summary" aria-label="Summary">
                <h3>SUMMARY <small>{MODEL_OUTPUT}{run && !runComplete ? ' · at the current clock' : ''}</small></h3>
                <dl>
                  <div><dt>Initial SO₂</dt><dd>{run ? `${run.sim.parameters.so2Ppm} ppm` : '—'}</dd></div>
                  <div><dt>Final SO₂</dt><dd>{run ? `${sig(live.so2Out)} ppm` : '—'}<small>at the outlet</small></dd></div>
                  <div><dt>Estimated conversion</dt><dd>{run ? pct(live.conversionPct) : '—'}<small>SO₂ fed → sulfate</small></dd></div>
                  <div><dt>Sulfate produced</dt><dd>{run ? `${sig(live.sulfateUg)} µg` : '—'}<small>surface + output</small></dd></div>
                  <div><dt>Simulation time</dt><dd>{run ? `${t.toFixed(2)} min` : '—'}<small>simulated</small></dd></div>
                  <div><dt>Catalyst utilization</dt><dd>{run ? sci(live.turnoversPerSite) : '—'}<small>turnovers per site</small></dd></div>
                </dl>
                {run && <p className="gf-muted">Gas residence time in the filter {sig(run.sim.rates.gasResidenceS)} s. Per sulfate, the conceptual equation uses 2 H₂O and releases 4 H⁺ and 2 e⁻: so far {sig(live.waterUsedNmol)} nmol H₂O, {sig(live.protonsNmol)} nmol H⁺, {sig(live.electronsNmol)} nmol e⁻ (model).</p>}
              </section>

              {/* ------------------------------------------------- charts */}
              <section className="gf-charts" ref={chartsRef} aria-label="Real-time graphs">
                {run ? CHARTS.map((c) => (
                  <LineChart
                    key={c.field}
                    title={c.title}
                    unit={c.unit}
                    field={c.field}
                    yCap={c.yCap}
                    series={[{ id: 'run', label: 'This run', color: RUN_COLOR, samples: run.sim.samples, field: c.field }]}
                    tNow={t}
                    tMax={duration}
                    xLabel="simulated time (min)"
                    tUnit="min"
                    tag={MODEL_OUTPUT}
                    note={c.field === 'computeMops' ? 'Estimated from model steps and animated particles. Not a measured energy.' : null}
                  />
                )) : <p className="gf-empty">Run the simulation to generate model output. Graphs fill in as the run plays.</p>}
              </section>

              {/* ------------------------------------------------- efficiency */}
              <section className="gf-card">
                <h3>COST EFFICIENCY <small className="gf-tag">MODEL-DERIVED METRICS</small></h3>
                {efficiency ? (
                  <>
                    <dl className="gf-metrics">
                      <div><dt>Conversion</dt><dd>{pct(efficiency.conv)}</dd></div>
                      <div><dt>Simulation cost (this run)</dt><dd>{formatCredits(efficiency.cost)}</dd></div>
                      <div><dt>Cost / 1% conversion</dt><dd>{efficiency.perPct != null ? `$${efficiency.perPct.toFixed(2)}` : '—'}</dd></div>
                      <div><dt>Cost / simulated gram of sulfate</dt><dd>{efficiency.perGram != null ? `$${sci(efficiency.perGram)}` : '—'}</dd></div>
                      <div><dt>Cost / 1,000 simulated SO₂ molecules processed</dt><dd>{efficiency.perThousand != null ? `$${sci(efficiency.perThousand)}` : '—'}</dd></div>
                      <div><dt>Cost / simulation minute</dt><dd>${efficiency.perMin.toFixed(2)}</dd></div>
                      <div><dt>Catalyst utilization per dollar</dt><dd>{efficiency.utilPerDollar != null ? sci(efficiency.utilPerDollar) : '—'}<small>turnovers/site per $</small></dd></div>
                    </dl>
                    <p className="gf-muted">These metrics divide virtual simulation credits by model outputs. They teach how to compare effort with results. They do not represent real industrial economics or the cost of a real filter.</p>
                  </>
                ) : <p className="gf-muted">Available once a run has started.</p>}
              </section>

              {/* ------------------------------------------------- analysis tools */}
              <section className="gf-card">
                <h3>PARAMETER SWEEPS <small className="gf-tag">{MODEL_OUTPUT}</small></h3>
                <p className="gf-muted">Re-runs the model across a range of one input, keeping your other settings. Plots the final conversion for each value.</p>
                <div className="gf-tools">
                  {[...Object.keys(SWEEPS), 'FULL_PARAMETER_SWEEP'].map((id) => (
                    <span key={id} className="gf-tool">
                      <button type="button" className="gf-btn" disabled={busy} onClick={() => onSweep(id)}>
                        {ACTIONS[id].label} <small>{formatCredits(quote(id, { resolution: compute.resolution }).cost)}</small>
                      </button>
                      <WhyCost action={id} onOpen={(a) => setModal({ type: 'why', action: a })} />
                    </span>
                  ))}
                </div>
                <div className="gf-xy-grid">
                  {Object.entries(sweeps).map(([id, s]) => (
                    <XYChart key={id} title={`${SWEEPS[id].label} sweep`} xLabel={`${SWEEPS[id].label} (${SWEEPS[id].unit})`} yLabel="conversion %"
                      points={s.points.map((p) => ({ x: p.x, y: p.conversionPct }))} />
                  ))}
                </div>
              </section>

              <section className="gf-card">
                <h3>CATALYST COMPARISON <small className="gf-tag">{MODEL_OUTPUT}</small></h3>
                <p className="gf-muted">Hypothetical configurations, each run with your other settings. No configuration is ranked. Compare the columns and decide what the differences mean.</p>
                <div className="gf-checks">
                  {CATALYST_CONFIGS.map((c) => (
                    <label key={c.id} className="gf-check">
                      <input type="checkbox" checked={comparison.selected.includes(c.id)}
                        onChange={(e) => setComparison((s) => ({ ...s, selected: e.target.checked ? [...s.selected, c.id] : s.selected.filter((x) => x !== c.id) }))} />
                      {c.label}
                    </label>
                  ))}
                </div>
                <span className="gf-tool">
                  <button type="button" className="gf-btn" disabled={busy || !comparison.selected.length} onClick={onCompare}>
                    Compare {comparison.selected.length} configurations <small>{formatCredits(quote('CATALYST_COMPARISON', { quantity: Math.max(1, comparison.selected.length), resolution: compute.resolution }).cost)}</small>
                  </button>
                  <WhyCost action="CATALYST_COMPARISON" onOpen={(a) => setModal({ type: 'why', action: a })} />
                </span>
                {comparison.result && (
                  <>
                    <div className="gf-table-scroll">
                      <table className="gf-table">
                        <thead><tr><th>Configuration</th><th>Conversion</th><th>Sulfate produced</th><th>Simulation time</th><th>Catalyst utilization</th><th>Simulation cost</th><th>Cost / 1% conv.</th></tr></thead>
                        <tbody>
                          {comparison.result.rows.map((r) => (
                            <tr key={r.id}>
                              <td><i className="gf-swatch" style={{ background: r.color }} />{r.label}</td>
                              <td>{pct(r.sim.summary.conversionPct)}</td>
                              <td>{sig(r.sim.summary.sulfateUg)} µg</td>
                              <td>{r.sim.summary.simulatedMin} min</td>
                              <td>{sci(r.sim.summary.catalystUtilization)} /site</td>
                              <td>{formatCredits(r.cost)}</td>
                              <td>{r.sim.summary.conversionPct > 0 ? `$${(r.cost / r.sim.summary.conversionPct).toFixed(2)}` : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <LineChart
                      title="Conversion vs time, by configuration"
                      unit="% of SO₂ fed → sulfate"
                      field="conversionPct"
                      series={comparison.result.rows.map((r) => ({ id: r.id, label: r.label, color: r.color, samples: r.sim.samples, field: 'conversionPct' }))}
                      tNow={comparison.result.params.durationMin}
                      tMax={comparison.result.params.durationMin}
                      xLabel="simulated time (min)"
                      tUnit="min"
                      tag={MODEL_OUTPUT}
                    />
                  </>
                )}
              </section>

              <section className="gf-card">
                <h3>RESULTS, REPORTS &amp; EXPORTS</h3>
                <div className="gf-tools">
                  <span className="gf-tool"><button type="button" className="gf-btn" disabled={busy || !history.some((h) => h.complete)} onClick={onPerfGraph}>Generate performance graph <small>$15</small></button></span>
                  <span className="gf-tool"><button type="button" className="gf-btn" disabled={busy || !runComplete} onClick={onReport}>Generate detailed report <small>$50</small></button><WhyCost action="GENERATE_DETAILED_REPORT" onOpen={(a) => setModal({ type: 'why', action: a })} /></span>
                  <span className="gf-tool"><button type="button" className="gf-btn" disabled={busy || !run} onClick={onExportData}>Export data (CSV) <small>$25</small></button></span>
                  <span className="gf-tool"><button type="button" className="gf-btn" disabled={busy || !run} onClick={onExportGraphics}>Export high-resolution graphics <small>$40</small></button></span>
                </div>
                {!runComplete && <p className="gf-muted">The detailed report needs a run that has played to the end.</p>}
                {perfGraph && (
                  <XYChart title={`Performance: conversion vs total run cost (generated ${fmtTime(perfGraph.at)})`} xLabel="total run cost (simulation credits)" yLabel="conversion %"
                    points={perfGraph.points} scatter color="#c084fc" />
                )}
                <div className="gf-save">
                  <label>Name <input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder={`Configuration ${saved.length + 1}`} maxLength={80} /></label>
                  <button type="button" className="gf-btn" disabled={busy} onClick={onSave}>Save simulation <small>$5</small></button>
                </div>
                {saved.length > 0 && (
                  <ul className="gf-saved">
                    {saved.map((s) => (
                      <li key={s.id}>
                        <b>{s.name}</b>
                        <span className="gf-muted">{s.parameters.so2Ppm} ppm · {s.parameters.temperatureK} K · {s.parameters.flowLpm} L/min · {s.parameters.auLoading}% Au · {s.parameters.durationMin} min</span>
                        <button type="button" className="gf-btn gf-small" disabled={busy} onClick={() => onLoad(s)}>Load <small>$5</small></button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </main>
          </div>

          {/* ----------------------------------------------------- history */}
          <section className="gf-card">
            <h3>EXPERIMENT / SIMULATION HISTORY <small className="gf-tag">{MODEL_OUTPUT}</small></h3>
            <HistoryTable rows={history} />
          </section>

          {/* ----------------------------------------------------- ledger */}
          <section className="gf-card">
            <div className="gf-card-head">
              <h3>COST LEDGER <small className="gf-tag">VIRTUAL SIMULATION CREDITS</small></h3>
              <button type="button" className="gf-btn gf-small" onClick={() => download('simulation-credit-ledger.csv', ledgerCsv(ledger))}>Export ledger (free)</button>
            </div>
            <p className="gf-muted">Every paid action, newest first. The ledger is append-only: it cannot be edited or deleted, by you or anyone else.</p>
            <LedgerTable rows={ledger} />
          </section>

          {/* ----------------------------------------------------- budget */}
          <section className="gf-card">
            <h3>VIRTUAL BUDGET</h3>
            <p className="gf-muted">Budget presets are virtual simulation budgets only. No real money is involved and nothing can be purchased.</p>
            <div className="gf-presets gf-presets-small">
              {Object.entries(BUDGET_PRESETS).map(([id, p]) => (
                <label key={id} className={`gf-preset${resetPreset === id ? ' is-active' : ''}${p.staffOnly && !staff ? ' is-locked' : ''}`}>
                  <input type="radio" name="gf-preset" value={id} checked={resetPreset === id} disabled={p.staffOnly && !staff} onChange={() => setResetPreset(id)} />
                  <span>{p.label.toUpperCase()}</span><b>{formatCredits(p.amount)}</b>
                  {p.staffOnly && <small>teacher/admin only</small>}
                </label>
              ))}
            </div>
            <button type="button" className="gf-btn" disabled={busy || !canReset} onClick={onResetBudget}>Reset budget</button>
            <p className="gf-muted">
              {canReset
                ? `One reset every ${RESET_COOLDOWN_HOURS} hours, recorded in the ledger.`
                : resetAvailableAt ? `Next reset available ${fmtDate(resetAvailableAt)} ${fmtTime(resetAvailableAt)}. One reset every ${RESET_COOLDOWN_HOURS} hours.` : ''}
            </p>
          </section>

          <details className="so2-panel">
            <summary>Price list (SIM-COST-v1.0)</summary>
            <div className="so2-panel-body">
              <p className="gf-muted">TOTAL COST = BASE ACTION COST × QUANTITY × RESOLUTION MULTIPLIER × PARTICLE MULTIPLIER × TIME MULTIPLIER × NANOPARTICLE MULTIPLIER, rounded up to a whole credit. Multipliers that do not apply to an action are ×1.</p>
              <table className="gf-table">
                <thead><tr><th>Action</th><th>Base</th><th>Per</th><th>Scales with</th></tr></thead>
                <tbody>
                  {Object.entries(ACTIONS).map(([id, a]) => (
                    <tr key={id}><td>{a.label}</td><td>{formatCredits(a.base)}</td><td>{a.unit}</td><td>{a.scales.join(', ') || '—'}</td></tr>
                  ))}
                  {FREE_ACTIONS.map((a) => <tr key={a}><td>{a}</td><td>$0</td><td>—</td><td>—</td></tr>)}
                </tbody>
              </table>
              <p className="gf-muted">Particle multiplier: {PARTICLE_TIERS.map((p) => `${p.count} → ×${p.multiplier}`).join(', ')}. Resolution: standard ×1, high ×2. Nanoparticles: ×1 at 100, +0.25 per extra 100. Time: ×1 per simulated minute.</p>
            </div>
          </details>
        </>
      )}

      {/* ----------------------------------------------------- limitations */}
      <section className="gf-limits" aria-label="Model limitations">
        <h3>MODEL LIMITATIONS</h3>
        <ul>
          <li>The simulation is simplified. It is a lumped surface-kinetics model with a few adjustable constants, not a validated reactor model.</li>
          <li>Numerical results are model-generated. None is a measurement, and the model is not fitted to any experiment.</li>
          <li>The simulation is not a substitute for laboratory measurements.</li>
          <li>Actual catalyst performance depends on many variables this model leaves out, including pore diffusion, particle sintering, poisoning chemistry, humidity condensation, support defects and pressure drop.</li>
          <li>Real reaction mechanisms can involve additional intermediates and pathways. SO₂ + 2H₂O → SO₄²⁻ + 4H⁺ + 2e⁻ is a simplified oxidation representation.</li>
          <li>The virtual prices are not real-world chemical or laboratory prices.</li>
          <li>The simulation does not prove that a particular filter design will work in practice.</li>
          <li>The particle animation depicts the model. Each dot stands for very many molecules, and individual paths are illustrative.</li>
        </ul>
        <p className="gf-muted">Model {FILTER_MODEL_VERSION} · baseline date {FILTER_BASELINE_LABEL} · economy {ECONOMY_VERSION} · platform Firebase. The kinetic instrument (v1.0) tab cites the published Au/TiO₂ and SO₂-oxidation work this model follows qualitatively.</p>
      </section>

      {/* ----------------------------------------------------- dialogs */}
      {modal?.type === 'confirm' && (
        <Modal title={modal.perMinute ? 'This action is charged per simulated minute' : `THIS ACTION WILL COST ${formatCredits(modal.total)}`} tone="confirm" onClose={() => setModal(null)}
          actions={<><button type="button" className="gf-btn" onClick={() => setModal(null)}>CANCEL</button><button type="button" className="gf-btn gf-primary" onClick={modal.onConfirm}>CONFIRM</button></>}>
          <dl className="gf-confirm">
            <div><dt>Current balance</dt><dd>{formatCredits(modal.balance)}</dd></div>
            <div><dt>{modal.perMinute ? 'Balance after one minute' : 'Balance after action'}</dt><dd>{formatCredits(modal.balance - modal.total)}</dd></div>
          </dl>
          {modal.quotes.map((q) => <Formula key={q.action} q={q} />)}
          {modal.notes?.map((n) => <p key={n} className="gf-muted">{n}</p>)}
          <p className="gf-muted">Virtual simulation credits. Not real-world pricing.</p>
          <p><b>Continue?</b></p>
        </Modal>
      )}
      {modal?.type === 'insufficient' && (
        <Modal title="INSUFFICIENT SIMULATION CREDITS" tone="danger" onClose={() => setModal(null)}
          actions={<button type="button" className="gf-btn" onClick={() => setModal(null)}>Close</button>}>
          <p>The action was not performed.</p>
          <dl className="gf-confirm">
            <div><dt>Required</dt><dd>{formatCredits(modal.required)}</dd></div>
            <div><dt>Available</dt><dd>{formatCredits(modal.available)}</dd></div>
            <div><dt>Shortfall</dt><dd className="gf-debit">{formatCredits(modal.required - modal.available)}</dd></div>
          </dl>
          {modal.alternatives.length > 0 && (
            <>
              <h4>Lower-cost alternatives</h4>
              <ul className="gf-alts">
                {modal.alternatives.map((a) => (
                  <li key={a.label}>
                    <button type="button" className="gf-btn gf-small" onClick={a.apply}>{a.label}</button>
                    <span>{a.cost > 0 ? `new cost ${formatCredits(a.cost)}${a.cost > modal.available ? ' (still over budget)' : ''}` : 'free'}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Modal>
      )}
      {modal?.type === 'info' && GLOSSARY[modal.term] && (
        <Modal title={GLOSSARY[modal.term].title} onClose={() => setModal(null)} actions={<button type="button" className="gf-btn" onClick={() => setModal(null)}>Close</button>}>
          <p>{GLOSSARY[modal.term].text}</p>
          <div className="gf-glossary-links">
            {Object.entries(GLOSSARY).filter(([k]) => k !== modal.term).map(([k, g]) => (
              <button key={k} type="button" className="so2-link" onClick={() => setModal({ type: 'info', term: k })}>{g.title}</button>
            ))}
          </div>
        </Modal>
      )}
      {modal?.type === 'why' && <WhyModal action={modal.action} onClose={() => setModal(null)} />}
      {modal?.type === 'plain' && (
        <Modal title={modal.title} onClose={() => setModal(null)}
          actions={<><button type="button" className="gf-btn" onClick={() => setModal(null)}>CANCEL</button><button type="button" className="gf-btn gf-primary" onClick={modal.onConfirm}>CONFIRM</button></>}>
          {modal.body}
        </Modal>
      )}
    </div>
  );
}

function UpgradeButton({ action, onClick, disabled, done, doneLabel }) {
  const q = quote(action);
  return (
    <button type="button" className="gf-btn gf-upgrade" disabled={disabled} onClick={onClick}>
      {done ? doneLabel : ACTIONS[action].label} {!done && <small>{formatCredits(q.cost)}</small>}
    </button>
  );
}

/**
 * Render the chart SVGs into one PNG at 3× scale. CSS classes do not survive
 * serialisation, so the computed paint styles are copied inline first.
 */
async function chartsToPng(container, footer) {
  const figs = [...container.querySelectorAll('figure')];
  const scale = 3, cw = 360, ch = 230, cols = 2;
  const rows = Math.ceil(figs.length / cols);
  const canvas = document.createElement('canvas');
  canvas.width = cols * cw * scale;
  canvas.height = (rows * ch + 30) * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, cols * cw, rows * ch + 30);
  const PROPS = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'font-size', 'font-family', 'font-weight', 'opacity'];
  for (let i = 0; i < figs.length; i++) {
    const svg = figs[i].querySelector('svg');
    const clone = svg.cloneNode(true);
    const src = [svg, ...svg.querySelectorAll('*')];
    const dst = [clone, ...clone.querySelectorAll('*')];
    src.forEach((el, j) => {
      const cs = getComputedStyle(el);
      dst[j].setAttribute('style', PROPS.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(';'));
    });
    clone.setAttribute('width', 360);
    clone.setAttribute('height', 190);
    const xml = new XMLSerializer().serializeToString(clone);
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve; img.onerror = reject;
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
    });
    const x = (i % cols) * cw, y = Math.floor(i / cols) * ch;
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '600 12px Inter, system-ui, sans-serif';
    ctx.fillText(figs[i].querySelector('figcaption')?.textContent || '', x + 10, y + 18);
    ctx.drawImage(img, x, y + 26, 360, 190);
  }
  ctx.fillStyle = '#7dd3fc';
  ctx.font = '600 11px Inter, system-ui, sans-serif';
  ctx.fillText(footer, 10, rows * ch + 20);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

function buildReport({ title, run, ledgerRows, runCost }) {
  const p = run.sim.parameters;
  const s = run.sim.summary;
  const esc = (v) => String(v).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const row = (k, v) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`;
  const samples = run.sim.samples.filter((_, i) => i % Math.max(1, Math.floor(run.sim.samples.length / 12)) === 0);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>body{font:14px/1.5 system-ui,sans-serif;max-width:860px;margin:2rem auto;padding:0 1rem;color:#0f172a}
h1{font-size:1.4rem}h2{font-size:1.05rem;margin-top:1.6rem;border-bottom:1px solid #cbd5e1}
table{border-collapse:collapse;width:100%;font-size:13px}th,td{border-bottom:1px solid #e2e8f0;padding:4px 8px;text-align:left}
.tag{display:inline-block;background:#e0f2fe;color:#075985;border-radius:4px;padding:1px 6px;font-size:11px;font-weight:700}
.warn{background:#fef3c7;border-left:4px solid #f59e0b;padding:8px 12px}</style></head><body>
<h1>${esc(title)}</h1>
<p><span class="tag">MODEL OUTPUT</span> <span class="tag">VIRTUAL SIMULATION CREDITS</span></p>
<p class="warn">Every number in this report is generated by a simplified educational model (${FILTER_MODEL_VERSION}, baseline ${FILTER_BASELINE_LABEL}). None is a measurement. Costs are virtual simulation credits (${ECONOMY_VERSION}), not real-world prices.</p>
<h2>Configuration</h2><table>
${row('SO₂ concentration (inlet)', `${p.so2Ppm} ppm`)}${row('Water availability', p.water)}${row('Temperature', `${p.temperatureK} K`)}
${row('Gas flow rate', `${p.flowLpm} L/min`)}${row('Au loading', `${p.auLoading} wt%`)}${row('Nanoparticle size', `${p.particleSizeNm} nm`)}
${row('Catalytic surface area', `${p.surfaceArea} m² per mm`)}${row('Filter thickness', `${p.thicknessMm} mm`)}${row('Support', p.support)}
${row('Duration', `${p.durationMin} simulated min`)}${row('Resolution', run.compute.resolution)}${row('Simulated particles', run.compute.particleCount)}
${row('Simulated Au nanoparticles', run.compute.nanoparticles)}${row('Tracked molecules', run.compute.tracked)}</table>
<h2>Summary (model output)</h2><table>
${row('Initial SO₂', `${s.initialSO2Ppm} ppm`)}${row('Final SO₂ (outlet)', `${sig(s.finalSO2Ppm)} ppm`)}${row('Estimated conversion to sulfate', pct(s.conversionPct))}
${row('SO₂ removal', pct(s.removalPct))}${row('Sulfate produced', `${sig(s.sulfateUg)} µg`)}${row('Simulation time', `${s.simulatedMin} min`)}
${row('Catalyst utilization', `${sci(s.catalystUtilization)} turnovers per site`)}${row('Gas residence time', `${sig(s.gasResidenceS)} s`)}</table>
<h2>Time series (sampled)</h2><table><tr><th>t (min)</th><th>SO₂ out (ppm)</th><th>Sulfate (µg)</th><th>Conversion (%)</th><th>Site utilization</th></tr>
${samples.map((x) => `<tr><td>${x.t.toFixed(2)}</td><td>${sig(x.so2Out)}</td><td>${sig(x.sulfateUg)}</td><td>${x.conversionPct.toFixed(1)}</td><td>${x.siteUtilization.toFixed(3)}</td></tr>`).join('')}</table>
<h2>Costs (virtual simulation credits)</h2><p>Total for this run: <b>${formatCredits(runCost)}</b></p>
<table><tr><th>Date</th><th>Time</th><th>Action</th><th>Cost</th><th>Balance after</th></tr>
${[...ledgerRows].reverse().map((x) => { const d = x.timestamp?.toDate ? x.timestamp.toDate() : new Date(x.timestamp); return `<tr><td>${fmtDate(d)}</td><td>${fmtTime(d)}</td><td>${esc(x.label)}</td><td>$${x.cost}</td><td>${formatCredits(x.balanceAfter)}</td></tr>`; }).join('')}</table>
<h2>Model limitations</h2><ul>
<li>The simulation is simplified, and its numerical results are model-generated.</li>
<li>It is not a substitute for laboratory measurements. Actual catalyst performance depends on many variables.</li>
<li>Real reaction mechanisms can involve additional intermediates and pathways. SO₂ + 2H₂O → SO₄²⁻ + 4H⁺ + 2e⁻ is a simplified oxidation representation.</li>
<li>The virtual prices are not real-world chemical or laboratory prices.</li>
<li>The simulation does not prove that a particular filter design will work in practice.</li></ul>
<p>Generated ${new Date().toLocaleString()} · Platform: Firebase</p></body></html>`;
}
