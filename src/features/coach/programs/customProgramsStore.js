/**
 * Dynamic Custom Programs Store
 * Allows Coach-authored PBL units to be registered dynamically in the program catalog.
 */

const STORAGE_KEY = 'hearisland.custom_pbl_programs.v1';

function getStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  } catch {
    // Ignore
  }
  return null;
}

export function getCustomPrograms() {
  try {
    const storage = getStorage();
    if (!storage) return {};
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCustomProgram(program) {
  try {
    const storage = getStorage();
    const existing = getCustomPrograms();
    existing[program.id] = {
      ...program,
      updatedAt: Date.now()
    };
    if (storage) {
      storage.setItem(STORAGE_KEY, JSON.stringify(existing));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pbl-custom-programs-changed', { detail: { programId: program.id } }));
    }
  } catch (err) {
    console.error('[CustomProgramsStore] Failed saving program:', err);
  }
}

export function getCustomProgramById(id) {
  const all = getCustomPrograms();
  return all[id] || null;
}
