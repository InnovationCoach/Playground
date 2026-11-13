/**
 * Mastery Transcript Consortium (MTC) Competency Framework Mapping
 * Model: WeLearn Academy MCA Model (ID: 11) in Sandbox School 15
 * 7 Areas, 85 Competencies
 */

export const MASTERY_MCA_FRAMEWORK = {
  id: 11,
  schoolId: 15,
  title: 'WeLearn Academy',
  areasCount: 7,
  creditsCount: 85
};

export const MASTERY_CREDITS_CATALOG = [
  // 1. Self-directed Learning
  { id: 1372, title: '1.1.1 Goal Setting', code: '1.1.1', area: 'Self-directed Learning', type: 'FOUNDATIONAL' },
  { id: 1373, title: '1.1.2 Planning and organization', code: '1.1.2', area: 'Self-directed Learning', type: 'FOUNDATIONAL' },
  { id: 1374, title: '1.1.3 Self Management', code: '1.1.3', area: 'Self-directed Learning', type: 'FOUNDATIONAL' },
  { id: 1376, title: '1.1.4 Reflection and Self-assessment', code: '1.1.4', area: 'Self-directed Learning', type: 'FOUNDATIONAL' },
  { id: 1440, title: '1.1.5 Learning Curiosity', code: '1.1.5', area: 'Self-directed Learning', type: 'FOUNDATIONAL' },
  { id: 1375, title: '1.2.1 Advanced Time and Priority Management', code: '1.2.1', area: 'Self-directed Learning', type: 'ADVANCED' },
  { id: 1377, title: '1.2.2 Independent Project Execution', code: '1.2.2', area: 'Self-directed Learning', type: 'ADVANCED' },
  { id: 1415, title: '1.2.3 Advanced Research Strategies', code: '1.2.3', area: 'Self-directed Learning', type: 'ADVANCED' },
  { id: 1416, title: '1.2.4 Metacognitive Strategy Adaptation', code: '1.2.4', area: 'Self-directed Learning', type: 'ADVANCED' },
  { id: 1417, title: '1.2.5 Lifelong Learning Mindset', code: '1.2.5', area: 'Self-directed Learning', type: 'ADVANCED' },
  { id: 1405, title: '1.1.3 Resourcefulness', code: '1.1.3b', area: 'Self-directed Learning', type: 'FOUNDATIONAL' },

  // 2. Critical Thinking & Problem Solving
  { id: 1378, title: '2.1.1 Evidence-based Reasoning', code: '2.1.1', area: 'Critical Thinking', type: 'FOUNDATIONAL' },
  { id: 1379, title: '2.1.2 Logic and Systems Thinking', code: '2.1.2', area: 'Critical Thinking', type: 'FOUNDATIONAL' },
  { id: 1395, title: '2.1.3 Questioning and Inquiring', code: '2.1.3', area: 'Critical Thinking', type: 'FOUNDATIONAL' },
  { id: 1396, title: '2.1.4 Bias and Assumption Awareness', code: '2.1.4', area: 'Critical Thinking', type: 'FOUNDATIONAL' },
  { id: 1397, title: '2.1.5 Problem Identification and Analysis', code: '2.1.5', area: 'Critical Thinking', type: 'FOUNDATIONAL' },
  { id: 1418, title: '2.2.1 Strategic Decision Making', code: '2.2.1', area: 'Critical Thinking', type: 'ADVANCED' },
  { id: 1419, title: '2.2.2 Root Cause Analysis', code: '2.2.2', area: 'Critical Thinking', type: 'ADVANCED' },
  { id: 1398, title: '2.2.4 Advanced Data Interpretation', code: '2.2.4', area: 'Critical Thinking', type: 'ADVANCED' },
  { id: 1361, title: '2.2.5 Applied Solutions Framework', code: '2.2.5', area: 'Critical Thinking', type: 'ADVANCED' },
  { id: 1362, title: '2.1.1 Analytical Thinking', code: '2.1.1b', area: 'Critical Thinking', type: 'FOUNDATIONAL' },
  { id: 1409, title: '2.1.4 Constructive Skepticism', code: '2.1.4b', area: 'Critical Thinking', type: 'FOUNDATIONAL' },

  // 3. Leadership & Collaboration
  { id: 1356, title: '3.1.1 Team Dynamics and Roles', code: '3.1.1', area: 'Leadership and Collaboration', type: 'FOUNDATIONAL' },
  { id: 1404, title: '3.1.2 Collaborative Feedback Practices', code: '3.1.2', area: 'Leadership and Collaboration', type: 'FOUNDATIONAL' },
  { id: 1400, title: '3.1.3 Conflict Resolution and Mediation', code: '3.1.3', area: 'Leadership and Collaboration', type: 'FOUNDATIONAL' },
  { id: 1360, title: '3.1.4 Team Commitment and Responsibility', code: '3.1.4', area: 'Leadership and Collaboration', type: 'FOUNDATIONAL' },
  { id: 1364, title: '3.1.5 Project Management', code: '3.1.5', area: 'Leadership and Collaboration', type: 'FOUNDATIONAL' },
  { id: 1422, title: '3.2.2 Leadership Strategies', code: '3.2.2', area: 'Leadership and Collaboration', type: 'ADVANCED' },
  { id: 1401, title: '3.2.3 Strategic Visioning', code: '3.2.3', area: 'Leadership and Collaboration', type: 'ADVANCED' },
  { id: 1423, title: '3.2.4 Emergent Leadership', code: '3.2.4', area: 'Leadership and Collaboration', type: 'ADVANCED' },
  { id: 1424, title: '3.2.5 Ethical and Moral Integrity', code: '3.2.5', area: 'Leadership and Collaboration', type: 'ADVANCED' },
  { id: 1402, title: '3.1.3 Empathy in Leadership', code: '3.1.3b', area: 'Leadership and Collaboration', type: 'FOUNDATIONAL' },
  { id: 1403, title: '3.1.4 Adaptability in Collaboration', code: '3.1.4b', area: 'Leadership and Collaboration', type: 'FOUNDATIONAL' },
  { id: 1406, title: '3.1.7 Motivation and Inspiration', code: '3.1.7', area: 'Leadership and Collaboration', type: 'FOUNDATIONAL' },

  // 4. Effective Communication
  { id: 1380, title: '4.1.1 Writing Composition', code: '4.1.1', area: 'Effective Communication', type: 'FOUNDATIONAL' },
  { id: 1425, title: '4.1.2 Storytelling for Impact', code: '4.1.2', area: 'Effective Communication', type: 'FOUNDATIONAL' },
  { id: 1392, title: '4.1.3 Visual Communication Design', code: '4.1.3', area: 'Effective Communication', type: 'FOUNDATIONAL' },
  { id: 1393, title: '4.1.4 Message Clarity & Precision', code: '4.1.4', area: 'Effective Communication', type: 'FOUNDATIONAL' },
  { id: 1359, title: '4.1.5 Empathetic Listening', code: '4.1.5', area: 'Effective Communication', type: 'FOUNDATIONAL' },
  { id: 1394, title: '4.2.1 Cultural Competence', code: '4.2.1', area: 'Effective Communication', type: 'ADVANCED' },
  { id: 1391, title: '4.2.2 Persuasion and Influence', code: '4.2.2', area: 'Effective Communication', type: 'ADVANCED' },
  { id: 1426, title: '4.2.3 Advanced Public Speaking', code: '4.2.3', area: 'Effective Communication', type: 'ADVANCED' },
  { id: 1427, title: '4.2.4 Impact Through Digital Media', code: '4.2.4', area: 'Effective Communication', type: 'ADVANCED' },
  { id: 1428, title: '4.2.5 Advanced Topics in Written Expression', code: '4.2.5', area: 'Effective Communication', type: 'ADVANCED' },
  { id: 1358, title: '4.1.3 Public Speaking', code: '4.1.3b', area: 'Effective Communication', type: 'FOUNDATIONAL' },
  { id: 1407, title: '4.1.5 Verbal and Nonverbal Communication', code: '4.1.5b', area: 'Effective Communication', type: 'FOUNDATIONAL' },

  // 5. Creative Thinking
  { id: 1368, title: '5.1.1 Creative Voice & Identity', code: '5.1.1', area: 'Creative Thinking', type: 'FOUNDATIONAL' },
  { id: 1369, title: '5.1.2 Novel Ideation', code: '5.1.2', area: 'Creative Thinking', type: 'FOUNDATIONAL' },
  { id: 1367, title: '5.1.3 Engineering Design', code: '5.1.3', area: 'Creative Thinking', type: 'FOUNDATIONAL' },
  { id: 1408, title: '5.1.4 Creative Systems Innovation', code: '5.1.4', area: 'Creative Thinking', type: 'FOUNDATIONAL' },
  { id: 1363, title: '5.1.5 Technological Creativity', code: '5.1.5', area: 'Creative Thinking', type: 'FOUNDATIONAL' },
  { id: 1429, title: '5.2.1 Creative Problem Solving', code: '5.2.1', area: 'Creative Thinking', type: 'ADVANCED' },
  { id: 1430, title: '5.2.2 Purposeful Design', code: '5.2.2', area: 'Creative Thinking', type: 'ADVANCED' },
  { id: 1431, title: '5.2.3 Original Expression', code: '5.2.3', area: 'Creative Thinking', type: 'ADVANCED' },
  { id: 1432, title: '5.2.4 Divergent Thinking', code: '5.2.4', area: 'Creative Thinking', type: 'ADVANCED' },
  { id: 1387, title: '5.2.5 Applied Project Design', code: '5.2.5', area: 'Creative Thinking', type: 'ADVANCED' },
  { id: 1370, title: '5.1.4 Creativity from Transfer', code: '5.1.4b', area: 'Creative Thinking', type: 'FOUNDATIONAL' },
  { id: 1366, title: '5.1.7 Reflection and Iteration', code: '5.1.7', area: 'Creative Thinking', type: 'FOUNDATIONAL' },

  // 6. Social and Emotional Aptitude
  { id: 1381, title: '6.1.1 Self Awareness', code: '6.1.1', area: 'Social and Emotional Aptitude', type: 'FOUNDATIONAL' },
  { id: 1382, title: '6.1.2 Interpersonal Relationships', code: '6.1.2', area: 'Social and Emotional Aptitude', type: 'FOUNDATIONAL' },
  { id: 1385, title: '6.1.3 Ethical Reasoning', code: '6.1.3', area: 'Social and Emotional Aptitude', type: 'FOUNDATIONAL' },
  { id: 1437, title: '6.1.4 Resilience and Perseverance', code: '6.1.4', area: 'Social and Emotional Aptitude', type: 'FOUNDATIONAL' },
  { id: 1383, title: '6.1.5 Emotional Regulation', code: '6.1.5', area: 'Social and Emotional Aptitude', type: 'FOUNDATIONAL' },
  { id: 1438, title: '7.2.1 Stress Management', code: '7.2.1', area: 'Social and Emotional Aptitude', type: 'ADVANCED' },
  { id: 1439, title: '7.2.2 Assertiveness', code: '7.2.2', area: 'Social and Emotional Aptitude', type: 'ADVANCED' },
  { id: 1386, title: '7.2.4 Metacognition', code: '7.2.4', area: 'Social and Emotional Aptitude', type: 'ADVANCED' },
  { id: 1384, title: '7.2.5 Conflict Resolution', code: '7.2.5', area: 'Social and Emotional Aptitude', type: 'ADVANCED' },
  { id: 1399, title: '7.1.2 Social Awareness', code: '7.1.2', area: 'Social and Emotional Aptitude', type: 'FOUNDATIONAL' },
  { id: 1411, title: '7.1.5 Postive Mindset', code: '7.1.5', area: 'Social and Emotional Aptitude', type: 'FOUNDATIONAL' },
  { id: 1410, title: '7.1.6 Social Responsibility', code: '7.1.6', area: 'Social and Emotional Aptitude', type: 'FOUNDATIONAL' },

  // 7. Entrepreneurship
  { id: 1355, title: '7.1.1 Market Research and Analysis', code: '7.1.1', area: 'Entrepreneurship', type: 'FOUNDATIONAL' },
  { id: 1389, title: '7.1.2 Business Planning', code: '7.1.2', area: 'Entrepreneurship', type: 'FOUNDATIONAL' },
  { id: 1365, title: '7.1.3 Startup Financial Planning', code: '7.1.3', area: 'Entrepreneurship', type: 'FOUNDATIONAL' },
  { id: 1390, title: '7.1.4 Sustainable Business Modeling', code: '7.1.4', area: 'Entrepreneurship', type: 'FOUNDATIONAL' },
  { id: 1413, title: '7.1.5 Value Proposition Development', code: '7.1.5', area: 'Entrepreneurship', type: 'FOUNDATIONAL' },
  { id: 1371, title: '1.2.1. Networking and Relationship Building', code: '1.2.1b', area: 'Entrepreneurship', type: 'ADVANCED' },
  { id: 1357, title: '1.2.3 Applied Social Innovation', code: '1.2.3b', area: 'Entrepreneurship', type: 'ADVANCED' },
  { id: 1420, title: '1.2.4. Advanced Apprenticeship', code: '1.2.4b', area: 'Entrepreneurship', type: 'ADVANCED' },
  { id: 1421, title: '1.2.5. Ethical and Social Responsibility', code: '1.2.5b', area: 'Entrepreneurship', type: 'ADVANCED' },
  { id: 1412, title: '1.1.3. Resilience and Adaptability', code: '1.1.3c', area: 'Entrepreneurship', type: 'FOUNDATIONAL' },
  { id: 1414, title: '1.1.6 Risk Taking', code: '1.1.6', area: 'Entrepreneurship', type: 'FOUNDATIONAL' }
];

/**
 * Resolves any SPARK competency identifier (title, code prefix, or ID)
 * to a verified Mastery Credit object.
 * Returns null if not found.
 */
export function resolveMasteryCredit(query) {
  if (!query) return null;
  const str = String(query).trim();
  if (!str) return null;

  // 1. Numeric ID
  const asNum = Number(str);
  if (!isNaN(asNum) && MASTERY_CREDITS_CATALOG.some(c => c.id === asNum)) {
    return MASTERY_CREDITS_CATALOG.find(c => c.id === asNum);
  }

  // 2. Exact Title match (case-insensitive)
  const lower = str.toLowerCase();
  const exact = MASTERY_CREDITS_CATALOG.find(c => c.title.toLowerCase() === lower);
  if (exact) return exact;

  // 3. Code match (e.g. "1.1.1" or "5.1.3")
  const codeMatch = str.match(/^(\d+\.\d+\.\d+)/);
  if (codeMatch) {
    const code = codeMatch[1];
    const byCode = MASTERY_CREDITS_CATALOG.find(c => c.title.startsWith(code) || c.code === code);
    if (byCode) return byCode;
  }

  // 4. Substring / name match (e.g. "Goal Setting")
  const byName = MASTERY_CREDITS_CATALOG.find(c => {
    const cLower = c.title.toLowerCase();
    return cLower.includes(lower) || lower.includes(cLower);
  });
  if (byName) return byName;

  return null;
}

/**
 * Validates whether a given SPARK competency can be recorded to Mastery.
 * Returns { canRecord: true, credit } or { canRecord: false, reason }
 */
export function evaluateCompetencyMapping(competency) {
  if (!competency) {
    return {
      canRecord: false,
      reason: 'No competency specified on this submission.'
    };
  }

  const credit = resolveMasteryCredit(competency);
  if (!credit) {
    return {
      canRecord: false,
      reason: `No verified Mastery credit mapping found for competency "${competency}". Ordinary approval is available.`
    };
  }

  return {
    canRecord: true,
    credit
  };
}
