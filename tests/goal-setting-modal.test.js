// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createGoalSettingModal } from '../src/components/Goals/GoalSettingModal.js';
let voice;
class FakeRecognition {
  constructor() { voice = this; }
  start = vi.fn();
  abort = vi.fn();
}
const click = selector => document.querySelector(selector).click();
const fill = (selector, value) => { document.querySelector(selector).value = value; };
beforeEach(() => { document.body.innerHTML = '<button id="launch">Set goals</button>'; document.getElementById('launch').focus(); localStorage.clear(); });
afterEach(() => { document.getElementById('goal-setting-modal')?.dispatchEvent(new Event('closeGoalSetting')); delete window.SpeechRecognition; delete window.speechSynthesis; delete window.SpeechSynthesisUtterance; vi.restoreAllMocks(); });
describe('open-ended goal setting', () => {
  it('validates, reviews and saves custom interests and pending goals without requiring presets', () => {
    const saved = vi.fn(); window.addEventListener('goalsSet', saved, { once: true });
    createGoalSettingModal('learner');
    click('.goal-btn-next');
    expect(document.querySelector('.goal-status').textContent).toContain('Share an idea');
    fill('#goal-topic', 'How can music tell a story?'); click('.goal-btn-next');
    fill('#goal-input', '<img src=x onerror=alert(1)> Make a song'); click('.goal-btn-next');
    expect(document.querySelector('.goal-review-list').textContent).toContain('<img');
    expect(document.querySelector('.goal-review-list img')).toBeNull();
    fill('#goal-days', '0'); click('.goal-btn-next');
    expect(saved).not.toHaveBeenCalled();
    fill('#goal-days', '21'); click('.goal-btn-next');
    expect(saved.mock.calls[0][0].detail).toMatchObject({ learningPath: 'custom', topic: 'How can music tell a story?', durationDays: 21, goals: ['<img src=x onerror=alert(1)> Make a song'] });
    expect(JSON.parse(localStorage.getItem('userGoals_learner')).completedGoals).toEqual([]);
    expect(document.activeElement.id).toBe('launch');
    expect(document.body.style.overflow).toBe('');
  });
  it('preserves answers across steps, removes goals and dismisses without saving', () => {
    createGoalSettingModal('learner'); fill('#goal-topic', 'Make art'); click('.goal-btn-next');
    fill('#goal-input', 'Try painting'); click('.goal-add-btn');
    click('.goals-list button'); expect(document.querySelector('.goals-list').children).toHaveLength(0);
    fill('#goal-input', 'Try drawing'); click('.goal-btn-back');
    expect(document.getElementById('goal-topic').value).toBe('Make art');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(document.getElementById('goal-setting-modal')).toBeNull();
    expect(localStorage.getItem('userGoals_learner')).toBeNull();
  });
  it('contains keyboard focus and shows a usable fallback without speech support', () => {
    createGoalSettingModal();
    expect(document.querySelector('[role="dialog"]').getAttribute('aria-modal')).toBe('true');
    expect(document.querySelector('.goal-dictate').disabled).toBe(true);
    document.querySelector('.goal-btn-next').focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(document.activeElement.className).toBe('goal-modal-close');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
    expect(document.activeElement.className).toBe('goal-btn-next');
  });
  it('transcribes into editable answers and aborts listening on navigation and close', () => {
    window.SpeechRecognition = FakeRecognition;
    createGoalSettingModal(); fill('#goal-topic', 'I wonder'); click('.goal-dictate');
    voice.onresult({ resultIndex: 0, results: [Object.assign([{ transcript: 'how birds fly' }], { isFinal: true })] });
    expect(document.getElementById('goal-topic').value).toBe('I wonder how birds fly');
    click('.goal-btn-next'); expect(voice.abort).toHaveBeenCalledOnce();
    click('.goal-dictate'); const active = voice;
    click('.goal-modal-close'); expect(active.abort).toHaveBeenCalledOnce();
    expect(active.onresult).toBeNull();
  });
  it('lets learners rewrite art ideas and preserves Thai dictation selection', () => {
    window.SpeechRecognition = FakeRecognition;
    createGoalSettingModal('learner'); click('[data-idea="art"]');
    expect(document.getElementById('goal-topic').value).toContain('art');
    fill('#goal-topic', 'Tell a story through art');
    document.getElementById('goal-topic').dispatchEvent(new Event('input'));
    document.querySelector('.goal-language select').value = 'th-TH';
    click('.goal-btn-next'); click('.goal-dictate');
    expect(voice.lang).toBe('th-TH');
    voice.onresult({ resultIndex: 0, results: [Object.assign([{ transcript: 'ลองวาดภาพ' }], { isFinal: true })] });
    voice.onend();
    expect(document.querySelector('.goal-status').textContent).toContain('Review and edit');
    expect(document.getElementById('goal-input').value).toBe('ลองวาดภาพ');
    click('.goal-btn-next'); click('.goal-btn-next');
    expect(JSON.parse(localStorage.getItem('userGoals_learner'))).toMatchObject({ learningPath: 'custom', goals: ['ลองวาดภาพ'] });
  });
  it('explains denied microphone access and allows typing after voice failure', () => {
    window.SpeechRecognition = FakeRecognition;
    createGoalSettingModal(); click('.goal-dictate');
    voice.onerror({ error: 'not-allowed' });
    expect(document.querySelector('.goal-status').textContent).toContain('Microphone access was not allowed');
    expect(document.querySelector('.goal-dictate').getAttribute('aria-pressed')).toBe('false');
    fill('#goal-topic', 'Build a robot'); click('.goal-btn-next');
    expect(document.querySelector('.goal-step-count').textContent).toBe('Step 2 of 3');
  });
  it('reads prompts only on request and cancels speech when dismissed', () => {
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    window.speechSynthesis = { speak: vi.fn(), cancel: vi.fn() };
    createGoalSettingModal(); expect(window.speechSynthesis.speak).not.toHaveBeenCalled();
    click('.goal-read'); expect(window.speechSynthesis.speak.mock.calls[0][0].text).toContain('What would you love to explore');
    click('.goal-modal-close'); expect(window.speechSynthesis.cancel).toHaveBeenCalledOnce();
  });
});
