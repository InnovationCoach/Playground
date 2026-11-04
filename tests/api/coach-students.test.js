import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { setupApiTestEnv } from './api-test-helper.js';

describe('Coach student provisioning', () => {
  let env, tokens = {}, createdUid;
  const schoolId = 'provision-school', classId = 'provision-class', other = 'provision-other';
  const payload = email => ({ displayName: 'Anna', email, classId, ageBand: '16-18' });
  const post = (role, body) => env.request('POST', '/api/coach/students', { token: tokens[role], body });
  beforeAll(async () => {
    env = await setupApiTestEnv();
    await env.db.collection('schools').doc(schoolId).set({ orgId: 'org-welearn', name: 'Pilot' });
    for (const id of [classId, other]) await env.db.collection('classes').doc(id).set({ schoolId, name: id });
    for (const [name, role, classIds] of [['coach','teacher',[classId]], ['admin','admin',[]], ['student','student',[classId]], ['parent','parent',[]], ['other','coach',[other]], ['supervisor','supervisor',[]]]) {
      const uid = `provision-${name}`, claims = { role, schoolIds: [schoolId], classIds, orgId: 'org-welearn' };
      await env.db.collection('users').doc(uid).set({ uid, ...claims, status: 'active' });
      tokens[name] = await env.getIdToken(uid, claims);
    }
    for (const email of ['anna@pilot.test','admin-student@pilot.test','rollback@pilot.test','reassigned@pilot.test']) {
      try {
        const user = await env.auth.getUserByEmail(email);
        await env.db.collection('users').doc(user.uid).delete();
        await env.auth.deleteUser(user.uid);
      } catch (error) { if (error.code !== 'auth/user-not-found') throw error; }
    }
  });
  afterAll(async () => { vi.restoreAllMocks(); await env?.teardown(); });
  it('denies unsigned, student, parent, supervisor and unrelated coaches', async () => {
    expect((await env.request('POST', '/api/coach/students', { body: payload('blocked@pilot.test') })).status).toBe(401);
    for (const role of ['student','parent','supervisor','other']) expect((await post(role, payload('blocked@pilot.test'))).status).toBe(403);
    await expect(env.auth.getUserByEmail('blocked@pilot.test')).rejects.toMatchObject({ code: 'auth/user-not-found' });
  });
  it('lists only verified classes and refuses privilege fields', async () => {
    const result = await env.request('GET', '/api/coach/students/classes', { token: tokens.coach });
    expect(result.body.items.map(c => c.id)).toEqual([classId]);
    for (const extra of [{ role: 'admin' }, { password: 'SharedPassword' }, { schoolIds: ['foreign'] }]) expect((await post('coach', { ...payload('blocked@pilot.test'), ...extra })).status).toBe(400);
  });
  it('creates a persistent student with claims, class assignment and a real password setup link', async () => {
    const result = await post('coach', payload('anna@pilot.test'));
    expect(result.status).toBe(201);
    expect(result.body.delivery).toBe('manual');
    expect(result.body.setupLink).toContain('mode=resetPassword');
    createdUid = result.body.student.uid;
    const profile = (await env.db.collection('users').doc(createdUid).get()).data();
    expect(profile).toMatchObject({ role: 'student', classIds: [classId], schoolIds: [schoolId], ageBand: '16-18', status: 'pending' });
    expect((await env.auth.getUser(createdUid)).customClaims).toMatchObject({ role: 'student', classIds: [classId] });
    expect((await env.db.collection('users').doc(createdUid).collection('activityProgress').get()).empty).toBe(true);
    const roster = await env.db.collection('users').where('classIds', 'array-contains', classId).get();
    expect(roster.docs.some(d => d.id === createdUid)).toBe(true);
    expect((await post('coach', payload('anna@pilot.test'))).status).toBe(409);
  });
  it('can recover setup links only for an unused student in the assigned class', async () => {
    const path = `/api/coach/students/${createdUid}/setup-link`;
    expect((await env.request('POST', path, { token: tokens.other, body: {} })).status).toBe(403);
    const recovered = await env.request('POST', path, { token: tokens.coach, body: {} });
    expect(recovered.status, JSON.stringify(recovered.body)).toBe(200);
    expect(recovered.body.setupLink).toContain('mode=resetPassword');
    const link = await env.request('POST', path, { token: tokens.coach, body: {} });
    const code = new URL(link.body.setupLink).searchParams.get('oobCode');
    const response = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=fake-key`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ oobCode:code, newPassword:'Unique-pilot-password-7621' }) });
    expect(response.status).toBe(200);
    const signIn = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-key`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email:'anna@pilot.test', password:'Unique-pilot-password-7621', returnSecureToken:true }) });
    expect(signIn.status).toBe(200);
    expect((await env.request('POST', path, { token: tokens.coach, body: {} })).status).toBe(409);
  });
  it('allows an administrator to create a student in their school', async () => {
    expect((await post('admin', { ...payload('admin-student@pilot.test'), classId:other })).status).toBe(201);
  });
  it('removes the Auth account if the profile transaction fails', async () => {
    const spy = vi.spyOn(env.db, 'runTransaction').mockRejectedValueOnce(new Error('Simulated database outage'));
    const result = await post('coach', payload('rollback@pilot.test'));
    expect(result.status).toBe(500);
    await expect(env.auth.getUserByEmail('rollback@pilot.test')).rejects.toMatchObject({ code:'auth/user-not-found' });
    spy.mockRestore();
  });
  it('rolls back if the coach loses class access during provisioning', async () => {
    const original = env.auth.generatePasswordResetLink.bind(env.auth);
    const spy = vi.spyOn(env.auth, 'generatePasswordResetLink').mockImplementationOnce(async email => {
      const link = await original(email);
      await env.db.collection('users').doc('provision-coach').update({ classIds:[] });
      return link;
    });
    expect((await post('coach', payload('reassigned@pilot.test'))).status).toBe(403);
    await expect(env.auth.getUserByEmail('reassigned@pilot.test')).rejects.toMatchObject({ code:'auth/user-not-found' });
    spy.mockRestore();
    await env.db.collection('users').doc('provision-coach').update({ classIds:[classId] });
  });
});
