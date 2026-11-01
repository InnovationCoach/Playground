/**
 * Coach Evaluation Desk Store
 * Manages student multi-modal submissions (Video demos, GitHub repos, MakerSpace prototypes, Reflections)
 * and coach formative evaluations, XP awards, and feedback loops.
 */

const STORAGE_KEY = 'hearisland.coach_evaluations.v1';

const INITIAL_EVALUATIONS = [
  {
    id: 'eval-liam-rover-s4',
    studentId: 'student-liam-chen',
    studentName: 'Liam Chen',
    avatar: '🤖',
    grade: 'Grade 8',
    traits: 'Gifted + ADHD',
    projectTitle: 'Bio-Robotic Environmental Rover',
    programId: 'custom-pbl-student-liam-chen',
    sessionNumber: 4,
    milestoneStage: 'Prototype',
    milestoneTitle: 'CAD Chassis & Motor Telemetry Bench Test',
    submittedAt: Date.now() - 3600000 * 2, // 2 hours ago
    status: 'pending', // 'pending' | 'approved' | 'revision_requested'
    competencies: ['stem-04: Iterative Prototyping', 'sdl-01: Self-Direction', 'maker-02: Rapid Fabrication'],
    submissions: {
      video: {
        title: '60s Bench Test: Obstacle Avoidance & Ultrasonic Sensor Feedback',
        url: 'https://www.youtube.com/watch?v=mock-liam-rover-test',
        duration: '1:08'
      },
      github: {
        repo: 'liam-chen/bio-rover-firmware',
        url: 'https://github.com/liam-chen/bio-rover-firmware',
        branch: 'main',
        commit: '8f3b1a2: fix: add PID throttle dampening for ultrasonic sensor readings'
      },
      prototype: {
        station: 'MakerSpace Bench #04',
        assetTag: 'MS-PRUSA-04',
        spec: 'Bambu Lab PETG Chassis + micro:bit V2 + L298N Motor Driver',
        verifiedSafety: true
      },
      reflection: 'The ultrasonic sensor kept glitching when the DC motors drew peak current from the battery pack. Coach Donovan reminded me to add a 100uF smoothing capacitor across the 5V power rail, which completely resolved the microcontroller brownout!'
    },
    coachCue: 'Praise the hardware debugging breakthrough! Notice how Liam solved the brownout independently after the micro-hint. Check if motor gear ratios need lubrication.',
    coachFeedback: '',
    xpAwarded: 0
  },
  {
    id: 'eval-maya-grip-s3',
    studentId: 'student-maya-patel',
    studentName: 'Maya Patel',
    avatar: '🎨',
    grade: 'Grade 7',
    traits: 'Gifted + Dyslexia',
    projectTitle: 'Biomimetic 3D Assistive Grip',
    programId: 'custom-pbl-student-maya-patel',
    sessionNumber: 3,
    milestoneStage: 'Ideation',
    milestoneTitle: 'Parametric CAD Lofting & Organic Curvature',
    submittedAt: Date.now() - 3600000 * 5, // 5 hours ago
    status: 'pending',
    competencies: ['cre-02: Biomimetic Design', 'stem-02: Spatial Modeling', 'maker-01: SLA 3D Printing'],
    submissions: {
      video: {
        title: '3D Blender & Fusion 360 Walkthrough: Nautilus Shell Ergonomics',
        url: 'https://www.youtube.com/watch?v=mock-maya-cad-demo',
        duration: '2:14'
      },
      github: {
        repo: 'maya-patel/biomimetic-grip-assets',
        url: 'https://github.com/maya-patel/biomimetic-grip-assets',
        branch: 'v1.2-lofting',
        commit: 'c42d991: feat: loft curved palm rest using scanned anthropometric hand contours'
      },
      prototype: {
        station: 'MakerSpace SLA Lab Station #02',
        assetTag: 'MS-RESIN-22',
        spec: 'Formlabs SLA Tough 2000 Resin test coupon (50 micron layer height)',
        verifiedSafety: true
      },
      reflection: 'Designing this directly in CAD with organic loft curves was so much easier than writing an essay. Test-fitting the 3D printed resin coupon proved that the thumb rest was 2.5mm too high for a standard grip, so I adjusted the parametric sketch offset.'
    },
    coachCue: 'Celebrate Maya’s top 0.1% spatial reasoning! Highlight how she self-identified the 2.5mm offset without needing coach correction.',
    coachFeedback: '',
    xpAwarded: 0
  },
  {
    id: 'eval-sam-hydro-s5',
    studentId: 'student-sam-wongsakul',
    studentName: 'Sam Wongsakul',
    avatar: '🌱',
    grade: 'Grade 9',
    traits: 'Autism / Sensory Sensitive',
    projectTitle: 'IoT Automated Hydroponic Node',
    programId: 'custom-pbl-student-sam-wongsakul',
    sessionNumber: 5,
    milestoneStage: 'Testing',
    milestoneTitle: 'pH/EC Telemetry & MQTT Telemetry Stream',
    submittedAt: Date.now() - 3600000 * 24, // 1 day ago
    status: 'approved',
    competencies: ['stem-05: Sensor Integration', 'data-01: Real-time Telemetry', 'sdl-02: Rigorous Documentation'],
    submissions: {
      github: {
        repo: 'sam-w/hydroponic-iot-node',
        url: 'https://github.com/sam-w/hydroponic-iot-node',
        branch: 'telemetry-mqtt',
        commit: '7e1104a: feat: stream calibrated pH and EC buffer readings every 60s via MQTT to InfluxDB'
      },
      prototype: {
        station: 'MakerSpace Wet Lab #07',
        assetTag: 'MS-HYDRO-07',
        spec: 'Waterproof probe harness + ESP32 NodeMCU + BME280 environment shield',
        verifiedSafety: true
      },
      reflection: 'Calibrating the analog pH probe required 3 buffer solutions (pH 4.01, 6.86, 9.18). I wrote a piecewise linear interpolation function in C++ to remove sensor nonlinearity.'
    },
    coachCue: 'Praise Sam’s algorithmic rigor. Acknowledge his quiet workspace preference was well-utilized.',
    coachFeedback: 'Outstanding mathematical calibration, Sam! The piecewise interpolation handles sensor drift beautifully. Verified safe deployment in Wet Lab #07.',
    xpAwarded: 100
  }
];

function getStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  } catch {
    // Ignore
  }
  return null;
}

export function getEvaluations() {
  try {
    const s = getStorage();
    if (!s) return INITIAL_EVALUATIONS;
    const raw = s.getItem(STORAGE_KEY);
    if (!raw) {
      s.setItem(STORAGE_KEY, JSON.stringify(INITIAL_EVALUATIONS));
      return INITIAL_EVALUATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_EVALUATIONS;
  }
}

export function saveEvaluations(evals) {
  try {
    const s = getStorage();
    if (s) s.setItem(STORAGE_KEY, JSON.stringify(evals));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hearisland-evaluations-updated', { detail: { evals } }));
    }
  } catch (err) {
    console.error('[EvaluationsStore] Failed saving:', err);
  }
}

export function approveSubmission(evalId, { feedback = '', xp = 100, coachName = 'Coach' } = {}) {
  const list = getEvaluations();
  const next = list.map((item) => {
    if (item.id === evalId) {
      return {
        ...item,
        status: 'approved',
        coachFeedback: feedback || item.coachFeedback || 'Milestone verified and approved! Excellent craftsmanship and technical evidence.',
        xpAwarded: xp,
        evaluatedBy: coachName,
        evaluatedAt: Date.now()
      };
    }
    return item;
  });
  saveEvaluations(next);
  return next.find((i) => i.id === evalId);
}

export function requestRevisionSubmission(evalId, { guidance = '' } = {}) {
  const list = getEvaluations();
  const next = list.map((item) => {
    if (item.id === evalId) {
      return {
        ...item,
        status: 'revision_requested',
        coachFeedback: guidance || 'Please provide updated telemetry data or clarify your design documentation before milestone approval.',
        evaluatedAt: Date.now()
      };
    }
    return item;
  });
  saveEvaluations(next);
  return next.find((i) => i.id === evalId);
}
