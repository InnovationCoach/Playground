export const PRESENTATION_ADAPTER_VERSION = '1.0.0';

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
