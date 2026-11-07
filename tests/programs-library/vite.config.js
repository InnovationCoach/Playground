/**
 * Development build for reviewing the Programs library against this branch's own
 * emulators (see firebase.programs-library.local.json). Same app and index.html,
 * with only the emulator ports and API target moved, so it can run beside another
 * session's emulators. Open with ?emulators=1. Nothing here reaches production.
 */
import { defineConfig, mergeConfig } from 'vite';
import base from '../../vite.config.js';

export default mergeConfig(base, defineConfig({
  plugins: [{
    name: 'programs-library-emulator-ports',
    transformIndexHtml: (html) => html
      .replace('http://127.0.0.1:9099', 'http://127.0.0.1:9399')
      .replace('useEmulator("127.0.0.1", 8088)', 'useEmulator("127.0.0.1", 8288)')
      .replace('if (firebase.storage) firebase.storage().useEmulator("127.0.0.1", 9199);', '')
  }],
  server: { port: 5188, strictPort: true, proxy: { '/api': 'http://localhost:3118' } }
}));
