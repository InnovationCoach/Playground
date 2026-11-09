import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
// SYNTHETIC preview: firebase.js and the API client are replaced by offline stubs,
// so nothing on this page can reach a Firebase project or the school service.
const stub = (f) => fileURLToPath(new URL(f, import.meta.url));
export default defineConfig({
  root: fileURLToPath(new URL('./', import.meta.url)),
  plugins: [react()],
  resolve: { alias: [
    { find: /^(\.\.\/)+firebase\.js$/, replacement: stub('./firebaseStub.js') },
    { find: /^(\.\.\/)+services\/api\/apiClient\.js$/, replacement: stub('./syntheticApi.js') }
  ] },
  server: { host: '127.0.0.1', port: 5197, strictPort: true, fs: { allow: [root] } }
});
