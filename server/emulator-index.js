/**
 * Explicit Emulator-Only Server Entrypoint
 * Injects FIXTURE_RELEASES into createApp only after verifying localhost emulator hosts
 * and nonproduction demo-* project context. Never imported by production entries.
 */

import dotenv from 'dotenv';
import { createApp } from './app.js';
import { initAdmin } from './auth.js';
import { FIXTURE_RELEASES } from '../shared/universe/fixtures/index.js';
import {
  getActiveProjectId,
  isEmulatorEnvironment,
  isLocalhostEmulatorAddress,
  isNonProductionProject
} from './lib/universe/missions.js';

dotenv.config();

const projectId = getActiveProjectId();

if (
  !isNonProductionProject(projectId) ||
  !isLocalhostEmulatorAddress(process.env.FIRESTORE_EMULATOR_HOST) ||
  !isLocalhostEmulatorAddress(process.env.FIREBASE_AUTH_EMULATOR_HOST) ||
  !isEmulatorEnvironment()
) {
  console.error('❌ Refusing to start emulator server outside localhost emulators / demo-* project.');
  process.exit(1);
}

process.env.GCLOUD_PROJECT = projectId;
process.env.GOOGLE_CLOUD_PROJECT = projectId;
process.env.ALLOW_DRAFT_MISSIONS = process.env.ALLOW_DRAFT_MISSIONS || 'true';

const PORT = process.env.PORT || 3001;
initAdmin();
const app = createApp({ universeRegistry: FIXTURE_RELEASES });
const geminiConfig = app.locals.geminiConfig || { model: 'gemini-2.5-flash', configured: false };

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 HearIsland Emulator Server running on http://localhost:${PORT} (project: ${projectId})`);
  console.log(`🤖 Using Gemini API Model: ${geminiConfig.model} (${geminiConfig.configured ? 'Key Configured ✓' : 'Key Missing ✗'})`);
});

server.on('error', (err) => {
  console.error(`❌ Emulator server failed to start: ${err.message}`);
  process.exit(1);
});
