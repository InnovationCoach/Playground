import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
export default defineConfig({plugins:[react(),{name:'pilot-preview-fixture',enforce:'pre',resolveId(source,importer){if(importer?.endsWith('/PilotOperations.jsx') && source.endsWith('/apiClient.js')) return fileURLToPath(new URL('./fixtureApi.js',import.meta.url));}}],optimizeDeps:{entries:['tests/pilot-preview/index.html']}});
