import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // The rules suite needs the Firestore emulator (npm test wraps it in
    // emulators:exec); the solar car and SO₂ model suites are pure and also run on
    // their own via `npm run test:unit`. The other files in tests/ are standalone node
    // scripts run directly (node tests/<file>), not via vitest.
    include: ['tests/inventory.test.js', 'tests/pilot-operations-ui.test.jsx', 'tests/coach-workspace.test.jsx', 'tests/course-discovery.test.jsx', 'tests/pathway-rules.test.js', 'tests/pathway-model.test.js', 'tests/learner-pathway-ui.test.jsx', 'tests/school-cohorts.test.js', 'tests/competency-validation.test.js', 'tests/media-viewer.test.jsx', 'tests/coach-lesson-editor.test.jsx', 'tests/program-maker.test.js', 'tests/program-maker-ui.test.jsx', 'tests/coach-roster-stats.test.js', 'tests/profile-image-crop.test.js', 'tests/activity-ai-generation.test.js', 'tests/activity-builder.test.jsx', 'tests/journey.test.jsx', 'tests/activity-spec.test.js', 'tests/quest-model.test.js', 'tests/quest-ui.test.jsx', 'tests/simulation-lab.test.jsx', 'tests/goal-setting-modal.test.js', 'tests/personalization-model.test.js', 'tests/personalization-ui.test.jsx', 'tests/w2e-learning-studio.test.jsx', 'tests/program-chooser.test.jsx', 'tests/goals-dashboard.test.js', 'tests/school-workspace-ui.test.jsx', 'tests/school-api-client.test.js', 'tests/firestore-rules.test.js', 'tests/solar-car-model.test.js', 'tests/so2-model.test.js', 'tests/plant-lab-model.test.js', 'tests/hex-grid-model.test.js', 'tests/junior-explorers.test.js', 'tests/activity-search.test.js', 'tests/growth-hub-phase0.test.js', 'tests/primary-worksheets.test.js', 'tests/pbl.test.js', 'tests/so2-filter.test.js', 'tests/sim-economy.test.js'],
    testTimeout: 15000,
    hookTimeout: 30000,
    // Rule evaluation shares one emulator; parallel files would race on
    // clearFirestore() between tests.
    fileParallelism: false
  }
});
