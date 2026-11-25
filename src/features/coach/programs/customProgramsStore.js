/**
 * Dynamic Custom Programs Store
 * Allows Coach-authored PBL units to be registered dynamically in the program catalog.
 *
 * Programs a coach moved to Trash (programTrash.js) stay in the store until
 * their 7 days pass, but getCustomPrograms() and the lists built from it skip
 * them. This file has no Firebase import so the catalog stays testable in node.
 */

const STORAGE_KEY = 'hearisland.custom_pbl_programs.v1';
export const TRASH_KEY = 'hearisland.pbl_program_trash.v1';

function getStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  } catch {
    // Ignore
  }
  return null;
}

/** id -> { id, title, deletedAt, deletedBy, purgeAt, state: 'trashed' | 'purged' } */
export function readTrashIndex() {
  try {
    const raw = getStorage()?.getItem(TRASH_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function writeTrashIndex(index) {
  try {
    getStorage()?.setItem(TRASH_KEY, JSON.stringify(index));
  } catch {
    // Quota or private mode: the Firestore mark still hides the program.
  }
}

/**
 * True when a program is in Trash or already removed for good: marked on the
 * record itself (seen from any device) or in this device's trash index.
 */
export function isProgramTrashed(programOrId, index = readTrashIndex()) {
  if (!programOrId) return false;
  if (typeof programOrId === 'object') return !!programOrId.deletedAt || !!index[programOrId.id];
  return !!index[programOrId];
}

/** Every stored program, trashed ones included. For the trash module. */
export function readCustomProgramStore() {
  try {
    const raw = getStorage()?.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function writeCustomProgramStore(all) {
  try {
    getStorage()?.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (err) {
    console.error('[CustomProgramsStore] Failed saving programs:', err);
  }
}

/** Programs that are not in Trash. */
export function getCustomPrograms() {
  const all = readCustomProgramStore();
  const index = readTrashIndex();
  const out = {};
  for (const [id, p] of Object.entries(all)) {
    if (!isProgramTrashed(p ? { ...p, id: p.id || id } : id, index)) out[id] = p;
  }
  return out;
}

export function saveCustomProgram(program) {
  try {
    if (!program?.id) return;
    const existing = readCustomProgramStore();
    const prev = existing[program.id];
    const next = { ...program, updatedAt: Date.now() };
    // A sync from an older copy must not clear a trash mark made on this device.
    if (prev?.deletedAt && !('deletedAt' in program)) {
      next.deletedAt = prev.deletedAt;
      next.deletedBy = prev.deletedBy;
      next.purgeAt = prev.purgeAt;
    }
    existing[program.id] = next;
    writeCustomProgramStore(existing);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pbl-custom-programs-changed', { detail: { programId: program.id } }));
    }
  } catch (err) {
    console.error('[CustomProgramsStore] Failed saving program:', err);
  }
}

/** By id, trashed included, so an open link or a class still running it does not break. */
export function getCustomProgramById(id) {
  const all = readCustomProgramStore();
  return all[id] || null;
}

export function getCustomProgramsList() {
  return Object.values(getCustomPrograms());
}
