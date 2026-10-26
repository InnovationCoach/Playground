/**
 * Course Maker Draft Store
 * Isolates in-progress course drafts from published production courses.
 * Guarantees zero data loss when coaches navigate away, refresh, or switch screens.
 */

const STORAGE_KEY = 'hearisland.course_maker_drafts.v1';

function getStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) return globalThis.localStorage;
  } catch {
    // Ignore
  }
  return null;
}

function notifyDraftsChanged(detail = {}) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('course-maker-drafts-changed', { detail }));
  }
}

/**
 * Returns all drafts sorted by updatedAt descending.
 */
export function listDrafts() {
  try {
    const storage = getStorage();
    if (!storage) return [];
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const drafts = Array.isArray(parsed) ? parsed : Object.values(parsed);
    return drafts.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } catch (err) {
    console.error('[CourseDraftStore] Error listing drafts:', err);
    return [];
  }
}

/**
 * Gets a single draft by ID.
 */
export function getDraft(id) {
  if (!id) return null;
  const drafts = listDrafts();
  return drafts.find((d) => d.id === id) || null;
}

/**
 * Saves or updates a draft.
 */
export function saveDraft(draft) {
  if (!draft) return null;
  const storage = getStorage();
  const existing = listDrafts();

  const id = draft.id || `draft-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = Date.now();

  const record = {
    ...draft,
    id,
    title: draft.title || 'Untitled Course Draft',
    step: typeof draft.step === 'number' ? draft.step : 1,
    createdAt: draft.createdAt || now,
    updatedAt: now
  };

  const index = existing.findIndex((d) => d.id === id);
  if (index >= 0) {
    existing[index] = record;
  } else {
    existing.unshift(record);
  }

  if (storage) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(existing));
    } catch (err) {
      console.error('[CourseDraftStore] Storage quota or write error:', err);
    }
  }

  notifyDraftsChanged({ id, action: 'save', draft: record });
  return record;
}

/**
 * Deletes a draft by ID.
 */
export function deleteDraft(id) {
  if (!id) return;
  const storage = getStorage();
  const existing = listDrafts().filter((d) => d.id !== id);
  if (storage) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(existing));
    } catch (err) {
      console.error('[CourseDraftStore] Error deleting draft:', err);
    }
  }
  notifyDraftsChanged({ id, action: 'delete' });
}

/**
 * Creates a clean initial draft with default structure.
 */
export function createNewDraft(defaults = {}) {
  const draftId = `draft-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  return {
    id: draftId,
    step: 1,
    title: defaults.title || '',
    cohort: defaults.cohort || 'lower-secondary',
    ageBand: defaults.ageBand || '11-13',
    durationWeeks: defaults.durationWeeks || 12,
    drivingQuestion: defaults.drivingQuestion || '',
    theme: defaults.theme || '',
    objectives: defaults.objectives || [''],
    competencies: defaults.competencies || ['sdl-01', 'ctps-01'],
    sources: defaults.sources || [],
    milestones: defaults.milestones || [],
    makerSpaceSpecs: defaults.makerSpaceSpecs || [],
    coachCues: defaults.coachCues || {
      leadCoach: 'Coach Donovan',
      initiationCue: 'Check in during week 1 kickoff to ensure clear scope.',
      frustrationDeescalationCue: 'Offer scaffolded breakdown when learners get stuck.',
      midCheckCue: 'Mid-term milestone review and formative feedback.',
      showcaseCue: 'Celebrate completed deliverables and reflections.'
    },
    status: 'draft',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}
