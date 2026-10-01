import { db, storage, serverTimestamp, increment, collection, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, getDocs, getDoc, writeBatch, arrayUnion } from '../../firebase.js';

/**
 * Create a new post with optional media.
 * @param {string} userId - Author's UID
 * @param {string} userRole - Author's role
 * @param {string} text - Post text
 * @param {File[]} files - Media files to upload
 * @returns {Promise<string>} Post ID
 */
export async function createPost(userId, userRole, text, files = []) {
  const media = [];

  // Upload files to Storage
  for (const file of files) {
    const filePath = `community/${userId}/${Date.now()}_${file.name}`;
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

  const postsRef = collection(db, 'posts');
  const docRef = await addDoc(postsRef, {
    authorId: userId,
    authorRole: userRole,
    text,
    media,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    commentCount: 0,
    reactionCount: 0,
    status: 'visible'
  });

  return docRef.id;
}

/**
 * Update post text/media or status.
 */
export async function updatePost(postId, updates) {
  await updateDoc(doc(db, 'posts', postId), {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

/**
 * Soft-delete a post (mark as removed).
 */
export async function deletePost(postId) {
  await updateDoc(doc(db, 'posts', postId), {
    status: 'removed',
    updatedAt: serverTimestamp()
  });
}

/**
 * Get all visible posts, ordered by newest first.
 */
export async function getPosts() {
  const q = query(
    collection(db, 'posts'),
    where('status', '==', 'visible'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Listen to posts in real-time.
 */
export function onPostsChanged(callback) {
  const q = query(
    collection(db, 'posts'),
    where('status', '==', 'visible'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snap => {
    const posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(posts);
  });
}

/**
 * Add a comment to a post.
 */
export async function addComment(postId, userId, userRole, text) {
  await addDoc(collection(db, `posts/${postId}/comments`), {
    authorId: userId,
    authorRole: userRole,
    text,
    createdAt: serverTimestamp(),
    status: 'visible'
  });

  // Increment comment count on post
  await updateDoc(doc(db, 'posts', postId), {
    commentCount: increment(1)
  });
}

/**
 * Delete a comment (soft-delete).
 */
export async function deleteComment(postId, commentId) {
  await updateDoc(doc(db, `posts/${postId}/comments`, commentId), {
    status: 'removed'
  });

  // Decrement comment count
  await updateDoc(doc(db, 'posts', postId), {
    commentCount: increment(-1)
  });
}

/**
 * Get comments for a post.
 */
export async function getComments(postId) {
  const q = query(
    collection(db, `posts/${postId}/comments`),
    where('status', '==', 'visible'),
    orderBy('createdAt', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Listen to comments in real-time.
 */
export function onCommentsChanged(postId, callback) {
  const q = query(
    collection(db, `posts/${postId}/comments`),
    where('status', '==', 'visible'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, snap => {
    const comments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(comments);
  });
}

/**
 * Add a like reaction (upsert).
 */
export async function likePost(postId, userId) {
  const reactionPath = `posts/${postId}/reactions/${userId}`;
  await updateDoc(doc(db, reactionPath), {
    type: 'like',
    createdAt: serverTimestamp()
  }).catch(() => {
    // If doc doesn't exist, create it
    return addDoc(collection(db, `posts/${postId}/reactions`), {
      type: 'like',
      createdAt: serverTimestamp()
    });
  });

  // Increment reaction count
  await updateDoc(doc(db, 'posts', postId), {
    reactionCount: increment(1)
  });
}

/**
 * Remove a like reaction.
 */
export async function unlikePost(postId, userId) {
  await deleteDoc(doc(db, `posts/${postId}/reactions`, userId));

  // Decrement reaction count
  await updateDoc(doc(db, 'posts', postId), {
    reactionCount: increment(-1)
  });
}

/**
 * Check if user liked a post.
 */
export async function hasUserLiked(postId, userId) {
  const docSnap = await getDoc(doc(db, `posts/${postId}/reactions`, userId));
  return docSnap.exists();
}

/**
 * Get reactions count for a post.
 */
export async function getReactionCount(postId) {
  const q = collection(db, `posts/${postId}/reactions`);
  const snap = await getDocs(q);
  return snap.size;
}

/**
 * Submit a report.
 */
export async function submitReport(targetType, targetPath, reporterId, reason, details = '') {
  await addDoc(collection(db, 'reports'), {
    targetType,
    targetPath,
    reporterId,
    reason,
    details,
    createdAt: serverTimestamp(),
    resolved: false
  });
}
