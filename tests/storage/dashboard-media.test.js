import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, describe, it } from 'vitest';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, deleteObject } from 'firebase/storage';

describe('Dashboard and Feature Storage rules', () => {
  let env;
  const projectId = 'demo-hearisland-local';

  beforeAll(async () => {
    env = await initializeTestEnvironment({
      projectId,
      firestore: { host: '127.0.0.1', port: 8088 },
      storage: { host: '127.0.0.1', port: 9199, rules: readFileSync('storage.rules', 'utf8') },
    });

    await env.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      // Users
      await setDoc(doc(db, 'users', 'student-alice'), { role: 'student', status: 'active' });
      await setDoc(doc(db, 'users', 'student-bob'), { role: 'student', status: 'active' });
      await setDoc(doc(db, 'users', 'suspended-user'), { role: 'student', status: 'suspended' });
      await setDoc(doc(db, 'users', 'coach-charlie'), { role: 'coach', status: 'active' });
      await setDoc(doc(db, 'conversations', 'conv-abc'), { participantIds: ['student-alice', 'coach-charlie'] });
    });
  });

  afterAll(async () => env?.cleanup());

  function getStorage(uid, claims = {}) {
    return env.authenticatedContext(uid, claims).storage();
  }

  function getUnauthStorage() {
    return env.unauthenticatedContext().storage();
  }

  describe('learnerMedia (Student & Coach Avatars, Banners, Portfolios)', () => {
    it('allows an active student to upload their own profile/banner image and delete it', async () => {
      const storage = getStorage('student-alice', { role: 'student' });
      const path = 'learnerMedia/student-alice/upload123/avatar.png';
      await assertSucceeds(
        uploadBytes(ref(storage, path), new Uint8Array([1, 2, 3]), { contentType: 'image/png' })
      );
      await assertSucceeds(deleteObject(ref(storage, path)));
    });

    it('allows an active coach to upload their own profile/banner image', async () => {
      const storage = getStorage('coach-charlie', { role: 'coach' });
      const path = 'learnerMedia/coach-charlie/upload456/banner.jpg';
      await assertSucceeds(
        uploadBytes(ref(storage, path), new Uint8Array([1, 2, 3]), { contentType: 'image/jpeg' })
      );
    });

    it('blocks a user from uploading or deleting another user\'s learnerMedia', async () => {
      const storage = getStorage('student-bob', { role: 'student' });
      const path = 'learnerMedia/student-alice/upload123/hacked.png';
      await assertFails(
        uploadBytes(ref(storage, path), new Uint8Array([1, 2, 3]), { contentType: 'image/png' })
      );
      await assertFails(deleteObject(ref(storage, 'learnerMedia/student-alice/upload123/avatar.png')));
    });

    it('blocks suspended users from uploading to learnerMedia', async () => {
      const storage = getStorage('suspended-user', { role: 'student' });
      const path = 'learnerMedia/suspended-user/upload789/avatar.png';
      await assertFails(
        uploadBytes(ref(storage, path), new Uint8Array([1, 2, 3]), { contentType: 'image/png' })
      );
    });

    it('blocks unauthenticated uploads to learnerMedia', async () => {
      const storage = getUnauthStorage();
      const path = 'learnerMedia/student-alice/upload123/avatar.png';
      await assertFails(
        uploadBytes(ref(storage, path), new Uint8Array([1, 2, 3]), { contentType: 'image/png' })
      );
    });

    it('rejects unallowed MIME types or oversized files (>20MB) in learnerMedia', async () => {
      const storage = getStorage('student-alice', { role: 'student' });
      const path = 'learnerMedia/student-alice/upload123/bad.exe';
      await assertFails(
        uploadBytes(ref(storage, path), new Uint8Array([1, 2, 3]), { contentType: 'application/x-msdownload' })
      );

      // Oversized (> 20 MB)
      const bigFile = new Uint8Array(21 * 1024 * 1024);
      await assertFails(
        uploadBytes(ref(storage, 'learnerMedia/student-alice/upload123/big.png'), bigFile, { contentType: 'image/png' })
      );
    });
  });

  describe('community media', () => {
    it('allows a user to upload and delete images to the 2-segment path community/${uid}/${filename}', async () => {
      const storage = getStorage('student-alice');
      const path = 'community/student-alice/post-image.jpg';
      await assertSucceeds(
        uploadBytes(ref(storage, path), new Uint8Array([1, 2, 3]), { contentType: 'image/jpeg' })
      );
      await assertSucceeds(deleteObject(ref(storage, path)));
    });

    it('allows a user to upload and delete images to the 3-segment path community/${uid}/${postId}/${filename}', async () => {
      const storage = getStorage('student-alice');
      const path = 'community/student-alice/post123/post-image.png';
      await assertSucceeds(
        uploadBytes(ref(storage, path), new Uint8Array([1, 2, 3]), { contentType: 'image/png' })
      );
      await assertSucceeds(deleteObject(ref(storage, path)));
    });

    it('blocks a user from uploading to another user\'s community path', async () => {
      const storage = getStorage('student-bob');
      const path = 'community/student-alice/imposter.jpg';
      await assertFails(
        uploadBytes(ref(storage, path), new Uint8Array([1, 2, 3]), { contentType: 'image/jpeg' })
      );
    });

    it('blocks unauthenticated uploads to community paths', async () => {
      const storage = getUnauthStorage();
      const path = 'community/student-alice/unauth.jpg';
      await assertFails(
        uploadBytes(ref(storage, path), new Uint8Array([1, 2, 3]), { contentType: 'image/jpeg' })
      );
    });
  });

  describe('messages attachments (members only, create-only)', () => {
    it('lets a conversation member upload to messages/${convId}/${msgId}/${filename} but not delete', async () => {
      const storage = getStorage('student-alice');
      const path = 'messages/conv-abc/msg-1/attachment.png';
      await assertSucceeds(
        uploadBytes(ref(storage, path), new Uint8Array([1, 2, 3]), { contentType: 'image/png' })
      );
      await assertFails(deleteObject(ref(storage, path)));
    });

    it('blocks a signed-in non-member and the old 2-segment path', async () => {
      await assertFails(
        uploadBytes(ref(getStorage('student-bob'), 'messages/conv-abc/msg-2/attachment.png'), new Uint8Array([1, 2, 3]), { contentType: 'image/png' })
      );
      await assertFails(
        uploadBytes(ref(getStorage('student-alice'), 'messages/conv-abc/attachment.png'), new Uint8Array([1, 2, 3]), { contentType: 'image/png' })
      );
    });

    it('blocks unauthenticated message attachments', async () => {
      const storage = getUnauthStorage();
      const path = 'messages/conv-abc/msg-3/unauth.png';
      await assertFails(
        uploadBytes(ref(storage, path), new Uint8Array([1, 2, 3]), { contentType: 'image/png' })
      );
    });
  });

  describe('solarCar challenge uploads', () => {
    it('allows owner to upload valid image and delete it', async () => {
      const storage = getStorage('student-alice');
      const path = 'solarCar/student-alice/iteration1.jpg';
      await assertSucceeds(
        uploadBytes(ref(storage, path), new Uint8Array([1, 2, 3]), { contentType: 'image/jpeg' })
      );
      await assertSucceeds(deleteObject(ref(storage, path)));
    });

    it('blocks owner from uploading non-image / disallowed file type to solarCar', async () => {
      const storage = getStorage('student-alice');
      const path = 'solarCar/student-alice/script.py';
      await assertFails(
        uploadBytes(ref(storage, path), new Uint8Array([1, 2, 3]), { contentType: 'text/x-python' })
      );
    });

    it('blocks non-owner from uploading to another user\'s solarCar path', async () => {
      const storage = getStorage('student-bob');
      const path = 'solarCar/student-alice/car.jpg';
      await assertFails(
        uploadBytes(ref(storage, path), new Uint8Array([1, 2, 3]), { contentType: 'image/jpeg' })
      );
    });
  });
});
