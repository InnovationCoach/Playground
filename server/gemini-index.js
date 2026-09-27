import dotenv from 'dotenv';
import { createApp } from './app.js';
import { initAdmin } from './auth.js';

dotenv.config();

const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

const adminReady = initAdmin();
const app = createApp();

let bannerTimer = null;
const server = app.listen(PORT, () => {
  bannerTimer = setTimeout(() => {
    console.log(`🚀 HearIsland Server running on http://localhost:${PORT}`);
    console.log(`🤖 Using Gemini API Model: ${MODEL_NAME}`);
    console.log(`📝 Gemini API Key: ${GEMINI_API_KEY ? 'Configured ✓' : 'Missing ✗'}`);
    console.log(`🛡️  Safety settings: BLOCK_LOW_AND_ABOVE on all categories`);
    console.log(`🔐 Token verification: ${adminReady ? 'Enabled ✓' : 'DISABLED - requests are unverified ✗'}`);
    console.log(`   Emulator mode: ${process.env.FIREBASE_AUTH_EMULATOR_HOST ? `auth via ${process.env.FIREBASE_AUTH_EMULATOR_HOST} ✓` : 'off (verifying against real Firebase)'}`);
    if (!adminReady && process.env.NODE_ENV === 'production') {
      console.error('   Refusing unverified requests in production. Configure service account credentials.');
    }
  }, 0);
});

server.on('error', (err) => {
  clearTimeout(bannerTimer);
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use - THIS SERVER DID NOT START.`);
    console.error('   Anything answering on that port is an older process, not this one.');
    console.error(`   Find it:  lsof -nP -iTCP:${PORT} -sTCP:LISTEN`);
    console.error(`   Stop it:  kill $(lsof -nP -iTCP:${PORT} -sTCP:LISTEN -t)`);
    console.error(`   Or run this one elsewhere:  PORT=3002 npm run server:dev:emulator\n`);
  } else {
    console.error(`\n❌ Server failed to start: ${err.message}\n`);
  }
  process.exit(1);
});
