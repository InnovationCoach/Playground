/**
 * Teen Superpower Archetypes for SPARK Goals & Skill Tree.
 * Connects strengths, show-how formats, and habits into 4 RPG-style archetypes:
 *   - 🛠️ The Builder (Maker, Code, Prototyping)
 *   - 🎨 The Visionary (Creative, Design, Storytelling)
 *   - 🤝 The Diplomat (Collaboration, Empathy, Communication)
 *   - 🧠 The Strategist (Research, Logic, Systems, Focus)
 */

export const ARCHETYPES = [
  {
    id: 'builder',
    name: 'The Builder',
    icon: '🛠️',
    color: '#06b6d4', // Cyan
    accentGlow: 'rgba(6, 182, 212, 0.35)',
    description: 'Brings ideas to life through code, mechanics, prototypes, and hands-on tinkering.',
    strengths: ['building', 'tech', 'coding'],
    showHow: ['model', 'code'],
    recharge: ['building', 'coding']
  },
  {
    id: 'visionary',
    name: 'The Visionary',
    icon: '🎨',
    color: '#a855f7', // Purple
    accentGlow: 'rgba(168, 85, 247, 0.35)',
    description: 'Inspires through aesthetics, storytelling, outside-the-box concepts, and design.',
    strengths: ['creative', 'art', 'humour'],
    showHow: ['slides', 'video', 'poster'],
    recharge: ['drawing', 'stories', 'music']
  },
  {
    id: 'diplomat',
    name: 'The Diplomat',
    icon: '🤝',
    color: '#10b981', // Emerald
    accentGlow: 'rgba(16, 185, 129, 0.35)',
    description: 'Champions people, masters communication, explains complex ideas, and lifts the team.',
    strengths: ['talking', 'empathy'],
    showHow: ['talk'],
    recharge: ['sport', 'outside']
  },
  {
    id: 'strategist',
    name: 'The Strategist',
    icon: '🧠',
    color: '#f59e0b', // Amber/Gold
    accentGlow: 'rgba(245, 158, 11, 0.35)',
    description: 'Spots patterns, asks deep questions, plans the roadmap, and navigates challenges.',
    strengths: ['big-picture', 'deep-questions', 'patterns', 'expert', 'persistence'],
    showHow: ['diagram', 'writing'],
    recharge: ['puzzles', 'quiet']
  }
];

const TITLES = {
  builder: ['Novice Maker', 'Apprentice Builder', 'Tech Artisan', 'Master Architect', 'Quantum Engineer'],
  visionary: ['Idea Sparker', 'Creative Explorer', 'Visual Storyteller', 'Concept Alchemist', 'Grand Visionary'],
  diplomat: ['Team Voice', 'Active Listener', 'Story Ambassador', 'Lead Diplomat', 'Chief Catalyst'],
  strategist: ['Curious Seeker', 'Pattern Finder', 'Systems Analyst', 'Master Strategist', 'Grandmaster Mind']
};

/**
 * Computes scores and radar coordinates for the learner's archetype profile.
 * @param {object} plan - Learner's goal plan object
 * @returns {object} Archetype scores (0-100), primary archetype, level, and total XP
 */
export function computeArchetypeProfile(plan) {
  if (!plan || typeof plan !== 'object') {
    return {
      scores: { builder: 25, visionary: 25, diplomat: 25, strategist: 25 },
      primary: ARCHETYPES[0],
      level: 1,
      totalXp: 0,
      title: TITLES.builder[0]
    };
  }

  const strengthsSet = new Set(Array.isArray(plan.strengths) ? plan.strengths : []);
  const rechargeSet = new Set(Array.isArray(plan.recharge) ? plan.recharge : []);
  const goals = Array.isArray(plan.goals) ? plan.goals : [];

  const rawScores = { builder: 15, visionary: 15, diplomat: 15, strategist: 15 };
  let xp = 0;

  // 1. Calculate from Strengths (+20 each)
  ARCHETYPES.forEach((arch) => {
    arch.strengths.forEach((s) => {
      if (strengthsSet.has(s)) {
        rawScores[arch.id] += 20;
        xp += 50;
      }
    });
    arch.recharge.forEach((r) => {
      if (rechargeSet.has(r)) {
        rawScores[arch.id] += 10;
        xp += 25;
      }
    });
  });

  // 2. Calculate from Goals ShowHow (+15 each)
  goals.forEach((g) => {
    if (g.showHow) {
      ARCHETYPES.forEach((arch) => {
        if (arch.showHow.includes(g.showHow)) {
          rawScores[arch.id] += 15;
          xp += 40;
        }
      });
    }

    // Finished steps count towards XP
    const steps = Array.isArray(g.steps) ? g.steps : [];
    steps.forEach((s) => {
      if (s.done) xp += 30;
    });
    if (g.done) xp += 150;
  });

  // 3. Focus skill contributions
  if (plan.focus?.skill) {
    if (['starting', 'planning', 'time', 'organised'].includes(plan.focus.skill)) {
      rawScores.strategist += 15;
    } else if (['asking'].includes(plan.focus.skill)) {
      rawScores.diplomat += 15;
    }
  }

  // Normalize scores to max 100 with a baseline minimum of 20 for aesthetics
  const maxRaw = Math.max(rawScores.builder, rawScores.visionary, rawScores.diplomat, rawScores.strategist, 40);
  const scores = {
    builder: Math.min(100, Math.round((rawScores.builder / maxRaw) * 85 + 15)),
    visionary: Math.min(100, Math.round((rawScores.visionary / maxRaw) * 85 + 15)),
    diplomat: Math.min(100, Math.round((rawScores.diplomat / maxRaw) * 85 + 15)),
    strategist: Math.min(100, Math.round((rawScores.strategist / maxRaw) * 85 + 15))
  };

  // Find primary
  let highestId = 'builder';
  let highestVal = -1;
  Object.entries(rawScores).forEach(([k, v]) => {
    if (v > highestVal) {
      highestVal = v;
      highestId = k;
    }
  });

  const primary = ARCHETYPES.find((a) => a.id === highestId) || ARCHETYPES[0];
  const level = Math.max(1, Math.min(5, Math.floor(xp / 150) + 1));
  const titleList = TITLES[primary.id] || TITLES.builder;
  const title = titleList[Math.min(titleList.length - 1, level - 1)];

  return {
    scores,
    primary,
    level,
    totalXp: xp,
    title
  };
}
