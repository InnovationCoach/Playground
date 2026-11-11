import { lazy, Suspense, useState } from 'react';
import { ArrowRight, Compass, Cpu, Palette, Search } from 'lucide-react';
import { hrefFor } from '../../app/routes.js';
import { PILOT_RELEASES } from '../universe/pilot/pilotRegistry.js';
import { continueCourse, sectionHref, WORLDS } from './lowerSecondaryModel.js';
import { ArrowLink, Failure, Loading, PageTitle } from './common.jsx';
import { DesignIsland, IdeaArt, ScienceIsland, TechnologyIsland } from './illustrations.jsx';

const MyUniverseExplorer = lazy(() => import('../universe/explore/MyUniverseExplorer.jsx').then((m) => ({ default: m.MyUniverseExplorer })));
const ART = { science: ScienceIsland, design: DesignIsland, technology: TechnologyIsland };
const ICON = { science: Compass, design: Palette, technology: Cpu };

function WorldCard({ world, onOpen }) {
  const Art = ART[world.id], Icon = ICON[world.id];
  return <li className="ls-card ls-world">
    <div className={`ls-world-art ls-world-${world.id}`}><Art /></div>
    <div className="ls-world-copy">
      <h2><span className={`ls-world-icon ls-pill-${world.id}`}><Icon size={24} aria-hidden="true" /></span>{world.label}</h2>
      <p className="ls-world-where">{world.destination}{world.preview && <span className="ls-chip ls-chip-peach">Preview</span>}</p>
      <p className="ls-muted"><strong>{world.title}.</strong> {world.description}</p>
      <button type="button" className="ls-primary ls-block" onClick={() => onOpen(world)}>{world.action}<ArrowRight size={18} aria-hidden="true" /></button>
    </div>
  </li>;
}

/** A search over the real catalogue: rule-based, so it is not presented as AI. */
function NewAdventure() {
  const [q, setQ] = useState('');
  return <section className="ls-card ls-adventure" aria-labelledby="ls-adventure-title">
    <IdeaArt />
    <div><h2 id="ls-adventure-title">Create a new adventure</h2><p>What are you curious about? Search the courses and activities available to you.</p>
      <form role="search" onSubmit={(e) => { e.preventDefault(); if (q.trim()) window.location.hash = hrefFor.homeSearch(q.trim()); }}>
        <label className="ls-sr" htmlFor="ls-idea">Search for an idea</label>
        <span className="ls-search"><Search size={18} aria-hidden="true" /><input id="ls-idea" type="search" value={q} autoComplete="off" placeholder="Robots, oceans, solar power…" onChange={(e) => setQ(e.target.value)} /></span>
        <button type="submit" className="ls-primary" disabled={!q.trim()}>Explore an idea<ArrowRight size={18} aria-hidden="true" /></button>
      </form></div>
  </section>;
}

function ContinueExploring({ courses }) {
  const next = continueCourse(courses.courses);
  return <section className="ls-card ls-continue" aria-labelledby="ls-continue-title">
    <h2 id="ls-continue-title">Continue exploring</h2>
    {courses.state === 'loading' && <Loading>Loading your projects…</Loading>}
    {courses.state !== 'loading' && !next && courses.warnings.length > 0 && <Failure onRetry={courses.retry}>{courses.warnings.join(' ')}</Failure>}
    {next && <a className="ls-continue-item" href={next.href}><span><strong>{next.title}</strong><span>{next.next}</span></span><span className="ls-step-go"><ArrowRight size={18} aria-hidden="true" /></span></a>}
    {courses.state === 'ready' && !next && !courses.warnings.length && <p className="ls-empty">Nothing in progress yet. Pick a place above to start.</p>}
  </section>;
}

export function UniversePage({ uid, orgId, courses, calm, onOpenActivity }) {
  const [explorer, setExplorer] = useState(null);
  const open = (world) => {
    if (world.activity) onOpenActivity?.(world.activity);
    else setExplorer({ arrival: world.arrival || null });
  };
  return <div className="ls-page">
    <PageTitle title="My Universe" subtitle="Where will your curiosity take you?" />
    {explorer && <Suspense fallback={<Loading>Opening My Universe…</Loading>}>
      {/* The same preview flags as the existing dashboard's explorer; its own chrome says it is a preview. */}
      <MyUniverseExplorer preview allowInReviewMissions missionRegistry={PILOT_RELEASES} initialArrival={explorer.arrival}
        viewer={uid && orgId ? { uid, orgId } : null} calm={calm} active onClose={() => setExplorer(null)}
        onOpenActivity={onOpenActivity ? (id, options) => { setExplorer(null); onOpenActivity(id, options); } : undefined} />
    </Suspense>}
    <ul className="ls-worlds">{WORLDS.map((world) => <WorldCard key={world.id} world={world} onOpen={open} />)}</ul>
    <div className="ls-universe-row"><NewAdventure /><ContinueExploring courses={courses} /></div>
    <p className="ls-universe-all"><button type="button" className="ls-link" onClick={() => setExplorer({ arrival: null })}>Enter the full My Universe map (preview)<ArrowRight size={18} aria-hidden="true" /></button></p>
  </div>;
}

/** Universe missions are secondary activities, so a primary-classified account isn't offered them. */
export function PrimaryUniversePage() {
  return <div className="ls-page"><PageTitle title="My Universe" subtitle="Where will your curiosity take you?" />
    <section className="ls-card ls-adventure"><IdeaArt /><div><h2>Your explorations are in My Learning</h2><p>Universe missions open when you move on to secondary courses. Junior Explorers has hands-on investigations for you now.</p>
      <ArrowLink className="ls-primary" href={sectionHref('learning')}>Open my learning</ArrowLink></div></section>
  </div>;
}
