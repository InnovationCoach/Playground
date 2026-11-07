// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PHASES } from '../src/features/pbl/content/pblModel.js';
import { COPILOT_MODES, copilotMode, latestSpark, starterPrompts } from '../src/features/pbl/content/copilotModes.js';
import { addEvidence, addProof, copilotContext, copilotRequest, hydrateProject, newProject, nextStep, phaseProgress, taskState, toggleTask } from '../src/features/pbl/engine/pblProject.js';
import { GoalsInviteBanner, inviteDismissed, inviteStorageKey } from '../src/features/goals/GoalsInviteBanner.jsx';
import { CompetencyChips, ProjectJourney, rankedActivities } from '../src/features/pbl/ProjectJourney.jsx';
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

describe('P1: next step and proof', () => {
  const T = 'term-1', PH = 'explore';
  const tick = (p, ...ids) => ids.reduce((x, i) => toggleTask(x, PH, i), p);
  const proof = (p, i) => addProof(p, PH, i, { how: 'text', text: 'I did it' }).project;
  it('picks the first task not done, then the first without proof, then finishes', () => {
    let p = newProject(T);
    expect(nextStep(p, PH)).toMatchObject({ type: 'task', index: 0 });
    p = tick(p, 0);
    expect(nextStep(p, PH)).toMatchObject({ type: 'task', index: 1 });
    p = tick(p, 1, 2);
    expect(nextStep(p, PH)).toMatchObject({ type: 'proof', index: 0 });
    p = proof(proof(proof(p, 0), 1), 2);
    expect(nextStep(p, PH)).toEqual({ type: 'done' });
  });
  it('shows a task as fully complete only with its own proof', () => {
    let p = newProject(T);
    expect(taskState(p, PH, 0)).toBe('todo');
    p = tick(p, 0);
    expect(taskState(p, PH, 0)).toBe('needs-proof');
    const other = addEvidence(p, { phase: PH, kind: 'note', title: 'General note', competencies: [] }).project;
    expect(taskState(other, PH, 0)).toBe('needs-proof');
    expect(taskState(proof(p, 0), PH, 0)).toBe('complete');
  });
  it('proving a task ticks it, and needs a sentence or a link', () => {
    const p = newProject(T);
    expect(addProof(p, PH, 0, { how: 'text', text: '  ' }).error).toBeTruthy();
    expect(addProof(p, PH, 0, { how: 'link', link: '' }).error).toBeTruthy();
    expect(addProof(p, PH, 0, { how: 'link', link: 'javascript:alert(1)' }).error).toBeTruthy();
    expect(addProof(p, PH, 99, { how: 'text', text: 'x' }).error).toBeTruthy();
    const done = addProof(p, PH, 1, { how: 'link', link: 'https://example.org/photo' }).project;
    expect(done.tasksDone[PH]).toEqual([1]);
    expect(done.evidence[0]).toMatchObject({ phase: PH, task: 1, kind: 'media', link: 'https://example.org/photo' });
  });
  it('keeps existing records and progress exactly as they were', () => {
    const ticked = tick(newProject(T), 0, 1, 2);
    const old = addEvidence(ticked, { phase: PH, kind: 'note', title: 'Old entry with no task', competencies: [] }).project;
    expect(phaseProgress(old, PH).complete).toBe(true);
    expect(old.evidence[0]).not.toHaveProperty('task');
    const reloaded = hydrateProject(JSON.parse(JSON.stringify(proof(ticked, 0))), T);
    expect(reloaded.evidence[0].task).toBe(0);
    const bad = hydrateProject({ ...JSON.parse(JSON.stringify(old)), evidence: [{ id: 'e', title: 't', phase: PH, kind: 'note', task: 'x' }] }, T);
    expect(bad.evidence[0]).not.toHaveProperty('task');
  });
  it('ranks activities by interest and says why', () => {
    const none = rankedActivities([]);
    expect(none.every((a) => a.because === null)).toBe(true);
    const ranked = rankedActivities(['Robots']);
    expect(ranked).toHaveLength(none.length);
    expect(ranked[0].because).toBe('Robots');
    const lastMatch = ranked.map((a) => !!a.because).lastIndexOf(true), firstOther = ranked.findIndex((a) => !a.because);
    if (firstOther >= 0) expect(lastMatch).toBeLessThan(firstOther);
  });
});

describe('P1: the phase page', () => {
  Element.prototype.scrollIntoView ??= function scrollIntoView() {};
  function Harness({ start }) {
    const [project, setProject] = React.useState(start);
    return <ProjectJourney project={project} apply={(fn) => setProject(fn)} onOpenActivity={() => {}} />;
  }
  const page = (start = newProject('term-1')) => mount(<Harness start={start} />);
  const nextTitle = () => host.querySelector('#pb-next-title').textContent;
  const type = (el, value) => act(() => {
    Object.getOwnPropertyDescriptor(el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value').set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  it('shows one path with You are here, and the full task list collapsed', () => {
    page();
    expect(host.querySelectorAll('.pb-steps')).toHaveLength(1);
    expect(host.querySelectorAll('.pb-here')).toHaveLength(1);
    expect(host.querySelector('.pb-step[aria-current="step"]').textContent).toContain('You are here');
    expect(nextTitle()).toContain('Complete at least two STEAM activities');
    const all = host.querySelector('details.pb-all-tasks');
    expect(all.open).toBe(false);
    expect(all.querySelector('summary').textContent).toBe('See all Explore tasks');
    expect(all.querySelectorAll('.pb-proof-btn')).toHaveLength(3);
  });
  it('puts interests before the tasks in Explore only', () => {
    page();
    const col = host.querySelector('.pb-col');
    expect(col.firstElementChild.classList.contains('pb-interests')).toBe(true);
    act(() => [...host.querySelectorAll('.pb-step')][1].click());
    expect(host.querySelector('.pb-interests')).toBeNull();
  });
  it('moves from done to proof to the next step', () => {
    page();
    act(() => button('I’ve done this').click());
    const area = host.querySelector('.pb-next textarea');
    expect(area).toBeTruthy();
    type(area, 'I tried two activities');
    act(() => host.querySelector('.pb-next form').requestSubmit());
    expect(nextTitle()).toContain('three "sparks"');
    expect(host.querySelector('.pb-task-complete').textContent).toContain('Done with proof');
  });
  it('shows a softer state when ticked without proof', () => {
    page();
    act(() => host.querySelector('.pb-task input').click());
    expect(host.querySelector('.pb-task-state').textContent).toBe('Done, add proof');
  });
  it('celebrates a finished phase only after the learner finishes it', () => {
    const almost = addProof(addProof(newProject('term-1'), 'explore', 0, { how: 'text', text: 'a' }).project, 'explore', 1, { how: 'text', text: 'b' }).project;
    page(almost);
    expect(host.querySelector('.pb-cele')).toBeNull();
    act(() => button('I’ve done this').click());
    type(host.querySelector('.pb-next textarea'), 'c');
    act(() => host.querySelector('.pb-next form').requestSubmit());
    expect(host.querySelector('.pb-cele').textContent).toContain('Explore badge earned');
    expect(host.querySelector('.pb-cele').getAttribute('role')).toBe('status');
    expect(host.querySelector('.pb-cele button[aria-label]')).toBeTruthy();
    expect([...host.querySelectorAll('button, a')].filter((b) => b.textContent.includes('Go to Empathise'))).toHaveLength(1);
    unmount();
    const finished = addProof(almost, 'explore', 2, { how: 'text', text: 'c' }).project;
    page(finished);
    expect(host.querySelector('.pb-cele')).toBeNull();
    expect(nextTitle()).toBe('You finished Explore');
  });
  it('offers three ways out when stuck, and asks nothing by itself', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));
    page();
    act(() => button('Stuck?').click());
    const options = [...host.querySelectorAll('.pb-stuck-option')];
    expect(options.map((o) => o.querySelector('strong').textContent)).toEqual(['Ask AI', 'Ask my coach', 'See an example']);
    expect(options[1].getAttribute('href')).toBe('#/messages');
    act(() => options[0].click());
    expect(host.querySelector('#pb-ask').value).toContain('Complete at least two STEAM activities');
    expect(host.querySelector('#pb-ask').value).not.toMatch(/[[\]]/);
    expect(fetchSpy).not.toHaveBeenCalled();
    act(() => options[2].click());
    expect(host.querySelector('.pb-stuck-example').textContent).toContain('A spark list');
    act(() => [...host.querySelectorAll('.pb-step')][1].click());
    expect(host.querySelector('#pb-ask').value).toBe('');
    act(() => [...host.querySelectorAll('.pb-step')][0].click());
    act(() => button('Stuck?').click());
    act(() => [...host.querySelectorAll('.pb-stuck-option')][2].click());
    expect(host.querySelector('.pb-stuck-example').textContent).toContain('A spark list');
    fetchSpy.mockRestore();
  });
  it('keeps the coach view read-only, with no next step or proof', () => {
    mount(<ProjectJourney readOnly />);
    expect(host.querySelector('.pb-next')).toBeNull();
    expect(host.querySelector('.pb-proof-btn')).toBeNull();
    expect(host.querySelector('.pb-here')).toBeNull();
    expect(host.querySelector('.pb-code')).toBeTruthy();
    expect(host.textContent).toContain('Weeks 1–3');
  });
});
