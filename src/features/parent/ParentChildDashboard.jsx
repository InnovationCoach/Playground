import { ArrowLeft, BookOpen, Check, ChevronDown, CircleCheck, Circle, Clock, EyeOff, Eye, FlaskConical, Lightbulb, MessageCircle, Rocket, ShieldCheck, Sparkles, Target, Trophy } from 'lucide-react';
import { useLocale } from '../../app/i18n/LocaleProvider.jsx';
import { getChildProgress } from '../../services/api/endpoints.js';
import { describeApiError, isMockApi } from '../../services/api/apiClient.js';
import { useAsync } from '../admin/ui/useAsync.js';
import { Alert } from '../admin/ui/bits.jsx';
import { Avatar } from '../shell/Avatar.jsx';
import { SHARED, NOT_SHARED } from './childProgress.js';
import './parentDashboard.css';

/**
 * One child's progress for a linked parent: PBL project, Goal setting,
 * competencies shown in evidence, STEAM activities and Edmentum. Read-only.
 * Everything comes from GET /api/parent/children/:uid/progress, which is
 * built by childProgress.js; this file only lays it out.
 */
export function ParentChildDashboard({ childUid, onBack }) {
  const { t } = useLocale();
  const res = useAsync(() => getChildProgress(childUid), [childUid]);
  const p = res.data;

  return (
    <div className="gh-page pd">
      {isMockApi && <div className="gh-banner" role="note"><FlaskConical size={16} aria-hidden="true" />{t('testData.banner')}</div>}
      <button type="button" className="gh-btn gh-btn-ghost pd-back" onClick={onBack}>
        <ArrowLeft size={16} aria-hidden="true" /> {t('parent.d.back')}
      </button>

      {res.error ? (
        <Alert type="error">{res.error.code === 'NOT_FOUND' ? t('parent.d.notFound') : describeApiError(res.error, t)}</Alert>
      ) : !p ? (
        <div className="gh-card" aria-busy="true"><div className="gh-skel" style={{ width: '45%' }} /><div className="gh-skel" style={{ width: '70%', marginTop: '0.8rem' }} /></div>
      ) : (
        <Dashboard p={p} />
      )}
    </div>
  );
}

function useRelative() {
  const { locale } = useLocale();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  return (ms) => {
    if (!Number.isFinite(ms)) return '';
    const mins = Math.round((ms - Date.now()) / 60000);
    if (Math.abs(mins) < 60) return rtf.format(mins, 'minute');
    const hours = Math.round(mins / 60);
    if (Math.abs(hours) < 24) return rtf.format(hours, 'hour');
    const days = Math.round(hours / 24);
    if (Math.abs(days) < 14) return rtf.format(days, 'day');
    return rtf.format(Math.round(days / 7), 'week');
  };
}

function Bar({ percent, label, tone = 'green' }) {
  return (
    <div className={`pd-bar pd-bar-${tone}`} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
      <span style={{ width: `${percent}%` }} />
    </div>
  );
}

function Section({ icon: Icon, title, tone = 'purple', aside, children, className = '' }) {
  return (
    <section className={`gh-card pd-section ${className}`}>
      <div className="pd-section-head">
        <span className={`pd-icon pd-icon-${tone}`}><Icon size={18} aria-hidden="true" /></span>
        <h2>{title}</h2>
        {aside && <span className="pd-aside">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

function Dashboard({ p }) {
  const { t } = useLocale();
  const ago = useRelative();
  const name = p.child.givenNames || p.child.displayName;
  const edmCourses = p.edmentum.courses;
  const edmScores = edmCourses.map((c) => c.averageScore).filter(Number.isFinite);
  const edmAverage = edmScores.length ? Math.round(edmScores.reduce((a, b) => a + b, 0) / edmScores.length) : null;

  const stats = [
    { id: 'pbl', icon: Rocket, label: t('parent.d.statPbl'), value: `${p.pbl.tasks.percent}%`, detail: t('parent.d.tasks', { done: p.pbl.tasks.done, total: p.pbl.tasks.total }), percent: p.pbl.tasks.percent, tone: 'purple' },
    { id: 'goals', icon: Target, label: t('parent.d.statGoals'), value: p.goals ? `${p.goals.steps.percent}%` : '–', detail: p.goals ? t('parent.d.stepsOf', { done: p.goals.steps.done, total: p.goals.steps.total }) : t('parent.d.notSet'), percent: p.goals?.steps.percent ?? 0, tone: 'green' },
    { id: 'comp', icon: Sparkles, label: t('parent.d.statCompetencies'), value: String(p.competencies.shown), detail: t('parent.d.ofTotal', { total: p.competencies.total }), percent: Math.round((100 * p.competencies.shown) / p.competencies.total), tone: 'magenta' },
    { id: 'edm', icon: BookOpen, label: t('parent.d.statEdmentum'), value: edmAverage !== null ? `${edmAverage}%` : '–', detail: p.edmentum.status === 'connected' ? t('parent.d.courses', { count: edmCourses.length }) : t('parent.d.notConnected'), percent: edmAverage ?? 0, tone: 'navy' }
  ];

  return (
    <>
      <div className="pd-hero">
        <Avatar name={p.child.displayName} seed={p.child.uid} size={64} />
        <div className="pd-hero-text">
          <h1>{p.child.displayName}</h1>
          <p className="gh-sub">{[p.child.yearLevel, p.child.schoolName, p.child.cohortCode].filter(Boolean).join(' · ')}</p>
          <p className="pd-active"><Clock size={14} aria-hidden="true" />{p.lastActiveAt ? t('parent.d.lastActive', { when: ago(p.lastActiveAt) }) : t('parent.d.neverActive')}</p>
        </div>
      </div>

      <ul className="pd-stats" aria-label={t('parent.d.glance')}>
        {stats.map((s) => (
          <li key={s.id} className={`pd-stat pd-tone-${s.tone}`}>
            <span className="pd-stat-label"><s.icon size={15} aria-hidden="true" />{s.label}</span>
            <strong className="pd-stat-value">{s.value}</strong>
            <Bar percent={s.percent} label={s.label} tone={s.tone} />
            <span className="pd-stat-detail">{s.detail}</span>
          </li>
        ))}
      </ul>

      <div className="pd-grid">
        <div className="pd-col">
          <PblSection p={p} name={name} />
          <GoalsSection goals={p.goals} name={name} ago={ago} />
        </div>
        <div className="pd-col">
          <EdmentumSection edm={p.edmentum} ago={ago} />
          <CompetencySection comp={p.competencies} name={name} />
          <ActivitiesSection activities={p.activities} />
        </div>
      </div>

      <div className="pd-grid">
        <RecentSection recent={p.recent} ago={ago} />
        <Section icon={MessageCircle} tone="green" title={t('parent.d.starters')}>
          <ul className="pd-starters">
            {p.starters.map((s) => <li key={s}><Lightbulb size={16} aria-hidden="true" /><span>{s}</span></li>)}
          </ul>
        </Section>
      </div>

      <PrivacyNote name={name} />
    </>
  );
}

function PblSection({ p, name }) {
  const { t } = useLocale();
  const pbl = p.pbl;
  return (
    <Section icon={Rocket} title={t('parent.d.pbl')} aside={pbl.termLabel}>
      <p className="pd-theme">{pbl.theme}</p>
      {!pbl.started ? <p className="gh-muted">{t('parent.d.pblNotStarted', { name })}</p> : (
        <>
          <div className="pd-question">
            <span className="pd-kicker">{t('parent.d.question')}</span>
            <p>{pbl.question || t('parent.d.noQuestion')}</p>
          </div>
          <ol className="pd-phases" aria-label={t('parent.d.phases')}>
            {pbl.phases.map((ph) => (
              <li key={ph.id} data-state={ph.state} aria-current={ph.state === 'current' ? 'step' : undefined}>
                <span className="pd-phase-dot">{ph.state === 'done' ? <Check size={13} aria-hidden="true" /> : null}</span>
                <span className="pd-phase-name">{ph.title}</span>
                <span className="pd-phase-count">{ph.tasksDone}/{ph.tasksTotal}</span>
              </li>
            ))}
          </ol>
          <p className="pd-now">{t('parent.d.nowIn', { phase: pbl.currentPhase.title })}</p>
          <div className="pd-meter">
            <div className="pd-meter-head"><span>{t('parent.d.readiness')}</span><span>{pbl.readiness.done}/{pbl.readiness.total}</span></div>
            <Bar percent={pbl.readiness.percent} label={t('parent.d.readiness')} tone="purple" />
          </div>
          <p className="pd-small">{t('parent.d.evidence', { count: pbl.evidence.total })}</p>
          {pbl.evidence.byKind.length > 0 && (
            <ul className="pd-chips">
              {pbl.evidence.byKind.map((k) => <li key={k.id}>{k.label} <strong>{k.count}</strong></li>)}
            </ul>
          )}
        </>
      )}
    </Section>
  );
}

function GoalsSection({ goals, name, ago }) {
  const { t } = useLocale();
  return (
    <Section icon={Target} tone="green" title={t('parent.d.goals')} aside={goals?.updatedAt ? t('parent.d.updated', { when: ago(goals.updatedAt) }) : null}>
      {!goals ? <p className="gh-muted">{t('parent.d.goalsNone', { name })}</p> : (
        <>
          <ul className="pd-goals">
            {goals.items.map((g) => (
              <li key={g.text} data-done={g.done || undefined}>
                <div className="pd-goal-head">
                  {g.done ? <Trophy size={16} aria-hidden="true" /> : <Target size={16} aria-hidden="true" />}
                  <span>{g.text}</span>
                  {g.done && <span className="pd-pill">{t('parent.d.achieved')}</span>}
                </div>
                {g.stepsTotal > 0 && !g.done && (
                  <div className="pd-meter">
                    <div className="pd-meter-head"><span>{t('parent.d.stepsOf', { done: g.stepsDone, total: g.stepsTotal })}</span></div>
                    <Bar percent={Math.round((100 * g.stepsDone) / g.stepsTotal)} label={g.text} />
                  </div>
                )}
              </li>
            ))}
          </ul>
          {goals.habit && (
            <div className="pd-habit">
              <span className="pd-kicker">{t('parent.d.habit')}</span>
              <p>{goals.habit.text}</p>
              <ol className="pd-dots" aria-label={t('parent.d.habitWeek', { count: goals.habit.count, target: goals.habit.target })}>
                {goals.habit.days.map((d) => <li key={d.day} data-on={d.done || undefined} title={d.day} />)}
              </ol>
              <span className="pd-small">{t('parent.d.habitWeek', { count: goals.habit.count, target: goals.habit.target })}</span>
            </div>
          )}
        </>
      )}
    </Section>
  );
}

function EdmentumSection({ edm, ago }) {
  const { t } = useLocale();
  return (
    <Section icon={BookOpen} tone="navy" title={t('parent.d.edmentum')} aside={edm.syncedAt ? t('parent.d.synced', { when: ago(edm.syncedAt) }) : null}>
      {edm.status !== 'connected' ? (
        <div className="pd-empty"><BookOpen size={20} aria-hidden="true" /><p>{t('parent.d.edmNotConnected')}</p></div>
      ) : (
        <ul className="pd-courses">
          {edm.courses.map((c) => (
            <li key={c.id}>
              <div className="pd-course-head">
                <strong>{c.title}</strong>
                {c.lastActivityAt && <span className="pd-small">{t('parent.d.lastActivity', { when: ago(c.lastActivityAt) })}</span>}
              </div>
              {c.progressPercent !== null && (
                <div className="pd-meter">
                  <div className="pd-meter-head"><span>{t('parent.d.courseProgress')}</span><span>{c.progressPercent}%</span></div>
                  <Bar percent={c.progressPercent} label={`${c.title}: ${t('parent.d.courseProgress')}`} tone="navy" />
                </div>
              )}
              {c.recent.length > 0 && (
                <details className="pd-details">
                  <summary>{t('parent.d.latestResults')}{c.averageScore !== null && <span className="pd-score">{t('parent.d.average', { score: c.averageScore })}</span>}</summary>
                  <ul className="pd-results">
                    {c.recent.map((r) => (
                      <li key={`${r.title}-${r.submittedAt}`}>
                        <span>{r.title}</span>
                        <span className="pd-result-score" data-band={r.percent >= 80 ? 'high' : r.percent >= 60 ? 'mid' : 'low'}>{r.scoreGiven}/{r.scoreMaximum}</span>
                        {r.submittedAt && <span className="pd-small">{ago(r.submittedAt)}</span>}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function CompetencySection({ comp, name }) {
  const { t } = useLocale();
  return (
    <Section icon={Sparkles} tone="magenta" title={t('parent.d.competencies')} aside={t('parent.d.ofTotalShown', { shown: comp.shown, total: comp.total })}>
      <p className="pd-small">{t('parent.d.compIntro', { name })}</p>
      {comp.shown === 0 && <p className="gh-muted">{t('parent.d.compNone')}</p>}
      <ul className="pd-domains">
        {comp.domains.map((d) => (
          <li key={d.id}>
            <details className="pd-details" open={false}>
              <summary>
                <span className="pd-domain-title">{d.title}</span>
                <span className="pd-domain-count">{d.shown}/{d.total}<ChevronDown size={15} aria-hidden="true" className="pd-chevron" /></span>
                <Bar percent={d.percent} label={d.title} tone="magenta" />
              </summary>
              {d.items.length ? (
                <ul className="pd-comp-list">
                  {d.items.map((c) => (
                    <li key={c.id}>
                      <div className="pd-comp-head">
                        <strong>{c.title}</strong>
                        <span className="pd-pill pd-pill-soft">{t('parent.d.compEvidence', { count: c.evidenceCount })}</span>
                        {c.confirmed && <span className="pd-pill"><ShieldCheck size={12} aria-hidden="true" />{t('parent.d.compConfirmed')}</span>}
                      </div>
                      <p className="pd-small">{c.statement}</p>
                    </li>
                  ))}
                </ul>
              ) : <p className="pd-small">{t('parent.d.compDomainNone')}</p>}
            </details>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function ActivitiesSection({ activities }) {
  const { t } = useLocale();
  return (
    <Section icon={FlaskConical} tone="green" title={t('parent.d.activities')} aside={`${activities.done}/${activities.total}`}>
      <ul className="pd-activities">
        {activities.items.map((a) => (
          <li key={a.id} data-done={a.started || undefined}>
            {a.started ? <CircleCheck size={16} aria-hidden="true" /> : <Circle size={16} aria-hidden="true" />}
            <span>{a.label}</span>
            <span className="pd-small">{a.started ? t('parent.d.started') : t('parent.d.notStarted')}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function RecentSection({ recent, ago }) {
  const { t } = useLocale();
  return (
    <Section icon={Clock} tone="purple" title={t('parent.d.recent')}>
      {recent.length ? (
        <ol className="pd-timeline">
          {recent.map((r) => (
            <li key={`${r.type}-${r.at}-${r.text}`} data-type={r.type}>
              <span className="pd-tl-dot" />
              <div>
                <p>{r.text}</p>
                <span className="pd-small">{r.detail} · {ago(r.at)}</span>
              </div>
            </li>
          ))}
        </ol>
      ) : <p className="gh-muted">{t('parent.d.recentNone')}</p>}
    </Section>
  );
}

function PrivacyNote({ name }) {
  const { t } = useLocale();
  return (
    <details className="gh-card pd-privacy">
      <summary><ShieldCheck size={16} aria-hidden="true" />{t('parent.d.privacy', { name })}</summary>
      <div className="pd-privacy-cols">
        <div>
          <span className="pd-kicker"><Eye size={13} aria-hidden="true" /> {t('parent.d.shared')}</span>
          <ul>{SHARED.map((s) => <li key={s}>{s}</li>)}</ul>
        </div>
        <div>
          <span className="pd-kicker"><EyeOff size={13} aria-hidden="true" /> {t('parent.d.notShared', { name })}</span>
          <ul>{NOT_SHARED.map((s) => <li key={s}>{s}</li>)}</ul>
        </div>
      </div>
    </details>
  );
}
