/**
 * Shared Programs library: save, publish and notification behaviour, against an
 * in-memory stand-in for the Firestore transaction API. Permissions are covered
 * by programs-library-rules.test.js, and the real database by the emulator run.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = vi.hoisted(() => ({ docs: new Map(), failNextCommit: false, writes: [] }));

vi.mock('../src/firebase.js', () => {
  const snap = (path) => ({ exists: store.docs.has(path), id: path.split('/').pop(), data: () => structuredClone(store.docs.get(path)) });
  const merge = (path, data) => store.docs.set(path, { ...(store.docs.get(path) || {}), ...structuredClone(data) });
  return {
    db: {},
    usingEmulators: true,
    doc: (_db, ...parts) => ({ path: parts.join('/') }),
    collection: (_db, ...parts) => ({ path: parts.join('/') }),
    getDoc: async (ref) => snap(ref.path),
    getDocs: async () => ({ forEach: () => {}, docs: [] }),
    setDoc: async (ref, data) => merge(ref.path, data),
    updateDoc: async (ref, data) => merge(ref.path, data),
    addDoc: async (col, data) => { const id = `id${store.docs.size}`; merge(`${col.path}/${id}`, data); return { id }; },
    query: (ref) => ref,
    where: () => ({}),
    orderBy: () => ({}),
    limit: () => ({}),
    onSnapshot: () => () => {},
    arrayUnion: (...x) => x,
    serverTimestamp: () => 0,
    auth: {},
    storage: {},
    writeBatch: () => {
      const ops = [];
      return { set: (r, d) => ops.push([r, d]), update: (r, d) => ops.push([r, d]), commit: async () => ops.forEach(([r, d]) => merge(r.path, d)) };
    },
    runTransaction: async (_db, fn) => {
      const ops = [];
      const result = await fn({
        get: async (ref) => snap(ref.path),
        set: (ref, data) => ops.push([ref.path, data]),
        update: (ref, data) => ops.push([ref.path, data])
      });
      if (store.failNextCommit) { store.failNextCommit = false; throw new Error('network down'); }
      ops.forEach(([path, data]) => { store.writes.push(path); merge(path, data); });
      return result;
    }
  };
});

const { saveProgramDraft, publishProgramVersion, addProgramComment } = await import('../src/features/coach/library/programLibraryService.js');
const { canManageProgram, filterPrograms, programFromUnit, sameStageStructure, visibleNotifications, notificationText, resolveOrgId, explainLibraryError } =
  await import('../src/features/coach/library/programLibraryModel.js');
const { parseRoute, hrefFor } = await import('../src/app/routes.js');
const { PBL_STAGES } = await import('../shared/pblUnitSchema.js');

const unit = (over = {}) => ({
  id: 'prog-1',
  unitTitle: 'Rainwater Rescue',
  theme: 'Water',
  drivingQuestion: 'How might we reuse rainwater?',
  realProblem: { summary: 'The courtyard floods.', peopleImpact: 'Safer paths', environmentalImpact: 'Less mains water' },
  makerSpaceSpecs: [{ toolType: 'Microcontroller', specs: 'micro:bit', safetyGuidelines: 'Stay dry' }],
  coachCues: { leadCoach: 'Lead' },
  milestones: PBL_STAGES.map((s) => ({
    id: `ms-${s.stageNumber}`, stageNumber: s.stageNumber, stageName: s.stageName, title: `${s.stageName} work`, week: s.week,
    durationMin: 90, learningGoal: 'Goal', activities: ['Do it'], makerSpaceTools: ['Bench'], evidencePrompt: 'Show it',
    allowedSubmissions: ['video'], coachCue: 'Cue', competencies: []
  })),
  ...over
});
const creator = { uid: 'coach-a', displayName: 'Manni' };
const RECORD = 'program_library/prog-1';
const LIVE = 'pbl_programs/prog-1';
const NOTICE = 'coach_notifications/program-review_prog-1';
const save = (u = unit(), over = {}) => saveProgramDraft({ unit: u, actor: creator, orgId: 'org-welearn', ...over });
const noticesWritten = () => store.writes.filter((p) => p === NOTICE).length;

beforeEach(() => {
  store.docs.clear();
  store.writes.length = 0;
  store.failNextCommit = false;
});

describe('Save & Preview', () => {
  it('saves a draft and notifies once, without publishing anything', async () => {
    const res = await save();
    expect(res).toMatchObject({ programId: 'prog-1', draftVersion: 1, created: true });
    expect(store.docs.get(RECORD)).toMatchObject({ status: 'draft', creatorUid: 'coach-a', orgId: 'org-welearn', draftVersion: 1, publishedVersion: null });
    expect(store.docs.get(RECORD).unit.milestones).toHaveLength(8);
    expect(store.docs.get(NOTICE)).toMatchObject({ type: 'program_review', actorUid: 'coach-a', actorName: 'Manni', programTitle: 'Rainwater Rescue' });
    expect(store.docs.has(LIVE)).toBe(false);
  });

  it('treats a repeated save as already done: same version, no second notification', async () => {
    await save();
    const again = await save();
    expect(again).toMatchObject({ draftVersion: 1, created: false, changed: false });
    expect(noticesWritten()).toBe(1);
  });

  it('writes nothing when the commit fails, then succeeds on retry', async () => {
    store.failNextCommit = true;
    await expect(save()).rejects.toThrow('network down');
    expect(store.docs.size).toBe(0);
    await expect(save()).resolves.toMatchObject({ created: true });
    expect(noticesWritten()).toBe(1);
  });

  it('updates the same program on edit, with no duplicate and no notification', async () => {
    await save();
    const res = await save(unit({ unitTitle: 'Rainwater Rescue 2' }), { expectedVersion: 1 });
    expect(res).toMatchObject({ programId: 'prog-1', draftVersion: 2, changed: true });
    expect(store.docs.get(RECORD).title).toBe('Rainwater Rescue 2');
    expect([...store.docs.keys()].filter((k) => k.startsWith('program_library/'))).toHaveLength(1);
    expect(noticesWritten()).toBe(1);
  });

  it('refuses to overwrite a draft changed elsewhere', async () => {
    await save();
    await save(unit({ unitTitle: 'Second tab' }), { expectedVersion: 1 });
    await expect(save(unit({ unitTitle: 'Stale tab' }), { expectedVersion: 1 })).rejects.toMatchObject({ code: 'conflict' });
    expect(store.docs.get(RECORD).title).toBe('Second tab');
  });

  it('rejects a unit with no stages before writing', async () => {
    await expect(save(unit({ milestones: [] }))).rejects.toThrow(/no stages/);
    expect(store.docs.size).toBe(0);
  });

  it('strips undefined values Firestore would reject', async () => {
    await save(unit({ extra: undefined }));
    expect('extra' in store.docs.get(RECORD).unit).toBe(false);
  });
});

describe('Publish', () => {
  const publish = (reviewedVersion = 1) => publishProgramVersion({ programId: 'prog-1', reviewedVersion, actor: creator });

  it('copies the reviewed version into pbl_programs under the same id, visible to student discovery', async () => {
    await save();
    await expect(publish()).resolves.toMatchObject({ version: 1, alreadyPublished: false });
    expect(store.docs.get(LIVE)).toMatchObject({ id: 'prog-1', status: 'published', visibility: 'centre', authorId: 'coach-a', libraryManaged: true, libraryVersion: 1, title: 'Rainwater Rescue' });
    expect(store.docs.get(LIVE).phases).toHaveLength(8);
    expect(store.docs.get(LIVE).searchTokens.length).toBeGreaterThan(0);
    expect(store.docs.get(RECORD)).toMatchObject({ status: 'published', publishedVersion: 1, hasUnpublishedChanges: false });
  });

  it('is safe to repeat', async () => {
    await save();
    await publish();
    const writes = store.writes.length;
    await expect(publish()).resolves.toMatchObject({ alreadyPublished: true });
    expect(store.writes).toHaveLength(writes);
  });

  it('leaves nothing half-published when the commit fails', async () => {
    await save();
    store.failNextCommit = true;
    await expect(publish()).rejects.toThrow('network down');
    expect(store.docs.has(LIVE)).toBe(false);
    expect(store.docs.get(RECORD).status).toBe('draft');
  });

  it('keeps later edits in draft: the published copy does not move, and the program stays Published', async () => {
    await save();
    await publish();
    const before = structuredClone(store.docs.get(LIVE));
    await save(unit({ unitTitle: 'Changed title' }), { expectedVersion: 1 });
    expect(store.docs.get(LIVE)).toEqual(before);
    expect(store.docs.get(RECORD)).toMatchObject({ status: 'published', draftVersion: 2, publishedVersion: 1, hasUnpublishedChanges: true });
    expect(filterPrograms([store.docs.get(RECORD)], { tab: 'published' })).toHaveLength(1);
    expect(filterPrograms([store.docs.get(RECORD)], { tab: 'in-progress' })).toHaveLength(0);
  });

  it('republishes approved text changes and clears the indicator', async () => {
    await save();
    await publish();
    await save(unit({ unitTitle: 'Changed title' }), { expectedVersion: 1 });
    await publish(2);
    expect(store.docs.get(LIVE)).toMatchObject({ title: 'Changed title', libraryVersion: 2 });
    expect(store.docs.get(RECORD)).toMatchObject({ publishedVersion: 2, hasUnpublishedChanges: false });
  });

  it('refuses a version the coach did not review', async () => {
    await save();
    await save(unit({ unitTitle: 'Newer' }), { expectedVersion: 1 });
    await expect(publish(1)).rejects.toMatchObject({ code: 'stale-review' });
    expect(store.docs.has(LIVE)).toBe(false);
  });

  it('refuses a stage change on a live program, leaving it untouched, because progress is keyed by session number', async () => {
    await save();
    await publish();
    const before = structuredClone(store.docs.get(LIVE));
    const fewer = unit();
    fewer.milestones = fewer.milestones.slice(0, 6);
    await save(fewer, { expectedVersion: 1 });
    await expect(publish(2)).rejects.toMatchObject({ code: 'structure-changed' });
    expect(store.docs.get(LIVE)).toEqual(before);
    expect(store.docs.get(RECORD).hasUnpublishedChanges).toBe(true);
  });
});

describe('Model', () => {
  it('previews through the same conversion a publish stores', () => {
    const { data, view } = programFromUnit(unit(), 'coach-a');
    expect(view.phases).toHaveLength(8);
    expect(view.sessions).toHaveLength(8);
    expect(view.phases.map((p) => p.title)).toEqual(data.phases.map((p) => p.title));
    expect(view.identity?.tone).toBeTruthy();
  });

  it('detects stage changes but not wording changes', () => {
    const base = programFromUnit(unit(), 'a').view.phases;
    const reworded = unit();
    reworded.milestones[0].title = 'Reworded';
    expect(sameStageStructure(base, programFromUnit(reworded, 'a').view.phases)).toBe(true);
    const renumbered = unit();
    renumbered.milestones[0].stageNumber = 9;
    expect(sameStageStructure(base, programFromUnit(renumbered, 'a').view.phases)).toBe(false);
  });

  it('gives control to the creator and administrators, by account id rather than name', () => {
    const record = { creatorUid: 'u1', creatorName: 'Sarah' };
    expect(canManageProgram(record, { uid: 'u1', role: 'teacher' })).toBe(true);
    expect(canManageProgram(record, { uid: 'admin1', role: 'admin' })).toBe(true);
    expect(canManageProgram(record, { uid: 'u2', role: 'teacher' })).toBe(false);
    expect(canManageProgram(record, { uid: 'u3', role: 'supervisor' })).toBe(false);
    expect(canManageProgram({ creatorUid: 'u9', creatorName: 'Manni' }, { uid: 'u2', role: 'coach' })).toBe(false);
  });

  it('filters by tab and Created by Me, newest first', () => {
    const records = [
      { programId: 'a', status: 'draft', creatorUid: 'me', updatedAt: 1 },
      { programId: 'b', status: 'draft', creatorUid: 'them', updatedAt: 3 },
      { programId: 'c', status: 'published', creatorUid: 'me', updatedAt: 2, hasUnpublishedChanges: true }
    ];
    expect(filterPrograms(records, { tab: 'in-progress' }).map((r) => r.programId)).toEqual(['b', 'a']);
    expect(filterPrograms(records, { tab: 'in-progress', createdByMe: true, uid: 'me' }).map((r) => r.programId)).toEqual(['a']);
    expect(filterPrograms(records, { tab: 'published' }).map((r) => r.programId)).toEqual(['c']);
  });

  it('hides a coach\'s own notification and tracks unread per reader', () => {
    const list = [
      { id: 'n1', actorUid: 'a', actorName: 'Manni', programTitle: 'P', createdAt: 1 },
      { id: 'n2', actorUid: 'me', actorName: 'Me', programTitle: 'Q', createdAt: 2 }
    ];
    const shown = visibleNotifications(list, new Set(), 'me');
    expect(shown.map((n) => n.id)).toEqual(['n1']);
    expect(shown[0].unread).toBe(true);
    expect(visibleNotifications(list, new Set(['n1']), 'me')[0].unread).toBe(false);
    expect(notificationText(shown[0])).toBe('Manni added P for review.');
  });

  it('falls back to the default organization, and explains refusals', () => {
    expect(resolveOrgId(null)).toBe('org-welearn');
    expect(resolveOrgId('org-x')).toBe('org-x');
    expect(explainLibraryError({ code: 'permission-denied', message: 'x' }, 'f')).toMatch(/permission/i);
  });

  it('keeps the feedback body required', async () => {
    await expect(addProgramComment({ programId: 'prog-1', actor: creator, body: '   ', view: 'draft', version: 1 })).rejects.toThrow(/feedback/i);
  });
});

describe('Routes', () => {
  it('parses library, preview and edit links', () => {
    expect(parseRoute(hrefFor.programLibrary())).toMatchObject({ screen: 'coachPrograms', page: 'list' });
    expect(parseRoute(hrefFor.programPreview('p 1', 'published', 'plan'))).toMatchObject({ screen: 'coachPrograms', page: 'preview', programId: 'p 1', version: 'published', section: 'plan' });
    expect(parseRoute(hrefFor.programPreview('p1'))).toMatchObject({ version: 'draft', section: null });
    expect(parseRoute(hrefFor.programEdit('p1'))).toMatchObject({ page: 'edit', programId: 'p1' });
    expect(parseRoute('#/coach/dashboard')).toMatchObject({ screen: 'coach' });
  });
});
