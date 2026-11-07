/**
 * Real Express app and real /api/pbl/synthesize route, against this branch's demo
 * emulators, with a fixture in place of the Gemini call. For local validation when
 * no development AI key is available; refuses anything but localhost and demo-*.
 */
import { createApp } from '../../server/app.js';
import { initAdmin } from '../../server/auth.js';
import { PBL_STAGES } from '../../shared/pblUnitSchema.js';

const local = (h) => /^(127\.0\.0\.1|localhost):\d+$/.test(h || '');
const project = process.env.GCLOUD_PROJECT || '';
if (!/^demo-/.test(project) || !local(process.env.FIRESTORE_EMULATOR_HOST) || !local(process.env.FIREBASE_AUTH_EMULATOR_HOST)) {
  console.error('Refusing to start outside localhost emulators / a demo-* project.');
  process.exit(1);
}

const unit = () => ({
  unitTitle: 'Rainwater Rescue Lab',
  theme: 'Water Resilience',
  drivingQuestion: 'How might we capture and reuse rainwater at our learning centre?',
  realProblem: { summary: 'Heavy rain floods the courtyard while plants go dry in the hot season.', peopleImpact: 'Safer walkways for 200 learners.', environmentalImpact: 'Less mains water used.' },
  makerSpaceSpecs: [{ toolType: 'Microcontroller Workstation', specs: 'BBC micro:bit V2 with soil sensors', safetyGuidelines: 'Keep electronics dry and supervised.' }],
  coachCues: { leadCoach: 'Lead coach', initiationCue: 'Start at the flooded corner.', frustrationDeescalationCue: 'Test one joint at a time.', midCheckCue: 'Check flow rate against target.', showcaseCue: 'Demo a full rain cycle.' },
  milestones: PBL_STAGES.map((s) => ({
    stageNumber: s.stageNumber, stageName: s.stageName, week: s.week, durationMin: 90,
    title: `${s.stageName} for rainwater`, learningGoal: `Apply ${s.stageName.toLowerCase()} to the courtyard problem.`,
    activities: [`Run the ${s.stageName.toLowerCase()} workshop.`, 'Record what you learned.'],
    makerSpaceTools: ['Electronics bench'], evidencePrompt: `Share evidence of ${s.stageName.toLowerCase()}.`,
    allowedSubmissions: ['video', 'github', 'prototype'], coachCue: 'Celebrate iterations.'
  }))
});

const modelAdapter = { generateContent: async () => ({ response: { text: () => JSON.stringify(unit()), usageMetadata: {} } }) };

initAdmin();
createApp({ modelAdapter }).listen(3118, () => console.log('Fixture API on http://localhost:3118 (fixture AI, demo emulators)'));
