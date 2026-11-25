// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';

vi.mock('../src/app/i18n/LocaleProvider.jsx', () => ({
  useLocale: () => ({
    t: (k) => {
      const msgs = {
        'common.required': 'This field is required',
        'form.invalidEmail': 'Enter a valid email address.',
        'form.choose': 'Choose',
        'form.noCohortsAvailable': 'No eligible cohorts available',
        'accounts.create.students': 'Add student',
        'accounts.allCohorts': 'All cohorts',
        'role.student': 'Student'
      };
      return msgs[k] || k;
    },
    locale: 'en',
    formatDate: (d) => d
  })
}));

let mockReferenceData = {
  loading: false,
  error: null,
  schools: [{ schoolId: 'sch-bkk', name: 'Bangkok Campus' }],
  cohorts: [
    { cohortId: 'cohort-wls', code: 'WLS', name: { en: 'WeLearn Lower Secondary' }, ageBands: ['13-15'] },
    { cohortId: 'cohort-whs', code: 'WHS', name: { en: 'WeLearn Higher Secondary' }, ageBands: ['13-15', '16-18'] }
  ],
  programmes: [],
  classes: [{ classId: 'cls-1', schoolId: 'sch-bkk', cohortId: 'cohort-wls', name: 'WLS Grade 7' }]
};

vi.mock('../src/features/admin/accounts/useReferenceData.js', () => ({
  useReferenceData: () => mockReferenceData,
  localName: (n) => (typeof n === 'string' ? n : n?.en || ''),
  clearReferenceCache: vi.fn()
}));

vi.mock('../src/services/api/endpoints.js', () => ({
  createUser: vi.fn(),
  updateUser: vi.fn(),
  listUsers: vi.fn()
}));

import { createUser, listUsers } from '../src/services/api/endpoints.js';
import { AccountForm } from '../src/features/admin/accounts/AccountForm.jsx';
import { AccountList } from '../src/features/admin/accounts/AccountList.jsx';

let host, root;

function changeInput(input, value) {
  const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  nativeSetter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function changeSelect(select, value) {
  const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set;
  if (nativeSetter) nativeSetter.call(select, value);
  else select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  mockReferenceData = {
    loading: false,
    error: null,
    schools: [{ schoolId: 'sch-bkk', name: 'Bangkok Campus' }],
    cohorts: [
      { cohortId: 'cohort-wls', code: 'WLS', name: { en: 'WeLearn Lower Secondary' }, ageBands: ['13-15'] },
      { cohortId: 'cohort-whs', code: 'WHS', name: { en: 'WeLearn Higher Secondary' }, ageBands: ['13-15', '16-18'] }
    ],
    programmes: [],
    classes: [{ classId: 'cls-1', schoolId: 'sch-bkk', cohortId: 'cohort-wls', name: 'WLS Grade 7' }]
  };
  createUser.mockReset();
  listUsers.mockReset();
  listUsers.mockResolvedValue({ items: [], total: 0, nextPageToken: null });
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.clearAllMocks();
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});

describe('Admin Add Student Form and Cohort Dropdown', () => {
  it('renders WHS and WLS dynamically in cohort dropdown and excludes Primary', async () => {
    await act(async () => {
      root.render(<AccountForm kind="students" onDone={vi.fn()} onCancel={vi.fn()} />);
    });

    const cohortSelect = host.querySelector('#f-cohort');
    expect(cohortSelect).toBeTruthy();
    const options = [...cohortSelect.querySelectorAll('option')].map(o => ({ value: o.value, text: o.textContent.trim() }));

    expect(options).toEqual([
      { value: '', text: 'Choose' },
      { value: 'cohort-wls', text: 'WLS – WeLearn Lower Secondary' },
      { value: 'cohort-whs', text: 'WHS – WeLearn Higher Secondary' }
    ]);
    expect(options.some(o => o.text.toLowerCase().includes('primary'))).toBe(false);
  });

  it('displays clear message when no eligible cohorts exist rather than empty dropdown', async () => {
    mockReferenceData.cohorts = [];
    await act(async () => {
      root.render(<AccountForm kind="students" onDone={vi.fn()} onCancel={vi.fn()} />);
    });

    const cohortSelect = host.querySelector('#f-cohort');
    expect(cohortSelect).toBeTruthy();
    const options = [...cohortSelect.querySelectorAll('option')];
    expect(options[0].textContent).toContain('No eligible cohorts available');
  });

  it('auto-selects age band 13-15 when WLS cohort is selected', async () => {
    await act(async () => {
      root.render(<AccountForm kind="students" onDone={vi.fn()} onCancel={vi.fn()} />);
    });

    const cohortSelect = host.querySelector('#f-cohort');
    const ageSelect = host.querySelector('#f-age');

    await act(async () => {
      changeSelect(cohortSelect, 'cohort-wls');
    });

    expect(cohortSelect.value).toBe('cohort-wls');
    expect(ageSelect.value).toBe('13-15');
    const ageOptions = [...ageSelect.querySelectorAll('option')].map(o => o.value);
    expect(ageOptions).not.toContain('primary');
  });

  it('validates required fields on submission', async () => {
    await act(async () => {
      root.render(<AccountForm kind="students" onDone={vi.fn()} onCancel={vi.fn()} />);
    });

    const form = host.querySelector('form');
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(createUser).not.toHaveBeenCalled();
    const errorMessages = [...host.querySelectorAll('.gh-field-error')].map(e => e.textContent);
    expect(errorMessages.length).toBeGreaterThanOrEqual(4);
  });

  it('successfully creates student with WHS cohort and derived grade level', async () => {
    createUser.mockResolvedValue({
      uid: 'new-whs-student',
      publicId: 'STD-WHS-123',
      role: 'student',
      givenNames: 'Alex',
      surname: 'Rivera',
      email: 'alex.rivera@school.edu',
      cohortId: 'cohort-whs'
    });

    const onDone = vi.fn();
    await act(async () => {
      root.render(<AccountForm kind="students" onDone={onDone} onCancel={vi.fn()} />);
    });

    await act(async () => {
      changeInput(host.querySelector('#f-given'), 'Alex');
      changeInput(host.querySelector('#f-surname'), 'Rivera');
      changeInput(host.querySelector('#f-email'), 'alex.rivera@school.edu');
      changeSelect(host.querySelector('#f-school'), 'sch-bkk');
      changeSelect(host.querySelector('#f-cohort'), 'cohort-whs');
      changeSelect(host.querySelector('#f-age'), '16-18');
      changeInput(host.querySelector('#f-year'), 'Grade 10');
    });

    const form = host.querySelector('form');
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(createUser).toHaveBeenCalledTimes(1);
    expect(createUser).toHaveBeenCalledWith(expect.objectContaining({
      role: 'student',
      givenNames: 'Alex',
      surname: 'Rivera',
      email: 'alex.rivera@school.edu',
      schoolIds: ['sch-bkk'],
      cohortId: 'cohort-whs',
      cohort: 'higher-secondary',
      ageBand: '16-18',
      yearLevel: 'Grade 10',
      gradeLevel: 10
    }));
    expect(onDone).toHaveBeenCalled();
  });

  it('handles duplicate student email error gracefully', async () => {
    const err = new Error('That email is already in use.');
    err.code = 'CONFLICT';
    err.field = 'email';
    createUser.mockRejectedValue(err);

    await act(async () => {
      root.render(<AccountForm kind="students" onDone={vi.fn()} onCancel={vi.fn()} />);
    });

    await act(async () => {
      changeInput(host.querySelector('#f-given'), 'Sam');
      changeInput(host.querySelector('#f-surname'), 'Taylor');
      changeInput(host.querySelector('#f-email'), 'existing@school.edu');
      changeSelect(host.querySelector('#f-school'), 'sch-bkk');
      changeSelect(host.querySelector('#f-cohort'), 'cohort-wls');
    });

    const form = host.querySelector('form');
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    const emailErr = host.querySelector('#f-email-err');
    expect(emailErr).toBeTruthy();
    expect(emailErr.textContent).toContain('That email is already in use');
  });

  it('renders student list with WHS and WLS cohort badges and filters', async () => {
    await act(async () => {
      root.render(<AccountList kind="students" perms={{ editAccounts: true }} onOpen={vi.fn()} onCreate={vi.fn()} />);
    });

    const cohortFilter = host.querySelector('select.gh-select');
    expect(cohortFilter).toBeTruthy();
    const filterOptions = [...cohortFilter.querySelectorAll('option')].map(o => o.textContent.trim());
    expect(filterOptions).toContain('WLS – WeLearn Lower Secondary');
    expect(filterOptions).toContain('WHS – WeLearn Higher Secondary');
    expect(filterOptions.some(o => o.toLowerCase().includes('primary'))).toBe(false);
  });
});
