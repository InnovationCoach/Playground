import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // The rules suite needs the Firestore emulator (npm test wraps it in
    // emulators:exec); the solar car and SO₂ model suites are pure and also run on
    // their own via `npm run test:unit`. The other files in tests/ are standalone node
    // scripts run directly (node tests/<file>), not via vitest.
    include: ['tests/evaluation-desk-ui.test.jsx', 'tests/coach-pbl-stage-tools.test.jsx', 'tests/lower-secondary-selector.test.js', 'tests/lower-secondary-ui.test.jsx', 'tests/pbl-generation-client.test.js', 'tests/pilot-operations-ui.test.jsx', 'tests/admin-billing-ui.test.jsx', 'tests/inventory.test.js', 'tests/universe-model.test.js', 'tests/search-discovery.test.js', 'tests/dashboard-slides.test.js', 'tests/dashboard-instruments.test.js', 'tests/session-numbering.test.js', 'tests/dashboard-personalization.test.js', 'tests/dashboard-hub.test.js', 'tests/firestore-rules.test.js', 'tests/mission-submissions-rules.test.js', 'tests/canva-page.test.js', 'tests/canva-section.test.js', 'tests/showcase-canva-slot.test.js', 'tests/solar-car-model.test.js', 'tests/so2-model.test.js', 'tests/plant-lab-model.test.js', 'tests/hex-grid-model.test.js', 'tests/junior-explorers.test.js', 'tests/activity-search.test.js', 'tests/growth-hub-phase0.test.js', 'tests/primary-worksheets.test.js', 'tests/pbl.test.js', 'tests/pbl-programs.test.js', 'tests/so2-filter.test.js', 'tests/sim-economy.test.js', 'tests/course-catalog.test.js', 'tests/goal-plan.test.js', 'tests/messages-model.test.js', 'tests/future-skills.test.js', 'tests/my-dashboard.test.js', 'tests/parent-dashboard.test.js', 'tests/spark-home.test.js', 'tests/media-embed.test.js', 'tests/program-media.test.js', 'tests/program-tools.test.js', 'tests/focus-model.test.js', 'tests/launchpad.test.js', 'tests/coach-pbl-studio.test.js', 'tests/edmentum-lti.test.js', 'tests/coach-learners.test.js', 'tests/spark-data-layer.test.js', 'tests/pbl-synthesize-security.test.js', 'tests/student-profile.test.js', 'tests/cohort-boundaries.test.js', 'tests/archetypes.test.js', 'tests/api-resilience.test.js', 'tests/coach-workspace.test.jsx', 'tests/course-discovery.test.jsx', 'tests/pathway-rules.test.js', 'tests/pathway-model.test.js', 'tests/learner-pathway-ui.test.jsx', 'tests/school-cohorts.test.js', 'tests/competency-validation.test.js', 'tests/media-viewer.test.jsx', 'tests/coach-lesson-editor.test.jsx', 'tests/program-maker.test.js', 'tests/program-maker-ui.test.jsx', 'tests/coach-roster-stats.test.js', 'tests/profile-image-crop.test.js', 'tests/activity-ai-generation.test.js', 'tests/activity-builder.test.jsx', 'tests/journey.test.jsx', 'tests/activity-spec.test.js', 'tests/quest-model.test.js', 'tests/quest-ui.test.jsx', 'tests/simulation-lab.test.jsx', 'tests/goal-setting-modal.test.js', 'tests/personalization-model.test.js', 'tests/personalization-ui.test.jsx', 'tests/w2e-learning-studio.test.jsx', 'tests/program-chooser.test.jsx', 'tests/goals-dashboard.test.js', 'tests/school-workspace-ui.test.jsx', 'tests/school-api-client.test.js', 'tests/spark-tutor-unit.test.js', 'tests/universe-builder.test.js', 'tests/student-clarity-ui.test.jsx', 'tests/edmentum-truthful-states.test.jsx', 'tests/spark-tutor-ui.test.jsx'],
    testTimeout: 15000,
    hookTimeout: 30000,
    // Rule evaluation shares one emulator; parallel files would race on
    // clearFirestore() between tests.
    fileParallelism: false
  }
});
