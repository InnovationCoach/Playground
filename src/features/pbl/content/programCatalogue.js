import { TERM, PHASES } from './pblModel.js';

// Curriculum definitions are not enrollments or invented progress records.
export const PROGRAM_CATALOGUE = [{
  id: 'sustainable-futures',
  semester: 1,
  title: 'Sustainable Futures',
  legacyTermId: TERM.id,
  drivingQuestion: TERM.drivingQuestion,
  gradeBand: 'Existing school program',
  steamActivityIds: ['phase1', 'bunker', 'coding', 'bangkok', 'solar', 'so2', 'plants', 'hexgrid'],
  milestones: PHASES.map(p => ({
    id: p.id,
    title: p.title
  })),
  rubric: []
}, {
  id: 'net-zero-microgrid',
  semester: 2,
  title: 'District Net-Zero Resilient Microgrid',
  gradeBand: 'Grades 11–12',
  drivingQuestion: 'How can we design and financially validate a campus renewable microgrid that reduces peak utility demand by 65% and maintains critical safety loads during a 72-hour grid failure?',
  steamActivityIds: ['phase1', 'solar', 'coding', 'hexgrid'],
  milestones: ['Campus Energy Audit & Need-to-Know Launch', 'Generation & Battery Sizing Optimization', 'Circuit Architecture & Islanding Logic', 'Financial Amortization & Grant Optimization', 'Public Hearing Defense & Exhibition'].map((title, i) => ({
    id: `phase-${i + 1}`,
    title
  })),
  rubric: [{
    title: 'Mathematical & Scientific Modeling Rigor',
    weight: 30,
    standard: 'HS-PS3-3'
  }, {
    title: 'Engineering Feasibility & System Architecture',
    weight: 25,
    standard: 'HS-ETS1-2'
  }, {
    title: 'Economic & Fiscal Viability',
    weight: 25,
    standard: 'CCSS.ELA-WHST.11-12.7'
  }, {
    title: 'Authentic Civic Defense & Public Discourse',
    weight: 20,
    standard: 'CCSS.ELA-WHST.11-12.7'
  }]
}, {
  id: 'project-arachne',
  semester: 3,
  title: 'Project Arachne — Engineering the Sesame Quadruped',
  gradeBand: 'Grades 9–12',
  drivingQuestion: 'How can we design and modify a quadruped robot to navigate diverse and challenging terrains?',
  steamActivityIds: ['coding', 'bunker', 'solar'],
  milestones: ['The Mechanics of Biomimicry', 'Hardware & Systems Architecture', 'The Adaptation Lab', 'Iterative Design & Locomotion Tuning', 'The Grand Gauntlet & Final Deployment'].map((title, i) => ({
    id: `phase-${i + 1}`,
    title
  })),
  rubric: [{
    title: 'Biomimetic Kinematics & Stability Analysis',
    weight: 30,
    standard: 'HS-ETS1-2'
  }, {
    title: 'Electrical & Power Systems Architecture',
    weight: 25,
    standard: 'HS-PS3-3'
  }, {
    title: 'Terrain Adaptation & 3D Prototyping',
    weight: 25,
    standard: 'HS-ETS1-2'
  }, {
    title: 'Grand Gauntlet Demonstration & Defense',
    weight: 20,
    standard: 'HS-ETS1-2'
  }]
}];
export const programById = id => PROGRAM_CATALOGUE.find(p => p.id === id);
