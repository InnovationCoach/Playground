// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';

vi.mock('../src/app/i18n/LocaleProvider.jsx', () => ({
  useLocale: () => ({ t: (k) => k, locale: 'en', formatDate: (d) => d })
}));
vi.mock('../src/features/admin/accounts/useReferenceData.js', () => ({
  useReferenceData: () => ({ cohorts: [] }),
  localName: (n) => n
}));
vi.mock('../src/services/api/endpoints.js', () => ({
  listBilling: vi.fn(),
  recordPayment: vi.fn()
}));
import { listBilling, recordPayment } from '../src/services/api/endpoints.js';
import { StudentBillingOverview } from '../src/features/admin/billing/StudentBillingOverview.jsx';

let host, root;
const perms = { editAccounts: true };
async function render() { await act(async () => root.render(<StudentBillingOverview perms={perms} />)); }
function rowFor(name) { return [...host.querySelectorAll('tr')].find(tr => tr.textContent.includes(name)); }
function button(text) { return [...host.querySelectorAll('button')].find(b => b.textContent.trim() === text); }

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  listBilling.mockResolvedValue({
    items: [
      { uid: 'new', studentName: 'New Student', email: 'new@example.test', publicId: 'P-1', cohortId: null, totalTuition: null, amountPaid: 0, remainingBalance: null, status: 'no_record', nextBillingDate: null },
      { uid: 'billed', studentName: 'Billed Student', email: 'b@example.test', publicId: 'P-2', cohortId: null, totalTuition: 50000, amountPaid: 20000, remainingBalance: 30000, status: 'partial', nextBillingDate: '2026-12-01' }
    ],
    total: 2,
    nextPageToken: null,
    extra: { summary: { totalRevenue: 20000, totalOutstanding: 30000, overdueCount: 0, paidCount: 0, noRecordCount: 1, totalStudents: 2 } }
  });
  recordPayment.mockResolvedValue({});
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.clearAllMocks(); delete globalThis.IS_REACT_ACT_ENVIRONMENT; });

describe('Student billing overview', () => {
  it('shows "Not set" and "No billing record" instead of invented amounts', async () => {
    await render();
    await act(async () => {});
    const row = rowFor('New Student');
    expect(row.textContent).toContain('Not set');
    expect(row.textContent).toContain('No billing record');
    expect(row.textContent).not.toContain('120,000');
    expect(row.textContent).not.toContain('Overdue');
  });

  it('asks for the term tuition before recording a payment for a student with no record', async () => {
    await render();
    await act(async () => {});
    const recordButtons = [...host.querySelectorAll('button')].filter(b => b.textContent.includes('Record Payment'));
    await act(async () => recordButtons[0].click());
    const labels = [...host.querySelectorAll('label')].map(l => l.textContent);
    expect(labels.some(t => t.startsWith('Term tuition'))).toBe(true);
    expect(button('Confirm Payment').disabled).toBe(true);
  });

  it('sends tuition only when the student has no record yet', async () => {
    await render();
    await act(async () => {});
    const recordButtons = [...host.querySelectorAll('button')].filter(b => b.textContent.includes('Record Payment'));
    await act(async () => recordButtons[0].click());
    const fieldFor = (prefix) => [...host.querySelectorAll('label')].find(l => l.textContent.startsWith(prefix)).parentElement.querySelector('input');
    const amount = fieldFor('Payment Amount');
    const tuition = fieldFor('Term tuition');
    const setValue = (el, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
    await act(async () => setValue(tuition, '40000'));
    await act(async () => setValue(amount, '10000'));
    await act(async () => { host.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    expect(recordPayment).toHaveBeenCalledWith('new', expect.objectContaining({ amount: 10000, totalTuition: 40000 }));
  });
});
