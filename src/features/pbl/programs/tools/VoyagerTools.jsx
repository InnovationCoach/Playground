import {
  BADGES, BED_MM, WALL, INFILL, WALL_LOOPS, TILT, CLEARANCE_MM, cleanShell, shellReport, sliceReady, cleanBay, bayReport, cadShellDone,
  STAGES, ROLES, WEEKS, FRIDAY_PARTS, cleanLog, logReport, fridayComplete, VOCAB
} from './voyager.js';
import { Slider, Seg, Tile, Gauge, Check, Vocab, BadgeLine, ModelNote, useDing } from './ToolBits.jsx';
import { playToolSound } from './sound.js';

const TONE = 'sky';
const badge = (id) => BADGES.find((b) => b.id === id);

/** Both shell and bay tools need each other's numbers for the CAD shell badge, so each gets the other's saved state. */
export function ToolFor({ id, data, save, peek }) {
  if (id === 'shell-checker') return <ShellChecker data={data} save={save} bayData={peek?.('solar-bay')} />;
  if (id === 'solar-bay') return <SolarBay data={data} save={save} shellData={peek?.('shell-checker')} />;
  if (id === 'role-log') return <RoleLog data={data} save={save} />;
  return null;
}

/* ---------------------------------------------------------- Shell checker */

function ShellChecker({ data, save, bayData }) {
  const s = cleanShell(data);
  const r = shellReport(s);
  const ready = sliceReady(s);
  const done = !!data && !!bayData && cadShellDone(s, cleanBay(bayData));
  useDing(ready);
  const set = (p) => save({ ...s, ...p });

  return (
    <div className="pt-tool" data-tone={TONE}>
      <Vocab terms={VOCAB} />
      <div className="pt-split">
        <div className="pt-stack">
          <fieldset className="pt-fieldset">
            <legend>1. Shell size from your CAD model</legend>
            <Slider label="Length" value={s.lengthMm} min={100} max={500} step={5} unit=" mm" onChange={(v) => set({ lengthMm: v })} />
            <Slider label="Width" value={s.widthMm} min={60} max={300} step={5} unit=" mm" onChange={(v) => set({ widthMm: v })} />
            <Slider label="Height" value={s.heightMm} min={30} max={200} step={5} unit=" mm" onChange={(v) => set({ heightMm: v })} />
            <Seg label="Printed in how many parts" value={s.parts} onChange={(v) => set({ parts: v })}
                 options={[{ id: 1, label: '1 piece' }, { id: 2, label: '2 parts' }, { id: 3, label: '3 parts' }]} />
          </fieldset>
          <fieldset className="pt-fieldset">
            <legend>2. Slicer settings</legend>
            <Slider label="Wall thickness" value={s.wallMm} min={1} max={5} step={0.1} unit=" mm" band={[WALL.min, WALL.max]} onChange={(v) => set({ wallMm: v })} />
            <p className={r.wall.state === 'ok' ? 'pt-ok' : 'pt-warn'} data-state={r.wall.state}>{r.wall.state === 'ok' ? '✓ ' : ''}{r.wall.text}</p>
            <Slider label="Infill" value={s.infillPct} min={5} max={50} unit="%" band={[INFILL.min, INFILL.max]} onChange={(v) => set({ infillPct: v })} />
            <Seg label="Wall loops" value={s.loops} onChange={(v) => set({ loops: v })} options={[1, 2, 3, 4, 5].map((n) => ({ id: n, label: `${n}` }))} />
            <p className={r.infillOk && r.loopsOk ? 'pt-ok' : 'pt-warn'}>
              {r.infillOk && r.loopsOk ? `✓ ${INFILL.min}–${INFILL.max}% infill and ${WALL_LOOPS} wall loops.` : `The gate asks for ${INFILL.min}–${INFILL.max}% infill and ${WALL_LOOPS} wall loops.`}
            </p>
          </fieldset>
        </div>

        <div className="pt-stack">
          <BedView s={s} r={r} />
          <p className={r.fitsBed ? 'pt-ok' : 'pt-warn'} role="status">
            {r.fitsBed ? `✓ Each part is ${r.partLen} × ${s.widthMm} mm: it fits the ${BED_MM} × ${BED_MM} mm bed.`
              : r.tooWide ? `The shell is ${s.widthMm} mm wide, wider than the ${BED_MM} mm bed. Narrow it or split it down the middle in CAD.`
              : `Each part is ${r.partLen} mm long, too long for the ${BED_MM} mm bed. Split it into ${r.partsNeeded} parts with alignment pins.`}
          </p>
          <div className="pt-tiles">
            <Tile label="Part on the bed" value={`${r.partLen} × ${s.widthMm} mm`} tone={r.fitsBed ? 'ok' : 'bad'} />
            <Tile label="Shell plastic (walls, rough)" value={`${r.plasticG} g`} />
          </div>
          <fieldset className="pt-fieldset">
            <legend>3. Shell details</legend>
            <Check checked={s.grill} onChange={(on) => set({ grill: on })}>Front grill has airflow holes for the motor and ESC</Check>
            <Check checked={s.wheelWells} onChange={(on) => set({ wheelWells: on })}>Wheel wells clear the No-Go Zones at full steering and suspension</Check>
            <Check checked={s.fromCad} onChange={(on) => set({ fromCad: on })}>These numbers come from our real CAD model and slicer</Check>
          </fieldset>
        </div>
      </div>
      <p className={ready ? 'pt-ok' : 'pt-hint'}>{ready ? '✓ Slicing checks pass. Bring this to the Week 6 Gate Design Review.' : 'Fix the amber items before the Week 6 Gate Design Review.'}</p>
      <ModelNote>The plastic estimate counts flat walls only. Your slicer gives the real weight and print time.</ModelNote>
      <BadgeLine badge={badge('badge-voyager-cad-shell')} earned={done} auto>
        Enter your real CAD numbers with {WALL.min}–{WALL.max} mm walls, fit the bed, tick the grill and wheel wells, and set a {TILT.min}°–{TILT.max}° roof in the Solar Bay tool
      </BadgeLine>
      <BadgeLine badge={badge('badge-voyager-gate-review')}>present your sliced shell, wiring diagrams and locked THB Bill of Materials at the gate review.</BadgeLine>
    </div>
  );
}

/** Top view of the print bed with one part on it, drawn to scale. */
function BedView({ s, r }) {
  const view = Math.max(BED_MM + 40, r.partLen + 40, s.widthMm + 40);
  const o = (view - BED_MM) / 2;
  return (
    <figure className="pt-chart">
      <svg viewBox={`0 0 ${view} ${view}`} role="img"
           aria-label={`Print bed ${BED_MM} by ${BED_MM} millimetres with one shell part of ${r.partLen} by ${s.widthMm} millimetres. ${r.fitsBed ? 'It fits.' : 'It does not fit.'}`}>
        <rect x={o} y={o} width={BED_MM} height={BED_MM} rx={6} className="pt-bed" />
        {[1, 2, 3].map((i) => (
          <g key={i}>
            <line x1={o + (BED_MM / 4) * i} y1={o} x2={o + (BED_MM / 4) * i} y2={o + BED_MM} className="pt-grid" />
            <line x1={o} y1={o + (BED_MM / 4) * i} x2={o + BED_MM} y2={o + (BED_MM / 4) * i} className="pt-grid" />
          </g>
        ))}
        <rect x={(view - r.partLen) / 2} y={(view - s.widthMm) / 2} width={r.partLen} height={s.widthMm} rx={8} className={r.fitsBed ? 'pt-part' : 'pt-part is-bad'} />
        <text x={view / 2} y={o - 6} textAnchor="middle" className="pt-axis">{BED_MM} × {BED_MM} mm bed</text>
      </svg>
      <figcaption>One printed part, seen from above. {s.parts > 1 ? `The shell is cut into ${s.parts} parts.` : 'The shell prints in one piece.'}</figcaption>
    </figure>
  );
}

/* --------------------------------------------------------------- Solar bay */

function SolarBay({ data, save, shellData }) {
  const b = cleanBay(data);
  const r = bayReport(b);
  const done = !!data && !!shellData && cadShellDone(cleanShell(shellData), b);
  useDing(r.tiltOk && r.clearanceOk);
  const set = (p) => save({ ...b, ...p });
  const dim = (group, key, v) => set({ [group]: { ...b[group], [key]: v } });
  const side = { length: 'front and back', width: 'left and right', top: 'above the truck' };

  return (
    <div className="pt-tool" data-tone={TONE}>
      <Vocab terms={VOCAB} />
      <div className="pt-split">
        <div className="pt-stack">
          <BayView b={b} r={r} />
          <Slider label="Sun height in the sky" value={b.sunAltitude} min={10} max={90} unit="°" onChange={(v) => set({ sunAltitude: v })}
                  hint="90° is straight overhead. In the tropics the midday sun sits high." />
          <Slider label="Roof tilt" value={b.tiltDeg} min={0} max={60} unit="°" band={[TILT.min, TILT.max]} onChange={(v) => set({ tiltDeg: v })} />
          <Gauge label="Sunlight the panel catches" value={r.catchPct} state={r.catchPct >= 90 ? 'ok' : 'warn'} />
          <p className={r.tiltOk ? 'pt-ok' : 'pt-warn'}>
            {r.tiltOk ? `✓ ${b.tiltDeg}° is inside the ${TILT.min}°–${TILT.max}° roof range.` : `The roof should sit between ${TILT.min}° and ${TILT.max}°.`}
            {' '}For this sun the most direct tilt would be {r.bestTilt}°.
          </p>
        </div>
        <div className="pt-stack">
          <fieldset className="pt-fieldset">
            <legend>Truck with its shell (mm)</legend>
            <Slider label="Length" value={b.truck.l} min={100} max={500} step={5} unit=" mm" onChange={(v) => dim('truck', 'l', v)} />
            <Slider label="Width" value={b.truck.w} min={60} max={300} step={5} unit=" mm" onChange={(v) => dim('truck', 'w', v)} />
            <Slider label="Height" value={b.truck.h} min={40} max={250} step={5} unit=" mm" onChange={(v) => dim('truck', 'h', v)} />
          </fieldset>
          <fieldset className="pt-fieldset">
            <legend>Inside of the charging bay (mm)</legend>
            <Slider label="Length" value={b.bay.l} min={150} max={800} step={5} unit=" mm" onChange={(v) => dim('bay', 'l', v)} />
            <Slider label="Width" value={b.bay.w} min={100} max={600} step={5} unit=" mm" onChange={(v) => dim('bay', 'w', v)} />
            <Slider label="Lowest roof height" value={b.bay.h} min={60} max={450} step={5} unit=" mm" onChange={(v) => dim('bay', 'h', v)} />
          </fieldset>
          <div className="pt-tiles pt-tiles-3">
            {Object.entries(r.gaps).map(([k, g]) => (
              <Tile key={k} label={`Gap ${side[k]}`} value={`${Math.round(g) / 10} cm`} tone={g >= CLEARANCE_MM ? 'ok' : 'bad'} />
            ))}
          </div>
          <p className={r.clearanceOk ? 'pt-ok' : 'pt-warn'} role="status">
            {r.clearanceOk ? '✓ At least 5 cm of clearance on every side.' : `Not enough space ${r.short.map((k) => side[k]).join(' and ')}. The bay needs +5 cm on all sides.`}
          </p>
        </div>
      </div>
      <ModelNote>The sunlight figure is geometry only (how square the panel faces the sun). Test real tilts with the multimeter in week 11.</ModelNote>
      <BadgeLine badge={badge('badge-voyager-cad-shell')} earned={done} auto>
        Keep the roof at {TILT.min}°–{TILT.max}° here and finish the checks in the 3D Shell tool
      </BadgeLine>
      <BadgeLine badge={badge('badge-voyager-track-solar')}>complete the first drive and first solar charge tests, then tune the roof tilt on the real bay.</BadgeLine>
    </div>
  );
}

/** Side view: the sun's rays, the tilted roof and the truck inside the bay. */
function BayView({ b, r }) {
  const tilt = (b.tiltDeg * Math.PI) / 180;
  const sun = (b.sunAltitude * Math.PI) / 180;
  const x0 = 70; const x1 = 250; const base = 170; const roofY = 78;
  const rise = Math.tan(tilt) * (x1 - x0);
  const sx = 160 + Math.cos(sun) * 150; const sy = roofY - rise / 2 - Math.sin(sun) * 150;
  return (
    <figure className="pt-chart">
      <svg viewBox="0 0 320 190" role="img"
           aria-label={`Side view of the solar bay. Sun at ${b.sunAltitude} degrees, roof tilted ${b.tiltDeg} degrees, catching ${r.catchPct} percent of full sunlight.`}>
        <line x1="10" y1={base} x2="310" y2={base} className="pt-grid" />
        <line x1={x0} y1={base} x2={x0} y2={roofY} className="pt-bay-post" /><line x1={x1} y1={base} x2={x1} y2={roofY - rise} className="pt-bay-post" />
        <line x1={x0 - 8} y1={roofY + 4} x2={x1 + 8} y2={roofY - rise - 4} className={r.tiltOk ? 'pt-bay-roof' : 'pt-bay-roof is-bad'} />
        <line x1={Math.max(8, Math.min(312, sx))} y1={Math.max(8, sy)} x2={160} y2={roofY - rise / 2} className="pt-sunray" />
        <circle cx={Math.max(14, Math.min(306, sx))} cy={Math.max(14, sy)} r="10" className="pt-sun" />
        <rect x={110} y={base - 46} width={100} height={34} rx={8} className={r.clearanceOk ? 'pt-part' : 'pt-part is-bad'} />
        <circle cx={130} cy={base - 10} r="10" className="pt-wheel" /><circle cx={190} cy={base - 10} r="10" className="pt-wheel" />
      </svg>
    </figure>
  );
}

/* --------------------------------------------------------------- Role log */

function RoleLog({ data, save }) {
  const d = cleanLog(data);
  const r = logReport(d);
  const role = ROLES.find((x) => x.id === d.role);
  const mine = d.done[d.role];
  const friday = d.fridays[d.week] || { show: '', tell: '', reflect: '' };
  const set = (p) => save({ ...d, ...p });
  const tick = (i, on) => { if (on) playToolSound('pop'); set({ done: { ...d.done, [d.role]: on ? [...mine, i] : mine.filter((x) => x !== i) } }); };
  const setFriday = (patch) => set({ fridays: { ...d.fridays, [d.week]: { ...friday, ...patch } } });

  return (
    <div className="pt-tool" data-tone={TONE}>
      <Vocab terms={VOCAB} />
      <Seg label="Team role" value={d.role} onChange={(id) => set({ role: id })}
           options={ROLES.map((x) => ({ id: x.id, label: `${x.title} ${d.done[x.id].length}/${STAGES.length}` }))} />
      <fieldset className="pt-fieldset">
        <legend>{role.title} · {role.lead}</legend>
        <p className="pt-hint">{role.summary}</p>
        {STAGES.map((st, i) => (
          <Check key={st.key} checked={mine.includes(i)} onChange={(on) => tick(i, on)}>
            <b>{st.label}</b><small>{role.evidence[i]}</small>
          </Check>
        ))}
      </fieldset>
      <Gauge label="Portfolio evidence, all 5 roles" value={(r.evidenceDone / r.evidenceTotal) * 100} text={`${r.evidenceDone} of ${r.evidenceTotal}`} />

      <fieldset className="pt-fieldset">
        <legend>Friday: Show, Tell, Reflect</legend>
        <div className="pt-weeks" role="group" aria-label="Week">
          {Array.from({ length: WEEKS }, (_, i) => i + 1).map((w) => (
            <button key={w} type="button" className="pt-week" aria-pressed={d.week === w} data-done={fridayComplete(d.fridays[w]) || undefined}
                    aria-label={`Week ${w}${fridayComplete(d.fridays[w]) ? ', done' : ''}`} onClick={() => set({ week: w })}>{w}</button>
          ))}
        </div>
        {FRIDAY_PARTS.map((part) => (
          <div key={part.id} className="pt-slot">
            <label className="pt-field"><span>{part.label} · week {d.week}</span>
              <input className="gh-input" value={friday[part.id]} maxLength={120} onChange={(e) => setFriday({ [part.id]: e.target.value })} /></label>
            <div className="pt-chip-row" role="group" aria-label={`Sentence starters for ${part.label}`}>
              {part.starters.map((s) => (
                <button key={s} type="button" className="pt-chip" onClick={() => setFriday({ [part.id]: s.replace('…', '') })}>{s}</button>
              ))}
            </div>
          </div>
        ))}
        <p className="pt-hint">{r.fridays} of {WEEKS} Friday entries complete. Upload your photos in the session&apos;s evidence box.</p>
      </fieldset>
      <BadgeLine badge={badge('badge-voyager-showcase')}>demonstrate the solar truck live on Showcase Day and finish the 12-question reflection.</BadgeLine>
    </div>
  );
}
