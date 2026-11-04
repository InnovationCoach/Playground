// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const space = vi.hoisted(() => ({ current: null }));
vi.mock('../src/features/personalization/usePersonalization.js', () => ({
  usePersonalization: () => space.current,
  uploadLearnerFile: vi.fn(async (uid, file, kind) => ({ path: `learnerMedia/${uid}/x/${file.name}`, name: file.name, contentType: file.type, url: 'https://media.example/t' }))
}));
vi.mock('../src/features/pbl/engine/usePblProject.js', () => ({
  usePblProject: () => ({ project: { evidence: [{ id: 'e1', phase: 'explore', title: 'Spark list', body: 'Three surprises', link: '' }], tasksDone: {} }, apply: vi.fn() })
}));
vi.mock('../src/app/AuthProvider.jsx', () => ({ useAuth: () => ({ user: { uid: 'u1', email: 'akira@welearn.org' }, profile: { displayName: 'Akira', groupName: 'WPR Year 11 Climate' } }) }));
vi.mock('../src/features/shell/useLearnerAvatar.js', () => ({ useLearnerAvatar: () => null, refreshLearnerAvatar: vi.fn() }));
vi.mock('../src/features/shell/ActivitySearch.jsx', () => ({ ActivitySearch: () => null }));
vi.mock('../src/services/api/apiClient.js', () => ({ schoolRequest: vi.fn(async () => ({ ok: true })) }));

import { uploadLearnerFile } from '../src/features/personalization/usePersonalization.js';
import { LocaleProvider } from '../src/app/i18n/LocaleProvider.jsx';
import { JourneyPortfolio } from '../src/features/journey/JourneyPortfolio.jsx';
import { TopNav } from '../src/features/shell/TopNav.jsx';
import { STAGES, kindForFile, titleFromFile, wordCount, groupJourney, stageStatus, journeyProgress, reflectionItem } from '../src/features/journey/journeyModel.js';
import { normalizeItem } from '../src/features/personalization/personalizationModel.js';

let host, root;
function makeSpace(items = []) {
  return {
    loading: false, busy: false, error: '', status: '', saved: { items },
    draft: { items, portfolio: { appearance: { picture: null } }, dashboard: { appearance: { picture: null } } },
    saveItem: vi.fn(async () => true), reload: vi.fn()
  };
}
const render = async (el) => { await act(async () => { root.render(<LocaleProvider>{el}</LocaleProvider>); }); await act(async () => {}); };
const button = (text) => [...host.querySelectorAll('button, a')].find((b) => b.textContent.includes(text));
const type = async (el, value) => { await act(async () => {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set; setter.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}); };

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  localStorage.clear(); uploadLearnerFile.mockClear();
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); document.body.className = ''; delete globalThis.IS_REACT_ACT_ENVIRONMENT; });

describe('journey model', () => {
  it('maps files to portfolio work types', () => {
    expect(kindForFile({ name: 'a.jpg', type: 'image/jpeg' })).toBe('image');
    expect(kindForFile({ name: 'clip.mp4', type: 'video/mp4' })).toBe('recording');
    expect(kindForFile({ name: 'rover.glb', type: '' })).toBe('model');
    expect(kindForFile({ name: 'main.py', type: 'text/x-python' })).toBe('code');
    expect(kindForFile({ name: 'virus.exe', type: 'application/x-msdownload' })).toBeNull();
    expect(titleFromFile('solar_test-2.jpg')).toBe('solar test 2');
    expect(wordCount('  one two\nthree ')).toBe(3);
  });
  it('groups evidence by stage and works out status', () => {
    const items = [
      { id: 'a', phase: 'explore', kind: 'image', title: 'Photo' },
      { id: 'r', phase: 'explore', kind: 'writing', title: 'R', body: 'Learned a lot', phaseReflection: true },
      { id: 'b', phase: 'define', kind: 'writing', title: 'Note', body: 'x' },
      { id: 'c', kind: 'writing', title: 'No stage', body: 'x' }
    ];
    const groups = groupJourney(items, { evidence: [{ id: 's', phase: 'empathise', title: 'Interview' }] });
    expect(groups.explore.evidence.map((i) => i.id)).toEqual(['a']);
    expect(groups.explore.reflection.id).toBe('r');
    expect(stageStatus(groups.explore)).toBe('complete');
    expect(stageStatus(groups.empathise)).toBe('inProgress');
    expect(stageStatus(groups.test)).toBe('notStarted');
    expect(journeyProgress(groups)).toMatchObject({ done: 1, total: 7 });
  });
  it('builds reflection items the server accepts', () => {
    const item = reflectionItem(STAGES[0], '  I learned this.  ', { id: 'r1', revision: 3, audiences: ['coaches'] });
    expect(item).toMatchObject({ id: 'r1', revision: 3, kind: 'writing', body: 'I learned this.', phase: 'explore', phaseReflection: true, audiences: ['coaches'] });
    expect(normalizeItem(item, 'u1')).toMatchObject({ phase: 'explore', phaseReflection: true });
  });
  it('rejects invalid stages and misused reflections on the server model', () => {
    const base = { kind: 'writing', title: 'T', body: 'x', audiences: [] };
    expect(() => normalizeItem({ ...base, phase: 'nowhere' }, 'u1')).toThrow(/stage/);
    expect(() => normalizeItem({ ...base, phaseReflection: true }, 'u1')).toThrow(/stage/);
    expect(() => normalizeItem({ kind: 'image', title: 'T', media: { path: 'learnerMedia/u1/a/p.png', name: 'p.png' }, audiences: [], phase: 'explore', phaseReflection: true }, 'u1')).toThrow();
    expect(normalizeItem({ ...base, phase: 'test' }, 'u1')).toMatchObject({ phase: 'test' });
    expect(normalizeItem(base, 'u1')).not.toHaveProperty('phase');
  });
  it('accepts and normalizes linked competencies', () => {
    const base = { kind: 'writing', title: 'Test evidence', body: 'Reflection body', audiences: [], phase: 'explore' };
    const normalized = normalizeItem({ ...base, competencies: ['sdl-01', 'ctps-01', 'sdl-01', 'invalid!!code'] }, 'u1');
    expect(normalized.competencies).toEqual(['sdl-01', 'ctps-01']);
  });
});

describe('Portfolio maker', () => {
  it('shows every stage, progress and PBL Studio evidence', async () => {
    space.current = makeSpace([]);
    await render(<JourneyPortfolio uid="u1" profile={{ displayName: 'Akira' }} />);
    expect(host.querySelectorAll('.jp-stage')).toHaveLength(7);
    expect(host.textContent).toContain('0 of 7 stages complete');
    expect(host.textContent).toContain('From PBL Studio');
    expect(host.textContent).toContain('Spark list');
    expect(button('Export PDF').getAttribute('href')).toBe('#/journey/print');
  });

  it('saves a stage reflection as a private, stage-tagged item', async () => {
    space.current = makeSpace([]);
    await render(<JourneyPortfolio uid="u1" profile={{ displayName: 'Akira' }} />);
    await type(host.querySelector('.jp-reflection textarea'), 'I noticed the air conditioner runs all day.');
    expect(host.textContent).toContain('8 words');
    await act(async () => { button('Save reflection').click(); });
    expect(space.current.saveItem).toHaveBeenCalledWith(expect.objectContaining({ phase: 'explore', phaseReflection: true, kind: 'writing', audiences: [], body: 'I noticed the air conditioner runs all day.' }));
  });

  it('uploads files into the current stage and refuses unsupported files', async () => {
    space.current = makeSpace([]);
    await render(<JourneyPortfolio uid="u1" profile={{ displayName: 'Akira' }} />);
    const input = host.querySelector('.jp-drop input[type=file]');
    const photo = new File(['x'], 'tally_photo.png', { type: 'image/png' });
    const exe = new File(['x'], 'setup.exe', { type: 'application/x-msdownload' });
    await act(async () => { Object.defineProperty(input, 'files', { value: [photo, exe], configurable: true }); input.dispatchEvent(new Event('change', { bubbles: true })); });
    await act(async () => {});
    expect(uploadLearnerFile).toHaveBeenCalledWith('u1', photo, 'image');
    expect(space.current.saveItem).toHaveBeenCalledWith(expect.objectContaining({ kind: 'image', title: 'tally photo', phase: 'explore', audiences: [], media: { path: 'learnerMedia/u1/x/tally_photo.png', name: 'tally_photo.png' } }));
    expect(uploadLearnerFile).toHaveBeenCalledTimes(1);
    expect(host.querySelector('.jp-error').textContent).toContain('setup.exe');
  });

  it('edits and removes evidence with a confirmation', async () => {
    const item = { id: 'n1', revision: 2, kind: 'writing', title: 'Tally', body: '14 devices', link: '', media: null, audiences: [], phase: 'explore' };
    space.current = makeSpace([item]);
    await render(<JourneyPortfolio uid="u1" profile={{ displayName: 'Akira' }} />);
    await act(async () => { host.querySelector('[aria-label="Remove: Tally"]').click(); });
    expect(host.textContent).toContain('Remove “Tally” from your portfolio?');
    await act(async () => { [...host.querySelectorAll('.jp-btn-danger')][0].click(); });
    expect(space.current.saveItem).toHaveBeenCalledWith(item, true);
  });

  it('renders a printable document and prints it', async () => {
    space.current = makeSpace([
      { id: 'r', phase: 'explore', kind: 'writing', title: 'R', body: 'My reflection', phaseReflection: true },
      { id: 'e1', phase: 'explore', kind: 'image', title: 'Solar Car Pic', body: 'Built chassis', competencies: ['sdl-01', 'ctps-01'], media: { url: 'https://media.example/car.jpg' } }
    ]);
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    await render(<JourneyPortfolio uid="u1" profile={{ displayName: 'Akira' }} printView />);
    expect(host.querySelector('.jd-cover h1').textContent).toBe('Design journey portfolio');
    expect(host.querySelectorAll('.jd-stage')).toHaveLength(7);
    expect(host.textContent).toContain('My reflection');
    expect(host.textContent).toContain('Solar Car Pic');
    expect(host.textContent).toContain('Competency Profile');
    expect(document.body.classList.contains('jp-printing')).toBe(true);
    await act(async () => { button('Print or save as PDF').click(); });
    expect(print).toHaveBeenCalled();
  });

  it('allows attaching an image and linking competencies in evidence form', async () => {
    space.current = makeSpace([]);
    await render(<JourneyPortfolio uid="u1" profile={{ displayName: 'Akira' }} />);
    await act(async () => { button('Add a note or link').click(); });

    // Title and body
    const titleInput = host.querySelector('form.jp-form input[required]');
    await type(titleInput, 'My Robot Prototype');

    // Attach image
    const imageInput = host.querySelector('.jp-form-media input[type=file]');
    const photo = new File(['robot'], 'robot.png', { type: 'image/png' });
    await act(async () => {
      Object.defineProperty(imageInput, 'files', { value: [photo], configurable: true });
      imageInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(uploadLearnerFile).toHaveBeenCalledWith('u1', photo, 'image');

    // Toggle a competency
    const compBtn = host.querySelector('.jp-comp-chip-selectable');
    expect(compBtn).toBeTruthy();
    await act(async () => { compBtn.click(); });
    expect(compBtn.getAttribute('aria-pressed')).toBe('true');

    // Submit form
    await act(async () => { button('Save').click(); });
    expect(space.current.saveItem).toHaveBeenCalledWith(expect.objectContaining({
      title: 'My Robot Prototype',
      kind: 'image',
      competencies: expect.arrayContaining([expect.any(String)]),
      phase: 'explore'
    }));
  });

  it('displays linked competency badges on evidence cards', async () => {
    const item = { id: 'ev1', phase: 'explore', kind: 'image', title: 'Solar Car', body: 'Test run', competencies: ['sdl-01'], media: { url: 'https://media.example/car.jpg' } };
    space.current = makeSpace([item]);
    await render(<JourneyPortfolio uid="u1" profile={{ displayName: 'Akira' }} />);
    expect(host.querySelector('.jp-comp-badge')).toBeTruthy();
    expect(host.querySelector('.jp-comp-badge').textContent).toContain('1.1.1 Goal Setting');
  });
});

describe('Side menu', () => {
  it('groups student links, shows the profile and remembers the collapsed rail', async () => {
    await render(<TopNav role="student" view="journey" onNavigate={() => {}} onOpenGoals={() => {}} onOpenCourses={() => {}} />);
    const groups = [...host.querySelectorAll('.hb-group-label')].map((g) => g.textContent);
    expect(groups).toEqual(['Learn', 'Create', 'Connect']);
    expect(host.querySelector('.hb-link[aria-current="page"]').textContent).toContain('Portfolio maker');
    expect(host.querySelector('.hb-profile').textContent).toContain('Akira');
    expect(host.querySelector('.hb-profile').textContent).toContain('WPR Year 11 Climate');
    await act(async () => { host.querySelector('.hb-collapse').click(); });
    expect(document.body.classList.contains('gh-sidebar-collapsed')).toBe(true);
    expect(localStorage.getItem('gh.sidebar.collapsed')).toBe('1');
  });

  it('opens and closes the phone drawer with an accessible button and Escape', async () => {
    await render(<TopNav role="student" view="home" onNavigate={() => {}} onOpenGoals={() => {}} onOpenCourses={() => {}} />);
    const toggle = host.querySelector('.hb-toggle');
    expect(toggle.getAttribute('aria-label')).toBe('Open menu');
    await act(async () => { toggle.click(); });
    expect(host.querySelector('.hb-sidebar').classList.contains('is-open')).toBe(true);
    await act(async () => { host.querySelector('.hb-sidebar').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
    expect(host.querySelector('.hb-sidebar').classList.contains('is-open')).toBe(false);
  });
});
