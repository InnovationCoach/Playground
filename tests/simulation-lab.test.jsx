// @vitest-environment jsdom
import React, {act} from 'react';
import {createRoot} from 'react-dom/client';
import {expect,it,vi} from 'vitest';
import {simulationFromPrompt,runSimulation,validateSimulation} from '../src/features/school/simulationModel.js';
import {SimulationLab} from '../src/features/school/SimulationLab.jsx';
it('builds typed prompt starters with honest numerical limits',()=>{
 const water=simulationFromPrompt('Collect rainwater for a school');expect(water.unit).toBe('litres');
 expect(runSimulation(water,10,100)).toMatchObject({supplied:100,cost:200,success:true});
 expect(runSimulation(water,11,100).success).toBe(false);
 expect(()=>validateSimulation({...water,capacity:Infinity})).toThrow();
 expect(()=>validateSimulation({...water,kind:'script'})).toThrow();
 expect(()=>simulationFromPrompt('')).toThrow();
 expect(validateSimulation({...water,html:'<script>alert(1)</script>'})).not.toHaveProperty('html');
});
it('requires predictions, records trials, and renders user text safely',async()=>{
 globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
 await act(async()=>root.render(<SimulationLab settings={simulationFromPrompt('Solar energy experiment')}/>));
 const record=[...host.querySelectorAll('button')].find(b=>b.textContent==='Record experiment');expect(record.disabled).toBe(true);
 await act(async()=>{const input=host.querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'<img onerror=alert(1)>');input.dispatchEvent(new Event('input',{bubbles:true}));});
 await act(async()=>record.click());expect(host.querySelector('ol').textContent).toContain('Experiment 1');expect(host.querySelector('ol img')).toBeNull();
 await act(async()=>root.unmount());host.remove();delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});
