export const PRESENTATION_ADAPTER_VERSION = '1.0.1';

const SUPPORT_DESCRIPTIONS = Object.freeze({
  guided: 'Work step by step with examples, table starters and hints. Reveal a solution when you need it. Switching help keeps your work.',
  independent: 'Choose your approach from the full evidence. Examples, starters, hints and solutions are always available. Switching help keeps your work.'
});

export const getSupportDescription = mode => SUPPORT_DESCRIPTIONS[mode] || '';

export function getMissionDecision(mission) {
  if (mission.id === 'thalassa-wind-survey') {
    return 'Recommend Plan A, Plan B, or ask for more evidence. Explain your criteria and revise your recommendation after the lower-wind test.';
  }
  return mission.decision;
}

/**
 * Layout clarification for the accepted draft, without mutating its hashed data.
 * A time total has no summed output fraction; a dimensionless CF has no hours.
 * These cells are given labels, so the editor never requires meaningless work.
 * Task identity, criteria, numerical references and evidence rules stay intact.
 */
export function getTableTemplate(route, partId) {
  const template = route.tableTemplates?.[partId];
  if (!template) return null;
  if (route.taskId !== 'wind-capacity-factor' || partId !== 'weighted-results') return template;
  const nonApplicable = { total: [2], 'capacity-factors': [1, 3] };
  return {
    ...template,
    presentationAdapterVersion: PRESENTATION_ADAPTER_VERSION,
    rows: template.rows.map(row => ({
      ...row,
      cells: row.cells.map((cell, index) => nonApplicable[row.id]?.includes(index)
        ? { value: 'Not applicable', editable: false }
        : { ...cell })
    }))
  };
}
