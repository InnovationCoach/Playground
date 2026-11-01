import { hydratePlan } from '../../src/features/goals/goalPlan.js';
export const db = {};
export const usingEmulators = true;
export const auth = { currentUser: { uid: 'preview-student' } };
const plan = hydratePlan({ version: 1, updatedAt: Date.now(), goals: [
  { id: 'g1', explore: 'Turn my garden idea into a working prototype', steps: [{ id: 's1', text: 'Sketch two ideas for a water sensor', done: true, quest: { kind: 'own', title: 'Sketch sensors with my sister' } }, { id: 's2', text: 'Build and test the circuit', done: false, quest: { kind: 'project', title: 'My PBL Studio term project' } }, { id: 's3b', text: 'Ask my coach for feedback', done: false }], supports: [], createdAt: 1 },
  { id: 'g2', explore: 'Keep a record of my first investigation', done: true, steps: [{ id: 's3', text: 'Write my first reflection', done: true }], supports: [], createdAt: 1 }
] });
const data = new Map([['users/preview-student', { goalPlan: plan }]]);
export const doc = (_db, ...parts) => ({ path: parts.join('/') });
export const collection = doc;
export const getDoc = async (ref) => ({ exists: data.has(ref.path), data: () => data.get(ref.path) });
export const setDoc = async (ref, value) => { data.set(ref.path, value); };
export const deleteDoc = async (ref) => { data.delete(ref.path); };
export const updateDoc = setDoc;
export const arrayUnion = (...values) => values;
export const serverTimestamp = () => Date.now();
export const runTransaction = async (_db, fn) => fn({ get: getDoc, set: setDoc, update: updateDoc, delete: deleteDoc });
export const getAuthClaims = async () => ({ role: location.search.includes('admin=1') ? 'admin' : 'student' });
export const increment = (n) => n;
// Read calls used by the Find a Quest slide (catalogue and "Added" courses). Offline: always empty.
export const query = (ref) => ref;
export const where = () => null;
export const limit = () => null;
export const orderBy = () => null;
export const getDocs = async () => ({ forEach() {}, docs: [], empty: true, size: 0 });
export const onSnapshot = () => () => {};
export const addDoc = async () => ({ id: 'preview' });
export const writeBatch = () => ({ set() {}, update() {}, delete() {}, commit: async () => {} });
export const storage = {};
