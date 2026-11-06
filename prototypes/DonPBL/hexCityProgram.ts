/**
 * Don's PBL Program: Hex-City Thailand (12-Week Modular Resilient Floating City)
 * Branch: DonPBL
 * Location: prototypes/DonPBL/hexCityProgram.ts
 * 
 * Sourced from WeLearn Academy / InnovationCoach PBL Curriculum.
 * Includes:
 * - Scale 1:2500 Engineering Blueprint (Full-Scale 3.0km vs Model 120cm)
 * - 6 Student Roles (Architecture, Energy, Food, Water, Civic, Health)
 * - Turnkey Bill of Quantities (BOQ) in Thai Baht (2,094,300,000 THB)
 * - Simulation Engine Integration (Digital Twin)
 * - Gamification Framework (Resilience Score, Citizen Happiness, Crisis Badges)
 */

import type { PblProgram } from './programData';

export interface HexCityRole {
  id: string;
  title: string;
  description: string;
  color: string;
  ledColor: string;
  focusSubsystem: string;
  benchLab: string;
  keyChallenge: string;
}

export interface CrisisScenario {
  id: string;
  title: string;
  severity: 'Medium' | 'Severe' | 'Critical';
  description: string;
  impactMetrics: {
    powerLossPct: number;
    waterRiskPct: number;
    hullDamagePct: number;
    populationStressPct: number;
  };
  manualOverrideRequired: string;
  successCondition: string;
  rewardBadge: string;
}

export const HEX_CITY_ROLES: HexCityRole[] = [
  {
    id: 'role-structures',
    title: 'Architecture & Structures',
    description: 'Hull layout, 200 mm foam cutting, deck planning, and 3D printed connector design.',
    color: 'emerald',
    ledColor: 'white',
    focusSubsystem: '200 mm Dense Foam Hull, Freeboard Stability, Mooring Catenary Cables',
    benchLab: 'Hot-wire foam shaping, scale freeboard buoyancy tank test, 3D bracket snap-fit',
    keyChallenge: 'Keep water tanks and battery banks centered low in hull to prevent catastrophic tipping.'
  },
  {
    id: 'role-energy',
    title: 'Energy & Grid',
    description: 'Solar deck layout, tidal power concepts, backup battery sizing, and model display circuits.',
    color: 'amber',
    ledColor: 'Yellow (Solar storage banks)',
    focusSubsystem: '150,000 Marine Monocrystalline Panels, 40 MWh LiFePO4 Containers',
    benchLab: 'Mini solar panel linked to an automatic switch that flips to battery power when covered',
    keyChallenge: 'Sustain essential life-support loads when a 7-day monsoon storm drops solar generation to zero.'
  },
  {
    id: 'role-food',
    title: 'Food & Agriculture',
    description: 'Vertical farming racks, spirulina algae tubes, and closed-loop nutrient flow.',
    color: 'green',
    ledColor: 'Green (Hydroponic grow decks)',
    focusSubsystem: '1,200 Multi-Tier Hydroponic Towers, Micro-Algae Photobioreactors',
    benchLab: 'Clear bubbling water tube growing spirulina algae under a small grow light',
    keyChallenge: 'Produce 1.8 kg food/citizen daily while isolating nutrient run-off from coastal waters.'
  },
  {
    id: 'role-water',
    title: 'Water & Waste Systems',
    description: 'Rain collection, greywater/blackwater bio-filters, and plastic recycling systems.',
    color: 'blue',
    ledColor: 'Blue (Water purification plant)',
    focusSubsystem: 'Rainwater Funnel Decks, Biogas Digesters, Closed-Loop Sand/Biochar Filtration',
    benchLab: 'Layered water filter using sand, fine gravel, activated carbon, and cotton cloth',
    keyChallenge: 'Recycle 92% of greywater without contaminating fresh drinking reservoirs.'
  },
  {
    id: 'role-civic',
    title: 'Civic & Wellbeing',
    description: 'Community living spaces, private quarters, fresh air circulation, and community rules.',
    color: 'purple',
    ledColor: 'Warm White (Community pods)',
    focusSubsystem: '500 Modular Living Pods, Acoustic Dampening, Shaded Civic Plazas',
    benchLab: 'Acoustic foam baffle test, natural ventilation wind tunnel, community constitution draft',
    keyChallenge: 'Isolate residential sleeping zones from 24/7 hum of water pumps and generators.'
  },
  {
    id: 'role-health',
    title: 'Health & Biosecurity',
    description: 'Clean water testing, quarantine zones, tropical disease defense, and medical triage.',
    color: 'red',
    ledColor: 'Red (Medical clinic & emergency sectors)',
    focusSubsystem: 'Negative-Pressure Airlocks, Rapid Triage Bay, Water Quality Spectrometry',
    benchLab: 'Microbial culturing petri test, airlock pressure differential manometer',
    keyChallenge: 'Quarantine waterborne and airborne pathogen outbreaks without shutting down food production.'
  }
];

export const CRISIS_SCENARIOS: CrisisScenario[] = [
  {
    id: 'scenario-barge',
    title: 'Scenario 1: Runaway Barge Hull Impact & Sector Flood',
    severity: 'Severe',
    description: 'A 4,000-ton unmoored river barge breaks loose during a category-3 storm surge and strikes the northeastern hull corner, puncturing an outer agricultural ballast bay.',
    impactMetrics: {
      powerLossPct: 15,
      waterRiskPct: 20,
      hullDamagePct: 40,
      populationStressPct: 35
    },
    manualOverrideRequired: 'Manually seal mechanical watertight bulkheads and flood opposing southern ballast chamber to level platform trim.',
    successCondition: 'Freeboard margin maintained > 25 cm, zero flooding into residential or battery sectors.',
    rewardBadge: '🛡️ Barge Impact Survivor'
  },
  {
    id: 'scenario-blackout',
    title: 'Scenario 2: 7-Day Monsoon Zero-Solar Blackout',
    severity: 'Critical',
    description: 'Continuous heavy cloud cover across the Gulf of Thailand reduces solar irradiance by 88% for seven consecutive days. Grid generation plummets.',
    impactMetrics: {
      powerLossPct: 80,
      waterRiskPct: 45,
      hullDamagePct: 0,
      populationStressPct: 50
    },
    manualOverrideRequired: 'Trigger manual emergency cutover switch; shut down vertical farm LED racks and non-essential pods; channel LiFePO4 batteries strictly to medical clinic and water pumps.',
    successCondition: 'Medical clinic and water purification maintained at 100% operation for 168 continuous hours.',
    rewardBadge: '⚡ Micro-Grid Commander'
  },
  {
    id: 'scenario-pathogen',
    title: 'Scenario 3: Waterborne Stomach Bug Contamination',
    severity: 'Medium',
    description: 'A localized bio-filter membrane tear introduces bacterial pathogens into the Zone B residential drinking loop. Multiple citizens report acute gastrointestinal illness.',
    impactMetrics: {
      powerLossPct: 0,
      waterRiskPct: 75,
      hullDamagePct: 0,
      populationStressPct: 65
    },
    manualOverrideRequired: 'Turn manual isolation ball valve on Zone B; route secondary reserve through UV/carbon polishing filter; activate clinic negative-pressure quarantine ward.',
    successCondition: 'Contamination contained within single sector; clean water restored to 100% within 4 hours.',
    rewardBadge: '💧 Bio-Shield Guardian'
  }
];

export const HEX_CITY_PROGRAM: PblProgram = {
  id: 'hex-city-thailand-2026',
  title: 'Hex-City Thailand: 12-Week Modular Resilient Floating City',
  subtitle: 'Engineering a modular, self-sustaining hexagonal ocean community in the Chao Phraya Delta and Gulf of Thailand that produces its own food, water, and energy while surviving tropical storms.',
  status: 'provisional_prototype',
  theme: 'Climate Adaptation & Marine Urbanism',
  drivingQuestion: 'How can we build an interconnected floating community that produces its own food, water, and energy while surviving tropical storms?',
  realProblem: {
    type: 'both',
    summary: 'Rising sea levels, land subsidence, and massive monsoon floods threaten to submerge coastal plains across the Chao Phraya River Delta and Bangkok. Millions of citizens face displacement, crop devastation, and drinking water salinization.',
    peopleImpact: 'Provides flood-proof modular shelter for 500+ households, dedicated negative-pressure medical triage, and resilient civic community spaces.',
    environmentalImpact: 'Zero-discharge closed-loop water treatment, circular recycling of marine plastics, 150,000 monocrystalline solar panels, and wave-attenuating floating breakwaters that regenerate coastal marine ecology.'
  },
  targetAgeRange: 'Ages 9–17 (Primary through Upper Secondary: 9–11, 12–14, 15–17)',
  durationWeeks: 12,
  totalSessions: 24,
  materialsAndKit: {
    microcontrollers: [
      'Scale Model 1:2500 Physical Workbench (120 cm Flat-to-Flat Hexagon)',
      'Digital Twin Simulation Engine (Browser-based physics & resource loop sandbox)',
      'Optional BBC micro:bit V2 / Arduino nano for automated bilge pump & LED power grid control'
    ],
    sensorsAndActuators: [
      '3V Coin cell batteries + micro toggle switches',
      'Color-coded micro LEDs: Green (Agri), Yellow (Energy), Blue (Water), Red (Medical), White (Living)',
      'Conductive copper foil tape for deck channel circuitry',
      '3D printed modular snap-hinge shear brackets (inter-platform connectors)',
      'Water turbidity sensor + float switches (for bench lab demos)'
    ],
    fabricationMaterials: [
      '200 mm (20 cm) dense light polystyrene/XPS foam slab (buoyancy hull base)',
      '2 mm black foam sheets (interior multi-level bulkheads, decks, partitions)',
      'Hot-wire foam cutter, straight edges, and self-healing cutting mats',
      'Catenary braided anchor lines and weighted seabed anchor sinkers',
      '140 cm x 140 cm display wooden baseboard'
    ],
    softwareAndTools: [
      'Tinkercad / Fusion 360 (CAD for 3D printed edge connectors)',
      'PBL Studio Hex-City Digital Twin Simulation Sandbox',
      'PBL Studio AI Co-Pilot (subsystem balancing & code co-pilot)',
      'Excel / Google Sheets for Bill of Quantities (BOQ) in Thai Baht'
    ]
  },
  teacherGuidance: {
    safetyProtocol: [
      'Hot-Wire Foam Cutting Safety: Hot-wire cutters operate at high thermal temperatures. Cutting must only be conducted in well-ventilated areas with eye protection and heat-resistant gloves.',
      'Low Voltage Wiring: All lighting circuits operate at 3V DC via coin cells or USB 5V. Mains voltage (220V) is prohibited on student models.',
      'Waterproof Bench Labs: Fluid experiments (water filter columns, bubbling algae tubes) must be placed in secondary catchment trays to protect electrical foam decks.'
    ],
    pedagogicalScaffolding: [
      'Scale Conversions (1:2500 Scale Rule): Ensure students convert full-scale meters to centimeters accurately (1,731.6m full side = 69.26cm model side; 3.0km width = 120cm model width).',
      'Inter-Team Collaboration: Each student team builds ONE complete hex platform. In Week 11, teams must physically snap their platforms together with 3D printed connectors to form a unified multi-hex cluster city.',
      'The 6 Specialist Roles: Assign each student a specific domain (Structures, Energy, Food, Water, Civic, Health) to enforce authentic interdependence.'
    ],
    aiEthicsRules: [
      'AI writes calculation templates and debugging code; learners defend physics in front of real judges.',
      'Record AI provenance in Master Operations Manual (Section 3 & 4).'
    ],
    differentiationNotes: [
      'Primary Track (Ages 9–11 / Grades 4–6): Modular foam hex tile assembly, simple 3V coin cell and copper tape LED circuits for living pods, tactile buoyancy water-displacement tub testing, and illustrated disaster survival guides.',
      'Junior Secondary Track (Ages 12–14 / Grades 7–9): Scale model 1:2500 hull fabrication, multi-layer biochar water filtration column tests, and digital twin simulation balancing food, energy, and water reserves across seasonal monsoon cycles.',
      'Upper Secondary Track (Ages 15–17 / Grades 10–12): Parametric 3D CAD flexible shear connectors, automated micro:bit/ESP32 bilge pump telemetry, hydrostatics calculation sheets, and an itemized 2.1B THB municipal capital expenditure & lifecycle depreciation model.'
    ]
  },
  measurableImpactCriteria: [
    {
      id: 'metric-buoyancy',
      metric: 'Buoyancy & Freeboard Stability',
      target: 'Positive freeboard margin ≥ 25 cm maintained under full upper-deck dead load and simulated wave action',
      verificationMethod: 'Empirical water tank displacement test and hydrostatic CAD calculation sheet'
    },
    {
      id: 'metric-energy-autonomy',
      metric: 'Micro-Grid Energy Resilience',
      target: '100% self-sufficient power with 40 MWh LiFePO4 battery reserve supporting 7 days of monsoon blackout',
      verificationMethod: '24-hour kilowatt-hour load flow matrix balancing solar generation against vertical farms and pumps'
    },
    {
      id: 'metric-circular-waste',
      metric: 'Closed-Loop Resource Recovery',
      target: '≥ 90% water recycling rate and 100% thermoplastic mechanical sorting into 3D filament',
      verificationMethod: 'Chemical mass balance flow audit in Master Operations Manual'
    },
    {
      id: 'metric-cost-integrity',
      metric: 'Turnkey Fiscal Viability (BOQ in THB)',
      target: 'Total investment capped at ≤ 2,094,300,000 THB including 7% Thai VAT and 15% emergency contingency',
      verificationMethod: 'Audited Bill of Quantities spreadsheet verified against local Thai construction rates'
    }
  ],
  assumptions: [
    {
      id: 'asmp-scale-materials',
      domain: 'Model Fabrication Materials',
      assumption: 'Classroom has access to 200 mm dense light foam slabs, hot-wire cutters, and 3D printers for modular connectors.',
      ownerVerificationNeeded: 'Verify availability of 200mm foam blocks or if lamination of 50mm foam sheets is required.',
      confirmation: {
        status: 'needs_owner_confirmation'
      }
    },
    {
      id: 'asmp-site-location',
      domain: 'Geographic Deployment',
      assumption: 'Simulated location is either Chao Phraya River Delta (shallow estuary) or Chonburi (offshore Gulf of Thailand).',
      ownerVerificationNeeded: 'Confirm if school wants teams to evaluate both sites or focus on one regional municipality.',
      confirmation: {
        status: 'needs_owner_confirmation'
      }
    }
  ],
  phases: [
    {
      id: 'explore',
      title: 'Explore',
      strap: 'Threat Assessment & Geometric Blueprint (Weeks 1–2)',
      weeks: [1, 2],
      goal: 'Investigate sea-level rise across the Chao Phraya Delta, calculate 1:2500 scale hexagon geometry, cut the 200 mm buoyant foam hull, and design 3D printed modular inter-hex connectors.',
      tasks: [
        'Study flood inundation maps of Bangkok, Chao Phraya Delta, and the Gulf of Thailand.',
        'Calculate 1:2500 scale geometric parameters (Side: 69.3 cm, Flat-to-flat: 120.0 cm, Diagonal: 138.5 cm).',
        'Cut out the hexagonal base platform from 200 mm dense light foam using hot-wire cutters.',
        'Calculate platform buoyancy and balance water tanks and battery banks low and centered.',
        'CAD and 3D print inter-locking modular snap/hinge connectors that link hex modules together.',
        'Select catenary anchor cable system and carve 6 corner anchor ports into foam hull.'
      ],
      evidence: [
        'Bangkok flood vulnerability map audit with identified geographic coordinates',
        'Calculated 1:2500 scale dimensional drawing with cut foam hull photos',
        'Buoyancy calculation sheet proving center of gravity below center of buoyancy',
        'Photos/CAD render of 3D printed flexible shear connector bracket'
      ],
      aiPromptStarters: [
        'Why do marine architects and honeybees choose hexagonal geometry over squares or circles for modular clustering?',
        'Calculate the buoyant displacement of a 200 mm foam hexagon with 69.3 cm sides floating in saltwater vs freshwater.',
        'What are the mechanical advantages of catenary anchor mooring curves compared to rigid seabed pilings during a typhoon?'
      ],
      competencies: ['ctps-01', 'ctps-02', 'ctps-05', 'ct-03', 'sdl-05'],
      stretchCompetencies: ['ct-11'],
      sessions: [
        {
          sessionNumber: 1,
          week: 1,
          title: 'Monsoons, Rising Waters, and the Hexagon Base',
          durationMin: 50,
          learningGoal: 'Quantify climate threat to Bangkok and calculate scale conversions for the 1:2500 hexagonal platform.',
          activities: [
            'Study historical flood maps of the Chao Phraya Delta and 2050 sea-level projections.',
            'Calculate space allocations needed for 500 households, hydroponic towers, and water filtration.',
            'Draw 1:2500 hexagon directly onto 200 mm foam slab (Flat-to-flat: 120.0 cm; Side: 69.3 cm).',
            'Cut base perimeter using hot-wire cutters and straight edges.'
          ],
          learnerChoices: {
            question: 'Which deployment environment will your team design for?',
            options: [
              { id: 'loc-estuary', label: 'Chao Phraya River Delta Estuary', description: 'Shallow brackish waters, heavy river silt, high current, sheltered from extreme ocean swell.' },
              { id: 'loc-chonburi', label: 'Offshore Gulf of Thailand (Chonburi)', description: 'Deep saltwater, 3-meter ocean storm surge, high solar and tidal energy potential.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Upload your 1:2500 geometric calculation sheet and photo of your cut 200 mm foam hexagon base.',
            targetCompetencies: ['ctps-05', 'ct-03']
          },
          reflectionPrompt: 'Why do honeybees and marine engineers use hexagons instead of squares or circles to link modular spaces?',
          teacherTips: 'Provide calibrated straightedges and ensure hot-wire cutters are kept at constant feed rate to avoid jagged foam edges.'
        },
        {
          sessionNumber: 2,
          week: 2,
          title: 'Buoyancy Physics & Center of Gravity Ballast',
          durationMin: 50,
          learningGoal: 'Compute total dead weight and balance heavy subsystems low in the hull to guarantee hydrostatic stability.',
          activities: [
            'Calculate total weight of foam, upper structures, 500 pods, water tanks, and battery containers.',
            'Carve low-profile ballast wells centered inside the 200 mm foam hull.',
            'Demonstrate positive freeboard in a water testing basin.'
          ],
          learnerChoices: {
            question: 'How will your team distribute critical heavy storage?',
            options: [
              { id: 'bal-core', label: 'Centralized Core Caisson', description: 'Concentrate battery and water storage in a deep central cylindrical core.' },
              { id: 'bal-radial', label: 'Radial Symmetrical Pods', description: 'Distribute storage into 6 balanced subterranean compartments along the hex axes.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Log your freeboard margin calculations and center of gravity balance diagram.',
            targetCompetencies: ['ctps-02', 'sdl-05']
          },
          reflectionPrompt: 'What happens to a floating platform if all the heavy water storage tanks are placed on one edge?',
          teacherTips: 'Use weights in a tub of water to dramatically illustrate metacenter height and capsize risk.'
        },
        {
          sessionNumber: 3,
          week: 2,
          title: '3D Printed Inter-Locking Modular Connectors',
          durationMin: 50,
          learningGoal: 'CAD model and 3D print flexible shear connectors that link hexagonal platforms without rigid failure.',
          activities: [
            'Explore marine joint mechanics: rigid bolts snap under wave shear; flexible hinge joints dissipate energy.',
            'Model a snap/hinge connector bracket in Tinkercad or Fusion 360.',
            'Export STL and 3D print the first connector test bracket.'
          ],
          learnerChoices: {
            question: 'What joint articulation design will your team print?',
            options: [
              { id: 'joint-hinge', label: 'Elastomer Hinge Bracket', description: 'Permits 5° of pitch and roll wave flex between adjacent platform decks.' },
              { id: 'joint-shear-pin', label: 'Sacrificial Shear Pin Lock', description: 'Locks platforms rigidly during calm seas but yields safely during extreme typhoon forces.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload CAD screenshot and photo of your 3D printed joint bracket mounted to the foam edge.',
            targetCompetencies: ['ct-03', 'ct-05']
          },
          reflectionPrompt: 'How does your 3D printed connector allow platforms to move slightly with ocean waves without snapping?',
          teacherTips: 'Test 3D print infill: use at least 40% gyroid infill for structural mechanical brackets.'
        },
        {
          sessionNumber: 4,
          week: 2,
          title: 'Ocean Mooring, Anchor Lines & Deck Zoning',
          durationMin: 50,
          learningGoal: 'Design catenary anchor cable ports and map deck zones using 2 mm black foam cutouts.',
          activities: [
            'Calculate anchor catenary holding power for muddy delta bottoms vs rocky coastal seabeds.',
            'Carve anchor line ports into the 6 outer corners of the 200 mm foam hull.',
            'Map out distinct zones using 2 mm black foam: Living, Energy, Farming, Water, and Medical.'
          ],
          learnerChoices: {
            question: 'How will you isolate residential sleeping spaces from noisy industrial machinery?',
            options: [
              { id: 'zone-buffer', label: 'Central Green Buffer Park', description: 'Place living pods in center surrounded by agricultural greenhouse noise buffers.' },
              { id: 'zone-leeward', label: 'Leeward Living Sector', description: 'Place residential quarters on the sheltered leeward side away from prevailing storm winds.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Submit deck master layout diagram showing the 6 functional zones and anchor cable angles.',
            targetCompetencies: ['ctps-01', 'ct-02']
          },
          reflectionPrompt: 'Why is it better to tether a floating city with flexible curved catenary lines rather than bolting it stiffly to the seabed?',
          teacherTips: 'Check that anchor lines enter hull at reinforced corners, not along mid-span foam edges.'
        }
      ]
    },
    {
      id: 'empathise',
      title: 'Empathise',
      strap: 'Civic Traditions & Community Resilience (Weeks 3–4)',
      weeks: [3, 4],
      goal: 'Understand the cultural, health, and psychological needs of Thai coastal and riverine families displaced by flooding.',
      tasks: [
        'Analyze traditional Thai amphibious architecture (stilt houses, canal floating markets).',
        'Conduct empathy interviews with residents who experienced historical Bangkok floods.',
        'Map out human wellbeing requirements: private sleeping quarters, fresh air, communal gathering, cultural temples.',
        'Design healthcare triage protocols and negative-pressure biosecurity isolation zones.'
      ],
      evidence: [
        'Thai amphibious architectural heritage study',
        'Citizen Persona Empathy Map (Says, Thinks, Does, Feels)',
        'Biosecurity & medical triage layout blueprint'
      ],
      aiPromptStarters: [
        'What lessons can modern marine engineers learn from traditional Thai stilt homes (Ruean Phae) along the Chao Phraya?',
        'How can a floating city design prevent claustrophobia and isolation among elderly citizens living on the open sea?',
        'What biosecurity precautions are needed to prevent dengue fever and waterborne cholera on a tropical floating platform?'
      ],
      competencies: ['ec-05', 'sea-01', 'ctps-01', 'lc-01'],
      stretchCompetencies: ['sea-03'],
      sessions: [
        {
          sessionNumber: 5,
          week: 3,
          title: 'Thai Amphibious Culture & Flood Living History',
          durationMin: 50,
          learningGoal: 'Integrate Thai water-based community heritage into modular urban floating architecture.',
          activities: [
            'Examine historical photographs of Bangkok as the "Venice of the East" and floating markets.',
            'Identify cultural social structures that foster mutual neighborhood aid during crisis.',
            'Draft empathy interview questions for families relocated due to coastal erosion in Samut Prakan.'
          ],
          learnerChoices: {
            question: 'Which community cultural feature will your team prioritize?',
            options: [
              { id: 'cult-wat', label: 'Communal Sala & Floating Spiritual Center', description: 'A shared open-air timber pavilion for community gatherings, meditation, and ceremonies.' },
              { id: 'cult-market', label: 'Modular Waterborne Market Canal', description: 'Central waterway allowing inter-hex boat trade and local economic exchange.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Log your team\'s cultural heritage integration notes and empathy interview takeaways.',
            targetCompetencies: ['sea-01', 'ec-05']
          },
          reflectionPrompt: 'How can a high-tech floating platform still feel like a warm, traditional Thai neighborhood?',
          teacherTips: 'Remind learners that engineering without human empathy creates cold, alienating megastructures.'
        },
        {
          sessionNumber: 6,
          week: 4,
          title: 'Biosecurity, Quarantine & Tropical Disease Defense',
          durationMin: 50,
          learningGoal: 'Design medical triage protocols and negative-pressure airlocks to protect against tropical outbreaks.',
          activities: [
            'Analyze tropical marine health risks: waterborne pathogens, vector-borne illnesses (mosquitoes), heat illness.',
            'Design a separate negative-pressure airlock entrance for the medical clinic sector.',
            'Map isolated medical waste incinerator channels away from main community airflow.'
          ],
          learnerChoices: {
            question: 'How will your team isolate medical clinic wastewater?',
            options: [
              { id: 'med-thermal', label: 'Dedicated Autoclave & Thermal Burn', description: 'Direct all medical wastewater to a separate autoclave before thermal combustion.' },
              { id: 'med-chemical', label: 'Triple Chemical Disinfection Holding Tank', description: 'Chlorine/ozone batch holding tank with certified pathogen-free release protocol.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Upload schematic showing medical clinic airlock, wastewater isolation, and triage pathways.',
            targetCompetencies: ['ctps-01', 'sea-01']
          },
          reflectionPrompt: 'Why must the medical clinic have a completely separate air and water path from the community dining hall?',
          teacherTips: 'Discuss hospital airflow dynamics: negative pressure prevents airborne virus spread into hallways.'
        }
      ]
    },
    {
      id: 'define',
      title: 'Define',
      strap: 'Subsystem Criteria & Budget Framing (Week 5)',
      weeks: [5, 5],
      goal: 'Synthesize subsystem requirements across the 6 roles and define strict engineering criteria, constraints, and cost limits in Thai Baht (THB).',
      tasks: [
        'Formulate the Master Driving Question and team role contracts.',
        'Define the energy budget: total solar generation vs hydroponic, pump, and living pod loads.',
        'Define the food and water balance: 1.8 kg food/citizen/day and 150 liters water/citizen/day.',
        'Establish initial Bill of Quantities (BOQ) budget targets in Thai Baht (THB).'
      ],
      evidence: [
        'Role Accountability Contract signed by all 6 student specialists',
        'Subsystem Mass & Energy Balance spreadsheet',
        'Preliminary BOQ Budget target sheet in Thai Baht'
      ],
      aiPromptStarters: [
        'Help us balance our power budget: 150,000 solar panels in Thai sunlight vs 1,200 vertical farming racks and water pumps.',
        'How many liters of drinking water does a community of 2,000 citizens need daily, and how much rain capture area is required?',
        'Review our BOQ cost assumptions in Thai Baht for marine pozzolanic concrete vs standard steel.'
      ],
      competencies: ['ctps-01', 'ctps-02', 'sdl-01', 'lc-01'],
      stretchCompetencies: ['ctps-07'],
      sessions: [
        {
          sessionNumber: 7,
          week: 5,
          title: 'The 6-Role Resource Balance Matrix',
          durationMin: 50,
          learningGoal: 'Balance daily megawatt-hours and kiloliters of water across all 6 specialized subsystems.',
          activities: [
            'Assemble the 6 specialists: Structures, Energy, Food, Water, Civic, Health.',
            'Compute daily energy generation (solar + tidal) vs consumption (pumps, lights, living pods).',
            'Establish 24-hour closed-loop mass and water flow balance.'
          ],
          learnerChoices: {
            question: 'What is your grid\'s backup priority hierarchy during cloudy days?',
            options: [
              { id: 'prio-life', label: 'Life-Support First', description: 'Tier 1: Medical Clinic & Drinking Water Pumps; Tier 2: Community Living; Tier 3: Farm Grow Lights.' },
              { id: 'prio-equal', label: 'Proportional Load Shedding', description: 'Reduce power by 50% across all sectors simultaneously to maintain partial operations.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Log your team\'s 24-Hour Resource Balance Matrix (Inputs vs Outputs in kWh and Liters).',
            targetCompetencies: ['ctps-02', 'lc-01']
          },
          reflectionPrompt: 'If three cloudy monsoon days cut your solar output by 70%, which systems do you shut down first?',
          teacherTips: 'Have students build a spreadsheet where changing one role\'s power request immediately shows if the battery bank drains!'
        },
        {
          sessionNumber: 8,
          week: 5,
          title: 'Engineering Constraints & Preliminary BOQ Framing',
          durationMin: 50,
          learningGoal: 'Frame financial boundaries in Thai Baht (THB) incorporating Thai VAT and contingency reserves.',
          activities: [
            'Review local Thai construction unit costs for marine concrete, solar panels, and battery storage.',
            'Establish the 7% Thai VAT and 15% emergency contingency buffer requirements.',
            'Define non-negotiable physical constraints (freeboard > 25cm, max budget 2.1B THB).'
          ],
          learnerChoices: {
            question: 'Where will your team look for the biggest structural cost reduction?',
            options: [
              { id: 'cost-hull', label: 'Pozzolanic Fly-Ash Concrete', description: 'Replace 30% of Portland cement with industrial fly-ash to lower hull costs and increase saltwater resistance.' },
              { id: 'cost-recycled', label: 'Upcycled Plastic Deck Core', description: 'Incorporate recycled ocean thermoplastics into deck plate cores to save 120M THB.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Log Criteria and Constraints Matrix with preliminary cost targets in THB.',
            targetCompetencies: ['ctps-01', 'sdl-01']
          },
          reflectionPrompt: 'Why is it risky to engineer a massive maritime project without a 15% financial buffer for unexpected storm damage?',
          teacherTips: 'Check that learners account for saltwater corrosion grade materials, not cheap land-based metals!'
        }
      ]
    },
    {
      id: 'ideate',
      title: 'Ideate and Plan',
      strap: 'Multi-Level Decks & Circuit Wiring (Week 6)',
      weeks: [6, 6],
      goal: 'Design multi-level deck blueprints and wire the 3V copper tape power distribution display circuit with color-coded LEDs.',
      tasks: [
        'Create master subsystem maps for power lines, fresh water pipes, wastewater returns, and walkways.',
        'Cut internal bulkheads and room dividers out of 2 mm black foam sheets.',
        'Route channels through the 2 mm foam deck for display lighting circuit wires.',
        'Assemble 3V display circuit with flat copper tape, coin cell, mini toggle switch, and 4 color-coded LEDs: Green (Agri), Yellow (Energy), Blue (Water), Red (Medical).'
      ],
      evidence: [
        'Multi-level deck subsystem blueprint drawings',
        'Routed 2 mm foam deck photos showing recessed wire channels',
        'Functional lit 3V copper tape circuit with all 4 color-coded LED sectors'
      ],
      aiPromptStarters: [
        'How do I calculate resistor values for green, yellow, blue, and red LEDs in a parallel 3V coin-cell circuit?',
        'Where could a leaking water pipe accidentally damage electrical wiring on my floating platform, and how can I isolate them?',
        'Suggest 3 ways to route walkways on a hex platform so heavy agricultural cargo carts do not disrupt residential quiet zones.'
      ],
      competencies: ['ct-02', 'ct-03', 'ctps-05', 'lc-04'],
      stretchCompetencies: ['ct-10'],
      sessions: [
        {
          sessionNumber: 9,
          week: 6,
          title: 'Subsystem Blueprinting & Deck Partitioning',
          durationMin: 50,
          learningGoal: 'Draft the multi-level deck blueprint and cut 2 mm black foam bulkheads and room dividers.',
          activities: [
            'Create master blueprint overlaying power conduits, water mains, and pedestrian pathways.',
            'Cut safety bulkheads and room partitions out of 2 mm black foam sheets.',
            'Test fit 3D printed edge connectors on the 200 mm foam hull.'
          ],
          learnerChoices: {
            question: 'How will your team isolate utility conduits from residential zones?',
            options: [
              { id: 'util-subdeck', label: 'Sub-Deck Utility Catwalk', description: 'House all pipes and high-voltage wires in a dedicated 50mm maintenance mezzanine below decks.' },
              { id: 'util-perimeter', label: 'Perimeter Service Trench', description: 'Route utilities in a waterproof covered channel around the outer rim of the hexagon.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload photos of your fitted 2 mm black foam deck and cut internal room dividers.',
            targetCompetencies: ['ct-03', 'ctps-05']
          },
          reflectionPrompt: 'Where could a leaking water pipe accidentally damage an electrical wire on your platform, and how can you isolate them?',
          teacherTips: 'Use self-healing cutting mats and fresh craft knife blades for clean 2 mm foam cuts.'
        },
        {
          sessionNumber: 10,
          week: 6,
          title: '3V Copper Circuit Assembly & Color-Coded LEDs',
          durationMin: 50,
          learningGoal: 'Assemble the multi-sector power distribution display circuit using copper foil tape and 4 LED channels.',
          activities: [
            'Lay conductive copper tape along recessed deck channels in parallel bus configuration.',
            'Solder or adhere color-coded LEDs: Green (Agri), Yellow (Energy), Blue (Water), Red (Medical).',
            'Connect circuit to 3V coin-cell battery holder and mini toggle switch.'
          ],
          learnerChoices: {
            question: 'What switching configuration will your display circuit use?',
            options: [
              { id: 'sw-master', label: 'Master Emergency Toggle', description: 'One master switch cuts all power, simulating a total grid blackout.' },
              { id: 'sw-sector', label: 'Independent Sector DIP Switches', description: 'Separate switches for Agri, Water, and Living to demonstrate selective load shedding.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload video or photos of your lit 3V deck circuit showing all 4 LED sectors glowing brightly.',
            targetCompetencies: ['ct-05', 'ctps-05']
          },
          reflectionPrompt: 'How does installing dedicated switches and separate circuit paths prevent one short circuit from blacking out the entire city?',
          teacherTips: 'Check polarities: long LED lead is positive (+); press copper tape joints firmly with a bone folder or pencil eraser.'
        }
      ]
    },
    {
      id: 'prototype',
      title: 'Prototype',
      strap: 'Bench Labs, Upper Decks & Itemized BOQ (Weeks 7–8)',
      weeks: [7, 8],
      goal: 'Fabricate 4 working role bench demonstration labs, construct upper-deck architecture, and build the turnkey Bill of Quantities (BOQ) in Thai Baht.',
      tasks: [
        'Energy Lead: Build a mini solar panel linked to an automatic switch that flips to battery power when covered.',
        'Water Lead: Build a layered water filter using sand, fine gravel, activated carbon, and cotton cloth.',
        'Food Lead: Build a clear bubbling water tube growing spirulina algae under a small grow light.',
        'Waste Lead: Build a sorting model showing how plastic is separated into mechanical shredding vs thermal recovery.',
        'Construct upper-deck architectural structures, storm canopies, and living pods using shaped 2 mm foam.',
        'Build complete Bill of Quantities (BOQ) in Thai Baht (THB) totaling 2,094,300,000 THB with 7% VAT & 15% contingency.'
      ],
      evidence: [
        'Photos/video of working bench demonstration labs (Solar switch, water filter, bubbling spirulina)',
        'Upper-deck architectural model mounted to 200 mm foam base',
        'Audited itemized Bill of Quantities (BOQ) spreadsheet in Thai Baht (THB)'
      ],
      aiPromptStarters: [
        'Help me calculate the flow rate through my sand and activated biochar water filter in mL/min.',
        'What spirulina culture nutrient recipe can be made using simple classroom ingredients?',
        'Review our BOQ line items for marine anchor chains in Thai Baht: is 4,500,000 THB per set realistic?'
      ],
      competencies: ['ct-03', 'ct-05', 'ctps-05', 'sdl-03', 'lc-04'],
      stretchCompetencies: ['ct-10'],
      sessions: [
        {
          sessionNumber: 11,
          week: 7,
          title: 'Hands-On Role Demonstration Bench Labs',
          durationMin: 50,
          learningGoal: 'Build and verify physical demonstration bench labs proving that subsystem technologies work in practice.',
          activities: [
            'Energy: Test mini solar cutover to battery when light is blocked.',
            'Water: Filter murky test water through sand/gravel/charcoal column and measure turbidity reduction.',
            'Food: Set up clear bubbling algae tube with aquarium air pump and mini grow LED.',
            'Waste: Demonstrate shredding of PET plastic bottle strips into simulated 3D printer pellets.'
          ],
          learnerChoices: {
            question: 'Which bench lab demonstration will be your team\'s centerpiece?',
            options: [
              { id: 'bench-water', label: 'Layered Sand & Biochar Filter Column', description: 'Visually shows dirty delta water clearing up into potable effluent.' },
              { id: 'bench-algae', label: 'Bubbling Spirulina Photobioreactor', description: 'Shows continuous oxygenation and living superfood protein culture.' },
              { id: 'bench-solar', label: 'Automatic Solar Cutover Relay', description: 'Instantly flips to backup power when a shadow falls on the panel.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload photos/video showing your working role bench lab operating and demonstrating its physical function.',
            targetCompetencies: ['ct-05', 'ctps-05']
          },
          reflectionPrompt: 'How does your bench lab prove to skeptical visitors that your city\'s technology is realistic and practical?',
          teacherTips: 'Provide water catchment bins and check that spirulina air tube connections are sealed with aquarium silicone.'
        },
        {
          sessionNumber: 12,
          week: 7,
          title: 'Upper-Deck Architecture & Storm Canopies',
          durationMin: 50,
          learningGoal: 'Construct aerodynamic upper-deck structures, modular living pods, and monsoon rain-collection canopies.',
          activities: [
            'Shape living pods from 2 mm black foam with curved roofs to reduce typhoon wind drag.',
            'Construct inverted umbrella canopies designed to funnel rainwater directly into deck drain filters.',
            'Mount completed architectural elements onto the 200 mm foam platform base.'
          ],
          learnerChoices: {
            question: 'What aerodynamic canopy profile will your team construct?',
            options: [
              { id: 'canopy-funnel', label: 'Inverted Hex Funnel Canopies', description: 'Captures 95% of rainfall while deflecting high wind shear away from living decks.' },
              { id: 'canopy-louver', label: 'Adjustable Aerofoil Louvers', description: 'Rotates to shade hot midday sun or feather flat during severe typhoon winds.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload photos of your completed upper-deck architecture showing living pods and storm canopies.',
            targetCompetencies: ['ct-03', 'ct-05']
          },
          reflectionPrompt: 'How does the shape of your roof prevent heavy typhoon winds from lifting the structures off the foam base?',
          teacherTips: 'Reinforce pod mounts with bamboo dowel pins sunk 30 mm into the dense foam hull.'
        },
        {
          sessionNumber: 13,
          week: 8,
          title: 'Bill of Quantities (BOQ) in Thai Baht (THB)',
          durationMin: 50,
          learningGoal: 'Convert physical engineering designs into a realistic 2,094,300,000 THB itemized cost sheet with VAT and contingency.',
          activities: [
            'Itemize quantities: 185,000 m³ pozzolanic concrete, 12 mooring line sets, 150,000 solar panels, 40 MWh batteries, 1,200 farm towers, 500 pods, clinic.',
            'Calculate subtotal, apply 7% Thai VAT and 15% emergency contingency buffer (22% overall = 377.3M THB).',
            'Verify grand total balances against the turnkey investment ceiling (2,094,300,000 THB).'
          ],
          learnerChoices: {
            question: 'What financial trade-off will your team make in the BOQ?',
            options: [
              { id: 'boq-tradeoff-solar', label: 'Higher Battery vs More Solar Panels', description: 'Spend more on LiFePO4 batteries (288M THB) for longer storm endurance, or add more panels for faster recharge.' },
              { id: 'boq-tradeoff-towers', label: 'Automated vs Manual Farm Towers', description: 'Invest in automated nutrient pumps (54M THB) vs labor-intensive community beds.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Upload your finalized Bill of Quantities (BOQ) spreadsheet in Thai Baht showing all 8 subsystems, VAT, and contingency.',
            targetCompetencies: ['ctps-02', 'sdl-02']
          },
          reflectionPrompt: 'Which single subsystem costs the most money, and what alternative design could bring that cost down?',
          teacherTips: 'Check that formulas in the spreadsheet calculate VAT and contingency dynamically, not hardcoded!'
        },
        {
          sessionNumber: 14,
          week: 8,
          title: 'Helipad Graphics, Safety Markings & Model Detailing',
          durationMin: 50,
          learningGoal: 'Apply maritime safety markers, color-coded sector lines, and helipad graphics to model deck surfaces.',
          activities: [
            'Paint high-visibility yellow and red emergency egress lines along main deck corridors.',
            'Draw international maritime helipad circle (H) on structural reinforced deck area.',
            'Label subsystems with clean, professional scale legends and module ID numbers.'
          ],
          learnerChoices: {
            question: 'Where will your emergency evacuation helipad be located?',
            options: [
              { id: 'heli-central', label: 'Central Core Deck', description: 'Most stable center of gravity location, protected from wave spray, accessible to all sectors.' },
              { id: 'heli-clinic', label: 'Direct Medical Clinic Roof', description: 'Direct airlift access for emergency patient triage and infectious quarantine transfer.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload close-up photos of your detailed deck finish, safety markings, and helipad graphics.',
            targetCompetencies: ['ct-05', 'ec-03']
          },
          reflectionPrompt: 'How do visual safety paint markers and clear signage save lives during a sudden night-time storm evacuation?',
          teacherTips: 'Provide fine-tip paint pens (white, yellow, red) for crisp scale detailing on black foam.'
        }
      ]
    },
    {
      id: 'test',
      title: 'Test and improve',
      strap: 'Disaster Stress-Testing & Crisis Overrides (Weeks 9–10)',
      weeks: [9, 10],
      goal: 'Stress test platform designs against 3 major crisis scenarios (barge collision, 7-day solar blackout, waterborne pathogen) and engineer manual overrides.',
      tasks: [
        'Test Scenario 1: A runaway barge collides with your hull and floods an outer agricultural zone.',
        'Test Scenario 2: A severe 7-day monsoon cloud cover drops solar power to zero.',
        'Test Scenario 3: A waterborne stomach bug spreads through the residential drinking water supply.',
        'Map out mechanical overrides for every digital system (hand-turned valves, manual airlocks, knife battery switches).',
        'Mount red indicator LEDs or highlight flags onto scale model to mark flood barriers and escape routes.',
        'Execute verification re-test and log improvements in Master Operations Manual.'
      ],
      evidence: [
        '3-Scenario Crisis Stress-Test results log and failure analysis',
        'Manual override matrix showing analog human controls for all critical systems',
        'Red indicator LED flood barrier / quarantine route documentation'
      ],
      aiPromptStarters: [
        'Act as a maritime disaster inspector and find 3 catastrophic failure points in our floating city design.',
        'If a runaway barge punctures one hull compartment, how do we counter-flood the opposite compartment to stop tipping?',
        'During a 7-day total blackout, which loads must be powered by our 40 MWh battery bank to keep 2,000 citizens alive?'
      ],
      competencies: ['ctps-03', 'ctps-02', 'ctps-12', 'ct-12', 'sea-04'],
      stretchCompetencies: ['ctps-07'],
      sessions: [
        {
          sessionNumber: 15,
          week: 9,
          title: 'Crisis Simulation: Barge Collision & Ballast Flood',
          durationMin: 50,
          learningGoal: 'Analyze hull impact damage and design counter-ballasting protocols to prevent capsize.',
          activities: [
            'Simulate dynamic impact of runaway 4,000-ton cargo barge on outer hex corner.',
            'Calculate flood water weight in damaged ballast compartment and resulting platform tilt angle.',
            'Engineer manual bulkhead isolation and counter-flooding valves to restore level trim.'
          ],
          learnerChoices: {
            question: 'What damage control mechanism will your team deploy?',
            options: [
              { id: 'dc-counter-ballast', label: 'Opposing Counter-Ballast Chamber', description: 'Automatically pump seawater into opposing corner to keep platform deck level within 3 degrees.' },
              { id: 'dc-sacrificial', label: 'Crumple Zone Breakwater Skirt', description: 'Sacrificial outer honeycomb foam bumper absorbs collision kinetic energy before hull breaches.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Log your damage control calculations showing post-collision platform trim angle and freeboard margin.',
            targetCompetencies: ['ctps-02', 'ct-12']
          },
          reflectionPrompt: 'If the main computer controller loses power during a collision, can a human engineer manually seal your critical water bulkheads?',
          teacherTips: 'Use a protractor on a tilted foam model in water to visually calculate heel angle!'
        },
        {
          sessionNumber: 16,
          week: 9,
          title: 'Crisis Simulation: 7-Day Monsoon Blackout & Power Shedding',
          durationMin: 50,
          learningGoal: 'Execute emergency electrical load shedding to keep life-support powered for 168 hours of zero solar input.',
          activities: [
            'Model battery drain: 40 MWh LiFePO4 battery capacity divided by essential vs non-essential wattage.',
            'Flip manual knife switch on 3V copper circuit to shut off green (agri) and yellow (storage) LEDs.',
            'Verify that red (medical) and blue (water) LEDs stay illuminated continuously.'
          ],
          learnerChoices: {
            question: 'How will you keep hydroponic vegetables alive during a 7-day lighting blackout?',
            options: [
              { id: 'agri-pulse', label: '10-Minute Pulsed Grow Lights', description: 'Flash LED grow lights for 10 minutes every 2 hours to sustain minimum chlorophyll synthesis.' },
              { id: 'agri-dormancy', label: 'Dark Dormancy Protocol', description: 'Cut all lighting to farm towers, relying entirely on stored spirulina paste and dried rations.' }
            ]
          },
          evidenceToCollect: {
            kind: 'data',
            prompt: 'Log your 168-Hour Battery Discharge Graph showing life-support runtime during total solar blackout.',
            targetCompetencies: ['ctps-03', 'ctps-12']
          },
          reflectionPrompt: 'During a week-long total blackout, which essential loads get battery power, and which are completely shut off?',
          teacherTips: 'Have students calculate watt-hours: 40 MWh = 40,000 kWh. If life-support draws 200 kW, runtime = 200 hours!'
        },
        {
          sessionNumber: 17,
          week: 10,
          title: 'Crisis Simulation: Waterborne Pathogen & Airlock Triage',
          durationMin: 50,
          learningGoal: 'Isolate municipal water contamination and activate clinic biosecurity quarantine procedures.',
          activities: [
            'Inject simulated contaminant into water filter bench lab and observe sensor detection.',
            'Turn mechanical manual three-way isolation valve to divert contaminated water to wastewater burn.',
            'Activate clinic negative-pressure airlock protocol and mark red quarantine perimeter on model.'
          ],
          learnerChoices: {
            question: 'What redundant purification step will you activate during contamination?',
            options: [
              { id: 'purify-uv', label: 'Emergency UV Sterilization Chamber', description: 'High-intensity ultraviolet C germicidal chamber kills 99.9% of bacteria instantly.' },
              { id: 'purify-thermal', label: 'Thermal Steam Distillation Loop', description: 'Use auxiliary biogas waste heat to boil and distill uncontaminated drinking water.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Document your team\'s 4-Step Water Contamination Containment Protocol with manual valve map.',
            targetCompetencies: ['ctps-02', 'sea-04']
          },
          reflectionPrompt: 'Why is having a mechanical hand-turned valve safer during an emergency than relying 100% on a motorized smart valve?',
          teacherTips: 'Highlight the engineering principle of "Graceful Degradation" — systems must fail safely without human catastrophe.'
        },
        {
          sessionNumber: 18,
          week: 10,
          title: 'The Master Operations Manual Compilation',
          durationMin: 50,
          learningGoal: 'Compile engineering calculations, blueprints, budgets, and disaster checklists into a 5-section master binder.',
          activities: [
            'Assemble Section 1: Location maps, climate risk summary, and buoyancy calculations.',
            'Assemble Section 2: Subsystem blueprints (power, water, food, waste, community, clinic).',
            'Assemble Section 3: Mass and energy flow diagrams (how inputs balance outputs).',
            'Assemble Section 4: Emergency response, disaster checklists, and manual overrides.',
            'Assemble Section 5: Itemized budget in Thai Baht (THB).'
          ],
          learnerChoices: {
            question: 'How will your team format the emergency response section?',
            options: [
              { id: 'fmt-checklist', label: 'Aviation-Style Quick Action Checklists (QAC)', description: 'Bold, numbered action steps color-coded by alert severity (Amber / Red).' },
              { id: 'fmt-flowchart', label: 'Decision Tree Flowcharts', description: 'Visual branching diagrams guiding technician decisions step-by-step.' }
            ]
          },
          evidenceToCollect: {
            kind: 'note',
            prompt: 'Submit complete table of contents and draft of Section 4 (Emergency Disaster Checklists) from your Master Operations Manual.',
            targetCompetencies: ['ec-03', 'sdl-04']
          },
          reflectionPrompt: 'If a new technician arrives on your platform tomorrow, can they safely operate the water purification system using only your manual?',
          teacherTips: 'Provide a binder or digital document template so all team members contribute their role sections seamlessly.'
        }
      ]
    },
    {
      id: 'share',
      title: 'Showcase or present',
      strap: 'Multi-Hex Integration & Public Inquest (Weeks 11–12)',
      weeks: [11, 12],
      goal: 'Connect modular hexagons with other teams to form an interconnected floating city cluster, rehearse the technical defense, and exhibit at the public inquest.',
      tasks: [
        'Bring completed hexagonal model together with models built by neighboring teams.',
        'Connect platforms using 3D printed snap/hinge joints to prove multi-hex modular scaling.',
        'Run a 30-minute timed dress rehearsal covering all 6 specialist roles.',
        'Set up team booth: 1:2500 model on 200 mm foam base with illuminated circuits, bench lab demos, and Master Manual.',
        'Deliver 20-minute technical defense and cross-examination to visiting engineers, architects, and peers.',
        'Complete final team reflection and portfolio audit against WeLearn Future Skills.'
      ],
      evidence: [
        'Photos/video of interconnected multi-hex city cluster with neighboring teams',
        '30-minute timed rehearsal critique notes and adjustments made',
        'Public Exhibition presentation photos and guest evaluation scores',
        'Final comprehensive Future Skills growth reflection'
      ],
      aiPromptStarters: [
        'Act as a skeptical civil engineering judge and ask us 5 tough cross-examination questions about our hex city in Thailand.',
        'How do we structure our 20-minute team defense so all 6 roles speak equally without running out of time?',
        'Give feedback on our booth demonstration layout: model, illuminated circuits, working bench labs, and operations binder.'
      ],
      competencies: ['ec-11', 'ec-02', 'ec-03', 'ec-12', 'lc-02', 'sdl-04'],
      stretchCompetencies: ['ec-07', 'ec-09', 'ent-07'],
      sessions: [
        {
          sessionNumber: 19,
          week: 11,
          title: 'Display Baseboard Assembly & Scale Mounting',
          durationMin: 50,
          learningGoal: 'Mount the 1:2500 scale hex platform onto a stable 140 cm x 140 cm display baseboard with scale legends.',
          activities: [
            'Construct sturdy 140 cm x 140 cm wooden display baseboard.',
            'Secure 200 mm foam hull base and anchor line tethers.',
            'Mount professional scale markers (1:2500, 1 cm = 25 m), subsystem legend, and bilingual Thai/English labels.'
          ],
          learnerChoices: {
            question: 'How will you display the seabed anchor moorings on the baseboard?',
            options: [
              { id: 'disp-acrylic', label: 'Clear Blue Acrylic Riser', description: 'Platform floats 15cm above baseboard on acrylic pegs, showing catenary cables dipping down to sea floor.' },
              { id: 'disp-bathymetry', label: 'Topographic Delta Sea Floor Diorama', description: 'Baseboard painted with bathymetric depth contours showing silt layers and deadweight anchors.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload photos of your hex platform securely mounted to the 140 cm display baseboard with scale legends.',
            targetCompetencies: ['ec-03', 'ct-05']
          },
          reflectionPrompt: 'How does a professional scale display baseboard elevate your project from a classroom craft to an engineering design model?',
          teacherTips: 'Provide wood glue and corner brackets for the 140 cm baseboard frame.'
        },
        {
          sessionNumber: 20,
          week: 11,
          title: 'Multi-Hexagon Integration Cluster Test',
          durationMin: 50,
          learningGoal: 'Physically connect multiple student hex platforms using 3D printed joints to prove scalable modular city planning.',
          activities: [
            'Bring your team\'s hex module together with 2 to 5 neighboring student team modules.',
            'Snap modules together using 3D printed shear connectors.',
            'Verify pedestrian walkway alignment, inter-hex power conduit jumpers, and collective wave articulation.'
          ],
          learnerChoices: {
            question: 'What cluster geometry did your combined cohort build?',
            options: [
              { id: 'geom-ring', label: 'Ring Atoll with Protected Inner Lagoon', description: 'Hexagons form a protected circular ring with calm interior boat harbour.' },
              { id: 'geom-linear', label: 'Linear Barrier Spine', description: 'Hexagons form a long wave-breaking reef shielding coastal mangroves behind it.' },
              { id: 'geom-cluster', label: 'High-Density 7-Hex Flower Cluster', description: 'One central civic hub surrounded by 6 specialized residential and farm modules.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload video and wide-angle photos of the multi-hexagon integrated city cluster with adjacent teams.',
            targetCompetencies: ['lc-04', 'ec-12']
          },
          reflectionPrompt: 'When multiple platforms connect together, does wave action pull on the 3D printed joints in unexpected ways?',
          teacherTips: 'Clear a large open floor space for the multi-hex cluster assembly—seeing the full city come together is a watershed moment!'
        },
        {
          sessionNumber: 21,
          week: 11,
          title: 'Timed Dress Rehearsal & Defense Strategy',
          durationMin: 50,
          learningGoal: 'Conduct a timed 20-minute technical presentation dry run with role handoffs and peer critique.',
          activities: [
            'Rehearse role pacing: Min 0-5 (Problem & Hull), Min 5-12 (Closed Loops), Min 12-16 (Civic & Health), Min 16-20 (Q&A).',
            'Practice live bench demos: flip power switch, demonstrate filtered water effluent, pass sample 3D joint brackets.',
            'Receive tough cross-examination critique from coach and peers.'
          ],
          learnerChoices: {
            question: 'What live demonstration will anchor your presentation opening hook?',
            options: [
              { id: 'hook-blackout', label: 'The Sudden Blackout Cutover', description: 'Start presentation in darkness; flip 3V circuit switch to show how essential clinic LEDs stay lit.' },
              { id: 'hook-water', label: 'The Murky Delta Water Filter', description: 'Pour muddy Chao Phraya river water into bench filter and collect clear drinkable water in real-time.' }
            ]
          },
          evidenceToCollect: {
            kind: 'feedback',
            prompt: 'Log rehearsal timing breakdown and written feedback received from peer reviewers.',
            targetCompetencies: ['ec-02', 'sdl-04']
          },
          reflectionPrompt: 'Which part of your presentation felt too technical or hard to follow for an outside listener, and how did you simplify it?',
          teacherTips: 'Use a digital countdown timer visible to speakers to build time management discipline.'
        },
        {
          sessionNumber: 22,
          week: 12,
          title: 'Booth Setup & Live Technical Demonstrations',
          durationMin: 50,
          learningGoal: 'Set up exhibition stand with working 1:2500 scale model, illuminated circuits, bench labs, and operations manual.',
          activities: [
            'Position 140 cm baseboard, test 3V LED display circuits, and calibrate bench lab apparatus.',
            'Display Master Operations Manual in presentation binder with table of contents tabs.',
            'Prepare sample 3D printed shear brackets for judges to touch and inspect.'
          ],
          learnerChoices: {
            question: 'How will your team engage visitors who approach your stand?',
            options: [
              { id: 'stand-hands-on', label: 'Interactive Joint Flex Station', description: 'Guests physically bend 3D printed joint to feel how wave shear is dissipated.' },
              { id: 'stand-digital', label: 'Live Digital Twin Simulation Tablet', description: 'Visitors run crisis scenarios on a screen next to the physical scale model.' }
            ]
          },
          evidenceToCollect: {
            kind: 'media',
            prompt: 'Upload wide-angle photos of your finalized exhibition booth ready for the public inquest.',
            targetCompetencies: ['ec-03', 'ec-12']
          },
          reflectionPrompt: 'How well did your physical scale model and working bench demos prove that your design is realistic and buildable?',
          teacherTips: 'Ensure batteries in all models and bench labs have fresh backups on standby.'
        },
        {
          sessionNumber: 23,
          week: 12,
          title: 'The Public Defense Exhibition & Inquest',
          durationMin: 50,
          learningGoal: 'Deliver formal technical defense to visiting engineers, architects, educators, and community guests.',
          activities: [
            'Deliver formal 20-minute defense to visiting panel of professional judges and peers.',
            'Demonstrate closed-loop resource balance, 2.1B THB BOQ feasibility, and disaster manual overrides.',
            'Answer probing cross-examination questions using data from calculations and operations manual.'
          ],
          learnerChoices: {
            question: 'Which judge challenge question did your team defend most effectively?',
            options: [
              { id: 'def-typhoon', label: 'Extreme Category-5 Typhoon Survivability', description: 'Defended catenary mooring line holding power and counter-ballast stability.' },
              { id: 'def-boq', label: 'Fiscal Budget Realism in Thai Baht', description: 'Defended 7% VAT, 15% contingency, and local pozzolanic concrete supply chains.' },
              { id: 'def-biosecurity', label: 'Airlock Quarantine Integrity', description: 'Defended negative-pressure isolation dynamics and separate waste incineration.' }
            ]
          },
          evidenceToCollect: {
            kind: 'feedback',
            prompt: 'Upload written judge evaluation rubrics, scores, and official commendations received during defense.',
            targetCompetencies: ['ec-11', 'ec-02', 'ctps-04']
          },
          reflectionPrompt: 'What was the toughest question the review panel asked about your city\'s structural survival, and how did your team answer?',
          teacherTips: 'Invite actual Thai coastal engineers, architects, or university faculty as guest panel judges.'
        },
        {
          sessionNumber: 24,
          week: 12,
          title: 'Future Skills Mastery Reflection & Legacy',
          durationMin: 50,
          learningGoal: 'Reflect deeply on personal growth across the WeLearn 7 Future Skills and synthesize 12-week takeaways.',
          activities: [
            'Audit individual evidence portfolio against the WeLearn Future Skills Assessment Matrix.',
            'Reflect on growth: Developing -> Competent -> Advanced in Critical Thinking, Collaboration, and Contextual Awareness.',
            'Synthesize team lessons: how engineering, human empathy, and climate resilience merge.'
          ],
          learnerChoices: {
            question: 'Which WeLearn Future Skill did you personally develop the most in this term?',
            options: [
              { id: 'skill-ctps', label: 'Critical Thinking & Problem Solving', description: 'Balancing complex interdependent resource loops and predicting compounding failures.' },
              { id: 'skill-collab', label: 'Collaboration & Teamwork', description: 'Coordinating across 6 specialized roles to ensure whole-platform stability.' },
              { id: 'skill-context', label: 'Contextual Awareness', description: 'Tailoring engineering choices to Thai monsoons, cultural traditions, and local pricing in THB.' }
            ]
          },
          evidenceToCollect: {
            kind: 'reflection',
            prompt: 'Submit your comprehensive Final Term Reflection citing at least 3 portfolio artifacts from the 12-week journey.',
            targetCompetencies: ['sdl-04', 'ctps-04', 'sea-04']
          },
          reflectionPrompt: 'How has your understanding of climate resilience in Thailand shifted from Week 1 to Week 12? What does it truly mean to design for a submerged future?',
          teacherTips: 'Celebrate the collective achievement of building an interconnected floating city from scratch!'
        }
      ]
    }
  ]
};
