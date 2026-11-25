import { useState } from 'react';
import { Award, BookOpen, Clock, ExternalLink, GraduationCap, Lock, RefreshCw, Unlock } from 'lucide-react';
import { useEdmentumDashboard } from './useEdmentumDashboard.js';
import {
  getEdmentumClassGradetracker,
  openEdmentumLtiCourse,
  setEdmentumUserResourceNodeStatus
} from './edmentumDashboardService.js';
import './edmentumCards.css';

const DEFAULT_EDMENTUM_PORTAL_URL = 'https://f1.apps.elf.edmentum.com/courseware';

function formatMinutes(seconds) {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) return '0 min';
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem ? `${hrs}h ${rem}m` : `${hrs}h`;
}

function StatusBadge({ status, loading }) {
  const label = loading
    ? 'Syncing…'
    : status === 'connected'
      ? 'Edmentum Live'
      : status === 'sync_failed'
        ? 'Sync paused'
        : 'Not connected';
  return (
    <span className="edm-dash-badge" data-state={loading ? 'unknown' : status}>
      {label}
    </span>
  );
}

/**
 * Student Dashboard Edmentum Cards:
 * 1. Subject Progress Tracker
 * 2. Daily Academic Time
 * 3. Graduated Courses
 */
export function StudentEdmentumCards({ params = {}, edmentum = null } = {}) {
  const internal = useEdmentumDashboard('student', params, { enabled: !edmentum });
  const { data, loading, refresh } = edmentum || internal;
  const subjects = data?.enrolledClasses || [];
  const graduated = data?.graduatedCourses || [];
  const daily = data?.dailyTimeOnTask || [];

  return (
    <section className="edm-dash-section" aria-labelledby="edm-student-heading">
      <div className="edm-dash-head">
        <h3 id="edm-student-heading" className="edm-dash-title">
          <GraduationCap size={18} aria-hidden="true" />
          Academic Courseware Tracker
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <StatusBadge status={data?.providerStatus} loading={loading} />
          <a
            className="edm-refresh-btn"
            href={data?.edmentumPortalUrl || DEFAULT_EDMENTUM_PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (subjects.length > 0) {
                e.preventDefault();
                openEdmentumLtiCourse(subjects[0], data?.edmentumPortalUrl || DEFAULT_EDMENTUM_PORTAL_URL);
              }
            }}
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            Open in Edmentum <ExternalLink size={12} aria-hidden="true" />
          </a>
          <button type="button" className="edm-refresh-btn" onClick={refresh} disabled={loading}>
            <RefreshCw size={12} style={{ marginRight: 4, verticalAlign: '-1px' }} aria-hidden="true" />
            Refresh
          </button>
        </div>
      </div>

      <div className="edm-cards-grid">
        <article className="edm-card">
          <div className="edm-card-head">
            <h4><BookOpen size={16} aria-hidden="true" /> Subject Progress Tracker</h4>
            <span className="edm-card-sub">
              {data.summary?.overallProgressPercent != null ? `${data.summary.overallProgressPercent}% avg` : '—'}
            </span>
          </div>
          {loading ? (
            <p className="edm-card-sub">Loading subject progress…</p>
          ) : subjects.length === 0 ? (
            <p className="edm-card-sub">
              {data.providerStatus === 'connected'
                ? 'No enrolled Edmentum subjects found for your account yet.'
                : 'Subject progress will appear once your Edmentum account is linked.'}
            </p>
          ) : (
            <ul className="edm-list">
              {subjects.map((sub) => (
                <li className="edm-list-item" key={sub.classId}>
                  <div className="edm-row-top">
                    <strong>{sub.courseName || sub.name}</strong>
                    <span>{sub.progressPercent != null ? `${sub.progressPercent}%` : '—'}</span>
                  </div>
                  <div className="edm-bar-track" aria-hidden="true">
                    <div className="edm-bar-fill" style={{ width: `${sub.progressPercent ?? 0}%` }} />
                  </div>
                  <div className="edm-row-meta">
                    <span>
                      {sub.activitiesCompleted != null && sub.activitiesTotal != null
                        ? `${sub.activitiesCompleted}/${sub.activitiesTotal} activities`
                        : 'Activities pending'}
                    </span>
                    <span>
                      {sub.currentGrade != null ? `Grade: ${sub.currentGrade}%` : 'No grade yet'}
                      {' · '}
                      <a
                        href={data?.edmentumPortalUrl || DEFAULT_EDMENTUM_PORTAL_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.preventDefault();
                          openEdmentumLtiCourse(sub, data?.edmentumPortalUrl || DEFAULT_EDMENTUM_PORTAL_URL);
                        }}
                      >
                        Open course
                      </a>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="edm-card">
          <div className="edm-card-head">
            <h4><Clock size={16} aria-hidden="true" /> Daily Academic Time</h4>
            <span className="edm-card-sub">{formatMinutes(data.summary?.totalTimeOnTaskSeconds)} total</span>
          </div>
          {loading ? (
            <p className="edm-card-sub">Loading daily time…</p>
          ) : daily.length === 0 ? (
            <p className="edm-card-sub">No daily time-on-task records recorded in the last 30 days.</p>
          ) : (
            <ul className="edm-list">
              {daily.slice(0, 7).map((d) => (
                <li className="edm-list-item" key={d.date}>
                  <div className="edm-row-top">
                    <strong>{d.date}</strong>
                    <span>{formatMinutes(d.seconds)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="edm-card">
          <div className="edm-card-head">
            <h4><Award size={16} aria-hidden="true" /> Graduated Courses</h4>
            <span className="edm-card-sub">{graduated.length} completed</span>
          </div>
          {loading ? (
            <p className="edm-card-sub">Checking completed courses…</p>
          ) : graduated.length === 0 ? (
            <p className="edm-card-sub">Completed Edmentum courses will appear here as you finish them.</p>
          ) : (
            <ul className="edm-list">
              {graduated.map((g) => (
                <li className="edm-list-item" key={g.classId}>
                  <div className="edm-row-top">
                    <strong>{g.courseName || g.name}</strong>
                    <span>{g.courseGrade != null ? `${g.courseGrade}%` : 'Complete'}</span>
                  </div>
                  {g.endDate && <div className="edm-row-meta"><span>Completed {g.endDate.slice(0, 10)}</span></div>}
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  );
}

/**
 * Coach Dashboard Edmentum Cards:
 * 1. Learner Subject Progress Tracker
 * 2. Daily Academic Time Spent
 * 3. Graduated Courses per Student
 */
export function CoachEdmentumCards({ params = {} } = {}) {
  const { data, loading, refresh } = useEdmentumDashboard('coach', params);
  const [learnerFilter, setLearnerFilter] = useState('');
  const [expandedKey, setExpandedKey] = useState(null);
  const [pacingActivities, setPacingActivities] = useState({});
  const [pacingLoading, setPacingLoading] = useState(false);
  const [pacingNotice, setPacingNotice] = useState('');
  const allLearners = data?.learners || [];
  const q = learnerFilter.trim().toLowerCase();
  const learners = q
    ? allLearners.filter((l) =>
        `${l.fullName || ''} ${l.platoName || ''} ${l.courseName || ''} ${l.className || ''}`.toLowerCase().includes(q)
      )
    : allLearners;
  const graduated = data?.graduatedCourses || [];
  const daily = data?.dailyTimeOnTask || [];

  const handleTogglePacing = async (learner) => {
    const key = `${learner.classId}-${learner.learnerUserId}`;
    if (expandedKey === key) {
      setExpandedKey(null);
      return;
    }
    setExpandedKey(key);
    setPacingNotice('');
    if (!pacingActivities[key]) {
      setPacingLoading(true);
      try {
        const res = await getEdmentumClassGradetracker(learner.classId, {
          learnerUserId: learner.learnerUserId
        });
        setPacingActivities((prev) => ({ ...prev, [key]: res?.activities || [] }));
      } catch (err) {
        setPacingNotice(err?.message || 'Unable to load activities.');
      } finally {
        setPacingLoading(false);
      }
    }
  };

  const handleSetLock = async (learner, resourceNodeId, isLocked) => {
    setPacingNotice('');
    try {
      await setEdmentumUserResourceNodeStatus(learner.classId, learner.learnerUserId, resourceNodeId, isLocked);
      setPacingNotice(isLocked ? 'Activity locked for learner.' : 'Activity unlocked for learner.');
    } catch (err) {
      setPacingNotice(err?.message || 'Unable to update lock status.');
    }
  };

  return (
    <section className="edm-dash-section" aria-labelledby="edm-coach-heading">
      <div className="edm-dash-head">
        <h3 id="edm-coach-heading" className="edm-dash-title">
          <GraduationCap size={18} aria-hidden="true" />
          Edmentum Courseware · {data?.program?.programTitle || 'Academic Progress'}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <StatusBadge status={data?.providerStatus} loading={loading} />
          <button type="button" className="edm-refresh-btn" onClick={refresh} disabled={loading}>
            <RefreshCw size={12} style={{ marginRight: 4, verticalAlign: '-1px' }} aria-hidden="true" />
            Refresh
          </button>
        </div>
      </div>

      <div className="edm-cards-grid">
        <article className="edm-card">
          <div className="edm-card-head">
            <h4><BookOpen size={16} aria-hidden="true" /> Subject Progress Tracker</h4>
            <span className="edm-card-sub">{learners.length} enrollments</span>
          </div>
          {allLearners.length > 0 && (
            <input
              type="search"
              value={learnerFilter}
              onChange={(e) => setLearnerFilter(e.target.value)}
              placeholder="Filter by learner or subject…"
              aria-label="Filter Edmentum learners"
              style={{
                width: '100%',
                padding: '0.35rem 0.6rem',
                borderRadius: 8,
                border: '1px solid rgba(15, 23, 42, 0.14)',
                fontSize: '0.82rem'
              }}
            />
          )}
          {loading ? (
            <p className="edm-card-sub">Loading learner progress…</p>
          ) : learners.length === 0 ? (
            <p className="edm-card-sub">
              {allLearners.length > 0 ? 'No matching learner enrollments.' : 'No Edmentum learner enrollments returned for this program yet.'}
            </p>
          ) : (
            <ul className="edm-list" style={{ maxHeight: 360, overflowY: 'auto', paddingRight: 4 }}>
              {learners.map((l) => {
                const rowKey = `${l.classId}-${l.learnerUserId}`;
                const isExpanded = expandedKey === rowKey;
                const acts = pacingActivities[rowKey] || [];
                return (
                  <li className="edm-list-item" key={rowKey}>
                    <div className="edm-row-top">
                      <strong>{l.fullName || l.platoName || `Learner ${l.learnerUserId}`}</strong>
                      <span>{l.progressPercent != null ? `${l.progressPercent}%` : '—'}</span>
                    </div>
                    <div className="edm-bar-track" aria-hidden="true">
                      <div className="edm-bar-fill" style={{ width: `${l.progressPercent ?? 0}%` }} />
                    </div>
                    <div className="edm-row-meta">
                      <span>{l.courseName || l.className}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span>{l.currentGrade != null ? `Grade: ${l.currentGrade}%` : 'No grade'}</span>
                        <button
                          type="button"
                          className="edm-refresh-btn"
                          onClick={() => handleTogglePacing(l)}
                          style={{ padding: '2px 6px', fontSize: '0.72rem' }}
                        >
                          {isExpanded ? 'Hide pacing' : 'Pacing'}
                        </button>
                      </span>
                    </div>
                    {isExpanded && (
                      <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid rgba(15,23,42,0.08)' }}>
                        {pacingNotice && <p className="edm-card-sub" style={{ marginBottom: 4 }}>{pacingNotice}</p>}
                        {pacingLoading ? (
                          <p className="edm-card-sub">Loading activities…</p>
                        ) : acts.length === 0 ? (
                          <p className="edm-card-sub">No controllable activities found for this enrollment.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {acts.slice(0, 6).map((act) => {
                              const nodeId = act.ResourceNodeId ?? act.ActivityId;
                              if (nodeId == null) return null;
                              return (
                                <div key={nodeId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: '0.76rem' }}>
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {act.ActivityName || act.Name || `Node ${nodeId}`}
                                  </span>
                                  <span style={{ display: 'inline-flex', gap: 4, flexShrink: 0 }}>
                                    <button
                                      type="button"
                                      className="edm-refresh-btn"
                                      title="Unlock for learner"
                                      onClick={() => handleSetLock(l, nodeId, false)}
                                      style={{ padding: '2px 5px', fontSize: '0.7rem' }}
                                    >
                                      <Unlock size={11} aria-hidden="true" />
                                    </button>
                                    <button
                                      type="button"
                                      className="edm-refresh-btn"
                                      title="Lock for learner"
                                      onClick={() => handleSetLock(l, nodeId, true)}
                                      style={{ padding: '2px 5px', fontSize: '0.7rem' }}
                                    >
                                      <Lock size={11} aria-hidden="true" />
                                    </button>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </article>

        <article className="edm-card">
          <div className="edm-card-head">
            <h4><Clock size={16} aria-hidden="true" /> Daily Academic Time</h4>
            <span className="edm-card-sub">Last 14 active days</span>
          </div>
          {loading ? (
            <p className="edm-card-sub">Loading daily learner time…</p>
          ) : daily.length === 0 ? (
            <p className="edm-card-sub">No daily time-on-task records recorded yet.</p>
          ) : (
            <ul className="edm-list">
              {daily.slice(0, 7).map((d) => (
                <li className="edm-list-item" key={d.date}>
                  <div className="edm-row-top">
                    <strong>{d.date}</strong>
                    <span>{formatMinutes(d.seconds)}</span>
                  </div>
                  <div className="edm-row-meta">
                    <span>{d.activeLearners} active {d.activeLearners === 1 ? 'learner' : 'learners'}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="edm-card">
          <div className="edm-card-head">
            <h4><Award size={16} aria-hidden="true" /> Graduated Courses</h4>
            <span className="edm-card-sub">{graduated.length} completed</span>
          </div>
          {loading ? (
            <p className="edm-card-sub">Checking graduated courses…</p>
          ) : graduated.length === 0 ? (
            <p className="edm-card-sub">No graduated courses recorded in this program yet.</p>
          ) : (
            <ul className="edm-list">
              {graduated.slice(0, 8).map((g) => (
                <li className="edm-list-item" key={`${g.classId}-${g.learnerUserId}`}>
                  <div className="edm-row-top">
                    <strong>{g.learnerName}</strong>
                    <span>{g.courseGrade != null ? `${g.courseGrade}%` : 'Complete'}</span>
                  </div>
                  <div className="edm-row-meta">
                    <span>{g.courseName || g.className}</span>
                    {g.endDate && <span>{g.endDate.slice(0, 10)}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  );
}

/**
 * Admin Dashboard Edmentum Cards:
 * 1. Edmentum Account & Program Summary
 * 2. Graduated Courses per Student
 */
export function AdminEdmentumCards({ params = {} } = {}) {
  const { data, loading, refresh } = useEdmentumDashboard('admin', params);
  const graduated = data.graduatedCourses || [];
  const summary = data.summary || {};

  return (
    <section className="edm-dash-section" aria-labelledby="edm-admin-heading">
      <div className="edm-dash-head">
        <h3 id="edm-admin-heading" className="edm-dash-title">
          <GraduationCap size={18} aria-hidden="true" />
          Edmentum Courseware Overview
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <StatusBadge status={data.providerStatus} loading={loading} />
          <button type="button" className="edm-refresh-btn" onClick={refresh} disabled={loading}>
            <RefreshCw size={12} style={{ marginRight: 4, verticalAlign: '-1px' }} aria-hidden="true" />
            Refresh
          </button>
        </div>
      </div>

      <div className="edm-cards-grid">
        <article className="edm-card">
          <div className="edm-card-head">
            <h4><BookOpen size={16} aria-hidden="true" /> Programs & Learners</h4>
          </div>
          {loading ? (
            <p className="edm-card-sub">Loading Edmentum summary…</p>
          ) : (
            <div className="edm-kpi-row">
              <div className="edm-kpi"><strong>{summary.programCount ?? 0}</strong><span>Programs</span></div>
              <div className="edm-kpi"><strong>{summary.totalClasses ?? 0}</strong><span>Classes</span></div>
              <div className="edm-kpi"><strong>{summary.learnerCount ?? 0}</strong><span>Learners</span></div>
              <div className="edm-kpi"><strong>{formatMinutes(summary.totalTimeOnSystemSeconds)}</strong><span>System time</span></div>
            </div>
          )}
        </article>

        <article className="edm-card">
          <div className="edm-card-head">
            <h4><Award size={16} aria-hidden="true" /> Graduated Courses</h4>
            <span className="edm-card-sub">{graduated.length} completed</span>
          </div>
          {loading ? (
            <p className="edm-card-sub">Checking graduated courses…</p>
          ) : graduated.length === 0 ? (
            <p className="edm-card-sub">No graduated courses recorded in this program yet.</p>
          ) : (
            <ul className="edm-list">
              {graduated.slice(0, 10).map((g) => (
                <li className="edm-list-item" key={`${g.classId}-${g.learnerUserId}`}>
                  <div className="edm-row-top">
                    <strong>{g.learnerName}</strong>
                    <span>{g.courseName || g.className}</span>
                  </div>
                  {g.endDate && <div className="edm-row-meta"><span>Completed {g.endDate.slice(0, 10)}</span></div>}
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  );
}
