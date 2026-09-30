/**
 * Turns Junior Explorers activity content into worksheet and teacher-guide
 * parts. Pure, so the paper version can be tested against the same content
 * the app runs: if a step changes in the app, the worksheet changes with it.
 */
import { fieldVisible, usesTrials } from '../engine/investigationModel.js';
import { LENSES, COLOURS, SHAPES, CLARITY } from '../../activities/plantLab/plantLabModel.js';

const uniqueBy = (items, key) => {
  const seen = new Set();
  return items.filter((x) => {
    const k = key(x);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

/**
 * Every kit item across the activity, once each. Items that start "Your …"
 * are things the children made in an earlier step (your raft, your tester),
 * not kit to collect, so they are left off the list.
 */
export const kitList = (activity) => uniqueBy(
  activity.investigations.flatMap((i) => i.needs).filter((n) => !/^your\b/i.test(n.label)),
  (n) => n.label.toLowerCase()
);

/** Every safety line across the activity, once each. */
export const safetyList = (activity) => uniqueBy(activity.investigations.flatMap((i) => i.safety || []), (s) => s.toLowerCase());

/** New words from every investigation, once each, in order. */
export const glossary = (activity) => uniqueBy(activity.investigations.flatMap((i) => i.newWords || []), (w) => w.word.toLowerCase());

/** Fields that go in the results table (drawings get their own boxes). */
export const tableFields = (inv, level) => inv.fields.filter((f) => f.kind !== 'draw' && fieldVisible(f, level));

/** Drawing fields shown at this level. */
export const drawFields = (inv, level) => inv.fields.filter((f) => f.kind === 'draw' && fieldVisible(f, level));

/**
 * How a results cell is filled in on paper:
 *   'box'     - write a number (with its unit)
 *   'trials'  - three boxes and the middle one (Explorer counts)
 *   'circle'  - circle one or more of the printed options
 */
export function cellSpec(field, level) {
  if (field.kind === 'count') {
    return usesTrials(field, level) ? { type: 'trials', unit: field.unit || '' } : { type: 'box', unit: field.unit || '' };
  }
  if (field.kind === 'number') return { type: 'box', unit: field.unit || '' };
  if (field.kind === 'stopwatch') return { type: 'box', unit: 'seconds' };
  const options = {
    choice: field.options,
    lens: LENSES.map((l) => ({ id: l.id, label: l.label, icon: '🔬' })),
    colours: COLOURS.map((c) => ({ id: c.id, label: c.label, swatch: c.swatch })),
    shape: SHAPES.map((s) => ({ id: s.id, label: s.label })),
    clarity: CLARITY.map((c) => ({ id: c.id, label: c.label, icon: c.icon }))
  }[field.kind];
  return options ? { type: 'circle', options, multi: field.kind === 'colours' } : { type: 'box', unit: '' };
}

/** "Start here" for the build, then Test 1, Test 2 ... */
export function investigationTag(activity, inv) {
  if (inv.kind === 'build') return 'Start here: build';
  const tests = activity.investigations.filter((i) => i.kind !== 'build');
  return `Test ${tests.indexOf(inv) + 1}`;
}

/** Running order with the clock time each part starts, from minute 0. */
export function runOrderWithTimes(runOrder) {
  let t = 0;
  return runOrder.map((r) => {
    const row = { ...r, from: t, to: t + r.min };
    t += r.min;
    return row;
  });
}
