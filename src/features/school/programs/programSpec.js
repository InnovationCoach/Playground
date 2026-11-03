import { validateSimulation } from '../simulationModel.js';
import { validateCompetencyIds } from '../../pbl/content/competencyValidation.js';

export const emptyProgram = () => ({ title: '', drivingQuestion: '', gradeBand: '', overview: '', milestones: [{id:'explore',title:'Explore and predict'},{id:'experiment',title:'Build and experiment'},{id:'reflect',title:'Reflect and share'}], activities: [], simulations: [] });
export function validateProgram(input) {
  const error = message => { const e = new Error(message); e.code = 'VALIDATION'; throw e; };
  if (!input || typeof input !== 'object' || Array.isArray(input)) error('A structured program is required.');
  const text = (value, label, max, optional = false) => {
    if (optional && (value == null || value === '')) return '';
    if (typeof value !== 'string' || !value.trim() || value.length > max) error(`${label} must contain 1–${max} characters.`);
    return value.trim();
  };
  if (!Array.isArray(input.milestones) || input.milestones.length < 1 || input.milestones.length > 12) error('Choose 1–12 milestones.');
  const milestones = input.milestones.map(m => {
    if (!m || typeof m.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(m.id)) error('Milestone identifiers must use letters, numbers, underscores or hyphens.');
    return { id: m.id, title: text(m.title, 'Milestone title', 200) };
  });
  if (new Set(milestones.map(m => m.id)).size !== milestones.length) error('Milestone identifiers must be unique.');
  const section = (key, simulation) => {
    const list = input[key] ?? [];
    if (!Array.isArray(list) || list.length > 20) error(`Choose up to 20 ${key}.`);
    return list.map(item => {
      if (!item || !milestones.some(m => m.id === item.milestoneId)) error('Every activity and simulation must link to a program milestone.');
      const lesson = {title:text(item.title,'Lesson title',200),outcome:text(item.outcome,'Learning outcome',1000),instructions:text(item.instructions,'Instructions',10000),milestoneId:item.milestoneId,competencyIds:validateCompetencyIds(item.competencyIds)};
      if (simulation) {
        try { lesson.simulation = validateSimulation(item.simulation); } catch (e) { error(e.message); }
        if (!lesson.simulation) error('Simulation settings are required.');
      }
      return lesson;
    });
  };
  const result = { title:text(input.title,'Program title',200), drivingQuestion:text(input.drivingQuestion,'Driving question',1000), gradeBand:text(input.gradeBand,'Grade band',100,true), overview:text(input.overview,'Program overview',5000,true), milestones, activities:section('activities',false), simulations:section('simulations',true) };
  if (JSON.stringify(result).length > 180000) error('The program is too large. Shorten lesson instructions.');
  return result;
}
