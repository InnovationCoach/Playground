import {
  db, storage, serverTimestamp, collection, addDoc, updateDoc, setDoc, doc, query, where, orderBy, getDocs, getDoc,
  onSnapshot, increment, getAuthClaims
} from '../../firebase.js';
import { kindOf, safeFileName, previewText, MAX_TEXT } from './messageModel.js';

/**
 * Private messages (F3). Two kinds of conversation, both started by a coach
 * and both open to the admin audit view (firestore.rules, match /conversations):
 *   direct - one coach and one student;
 *   class  - a coach-moderated group chat for a class, id `class_<classId>`.
 * Attachments live at messages/{convId}/{msgId}/{file}, readable only by the
 * conversation's members (storage.rules).
 */

/**
 * Start a new direct conversation (coach-initiated only; the rules enforce it).
 * Names are stored on the conversation because a student cannot read the
 * coach's user document, and the list needs something to display.
 */
export async function startConversation(coachId, studentId, { coachName = '', studentName = '' } = {}) {
  const docRef = await addDoc(collection(db, 'conversations'), {
    type: 'direct',
    coachId,
    studentId,
    coachName,
    studentName,
    participantIds: [coachId, studentId],
    createdBy: coachId,
    createdAt: serverTimestamp(),
    // Not null: the list orders by this field, and a fresh thread should sort first.
    lastMessageAt: serverTimestamp(),
    lastMessagePreview: '',
    unread: { [studentId]: 0 }
  });
  return docRef.id;
}

export { conversationTitle as otherParticipantName } from './messageModel.js';

/** The classes this coach teaches, from the signed classIds claim the rules also check. */
export async function loadMyClasses() {
  const claims = await getAuthClaims();
  const ids = Array.isArray(claims.classIds) ? claims.classIds.filter(Boolean).slice(0, 30) : [];
  const classes = await Promise.all(ids.map(async (id) => {
    try {
      const snap = await getDoc(doc(db, 'classes', id));
      return { id, name: (snap.exists ? snap.data()?.name : '') || id };
    } catch {
      return { id, name: id };
    }
  }));
  return classes.sort((a, b) => a.name.localeCompare(b.name));
}

/** Students enrolled in one class, for the class chat's member list. */
export async function loadClassStudents(classId) {
  const snap = await getDocs(query(collection(db, 'users'), where('classIds', 'array-contains-any', [classId])));
  const list = [];
  snap.forEach((d) => {
    const data = d.data();
    if ((data.role || 'student') === 'student') list.push({ id: d.id, name: data.displayName || data.email?.split('@')[0] || 'Student' });
  });
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

export const classChatId = (classId) => `class_${classId}`;

/**
 * Open the class chat, creating it the first time. Every open refreshes the
 * member list from current enrolment, so new joiners are added and leavers
 * removed. Returns the conversation id.
 */
export async function openClassChat({ coachId, coachName, classId, className }) {
  const students = await loadClassStudents(classId);
  const participantIds = [coachId, ...students.map((s) => s.id).filter((id) => id !== coachId)].slice(0, 80);
  const memberNames = Object.fromEntries([[coachId, coachName || 'Coach'], ...students.map((s) => [s.id, s.name])]);
  const id = classChatId(classId);
  const ref = doc(db, 'conversations', id);
  let existing = null;
  try {
    const snap = await getDoc(ref);
    existing = snap.exists ? snap.data() : null;
  } catch {
    throw new Error('This class already has a chat run by another coach. Ask them to add you.');
  }
  if (existing) {
    if (existing.coachId !== coachId) throw new Error('This class chat is run by another coach.');
    await updateDoc(ref, { participantIds, memberNames, title: className || existing.title });
  } else {
    await setDoc(ref, {
      type: 'class',
      classId,
      title: className || 'Class chat',
      coachId,
      coachName: coachName || '',
      createdBy: coachId,
      participantIds,
      memberNames,
      createdAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
      lastMessagePreview: '',
      unread: {}
    });
  }
  return id;
}

/** Listen to the signed-in user's conversations, newest first. */
export function onConversationsChanged(userId, callback, onError) {
  const q = query(
    collection(db, 'conversations'),
    where('participantIds', 'array-contains', userId),
    orderBy('lastMessageAt', 'desc')
  );
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), onError);
}

/** Listen to one conversation document (title, members, unread). */
export function onConversationChanged(conversationId, callback, onError) {
  return onSnapshot(doc(db, 'conversations', conversationId), (snap) => {
    callback(snap.exists ? { id: snap.id, ...snap.data() } : null);
  }, onError);
}

export async function getConversation(conversationId) {
  const docSnap = await getDoc(doc(db, 'conversations', conversationId));
  // Compat SDK: `exists` is a property, not a method.
  return docSnap.exists ? { id: docSnap.id, ...docSnap.data() } : null;
}

function uploadOne(path, blob, contentType, onProgress) {
  return new Promise((resolve, reject) => {
    const ref = storage.ref(path);
    const task = ref.put(blob, { contentType });
    task.on('state_changed',
      (s) => onProgress?.(s.bytesTransferred, s.totalBytes),
      reject,
      async () => { try { resolve(await ref.getDownloadURL()); } catch (e) { reject(e); } });
  });
}

/**
 * Send a message: text, up to five files and/or one voice note.
 * The message id is chosen first so attachments land in its folder, which is
 * the path the storage rules accept. onProgress(fraction) covers all uploads.
 */
export async function sendChatMessage(conv, sender, { text = '', files = [], voice = null } = {}, onProgress) {
  const body = String(text || '').slice(0, MAX_TEXT);
  const msgRef = db.collection(`conversations/${conv.id}/messages`).doc();
  const uploads = [
    ...files.map((f) => ({ blob: f, name: f.name, type: f.type, kind: kindOf(f.type), size: f.size })),
    ...(voice ? [{ blob: voice.blob, name: `voice-${Date.now()}.${voice.mimeType.includes('mp4') ? 'm4a' : voice.mimeType.includes('ogg') ? 'ogg' : 'webm'}`,
      type: voice.mimeType, kind: 'audio', size: voice.blob.size, durationSec: voice.durationSec }] : [])
  ];
  const total = uploads.reduce((n, u) => n + u.size, 0) || 1;
  const done = new Array(uploads.length).fill(0);

  // One at a time: each upload is checked against the conversation's members
  // (a cross-service rule), and the local storage emulator drops one of two
  // checks that arrive together. Five files at most, so the cost is small.
  const attachments = [];
  for (const [i, u] of uploads.entries()) {
    const path = `messages/${conv.id}/${msgRef.id}/${i}_${safeFileName(u.name)}`;
    const url = await uploadOne(path, u.blob, u.type, (sent) => {
      done[i] = sent;
      onProgress?.(done.reduce((a, b) => a + b, 0) / total);
    });
    attachments.push({
      kind: u.kind, url, storagePath: path, name: u.name || '', mimeType: u.type, sizeBytes: u.size,
      ...(u.durationSec ? { durationSec: Math.round(u.durationSec) } : {})
    });
  }

  await msgRef.set({
    senderId: sender.uid,
    senderName: sender.name || '',
    text: body,
    attachments,
    createdAt: serverTimestamp(),
    deletedBySender: false
  });

  const unread = Object.fromEntries((conv.participantIds || []).filter((id) => id !== sender.uid).map((id) => [`unread.${id}`, increment(1)]));
  await updateDoc(doc(db, 'conversations', conv.id), {
    lastMessageAt: serverTimestamp(),
    lastMessagePreview: previewText(body, attachments),
    lastSenderId: sender.uid,
    lastSenderName: sender.name || '',
    ...unread
  });
  return msgRef.id;
}

/** Older signature, kept for callers that only send text to a direct chat. */
export async function sendMessage(conversationId, senderId, text, files = []) {
  const conv = await getConversation(conversationId);
  return sendChatMessage(conv, { uid: senderId, name: '' }, { text, files });
}

export function onMessagesChanged(conversationId, callback, onError) {
  const q = query(collection(db, `conversations/${conversationId}/messages`), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), onError);
}

/** Soft-delete a message (mark as deletedBySender: true). */
export async function deleteMessage(conversationId, messageId) {
  await updateDoc(doc(db, `conversations/${conversationId}/messages`, messageId), { deletedBySender: true });
}

/** Mark the conversation read for this user. */
export async function markAsRead(conversationId, userId) {
  await updateDoc(doc(db, 'conversations', conversationId), { [`unread.${userId}`]: 0 });
}

/** All conversations (admin audit view - rules gate this to admins only). */
export async function getAllConversationsForAudit() {
  const snap = await getDocs(collection(db, 'conversations'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** All messages in a conversation (admin audit view - rules gate this to admins only). */
export async function getAllMessagesForAudit(conversationId) {
  const snap = await getDocs(collection(db, `conversations/${conversationId}/messages`));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
