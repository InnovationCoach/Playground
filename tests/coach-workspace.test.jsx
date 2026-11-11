// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
vi.mock('../src/firebase.js', () => ({
  usingEmulators:false,
  auth:{currentUser:{uid:'coach-1',displayName:'Sara',getIdTokenResult:vi.fn()}}, db:{},
  getDoc:vi.fn(), getDocs:vi.fn(), setDoc:vi.fn(),
  doc:(_db,...parts)=>parts.join('/'), collection:(_db,...parts)=>parts.join('/'),
  query:(ref,filter)=>({ref,filter}), where:(field,op,value)=>({field,op,value}),
  usingEmulators: false
}));
vi.mock('../src/features/community/CommunityFeed.jsx', () => ({CommunityFeed:()=>null}));
vi.mock('../src/features/school/SchoolLearningPanel.jsx', () => ({SchoolLearningPanel:()=>null}));
vi.mock('../src/services/api/apiClient.js', () => ({schoolRequest:vi.fn()}));
import { auth, getDoc, getDocs, setDoc } from '../src/firebase.js';
import { schoolRequest } from '../src/services/api/apiClient.js';
import { CoachWorkspace } from '../src/features/coach/CoachWorkspace.jsx';
import { LearnerFeedback } from '../src/features/coach/LearnerFeedback.jsx';
import { LocaleProvider } from '../src/app/i18n/LocaleProvider.jsx';
import { StudentInviteDialog, StudentSetupLink } from '../src/features/coach/StudentInviteDialog.jsx';

let host, root;
const snapshot = values => ({docs:values.map(([id,value])=>({id,data:()=>value}))});
beforeEach(() => {
  vi.resetAllMocks();
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  auth.currentUser.getIdTokenResult.mockResolvedValue({claims:{role:'teacher',classIds:['class-1']}});
  getDoc.mockResolvedValue({exists:()=>true,data:()=>({name:'Pilot class'})});
  getDocs.mockResolvedValue(snapshot([]));
  HTMLDialogElement.prototype.showModal = function() { this.open = true; };
});
afterEach(async () => { await act(async()=>root.unmount()); host.remove(); delete globalThis.IS_REACT_ACT_ENVIRONMENT; });
const render = node => act(async()=>root.render(<LocaleProvider>{node}</LocaleProvider>));
const input = async (element,value) => act(async()=>{
  const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype,'value').set.call(element,value);
  element.dispatchEvent(new Event('input',{bubbles:true}));
});

describe('coach workspace pilot fixes', () => {
  it('shows a real load error when every roster batch fails', async () => {
    getDocs.mockRejectedValue({code:'permission-denied'});
    await render(<CoachWorkspace coachUser={{uid:'coach-1'}} />);
    expect(host.textContent).toContain('Class records are unavailable');
    expect(host.textContent).not.toContain('No learners found');
  });
  it('labels partial rosters and totals as incomplete', async () => {
    auth.currentUser.getIdTokenResult.mockResolvedValue({claims:{role:'teacher',classIds:Array.from({length:11},(_,i)=>`class-${i}`)}});
    getDocs.mockResolvedValueOnce(snapshot([])).mockRejectedValueOnce({code:'unavailable'});
    await render(<CoachWorkspace coachUser={{uid:'coach-1'}} />);
    expect(host.textContent).toContain('Learners loaded (incomplete)');
    expect(host.textContent).toContain('Some class rosters could not be loaded');
  });
  it('does not query with class assignments supplied only by the UI profile', async () => {
    auth.currentUser.getIdTokenResult.mockResolvedValue({claims:{role:'teacher',classIds:[]}});
    await render(<CoachWorkspace coachUser={{uid:'coach-1',classIds:['forged']}} />);
    expect(getDocs).not.toHaveBeenCalled();
    expect(host.textContent).toContain('class access needs checking');
  });
  it('preserves failed feedback drafts and saves a retry only once in history', async () => {
    setDoc.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(undefined);
    await render(<LearnerFeedback learnerUid="anna" workId="pbl-pilot" />);
    await input(host.querySelector('textarea'),'Try measuring the result.');
    await act(async()=>host.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
    expect(host.textContent).toContain('Feedback was not saved');
    expect(host.querySelector('textarea').value).toBe('Try measuring the result.');
    await act(async()=>host.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
    expect(setDoc.mock.calls[0][0]).toBe(setDoc.mock.calls[1][0]);
    expect(host.textContent).toContain('Feedback saved.');
    expect(host.querySelectorAll('article')).toHaveLength(1);
    expect(setDoc.mock.calls[1][1]).toMatchObject({coachId:'coach-1',workId:'pbl-pilot'});
  });
  it('uses verified class choices and never requests a shared password', async () => {
    schoolRequest.mockResolvedValueOnce({items:[{id:'class-1',name:'Pilot class'}]}).mockResolvedValueOnce({student:{displayName:'Anna',groupName:'Pilot class'},setupLink:'https://example.test/setup',delivery:'manual'});
    const onCreated = vi.fn();
    await render(<StudentInviteDialog onCreated={onCreated} onClose={()=>{}} />);
    expect(host.querySelector('input[type=password]')).toBeNull();
    await input(host.querySelector('[name=displayName]'),'Anna');
    await input(host.querySelector('[name=email]'),'anna@pilot.test');
    await act(async()=>{ const field=host.querySelector('[name=ageBand]'); field.value='16-18'; field.dispatchEvent(new Event('change',{bubbles:true})); });
    await act(async()=>host.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
    expect(schoolRequest).toHaveBeenLastCalledWith('POST','/api/coach/students',{body:{displayName:'Anna',email:'anna@pilot.test',classId:'class-1',ageBand:'16-18'}});
    expect(host.textContent).toContain('No email has been sent');
    expect(onCreated).toHaveBeenCalledTimes(1);
  });
  it('recovers a private setup link without creating another student', async () => {
    schoolRequest.mockResolvedValueOnce({setupLink:'https://example.test/setup',delivery:'manual'});
    await render(<StudentSetupLink learnerUid="anna" />);
    await act(async()=>host.querySelector('button').click());
    expect(schoolRequest).toHaveBeenCalledWith('POST','/api/coach/students/anna/setup-link',{body:{}});
    expect(host.querySelector('input').value).toBe('https://example.test/setup');
    expect(host.textContent).toContain('No email has been sent');
  });
});
