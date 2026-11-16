/**
 * Don's PBL Program: Project Vital Flow — Biomedical Engineering & Closed-Loop Fluid Dynamics
 * Branch: DonPBL
 * Location: prototypes/DonPBL/vitalFlowProgram.ts
 *
 * Sourced from "Program Overview & Pedagogical Architecture: Biomedical Engineering & Closed-Loop Fluid Dynamics — Project Vital Flow"
 * Scenario: A medical device company has tasked student teams with prototyping an external
 * "External Circulatory Support System" for a pediatric patient whose heart can no longer
 * pump blood to their extremities.
 * Schedule: 12 Weeks | Monday–Friday | 2 Hours/Day (10 Hours/Week | 120 Total Hours | 24 Sessions)
 * Design Framework: Design Thinking (Empathize, Define, Ideate, Prototype, Test & Refine, Final Evaluation — mapped across the 7 prototype phases: explore, empathise, define, ideate, prototype, test, share)
 */

import type { PblProgram, ProgramPhase } from './programData';

export interface VitalFlowPumpOption {
  id: string;
  name: string;
  mechanism: 'Dual-Chamber Latex/Nitrile Glove Ventricle' | 'High-Elasticity Thick-Wall Balloon Bulb' | 'Tandem 60mL Luer-Lock Syringe Piston' | 'Hybrid Balloon-In-Bottle Diaphragm Squeeze';
  strokeVolumeMl: number;
  peakSystolicMmHg: number;
  fatigueDurabilityCycles: number;
  refillElasticityRating: string;
  unitCostTHB: number;
  pros: string[];
  cons: string[];
}

export interface VitalFlowValveOption {
  id: string;
  name: string;
  mechanism: 'Cut-Balloon Rubber Flap Check-Valve' | 'Angled Pinched-Straw Duckbill Valve' | 'Inline Ball-in-Tube Gravity Check-Valve' | 'Unvalved Open Junction (Baseline Control)';
  backflowPreventionPct: number;
  forwardPressureDropMmHg: number;
  clinicalAnalogy: string;
  fabricationNotes: string;
}

export interface VitalFlowVascularZone {
  id: string;
  zoneName: string;
  arterialPathway: string;
  venousReturnPathway: string;
  tubingSpec: string;
  distanceFromHeartCm: number;
  clinicalIschemiaRisk: string;
}

export interface VitalFlowDeliverableSpec {
  number: number;
  title: string;
  weeksCovered: string;
  keyTechnicalCriteria: string[];
  primarySkillsAssessed: string[];
}

export interface VitalFlowSkillPracticeItem {
  skillNumber: number;
  domainId: 'sdl' | 'ctps' | 'lc' | 'ec' | 'ent' | 'sea' | 'ct';
  skillTitle: string;
  competencyIds: string[];
  howStudentsPractice: string;
  deliverableAnchor: string;
}

export interface VitalFlowGamificationBadge {
  id: string;
  name: string;
  icon: string;
  xpAward: number;
  unlockedAtPhase: string;
  condition: string;
  description: string;
}

export const VITAL_FLOW_PUMP_OPTIONS: VitalFlowPumpOption[] = [
  {
    id: 'pump-glove-ventricle',
    name: 'Reinforced Nitrile Glove Dual-Finger Ventricle',
    mechanism: 'Dual-Chamber Latex/Nitrile Glove Ventricle',
    strokeVolumeMl: 42,
    peakSystolicMmHg: 95,
    fatigueDurabilityCycles: 600,
    refillElasticityRating: 'Moderate elastic recoil; requires palm support wrap',
    unitCostTHB: 45,
    pros: [
      'Multiple finger ports allow natural branching into pulmonary and systemic trunks',
      'Easy to inspect dyed fluid mixing through translucent nitrile wall'
    ],
    cons: [
      'Thin cuff junctions prone to ballooning ("aneurysms") above 95 mmHg without duct-tape cuffing',
      'Slower passive diastolic refill unless paired with an elastic return band'
    ]
  },
  {
    id: 'pump-balloon-bulb',
    name: 'Double-Layered Heavy-Duty Balloon Ventricular Bulb',
    mechanism: 'High-Elasticity Thick-Wall Balloon Bulb',
    strokeVolumeMl: 55,
    peakSystolicMmHg: 125,
    fatigueDurabilityCycles: 950,
    refillElasticityRating: 'High recoil — snaps back rapidly to draw venous return',
    unitCostTHB: 60,
    pros: [
      'High systolic pressure (125 mmHg) capable of driving fluid through narrow distal toe straws',
      'Strong elastic recoil actively pulls oxygenated fluid from the lung reservoir'
    ],
    cons: [
      'Single neck opening requires a Y-splitter tee for inlet/outlet separation',
      'High output pressure tests weak duct-tape joints immediately'
    ]
  },
  {
    id: 'pump-syringe-piston',
    name: '60mL Calibrated Syringe & Dual Tee Manifold',
    mechanism: 'Tandem 60mL Luer-Lock Syringe Piston',
    strokeVolumeMl: 60,
    peakSystolicMmHg: 140,
    fatigueDurabilityCycles: 1500,
    refillElasticityRating: 'Manual pull-stroke refill (graduated mL markings)',
    unitCostTHB: 85,
    pros: [
      'Exact volumetric calibration (mL per stroke) for Activity 2.3 and Activity 5.1 data tables',
      'Highest pressure output (140 mmHg) for overcoming capillary straw resistance'
    ],
    cons: [
      'Requires manual pull-back stroke unless spring-loaded; less biological feel than soft ventricle',
      'Over-pressurization can blow straw capillary junctions if pushed too fast'
    ]
  },
  {
    id: 'pump-hybrid-diaphragm',
    name: 'Balloon-in-Bottle Compliant Ventricle Chamber',
    mechanism: 'Hybrid Balloon-In-Bottle Diaphragm Squeeze',
    strokeVolumeMl: 68,
    peakSystolicMmHg: 132,
    fatigueDurabilityCycles: 1200,
    refillElasticityRating: 'Rapid negative-pressure bottle rebound',
    unitCostTHB: 95,
    pros: [
      'Rigid outer bottle shell prevents ventricular aneurysm rupture while maintaining 68 mL stroke volume',
      'Mimics human pericardial sac constraint and intrathoracic pressure mechanics'
    ],
    cons: [
      'Requires airtight bulkhead sealing where aquarium tubing passes through bottle cap and base'
    ]
  }
];

export const VITAL_FLOW_VALVE_OPTIONS: VitalFlowValveOption[] = [
  {
    id: 'valve-rubber-flap',
    name: 'Cut-Balloon Silicone/Rubber Flap Leaf Valve',
    mechanism: 'Cut-Balloon Rubber Flap Check-Valve',
    backflowPreventionPct: 94,
    forwardPressureDropMmHg: 6,
    clinicalAnalogy: 'Bicuspid (Mitral) & Tricuspid Atrioventricular Heart Valves',
    fabricationNotes: 'Tensioned rubber membrane taped across an angled coupler sleeve; opens on forward systole and seals flat against reverse backflow.'
  },
  {
    id: 'valve-duckbill-straw',
    name: 'Bevel-Cut Pinched Straw Duckbill Valve',
    mechanism: 'Angled Pinched-Straw Duckbill Valve',
    backflowPreventionPct: 88,
    forwardPressureDropMmHg: 11,
    clinicalAnalogy: 'Aortic & Pulmonary Semilunar Valves + Peripheral Venous Valves',
    fabricationNotes: '45-degree bevel-cut flexible straw inserted inside wider aquarium tubing with a calibrated rubber-band collar.'
  },
  {
    id: 'valve-ball-in-tube',
    name: 'Bead-in-Conical-Adapter Check Valve',
    mechanism: 'Inline Ball-in-Tube Gravity Check-Valve',
    backflowPreventionPct: 97,
    forwardPressureDropMmHg: 9,
    clinicalAnalogy: 'Prosthetic Mechanical Ball-and-Cage Heart Valve (Starr-Edwards type)',
    fabricationNotes: 'Lightweight polymer bead seated inside a tapered tubing reducer with a downstream retaining pin.'
  },
  {
    id: 'valve-none-control',
    name: 'Unvalved Open Tubing Junction (Failure Control)',
    mechanism: 'Unvalved Open Junction (Baseline Control)',
    backflowPreventionPct: 18,
    forwardPressureDropMmHg: 2,
    clinicalAnalogy: 'Severe Valvular Regurgitation / Congenital Shunt Defect',
    fabricationNotes: 'Used in Week 5 baseline testing to demonstrate why unvalved pumps slosh fluid backward and mix deoxygenated and oxygenated loops.'
  }
];

export const VITAL_FLOW_VASCULAR_PATHWAYS: VitalFlowVascularZone[] = [
  {
    id: 'zone-pulmonary-loop',
    zoneName: '1. Pulmonary Circuit & Lung-Oxygenation Station',
    arterialPathway: 'Right Ventricle -> Pulmonary Artery -> Lung Exposure Chamber',
    venousReturnPathway: 'Lung Exposure Chamber -> Pulmonary Veins -> Left Atrium/Ventricle',
    tubingSpec: '8mm ID primary aquarium tubing + 250mL lung oxygenation reservoir chamber',
    distanceFromHeartCm: 28,
    clinicalIschemiaRisk: 'Mandatory oxygenation bottleneck: without sealed entry/exit routing through the lung station, systemic blood remains hypoxic.'
  },
  {
    id: 'zone-cranial-carotid',
    zoneName: '2. Cranial & Upper Thoracic Loop',
    arterialPathway: 'Aortic Arch -> Common Carotid Artery & Subclavian Artery',
    venousReturnPathway: 'Internal/External Jugular & Subclavian Vein -> Superior Vena Cava',
    tubingSpec: '6mm ID arterial branch -> 3mm straw capillary loop -> 6mm venous return',
    distanceFromHeartCm: 35,
    clinicalIschemiaRisk: 'Brain tissue suffers irreversible hypoxic injury within 4–6 minutes of flow arrest.'
  },
  {
    id: 'zone-upper-extremities',
    zoneName: '3. Upper Extremities (Left & Right Fingers — 10 Digits)',
    arterialPathway: 'Subclavian -> Axillary -> Brachial -> Radial & Ulnar -> Digital Arteries',
    venousReturnPathway: 'Palmar Digital Veins -> Radial/Ulnar/Basilic/Cephalic/Median Cubital -> Axillary -> Superior Vena Cava',
    tubingSpec: '6mm Brachial trunk splitting into 5x 2.5mm micro-straws per hand (fingers)',
    distanceFromHeartCm: 78,
    clinicalIschemiaRisk: 'High bifurcation count at the palmar arch causes pressure drop; requires smooth Y-splitters to prevent dry fingertips.'
  },
  {
    id: 'zone-visceral-renal',
    zoneName: '4. Visceral, Hepatic & Renal Trunk',
    arterialPathway: 'Descending Thoracic/Abdominal Aorta -> Gastric, Hepatic & Renal Arteries',
    venousReturnPathway: 'Renal & Hepatic Veins -> Inferior Vena Cava',
    tubingSpec: '8mm Descending Aorta trunk with parallel 4mm organ shunt restrictor',
    distanceFromHeartCm: 42,
    clinicalIschemiaRisk: 'If visceral shunt resistance is too low, it steals flow ("vascular steal") away from the lower limbs.'
  },
  {
    id: 'zone-lower-extremities',
    zoneName: '5. Lower Extremities (Left & Right Toes — 10 Digits)',
    arterialPathway: 'Common/Internal Iliac -> Femoral -> Anterior & Posterior Tibial + Peroneal -> Arcuate -> Dorsal Digital Arteries',
    venousReturnPathway: 'Dorsal Digital Veins & Dorsal Venous Arch -> Anterior/Posterior Tibial + Great & Small Saphenous -> Femoral -> Common Iliac -> Inferior Vena Cava',
    tubingSpec: '8mm Iliac/Femoral trunk -> 5mm Tibial branches -> 5x 2.5mm micro-straws per foot (toes)',
    distanceFromHeartCm: 135,
    clinicalIschemiaRisk: 'Furthest hydraulic reach (135 cm from heart): highest risk of dry toes, stagnant pockets, and venous return failure.'
  }
];

export const VITAL_FLOW_DELIVERABLES: VitalFlowDeliverableSpec[] = [
  {
    number: 1,
    title: '1. Working Circulatory Prototype (Closed-Loop Hydraulic Model)',
    weeksCovered: 'Weeks 7–11 (Prototype V1.0 Freeze & V2.0 Upgrade)',
    keyTechnicalCriteria: [
      'Full-scale closed-loop hydraulic network mounted on a life-size human body cut-out reaching all simulated fingers and toes.',
      'Integrates a manual heart pump (glove/balloon/syringe), one-way check-valves, and a mandatory lung-oxygenation reservoir station.',
      'Passes the Week 10–11 Reach Audit (100% extremity reach), Leak Audit (zero structural "aneurysms" at duct-tape/rubber-band seals), and Flow Audit (zero backflow mixing).'
    ],
    primarySkillsAssessed: [
      'Critical Thinking & Problem Solving (ctps-01, ctps-05)',
      'Collaboration & Leadership (lc-02, lc-05)',
      'Self-Directed Learning (sdl-03, sdl-04)'
    ]
  },
  {
    number: 2,
    title: '2. Biomedical Engineering Blueprint (Anatomical & Fluid Schematics)',
    weeksCovered: 'Weeks 3–6 (Phase Gate 1 Brief & Full-Scale Template Blueprint)',
    keyTechnicalCriteria: [
      'Scaled anatomical fluid-routing schematic mapping Aorta, Superior/Inferior Vena Cava, Pulmonary Artery/Veins, Brachial/Radial/Ulnar/Digital, and Femoral/Tibial/Saphenous/Dorsal Digital vessels.',
      'Includes theoretical stroke volume vs. total tubing capacity calculations (Activity 2.3) and multi-branch pressure distribution models across macro-tubing and micro-straw capillaries.',
      'Specifies check-valve geometries, pulmonary circuit entry/exit nodes, and airtight joint-sealing protocols.'
    ],
    primarySkillsAssessed: [
      'Computational & Systems Thinking (ct-01, ct-04)',
      'Effective Communication (ec-02, ec-05)'
    ]
  },
  {
    number: 3,
    title: '3. Clinical Evaluation & Cost-Benefit Report (Medical Board Defense)',
    weeksCovered: 'Weeks 10–12 (Empirical Stress Audits & Medical Board Defense)',
    keyTechnicalCriteria: [
      'Empirical dataset logging pump strokes per minute (BPM), time-to-reach extremities (seconds), distal output volume (mL/min), and joint leak failure locations across V1.0 and V2.0.',
      'Bill of Materials (BOM) and material trade-off audit comparing classroom polymers (aquarium tubing, latex/nitrile, duct tape, straws) against medical-grade silicone and living vascular endothelium.',
      'Analytical biological debrief connecting classroom leaks to valvular regurgitation/aneurysms, duct-tape limits to living tissue self-repair, and macroscopic tubing to microscopic capillary diffusion.'
    ],
    primarySkillsAssessed: [
      'Entrepreneurship & Clinical Viability (ent-01, ent-02)',
      'Social & Emotional Aptitude & Patient Empathy (sea-01, sea-03)'
    ]
  }
];

export const VITAL_FLOW_WELEARN_SKILLS_TABLE: VitalFlowSkillPracticeItem[] = [
  {
    skillNumber: 1,
    domainId: 'sea',
    skillTitle: 'Social & Emotional Aptitude (Patient Empathy & Clinical Ethics)',
    competencyIds: ['sea-01', 'sea-02', 'sea-03'],
    howStudentsPractice: 'Investigating the human impact of pediatric peripheral ischemia (numbness, coldness, necrosis) and synthesizing patient-centric Empathy Maps focused on saving fingers and toes.',
    deliverableAnchor: 'Week 1–2 Patient Empathy Map & Week 12 Biological Reflection'
  },
  {
    skillNumber: 2,
    domainId: 'ctps',
    skillTitle: 'Critical Thinking & Problem Solving (Hydraulic & Failure Analysis)',
    competencyIds: ['ctps-01', 'ctps-03', 'ctps-05'],
    howStudentsPractice: 'Running baseline syringe resistance trials, evaluating pump/valve concepts via a Pugh Matrix, and diagnosing structural "aneurysms", dead zones, and backflow during Week 10 stress testing.',
    deliverableAnchor: 'Deliverable #1 Working Prototype & Week 10–11 Stress Audit Logs'
  },
  {
    skillNumber: 3,
    domainId: 'ct',
    skillTitle: 'Computational & Quantitative Systems Modeling',
    competencyIds: ['ct-01', 'ct-02', 'ct-04'],
    howStudentsPractice: 'Calculating pump displacement volume vs. total vascular tubing capacity (Activity 2.3), modeling pressure drop across bifurcating straw capillary beds, and plotting BPM vs. distal flow rate.',
    deliverableAnchor: 'Deliverable #2 Biomedical Blueprint & Pressure Distribution Model'
  },
  {
    skillNumber: 4,
    domainId: 'sdl',
    skillTitle: 'Self-Directed Learning & Iterative Engineering',
    competencyIds: ['sdl-01', 'sdl-03', 'sdl-04'],
    howStudentsPractice: 'Progressing from Phase Gate 1 Design Brief Sign-Off to Prototype V1.0 Freeze, systematically logging joint leaks, and autonomously executing V2.0 geometric and seal upgrades.',
    deliverableAnchor: 'Prototype V1.0 -> V2.0 Iteration Log & Quality Control Protocol'
  },
  {
    skillNumber: 5,
    domainId: 'lc',
    skillTitle: 'Leadership & Multidisciplinary Biomedical Pod Collaboration',
    competencyIds: ['lc-01', 'lc-02', 'lc-05'],
    howStudentsPractice: 'Coordinating across Pump & Valve Lead, Vascular Routing & Seal Lead, and Clinical Telemetry & Blueprint Lead during Wednesday Maker Studios and Thursday Failure Audits.',
    deliverableAnchor: 'Team Consensus Survival Criteria & Joint-Sealing Bootcamp'
  },
  {
    skillNumber: 6,
    domainId: 'ec',
    skillTitle: 'Communication in All Forms (Anatomical Schematics & Medical Board Defense)',
    competencyIds: ['ec-01', 'ec-02', 'ec-05'],
    howStudentsPractice: 'Annotating full-body arterial/venous maps, drafting life-size vascular routing schematics, and defending empirical test data before peer judges and medical professionals in Week 12.',
    deliverableAnchor: 'Deliverable #2 Life-Size Blueprint & Activity 6.1 Medical Board Defense'
  },
  {
    skillNumber: 7,
    domainId: 'ent',
    skillTitle: 'Entrepreneurship, Material Viability & Cost-Benefit Auditing',
    competencyIds: ['ent-01', 'ent-02', 'ent-03'],
    howStudentsPractice: 'Auditing material constraints (aquarium tubing, balloons, duct tape, straws vs. medical-grade silicone) and quantifying prototype cost-efficiency and reliability.',
    deliverableAnchor: 'Deliverable #3 Clinical Evaluation & Cost-Benefit Report'
  }
];

export const VITAL_FLOW_GAMIFICATION_BADGES: VitalFlowGamificationBadge[] = [
  {
    id: 'badge-ischemia-empathy',
    name: 'Vascular Cartographer',
    icon: '🫀',
    xpAward: 150,
    unlockedAtPhase: 'explore',
    condition: 'Complete Activity 1.1–1.4: Trace O2/CO2 exchange and annotate all major arteries and veins from Aorta/Vena Cava to Dorsal Digital vessels.',
    description: 'Mastered human macro- and micro-vascular pathways and pediatric ischemia clinical metrics.'
  },
  {
    id: 'badge-poiseuille-pioneer',
    name: 'Capillary Physics Pioneer',
    icon: '🔬',
    xpAward: 175,
    unlockedAtPhase: 'empathise',
    condition: 'Complete Activity 1.5–1.6: Quantify syringe-and-tubing resistance, inspect capillary diffusion, and present the Phase 1 Patient Empathy Map.',
    description: 'Connected hydraulic pipe resistance and material biocompatibility to patient extremity survival.'
  },
  {
    id: 'badge-phase-gate-brief',
    name: 'Phase Gate 1 Architect',
    icon: '📐',
    xpAward: 200,
    unlockedAtPhase: 'define',
    condition: 'Complete Activity 2.1–2.3: Calculate pump stroke volume vs. total tubing capacity and pass Phase Gate 1 Design Brief Sign-Off.',
    description: 'Translated clinical requirements into quantitative closed-loop engineering constraints.'
  },
  {
    id: 'badge-valve-innovator',
    name: 'One-Way Valve Innovator',
    icon: '⚙️',
    xpAward: 225,
    unlockedAtPhase: 'ideate',
    condition: 'Complete Activity 3.1–3.3: Test glove/balloon stroke volumes, build a working check-valve, and complete the life-size vascular blueprint.',
    description: 'Engineered unidirectional flow control and macro-to-micro straw bifurcation schematics.'
  },
  {
    id: 'badge-aneurysm-proof',
    name: 'Prototype V1.0 Surgeon',
    icon: '🛠️',
    xpAward: 250,
    unlockedAtPhase: 'prototype',
    condition: 'Complete Activity 4.1–4.4: Assemble the closed-loop body cut-out, integrate the lung station, prime with dyed blood, and freeze Prototype V1.0.',
    description: 'Constructed and primed a full-scale external circulatory support model with sealed junctions.'
  },
  {
    id: 'badge-reach-the-toes',
    name: '100% Extremity Perfusion',
    icon: '🦶',
    xpAward: 300,
    unlockedAtPhase: 'test',
    condition: 'Complete Activity 5.1–5.4: Pass the Reach, Leak ("Aneurysm"), and Flow Audits on Prototype V2.0 with 100% finger and toe perfusion.',
    description: 'Eliminated dead zones, patched high-pressure seal failures, and achieved full distal perfusion.'
  },
  {
    id: 'badge-medical-board-honors',
    name: 'Chief Biomedical Fellow',
    icon: '🏥',
    xpAward: 350,
    unlockedAtPhase: 'share',
    condition: 'Complete Activity 6.1–6.2: Defend your prototype and empirical dataset before the Medical Board and complete the biological reflection.',
    description: 'Synthesized engineering failure logs with real human heart-valve and capillary biology.'
  }
];

const VITAL_FLOW_PHASES: ProgramPhase[] = [
  {
    id: 'explore',
    title: 'Phase 1 (Part A): EMPATHIZE — The Human Cost of Restricted Circulation (Week 1)',
    strap: 'Phase Focus: Researching the physiological consequences of restricted blood flow and mapping real human circulatory pathways. (Week 1 • 10 Hours)',
    weeks: [1, 1],
    goal: 'Introduce the pediatric External Circulatory Support System scenario, trace cellular O2/CO2 exchange ("Good Stuff vs. Bad Stuff"), annotate the human arterial/venous tree from Aorta to Dorsal Digital vessels, analyze pediatric heart shunts, and establish clinical survival metrics for reaching the fingers and toes.',
    tasks: [
      'Mon (2 hrs — Anatomy & Fluid Dynamics Concept Lab): Activity 1.1 — Case study review of peripheral vascular disease and tissue ischemia; mapping symptoms (numbness, coldness, necrosis).',
      'Tue (2 hrs — Blueprinting & Numerical Modeling): Activity 1.2 — "Good Stuff vs. Bad Stuff" biochemical tracing exercise (cellular respiration and CO2 exchange).',
      'Wed (2 hrs — Biomedical Maker Studio): Activity 1.3 — Detailed annotation of the human circulatory system diagram (Aorta, Vena Cava, Pulmonary vessels, Subclavian, Brachial, Radial, Ulnar, Digital, Iliac, Femoral, Saphenous, Tibial, Peroneal, Arcuate, Dorsal Digital).',
      'Thu (2 hrs — Stress Testing & Failure Analysis): Activity 1.4 — Comparative analysis of pediatric heart defects and circulatory shunt mechanisms.',
      'Fri (2 hrs — Design Critique & Clinical Reflection): Team consensus meeting defining what "reaching the toes" means for system survival.'
    ],
    evidence: [
      'Activity 1.1 Peripheral Vascular Disease & Tissue Ischemia Symptom Map',
      'Activity 1.2 "Good Stuff vs. Bad Stuff" Biochemical O2/CO2 Exchange Diagram',
      'Activity 1.3 Annotated Human Circulatory System Diagram (Arteries & Veins)',
      'Activity 1.4 Pediatric Shunt Analysis & Team Consensus Survival Charter'
    ],
    aiPromptStarters: [
      'Explain how peripheral vascular ischemia affects fingers and toes when systemic blood pressure drops.',
      'Help our team compare oxygenated arterial pathways and deoxygenated venous return pathways from the Aorta to the Dorsal Digital vessels.'
    ],
    competencies: ['sea-01', 'ctps-01', 'ec-01'],
    stretchCompetencies: ['ctps-02', 'lc-01'],
    sessions: [
      {
        sessionNumber: 1,
        week: 1,
        title: 'Week 1 (Mon–Wed): Tissue Ischemia, O2/CO2 Exchange & Human Vascular Mapping',
        durationMin: 360,
        learningGoal: 'Understand the physiological consequences of restricted peripheral blood flow, trace oxygen delivery and metabolic waste removal, and map major arteries and veins across the human body.',
        activities: [
          'Monday (2 hrs — Anatomy & Fluid Dynamics Concept Lab): Activity 1.1 — Case study review of peripheral vascular disease and pediatric tissue ischemia; map clinical symptoms (numbness, coldness, cyanosis, tissue necrosis) when extremities lose perfusion.',
          'Tuesday (2 hrs — Blueprinting & Numerical Modeling): Activity 1.2 — "Good Stuff vs. Bad Stuff" biochemical tracing exercise mapping cellular respiration, oxygenated arterial delivery (O2 + glucose), and deoxygenated venous waste removal (CO2 + lactic acid).',
          'Wednesday (2 hrs — Biomedical Maker Studio): Activity 1.3 — Detailed color-coded annotation of the human circulatory system diagram covering Common Carotid, Subclavian, Aorta, Superior/Inferior Vena Cava, Pulmonary Artery/Veins, Axillary, Brachial, Radial, Ulnar, Digital, Iliac, Femoral, Great/Small Saphenous, Anterior/Posterior Tibial, Peroneal, Arcuate, and Dorsal Digital vessels.'
        ],
        learnerChoices: {
          question: 'Which peripheral vascular zone will your pod model in highest anatomical detail for your Week 1 clinical case study?',
          options: [
            {
              id: 'choice-lower-limb-pedal',
              label: 'Lower Limb & Pedal Arch (Femoral -> Tibial/Peroneal -> Dorsal Digital Toes)',
              description: 'Focus on the longest hydraulic path in the body where hydrostatic pressure and resistance make toe perfusion hardest.'
            },
            {
              id: 'choice-upper-limb-palmar',
              label: 'Upper Limb & Palmar Arch (Subclavian -> Brachial -> Radial/Ulnar -> Fingers)',
              description: 'Focus on fine arterial bifurcations supplying the 10 fingers and rapid venous return via Cephalic, Basilic, and Median Cubital veins.'
            },
            {
              id: 'choice-pulmonary-cardiac-shunt',
              label: 'Central Cardiopulmonary & Shunt Loop (Vena Cava -> Pulmonary -> Aortic Arch)',
              description: 'Focus on how the heart and lung-oxygenation station separate deoxygenated venous blood from freshly oxygenated systemic flow.'
            }
          ]
        },
        evidenceToCollect: {
          kind: 'media',
          prompt: 'Upload your annotated Activity 1.3 Human Circulatory System diagram and Activity 1.2 "Good Stuff vs. Bad Stuff" biochemical pathway map.',
          targetCompetencies: ['sea-01', 'ctps-01', 'ec-01']
        },
        reflectionPrompt: 'Why do the fingers and toes show signs of ischemia (coldness, numbness, tissue damage) first when the heart weakens?',
        teacherTips: 'Use the Circulatory System anatomical reference chart (Page 19 of the curriculum packet) so students trace exact vessel names from the Aorta all the way to the Dorsal Digital artery and vein.'
      },
      {
        sessionNumber: 2,
        week: 1,
        title: 'Week 1 (Thu–Fri): Pediatric Heart Defects, Pressure Drops & Clinical Survival Metrics',
        durationMin: 240,
        learningGoal: 'Investigate how human hearts respond to systemic pressure drops and establish team consensus clinical success metrics for an External Circulatory Support System.',
        activities: [
          'Thursday (2 hrs — Stress Testing & Failure Analysis): Activity 1.4 — Comparative analysis of pediatric heart defects, ventricular hypoplasia, and circulatory shunt mechanisms; analyze what happens when oxygenated and deoxygenated blood mix.',
          'Friday (2 hrs — Design Critique & Clinical Reflection): Team consensus meeting — Define quantitative clinical survival metrics for what "reaching the toes" and "zero hypoxic mixing" mean for your external circulatory support prototype.'
        ],
        learnerChoices: {
          question: 'How will your pod represent oxygenated ("Good Stuff") vs. deoxygenated ("Bad Stuff") blood clarity during your prototype trials?',
          options: [
            {
              id: 'choice-dye-contrast',
              label: 'High-Contrast Red/Blue Food-Safe Dye Tracer Protocol',
              description: 'Use distinct tracer pulses to visually time fluid arrival at the fingertips and toes and detect any backflow mixing.'
            },
            {
              id: 'choice-bubble-tracer',
              label: 'Timed Micro-Tracer Bead / Air-Free Pulse Front Tracking',
              description: 'Track leading fluid fronts across transparent aquarium tubing and straw capillary beds with a stopwatch.'
            }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Submit your Activity 1.4 Pediatric Shunt Comparative Notes and your team’s signed Clinical Success Metrics Charter.',
          targetCompetencies: ['sea-01', 'lc-01', 'ctps-02']
        },
        reflectionPrompt: 'How does a septal defect or shunt in a real pediatric heart resemble backflow in a mechanical tubing loop?',
        teacherTips: 'Remind under-13 learners to use written/drawn reflection cards or teacher-scribed notes—never voice recording or speech-to-text.'
      }
    ]
  },
  {
    id: 'empathise',
    title: 'Phase 1 (Part B): EMPATHIZE — Vascular Mapping & Fluid Dynamics Principles (Week 2)',
    strap: 'Phase Focus: Exploring hydraulic pressure, capillary diffusion mechanics, material compatibility, and synthesizing a patient Empathy Map. (Week 2 • 10 Hours)',
    weeks: [2, 2],
    goal: 'Conduct baseline syringe-and-tubing fluid resistance experiments, examine microscopic capillary diffusion challenges, audit medical-grade silicone vs. classroom polymers, synthesize a patient Empathy Map, and host the Phase 1 Pin-Up Review.',
    tasks: [
      'Mon (2 hrs — Anatomy & Fluid Dynamics Concept Lab): Activity 1.5 — Simple syringe-and-tubing baseline fluid resistance experiment.',
      'Tue (2 hrs — Blueprinting & Numerical Modeling): Analyze why capillaries present unique engineering challenges; examining microscopic capillary beds and diffusion mechanics under magnification.',
      'Wed (2 hrs — Biomedical Maker Studio): Activity 1.6 — Material audit of medical-grade silicone vs. standard classroom tubing.',
      'Thu (2 hrs — Stress Testing & Failure Analysis): Synthesize user research into an Empathy Map for the patient; drafting patient-centric user profiles focusing on extremities (fingers/toes).',
      'Fri (2 hrs — Design Critique & Clinical Reflection): Phase 1 Pin-Up — Teams present their patient needs analysis and system criteria boards.'
    ],
    evidence: [
      'Activity 1.5 Syringe-and-Tubing Baseline Fluid Resistance Data Table',
      'Microscopic Capillary Diffusion & Parallel Branching Notes',
      'Activity 1.6 Medical-Grade Silicone vs. Classroom Tubing Material Audit',
      'Pediatric Patient Empathy Map & Phase 1 Pin-Up Review Board'
    ],
    aiPromptStarters: [
      'Explain Hagen-Poiseuille fluid resistance in simple terms: why does halving a tube’s diameter make it much harder to push water through?',
      'Help us compare the properties of medical-grade silicone tubing against standard PVC aquarium tubing and drinking straws.'
    ],
    competencies: ['ctps-01', 'sea-02', 'ec-02'],
    stretchCompetencies: ['ct-01', 'sdl-01'],
    sessions: [
      {
        sessionNumber: 3,
        week: 2,
        title: 'Week 2 (Mon–Wed): Hydraulic Resistance Lab, Capillary Beds & Material Biocompatibility Audit',
        durationMin: 360,
        learningGoal: 'Measure how tube diameter and length affect hydraulic pressure and flow rate, analyze microscopic capillary diffusion, and compare biological/medical materials against classroom supplies.',
        activities: [
          'Monday (2 hrs — Anatomy & Fluid Dynamics Concept Lab): Activity 1.5 — Simple syringe-and-tubing baseline fluid resistance experiment; compare force required and flow rate (mL/sec) through 8mm tubing vs. 6mm tubing vs. 2.5mm drinking straws.',
          'Tuesday (2 hrs — Blueprinting & Numerical Modeling): Analyze why capillary beds present unique engineering challenges; examine microscopic capillary networks under magnification and model why splitting one large tube into many tiny parallel straws changes flow velocity and pressure.',
          'Wednesday (2 hrs — Biomedical Maker Studio): Activity 1.6 — Material audit of medical-grade silicone vs. standard classroom aquarium tubing, latex/nitrile gloves, balloons, straws, and duct tape (elasticity, wall compliance, kink resistance, and seal adhesion).'
        ],
        learnerChoices: {
          question: 'Which fluid-dynamics variable will your pod test as the primary independent variable in Activity 1.5?',
          options: [
            {
              id: 'choice-diameter-poiseuille',
              label: 'Internal Tube Diameter (8mm Macro-Tube vs. 2.5mm Micro-Straw)',
              description: 'Measure how narrowing tube radius dramatically increases hydraulic resistance.'
            },
            {
              id: 'choice-length-bends',
              label: 'Tube Length & 90-Degree Bend Count (Short Arm Path vs. 135cm Toe Path)',
              description: 'Quantify pressure loss over distance and sharp corners en route to the toes.'
            },
            {
              id: 'choice-parallel-branching',
              label: 'Single Straw vs. 5-Straw Parallel Capillary Split-Off Manifold',
              description: 'Test how parallel branching reduces bottleneck resistance compared to a single narrow straw.'
            }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Record your Activity 1.5 Syringe Fluid Resistance Data Table (tube diameter, length, push time, mL/sec) and Activity 1.6 Material Audit Matrix.',
          targetCompetencies: ['ctps-01', 'ct-01', 'sdl-01']
        },
        reflectionPrompt: 'Why does a single narrow straw resist water flow so much strongly than a wide tube, yet human capillaries are microscopic? How does branching into thousands of parallel capillaries solve this in the body?',
        teacherTips: 'Have teams time how long it takes to push 50 mL of water through different tube diameters with steady thumb pressure so they feel hydraulic resistance firsthand.'
      },
      {
        sessionNumber: 4,
        week: 2,
        title: 'Week 2 (Thu–Fri): Pediatric Patient Empathy Map & Phase 1 Pin-Up Review',
        durationMin: 240,
        learningGoal: 'Synthesize physiological research into a patient-centric Empathy Map and defend Phase 1 User Need & System Criteria boards.',
        activities: [
          'Thursday (2 hrs — Stress Testing & Failure Analysis): Synthesize clinical research into a Patient Empathy Map and User Profile (fictional pediatric patient persona) focusing on daily comfort, mobility, and saving fingers and toes from ischemia.',
          'Friday (2 hrs — Design Critique & Clinical Reflection): Phase 1 Pin-Up Review — Teams present their patient needs analysis, annotated vascular maps, and initial system criteria boards for peer and coach critique.'
        ],
        learnerChoices: {
          question: 'How will your team format its Phase 1 Pin-Up User Need & System Criteria Board?',
          options: [
            {
              id: 'choice-clinical-case-board',
              label: 'Hospital Case File & Annotated Extremity Perfusion Map',
              description: 'Present a structured clinical chart pairing patient symptoms with target vascular flow benchmarks.'
            },
            {
              id: 'choice-visual-story-cards',
              label: 'Illustrated Patient Journey & Tap-to-Choose Empathy Cards (Age 9–11 Friendly)',
              description: 'Use visual storyboards and annotated body diagrams to explain why every finger and toe needs steady flow.'
            }
          ]
        },
        evidenceToCollect: {
          kind: 'feedback',
          prompt: 'Log peer and coach feedback from your Friday Phase 1 Pin-Up Review along with your completed Patient Empathy Map.',
          targetCompetencies: ['sea-02', 'ec-02', 'lc-02']
        },
        reflectionPrompt: 'What insight from your Patient Empathy Map changed how your team thinks about safety and reliability in a medical device?',
        teacherTips: 'All patient personas must be explicitly fictional synthetic fixtures. Remind students that medical engineers design for real human vulnerability.'
      }
    ]
  },
  {
    id: 'define',
    title: 'Phase 2: DEFINE — Technical Constraints & System Architecture (Weeks 3–4)',
    strap: 'Phase Focus: Translating medical requirements into strict engineering constraints and drafting the "How Might We" problem statement. (Weeks 3–4 • 20 Hours)',
    weeks: [3, 4],
    goal: 'Formulate the "How Might We" challenge statement, establish the 3 mandatory closed-loop requirements (closed loop, lung-oxygenation station, manual pump), audit classroom supplies, calculate pump displacement volume vs. total tubing capacity, establish airtight joint-sealing protocols, and pass Phase Gate 1: Design Brief Sign-Off.',
    tasks: [
      'Week 3 Mon–Wed: Activity 2.1 ("How Might We" challenge statement), mandatory 3 core criteria (closed loop, lung-oxygenation station, manual pump), and Activity 2.2 (Materials audit of aquarium tubing, balloons, duct tape, and straws).',
      'Week 3 Thu–Fri: Quantitative success metrics (zero leaks, 100% extremity reach, visible return flow) and Risk Matrix brainstorming (pressure loss at junctions, backflow).',
      'Week 4 Mon–Wed: Map fluid entry/exit through the lung station, Activity 2.3 (Estimating pump displacement volume vs. total tubing capacity), and QC assembly protocols for airtight duct-tape/rubber-band seals.',
      'Week 4 Thu–Fri: Write the comprehensive Engineering Design Brief & Constraints List and pass Phase Gate 1: Design Brief Sign-Off.'
    ],
    evidence: [
      'Activity 2.1 "How Might We" Statement & 3 Mandatory Closed-Loop Criteria',
      'Activity 2.2 Classroom Materials Audit & 5x5 Engineering Risk Matrix',
      'Activity 2.3 Pump Displacement vs. Total Tubing Volume Calculation Sheet',
      'Phase Gate 1 Signed Engineering Design Brief & Seal QC Protocol'
    ],
    aiPromptStarters: [
      'Show us how to calculate the internal volume in milliliters of a cylindrical tube given its inner diameter in millimeters and length in centimeters.',
      'Help us build a failure-mode risk matrix for a pressurized closed-loop water network built from aquarium tubing, straws, and duct tape.'
    ],
    competencies: ['ctps-02', 'ct-01', 'ec-01', 'sdl-02'],
    stretchCompetencies: ['ent-01', 'lc-03'],
    sessions: [
      {
        sessionNumber: 5,
        week: 3,
        title: 'Week 3 (Mon–Wed): "How Might We" Framing, Mandatory Loop Criteria & Classroom Supply Audit',
        durationMin: 360,
        learningGoal: 'Draft the core "How Might We" design statement, lock in the three non-negotiable closed-loop requirements, and audit the mechanical limits of the provided supply kit.',
        activities: [
          'Monday (2 hrs — Anatomy & Fluid Dynamics Concept Lab): Activity 2.1 — Draft the "How Might We" (HMW) challenge statement for a pressurized, leak-proof closed-loop circulatory system built from basic flexible classroom materials.',
          'Tuesday (2 hrs — Blueprinting & Numerical Modeling): Define the 3 mandatory system requirements: (1) 100% Closed-Loop circulation (fluid returns to the heart pump without spilling), (2) Mandatory passage through a Lung-Oxygenation Station, and (3) Manual Heart Pump operation reaching all fingers and toes.',
          'Wednesday (2 hrs — Biomedical Maker Studio): Activity 2.2 — Hands-on materials stress audit of aquarium tubing, latex/nitrile gloves, balloons, duct tape, rubber bands, and plastic straws under wet pressurization.'
        ],
        learnerChoices: {
          question: 'Which primary joint-sealing architecture will your pod standardize on during Activity 2.2?',
          options: [
            {
              id: 'choice-stepped-sleeve-seal',
              label: 'Concentric Tubing Sleeve + Tensioned Rubber-Band Collar + Duct-Tape Armor',
              description: 'Insert narrower tubing 25mm inside wider tubing, compress with a doubled rubber band, and wrap in lapped duct tape.'
            },
            {
              id: 'choice-manifold-bundle-seal',
              label: 'Bundled Straw Capillary Plug + Hot-Compression Tape Cuff',
              description: 'Pack 5 micro-straws with a central core seal inside main arterial tubing to prevent inter-straw weeping.'
            }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Submit your final "How Might We" statement (Activity 2.1) and your Activity 2.2 Classroom Materials Failure-Limit Audit.',
          targetCompetencies: ['ctps-02', 'sdl-02', 'ent-01']
        },
        reflectionPrompt: 'Why does standard duct tape lose grip when wet, and how can mechanical compression (like rubber bands and overlapped sleeves) prevent leaks before water ever touches the adhesive?',
        teacherTips: 'Have students test a taped joint underwater or under syringe pressure during Wednesday’s lab so they discover early that loose tape alone leaks.'
      },
      {
        sessionNumber: 6,
        week: 3,
        title: 'Week 3 (Thu–Fri): Quantitative Benchmarks & Engineering Risk Matrix',
        durationMin: 240,
        learningGoal: 'Set quantitative benchmarks for zero leaks, 100% extremity reach, and visible return flow, and build a failure-mode risk matrix.',
        activities: [
          'Thursday (2 hrs — Stress Testing & Failure Analysis): Establish quantitative success metrics — 0 mL/min joint leakage ("zero aneurysms"), 100% perfusion across all 20 digits (10 fingers + 10 toes) within 30 seconds of pumping, and continuous visible venous return.',
          'Friday (2 hrs — Design Critique & Clinical Reflection): Risk matrix brainstorming — Map likelihood and severity of junction blowouts, straw kinking, air-lock bubbles, and retrograde backflow.'
        ],
        learnerChoices: {
          question: 'Which engineering risk will your pod designate as its #1 mitigation priority in the Risk Matrix?',
          options: [
            {
              id: 'choice-risk-backflow',
              label: 'Retrograde Backflow & Clean/Dirty Fluid Mixing',
              description: 'Prioritize check-valve placement at ventricular outlets and venous return junctions.'
            },
            {
              id: 'choice-risk-distal-dryness',
              label: 'Distal Toe Hypoperfusion ("Dry Toes" from Pressure Drop)',
              description: 'Prioritize low-resistance trunk routing and high-displacement ventricular pumping.'
            },
            {
              id: 'choice-risk-aneurysm',
              label: 'High-Pressure Bifurcation Blowout ("Structural Aneurysm")',
              description: 'Prioritize multi-stage strain relief and pressure-tested junction cuffs.'
            }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Upload your Quantitative Success Metrics Table and 5x5 Engineering Failure Risk Matrix.',
          targetCompetencies: ['ctps-02', 'ct-01', 'lc-03']
        },
        reflectionPrompt: 'In a closed hydraulic loop, why does a single leak near the heart pump immediately prevent fluid from reaching the toes?',
        teacherTips: 'Guide students to see that pressure loss upstream starves the highest-resistance downstream branches first.'
      },
      {
        sessionNumber: 7,
        week: 4,
        title: 'Week 4 (Mon–Wed): Pulmonary Circuit Node, Stroke Volume Math & Leak-Prevention QC Standards',
        durationMin: 360,
        learningGoal: 'Map fluid entry/exit pathways through the lung station, calculate theoretical pump displacement vs. total system volume, and write quality-control sealing standards.',
        activities: [
          'Monday (2 hrs — Anatomy & Fluid Dynamics Concept Lab): Map fluid entry and exit pathways through the lung-oxygenation station; design the pulmonary circuit integration node on paper schematics (Right Heart -> Pulmonary Artery -> Lung Chamber -> Pulmonary Vein -> Left Heart/Systemic Aorta).',
          'Tuesday (2 hrs — Blueprinting & Numerical Modeling): Activity 2.3 — Calculate theoretical total fluid volume of the vascular network ($V = \\sum \\pi r_i^2 L_i$ plus lung reservoir volume) vs. single-stroke pump displacement volume ($mL/stroke$) to determine how many strokes complete one full circulation cycle.',
          'Wednesday (2 hrs — Biomedical Maker Studio): Establish Quality Control (QC) standards for leak prevention; draft step-by-step assembly protocols for airtight duct-tape and rubber-band seals.'
        ],
        learnerChoices: {
          question: 'How will your pod configure the Lung-Oxygenation Station in your circuit architecture?',
          options: [
            {
              id: 'choice-lung-series-baffle',
              label: 'Sealed Series Oxygenation Reservoir with Baffle Path',
              description: 'All pumped fluid passes through a sealed transparent lung chamber with internal oxygenation baffles before entering the Aorta.'
            },
            {
              id: 'choice-lung-dual-loop',
              label: 'Anatomical Dual-Loop (Right Pulmonary Pump + Left Systemic Pump)',
              description: 'Separate right-side pulmonary perfusion from left-side high-pressure systemic perfusion across twin pump chambers.'
            }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Submit your Activity 2.3 Volumetric & Stroke-Volume Calculation Sheet and your Quality Control Seal Assembly Protocol.',
          targetCompetencies: ['ct-01', 'ct-02', 'sdl-02']
        },
        reflectionPrompt: 'If your total tubing and lung reservoir hold 450 mL of blood and your manual pump displaces 45 mL per squeeze, how many ideal strokes are required for one red blood cell to complete the loop—and why will real strokes take more?',
        teacherTips: 'Check students’ unit conversions ($1\\text{ cm}^3 = 1\\text{ mL}$, radius in cm vs. mm) during Activity 2.3.'
      },
      {
        sessionNumber: 8,
        week: 4,
        title: 'Week 4 (Thu–Fri): Engineering Specification Brief & Phase Gate 1 Sign-Off',
        durationMin: 240,
        learningGoal: 'Compile the comprehensive team Engineering Design Brief and pass formal Phase Gate 1 Mentor Sign-Off.',
        activities: [
          'Thursday (2 hrs — Stress Testing & Failure Analysis): Write the comprehensive Engineering Design Brief and Constraints List (target pressures, tubing lengths, branch counts, lung station volume, and QC inspection checklist).',
          'Friday (2 hrs — Design Critique & Clinical Reflection): Pass Phase Gate 1: Design Brief Sign-Off — Formal mentor/coach review and sign-off on team technical specifications before Ideation & Prototyping.'
        ],
        learnerChoices: {
          question: 'Which verification artifact will your pod present alongside the written Design Brief at Phase Gate 1?',
          options: [
            {
              id: 'choice-gate1-proof-joint',
              label: 'Live 100-mmHg Pressure-Tested Sample Bifurcation Joint',
              description: 'Demonstrate a physical 1-to-3 tubing-to-straw joint holding water under pressure with zero drips.'
            },
            {
              id: 'choice-gate1-volume-model',
              label: 'Interactive Spreadsheet / Digital Volumetric & Flow Budget Model',
              description: 'Present a complete branch-by-branch volume and resistance budget for all 5 vascular zones.'
            }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Upload your finalized Phase Gate 1 Engineering Design Brief & Mentor Sign-Off Checklist.',
          targetCompetencies: ['ec-01', 'sdl-03', 'ctps-02']
        },
        reflectionPrompt: 'What specification in your Design Brief required the toughest compromise between anatomical realism and classroom material limits?',
        teacherTips: 'Require every pod to have an explicit volumetric calculation and lung-station diagram before signing off on Phase Gate 1.'
      }
    ]
  },
  {
    id: 'ideate',
    title: 'Phase 3: IDEATE — Sketching, Pumping Strategy & Valve Innovation (Weeks 5–6)',
    strap: 'Phase Focus: Brainstorming pump designs, vessel split-off strategies, and backflow prevention mechanisms before building. (Weeks 5–6 • 20 Hours)',
    weeks: [5, 6],
    goal: 'Compare glove vs. balloon vs. syringe pump stroke volumes (Activity 3.1), engineer one-way check-valves using rubber flaps or pinched straws (Activity 3.2), design aorta-to-capillary split-off geometries, map the full vascular tree on a life-size body template (Activity 3.3), select the winning architecture via a Pugh Matrix, and finalize blueprints and pod toolkits.',
    tasks: [
      'Week 5 Mon–Wed: Activity 3.1 (Comparative stroke volume testing using latex/nitrile gloves and balloons), Activity 3.2 (Engineering makeshift check-valves using rubber flaps or pinched straws), and sketching aorta-to-capillary split-off geometries.',
      'Week 5 Thu–Fri: Activity 3.3 (Drafting scaled anatomical vessel routing schematics on life-size body templates) and Pugh Matrix evaluation to select the winning pump and valve strategy.',
      'Week 6 Mon–Wed: Finalize the architectural fluid layout blueprint, plan integration of the lung oxygenation exposure chamber, and calculate pressure distribution across multi-branch straw networks.',
      'Week 6 Thu–Fri: Conduct a pre-build peer design review for bottlenecks/dead ends and organize pre-cut component toolkits per student pod.'
    ],
    evidence: [
      'Activity 3.1 Glove vs. Balloon vs. Syringe Stroke-Volume Comparison Table',
      'Activity 3.2 One-Way Check-Valve Prototype & Backflow Test Log',
      'Activity 3.3 Life-Size Body Template Vascular Routing Schematic & Pugh Matrix',
      'Deliverable #2 Scaled Biomedical Engineering Blueprint & Multi-Branch Pressure Model'
    ],
    aiPromptStarters: [
      'How can we build a reliable one-way check valve using only aquarium tubing, cut balloon membranes, drinking straws, and rubber bands?',
      'Help us structure a Pugh Decision Matrix to compare a glove pump, a double-balloon pump, and a syringe pump across stroke volume, recoil speed, and leak risk.'
    ],
    competencies: ['ctps-03', 'ct-04', 'ec-02', 'lc-02'],
    stretchCompetencies: ['ent-02', 'sdl-03'],
    sessions: [
      {
        sessionNumber: 9,
        week: 5,
        title: 'Week 5 (Mon–Wed): Pump Stroke-Volume Testing, Check-Valve Innovation & Macro-to-Micro Split-Offs',
        durationMin: 360,
        learningGoal: 'Empirically compare manual pump mechanisms, engineer one-way check-valves to prevent backflow, and design low-loss macro-to-micro vessel split-offs.',
        activities: [
          'Monday (2 hrs — Anatomy & Fluid Dynamics Concept Lab): Activity 3.1 — Comparative stroke-volume and recoil testing using latex/nitrile gloves, thick-wall balloons, and syringes; measure displaced mL per squeeze and refill speed.',
          'Tuesday (2 hrs — Blueprinting & Numerical Modeling): Activity 3.2 — Tackle the backflow problem (one-way flow mechanics) by engineering makeshift check-valves using cut-balloon rubber flaps, angled pinched straws, or bead-in-cone seats.',
          'Wednesday (2 hrs — Biomedical Maker Studio): Design the transition from macro-vessels (8mm/6mm aquarium tubing) to micro-vessels (2.5mm capillary straws); sketch and test aorta-to-capillary split-off manifolds.'
        ],
        learnerChoices: {
          question: 'Which pump and check-valve pairing will your pod prototype for your primary ventricular unit?',
          options: [
            {
              id: 'choice-balloon-flap',
              label: 'Double-Wall Balloon Ventricle + Cut-Balloon Flap Check-Valves',
              description: 'High elastic suction on diastole paired with low-resistance silicone/rubber flap leaflets.'
            },
            {
              id: 'choice-glove-duckbill',
              label: 'Multi-Port Glove Ventricle + Angled Pinched-Straw Duckbill Valves',
              description: 'Uses glove fingers as natural arterial/venous manifolds with inline duckbill straw check-valves.'
            },
            {
              id: 'choice-hybrid-bottle-bead',
              label: 'Balloon-in-Bottle Chamber + Tapered Bead Check-Valves',
              description: 'Protected ventricular housing with positive-sealing mechanical ball check-valves.'
            }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Submit your Activity 3.1 Pump Stroke-Volume Comparison Table and photos/diagrams of your Activity 3.2 Check-Valve bench test.',
          targetCompetencies: ['ctps-03', 'ct-02', 'sdl-03']
        },
        reflectionPrompt: 'What happened when you squeezed your pump without a check-valve installed, and how do human mitral and aortic valves solve this exact problem?',
        teacherTips: 'Have teams measure reverse leak volume (mL flowing backward over 10 seconds of back-pressure) to score their Activity 3.2 check-valves objectively.'
      },
      {
        sessionNumber: 10,
        week: 5,
        title: 'Week 5 (Thu–Fri): Life-Size Vascular Tree Template Mapping & Pugh Matrix Selection',
        durationMin: 240,
        learningGoal: 'Draft scaled anatomical vessel routing on a life-size human body template and select the winning system architecture using a Pugh Decision Matrix.',
        activities: [
          'Thursday (2 hrs — Stress Testing & Failure Analysis): Activity 3.3 — Draft scaled anatomical vessel routing schematics directly onto life-size human body templates, marking heart pump coordinates, lung station cavity, arterial trunks, and 20 finger/toe capillary beds.',
          'Friday (2 hrs — Design Critique & Clinical Reflection): Evaluate competing pump, valve, and branching designs using a weighted Pugh Decision Matrix (scoring stroke volume, backflow prevention, leak resistance, and ease of repair).'
        ],
        learnerChoices: {
          question: 'How will your pod route venous return from the lower extremities (toes) back to the heart on your life-size template?',
          options: [
            {
              id: 'choice-dual-venous-saphenous',
              label: 'Anatomical Parallel Return (Great Saphenous + Deep Femoral/Iliac Trunk -> Inferior Vena Cava)',
              description: 'Uses two parallel venous return channels per leg to halve return resistance and prevent toe pooling.'
            },
            {
              id: 'choice-central-ivc-manifold',
              label: 'Unified Wide-Bore Inferior Vena Cava Collector Manifold',
              description: 'Merges all 10 toe capillaries into a low-resistance 8mm central venous return spine with inline venous check-valves.'
            }
          ]
        },
        evidenceToCollect: {
          kind: 'media',
          prompt: 'Upload a photo of your Activity 3.3 Life-Size Body Template Routing Schematic and your completed Pugh Decision Matrix.',
          targetCompetencies: ['ctps-03', 'ec-02', 'ct-04']
        },
        reflectionPrompt: 'Why do human leg veins require one-way venous valves every few centimeters whereas arteries do not?',
        teacherTips: 'Point out the Great Saphenous, Femoral, and Anterior/Posterior Tibial veins on the Circulatory System diagram so students see how venous blood climbs back against gravity.'
      },
      {
        sessionNumber: 11,
        week: 6,
        title: 'Week 6 (Mon–Wed): Final Fluid Blueprint, Lung Chamber Design & Bifurcation Pressure Drop Math',
        durationMin: 360,
        learningGoal: 'Finalize the architectural fluid layout blueprint, engineer the lung oxygenation chamber, and calculate pressure distribution across multi-branch straw networks.',
        activities: [
          'Monday (2 hrs — Anatomy & Fluid Dynamics Concept Lab): Finalize the architectural fluid layout blueprint (CAD or precision manual schematic) detailing exact vessel diameters (mm), segment lengths (cm), and junction callouts.',
          'Tuesday (2 hrs — Blueprinting & Numerical Modeling): Plan the integration of the lung-oxygenation station; design the fluid exposure chamber (entry diffuser, gas-exchange visual indicator, and bubble-trap exit port) to prevent air embolisms in downstream straws.',
          'Wednesday (2 hrs — Biomedical Maker Studio): Calculate pressure distribution across multi-branch networks; estimate hydraulic head loss across 1-to-2 and 1-to-5 straw bifurcations so distal toes receive sufficient perfusion pressure.'
        ],
        learnerChoices: {
          question: 'What visual mechanism will your Lung-Oxygenation Station use to demonstrate pulmonary gas exchange?',
          options: [
            {
              id: 'choice-lung-aeration-chamber',
              label: 'Transparent Alveolar Baffle Reservoir with Air-Diffuser Stone / Oxygenation Indicator',
              description: 'Shows venous return entering top baffles, passing across simulated alveolar air channels, and exiting via the pulmonary vein.'
            },
            {
              id: 'choice-lung-dual-color-window',
              label: 'Dual-Chamber Pulmonary Capillary Window (Blue Venous Inflow -> Red Arterial Outflow)',
              description: 'Models capillary gas-exchange surface area across parallel micro-tubes inside a clear lung housing.'
            }
          ]
        },
        evidenceToCollect: {
          kind: 'code',
          prompt: 'Submit your Final Scaled Biomedical Engineering Blueprint (Deliverable #2 draft) and Multi-Branch Pressure Distribution Calculations.',
          targetCompetencies: ['ct-04', 'ec-05', 'ctps-03']
        },
        reflectionPrompt: 'Why is trapping air bubbles inside the lung reservoir before blood enters the Aorta critical for preventing "air embolism" blockages in your narrow toe straws?',
        teacherTips: 'Explain that surface tension in narrow 2.5mm straws can lock an air bubble in place—acting just like a vascular embolism!'
      },
      {
        sessionNumber: 12,
        week: 6,
        title: 'Week 6 (Thu–Fri): Peer Blueprint Critique & Pod Toolkit Inventory Readiness',
        durationMin: 240,
        learningGoal: 'Conduct a rigorous pre-build peer design review to eliminate dead ends and organize pre-cut component toolkits for Week 7 fabrication.',
        activities: [
          'Thursday (2 hrs — Stress Testing & Failure Analysis): Pre-build design review with peers — Audit partner pods’ blueprints for dead ends, unvalved shunt loops, sharp 90-degree kinks, and under-sized venous return trunks.',
          'Friday (2 hrs — Design Critique & Clinical Reflection): Finalize build plans, pre-cut and label tubing segments by anatomical name, and organize component toolkits per student pod.'
        ],
        learnerChoices: {
          question: 'How will your 3-student pod divide primary leadership roles entering Phase 4 Fabrication?',
          options: [
            {
              id: 'choice-pod-division-standard',
              label: 'Cardiopulmonary Lead (Pump/Lung) + Vascular Routing Lead (Arteries/Veins) + Seal & Telemetry Lead (QC/Audits)',
              description: 'Clear subsystem ownership with shared integration testing every Thursday.'
            },
            {
              id: 'choice-pod-division-regional',
              label: 'Upper-Body & Heart Lead + Lower-Extremity & Venous Return Lead + Blueprint & Clinical Data Lead',
              description: 'Divides physical board assembly by anatomical region to allow parallel tubing installation.'
            }
          ]
        },
        evidenceToCollect: {
          kind: 'feedback',
          prompt: 'Log peer blueprint critique findings (bottlenecks/dead-ends identified and fixed) and your Pod Material Inventory Checklist.',
          targetCompetencies: ['lc-02', 'ec-02', 'sdl-03']
        },
        reflectionPrompt: 'What potential bottleneck or dead-end did another team spot on your blueprint that would have caused a failure during Week 7 assembly?',
        teacherTips: 'Ensure every pod labels their pre-cut tubes with masking-tape flags (e.g., "Femoral Artery - 32cm", "Superior Vena Cava - 18cm") before Friday dismissal.'
      }
    ]
  },
  {
    id: 'prototype',
    title: 'Phase 4: PROTOTYPE — Building the External Support System (Weeks 7–9)',
    strap: 'Phase Focus: Constructing the full-scale physical circulatory model on the human body cut-out and integrating fluid flow. (Weeks 7–9 • 30 Hours)',
    weeks: [7, 9],
    goal: 'Transfer blueprints to the life-size body cut-out, assemble primary arterial lines (Activity 4.1) and straw capillary beds, run the Joint-Sealing Bootcamp (Activity 4.2), integrate the manual heart pump (Activity 4.3) and lung-oxygenation reservoir, prime the closed loop with dyed blood (Activity 4.4), calibrate stroke cadence, eliminate dead zones, and freeze Prototype V1.0.',
    tasks: [
      'Week 7 (Chassis Assembly & Vascular Network Construction): Transfer blueprints to body cut-out, Activity 4.1 (Assembling primary arterial pathways), fabricate straw capillary split-offs in fingers/toes, Activity 4.2 (Joint-sealing bootcamp), and sub-assembly check.',
      'Week 8 (Pump Integration & Lung Station Setup): Activity 4.3 (Attach manual glove/balloon heart pump), install lung-oxygenation reservoir station, Activity 4.4 (Funnel priming with dyed blood), dry-run pumping tests, and emergency patching.',
      'Week 9 (System Calibration & Prototype Freeze V1.0): Calibrate stroke frequency against return speed, optimize check-valves, eliminate limb dead zones, run final pre-test leak audits, and freeze Prototype V1.0.'
    ],
    evidence: [
      'Activity 4.1 & 4.2 Mounted Vascular Network & Joint-Sealing Inspection Log',
      'Activity 4.3 & 4.4 Integrated Heart Pump, Lung Station & Dyed Fluid Priming Media',
      'Week 9 Stroke Cadence Calibration & Dead-Zone Elimination Notes',
      'Official Prototype V1.0 Freeze Sign-Off & Baseline Telemetry Sheet'
    ],
    aiPromptStarters: [
      'Why do air bubbles trapped in narrow capillary straws block water flow, and how can we purge air pockets when priming a closed hydraulic loop?',
      'Help us diagnose why fluid is reaching the fingers on our prototype board but stopping halfway down the femoral/tibial tubes toward the toes.'
    ],
    competencies: ['ctps-04', 'sdl-04', 'lc-05', 'ec-04'],
    stretchCompetencies: ['ct-05', 'sea-03'],
    sessions: [
      {
        sessionNumber: 13,
        week: 7,
        title: 'Week 7 (Mon–Wed): Body Cut-Out Transfer, Main Arterial Lines & Straw Capillary Beds',
        durationMin: 360,
        learningGoal: 'Mount the base vascular layout onto the physical human body cut-out, connect main arterial trunks, and fabricate 20-digit straw capillary split-off networks.',
        activities: [
          'Monday (2 hrs — Anatomy & Fluid Dynamics Concept Lab): Transfer scaled anatomical blueprints onto the rigid life-size human body cut-out board; anchor mounting clips for the heart cavity, lung station, and limb trunks.',
          'Tuesday (2 hrs — Blueprinting & Numerical Modeling): Activity 4.1 — Assemble primary arterial tubing pathways (Aortic Arch, Carotid, Subclavian, Brachial, Descending Aorta, Iliac, and Femoral arteries) using aquarium tubing and Y/T connectors.',
          'Wednesday (2 hrs — Biomedical Maker Studio): Fabricate capillary split-off networks using thin straws; integrate 5-straw arrays into both hands (fingers) and both feet (toes) and connect them to venous return collectors (Palmar/Dorsal Digital veins -> Saphenous/Tibial/Brachial -> Vena Cava).'
        ],
        learnerChoices: {
          question: 'How will your pod construct the 1-to-5 capillary straw manifolds in the hands and feet?',
          options: [
            {
              id: 'choice-capillary-arcade',
              label: 'Anatomical Palmar/Plantar Arch Loop with 5 Parallel Digital Straw Loops',
              description: 'Forms a continuous arterial arch that feeds 5 U-shaped finger/toe capillary loops into a dorsal venous arch.'
            },
            {
              id: 'choice-capillary-star-manifold',
              label: 'Sealed 5-Straw Bundle Splitter -> Micro-Return Chamber',
              description: 'Splits the main limb artery into 5 parallel digital straws that discharge into a transparent fingertip/toe-tip return manifold.'
            }
          ]
        },
        evidenceToCollect: {
          kind: 'media',
          prompt: 'Upload photos of your Activity 4.1 Primary Arterial Trunk assembly and 20-Digit Straw Capillary Split-Off networks mounted on the body cut-out.',
          targetCompetencies: ['ctps-04', 'lc-05', 'sdl-04']
        },
        reflectionPrompt: 'When splitting one arterial tube into five narrow finger or toe straws, why must all five paths have similar resistance if you want every digit to receive fluid?',
        teacherTips: 'Remind students that fluid takes the path of least resistance—if one straw is shorter or wider than the other four, it will steal all the flow!'
      },
      {
        sessionNumber: 14,
        week: 7,
        title: 'Week 7 (Thu–Fri): Joint-Sealing Bootcamp & Sub-Assembly Integrity Verification',
        durationMin: 240,
        learningGoal: 'Apply multi-layer airtight seals using duct tape and rubber bands at all high-pressure junctions and pass the sub-assembly mechanical integrity check.',
        activities: [
          'Thursday (2 hrs — Stress Testing & Failure Analysis): Activity 4.2 — Joint-Sealing Bootcamp focusing on high-pressure connection points (Aortic root, Brachial/Femoral splits, and straw-to-tubing transitions) using tensioned rubber bands and lapped duct-tape cuffs.',
          'Friday (2 hrs — Design Critique & Clinical Reflection): Sub-assembly integrity check — Inspect physical layout rigidity, verify zero kinked bends on the body board, and check alignment against the Deliverable #2 blueprint.'
        ],
        learnerChoices: {
          question: 'How will your pod test sub-assembly joints on Friday before full fluid priming next week?',
          options: [
            {
              id: 'choice-air-pressure-bubble-test',
              label: 'Dry Air-Syringe Pressurization + Soapy Water Bubble-Leak Check',
              description: 'Pressurize isolated limb sub-assemblies with air and brush joints with soapy water to spot micro-leaks before dyeing.'
            },
            {
              id: 'choice-sectional-water-test',
              label: 'Isolated Limb Hydrostatic Column Test',
              description: 'Fill individual arm and leg loops with clear water to verify seal tightness before connecting the central heart pump.'
            }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Log your Activity 4.2 Joint-Sealing Inspection Table (number of joints sealed, pre-test pass/fail count, and reinforcement notes).',
          targetCompetencies: ['sdl-04', 'ctps-04']
        },
        reflectionPrompt: 'Why is testing sub-assemblies with air or clear water before adding red/blue dyed blood a smart biomedical engineering practice?',
        teacherTips: 'Encourage pods to number every junction on their board (#J1 through #J24) so any leak during Week 8–10 can be logged by exact junction ID.'
      },
      {
        sessionNumber: 15,
        week: 8,
        title: 'Week 8 (Mon–Wed): Heart Pump Integration, Lung-Oxygenation Station & Closed-Loop Fluid Priming',
        durationMin: 360,
        learningGoal: 'Integrate the manual heart pump and lung-oxygenation reservoir station into the vascular network and prime the closed loop with dyed blood.',
        activities: [
          'Monday (2 hrs — Anatomy & Fluid Dynamics Concept Lab): Activity 4.3 — Securely attach the manual heart pump mechanism (glove/balloon/syringe) and one-way check-valves to the Vena Cava inflow, Pulmonary Artery outflow, and Aortic systemic trunk.',
          'Tuesday (2 hrs — Blueprinting & Numerical Modeling): Build and connect the Lung-Oxygenation Reservoir Station between the right outflow and left systemic inflow; verify airtight lid seals and bleed-valve positioning.',
          'Wednesday (2 hrs — Biomedical Maker Studio): Activity 4.4 — Funnel priming and initial fluid filling (dyed water representing blood) across the entire closed loop while purging trapped air pockets.'
        ],
        learnerChoices: {
          question: 'Where will your pod place its priming funnel and air-bleed port for Activity 4.4?',
          options: [
            {
              id: 'choice-prime-lung-reservoir',
              label: 'Top-Mounted Lung Station Fill Port + High-Point Cranial Air Bleed',
              description: 'Use the lung reservoir as the primary priming header while bleeding trapped air from the highest cranial loop.'
            },
            {
              id: 'choice-prime-vena-cava-tee',
              label: 'Superior Vena Cava Valved Priming Tee + Distal Toe Bleed Caps',
              description: 'Fill from the central venous trunk downward so rising fluid pushes air out through micro-caps at the toes.'
            }
          ]
        },
        evidenceToCollect: {
          kind: 'media',
          prompt: 'Upload photos/video documentation of Activity 4.3 Heart Pump & Lung Station integration and Activity 4.4 Closed-Loop Fluid Priming.',
          targetCompetencies: ['ctps-04', 'lc-05', 'ec-04']
        },
        reflectionPrompt: 'During Activity 4.4 priming, where did air bubbles get trapped in your vascular network, and how did trapped air affect fluid movement?',
        teacherTips: 'Keep spill trays under the bottom edge of the body boards during Wednesday priming and Thursday dry-run pumping!'
      },
      {
        sessionNumber: 16,
        week: 8,
        title: 'Week 8 (Thu–Fri): Preliminary Pumping Trials & Emergency Structural Patching',
        durationMin: 240,
        learningGoal: 'Conduct slow-stroke preliminary pumping trials to observe fluid propagation and execute emergency patching on immediate structural leaks.',
        activities: [
          'Thursday (2 hrs — Stress Testing & Failure Analysis): Preliminary dry-run/wet-run pumping tests — Perform slow-stroke manual pumping (30–40 strokes/min) to observe initial fluid propagation from the heart through the lung station to the arms and legs.',
          'Friday (2 hrs — Design Critique & Clinical Reflection): Address immediate structural flaws and massive leaks — Execute emergency patching and joint reinforcement on any junctions that wept or ballooned during initial pressurization.'
        ],
        learnerChoices: {
          question: 'When a high-pressure junction leaks during Thursday’s initial pumping trial, what is your pod’s standard repair protocol?',
          options: [
            {
              id: 'choice-repair-drain-resleeve',
              label: 'Drain Segment -> Dry Completely -> Add Internal Splint Tube + Double Rubber-Band & Tape Cuff',
              description: 'Addresses the root mechanical gap rather than wrapping wet tape over an active leak.'
            },
            {
              id: 'choice-repair-clamp-bypass',
              label: 'Clamp Upstream Artery -> Replace Faulty Tee with Molded Y-Reducer + Compression Wrap',
              description: 'Uses surgical hemostat/binder-clip clamping to isolate and swap the failed junction.'
            }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Submit your Week 8 Initial Propagation Observation Log and Emergency Joint Patch Report (listing Junction IDs repaired).',
          targetCompetencies: ['sdl-04', 'ctps-04', 'sea-03']
        },
        reflectionPrompt: 'Why does wrapping more duct tape over an already wet, leaking tube almost always fail, and what does this teach you about surgical vs. superficial repairs?',
        teacherTips: 'Highlight how clamping upstream vessels with binder clips during a repair mirrors real vascular surgery clamp techniques.'
      },
      {
        sessionNumber: 17,
        week: 9,
        title: 'Week 9 (Mon–Wed): Stroke Cadence Calibration, Valve Tuning & Eliminating Limb Dead Zones',
        durationMin: 360,
        learningGoal: 'Calibrate pump stroke frequency against venous return speed, tune check-valves to stop backflow, and reroute constricted tubing to eliminate stagnant dead zones in the limbs.',
        activities: [
          'Monday (2 hrs — Anatomy & Fluid Dynamics Concept Lab): Calibrate stroke frequency (BPM) against fluid return speed; find the optimal pumping cadence where ventricular refill matches venous return without collapsing the inflow tube.',
          'Tuesday (2 hrs — Blueprinting & Numerical Modeling): Optimize backflow prevention valves within the network; adjust rubber-flap tension and pinched-straw angles to prevent dirty venous fluid from rushing backward into the pump or lung chamber.',
          'Wednesday (2 hrs — Biomedical Maker Studio): Eliminate dead zones and stagnant fluid pockets in limbs; reroute constricted or sharply bent tubing so 100% of fingers and toes receive active pulsatile flow.'
        ],
        learnerChoices: {
          question: 'How will your pod resolve a stagnant "dead zone" where fluid reaches 3 toes on a foot but leaves 2 outer toes dry?',
          options: [
            {
              id: 'choice-deadzone-equalize-length',
              label: 'Trim & Equalize Straw Lengths + Widen Arcuate Arterial Header',
              description: 'Balances hydraulic resistance across all 5 digital branches so pressure divides evenly.'
            },
            {
              id: 'choice-deadzone-stepped-throttle',
              label: 'Add Slight Pinch-Collar Restrictor on Over-Perfused Inner Straws',
              description: 'Mimics precapillary sphincters in human arterioles by redirecting excess pressure to the outer toes.'
            }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Record your Week 9 Pump Cadence Calibration Curve (BPM vs. venous return stability) and Dead-Zone Rerouting Log.',
          targetCompetencies: ['ctps-05', 'ct-02', 'sdl-04']
        },
        reflectionPrompt: 'How does pinching an over-flowing branch to redirect blood to under-perfused toes mimic how real human arterioles constrict and dilate?',
        teacherTips: 'Connect students’ tubing adjustments directly to physiological vasoconstriction and vasodilation!'
      },
      {
        sessionNumber: 18,
        week: 9,
        title: 'Week 9 (Thu–Fri): Pre-Test Safety & Leak Audit and Prototype V1.0 Freeze',
        durationMin: 240,
        learningGoal: 'Conduct a comprehensive pre-test safety and seal inspection across all junctions and officially freeze Prototype V1.0 for Week 10 empirical stress testing.',
        activities: [
          'Thursday (2 hrs — Stress Testing & Failure Analysis): Conduct final pre-test safety and leak audits — Inspect every duct-tape cuff, rubber-band collar, check-valve seat, and lung reservoir port across a continuous 2-minute pumping run.',
          'Friday (2 hrs — Design Critique & Clinical Reflection): Freeze Prototype V1.0 construction — Photograph the locked-in V1.0 board, record baseline dimensions, and sign the Prototype V1.0 Freeze Declaration prior to formal Week 10 stress testing.'
        ],
        learnerChoices: {
          question: 'Which telemetry metrics will your pod baseline on Friday at Prototype V1.0 Freeze?',
          options: [
            {
              id: 'choice-v1-baseline-full',
              label: 'Full Clinical Panel (BPM, Time-to-Fingers, Time-to-Toes, Active Digit Count /20, Leak Count)',
              description: 'Establishes a complete quantitative baseline before Week 10 stress testing.'
            },
            {
              id: 'choice-v1-baseline-video-map',
              label: 'Time-Stamped Dye-Front Propagation Map + Junction Integrity Map',
              description: 'Maps exact dye arrival times at each anatomical landmark on the blueprint.'
            }
          ]
        },
        evidenceToCollect: {
          kind: 'media',
          prompt: 'Submit your official Prototype V1.0 Freeze photograph, junction map, and baseline pre-test check sheet.',
          targetCompetencies: ['sdl-04', 'ec-04', 'lc-05']
        },
        reflectionPrompt: 'Why do medical device engineers enforce a formal "Design Freeze" (V1.0) before running official stress audits?',
        teacherTips: 'Explain that without freezing V1.0 first, you cannot scientifically prove whether V2.0 changes in Week 11 actually improved performance.'
      }
    ]
  },
  {
    id: 'test',
    title: 'Phase 5: TEST & REFINE — Stress Testing, Failure Analysis & Iteration (Weeks 10–11)',
    strap: 'Phase Focus: Running rigorous stress tests, auditing leaks ("aneurysms"), measuring extremity reach, and iterating designs into Prototype V2.0. (Weeks 10–11 • 20 Hours)',
    weeks: [10, 11],
    goal: 'Execute the formal Reach Test on fingers and toes (Activity 5.1), Leak Audit for structural "aneurysms" (Activity 5.2), and Flow Audit for backflow mixing (Activity 5.3); quantify BPM vs. distal output; fabricate Prototype V2.0 upgrades (Activity 5.4: patching leaks, eliminating 90-degree bends, upgrading pump stroke volume); and lock in final V1.0 vs. V2.0 empirical datasets.',
    tasks: [
      'Week 10 Mon–Wed: Activity 5.1 (Formal Reach Test on fingers and toes), Activity 5.2 (Leak Audit across all joints for structural "aneurysms"), and Activity 5.3 (Flow Audit for backflow and mixing).',
      'Week 10 Thu–Fri: Quantify pump strokes/min vs. distal output volume and compile empirical V1.0 failure analysis reports.',
      'Week 11 Mon–Wed: Activity 5.4 (Redesign weak joints and patch blown seals), modify tubing geometry to eliminate sharp 90-degree bends, and upgrade manual pump stroke volume.',
      'Week 11 Thu–Fri: Re-run full system stress test protocols on Prototype V2.0 and lock in final empirical datasets for the Clinical Evaluation Report.'
    ],
    evidence: [
      'Activity 5.1, 5.2 & 5.3 Official Prototype V1.0 Reach, Leak ("Aneurysm") & Backflow Audit Logs',
      'Pump Cadence (BPM) vs. Distal Output Volume Curve & Failure Mode Debrief',
      'Activity 5.4 Prototype V2.0 Joint, Geometry & Pump Upgrade Documentation',
      'Comparative Prototype V1.0 vs. V2.0 Empirical Stress Test Dataset'
    ],
    aiPromptStarters: [
      'Help us analyze our Week 10 Stress Test table comparing Prototype V1.0 and V2.0 across time-to-reach toes, active digits perfused, and joint leak count.',
      'Why does eliminating sharp 90-degree bends in flexible tubing reduce local turbulence and boost pressure at the distal toes?'
    ],
    competencies: ['ctps-05', 'ct-05', 'sdl-04', 'ent-02'],
    stretchCompetencies: ['ec-05', 'sea-03'],
    sessions: [
      {
        sessionNumber: 19,
        week: 10,
        title: 'Week 10 (Mon–Wed): Formal Reach Test, Leak ("Aneurysm") Audit & Backflow Mixing Audit',
        durationMin: 360,
        learningGoal: 'Execute rigorous empirical stress tests on Prototype V1.0 measuring extremity reach, structural joint leaks ("aneurysms"), and backflow contamination.',
        activities: [
          'Monday (2 hrs — Anatomy & Fluid Dynamics Concept Lab): Activity 5.1 — Execute the formal Reach Test on fingers and toes; measure time-to-reach (seconds) and total fluid volume delivered to extremities, checking whether any toes remain dry due to weak pumps or narrow straw bottlenecks.',
          'Tuesday (2 hrs — Blueprinting & Numerical Modeling): Activity 5.2 — Conduct the Leak Audit across all system joints under sustained high-cadence pumping; identify and map structural "aneurysms" (ballooning cuffs) and duct-tape seal failures by Junction ID.',
          'Wednesday (2 hrs — Biomedical Maker Studio): Activity 5.3 — Perform the Flow Audit for backflow and mixing; trace fluid return through the Vena Cava and Lung Station to check for retrograde contamination or incomplete circulation cycles.'
        ],
        learnerChoices: {
          question: 'How will your pod stress-test Prototype V1.0 during Tuesday’s Activity 5.2 Leak ("Aneurysm") Audit?',
          options: [
            {
              id: 'choice-stress-exercise-cadence',
              label: 'Simulated Exercise Stress Test (60 -> 100 Strokes/Min High-Pressure Surge)',
              description: 'Tests whether junctions hold when heart rate doubles from resting cadence to peak physical exertion.'
            },
            {
              id: 'choice-stress-endurance-300',
              label: '300-Stroke Continuous Endurance Marathon Audit',
              description: 'Tests whether rubber-band and duct-tape seals creep or fatigue over 5 minutes of non-stop pumping.'
            }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Submit your official Week 10 Stress Audit Data Tables for Activity 5.1 (Reach Test), Activity 5.2 (Leak/Aneurysm Map), and Activity 5.3 (Backflow Audit).',
          targetCompetencies: ['ctps-05', 'ct-05', 'sdl-04']
        },
        reflectionPrompt: 'Where did your Prototype V1.0 experience its first "aneurysm" or seal failure under high-cadence pumping, and why was pressure highest at that location?',
        teacherTips: 'Remind students that honest failure logging is prized in biomedical engineering—discovering where V1.0 leaks is the exact goal of Week 10!'
      },
      {
        sessionNumber: 20,
        week: 10,
        title: 'Week 10 (Thu–Fri): Pressure vs. Distal Output Quantification & Failure Analysis Debrief',
        durationMin: 240,
        learningGoal: 'Quantify pump strokes per minute vs. distal output volume and compile the empirical V1.0 Failure Analysis Report to drive Week 11 redesign.',
        activities: [
          'Thursday (2 hrs — Stress Testing & Failure Analysis): Quantify system pressure and flow-rate limitations; record pump strokes per minute (30, 50, 70, 90 BPM) vs. distal output volume reaching the lower extremities.',
          'Friday (2 hrs — Design Critique & Clinical Reflection): Compile empirical failure analysis data reports; conduct a team debrief ranking V1.0 failure modes and locking in the top 3 redesign priorities for Prototype V2.0.'
        ],
        learnerChoices: {
          question: 'Which analytical chart will anchor your pod’s Friday V1.0 Failure Analysis Report?',
          options: [
            {
              id: 'choice-chart-bpm-flow',
              label: 'Pump Cadence (BPM) vs. Distal Extremity Perfusion Rate Curve',
              description: 'Shows the exact cadence where flow plateaus or valve backflow begins.'
            },
            {
              id: 'choice-chart-pareto-leaks',
              label: 'Junction Failure Pareto Chart & Anatomical Bottleneck Heatmap',
              description: 'Visualizes which vessel junctions and straw split-offs accounted for the majority of pressure loss.'
            }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Upload your BPM vs. Distal Flow Dataset and your prioritized Prototype V2.0 Redesign Plan.',
          targetCompetencies: ['ctps-05', 'ct-02', 'lc-05']
        },
        reflectionPrompt: 'Why did pumping faster beyond a certain BPM stop increasing flow to the toes (or even make flow worse)?',
        teacherTips: 'Connect high-BPM filling failure to real cardiac physiology: during extreme tachycardia, the ventricle doesn’t have enough diastolic time to refill!'
      },
      {
        sessionNumber: 21,
        week: 11,
        title: 'Week 11 (Mon–Wed): Rapid Iteration & Prototype V2.0 Fabrication (Seals, Geometry & Pump Upgrade)',
        durationMin: 360,
        learningGoal: 'Execute targeted engineering upgrades to build Prototype V2.0: reinforce high-stress junctions, eliminate sharp 90-degree bends, and upgrade manual pump stroke volume.',
        activities: [
          'Monday (2 hrs — Anatomy & Fluid Dynamics Concept Lab): Activity 5.4 — Redesign weak joint connections and split-off points; patch leaks, replace blown seals, and install strain-relieved stepped cuffs on high-stress junctions.',
          'Tuesday (2 hrs — Blueprinting & Numerical Modeling): Modify tubing geometry to reduce hydraulic resistance; shorten redundant tubing loops and replace sharp 90-degree kinks with sweeping anatomical curves to boost distal toe pressure.',
          'Wednesday (2 hrs — Biomedical Maker Studio): Upgrade manual pump mechanics and check-valves for higher stroke volume and faster elastic recoil.'
        ],
        learnerChoices: {
          question: 'Which primary engineering upgrade will define your Prototype V2.0 iteration?',
          options: [
            {
              id: 'choice-v2-sweeping-geometry',
              label: 'Low-Resistance Sweeping Iliac/Femoral Geometry + Parallel Capillary Header',
              description: 'Eliminates 90-degree bends and equalizes toe straw pressure to reach 100% distal perfusion.'
            },
            {
              id: 'choice-v2-double-ventricle',
              label: 'High-Recoil Double-Wall Ventricle + Precision Duckbill/Flap Valve Seat Upgrade',
              description: 'Boosts systolic pressure and eliminates retrograde backflow into the Vena Cava.'
            }
          ]
        },
        evidenceToCollect: {
          kind: 'media',
          prompt: 'Document your Activity 5.4 Prototype V2.0 structural, geometric, and pump/valve upgrades with before-and-after photos.',
          targetCompetencies: ['ctps-05', 'sdl-04', 'ent-02']
        },
        reflectionPrompt: 'How much did eliminating sharp 90-degree tubing bends improve fluid speed to the lower extremities?',
        teacherTips: 'Have teams update their Deliverable #2 Blueprint with redline "As-Built V2.0" annotations showing every geometry change.'
      },
      {
        sessionNumber: 22,
        week: 11,
        title: 'Week 11 (Thu–Fri): Prototype V2.0 Re-Test Audits & Final Clinical Dataset Lock-In',
        durationMin: 240,
        learningGoal: 'Re-run full Reach, Leak, and Flow stress test protocols on Prototype V2.0 and lock in comparative V1.0 vs. V2.0 empirical datasets for the Clinical Evaluation Report.',
        activities: [
          'Thursday (2 hrs — Stress Testing & Failure Analysis): Re-run full system stress test protocols on Prototype V2.0; execute secondary Reach, Leak ("Aneurysm"), and Flow Audits under identical conditions to Week 10.',
          'Friday (2 hrs — Design Critique & Clinical Reflection): Finalize performance datasets for final evaluation; lock in V1.0 vs. V2.0 improvement percentages (time-to-toes reduction, leak reduction, % digit reach) for Deliverable #3.'
        ],
        learnerChoices: {
          question: 'How will your pod present its V1.0 vs. V2.0 empirical comparison in the Clinical Evaluation Report?',
          options: [
            {
              id: 'choice-v2-table-delta',
              label: 'Side-by-Side Clinical Trial Table (V1.0 Baseline vs. V2.0 Upgraded + % Gain)',
              description: 'Clearly quantifies improvement across reach time, digit perfusion %, leak count, and backflow %.'
            },
            {
              id: 'choice-v2-survival-scorecard',
              label: 'Pediatric Extremity Survival Scorecard & Cost-Benefit BOM Audit',
              description: 'Pairs hydraulic test results with material cost-efficiency and clinical viability analysis.'
            }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Submit your locked-in Prototype V1.0 vs. V2.0 Comparative Stress Audit Dataset for Deliverable #3.',
          targetCompetencies: ['ct-05', 'ctps-05', 'ent-02']
        },
        reflectionPrompt: 'Looking at your V1.0 vs. V2.0 data table, which single engineering change produced the largest measurable improvement in toe perfusion?',
        teacherTips: 'Verify that every team has concrete numbers (seconds, mL/min, digit count /20, leak count) ready for Week 12 Medical Board Defense.'
      }
    ]
  },
  {
    id: 'share',
    title: 'Phase 6: FINAL EVALUATION — Clinical Defense & Biological Debrief (Week 12)',
    strap: 'Phase Focus: Presenting prototypes to the "Medical Board," connecting engineering failures to real anatomy, and completing final portfolios. (Week 12 • 10 Hours)',
    weeks: [12, 12],
    goal: 'Structure the final pitch and Deliverable #3 Clinical Evaluation & Cost-Benefit Report, build visual blueprint display boards, conduct mock "Medical Board" Q&A rehearsals, host the Public Exhibition & Medical Board Defense (Activity 6.1), and complete the Teacher’s Biological Reflection Debrief (Activity 6.2) connecting classroom hardware limits to real human cardiovascular biology.',
    tasks: [
      'Mon (2 hrs — Anatomy & Fluid Dynamics Concept Lab): Structure the final pitch and Clinical Evaluation & Cost-Benefit Report.',
      'Tue (2 hrs — Blueprinting & Numerical Modeling): Build visual artifacts, failure logs, empirical data tables, and blueprint display boards.',
      'Wed (2 hrs — Biomedical Maker Studio): Conduct mock "Medical Board" Q&A rehearsals regarding material limits, duct-tape effectiveness vs. biological tissue, and scale.',
      'Thu (2 hrs — Stress Testing & Failure Analysis): Activity 6.1 — Public Exhibition & Medical Board Defense (live prototype demonstration to peer judges, medical professionals, and instructors).',
      'Fri (2 hrs — Design Critique & Clinical Reflection): Activity 6.2 — Teacher’s Debrief & Biological Reflection connecting classroom leaks to heart valves, duct-tape limits to living tissue, and macroscopic tubing to microscopic capillaries.'
    ],
    evidence: [
      'Deliverable #1: Working Closed-Loop Circulatory Prototype V2.0 Live Demo',
      'Deliverable #2: Scaled Biomedical Engineering Blueprint Display Board',
      'Deliverable #3: Clinical Evaluation & Cost-Benefit Report',
      'Activity 6.1 Medical Board Defense & Activity 6.2 Biological Reflection Closure'
    ],
    aiPromptStarters: [
      'Simulate 3 tough questions a Medical Board judge might ask our team about how our macroscopic tubing and duct-tape seals compare to real human arteries, valves, and capillaries.',
      'Help us structure our Activity 6.2 Biological Reflection comparing classroom check-valve leaks to human heart valve regurgitation.'
    ],
    competencies: ['ec-05', 'ec-06', 'sea-03', 'ent-03'],
    stretchCompetencies: ['ctps-05', 'sdl-07'],
    sessions: [
      {
        sessionNumber: 23,
        week: 12,
        title: 'Week 12 (Mon–Wed): Clinical Evaluation Report, Blueprint Display Boards & Mock Medical Board Q&A',
        durationMin: 360,
        learningGoal: 'Synthesize final engineering performance and biomedical constraints into the Clinical Evaluation Report, assemble display boards, and rehearse rigorous Medical Board Q&A.',
        activities: [
          'Monday (2 hrs — Anatomy & Fluid Dynamics Concept Lab): Structure the final pitch and Deliverable #3 Clinical Evaluation & Cost-Benefit Report, balancing V1.0/V2.0 engineering performance with pediatric biomedical constraints.',
          'Tuesday (2 hrs — Blueprinting & Numerical Modeling): Build visual artifacts and blueprint display boards organizing scaled vascular schematics, failure logs, and empirical data tables.',
          'Wednesday (2 hrs — Biomedical Maker Studio): Conduct mock "Medical Board" Q&A rehearsals simulating rigorous board questioning regarding material limits, duct-tape effectiveness vs. living biological tissue, and microscopic capillary scale.'
        ],
        learnerChoices: {
          question: 'Which tough Medical Board question will your pod prepare a live hydraulic demonstration to answer?',
          options: [
            {
              id: 'choice-qa-valve-regurg',
              label: '"How does your system prevent venous backflow compared to a real human heart valve?"',
              description: 'Demonstrate live check-valve closure during diastole and compare to mitral/aortic leaflets.'
            },
            {
              id: 'choice-qa-capillary-scale',
              label: '"Why can’t plastic straws truly replicate microscopic capillary gas exchange?"',
              description: 'Contrast macroscopic 2.5mm straw walls with single-cell-thick (8-micron) capillary endothelium.'
            },
            {
              id: 'choice-qa-duct-tape-tissue',
              label: '"Why do duct-tape joints eventually fatigue whereas living blood vessels last 80+ years?"',
              description: 'Compare non-living adhesive creep to smooth muscle tone, elastin, and cellular self-healing.'
            }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Submit your finalized Deliverable #3 Clinical Evaluation & Cost-Benefit Report and Mock Medical Board Q&A Prep Sheet.',
          targetCompetencies: ['ec-05', 'ent-03', 'ctps-05']
        },
        reflectionPrompt: 'How did rehearsing skeptical questions from the Medical Board sharpen your explanation of what your prototype can and cannot do?',
        teacherTips: 'Coach students to be scientifically honest during Q&A: acknowledging the limits of classroom materials while showing rigorous data is the mark of a true biomedical engineer.'
      },
      {
        sessionNumber: 24,
        week: 12,
        title: 'Week 12 (Thu–Fri): Public Exhibition, Medical Board Defense & Biological Reflection Closure',
        durationMin: 240,
        learningGoal: 'Deliver a live closed-loop circulatory prototype demonstration to the Medical Board and synthesize how macroscopic engineering challenges mirror human cardiovascular biology.',
        activities: [
          'Thursday (2 hrs — Stress Testing & Failure Analysis): Activity 6.1 — Public Exhibition & Medical Board Defense: Live prototype pumping demonstration and presentation of blueprints and clinical data to peer judges, medical professionals, and instructors.',
          'Friday (2 hrs — Design Critique & Clinical Reflection): Activity 6.2 — Teacher’s Debrief & Biological Reflection: Connect classroom leaks to heart valve disease/aneurysms, duct-tape limits to living self-healing vascular tissue, and macroscopic tubing to microscopic capillaries; complete portfolio closure.'
        ],
        learnerChoices: {
          question: 'How will you document your personal Activity 6.2 Biological Reflection for final portfolio closure?',
          options: [
            {
              id: 'choice-closure-comparative-essay',
              label: 'Written Biomedical Synthesis Essay & Annotated Macro-vs-Micro Comparison Table',
              description: 'Contrasts your prototype pump, valves, seals, and straws against the human heart, valves, endothelium, and capillaries.'
            },
            {
              id: 'choice-closure-visual-infographic',
              label: 'Illustrated "What Our Tubing Taught Us About the Human Body" Visual Poster & Tap-to-Choose Cards',
              description: 'Visual comparison board ideal for younger learners (Ages 9–12) or visual communicators (no voice recording for under-13s).'
            }
          ]
        },
        evidenceToCollect: {
          kind: 'reflection',
          prompt: 'Submit your Activity 6.1 Medical Board Defense summary and Activity 6.2 Biological Reflection ("Connecting Classroom Leaks to Living Biology").',
          targetCompetencies: ['ec-06', 'sea-03', 'sdl-07']
        },
        reflectionPrompt: 'After building and stress-testing a circulatory system out of tubing, straws, and tape, what amazes you most about how your own real heart and blood vessels work 100,000 times every single day without leaking?',
        teacherTips: 'Safeguarding reminder: any photo/video capture of the public showcase requires prior school consent and must never be stored on the platform. Under-13 learners use written/drawn reflection cards or teacher scribing only.'
      }
    ]
  }
];

export const VITAL_FLOW_PROGRAM: PblProgram = {
  id: 'project-vital-flow-2026',
  title: 'Project Vital Flow: Biomedical Engineering & Closed-Loop Fluid Dynamics',
  subtitle: 'Prototyping an external closed-loop circulatory support system with a manual heart pump, one-way check-valves, lung-oxygenation station, and 20-digit capillary network reaching simulated fingers and toes across a 12-week, 120-hour Design Thinking curriculum.',
  status: 'provisional_prototype',
  theme: 'Biomedical Engineering & Closed-Loop Fluid Dynamics — Project Vital Flow',
  drivingQuestion: 'How can we design a pressurized, leak-proof closed-loop system using basic materials that moves oxygen and nutrients to the furthest extremities (fingers and toes) while passing through a lung-oxygenation station?',
  realProblem: {
    type: 'both',
    summary: 'A medical device company has tasked student teams with prototyping an external "External Circulatory Support System" for a pediatric patient whose heart can no longer pump blood to their extremities. Restricted circulation causes peripheral tissue ischemia (numbness, coldness, and necrosis), requiring a pressurized, leak-proof, valved closed-loop hydraulic network that oxygenates fluid through a lung station and perfuses every finger and toe.',
    peopleImpact: 'Builds deep clinical empathy for pediatric cardiovascular patients while teaching students how hydraulic pressure, vessel branching, one-way valves, and airtight seals keep human organs and extremities alive.',
    environmentalImpact: 'Encourages frugal, reusable biomedical maker prototyping using low-cost classroom polymers (aquarium tubing, gloves/balloons, straws, rubber bands, and duct tape) paired with rigorous lifecycle and biocompatibility analysis.'
  },
  targetAgeRange: 'Ages 9–17 (Multi-tiered scaffolds for Primary 9–11, Middle 12–14, and Upper Secondary 15–17)',
  durationWeeks: 12,
  totalSessions: 24,
  materialsAndKit: {
    microcontrollers: [
      'Manual Hydraulic & Mechanical Core (no microcontroller required for core prototype; optional BBC micro:bit V2 / Arduino stopwatch or pulse-rate counter for BPM telemetry)'
    ],
    sensorsAndActuators: [
      'Manual ventricular pumps: latex-free nitrile gloves, heavy-duty thick-wall balloons, 60mL calibrated Luer-lock syringes, and compliant squeeze bottles',
      'Makeshift one-way check-valves: cut-balloon rubber flap leaflets, bevel-cut pinched drinking straws, and inline bead-in-cone check valves',
      '250mL sealed Lung-Oxygenation Reservoir chamber with pulmonary entry/exit ports and air-bleed valve'
    ],
    fabricationMaterials: [
      'Life-size human body cut-out template boards (corrugated board / foamcore)',
      '8mm and 6mm clear flexible aquarium tubing (Aorta, Vena Cava, Pulmonary, Brachial, Femoral, Tibial, Saphenous trunks) and 2.5mm thin plastic drinking straws (20 finger & toe capillary beds)',
      'High-tack duct tape, assorted tension rubber bands, Y/T tubing connectors, funnel, spill trays, and red/blue food-safe tracer dye'
    ],
    softwareAndTools: [
      'Stopwatches, graduated cylinders (100mL / 500mL), rulers/calipers, and the built-in Project Vital Flow Hemodynamic & Vascular Simulator',
      'Anatomical Circulatory System reference chart (Arteries & Veins from Common Carotid/Aorta to Dorsal Digital vessels)'
    ]
  },
  teacherGuidance: {
    safetyProtocol: [
      'Wet Lab & Slip Prevention: Conduct all fluid priming (Activity 4.4) and high-pressure stress tests (Week 10–11) over catchment trays with non-slip mats and paper towels.',
      'Latex-Free Allergy Safeguard: Provide latex-free nitrile gloves and non-latex silicone/elastomer balloons for any classroom with latex sensitivities.',
      'Child Safeguarding & Privacy: All pediatric patient cases are fictional synthetic personas. Under-13 learners never use voice recording or speech-to-text; any showcase photography requires prior school consent and is never stored on the platform.'
    ],
    pedagogicalScaffolding: [
      'Consistent 10-Hour Weekly Studio Rhythm (2 Hours/Weekday): Monday (Anatomy & Fluid Dynamics Concept Lab), Tuesday (Blueprinting & Numerical Modeling), Wednesday (Biomedical Maker Studio & Fabrication), Thursday (Stress Testing & Failure Analysis), Friday (Design Critique & Clinical Reflection).',
      'Three Mandatory Core Deliverables: (1) Working Circulatory Prototype reaching fingers and toes, (2) Scaled Biomedical Engineering Blueprint, and (3) Clinical Evaluation & Cost-Benefit Report.'
    ],
    aiEthicsRules: [
      'AI tools may be used to verify volumetric cylinder formulas, explore cardiovascular anatomy, and rehearse Medical Board Q&A questions.',
      'Prompt Provenance Mandatory: Students must log what prompt they asked, what the AI generated, and what they verified via physical syringe/tubing experiments.'
    ],
    differentiationNotes: [
      'Primary Track (Ages 9–11): Focus on "Good Stuff vs. Bad Stuff" O2/CO2 tracing, pre-cut Y-connectors, color-coded arterial/venous body boards, and visual tap-to-choose reflection cards.',
      'Secondary Track (Ages 12–17): Full Hagen-Poiseuille resistance modeling, custom multi-leaflet check-valve fabrication, 20-digit parallel capillary balancing, and quantitative V1.0 vs. V2.0 BPM-to-flow curves.'
    ]
  },
  measurableImpactCriteria: [
    {
      id: 'impact-vital-extremity-reach',
      metric: 'Deliverable #1: 100% Distal Extremity Perfusion (Reach Audit — Activity 5.1)',
      target: 'Fluid reaches all 20 simulated digits (10 fingers + 10 toes) within <= 25 seconds of manual pumping with zero dry capillary straws',
      verificationMethod: 'Timed dye-front propagation trial and distal output volume measurement (mL/min) during Week 10–11 Reach Audits'
    },
    {
      id: 'impact-vital-zero-aneurysm',
      metric: 'Deliverable #1 & #2: Zero Structural Leaks / "Aneurysms" (Leak Audit — Activity 5.2)',
      target: '0 mL/min joint leakage across all arterial/venous junctions and straw manifolds during a 60–80 BPM sustained pumping audit',
      verificationMethod: 'Junction-by-junction visual & blotter-paper leak inspection across Prototype V1.0 and V2.0'
    },
    {
      id: 'impact-vital-unidirectional-loop',
      metric: 'Deliverable #3: Closed-Loop Lung Passage & Backflow Prevention (Flow Audit — Activity 5.3)',
      target: '>= 90% unidirectional forward flow with mandatory passage through the Lung-Oxygenation Station and visible venous return to the heart pump',
      verificationMethod: 'Check-valve backflow tracer audit and volumetric stroke-efficiency comparison between V1.0 and V2.0 defended before the Week 12 Medical Board'
    }
  ],
  assumptions: [
    {
      id: 'asmp-vital-schedule',
      domain: '12-Week / 120-Hour Biomedical Studio Rhythm',
      assumption: '12 Weeks | Monday–Friday | 2 Hours/Day (10 Hours/Week | 120 Total Hours): Mon Concept Lab, Tue Blueprinting & Math, Wed Maker Studio, Thu Stress Testing, Fri Critique & Reflection.',
      ownerVerificationNeeded: 'Needs review with Don and school leadership to confirm whether all 5 weekday 2-hour blocks are dedicated to Project Vital Flow or shared with general science labs.',
      confirmation: {
        status: 'needs_owner_confirmation'
      }
    },
    {
      id: 'asmp-vital-materials-allergy',
      domain: 'Materials & Latex-Free Safety',
      assumption: 'Pods construct pumps and valves using aquarium tubing, balloons, gloves, straws, rubber bands, and duct tape, substituting latex-free nitrile gloves and non-latex balloons wherever sensitivities exist.',
      ownerVerificationNeeded: 'Confirm classroom supply budget and mandatory latex-free nitrile procurement with school health & safety lead.',
      confirmation: {
        status: 'needs_owner_confirmation'
      }
    }
  ],
  phases: VITAL_FLOW_PHASES
};
