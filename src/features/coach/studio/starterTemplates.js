/**
 * SPARK Coach Studio Starter Templates
 * Pre-fills the brief, cohort, pitch level, competencies, and grounding sources
 * so coaches can start from a curated baseline and adjust.
 */

export const STARTER_TEMPLATES = [
  {
    id: 'tpl-biomimicry',
    title: 'Biomimicry Design Challenge',
    icon: 'Leaf',
    badge: 'Popular • STEM',
    cohort: 'WLS',
    duration: '8 stages',
    language: 'en-GB',
    pitchLevel: 'core',
    brief: {
      realProblem: 'Urban heat islands and severe water runoff in expanding cities.',
      drivingQuestion: 'How can nature-inspired architectural forms and desert organism adaptations cool our school campus and capture rainwater passively?',
      finalProduct: 'A 1:10 scaled physical prototype with sensor-tested passive cooling chambers, presented to the campus sustainability committee.'
    },
    competencies: [
      { framework: 'welearn', id: 'ctps-01' }, // Critical Thinking
      { framework: 'welearn', id: 'ctps-02' }, // Problem Solving
      { framework: 'welearn', id: 'ct-01' },   // Creative Thinking
      { framework: 'welearn', id: 'sdl-01' },  // Goal Setting
      { framework: 'welearn', id: 'lc-01' },   // Collaboration
      { framework: 'ngs', id: 'MS-ETS1-1' }    // Engineering Design Criteria
    ],
    source: {
      id: 'src-biomimicry-org',
      title: 'Biomimicry Institute: Nature-Inspired Design Strategies',
      category: 'Biological Strategy',
      icon: 'Leaf',
      tokenCount: 480,
      active: true,
      summary: 'Foundational framework on how biological organisms (Namib beetle, termite mounds, lotus leaf) regulate temperature and harvest hydration without external electrical power.',
      excerpt: 'Biomimicry is the practice of looking to nature for battle-tested engineering solutions. In urban environments, passive airflow channels modeled on macrotermes termite mounds can drop interior temperatures by 5-8 degrees Celsius without mechanical HVAC units.'
    }
  },
  {
    id: 'tpl-passion',
    title: 'Passion Project Launchpad',
    icon: 'Sparkles',
    badge: 'Self-Directed',
    cohort: 'WHS',
    duration: '8 stages',
    language: 'en-GB',
    pitchLevel: 'stretch',
    brief: {
      realProblem: 'Translating deep individual curiosities and personal obsessions into tangible community impact and open-source artifacts.',
      drivingQuestion: 'How can I engineer an open-source technical or artistic solution that addresses a genuine community need rooted in my personal passion?',
      finalProduct: 'A deployed functional prototype, public GitHub repository, and an interactive exhibition booth at the WeLearn showcase.'
    },
    competencies: [
      { framework: 'welearn', id: 'sdl-01' }, // Goal Setting
      { framework: 'welearn', id: 'sdl-02' }, // Planning & Organization
      { framework: 'welearn', id: 'ec-01' },  // Effective Communication
      { framework: 'welearn', id: 'ent-01' }, // Entrepreneurial Initiative
      { framework: 'welearn', id: 'ct-02' },  // Innovation
      { framework: 'ngs', id: 'HS-ETS1-2' }   // Complex Engineering Solutions
    ],
    source: {
      id: 'src-passion-framework',
      title: 'Self-Directed Maker Inquiry & Public Showcase Guide',
      category: 'Inquiry Framework',
      icon: 'BookOpen',
      tokenCount: 420,
      active: true,
      summary: 'Protocols for framing open-ended self-directed inquiry into verifiable engineering and artistic milestones with peer review gates.',
      excerpt: 'Passion projects thrive when personal autonomy is matched with public accountability. Each learner establishes a verifiable design constraint, logs weekly sprint retrospectives, and produces tangible evidence rather than theoretical essays.'
    }
  },
  {
    id: 'tpl-solar-car',
    title: 'Solar Car Sprint Challenge',
    icon: 'Sun',
    badge: 'MakerSpace',
    cohort: 'WLS',
    duration: '8 stages',
    language: 'en-GB',
    pitchLevel: 'foundational',
    brief: {
      realProblem: 'Heavy reliance on carbon fuels in micro-mobility and transport.',
      drivingQuestion: 'How can we design, wire, and gear a high-efficiency miniature solar vehicle to achieve maximum torque and endurance under real sunlight conditions?',
      finalProduct: 'A functioning photovoltaic vehicle with custom CAD/laser-cut chassis, telemetry trial log, and participation in the solar endurance trial.'
    },
    competencies: [
      { framework: 'welearn', id: 'ctps-01' },
      { framework: 'welearn', id: 'ctps-02' },
      { framework: 'welearn', id: 'lc-01' },
      { framework: 'welearn', id: 'sdl-01' },
      { framework: 'ngs', id: 'MS-PS3-3' },   // Energy transfer and thermal/photovoltaic
      { framework: 'ngs', id: 'MS-ETS1-2' }   // Evaluating competing design solutions
    ],
    source: {
      id: 'src-solar-lab-manual',
      title: 'Fab Lab Solar Vehicle Manual: Gearboxes & Photovoltaics',
      category: 'MakerSpace Spec',
      icon: 'Wrench',
      tokenCount: 460,
      active: true,
      summary: 'Wiring schematics, solar cell angle optimization, gear ratio torque calculations, and Fab Lab 3D printer slicing specifications.',
      excerpt: 'Maximizing solar car velocity requires tuning the gear ratio to the motor torque curve under 6V/200mA photovoltaic cell output. Students use lightweight 3mm acrylic or PLA chassis with low-friction ball bearings.'
    }
  }
];
