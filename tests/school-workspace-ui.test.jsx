// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../src/app/i18n/LocaleProvider.jsx',()=>({useLocale:()=>({locale:'en'})}));
vi.mock('../src/firebase.js', () => ({ auth: { currentUser: { uid: 'coach' } }, storage: { ref: vi.fn() } }));
vi.mock('../src/services/api/apiClient.js',()=>({schoolRequest:vi.fn()}));
import { schoolRequest } from '../src/services/api/apiClient.js';
import { SchoolLearningPanel } from '../src/features/school/SchoolLearningPanel.jsx';
import { useSchoolResource } from '../src/features/school/useSchoolWorkspace.js';
import { PROGRAM_CATALOGUE } from '../src/features/pbl/content/programCatalogue.js';
import { storage } from '../src/firebase.js';
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
    expect(host.textContent).toContain('School events are managed by coaches and the admin.');
  });
  it('leaves suspended and archived learners out of the coach learner pickers',async()=>{
    const learners={items:[{id:'ann',displayName:'Ann Active',classIds:['class'],status:'active'},{id:'pat',displayName:'Pat Pending',classIds:['class']},{id:'sam',displayName:'Sam Suspended',classIds:['class'],status:'suspended'},{id:'arc',displayName:'Arlo Archived',classIds:['class'],status:'archived'}]};
    schoolRequest.mockImplementation((method,path)=>path.endsWith('/learners')?Promise.resolve(learners):mockRead(method,path));
    for (const area of ['goals','academic']) {
      await act(async()=>root.render(<SchoolLearningPanel key={area} initialArea={area}/>));
      const names=[...host.querySelectorAll('select option')].map(o=>o.textContent);
      expect(names).toContain('Ann Active');
      expect(names).toContain('Pat Pending');
      expect(names).not.toContain('Sam Suspended');
      expect(names).not.toContain('Arlo Archived');
    }
  });
  it('removes cached records after access is revoked',async()=>{
    function Probe() {const resource=useSchoolResource('/api/private');return <div><p>{resource.data?.secret||'No record'}</p><button onClick={resource.reload}>Refresh private record</button></div>;}
    schoolRequest.mockResolvedValueOnce({secret:'Previously permitted record'}).mockRejectedValueOnce(Object.assign(new Error('Access revoked'),{status:403}));
    await act(async()=>root.render(<Probe/>));expect(host.textContent).toContain('Previously permitted record');
    await click('Refresh private record');expect(host.textContent).not.toContain('Previously permitted record');expect(host.textContent).toContain('No record');
  });

});

describe('Coach lesson media', () => {
  it('uploads program slides with explicit metadata and saves them to the selected program', async () => {
    schoolRequest.mockImplementation((method,path,options)=>{
      if(method==='PATCH' && path.endsWith('/media'))return Promise.resolve({saved:true,revision:2});
      if(path.endsWith('/program-offerings'))return Promise.resolve({items:[{...offerings[0],createdBy:'coach'}]});
      return mockRead(method,path);
    });
    const put=vi.fn(()=>({on:(_event,progress,_reject,resolve)=>{progress({bytesTransferred:4,totalBytes:4});resolve();}}));
    storage.ref.mockReturnValue({put});
    await render();
    const input=host.querySelector('.sw-program-resources input[type=file]');
    Object.defineProperty(input,'files',{value:[new File(['PDF!'],'Intro.pdf',{type:''})]});
    await act(async()=>input.dispatchEvent(new Event('change',{bubbles:true})));
    await act(async()=>host.querySelector('.sw-program-resources form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
    expect(put).toHaveBeenCalledWith(expect.any(File),{contentType:'application/pdf'});
    expect(storage.ref).toHaveBeenCalledWith(expect.stringMatching(/^programMedia\/school\/sustainable-futures\/coach\//));
    expect(schoolRequest).toHaveBeenCalledWith('PATCH','/api/schools/school/program-offerings/sustainable-futures/media',{body:{revision:1,attachments:[expect.objectContaining({name:'Intro.pdf',contentType:'application/pdf',size:4})]}});
  });
  it('shows the upload picker for staff in the selected program', async () => {
    await render();
    const input = host.querySelector('.sw-lessons input[type="file"]');
    expect(input).toBeTruthy();
    expect(input.multiple).toBe(true);
    expect(input.accept).toContain('video/mp4');
    expect(input.accept).toContain('application/pdf');
    expect(input.accept).toContain('.pptx');
  });
  it('renders published images and playable videos for students without an upload picker', async () => {
    schoolRequest.mockImplementation((method, path) => {
      if (path === '/api/learning-context') return Promise.resolve({ ...context, role: 'student' });
      if (path.endsWith('/lessons')) return Promise.resolve({ items: [{ id: 'media-lesson', title: 'Coach instructions', outcome: 'Build', instructions: 'Watch before starting', status: 'published', revision: 2, attachments: [
        { path: 'image', name: 'Example design', contentType: 'image/png', url: 'https://example.com/design.png' },
        { path: 'video', name: 'Demonstration', contentType: 'video/mp4', url: 'https://example.com/demo.mp4' },
        { path: 'pdf', name: 'Lesson slides.pdf', contentType: 'application/pdf', url: 'https://example.com/slides.pdf' },
        { path: 'pptx', name: 'Presentation.pptx', contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', url: 'https://example.com/slides.pptx' }
      ] }] });
      return mockRead(method, path);
    });
    await render();
    expect(host.querySelector('.sw-lessons img').alt).toBe('Example design');
    expect(host.querySelector('.sw-lessons video').controls).toBe(true);
    expect(host.querySelector('.sw-lessons input[type="file"]')).toBeNull();
    expect(host.querySelectorAll('.sw-lessons img')).toHaveLength(1);
    expect(host.querySelector('a[href="https://example.com/slides.pdf"]').textContent).toContain('Open PDF');
    expect(host.querySelector('a[href="https://example.com/slides.pptx"]').textContent).toContain('Download presentation');
  });
  it('shows enrolled program posters and resources without student edit controls', async () => {
    schoolRequest.mockImplementation((method,path)=>{
      if(path==='/api/learning-context')return Promise.resolve({...context,role:'student'});
      if(path.endsWith('/program-offerings'))return Promise.resolve({items:[{...offerings[0],attachments:[{path:'poster',name:'Program poster',contentType:'image/png',url:'https://example.com/poster.png'},{path:'slides',name:'Program slides',contentType:'application/pdf',url:'https://example.com/program.pdf'}]}]});
      return mockRead(method,path);
    });
    await render();
    expect(host.querySelector('.sw-program-poster').src).toBe('https://example.com/poster.png');
    expect(host.querySelector('.sw-program-resources a').href).toBe('https://example.com/program.pdf');
    expect(host.querySelector('.sw-program-resources input[type=file]')).toBeNull();
  });
});

describe('Yearly school calendar', () => {
  it('opens twelve months and lets coaches manage shared events', async () => {
    schoolRequest.mockImplementation((method, path) => path.includes('/calendar-events?') ? Promise.resolve({items:[{id:'event',title:'Family showcase',startDate:'2026-10-30',endDate:'2026-10-30',allDay:true,status:'scheduled',revision:1}]}) : mockRead(method,path));
    await act(async () => root.render(<SchoolLearningPanel initialArea="calendar" />));
    expect(host.querySelectorAll('.sw-year-month')).toHaveLength(12);
    expect(host.textContent).toContain('Add school event');
    expect(host.textContent).toContain('Edit event');
    expect(host.querySelector('.sw-year-event').textContent).toContain('Family showcase');
    expect(schoolRequest.mock.calls.some(([,path]) => path.includes('from=2026-01-01&to=2026-12-31'))).toBe(true);
  });
  it('lets coaches set up a program before creating lessons', async () => {
    schoolRequest.mockImplementation((method,path) => path.endsWith('/program-offerings') ? Promise.resolve({items:[]}) : mockRead(method,path));
    await render();
    expect(host.textContent).toContain('Create offering');
  });
});

describe('Coach-created programs',()=>{
 it('offers a visible create action and opens an editable assigned-class program form',async()=>{
  await render();expect(host.querySelector('.sw-create-program')).toBeTruthy();await click('Create your own program');
  expect(host.querySelector('section[aria-label="Program maker"]')).toBeTruthy();
  const form=host.querySelector('section[aria-label="Program maker"] form');
  const fill=async(el,value)=>act(async()=>{Object.getOwnPropertyDescriptor(el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));});
  await fill(form.querySelector('input'),'Microgrid makers');await fill(form.querySelector('textarea'),'How can our district keep clean power available?');
  const definition={id:'custom-makers',title:'Microgrid makers',drivingQuestion:'How can our district keep clean power available?',semester:1,gradeBand:'Coach-created program',milestones:[{id:'explore',title:'Explore'}],rubric:[]};
  schoolRequest.mockImplementation(async(method,path,{body}={})=>method==='POST'?{id:'offering-makers',programId:'custom-makers',programDefinition:definition,...body,title:definition.title,status:'published',revision:1}:mockRead(method,path));
  await act(async()=>form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  const call=schoolRequest.mock.calls.find(([method,path])=>method==='POST'&&path.endsWith('program-offerings'));
  expect(call[2].body).toMatchObject({programId:'custom',programDraft:expect.objectContaining({title:'Microgrid makers'}),classIds:['class'],semester:1});
  expect(host.textContent).toContain('Microgrid makers');expect(host.textContent).toContain('Enrollment code management');
 });
});

it('shows student activities and simulations in separate program sections',async()=>{
 const {simulationFromPrompt}=await import('../src/features/school/simulationModel.js');
 schoolRequest.mockImplementation((method,path)=>{
  if(path==='/api/learning-context')return Promise.resolve({...context,role:'student'});
  if(path.endsWith('/lessons'))return Promise.resolve({items:[
   {id:'activity',title:'Rainfall investigation',outcome:'Measure volume',instructions:'Record rainfall',milestoneId:'phase1',status:'published',revision:2},
   {id:'simulation',title:'Tank simulation',outcome:'Balance supply',instructions:'Compare designs',milestoneId:'phase1',status:'published',revision:2,simulation:simulationFromPrompt('Collect water')}
  ]});
  return mockRead(method,path);
 });
 await render();
 const activities=host.querySelector('.sw-lessons section[aria-label="Activities"]'), simulations=host.querySelector('.sw-lessons section[aria-label="Simulations"]');
 expect(activities.querySelector('details').open).toBe(false);
 expect(simulations.querySelector('details').open).toBe(false);
 expect(activities.textContent).toContain('Rainfall investigation');expect(activities.textContent).not.toContain('Tank simulation');
 expect(simulations.textContent).toContain('Tank simulation');expect(simulations.querySelector('.sw-simulation')).toBeTruthy();expect(activities.querySelector('.sw-simulation')).toBeNull();
});
