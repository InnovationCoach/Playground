/**
 * FERPA / COPPA Audit Logger Utility for Education Platform Compliance
 * Records coach data access, roster exports, and feedback actions to Firestore audit logs.
 */
import { db, collection, addDoc, serverTimestamp } from '../firebase.js';

export async function logAuditEvent(eventType, details = {}) {
  try {
    const user = typeof firebase !== 'undefined' && firebase.auth ? firebase.auth().currentUser : null;
    const actorId = user ? user.uid : 'anonymous';
    const actorEmail = user ? user.email : 'unknown';

    const logEntry = {
      eventType: eventType, // e.g. 'COACH_STUDENT_WORK_INSPECTED', 'COACH_ROSTER_EXPORTED', 'COACH_FEEDBACK_SENT'
      actorId: actorId,
      actorEmail: actorEmail,
      details: details,
      timestamp: serverTimestamp ? serverTimestamp() : Date.now(),
      environment: window.location.hostname
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
