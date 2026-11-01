/**
 * FERPA / COPPA Audit Logger Utility for Education Platform Compliance
 * Records coach data access, roster exports, and feedback actions to Firestore audit logs.
 * Includes deduplication by uid + eventType + route + minute (P1-12).
 */
import { db, collection, addDoc, serverTimestamp } from '../firebase.js';

const recentAuditLogs = new Map(); // dedupeKey -> timestamp

export async function logAuditEvent(eventType, details = {}) {
  try {
    const user = typeof firebase !== 'undefined' && firebase.auth ? firebase.auth().currentUser : null;
    const actorId = user ? user.uid : (details.coachUid || 'anonymous');
    const actorEmail = user ? user.email : 'unknown';
    const route = typeof window !== 'undefined' ? (window.location.hash || '/') : '/';
    const minuteBucket = Math.floor(Date.now() / 60000);
    const dedupeKey = `${actorId}:${eventType}:${route}:${minuteBucket}`;

    if (recentAuditLogs.has(dedupeKey)) {
      return; // Deduplicated
    }
    recentAuditLogs.set(dedupeKey, Date.now());

    // Purge old keys
    if (recentAuditLogs.size > 100) {
      const now = Date.now();
      for (const [k, ts] of recentAuditLogs.entries()) {
        if (now - ts > 120000) recentAuditLogs.delete(k);
      }
    }

    const logEntry = {
      eventType: eventType,
      actorId: actorId,
      actorEmail: actorEmail,
      details: details,
      timestamp: serverTimestamp ? serverTimestamp() : Date.now(),
      environment: typeof window !== 'undefined' ? window.location.hostname : 'node'
    };

    console.log(`[AuditLog] ${eventType}:`, details);

    // Save to Firestore auditLogs collection
    if (db) {
      await addDoc(collection(db, 'auditLogs'), logEntry).catch(err => {
        console.warn('[AuditLog] Firestore write failed:', err.message);
      });
    }
  } catch (err) {
    console.warn('[AuditLog] Error recording audit event:', err.message);
  }
}
