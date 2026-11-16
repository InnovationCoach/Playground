import { lazy, Suspense } from 'react';
import { Lock } from 'lucide-react';
import { ToolFor as EntrepreneurshipTool, FounderPanel } from './EntrepreneurshipTools.jsx';
import { PROGRAM_ID as ENTREPRENEURSHIP } from './entrepreneurship.js';
import { kitXp, levelFor } from './kit.js';
import './tools.css';

/**
 * Picks the right program's tool screen. Each of the newer toolkits is its own
 * chunk, fetched the first time one of its tools is opened.
 */
const load = (importer) => lazy(() => importer().then((m) => ({ default: m.ToolFor })));
const SCREENS = {
  [ENTREPRENEURSHIP]: EntrepreneurshipTool,
  'robo-buddy-companion-2026': load(() => import('./RoboBuddyTools.jsx')),
  'streetpaws-animal-rescue-2026': load(() => import('./StreetPawsTools.jsx')),
  'project-voyager-rc-solar-2026': load(() => import('./VoyagerTools.jsx')),
  'project-vital-flow-2026': load(() => import('./VitalFlowTools.jsx')),
  'kinetic-smart-energy-2026': load(() => import('./KineticEnergyTools.jsx')),
  'interstellar-ark-horizon-2026': load(() => import('./ExodusTools.jsx'))
};

/** `peek(toolId)` lets a tool read a sibling tool's saved state (read-only). */
export function KitTool({ programId, id, data, save, peek }) {
  const Screen = SCREENS[programId];
  if (!Screen) return null;
  return (
    <Suspense fallback={<p className="pt-hint" role="status">Loading the tool…</p>}>
      <Screen id={id} data={data} save={save} peek={peek} />
    </Suspense>
  );
}

/** XP, level (where the program has a ladder) and the badge shelf, for the program hero. */
export function KitPanel({ kit, program, progress }) {
  if (program.id === ENTREPRENEURSHIP) return <FounderPanel program={program} progress={progress} />;
  const earnedIds = kit.earnedBadges(progress);
  const earned = new Set(earnedIds);
  const xp = kitXp(progress, program, kit.badges, earnedIds, kit.sessionXp);
  const maxXp = program.sessions.length * kit.sessionXp + kit.badges.reduce((s, b) => s + b.xpAward, 0);
  const lvl = kit.levels ? levelFor(xp, kit.levels) : null;
  const pct = lvl ? lvl.pct : Math.round((xp / maxXp) * 100);
  return (
    <div className="pt-founder">
      <div className="pt-founder-level">
        <span className="pt-founder-n" aria-hidden="true">{lvl ? lvl.level : '★'}</span>
        <div className="pb-grow">
          <strong>{lvl ? `Level ${lvl.level} · ${lvl.title}` : `${xp.toLocaleString()} XP`}</strong>
          <span className="pt-founder-bar" aria-hidden="true"><i style={{ width: `${pct}%` }} /></span>
          <small>
            {lvl ? `${xp.toLocaleString()} XP${lvl.next ? ` · ${(lvl.next.minXp - xp).toLocaleString()} to ${lvl.next.title}` : ' · top level'}`
              : `${earned.size} of ${kit.badges.length} badges · ${maxXp.toLocaleString()} XP to collect`}
          </small>
        </div>
      </div>
      <ul className="pt-shelf" aria-label="Badges">
        {kit.badges.map((b) => {
          const got = earned.has(b.id);
          const how = kit.autoBadge(b.id) ? `Unlocks in a tool: ${b.condition}` : `Your coach awards this: ${b.condition}`;
          return (
            <li key={b.id} className={`pt-medal${got ? ' is-earned' : ''}${kit.autoBadge(b.id) ? ' is-auto' : ''}`} title={`${b.name} (+${b.xpAward} XP). ${got ? b.description : how}`}>
              <span className="pt-medal-icon" aria-hidden="true">{b.icon}</span>
              {!got && <Lock size={11} className="pt-medal-lock" aria-hidden="true" />}
              <span className="pt-sr">{b.name}: {got ? 'earned' : `locked. ${how}`}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
