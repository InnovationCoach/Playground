import { ArrowRight, MapPin } from 'lucide-react';
import { lazy, Suspense, useMemo, useState } from 'react';
import { PUBLISHED_PILOT_RELEASES } from '../universe/pilot/publishedRegistry.js';
import { MissionCreator } from '../universe/creator/MissionCreator.jsx';
import { reviewedRoutes, routeTime } from '../universe/creator/missionCreator.js';
const MyUniverseExplorer = lazy(() => import('../universe/explore/MyUniverseExplorer.jsx').then(m => ({ default: m.MyUniverseExplorer })));

const PREVIEWS = [
  { id: 'wind', planetId: 'thalassa', missionId: 'thalassa-wind-survey', routeId: 'guided', title: 'Is the wind worth it?', where: 'Thalassa', description: 'Help the station choose a power plan using a week of wind records.', grades: '6–8', challenge: 2 },
  { id: 'journey-guided', planetId: 'thalassa', missionId: 'spacecraft-journey', routeId: 'guided', title: 'Plan a journey to Ignis', where: 'Thalassa departure station', description: 'Compare travel time and supplies, then recommend a plan.', grades: '6–8', challenge: 2 },
  { id: 'journey-advanced', planetId: 'ignis', missionId: 'spacecraft-journey', routeId: 'advanced', title: 'Plan a journey to Ignis: harder version', where: 'Ignis', description: 'Weigh up the mass, time and power of a spacecraft design.', grades: '9–12', challenge: 4 }
];

/**
 * My Universe is a place to enter, not a second dashboard: each mission preview
 * has one start button, the AI Creator fits a mission to the learner, and goals,
 * badges and stats stay in My Quests and My Progress.
 */
// The earlier SVG island prototype stays in src/features/universe/ (preview: tests/universe-preview/index.html)
// but is not offered to learners: the approved vision replaced the island with the deep-space explorer.
export function SparkUniverse({ prefs, uid, orgId, active = true, onOpenActivity }) {
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [arrival, setArrival] = useState(null);
  const [plan, setPlan] = useState(null);
  const routes = useMemo(() => reviewedRoutes(PUBLISHED_PILOT_RELEASES), []);
  const open = (next, nextPlan = null) => { setArrival(next); setPlan(nextPlan); setExplorerOpen(true); };
  const close = () => { setExplorerOpen(false); setArrival(null); setPlan(null); };
  const timeFor = (x) => routeTime(routes.find((r) => r.mission.id === x.missionId && r.route.id === x.routeId)?.route);
  return <>
    {explorerOpen && <Suspense fallback={<p role="status">Opening My Universe…</p>}>
      <MyUniverseExplorer
        preview={true}
        allowInReviewMissions={true}
        missionRegistry={PUBLISHED_PILOT_RELEASES}
        initialArrival={arrival}
        missionPlan={plan}
        viewer={uid && orgId ? { uid, orgId } : null}
        calm={!!prefs.calm}
        active={active}
        onClose={close}
        onOpenActivity={onOpenActivity ? (id, options) => { close(); onOpenActivity(id, options); } : undefined}
      />
    </Suspense>}
    <p className="sd-intro">Pick a mission and start. You’ll travel to the planet and work on a real problem.</p>
    <ul className="uv-missions" aria-label="Missions">
      {PREVIEWS.map((x) => <li key={x.id} className="uv-mission">
        <h3>{x.title}</h3>
        <p className="uv-where"><MapPin size={14} aria-hidden="true" /> {x.where}</p>
        <p>{x.description}</p>
        <p className="uv-facts">Grades {x.grades} · Challenge {x.challenge} of 5{timeFor(x) ? ` · ${timeFor(x)}` : ''}</p>
        <button type="button" className="sd-primary" aria-label={`Start mission: ${x.title}`} onClick={() => open({ planetId: x.planetId, missionId: x.missionId, routeId: x.routeId })}>
          Start <ArrowRight size={16} aria-hidden="true" />
        </button>
      </li>)}
    </ul>
    <MissionCreator routes={routes} uid={uid} interests={prefs.interests}
      onStart={(p) => open({ planetId: p.planetId, missionId: p.missionId, routeId: p.routeId }, p)} />
    <button type="button" className="sd-text-button uv-explore" onClick={() => open(null)}>Or explore the whole universe <ArrowRight size={16} aria-hidden="true" /></button>
  </>;
}
