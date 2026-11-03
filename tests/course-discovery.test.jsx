// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../src/services/api/apiClient.js', () => ({ schoolRequest: vi.fn() }));
import { schoolRequest } from '../src/services/api/apiClient.js';
import { CourseDiscovery } from '../src/features/courses/CourseDiscovery.jsx';
import { LiveCourseDiscovery } from '../src/features/courses/LiveCourseDiscovery.jsx';
import { discoveryCatalog, filterDiscovery } from '../src/features/courses/discoveryModel.js';
import { discoverySample } from './pathway-preview/discoveryFixtures.js';
import { FRAMEWORK_VERSION } from '../src/features/quest/pathwayModel.js';

let host, root;
const button = text => [...host.querySelectorAll('button')].find(b => b.textContent.trim() === text);
const click = async text => act(async () => button(text).click());
const render = async element => act(async () => root.render(element));
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.resetAllMocks(); delete globalThis.IS_REACT_ACT_ENVIRONMENT; });

describe('Unified course discovery', () => {
  it('searches real program titles as well as activities without inventing enrollment or readiness', () => {
    const catalog = discoveryCatalog();
    expect(filterDiscovery(catalog, { query: 'arachne' })[0].programId).toBe('project-arachne');
    expect(filterDiscovery(catalog, { query: 'python' }).some(c => c.activityId === 'coding')).toBe(true);
    expect(catalog.every(c => c.readiness === 'unknown')).toBe(true);
    expect(catalog.find(c => c.programId)?.availability).toContain('Ask your coach');
  });
  it('combines source, topic and format filters rather than leaking unrelated results', () => {
    const found = filterDiscovery(discoverySample.items, { source: 'external', topic: 'Robotics', kind: 'Course' });
    expect(found).toHaveLength(1); expect(found[0].id).toBe('external:robot');
  });
  it('shows external examples distinctly and opens an honest detail view', async () => {
    await render(<CourseDiscovery {...discoverySample} preview externalAvailable />);
    await click('External');
    expect(host.querySelectorAll('.cd-course-card')).toHaveLength(3);
    await act(async () => host.querySelector('.cd-course-card h3 button').click());
    expect(host.querySelector('dialog[open]').textContent).toContain('fictional course');
    expect(host.querySelector('dialog a')).toBeNull();
  });
  it('keeps platform browsing useful when external search is unavailable', async () => {
    await render(<CourseDiscovery items={discoveryCatalog()} />);
    await click('External'); expect(host.textContent).toContain('External course search isn’t available yet');
    await click('Explore WeLearn'); expect(host.querySelectorAll('.cd-course-card').length).toBeGreaterThan(3);
  });
  it('preserves course details on a failed canonical quest save and reports no success', async () => {
    const choose = vi.fn(async () => { throw new Error('Your achievements changed. Refresh before choosing.'); });
    await render(<CourseDiscovery {...discoverySample} onChooseQuest={choose} />);
    await act(async () => host.querySelector('.cd-suggestion').click()); await click('Choose this quest');
    expect(choose).toHaveBeenCalledWith(expect.objectContaining({ recommendationId: 'sample:energy-plan' }));
    expect(host.querySelector('dialog[open] [role=alert]').textContent).toContain('achievements changed');
    expect(host.querySelector('.cd-toast')).toBeNull();
  });
  it('clears prior learner achievements when switching accounts', async () => {
    schoolRequest.mockImplementation(async (_method, path) => {
      if (path === '/api/learning-context') return { schools: [{ id: 'school' }], classes: [{ id: 'class', schoolId: 'school' }] };
      if (path.includes('/one/pathway')) return { achievements: [{ competencyId: 'sdl-01', state: 'confirmed', frameworkVersion: FRAMEWORK_VERSION }], recommendations: [] };
      if (path.includes('/two/pathway')) throw Object.assign(new Error('Access denied'), { status: 403 });
      return { items: [] };
    });
    await render(<LiveCourseDiscovery uid="one" classIds={['class']} />);
    expect(host.textContent).toContain('Goal Setting');
    await render(<LiveCourseDiscovery uid="two" classIds={['class']} />);
    expect(host.textContent).not.toContain('Goal Setting');
    expect(host.textContent).toContain('personalized suggestions couldn’t load');
  });
});
