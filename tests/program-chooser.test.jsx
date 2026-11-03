// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../src/app/i18n/LocaleProvider.jsx',()=>({useLocale:()=>({locale:'en'})}));
vi.mock('../src/services/api/apiClient.js', () => ({ schoolRequest: vi.fn() }));
import { schoolRequest } from '../src/services/api/apiClient.js';
import { ProgramCatalogueChooser } from '../src/features/school/ProgramCatalogueChooser.jsx';
import { PROGRAM_CATALOGUE } from '../src/features/pbl/content/programCatalogue.js';

let host, root;
const school = { id: 'school-one', name: 'Test School' };
const flush = () => act(async () => { await Promise.resolve(); });

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  schoolRequest.mockReset();
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});

describe('Learner program catalogue chooser', () => {
  it('lists every catalogue program and marks enrolled ones from the offerings API', async () => {
    schoolRequest.mockResolvedValueOnce({ items: [{ id: 'o1', programId: 'net-zero-microgrid', semester: 2, status: 'published', classIds: ['c1'] }] });
    await act(async () => { root.render(<ProgramCatalogueChooser school={school} />); });
    await flush();
    expect(schoolRequest).toHaveBeenCalledWith('GET', '/api/schools/school-one/program-offerings', expect.anything());
    const cards = host.querySelectorAll('.w2e-program');
    expect(cards).toHaveLength(PROGRAM_CATALOGUE.length);
    expect(host.textContent).toContain('Sustainable Futures');
    expect(host.textContent).toContain('Net Zero Microgrid');
    expect(host.textContent).toContain('Project Arachne');
    const enrolled = [...cards].filter(c => c.classList.contains('w2e-program-enrolled'));
    expect(enrolled).toHaveLength(1);
    expect(enrolled[0].textContent).toContain('Net Zero Microgrid');
    expect(enrolled[0].textContent).toContain('Enrolled');
    expect([...cards].filter(c => c.textContent.includes('Class code needed'))).toHaveLength(2);
  });

  it('opens the chosen program through the callback', async () => {
    schoolRequest.mockResolvedValueOnce({ items: [{ id: 'o1', programId: 'sustainable-futures', semester: 1 }] });
    const onChooseProgram = vi.fn();
    await act(async () => { root.render(<ProgramCatalogueChooser school={school} onChooseProgram={onChooseProgram} />); });
    await flush();
    const open = [...host.querySelectorAll('button')].find(b => b.textContent.includes('Open program'));
    await act(async () => { open.click(); });
    expect(onChooseProgram).toHaveBeenCalledWith('sustainable-futures');
  });

  it('joins a program with a class code through the existing endpoint and reloads', async () => {
    schoolRequest.mockResolvedValueOnce({ items: [] });
    schoolRequest.mockResolvedValueOnce({ title: 'Project Arachne', alreadyEnrolled: false });
    schoolRequest.mockResolvedValueOnce({ items: [{ id: 'o3', programId: 'project-arachne', semester: 3 }] });
    const onJoined = vi.fn();
    await act(async () => { root.render(<ProgramCatalogueChooser school={school} onJoined={onJoined} />); });
    await flush();
    const arachne = [...host.querySelectorAll('.w2e-program')].find(c => c.textContent.includes('Project Arachne'));
    const joinBtn = [...arachne.querySelectorAll('button')].find(b => b.textContent.includes('Join with class code'));
    await act(async () => { joinBtn.click(); });
    const input = arachne.querySelector('input');
    expect(input).toBeTruthy();
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'ARACHNE-2026');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => { arachne.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    await flush();
    expect(schoolRequest).toHaveBeenCalledWith('POST', '/api/program-enrollments/join', { body: { code: 'ARACHNE-2026' } });
    expect(onJoined).toHaveBeenCalled();
    expect(host.textContent).toContain('Joined Project Arachne');
    expect(arachne.classList.contains('w2e-program-enrolled')).toBe(true);
  });

  it('shows a service error when the code is rejected and keeps the program unenrolled', async () => {
    schoolRequest.mockResolvedValueOnce({ items: [] });
    schoolRequest.mockRejectedValueOnce(Object.assign(new Error('This code is invalid, expired or disabled.'), { status: 404, code: 'This code is invalid, expired or disabled.' }));
    await act(async () => { root.render(<ProgramCatalogueChooser school={school} />); });
    await flush();
    const card = [...host.querySelectorAll('.w2e-program')].find(c => c.textContent.includes('Net Zero Microgrid'));
    await act(async () => { [...card.querySelectorAll('button')].find(b => b.textContent.includes('Join with class code')).click(); });
    const input = card.querySelector('input');
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'BAD');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => { card.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    await flush();
    expect(card.querySelector('[role="alert"]').textContent).toContain('invalid, expired or disabled');
    expect(card.classList.contains('w2e-program-enrolled')).toBe(false);
  });
  it('includes a coach-created program returned by authorized enrollment',async()=>{
    const definition={id:'custom-grid',title:'Microgrid makers',drivingQuestion:'How can clean power stay available?',semester:2,gradeBand:'Coach-created program',milestones:[{id:'explore'}]};
    schoolRequest.mockResolvedValue({items:[{id:'offering-grid',programId:'custom-grid',programDefinition:definition}]});
    const onChooseProgram=vi.fn();await act(async()=>root.render(<ProgramCatalogueChooser school={school} onChooseProgram={onChooseProgram}/>));
    const card=[...host.querySelectorAll('.w2e-program')].find(el=>el.textContent.includes('Microgrid makers'));
    expect(card).toBeTruthy();expect(card.textContent).toContain('Enrolled');
    await act(async()=>card.querySelector('button').click());expect(onChooseProgram).toHaveBeenCalledWith('custom-grid');
  });

});
