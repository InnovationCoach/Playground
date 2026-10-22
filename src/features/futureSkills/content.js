/**
 * Copy for the Future Skills page (#/future-skills).
 *
 * Every claim about how WeLearn uses AI must stay true of the product:
 * - the PBL co-pilot gives hints and asks questions, it does not write a
 *   learner's code or answers (features/pbl, tutor rules);
 * - primary learners (under 13) get no AI chatbot and no voice input;
 * - messages are monitored for safeguarding; coaches see goals and evidence;
 * - the Goals page never asks for a diagnosis.
 * If one of those changes, change this file.
 */
import { hrefFor } from '../../app/routes.js';

export const VIDEO = {
  src: 'https://res.cloudinary.com/dkplz6vbx/video/upload/q_auto/v1792647617/mani_showcase_cta_djybix.mp4',
  poster: 'https://res.cloudinary.com/dkplz6vbx/video/upload/so_3,w_900,h_900,c_fill,q_auto,f_jpg/v1792647617/mani_showcase_cta_djybix.jpg',
  speaker: 'Mani Golzaridodavan',
  length: '0:54'
};

/** Worries people raise about AI in school, and what we do about each. */
export const WORRIES = [
  {
    worry: '“Children will let AI do the work.”',
    answer: 'Here, the AI co-pilot asks questions and gives hints. It doesn’t write a learner’s code or answers. Every decision, sketch and prototype is theirs, and they show the evidence.'
  },
  {
    worry: '“AI makes things up.”',
    answer: 'Sometimes it does, and that is exactly why we teach learners to check it: compare sources, test a claim against their own measurements, and say how sure they are.'
  },
  {
    worry: '“Screens will replace people.”',
    answer: 'AI takes care of the busywork so there is more time for what matters: building with their hands, testing ideas with real people, and presenting to a real audience with their coach and team.'
  }
];

/**
 * The seven Future Skills. `tryIt` is a prompt that shows good AI use; it is
 * for learners aged 13+, or younger children with their coach.
 */
export const SKILLS = [
  {
    id: 'critical-thinking',
    icon: 'Brain',
    name: 'Critical thinking',
    tagline: 'Question everything, including the AI.',
    why: 'AI answers sound confident even when they are wrong. Knowing how to check a claim, weigh evidence and change your mind is the skill that keeps a person in charge of the tool.',
    kids: 'Spot which of three “facts” about an animal is the made-up one, and explain how you could check.',
    teens: 'Test an AI’s claim about solar panel output against your own measurements, then decide who was right and why.',
    tryIt: 'Give me three facts about how plants move water. Make one of them wrong on purpose. Don’t tell me which one. I’ll find it and explain how I checked.',
    where: { label: 'Solar Car Challenge', href: () => hrefFor.pbl('explore') }
  },
  {
    id: 'creative-problem-solving',
    icon: 'Lightbulb',
    name: 'Creative problem-solving',
    tagline: 'Many ideas first, then the best one.',
    why: 'AI can list ideas in seconds. Choosing the right one, combining two into something new, and improving it after it fails is human, creative work.',
    kids: 'Design a bird feeder that squirrels can’t reach. Draw three versions, then build the best one from card and string.',
    teens: 'Sketch eight ideas in eight minutes, use AI to find the weak spot in your favourite, then prototype a better version.',
    tryIt: 'Here is my idea: [your idea]. Don’t improve it for me. Ask me three questions that would help me find its weakest part.',
    where: { label: 'PBL Studio: Ideate', href: () => hrefFor.pbl() }
  },
  {
    id: 'ai-data-literacy',
    icon: 'Cpu',
    name: 'AI and data literacy',
    tagline: 'Know how the tools work, and when not to use them.',
    why: 'AI learns from data, so it can repeat the mistakes and unfairness in that data. Understanding data, models and limits turns a user into a thoughtful designer.',
    kids: 'Sort pictures into “cat” and “not cat” to teach a pretend robot, then find a picture that would fool it.',
    teens: 'Build a simple computer model of air pollution, compare its predictions with real readings, and explain where it goes wrong.',
    tryIt: 'Explain how you came up with your last answer, in steps a 14-year-old can follow. Which step are you least sure about?',
    where: { label: 'Activity 6: SO₂ model', href: () => '#/courses' }
  },
  {
    id: 'communication',
    icon: 'Megaphone',
    name: 'Communication and storytelling',
    tagline: 'Make your ideas land.',
    why: 'Great ideas only change things when other people understand them. Explaining clearly, to the right audience, in your own voice, is something no tool can do for you.',
    kids: 'Explain your project in one minute to a younger child, using one drawing and no hard words.',
    teens: 'Pitch your project to a real audience. Use AI as a rehearsal partner that asks the hard questions first.',
    tryIt: 'I’m going to pitch my project to parents and teachers. Ask me the five toughest questions they might ask, one at a time, and wait for my answer each time.',
    where: { label: 'PBL Studio: Share', href: () => hrefFor.pbl() }
  },
  {
    id: 'collaboration-empathy',
    icon: 'HeartHandshake',
    name: 'Collaboration and empathy',
    tagline: 'Build with people, for people.',
    why: 'AI doesn’t know your community. Listening to the people a problem affects, and working well in a team, is how projects end up helping someone real.',
    kids: 'Interview someone at home about a small daily problem, then draw what they told you.',
    teens: 'Run three empathy interviews, find what surprised you, and agree a plan with your team in your class chat.',
    tryIt: 'Help me write five open questions for an interview with an elderly neighbour about getting around town. No yes-or-no questions.',
    where: { label: 'Messages: class chat', href: () => hrefFor.messages() }
  },
  {
    id: 'self-direction',
    icon: 'Mountain',
    name: 'Self-direction and resilience',
    tagline: 'Set your own goals. Bounce back.',
    why: 'When answers are easy to find, what makes the difference is motivation: setting a goal, sticking with it, and trying again after something doesn’t work.',
    kids: 'Pick one tiny daily habit, tick it off each day for a week, and notice what made it easier.',
    teens: 'Plan a two-week sprint with one big goal and small steps, then write what you’d change after a setback.',
    tryIt: 'My goal is [your goal]. Break it into five small steps I could each finish in under 30 minutes. Ask me which one I want to start with.',
    where: { label: 'Goal setting', href: () => hrefFor.goals() }
  },
  {
    id: 'ethics-citizenship',
    icon: 'ShieldCheck',
    name: 'Ethics and digital citizenship',
    tagline: 'Use technology to do good, and stay safe.',
    why: 'Being honest about when you used AI, protecting people’s privacy and asking “is this fair?” are what make technology trustworthy.',
    kids: 'Decide together: is it OK to share a photo of a friend online without asking? Why or why not?',
    teens: 'Write an “AI use statement” for your project: what you used AI for, what you did yourself, and how you checked it.',
    tryIt: 'Here is how I used AI in my project: [describe it]. Help me write an honest two-sentence statement saying what I did myself and what the AI did.',
    where: { label: 'Community', href: () => hrefFor.community() }
  }
];

/** Promises about AI on WeLearn. Keep each one true of the product. */
export const PROMISES = [
  { title: 'Hints, not answers', body: 'The AI co-pilot asks questions and nudges. It won’t write a learner’s code or do their project.' },
  { title: 'Younger children, grown-up help', body: 'Learners under 13 don’t use the AI chatbot on their own and never use voice input.' },
  { title: 'A real person in the loop', body: 'Coaches see goals, evidence and progress, so no one learns alone with a machine.' },
  { title: 'Safe conversations', body: 'Messages can be reviewed by WeLearn staff to keep everyone safe.' },
  { title: 'Strengths first', body: 'We ask what a learner is great at and what helps them. We never ask for a diagnosis.' }
];

/** Conversation starters for families. */
export const AT_HOME = [
  'What did you ask an AI this week, and how did you know if its answer was right?',
  'Which part of your project did you do completely by yourself?',
  'What went wrong this week, and what did you try next?'
];
