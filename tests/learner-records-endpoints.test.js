import { describe, it, expect, vi, beforeEach } from 'vitest';

// Storage mock tracking
const storageFiles = new Map();
const savedFiles = [];
const deletedFiles = [];

const mockFile = (filePath) => ({
  name: filePath,
  save: vi.fn(async (buffer, options) => {
    savedFiles.push({ filePath, buffer, options });
    storageFiles.set(filePath, buffer);
  }),
  delete: vi.fn(async () => {
    deletedFiles.push(filePath);
    storageFiles.delete(filePath);
  }),
  getSignedUrl: vi.fn(async (options) => {
    return [`https://storage.googleapis.com/download/${encodeURIComponent(filePath)}?sig=test&options=${encodeURIComponent(JSON.stringify(options))}`];
  })
});

const mockBucket = {
  name: 'test-bucket',
  file: (filePath) => mockFile(filePath)
};

vi.mock('firebase-admin/storage', () => ({
  getStorage: () => ({
    bucket: () => mockBucket
  })
}));

// In-memory Firestore mock
let usersStore = new Map();
let recordsStore = new Map();
let auditLogsStore = [];
let callerContext = null;

vi.mock('../server/middleware/auth.js', () => ({
  requireClaims: (req, res, next) => {
    req.caller = callerContext;
    next();
  }
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({
    getUsers: async () => ({ users: [] })
  })
}));

vi.mock('../server/lib/audit.js', () => ({
  writeAuditLog: vi.fn(async (db, entry) => {
    auditLogsStore.push(entry);
    return entry;
  })
}));

vi.mock('firebase-admin/firestore', () => {
  return {
    getFirestore: () => ({
      collection: (colName) => ({
        doc: (docId) => {
          const id = docId || `auto-${Math.random().toString(36).slice(2, 9)}`;
          return {
            id,
            get: async () => {
              if (colName === 'users') {
                const data = usersStore.get(id);
                return { exists: Boolean(data), data: () => data };
              }
              if (colName === 'learnerRecords') {
                const data = recordsStore.get(id);
                return { exists: Boolean(data), data: () => data };
              }
              return { exists: false, data: () => undefined };
            },
            set: async (data) => {
              if (colName === 'learnerRecords') recordsStore.set(id, { ...data, id });
              if (colName === 'users') usersStore.set(id, { ...data, id });
            },
            update: async (patch) => {
              if (colName === 'learnerRecords') {
                const existing = recordsStore.get(id) || {};
                recordsStore.set(id, { ...existing, ...patch });
              }
            },
            delete: async () => {
              if (colName === 'learnerRecords') recordsStore.delete(id);
              if (colName === 'users') usersStore.delete(id);
            }
          };
        },
        where: (field, op, val) => {
          let filters = [{ field, op, val }];
          const chain = {
            where: (f, o, v) => {
              filters.push({ field: f, op: o, val: v });
              return chain;
            },
            get: async () => {
              let docs = [];
              if (colName === 'users') docs = Array.from(usersStore.entries());
              if (colName === 'learnerRecords') docs = Array.from(recordsStore.entries());

              const matches = docs.filter(([id, data]) => {
                return filters.every(({ field: f, op: o, val: v }) => {
                  const actual = data[f];
                  if (o === '==') return actual === v;
                  if (o === 'in') return Array.isArray(v) && v.includes(actual);
                  return false;
                });
              }).map(([id, data]) => ({
                id,
                data: () => data
              }));

              return { docs: matches };
            }
          };
          return chain;
        }
      }),
      runTransaction: async (updateFunction) => {
        const tx = {
          get: async (ref) => ref.get(),
          set: (ref, data) => ref.set(data),
          update: (ref, patch) => ref.update(patch),
          delete: (ref) => ref.delete()
        };
        return updateFunction(tx);
      }
    })
  };
});

// Import the router after mocks
import pilotOperationsRouter from '../server/routes/pilot-operations.js';

// Helper to simulate router calls
async function callRouter(method, path, { caller, body = {}, query = {} } = {}) {
  callerContext = caller;
  return new Promise((resolve) => {
    let statusCode = 200;
    let resHeaders = {};
    let resBody = null;

    const req = {
      method,
      url: path,
      path: path.split('?')[0],
      headers: { authorization: 'Bearer dummy-token' },
      body,
      query,
      params: {}
    };

    const res = {
      headersSent: false,
      status(code) {
        statusCode = code;
        return this;
      },
      set(k, v) {
        resHeaders[k] = v;
        return this;
      },
      json(data) {
        this.headersSent = true;
        resBody = data;
        resolve({ status: statusCode, body: resBody, headers: resHeaders });
        return this;
      },
      send(data) {
        this.headersSent = true;
        resBody = data;
        resolve({ status: statusCode, body: resBody, headers: resHeaders });
        return this;
      }
    };

    pilotOperationsRouter(req, res, (err) => {
      if (err) {
        resolve({ status: 500, body: { error: err.message }, headers: resHeaders });
      } else if (!res.headersSent) {
        resolve({ status: 404, body: { error: 'Not handled' }, headers: resHeaders });
      }
    });
  });
}

// Helpers for test fixtures
const validPdfBase64 = 'data:application/pdf;base64,' + Buffer.from('%PDF-1.4 test pdf content').toString('base64');
const validPngBase64 = 'data:image/png;base64,' + Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3]).toString('base64');
const validJpgBase64 = 'data:image/jpeg;base64,' + Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 1, 2, 3]).toString('base64');
const validDocxBase64 = 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,' + Buffer.from([0x50, 0x4B, 0x03, 0x04, 1, 2, 3, 4]).toString('base64');

describe('Learner Records Endpoints (L1–L7)', () => {
  const orgId = 'org-welearn';
  const coachUser = {
    uid: 'coach-1',
    displayName: 'Coach Sara',
    orgId,
    signedClaims: { role: 'teacher', orgId, classIds: ['class-alpha'] },
    classIds: ['class-alpha']
  };
  const otherCoach = {
    uid: 'coach-2',
    displayName: 'Coach Dan',
    orgId,
    signedClaims: { role: 'coach', orgId, classIds: ['class-beta'] },
    classIds: ['class-beta']
  };
  const adminUser = {
    uid: 'admin-1',
    displayName: 'Admin Mani',
    orgId,
    signedClaims: { role: 'admin', orgId, classIds: [] },
    classIds: []
  };
  const supervisorUser = {
    uid: 'sup-1',
    displayName: 'Supervisor Emma',
    orgId,
    signedClaims: { role: 'supervisor', orgId, classIds: [] },
    classIds: []
  };

  beforeEach(() => {
    usersStore.clear();
    recordsStore.clear();
    storageFiles.clear();
    savedFiles.length = 0;
    deletedFiles.length = 0;
    auditLogsStore.length = 0;

    // Seed learners
    usersStore.set('learner-1', {
      id: 'learner-1',
      uid: 'learner-1',
      role: 'student',
      orgId,
      displayName: 'Alex Chen',
      classIds: ['class-alpha']
    });
    usersStore.set('learner-2', {
      id: 'learner-2',
      uid: 'learner-2',
      role: 'student',
      orgId,
      displayName: 'Mia Wong',
      classIds: ['class-beta']
    });
    usersStore.set('learner-3', {
      id: 'learner-3',
      uid: 'learner-3',
      role: 'student',
      orgId: 'org-other',
      displayName: 'Foreign Student',
      classIds: ['class-alpha']
    });
  });

  describe('L1: GET /learner-records/learners', () => {
    it('returns students whose classIds intersect caller claim classIds in same org', async () => {
      const res = await callRouter('GET', '/learner-records/learners', { caller: coachUser });
      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0]).toEqual({ id: 'learner-1', displayName: 'Alex Chen' });
    });

    it('returns empty list if coach has no assigned classes', async () => {
      const noClassCoach = { ...coachUser, signedClaims: { role: 'teacher', orgId, classIds: [] }, classIds: [] };
      const res = await callRouter('GET', '/learner-records/learners', { caller: noClassCoach });
      expect(res.status).toBe(200);
      expect(res.body.items).toEqual([]);
    });

    it('returns all org learners for admin with no class restriction', async () => {
      const res = await callRouter('GET', '/learner-records/learners', { caller: adminUser });
      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(2);
      expect(res.body.items.map((i) => i.id).sort()).toEqual(['learner-1', 'learner-2']);
    });
  });

  describe('L2: GET /learner-records', () => {
    beforeEach(() => {
      recordsStore.set('rec-1', {
        id: 'rec-1',
        orgId,
        learnerUid: 'learner-1',
        coachUid: 'coach-1',
        title: 'Rec 1',
        status: 'submitted',
        storagePath: 'learnerRecords/org/l1/rec-1/p.pdf',
        fileData: 'secret-bytes',
        createdAt: '2026-11-20T10:00:00Z'
      });
      recordsStore.set('rec-2', {
        id: 'rec-2',
        orgId,
        learnerUid: 'learner-2',
        coachUid: 'coach-2',
        title: 'Rec 2',
        status: 'approved',
        storagePath: 'learnerRecords/org/l2/rec-2/p.pdf',
        createdAt: '2026-11-21T10:00:00Z'
      });
    });

    it('returns only coach own uploads for coach, newest first, omitting storagePath and fileData', async () => {
      const res = await callRouter('GET', '/learner-records', { caller: coachUser });
      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].id).toBe('rec-1');
      expect(res.body.items[0].storagePath).toBeUndefined();
      expect(res.body.items[0].fileData).toBeUndefined();
    });

    it('returns all uploads in org for admin/supervisor, sorted newest first', async () => {
      const res = await callRouter('GET', '/learner-records', { caller: adminUser });
      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(2);
      expect(res.body.items[0].id).toBe('rec-2');
      expect(res.body.items[1].id).toBe('rec-1');
      expect(res.body.items[0].storagePath).toBeUndefined();
    });
  });

  describe('L3: POST /learner-records', () => {
    const validUpload = {
      learnerUid: 'learner-1',
      type: 'portfolio',
      title: 'Term 1 Portfolio',
      term: 'Term 1',
      note: 'Note for review',
      fileName: 'portfolio.pdf',
      contentType: 'application/pdf',
      fileData: validPdfBase64
    };

    it('successfully uploads valid PDF file and stores in Storage and Firestore', async () => {
      const res = await callRouter('POST', '/learner-records', { caller: coachUser, body: validUpload });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');

      const saved = recordsStore.get(res.body.id);
      expect(saved).toBeDefined();
      expect(saved.title).toBe('Term 1 Portfolio');
      expect(saved.status).toBe('submitted');
      expect(saved.coachUid).toBe(coachUser.uid);
      expect(saved.coachName).toBe('Coach Sara');
      expect(saved.learnerName).toBe('Alex Chen');
      expect(saved.storagePath).toMatch(/^learnerRecords\/org-welearn\/learner-1\//);

      expect(savedFiles).toHaveLength(1);
      expect(savedFiles[0].options.metadata.contentType).toBe('application/pdf');
    });

    it('accepts valid PNG, JPG, and DOCX files with correct magic bytes', async () => {
      const pngRes = await callRouter('POST', '/learner-records', {
        caller: coachUser,
        body: { ...validUpload, fileName: 'img.png', contentType: 'image/png', fileData: validPngBase64 }
      });
      expect(pngRes.status).toBe(201);

      const jpgRes = await callRouter('POST', '/learner-records', {
        caller: coachUser,
        body: { ...validUpload, fileName: 'img.jpg', contentType: 'image/jpeg', fileData: validJpgBase64 }
      });
      expect(jpgRes.status).toBe(201);

      const docxRes = await callRouter('POST', '/learner-records', {
        caller: coachUser,
        body: { ...validUpload, fileName: 'doc.docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', fileData: validDocxBase64 }
      });
      expect(docxRes.status).toBe(201);
    });

    it('rejects uploads for learners not in coach classes', async () => {
      const res = await callRouter('POST', '/learner-records', {
        caller: coachUser,
        body: { ...validUpload, learnerUid: 'learner-2' }
      });
      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/classes/);
    });

    it('rejects invalid or mismatched magic bytes', async () => {
      const fakePdf = 'data:application/pdf;base64,' + Buffer.from('NOT A PDF FILE').toString('base64');
      const res = await callRouter('POST', '/learner-records', {
        caller: coachUser,
        body: { ...validUpload, fileData: fakePdf }
      });
      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/chosen file type/);
    });

    it('rejects oversized files (> 5 MB)', async () => {
      // 5 MB + 10 bytes
      const bigBuffer = Buffer.alloc(5 * 1024 * 1024 + 10);
      bigBuffer.write('%PDF-');
      const bigPdf = 'data:application/pdf;base64,' + bigBuffer.toString('base64');
      const res = await callRouter('POST', '/learner-records', {
        caller: coachUser,
        body: { ...validUpload, fileData: bigPdf }
      });
      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/5 MB/);
    });

    it('rejects non-teacher/coach callers', async () => {
      const res = await callRouter('POST', '/learner-records', { caller: adminUser, body: validUpload });
      expect(res.status).toBe(403);
    });
  });

  describe('L4: GET /learner-records/:id/download', () => {
    beforeEach(() => {
      recordsStore.set('rec-1', {
        id: 'rec-1',
        orgId,
        learnerUid: 'learner-1',
        coachUid: 'coach-1',
        fileName: 'my-report.pdf',
        storagePath: 'learnerRecords/org-welearn/learner-1/rec-1/my-report.pdf',
        status: 'submitted'
      });
    });

    it('allows owning coach to download signed URL with attachment Content-Disposition', async () => {
      const res = await callRouter('GET', '/learner-records/rec-1/download', { caller: coachUser });
      expect(res.status).toBe(200);
      expect(res.body.fileName).toBe('my-report.pdf');
      expect(res.body.url).toContain('https://storage.googleapis.com/download');
      expect(res.body.url).toContain('attachment');
    });

    it('allows admin and supervisor to download any in org', async () => {
      const adminRes = await callRouter('GET', '/learner-records/rec-1/download', { caller: adminUser });
      expect(adminRes.status).toBe(200);

      const supRes = await callRouter('GET', '/learner-records/rec-1/download', { caller: supervisorUser });
      expect(supRes.status).toBe(200);
    });

    it('blocks other coaches from downloading', async () => {
      const res = await callRouter('GET', '/learner-records/rec-1/download', { caller: otherCoach });
      expect(res.status).toBe(403);
    });

    it('returns 404 for nonexistent records', async () => {
      const res = await callRouter('GET', '/learner-records/nonexistent/download', { caller: adminUser });
      expect(res.status).toBe(404);
    });
  });

  describe('L5: PATCH /learner-records/:id (review)', () => {
    beforeEach(() => {
      recordsStore.set('rec-1', {
        id: 'rec-1',
        orgId,
        learnerUid: 'learner-1',
        coachUid: 'coach-1',
        title: 'Project 1',
        status: 'submitted',
        storagePath: 'path/to/rec-1'
      });
    });

    it('allows admin to approve a submitted record and writes audit log', async () => {
      const res = await callRouter('PATCH', '/learner-records/rec-1', {
        caller: adminUser,
        body: { status: 'approved', response: 'Looks great!' }
      });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('approved');
      expect(res.body.response).toBe('Looks great!');
      expect(res.body.storagePath).toBeUndefined();
      expect(res.body.updatedBy.uid).toBe('admin-1');

      expect(auditLogsStore.some((l) => l.action === 'LEARNER_RECORD_APPROVED')).toBe(true);
    });

    it('allows admin to return a submitted record with a required response note', async () => {
      const res = await callRouter('PATCH', '/learner-records/rec-1', {
        caller: adminUser,
        body: { status: 'returned', response: 'Please add reflection' }
      });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('returned');
      expect(auditLogsStore.some((l) => l.action === 'LEARNER_RECORD_RETURNED')).toBe(true);
    });

    it('rejects returning a record without a response note', async () => {
      const res = await callRouter('PATCH', '/learner-records/rec-1', {
        caller: adminUser,
        body: { status: 'returned', response: '   ' }
      });
      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/response note/);
    });

    it('rejects reviews on already approved or returned records (409 CONFLICT)', async () => {
      recordsStore.get('rec-1').status = 'approved';
      const res = await callRouter('PATCH', '/learner-records/rec-1', {
        caller: adminUser,
        body: { status: 'returned', response: 'Change mind' }
      });
      expect(res.status).toBe(409);
    });

    it('rejects non-admin roles (coaches, supervisors)', async () => {
      const coachRes = await callRouter('PATCH', '/learner-records/rec-1', {
        caller: coachUser,
        body: { status: 'approved' }
      });
      expect(coachRes.status).toBe(403);

      const supRes = await callRouter('PATCH', '/learner-records/rec-1', {
        caller: supervisorUser,
        body: { status: 'approved' }
      });
      expect(supRes.status).toBe(403);
    });
  });

  describe('L6: PATCH /learner-records/:id (share with parents)', () => {
    beforeEach(() => {
      recordsStore.set('rec-approved', {
        id: 'rec-approved',
        orgId,
        learnerUid: 'learner-1',
        coachUid: 'coach-1',
        title: 'Project Approved',
        status: 'approved',
        sharedWithParents: false,
        sharedAt: null,
        storagePath: 'path/to/rec'
      });
      recordsStore.set('rec-submitted', {
        id: 'rec-submitted',
        orgId,
        learnerUid: 'learner-1',
        coachUid: 'coach-1',
        title: 'Project Pending',
        status: 'submitted',
        sharedWithParents: false,
        storagePath: 'path/to/rec'
      });
    });

    it('allows admin to set sharedWithParents on approved records, updating sharedAt and audit log', async () => {
      const res = await callRouter('PATCH', '/learner-records/rec-approved', {
        caller: adminUser,
        body: { sharedWithParents: true }
      });
      expect(res.status).toBe(200);
      expect(res.body.sharedWithParents).toBe(true);
      expect(res.body.sharedAt).toBeDefined();
      expect(auditLogsStore.some((l) => l.action === 'LEARNER_RECORD_SHARED')).toBe(true);
    });

    it('allows admin to unmark sharedWithParents, clearing sharedAt', async () => {
      recordsStore.get('rec-approved').sharedWithParents = true;
      recordsStore.get('rec-approved').sharedAt = '2026-11-20T00:00:00Z';

      const res = await callRouter('PATCH', '/learner-records/rec-approved', {
        caller: adminUser,
        body: { sharedWithParents: false }
      });
      expect(res.status).toBe(200);
      expect(res.body.sharedWithParents).toBe(false);
      expect(res.body.sharedAt).toBeNull();
      expect(auditLogsStore.some((l) => l.action === 'LEARNER_RECORD_UNSHARED')).toBe(true);
    });

    it('rejects sharing non-approved records with 409 CONFLICT', async () => {
      const res = await callRouter('PATCH', '/learner-records/rec-submitted', {
        caller: adminUser,
        body: { sharedWithParents: true }
      });
      expect(res.status).toBe(409);
      expect(res.body.error.message).toMatch(/approved/);
    });
  });

  describe('L7: DELETE /learner-records/:id (withdraw)', () => {
    beforeEach(() => {
      recordsStore.set('rec-1', {
        id: 'rec-1',
        orgId,
        learnerUid: 'learner-1',
        coachUid: 'coach-1',
        status: 'submitted',
        storagePath: 'learnerRecords/org-welearn/learner-1/rec-1/p.pdf'
      });
      storageFiles.set('learnerRecords/org-welearn/learner-1/rec-1/p.pdf', Buffer.from('data'));
    });

    it('allows owning coach to withdraw submitted record, deleting firestore doc and storage file', async () => {
      const res = await callRouter('DELETE', '/learner-records/rec-1', { caller: coachUser });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
      expect(recordsStore.has('rec-1')).toBe(false);
      expect(deletedFiles).toContain('learnerRecords/org-welearn/learner-1/rec-1/p.pdf');
    });

    it('rejects withdrawal if record is already approved or returned (409 CONFLICT)', async () => {
      recordsStore.get('rec-1').status = 'approved';
      const res = await callRouter('DELETE', '/learner-records/rec-1', { caller: coachUser });
      expect(res.status).toBe(409);
      expect(recordsStore.has('rec-1')).toBe(true);
    });

    it('rejects withdrawal by another coach (403 FORBIDDEN)', async () => {
      const res = await callRouter('DELETE', '/learner-records/rec-1', { caller: otherCoach });
      expect(res.status).toBe(403);
      expect(recordsStore.has('rec-1')).toBe(true);
    });
  });
});
