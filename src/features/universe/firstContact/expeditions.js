import { gradeMission, gradeLevel, standardFor } from './curriculum.js';
export const PARTS = [
 { id: 'frame', name: 'Tideglass frame', purpose: 'Protects the crew and holds the ship together.' },
 { id: 'drive', name: 'Ion drive', purpose: 'Provides thrust to change the ship’s motion.' },
 { id: 'nav', name: 'Navigation array', purpose: 'Receives signals to help find a route.' }
];
const MISSION_CATALOG = [
 {id:'beacon-pattern',world:'Thalassa',title:'The beacon’s reply',reward:{crystal:2},gear:'lens'},
 {id:'cargo-balance',world:'Thalassa',title:'Supplies for the outer pier',reward:{alloy:3},gear:'rack'},
 {id:'ignis-power',world:'Ignis',title:'Light for the Emberkin',reward:{cell:2},needs:'beacon-pattern'},
 {id:'ignis-fair-test',world:'Ignis',title:'A fair test for two panels',reward:{alloy:2,cell:1},needs:'ignis-power'}
];
export const RECIPES = [
 {id:'solar', name:'Solar wings', cost:{alloy:2,cell:2}, detail:'Fit a pair of energy-collecting wings.'},
 {id:'scanner', name:'Beacon scanner', cost:{crystal:2,alloy:1}, detail:'Fit a crystal scanner above your navigation array.'}
];
export const missionsForGrade = (grade=6) => MISSION_CATALOG.map(m=>gradeMission(m,grade));
export const missionById = (id,grade=6) => missionsForGrade(grade).find(m => m.id === id);
export function available(m, state) { return state.repaired && (!m.gear || state.owned.includes(m.gear)) && (!m.needs || state.completed.includes(m.needs)); }
export function canCraft(recipe, state) { return !state.upgrades.includes(recipe.id) && Object.entries(recipe.cost).every(([k,v]) => state.resources[k] >= v); }

// Bounded energy-design variations. Generated values never control rewards or standard IDs.
export function makePractice(index, grade = 6) {
 const level=gradeLevel(grade), power=20+(index%6)*5, hours=3+index%3, efficiency=level===0?100:80, uncertainty=level===2?5:0;
 return validatePractice({title:'Workshop energy budget',story:'Estimate the energy available to a fictional workshop before choosing its equipment.',power,hours,efficiency,uncertainty},grade);
}
export function validatePractice(value,grade=6) {
 if(!value || typeof value.title!=='string' || value.title.length<3 || value.title.length>80 || typeof value.story!=='string' || value.story.length<10 || value.story.length>400) return null;
 const {power,hours,efficiency,uncertainty}=value,level=gradeLevel(grade);
 if(!Number.isInteger(power)||power<10||power>100||!Number.isInteger(hours)||hours<1||hours>8||!Number.isInteger(efficiency)||efficiency<50||efficiency>100||!Number.isInteger(uncertainty)||uncertainty<0||uncertainty>=power) return null;
 if((level===0 && (efficiency!==100 || uncertainty!==0)) || (level===1 && (efficiency===100 || uncertainty!==0)) || (level===2 && (efficiency===100 || uncertainty===0))) return null;
 const answer=Number(((power-uncertainty)*hours*efficiency/100).toFixed(2));
 return {title:value.title,story:value.story,power,hours,efficiency,uncertainty,answer,standard:standardFor(grade),grade};
}
