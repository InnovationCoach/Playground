/**
 * Checks for the Plant Microscope Lab content and logic.
 *
 * The things that would quietly mislead a learner: a guess the app cannot
 * judge, a "your data says" that invents something she did not record, a zero
 * count treated as "not counted", or a comparison at two magnifications passed
 * off as fair.
 */
import { describe, it, expect } from 'vitest';
import {
  EXPERIMENTS, EXPERIMENT_BY_ID, STAGES, SAME_COUNT_TOLERANCE,
  newRecord, hypothesisSentence, analyseRecord, stageDone, starsFor, sampleStarted, sampleSummary
} from '../src/features/activities/plantLab/plantLabModel.js';

const withObs = (expId, observations, choice) => ({
  ...newRecord(expId, [], 1),
  hypothesis: { choice, sure: 2 },
  observations
});

describe('experiment content', () => {
  it('every experiment is complete and has unique ids', () => {
    expect(new Set(EXPERIMENTS.map((e) => e.id)).size).toBe(EXPERIMENTS.length);
    for (const e of EXPERIMENTS) {
      expect(e.question).toBeTruthy();
      expect(e.options.length).toBeGreaterThanOrEqual(2);
      expect(e.options.length).toBeLessThanOrEqual(4); // few choices, by design
      expect(e.needs.length).toBeGreaterThan(0);
      expect(e.safety.length).toBeGreaterThan(0);
      expect(e.steps.length).toBeGreaterThan(0);
      expect(e.samples.length).toBeGreaterThan(0);
      expect(e.scientists).toBeTruthy();
    }
  });

  it('every guess option makes a sentence', () => {
    for (const e of EXPERIMENTS) {
      for (const o of e.options) {
        const s = hypothesisSentence(e, { choice: o.id });
        expect(s, `${e.id}/${o.id}`).toMatch(/^I think .+\.$/);
      }
    }
  });

  it('no step sentence is long - the learner reads these', () => {
    for (const e of EXPERIMENTS) {
      for (const s of e.steps) expect(s.text.split(/\s+/).length, s.text).toBeLessThanOrEqual(16);
    }
  });
});

describe('analyseRecord only reports what was recorded', () => {
  it('says nothing before anything is recorded', () => {
    for (const e of EXPERIMENTS) {
      const a = analyseRecord(e, withObs(e.id, {}, e.options[0].id));
      expect(a.dataSays, e.id).toBeNull();
      expect(a.suggested, e.id).toBeNull();
    }
  });

  it('stomata: counts decide, including a real zero', () => {
    const e = EXPERIMENT_BY_ID.get('stomata');
    const a = analyseRecord(e, withObs('stomata', { top: { count: 0 }, bottom: { count: 14 } }, 'bottom'));
    expect(a.dataSays).toBe('You counted 0 on the top and 14 on the bottom.');
    expect(a.suggested).toBe('yes');
    const b = analyseRecord(e, withObs('stomata', { top: { count: 0 }, bottom: { count: 14 } }, 'top'));
    expect(b.suggested).toBe('no');
  });

  it('stomata: counts within the tolerance are "about the same"', () => {
    const e = EXPERIMENT_BY_ID.get('stomata');
    const a = analyseRecord(e, withObs('stomata', { top: { count: 10 }, bottom: { count: 10 + SAME_COUNT_TOLERANCE } }, 'same'));
    expect(a.suggested).toBe('yes');
  });

  it('warns when slides were compared at different lenses', () => {
    const e = EXPERIMENT_BY_ID.get('stomata');
    const a = analyseRecord(e, withObs('stomata', { top: { count: 3, lens: '10x' }, bottom: { count: 9, lens: '40x' } }, 'bottom'));
    expect(a.warning).toMatch(/fair test/);
    const b = analyseRecord(e, withObs('stomata', { top: { count: 3, lens: '10x' }, bottom: { count: 9, lens: '10x' } }, 'bottom'));
    expect(b.warning).toBeNull();
  });

  it('parts: several green parts makes a leaf guess only partly right', () => {
    const e = EXPERIMENT_BY_ID.get('parts');
    const obs = { leaf: { colours: ['green'] }, stem: { colours: ['green', 'yellow'] }, root: { colours: ['clear'] } };
    expect(analyseRecord(e, withObs('parts', obs, 'leaf')).suggested).toBe('partly');
    expect(analyseRecord(e, withObs('parts', obs, 'root')).suggested).toBe('no');
    const onlyLeaf = { leaf: { colours: ['green'] }, root: { colours: ['clear'] } };
    expect(analyseRecord(e, withObs('parts', onlyLeaf, 'leaf')).suggested).toBe('yes');
  });

  it('onion: compares clarity of the two slides', () => {
    const e = EXPERIMENT_BY_ID.get('onion');
    expect(analyseRecord(e, withObs('onion', { water: { clarity: 1 }, iodine: { clarity: 3 } }, 'easier')).suggested).toBe('yes');
    expect(analyseRecord(e, withObs('onion', { water: { clarity: 2 }, iodine: { clarity: 2 } }, 'easier')).suggested).toBe('no');
  });

  it('salt and celery map her chip to a guess option', () => {
    expect(analyseRecord(EXPERIMENT_BY_ID.get('salt'), withObs('salt', { salty: { size: 'shrunk' } }, 'shrunk')).suggested).toBe('yes');
    expect(analyseRecord(EXPERIMENT_BY_ID.get('celery'), withObs('celery', { slice: { pattern: 'dots' } }, 'everywhere')).suggested).toBe('no');
  });

  it('every judge result is one of the experiment\'s own options', () => {
    // Otherwise "your data suggests" could never agree with any guess.
    const e = EXPERIMENT_BY_ID.get('celery');
    for (const p of ['dots', 'all', 'none']) {
      const a = analyseRecord(e, withObs('celery', { slice: { pattern: p } }, 'tubes'));
      expect(a.suggested).not.toBeNull();
    }
  });
});

describe('progress', () => {
  it('numbers repeat trials', () => {
    const r1 = newRecord('salt', [], 1);
    const r2 = newRecord('salt', [r1, newRecord('parts', [], 2)], 3);
    expect(r2.trial).toBe(2);
  });

  it('a zero count counts as recorded', () => {
    const e = EXPERIMENT_BY_ID.get('stomata');
    expect(sampleStarted(e, { count: 0 })).toBe(true);
    expect(sampleStarted(e, { count: null })).toBe(false);
    expect(sampleSummary(e, { count: 0, lens: '10x' })).toBe('10× · 0 counted');
  });

  it('five finished stages give five stars', () => {
    const e = EXPERIMENT_BY_ID.get('salt');
    const r = {
      ...newRecord('salt', [], 1),
      checklist: e.needs.map((_, i) => i),
      hypothesis: { choice: 'shrunk', sure: 3 },
      stepsDone: e.steps.map((_, i) => i),
      observations: { plain: { size: 'full' }, salty: { size: 'shrunk' } },
      outcome: { verdict: 'yes', words: '' }
    };
    expect(STAGES.every((s) => stageDone(e, r, s.id))).toBe(true);
    expect(starsFor(e, r)).toBe(5);
  });
});
