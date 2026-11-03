import fs from 'node:fs';

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

function parseFirestoreFields(fields) {
  if (!fields) return {};
  const res = {};
  for (const [key, val] of Object.entries(fields)) {
    if (val.stringValue !== undefined) res[key] = val.stringValue;
    else if (val.booleanValue !== undefined) res[key] = val.booleanValue;
    else if (val.integerValue !== undefined) res[key] = Number(val.integerValue);
    else if (val.arrayValue !== undefined) {
      res[key] = (val.arrayValue.values || []).map(v => v.stringValue || v.integerValue || v);
    } else if (val.mapValue !== undefined) {
      res[key] = parseFirestoreFields(val.mapValue.fields);
    } else {
      res[key] = val;
    }
  }
  return res;
}

async function inspectREST() {
  const token = await getValidAccessToken();
  console.log("=== INSPECTING PRODUCTION DATA VIA REST API ===\n");

  // 1. Fetch Schools
  const schoolsResp = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/schools`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const schoolsData = await schoolsResp.json();
  console.log("SCHOOLS:");
  for (const doc of (schoolsData.documents || [])) {
    const id = doc.name.split('/').pop();
    const data = parseFirestoreFields(doc.fields);
    console.log(`- ID: '${id}', Name: '${data.name}', Status: '${data.status}'`);
  }

  // 2. Fetch Classes
  const classesResp = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/classes`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const classesData = await classesResp.json();
  console.log("\nCLASSES:");
  for (const doc of (classesData.documents || [])) {
    const id = doc.name.split('/').pop();
    const data = parseFirestoreFields(doc.fields);
    console.log(`- ID: '${id}', Name: '${data.name}', SchoolId: '${data.schoolId}', Status: '${data.status}'`);
  }

  // 3. Fetch Users
  const usersResp = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const usersData = await usersResp.json();
  console.log("\nUSERS IN FIRESTORE:");
  for (const doc of (usersData.documents || [])) {
    const uid = doc.name.split('/').pop();
    const data = parseFirestoreFields(doc.fields);
    console.log(`\nUser: ${data.email} (UID: ${uid})`);
    console.log(`  DisplayName: '${data.displayName}'`);
    console.log(`  Role: '${data.role}', Status: '${data.status}'`);
    console.log(`  Firestore schoolIds: [${(data.schoolIds || []).join(', ')}]`);
    console.log(`  Firestore classIds: [${(data.classIds || []).join(', ')}]`);
  }
}

inspectREST().catch(err => {
  console.error("Error inspecting REST:", err);
  process.exit(1);
});
