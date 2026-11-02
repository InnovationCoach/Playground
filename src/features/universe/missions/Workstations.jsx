import { ChevronRight, FlaskConical, Compass } from 'lucide-react';
import { visibleMission } from './registry.js';
import { scenarioInfo } from '../../activities/hexGrid/scenarioInfo.js';

/**
 * Workstations at a surface location: a mission (opens the mission dialog) or a
 * simulation scenario (opens the full activity, e.g. Project Hex-Grid). Drafts
 * stay hidden outside labelled previews; unknown ids are never shown.
 */
export function Workstations({ location, opts, onOpenMission, onOpenActivity }) {
  const items = (location.workstations || []).map((w) => {
    if (w.kind === 'mission') { const m = visibleMission(w.id, opts); return m && { key: `m-${m.id}`, kind: 'Mission', title: m.title, summary: m.drivingQuestion, draft: m.status === 'draft', Icon: Compass, open: () => onOpenMission(m.id) }; }
    if (w.kind === 'simulation') {
      const s = scenarioInfo(w.id);
      if (!s || (s.status === 'draft' && !opts.preview)) return null;
      return { key: `s-${s.id}`, kind: 'Simulation', title: s.title, summary: s.summary, draft: s.status === 'draft', Icon: FlaskConical, open: onOpenActivity ? () => onOpenActivity(s.activityId, { scenario: s.id }) : null };
    }
    return null;
  }).filter(Boolean);
  if (!items.length) return <p className="mx-muted">Workstations and projects here are coming later.</p>;
  return <div className="mx-workstations"><h4>Workstations</h4>
    {items.map((it) => <div key={it.key} className="mx-workstation">
      <span className="mx-eyebrow"><it.Icon size={13} aria-hidden="true" /> {it.kind}{it.draft ? ' · Draft, awaiting educator review' : ''}</span>
      <strong>{it.title}</strong><p>{it.summary}</p>
      {it.open ? <button type="button" className="mx-primary" onClick={it.open}>{it.kind === 'Simulation' ? 'Open simulation' : 'Open mission'}<ChevronRight size={16} aria-hidden="true" /></button>
        : <p className="mx-muted">Opens inside the WeLearn SPARK app.</p>}
    </div>)}
  </div>;
}
