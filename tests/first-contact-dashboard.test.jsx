// @vitest-environment jsdom
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {it,expect} from 'vitest';
import {SparkUniverse} from '../src/features/dashboard/SparkUniverse.jsx';
it('opens the expedition from My Universe, traps focus and closes with Escape',async()=>{
 globalThis.IS_REACT_ACT_ENVIRONMENT=true;const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
 try{
  await act(async()=>root.render(<SparkUniverse prefs={{interests:[]}} plan={{goals:[]}} uid="fixture-user" orgId="fixture-org" onPersonalise={()=>{}}/>));
  const opener=[...host.querySelectorAll('button')].find(b=>b.textContent.includes('Start ship & base expedition'));expect(opener).toBeTruthy();opener.focus();
  await act(async()=>opener.click());
  for(let i=0;i<10&&!host.querySelector('[role=dialog]');i++)await act(async()=>{await new Promise(r=>setTimeout(r,20));});
  const dialog=host.querySelector('[role=dialog]');expect(dialog).toBeTruthy();expect(dialog.textContent).toContain('A signal from Thalassa');
  expect(dialog.contains(document.activeElement)).toBe(true);
  await act(async()=>dialog.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
  expect(host.querySelector('[role=dialog]')).toBeNull();expect(document.activeElement).toBe(opener);
 }finally{await act(async()=>root.unmount());host.remove();}
});
