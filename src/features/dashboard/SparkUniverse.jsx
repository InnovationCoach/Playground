import { ArrowRight, MapPin, Star } from 'lucide-react';
import { lazy, Suspense, useMemo, useState } from 'react';
import { hrefFor } from '../../app/routes.js';
import { splitGoals } from './slideModel.js';
import { PILOT_RELEASES } from '../universe/pilot/pilotRegistry.js';
import { ARRIVAL_VIDEOS, cloudinarySceneFrame } from '../universe/explore/arrivalVideos.js';
import { MissionBuilder } from '../universe/builder/MissionBuilder.jsx';
import { reviewedRoutes, allRoutes, routeTime, isReviewedRelease } from '../universe/builder/missionBuilder.js';
const MyUniverseExplorer = lazy(() => import('../universe/explore/MyUniverseExplorer.jsx').then(m => ({ default: m.MyUniverseExplorer })));

const PREVIEWS = [
  { id: 'wind', planetId: 'thalassa', missionId: 'thalassa-wind-survey', routeId: 'guided', frame: 3, title: 'Is the wind worth it?', where: 'Thalassa', description: 'Help the station choose a power plan using a week of wind records.', grades: '6–8', challenge: 2 },
  { id: 'journey-guided', planetId: 'thalassa', missionId: 'spacecraft-journey', routeId: 'guided', frame: 20, title: 'Plan a journey to Ignis', where: 'Thalassa departure station', description: 'Compare travel time and supplies, then recommend a plan.', grades: '6–8', challenge: 2 },
  { id: 'journey-advanced', planetId: 'ignis', missionId: 'spacecraft-journey', routeId: 'advanced', frame: 3, title: 'Plan a journey to Ignis: harder version', where: 'Ignis', description: 'Weigh up the mass, time and power of a spacecraft design.', grades: '9–12', challenge: 4 }
];

// Fixed, decorative star positions: still, never animated, never meaningful.
const STARS = (() => {
  let seed = 7;
  const next = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: 70 }, (_, i) => ({ x: next() * 100, y: next() * 60, r: i % 9 === 0 ? .32 : i % 3 === 0 ? .2 : .13 }));
})();

/**
 * The way into My Universe: enter the explorer, start a mission (one button each)
 * or fit one with Mission Builder, under the learner's own themes and milestones
 * on a still star plate. Milestones are goals they marked achieved themselves.
 */
// The earlier SVG island prototype stays in src/features/universe/ (preview: tests/universe-preview/index.html)
// but is not offered to learners: the approved vision replaced the island with the deep-space explorer.
export function SparkUniverse({ prefs, plan, uid, orgId, onPersonalise, active = true, onOpenActivity, registry = PILOT_RELEASES }) {
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [arrival, setArrival] = useState(null);
  const [missionPlan, setMissionPlan] = useState(null);
  const routes = useMemo(() => reviewedRoutes(registry), [registry]);
  const everyRoute = useMemo(() => allRoutes(registry), [registry]);
  const pending = !registry.every(isReviewedRelease);
  const achieved = splitGoals(plan).completed.slice(0, 6);
  const open = (next, nextPlan = null) => { setArrival(next); setMissionPlan(nextPlan); setExplorerOpen(true); };
  const close = () => { setExplorerOpen(false); setArrival(null); setMissionPlan(null); };
  const timeFor = (x) => routeTime(everyRoute.find((r) => r.mission.id === x.missionId && r.route.id === x.routeId)?.route);
  return <>
    {explorerOpen && <Suspense fallback={<p role="status">Opening My Universe…</p>}>
      <MyUniverseExplorer
        preview={true}
        allowInReviewMissions={true}
        missionRegistry={registry}
        initialArrival={arrival}
        missionPlan={missionPlan}
        viewer={uid && orgId ? { uid, orgId } : null}
        calm={!!prefs.calm}
        active={active}
        onClose={close}
        onOpenActivity={onOpenActivity ? (id, options) => { close(); onOpenActivity(id, options); } : undefined}
      />
    </Suspense>}
    <section className="ig-plate uv-enter" aria-labelledby="uv-enter-title">
      <svg className="uv-enter-art" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        {STARS.map((star, i) => <circle key={i} cx={star.x} cy={star.y} r={star.r} />)}
      </svg>
      <div>
        <h3 id="uv-enter-title">Explore My Universe</h3>
        <p className="sd-caption">Travel through deep space to Lyra Prime. Survey ocean winds on Thalassa, work out journey times, and balance weight and power for Ignis.</p>
      </div>
      <button type="button" className="sd-primary" onClick={() => open(null)}>Enter My Universe <ArrowRight size={17} aria-hidden="true" /></button>
    </section>
    {pending && <p className="sd-notice" role="note">Teachers are still checking these missions. You can try them, but they may change.</p>}
    <ul className="uv-missions" aria-label="Missions">
      {PREVIEWS.map((x) => {
        const video = ARRIVAL_VIDEOS[`${x.missionId}|${x.routeId}`];
        return <li key={x.id} className="uv-mission">
          {video?.src && <div className="uv-mission-figure"><img className="uv-mission-img" src={cloudinarySceneFrame(video.src, x.frame)} alt="" loading="lazy" onError={(event) => { event.currentTarget.parentElement.hidden = true; }} /></div>}
          <div className="uv-mission-body">
            <h3>{x.title}</h3>
            <p className="uv-where"><MapPin size={14} aria-hidden="true" /> {x.where}</p>
            <p>{x.description}</p>
            <p className="uv-facts">Grades {x.grades} · Challenge {x.challenge} of 5{timeFor(x) ? ` · ${timeFor(x)}` : ''}</p>
            <button type="button" className="sd-primary" aria-label={`Start mission: ${x.title}`} onClick={() => open({ planetId: x.planetId, missionId: x.missionId, routeId: x.routeId })}>
              Start <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </li>;
      })}
    </ul>
    <MissionBuilder routes={routes} uid={uid} interests={prefs.interests}
      onStart={(p) => open({ planetId: p.planetId, missionId: p.missionId, routeId: p.routeId }, p)} />
    <section className="ig-universe uv-sky" aria-labelledby="ig-universe-title">
      <svg className="ig-starfield" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        {STARS.map((star, i) => <circle key={i} cx={star.x} cy={star.y} r={star.r} />)}
      </svg>
      <div className="ig-universe-head">
        <span className="sd-eyebrow">Your universe</span>
        <h3 id="ig-universe-title">{prefs.tagline || 'A space that feels like you. Curiosity included.'}</h3>
        <button type="button" className="sd-primary" onClick={onPersonalise}>Choose my atmosphere <ArrowRight size={17} aria-hidden="true" /></button>
      </div>
      <div className="ig-universe-lists">
        <div><h4>My themes</h4>{prefs.interests.length
          ? <ul className="ig-themes">{prefs.interests.map((interest) => <li key={interest}><Star size={13} aria-hidden="true" />{interest}</li>)}</ul>
          : <p className="sd-caption">Pick up to six interests in Personalise to light up your themes.</p>}</div>
        <div><h4>My milestones</h4>{achieved.length
          ? <ul className="ig-themes">{achieved.map((goal) => <li key={goal.id}><Star size={13} aria-hidden="true" fill="currentColor" />{goal.explore}</li>)}</ul>
          : <p className="sd-caption">Goals you mark as done appear here.</p>}
          <small className="ig-note">You marked these as done yourself. They aren’t a grade.</small></div>
      </div>
    </section>
    <a className="sd-link uv-link" href={hrefFor.goals()}>Mark a goal as done in Goal setting <ArrowRight size={16} aria-hidden="true" /></a>
  </>;
}
