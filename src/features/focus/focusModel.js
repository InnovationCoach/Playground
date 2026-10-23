/**
 * Focus sounds: the pure part, unit-tested in tests/focus-model.test.js.
 *
 * Every sound is generated in the browser (soundEngine.js), so there is no
 * licensing, no third-party player, no ads and no tracking: safe for every
 * age. No lyrics on purpose: speech in the background measurably hurts
 * reading and writing (the "irrelevant speech effect"), steady sound does not.
 *
 * The timer is a plain state object so it can live outside React and keep
 * running while the learner moves between pages.
 */

export const SOUNDS = [
  { id: 'rain', label: 'Rain', emoji: '🌧️' },
  { id: 'ocean', label: 'Ocean', emoji: '🌊' },
  { id: 'brown', label: 'Deep noise', emoji: '🟤' },
  { id: 'fan', label: 'Fan', emoji: '🌀' },
  { id: 'keys', label: 'Calm keys', emoji: '🎹' }
];
const SOUND_IDS = SOUNDS.map((s) => s.id);

/** Ready-made mixes, so a first-time learner can press one button. */
export const PRESETS = [
  { id: 'rainy-desk', label: 'Rainy desk', mix: { rain: 0.7, keys: 0.35 } },
  { id: 'deep-focus', label: 'Deep focus', mix: { brown: 0.6, fan: 0.2 } },
  { id: 'beach', label: 'Beach study', mix: { ocean: 0.7, keys: 0.25 } }
];

export const TIMERS = [15, 25, 45];
export const BREAK_MIN = 5;
export const DEFAULT_LEVEL = 0.6;

const clamp01 = (v) => (Number.isFinite(Number(v)) ? Math.min(1, Math.max(0, Number(v))) : 0);

/** { soundId: level 0..1 }, unknown sounds dropped, silent ones left out. */
export function cleanMix(mix) {
  const out = {};
  if (!mix || typeof mix !== 'object') return out;
  for (const id of SOUND_IDS) {
    const v = Math.round(clamp01(mix[id]) * 100) / 100;
    if (v > 0) out[id] = v;
  }
  return out;
}

export const isSilent = (mix) => Object.keys(cleanMix(mix)).length === 0;

/** Tapping a sound: off -> default level, on -> off. */
export function toggleSound(mix, id, level = DEFAULT_LEVEL) {
  if (!SOUND_IDS.includes(id)) return cleanMix(mix);
  const cur = cleanMix(mix);
  return cleanMix({ ...cur, [id]: cur[id] ? 0 : level });
}

export const setLevel = (mix, id, level) => (SOUND_IDS.includes(id) ? cleanMix({ ...cleanMix(mix), [id]: level }) : cleanMix(mix));

/* ------------------------------------------------------------------ Timer */

export const IDLE = { phase: 'idle', minutes: 25, endsAt: null, leftMs: null };

export function startTimer(minutes, now = Date.now(), phase = 'focus') {
  return { phase, minutes, endsAt: now + minutes * 60000, leftMs: null };
}

export const isPaused = (t) => t.phase !== 'idle' && t.endsAt == null;

export function pauseTimer(t, now = Date.now()) {
  if (t.phase === 'idle' || t.endsAt == null) return t;
  return { ...t, endsAt: null, leftMs: Math.max(0, t.endsAt - now) };
}

export function resumeTimer(t, now = Date.now()) {
  if (!isPaused(t)) return t;
  return { ...t, endsAt: now + t.leftMs, leftMs: null };
}

export function remainingMs(t, now = Date.now()) {
  if (t.phase === 'idle') return t.minutes * 60000;
  return t.endsAt == null ? t.leftMs : Math.max(0, t.endsAt - now);
}

/** Fraction of the current phase already done, 0..1. */
export function progress(t, now = Date.now()) {
  if (t.phase === 'idle') return 0;
  const total = (t.phase === 'break' ? BREAK_MIN : t.minutes) * 60000;
  return Math.min(1, Math.max(0, 1 - remainingMs(t, now) / total));
}

/** What happens when a phase runs out: focus -> break, break -> idle. `minutes` always keeps the focus length. */
export function afterPhase(t, now = Date.now()) {
  if (t.phase === 'focus') return { ...startTimer(BREAK_MIN, now, 'break'), minutes: t.minutes };
  return { ...IDLE, minutes: t.minutes };
}

export const fmt = (ms) => {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/* -------------------------------------------------------- Blocks per day */

/** Finished focus blocks per local day, kept for the last 14 days. */
export function addBlock(log, day) {
  const next = { ...(log && typeof log === 'object' ? log : {}), [day]: ((log || {})[day] || 0) + 1 };
  return Object.fromEntries(Object.keys(next).filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k)).sort().slice(-14).map((k) => [k, next[k]]));
}
