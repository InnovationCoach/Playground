/**
 * Hands-on tools per PBL program. A program without an entry here keeps the
 * plain session cards; add a toolkit to give it tools, badges and levels.
 *
 * Data only: the screens are loaded on demand by ToolHost.jsx, so opening one
 * program never downloads another program's tools.
 */
import * as entrepreneurship from './entrepreneurship.js';
import * as roboBuddy from './roboBuddy.js';
import * as streetPaws from './streetPaws.js';
import * as voyager from './voyager.js';
import * as vitalFlow from './vitalFlow.js';
import * as kineticEnergy from './kineticEnergy.js';
import * as exodus from './exodus.js';

const kit = (m) => ({
  tools: m.TOOLS,
  sessionTools: m.SESSION_TOOLS,
  sessionXp: m.SESSION_XP,
  badges: m.BADGES,
  earnedBadges: m.earnedBadges,
  autoBadge: m.autoBadge,
  levels: m.LEVELS || null
});

const TOOLKITS = Object.fromEntries(
  [entrepreneurship, roboBuddy, streetPaws, voyager, vitalFlow, kineticEnergy, exodus].map((m) => [m.PROGRAM_ID, kit(m)])
);

export const toolkitFor = (programId) => TOOLKITS[programId] || null;
export const toolkitProgramIds = () => Object.keys(TOOLKITS);
