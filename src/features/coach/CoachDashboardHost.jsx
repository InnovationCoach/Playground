import { useEffect, useRef } from 'react';
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
export function CoachDashboardHost({ coachUser }) {
  const containerRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || instanceRef.current) return;

    let disposed = false;

    const dashboard = new CoachDashboard({
      containerId: containerRef.current.id,
      coachUser
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
      // The class renders by assigning innerHTML, so clearing the node is the
      // whole teardown. Listeners live on the replaced children.
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [coachUser]);

  return <div id="coach-dashboard-card" ref={containerRef} />;
}
