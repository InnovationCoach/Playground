// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/firebase.js', () => ({
  db: {},
  doc: vi.fn(),
  updateDoc: vi.fn(),
  setDoc: vi.fn(),
  arrayUnion: vi.fn(),
  increment: vi.fn()
}));

vi.mock('../src/services/geminiApi.js', () => ({
  default: { generateContextualResponse: vi.fn() }
}));

import geminiApi from '../src/services/geminiApi.js';
import { buildDashboardAssistantContext } from '../src/features/dashboard/dashboardAssistantContext.js';
import { SmartSENChatbot } from '../src/components/SEN/SmartSENChatbotVanilla.js';
const generateContextualResponse = geminiApi.generateContextualResponse;

describe('buildDashboardAssistantContext', () => {
  it('captures active PBL courses, term project, goals, checklist, strengths, and focus skill', () => {
    const ctx = buildDashboardAssistantContext({
      activeSlide: 'daily',
      studentName: 'Maya',
      data: {
        state: 'ready',
        warnings: [],
        courses: [
          {
            program: {
              id: 'clean-water-pbl',
              title: 'Clean Water Filter Challenge',
              phases: [
                { id: 'explore', title: 'Explore', sessions: [{ sessionNumber: 1 }] },
                { id: 'build', title: 'Build & Test', sessions: [{ sessionNumber: 2 }] }
              ]
            },
            summary: {
              pct: 50,
              next: {
                phaseId: 'build',
                sessionNumber: 2,
                title: 'Test filtration layers',
                activities: ['Compare sand vs charcoal turbidity'],
                evidenceToCollect: 'Turbidity test log'
              },
              byPhase: { explore: { complete: true } }
            },
            enrolment: { currentPhaseId: 'build' }
          }
        ]
      },
      project: {
        termId: 'term-4',
        currentPhase: 'prototype',
        problem: { hmw: 'How might we filter greywater for our school garden?', who: 'School garden club', why: '' },
        impact: 'environment',
        evidence: [{ id: 'e1' }, { id: 'e2' }],
        updatedAt: 1700000000000
      },
      plan: {
        goals: [
          {
            id: 'g1',
            explore: 'Understand how activated carbon traps impurities',
            showHow: 'diagram',
            done: false,
            steps: [
              { id: 's1', text: 'Read 1 short article on carbon filters', done: true },
              { id: 's2', text: 'Sketch a labeled filter diagram', done: false }
            ]
          }
        ],
        focus: { skill: 'starting', habit: 'Set a 5-minute timer and just begin' },
        strengths: ['big-picture', 'building'],
        supports: ['small-steps']
      },
      model: {
        today: [
          { id: 't1', kind: 'step', text: 'Sketch a labeled filter diagram', goal: 'Understand how activated carbon traps impurities' }
        ],
        ticked: new Set(),
        skill: { title: 'Systems Thinking' }
      },
      goalsLoaded: true
    });

    expect(ctx.activity).toBe('student-dashboard');
    expect(ctx.tab).toBe('My Quests');
    expect(ctx.progress.studentName).toBe('Maya');
    expect(ctx.progress.pblCourses[0]).toMatchObject({
      title: 'Clean Water Filter Challenge',
      progressPct: 50,
      currentStage: 'Build & Test',
      nextStep: 'Test filtration layers',
      evidenceToCollect: 'Turbidity test log'
    });
    expect(ctx.progress.termProject).toMatchObject({
      currentPhase: 'prototype',
      hmw: 'How might we filter greywater for our school garden?',
      evidenceCount: 2
    });
    expect(ctx.progress.goals[0]).toMatchObject({
      explore: 'Understand how activated carbon traps impurities',
      showHow: 'A drawing or diagram',
      stepsDone: 1,
      stepsTotal: 2,
      nextStep: 'Sketch a labeled filter diagram'
    });
    expect(ctx.progress.focusSkill).toMatchObject({
      skill: 'Getting started on tasks',
      habit: 'Set a 5-minute timer and just begin'
    });
    expect(ctx.progress.strengths).toEqual(['Seeing the big picture', 'Building and making things']);
  });
});

describe('SmartSENChatbot on Student Dashboard', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    delete window.__CURRENT_ACTIVITY_CONTEXT__;
    window.location.hash = '#/dashboard';
    generateContextualResponse.mockReset();
  });

  afterEach(() => {
    delete window.__CURRENT_ACTIVITY_CONTEXT__;
  });

  it('styles the student input with black text on a white background', () => {
    new SmartSENChatbot({ userId: 'u1', senEnabled: true });
    const styleText = document.getElementById('sen-chatbot-styles')?.textContent || '';
    expect(styleText).toContain('.sen-input-area input#sen-input');
    expect(styleText).toContain('color: #111827');
    expect(styleText).toContain('background: #ffffff');
    expect(styleText).toContain('caret-color: #111827');
  });

  it('does not default to solar-car on #/dashboard and greets with PBL + goal context', () => {
    window.__CURRENT_ACTIVITY_CONTEXT__ = buildDashboardAssistantContext({
      activeSlide: 'daily',
      studentName: 'Maya',
      data: {
        state: 'ready',
        warnings: [],
        courses: [{ program: { id: 'p1', title: 'Urban Cooling Lab', phases: [] }, summary: { pct: 40, next: { title: 'Measure shade temps' } } }]
      },
      plan: {
        goals: [{ id: 'g1', explore: 'Map the hottest spots on campus', done: false, steps: [{ id: 's1', text: 'Pick 3 spots', done: false }] }],
        strengths: ['deep-questions'],
        supports: []
      },
      model: { today: [], ticked: new Set() }
    });

    const bot = new SmartSENChatbot({ userId: 'u1', senEnabled: true });
    expect(bot.getActivityContext().activity).toBe('student-dashboard');

    bot.open();
    const welcome = document.querySelector('#sen-conversation .sen-message.assistant .sen-message-bubble')?.textContent || '';
    expect(welcome).toContain('Hi Maya!');
    expect(welcome).toContain('Urban Cooling Lab');
    expect(welcome).toContain('Map the hottest spots on campus');
    expect(welcome).not.toContain('solar-car');
  });

  it('sends PBL, goal, and coaching persona context to Gemini when student asks a question', async () => {
    window.__CURRENT_ACTIVITY_CONTEXT__ = buildDashboardAssistantContext({
      activeSlide: 'daily',
      studentName: 'Maya',
      data: {
        state: 'ready',
        warnings: [],
        courses: [{ program: { id: 'p1', title: 'Urban Cooling Lab', phases: [] }, summary: { pct: 40, next: { title: 'Measure shade temps' } } }]
      },
      plan: {
        goals: [{ id: 'g1', explore: 'Map the hottest spots on campus', done: false, steps: [{ id: 's1', text: 'Pick 3 spots', done: false }] }],
        strengths: ['deep-questions'],
        supports: []
      },
      model: { today: [{ id: 't1', text: 'Pick 3 spots' }], ticked: new Set() }
    });

    generateContextualResponse.mockResolvedValueOnce(
      'Great question, Maya! For Urban Cooling Lab, try picking 3 sunny vs shady spots you already walk past—which spot feels warmest to you?'
    );

    const bot = new SmartSENChatbot({ userId: 'u1', senEnabled: true });
    bot.open();

    const input = document.getElementById('sen-input');
    input.value = 'Where should I start today?';
    await bot.sendMessage();

    expect(generateContextualResponse).toHaveBeenCalledTimes(1);
    const [payload] = generateContextualResponse.mock.calls[0];
    expect(payload.message).toBe('Where should I start today?');
    expect(payload.action).toBe('custom_question');
    expect(payload.history).toEqual([]);
    expect(payload.dashboardContext.activity).toBe('student-dashboard');
    expect(payload.dashboardContext.progress.pblCourses[0].title).toBe('Urban Cooling Lab');
    expect(payload.dashboardContext.progress.goals[0].explore).toBe('Map the hottest spots on campus');
    expect(payload.dashboardContext.progress.strengths).toContain('Asking deep questions');

    const bubbles = [...document.querySelectorAll('#sen-conversation .sen-message.assistant .sen-message-bubble')];
    expect(bubbles[bubbles.length - 1].textContent).toContain('Great question, Maya!');
  });

  it('provides dashboard-aware coach fallback if the AI endpoint is unavailable', async () => {
    window.__CURRENT_ACTIVITY_CONTEXT__ = buildDashboardAssistantContext({
      activeSlide: 'daily',
      studentName: 'Maya',
      data: {
        state: 'ready',
        warnings: [],
        courses: [{ program: { id: 'p1', title: 'Urban Cooling Lab', phases: [] }, summary: { pct: 40, next: { title: 'Measure shade temps' } } }]
      },
      plan: {
        goals: [{ id: 'g1', explore: 'Map the hottest spots on campus', done: false, steps: [{ id: 's1', text: 'Pick 3 spots', done: false }] }]
      },
      model: { today: [], ticked: new Set() }
    });

    generateContextualResponse.mockRejectedValueOnce(new Error('offline'));
    const bot = new SmartSENChatbot({ userId: 'u1', senEnabled: true });
    bot.open();
    await bot.handleQuickAction('hint');

    const bubbles = [...document.querySelectorAll('#sen-conversation .sen-message.assistant .sen-message-bubble')];
    const reply = bubbles[bubbles.length - 1].textContent;
    expect(reply).toContain('Pick 3 spots');
    expect(reply).not.toContain('chassis weight');
  });

  it('renders Spark AI Assistant FAB and opens via window.openSparkAssistant()', () => {
    const bot = new SmartSENChatbot({ userId: 'u1', senEnabled: true });
    const fabBtn = document.getElementById('sen-fab-btn');
    expect(fabBtn).toBeTruthy();
    expect(fabBtn.getAttribute('aria-label')).toBe('Spark AI Assistant');
    expect(fabBtn.textContent).toContain('Spark AI');
    expect(fabBtn.textContent).toContain('✨');

    const modal = document.getElementById('sen-modal');
    expect(modal.classList.contains('hidden')).toBe(true);

    // Call global open helper
    expect(typeof window.openSparkAssistant).toBe('function');
    window.openSparkAssistant();
    expect(modal.classList.contains('hidden')).toBe(false);

    const title = modal.querySelector('.sen-modal-header h2')?.textContent || '';
    expect(title).toContain('Spark AI Assistant');
  });

  it('captures academic progress, coach feedback, interests, and supports in dashboard context', () => {
    const ctx = buildDashboardAssistantContext({
      activeSlide: 'progress',
      studentName: 'Alex',
      profile: { ageBand: '13-15', yearGroup: 'Year 9' },
      prefs: { interests: ['robotics', 'climate'], tagline: 'Building cool stuff' },
      edmentumStatus: 'connected',
      edmentum: {
        providerStatus: 'connected',
        summary: {
          enrolledClassCount: 2,
          completedClassCount: 0,
          overallProgressPercent: 68,
          averageCurrentGrade: 86,
          totalTimeOnTaskSeconds: 3600
        },
        enrolledClasses: [{ className: 'Algebra 1', progressPercent: 72, currentGrade: 88 }],
        recentScores: [{ activityTitle: 'Linear Equations Quiz', score: 9, maxScore: 10 }]
      },
      coachFeedback: [
        { coachName: 'Coach Sam', type: 'written_feedback', feedbackText: 'Strong hypothesis—test one variable at a time.', timestamp: 1700000000000 }
      ],
      model: {
        today: [],
        ticked: new Set(),
        academic: { items: [{ id: 'solar-car', title: 'Solar Car Lab', started: true }] },
        badges: [{ id: 'b1', label: 'First Spark', earned: true }]
      }
    });

    expect(ctx.progress.interests).toEqual(['robotics', 'climate']);
    expect(ctx.progress.academic.edmentumStatus).toBe('connected');
    expect(ctx.progress.academic.overallProgressPercent).toBe(68);
    expect(ctx.progress.academic.enrolledClasses[0].name).toBe('Algebra 1');
    expect(ctx.progress.academic.steamActivitiesStarted).toContain('Solar Car Lab');
    expect(ctx.progress.coachFeedback[0].coachName).toBe('Coach Sam');
    expect(ctx.progress.coachFeedback[0].feedbackText).toContain('Strong hypothesis');
    expect(ctx.progress.engagement.badgesEarned).toBe(1);
  });

  it('renders Voice AI and screenshot controls and sends attached screenshot to Gemini', async () => {
    generateContextualResponse.mockResolvedValueOnce('I can see your circuit diagram! Try checking the resistor value.');
    const bot = new SmartSENChatbot({ userId: 'u1', senEnabled: true });
    bot.open();

    const voiceBtn = document.getElementById('sen-voice-toggle-btn');
    const micBtn = document.getElementById('sen-mic-btn');
    const attachBtn = document.getElementById('sen-attach-btn');
    const fileInput = document.getElementById('sen-file-input');

    expect(voiceBtn).toBeTruthy();
    expect(micBtn).toBeTruthy();
    expect(attachBtn).toBeTruthy();
    expect(fileInput?.getAttribute('accept')).toContain('image/png');

    voiceBtn.click();
    expect(bot.voiceEnabled).toBe(true);
    expect(voiceBtn.textContent).toContain('Voice On');

    bot.pendingImage = {
      base64: 'ZmFrZQ==',
      mimeType: 'image/png',
      previewUrl: 'data:image/png;base64,ZmFrZQ==',
      name: 'circuit.png'
    };

    await bot.sendMessage();

    expect(generateContextualResponse).toHaveBeenCalledTimes(1);
    const [payload] = generateContextualResponse.mock.calls[0];
    expect(payload.image).toEqual({ base64: 'ZmFrZQ==', mimeType: 'image/png' });
    expect(payload.message).toContain('screenshot');
    expect(bot.pendingImage).toBeNull();
  });
});


