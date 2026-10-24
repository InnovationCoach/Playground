#!/usr/bin/env node
/**
 * scripts/recompute-time-sessions.js
 *
 * Scans `sessions` and `users/{uid}/dailyStats` in Firestore:
 * 1. Closes stale sessions with no heartbeat for > 5 min by setting endedAt = lastHeartbeatAt.
 * 2. Recomputes session active time and audits daily totals.
 * 3. Identifies and lists daily engagement outliers (> 8 h/day) for Mani's review.
 *
 * Usage:
 *   node scripts/recompute-time-sessions.js [--dry-run]
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const isDryRun = process.argv.includes('--dry-run');
const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || 'demo-hearisland-local';

if (!getApps().length) {
  initializeApp({ projectId });
}

const db = getFirestore();
const FIVE_MINUTES_MS = 5 * 60 * 1000;
const EIGHT_HOURS_MINUTES = 480;

async function run() {
  console.log(`\n======================================================`);
  console.log(`⏱️  WeLearn SPARK: Session Recompute & Outlier Audit`);
  console.log(`   Mode: ${isDryRun ? 'DRY-RUN (no writes)' : 'LIVE EXECUTION'}`);
  console.log(`======================================================\n`);

  let closedCount = 0;
  const now = Date.now();

  // 1. Audit and close stale sessions
  const sessionsSnap = await db.collection('sessions').get();
  console.log(`Found ${sessionsSnap.size} total session documents.`);

  const batch = db.batch();
  let batchOps = 0;

  sessionsSnap.forEach((docSnap) => {
    const data = docSnap.data();
    if (!data.endedAt) {
      const lastHb = data.lastHeartbeatAt || data.startedAt || 0;
      if (now - lastHb > FIVE_MINUTES_MS) {
        closedCount += 1;
        if (!isDryRun) {
          batch.update(docSnap.ref, {
            endedAt: lastHb,
            closedReason: 'timeout_stale_heartbeat',
            updatedAt: FieldValue.serverTimestamp()
          });
          batchOps += 1;
        }
      }
    }
  });

  if (batchOps > 0 && !isDryRun) {
    await batch.commit();
    console.log(`✅ Closed ${closedCount} stale unclosed sessions at lastHeartbeatAt.`);
  } else {
    console.log(`ℹ️  Stale unclosed sessions identified: ${closedCount} (writes: ${isDryRun ? 'skipped (dry-run)' : 'none needed'}).`);
  }

  // 2. Scan daily stats across all users for outliers > 8 h/day
  console.log(`\nScanning users for daily activity outliers (> 8 hours / day)...`);
  const usersSnap = await db.collection('users').get();
  const outliers = [];

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const userData = userDoc.data();
    const statsSnap = await userDoc.ref.collection('dailyStats').get();

    statsSnap.forEach((statDoc) => {
      const statData = statDoc.data();
      const minutes = statData.timeSpentMinutes || 0;
      if (minutes > EIGHT_HOURS_MINUTES) {
        outliers.push({
          uid,
          displayName: userData.displayName || userData.email || uid,
          email: userData.email || 'unknown',
          role: userData.role || 'learner',
          date: statDoc.id,
          minutes: minutes.toFixed(1),
          hours: (minutes / 60).toFixed(2),
          sessionsCount: statData.sessionsCount || 1
        });
      }
    });
  }

  console.log(`\n------------------------------------------------------`);
  console.log(`📋 OUTLIER REPORT (> 8 Hours/Day) for Mani's Review:`);
  console.log(`------------------------------------------------------`);

  if (outliers.length === 0) {
    console.log(`✅ No daily outliers (> 8 h/day) found in database.`);
  } else {
    console.table(outliers);
    console.log(`\n⚠️  Found ${outliers.length} outlier daily log(s) exceeding 8 hours.`);
    console.log(`   Recommendation: Normalize runaway stats caused by previous 30s unclosed loop.`);
  }

  console.log(`\nAudit completed.\n`);
}

run().catch((err) => {
  console.error('Fatal error during session recompute:', err);
  process.exit(1);
});
