/**
 * Activity 5 - Solar Car Challenge.
 *
 * Replaces the previous version, which asked students to choose a chassis from a
 * dropdown of three fictional parts and then showed them numbers computed from
 * that fiction. Nothing in it referred to anything the class had built.
 *
 * This version is a companion to a physical build. Every input is a measurement
 * a team takes off their own car - masses from a scale, the panel from a ruler
 * and a multimeter, gear teeth counted by hand - and everything shown back is
 * derived from those measurements by solarCarModel.js. The activity's argument
 * is that the three numbers a solar car lives or dies by (mass, panel size, gear
 * ratio) are one decision, not three, and the last stage makes the class defend
 * their prediction against a stopwatch.
 */
import { useMemo, useRef, useState } from 'react';
import {
  SUN_CONDITIONS, SURFACES, DRIVE_TYPES, PART_CATEGORIES,
  analyseBuild, analyseTestRuns
} from './solarCarModel.js';
import { useSolarCarBuild } from './useSolarCarBuild.js';
import { requestDesignReview, fileToAnalysisJpeg } from './designReview.js';
import './solarCar.css';

const STAGES = [
  { id: 'bench',   n: 'Stage 1', t: 'Weigh It',      icon: '⚖️' },
  { id: 'panel',   n: 'Stage 2', t: 'Your Panel',    icon: '☀️' },
  { id: 'drive',   n: 'Stage 3', t: 'Gear It',       icon: '⚙️' },
  { id: 'balance', n: 'Stage 4', t: 'Find Balance',  icon: '🎯' },
  { id: 'track',   n: 'Stage 5', t: 'Test It',       icon: '⏱️' },
  { id: 'review',  n: 'Stage 6', t: 'Design Review', icon: '🔍' }
];

const CATEGORY_COLOURS = {
  structure: '#38bdf8',
  drivetrain: '#f59e0b',
  power: '#10b981',
  other: '#a855f7'
};

/**
 * Speeds always render to 2 dp.
 *
 * The model rounds to 3 dp, so a value that happens to land on a whole number
 * came out as "4 m/s" beside a measured "2.68 m/s" - which reads as though one
 * is an estimate and the other a measurement. They are both measurements.
 */
const ms = (v) => (Number.isFinite(v) && v > 0 ? `${Number(v).toFixed(2)} m/s` : '—');
const cm = (v) => (Number.isFinite(v) && v > 0 ? `${Number(v).toFixed(1)} cm` : '—');

/** Numeric field that keeps the raw string, so a learner can empty it mid-edit. */
function Num({ label, hint, value, onChange, unit, ...rest }) {
  return (
    <div className="sc-field">
      <label>{label}{unit ? ` (${unit})` : ''}</label>
      <input
        type="number"
        inputMode="decimal"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
      {hint ? <span className="sc-hint">{hint}</span> : null}
    </div>
  );
}

function Select({ label, hint, value, onChange, options }) {
  return (
    <div className="sc-field">
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hint ? <span className="sc-hint">{hint}</span> : null}
    </div>
  );
}

function Gauge({ score, title, colour }) {
  return (
    <div className="sc-gauge">
      <div className="n" style={{ color: colour }}>{score}</div>
      <div className="t">{title}</div>
      <div className="bar"><span style={{ width: `${score}%`, background: colour }} /></div>
    </div>
  );
}

const scoreColour = (s) => (s >= 80 ? 'var(--primary)' : s >= 50 ? 'var(--python-yellow)' : 'var(--accent-red)');

// ---------------------------------------------------------------------------

export function SolarCarChallenge({ uid }) {
  const { build, patch, setField, setParts, setRuns, reset, syncState } = useSolarCarBuild(uid);
  const [stage, setStage] = useState('bench');

  const report = useMemo(() => analyseBuild(build), [build]);
  const testReport = useMemo(
    () => analyseTestRuns(report, build.runs, build.track.distanceM),
    [report, build.runs, build.track.distanceM]
  );

  const go = (id) => { setStage(id); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <div className="container sc">
      <div className="sc-hero">
        <h2>☀️ Solar Car Challenge</h2>
        <p>
          Build a car. Then measure it: every part on a scale, the panel with a ruler and a
          multimeter, the gears by counting teeth. This page turns those measurements into a
          prediction of how fast your car will go — and then you go and find out whether it was right.
        </p>
      </div>

      <nav className="sc-stages">
        {STAGES.map((s) => (
          <button
            key={s.id}
            className={`sc-stage-btn${stage === s.id ? ' is-active' : ''}`}
            onClick={() => go(s.id)}
          >
            <span className="sc-stage-n">{s.n}</span>
            <span className="sc-stage-t">{s.icon} {s.t}</span>
          </button>
        ))}
      </nav>

      <Readout report={report} />
      <Workings report={report} />

      {stage === 'bench'   && <BenchStage build={build} setParts={setParts} setField={setField} report={report} onNext={() => go('panel')} />}
      {stage === 'panel'   && <PanelStage build={build} patch={patch} report={report} onNext={() => go('drive')} />}
      {stage === 'drive'   && <DriveStage build={build} patch={patch} report={report} onNext={() => go('balance')} />}
      {stage === 'balance' && <BalanceStage build={build} patch={patch} report={report} onNext={() => go('track')} />}
      {stage === 'track'   && <TrackStage build={build} patch={patch} setRuns={setRuns} setField={setField} report={report} testReport={testReport} onNext={() => go('review')} />}
      {stage === 'review'  && <ReviewStage build={build} setField={setField} report={report} testReport={testReport} />}

      <div className="sc-actions">
        <span className="sc-sync">
          {syncState === 'saving' ? 'Saving…'
            : syncState === 'saved' ? '✓ Saved to your account — your coach can see these numbers'
            : syncState === 'local-only' ? '⚠ Saved on this device only (no connection to your account)'
            : 'Your work saves automatically'}
        </span>
        <button
          className="sc-btn ghost"
          style={{ marginLeft: 'auto' }}
          onClick={() => { if (window.confirm('Clear every measurement and start a new build?')) reset(); }}
        >
          Start a new build
        </button>
      </div>
    </div>
  );
}

/** The six numbers that matter, visible from every stage. */
function Readout({ report }) {
  const cells = [
    { k: 'Total mass', v: report.mass.totalGrams > 0 ? `${report.mass.totalGrams} g` : '—', c: report.mass.totalGrams > 0 ? '' : 'none' },
    { k: 'Panel power', v: report.panel.ratedW > 0 ? `${report.panel.ratedW} W` : '—', c: report.panel.ratedW > 0 ? '' : 'none' },
    { k: 'Watts per kg', v: report.power.specificPowerWPerKg > 0 ? `${report.power.specificPowerWPerKg}` : '—', c: report.power.specificPowerWPerKg >= 6 ? 'good' : report.power.specificPowerWPerKg > 0 ? 'warn' : 'none' },
    { k: 'Gear ratio', v: report.gearing.actual > 0 ? `${report.gearing.actual}:1` : '—', c: report.gearing.verdict === 'matched' ? 'good' : report.gearing.verdict === 'unknown' ? 'none' : 'warn' },
    { k: 'Predicted speed', v: ms(report.speed.predicted), c: report.speed.predicted > 0 ? '' : 'none' },
    { k: 'Balance score', v: report.completeness.ready ? `${report.scores.balance}` : '—', c: report.completeness.ready ? (report.scores.balance >= 80 ? 'good' : report.scores.balance >= 50 ? 'warn' : 'bad') : 'none' }
  ];
  return (
    <div className="sc-readout">
      {cells.map((c) => (
        <div key={c.k}>
          <div className={`v ${c.c}`}>{c.v}</div>
          <div className="k">{c.k}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * "Show the maths" - every headline figure with its formula and the learner's
 * own values substituted in.
 *
 * Collapsed by default so it does not crowd the readout, but always one click
 * away from the numbers it explains. A learner who cannot reproduce a figure on
 * a calculator has been handed a number they did not earn, which is the thing
 * this activity exists to avoid.
 */
function Workings({ report }) {
  const [open, setOpen] = useState(false);
  const rows = report.workings || [];
  if (!rows.length) return null;

  return (
    <div className="sc-workings">
      <button
        type="button"
        className="sc-workings-toggle"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? '▾' : '▸'} Show the maths — how every number above was worked out
      </button>

      {open && (
        <div className="sc-workings-body">
          {rows.map((w) => (
            <div className="sc-working" key={w.id}>
              <div className="sc-working-label">{w.label}</div>
              <div className="sc-working-formula">{w.formula}</div>
              <div className="sc-working-sub">
                <span className="sc-working-eq">=</span> {w.substitution}
              </div>
              <div className="sc-working-result">{w.result}</div>
              {w.note && <p className="sc-working-note">{w.note}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * What the stopwatch will actually show.
 *
 * Top speed is a steady-state figure and a model solar car needs roughly 13 m to
 * get near it. Reporting `distance / topSpeed` on a 3 m course predicted 0.90 s
 * where the car really takes 3.33 s - so a learner doing the predict-then-check
 * that this whole activity is built on would have concluded their car was broken
 * when the arithmetic was.
 */
function RunPrediction({ report }) {
  const run = report.run;
  if (!run) return null;

  if (run.stalled || !run.finishes) {
    return (
      <div className="sc-runpred sc-runpred-bad">
        <h4>⚠️ It will not finish</h4>
        <p>
          From a standing start the wheels cannot out-push the resistance — it covered only{' '}
          <strong>{run.distanceCoveredM} m</strong> of your {report.track.distanceM} m course.
          Check the starting torque on Stage 3: a gear ratio below 1:1 multiplies speed but
          divides the force you need to get moving.
        </p>
      </div>
    );
  }

  const shortCourse = !run.courseIsLongEnough;

  return (
    <div className={`sc-runpred${shortCourse ? ' sc-runpred-warn' : ''}`}>
      <h4>⏱️ What your stopwatch should read</h4>

      <div className="sc-runpred-grid">
        <div><strong>{run.elapsedS} s</strong><span>over {report.track.distanceM} m</span></div>
        <div><strong>{run.averageSpeed} m/s</strong><span>average speed</span></div>
        <div><strong>{run.finishSpeed} m/s</strong><span>speed at the line</span></div>
        <div><strong>{run.topSpeed} m/s</strong><span>top speed, given enough run-up</span></div>
      </div>

      {shortCourse ? (
        <p>
          Your car never reaches its top speed on this course. It needs about{' '}
          <strong>{run.distanceTo90PctM} m</strong> to get within 90% of {run.topSpeed} m/s,
          and your course is {report.track.distanceM} m — so it crosses the line still
          accelerating, at {Math.round(run.fractionOfTop * 100)}% of top speed.
          Simply dividing distance by top speed would predict{' '}
          <strong>{run.naiveTimeS} s</strong>, which is the mistake to avoid: that is a
          prediction your stopwatch will disagree with.
        </p>
      ) : (
        <p>
          Your course is long enough for the car to reach {run.finishSpeed} m/s by the line —
          close to its {run.topSpeed} m/s top speed. Average speed is still lower than top
          speed because it starts from rest.
        </p>
      )}
    </div>
  );
}

// --- Stage 1 ---------------------------------------------------------------

function BenchStage({ build, setParts, setField, report, onNext }) {
  const { mass } = report;

  const update = (id, field, value) =>
    setParts((parts) => parts.map((p) => (p.id === id ? { ...p, [field]: value } : p)));

  const addPart = () =>
    setParts((parts) => [...parts, { id: `p${Date.now()}`, name: '', category: 'other', qty: 1, grams: '' }]);

  const removePart = (id) => setParts((parts) => parts.filter((p) => p.id !== id));

  return (
    <>
      <div className="card">
        <h3>⚖️ Stage 1 — Weigh every part of the car you built</h3>
        <p className="sc-muted" style={{ marginBottom: '1rem' }}>
          Put each part on a kitchen scale before you fit it. Enter what the scale says, not what
          the packet claims. If you have four identical wheels, weigh one and set the quantity to 4.
          Add rows for anything your car has that is not listed — and delete anything it does not.
        </p>

        <div className="sc-field" style={{ maxWidth: '22rem' }}>
          <label>Team or car name</label>
          <input type="text" value={build.teamName} placeholder="e.g. Sunchaser Mk1"
                 onChange={(e) => setField('teamName', e.target.value)} />
        </div>

        <table className="sc-parts">
          <thead>
            <tr>
              <th style={{ width: '38%' }}>Part</th>
              <th style={{ width: '20%' }}>Where it belongs</th>
              <th style={{ width: '12%' }}>Qty</th>
              <th style={{ width: '16%' }}>Mass each (g)</th>
              <th className="sc-num" style={{ width: '10%' }}>Total</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {build.parts.map((p) => {
              const total = (parseFloat(p.qty) || 0) * (parseFloat(p.grams) || 0);
              return (
                <tr key={p.id}>
                  <td><input type="text" value={p.name} placeholder="Part name"
                             onChange={(e) => update(p.id, 'name', e.target.value)} /></td>
                  <td>
                    <select value={p.category || 'other'} onChange={(e) => update(p.id, 'category', e.target.value)}>
                      {Object.values(PART_CATEGORIES).map((c) => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </td>
                  <td><input type="number" min="0" value={p.qty ?? ''} onChange={(e) => update(p.id, 'qty', e.target.value)} /></td>
                  <td><input type="number" min="0" step="0.1" value={p.grams ?? ''} placeholder="0"
                             onChange={(e) => update(p.id, 'grams', e.target.value)} /></td>
                  <td className="sc-num">{total > 0 ? `${Math.round(total * 10) / 10} g` : '—'}</td>
                  <td><button className="sc-del" title="Remove this part" onClick={() => removePart(p.id)}>×</button></td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4}>Total mass of your car</td>
              <td className="sc-num" style={{ color: 'var(--python-yellow)' }}>{mass.totalGrams} g</td>
              <td />
            </tr>
          </tfoot>
        </table>

        <button className="sc-btn ghost" style={{ marginTop: '0.9rem' }} onClick={addPart}>+ Add a part</button>

        {mass.totalGrams > 0 && (
          <>
            <div className="sc-catbar">
              {Object.entries(mass.byCategory).filter(([, g]) => g > 0).map(([cat, g]) => (
                <span key={cat} style={{ width: `${(g / mass.totalGrams) * 100}%`, background: CATEGORY_COLOURS[cat] }} />
              ))}
            </div>
            <div className="sc-catkey">
              {Object.entries(mass.byCategory).filter(([, g]) => g > 0).map(([cat, g]) => (
                <span key={cat}>
                  <i style={{ background: CATEGORY_COLOURS[cat] }} />
                  {PART_CATEGORIES[cat].label} {Math.round(g)} g ({Math.round((g / mass.totalGrams) * 100)}%)
                </span>
              ))}
            </div>
          </>
        )}

        {mass.heaviest && mass.heaviestShare > 0.3 && (
          <div className="sc-flag warn">
            <strong>{mass.heaviest.name || 'One part'}</strong> is {Math.round(mass.heaviestShare * 100)}% of your
            whole car at {Math.round(mass.heaviest.totalGrams)} g. When Stage 4 tells you to lose mass, this is
            where the mass actually is.
          </div>
        )}
      </div>

      <div className="sc-actions">
        <button className="sc-btn" onClick={onNext}>Next: measure your panel →</button>
      </div>
    </>
  );
}

// --- Stage 2 ---------------------------------------------------------------

function PanelStage({ build, patch, report, onNext }) {
  const { panel } = build;
  const p = report.panel;
  const set = (changes) => patch('panel', changes);

  return (
    <>
      <div className="sc-grid">
        <div className="card">
          <h3>☀️ Stage 2 — Measure your solar panel</h3>
          <p className="sc-muted" style={{ marginBottom: '1rem' }}>
            A panel's size and its power output are the same fact seen twice: a bigger panel
            intercepts more sunlight. Measure the cell area with a ruler, then find its electrical
            output — either from the label, or with a multimeter.
          </p>

          <div className="sc-row">
            <Num label="Panel length" unit="mm" value={panel.lengthMm} onChange={(v) => set({ lengthMm: v })} />
            <Num label="Panel width" unit="mm" value={panel.widthMm} onChange={(v) => set({ widthMm: v })} />
          </div>

          <div className="sc-field">
            <label>How do you know its output?</label>
            <div className="sc-toggle">
              <button className={panel.mode === 'rated' ? 'is-on' : ''} onClick={() => set({ mode: 'rated' })}>
                It has a label
              </button>
              <button className={panel.mode === 'measured' ? 'is-on' : ''} onClick={() => set({ mode: 'measured' })}>
                I measured it
              </button>
            </div>
          </div>

          {panel.mode === 'rated' ? (
            <div className="sc-row">
              <Num label="Rated voltage" unit="V" value={panel.vmp} onChange={(v) => set({ vmp: v })}
                   hint="The bigger number on the label, e.g. 6V" />
              <Num label="Rated current" unit="mA" value={panel.impMa} onChange={(v) => set({ impMa: v })}
                   hint="Watch the units — 0.25A is 250mA" />
            </div>
          ) : (
            <>
              <div className="sc-row">
                <Num label="Open-circuit voltage" unit="V" value={panel.voc} onChange={(v) => set({ voc: v })}
                     hint="Multimeter on volts, nothing connected" />
                <Num label="Short-circuit current" unit="mA" value={panel.iscMa} onChange={(v) => set({ iscMa: v })}
                     hint="Multimeter on amps, straight across the panel" />
              </div>
              <div className="sc-flag warn">
                Voltage × current from those two readings <em>overstates</em> the real output, because a panel
                cannot deliver its highest voltage and highest current at the same time. We multiply by a
                fill factor of 0.7, which is typical for a small cell.
              </div>
            </>
          )}

          <Select
            label="What is the light like where you will run it?"
            value={panel.condition}
            onChange={(v) => set({ condition: v })}
            options={Object.values(SUN_CONDITIONS).map((c) => ({
              value: c.id, label: `${c.label} — about ${c.irradiance} W/m²`
            }))}
            hint="Panels are rated in full sun. Anything less and you get proportionally less power."
          />
        </div>

        <div className="card">
          <h3>What that panel actually gives you</h3>
          <div className="sc-derived">
            <dl>
              <dt>Panel area</dt><dd>{p.areaCm2 > 0 ? `${p.areaCm2} cm²` : '—'}</dd>
              <dt>Power in full sun</dt><dd>{p.ratedW > 0 ? `${p.ratedW} W` : '—'}</dd>
              <dt>Power in {p.condition.label.toLowerCase()}</dt><dd style={{ color: 'var(--python-yellow)' }}>{p.effectiveW > 0 ? `${p.effectiveW} W` : '—'}</dd>
              <dt>Cell efficiency</dt><dd>{p.efficiency > 0 ? `${p.efficiencyPct}%` : '—'}</dd>
              <dt>Reaching the wheels after losses</dt><dd>{report.power.mechanicalW > 0 ? `${report.power.mechanicalW} W` : '—'}</dd>
            </dl>
          </div>

          {p.plausibility === 'too_high' && (
            <div className="sc-flag bad">
              <strong>Those numbers cannot both be right.</strong> A panel that size producing that much power
              would be {p.efficiencyPct}% efficient. The best solar cells ever made reach about 22%, and a
              classroom panel is 10–17%. Check the current: is it in mA or A? Check the size: is it mm or cm?
            </div>
          )}
          {p.plausibility === 'too_low' && (
            <div className="sc-flag warn">
              <strong>{p.efficiencyPct}% efficiency is very low</strong> even for an old cell. Did you enter the
              panel size in millimetres? A 130 mm panel is 130, not 13.
            </div>
          )}
          {p.plausibility === 'ok' && (
            <div className="sc-flag ok">
              <strong>{p.efficiencyPct}% efficiency</strong> — that is a believable figure for a real panel, so
              your measurements agree with each other. Good sign before you build anything on top of them.
            </div>
          )}

          <div className="sc-flag" style={{ borderColor: 'var(--card-border)', background: '#0f172a', color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text-light)' }}>Where the power goes.</strong> Of the {p.effectiveW || 0} W your
            panel makes, a small brushed motor turns about half into shaft power, and your{' '}
            {report.drive.driveType.label.toLowerCase()} pass on{' '}
            {Math.round(report.drive.driveEfficiency * 100)}% of that. So roughly{' '}
            {report.power.mechanicalW} W ever reaches the road. Losing weight is often easier than finding more watts.
          </div>
        </div>
      </div>

      <div className="sc-actions">
        <button className="sc-btn" onClick={onNext}>Next: your gearing →</button>
      </div>
    </>
  );
}

// --- Stage 3 ---------------------------------------------------------------

function DriveStage({ build, patch, report, onNext }) {
  const { drive } = build;
  const d = report.drive;
  const set = (changes) => patch('drive', changes);

  return (
    <>
      <div className="sc-grid">
        <div className="card">
          <h3>⚙️ Stage 3 — Your gearing and wheels</h3>
          <p className="sc-muted" style={{ marginBottom: '1rem' }}>
            Gears trade speed for force. A high ratio means the motor turns several times for every
            turn of the wheel: more pulling force, less speed. Count the teeth on both gears — or
            measure both pulleys if you used a belt.
          </p>

          <div className="sc-field">
            <label>How is your motor connected to the wheels?</label>
            <div className="sc-toggle">
              <button className={drive.ratioMode === 'teeth' ? 'is-on' : ''} onClick={() => set({ ratioMode: 'teeth' })}>Gears</button>
              <button className={drive.ratioMode === 'diameter' ? 'is-on' : ''} onClick={() => set({ ratioMode: 'diameter' })}>Belt / pulleys</button>
              <button className={drive.ratioMode === 'direct' ? 'is-on' : ''} onClick={() => set({ ratioMode: 'direct', driveType: 'direct' })}>Straight onto the axle</button>
            </div>
          </div>

          {drive.ratioMode === 'teeth' && (
            <div className="sc-row">
              <Num label="Teeth on the motor gear" value={drive.driverTeeth} onChange={(v) => set({ driverTeeth: v })}
                   hint="The small one, on the motor shaft" />
              <Num label="Teeth on the wheel gear" value={drive.drivenTeeth} onChange={(v) => set({ drivenTeeth: v })}
                   hint="The big one, on the axle" />
            </div>
          )}
          {drive.ratioMode === 'diameter' && (
            <div className="sc-row">
              <Num label="Motor pulley diameter" unit="mm" value={drive.driverDiaMm} onChange={(v) => set({ driverDiaMm: v })} />
              <Num label="Axle pulley diameter" unit="mm" value={drive.drivenDiaMm} onChange={(v) => set({ drivenDiaMm: v })} />
            </div>
          )}
          {drive.ratioMode === 'direct' && (
            <div className="sc-flag warn">
              Direct drive is a 1:1 ratio. It is simple, but it gives the motor no help getting a heavy
              car moving — watch what Stage 4 says about starting from a standstill.
            </div>
          )}

          <div className="sc-row">
            <Num label="Drive wheel diameter" unit="mm" value={drive.wheelDiameterMm} onChange={(v) => set({ wheelDiameterMm: v })}
                 hint="Across the whole wheel, including the tyre" />
            <Num label="Motor speed, no load" unit="rpm" value={drive.motorNoLoadRpm} onChange={(v) => set({ motorNoLoadRpm: v })}
                 hint="From the motor's datasheet at your panel's voltage" />
          </div>

          {drive.ratioMode !== 'direct' && (
            <Select
              label="What kind of drive?"
              value={drive.driveType}
              onChange={(v) => set({ driveType: v })}
              options={Object.values(DRIVE_TYPES).map((t) => ({
                value: t.id, label: `${t.label} — passes on ${Math.round(t.efficiency * 100)}%`
              }))}
              hint="A worm gear cannot be back-driven and eats nearly half your power."
            />
          )}

          <Num label="Motor stall torque, if you know it" unit="mN·m" value={drive.stallTorqueMnm}
               onChange={(v) => set({ stallTorqueMnm: v })}
               hint="Optional. Leave blank and we estimate it from your power and rpm." />
        </div>

        <div className="card">
          <h3>What your drivetrain does</h3>
          <div className="sc-derived">
            <dl>
              <dt>Gear ratio</dt><dd>{d.gearRatio}:1</dd>
              <dt>Wheel circumference</dt><dd>{cm(d.wheelCircumferenceM * 100)}</dd>
              <dt>Motor speed under load</dt><dd>{d.loadedRpm > 0 ? `${d.loadedRpm} rpm` : '—'}</dd>
              <dt>Wheel speed</dt><dd>{d.wheelRpm > 0 ? `${d.wheelRpm} rpm` : '—'}</dd>
              <dt>Top speed the gearing allows</dt><dd style={{ color: 'var(--bunker-blue)' }}>{ms(d.geometricSpeed)}</dd>
              <dt>Force multiplied by</dt><dd>{d.torqueMultiplier}×</dd>
            </dl>
          </div>

          <div className="sc-flag" style={{ borderColor: 'var(--bunker-blue)', background: 'rgba(56,189,248,0.08)', color: '#7dd3fc' }}>
            <strong>This number is only half the story.</strong> It says how fast your car goes <em>if the motor
            keeps spinning</em>. Whether the sunlight can actually keep it spinning that fast is a different
            question — and where those two answers meet is what Stage 4 is about.
          </div>

          {d.geometricSpeed > 0 && (
            <p className="sc-muted" style={{ marginTop: '0.9rem' }}>
              At {d.gearRatio}:1, your motor turns {d.gearRatio} times for every single turn of the wheel.
              Swap to a bigger gear on the axle and the car gets stronger but slower; a smaller one and it
              gets faster but may not pull away from a stop.
            </p>
          )}
        </div>
      </div>

      <div className="sc-actions">
        <button className="sc-btn" onClick={onNext}>Next: the balance challenge →</button>
      </div>
    </>
  );
}

// --- Stage 4 ---------------------------------------------------------------

function BalanceStage({ build, patch, report, onNext }) {
  const { scores, gearing, massBudget, panelBudget, speed, completeness, starting } = report;

  // Lay the gearing window out on a log scale: ratios run 1:1 to 20:1 and a
  // linear axis would squash the useful end into nothing.
  const lo = Math.log(0.8);
  const hi = Math.log(25);
  const pos = (r) => `${Math.max(0, Math.min(100, ((Math.log(Math.max(0.8, r)) - lo) / (hi - lo)) * 100))}%`;

  return (
    <>
      {!completeness.ready && (
        <div className="card">
          <h3>🎯 Stage 4 — Finding the balance</h3>
          <p className="sc-muted">
            Three things still need measuring before the numbers below mean anything:
          </p>
          <ul className="sc-todo">
            {completeness.missing.map((m) => <li key={m.field}>{m.label}</li>)}
          </ul>
        </div>
      )}

      <div className="card">
        <h3>🎯 Stage 4 — Mass, panel and gearing are one decision</h3>
        <p className="sc-muted" style={{ marginBottom: '1.1rem' }}>
          You cannot choose these three separately. A bigger panel makes more power but adds mass.
          More mass needs more force, which needs a higher gear ratio, which costs speed. Your job is
          to find the combination where nothing is wasted — set your race conditions first, because
          they change every answer below.
        </p>

        <div className="sc-grid">
          <div>
            <Select label="What surface will you race on?" value={build.track.surface}
                    onChange={(v) => patch('track', { surface: v })}
                    options={Object.values(SURFACES).map((s) => ({ value: s.id, label: `${s.label} (Crr ${s.crr})` }))}
                    hint="This matters more than anything else on this page." />
            <div className="sc-row">
              <Num label="Course length" unit="m" value={build.track.distanceM} onChange={(v) => patch('track', { distanceM: v })} />
              <Num label="Speed you are aiming for" unit="m/s" step="0.1" value={build.track.targetSpeed}
                   onChange={(v) => patch('track', { targetSpeed: v })} hint="3 m/s is a quick model solar car" />
            </div>
            <div className="sc-row">
              <Num label="Slope, if any" unit="%" value={build.track.gradePct} onChange={(v) => patch('track', { gradePct: v })}
                   hint="0 for a flat floor" />
              <Num label="Motor efficiency" unit="0–1" step="0.05" value={build.track.motorEfficiency}
                   onChange={(v) => patch('track', { motorEfficiency: v })}
                   hint="0.5 is a fair guess. Stage 5 lets you find your real one." />
            </div>
          </div>

          <div>
            <div className="sc-gauges">
              <Gauge score={scores.powerToWeight} title="Power to weight" colour={scoreColour(scores.powerToWeight)} />
              <Gauge score={scores.panelSizing} title="Panel sizing" colour={scoreColour(scores.panelSizing)} />
              <Gauge score={scores.gearing} title="Gearing match" colour={scoreColour(scores.gearing)} />
              <Gauge score={scores.startability} title="Can it start" colour={scoreColour(scores.startability)} />
            </div>
            <div className="sc-gauge" style={{ marginTop: '1rem' }}>
              <div className="n" style={{ color: scoreColour(scores.balance) }}>{scores.balance}</div>
              <div className="t">Design balance — {scores.band}</div>
              <div className="bar"><span style={{ width: `${scores.balance}%`, background: scoreColour(scores.balance) }} /></div>
            </div>
          </div>
        </div>
      </div>

      <RunPrediction report={report} />

      <div className="sc-grid">
        <div className="card">
          <h3>⚖️ How much car can your panel push?</h3>
          <div className="sc-derived">
            <dl>
              <dt>Mass your panel can carry at {build.track.targetSpeed} m/s</dt><dd>{massBudget.allowedG} g</dd>
              <dt>Mass you actually built</dt><dd>{massBudget.actualG} g</dd>
              <dt>Margin</dt>
              <dd style={{ color: massBudget.withinBudget ? 'var(--primary)' : 'var(--accent-red)' }}>
                {massBudget.marginG >= 0 ? '+' : ''}{massBudget.marginG} g
              </dd>
            </dl>
          </div>
          <div className={`sc-flag ${massBudget.withinBudget ? 'ok' : 'bad'}`}>
            {massBudget.withinBudget
              ? `You are inside your budget with ${massBudget.marginG} g to spare. You could carry more, or go faster than ${build.track.targetSpeed} m/s.`
              : `You are ${Math.abs(massBudget.marginG)} g too heavy for this panel at this speed. Remove mass, choose a lower target speed, or fit a bigger panel.`}
          </div>
        </div>

        <div className="card">
          <h3>☀️ How big does the panel need to be?</h3>
          <div className="sc-derived">
            <dl>
              <dt>Power needed for {build.track.targetSpeed} m/s</dt><dd>{panelBudget.requiredRatedW} W</dd>
              <dt>Power you have</dt><dd>{panelBudget.actualRatedW} W</dd>
              <dt>Panel area needed</dt><dd>{panelBudget.requiredAreaCm2 > 0 ? `${panelBudget.requiredAreaCm2} cm²` : '—'}</dd>
              <dt>Panel area fitted</dt><dd>{panelBudget.actualAreaCm2 > 0 ? `${panelBudget.actualAreaCm2} cm²` : '—'}</dd>
              <dt>Headroom</dt>
              <dd style={{ color: panelBudget.headroom >= 1 ? 'var(--primary)' : 'var(--accent-red)' }}>
                {panelBudget.headroom > 0 ? `${panelBudget.headroom}×` : '—'}
              </dd>
            </dl>
          </div>
          <div className={`sc-flag ${panelBudget.headroom >= 1 ? 'ok' : 'bad'}`}>
            {panelBudget.headroom >= 1.6
              ? 'You have more panel than this car needs. That is not free — the extra panel is mass you are carrying. A smaller, lighter panel might actually be faster.'
              : panelBudget.headroom >= 1
                ? 'Your panel is comfortably big enough for the speed you are aiming at.'
                : 'Your panel cannot supply the power this car needs at that speed. Either the panel grows, or the car gets lighter.'}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>⚙️ Is your gear ratio in the window?</h3>
        <p className="sc-muted">
          Your gearing tops out at <strong style={{ color: 'var(--bunker-blue)' }}>{ms(speed.geometric)}</strong>.
          Your power sustains <strong style={{ color: 'var(--primary)' }}>{ms(speed.powerLimited)}</strong>.
          Gear for a little more speed than the power can hold and nothing is wasted; gear for much more
          and the motor bogs down trying to reach a speed the sun cannot pay for.
        </p>

        <div className="sc-window">
          <div className="sc-window-track">
            {gearing.min > 0 && gearing.max > 0 && (
              <div className="sc-window-zone" style={{ left: pos(gearing.min), width: `calc(${pos(gearing.max)} - ${pos(gearing.min)})` }} />
            )}
            {gearing.ideal > 0 && <div className="sc-window-ideal" style={{ left: pos(gearing.ideal) }} />}
            {gearing.actual > 0 && <div className="sc-window-you" style={{ left: pos(gearing.actual) }} />}
          </div>
          <div className="sc-window-labels">
            <span>1:1 — fast but weak</span>
            <span style={{ color: 'var(--primary)' }}>
              {gearing.min > 0 ? `target window ${gearing.min}:1 – ${gearing.max}:1` : 'measure your gears'}
            </span>
            <span>25:1 — strong but slow</span>
          </div>
        </div>

        <div className={`sc-flag ${gearing.verdict === 'matched' ? 'ok' : gearing.verdict === 'unknown' ? 'warn' : 'bad'}`}>
          {gearing.verdict === 'matched' && `Your ${gearing.actual}:1 is inside the window. This is the balance point — the drivetrain and the panel are asking for the same speed.`}
          {gearing.verdict === 'too_tall' && `Your ${gearing.actual}:1 is geared too high. Aim for about ${gearing.ideal}:1 — a bigger gear on the axle, or a smaller one on the motor.`}
          {gearing.verdict === 'too_short' && `Your ${gearing.actual}:1 is geared too low. You have power you are not using. Aim for about ${gearing.ideal}:1.`}
          {gearing.verdict === 'unknown' && 'Enter your gear teeth, wheel diameter and motor rpm to see where you sit.'}
        </div>

        {starting.stallTorqueNm > 0 && (
          <p className="sc-muted" style={{ marginTop: '0.9rem' }}>
            Getting moving from a stop needs {starting.neededN} N at the wheels and your drivetrain can make
            about {starting.startForceN} N{starting.stallTorqueEstimated ? ' (estimated from your power and rpm — measure your motor’s stall torque to be sure)' : ''}.
            {starting.willStart
              ? ` That is ${starting.margin}× what you need, and steep enough for a ${starting.maxGradePct}% ramp.`
              : ' That is not enough — it may sit and buzz instead of pulling away.'}
          </p>
        )}
      </div>

      {report.coaching.length > 0 && (
        <div className="card">
          <h3>📋 What your numbers are telling you</h3>
          <div className="sc-notes">
            {report.coaching.map((n, i) => (
              <div key={i} className={`sc-note ${n.level}`}>
                <span className="sc-note-tag">
                  {n.level === 'act' ? 'Change this' : n.level === 'check' ? 'Check this' : n.level === 'good' ? 'Working well' : 'Worth knowing'}
                </span>
                <h4>{n.title}</h4>
                <p>{n.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="sc-actions">
        <button className="sc-btn" onClick={onNext}>Next: go and test it →</button>
      </div>
    </>
  );
}

// --- Stage 5 ---------------------------------------------------------------

function TrackStage({ build, patch, setRuns, setField, report, testReport, onNext }) {
  const update = (id, seconds) => setRuns((runs) => runs.map((r) => (r.id === id ? { ...r, seconds } : r)));
  const addRun = () => setRuns((runs) => [...runs, { id: `r${Date.now()}`, seconds: '' }]);

  return (
    <>
      <div className="card">
        <h3>⏱️ Stage 5 — Does the real car agree with the prediction?</h3>
        <p className="sc-muted" style={{ marginBottom: '1rem' }}>
          Mark out {build.track.distanceM} m. Run the car three times from a standing start, in the light
          conditions you selected, and time each run. Do not adjust anything between runs — you are
          measuring one car, not three.
        </p>

        <div className="sc-row" style={{ maxWidth: '26rem', marginBottom: '1rem' }}>
          <Num label="Course length" unit="m" value={build.track.distanceM} onChange={(v) => patch('track', { distanceM: v })} />
        </div>

        <div className="sc-runs">
          {build.runs.map((r, i) => {
            const s = parseFloat(r.seconds);
            return (
              <div className="sc-run" key={r.id}>
                <span className="lbl">Run {i + 1}</span>
                <input type="number" step="0.01" min="0" placeholder="seconds"
                       value={r.seconds ?? ''} onChange={(e) => update(r.id, e.target.value)} />
                <span className="spd">{s > 0 ? `${(parseFloat(build.track.distanceM) / s).toFixed(2)} m/s` : '—'}</span>
                <button className="sc-del" onClick={() => setRuns((runs) => runs.filter((x) => x.id !== r.id))}>×</button>
              </div>
            );
          })}
        </div>
        <button className="sc-btn ghost" style={{ marginTop: '0.9rem' }} onClick={addRun}>+ Add a run</button>
      </div>

      {testReport.hasData ? (
        <div className="card">
          <h3>📊 Prediction against reality</h3>
          <div className="sc-compare">
            <div>
              <div className="big" style={{ color: 'var(--bunker-blue)' }}>{report.speed.predicted.toFixed(2)}</div>
              <div className="sc-muted">m/s predicted</div>
            </div>
            <div className="vs">
              {testReport.errorPct > 0 ? '+' : ''}{testReport.errorPct}%
              <div>difference</div>
            </div>
            <div>
              <div className="big" style={{ color: 'var(--primary)' }}>{testReport.meanSpeed.toFixed(2)}</div>
              <div className="sc-muted">m/s measured</div>
            </div>
          </div>

          <div className="sc-derived">
            <dl>
              <dt>Fastest run</dt><dd>{ms(testReport.bestSpeed)}</dd>
              <dt>Slowest run</dt><dd>{ms(testReport.worstSpeed)}</dd>
              <dt>Spread between runs</dt>
              <dd style={{ color: testReport.consistent ? 'var(--primary)' : 'var(--accent-red)' }}>
                {Math.round(testReport.spread * 100)}%
              </dd>
              <dt>Average time over {testReport.distanceM} m</dt><dd>{testReport.meanTimeS} s</dd>
            </dl>
          </div>

          <div className={`sc-flag ${testReport.agreement === 'close' ? 'ok' : testReport.agreement === 'fair' ? 'warn' : 'bad'}`}>
            <strong>
              {testReport.agreement === 'close' ? 'Your model matches your car.'
                : testReport.agreement === 'fair' ? 'Close, but something is missing from the model.'
                : 'The model and the car disagree badly — and that is the interesting part.'}
            </strong>
            <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem' }}>
              {testReport.diagnose.map((d, i) => <li key={i} style={{ marginBottom: '0.35rem' }}>{d}</li>)}
            </ul>
          </div>

          <div className="sc-field" style={{ marginTop: '1.25rem' }}>
            <label>Your explanation — why did the real car behave differently?</label>
            <textarea rows={4} value={build.reflection}
                      placeholder="An engineer's answer names a cause and says how they would test it. What would you change first, and how would you know it worked?"
                      onChange={(e) => setField('reflection', e.target.value)} />
            <span className="sc-hint">
              This is the part your coach will read. A model that disagrees with reality is not a failed
              model — it is a list of things the model did not know about.
            </span>
          </div>
        </div>
      ) : (
        <div className="card">
          <h3>📊 Your prediction, waiting to be tested</h3>
          <p className="sc-muted">
            This page says your car will do <strong style={{ color: 'var(--bunker-blue)' }}>{ms(report.speed.predicted)}</strong>,
            covering {build.track.distanceM} m in about{' '}
            <strong style={{ color: 'var(--bunker-blue)' }}>{report.speed.predictedTimeS ?? '—'} seconds</strong>, limited by{' '}
            {report.speed.limitedBy === 'gearing' ? 'its gearing' : report.speed.limitedBy === 'power' ? 'the power from its panel' : 'measurements you have not taken yet'}.
            Write that number on the board before you run it.
          </p>
        </div>
      )}

      <div className="sc-actions">
        <button className="sc-btn" onClick={onNext}>Next: get a design review →</button>
      </div>
    </>
  );
}

// --- Stage 6 ---------------------------------------------------------------

function ReviewStage({ build, setField, report, testReport }) {
  const [image, setImage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  // A review can take 20s+ on a vision call, and a school connection can leave
  // one hanging. Without this, a slow first request that finally fails can land
  // after a later successful one and replace a real AI review with the offline
  // fallback - the learner watches a good review turn into a worse one.
  const reviewSeq = useRef(0);

  const pickFile = async (file) => {
    if (!file) return;
    setError('');
    try {
      setImage(await fileToAnalysisJpeg(file));
    } catch {
      setError('That image could not be read. Try a JPEG or PNG photo.');
    }
  };

  const runReview = async () => {
    const seq = ++reviewSeq.current;
    setBusy(true);
    setError('');
    try {
      const result = await requestDesignReview({ report, testReport, image });
      if (seq !== reviewSeq.current) return;   // superseded; drop it
      setField('review', result);
    } catch (err) {
      if (seq !== reviewSeq.current) return;
      setError(err.message || 'The review could not be generated.');
    } finally {
      if (seq === reviewSeq.current) setBusy(false);
    }
  };

  const review = build.review;

  return (
    <>
      <div className="sc-grid">
        <div className="card">
          <h3>🔍 Stage 6 — Have your design reviewed</h3>
          <p className="sc-muted" style={{ marginBottom: '1rem' }}>
            Photograph your finished car from the side, in good light, with the whole car in frame.
            The reviewer gets that photo together with every number you measured, and reads them
            against each other.
          </p>

          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                 onChange={(e) => pickFile(e.target.files?.[0])} />

          {image ? (
            <>
              <img className="sc-preview" src={image.dataUrl} alt="Your solar car" />
              <div className="sc-actions">
                <button className="sc-btn ghost" onClick={() => fileRef.current?.click()}>Choose a different photo</button>
                <button className="sc-btn ghost" onClick={() => setImage(null)}>Remove</button>
              </div>
            </>
          ) : (
            <div className="sc-drop" onClick={() => fileRef.current?.click()}>
              <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>📷</div>
              <strong>Add a photo of your car</strong>
              <div style={{ fontSize: '0.82rem', marginTop: '0.3rem' }}>
                Optional — you can get a review of your numbers alone
              </div>
            </div>
          )}

          <button className="sc-btn btn-block" style={{ width: '100%', marginTop: '1rem' }}
                  disabled={busy || report.mass.totalGrams <= 0} onClick={runReview}>
            {busy ? 'Reviewing your design…' : image ? 'Review my car and my numbers' : 'Review my numbers'}
          </button>
          {report.mass.totalGrams <= 0 && (
            <p className="sc-hint" style={{ marginTop: '0.5rem' }}>Weigh your parts in Stage 1 first.</p>
          )}
          {error && <div className="sc-flag bad">{error}</div>}
        </div>

        <div className="card">
          <h3>What the reviewer is given</h3>
          <p className="sc-muted" style={{ marginBottom: '0.75rem' }}>
            Your measurements only — no name, no class, no account details.
          </p>
          <div className="sc-derived">
            <dl>
              <dt>Mass</dt><dd>{report.mass.totalGrams} g</dd>
              <dt>Panel</dt><dd>{report.panel.areaCm2} cm² / {report.panel.ratedW} W</dd>
              <dt>Gear ratio</dt><dd>{report.gearing.actual}:1</dd>
              <dt>Predicted speed</dt><dd>{ms(report.speed.predicted)}</dd>
              <dt>Measured speed</dt><dd>{testReport.hasData ? ms(testReport.meanSpeed) : 'not tested yet'}</dd>
              <dt>Balance score</dt><dd>{report.scores.balance}/100</dd>
            </dl>
          </div>
        </div>
      </div>

      {review && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.9rem', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0 }}>Design review</h3>
            <span className={`sc-source ${review.source}`}>
              {review.source === 'ai'
                ? (review.sawPhoto ? 'AI · read your photo and your numbers' : 'AI · read your numbers')
                : 'Offline · built from your numbers only'}
            </span>
          </div>

          {review.source === 'local' && (
            <div className="sc-flag warn">
              The AI reviewer could not be reached{review.error ? ` (${review.error})` : ''}, so this review was
              worked out on this device from the measurements you entered. <strong>Nothing here looked at your
              photo.</strong> Everything below still comes from your own numbers.
            </div>
          )}

          <div className="sc-review-body" style={{ marginTop: '1rem' }}
               dangerouslySetInnerHTML={{ __html: renderReview(review.text) }} />
        </div>
      )}

      <div className="card">
        <h3>📝 Your engineering write-up</h3>
        <p className="sc-muted">
          Finish the project by answering these in your own words. Your coach sees this with your numbers.
        </p>
        <ul className="sc-todo" style={{ marginBottom: '1rem' }}>
          <li>Which of the three — mass, panel, gearing — limited your car, and how do you know?</li>
          <li>What did you change after the first test, and what happened to the time?</li>
          <li>If you had one more lesson and no new parts, what would you do?</li>
        </ul>
        <textarea rows={6} value={build.reflection} onChange={(e) => setField('reflection', e.target.value)}
                  placeholder="Write your conclusions here." />
      </div>
    </>
  );
}

/**
 * The review text is Markdown-ish: **bold** headings and `- ` bullets, from our
 * own prompt or our own offline generator. Escape first, then allow those two
 * forms back in - the model output is untrusted text going into innerHTML.
 */
function renderReview(text) {
  const escaped = String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '• $1');
}

export default SolarCarChallenge;
