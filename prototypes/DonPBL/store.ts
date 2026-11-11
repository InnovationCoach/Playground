/**
 * Don's PBL Prototype Storage Layer
 * Location: prototypes/DonPBL/store.ts
 * 
 * Offline storage interface for student projects and coach feedback.
 * - Keys student projects by `(uid, pbl-<programId>)` so learners in different programs never share a document.
 * - Stores coach feedback separately from `StudentProject` (in production, `users/{uid}/activityProgress/pbl-<programId>`
 *   is writable only by the student owner, whereas coach feedback lives in its own coach-writable collection).
 * - Wraps every `localStorage` read/write in `try/catch` and falls back seamlessly to an in-memory Map.
 */

import { MOCK_COHORT, INITIAL_COACH_FEEDBACK } from './mockFixtures';
import type { StudentProject, CoachFeedback } from './mockFixtures';

export interface PblStore {
  loadProject(uid: string, programId: string): Promise<StudentProject | null>;
  saveProject(uid: string, programId: string, project: StudentProject): Promise<void>;
  listCohort(classId: string, programId: string): Promise<StudentProject[]>;
  loadFeedback(uid: string, programId: string): Promise<CoachFeedback[]>;
  addFeedback(uid: string, programId: string, entry: CoachFeedback): Promise<void>;
  resetDemoData(): Promise<void>;
}

interface KeyValueBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  keys(): string[];
}

const STORAGE_PREFIX = 'donpbl:v1:';

export function projectDocId(programId: string): string {
  return `pbl-${programId}`;
}

function projectKey(uid: string, programId: string): string {
  return `${STORAGE_PREFIX}users/${uid}/activityProgress/${projectDocId(programId)}`;
}

function feedbackKey(uid: string, programId: string): string {
  return `${STORAGE_PREFIX}users/${uid}/feedback/${projectDocId(programId)}`;
}

function cohortIndexKey(classId: string, programId: string): string {
  return `${STORAGE_PREFIX}classes/${classId}/cohort/${projectDocId(programId)}`;
}

function seededKey(programId: string): string {
  return `${STORAGE_PREFIX}seeded/${projectDocId(programId)}`;
}

function deepClone<T>(val: T): T {
  return JSON.parse(JSON.stringify(val));
}

function createSafeBackend(preferLocalStorage: boolean): KeyValueBackend {
  const memoryMap = new Map<string, string>();

  const canUseLocal = (): Storage | null => {
    if (!preferLocalStorage) return null;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage;
      }
    } catch {
      // SecurityError in restricted iframe or private browsing
    }
    return null;
  };

  return {
    getItem(key: string): string | null {
      const ls = canUseLocal();
      if (ls) {
        try {
          const val = ls.getItem(key);
          if (val !== null) return val;
        } catch {
          // Fall back to memoryMap
        }
      }
      return memoryMap.has(key) ? memoryMap.get(key)! : null;
    },
    setItem(key: string, value: string): void {
      memoryMap.set(key, value);
      const ls = canUseLocal();
      if (ls) {
        try {
          ls.setItem(key, value);
        } catch {
          // QuotaExceededError or SecurityError — memoryMap already holds the value
        }
      }
    },
    removeItem(key: string): void {
      memoryMap.delete(key);
      const ls = canUseLocal();
      if (ls) {
        try {
          ls.removeItem(key);
        } catch {
          // Ignore localStorage error
        }
      }
    },
    keys(): string[] {
      const allKeys = new Set<string>(memoryMap.keys());
      const ls = canUseLocal();
      if (ls) {
        try {
          for (let i = 0; i < ls.length; i++) {
            const k = ls.key(i);
            if (k) allKeys.add(k);
          }
        } catch {
          // Ignore localStorage error
        }
      }
      return Array.from(allKeys);
    }
  };
}

function buildStoreFromBackend(backend: KeyValueBackend, seedFromFixtures: boolean): PblStore {
  const ensureSeeded = (classId: string, programId: string): void => {
    if (!seedFromFixtures) return;
    const sKey = seededKey(programId);
    if (backend.getItem(sKey) === '1') return;

    const uids: string[] = [];
    for (const fixtureProject of MOCK_COHORT) {
      const uid = fixtureProject.id;
      uids.push(uid);
      const pKey = projectKey(uid, programId);
      if (backend.getItem(pKey) === null) {
        const seededProj: StudentProject = {
          ...deepClone(fixtureProject),
          programId,
          classId
        };
        // Ensure coachFeedback is never stored on StudentProject
        delete (seededProj as unknown as Record<string, unknown>).coachFeedback;
        backend.setItem(pKey, JSON.stringify(seededProj));
      }

      const fKey = feedbackKey(uid, programId);
      if (backend.getItem(fKey) === null) {
        const initialFeedback = deepClone(INITIAL_COACH_FEEDBACK[uid] || []);
        backend.setItem(fKey, JSON.stringify(initialFeedback));
      }
    }

    const cKey = cohortIndexKey(classId, programId);
    if (backend.getItem(cKey) === null) {
      backend.setItem(cKey, JSON.stringify(uids));
    }
    backend.setItem(sKey, '1');
  };

  return {
    async loadProject(uid: string, programId: string): Promise<StudentProject | null> {
      ensureSeeded('class-demo-01', programId);
      const raw = backend.getItem(projectKey(uid, programId));
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw) as StudentProject;
        delete (parsed as unknown as Record<string, unknown>).coachFeedback;
        return parsed;
      } catch {
        return null;
      }
    },

    async saveProject(uid: string, programId: string, project: StudentProject): Promise<void> {
      ensureSeeded(project.classId || 'class-demo-01', programId);
      const cleanProject: StudentProject = {
        ...deepClone(project),
        id: uid,
        programId
      };
      // Strictly keep coachFeedback off StudentProject
      delete (cleanProject as unknown as Record<string, unknown>).coachFeedback;
      backend.setItem(projectKey(uid, programId), JSON.stringify(cleanProject));

      const classId = cleanProject.classId || 'class-demo-01';
      const cKey = cohortIndexKey(classId, programId);
      let uids: string[] = [];
      try {
        const existing = backend.getItem(cKey);
        if (existing) uids = JSON.parse(existing);
      } catch {
        uids = [];
      }
      if (!uids.includes(uid)) {
        uids.push(uid);
        backend.setItem(cKey, JSON.stringify(uids));
      }
    },

    async listCohort(classId: string, programId: string): Promise<StudentProject[]> {
      ensureSeeded(classId, programId);
      const cKey = cohortIndexKey(classId, programId);
      let uids: string[] = [];
      try {
        const raw = backend.getItem(cKey);
        if (raw) uids = JSON.parse(raw);
      } catch {
        uids = [];
      }
      if (uids.length === 0 && seedFromFixtures) {
        uids = MOCK_COHORT.map((p) => p.id);
      }

      const projects: StudentProject[] = [];
      for (const uid of uids) {
        const rawProj = backend.getItem(projectKey(uid, programId));
        if (rawProj) {
          try {
            const p = JSON.parse(rawProj) as StudentProject;
            delete (p as unknown as Record<string, unknown>).coachFeedback;
            projects.push(p);
          } catch {
            // Skip malformed record
          }
        }
      }
      return projects;
    },

    async loadFeedback(uid: string, programId: string): Promise<CoachFeedback[]> {
      ensureSeeded('class-demo-01', programId);
      const raw = backend.getItem(feedbackKey(uid, programId));
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    },

    async addFeedback(uid: string, programId: string, entry: CoachFeedback): Promise<void> {
      ensureSeeded('class-demo-01', programId);
      const existing = await this.loadFeedback(uid, programId);
      const cleanEntry: CoachFeedback = {
        coachName: entry.coachName,
        date: entry.date,
        note: entry.note,
        competencyScores: { ...entry.competencyScores }
      };
      const updated = [cleanEntry, ...existing];
      backend.setItem(feedbackKey(uid, programId), JSON.stringify(updated));
    },

    async resetDemoData(): Promise<void> {
      for (const k of backend.keys()) {
        if (k.startsWith(STORAGE_PREFIX)) {
          backend.removeItem(k);
        }
      }
    }
  };
}

/**
 * Creates a persistent browser store backed by localStorage with automatic try/catch
 * fallback to in-memory storage when localStorage is unavailable.
 */
export function createLocalStore(options?: { seed?: boolean }): PblStore {
  const seed = options?.seed !== undefined ? options.seed : true;
  return buildStoreFromBackend(createSafeBackend(true), seed);
}

/**
 * Creates a pure in-memory implementation of PblStore (for unit tests and isolated contexts).
 */
export function createMemoryStore(options?: { seed?: boolean }): PblStore {
  const seed = options?.seed !== undefined ? options.seed : true;
  return buildStoreFromBackend(createSafeBackend(false), seed);
}
