import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, describe, it } from 'vitest';
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';

describe('Pathway assessments remain API-only', () => {
  let env;
  beforeAll(async () => {
    env = await initializeTestEnvironment({ projectId: 'demo-hearisland-pathway-rules', firestore: {
      host: '127.0.0.1', port: 8088, rules: readFileSync('firestore.rules', 'utf8')
    } });
  });
  afterAll(async () => env?.cleanup());
  for (const role of ['student', 'coach', 'admin']) it(`denies direct reads and forged decisions for ${role}`, async () => {
    const db = env.authenticatedContext('pathway-user', { role, schoolIds: ['school'], classIds: ['class'] }).firestore();
    for (const path of ['schools/school/learnerPathways/learner/classes/class',
      'schools/school/learnerPathways/learner/classes/class/mastery/sdl-01',
      'schools/school/learnerPathways/learner/classes/class/decisions/forged']) {
      await assertFails(getDoc(doc(db, path)));
      await assertFails(setDoc(doc(db, path), { state: 'confirmed', competencyId: 'sdl-01' }));
    }
  });
});
