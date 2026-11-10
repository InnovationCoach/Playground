import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
// Every live service is replaced, so nothing here can reach Firebase, the API or Storage.
const replacements = new Map([
  [path.join(root, 'src/firebase.js'), path.join(here, 'fixtureFirebase.js')],
  [path.join(root, 'src/auth.js'), path.join(here, 'fixtureAuth.js')],
  [path.join(root, 'src/services/api/apiClient.js'), path.join(here, 'fixtureApi.js')],
  [path.join(root, 'src/features/dashboard/dashboardCourses.js'), path.join(here, 'fixtureCourses.js')]
]);
export default defineConfig({
  root: here, publicDir: path.join(root, 'public'),
  // Its own dependency cache: a shared one lets other dev servers force reloads mid-check.
  cacheDir: path.join(os.tmpdir(), 'lower-secondary-preview-vite'),
  plugins: [{ name: 'offline-lower-secondary-fixtures', enforce: 'pre', resolveId(source, importer) {
    if (importer && source.startsWith('.')) return replacements.get(path.resolve(path.dirname(importer.split('?')[0]), source));
  } }, react()],
  server: { host: '127.0.0.1', port: 5198, strictPort: true, fs: { allow: [root] } }
});
