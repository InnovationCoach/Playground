/**
 * Generates the focus sounds with the Web Audio API: one module-level engine,
 * so sound keeps playing while the learner moves between pages.
 *
 * Noise sounds are looped stereo noise buffers shaped with filters. "Calm
 * keys" is generative: a soft pad that drifts between pentatonic chords, with
 * an occasional quiet note on top. Nothing is downloaded.
 *
 * The AudioContext is created on the first call from a user gesture, as
 * browsers require.
 */
let ctx = null;
let master = null;
let analyser = null;
const channels = {};

const LOOP_SECONDS = 8;

function noiseBuffer(kind) {
  const len = ctx.sampleRate * LOOP_SECONDS;
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch += 1) {
    const d = buf.getChannelData(ch);
    let b0 = 0; let b1 = 0; let b2 = 0; let b3 = 0; let b4 = 0; let b5 = 0; let b6 = 0; let last = 0;
    for (let i = 0; i < len; i += 1) {
      const w = Math.random() * 2 - 1;
      if (kind === 'white') d[i] = w * 0.5;
      else if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else {
        // Paul Kellet's pink noise filter.
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
      }
    }
    // Fade the loop ends into each other so the seam does not click.
    const fade = Math.floor(ctx.sampleRate * 0.05);
    for (let i = 0; i < fade; i += 1) { const g = i / fade; d[i] *= g; d[len - 1 - i] *= g; }
  }
  return buf;
}

function filter(type, frequency, q = 0.7) {
  const f = ctx.createBiquadFilter();
  f.type = type; f.frequency.value = frequency; f.Q.value = q;
  return f;
}

function chain(...nodes) {
  for (let i = 0; i < nodes.length - 1; i += 1) nodes[i].connect(nodes[i + 1]);
  return nodes.at(-1);
}

function noiseChannel(kind, filters, gainScale) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(kind);
  src.loop = true;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  chain(src, ...filters, gain, master);
  src.start();
  return { gain, scale: gainScale };
}

/* Pentatonic chords in C major (Hz), voiced low and soft. */
const CHORDS = [[130.81, 196.0, 261.63], [110.0, 164.81, 220.0], [146.83, 220.0, 293.66], [98.0, 146.83, 196.0]];
const MELODY = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];

function keysChannel() {
  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(master);
  const lp = filter('lowpass', 900, 0.5);
  lp.connect(gain);
  const voices = CHORDS[0].map((f) => {
    const o = ctx.createOscillator();
    o.type = 'triangle'; o.frequency.value = f;
    const g = ctx.createGain(); g.gain.value = 0.18;
    chain(o, g, lp);
    o.start();
    return o;
  });
  let chord = 0;
  const step = () => {
    if (!ctx) return;
    chord = (chord + 1 + Math.floor(Math.random() * 2)) % CHORDS.length;
    CHORDS[chord].forEach((f, i) => voices[i].frequency.setTargetAtTime(f, ctx.currentTime, 1.2));
    // One or two quiet notes on top, now and then.
    const notes = Math.random() < 0.6 ? 1 + Math.floor(Math.random() * 2) : 0;
    for (let n = 0; n < notes; n += 1) {
      const t = ctx.currentTime + 0.4 + n * (0.6 + Math.random());
      const o = ctx.createOscillator();
      o.type = 'sine'; o.frequency.value = MELODY[Math.floor(Math.random() * MELODY.length)];
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
      chain(o, g, gain);
      o.start(t); o.stop(t + 2.3);
    }
  };
  setInterval(step, 6000);
  return { gain, scale: 0.9 };
}

function ensure() {
  if (ctx) return true;
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!AC) return false;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.8;
  analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  master.connect(analyser);
  analyser.connect(ctx.destination);
  return true;
}

function channel(id) {
  if (channels[id]) return channels[id];
  if (id === 'rain') channels[id] = noiseChannel('pink', [filter('highpass', 450), filter('lowpass', 7000)], 0.9);
  else if (id === 'brown') channels[id] = noiseChannel('brown', [filter('lowpass', 500)], 0.8);
  else if (id === 'fan') channels[id] = noiseChannel('white', [filter('highpass', 90), filter('lowpass', 750)], 0.55);
  else if (id === 'ocean') {
    const ch = noiseChannel('brown', [filter('lowpass', 1100)], 0.85);
    // Slow swell, roughly one wave every 12 seconds.
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.085;
    const depth = ctx.createGain(); depth.gain.value = 0.45;
    const swell = ctx.createGain(); swell.gain.value = 0.55;
    ch.gain.disconnect();
    chain(ch.gain, swell, master);
    chain(lfo, depth, swell.gain);
    lfo.start();
    channels[id] = ch;
  } else if (id === 'keys') channels[id] = keysChannel();
  return channels[id];
}

/** Bring every channel to the levels in `mix` ({ id: 0..1 }), smoothly. */
export function applyMix(mix) {
  if (!ensure()) return false;
  if (ctx.state === 'suspended') ctx.resume();
  const ids = new Set([...Object.keys(channels), ...Object.keys(mix)]);
  for (const id of ids) {
    const level = mix[id] || 0;
    if (!level && !channels[id]) continue;
    const ch = channel(id);
    if (ch) ch.gain.gain.setTargetAtTime(level * ch.scale, ctx.currentTime, 0.25);
  }
  return true;
}

export function setMaster(v) {
  if (master) master.gain.setTargetAtTime(Math.max(0, Math.min(1, v)), ctx.currentTime, 0.1);
}

/** Fade everything out over `seconds` (used when a focus block ends or the learner presses stop). */
export function fadeOut(seconds = 1.5) {
  if (!ctx) return;
  for (const ch of Object.values(channels)) ch.gain.gain.setTargetAtTime(0, ctx.currentTime, seconds / 4);
}

/** A soft two-note chime for the end of a block. */
export function chime(up = true) {
  if (!ensure()) return;
  if (ctx.state === 'suspended') ctx.resume();
  const notes = up ? [659.25, 987.77] : [987.77, 659.25];
  notes.forEach((f, i) => {
    const t = ctx.currentTime + i * 0.35;
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    chain(o, g, ctx.destination);
    o.start(t); o.stop(t + 1.5);
  });
}

/** Loudness right now, 0..1, for the visualiser. */
export function level() {
  if (!analyser) return 0;
  const data = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(data);
  let sum = 0;
  for (const v of data) { const x = (v - 128) / 128; sum += x * x; }
  return Math.min(1, Math.sqrt(sum / data.length) * 4);
}

export const audioSupported = () => typeof window !== 'undefined' && !!(window.AudioContext || window.webkitAudioContext);
