import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const replacements = new Map([
  [path.join(root, 'src/firebase.js'), path.join(here, 'fixtureFirebase.js')],
  [path.join(root, 'src/auth.js'), path.join(here, 'fixtureAuth.js')],
  [path.join(root, 'src/features/dashboard/dashboardCourses.js'), path.join(here, 'fixtureCourses.js')]
]);
export default defineConfig({
  root: here, plugins: [{ name: 'offline-dashboard-fixtures', enforce: 'pre', resolveId(source, importer) {
    if (importer && source.startsWith('.')) return replacements.get(path.resolve(path.dirname(importer.split('?')[0]), source));
  } }, react()], server: { host: '127.0.0.1', port: 5182, strictPort: true, fs: { allow: [root] } }
});
