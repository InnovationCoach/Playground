// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const setDocMock = vi.fn(async () => {});
vi.mock('../src/firebase.js', () => ({
  db: { fake: true },
  auth: { currentUser: { uid: 'coach-1' } },
  doc: (_db, ...path) => ({ path: path.join('/') }),
  setDoc: (...args) => setDocMock(...args),
  collection: () => ({}),
  getDocs: async () => ({ forEach: () => {} })
}));
vi.mock('../src/features/coach/classCodes.js', () => ({ loadClasses: async () => [] }));

import { saveCustomProgram, getCustomPrograms } from '../src/features/coach/programs/customProgramsStore.js';
import {
  trashProgram, restoreProgram, purgeExpiredPrograms, listTrashedPrograms, canRemoveProgram,
  isProgramTrashed, TRASH_DAYS, DAY_MS
} from '../src/features/coach/programs/programTrash.js';
import { BUILT_IN_PROGRAM_IDS, getAllPrograms, PROGRAMS } from '../src/features/pbl/programs/catalog.js';
import { ProgramLibrary } from '../src/features/pbl/programs/ProgramLibrary.jsx';

const mine = { id: 'coach-unit-1', title: 'Rain Garden', authorId: 'coach-1', status: 'draft', phases: [] };
const T0 = Date.UTC(2026, 10, 25);

beforeEach(() => {
  localStorage.clear();
  setDocMock.mockClear();
});

describe('program trash', () => {
  it('moves a program to Trash for 7 days and hides it from the library', async () => {
    saveCustomProgram(mine);
    expect(getAllPrograms().some((p) => p.id === mine.id)).toBe(true);

    const res = await trashProgram(mine, 'coach-1', { now: T0 });
    expect(res.ok).toBe(true);
    expect(res.cloudSaved).toBe(true);
    expect(res.purgeAt).toBe(T0 + TRASH_DAYS * DAY_MS);
    expect(setDocMock).toHaveBeenCalledWith({ path: 'pbl_programs/coach-unit-1' },
      { deletedAt: T0, deletedBy: 'coach-1', purgeAt: T0 + 7 * DAY_MS }, { merge: true });

    expect(getCustomPrograms()[mine.id]).toBeUndefined();
    expect(getAllPrograms().some((p) => p.id === mine.id)).toBe(false);
    const list = listTrashedPrograms([], T0 + DAY_MS);
    expect(list.map((t) => t.id)).toEqual([mine.id]);
    expect(list[0].daysLeft).toBe(6);
  });

  it('a later sync of an older copy does not bring a trashed program back', async () => {
    saveCustomProgram(mine);
    await trashProgram(mine, 'coach-1', { now: T0 });
    saveCustomProgram({ ...mine, title: 'Rain Garden (synced)' });
    expect(getCustomPrograms()[mine.id]).toBeUndefined();
  });

  it('restores within 7 days and clears the cloud mark', async () => {
    saveCustomProgram(mine);
    await trashProgram(mine, 'coach-1', { now: T0 });
    const res = await restoreProgram(mine.id, { now: T0 + 6 * DAY_MS });
    expect(res.ok).toBe(true);
    expect(setDocMock).toHaveBeenLastCalledWith({ path: 'pbl_programs/coach-unit-1' },
      expect.objectContaining({ deletedAt: null, purgeAt: null }), { merge: true });
    expect(getCustomPrograms()[mine.id]?.title).toBe('Rain Garden');
    expect(isProgramTrashed(mine.id)).toBe(false);
  });

  it('after 7 days purges the program for good and refuses restore', async () => {
    saveCustomProgram(mine);
    await trashProgram(mine, 'coach-1', { now: T0 });
    expect(purgeExpiredPrograms(T0 + 6 * DAY_MS)).toEqual([]);
    expect(purgeExpiredPrograms(T0 + 7 * DAY_MS)).toEqual([mine.id]);
    expect(listTrashedPrograms([], T0 + 7 * DAY_MS)).toEqual([]);
    expect((await restoreProgram(mine.id, { now: T0 + 7 * DAY_MS })).reason).toBe('expired');
    // A sync from Firestore (doc not yet deleted by the backend) stays hidden.
    saveCustomProgram({ ...mine });
    expect(getCustomPrograms()[mine.id]).toBeUndefined();
  });

  it('hides programs trashed on another device via the record mark', () => {
    expect(isProgramTrashed({ id: 'x', deletedAt: T0 })).toBe(true);
    const list = listTrashedPrograms([{ id: 'x', title: 'Other device', deletedAt: T0, purgeAt: T0 + 7 * DAY_MS }], T0);
    expect(list[0]).toMatchObject({ id: 'x', daysLeft: 7 });
  });

  it('only lets a coach remove their own programs, never built-in ones', () => {
    expect(canRemoveProgram(mine, 'coach-1', BUILT_IN_PROGRAM_IDS)).toBe(true);
    expect(canRemoveProgram(mine, 'coach-2', BUILT_IN_PROGRAM_IDS)).toBe(false);
    expect(canRemoveProgram({ id: 'local', title: 'Local draft' }, 'coach-1', BUILT_IN_PROGRAM_IDS)).toBe(true);
    expect(canRemoveProgram({ ...PROGRAMS[0], authorId: 'coach-1' }, 'coach-1', BUILT_IN_PROGRAM_IDS)).toBe(false);
  });
});

describe('ProgramLibrary remove flow', () => {
  let host, root;
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    HTMLDialogElement.prototype.showModal ||= function showModal() { this.open = true; };
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
  });
  afterEach(() => { act(() => root.unmount()); host.remove(); });

  it('removes with confirmation, shows it in Trash and restores it', async () => {
    saveCustomProgram(mine);
    await act(async () => { root.render(<ProgramLibrary uid="coach-1" isCoach classIds={[]} />); });

    const removeBtn = host.querySelector('[aria-label="Remove Rain Garden"]');
    expect(removeBtn).not.toBeNull();
    // Built-in programs have no remove button.
    expect(host.querySelectorAll('.pg-card-remove').length).toBe(1);

    await act(async () => { removeBtn.click(); });
    const confirm = [...host.querySelectorAll('dialog button')].find((b) => b.textContent.includes('Move to Trash'));
    await act(async () => { confirm.click(); });

    expect(host.querySelector('[aria-label="Remove Rain Garden"]')).toBeNull();
    expect(host.textContent).toContain('moved to Trash');
    const trashBtn = [...host.querySelectorAll('button')].find((b) => b.textContent.startsWith('Trash'));
    expect(trashBtn.textContent).toBe('Trash (1)');

    await act(async () => { trashBtn.click(); });
    expect(host.textContent).toContain('Rain Garden');
    expect(host.textContent).toContain('Deleted for good in 7 days');

    const restoreBtn = [...host.querySelectorAll('button')].find((b) => b.textContent === 'Restore');
    await act(async () => { restoreBtn.click(); });
    expect(host.textContent).toContain('Trash is empty');

    const back = [...host.querySelectorAll('button')].find((b) => b.textContent === 'Program library');
    await act(async () => { back.click(); });
    expect(host.querySelector('[aria-label="Remove Rain Garden"]')).not.toBeNull();
  });
});
