/**
 * The real app against private demo emulators. Test-only: this plugin is the only
 * place the layout contract is ever switched on, so the shipped constant stays false.
 * LS_CONTRACT=off serves the app exactly as shipped, to prove it stays off.
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PORTS } from './ports.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const enable = process.env.LS_CONTRACT !== 'off';
export default defineConfig({
  root,
  // Its own dependency cache: a shared one lets other dev servers force reloads mid-check.
  cacheDir: path.join(os.tmpdir(), `lower-secondary-integration-vite-${enable ? 'on' : 'off'}`),
  plugins: [{
    name: 'lower-secondary-emulator-test',
    enforce: 'pre',
    transformIndexHtml: (html) => html.replace('http://127.0.0.1:9099', `http://127.0.0.1:${PORTS.auth}`).replace('firebase.firestore().useEmulator("127.0.0.1", 8088)', `firebase.firestore().useEmulator("127.0.0.1", ${PORTS.firestore})`).replace('"127.0.0.1", 9199', `"127.0.0.1", ${PORTS.storage}`),
    transform(code, id) {
      if (enable && id.endsWith('lowerSecondary/layoutContract.js')) return code.replace('LAYOUT_CONTRACT_ENABLED = false', 'LAYOUT_CONTRACT_ENABLED = true');
      return null;
    }
  }, react()],
  server: { host: '127.0.0.1', strictPort: true, proxy: { '/api': `http://127.0.0.1:${PORTS.api}` } }
});
