import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/api/*.test.js'],
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
    env: {
      FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_FIRESTORE_EMULATOR_ADDRESS || '127.0.0.1:8088',
      FIREBASE_AUTH_EMULATOR_HOST: process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099',
      GCLOUD_PROJECT: process.env.GCLOUD_PROJECT || 'demo-hearisland-rules'
    }
  }
});
