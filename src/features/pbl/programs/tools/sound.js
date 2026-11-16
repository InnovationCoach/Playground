/** A short tone for timers (Web Audio). Silent where audio is unavailable or motion is reduced. */
let ctx = null;

export function beep(freq = 660, seconds = 0.15) {
  try {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = ctx || new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + seconds);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + seconds + 0.02);
  } catch { /* no audio */ }
}

/**
 * Tool feedback sounds: 'ding' when a check passes or a badge rule is met,
 * 'pop' for a small tap that changes something (a pin fed, a card swiped).
 */
const TOOL_SOUNDS = { ding: [[880, 0.12], [1320, 0.22]], pop: [[520, 0.07]] };

export function playToolSound(kind = 'pop') {
  const notes = TOOL_SOUNDS[kind] || TOOL_SOUNDS.pop;
  notes.forEach(([freq, seconds], i) => {
    if (i === 0) beep(freq, seconds);
    else setTimeout(() => beep(freq, seconds), i * 110);
  });
}
