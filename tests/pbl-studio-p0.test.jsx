// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PHASES } from '../src/features/pbl/content/pblModel.js';
import { COPILOT_MODES, copilotMode, latestSpark, starterPrompts } from '../src/features/pbl/content/copilotModes.js';
import { copilotContext, copilotRequest, newProject } from '../src/features/pbl/engine/pblProject.js';
import { GoalsInviteBanner, inviteDismissed, inviteStorageKey } from '../src/features/goals/GoalsInviteBanner.jsx';
import { CompetencyChips } from '../src/features/pbl/ProjectJourney.jsx';
import { Copilot } from '../src/features/pbl/Copilot.jsx';
import { CompetencyFramework } from '../src/features/pbl/CompetencyFramework.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root, host;
function mount(element) {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  act(() => root.render(element));
  return host;
}
const unmount = () => { act(() => root?.unmount()); host?.remove(); root = null; };
const button = (name) => [...host.querySelectorAll('button, a')].find((b) => b.textContent.includes(name));
afterEach(() => { unmount(); localStorage.clear(); });

const blank = () => newProject('term-1');
const filled = () => ({ ...blank(), sparks: 'Bees dance\n\n- Why do solar panels get [hot]?', interests: ['Robots'], problem: { ...blank().problem, hmw: 'How might we cool the playground?' } });

describe('co-pilot follows the phase', () => {
  it('has a mode for every phase, and only the build phases write code', () => {
    for (const phase of PHASES) expect(COPILOT_MODES[phase.id], phase.id).toBeTruthy();
    expect(Object.fromEntries(PHASES.map((p) => [p.id, copilotMode(p.id).label]))).toEqual({
      explore: 'Explain / Quiz me', empathise: 'Interview helper', define: 'Problem sharpener', ideate: 'Idea generator',
      prototype: 'Code buddy', test: 'Code buddy', share: 'Pitch coach'
    });
    expect(PHASES.filter((p) => copilotMode(p.id).usesCode).map((p) => p.id)).toEqual(['prototype', 'test']);
    expect(copilotMode('nope').id).toBe('explain');
  });
  it('tells the model the mode on both the main and the fallback route', () => {
    expect(copilotRequest(blank(), 'define', 'x').mode).toBe('problem');
    const explore = copilotContext(blank(), 'explore');
    expect(explore).toContain('Mode: explain and quiz');
    expect(explore).toContain('Do not write code');
    expect(explore).not.toMatch(/MicroPython/);
    expect(copilotContext(blank(), 'prototype')).toContain('Mode: code buddy');
    expect(copilotContext(filled(), 'prototype').length).toBeLessThanOrEqual(800);
  });
  it('hides the language picker until the build phases', () => {
    const props = { project: blank(), apply: () => {}, onLog: () => {}, onSaveCode: () => {} };
    mount(<Copilot phase={PHASES[0]} {...props} />);
    expect(host.querySelector('#pb-lang')).toBeNull();
    expect(host.querySelector('.pb-mode').textContent).toBe('Explain / Quiz me');
    expect(host.textContent).not.toMatch(/MicroPython|brackets/);
    unmount();
    mount(<Copilot phase={PHASES.find((p) => p.id === 'prototype')} {...props} />);
    expect(host.querySelector('#pb-lang')).toBeTruthy();
    expect(host.querySelector('.pb-mode').textContent).toBe('Code buddy');
  });
});

describe('starter chips', () => {
  it('never ask a learner to fill in a blank, with or without their own text', () => {
    for (const phase of PHASES) for (const project of [blank(), filled()]) {
      const starters = starterPrompts(phase.id, project);
      expect(starters.length).toBeGreaterThanOrEqual(3);
      for (const starter of starters) { expect(starter, phase.id).not.toMatch(/[[\]]/); expect(starter).not.toMatch(/undefined|null/); }
    }
  });
  it('use the learner’s own context', () => {
    expect(latestSpark(filled())).toBe('Why do solar panels get hot?');
    expect(latestSpark(blank())).toBe('');
    expect(starterPrompts('explore', filled())[0]).toContain('Why do solar panels get hot?');
    expect(starterPrompts('explore', filled())[1]).toContain('robots');
    expect(starterPrompts('define', filled())[0]).toContain('cool the playground');
  });
  it('fill the question box when clicked, and send nothing by themselves', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));
    mount(<Copilot phase={PHASES[0]} project={filled()} apply={() => {}} onLog={() => {}} onSaveCode={() => {}} />);
    const chip = host.querySelector('.pb-starter');
    act(() => chip.click());
    expect(host.querySelector('#pb-ask').value).toBe(chip.textContent);
    expect(document.activeElement).toBe(host.querySelector('#pb-ask'));
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

describe('goals invitation', () => {
  it('sits in the page and stays gone per learner once dismissed', () => {
    mount(<GoalsInviteBanner uid="mia" />);
    expect(host.querySelector('.gl-invite')).toBeTruthy();
    act(() => button('Not now').click());
    expect(host.querySelector('.gl-invite')).toBeNull();
    expect(inviteDismissed('mia')).toBe(true);
    expect(localStorage.getItem(inviteStorageKey('mia'))).toBe('1');
    unmount();
    mount(<GoalsInviteBanner uid="mia" />);
    expect(host.querySelector('.gl-invite')).toBeNull();
    unmount();
    mount(<GoalsInviteBanner uid="leo" />);
    expect(host.querySelector('.gl-invite')).toBeTruthy();
  });
  it('counts as dismissed when the learner follows it', () => {
    mount(<GoalsInviteBanner uid="mia" />);
    act(() => button('Set my goals').click());
    expect(inviteDismissed('mia')).toBe(true);
  });
  it('still hides for this visit when storage is blocked', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    mount(<GoalsInviteBanner uid="mia" />);
    act(() => button('Not now').click());
    expect(host.querySelector('.gl-invite')).toBeNull();
    spy.mockRestore();
  });
});

describe('competencies', () => {
  it('show learners "I can" wording and no codes; coaches keep codes', () => {
    mount(<CompetencyChips ids={['sdl-01']} />);
    expect(host.textContent).toContain('I can set short-term learning goals');
    expect(host.textContent).not.toContain('1.1.1');
    expect(host.querySelector('svg')).toBeTruthy();
    unmount();
    mount(<CompetencyChips ids={['sdl-01']} showCodes />);
    expect(host.textContent).toContain('1.1.1');
  });
  it('hide codes on the learner competency page', () => {
    mount(<CompetencyFramework project={blank()} />);
    expect(host.querySelector('.pb-code')).toBeNull();
    expect(host.textContent).toContain('I can');
    unmount();
    mount(<CompetencyFramework showIssues />);
    expect(host.querySelector('.pb-code')).toBeTruthy();
  });
});
