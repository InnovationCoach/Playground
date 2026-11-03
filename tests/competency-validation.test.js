import { describe, expect, it } from 'vitest';
import { validateCompetencyIds } from '../src/features/pbl/content/competencyValidation.js';
import { emptyProgram, validateProgram } from '../src/features/school/programs/programSpec.js';

describe('Existing PBL competency contract', () => {
  it('keeps different competencies sharing a display code distinct', () => {
    expect(validateCompetencyIds(['ctps-01', 'ctps-09'])).toEqual(['ctps-01', 'ctps-09']);
  });
  it('rejects unknown IDs, display codes, duplicate IDs and over-limit arrays', () => {
    for (const ids of [['unknown'], ['2.1.1'], ['sdl-01', 'sdl-01'], null, 'sdl-01']) {
      expect(() => validateCompetencyIds(ids)).toThrow();
    }
    expect(() => validateCompetencyIds(['sdl-01', 'sdl-02'], { max: 1 })).toThrow('at most');
    expect(validateCompetencyIds(undefined)).toEqual([]);
  });
  it('preserves activity and simulation alignment through program validation', () => {
    const activity = { title: 'Investigate', outcome: 'Compare', instructions: 'Record observations.', milestoneId: 'explore', competencyIds: ['ctps-01', 'ctps-09'] };
    const program = { ...emptyProgram(), title: 'Investigation', drivingQuestion: 'What changes?', activities: [activity] };
    expect(validateProgram(program).activities[0].competencyIds).toEqual(activity.competencyIds);
    program.activities[0].competencyIds = ['unknown'];
    expect(() => validateProgram(program)).toThrow('PBL framework');
  });
});
