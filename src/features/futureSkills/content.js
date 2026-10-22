/**
 * Copy for the learner's Future Skills page (#/future-skills).
 *
 * Written to the learner ("you"), not to parents: it explains the seven
 * skills and how the design thinking phases and AI build them. No calls to
 * action. The design thinking phases and the AI rules are NOT repeated here:
 * the page reads PHASES and AI_PRINCIPLES from features/pbl/content/pblModel.js,
 * so it always says the same thing as PBL Studio.
 */

/**
 * The seven Future Skills. `phases` are the design thinking phase ids
 * (pblModel PHASES) where a learner builds the skill most. `tryIt` shows good
 * AI use; it is for learners aged 13+, or younger learners with their coach.
 */
export const SKILLS = [
  {
    id: 'critical-thinking',
    icon: 'Brain',
    name: 'Critical thinking',
    tagline: 'Question everything, including the AI.',
    why: 'AI answers can sound sure of themselves even when they are wrong. Critical thinking is checking a claim, weighing the evidence and changing your mind when the evidence says so. It keeps you in charge of the tools you use.',
    kids: 'Spot which of three “facts” about an animal is the made-up one, and explain how you could check.',
    teens: 'Test an AI’s claim about solar panel output against your own measurements, then decide who was right and why.',
    tryIt: 'Give me three facts about how plants move water. Make one of them wrong on purpose. Don’t tell me which one. I’ll find it and explain how I checked.',
    phases: ['define', 'test']
  },
  {
    id: 'creative-problem-solving',
    icon: 'Lightbulb',
    name: 'Creative problem-solving',
    tagline: 'Many ideas first, then the best one.',
    why: 'AI can list ideas in seconds. The creative part is yours: choosing the idea that fits your problem, combining two into something new, and making it better after it doesn’t work the first time.',
    kids: 'Design a bird feeder that squirrels can’t reach. Draw three versions, then build the best one from card and string.',
    teens: 'Sketch eight ideas in eight minutes, use AI to find the weak spot in your favourite, then prototype a better version.',
    tryIt: 'Here is my idea: [your idea]. Don’t improve it for me. Ask me three questions that would help me find its weakest part.',
    phases: ['ideate', 'prototype']
  },
  {
    id: 'ai-data-literacy',
    icon: 'Cpu',
    name: 'AI and data literacy',
    tagline: 'Know how the tools work, and when not to use them.',
    why: 'AI learns from data, so it can repeat the mistakes and unfairness in that data. When you understand data, models and their limits, you stop being just a user and start being a designer.',
    kids: 'Sort pictures into “cat” and “not cat” to teach a pretend robot, then find a picture that would fool it.',
    teens: 'Build a simple computer model of air pollution, compare its predictions with real readings, and explain where it goes wrong.',
    tryIt: 'Explain how you came up with your last answer, in steps a 14-year-old can follow. Which step are you least sure about?',
    phases: ['explore', 'prototype', 'test']
  },
  {
    id: 'communication',
    icon: 'Megaphone',
    name: 'Communication and storytelling',
    tagline: 'Make your ideas land.',
    why: 'A great idea only changes something when other people understand it. Explaining clearly, to the right audience, in your own voice, is a skill no tool can perform for you.',
    kids: 'Explain your project in one minute to a younger child, using one drawing and no hard words.',
    teens: 'Present your project to a real audience. Use AI as a rehearsal partner that asks the hard questions first.',
    tryIt: 'I’m going to present my project to parents and teachers. Ask me the five toughest questions they might ask, one at a time, and wait for my answer each time.',
    phases: ['share']
  },
  {
    id: 'collaboration-empathy',
    icon: 'HeartHandshake',
    name: 'Collaboration and empathy',
    tagline: 'Build with people, for people.',
    why: 'AI doesn’t know the people around you. Listening to the people a problem affects, and working well with your team, is how your project ends up helping someone real.',
    kids: 'Ask someone at home about a small problem they have every day, then draw what they told you.',
    teens: 'Run three empathy interviews, find what surprised you, and agree a plan with your team.',
    tryIt: 'Help me write five open questions for an interview about getting around town. No yes-or-no questions, and nothing personal.',
    phases: ['empathise', 'test']
  },
  {
    id: 'self-direction',
    icon: 'Mountain',
    name: 'Self-direction and resilience',
    tagline: 'Set your own goals. Bounce back.',
    why: 'When answers are easy to find, what makes the difference is you: setting a goal, sticking with it, and trying again after something breaks. Every bug you fix and every redesign builds this skill.',
    kids: 'Pick one tiny daily habit, tick it off each day for a week, and notice what made it easier.',
    teens: 'Plan a two-week sprint with one big goal and small steps, then write what you’d change after a setback.',
    tryIt: 'My goal is [your goal]. Break it into five small steps I could each finish in under 30 minutes. Ask me which one I want to start with.',
    phases: ['define', 'prototype']
  },
  {
    id: 'ethics-citizenship',
    icon: 'ShieldCheck',
    name: 'Ethics and digital citizenship',
    tagline: 'Use technology to do good, and stay safe.',
    why: 'Being honest about how you used AI, protecting people’s privacy and asking “is this fair?” are what make your work trustworthy. Your AI log is where you practise this every week.',
    kids: 'Decide with your group: is it OK to share a photo of a friend online without asking? Why or why not?',
    teens: 'Write an “AI use statement” for your project: what you used AI for, what you did yourself, and how you checked it.',
    tryIt: 'Here is how I used AI in my project: [describe it]. Help me write an honest two-sentence statement saying what I did myself and what the AI did.',
    phases: ['empathise', 'share']
  }
];

/** How a learner can see their skills growing. Each item names something the product has. */
export const GROWTH = [
  {
    title: 'Your evidence portfolio',
    body: 'In PBL Studio you collect notes, photos, code, data, feedback, AI logs and reflections as you go. Each piece is tagged to a school competency, so you can see what you are building and where the gaps are.'
  },
  {
    title: 'Your goals and daily habits',
    body: 'On Goal setting you choose one focus skill at a time and a tiny daily habit. The dots for the last seven days show your streak.'
  },
  {
    title: 'Feedback from your coach and classmates',
    body: 'Every phase names the competencies your coach looks for. Log the feedback you get, and what you changed because of it.'
  },
  {
    title: 'Your showcase',
    body: 'Every project ends by presenting to a real audience. Looking back at what you made, and how, shows how far each skill has come.'
  }
];
