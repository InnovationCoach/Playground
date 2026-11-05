import { describe, it, expect } from 'vitest';
import { newAdventure, play, credits } from '../src/features/universe/firstContact/adventure.js';
const step = (s, type, extra = {}) => { const next=play(s,{type,...extra}); return type==='build' && next.stage==='flight' ? play(next,{type:'return-workshop'}) : next; };
const build = s => ['frame','drive','nav'].reduce((v,part)=>step(v,'fit',{part}),s);
function finish(reason = 'one') {
 let s = step(newAdventure(), 'meet');
 s = step(s, 'place', { site: 'rock' });
 s = step(s, 'compare', { site: 'jetty' });
 return step(s, 'finish-card', { reason });
}
describe('first contact rewards', () => {
 it('awards the key independently of score', () => {
  const s = finish('looks'); expect(s.translated).toBe(true); expect(s.bestScore).toBe(10);
 });
 it('credits only improvement, preserving purchases', () => {
  let s = finish(); expect(s.bestScore).toBe(25);
  s = step(build(step(s, 'next-reward')), 'build');
  s = step(s, 'buy', { item: 'lens' }); expect(credits(s)).toBe(10);
  expect(step(s, 'buy', { item: 'lens' })).toBe(s);
  expect(step(s, 'buy', { item: 'rack' })).toBe(s);
  s = step(s, 'practice'); s = step(s, 'compare', { site: 'jetty' }); s = step(s, 'finish-card', { reason: 'compare' });
  expect(s.bestScore).toBe(30); expect(s.lastResult.gained).toBe(5); expect(credits(s)).toBe(15);
  s = step(s, 'revise'); s = step(s, 'compare', { site: 'jetty' }); s = step(s, 'finish-card', { reason: 'compare' });
  expect(s.lastResult.gained).toBe(0);
 });
 it('requires gear for travel and rejects skipping the mission', () => {
  const s = newAdventure(); expect(step(s, 'build')).toBe(s); expect(step(s, 'finish-card', { reason: 'compare' })).toBe(s);
  let dock = step(build(step(finish(), 'next-reward')), 'build');
  expect(step(dock, 'travel', { destination: 'beacon' })).toBe(dock);
  dock = step(dock, 'buy', { item: 'lens' }); dock = step(dock, 'travel', { destination: 'beacon' });
  expect(step(dock, 'finish-trip').visitedBeacon).toBe(true);
 });
});

describe('expedition progression',()=>{
 it('requires all components before launching',()=>{
  const s=step(finish(),'next-reward');expect(step(s,'build')).toBe(s);
  expect(step(build(s),'build').repaired).toBe(true);
 });
 it('awards materials once and spends them when crafting',()=>{
  let s=step(build(step(finish('compare'),'next-reward')),'build');
  expect(step(s,'open-mission',{id:'ignis-power'})).toBe(s);
  s=step(s,'buy',{item:'lens'});s=step(s,'open-mission',{id:'beacon-pattern'});
  s=step(s,'answer-mission',{choice:0});expect(s.completed).toEqual([]);
  s=step(s,'answer-mission',{choice:2});expect(s.resources.crystal).toBe(2);
  s=step(s,'answer-mission',{choice:2});expect(s.resources.crystal).toBe(2);
  s=step(s,'leave-mission');s=step(s,'buy',{item:'rack'});
  s=step(s,'open-mission',{id:'cargo-balance'});s=step(s,'answer-mission',{choice:0});s=step(s,'leave-mission');
  s=step(s,'craft',{id:'scanner'});expect(s.resources).toEqual({alloy:2,crystal:0,cell:0});expect(s.upgrades).toContain('scanner');
  expect(step(s,'craft',{id:'scanner'})).toBe(s);
  expect(step(s,'craft',{id:'solar'})).toBe(s);
  expect(step(s,'open-mission',{id:'ignis-power'}).stage).toBe('expedition');
 });
});
