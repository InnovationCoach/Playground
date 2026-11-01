import { ChevronRight } from 'lucide-react';
import { missionsForPlanet } from './spacecraftJourney.js';

/** Missions linked to a planet. Drafts appear only in labelled previews until an educator has reviewed them. */
export function MissionList({ planetId, opts, onOpen }) {
  const list = missionsForPlanet(planetId, opts);
  return <div className="mx-missions"><h3>Missions here</h3>
    {!list.length && <p className="mx-muted">No reviewed missions yet. They will appear here later.</p>}
    {list.map((m) => <div key={m.id} className="mx-detail"><strong>{m.title}</strong><p>{m.drivingQuestion}</p>
      {m.status === 'draft' && <p className="mx-muted">Draft · awaiting educator review</p>}
      <button type="button" className="mx-primary" onClick={() => onOpen(m.id)}>Open mission<ChevronRight size={16} aria-hidden="true" /></button></div>)}
  </div>;
}
