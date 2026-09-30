import { useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { ACTIVITY_NAV } from '../activities/activityHost.js';
import { ActivityIcon, parseActivityLabel } from '../shell/activityIcons.jsx';
import { STEAM_NGSS, RUBRIC_LEVELS, DIMENSIONS, DIMENSION_DESCRIPTORS } from './content/steamNgss.js';

/**
 * The Explore phase: every STEAM activity with its NGSS performance
 * expectations and three-dimensional rubric. Learners can open the activity;
 * coaches (no onOpenActivity) see the rubric only.
 */
export function ExploreSteam({ onOpenActivity }) {
  const [openId, setOpenId] = useState(null);
  const items = Object.entries(STEAM_NGSS)
    .map(([id, ngss]) => ({ id, ngss, nav: ACTIVITY_NAV.find((a) => a.id === id) }))
    .filter((x) => x.nav);

  return (
    <div>
      <p className="pb-lead">
        STEAM activities are the <strong>Explore</strong> phase of the term. Each one is assessed against NGSS on four levels, across the three
        dimensions of science learning - practices, core ideas and crosscutting concepts - plus engineering design where the activity is a design task.
        Every activity also gives you a skill to take into your own project.
      </p>
      <ul className="pb-steam">
        {items.map(({ id, ngss, nav }) => {
          const { kicker, title } = parseActivityLabel(nav.label);
          const open = openId === id;
          return (
            <li key={id} className="gh-card pb-steam-card">
              <div className="pb-steam-head">
                <ActivityIcon id={id} size={42} iconSize={20} />
                <div className="pb-grow">
                  {kicker && <span className="pb-kicker">{kicker}</span>}
                  <h3>{title}</h3>
                  <p className="pb-sub">{nav.description}</p>
                </div>
                {onOpenActivity && (
                  <button type="button" className="gh-btn gh-btn-primary gh-btn-sm" onClick={() => onOpenActivity(id)}>
                    Open<ArrowRight size={14} aria-hidden="true" />
                  </button>
                )}
              </div>
              <ul className="pb-pes">
                {ngss.pes.map((pe) => <li key={pe.code}><span className="pb-pe-code">{pe.code}</span>{pe.title}</li>)}
              </ul>
              <p className="pb-bridge"><strong>For your project:</strong> {ngss.bridge}</p>
              {ngss.note && <p className="pb-note">{ngss.note}</p>}
              <button type="button" className="pb-disclose" aria-expanded={open} aria-controls={`rubric-${id}`} onClick={() => setOpenId(open ? null : id)}>
                <ChevronDown size={16} aria-hidden="true" />{open ? 'Hide' : 'Show'} NGSS rubric
              </button>
              {open && <Rubric id={`rubric-${id}`} rubric={ngss.rubric} />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Rubric({ id, rubric }) {
  return (
    <div className="gh-table-wrap pb-rubric-wrap" id={id}>
      <table className="pb-rubric">
        <thead>
          <tr>
            <th scope="col">Dimension</th>
            {RUBRIC_LEVELS.map((l) => <th key={l.score} scope="col">{l.score} · {l.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {Object.entries(rubric).map(([dim, row]) => (
            <tr key={dim}>
              <th scope="row">
                <span className="pb-dim">{DIMENSIONS[dim].short}</span>
                <strong>{row.name}</strong>
                <span className="pb-look">Look for: {row.lookFor}</span>
              </th>
              {DIMENSION_DESCRIPTORS[dim].map((text, i) => <td key={i}>{text}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
