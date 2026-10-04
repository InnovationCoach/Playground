import { TERM } from '../../src/features/pbl/content/pblModel.js';
import { newProject } from '../../src/features/pbl/engine/pblProject.js';

export const db = {};
export const collection = (_, ...parts) => parts.join('/');
export const doc = (_, ...parts) => parts.join('/');
export const where = (field, operator, value) => ({ field, operator, value });
export const query = (path, filter) => ({ path, filter });
const scenario = new URLSearchParams(location.search).get('scenario') || 'ready';
const now = Date.UTC(2026, 9, 2, 7);
const project = {
  ...newProject(TERM.id), currentPhase: 'define', updatedAt: now, tasksDone: { explore: [0, 1], empathise: [0, 1, 2], define: [0] },
  problem: { hmw: 'How might we keep the school courtyard cool without wasting water?', who: 'Students in the courtyard', why: 'Hot afternoons', criteria: 'Compare shaded and unshaded temperatures', constraints: 'Use locally available materials', impactMeasure: 'Daily temperature readings' },
  evidence: [{ id: 'preview-evidence', phase: 'empathise', kind: 'note', title: 'What we heard in the courtyard', body: 'We interviewed three classmates. They avoid the courtyard after lunch because the benches are too hot. We will compare shaded and unshaded seating.', link: '', competencies: [], createdAt: now - 86400000 }]
};
const learners = [
  { uid: 'preview-mia', role: 'student', displayName: 'Mia Chen', email: 'mia@example.test', classIds: ['class-preview-a'], groupName: 'Climate Studio · Year 9' },
  { uid: 'preview-arun', role: 'student', displayName: 'Arun Patel', email: 'arun@example.test', classIds: ['class-preview-a'], groupName: 'Climate Studio · Year 9' },
  { uid: 'preview-sofia', role: 'student', displayName: 'Sofia Wang', email: 'sofia@example.test', classIds: ['class-preview-b'], groupName: 'Engineering Studio · Year 12' }
];
const records = {
  'preview-mia': { [`pbl-${TERM.id}`]: project, 'solar-car': { version: 2, teamName: 'Sun Sprinters', runs: [{ id: 'r1', seconds: '4.8' }, { id: 'r2', seconds: '4.5' }, { id: 'r3', seconds: '' }], parts: [{ id: 'p1', name: 'Chassis', grams: 92 }], reflection: 'The lighter chassis improved our time. Next we will keep the panel angle fixed to make the comparison fair.', updatedAt: now } },
  'preview-arun': { 'urban-heat': { score: 0, completed: false, cooling: 0, updatedAt: now } },
  'preview-sofia': { [`pbl-${TERM.id}`]: { ...project, currentPhase: 'test' }, 'plant-lab': { records: [{ id: 'lab1', title: 'Leaf stomata', notes: 'I noticed more stomata on the underside of the leaf.' }], updatedAt: now } }
};
const snapshot = items => ({ docs: items.map(([id, value]) => ({ id, data: () => value })) });
export async function getAuthClaims() { return { role: 'teacher', classIds: scenario === 'unassigned' ? [] : ['class-preview-a', 'class-preview-b'] }; }
export const auth = { currentUser: { async getIdTokenResult() { return { claims: await getAuthClaims() }; } } };
export async function getDoc(path) { return { exists: () => true, data: () => ({ name: path.endsWith('class-preview-a') ? 'Climate Studio · Year 9' : 'Engineering Studio · Year 12' }) }; }
export async function getDocs(request) {
  if (scenario === 'error') throw { code: 'permission-denied' };
  if (typeof request === 'object') return snapshot(scenario === 'empty' ? [] : learners.filter(l => l.classIds.some(id => request.filter.value.includes(id))).map(l => [l.uid, l]));
  return snapshot(Object.entries(records[request.split('/')[1]] || {}));
}
