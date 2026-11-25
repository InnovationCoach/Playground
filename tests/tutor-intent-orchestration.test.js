import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TUTOR_INTENTS,
  classifyTutorIntent,
  selectTutorContext,
  sanitizeConversationHistory,
  isSafeguardingMessage,
  SAFEGUARDING_REPLY
} from '../server/lib/ai/tutorIntent.js';
import { buildDashboardAssistantInstruction, buildSystemInstruction } from '../server/safety.js';

const SAMPLE_DASHBOARD_CONTEXT = {
  activity: 'student-dashboard',
  tab: 'My Quests',
  progress: {
    studentName: 'Maya',
    pblCourses: [
      {
        id: 'solar-city',
        title: 'Solar City Challenge',
        progressPct: 60,
        currentStage: 'Day 4: Prototype Testing',
        nextStep: 'Measure panel output',
        nextTask: 'Test 3 panel angles',
        evidenceToCollect: 'Angle vs Wattage table'
      }
    ],
    termProject: {
      termId: 'term-4',
      currentPhase: 'prototype',
      hmw: 'How might we cool our school courtyard?',
      evidenceCount: 3
    },
    goals: [
      {
        explore: 'Improve solar efficiency calculations',
        showHow: 'A drawing or diagram',
        done: false,
        stepsDone: 1,
        stepsTotal: 3,
        nextStep: 'Sketch circuit diagram'
      }
    ],
    todayChecklist: { total: 3, completed: 1, remaining: ['Sketch circuit diagram'] },
    focusSkill: { skill: 'Systems Thinking', habit: 'Check how parts connect' },
    strengths: ['Building and making things']
  }
};

describe('Intent-First Tutor Orchestration', () => {
  describe('Phase Eight: Required Intent Categories', () => {
    it('1. Navigation: "Where can I set my goals?" -> dashboard_navigation + Goal Setting guide, no Day 4 dump', () => {
      const { intent } = classifyTutorIntent('Where can I set my goals?');
      expect(intent).toBe(TUTOR_INTENTS.DASHBOARD_NAVIGATION);

      const selected = selectTutorContext({ intent, dashboardContext: SAMPLE_DASHBOARD_CONTEXT });
      expect(selected.contextCategories).toContain('navigation_guide');
      expect(selected.contextBlock).toContain('Goal Setting (#/goals)');
      expect(selected.contextBlock).not.toContain('Day 4: Prototype Testing');
      expect(selected.contextBlock).not.toContain('Measure panel output');
    });

    it('2. Academic: "What subjects am I studying?" -> academic_progress', () => {
      const { intent } = classifyTutorIntent('What subjects am I studying?');
      expect(intent).toBe(TUTOR_INTENTS.ACADEMIC_PROGRESS);

      const selected = selectTutorContext({ intent, dashboardContext: SAMPLE_DASHBOARD_CONTEXT });
      expect(selected.contextCategories).toContain('academic_progress');
      expect(selected.contextBlock).toContain('Solar City Challenge');
    });

    it('3. PBL: "What is my current project?" -> pbl_project', () => {
      const { intent } = classifyTutorIntent('What is my current project?');
      expect(intent).toBe(TUTOR_INTENTS.PBL_PROJECT);

      const selected = selectTutorContext({ intent, dashboardContext: SAMPLE_DASHBOARD_CONTEXT });
      expect(selected.contextCategories).toContain('pbl_projects');
      expect(selected.contextBlock).toContain('Solar City Challenge');
      expect(selected.contextBlock).toContain('How might we cool our school courtyard?');
    });

    it('4. General knowledge: "What is photosynthesis?" -> general_knowledge without program script', () => {
      const { intent } = classifyTutorIntent('What is photosynthesis?');
      expect(intent).toBe(TUTOR_INTENTS.GENERAL_KNOWLEDGE);

      const selected = selectTutorContext({ intent, dashboardContext: SAMPLE_DASHBOARD_CONTEXT });
      expect(selected.contextCategories).toContain('none_program_context_withheld');
      expect(selected.contextBlock).not.toContain('Day 4: Prototype Testing');
      expect(selected.contextBlock).not.toContain('Solar City Challenge');
    });

    it('5. Follow-up: "Can you explain that again?" -> follow_up using immediate history', () => {
      const history = [
        { role: 'user', text: 'What is photosynthesis?' },
        { role: 'model', text: 'Photosynthesis is how plants turn sunlight, water, and CO2 into sugar and oxygen.' }
      ];
      const { intent } = classifyTutorIntent('Can you explain that again?', history);
      expect(intent).toBe(TUTOR_INTENTS.FOLLOW_UP);

      const selected = selectTutorContext({ intent, dashboardContext: SAMPLE_DASHBOARD_CONTEXT, history });
      expect(selected.contextCategories).toContain('conversation_history');
      expect(selected.contextBlock).not.toContain('Day 4: Prototype Testing');
    });

    it('6. Topic change: "How do I change my profile picture?" -> dashboard_navigation with Settings/Avatar', () => {
      const history = [
        { role: 'user', text: 'What is my current project?' },
        { role: 'model', text: 'Your current project is Solar City Challenge.' }
      ];
      const { intent } = classifyTutorIntent('By the way, how do I change my profile picture?', history);
      expect(intent).toBe(TUTOR_INTENTS.DASHBOARD_NAVIGATION);

      const selected = selectTutorContext({ intent, dashboardContext: SAMPLE_DASHBOARD_CONTEXT, history });
      expect(selected.contextBlock).toContain('Profile Picture / Avatar (#/settings)');
      expect(selected.contextBlock).not.toContain('Day 4: Prototype Testing');
    });

    it('7. Program continuation: "Let\'s continue Day 4" -> program_continuation with PBL context', () => {
      const { intent } = classifyTutorIntent("Let's continue Day 4");
      expect(intent).toBe(TUTOR_INTENTS.PROGRAM_CONTINUATION);

      const selected = selectTutorContext({ intent, dashboardContext: SAMPLE_DASHBOARD_CONTEXT });
      expect(selected.contextCategories).toContain('pbl_projects');
      expect(selected.contextBlock).toContain('Day 4: Prototype Testing');
    });

    it('8. Ambiguous: "Can you help me?" -> ambiguous with minimal clarification', () => {
      const { intent } = classifyTutorIntent('Can you help me?');
      expect(intent).toBe(TUTOR_INTENTS.AMBIGUOUS);

      const selected = selectTutorContext({ intent, dashboardContext: SAMPLE_DASHBOARD_CONTEXT });
      expect(selected.contextCategories).toContain('minimal_clarification');
      expect(selected.contextBlock).not.toContain('Day 4: Prototype Testing');
    });

    it('9. Repeated question: "Where are my goals?" -> dashboard_navigation', () => {
      const { intent } = classifyTutorIntent('Where are my goals?');
      expect(intent).toBe(TUTOR_INTENTS.DASHBOARD_NAVIGATION);

      const selected = selectTutorContext({ intent, dashboardContext: SAMPLE_DASHBOARD_CONTEXT });
      expect(selected.contextBlock).toContain('Goal Setting (#/goals)');
    });

    it('10. Unrelated topic: "What\'s the capital of Japan?" -> general_knowledge', () => {
      const { intent } = classifyTutorIntent("What's the capital of Japan?");
      expect(intent).toBe(TUTOR_INTENTS.GENERAL_KNOWLEDGE);

      const selected = selectTutorContext({ intent, dashboardContext: SAMPLE_DASHBOARD_CONTEXT });
      expect(selected.contextCategories).toContain('none_program_context_withheld');
      expect(selected.contextBlock).not.toContain('Solar City Challenge');
    });
  });

  describe('System Instruction & Child Safety Preservation', () => {
    it('buildDashboardAssistantInstruction prioritizes student question over program scripts', () => {
      const sys = buildDashboardAssistantInstruction('lower-secondary', {
        intent: TUTOR_INTENTS.DASHBOARD_NAVIGATION,
        contextBlock: 'Goal Setting (#/goals)'
      });
      expect(sys).toContain('Understand and answer the student\'s ACTUAL current message FIRST');
      expect(sys).toContain('Never ignore the student\'s question to continue a predefined program');
      expect(sys).toContain('Goal Setting (#/goals)');
      expect(sys).not.toContain('If asked about anything unrelated to schoolwork, say you can only help with the activity');
      // Still enforces safeguarding & privacy
      expect(sys).toContain('That sounds really important. Please talk to your teacher or another adult you trust right now.');
    });

    it('preserves legacy buildSystemInstruction for STEM activities', () => {
      const stemSys = buildSystemInstruction('lower-secondary', 'Solar Car Challenge');
      expect(stemSys).toContain('patient STEM tutor');
    });

    it('detects safeguarding disclosures early', () => {
      expect(isSafeguardingMessage('I want to hurt myself')).toBe(true);
      expect(isSafeguardingMessage('Where can I set my goals?')).toBe(false);
      expect(SAFEGUARDING_REPLY).toContain('adult you trust');
    });

    it('bounds and normalizes conversation history cleanly', () => {
      const longHistory = Array.from({ length: 14 }, (_, i) => ({
        sender: i % 2 === 0 ? 'user' : 'assistant',
        text: `Turn ${i}`
      }));
      const clean = sanitizeConversationHistory(longHistory, 8);
      expect(clean).toHaveLength(8);
      expect(clean[0]).toEqual({ role: 'user', text: 'Turn 6' });
      expect(clean[7]).toEqual({ role: 'model', text: 'Turn 13' });
    });
  });
});

describe('/api/tutor end-to-end pipeline with mocked modelAdapter', () => {
  let capturedCalls = [];

  beforeEach(() => {
    capturedCalls = [];
    vi.resetModules();
  });

  it('routes dashboard navigation, general knowledge, follow-ups, and safeguarding through /api/tutor without prompt contamination', async () => {
    vi.doMock('../server/auth.js', async (importOriginal) => {
      const actual = await importOriginal();
      return {
        ...actual,
        initAdmin: () => false,
        requireAuth: (req, _res, next) => {
          const studentId = req.headers['x-test-uid'] || 'student-a';
          req.user = { uid: studentId, role: 'student' };
          next();
        },
        logConversation: vi.fn().mockResolvedValue(undefined),
        flagForReview: vi.fn().mockResolvedValue(undefined)
      };
    });

    const { createApp } = await import('../server/app.js');
    const app = createApp({
      geminiApiKey: 'test-key-for-unit-suite',
      geminiModel: 'gemini-3.5-flash-lite',
      modelAdapter: {
        generateContent: async (req) => {
          capturedCalls.push(req);
          const lastUserText = req.contents[req.contents.length - 1]?.parts?.[0]?.text || '';
          return {
            response: {
              candidates: [{ finishReason: 'STOP' }],
              text: () => `Reply to: ${lastUserText.slice(0, 60)}`
            }
          };
        }
      }
    });

    const callTutor = (body, uid = 'student-a') => new Promise((resolve, reject) => {
      const req = {
        method: 'POST',
        url: '/api/tutor',
        originalUrl: '/api/tutor',
        path: '/api/tutor',
        headers: { 'content-type': 'application/json', 'x-test-uid': uid },
        body,
        ip: '127.0.0.1',
        socket: { remoteAddress: '127.0.0.1' },
        get(name) { return this.headers[String(name).toLowerCase()]; }
      };
      const resHeaders = {};
      const res = {
        statusCode: 200,
        locals: {},
        set(k, v) { resHeaders[String(k).toLowerCase()] = v; return this; },
        setHeader(k, v) { resHeaders[String(k).toLowerCase()] = v; },
        getHeader(k) { return resHeaders[String(k).toLowerCase()]; },
        status(code) { this.statusCode = code; return this; },
        json(payload) { resolve({ status: this.statusCode, data: payload }); return this; },
        send(payload) { resolve({ status: this.statusCode, data: payload }); return this; },
        end(payload) { resolve({ status: this.statusCode, data: payload }); return this; }
      };
      app(req, res, (err) => {
        if (err) reject(err);
        else resolve({ status: res.statusCode, data: null });
      });
    });

    // 1. Empty message -> 400
    const emptyRes = await callTutor({ message: '   ' });
    expect(emptyRes.status).toBe(400);

    // 2. Navigation question -> Goal Setting guide, NO Day 4 program dump
    const navRes = await callTutor({
      message: 'Where can I set my goals?',
      dashboardContext: SAMPLE_DASHBOARD_CONTEXT
    });
    expect(navRes.status).toBe(200);
    expect(navRes.data.intent).toBe(TUTOR_INTENTS.DASHBOARD_NAVIGATION);
    expect(capturedCalls[0].systemInstruction.parts[0].text).toContain('Goal Setting (#/goals)');
    expect(capturedCalls[0].systemInstruction.parts[0].text).not.toContain('Day 4: Prototype Testing');
    expect(capturedCalls[0].contents).toHaveLength(1);
    expect(capturedCalls[0].contents[0].parts[0].text).toContain('Where can I set my goals?');

    // 3. General knowledge -> no program context injected
    const gkRes = await callTutor({
      message: "What's the difference between climate and weather?",
      dashboardContext: SAMPLE_DASHBOARD_CONTEXT
    });
    expect(gkRes.status).toBe(200);
    expect(gkRes.data.intent).toBe(TUTOR_INTENTS.GENERAL_KNOWLEDGE);
    expect(capturedCalls[1].systemInstruction.parts[0].text).not.toContain('Solar City Challenge');

    // 4. Follow-up with multi-turn history -> history passed as structured contents
    const fuRes = await callTutor({
      message: 'How do I do that?',
      history: [
        { role: 'user', text: 'Where can I set my goals?' },
        { role: 'model', text: 'Open Goal Setting (#/goals) from your dashboard.' }
      ],
      dashboardContext: SAMPLE_DASHBOARD_CONTEXT
    });
    expect(fuRes.status).toBe(200);
    expect(fuRes.data.intent).toBe(TUTOR_INTENTS.FOLLOW_UP);
    expect(capturedCalls[2].contents).toHaveLength(3);
    expect(capturedCalls[2].contents[0].role).toBe('user');
    expect(capturedCalls[2].contents[1].role).toBe('model');
    expect(capturedCalls[2].contents[2].parts[0].text).toContain('How do I do that?');

    // 5. Safeguarding -> immediate referral without calling Gemini
    const callCountBeforeSafety = capturedCalls.length;
    const safeRes = await callTutor({ message: 'I want to hurt myself' });
    expect(safeRes.status).toBe(200);
    expect(safeRes.data.reply).toBe(SAFEGUARDING_REPLY);
    expect(capturedCalls.length).toBe(callCountBeforeSafety);

    // 6. Coach feedback -> classifies COACH_FEEDBACK and injects coach feedback
    const richDashboardContext = {
      ...SAMPLE_DASHBOARD_CONTEXT,
      progress: {
        ...SAMPLE_DASHBOARD_CONTEXT.progress,
        academic: {
          edmentumStatus: 'connected',
          overallProgressPercent: 74,
          averageCurrentGrade: 88,
          enrolledClassCount: 2,
          enrolledClasses: [{ name: 'Algebra 1', progressPercent: 74, currentGrade: 88 }],
          steamActivitiesStarted: ['Solar Car Lab']
        },
        coachFeedback: [
          { coachName: 'Coach Sam', date: '2026-11-20', feedbackText: 'Great prototype sketch—measure your voltage drop next.' }
        ]
      }
    };
    const fbRes = await callTutor({
      message: 'What did my coach say in their feedback?',
      dashboardContext: richDashboardContext
    });
    expect(fbRes.status).toBe(200);
    expect(fbRes.data.intent).toBe(TUTOR_INTENTS.COACH_FEEDBACK);
    expect(capturedCalls[capturedCalls.length - 1].systemInstruction.parts[0].text).toContain('Coach Sam');
    expect(capturedCalls[capturedCalls.length - 1].systemInstruction.parts[0].text).toContain('voltage drop');

    // 7. Academic progress -> includes Edmentum + STEAM + Coach Feedback
    const acRes = await callTutor({
      message: 'How am I doing in my classes and grades?',
      dashboardContext: richDashboardContext
    });
    expect(acRes.status).toBe(200);
    expect(acRes.data.intent).toBe(TUTOR_INTENTS.ACADEMIC_PROGRESS);
    const acSys = capturedCalls[capturedCalls.length - 1].systemInstruction.parts[0].text;
    expect(acSys).toContain('Algebra 1');
    expect(acSys).toContain('74%');
    expect(acSys).toContain('Solar Car Lab');

    // 8. Screenshot attachment -> forwards inlineData part, rejects bad mimeType
    const badImgRes = await callTutor({
      message: 'Check this',
      image: { base64: 'ZmFrZQ==', mimeType: 'image/gif' }
    });
    expect(badImgRes.status).toBe(400);

    const imgRes = await callTutor({
      message: '',
      image: { base64: 'ZmFrZQ==', mimeType: 'image/png' },
      dashboardContext: richDashboardContext
    });
    expect(imgRes.status).toBe(200);
    const imgParts = capturedCalls[capturedCalls.length - 1].contents[0].parts;
    expect(imgParts.some((p) => p.inlineData?.mimeType === 'image/png' && p.inlineData?.data === 'ZmFrZQ==')).toBe(true);
  });
});
