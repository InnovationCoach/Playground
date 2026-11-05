import { it, expect } from 'vitest';
import { makePractice, validatePractice, missionsForGrade } from '../src/features/universe/firstContact/expeditions.js';
import { signalChallenge, suggestedGrade } from '../src/features/universe/firstContact/curriculum.js';
import { newAdventure, play } from '../src/features/universe/firstContact/adventure.js';
it('recomputes answers, rejects invalid grade-level datasets and pins the standard',()=>{
 for(const grade of [6,9,12]){
  const m=makePractice(3,grade);
  expect(validatePractice({...m,answer:999,standard:{id:'fake'}},grade).answer).toBe((m.power-m.uncertainty)*m.hours*m.efficiency/100);
  expect(validatePractice({...m,power:Infinity},grade)).toBeNull();
  expect(validatePractice({...m,hours:2.5},grade)).toBeNull();
  expect(validatePractice({...m,title:'x'.repeat(81)},grade)).toBeNull();
  for(let i=0;i<24;i++)expect(validatePractice(makePractice(i,grade),grade)).not.toBeNull();
 }
 expect(validatePractice(makePractice(0,12),6)).toBeNull();
 expect(validatePractice(makePractice(0,6),12)).toBeNull();
});
it('covers all grades with NGSS targets, STEAM extensions and different evidence demands',()=>{
 for(let grade=6;grade<=12;grade++)for(const m of missionsForGrade(grade)){
  expect(m.standard.id.startsWith(grade<=8?'MS-':'HS-')).toBe(true);
  expect(m.options[m.answer]).toBeTruthy();expect(m.extension.length).toBeGreaterThan(30);
  expect(m.steam).toContain('Arts:');expect(m.hint).toBeTruthy();
 }
 expect(signalChallenge(6).correct).toBe('jetty');
 expect(signalChallenge(12).correct).toBe('rock');
 expect(missionsForGrade(6)[0].data).not.toBe(missionsForGrade(12)[0].data);
});
it('age suggests a grade without locking out older or younger learners',()=>{
 expect(suggestedGrade(11)).toBe(6);expect(suggestedGrade(17)).toBe(12);expect(suggestedGrade(19)).toBe(12);
 expect(suggestedGrade(4)).toBeNull();expect(suggestedGrade(NaN)).toBeNull();
 let s=play(newAdventure(),{type:'set-grade',grade:12});expect(s.grade).toBe(12);
 s=play(s,{type:'meet'});expect(play(s,{type:'set-grade',grade:6})).toBe(s);
 s=play(s,{type:'place',site:'jetty'});s=play(s,{type:'compare',site:'rock'});s=play(s,{type:'finish-card',reason:'compare'});
 expect(s.bestScore).toBe(30);
});
