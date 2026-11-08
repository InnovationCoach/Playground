/**
 * Rich mock learner dataset for local development and preview mode.
 * Contains complete PBL project records with milestones, problems, criteria,
 * evidence entries, and STEAM activity telemetry (Solar Car runs, Plant Lab drawings, SO2 metrics).
 */
export const FALLBACK_LEARNERS = [
  {
    uid: 'learner-mia',
    displayName: 'Mia Chen',
    email: 'mia@school.edu',
    classIds: ['class_yr9_climate', 'class-wpr-11a'],
    groupName: 'Lower Secondary A',
    status: 'active',
    records: {
      'pbl-term-2026-t3': {
        version: 1,
        termId: 'term-2026-t3',
        title: 'Sustainable Futures: Urban Microgrid & Passive Cooling',
        updatedAt: Date.now() - 3600000 * 4,
        currentPhase: 'prototype',
        impact: 'both',
        codeLanguage: 'micropython',
        finalFormat: 'showcase',
        problem: {
          hmw: 'How might we reduce thermal heat island effects in dense secondary classrooms using passive shading and bio-reflective surfaces?',
          who: 'Lower secondary learners in un-airconditioned wing B classrooms',
          why: 'Afternoon classroom temperatures exceed 34°C, impairing concentration and wellbeing',
          criteria: 'Reduce indoor radiant temperature by at least 2.5°C using locally sourced bamboo lattices',
          constraints: 'Zero active electrical consumption, materials under $45 per window bay',
          impactMeasure: 'Measured reduction in indoor globe thermometer temperature over 10 consecutive school days'
        },
        tasksDone: {
          explore: [0, 1, 2],
          empathise: [0, 1, 2],
          define: [0, 1, 2, 3],
          ideate: [0, 1, 2],
          prototype: [0, 1]
        },
        evidence: [
          {
            id: 'ev-mia-1',
            title: 'Campus Infrared Thermal Audit Log',
            phase: 'explore',
            kind: 'data',
            body: 'Mapped 14 campus zones at 14:00. Concrete courtyard exceeded 41.2°C surface temperature while tree-shaded area remained at 29.8°C.',
            link: 'https://biomimicry.org',
            competencies: ['ctps-01', 'ctps-03'],
            createdAt: Date.now() - 86400000 * 6
          },
          {
            id: 'ev-mia-2',
            title: 'Classroom Occupant Heat Survey',
            phase: 'empathise',
            kind: 'feedback',
            body: 'Interviewed 18 students and 2 staff members in West wing classrooms. 89% reported sluggishness between 13:00 and 15:30.',
            link: '',
            competencies: ['ec-05', 'sea-10'],
            createdAt: Date.now() - 86400000 * 5
          },
          {
            id: 'ev-mia-3',
            title: 'Albedo & Material Selection AI Exploration',
            phase: 'define',
            kind: 'ai',
            body: 'Queried AI assistant for low-cost natural materials with high solar reflectance index.',
            competencies: ['sdl-01', 'ctps-09'],
            ai: {
              asked: 'How to compare albedo of painted wood vs bamboo weave?',
              gave: 'Suggested measuring surface reflectance and thermal retention curves over a 30-minute interval.',
              kept: 'Adopted the 30-minute logging cadence with dual IR thermometers.'
            },
            createdAt: Date.now() - 86400000 * 3
          },
          {
            id: 'ev-mia-4',
            title: 'Passive Louver CAD Design Draft',
            phase: 'ideate',
            kind: 'design',
            body: 'Constructed an angled louver model at 42° tilt to maximize winter sun blocking while allowing cross-ventilation breezes.',
            link: 'https://canva.com/design/test',
            competencies: ['ct-02', 'ctps-11'],
            createdAt: Date.now() - 86400000 * 2
          },
          {
            id: 'ev-mia-5',
            title: 'Micro:bit Temperature Sensor Logger',
            phase: 'prototype',
            kind: 'code',
            body: 'from microbit import *\nimport uart\nuart.init(baudrate=115200)\nwhile True:\n    t = temperature()\n    uart.write(str(t) + "\\n")\n    sleep(5000)',
            link: '',
            competencies: ['ctps-05'],
            createdAt: Date.now() - 86400000 * 1
          },
          {
            id: 'ev-mia-6',
            title: 'Mid-term Engineering Reflection',
            phase: 'explore',
            kind: 'reflection',
            body: 'Iterating through passive cooling techniques proved that material geometry matters just as much as surface coating reflectance.',
            link: '',
            competencies: ['sdl-05'],
            createdAt: Date.now() - 43200000
          }
        ]
      },
      'solar-car': {
        teamName: 'Helios Falcon',
        completed: true,
        updatedAt: Date.now() - 86400000 * 3,
        runs: [{ id: 'r1', seconds: 4.12 }, { id: 'r2', seconds: 3.78 }],
        parts: [{ id: 'p1', name: 'Ultra-light Chassis', grams: 210 }, { id: 'p2', name: 'Monocrystalline Solar Panel 30W', grams: 145 }],
        reflection: 'Replacing the brass bushing with ceramic bearings dropped rolling resistance by 18%, cutting our sprint time by 0.34s.'
      },
      'plant-lab': {
        completed: true,
        updatedAt: Date.now() - 86400000 * 4,
        records: [
          {
            id: 'lab-1',
            title: 'Stomata Density under 6500K LED',
            stage: 'Microscope Cell Analysis (400x)',
            hypothesis: { choice: 'High blue-spectrum light stimulates stomatal opening' },
            outcome: { words: 'Counted average of 34 open stomata per field under high PAR versus 14 in control group.' },
            notes: 'Clear epidermal peel stained with methylene blue. High guard cell turgidity visible.'
          }
        ]
      },
      'so2-sulfate': {
        completed: true,
        cooling: -1.7,
        cost: 3800,
        resilience: 89,
        hazard: 'Low (Controlled aerosol dispersion)',
        notes: 'Balanced global dimming benefits against acid precipitation risks in ocean baseline simulation.'
      }
    }
  },
  {
    uid: 'learner-leo',
    displayName: 'Leo Martins',
    email: 'leo@school.edu',
    classIds: ['class_yr9_climate', 'class-wpr-11a'],
    groupName: 'Lower Secondary A',
    status: 'active',
    records: {
      'pbl-term-2026-t3': {
        version: 1,
        termId: 'term-2026-t3',
        title: 'Sustainable Futures: Rainwater Micro-Harvesting',
        updatedAt: Date.now() - 3600000 * 8,
        currentPhase: 'define',
        impact: 'environment',
        codeLanguage: 'arduino',
        finalFormat: 'showcase',
        problem: {
          hmw: 'How might we capture and filter rooftop runoff for campus hydroponic towers during dry spells?',
          who: 'Campus gardening club and biology research labs',
          why: 'Municipal water rationing limits weekend irrigation during drought cycles',
          criteria: 'Gravity-fed filtration reaching under 5 NTU turbidity',
          constraints: 'Under 100 litre storage footprint, non-toxic biochar filter media',
          impactMeasure: 'Gallons of clean non-potable water recovered per rain event'
        },
        tasksDone: {
          explore: [0, 1],
          empathise: [0, 1],
          define: [0, 1]
        },
        evidence: [
          {
            id: 'ev-leo-1',
            title: 'Roof Runoff Flow Calculation Sheet',
            phase: 'explore',
            kind: 'data',
            body: 'Calculated 120 square meter roof area yields approx 4,800 litres per month during monsoon peak.',
            competencies: ['ctps-01', 'ctps-03'],
            createdAt: Date.now() - 86400000 * 6
          },
          {
            id: 'ev-leo-2',
            title: 'Groundskeeper Maintenance Interview',
            phase: 'empathise',
            kind: 'feedback',
            body: 'Interviewed grounds supervisor Pak Somchai regarding existing downspout blockages and overflow risks.',
            competencies: ['ec-05'],
            createdAt: Date.now() - 86400000 * 4
          },
          {
            id: 'ev-leo-3',
            title: 'Filter Media Selection AI Consultation',
            phase: 'define',
            kind: 'ai',
            body: 'Compared sand, coconut coir, and activated biochar for suspended particle trapping efficiency.',
            competencies: ['sdl-01'],
            ai: {
              asked: 'What is the optimal layer thickness for biochar in gravity filtration?',
              gave: 'Advised 150mm biochar sandwiched between fine quartz sand and gravel beds.',
              kept: 'Configured triple-layer column prototype based on flow rate calculations.'
            },
            createdAt: Date.now() - 86400000 * 2
          }
        ]
      },
      'solar-car': {
        teamName: 'Volt Strider',
        completed: true,
        updatedAt: Date.now() - 86400000 * 5,
        runs: [{ id: 'r1', seconds: 4.85 }, { id: 'r2', seconds: 4.30 }],
        parts: [{ id: 'p1', name: 'Laser-cut Balsa Chassis', grams: 260 }],
        reflection: 'Tensioned drive belt to eliminate slipping on the motor pinion.'
      },
      'plant-lab': {
        completed: true,
        updatedAt: Date.now() - 86400000 * 6,
        records: [
          {
            id: 'lab-leo-1',
            title: 'Root Osmosis in High Nutrient Salinity',
            stage: 'Plant Physiology',
            hypothesis: { choice: 'High EC nutrient solution slows water uptake' },
            outcome: { words: 'Observed turgor loss when EC exceeded 2.8 mS/cm.' }
          }
        ]
      }
    }
  },
  {
    uid: 'learner-noor',
    displayName: 'Noor Haddad',
    email: 'noor@school.edu',
    classIds: ['class_yr9_climate', 'class-wpr-11a'],
    groupName: 'Lower Secondary A',
    status: 'active',
    records: {
      'pbl-term-2026-t3': {
        version: 1,
        termId: 'term-2026-t3',
        title: 'Sustainable Futures: Biodegradable Food Packaging',
        updatedAt: Date.now() - 3600000 * 2,
        currentPhase: 'test',
        impact: 'environment',
        codeLanguage: 'python',
        finalFormat: 'presentation',
        problem: {
          hmw: 'How can we replace single-use plastic canteen trays with agricultural waste composites?',
          who: 'Campus cafeteria staff and student body (450 meals daily)',
          why: 'Over 2,200 non-recyclable polystyrene trays discarded each week',
          criteria: 'Water-resistant for 4 hours, fully compostable within 45 days',
          constraints: 'Locally available cassava starch binder, cost under 0.15 USD per tray',
          impactMeasure: 'Weight of school plastic waste diverted to composting bins'
        },
        tasksDone: {
          explore: [0, 1, 2],
          empathise: [0, 1, 2],
          define: [0, 1, 2, 3],
          ideate: [0, 1, 2],
          prototype: [0, 1, 2],
          test: [0, 1]
        },
        evidence: [
          {
            id: 'ev-noor-1',
            title: 'Rice Husk & Tapioca Compression Sample #3',
            phase: 'prototype',
            kind: 'data',
            body: 'Pressed at 160°C for 8 minutes. Sample withstood 100°C soup without structural deformation for 3.5 hours.',
            competencies: ['ctps-03'],
            createdAt: Date.now() - 86400000 * 3
          },
          {
            id: 'ev-noor-2',
            title: 'Canteen Manager Feedback on Tray Stacking',
            phase: 'test',
            kind: 'feedback',
            body: 'Cafeteria manager praised rigidity; suggested slightly rounded lip for easier industrial dish rack stacking.',
            competencies: ['lc-02'],
            createdAt: Date.now() - 86400000 * 2
          },
          {
            id: 'ev-noor-3',
            title: 'Compost Degradation Soil Trial AI Model',
            phase: 'define',
            kind: 'ai',
            body: 'Consulted AI co-pilot on microbial decomposition accelerators for cellulose binders.',
            competencies: ['sdl-01'],
            ai: {
              asked: 'What soil moisture and temperature accelerate cassava composite decomposition?',
              gave: 'Advised 55% moisture content with active thermophilic composting (>50°C).',
              kept: 'Configured monitoring sensors in pilot campus compost tumblers.'
            },
            createdAt: Date.now() - 86400000 * 5
          },
          {
            id: 'ev-noor-4',
            title: 'Waste Stream Audit & Tray Usage Tally',
            phase: 'explore',
            kind: 'data',
            body: 'Logged 3 days of lunchtime tray waste. Measured 42.6 kg of non-biodegradable waste generated daily.',
            competencies: ['ctps-01'],
            createdAt: Date.now() - 86400000 * 7
          },
          {
            id: 'ev-noor-5',
            title: 'Compost Aeration Monitoring Script',
            phase: 'prototype',
            kind: 'code',
            body: '# Compost temperature & moisture monitor\nimport time\ndef check_compost(temp, moisture):\n    return temp >= 50.0 and 50.0 <= moisture <= 65.0',
            competencies: ['ctps-05'],
            createdAt: Date.now() - 86400000 * 1
          }
        ]
      },
      'plant-lab': {
        completed: true,
        updatedAt: Date.now() - 86400000 * 2,
        records: [
          {
            id: 'lab-n1',
            title: 'Mycelium Hyphae Growth Rates',
            stage: 'Fungal Colonization',
            outcome: { words: 'Oyster mushroom mycelium colonized substrate in 11 days.' },
            notes: 'Autoclaved grain spawn maintained at 24°C in dark incubation cabinet.'
          }
        ]
      },
      'solar-car': {
        teamName: 'Terra Nova',
        completed: true,
        updatedAt: Date.now() - 86400000 * 2,
        runs: [{ id: 'r1', seconds: 4.22 }],
        parts: [{ id: 'p1', name: 'Cellulose Composite Frame', grams: 230 }],
        reflection: 'Tested durability under thermal stress; no warpage observed.'
      }
    }
  },
  {
    uid: 'learner-tom',
    displayName: 'Tom Becker',
    email: 'tom@school.edu',
    classIds: ['class_yr12_eng', 'class-wpr-12a'],
    groupName: 'Higher Secondary A',
    status: 'active',
    records: {
      'pbl-term-2026-t3': {
        version: 1,
        termId: 'term-2026-t3',
        title: 'Project Arachne: Sesame Quadruped Walking Linkages',
        updatedAt: Date.now() - 3600000 * 12,
        currentPhase: 'share',
        impact: 'both',
        codeLanguage: 'arduino',
        finalFormat: 'presentation',
        problem: {
          hmw: 'How can we design a biomimetic quadruped mechanism that navigates rough agricultural terracing autonomously?',
          who: 'Smallholder hillside farmers monitoring soil moisture',
          why: 'Wheeled rovers tip on 20° slope terracing, while drones suffer high battery drain in high wind',
          criteria: 'Payload capacity 1.5kg, power consumption under 35W, stable traverse on 20° slope',
          constraints: 'CNC-cut aluminum linkages, open-source ROS-compatible controller',
          impactMeasure: 'Autonomous traverse distance across rough terrace without rollover or stall'
        },
        tasksDone: {
          explore: [0, 1, 2],
          empathise: [0, 1, 2],
          define: [0, 1, 2, 3],
          ideate: [0, 1, 2],
          prototype: [0, 1, 2],
          test: [0, 1, 2],
          share: [0, 1]
        },
        evidence: [
          {
            id: 'ev-tom-1',
            title: 'Trot Gait Kinematics & Current Draw on 15° Incline',
            phase: 'test',
            kind: 'data',
            body: 'Average current draw 2.3A at 12V with 1.2kg dummy payload. Trot frequency tuned to 1.8 Hz.',
            competencies: ['ctps-02', 'ctps-03'],
            createdAt: Date.now() - 86400000 * 1
          },
          {
            id: 'ev-tom-2',
            title: 'Inverse Kinematics Gait Controller Code',
            phase: 'prototype',
            kind: 'code',
            body: '// 12-DOF Quadruped gait engine\nvoid updateLegIK(float x, float y, float z) {\n  float l1 = 65.0, l2 = 120.0, l3 = 135.0;\n  // Closed-form geometric inverse kinematics\n}',
            competencies: ['ctps-05'],
            createdAt: Date.now() - 86400000 * 3
          },
          {
            id: 'ev-tom-3',
            title: 'Terrace Farmer Field Interview',
            phase: 'empathise',
            kind: 'feedback',
            body: 'Demonstrated initial leg geometry to fruit orchardist. Key feedback: foot pads must not compact damp clay topsoil.',
            competencies: ['ec-05'],
            createdAt: Date.now() - 86400000 * 8
          },
          {
            id: 'ev-tom-4',
            title: 'Linkage Topology AI Optimization Log',
            phase: 'ideate',
            kind: 'ai',
            body: 'Used generative algorithms to reduce linkage weight while preserving factor of safety 2.5 under impact.',
            competencies: ['sdl-01', 'ctps-11'],
            ai: {
              asked: 'Optimize 4-bar linkage curve for ground clearance on uneven soil.',
              gave: 'Provided revised Klann mechanism dimensions with higher foot lift trajectory.',
              kept: 'Manufactured revised titanium pivot rods for testing.'
            },
            createdAt: Date.now() - 86400000 * 5
          },
          {
            id: 'ev-tom-5',
            title: 'Final Defense Presentation Slides',
            phase: 'share',
            kind: 'design',
            body: 'Completed 12-slide presentation detailing problem genesis, linkage math, field trials, and cost breakdown.',
            link: 'https://canva.com/design/test-quadruped',
            competencies: ['ec-02', 'ec-03', 'ec-11'],
            createdAt: Date.now() - 86400000 * 1
          },
          {
            id: 'ev-tom-6',
            title: 'Engineering Process Reflection',
            phase: 'share',
            kind: 'reflection',
            body: 'Balancing mechanical stiffness against battery autonomy taught me that system integration is the core skill of robotics.',
            competencies: ['sdl-04'],
            createdAt: Date.now() - 3600000 * 10
          }
        ]
      },
      'solar-car': {
        teamName: 'Titan Apex',
        completed: true,
        updatedAt: Date.now() - 86400000 * 1,
        runs: [{ id: 'r1', seconds: 3.42 }, { id: 'r2', seconds: 3.25 }],
        parts: [{ id: 'p1', name: 'Carbon Fiber Monocoque', grams: 180 }, { id: 'p2', name: 'High-Efficiency MPPT Controller', grams: 65 }],
        reflection: 'Tuned PID steering control to prevent oscillation at high speed.'
      }
    }
  },
  {
    uid: 'learner-alex',
    displayName: 'Alex Chen',
    email: 'alex.test@school.edu',
    classIds: ['class_yr9_climate', 'class-wpr-11a'],
    groupName: 'Lower Secondary A',
    status: 'active',
    records: {
      'pbl-term-2026-t3': {
        version: 1,
        termId: 'term-2026-t3',
        title: 'District Net-Zero Resilient Microgrid',
        updatedAt: Date.now() - 3600000 * 6,
        currentPhase: 'ideate',
        impact: 'both',
        codeLanguage: 'python',
        finalFormat: 'showcase',
        problem: {
          hmw: 'How can a solar-plus-storage microgrid keep school refrigeration online during severe storm grid outages?',
          who: 'School medical dispensary and community emergency food storage',
          why: 'Severe weather storms caused three 18+ hour outages last semester, spoiling vaccines and perishable stock',
          criteria: 'Provide 24h backup power for medical and cafeteria chillers',
          constraints: 'Must integrate existing 5kW rooftop PV array, budget under $2,200',
          impactMeasure: 'Uninterrupted runtime hours under simulated 2.5 kW continuous critical refrigeration load'
        },
        tasksDone: {
          explore: [0, 1, 2],
          empathise: [0, 1],
          define: [0, 1, 2],
          ideate: [0, 1]
        },
        evidence: [
          {
            id: 'ev-alex-1',
            title: 'Critical Load Profile during 72-Hour Blackout Simulation',
            phase: 'define',
            kind: 'data',
            body: 'Calculated 14.2 kWh daily critical consumption. Sized 20 kWh LiFePO4 pack with 4.5 kW solar canopy.',
            competencies: ['ctps-01', 'ctps-03'],
            createdAt: Date.now() - 86400000 * 4
          },
          {
            id: 'ev-alex-2',
            title: 'School Nurse Interview on Temperature-Sensitive Medicine',
            phase: 'empathise',
            kind: 'feedback',
            body: 'Logged exact temperature thresholds for insulin (+2°C to +8°C). Confirmed power failure alert requirements.',
            competencies: ['ec-05'],
            createdAt: Date.now() - 86400000 * 5
          },
          {
            id: 'ev-alex-3',
            title: 'Battery Chemistries AI Trade-Off Analysis',
            phase: 'ideate',
            kind: 'ai',
            body: 'Evaluated LiFePO4 vs Lead-Acid for indoor safety and cycle life in tropical climate.',
            competencies: ['sdl-01'],
            ai: {
              asked: 'Compare thermal runaway risk between NMC and LFP cells at 38°C ambient.',
              gave: 'Explained LFP cathode stability and higher decomposition temperature (>270°C).',
              kept: 'Selected prismatic LFP chemistry for school basement installation.'
            },
            createdAt: Date.now() - 86400000 * 2
          },
          {
            id: 'ev-alex-4',
            title: 'Microgrid Automatic Transfer Switch Logic',
            phase: 'ideate',
            kind: 'code',
            body: '# Automatic Transfer Switch (ATS) state machine\ndef monitor_grid(voltage, freq):\n    if voltage < 190.0 or freq < 48.5:\n        return "ENGAGE_BATTERY_INVERTER"\n    return "GRID_ONLINE"',
            competencies: ['ctps-05'],
            createdAt: Date.now() - 86400000 * 1
          }
        ]
      },
      'solar-car': {
        teamName: 'Solar Flare',
        completed: true,
        updatedAt: Date.now() - 86400000 * 3,
        runs: [{ id: 'r1', seconds: 4.40 }, { id: 'r2', seconds: 4.10 }],
        parts: [{ id: 'p1', name: 'Aerodynamic Wheel Fairings', grams: 45 }],
        reflection: 'Fairings reduced drag coefficient from 0.045 to 0.038 in wind tunnel test.'
      }
    }
  }
];
