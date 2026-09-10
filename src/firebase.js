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

// Initialize Firebase (compat SDK from CDN)
if (!firebase.apps || !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

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

export function serverTimestamp() {
  return firebase.firestore.FieldValue.serverTimestamp();
}

export function increment(n = 1) {
  return firebase.firestore.FieldValue.increment(n);
}

export function arrayUnion(...elements) {
  return firebase.firestore.FieldValue.arrayUnion(...elements);
}

export { auth, db };

