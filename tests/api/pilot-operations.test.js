import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { setupApiTestEnv } from './api-test-helper.js';
import { validDate } from '../../server/routes/pilot-operations.js';

describe('Pilot operations', () => {
  let env, tokens = {};
  const orgId = 'pilot-ops-org';
  const call = (role, method, path, body) => env.request(method, `/api/pilot${path}`, { token: tokens[role], body });
  beforeAll(async () => {
    env = await setupApiTestEnv();
    for (const [name, role, org] of [['admin','admin',orgId],['supervisor','supervisor',orgId],['coach','teacher',orgId],['coach2','coach',orgId],['student','student',orgId],['foreign','admin','pilot-other-org'],['forged','student',orgId]]) {
      const uid = `pilot-ops-${name}`;
      await env.db.collection('users').doc(uid).set({ uid, role: name === 'forged' ? 'admin' : role, orgId: org, displayName: name, status: 'active' });
      tokens[name] = await env.getIdToken(uid, { role, orgId: org });
    }
    for (const collection of ['pilotLeave','pilotInventory','pilotAttendance']) {
      const snap = await env.db.collection(collection).where('orgId','==',orgId).get();
      for (const d of snap.docs) await env.db.recursiveDelete(d.ref);
    }
  });
  afterAll(async () => { await env?.teardown(); });
  it('validates actual calendar dates', () => {
    expect(validDate('2026-02-30')).toBe(false);
    expect(validDate('2028-02-29')).toBe(true);
    expect(validDate('2026-11-03')).toBe(true);
  });
  it('denies anonymous, student, and profile-forged administrator access', async () => {
    expect((await env.request('GET','/api/pilot/leave')).status).toBe(401);
    for (const role of ['student','forged']) expect((await call(role,'GET','/leave')).status).toBe(403);
    expect((await call('coach','GET','/attendance?kind=staff&date=2026-11-03')).status).toBe(403);
    expect((await call('supervisor','PUT','/attendance/pilot-ops-student',{})).status).toBe(403);
  });
  it('persists attendance, retains correction history, and isolates organizations', async () => {
    const path = '/attendance/pilot-ops-student';
    expect((await call('admin','PUT',path,{date:'2026-11-03',status:'present',reason:''})).status).toBe(400);
    expect((await call('admin','PUT',path,{date:'2026-11-03',status:'present',reason:'Register taken',note:'Morning'})).status).toBe(200);
    expect((await call('admin','PUT',path,{date:'2026-11-03',status:'late',reason:'Arrived at 9:15',note:'Transport delay'})).status).toBe(200);
    const list = await call('admin','GET','/attendance?kind=students&date=2026-11-03');
    expect(list.body.items.find(r => r.uid === 'pilot-ops-student')).toMatchObject({status:'late',note:'Transport delay'});
    const history = await call('admin','GET',`${path}/history?date=2026-11-03`);
    expect(history.body.items).toHaveLength(2);
    expect(history.body.items.some(r => r.before?.status === 'present' && r.after.status === 'late')).toBe(true);
    expect((await call('foreign','GET',`${path}/history?date=2026-11-03`)).body.items).toEqual([]);
    expect((await call('foreign','PUT',path,{date:'2026-11-03',status:'absent',reason:'Unauthorized'})).status).toBe(404);
    const staff = await call('admin','GET','/attendance?kind=staff&date=2026-11-03');
    expect(staff.body.items.find(r => r.uid === 'pilot-ops-coach')).toMatchObject({status:'unmarked'});
  });
  it('delivers coach requests to admins and returns review decisions only to the requesting coach', async () => {
    const payload = {startDate:'2026-11-10',endDate:'2026-11-11',reason:'Personal leave'};
    expect((await call('coach','POST','/leave',{...payload,endDate:'2026-11-09'})).status).toBe(400);
    const created = await call('coach','POST','/leave',payload);
    expect(created.status).toBe(201);
    const id = created.body.id;
    expect((await call('coach','POST','/leave',payload)).status).toBe(409);
    expect((await call('admin','GET','/leave')).body.items.find(r => r.id === id).status).toBe('pending');
    expect((await call('coach2','GET','/leave')).body.items).toEqual([]);
    expect((await call('foreign','PATCH',`/leave/${id}`,{status:'approved'})).status).toBe(404);
    expect((await call('coach','PATCH',`/leave/${id}`,{status:'approved'})).status).toBe(403);
    expect((await call('admin','PATCH',`/leave/${id}`,{status:'approved',response:'Approved by office'})).status).toBe(200);
    expect((await call('coach','GET','/leave')).body.items.find(r => r.id === id)).toMatchObject({status:'approved',response:'Approved by office'});
    expect((await call('admin','PATCH',`/leave/${id}`,{status:'rejected'})).status).toBe(409);
  });
  it('tracks real inventory with atomic movements, history, and no negative stock', async () => {
    expect((await call('coach','POST','/inventory',{name:'Kits',quantity:3})).status).toBe(403);
    const created = await call('admin','POST','/inventory',{name:'Science kits',location:'Lab',quantity:3,minimum:2});
    expect(created.status).toBe(201);
    const path = `/inventory/${created.body.id}`;
    expect((await call('admin','PATCH',path,{change:-4,reason:'Issue'})).status).toBe(400);
    expect((await call('admin','PATCH',path,{change:-1,reason:'Class use'})).status).toBe(200);
    expect((await call('admin','GET','/inventory')).body.items.find(r => r.id === created.body.id).quantity).toBe(2);
    expect((await call('admin','GET',`${path}/history`)).body.items[0]).toMatchObject({change:-1,quantity:2,reason:'Class use'});
    expect((await call('foreign','GET',`${path}/history`)).status).toBe(404);
    expect((await call('foreign','PATCH',path,{change:1,reason:'Foreign'})).status).toBe(404);
  });
});
