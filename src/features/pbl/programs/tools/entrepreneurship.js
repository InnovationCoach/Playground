/**
 * Hands-on tools for "Entrepreneurship: Product Creation": pure functions,
 * unit-tested in tests/program-tools.test.js. The UI is EntrepreneurshipTools.jsx.
 *
 * Content comes from Don's program file (badges, founder levels, simulation
 * presets, the margin bands and formulas in sessions 13-14, the 4-block pitch
 * in session 16). It is imported as-is and never edited from here.
 *
 * A badge is unlocked automatically only when the tool can see the condition
 * met. Badges that need a person to watch (interviews, silent usability lab,
 * a live pitch with Q&A) are shown as coach-awarded and stay locked here.
 */
import {
  ENTREPRENEURSHIP_BADGES, ENTREPRENEURSHIP_LEVELS, ENTREPRENEURSHIP_SIMULATION_PRESETS
} from '../../../../../prototypes/DonPBL/entrepreneurshipProgram.ts';

export const PROGRAM_ID = 'entrepreneurship-product-creation-2026';
export const BADGES = ENTREPRENEURSHIP_BADGES;
export const LEVELS = ENTREPRENEURSHIP_LEVELS;
export const PRESETS = ENTREPRENEURSHIP_SIMULATION_PRESETS;

/**
 * Points for finishing a session. Don's ladder tops out at 5,500 XP and his
 * badges add up to 3,600, so sessions have to carry the rest; 150 x 18 makes
 * the top level reachable. Our assumption, listed for Don on the Checks tab.
 */
export const SESSION_XP = 150;

const str = (v, max) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trimStart().slice(0, max) : '');
const int = (v, lo, hi) => (Number.isFinite(Number(v)) ? Math.min(hi, Math.max(lo, Math.round(Number(v)))) : null);
const num = (v, lo, hi) => (Number.isFinite(Number(v)) ? Math.min(hi, Math.max(lo, Number(v))) : null);

/* ------------------------------------------------------------ Friction log */

export const FRICTION_MAX = 12;

export function cleanFriction(d) {
  const entries = (Array.isArray(d?.entries) ? d.entries : []).slice(0, FRICTION_MAX).map((e, i) => ({
    id: str(e?.id, 30) || `f${i}`,
    context: str(e?.context, 140),
    workaround: str(e?.workaround, 140),
    impact: int(e?.impact, 1, 5),
    frequency: int(e?.frequency, 1, 5)
  }));
  return { entries };
}

export const isCompleteFriction = (e) => !!(e.context.trim() && e.workaround.trim() && e.impact && e.frequency);
export const frictionScore = (e) => (e.impact || 0) * (e.frequency || 0);

/** The highest-scoring complete entries; ties keep log order. */
export function topFrictions(entries, n = 2) {
  return entries.filter(isCompleteFriction).map((e, i) => ({ e, i }))
    .sort((a, b) => frictionScore(b.e) - frictionScore(a.e) || a.i - b.i).slice(0, n).map((x) => x.e.id);
}

/* --------------------------------------------------------------- Crazy 8s */

/** Session 7's constraints, two panels each. */
export const CRAZY8_PANELS = [
  'Direct', 'Direct', 'Zero-cost / scrap', 'Zero-cost / scrap', 'Modular', 'Modular', 'Radical', 'Radical'
];
export const CRAZY8_SECONDS = 60;

export function cleanCrazy8(d) {
  const panels = Array.from({ length: 8 }, (_, i) => str(d?.panels?.[i], 60));
  return { panels, sprints: int(d?.sprints, 0, 99) || 0 };
}

export const crazy8Done = (d) => d.panels.every((p) => p.trim()) && d.sprints > 0;

/* --------------------------------------------------------- Unit economics */

/** Session 14's benchmark gross margins. */
export const MARGIN_BANDS = { physical: [50, 65], digital: [70, 85] };
export const COST_ITEMS_MAX = 10;

export function presetEconomics(preset) {
  return {
    presetId: preset.id,
    track: preset.track,
    items: [{ name: 'Materials for one unit', cost: preset.unitFloorCostTHB }],
    marginPct: preset.targetGrossMarginPct,
    fixedTHB: preset.fixedStartupExpenseTHB,
    cashTHB: preset.starterCashTHB,
    demandWeekly: preset.simulatedMarketDemandWeekly
  };
}

export function cleanEconomics(d) {
  const base = presetEconomics(PRESETS[0]);
  if (!d || typeof d !== 'object') return base;
  return {
    presetId: PRESETS.some((p) => p.id === d.presetId) ? d.presetId : null,
    track: d.track === 'digital' ? 'digital' : 'physical',
    items: (Array.isArray(d.items) ? d.items : []).slice(0, COST_ITEMS_MAX)
      .map((it) => ({ name: str(it?.name, 60), cost: num(it?.cost, 0, 100000) ?? 0 })),
    marginPct: num(d.marginPct, 0, 95) ?? base.marginPct,
    fixedTHB: num(d.fixedTHB, 0, 1000000) ?? 0,
    cashTHB: num(d.cashTHB, 0, 1000000) ?? 0,
    demandWeekly: int(d.demandWeekly, 0, 10000) ?? 0
  };
}

const round2 = (x) => Math.round(x * 100) / 100;

/**
 * Session 13-14 maths: Unit Floor Cost = sum of items; Retail = cost / (1 - margin);
 * Break-even units = startup capital / (price - cost). The cash line assumes the
 * learner sells the simulated weekly demand, for the 12-week term.
 */
export function unitEconomics(d, weeks = 12) {
  const unitCost = round2(d.items.reduce((s, it) => s + (it.cost || 0), 0));
  const m = d.marginPct / 100;
  const price = m < 1 ? round2(unitCost / (1 - m)) : 0;
  const profit = round2(price - unitCost);
  const breakEvenUnits = profit > 0 ? Math.ceil(d.fixedTHB / profit) : null;
  const weeksToBreakEven = breakEvenUnits != null && d.demandWeekly > 0 ? Math.ceil(breakEvenUnits / d.demandWeekly) : null;
  const cash = [];
  let c = d.cashTHB - d.fixedTHB;
  for (let w = 0; w <= weeks; w += 1) { cash.push(Math.round(c)); c += profit * d.demandWeekly; }
  const [lo, hi] = MARGIN_BANDS[d.track];
  return {
    unitCost, price, profit, breakEvenUnits, weeksToBreakEven, cash,
    band: [lo, hi], inBand: d.marginPct >= lo && d.marginPct <= hi,
    itemised: d.items.filter((it) => it.name.trim() && it.cost > 0).length >= 2,
    inBadgeRange: unitCost > 0 && d.marginPct >= 50 && d.marginPct <= 85 && breakEvenUnits != null
  };
}

/* ------------------------------------------------------------ Pitch timer */

/** Session 16's 4-block, 180-second pitch. */
export const PITCH_BLOCKS = [
  { id: 'problem', label: 'Problem & quote', sec: 45, cue: 'The friction, and a real quote from an interview.' },
  { id: 'solution', label: 'Solution & demo', sec: 60, cue: 'Show version 1.1 working. Start by 0:45.' },
  { id: 'economics', label: 'Economics & margin', sec: 45, cue: 'Unit cost, price, margin, break-even.' },
  { id: 'ask', label: 'Next step & ask', sec: 30, cue: 'Exactly what you need, and what it unlocks.' }
];
export const PITCH_SECONDS = PITCH_BLOCKS.reduce((s, b) => s + b.sec, 0);

/** Session 17's drill: peers ask about durability, competition or price. Answer in 20 seconds. */
export const QA_SECONDS = 20;
export const QA_QUESTIONS = [
  'What happens after a month of daily use? How do you know it will not break?',
  'Why would someone pay for this instead of using their current workaround?',
  'Who else sells something like this, and why is yours better?',
  'How did you decide on your price?',
  'How many do you need to sell before you make your money back?',
  'What did your testers struggle with, and what did you change?',
  'Where will your first 25 customers come from?',
  'What is the biggest risk to this product, and what is your plan for it?',
  'If you had half the budget, what would you cut?',
  'What is one quote from a real user that proves the problem exists?'
];

export function cleanPitch(d) {
  const runs = (Array.isArray(d?.runs) ? d.runs : []).slice(-10).map((r) => ({
    totalSec: int(r?.totalSec, 0, 3600) ?? 0,
    block2AtSec: int(r?.block2AtSec, 0, 3600),
    at: Number.isFinite(r?.at) ? r.at : 0
  }));
  const answers = (Array.isArray(d?.answers) ? d.answers : []).slice(-30).map((a) => int(a, 0, 600) ?? 0);
  return { runs, answers };
}

/** A run is "on time" within 10 seconds of 3:00, with the demo starting by 0:45. */
export const runOnTime = (r) => Math.abs(r.totalSec - PITCH_SECONDS) <= 10 && r.block2AtSec != null && r.block2AtSec <= 45;

/* ----------------------------------------------------------------- Badges */

/** Badges a tool can verify, and how. The rest are awarded by a coach. */
const AUTO = {
  'badge-friction-hunter': (t) => cleanFriction(t['friction-log']).entries.filter(isCompleteFriction).length >= 5,
  'badge-crazy-8-sprinter': (t) => crazy8Done(cleanCrazy8(t['crazy-8s'])),
  // Session 13 asks for an itemised COGS, so a preset's single line does not count.
  'badge-unit-economics-master': (t) => {
    if (!t['unit-economics']) return false;
    const r = unitEconomics(cleanEconomics(t['unit-economics']));
    return r.itemised && r.inBadgeRange;
  }
};
export const autoBadge = (id) => id in AUTO;

export function earnedBadges(progress) {
  const tools = progress?.tools || {};
  return BADGES.filter((b) => AUTO[b.id]?.(tools)).map((b) => b.id);
}

export function founderXp(progress, program) {
  const done = program.sessions.filter((s) => progress.sessions[s.sessionNumber]?.done).length;
  const earned = new Set(earnedBadges(progress));
  return done * SESSION_XP + BADGES.filter((b) => earned.has(b.id)).reduce((s, b) => s + b.xpAward, 0);
}

export function founderLevel(xp) {
  const i = LEVELS.reduce((best, l, idx) => (xp >= l.minXp ? idx : best), 0);
  const cur = LEVELS[i];
  const next = LEVELS[i + 1] || null;
  return { ...cur, next, pct: next ? Math.round(((xp - cur.minXp) / (next.minXp - cur.minXp)) * 100) : 100 };
}

/** Which tool belongs in which session. */
export const SESSION_TOOLS = { 1: 'friction-log', 2: 'friction-log', 7: 'crazy-8s', 13: 'unit-economics', 14: 'unit-economics', 16: 'pitch-timer', 17: 'pitch-timer' };

export const TOOLS = [
  { id: 'friction-log', emoji: '🔍', title: 'Friction Logger', blurb: 'Log everyday annoyances, then let the matrix show your top 2.', sessions: [1, 2] },
  { id: 'crazy-8s', emoji: '⚡', title: 'Crazy 8s Sprint', blurb: '8 ideas in 8 minutes, with a timer that keeps you moving.', sessions: [7] },
  { id: 'unit-economics', emoji: '📊', title: 'Unit Economics Lab', blurb: 'Cost, price, margin and break-even in Thai Baht, live.', sessions: [13, 14] },
  { id: 'pitch-timer', emoji: '🎤', title: 'Pitch Arena', blurb: 'A 3-minute, 4-block pitch timer and a 20-second Q&A drill.', sessions: [16, 17] }
];
