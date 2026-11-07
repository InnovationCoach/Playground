import { ArrowRight, Compass, MessageCircle, Pencil, Rocket } from 'lucide-react';
import { hrefFor } from '../../app/routes.js';
import { JoinClassPanel } from '../enrolment/JoinClassPanel.jsx';
import '../enrolment/joinPanel.css';
import { checkedToday, todayItems } from '../goals/goalPlan.js';
import { programJourney, startHere } from '../dashboard/learningGuidance.js';
import { courseStatus, sectionHref, WORLDS } from './lowerSecondaryModel.js';
import { ArrowLink, Badge, Failure, Loading, PageTitle } from './common.jsx';
import { DesignIsland, DiscoveryArt, ReflectArt, ScienceIsland, SparkStar, TechnologyIsland } from './illustrations.jsx';

const ISLANDS = { science: ScienceIsland, design: DesignIsland, technology: TechnologyIsland };

/** The learner's real next action. The first choice is always the same one as My Dashboard's "Start here". */
function Hero({ goals, courses, project }) {
  const today = todayItems(goals.plan), checked = checkedToday(goals.plan);
  const next = startHere({ data: courses, today, checked, goalsLoaded: goals.loaded, hasGoals: goals.plan.goals.length > 0, termProject: project });
  const course = courses.courses.find((item) => next.href === hrefFor.program(item.program.id, 'plan'));
  const status = course ? courseStatus(course) : null;
  return <section className="ls-card ls-hero" aria-labelledby="ls-hero-title" aria-busy={!!next.loading}>
    <div className="ls-hero-copy">
      {next.source && <span className="ls-chip ls-chip-lilac"><Rocket size={15} aria-hidden="true" />{next.source}</span>}
      <h2 id="ls-hero-title">{next.title}</h2>
      <p>{next.body}</p>
      {next.href && <div className="ls-hero-actions"><ArrowLink className="ls-primary" href={next.href}>{next.action}</ArrowLink>
        {status?.kind === 'counted' && <span className="ls-hero-step">{status.label}</span>}</div>}
    </div>
    <div className="ls-hero-art"><DiscoveryArt /></div>
  </section>;
}

function NextSteps({ courses }) {
  const journey = courses.courses[0] ? programJourney(courses.courses[0]) : null;
  const evidence = journey?.evidence;
  const steps = [
    { id: 'explore', tone: 'mint', Icon: Compass, title: 'Explore', text: 'Search a topic, skill or project you’re curious about.', href: hrefFor.homeSearch() },
    { id: 'create', tone: 'lilac', Icon: Pencil, title: 'Create', text: evidence ? `Collect: ${evidence}` : 'Add something you’ve made to your portfolio.', href: evidence ? hrefFor.program(courses.courses[0].program.id, 'plan') : hrefFor.portfolio() },
    { id: 'reflect', tone: 'peach', Art: ReflectArt, title: 'Reflect', text: 'What are you proud of? Write it down in your portfolio.', href: sectionHref('portfolio') }
  ];
  return <section className="ls-card ls-steps" aria-labelledby="ls-steps-title">
    <h2 id="ls-steps-title">Your next steps</h2>
    <ul>{steps.map(({ id, tone, Icon, Art, title, text, href }) => <li key={id}><a className={`ls-step ls-tone-${tone}`} href={href}>
      <span className="ls-step-art">{Art ? <Art /> : <Icon size={34} aria-hidden="true" />}</span>
      <span className="ls-step-copy"><strong>{title}</strong><span>{text}</span></span>
      <span className="ls-step-go"><ArrowRight size={18} aria-hidden="true" /></span>
    </a></li>)}</ul>
  </section>;
}

export function ProgressCard({ progress, onRetry }) {
  return <section className="ls-card ls-progress" aria-labelledby="ls-progress-title">
    <h2 id="ls-progress-title">My progress</h2>
    {progress.state === 'loading' && <Loading>Loading your progress…</Loading>}
    {progress.state === 'unknown' && <Failure onRetry={onRetry}>Your progress couldn’t be loaded, so nothing is shown rather than a wrong number.</Failure>}
    {progress.state === 'off' && <p className="ls-muted">Levels and badges aren’t switched on for your school. Your courses and goals are in <a href={sectionHref('learning')}>My Learning</a>.</p>}
    {progress.state === 'ready' && <>
      <p className="ls-level"><strong>Level {progress.level.level} {progress.level.title}</strong><span>{progress.level.xp} / {progress.level.next} XP</span></p>
      <div className="ls-bar" role="progressbar" aria-label="XP towards the next level" aria-valuemin={progress.level.floor} aria-valuemax={progress.level.next} aria-valuenow={progress.level.xp}><i style={{ width: `${Math.round(progress.level.progress * 100)}%` }} /></div>
      {progress.earned.length > 0
        ? <><h3>My earned badges</h3><ul className="ls-badges">{progress.earned.slice(-3).reverse().map((badge) => <Badge key={badge.id} badge={badge} />)}</ul>
            {progress.earned.length > 3 && <ArrowLink href={hrefFor.pbl('competencies')}>All {progress.earned.length} badges</ArrowLink>}</>
        : <p className="ls-muted">No badges yet.{progress.nextBadge ? ` Closest: ${progress.nextBadge.name}. ${progress.nextBadge.description}` : ''}</p>}
    </>}
  </section>;
}

/** Help comes from a person: no student AI chat is available in this layout. */
function HelpCard() {
  return <section className="ls-card ls-help" aria-labelledby="ls-help-title">
    <h2 id="ls-help-title">Your coach</h2>
    <div className="ls-help-row"><SparkStar /><div><h3>Need a little help?</h3><p>Ask your coach for ideas, explanations or the next step.</p>
      <a className="ls-primary ls-primary-sm" href={hrefFor.messages()}><MessageCircle size={18} aria-hidden="true" />Message my coach</a></div></div>
  </section>;
}

function UniverseStrip() {
  return <section className="ls-card ls-strip" aria-labelledby="ls-strip-title">
    <div className="ls-strip-head"><h2 id="ls-strip-title">My Universe</h2><p>Places to explore, create and grow across the ideas you love.</p><ArrowLink href={sectionHref('universe')}>Explore my universe</ArrowLink></div>
    <ul>{WORLDS.map((world) => { const Island = ISLANDS[world.id]; return <li key={world.id}><a href={sectionHref('universe')} aria-label={`${world.label}: ${world.destination}`}><span className="ls-strip-art"><Island /></span><span className={`ls-pill ls-pill-${world.id}`}>{world.label}</span></a></li>; })}</ul>
  </section>;
}

export function DashboardPage({ uid, name, classIds, onJoined, goals, courses, project, progress, retryProgress }) {
  return <div className="ls-page ls-dash">
    <div className="ls-dash-main">
      <PageTitle title="Ready for your next discovery?" subtitle={`${name ? `Hi, ${name}. ` : ''}Small steps. Big possibilities.`} />
      {uid && classIds.length === 0 && <JoinClassPanel uid={uid} classIds={classIds} onJoined={onJoined} />}
      <Hero goals={goals} courses={courses} project={project} />
      <NextSteps courses={courses} />
    </div>
    <div className="ls-dash-side"><ProgressCard progress={progress} onRetry={retryProgress} /><HelpCard /></div>
    <UniverseStrip />
  </div>;
}

export function PrimaryDashboardPage({ name }) {
  return <div className="ls-page">
    <PageTitle title="Ready for your next discovery?" subtitle={`${name ? `Hi, ${name}. ` : ''}Small steps. Big possibilities.`} />
    <section className="ls-card ls-hero" aria-labelledby="ls-hero-title">
      <div className="ls-hero-copy"><h2 id="ls-hero-title">Junior Explorers</h2><p>Your hands-on investigations are ready when you are.</p>
        <div className="ls-hero-actions"><ArrowLink className="ls-primary" href={sectionHref('learning')}>Open my learning</ArrowLink></div></div>
      <div className="ls-hero-art"><DiscoveryArt /></div>
    </section>
  </div>;
}
