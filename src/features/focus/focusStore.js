/**
 * One shared focus session for the whole app: the sound mix, play state and
 * timer live here, outside React, so the dashboard widget and the mini player
 * show the same thing and nothing stops when the page changes.
 *
 * The mix, volume and finished blocks are remembered on this device only
 * (localStorage): they are personal conveniences, not school records.
 */
import { useSyncExternalStore } from 'react';
import {
  IDLE, PRESETS, cleanMix, isSilent, toggleSound, setLevel as setMixLevel, startTimer, pauseTimer, resumeTimer,
  remainingMs, afterPhase, addBlock
} from './focusModel.js';
import { applyMix, setMaster, fadeOut, chime } from './soundEngine.js';
import { dayKey } from '../goals/goalPlan.js';

const KEY = 'focusSounds_v1';

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    return {
      mix: cleanMix(raw.mix && Object.keys(raw.mix).length ? raw.mix : PRESETS[0].mix),
      volume: Number.isFinite(raw.volume) ? Math.min(1, Math.max(0, raw.volume)) : 0.8,
      blocks: raw.blocks && typeof raw.blocks === 'object' ? raw.blocks : {},
      minutes: [15, 25, 45].includes(raw.minutes) ? raw.minutes : 25
    };
  } catch {
    return { mix: cleanMix(PRESETS[0].mix), volume: 0.8, blocks: {}, minutes: 25 };
  }
}

const saved = load();
let state = { ...saved, playing: false, timer: { ...IDLE, minutes: saved.minutes }, now: Date.now() };
const listeners = new Set();
let ticker = null;

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ mix: state.mix, volume: state.volume, blocks: state.blocks, minutes: state.timer.minutes }));
  } catch { /* private mode */ }
}

function set(patch, save = true) {
  state = { ...state, ...patch };
  if (save) persist();
  listeners.forEach((l) => l());
  const ticking = state.timer.phase !== 'idle' && state.timer.endsAt != null;
  if (ticking && !ticker) ticker = setInterval(tick, 500);
  if (!ticking && ticker) { clearInterval(ticker); ticker = null; }
}

function tick() {
  const now = Date.now();
  const t = state.timer;
  if (t.phase === 'idle' || t.endsAt == null) return;
  if (remainingMs(t, now) > 0) { set({ now }, false); return; }
  if (t.phase === 'focus') {
    chime(true);
    fadeOut(3);
    set({ timer: afterPhase(t, now), playing: false, blocks: addBlock(state.blocks, dayKey()), now, justFinished: now });
  } else {
    chime(false);
    set({ timer: afterPhase(t, now), now });
  }
}

export const focus = {
  get: () => state,
  subscribe(l) { listeners.add(l); return () => listeners.delete(l); },

  play() {
    if (isSilent(state.mix)) return;
    if (applyMix(state.mix)) { setMaster(state.volume); set({ playing: true }); }
  },
  stop() { fadeOut(1.2); set({ playing: false }); },
  toggle(id) {
    const mix = toggleSound(state.mix, id);
    if (applyMix(mix)) setMaster(state.volume);
    set({ mix, playing: !isSilent(mix) });
  },
  level(id, v) {
    const mix = setMixLevel(state.mix, id, v);
    if (state.playing) applyMix(mix);
    set({ mix, playing: state.playing && !isSilent(mix) });
  },
  preset(p) {
    const mix = cleanMix(p.mix);
    if (applyMix(mix)) setMaster(state.volume);
    set({ mix, playing: true });
  },
  volume(v) { setMaster(v); set({ volume: v }); },

  start(minutes = state.timer.minutes) {
    set({ timer: startTimer(minutes), now: Date.now(), justFinished: null });
    if (!state.playing) focus.play();
  },
  choose(minutes) { if (state.timer.phase === 'idle') set({ timer: { ...IDLE, minutes } }); },
  pause() { set({ timer: pauseTimer(state.timer), now: Date.now() }); },
  resume() { set({ timer: resumeTimer(state.timer), now: Date.now() }); },
  reset() { set({ timer: { ...IDLE, minutes: state.timer.minutes }, now: Date.now() }); },
  skipBreak() { if (state.timer.phase === 'break') set({ timer: { ...IDLE, minutes: state.timer.minutes } }); }
};

export function useFocus() {
  return useSyncExternalStore(focus.subscribe, focus.get, focus.get);
}
