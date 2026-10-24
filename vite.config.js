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
  esbuild: {
    legalComments: 'none'
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/scheduler/')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/firebase/') || id.includes('node_modules/@firebase/')) {
            return 'vendor-firebase';
          }
          if (id.includes('node_modules/lucide-react/')) {
            return 'vendor-icons';
          }
          if (id.includes('src/features/activities/solarCar/')) {
            return 'sim-solar-car';
          }
          if (id.includes('src/features/activities/bunker/')) {
            return 'sim-bunker';
          }
          if (id.includes('src/features/activities/plantLab/')) {
            return 'sim-plant-lab';
          }
          if (id.includes('src/features/activities/so2Sulfate/')) {
            return 'sim-so2-sulfate';
          }
          if (id.includes('src/features/activities/hexGrid/')) {
            return 'sim-hex-grid';
          }
          if (id.includes('src/features/coach/studio/')) {
            return 'coach-pbl-studio';
          }
          if (id.includes('prototypes/DonPBL/')) {
            return 'prototype-donpbl';
          }
        }
      }
    }
  }
});
