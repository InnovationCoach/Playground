import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The rules suite needs the Firestore emulator (npm test wraps it in
    // emulators:exec); the solar car and SO₂ model suites are pure and also run on
    // their own via `npm run test:unit`. The other files in tests/ are standalone node
    // scripts run directly (node tests/<file>), not via vitest.
    include: ['tests/firestore-rules.test.js', 'tests/solar-car-model.test.js', 'tests/so2-model.test.js', 'tests/plant-lab-model.test.js', 'tests/hex-grid-model.test.js', 'tests/junior-explorers.test.js', 'tests/activity-search.test.js', 'tests/growth-hub-phase0.test.js', 'tests/primary-worksheets.test.js', 'tests/pbl.test.js', 'tests/so2-filter.test.js', 'tests/sim-economy.test.js'],
    testTimeout: 15000,
    hookTimeout: 30000,
    // Rule evaluation shares one emulator; parallel files would race on
    // clearFirestore() between tests.
    fileParallelism: false
  }
});
