import {
  BADGES, TRANSDUCERS, SITES, TRIP_LIMIT_MM, DIODES, LAB_STEPS, cleanRectifier, rectifierReport,
  ACCESS_CHECKS, cleanDeflection, deflectionReport, STRESS_STEPS, FOOTFALL, SCALES, cleanRoi, roiReport, honestRoiDone, VOCAB
} from './kineticEnergy.js';
import { Slider, Seg, Tile, Gauge, Check, Chips, Vocab, BadgeLine, ModelNote, useDing } from './ToolBits.jsx';
import { playToolSound } from './sound.js';

const TONE = 'green';
const badge = (id) => BADGES.find((b) => b.id === id);
const usd = (n) => `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const years = (y) => (y == null ? 'never' : y >= 1000 ? `${Math.round(y).toLocaleString()} years` : y >= 10 ? `${Math.round(y)} years` : `${y.toFixed(1)} years`);

export function ToolFor({ id, data, save }) {
  if (id === 'rectifier-bench') return <RectifierBench data={data} save={save} />;
  if (id === 'deflection-checker') return <DeflectionChecker data={data} save={save} />;
  if (id === 'roi-calculator') return <RoiCalculator data={data} save={save} />;
  return null;
}

function TransducerPicker({ value, onChange, detail }) {
  return (
    <div className="pt-options" role="group" aria-label="Transducer">
      {TRANSDUCERS.map((t) => (
        <button key={t.id} type="button" className="pt-option" aria-pressed={value === t.id} onClick={() => onChange(t.id)}>
          <b>{t.short}</b><small>{detail(t)}</small>
        </button>
      ))}
    </div>
  );
}

/* --------------------------------------------------------- Rectifier bench */

function RectifierBench({ data, save }) {
  const d = cleanRectifier(data);
  const r = rectifierReport(d);
  const set = (p) => save({ ...d, ...p });
  const [si, sch] = r.runs;

  return (
    <div className="pt-tool" data-tone={TONE}>
      <Vocab terms={VOCAB} />
      <div className="pt-split">
        <div className="pt-stack">
          <fieldset className="pt-fieldset">
            <legend>1. What makes the electricity?</legend>
            <TransducerPicker value={d.transducerId} onChange={(id) => set({ transducerId: id })} detail={(t) => `${t.openCircuitPeakV} V peak · ${t.shortCircuitCurrentMa} mA`} />
          </fieldset>
          <fieldset className="pt-fieldset">
            <legend>2. Bridge diodes</legend>
            <Seg label="Diode type" value={d.diodeId} onChange={(id) => { playToolSound('pop'); set({ diodeId: id }); }}
                 options={r.runs.map((x) => ({ id: x.diode.id, label: `${x.diode.label} · ${x.drop} V bridge drop` }))} />
            <p className="pt-hint">Two diodes conduct at a time, so the bridge costs 2 × {r.chosen.diode.dropPerDiode} V = {r.chosen.drop} V of every pulse.</p>
            <Slider label="Footsteps" value={d.steps} min={1} max={200} onChange={(v) => set({ steps: v })} hint={`Activity 2.2 uses ${LAB_STEPS} footsteps.`} />
            <Slider label="Load on the capacitor after the steps stop" value={d.loadKohm} min={1} max={100} unit=" kΩ" onChange={(v) => set({ loadKohm: v })}
                    hint={`Time constant RC = ${r.tauSec} s: the voltage falls to 37% in that time.`} />
          </fieldset>
          <details className="pt-details">
            <summary>Tune the model to your bench</summary>
            <Slider label="How much of the gap one footstep closes" value={d.gainPct} min={2} max={40} unit="%" onChange={(v) => set({ gainPct: v })} />
          </details>
        </div>

        <div className="pt-stack" aria-live="polite">
          <ChargeChart r={r} chosenId={d.diodeId} />
          <div className="pt-tiles">
            <Tile label={`${si.diode.label}: stored`} value={`${si.v} V · ${si.energyMj} mJ`} />
            <Tile label={`${sch.diode.label}: stored`} value={`${sch.v} V · ${sch.energyMj} mJ`} strong />
            <Tile label="Pulse lost in the silicon bridge" value={`${si.lostPct}%`} tone={si.lostPct > 20 ? 'bad' : 'warn'} />
            <Tile label="Pulse lost in the Schottky bridge" value={`${sch.lostPct}%`} tone="ok" />
          </div>
          <p className={r.schottkyGainPct == null ? 'pt-warn' : 'pt-ok'} role="status">
            {r.schottkyGainPct == null ? 'The silicon bridge blocks this transducer completely: its drop is higher than the peak voltage.'
              : `With ${r.transducer.short.toLowerCase()}, Schottky diodes store ${r.schottkyGainPct}% more energy after ${d.steps} footsteps.`}
          </p>
          <p className="pt-formula">Energy = ½ × C × V² = ½ × 1000 µF × ({r.chosen.v} V)² = <b>{r.chosen.energyMj} mJ</b></p>
        </div>
      </div>
      <ModelNote>Peak voltages and diode drops are from your program guide. The shape of the curve is a model: plot your own multimeter readings beside it.</ModelNote>
      <BadgeLine badge={badge('badge-lossless-rectifier')}>deploy your 48-hour ESP32 logger and show your own Schottky savings on a real 1000 µF capacitor.</BadgeLine>
    </div>
  );
}

/** Charging (one point per footstep) for both diodes, then the chosen one discharging through the load. */
function ChargeChart({ r, chosenId }) {
  const W = 360; const H = 190; const padL = 32; const padB = 26; const split = 0.66;
  const maxV = Math.max(1, ...r.runs.map((x) => x.ceiling)) * 1.05;
  const n = r.runs[0].charge.length - 1;
  const xc = (i) => padL + (i / n) * (W - padL - 10) * split;
  const x0 = xc(n);
  const xd = (t) => x0 + (t / (r.decay.length - 1)) * (W - 10 - x0);
  const y = (v) => 8 + (1 - v / maxV) * (H - padB - 8);
  const line = (pts) => pts.map(([px, v], i) => `${i ? 'L' : 'M'}${px.toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <figure className="pt-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img"
           aria-label={`Capacitor voltage. After ${n} footsteps: ${r.runs.map((x) => `${x.diode.label} ${x.v} volts`).join(', ')}. Then it discharges through the load.`}>
        <line x1={padL} x2={W - 10} y1={y(0)} y2={y(0)} className="pt-zero" />
        <line x1={x0} x2={x0} y1={8} y2={y(0)} className="pt-zero" />
        <text x={padL - 4} y={14} textAnchor="end" className="pt-axis">{maxV.toFixed(0)} V</text>
        <text x={padL - 4} y={y(0) + 3} textAnchor="end" className="pt-axis">0</text>
        {r.runs.map((run) => (
          <path key={run.diode.id} d={line(run.charge.map((v, i) => [xc(i), v]))} className={`pt-line ${run.diode.id === '1n5819' ? 'pt-line-map' : 'pt-line-dia'}${run.diode.id === chosenId ? '' : ' is-dim'}`} />
        ))}
        <path d={line(r.decay.map((v, t) => [xd(t), v]))} className="pt-line pt-line-sys" />
        <text x={(padL + x0) / 2} y={H - 6} textAnchor="middle" className="pt-axis">{n} footsteps (charging)</text>
        <text x={(x0 + W - 10) / 2} y={H - 6} textAnchor="middle" className="pt-axis">{r.decay.length - 1} s (discharging)</text>
      </svg>
      <figcaption className="pt-legend"><span className="k-map">1N5819 Schottky</span><span className="k-dia">1N4007 silicon</span><span className="k-sys">Decay through the load</span></figcaption>
    </figure>
  );
}

/* ------------------------------------------------------ Deflection checker */

function DeflectionChecker({ data, save }) {
  const d = cleanDeflection(data);
  const r = deflectionReport(d);
  const set = (p) => save({ ...d, ...p });
  const mm = d.measuredMm ?? 0;
  useDing(r.pass);

  return (
    <div className="pt-tool" data-tone={TONE}>
      <Vocab terms={VOCAB} />
      <div className="pt-options" role="group" aria-label="Site">
        {SITES.map((s) => (
          <button key={s.id} type="button" className="pt-option" aria-pressed={d.siteId === s.id} onClick={() => set({ siteId: s.id })}>
            <b>{s.short}</b><small>limit {s.limitMm} mm · {s.dailyFootstepsPerTile.toLocaleString()} steps a day per tile</small>
          </button>
        ))}
      </div>
      <p className="pt-hint">{r.site.accessibilityNotes}</p>
      <div className="pt-split">
        <div className="pt-stack">
          <Slider label="Dip we measured under load" value={mm} min={0} max={10} step={0.1} unit=" mm" band={[0, r.site.limitMm]} onChange={(v) => set({ measuredMm: v })}
                  hint="Measure with calipers or a ruler while someone stands on the tile." />
          <Slider label="Weight of the tester" value={d.loadKg} min={20} max={120} unit=" kg" onChange={(v) => set({ loadKg: v })} />
          <svg className="pt-tile-view" viewBox="0 0 300 120" role="img" aria-label={`Side view of the tile dipping ${mm} millimetres. The trip limit is ${TRIP_LIMIT_MM} millimetres.`}>
            <rect x="0" y="40" width="80" height="60" className="pt-floor" /><rect x="220" y="40" width="80" height="60" className="pt-floor" />
            <rect x="80" y={40 + mm * 5} width="140" height="14" rx="3" className={`pt-tile-top is-${r.state}`} />
            <line x1="60" x2="240" y1={40 + TRIP_LIMIT_MM * 5} y2={40 + TRIP_LIMIT_MM * 5} className="pt-limit" />
            <text x="244" y={44 + TRIP_LIMIT_MM * 5} className="pt-axis">{TRIP_LIMIT_MM} mm</text>
            <line x1="60" x2="240" y1={40 + r.site.limitMm * 5} y2={40 + r.site.limitMm * 5} className="pt-limit is-site" />
          </svg>
        </div>
        <div className="pt-stack" aria-live="polite">
          <Gauge label="Dip against the trip limit" value={(mm / 10) * 100} text={d.measuredMm == null ? 'not measured' : `${mm} mm`} target={(TRIP_LIMIT_MM / 10) * 100}
                 state={r.state === 'none' ? 'warn' : r.state} />
          <p className={r.state === 'ok' ? 'pt-ok' : 'pt-warn'} role="status">
            {r.state === 'none' ? 'Move the slider to your measured dip.'
              : r.state === 'ok' ? `✓ Trip-free: ${r.marginMm} mm inside this site's ${r.site.limitMm} mm limit.`
              : r.state === 'warn' ? `Under ${TRIP_LIMIT_MM} mm, but over this site's ${r.site.limitMm} mm limit. Stiffen the springs or add a stop.`
              : `Trip hazard: ${TRIP_LIMIT_MM} mm or more. This tile cannot go in a walkway.`}
          </p>
          <fieldset className="pt-fieldset">
            <legend>Universal design audit ({r.checksDone}/{r.checksTotal})</legend>
            {ACCESS_CHECKS.map((c) => (
              <Check key={c.id} checked={d.checks.includes(c.id)} onChange={(on) => set({ checks: on ? [...d.checks, c.id] : d.checks.filter((x) => x !== c.id) })}>{c.label}</Check>
            ))}
          </fieldset>
          <p className={r.pass ? 'pt-ok' : 'pt-hint'}>{r.pass ? '✓ Ready for Deliverable #1: the tile passes the deflection spec and the audit.' : 'Pass the limit and tick all five audit checks.'}</p>
        </div>
      </div>
      <BadgeLine badge={badge('badge-smart-tile-fabricator')}>finish the soldered tile, the live OLED telemetry and the 3-panel A1 blueprint.</BadgeLine>
    </div>
  );
}

/* ------------------------------------------------------ Stress test and ROI */

const toSlider = (n) => Math.round((Math.log10(n / FOOTFALL.min) / Math.log10(FOOTFALL.max / FOOTFALL.min)) * 100);
const fromSlider = (x) => { const n = FOOTFALL.min * (FOOTFALL.max / FOOTFALL.min) ** (x / 100); return Math.round(n / 500) * 500; };

function RoiCalculator({ data, save }) {
  const d = cleanRoi(data);
  const r = roiReport(d);
  const done = !!data && honestRoiDone(d);
  const set = (p) => save({ ...d, ...p });
  useDing(done);
  const field = (label, key, unit, step = '0.01') => (
    <label className="pt-field"><span>{label}</span>
      <span className="pt-num"><input className="gh-input" type="number" min="0" step={step} value={d[key] ?? ''} onChange={(e) => set({ [key]: e.target.value })} /><span>{unit}</span></span></label>
  );

  return (
    <div className="pt-tool" data-tone={TONE}>
      <Vocab terms={VOCAB} />
      <fieldset className="pt-fieldset">
        <legend>1. The 1,000-footstep stress test (Activity 5.1)</legend>
        <div className="pt-grid3">
          {field('Footsteps completed', 'steps', 'steps', '1')}
          {field('Energy per step at the start', 'jStart', 'J')}
          {field('Energy per step at the end', 'jEnd', 'J')}
        </div>
        <Gauge label="Footsteps" value={(d.steps / STRESS_STEPS) * 100} text={`${d.steps.toLocaleString()} of ${STRESS_STEPS.toLocaleString()}`} state={d.steps >= STRESS_STEPS ? 'ok' : 'warn'} />
        {r.stress.fadePct != null && (
          <p className={r.stress.fadePct <= 10 ? 'pt-ok' : 'pt-warn'}>
            {r.stress.fadePct <= 0 ? '✓ No fade: the tile gives as much at the end as at the start.' : `Output faded ${r.stress.fadePct}% over the test. What wore out? That is your V2.0 fix.`}
          </p>
        )}
      </fieldset>

      <div className="pt-split">
        <div className="pt-stack">
          <fieldset className="pt-fieldset">
            <legend>2. The site and the tiles</legend>
            <TransducerPicker value={d.transducerId} onChange={(id) => set({ transducerId: id })} detail={(t) => `${t.joulesPerFootstepOrCycle} J per step · $${t.unitPrototypeBomUSD} prototype`} />
            <Check checked={d.useMeasured} onChange={(on) => set({ useMeasured: on })}>
              Use our own measured energy per step{r.stress.logged ? ` (${d.jEnd} J)` : ' (log the stress test first)'}
            </Check>
            <label className="pt-field pt-slider">
              <span className="pt-slider-top"><span>Footsteps a day on each tile</span><b>{d.footfall.toLocaleString()}</b></span>
              <input type="range" min="0" max="100" value={toSlider(d.footfall)} aria-valuetext={`${d.footfall} footsteps a day`} onChange={(e) => set({ footfall: fromSlider(Number(e.target.value)) })} />
            </label>
            <Chips label="Or use a site from your heatmap" value={null} onChange={(id) => { const s = SITES.find((x) => x.id === id); if (s) set({ footfall: s.dailyFootstepsPerTile, tiles: s.recommendedTileCount }); }}
                   options={SITES.map((s) => ({ id: s.id, label: `${s.short} · ${s.dailyFootstepsPerTile.toLocaleString()}` }))} />
            <Slider label="Number of tiles" value={d.tiles} min={1} max={100} onChange={(v) => set({ tiles: v })} />
            <Seg label="Build scale" value={d.scale} onChange={(id) => set({ scale: id })} options={SCALES} />
          </fieldset>
          <fieldset className="pt-fieldset">
            <legend>3. Prices you looked up</legend>
            <div className="pt-grid2">
              {field('Your grid electricity price', 'gridUsdPerKwh', 'USD/kWh')}
              {field('Yearly cost of one battery footfall sensor', 'sensorUsdPerYear', 'USD/yr', '1')}
            </div>
            <p className="pt-hint">The grid price starts at 0.12 USD/kWh as a placeholder: replace it with your own bill. The sensor cost starts at 0 until you research it.</p>
          </fieldset>
        </div>

        <div className="pt-stack" aria-live="polite">
          <div className="pt-tiles">
            <Tile label="Energy per day" value={`${r.whDay.toLocaleString()} Wh`} />
            <Tile label="Energy per year" value={`${r.kwhYear.toLocaleString()} kWh`} strong />
            <Tile label="Worth on the grid, per year" value={usd(r.gridUsdYear)} />
            <Tile label={`Cost of ${d.tiles} tiles`} value={usd(r.costUsd)} />
          </div>
          <div className="pt-compare">
            <div className="pt-compare-col" data-state="bad">
              <small>Payback as grid electricity only</small><b>{years(r.gridPaybackYears)}</b>
              <span>{usd(r.gridUsdYear)} a year against {usd(r.costUsd)}</span>
            </div>
            <div className="pt-compare-col" data-state={r.sensorUsdYear > 0 ? 'ok' : 'warn'}>
              <small>Payback with batteryless sensing</small><b>{r.sensorUsdYear > 0 ? years(r.totalPaybackYears) : 'research the sensor cost'}</b>
              <span>{usd(r.gridUsdYear + r.sensorUsdYear)} a year in energy plus sensors replaced</span>
            </div>
          </div>
          <p className="pt-formula">
            {d.footfall.toLocaleString()} steps × {r.jPerStep} J × {d.tiles} tiles × 365 ÷ 3,600,000 = <b>{r.kwhYear.toLocaleString()} kWh a year</b><br />
            Average power {r.avgWatts} W{r.usdPerAvgWatt != null ? <> · <b>{usd(r.usdPerAvgWatt)}</b> per average watt. Compare that with a solar panel you priced.</> : '.'}
          </p>
          <p className="pt-verdict">
            {r.measured ? 'This runs on your own stress-test number.' : 'This runs on the program guide\'s energy-per-step figure. Tick "use our own" once you have measured.'}
            {' '}Where does harvesting footsteps honestly make sense?
          </p>
        </div>
      </div>
      <BadgeLine badge={badge('badge-honest-roi-analyst')} earned={done} auto>
        Log at least {STRESS_STEPS.toLocaleString()} footsteps with your start and end energy per step, then run the model on your own measured number
      </BadgeLine>
    </div>
  );
}
