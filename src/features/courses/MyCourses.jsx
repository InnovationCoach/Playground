import { useMemo, useState } from 'react';
import { Search, ArrowRight, Sparkles, LibraryBig, FolderOpen, Link2, SearchX, Ticket, Rocket, BookOpen, Layers, CheckCircle2 } from 'lucide-react';
import { joinClassWithCode, JOIN_RESULT } from '../enrolment/joinClass.js';
import { Alert } from '../admin/ui/bits.jsx';
import { useLocale } from '../../app/i18n/LocaleProvider.jsx';
import { ACTIVITY_NAV } from '../activities/activityHost.js';
import { ActivityIcon, parseActivityLabel } from '../shell/activityIcons.jsx';
import { PROGRAM_CATALOGUE } from '../pbl/content/programCatalogue.js';
import { hrefFor } from '../../app/routes.js';
import '../admin/admin.css';
import '../pbl/pbl.css';

/**
 * Student "My Courses" home page.
 *
 * Presents the 3 PBL Programs to choose from first, with attached STEAM activities
 * mapped under each program (8 activities attached to Sustainable Futures PBL).
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
  const [selectedProgramId, setSelectedProgramId] = useState('sustainable-futures');
  const [joined, setJoined] = useState(null);
  const firstName = String(displayName || '').split(' ')[0];

  const activeProgram = PROGRAM_CATALOGUE.find(p => p.id === selectedProgramId) || PROGRAM_CATALOGUE[0];

  const courses = useMemo(() => {
    const base = isPrimary ? WELEARN_COURSES.filter((c) => c.id === 'junior') : WELEARN_COURSES;
    const needle = q.trim().toLowerCase();
    
    // Filter by active program's attached steam activities if selected
    const programActivities = activeProgram?.steamActivityIds
      ? base.filter(c => activeProgram.steamActivityIds.includes(c.id) || c.id === 'junior')
      : base;

    if (!needle) return programActivities;
    return base.filter((c) => `${c.kicker} ${c.title} ${c.description} ${c.keywords}`.toLowerCase().includes(needle));
  }, [q, isPrimary, activeProgram]);

  return (
    <div className="gh-page">
      <div className="gh-hero">
        <div>
          <h1>{firstName ? t('courses.greeting', { name: firstName }) : t('courses.title')}</h1>
          <p>Choose a Project-Based Learning program and explore its attached STEAM activities.</p>
        </div>
        <label className="gh-input-icon">
          <span style={srOnly}>{t('common.search')}</span>
          <Search size={17} aria-hidden="true" />
          <input type="search" className="gh-input" value={q}
                 placeholder="Search programs & activities..." onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>

      {!isPrimary&&<p><a className="gh-btn gh-btn-primary" href={hrefFor.programs()}>{t('nav.programs')} <ArrowRight size={16}/></a></p>}
      {joined && <div style={{ marginTop: '1.5rem' }}><Alert type="success">{joined}</Alert></div>}
      {uid && classIds.length === 0 && (
        <JoinClassCard uid={uid} onJoined={(r) => { setJoined(r.message); onJoined?.(r); }} />
      )}

      {/* Program Choice Banner Section */}
      {!isPrimary && (
        <section className="gh-section" aria-label="PBL Programs Selection" style={{ marginTop: '1.5rem' }}>
          <div className="gh-section-head">
            <span className="gh-provider-mark" style={{ background: 'var(--gh-purple-50)', color: 'var(--gh-purple)' }}>
              <Rocket size={16} aria-hidden="true" />
            </span>
            <h2>Choose Your PBL Program</h2>
            <span className="gh-count">{PROGRAM_CATALOGUE.length} Programs</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginTop: '1rem' }}>
            {PROGRAM_CATALOGUE.map((prog) => {
              const isSelected = selectedProgramId === prog.id;
              const attachedCount = prog.steamActivityIds?.length || 0;
              return (
                <div
                  key={prog.id}
                  className={`gh-card ${isSelected ? 'pb-program-card-active' : ''}`}
                  onClick={() => setSelectedProgramId(prog.id)}
                  style={{
                    cursor: 'pointer',
                    padding: '1.5rem',
                    border: isSelected ? '2px solid var(--gh-purple)' : '1px solid var(--gh-gray-200)',
                    borderRadius: '12px',
                    background: isSelected ? 'var(--gh-purple-50, #f8f5ff)' : '#ffffff',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    boxShadow: isSelected ? '0 4px 12px rgba(124, 58, 237, 0.12)' : 'none'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span className="pb-kicker" style={{ color: 'var(--gh-purple)', fontWeight: 600 }}>Semester {prog.semester} · {prog.gradeBand}</span>
                      {isSelected && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--gh-purple)' }}>
                          <CheckCircle2 size={15} /> Selected
                        </span>
                      )}
                    </div>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#1e293b' }}>{prog.title}</h3>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
                      {prog.drivingQuestion}
                    </p>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', fontWeight: 500, color: 'var(--gh-green-text)', background: 'var(--gh-green-50)', padding: '6px 10px', borderRadius: '6px', width: 'fit-content', marginBottom: '1rem' }}>
                      <Layers size={14} />
                      {attachedCount} Attached STEAM Activities
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a href={hrefFor.pbl()} className="gh-btn gh-btn-primary gh-btn-sm" style={{ textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>
                        Open Studio <ArrowRight size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* STEAM Activities Section */}
      <section className="gh-section" aria-labelledby="mc-welearn" style={{ marginTop: '2rem' }}>
        <SectionHead id="mc-welearn" icon={Sparkles} bg="var(--gh-green-50)" fg="var(--gh-green-text)"
                     title={isPrimary ? t('courses.provider.welearn') : `Attached STEAM Activities — ${activeProgram?.title || 'Sustainable Futures'}`} count={courses.length} />
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
