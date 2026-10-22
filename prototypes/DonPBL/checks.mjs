/**
 * Real Verification Test Suite for Don's PBL Prototype
 * Location: prototypes/DonPBL/checks.mjs
 *
 * Bundles the actual TypeScript modules (ui/pbl.ts, engine.ts, programRegistry.ts,
 * programData.ts, mockFixtures.ts, store.ts) using the root's installed esbuild
 * (build API, bundle: true, format: 'esm', output to os.tmpdir()), imports the
 * compiled bundle at runtime, and runs real assertions against the exported
 * functions, data schemas, and offline store.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const results = [];
let failedCount = 0;

async function runCheck(name, fn) {
  try {
    await fn();
    console.log(`✓ PASS: ${name}`);
    results.push({ name, ok: true });
  } catch (err) {
    failedCount++;
    const message = err instanceof Error ? err.message : String(err);
    console.error(`✗ FAIL: ${name} — ${message}`);
    results.push({ name, ok: false, error: message });
  }
}

async function main() {
  console.log('=== Running DonPBL Real Module & Data Verification Suite (checks.mjs) ===');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'donpbl-checks-'));
  const bundleOutfile = path.join(tmpDir, 'pbl-bundle.mjs');
  const uiOutfile = path.join(tmpDir, 'ui-bundle.mjs');

  let pbl;

  // 1. Bundle ui/pbl.ts and ui/PblStudioApp.tsx with root esbuild
  await runCheck('1. Bundle ui/pbl.ts and ui/PblStudioApp.tsx with esbuild (0 errors, 0 warnings)', async () => {
    const barrelBuild = await build({
      entryPoints: [path.join(__dirname, 'ui', 'pbl.ts')],
      bundle: true,
      format: 'esm',
      platform: 'neutral',
      outfile: bundleOutfile,
      logLevel: 'silent'
    });
    assert.equal(barrelBuild.errors.length, 0, 'ui/pbl.ts build had errors');
    assert.equal(barrelBuild.warnings.length, 0, 'ui/pbl.ts build had warnings');

    const uiBuild = await build({
      entryPoints: [path.join(__dirname, 'ui', 'PblStudioApp.tsx')],
      bundle: true,
      jsx: 'automatic',
      format: 'esm',
      outfile: uiOutfile,
      logLevel: 'silent'
    });
    assert.equal(uiBuild.errors.length, 0, 'ui/PblStudioApp.tsx build had errors');
    assert.equal(uiBuild.warnings.length, 0, 'ui/PblStudioApp.tsx build had warnings');

    pbl = await import(pathToFileURL(bundleOutfile).href);
    assert.equal(typeof pbl.safeLink, 'function', 'safeLink must be exported from ui/pbl.ts');
    assert.equal(typeof pbl.evaluateReadiness, 'function', 'evaluateReadiness must be exported');
  });

  if (!pbl) {
    process.exit(1);
  }

  // 2. Test real safeLink from engine.ts
  await runCheck('2. engine.safeLink blocks dangerous schemes, protocol-relative URLs, and enforces length limit', () => {
    const { safeLink, LIMITS } = pbl;
    assert.equal(safeLink('javascript:alert(1)'), '');
    assert.equal(safeLink('JaVaScRiPt:alert(document.cookie)'), '');
    assert.equal(safeLink('   javascript:alert(1)'), '');
    assert.equal(safeLink('   JaVaScRiPt:void(0)  '), '');
    assert.equal(safeLink('data:text/html,<script>alert(1)</script>'), '');
    assert.equal(safeLink('vbscript:msgbox("xss")'), '');
    assert.equal(safeLink('//evil.com/payload.js'), '');
    assert.equal(safeLink('   //evil.com/path'), '');
    assert.equal(safeLink('ftp://files.example.com/archive.zip'), '');
    assert.equal(safeLink(''), '');
    assert.equal(safeLink('   '), '');

    // Accepts valid http and https (including leading whitespace trimmed)
    assert.equal(safeLink('https://example.com/doc?a=1'), 'https://example.com/doc?a=1');
    assert.equal(safeLink('  http://localhost:5180/demo  '), 'http://localhost:5180/demo');

    // Enforces length limit (LIMITS.link = 500)
    const exactMaxUrl = 'https://example.com/' + 'a'.repeat(LIMITS.link - 'https://example.com/'.length);
    assert.equal(exactMaxUrl.length, LIMITS.link);
    assert.equal(safeLink(exactMaxUrl), exactMaxUrl);

    const overMaxUrl = exactMaxUrl + 'x';
    assert.equal(overMaxUrl.length, LIMITS.link + 1);
    assert.equal(safeLink(overMaxUrl), '', 'URLs exceeding LIMITS.link must be rejected');
  });

  // 3. Test evaluateReadiness on empty, half-done, and complete fixture projects
  await runCheck('3. engine.evaluateReadiness computes exact scores and failing criteria across empty, partial, and complete projects', () => {
    const { evaluateReadiness, MOCK_COHORT, SAMPLE_STUDENT_PROJECT } = pbl;

    // Empty project (Team SolGuard: MOCK_COHORT[3])
    const emptyProj = MOCK_COHORT.find((p) => p.id === 'proj-solguard-04');
    assert.ok(emptyProj, 'proj-solguard-04 fixture must exist');
    const emptyRes = evaluateReadiness(emptyProj);
    assert.equal(emptyRes.score, 0);
    assert.equal(emptyRes.total, 8);
    assert.equal(emptyRes.percent, 0);
    assert.equal(emptyRes.isReady, false);
    const emptyFailedIds = emptyRes.checks.filter((c) => !c.ok).map((c) => c.id);
    assert.deepEqual(emptyFailedIds, [
      'hmw',
      'impact',
      'phases',
      'code',
      'ai-provenance',
      'data-table',
      'user-feedback',
      'final-format'
    ]);

    // Half-done project (Team HydroShade: MOCK_COHORT[1])
    const halfProj = MOCK_COHORT.find((p) => p.id === 'proj-hydroshade-02');
    assert.ok(halfProj, 'proj-hydroshade-02 fixture must exist');
    const halfRes = evaluateReadiness(halfProj);
    assert.equal(halfRes.score, 4);
    assert.equal(halfRes.total, 8);
    assert.equal(halfRes.percent, 50);
    assert.equal(halfRes.isReady, false);
    const halfFailedIds = halfRes.checks.filter((c) => !c.ok).map((c) => c.id);
    assert.deepEqual(halfFailedIds, [
      'phases',
      'ai-provenance',
      'data-table',
      'user-feedback'
    ]);

    // Early-stage project (Team BioShield: MOCK_COHORT[2])
    const earlyProj = MOCK_COHORT.find((p) => p.id === 'proj-bioshield-03');
    assert.ok(earlyProj, 'proj-bioshield-03 fixture must exist');
    const earlyRes = evaluateReadiness(earlyProj);
    assert.equal(earlyRes.score, 2);
    assert.equal(earlyRes.total, 8);
    assert.equal(earlyRes.percent, 25);
    assert.equal(earlyRes.isReady, false);

    // Complete project (Team EcoCool: SAMPLE_STUDENT_PROJECT)
    const fullRes = evaluateReadiness(SAMPLE_STUDENT_PROJECT);
    assert.equal(fullRes.score, 8);
    assert.equal(fullRes.total, 8);
    assert.equal(fullRes.percent, 100);
    assert.equal(fullRes.isReady, true);
    assert.deepEqual(fullRes.checks.filter((c) => !c.ok), []);
  });

  // 4. Test validateAndAddEvidence validation and immutability
  await runCheck('4. engine.validateAndAddEvidence rejects invalid inputs, accepts valid items, and never mutates input project', () => {
    const { validateAndAddEvidence, SAMPLE_STUDENT_PROJECT } = pbl;
    const snapshotBefore = JSON.stringify(SAMPLE_STUDENT_PROJECT);
    const initialCount = SAMPLE_STUDENT_PROJECT.evidence.length;

    // Reject missing title
    const rMissingTitle = validateAndAddEvidence(SAMPLE_STUDENT_PROJECT, {
      title: '   ',
      phase: 'explore',
      kind: 'note',
      body: 'Valid observation body'
    });
    assert.equal(rMissingTitle.success, false);
    assert.match(rMissingTitle.error || '', /title/i);

    // Reject bad phase
    const rBadPhase = validateAndAddEvidence(SAMPLE_STUDENT_PROJECT, {
      title: 'Lab Note',
      phase: 'invalid-phase',
      kind: 'note',
      body: 'Valid observation body'
    });
    assert.equal(rBadPhase.success, false);
    assert.match(rBadPhase.error || '', /phase/i);

    // Reject unsafe link
    const rUnsafeLink = validateAndAddEvidence(SAMPLE_STUDENT_PROJECT, {
      title: 'External Link Test',
      phase: 'explore',
      kind: 'media',
      body: 'Photo link',
      link: 'javascript:alert(1)'
    });
    assert.equal(rUnsafeLink.success, false);
    assert.match(rUnsafeLink.error || '', /http/i);

    // Reject protocol-relative link
    const rProtoRelative = validateAndAddEvidence(SAMPLE_STUDENT_PROJECT, {
      title: 'Protocol Relative Test',
      phase: 'explore',
      kind: 'media',
      body: 'Photo link',
      link: '//evil.com/xss'
    });
    assert.equal(rProtoRelative.success, false);

    // Reject AI item missing asked or kept
    const rAiMissingAsked = validateAndAddEvidence(SAMPLE_STUDENT_PROJECT, {
      title: 'AI Consultation',
      phase: 'prototype',
      kind: 'ai',
      body: 'Generated code',
      ai: { asked: '  ', gave: 'code', kept: 'Kept loop' }
    });
    assert.equal(rAiMissingAsked.success, false);
    assert.match(rAiMissingAsked.error || '', /asked/i);

    const rAiMissingKept = validateAndAddEvidence(SAMPLE_STUDENT_PROJECT, {
      title: 'AI Consultation',
      phase: 'prototype',
      kind: 'ai',
      body: 'Generated code',
      ai: { asked: 'Write loop', gave: 'code', kept: '' }
    });
    assert.equal(rAiMissingKept.success, false);
    assert.match(rAiMissingKept.error || '', /kept/i);

    // Accept valid item
    const rValid = validateAndAddEvidence(SAMPLE_STUDENT_PROJECT, {
      title: 'Calibrated Moisture Curve',
      phase: 'test',
      kind: 'data',
      body: 'Trial 1: 42% water reduction over 72 hours.',
      link: 'https://example.com/data.csv',
      competencies: ['ctps-01', 'sdl-04']
    });
    assert.equal(rValid.success, true);
    assert.ok(rValid.updatedProject);
    assert.equal(rValid.updatedProject.evidence.length, initialCount + 1);
    assert.equal(rValid.updatedProject.evidence[0].title, 'Calibrated Moisture Curve');
    assert.equal(rValid.updatedProject.evidence[0].link, 'https://example.com/data.csv');

    // Verify input project was NOT mutated
    assert.equal(SAMPLE_STUDENT_PROJECT.evidence.length, initialCount);
    assert.equal(JSON.stringify(SAMPLE_STUDENT_PROJECT), snapshotBefore);
  });

  // 5. Test getPhaseProgress and getCompetencyCoverage on fixtures
  await runCheck('5. engine.getPhaseProgress and getCompetencyCoverage compute accurate metrics on fixtures', () => {
    const { getPhaseProgress, getCompetencyCoverage, SAMPLE_STUDENT_PROJECT, SAMPLE_PROGRAM, MOCK_COHORT } = pbl;

    const exploreProg = getPhaseProgress(SAMPLE_STUDENT_PROJECT, 'explore', SAMPLE_PROGRAM);
    assert.equal(exploreProg.totalTasks, 4);
    assert.equal(exploreProg.doneTasks, 4);
    assert.equal(exploreProg.evidenceCount, 2);
    assert.equal(exploreProg.isPhaseReady, true);
    assert.equal(exploreProg.percentage, 100);

    const emptyProj = MOCK_COHORT.find((p) => p.id === 'proj-solguard-04');
    const emptyExplore = getPhaseProgress(emptyProj, 'explore', SAMPLE_PROGRAM);
    assert.equal(emptyExplore.doneTasks, 0);
    assert.equal(emptyExplore.evidenceCount, 0);
    assert.equal(emptyExplore.isPhaseReady, false);
    assert.equal(emptyExplore.percentage, 0);

    const coverage = getCompetencyCoverage(SAMPLE_STUDENT_PROJECT);
    assert.equal(coverage['ctps-01'], 2);
    assert.equal(coverage['ct-05'], 4);
    assert.equal(coverage['sdl-04'], 1);

    const emptyCoverage = getCompetencyCoverage(emptyProj);
    assert.deepEqual(emptyCoverage, {});
  });

  // 6. Test calculateUnitEconomics with hand-computed cases, zero units, and zero price
  await runCheck('6. engine.calculateUnitEconomics matches hand-computed cases and never produces NaN or Infinity', () => {
    const { calculateUnitEconomics } = pbl;

    // Standard hand-computed case: cost = 60 THB, margin = 50% -> retail = 120 THB, contribution = 60 THB, fixed = 300 THB -> breakEven = 5 units
    const std = calculateUnitEconomics({
      unitFloorCostTHB: 60,
      desiredGrossMarginPct: 50,
      fixedStartupCapitalExpenseTHB: 300
    });
    assert.equal(std.retailPriceTHB, 120);
    assert.equal(std.unitContributionMarginTHB, 60);
    assert.equal(std.breakEvenUnits, 5);
    assert.equal(std.actualMarginPct, 50);

    // Zero cost & zero fixed capital
    const zeroCost = calculateUnitEconomics({
      unitFloorCostTHB: 0,
      desiredGrossMarginPct: 60,
      fixedStartupCapitalExpenseTHB: 0
    });
    assert.equal(zeroCost.retailPriceTHB, 0);
    assert.equal(zeroCost.unitContributionMarginTHB, 0);
    assert.equal(zeroCost.breakEvenUnits, 0);
    assert.equal(zeroCost.actualMarginPct, 0);
    for (const val of Object.values(zeroCost)) {
      assert.ok(Number.isFinite(val), `Expected finite number, got ${val}`);
    }

    // Zero price override with positive cost and fixed expense (zero margin / loss leader)
    const zeroPrice = calculateUnitEconomics({
      unitFloorCostTHB: 85,
      desiredGrossMarginPct: 50,
      fixedStartupCapitalExpenseTHB: 500,
      retailPriceOverrideTHB: 0
    });
    assert.equal(zeroPrice.retailPriceTHB, 0);
    assert.equal(zeroPrice.unitContributionMarginTHB, 0);
    assert.equal(zeroPrice.breakEvenUnits, 0);
    assert.equal(zeroPrice.actualMarginPct, 0);
    for (const val of Object.values(zeroPrice)) {
      assert.ok(Number.isFinite(val), `Expected finite number, got ${val}`);
    }

    // NaN / negative inputs guarded
    const badInputs = calculateUnitEconomics({
      unitFloorCostTHB: Number.NaN,
      desiredGrossMarginPct: Number.POSITIVE_INFINITY,
      fixedStartupCapitalExpenseTHB: -100
    });
    for (const val of Object.values(badInputs)) {
      assert.ok(Number.isFinite(val), `Expected finite number on bad input, got ${val}`);
    }
  });

  // 7. Test simulateMarketStep determinism with injectable RNG
  await runCheck('7. engine.simulateMarketStep is deterministic for a given input and supports an injectable RNG', () => {
    const { simulateMarketStep } = pbl;
    const initialState = {
      cashReserveTHB: 1000,
      unitFloorCostTHB: 50,
      retailPriceTHB: 120,
      unitsProduced: 0,
      unitsSold: 0,
      adoptersReached: 0,
      marketReputationScore: 50
    };

    // Default deterministic step (produce 10, demand 8 -> cost 500, revenue 960, cash 1460)
    const stepA1 = simulateMarketStep(initialState, 10, 8);
    const stepA2 = simulateMarketStep(initialState, 10, 8);
    assert.deepEqual(stepA1, stepA2);
    assert.equal(stepA1.unitsProduced, 10);
    assert.equal(stepA1.unitsSold, 8);
    assert.equal(stepA1.latestCost, 500);
    assert.equal(stepA1.latestRevenue, 960);
    assert.equal(stepA1.cashReserveTHB, 1460);

    // Injectable seeded RNG produces identical sequence across runs
    const makeSeededRng = (seed) => {
      let s = seed;
      return () => {
        s = (s * 1664525 + 1013904223) % 4294967296;
        return s / 4294967296;
      };
    };
    const seededRun1 = simulateMarketStep(initialState, 20, 15, makeSeededRng(42));
    const seededRun2 = simulateMarketStep(initialState, 20, 15, makeSeededRng(42));
    assert.deepEqual(seededRun1, seededRun2);

    // Also test simulateArkBiosphere deterministic 500-colonist ECLSS and crisis survival math
    const { simulateArkBiosphere } = pbl;
    const nominalArk = simulateArkBiosphere({
      colonistCount: 500,
      hydroponicAreaSqM: 1650,
      algaeBioreactorLiters: 3200,
      waterRecoveryEfficiencyPct: 98.5,
      restorativeSpacePct: 22,
      repairDroneBays: 6,
      prototypingCostTHB: 1310
    });
    assert.equal(nominalArk.colonists, 500);
    assert.equal(nominalArk.targetDailyKcal, 1250000);
    assert.equal(nominalArk.dailyKcalProduced, 1375000);
    assert.equal(nominalArk.withinThbBudget, true);
    assert.equal(nominalArk.isSelfSustaining, true);

    const badArk = simulateArkBiosphere({
      hydroponicAreaSqM: Number.NaN,
      algaeBioreactorLiters: Number.POSITIVE_INFINITY,
      waterRecoveryEfficiencyPct: -50,
      restorativeSpacePct: 200,
      repairDroneBays: -2,
      prototypingCostTHB: 2000
    });
    assert.equal(badArk.withinThbBudget, false);
    assert.equal(badArk.isSelfSustaining, false);
  });

  // 8. Test PROGRAM_REGISTRY and PROGRAM_LIST alignment
  await runCheck('8. PROGRAM_REGISTRY keys match program.id and PROGRAM_LIST has identical IDs in order', () => {
    const {
      PROGRAM_REGISTRY,
      PROGRAM_LIST,
      CLEAN_STREAM_PROGRAM,
      ARK_WELEARN_MTC_RUBRIC,
      ARK_GAMIFICATION_BADGES,
      EXOPLANET_CANDIDATES
    } = pbl;
    const registryKeys = Object.keys(PROGRAM_REGISTRY);
    assert.equal(registryKeys.length, 7, 'Expected 7 complete programs in PROGRAM_REGISTRY');
    assert.ok('interstellar-ark-horizon-2026' in PROGRAM_REGISTRY, 'interstellar-ark-horizon-2026 must be registered');
    assert.equal(ARK_WELEARN_MTC_RUBRIC.length, 7, 'Expected all 7 WeLearn Future Skills in MTC rubric');
    assert.equal(ARK_GAMIFICATION_BADGES.length, 7, 'Expected 7 gamification badges for Interstellar Ark');
    assert.equal(EXOPLANET_CANDIDATES.length, 4, 'Expected 4 NASA Exoplanet Archive candidates');

    for (const [key, prog] of Object.entries(PROGRAM_REGISTRY)) {
      assert.equal(prog.id, key, `Registry key ${key} must equal program.id (${prog.id})`);
      assert.notEqual(prog.status, 'stub', `Active registry program ${key} must not have status 'stub'`);
    }

    const listIds = PROGRAM_LIST.map((item) => item.id);
    assert.deepEqual(listIds, registryKeys, 'PROGRAM_LIST IDs must match PROGRAM_REGISTRY keys');

    // CleanStream is explicitly marked as a stub and excluded from PROGRAM_REGISTRY
    assert.equal(CLEAN_STREAM_PROGRAM.status, 'stub');
    assert.equal(CLEAN_STREAM_PROGRAM.phases.length, 0);
    assert.ok(!('cleanstream-stormwater-2026' in PROGRAM_REGISTRY));
  });

  // 9. Test 7 phases in order, non-overlapping weeks within durationWeeks, and session counts == totalSessions
  await runCheck('9. Every program has all 7 phases in order, non-overlapping weeks within durationWeeks (12), and session counts equal totalSessions', () => {
    const { PROGRAM_REGISTRY, PHASES } = pbl;

    for (const prog of Object.values(PROGRAM_REGISTRY)) {
      assert.equal(prog.durationWeeks, 12, `${prog.id}: durationWeeks must be 12 (got ${prog.durationWeeks})`);
      const phaseIds = prog.phases.map((ph) => ph.id);
      assert.deepEqual(phaseIds, [...PHASES], `${prog.id}: phases must be exactly ${PHASES.join(', ')} in order`);

      let prevEndWeek = 0;
      let sessionCount = 0;

      for (const ph of prog.phases) {
        const [startWeek, endWeek] = ph.weeks;
        assert.ok(
          Number.isInteger(startWeek) && Number.isInteger(endWeek) && startWeek >= 1 && endWeek >= startWeek,
          `${prog.id}/${ph.id}: invalid weeks range [${startWeek}, ${endWeek}]`
        );
        assert.ok(
          startWeek > prevEndWeek,
          `${prog.id}/${ph.id}: phase weeks [${startWeek}, ${endWeek}] overlap with previous phase ending week ${prevEndWeek}`
        );
        assert.ok(
          endWeek <= prog.durationWeeks,
          `${prog.id}/${ph.id}: endWeek ${endWeek} exceeds durationWeeks ${prog.durationWeeks}`
        );
        prevEndWeek = endWeek;

        for (const sess of ph.sessions) {
          sessionCount++;
          assert.equal(sess.sessionNumber, sessionCount, `${prog.id}: sessionNumber must be sequential`);
          assert.ok(
            sess.week >= startWeek && sess.week <= endWeek,
            `${prog.id} Session ${sess.sessionNumber}: week ${sess.week} outside phase weeks [${startWeek}, ${endWeek}]`
          );
        }
      }

      assert.equal(
        sessionCount,
        prog.totalSessions,
        `${prog.id}: sum of phase sessions (${sessionCount}) must equal totalSessions (${prog.totalSessions})`
      );
    }
  });

  // 10. Test that every competency ID referenced in any program or fixture exists in CORE_COMPETENCIES
  await runCheck('10. Every competency ID referenced by any program or fixture exists in CORE_COMPETENCIES', () => {
    const { PROGRAM_REGISTRY, CORE_COMPETENCIES, MOCK_COHORT, INITIAL_COACH_FEEDBACK } = pbl;
    const validIds = new Set(CORE_COMPETENCIES.map((c) => c.id));
    assert.equal(validIds.size, 85, 'CORE_COMPETENCIES must contain all 85 school competencies');

    for (const prog of Object.values(PROGRAM_REGISTRY)) {
      for (const ph of prog.phases) {
        for (const cid of ph.competencies) {
          assert.ok(validIds.has(cid), `${prog.id}/${ph.id} references unknown competency '${cid}'`);
        }
        for (const cid of ph.stretchCompetencies) {
          assert.ok(validIds.has(cid), `${prog.id}/${ph.id} stretchCompetencies references unknown competency '${cid}'`);
        }
        for (const sess of ph.sessions) {
          for (const cid of sess.evidenceToCollect.targetCompetencies) {
            assert.ok(validIds.has(cid), `${prog.id} session ${sess.sessionNumber} references unknown competency '${cid}'`);
          }
        }
      }
    }

    for (const proj of MOCK_COHORT) {
      for (const ev of proj.evidence) {
        for (const cid of ev.competencies) {
          assert.ok(validIds.has(cid), `Fixture project ${proj.id} evidence ${ev.id} references unknown competency '${cid}'`);
        }
      }
    }

    for (const [projId, fbList] of Object.entries(INITIAL_COACH_FEEDBACK)) {
      for (const fb of fbList) {
        for (const cid of Object.keys(fb.competencyScores)) {
          assert.ok(validIds.has(cid), `Fixture feedback for ${projId} references unknown competency '${cid}'`);
        }
      }
    }
  });

  // 11. Test JSON serialisability of all programs and fixtures (Firestore document readiness)
  await runCheck('11. Every program and fixture is strictly JSON-serialisable (JSON.parse(JSON.stringify(p)) deep-equals p)', () => {
    const { PROGRAM_REGISTRY, MOCK_COHORT, INITIAL_COACH_FEEDBACK } = pbl;
    for (const prog of Object.values(PROGRAM_REGISTRY)) {
      const roundTrip = JSON.parse(JSON.stringify(prog));
      assert.deepEqual(roundTrip, prog, `Program ${prog.id} failed JSON round-trip equality`);
    }
    for (const proj of MOCK_COHORT) {
      const roundTrip = JSON.parse(JSON.stringify(proj));
      assert.deepEqual(roundTrip, proj, `Fixture project ${proj.id} failed JSON round-trip equality`);
      assert.ok(!('coachFeedback' in proj), `StudentProject ${proj.id} must not embed coachFeedback`);
    }
    assert.deepEqual(JSON.parse(JSON.stringify(INITIAL_COACH_FEEDBACK)), INITIAL_COACH_FEEDBACK);
  });

  // 12. Test structured confirmation records and copilot not_deployed config
  await runCheck('12. Structured confirmation fields and COPILOT_DEPLOYMENT_CONFIG status are honest and valid', () => {
    const {
      SCHOOL_SCHEDULE_CONFIG,
      LEARNER_AGE_CONFIG,
      HARDWARE_INVENTORY_CONFIG,
      COPILOT_DEPLOYMENT_CONFIG,
      PROGRAM_REGISTRY
    } = pbl;

    const assertValidConfirmation = (conf, label) => {
      assert.ok(conf && typeof conf === 'object', `${label}: missing confirmation object`);
      assert.ok(
        conf.status === 'confirmed' || conf.status === 'needs_owner_confirmation',
        `${label}: invalid confirmation status '${conf.status}'`
      );
      if (conf.status === 'confirmed') {
        assert.ok(typeof conf.confirmedBy === 'string' && conf.confirmedBy.trim().length > 0, `${label}: confirmed requires confirmedBy`);
        assert.ok(typeof conf.confirmedOn === 'string' && /^\d{4}-\d{2}-\d{2}/.test(conf.confirmedOn), `${label}: confirmed requires ISO confirmedOn`);
        assert.ok(typeof conf.source === 'string' && conf.source.trim().length > 0, `${label}: confirmed requires source`);
      }
    };

    assertValidConfirmation(SCHOOL_SCHEDULE_CONFIG.confirmation, 'SCHOOL_SCHEDULE_CONFIG');
    assertValidConfirmation(LEARNER_AGE_CONFIG.confirmation, 'LEARNER_AGE_CONFIG');
    assertValidConfirmation(HARDWARE_INVENTORY_CONFIG.confirmation, 'HARDWARE_INVENTORY_CONFIG');
    assertValidConfirmation(COPILOT_DEPLOYMENT_CONFIG.confirmation, 'COPILOT_DEPLOYMENT_CONFIG');
    assert.equal(COPILOT_DEPLOYMENT_CONFIG.status, 'not_deployed');
    assert.equal(COPILOT_DEPLOYMENT_CONFIG.deploymentTimingConfirmed, false);

    for (const prog of Object.values(PROGRAM_REGISTRY)) {
      for (const asmp of prog.assumptions) {
        assertValidConfirmation(asmp.confirmation, `${prog.id}/${asmp.id}`);
        assert.ok(
          !asmp.ownerVerificationNeeded.toUpperCase().includes('CONFIRMED BY DON'),
          `${prog.id}/${asmp.id}: ownerVerificationNeeded must not claim CONFIRMED BY DON`
        );
      }
    }
  });

  // 13. Test store.ts persistence, programId isolation, separate coachFeedback, and resetDemoData
  await runCheck('13. store.ts persists projects per (uid, pbl-<programId>), isolates coach feedback, and resets cleanly', async () => {
    const { createMemoryStore, projectDocId, validateAndAddEvidence } = pbl;
    assert.equal(projectDocId('ecocool-smart-garden-2026'), 'pbl-ecocool-smart-garden-2026');

    const store = createMemoryStore({ seed: true });
    const progA = 'ecocool-smart-garden-2026';
    const progB = 'hex-city-thailand-2026';
    const uid = 'proj-solguard-04';

    const loadedA = await store.loadProject(uid, progA);
    const loadedB = await store.loadProject(uid, progB);
    assert.ok(loadedA && loadedB);
    assert.equal(loadedA.evidence.length, 0);
    assert.equal(loadedB.evidence.length, 0);

    // Add evidence to progA only
    const added = validateAndAddEvidence(loadedA, {
      title: 'Store Persistence Check',
      phase: 'explore',
      kind: 'note',
      body: 'Saved only in EcoCool program.',
      competencies: ['sdl-01']
    });
    assert.ok(added.success && added.updatedProject);
    await store.saveProject(uid, progA, added.updatedProject);

    // Verify progA has the new evidence while progB is untouched
    const reloadedA = await store.loadProject(uid, progA);
    const reloadedB = await store.loadProject(uid, progB);
    assert.equal(reloadedA.evidence.length, 1);
    assert.equal(reloadedB.evidence.length, 0);
    assert.ok(!('coachFeedback' in reloadedA), 'Saved StudentProject must never contain coachFeedback');

    // Add coach feedback separately
    const beforeFb = await store.loadFeedback(uid, progA);
    assert.equal(beforeFb.length, 0);
    await store.addFeedback(uid, progA, {
      coachName: 'Coach Test',
      date: '2026-10-20',
      note: 'Great start on Explore phase.',
      competencyScores: { 'sdl-01': 3 }
    });
    const afterFb = await store.loadFeedback(uid, progA);
    assert.equal(afterFb.length, 1);
    assert.equal(afterFb[0].note, 'Great start on Explore phase.');

    // Reset demo data restores initial state
    await store.resetDemoData();
    const afterResetA = await store.loadProject(uid, progA);
    const afterResetFb = await store.loadFeedback(uid, progA);
    assert.equal(afterResetA.evidence.length, 0);
    assert.equal(afterResetFb.length, 0);
  });

  // Clean up temp bundle directory
  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log(`=== Summary: ${results.length - failedCount}/${results.length} checks passed ===`);
  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unhandled error in checks.mjs:', err);
  process.exit(1);
});
