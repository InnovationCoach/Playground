// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../src/firebase.js', () => ({ auth: { currentUser: { uid: 'coach' } }, storage: { ref: vi.fn() } }));
vi.mock('../src/services/api/apiClient.js',()=>({schoolRequest:vi.fn()}));
import { schoolRequest } from '../src/services/api/apiClient.js';
import { SchoolLearningPanel } from '../src/features/school/SchoolLearningPanel.jsx';
import { useSchoolResource } from '../src/features/school/useSchoolWorkspace.js';
import { PROGRAM_CATALOGUE } from '../src/features/pbl/content/programCatalogue.js';
let host,root;
const context={role:'teacher',schools:[{id:'school',name:'School',timezone:'Asia/Bangkok'}],classes:[{id:'class',name:'Class',schoolId:'school'}]};
const offerings=PROGRAM_CATALOGUE.map(p=>({id:p.id,programId:p.id,title:p.title,semester:p.semester,yearId:'2026',classIds:['class'],status:'published',revision:1}));
function mockRead(method,path) {
  if(path==='/api/learning-context')return Promise.resolve(context);
  if(path.endsWith('/program-offerings'))return Promise.resolve({items:offerings});
  if(path.endsWith('/lessons')) {
    const p=PROGRAM_CATALOGUE.find(p=>path.includes(p.id));
    return Promise.resolve({items:[{id:'lesson-'+p.id,title:'Lesson for '+p.title,milestoneId:p.milestones[0].id,status:'published',revision:2,classId:'class',outcome:'Outcome',instructions:'Instructions',createdAt:'2026-10-03'}]});
  }
  if(path.endsWith('/learners'))return Promise.resolve({items:[]});
  return Promise.resolve({items:[]});
}
async function render() {await act(async()=>{root.render(<SchoolLearningPanel/>);});}
async function click(text) {await act(async()=>{const button=[...host.querySelectorAll('button')].find(b=>b.textContent===text);expect(button).toBeTruthy();button.click();});}
beforeEach(()=>{globalThis.IS_REACT_ACT_ENVIRONMENT=true;host=document.createElement('div');document.body.append(host);root=createRoot(host);schoolRequest.mockImplementation(mockRead);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.clearAllMocks();delete globalThis.IS_REACT_ACT_ENVIRONMENT;});
describe('Program switching and honest access states',()=>{
  it('replaces lesson and evidence workspaces when switching programs',async()=>{
    await render();
    expect(host.querySelectorAll('.sw-lessons')).toHaveLength(1);
    expect(host.textContent).toContain('Lesson for Sustainable Futures');
    await click('Semester 2District Net-Zero Resilient MicrogridGrades 11–12');
    expect(host.querySelectorAll('.sw-lessons')).toHaveLength(1);
    expect(host.textContent).not.toContain('Lesson for Sustainable Futures');
    expect(host.textContent).toContain('Lesson for District Net-Zero Resilient Microgrid');
    await click('Semester 3Project Arachne — Engineering the Sesame QuadrupedGrades 9–12');
    expect(host.querySelectorAll('.sw-lessons')).toHaveLength(1);
    expect(host.textContent).not.toContain('Lesson for District Net-Zero Resilient Microgrid');
  });
  it('shows failed access as an error without a roster or fake save controls',async()=>{
    schoolRequest.mockRejectedValue(new Error('School access unavailable'));
    await render();
    expect(host.querySelector('[role=alert]').textContent).toBe('School access unavailable');
    expect(host.textContent).not.toContain('No learners');
    expect(host.querySelector('.sw-programs')).toBeNull();
  });
  it('does not offer parents program enrollment or staff editing controls',async()=>{
    schoolRequest.mockImplementation((method,path)=>path==='/api/learning-context'?Promise.resolve({...context,role:'parent'}):mockRead(method,path));
    await act(async()=>root.render(<SchoolLearningPanel initialArea="calendar"/>));
    expect(host.textContent).not.toContain('Add school event');
    expect(host.textContent).toContain('PBL Progress');
    expect(host.textContent).not.toContain('Join program');
    expect(host.textContent).toContain('School events are managed by the admin.');
  });
  it('removes cached records after access is revoked',async()=>{
    function Probe() {const resource=useSchoolResource('/api/private');return <div><p>{resource.data?.secret||'No record'}</p><button onClick={resource.reload}>Refresh private record</button></div>;}
    schoolRequest.mockResolvedValueOnce({secret:'Previously permitted record'}).mockRejectedValueOnce(Object.assign(new Error('Access revoked'),{status:403}));
    await act(async()=>root.render(<Probe/>));expect(host.textContent).toContain('Previously permitted record');
    await click('Refresh private record');expect(host.textContent).not.toContain('Previously permitted record');expect(host.textContent).toContain('No record');
  });

});

describe('Coach lesson media', () => {
  it('shows the upload picker for staff in the selected program', async () => {
    await render();
    const input = host.querySelector('.sw-lessons input[type="file"]');
    expect(input).toBeTruthy();
    expect(input.multiple).toBe(true);
    expect(input.accept).toContain('video/mp4');
  });
  it('renders published images and playable videos for students without an upload picker', async () => {
    schoolRequest.mockImplementation((method, path) => {
      if (path === '/api/learning-context') return Promise.resolve({ ...context, role: 'student' });
      if (path.endsWith('/lessons')) return Promise.resolve({ items: [{ id: 'media-lesson', title: 'Coach instructions', outcome: 'Build', instructions: 'Watch before starting', status: 'published', revision: 2, attachments: [
        { path: 'image', name: 'Example design', contentType: 'image/png', url: 'https://example.com/design.png' },
        { path: 'video', name: 'Demonstration', contentType: 'video/mp4', url: 'https://example.com/demo.mp4' }
      ] }] });
      return mockRead(method, path);
    });
    await render();
    expect(host.querySelector('.sw-lessons img').alt).toBe('Example design');
    expect(host.querySelector('.sw-lessons video').controls).toBe(true);
    expect(host.querySelector('.sw-lessons input[type="file"]')).toBeNull();
  });
});
