import { describe, it, expect } from 'vitest';
import { emptyProgram, validateProgram } from '../src/features/school/programs/programSpec.js';
import { programPrompt, generateProgram } from '../server/lib/ai/programGeneration.js';
import { createMockAdapter } from '../server/lib/ai/adapter.js';
import { simulationFromPrompt } from '../src/features/school/simulationModel.js';
const program = () => ({...emptyProgram(),title:'Rainwater designers',drivingQuestion:'How can we collect water?',activities:[{title:'Measure rainfall',outcome:'Compare rainfall',instructions:'Measure and record rainfall.',milestoneId:'explore'}],simulations:[{title:'Design a tank',outcome:'Balance supply and cost',instructions:'Compare three designs.',milestoneId:'experiment',simulation:simulationFromPrompt('Collect rainwater')}]});
describe('Structured program conversion',()=>{
 it('keeps activities and simulations separate and linked to milestones',()=>{const clean=validateProgram({...program(),schoolId:'ignored',html:'<script/>'});expect(clean.activities).toHaveLength(1);expect(clean.simulations[0].simulation.kind).toBe('resource-lab');expect(clean.schoolId).toBeUndefined();expect(clean.html).toBeUndefined();});
 it('rejects duplicate milestones and orphaned lessons',()=>{const p=program();p.milestones.push(p.milestones[0]);expect(()=>validateProgram(p)).toThrow('unique');const q=program();q.activities[0].milestoneId='foreign';expect(()=>validateProgram(q)).toThrow('link');});
 it('rejects missing simulation settings and arbitrary executable types',()=>{const p=program();p.simulations[0].simulation=null;expect(()=>validateProgram(p)).toThrow('required');p.simulations[0].simulation={kind:'html'};expect(()=>validateProgram(p)).toThrow('supported');});
 it('rejects excessive lessons and malformed program input',()=>{const p=program();p.activities=Array(21).fill(p.activities[0]);expect(()=>validateProgram(p)).toThrow('20');expect(()=>validateProgram(null)).toThrow();});
 it('accepts a PDF source without forwarding unrelated request fields',()=>{const pdf=Buffer.from('%PDF-1.7\nfixture').toString('base64');const prompt=programPrompt({pdf,studentName:'private'});expect(prompt.document).toEqual({mimeType:'application/pdf',data:pdf});expect(JSON.stringify(prompt)).not.toContain('private');});
 it('rejects fake PDF bytes, malformed base64, oversized PDFs and personal text',()=>{for(const pdf of ['bad','AAAA',Buffer.from('not a pdf').toString('base64'),'a'.repeat(5600001)])expect(()=>programPrompt({pdf})).toThrow();expect(()=>programPrompt({prompt:'Contact learner@example.com'})).toThrow('personal');expect(()=>programPrompt({})).toThrow('Describe');});
 it('validates generated program output and surfaces invalid AI output',async()=>{const adapter=createMockAdapter([JSON.stringify(program())]);expect((await generateProgram(adapter,programPrompt({prompt:'Rainwater curriculum'}))).title).toBe('Rainwater designers');await expect(generateProgram(createMockAdapter(['{}']),programPrompt({prompt:'Rain'}))).rejects.toMatchObject({code:'AI_BAD_OUTPUT'});});
});
it('sends the PDF as document content through the server-only Gemini adapter',async()=>{
 const {createAdapter}=await import('../server/lib/ai/gemini.js');
 const {vi}=await import('vitest');
 const mock=vi.fn().mockResolvedValue({ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(program())}]}}],usageMetadata:{promptTokenCount:100,totalTokenCount:500}})});
 vi.stubGlobal('fetch',mock);
 try {
  const pdf=Buffer.from('%PDF-1.7\nfixture').toString('base64');
  await generateProgram(createAdapter({apiKey:'test-key',model:'test-model'}),programPrompt({pdf}));
  const body=JSON.parse(mock.mock.calls[0][1].body);
  expect(body.contents[0].parts[1].inlineData).toEqual({mimeType:'application/pdf',data:pdf});
  expect(body.generationConfig.responseMimeType).toBe('application/json');
 } finally {vi.unstubAllGlobals();}
});
