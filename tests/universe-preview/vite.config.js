import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
// Preview pages never load the live Firebase config: any import of firebase.js gets an offline stub.
const firebaseStub = fileURLToPath(new URL('./firebaseStub.js', import.meta.url));
export default defineConfig({ root: fileURLToPath(new URL('./', import.meta.url)), plugins: [react()], resolve: { alias: [{ find: /^(\.\.\/)+firebase\.js$/, replacement: firebaseStub }] }, server: { host: '127.0.0.1', port: 5192, strictPort: true, fs: { allow: [root] } } });
