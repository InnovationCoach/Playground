import fs from 'node:fs';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = 'dnd-master-73449';

const config = JSON.parse(fs.readFileSync('/Users/admin/.config/configstore/firebase-tools.json', 'utf8'));
const refreshToken = config.tokens?.refresh_token;

async function getValidAccessToken() {
  if (!refreshToken) throw new Error("No refresh token found");
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  });
  const data = await resp.json();
  return data.access_token;
}

async function checkProductionState() {
  const token = await getValidAccessToken();
  const app = initializeApp({
    credential: {
      getAccessToken: () => Promise.resolve({
        access_token: token,
        expires_in: 3600
      })
    },
    projectId: PROJECT_ID
  });

  const auth = getAuth(app);
  const db = getFirestore(app);

  console.log("=== INSPECTING PRODUCTION FIRESTORE & AUTH STATE ===\n");

  // 1. List Schools
  const schoolsSnap = await db.collection('schools').get();
  console.log(`Schools count: ${schoolsSnap.size}`);
  for (const doc of schoolsSnap.docs) {
    console.log(`- School ID: '${doc.id}', Name: '${doc.data().name}', Status: '${doc.data().status}'`);
  }

  // 2. List Classes
  const classesSnap = await db.collection('classes').get();
  console.log(`\nClasses count: ${classesSnap.size}`);
  for (const doc of classesSnap.docs) {
    console.log(`- Class ID: '${doc.id}', Name: '${doc.data().name}', SchoolId: '${doc.data().schoolId}', Status: '${doc.data().status}'`);
  }

  // 3. List Users in Auth & Firestore
  console.log(`\nUser Profiles in Firestore:`);
  const usersSnap = await db.collection('users').get();
  for (const doc of usersSnap.docs) {
    const u = doc.data();
    let authUser = null;
    try {
      authUser = await auth.getUser(doc.id);
    } catch (e) {
      try { authUser = await auth.getUserByEmail(u.email); } catch {}
    }
    const customClaims = authUser?.customClaims || {};
    console.log(`----------------------------------------`);
    console.log(`User: ${u.email} (UID: ${doc.id})`);
    console.log(`  DisplayName: '${u.displayName}'`);
    console.log(`  Role in Firestore: '${u.role}', Status: '${u.status}'`);
    console.log(`  Firestore schoolIds: [${(u.schoolIds || []).join(', ')}]`);
    console.log(`  Firestore classIds: [${(u.classIds || []).join(', ')}]`);
    console.log(`  Auth Claims role: '${customClaims.role}'`);
    console.log(`  Auth Claims schoolIds: [${(customClaims.schoolIds || []).join(', ')}]`);
    console.log(`  Auth Claims classIds: [${(customClaims.classIds || []).join(', ')}]`);
  }
}

checkProductionState().catch(err => {
  console.error("Error checking production state:", err);
  process.exit(1);
});
