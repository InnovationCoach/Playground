/**
 * Single source of truth for the WeLearn Design Thinking Framework
 * and the 6 official PBL Library programs.
 * Conforms strictly to docs/data-contract.md.
 */

export const WELEARN_DT_FRAMEWORK = {
  version: 1,
  phases: [
    { id: 'explore',   label: 'Explore',              weeks: [1, 3] },
    { id: 'empathise', label: 'Empathise',            weeks: [3, 4] },
    { id: 'define',    label: 'Define',               weeks: [4, 5] },
    { id: 'ideate',    label: 'Ideate and plan',      weeks: [5, 6] },
    { id: 'prototype', label: 'Prototype',            weeks: [6, 9] },
    { id: 'test',      label: 'Test and improve',     weeks: [9, 11] },
    { id: 'showcase',  label: 'Showcase or present',  weeks: [11, 12] },
    { id: 'reflect',   label: 'Reflect and iterate',  weeks: [12, 12] }
  ]
};

export function generateSearchTokens(title, theme, tags = [], drivingQuestion = '') {
  const text = `${title} ${theme} ${tags.join(' ')} ${drivingQuestion}`.toLowerCase();
  const rawWords = text.replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/);
  const tokens = new Set();
  for (const word of rawWords) {
    const clean = word.trim();
    if (clean.length >= 2) {
      tokens.add(clean);
      if (clean.includes('-')) {
        clean.split('-').forEach((part) => {
          if (part.length >= 2) tokens.add(part);
        });
      }
    }
  }
  return Array.from(tokens);
}

export const LIBRARY_PROGRAMS = [
  {
    id: 'ecocool-smart-garden-2026',
    slug: 'ecocool-smart-garden-2026',
    title: 'EcoCool: Smart Urban Heat & Community Garden Monitor',
    drivingQuestion: 'How might we use smart IoT microclimate sensors and regenerative shading to combat urban heat islands and sustain community garden crops during extreme summer heatwaves?',
    theme: 'Climate & Urban Resilience',
    impact: {
      people: 'Empowers urban gardeners, elders, and school communities to protect food yield and cultivate cooling public microclimates.',
      environment: 'Lowers localized urban surface heat by 2–4°C and cuts irrigation water waste through targeted soil moisture telemetry.'
    },
    frameworkId: 'welearn-dt',
    frameworkVersion: 1,
    ageBand: '11-13',
    durationWeeks: 12,
    authorId: 'system-library',
    source: 'library',
    status: 'published',
    visibility: 'centre',
    tags: ['heat', 'urban-heat', 'garden', 'climate', 'iot', 'sensors', 'resilience', 'sustainability'],
    phases: [
      {
        phaseId: 'explore',
        title: 'Explore: Microclimates & Soil Physics',
        learningGoal: 'Investigate urban heat islands, soil thermal inertia, and capacitive dielectric permittivity through experimental test beds.',
        sessions: [
          {
            title: 'Urban Heat Island Investigation & Heat Mapping',
            minutes: 90,
            activities: [
              'Deploy IR temperature sensors across dark asphalt, concrete, and shaded garden soil test trays.',
              'Calculate thermal decay curves and surface heating deltas under simulation lamps.',
              'Analyze historical heat index charts for Bangkok urban districts.'
            ]
          },
          {
            title: 'Soil Moisture Capacitive Calibration',
            minutes: 90,
            activities: [
              'Benchmark analog moisture readings across dry sand, damp potting mix, and saturated loam.',
              'Identify sensor threshold triggers to prevent root rot and plant stress.',
              'Test corrosion resistance of capacitive vs resistive probes.'
            ]
          }
        ],
        tools: ['Thermal Imaging Camera', 'Capacitive Moisture Sensors', 'Micro:bit v2', 'Multimeter'],
        deliverables: ['Thermal heating delta spreadsheet', 'Calibrated sensor threshold log'],
        coachCue: 'Encourage learners to notice how radiative heat behaves differently on porous vs non-porous surfaces.'
      },
      {
        phaseId: 'empathise',
        title: 'Empathise: Community Garden Needs',
        learningGoal: 'Interview local urban gardeners and market sellers to understand harvest losses caused by heat stress.',
        sessions: [
          {
            title: 'Community Stakeholder Interviews',
            minutes: 90,
            activities: [
              'Conduct structured user interviews with community allotment volunteers.',
              'Synthesize gardener pain points regarding midday watering and scorched leaf tips.',
              'Map garden routines against daily peak UV and heat hours.'
            ]
          }
        ],
        tools: ['Audio Recorder', 'Empathy Map Canvas'],
        deliverables: ['Gardener empathy map', 'User journey storyboard of daily watering routines'],
        coachCue: 'Prompt learners to listen for physical fatigue and water access constraints.'
      },
      {
        phaseId: 'define',
        title: 'Define: Automated Garden Spec',
        learningGoal: 'Synthesize sensor data and user needs into precise technical requirements for an automated watering and shading station.',
        sessions: [
          {
            title: 'Problem Framing & Sensor Specification',
            minutes: 90,
            activities: [
              'Formulate point-of-view statements: "How might we automate moisture monitoring without wasting tap water?"',
              'Draft technical boundary constraints (battery runtime, water tank volume, outdoor weatherproofing).',
              'Select microcontrollers and pump actuation components.'
            ]
          }
        ],
        tools: ['Design Matrix', 'Requirement Traceability Sheet'],
        deliverables: ['Technical specification sheet', 'Component schematic diagram'],
        coachCue: 'Ensure learners do not jump to full code before defining boundary constraints.'
      },
      {
        phaseId: 'ideate',
        title: 'Ideate: Architecture & Shading Mechanics',
        learningGoal: 'Brainstorm creative motorized canopy deployment and low-power telemetry sleep cycles.',
        sessions: [
          {
            title: 'Canopy Geometry & Irrigation Flow Routing',
            minutes: 90,
            activities: [
              'Sketch origami folding canopies, bamboo lattices, and retractable solar shades.',
              'Develop state machine logic for pump relay triggers based on combined moisture and ambient heat.',
              'Perform peer critique on mechanical simplicity.'
            ]
          }
        ],
        tools: ['Rapid Prototyping Cardboard', 'State Transition Diagram'],
        deliverables: ['System block diagram', 'Paper concept sketches'],
        coachCue: 'Challenge learners to consider power consumption: passive shading beats constant active pumping.'
      },
      {
        phaseId: 'prototype',
        title: 'Prototype: Physical Station Assembly',
        learningGoal: 'Fabricate weather-resistant housings, solder sensor wire looms, and program the automated irrigation controller.',
        sessions: [
          {
            title: 'Electronics Wiring & Relay Control',
            minutes: 90,
            activities: [
              'Wire submersible 5V mini-pumps through MOSFET switching circuits.',
              'Write MicroPython hysteresis control loops: water only when moisture < 35% AND time is past 17:00.',
              '3D print outdoor enclosure with IP54 water sealing lip.'
            ]
          },
          {
            title: 'Physical Rig Assembly & Tubing',
            minutes: 90,
            activities: [
              'Mount drip irrigation manifold and check valve.',
              'Calibrate servo motors for deployable shade cloth canopy.',
              'Test gravity-fed reservoir line pressure.'
            ]
          }
        ],
        tools: ['Bambu 3D Printer', 'Soldering Iron', 'MicroPython Web Editor', 'Silicone Sealant'],
        deliverables: ['Functional physical prototype', 'Documented MicroPython firmware repository'],
        coachCue: 'Supervise soldering safety and verify flyback diode placement on inductive pump motors.'
      },
      {
        phaseId: 'test',
        title: 'Test & Improve: Real-World Garden Benchmarking',
        learningGoal: 'Deploy prototype station in an active raised garden bed for 72 continuous hours and evaluate sensor stability.',
        sessions: [
          {
            title: '72-Hour Soak Test & Telemetry Logging',
            minutes: 90,
            activities: [
              'Install prototype into raised bed and log hourly soil hydration and canopy operations.',
              'Audit telemetry for sensor drift or battery depletion under direct sunlight.',
              'Iterate firmware smoothing algorithms to filter out spurious analog noise.'
            ]
          }
        ],
        tools: ['Data Logger', 'Solar Power Bank', 'Moisture Verification Meter'],
        deliverables: ['72-hour telemetry data graph', 'Engineering failure mode analysis & patch log'],
        coachCue: 'Encourage learners to celebrate failures discovered in testing rather than viewing them as flaws.'
      },
      {
        phaseId: 'showcase',
        title: 'Showcase: Community Impact Expo',
        learningGoal: 'Present working prototype and operational data to community gardeners, demonstrating measurable water savings and temperature reduction.',
        sessions: [
          {
            title: 'Demonstration & Community Handoff',
            minutes: 90,
            activities: [
              'Deliver interactive live demonstration showcasing automated watering triggers.',
              'Produce a 90-second video walkthrough explaining sensor calibration and mechanical construction.',
              'Hand off illustrated garden maintenance guide to community members.'
            ]
          }
        ],
        tools: ['Canva Poster', 'Video Editor', 'Demonstration Planter Box'],
        deliverables: ['Public showcase presentation', '60–90 second pitch video', 'Operator manual'],
        coachCue: 'Guide learners to lead with the human and ecological problem before demonstrating tech specs.'
      }
    ],
    searchTokens: [],
    createdAt: 1729000000000,
    updatedAt: 1729000000000,
    publishedAt: 1729000000000
  },
  {
    id: 'entrepreneurship-product-creation-2026',
    slug: 'entrepreneurship-product-creation-2026',
    title: 'Entrepreneurship: Product Creation',
    drivingQuestion: 'How might we design, prototype, and launch a sustainable consumer product that solves an authentic community need and generates verified customer pre-orders?',
    theme: 'Social Innovation & Sustainable Enterprise',
    impact: {
      people: 'Empowers youth entrepreneurs with financial literacy, customer empathy, and authentic market validation.',
      environment: 'Emphasizes circular lifecycle design, non-toxic bioplastics, and zero-waste packaging.'
    },
    frameworkId: 'welearn-dt',
    frameworkVersion: 1,
    ageBand: '14-16',
    durationWeeks: 12,
    authorId: 'system-library',
    source: 'library',
    status: 'published',
    visibility: 'centre',
    tags: ['entrepreneurship', 'business', 'startup', 'product', 'makerspace', 'market', 'sustainability'],
    phases: [
      {
        phaseId: 'explore',
        title: 'Explore: Market Opportunities & Material Flows',
        learningGoal: 'Investigate consumer consumption patterns and circular economy materials in the local community.',
        sessions: [
          {
            title: 'Market Opportunity Audit',
            minutes: 90,
            activities: [
              'Survey retail shelves and local markets for single-use plastic waste.',
              'Analyze material lifecycle from extraction to disposal.',
              'Review successful student social ventures and youth brands.'
            ]
          }
        ],
        tools: ['Material Sample Kit', 'Market Research Spreadsheet'],
        deliverables: ['Opportunity landscape report', '3 potential product briefs'],
        coachCue: 'Help learners focus on solving genuine annoyances rather than inventing novelty gadgets.'
      },
      {
        phaseId: 'empathise',
        title: 'Empathise: Customer Discovery Interviews',
        learningGoal: 'Conduct non-leading customer discovery interviews to validate willingness-to-pay and friction points.',
        sessions: [
          {
            title: 'Mom Test Customer Interviews',
            minutes: 90,
            activities: [
              'Draft open-ended interview guides following "The Mom Test" methodology.',
              'Interview 10 potential customers about past purchasing behaviors.',
              'Extract verifiable customer quotes and quantified pain points.'
            ]
          }
        ],
        tools: ['Customer Interview Script', 'Audio Recorder'],
        deliverables: ['Customer discovery synthesis table', 'Buyer persona canvas'],
        coachCue: 'Ensure learners do not ask "Would you buy this?" but rather "Tell me about the last time you dealt with this problem."'
      },
      {
        phaseId: 'define',
        title: 'Define: Value Proposition & Unit Economics',
        learningGoal: 'Define the minimum viable product (MVP) scope and establish unit economic targets.',
        sessions: [
          {
            title: 'Lean Canvas & Pricing Model',
            minutes: 90,
            activities: [
              'Complete Lean Business Canvas mapping unique value proposition and distribution channels.',
              'Calculate Bill of Materials (BOM) cost and target gross margin (minimum 60%).',
              'Define three falsifiable risk hypotheses to test.'
            ]
          }
        ],
        tools: ['Lean Canvas', 'BOM Cost Calculator'],
        deliverables: ['Completed Lean Canvas', 'Unit economics model'],
        coachCue: 'Remind learners that pricing must account for labor time and tool amortisation.'
      },
      {
        phaseId: 'ideate',
        title: 'Ideate: Industrial Design & Form Factor',
        learningGoal: 'Generate divergent product form factors balancing ergonomics, aesthetic appeal, and manufacturing simplicity.',
        sessions: [
          {
            title: 'Form Factor Sketching & Cardboard Mockups',
            minutes: 90,
            activities: [
              'Execute 10x10 rapid sketching exercises exploring tactile grips and aesthetic silhouettes.',
              'Construct 1:1 scale cardboard ergonomic study models.',
              'Present physical mockups for blind user feedback on feel and weight balance.'
            ]
          }
        ],
        tools: ['Foam Board', 'Cardboard', 'Cutting Mat', 'Clay'],
        deliverables: ['5 ergonomic physical study mockups', 'Concept refinement portfolio'],
        coachCue: 'Encourage learners to discard their first concept and push through to unexpected variations.'
      },
      {
        phaseId: 'prototype',
        title: 'Prototype: Rapid CAD & MakerSpace Fabrication',
        learningGoal: 'Model functional 3D CAD files, select eco-filament materials, and print production-quality prototypes.',
        sessions: [
          {
            title: 'Parametric CAD Modeling & Tooling',
            minutes: 90,
            activities: [
              'Design parametric 3D parts in Fusion 360 / Blender with snap-fit joints and tolerancing.',
              'Slice and optimize 3D prints using Bambu Studio with recycled PLA/PETG.',
              'Perform post-processing: deburring, sanding, and assembling mechanical fasteners.'
            ]
          }
        ],
        tools: ['Fusion 360 / Blender', 'Bambu 3D Printers', 'Digital Caliper', 'Assembly Hardware'],
        deliverables: ['3D CAD design files (.STEP / .3MF)', 'Production-grade physical prototype v1'],
        coachCue: 'Teach tolerancing principles (0.2mm clearance for sliding parts).'
      },
      {
        phaseId: 'test',
        title: 'Test & Improve: Drop Testing & Pre-Sales Validation',
        learningGoal: 'Conduct rigorous physical durability stress tests and launch a smoke-test landing page for customer pre-orders.',
        sessions: [
          {
            title: 'Durability Testing & Pre-Order Landing Page',
            minutes: 90,
            activities: [
              'Perform 1.2m drop tests onto concrete and record structural failure modes.',
              'Deploy a one-page product landing page with clear CTA for customer email sign-ups.',
              'Analyze conversion rates from 50 targeted visitor clicks.'
            ]
          }
        ],
        tools: ['Landing Page Builder', 'Drop Test Rig', 'Web Analytics'],
        deliverables: ['Drop test failure report', 'Live pre-order sign-up log (target: 5+ verified sign-ups)'],
        coachCue: 'Focus on evidence of genuine intent (email reservation or deposits) rather than polite compliments.'
      },
      {
        phaseId: 'showcase',
        title: 'Showcase: Demo Day & Investor Pitch',
        learningGoal: 'Pitch product, customer validation metrics, and financials to a panel of entrepreneurs and peers.',
        sessions: [
          {
            title: 'Pitch Deck Delivery & Pop-Up Market Expo',
            minutes: 90,
            activities: [
              'Deliver a crisp 3-minute pitch deck covering Problem, Solution, Traction, and Economics.',
              'Host pop-up retail demo table with live physical product prototypes.',
              'Process genuine mock orders and collect written customer reviews.'
            ]
          }
        ],
        tools: ['Pitch Deck Template', 'Retail Pop-up Table', 'QR Code Order Form'],
        deliverables: ['Pitch slide deck', '60-second product video ad', 'Verified sales summary'],
        coachCue: 'Coach learners to speak with grounded conviction backed by their test metrics.'
      }
    ],
    searchTokens: [],
    createdAt: 1729000000000,
    updatedAt: 1729000000000,
    publishedAt: 1729000000000
  },
  {
    id: 'storytelling-genesis-2026',
    slug: 'storytelling-genesis-2026',
    title: 'Project Genesis Engine: Storytelling IP',
    drivingQuestion: 'How might we architect a rich speculative fiction universe and interactive narrative bible that explores climate futures and collective empathy?',
    theme: 'Digital Media & Speculative Storytelling',
    impact: {
      people: 'Amplifies youth voices, creative expression, and inclusive representation across multimedia formats.',
      environment: 'Inspires climate empathy and environmental stewardship through speculative worldbuilding.'
    },
    frameworkId: 'welearn-dt',
    frameworkVersion: 1,
    ageBand: '11-13',
    durationWeeks: 12,
    authorId: 'system-library',
    source: 'library',
    status: 'published',
    visibility: 'centre',
    tags: ['storytelling', 'narrative', 'creative-writing', 'media', 'worldbuilding', 'fiction'],
    phases: [
      {
        phaseId: 'explore',
        title: 'Explore: Speculative Climates & World Lore',
        learningGoal: 'Investigate speculative climate futures and classic narrative story structures.',
        sessions: [
          {
            title: 'Speculative Climate Scenario Exploration',
            minutes: 90,
            activities: [
              'Analyze speculative climate worldbuilding across literature and cinema.',
              'Examine how physical geography shapes cultural rituals and technological adaptations.',
              'Draft foundational environmental constraints for the fictional setting.'
            ]
          }
        ],
        tools: ['World Lore Canvas', 'Speculative Timeline Template'],
        deliverables: ['Setting summary document', '3 environmental conflict prompts'],
        coachCue: 'Encourage learners to anchor fantastical elements in believable ecological physics.'
      },
      {
        phaseId: 'empathise',
        title: 'Empathise: Character Perspectives & Inner Drives',
        learningGoal: 'Develop nuanced characters with conflicting desires, moral dilemmas, and authentic psychological depth.',
        sessions: [
          {
            title: 'Character Psychology & Flaw Matrix',
            minutes: 90,
            activities: [
              'Build multidimensional character dossiers with needs, fatal flaws, and backstories.',
              'Conduct in-character roleplay dialogue sessions between opposing factions.',
              'Write character voice monologue samples.'
            ]
          }
        ],
        tools: ['Character Dossier Template', 'Faction Relationship Graph'],
        deliverables: ['2 complete character dossiers with voice samples'],
        coachCue: 'Make sure characters have clear vulnerabilities that force meaningful choices.'
      },
      {
        phaseId: 'define',
        title: 'Define: Core Conflict & Narrative Arc',
        learningGoal: 'Map the central thematic thesis and plot mechanics using classic dramatic structure.',
        sessions: [
          {
            title: 'Dramatic Plot Spine Mapping',
            minutes: 90,
            activities: [
              'Map inciting incidents, midpoint crisis, and climax onto a 3-act narrative curve.',
              'Establish internal character arcs mirroring external environmental stakes.',
              'Define the moral argument of the story.'
            ]
          }
        ],
        tools: ['Plot Spine Canvas', 'Story Beat Sheet'],
        deliverables: ['Complete story beat sheet', 'Thematic logline'],
        coachCue: 'Help learners connect the external plot challenges directly to their protagonist’s inner growth.'
      },
      {
        phaseId: 'ideate',
        title: 'Ideate: Branching Paths & Visual Motifs',
        learningGoal: 'Explore interactive story branches and iconic visual iconography for the story world.',
        sessions: [
          {
            title: 'Interactive Choice Tree & Moodboard',
            minutes: 90,
            activities: [
              'Diagram branching decision points using Twine / node maps.',
              'Curate visual style guide for character costumes and architectural aesthetics.',
              'Draft sample interactive choice dilemmas with meaningful consequences.'
            ]
          }
        ],
        tools: ['Twine', 'PureRef / Milanote', 'Dialogue Node Graph'],
        deliverables: ['Branching narrative node map', 'Visual universe moodboard'],
        coachCue: 'Ensure branches present dilemmas of sacrifice rather than obvious good/bad choices.'
      },
      {
        phaseId: 'prototype',
        title: 'Prototype: Scriptwriting & Interactive Build',
        learningGoal: 'Draft the pilot chapter script and code the interactive web narrative prototype.',
        sessions: [
          {
            title: 'Scene Writing & Digital Story Engine',
            minutes: 90,
            activities: [
              'Write standard industry screenplay or novella chapter (1,500–2,500 words).',
              'Code interactive branch logic with character status trackers in Twine/HTML.',
              'Integrate environmental soundscapes and character portrait graphics.'
            ]
          }
        ],
        tools: ['Fountain / Highland Screenplay Editor', 'Twine HTML Export', 'Audacity'],
        deliverables: ['Draft script/chapter', 'Playable interactive web prototype'],
        coachCue: 'Emphasize sensory imagery and pacing over lengthy exposition dumps.'
      },
      {
        phaseId: 'test',
        title: 'Test & Improve: Reader Table Reads & Feedback',
        learningGoal: 'Host table reads with beta readers to measure emotional resonance and branch engagement.',
        sessions: [
          {
            title: 'Beta Reader Table Read & Playtesting',
            minutes: 90,
            activities: [
              'Conduct live dramatic read-through with three peer readers taking character roles.',
              'Track reader engagement, confusion points, and emotional drop-offs.',
              'Revise dialogue to improve distinct subtext and conversational rhythm.'
            ]
          }
        ],
        tools: ['Reader Reaction Rubric', 'Annotation Tools'],
        deliverables: ['Reader feedback log', 'Second revised draft with tracked changes'],
        coachCue: 'Observe where readers lean in or get restless during the reading.'
      },
      {
        phaseId: 'showcase',
        title: 'Showcase: Universe Pitch & Live Performance',
        learningGoal: 'Present the world bible and perform a dramatic showcase reading for an audience.',
        sessions: [
          {
            title: 'Live Dramatic Reading & World Bible Expo',
            minutes: 90,
            activities: [
              'Perform a live 4-minute dramatic reading with atmospheric audio cues.',
              'Publish interactive digital storybook online with playable QR code.',
              'Host creator Q&A session discussing thematic symbolism.'
            ]
          }
        ],
        tools: ['Public Publishing Platform', 'Audio System', 'Exhibition Table'],
        deliverables: ['Published interactive story link', 'Illustrated World Bible PDF', 'Live showcase performance'],
        coachCue: 'Support learners in owning their artistic voice with pride and confidence.'
      }
    ],
    searchTokens: [],
    createdAt: 1729000000000,
    updatedAt: 1729000000000,
    publishedAt: 1729000000000
  },
  {
    id: 'passion-project-blueprint-2026',
    slug: 'passion-project-blueprint-2026',
    title: 'The Passion Project Blueprint',
    drivingQuestion: 'How might an independent learner pursue an authentic personal passion to create a public portfolio artifact that impacts their community?',
    theme: 'Self-Directed Mastery & Portfolio',
    impact: {
      people: 'Fosters agency, executive function, and authentic community mentorship.',
      environment: 'Encourages local community action and ecological stewardship.'
    },
    frameworkId: 'welearn-dt',
    frameworkVersion: 1,
    ageBand: '14-16',
    durationWeeks: 12,
    authorId: 'system-library',
    source: 'library',
    status: 'published',
    visibility: 'centre',
    tags: ['passion', 'self-directed', 'portfolio', 'mastery', 'independent', 'inquiry'],
    phases: [
      {
        phaseId: 'explore',
        title: 'Explore: Curiosities & Mastery Roadmap',
        learningGoal: 'Map personal obsessions, skill gaps, and authentic inquiry questions into a structured term roadmap.',
        sessions: [
          {
            title: 'Inquiry Compass & Domain Exploration',
            minutes: 90,
            activities: [
              'Map intersections between personal passions, community needs, and technical craft.',
              'Analyze exemplary portfolio capstone projects from global youth creators.',
              'Formulate three potential Driving Questions with high ambition.'
            ]
          }
        ],
        tools: ['Ikigai Inquiry Canvas', 'Portfolio Benchmark Gallery'],
        deliverables: ['Passions inventory matrix', 'Selected inquiry driving question'],
        coachCue: 'Help learners separate fleeting interests from deep, sustained curiosities.'
      },
      {
        phaseId: 'empathise',
        title: 'Empathise: Expert & Audience Consultation',
        learningGoal: 'Identify and reach out to authentic domain mentors and community beneficiaries.',
        sessions: [
          {
            title: 'Mentor Outreach & Needs Alignment',
            minutes: 90,
            activities: [
              'Draft professional cold outreach emails to domain practitioners or university researchers.',
              'Conduct informational interview exploring real-world industry benchmarks.',
              'Align project deliverables with genuine field standards.'
            ]
          }
        ],
        tools: ['Email Outreach Script', 'Informational Interview Framework'],
        deliverables: ['Mentor consultation notes', 'Authentic industry standard checklist'],
        coachCue: 'Support learners through the anxiety of reaching out to adult professionals.'
      },
      {
        phaseId: 'define',
        title: 'Define: Project Charter & Milestones',
        learningGoal: 'Draft a binding Project Charter outlining deliverables, tools, and sprint checkpoints.',
        sessions: [
          {
            title: 'Scoping & Sprint Planning',
            minutes: 90,
            activities: [
              'Establish definition-of-done for the public artifact.',
              'Break term project into 2-week agile sprint milestones.',
              'Identify risk factors and plan friction mitigation strategies.'
            ]
          }
        ],
        tools: ['Kanban Board (Notion/Trello)', 'Project Charter Template'],
        deliverables: ['Signed Project Charter', '12-week Sprint Milestone Schedule'],
        coachCue: 'Aggressively de-scope over-ambitious concepts into realistic execution slices.'
      },
      {
        phaseId: 'ideate',
        title: 'Ideate: Concept Prototypes & Variations',
        learningGoal: 'Explore three distinct approaches to creating the target artifact.',
        sessions: [
          {
            title: 'Variant Spikes & Experimentation',
            minutes: 90,
            activities: [
              'Create rapid proof-of-concept prototypes for three different structural directions.',
              'Evaluate material costs, time investments, and aesthetic impact of each option.',
              'Select primary direction based on mentor feedback.'
            ]
          }
        ],
        tools: ['Comparative Decision Matrix', 'Prototype Logbook'],
        deliverables: ['3 low-fidelity proof-of-concept tests', 'Direction selection memo'],
        coachCue: 'Encourage low-stakes failure during concept spikes.'
      },
      {
        phaseId: 'prototype',
        title: 'Prototype: Artifact Craft & Production Sprints',
        learningGoal: 'Execute dedicated production sprints to build the substantive portfolio artifact.',
        sessions: [
          {
            title: 'Sprint Execution & Studio Craft',
            minutes: 90,
            activities: [
              'Execute focused studio work sessions building the core artifact.',
              'Document weekly progress videos and engineering notes.',
              'Troubleshoot technical bottlenecks with coach and mentor support.'
            ]
          }
        ],
        tools: ['MakerSpace Tools', 'Studio Equipment', 'Sprint Burn-Down Chart'],
        deliverables: ['Working portfolio artifact draft', 'Sprint completion logbook'],
        coachCue: 'Check in regularly on executive function and task initiation hurdles.'
      },
      {
        phaseId: 'test',
        title: 'Test & Improve: Expert Critique & Revision',
        learningGoal: 'Subject the artifact to rigorous critique by mentors and target end-users.',
        sessions: [
          {
            title: 'Formal Critique & Polish Sprint',
            minutes: 90,
            activities: [
              'Present artifact to domain mentor for structured technical review.',
              'Catalogue actionable feedback into must-fix vs nice-to-have items.',
              'Execute final polish sprint elevating craft quality to professional level.'
            ]
          }
        ],
        tools: ['Austin’s Butterfly Critique Protocol', 'Revision Punch List'],
        deliverables: ['Critique feedback record', 'Revised high-fidelity final artifact'],
        coachCue: 'Model constructive critique: be kind, specific, and helpful.'
      },
      {
        phaseId: 'showcase',
        title: 'Showcase: Public Defense & Portfolio Publication',
        learningGoal: 'Deliver a formal public defense of the artifact and publish a permanent digital portfolio case study.',
        sessions: [
          {
            title: 'Public Capstone Defense',
            minutes: 90,
            activities: [
              'Deliver a 10-minute capstone defense before coach panel and guests.',
              'Publish complete portfolio case study with process evidence and reflections.',
              'Receive formal competency badges and feedback.'
            ]
          }
        ],
        tools: ['Digital Portfolio Platform', 'Public Defense Rubric'],
        deliverables: ['Published case study web page', 'Recorded public defense video', 'Reflective post-mortem'],
        coachCue: 'Celebrate the journey and resilience, not just the finished polish.'
      }
    ],
    searchTokens: [],
    createdAt: 1729000000000,
    updatedAt: 1729000000000,
    publishedAt: 1729000000000
  },
  {
    id: 'biomechanics-robotics-2026',
    slug: 'biomechanics-robotics-2026',
    title: 'Quantitative Biomechanics & Bio-Inspired Robotics',
    drivingQuestion: 'How might we engineer bio-inspired prosthetic mechanisms or robotic limbs using kinematic analysis and 3D rapid prototyping?',
    theme: 'Biomimetic Robotics & Human Ergonomics',
    impact: {
      people: 'Develops affordable, accessible assistive mechanisms for individuals with upper-limb differences.',
      environment: 'Applies biomimicry principles to minimize motor energy consumption and lightweight structures.'
    },
    frameworkId: 'welearn-dt',
    frameworkVersion: 1,
    ageBand: '14-16',
    durationWeeks: 12,
    authorId: 'system-library',
    source: 'library',
    status: 'published',
    visibility: 'centre',
    tags: ['biomechanics', 'robotics', 'prosthetics', 'engineering', 'cad', 'arduino', 'biomimicry'],
    phases: [
      {
        phaseId: 'explore',
        title: 'Explore: Natural Anatomy & Mechanical Linkages',
        learningGoal: 'Examine human musculoskeletal anatomy and animal biomechanics to identify tendon linkage geometries.',
        sessions: [
          {
            title: 'Anatomy Kinematics & Bio-Inspired Linkages',
            minutes: 90,
            activities: [
              'Dissect avian tendon mechanisms or analyze high-speed motion capture of human hand articulation.',
              'Calculate mechanical advantage in class 1, 2, and 3 lever systems.',
              'Measure maximum grip force and degrees of freedom in human hands.'
            ]
          }
        ],
        tools: ['Dynamometer', 'Kinematic Software Tracker', 'Skeletal Models'],
        deliverables: ['Linkage kinematics diagram', 'Grip force measurement data table'],
        coachCue: 'Highlight how human tendons route through pulleys (annular ligaments) to eliminate bulk.'
      },
      {
        phaseId: 'empathise',
        title: 'Empathise: Ergonomics & Assistive Technology Needs',
        learningGoal: 'Understand daily living challenges and sensory feedback requirements for prosthetic users.',
        sessions: [
          {
            title: 'Assistive Ergonomics & User Needs Analysis',
            minutes: 90,
            activities: [
              'Simulate one-handed daily living activities (zipping jacket, typing, pouring water).',
              'Interview assistive technology specialists or occupational therapists.',
              'Identify critical weight thresholds (prosthesis must be under 350g to prevent shoulder fatigue).'
            ]
          }
        ],
        tools: ['Ergonomic Assessment Protocol', 'Simulation Constraints Kit'],
        deliverables: ['User requirements profile', 'Ergonomic constraint specification'],
        coachCue: 'Emphasize that the lightest device with high comfort often beats an over-engineered heavy hand.'
      },
      {
        phaseId: 'define',
        title: 'Define: Actuation & Payload Target Specifications',
        learningGoal: 'Set precise quantitative engineering goals for payload capacity, actuation speed, and weight.',
        sessions: [
          {
            title: 'Actuator Sizing & Degrees-of-Freedom Spec',
            minutes: 90,
            activities: [
              'Calculate required servo torque for a 500g vertical pinch payload.',
              'Specify motor voltage, current draw, and lithium battery capacity.',
              'Establish pass/fail criteria for 5 standard grasping shapes (cylinder, sphere, pinch).'
            ]
          }
        ],
        tools: ['Motor Torque Calculator', 'Battery Sizing Worksheet'],
        deliverables: ['Engineering requirements document', 'Payload & battery target matrix'],
        coachCue: 'Guide learners in verifying servo stall currents to avoid brownout resets.'
      },
      {
        phaseId: 'ideate',
        title: 'Ideate: Compliant Mechanisms & Tendon Routing',
        learningGoal: 'Design innovative compliant flexible hinges (living hinges) and non-stretch tendon routing paths.',
        sessions: [
          {
            title: 'Compliant Joint Design & Tendon Routing',
            minutes: 90,
            activities: [
              'Design 3D-printable flexible TPU hinges eliminating metallic pin joints.',
              'Prototype Dyneema cord routing paths to optimize curling motion.',
              'Simulate stress concentrations in CAD FEA tools.'
            ]
          }
        ],
        tools: ['Fusion 360 / Onshape', 'Laser Cut MDF / Cardboard', 'Dyneema Cord'],
        deliverables: ['Joint flexure comparison models', 'Tendon routing schematic'],
        coachCue: 'TPU compliant joints reduce part count from 20 down to 1!'
      },
      {
        phaseId: 'prototype',
        title: 'Prototype: 3D Printing & Microcontroller Firmware',
        learningGoal: 'Print mechanical finger assemblies, calibrate high-torque servos, and program EMG / flex sensor controls.',
        sessions: [
          {
            title: 'Mechanical Assembly & Servo Actuation',
            minutes: 90,
            activities: [
              '3D print palm and finger phalanges in carbon-fiber reinforced PETG and TPU.',
              'Assemble servo motor harness and string tensioning turnbuckles.',
              'Write Arduino / ESP32 code to map potentiometer / flex sensor input to servo angles.'
            ]
          }
        ],
        tools: ['Bambu 3D Printer', 'ESP32 / Arduino', 'Metal Gear Servos', 'Bench Power Supply'],
        deliverables: ['Assembled robotic hand prototype', 'C++ / MicroPython control firmware'],
        coachCue: 'Ensure separate power rails for logic and high-current servo motors.'
      },
      {
        phaseId: 'test',
        title: 'Test & Improve: Grasping Benchmarks & Stress Cycles',
        learningGoal: 'Subject the robotic hand to 500-cycle grip endurance tests and payload weight measurements.',
        sessions: [
          {
            title: 'Payload Testing & Cycle Endurance',
            minutes: 90,
            activities: [
              'Execute 500 automated open/close cycles logging servo temperatures and cable wear.',
              'Benchmark grasp success rate across 10 varied objects (egg, key, soda can, pencil).',
              'Reinforce cable termination anchors that show signs of fraying.'
            ]
          }
        ],
        tools: ['Test Object Set', 'Infrared Thermometer', 'Cycle Counter Rig'],
        deliverables: ['Grip test evaluation matrix', 'Failure cycle report & mechanical modifications'],
        coachCue: 'Encourage testing delicate objects like eggs to demonstrate compliant touch control.'
      },
      {
        phaseId: 'showcase',
        title: 'Showcase: Live Robotics Demonstration & Expo',
        learningGoal: 'Demonstrate functional robotic prosthesis in real time, showcasing grasping capability and technical documentation.',
        sessions: [
          {
            title: 'Live Actuation Demo & Technical Poster Session',
            minutes: 90,
            activities: [
              'Perform live dexterity demonstration grasping and lifting objects in front of evaluators.',
              'Present technical engineering poster highlighting biomimetic advantages.',
              'Provide open-source CAD repository link for assistive community reuse.'
            ]
          }
        ],
        tools: ['Demo Arena', 'Technical Poster', 'Live Video Feed'],
        deliverables: ['Demonstration performance', 'Technical poster PDF', 'Open-source build repository'],
        coachCue: 'Have learners explain the exact mechanical advantage equation behind their joint.'
      }
    ],
    searchTokens: [],
    createdAt: 1729000000000,
    updatedAt: 1729000000000,
    publishedAt: 1729000000000
  },
  {
    id: 'hex-city-thailand-2026',
    slug: 'hex-city-thailand-2026',
    title: 'Hex-City Thailand: Modular Resilient Floating City',
    drivingQuestion: 'How might we design modular, amphibious urban infrastructure to protect coastal Chao Phraya communities from rising sea levels and monsoon floods?',
    theme: 'Amphibious Architecture & Urban Adaptation',
    impact: {
      people: 'Protects vulnerable coastal and riverine families from catastrophic displacement and loss of livelihood.',
      environment: 'Integrates floating wetland bio-filtration beds and restores mangrove aquatic nurseries.'
    },
    frameworkId: 'welearn-dt',
    frameworkVersion: 1,
    ageBand: '14-16',
    durationWeeks: 12,
    authorId: 'system-library',
    source: 'library',
    status: 'published',
    visibility: 'centre',
    tags: ['hex-city', 'floating-city', 'amphibious', 'climate', 'flood', 'architecture', 'monsoon', 'resilience'],
    phases: [
      {
        phaseId: 'explore',
        title: 'Explore: Hydrodynamics & Coastal Flood Vulnerability',
        learningGoal: 'Investigate sea-level rise projections for the Gulf of Thailand and calculate Archimedes buoyancy principles.',
        sessions: [
          {
            title: 'Bangkok Flood Projections & Buoyancy Physics',
            minutes: 90,
            activities: [
              'Analyze hydrological data and elevation maps for Samut Prakan and Bangkok delta.',
              'Conduct buoyancy experiments calculating Archimedes displacement volume in water tanks.',
              'Evaluate modular hexagonal tessellation geometries for stable wave dispersal.'
            ]
          }
        ],
        tools: ['Hydrological GIS Maps', 'Wave Test Tank', 'Precision Scale'],
        deliverables: ['Flood risk assessment report', 'Buoyancy calculation formulas'],
        coachCue: 'Connect math directly to physics: buoyant force equals weight of displaced fluid.'
      },
      {
        phaseId: 'empathise',
        title: 'Empathise: Riverine Community Livelihoods',
        learningGoal: 'Understand cultural traditions, canal transport dependencies, and living conditions of Chao Phraya stilt-house communities.',
        sessions: [
          {
            title: 'Canal Community Cultural Fieldwork',
            minutes: 90,
            activities: [
              'Analyze oral histories and interviews with Bangkok canal community elders.',
              'Map daily transport rhythms, long-tail boat docking, and food distribution.',
              'Formulate design values prioritizing cultural continuity over sterile tech.'
            ]
          }
        ],
        tools: ['Cultural Ethnography Canvas', 'Audio Interviews'],
        deliverables: ['Community cultural value map', 'Stakeholder empathy synthesis'],
        coachCue: 'Emphasize that sustainable architecture must respect local communal identity.'
      },
      {
        phaseId: 'define',
        title: 'Define: Hexagonal Module Specifications',
        learningGoal: 'Define modular interlocking specifications, payload capacities, and off-grid utility systems.',
        sessions: [
          {
            title: 'Modular Dimensioning & Interlocking Spec',
            minutes: 90,
            activities: [
              'Establish standard hexagon outer dimensions and flexible umbilical coupling tolerances.',
              'Specify payload capacity: platform weight + housing structure + 12 occupants + solar array.',
              'Establish water quality filtration targets for greywater recycling.'
            ]
          }
        ],
        tools: ['Architectural Standards Guide', 'Modular System Matrix'],
        deliverables: ['Module technical specification document', 'Interlocking coupler diagram'],
        coachCue: 'Insist on standardized connector interfaces so different student modules can link together.'
      },
      {
        phaseId: 'ideate',
        title: 'Ideate: Tessellated Master Plan & Micro-Grids',
        learningGoal: 'Generate scalable urban neighborhood layouts with integrated renewable energy and aquaponics.',
        sessions: [
          {
            title: 'Urban Clustering & Wave Break Geometry',
            minutes: 90,
            activities: [
              'Sketch hexagonal cluster configurations balancing wave attenuation and canal navigation.',
              'Design integrated solar PV canopies, rainwater harvesting, and bio-filtration roots.',
              'Execute peer design charrette evaluating module cluster flexibility.'
            ]
          }
        ],
        tools: ['Hexagonal Grid Paper', 'Foam Study Blocks'],
        deliverables: ['Neighborhood master plan sketch', 'Utility flow diagram (water, power, food)'],
        coachCue: 'Encourage thinking about decentralized resilience: if one module detaches, does the city survive?'
      },
      {
        phaseId: 'prototype',
        title: 'Prototype: Scaled Buoyant Model & Wave Tank Testing',
        learningGoal: 'Fabricate waterproof 1:50 scaled hexagonal modules and test wave tank stability under simulated monsoon conditions.',
        sessions: [
          {
            title: 'Buoyant Platform Fabrication & Wave Tank Run',
            minutes: 90,
            activities: [
              'Construct buoyant hull using expanded polypropylene (EPP) and laser-cut bio-composites.',
              'Assemble flexible elastomeric inter-module hinge joints.',
              'Deploy in wave flume tank and simulate monsoon wave frequencies.'
            ]
          }
        ],
        tools: ['Laser Cutter', 'EPP Foam Carver', 'Wave Tank Flume', 'Submersible Accelerometer'],
        deliverables: ['1:50 scaled physical floating module', 'Wave stability accelerometer logs'],
        coachCue: 'Verify that the center of gravity remains low below the metacenter to prevent capsizing.'
      },
      {
        phaseId: 'test',
        title: 'Test & Improve: Torsional Stress & Flood Survival',
        learningGoal: 'Measure coupler stress under opposing wave surges and optimize flexible damping joints.',
        sessions: [
          {
            title: 'Surge Testing & Coupler Iteration',
            minutes: 90,
            activities: [
              'Simulate 100-year flood surge conditions with high debris impacts.',
              'Inspect inter-module hinge connectors for torsional fatigue.',
              'Redesign joint geometry with silicone damping bumpers.'
            ]
          }
        ],
        tools: ['Tension Gauge', 'High-Speed Camera', 'Impact Simulator'],
        deliverables: ['Coupler stress analysis report', 'Modified hinge design v2'],
        coachCue: 'Rigid connections snap in heavy water; flexible compliant connections survive.'
      },
      {
        phaseId: 'showcase',
        title: 'Showcase: Urban Resilience Expo & Public Model',
        learningGoal: 'Combine all student modules into a connected floating city exhibition and present to urban planners.',
        sessions: [
          {
            title: 'Combined Floating City Exhibition',
            minutes: 90,
            activities: [
              'Interlock all student hexagonal modules into a single collective 20-module floating model.',
              'Present urban resilience strategy to guest architects and urban planning mentors.',
              'Publish digital 3D interactive model and policy brief.'
            ]
          }
        ],
        tools: ['Central Exhibition Water Basin', 'AR Visualization Tablet', 'Policy Brief Template'],
        deliverables: ['Joint floating city installation', 'Urban policy recommendation brief', 'Recorded showcase presentation'],
        coachCue: 'Celebrate collective collaboration: no single module is a city, only together do they float.'
      }
    ],
    searchTokens: [],
    createdAt: 1729000000000,
    updatedAt: 1729000000000,
    publishedAt: 1729000000000
  }
];

// Populate searchTokens for all programs
for (const prog of LIBRARY_PROGRAMS) {
  prog.searchTokens = generateSearchTokens(prog.title, prog.theme, prog.tags, prog.drivingQuestion);
}
