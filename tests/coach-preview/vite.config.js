// Isolated UI review server. Fixture Firebase reads never contact a real project.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  optimizeDeps: { entries: ['tests/coach-preview/index.html'] },
  plugins: [react(), {
    name: 'coach-preview-fixtures',
    enforce: 'pre',
    resolveId(source, importer) {
      if (importer?.endsWith('/StudentInviteDialog.jsx') && source === '../../services/api/apiClient.js') {
        return fileURLToPath(new URL('./fixtureInviteApi.js', import.meta.url));
      }
      if (source.endsWith('/firebase.js') && !importer?.endsWith('/CoachWorkspace.jsx')) {
        return fileURLToPath(new URL('../school-preview/fixtureFirebase.js', import.meta.url));
      }
      if (importer?.endsWith('/useSchoolWorkspace.js') && source === '../../services/api/apiClient.js') {
        return fileURLToPath(new URL('../school-preview/fixtureApi.js', import.meta.url));
      }
      if (importer?.endsWith('/CoachWorkspace.jsx') && source === '../../firebase.js') {
        return fileURLToPath(new URL('./fixtureFirebase.js', import.meta.url));
      }
    }
  }]
});
