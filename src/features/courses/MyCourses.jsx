import { useMemo, useState } from 'react';
import {
  Search, ArrowRight, Sparkles, LibraryBig, FolderOpen, Link2, SearchX, Ticket, Rocket,
  Bookmark, Globe, Compass, TrendingUp, Route
} from 'lucide-react';
import { joinClassWithCode, JOIN_RESULT } from '../enrolment/joinClass.js';
import { Alert } from '../admin/ui/bits.jsx';
import { useLocale } from '../../app/i18n/LocaleProvider.jsx';
import { ACTIVITY_NAV } from '../activities/activityHost.js';
import { ActivityIcon, parseActivityLabel } from '../shell/activityIcons.jsx';
import { TERM } from '../pbl/content/pblModel.js';
import { hrefFor } from '../../app/routes.js';
import { PROGRAMS } from '../pbl/programs/catalog.js';
import { ProgramIcon } from '../pbl/programs/ProgramIcon.jsx';
import { useClassPrograms } from '../pbl/programs/useClassPrograms.js';
import { buildCatalog, searchCatalog, countBySource, SOURCES } from './catalog.js';
import { useAddedCourses } from './useAddedCourses.js';
import { CatalogCard } from './CatalogCard.jsx';
import { useProgramSummaries } from './useProgramSummaries.js';
import { srOnly } from './CatalogCard.jsx';
import '../admin/admin.css';
import '../pbl/pbl.css';
import '../pbl/programs/programs.css';
import './courses.css';

/**
 * Student "My Courses" home, first version.
 *
 * Three providers, as the plan describes: WeLearn PBL/STEAM simulations (real,
 * they open today), Edmentum (arrives with LTI in Phase B) and teacher
 * materials (Phase C uploads). Edmentum and materials show honest empty
 * states rather than placeholder courses - a student should never click a
 * course that does not exist. When the catalogue lands (Phase C) the course
 * list comes from data and this component keeps its layout.
 *
 * Secondary learners also get the dashboard parts from the WeLearn student
 * platform: progress figures, "Continue learning" from real PBL program
 * progress, "Courses I added" (from search here or on Home), and one search over activities, PBL programs
 * and partner courses (catalog.js) with source filters.
 */
const NO_COURSES = [];

const WELEARN_COURSES = ACTIVITY_NAV.filter((a) => a.id !== 'home').map((a) => ({
  id: a.id,
  ...parseActivityLabel(a.label),
  description: a.description || '',
  keywords: a.keywords || ''
}));

export function MyCourses({ onOpenActivity, isPrimary, displayName, uid, classIds = [], onJoined }) {
  const { t } = useLocale();
  const [q, setQ] = useState('');
  const [source, setSource] = useState('all');
  const [joined, setJoined] = useState(null);
  const firstName = String(displayName || '').split(' ')[0];

  const courses = useMemo(() => {
    // Primary learners see only their own section; secondary activities are not for them.
    const base = isPrimary ? WELEARN_COURSES.filter((c) => c.id === 'junior') : WELEARN_COURSES;
    const needle = q.trim().toLowerCase();
    if (!needle) return base;
    return base.filter((c) => `${c.kicker} ${c.title} ${c.description} ${c.keywords}`.toLowerCase().includes(needle));
  }, [q, isPrimary]);

  // Secondary only: the combined catalogue, program progress and My Path.
  const catalog = useMemo(() => (isPrimary ? [] : buildCatalog({
    activities: ACTIVITY_NAV, programs: PROGRAMS, parseLabel: parseActivityLabel, includePartners: true
  })), [isPrimary]);
  const searching = !isPrimary && (q.trim() !== '' || source !== 'all');
  const results = useMemo(() => searchCatalog(catalog, q, source), [catalog, q, source]);
  const counts = useMemo(() => countBySource(catalog, q), [catalog, q]);

  const { byProgram } = useClassPrograms(isPrimary ? [] : classIds);
  const summaries = useProgramSummaries(uid, PROGRAMS, !isPrimary);
  const continuing = PROGRAMS.filter((p) => byProgram[p.id] || summaries[p.id]?.startedAt);
  const stats = {
    started: PROGRAMS.filter((p) => summaries[p.id]?.startedAt).length,
    sessions: PROGRAMS.reduce((n, p) => n + (summaries[p.id]?.done || 0), 0)
  };

  const { keys: path, added: saved, toggle: onToggleSave } = useAddedCourses(uid, isPrimary ? NO_COURSES : catalog);
  const cardProps = { onOpenActivity, addedKeys: path, onToggleAdd: onToggleSave };

  return (
    <div className="gh-page">
      <div className="gh-hero mc-hero">
        <div>
          <h1>{firstName ? t('courses.greeting', { name: firstName }) : t('courses.title')}</h1>
          <p>{t('courses.subtitle')}</p>
        </div>
        <label className={isPrimary ? 'gh-input-icon' : 'gh-input-icon mc-search'}>
          <span style={srOnly}>{t('common.search')}</span>
          <Search size={17} aria-hidden="true" />
          <input type="search" className="gh-input" value={q}
                 placeholder={t(isPrimary ? 'courses.searchPlaceholder' : 'courses.searchPlaceholderAll')}
                 onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>

      {!isPrimary && (
        <div className="mc-chips" role="group" aria-label={t('courses.source.label')}>
          {['all', ...SOURCES].map((s) => (
            <button key={s} type="button" className="mc-chip" aria-pressed={source === s} onClick={() => setSource(s)}>
              {t(`courses.source.${s}`)}<span className="mc-chip-n">{counts[s]}</span>
            </button>
          ))}
        </div>
      )}

      {!isPrimary && !searching && (
        <div className="mc-stats">
          <Stat icon={Compass} value={stats.started} label={t('courses.stat.started')} />
          <Stat icon={TrendingUp} value={stats.sessions} label={t('courses.stat.sessions')} />
          <Stat icon={Route} value={saved.length} label={t('courses.stat.saved')} />
        </div>
      )}

      {joined && <div style={{ marginTop: '1.5rem' }}><Alert type="success">{joined}</Alert></div>}
      {uid && classIds.length === 0 && (
        <JoinClassCard uid={uid} onJoined={(r) => { setJoined(r.message); onJoined?.(r); }} />
      )}

      {!isPrimary && (
        <a className="pb-term-card" href={hrefFor.pbl()}>
          <span className="pb-term-icon"><Rocket size={22} aria-hidden="true" /></span>
          <span className="pb-grow">
            <span className="pb-kicker">{t('courses.pblKicker')} · {TERM.label}</span>
            <strong>{TERM.theme}</strong>
            <span className="pb-term-dq">{TERM.drivingQuestion}</span>
          </span>
          <span className="gh-btn gh-btn-primary">{t('courses.pblCta')}<ArrowRight size={15} aria-hidden="true" /></span>
        </a>
      )}

      {searching && (
        <section className="gh-section" aria-labelledby="mc-results" aria-live="polite">
          <SectionHead id="mc-results" icon={Search} bg="var(--gh-purple-50)" fg="var(--gh-purple)"
                       title={t('courses.results')} count={results.length} />
          {results.length ? (
            <ul className="gh-course-grid">
              {results.map((c) => <CatalogCard key={c.key} item={c} {...cardProps} />)}
            </ul>
          ) : (
            <div className="gh-placeholder">
              <span className="gh-empty-icon"><SearchX size={20} aria-hidden="true" /></span>
              {q.trim() ? t('courses.noMatch', { q: q.trim() }) : t('courses.noneInSource')}
            </div>
          )}
        </section>
      )}

      {!isPrimary && !searching && continuing.length > 0 && (
        <section className="gh-section" aria-labelledby="mc-continue">
          <SectionHead id="mc-continue" icon={TrendingUp} bg="var(--gh-purple-50)" fg="var(--gh-purple)"
                       title={t('courses.continueTitle')} count={continuing.length} />
          <ul className="mc-progress-list">
            {continuing.map((p) => {
              const s = summaries[p.id];
              const pct = s?.pct || 0;
              return (
                <li key={p.id}>
                  <a className="mc-progress" href={hrefFor.program(p.id)}>
                    <span className="mc-tone-icon mc-progress-icon" data-tone={p.identity.tone}><ProgramIcon name={p.identity.icon} size={20} /></span>
                    <span className="mc-progress-body">
                      <span className="mc-progress-top">
                        <strong>{p.title}</strong>
                        <span className="mc-progress-pct">{pct}%</span>
                      </span>
                      <span className="mc-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
                            aria-label={p.title}><i style={{ width: `${pct}%` }} /></span>
                      <span className="mc-progress-meta">
                        {t('courses.sessionsDone', { done: s?.done || 0, total: p.sessions.length })}
                        {byProgram[p.id] && <> · {t('courses.classProgram', { className: byProgram[p.id].join(', ') })}</>}
                        {s?.next && <> · {t('courses.nextSession', { title: s.next.title })}</>}
                      </span>
                    </span>
                    <ArrowRight size={16} aria-hidden="true" className="mc-progress-go" />
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {!isPrimary && !searching && (
        <section className="gh-section" aria-labelledby="mc-path">
          <SectionHead id="mc-path" icon={Route} bg="#eef6ff" fg="#1d5a8f" title={t('courses.pathTitle')} count={saved.length} />
          {saved.length ? (
            <>
              <ul className="gh-course-grid">
                {saved.map((c) => <CatalogCard key={c.key} item={c} {...cardProps} />)}
              </ul>
              <p className="mc-note">{t('courses.pathNote')}</p>
            </>
          ) : (
            <div className="gh-placeholder">
              <span className="gh-empty-icon"><Bookmark size={20} aria-hidden="true" /></span>
              {t('courses.pathEmpty')}
            </div>
          )}
        </section>
      )}

      {!searching && <section className="gh-section" aria-labelledby="mc-welearn">
        <SectionHead id="mc-welearn" icon={Sparkles} bg="var(--gh-green-50)" fg="var(--gh-green-text)"
                     title={isPrimary ? t('courses.provider.welearn') : t('courses.exploreTitle')} count={courses.length} />
        {courses.length ? (
          <ul className="gh-course-grid">
            {courses.map((c) => (
              <li key={c.id}>
                <button type="button" className="gh-course" onClick={() => onOpenActivity(c.id)}>
                  <ActivityIcon id={c.id} />
                  {c.kicker && <span className="gh-course-kicker">{c.kicker}</span>}
                  <span className="gh-course-title">{c.title}</span>
                  <span className="gh-course-desc">{c.description}</span>
                  <span className="gh-course-cta">{t('courses.open')}<ArrowRight size={15} aria-hidden="true" /></span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="gh-placeholder">
            <span className="gh-empty-icon"><SearchX size={20} aria-hidden="true" /></span>
            {t('courses.noMatch', { q: q.trim() })}
          </div>
        )}
      </section>}

      {!isPrimary && !searching && (
        <section className="gh-section" aria-labelledby="mc-programs">
          <SectionHead id="mc-programs" icon={Compass} bg="var(--gh-purple-50)" fg="var(--gh-purple)"
                       title={t('courses.programsTitle')} count={PROGRAMS.length} />
          <ul className="gh-course-grid">
            {catalog.filter((c) => c.source === 'program').map((c) => <CatalogCard key={c.key} item={c} {...cardProps} />)}
          </ul>
        </section>
      )}

      {!isPrimary && !searching && (
        <section className="gh-section" aria-labelledby="mc-partners">
          <SectionHead id="mc-partners" icon={Globe} bg="#eef6ff" fg="#1d5a8f"
                       title={t('courses.partnersTitle')} count={counts.partner} />
          <p className="mc-note" style={{ marginTop: 0, marginBottom: '0.9rem' }}>{t('courses.partnersNote')}</p>
          <ul className="gh-course-grid">
            {catalog.filter((c) => c.source === 'partner').map((c) => <CatalogCard key={c.key} item={c} {...cardProps} />)}
          </ul>
        </section>
      )}

      <section className="gh-section" aria-labelledby="mc-edmentum">
        <SectionHead id="mc-edmentum" icon={LibraryBig} bg="#eef6ff" fg="#1d5a8f" title={t('courses.provider.edmentum')} />
        <div className="gh-placeholder">
          <span className="gh-empty-icon"><Link2 size={20} aria-hidden="true" /></span>
          {t('courses.edmentumPending')}
        </div>
      </section>

      <section className="gh-section" aria-labelledby="mc-materials">
        <SectionHead id="mc-materials" icon={FolderOpen} bg="#fbeaf2" fg="#9a1f5e" title={t('courses.provider.materials')} />
        <div className="gh-placeholder">
          <span className="gh-empty-icon"><FolderOpen size={20} aria-hidden="true" /></span>
          {t('courses.materialsPending')}
        </div>
      </section>
    </div>
  );
}

/**
 * Shown only while the learner is in no class. That state is invisible to them
 * otherwise: everything appears to work, but no teacher can see their work.
 */
function JoinClassCard({ uid, onJoined }) {
  const { t } = useLocale();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true); setResult(null);
    const r = await joinClassWithCode(uid, code, []);
    setResult(r); setBusy(false);
    if (r.status === JOIN_RESULT.OK) { setCode(''); onJoined?.(r); }
  }

  return (
    <form className="gh-card" onSubmit={submit} style={{ marginTop: '1.5rem', borderColor: 'var(--gh-purple-100)' }} aria-labelledby="mc-join">
      <div className="gh-card-head" style={{ justifyContent: 'flex-start', marginBottom: '0.9rem' }}>
        <span className="gh-action-icon" style={{ background: 'var(--gh-purple-50)', color: 'var(--gh-purple)' }}><Ticket size={17} aria-hidden="true" /></span>
        <div>
          <h3 id="mc-join">{t('courses.joinTitle')}</h3>
          <p className="gh-card-desc">{t('courses.joinBody')}</p>
        </div>
      </div>
      {result && <Alert type={result.status === JOIN_RESULT.OK ? 'success' : 'error'}>{result.message}</Alert>}
      <div className="gh-link-form">
        <div>
          <label style={srOnly} htmlFor="mc-join-code">{t('auth.classCode')}</label>
          <input id="mc-join-code" className="gh-input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABCD-2345"
                 autoCapitalize="characters" autoComplete="off" spellCheck={false} disabled={busy}
                 style={{ textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'ui-monospace, Menlo, monospace' }} />
        </div>
        <button type="submit" className="gh-btn gh-btn-primary" disabled={busy || !code.trim()}>
          {busy ? t('common.loading') : t('courses.join')}
        </button>
      </div>
    </form>
  );
}

function Stat({ icon: Icon, value, label }) {
  return (
    <div className="mc-stat">
      <span className="mc-stat-icon"><Icon size={17} aria-hidden="true" /></span>
      <span><strong>{value}</strong><span>{label}</span></span>
    </div>
  );
}

function SectionHead({ id, icon: Icon, bg, fg, title, count }) {
  return (
    <div className="gh-section-head">
      <span className="gh-provider-mark" style={{ background: bg, color: fg }}><Icon size={16} aria-hidden="true" /></span>
      <h2 id={id}>{title}</h2>
      {count !== undefined && <span className="gh-count">{count}</span>}
    </div>
  );
}


