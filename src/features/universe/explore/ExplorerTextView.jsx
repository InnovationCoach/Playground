import { ArrowLeft, Box, ChevronRight, Lock, Star, DoorOpen } from 'lucide-react';
import { planetAccess, canLand, STATUS_LABEL } from './explorerModel.js';
import { FACT_TAGS } from './cosmosCatalog.js';
import { MissionList } from '../missions/MissionList.jsx';
import { Workstations } from '../missions/Workstations.jsx';

export function StatusChip({ access }) {
  const Icon = access.status === 'locked' ? Lock : access.status === 'available' ? DoorOpen : Star;
  return <span className={`mx-chip is-${access.status}`}>
    <Icon size={12} aria-hidden="true" />{STATUS_LABEL[access.status]}{access.preview && <em> · Preview</em>}
  </span>;
}

/** A catalog fact with its tag; "Real science" always shows its source. */
export function FactList({ facts }) {
  return <ul className="mx-facts">{facts.map((f) => <li key={f.text}>{f.text}
    <span className={`mx-tag is-${f.tag}`}>{FACT_TAGS[f.tag]}</span>
    {f.tag === 'real-science' && f.source && <small className="mx-source">Source: {f.source}</small>}
  </li>)}</ul>;
}

/**
 * The non-3D view: every destination, status and detail the 3D scene offers,
 * as plain headings and lists. Used when WebGL 2 is missing or lost, or when a
 * learner simply prefers it. It never shows the old island as "3D".
 */
export function ExplorerTextView({ cosmos, opts, canUse3d, notice, onShow3d, header, onOpenMission, onOpenActivity, onLand }) {
  const show = (level, id, label) => canUse3d && <button type="button" className="mx-show3d" onClick={() => onShow3d(level, id)}><Box size={14} aria-hidden="true" />Show {label} in 3D</button>;
  return <div className="mx-text">
    {notice && <p className="mx-notice" role="status">{notice}</p>}
    {header}
    <p>Deep space, not to scale. Places are fictional worlds unless a fact is marked Real science with its source.</p>
    {cosmos.galaxies.map((g) => <section key={g.id} className="mx-text-galaxy" aria-labelledby={`mx-g-${g.id}`}>
      <h3 id={`mx-g-${g.id}`}>{g.name} <small>{g.type} galaxy</small></h3>
      <p>{g.summary}</p>{show('galaxy', g.id, g.name)}
      {!g.systems.length && <p className="mx-muted">No star systems are charted here yet.</p>}
      {g.systems.map((sid) => { const s = cosmos.systemById(sid); return <section key={sid} className="mx-text-system" aria-labelledby={`mx-s-${sid}`}>
        <h4 id={`mx-s-${sid}`}>{s.name} <small>{s.starClass}</small></h4>
        <p>{s.summary}</p>{show('system', sid, s.name)}
        {s.planets.map((pid) => { const p = cosmos.planetById(pid), access = planetAccess(p, opts), env = p.environmentId && cosmos.environmentById(p.environmentId);
          return <details key={pid} className="mx-text-planet">
            <summary><strong>{p.name}</strong> <StatusChip access={access} /></summary>
            <p>{p.summary}</p>
            <FactList facts={p.facts} />
            {access.status === 'locked' && <p className="mx-req"><Lock size={14} aria-hidden="true" />{access.requirementText}</p>}
            {access.status === 'not-connected' && <p className="mx-muted">Access will come from your learning record once that service is connected.</p>}
            {onOpenMission && <MissionList planetId={pid} opts={opts} onOpen={onOpenMission} />}
            {show('planet', pid, p.name)}
            {env && canLand(p, opts) && <div className="mx-text-env">
              <h5>Surface: {env.name}</h5><p>{env.biome}. {env.summary}</p>
              {onLand && <button type="button" className="mx-primary" onClick={() => onLand(pid)}>Land on {p.name}<ChevronRight size={16} aria-hidden="true" /></button>}
              <ul>{env.locations.map((l) => <li key={l.id}><strong>{l.name}.</strong> {l.purpose}
                <ul className="mx-facts">{l.observations.map((o) => <li key={o}>{o}</li>)}</ul>
                {onOpenMission && l.workstations?.length > 0 && <Workstations location={l} opts={opts} onOpenMission={onOpenMission} onOpenActivity={onOpenActivity} />}</li>)}</ul>
              {show('environment', env.id, 'the surface')}
            </div>}
          </details>; })}
      </section>; })}
    </section>)}
  </div>;
}

/**
 * Text view of one surface the learner has landed on: its places one at a time, with the same
 * arrival card as 3D. It never lists the other planets as if the learner were still in orbit.
 */
export function SurfaceTextView({ cosmos, environment, opts, selected, onSelect, onBack, canUse3d, onShow3d, notice, headingRef, arrivalCard, onOpenMission, onOpenActivity }) {
  const planet = cosmos.planetById(environment.planetId);
  const place = environment.locations.find((l) => l.id === selected);
  return <div className="mx-text">
    {notice && <p className="mx-notice" role="status">{notice}</p>}
    <div className="mx-text-surface">
      <span className="mx-eyebrow">Surface · {planet?.name}</span>
      <h2 ref={headingRef} tabIndex={-1}>{environment.name}</h2>
      <p>{environment.biome}. {environment.summary}</p>
    </div>
    {arrivalCard}
    <section className="mx-text-surface" aria-labelledby="mx-places-title">
      <h3 id="mx-places-title">Places to inspect</h3>
      <div className="mx-text-places" role="group" aria-labelledby="mx-places-title">
        {environment.locations.map((l) => <button key={l.id} type="button" aria-pressed={selected === l.id} onClick={() => onSelect(l.id)}>{l.name}</button>)}
      </div>
      {place ? <div className="mx-detail" aria-live="polite"><h4>{place.name}</h4><p>{place.purpose}</p>
        <ul className="mx-facts">{place.observations.map((o) => <li key={o}>{o}</li>)}</ul>
        {onOpenMission && <Workstations location={place} opts={opts} onOpenMission={onOpenMission} onOpenActivity={onOpenActivity} />}</div>
        : <p className="mx-muted">Choose a place to read about it.</p>}
    </section>
    <div className="mx-text-surface-actions">
      {canUse3d && <button type="button" className="mx-show3d" onClick={onShow3d}><Box size={14} aria-hidden="true" />Show the surface in 3D</button>}
      <button type="button" className="mx-show3d" onClick={onBack}><ArrowLeft size={14} aria-hidden="true" />Back to {planet?.name} orbit</button>
    </div>
  </div>;
}
