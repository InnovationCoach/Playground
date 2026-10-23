/**
 * Hands-on tools per PBL program. A program without an entry here keeps the
 * plain session cards; add a toolkit to give it tools, badges and levels.
 */
import * as entrepreneurship from './entrepreneurship.js';

const TOOLKITS = {
  [entrepreneurship.PROGRAM_ID]: {
    tools: entrepreneurship.TOOLS,
    sessionTools: entrepreneurship.SESSION_TOOLS,
    sessionXp: entrepreneurship.SESSION_XP,
    badges: entrepreneurship.BADGES,
    earnedBadges: entrepreneurship.earnedBadges
  }
};

export const toolkitFor = (programId) => TOOLKITS[programId] || null;
