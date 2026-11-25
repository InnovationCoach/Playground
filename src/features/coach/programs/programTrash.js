/**
 * Program Trash: a coach removes a program, SPARK keeps it for TRASH_DAYS, then
 * it is gone for good.
 *
 * Removal is a soft delete. The program keeps its record and gains
 * { deletedAt, deletedBy, purgeAt }. Every list that shows programs skips a
 * trashed one (isProgramTrashed), and the coach can restore it until purgeAt.
 *
 * Two copies of the mark, on purpose:
 *  - On the pbl_programs document, so learners and other devices stop seeing it.
 *    The current rules already let the author update their own program.
 *  - In a local index (TRASH_KEY). Several pages copy pbl_programs back into the
 *    local program store; without the index a stale copy, or a cloud write that
 *    failed, would bring a removed program back.
 *
 * After purgeAt the local copy is deleted and a tombstone stays in the index so
 * a later sync cannot resurrect it. Deleting the Firestore document itself needs
 * the backend (rules say `allow delete: if false`); see
 * docs/PROGRAM-TRASH-CONTRACT-FOR-GEMINI.md.
 */
import { db, auth, doc, setDoc } from '../../../firebase.js';
import { readCustomProgramStore, writeCustomProgramStore, readTrashIndex, writeTrashIndex, isProgramTrashed } from './customProgramsStore.js';

export const TRASH_DAYS = 7;
export const DAY_MS = 24 * 60 * 60 * 1000;
export { isProgramTrashed };

function announce(programId) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pbl-custom-programs-changed', { detail: { programId, trash: true } }));
  }
}

/** Whole days left before a trashed program is removed for good (never below 0). */
export function daysLeft(purgeAt, now = Date.now()) {
  return Math.max(0, Math.ceil((Number(purgeAt) - now) / DAY_MS));
}

/**
 * Whether this coach may remove the program. Built-in WeLearn programs ship
 * with the app and are not the coach's to delete; another coach's program is
 * theirs. The rules on pbl_programs enforce the author check as well.
 */
export function canRemoveProgram(program, uid, builtInIds) {
  if (!program?.id || !uid) return false;
  if (builtInIds?.has(program.id)) return false;
  const author = program.authorId || program.authorUid || null;
  // Local drafts saved before sign-in carry the placeholder 'coach' or no author.
  return !author || author === 'coach' || author === uid;
}

/**
 * Move a program to Trash. Returns { ok, cloudSaved, purgeAt }.
 * `firestore` is injectable for tests; it defaults to the app's db.
 */
export async function trashProgram(program, uid, { now = Date.now(), firestore = db, signedIn = !!auth?.currentUser } = {}) {
  if (!program?.id) return { ok: false, cloudSaved: false };
  const purgeAt = now + TRASH_DAYS * DAY_MS;
  const mark = { deletedAt: now, deletedBy: uid || null, purgeAt };

  const index = readTrashIndex();
  index[program.id] = { id: program.id, title: program.title || program.id, ...mark, state: 'trashed' };
  writeTrashIndex(index);

  const store = readCustomProgramStore();
  if (store[program.id]) {
    store[program.id] = { ...store[program.id], ...mark };
    writeCustomProgramStore(store);
  }

  let cloudSaved = false;
  if (firestore && signedIn) {
    try {
      await setDoc(doc(firestore, 'pbl_programs', program.id), mark, { merge: true });
      cloudSaved = true;
    } catch (err) {
      // A local-only draft has no cloud record, or the device is offline.
      console.warn('[ProgramTrash] Cloud trash mark not saved:', err?.message);
    }
  }
  announce(program.id);
  return { ok: true, cloudSaved, purgeAt };
}

/** Restore a program from Trash. Fails once its 7 days have passed. */
export async function restoreProgram(programId, { now = Date.now(), firestore = db, signedIn = !!auth?.currentUser } = {}) {
  const index = readTrashIndex();
  const entry = index[programId];
  const store = readCustomProgramStore();
  const local = store[programId];
  const purgeAt = entry?.purgeAt ?? local?.purgeAt;
  if (entry?.state === 'purged' || (purgeAt && purgeAt <= now)) return { ok: false, reason: 'expired' };

  delete index[programId];
  writeTrashIndex(index);
  if (local) {
    const { deletedAt, deletedBy, purgeAt: _p, ...rest } = local;
    store[programId] = { ...rest, updatedAt: now };
    writeCustomProgramStore(store);
  }

  let cloudSaved = false;
  if (firestore && signedIn) {
    try {
      await setDoc(doc(firestore, 'pbl_programs', programId), { deletedAt: null, deletedBy: null, purgeAt: null, updatedAt: now }, { merge: true });
      cloudSaved = true;
    } catch (err) {
      console.warn('[ProgramTrash] Cloud restore not saved:', err?.message);
    }
  }
  announce(programId);
  return { ok: true, cloudSaved };
}

/**
 * Remove for good every trashed program past its purgeAt: drop the local copy
 * and leave a tombstone. Returns the ids purged.
 */
export function purgeExpiredPrograms(now = Date.now()) {
  const index = readTrashIndex();
  const store = readCustomProgramStore();
  const purged = [];

  for (const p of Object.values(store)) {
    if (p?.id && p.deletedAt && !index[p.id]) {
      index[p.id] = { id: p.id, title: p.title || p.id, deletedAt: p.deletedAt, deletedBy: p.deletedBy || null, purgeAt: p.purgeAt || p.deletedAt + TRASH_DAYS * DAY_MS, state: 'trashed' };
    }
  }
  for (const entry of Object.values(index)) {
    if (entry.state === 'trashed' && entry.purgeAt <= now) {
      entry.state = 'purged';
      delete entry.title;
      delete store[entry.id];
      purged.push(entry.id);
    }
  }
  writeTrashIndex(index);
  if (purged.length) writeCustomProgramStore(store);
  return purged;
}

/**
 * Programs in Trash that can still be restored, newest first.
 * `remote` adds trashed pbl_programs records seen from Firestore (another device).
 */
export function listTrashedPrograms(remote = [], now = Date.now()) {
  const index = readTrashIndex();
  const store = readCustomProgramStore();
  const out = new Map();
  const consider = (p) => {
    if (!p?.id || !p.deletedAt || out.has(p.id)) return;
    if (index[p.id]?.state === 'purged') return;
    const purgeAt = p.purgeAt || p.deletedAt + TRASH_DAYS * DAY_MS;
    if (purgeAt <= now) return;
    out.set(p.id, { id: p.id, title: p.title || p.id, deletedAt: p.deletedAt, purgeAt, daysLeft: daysLeft(purgeAt, now), authorId: p.authorId || p.authorUid || null });
  };
  Object.values(index).forEach((e) => { if (e.state === 'trashed') consider({ ...store[e.id], ...e }); });
  Object.values(store).forEach(consider);
  remote.forEach(consider);
  return [...out.values()].sort((a, b) => b.deletedAt - a.deletedAt);
}
