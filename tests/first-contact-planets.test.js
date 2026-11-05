import {describe,it,expect} from 'vitest';
import {newAdventure,play} from '../src/features/universe/firstContact/adventure.js';
import {WORLDS,baseChallenge,gravityRatio,stellarFluxRatio,tidalRatio} from '../src/features/universe/firstContact/planetExpeditions.js';
function assembled(grade=6){let s=newAdventure(grade);for(const a of [{type:'meet'},{type:'place',site:'rock'},{type:'compare',site:grade<=8?'jetty':'rock'},{type:'finish-card',reason:'compare'},{type:'next-reward'},...['frame','drive','nav'].map(part=>({type:'fit',part})),{type:'build'}])s=play(s,a);return s;}
describe('planet expeditions',()=>{
 it('separates surface gravity, incoming starlight and tidal forcing',()=>{expect(gravityRatio(1,1)).toBe(1);expect(gravityRatio(1,2)).toBe(.25);expect(stellarFluxRatio(1,2)).toBe(.25);expect(tidalRatio(1,2)).toBe(.125);});
 it('requires a ship and a landing guide',()=>{expect(play(newAdventure(),{type:'land',planet:'ignis'}).stage).toBe('shore');let s=assembled();expect(s.stage).toBe('flight');s=play(s,{type:'land',planet:'ignis'});expect(s.stage).toBe('landing-guide');expect(play(s,{type:'start-base-challenge',index:0})).toBe(s);});
 it.each([6,9,12])('completes independent bases at grade %s, with evidence and installation gates',grade=>{
  let s=assembled(grade);
  for(const world of WORLDS){
   s=play(s,{type:'land',planet:world.id});for(let i=0;i<3;i++)s=play(s,{type:'guide-next'});expect(s.stage).toBe('surface');
   expect(play(s,{type:'install-base',index:0})).toBe(s);expect(play(s,{type:'start-base-challenge',index:2})).toBe(s);
   for(let index=0;index<3;index++){
    const c=baseChallenge(world.id,index,grade);expect(c.standard.id.startsWith(grade<=8?'MS':'HS')).toBe(true);
    s=play(s,{type:'start-base-challenge',index});s=play(s,{type:'justify-base',choice:1});expect(s.bases[world.id].completed).not.toContain(index);
    s=play(s,{type:'choose-base',choice:c.answer});s=play(s,{type:'justify-base',choice:0});expect(s.bases[world.id].completed).not.toContain(index);
    s=play(s,{type:'justify-base',choice:1});expect(s.bases[world.id].completed).toContain(index);
    const count=s.bases[world.id].completed.length;s=play(s,{type:'justify-base',choice:1});expect(s.bases[world.id].completed.length).toBe(count);
    s=play(s,{type:'base-surface'});s=play(s,{type:'install-base',index});expect(s.bases[world.id].installed).toContain(index);
   }
   s=play(s,{type:'launch'});
  }
  expect(Object.values(s.bases).every(b=>b.installed.length===3)).toBe(true);
  s=play(s,{type:'land',planet:'thalassa'});expect(s.stage).toBe('surface');
 });
});
