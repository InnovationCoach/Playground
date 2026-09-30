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
const USE_EMULATORS = window.__hearIslandUseEmulators === true;

// Fallback only: index.html has normally initialised the app already. This keeps
// the module usable in isolation, e.g. from a test harness.
if (!firebase.apps || !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

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
  if (pathParts.length === 1) {
    return targetDb.doc(pathParts[0]);
  }
  const collectionName = pathParts[0];
  const docPath = pathParts.slice(1).join('/');
  return targetDb.collection(collectionName).doc(docPath);
}

export function setDoc(docRef, data, options) {
  return docRef.set(data, options);
}

export function getDoc(docRef) {
  return docRef.get();
}

export function collection(dbInstance, ...paths) {
  const targetDb = (dbInstance && dbInstance.collection) ? dbInstance : db;
  const pathParts = (dbInstance && dbInstance.collection) ? paths : [dbInstance, ...paths];
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
  return ((dbInstance && dbInstance.batch) ? dbInstance : db).batch();
}

export function serverTimestamp() {
  return firebase.firestore.FieldValue.serverTimestamp();
}

export function increment(n = 1) {
  return firebase.firestore.FieldValue.increment(n);
}

export function arrayUnion(...elements) {
  return firebase.firestore.FieldValue.arrayUnion(...elements);
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

export { auth, db };

export async function registerStudentAccount(email, password, displayName, groupName) {
  const appName = "StudentReg_" + Date.now();
  const secondaryApp = firebase.initializeApp(firebaseConfig, appName);
  try {
    const userCredential = await secondaryApp.auth().createUserWithEmailAndPassword(email, password);
    const studentUser = userCredential.user;

    if (displayName) {
      await studentUser.updateProfile({ displayName });
    }

    const studentData = {
      uid: studentUser.uid,
      email: email,
      displayName: displayName || email.split('@')[0],
      role: 'student',
      groupName: groupName || 'Climate Champions 7A',
      createdAt: Date.now()
    };

    const secondaryDb = secondaryApp.firestore();
    await secondaryDb.collection('users').doc(studentUser.uid).set(studentData);
    await secondaryDb.collection('students').doc(studentUser.uid).set(studentData);

    await secondaryApp.auth().signOut();
    await secondaryApp.delete();

    return studentData;
  } catch (err) {
    try { await secondaryApp.delete(); } catch(e) {}
    throw err;
  }
}


