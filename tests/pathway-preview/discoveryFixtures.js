import { discoveryCatalog, pathwayDiscovery } from '../../src/features/courses/discoveryModel.js';
import { FRAMEWORK_VERSION } from '../../src/features/quest/pathwayModel.js';
import { competencyById } from '../../src/features/pbl/content/competencies.js';

const examples = [
  { id: 'external:energy', source: 'external', sample: true, provider: 'Open Learning Studio', title: 'A beginner’s guide to clean energy',
    description: 'Explore how sunshine, wind and a good question can change the way we power our world.', kind: 'Course', art: 'solar', format: 'Self-paced course', duration: '3 short sessions',
    topics: ['Climate & energy', 'Engineering'], readiness: 'unknown', cost: 'Sample pricing unavailable', reason: 'A different perspective on the energy projects you’re exploring. External alignment needs coach review.' },
  { id: 'external:robot', source: 'external', sample: true, provider: 'Maker Fieldnotes', title: 'Small robots. Big possibilities.',
    description: 'Get curious about sensors, movement and the code that brings a small machine to life.', kind: 'Course', art: 'robot', format: 'Build-along course', duration: '4 short sessions', topics: ['Robotics', 'Coding'], readiness: 'unknown' },
  { id: 'external:plants', source: 'external', sample: true, provider: 'The Curious Classroom', title: 'The hidden life of plants',
    description: 'Look closer at the living systems around you through simple observations and experiments.', kind: 'Course', art: 'plant', format: 'Field investigations', duration: 'Explore at your pace', topics: ['Living systems'], readiness: 'unknown' }
];
const quest = pathwayDiscovery([{ id: 'sample:energy-plan', offeringId: 'sample', lessonId: 'energy-plan', title: 'Turn your ideas into an energy plan',
  goal: 'Compare two ways to reduce energy use and make a plan grounded in evidence.', basis: 'confirmed-prerequisites',
  reason: 'You’ve demonstrated Goal Setting. Put that strength to work on an energy challenge.', estimatedMinutes: 35,
  competencies: [competencyById('ctps-06')], prerequisiteCompetencyIds: ['sdl-01'],
  steps: [{ id: 'notice', title: 'Notice an opportunity', instructions: 'Choose one space at school and identify something you could improve.' },
    { id: 'compare', title: 'Compare your options', instructions: 'Compare two changes. Consider their benefits, time and resources.' },
    { id: 'plan', title: 'Make it happen', instructions: 'Choose your approach and explain your priorities, steps and deadline.' }],
  successCriteria: ['Compare two possible actions using evidence.', 'Explain how your priorities connect to your goal.'], frameworkVersion: FRAMEWORK_VERSION }]);
quest[0].topics = ['Climate & energy', 'Engineering'];
const catalog = discoveryCatalog();
const robot = catalog.find(i => i.programId === 'project-arachne');
export const discoverySample = {
  items: [...catalog.slice(0, 3), examples[0], ...catalog.filter(i => ['solar', 'plants', 'coding'].includes(i.activityId)), examples[1], examples[2], ...catalog.filter(i => ['phase1', 'so2', 'hexgrid'].includes(i.activityId))],
  recommendations: [quest[0], { ...robot, reason: 'Curious about building things? Explore a hands-on robotics program with your coach.', readiness: 'explore' }, examples[0]],
  achievements: [{ id: 'sdl-01', title: 'Goal Setting' }, { id: 'ctps-01', title: 'Inquiry & Research' }]
};
