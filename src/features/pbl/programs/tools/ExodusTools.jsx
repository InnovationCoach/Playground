import { useEffect, useState } from 'react';
import { Play, Square } from 'lucide-react';
import {
  BADGES, COLONISTS, LIFE_SUPPORT, KCAL_TARGET, O2_TARGET_KG, WATER_USE_L, WATER_TARGET_PCT, cleanEclss, eclssReport,
  CARDS, CARD_SECONDS, GAUGES, cleanCrisis, crisisGauges, crisisReport,
  SIGNERS, SECTIONS, SIGN_SECTION, cleanRulebook, sectionDone, rulebookReport, VOCAB
} from './exodus.js';
import { Slider, Tile, Gauge, Check, Vocab, BadgeLine, ModelNote, useDing, useTicker } from './ToolBits.jsx';
import { playToolSound, beep } from './sound.js';

const TONE = 'navy';
const badge = (id) => BADGES.find((b) => b.id === id);
const n0 = (x) => Math.round(x).toLocaleString();
const fmt = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

export function ToolFor({ id, data, save }) {
  if (id === 'eclss-engine') return <EclssEngine data={data} save={save} />;
  if (id === 'crisis-sim') return <CrisisSim data={data} save={save} />;
  if (id === 'rulebook') return <Rulebook data={data} save={save} />;
  return null;
}

/* --------------------------------------------------- Recycling-loop engine */

function EclssEngine({ data, save }) {
  const e = cleanEclss(data);
  const r = eclssReport(e);
  const set = (p) => save({ ...e, ...p });
  useDing(r.closed);

  return (
    <div className="pt-tool" data-tone={TONE}>
      <Vocab terms={VOCAB} />
      <div className="pt-split">
        <div className="pt-stack">
          <fieldset className="pt-fieldset">
            <legend>Food for {COLONISTS} people</legend>
            <Slider label="Hydroponic farm area" value={e.farmM2} min={0} max={30000} step={250} unit=" m²" onChange={(v) => set({ farmM2: v })} />
            <Slider label="Spirulina tanks (photobioreactor)" value={e.spirulinaL} min={0} max={200000} step={2500} unit=" L" onChange={(v) => set({ spirulinaL: v })} />
          </fieldset>
          <fieldset className="pt-fieldset">
            <legend>Water loop</legend>
            <Slider label="Water cleaned and reused" value={e.recoveryPct} min={80} max={100} step={0.5} unit="%" band={[WATER_TARGET_PCT, 100]} onChange={(v) => set({ recoveryPct: v })} />
            <Slider label="Clean water in the reserve tank" value={e.reserveL} min={0} max={100000} step={1000} unit=" L" onChange={(v) => set({ reserveL: v })} />
          </fieldset>
        </div>

        <div className="pt-stack" aria-live="polite">
          <Gauge label="Food grown each day" value={Math.min(100, r.kcalPct)} text={`${n0(r.kcal)} of ${n0(KCAL_TARGET)} kcal`} state={r.foodOk ? 'ok' : r.kcalPct >= 80 ? 'warn' : 'bad'} target={100} />
          <Gauge label="Oxygen made each day" value={Math.min(100, r.o2Pct)} text={`${n0(r.o2Kg)} of ${n0(O2_TARGET_KG)} kg`} state={r.o2Ok ? 'ok' : r.o2Pct >= 80 ? 'warn' : 'bad'} target={100} />
          <Gauge label="Water recovered" value={(e.recoveryPct - 80) * 5} text={`${e.recoveryPct}%`} state={r.waterOk ? 'ok' : 'warn'} target={(WATER_TARGET_PCT - 80) * 5} />
          <div className="pt-tiles">
            <Tile label="People fully fed" value={`${Math.min(COLONISTS, r.peopleFed)} of ${COLONISTS}`} strong tone={r.foodOk ? 'ok' : 'bad'} />
            <Tile label="Oxygen balance" value={`${r.o2BalanceKg > 0 ? '+' : ''}${n0(r.o2BalanceKg)} kg a day`} tone={r.o2Ok ? 'ok' : 'bad'} />
            <Tile label="Water lost each day" value={`${n0(r.lostL)} L`} />
            <Tile label="Reserve lasts" value={r.reserveDays == null ? 'forever' : `${n0(r.reserveDays)} days`} tone={r.waterOk ? 'ok' : 'warn'} />
          </div>
          <p className={r.closed ? 'pt-ok' : 'pt-warn'} role="status">
            {r.closed ? '✓ The loop closes: everyone is fed, the air is renewed and at least 98% of the water comes back.'
              : [!r.foodOk && `food is ${n0(r.kcalGap)} kcal short`, !r.o2Ok && 'not enough oxygen is made', !r.waterOk && `water recovery is under ${WATER_TARGET_PCT}%`].filter(Boolean).join(' · ')}
          </p>
          <p className="pt-formula">
            {n0(e.farmM2)} m² × {LIFE_SUPPORT.cropKcalPerM2.value} + {n0(e.spirulinaL)} L × {LIFE_SUPPORT.spirulinaKcalPerL.value} = <b>{n0(r.kcal)} kcal</b><br />
            {COLONISTS} people × {LIFE_SUPPORT.waterLPerPerson.value} L = {n0(WATER_USE_L)} L used; {(100 - e.recoveryPct).toFixed(1)}% lost = <b>{n0(r.lostL)} L a day</b>
          </p>
        </div>
      </div>
      <details className="pt-details">
        <summary>Where these numbers come from</summary>
        <ul className="pt-assume">
          {Object.entries(LIFE_SUPPORT).map(([k, a]) => (
            <li key={k}><span className="pt-tagchip" data-tag={a.tag}>{a.tag}</span><b>{a.value} {a.unit}</b><small>{a.note}</small></li>
          ))}
        </ul>
      </details>
      <ModelNote>These are planning figures for your Recycling Loop Map, not measurements. Check them against your own research and say which ones you changed.</ModelNote>
      <BadgeLine badge={badge('badge-eclss-charter-architect')}>draw your Recycling Loop Map and Thai Baht budget, and complete the Rulebook worksheet.</BadgeLine>
    </div>
  );
}

/* ---------------------------------------------------- Space Emergency Game */

function CrisisSim({ data, save }) {
  const d = cleanCrisis(data);
  const r = crisisReport(d);
  const card = CARDS.find((c) => c.id === d.card);
  const state = d.cards[d.card];
  const g = crisisGauges(card, state);
  const [running, setRunning] = useState(false);
  const [elapsed, reset] = useTicker(running, 500);
  const left = Math.max(0, CARD_SECONDS - elapsed);
  useDing(g.solved);
  useEffect(() => { if (running && left <= 0) { setRunning(false); beep(440, 0.5); } }, [running, left]);

  const setCard = (patch) => save({ ...d, cards: { ...d.cards, [d.card]: { ...state, ...patch } } });
  const tick = (i, on) => { if (on) playToolSound('pop'); setCard({ steps: state.steps.map((s, j) => (j === i ? on : s)) }); };
  const tone = (v) => (v >= 90 ? 'ok' : v >= 75 ? 'warn' : 'bad');

  return (
    <div className="pt-tool" data-tone={TONE}>
      <Vocab terms={VOCAB} />
      <div className="pt-cards" role="group" aria-label="Emergency cards">
        {CARDS.map((c) => (
          <button key={c.id} type="button" className="pt-gamecard" aria-pressed={d.card === c.id} data-solved={r.solved.includes(c.id) || undefined}
                  onClick={() => { setRunning(false); reset(); save({ ...d, card: c.id }); }}>
            <b>Card {c.n}</b><span>{c.title}</span>{r.solved.includes(c.id) && <i aria-label="solved">✓</i>}
          </button>
        ))}
      </div>

      <div className="pt-split">
        <article className="pt-stack">
          <span className="pt-tagchip" data-severity={card.severity}>{card.kind} · {card.severity}</span>
          <p className="pt-crisis-story">{card.summary}</p>
          <div className="pt-sprint-bar">
            <span className="pt-clock">{fmt(left)}</span>
            <span className="pb-meter pt-meter" aria-hidden="true"><span style={{ width: `${Math.min(100, (elapsed / CARD_SECONDS) * 100)}%` }} /></span>
            {running
              ? <button type="button" className="gh-btn gh-btn-sm" onClick={() => setRunning(false)}><Square size={14} aria-hidden="true" />Pause</button>
              : <button type="button" className="gh-btn gh-btn-sm gh-btn-primary" onClick={() => { if (left <= 0) reset(); setRunning(true); }}><Play size={15} aria-hidden="true" />15-minute timer</button>}
          </div>
          <ol className="pt-crisis-steps">
            {card.steps.map((q, i) => (
              <li key={i}>
                <Check checked={state.steps[i]} onChange={(on) => tick(i, on)}>{q}</Check>
                <input className="gh-input" value={state.notes[i]} maxLength={140} placeholder="Our answer in a few words (optional)" aria-label={`Card ${card.n}, answer ${i + 1}`}
                       onChange={(e) => setCard({ notes: state.notes.map((n, j) => (j === i ? e.target.value : n)) })} />
              </li>
            ))}
          </ol>
        </article>
        <div className="pt-stack" aria-live="polite">
          {GAUGES.map((x) => <Gauge key={x.id} label={x.label} value={g[x.id]} state={tone(g[x.id])} />)}
          <Tile label="Food shortfall right now" value={`${g.foodDeficitPct}%`} tone={g.foodDeficitPct === 0 ? 'ok' : 'bad'} />
          <p className={g.solved ? 'pt-ok' : 'pt-hint'} role="status">
            {g.solved ? '✓ Emergency solved. Now upgrade your model and drawings to match.' : `${g.answered} of 3 answered. Point to your model and drawings, then tick each one.`}
          </p>
          <Gauge label="Cards solved" value={(r.solvedCount / r.total) * 100} text={`${r.solvedCount} of ${r.total}`} />
        </div>
      </div>
      <ModelNote>The size of each emergency is on your game cards. Winning back a third per answer is this game&apos;s rule, not a law of physics.</ModelNote>
      <BadgeLine badge={badge('badge-red-team-survivor')}>solve the cards on your physical model and pass the week 10 Rulebook role-play.</BadgeLine>
    </div>
  );
}

/* ----------------------------------------------------- Rulebook workshop */

function Rulebook({ data, save }) {
  const d = cleanRulebook(data);
  const r = rulebookReport(d);
  useDing(r.complete);
  const setSection = (n, patch) => save({ ...d, sections: { ...d.sections, [n]: { ...d.sections[n], ...patch } } });
  const open = (n) => save({ ...d, open: n });

  return (
    <div className="pt-tool" data-tone={TONE}>
      <Vocab terms={VOCAB} />
      <Gauge label="Rulebook sections complete" value={(r.count / r.total) * 100} text={`${r.count} of ${r.total}`} />
      <ol className="pt-speakers">
        {SECTIONS.map((s) => {
          const cur = d.sections[s.n];
          const isOpen = d.open === s.n;
          return (
            <li key={s.n} className={`pt-speaker${isOpen ? ' is-open' : ''}`}>
              <button type="button" className="pt-speaker-head" aria-expanded={isOpen} onClick={() => open(s.n)}>
                <b>Section {s.n}</b><span>{s.title}</span><small>{sectionDone(cur) ? '✓ done' : 'to do'}</small>
              </button>
              {isOpen && (
                <div className="pt-speaker-body">
                  {!s.sourced && <p className="pt-hint">Check this section&apos;s title against your paper Rulebook Worksheet.</p>}
                  <p className="pt-statement">{s.frame}</p>
                  <div className="pt-options" role="group" aria-label={`Rule for section ${s.n}`}>
                    {s.options.map((o) => (
                      <button key={o.id} type="button" className="pt-option" aria-pressed={cur.choice === o.id}
                              onClick={() => { playToolSound('pop'); setSection(s.n, { choice: cur.choice === o.id ? null : o.id }); }}>
                        <b>{o.label}</b>
                      </button>
                    ))}
                  </div>
                  <label className="pt-field"><span>Our rule, in our own words</span>
                    <input className="gh-input" value={cur.text} maxLength={160} placeholder="We agree that …" onChange={(e) => setSection(s.n, { text: e.target.value })} /></label>
                </div>
              )}
            </li>
          );
        })}
        <li className={`pt-speaker${d.open === SIGN_SECTION.n ? ' is-open' : ''}`}>
          <button type="button" className="pt-speaker-head" aria-expanded={d.open === SIGN_SECTION.n} onClick={() => open(SIGN_SECTION.n)}>
            <b>Section {SIGN_SECTION.n}</b><span>{SIGN_SECTION.title}</span><small>{r.allSigned ? '✓ done' : `${r.signed} of ${SIGNERS.length} signed`}</small>
          </button>
          {d.open === SIGN_SECTION.n && (
            <div className="pt-speaker-body pt-grid2">
              {SIGNERS.map((role, i) => (
                <label key={role} className="pt-field"><span>{role} (first name)</span>
                  <input className="gh-input" value={d.signers[i]} maxLength={30} onChange={(e) => save({ ...d, signers: d.signers.map((n, j) => (j === i ? e.target.value : n)) })} /></label>
              ))}
            </div>
          )}
        </li>
      </ol>
      <p className={r.complete ? 'pt-ok' : 'pt-hint'} role="status">
        {r.complete ? '✓ All 7 sections are written and signed by all 4 roles. Test it in the week 10 role-play.' : 'Pick a rule and finish the sentence in each section, then have all 4 roles sign.'}
      </p>
      <BadgeLine badge={badge('badge-eclss-charter-architect')}>hand in this Rulebook with your drawn Recycling Loop Map and Thai Baht budget.</BadgeLine>
    </div>
  );
}
