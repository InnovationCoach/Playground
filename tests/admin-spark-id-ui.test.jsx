// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';

vi.mock('../src/app/i18n/LocaleProvider.jsx', () => ({
  useLocale: () => ({ t: (k) => k, locale: 'en', formatDate: (d) => String(d) })
}));
vi.mock('../src/features/admin/accounts/useReferenceData.js', () => ({
  useReferenceData: () => ({ schools: [], classes: [], cohorts: [], programmes: [] }),
  localName: (n) => n
}));
vi.mock('../src/services/api/endpoints.js', () => ({
  getUser: vi.fn(), getUserHistory: vi.fn(), setUserRole: vi.fn(), suspendUser: vi.fn(), unsuspendUser: vi.fn(),
  resendActivation: vi.fn(), changeUserEmail: vi.fn(), issueParentInvite: vi.fn(), revokeParentLink: vi.fn(),
  createParentLink: vi.fn(), setUserPassword: vi.fn(), listUsers: vi.fn(), assignPublicId: vi.fn(),
  createUser: vi.fn(), updateUser: vi.fn(), registerMicrosoftLink: vi.fn(), withdrawMicrosoftLink: vi.fn()
}));
import { getUser, assignPublicId } from '../src/services/api/endpoints.js';
import { AccountDetail } from '../src/features/admin/accounts/AccountDetail.jsx';

const base = {
  uid: 'uid-1', role: 'student', status: 'active', displayName: 'Ping', givenNames: 'Ping', surname: '',
  email: 'ping@welearn.org', schoolIds: [], classIds: [], programmeIds: [], links: [],
  createdAt: '2026-11-11T00:00:00Z', auth: { providers: ['password'], lastSignInAt: null }
};
let host, root;
const perms = { editAccounts: true, viewHistory: false };
const button = (text) => [...host.querySelectorAll('button')].find((b) => b.textContent.trim() === text);
async function render() {
  await act(async () => root.render(<AccountDetail uid="uid-1" perms={perms} callerUid="admin" onOpen={() => {}} onBack={() => {}} />));
  await act(async () => {});
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.clearAllMocks(); delete globalThis.IS_REACT_ACT_ENVIRONMENT; });

describe('Admin learner profile: Spark ID', () => {
  it('shows "not assigned" and offers generation when a learner has no Spark ID', async () => {
    getUser.mockResolvedValue({ ...base, publicId: null });
    await render();
    expect(host.textContent).toContain('account.sparkId.none');
    expect(button('account.action.assignId')).toBeTruthy();
  });

  it('shows the Spark ID and hides generation once one exists', async () => {
    getUser.mockResolvedValue({ ...base, publicId: 'KZN-TKL-PRS-VQM' });
    await render();
    expect(host.textContent).toContain('KZN-TKL-PRS-VQM');
    expect(button('account.action.assignId')).toBeUndefined();
  });

  it('confirms before generating, then shows the new ID from the server record', async () => {
    getUser.mockResolvedValue({ ...base, publicId: null });
    assignPublicId.mockResolvedValue({ ...base, publicId: 'BCD-FGH-JKM-NPQ' });
    await render();
    await act(async () => button('account.action.assignId').click());
    expect(assignPublicId).not.toHaveBeenCalled();
    const confirm = [...host.querySelectorAll('.gh-modal button, [role="dialog"] button')].find((b) => b.textContent.trim() === 'account.action.assignId');
    await act(async () => confirm.click());
    expect(assignPublicId).toHaveBeenCalledWith('uid-1');
  });

  it('does not offer a Spark ID for staff', async () => {
    getUser.mockResolvedValue({ ...base, role: 'teacher', publicId: null });
    await render();
    expect(button('account.action.assignId')).toBeUndefined();
  });

  it('shows Microsoft 365 as not linked, with a hint for an official address', async () => {
    getUser.mockResolvedValue({ ...base, email: 'ping@welearn.org', publicId: 'AAA-BBB-CCC-DDD', auth: { providers: ['password'], microsoft: { linked: false } } });
    await render();
    expect(host.textContent).toContain('account.microsoft.notLinked');
    expect(host.textContent).toContain('account.microsoft.notLinkedHint');
  });

  it('warns that a non-@welearn.org account cannot be matched by email', async () => {
    getUser.mockResolvedValue({ ...base, email: 'anaisapala23@gmail.com', publicId: 'AAA-BBB-CCC-DDD', auth: { providers: ['password'], microsoft: { linked: false } } });
    await render();
    expect(host.textContent).toContain('account.microsoft.nonOrgEmail');
  });

  it('shows the linked Microsoft email when an identity is attached', async () => {
    getUser.mockResolvedValue({ ...base, publicId: 'AAA-BBB-CCC-DDD', auth: { providers: ['password', 'microsoft.com'], microsoft: { linked: true, verified: true, email: 'ping@welearn.org', upn: 'ping@welearn.org' } } });
    await render();
    expect(host.textContent).toContain('account.microsoft.verified');
    expect(host.textContent).toContain('ping@welearn.org');
    expect(host.textContent).not.toContain('account.microsoft.notLinked');
    expect(button('account.action.registerMicrosoft')).toBeUndefined();
  });

  it('does not call an attached but unverified Microsoft provider linked', async () => {
    getUser.mockResolvedValue({ ...base, publicId: 'AAA-BBB-CCC-DDD', auth: { providers: ['password', 'microsoft.com'], microsoft: { linked: true, verified: false, email: 'ping@welearn.org' } } });
    await render();
    expect(host.textContent).toContain('account.microsoft.unverified');
    expect(host.textContent).not.toContain('account.microsoft.verified');
  });

  it('shows a registered Microsoft account that is waiting to be linked, with a way to withdraw it', async () => {
    getUser.mockResolvedValue({ ...base, publicId: 'AAA-BBB-CCC-DDD', auth: { providers: ['password'], microsoft: { linked: false, verified: false, registeredUpn: 'ping@welearn.org' } } });
    await render();
    expect(host.textContent).toContain('account.microsoft.registered');
    expect(host.textContent).toContain('ping@welearn.org');
    expect(button('account.microsoft.withdraw')).toBeTruthy();
  });

  it('offers to register a Microsoft account until one is verified', async () => {
    getUser.mockResolvedValue({ ...base, publicId: 'AAA-BBB-CCC-DDD', auth: { providers: ['password'], microsoft: { linked: false } } });
    await render();
    expect(button('account.action.registerMicrosoft')).toBeTruthy();
  });
});
