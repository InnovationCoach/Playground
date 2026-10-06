// @vitest-environment jsdom
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
vi.mock('../src/features/personalization/imageCrop.js',async()=>({...await vi.importActual('../src/features/personalization/imageCrop.js'),cropImage:vi.fn().mockImplementation(async(image,rect,kind)=>new File(['cropped'],kind==='picture'?'profile-picture.png':'dashboard-banner.png',{type:'image/png'}))}));
vi.mock('../src/firebase.js',()=>({storage:{ref:vi.fn()}}));
vi.mock('../src/services/api/apiClient.js',()=>({schoolRequest:vi.fn()}));
import {storage} from '../src/firebase.js';
import {schoolRequest} from '../src/services/api/apiClient.js';
import {PersonalizedDashboard,PortfolioEditor} from '../src/features/personalization/Personalization.jsx';
import {defaults} from '../src/features/personalization/personalizationModel.js';
let host,root,data;
beforeEach(()=>{URL.createObjectURL=vi.fn(()=> 'blob:crop-preview');URL.revokeObjectURL=vi.fn();globalThis.IS_REACT_ACT_ENVIRONMENT=true;data=defaults();data.dashboard.goals='SECRET personal goal';data.dashboard.introduction='PRIVATE INTRO';data.portfolio.introduction='PUBLIC INTRO';data.items=[{id:'p',title:'Private reflection',body:'Private content',kind:'writing',audiences:[]},{id:'c',title:'Shared with coaches',body:'Coaching content',kind:'writing',audiences:['coaches']}];host=document.createElement('div');document.body.append(host);root=createRoot(host);schoolRequest.mockImplementation((method,path,options)=>Promise.resolve(method==='PUT'?{...data,...options.body,revision:1}:structuredClone(data)));});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.clearAllMocks();delete globalThis.IS_REACT_ACT_ENVIRONMENT;});
async function click(text){await act(async()=>{const button=[...host.querySelectorAll('button')].find(b=>b.textContent.trim()===text);expect(button).toBeTruthy();button.click();});}
async function renderDashboard(){await act(async()=>root.render(<PersonalizedDashboard uid="learner" profile={{displayName:'Learner'}} widgets={{learning:<p>Learning widget</p>,goals:<p>Goals widget</p>,notes:<p>Notes widget</p>}}/>));await click('Personalize dashboard');}
async function applyCrop(){const image=host.querySelector('.lp-crop-window img');expect(image).toBeTruthy();Object.defineProperties(image,{naturalWidth:{value:1200},naturalHeight:{value:800}});await act(async()=>image.dispatchEvent(new Event('load')));await click('Use this crop');}
const order=()=>[...host.querySelectorAll('.lp-widget')].map(e=>e.getAttribute('aria-label'));
describe('Accessible learner personalization',()=>{
  it('supports keyboard reordering, undo, restore and explicit persistence',async()=>{
    await renderDashboard();const handle=host.querySelector('[aria-label="Reorder Private notes"]');handle.focus();await act(async()=>handle.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowUp',altKey:true,bubbles:true})));expect(order()).toEqual(['School learning','Private notes','Learning goals','About me']);expect(document.activeElement).toBe(handle);
    expect(schoolRequest.mock.calls.every(([method])=>method==='GET')).toBe(true);
    await click('Undo last change');expect(order()).toEqual(['School learning','Learning goals','Private notes','About me']);
    await act(async()=>host.querySelector('[aria-label="Reorder Private notes"]').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowUp',altKey:true,bubbles:true})));
    await click('Restore default layout');expect(order()[1]).toBe('Learning goals');await click('Save personalization');expect(schoolRequest.mock.calls.some(([method,path])=>method==='PUT'&&path==='/api/learner-space')).toBe(true);
  });
  it('supports drag and drop and discard without losing widget content',async()=>{
    await renderDashboard();const handle=host.querySelector('[aria-label="Reorder Private notes"]');const event=new Event('dragstart',{bubbles:true});Object.defineProperty(event,'dataTransfer',{value:{setData:vi.fn()}});await act(async()=>handle.dispatchEvent(event));await act(async()=>host.querySelector('.lp-widget').dispatchEvent(new Event('drop',{bubbles:true,cancelable:true})));expect(order()[0]).toBe('Private notes');await click('Discard preview');expect(order()[0]).toBe('School learning');expect(host.textContent).toContain('Learning widget');
  });
  it('never renders private goals or dashboard introduction in portfolio previews',async()=>{
    await act(async()=>root.render(<PortfolioEditor uid="learner"/>));expect(host.textContent).not.toContain('SECRET personal goal');expect(host.textContent).not.toContain('PRIVATE INTRO');expect(host.textContent).toContain('PUBLIC INTRO');const select=[...host.querySelectorAll('select')].find(e=>e.closest('label').textContent.startsWith('Preview as'));await act(async()=>{select.value='coaches';select.dispatchEvent(new Event('change',{bubbles:true}));});const preview=host.querySelector('.lp-preview');expect(preview.textContent).toContain('Shared with coaches');expect(preview.textContent).not.toContain('Private reflection');
  });
  it('keeps save controls unavailable when the real settings service fails',async()=>{
    schoolRequest.mockRejectedValue(new Error('Service unavailable'));await act(async()=>root.render(<PortfolioEditor uid="learner"/>));expect(host.querySelector('[role="alert"]').textContent).toBe('Service unavailable');expect(host.textContent).not.toContain('Save personalization');
  });
});

describe('Media and revision-safe previews',()=>{
  it('uploads a profile image privately and previews its temporary URL before saving',async()=>{
    storage.ref.mockReturnValue({put:vi.fn().mockResolvedValue({})});
    schoolRequest.mockImplementation((method,path,options)=>Promise.resolve(path.endsWith('/media-preview')?{...options.body.media,url:'https://media.example/temporary/picture.png',contentType:'image/png'}:structuredClone(data)));
    await renderDashboard();const input=host.querySelector('input[type="file"]');Object.defineProperty(input,'files',{value:[new File(['image'],'picture.png',{type:'image/png'})]});await act(async()=>input.dispatchEvent(new Event('change',{bubbles:true})));await applyCrop();
    expect(storage.ref.mock.calls[0][0]).toMatch(/^learnerMedia\/learner\//);expect(host.querySelector('.lp-avatar').src).toBe('https://media.example/temporary/picture.png');expect(schoolRequest.mock.calls.some(([method])=>method==='PUT')).toBe(false);
  });
  it('retains the current saved revision when undoing a saved customization',async()=>{
    await renderDashboard();await act(async()=>host.querySelector('[aria-label="Reorder Private notes"]').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowUp',altKey:true,bubbles:true})));
    await click('Save personalization');await click('Undo last change');await click('Save personalization');const puts=schoolRequest.mock.calls.filter(([method])=>method==='PUT');expect(puts[1][2].body.revision).toBe(1);
  });
});

it('previews and saves a private dashboard banner without modifying the portfolio',async()=>{
  storage.ref.mockReturnValue({put:vi.fn().mockResolvedValue({})});
  schoolRequest.mockImplementation((method,path,options)=>Promise.resolve(path.endsWith('/media-preview')?{...options.body.media,url:'https://media.example/temporary/banner.png',contentType:'image/png'}:method==='PUT'?{...data,...options.body,revision:1}:structuredClone(data)));
  await act(async()=>root.render(<PersonalizedDashboard uid="learner" profile={{displayName:'Learner'}} widgets={{}}/>));
  const input=[...host.querySelectorAll('input[type="file"]')].find(e=>e.closest('label').textContent.includes('Dashboard banner'));
  Object.defineProperty(input,'files',{value:[new File(['banner'],'banner.png',{type:'image/png'})]});
  await act(async()=>input.dispatchEvent(new Event('change',{bubbles:true})));await applyCrop();
  expect(host.querySelector('.lp-cover').alt).toBe('My dashboard banner');
  expect(host.querySelector('.lp-cover').src).toContain('/banner.png');
  await click('Save dashboard changes');
  const body=schoolRequest.mock.calls.find(([method])=>method==='PUT')[2].body;
  expect(body.dashboard.appearance.cover.name).toBe('dashboard-banner.png');
  expect(body.portfolio.appearance.cover).toBeNull();
  await click('Remove dashboard banner');expect(host.querySelector('.lp-cover')).toBeNull();
  await click('Discard dashboard preview');expect(host.querySelector('.lp-cover')).not.toBeNull();
});


it('always shows a cover placeholder and photo controls before any image is uploaded',async()=>{
 await act(async()=>root.render(<PersonalizedDashboard uid="learner" profile={{displayName:'Learner'}} widgets={{}}/>));
 expect(host.querySelector('.lp-cover-placeholder')).toBeTruthy();expect(host.textContent).toContain('Add cover banner');expect(host.textContent).toContain('Add photo');expect(host.textContent).not.toContain('Save dashboard changes');
});
it('cancels cropping before uploading and restores keyboard focus',async()=>{
 await renderDashboard();const input=host.querySelector('input[type="file"]');input.focus();Object.defineProperty(input,'files',{value:[new File(['image'],'photo.png',{type:'image/png'})]});await act(async()=>input.dispatchEvent(new Event('change',{bubbles:true})));
 expect(host.querySelector('[role="dialog"]')).toBeTruthy();expect(storage.ref).not.toHaveBeenCalled();await act(async()=>host.querySelector('[role="dialog"]').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));expect(host.querySelector('[role="dialog"]')).toBeNull();expect(storage.ref).not.toHaveBeenCalled();expect(document.activeElement).toBe(input);expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:crop-preview');
});
it('keeps a failed crop upload open with an actionable error and no settings write',async()=>{
 storage.ref.mockReturnValue({put:vi.fn().mockRejectedValue(new Error('Upload unavailable'))});await renderDashboard();const input=host.querySelector('input[type="file"]');Object.defineProperty(input,'files',{value:[new File(['image'],'photo.png',{type:'image/png'})]});await act(async()=>input.dispatchEvent(new Event('change',{bubbles:true})));await applyCrop();expect(host.querySelector('[role="dialog"]')).toBeTruthy();expect(host.textContent).toContain('Upload unavailable');expect(schoolRequest.mock.calls.some(([m])=>m==='PUT')).toBe(false);
});
it('rejects unsupported dashboard images before opening the crop dialog',async()=>{
 await renderDashboard();const input=host.querySelector('input[type="file"]');Object.defineProperty(input,'files',{value:[new File(['script'],'image.svg',{type:'image/svg+xml'})]});await act(async()=>input.dispatchEvent(new Event('change',{bubbles:true})));expect(host.querySelector('[role="dialog"]')).toBeNull();expect(storage.ref).not.toHaveBeenCalled();expect(host.textContent).toContain('Choose a JPG');
});
