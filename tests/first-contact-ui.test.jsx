// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { it, expect } from 'vitest';
import { FirstContact } from '../src/features/universe/firstContact/FirstContact.jsx';
it('plays the encounter, revises, builds and visits a purchased destination', async () => {
 globalThis.IS_REACT_ACT_ENVIRONMENT = true;
 const host = document.createElement('div'); document.body.append(host); const root = createRoot(host);
 const click = async text => { const b = [...host.querySelectorAll('button')].find(b => b.textContent.includes(text)); expect(b).toBeTruthy(); await act(async () => b.click()); };
 try {
  await act(async () => root.render(<FirstContact inline />));
  await click('Meet the Tidekeeper'); await click('Rock shelf'); await click('Choose Open jetty'); await click('The jetty averages 8');
  expect(host.textContent).toContain('25/30');
  await click('Revise my answer'); await click('Choose Open jetty'); await click('Jetty: (7 + 8 + 9)');
  expect(host.textContent).toContain('+5 XP');
  await click('Collect your ship parts'); await click('Fit Tideglass frame'); await click('Fit Ion drive'); await click('Fit Navigation array'); await click('Assemble starter ship'); expect(host.textContent).toContain('Your ship. New horizons.'); await click('Back to ship workshop'); await click('15 credits'); await click('Find the hidden beacon');
  expect(host.textContent).toContain('A light beyond the bay'); await click('Decode the beacon');
  expect(host.textContent).toContain('30 XP · 15 Star Credits');
 } finally { await act(async () => root.unmount()); host.remove(); }
});
it('changes grade and support without changing expectations mid-mission', async()=>{
 globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
 try{
  await act(async()=>root.render(<FirstContact inline/>));
  const select=host.querySelector('select');
  await act(async()=>{select.value='12';select.dispatchEvent(new Event('change',{bubbles:true}));});
  expect(host.textContent).toContain('Grades 11–12');
  const click=async text=>{const b=[...host.querySelectorAll('button')].find(b=>b.textContent.includes(text));expect(b).toBeTruthy();await act(async()=>b.click());};
  await click('Meet the Tidekeeper');expect(select.disabled).toBe(true);await click('Rock shelf');
  expect(host.textContent).toContain('worst-case signal');expect(host.textContent).toContain('HS-ETS1-3');
  await click('Choose Rock shelf');await click('Rock has mean 7');expect(host.textContent).toContain('30/30');
 }finally{await act(async()=>root.unmount());host.remove();}
});
