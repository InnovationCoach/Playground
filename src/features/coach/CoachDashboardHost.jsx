import { LeavePanel } from '../admin/pilot/PilotOperations.jsx';
import { useEffect, useRef, useState } from 'react';
import { StudentInviteDialog } from './StudentInviteDialog.jsx';
import { CoachWorkspace } from './CoachWorkspace.jsx';
import CoachDashboard from '../../components/Coach/CoachDashboard.js';

/**
 * Hosts the existing CoachDashboard class inside React.
 *
 * CoachDashboard is ~1,400 lines of imperative rendering that was hardened in
 * Phase 0 (class-scoped queries, no fabricated students). Rewriting it as
 * components is Phase 2 work - it will be rebuilt against the content model
 * anyway - so React mounts it and stays out of its way.
 *
 * React must not touch the container's children: the class owns that subtree.
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
      instanceRef.current = null;
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [coachUid]);

  return <div id="coach-dashboard-card" ref={containerRef} style={{ minHeight: '600px', width: '100%' }} />;
}

export function CoachDashboardHost({ coachUser }) {
  const [management, setManagement] = useState(false);
  const [invite, setInvite] = useState(false);
  const [classId, setClassId] = useState('all');
  const [rosterVersion, setRosterVersion] = useState(0);
  return <>
    <div className="gh-app" style={{ padding: '0 20px', maxWidth: 1240, margin: '0 auto' }}>
      <details className="gh-card" style={{ margin: '16px 0', padding: '1rem 1.25rem' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem', color: 'var(--gh-heading)' }}>
          Day-off requests · request leave and track responses
        </summary>
        <div style={{ marginTop: '1rem' }}>
          <LeavePanel />
        </div>
      </details>
    </div>
    {invite && <StudentInviteDialog initialClassId={classId} onClose={() => setInvite(false)} onCreated={() => setRosterVersion(n => n + 1)} />}
    {management ? <>
    <div className="gh-app cw-management"><button className="gh-btn gh-btn-ghost" onClick={() => setManagement(false)}>← Back to progress overview</button><p role="status">Class management tools. Select one assigned class before adding a task or assignment. Unavailable records are marked explicitly.</p></div>
    <ManagementTools classId={classId} onClassChange={setClassId} key={rosterVersion} coachUser={coachUser} onAddStudent={() => setInvite(true)} />
    </> : <CoachWorkspace initialClassId={classId} onClassChange={setClassId} coachUser={coachUser} rosterVersion={rosterVersion} onAddStudent={() => setInvite(true)} onManagement={() => setManagement(true)} />}
  </>;
}

