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

import { uploadLearnerFile } from '../src/features/personalization/usePersonalization.js';
import { LocaleProvider } from '../src/app/i18n/LocaleProvider.jsx';
import { JourneyPortfolio } from '../src/features/journey/JourneyPortfolio.jsx';
import { menuFor } from '../src/features/shell/Sidebar.jsx';
import { STAGES, kindForFile, titleFromFile, wordCount, groupJourney, stageStatus, journeyProgress, reflectionItem, stageCompetencyCoverage } from '../src/features/journey/journeyModel.js';
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
  it('links evidence only to the competencies listed for its stage', () => {
    const base = { kind: 'writing', title: 'Spark list', body: 'x', audiences: [], phase: 'explore' };
    expect(normalizeItem({ ...base, competencies: ['sdl-05', 'ct-11', 'sdl-05'] }, 'u1').competencies).toEqual(['sdl-05', 'ct-11']);
    expect(normalizeItem({ ...base, competencies: [] }, 'u1').competencies).toEqual([]);
    expect(normalizeItem(base, 'u1')).not.toHaveProperty('competencies');
    expect(() => normalizeItem({ ...base, competencies: ['ec-05'] }, 'u1')).toThrow(/this stage/);
    expect(() => normalizeItem({ ...base, competencies: 'sdl-05' }, 'u1')).toThrow();
    expect(() => normalizeItem({ ...base, phase: undefined, competencies: ['sdl-05'] }, 'u1')).toThrow(/this stage/);
    expect(() => normalizeItem({ ...base, phaseReflection: true, competencies: ['sdl-05'] }, 'u1')).toThrow(/this stage/);
  });
  it('counts linked evidence per stage competency, uploads and PBL Studio alike', () => {
    const explore = STAGES[0];
    const groups = groupJourney(
      [{ id: 'a', phase: 'explore', kind: 'image', title: 'P', competencies: ['sdl-05', 'ctps-03'] }, { id: 'b', phase: 'explore', kind: 'writing', title: 'N', body: 'x', competencies: ['sdl-05', 'ct-11'] }],
      { evidence: [{ id: 's', phase: 'explore', title: 'Spark', competencies: ['sdl-05', 'ec-05'] }] }
    );
    const cov = stageCompetencyCoverage(explore, groups.explore);
    expect(cov.counts).toMatchObject({ 'sdl-05': 3, 'ctps-03': 1, 'ct-11': 1, 'ctps-01': 0 });
    expect(cov.counts).not.toHaveProperty('ec-05');
    expect(cov).toMatchObject({ core: 2, coreTotal: 5 });
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

  it('shows the stage competencies with how much evidence each has', async () => {
    space.current = makeSpace([{ id: 'n1', revision: 1, kind: 'writing', title: 'Tally', body: '14', link: '', media: null, audiences: [], phase: 'explore', competencies: ['ctps-03'] }]);
    await render(<JourneyPortfolio uid="u1" profile={{ displayName: 'Akira' }} />);
    const cov = host.querySelector('.jp-covwrap');
    expect(cov.textContent).toContain('1 of 5 have evidence');
    expect(cov.textContent).toContain('1.1.5Learning Curiosity');
    expect(cov.textContent).toContain('Stretch (advanced)');
    expect(host.querySelector('.jp-cov[data-has]').textContent).toContain('Data Interpretation');
    expect(host.querySelector('.jp-linked').textContent).toContain('Data Interpretation');
  });

  it('lets a learner tick competencies on existing evidence and saves them', async () => {
    const item = { id: 'n1', revision: 2, kind: 'image', title: 'Photo', body: '', link: '', media: { path: 'learnerMedia/u1/a/p.png', name: 'p.png' }, audiences: [], phase: 'explore' };
    space.current = makeSpace([item]);
    await render(<JourneyPortfolio uid="u1" profile={{ displayName: 'Akira' }} />);
    expect(host.textContent).toContain('Not linked to a competency yet.');
    await act(async () => { host.querySelector('[aria-label="Link competencies: Photo"]').click(); });
    const boxes = [...host.querySelectorAll('.jp-comp-check input')];
    expect(boxes).toHaveLength(6);
    await act(async () => { boxes[0].click(); boxes[5].click(); });
    await act(async () => { button('Save links').click(); });
    expect(space.current.saveItem).toHaveBeenCalledWith({ ...item, competencies: ['sdl-05', 'ct-11'] });
  });

  it('includes the competency checklist when adding a note', async () => {
    space.current = makeSpace([]);
    await render(<JourneyPortfolio uid="u1" profile={{ displayName: 'Akira' }} />);
    await act(async () => { button('Add a note or link').click(); });
    await type(host.querySelector('.jp-form input'), 'Spark list');
    await type(host.querySelector('.jp-form textarea'), 'Three surprises');
    await act(async () => { host.querySelectorAll('.jp-comp-check input')[1].click(); });
    await act(async () => { host.querySelector('.jp-form button[type=submit]').click(); });
    expect(space.current.saveItem).toHaveBeenCalledWith(expect.objectContaining({ title: 'Spark list', phase: 'explore', competencies: ['ctps-01'] }));
  });

  it('renders a printable document and prints it', async () => {
    space.current = makeSpace([{ id: 'r', phase: 'explore', kind: 'writing', title: 'R', body: 'My reflection', phaseReflection: true }]);
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    await render(<JourneyPortfolio uid="u1" profile={{ displayName: 'Akira' }} printView />);
    expect(host.querySelector('.jd-cover h1').textContent).toBe('Design journey portfolio');
    expect(host.querySelectorAll('.jd-stage')).toHaveLength(7);
    expect(host.textContent).toContain('My reflection');
    expect(host.textContent).toContain('No reflection written yet.');
    expect(host.querySelector('.jd-cov').textContent).toContain('1.1.5 Learning Curiosity');
    expect(document.body.classList.contains('jp-printing')).toBe(true);
    await act(async () => { button('Print or save as PDF').click(); });
    expect(print).toHaveBeenCalled();
  });
});

describe('Side menu', () => {
  it('lists My space and the portfolio maker under Create for students', () => {
    const create = menuFor('student', { onOpenGoals() {}, onOpenCourses() {}, onNavigate() {} }).find((g) => g.label === 'nav.groupCreate');
    expect(create.items.map((i) => i.href)).toEqual(['#/space', '#/journey']);
  });
});
