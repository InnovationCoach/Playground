import { useEffect, useState } from 'react';
import { Play, Pause, SkipForward, Hand, Flashlight, Moon, BellRing, TriangleAlert, BatteryCharging, RotateCcw } from 'lucide-react';
import {
  BADGES, PINOUTS, SERVOS, TRIM_RANGE, TRIM_TARGET, MOVES, cleanGait, gaitReport, whispererDone,
  MOODS, PET_RULES, ALARM_RULES, cleanPet, petMood, petTick, petAct, petDismiss, alarmDismissedBy,
  cleanPinout, pinoutReport, BENCH_PARTS, BENCH_TARGET, cleanBench, setTrial, benchScore, survivorDone, VOCAB
} from './roboBuddy.js';
import { Slider, Seg, Tile, Gauge, Check, Vocab, BadgeLine, ModelNote, useDing, useTicker, reducedMotion } from './ToolBits.jsx';
import { playToolSound } from './sound.js';

const TONE = 'purple';
const badge = (id) => BADGES.find((b) => b.id === id);

export function ToolFor({ id, data, save }) {
  if (id === 'gait-lab') return <GaitLab data={data} save={save} />;
  if (id === 'pet-brain') return <PetBrain data={data} save={save} />;
  if (id === 'pinout-inspector') return <PinoutInspector data={data} save={save} />;
  if (id === 'benchmark') return <Benchmark data={data} save={save} />;
  return null;
}

/* ---------------------------------------------------------------- Gait lab */

function GaitLab({ data, save }) {
  const d = cleanGait(data);
  const r = gaitReport(d);
  const [running, setRunning] = useState(false);
  const [elapsed, reset] = useTicker(running, 150);
  const [step, setStep] = useState(0);
  const idx = running ? Math.floor(elapsed / 0.9) % r.phases.length : step % r.phases.length;
  const phase = r.phases[idx];
  const done = whispererDone(d);
  useDing(done);
  const set = (p) => save({ ...d, ...p });

  return (
    <div className="pt-tool" data-tone={TONE}>
      <Vocab terms={VOCAB} />
      <fieldset className="pt-fieldset">
        <legend>1. Centre every servo at 90° before the horn goes on</legend>
        <div className="pt-check-grid">
          {SERVOS.map((s) => (
            <Check key={s.id} checked={d.centered.includes(s.id)}
                   onChange={(on) => set({ centered: on ? [...d.centered, s.id] : d.centered.filter((x) => x !== s.id) })}>
              {s.label} at 90°
            </Check>
          ))}
        </div>
      </fieldset>

      <div className="pt-split">
        <fieldset className="pt-fieldset">
          <legend>2. Trim until it stands flat (aim for ±{TRIM_TARGET}°)</legend>
          {SERVOS.map((s) => (
            <Slider key={s.id} label={`${s.label} · ${90 + d.trims[s.id]}°`} value={d.trims[s.id]} min={-TRIM_RANGE} max={TRIM_RANGE} unit="°"
                    band={[-TRIM_TARGET, TRIM_TARGET]} onChange={(v) => set({ trims: { ...d.trims, [s.id]: v } })} />
          ))}
          <Check checked={d.fromRobot} onChange={(on) => set({ fromRobot: on })}>These are the trim numbers from our real robot</Check>
          <p className={r.inTarget ? 'pt-ok' : 'pt-warn'}>
            {r.inTarget ? `✓ All four trims are inside ±${TRIM_TARGET}°.` : `A trim is outside ±${TRIM_TARGET}°. Re-seat that horn instead of trimming more.`}
          </p>
        </fieldset>

        <div className="pt-stack">
          <Seg label="Move" options={MOVES} value={d.move} onChange={(v) => { set({ move: v }); setStep(0); reset(); }} />
          <RobotView trims={d.trims} phase={phase} />
          <div className="pt-balance" data-state={phase.stable ? 'ok' : 'bad'}
               role="img" aria-label={`Weight is ${phase.com > 0.15 ? 'over the right foot' : phase.com < -0.15 ? 'over the left foot' : 'in the middle'}. ${phase.stable ? 'Stable' : 'Tipping'}.`}>
            <span className="pt-balance-foot">L foot</span>
            <span className="pt-balance-track"><i style={{ left: `${50 + phase.com * 46}%` }} /></span>
            <span className="pt-balance-foot">R foot</span>
          </div>
          <p className="pt-hint" aria-live="polite"><b>Step {idx + 1} of {r.phases.length}:</b> {phase.label}. {phase.stable ? 'Stable.' : 'It tips over here!'}</p>
          <div className="pt-actions">
            {!reducedMotion() && (
              <button type="button" className={running ? 'gh-btn gh-btn-sm' : 'gh-btn gh-btn-sm gh-btn-primary'} onClick={() => { setStep(idx); setRunning((v) => !v); }}>
                {running ? <><Pause size={15} aria-hidden="true" />Pause</> : <><Play size={15} aria-hidden="true" />Walk</>}
              </button>
            )}
            <button type="button" className="gh-btn gh-btn-sm" disabled={running} onClick={() => { setStep((n) => n + 1); playToolSound('pop'); }}>
              <SkipForward size={15} aria-hidden="true" />Next step
            </button>
          </div>
          <p className={r.walks ? 'pt-ok' : 'pt-warn'}>{r.walks ? `✓ ${r.move.label}: balanced through all ${r.phases.length} steps.` : `${r.move.label}: it tips in at least one step. Check the foot trims.`}</p>
        </div>
      </div>
      <ModelNote>The balance bar shows the idea of shifting weight before lifting a foot. Your real robot decides Bench Test 1.</ModelNote>
      <BadgeLine badge={badge('badge-rb-90deg-whisperer')} earned={done} auto>
        Tick all 4 servos as centred, enter your real robot&apos;s trims and keep them inside ±{TRIM_TARGET}°
      </BadgeLine>
    </div>
  );
}

/** Front view of the biped: hips swing the legs, ankles tilt the feet. */
function RobotView({ trims, phase }) {
  const tilt = phase.com * 14;
  const leg = (side) => {
    const sign = side === 'L' ? -1 : 1;
    const x = 100 + sign * 26;
    const lifted = phase.lift === side;
    const hipTrim = side === 'L' ? trims.lh : trims.rh;
    const footTrim = side === 'L' ? trims.lf : trims.rf;
    const swing = (lifted ? phase.hip * 10 : 0) + hipTrim;
    return (
      <g transform={`translate(${x} 96) rotate(${swing})`}>
        <rect x={-9} y={0} width={18} height={44} rx={5} className="pt-robo-leg" />
        <g transform={`translate(0 ${lifted ? 40 : 46}) rotate(${footTrim + (lifted ? 0 : tilt * 0.4)})`}>
          <rect x={-22} y={0} width={44} height={11} rx={4} className={lifted ? 'pt-robo-foot is-up' : 'pt-robo-foot'} />
        </g>
      </g>
    );
  };
  return (
    <svg className="pt-robo" viewBox="0 0 200 170" role="img" aria-label="Front view of the walking robot">
      <line x1="20" y1="158" x2="180" y2="158" className="pt-grid" />
      <g transform={`rotate(${tilt * 0.5} 100 150)`}>
        {leg('L')}{leg('R')}
        <rect x={62} y={48} width={76} height={52} rx={10} className="pt-robo-body" />
        <rect x={56} y={8} width={88} height={46} rx={14} className="pt-robo-body" />
        <circle cx={82} cy={30} r={8} className="pt-robo-eye" /><circle cx={118} cy={30} r={8} className="pt-robo-eye" />
        <circle cx={100 + phase.com * 30} cy={74} r={6} className={phase.stable ? 'pt-robo-com' : 'pt-robo-com is-bad'} />
      </g>
    </svg>
  );
}

/* --------------------------------------------------------------- Pet brain */

const NODE_AT = { happy: [150, 34], hungry: [258, 104], sleepy: [216, 208], bored: [84, 208], alarm: [42, 104] };

function PetBrain({ data, save }) {
  const [s, setS] = useState(() => cleanPet(data));
  const [running, setRunning] = useState(false);
  const [touches, setTouches] = useState(0);
  const [distance, setDistance] = useState(60);
  const mood = petMood(s);
  const info = MOODS.find((m) => m.id === mood);
  const commit = (next) => { setS(next); save(next); };

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setS((cur) => {
      const next = petTick(cur, 1);
      if (next.seen.length !== cur.seen.length) save(next);
      return next;
    }), 1000);
    return () => clearInterval(id);
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps

  const how = s.alarm ? alarmDismissedBy({ touches, distanceCm: distance }) : null;
  useEffect(() => {
    if (!how) return;
    playToolSound('ding');
    commit(petDismiss(s, how));
    setTouches(0); setDistance(60);
  }, [how]); // eslint-disable-line react-hooks/exhaustive-deps

  const act = (a) => { playToolSound('pop'); commit(petAct(s, a)); };
  const bar = (v, bad) => (bad ? 'bad' : v);

  return (
    <div className="pt-tool" data-tone={TONE}>
      <Vocab terms={VOCAB} />
      <div className="pt-split">
        <div className="pt-stack">
          <p className="pt-pet-face" aria-live="polite"><span aria-hidden="true">{info.face}</span><b>{info.label}</b><small>{info.rule}</small></p>
          <Gauge label="Hunger" value={s.hunger} target={PET_RULES.hungryAt} state={bar('ok', s.hunger >= PET_RULES.hungryAt)} />
          <Gauge label="Happiness" value={s.happiness} target={PET_RULES.boredAt} state={bar('ok', s.happiness <= PET_RULES.boredAt)} />
          <Gauge label="Energy" value={s.energy} target={PET_RULES.sleepyAt} state={bar('ok', s.energy <= PET_RULES.sleepyAt)} />
          <div className="pt-actions">
            <button type="button" className={running ? 'gh-btn gh-btn-sm' : 'gh-btn gh-btn-sm gh-btn-primary'}
                    onClick={() => { if (running) save(s); setRunning((v) => !v); }}>
              {running ? <><Pause size={15} aria-hidden="true" />Pause time</> : <><Play size={15} aria-hidden="true" />Run time</>}
            </button>
            <button type="button" className="gh-btn gh-btn-sm" onClick={() => act('pet')}><Hand size={15} aria-hidden="true" />Pet head +{PET_RULES.petBoost}</button>
            <button type="button" className="gh-btn gh-btn-sm" onClick={() => act('feed')}><Flashlight size={15} aria-hidden="true" />Flashlight feed −{PET_RULES.feedDrop}</button>
            <button type="button" className="gh-btn gh-btn-sm" onClick={() => act('rest')}><Moon size={15} aria-hidden="true" />Lights off +{PET_RULES.restBoost}</button>
            <button type="button" className="gh-btn gh-btn-sm gh-btn-ghost" onClick={() => { setRunning(false); commit({ ...cleanPet(null), seen: s.seen, dismissed: s.dismissed }); }}>
              <RotateCcw size={15} aria-hidden="true" />Reset stats
            </button>
          </div>
        </div>

        <figure className="pt-states">
          <svg viewBox="0 0 300 250" role="img" aria-label={`State machine with 5 moods. Current mood: ${info.label}.`}>
            {MOODS.filter((m) => m.id !== 'happy').map((m) => (
              <line key={m.id} x1={NODE_AT.happy[0]} y1={NODE_AT.happy[1]} x2={NODE_AT[m.id][0]} y2={NODE_AT[m.id][1]} className={mood === m.id ? 'pt-edge is-on' : 'pt-edge'} />
            ))}
            {MOODS.map((m) => (
              <g key={m.id} transform={`translate(${NODE_AT[m.id][0]} ${NODE_AT[m.id][1]})`}
                 className={`pt-node${mood === m.id ? ' is-now' : ''}${s.seen.includes(m.id) ? ' is-seen' : ''}`}>
                <circle r={30} />
                <text y={-2} textAnchor="middle" className="pt-node-face">{m.face}</text>
                <text y={18} textAnchor="middle" className="pt-node-label">{m.label.replace(' Ringing', '')}</text>
              </g>
            ))}
          </svg>
          <figcaption>{s.seen.length} of 5 moods reached. Every mood goes back to Happy when its need is met.</figcaption>
        </figure>
      </div>

      <section className="pt-qa" aria-label="Smart alarm dismiss tester">
        <div className="pt-qa-head"><strong>Smart alarm dismiss tester</strong>
          <small>Stops after {ALARM_RULES.touches} head touches OR a hand within {ALARM_RULES.waveCm} cm.</small></div>
        {!s.alarm ? (
          <div className="pt-actions">
            <button type="button" className="gh-btn gh-btn-accent" onClick={() => act('ring')}><BellRing size={16} aria-hidden="true" />Ring the alarm</button>
          </div>
        ) : (
          <>
            <p className="pt-warn" role="status">⏰ Alarm ringing! Dismiss it the way your code will.</p>
            <div className="pt-actions">
              <button type="button" className="gh-btn gh-btn-primary" onClick={() => { playToolSound('pop'); setTouches((n) => n + 1); }}>
                <Hand size={16} aria-hidden="true" />Touch head ({touches}/{ALARM_RULES.touches})
              </button>
            </div>
            <Slider label="Hand distance from the ultrasonic eyes" value={distance} min={2} max={200} unit=" cm" onChange={setDistance}
                    hint={`A wave only counts at ${ALARM_RULES.waveCm} cm or closer.`} />
          </>
        )}
        <p className="pt-hint">
          Tested: head touch {s.dismissed.includes('touch') ? '✓' : '–'} · hand wave {s.dismissed.includes('wave') ? '✓' : '–'}
        </p>
      </section>
      <ModelNote>Thresholds are from your week 8 and 9 plan. How fast the bars move here is only for the demo; your timers set the real speed.</ModelNote>
      <BadgeLine badge={badge('badge-rb-tamagotchi-architect')}>show your coded 5-mood state machine reacting to the real touch and light sensors.</BadgeLine>
      <BadgeLine badge={badge('badge-rb-alarm-guardian')}>show the real alarm stopping after 3 head touches or a wave within 15 cm.</BadgeLine>
    </div>
  );
}

/* -------------------------------------------------------- Pinout inspector */

function PinoutInspector({ data, save }) {
  const d = cleanPinout(data);
  const r = pinoutReport(d);
  const v = r.version;
  const wired = d.wired[d.version];
  useDing(r.ready);
  const toggle = (i, on) => save({ ...d, wired: { ...d.wired, [d.version]: on ? [...wired, i] : wired.filter((x) => x !== i) } });

  return (
    <div className="pt-tool" data-tone={TONE}>
      <Vocab terms={VOCAB} />
      <Seg label="Hardware version" value={d.version} onChange={(id) => save({ ...d, version: id })}
           options={PINOUTS.map((p, i) => ({ id: p.versionId, label: `Version ${'AB'[i]} · ${p.boardName}` }))} />
      <div className={d.battery ? 'pt-alert is-ok' : 'pt-alert'} role="note">
        {d.battery ? <BatteryCharging size={20} aria-hidden="true" /> : <TriangleAlert size={20} aria-hidden="true" />}
        <div>
          <strong>4×AA (6 V) battery rail</strong>
          <p>{v.powerRuleWarning}</p>
          <Check checked={d.battery} onChange={(on) => save({ ...d, battery: on })}>Our 4×AA pack is connected and switched on</Check>
        </div>
      </div>
      {r.powerRisk && <p className="pt-warn" role="alert">Servos are wired but the battery rail is not confirmed. Do not move servos on USB power alone.</p>}
      <ul className="pt-pins">
        {v.pins.map((p, i) => (
          <li key={p.component} className={wired.includes(i) ? 'is-on' : ''}>
            <Check checked={wired.includes(i)} onChange={(on) => toggle(i, on)}><b>{p.component}</b></Check>
            <span className="pt-pin-at">{p.pinAssignment}</span>
            <small>{p.wireColorOrNote}</small>
          </li>
        ))}
      </ul>
      <p className={r.ready ? 'pt-ok' : 'pt-hint'} role="status">
        {r.ready ? '✓ Every wire checked and the battery rail is on. Safe to run the 90° centring code.'
          : `${r.wiredCount} of ${r.total} wires checked${d.battery ? '' : ' · battery rail not confirmed'}.`}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------- Scorecard */

const NEXT = { '-': 'p', p: 'f', f: '-' };
const WORD = { '-': 'not run', p: 'pass', f: 'fail' };

function Benchmark({ data, save }) {
  const d = cleanBench(data);
  const r = benchScore(d);
  const done = survivorDone(d);
  useDing(done);
  const tap = (partId, i) => { playToolSound('pop'); save(setTrial(d, partId, i, NEXT[d[partId][i]])); };

  return (
    <div className="pt-tool" data-tone={TONE}>
      <Vocab terms={VOCAB} />
      <p className="pt-hint">Tap a trial once for pass, twice for fail, three times to clear it.</p>
      {r.parts.map((part) => (
        <fieldset key={part.id} className="pt-fieldset">
          <legend>{part.label} · {part.pass}/{part.trials} passed</legend>
          <small className="pt-hint">{part.hint}</small>
          <div className="pt-trials">
            {d[part.id].split('').map((c, i) => (
              <button key={i} type="button" className="pt-trial" data-result={c} onClick={() => tap(part.id, i)}
                      aria-label={`${part.label} trial ${i + 1}: ${WORD[c]}`}>
                {c === 'p' ? '✓' : c === 'f' ? '✗' : i + 1}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
      <div className="pt-tiles pt-tiles-4" aria-live="polite">
        <Tile label="Passed" value={`${r.pass} / ${r.total}`} strong />
        <Tile label="Trials run" value={`${r.run} / ${r.total}`} />
        <Tile label="Pass rate so far" value={r.run ? `${r.ratePct}%` : '–'} />
        <Tile label="Target" value={`${BENCH_TARGET} / ${r.total}`} tone={r.onTarget ? 'ok' : undefined} />
      </div>
      <Gauge label="Passes toward the target" value={(r.pass / r.total) * 100} text={`${r.pass} of ${r.total}`} target={(BENCH_TARGET / r.total) * 100} state={r.onTarget ? 'ok' : 'warn'} />
      <Check checked={d.grips} onChange={(on) => save({ ...d, grips: on })}>We added rubber foot grips for Prototype V2.0</Check>
      <BadgeLine badge={badge('badge-rb-40test-survivor')} earned={done} auto>
        Run all {r.total} trials, pass at least {BENCH_TARGET} and add rubber foot grips
      </BadgeLine>
    </div>
  );
}
