/**
 * Don's PBL Prototype Pure Engine
 * Location: prototypes/DonPBL/engine.ts
 * 
 * Reusable, framework-agnostic pure logic functions modeled after
 * WeLearn Playground's `src/features/pbl/engine/pblProject.js`.
 * 
 * Tested without React or Firebase dependencies.
 */

import { StudentProject, EvidenceItem, CORE_COMPETENCIES } from './mockFixtures';
import { SAMPLE_PROGRAM } from './programData';

export const LIMITS = {
  evidence: 150,
  title: 120,
  body: 3000,
  code: 6000,
  link: 500,
  field: 600,
  sparks: 1500
};

const PHASES = ['explore', 'empathise', 'define', 'ideate', 'prototype', 'test', 'share'] as const;
type PhaseId = typeof PHASES[number];

const KINDS = ['note', 'media', 'code', 'data', 'feedback', 'ai', 'reflection'] as const;
type EvidenceKind = typeof KINDS[number];

/**
 * Sanitizes URLs to prevent javascript: or data: XSS attacks
 */
export function safeLink(value?: string): string {
  if (!value || typeof value !== 'string') return '';
  const s = value.slice(0, LIMITS.link).trim();
  if (!s) return '';
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : '';
  } catch {
    return '';
  }
}

/**
 * Calculates phase progress
 */
export function getPhaseProgress(project: StudentProject, phaseId: string) {
  const phaseDef = SAMPLE_PROGRAM.phases.find(p => p.id === phaseId);
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
  const hasAi = project.evidence.some(e => e.kind === 'ai' && e.ai?.asked && e.ai?.kept);
  const hasData = project.evidence.some(e => e.kind === 'data');
  const hasFeedback = project.evidence.some(e => e.kind === 'feedback');
  const hasReflection = project.evidence.some(e => e.kind === 'reflection');

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
      description: 'At least one verified artifact logged in Explore, Empathise, Define, Ideate, Prototype, Test, and Share.',
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
 * Adds an evidence item with validation
 */
export function validateAndAddEvidence(
  project: StudentProject,
  evidenceInput: Partial<EvidenceItem>
): { success: boolean; error?: string; updatedProject?: StudentProject } {
  if (!evidenceInput.title || evidenceInput.title.trim().length === 0) {
    return { success: false, error: 'Evidence title is required.' };
  }

  if (evidenceInput.link) {
    const safe = safeLink(evidenceInput.link);
    if (!safe) {
      return { success: false, error: 'Invalid link. Only http:// or https:// URLs are permitted.' };
    }
  }

  if (evidenceInput.kind === 'ai') {
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

  const newId = `ev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const cleanItem: EvidenceItem = {
    id: newId,
    phase: (evidenceInput.phase as PhaseId) || 'explore',
    kind: (evidenceInput.kind as EvidenceKind) || 'note',
    title: evidenceInput.title.slice(0, LIMITS.title).trim(),
    body: (evidenceInput.body || '').slice(0, evidenceInput.kind === 'code' ? LIMITS.code : LIMITS.body),
    link: evidenceInput.link ? safeLink(evidenceInput.link) : undefined,
    competencies: validCompetencies.slice(0, 8),
    createdAt: Date.now(),
    ai: evidenceInput.kind === 'ai' ? evidenceInput.ai : undefined,
    metrics: evidenceInput.metrics
  };

  const updatedEvidence = [cleanItem, ...project.evidence];
  return {
    success: true,
    updatedProject: {
      ...project,
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

def deploy_canopy():
    # Deploy SG90 servo on pin1 to 110 degrees
    pin1.set_analog_period(20)
    pin1.write_analog(int(25 + (110 / 180.0) * 100))
    sleep(350)
    pin1.write_analog(0) # Sleep servo to eliminate motor hum

def pulse_pump():
    # Pulse 5V relay on pin2 for 2.5 seconds
    pin2.write_digital(1)
    sleep(2500)
    pin2.write_digital(0)

display.show(Image.HAPPY)
pin2.write_digital(0)

while True:
    moisture = pin0.read_analog()
    temp_now = temperature()
    
    if temp_now >= TEMP_HEAT_LIMIT:
        deploy_canopy()
        display.show(Image.CONFUSED)
        
    if moisture > MOISTURE_DRY:
        pulse_pump()
        sleep(3000) # Wait for soil absorption
        
    sleep(1000)`
      : `// MakeCode JavaScript for micro:bit V2
let moisture = 0
let tempNow = 0

basic.showIcon(IconNames.Happy)
pins.digitalWritePin(DigitalPin.P2, 0)

basic.forever(function () {
    moisture = pins.analogReadPin(AnalogPin.P0)
    tempNow = input.temperature()
    
    // Shading threshold
    if (tempNow >= 32) {
        pins.servoWritePin(AnalogPin.P1, 110)
        basic.showIcon(IconNames.Sad)
    }
    
    // Moisture drip trigger
    if (moisture > 640) {
        pins.digitalWritePin(DigitalPin.P2, 1)
        basic.pause(2500)
        pins.digitalWritePin(DigitalPin.P2, 0)
        basic.pause(3000)
    }
    basic.pause(1000)
})`;

    const reply = `### Here is your working code for micro:bit V2 (${language}):

\`\`\`${language === 'micropython' ? 'python' : 'javascript'}
${sampleCode}
\`\`\`

---

### How to test it on your real device:
1. **Power Check**: Ensure your micro:bit is connected via USB and your servo and pump are powered from an external 5V power pack sharing a common ground wire with the micro:bit GND pin.
2. **Moisture Dry Test**: Lift the capacitive probe out of the moist soil into air. Watch the LED matrix and listen for the relay click turning on the pump for 2.5 seconds.
3. **Thermal Shade Test**: Place your warm palm or a warm compress over the micro:bit thermistor until the temperature reading exceeds 32°C. Verify the servo arm sweeps smoothly to 110°.

---

### Explain-It-Back Challenge:
> **Question for your team:** Looking at \`pin1.write_analog(0)\` on line 12, why do we turn off the servo analog PWM signal after the movement completes instead of leaving it active?
*(Hint: Think about battery drain and what causes that high-pitched motor buzz when a servo holds a static position!)*`;

    return { reply, sampleCode };
  }

  // Planning / conceptual prompts
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
 * Calculates market unit economics and break-even sales volume in Thai Baht
 */
export function calculateUnitEconomics(params: {
  unitFloorCostTHB: number;
  desiredGrossMarginPct: number;
  fixedStartupCapitalExpenseTHB: number;
}) {
  const marginDecimal = Math.min(0.95, Math.max(0.05, params.desiredGrossMarginPct / 100));
  const retailPriceTHB = Math.round((params.unitFloorCostTHB / (1 - marginDecimal)) * 100) / 100;
  const unitContributionMarginTHB = Math.round((retailPriceTHB - params.unitFloorCostTHB) * 100) / 100;
  
  const breakEvenUnits = unitContributionMarginTHB > 0
    ? Math.ceil(params.fixedStartupCapitalExpenseTHB / unitContributionMarginTHB)
    : 0;

  return {
    unitFloorCostTHB: params.unitFloorCostTHB,
    desiredGrossMarginPct: params.desiredGrossMarginPct,
    retailPriceTHB,
    unitContributionMarginTHB,
    fixedStartupCapitalExpenseTHB: params.fixedStartupCapitalExpenseTHB,
    breakEvenUnits
  };
}

/**
 * Runs a step in the market simulation sandbox
 */
export function simulateMarketStep(currentState: {
  cashReserveTHB: number;
  unitFloorCostTHB: number;
  retailPriceTHB: number;
  unitsProduced: number;
  unitsSold: number;
  adoptersReached: number;
  marketReputationScore: number;
}, unitsToProduce: number, unitsDemand: number) {
  const productionCost = unitsToProduce * currentState.unitFloorCostTHB;
  const actualSold = Math.min(unitsDemand, currentState.unitsProduced + unitsToProduce - currentState.unitsSold);
  const revenue = actualSold * currentState.retailPriceTHB;
  
  const updatedProduced = currentState.unitsProduced + unitsToProduce;
  const updatedSold = currentState.unitsSold + actualSold;
  const updatedCash = currentState.cashReserveTHB - productionCost + revenue;
  const updatedAdopters = currentState.adoptersReached + actualSold;
  
  // Reputation increases as customers are satisfied
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
