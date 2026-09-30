import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // The browser always calls same-origin /api (src/services/apiBase.js). In
    // development that is the Express server from `npm run server:dev`.
    proxy: {
      '/api': 'http://localhost:3001'
    }
  },
  build: {
    rollupOptions: {
      output: {
        // React and Firebase change far less often than app code; splitting them
        // out keeps the app chunk small enough to re-download on every deploy.
        manualChunks: {
          react: ['react', 'react-dom']
        }
      }
    }
  }
});
