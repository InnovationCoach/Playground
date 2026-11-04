// @vitest-environment jsdom
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
vi.mock('../src/services/api/apiClient.js',()=>({schoolRequest:vi.fn()}));
import {schoolRequest} from '../src/services/api/apiClient.js';
import {ProgramMaker} from '../src/features/school/programs/ProgramMaker.jsx';
import {emptyProgram} from '../src/features/school/programs/programSpec.js';
let host,root;
const created=vi.fn(),cancel=vi.fn();
const flush=async()=>act(async()=>{await Promise.resolve();});
const click=async text=>act(async()=>[...host.querySelectorAll('button')].find(b=>b.textContent===text).click());
const fill=async(label,value)=>act(async()=>{const el=[...host.querySelectorAll('label')].find(l=>l.textContent.startsWith(label)).querySelector('input,textarea');Object.getOwnPropertyDescriptor(el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));});
beforeEach(async()=>{globalThis.IS_REACT_ACT_ENVIRONMENT=true;host=document.createElement('div');document.body.append(host);root=createRoot(host);schoolRequest.mockReset();created.mockReset();cancel.mockReset();vi.spyOn(window,'confirm').mockReturnValue(true);await act(async()=>root.render(<ProgramMaker school={{id:'school'}} classes={[{id:'class',name:'Class 1'}]} onCreated={created} onCancel={cancel}/>));});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();delete globalThis.IS_REACT_ACT_ENVIRONMENT;});
it('converts a prompt and saves the reviewed structured program as a draft',async()=>{
 const program={...emptyProgram(),title:'Water designers',drivingQuestion:'How can we collect water?',activities:[{title:'Rainfall',outcome:'Measure volume',instructions:'Record rainfall.',milestoneId:'explore'}]};
 schoolRequest.mockResolvedValueOnce({program}).mockResolvedValueOnce({id:'offering',status:'draft'});
 await fill('Describe your program','Design a water program');await click('Convert to program draft');await flush();
 expect(window.confirm).not.toHaveBeenCalled();expect(host.textContent).toContain('Draft converted');expect(host.querySelector('[aria-label="Program activities"] input').value).toBe('Rainfall');
 await fill('Program title','Reviewed water program');await act(async()=>host.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
 expect(schoolRequest.mock.calls[1][2].body.programDraft.title).toBe('Reviewed water program');expect(created).toHaveBeenCalledWith({id:'offering',status:'draft'});
});
it('keeps manual edits when conversion is cancelled',async()=>{await fill('Program title','Manual title');await fill('Describe your program','New idea');window.confirm.mockReturnValue(false);await click('Convert to program draft');expect(schoolRequest).not.toHaveBeenCalled();expect(host.querySelector('form input').value).toBe('Manual title');});
it('preserves draft edits when conversion fails and guards discard',async()=>{await fill('Program title','Keep this title');await fill('Describe your program','New idea');schoolRequest.mockRejectedValueOnce(new Error('School AI unavailable'));await click('Convert to program draft');expect(host.querySelector('form input').value).toBe('Keep this title');expect(host.querySelector('[role="alert"]').textContent).toBe('School AI unavailable');window.confirm.mockReturnValue(false);await click('Cancel');expect(cancel).not.toHaveBeenCalled();});
it('provides independent activity and simulation sections',async()=>{await click('Add activity');await click('Add simulation');expect(host.querySelectorAll('[aria-label="Program activities"] .sw-card')).toHaveLength(1);expect(host.querySelector('[aria-label="Program simulations"] details')).toBeTruthy();});

it('saves selected existing PBL competencies with a program activity',async()=>{
 await fill('Program title','Learning program'); await fill('Driving question','How can we investigate?');
 await click('Add activity'); await fill('Lesson title','Investigate'); await fill('Learning outcome','Compare evidence'); await fill('Instructions and evidence','Record observations.');
 const checkbox=[...host.querySelectorAll('input[type="checkbox"]')].find(el=>el.closest('label').textContent.includes('(ctps-01)'));
 await act(async()=>checkbox.click());
 schoolRequest.mockResolvedValueOnce({id:'offering',status:'draft'});
 await act(async()=>host.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
 expect(schoolRequest.mock.calls[0][2].body.programDraft.activities[0].competencyIds).toEqual(['ctps-01']);
});
