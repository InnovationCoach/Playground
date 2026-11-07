/**
 * Real-app integration checks on demo emulators with synthetic accounts:
 *   node tests/lower-secondary-integration/run.mjs
 * Needs the backend layout contract in the same tree. Uses private ports so it
 * can't collide with other emulators, and never touches a live project.
 * Any other command to run on the same emulators can follow as an argument.
 */
import { spawnSync } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PORTS } from './ports.mjs';
import { requireFreePorts } from './lifecycle.mjs';
const project = process.argv[3] || 'demo-hearisland-local';
if (!/^demo-[a-z0-9-]+$/.test(project)) throw new Error('Integration runner requires a demo-* project.');
await requireFreePorts(Object.values(PORTS));
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
// Firebase only accepts rules inside the config's own folder, so this sits at the root for the run.
const config = path.join(root, 'firebase.lower-secondary-test.json');
writeFileSync(config, JSON.stringify({
  firestore: { rules: 'firestore.rules' }, storage: { rules: 'storage.rules' },
  emulators: { auth: { port: PORTS.auth }, firestore: { port: PORTS.firestore, websocketPort: PORTS.firestoreWs }, storage: { port: PORTS.storage }, hub: { port: PORTS.hub }, logging: { port: PORTS.logging }, ui: { enabled: false }, singleProjectMode: true }
}));
const { GOOGLE_APPLICATION_CREDENTIALS: _creds, ...env } = process.env;
const command = process.argv[2] || `node ${path.join(here, 'check.mjs')}`;
const result = spawnSync('npx', ['firebase', 'emulators:exec', '--only', 'auth,firestore,storage', '--project', project, '--config', config, command], { stdio: 'inherit', env, cwd: root });
rmSync(config, { force: true });
process.exit(result.status ?? 1);
