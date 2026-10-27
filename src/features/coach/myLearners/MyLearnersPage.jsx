import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, Users, ArrowRight, CircleAlert, UploadCloud } from 'lucide-react';
import { useLocale } from '../../../app/i18n/LocaleProvider.jsx';
import { hrefFor } from '../../../app/routes.js';
import { dayKey } from '../../goals/goalPlan.js';
import { useMyLearners } from './useMyLearners.js';
import { loadAllRecords, hasDeviceRecords, migrateDeviceRecords } from './coachRecordsStore.js';
import { buildLearner, filterLearners, statusCounts, FILTERS } from './myLearnersModel.js';
import { StatusBadge, ReasonText, REASON_TAB, NotAvailable, Empty, DeviceStoreNote, NextCell, useDay } from './ui.jsx';
import { LearnerProfile } from './LearnerProfile.jsx';
import { ParentReport } from './ParentReport.jsx';
import '../../admin/admin.css';
import './myLearners.css';

const PAGE = 50;
const ATTENTION_SHOWN = 5;

/**
 * My Learners: the coach's home. One question per screen:
 *   home     - who needs me, and why?
 *   profile  - what has this learner shown, and what do we do next?
 *   report   - what do I tell the parents, from the records?
 * The roster loads once here and is shared by all three.
 */
export function MyLearnersPage({ coachUser, route, navigate }) {
  const data = useMyLearners();
  const [recordsVersion, setRecordsVersion] = useState(0);
  const today = dayKey();

  useEffect(() => {
    const bump = () => setRecordsVersion((v) => v + 1);
    window.addEventListener('welearn-coach-records', bump);
    window.addEventListener('storage', bump);
    return () => {
      window.removeEventListener('welearn-coach-records', bump);
      window.removeEventListener('storage', bump);
    };
  }, []);

  const learners = useMemo(() => {
    const records = loadAllRecords(coachUser.uid, data.raw.map((r) => r.user.uid));
    return data.raw.map((r) => buildLearner(r, records[r.user.uid], { assignments: data.assignments, classes: data.classes, courses: data.courses, today }));
  }, [data.raw, data.assignments, data.classes, data.courses, coachUser.uid, recordsVersion, today]); // eslint-disable-line react-hooks/exhaustive-deps

  if (route?.page === 'learner' || route?.page === 'report') {
    const learner = learners.find((l) => l.uid === route.uid);
    const raw = data.raw.find((r) => r.user.uid === route.uid);
    if (data.status === 'loading') return <div className="gh-page ml-page"><Loading /></div>;
    if (!learner) return <div className="gh-page ml-page"><NotYours navigate={navigate} status={data.status} /></div>;
    return route.page === 'report'
      ? <ParentReport coachUser={coachUser} learner={learner} navigate={navigate} today={today} />
      : <LearnerProfile coachUser={coachUser} learner={learner} raw={raw} classes={data.classes} assignmentsFailed={data.assignmentsFailed}
                        tab={route.tab} navigate={navigate} today={today} reload={data.reload} />;
  }
  return <Home data={data} learners={learners} navigate={navigate} coachUser={coachUser} />;
}

function Home({ data, learners, navigate, coachUser }) {
  const { t, formatDate } = useLocale();
  const day = useDay();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [classId, setClassId] = useState('all');
  const [shown, setShown] = useState(PAGE);
  const [hasLocal, setHasLocal] = useState(() => hasDeviceRecords(coachUser?.uid));
  const [migrating, setMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState(null);

  const handleMigrate = async () => {
    setMigrating(true);
    const res = await migrateDeviceRecords(coachUser?.uid);
    setMigrating(false);
    setHasLocal(false);
    setMigrateResult(res);
    data.reload();
  };

  const inClass = useMemo(() => (classId === 'all' ? learners : learners.filter((l) => l.classIds.includes(classId))), [learners, classId]);
  const counts = useMemo(() => statusCounts(inClass), [inClass]);
  const list = useMemo(() => filterLearners(learners, { query, filter, classId }), [learners, query, filter, classId]);
  const attention = useMemo(() => filterLearners(inClass, { filter: 'attention' }), [inClass]);
  useEffect(() => { setShown(PAGE); }, [query, filter, classId]);

  const open = (uid, tab) => navigate(hrefFor.coachLearner(uid, tab));
  const busy = data.status === 'loading' || data.status === 'refreshing';

  return (
    <div className="gh-page ml-page">
      <div className="gh-page-head">
        <div>
          <h1>{t('ml.title')}</h1>
          {data.status === 'ready' && (
            <p className="gh-sub">{t('ml.subtitle', { count: learners.length, classes: data.classes.map((c) => c.name || c.id).join(', ') })}</p>
          )}
        </div>
        <div className="ml-head-side">
          {data.loadedAt && <small className="gh-muted">{t('ml.updated', { time: formatDate(new Date(data.loadedAt), { timeStyle: 'short' }) })}</small>}
          <button type="button" className="gh-btn gh-btn-sm" onClick={data.reload} disabled={busy}>
            <RefreshCw size={15} aria-hidden="true" className={data.status === 'refreshing' ? 'ml-spin' : ''} />{t('ml.refresh')}
          </button>
        </div>
      </div>

      {hasLocal && (
        <div className="gh-card ml-migration-banner" style={{ background: 'var(--card-bg)', border: '1px solid var(--primary)', padding: '0.85rem 1.25rem', borderRadius: '8px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <UploadCloud size={20} color="var(--primary)" aria-hidden="true" />
            <div>
              <strong>Move records from this device</strong>
              <p className="gh-sub" style={{ margin: 0, fontSize: '0.85rem' }}>You have coaching records stored on this device. Move them to WeLearn Cloud so they sync across devices and allow co-coach collaboration.</p>
            </div>
          </div>
          <button type="button" className="gh-btn gh-btn-primary gh-btn-sm" onClick={handleMigrate} disabled={migrating}>
            {migrating ? 'Moving to Cloud...' : 'Move to WeLearn Cloud'}
          </button>
        </div>
      )}
      {migrateResult && (
        <div className="gh-card" style={{ background: 'var(--card-bg)', border: '1px solid #22c55e', padding: '0.75rem 1.25rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
          <p style={{ margin: 0, color: '#22c55e', fontSize: '0.85rem' }}>
            ✓ Successfully moved {migrateResult.count} records for {migrateResult.learnersCount} learner(s) to WeLearn Cloud. Device storage cleared.
          </p>
        </div>
      )}

      {data.status === 'loading' && <Loading />}
      {data.status === 'no-classes' && (
        <div className="gh-card"><Empty icon={Users} title={t('ml.noClasses.title')} body={t('ml.noClasses.body')} /></div>
      )}
      {data.status === 'error' && (
        <div className="gh-card">
          <Empty icon={CircleAlert} title={t('ml.error.title')} body={t('ml.error.body', { error: data.error })}
                 action={<button type="button" className="gh-btn" onClick={data.reload}>{t('ml.tryAgain')}</button>} />
        </div>
      )}

      {(data.status === 'ready' || data.status === 'refreshing') && (
        <>
          <section className="ml-attention" aria-labelledby="ml-attention-h">
            <div className="ml-section-head">
              <h2 id="ml-attention-h">{t('ml.attention.title')}</h2>
              <span className="gh-count">{attention.length}</span>
            </div>
            {!learners.length ? null : !attention.length ? (
              <p className="ml-quiet">{t('ml.attention.none')}</p>
            ) : (
              <ul className="ml-attention-list">
                {attention.slice(0, ATTENTION_SHOWN).map((l) => (
                  <li key={l.uid} className={l.status.urgent ? 'is-urgent' : ''}>
                    <StatusBadge status={l.status} />
                    <a className="ml-name" href={hrefFor.coachLearner(l.uid)}>{l.name}</a>
                    <span className="ml-why"><ReasonText reason={l.reasons[0]} />
                      {l.reasons.length > 1 && <span className="gh-muted"> {t('ml.moreReasons', { count: l.reasons.length - 1 })}</span>}
                    </span>
                    <button type="button" className="gh-btn gh-btn-sm" onClick={() => open(l.uid, REASON_TAB[l.reasons[0].code])}
                            aria-label={t(`ml.action.${l.reasons[0].code}`) + ': ' + l.name}>
                      {t(`ml.action.${l.reasons[0].code}`)}<ArrowRight size={14} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {attention.length > ATTENTION_SHOWN && (
              <button type="button" className="gh-link-btn ml-more" onClick={() => setFilter('attention')}>
                {t('ml.attention.showAll', { count: attention.length })}
              </button>
            )}
          </section>

          <section className="gh-card gh-table-card ml-table-card" aria-labelledby="ml-table-h">
            <h2 id="ml-table-h" className="gh-visually-hidden ml-sr">{t('ml.table.title')}</h2>
            <div className="gh-toolbar ml-toolbar">
              <div className="gh-input-icon gh-grow">
                <Search size={16} aria-hidden="true" />
                <input className="gh-input" type="search" value={query} onChange={(e) => setQuery(e.target.value)}
                       placeholder={t('ml.search')} aria-label={t('ml.search')} />
              </div>
              {data.classes.length > 1 && (
                <select className="gh-input gh-select gh-fixed" value={classId} onChange={(e) => setClassId(e.target.value)} aria-label={t('ml.class')}>
                  <option value="all">{t('ml.allClasses')}</option>
                  {data.classes.map((c) => <option key={c.id} value={c.id}>{c.name || c.id}</option>)}
                </select>
              )}
              <div className="ml-filters" role="radiogroup" aria-label={t('ml.filter')}>
                {FILTERS.map((f) => (
                  <button key={f} type="button" role="radio" aria-checked={filter === f} onClick={() => setFilter(f)}>
                    {t(`ml.filter.${f}`)} <span className="ml-filter-n">{counts[f]}</span>
                  </button>
                ))}
              </div>
            </div>

            {!learners.length ? (
              <Empty icon={Users} title={t('ml.noLearners.title')} body={t('ml.noLearners.body')} />
            ) : !list.length ? (
              <Empty icon={Search} title={t('ml.noMatch.title')} body={t('ml.noMatch.body')}
                     action={<button type="button" className="gh-btn gh-btn-sm" onClick={() => { setQuery(''); setFilter('all'); }}>{t('ml.clearFilters')}</button>} />
            ) : (
              <div className="gh-table-wrap">
                <table className="gh-table ml-table">
                  <thead>
                    <tr>
                      <th scope="col">{t('ml.col.name')}</th>
                      <th scope="col">{t('ml.col.project')}</th>
                      <th scope="col">{t('ml.col.academic')}</th>
                      <th scope="col">{t('ml.col.next')}</th>
                      <th scope="col">{t('ml.col.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.slice(0, shown).map((l) => (
                      <tr key={l.uid} onClick={(e) => { if (!e.target.closest('a,button')) open(l.uid); }}>
                        <td>
                          <a className="ml-name" href={hrefFor.coachLearner(l.uid)}>{l.name}</a>
                          <div className="ml-cell-sub">{[l.yearLevel, ...l.classNames].filter(Boolean).join(' · ')}
                            {l.accountStatus !== 'active' && <span className="gh-badge gh-badge-pending ml-acct">{t(`status.${l.accountStatus}`)}</span>}
                          </div>
                        </td>
                        <td data-label={t('ml.col.project')}>
                          {l.currentProjectTitle
                            ? <span className="ml-clamp">{l.currentProjectTitle}</span>
                            : l.currentProjectKind === 'term' ? <span className="ml-cell-sub">{t('ml.projectNoTitle')}</span>
                            : <NotAvailable />}
                          {l.currentStage && <div className="ml-cell-sub">{t('ml.stage', { stage: l.currentStage })}</div>}
                        </td>
                        <td data-label={t('ml.col.academic')}>
                          <NotAvailable />
                          <div className="ml-cell-sub">{t('ml.academic.notConnectedShort')}</div>
                        </td>
                        <td data-label={t('ml.col.next')}><NextCell next={l.next} day={day} /></td>
                        <td>
                          <StatusBadge status={l.status} />
                          {l.reasons[0] && <div className="ml-cell-sub ml-clamp"><ReasonText reason={l.reasons[0]} /></div>}
                          {l.readFailed && <div className="ml-cell-sub">{t('ml.readFailed')}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {list.length > shown && (
              <div className="ml-table-foot">
                <span className="gh-muted">{t('ml.showing', { shown, total: list.length })}</span>
                <button type="button" className="gh-btn gh-btn-sm" onClick={() => setShown((s) => s + PAGE)}>{t('ml.showMore')}</button>
              </div>
            )}
          </section>
          <DeviceStoreNote />
        </>
      )}
    </div>
  );
}

function Loading() {
  const { t } = useLocale();
  return (
    <div className="gh-card ml-loading" role="status" aria-live="polite">
      <span className="gh-visually-hidden ml-sr">{t('ml.loading')}</span>
      {[0, 1, 2, 3].map((i) => <div key={i} className="gh-skel" style={{ height: 14, width: `${88 - i * 12}%`, margin: '0.9rem 0' }} />)}
    </div>
  );
}

function NotYours({ navigate, status }) {
  const { t } = useLocale();
  return (
    <div className="gh-card">
      <Empty icon={Users} title={t('ml.notFound.title')} body={status === 'error' ? t('ml.error.title') : t('ml.notFound.body')}
             action={<button type="button" className="gh-btn" onClick={() => navigate(hrefFor.coach())}>{t('ml.back')}</button>} />
    </div>
  );
}
