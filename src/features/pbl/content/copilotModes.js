import { CODE_LANGUAGES } from './pblModel.js';

/**
 * What the AI co-pilot is for in each Design Thinking phase, and the starter
 * prompts it offers. Pure, unit-tested in tests/pbl-studio-p0.test.jsx. Starters
 * are ready to send: they use the learner's own words where there are any, and
 * never ask them to fill in a blank.
 */
const CODE_BUDDY = {
  id: 'code', label: 'Code buddy', usesCode: true,
  about: 'Ask for code for your prototype. Test it on the real device, change it, then explain it back.',
  guidance: 'Mode: code buddy. Write or debug code in small steps, comment each line, and ask them to test it and explain it back.'
};

export const COPILOT_MODES = {
  explore: {
    id: 'explain', label: 'Explain / Quiz me', usesCode: false,
    about: 'Ask it to explain what you found, or to quiz you on it.',
    guidance: 'Mode: explain and quiz. Explain ideas in simple words and ask questions to check understanding. Do not write code.'
  },
  empathise: {
    id: 'interview', label: 'Interview helper', usesCode: false,
    about: 'Get help asking good questions and spotting patterns in what people tell you.',
    guidance: 'Mode: interview helper. Help them ask open questions and notice patterns and assumptions. Do not write code or decide for them.'
  },
  define: {
    id: 'problem', label: 'Problem sharpener', usesCode: false,
    about: 'Turn what you learned into one clear problem you can solve.',
    guidance: 'Mode: problem sharpener. Question their problem statement until it is clear and measurable. Do not write code or choose the problem for them.'
  },
  ideate: {
    id: 'ideas', label: 'Idea generator', usesCode: false,
    about: 'Get lots of ideas, then compare them. You choose.',
    guidance: 'Mode: idea generator. Offer varied ideas and ways to compare them. Do not write code or pick the idea for them.'
  },
  prototype: CODE_BUDDY,
  test: CODE_BUDDY,
  share: {
    id: 'pitch', label: 'Pitch coach', usesCode: false,
    about: 'Practise telling people what you made and why it matters.',
    guidance: 'Mode: pitch coach. Help them practise explaining their project and answering questions. Do not write code or write the pitch for them.'
  }
};

export const copilotMode = (phaseId) => COPILOT_MODES[phaseId] || COPILOT_MODES.explore;

/** A learner's text, safe to place inside a sentence: one line, short, no square brackets. */
const clean = (text, max = 110) => {
  const line = String(text || '').replace(/[[\]]/g, '').replace(/\s+/g, ' ').trim();
  return line.length > max ? `${line.slice(0, max).trim()}…` : line;
};

/** Their most recent spark: the last line they wrote. */
export function latestSpark(project) {
  const lines = String(project?.sparks || '').split('\n').map((line) => line.replace(/^[\s*•-]+/, '')).filter((line) => line.trim());
  return clean(lines[lines.length - 1]);
}

export function starterPrompts(phaseId, project) {
  const spark = latestSpark(project);
  const interest = clean(project?.interests?.[0]).toLowerCase();
  const problem = clean(project?.problem?.hmw);
  const topic = problem || interest;
  const language = CODE_LANGUAGES.find((item) => item.id === project?.codeLanguage)?.label || 'my';
  switch (phaseId) {
    case 'empathise': return [
      topic ? `Help me write six open interview questions about this, without leading people: ${topic}` : 'Help me write six open interview questions about a problem I care about, without leading people.',
      'What might I be assuming about the people I am designing for?',
      'What should I listen for when someone tells me about a problem?'
    ];
    case 'define': return [
      problem ? `Is this problem clear enough? Ask me questions to sharpen it: ${problem}` : 'Help me turn what I learned into one clear "How might we" question.',
      'How could I tell if my solution really worked?',
      'What would make my problem too big to solve this term?'
    ];
    case 'ideate': return [
      topic ? `Give me ten different ideas for this, including some unusual ones: ${topic}` : 'Give me ten different ways to start thinking of ideas, including some unusual ones.',
      'Help me compare my two favourite ideas. Do not choose for me.',
      'What is the cheapest way to try out my idea this week?'
    ];
    case 'prototype': return [
      `Write commented ${language} code for the first small part of my prototype, then ask me to test it.`,
      'My code is not working. Help me find the bug one step at a time.',
      'Break my prototype into three small parts I can build one at a time.'
    ];
    case 'test': return [
      topic ? `Help me plan a fair test for this: ${topic}` : 'Help me plan a fair test for my prototype.',
      'My test did not go as I expected. Help me work out why, one step at a time.',
      `Help me change my ${language} code based on what my test showed.`
    ];
    case 'share': return [
      topic ? `Help me practise a one-minute pitch about this. Ask me questions, do not write it for me: ${topic}` : 'Help me practise a one-minute pitch. Ask me questions, do not write it for me.',
      'What hard questions might someone ask about my project?',
      'How can I show what I learned from the things that went wrong?'
    ];
    default: return [
      spark ? `Explain the science behind this in simple words: ${spark}` : 'Explain the science behind something that surprised me in an activity, in simple words.',
      interest ? `Give me three real-world problems connected to ${interest}.` : 'Give me three real-world problems connected to what I just explored.',
      'Quiz me with five questions on what I just explored, one at a time.'
    ];
  }
}
