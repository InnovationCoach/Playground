import { useMemo, useState } from 'react';
import { Search, ArrowRight, Sparkles, LibraryBig, FolderOpen, Link2, SearchX, Ticket, Rocket } from 'lucide-react';
import { joinClassWithCode, JOIN_RESULT } from '../enrolment/joinClass.js';
import { Alert } from '../admin/ui/bits.jsx';
import { useLocale } from '../../app/i18n/LocaleProvider.jsx';
import { ACTIVITY_NAV } from '../activities/activityHost.js';
import { ActivityIcon, parseActivityLabel } from '../shell/activityIcons.jsx';
import { TERM } from '../pbl/content/pblModel.js';
import { hrefFor } from '../../app/routes.js';
import '../admin/admin.css';
import '../pbl/pbl.css';

/**
 * Student "My Courses" home, first version.
 *
 * Three providers, as the plan describes: WeLearn PBL/STEAM simulations (real,
 * they open today), Edmentum (arrives with LTI in Phase B) and teacher
 * materials (Phase C uploads). Edmentum and materials show honest empty
 * states rather than placeholder courses - a student should never click a
 * course that does not exist. When the catalogue lands (Phase C) the course
 * list comes from data and this component keeps its layout.
 */
const WELEARN_COURSES = ACTIVITY_NAV.filter((a) => a.id !== 'home').map((a) => ({
  id: a.id,
  ...parseActivityLabel(a.label),
  description: a.description || '',
  keywords: a.keywords || ''
}));

export function MyCourses({ onOpenActivity, isPrimary, displayName, uid, classIds = [], onJoined }) {
  const { t } = useLocale();
  const [q, setQ] = useState('');
  const [joined, setJoined] = useState(null);
  const firstName = String(displayName || '').split(' ')[0];

  const courses = useMemo(() => {
    // Primary learners see only their own section; secondary activities are not for them.
    const base = isPrimary ? WELEARN_COURSES.filter((c) => c.id === 'junior') : WELEARN_COURSES;
    const needle = q.trim().toLowerCase();
    if (!needle) return base;
    return base.filter((c) => `${c.kicker} ${c.title} ${c.description} ${c.keywords}`.toLowerCase().includes(needle));
  }, [q, isPrimary]);

  return (
    <div className="gh-page">
      <div className="gh-hero">
        <div>
          <h1>{firstName ? t('courses.greeting', { name: firstName }) : t('courses.title')}</h1>
          <p>{t('courses.subtitle')}</p>
        </div>
        <label className="gh-input-icon">
          <span style={srOnly}>{t('common.search')}</span>
          <Search size={17} aria-hidden="true" />
          <input type="search" className="gh-input" value={q}
                 placeholder={t('courses.searchPlaceholder')} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>

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

      <section className="gh-section" aria-labelledby="mc-welearn">
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
      </section>

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

function SectionHead({ id, icon: Icon, bg, fg, title, count }) {
  return (
    <div className="gh-section-head">
      <span className="gh-provider-mark" style={{ background: bg, color: fg }}><Icon size={16} aria-hidden="true" /></span>
      <h2 id={id}>{title}</h2>
      {count !== undefined && <span className="gh-count">{count}</span>}
    </div>
  );
}

const srOnly = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' };
