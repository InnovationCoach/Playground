import fs from 'fs';
import path from 'path';

const API_KEY = 'AIzaSyBpLWqHOfy3A8FTILx4kE4bimhbbwPlOqQ';
const PROJECT_ID = 'dnd-master-73449';

const confPath = path.join(process.env.HOME, '.config', 'configstore', 'firebase-tools.json');
let accessToken = null;
if (fs.existsSync(confPath)) {
  const conf = JSON.parse(fs.readFileSync(confPath, 'utf8'));
  accessToken = conf.tokens?.access_token;
}

console.log('Firebase Tools Access Token found?', Boolean(accessToken));

const ACCOUNTS_TO_PROVISION = [
  {
    email: 'parent.test1@school.edu',
    password: 'Pilot2026!Parent1#WL',
    displayName: 'Parent Test 1 (Yuri)'
  },
  {
    email: 'parent.test2@school.edu',
    password: 'Pilot2026!Parent2#WL',
    displayName: 'Parent Test 2 (Ana)'
  },
  {
    email: 'frame@welearn.org',
    password: 'Pilot2026!Frame#WL',
    displayName: 'Frame WeLearn'
  },
  {
    email: 'aey@welearn.org',
    password: 'Pilot2026!Aey#WL',
    displayName: 'Aey WeLearn'
  },
  {
    email: 'marketing@welearnthailand.com',
    password: 'Pilot2026!OwnerWL#99',
    displayName: 'WeLearn Marketing Owner'
  },
  {
    email: 'don@welearn.org',
    password: 'Pilot2026!Don#WL',
    displayName: 'Don'
  },
  {
    email: 'sara@welearn.org',
    password: 'Pilot2026!Sara#WL',
    displayName: 'Sara'
  }
];

async function ensureUser(user) {
  console.log(`\n--- Provisioning ${user.email} ---`);
  
  // 1. Try public client signUp first
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        password: user.password,
        returnSecureToken: true
      })
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`[SUCCESS: Created via Client API] UID: ${data.localId}`);
      return data.localId;
    }
    
    if (data.error?.message === 'EMAIL_EXISTS') {
      console.log(`[EXISTS] User ${user.email} already exists in Firebase Auth.`);
      
      // Update password using Admin OAuth token if available
      if (accessToken) {
        console.log(`Updating password and displayName via Identity Toolkit Admin API...`);
        const updateRes = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts?key=${API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            email: user.email,
            password: user.password,
            displayName: user.displayName
          })
        });
        const updateData = await updateRes.json();
        if (updateRes.ok) {
          console.log(`[SUCCESS: Password updated] UID: ${updateData.localId}`);
          return updateData.localId;
        } else {
          console.log(`[Admin Update Info]`, updateData);
        }
      }
    } else {
      console.error(`[Error creating user ${user.email}]:`, data.error);
    }
  } catch (err) {
    console.error(`Fetch exception for ${user.email}:`, err.message);
  }
}

async function verifySignIn(email, password) {
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true
      })
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`[VERIFIED SIGN-IN OK] ${email} -> UID ${data.localId}`);
      return { success: true, uid: data.localId };
    } else {
      console.error(`[FAILED SIGN-IN] ${email}:`, data.error?.message);
      return { success: false, error: data.error?.message };
    }
  } catch (err) {
    console.error(`[SIGN-IN EXCEPTION] ${email}:`, err.message);
    return { success: false, error: err.message };
  }
}

async function run() {
  for (const acc of ACCOUNTS_TO_PROVISION) {
    await ensureUser(acc);
  }

  console.log('\n========================================');
  console.log(' VERIFYING SIGN-IN FOR ALL ACCOUNTS');
  console.log('========================================');
  
  for (const acc of ACCOUNTS_TO_PROVISION) {
    await verifySignIn(acc.email, acc.password);
  }
}

run();
