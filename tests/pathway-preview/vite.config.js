import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react(), { name: 'pathway-preview-fixtures', enforce: 'pre', resolveId(source, importer) {
    if (importer?.endsWith('/useSchoolWorkspace.js') && source === '../../services/api/apiClient.js') return fileURLToPath(new URL('./fixtureApi.js', import.meta.url));
  } }],
  server: { host: '127.0.0.1', port: 5190, strictPort: true }
});
