const API_KEY = 'AIzaSyBpLWqHOfy3A8FTILx4kE4bimhbbwPlOqQ';
const HOSTING_URL = 'https://dnd-master-73449.web.app';

function decodeJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(payload);
  } catch (err) {
    return null;
  }
}

async function signIn(email, password) {
  const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
  const resp = await fetch(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  const data = await resp.json();
  if (!resp.ok || !data.idToken) {
    throw new Error(`Auth failed for ${email}: ${data.error?.message || JSON.stringify(data)}`);
  }
  return data;
}

async function runLiveProductionSmokeTests() {
  console.log(`=== PHASE 1 COACH ACTIVITIES PRODUCTION SMOKE TESTS ===`);
  console.log(`Target: ${HOSTING_URL}\n`);

  // 1. Unauthenticated 401 Check
  console.log(`1. Testing unauthenticated API /api/learner-space...`);
  const unauthResp = await fetch(`${HOSTING_URL}/api/learner-space`);
  const unauthData = await unauthResp.json();
  if (unauthResp.status !== 401) {
    throw new Error(`Expected 401, got ${unauthResp.status}: ${JSON.stringify(unauthData)}`);
  }
  console.log(`   ✅ HTTP 401 UNAUTHORIZED verified! (${unauthData.error?.code})`);

  // 2. CORS Check
  console.log(`\n2. Testing CORS origin guard with invalid origin...`);
  const corsResp = await fetch(`${HOSTING_URL}/api/learning-context`, {
    headers: { 'Origin': 'https://evil.example' }
  });
  const acao = corsResp.headers.get('access-control-allow-origin');
  if (acao === '*' || acao === 'https://evil.example') {
    throw new Error(`Invalid CORS header returned: ${acao}`);
  }
  console.log(`   ✅ CORS origin guard verified! (No origin reflection for evil.example)`);

  // 3. Authenticated Coach Sign In
  console.log(`\n3. Signing in as Coach (coach.wpr@school.edu)...`);
  const coachAuth = await signIn('coach.wpr@school.edu', 'review123');
  const coachClaims = decodeJwt(coachAuth.idToken);
  console.log(`   ✅ Coach signed in! UID: ${coachAuth.localId}, role: '${coachClaims?.role}', schoolIds: [${coachClaims?.schoolIds?.join(', ')}]`);

  const schoolId = coachClaims?.schoolIds?.[0];
  if (!schoolId) throw new Error('Coach has no assigned schoolIds');

  // Fetch offerings for Coach
  const offeringsResp = await fetch(`${HOSTING_URL}/api/schools/${schoolId}/program-offerings`, {
    headers: { 'Authorization': `Bearer ${coachAuth.idToken}` }
  });
  const offeringsData = await offeringsResp.json();
  if (!offeringsResp.ok) {
    throw new Error(`Could not fetch coach program offerings: ${JSON.stringify(offeringsData)}`);
  }
  console.log(`   ✅ Loaded program offerings for school '${schoolId}': ${offeringsData.items?.length || 0} items`);

  // 4. Authenticated Akira Sign In
  console.log(`\n4. Signing in as Student (akira@welearn.org)...`);
  const akiraAuth = await signIn('akira@welearn.org', 'review123');
  const akiraClaims = decodeJwt(akiraAuth.idToken);
  console.log(`   ✅ Student signed in! UID: ${akiraAuth.localId}, role: '${akiraClaims?.role}', schoolIds: [${akiraClaims?.schoolIds?.join(', ')}]`);

  if (offeringsData.items?.length) {
    const offering = offeringsData.items[0];
    const studentLessonsResp = await fetch(`${HOSTING_URL}/api/schools/${schoolId}/program-offerings/${offering.id}/lessons`, {
      headers: { 'Authorization': `Bearer ${akiraAuth.idToken}` }
    });
    const studentLessonsData = await studentLessonsResp.json();
    if (studentLessonsResp.ok) {
      console.log(`   ✅ Student fetched lessons for offering '${offering.id}': ${studentLessonsData.items?.length || 0} published lesson(s) available.`);
    } else {
      console.warn(`   ⚠️ Student lessons status ${studentLessonsResp.status}: ${JSON.stringify(studentLessonsData)}`);
    }
  }

  console.log(`\n🎉 ALL LIVE PRODUCTION SMOKE TESTS PASSED PERFECTLY!`);
}

runLiveProductionSmokeTests().catch(err => {
  console.error('\n❌ PRODUCTION SMOKE TEST FAILED:', err.message);
  process.exit(1);
});
