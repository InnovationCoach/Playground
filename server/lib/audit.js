import { FieldValue } from 'firebase-admin/firestore';

/**
 * Audit log entry written server-side (source: 'server').
 * Never allows client modification.
 */
export async function writeAuditLog(db, { caller, subjectUid, action, summary, details = {}, schoolId = null }) {
  const orgId = caller?.orgId || 'org-welearn';
  const actorUid = caller?.uid || 'server';
  const actorName = caller?.displayName || caller?.name || caller?.email || 'Server Admin';
  const actorPublicId = caller?.publicId || null;

  const logRef = db.collection('auditLogs').doc();
  const entry = {
    logId: logRef.id,
    source: 'server',
    orgId,
    schoolId,
    subjectUid,
    action,
    actorUid,
    actorName,
    actorPublicId,
    summary,
    details,
    createdAt: FieldValue.serverTimestamp()
  };

  await logRef.set(entry);
  return entry;
}
