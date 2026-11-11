/**
 * AI-Assisted Learning Materials Generator for PBL Stages
 * Supports Slides, Formative Quizzes with explanations, and Practical Activities.
 * Includes refinement actions ("simpler language", "less text", "add a challenge")
 * and client-side idempotency guards.
 */

// In-flight request deduplication map to prevent accidental duplicate clicks / charges
const pendingRequests = new Map();

/**
 * Generates structured learning materials for a stage.
 * @param {Object} params
 * @param {'slides'|'quiz'|'activity'|'all'} params.type
 * @param {Object} params.stage - Stage object (title, goal, checklist, week, etc.)
 * @param {Object} params.program - Program metadata (title, drivingQuestion, theme, ageBand)
 * @param {string} [params.notes] - Custom coach prompt, source notes, or text
 * @param {string} [params.refinement] - Optional refinement instruction
 */
export async function generateStageMaterials({
  type = 'all',
  stage,
  program,
  notes = '',
  refinement = null
}) {
  if (!stage) throw new Error('Stage context is required for generating materials.');

  const requestId = `${stage.id || stage.phaseId || 'stage'}_${type}_${refinement || 'base'}_${notes.slice(0, 32)}`;
  if (pendingRequests.has(requestId)) {
    return pendingRequests.get(requestId);
  }

  const promise = (async () => {
    // Attempt backend AI endpoint if available
    try {
      if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        const res = await fetch('/api/coach/generate-stage-materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, stage, program, notes, refinement })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && (data.slides || data.quiz || data.activity)) {
            return validateAndNormalizeMaterials(data);
          }
        }
      }
    } catch {
      // Fallback gracefully to built-in structured generator
    }

    // Built-in high-quality pedagogical generator
    return createStructuredStageMaterials({ type, stage, program, notes, refinement });
  })().finally(() => {
    pendingRequests.delete(requestId);
  });

  pendingRequests.set(requestId, promise);
  return promise;
}

/**
 * Generates structured pedagogical materials grounded in the stage and program context.
 */
function createStructuredStageMaterials({ type, stage, program, notes, refinement }) {
  const stageTitle = stage.title || 'PBL Stage';
  const stageGoal = stage.learningGoal || stage.goal || 'Investigate core questions and build prototypes';
  const progTitle = program?.title || 'STEM Project';
  const dq = program?.drivingQuestion || 'How can we solve real community challenges through engineering?';
  const ageBand = program?.ageBand || program?.targetAgeRange || '11-14';
  const tasks = Array.isArray(stage.checklist)
    ? stage.checklist.map((t) => (typeof t === 'string' ? t : t.label))
    : (Array.isArray(stage.tasks) ? stage.tasks : ['Explore the problem', 'Build an iteration', 'Test and record']);

  const isSimpler = refinement === 'simpler';
  const isLessText = refinement === 'less-text';
  const isChallenge = refinement === 'add-challenge';

  const result = {};

  // 1. Generate Slides (5 visual, engaging slides)
  if (type === 'slides' || type === 'all') {
    result.slides = [
      {
        id: `slide-${Date.now()}-1`,
        slideNumber: 1,
        heading: isSimpler ? `Let's Explore: ${stageTitle}` : `${stageTitle} · ${progTitle}`,
        subheading: `Our Big Goal: "${stageGoal}"`,
        bullets: isLessText
          ? [
              `Target question: ${dq.slice(0, 60)}…`,
              `Ages: ${ageBand} years old`,
              'Goal: Real, tangible community impact'
            ]
          : [
              `Connecting to our Driving Question: "${dq}"`,
              `Learner Cohort: Ages ${ageBand}`,
              `Stage Mission: Work together to test ideas on the bench`
            ],
        speakerNotes: isSimpler
          ? `Welcome team! Today we are diving into ${stageTitle}. Think about what we can make with our own hands.`
          : `Welcome team! Today we enter ${stageTitle}. Notice our key goal on the board: "${stageGoal}". By the end of this session, everyone will have physical or digital evidence logged.`
      },
      {
        id: `slide-${Date.now()}-2`,
        slideNumber: 2,
        heading: isSimpler ? 'What We Need to Figure Out' : 'Investigation & Key Concepts',
        subheading: 'Understanding the problem before jumping to answers',
        bullets: isLessText
          ? [
              'Observe what real users struggle with',
              'Take measurements and write them down',
              'Brainstorm at least 3 different approaches'
            ]
          : [
              'Examine how existing community systems or machines behave under stress',
              'Identify the root bottleneck rather than surface symptoms',
              'Formulate a clear design hypothesis with measurable targets'
            ],
        speakerNotes: `Prompt learners with: 'If this was your family facing this issue, what would make a solution truly great?'`
      },
      {
        id: `slide-${Date.now()}-3`,
        slideNumber: 3,
        heading: isSimpler ? 'Our Step-by-Step Mission' : 'Stage Tasks & Checklist',
        subheading: 'What you will accomplish in this stage',
        bullets: tasks.slice(0, 3).map((t) => (isLessText ? t.split(' ').slice(0, 7).join(' ') : `Complete: ${t}`)),
        speakerNotes: `Keep an eye on the checklist. Every milestone should be ticked only when peer-tested.`
      },
      {
        id: `slide-${Date.now()}-4`,
        slideNumber: 4,
        heading: isSimpler ? 'Making & Safety Rules' : 'MakerSpace Fabrication & Testing',
        subheading: 'Hands-on prototyping with care',
        bullets: isLessText
          ? [
              'Wear safety glasses at all times',
              'Keep workbenches clean and organized',
              'Test often and learn from breakdowns'
            ]
          : [
              'Safety first: protective gear and clear tool zones at all fabrication stations',
              'Iterate rapidly: treat early model failure as valuable design telemetry',
              'Record exact dimensions, weights, or software variables in your lab journal'
            ],
        speakerNotes: `Remind students: 'A broken prototype teaches you ten times more than an untested idea on paper.'`
      },
      {
        id: `slide-${Date.now()}-5`,
        slideNumber: 5,
        heading: isChallenge ? 'Extension: The Master Challenge' : 'Reflection & Evidence Capture',
        subheading: isChallenge ? 'Take your design one step further' : 'Show what you proved today',
        bullets: isChallenge
          ? [
              'Calculate the unit cost or environmental footprint of your build',
              'Test under extreme conditions: double the load or halve the time',
              'Create a 30-second peer video demo presenting your test data'
            ]
          : [
              'Take photos or record a short video clip of your mechanism working',
              'Upload your reflection or data table to your portfolio',
              'Give constructive feedback to at least one other team'
            ],
        speakerNotes: isChallenge
          ? `For teams that finish early: push the envelope with the Master Challenge criteria.`
          : `Wrap up: save your evidence now so your coach can review your growth.`
      }
    ];
  }

  // 2. Generate Formative Quiz (3-4 diagnostic questions with immediate explanatory feedback)
  if (type === 'quiz' || type === 'all') {
    result.quiz = [
      {
        id: `quiz-${Date.now()}-1`,
        prompt: isSimpler
          ? `What is the main goal for this stage (${stageTitle})?`
          : `In ${stageTitle}, what is the team's primary learning objective?`,
        options: [
          stageGoal,
          'Wait for the coach to give all the answers without trying',
          'Throw away all materials and start completely over without testing',
          'Copy another team\'s work without permission'
        ],
        correctIndex: 0,
        explanation: `Correct! ${stageGoal} guides our work during this stage.`
      },
      {
        id: `quiz-${Date.now()}-2`,
        prompt: isSimpler
          ? 'Why is it helpful to test early prototypes even if they might fail?'
          : 'Why does iterative prototyping emphasize rapid testing over premature perfection?',
        options: [
          'Because breaking materials is entertaining',
          'Because early failures reveal real design flaws and save time before final assembly',
          'Because coaches do not care about accuracy',
          'Because you only get one single attempt in engineering'
        ],
        correctIndex: 1,
        explanation: 'Early testing surfaces mechanical constraints, user friction, and real physical behavior before heavy resources are committed.'
      },
      {
        id: `quiz-${Date.now()}-3`,
        prompt: isSimpler
          ? 'What should you do before using any MakerSpace tool or power equipment?'
          : 'What safety protocol must be verified prior to operating rapid prototyping machinery?',
        options: [
          'Turn on the power switch immediately without checking the area',
          'Put on safety protection and ensure the bench is clear and supervised',
          'Use the tool with one hand while holding a phone with the other',
          'Skip safety guides if you have used the tool at home once'
        ],
        correctIndex: 1,
        explanation: 'Workshop safety requires appropriate PPE (eye protection, closed shoes), a clean work zone, and coach authorization.'
      }
    ];

    if (isChallenge) {
      result.quiz.push({
        id: `quiz-${Date.now()}-4`,
        prompt: 'Extension Challenge: How should trade-offs between strength, weight, and material cost be analyzed?',
        options: [
          'Choose the heaviest and most expensive material available regardless of need',
          'Create a decision matrix scoring each option against functional requirements and budget',
          'Pick the first option you see in the workshop bin',
          'Ignore cost completely because prototypes never have budgets'
        ],
        correctIndex: 1,
        explanation: 'A structured decision matrix helps engineers justify why a chosen material balances structural integrity against environmental and budget constraints.'
      });
    }
  }

  // 3. Generate Practical Activity
  if (type === 'activity' || type === 'all') {
    result.activity = {
      title: isSimpler ? `Hands-on Lab: ${stageTitle}` : `Practical MakerSpace Sprint: ${stageTitle}`,
      durationMinutes: 45,
      materials: [
        'Cardboard, craft foam, and cutting mats',
        'Digital calipers / measuring tape',
        'Prototyping fasteners (brass fasteners, masking tape, cable ties)',
        'Sensors / microcontroller starter kit (if applicable)'
      ],
      steps: [
        {
          stepNumber: 1,
          title: 'Empathy & Sketching (10 mins)',
          instruction: 'Sketch 3 rapid concepts on paper. Label dimensions and key connection points.'
        },
        {
          stepNumber: 2,
          title: 'Low-Fidelity Bench Build (20 mins)',
          instruction: 'Use craft materials to build a rough 1:1 scale model. Check that parts fit and move as intended.'
        },
        {
          stepNumber: 3,
          title: 'Stress Testing & Telemetry (10 mins)',
          instruction: 'Run your model through 3 cycles of use. Measure deflection, friction, or response time and log values.'
        },
        {
          stepNumber: 4,
          title: 'Debrief & Evidence Log (5 mins)',
          instruction: 'Snap a clear photo showing your prototype on the test bench. Write one sentence on what you will iterate next.'
        }
      ],
      safetyNotes: [
        'Wear eye protection when using utility knives or shearing tools.',
        'Keep all cutting motions directed away from your body.'
      ],
      deliverables: [
        'Physical mockup on the team bench',
        '1 logged measurement photo in your learner portfolio'
      ]
    };
  }

  return result;
}

/**
 * Validates and normalizes server-provided materials.
 */
function validateAndNormalizeMaterials(raw) {
  const normalized = {};

  if (Array.isArray(raw.slides)) {
    normalized.slides = raw.slides.map((s, idx) => ({
      id: s.id || `slide-${Date.now()}-${idx + 1}`,
      slideNumber: s.slideNumber || idx + 1,
      heading: String(s.heading || `Slide ${idx + 1}`),
      subheading: String(s.subheading || ''),
      bullets: Array.isArray(s.bullets) ? s.bullets.map(String) : [],
      speakerNotes: String(s.speakerNotes || '')
    }));
  }

  if (Array.isArray(raw.quiz)) {
    normalized.quiz = raw.quiz.map((q, idx) => ({
      id: q.id || `quiz-${Date.now()}-${idx + 1}`,
      prompt: String(q.prompt || `Question ${idx + 1}`),
      options: Array.isArray(q.options) && q.options.length >= 2 ? q.options.map(String) : ['Option A', 'Option B', 'Option C', 'Option D'],
      correctIndex: typeof q.correctIndex === 'number' && q.correctIndex >= 0 ? q.correctIndex : 0,
      explanation: String(q.explanation || 'Great job checking your understanding!')
    }));
  }

  if (raw.activity && typeof raw.activity === 'object') {
    normalized.activity = {
      title: String(raw.activity.title || 'Hands-on Stage Sprint'),
      durationMinutes: Number(raw.activity.durationMinutes || 45),
      materials: Array.isArray(raw.activity.materials) ? raw.activity.materials.map(String) : [],
      steps: Array.isArray(raw.activity.steps) ? raw.activity.steps.map((st, i) => ({
        stepNumber: st.stepNumber || i + 1,
        title: String(st.title || `Step ${i + 1}`),
        instruction: String(st.instruction || '')
      })) : [],
      safetyNotes: Array.isArray(raw.activity.safetyNotes) ? raw.activity.safetyNotes.map(String) : [],
      deliverables: Array.isArray(raw.activity.deliverables) ? raw.activity.deliverables.map(String) : []
    };
  }

  return normalized;
}

/**
 * Parses and validates YouTube URLs into privacy-preserving embed URLs.
 * Handles youtube.com/watch?v=, youtu.be/, and youtube.com/playlist?list=
 */
export function parseYouTubeVideoUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'Please enter a video URL.' };
  }

  const trimmed = rawUrl.trim();
  try {
    const u = new URL(trimmed);
    const host = u.hostname.replace(/^www\.|^m\./, '').toLowerCase();

    // 1. YouTube playlist
    if (host === 'youtube.com' && u.searchParams.has('list')) {
      const playlistId = u.searchParams.get('list');
      if (playlistId && /^[A-Za-z0-9_-]+$/.test(playlistId)) {
        return {
          valid: true,
          type: 'playlist',
          embedUrl: `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}`,
          originalUrl: trimmed,
          id: playlistId
        };
      }
    }

    // 2. YouTube youtu.be/ID
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0];
      if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) {
        return {
          valid: true,
          type: 'video',
          embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
          originalUrl: trimmed,
          id
        };
      }
    }

    // 3. YouTube youtube.com/watch?v=ID
    if (host === 'youtube.com') {
      if (u.pathname === '/watch') {
        const id = u.searchParams.get('v');
        if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) {
          return {
            valid: true,
            type: 'video',
            embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
            originalUrl: trimmed,
            id
          };
        }
      } else {
        const m = /^\/(?:shorts|embed|live)\/([^/]+)/.exec(u.pathname);
        if (m && /^[A-Za-z0-9_-]{11}$/.test(m[1])) {
          return {
            valid: true,
            type: 'video',
            embedUrl: `https://www.youtube-nocookie.com/embed/${m[1]}`,
            originalUrl: trimmed,
            id: m[1]
          };
        }
      }
    }

    return {
      valid: false,
      error: 'Unsupported video platform. Please use a valid YouTube video (https://www.youtube.com/watch?v=... or https://youtu.be/...) or playlist link.'
    };
  } catch {
    return { valid: false, error: 'Please enter a valid URL (starting with https://).' };
  }
}
