/**
 * Don's PBL Prototype Pure Engine
 * Location: prototypes/DonPBL/engine.ts
 * 
 * Reusable, framework-agnostic pure logic functions modeled after
 * WeLearn Playground's `src/features/pbl/engine/pblProject.js`.
 * 
 * Tested without React or Firebase dependencies.
 */

import { CORE_COMPETENCIES } from './mockFixtures';
import type { StudentProject, EvidenceItem } from './mockFixtures';
import { SAMPLE_PROGRAM } from './programData';
import type { PblProgram } from './programData';

export const LIMITS = {
  evidence: 150,
  title: 120,
  body: 3000,
  code: 6000,
  link: 500,
  field: 600,
  sparks: 1500
};

export const PHASES = ['explore', 'empathise', 'define', 'ideate', 'prototype', 'test', 'share'] as const;
export type PhaseId = typeof PHASES[number];

export const KINDS = ['note', 'media', 'code', 'data', 'feedback', 'ai', 'reflection'] as const;
export type EvidenceKind = typeof KINDS[number];

/**
 * Sanitizes URLs to prevent javascript:, data:, vbscript:, or protocol-relative XSS attacks
 * and enforces LIMITS.link length cap.
 */
export function safeLink(value?: string): string {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > LIMITS.link) return '';
  if (trimmed.startsWith('//')) return '';
  try {
    const u = new URL(trimmed);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
    return u.href.length <= LIMITS.link ? u.href : '';
  } catch {
    return '';
  }
}

/**
 * Calculates phase progress
 */
export function getPhaseProgress(project: StudentProject, phaseId: string, program: PblProgram = SAMPLE_PROGRAM) {
  const phaseDef = program.phases.find(p => p.id === phaseId);
  const totalTasks = phaseDef?.tasks.length || 4;
  const completedTasks = project.tasksDone[phaseId] || [];
  const evidenceInPhase = project.evidence.filter(e => e.phase === phaseId);

  const taskPct = Math.min(100, Math.round((completedTasks.length / totalTasks) * 60));
  const evidencePct = evidenceInPhase.length > 0 ? 40 : 0;
  const totalPct = Math.min(100, taskPct + evidencePct);

  return {
    phaseId,
    totalTasks,
    doneTasks: completedTasks.length,
    isTasksComplete: completedTasks.length >= totalTasks,
    evidenceCount: evidenceInPhase.length,
    percentage: totalPct,
    isPhaseReady: completedTasks.length >= totalTasks && evidenceInPhase.length >= 1
  };
}

/**
 * Computes competency coverage across all logged evidence
 */
export function getCompetencyCoverage(project: StudentProject): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const e of project.evidence) {
    for (const cid of e.competencies) {
      counts[cid] = (counts[cid] || 0) + 1;
    }
  }
  return counts;
}

export interface ReadinessCheck {
  id: string;
  label: string;
  description: string;
  ok: boolean;
  requiredPhase?: string;
}

export interface ReadinessResult {
  score: number;
  total: number;
  percent: number;
  isReady: boolean;
  checks: ReadinessCheck[];
}

/**
 * Validates showcase qualification readiness (8 strict checks)
 */
export function evaluateReadiness(project: StudentProject): ReadinessResult {
  const p = project.problem || { hmw: '', criteria: '', impactMeasure: '' };
  const hasCode = project.evidence.some(e => e.kind === 'code');
  const hasAi = project.evidence.some(e => e.kind === 'ai' && Boolean(e.ai?.asked?.trim()) && Boolean(e.ai?.kept?.trim()));
  const hasData = project.evidence.some(e => e.kind === 'data');
  const hasFeedback = project.evidence.some(e => e.kind === 'feedback');

  // Check evidence in all phases
  const coveredPhases = new Set(project.evidence.map(e => e.phase));
  const allPhasesHaveEvidence = PHASES.every(ph => coveredPhases.has(ph));

  const checks: ReadinessCheck[] = [
    {
      id: 'hmw',
      label: 'Driving Problem Defined (HMW)',
      description: 'Clearly stated "How Might We" problem targeting user and need.',
      ok: Boolean(p.hmw && p.hmw.trim().length >= 15),
      requiredPhase: 'define'
    },
    {
      id: 'impact',
      label: 'Measurable Impact & Criteria Specified',
      description: 'Named who or what benefits (People, Environment, or Both) and how it is measured.',
      ok: Boolean(project.impact && p.impactMeasure && p.impactMeasure.trim().length >= 10),
      requiredPhase: 'define'
    },
    {
      id: 'phases',
      label: 'Evidence Across All 7 Phases',
      description: 'At least one artifact logged in Explore, Empathise, Define, Ideate, Prototype, Test, and Share.',
      ok: allPhasesHaveEvidence
    },
    {
      id: 'code',
      label: 'Physical Computing Code Logged',
      description: 'Working code snippet (MicroPython or MakeCode) saved to portfolio.',
      ok: hasCode,
      requiredPhase: 'prototype'
    },
    {
      id: 'ai-provenance',
      label: 'AI Co-Pilot Provenance Logged',
      description: 'Must record "what was asked", "what was given", and "what was kept/changed".',
      ok: hasAi,
      requiredPhase: 'ideate'
    },
    {
      id: 'data-table',
      label: 'Empirical Multi-Trial Data Logged',
      description: 'Quantitative test trial results proving system behavior with numbers.',
      ok: hasData,
      requiredPhase: 'test'
    },
    {
      id: 'user-feedback',
      label: 'Stakeholder Feedback Captured',
      description: 'Authentic user observations or quotes recorded during testing.',
      ok: hasFeedback,
      requiredPhase: 'test'
    },
    {
      id: 'final-format',
      label: 'Showcase Format Selected',
      description: 'Team has committed to either an Interactive Expo Booth or Formal Presentation.',
      ok: Boolean(project.finalFormat),
      requiredPhase: 'share'
    }
  ];

  const score = checks.filter(c => c.ok).length;
  const total = checks.length;
  const percent = Math.round((score / total) * 100);

  return {
    score,
    total,
    percent,
    isReady: score === total,
    checks
  };
}

/**
 * Adds an evidence item with validation without mutating the input project
 */
export function validateAndAddEvidence(
  project: StudentProject,
  evidenceInput: Partial<EvidenceItem>,
  now: number = Date.now()
): { success: boolean; error?: string; updatedProject?: StudentProject } {
  if (!evidenceInput.title || evidenceInput.title.trim().length === 0) {
    return { success: false, error: 'Evidence title is required.' };
  }

  const phaseCandidate = evidenceInput.phase === undefined ? 'explore' : evidenceInput.phase;
  if (!PHASES.includes(phaseCandidate as PhaseId)) {
    return { success: false, error: `Invalid phase "${String(phaseCandidate)}". Must be one of: ${PHASES.join(', ')}.` };
  }

  const kindCandidate = evidenceInput.kind === undefined ? 'note' : evidenceInput.kind;
  if (!KINDS.includes(kindCandidate as EvidenceKind)) {
    return { success: false, error: `Invalid evidence kind "${String(kindCandidate)}".` };
  }

  if (evidenceInput.link !== undefined && evidenceInput.link !== '') {
    const safe = safeLink(evidenceInput.link);
    if (!safe) {
      return { success: false, error: 'Invalid link. Only http:// or https:// URLs within length limits are permitted.' };
    }
  }

  if (kindCandidate === 'ai') {
    if (!evidenceInput.ai?.asked?.trim()) {
      return { success: false, error: 'AI log requires recording what was asked (the prompt).' };
    }
    if (!evidenceInput.ai?.kept?.trim()) {
      return { success: false, error: 'AI log requires recording what decisions were kept, changed, or rejected.' };
    }
  }

  const validCompetencies = (evidenceInput.competencies || []).filter(cid =>
    CORE_COMPETENCIES.some(c => c.id === cid)
  );

  const newId = evidenceInput.id || `ev-${now.toString(36)}-${(project.evidence.length + 1).toString(36)}`;
  const cleanItem: EvidenceItem = {
    id: newId,
    phase: phaseCandidate as PhaseId,
    kind: kindCandidate as EvidenceKind,
    title: evidenceInput.title.slice(0, LIMITS.title).trim(),
    body: (evidenceInput.body || '').slice(0, kindCandidate === 'code' ? LIMITS.code : LIMITS.body),
    link: evidenceInput.link ? safeLink(evidenceInput.link) : undefined,
    competencies: [...validCompetencies.slice(0, 8)],
    createdAt: now,
    ai: kindCandidate === 'ai' && evidenceInput.ai
      ? {
          asked: evidenceInput.ai.asked.trim().slice(0, LIMITS.field),
          gave: (evidenceInput.ai.gave || '').slice(0, LIMITS.body),
          kept: evidenceInput.ai.kept.trim().slice(0, LIMITS.field)
        }
      : undefined,
    metrics: evidenceInput.metrics ? evidenceInput.metrics.map(m => ({ ...m })) : undefined
  };

  const updatedEvidence = [cleanItem, ...project.evidence];
  return {
    success: true,
    updatedProject: {
      ...project,
      problem: { ...project.problem },
      tasksDone: { ...project.tasksDone },
      sensorState: { ...project.sensorState },
      evidence: updatedEvidence
    }
  };
}

/**
 * Mock AI Co-Pilot response generator complying with BACKEND-PBL-COPILOT-PROMPT-FOR-GEMINI.md
 * Generates:
 * 1. Commented working code for requested micro:bit classroom kit
 * 2. "How to test it on the real device" (2-4 concrete hardware steps)
 * 3. "Explain-It-Back Challenge Question" to verify student comprehension
 */
export function generateMockCopilotReply(
  prompt: string,
  phase: string,
  language: string = 'micropython'
): { reply: string; sampleCode?: string } {
  const p = prompt.toLowerCase();

  if (p.includes('code') || p.includes('servo') || p.includes('pump') || p.includes('sensor') || p.includes('loop')) {
    const sampleCode = language === 'micropython'
      ? `# MicroPython for BBC micro:bit V2
from microbit import *

# Moisture threshold (ADC 0-1023): Higher = drier in capacitive sensors
MOISTURE_DRY = 640
TEMP_HEAT_LIMIT = 32

while True:
    # 1. Read analog soil moisture on Pin 0
    moisture = pin0.read_analog()
    # 2. Read ambient temperature from internal sensor
    temp = temperature()
    
    # 3. Deploy shade canopy (Pin 1 servo) if heat wave detected
    if temp >= TEMP_HEAT_LIMIT:
        pin1.write_analog(180)  # Open canopy (90 deg)
        sleep(400)
        pin1.write_digital(0)   # Detach servo PWM to prevent jitter
    else:
        pin1.write_analog(75)   # Retract canopy (0 deg)
        sleep(400)
        pin1.write_digital(0)
        
    # 4. Pulse 5V drip pump (Pin 2 relay) if soil is dry
    if moisture > MOISTURE_DRY:
        display.show(Image.SAD)
        pin2.write_digital(1)   # Activate pump for 3 seconds
        sleep(3000)
        pin2.write_digital(0)   # Shut off and wait for water to soak
    else:
        display.show(Image.HAPPY)
        
    sleep(10000)  # Check every 10 seconds`
      : `// MakeCode JavaScript for BBC micro:bit V2
let moisture = 0
let temp = 0
basic.forever(function () {
    moisture = pins.analogReadPin(AnalogPin.P0)
    temp = input.temperature()
    if (temp >= 32) {
        pins.servoWritePin(AnalogPin.P1, 90)
    } else {
        pins.servoWritePin(AnalogPin.P1, 0)
    }
    if (moisture > 640) {
        basic.showIcon(IconNames.Sad)
        pins.digitalWritePin(DigitalPin.P2, 1)
        basic.pause(3000)
        pins.digitalWritePin(DigitalPin.P2, 0)
    } else {
        basic.showIcon(IconNames.Happy)
    }
    basic.pause(10000)
})`;

    return {
      sampleCode,
      reply: `Here is a structured **${language === 'micropython' ? 'MicroPython' : 'MakeCode JavaScript'}** control loop tailored for your **${phase.toUpperCase()}** phase. Notice how every step is commented and includes a servo sleep detach so your battery doesn't drain!

\`\`\`python
${sampleCode}
\`\`\`

---

### How to Test It on Your Real Device:
1. **Dry Air Calibration**: Flash the code to your micro:bit V2 and leave the capacitive soil probe in dry air. Check that the LED matrix shows a **Sad Face** and triggers Pin 2 for 3 seconds.
2. **Damp Soil Cutoff**: Dip the probe tip into a cup of damp soil. Verify the display switches to a **Happy Face** and the pump relay stays off.
3. **Thermal Canopy Trigger**: Gently warm the back of the micro:bit processor with your thumb until \`temperature() >= 32\`. Confirm the SG90 servo swings to 90° and then stops buzzing.

---

### Explain-It-Back Challenge (Required for your AI Log):
> Why did we include \`sleep(10000)\` after turning off the water pump instead of checking the moisture sensor again immediately every millisecond?`
    };
  }

  if (p.includes('reflect') || p.includes('essay') || p.includes('write my reflection')) {
    return {
      reply: `### Pedagogical Guardrail: Reflection Must Be Yours!
I cannot write your project reflection or personal learning summary for you—that belongs to your own voice and growth!

However, I can give you **3 Socratic questions** to help you write it yourself:
1. What was the most frustrating hardware or coding bug your team hit this week, and how did you figure out the root cause?
2. Which teammate helped you see the problem from a different angle?
3. If you had one more week in the **${phase.toUpperCase()}** phase, what single part of your prototype would you redesign first?`
    };
  }

  return {
    reply: `### Project Co-Pilot Guidance (${phase.toUpperCase()} Phase)

Here is how you can break down this problem systematically:

1. **Physical Principle**: In hot weather, surface soil evaporation accounts for over 45% of lost water. Shading the canopy reduces ambient leaf transpiration, which allows the roots to absorb moisture more efficiently.
2. **Sensor Calibration Rule**: Never trust raw sensor numbers without benchmarking! Always measure:
   - Bone-dry soil reading (air)
   - Saturated mud reading (water cup)
   - Healthy damp root-zone reading
3. **Engineering Trade-off**: High pump pressure causes soil splashing and channel erosion; low-pressure pulsed drip allows capillary absorption through the root zone.

---

### Recommended Next Step:
Draft your 3 test criteria in the **Define** tab, or ask me for a code loop once your circuit pin connections are mapped out!

### Explain-It-Back Challenge:
> How will your team prove that your automated system saved water compared to just using a regular hose every morning?`
  };
}

/**
 * Calculates market unit economics and break-even sales volume in Thai Baht.
 * Guarantees finite numbers (never NaN or Infinity) even for zero units or zero price.
 */
export function calculateUnitEconomics(params: {
  unitFloorCostTHB: number;
  desiredGrossMarginPct: number;
  fixedStartupCapitalExpenseTHB: number;
  retailPriceOverrideTHB?: number;
}) {
  const safeCost = Number.isFinite(params.unitFloorCostTHB) && params.unitFloorCostTHB >= 0
    ? params.unitFloorCostTHB
    : 0;
  const safeFixed = Number.isFinite(params.fixedStartupCapitalExpenseTHB) && params.fixedStartupCapitalExpenseTHB >= 0
    ? params.fixedStartupCapitalExpenseTHB
    : 0;
  const rawMarginPct = Number.isFinite(params.desiredGrossMarginPct)
    ? params.desiredGrossMarginPct
    : 0;
  const clampedMarginPct = Math.min(95, Math.max(0, rawMarginPct));
  const marginDecimal = clampedMarginPct / 100;

  let retailPriceTHB: number;
  if (params.retailPriceOverrideTHB !== undefined && Number.isFinite(params.retailPriceOverrideTHB)) {
    retailPriceTHB = Math.max(0, Math.round(params.retailPriceOverrideTHB * 100) / 100);
  } else if (safeCost === 0 || marginDecimal >= 1) {
    retailPriceTHB = 0;
  } else {
    retailPriceTHB = Math.round((safeCost / (1 - marginDecimal)) * 100) / 100;
  }

  const unitContributionMarginTHB = Math.max(0, Math.round((retailPriceTHB - safeCost) * 100) / 100);
  const actualMarginPct = retailPriceTHB > 0
    ? Math.round((unitContributionMarginTHB / retailPriceTHB) * 1000) / 10
    : 0;
  const breakEvenUnits = unitContributionMarginTHB > 0 && safeFixed > 0
    ? Math.ceil(safeFixed / unitContributionMarginTHB)
    : 0;

  return {
    unitFloorCostTHB: safeCost,
    desiredGrossMarginPct: clampedMarginPct,
    actualMarginPct,
    retailPriceTHB,
    unitContributionMarginTHB,
    fixedStartupCapitalExpenseTHB: safeFixed,
    breakEvenUnits
  };
}

/**
 * Runs a deterministic step in the market simulation sandbox.
 * Supports an optional injectable random source `rng` (defaults to deterministic 0.5).
 */
export function simulateMarketStep(
  currentState: {
    cashReserveTHB: number;
    unitFloorCostTHB: number;
    retailPriceTHB: number;
    unitsProduced: number;
    unitsSold: number;
    adoptersReached: number;
    marketReputationScore: number;
  },
  unitsToProduce: number,
  unitsDemand: number,
  rng: () => number = () => 0.5
) {
  const safeProduce = Number.isFinite(unitsToProduce) ? Math.max(0, Math.floor(unitsToProduce)) : 0;
  const safeDemand = Number.isFinite(unitsDemand) ? Math.max(0, Math.floor(unitsDemand)) : 0;
  const safeCost = Number.isFinite(currentState.unitFloorCostTHB) ? Math.max(0, currentState.unitFloorCostTHB) : 0;
  const safePrice = Number.isFinite(currentState.retailPriceTHB) ? Math.max(0, currentState.retailPriceTHB) : 0;

  // Optional deterministic jitter when custom rng is injected: scales demand by [0.9..1.1] if rng() !== 0.5
  const sample = Number.isFinite(rng()) ? Math.min(1, Math.max(0, rng())) : 0.5;
  const demandWithJitter = sample === 0.5
    ? safeDemand
    : Math.max(0, Math.round(safeDemand * (0.9 + sample * 0.2)));

  const productionCost = Math.round(safeProduce * safeCost * 100) / 100;
  const availableInventory = Math.max(0, currentState.unitsProduced + safeProduce - currentState.unitsSold);
  const actualSold = Math.min(demandWithJitter, availableInventory);
  const revenue = Math.round(actualSold * safePrice * 100) / 100;

  const updatedProduced = currentState.unitsProduced + safeProduce;
  const updatedSold = currentState.unitsSold + actualSold;
  const updatedCash = Math.round((currentState.cashReserveTHB - productionCost + revenue) * 100) / 100;
  const updatedAdopters = currentState.adoptersReached + actualSold;

  const reputationBoost = actualSold > 0 ? Math.min(5, Math.floor(actualSold / 2)) : -2;
  const updatedReputation = Math.min(100, Math.max(0, currentState.marketReputationScore + reputationBoost));

  return {
    cashReserveTHB: updatedCash,
    unitsProduced: updatedProduced,
    unitsSold: updatedSold,
    adoptersReached: updatedAdopters,
    marketReputationScore: updatedReputation,
    latestRevenue: revenue,
    latestCost: productionCost
  };
}

/**
 * Pure deterministic calculator for the Interstellar Ark 500-Colonist Closed-Loop Biosphere (ECLSS),
 * 1,500 THB classroom prototyping budget, and Red-Team stochastic crisis survival margins.
 * Guarded against NaN and Infinity.
 */
export function simulateArkBiosphere(params: {
  colonistCount?: number;
  hydroponicAreaSqM: number;
  algaeBioreactorLiters: number;
  waterRecoveryEfficiencyPct: number;
  restorativeSpacePct: number;
  repairDroneBays: number;
  prototypingCostTHB: number;
  caloricShockPct?: number;
  waterShockPct?: number;
  moraleShockPts?: number;
}) {
  const colonists = Number.isFinite(params.colonistCount) && (params.colonistCount || 0) > 0
    ? Math.floor(params.colonistCount!)
    : 500;
  const hydroArea = Number.isFinite(params.hydroponicAreaSqM) ? Math.max(0, params.hydroponicAreaSqM) : 0;
  const algaeLiters = Number.isFinite(params.algaeBioreactorLiters) ? Math.max(0, params.algaeBioreactorLiters) : 0;
  const waterRecPct = Number.isFinite(params.waterRecoveryEfficiencyPct)
    ? Math.min(100, Math.max(0, params.waterRecoveryEfficiencyPct))
    : 0;
  const restorativePct = Number.isFinite(params.restorativeSpacePct)
    ? Math.min(50, Math.max(0, params.restorativeSpacePct))
    : 0;
  const droneBays = Number.isFinite(params.repairDroneBays) ? Math.max(0, Math.floor(params.repairDroneBays)) : 0;
  const protoTHB = Number.isFinite(params.prototypingCostTHB) ? Math.max(0, Math.round(params.prototypingCostTHB)) : 0;

  const calShock = Number.isFinite(params.caloricShockPct)
    ? Math.min(95, Math.max(0, params.caloricShockPct!))
    : 0;
  const waterShock = Number.isFinite(params.waterShockPct)
    ? Math.min(95, Math.max(0, params.waterShockPct!))
    : 0;
  const moraleShock = Number.isFinite(params.moraleShockPts)
    ? Math.max(0, params.moraleShockPts!)
    : 0;

  // Target: 2,500 kcal/colonist/day -> 1,250,000 kcal/day for 500 colonists
  const targetDailyKcal = colonists * 2500;
  // Hydroponics yields ~620 kcal/m2/day; Spirulina bioreactors yield ~110 kcal/L/day (immune to root-rot blight)
  const effectiveHydroKcal = Math.round(hydroArea * 620 * (1 - calShock / 100));
  const algaeKcal = Math.round(algaeLiters * 110);
  const dailyKcalProduced = effectiveHydroKcal + algaeKcal;
  const caloricSufficiencyPct = targetDailyKcal > 0
    ? Math.min(150, Math.round((dailyKcalProduced / targetDailyKcal) * 1000) / 10)
    : 0;

  // Oxygen loop: hydro + algae O2 generation vs colonist demand
  const o2TargetUnits = colonists;
  const o2GeneratedUnits = hydroArea * 0.24 + algaeLiters * 0.065;
  const oxygenSufficiencyPct = o2TargetUnits > 0
    ? Math.min(150, Math.round((o2GeneratedUnits / o2TargetUnits) * 1000) / 10)
    : 0;

  // Water loop net efficiency after crisis shock + drone repair recovery (+1.5% per drone bay under shock)
  const droneRecoveryBoost = waterShock > 0 ? Math.min(waterShock, droneBays * 2.5) : 0;
  const netWaterLoopPct = Math.min(100, Math.max(0, Math.round((waterRecPct - waterShock + droneRecoveryBoost) * 10) / 10));

  // Crew psychological morale (0..100)
  const baseMorale = 52 + restorativePct * 1.6 + (caloricSufficiencyPct >= 100 ? 12 : -15) + droneBays * 2;
  const moraleScore = Math.min(100, Math.max(0, Math.round(baseMorale - moraleShock)));

  const withinThbBudget = protoTHB <= 1500;
  const isSelfSustaining =
    caloricSufficiencyPct >= 100 &&
    oxygenSufficiencyPct >= 100 &&
    netWaterLoopPct >= 95 &&
    moraleScore >= 65 &&
    withinThbBudget;

  return {
    colonists,
    targetDailyKcal,
    dailyKcalProduced,
    caloricSufficiencyPct,
    oxygenSufficiencyPct,
    netWaterLoopPct,
    moraleScore,
    prototypingCostTHB: protoTHB,
    withinThbBudget,
    isSelfSustaining
  };
}

