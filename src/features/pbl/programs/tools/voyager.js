/**
 * Hands-on tools for "Project Voyager": pure functions, unit-tested in
 * tests/program-tools-voyager.test.js. The UI is VoyagerTools.jsx.
 *
 * Content comes from Don's program file: the 5 team roles with their stage
 * evidence, and the Week 6 gate numbers (220 x 220 mm bed, 2.5-3.0 mm walls,
 * 15-20% infill, 3 wall loops, 15-30 degree solar roof, +5 cm bay clearance on
 * all sides). Imported as-is, never edited.
 *
 * The plastic estimate and the sunlight percentage are simple geometry, shown
 * as a model. The multimeter decides the real tilt in week 11.
 */
import { VOYAGER_GAMIFICATION_BADGES, VOYAGER_TEAM_ROLES } from '../../../../../prototypes/DonPBL/voyagerProgram.ts';
import { SESSION_XP, text, int, num, bool, pick, round, normalizeBadges, makeEarnedBadges, weekSessions, sessionToolMap } from './kit.js';

export const PROGRAM_ID = 'project-voyager-rc-solar-2026';
export { SESSION_XP };
export const BADGES = normalizeBadges(VOYAGER_GAMIFICATION_BADGES, {
  'badge-voyager-boxfit': '📏', 'badge-voyager-cardboard': '📦', 'badge-voyager-cad-shell': '🧊', 'badge-voyager-gate-review': '🚦',
  'badge-voyager-chassis': '🔧', 'badge-voyager-track-solar': '☀️', 'badge-voyager-showcase': '🏆'
});

/* ---------------------------------------------------------- Shell checker */

export const BED_MM = 220;
export const WALL = { min: 2.5, max: 3.0, fragileBelow: 2.0, slowAbove: 4.0 };
export const INFILL = { min: 15, max: 20 };
export const WALL_LOOPS = 3;
export const TILT = { min: 15, max: 30 };
/** PLA is about 1.24 g per cubic centimetre. */
const PLA_G_PER_CM3 = 1.24;

export function cleanShell(d) {
  return {
    lengthMm: int(d?.lengthMm, 50, 600) ?? 280,
    widthMm: int(d?.widthMm, 40, 400) ?? 160,
    heightMm: int(d?.heightMm, 20, 300) ?? 90,
    wallMm: num(d?.wallMm, 1, 5) ?? 2.5,
    infillPct: int(d?.infillPct, 5, 50) ?? 15,
    loops: int(d?.loops, 1, 6) ?? 3,
    parts: int(d?.parts, 1, 3) ?? 1,
    grill: bool(d?.grill),
    wheelWells: bool(d?.wheelWells),
    fromCad: bool(d?.fromCad)
  };
}

export function wallStatus(mm) {
  if (mm < WALL.fragileBelow) return { state: 'bad', text: 'Fragile: under 2.0 mm cracks on the bump track.' };
  if (mm < WALL.min) return { state: 'warn', text: 'A little thin. The spec is 2.5 to 3.0 mm.' };
  if (mm <= WALL.max) return { state: 'ok', text: 'Inside the 2.5 to 3.0 mm spec.' };
  if (mm <= WALL.slowAbove) return { state: 'warn', text: 'Thicker than the spec: heavier truck, slower print.' };
  return { state: 'bad', text: 'Over 4.0 mm: far too much print time and weight.' };
}

/** The shell is cut along its length into equal parts (hood, cab, bed). Cutting does not help a shell that is too wide. */
export function shellReport(s) {
  const partLen = round(s.lengthMm / s.parts, 1);
  const tooWide = s.widthMm > BED_MM;
  const fitsBed = !tooWide && partLen <= BED_MM;
  const partsNeeded = tooWide ? null : Math.ceil(s.lengthMm / BED_MM);
  const wall = wallStatus(s.wallMm);
  const areaCm2 = (s.lengthMm * s.widthMm + 2 * s.lengthMm * s.heightMm + 2 * s.widthMm * s.heightMm) / 100;
  return {
    partLen, fitsBed, partsNeeded, tooWide,
    wall, wallOk: wall.state === 'ok',
    infillOk: s.infillPct >= INFILL.min && s.infillPct <= INFILL.max,
    loopsOk: s.loops === WALL_LOOPS,
    plasticG: Math.round(areaCm2 * (s.wallMm / 10) * PLA_G_PER_CM3)
  };
}

/** Everything the Week 6 gate asks the slicer settings to prove. */
export const sliceReady = (s) => { const r = shellReport(s); return r.fitsBed && r.wallOk && r.infillOk && r.loopsOk; };

/* --------------------------------------------------------------- Solar bay */

export const CLEARANCE_MM = 50;

export function cleanBay(d) {
  return {
    sunAltitude: int(d?.sunAltitude, 10, 90) ?? 75,
    tiltDeg: int(d?.tiltDeg, 0, 60) ?? 20,
    truck: { l: int(d?.truck?.l, 50, 600) ?? 280, w: int(d?.truck?.w, 40, 400) ?? 160, h: int(d?.truck?.h, 20, 300) ?? 120 },
    bay: { l: int(d?.bay?.l, 50, 900) ?? 380, w: int(d?.bay?.w, 40, 700) ?? 260, h: int(d?.bay?.h, 20, 500) ?? 170 }
  };
}

/**
 * Share of full sunlight a panel catches when it is tilted toward the sun:
 * the cosine of the angle between the sun's rays and a line straight out of
 * the panel. Flat panel under an overhead sun = 100%.
 */
export function sunCatchPct(sunAltitude, tiltDeg) {
  const offDeg = Math.abs(90 - sunAltitude - tiltDeg);
  return Math.max(0, Math.round(Math.cos((offDeg * Math.PI) / 180) * 100));
}

export function bayReport(b) {
  const gaps = {
    length: (b.bay.l - b.truck.l) / 2,
    width: (b.bay.w - b.truck.w) / 2,
    top: b.bay.h - b.truck.h
  };
  const short = Object.entries(gaps).filter(([, g]) => g < CLEARANCE_MM).map(([k]) => k);
  return {
    catchPct: sunCatchPct(b.sunAltitude, b.tiltDeg),
    bestTilt: Math.max(0, 90 - b.sunAltitude),
    tiltOk: b.tiltDeg >= TILT.min && b.tiltDeg <= TILT.max,
    gaps, short, clearanceOk: short.length === 0
  };
}

/** The CAD shell badge: spec walls, a shell that fits the bed, airflow and wheel wells, and a 15-30 degree roof. */
export function cadShellDone(shell, bay) {
  const r = shellReport(shell);
  return shell.fromCad && r.wallOk && r.fitsBed && shell.grill && shell.wheelWells && bayReport(bay).tiltOk;
}

/* ------------------------------------------------------- Role portfolio log */

export const STAGES = [
  { key: 'stage1Weeks1To2', label: 'Stage 1 · Weeks 1–2' },
  { key: 'stage2Weeks3To4', label: 'Stage 2 · Weeks 3–4' },
  { key: 'stage3Weeks5To6', label: 'Stage 3 · Weeks 5–6' },
  { key: 'stage4Weeks7To9', label: 'Stage 4 · Weeks 7–9' },
  { key: 'stage5Weeks10To12', label: 'Stage 5 · Weeks 10–12' }
];
export const ROLES = VOYAGER_TEAM_ROLES.map((r) => ({
  id: r.id, title: r.title, lead: r.leadSubtitle, summary: r.summary,
  evidence: STAGES.map((s) => r.stagePortfolioEvidence[s.key])
}));
const ROLE_IDS = ROLES.map((r) => r.id);
export const WEEKS = 12;
/** Friday "Show, Tell, Reflect": sentence starters so nobody has to face a blank box. */
export const FRIDAY_PARTS = [
  { id: 'show', label: 'Show', starters: ['This week we built …', 'Here is our photo of …', 'We measured …'] },
  { id: 'tell', label: 'Tell', starters: ['The hard part was …', 'It did not fit because …', 'We fixed it by …'] },
  { id: 'reflect', label: 'Reflect', starters: ['Next week we will …', 'I learned that …', 'I helped my team by …'] }
];

export function cleanLog(d) {
  const done = {};
  for (const id of ROLE_IDS) {
    done[id] = [...new Set((Array.isArray(d?.done?.[id]) ? d.done[id] : []).filter((i) => Number.isInteger(i) && i >= 0 && i < STAGES.length))].sort((a, b) => a - b);
  }
  const fridays = {};
  for (let w = 1; w <= WEEKS; w += 1) {
    const f = d?.fridays?.[w];
    const entry = { show: text(f?.show, 120), tell: text(f?.tell, 120), reflect: text(f?.reflect, 120) };
    if (entry.show || entry.tell || entry.reflect) fridays[w] = entry;
  }
  return { role: pick(d?.role, ROLE_IDS, ROLE_IDS[0]), week: int(d?.week, 1, WEEKS) ?? 1, done, fridays };
}

export const fridayComplete = (f) => !!(f?.show?.trim() && f?.tell?.trim() && f?.reflect?.trim());

export function logReport(d) {
  const roles = ROLES.map((r) => ({ id: r.id, done: d.done[r.id].length, total: STAGES.length }));
  const fridays = Object.values(d.fridays).filter(fridayComplete).length;
  return { roles, evidenceDone: roles.reduce((s, r) => s + r.done, 0), evidenceTotal: ROLES.length * STAGES.length, fridays };
}

/* ----------------------------------------------------------------- Badges */

const AUTO = {
  'badge-voyager-cad-shell': (t) => !!t['shell-checker'] && !!t['solar-bay'] && cadShellDone(cleanShell(t['shell-checker']), cleanBay(t['solar-bay']))
};
export const autoBadge = (id) => id in AUTO;
export const earnedBadges = makeEarnedBadges(BADGES, AUTO);

export const TOOLS = [
  { id: 'role-log', emoji: '📒', title: 'Role Portfolio & Friday Log', blurb: 'Tick your role\'s evidence for each stage and write Friday\'s Show, Tell, Reflect.', sessions: weekSessions(1, 2, 7, 8, 9, 10, 12) },
  { id: 'solar-bay', emoji: '☀️', title: 'Solar Bay Angle & Clearance', blurb: 'Tilt the roof toward the sun and check the truck has 5 cm of space on every side.', sessions: weekSessions(3, 4, 11) },
  { id: 'shell-checker', emoji: '🧊', title: '3D Shell & Slicing Checker', blurb: 'Does the shell fit the 220 mm bed? Are the walls, infill and loops on spec?', sessions: weekSessions(5, 6) }
];
export const SESSION_TOOLS = sessionToolMap(TOOLS);

export const VOCAB = [
  { en: 'wall thickness', th: 'ความหนาของผนัง' },
  { en: 'infill', th: 'ความหนาแน่นด้านใน', note: 'how full the inside of a print is' },
  { en: 'print bed', th: 'ฐานพิมพ์' },
  { en: 'clearance', th: 'ระยะเผื่อ', note: 'empty space so parts do not touch' },
  { en: 'tilt angle', th: 'มุมเอียง' },
  { en: 'solar panel', th: 'แผงโซลาร์เซลล์' },
  { en: 'evidence', th: 'หลักฐาน' },
  { en: 'reflect', th: 'ทบทวน / สะท้อนคิด' }
];
