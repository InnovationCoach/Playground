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
    await click('Restore default layout');expect(order()[1]).toBe('Learning goals');
    const save=()=>[...host.querySelectorAll('.lp-changes button')].find(b=>b.textContent==='Save changes');expect(save().disabled).toBe(true);
    await act(async()=>host.querySelector('[aria-label="Reorder Private notes"]').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowUp',altKey:true,bubbles:true})));expect(save().disabled).toBe(false);await click('Save changes');expect(schoolRequest.mock.calls.some(([method,path])=>method==='PUT'&&path==='/api/learner-space')).toBe(true);
  });
  it('supports drag and drop and discard without losing widget content',async()=>{
    await renderDashboard();const handle=host.querySelector('[aria-label="Reorder Private notes"]');const event=new Event('dragstart',{bubbles:true});Object.defineProperty(event,'dataTransfer',{value:{setData:vi.fn()}});await act(async()=>handle.dispatchEvent(event));await act(async()=>host.querySelector('.lp-widget').dispatchEvent(new Event('drop',{bubbles:true,cancelable:true})));expect(order()[0]).toBe('Private notes');await click('Discard changes');expect(order()[0]).toBe('School learning');expect(host.textContent).toContain('Learning widget');
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
    await click('Save changes');await click('Undo last change');await click('Save changes');const puts=schoolRequest.mock.calls.filter(([method])=>method==='PUT');expect(puts[1][2].body.revision).toBe(1);
  });
});

it('previews and saves a private dashboard banner without modifying the portfolio',async()=>{
  storage.ref.mockReturnValue({put:vi.fn().mockResolvedValue({})});
  schoolRequest.mockImplementation((method,path,options)=>Promise.resolve(path.endsWith('/media-preview')?{...options.body.media,url:'https://media.example/temporary/banner.png',contentType:'image/png'}:method==='PUT'?{...data,...options.body,dashboard:{...options.body.dashboard,appearance:{...options.body.dashboard.appearance,cover:{...options.body.dashboard.appearance.cover,url:'https://media.example/temporary/banner.png'}}},revision:1}:structuredClone(data)));
  await act(async()=>root.render(<PersonalizedDashboard uid="learner" profile={{displayName:'Learner'}} widgets={{}}/>));
  const input=[...host.querySelectorAll('input[type="file"]')].find(e=>e.closest('label').textContent.includes('Dashboard banner'));
  Object.defineProperty(input,'files',{value:[new File(['banner'],'banner.png',{type:'image/png'})]});
  await act(async()=>input.dispatchEvent(new Event('change',{bubbles:true})));await applyCrop();
  expect(host.querySelector('.lp-cover').alt).toBe('My dashboard banner');
  expect(host.querySelector('.lp-cover').src).toContain('/banner.png');
  await click('Save changes');
  const body=schoolRequest.mock.calls.find(([method])=>method==='PUT')[2].body;
  expect(body.dashboard.appearance.cover).toEqual({path:expect.stringMatching(/^learnerMedia\/learner\//),name:'dashboard-banner.png'});
  expect(body).not.toHaveProperty('items');
  expect(body.portfolio.appearance.cover).toBeNull();
  await click('Remove dashboard banner');expect(host.querySelector('.lp-cover')).toBeNull();
  await click('Discard changes');expect(host.querySelector('.lp-cover')).not.toBeNull();
});


it('always shows a cover placeholder and photo controls before any image is uploaded',async()=>{
 await act(async()=>root.render(<PersonalizedDashboard uid="learner" profile={{displayName:'Learner'}} widgets={{}}/>));
 expect(host.querySelector('.lp-cover-placeholder')).toBeTruthy();expect(host.textContent).toContain('Add cover banner');expect(host.textContent).toContain('Add photo');expect(host.textContent).not.toContain('Save changes');expect(host.querySelector('.lp-interest-add')).toBeTruthy();
});
it('cancels cropping before uploading and restores keyboard focus',async()=>{
 await renderDashboard();const input=host.querySelector('input[type="file"]');input.focus();Object.defineProperty(input,'files',{value:[new File(['image'],'photo.png',{type:'image/png'})]});await act(async()=>input.dispatchEvent(new Event('change',{bubbles:true})));
 expect(host.querySelector('[role="dialog"]')).toBeTruthy();expect(storage.ref).not.toHaveBeenCalled();await act(async()=>host.querySelector('[role="dialog"]').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));expect(host.querySelector('[role="dialog"]')).toBeNull();expect(storage.ref).not.toHaveBeenCalled();expect(document.activeElement).toBe(input);expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:crop-preview');
});
it('keeps a failed crop upload open with an actionable error and releases decoration lock when cancelled',async()=>{
 storage.ref.mockReturnValue({put:vi.fn().mockRejectedValue(new Error('Upload unavailable'))});await renderDashboard();const input=host.querySelector('input[type="file"]');Object.defineProperty(input,'files',{value:[new File(['image'],'photo.png',{type:'image/png'})]});await act(async()=>input.dispatchEvent(new Event('change',{bubbles:true})));await applyCrop();expect(host.querySelector('[role="dialog"]')).toBeTruthy();expect(host.textContent).toContain('Upload unavailable');expect(schoolRequest.mock.calls.some(([m])=>m==='PUT')).toBe(false);
 await click('Cancel image change');expect(host.querySelector('.lp-personalize').disabled).toBe(false);
});
it('rejects unsupported dashboard images before opening the crop dialog',async()=>{
 await renderDashboard();const input=host.querySelector('input[type="file"]');Object.defineProperty(input,'files',{value:[new File(['script'],'image.svg',{type:'image/svg+xml'})]});await act(async()=>input.dispatchEvent(new Event('change',{bubbles:true})));expect(host.querySelector('[role="dialog"]')).toBeNull();expect(storage.ref).not.toHaveBeenCalled();expect(host.textContent).toContain('Choose a JPG');
});

it('shows interests as chips, keeps the learner name as the page title and offers one save bar',async()=>{
 data.dashboard.interests='Robots, Music · Climate';data.dashboard.heading='Curious maker';
 await renderDashboard();
 expect([...host.querySelectorAll('.lp-interest-chips li')].map(li=>li.textContent)).toEqual(['Robots','Music','Climate']);
 expect(host.querySelector('.lp-profile-copy h1').textContent).toBe('Learner');expect(host.querySelector('.lp-profile-tagline').textContent).toBe('Curious maker');
 expect(host.querySelectorAll('.lp-changes').length).toBe(1);expect(host.textContent).not.toContain('Save personalization');
 expect(host.querySelector('.lp-photo-edit').textContent).toBe('Add photo');
});

for (const [button,kind] of [['Add photo','picture'],['Add cover banner','cover']]) {
 it(`opens the collapsed image picker from ${button} and restores focus without uploading`,async()=>{
  await renderDashboard();const trigger=[...host.querySelectorAll('button')].find(b=>b.textContent.trim()===button);const details=host.querySelector('.lp-image-details');expect(details.open).toBe(false);
  trigger.focus();await click(button);expect(details.open).toBe(true);
  const input=host.querySelectorAll('input[type="file"]')[kind==='picture'?0:1];Object.defineProperty(input,'files',{value:[new File(['image'],'image.png',{type:'image/png'})]});
  await act(async()=>input.dispatchEvent(new Event('change',{bubbles:true})));expect(host.querySelector('[role="dialog"]')).toBeTruthy();expect(storage.ref).not.toHaveBeenCalled();
  await click('Cancel image change');expect(document.activeElement).toBe(trigger);expect(storage.ref).not.toHaveBeenCalled();
 });
}
it('resets crop controls and returns focus after applying the crop',async()=>{
 storage.ref.mockReturnValue({put:vi.fn().mockResolvedValue({})});schoolRequest.mockImplementation((method,path,options)=>Promise.resolve(path.endsWith('/media-preview')?{...options.body.media,url:'https://media.example/temporary/photo.png'}:structuredClone(data)));
 await renderDashboard();const trigger=host.querySelector('.lp-photo-edit');trigger.focus();await click('Add photo');
 const input=host.querySelector('input[type="file"]');Object.defineProperty(input,'files',{value:[new File(['image'],'photo.png',{type:'image/png'})]});await act(async()=>input.dispatchEvent(new Event('change',{bubbles:true})));
 const image=host.querySelector('.lp-crop-window img');Object.defineProperties(image,{naturalWidth:{value:1200},naturalHeight:{value:800}});await act(async()=>image.dispatchEvent(new Event('load')));
 const slider=host.querySelector('[aria-label="Zoom"]');await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(slider,'2');slider.dispatchEvent(new Event('input',{bubbles:true}));});expect(slider.value).toBe('2');await click('Reset');expect(slider.value).toBe('1');expect(storage.ref).not.toHaveBeenCalled();
 await click('Use this crop');expect(storage.ref).toHaveBeenCalledTimes(1);expect(document.activeElement).toBe(trigger);expect(host.querySelector('[role="dialog"]')).toBeNull();
});

it('removes work and passes revision as query parameter to prevent proxy body stripping', async () => {
  data.items = [{ id: 'p', title: 'Private reflection', body: 'Private content', revision: 2, audiences: [] }];
  schoolRequest.mockImplementation((method, path) => Promise.resolve(method === 'DELETE' ? { ...data, items: [] } : structuredClone(data)));
  await act(async () => root.render(<PortfolioEditor uid="learner" />));
  const removeBtn = [...host.querySelectorAll('button')].find(b => b.textContent.includes('Remove work Private reflection'));
  expect(removeBtn).toBeTruthy();
  await act(async () => removeBtn.click());
  expect(host.textContent).toContain('Remove “Private reflection” from your portfolio?');
  await click('Confirm removal');
  expect(schoolRequest).toHaveBeenCalledWith(
    'DELETE',
    '/api/learner-space/items/p',
    expect.objectContaining({
      query: { revision: 2 },
      body: expect.objectContaining({ id: 'p', revision: 2 })
    })
  );
});
