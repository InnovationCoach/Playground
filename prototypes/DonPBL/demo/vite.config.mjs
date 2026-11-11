import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  server: {
    port: 5180,
    strictPort: true,
    host: '127.0.0.1',
    fs: {
      allow: [path.resolve(__dirname, '..'), path.resolve(__dirname, '../../..')]
    }
  },
  preview: {
    port: 5180,
    strictPort: true,
    host: '127.0.0.1'
  }
});
