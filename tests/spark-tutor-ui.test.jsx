// @vitest-environment jsdom
// Spark AI Learning Companion: the learner drawer and coach Review Desk show
// only what /api/spark-tutor returns, rest quietly when the service is off,
// and never present AI observations as official progress.
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../src/firebase.js', () => ({ auth: { currentUser: { uid: 'u_mia_chen_pilot' } }, usingEmulators: true }));
vi.mock('../src/services/api/apiClient.js', () => ({ schoolRequest: vi.fn() }));
import { schoolRequest } from '../src/services/api/apiClient.js';
import { SparkCompanion } from '../src/features/sparkTutor/SparkCompanion.jsx';
import { SparkReviewDesk } from '../src/features/sparkTutor/SparkReviewDesk.jsx';
import { classifySparkError, levelLabel, messagesFromTurns, suggestionIntent, topicLabel, sparkTutorUiEnabled } from '../src/features/sparkTutor/sparkTutorModel.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });
const apiError = (status, code) => Object.assign(new Error(code), { status, code });

const SESSION = { sessionId: 'ses_1', learnerUid: 'u_mia_chen_pilot', mode: 'pbl_mentor', assistanceLevel: 'elicit', activeDetour: null };
const DETOUR = { detourId: 'detour-1', topic: 'ratios_and_proportions', originatingProjectContext: { projectId: 'mars-colony-hab-2026' } };
const TASK = { taskId: 'prac-ratio-solar-01', question: 'If a 3 m² panel gives 600 W, how many m² give 1800 W?', promptHint: 'How many times greater?', unit: 'm²' };

let root, host;
beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); schoolRequest.mockReset(); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const render = async (el) => { await act(async () => { root.render(el); }); await flush(); };
const button = (text) => [...host.querySelectorAll('button')].find((b) => b.textContent.trim() === text || b.getAttribute('aria-label') === text);
const click = async (text) => { const b = button(text); expect(b, `button "${text}"`).toBeTruthy(); await act(async () => { b.click(); }); await flush(); };
const type = async (el, value) => {
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  await act(async () => { Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })); });
};
const calls = () => schoolRequest.mock.calls.map(([m, p, o]) => [m, p, o?.body]);

function routeApi(handlers) {
  schoolRequest.mockImplementation(async (method, path, opts) => {
    const key = Object.keys(handlers).find((k) => `${method} ${path}`.endsWith(k));
    if (!key) throw apiError(404, 'NOT_FOUND');
    const h = handlers[key];
    return typeof h === 'function' ? h(opts?.body) : h;
  });
}

describe('spark tutor model', () => {
  it('is switched on under the emulators', () => { expect(sparkTutorUiEnabled).toBe(true); });

  it('treats a disabled or missing service as resting, not as a learner error', () => {
    expect(classifySparkError(apiError(503, 'FEATURE_DISABLED')).state).toBe('disabled');
    expect(classifySparkError(apiError(404, 'NOT_FOUND')).state).toBe('disabled');
    expect(classifySparkError(apiError(403, 'FORBIDDEN')).state).toBe('error');
    expect(classifySparkError(apiError(403, 'FORBIDDEN'), { hasSession: false }).message).toContain('once you are in a class');
    expect(classifySparkError(apiError(403, 'FORBIDDEN')).message).toContain('another account');
    expect(classifySparkError(new Error('offline')).state).toBe('error');
  });

  it('describes every assistance level in learner and coach words', () => {
    expect(levelLabel('scaffold')).toBe('Breaking it down into steps');
    expect(levelLabel('guided_application', 'coach')).toBe('Guided');
    expect(levelLabel('made_up')).toBeNull();
  });

  it('routes server suggestions to the right action', () => {
    expect(suggestionIntent('Ask my coach')).toBe('coach');
    expect(suggestionIntent("Let's do the detour")).toBe('detour');
    expect(suggestionIntent('I want to try on my own first')).toBe('message');
  });

  it('rebuilds a conversation from saved turns and names topics', () => {
    expect(messagesFromTurns([{ turnId: 't1', userMessage: 'Hi', replyText: 'Hello', assistanceLevel: 'hint' }]).map((m) => m.role)).toEqual(['learner', 'spark']);
    expect(topicLabel('ratios_and_proportions')).toBe('Ratios & Proportions');
  });
});

describe('SparkCompanion', () => {
  it('runs the Mars detour loop: offer, practice, return to project', async () => {
    routeApi({
      'POST /api/spark-tutor/session': { session: SESSION, isNew: true, initialMessage: { text: 'Hi Mia!', suggestedActions: [] } },
      'POST /api/spark-tutor/session/ses_1/message': {
        reply: 'Want a quick ratios detour?', mode: 'pbl_mentor', assistanceLevel: 'hint',
        detourOffer: { detourId: 'detour-mars-ratios', topic: 'Ratios & Proportions in Solar Arrays', reason: 'Prerequisite concept' },
        suggestedActions: ["Let's do the detour", 'Ask my coach'], activeDetour: null
      },
      'POST /api/spark-tutor/session/ses_1/mode': (body) => body.returnToProject
        ? { mode: 'pbl_mentor', returnedToProject: true, brief: { prompt: 'Back to your 24 kW array!' } }
        : { mode: 'academic_tutor', activeDetour: DETOUR, initialPracticeTask: TASK },
      'POST /api/spark-tutor/session/ses_1/practice/submit': {
        correct: true, feedback: 'Spot on! 9 m².', readyToReturn: true, returnPrompt: 'Take it back to Mars.',
        evidenceCandidate: { evidenceId: 'ev1', officialProgressImpact: false, xpAwarded: 0 }
      }
    });
    await render(<SparkCompanion learnerName="Mia" projectContext={{ projectId: 'mars-colony-hab-2026' }} />);
    await click('Ask Spark');
    expect(calls()[0]).toEqual(['POST', '/api/spark-tutor/session', { mode: 'pbl_mentor', projectContext: { projectId: 'mars-colony-hab-2026' } }]);
    expect(host.textContent).toContain('Hi Mia!');
    expect(host.textContent).toContain('Exploring your ideas');

    await type(host.querySelector('#sk-draft'), 'How many m² for 24 kW?');
    await click('Send');
    expect(calls()[1][2]).toMatchObject({ message: 'How many m² for 24 kW?' });
    expect(host.textContent).toContain('Want a quick ratios detour?');
    expect(host.textContent).toContain('A helpful hint');

    await click("Let's do the detour");
    expect(calls()[2][2]).toEqual({ mode: 'academic_tutor', detourId: 'detour-mars-ratios' });
    expect(host.textContent).toContain('Concept detour:');
    expect(host.textContent).toContain('Ratios & Proportions');
    expect(host.textContent).toContain(TASK.question);

    await type(host.querySelector('.sk-answer input'), '9');
    await click('Check my answer');
    expect(calls()[3]).toEqual(['POST', '/api/spark-tutor/session/ses_1/practice/submit', { taskId: TASK.taskId, answer: '9' }]);
    expect(host.textContent).toContain('Spot on! 9 m².');
    expect(host.textContent).toContain('does not change your grades or XP');
    expect(host.textContent).toContain('Take it back to Mars.');

    await click('Return to project');
    expect(calls()[4][2]).toEqual({ returnToProject: true });
    expect(host.textContent).toContain('Back to your 24 kW array!');
    expect(host.textContent).not.toContain('Concept detour:');
  });

  it('moves on to the next practice question the server sends', async () => {
    const NEXT = { taskId: 'prac-ratio-dust-02', question: 'What is one fourth of 200 W?', unit: 'W' };
    routeApi({
      'POST /api/spark-tutor/session': { session: SESSION, isNew: true, initialMessage: { text: 'Hi' } },
      'POST /api/spark-tutor/session/ses_1/mode': { mode: 'academic_tutor', activeDetour: DETOUR, initialPracticeTask: TASK },
      'POST /api/spark-tutor/session/ses_1/practice/submit': (body) => body.taskId === TASK.taskId
        ? { correct: true, feedback: 'Spot on!', nextTaskId: NEXT.taskId, nextTask: NEXT, readyToReturn: false }
        : { correct: false, feedback: 'Not quite.', readyToReturn: false }
    });
    await render(<SparkCompanion />);
    await click('Ask Spark');
    await click('Academic Tutor');
    await type(host.querySelector('.sk-answer input'), '9');
    await click('Check my answer');
    await click('Next question');
    expect(host.textContent).toContain(NEXT.question);
    expect(host.querySelector('.sk-answer input').value).toBe('');
    await type(host.querySelector('.sk-answer input'), '40');
    await click('Check my answer');
    expect(calls().at(-1)[2]).toEqual({ taskId: NEXT.taskId, answer: '40' });
  });

  it('rests instead of failing when the service is switched off', async () => {
    schoolRequest.mockRejectedValue(apiError(503, 'FEATURE_DISABLED'));
    await render(<SparkCompanion />);
    await click('Ask Spark');
    expect(host.textContent).toContain('Spark is taking a rest');
    expect(host.querySelector('#sk-draft')).toBeNull();
    await click('Close Spark');
    expect(button('Ask Spark (resting)')).toBeTruthy();
  });

  it('asks before sending anything to the coach, then confirms', async () => {
    routeApi({
      'POST /api/spark-tutor/session': { session: SESSION, isNew: true, initialMessage: { text: 'Hello' } },
      'POST /api/spark-tutor/session/ses_1/message': { reply: 'That sounds frustrating.', mode: 'pbl_mentor', assistanceLevel: 'scaffold', recommendCoachEscalation: true },
      'POST /api/spark-tutor/session/ses_1/support-request': { requestId: 'sup_1', status: 'pending', message: 'Your coach has been notified and can see where you are working.' }
    });
    await render(<SparkCompanion />);
    await click('Ask Spark');
    await type(host.querySelector('#sk-draft'), 'This is impossible');
    await click('Send');
    expect(host.textContent).toContain('Would you like your coach to take a look');
    expect(calls().some(([, p]) => p.endsWith('/support-request'))).toBe(false);
    await click('Send to my coach');
    expect(calls().at(-1)).toEqual(['POST', '/api/spark-tutor/session/ses_1/support-request', { question: 'This is impossible', reason: 'FRUSTRATION_DETECTED' }]);
    expect(host.textContent).toContain('Your coach has been notified');
  });

  it('shows the saved conversation when a session resumes', async () => {
    routeApi({
      'POST /api/spark-tutor/session': { session: SESSION, isNew: false, initialMessage: { text: 'Welcome back!' } },
      'GET /api/spark-tutor/session/ses_1/history': { turns: [{ turnId: 't1', userMessage: 'Earlier question', replyText: 'Earlier answer' }] }
    });
    await render(<SparkCompanion />);
    await click('Ask Spark');
    expect(host.textContent).toContain('Earlier question');
    expect(host.textContent).toContain('Welcome back!');
  });
});

describe('SparkReviewDesk', () => {
  const items = [
    { sessionId: 's1', displayName: 'Mia Chen', classId: 'c-wls', mode: 'academic_tutor', assistanceLevel: 'hint', highestAssistanceUsed: 'scaffold', activeDetour: 'ratios_and_proportions', updatedAt: '2026-11-10T04:00:00Z' },
    { sessionId: 's2', displayName: 'Tom Lee', classId: 'c-whs', mode: 'pbl_mentor', assistanceLevel: 'elicit', highestAssistanceUsed: 'elicit', activeDetour: null, updatedAt: '2026-11-09T04:00:00Z' }
  ];

  it('labels AI notes as provisional and shows only server rows for the class in view', async () => {
    schoolRequest.mockResolvedValue({ items });
    await render(<SparkReviewDesk classes={[{ id: 'c-wls', name: 'WLS Grade 7' }]} scope="c-wls" />);
    expect(schoolRequest).toHaveBeenCalledWith('GET', '/api/spark-tutor/coach/summaries');
    expect(host.textContent).toContain('Provisional · Unofficial.');
    expect(host.textContent).toContain('Mia Chen');
    expect(host.textContent).toContain('WLS Grade 7');
    expect(host.textContent).toContain('Ratios & Proportions');
    expect(host.textContent).toContain('Scaffolded');
    expect(host.textContent).not.toContain('Tom Lee');
  });

  it('says Spark is off rather than showing an empty class', async () => {
    schoolRequest.mockRejectedValue(apiError(503, 'FEATURE_DISABLED'));
    await render(<SparkReviewDesk />);
    expect(host.textContent).toContain('Spark is switched off for this school');
  });
});
