import { ArrowRight, Gamepad2, Bot, Star, Compass } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import { hrefFor } from '../../app/routes.js';
import { splitGoals } from './slideModel.js';
import { PUBLISHED_PILOT_RELEASES } from '../universe/pilot/publishedRegistry.js';
const MyUniverseExplorer = lazy(() => import('../universe/explore/MyUniverseExplorer.jsx').then(m => ({ default: m.MyUniverseExplorer })));

const EXPEDITIONS = [
  { id: 'wind', planetId: 'thalassa', missionId: 'thalassa-wind-survey', routeId: 'guided', title: 'Wind energy estimate', where: 'Thalassa', description: 'Help Thalassa choose a power plan.', grades: '6–8', challenge: 2 },
  { id: 'journey-guided', planetId: 'thalassa', missionId: 'spacecraft-journey', routeId: 'guided', title: 'Journey timing', where: 'Thalassa departure station', description: 'Compare travel time and supplies for Ignis.', grades: '6–8', challenge: 2 },
  { id: 'journey-advanced', planetId: 'ignis', missionId: 'spacecraft-journey', routeId: 'advanced', title: 'Mass and power tradeoffs', where: 'Ignis', description: 'Balance the expedition’s mass, time and power.', grades: '9–11', challenge: 4 }
];

// Fixed, decorative star positions: still, never animated, never meaningful.
const STARS = (() => {
  let seed = 7;
  const next = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: 70 }, (_, i) => ({ x: next() * 100, y: next() * 60, r: i % 9 === 0 ? .32 : i % 3 === 0 ? .2 : .13 }));
})();

/** Personal themes and self-marked milestones on a still star plate, plus clearly inactive future bays. */
// The earlier SVG island prototype stays in src/features/universe/ (preview: tests/universe-preview/index.html)
// but is not offered to learners: the approved vision replaced the island with the deep-space explorer.
export function SparkUniverse({ prefs, plan, uid, orgId, onPersonalise, active = true, onOpenActivity }) {
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [arrival, setArrival] = useState(null);
  const achieved = splitGoals(plan).completed.slice(0, 6);
  return <>
    {explorerOpen && <Suspense fallback={<p role="status">Opening My Universe…</p>}>
      <MyUniverseExplorer
        preview={true}
        allowInReviewMissions={true}
        missionRegistry={PUBLISHED_PILOT_RELEASES}
        initialArrival={arrival}
        viewer={uid && orgId ? { uid, orgId } : null}
        calm={!!prefs.calm}
        active={active}
        onClose={() => { setExplorerOpen(false); setArrival(null); }}
        onOpenActivity={onOpenActivity ? (id, options) => { setExplorerOpen(false); setArrival(null); onOpenActivity(id, options); } : undefined}
      />
    </Suspense>}
    <section className="ig-plate" style={{ marginBottom: 20 }} aria-label="My Universe exploration">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h4>Explore My Universe</h4>
          <p className="sd-caption" style={{ margin: '4px 0 0' }}>
            Deep-space exploration in Lyra Spiral & Lyra Prime: survey ocean winds on Thalassa, calculate journey times, and balance mass & power for Ignis.
          </p>
        </div>
        <button type="button" className="sd-primary" onClick={() => { setArrival(null); setExplorerOpen(true); }}>
          Enter My Universe <ArrowRight size={17}/>
        </button>
      </div>
      <div className="sv-missions" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginTop: 16 }}>
        {EXPEDITIONS.map((x) => (
          <button
            key={x.id}
            type="button"
            className="sv-mission"
            style={{ textAlign: 'left', padding: '14px 16px', background: 'var(--surface-subtle, rgba(255,255,255,0.04))', border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))', borderRadius: 10, cursor: 'pointer', color: 'inherit' }}
            onClick={() => { setArrival({ planetId: x.planetId, missionId: x.missionId, routeId: x.routeId }); setExplorerOpen(true); }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <strong style={{ fontSize: '0.98rem' }}>{x.title}</strong>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{x.where}</span>
            </div>
            <p style={{ margin: '4px 0 8px', fontSize: '0.85rem', color: 'var(--text-secondary, #cbd5e1)', lineHeight: 1.4 }}>{x.description}</p>
            <small style={{ fontSize: '0.76rem', color: 'var(--text-muted, #94a3b8)', display: 'block' }}>Grades {x.grades} · Challenge {x.challenge}/5</small>
          </button>
        ))}
      </div>
    </section>
    <section className="ig-universe" aria-labelledby="ig-universe-title">
      <svg className="ig-starfield" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        {STARS.map((star, i) => <circle key={i} cx={star.x} cy={star.y} r={star.r} />)}
      </svg>
      <div className="ig-universe-head">
        <span className="sd-eyebrow">Your universe</span>
        <h3 id="ig-universe-title">{prefs.tagline || 'A space that feels like you. Curiosity included.'}</h3>
        <button type="button" className="sd-primary" onClick={onPersonalise}>Choose my atmosphere <ArrowRight size={17} /></button>
      </div>
      <div className="ig-universe-lists">
        <div><h4>My themes</h4>{prefs.interests.length
          ? <ul className="ig-themes">{prefs.interests.map((interest) => <li key={interest}><Star size={13} aria-hidden="true" />{interest}</li>)}</ul>
          : <p className="sd-caption">Pick up to six interests in Personalise to light up your themes.</p>}</div>
        <div><h4>Personal milestones</h4>{achieved.length
          ? <ul className="ig-themes">{achieved.map((goal) => <li key={goal.id}><Star size={13} aria-hidden="true" fill="currentColor" />{goal.explore}</li>)}</ul>
          : <p className="sd-caption">Goals you mark achieved appear here.</p>}
          <small className="ig-note">Goals you marked achieved yourself · not assessed mastery.</small></div>
      </div>
    </section>
    <section className="ig-bays" aria-label="Future optional features (not active)">
      <div className="ig-bay"><Gamepad2 size={22} aria-hidden="true" /><div><strong>Optional games</strong><span>Not active · planned</span></div></div>
      <div className="ig-bay"><Bot size={22} aria-hidden="true" /><div><strong>AI companion</strong><span>Not active · planned</span></div></div>
      <p className="sd-caption">No XP, rewards, unlocks or companion features are active. If optional extras arrive, your learning tools always stay available.</p>
    </section>
    <a className="sd-link" href={hrefFor.goals()}>Mark a goal achieved in Goal Setting <ArrowRight size={16} /></a>
  </>;
}
