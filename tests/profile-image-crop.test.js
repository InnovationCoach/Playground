import {describe,it,expect} from 'vitest';
import {cropRect} from '../src/features/personalization/imageCrop.js';
describe('Bounded profile image crops',()=>{
 it('centres a square crop in a landscape photo',()=>{expect(cropRect(1200,800,1)).toEqual({x:200,y:0,width:800,height:800});});
 it('preserves cover aspect and keeps extreme positions inside the original',()=>{for(const zoom of [1,2,3])for(const x of [0,100])for(const y of [0,100]){const r=cropRect(600,1200,8/3,zoom,x,y);expect(r.width/r.height).toBeCloseTo(8/3);expect(r.x).toBeGreaterThanOrEqual(0);expect(r.y).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(600);expect(r.y+r.height).toBeLessThanOrEqual(1200);}});
 it('clamps zoom and position and rejects unreadable dimensions',()=>{expect(cropRect(100,100,1,10,-10,150)).toEqual(cropRect(100,100,1,3,0,100));expect(()=>cropRect(0,100,1)).toThrow();expect(()=>cropRect(100,100,NaN)).toThrow();});
});
