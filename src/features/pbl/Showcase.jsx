import { PHASES, EVIDENCE_KINDS, TERM, IMPACT } from './content/pblModel.js';
import { MediaEmbed } from './MediaEmbed.jsx';
import { embedFor } from './engine/mediaEmbed.js';

const CANVA_NEW = 'https://www.canva.com/create/';

/**
 * Where a Canva design goes in the showcase. Until the Canva connection exists,
 * the learner makes the design in Canva and pastes its view link as evidence.
 * The "Connect" action is shown but disabled, so nobody expects it to work yet.
 */
function CanvaSlot({ hasDesign }) {
  if (hasDesign) return null;
  return (
    <section className="pb-canva-slot" aria-labelledby="pb-canva-title">
      <h3 id="pb-canva-title">Make your showcase poster in Canva</h3>
      <p>Design a poster or slide for your project in Canva. Then copy its view link and add it as evidence, and it appears here.</p>
      <div className="pb-canva-actions">
        <a className="gh-btn gh-btn-primary" href={CANVA_NEW} target="_blank" rel="noopener noreferrer">Open Canva</a>
        <button type="button" className="gh-btn gh-btn-ghost" disabled title="Available when the school connects Canva">
          Create in Canva from here (coming soon)
        </button>
      </div>
    </section>
  );
}

const kindLabel = (id) => EVIDENCE_KINDS.find((k) => k.id === id)?.label || id;
const EXCERPT = 220;

/**
 * The portfolio as a learner would present it: their question, then each
 * Design Thinking phase as a gallery, media first. Read-only; editing stays
 * in the list view.
 */
export function Showcase({ project, displayName }) {
  const impact = IMPACT.find((i) => i.id === project.impact);
  const phases = PHASES.map((p) => ({
    ...p,
    items: project.evidence
      .filter((e) => e.phase === p.id)
      .sort((a, b) => Number(Boolean(embedFor(b.link)?.src)) - Number(Boolean(embedFor(a.link)?.src)) || a.createdAt - b.createdAt)
  })).filter((p) => p.items.length);

  return (
    <article className="pb-showcase" aria-labelledby="pb-sc-title">
      <header className="pb-sc-hero">
        <span className="pb-sc-kicker">{TERM.label} · {TERM.theme}</span>
        <h2 id="pb-sc-title">{project.problem.hmw || 'My project'}</h2>
        <p className="pb-sc-by">{displayName ? `${displayName}’s portfolio` : 'My portfolio'}</p>
        {(project.problem.who || impact) && (
          <dl className="pb-sc-facts">
            {project.problem.who && <><dt>Who it helps</dt><dd>{project.problem.who}</dd></>}
            {impact && <><dt>Impact</dt><dd>{impact.label}</dd></>}
            {project.problem.criteria && <><dt>Success looks like</dt><dd>{project.problem.criteria}</dd></>}
          </dl>
        )}
      </header>
      <CanvaSlot hasDesign={project.evidence.some((e) => embedFor(e.link)?.type === 'canva')} />
      {phases.length === 0 ? (
        <p className="pb-empty">Your showcase fills up as you add evidence. Canva designs, photos and videos appear here as a gallery.</p>
      ) : phases.map((p, i) => (
        <section key={p.id} className="pb-sc-phase" aria-labelledby={`pb-sc-${p.id}`}>
          <h3 id={`pb-sc-${p.id}`}><span className="pb-sc-n">{i + 1}</span>{p.title}</h3>
          <ul className="pb-sc-grid">
            {p.items.map((e) => {
              const media = embedFor(e.link)?.src;
              const text = e.kind === 'ai' ? e.ai?.kept : e.kind === 'code' ? '' : e.body;
              return (
                <li key={e.id} className={`pb-sc-card${media ? ' pb-sc-media' : ''}`}>
                  {media && <MediaEmbed url={e.link} title={e.title} />}
                  <span className={`pb-kind pb-kind-${e.kind}`}>{kindLabel(e.kind)}</span>
                  <h4>{e.title}</h4>
                  {text && <p>{text.length > EXCERPT ? `${text.slice(0, EXCERPT).trimEnd()}…` : text}</p>}
                  {e.kind === 'code' && e.body && <pre className="pb-code-block pb-sc-code"><code>{e.body.split('\n').slice(0, 8).join('\n')}</code></pre>}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </article>
  );
}
