// Firebase compat SDK (loaded from CDN in index.html)
// These are available from window.firebase

const firebaseConfig = {
  projectId: "dnd-master-73449",
  appId: "1:80880435576:web:00740e29e4181dd7a9488d",
  storageBucket: "dnd-master-73449.firebasestorage.app",
  apiKey: "AIzaSyBpLWqHOfy3A8FTILx4kE4bimhbbwPlOqQ",
  authDomain: "dnd-master-73449.firebaseapp.com",
  messagingSenderId: "80880435576",
  measurementId: "G-FMJH93L0G0"
};

// index.html's inline script owns initializeApp and the emulator wiring: it is a
// classic script and therefore runs before this module, so it would win any
// contest anyway. Duplicating the config here produced a real bug - the module's
// projectId override was silently discarded, sign-in succeeded against the
// emulator while every document read landed in an empty project namespace.
const USE_EMULATORS = typeof window !== 'undefined' && window.__hearIslandUseEmulators === true;

// Fallback only: index.html has normally initialised the app already. This keeps
// the module usable in isolation, e.g. from a test harness.
if (typeof firebase !== 'undefined' && (!firebase.apps || !firebase.apps.length)) {
  firebase.initializeApp(firebaseConfig);
}

const auth = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth() : null;
const db = (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore() : null;
const storage = (typeof firebase !== 'undefined' && firebase.storage) ? firebase.storage() : null;

export const usingEmulators = USE_EMULATORS;

// Auth helper functions (Compat SDK instance wrappers)
export function createUserWithEmailAndPassword(authInstance, email, password) {
  const targetAuth = (authInstance && authInstance.createUserWithEmailAndPassword) ? authInstance : auth;
  const targetEmail = (authInstance && authInstance.createUserWithEmailAndPassword) ? email : authInstance;
  const targetPassword = (authInstance && authInstance.createUserWithEmailAndPassword) ? password : email;
  return targetAuth.createUserWithEmailAndPassword(targetEmail, targetPassword);
}

export function signInWithEmailAndPassword(authInstance, email, password) {
  const targetAuth = (authInstance && authInstance.signInWithEmailAndPassword) ? authInstance : auth;
  const targetEmail = (authInstance && authInstance.signInWithEmailAndPassword) ? email : authInstance;
  const targetPassword = (authInstance && authInstance.signInWithEmailAndPassword) ? password : email;
  return targetAuth.signInWithEmailAndPassword(targetEmail, targetPassword);
}

export function signOut(authInstance) {
  const targetAuth = (authInstance && authInstance.signOut) ? authInstance : auth;
  return targetAuth.signOut();
}

export function onAuthStateChanged(authInstance, callback) {
  const targetAuth = (authInstance && authInstance.onAuthStateChanged) ? authInstance : auth;
  const cb = typeof authInstance === 'function' ? authInstance : callback;
  return targetAuth.onAuthStateChanged(cb);
}

// Firestore helper functions
export function doc(dbInstance, ...paths) {
  const targetDb = (dbInstance && dbInstance.collection) ? dbInstance : db;
  const pathParts = (dbInstance && dbInstance.collection) ? paths : [dbInstance, ...paths];
  if (!targetDb || typeof targetDb.collection !== 'function') {
    return {
      id: pathParts[pathParts.length - 1] || 'mock-doc',
      path: pathParts.join('/'),
      get: async () => ({ exists: false, data: () => null }),
      set: async () => {},
      update: async () => {},
      delete: async () => {}
    };
  }
  if (pathParts.length === 1) {
    return targetDb.doc(pathParts[0]);
  }
  const collectionName = pathParts[0];
  const docPath = pathParts.slice(1).join('/');
  return targetDb.collection(collectionName).doc(docPath);
}

export function setDoc(docRef, data, options) {
  return docRef ? docRef.set(data, options) : Promise.resolve();
}

export function getDoc(docRef) {
  return docRef ? docRef.get() : Promise.resolve({ exists: false, data: () => null });
}

export function collection(dbInstance, ...paths) {
  const targetDb = (dbInstance && dbInstance.collection) ? dbInstance : db;
  const pathParts = (dbInstance && dbInstance.collection) ? paths : [dbInstance, ...paths];
  if (!targetDb || typeof targetDb.collection !== 'function') {
    return {
      id: pathParts[pathParts.length - 1] || 'mock-col',
      path: pathParts.join('/'),
      doc: (id) => doc(null, ...pathParts, id)
    };
  }
  return targetDb.collection(pathParts.join('/'));
}

export function addDoc(collectionRef, data) {
  return collectionRef.add(data);
}

export function getDocs(queryOrRef) {
  return queryOrRef.get();
}

export function updateDoc(docRef, data) {
  return docRef.update(data);
}

export function deleteDoc(docRef) {
  return docRef.delete();
}

/** Atomic multi-document write. Compat: batch.set(ref, data), then batch.commit(). */
export function writeBatch(dbInstance) {
  const target = (dbInstance && dbInstance.batch) ? dbInstance : db;
  if (!target || typeof target.batch !== 'function') {
    return {
      set: () => {},
      update: () => {},
      delete: () => {},
      commit: async () => {}
    };
  }
  return target.batch();
}

/** Read-then-write atomically. Compat: fn receives tx with get/set/update/delete. */
export function runTransaction(dbInstance, fn) {
  return ((dbInstance && dbInstance.runTransaction) ? dbInstance : db).runTransaction(fn);
}

export function serverTimestamp() {
  if (typeof firebase !== 'undefined' && firebase.firestore?.FieldValue?.serverTimestamp) {
    return firebase.firestore.FieldValue.serverTimestamp();
  }
  return new Date();
}

export function increment(n = 1) {
  if (typeof firebase !== 'undefined' && firebase.firestore?.FieldValue?.increment) {
    return firebase.firestore.FieldValue.increment(n);
  }
  return n;
}

export function arrayUnion(...elements) {
  if (typeof firebase !== 'undefined' && firebase.firestore?.FieldValue?.arrayUnion) {
    return firebase.firestore.FieldValue.arrayUnion(...elements);
  }
  return elements;
}

export function arrayRemove(...elements) {
  if (typeof firebase !== 'undefined' && firebase.firestore?.FieldValue?.arrayRemove) {
    return firebase.firestore.FieldValue.arrayRemove(...elements);
  }
  return elements;
}

export function onSnapshot(queryOrRef, callback, errorCallback) {
  return queryOrRef.onSnapshot(callback, errorCallback);
}

/**
 * Modular-style query builders over the compat SDK.
 *
 * Needed so callers can constrain a collection read. Under the hardened rules an
 * unconstrained read of `users` is rejected outright - a coach must ask only for
 * students in their own classes. See CoachDashboard.loadData.
 */
export function query(ref, ...constraints) {
  return constraints.reduce((q, apply) => apply(q), ref);
}

export function where(field, op, value) {
  return (q) => q.where(field, op, value);
}

export function orderBy(field, direction = 'asc') {
  return (q) => q.orderBy(field, direction);
}

export function limit(n) {
  return (q) => q.limit(n);
}

/**
 * Custom claims from the signed-in user's ID token.
 *
 * `role` and `classIds` live here rather than in Firestore: a claim is signed by
 * Firebase Auth and cannot be forged or edited by the client, and reading it
 * costs no document reads. Claims are set by scripts/grant-coach.js and refresh
 * on next sign-in, or immediately with forceRefresh.
 */
export async function getAuthClaims(forceRefresh = false) {
  const user = auth.currentUser;
  if (!user) return {};
  try {
    const result = await user.getIdTokenResult(forceRefresh);
    return result?.claims || {};
  } catch (err) {
    console.warn('[Firebase] Could not read auth claims:', err.message);
    return {};
  }
}

export { auth, db, storage };

export async function registerStudentAccount(email, password, displayName, classId) {
  // 1. Try secure backend endpoint first
  try {
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      const response = await fetch('/api/coach/learners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, password, displayName, classId })
      });
      if (response.ok) {
        return await response.json();
      }
      const errJson = await response.json().catch(() => ({}));
      if (errJson?.message) throw new Error(errJson.message);
    }
  } catch (backendErr) {
    // If running strictly in production, do not fall back
    if (import.meta.env?.PROD) {
      throw backendErr;
    }
    console.warn('[Register] Backend endpoint unavailable, running emulator fallback:', backendErr.message);
  }

  // 2. Emulator fallback (dev only)
  const appName = "StudentReg_" + Date.now();
  const secondaryApp = firebase.initializeApp(firebaseConfig, appName);
  try {
    const finalPassword = password || ('Learner' + Math.random().toString(36).slice(2, 8) + '!1');
    const userCredential = await secondaryApp.auth().createUserWithEmailAndPassword(email, finalPassword);
    const studentUser = userCredential.user;

    if (displayName) {
      await studentUser.updateProfile({ displayName });
    }

    const assignedClassId = classId || 'class_climate_champions_7a';
    const learnerData = {
      uid: studentUser.uid,
      email: email,
      displayName: displayName || email.split('@')[0],
      role: 'learner',
      classIds: [assignedClassId],
      createdAt: Date.now(),
      status: 'active'
    };

    const secondaryDb = secondaryApp.firestore();
    await secondaryDb.collection('users').doc(studentUser.uid).set(learnerData);
    
    // Add to classes/{classId}.learnerIds
    try {
      const classRef = secondaryDb.collection('classes').doc(assignedClassId);
      await classRef.update({
        learnerIds: firebase.firestore.FieldValue.arrayUnion(studentUser.uid),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch {}

    await secondaryApp.auth().signOut();
    await secondaryApp.delete();

    return { ...learnerData, temporaryPassword: finalPassword };
  } catch (err) {
    try { await secondaryApp.delete(); } catch(e) {}
    throw err;
  }
}


