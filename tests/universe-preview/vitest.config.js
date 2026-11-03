import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], test: { include: ['tests/universe-model.test.js', 'tests/universe-ui.test.jsx', 'tests/universe-explorer-model.test.js', 'tests/universe-explorer-ui.test.jsx', 'tests/universe-arrival-ui.test.jsx', 'tests/universe-catalog.test.js', 'tests/universe-missions.test.js', 'tests/coach-universe-submissions.test.jsx', 'tests/thalassa-station-scenario.test.jsx', 'tests/universe-pilot-client.test.js', 'tests/universe-pilot-session.test.js', 'tests/universe-pilot-ui.test.jsx', 'tests/universe-auth-provider.test.jsx', 'tests/universe-auth-subscribe.test.js'], fileParallelism: false } });

