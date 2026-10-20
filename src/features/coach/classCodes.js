/**
 * Coach-side class codes and program assignment, from the browser.
 *
 * Like learner enrolment (features/enrolment/joinClass.js) this runs
 * client-side because no backend is deployed, and its safety comes from
 * firestore.rules, not from this file: a coach can only issue or revoke codes
 * for classes in their own `classIds` claim, an issued code must be pointed
 * at by its class in the same write, and an existing code can never be
 * rewritten. See the "coaches manage join codes" rules tests.
 *
 * The class document's `joinCode` is the one code a coach manages. Codes
 * issued by admin tooling for the same class are left alone.
 */
import {
  db, doc, getDoc, updateDoc, runTransaction, serverTimestamp
} from '../../firebase.js';
import { generateJoinCode } from '../../utils/joinCode.js';

/** Unbiased crypto randomness for codes; Math.random is predictable. */
function secureRandomInt(n) {
  const limit = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  do { crypto.getRandomValues(buf); } while (buf[0] >= limit);
  return buf[0] % n;
}

const exists = (snap) => (typeof snap?.exists === 'function' ? snap.exists() : !!snap?.exists);

/** The coach's classes, in claim order. A class that cannot be read is reported, not dropped. */
export async function loadClasses(classIds) {
  return Promise.all((classIds || []).map(async (id) => {
    try {
      const snap = await getDoc(doc(db, 'classes', id));
      if (!exists(snap)) return { id, missing: true };
      const d = snap.data() || {};
      return { id, name: d.name || id, joinCode: d.joinCode || null, programId: d.programId || null };
    } catch (err) {
      console.warn('[Coach] Could not read class', id, err?.code || err?.message);
      return { id, error: true };
    }
  }));
}

/**
 * Issue a code for a class, replacing its current one if it has one.
 * Returns the new code. The old code stops working in the same write.
 */
export async function issueCode(cls, uid) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateJoinCode(secureRandomInt);
    const codeRef = doc(db, 'classCodes', code);
    const classRef = doc(db, 'classes', cls.id);
    const issued = await runTransaction(db, async (tx) => {
      // An existing code can never be rewritten (the rules deny it), so a
      // collision just means "pick another".
      if (exists(await tx.get(codeRef))) return null;
      const classSnap = await tx.get(classRef);
      const current = classSnap.data()?.joinCode || null;
      if (current && current !== code) {
        const oldRef = doc(db, 'classCodes', current);
        const oldSnap = await tx.get(oldRef);
        if (exists(oldSnap) && oldSnap.data()?.classId === cls.id) tx.delete(oldRef);
      }
      tx.set(codeRef, { classId: cls.id, className: String(cls.name || cls.id).slice(0, 120), createdBy: uid, createdAt: serverTimestamp() });
      tx.update(classRef, { joinCode: code, updatedAt: serverTimestamp() });
      return code;
    });
    if (issued) return issued;
  }
  throw new Error('Could not find an unused code. Please try again.');
}

/** Revoke the class's code. Nobody can join until a new one is issued. */
export async function revokeCode(cls) {
  const classRef = doc(db, 'classes', cls.id);
  await runTransaction(db, async (tx) => {
    const current = (await tx.get(classRef)).data()?.joinCode || null;
    if (current) {
      const oldRef = doc(db, 'classCodes', current);
      const oldSnap = await tx.get(oldRef);
      if (exists(oldSnap) && oldSnap.data()?.classId === cls.id) tx.delete(oldRef);
    }
    tx.update(classRef, { joinCode: null, updatedAt: serverTimestamp() });
  });
}

/** Assign (or clear, with null) the PBL program a class runs. */
export function setClassProgram(cls, programId) {
  return updateDoc(doc(db, 'classes', cls.id), { programId: programId || null, updatedAt: serverTimestamp() });
}

/** What a coach should hear when a write is refused. */
export function explainError(err) {
  if (err?.code === 'permission-denied') {
    return 'You do not have permission to change this class. If you were just added to it, sign out and back in.';
  }
  return err?.message || 'Something went wrong. Please try again.';
}
