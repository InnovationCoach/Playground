import { useMemo } from 'react';
import { buildSky, SKY } from './skyModel.js';

/** Fixed star positions for decorative skies. Still, and never meaningful. */
export function scatterStars(count, seedStart = 7) {
  let seed = seedStart;
  const next = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: count }, (_, i) => ({ x: next() * 100, y: next() * 100, r: i % 9 === 0 ? 0.42 : i % 3 === 0 ? 0.26 : 0.16 }));
}
const BACKDROP = scatterStars(46, 19);

/** The drawing behind the next step: a planet, its ring and a slow comet. Decorative. */
export function QuestScene() {
  return <svg className="qb-scene" viewBox="0 0 420 260" preserveAspectRatio="xMaxYMid slice" aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id="qb-planet" cx=".34" cy=".3" r=".85"><stop offset="0" className="qb-p1" /><stop offset=".55" className="qb-p2" /><stop offset="1" className="qb-p3" /></radialGradient>
      <linearGradient id="qb-tail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" className="qb-tail-a" stopOpacity="0" /><stop offset="1" className="qb-tail-a" /></linearGradient>
    </defs>
    <g className="qb-dust">{BACKDROP.map((s, i) => <circle key={i} cx={s.x * 4.2} cy={s.y * 2.6} r={s.r * 3} />)}</g>
    <ellipse className="qb-orbit" cx="290" cy="132" rx="150" ry="52" transform="rotate(-16 290 132)" />
    <g className="qb-float">
      <circle cx="290" cy="132" r="72" fill="url(#qb-planet)" />
      <path className="qb-band" d="M222 112c44 18 92 20 134-2" />
      <path className="qb-band" d="M220 146c46 16 96 18 138-4" />
      <path className="qb-ring" d="M186 164c30 22 196-44 208-90" />
    </g>
    <circle className="qb-moon" cx="352" cy="52" r="11" />
    <g className="qb-comet"><path d="M128 74 208 40" stroke="url(#qb-tail)" strokeWidth="3" strokeLinecap="round" /><circle cx="209" cy="40" r="4" /></g>
  </svg>;
}

/** Each finished step lights one star. The list says the same thing in words for everyone. */
export function YourSky({ goals }) {
  const sky = useMemo(() => buildSky(goals), [goals]);
  const recent = sky.lit.slice(-3).reverse();
  return <section className="qb-sky" aria-labelledby="qb-sky-title">
    <svg className="qb-sky-art" viewBox={`0 0 ${SKY.width} ${SKY.height}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <g className="qb-sky-dust">{BACKDROP.map((s, i) => <circle key={i} cx={s.x * 6} cy={s.y * 2.6} r={s.r * 2.2} />)}</g>
      {sky.links.map((link) => <line key={link.id} {...{ x1: link.x1, y1: link.y1, x2: link.x2, y2: link.y2 }} data-lit={link.lit || undefined} />)}
      {sky.stars.map((star) => <g key={star.id} className="qb-star" data-lit={star.lit || undefined}>
        {star.lit && <circle className="qb-star-glow" cx={star.x} cy={star.y} r="16" />}
        <circle cx={star.x} cy={star.y} r={star.lit ? 6 : 5} />
      </g>)}
    </svg>
    <div className="qb-sky-text">
      <h3 id="qb-sky-title">Your sky</h3>
      {recent.length ? <>
        <p>Every star is a step you finished.</p>
        <ul>{recent.map((star) => <li key={star.id}>{star.text}</li>)}</ul>
      </> : <p>{sky.stars.length ? 'Finish a step to light your first star.' : 'Set a goal and its steps appear here as stars.'}</p>}
    </div>
  </section>;
}
