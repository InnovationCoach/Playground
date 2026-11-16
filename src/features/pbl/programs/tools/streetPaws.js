/**
 * Hands-on tools for "StreetPaws": pure functions, unit-tested in
 * tests/program-tools-streetpaws.test.js. The UI is StreetPawsTools.jsx.
 *
 * Content comes from Don's program file: the 4 app pillars, the 8 slides, the
 * 4-speaker script with its [blanks], the week 5 budget (15 kg bag = 600 THB,
 * feeds 10 dogs for 5 days = 12 THB per dog per day, 15 THB bowl button), the
 * problem-statement frame and the 3-click rule. Imported as-is, never edited.
 *
 * The map places and the extra adoption profiles are samples for the mock-up;
 * only Somchai is Don's. Nothing here uploads a photo or records anyone.
 */
import {
  STREETPAWS_GAMIFICATION_BADGES, STREETPAWS_CORE_FEATURES, STREETPAWS_PITCH_SLIDES, STREETPAWS_ESL_PITCH_SCRIPT
} from '../../../../../prototypes/DonPBL/streetPawsProgram.ts';
import { SESSION_XP, text, int, num, bool, pick, idList, round, normalizeBadges, makeEarnedBadges, weekSessions, sessionToolMap } from './kit.js';

export const PROGRAM_ID = 'streetpaws-animal-rescue-2026';
export { SESSION_XP };
export const BADGES = normalizeBadges(STREETPAWS_GAMIFICATION_BADGES, {
  'streetpaws-hazard-scout': '🗺️', 'streetpaws-empathy-listener': '👂', 'streetpaws-three-click-architect': '👆',
  'streetpaws-thb-impact-planner': '🥣', 'streetpaws-qr-station-maker': '📱', 'streetpaws-v2-bug-hunter': '🐞', 'streetpaws-rescue-champion': '🏆'
});
export const PILLARS = STREETPAWS_CORE_FEATURES.map((f, i) => ({
  id: f.id, n: f.number, title: f.title.replace(/^\d+\.\s*/, ''), description: f.description, emoji: ['🥣', '📍', '🚑', '🏡'][i]
}));
const PILLAR_IDS = PILLARS.map((p) => p.id);
export const SLIDES = STREETPAWS_PITCH_SLIDES;

/* -------------------------------------------------------- Pillar 1: food */

/** Week 5 budget example. */
export const FOOD_DEFAULT = { bagTHB: 600, bagKg: 15, dogs: 10, daysPerBag: 5, bowlTHB: 15, bowls: 0 };

export function cleanFood(d) {
  return {
    bagTHB: num(d?.bagTHB, 1, 100000) ?? FOOD_DEFAULT.bagTHB,
    bagKg: num(d?.bagKg, 0.5, 100) ?? FOOD_DEFAULT.bagKg,
    dogs: int(d?.dogs, 1, 500) ?? FOOD_DEFAULT.dogs,
    daysPerBag: int(d?.daysPerBag, 1, 60) ?? FOOD_DEFAULT.daysPerBag,
    bowlTHB: num(d?.bowlTHB, 1, 1000) ?? FOOD_DEFAULT.bowlTHB,
    bowls: int(d?.bowls, 0, 9999) ?? 0
  };
}

/** One bag / (dogs x days) = cost of one dog for one day. A bowl button pays for bowl / that many dog-days. */
export function foodMath(f) {
  const dogDays = f.dogs * f.daysPerBag;
  const perDogDay = round(f.bagTHB / dogDays, 2);
  return {
    perDogDay,
    gramsPerDogDay: Math.round((f.bagKg * 1000) / dogDays),
    monthlyTHB: Math.round(perDogDay * f.dogs * 30),
    bowlsPerBag: Math.ceil(f.bagTHB / f.bowlTHB),
    dogDaysPerBowl: round(f.bowlTHB / perDogDay, 2),
    extraPerBowl: round(f.bowlTHB - perDogDay, 2),
    raisedTHB: round(f.bowls * f.bowlTHB, 2),
    dogDaysFunded: Math.floor((f.bowls * f.bowlTHB) / perDogDay)
  };
}

/* --------------------------------------------------------- Pillar 2: map */

/** Sample spots along a soi for the mock-up; teams replace them with their own hazard-map places. */
export const MAP_SPOTS = [
  { id: 'market', label: 'Behind the market', x: 22, y: 30 },
  { id: 'bts', label: 'BTS station stairs', x: 70, y: 22 },
  { id: 'shop', label: 'Outside the corner shop', x: 48, y: 52 },
  { id: 'temple', label: 'Temple gate', x: 80, y: 68 },
  { id: 'school', label: 'School back gate', x: 26, y: 78 }
];

export function cleanPins(list) {
  const byId = Object.fromEntries((Array.isArray(list) ? list : []).filter((p) => p && typeof p === 'object').map((p) => [p.id, p]));
  return MAP_SPOTS.map((s) => {
    const p = byId[s.id];
    return { id: s.id, x: int(p?.x, 4, 96) ?? s.x, y: int(p?.y, 6, 94) ?? s.y, fed: bool(p?.fed) };
  });
}

/* --------------------------------------------------------- Pillar 3: SOS */

/** The three injury icons from Don's 3-click Medical SOS. */
export const INJURIES = [
  { id: 'broken-leg', label: 'Broken leg', emoji: '🦴' },
  { id: 'skin', label: 'Skin problem', emoji: '🩹' },
  { id: 'hit-by-car', label: 'Hit by car', emoji: '🚗' }
];
const INJURY_IDS = INJURIES.map((i) => i.id);

export function cleanSos(d) {
  return {
    photo: bool(d?.photo), location: bool(d?.location), injury: pick(d?.injury, INJURY_IDS), urgent: bool(d?.urgent),
    raisedTHB: int(d?.raisedTHB, 0, 1000000) ?? 1200, goalTHB: int(d?.goalTHB, 1, 1000000) ?? 2000
  };
}

export function sosReport(s) {
  const clicks = [s.photo, s.location, !!s.injury].filter(Boolean).length;
  return { clicks, ready: clicks === 3, billPct: Math.min(100, Math.round((s.raisedTHB / s.goalTHB) * 100)), priority: s.urgent || s.injury === 'hit-by-car' ? 'urgent' : 'normal' };
}

/* ---------------------------------------------------- Pillar 4: adoption */

export const ANIMALS = [
  { id: 'somchai', kind: 'dog', name: 'Somchai', age: '2 years, male', tags: ['Gentle', 'Quiet', 'Loves belly rubs'], health: 'Vaccinated ✅ · Sterilized ✅', where: 'Sukhumvit Soi 50', sample: false },
  { id: 'nam-tan', kind: 'cat', name: 'Nam Tan', age: '1 year, female', tags: ['Shy', 'Calm', 'Likes quiet homes'], health: 'Vaccinated ✅ · Sterilized ✅', where: 'Sample profile', sample: true },
  { id: 'khao-niao', kind: 'dog', name: 'Khao Niao', age: '8 months, female', tags: ['Playful', 'Fast learner', 'Good with children'], health: 'Vaccinated ✅ · Sterilized ⏳', where: 'Sample profile', sample: true },
  { id: 'mochi', kind: 'cat', name: 'Mochi', age: '3 years, male', tags: ['Friendly', 'Loud purr', 'Good with other cats'], health: 'Vaccinated ✅ · Sterilized ✅', where: 'Sample profile', sample: true }
];
const ANIMAL_IDS = ANIMALS.map((a) => a.id);

/* ------------------------------------------------------ The app prototype */

export function cleanApp(d) {
  const liked = idList(d?.liked, ANIMAL_IDS);
  return {
    tab: pick(d?.tab, PILLAR_IDS, PILLAR_IDS[0]),
    food: cleanFood(d?.food),
    pins: cleanPins(d?.pins),
    sos: cleanSos(d?.sos),
    filter: pick(d?.filter, ['all', 'dog', 'cat'], 'all'),
    liked,
    passed: idList(d?.passed, ANIMAL_IDS).filter((id) => !liked.includes(id))
  };
}

/** Which pillars the learner has actually operated in the mock-up. */
export function pillarsTried(d) {
  return PILLAR_IDS.filter((id, i) => [d.food.bowls > 0, d.pins.some((p) => p.fed), sosReport(d.sos).ready, d.liked.length > 0][i]);
}

export function swipe(d, animalId, like) {
  if (!ANIMAL_IDS.includes(animalId)) return d;
  const without = (list) => list.filter((id) => id !== animalId);
  return like ? { ...d, liked: [...without(d.liked), animalId], passed: without(d.passed) }
    : { ...d, passed: [...without(d.passed), animalId], liked: without(d.liked) };
}

/* ------------------------------------------------- Personas and 3 clicks */

export const PERSONA_KINDS = [
  { id: 'donor', label: 'The Food Donor', emoji: '🥣' },
  { id: 'feeder', label: 'The Volunteer Feeder', emoji: '📍',
    example: { name: 'Auntie Mali', age: 45, goal: 'Wants to feed 10 cats near the BTS station every Tuesday.',
      problem: 'When she gets sick, nobody feeds the cats because other volunteers don\'t know her schedule.' } },
  { id: 'adopter', label: 'The Adopter', emoji: '🏡' }
];
/** Don's frame: "[User Name] needs a way to [Action] because [Reason], so our app will [Solution]." */
export const STATEMENT_SLOTS = [
  { id: 'action', lead: 'needs a way to', helpers: [
    { en: 'donate food easily', th: 'บริจาคอาหารได้ง่าย' }, { en: 'know who fed the animals today', th: 'รู้ว่าวันนี้ใครให้อาหารแล้ว' },
    { en: 'report a sick animal fast', th: 'แจ้งสัตว์ป่วยได้เร็ว' }, { en: 'find a pet to adopt', th: 'หาสัตว์เพื่อรับเลี้ยง' }] },
  { id: 'reason', lead: 'because', helpers: [
    { en: 'they are very busy', th: 'เขาไม่มีเวลา' }, { en: 'nobody knows the feeding schedule', th: 'ไม่มีใครรู้ตารางให้อาหาร' },
    { en: 'they do not know where to donate', th: 'ไม่รู้ว่าจะบริจาคที่ไหน' }, { en: 'vet bills are expensive', th: 'ค่ารักษาสัตว์แพง' }] },
  { id: 'solution', lead: 'so our app will', helpers: [
    { en: 'show a live feeding map', th: 'แสดงแผนที่ให้อาหารแบบสด' }, { en: 'add a 15 Baht bowl button', th: 'มีปุ่มบริจาค 15 บาท' },
    { en: 'send an SOS alert in 3 clicks', th: 'ส่งแจ้งเหตุด่วนใน 3 คลิก' }, { en: 'show adoption profiles', th: 'แสดงโปรไฟล์สัตว์ที่รอบ้าน' }] }
];
export const CLICK_LIMIT = 3;
export const CLICK_MAX = 6;

export function cleanPersonas(d) {
  const personas = {};
  for (const k of PERSONA_KINDS) {
    const p = d?.personas?.[k.id];
    personas[k.id] = {
      name: text(p?.name, 40), age: int(p?.age, 5, 99), goal: text(p?.goal, 140), problem: text(p?.problem, 140),
      action: text(p?.action, 100), reason: text(p?.reason, 100), solution: text(p?.solution, 100)
    };
  }
  const clicks = {};
  for (const id of PILLAR_IDS) clicks[id] = (Array.isArray(d?.clicks?.[id]) ? d.clicks[id] : []).slice(0, CLICK_MAX).map((s) => text(s, 50)).filter(Boolean);
  return { personas, clicks };
}

export const personaComplete = (p) => !!(p.name.trim() && p.goal.trim() && p.problem.trim() && p.action.trim() && p.reason.trim() && p.solution.trim());
export const statementFor = (p) => `${p.name.trim() || '[User Name]'} needs a way to ${p.action.trim() || '[Action]'} because ${p.reason.trim() || '[Reason]'}, so our app will ${p.solution.trim() || '[Solution]'}.`;

export function personaReport(d) {
  const complete = PERSONA_KINDS.filter((k) => personaComplete(d.personas[k.id])).length;
  const pillars = PILLARS.map((p) => { const n = d.clicks[p.id].length; return { ...p, steps: n, ok: n >= 1 && n <= CLICK_LIMIT }; });
  return { complete, pillars, pillarsOk: pillars.filter((p) => p.ok).length, done: complete === PERSONA_KINDS.length && pillars.every((p) => p.ok) };
}

/* ---------------------------------------------------------- Pitch script */

const minutes = (s) => Math.round(parseFloat(s) * 60);
export const SPEAKERS = STREETPAWS_ESL_PITCH_SCRIPT.map((s) => ({ n: s.speakerNumber, title: s.title.replace(/^Speaker \d+:\s*/, ''), sec: minutes(s.duration), lines: s.scriptTemplate }));
export const PITCH_SECONDS = SPEAKERS.reduce((s, x) => s + x.sec, 0);

/** "[Amount, e.g., 15 Baht]" and "[Number]" become blanks; the same label is one blank wherever it appears. */
export const blankKey = (label) => label.split(/,\s*e\.g\./)[0].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

export function parseLine(line) {
  return line.split(/(\[[^\]]+\])/).filter(Boolean).map((part) => {
    const m = part.match(/^\[([^\]]+)\]$/);
    if (!m) return { text: part };
    const [label, example = ''] = m[1].split(/,\s*e\.g\.,?\s*/);
    return { blank: blankKey(m[1]), label: label.trim(), example: example.trim() };
  });
}

export const SCRIPT = SPEAKERS.map((s) => ({ ...s, lines: s.lines.map(parseLine) }));
export const BLANKS = [...new Map(SCRIPT.flatMap((s) => s.lines.flat()).filter((p) => p.blank).map((p) => [p.blank, p])).values()];
const BLANK_KEYS = BLANKS.map((b) => b.blank);

export function cleanPitch(d) {
  const fills = {};
  for (const k of BLANK_KEYS) { const v = text(d?.fills?.[k], 60); if (v) fills[k] = v; }
  return {
    fills,
    names: SPEAKERS.map((_, i) => text(d?.names?.[i], 30)),
    times: SPEAKERS.map((_, i) => int(d?.times?.[i], 0, 3600)),
    slides: [...new Set((Array.isArray(d?.slides) ? d.slides : []).filter((n) => SLIDES.some((s) => s.slideNumber === n)))].sort((a, b) => a - b)
  };
}

/** A speaker is on time within 15 seconds of their slot. */
export const SPEAKER_SLACK = 15;

export function pitchReport(d) {
  const speakers = SPEAKERS.map((s, i) => {
    const t = d.times[i];
    return { ...s, time: t, onTime: t != null && Math.abs(t - s.sec) <= SPEAKER_SLACK };
  });
  const rehearsed = speakers.filter((s) => s.time != null);
  return {
    speakers,
    filled: BLANK_KEYS.filter((k) => d.fills[k]).length, blanks: BLANK_KEYS.length,
    slidesReady: d.slides.length, slides: SLIDES.length,
    totalSec: rehearsed.reduce((s, x) => s + x.time, 0),
    allRehearsed: rehearsed.length === SPEAKERS.length,
    onTime: speakers.every((s) => s.onTime)
  };
}

/* ----------------------------------------------------------------- Badges */

const AUTO = {
  'streetpaws-three-click-architect': (t) => !!t['persona-builder'] && personaReport(cleanPersonas(t['persona-builder'])).done
};
export const autoBadge = (id) => id in AUTO;
export const earnedBadges = makeEarnedBadges(BADGES, AUTO);

export const TOOLS = [
  { id: 'persona-builder', emoji: '🧑‍🤝‍🧑', title: 'Persona & Problem Statement Builder', blurb: '3 personas, a problem statement for each, and a 3-click check on all 4 pillars.', sessions: weekSessions(3, 4) },
  { id: 'app-prototype', emoji: '📱', title: '4-Pillar App Prototype', blurb: 'A phone mock-up of the 4 pillars: food maths, feeding map, SOS and adoption.', sessions: weekSessions(5, 7, 8) },
  { id: 'pitch-script', emoji: '🎤', title: 'Showcase Pitch Script', blurb: '8 slides, 4 speakers and 10 minutes, with fill-in-the-blank lines and a rehearsal timer.', sessions: weekSessions(11, 12) }
];
export const SESSION_TOOLS = sessionToolMap(TOOLS);

export const VOCAB = [
  { en: 'stray', th: 'สัตว์จรจัด' },
  { en: 'donate', th: 'บริจาค' },
  { en: 'volunteer', th: 'อาสาสมัคร' },
  { en: 'adopt', th: 'รับเลี้ยง' },
  { en: 'vaccinated', th: 'ฉีดวัคซีนแล้ว' },
  { en: 'sterilized', th: 'ทำหมันแล้ว' },
  { en: 'urgent', th: 'เร่งด่วน' },
  { en: 'persona', th: 'ตัวแทนผู้ใช้', note: 'a made-up person who stands for real users' },
  { en: 'problem statement', th: 'ข้อความระบุปัญหา' },
  { en: 'budget', th: 'งบประมาณ' }
];
