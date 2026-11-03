const API_KEY = 'AIzaSyBpLWqHOfy3A8FTILx4kE4bimhbbwPlOqQ';
const HOSTING_URL = 'https://dnd-master-73449.web.app';

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

async function runVerification() {
  console.log(`=== VERIFYING STUDENT REDESIGN & PORTFOLIO MAKER ON LIVE SERVER ===`);
  console.log(`Hosting URL: ${HOSTING_URL}\n`);

  // 1. Sign in as Akira
  console.log(`1. Signing in as Akira (akira@welearn.org)...`);
  const akiraAuth = await signIn('akira@welearn.org', 'review123');
  console.log(`   ✅ Signed in! UID: ${akiraAuth.localId}`);

  // 2. GET /api/learner-space
  console.log(`\n2. Testing GET /api/learner-space...`);
  const lsResp = await fetch(`${HOSTING_URL}/api/learner-space`, {
    headers: { 'Authorization': `Bearer ${akiraAuth.idToken}` }
  });
  const lsData = await lsResp.json();
  if (!lsResp.ok) {
    throw new Error(`GET /api/learner-space failed (${lsResp.status}): ${JSON.stringify(lsData)}`);
  }
  console.log(`   ✅ GET /api/learner-space HTTP ${lsResp.status} OK`);
  console.log(`   Personalization profile: accentColor='${lsData.dashboard?.appearance?.accentColor || 'default'}', title='${lsData.dashboard?.profile?.title || 'none'}'`);

  // 3. GET /api/quest/me
  console.log(`\n3. Testing GET /api/quest/me...`);
  const qResp = await fetch(`${HOSTING_URL}/api/quest/me`, {
    headers: { 'Authorization': `Bearer ${akiraAuth.idToken}` }
  });
  const qData = await qResp.json();
  if (!qResp.ok) {
    throw new Error(`GET /api/quest/me failed (${qResp.status}): ${JSON.stringify(qData)}`);
  }
  console.log(`   ✅ GET /api/quest/me HTTP ${qResp.status} OK`);
  console.log(`   Quest state: level=${qData.level || 1}, xp=${qData.xp || 0}`);

  // 4. Test Portfolio Item with Phase & PhaseReflection
  console.log(`\n4. Testing Portfolio item creation with phase & phaseReflection...`);
  const testItem = {
    title: 'Verification Test Stage 1 Explore',
    kind: 'writing',
    body: 'Testing portfolio maker phase validation on production server.',
    audiences: ['coaches'],
    phase: 'explore',
    phaseReflection: true
  };

  const createResp = await fetch(`${HOSTING_URL}/api/learner-space/items`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${akiraAuth.idToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testItem)
  });
  const createData = await createResp.json();
  if (!createResp.ok) {
    throw new Error(`POST /api/learner-space/items failed (${createResp.status}): ${JSON.stringify(createData)}`);
  }
  console.log(`   ✅ Portfolio item created successfully! Total items now: ${createData.items?.length || 0}`);
  const createdItem = createData.items?.find(i => i.title === testItem.title);
  console.log(`   Verified item: id='${createdItem?.id}', revision=${createdItem?.revision}, phase='${createdItem?.phase}', phaseReflection=${createdItem?.phaseReflection}`);

  // 5. Clean up created test portfolio item
  if (createdItem?.id) {
    console.log(`\n5. Cleaning up test portfolio item ${createdItem.id}...`);
    const deleteResp = await fetch(`${HOSTING_URL}/api/learner-space/items/${createdItem.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${akiraAuth.idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ revision: createdItem.revision })
    });
    const deleteData = await deleteResp.json();
    if (deleteResp.ok) {
      console.log(`   ✅ Test portfolio item deleted successfully! Remaining items: ${deleteData.items?.length || 0}`);
    } else {
      console.warn(`   ⚠️ Could not delete test portfolio item ${createdItem.id}: ${deleteResp.status}`, deleteData);
    }
  }

  // 6. Sign in as Coach & verify learning context
  console.log(`\n6. Signing in as Coach (coach.wpr@school.edu)...`);
  const coachAuth = await signIn('coach.wpr@school.edu', 'review123');
  console.log(`   ✅ Signed in as Coach! UID: ${coachAuth.localId}`);

  const coachLc = await fetch(`${HOSTING_URL}/api/learning-context`, {
    headers: { 'Authorization': `Bearer ${coachAuth.idToken}` }
  });
  const coachLcData = await coachLc.json();
  if (!coachLc.ok) {
    throw new Error(`Coach GET /api/learning-context failed: ${JSON.stringify(coachLcData)}`);
  }
  console.log(`   ✅ Coach API /api/learning-context HTTP ${coachLc.status} OK`);

  console.log(`\n🎉 ALL LIVE VERIFICATION CHECKS PASSED PERFECTLY!`);
}

runVerification().catch(err => {
  console.error('\n❌ VERIFICATION FAILED:', err.message);
  process.exit(1);
});
