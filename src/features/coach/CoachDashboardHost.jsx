import { LeavePanel } from '../admin/pilot/PilotOperations.jsx';
import { useEffect, useRef, useState } from 'react';
import { Sparkles, Eye, Sun, Moon, Users, KeyRound, Compass, CalendarOff } from 'lucide-react';
import { StudentInviteDialog } from './StudentInviteDialog.jsx';
import { CoachWorkspace } from './CoachWorkspace.jsx';
import CoachDashboard from '../../components/Coach/CoachDashboard.js';
import { ClassProgramsPanel } from './ClassProgramsPanel.jsx';
import { CoachUniverseSubmissions } from './universe/CoachUniverseSubmissions.jsx';
import { useTheme } from '../../app/theme/ThemeProvider.jsx';
import { saveThemePreference } from '../../auth.js';
import { hrefFor } from '../../app/routes.js';

/**
 * Hosts the existing CoachDashboard class inside React.
 *
 * CoachDashboard is ~1,400 lines of imperative rendering that was hardened in
 * Phase 0 (class-scoped queries, no fabricated students). Rewriting it as
 * components is Phase 2 work - it will be rebuilt against the content model
 * anyway - so React mounts it and stays out of its way.
 *
 * React must not touch the container's children: the class owns that subtree.
 * "My classes" (programs and join codes) is React and sits above it, outside
 * that subtree.
 */
function ManagementTools({ coachUser, onAddStudent, classId, onClassChange }) {
  const containerRef = useRef(null);
  const instanceRef = useRef(null);

  const coachUid = coachUser?.uid;

  useEffect(() => {
    if (!containerRef.current) return;

    let disposed = false;

    // Clear previous innerHTML before initiating new dashboard instance
    containerRef.current.innerHTML = '';

    const dashboard = new CoachDashboard({
      containerId: containerRef.current.id,
      coachUser,
      onAddStudent,
      classId,
      onClassChange
    });
    instanceRef.current = dashboard;

    dashboard.init().catch((err) => {
      if (disposed) return;
      console.error('[Coach] Could not initialise dashboard:', err);
      if (containerRef.current) {
        containerRef.current.innerHTML =
          '<div style="padding:2rem;color:#f8fafc;">Could not load the coach dashboard. Please refresh.</div>';
      }
    });

    return () => {
      disposed = true;
      if (instanceRef.current?.destroy) {
        instanceRef.current.destroy();
      }
      instanceRef.current = null;
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [coachUid]);

  return <div id="coach-dashboard-card" ref={containerRef} style={{ minHeight: '600px', width: '100%' }} />;
}

const HOST_TABS = [
  ['learners', 'Learners', Users],
  ['classes', 'Classes & join codes', KeyRound],
  ['reviews', 'Mission reviews', Compass],
  ['leave', 'Day-off requests', CalendarOff]
];

export function CoachDashboardHost({ coachUser, orgId = null }) {
  const effectiveOrgId = orgId || coachUser?.orgId || null;
  const { effectiveTheme, setUserTheme } = useTheme();
  const [tab, setTab] = useState('learners');
  const [management, setManagement] = useState(false);
  const [invite, setInvite] = useState(false);
  const [classId, setClassId] = useState('all');
  const [rosterVersion, setRosterVersion] = useState(0);

  return (
    <div className="cd-host-root">
      <div className="cd-host-header" style={{ maxWidth: 1400, margin: '0 auto', padding: '1.25rem 2rem 0' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1rem 1.25rem',
          background: 'var(--gh-surface)',
          border: '1px solid var(--gh-border)',
          borderRadius: 16,
          boxShadow: 'var(--gh-shadow-sm)'
        }}>
          <div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--gh-purple)'
            }}>
              <Sparkles size={14} /> Coach Mentorship Hub
            </span>
            <h1 style={{ margin: '0.2rem 0 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--gh-heading)' }}>
              Coach dashboard
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="gh-btn gh-btn-ghost"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', border: '1px solid var(--gh-border)' }}
              onClick={() => {
                const next = effectiveTheme === 'dark' ? 'light' : 'dark';
                setUserTheme(next);
                if (coachUser?.uid) saveThemePreference(coachUser.uid, next).catch(() => {});
              }}
              aria-label={`Switch to ${effectiveTheme === 'dark' ? 'Light' : 'Dark'} mode`}
              title={`Switch to ${effectiveTheme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {effectiveTheme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              <span>{effectiveTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <a
              href={hrefFor.spark()}
              className="gh-btn gh-btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
            >
              <Sparkles size={15} /> Personalized Program Maker
            </a>
            <a
              href={hrefFor.pbl('programs')}
              className="gh-btn gh-btn-ghost"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', border: '1px solid var(--gh-border)' }}
            >
              <Eye size={15} /> Program Library
            </a>
          </div>
        </div>
      </div>

      <nav className="cw-sections" aria-label="Coach dashboard areas" style={{ maxWidth: 1360, margin: '12px auto 0', padding: '0 20px', flexWrap: 'wrap' }}>
        {HOST_TABS.map(([id, label, Icon]) => (
          <button key={id} aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}>
            <Icon size={18} aria-hidden="true" />{label}
          </button>
        ))}
      </nav>

      {tab === 'classes' && <ClassProgramsPanel coachUser={coachUser} />}
      {tab === 'reviews' && <CoachUniverseSubmissions coachUser={coachUser} orgId={effectiveOrgId} />}
      {tab === 'leave' && (
        <div className="gh-card" style={{ margin: '16px auto', padding: '1rem 1.25rem', maxWidth: 1360 }}>
          <LeavePanel />
        </div>
      )}
      {invite && <StudentInviteDialog initialClassId={classId} onClose={() => setInvite(false)} onCreated={() => setRosterVersion(n => n + 1)} />}
      {/* Stays mounted when hidden, so changing tabs does not refetch every learner. */}
      <div hidden={tab !== 'learners'}>
        {management ? (
          <>
            <div className="cw-management" style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 2rem' }}>
              <button className="gh-btn gh-btn-ghost" onClick={() => setManagement(false)}>← Back to progress overview</button>
              <p role="status">Class management tools. Select one assigned class before adding a task or assignment. Unavailable records are marked explicitly.</p>
            </div>
            <ManagementTools classId={classId} onClassChange={setClassId} key={rosterVersion} coachUser={coachUser} onAddStudent={() => setInvite(true)} />
          </>
        ) : (
          <CoachWorkspace initialClassId={classId} onClassChange={setClassId} coachUser={coachUser} rosterVersion={rosterVersion} onAddStudent={() => setInvite(true)} onManagement={() => setManagement(true)} />
        )}
      </div>
    </div>
  );
}

