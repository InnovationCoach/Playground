/**
 * Don's PBL Program: Engineering Humanity's Next Horizon (Interstellar Ark & Exoplanet Civilization)
 * Branch: DonPBL
 * Location: prototypes/DonPBL/interstellarArkProgram.ts
 *
 * Sourced from "Engineering Humanity's Next Horizon" (12 Weeks, 10 Hours/Week, 120 Hours Total).
 * Framework: Design Thinking (Explore -> Empathise -> Define -> Ideate -> Prototype -> Test -> Share)
 * Assessment Standard: WeLearn 7 Future Skills (Mastery Transcript Consortium Aligned)
 *
 * Includes:
 * - 7 Design Thinking Phases across a 12-Week Term (120 contact hours, 24 structured sessions)
 * - Option for Building in a Simulation (Interactive Digital Twin Ark & Closed-Loop ECLSS Simulator + 1,500 THB Low-Fi Physical Model Planner)
 * - Gamification Elements (Mission XP, 7 Colonization Architect Levels, 7 Badges, Stochastic Red-Team & Constitutional Crisis Arena)
 * - Full WeLearn 7 Future Skills MTC Rubric (Emerging, Proficient, Advanced, Project Evidence Required)
 */

import type { PblProgram, ProgramPhase } from './programData';

export interface ExoplanetCandidate {
  id: string;
  name: string;
  constellation: string;
  distanceLightYears: number;
  starType: string;
  orbitalPeriodDays: number;
  surfaceGravityG: number;
  stellarFluxEarthRatio: number;
  equilibriumTempC: number;
  radiationHazardIndex: number; // 1 (Low) to 10 (Severe)
  tidalLockingStatus: 'Tidally Locked' | 'Resonant Spin-Orbit' | 'Near-Earth Rotation';
  terrainAndAtmosphere: string;
  colonizationAdvantage: string;
  primaryEngineeringChallenge: string;
}

export interface ArkPropulsionOption {
  id: string;
  name: string;
  propulsionType: string;
  gravityMechanism: string;
  ringRadiusMeters: number;
  rotationRpm: number;
  simulatedGravityG: number;
  cruiseVelocityPercentC: number;
  estimatedTransitYears: number;
  hullShieldingSpec: string;
  powerOutputGW: number;
  maintenanceComplexity: 'Moderate' | 'High' | 'Extreme';
}

export interface ArkCrisisScenario {
  id: string;
  title: string;
  category: 'Biosphere & ECLSS' | 'Structural & Mechanical' | 'Societal & Constitutional';
  weekTrigger: number;
  severity: 'High' | 'Critical' | 'Catastrophic';
  summary: string;
  caloricShockPct: number;
  waterLoopPenaltyPct: number;
  oxygenPenaltyPct: number;
  moraleShockPts: number;
  engineeringPrompt: string;
  constitutionalPrompt: string;
  recommendedProtocol: string;
}

export interface ArkMtcRubricItem {
  skillNumber: number;
  domainId: 'ct' | 'ctps' | 'ec' | 'lc' | 'sdl' | 'ent' | 'sea';
  skillTitle: string;
  emerging: string;
  proficient: string;
  advanced: string;
  evidenceRequired: string;
}

export interface ArkGamificationBadge {
  id: string;
  name: string;
  icon: string;
  xpAward: number;
  unlockedAtPhase: string;
  condition: string;
  description: string;
}

export interface ArkGamificationLevel {
  level: number;
  title: string;
  minXp: number;
  privilegeUnlocked: string;
}

export const EXOPLANET_CANDIDATES: ExoplanetCandidate[] = [
  {
    id: 'exo-trappist-1e',
    name: 'TRAPPIST-1e',
    constellation: 'Aquarius',
    distanceLightYears: 39.6,
    starType: 'M8V Ultra-Cool Red Dwarf',
    orbitalPeriodDays: 6.1,
    surfaceGravityG: 0.93,
    stellarFluxEarthRatio: 0.66,
    equilibriumTempC: -22,
    radiationHazardIndex: 6,
    tidalLockingStatus: 'Tidally Locked',
    terrainAndAtmosphere: 'Rocky iron-core world in the temperate zone; permanent twilight terminator ribbon with liquid water ocean basins and glaciated nightside.',
    colonizationAdvantage: 'Near-Earth 0.93g gravity prevents long-term colonist bone/muscle atrophy on the surface; rich geothermal gradients along the terminator.',
    primaryEngineeringChallenge: 'Tidally locked hurricane-force katabatic winds across the terminator boundary and periodic M-dwarf UV/X-ray stellar flares.'
  },
  {
    id: 'exo-kepler-186f',
    name: 'Kepler-186f',
    constellation: 'Cygnus',
    distanceLightYears: 582,
    starType: 'M1 Dwarf',
    orbitalPeriodDays: 129.9,
    surfaceGravityG: 1.17,
    stellarFluxEarthRatio: 0.32,
    equilibriumTempC: -85,
    radiationHazardIndex: 3,
    tidalLockingStatus: 'Near-Earth Rotation',
    terrainAndAtmosphere: 'Outer-edge habitable zone continental world; requires dense CO2-N2 greenhouse atmosphere and subterranean/geodesic thermal domes.',
    colonizationAdvantage: 'Quiet stellar environment with low flare radiation hazard and 130-day orbital year avoiding severe tidal-locking wind shear.',
    primaryEngineeringChallenge: 'Multi-century transit distance and low incident solar flux (32% of Earth) requiring nuclear/fusion surface micro-grids.'
  },
  {
    id: 'exo-proxima-b',
    name: 'Proxima Centauri b',
    constellation: 'Centaurus',
    distanceLightYears: 4.24,
    starType: 'M5.5Ve Red Dwarf Flare Star',
    orbitalPeriodDays: 11.2,
    surfaceGravityG: 1.10,
    stellarFluxEarthRatio: 0.65,
    equilibriumTempC: -39,
    radiationHazardIndex: 9,
    tidalLockingStatus: 'Tidally Locked',
    terrainAndAtmosphere: 'Basaltic canyon basins and subsurface ice aquifers; exposed to frequent superflare coronal mass ejections.',
    colonizationAdvantage: 'Closest exoplanet to Earth (4.24 ly), allowing single-generation transit (45–85 years) and laser-relay communication with Earth.',
    primaryEngineeringChallenge: 'Extreme X-ray and proton flare flux (250x Earth) requiring regolith-buried lava-tube habitats and magnetic dipole shielding.'
  },
  {
    id: 'exo-lhs-1140b',
    name: 'LHS 1140 b',
    constellation: 'Cetus',
    distanceLightYears: 48.8,
    starType: 'M4.5V Quiet Red Dwarf',
    orbitalPeriodDays: 24.7,
    surfaceGravityG: 1.48,
    stellarFluxEarthRatio: 0.43,
    equilibriumTempC: -47,
    radiationHazardIndex: 4,
    tidalLockingStatus: 'Resonant Spin-Orbit',
    terrainAndAtmosphere: 'Super-Earth water-rich rocky world with secondary nitrogen-carbon dioxide atmosphere and stable substellar warm sea.',
    colonizationAdvantage: 'Low stellar activity preserves atmospheric retention and abundant surface water for electrolysis and hydroponic loops.',
    primaryEngineeringChallenge: 'High 1.48g surface gravity requires exoskeleton assistive rigging for construction crews and reinforced landing thrusters.'
  }
];

export const ARK_PROPULSION_OPTIONS: ArkPropulsionOption[] = [
  {
    id: 'prop-fusion-oneill',
    name: 'D-He3 Pulsed Fusion Drive + Twin O’Neill Counter-Rotating Cylinders',
    propulsionType: 'Deuterium-Helium-3 Magnetic Inertial Fusion',
    gravityMechanism: 'Twin Counter-Rotating O’Neill Cylinders (320m radius)',
    ringRadiusMeters: 320,
    rotationRpm: 1.67,
    simulatedGravityG: 1.0,
    cruiseVelocityPercentC: 8.5,
    estimatedTransitYears: 52,
    hullShieldingSpec: '3.5m Water-Ice Jacket + Boron-Polyethylene Whipple Bumper',
    powerOutputGW: 14.5,
    maintenanceComplexity: 'High'
  },
  {
    id: 'prop-lightsail-torus',
    name: 'Terawatt Laser-Pushed Light Sail + Dual Stanford Torus Rings',
    propulsionType: 'Beamed Dielectric Metamaterial Sail + Fusion Deceleration Stage',
    gravityMechanism: 'Dual Stanford Torus Centrifuge Rings (180m radius)',
    ringRadiusMeters: 180,
    rotationRpm: 2.15,
    simulatedGravityG: 0.92,
    cruiseVelocityPercentC: 12.0,
    estimatedTransitYears: 38,
    hullShieldingSpec: '2.5m Regolith Composite + Active Solenoid Magnetic Deflector',
    powerOutputGW: 9.2,
    maintenanceComplexity: 'Moderate'
  },
  {
    id: 'prop-antimatter-tether',
    name: 'Antimatter-Catalyzed Micro-Fission + Modular Tethered Hab Pods',
    propulsionType: 'Antiproton-Catalyzed Pulsed Plasma Propulsion',
    gravityMechanism: '450m Kevlar-Carbon Truss Tethered Habitation Clusters',
    ringRadiusMeters: 450,
    rotationRpm: 1.38,
    simulatedGravityG: 0.95,
    cruiseVelocityPercentC: 15.0,
    estimatedTransitYears: 31,
    hullShieldingSpec: '4.0m Liquid Hydrogen Tank Buffer + Multi-Shock Nextel Blanket',
    powerOutputGW: 22.0,
    maintenanceComplexity: 'Extreme'
  }
];

export const ARK_CRISIS_SCENARIOS: ArkCrisisScenario[] = [
  {
    id: 'crisis-fusarium-blight',
    title: 'Biosphere Crisis: Fusarium Pathogen Wipes Out 40% of Primary Hydroponic Crop',
    category: 'Biosphere & ECLSS',
    weekTrigger: 9,
    severity: 'Critical',
    summary: 'During Year 42 of transit, a mutated root-rot fungal pathogen breaches Bay B, destroying 40% of dwarf wheat and soy aeroponic racks within 72 hours.',
    caloricShockPct: 40,
    waterLoopPenaltyPct: 12,
    oxygenPenaltyPct: 18,
    moraleShockPts: 22,
    engineeringPrompt: 'How do you isolate Bay B plumbing, sterilize nutrient lines, and scale Spirulina algae photobioreactors to prevent caloric starvation for 500 colonists?',
    constitutionalPrompt: 'Does your Colonial Charter mandate equal caloric rationing across all crew tiers, or prioritize high-burn maintenance and medical personnel?',
    recommendedProtocol: 'Seal Bay B airlocks, UV-ozonate greywater manifolds, surge Spirulina bioreactor illumination by +65%, and enact Charter Equal Caloric Solidarity Clause.'
  },
  {
    id: 'crisis-centrifuge-bearing',
    title: 'Mechanical Crisis: Primary Centrifuge Hub Bearing Seizure & Microgravity Drift',
    category: 'Structural & Mechanical',
    weekTrigger: 9,
    severity: 'Catastrophic',
    summary: 'Thermal fatigue cracks the main magnetic-fluid bearing on Ring A, forcing an emergency spin-down to 0.15g and threatening structural torque shear.',
    caloricShockPct: 10,
    waterLoopPenaltyPct: 15,
    oxygenPenaltyPct: 8,
    moraleShockPts: 28,
    engineeringPrompt: 'How do your automated repair drone bays fabricate a replacement bearing segment mid-flight and transfer 250 colonists without unbalancing center-of-mass?',
    constitutionalPrompt: 'How does your legal code govern temporary high-density billeting when Ring A residents must co-habit Ring B communal zones for 6 weeks?',
    recommendedProtocol: 'Engage counter-torque attitude thrusters, deploy autonomous sintered-titanium drone welders via Maintenance Corridor C, and activate Shared Quarters Civic Compact.'
  },
  {
    id: 'crisis-engineer-strike',
    title: 'Constitutional Crisis: Landing Faction Strike & Terrain Allocation Standoff',
    category: 'Societal & Constitutional',
    weekTrigger: 10,
    severity: 'Critical',
    summary: 'Ninety days after exoplanet landing, propulsion and ECLSS engineers go on strike demanding 1.5x caloric/resource rations and prime geothermal valley plots, refusing to hand over power from Transit Mission Law to Planetary Civic Law.',
    caloricShockPct: 15,
    waterLoopPenaltyPct: 20,
    oxygenPenaltyPct: 10,
    moraleShockPts: 35,
    engineeringPrompt: 'How are critical water-recovery and agricultural cross-training redundancies designed so no single guild can hold life support hostage?',
    constitutionalPrompt: 'Does your New World Constitution resolve the strike via Restorative Civic Arbitration and sunsetting Transit Martial Law, or collapse into authoritarianism/anarchy?',
    recommendedProtocol: 'Trigger automatic 60-day Transit Martial Law Sunset Clause, convene the Restorative Citizen Jury, rotate cross-trained biosphere stewards, and audit hazardous-duty time credits transparently.'
  },
  {
    id: 'crisis-solar-superflare',
    title: 'Deep-Space Hazard: Coronal Mass Ejection & Micrometeoroid Hull Puncture',
    category: 'Structural & Mechanical',
    weekTrigger: 9,
    severity: 'High',
    summary: 'A hyper-velocity micrometeoroid swarm punctures outer Whipple Shield Sector 4 just as target star flare monitoring detects an incoming proton storm.',
    caloricShockPct: 12,
    waterLoopPenaltyPct: 18,
    oxygenPenaltyPct: 15,
    moraleShockPts: 20,
    engineeringPrompt: 'How quickly can modular hull plug-plates be swapped from internal access corridors while sheltering all 500 colonists inside the central water-shielded storm shelter?',
    constitutionalPrompt: 'Who holds emergency command authority during a 48-hour radiation shelter lockdown, and how is transparency restored immediately after all-clear?',
    recommendedProtocol: 'Sound 15-minute Storm Shelter protocol into central water-walled core, dispatch exteriorspider-drones with modular Whipple tiles, and log all emergency decrees for mandatory post-flare Citizen Review.'
  }
];

export const ARK_WELEARN_MTC_RUBRIC: ArkMtcRubricItem[] = [
  {
    skillNumber: 1,
    domainId: 'ct',
    skillTitle: '1. Creative Thinking & Innovation',
    emerging: 'Relies on standard sci-fi tropes for spacecraft layout and governance; physical model and drawings show basic effort but lack original problem-solving.',
    proficient: 'Translates original ideas into a functional low-fi physical prototype and detailed digital/hand drawings; designs novel spatial solutions for crew psychology and food production.',
    advanced: 'Synthesizes complex biomimicry, modular architecture, and bespoke governance into highly innovative, cohesive physical and digital designs that solve multiple deep-space constraints simultaneously.',
    evidenceRequired: 'Physical scale model photos, CAD files or technical drawings, spatial zoning ideation sketches.'
  },
  {
    skillNumber: 2,
    domainId: 'ctps',
    skillTitle: '2. Critical Thinking & Problem Solving',
    emerging: 'Selects an exoplanet and designs ship systems with superficial research; struggles to defend maintenance or agricultural numbers when questioned during the pitch.',
    proficient: 'Breaks down planetary terrain data, radiation hazards, and closed-loop food math using scientific logic; successfully defends engineering and political choices during Red-Team testing and Q&A.',
    advanced: 'Anticipates secondary and tertiary system failures (e.g., mechanical wear vs. social unrest); uses quantitative data to stress-test and iterate both engineering maintenance protocols and constitutional laws.',
    evidenceRequired: 'Exoplanet Dossier, Closed-Loop ECLSS calculations, Red-Team Failure & Iteration Report.'
  },
  {
    skillNumber: 3,
    domainId: 'ec',
    skillTitle: '3. Effective Communication',
    emerging: 'Pitch covers the planet, ship, and laws as disconnected parts; drawings lack clear labels; struggles to answer panel questions concisely.',
    proficient: 'Presents a cohesive, persuasive narrative during the Showcase Pitch; technical drawings, physical model, and oral defense clearly convey how the ship and political system function.',
    advanced: 'Commands the room during the Showcase Pitch; seamlessly integrates the physical model and digital visuals to explain complex engineering and legal concepts to diverse audiences with precision.',
    evidenceRequired: 'Recorded 15-minute Showcase Pitch, slide deck, annotated blueprint callouts, Q&A defense performance.'
  },
  {
    skillNumber: 4,
    domainId: 'lc',
    skillTitle: '4. Leadership & Collaboration',
    emerging: 'Works in silos or waits for task assignment; friction arises when integrating engineering designs with political or agricultural plans.',
    proficient: 'Carries the project from kickoff to delivery; demonstrates the ability to lead specific sub-systems (e.g., CAD, model building, legal drafting) while actively supporting teammates\' domains.',
    advanced: 'Facilitates cross-disciplinary integration across the team; mediates design conflicts constructively and elevates the output quality of peers during high-pressure prototyping and testing sprints.',
    evidenceRequired: 'Sprint logs, peer review matrices, mentor observation notes on team role execution.'
  },
  {
    skillNumber: 5,
    domainId: 'sdl',
    skillTitle: '5. Self-Directed Learning & Agency',
    emerging: 'Requires frequent mentor prompting to complete research phases or transition from sketching to building the physical model.',
    proficient: 'Sets clear weekly milestones across the 120 hours, independently researches complex aerospace/agricultural concepts, and owns the final deliverable quality without micromanagement.',
    advanced: 'Proactively seeks out advanced technical tools, external expert feedback, or deeper astrophysical data beyond project prompts; iterates prototypes autonomously before scheduled checkpoints.',
    evidenceRequired: 'Personal project management tracker, self-initiated research logs, version history of designs.'
  },
  {
    skillNumber: 6,
    domainId: 'ent',
    skillTitle: '6. Entrepreneurship & Financial Literacy',
    emerging: 'Treats spacecraft resources and prototyping materials as infinite; pitch lacks a realistic assessment of mission costs, labor economy, or material constraints.',
    proficient: 'Manages the physical prototyping budget (in THB) and theoretical ship mass/energy budgets effectively; pitches the colonization plan as a viable, resource-balanced venture.',
    advanced: 'Designs a sophisticated post-scarcity or frontier economic model within the Colonial Charter; optimizes ship maintenance and agricultural yields for maximum return on mass/energy investment.',
    evidenceRequired: 'Prototyping budget ledger (THB), spacecraft mass/resource allocation sheet, colonial economic framework.'
  },
  {
    skillNumber: 7,
    domainId: 'sea',
    skillTitle: '7. Social & Emotional Aptitude',
    emerging: 'Becomes defensive during Red-Team critiques; designs spacecraft living spaces and colonial laws that ignore human psychological needs or neurodiversity.',
    proficient: 'Manages prototyping setbacks calmly; incorporates deep empathy for human mental health into ship interior spaces and crafts inclusive, rehabilitative laws for the new planet.',
    advanced: 'Demonstrates exceptional emotional resilience during crisis simulations; designs physical habitats and legal frameworks that actively foster community trauma-recovery, equity, and psychological safety.',
    evidenceRequired: 'Empathy maps, residential space design rationale, constitutional clauses on human rights and conflict resolution.'
  }
];

export const ARK_GAMIFICATION_LEVELS: ArkGamificationLevel[] = [
  { level: 1, title: 'Deep-Space Physiologist', minXp: 0, privilegeUnlocked: 'Unlocked Human Needs Matrix & Confined Habitat Empathy Lab' },
  { level: 2, title: 'Goldilocks Astrometric Scout', minXp: 500, privilegeUnlocked: 'Unlocked NASA Exoplanet Archive Telemetry & Orbital Dossier Builder' },
  { level: 3, title: 'Closed-Loop Biosphere Architect', minXp: 1200, privilegeUnlocked: 'Unlocked 500-Colonist ECLSS Mass-Balance & Colonial Charter Drafter' },
  { level: 4, title: 'Centrifuge & Propulsion Engineer', minXp: 2100, privilegeUnlocked: 'Unlocked O’Neill/Stanford Torus Zoning & Repair Drone Bay Designer' },
  { level: 5, title: 'Digital Twin & Scale Fabricator', minXp: 3100, privilegeUnlocked: 'Unlocked 3D CAD Cutaway Sandbox & 1,500 THB Physical Model Ledger' },
  { level: 6, title: 'Red-Team Crisis Commander', minXp: 4300, privilegeUnlocked: 'Unlocked Stochastic Pathogen/Bearing Crisis & Constitutional Trial Simulator' },
  { level: 7, title: 'Exodus Council Envoy', minXp: 5500, privilegeUnlocked: 'Unlocked 15-Minute United Earth Exodus Council Pitch & MTC Mastery Seal' }
];

export const ARK_GAMIFICATION_BADGES: ArkGamificationBadge[] = [
  {
    id: 'badge-human-factor-empath',
    name: 'Confined-Habitat Empath',
    icon: '🧬',
    xpAward: 400,
    unlockedAtPhase: 'explore',
    condition: 'Complete the Human Needs Matrix across physiological, psychological, social, and spatial tiers using Antarctic/Submarine/Biosphere 2 data.',
    description: 'Protected multi-generational colonists against microgravity bone loss, radiation, and sensory monotony.'
  },
  {
    id: 'badge-goldilocks-scout',
    name: 'Goldilocks Reconnaissance Navigator',
    icon: '🪐',
    xpAward: 450,
    unlockedAtPhase: 'empathise',
    condition: 'Evaluate 3+ real exoplanet candidates from the NASA Exoplanet Archive and compile a defensive Exoplanet Reconnaissance Dossier.',
    description: 'Matched planetary surface gravity, stellar flare profiles, and atmospheric chemistry to human survival.'
  },
  {
    id: 'badge-eclss-charter-architect',
    name: 'Closed-Loop & Charter Framer',
    icon: '🌱',
    xpAward: 550,
    unlockedAtPhase: 'define',
    condition: 'Achieve >= 98% water recovery and 100% caloric self-sufficiency for 500 colonists while ratifying the Transit-to-Planetary Civic Law Charter.',
    description: 'Balanced biological survival math with constitutional justice and a 1,500 THB prototyping ledger.'
  },
  {
    id: 'badge-centrifuge-zoning-master',
    name: 'Centrifuge & Drone Bay Master',
    icon: '🛸',
    xpAward: 600,
    unlockedAtPhase: 'ideate',
    condition: 'Design orthographic vessel projections with artificial gravity rings and automated mid-flight spare-part drone fabrication bays.',
    description: 'Engineered a 100-year self-healing vessel requiring zero external resupply.'
  },
  {
    id: 'badge-dual-fidelity-builder',
    name: 'Dual-Fidelity Twin Builder',
    icon: '🏗️',
    xpAward: 650,
    unlockedAtPhase: 'prototype',
    condition: 'Deliver both annotated 3D/isometric subsystem blueprints and a color-coded physical scale model within the 1,500 THB classroom budget.',
    description: 'Bridged digital CAD precision with tangible physical cutaways of ship and exoplanet terrain.'
  },
  {
    id: 'badge-red-team-survivor',
    name: 'Red-Team & Constitutional Survivor',
    icon: '🛡️',
    xpAward: 750,
    unlockedAtPhase: 'test',
    condition: 'Survive a 40% hydroponic blight or centrifuge bearing failure AND resolve a planetary landing strike without authoritarian collapse.',
    description: 'Proved engineering redundancy and legal resilience under stochastic deep-space emergencies.'
  },
  {
    id: 'badge-exodus-council-laureate',
    name: 'United Earth Exodus Laureate',
    icon: '🌟',
    xpAward: 900,
    unlockedAtPhase: 'share',
    condition: 'Deliver the 4-Pillar 15-Minute Colonization Pitch & Defense before the United Earth Exodus Council and curate the MTC Mastery Portfolio.',
    description: 'Secured full mission approval across Destination, Vessel, Biosphere, and New Society.'
  }
];

export const INTERSTELLAR_ARK_PHASES: ProgramPhase[] = [
  {
    id: 'explore',
    title: 'Phase 1A: Deep Space Physiology, Psychology & Human Needs',
    strap: 'Analyzing the biological and psychological limits of multi-generational spaceflight and confined habitats (Week 1 • 10 Hours).',
    weeks: [1, 1],
    goal: 'Investigate microgravity bone density loss, cosmic radiation shielding, and confined-living psychology to construct a four-tier Human Needs Matrix.',
    tasks: [
      'Activity 1.1 (3 hrs): Analyze physiological impacts of multi-generational spaceflight (microgravity bone density loss, cosmic radiation shielding, and circadian rhythm disruption).',
      'Activity 1.2 (4 hrs): Conduct empathy mapping for future colonists by interviewing peers and synthesizing historical data from submarines, Antarctic stations, and Biosphere 2.',
      'Activity 1.3 (3 hrs): Draft a "Human Needs Matrix" categorizing survival requirements into physiological, psychological, social, and spatial tiers.',
      'Define baseline daily human survival thresholds per colonist (2,500 kcal, 0.84 kg O2, 3.5 L drinking/hygiene water, and circadian lighting).'
    ],
    evidence: [
      'Deep-Space Physiological Hazard Brief (Microgravity, GCR/SPE Radiation & Circadian Countermeasures)',
      'Confined-Living Empathy Map & 4-Tier Human Needs Matrix (Physiological, Psychological, Social, Spatial)'
    ],
    aiPromptStarters: [
      'Compare psychological stressors documented in Antarctic winter-over crews and Biosphere 2 with a 500-person multi-generational spacecraft.',
      'What rotational radius and RPM are needed in a centrifuge ring to generate 0.9g–1.0g without causing Coriolis motion sickness?',
      'Help me critique our 4-tier Human Needs Matrix for neurodiverse and multi-generational crew inclusivity.'
    ],
    competencies: ['ctps-01', 'sea-01', 'sdl-01'],
    stretchCompetencies: ['ctps-03', 'sea-04'],
    sessions: [
      {
        sessionNumber: 1,
        week: 1,
        title: 'Activity 1.1: The Human Factor in Deep Space — Physiology & Radiation',
        durationMin: 180,
        learningGoal: 'Quantify physiological degradation in deep space including bone demineralization, galactic cosmic ray dose limits, and circadian desynchronization.',
        activities: [
          'Analyze osteoclastic bone loss (1–1.5% per month in microgravity) and cardiovascular deconditioning across multi-decade transit.',
          'Calculate radiation shielding mass requirements using water jackets, polyethylene, and active magnetic shielding against GCR and solar proton events.',
          'Design circadian lighting spectra (480nm blue-enriched dawn vs red-shifted dusk) for windowless habitat decks.'
        ],
        learnerChoices: {
          question: 'Which physiological countermeasure system will your team prioritize first?',
          options: [
            { id: 'opt-centrifuge', label: 'Continuous Artificial Gravity Centrifuge', description: 'Rotating Stanford torus or O’Neill cylinder maintaining 0.9g–1.0g.' },
            { id: 'opt-water-shield', label: 'Concentric Water-Wall Storm Shelter', description: 'Routing greywater and potable reserves around residential sleeping quarters.' },
            { id: 'opt-circadian-biome', label: 'Biophilic Circadian Sky-Dome', description: 'Dynamic solar-spectrum LED vaults synchronized with agricultural plant cycles.' }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Submit your Deep-Space Physiological Countermeasure Table quantifying gravity, radiation (mSv/yr), and sleep-cycle parameters.',
          targetCompetencies: ['ctps-01', 'sdl-01']
        },
        reflectionPrompt: 'Why is surviving in deep space for 80 years fundamentally different from a 6-month stay aboard the ISS?',
        teacherTips: 'Prompt learners to convert daily human physiological inputs into annual tonnage for 500 people so they grasp exponential scale early.'
      },
      {
        sessionNumber: 2,
        week: 1,
        title: 'Activity 1.2: Empathy Mapping for Isolated & Confined Environments (ICE)',
        durationMin: 240,
        learningGoal: 'Synthesize historical lessons from submarines, Antarctic stations, and Biosphere 2 with peer interviews to uncover psychological stressors of confinement.',
        activities: [
          'Examine case studies from Biosphere 2 (oxygen drop, caloric scarcity, faction splitting) and McMurdo/Concordia Antarctic winter-over logs.',
          'Conduct structured peer empathy interviews exploring sensory monotony, privacy deprivation, and intergenerational role expectations.',
          'Construct a colonist Empathy Map (Says, Thinks, Does, Feels) for both first-generation launch crew and second-generation ship-born youth.'
        ],
        learnerChoices: {
          question: 'Which colonist persona cohort will anchor your team’s Empathy Map?',
          options: [
            { id: 'opt-gen1-stewards', label: 'Generation-1 Mission Specialists', description: 'Engineers and agronomists leaving Earth permanently with memories of open skies.' },
            { id: 'opt-gen2-shipborn', label: 'Generation-2 Ship-Born Youth', description: 'Adolescents born mid-transit who have never experienced a planetary horizon.' },
            { id: 'opt-landing-vanguard', label: 'Generation-3 Planetary Vanguard', description: 'Young adults trained inside the vessel who must transition to rugged exoplanet surface life.' }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Upload your Confined-Environment Empathy Map and synthesis of historical Biosphere 2 / polar station lessons.',
          targetCompetencies: ['sea-01', 'ec-01']
        },
        reflectionPrompt: 'How do you design for the mental health of a generation born mid-flight who never chose to board the spacecraft?',
        teacherTips: 'Highlight how Biosphere 2 struggled as much from social factionalism as from CO2/O2 chemistry—setting up Phase 2 governance.'
      },
      {
        sessionNumber: 3,
        week: 1,
        title: 'Activity 1.3: Drafting the 4-Tier Human Needs Matrix',
        durationMin: 180,
        learningGoal: 'Categorize multi-generational survival requirements into Physiological, Psychological, Social, and Spatial tiers with measurable design specs.',
        activities: [
          'Define Tier 1 (Physiological: air, water, 2,500 kcal nutrition, artificial gravity, thermal/radiation safety).',
          'Define Tier 2 (Psychological: acoustic privacy, nature contact, creative autonomy) and Tier 3 (Social: conflict mediation, cultural rituals, education).',
          'Define Tier 4 (Spatial: minimum cubic meters per person, sightlines, restorative green sanctuaries) to finalize the Human Needs Matrix.'
        ],
        learnerChoices: {
          question: 'How will your Human Needs Matrix balance private quarters against communal restorative biomes?',
          options: [
            { id: 'opt-modular-cabins', label: 'Reconfigurable Acoustic Micro-Cabins + Grand Park', description: 'Compact soundproof sleeping pods paired with expansive botanical commons.' },
            { id: 'opt-terraced-villages', label: 'Terraced Co-Housing Clusters', description: '25-person neighborhood clusters sharing kitchen-gardens and maker studios.' }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Submit your completed 4-Tier Human Needs Matrix with minimum quantitative thresholds per colonist.',
          targetCompetencies: ['sea-01', 'ctps-01', 'ct-01']
        },
        reflectionPrompt: 'Which tier in your Human Needs Matrix is most vulnerable to budget or mass cuts, and how will you defend it?',
        teacherTips: 'Ensure every team locks in their 4-Tier Human Needs Matrix before Week 2 exoplanet selection.'
      }
    ]
  },
  {
    id: 'empathise',
    title: 'Phase 1B: Goldilocks Zone Reconnaissance & Exoplanet Selection',
    strap: 'Evaluating real NASA Exoplanet Archive worlds, stellar radiation profiles, and surface terrains (Week 2 • 10 Hours).',
    weeks: [2, 2],
    goal: 'Research habitable-zone exoplanet candidates (Kepler-186f, TRAPPIST-1e, Proxima Centauri b, LHS 1140 b) and compile a formal Exoplanet Reconnaissance Dossier.',
    tasks: [
      'Activity 2.1 (4 hrs): Research real-world exoplanet candidates within habitable zones using NASA Exoplanet Archive telemetry.',
      'Activity 2.2 (3 hrs): Evaluate planetary terrains, atmospheric compositions, gravitational pulls, and stellar radiation profiles.',
      'Activity 2.3 (3 hrs): Select a target exoplanet and compile a formal Exoplanet Reconnaissance Dossier justifying why its terrain and orbital mechanics support human colonization.',
      'Compare trade-offs between transit distance (4.24 ly vs 40–580 ly), tidal locking wind shear, and surface gravity.'
    ],
    evidence: [
      'Comparative Candidate Trade-Off Matrix (Kepler-186f, TRAPPIST-1e, Proxima Centauri b, LHS 1140 b)',
      'Formal Exoplanet Reconnaissance Dossier (Orbital Mechanics, Terrain Profile & Surface Adaptation Strategy)'
    ],
    aiPromptStarters: [
      'Compare TRAPPIST-1e and Kepler-186f across stellar flare hazard, tidal locking, surface gravity, and transit time.',
      'How does tidal locking around an M-dwarf star affect atmospheric circulation, terminator habitability, and photosynthesis?',
      'Help me structure our Exoplanet Reconnaissance Dossier to defend our choice against Red-Team astrophysics questions.'
    ],
    competencies: ['ctps-01', 'ctps-03', 'sdl-02'],
    stretchCompetencies: ['ec-02', 'ctps-05'],
    sessions: [
      {
        sessionNumber: 4,
        week: 2,
        title: 'Activity 2.1: Goldilocks Zone Reconnaissance with NASA Exoplanet Data',
        durationMin: 240,
        learningGoal: 'Query and compare real exoplanet parameters (semi-major axis, stellar flux, radius, mass, equilibrium temperature) within circumstellar habitable zones.',
        activities: [
          'Compare M-dwarf vs K/G-dwarf habitable zones and calculate equilibrium temperatures from stellar luminosity and orbital distance.',
          'Analyze NASA Exoplanet Archive records for Kepler-186f, TRAPPIST-1e, Proxima Centauri b, and LHS 1140 b.',
          'Build a candidate comparison matrix scoring distance, gravity, stellar stability, and water retention potential.'
        ],
        learnerChoices: {
          question: 'Which primary selection criterion will guide your exoplanet shortlist?',
          options: [
            { id: 'opt-shortest-transit', label: 'Minimum Transit Duration (< 50 light-years)', description: 'Prioritizes Proxima Centauri b or TRAPPIST-1e to minimize multi-century ship wear.' },
            { id: 'opt-stellar-calm', label: 'Quiet Stellar Radiation Environment', description: 'Prioritizes Kepler-186f or LHS 1140 b to avoid extreme red-dwarf superflares.' },
            { id: 'opt-gravity-match', label: 'Near-1g Surface Gravity Match', description: 'Prioritizes TRAPPIST-1e (0.93g) for seamless human musculoskeletal adaptation.' }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Upload your 4-Planet Habitable Zone Comparison Matrix with real astrophysical parameters.',
          targetCompetencies: ['ctps-01', 'sdl-02']
        },
        reflectionPrompt: 'Why is there no "perfect Earth twin" among nearby exoplanets, and what engineering trade-off did your team accept?',
        teacherTips: 'Encourage students to test all 4 exoplanets in the Interactive Interstellar Ark Simulator before locking their final choice.'
      },
      {
        sessionNumber: 5,
        week: 2,
        title: 'Activity 2.2: Planetary Terrains, Atmospheres & Stellar Radiation Profiles',
        durationMin: 180,
        learningGoal: 'Model surface terrain geology, atmospheric pressure/composition, gravitational pull, and ionizing flare protection for the shortlisted world.',
        activities: [
          'Analyze how tidal locking creates a permanent dayside, glaciated nightside, and temperate twilight terminator band.',
          'Evaluate surface gravity impacts on landing module thrust, structural dome loads, and human locomotion.',
          'Map photosynthetic active radiation (PAR) in infrared-shifted M-dwarf spectra for surface and greenhouse agriculture.'
        ],
        learnerChoices: {
          question: 'Where on your target exoplanet will your initial landing colony be sited?',
          options: [
            { id: 'opt-terminator-valley', label: 'Twilight Terminator Geothermal Valley', description: 'Stable temperatures and wind-sheltered canyon walls on a tidally locked world.' },
            { id: 'opt-lava-tube', label: 'Subsurface Basaltic Lava-Tube Network', description: 'Natural 10m rock radiation shielding against stellar proton flares.' },
            { id: 'opt-coastal-basin', label: 'Substellar Coastal Archipelago Basin', description: 'Direct liquid water access for electrolysis, aquaculture, and thermal moderation.' }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Submit your Planetary Terrain, Atmosphere & Radiation Hazard Analysis for your selected landing zone.',
          targetCompetencies: ['ctps-03', 'ct-01']
        },
        reflectionPrompt: 'How does your chosen landing terrain directly shape the architecture of your spacecraft’s detachable landing module?',
        teacherTips: 'Remind teams that in Week 8 they will construct a physical terrain slice showing how the landing module interfaces with this exact topography.'
      },
      {
        sessionNumber: 6,
        week: 2,
        title: 'Activity 2.3: Compiling the Formal Exoplanet Reconnaissance Dossier',
        durationMin: 180,
        learningGoal: 'Synthesize astrophysical telemetry, terrain maps, and human adaptation protocols into the Deliverable 1 Exoplanet Reconnaissance Dossier.',
        activities: [
          'Write the scientific justification for the chosen Goldilocks planet, citing orbital mechanics, gravity, and atmospheric retention.',
          'Pair the Exoplanet Reconnaissance Dossier with the Week 1 Human Needs Matrix for Milestone 1 peer review.',
          'Log the final destination parameters into the Digital Twin Ark Configurator.'
        ],
        learnerChoices: {
          question: 'How will you present the surface adaptation roadmap inside your Exoplanet Dossier?',
          options: [
            { id: 'opt-phased-terra', label: '3-Stage Habitat Expansion Plan', description: 'Stage 1 Lander Core -> Stage 2 Regolith Vaults -> Stage 3 Closed Agricultural Domes.' },
            { id: 'opt-amphibious-ark', label: 'Modular Ark-to-Surface Disassembly', description: 'Spacecraft habitat modules detach and land directly as pre-integrated surface buildings.' }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Submit your complete Phase 1 Deliverable: Exoplanet Reconnaissance Dossier & Human Needs Matrix.',
          targetCompetencies: ['ctps-01', 'ec-01', 'sdl-02']
        },
        reflectionPrompt: 'What is the single strongest scientific counter-argument against your chosen exoplanet, and how does your dossier answer it?',
        teacherTips: 'Verify that every team has both deliverables from the PDF table for Weeks 1–2: Exoplanet Dossier & Human Needs Matrix.'
      }
    ]
  },
  {
    id: 'define',
    title: 'Phase 2: Closed-Loop Biospheres (ECLSS), Budgets & The Colonial Charter',
    strap: 'Defining 500-colonist agricultural math, Thai Baht + tonnage budgets, and constitutional governance (Weeks 3–4 • 20 Hours).',
    weeks: [3, 4],
    goal: 'Engineer a closed-loop ECLSS and food production matrix for 500 colonists, build a dual THB/tonnage budget, and ratify the New World Constitution & Legal Code.',
    tasks: [
      'Activity 3.1 & 3.2 (7 hrs): Define caloric/nutritional needs for 500 colonists (aeroponics, hydroponics, cellular agriculture, algae photobioreactors) and map closed-loop ECLSS (water recovery, O2 generation, CO2 scrubbing, solid waste composting).',
      'Activity 3.3 (3 hrs): Build a project budget and material allocation sheet (calculated in Thai Baht within a 1,500 THB classroom cap alongside a theoretical mission resource tonnage budget).',
      'Activity 4.1 & 4.2 (7 hrs): Analyze historical frontier governance failures, debate resource distribution, labor division, reproductive rights, and conflict resolution, and define the transition from "Transit Mission Law" to "Planetary Civic Law".',
      'Activity 4.3 (3 hrs): Draft the New World Constitution & Legal Code establishing explicit laws for property, sustainability mandates, justice systems, and leadership selection.'
    ],
    evidence: [
      'Closed-Loop Resource & Food Production Matrix for 500 Colonists (Caloric, Water, O2/CO2 & Composting Flow)',
      'Dual Budget Ledger (1,500 THB Classroom Prototyping Ledger + Spacecraft Mass/Energy Tonnage Allocation)',
      'The Colonial Charter: New World Constitution & Legal Code (Transit-to-Planetary Law Transition)'
    ],
    aiPromptStarters: [
      'Help me verify the daily caloric and oxygen math for 500 colonists using dwarf wheat, sweet potatoes, soy aeroponics, and Spirulina photobioreactors.',
      'What are the biggest failure modes when transitioning from military/mission chain-of-command aboard a ship to democratic civic law on a planet?',
      'Help me allocate our 1,500 THB classroom prototyping budget across cardboard, EVA foam, PVC pipe, balsa wood, and color-coded cutaway markers.'
    ],
    competencies: ['ctps-02', 'ent-01', 'lc-01', 'sea-02'],
    stretchCompetencies: ['ent-03', 'sea-05'],
    sessions: [
      {
        sessionNumber: 7,
        week: 3,
        title: 'Activity 3.1 & 3.2: 500-Colonist Caloric Math & Closed-Loop ECLSS',
        durationMin: 420,
        learningGoal: 'Design a closed-loop agricultural and life-support flow proving caloric (1.25M kcal/day), water (>=98% recovery), and O2/CO2 sustainability for 500 colonists.',
        activities: [
          'Calculate daily macronutrient and caloric demand for 500 colonists (~2,500 kcal/person/day = 1,250,000 kcal/day total).',
          'Balance crop yields across vertical aeroponics (potatoes, dwarf wheat, soybeans), mushroom mycelia, cellular protein bioreactors, and Spirulina algae.',
          'Diagram the Environmental Control and Life Support System (ECLSS): Sabatier/Bosch CO2 reduction, urine vapor compression distillation, oxygen electrolysis, and thermophilic waste composting.'
        ],
        learnerChoices: {
          question: 'What primary agricultural mix will power your 500-colonist biosphere?',
          options: [
            { id: 'opt-aeroponic-algae', label: 'High-Density Aeroponics + Spirulina Photobioreactors', description: '95% less water usage with fast-doubling algae buffers for O2 and protein.' },
            { id: 'opt-aquaponic-mycelia', label: 'Closed-Loop Aquaponics + Mycelium Composting', description: 'Tilapia/shrimp tanks fertilizing hydroponic greens while fungi break down crop stalks.' },
            { id: 'opt-cellular-hybrid', label: 'Cellular Agriculture + Dwarf Staple Crops', description: 'Bioreactor precision fermentation paired with caloric-dense sweet potato and wheat decks.' }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Submit your Closed-Loop Resource & Food Production Matrix proving 500-colonist daily kcal, L water, and kg O2 balance.',
          targetCompetencies: ['ctps-02', 'ent-01']
        },
        reflectionPrompt: 'If a single crop disease wipes out 40% of your primary carbohydrate crop, which secondary loop prevents starvation within 48 hours?',
        teacherTips: 'Have teams test their crop area and water recovery percentages inside Tab 2 of the Interstellar Ark Simulator to verify zero deficit.'
      },
      {
        sessionNumber: 8,
        week: 3,
        title: 'Activity 3.3: Dual-Ledger Budgeting — Thai Baht (THB) & Mission Tonnage',
        durationMin: 180,
        learningGoal: 'Build a realistic dual budget managing both classroom physical prototyping materials (<= 1,500 THB) and theoretical spacecraft mass/energy tonnage.',
        activities: [
          'Itemize classroom physical build materials in Thai Baht (corrugated cardboard, EVA foam sheets, PVC core pipe, balsa wood trusses, recycled PET domes, acrylic paint/markers) within the 1,500 THB cap.',
          'Construct the theoretical spacecraft dry-mass and power allocation budget (propulsion mass fraction, radiation shielding water mass, agricultural biomass, and spare parts stock).',
          'Calculate return on mass/energy investment for every subsystem.'
        ],
        learnerChoices: {
          question: 'How will you allocate your 1,500 THB classroom prototyping budget for maximum structural clarity?',
          options: [
            { id: 'opt-pvc-eva', label: 'PVC Spine + EVA Foam Centrifuge Rings (~1,350 THB)', description: 'Rigid central truss with precision-cut foam habitat rings and clear PET domes.' },
            { id: 'opt-balsa-cardboard', label: 'Balsa Truss + Layered Cardboard Terrain (~1,180 THB)', description: 'Lightweight architectural cutaway frames with topographical contour layers.' }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Upload your Dual Budget Ledger (THB Classroom Bill of Materials + Spacecraft Mass/Energy Tonnage Sheet).',
          targetCompetencies: ['ent-01', 'sdl-03']
        },
        reflectionPrompt: 'How does a strict 1,500 THB material ceiling force smarter engineering choices, just like launch mass limits in aerospace?',
        teacherTips: 'Directly connects to WeLearn Future Skill #6 (Entrepreneurship & Financial Literacy) in the MTC rubric.'
      },
      {
        sessionNumber: 9,
        week: 4,
        title: 'Activity 4.1 & 4.2: Frontier Governance Failures & Power Transition Law',
        durationMin: 420,
        learningGoal: 'Analyze historical frontier governance failures and design a constitutional transition from Transit Mission Law to Planetary Civic Law.',
        activities: [
          'Debate resource distribution models, labor division, reproductive/population equilibrium, and conflict resolution in zero-escape environments.',
          'Analyze why frontier settlements fail when emergency command powers become permanent oligarchies.',
          'Design the explicit legal trigger and power-transfer protocol from "Transit Mission Law" aboard the vessel to "Planetary Civic Law" upon exoplanet landing.'
        ],
        learnerChoices: {
          question: 'Which governance architecture will anchor your colony upon planetary landing?',
          options: [
            { id: 'opt-polycentric-council', label: 'Bicameral Citizen Assembly + Scientific Stewardship Council', description: 'Popularly elected civic chamber balanced by an ecological/ECLSS boundary veto.' },
            { id: 'opt-sortition-commons', label: 'Rotated Sortition Citizens’ Jury + Resource Commons', description: 'Randomly selected citizen panels with mandatory cross-guild rotation to prevent elites.' },
            { id: 'opt-cooperative-syndicate', label: 'Federated Guild & Neighborhood Commonwealth', description: 'Shared representation across biosphere, engineering, health, and education commons.' }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Submit your Transit-to-Planetary Power Transition Protocol and Frontier Governance Debate Brief.',
          targetCompetencies: ['lc-01', 'sea-02', 'ctps-02']
        },
        reflectionPrompt: 'What legal safeguard prevents the spacecraft captain or chief engineer from refusing to step down after landing?',
        teacherTips: 'Push students to write concrete sunset clauses and check-and-balance mechanisms—they will be tested against a strike in Week 10!'
      },
      {
        sessionNumber: 10,
        week: 4,
        title: 'Activity 4.3: Ratifying the New World Constitution & Legal Code',
        durationMin: 180,
        learningGoal: 'Draft the formal Colonial Charter establishing explicit laws for property, ecological sustainability mandates, restorative justice, and leadership selection.',
        activities: [
          'Draft Article I (Bill of Colonist Rights, Neurodiversity & Psychological Safety) and Article II (Commons Property & Resource Stewardship).',
          'Draft Article III (Restorative Justice & Conflict Resolution without incarceration bottlenecks) and Article IV (Democratic Leadership & Recall).',
          'Conduct a team ratification audit ensuring internal logical consistency with the 500-colonist ECLSS budget.'
        ],
        learnerChoices: {
          question: 'How will your legal code handle serious rule violations in a 500-person community where every pair of hands is needed?',
          options: [
            { id: 'opt-restorative-service', label: 'Restorative Justice & Supervised Ecological Service', description: 'Focuses on restitution, mediation, and supervised biosphere maintenance rather than punitive lockup.' },
            { id: 'opt-civic-tribunal', label: 'Three-Panel Peer Tribunal & Graduated Civic Credits', description: 'Transparent due process with graduated privileges and rehabilitation pathways.' }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Upload your ratified Deliverable 2: The Colonial Charter (New World Constitution & Legal Code).',
          targetCompetencies: ['ec-01', 'sea-02', 'lc-01']
        },
        reflectionPrompt: 'How do your constitutional laws protect minority viewpoints and psychological safety under extreme scarcity?',
        teacherTips: 'Check that teams have completed both Phase 2 deliverables: Colonial Charter & Closed-Loop Resource Budget.'
      }
    ]
  },
  {
    id: 'ideate',
    title: 'Phase 3: Spacecraft Architecture, Spatial Zoning & Maintenance Systems',
    strap: 'Configuring propulsion, artificial gravity, spatial zoning, and 100-year autonomous maintenance (Weeks 5–6 • 20 Hours).',
    weeks: [5, 6],
    goal: 'Ideate propulsion and artificial gravity geometry, balance spatial zoning across 6 functional sectors, and finalize the 100-Year Engineering & Maintenance Blueprint Package.',
    tasks: [
      'Activity 5.1 (4 hrs): Brainstorm propulsion concepts (fusion drives, solar sails, antimatter) and artificial gravity mechanisms (O’Neill cylinders, Stanford torus centrifuge rings).',
      'Activity 5.2 & 5.3 (6 hrs): Develop spatial zoning diagrams balancing industrial zones, agricultural biomes, residential quarters, medical bays, and communal restorative spaces; sketch orthographic projections (top, side, cross-section).',
      'Activity 6.1 & 6.2 (7 hrs): Ideate preventative and emergency maintenance protocols for micro-meteoroid impacts, radiation shielding degradation, and mechanical wear over 100 years; design modular replaceable architecture and automated repair drone bays.',
      'Activity 6.3 (3 hrs): Finalize the Engineering & Maintenance Blueprint Package detailing how human crews and automated systems maintain the vessel without external resupply.'
    ],
    evidence: [
      'Orthographic Vessel Projections (Top, Side, Cross-Section) & 6-Sector Spatial Zoning Diagram',
      'Engineering & Maintenance Blueprint Package (100-Year Hull Integrity, Modular Swapping & Automated Repair Drone Bays)'
    ],
    aiPromptStarters: [
      'Compare the structural mass and rotational stability of a single Stanford Torus vs counter-rotating O’Neill cylinders.',
      'Where should high-vibration industrial/propulsion zones be placed relative to residential quarters and hydroponic bays?',
      'Design a preventative maintenance schedule for centrifuge bearings and Whipple shields over a 100-year voyage with zero external resupply.'
    ],
    competencies: ['ct-01', 'ct-02', 'ctps-04'],
    stretchCompetencies: ['ct-05', 'sdl-04'],
    sessions: [
      {
        sessionNumber: 11,
        week: 5,
        title: 'Activity 5.1: Propulsion Concepts & Artificial Gravity Geometry',
        durationMin: 240,
        learningGoal: 'Select and calculate propulsion and centrifuge ring parameters capable of sustaining multi-decade interstellar transit.',
        activities: [
          'Compare D-He3 fusion pulse drives, beamed laser light sails, and antimatter-catalyzed thermal propulsion.',
          'Calculate centripetal acceleration (a = omega^2 * r) for Stanford torus rings vs O’Neill cylinders to achieve 0.9g–1.0g.',
          'Design counter-rotating ring pairs or reaction-wheel systems to eliminate gyroscopic precession during attitude maneuvers.'
        ],
        learnerChoices: {
          question: 'Which artificial gravity geometry will form the core of your spacecraft?',
          options: [
            { id: 'opt-twin-torus', label: 'Dual Counter-Rotating Stanford Torus Rings', description: 'Two 180m-radius rings connected to a zero-g axial docking, fabrication, and reactor spine.' },
            { id: 'opt-oneill-drum', label: 'Twin O’Neill Habitat Cylinders', description: 'Wide 320m-radius drums providing open parkland sightlines and deep soil beds.' },
            { id: 'opt-tethered-clusters', label: 'Modular Truss-Tethered Habitation Clusters', description: 'Redundant habitat pods balanced across a 450m carbon-truss boom for easy module isolation.' }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Submit your Propulsion & Artificial Gravity Calculation Sheet (radius, RPM, g-force, delta-v, and transit years).',
          targetCompetencies: ['ctps-04', 'ct-01']
        },
        reflectionPrompt: 'Why is a zero-gravity axial spine useful for heavy manufacturing and docking even when colonists live at 1g in the rings?',
        teacherTips: 'Have students test their ring radius and RPM in Tab 1 of the Interstellar Ark Simulator.'
      },
      {
        sessionNumber: 12,
        week: 5,
        title: 'Activity 5.2 & 5.3: Spatial Zoning & Orthographic Blueprints',
        durationMin: 360,
        learningGoal: 'Draft top, side, and cross-sectional orthographic projections balancing industrial, agricultural, residential, medical, and restorative zones.',
        activities: [
          'Map the 6 core zones: 1. Propulsion/Reactor Spine, 2. Water/ECLSS Treatment, 3. Vertical Agricultural Biomes, 4. Residential Neighborhoods, 5. Medical/Research Bays, 6. Communal Restorative Parks.',
          'Apply acoustic, thermal, and radiation buffering rules (placing water tanks and agriculture between reactors/hull and sleeping quarters).',
          'Sketch scaled orthographic projections (Top, Side, and Radial Cross-Section) by hand or using digital drawing tools.'
        ],
        learnerChoices: {
          question: 'How will your spatial zoning protect human psychological well-being across a 100-year voyage?',
          options: [
            { id: 'opt-biophilic-spine', label: 'Interwoven Green-Belt Neighborhoods', description: 'Every residential cluster opens directly onto an oxygen-producing agricultural atrium.' },
            { id: 'opt-acoustic-rings', label: 'Strict Acoustic & Vibration Ring Separation', description: 'Heavy industry and recycling stay in the axial core; rotating rings are 100% quiet human/plant biomes.' }
          ]
        },
        evidenceToCollect: {
          kind: 'media',
          prompt: 'Upload your Top, Side, and Cross-Sectional Orthographic Projections with color-coded spatial zoning.',
          targetCompetencies: ['ct-02', 'ec-02']
        },
        reflectionPrompt: 'How does the physical layout of your residential and communal spaces reinforce the democratic values in your Colonial Charter?',
        teacherTips: 'Check that students label emergency bulkheads so any single sector can be sealed without cutting off access to medical bays.'
      },
      {
        sessionNumber: 13,
        week: 6,
        title: 'Activity 6.1: 100-Year Hull Integrity & Preventative Maintenance',
        durationMin: 240,
        learningGoal: 'Ideate preventative and emergency maintenance protocols addressing micro-meteoroid impacts, shielding fatigue, and mechanical wear.',
        activities: [
          'Analyze multi-layer Whipple bumper shields and sacrificial ice/regolith armor against relativistic dust and micro-meteoroids.',
          'Map wear rates for seals, pumps, valves, LED arrays, and centrifuge bearings over a 100-year lifecycle.',
          'Design pressurized interior service crawlways so crews can inspect and repair hull segments without risky deep-space EVAs.'
        ],
        learnerChoices: {
          question: 'What primary hull defense strategy will protect your ark at cruise velocity?',
          options: [
            { id: 'opt-whipple-ice', label: 'Layered Whipple Shield + 3m Forward Ice Cone', description: 'Sacrificial forward ice mass absorbs kinetic impacts while doubling as propellant/water reserve.' },
            { id: 'opt-plasma-bumper', label: 'Electromagnetic Dust Deflector + Modular Tile Armor', description: 'Ionizes and deflects charged interstellar dust ahead of replaceable ceramic-composite hull tiles.' }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Submit your 100-Year Preventative & Emergency Hull Maintenance Protocol.',
          targetCompetencies: ['ctps-04', 'sdl-04']
        },
        reflectionPrompt: 'Why must every critical valve, bearing, and filter on an interstellar ark be reachable and replaceable while the system is running?',
        teacherTips: 'Remind teams that physical maintenance access routes must be visibly shown on their Week 8 cutaway model.'
      },
      {
        sessionNumber: 14,
        week: 6,
        title: 'Activity 6.2 & 6.3: Modular Architecture, Repair Drone Bays & Blueprint Package',
        durationMin: 360,
        learningGoal: 'Design standardized modular components and automated repair drone bays so the vessel fabricates its own spare parts mid-flight.',
        activities: [
          'Standardize pipe diameters, hatch rings, circuit boards, and structural struts so recycled scrap metal/polymer feedstock can be 3D-sintered aboard.',
          'Design automated exterior and interior repair drone bays linked to zero-g metallurgical foundries.',
          'Compile the complete Phase 3 Deliverable: 2D/Digital Blueprints & Engineering Maintenance Protocols Package.'
        ],
        learnerChoices: {
          question: 'How will human maintenance crews and autonomous repair drones divide responsibilities?',
          options: [
            { id: 'opt-drone-exterior', label: 'Exterior EVA Drones + Human Interior Guilds', description: 'Autonomous spider-drones handle high-radiation exterior hull swaps; human crews manage internal ECLSS.' },
            { id: 'opt-digital-twin-pred', label: 'Acoustic Sensor Digital Twin + Automated Foundry', description: 'Vibration sensors predict bearing wear 6 months ahead and auto-queue metal 3D printing.' }
          ]
        },
        evidenceToCollect: {
          kind: 'code',
          prompt: 'Upload your finalized Engineering & Maintenance Blueprint Package and Modular Spare-Part Fabrication Spec.',
          targetCompetencies: ['ct-01', 'ctps-04', 'lc-02']
        },
        reflectionPrompt: 'How does standardization of modular parts prevent a minor mechanical breakdown from cascading into mission failure?',
        teacherTips: 'Confirm every team has completed both Weeks 5–6 deliverables: 2D/Digital Blueprints & Maintenance Protocols.'
      }
    ]
  },
  {
    id: 'prototype',
    title: 'Phase 4: Digital Schematics, Digital Twin & Low-Fidelity Physical Scale Model',
    strap: 'Translating conceptual blueprints into 3D CAD / Digital Twin simulations and a 1,500 THB physical scale model (Weeks 7–8 • 20 Hours).',
    weeks: [7, 8],
    goal: 'Create detailed digital/hand-drafted technical schematics with labeled subsystems AND construct a low-fidelity physical scale model of the spacecraft and exoplanet landing terrain within 1,500 THB.',
    tasks: [
      'Activity 7.1 (5 hrs): Create detailed architectural layouts and engineering schematics using digital 3D modeling (Blender, FreeCAD, Fusion 360, or Digital Twin Simulator) or precision hand-drafted isometric/cross-sectional blueprints.',
      'Activity 7.2 (5 hrs): Map internal subsystems directly onto the drawings, labeling hydroponic bays, airlocks, maintenance corridors, centrifuge joints, and command modules.',
      'Activity 8.1 & 8.2 (7 hrs): Source low-cost prototyping materials (cardboard, EVA foam scraps, PVC pipes, balsa wood, recycled plastics, wire) within 1,500 THB and construct a physical scale model of the spacecraft + target planet landing terrain slice.',
      'Activity 8.3 (3 hrs): Integrate color-coded physical markers or cutaways on the model to demonstrate internal human spaces, agricultural zones, and engineering maintenance access points.'
    ],
    evidence: [
      'Digital 3D Models / Isometric Technical Blueprints with Labeled Internal Subsystems (ECLSS, Hydroponics, Centrifuge Joints, Airlocks)',
      'Low-Fidelity Physical Scale Spacecraft & Exoplanet Terrain Model + Physical Maintenance Cutaway/Diagram (<= 1,500 THB)'
    ],
    aiPromptStarters: [
      'Help me generate a scale bar and subsystem callout checklist for our isometric spacecraft cross-section.',
      'What structural techniques with PVC pipe, corrugated cardboard ribs, and EVA foam best represent a rotating torus ring and detachable lander?',
      'Audit our physical cutaway markers: do they clearly show hull repair routes, ECLSS servicing, and modular component swapping?'
    ],
    competencies: ['ct-02', 'ct-05', 'ent-02', 'sdl-05'],
    stretchCompetencies: ['ct-06', 'lc-03'],
    sessions: [
      {
        sessionNumber: 15,
        week: 7,
        title: 'Activity 7.1: Digital 3D Modeling, Digital Twin & Isometric Schematics',
        durationMin: 300,
        learningGoal: 'Construct scaled digital 3D models (Blender/FreeCAD/Fusion 360), interactive Digital Twin layouts, or precision isometric blueprints.',
        activities: [
          'Establish uniform engineering scale (e.g., 1:500 for full vessel, 1:100 for habitat sector cross-section).',
          'Model the primary hull spine, centrifuge rings, radiation shielding layers, and detachable exoplanet landing module.',
          'Configure the Interactive Digital Twin Ark Builder to mirror the team’s exact sector proportions.'
        ],
        learnerChoices: {
          question: 'Which technical drafting track will your team use for your Week 7 schematics?',
          options: [
            { id: 'opt-3d-cad', label: '3D CAD / Blender / Fusion 360 + Digital Twin', description: 'Layered 3D digital assembly with exploded cutaway views and simulated telemetry.' },
            { id: 'opt-isometric-draft', label: 'Precision Hand-Drafted Isometric & Cross-Sectional Plates', description: 'Architectural vellum/grid technical plates with scale callouts and Digital Twin verification.' }
          ]
        },
        evidenceToCollect: {
          kind: 'media',
          prompt: 'Upload your scaled Digital 3D Renders or Isometric Architectural Blueprints.',
          targetCompetencies: ['ct-02', 'sdl-05']
        },
        reflectionPrompt: 'What spatial conflicts did you discover only when translating your rough Week 5 sketches into true-to-scale 3D/isometric geometry?',
        teacherTips: 'Emphasize scale accuracy and layer organization over cosmetic textures—matching the Product Analysis rubric on page 6 of the PDF.'
      },
      {
        sessionNumber: 16,
        week: 7,
        title: 'Activity 7.2: Internal Subsystem Mapping & Technical Callouts',
        durationMin: 300,
        learningGoal: 'Map and label all critical internal subsystems directly onto the technical drawings: hydroponics, airlocks, maintenance corridors, centrifuge joints, and command modules.',
        activities: [
          'Trace color-coded utility loops (blue = potable/grey water recovery, green = O2/CO2 ventilation & hydroponic nutrients, amber = high-voltage power bus, red = emergency airlock & drone corridors).',
          'Detail the mechanical rotary joint and pressure seal where the rotating centrifuge ring meets the non-rotating axial spine.',
          'Verify that every subsystem in the Week 3 ECLSS spreadsheet has a physical home and volume on the drawing.'
        ],
        learnerChoices: {
          question: 'Which engineering cutaway detail will be your team’s signature technical callout?',
          options: [
            { id: 'opt-rotary-joint', label: 'Centrifuge Rotary Pressure Seal & Bearing Assembly', description: 'Shows magnetic/fluid seals, backup rollers, and pressurized crew transfer tube.' },
            { id: 'opt-eclss-atrium', label: 'Vertical Aeroponic & Algae Bioreactor Deck Section', description: 'Shows root-mist manifolds, LED light banks, water condensation recovery, and harvesting chutes.' },
            { id: 'opt-lander-dock', label: 'Detachable Exoplanet Landing Module Interface', description: 'Shows heat-shield separation locks, surface legs, and modular colony core.' }
          ]
        },
        evidenceToCollect: {
          kind: 'media',
          prompt: 'Submit your Fully Labeled Subsystem Blueprints (Hydroponics, Airlocks, Maintenance Corridors, Centrifuge Joints, Command).',
          targetCompetencies: ['ct-05', 'ec-02']
        },
        reflectionPrompt: 'Can an outside engineer trace how a single drop of water travels from crew quarters through filtration to hydroponics and back on your blueprint?',
        teacherTips: 'Use the PDF’s exact checklist: hydroponic bays, airlocks, maintenance corridors, centrifuge joints, and command modules.'
      },
      {
        sessionNumber: 17,
        week: 8,
        title: 'Activity 8.1 & 8.2: 1,500 THB Material Sourcing & Scale Ark/Terrain Model Build',
        durationMin: 420,
        learningGoal: 'Construct a low-fidelity physical scale model of the interstellar spacecraft and a slice of the target exoplanet terrain within the 1,500 THB budget.',
        activities: [
          'Audit purchased and upcycled materials against the 1,500 THB ledger (cardboard, EVA foam scraps, PVC pipes, balsa wood, recycled plastics, wire).',
          'Fabricate the structural spine, rotating habitat ring geometry, and propulsion cone focusing on structural logic and spatial proportions.',
          'Sculpt a contoured slice of the target exoplanet’s terrain showing how the initial landing module/colony layout interfaces with surface geology.'
        ],
        learnerChoices: {
          question: 'How will your physical model demonstrate the transition from orbital ark to planetary surface colony?',
          options: [
            { id: 'opt-detachable-lander', label: 'Detachable Landing Module + Contoured Terrain Base', description: 'A removable nose/bay module physically docks onto the sculpted exoplanet terrain board.' },
            { id: 'opt-split-diptych', label: 'Dual-Scale Diptych Rig (Orbital Vessel + Surface Dome Cutaway)', description: 'Side-by-side physical rig pairing full-ship geometry with a 1:100 surface habitat cutaway.' }
          ]
        },
        evidenceToCollect: {
          kind: 'media',
          prompt: 'Upload photos of your Physical Scale Spacecraft & Exoplanet Terrain Model alongside your finalized 1,500 THB receipt ledger.',
          targetCompetencies: ['ct-02', 'ent-02', 'lc-02']
        },
        reflectionPrompt: 'How did building with physical cardboard, PVC, and EVA foam test structural load assumptions that looked easy on a screen?',
        teacherTips: 'Remind learners: focus is on structural logic, spatial proportions, and functional zoning rather than hyper-detailed cosmetic finishing.'
      },
      {
        sessionNumber: 18,
        week: 8,
        title: 'Activity 8.3: Color-Coded Zoning Markers & Physical Maintenance Cutaways',
        durationMin: 180,
        learningGoal: 'Integrate hinged or removable cutaway sections and color-coded markers demonstrating internal human spaces, agricultural zones, and maintenance access.',
        activities: [
          'Cut hinged inspection windows into the habitat ring and axial spine to reveal interior deck layers.',
          'Install color-coded physical markers/pins matching the digital blueprint legend (Residential, Agriculture, ECLSS, Medical, Drone Repair Bays, Maintenance Crawlways).',
          'Create the Physical Maintenance Cutaway Diagram showing physical access routes for hull repair, life-support servicing, and modular component swapping.'
        ],
        learnerChoices: {
          question: 'How will review panelists inspect the interior of your physical scale model?',
          options: [
            { id: 'opt-hinged-hull', label: 'Removable Quarter-Hull Cutaway Shell', description: 'Lifts off to expose multi-tier hydroponic decks, crew quarters, and axial service tunnels.' },
            { id: 'opt-clear-pet-window', label: 'Transparent Recycled-PET Sector Windows + Color Pins', description: 'See-through structural bays with numbered maintenance access flags.' }
          ]
        },
        evidenceToCollect: {
          kind: 'media',
          prompt: 'Submit close-up photos of your Color-Coded Physical Cutaways and Physical Maintenance Cutaway Diagram.',
          targetCompetencies: ['ct-05', 'ec-02']
        },
        reflectionPrompt: 'Does your physical model immediately communicate where people sleep, where food grows, and how a broken bearing gets repaired?',
        teacherTips: 'Verify both Weeks 7–8 deliverables from the PDF: Physical Scale Model & CAD/Technical Drawings.'
      }
    ]
  },
  {
    id: 'test',
    title: 'Phase 5: Red-Team Stress-Testing, Crisis Simulation & Constitutional Trials',
    strap: 'Subjecting engineering blueprints, closed-loop biospheres, and colonial laws to stochastic emergencies (Weeks 9–10 • 20 Hours).',
    weeks: [9, 10],
    goal: 'Conduct Red-Team peer critiques, run stochastic engineering/biosphere crisis simulations, roleplay a planetary landing constitutional crisis, and iterate both physical/digital designs and the Colonial Charter.',
    tasks: [
      'Activity 9.1 & 9.2 (7 hrs): Conduct "Red Team" peer critiques inspecting rival physical models/blueprints for bottlenecks or single-point failures; run a stochastic crisis simulation (e.g., 40% hydroponic pathogen blight or centrifuge bearing seizure) and calculate survival margins.',
      'Activity 9.3 (3 hrs): Document engineering flaws and physically/digitally modify the spacecraft prototype and blueprints based on test data.',
      'Activity 10.1 & 10.2 (7 hrs): Roleplay a constitutional crisis upon planetary landing (e.g., engineer faction strike over rations or land allocation dispute) and evaluate whether the legal framework resolves conflict peacefully or descends into authoritarianism/anarchy.',
      'Activity 10.3 (3 hrs): Amend the Colonial Charter and refine spacecraft interior zoning to address the social and operational vulnerabilities uncovered during testing.'
    ],
    evidence: [
      'Red-Team Failure Report & Stochastic Crisis Survival Margin Calculations',
      'Revised Engineering Specs, Prototype Iteration Log & Constitutional Crisis Amendment Record'
    ],
    aiPromptStarters: [
      'Act as an aerospace Red Team: find 3 single-point failure bottlenecks in our ECLSS loop and centrifuge bearing layout.',
      'Simulate a 40% hydroponic crop failure for 500 colonists: how many days of reserve calories do we need while Spirulina bioreactors scale up?',
      'Stress-test our Colonial Charter against a landing strike by propulsion engineers: which clause prevents martial law from becoming permanent dictatorship?'
    ],
    competencies: ['ctps-05', 'sea-03', 'lc-04', 'sdl-06'],
    stretchCompetencies: ['ctps-08', 'sea-06'],
    sessions: [
      {
        sessionNumber: 19,
        week: 9,
        title: 'Activity 9.1 & 9.2: Red-Team Peer Critique & Stochastic Crisis Simulation',
        durationMin: 420,
        learningGoal: 'Audit rival physical models for single-point failures and calculate quantitative survival margins under a stochastic engineering/biosphere emergency.',
        activities: [
          'Conduct structured Red-Team inspections of a rival team’s physical model and blueprints, hunting for unshielded crew zones, dead-end corridors, or single-point ECLSS failures.',
          'Draw a stochastic crisis card (or trigger in the Interstellar Ark Simulator): e.g., Fusarium pathogen wipes out 40% of primary hydroponic crop, or primary centrifuge bearing seizes.',
          'Calculate caloric, water, and oxygen survival margins hour-by-hour and execute maintenance protocols to stabilize the vessel.'
        ],
        learnerChoices: {
          question: 'Which primary stochastic emergency will your team stress-test first in the simulator?',
          options: [
            { id: 'opt-crop-blight', label: '40% Hydroponic Pathogen Blight (Biosphere Shock)', description: 'Tests bulkhead quarantine, UV sterilization, and algae bioreactor surge capacity.' },
            { id: 'opt-bearing-seize', label: 'Centrifuge Bearing Seizure (Mechanical/Gravity Shock)', description: 'Tests counter-torque thrusters, autonomous drone welding, and emergency ring evacuation.' },
            { id: 'opt-cme-breach', label: 'Micrometeoroid Hull Breach + Solar Storm', description: 'Tests modular Whipple plug swapping and central water-core storm shelter capacity.' }
          ]
        },
        evidenceToCollect: {
          kind: 'data',
          prompt: 'Submit your Red-Team Failure Report and Stochastic Crisis Survival Margin Calculations.',
          targetCompetencies: ['ctps-05', 'sea-03']
        },
        reflectionPrompt: 'How did your team react emotionally when the Red Team exposed a fatal flaw in your blueprint, and how did you turn critique into data?',
        teacherTips: 'Directly assesses WeLearn Future Skill #2 (Critical Thinking) and #7 (Social & Emotional Aptitude: managing Red-Team critiques calmly).'
      },
      {
        sessionNumber: 20,
        week: 9,
        title: 'Activity 9.3 & 10.1: Prototype Engineering Iteration & Constitutional Crisis Roleplay',
        durationMin: 420,
        learningGoal: 'Physically/digitally modify the spacecraft prototype from Red-Team test data and roleplay a high-stakes constitutional crisis upon planetary landing.',
        activities: [
          'Modify physical scale models and digital schematics to eliminate single-point failures (adding redundant bypass valves, secondary airlocks, or storm shelter shielding).',
          'Stage the Week 10 Constitutional Crisis Roleplay: upon planetary landing, an essential faction of engineers goes on strike demanding higher rations or prime terrain allocation.',
          'Run the live negotiation and legal hearing strictly under the articles written in the team’s Week 4 Colonial Charter.'
        ],
        learnerChoices: {
          question: 'Which constitutional crisis scenario will your colony roleplay and adjudicate?',
          options: [
            { id: 'opt-ration-strike', label: 'Essential Engineers’ Ration & Privilege Strike', description: 'Propulsion/ECLSS guild demands 1.5x rations and veto power over surface construction.' },
            { id: 'opt-land-dispute', label: 'Geothermal Valley Land Allocation Standoff', description: 'First-wave landing vanguard claims exclusive ownership of prime surface water and geothermal vents.' },
            { id: 'opt-martial-lock', label: 'Transit Commander Refuses Civic Handover', description: 'Bridge command cites surface radiation hazards to indefinitely suspend Planetary Civic Law.' }
          ]
        },
        evidenceToCollect: {
          kind: 'feedback',
          prompt: 'Upload your Before/After Engineering Iteration Photos and Constitutional Crisis Roleplay Transcript.',
          targetCompetencies: ['lc-04', 'sea-03', 'ctps-05']
        },
        reflectionPrompt: 'Did your original Colonial Charter resolve the landing strike peacefully, or did it leave a loophole for authoritarianism or anarchy?',
        teacherTips: 'Have rival teams play the striking faction so the legal framework is genuinely stress-tested.'
      },
      {
        sessionNumber: 21,
        week: 10,
        title: 'Activity 10.2 & 10.3: Legal Framework Audit & Colonial Charter Amendments',
        durationMin: 360,
        learningGoal: 'Amend the Colonial Charter and refine interior spacecraft spatial zoning to resolve social and operational vulnerabilities uncovered during testing.',
        activities: [
          'Evaluate the constitutional trial outcome against human rights, equity, and operational survival.',
          'Draft formal Constitutional Amendments (e.g., mandatory cross-training across guilds, automatic martial-law sunset triggers, neutral Citizens’ Ombudsperson).',
          'Update interior spatial zoning on the physical model and blueprints to reflect post-crisis communal and safety improvements.'
        ],
        learnerChoices: {
          question: 'What structural reform will your team ratify in Constitutional Amendment #1?',
          options: [
            { id: 'opt-cross-guild', label: 'Universal Cross-Guild Apprenticeship Mandate', description: 'Every colonist is cross-trained in at least two critical life-support domains to prevent guild monopolies.' },
            { id: 'opt-sunset-tribunal', label: 'Automatic 30-Day Emergency Sunset & Citizen Recall', description: 'Any emergency ration or security decree expires automatically unless re-ratified by a 2/3 citizen assembly.' }
          ]
        },
        evidenceToCollect: {
          kind: 'note',
          prompt: 'Submit your ratified Colonial Charter Amendments and Revised Engineering Specifications (Phase 5 Deliverable).',
          targetCompetencies: ['sea-03', 'ctps-05', 'sdl-06']
        },
        reflectionPrompt: 'Why is a constitution that can be peacefully amended stronger than a rigid code that claims to be infallible?',
        teacherTips: 'Confirm every team has both Weeks 9–10 deliverables: Red-Team Failure Report & Revised Engineering Specs.'
      }
    ]
  },
  {
    id: 'share',
    title: 'Phase 6: The Exodus Exhibition, 15-Minute Council Pitch & Mastery Portfolio',
    strap: 'Pitching the 4-Pillar Colonization Plan to the United Earth Exodus Council and curating the MTC Mastery Portfolio (Weeks 11–12 • 20 Hours).',
    weeks: [11, 12],
    goal: 'Structure and rehearse the 15-minute 4-Pillar Colonization Pitch Deck, defend physical models and charters before the United Earth Exodus Council (10-min pitch + 5-min Q&A), and curate the MTC Mastery Portfolio.',
    tasks: [
      'Activity 11.1 (4 hrs): Structure the formal 15-minute Colonization Pitch Deck weaving together four pillars: 1. The Destination, 2. The Vessel, 3. The Biosphere, and 4. The New Society.',
      'Activity 11.2 & 11.3 (6 hrs): Finalize physical model presentation boards corresponding to digital renders/schematics and conduct full dress rehearsals with timed feedback loops.',
      'Activity 12.1 (5 hrs): The Live Showcase Pitch — present physical models, blueprints, and political charters to the "United Earth Exodus Council" (10-minute presentation + 5-minute rigorous Q&A defense).',
      'Activity 12.2 & 12.3 (5 hrs): Curate CAD files, physical model documentation, engineering logs, and political charters into a digital Mastery Portfolio and complete 120-hour post-mortem peer reflection.'
    ],
    evidence: [
      '4-Pillar 15-Minute Colonization Pitch Deck & Synchronized Physical Model Presentation Boards',
      'United Earth Exodus Council Live Defense Record (10-Min Pitch + 5-Min Q&A) & Complete MTC Mastery Evidence Folder'
    ],
    aiPromptStarters: [
      'Review our 15-minute 4-Pillar Pitch outline: does it seamlessly connect Destination, Vessel, Biosphere, and New Society in 10 minutes?',
      'Generate 5 tough Q&A questions the United Earth Exodus Council might ask about our 500-colonist ECLSS math, 1,500 THB model, or Colonial Charter.',
      'Help me map our portfolio artifacts against the 7 WeLearn Future Skills (MTC Proficient & Advanced criteria).'
    ],
    competencies: ['ec-01', 'ec-03', 'lc-05', 'sdl-07'],
    stretchCompetencies: ['ec-05', 'ent-04'],
    sessions: [
      {
        sessionNumber: 22,
        week: 11,
        title: 'Activity 11.1 & 11.2: 4-Pillar Colonization Pitch Architecture & Presentation Boards',
        durationMin: 420,
        learningGoal: 'Synthesize 10 weeks of astrophysical, engineering, agricultural, and legal work into a cohesive 4-Pillar Colonization Pitch Deck and display boards.',
        activities: [
          'Structure the 4 Pillars: Pillar 1 (The Destination: Goldilocks planet & terrain adaptation), Pillar 2 (The Vessel: spacecraft engineering, zoning & 100-year maintenance), Pillar 3 (The Biosphere: closed-loop food/ECLSS math), Pillar 4 (The New Society: political philosophy & constitutional charter).',
          'Align physical scale model presentation boards so callout numbers on the physical cutaway match slide diagrams 1-to-1.',
          'Verify that all 7 WeLearn Future Skills evidence requirements are represented.'
        ],
        learnerChoices: {
          question: 'How will your team choreograph the physical scale model walkthrough during the 10-minute presentation?',
          options: [
            { id: 'opt-live-cutaway', label: 'Live Cutaway Disassembly Demo', description: 'Speakers lift the hull cutaway shell and dock the landing module onto the terrain slice live on stage.' },
            { id: 'opt-synchronized-twin', label: 'Synchronized Physical Model + Digital Twin Telemetry', description: 'One teammate points to physical cutaway zones while the screen displays live ECLSS & crisis telemetry.' }
          ]
        },
        evidenceToCollect: {
          kind: 'media',
          prompt: 'Upload your 4-Pillar Colonization Pitch Deck and Physical Model Presentation Board layouts.',
          targetCompetencies: ['ec-01', 'ec-03', 'ct-02']
        },
        reflectionPrompt: 'How do your four pillars prove that engineering without just governance—or governance without rigorous physics—would fail in deep space?',
        teacherTips: 'Ensure teams do not present the 4 pillars as disconnected silos; the narrative must show how planet, ship, biosphere, and constitution interlock.'
      },
      {
        sessionNumber: 23,
        week: 12,
        title: 'Activity 11.3 & 12.1: Dress Rehearsal & Live Defense before the United Earth Exodus Council',
        durationMin: 480,
        learningGoal: 'Deliver a polished 10-minute presentation followed by a 5-minute rigorous Q&A defense before the external review panel.',
        activities: [
          'Conduct timed dress rehearsals (strictly 10 minutes presentation + 5 minutes Q&A) refining vocal clarity, slide transitions, and physical model handling.',
          'Present live to the "United Earth Exodus Council" (mentors, educators, and industry guests).',
          'Defend quantitative ECLSS numbers, centrifuge/maintenance physics, THB/tonnage budgets, and constitutional clauses under panel questioning.'
        ],
        learnerChoices: {
          question: 'How will your team assign Q&A defense roles across the panel’s interdisciplinary questions?',
          options: [
            { id: 'opt-pillar-captains', label: 'Dedicated 4-Pillar Domain Leads', description: 'Astrophysics/Terrain Lead, Vessel/CAD Lead, Biosphere/ECLSS Lead, and Constitutional/Budget Lead.' },
            { id: 'opt-relay-defense', label: 'Cross-Disciplinary Relay Defense', description: 'Every answer pairs an engineering metric with its human/constitutional impact.' }
          ]
        },
        evidenceToCollect: {
          kind: 'feedback',
          prompt: 'Submit your Exodus Council Evaluation Scorecard, Q&A Defense Notes, and Pitch Documentation (Note: any audio/video recording requires prior school consent and is never stored by the platform).',
          targetCompetencies: ['ec-03', 'lc-05', 'ctps-05']
        },
        reflectionPrompt: 'Which question from the United Earth Exodus Council challenged your assumptions the most, and how did you defend your design?',
        teacherTips: 'Safeguarding reminder: any recording of student pitches requires prior school consent and must never be stored on the platform.'
      },
      {
        sessionNumber: 24,
        week: 12,
        title: 'Activity 12.2 & 12.3: Mastery Evidence Folder Curation & 120-Hour Post-Mortem',
        durationMin: 300,
        learningGoal: 'Compile all physical and digital deliverables into a Mastery Transcript Consortium (MTC)-aligned portfolio and conduct a 120-hour team retrospective.',
        activities: [
          'Curate the final Evidence Folder: 1. Exoplanet Dossier & Human Needs Matrix, 2. Colonial Charter & Closed-Loop Resource Budget, 3. 2D/3D Blueprints & Maintenance Protocols, 4. Physical Scale Model & Cutaway Photos, 5. Red-Team Failure Report & Revised Specs, 6. Showcase Pitch Deck.',
          'Self-assess against Emerging, Proficient, and Advanced descriptors across all 7 WeLearn Future Skills.',
          'Complete the post-mortem reflection and peer evaluation on team dynamics and personal growth across the 120-hour cycle.'
        ],
        learnerChoices: {
          question: 'Which WeLearn Future Skill represents your strongest personal growth from Week 1 to Week 12?',
          options: [
            { id: 'opt-growth-systems', label: 'Critical Thinking & Quantitative Systems Engineering', description: 'Mastering closed-loop ECLSS math, centrifuge physics, and Red-Team stress testing.' },
            { id: 'opt-growth-design', label: 'Creative Thinking & Dual-Fidelity Prototyping', description: 'Translating abstract space architecture into 3D schematics and a 1,500 THB physical model.' },
            { id: 'opt-growth-civic', label: 'Social/Emotional Empathy & Constitutional Leadership', description: 'Designing inclusive habitats, restorative laws, and mediating high-pressure team sprints.' }
          ]
        },
        evidenceToCollect: {
          kind: 'reflection',
          prompt: 'Submit your Final MTC Evidence Folder Index and 120-Hour Personal & Peer Retrospective.',
          targetCompetencies: ['sdl-07', 'sea-03', 'lc-05']
        },
        reflectionPrompt: 'How has designing a civilization for another star system changed the way you look at ecological closed loops and civic justice here on Earth?',
        teacherTips: 'Celebrate the completion of the 120-hour journey and review each learner’s MTC Mastery evidence across all 7 domains.'
      }
    ]
  }
];

export const INTERSTELLAR_ARK_PROGRAM: PblProgram = {
  id: 'interstellar-ark-horizon-2026',
  title: "Engineering Humanity's Next Horizon: Interstellar Ark & Exoplanet Civilization",
  subtitle: 'Designing a self-sustaining multi-generational interstellar ark, closed-loop 500-colonist biosphere, and constitutional exoplanet society across a 120-hour Design Thinking cycle.',
  status: 'complete',
  theme: 'Aerospace Systems, Closed-Loop Biospheres & Exoplanet Governance',
  drivingQuestion: 'How might we engineer a self-sustaining interstellar ark and establish a just, resilient civilization on an exoplanet to ensure the long-term survival of humanity?',
  realProblem: {
    type: 'both',
    summary: 'Deep-space multi-generational survival and exoplanet colonization require solving tightly coupled physical, biological, and social constraints: microgravity bone loss, cosmic radiation, 100% closed-loop food/water/oxygen recycling for 500 people, 100-year zero-resupply hull maintenance, and a constitutional legal framework that prevents authoritarian or ecological collapse.',
    peopleImpact: 'Equips learners to design habitats, life-support loops, and restorative constitutional laws that protect human physiological health, neurodiversity, psychological safety, and civic justice under extreme confinement.',
    environmentalImpact: 'Models a 100% closed-loop biosphere (aeroponics, hydroponics, cellular agriculture, Spirulina photobioreactors, >=98% water recovery, and zero-waste composting) within strict mass, energy, and 1,500 THB classroom material budgets.'
  },
  targetAgeRange: 'Ages 12–17 (Middle & Upper Secondary; adaptable scaffolds for Ages 9–11)',
  durationWeeks: 12,
  totalSessions: 24,
  materialsAndKit: {
    microcontrollers: [
      'Interactive Digital Twin Ark & Closed-Loop ECLSS Simulator (built-in web simulation sandbox)',
      'Optional BBC micro:bit V2 or Arduino environmental sensors for live terrarium/greenhouse telemetry demo'
    ],
    sensorsAndActuators: [
      'Digital Twin Telemetry: Centrifuge RPM/g-force calculator, 500-colonist kcal/O2/water mass-balance engine, and stochastic crisis simulator',
      'Optional low-voltage LED strips (circadian lighting demo) and DC micro-motor (centrifuge ring rotation demo)'
    ],
    fabricationMaterials: [
      'Low-cost classroom prototyping materials within a strict 1,500 THB per team budget: corrugated cardboard, EVA foam scraps, PVC pipes, balsa wood, recycled clear PET plastics, wire',
      'Color-coded physical markers, pins, and hinged cutaway labels for internal human spaces, agricultural zones, and maintenance access routes'
    ],
    softwareAndTools: [
      'Digital 3D Modeling (Blender, FreeCAD, or Fusion 360) OR precision hand-drafted isometric and cross-sectional blueprints',
      'NASA Exoplanet Archive reference telemetry & Closed-Loop ECLSS Spreadsheet / Digital Twin Matrix',
      'WeLearn 7 Future Skills Rubric (Mastery Transcript Consortium aligned)'
    ]
  },
  teacherGuidance: {
    safetyProtocol: [
      'Workshop Cutting & Adhesive Safety: Use cutting mats, safety rulers, and low-VOC glues/hot-glue stands when shaping cardboard, EVA foam, PVC pipe, and balsa wood.',
      'Budget Discipline: Enforce the 1,500 THB classroom material ceiling per team; encourage upcycled plastics and scrap foam.',
      'Child Safeguarding & Privacy: Under-13 learners never use voice/video recording; any pitch recording for older learners requires prior school consent and must never be stored by the platform.'
    ],
    pedagogicalScaffolding: [
      'Dual-Fidelity Requirement: Ensure every team submits work across both structural categories defined in the curriculum: (1) Tangible Physical Deliverables (scale model + maintenance cutaway) and (2) Digital/Conceptual Creations (3D/technical blueprints + ECLSS matrix + Colonial Charter).',
      'Red-Team Psychological Safety: Frame Week 9–10 Red-Team critiques and crisis simulations as collaborative systems-engineering stress tests, never personal attacks.'
    ],
    aiEthicsRules: [
      'AI Co-Pilot may be used to stress-test ECLSS mass-balance equations, brainstorm historical frontier governance parallels, and simulate Red-Team Q&A.',
      'Prompt Provenance Mandatory: Every AI consultation must log what was asked, what the AI returned, and how the team verified and modified the output.'
    ],
    differentiationNotes: [
      'Foundational / Emerging Track: Use pre-calculated crop yield tables in the Digital Twin Simulator and focus on clear 2D cross-sectional diagrams and core constitutional articles.',
      'Advanced / Transferable Track: Model secondary and tertiary cascade failures (e.g., mechanical bearing wear triggering social rationing disputes), multi-layer CAD assemblies, and post-scarcity frontier economics.'
    ]
  },
  measurableImpactCriteria: [
    {
      id: 'metric-ark-eclss',
      metric: '500-Colonist Closed-Loop ECLSS & Caloric Balance',
      target: '100% daily caloric target (1,250,000 kcal/day), >= 98% water loop recovery, and >= 100% O2 regeneration verified across normal and 40%-blight crisis states',
      verificationMethod: 'Closed-Loop Resource & Food Production Matrix audit + Stochastic Crisis Simulation survival margin test in Week 9'
    },
    {
      id: 'metric-ark-budget-prototype',
      metric: 'Dual-Fidelity Prototype & 1,500 THB Budget Compliance',
      target: 'Scaled physical spacecraft + exoplanet terrain model with color-coded maintenance cutaways built for <= 1,500 THB, paired with labeled 3D/isometric schematics',
      verificationMethod: 'Itemized THB receipt ledger + physical cutaway inspection (hydroponic bays, airlocks, maintenance corridors, centrifuge joints, command modules)'
    },
    {
      id: 'metric-ark-charter-defense',
      metric: 'Constitutional Resilience & 15-Minute Exodus Council Defense',
      target: 'Peaceful legal resolution of the Week 10 landing strike plus cohesive 10-min 4-Pillar Pitch + 5-min Q&A defense across all 7 WeLearn Future Skills',
      verificationMethod: 'United Earth Exodus Council rubric evaluation (Mastery Transcript Consortium Emerging / Proficient / Advanced descriptors)'
    }
  ],
  assumptions: [
    {
      id: 'asmp-ark-schedule',
      domain: '12-Week / 120-Hour Sprint Schedule',
      assumption: 'Program runs as six 2-week Design Thinking sprints (10 hours/week = 120 hours total) culminating in the Week 12 United Earth Exodus Council Exhibition.',
      ownerVerificationNeeded: 'Confirm 10h/week studio block allocation and external panelist invitations for the Week 12 Exodus Council Showcase.',
      confirmation: {
        status: 'needs_owner_confirmation'
      }
    },
    {
      id: 'asmp-ark-budget',
      domain: '1,500 THB Classroom Prototyping Cap & CAD Access',
      assumption: 'Each student team operates within a 1,500 THB classroom material budget for low-fidelity physical models and has access to either Blender/FreeCAD/Fusion 360, the built-in Digital Twin Simulator, or isometric drafting supplies.',
      ownerVerificationNeeded: 'Confirm 1,500 THB per-team material petty cash or scrap material lab stock with school operations.',
      confirmation: {
        status: 'needs_owner_confirmation'
      }
    }
  ],
  phases: INTERSTELLAR_ARK_PHASES
};
