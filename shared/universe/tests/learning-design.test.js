import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { PILOT_BUNDLE } from '../fixtures/index.js';
import { getMissionLearningDesign, MISSION_LEARNING_DESIGNS } from '../learningDesign.js';

const lookup = (m, r) => getMissionLearningDesign(m.id, r.id, m.version, PILOT_BUNDLE.bundleContentSha256);

for (const mission of PILOT_BUNDLE.missions) for (const route of mission.routes) {
  test(`focused content preserves the full task: ${mission.id}/${route.id}`, () => {
    const design = lookup(mission, route);
    assert.ok(design);
    assert.deepEqual(Object.keys(design.steps), route.steps.map(s => s.id));
    const covered = new Set();
    for (const authored of route.steps) {
      const focus = design.steps[authored.id];
      assert.ok(focus.action.length < 200, authored.id);
      const partIds = focus.notebookPartIds ?? authored.evidencePartIds;
      for (const id of partIds) {
        assert.ok(authored.evidencePartIds.includes(id), id);
        assert.ok(focus.parts[id]?.action, `Missing learner instruction for ${id}`);
        covered.add(id);
      }
      for (const id of Object.keys(focus.parts)) assert.ok(authored.evidencePartIds.includes(id));
    }
    assert.deepEqual([...covered].sort(), route.requiredParts.map(p => p.partId).sort());
    assert.ok(Object.isFrozen(design.steps));
    assert.ok(Object.isFrozen(design.ngss[0]));
  });
}

test('unknown version, hash, mission or route receives no borrowed presentation', () => {
  const good = ['spacecraft-journey', 'guided', '0.2.0-draft', PILOT_BUNDLE.bundleContentSha256];
  for (let i = 0; i < good.length; i++) {
    const bad = [...good]; bad[i] = 'unknown';
    assert.equal(getMissionLearningDesign(...bad), null);
  }
  assert.equal(getMissionLearningDesign(...good.slice(0, 3)), null);
});

test('short copy retains the scenario distinction and does not change accepted authoring bytes', () => {
  const advanced = MISSION_LEARNING_DESIGNS.find(d => d.routeId === 'advanced');
  assert.equal(advanced.recommendedGrades, '9–11');
  assert.match(advanced.routeNote, /separate 140-day/);
  assert.match(advanced.steps['compare-solutions'].parts.comparison.reference, /not|omitted/i);
  const file = readFileSync(new URL('../fixtures/pilot-bundle.json', import.meta.url));
  assert.equal(createHash('sha256').update(file).digest('hex'), '7885a55c262070a470bf035c83bcb7543165098a7228da632bd09822a8647a04');
});
