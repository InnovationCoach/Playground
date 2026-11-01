// Offline stand-in for src/firebase.js in preview pages: nothing here can reach a Firebase project.
export const db = null;
export const usingEmulators = false;
export const doc = () => null;
export const getDoc = async () => ({ exists: () => false, data: () => null });
export const setDoc = async () => {};
