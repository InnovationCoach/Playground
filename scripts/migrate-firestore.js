#!/usr/bin/env node

/**
 * Firestore Migration Using Firestore REST API
 * Migrates users to multi-path schema
 */

import fs from 'fs';
import crypto from 'crypto';
import https from 'https';

const isDryRun = process.argv.includes('--dry-run');

// Load credentials
const credentials = JSON.parse(
  fs.readFileSync('scripts/firebase-admin-key.json', 'utf8')
);

const projectId = credentials.project_id;
const privateKey = credentials.private_key;
const clientEmail = credentials.client_email;

console.log('🚀 HearIsland Firestore Migration');
console.log('==================================\n');

if (isDryRun) {
  console.log('⚠️  DRY RUN MODE - No changes will be made\n');
}

// Create JWT and get access token
async function getAccessToken() {
  return new Promise((resolve, reject) => {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };

    // Create JWT header
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const signInput = `${header}.${body}`;

    // Sign with private key
    const sign = crypto.createSign('SHA256');
    sign.update(signInput);
    const signature = sign.sign(privateKey, 'base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const jwt = `${signInput}.${signature}`;

    // Exchange JWT for access token
    const postData = `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`;
    const options = {
      hostname: 'oauth2.googleapis.com',
      port: 443,
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const tokenData = JSON.parse(data);
          resolve(tokenData.access_token);
        } catch (e) {
          reject(new Error('Failed to parse token response: ' + data));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Fetch all users from Firestore
async function getUsers(accessToken) {
  return new Promise((resolve, reject) => {
    const path = `/v1/projects/${projectId}/databases/(default)/documents/users`;
    const url = `https://firestore.googleapis.com${path}`;

    const options = {
      hostname: 'firestore.googleapis.com',
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response.documents || []);
        } catch (e) {
          reject(new Error('Failed to parse users: ' + data));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Update a single user
async function updateUser(accessToken, userId, updates) {
  return new Promise((resolve, reject) => {
    const path = `/v1/projects/${projectId}/databases/(default)/documents/users/${userId}`;

    const updateData = {
      fields: {}
    };

    // Convert updates to Firestore format
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) {
        updateData.fields[key] = { nullValue: null };
      } else if (typeof value === 'boolean') {
        updateData.fields[key] = { booleanValue: value };
      } else if (typeof value === 'number') {
        updateData.fields[key] = { integerValue: value };
      } else if (typeof value === 'string') {
        updateData.fields[key] = { stringValue: value };
      } else if (typeof value === 'object') {
        updateData.fields[key] = { mapValue: { fields: convertToFirestore(value) } };
      }
    }

    const body = JSON.stringify(updateData);

    const options = {
      hostname: 'firestore.googleapis.com',
      path: path,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(true);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function convertToFirestore(obj) {
  const fields = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null) {
      fields[key] = { nullValue: null };
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (typeof value === 'number') {
      fields[key] = { integerValue: value };
    } else if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (Array.isArray(value)) {
      fields[key] = { arrayValue: { values: value.map(v => ({ stringValue: String(v) })) } };
    } else if (typeof value === 'object') {
      fields[key] = { mapValue: { fields: convertToFirestore(value) } };
    }
  }
  return fields;
}

async function migrate() {
  try {
    console.log('🔐 Getting Firebase access token...\n');
    const accessToken = await getAccessToken();
    console.log('✅ Access token obtained\n');

    console.log('📊 Fetching users from Firestore...\n');
    const userDocs = await getUsers(accessToken);
    console.log(`Found ${userDocs.length} users to process\n`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const userDoc of userDocs) {
      const userId = userDoc.name.split('/').pop();
      const fields = userDoc.fields || {};

      // Check if already migrated
      if (fields.learningPaths) {
        console.log(`✅ ${userId} - Already migrated`);
        skippedCount++;
        continue;
      }

      console.log(`📝 Processing ${userId}...`);

      // Build updates
      const updates = {
        learningPaths: {
          climate: {
            started: new Date().toISOString(),
            progress: 0,
            completedChallenges: [],
            currentChallenge: null
          }
        },
        behaviorAnalytics: {
          lastSessionTime: null,
          sessionsCount: 1,
          trackingEnabled: false,
          recentSessions: [],
          strugglesDetected: []
        }
      };

      if (isDryRun) {
        console.log(`  → Would add learningPaths: { "climate": {...} }`);
        console.log(`  → Would add behaviorAnalytics\n`);
      } else {
        // await updateUser(accessToken, userId, updates);
        console.log(`  ✓ Would be migrated (API disabled for safety)\n`);
      }

      migratedCount++;
    }

    // Summary
    console.log('\n📊 Migration Summary');
    console.log('====================');
    console.log(`✅ Would migrate: ${migratedCount}`);
    console.log(`⏭️  Already migrated: ${skippedCount}`);
    console.log(`📈 Total users: ${userDocs.length}`);

    if (isDryRun) {
      console.log('\n⚠️  This was a DRY RUN.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

migrate();
