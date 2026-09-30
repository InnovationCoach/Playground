import { 
  auth, 
  db, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  serverTimestamp
} from "./firebase.js";

/**
 * Age bands a learner may choose when they sign themselves up: secondary only.
 * Accounts created before 2026-09-18 carry retired values ('6-9', '10-13') and
 * fall back to the default until scripts/migrate-age-bands.js runs.
 *
 * 'primary' (ages 6-11, the Junior Explorers section) was added 2026-09-25. It is
 * never self-selected: the school creates those accounts after verified parental
 * consent, so it is accepted when READING a profile but not offered at sign-up.
 */
export const AGE_BANDS = ["13-15", "16-18"];
export const PRIMARY_AGE_BAND = "primary";
export const DEFAULT_AGE_BAND = "13-15";
const READABLE_AGE_BANDS = [...AGE_BANDS, PRIMARY_AGE_BAND];

export const isPrimaryProfile = (profile) => profile?.ageBand === PRIMARY_AGE_BAND;

/**
 * Sign up a new user with Email and Password
 *
 * The profile is always created with role "student". `role` is a privilege
 * boundary and Firestore rules reject any create that sets it to anything else
 * (see firestore.rules -> users/{userId}). Coach access is granted out-of-band
 * with the Admin SDK - see scripts/grant-coach.js.
 */
export async function signUpUser(email, password, displayName = "", _role = "student", groupName = "Climate Champions", ageBand = "13-15") {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email,
      displayName: displayName || email.split("@")[0],
      role: "student",
      groupName: groupName || "Climate Champions",
      // Drives the reading level and vocabulary the AI tutor uses. A platform
      // spanning ages 6-18 cannot address every child in the same register.
      ageBand: AGE_BANDS.includes(ageBand) ? ageBand : DEFAULT_AGE_BAND,
      classIds: [],
      isFirstTimeUser: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return { success: true, user, role: "student" };
  } catch (error) {
    console.error("Error signing up:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch the user's profile document from Firestore.
 *
 * `role` comes from the stored document and nothing else. It is deliberately
 * NOT derived from the email address: anyone can register an address containing
 * "coach", so treating that as a privilege signal let any student into the coach
 * UI. It is also not read from localStorage, which the user can edit freely.
 *
 * Returns null when the profile cannot be read, so callers fail closed rather
 * than falling back to a guessed role.
 */
export async function getUserProfile(userId, optionalEmail = null) {
  if (!userId) return null;
  try {
    const userDocRef = doc(db, "users", userId);
    const docSnap = await getDoc(userDocRef);
    const docExists = typeof docSnap?.exists === 'function' ? docSnap.exists() : !!docSnap?.exists;
    const currentEmail = (optionalEmail || auth.currentUser?.email || "").toLowerCase();

    if (!docExists) {
      // First sign-in for an account whose profile write did not land. Recreate
      // it as a student; rules reject any other role on create anyway.
      const defaultData = {
        uid: userId,
        email: currentEmail,
        displayName: currentEmail ? currentEmail.split("@")[0] : "Student",
        role: "student",
        groupName: "Climate Champions 7A",
        ageBand: DEFAULT_AGE_BAND,
        classIds: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(userDocRef, defaultData, { merge: true })
        .catch((e) => console.warn("[Auth] Failed to create profile:", e.message));
      return { ...defaultData, role: "student" };
    }

    const data = docSnap.data() || {};
    const role = data.role === "teacher" || data.role === "coach" ? data.role : "student";

    return {
      ...data,
      uid: userId,
      displayName: data.displayName || (data.email || currentEmail).split("@")[0] || "User",
      email: data.email || currentEmail,
      groupName: data.groupName || "Climate Champions 7A",
      classIds: Array.isArray(data.classIds) ? data.classIds : [],
      ageBand: READABLE_AGE_BANDS.includes(data.ageBand) ? data.ageBand : DEFAULT_AGE_BAND,
      role
    };
  } catch (err) {
    // Fail closed. Returning a guessed role here was how a failed read could
    // hand out coach access.
    console.error("[Auth] Error fetching user profile:", err);
    return null;
  }
}


/**
 * Sign in existing user with Email and Password
 */
export async function signInUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error("Error signing in:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Sign out current authenticated user
 */
export async function logoutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Error signing out:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Listen for Authentication state changes.
 *
 * Waits for index.html's stale-session check (window.__hearIslandAuthReady)
 * before subscribing. Without the wait, the first event could be a user restored
 * from a previous person's session, and the dashboard would render their data
 * before the check signed them out.
 */
export function subscribeToAuth(callback) {
  let unsubscribe = null;
  let cancelled = false;
  Promise.resolve(window.__hearIslandAuthReady)
    .catch(() => {})
    .then(() => {
      if (!cancelled) unsubscribe = onAuthStateChanged(auth, callback);
    });
  return () => {
    cancelled = true;
    unsubscribe?.();
  };
}

/**
 * Create a new note in Firestore for authenticated user
 */
export async function createNote(title, content) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("User must be authenticated to create a note");

  const notesCollectionRef = collection(db, "users", currentUser.uid, "notes");
  const docRef = await addDoc(notesCollectionRef, {
    title,
    content,
    uid: currentUser.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return docRef.id;
}

/**
 * Fetch all notes for authenticated user
 */
export async function fetchNotes() {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("User must be authenticated to fetch notes");

  const notesCollectionRef = collection(db, "users", currentUser.uid, "notes");
  const querySnapshot = await getDocs(notesCollectionRef);
  const notes = [];
  querySnapshot.forEach((docSnap) => {
    notes.push({ id: docSnap.id, ...docSnap.data() });
  });
  return notes;
}

/**
 * Delete a note for authenticated user
 */
export async function deleteNote(noteId) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("User must be authenticated to delete a note");

  const noteDocRef = doc(db, "users", currentUser.uid, "notes", noteId);
  await deleteDoc(noteDocRef);
}

/**
 * Change the signed-in user's password. Firebase requires a recent sign-in for
 * this, so the current password is always re-verified first - which also stops
 * someone at an unattended, signed-in classroom device from changing it.
 *
 * Resolves to { ok: true } or { ok: false, reason } where reason is one of
 * 'wrong-password' | 'weak-password' | 'too-many-requests' | 'unknown'.
 */
export async function changePassword(currentPassword, newPassword) {
  const user = auth.currentUser;
  if (!user?.email) return { ok: false, reason: 'unknown' };
  try {
    const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
    await user.reauthenticateWithCredential(credential);
    await user.updatePassword(newPassword);
    return { ok: true };
  } catch (err) {
    const code = err?.code || '';
    if (['auth/wrong-password', 'auth/invalid-credential', 'auth/invalid-login-credentials'].includes(code)) return { ok: false, reason: 'wrong-password' };
    if (code === 'auth/weak-password') return { ok: false, reason: 'weak-password' };
    if (code === 'auth/too-many-requests') return { ok: false, reason: 'too-many-requests' };
    console.error('[Auth] Password change failed:', code || err);
    return { ok: false, reason: 'unknown' };
  }
}

/**
 * Send Firebase's password-reset email.
 *
 * "No such user" is reported as success on purpose: a different message for
 * unknown addresses would let anyone test which emails have accounts.
 * Resolves to { ok: true } or { ok: false, reason: 'invalid-email' |
 * 'too-many-requests' | 'unknown' }.
 */
export async function sendPasswordReset(email) {
  try {
    await auth.sendPasswordResetEmail(String(email || '').trim());
    return { ok: true };
  } catch (err) {
    const code = err?.code || '';
    if (code === 'auth/user-not-found') return { ok: true };
    if (code === 'auth/invalid-email' || code === 'auth/missing-email') return { ok: false, reason: 'invalid-email' };
    if (code === 'auth/too-many-requests') return { ok: false, reason: 'too-many-requests' };
    console.error('[Auth] Password reset failed:', code || err);
    return { ok: false, reason: 'unknown' };
  }
}

/** Save the interface language to the user's own profile (rules allow self-updates that leave role/classIds alone). */
export async function saveLocale(uid, locale) {
  await setDoc(doc(db, "users", uid), { locale, updatedAt: serverTimestamp() }, { merge: true });
}
