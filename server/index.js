import { onRequest } from 'firebase-functions/v2/https';
import { createApp } from './app.js';

const app = createApp();

export const api = onRequest({
  region: 'us-central1',
  memory: '512MiB',
  timeoutSeconds: 60,
  secrets: ['SCHOOL_GEMINI_API_KEY'],
  minInstances: 0,
  invoker: 'public'
}, app);
