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

const projectId = getActiveProjectId() || 'demo-hearisland-local';
process.env.GCLOUD_PROJECT = projectId;
process.env.GOOGLE_CLOUD_PROJECT = projectId;
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8088';
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
process.env.ALLOW_DRAFT_MISSIONS = process.env.ALLOW_DRAFT_MISSIONS || 'true';
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (
  !isNonProductionProject(projectId) ||
  !isLocalhostEmulatorAddress(process.env.FIRESTORE_EMULATOR_HOST) ||
  !isLocalhostEmulatorAddress(process.env.FIREBASE_AUTH_EMULATOR_HOST) ||
  !isEmulatorEnvironment()
) {
  console.error('❌ Refusing to start emulator server outside localhost emulators / demo-* project.');
  process.exit(1);
}

const PORT = process.env.PORT || 3001;
initAdmin();
const app = createApp({ universeRegistry: FIXTURE_RELEASES });

const server = app.listen(PORT, () => {
  console.log(`🚀 HearIsland Emulator Server running on http://localhost:${PORT} (project: ${projectId})`);
});

server.on('error', (err) => {
  console.error(`❌ Emulator server failed to start: ${err.message}`);
  process.exit(1);
});
