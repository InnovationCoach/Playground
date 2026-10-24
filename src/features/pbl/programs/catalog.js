/**
 * The PBL program library, read from Don's prototype (prototypes/DonPBL/).
 *
 * The prototype files are the source of truth for program content and are
 * still being revised on the DonPBL branch, so they are imported as they are
 * and never edited from here. This module is the seam: it normalises what the
 * app needs, and it CHECKS the content instead of trusting it. Every problem
 * found is listed for coaches (the same way competencies.js shows the school
 * sheet's data issues) rather than silently corrected or hidden.
 */
import {
  PROGRAM_REGISTRY,
  PROGRAM_LIST,
  LEARNER_AGE_CONFIG,
  SCHOOL_SCHEDULE_CONFIG,
  HARDWARE_INVENTORY_CONFIG,
  COPILOT_DEPLOYMENT_CONFIG
} from '../../../../prototypes/DonPBL/programRegistry.ts';
import { competencyById } from '../content/competencies.js';
import { getCustomProgramById } from '../../coach/programs/customProgramsStore.js';

export const TERM_WEEKS = SCHOOL_SCHEDULE_CONFIG.weeksPerTerm;
export const AGE_TRACKS = LEARNER_AGE_CONFIG.tracks;
export const SCHEDULE = SCHOOL_SCHEDULE_CONFIG;

/**
 * School-wide cover posters, one Cloudinary image link per program id. Design
 * the poster in Canva, download it as PNG, upload it to the school's Cloudinary
 * and paste the image link here. A program without one gets a poster drawn
 * from its colours and icon; a coach can also set a cover for their own class.
 */
export const SCHOOL_COVERS = {};

/** Look and feel per program. Content stays in the prototype; this is presentation only. */
const IDENTITY = {
  'entrepreneurship-product-creation-2026': { icon: 'Store', tone: 'amber', short: 'Entrepreneurship' },
  'storytelling-genesis-2026': { icon: 'Clapperboard', tone: 'magenta', short: 'Storytelling' },
  'passion-project-blueprint-2026': { icon: 'Sparkles', tone: 'purple', short: 'Passion Project' },
  'biomechanics-robotics-2026': { icon: 'Hand', tone: 'navy', short: 'Biomechanics' },
  'hex-city-thailand-2026': { icon: 'Building2', tone: 'sky', short: 'Hex-City' },
  'ecocool-smart-garden-2026': { icon: 'Sprout', tone: 'green', short: 'EcoCool' },
  'cleanstream-stormwater-2026': { icon: 'Droplets', tone: 'sky', short: 'CleanStream' }
};

/**
 * The prototype writes the school's codes as `sdl-1`; the app's ids are
 * zero-padded (`sdl-01`). Map the unambiguous case, report everything else.
 */
export function resolveCompetencyId(id) {
  if (competencyById(id)) return id;
  const m = /^([a-z]+)-(\d)$/.exec(String(id));
  const padded = m ? `${m[1]}-0${m[2]}` : null;
  return padded && competencyById(padded) ? padded : null;
}

/** Claims written into the content that nobody has recorded a source for. */
const UNSOURCED_CONFIRMATION = /confirmed by don/i;

/**
 * A confirmation counts only with who, when and where. The prototype records
 * these as { status, confirmedBy, confirmedOn, source }.
 */
export function isSourcedConfirmation(c) {
  return !!(c && c.status === 'confirmed' && c.confirmedBy && c.confirmedOn && c.source);
}

/** Every string anywhere in a value, for content checks. */
function allStrings(v, out = []) {
  if (typeof v === 'string') out.push(v);
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => allStrings(x, out));
  return out;
}

const SPEECH = /speech-to-text|voice (dictation|typing)/i;
const SPEECH_RULED_OUT = /\b(no|not|never|without|prohibit\w*)\b[^.]{0,60}(speech-to-text|voice)/i;
const YOUNG = /9\s*[–-]\s*11|under[- ]?13|primary/i;

/** Strings that offer speech-to-text rather than ruling it out. */
export function speechToTextOffers(raw) {
  return allStrings(raw).filter((t) => SPEECH.test(t) && !SPEECH_RULED_OUT.test(t));
}

function cleanIds(ids, unknown) {
  const out = [];
  for (const id of ids || []) {
    const resolved = resolveCompetencyId(id);
    if (resolved) { if (!out.includes(resolved)) out.push(resolved); } else unknown.add(id);
  }
  return out;
}

/** Normalise and check one raw program. Exported for tests. */
export function normaliseProgram(raw) {
  const unknown = new Set();
  const phases = raw.phases.map((ph) => ({
    ...ph,
    competencies: cleanIds(ph.competencies, unknown),
    stretchCompetencies: cleanIds(ph.stretchCompetencies, unknown),
    sessions: (ph.sessions || []).map((s) => ({
      ...s,
      phaseId: ph.id,
      evidenceToCollect: { ...s.evidenceToCollect, targetCompetencies: cleanIds(s.evidenceToCollect?.targetCompetencies, unknown) }
    }))
  }));
  const sessions = phases.flatMap((ph) => ph.sessions).sort((a, b) => a.sessionNumber - b.sessionNumber);
  const listing = PROGRAM_LIST.find((l) => l.id === raw.id);

  const program = {
    ...raw,
    phases,
    sessions,
    identity: { ...(IDENTITY[raw.id] || { icon: 'Compass', tone: 'purple', short: raw.title }), cover: SCHOOL_COVERS[raw.id] || null },
    listedAs: listing?.theme || null,
    sharesPhasesWith: null,
    issues: []
  };
  program.issues = checkProgram(raw, program, unknown);
  return program;
}

/**
 * Honest checks over one program. Each issue is { level, text }:
 * 'block' would mislead a learner, 'warn' is for the coach to raise with Don.
 */
function checkProgram(raw, program, unknownCompetencies) {
  const issues = [];
  const add = (level, text) => issues.push({ level, text });

  if (raw.durationWeeks !== TERM_WEEKS) {
    add('warn', `Runs ${raw.durationWeeks} weeks, but a school term is ${TERM_WEEKS} weeks.`);
  }
  if (program.listedAs && !program.listedAs.includes(`${raw.durationWeeks} Wks`)) {
    add('warn', `The program list describes it as "${program.listedAs}", which disagrees with its ${raw.durationWeeks}-week plan.`);
  }
  if (program.sessions.length !== raw.totalSessions) {
    add('warn', `Says ${raw.totalSessions} sessions, but only ${program.sessions.length} are written.`);
  }
  const lastWeek = Math.max(...raw.phases.map((p) => p.weeks[1]));
  if (lastWeek > raw.durationWeeks) add('warn', `Phases run to week ${lastWeek}, past the ${raw.durationWeeks}-week plan.`);
  for (let i = 1; i < raw.phases.length; i += 1) {
    const prev = raw.phases[i - 1];
    const cur = raw.phases[i];
    if (cur.weeks[0] <= prev.weeks[1]) {
      add('warn', `${prev.title} (weeks ${prev.weeks.join('–')}) and ${cur.title} (weeks ${cur.weeks.join('–')}) overlap.`);
    }
  }
  if (unknownCompetencies.size) {
    add('warn', `References competencies the school framework does not have: ${[...unknownCompetencies].join(', ')}. They are left out below.`);
  }
  for (const a of raw.assumptions || []) {
    if (UNSOURCED_CONFIRMATION.test(a.ownerVerificationNeeded || '')
        || (a.confirmation?.status === 'confirmed' && !isSourcedConfirmation(a.confirmation))) {
      add('warn', `"${a.domain}" is marked as confirmed, with no record of who confirmed it, when or where.`);
    }
  }
  const offers = speechToTextOffers(raw);
  if (offers.some((t) => YOUNG.test(t))) {
    add('block', 'Offers speech-to-text to ages 9–11. The platform does not use speech-to-text with under-13s; use tap-to-choose, drawing or a teacher scribe instead.');
  } else if (offers.length && LEARNER_AGE_CONFIG.minAge < 13) {
    add('warn', 'Offers speech-to-text without limiting it to learners aged 13 and over.');
  }
  return issues;
}

const RAW = Object.values(PROGRAM_REGISTRY);
export const PROGRAMS = RAW.map(normaliseProgram);

// A program that borrows another's phases teaches the other program's sessions.
for (const p of PROGRAMS) {
  const twin = RAW.find((o) => o.id !== p.id && o.phases === PROGRAM_REGISTRY[p.id].phases);
  if (twin && PROGRAM_LIST.findIndex((l) => l.id === p.id) > PROGRAM_LIST.findIndex((l) => l.id === twin.id)) {
    p.sharesPhasesWith = twin.id;
    p.issues.unshift({ level: 'block', text: `Its sessions are copied from ${twin.title}, so they teach that program, not this one. Treat it as an outline only.` });
  }
}

/** Platform-level claims in the prototype that are not true of the app today. */
export const PLATFORM_NOTES = [
  COPILOT_DEPLOYMENT_CONFIG.status !== 'deployed' && {
    level: 'warn',
    text: `The AI co-pilot (${COPILOT_DEPLOYMENT_CONFIG.endpoint}) is not deployed, so learners get the built-in fallback.`
  },
  (() => {
    const pending = [
      ['term schedule', SCHOOL_SCHEDULE_CONFIG], ['age bands', LEARNER_AGE_CONFIG], ['hardware inventory', HARDWARE_INVENTORY_CONFIG]
    ].filter(([, c]) => !isSourcedConfirmation(c?.confirmation)).map(([name]) => name);
    return pending.length > 0 && { level: 'warn', text: `Not yet confirmed by the school: ${pending.join(', ')}.` };
  })(),
  LEARNER_AGE_CONFIG.minAge < 13 && {
    level: 'warn',
    text: `Programs are written for ages ${LEARNER_AGE_CONFIG.minAge}–${LEARNER_AGE_CONFIG.maxAge}. Under-13s need parental consent before they use the platform.`
  }
].filter(Boolean);

export const programById = (id) => getCustomProgramById(id) || PROGRAMS.find((p) => p.id === id) || null;

/** Every phase-level and session-level competency in a program, in framework order. */
export function programCompetencies(program) {
  const ids = new Set();
  for (const ph of program.phases) {
    ph.competencies.forEach((id) => ids.add(id));
    ph.stretchCompetencies.forEach((id) => ids.add(id));
    ph.sessions.forEach((s) => s.evidenceToCollect.targetCompetencies.forEach((id) => ids.add(id)));
  }
  return [...ids];
}

/** Sessions that fall in one week of the program. */
export function sessionsInWeek(program, week) {
  return program.sessions.filter((s) => s.week === week);
}

/** "Ages 9–17 (Primary through Upper Secondary: ...)" -> "Ages 9–17". */
export function shortAges(text) {
  const m = /ages?\s*\d+\s*[–-]\s*\d+/i.exec(text || '');
  return m ? m[0].replace(/^a/, 'A') : (text || '').split('(')[0].trim();
}
