/**
 * Activity 1 - Townsville Urban Heat Island: City Designer.
 *
 * Replaces the legacy four-slider page in index.html. That page let a learner
 * drag "Green Roofs 20%" and watch one number fall. There was no city in it:
 * nothing about where the heat was, who it hurt, or why a tree in one place
 * beats a tree in another.
 *
 * Here learners choose a district, predict before they see any numbers,
 * then redesign it tile by tile under real constraints (budget, dry-season
 * water, homes for everyone, streets that still connect). They save up to
 * three plans, compare them in normal weather and a heatwave, and pitch one
 * using claim-evidence-reasoning. Stage order follows the NGSS rubric for
 * this activity (steamNgss.js, `phase1`).
 *
 * All the physics is in urbanHeatModel.js. This file only draws it.
 */
import { useMemo, useRef, useState } from 'react';
import {
  COLS, TILE_TYPES, TILE_GROUPS, WEATHER, SOURCES, STRESS_BANDS, MODEL,
  COST_NOTE, WATER_NOTE, DEMOLITION_COST,
  computeHeat, evaluateDesign, explainTile, fairTest, hottestTiles, stressBand,
  countrysideNight, FAIR_TEST_OPTIONS
} from './urbanHeatModel.js';
import { SCENARIOS, scenarioById } from './urbanHeatScenarios.js';
import { useCityDesign, MAX_PLANS } from './useCityDesign.js';
import './urbanHeat.css';

const STAGES = [
  { id: 'choose',  n: 'Step 1', t: 'Choose a district', icon: '🗺️' },
  { id: 'predict', n: 'Step 2', t: 'Predict',           icon: '🤔' },
  { id: 'design',  n: 'Step 3', t: 'Design',            icon: '🏗️' },
  { id: 'compare', n: 'Step 4', t: 'Compare plans',     icon: '⚖️' },
  { id: 'pitch',   n: 'Step 5', t: 'Pitch to council',  icon: '🎤' }
];

const money = (v) => (v === 0 ? '$0' : v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : `$${Math.round(v / 1000)}k`);
const deg = (v) => `${Number(v).toFixed(1)} °C`;
const signed = (v) => `${v > 0 ? '+' : ''}${Number(v).toFixed(1)} °C`;

/** Night colour: how much warmer than the countryside at 3 am. */
function nightColour(excess) {
  if (excess >= 2.5) return '#7f1d1d';
  if (excess >= 1.8) return '#dc2626';
  if (excess >= 1.2) return '#f97316';
  if (excess >= 0.6) return '#facc15';
  return '#22c55e';
}

function Tag({ kind }) {
  return <span className={`uh-tag uh-tag-${kind.toLowerCase()}`}>{kind}</span>;
}

// ---------------------------------------------------------------------------
// The map
// ---------------------------------------------------------------------------

function CityGrid({ grid, heat, view, focus, marks, unreachable, onPaint, onStrokeStart, onInspect, inspected, nightRef }) {
  const painting = useRef(false);
  const focusSet = useMemo(() => new Set(focus), [focus]);
  const markSet = useMemo(() => new Set(marks || []), [marks]);
  const unreachableSet = useMemo(() => new Set(unreachable || []), [unreachable]);

  return (
    <div className="uh-map-wrap">
      <div className="uh-compass" aria-hidden="true"><span>N ↑</span><span className="uh-breeze">🌬️ sea breeze from the north-east ↙</span></div>
      <div
        className="uh-grid"
        style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
        onPointerLeave={() => { painting.current = false; }}
        onPointerUp={() => { painting.current = false; }}
        role="grid"
        aria-label="District map, 8 by 6 blocks"
      >
        {grid.map((code, i) => {
          const t = TILE_TYPES[code];
          const h = heat?.tiles[i];
          let bg = t.color; let label = null;
          if (view === 'day' && h) { bg = stressBand(h.feelsDay).color; label = Math.round(h.feelsDay); }
          if (view === 'night' && h) { bg = nightColour(h.airNight - nightRef); label = `+${Math.max(0, h.airNight - nightRef).toFixed(1)}`; }
          if (view === 'surface' && h) { bg = h.surfaceDay >= 50 ? '#7f1d1d' : h.surfaceDay >= 42 ? '#dc2626' : h.surfaceDay >= 36 ? '#f97316' : h.surfaceDay >= 32 ? '#facc15' : '#22c55e'; label = Math.round(h.surfaceDay); }
          const cls = ['uh-tile'];
          if (focusSet.has(i)) cls.push('is-focus');
          if (markSet.has(i)) cls.push('is-marked');
          if (unreachableSet.has(i)) cls.push('is-cutoff');
          if (inspected === i) cls.push('is-inspected');
          if (view !== 'map') cls.push('is-heat');
          const desc = `${t.label}${h ? `, feels ${deg(h.feelsDay)} at 3 pm` : ''}${focusSet.has(i) ? ', focus area' : ''}${unreachableSet.has(i) ? ', cut off from the streets' : ''}`;
          return (
            <button
              key={i}
              type="button"
              className={cls.join(' ')}
              style={{ background: bg }}
              aria-label={desc}
              title={desc}
              onPointerDown={(e) => { e.preventDefault(); painting.current = true; onStrokeStart?.(); onPaint?.(i); onInspect?.(i); }}
              onPointerEnter={() => { if (painting.current) onPaint?.(i); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStrokeStart?.(); onPaint?.(i); onInspect?.(i); } }}
            >
              <span className="uh-tile-emoji" aria-hidden="true">{t.emoji}</span>
              {label !== null && <span className="uh-tile-num">{label}</span>}
              {unreachableSet.has(i) && <span className="uh-tile-warn" aria-hidden="true">⚠️</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ViewSwitch({ view, setView, allowHeat = true }) {
  const views = [
    { id: 'map', label: '🗺️ Map' },
    { id: 'surface', label: '🌡️ Ground 3 pm' },
    { id: 'day', label: '🧍 Feels-like 3 pm' },
    { id: 'night', label: '🌙 Heat island 3 am' }
  ];
  return (
    <div className="uh-seg" role="tablist" aria-label="Map view">
      {views.map((v) => (
        <button key={v.id} type="button" role="tab" aria-selected={view === v.id}
          className={view === v.id ? 'is-on' : ''} disabled={!allowHeat && v.id !== 'map'}
          onClick={() => setView(v.id)}>{v.label}</button>
      ))}
    </div>
  );
}

function Legend({ view, nightRef }) {
  if (view === 'map') return null;
  if (view === 'night') {
    return (
      <div className="uh-legend">
        <span>3 am, warmer than countryside ({deg(nightRef)}):</span>
        {[[0, '< 0.6'], [0.6, '0.6+'], [1.2, '1.2+'], [1.8, '1.8+'], [2.5, '2.5+']].map(([v, l]) => (
          <span key={l} className="uh-key"><i style={{ background: nightColour(v) }} />{l}</span>
        ))}
      </div>
    );
  }
  if (view === 'surface') {
    return (
      <div className="uh-legend">
        <span>Ground temperature at 3 pm:</span>
        {[['#22c55e', '< 32'], ['#facc15', '32+'], ['#f97316', '36+'], ['#dc2626', '42+'], ['#7f1d1d', '50+']].map(([c, l]) => (
          <span key={l} className="uh-key"><i style={{ background: c }} />{l} °C</span>
        ))}
      </div>
    );
  }
  return (
    <div className="uh-legend">
      <span>Feels-like for someone walking (UTCI bands <Tag kind="DATA" />):</span>
      {[...STRESS_BANDS].reverse().map((b) => (
        <span key={b.id} className="uh-key"><i style={{ background: b.color }} />{b.label}</span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 - choose
// ---------------------------------------------------------------------------

function ChooseStage({ state, set, chooseScenario }) {
  return (
    <section className="uh-card">
      <h3>🗺️ Which part of Townsville will you redesign?</h3>
      <p className="uh-muted">Townsville sits at 19° south, in the dry tropics. Summer afternoons are hot and humid, and the dry season brings water restrictions. Every district has a different problem. Pick the one your team wants to solve - you can come back and try another later.</p>

      <div className="uh-field uh-name">
        <label htmlFor="uh-city-name">Your design team or city name</label>
        <input id="uh-city-name" value={state.cityName} maxLength={40} placeholder="e.g. Team Cool Coast"
          onChange={(e) => set({ cityName: e.target.value })} />
      </div>

      <div className="uh-scenarios">
        {SCENARIOS.map((s) => {
          const base = computeHeat(s.start, 'breeze', s.focus);
          const started = Boolean(state.projects[s.id]);
          return (
            <article key={s.id} className={`uh-scenario ${state.scenarioId === s.id ? 'is-current' : ''}`}>
              <div className="uh-scenario-head">
                <span className="uh-scenario-emoji" aria-hidden="true">{s.emoji}</span>
                <div>
                  <h4>{s.name}</h4>
                  <span className="uh-chip">{s.kind}</span> <span className="uh-chip">{s.difficulty}</span>
                </div>
              </div>
              <p>{s.story}</p>
              <p className="uh-question">❓ {s.question}</p>
              <ul className="uh-facts">
                <li>💰 Budget {money(s.budget)}</li>
                <li>💧 Water limit {s.waterLimitKl} kL/day</li>
                <li>👥 Room for at least {s.minPeople} people</li>
                <li>🎯 Focus: {s.focusLabel}</li>
              </ul>
              <MiniMap grid={s.start} focus={s.focus} />
              <button type="button" className="uh-btn" onClick={() => chooseScenario(s.id)}>
                {started ? `Continue ${s.name} →` : `Redesign ${s.name} →`}
              </button>
              {started && <span className="uh-muted uh-small">Started - your design is saved.</span>}
              <span className="uh-sr">{`Starting focus feels-like ${deg(base.focusFeels)}`}</span>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function MiniMap({ grid, focus = [] }) {
  const f = new Set(focus);
  return (
    <div className="uh-mini" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }} aria-hidden="true">
      {grid.map((code, i) => (
        <span key={i} className={f.has(i) ? 'is-focus' : ''} style={{ background: TILE_TYPES[code].color }} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 - predict, then a fair test
// ---------------------------------------------------------------------------

function PredictStage({ scenario, project, patchProject, goTo }) {
  const pred = project.prediction;
  const [view, setView] = useState('map');
  const heat = useMemo(() => computeHeat(scenario.start, 'breeze', scenario.focus), [scenario]);
  const actualHot = useMemo(() => hottestTiles(scenario.start, 3), [scenario]);
  const tests = useMemo(() => fairTest(scenario), [scenario]);
  const nightRef = countrysideNight('breeze');

  const toggleTile = (i) => {
    if (pred.locked) return;
    const has = pred.hotTiles.includes(i);
    const next = has ? pred.hotTiles.filter((x) => x !== i) : [...pred.hotTiles, i].slice(-3);
    patchProject((p) => ({ ...p, prediction: { ...p.prediction, hotTiles: next } }));
  };
  const setPred = (k, v) => patchProject((p) => ({ ...p, prediction: { ...p.prediction, [k]: v } }));
  const ready = pred.hotTiles.length === 3 && pred.bestStrategy && pred.strongerAt;
  const hits = pred.hotTiles.filter((i) => actualHot.includes(i)).length;
  const best = tests[0];

  return (
    <section className="uh-card">
      <h3>🤔 Predict before you measure</h3>
      <p className="uh-muted">Scientists write down what they expect <em>before</em> they test it. No numbers yet - use what you know about sun, shade, colour and water.</p>

      <div className="uh-two">
        <div>
          <CityGrid grid={scenario.start} heat={pred.locked ? heat : null} view={pred.locked ? view : 'map'}
            focus={scenario.focus} marks={pred.hotTiles} onPaint={toggleTile} nightRef={nightRef} />
          {pred.locked && <><ViewSwitch view={view} setView={setView} /><Legend view={view} nightRef={nightRef} /></>}
          <p className="uh-muted uh-small">Dashed outline = {scenario.focusLabel}. {pred.locked ? 'Your guesses have a ★.' : 'Tap 3 blocks.'}</p>
        </div>

        <div className="uh-predict-qs">
          <div className="uh-q">
            <strong>1. Tap the 3 blocks you think feel hottest to a person at 3 pm.</strong>
            <span className="uh-muted"> ({pred.hotTiles.length}/3 chosen)</span>
          </div>
          <fieldset className="uh-q" disabled={pred.locked}>
            <legend><strong>2. If you could change only {scenario.focusLabel}, which would cool people there most?</strong></legend>
            {FAIR_TEST_OPTIONS.map((o) => (
              <label key={o.id} className={`uh-radio ${pred.bestStrategy === o.id ? 'is-picked' : ''}`}>
                <input type="radio" name="uh-best" checked={pred.bestStrategy === o.id} onChange={() => setPred('bestStrategy', o.id)} /> {o.label}
                {pred.locked && pred.bestStrategy === o.id && <em> ← your prediction</em>}
              </label>
            ))}
          </fieldset>
          <fieldset className="uh-q" disabled={pred.locked}>
            <legend><strong>3. When is the city warmest compared with the countryside around it?</strong></legend>
            {[['day', '☀️ 3 pm, in the afternoon sun'], ['night', '🌙 3 am, in the middle of the night']].map(([id, text]) => (
              <label key={id} className={`uh-radio ${pred.strongerAt === id ? 'is-picked' : ''}`}>
                <input type="radio" name="uh-when" checked={pred.strongerAt === id} onChange={() => setPred('strongerAt', id)} /> {text}
                {pred.locked && pred.strongerAt === id && <em> ← your prediction</em>}
              </label>
            ))}
          </fieldset>
          {!pred.locked && (
            <button type="button" className="uh-btn" disabled={!ready} onClick={() => setPred('locked', true)}>
              🔒 Lock in my predictions and run the model
            </button>
          )}
        </div>
      </div>

      {pred.locked && (
        <div className="uh-reveal">
          <h4>📊 What the model says</h4>
          <div className="uh-reveal-grid">
            <div className="uh-reveal-box">
              <strong>Hottest blocks</strong>
              <p>You found <b>{hits} of 3</b>. The hottest were: {actualHot.map((i) => `${TILE_TYPES[scenario.start[i]].short} (${deg(heat.tiles[i].feelsDay)})`).join(', ')}.</p>
              <p className="uh-muted uh-small">Switch the map to “Ground 3 pm” and “Feels-like 3 pm”. Which colours match dark, unshaded surfaces?</p>
            </div>
            <div className="uh-reveal-box">
              <strong>Fair test: change only the focus area</strong>
              <table className="uh-table">
                <thead><tr><th>Change</th><th>Feels-like there</th></tr></thead>
                <tbody>
                  {tests.map((t) => (
                    <tr key={t.id} className={t.id === pred.bestStrategy ? 'is-mine' : ''}>
                      <td>{t.label}{t.id === pred.bestStrategy ? ' (your pick)' : ''}</td>
                      <td>{signed(t.change)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="uh-small">{best.id === pred.bestStrategy ? '✅ Your prediction matched the test.' : `The model's winner was ${best.label.toLowerCase()}.`} Shade blocks the sun hitting your body. A light-coloured surface cools the <em>ground</em> a lot, but you still stand in full sun - so it does little for how hot a person feels.</p>
            </div>
            <div className="uh-reveal-box">
              <strong>Day or night?</strong>
              <p>3 pm: the district's air is {signed(heat.dayIsland)} compared with countryside. 3 am: {signed(heat.nightIsland)}.</p>
              <p className="uh-small">{pred.strongerAt === 'night' ? '✅ Right - ' : '🔁 Surprising? '}Concrete, asphalt and buildings soak up heat all day and release it all night, while open countryside cools quickly under a clear sky. That is why heatwaves are dangerous at night: bodies never get a chance to cool down.</p>
            </div>
          </div>
          <button type="button" className="uh-btn" onClick={() => goTo('design')}>Start designing →</button>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Step 3 - design
// ---------------------------------------------------------------------------

function Palette({ tool, setTool }) {
  return (
    <div className="uh-palette" aria-label="Tiles to build">
      {TILE_GROUPS.map((g) => (
        <div key={g.id} className="uh-palette-group">
          <span className="uh-palette-head">{g.label}</span>
          {Object.values(TILE_TYPES).filter((t) => t.group === g.id).map((t) => (
            <button key={t.id} type="button" className={`uh-tool ${tool === t.id ? 'is-on' : ''}`}
              aria-pressed={tool === t.id} onClick={() => setTool(t.id)} title={t.tip}>
              <i style={{ background: t.color }} aria-hidden="true">{t.emoji}</i>
              <span>{t.short}</span>
              <small>{t.cost ? money(t.cost) : 'free'}{t.waterKl ? ` · ${t.waterKl} kL` : ''}</small>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function Meter({ label, value, max, fmt, okWhenBelow = true, hint }) {
  const pct = Math.min(100, (value / max) * 100);
  const ok = okWhenBelow ? value <= max : value >= max;
  return (
    <div className={`uh-meter ${ok ? '' : 'is-over'}`}>
      <div className="uh-meter-top"><span>{label}</span><b>{fmt(value)} / {fmt(max)}</b></div>
      <div className="uh-meter-bar"><i style={{ width: `${pct}%` }} /></div>
      {!ok && hint && <span className="uh-meter-hint">{hint}</span>}
    </div>
  );
}

function Readout({ evaln, scenario }) {
  const { heat, budget, checks, goals, stars, change, unreachable } = evaln;
  return (
    <div className="uh-readout">
      <div className="uh-stars" aria-label={`${stars} of 3 stars`}>
        {[0, 1, 2].map((i) => <span key={i} className={i < stars ? 'is-on' : ''}>★</span>)}
        <span className="uh-small uh-muted">{evaln.rulesMet ? 'Rules met' : 'Fix the red rules to earn stars'}</span>
      </div>
      <div className="uh-kpis">
        <div><span>Focus feels-like</span><b>{deg(heat.focusFeels)}</b><em className={change.focusFeels < 0 ? 'good' : ''}>{signed(change.focusFeels)}</em></div>
        <div><span>3 am heat island</span><b>{signed(heat.nightIsland)}</b><em className={change.nightIsland < 0 ? 'good' : ''}>{signed(change.nightIsland)}</em></div>
        <div><span>District feels-like</span><b>{deg(heat.districtFeels)}</b><em className={change.districtFeels < 0 ? 'good' : ''}>{signed(change.districtFeels)}</em></div>
      </div>
      <Meter label="💰 Spent" value={budget.cost} max={scenario.budget} fmt={money} hint="Over budget - choose cheaper options or fewer blocks." />
      <Meter label="💧 Dry-season water" value={budget.waterKl} max={scenario.waterLimitKl} fmt={(v) => `${v} kL`} hint="Over the water limit - shade sails and cool roofs need no water." />
      <Meter label="👥 People housed" value={budget.people} max={scenario.minPeople} fmt={(v) => `${v}`} okWhenBelow={false} hint="Not enough homes and workplaces." />
      <div className={`uh-rule ${checks.access ? '' : 'is-over'}`}>
        {checks.access ? '🛣️ Every building can be reached from the streets.' : `⚠️ ${unreachable.length} building${unreachable.length > 1 ? 's are' : ' is'} cut off. Keep a road, plaza or tree-lined street next to it.`}
      </div>
      <ul className="uh-goals">
        {goals.map((g) => (
          <li key={g.id} className={g.met ? 'is-met' : ''}>
            <span>{g.met ? '✅' : '⬜'}</span> {g.label} <b>(now {g.metric === 'nightIsland' ? signed(g.value) : deg(g.value)})</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Inspector({ code, index, heat, nightRef, weatherId, startCode }) {
  if (index === null || index === undefined) {
    return <div className="uh-inspector uh-muted">Tap any block to see why it is hot or cool.</div>;
  }
  const t = TILE_TYPES[code]; const h = heat.tiles[index];
  return (
    <div className="uh-inspector">
      <strong>{t.emoji} {t.label}</strong>
      {startCode !== code && <span className="uh-chip">was {TILE_TYPES[startCode].short}</span>}
      <p className="uh-small">{t.tip}</p>
      <ul className="uh-small">
        {explainTile(code, weatherId).map((l) => <li key={l}>{l}</li>)}
      </ul>
      <p className="uh-small">Feels-like at 3 pm: <b>{deg(h.feelsDay)}</b> ({stressBand(h.feelsDay).label.toLowerCase()}). At 3 am: <b>{signed(h.airNight - nightRef)}</b> vs countryside.</p>
    </div>
  );
}

function DesignStage({ scenario, project, patchProject, goTo, resetProject }) {
  const [tool, setTool] = useState('E');
  const [view, setView] = useState('map');
  const [weatherId, setWeatherId] = useState('breeze');
  const [inspected, setInspected] = useState(null);
  const [planName, setPlanName] = useState('');
  const [history, setHistory] = useState([]);
  const [showModel, setShowModel] = useState(false);
  const grid = project.grid;

  const evaln = useMemo(() => evaluateDesign(grid, scenario, weatherId), [grid, scenario, weatherId]);
  const nightRef = countrysideNight(weatherId);

  // One tap or one drag is one undo step.
  const startStroke = () => setHistory((h) => [...h.slice(-30), grid]);
  const paint = (i) => {
    patchProject((p) => {
      if (p.grid[i] === tool) return p;
      const next = [...p.grid]; next[i] = tool;
      return { ...p, grid: next };
    });
  };
  const undo = () => {
    const prev = history[history.length - 1];
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    patchProject({ ...project, grid: prev });
  };
  const restart = () => {
    setHistory((h) => [...h.slice(-30), grid]);
    patchProject({ ...project, grid: [...scenario.start] });
  };
  const savePlan = () => {
    const name = planName.trim() || `Plan ${String.fromCharCode(65 + project.plans.length)}`;
    const breeze = evaluateDesign(grid, scenario, 'breeze');
    const plan = {
      id: `plan-${Date.now()}`,
      name,
      grid: [...grid],
      createdAt: Date.now(),
      summary: {
        focusFeels: breeze.heat.focusFeels,
        nightIsland: breeze.heat.nightIsland,
        districtFeels: breeze.heat.districtFeels,
        cost: breeze.budget.cost,
        waterKl: breeze.budget.waterKl,
        people: breeze.budget.people,
        stars: breeze.stars,
        rulesMet: breeze.rulesMet
      }
    };
    patchProject((p) => ({ ...p, plans: [...p.plans, plan].slice(-MAX_PLANS) }));
    setPlanName('');
  };

  return (
    <section className="uh-card">
      <div className="uh-design-head">
        <div>
          <h3>🏗️ Redesign {scenario.name}</h3>
          <p className="uh-muted uh-small">Pick a tile, then tap or drag across the map. Each block is 50 m × 50 m. Try it, look at the heat map, change your mind - that is engineering.</p>
        </div>
        <div className="uh-seg" role="tablist" aria-label="Weather">
          {Object.values(WEATHER).map((w) => (
            <button key={w.id} type="button" role="tab" aria-selected={weatherId === w.id}
              className={weatherId === w.id ? 'is-on' : ''} onClick={() => setWeatherId(w.id)}>{w.emoji} {w.label}</button>
          ))}
        </div>
      </div>
      {weatherId === 'heatwave' && <p className="uh-note">🔥 Heatwave stress test. Stars are always scored on a normal summer day, but a good plan should still protect people now. {WEATHER.heatwave.note}</p>}

      <div className="uh-design">
        <Palette tool={tool} setTool={setTool} />

        <div className="uh-design-map">
          <ViewSwitch view={view} setView={setView} />
          <CityGrid grid={grid} heat={evaln.heat} view={view} focus={scenario.focus}
            unreachable={evaln.unreachable} onPaint={paint} onStrokeStart={startStroke} onInspect={setInspected}
            inspected={inspected} nightRef={nightRef} />
          <Legend view={view} nightRef={nightRef} />
          <div className="uh-row">
            <button type="button" className="uh-btn-ghost" onClick={undo} disabled={!history.length}>↶ Undo</button>
            <button type="button" className="uh-btn-ghost" onClick={restart}>⟲ Back to the original map</button>
            <button type="button" className="uh-btn-ghost" onClick={() => setShowModel((v) => !v)}>{showModel ? 'Hide' : '🔬 How'} the model works</button>
          </div>
          {showModel && <HowItWorks />}
          <Inspector code={inspected !== null ? grid[inspected] : null} index={inspected} heat={evaln.heat}
            nightRef={nightRef} weatherId={weatherId} startCode={inspected !== null ? scenario.start[inspected] : null} />
        </div>

        <div className="uh-design-side">
          <Readout evaln={evaln} scenario={scenario} />
          <div className="uh-save">
            <strong>💾 Save this as a plan ({project.plans.length}/{MAX_PLANS})</strong>
            <p className="uh-small uh-muted">Engineers compare options. Save at least two different plans, then compare them.</p>
            <div className="uh-row">
              <input value={planName} maxLength={30} placeholder={`Plan ${String.fromCharCode(65 + Math.min(project.plans.length, MAX_PLANS - 1))}`}
                onChange={(e) => setPlanName(e.target.value)} aria-label="Plan name" />
              <button type="button" className="uh-btn" onClick={savePlan}>Save plan</button>
            </div>
            {project.plans.length >= MAX_PLANS && <span className="uh-small uh-muted">Saving another replaces your oldest plan.</span>}
            <button type="button" className="uh-btn-ghost" disabled={project.plans.length < 2} onClick={() => goTo('compare')}>Compare my plans →</button>
          </div>
          <button type="button" className="uh-link" onClick={() => { if (window.confirm('Start this district again? Your map, plans, predictions and pitch will be cleared.')) resetProject(); }}>Start this district again</button>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <div className="uh-model">
      <p><b>This is a teaching model, not a weather forecast.</b> It turns four real ideas into simple maths so you can test them. Every number has a tag: <Tag kind="DATA" /> a published figure, <Tag kind="ESTIMATE" /> a round number chosen for the model, <Tag kind="ASSUMPTION" /> a simplification.</p>
      <ol className="uh-small">
        <li><b>Colour (albedo)</b> <Tag kind="DATA" /> - dark asphalt reflects about 5-10% of sunlight, a white roof 60-80%. Ground heating = {MODEL.solar} °C × (share absorbed) × (share of sun reaching the ground) <Tag kind="ESTIMATE" />.</li>
        <li><b>Shade</b> <Tag kind="ESTIMATE" /> - a full canopy blocks {Math.round(MODEL.shadeBlock * 100)}% of direct sun. A person in full sun feels about {MODEL.radiantSun} °C hotter than in shade.</li>
        <li><b>Evaporation</b> <Tag kind="ESTIMATE" /> - fully watered plants remove up to {MODEL.evap} °C of ground heating, because the sun's energy goes into turning water into vapour.</li>
        <li><b>Heat storage</b> <Tag kind="ESTIMATE" /> - concrete, asphalt and towers give back heat at night; tall buildings also trap it between them.</li>
        <li><b>Wind</b> <Tag kind="ESTIMATE" /> - each block mixes with its neighbours, and on a sea-breeze day with the block up-wind (north-east). Wind on your skin cools you {MODEL.windCool} °C per m/s.</li>
      </ol>
      <p className="uh-small"><b>Weather:</b> {WEATHER.breeze.note} <Tag kind={WEATHER.breeze.tag} /> {WEATHER.heatwave.note} <Tag kind={WEATHER.heatwave.tag} /></p>
      <p className="uh-small"><b>Money:</b> {COST_NOTE} <Tag kind="ESTIMATE" /></p>
      <p className="uh-small"><b>Water:</b> {WATER_NOTE} <Tag kind="ESTIMATE" /></p>
      <p className="uh-small"><b>Check it yourself:</b></p>
      <ul className="uh-small uh-sources">
        {Object.values(SOURCES).map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></li>)}
      </ul>
      <p className="uh-small uh-muted">Want to improve the model? Measure real surfaces at school with an infrared thermometer at 3 pm and compare them with the “Ground 3 pm” map.</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4 - compare
// ---------------------------------------------------------------------------

function CompareStage({ scenario, project, patchProject, goTo }) {
  const rows = useMemo(() => project.plans.map((p) => ({
    plan: p,
    breeze: evaluateDesign(p.grid, scenario, 'breeze'),
    heatwave: evaluateDesign(p.grid, scenario, 'heatwave')
  })), [project.plans, scenario]);
  const start = useMemo(() => evaluateDesign(scenario.start, scenario, 'breeze'), [scenario]);

  if (rows.length < 2) {
    return (
      <section className="uh-card">
        <h3>⚖️ Compare plans</h3>
        <p>Save at least two different plans in the Design step first. A good engineer always has a plan B.</p>
        <button type="button" className="uh-btn" onClick={() => goTo('design')}>← Back to design</button>
      </section>
    );
  }

  const removePlan = (id) => patchProject((p) => ({ ...p, plans: p.plans.filter((x) => x.id !== id), finalPlanId: p.finalPlanId === id ? '' : p.finalPlanId }));
  const load = (plan) => { patchProject((p) => ({ ...p, grid: [...plan.grid] })); goTo('design'); };
  const choose = (id) => patchProject({ ...project, finalPlanId: id });

  const metric = (label, fn, better = 'low') => {
    const vals = rows.map((r) => fn(r, false));
    const bestVal = better === 'low' ? Math.min(...vals) : Math.max(...vals);
    return (
      <tr>
        <th scope="row">{label}</th>
        <td className="uh-muted">{fnFormat(label, fn(start, true))}</td>
        {vals.map((v, i) => <td key={rows[i].plan.id} className={v === bestVal ? 'is-best' : ''}>{fnFormat(label, v)}</td>)}
      </tr>
    );
  };

  return (
    <section className="uh-card">
      <h3>⚖️ Compare your plans</h3>
      <p className="uh-muted">Green = best of your plans on that row. No plan wins every row - that is the point. Decide which trade-off you can defend.</p>
      <div className="uh-compare-maps">
        <div><span className="uh-small uh-muted">Original</span><MiniMap grid={scenario.start} focus={scenario.focus} /></div>
        {rows.map(({ plan }) => <div key={plan.id}><span className="uh-small"><b>{plan.name}</b></span><MiniMap grid={plan.grid} focus={scenario.focus} /></div>)}
      </div>
      <div className="uh-table-wrap">
        <table className="uh-table uh-compare">
          <thead>
            <tr><th />{['Original', ...rows.map((r) => r.plan.name)].map((n) => <th key={n} scope="col">{n}</th>)}</tr>
          </thead>
          <tbody>
            {metric('Stars', (r, s) => (s ? r.stars : r.breeze.stars), 'high')}
            {metric('Focus feels-like (3 pm)', (r, s) => (s ? r.heat.focusFeels : r.breeze.heat.focusFeels))}
            {metric('3 am heat island', (r, s) => (s ? r.heat.nightIsland : r.breeze.heat.nightIsland))}
            {metric('District feels-like', (r, s) => (s ? r.heat.districtFeels : r.breeze.heat.districtFeels))}
            {metric('Heatwave: focus feels-like', (r, s) => (s ? evaluateDesign(scenario.start, scenario, 'heatwave').heat.focusFeels : r.heatwave.heat.focusFeels))}
            {metric('Cost', (r, s) => (s ? r.budget.cost : r.breeze.budget.cost))}
            {metric('Water per day', (r, s) => (s ? r.budget.waterKl : r.breeze.budget.waterKl))}
            {metric('People housed', (r, s) => (s ? r.budget.people : r.breeze.budget.people), 'high')}
            <tr>
              <th scope="row">Rules met?</th>
              <td className="uh-muted">{start.rulesMet ? 'yes' : 'no'}</td>
              {rows.map((r) => <td key={r.plan.id}>{r.breeze.rulesMet ? '✅ yes' : `❌ ${Object.entries(r.breeze.checks).filter(([, ok]) => !ok).map(([k]) => k).join(', ')}`}</td>)}
            </tr>
            <tr>
              <th scope="row" />
              <td />
              {rows.map((r) => (
                <td key={r.plan.id}><div className="uh-plan-actions">
                  <button type="button" className={`uh-btn ${project.finalPlanId === r.plan.id ? 'is-chosen' : ''}`} onClick={() => choose(r.plan.id)}>
                    {project.finalPlanId === r.plan.id ? '✓ Chosen' : 'Choose this plan'}
                  </button>
                  <button type="button" className="uh-btn-ghost" onClick={() => load(r.plan)}>Open in designer</button>
                  <button type="button" className="uh-link" onClick={() => removePlan(r.plan.id)}>Delete</button>
                </div></td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <button type="button" className="uh-btn" disabled={!project.finalPlanId} onClick={() => goTo('pitch')}>Pitch the chosen plan →</button>
    </section>
  );
}

function fnFormat(label, v) {
  if (label === 'Stars') return '★'.repeat(v) || '-';
  if (label === 'Cost') return money(v);
  if (label === 'Water per day') return `${v} kL`;
  if (label === 'People housed') return `${v}`;
  if (label === '3 am heat island') return signed(v);
  return deg(v);
}

// ---------------------------------------------------------------------------
// Step 5 - pitch (claim, evidence, reasoning)
// ---------------------------------------------------------------------------

function PitchStage({ scenario, project, patchProject, state, syncState, goTo }) {
  const plan = project.plans.find((p) => p.id === project.finalPlanId);
  const evaln = useMemo(() => (plan ? evaluateDesign(plan.grid, scenario, 'breeze') : null), [plan, scenario]);
  if (!plan || !evaln) {
    return (
      <section className="uh-card">
        <h3>🎤 Pitch to council</h3>
        <p>Choose a plan in the Compare step first.</p>
        <button type="button" className="uh-btn" onClick={() => goTo('compare')}>← Compare plans</button>
      </section>
    );
  }
  const pitch = project.pitch;
  const setPitch = (k, v) => patchProject((p) => ({ ...p, pitch: { ...p.pitch, [k]: v } }));

  const changes = {};
  plan.grid.forEach((c, i) => { if (c !== scenario.start[i]) changes[c] = (changes[c] || 0) + 1; });
  const evidence = [
    `Focus area: ${deg(evaln.baseline.focusFeels)} → ${deg(evaln.heat.focusFeels)} feels-like at 3 pm`,
    `3 am heat island: ${signed(evaln.baseline.nightIsland)} → ${signed(evaln.heat.nightIsland)}`,
    `Cost ${money(evaln.budget.cost)} of ${money(scenario.budget)}, water ${evaln.budget.waterKl} of ${scenario.waterLimitKl} kL/day`,
    `${evaln.budget.people} people housed, ${evaln.budget.demolished} building${evaln.budget.demolished === 1 ? '' : 's'} knocked down`,
    ...Object.entries(changes).map(([c, n]) => `${n} × ${TILE_TYPES[c].label.toLowerCase()}`)
  ];
  const addEvidence = (line) => setPitch('evidence', pitch.evidence ? `${pitch.evidence}\n• ${line}` : `• ${line}`);
  const filled = ['claim', 'evidence', 'reasoning', 'tradeoff'].filter((k) => pitch[k].trim().length >= 15).length;

  return (
    <section className="uh-card">
      <h3>🎤 Pitch “{plan.name}” to Townsville City Council</h3>
      <p className="uh-muted">Councillors are busy. Convince them in four short parts. Use the model's numbers as evidence - and be honest about what your plan gives up.</p>
      <div className="uh-two">
        <div>
          <MiniMap grid={plan.grid} focus={scenario.focus} />
          <div className="uh-stars uh-stars-sm">{[0, 1, 2].map((i) => <span key={i} className={i < evaln.stars ? 'is-on' : ''}>★</span>)}</div>
          <strong className="uh-small">Evidence you can use (tap to add):</strong>
          <ul className="uh-evidence">
            {evidence.map((e) => <li key={e}><button type="button" onClick={() => addEvidence(e)}>＋ {e}</button></li>)}
          </ul>
        </div>
        <div className="uh-pitch">
          <PitchField id="claim" label="1. Claim - what should the council do?" starter="Our plan for {place} will cool… by…" value={pitch.claim} onChange={setPitch} place={scenario.name} />
          <PitchField id="evidence" label="2. Evidence - what did the model show?" starter="The model showed that…" value={pitch.evidence} onChange={setPitch} rows={5} />
          <PitchField id="reasoning" label="3. Reasoning - WHY does it work? Use the science." starter="This works because shade / evaporation / reflecting sunlight…" value={pitch.reasoning} onChange={setPitch} />
          <PitchField id="tradeoff" label="4. Trade-off - what does your plan give up, and why is it worth it?" starter="We chose … instead of … because…" value={pitch.tradeoff} onChange={setPitch} />
          <p className={`uh-saved ${filled === 4 ? 'is-done' : ''}`}>
            {filled === 4 ? '✅ Pitch complete. ' : `${filled}/4 parts written. `}
            {syncState === 'saved' ? 'Saved - your coach can see your plans and pitch.' : syncState === 'local-only' ? 'Saved on this device (no connection to the cloud right now).' : 'Saving…'}
          </p>
          <p className="uh-small uh-muted">Team: {state.cityName || 'not named yet'}.</p>
        </div>
      </div>
    </section>
  );
}

function PitchField({ id, label, starter, value, onChange, rows = 3, place }) {
  return (
    <div className="uh-field">
      <label htmlFor={`uh-pitch-${id}`}>{label}</label>
      <textarea id={`uh-pitch-${id}`} rows={rows} value={value} maxLength={1200}
        placeholder={starter.replace('{place}', place || 'the district')} onChange={(e) => onChange(id, e.target.value)} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// The activity
// ---------------------------------------------------------------------------

export function UrbanHeatDesigner({ uid }) {
  const { state, project, set, chooseScenario, patchProject, resetProject, syncState } = useCityDesign(uid);
  const scenario = scenarioById(state.scenarioId);
  const stage = scenario ? state.stage : 'choose';
  const goTo = (s) => { set({ stage: s }); window.scrollTo?.({ top: 0, behavior: 'smooth' }); };

  const canOpen = (id) => {
    if (id === 'choose') return true;
    if (!scenario) return false;
    if (id === 'predict') return true;
    if (!project.prediction.locked) return false;
    if (id === 'design') return true;
    if (id === 'compare') return project.plans.length >= 2;
    if (id === 'pitch') return Boolean(project.finalPlanId);
    return false;
  };

  return (
    <div className="uh" data-testid="urban-heat-designer">
      <header className="uh-hero">
        <div>
          <h2>🌴 Townsville Urban Heat Island: City Designer</h2>
          <p>Choose a district, predict where the heat hides, then redesign it block by block. Keep everyone housed, stay within budget and water limits, and prove your plan works with evidence.</p>
          {scenario && <p className="uh-hero-current">{scenario.emoji} {scenario.name}{state.cityName ? ` · ${state.cityName}` : ''}</p>}
        </div>
      </header>

      <nav className="uh-stages" aria-label="Activity steps">
        {STAGES.map((s) => (
          <button key={s.id} type="button" className={`uh-stage ${stage === s.id ? 'is-active' : ''}`}
            disabled={!canOpen(s.id)} onClick={() => goTo(s.id)} aria-current={stage === s.id ? 'step' : undefined}>
            <span className="uh-stage-n">{s.icon} {s.n}</span>
            <span className="uh-stage-t">{s.t}</span>
          </button>
        ))}
      </nav>

      {stage === 'choose' && <ChooseStage state={state} set={set} chooseScenario={chooseScenario} />}
      {stage === 'predict' && scenario && <PredictStage scenario={scenario} project={project} patchProject={patchProject} goTo={goTo} />}
      {stage === 'design' && scenario && <DesignStage scenario={scenario} project={project} patchProject={patchProject} goTo={goTo} resetProject={resetProject} />}
      {stage === 'compare' && scenario && <CompareStage scenario={scenario} project={project} patchProject={patchProject} goTo={goTo} />}
      {stage === 'pitch' && scenario && <PitchStage scenario={scenario} project={project} patchProject={patchProject} state={state} syncState={syncState} goTo={goTo} />}

      <footer className="uh-foot uh-small uh-muted">
        Demolishing a building costs {money(DEMOLITION_COST)}. This is a simplified teaching model - see “How the model works” in the Design step for every assumption.
      </footer>
    </div>
  );
}

export default UrbanHeatDesigner;
