/**
 * WeLearn PBL programme: the term project, as content.
 *
 * One termly theme. Learners EXPLORE it through the STEAM activities (assessed
 * against NGSS - see steamNgss.js), then run their own Design Thinking project
 * on a problem they care about, collecting evidence as they go, and finish with
 * a showcase or a presentation. The project phases are assessed against the
 * school's competencies (competencies.js), not NGSS.
 *
 * This is content, not code: when the Phase 2 content model lands, TERM and
 * PHASES become Firestore documents a coordinator edits, and nothing that
 * reads them changes shape.
 */

/**
 * The current term. Placeholder until the school sets the real theme - the
 * page labels it as such (`draft: true`) rather than presenting it as decided.
 */
export const TERM = {
  id: 'term-2026-t3',
  label: 'Term 3, 2026',
  weeks: 12,
  draft: true,
  theme: 'Sustainable Futures',
  drivingQuestion: 'How might we use STEAM to make life better for people and the planet around us?',
  intro: 'Every term has one big theme. You explore it through hands-on STEAM activities, then you choose a real problem inside it that YOU care about - one that affects people or the environment - and design, build and program a solution, with AI writing code alongside you. You collect evidence the whole way, and at the end of the term you show what you made.'
};

/**
 * Every project must make something better for people, the environment, or
 * both. The learner names which, and how they will measure the difference.
 */
export const IMPACT = [
  { id: 'people', label: 'People', hint: 'health, safety, access, learning, community' },
  { id: 'environment', label: 'Environment', hint: 'energy, water, waste, air, plants and animals' },
  { id: 'both', label: 'People and environment', hint: 'a problem that touches both' }
];

/** Languages the co-pilot writes, matched to the school's kit. */
export const CODE_LANGUAGES = [
  { id: 'micropython', label: 'micro:bit MicroPython' },
  { id: 'makecode', label: 'micro:bit MakeCode (JavaScript)' },
  { id: 'python', label: 'Python' },
  { id: 'arduino', label: 'Arduino (C++)' },
  { id: 'lego', label: 'LEGO (EV3 / WeDo, Python)' }
];

/** What learners can start from. Interests make the problem theirs. */
export const INTERESTS = [
  'Sport and fitness', 'Music', 'Games', 'Animals', 'Food', 'Fashion', 'Health',
  'Environment', 'Transport', 'Art and design', 'Space', 'Robots', 'Water', 'My community'
];

/**
 * The phases, in order. `weeks` is inclusive and relative to the term.
 * `competencies` are the school competencies a coach looks for in this phase;
 * `stretch` are the advanced ones a learner can aim for.
 */
export const PHASES = [
  {
    id: 'explore',
    title: 'Explore',
    strap: 'STEAM activities',
    weeks: [1, 3],
    goal: 'Build the science, maths and making skills the theme needs, and notice what interests you.',
    tasks: [
      'Complete at least two STEAM activities in the Explore list.',
      'Write down three "sparks": things that surprised you or that you want to know more about.',
      'Note one skill from each activity you could use in your own project (a sensor, a formula, a way to test).'
    ],
    evidence: ['A spark list', 'A screenshot or photo from an activity', 'One result from an activity and what it means'],
    ai: [
      'Explain the science behind something that surprised me in the activity, in simple words.',
      'Give me three real-world problems connected to what I just explored.',
      'Quiz me with five questions on this activity so I can check I understand it.'
    ],
    competencies: ['sdl-05', 'ctps-01', 'ctps-03', 'ctps-05', 'ct-05'],
    stretch: ['ct-11']
  },
  {
    id: 'empathise',
    title: 'Empathise',
    strap: 'Find a real problem',
    weeks: [3, 4],
    goal: 'Start from something you are interested in and find the people it affects. Listen before you design.',
    tasks: [
      'Pick one or two interests and connect them to the term theme.',
      'Talk to at least two people the problem affects (a classmate, family member, teacher, or someone in the community).',
      'Record what they said, what they do, and what frustrates them.'
    ],
    evidence: ['Interview notes or quotes', 'An observation (photo or notes)', 'A simple empathy map: says, thinks, does, feels'],
    ai: [
      'Help me write six open interview questions about [my topic] that are not leading.',
      'I interviewed people and heard these things: [paste notes]. What patterns do you see? Do not decide for me.',
      'What might I be assuming about the people I am designing for?'
    ],
    competencies: ['ec-05', 'sea-10', 'ctps-01', 'sea-12'],
    stretch: ['ent-01', 'ec-06']
  },
  {
    id: 'define',
    title: 'Define',
    strap: 'Say exactly what you will solve',
    weeks: [4, 5],
    goal: 'Turn what you learned into one clear problem statement and decide how you will know you succeeded.',
    tasks: [
      'Write a "How might we..." problem statement.',
      'List who it is for, and why it matters to them.',
      'Say who benefits - people, the environment, or both - and how you will measure the difference.',
      'Set success criteria you can measure, and your constraints (time, materials, cost, safety).'
    ],
    evidence: ['Your How-might-we statement', 'Success criteria and constraints', 'Your goal for the term with steps'],
    ai: [
      'Here is my problem statement: [paste]. Is it too broad or too narrow? Ask me questions to sharpen it.',
      'Suggest ways I could MEASURE whether my solution works for [problem].',
      'What constraints might I be forgetting for this kind of project?'
    ],
    competencies: ['ctps-09', 'ctps-10', 'sdl-01', 'ec-04'],
    stretch: ['ctps-06']
  },
  {
    id: 'ideate',
    title: 'Ideate and plan',
    strap: 'Many ideas, one plan',
    weeks: [5, 6],
    goal: 'Generate lots of ideas, pick the strongest with reasons, then plan the build with AI as your co-pilot.',
    tasks: [
      'Sketch or list at least eight ideas before judging any of them.',
      'Choose one idea and explain why, using your success criteria.',
      'Use AI to turn it into a week-by-week plan: tasks, materials, who does what, and which code you will need.'
    ],
    evidence: ['Idea sketches or list', 'Decision with reasons', 'Your project plan and timeline', 'An AI log entry for your plan'],
    ai: [
      'I want to build [idea] to solve [problem]. Break it into weekly tasks for the next six weeks.',
      'What materials and components would I need? I have access to micro:bit, sensors, servos and LEGO kits.',
      'Compare these two ideas against my success criteria: [paste]. Which risks does each have?',
      'Write pseudocode for what my device needs to do, step by step.'
    ],
    competencies: ['ctps-11', 'ct-02', 'sdl-02', 'lc-05', 'lc-01'],
    stretch: ['ct-06', 'ct-09']
  },
  {
    id: 'prototype',
    title: 'Prototype',
    strap: 'Build and program it',
    weeks: [6, 9],
    goal: 'Build a working version and program it. The AI co-pilot writes code with you - you test it, change it, and make sure you understand every line.',
    tasks: [
      'Build a first rough version quickly, then improve it.',
      'Write the code with AI help - then test it, and explain what each part does in your own words.',
      'Save each version: what changed and why.'
    ],
    evidence: ['Photos or video of each version', 'Your code, with your own comments', 'A debugging story: the bug, what you tried, the fix', 'AI log entries'],
    ai: [
      'Write code for my prototype that [reads this sensor / moves this motor / shows this]. Comment every line.',
      'Add a feature to my code: [describe it]. Here is my code: [paste].',
      'My code gives this error: [paste error and code]. Explain what it means before you fix it.',
      'Explain this code line by line as if I am new to programming: [paste].',
      'How could I make my prototype stronger / cheaper / more accurate?'
    ],
    competencies: ['ct-03', 'ct-05', 'ctps-05', 'ctps-12', 'sdl-03', 'lc-04'],
    stretch: ['ct-10', 'ct-04']
  },
  {
    id: 'test',
    title: 'Test and improve',
    strap: 'Prove it works',
    weeks: [9, 11],
    goal: 'Test against your success criteria with real data and real users, then improve it.',
    tasks: [
      'Run tests and record the numbers - at least three trials for anything you measure.',
      'Ask the people you interviewed to try it, and write down their feedback.',
      'Make at least one improvement based on the evidence and test again.'
    ],
    evidence: ['A results table or graph', 'User feedback', 'Before-and-after of an improvement', 'Reflection: what went wrong and what you learned'],
    ai: [
      'Here are my test results: [paste]. Help me make a table and tell me what pattern you see - then I will check it.',
      'Is my test fair? What variables should I keep the same?',
      'Suggest three improvements based on this feedback: [paste].'
    ],
    competencies: ['ctps-03', 'ctps-02', 'lc-02', 'ct-12', 'sea-04'],
    stretch: ['ctps-07', 'sdl-09']
  },
  {
    id: 'share',
    title: 'Showcase or present',
    strap: 'Tell the story',
    weeks: [11, 12],
    goal: 'Show what you made and the journey behind it, backed by your evidence.',
    tasks: [
      'Choose: a showcase (live demo at a stand) or a presentation (talk with slides).',
      'Tell the story: the problem, the people, your ideas, your builds, your data, what you would do next.',
      'Explain honestly how you used AI and what you did yourself.',
      'Reflect on which competencies you grew and which evidence proves it.'
    ],
    evidence: ['Slides, poster or demo plan', 'A rehearsal and the feedback you got', 'Final reflection'],
    ai: [
      'Help me structure a five-minute talk about my project: problem, process, result, next steps.',
      'Act as a judge and ask me five hard questions about my project so I can practise.',
      'Give feedback on my poster text: is it clear to someone who knows nothing about it? [paste]'
    ],
    competencies: ['ec-11', 'ec-03', 'ec-02', 'ec-12', 'sdl-04', 'ctps-04'],
    stretch: ['ec-07', 'ec-09', 'ct-08', 'ctps-08', 'ent-07']
  }
];

export const phaseById = (id) => PHASES.find((p) => p.id === id) || null;

/** Kinds of evidence a learner can log. `ai` entries carry the AI-use record. */
export const EVIDENCE_KINDS = [
  { id: 'note', label: 'Note or observation' },
  { id: 'media', label: 'Photo / video link' },
  { id: 'code', label: 'Code' },
  { id: 'data', label: 'Data or results' },
  { id: 'feedback', label: 'Feedback I received' },
  { id: 'ai', label: 'AI log' },
  { id: 'reflection', label: 'Reflection' }
];

/** How we ask learners to work with AI. Shown on the approach page and in the co-pilot. */
export const AI_PRINCIPLES = [
  { title: 'You are the designer, AI is your co-pilot', body: 'Use AI to plan, research, write and fix code, and practise your talk. The decisions and the ideas are yours.' },
  { title: 'Understand every line', body: 'AI can write your code. Run it on the real device, test it, change it, and be ready to explain what each part does. Code you cannot explain is not finished.' },
  { title: 'Aim it at a real need', body: 'Use AI to help people or the environment. Every project names who or what benefits, and measures whether it worked.' },
  { title: 'Log it', body: 'Add an AI log entry when AI helped: what you asked, what it gave you, and what you kept, changed or rejected. Good AI use is evidence, not cheating.' },
  { title: 'Check it', body: 'AI can be confidently wrong. Check facts against a second source and test claims with your own data.' },
  { title: 'Keep private things private', body: 'Never put names, photos, addresses or anything personal about you or the people you interview into an AI.' }
];

/** The philosophy, for the "Our approach" page. */
export const APPROACH = [
  { title: 'Learning starts from a real problem', body: 'Learners find problems in things they already care about. Owning the problem is what makes them persist through a whole term of design, failure and redesign.' },
  { title: 'Explore first, then design', body: 'STEAM activities come first. They are short, hands-on investigations assessed against NGSS three-dimensional rubrics, and they give learners the science, maths and making skills their projects need.' },
  { title: 'Design Thinking gives the project its shape', body: 'Empathise, Define, Ideate, Prototype, Test, Share. Each phase has clear tasks, clear evidence, and named school competencies that coaches look for.' },
  { title: 'AI writes code, learners solve real problems', body: 'Learners use AI to plan, research and write the code for real devices that help people or the environment. We assess the problem-solving, the testing, the impact and the understanding - not whether a line was typed by hand.' },
  { title: 'Evidence all the way', body: 'Learners build a portfolio as they go: notes, code, data, feedback, AI logs and reflections, each tagged to a competency. The end of term is a celebration of that evidence, not a single test.' },
  { title: 'Finish in public', body: 'Every project ends in a showcase or a presentation to a real audience, so communication and reflection are part of the work, not an afterthought.' }
];
