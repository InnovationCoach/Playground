/**
 * Shared Programs library: Firestore reads and writes.
 *
 *   program_library/{programId}                the draft and its status (staff only)
 *   program_library/{programId}/comments/{id}  coach feedback (staff only)
 *   coach_notifications/program-review_{id}    one per program, written with its first save
 *   users/{uid}/notificationReads/{id}         who has read what
 *   pbl_programs/{programId}                   the published copy students read
 *
 * Saves and publishes are transactions: a failure writes nothing, and a repeated
 * click or a retry finds the work already done rather than doing it twice.
 */
import {
  db, doc, getDoc, addDoc, collection, query, where, onSnapshot, runTransaction, writeBatch
} from '../../../firebase.js';
import { normaliseContractProgram } from '../../../services/pblService.js';
import {
  COMMENT_MAX, contentFingerprint, programFromUnit, resolveOrgId, reviewNotificationId,
  sameStageStructure, shortDescription, toStorable
} from './programLibraryModel.js';

const LIBRARY = 'program_library';
const NOTIFICATIONS = 'coach_notifications';

const snapExists = (snap) => (typeof snap.exists === 'function' ? snap.exists() : snap.exists);

function libraryError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

/**
 * Saves the unit as a draft without publishing it. The first save also adds the
 * program to the shared library and tells the other coaches; later saves update
 * the same record and notify nobody.
 */
export async function saveProgramDraft({ unit, actor, orgId, expectedVersion = null, now = Date.now(), dbInstance = db }) {
  if (!actor?.uid) throw new Error('Sign in again before saving.');
  const programId = unit?.id;
  programFromUnit(unit, actor.uid); // Reject an unpublishable unit before any write.
  const content = toStorable(unit);
  const org = resolveOrgId(orgId);
  const recordRef = doc(dbInstance, LIBRARY, programId);

  return runTransaction(dbInstance, async (tx) => {
    const snap = await tx.get(recordRef);

    if (!snapExists(snap)) {
      if (expectedVersion != null) throw libraryError('not-found', 'This program no longer exists.');
      tx.set(recordRef, {
        programId,
        orgId: org,
        creatorUid: actor.uid,
        creatorName: actor.displayName || '',
        title: content.unitTitle,
        description: shortDescription(content),
        unit: content,
        status: 'draft',
        draftVersion: 1,
        publishedVersion: null,
        hasUnpublishedChanges: false,
        createdAt: now,
        updatedAt: now,
        publishedAt: null
      });
      tx.set(doc(dbInstance, NOTIFICATIONS, reviewNotificationId(programId)), {
        type: 'program_review',
        programId,
        orgId: org,
        actorUid: actor.uid,
        actorName: actor.displayName || '',
        programTitle: content.unitTitle,
        createdAt: now
      });
      return { programId, draftVersion: 1, created: true, changed: true };
    }

    const current = snap.data();
    if (contentFingerprint(current.unit) === contentFingerprint(content)) {
      return { programId, draftVersion: current.draftVersion, created: false, changed: false };
    }
    if (expectedVersion != null && expectedVersion !== current.draftVersion) {
      throw libraryError('conflict', 'This draft changed somewhere else. Reopen it before saving, so those changes are not lost.');
    }

    const draftVersion = current.draftVersion + 1;
    tx.update(recordRef, {
      title: content.unitTitle,
      description: shortDescription(content),
      unit: content,
      draftVersion,
      hasUnpublishedChanges: current.status === 'published',
      updatedAt: now
    });
    return { programId, draftVersion, created: false, changed: true };
  });
}

/**
 * Publishes the version the coach just reviewed into pbl_programs, where the
 * existing student discovery and enrolment flow reads it. Refuses a reshaped
 * program: learner progress is keyed by session number, so changing the stages
 * of a live program would silently move completed work.
 */
export async function publishProgramVersion({ programId, reviewedVersion, actor, now = Date.now(), dbInstance = db }) {
  if (!actor?.uid) throw new Error('Sign in again before publishing.');
  const recordRef = doc(dbInstance, LIBRARY, programId);
  const programRef = doc(dbInstance, 'pbl_programs', programId);

  return runTransaction(dbInstance, async (tx) => {
    const snap = await tx.get(recordRef);
    if (!snapExists(snap)) throw libraryError('not-found', 'This program no longer exists.');
    const record = snap.data();

    if (record.draftVersion !== reviewedVersion) {
      throw libraryError('stale-review', 'The draft changed after you opened it. Review the latest version before publishing.');
    }
    if (record.publishedVersion === record.draftVersion) {
      return { programId, version: record.publishedVersion, alreadyPublished: true };
    }

    const { data } = programFromUnit(record.unit, record.creatorUid);
    const liveSnap = await tx.get(programRef);
    if (snapExists(liveSnap)) {
      const live = liveSnap.data();
      if (!sameStageStructure(normaliseContractProgram({ id: programId, ...live }).phases, normaliseContractProgram({ id: programId, ...data }).phases)) {
        throw libraryError('structure-changed', 'The stages of this course changed, and learners may already have progress against them. Restore the published stages, or create a new program.');
      }
      data.createdAt = live.createdAt || data.createdAt;
    }

    tx.set(programRef, {
      ...toStorable(data),
      id: programId,
      status: 'published',
      visibility: 'centre',
      libraryManaged: true,
      libraryVersion: record.draftVersion,
      orgId: record.orgId,
      updatedAt: now
    }, { merge: true });
    tx.update(recordRef, {
      status: 'published',
      publishedVersion: record.draftVersion,
      hasUnpublishedChanges: false,
      publishedAt: record.publishedAt || now,
      lastPublishedAt: now,
      lastPublishedBy: actor.uid,
      updatedAt: now
    });
    return { programId, version: record.draftVersion, alreadyPublished: false };
  });
}

const snapshotDocs = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

export function subscribeProgramLibrary(orgId, onData, onError, { dbInstance = db } = {}) {
  const q = query(collection(dbInstance, LIBRARY), where('orgId', '==', resolveOrgId(orgId)));
  return onSnapshot(q, (snap) => onData(snapshotDocs(snap)), onError);
}

export function subscribeProgramRecord(programId, onData, onError, { dbInstance = db } = {}) {
  return onSnapshot(doc(dbInstance, LIBRARY, programId),
    (snap) => onData(snapExists(snap) ? { id: snap.id, ...snap.data() } : null), onError);
}

export async function getProgramRecord(programId, { dbInstance = db } = {}) {
  const snap = await getDoc(doc(dbInstance, LIBRARY, programId));
  return snapExists(snap) ? { id: snap.id, ...snap.data() } : null;
}

/** Read straight from Firestore, as a learner would, past any local catalogue cache. */
export async function getPublishedProgram(programId, { dbInstance = db } = {}) {
  const snap = await getDoc(doc(dbInstance, 'pbl_programs', programId));
  return snapExists(snap) ? normaliseContractProgram({ id: snap.id, ...snap.data() }) : null;
}

export function subscribeProgramComments(programId, onData, onError, { dbInstance = db } = {}) {
  return onSnapshot(collection(dbInstance, LIBRARY, programId, 'comments'), (snap) => {
    onData(snapshotDocs(snap).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)));
  }, onError);
}

export async function addProgramComment({ programId, orgId, actor, body, view, version, now = Date.now(), dbInstance = db }) {
  const text = String(body || '').trim();
  if (!text) throw new Error('Write your feedback first.');
  if (text.length > COMMENT_MAX) throw new Error(`Feedback must be ${COMMENT_MAX} characters or fewer.`);
  const ref = await addDoc(collection(dbInstance, LIBRARY, programId, 'comments'), {
    authorUid: actor.uid,
    authorName: actor.displayName || '',
    orgId: resolveOrgId(orgId),
    body: text,
    view,
    version,
    createdAt: now
  });
  return ref.id;
}

export function subscribeCoachNotifications(orgId, onData, onError, { dbInstance = db } = {}) {
  const q = query(collection(dbInstance, NOTIFICATIONS), where('orgId', '==', resolveOrgId(orgId)));
  return onSnapshot(q, (snap) => onData(snapshotDocs(snap)), onError);
}

export function subscribeNotificationReads(uid, onData, onError, { dbInstance = db } = {}) {
  return onSnapshot(collection(dbInstance, 'users', uid, 'notificationReads'),
    (snap) => onData(new Set(snap.docs.map((d) => d.id))), onError);
}

export function markNotificationsRead(uid, notificationIds, { now = Date.now(), dbInstance = db } = {}) {
  const batch = writeBatch(dbInstance);
  notificationIds.forEach((id) => {
    batch.set(doc(dbInstance, 'users', uid, 'notificationReads', id), { readAt: now });
  });
  return batch.commit();
}
