import { competencyById } from './competencies.js';

/** Validate stable framework IDs; display codes deliberately are not identities. */
export function validateCompetencyIds(value, { label = 'Competencies', max = 20 } = {}) {
  if (value === undefined) return [];
  const invalid = message => { const error = new Error(message); error.code = 'VALIDATION'; throw error; };
  if (!Array.isArray(value)) invalid(`${label} must be a list of framework IDs.`);
  if (value.length > max) invalid(`${label} allows at most ${max} entries. Nothing has been saved.`);
  if (value.some(id => typeof id !== 'string' || !competencyById(id))) invalid(`${label} contains an unknown competency. Choose from the PBL framework.`);
  if (new Set(value).size !== value.length) invalid(`${label} contains duplicate competency IDs.`);
  return [...value];
}
