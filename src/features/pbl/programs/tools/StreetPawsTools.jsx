import { useRef, useState } from 'react';
import { Camera, MapPin, X, Heart, Flag, Plus, Trash2, Play, Square, RotateCcw } from 'lucide-react';
import {
  BADGES, PILLARS, SLIDES, FOOD_DEFAULT, foodMath, MAP_SPOTS, INJURIES, sosReport, ANIMALS, cleanApp, pillarsTried, swipe,
  PERSONA_KINDS, STATEMENT_SLOTS, CLICK_LIMIT, CLICK_MAX, cleanPersonas, personaComplete, statementFor, personaReport,
  SCRIPT, BLANKS, PITCH_SECONDS, SPEAKER_SLACK, cleanPitch, pitchReport, VOCAB
} from './streetPaws.js';
import { Slider, Seg, Tile, Gauge, Check, Vocab, BadgeLine, useDing, useTicker } from './ToolBits.jsx';
import { playToolSound } from './sound.js';

const TONE = 'amber';
const badge = (id) => BADGES.find((b) => b.id === id);
const fmt = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
const thb = (n) => `${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })} THB`;

export function ToolFor({ id, data, save }) {
  if (id === 'app-prototype') return <AppPrototype data={data} save={save} />;
  if (id === 'persona-builder') return <PersonaBuilder data={data} save={save} />;
  if (id === 'pitch-script') return <PitchScript data={data} save={save} />;
  return null;
}

/* --------------------------------------------------------- App prototype */

function AppPrototype({ data, save }) {
  const d = cleanApp(data);
  const tried = pillarsTried(d);
  const set = (p) => save({ ...d, ...p });
  const pillar = PILLARS.find((p) => p.id === d.tab);
  useDing(tried.length === PILLARS.length);

  return (
    <div className="pt-tool" data-tone={TONE}>
      <Vocab terms={VOCAB} />
      <div className="pt-phone-wrap">
        <div className="pt-phone" role="group" aria-label="StreetPaws app mock-up">
          <div className="pt-phone-bar"><b>StreetPaws</b><small>{pillar.emoji} {pillar.title}</small></div>
          <div className="pt-phone-screen">
            {d.tab === PILLARS[0].id && <FoodTab food={d.food} set={(food) => set({ food })} />}
            {d.tab === PILLARS[1].id && <MapTab pins={d.pins} set={(pins) => set({ pins })} />}
            {d.tab === PILLARS[2].id && <SosTab sos={d.sos} set={(sos) => set({ sos })} />}
            {d.tab === PILLARS[3].id && <AdoptTab d={d} save={save} />}
          </div>
          <div className="pt-phone-tabs" role="tablist" aria-label="App pillars">
            {PILLARS.map((p) => (
              <button key={p.id} type="button" role="tab" aria-selected={d.tab === p.id} onClick={() => set({ tab: p.id })}>
                <span aria-hidden="true">{p.emoji}</span><small>{p.title.split(' ')[0]}</small>{tried.includes(p.id) && <i aria-label="tried">✓</i>}
              </button>
            ))}
          </div>
        </div>
        <div className="pt-stack">
          <h4 className="pt-h4">Pillar {pillar.n}: {pillar.title}</h4>
          <p className="pt-hint">{pillar.description}</p>
          <Gauge label="Pillars you have tried" value={(tried.length / PILLARS.length) * 100} text={`${tried.length} of ${PILLARS.length}`} />
          <p className="pt-hint">This mock-up is for testing your ideas and your 3-click flows. Your team&apos;s real prototype is built in Canva, Figma or Glide.</p>
          <BadgeLine badge={badge('streetpaws-thb-impact-planner')}>pass the Paper Phone Test on your 6 wireframes and show your THB budget.</BadgeLine>
          <BadgeLine badge={badge('streetpaws-qr-station-maker')}>connect your own 4 clickable features to a physical QR feeding station.</BadgeLine>
        </div>
      </div>
    </div>
  );
}

function FoodTab({ food, set }) {
  const m = foodMath(food);
  const up = (p) => set({ ...food, ...p });
  return (
    <div className="pt-stack">
      <button type="button" className="gh-btn gh-btn-primary pt-big-btn" onClick={() => { playToolSound('pop'); up({ bowls: food.bowls + 1 }); }}>
        🥣 Buy 1 bowl of food · {food.bowlTHB} THB
      </button>
      <p className="pt-hint" aria-live="polite">{food.bowls} bowl{food.bowls === 1 ? '' : 's'} donated = {thb(m.raisedTHB)} = {m.dogDaysFunded} dog-day{m.dogDaysFunded === 1 ? '' : 's'} of food.</p>
      <div className="pt-tiles">
        <Tile label="1 dog, 1 day" value={thb(m.perDogDay)} strong />
        <Tile label="Food per dog per day" value={`${m.gramsPerDogDay} g`} />
        <Tile label="Bowls to buy 1 bag" value={m.bowlsPerBag} />
        <Tile label={`${food.dogs} dogs, 30 days`} value={thb(m.monthlyTHB)} />
      </div>
      <p className="pt-formula">
        {thb(food.bagTHB)} ÷ ({food.dogs} dogs × {food.daysPerBag} days) = <b>{thb(m.perDogDay)}</b> per dog per day<br />
        One {food.bowlTHB} THB bowl pays for <b>{m.dogDaysPerBowl}</b> dog-days ({m.extraPerBowl >= 0 ? `${thb(m.extraPerBowl)} extra` : `${thb(-m.extraPerBowl)} short`}).
      </p>
      <details className="pt-details">
        <summary>Change the numbers</summary>
        <Slider label="Bag price" value={food.bagTHB} min={200} max={2000} step={50} unit=" THB" onChange={(v) => up({ bagTHB: v })} />
        <Slider label="Bag size" value={food.bagKg} min={1} max={30} unit=" kg" onChange={(v) => up({ bagKg: v })} />
        <Slider label="Dogs fed" value={food.dogs} min={1} max={40} onChange={(v) => up({ dogs: v })} />
        <Slider label="Days one bag lasts" value={food.daysPerBag} min={1} max={30} onChange={(v) => up({ daysPerBag: v })} />
        <Slider label="Bowl button price" value={food.bowlTHB} min={5} max={50} unit=" THB" onChange={(v) => up({ bowlTHB: v })} />
        <button type="button" className="gh-btn gh-btn-ghost gh-btn-sm" onClick={() => set({ ...FOOD_DEFAULT })}><RotateCcw size={14} aria-hidden="true" />Back to the week 5 example</button>
      </details>
    </div>
  );
}

function MapTab({ pins, set }) {
  const [sel, setSel] = useState(null);
  const [pledged, setPledged] = useState(null);
  const [drag, setDrag] = useState(null);
  const box = useRef(null);
  const moved = useRef(false);
  const at = (p) => (drag?.id === p.id ? drag : p);
  const spot = (id) => MAP_SPOTS.find((s) => s.id === id);
  const feed = (id, fed) => { playToolSound(fed ? 'ding' : 'pop'); set(pins.map((p) => (p.id === id ? { ...p, fed } : p))); setPledged(null); };

  function onMove(e, p) {
    if (!drag || drag.id !== p.id) return;
    const r = box.current.getBoundingClientRect();
    const x = Math.round(Math.max(4, Math.min(96, ((e.clientX - r.left) / r.width) * 100)));
    const y = Math.round(Math.max(6, Math.min(94, ((e.clientY - r.top) / r.height) * 100)));
    if (Math.abs(x - p.x) + Math.abs(y - p.y) > 2) moved.current = true;
    setDrag({ id: p.id, x, y });
  }
  function onUp(p) {
    if (moved.current && drag) set(pins.map((q) => (q.id === p.id ? { ...q, x: drag.x, y: drag.y } : q)));
    else setSel(p.id);
    setDrag(null); moved.current = false;
  }
  const cur = pins.find((p) => p.id === sel);
  const fed = pins.filter((p) => p.fed).length;

  return (
    <div className="pt-stack">
      <div className="pt-map" ref={box}>
        {pins.map((p) => {
          const pos = at(p);
          return (
            <button key={p.id} type="button" className={`pt-pin${p.fed ? ' is-fed' : ''}${sel === p.id ? ' is-sel' : ''}`} style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    aria-label={`${spot(p.id).label}: ${p.fed ? 'fed today' : 'hungry, not fed today'}`}
                    onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); moved.current = false; setDrag({ id: p.id, x: p.x, y: p.y }); }}
                    onPointerMove={(e) => onMove(e, p)} onPointerUp={() => onUp(p)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel(p.id); } }}>
              <MapPin size={26} aria-hidden="true" />
            </button>
          );
        })}
      </div>
      <p className="pt-hint">{fed} of {pins.length} packs fed today. Tap a pin to feed; drag a pin to move it.</p>
      {cur && (
        <div className="pt-sheet" role="status">
          <strong>{spot(cur.id).label}</strong>
          {cur.fed ? (
            <>
              <p className="pt-ok">📍 Green pin: fed today.</p>
              <button type="button" className="gh-btn gh-btn-ghost gh-btn-sm" onClick={() => feed(cur.id, false)}>New day: back to hungry</button>
            </>
          ) : pledged === cur.id ? (
            <button type="button" className="gh-btn gh-btn-primary gh-btn-sm" onClick={() => feed(cur.id, true)}><Camera size={15} aria-hidden="true" />Food bowl photo added (pretend)</button>
          ) : (
            <>
              <p className="pt-warn">📍 Red pin: hungry pack, not fed today.</p>
              <button type="button" className="gh-btn gh-btn-accent gh-btn-sm" onClick={() => { playToolSound('pop'); setPledged(cur.id); }}>I will feed them</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SosTab({ sos, set }) {
  const r = sosReport(sos);
  const up = (p) => { playToolSound('pop'); set({ ...sos, ...p }); };
  useDing(r.ready);
  return (
    <div className="pt-stack">
      <button type="button" className={sos.photo ? 'pt-sos-btn is-on' : 'pt-sos-btn'} aria-pressed={sos.photo} onClick={() => up({ photo: !sos.photo })}>
        <Camera size={22} aria-hidden="true" />{sos.photo ? 'Photo added (pretend)' : '1. Take photo of sick animal'}
      </button>
      <button type="button" className={sos.location ? 'pt-sos-btn is-on is-alt' : 'pt-sos-btn is-alt'} aria-pressed={sos.location} onClick={() => up({ location: !sos.location })}>
        <MapPin size={22} aria-hidden="true" />{sos.location ? 'Location shared (pretend)' : '2. Share location'}
      </button>
      <div role="group" aria-label="3. Choose the problem" className="pt-injuries">
        {INJURIES.map((i) => (
          <button key={i.id} type="button" aria-pressed={sos.injury === i.id} onClick={() => up({ injury: sos.injury === i.id ? null : i.id })}>
            <span aria-hidden="true">{i.emoji}</span>{i.label}
          </button>
        ))}
      </div>
      <label className="pt-toggle"><input type="checkbox" checked={sos.urgent} onChange={(e) => up({ urgent: e.target.checked })} /><Flag size={14} aria-hidden="true" />Mark as urgent</label>
      <p className={r.ready ? 'pt-ok' : 'pt-hint'} role="status">
        {r.ready ? `✓ SOS sent in 3 clicks · priority: ${r.priority}.` : `${r.clicks} of 3 clicks done.`}
      </p>
      <Gauge label="Vet bill raised" value={r.billPct} text={`${sos.raisedTHB.toLocaleString()} / ${sos.goalTHB.toLocaleString()} THB`} />
      <p className="pt-hint">No real photo or location is taken here. It is a mock-up of the flow.</p>
    </div>
  );
}

function AdoptTab({ d, save }) {
  const start = useRef(null);
  const deck = ANIMALS.filter((a) => (d.filter === 'all' || a.kind === d.filter) && !d.liked.includes(a.id) && !d.passed.includes(a.id));
  const a = deck[0];
  const go = (like) => { playToolSound(like ? 'ding' : 'pop'); save(swipe(d, a.id, like)); };
  return (
    <div className="pt-stack">
      <Seg label="Filter" value={d.filter} onChange={(filter) => save({ ...d, filter })}
           options={[{ id: 'all', label: 'All' }, { id: 'dog', label: '🐶 Dogs' }, { id: 'cat', label: '🐱 Cats' }]} />
      {a ? (
        <>
          <article className="pt-adopt" onPointerDown={(e) => { start.current = e.clientX; }}
                   onPointerUp={(e) => { const dx = e.clientX - (start.current ?? e.clientX); start.current = null; if (Math.abs(dx) > 60) go(dx > 0); }}>
            <span className="pt-adopt-face" aria-hidden="true">{a.kind === 'dog' ? '🐶' : '🐱'}</span>
            <h5>{a.name}</h5>
            <small>{a.age} · {a.where}</small>
            <div className="pt-chip-row">{a.tags.map((t) => <span key={t} className="pt-tagchip">{t}</span>)}</div>
            <small>{a.health}</small>
          </article>
          <div className="pt-actions pt-center">
            <button type="button" className="gh-btn" onClick={() => go(false)}><X size={16} aria-hidden="true" />Pass</button>
            <button type="button" className="gh-btn gh-btn-primary" onClick={() => go(true)}><Heart size={16} aria-hidden="true" />Meet {a.name}</button>
          </div>
          <p className="pt-hint">Swipe right to meet, left to pass, or use the buttons.</p>
        </>
      ) : (
        <>
          <p className="pt-empty">No more profiles here.</p>
          <button type="button" className="gh-btn gh-btn-sm" onClick={() => save({ ...d, passed: [], liked: [] })}><RotateCcw size={14} aria-hidden="true" />Start again</button>
        </>
      )}
      {d.liked.length > 0 && <p className="pt-ok">Meetings asked for: {d.liked.map((id) => ANIMALS.find((x) => x.id === id).name).join(', ')}</p>}
      <p className="pt-hint">Somchai is from your program guide. The others are sample profiles: swap in your real animals.</p>
    </div>
  );
}

/* -------------------------------------------------------- Persona builder */

function PersonaBuilder({ data, save }) {
  const d = cleanPersonas(data);
  const r = personaReport(d);
  const [kind, setKind] = useState(PERSONA_KINDS[0].id);
  const [draft, setDraft] = useState({});
  const k = PERSONA_KINDS.find((x) => x.id === kind);
  const p = d.personas[kind];
  const setP = (patch) => save({ ...d, personas: { ...d.personas, [kind]: { ...p, ...patch } } });
  const setClicks = (id, steps) => save({ ...d, clicks: { ...d.clicks, [id]: steps } });
  useDing(r.done);

  return (
    <div className="pt-tool" data-tone={TONE}>
      <Vocab terms={VOCAB} />
      <Seg label="Persona" value={kind} onChange={setKind}
           options={PERSONA_KINDS.map((x) => ({ id: x.id, label: `${x.emoji} ${x.label}${personaComplete(d.personas[x.id]) ? ' ✓' : ''}` }))} />
      <fieldset className="pt-fieldset">
        <legend>{k.emoji} {k.label}</legend>
        {k.example && !p.name && (
          <button type="button" className="gh-btn gh-btn-ghost gh-btn-sm pt-self-start" onClick={() => setP(k.example)}>Start from the example: {k.example.name}</button>
        )}
        <div className="pt-grid2">
          <label className="pt-field"><span>Name</span>
            <input className="gh-input" value={p.name} maxLength={40} placeholder="e.g. Auntie Mali" onChange={(e) => setP({ name: e.target.value })} /></label>
          <label className="pt-field"><span>Age</span>
            <input className="gh-input" type="number" min="5" max="99" value={p.age ?? ''} onChange={(e) => setP({ age: e.target.value })} /></label>
        </div>
        <label className="pt-field"><span>Goal: what do they want to do?</span>
          <input className="gh-input" value={p.goal} maxLength={140} placeholder="Wants to …" onChange={(e) => setP({ goal: e.target.value })} /></label>
        <label className="pt-field"><span>Problem: what stops them?</span>
          <input className="gh-input" value={p.problem} maxLength={140} placeholder="When …, …" onChange={(e) => setP({ problem: e.target.value })} /></label>
      </fieldset>

      <fieldset className="pt-fieldset">
        <legend>Problem statement</legend>
        {STATEMENT_SLOTS.map((slot) => (
          <div key={slot.id} className="pt-slot">
            <label className="pt-field"><span><b>{p.name || '[User Name]'}</b> … {slot.lead} …</span>
              <input className="gh-input" value={p[slot.id]} maxLength={100} onChange={(e) => setP({ [slot.id]: e.target.value })} /></label>
            <div className="pt-chip-row" role="group" aria-label={`Phrase helpers for "${slot.lead}"`}>
              {slot.helpers.map((h) => (
                <button key={h.en} type="button" className="pt-chip pt-phrase" aria-pressed={p[slot.id] === h.en} onClick={() => { playToolSound('pop'); setP({ [slot.id]: h.en }); }}>
                  {h.en}<small lang="th">{h.th}</small>
                </button>
              ))}
            </div>
          </div>
        ))}
        <p className="pt-statement" aria-live="polite">“{statementFor(p)}”</p>
      </fieldset>

      <fieldset className="pt-fieldset">
        <legend>3-click check: list the taps for each pillar</legend>
        {r.pillars.map((pl) => {
          const steps = d.clicks[pl.id];
          const val = draft[pl.id] || '';
          const add = () => { if (val.trim() && steps.length < CLICK_MAX) { setClicks(pl.id, [...steps, val.trim()]); setDraft({ ...draft, [pl.id]: '' }); } };
          return (
            <div key={pl.id} className="pt-clicks">
              <strong>{pl.emoji} {pl.title} <small className={pl.ok ? 'pt-ok' : steps.length > CLICK_LIMIT ? 'pt-warn' : 'pt-hint'}>
                {steps.length === 0 ? 'no taps yet' : pl.ok ? `✓ ${steps.length} tap${steps.length === 1 ? '' : 's'}` : `${steps.length} taps: too many, cut to ${CLICK_LIMIT}`}</small></strong>
              <ol>{steps.map((s, i) => (
                <li key={i}>{s}
                  <button type="button" className="gh-btn gh-btn-ghost gh-btn-sm pt-icon" aria-label={`Remove tap ${i + 1} from ${pl.title}`}
                          onClick={() => setClicks(pl.id, steps.filter((_, j) => j !== i))}><Trash2 size={13} aria-hidden="true" /></button>
                </li>
              ))}</ol>
              {steps.length < CLICK_MAX && (
                <div className="pt-add-row">
                  <input className="gh-input" value={val} maxLength={50} placeholder={`Tap ${steps.length + 1}: what does the user press?`} aria-label={`Next tap for ${pl.title}`}
                         onChange={(e) => setDraft({ ...draft, [pl.id]: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') add(); }} />
                  <button type="button" className="gh-btn gh-btn-sm" onClick={add}><Plus size={14} aria-hidden="true" />Add</button>
                </div>
              )}
            </div>
          );
        })}
      </fieldset>
      <BadgeLine badge={badge('streetpaws-three-click-architect')} earned={r.done} auto>
        Finish all 3 personas with problem statements ({r.complete}/3) and map every pillar in {CLICK_LIMIT} taps or fewer ({r.pillarsOk}/4)
      </BadgeLine>
    </div>
  );
}

/* ------------------------------------------------------------ Pitch script */

function PitchScript({ data, save }) {
  const d = cleanPitch(data);
  const r = pitchReport(d);
  const [open, setOpen] = useState(0);
  const [timing, setTiming] = useState(null);
  const [elapsed, reset] = useTicker(timing != null);
  const set = (p) => save({ ...d, ...p });
  const fill = (key, v) => { const fills = { ...d.fills }; if (v) fills[key] = v; else delete fills[key]; set({ fills }); };
  const stop = () => { const times = [...d.times]; times[timing] = Math.round(elapsed); set({ times }); setTiming(null); reset(); playToolSound('ding'); };

  return (
    <div className="pt-tool" data-tone={TONE}>
      <Vocab terms={VOCAB} />
      <div className="pt-tiles pt-tiles-4">
        <Tile label="Blanks filled" value={`${r.filled} / ${r.blanks}`} strong />
        <Tile label="Slides ready" value={`${r.slidesReady} / ${r.slides}`} />
        <Tile label="Rehearsed total" value={r.allRehearsed ? fmt(r.totalSec) : '–'} tone={r.allRehearsed && r.onTime ? 'ok' : undefined} />
        <Tile label="Target" value={fmt(PITCH_SECONDS)} />
      </div>

      <fieldset className="pt-fieldset">
        <legend>Fill each blank once. It appears everywhere in the script.</legend>
        <div className="pt-blank-grid">
          {BLANKS.map((b) => (
            <label key={b.blank} className="pt-field"><span>{b.label}</span>
              <input className="gh-input" value={d.fills[b.blank] || ''} maxLength={60} placeholder={b.example ? `e.g. ${b.example}` : ''} onChange={(e) => fill(b.blank, e.target.value)} /></label>
          ))}
        </div>
      </fieldset>

      <ol className="pt-speakers">
        {SCRIPT.map((s, i) => {
          const sp = r.speakers[i];
          const live = timing === i;
          return (
            <li key={s.n} className={`pt-speaker s${i}${open === i ? ' is-open' : ''}`}>
              <button type="button" className="pt-speaker-head" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
                <b>Speaker {s.n}</b><span>{s.title}</span>
                <small>{fmt(s.sec)}{sp.time != null ? ` · rehearsed ${fmt(sp.time)}${sp.onTime ? ' ✓' : ''}` : ''}</small>
              </button>
              {open === i && (
                <div className="pt-speaker-body">
                  <label className="pt-field"><span>Who speaks? (first name)</span>
                    <input className="gh-input" value={d.names[i]} maxLength={30} onChange={(e) => set({ names: d.names.map((n, j) => (j === i ? e.target.value : n)) })} /></label>
                  {s.lines.map((line, li) => (
                    <p key={li} className="pt-script-line">
                      {line.map((part, pi) => (part.blank
                        ? <mark key={pi} className={d.fills[part.blank] ? 'is-filled' : ''}>{d.fills[part.blank] || `[${part.label}]`}</mark>
                        : <span key={pi}>{part.text}</span>))}
                    </p>
                  ))}
                  <div className="pt-actions">
                    {live
                      ? <button type="button" className="gh-btn gh-btn-accent gh-btn-sm" onClick={stop}><Square size={14} aria-hidden="true" />Stop · {fmt(elapsed)}</button>
                      : <button type="button" className="gh-btn gh-btn-sm" disabled={timing != null} onClick={() => { reset(); setTiming(i); }}><Play size={14} aria-hidden="true" />Time my rehearsal</button>}
                  </div>
                  {sp.time != null && !live && (
                    <p className={sp.onTime ? 'pt-ok' : 'pt-warn'}>{sp.onTime ? `On time: ${fmt(sp.time)}.` : `${fmt(sp.time)}. Aim for ${fmt(s.sec)} (within ${SPEAKER_SLACK} seconds).`}</p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <fieldset className="pt-fieldset">
        <legend>8-slide deck checklist</legend>
        <div className="pt-check-grid">
          {SLIDES.map((sl) => (
            <Check key={sl.slideNumber} checked={d.slides.includes(sl.slideNumber)}
                   onChange={(on) => set({ slides: on ? [...d.slides, sl.slideNumber] : d.slides.filter((n) => n !== sl.slideNumber) })}>
              <b>{sl.title}</b><small>{sl.description}</small>
            </Check>
          ))}
        </div>
      </fieldset>
      <p className="pt-hint">The timer only counts seconds. Nothing is recorded.</p>
      <BadgeLine badge={badge('streetpaws-rescue-champion')}>deliver the live 10-minute pitch, defend your 6 portfolio artifacts and run the donation drive.</BadgeLine>
    </div>
  );
}
