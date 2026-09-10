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
 * Sign up a new user with Email and Password
 * Creates a user profile document in Firestore upon registration
 */
export async function signUpUser(email, password, displayName = "", role = "student", groupName = "Climate Champions") {
  try {
    const cleanEmail = email.trim().toLowerCase();
    localStorage.setItem(`pending_user_role_${cleanEmail}`, role || "student");

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user document in Firestore matching security rules schema
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email,
      displayName: displayName || email.split("@")[0],
      role: role || "student",
      groupName: groupName || "Climate Champions",
      isFirstTimeUser: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    localStorage.removeItem(`pending_user_role_${cleanEmail}`);
    return { success: true, user, role: role || "student" };
  } catch (error) {
    console.error("Error signing up:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch User Profile Document from Firestore
 */
export async function getUserProfile(userId) {
  if (!userId) return null;
  try {
    const userDocRef = doc(db, "users", userId);
    const docSnap = await getDoc(userDocRef);
    const userEmail = (auth.currentUser?.email || "").toLowerCase();
    const isEmailCoach = userEmail.includes("coach") || userEmail.includes("teacher");

    if (docSnap.exists) {
      const data = docSnap.data();
      let role = data.role;
      if (isEmailCoach || role === "teacher" || role === "coach") {
        role = "teacher";
        if (data.role !== "teacher") {
          await setDoc(userDocRef, { role: "teacher" }, { merge: true });
        }
      } else {
        role = role || "student";
      }

      return {
        uid: userId,
        displayName: data.displayName || data.email?.split("@")[0] || "User",
        email: data.email || auth.currentUser?.email || "",
        groupName: data.groupName || "Climate Champions",
        ...data,
        role: role
      };
    } else {
      // Check if there is a pending cached role for this user email
      const cachedRole = userEmail ? localStorage.getItem(`pending_user_role_${userEmail}`) : null;
      const assignedRole = (isEmailCoach || cachedRole === "teacher" || cachedRole === "coach") ? "teacher" : (cachedRole || "student");

      const defaultData = {
        uid: userId,
        email: auth.currentUser?.email || "",
        displayName: auth.currentUser?.displayName || (auth.currentUser?.email ? auth.currentUser.email.split("@")[0] : "Coach User"),
        role: assignedRole,
        groupName: "Climate Champions",
        createdAt: Date.now()
      };
      await setDoc(userDocRef, defaultData, { merge: true });
      return defaultData;
    }
  } catch (err) {
    console.error("Error fetching user profile:", err);
    const isEmailCoach = (auth.currentUser?.email || "").toLowerCase().includes("coach") || (auth.currentUser?.email || "").toLowerCase().includes("teacher");
    return { uid: userId, role: isEmailCoach ? "teacher" : "student", groupName: "Climate Champions" };
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
 * Listen for Authentication state changes
 */
export function subscribeToAuth(callback) {
  return onAuthStateChanged(auth, callback);
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
