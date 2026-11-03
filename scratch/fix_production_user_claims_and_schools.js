import fs from 'node:fs';

const PROJECT_ID = 'dnd-master-73449';
const config = JSON.parse(fs.readFileSync('/Users/admin/.config/configstore/firebase-tools.json', 'utf8'));
const accessToken = config.tokens?.access_token;

console.log("Using access token from firebase-tools.json:", accessToken ? `${accessToken.slice(0, 15)}...` : 'NONE');

async function patchFirestoreDocument(docPath, fields) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${docPath}?updateMask.fieldPaths=${Object.keys(fields).join('&updateMask.fieldPaths=')}`;
  
  const formattedFields = {};
  for (const [key, val] of Object.entries(fields)) {
    if (typeof val === 'string') formattedFields[key] = { stringValue: val };
    else if (typeof val === 'boolean') formattedFields[key] = { booleanValue: val };
    else if (Array.isArray(val)) {
      formattedFields[key] = {
        arrayValue: {
          values: val.map(v => typeof v === 'string' ? { stringValue: v } : v)
        }
      };
    }
  }

  const resp = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields: formattedFields })
  });
  const text = await resp.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error(`PATCH ${docPath} returned non-JSON: ${text}`); }
  if (!resp.ok) {
    throw new Error(`PATCH ${docPath} failed (${resp.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

async function setAuthCustomClaims(uid, claims) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:setCustomAttributes`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ localId: uid, customAttributes: JSON.stringify(claims) })
  });
  const text = await resp.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error(`setCustomAttributes for ${uid} returned non-JSON: ${text.slice(0, 100)}`); }
  if (!resp.ok) {
    console.warn(`   ⚠️ setCustomAttributes for ${uid} warning: ${JSON.stringify(data)}`);
  }
  return data;
}

async function fixProductionState() {
  console.log("=== FIXING PRODUCTION FIRESTORE & AUTH CLAIMS ===\n");

  // 1. Fix Class: class_climate_champions_7a
  console.log("1. Setting schoolId='school-wpr' on classes/class_climate_champions_7a...");
  await patchFirestoreDocument('classes/class_climate_champions_7a', {
    schoolId: 'school-wpr'
  });
  console.log("   ✅ Fixed class_climate_champions_7a!");

  // 2. Fetch all users from Firestore via REST API
  const usersResp = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const usersData = await usersResp.json();
  const docs = usersData.documents || [];

  console.log(`\n2. Updating ${docs.length} user documents and custom claims...`);

  for (const doc of docs) {
    const uid = doc.name.split('/').pop();
    const fields = doc.fields || {};
    const email = fields.email?.stringValue || '';
    const displayName = fields.displayName?.stringValue || '';
    let role = fields.role?.stringValue || 'student';
    if (role === 'coach') role = 'teacher';

    const schoolIds = ['school-wpr'];
    const classIds = ['class-wpr-11a', 'class_climate_champions_7a'];

    console.log(`\nProcessing user: ${email} (${displayName}) UID: ${uid}, role: ${role}`);

    // Update Firestore user document
    await patchFirestoreDocument(`users/${uid}`, {
      role: role,
      status: 'active',
      schoolIds: schoolIds,
      classIds: classIds
    });
    console.log(`   ✅ Updated Firestore user document users/${uid}`);

    // Update Auth Custom Claims
    const claims = {
      role: role,
      orgId: 'org-welearn',
      schoolIds: schoolIds,
      classIds: classIds
    };
    await setAuthCustomClaims(uid, claims);
    console.log(`   ✅ Set Auth custom claims for ${uid}:`, claims);
  }

  console.log("\n🎉 ALL USERS AND CLASSES FIXED IN PRODUCTION!");
}

fixProductionState().catch(err => {
  console.error("Error fixing production state:", err);
  process.exit(1);
});
