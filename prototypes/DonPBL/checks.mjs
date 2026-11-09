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

    // Also test simulateKineticHarvesting deterministic rectifier, 50-step capacitor & Honest ROI math
    const { simulateKineticHarvesting } = pbl;
    const schottkyKinetic = simulateKineticHarvesting({
      joulesPerStepRaw: 3.2,
      dailyFootstepsPerTile: 4800,
      tileCount: 16,
      surfaceTempDeltaC: 5,
      diodeType: 'schottky-1n5819',
      capacitorMicrofarads: 1000,
      verticalDeflectionMm: 4.0,
      unitCostUSD: 41,
      deploymentScale: 'pilot-100',
      includeSmartSensorCoBenefit: true
    });
    const siliconKinetic = simulateKineticHarvesting({
      joulesPerStepRaw: 3.2,
      dailyFootstepsPerTile: 4800,
      tileCount: 16,
      surfaceTempDeltaC: 5,
      diodeType: 'silicon-1n4007',
      capacitorMicrofarads: 1000,
      verticalDeflectionMm: 4.0,
      unitCostUSD: 41,
      deploymentScale: 'pilot-100',
      includeSmartSensorCoBenefit: true
    });
    assert.ok(
      schottkyKinetic.netJoulesPerStep > siliconKinetic.netJoulesPerStep,
      '1N5819 Schottky bridge must harvest more net Joules/step than 1N4007 Silicon bridge'
    );
    assert.ok(
      schottkyKinetic.capacitorVoltage50Steps > siliconKinetic.capacitorVoltage50Steps,
      '1N5819 Schottky bridge must reach a higher 50-step 1000uF capacitor voltage than 1N4007 Silicon'
    );
    assert.equal(schottkyKinetic.adaTripFreeSafe, true);
    assert.ok(schottkyKinetic.estimatedPaybackYears < 5);

    const unsafeKinetic = simulateKineticHarvesting({
      joulesPerStepRaw: Number.NaN,
      dailyFootstepsPerTile: Number.POSITIVE_INFINITY,
      tileCount: -5,
      surfaceTempDeltaC: -10,
      diodeType: 'schottky-1n5819',
      capacitorMicrofarads: 1000,
      verticalDeflectionMm: 6.5,
      unitCostUSD: 50,
      deploymentScale: 'prototype-1',
      includeSmartSensorCoBenefit: false
    });
    assert.equal(unsafeKinetic.adaTripFreeSafe, false);
    for (const val of Object.values(unsafeKinetic)) {
      if (typeof val === 'number') {
        assert.ok(Number.isFinite(val), `Expected finite number from simulateKineticHarvesting, got ${val}`);
      }
    }

    // Also test simulateVitalFlowCirculation deterministic closed-loop fluid dynamics & V1.0 vs V2.0 hemodynamic math
    const { simulateVitalFlowCirculation } = pbl;
    const v2Circulation = simulateVitalFlowCirculation({
      strokeVolumeMl: 48,
      pumpCadenceBpm: 72,
      peakSystolicMmHg: 115,
      valveBackflowPreventionPct: 92,
      valveForwardDropMmHg: 6,
      totalNetworkVolumeMl: 420,
      lungStationConnected: true,
      sharp90DegreeBendCount: 2,
      jointSealQualityPct: 95,
      prototypeVersion: 'v2_upgraded'
    });
    const v1Circulation = simulateVitalFlowCirculation({
      strokeVolumeMl: 40,
      pumpCadenceBpm: 60,
      peakSystolicMmHg: 115,
      valveBackflowPreventionPct: 28,
      valveForwardDropMmHg: 2,
      totalNetworkVolumeMl: 420,
      lungStationConnected: true,
      sharp90DegreeBendCount: 12,
      jointSealQualityPct: 55,
      prototypeVersion: 'v1_baseline'
    });
    assert.ok(
      v2Circulation.netForwardFlowMlPerMin > v1Circulation.netForwardFlowMlPerMin,
      'V2.0 with check-valves must deliver higher net forward flow than unvalved V1.0'
    );
    assert.ok(
      v2Circulation.distalToePerfusionMmHg > v1Circulation.distalToePerfusionMmHg,
      'V2.0 with fewer sharp 90-degree bends and reinforced seals must deliver higher distal toe pressure than V1.0'
    );
    assert.equal(v2Circulation.perfusedDigitsCount, 20);
    assert.equal(v2Circulation.aneurysmLeakCount, 0);
    assert.equal(v2Circulation.clinicalVerdict, 'viable_extremity_perfusion');
    assert.equal(v1Circulation.clinicalVerdict, 'critical_hypoperfusion_or_leak');

    const badCirculation = simulateVitalFlowCirculation({
      strokeVolumeMl: Number.NaN,
      pumpCadenceBpm: Number.POSITIVE_INFINITY,
      peakSystolicMmHg: Number.NaN,
      valveBackflowPreventionPct: -50,
      valveForwardDropMmHg: -10,
      totalNetworkVolumeMl: 0,
      lungStationConnected: false,
      sharp90DegreeBendCount: -4,
      jointSealQualityPct: 200,
      prototypeVersion: 'v1_baseline'
    });
    for (const val of Object.values(badCirculation)) {
      if (typeof val === 'number') {
        assert.ok(Number.isFinite(val), `Expected finite number from simulateVitalFlowCirculation, got ${val}`);
      }
    }

    // Also test simulateVoyagerRcSolar deterministic 3D-printed RC Truck Shell & Solar Charging Bay math
    const { simulateVoyagerRcSolar } = pbl;
    const optimalVoyager = simulateVoyagerRcSolar({
      truckLengthMm: 310,
      truckWidthMm: 165,
      shellWallThicknessMm: 2.8,
      wheelArchClearanceMm: 12,
      infillPct: 18,
      wallLoops: 3,
      batteryType: 'li_ion_2s_2000mah',
      solarPanelWatts: 20,
      solarRoofAngleDeg: 22,
      bayExtraClearanceCm: 5,
      totalBudgetTHB: 2400
    });
    const brittleVoyager = simulateVoyagerRcSolar({
      truckLengthMm: 310,
      truckWidthMm: 165,
      shellWallThicknessMm: 1.5,
      wheelArchClearanceMm: 4,
      infillPct: 10,
      wallLoops: 2,
      batteryType: 'lipo_2s_2200mah',
      solarPanelWatts: 10,
      solarRoofAngleDeg: 5,
      bayExtraClearanceCm: 2,
      totalBudgetTHB: 3800
    });
    assert.equal(optimalVoyager.wallThicknessStatus, 'optimal_2.5_to_3mm');
    assert.equal(optimalVoyager.printBedSections, 2);
    assert.equal(optimalVoyager.wheelsRubFree, true);
    assert.equal(optimalVoyager.bayClearanceSafe, true);
    assert.equal(optimalVoyager.angleOptimal, true);
    assert.equal(optimalVoyager.withinThbBudget, true);
    assert.equal(optimalVoyager.designReviewReady, true);
    assert.equal(brittleVoyager.wallThicknessStatus, 'too_thin_cracks');
    assert.equal(brittleVoyager.wheelsRubFree, false);
    assert.equal(brittleVoyager.bayClearanceSafe, false);
    assert.equal(brittleVoyager.angleOptimal, false);
    assert.equal(brittleVoyager.withinThbBudget, false);
    assert.equal(brittleVoyager.designReviewReady, false);

    const badVoyager = simulateVoyagerRcSolar({
      truckLengthMm: Number.NaN,
      truckWidthMm: Number.POSITIVE_INFINITY,
      shellWallThicknessMm: Number.NaN,
      wheelArchClearanceMm: -5,
      infillPct: 200,
      wallLoops: -1,
      batteryType: 'li_ion_2s_2000mah',
      solarPanelWatts: -10,
      solarRoofAngleDeg: 90,
      bayExtraClearanceCm: -3,
      totalBudgetTHB: 5000
    });
    for (const val of Object.values(badVoyager)) {
      if (typeof val === 'number') {
        assert.ok(Number.isFinite(val), `Expected finite number from simulateVoyagerRcSolar, got ${val}`);
      }
    }

    // Also test simulateStreetPawsApp deterministic THB budget, 15-THB bowl & 3-click UX math
    const { simulateStreetPawsApp } = pbl;
    const sustainableStreetPaws = simulateStreetPawsApp({
      neighborhoodAnimalsCount: 10,
      dogFoodBag15KgPriceTHB: 600,
      partnerPetShopDiscountPct: 10,
      vetCheckAndVaccineCostTHB: 500,
      animalsNeedingVaccinePerMonth: 2,
      sosSurgeryGoalTHB: 2000,
      microDonationBowlTHB: 15,
      monthlyMicroDonationCount: 260,
      monthlyPartnerSponsorTHB: 2500,
      clicksToReportSos: 3,
      feedingMapTotalPins: 6,
      feedingMapGreenVerifiedPins: 5,
      qrStationWeatherproofAndWorking: true,
      usabilityTestersCount: 5,
      beforeAfterImprovementsCount: 3
    });
    const deficitStreetPaws = simulateStreetPawsApp({
      neighborhoodAnimalsCount: 25,
      dogFoodBag15KgPriceTHB: 600,
      partnerPetShopDiscountPct: 0,
      vetCheckAndVaccineCostTHB: 500,
      animalsNeedingVaccinePerMonth: 5,
      sosSurgeryGoalTHB: 4000,
      microDonationBowlTHB: 15,
      monthlyMicroDonationCount: 20,
      monthlyPartnerSponsorTHB: 0,
      clicksToReportSos: 6,
      feedingMapTotalPins: 6,
      feedingMapGreenVerifiedPins: 1,
      qrStationWeatherproofAndWorking: false,
      usabilityTestersCount: 2,
      beforeAfterImprovementsCount: 1
    });
    assert.equal(sustainableStreetPaws.bagsNeededPerMonth, 6);
    assert.equal(sustainableStreetPaws.grossMonthlyFoodTHB, 3600);
    assert.equal(sustainableStreetPaws.netMonthlyFoodTHB, 3240);
    assert.equal(sustainableStreetPaws.threeClickRulePassed, true);
    assert.equal(sustainableStreetPaws.usabilityTargetMet, true);
    assert.equal(sustainableStreetPaws.financiallySustainable, true);
    assert.equal(sustainableStreetPaws.showcaseReady, true);
    assert.equal(deficitStreetPaws.threeClickRulePassed, false);
    assert.equal(deficitStreetPaws.usabilityTargetMet, false);
    assert.equal(deficitStreetPaws.financiallySustainable, false);
    assert.equal(deficitStreetPaws.showcaseReady, false);

    const badStreetPaws = simulateStreetPawsApp({
      neighborhoodAnimalsCount: Number.NaN,
      dogFoodBag15KgPriceTHB: Number.POSITIVE_INFINITY,
      partnerPetShopDiscountPct: -20,
      vetCheckAndVaccineCostTHB: Number.NaN,
      animalsNeedingVaccinePerMonth: -5,
      sosSurgeryGoalTHB: -100,
      microDonationBowlTHB: 0,
      monthlyMicroDonationCount: Number.NaN,
      monthlyPartnerSponsorTHB: -500,
      clicksToReportSos: 99,
      feedingMapTotalPins: 0,
      feedingMapGreenVerifiedPins: -2,
      qrStationWeatherproofAndWorking: false,
      usabilityTestersCount: -3,
      beforeAfterImprovementsCount: Number.NaN
    });
    for (const val of Object.values(badStreetPaws)) {
      if (typeof val === 'number') {
        assert.ok(Number.isFinite(val), `Expected finite number from simulateStreetPawsApp, got ${val}`);
      }
    }
  });

  // 8. Test PROGRAM_REGISTRY and PROGRAM_LIST alignment
  await runCheck('8. PROGRAM_REGISTRY keys match program.id and PROGRAM_LIST has identical IDs in order', () => {
    const {
      PROGRAM_REGISTRY,
      PROGRAM_LIST,
      CLEAN_STREAM_PROGRAM,
      ARK_CRISIS_SCENARIOS,
      ARK_WELEARN_MTC_RUBRIC,
      ARK_GAMIFICATION_BADGES,
      EXOPLANET_CANDIDATES,
      KINETIC_TRANSDUCER_OPTIONS,
      KINETIC_SITE_BOTTLENECKS,
      KINETIC_DELIVERABLES,
      KINETIC_WELEARN_SKILLS_TABLE,
      KINETIC_GAMIFICATION_BADGES,
      VITAL_FLOW_PUMP_OPTIONS,
      VITAL_FLOW_VALVE_OPTIONS,
      VITAL_FLOW_VASCULAR_PATHWAYS,
      VITAL_FLOW_DELIVERABLES,
      VITAL_FLOW_WELEARN_SKILLS_TABLE,
      VITAL_FLOW_GAMIFICATION_BADGES,
      VOYAGER_TEAM_ROLES,
      VOYAGER_12_WEEK_SCHEDULE,
      VOYAGER_ACTIVITY_GUIDES,
      VOYAGER_WELEARN_MTC_RUBRIC,
      VOYAGER_MTC_REFLECTION_QUESTIONS,
      VOYAGER_GAMIFICATION_BADGES,
      STREETPAWS_CORE_FEATURES,
      STREETPAWS_MTC_COMPETENCIES,
      STREETPAWS_DAILY_ESL_ROUTINE,
      STREETPAWS_12_WEEK_CURRICULUM,
      STREETPAWS_PITCH_SLIDES,
      STREETPAWS_ESL_PITCH_SCRIPT,
      STREETPAWS_ASSESSMENT_RUBRIC,
      STREETPAWS_GAMIFICATION_BADGES,
      BIOMIMETIC_TRACKS,
      BIOMECHANICS_60_DAY_SCHEDULE,
      BIOMECHANICS_OLDER_STUDENT_PILLARS,
      BIOMECHANICS_GAMIFICATION_BADGES,
      ENTREPRENEURSHIP_PDF_ACTIVITIES,
      ENTREPRENEURSHIP_BADGES,
      ENTREPRENEURSHIP_LEVELS,
      ENTREPRENEURSHIP_SIMULATION_PRESETS,
      GENESIS_DELIVERABLES,
      GENESIS_12_WEEK_ROADMAP,
      GENESIS_SUCCESS_CHECKLIST,
      GENESIS_GAMIFICATION_BADGES
    } = pbl;
    const registryKeys = Object.keys(PROGRAM_REGISTRY);
    assert.equal(registryKeys.length, 11, 'Expected 11 complete programs in PROGRAM_REGISTRY');
    assert.ok('streetpaws-animal-rescue-2026' in PROGRAM_REGISTRY, 'streetpaws-animal-rescue-2026 must be registered');
    assert.equal(
      PROGRAM_REGISTRY['streetpaws-animal-rescue-2026'].title,
      'StreetPaws — The Community Animal Rescue App',
      'Expected StreetPaws — The Community Animal Rescue App title'
    );
    assert.equal(STREETPAWS_CORE_FEATURES.length, 4, 'Expected 4 Core App Features for StreetPaws');
    assert.equal(STREETPAWS_MTC_COMPETENCIES.length, 6, 'Expected 6 Selected WeLearn MTC Competencies for StreetPaws');
    assert.equal(STREETPAWS_DAILY_ESL_ROUTINE.length, 4, 'Expected 4 blocks in STREETPAWS_DAILY_ESL_ROUTINE');
    assert.equal(STREETPAWS_12_WEEK_CURRICULUM.length, 12, 'Expected 12 weeks in STREETPAWS_12_WEEK_CURRICULUM');
    assert.equal(STREETPAWS_PITCH_SLIDES.length, 8, 'Expected 8 slides in STREETPAWS_PITCH_SLIDES');
    assert.equal(STREETPAWS_ESL_PITCH_SCRIPT.length, 4, 'Expected 4 speakers in STREETPAWS_ESL_PITCH_SCRIPT');
    assert.equal(STREETPAWS_ASSESSMENT_RUBRIC.length, 6, 'Expected 6 rows in STREETPAWS_ASSESSMENT_RUBRIC');
    assert.equal(STREETPAWS_GAMIFICATION_BADGES.length, 7, 'Expected 7 gamification badges for StreetPaws');

    assert.ok('project-voyager-rc-solar-2026' in PROGRAM_REGISTRY, 'project-voyager-rc-solar-2026 must be registered');
    assert.equal(
      PROGRAM_REGISTRY['project-voyager-rc-solar-2026'].title,
      'Project Voyager: 3D-Printed RC Truck & Solar Charging Bay',
      'Expected Project Voyager: 3D-Printed RC Truck & Solar Charging Bay title'
    );
    assert.equal(VOYAGER_TEAM_ROLES.length, 5, 'Expected 5 ESL-Friendly Team Roles for Project Voyager');
    assert.equal(VOYAGER_12_WEEK_SCHEDULE.length, 12, 'Expected 12 weeks in VOYAGER_12_WEEK_SCHEDULE');
    assert.equal(VOYAGER_ACTIVITY_GUIDES.length, 7, 'Expected 7 activity guides (Guide A 1–4 + Guide B 1–3) in VOYAGER_ACTIVITY_GUIDES');
    assert.equal(VOYAGER_WELEARN_MTC_RUBRIC.length, 7, 'Expected 7 WeLearn/MTC competencies in VOYAGER_WELEARN_MTC_RUBRIC');
    assert.equal(VOYAGER_MTC_REFLECTION_QUESTIONS.length, 12, 'Expected 12 Final MTC Portfolio Reflection Questions');
    assert.equal(VOYAGER_GAMIFICATION_BADGES.length, 7, 'Expected 7 gamification badges for Project Voyager');

    assert.ok('storytelling-genesis-2026' in PROGRAM_REGISTRY, 'storytelling-genesis-2026 must be registered');
    assert.equal(
      PROGRAM_REGISTRY['storytelling-genesis-2026'].title,
      'Project "Genesis Engine": Build Your Own Movie Universe!',
      'Expected Project "Genesis Engine": Build Your Own Movie Universe! title'
    );
    assert.equal(GENESIS_DELIVERABLES.length, 3, 'Expected 3 Final Deliverables for Project Genesis Engine');
    assert.equal(GENESIS_12_WEEK_ROADMAP.length, 12, 'Expected 12 weeks in GENESIS_12_WEEK_ROADMAP');
    assert.equal(GENESIS_SUCCESS_CHECKLIST.length, 4, 'Expected 4 scoring criteria in GENESIS_SUCCESS_CHECKLIST');
    assert.equal(GENESIS_GAMIFICATION_BADGES.length, 7, 'Expected 7 gamification badges for Project Genesis Engine');

    assert.ok('entrepreneurship-product-creation-2026' in PROGRAM_REGISTRY, 'entrepreneurship-product-creation-2026 must be registered');
    assert.equal(
      PROGRAM_REGISTRY['entrepreneurship-product-creation-2026'].title,
      'Entrepreneurship: Creating a Product',
      'Expected Entrepreneurship: Creating a Product title'
    );
    assert.equal(ENTREPRENEURSHIP_PDF_ACTIVITIES.length, 11, 'Expected all 11 activities across Phases 1–5 from Entrepreneurship: Creating a Product PDF');
    assert.equal(ENTREPRENEURSHIP_BADGES.length, 7, 'Expected 7 gamification badges for Entrepreneurship: Creating a Product');
    assert.equal(ENTREPRENEURSHIP_LEVELS.length, 7, 'Expected 7 gamification levels for Entrepreneurship: Creating a Product');
    assert.equal(ENTREPRENEURSHIP_SIMULATION_PRESETS.length, 4, 'Expected 4 simulation presets for Entrepreneurship: Creating a Product');

    assert.ok('biomechanics-robotics-2026' in PROGRAM_REGISTRY, 'biomechanics-robotics-2026 must be registered');
    assert.equal(BIOMIMETIC_TRACKS.length, 3, 'Expected 3 Day-26 Biomimetic Engineering Projects');
    assert.equal(BIOMECHANICS_60_DAY_SCHEDULE.length, 12, 'Expected 12 weeks in BIOMECHANICS_60_DAY_SCHEDULE');
    const totalBiomechDays = BIOMECHANICS_60_DAY_SCHEDULE.reduce((acc, w) => acc + w.days.length, 0);
    assert.equal(totalBiomechDays, 60, 'Expected 60 daily studio activities (Days 1–60) in BIOMECHANICS_60_DAY_SCHEDULE');
    assert.equal(BIOMECHANICS_OLDER_STUDENT_PILLARS.length, 4, 'Expected 4 Older-Student Special Pillars');
    assert.equal(BIOMECHANICS_GAMIFICATION_BADGES.length, 7, 'Expected 7 gamification badges for Biomechanics');

    assert.ok('project-vital-flow-2026' in PROGRAM_REGISTRY, 'project-vital-flow-2026 must be registered');
    assert.equal(
      PROGRAM_REGISTRY['project-vital-flow-2026'].title,
      'Project Vital Flow: Biomedical Engineering & Closed-Loop Fluid Dynamics',
      'Expected Project Vital Flow title'
    );
    assert.equal(VITAL_FLOW_PUMP_OPTIONS.length, 4, 'Expected 4 manual pump options for Project Vital Flow');
    assert.equal(VITAL_FLOW_VALVE_OPTIONS.length, 4, 'Expected 4 valve options for Project Vital Flow');
    assert.equal(VITAL_FLOW_VASCULAR_PATHWAYS.length, 5, 'Expected 5 anatomical vascular pathways for Project Vital Flow');
    assert.equal(VITAL_FLOW_DELIVERABLES.length, 3, 'Expected 3 core deliverables for Project Vital Flow');
    assert.equal(VITAL_FLOW_WELEARN_SKILLS_TABLE.length, 7, 'Expected 7 WeLearn Future Skills for Project Vital Flow');
    assert.equal(VITAL_FLOW_GAMIFICATION_BADGES.length, 7, 'Expected 7 gamification badges for Project Vital Flow');

    assert.ok('kinetic-smart-energy-2026' in PROGRAM_REGISTRY, 'kinetic-smart-energy-2026 must be registered');
    assert.equal(
      PROGRAM_REGISTRY['kinetic-smart-energy-2026'].title,
      'Smart Cities & Adaptive Infrastructure: Kinetic and Smart Energy Harvesting',
      'Expected Kinetic and Smart Energy Harvesting title'
    );
    assert.equal(KINETIC_TRANSDUCER_OPTIONS.length, 4, 'Expected 4 kinetic/thermal transducer options');
    assert.equal(KINETIC_SITE_BOTTLENECKS.length, 3, 'Expected 3 site bottleneck options');
    assert.equal(KINETIC_DELIVERABLES.length, 3, 'Expected 3 core deliverables for Kinetic Energy');
    assert.equal(KINETIC_WELEARN_SKILLS_TABLE.length, 7, 'Expected 7 WeLearn Future Skills for Kinetic Energy');
    assert.equal(KINETIC_GAMIFICATION_BADGES.length, 7, 'Expected 7 gamification badges for Kinetic Energy');

    assert.ok('interstellar-ark-horizon-2026' in PROGRAM_REGISTRY, 'interstellar-ark-horizon-2026 must be registered');
    assert.equal(
      PROGRAM_REGISTRY['interstellar-ark-horizon-2026'].title,
      'Project Exodus: Building Our New Home in Space',
      'Expected Project Exodus title'
    );
    assert.equal(ARK_CRISIS_SCENARIOS.length, 6, 'Expected all 6 Space Emergency Game Cards');
    assert.equal(ARK_WELEARN_MTC_RUBRIC.length, 7, 'Expected all 7 WeLearn Future Skills in rubric');
    assert.equal(ARK_GAMIFICATION_BADGES.length, 7, 'Expected 7 gamification badges for Project Exodus');
    assert.equal(EXOPLANET_CANDIDATES.length, 4, 'Expected 4 Goldilocks Exoplanet candidates');

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
