import { useEffect, useState } from 'react';
import { ArrowLeft, Printer, FileText, BookOpenCheck } from 'lucide-react';
import { JUNIOR_ACTIVITIES, JUNIOR_BY_ID } from '../activities/index.js';
import { HANDS_ON_GUIDES } from '../activities/handsOnGuides.js';
import { LEVELS, VERDICTS, fieldVisible } from '../engine/investigationModel.js';
import { SURE } from '../../activities/plantLab/plantLabModel.js';
import { LOGO_URL } from '../../../app/brand.js';
import {
  kitList, safetyList, glossary, tableFields, drawFields, cellSpec, investigationTag, runOrderWithTimes
} from './sheetModel.js';
import '../../admin/admin.css';
import './print.css';

/**
 * Printable hands-on material for Junior Explorers.
 *
 * Worksheet: what a child fills in with a pencil while they do the real
 * investigation - circle a guess, tick the steps, record results, draw, plus an
 * Art corner and a Maths corner. Starter (6-8) has no writing lines; Explorer
 * (9-11) adds three tries, explorer-only fields and "because" lines.
 *
 * Teacher guide: the lesson around it - goals, STEAM map, prep, timings,
 * discussion, what to look for.
 *
 * Both are generated from the same activity content the app runs.
 */

/** Adds a body class while mounted so print CSS can hide the app around the sheet. */
function usePrintMode() {
  useEffect(() => {
    document.body.classList.add('ws-printing');
    return () => document.body.classList.remove('ws-printing');
  }, []);
}

function Toolbar({ backHref, backLabel, level, onLevel, children }) {
  return (
    <div className="ws-toolbar">
      <a className="gh-crumb" href={backHref} style={{ margin: 0 }}><ArrowLeft size={16} aria-hidden="true" />{backLabel}</a>
      <div className="gh-btn-row">
        {onLevel && (
          <div className="gh-segmented" role="radiogroup" aria-label="Level">
            {Object.entries(LEVELS).map(([id, l]) => (
              <button key={id} type="button" role="radio" aria-checked={level === id} onClick={() => onLevel(id)}>
                {l.icon} {l.label} ({l.ages})
              </button>
            ))}
          </div>
        )}
        {children}
        <button type="button" className="gh-btn gh-btn-primary" onClick={() => window.print()}>
          <Printer size={17} aria-hidden="true" />Print
        </button>
      </div>
    </div>
  );
}

function SheetHeader({ activity, kicker }) {
  return (
    // Not a <header>: index.html styles every header element as the dark app bar.
    <div className="ws-head">
      <div className="ws-badge" aria-hidden="true">{activity.icon}</div>
      <div>
        <div className="ws-kicker">{kicker}</div>
        <h1>{activity.title}</h1>
      </div>
      <img className="ws-logo" src={LOGO_URL} alt="WeLearn" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="gh-page gh-narrow">
      <div className="gh-card gh-table-state">That activity does not exist. <a href="#/primary-resources">See all activities</a>.</div>
    </div>
  );
}

// --- Worksheet -------------------------------------------------------------------

export function Worksheet({ activityId, backHref = '#/primary-resources' }) {
  usePrintMode();
  const [level, setLevel] = useState('starter');
  const activity = JUNIOR_BY_ID.get(activityId);
  const guide = HANDS_ON_GUIDES[activityId];
  if (!activity || !guide) return <NotFound />;
  const explorer = level === 'explorer';

  return (
    <div className="gh-page" style={{ maxWidth: 'none' }}>
      <Toolbar backHref={backHref} backLabel="Primary resources" level={level} onLevel={setLevel}>
        <a className="gh-btn" href={`#/guide/${activity.id}`}><BookOpenCheck size={17} aria-hidden="true" />Teacher guide</a>
      </Toolbar>

      <article className="ws-paper" style={{ '--ws-accent': activity.colour }} aria-label={`${activity.title} worksheet`}>
        <SheetHeader activity={activity} kicker={`Junior Explorers · Activity ${activity.number} · ${LEVELS[level].label} ${LEVELS[level].ages}`} />
        <div className="ws-who"><span>My name</span><span>Class</span><span>Date</span></div>

        <section className="ws-hero">
          <div className="ws-q">🔎 {guide.bigQuestion}</div>
          <p>{activity.story}</p>
        </section>

        <div className="ws-grid2">
          <section className="ws-box">
            <h3>🧺 My kit <span className="gh-muted" style={{ fontWeight: 400, fontSize: '9pt' }}>tick when you have it</span></h3>
            <ul className="ws-list">
              {kitList(activity).map((n) => <li key={n.label}><span className="ws-tick" /><span>{n.icon} {n.label}</span></li>)}
            </ul>
          </section>
          <section className="ws-box ws-safety">
            <h3>⚠️ Stay safe</h3>
            <ul className="ws-list">
              {safetyList(activity).map((s) => <li key={s}><span aria-hidden="true">•</span><span>{s}</span></li>)}
            </ul>
          </section>
        </div>

        {activity.investigations.map((inv) => (
          <InvestigationSheet key={inv.id} activity={activity} inv={inv} level={level} />
        ))}

        <div className="ws-corners">
          <section className="ws-corner ws-art">
            <h3>🎨 Art corner: {guide.art.title}</h3>
            <p>{guide.art.prompt}</p>
            {guide.art.grid ? (
              <div className="ws-pixels" aria-label="5 by 5 grid">{Array.from({ length: 25 }, (_, i) => <span key={i} />)}</div>
            ) : guide.art.circle ? <div className="ws-circle" aria-label="Spinner circle" /> : <div className="ws-draw" />}
          </section>
          <section className="ws-corner ws-maths">
            <h3>➗ Maths corner: {guide.maths.title}</h3>
            <p>{explorer ? guide.maths.explorer : guide.maths.starter}</p>
            <div className="ws-draw" style={{ minHeight: '30mm' }} />
          </section>
        </div>

        {glossary(activity).length > 0 && (
          <section className="ws-box" style={{ marginTop: 12 }}>
            <h3>📖 New words</h3>
            <div className="ws-glossary">
              {glossary(activity).map((w) => <div key={w.word}><b>{w.word}</b>: {w.meaning}</div>)}
            </div>
          </section>
        )}

        <section className="ws-box" style={{ marginTop: 12 }}>
          <h3>⭐ What I can do now <span className="gh-muted" style={{ fontWeight: 400, fontSize: '9pt' }}>colour the stars</span></h3>
          <ul className="ws-list ws-ican">
            {guide.goals.map((g) => <li key={g}><span>{g}</span><span className="ws-stars" aria-hidden="true">☆☆☆</span></li>)}
          </ul>
        </section>

        <div className="ws-foot"><span>WeLearn Growth Hub · Junior Explorers</span><span>Activity {activity.number}: {activity.title}</span></div>
      </article>
    </div>
  );
}

function OptionChip({ o }) {
  return (
    <span className="ws-option">
      {o.swatch !== undefined
        ? <span className="ws-swatch" style={{ background: o.swatch === 'transparent' ? '#fff' : o.swatch }} />
        : o.icon ? <span className="ws-emoji" aria-hidden="true">{o.icon}</span> : null}
      {o.label}
    </span>
  );
}

function Cell({ field, level }) {
  const spec = cellSpec(field, level);
  if (spec.type === 'trials') {
    return (
      <span className="ws-mini-opts">
        <span>Try 1 <span className="ws-answer" /></span>
        <span>Try 2 <span className="ws-answer" /></span>
        <span>Try 3 <span className="ws-answer" /></span>
        <span><b>Middle</b> <span className="ws-answer" /> {spec.unit}</span>
      </span>
    );
  }
  if (spec.type === 'circle') {
    return (
      <span className="ws-mini-opts">
        {spec.options.map((o) => (
          <span key={o.id}>
            {o.swatch !== undefined ? <span className="ws-swatch" style={{ background: o.swatch === 'transparent' ? '#fff' : o.swatch }} /> : o.icon ? `${o.icon} ` : ''}
            {o.label}
          </span>
        ))}
      </span>
    );
  }
  return <span><span className="ws-answer" />{spec.unit}</span>;
}

function InvestigationSheet({ activity, inv, level }) {
  const explorer = level === 'explorer';
  const cols = tableFields(inv, level);
  const draws = drawFields(inv, level);
  const isBuild = inv.kind === 'build';
  const circleNote = cols.some((f) => cellSpec(f, level).type === 'circle');

  return (
    <section className="ws-inv">
      <div className="ws-inv-head">
        <span className="ws-step-tag">{investigationTag(activity, inv)}</span>
        <h2>{inv.icon} {inv.title}</h2>
      </div>
      {!isBuild && <p className="ws-question">❓ {inv.question}</p>}

      {!isBuild && (
        <>
          <div className="ws-label">1 · My guess: circle one</div>
          <div className="ws-options">{inv.options.map((o) => <OptionChip key={o.id} o={o} />)}</div>
          <div className="ws-sure" style={{ marginTop: 6 }}>
            How sure am I? {SURE.map((s) => <span key={s.id} title={s.label}>{s.icon}</span>)}
          </div>
        </>
      )}

      <div className="ws-label">{isBuild ? '1' : '2'} · Do it: tick each step</div>
      <ol className="ws-steps">
        {inv.steps.map((s, i) => <li key={i}><span className="ws-tick" /><span>{s.icon} {s.text}</span></li>)}
      </ol>

      {cols.length > 0 && (
        <>
          <div className="ws-label">{isBuild ? '2' : '3'} · Look &amp; record{circleNote ? ': circle what you see' : ''}</div>
          <table className="ws-table">
            <thead>
              <tr>
                <th scope="col">{inv.samples.length > 1 ? 'Test' : ''}</th>
                {cols.map((f) => <th key={f.id} scope="col">{f.icon ? `${f.icon} ` : ''}{f.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {inv.samples.map((s) => (
                <tr key={s.id}>
                  <td className="ws-sample">{s.icon} {s.label}</td>
                  {cols.map((f) => <td key={f.id}><Cell field={f} level={level} /></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {draws.length > 0 && (
        <div className="ws-draws">
          {inv.samples.map((s) => draws.map((d) => (
            <div key={`${s.id}-${d.id}`} className="ws-draw">✏️ {d.label}{inv.samples.length > 1 ? `: ${s.label}` : ''}</div>
          )))}
        </div>
      )}

      {!isBuild && (
        <>
          <div className="ws-label">4 · What happened? Circle one</div>
          <div className="ws-verdicts">{VERDICTS.map((v) => <OptionChip key={v.id} o={v} />)}</div>
          {explorer && (
            <div className="ws-lines" aria-label="Writing lines">
              <span>I found out that</span>
              <span>because</span>
            </div>
          )}
        </>
      )}

      {inv.wordBank?.length > 0 && (
        <>
          <div className="ws-label">Words to use</div>
          <div className="ws-words">{inv.wordBank.map((w) => <span key={w}>{w}</span>)}</div>
        </>
      )}
    </section>
  );
}

// --- Teacher guide ----------------------------------------------------------------

const STEAM_STYLE = {
  S: { name: 'Science', bg: '#f2fadf', fg: '#4a6a00' },
  T: { name: 'Technology', bg: '#eef6ff', fg: '#1d5a8f' },
  E: { name: 'Engineering', bg: '#fff6e0', fg: '#8a5700' },
  A: { name: 'Art', bg: '#fbeaf2', fg: '#9a1f5e' },
  M: { name: 'Maths', bg: '#f5eefa', fg: '#6e3f8b' }
};

export function TeacherGuide({ activityId }) {
  usePrintMode();
  const activity = JUNIOR_BY_ID.get(activityId);
  const guide = HANDS_ON_GUIDES[activityId];
  if (!activity || !guide) return <NotFound />;
  const total = guide.runOrder.reduce((n, r) => n + r.min, 0);

  return (
    <div className="gh-page" style={{ maxWidth: 'none' }}>
      <Toolbar backHref="#/primary-resources" backLabel="Primary resources">
        <a className="gh-btn" href={`#/worksheet/${activity.id}`}><FileText size={17} aria-hidden="true" />Pupil worksheet</a>
      </Toolbar>

      <article className="ws-paper" style={{ '--ws-accent': activity.colour }} aria-label={`${activity.title} teacher guide`}>
        <SheetHeader activity={activity} kicker={`Teacher guide · Junior Explorers · Activity ${activity.number}`} />

        <section className="ws-hero">
          <div className="ws-q">🔎 {guide.bigQuestion}</div>
          <p>{activity.story}</p>
        </section>

        <div className="tg-meta">
          <div><b>Time</b>{guide.time}</div>
          <div><b>Groups</b>{guide.groups}</div>
          <div><b>Ages</b>Starter 6–8 · Explorer 9–11</div>
        </div>

        <section className="tg-section">
          <h3>Learning goals</h3>
          <ul className="ws-list">{guide.goals.map((g) => <li key={g}><span aria-hidden="true">✓</span><span>{g}</span></li>)}</ul>
        </section>

        <section className="tg-section">
          <h3>STEAM in this activity</h3>
          <div className="tg-steam">
            {Object.entries(guide.steam).map(([k, v]) => (
              <div key={k} style={{ background: STEAM_STYLE[k].bg, color: STEAM_STYLE[k].fg }}>
                <span className="tg-letter">{k}</span>
                <b style={{ display: 'block', fontSize: '8.5pt', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{STEAM_STYLE[k].name}</b>
                <span style={{ color: '#14213a' }}>{v}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="ws-grid2">
          <section className="ws-box">
            <h3>📋 Before the lesson</h3>
            <ul className="ws-list">{guide.prep.map((p) => <li key={p}><span className="ws-tick" /><span>{p}</span></li>)}</ul>
          </section>
          <section className="ws-box ws-safety">
            <h3>⚠️ Safety</h3>
            <ul className="ws-list">{safetyList(activity).map((s) => <li key={s}><span aria-hidden="true">•</span><span>{s}</span></li>)}</ul>
          </section>
        </div>

        <section className="ws-box">
          <h3>🧺 Kit per group</h3>
          <ul className="ws-list" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {kitList(activity).map((n) => <li key={n.label}><span className="ws-tick" /><span>{n.icon} {n.label}</span></li>)}
          </ul>
        </section>

        <section className="tg-section">
          <h3>Running order ({total} minutes)</h3>
          <table className="tg-run">
            <tbody>
              {runOrderWithTimes(guide.runOrder).map((r) => (
                <tr key={r.from}><td>{r.from}–{r.to} min</td><td>{r.what}</td></tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="tg-section">
          <h3>The investigations</h3>
          {activity.investigations.map((inv) => (
            <div key={inv.id} className="tg-inv">
              <p><b>{investigationTag(activity, inv)}: {inv.title}</b>{inv.question ? `: ${inv.question}` : ''}</p>
              <p><i>Children record:</i> {inv.fields.filter((f) => fieldVisible(f, 'starter')).map((f) => f.label).join('; ')}
                {inv.fields.some((f) => f.level === 'explorer') && <> <i>Explorers also:</i> {inv.fields.filter((f) => f.level === 'explorer').map((f) => f.label).join('; ')}</>}</p>
              <p><i>What scientists often see:</i> {inv.scientists}</p>
            </div>
          ))}
        </section>

        <div className="ws-grid2 tg-section">
          <section className="ws-box">
            <h3>💬 Talk about it</h3>
            <ul className="ws-list">{guide.discussion.map((d) => <li key={d}><span aria-hidden="true">•</span><span>{d}</span></li>)}</ul>
          </section>
          <section className="ws-box">
            <h3>👀 What to look for</h3>
            <p style={{ margin: '0 0 6px' }}><b>Starter:</b> {guide.lookFors.starter}</p>
            <p style={{ margin: 0 }}><b>Explorer:</b> {guide.lookFors.explorer}</p>
          </section>
        </div>

        <div className="ws-grid2 tg-section">
          <section className="ws-box">
            <h3>🎨 Art corner</h3>
            <p style={{ margin: 0 }}><b>{guide.art.title}.</b> {guide.art.prompt}</p>
          </section>
          <section className="ws-box">
            <h3>➗ Maths corner</h3>
            <p style={{ margin: '0 0 4px' }}><b>Starter:</b> {guide.maths.starter}</p>
            <p style={{ margin: 0 }}><b>Explorer:</b> {guide.maths.explorer}</p>
          </section>
        </div>

        <div className="ws-grid2 tg-section">
          <section className="ws-box">
            <h3>🌍 Real-world link</h3>
            <p style={{ margin: 0 }}>{guide.realWorld}</p>
          </section>
          <section className="ws-box">
            <h3>🚀 Going further</h3>
            <p style={{ margin: 0 }}>{guide.extension}</p>
          </section>
        </div>

        {activity.standards?.length > 0 && (
          <p className="gh-muted" style={{ fontSize: '9pt', marginTop: 12 }}>
            Curriculum links (for teacher review): {activity.standards.join(' · ')}
          </p>
        )}
        <div className="ws-foot"><span>WeLearn Growth Hub · Teacher guide</span><span>Activity {activity.number}: {activity.title}</span></div>
      </article>
    </div>
  );
}

// --- Resources hub ----------------------------------------------------------------

export function PrimaryResources() {
  return (
    <div className="gh-page">
      <div className="gh-page-head">
        <div>
          <h1>Primary hands-on resources</h1>
          <p className="gh-sub">A pupil worksheet and a teacher guide for every Junior Explorers activity. Each worksheet comes in Starter (6–8) and Explorer (9–11) versions.</p>
        </div>
      </div>
      <ul className="pr-grid">
        {JUNIOR_ACTIVITIES.map((a) => {
          const g = HANDS_ON_GUIDES[a.id];
          return (
            <li key={a.id} className="gh-card pr-card">
              <div className="pr-top">
                <span className="pr-num" style={{ background: `color-mix(in srgb, ${a.colour} 16%, white)` }} aria-hidden="true">{a.icon}</span>
                <div>
                  <div className="gh-muted" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Activity {a.number}</div>
                  <h3 style={{ fontSize: '1rem' }}>{a.title}</h3>
                </div>
              </div>
              <p className="gh-card-desc" style={{ margin: 0, flex: 1 }}>{g?.bigQuestion}</p>
              <p className="gh-muted" style={{ margin: 0, fontSize: '0.82rem' }}>{g?.time} · {g?.groups}</p>
              <div className="gh-btn-row">
                <a className="gh-btn gh-btn-sm gh-btn-primary" href={`#/worksheet/${a.id}`}><FileText size={15} aria-hidden="true" />Worksheet</a>
                <a className="gh-btn gh-btn-sm" href={`#/guide/${a.id}`}><BookOpenCheck size={15} aria-hidden="true" />Teacher guide</a>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
