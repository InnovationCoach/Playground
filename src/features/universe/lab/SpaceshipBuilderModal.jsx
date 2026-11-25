import { useEffect, useMemo, useRef, useState } from 'react';
import { Award, Bot, CheckCircle2, Cpu, Play, Rocket, Save, X, AlertCircle } from 'lucide-react';
import {
  MENTOR_QUESTIONS,
  SPACESHIP_PARTS,
  FLIGHT_LIMITS,
  flightChecks,
  mentorHintForDesign,
  simulateSpaceshipDesign
} from './spaceshipSim.js';

const pct = (v) => Math.max(0, Math.min(100, Math.round(v)));

/**
 * Meter geometry for the live telemetry: fill and marker positions in percent.
 * `under` meters pass while the fill stays at or below the marker (crew count).
 */
export function buildMeters(sim) {
  const m = sim.metrics;
  const check = Object.fromEntries(flightChecks(sim).checks.map((c) => [c.id, c.ok]));
  return [
    { id: 'twr', label: 'Thrust-to-weight', value: String(m.thrustToWeightRatio), ok: check.twr,
      fill: pct((m.thrustToWeightRatio / FLIGHT_LIMITS.twrScaleMax) * 100),
      mark: pct((FLIGHT_LIMITS.minTwr / FLIGHT_LIMITS.twrScaleMax) * 100), markLabel: `min ${FLIGHT_LIMITS.minTwr}` },
    // Draw sits at the middle of the bar, so output past the marker means a surplus.
    { id: 'power', label: 'Power', value: `${m.powerBalanceKw >= 0 ? '+' : ''}${m.powerBalanceKw} kW`, ok: check.power,
      fill: pct((m.powerOutputKw / Math.max(1, m.powerDrawKw)) * 50), mark: 50, markLabel: `${m.powerDrawKw} kW draw` },
    { id: 'capacity', label: 'Crew capacity', value: `${sim.passengers} / ${m.maxSafePassengers}`, ok: check.capacity, under: true,
      fill: pct((sim.passengers / 8) * 100), mark: pct((m.maxSafePassengers / 8) * 100), markLabel: `${m.maxSafePassengers} safe` },
    { id: 'shield', label: 'Shielding', value: String(m.shieldRating), ok: check.shield,
      fill: pct(m.shieldRating), mark: FLIGHT_LIMITS.minShield, markLabel: `min ${FLIGHT_LIMITS.minShield}` }
  ];
}

function TelemetryMeter({ id, label, value, ok, fill, mark, markLabel }) {
  return (
    <div className="upg-stat upg-meter" data-meter={id}>
      <div className="upg-stat-top">
        <span>{label}</span>
        <strong className={ok ? 'upg-val-ok' : 'upg-val-warn'}>{value}</strong>
      </div>
      <div
        className="upg-bar upg-meter-bar"
        role="meter"
        aria-label={`${label}: ${value}, ${ok ? 'passes' : 'needs work'} (${markLabel})`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={fill}
      >
        <span className={ok ? '' : 'is-warn'} style={{ width: `${fill}%` }} />
        <i className="upg-meter-mark" style={{ left: `${mark}%` }} aria-hidden="true" />
      </div>
      <small className="upg-meter-note">{markLabel}</small>
    </div>
  );
}

export function SpaceshipBuilderModal({ planetName = 'Thalassa', savedShips = [], onSaveProject, onClose }) {
  const [name, setName] = useState(`${planetName} Explorer I`);
  const [purpose, setPurpose] = useState('Atmospheric & biosignature survey');
  const [passengers, setPassengers] = useState(2);
  const [parts, setParts] = useState({
    hull: 'lightweight-alloy',
    propulsion: 'chemical-booster',
    power: 'rtg-core',
    shield: 'thermal-shield'
  });
  const [simResult, setSimResult] = useState(null);
  const [localVersions, setLocalVersions] = useState([]);
  const [reflection, setReflection] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  // Bumped on every status so the same message (e.g. loading one blueprint twice) still re-announces.
  const [statusKey, setStatusKey] = useState(0);
  const [loadedId, setLoadedId] = useState(null);
  const headingRef = useRef(null);
  const nameRef = useRef(null);
  const announce = (msg) => { setStatusMsg(msg); setStatusKey((k) => k + 1); };

  const liveSim = useMemo(
    () => simulateSpaceshipDesign({ name, purpose, passengers, parts }),
    [name, purpose, passengers, parts]
  );
  const live = useMemo(() => flightChecks(liveSim), [liveSim]);
  const meters = useMemo(() => buildMeters(liveSim), [liveSim]);
  const versions = savedShips.length > 0 ? savedShips : localVersions;

  useEffect(() => {
    headingRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose?.();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const updatePart = (slot, id) => {
    setParts((prev) => ({ ...prev, [slot]: id }));
    setSimResult(null);
  };

  const handleRunSim = () => {
    const res = simulateSpaceshipDesign({ name, purpose, passengers, parts });
    setSimResult(res);
    announce(res.passed ? 'Simulation passed! Ready to save or submit evidence.' : 'Simulation detected engineering issues to resolve.');
  };

  const handleSave = () => {
    const sim = simResult || simulateSpaceshipDesign({ name, purpose, passengers, parts });
    const nextVersion = versions.length + 1;
    const snapshot = {
      id: `ship-v${nextVersion}-${Date.now()}`,
      version: nextVersion,
      name: sim.craftName,
      purpose: sim.purpose,
      passengers: sim.passengers,
      parts: sim.parts,
      simulation: sim,
      reflection: reflection.trim(),
      savedAt: new Date().toISOString()
    };
    if (savedShips.length === 0) setLocalVersions((prev) => [snapshot, ...prev]);
    onSaveProject?.(snapshot);
    setLoadedId(snapshot.id);
    announce(`Saved ${snapshot.name} (v${snapshot.version})!`);
  };

  const loadVersion = (ship) => {
    setName(ship.name);
    setPurpose(ship.purpose);
    setPassengers(ship.passengers);
    setParts(ship.parts);
    setReflection(ship.reflection || '');
    setSimResult(ship.simulation || null);
    setLoadedId(ship.id);
    announce(`Loaded ${ship.name} (v${ship.version}): name, parts and passengers restored.`);
    // The restored fields sit at the top of the lab, often scrolled out of view on tablets
    // and narrow windows; bring them back so the change is visible.
    requestAnimationFrame(() => {
      nameRef.current?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
      nameRef.current?.focus?.({ preventScroll: true });
    });
  };

  return (
    <div
      className="upg-lab-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upg-lab-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      onWheel={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="upg-lab-modal">
        <div className="upg-head">
          <div className="upg-title-wrap">
            <Rocket size={18} color="#96d700" aria-hidden="true" />
            <div>
              <h2 id="upg-lab-title" ref={headingRef} tabIndex={-1}>Engineering Lab: Spaceship Builder</h2>
              <span className="upg-subtitle">Hybrid AI Mentor + Deterministic Physics Simulation</span>
            </div>
          </div>
          <button type="button" className="upg-close" onClick={onClose} aria-label="Close Spaceship Builder">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {statusMsg && (
          <div className="upg-toast-bar" role="status" key={statusKey}>
            <span>{statusMsg}</span>
            <button type="button" className="upg-toast-dismiss" onClick={() => setStatusMsg('')} aria-label="Dismiss status">
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        )}

        <div className="upg-body">
          <div className="upg-lab-grid">
            <div className="upg-lab-col">
              <section className="upg-card">
                <h3><span>1. Mission Brief &amp; Crew</span><Cpu size={15} aria-hidden="true" /></h3>
                <input
                  ref={nameRef}
                  type="text"
                  className="upg-select"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-label="Spaceship name"
                  placeholder="Spaceship name"
                />
                <input
                  type="text"
                  className="upg-select"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  aria-label="Mission purpose"
                  placeholder="Mission purpose"
                />
                <label className="upg-muted">
                  Passengers: <strong>{passengers}</strong>
                  <input
                    type="range"
                    min={1}
                    max={8}
                    value={passengers}
                    onChange={(e) => { setPassengers(Number(e.target.value)); setSimResult(null); }}
                    style={{ width: '100%' }}
                  />
                </label>
              </section>

              <section className="upg-card">
                <h3><span>2. Assemble Components</span></h3>
                {[
                  ['hull', 'Hull & Frame'],
                  ['propulsion', 'Propulsion'],
                  ['power', 'Power Core'],
                  ['shield', 'Shielding & Life Support']
                ].map(([slot, label]) => (
                  <label key={slot} className="upg-muted">
                    {label}
                    <select
                      className="upg-select"
                      value={parts[slot]}
                      onChange={(e) => updatePart(slot, e.target.value)}
                      style={{ marginTop: 4 }}
                    >
                      {SPACESHIP_PARTS[slot].map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.massKg} kg)
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
                <button type="button" className="upg-btn upg-btn-primary" onClick={handleRunSim}>
                  <Play size={14} aria-hidden="true" /> Run Physics Simulation
                </button>
              </section>
            </div>

            <div className="upg-lab-col">
              <section className="upg-card" aria-label="Live physics telemetry">
                <h3>
                  <span>Live Telemetry</span>
                  <span
                    className={`upg-tag${live.certified ? ' upg-tag-focus' : ' upg-tag-warn'}`}
                    aria-live="polite"
                  >
                    {live.certified ? 'Flight-Certified design' : `${live.passedCount}/${live.checks.length} checks pass`}
                  </span>
                </h3>
                <p className="upg-muted" style={{ fontSize: '0.76rem' }}>
                  Updates as you change parts. Each bar must reach (or, for crew, stay under) its marker.
                </p>
                <div className="upg-telemetry-grid">
                  {meters.map((mt) => <TelemetryMeter key={mt.id} {...mt} />)}
                  <div className="upg-stat">
                    <div className="upg-stat-top">
                      <span>Total Mass · Δv</span>
                      <strong>{liveSim.metrics.totalMassKg.toLocaleString()} kg · {liveSim.metrics.deltaVKms} km/s</strong>
                    </div>
                    <div className="upg-bar">
                      <span style={{ width: `${Math.min(100, Math.round((liveSim.metrics.totalMassKg / 5000) * 100))}%` }} />
                    </div>
                  </div>
                </div>
                <ul className="upg-checklist" aria-label="Pre-flight checks">
                  {live.checks.map((c) => (
                    <li key={c.id} className={c.ok ? 'is-ok' : 'is-warn'}>
                      {c.ok ? <CheckCircle2 size={13} aria-hidden="true" /> : <AlertCircle size={13} aria-hidden="true" />}
                      <span><strong>{c.label}</strong> · {c.detail}</span>
                      <span className="upg-sr">{c.ok ? 'passes' : 'needs work'}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {simResult && (
                <section className={simResult.passed ? 'upg-card upg-certified-card' : 'upg-alert'}>
                  <h3>
                    {simResult.passed
                      ? <><CheckCircle2 size={15} color="#96d700" aria-hidden="true" /> Flight-Certified · Physics Passed</>
                      : <><AlertCircle size={15} aria-hidden="true" /> Engineering Diagnostics</>}
                    {simResult.passed && (
                      <span className="upg-tag upg-tag-focus">
                        <Award size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} aria-hidden="true" />
                        Ready to Launch
                      </span>
                    )}
                  </h3>
                  <p className="upg-muted">
                    Mass: <strong>{simResult.metrics.totalMassKg} kg</strong> · TWR: <strong>{simResult.metrics.thrustToWeightRatio}</strong> ·
                    Power Margin: <strong>{simResult.metrics.powerBalanceKw} kW</strong> · Δv: <strong>{simResult.metrics.deltaVKms} km/s</strong>
                  </p>
                  {simResult.diagnostics.map((d, i) => (
                    <p className="upg-muted" key={i}>• {d}</p>
                  ))}
                </section>
              )}

              <section className="upg-card">
                <h3><span>3. AI Engineering Mentor</span><Bot size={15} aria-hidden="true" /></h3>
                <p className="upg-muted">{mentorHintForDesign(simResult)}</p>
                <p className="upg-muted" style={{ fontSize: '0.78rem' }}>
                  Guiding prompt: {MENTOR_QUESTIONS[versions.length % MENTOR_QUESTIONS.length]}
                </p>
                <input
                  type="text"
                  className="upg-select"
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="Reflect on your design trade-offs (mass, power, safety)..."
                  aria-label="Spaceship engineering reflection"
                />
                <button type="button" className="upg-btn" onClick={handleSave}>
                  <Save size={14} aria-hidden="true" /> Save Version ({versions.length} saved)
                </button>
              </section>

              {versions.length > 0 && (
                <section className="upg-card">
                  <h3><span>Saved Blueprints</span><span className="upg-tag">{versions.length}</span></h3>
                  <ul className="upg-list">
                    {versions.slice(0, 5).map((ship) => {
                      const isLoaded = loadedId === ship.id;
                      return (
                        <li className={`upg-item${isLoaded ? ' is-loaded' : ''}`} key={ship.id} aria-current={isLoaded ? 'true' : undefined}>
                          <div className="upg-item-row">
                            <strong>{ship.name} (v{ship.version})</strong>
                            <span className="upg-tag">{ship.simulation?.passed ? 'Flight-Certified' : 'Needs Tuning'}</span>
                          </div>
                          <button
                            type="button"
                            className={`upg-btn${isLoaded ? ' upg-btn-complete' : ''}`}
                            onClick={() => loadVersion(ship)}
                            aria-label={`Load blueprint ${ship.name} version ${ship.version}`}
                          >
                            {isLoaded ? 'Loaded in the lab ✓ (load again)' : 'Load Blueprint'}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
