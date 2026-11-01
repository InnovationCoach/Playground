import { ArrowRight, Gamepad2, Bot, Star } from 'lucide-react';
import { hrefFor } from '../../app/routes.js';
import { splitGoals } from './slideModel.js';

// Fixed, decorative star positions: still, never animated, never meaningful.
const STARS = (() => {
  let seed = 7;
  const next = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: 70 }, (_, i) => ({ x: next() * 100, y: next() * 60, r: i % 9 === 0 ? .32 : i % 3 === 0 ? .2 : .13 }));
})();

/** Personal themes and self-marked milestones on a still star plate, plus clearly inactive future bays. */
export function SparkUniverse({ prefs, plan, onPersonalise }) {
  const achieved = splitGoals(plan).completed.slice(0, 6);
  return <>
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
