import { Box, Lock, Star, DoorOpen } from 'lucide-react';
import { GALAXIES, systemById, planetById, environmentById } from './cosmosFixture.js';
import { planetAccess, canLand, STATUS_LABEL } from './explorerModel.js';

export function StatusChip({ access }) {
  const Icon = access.status === 'locked' ? Lock : access.status === 'available' ? DoorOpen : Star;
  return <span className={`mx-chip is-${access.status}`}>
    <Icon size={12} aria-hidden="true" />{STATUS_LABEL[access.status]}{access.preview && <em> · Preview</em>}
  </span>;
}

/**
 * The non-3D view: every destination, status and detail the 3D scene offers,
 * as plain headings and lists. Used when WebGL 2 is missing or lost, or when a
 * learner simply prefers it. It never shows the old island as "3D".
 */
export function ExplorerTextView({ opts, canUse3d, notice, onShow3d }) {
  const show = (level, id, label) => canUse3d && <button type="button" className="mx-show3d" onClick={() => onShow3d(level, id)}><Box size={14} aria-hidden="true" />Show {label} in 3D</button>;
  return <div className="mx-text">
    {notice && <p className="mx-notice" role="status">{notice}</p>}
    <p>Deep space, not to scale. Every place below is a fictional world in a sample universe.</p>
    {GALAXIES.map((g) => <section key={g.id} className="mx-text-galaxy" aria-labelledby={`mx-g-${g.id}`}>
      <h3 id={`mx-g-${g.id}`}>{g.name} <small>{g.type} galaxy</small></h3>
      <p>{g.summary}</p>{show('galaxy', g.id, g.name)}
      {!g.systems.length && <p className="mx-muted">No star systems are charted here yet.</p>}
      {g.systems.map((sid) => { const s = systemById(sid); return <section key={sid} className="mx-text-system" aria-labelledby={`mx-s-${sid}`}>
        <h4 id={`mx-s-${sid}`}>{s.name} <small>{s.starClass}</small></h4>
        <p>{s.summary}</p>{show('system', sid, s.name)}
        {s.planets.map((pid) => { const p = planetById(pid), access = planetAccess(p, opts), env = p.environmentId && environmentById(p.environmentId);
          return <details key={pid} className="mx-text-planet">
            <summary><strong>{p.name}</strong> <StatusChip access={access} /></summary>
            <p>{p.summary}</p>
            <ul className="mx-facts">{p.facts.map((f) => <li key={f}>{f}<span className="mx-tag">Fictional world</span></li>)}</ul>
            {access.status === 'locked' && <p className="mx-req"><Lock size={14} aria-hidden="true" />{access.requirementText}</p>}
            {access.status === 'not-connected' && <p className="mx-muted">Access will come from your learning record once that service is connected.</p>}
            {show('planet', pid, p.name)}
            {env && canLand(p, opts) && <div className="mx-text-env">
              <h5>Surface: {env.name}</h5><p>{env.biome}. {env.summary}</p>
              <ul>{env.locations.map((l) => <li key={l.id}><strong>{l.name}.</strong> {l.purpose}
                <ul className="mx-facts">{l.observations.map((o) => <li key={o}>{o}</li>)}</ul></li>)}</ul>
              {show('environment', env.id, 'the surface')}
            </div>}
          </details>; })}
      </section>; })}
    </section>)}
  </div>;
}
