import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAdapter } from '../server/lib/ai/gemini.js';
import { createMockAdapter, aiError } from '../server/lib/ai/adapter.js';
import { generateActivity, regenerateActivityBlock } from '../server/lib/ai/activityGeneration.js';
import { sampleActivity } from '../src/features/activities/spec/activitySpec.js';

const config = { apiKey: 'disposable-test-key-never-real', model: 'configured-test-model' };
const prompt = { system: 'Activity schema only.', user: 'Design an energy audit.' };
const payload = (changes = {}) => ({
 candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '{"version":1}' }] } }],
 usageMetadata: { promptTokenCount: 50, candidatesTokenCount: 100, thoughtsTokenCount: 20, totalTokenCount: 170 }, ...changes
});
const response = (data = payload(), status = 200) => ({ ok: status === 200, status, json: async () => data });
const mockAdapter = replies => ({ ...createMockAdapter(replies), provider: 'gemini' });
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('Gemini activity adapter', () => {
 it('sends system and user separately, key in header, JSON mode and normalized usage including thinking', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => response()));
  const result = await createAdapter(config).complete(prompt);
  const [url, options] = fetch.mock.calls[0];
  expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/models/configured-test-model:generateContent');
  expect(url).not.toContain(config.apiKey); expect(options.headers['x-goog-api-key']).toBe(config.apiKey);
  expect(options.redirect).toBe('error');
  const body = JSON.parse(options.body);
  expect(body.systemInstruction.parts[0].text).toBe(prompt.system);
  expect(body.contents[0]).toEqual({ role: 'user', parts: [{ text: prompt.user }] });
  expect(body.generationConfig).toEqual({ maxOutputTokens: 8000, responseMimeType: 'application/json' });
  expect(body.tools).toBeUndefined(); expect(result.usage).toEqual({ inputTokens: 50, outputTokens: 120 });
 });
 it.each([[401,'AI_KEY_INVALID'],[403,'AI_KEY_INVALID'],[429,'AI_RATE_LIMITED'],[500,'AI_UNAVAILABLE'],[504,'AI_TIMEOUT']])('maps HTTP %s without echoing provider content', async (status, code) => {
  vi.stubGlobal('fetch', vi.fn(async () => response({ error: { message: config.apiKey + prompt.user } }, status)));
  const error = await createAdapter(config).complete(prompt).catch(e => e);
  expect(error.code).toBe(code); expect(String(error)).not.toContain(config.apiKey); expect(error.cause).toBeUndefined();
 });
 it('does not expose transport errors', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => { throw Error(config.apiKey + prompt.user); }));
  await expect(createAdapter(config).complete(prompt)).rejects.toMatchObject({ code: 'AI_UNAVAILABLE', message: 'The AI provider is unavailable.' });
 });
 it.each([
  { promptFeedback: { blockReason: 'SAFETY' } },
  { candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{text:'partial'}] } }] },
  { candidates: [] },
  { candidates: [{ finishReason:'STOP',content:{parts:[{text:'secret thought',thought:true}]}}] },
  { usageMetadata: { promptTokenCount: 50, totalTokenCount: 2 } },
  { usageMetadata: {} }
 ])('rejects incomplete/blocked/unaccountable responses', async change => {
  vi.stubGlobal('fetch',vi.fn(async () => response(payload(change))));
  await expect(createAdapter(config).complete(prompt)).rejects.toMatchObject({code:'AI_BAD_OUTPUT'});
 });
 it('enforces the deadline while waiting for response JSON', async () => {
  vi.useFakeTimers();vi.stubGlobal('fetch',vi.fn(async () => ({ok:true,json:()=>new Promise(()=>{})})));
  const pending = createAdapter(config).complete(prompt);const assertion=expect(pending).rejects.toMatchObject({code:'AI_TIMEOUT'});
  await vi.advanceTimersByTimeAsync(45_000);await assertion;
  expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
 });
 it('does not contact the provider if already cancelled', async () => {
  vi.stubGlobal('fetch',vi.fn());const controller=new AbortController();controller.abort();
  await expect(createAdapter(config).complete(prompt,{signal:controller.signal})).rejects.toMatchObject({code:'AI_TIMEOUT'});expect(fetch).not.toHaveBeenCalled();
 });
 it('makes one minimal text call for key testing', async () => {
  vi.stubGlobal('fetch',vi.fn(async()=>response(payload({candidates:[{finishReason:'STOP',content:{parts:[{text:'OK'}]}}]}))));
  await expect(createAdapter({...config,model:'gemini-3.5-flash'}).testKey()).resolves.toEqual({ok:true});expect(fetch).toHaveBeenCalledTimes(1);
  expect(JSON.parse(fetch.mock.calls[0][1].body).generationConfig).toEqual({maxOutputTokens:256,thinkingConfig:{thinkingLevel:'minimal'}});
 });
 it('rejects missing keys, model paths and invalid output limits without a request', async () => {
  vi.stubGlobal('fetch',vi.fn());expect(()=>createAdapter({...config,model:'../foreign?key=x'})).toThrow();expect(()=>createAdapter({...config,apiKey:''})).toThrow();
  await expect(createAdapter(config).complete(prompt,{maxOutputTokens:0})).rejects.toMatchObject({code:'AI_UNAVAILABLE'});expect(fetch).not.toHaveBeenCalled();
 });
});
describe('Validated activity generation and repair',()=>{
 it('overwrites all provider-supplied provenance and returns safety warnings',async()=>{
  const spec=sampleActivity();spec.provenance={aiAssisted:false,reviewedBy:'spoof'};
  const adapter=mockAdapter([JSON.stringify(spec)]);const result=await generateActivity({adapter,prompt:'Design an energy audit',context:{ageBand:'13-15'}});
  expect(result.spec.provenance).toEqual({aiAssisted:true,provider:'gemini',model:'mock-model'});expect(result.warnings).toEqual(expect.any(Array));
 });
 it('repairs invalid JSON once and returns usage from both successful provider calls',async()=>{
  const adapter=mockAdapter(['broken',JSON.stringify(sampleActivity())]);const result=await generateActivity({adapter,prompt:'Audit energy'});
  expect(adapter.calls).toHaveLength(2);expect(adapter.calls[1].user).toContain('Repair the previous response');expect(result.usage).toEqual({inputTokens:200,outputTokens:800});
 });
 it('includes field-level feedback in a schema repair without injecting raw output',async()=>{
  const bad={...sampleActivity(),title:'',raw:'Never include this output'};const adapter=mockAdapter([JSON.stringify(bad),JSON.stringify(sampleActivity())]);await generateActivity({adapter,prompt:'Audit energy'});
  expect(adapter.calls[1].user).toContain('title: is required');expect(adapter.calls[1].user).not.toContain(bad.raw);
 });
 it('rejects a second invalid response with a safe error',async()=>{
  const adapter=mockAdapter(['bad','bad again']);await expect(generateActivity({adapter,prompt:'Audit energy'})).rejects.toMatchObject({code:'AI_BAD_OUTPUT'});expect(adapter.calls).toHaveLength(2);
 });
 it('does not retry provider failures',async()=>{
  const adapter=mockAdapter([aiError('AI_UNAVAILABLE','Provider unavailable')]);await expect(generateActivity({adapter,prompt:'Audit energy'})).rejects.toMatchObject({code:'AI_UNAVAILABLE'});expect(adapter.calls).toHaveLength(1);
 });
 it('rejects forbidden learner context before contacting a provider',async()=>{
  const adapter=mockAdapter([]);await expect(generateActivity({adapter,prompt:'Audit energy',context:{learnerUid:'private',evidence:'private'}})).rejects.toThrow('Context keys not allowed');expect(adapter.calls).toHaveLength(0);
 });
 it('regenerates only one block and preserves the rest of the activity',async()=>{
  const spec=sampleActivity();const block={...spec.blocks[0],text:'A clearer introduction'};const adapter=mockAdapter([JSON.stringify(block)]);
  const result=await regenerateActivityBlock({adapter,spec,blockIndex:0,instruction:'Use simpler words'});
  expect(result.spec.blocks[0].text).toBe(block.text);expect(result.spec.blocks.slice(1)).toEqual(spec.blocks.slice(1));
 });
 it('repairs a changed block type and rejects broken chart references',async()=>{
  const spec=sampleActivity();const adapter=mockAdapter([JSON.stringify({type:'reflection',prompt:'Wrong type'}),JSON.stringify(spec.blocks[0])]);
  await regenerateActivityBlock({adapter,spec,blockIndex:0,instruction:'Improve'});expect(adapter.calls).toHaveLength(2);
  const invalid=mockAdapter([JSON.stringify({...spec.blocks[3],columns:[{key:'other',label:'Other'}]})]);
  await expect(regenerateActivityBlock({adapter:invalid,spec,blockIndex:3,instruction:'Change columns'})).rejects.toMatchObject({code:'AI_BAD_OUTPUT'});
 });
 it('rejects oversized instructions and out-of-range blocks without provider calls',async()=>{
  const adapter=mockAdapter([]);await expect(regenerateActivityBlock({adapter,spec:sampleActivity(),blockIndex:0,instruction:'a'.repeat(501)})).rejects.toMatchObject({code:'VALIDATION'});
  await expect(regenerateActivityBlock({adapter,spec:sampleActivity(),blockIndex:99,instruction:'Improve'})).rejects.toThrow('out of range');expect(adapter.calls).toHaveLength(0);
 });
});
