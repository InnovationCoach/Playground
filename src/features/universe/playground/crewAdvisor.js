import { geminiApi } from '../../../services/geminiApi.js';
import { fireRiskForRecord, starModifiersForClass } from './playgroundModel.js';

/**
 * The four AI crew characters. Each has its own colour and initials, so the
 * learner can tell who is speaking in briefings, replies and the roster. Ids
 * match the crew members in playgroundModel.DEFAULT_CREW.
 */
export const CREW_PERSONAS = [
  { id: 'aria-7', name: 'Aria-7', short: 'Aria', role: 'AI Ecologist', initials: 'A7', color: '#96d700', focus: 'Ecosystems & habitability' },
  { id: 'lyra-vance', name: 'Dr. Lyra Vance', short: 'Lyra', role: 'Xeno-Biologist', initials: 'LV', color: '#c58cff', focus: 'Living things & food webs' },
  { id: 'kai-sato', name: 'Chief Kai Sato', short: 'Kai', role: 'Habitat Engineer', initials: 'KS', color: '#ffb547', focus: 'Atmosphere, builds & fire safety' },
  { id: 'soren-hale', name: 'Lt. Soren Hale', short: 'Soren', role: 'Safety Officer', initials: 'SH', color: '#ff6b7d', focus: 'Hazards & shielding' }
];

/** One-tap questions so learners who find typing hard can still ask the crew. */
export const QUICK_ASKS = [
  { id: 'next', label: 'What next?', question: 'What should our crew prioritize next?' },
  { id: 'life', label: 'Grow life safely', question: 'How do we grow life and biodiversity safely?' },
  { id: 'fire', label: 'Oxygen & fire', question: 'Is our oxygen level a fire risk?' },
  { id: 'hazard', label: 'Handle the hazard', question: 'How should we handle the active hazard?' }
];

export function personaById(id) {
  return CREW_PERSONAS.find((p) => p.id === id) || CREW_PERSONAS[0];
}

/**
 * Works out which crew member said a line: by a leading "Name:" or by the
 * first crew name mentioned. Falls back to Aria-7.
 */
export function personaForText(text = '') {
  const t = String(text);
  let best = null;
  let bestAt = Infinity;
  for (const p of CREW_PERSONAS) {
    for (const n of [p.name, p.short, p.name.split(' ').pop()]) {
      const at = t.indexOf(n);
      if (at !== -1 && at < bestAt) { best = p; bestAt = at; }
    }
  }
  return best || CREW_PERSONAS[0];
}

/** Removes a leading `Name:` / `Name (Role):` prefix and wrapping quotes, so the bubble shows the words only. */
export function stripSpeaker(text = '') {
  let t = String(text).trim();
  for (const p of CREW_PERSONAS) {
    for (const n of [p.name, p.short]) {
      const re = new RegExp(`^${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s*\\([^)]*\\))?\\s*:\\s*`);
      if (re.test(t)) { t = t.replace(re, ''); break; }
    }
  }
  if (/^["“].*["”]$/.test(t)) t = t.slice(1, -1);
  return t.trim();
}

/** A crew line ready to render: who said it and what they said. */
export function toCrewLine(text) {
  const persona = personaForText(text);
  return { speakerId: persona.id, text: stripSpeaker(text) };
}

/**
 * Deterministic Socratic fallback when Gemini backend is offline or unauthenticated.
 */
export function fallbackCrewAdvice({ planet, system, record, question }) {
  const name = planet?.name || 'this exoplanet';
  const mods = starModifiersForClass(system?.starClass);
  const fire = fireRiskForRecord(record);
  const q = (question || '').toLowerCase();

  if (record?.activeHazard) {
    return `Lt. Soren Hale: "${record.activeHazard.name} is active on ${name}. Weigh whether immediate Shielding (${record.shielding}%) or ecological Research (${record.research}%) serves your long-term biosphere best."`;
  }
  if (/fire|o2|oxygen|atmo/.test(q) || fire.level === 'Elevated') {
    return `Chief Kai Sato: "${name}'s atmosphere is at ${fire.o2}% O₂ (Fire Risk: ${fire.level}). Consider Automated Fire Suppression before pushing oxygen higher."`;
  }
  if (/life|species|fauna|flora|bio/.test(q)) {
    return `Dr. Lyra Vance: "Remember our trophic food-web rule on ${name}: establish a Flora or Microbe producer first before cultivating Fauna!"`;
  }
  return `Aria-7 (AI Ecologist): "${name} orbits a ${mods.label} (Solar ×${mods.solarBonus}). Habitability is ${record?.habitability ?? 25}% and Biodiversity is ${record?.biodiversity ?? 10}% — what ecosystem milestone should we target next?"`;
}

/** The tutor endpoint returns the reply as a string; older shapes wrapped it in an object. */
function replyText(res) {
  if (typeof res === 'string') return res;
  return res?.reply || res?.response || res?.text || res?.message || '';
}

/**
 * Requests live AI NPC Crew advice via Gemini when available, falling back cleanly
 * to deterministic Socratic STEM guidance in offline/emulator/test environments.
 * Returns `{ reply, source, speakerId }`; `source` is 'gemini' or 'local'.
 */
export async function fetchCrewAdvisorReply({ planet, system, record, question, useRemote = true, api = geminiApi } = {}) {
  const local = fallbackCrewAdvice({ planet, system, record, question });
  const localResult = { reply: local, source: 'local', speakerId: personaForText(local).id };
  if (!useRemote) return localResult;

  try {
    const cleanQuestion = String(question || 'What should our crew prioritize next?').trim().slice(0, 300);
    const activityContext = [
      `AI NPC Crew Advisor aboard exoplanet "${planet?.name || 'Unknown'}" (${planet?.kind || 'ocean'} biome, star: ${system?.starClass || 'G-type'}).`,
      `Telemetry: Habitability ${record?.habitability}%, Biodiversity ${record?.biodiversity}%, Shielding ${record?.shielding}%, O2 ${record?.atmosphere?.o2 ?? 12}%, Active Hazard: ${record?.activeHazard?.name || 'None'}.`,
      'Reply in 2 concise Socratic sentences as ONE crew specialist (Aria-7, Dr. Lyra Vance, Chief Kai Sato, or Lt. Soren Hale). Never solve mission math directly.',
      'Start your reply with the speaker name followed by a colon, e.g. "Chief Kai Sato: ...".'
    ].join(' ');
    const res = await api.generateContextualResponse(
      { message: cleanQuestion, activityContext, action: 'crew_advisor' },
      activityContext
    );
    const text = replyText(res);
    if (typeof text === 'string' && text.trim()) {
      const reply = text.trim();
      return { reply, source: 'gemini', speakerId: personaForText(reply).id };
    }
  } catch {
    // Expected when running offline or without auth token; fall back gracefully.
  }
  return localResult;
}
