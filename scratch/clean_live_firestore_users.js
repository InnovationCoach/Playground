import fs from 'node:fs';

const PROJECT_ID = 'dnd-master-73449';
const config = JSON.parse(fs.readFileSync('/Users/admin/.config/configstore/firebase-tools.json', 'utf8'));
const refreshToken = config.tokens?.refresh_token;

async function getValidAccessToken() {
  if (!refreshToken) throw new Error('No refresh token found');
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
  if (!data.access_token) throw new Error(`Failed to refresh token: ${JSON.stringify(data)}`);
  return data.access_token;
}

const KEEP_USERS = [
  // 2 Testing Admin Accounts
  {
    uid: 'EtbqHXNCP6fZM7WbeocihWcPpql2',
    email: 'admin.test@school.edu',
    role: 'admin',
    givenNames: 'Admin',
    surname: 'Test',
    displayName: 'Admin Test',
    publicId: 'ADM-TST-001-WLR'
  },
  {
    uid: 'e5bdee75-c85a-474b-bcf3-f9b167e4c4ce',
    email: 'admin@welearn.org',
    role: 'admin',
    givenNames: 'WeLearn',
    surname: 'Admin',
    displayName: 'WeLearn Admin',
    publicId: 'ADM-WLR-002-ORG'
  },
  // 3 Coaches Accounts
  {
    uid: 'xrqLZDnFleQ0SAfaUqSFROSGdmp1',
    email: 'coach.wpr@school.edu',
    role: 'teacher',
    givenNames: 'Sam',
    surname: 'Coach',
    displayName: 'Coach Sam',
    publicId: 'CCH-SAM-001-WPR'
  },
  {
    uid: 'CETkvAzvYUhKwCxB97hZLvD9tZz2',
    email: 'coach@welearn.org',
    role: 'teacher',
    givenNames: 'Alex',
    surname: 'Coach',
    displayName: 'Coach Alex',
    publicId: 'CCH-ALX-002-WLR'
  },
  {
    uid: '0rE6NrmlgyaZDTjTG6HOLGvIm8z1',
    email: 'mani@welearn.org',
    role: 'teacher',
    givenNames: 'Mani',
    surname: 'Coach',
    displayName: 'Mani Coach',
    publicId: 'CCH-MNI-003-WLR'
  },
  // 5 Test Students Accounts
  {
    uid: '3hW4CkoFRCQSJ2fnZddet0EshJs2',
    email: 'primary.student@school.edu',
    role: 'student',
    givenNames: 'Penny',
    surname: 'Primary',
    displayName: 'Penny Primary',
    cohortId: 'cohort-wpr',
    cohort: 'primary',
    ageBand: 'primary',
    yearLevel: 'Year 4',
    publicId: 'STU-PNY-001-WPR'
  },
  {
    uid: 'BZXZgbNroBQp052HLPaY3RXuUUk1',
    email: 'junior.explorer@test.com',
    role: 'student',
    givenNames: 'Junior',
    surname: 'Explorer',
    displayName: 'Junior Explorer',
    cohortId: 'cohort-wpr',
    cohort: 'primary',
    ageBand: 'primary',
    yearLevel: 'Year 5',
    publicId: 'STU-JNR-002-WPR'
  },
  {
    uid: 'd27J9hvQwMfpZjsRIrvS0lhBrWo1',
    email: 'akira@welearn.org',
    role: 'student',
    givenNames: 'Akira',
    surname: 'Tanaka',
    displayName: 'Akira Tanaka',
    cohortId: 'cohort-w2e',
    cohort: 'lower-secondary',
    ageBand: '13-15',
    yearLevel: 'Year 9',
    publicId: 'STU-AKR-003-W2E'
  },
  {
    uid: 'eoM13pYgEqRgaod9me6Ss7OqURi1',
    email: 'lisa@welearn.org',
    role: 'student',
    givenNames: 'Lisa',
    surname: 'Chen',
    displayName: 'Lisa Chen',
    cohortId: 'cohort-w2e',
    cohort: 'lower-secondary',
    ageBand: '13-15',
    yearLevel: 'Year 9',
    publicId: 'STU-LSA-004-W2E'
  },
  {
    uid: '2fl9H9yHK0UJy1vWSBkHksOE3XM2',
    email: 'charlie.su@welearn.org',
    role: 'student',
    givenNames: 'Charlie',
    surname: 'Su',
    displayName: 'Charlie Su',
    cohortId: 'cohort-w2e',
    cohort: 'higher-secondary',
    ageBand: '16-18',
    yearLevel: 'Year 11',
    publicId: 'STU-CHL-005-W2E'
  },
  // 5 Test Parents Accounts
  {
    uid: 'iOylNYxvNAgmFffMzxSokdR49VC2',
    email: 'parent.test@school.edu',
    role: 'parent',
    givenNames: 'Parent',
    surname: 'Test One',
    displayName: 'Parent Test 1',
    publicId: 'PAR-TST-001-SCH',
    childUid: 'BZXZgbNroBQp052HLPaY3RXuUUk1'
  },
  {
    uid: '9deedbe1-9805-4ba5-955c-46e3aa3992bf',
    email: 'parent@welearn.org',
    role: 'parent',
    givenNames: 'Parent',
    surname: 'Test Two',
    displayName: 'Parent Test 2',
    publicId: 'PAR-TST-002-WLR',
    childUid: 'd27J9hvQwMfpZjsRIrvS0lhBrWo1'
  },
  {
    uid: 'parent-test-003',
    email: 'parent3.test@school.edu',
    role: 'parent',
    givenNames: 'Parent',
    surname: 'Test Three',
    displayName: 'Parent Test 3',
    publicId: 'PAR-TST-003-SCH',
    childUid: 'eoM13pYgEqRgaod9me6Ss7OqURi1'
  },
  {
    uid: 'parent-test-004',
    email: 'parent4.test@school.edu',
    role: 'parent',
    givenNames: 'Parent',
    surname: 'Test Four',
    displayName: 'Parent Test 4',
    publicId: 'PAR-TST-004-SCH',
    childUid: '2fl9H9yHK0UJy1vWSBkHksOE3XM2'
  },
  {
    uid: 'parent-test-005',
    email: 'parent5.test@school.edu',
    role: 'parent',
    givenNames: 'Parent',
    surname: 'Test Five',
    displayName: 'Parent Test 5',
    publicId: 'PAR-TST-005-SCH',
    childUid: '3hW4CkoFRCQSJ2fnZddet0EshJs2'
  }
];

const FAKE_AUTH_EMAIL_PATTERNS = [
  /^goalshot\./i,
  /^goalflow\./i,
  /^dbg\./i,
  /^test-student-/i,
  /^test-coach-/i,
  /^test-other-/i,
  /^new_student_/i,
  /^test_firestore_/i,
  /^test_student_/i,
  /^test@example\.com$/i,
  /^student@example\.com$/i,
  /^coach\.test@example\.com$/i,
  /^demo\.coach\.report@/i,
  /^demo\.student\.report@/i,
  /^democoach2025@/i
];

function toFirestoreFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'string') fields[k] = { stringValue: v };
    else if (typeof v === 'boolean') fields[k] = { booleanValue: v };
    else if (Array.isArray(v)) {
      fields[k] = { arrayValue: { values: v.map((item) => ({ stringValue: String(item) })) } };
    }
  }
  return fields;
}

async function patchDoc(token, docPath, obj) {
  const keys = Object.keys(obj).filter((k) => obj[k] !== undefined && obj[k] !== null);
  const mask = keys.map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${docPath}?${mask}`;
  const resp = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: toFirestoreFields(obj) })
  });
  if (!resp.ok) {
    throw new Error(`PATCH ${docPath} failed: ${resp.status} ${await resp.text()}`);
  }
}

async function deleteDoc(token, docPath) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${docPath}`;
  const resp = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!resp.ok && resp.status !== 404) {
    throw new Error(`DELETE ${docPath} failed: ${resp.status} ${await resp.text()}`);
  }
}

async function run() {
  const token = await getValidAccessToken();
  const keepUids = new Set(KEEP_USERS.map((u) => u.uid));

  console.log('1. Listing and cleaning up extra Firestore users documents...');
  const listResp = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users?pageSize=200`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const listData = await listResp.json();
  const docs = listData.documents || [];
  let deletedDocs = 0;
  for (const doc of docs) {
    const uid = doc.name.split('/').pop();
    if (!keepUids.has(uid)) {
      const email = doc.fields?.email?.stringValue || 'no-email';
      console.log(`   Deleting Firestore users/${uid} (${email})`);
      await deleteDoc(token, `users/${uid}`);
      deletedDocs += 1;
    }
  }
  console.log(`   Deleted ${deletedDocs} extra Firestore user documents.`);

  console.log('2. Upserting the 15 kept accounts in Firestore (2 admins, 3 coaches, 5 students, 5 parents)...');
  for (const spec of KEEP_USERS) {
    const base = {
      uid: spec.uid,
      email: spec.email,
      role: spec.role,
      givenNames: spec.givenNames,
      surname: spec.surname,
      displayName: spec.displayName,
      publicId: spec.publicId,
      orgId: 'org-welearn',
      status: 'active',
      schoolIds: ['school-wpr'],
      classIds: ['class-wpr-11a', 'class_climate_champions_7a'],
      updatedAt: new Date().toISOString()
    };
    if (spec.role === 'student') {
      Object.assign(base, {
        cohortId: spec.cohortId,
        cohort: spec.cohort,
        ageBand: spec.ageBand,
        yearLevel: spec.yearLevel
      });
    }
    await patchDoc(token, `users/${spec.uid}`, base);
  }

  console.log('3. Syncing parentLinks for the 5 test parents...');
  const linksResp = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/parentLinks?pageSize=100`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const linksData = await linksResp.json();
  for (const doc of (linksData.documents || [])) {
    const id = doc.name.split('/').pop();
    await deleteDoc(token, `parentLinks/${id}`);
  }
  const parents = KEEP_USERS.filter((u) => u.role === 'parent');
  for (let i = 0; i < parents.length; i += 1) {
    const p = parents[i];
    const linkId = `link-00${i + 1}`;
    await patchDoc(token, `parentLinks/${linkId}`, {
      linkId,
      orgId: 'org-welearn',
      parentUid: p.uid,
      studentUid: p.childUid,
      status: 'active',
      createdAt: new Date().toISOString()
    });
  }

  console.log('4. Cleaning up automated fake accounts from Firebase Auth...');
  const authQueryResp = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:batchGet?maxResults=500`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const authQueryData = await authQueryResp.json();
  const authUsers = authQueryData.users || [];
  let deletedAuth = 0;
  for (const u of authUsers) {
    if (keepUids.has(u.localId)) continue;
    const email = u.email || '';
    const isAnonymousOrBlank = !email;
    const isFakePattern = FAKE_AUTH_EMAIL_PATTERNS.some((rx) => rx.test(email));
    if (isAnonymousOrBlank || isFakePattern) {
      console.log(`   Deleting Auth user ${u.localId} (${email || 'anonymous'})`);
      await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:delete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ localId: u.localId })
      });
      deletedAuth += 1;
    }
  }
  console.log(`   Deleted ${deletedAuth} fake Auth users.`);

  const verifyResp = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users?pageSize=200`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const verifyData = await verifyResp.json();
  const counts = {};
  for (const doc of (verifyData.documents || [])) {
    const r = doc.fields?.role?.stringValue || 'unknown';
    counts[r] = (counts[r] || 0) + 1;
  }
  console.log('Final Firestore users counts by role:', counts);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
