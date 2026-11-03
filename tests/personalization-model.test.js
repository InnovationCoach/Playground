import {describe,it,expect} from 'vitest';
import {defaults,normalizeSettings,normalizeItem,moveWidget,PALETTES,BACKGROUNDS,previewItems} from '../src/features/personalization/personalizationModel.js';
const settings=()=>defaults();
function luminance(hex) {const c=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];}
describe('Structured personalization',()=>{
  it('stores only supported fields and keeps goals out of portfolio settings',()=>{
    const value=settings();value.dashboard.goals='Private ambition';value.portfolio.goals='Must not leak';value.portfolio.html='<script>bad()</script>';
    const normalized=normalizeSettings(value,'learner');expect(normalized.dashboard.goals).toBe('Private ambition');expect(normalized.portfolio).not.toHaveProperty('goals');expect(normalized.portfolio).not.toHaveProperty('html');
  });
  it('rejects unknown colors, layouts and duplicate or missing widgets',()=>{
    for(const mutate of [d=>d.dashboard.appearance.accent='#abc',d=>d.dashboard.appearance.accent=['plum'],d=>d.portfolio.layout='html',d=>d.dashboard.widgetOrder=['notes','notes','goals','about']]) {const value=settings();mutate(value);expect(()=>normalizeSettings(value,'learner')).toThrow();}
  });
  it('only accepts media uploaded by the owner',()=>{const value=settings();value.portfolio.appearance.picture={path:'learnerMedia/other/id/p.png',name:'p.png'};expect(()=>normalizeSettings(value,'learner')).toThrow();});
  it('does not accept active script URLs or arbitrary audiences',()=>{
    const item={title:'Code',kind:'code',body:'Hello',audiences:[],link:'javascript:alert(1)'};expect(()=>normalizeItem(item,'learner')).toThrow();expect(()=>normalizeItem({...item,link:'https://example.org',audiences:['public']},'learner')).toThrow();
  });
  it('moves widgets without mutating the original and clamps invalid moves',()=>{const order=defaults().dashboard.widgetOrder;expect(moveWidget(order,'notes',0)).toEqual(['notes','learning','goals','about']);expect(order[0]).toBe('learning');expect(moveWidget(order,'notes',-1)).toBe(order);});
  it('previews only the work chosen for each audience',()=>{const items=[{id:'secret',audiences:[]},{id:'coach',audiences:['coaches']},{id:'class',audiences:['classmates','wider']}];expect(previewItems(items,'coaches').map(i=>i.id)).toEqual(['coach']);expect(previewItems(items,'owner')).toHaveLength(3);});
  it('all preset text and accents meet WCAG AA contrast against all backgrounds',()=>{for(const palette of Object.values(PALETTES))for(const background of Object.values(BACKGROUNDS))for(const foreground of [palette.accent,palette.ink])expect((luminance(background)+.05)/(luminance(foreground)+.05)).toBeGreaterThanOrEqual(4.5);});
});
