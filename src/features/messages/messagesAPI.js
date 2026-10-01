import { db, storage, serverTimestamp, collection, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, getDocs, getDoc, onSnapshot, arrayUnion, arrayRemove } from '../../firebase.js';

/**
 * Start a new conversation (coach-initiated only).
 * @param {string} coachId - Coach's UID (must match auth)
 * @param {string} studentId - Student's UID
 * @returns {Promise<string>} Conversation ID
 */
export async function startConversation(coachId, studentId) {
  const docRef = await addDoc(collection(db, 'conversations'), {
    coachId,
    studentId,
    participantIds: [coachId, studentId],
    createdBy: coachId,
    createdAt: serverTimestamp(),
    lastMessageAt: null,
    lastMessagePreview: '',
    unread: {
      [studentId]: 0
    }
  });
  return docRef.id;
}

/**
 * Get conversations for the signed-in user (coach or student).
 */
export async function getConversations(userId) {
  const q = query(
    collection(db, 'conversations'),
    where('participantIds', 'array-contains', userId),
    orderBy('lastMessageAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Listen to conversations in real-time.
 */
export function onConversationsChanged(userId, callback) {
  const q = query(
    collection(db, 'conversations'),
    where('participantIds', 'array-contains', userId),
    orderBy('lastMessageAt', 'desc')
  );
  return onSnapshot(q, snap => {
    const convs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(convs);
  });
}

/**
 * Get a single conversation.
 */
export async function getConversation(conversationId) {
  const docSnap = await getDoc(doc(db, 'conversations', conversationId));
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
}

/**
 * Send a message with optional media.
 */
export async function sendMessage(conversationId, senderId, text, files = []) {
  const media = [];

  // Upload files
  for (const file of files) {
    const filePath = `messages/${conversationId}/${Date.now()}_${file.name}`;
    const storageRef = storage.ref(filePath);
    await storageRef.put(file);
    const url = await storageRef.getDownloadURL();

    media.push({
      url,
      storagePath: filePath,
      type: file.type.startsWith('video/') ? 'video' : 'image',
      mimeType: file.type,
      sizeBytes: file.size
    });
  }

  // Add message
  const msgRef = await addDoc(collection(db, `conversations/${conversationId}/messages`), {
    senderId,
    text,
    media,
    createdAt: serverTimestamp(),
    deletedBySender: false
  });

  // Update conversation's lastMessage*
  await updateDoc(doc(db, 'conversations', conversationId), {
    lastMessageAt: serverTimestamp(),
    lastMessagePreview: text.substring(0, 50)
  });

  return msgRef.id;
}

/**
 * Get messages for a conversation.
 */
export async function getMessages(conversationId) {
  const q = query(
    collection(db, `conversations/${conversationId}/messages`),
    orderBy('createdAt', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Listen to messages in real-time.
 */
export function onMessagesChanged(conversationId, callback) {
  const q = query(
    collection(db, `conversations/${conversationId}/messages`),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, snap => {
    const messages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(messages);
  });
}

/**
 * Soft-delete a message (mark as deletedBySender: true).
 */
export async function deleteMessage(conversationId, messageId) {
  await updateDoc(doc(db, `conversations/${conversationId}/messages`, messageId), {
    deletedBySender: true
  });
}

/**
 * Mark unread count as 0 for a user in a conversation.
 */
export async function markAsRead(conversationId, userId) {
  const convDoc = doc(db, 'conversations', conversationId);
  await updateDoc(convDoc, {
    [`unread.${userId}`]: 0
  });
}

/**
 * Get all conversations (admin audit view - rules gate this to admins only).
 */
export async function getAllConversationsForAudit() {
  const snap = await getDocs(collection(db, 'conversations'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Get all messages in a conversation (admin audit view - rules gate this to admins only).
 */
export async function getAllMessagesForAudit(conversationId) {
  const snap = await getDocs(collection(db, `conversations/${conversationId}/messages`));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
