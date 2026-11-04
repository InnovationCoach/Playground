import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { setupApiTestEnv } from './api-test-helper.js';

describe('API: admin billing and material requests do not invent data', () => {
  let env;
  const orgId = 'org-billing-test';
  const admin = () => env.getIdToken('bm-admin', { role: 'admin', orgId });

  beforeAll(async () => {
    env = await setupApiTestEnv();
    await env.db.collection('users').doc('bm-admin').set({ uid: 'bm-admin', role: 'admin', orgId, displayName: 'Billing Admin', status: 'active' });
    await env.db.collection('users').doc('bm-new').set({ uid: 'bm-new', role: 'student', orgId, displayName: 'New Student', email: 'new@example.test', status: 'active', cohortId: null });
    await env.db.collection('users').doc('bm-billed').set({ uid: 'bm-billed', role: 'student', orgId, displayName: 'Billed Student', status: 'active' });
    await env.db.collection('studentBilling').doc('bm-billed').set({ uid: 'bm-billed', totalTuition: 50000, amountPaid: 20000, remainingBalance: 30000, status: 'partial', nextBillingDate: '2026-12-01' });
  });
  afterAll(async () => { await env?.teardown(); });

  it('shows a student with no billing record as "no_record" with no invented amounts', async () => {
    const res = await env.request('GET', '/api/admin/billing', { token: await admin() });
    expect(res.status).toBe(200);
    const row = res.body.items.find(r => r.uid === 'bm-new');
    expect(row).toMatchObject({ status: 'no_record', totalTuition: null, remainingBalance: null, nextBillingDate: null, cohortId: null });
    expect(res.body.extra.summary.noRecordCount).toBeGreaterThanOrEqual(1);
  });

  it('keeps the real balance for a billed student and excludes missing records from outstanding totals', async () => {
    const res = await env.request('GET', '/api/admin/billing', { token: await admin() });
    expect(res.body.items.find(r => r.uid === 'bm-billed')).toMatchObject({ status: 'partial', totalTuition: 50000, remainingBalance: 30000 });
    expect(res.body.extra.summary.totalOutstanding).toBe(30000);
  });

  it('refuses a payment for a student with no tuition until the admin enters it', async () => {
    const res = await env.request('POST', '/api/admin/billing/bm-new/payment', { token: await admin(), body: { amount: 1000, nextBillingDate: '2026-12-01' } });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/tuition/i);
    const snap = await env.db.collection('studentBilling').doc('bm-new').get();
    expect(snap.exists).toBe(false);
  });

  it('records tuition with the first payment when the admin supplies it, then refuses overpayment', async () => {
    const token = await admin();
    const first = await env.request('POST', '/api/admin/billing/bm-new/payment', { token, body: { amount: 10000, totalTuition: 40000, nextBillingDate: '2027-01-01' } });
    expect(first.status).toBe(200);
    const row = await env.request('GET', '/api/admin/billing', { token });
    expect(row.body.items.find(r => r.uid === 'bm-new')).toMatchObject({ status: 'partial', totalTuition: 40000, remainingBalance: 30000 });
    const over = await env.request('POST', '/api/admin/billing/bm-new/payment', { token, body: { amount: 31000, nextBillingDate: '2027-01-01' } });
    expect(over.status).toBe(400);
    expect(over.body.error.message).toMatch(/larger than the outstanding balance/);
  });

  it('does not seed sample material requests into an empty collection', async () => {
    const token = await admin();
    const res = await env.request('GET', '/api/admin/materials', { token });
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    const snap = await env.db.collection('materialRequests').get();
    expect(snap.empty).toBe(true);
  });
});
