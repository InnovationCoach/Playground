/**
 * Hands-on tools for "Project Exodus": pure functions, unit-tested in
 * tests/program-tools-exodus.test.js. The UI is ExodusTools.jsx.
 *
 * Content comes from Don's program file: the 6 Space Emergency Game cards
 * (their food, water, oxygen and morale shocks and their three questions),
 * the levels and badges, the 500 travellers, the 4 team roles that sign the
 * rulebook, and the rulebook section names he does give (3, 5, 6 and 7).
 * Imported as-is, never edited.
 *
 * Don's file does not contain life-support numbers, so every figure in the
 * recycling-loop engine is listed in LIFE_SUPPORT with a tag: ESTIMATE (a
 * published planning figure, rounded) or ASSUMPTION (ours). The tool shows the
 * tags to learners. Rulebook sections 1, 2 and 4 are named from the week 4
 * session text and marked `sourced: false` until checked against his worksheet.
 */
import {
  ARK_GAMIFICATION_BADGES, ARK_GAMIFICATION_LEVELS, ARK_CRISIS_SCENARIOS
} from '../../../../../prototypes/DonPBL/interstellarArkProgram.ts';
import { SESSION_XP, text, int, num, pick, round, normalizeBadges, makeEarnedBadges, weekSessions, sessionToolMap } from './kit.js';

export const PROGRAM_ID = 'interstellar-ark-horizon-2026';
export { SESSION_XP };
export const BADGES = normalizeBadges(ARK_GAMIFICATION_BADGES);
export const LEVELS = ARK_GAMIFICATION_LEVELS;
export const COLONISTS = 500;

/* ------------------------------------------------- Recycling-loop engine */

export const LIFE_SUPPORT = {
  kcalPerPerson: { value: 2500, unit: 'kcal a person a day', tag: 'ESTIMATE', note: 'A common planning figure for an active adult.' },
  o2KgPerPerson: { value: 0.84, unit: 'kg of oxygen a person a day', tag: 'ESTIMATE', note: 'The figure space agencies plan with.' },
  cropKcalPerM2: { value: 60, unit: 'kcal per m² a day', tag: 'ESTIMATE', note: 'High-yield crops under grow lights: roughly 40 m² feeds one person.' },
  spirulinaKcalPerL: { value: 2.9, unit: 'kcal per litre a day', tag: 'ESTIMATE', note: 'About 1 g of dried spirulina per litre a day, at 2.9 kcal a gram.' },
  o2GramsPerKcal: { value: 0.28, unit: 'g of oxygen per kcal grown', tag: 'ESTIMATE', note: 'Photosynthesis chemistry: 192 g of oxygen for every 686 kcal of sugar.' },
  cropEdibleShare: { value: 0.5, unit: 'of a crop plant is food', tag: 'ASSUMPTION', note: 'Stems, roots and leaves also make oxygen while they grow. Spirulina is eaten whole.' },
  waterLPerPerson: { value: 20, unit: 'litres a person a day', tag: 'ASSUMPTION', note: 'Drinking, cooking and washing on a careful ship.' }
};
export const KCAL_TARGET = COLONISTS * LIFE_SUPPORT.kcalPerPerson.value;
export const O2_TARGET_KG = COLONISTS * LIFE_SUPPORT.o2KgPerPerson.value;
export const WATER_USE_L = COLONISTS * LIFE_SUPPORT.waterLPerPerson.value;
export const WATER_TARGET_PCT = 98;

export function cleanEclss(d) {
  return {
    farmM2: int(d?.farmM2, 0, 40000) ?? 8000,
    spirulinaL: int(d?.spirulinaL, 0, 300000) ?? 20000,
    recoveryPct: num(d?.recoveryPct, 80, 100) ?? 90,
    reserveL: int(d?.reserveL, 0, 200000) ?? 30000
  };
}

export function eclssReport(e) {
  const L = LIFE_SUPPORT;
  const cropKcal = e.farmM2 * L.cropKcalPerM2.value;
  const algaeKcal = e.spirulinaL * L.spirulinaKcalPerL.value;
  const kcal = Math.round(cropKcal + algaeKcal);
  const o2Kg = round(((cropKcal / L.cropEdibleShare.value) + algaeKcal) * L.o2GramsPerKcal.value / 1000, 1);
  const lostL = round(WATER_USE_L * (1 - e.recoveryPct / 100), 1);
  return {
    cropKcal: Math.round(cropKcal), algaeKcal: Math.round(algaeKcal), kcal,
    kcalPct: Math.round((kcal / KCAL_TARGET) * 100),
    kcalGap: KCAL_TARGET - kcal,
    peopleFed: Math.floor(kcal / L.kcalPerPerson.value),
    o2Kg, o2Pct: Math.round((o2Kg / O2_TARGET_KG) * 100), o2BalanceKg: round(o2Kg - O2_TARGET_KG, 1),
    lostL, reserveDays: lostL > 0 ? Math.floor(e.reserveL / lostL) : null,
    foodOk: kcal >= KCAL_TARGET, o2Ok: o2Kg >= O2_TARGET_KG, waterOk: e.recoveryPct >= WATER_TARGET_PCT,
    closed: kcal >= KCAL_TARGET && o2Kg >= O2_TARGET_KG && e.recoveryPct >= WATER_TARGET_PCT
  };
}

/* ------------------------------------------------- Space Emergency Game */

export const CARDS = ARK_CRISIS_SCENARIOS.map((c) => ({
  id: c.id, n: c.cardNumber, title: c.title.replace(/^Card \d+:\s*/, '').replace(/\s*\(.*\)$/, ''), kind: c.emergencyTypeLabel, severity: c.severity, summary: c.summary,
  shock: { food: c.caloricShockPct, water: c.waterLoopPenaltyPct, oxygen: c.oxygenPenaltyPct, morale: c.moraleShockPts },
  steps: [c.engineeringPrompt, c.constitutionalPrompt, c.recommendedProtocol].map((s) => s.replace(/^\d\.\s*/, ''))
}));
const CARD_IDS = CARDS.map((c) => c.id);
/** Don gives teams 15 minutes a card. */
export const CARD_SECONDS = 15 * 60;
export const GAUGES = [
  { id: 'morale', label: 'Crew morale' },
  { id: 'food', label: 'Food supply' },
  { id: 'oxygen', label: 'Oxygen reserve' },
  { id: 'water', label: 'Water loop' }
];

export function cleanCrisis(d) {
  const cards = {};
  for (const id of CARD_IDS) {
    const c = d?.cards?.[id];
    cards[id] = { steps: [0, 1, 2].map((i) => c?.steps?.[i] === true), notes: [0, 1, 2].map((i) => text(c?.notes?.[i], 140)) };
  }
  return { card: pick(d?.card, CARD_IDS, CARD_IDS[0]), cards };
}

/**
 * Game rule (ours): a card knocks each gauge down by its shock, and every one
 * of its three questions the team answers on their model wins back a third.
 */
export function crisisGauges(card, state) {
  const answered = state.steps.filter(Boolean).length;
  const left = 1 - answered / 3;
  const out = {};
  for (const g of GAUGES) out[g.id] = Math.round(100 - card.shock[g.id] * left);
  return { ...out, answered, solved: answered === 3, foodDeficitPct: Math.round(card.shock.food * left) };
}

export function crisisReport(d) {
  const solved = CARD_IDS.filter((id) => d.cards[id].steps.every(Boolean));
  return { solved, solvedCount: solved.length, total: CARD_IDS.length };
}

/* ------------------------------------------------- New Planet Rulebook */

export const SIGNERS = ['Builder / Engineer', 'Planet Scientist', 'Farm & Life-Support Lead', 'Law & Community Leader'];
export const SECTIONS = [
  { n: 1, sourced: false, title: 'Rights for Every Person', frame: 'On our planet every person has the right to …',
    options: [{ id: 'body', label: 'a safe body: food, air, water and rest' }, { id: 'mind', label: 'a safe mind: quiet time, play and learning' }, { id: 'respect', label: 'be treated kindly and listened to' }] },
  { n: 2, sourced: false, title: 'Sharing Food, Land and Space', frame: 'When food or space is short, we will share by …',
    options: [{ id: 'equal', label: 'equal shares for everyone' }, { id: 'need', label: 'more for people who need more' }, { id: 'vote', label: 'voting on a fair plan' }] },
  { n: 3, sourced: true, title: 'Sharing Jobs and Resources', frame: 'Hard or messy jobs, like cleaning the compost, will be done by …',
    options: [{ id: 'rotation', label: 'everyone taking turns (fair rotation)' }, { id: 'credits', label: 'volunteers who earn extra rest and fun credits' }] },
  { n: 4, sourced: false, title: 'Choosing Leaders and Emergency Leaders', frame: 'In a space emergency the leader is … and on the planet we choose leaders by …',
    options: [{ id: 'trained', label: 'the person trained for that emergency, then everyone votes' }, { id: 'captain', label: 'the captain, then a council from every job group' }, { id: 'team', label: 'a small safety team, then leaders take turns' }] },
  { n: 5, sourced: true, title: 'Protecting Our New Planet\'s Nature', frame: 'To protect the land, water and living things we will …',
    options: [{ id: 'zones', label: 'keep wild zones where nobody builds' }, { id: 'zero-waste', label: 'recycle everything and leave no waste' }, { id: 'study', label: 'study a place before we change it' }] },
  { n: 6, sourced: true, title: 'Solving Arguments Peacefully', frame: 'We do not want mean punishments. When people argue, first we will …',
    options: [{ id: 'listen', label: 'listen to both sides' }, { id: 'helper', label: 'ask a fair helper to guide the talk' }, { id: 'schedule', label: 'agree a fair schedule for shared places' }] }
];
export const SIGN_SECTION = { n: 7, sourced: true, title: 'Official Colony Signatures' };
export const RULEBOOK_SECTIONS = SECTIONS.length + 1;

export function cleanRulebook(d) {
  const sections = {};
  for (const s of SECTIONS) {
    const raw = d?.sections?.[s.n];
    sections[s.n] = { choice: pick(raw?.choice, s.options.map((o) => o.id)), text: text(raw?.text, 160) };
  }
  return { open: int(d?.open, 1, RULEBOOK_SECTIONS) ?? 1, sections, signers: SIGNERS.map((_, i) => text(d?.signers?.[i], 30)) };
}

/** A section is done with a rule picked and the team's own sentence finishing it. */
export const sectionDone = (s) => !!(s.choice && s.text.trim());

export function rulebookReport(d) {
  const done = SECTIONS.filter((s) => sectionDone(d.sections[s.n])).map((s) => s.n);
  const signed = d.signers.filter((n) => n.trim()).length;
  const allSigned = signed === SIGNERS.length;
  return { done, signed, allSigned, count: done.length + (allSigned ? 1 : 0), total: RULEBOOK_SECTIONS, complete: done.length === SECTIONS.length && allSigned };
}

/* ----------------------------------------------------------------- Badges */

/**
 * Every Exodus badge also asks for something made by hand (a chart, a drawn
 * loop map, a physical model, a role-play), so none unlocks from a tool alone.
 */
const AUTO = {};
export const autoBadge = (id) => id in AUTO;
export const earnedBadges = makeEarnedBadges(BADGES, AUTO);

export const TOOLS = [
  { id: 'eclss-engine', emoji: '🌱', title: 'Recycling Loop Engine', blurb: 'Size the farms and algae tanks to feed 500 people, and close the water and oxygen loops.', sessions: weekSessions(3) },
  { id: 'rulebook', emoji: '📜', title: 'New Planet Rulebook Workshop', blurb: 'Build your 7-section rulebook, one fair rule at a time.', sessions: weekSessions(4, 10) },
  { id: 'crisis-sim', emoji: '🛡️', title: 'Space Emergency Game', blurb: '6 emergency cards. Answer each on your model and watch the ship recover.', sessions: weekSessions(9) }
];
export const SESSION_TOOLS = sessionToolMap(TOOLS);

export const VOCAB = [
  { en: 'recycle', th: 'นำกลับมาใช้ใหม่' },
  { en: 'oxygen', th: 'ออกซิเจน' },
  { en: 'hydroponics', th: 'การปลูกพืชไร้ดิน', note: 'growing plants in water' },
  { en: 'emergency', th: 'เหตุฉุกเฉิน' },
  { en: 'rulebook', th: 'คู่มือกฎ' },
  { en: 'fair', th: 'ยุติธรรม' },
  { en: 'vote', th: 'ลงคะแนนเสียง' },
  { en: 'leader', th: 'ผู้นำ' }
];
