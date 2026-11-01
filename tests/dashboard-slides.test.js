import { startHere, nextGoalStep, programJourney } from '../src/features/dashboard/learningGuidance.js';
import { describe, it, expect } from 'vitest';
import { hydratePrefs } from '../src/features/dashboard/dashboardModel.js';
import { hydrateSlides, SLIDE_IDS, moveSlide, splitGoals, TOOL_SLIDES } from '../src/features/dashboard/slideModel.js';

describe('five-slide dashboard preferences', () => {
  it('defaults to the five essential slides and preserves legacy personal spaces', () => {
    const stored = { pages: [{ name: 'Quiet desk', layout: 'slider', order: ['notes', 'focus'], hidden: ['badges'], sizes: { notes: 'wide' } }], font: 'serif', calm: true };
    const prefs = hydratePrefs(stored);
    expect(prefs.slideOrder).toEqual(SLIDE_IDS);
    expect(prefs.dashboardLayout).toBe('slides');
    expect(prefs.pages[0]).toMatchObject({ name: 'Quiet desk', layout: 'slider', hidden: ['badges'], sizes: { notes: 'wide' } });
    expect(prefs.pages[0].order.slice(0, 2)).toEqual(['notes', 'focus']);
    expect(prefs.font).toBe('serif'); expect(prefs.calm).toBe(true);
  });
  it('never lets damaged preferences hide essential learning slides', () => {
    const prefs = hydrateSlides({ slideOrder: ['universe', 'universe', 'unknown'], slideTitles: { daily: ' ', goals: 'A'.repeat(100) }, dashboardLayout: 'broken' });
    expect(prefs.slideOrder).toHaveLength(5); expect(new Set(prefs.slideOrder)).toEqual(new Set(SLIDE_IDS));
    expect(prefs.slideOrder[0]).toBe('universe');
    expect(prefs.slideTitles.daily).toBe('My Daily Learning Plan'); expect(prefs.slideTitles.goals).toHaveLength(40);
    expect(prefs.dashboardLayout).toBe('slides');
  });
  it('round-trips saved layout, slide order and titles without losing existing pages', () => {
    let prefs = hydratePrefs({ pages: [{ name: 'Ideas' }], dashboardLayout: 'grid' });
    prefs = moveSlide(prefs, 'creative', -1);
    prefs.slideTitles.creative = 'My thinking room';
    const result = hydratePrefs(JSON.parse(JSON.stringify(prefs)));
    expect(result.slideOrder.indexOf('creative')).toBe(2);
    expect(result.slideTitles.creative).toBe('My thinking room');
    expect(result.pages[0].name).toBe('Ideas'); expect(result.dashboardLayout).toBe('grid');
    expect(moveSlide(result, result.slideOrder[0], -1)).toBe(result);
  });
  it('gives every existing optional tool one primary slide', () => {
    expect(Object.keys(TOOL_SLIDES)).toHaveLength(7);
    expect(TOOL_SLIDES.notes).toBe('creative'); expect(TOOL_SLIDES.focus).toBe('creative');
    expect(TOOL_SLIDES.badges).toBe('universe'); expect(TOOL_SLIDES.readiness).toBe('progress');
  });
  it('keeps achieved goals without inventing completion for a goal with no steps', () => {
    const empty = { id: 'empty', done: false, steps: [] }, checked = { id: 'checked', done: false, steps: [{ done: true }] }, explicit = { id: 'explicit', done: true, steps: [{ done: false }] };
    const result = splitGoals({ goals: [empty, checked, explicit] });
    expect(result.active).toEqual([empty]); expect(result.completed).toEqual([checked, explicit]);
  });
});


describe('record-based learning guidance', () => {
  const data = { state: 'ready', courses: [], warnings: [] };
  const input = { data, today: [], checked: new Set(), goalsLoaded: true, hasGoals: true };
  const course = { program: { id: 'garden', title: 'Garden project', phases: [
    { id: 'explore', title: 'Explore', sessions: [{sessionNumber:1}] },
    { id: 'test', title: 'Test', sessions: [{sessionNumber:2}], evidence: ['Test notes'] }
  ] }, summary: { pct:50, byPhase:{explore:{complete:true}}, next: { sessionNumber:2, title:'Try a sensor', activities:['Compare two readings'], evidenceToCollect:{prompt:'A labelled result chart'} } }, progressUnavailable:false };
  it('prioritises an unchecked personal task and never suggests today’s checked task again', () => {
    const task = {id:'step:g:s',kind:'step',text:'Draw my idea',goal:'Build a prototype'};
    const records = {...data,courses:[course]};
    expect(startHere({...input,data:records,today:[task]})).toMatchObject({title:'Draw my idea',href:'#/goals'});
    expect(startHere({...input,data:records,today:[task],checked:new Set([task.id])})).toMatchObject({title:'Try a sensor',href:'#/pbl/programs/garden/plan'});
  });
  it('does not use unavailable project progress to recommend a session', () => {
    const result = startHere({...input,data:{...data,courses:[{...course,progressUnavailable:true}]}});
    expect(result.href).toBe('#/courses'); expect(result.title).not.toBe('Try a sensor');
    expect(startHere({...input,goalsLoaded:false}).loading).toBe(true);
  });
  it('uses assigned project records before inviting a student to create a goal', () => {
    expect(startHere({...input,hasGoals:false,data:{...data,courses:[{...course,summary:null}]}}).href).toBe('#/pbl/programs/garden/plan');
    expect(startHere({...input,hasGoals:false}).action).toBe('Set my first goal');
  });
  it('derives the stage from this program’s session membership and preserves supplied evidence', () => {
    expect(programJourney(course)).toMatchObject({current:{id:'test'},task:'Compare two readings',evidence:'A labelled result chart'});
    expect(programJourney(course).stages.map(s=>s.state)).toEqual(['done','current']);
  });
  it('never substitutes a generic term stage or fabricates evidence on missing or failed reads', () => {
    expect(programJourney({...course,program:{id:'other',phases:[]},summary:null})).toMatchObject({current:null,task:'',evidence:'',stages:[]});
    expect(programJourney({...course,progressUnavailable:true})).toMatchObject({unavailable:true,current:null,stages:[],task:'',evidence:''});
  });
  it('shows only a real unfinished step on an active goal', () => {
    const goal = {done:false,steps:[{text:'Done',done:true},{text:'Next',done:false}]};
    expect(nextGoalStep(goal).text).toBe('Next');
    expect(nextGoalStep({...goal,done:true})).toBeNull();
    expect(nextGoalStep({done:false,steps:[]})).toBeNull();
  });
});
