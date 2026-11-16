import { useEffect, useState } from 'react';
import { Play, Square, RotateCcw } from 'lucide-react';
import {
  BADGES, PUMPS, VALVES, ZONES, BPM, STROKE, cleanBench, benchReport, cleanPressure, pressureReport,
  TEST_SECONDS, WINDOWS, DIGITS, REACH_LIMIT_SEC, FATIGUE, VERSIONS, cleanTest, runReport, compareRuns, VOCAB
} from './vitalFlow.js';
import { Slider, Seg, Tile, Gauge, Check, Chips, Vocab, BadgeLine, ModelNote, useDing, useTicker, reducedMotion } from './ToolBits.jsx';
import { playToolSound } from './sound.js';
import { beep } from './sound.js';

const TONE = 'magenta';
const badge = (id) => BADGES.find((b) => b.id === id);
const shortName = (name) => name.replace(/\s*\(.*\)$/, '');

export function ToolFor({ id, data, save }) {
  if (id === 'pump-bench') return <PumpBench data={data} save={save} />;
  if (id === 'pressure-inspector') return <PressureInspector data={data} save={save} />;
  if (id === 'stress-test') return <StressTest data={data} save={save} />;
  return null;
}

function ValvePicker({ value, onChange }) {
  return (
    <div className="pt-options" role="group" aria-label="One-way valve">
      {VALVES.map((v) => (
        <button key={v.id} type="button" className="pt-option" aria-pressed={value === v.id} onClick={() => onChange(v.id)}>
          <b>{shortName(v.name)}</b>
          <small>Stops {v.backflowPreventionPct}% of backflow · costs {v.forwardPressureDropMmHg} mmHg</small>
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------- Pump bench */

function PumpBench({ data, save }) {
  const b = cleanBench(data);
  const r = benchReport(b);
  const set = (p) => save({ ...b, ...p });
  const beat = reducedMotion() ? undefined : { animationDuration: `${(60 / b.bpm).toFixed(2)}s` };

  return (
    <div className="pt-tool" data-tone={TONE}>
      <Vocab terms={VOCAB} />
      <div className="pt-split">
        <div className="pt-stack">
          <fieldset className="pt-fieldset">
            <legend>1. Diaphragm pump</legend>
            <Chips label="Start from a pump you tested" value={b.pumpId} options={PUMPS.map((p) => ({ id: p.id, label: `${p.mechanism.split(' ').slice(-3).join(' ')} · ${p.strokeVolumeMl} mL` }))}
                   onChange={(id) => { const p = PUMPS.find((x) => x.id === id); set(p ? { pumpId: id, strokeMl: Math.max(STROKE.min, Math.min(STROKE.max, p.strokeVolumeMl)) } : { pumpId: null }); }} />
            <Slider label="Pump rate" value={b.bpm} min={BPM.min} max={BPM.max} unit=" BPM" onChange={(v) => set({ bpm: v })} />
            <Slider label="Stroke volume" value={b.strokeMl} min={STROKE.min} max={STROKE.max} unit=" mL" onChange={(v) => set({ strokeMl: v, pumpId: null })} />
            <Slider label="Total tubing volume of your loop" value={b.loopMl} min={100} max={3000} step={50} unit=" mL" onChange={(v) => set({ loopMl: v })}
                    hint="From Activity 2.3: stroke volume against total tubing capacity." />
          </fieldset>
          <fieldset className="pt-fieldset">
            <legend>2. One-way valve</legend>
            <ValvePicker value={b.valveId} onChange={(id) => { playToolSound('pop'); set({ valveId: id }); }} />
            <p className="pt-hint">Like: {r.valve.clinicalAnalogy}.</p>
          </fieldset>
        </div>

        <div className="pt-stack" aria-live="polite">
          <svg className="pt-loop" viewBox="0 0 300 150" role="img"
               aria-label={`Closed loop. ${r.netMlMin} millilitres a minute move forward; ${r.backflowPct} percent of each stroke flows back.`}>
            <rect x="60" y="24" width="210" height="102" rx="40" className="pt-loop-tube" />
            <circle cx="60" cy="75" r="32" className="pt-loop-pump" style={beat} />
            <text x="60" y="80" textAnchor="middle" className="pt-node-label">PUMP</text>
            <path d="M150 24 l-12 -8 v16 z" className="pt-loop-fwd" /><path d="M170 126 l12 -8 v16 z" className="pt-loop-fwd" />
            {r.backflowPct > 6 && <path d="M118 24 l12 -8 v16 z" className="pt-loop-back" style={{ opacity: Math.min(1, r.backflowPct / 60 + 0.3) }} />}
            <rect x="94" y="14" width="8" height="20" rx="2" className={r.regurgitant ? 'pt-loop-valve is-bad' : 'pt-loop-valve'} />
          </svg>
          <div className="pt-tiles">
            <Tile label="Net forward flow" value={`${r.netLMin} L/min`} strong />
            <Tile label="Backflow each beat" value={`${r.backflowMlBeat} mL`} tone={r.regurgitant ? 'bad' : r.backflowPct > 10 ? 'warn' : 'ok'} />
            <Tile label="Strokes for one circuit" value={r.strokesPerCircuit} />
            <Tile label="Time for one circuit" value={r.circuitSec == null ? '–' : `${r.circuitSec} s`} />
          </div>
          <Gauge label="Backflow" value={r.backflowPct} state={r.regurgitant ? 'bad' : r.backflowPct > 10 ? 'warn' : 'ok'} />
          <p className={r.regurgitant ? 'pt-warn' : 'pt-ok'} role="status">
            {r.regurgitant ? `Regurgitant: ${r.backflowPct}% of every stroke sloshes backward. The two loops mix.` : `✓ The valve holds: only ${r.backflowPct}% flows back.`}
          </p>
          <p className="pt-formula">{b.bpm} BPM × {b.strokeMl} mL × {r.valve.backflowPreventionPct}% kept = <b>{r.netMlMin.toLocaleString()} mL/min</b></p>
        </div>
      </div>
      <ModelNote>Valve figures are the ones in your program guide. Measure your own stroke volume and backflow in Activities 3.1 and 3.2.</ModelNote>
      <BadgeLine badge={badge('badge-valve-innovator')}>test real glove and balloon stroke volumes, build a working check-valve and finish the life-size blueprint.</BadgeLine>
    </div>
  );
}

/* ------------------------------------------------------ Pressure inspector */

function PressureInspector({ data, save }) {
  const p = cleanPressure(data);
  const r = pressureReport(p);
  const set = (patch) => save({ ...p, ...patch });
  const zone = ZONES.find((z) => z.id === p.zoneId);
  const zr = r.zones.find((z) => z.id === p.zoneId);
  useDing(r.allPerfused);

  return (
    <div className="pt-tool" data-tone={TONE}>
      <Vocab terms={VOCAB} />
      <ol className="pt-zones" aria-label="Path of blood from the heart, nearest zone first">
        <li className="pt-zone is-heart"><b>Heart</b><small>{r.atHeart} mmHg</small></li>
        {r.zones.map((z) => (
          <li key={z.id}>
            <button type="button" className={`pt-zone${z.perfused ? '' : ' is-dry'}`} aria-pressed={p.zoneId === z.id} onClick={() => set({ zoneId: z.id })}>
              <b>{z.short}</b><small>{z.distanceCm} cm · MAP {z.map}</small>
            </button>
          </li>
        ))}
        <li className="pt-zone is-heart"><b>Venous return</b><small>back to the heart</small></li>
      </ol>

      <div className="pt-split">
        <div className="pt-stack">
          <PressureChart r={r} need={p.needMmHg} sel={p.zoneId} />
          <div className="pt-tiles pt-tiles-3" aria-live="polite">
            <Tile label="Systolic" value={`${zr.sys} mmHg`} />
            <Tile label="Diastolic" value={`${zr.dia} mmHg`} />
            <Tile label="Mean (MAP)" value={`${zr.map} mmHg`} strong tone={zr.perfused ? 'ok' : 'bad'} />
          </div>
          <p className={r.allPerfused ? 'pt-ok' : 'pt-warn'} role="status">
            {r.allPerfused ? '✓ Every zone has enough pressure to push through the micro-straws.' : `Dead zone risk: ${r.dry.join(', ')}.`}
          </p>
        </div>
        <div className="pt-stack">
          <article className="pt-zone-card">
            <h4 className="pt-h4">{zone.zoneName}</h4>
            <dl>
              <dt>Arteries</dt><dd>{zone.arterialPathway}</dd>
              <dt>Veins back</dt><dd>{zone.venousReturnPathway}</dd>
              <dt>Tubing</dt><dd>{zone.tubingSpec}</dd>
              <dt>Risk</dt><dd>{zone.clinicalIschemiaRisk}</dd>
            </dl>
          </article>
          <fieldset className="pt-fieldset">
            <legend>Pump and valve</legend>
            <Chips label="Pump" value={p.pumpId} onChange={(id) => id && set({ pumpId: id })}
                   options={PUMPS.map((x) => ({ id: x.id, label: `${x.mechanism.split(' ').slice(-3).join(' ')} · ${x.peakSystolicMmHg} mmHg` }))} />
            <ValvePicker value={p.valveId} onChange={(id) => set({ valveId: id })} />
          </fieldset>
          <details className="pt-details">
            <summary>Tune the model to your rig</summary>
            <Slider label="Pressure lost per 10 cm of tubing" value={p.lossPer10cm} min={0.5} max={8} step={0.5} unit=" mmHg" onChange={(v) => set({ lossPer10cm: v })} />
            <Slider label="Pressure stretchy tubing holds between beats" value={p.recoilPct} min={20} max={90} unit="%" onChange={(v) => set({ recoilPct: v })} />
            <Slider label="Pressure needed to push through the micro-straws" value={p.needMmHg} min={5} max={80} unit=" mmHg" onChange={(v) => set({ needMmHg: v })} />
          </details>
        </div>
      </div>
      <ModelNote>
        MAP = diastolic + ⅓ × (systolic − diastolic). The three tuning numbers are starting guesses, not measurements: change them until the model matches your bench.
      </ModelNote>
      <BadgeLine badge={badge('badge-ischemia-empathy')}>trace the gas exchange and label every major artery and vein on your own diagram.</BadgeLine>
    </div>
  );
}

function PressureChart({ r, need, sel }) {
  const W = 340; const H = 180; const padL = 34; const padB = 30;
  const maxD = Math.max(...r.zones.map((z) => z.distanceCm));
  const maxP = Math.max(60, r.atHeart);
  const x = (d) => padL + (d / maxD) * (W - padL - 14);
  const y = (v) => 10 + (1 - v / maxP) * (H - padB - 10);
  const pts = (key) => [[0, key === 'dia' ? null : r.atHeart], ...r.zones.map((z) => [z.distanceCm, z[key]])].filter((p) => p[1] != null);
  // Zones at 28, 35 and 42 cm sit close together: label the selected one first, then any tick that clears the rest.
  const labelled = [];
  for (const z of [...r.zones].sort((p, q) => (q.id === sel) - (p.id === sel))) {
    if (labelled.every((id) => Math.abs(x(r.zones.find((o) => o.id === id).distanceCm) - x(z.distanceCm)) >= 24)) labelled.push(z.id);
  }
  const path = (key) => pts(key).map(([d, v], i) => `${i ? 'L' : 'M'}${x(d).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <figure className="pt-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img"
           aria-label={`Pressure against distance from the heart. ${r.zones.map((z) => `${z.short}: systolic ${z.sys}, diastolic ${z.dia}, mean ${z.map}`).join('. ')}.`}>
        <line x1={padL} x2={W - 14} y1={y(need)} y2={y(need)} className="pt-zero" />
        <text x={W - 14} y={y(need) - 4} textAnchor="end" className="pt-axis">needed {need}</text>
        <text x={padL - 4} y={14} textAnchor="end" className="pt-axis">{maxP}</text>
        <text x={padL - 4} y={y(0) + 3} textAnchor="end" className="pt-axis">0</text>
        <path d={path('sys')} className="pt-line pt-line-sys" /><path d={path('dia')} className="pt-line pt-line-dia" /><path d={path('map')} className="pt-line pt-line-map" />
        {r.zones.map((z) => (
          <g key={z.id}>
            <circle cx={x(z.distanceCm)} cy={y(z.map)} r={z.id === sel ? 6 : 3.5} className={z.perfused ? 'pt-pt' : 'pt-pt is-neg'} />
            {labelled.includes(z.id) && <text x={x(z.distanceCm)} y={H - 10} textAnchor="middle" className="pt-axis">{z.distanceCm}</text>}
          </g>
        ))}
        <text x={(W + padL) / 2} y={H - 0.5} textAnchor="middle" className="pt-axis">cm from the heart</text>
      </svg>
      <figcaption className="pt-legend"><span className="k-sys">Systolic</span><span className="k-map">Mean (MAP)</span><span className="k-dia">Diastolic</span><span>mmHg</span></figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------- Stress test */

function StressTest({ data, save }) {
  const d = cleanTest(data);
  const run = d[d.version];
  const rr = runReport(run);
  const v2 = runReport(d.v2);
  const [running, setRunning] = useState(false);
  const [elapsed, reset] = useTicker(running);
  const setRun = (patch) => save({ ...d, [d.version]: { ...run, ...patch } });
  useDing(v2.pass);

  useEffect(() => {
    if (running && elapsed >= TEST_SECONDS) { setRunning(false); beep(880, 0.4); setRun({ ran: true }); }
  }, [elapsed, running]); // eslint-disable-line react-hooks/exhaustive-deps
  const left = Math.max(0, TEST_SECONDS - elapsed);
  const win = Math.min(WINDOWS.length - 1, Math.floor(elapsed / 20));
  const numField = (label, key, max, unit) => (
    <label className="pt-field"><span>{label}</span>
      <span className="pt-num"><input className="gh-input" type="number" min="0" max={max} value={run[key] ?? ''} onChange={(e) => setRun({ [key]: e.target.value })} /><span>{unit}</span></span></label>
  );

  return (
    <div className="pt-tool" data-tone={TONE}>
      <Vocab terms={VOCAB} />
      <Seg label="Prototype version" value={d.version} onChange={(v) => { setRunning(false); reset(); save({ ...d, version: v }); }}
           options={VERSIONS.map((v) => ({ id: v.id, label: `${v.label}${runReport(d[v.id]).complete ? ' ✓' : ''}` }))} />

      <div className="pt-sprint-bar">
        <span className="pt-clock">{running ? `${Math.ceil(left)} s left · window ${WINDOWS[win]}` : run.ran ? '60-second run done ✓' : '60-second run'}</span>
        <span className="pb-meter pt-meter" aria-hidden="true"><span style={{ width: `${Math.min(100, (elapsed / TEST_SECONDS) * 100)}%` }} /></span>
        {running
          ? <button type="button" className="gh-btn gh-btn-sm" onClick={() => { setRunning(false); reset(); }}><Square size={14} aria-hidden="true" />Stop</button>
          : <button type="button" className="gh-btn gh-btn-sm gh-btn-primary" onClick={() => { reset(); setRunning(true); }}><Play size={15} aria-hidden="true" />Start 60 s run</button>}
        {run.ran && !running && <button type="button" className="gh-btn gh-btn-ghost gh-btn-sm" onClick={() => setRun({ ran: false })}><RotateCcw size={14} aria-hidden="true" />Clear run</button>}
      </div>
      <p className="pt-hint">Pump steadily for the whole minute. One teammate catches the distal output in a measuring cup for each 20-second window.</p>

      <fieldset className="pt-fieldset">
        <legend>What we measured · {VERSIONS.find((v) => v.id === d.version).label}</legend>
        <div className="pt-grid2">
          {numField('Pump rate we counted', 'bpm', 300, 'BPM')}
          {numField('Time for dye to reach the toes', 'reachSec', 600, 's')}
          {numField(`Fingers and toes perfused (of ${DIGITS})`, 'digits', DIGITS, `/ ${DIGITS}`)}
        </div>
        <div className="pt-grid3">
          {WINDOWS.map((w, i) => (
            <label key={w} className="pt-field"><span>Output {w}</span>
              <span className="pt-num"><input className="gh-input" type="number" min="0" value={run.ml[i] ?? ''}
                    onChange={(e) => setRun({ ml: run.ml.map((m, j) => (j === i ? e.target.value : m)) })} /><span>mL</span></span></label>
          ))}
        </div>
        <Chips label="Where did it leak? (tap every leaking zone)" multi value={run.leaks} onChange={(leaks) => setRun({ leaks })}
               options={ZONES.map((z) => ({ id: z.id, label: z.short }))} />
        <Chips label="Tubing after the run" value={run.fatigue} onChange={(fatigue) => setRun({ fatigue })} options={FATIGUE} />
        <Check checked={run.venous} onChange={(on) => setRun({ venous: on })}>We saw continuous venous return to the heart</Check>
      </fieldset>

      <div className="pt-tiles pt-tiles-4" aria-live="polite">
        <Tile label="Distal output" value={rr.flowMlMin == null ? '–' : `${rr.flowMlMin} mL/min`} strong />
        <Tile label="Flow stability" value={rr.stabilityPct == null ? '–' : `${rr.stabilityPct}%`} />
        <Tile label="Perfusion" value={rr.perfusionPct == null ? '–' : `${rr.perfusionPct}%`} tone={rr.perfusionPct === 100 ? 'ok' : undefined} />
        <Tile label="Leak points" value={run.ran ? rr.leakCount : '–'} tone={run.ran ? (rr.leakCount === 0 ? 'ok' : 'bad') : undefined} />
      </div>

      <div className="pt-table-wrap">
        <table className="pt-table">
          <caption>V1.0 against V2.0</caption>
          <thead><tr><th scope="col">Measure</th><th scope="col">V1.0</th><th scope="col">V2.0</th></tr></thead>
          <tbody>
            {compareRuns(d).map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td className={row.better === 'v1' ? 'is-better' : ''}>{row.v1}</td>
                <td className={row.better === 'v2' ? 'is-better' : ''}>{row.v2}{row.better === 'v2' ? ' ▲' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <BadgeLine badge={badge('badge-reach-the-toes')} earned={v2.pass} auto>
        On Prototype V2.0, finish the 60-second run with all {DIGITS} digits perfused within {REACH_LIMIT_SEC} seconds, zero leaks and visible venous return
      </BadgeLine>
    </div>
  );
}
