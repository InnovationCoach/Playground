import { FRAMEWORK_VERSION, recommendPathway } from '../../src/features/quest/pathwayModel.js';
export const lesson = { id: 'investigate', offeringId: 'sample-program', revision: 1, status: 'published', title: 'Turn an investigation into a plan',
  outcome: 'Use your investigation to choose priorities and plan a practical response.', competencyIds: ['ctps-06'], prerequisiteCompetencyIds: ['sdl-01'], estimatedMinutes: 35,
  successCriteria: ['State a clear goal and explain why it matters.', 'Compare possible actions and explain your priorities.', 'Create a plan with steps, responsibilities and a deadline.'],
  steps: [{ id: 'notice', title: 'Choose a challenge', instructions: 'Choose something you would like to improve in your school. Describe the challenge and who it affects.' },
    { id: 'compare', title: 'Compare your options', instructions: 'Suggest two possible actions. Compare the time, resources and likely benefit of each.' },
    { id: 'plan', title: 'Share your plan', instructions: 'Choose your approach. Explain your priorities, list the steps and agree a deadline with your coach.' }] };
let revision = 1, quests = [], submitted = false;
let achievements = [{ competencyId: 'sdl-01', state: 'confirmed', frameworkVersion: FRAMEWORK_VERSION, reason: 'Your project brief included a measurable goal, clear steps and a deadline.' }];
export const reviewExample = () => { submitted = true; };
export async function schoolRequest(method, path, options = {}) {
  if (method === 'GET') return { revision, achievements, quests, recommendations: recommendPathway({ lessons: [lesson], achievements, goals: quests }),
    evidence: submitted ? [{ offeringId: 'sample-program', submissionId: 'sample-evidence', title: lesson.title, competencyIds: lesson.competencyIds }] : [] };
  const body = options.body;
  if (path.includes('/choose?')) {
    const choice = recommendPathway({ lessons: [lesson], achievements, goals: quests })[0];
    quests = [{ id: 'sample-goal', source: 'competency-pathway', recommendationId: choice.id, target: choice.goal, state: 'active', quest: choice, competencyIds: choice.competencyIds }]; revision++;
  } else if (path.includes('/decisions?')) {
    achievements = [...achievements.filter(a => a.competencyId !== body.competencyId), { ...body, frameworkVersion: FRAMEWORK_VERSION }];
    quests = quests.map(g => ({ ...g, state: body.state === 'confirmed' ? 'achieved' : 'active' })); revision++;
  }
  return { saved: true };
}
