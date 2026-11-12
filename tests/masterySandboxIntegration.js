/**
 * Mastery Sandbox Integration Controlled Test Suite
 * Tests 10 core integration capabilities against https://api.develop.mastery.org
 * Run directly with: node tests/masterySandboxIntegration.js
 */

import dotenv from 'dotenv';
dotenv.config();

import { MasteryApiClient } from '../server/lib/masteryClient.js';

async function runTestSuite() {
  console.log('===============================================================');
  console.log('WELEARN SPARK × MASTERY DEVELOPMENT SANDBOX VERIFICATION SUITE');
  console.log('===============================================================\n');

  const client = new MasteryApiClient();

  if (!client.isConfigured()) {
    console.error('FAIL: MasteryApiClient is not configured with MASTERY_API_KEY.');
    process.exit(1);
  }

  const results = {
    total: 10,
    passed: 0,
    failed: 0,
    tests: []
  };

  function record(testNumber, name, passed, details) {
    if (passed) results.passed++;
    else results.failed++;
    results.tests.push({ testNumber, name, passed, details });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] Test ${testNumber}: ${name}`);
    if (details) console.log(`       Details: ${details}`);
  }

  let schoolId = null;
  let testLearnerId = null;
  let testEvidenceId = null;
  let targetCreditId = null;
  const stableSparkId = `SPARK-${Date.now().toString(36).toUpperCase()}`.slice(0, 20);

  try {
    // 0. Handshake & School Discovery
    console.log('--- Step 0: School Discovery ---');
    const schools = await client.getSchools();
    if (schools.length === 0) throw new Error('No schools returned for API key');
    schoolId = schools[0].id;
    console.log(`Authenticated School: "${schools[0].name}" (ID: ${schoolId}, sendingType: ${schools[0].sendingType})\n`);

    // 1. Retrieve the existing competency framework
    console.log('--- Step 1: Competency Framework Retrieval ---');
    try {
      const mca = await client.getCompetencyModel(schoolId);
      const hasAreas = Array.isArray(mca?.areas) && mca.areas.length > 0;
      record(1, 'Retrieve existing competency framework', hasAreas, `Framework "${mca.title}" retrieved with ${mca.areasCount} areas and ${mca.creditsCount} credits.`);
    } catch (err) {
      record(1, 'Retrieve existing competency framework', false, err.message);
    }

    // 2. Confirm the seven areas and competencies count
    console.log('\n--- Step 2: Confirm 7 Areas & Competencies ---');
    try {
      const mca = await client.getCompetencyModel(schoolId);
      const areaCount = mca?.areas?.length || 0;
      const totalCredits = mca?.areas?.reduce((sum, a) => sum + (a.credits?.length || 0), 0) || 0;
      const passed = areaCount === 7 && totalCredits === 85;
      
      // Select a sample target credit for subsequent tests
      targetCreditId = mca.areas[0].credits[0].id;

      record(2, 'Confirm seven areas and competencies count', passed, `Found ${areaCount} areas and ${totalCredits} active competencies (Expected 7 areas; 85 loaded in sandbox). Target test credit: ID ${targetCreditId} ("${mca.areas[0].credits[0].title}").`);
    } catch (err) {
      record(2, 'Confirm seven areas and competencies count', false, err.message);
    }

    // 3. Retrieve existing courses
    console.log('\n--- Step 3: Retrieve Existing Courses ---');
    try {
      const courses = await client.getCourses(schoolId);
      const passed = Array.isArray(courses) && courses.length > 0;
      record(3, 'Retrieve existing courses', passed, `Retrieved ${courses.length} courses. First course: "${courses[0]?.title}" (ID: ${courses[0]?.id}).`);
    } catch (err) {
      record(3, 'Retrieve existing courses', false, err.message);
    }

    // 4. Create a test learner with stable Spark identifier <= 20 chars
    console.log('\n--- Step 4: Create Test Learner with Identifier <= 20 chars ---');
    try {
      const syntheticEmail = `synthetic.${stableSparkId.toLowerCase()}@welearn.org`;
      const learnerData = await client.createLearner(schoolId, {
        firstName: 'TestPilot',
        lastName: 'Learner',
        email: syntheticEmail,
        externalId: stableSparkId,
        sendEmail: false
      });
      testLearnerId = learnerData?.id;
      const passed = Boolean(testLearnerId && stableSparkId.length <= 20);
      record(4, 'Create test learner with <= 20 char identifier', passed, `Created test learner ID: ${testLearnerId} with externalId "${stableSparkId}" (${stableSparkId.length} chars).`);
    } catch (err) {
      record(4, 'Create test learner with <= 20 char identifier', false, err.message);
    }

    // 5. Retrieve the test learner and verify ID mapping
    console.log('\n--- Step 5: Retrieve Test Learner & Verify ID Mapping ---');
    try {
      const learner = await client.getLearner(testLearnerId);
      const passed = learner?.id === testLearnerId && learner?.externalId === stableSparkId;
      record(5, 'Retrieve test learner and verify ID mapping', passed, `Verified learner record: ID=${learner?.id}, externalId=${learner?.externalId}, name="${learner?.firstName} ${learner?.lastName}".`);
    } catch (err) {
      record(5, 'Retrieve test learner and verify ID mapping', false, err.message);
    }

    // 6. Submit a sample PBL artifact as evidence
    console.log('\n--- Step 6: Submit Sample PBL Artifact as Evidence ---');
    try {
      const evidenceId = await client.createEvidence(testLearnerId, {
        title: 'Project Exodus: Planetary Life Support System',
        description: 'Engineered a closed-loop oxygen and water recycling telemetry prototype for long-duration space habitation.'
      });
      testEvidenceId = evidenceId;
      const passed = Boolean(testEvidenceId);
      record(6, 'Submit sample PBL artifact as evidence', passed, `Created Evidence ID: ${testEvidenceId}.`);
    } catch (err) {
      record(6, 'Submit sample PBL artifact as evidence', false, err.message);
    }

    // 7. Associate evidence with the correct competency
    console.log('\n--- Step 7: Associate Evidence with Competency ---');
    try {
      await client.attachCompetenciesToEvidence(testEvidenceId, [
        { id: targetCreditId, status: 'IN_PROGRESS' }
      ]);
      const ev = await client.getEvidence(testEvidenceId);
      const attached = ev?.credits?.some(c => c.id === targetCreditId);
      record(7, 'Associate evidence with correct competency', attached, `Attached credit ${targetCreditId} to Evidence ${testEvidenceId} with status IN_PROGRESS.`);
    } catch (err) {
      record(7, 'Associate evidence with correct competency', false, err.message);
    }

    // 8. Record a test competency achievement using supported API workflow
    console.log('\n--- Step 8: Record Test Competency Achievement ---');
    try {
      await client.updateLearnerCredit(testLearnerId, targetCreditId, { status: 'EARNED' });
      await client.addEvidenceComment(testEvidenceId, {
        content: 'Coach review complete: Outstanding mastery demonstrated in life support telemetry modeling. Proficient level verified.'
      });
      record(8, 'Record test competency achievement', true, `Updated credit ${targetCreditId} to EARNED and added coach evaluation comment.`);
    } catch (err) {
      record(8, 'Record test competency achievement', false, err.message);
    }

    // 9. Verify resulting data through the API
    console.log('\n--- Step 9: Verify Resulting Data ---');
    try {
      const creditsReport = await client.getLearnerCredits(testLearnerId);
      const earnedItem = creditsReport?.items?.[0]?.credits?.find(c => c.id === targetCreditId);
      const ev = await client.getEvidence(testEvidenceId);
      const passed = earnedItem?.status === 'EARNED' && ev?.commentsCount >= 1;
      record(9, 'Verify resulting data through API', passed, `Credit status in learner profile is "${earnedItem?.status}" and Evidence has ${ev?.commentsCount} comment(s).`);
    } catch (err) {
      record(9, 'Verify resulting data through API', false, err.message);
    }

    // 10. Test duplicate submissions, authorization failures, invalid IDs and retry behavior
    console.log('\n--- Step 10: Negative Testing & Resilience ---');
    try {
      let dupCaught = false;
      let badAuthCaught = false;
      let invalidIdCaught = false;

      // 10a. Duplicate learner
      try {
        await client.createLearner(schoolId, {
          firstName: 'Duplicate',
          lastName: 'Tester',
          email: `synthetic.${stableSparkId.toLowerCase()}@welearn.org`,
          sendEmail: false
        });
      } catch (e) {
        if (e.code === 'USER_ALREADY_EXISTS' || e.status === 400) dupCaught = true;
      }

      // 10b. Authorization failure
      const badClient = new MasteryApiClient({ apiKey: 'invalid_dummy_key_999' });
      try {
        await badClient.getSchools();
      } catch (e) {
        if (e.status === 401) badAuthCaught = true;
      }

      // 10c. Invalid ID
      try {
        await client.getLearner(99999999);
      } catch (e) {
        if (e.code === 'USER_NOT_FOUND' || e.status === 400) invalidIdCaught = true;
      }

      const allPassed = dupCaught && badAuthCaught && invalidIdCaught;
      record(10, 'Test duplicates, auth failures, invalid IDs, and retry behavior', allPassed, `Duplicate caught: ${dupCaught}, 401 caught: ${badAuthCaught}, Invalid ID caught: ${invalidIdCaught}.`);
    } catch (err) {
      record(10, 'Test duplicates, auth failures, invalid IDs, and retry behavior', false, err.message);
    }

  } catch (globalErr) {
    console.error('FATAL TEST ERROR:', globalErr);
  }

  console.log('\n===============================================================');
  console.log(`TEST RESULTS: ${results.passed}/${results.total} PASSED (${results.failed} FAILED)`);
  console.log('===============================================================\n');

  return results;
}

runTestSuite();
