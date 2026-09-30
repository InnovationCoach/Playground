/**
 * Junior Explorers - the shared investigation engine (pure logic).
 *
 * Every primary activity is content, not code: an activity is a list of
 * investigations, and each investigation follows the same five steps -
 * get ready, my guess, do it, look & record, what happened - so a 6-year-old
 * learns the pattern once. A "build" investigation (make the thing first) skips
 * the guess.
 *
 * The investigation shape is the one Plant Lab (Activity 7) introduced, so its
 * experiments run here unchanged. Rules carried over from Plant Lab:
 *   - "My data says" is built only from what the learner recorded;
 *   - "What scientists often see" never overwrites her result;
 *   - a count is null until touched, because 0 is a real count.
 *
 * Field kinds: 'count' (tap once per thing), 'number' (a reading such as a
 * temperature, set with big +/- buttons - no typing), 'stopwatch' (seconds,
 * one big start/stop button), 'choice' (pictures) and 'draw'.
 *
 * Two reading levels share one piece of content: 'starter' (ages 6-8) and
 * 'explorer' (ages 9-11). A field marked `level: 'explorer'` is hidden for
 * starters, and a count with `trials: 3` becomes three tries for explorers.
 */

export const LEVELS = {
  starter:  { label: 'Starter', icon: '🐣', ages: '6-8' },
  explorer: { label: 'Explorer', icon: '🦊', ages: '9-11' }
};

export const ALL_STAGES = [
  { id: 'ready', label: 'Get ready', icon: '🧺' },
  { id: 'guess', label: 'My guess', icon: '💭' },
  { id: 'do', label: 'Do it', icon: '🧪' },
  { id: 'look', label: 'Look & record', icon: '🔬' },
  { id: 'result', label: 'What happened', icon: '⭐' }
];

export const VERDICTS = [
  { id: 'yes', label: 'My guess was right', icon: '✅' },
  { id: 'partly', label: 'Partly right', icon: '🌗' },
  { id: 'no', label: 'Something different happened', icon: '🔄' },
  { id: 'unsure', label: 'Not sure yet', icon: '🤔' }
];

/** A build investigation has nothing to guess. */
export const stagesFor = (inv) => ALL_STAGES.filter((s) => !(s.id === 'guess' && inv.kind === 'build'));

export const fieldVisible = (field, level) => !(field.level === 'explorer' && level !== 'explorer');

export const usesTrials = (field, level) => field.kind === 'count' && field.trials > 1 && level === 'explorer';

/**
 * The single number that stands for a recorded value.
 * Three tries → the middle one (median), which a 9-year-old can find by
 * ordering three numbers and which one wild try cannot drag about like a mean.
 */
export function valueOf(v) {
  if (Array.isArray(v)) {
    const nums = v.filter(Number.isFinite).sort((a, b) => a - b);
    if (!nums.length) return null;
    const mid = Math.floor(nums.length / 2);
    return nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
  }
  return Number.isFinite(v) ? v : null;
}

function hasValue(field, v) {
  if (field.kind === 'count') return valueOf(v) !== null;
  if (Array.isArray(v)) return v.length > 0;
  return v !== undefined && v !== null && v !== '';
}

export function sampleStarted(inv, obs, level) {
  if (!obs) return false;
  return inv.fields.some((f) => fieldVisible(f, level) && hasValue(f, obs[f.id])) || Boolean(obs.words);
}

export function newRecord(inv, records = [], now = Date.now()) {
  return {
    id: `${inv.id}-${now}`,
    investigationId: inv.id,
    trial: records.filter((r) => r.investigationId === inv.id).length + 1,
    stage: 'ready',
    checklist: [],
    hypothesis: { choice: null, sure: null },
    stepsDone: [],
    observations: {},
    outcome: { verdict: null, words: '' },
    createdAt: now,
    updatedAt: now,
    finishedAt: null
  };
}

export function hypothesisSentence(inv, hypothesis) {
  const option = inv.options?.find((o) => o.id === hypothesis?.choice);
  return option ? inv.guessSentence(option) : null;
}

export function stageDone(inv, record, stageId, level) {
  switch (stageId) {
    case 'ready': return record.checklist.length >= inv.needs.length;
    case 'guess': return Boolean(record.hypothesis?.choice);
    case 'do': return record.stepsDone.length >= inv.steps.length;
    case 'look': return inv.samples.every((s) => sampleStarted(inv, record.observations[s.id], level));
    case 'result': return inv.kind === 'build'
      ? Boolean(record.finishedAt)
      : Boolean(record.outcome?.verdict);
    default: return false;
  }
}

export const starsFor = (inv, record, level) => stagesFor(inv).filter((s) => stageDone(inv, record, s.id, level)).length;

/**
 * What her own data says, and whether it matches her guess. The verdict is
 * only suggested - she decides, since she may have seen what the chips missed.
 */
export function analyseRecord(inv, record) {
  if (!inv.judge) return { dataSays: null, suggested: null, warning: null };
  const found = inv.judge(record.observations || {});
  if (!found) return { dataSays: null, suggested: null, warning: null };
  const guess = record.hypothesis?.choice;
  let suggested = null;
  if (guess) {
    if (Array.isArray(found.result)) {
      if (!found.result.includes(guess)) suggested = 'no';
      else suggested = found.result.length === 1 ? 'yes' : 'partly';
    } else {
      suggested = found.result === guess ? 'yes' : 'no';
    }
  }
  return { dataSays: found.text, suggested, warning: found.warning || null };
}

// --- judge helpers used by activity content ---------------------------------

/**
 * Compare one count between two samples.
 * `results` maps which way it came out to one of the investigation's options.
 */
export function compareCounts(obs, { field, a, b, tolerance = 0, results, text }) {
  const va = valueOf(obs[a.id]?.[field]);
  const vb = valueOf(obs[b.id]?.[field]);
  if (va === null || vb === null) return null;
  const which = Math.abs(va - vb) <= tolerance ? 'same' : va > vb ? 'a' : 'b';
  return { result: results[which], text: text(va, vb) };
}

/** The sample(s) with the biggest count; ties return several, so a guess can be "partly" right. */
export function mostCount(obs, samples, field, noun) {
  const scored = samples.map((s) => ({ s, v: valueOf(obs[s.id]?.[field]) })).filter((x) => x.v !== null);
  if (scored.length < 2) return null;
  const best = Math.max(...scored.map((x) => x.v));
  const winners = scored.filter((x) => x.v === best).map((x) => x.s);
  const list = scored.map((x) => `${x.s.label.toLowerCase()} ${x.v}`).join(', ');
  return {
    result: winners.map((s) => s.id),
    text: `${noun}: ${list}. Most: ${winners.map((s) => s.label.toLowerCase()).join(' and ')}.`
  };
}

/**
 * The sample(s) with the smallest value - the fastest time, the coolest spot.
 * Same shape as mostCount.
 */
export function leastCount(obs, samples, field, noun, unit = '') {
  const scored = samples.map((s) => ({ s, v: valueOf(obs[s.id]?.[field]) })).filter((x) => x.v !== null);
  if (scored.length < 2) return null;
  const low = Math.min(...scored.map((x) => x.v));
  const winners = scored.filter((x) => x.v === low).map((x) => x.s);
  const list = scored.map((x) => `${x.s.label.toLowerCase()} ${x.v}${unit}`).join(', ');
  return {
    result: winners.map((s) => s.id),
    text: `${noun}: ${list}. Lowest: ${winners.map((s) => s.label.toLowerCase()).join(' and ')}.`
  };
}

/**
 * For picture answers that have an order (dry < damp < soaked, still < slow <
 * fast). `order` lists the choice ids from least to most. Returns the sample(s)
 * that came out highest (`want: 'most'`) or lowest (`want: 'least'`), with a
 * sentence built from the labels the learner tapped.
 */
export function rankChoice(obs, samples, field, { order, want = 'most', optionLabel, noun }) {
  const scored = samples
    .map((s) => ({ s, id: obs[s.id]?.[field] }))
    .filter((x) => order.includes(x.id))
    .map((x) => ({ ...x, rank: order.indexOf(x.id) }));
  if (scored.length < 2) return null;
  const target = want === 'least' ? Math.min(...scored.map((x) => x.rank)) : Math.max(...scored.map((x) => x.rank));
  const winners = scored.filter((x) => x.rank === target).map((x) => x.s);
  const list = scored.map((x) => `${x.s.label.toLowerCase()}: ${optionLabel(x.id).toLowerCase()}`).join(', ');
  // Everything the same is its own answer, so "no difference" can be right.
  const allSame = winners.length === scored.length;
  return {
    result: allSame ? ['same'] : winners.map((s) => s.id),
    text: `${noun} ${list}.`
  };
}

/** One short line per sample for the lab book table. */
export function sampleSummary(inv, obs, level, lookups) {
  if (!obs) return '';
  const parts = [];
  for (const f of inv.fields) {
    if (!fieldVisible(f, level)) continue;
    const v = obs[f.id];
    if (!hasValue(f, v)) continue;
    if (f.kind === 'count') {
      parts.push(Array.isArray(v) ? `${v.filter(Number.isFinite).join(', ')} (middle ${valueOf(v)})` : `${v} ${f.unit || 'counted'}`);
    } else if (f.kind === 'number' || f.kind === 'stopwatch') {
      parts.push(`${v}${f.unit ? ` ${f.unit}` : ''}`);
    } else if (f.kind === 'choice') parts.push(f.options.find((o) => o.id === v)?.label.toLowerCase());
    else if (lookups?.[f.kind]) parts.push(lookups[f.kind](v));
  }
  if (obs.words) parts.push(`"${obs.words}"`);
  return parts.filter(Boolean).join(' · ');
}

export function stageSpeech(inv, stageId) {
  switch (stageId) {
    case 'ready': return `${inv.title}. Let's get ready. Tap each thing when you have it.`;
    case 'guess': return `${inv.question} ${inv.guessPrompt}`;
    case 'do': return 'Do each step. Tap done when you finish it.';
    case 'look': return inv.kind === 'build' ? 'Look at what you built. Tap what you see.' : 'Look carefully. Tap what you see.';
    case 'result': return inv.kind === 'build' ? 'You built it! Well done.' : 'What happened? Let\'s look at your results.';
    default: return '';
  }
}
