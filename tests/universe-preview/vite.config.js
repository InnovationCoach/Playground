import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
export default defineConfig({ root: fileURLToPath(new URL('./', import.meta.url)), plugins: [react()], server: { host: '127.0.0.1', port: 5192, strictPort: true, fs: { allow: [root] } } });
