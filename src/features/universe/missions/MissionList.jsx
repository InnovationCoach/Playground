import { ChevronRight } from 'lucide-react';
import { missionsForPlanet } from './registry.js';
import { pilotMissionsForPlanet } from '../pilot/missionSession.js';

/**
 * Missions linked to a planet. Pilot missions come only from the trusted registry the
 * explorer was given (published releases in production, fixtures only in previews).
 * A legacy draft with the same ID is replaced by its pilot version, never shown twice.
 */
export function MissionList({ planetId, opts, onOpen }) {
  const pilot = pilotMissionsForPlanet(opts.pilotRegistry, planetId);
  const pilotIds = new Set(pilot.map((p) => p.mission.id));
  const legacy = missionsForPlanet(planetId, opts).filter((m) => !pilotIds.has(m.id));
  const list = [...pilot.map(({ bundle, mission }) => ({ id: mission.id, title: mission.title, question: mission.drivingQuestion, draft: bundle.status !== 'published' })),
    ...legacy.map((m) => ({ id: m.id, title: m.title, question: m.drivingQuestion, draft: m.status === 'draft' }))];
  return <div className="mx-missions"><h3>Missions here</h3>
    {!list.length && <p className="mx-muted">No reviewed missions yet. They will appear here later.</p>}
    {list.map((m) => <div key={m.id} className="mx-detail"><strong>{m.title}</strong><p>{m.question}</p>
      {m.draft && <p className="mx-muted">Draft · awaiting educator review</p>}
      <button type="button" className="mx-primary" onClick={() => onOpen(m.id)}>Open mission<ChevronRight size={16} aria-hidden="true" /></button></div>)}
  </div>;
}
