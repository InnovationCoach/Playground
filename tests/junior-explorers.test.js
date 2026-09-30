/**
 * Checks for Junior Explorers (primary, ages 6-11): the shared investigation
 * engine and the activities it runs.
 *
 * The things that would quietly let a young child down: a step too long to
 * read, a choice with no picture, a missing safety note, a result sentence that
 * invents data, or a judge whose answer can never match any guess.
 */
import { describe, it, expect } from 'vitest';
import {
  valueOf, newRecord, stagesFor, stageDone, starsFor, analyseRecord, fieldVisible, usesTrials,
  sampleStarted, sampleSummary, compareCounts, mostCount, leastCount, rankChoice
} from '../src/features/primary/engine/investigationModel.js';
import { FLOATING_HOUSE } from '../src/features/primary/activities/floatingHouse.js';
import { JUNIOR_ACTIVITIES, isPlayable } from '../src/features/primary/activities/index.js';

const playable = JUNIOR_ACTIVITIES.filter(isPlayable);
const withObs = (inv, observations, choice) => ({ ...newRecord(inv, [], 1), hypothesis: { choice, sure: 2 }, observations });

describe('activity list', () => {
  it('has all 8 activities, numbered 1-8 in order', () => {
    expect(JUNIOR_ACTIVITIES.map((a) => a.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    for (const a of JUNIOR_ACTIVITIES) {
      expect(a.title, a.id).toBeTruthy();
      expect(a.short, a.id).toBeTruthy();
      expect(a.icon, a.id).toBeTruthy();
    }
  });
  it('all eight activities are playable', () => {
    expect(playable.map((a) => a.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

describe('every playable investigation is complete', () => {
  for (const activity of playable) {
    for (const inv of activity.investigations) {
      it(`${activity.id}/${inv.id}`, () => {
        expect(inv.needs.length).toBeGreaterThan(0);
        expect(inv.safety.length).toBeGreaterThan(0);
        expect(inv.steps.length).toBeGreaterThan(0);
        expect(inv.samples.length).toBeGreaterThan(0);
        expect(inv.scientists).toBeTruthy();
        for (const s of inv.steps) expect(s.icon, s.text).toBeTruthy();
        if (inv.kind !== 'build') {
          expect(inv.options.length).toBeGreaterThanOrEqual(2);
          expect(inv.options.length).toBeLessThanOrEqual(4);
          for (const o of inv.options) {
            expect(o.icon, o.label).toBeTruthy();
            expect(inv.guessSentence(o)).toMatch(/^I think .+\.$/);
          }
          expect(typeof inv.judge).toBe('function');
        }
        for (const f of inv.fields) {
          if (f.kind === 'choice') for (const o of f.options) expect(o.icon, o.label).toBeTruthy();
        }
      });
    }
  }
});

describe('floating house is written for young readers', () => {
  const texts = FLOATING_HOUSE.investigations.flatMap((i) => [
    ...i.steps.map((s) => s.text), ...i.safety, ...i.needs.map((n) => n.label)
  ]);
  it('no step, safety line or kit item is longer than 12 words', () => {
    for (const t of texts) expect(t.split(/\s+/).length, t).toBeLessThanOrEqual(12);
  });
  it('starts with a build, then tests', () => {
    expect(FLOATING_HOUSE.investigations[0].kind).toBe('build');
    expect(FLOATING_HOUSE.investigations.slice(1).every((i) => i.kind !== 'build')).toBe(true);
  });
});

describe('engine', () => {
  it('the middle of three tries is the median; nothing recorded is null', () => {
    expect(valueOf([5, 12, 7])).toBe(7);
    expect(valueOf([5, null, 7])).toBe(6);
    expect(valueOf([null, null, null])).toBeNull();
    expect(valueOf(0)).toBe(0); // a real zero
    expect(valueOf(null)).toBeNull();
  });

  it('a build has no guess step; a test has five steps', () => {
    const [build, size] = FLOATING_HOUSE.investigations;
    expect(stagesFor(build).map((s) => s.id)).toEqual(['ready', 'do', 'look', 'result']);
    expect(stagesFor(size)).toHaveLength(5);
  });

  it('explorer-only fields are hidden for starters, and tries only appear for explorers', () => {
    const build = FLOATING_HOUSE.investigations[0];
    const bricks = build.fields.find((f) => f.id === 'bricks');
    expect(fieldVisible(bricks, 'starter')).toBe(false);
    expect(fieldVisible(bricks, 'explorer')).toBe(true);
    const coins = FLOATING_HOUSE.investigations[1].fields.find((f) => f.id === 'coins');
    expect(usesTrials(coins, 'starter')).toBe(false);
    expect(usesTrials(coins, 'explorer')).toBe(true);
  });

  it('a sample with only an explorer field filled is not "started" for a starter', () => {
    const build = FLOATING_HOUSE.investigations[0];
    expect(sampleStarted(build, { bricks: 12 }, 'starter')).toBe(false);
    expect(sampleStarted(build, { bricks: 12 }, 'explorer')).toBe(true);
    expect(sampleStarted(build, { bottles: 0 }, 'starter')).toBe(true);
  });

  it('finishing a build earns every star', () => {
    const build = FLOATING_HOUSE.investigations[0];
    const r = {
      ...newRecord(build, [], 1),
      checklist: build.needs.map((_, i) => i),
      stepsDone: build.steps.map((_, i) => i),
      observations: { house: { floats: 'level' } },
      finishedAt: 5
    };
    expect(starsFor(build, r, 'starter')).toBe(stagesFor(build).length);
    expect(stageDone(build, { ...r, finishedAt: null }, 'result', 'starter')).toBe(false);
  });

  it('the lab book summary shows three tries with their middle', () => {
    const size = FLOATING_HOUSE.investigations[1];
    expect(sampleSummary(size, { coins: [10, 14, 12] }, 'explorer', {})).toBe('10, 14, 12 (middle 12)');
    expect(sampleSummary(size, { coins: 11 }, 'starter', {})).toBe('11 coins');
  });
});

describe('results come only from what the child recorded', () => {
  const [, size, balance, material] = FLOATING_HOUSE.investigations;

  it('says nothing before both rafts are tested', () => {
    expect(analyseRecord(size, withObs(size, { small: { coins: 8 } }, 'big')).dataSays).toBeNull();
  });

  it('big raft: counts decide, with three tries using the middle', () => {
    const a = analyseRecord(size, withObs(size, { small: { coins: [6, 9, 7] }, big: { coins: [15, 18, 16] } }, 'big'));
    expect(a.dataSays).toBe('The small raft carried 7 coins. The big raft carried 16 coins.');
    expect(a.suggested).toBe('yes');
  });

  it('counts one apart are "the same" - a coin more or less is within counting error', () => {
    expect(analyseRecord(size, withObs(size, { small: { coins: 10 }, big: { coins: 11 } }, 'same')).suggested).toBe('yes');
  });

  it('balance: more coins in the middle supports "in the middle"', () => {
    const a = analyseRecord(balance, withObs(balance, { middle: { coins: 14 }, edge: { coins: 4 } }, 'middle'));
    expect(a.suggested).toBe('yes');
    expect(analyseRecord(balance, withObs(balance, { middle: { coins: 14 }, edge: { coins: 4 } }, 'side')).suggested).toBe('no');
  });

  it('material: a tie makes the guess "partly" right', () => {
    const obs = { bottles: { coins: 12 }, foil: { coins: 12 }, card: { coins: 3 } };
    expect(analyseRecord(material, withObs(material, obs, 'bottles')).suggested).toBe('partly');
    expect(analyseRecord(material, withObs(material, obs, 'card')).suggested).toBe('no');
  });

  it('every judge answer is one of the guess options', () => {
    for (const inv of [size, balance]) {
      for (const [a, b] of [[1, 20], [20, 1], [10, 10]]) {
        const [s1, s2] = inv.samples;
        const r = inv.judge({ [s1.id]: { coins: a }, [s2.id]: { coins: b } });
        expect(inv.options.map((o) => o.id), `${inv.id} ${a}/${b}`).toContain(r.result);
      }
    }
    const m = material.judge({ bottles: { coins: 9 }, foil: { coins: 2 }, card: { coins: 1 } });
    for (const id of m.result) expect(material.options.map((o) => o.id)).toContain(id);
  });

  it('helpers refuse to judge on missing data', () => {
    expect(compareCounts({}, { field: 'coins', a: { id: 'a' }, b: { id: 'b' }, results: {}, text: () => '' })).toBeNull();
    expect(mostCount({ a: { coins: 3 } }, [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], 'coins', 'Coins')).toBeNull();
  });
});


// --- Activities 1-6 (added 2026-09-27) ---------------------------------------

const NEW_IDS = ['hot-spots', 'storm-shelter', 'microbit-blocks', 'mangroves', 'sun-power', 'acid-rain'];
const newActivities = JUNIOR_ACTIVITIES.filter((a) => NEW_IDS.includes(a.id));

describe('activities 1-6 are written for young readers', () => {
  for (const activity of newActivities) {
    const texts = activity.investigations.flatMap((i) => [
      ...i.steps.map((s) => s.text), ...i.safety, ...i.needs.map((n) => n.label)
    ]);
    it(`${activity.id}: no step, safety line or kit item is longer than 12 words`, () => {
      for (const t of texts) expect(t.split(/\s+/).length, t).toBeLessThanOrEqual(12);
    });
    it(`${activity.id}: starts with a build, then tests`, () => {
      expect(activity.investigations[0].kind).toBe('build');
      expect(activity.investigations.slice(1).every((i) => i.kind !== 'build')).toBe(true);
    });
    it(`${activity.id}: has a story, a kit list and standards`, () => {
      expect(activity.story).toBeTruthy();
      expect(activity.kit).toBeTruthy();
      expect(activity.standards.length).toBeGreaterThan(0);
    });
    it(`${activity.id}: number fields have a sensible range and start`, () => {
      for (const inv of activity.investigations) {
        for (const f of inv.fields.filter((x) => x.kind === 'number')) {
          expect(f.min).toBeLessThan(f.max);
          expect(f.start).toBeGreaterThanOrEqual(f.min);
          expect(f.start).toBeLessThanOrEqual(f.max);
        }
      }
    });
  }
});

/** Fill every sample with a value so each judge has something to work with. */
function sampleObs(inv, pick) {
  const obs = {};
  inv.samples.forEach((s, i) => {
    obs[s.id] = {};
    for (const f of inv.fields) {
      if (f.kind === 'number') obs[s.id][f.id] = f.start + i;
      else if (f.kind === 'count') obs[s.id][f.id] = 3 + i;
      else if (f.kind === 'choice') obs[s.id][f.id] = pick(f.options, i).id;
    }
  });
  return obs;
}

describe('activities 1-6: every judge answers from the data', () => {
  for (const activity of newActivities) {
    for (const inv of activity.investigations.filter((i) => i.kind !== 'build')) {
      it(`${activity.id}/${inv.id}`, () => {
        const optionIds = inv.options.map((o) => o.id);
        // Different values per sample: the judge must name real guesses.
        const varied = inv.judge(sampleObs(inv, (opts, i) => opts[Math.min(i, opts.length - 1)]));
        expect(varied, 'judge returned nothing for complete data').not.toBeNull();
        const ids = Array.isArray(varied.result) ? varied.result : [varied.result];
        for (const id of ids) expect([...optionIds, 'same']).toContain(id);
        expect(varied.text).toMatch(/\.$/);
        // No data, no verdict.
        expect(inv.judge({})).toBeNull();
      });
    }
  }
});

describe('new judge helpers', () => {
  const samples = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }];
  it('leastCount finds the lowest, with ties', () => {
    expect(leastCount({ a: { t: 5 }, b: { t: 3 }, c: { t: 3 } }, samples, 't', 'Time', ' s').result).toEqual(['b', 'c']);
    expect(leastCount({ a: { t: 5 } }, samples, 't', 'Time')).toBeNull();
  });
  it('rankChoice ranks picture answers and reports "same" when all match', () => {
    const order = ['dry', 'damp', 'soaked'];
    const opts = { order, want: 'least', optionLabel: (id) => id, noun: 'Tissue:' };
    expect(rankChoice({ a: { w: 'soaked' }, b: { w: 'dry' } }, samples, 'w', opts).result).toEqual(['b']);
    expect(rankChoice({ a: { w: 'damp' }, b: { w: 'damp' } }, samples, 'w', opts).result).toEqual(['same']);
    expect(rankChoice({ a: { w: 'soaked' }, b: { w: 'dry' } }, samples, 'w', { ...opts, want: 'most' }).result).toEqual(['a']);
    expect(rankChoice({ a: { w: 'dry' } }, samples, 'w', opts)).toBeNull();
  });
  it('summaries show readings with their unit', () => {
    const hot = JUNIOR_ACTIVITIES.find((a) => a.id === 'hot-spots').investigations[1];
    expect(sampleSummary(hot, { temp: 34 }, 'starter', {})).toBe('34 °C');
  });
});

describe('activity-specific results', () => {
  const find = (a, i) => JUNIOR_ACTIVITIES.find((x) => x.id === a).investigations.find((x) => x.id === i);
  it('hot spots: sun vs shade compares the readings', () => {
    const inv = find('hot-spots', 'sun-shade');
    const r = analyseRecord(inv, withObs(inv, { sun: { temp: 38 }, shade: { temp: 31 } }, 'sun'));
    expect(r.suggested).toBe('yes');
    expect(r.dataSays).toBe('In the sun it was 38 °C. In the shade it was 31 °C.');
  });
  it('micro:bit counter: 10 presses showing 11 flags a bug', () => {
    const inv = find('microbit-blocks', 'counter');
    const r = analyseRecord(inv, withObs(inv, { microbit: { shown: 11 } }, 'ten'));
    expect(r.suggested).toBe('no');
    expect(r.warning).toMatch(/bug/);
    expect(analyseRecord(inv, withObs(inv, { microbit: { shown: 10 } }, 'ten')).suggested).toBe('yes');
  });
  it('storm shelter: the shelter that never fell is strongest', () => {
    const inv = find('storm-shelter', 'wind');
    const r = analyseRecord(inv, withObs(inv, { tall: { fell: 'low' }, wide: { fell: 'never' } }, 'wide'));
    expect(r.suggested).toBe('yes');
  });
  it('acid rain: only vinegar turns pink', () => {
    const inv = find('acid-rain', 'detectives');
    const r = analyseRecord(inv, withObs(inv, { water: { colour: 'purple' }, vinegar: { colour: 'pink' }, soda: { colour: 'blue' } }, 'vinegar'));
    expect(r.suggested).toBe('yes');
    expect(r.dataSays).toMatch(/vinegar is an acid/);
  });
  it('sun power: explorer stopwatch times decide when present', () => {
    const inv = find('sun-power', 'angle');
    const r = analyseRecord(inv, withObs(inv, { flat: { spin: 'fast', time: 9.2 }, facing: { spin: 'fast', time: 7.4 } }, 'facing'));
    expect(r.suggested).toBe('yes');
    expect(r.dataSays).toMatch(/Fastest: facing the sun/);
  });
});
