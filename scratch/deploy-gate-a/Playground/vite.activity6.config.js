/**
 * Build for the standalone Activity 6 site (welearn-activity6.web.app).
 * Only activity6.html and what it imports go in, so nothing else from the
 * working tree is released with it.
 *
 *   npx vite build --config vite.activity6.config.js   → dist-activity6/
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Read no .env files. The root .env sets NODE_ENV=development for the API
  // server, which made Vite ship React's development build; and this page
  // needs no env values, so none can leak into it either.
  envDir: 'src/activity6',
  // public/ holds the main site's static files; none belong on this site.
  publicDir: false,
  build: {
    outDir: 'dist-activity6',
    emptyOutDir: true,
    rollupOptions: { input: 'activity6.html' }
  }
});
