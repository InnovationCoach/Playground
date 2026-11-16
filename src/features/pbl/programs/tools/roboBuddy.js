/**
 * Hands-on tools for "Robo-Buddy Companion": pure functions, unit-tested in
 * tests/program-tools-robo-buddy.test.js. The UI is RoboBuddyTools.jsx.
 *
 * Content comes from Don's program file (badges, the two pinout versions, the
 * week 7-10 numbers: trim within +/-5 degrees, Hunger >= 65, Energy <= 35,
 * pet +15, feed -20, 3 head touches or a wave within 15 cm, 20 + 10 + 10 trials
 * with 32 of 40 to pass). It is imported as-is and never edited from here.
 *
 * The gait balance view and the pet's timer speeds are a teaching model, not
 * readings from a robot. Where a number is ours and not Don's it says so.
 */
import { ROBO_BUDDY_GAMIFICATION_BADGES, ROBO_BUDDY_PINOUT_GUIDE } from '../../../../../prototypes/DonPBL/roboBuddyProgram.ts';
import { SESSION_XP, int, bool, pick, idList, normalizeBadges, makeEarnedBadges, weekSessions, sessionToolMap } from './kit.js';

export const PROGRAM_ID = 'robo-buddy-companion-2026';
export { SESSION_XP };
export const BADGES = normalizeBadges(ROBO_BUDDY_GAMIFICATION_BADGES, {
  'badge-rb-90deg-whisperer': '🎚️', 'badge-rb-bipedal-walker': '👣', 'badge-rb-tamagotchi-architect': '💗',
  'badge-rb-cad-shellsmith': '📦', 'badge-rb-alarm-guardian': '🔔', 'badge-rb-40test-survivor': '✅', 'badge-rb-adoption-champion': '🏆'
});
export const PINOUTS = ROBO_BUDDY_PINOUT_GUIDE;

/* ------------------------------------------------------------- Gait lab */

export const SERVOS = [
  { id: 'lh', label: 'Left hip', short: 'LH' },
  { id: 'rh', label: 'Right hip', short: 'RH' },
  { id: 'lf', label: 'Left foot', short: 'LF' },
  { id: 'rf', label: 'Right foot', short: 'RF' }
];
const SERVO_IDS = SERVOS.map((s) => s.id);
export const TRIM_RANGE = 15;
/** Week 7: software trim stays within +/-5 degrees of 90. */
export const TRIM_TARGET = 5;

/**
 * Each move as a loop of phases. `com` is where the body's weight sits, from
 * -1 (over the left foot) to +1 (over the right foot); `lift` is the foot in
 * the air. Forward is Don's 4-phase cycle from week 7; the others reuse the
 * same weight shifts, the way the Otto DIY library does.
 */
export const MOVES = [
  { id: 'forward', label: 'Forward', phases: [
    { label: 'Tilt right foot: weight shifts right', com: 0.7, lift: null, hip: 0 },
    { label: 'Swing left hip forward', com: 0.7, lift: 'L', hip: 1 },
    { label: 'Level, then tilt left foot: weight shifts left', com: -0.7, lift: null, hip: 1 },
    { label: 'Swing right hip forward', com: -0.7, lift: 'R', hip: -1 }
  ] },
  { id: 'backward', label: 'Backward', phases: [
    { label: 'Tilt right foot: weight shifts right', com: 0.7, lift: null, hip: 0 },
    { label: 'Swing left hip back', com: 0.7, lift: 'L', hip: -1 },
    { label: 'Level, then tilt left foot: weight shifts left', com: -0.7, lift: null, hip: -1 },
    { label: 'Swing right hip back', com: -0.7, lift: 'R', hip: 1 }
  ] },
  { id: 'turn-left', label: 'Turn left', phases: [
    { label: 'Tilt right foot: weight shifts right', com: 0.7, lift: null, hip: 0 },
    { label: 'Swing left hip back (short step)', com: 0.7, lift: 'L', hip: -1 },
    { label: 'Tilt left foot: weight shifts left', com: -0.7, lift: null, hip: -1 },
    { label: 'Swing right hip forward (long step)', com: -0.7, lift: 'R', hip: 1 }
  ] },
  { id: 'moonwalk', label: 'Moonwalk', phases: [
    { label: 'Roll onto the right foot edge', com: 0.4, lift: null, hip: 0 },
    { label: 'Slide the left foot across', com: 0.1, lift: null, hip: 0 },
    { label: 'Roll onto the left foot edge', com: -0.4, lift: null, hip: 0 },
    { label: 'Slide the right foot across', com: -0.1, lift: null, hip: 0 }
  ] },
  { id: 'wave', label: 'Wave', phases: [
    { label: 'Tilt right foot: weight shifts right', com: 0.7, lift: null, hip: 0 },
    { label: 'Lift the left foot and wave it up', com: 0.7, lift: 'L', hip: 0 },
    { label: 'Wave it down', com: 0.6, lift: 'L', hip: 0 },
    { label: 'Put the foot down and stand level', com: 0, lift: null, hip: 0 }
  ] }
];
const MOVE_IDS = MOVES.map((m) => m.id);

export function cleanGait(d) {
  const trims = Object.fromEntries(SERVO_IDS.map((id) => [id, int(d?.trims?.[id], -TRIM_RANGE, TRIM_RANGE) ?? 0]));
  return {
    centered: idList(d?.centered, SERVO_IDS),
    trims,
    fromRobot: bool(d?.fromRobot),
    move: pick(d?.move, MOVE_IDS, 'forward')
  };
}

export const trimsInTarget = (trims) => SERVO_IDS.every((id) => Math.abs(trims[id]) <= TRIM_TARGET);

/**
 * Balance model. Foot trims that are off level lean the whole body (1 degree on
 * both feet moves the weight about 1/30 of the way across); hip trims twist the
 * stance and narrow the safe zone. With one foot lifted the weight has to sit
 * past 0.3 on the standing foot's side, or the robot tips. With both feet down
 * it only falls if the weight goes beyond the outer edge of a sole.
 */
export function balanceAt(trims, phase) {
  const lean = (trims.lf + trims.rf) / 30;
  const raw = phase.com + lean;
  const com = Math.max(-1, Math.min(1, raw));
  const twist = Math.abs(trims.lh - trims.rh) / 60;
  const need = 0.3 + twist;
  // With both feet down the soles reach a little past each ankle, so the weight can sit out to 1.3.
  const margin = phase.lift === 'L' ? com - need : phase.lift === 'R' ? -com - need : 1.3 - Math.abs(raw) - twist;
  return { com, margin: Math.round(margin * 100) / 100, stable: margin > 0 };
}

export function gaitReport(d) {
  const move = MOVES.find((m) => m.id === d.move) || MOVES[0];
  const phases = move.phases.map((p) => ({ ...p, ...balanceAt(d.trims, p) }));
  const standing = balanceAt(d.trims, { com: 0, lift: null });
  return {
    move, phases, standing,
    walks: phases.every((p) => p.stable),
    allCentered: d.centered.length === SERVO_IDS.length,
    inTarget: trimsInTarget(d.trims)
  };
}

/** The 90-degree badge: all four servos centred before the horns went on, and our real trims within +/-5. */
export const whispererDone = (d) => d.centered.length === SERVO_IDS.length && d.fromRobot && trimsInTarget(d.trims);

/* ------------------------------------------------------------ Pet brain */

export const MOODS = [
  { id: 'happy', label: 'Happy', face: '😊', rule: 'Nothing is wrong' },
  { id: 'hungry', label: 'Hungry', face: '😋', rule: 'Hunger ≥ 65' },
  { id: 'sleepy', label: 'Sleepy', face: '😴', rule: 'Energy ≤ 35' },
  { id: 'bored', label: 'Bored', face: '😑', rule: 'Happiness ≤ 35' },
  { id: 'alarm', label: 'Alarm Ringing', face: '⏰', rule: 'Timer reaches zero' }
];
const MOOD_IDS = MOODS.map((m) => m.id);
/** Week 8 thresholds are Don's. He gives no number for Bored; 35 mirrors his Sleepy rule and is our assumption. */
export const PET_RULES = { hungryAt: 65, sleepyAt: 35, boredAt: 35, petBoost: 15, feedDrop: 20, restBoost: 25 };
/** How fast the stats drift each second in this simulator. Ours, chosen so a demo takes about a minute. */
export const PET_DRIFT = { hunger: 2, happiness: -1.5, energy: -1 };
export const ALARM_RULES = { touches: 3, waveCm: 15 };

const pct = (v, fallback) => int(v, 0, 100) ?? fallback;

export function cleanPet(d) {
  return {
    hunger: pct(d?.hunger, 20),
    happiness: pct(d?.happiness, 80),
    energy: pct(d?.energy, 80),
    alarm: bool(d?.alarm),
    seen: idList(d?.seen, MOOD_IDS),
    dismissed: idList(d?.dismissed, ['touch', 'wave'])
  };
}

/** One state at a time. The alarm wins, then the most urgent need. */
export function petMood(s) {
  if (s.alarm) return 'alarm';
  if (s.hunger >= PET_RULES.hungryAt) return 'hungry';
  if (s.energy <= PET_RULES.sleepyAt) return 'sleepy';
  if (s.happiness <= PET_RULES.boredAt) return 'bored';
  return 'happy';
}

const clamp100 = (v) => Math.max(0, Math.min(100, Math.round(v)));
const withSeen = (s) => { const m = petMood(s); return s.seen.includes(m) ? s : { ...s, seen: [...s.seen, m] }; };

export function petTick(s, seconds = 1) {
  return withSeen({
    ...s,
    hunger: clamp100(s.hunger + PET_DRIFT.hunger * seconds),
    happiness: clamp100(s.happiness + PET_DRIFT.happiness * seconds),
    energy: clamp100(s.energy + PET_DRIFT.energy * seconds)
  });
}

/** pet = head touch, feed = flashlight on the light sensor, rest = lights off (ours, so Sleepy has a way out). */
export function petAct(s, action) {
  if (action === 'pet') return withSeen({ ...s, happiness: clamp100(s.happiness + PET_RULES.petBoost) });
  if (action === 'feed') return withSeen({ ...s, hunger: clamp100(s.hunger - PET_RULES.feedDrop) });
  if (action === 'rest') return withSeen({ ...s, energy: clamp100(s.energy + PET_RULES.restBoost) });
  if (action === 'ring') return withSeen({ ...s, alarm: true });
  return s;
}

/** Week 9: the alarm stops after 3 head touches OR a hand within 15 cm of the eyes. */
export function alarmDismissedBy({ touches = 0, distanceCm = 200 }) {
  if (touches >= ALARM_RULES.touches) return 'touch';
  if (distanceCm <= ALARM_RULES.waveCm) return 'wave';
  return null;
}

export function petDismiss(s, how) {
  if (!s.alarm || !['touch', 'wave'].includes(how)) return s;
  return withSeen({ ...s, alarm: false, dismissed: s.dismissed.includes(how) ? s.dismissed : [...s.dismissed, how] });
}

/* ------------------------------------------------------ Pinout inspector */

const VERSION_IDS = PINOUTS.map((v) => v.versionId);

export function cleanPinout(d) {
  const version = pick(d?.version, VERSION_IDS, VERSION_IDS[0]);
  const wired = {};
  for (const v of PINOUTS) {
    wired[v.versionId] = [...new Set((Array.isArray(d?.wired?.[v.versionId]) ? d.wired[v.versionId] : [])
      .filter((i) => Number.isInteger(i) && i >= 0 && i < v.pins.length))].sort((a, b) => a - b);
  }
  return { version, wired, battery: bool(d?.battery) };
}

export function pinoutReport(d) {
  const v = PINOUTS.find((x) => x.versionId === d.version);
  const servoPins = v.pins.map((p, i) => ({ p, i })).filter((x) => /servo/i.test(x.p.component)).map((x) => x.i);
  const wired = d.wired[d.version];
  const servosWired = servoPins.some((i) => wired.includes(i));
  return {
    version: v, wiredCount: wired.length, total: v.pins.length,
    /** Servos plugged in while the 4xAA rail is unconfirmed: the one wiring mistake that browns out the board. */
    powerRisk: servosWired && !d.battery,
    ready: wired.length === v.pins.length && d.battery
  };
}

/* ------------------------------------------------------ 40-point scorecard */

/** Week 10: 20 walking, 10 alarm, 10 sensor-care trials; 32 of 40 is the target. */
export const BENCH_PARTS = [
  { id: 'walk', label: 'Part A · Walking', trials: 20, hint: 'Walk across the desk. Log drift, foot slips and stumbles as a fail.' },
  { id: 'alarm', label: 'Part B · Smart alarm', trials: 10, hint: 'Alarm rings, then stops after 3 head touches or a wave within 15 cm.' },
  { id: 'care', label: 'Part C · Sensor care', trials: 10, hint: 'Head touch or flashlight feeding gets the right reaction.' }
];
export const BENCH_TOTAL = BENCH_PARTS.reduce((s, p) => s + p.trials, 0);
export const BENCH_TARGET = 32;

/** Each part is a string of one character per trial: '-' not run, 'p' pass, 'f' fail. */
export function cleanBench(d) {
  const out = { grips: bool(d?.grips) };
  for (const part of BENCH_PARTS) {
    const raw = typeof d?.[part.id] === 'string' ? d[part.id] : '';
    out[part.id] = Array.from({ length: part.trials }, (_, i) => (raw[i] === 'p' || raw[i] === 'f' ? raw[i] : '-')).join('');
  }
  return out;
}

export function setTrial(d, partId, index, result) {
  const part = BENCH_PARTS.find((p) => p.id === partId);
  if (!part || !Number.isInteger(index) || index < 0 || index >= part.trials || !['-', 'p', 'f'].includes(result)) return d;
  const chars = d[partId].split('');
  chars[index] = result;
  return { ...d, [partId]: chars.join('') };
}

export function benchScore(d) {
  const parts = BENCH_PARTS.map((p) => {
    const s = d[p.id];
    return { ...p, pass: (s.match(/p/g) || []).length, fail: (s.match(/f/g) || []).length };
  });
  const pass = parts.reduce((s, p) => s + p.pass, 0);
  const run = pass + parts.reduce((s, p) => s + p.fail, 0);
  return {
    parts, pass, run, total: BENCH_TOTAL,
    ratePct: run ? Math.round((pass / run) * 100) : 0,
    complete: run === BENCH_TOTAL,
    onTarget: pass >= BENCH_TARGET
  };
}

export const survivorDone = (d) => { const r = benchScore(d); return r.complete && r.onTarget && d.grips; };

/* ----------------------------------------------------------------- Badges */

const AUTO = {
  'badge-rb-90deg-whisperer': (t) => !!t['gait-lab'] && whispererDone(cleanGait(t['gait-lab'])),
  'badge-rb-40test-survivor': (t) => !!t.benchmark && survivorDone(cleanBench(t.benchmark))
};
export const autoBadge = (id) => id in AUTO;
export const earnedBadges = makeEarnedBadges(BADGES, AUTO);

export const TOOLS = [
  { id: 'pinout-inspector', emoji: '🔌', title: 'Hardware & Pinout Inspector', blurb: 'Pick your board, check every wire, and prove the 4xAA battery rail is on.', sessions: weekSessions(1, 2) },
  { id: 'gait-lab', emoji: '🦿', title: 'Servo Centering & Gait Lab', blurb: 'Centre 4 servos at 90°, tune the trims and watch where the weight goes as it walks.', sessions: weekSessions(7) },
  { id: 'pet-brain', emoji: '💗', title: 'Virtual Pet Brain', blurb: 'Hunger, Happiness and Energy drive 5 moods. Then test the alarm dismiss rule.', sessions: weekSessions(8, 9) },
  { id: 'benchmark', emoji: '✅', title: '40-Point Benchmark Scorecard', blurb: '20 walking, 10 alarm and 10 sensor-care trials. 32 passes is the target.', sessions: weekSessions(10) }
];
export const SESSION_TOOLS = sessionToolMap(TOOLS);

export const VOCAB = [
  { en: 'servo', th: 'เซอร์โวมอเตอร์', note: 'a motor that turns to an exact angle' },
  { en: 'centre (90°)', th: 'ตั้งให้อยู่ตรงกลาง', note: 'do this before you screw on the horn' },
  { en: 'trim', th: 'ปรับแต่งมุมเล็กน้อย', note: 'a small fix, a few degrees' },
  { en: 'balance', th: 'การทรงตัว' },
  { en: 'sensor', th: 'เซนเซอร์' },
  { en: 'battery pack', th: 'รางแบตเตอรี่' },
  { en: 'hungry', th: 'หิว' },
  { en: 'sleepy', th: 'ง่วง' },
  { en: 'bored', th: 'เบื่อ' },
  { en: 'alarm', th: 'นาฬิกาปลุก' },
  { en: 'pass / fail', th: 'ผ่าน / ไม่ผ่าน' }
];
