import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  API_CONTRACT_VERSION, CAPABILITIES, PUBLISHED_RELEASES, resolveTask,
  validateSubmission, validateDraft, validateEvidence, validateReview,
  canonicalStringify, getBundleHashInputs, parseNumber, checkNumber, displayAnswer, roundDecimal
} from '../index.js';
import { PILOT_BUNDLE, FIXTURE_RELEASES, REFERENCE_ARTIFACTS } from '../fixtures/index.js';

const clone = value => JSON.parse(JSON.stringify(value));
const windExample = REFERENCE_ARTIFACTS[0];
const missionId = 'thalassa-wind-survey';
const options = { registry: FIXTURE_RELEASES, missionId };
const identity = { ...Object.fromEntries(['releaseId', 'missionVersion', 'routeId', 'taskId', 'policyVersion'].map(k => [k, windExample.request[k]])), missionId };
const route = PILOT_BUNDLE.missions[0].routes[0];
const cf = route.steps.find(s => s.id === 'capacity-factor');
const journey = PILOT_BUNDLE.missions[1];
const days = journey.routes[0].steps.find(s => s.id === 'days');
const chemical = journey.routes[1].steps.find(s => s.id === 'chem-propellant');
const draft = () => ({ contractVersion: API_CONTRACT_VERSION, ...Object.fromEntries(Object.entries(identity).filter(([k]) => k !== 'missionId')),
  expectedRevision: 0, supportMode: 'guided', activeStepId: 'hours', answers: [], evidence: [], reflection: '' });

for (const example of REFERENCE_ARTIFACTS) {
  test('complete artifact accepted: ' + example.name, () => {
    const id = example.endpoint.split('/').at(-2);
    const result = validateSubmission(clone(example.request), { registry: FIXTURE_RELEASES, missionId: id });
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.deepEqual(result.value, example.request);
    assert.equal(example.educatorApproval, false);
  });
}

test('empty production registry cannot resolve a fixture, regardless of its prefix', () => {
  assert.equal(PUBLISHED_RELEASES.length, 0);
  assert.equal(resolveTask(PUBLISHED_RELEASES, identity).ok, false);
  const alternate = clone(PILOT_BUNDLE);
  alternate.releaseId = 'looks-published';
  assert.equal(resolveTask(PUBLISHED_RELEASES, { ...identity, releaseId: alternate.releaseId }).ok, false);
});
test('exact route, version and policy are all bound', () => {
  assert.equal(resolveTask(FIXTURE_RELEASES, identity).ok, true);
  for (const [field, value] of [['missionVersion', '0.1.0-draft'], ['routeId', 'advanced'], ['taskId', 'journey-rates'], ['policyVersion', 'other']]) {
    assert.equal(resolveTask(FIXTURE_RELEASES, { ...identity, [field]: value }).ok, false, field);
  }
  assert.equal(resolveTask([PILOT_BUNDLE, PILOT_BUNDLE], identity).ok, false);
});
test('missing, duplicate, unknown and wrongly typed parts are rejected', () => {
  for (const mutate of [
    q => q.evidence.pop(),
    q => q.evidence.push(q.evidence[0]),
    q => { q.evidence[0].partId = 'unknown'; },
    q => { q.evidence[0].kind = 'artifact-reference'; },
    q => { q.evidence[3].selectedId = 'unlock-boreas'; },
    q => { q.evidence[0].approval = true; }
  ]) {
    const q = clone(windExample.request);
    mutate(q);
    assert.equal(validateSubmission(q, options).ok, false);
  }
});
test('client authority fields and wrong contracts are rejected', () => {
  for (const field of ['orgId', 'learnerUid', 'status', 'outcome', 'grantIds', 'isCorrect']) {
    assert.equal(validateSubmission({ ...clone(windExample.request), [field]: true }, options).ok, false, field);
  }
  assert.equal(validateSubmission({ ...clone(windExample.request), contractVersion: 'old' }, options).error.code, 'CONTRACT_VERSION_UNSUPPORTED');
});
test('table width, row count, cell and text limits are enforced', () => {
  for (const mutate of [
    q => q.evidence[1].rows[0].pop(),
    q => { q.evidence[1].rows[0][0] = 'x'.repeat(201); },
    q => { q.evidence[1].rows = Array(31).fill(q.evidence[1].rows[0]); },
    q => { q.evidence[0].text = 'x'.repeat(2001); },
    q => { q.reflection = 'short'; }
  ]) {
    const q = clone(windExample.request); mutate(q);
    assert.equal(validateSubmission(q, options).ok, false);
  }
});
test('transport body limit is measured in UTF-8 bytes', () => {
  const q = clone(windExample.request);
  const bigTable = { kind: 'table', caption: 'Synthetic', columns: Array(8).fill('Column'), rows: Array.from({ length: 30 }, () => Array(8).fill('🌊'.repeat(100))) };
  q.evidence[1] = { ...bigTable, partId: 'weighted-results' };
  q.evidence[2] = { ...bigTable, partId: 'plan-comparison' };
  assert.equal(validateSubmission(q, options).error.code, 'PAYLOAD_TOO_LARGE');
});
test('diagram edges must resolve and remain inside the authored vocabulary', () => {
  const example = REFERENCE_ARTIFACTS.find(e => e.name.endsWith('diagram-alternative'));
  for (const mutate of [
    p => { p.edges[0].fromId = 'missing'; },
    p => p.nodes.push(p.nodes[0]),
    p => { p.nodes[0].label = 'Forged diagram node'; },
    p => { p.edges[0].code = 'execute'; },
    p => { p.description = ''; }
  ]) {
    const q = clone(example.request); mutate(q.evidence[2]);
    assert.equal(validateSubmission(q, { registry: FIXTURE_RELEASES, missionId: 'spacecraft-journey' }).ok, false);
  }
});
test('draft preserves cleared, invalid and unit-bearing raw input and recomputes values', () => {
  for (const [rawText, parsed] of [['', null], ['not finished', null], ['34%', .34], ['0.336', .336]]) {
    const q = draft();
    q.answers = [{ stepId: 'capacity-factor', kind: 'number', rawText, value: 999 }];
    const result = validateDraft(q, options);
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.value.answers[0].value, parsed);
    assert.equal(result.value.answers[0].rawText, rawText);
    assert.equal(q.answers[0].value, 999, 'input not mutated');
  }
});
test('draft supports incomplete known parts but rejects duplicate steps and extra fields', () => {
  const q = draft();
  q.evidence = [{ partId: 'recommendation', kind: 'choice', selectedId: '', reason: '' }];
  assert.equal(validateDraft(q, options).ok, true);
  q.answers = [{ stepId: 'hours', kind: 'number', rawText: '168', value: 168 }];
  q.answers.push(q.answers[0]);
  assert.equal(validateDraft(q, options).ok, false);
  q.answers = [{ stepId: 'hours', kind: 'number', rawText: '168', value: 168, correct: true }];
  assert.equal(validateDraft(q, options).ok, false);
  q.answers = [{ stepId: 'hours', kind: 'number', rawText: '1'.repeat(65), value: null }];
  assert.equal(validateDraft(q, options).ok, false);
});
test('review requires a revision and actionable return note without reviewer authority fields', () => {
  assert.equal(validateReview({ contractVersion: API_CONTRACT_VERSION, decision: 'approved', expectedSubmissionRevision: 1 }).ok, true);
  assert.equal(validateReview({ contractVersion: API_CONTRACT_VERSION, decision: 'returned', note: 'Compare both plans against the deck limit.', expectedSubmissionRevision: 1 }).ok, true);
  assert.equal(validateReview({ contractVersion: API_CONTRACT_VERSION, decision: 'returned', note: ' ', expectedSubmissionRevision: 1 }).ok, false);
  assert.equal(validateReview({ contractVersion: API_CONTRACT_VERSION, decision: 'approved', expectedSubmissionRevision: 0 }).ok, false);
  assert.equal(validateReview({ contractVersion: API_CONTRACT_VERSION, decision: 'approved', expectedSubmissionRevision: 1, coachUid: 'forged' }).ok, false);
});
test('number parser respects unit, grouping and finite value boundaries', () => {
  assert.equal(parseNumber('19 070 kg', chemical), 19070);
  assert.equal(parseNumber('19,070 kg', chemical), 19070);
  assert.equal(parseNumber('41.67 days', days), 41.67);
  assert.equal(parseNumber('3,600,000 seconds', { unit: 's' }), 3600000);
  assert.equal(parseNumber('3,600,000 second', { unit: 's' }), 3600000);
  assert.equal(parseNumber('34%', cf), .34);
  assert.equal(parseNumber('.34', cf), .34);
  for (const raw of ['19,07 kg', '19,070 bananas', '1e999', 'Infinity', 'NaN', '1/2', '<script>', '1'.repeat(65)]) {
    assert.equal(parseNumber(raw, chemical), null, raw);
  }
  assert.equal(parseNumber('34%', chemical), null);
});
test('practice feedback accepts requested precision and identifies close work', () => {
  for (const raw of ['0.336', '0.34', '34%']) assert.equal(checkNumber(cf, raw), 'correct');
  assert.equal(checkNumber(cf, '0.33'), 'close');
  assert.equal(checkNumber(cf, '0.3'), 'incorrect');
  assert.equal(checkNumber(cf, ''), 'invalid');
  assert.equal(checkNumber(days, '41.67'), 'correct');
  assert.equal(checkNumber(chemical, '19,072'), 'correct');
});
test('decimal rounding and grouping do not reproduce the legacy display bug', () => {
  assert.equal(roundDecimal(1.005, { decimalPlaces: 2 }), '1.01');
  assert.equal(roundDecimal(-1.005, { decimalPlaces: 2 }), '-1.01');
  assert.equal(roundDecimal(-15, { decimalPlaces: 0, roundingMultiple: 10 }), '-20');
  assert.equal(displayAnswer(cf), '0.34');
  assert.equal(displayAnswer(chemical), '19,070 kg');
  assert.equal(displayAnswer(journey.routes[0].steps.find(s => s.id === 'seconds')), '3,600,000 s');
});
test('canonical JSON uses ECMAScript numbers, sorted keys and finite plain values', () => {
  assert.equal(canonicalStringify({ b: .000001, a: 14160.0 }), '{"a":14160,"b":0.000001}');
  assert.throws(() => canonicalStringify({ a: NaN }));
  assert.throws(() => canonicalStringify({ a: undefined }));
  assert.throws(() => canonicalStringify(new Date()));
  const cycle = {}; cycle.self = cycle;
  assert.throws(() => canonicalStringify(cycle));
});
test('all seven accepted content hashes verify; fixture copy retains accepted bytes semantically', () => {
  const inputs = getBundleHashInputs(PILOT_BUNDLE);
  assert.equal(inputs.length, 7);
  for (const input of inputs) assert.equal(createHash('sha256').update(input.canonical, 'utf8').digest('hex'), input.expected, input.id);
  assert.equal(PILOT_BUNDLE.bundleContentSha256, '974d7ad370297bec650701cd9ebfc76a77abbb239281cb32dcf35fb5ec3231a7');
  assert.deepEqual(JSON.parse(readFileSync(new URL('../fixtures/pilot-bundle.json', import.meta.url))), PILOT_BUNDLE);
});
test('capability JSON matches compiled exports', () => {
  assert.deepEqual(JSON.parse(readFileSync(new URL('../capabilities.json', import.meta.url))), CAPABILITIES);
});
test('production entry graph contains no fixtures or external runtime dependencies', () => {
  const visited = new Set();
  function visit(file) {
    if (visited.has(file)) return;
    visited.add(file);
    assert.equal(file.includes('/fixtures/'), false, file);
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g)) {
      assert.equal(match[1].startsWith('./'), true, 'Unexpected runtime dependency: ' + match[1]);
      visit(resolve(dirname(file), match[1]));
    }
  }
  visit(fileURLToPath(new URL('../index.js', import.meta.url)));
  assert.equal(visited.size, 5);
  assert.equal(validateEvidence([], route).ok, false);
});
