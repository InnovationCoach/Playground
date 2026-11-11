import { ReadTable } from './NotebookParts.jsx';

const CLASS_LABEL = {
  'synthetic-teaching-set': 'Synthetic teaching data',
  'fictional-world': 'Fictional world values',
  'observed-measurement': 'Observed measurement',
  'model-derived': 'Model output',
  'scientific-explanation': 'Scientific explanation'
};
const SKIP = new Set(['id', 'version', 'classification', 'attribution', 'sha256', 'records', 'plans', 'options', 'limitations', 'qualityNotes', 'stressCase', 'constraints', 'units', 'observationPeriod']);
// Authored keys carry their unit as a suffix (ratedPowerKW); show it the way a learner would write it.
const LABELS = {
  ratedPowerKW: 'Rated power (kW)',
  solarKWhDay: 'Solar energy (kWh/day)',
  deckAreaM2: 'Deck area (m²)',
  maxDeckAreaM2: 'Largest deck area (m²)',
  ionPanelAreaM2: 'Ion panel area (m²)',
  availableIonPanelAreaM2: 'Available ion panel area (m²)',
  demandKWhDay: 'Energy demand (kWh/day)',
  windKWEach: 'Power from each turbine (kW)',
  deltaVMps: 'Change in speed, Δv (m/s)',
  fluxAtIgnisWm2: 'Sunlight at Ignis (W/m²)',
  fluxAtThalassaWm2: 'Sunlight at Thalassa (W/m²)',
  panelElectricalWm2: 'Panel electrical output (W/m²)',
  standardGravityApproxMps2: 'Standard gravity, approx. (m/s²)'
};
const words = (k) => LABELS[k] || k.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase()).replace(/(?<=.) ([A-Z])(?=[a-z])/g, (m) => m.toLowerCase());
const show = (v) => (typeof v === 'number' ? v.toLocaleString('en-US', { maximumFractionDigits: 6 }) : String(v));

function rowsTable(caption, list) {
  // Worked results authored into the cards (reference, stress and provision values) are answers, not givens.
  const cols = Object.keys(list[0]).filter((k) => !/^(reference|stress|provision)|^upperInclusive$|^id$/.test(k) && list.every((r) => typeof r[k] !== 'object'));
  return <ReadTable caption={caption} columns={cols.map(words)} rows={list.map((r) => cols.map((c) => show(r[c])))} />;
}

/**
 * An authored dataset, labelled with its classification. Reference answers in the
 * data (`reference…` fields) are never shown here; learners work them out.
 */
export function DatasetView({ dataset: d }) {
  const scalars = Object.entries(d).filter(([k, v]) => !SKIP.has(k) && !/^reference/.test(k) && (typeof v === 'number' || typeof v === 'string'));
  const list = d.records || d.plans || d.options;
  return <section className="px-dataset" aria-label={`Evidence: ${d.id}`}>
    <p className="px-dataset-head"><span className="mx-tag">{CLASS_LABEL[d.classification] || d.classification}</span> </p>
    {d.attribution && <p className="px-fine">{d.attribution}</p>}
    {d.observationPeriod && <p className="px-fine">Period: {d.observationPeriod}</p>}
    {scalars.length > 0 && <dl className="px-dl">{scalars.map(([k, v]) => <div key={k}><dt>{words(k)}</dt><dd>{show(v)}</dd></div>)}</dl>}
    {d.constraints && <dl className="px-dl">{Object.entries(d.constraints).map(([k, v]) => <div key={k}><dt>{words(k)}</dt><dd>{show(v)}</dd></div>)}</dl>}
    {Array.isArray(list) && list.length > 0 && rowsTable(d.records ? 'Records' : d.plans ? 'Plan cards' : 'Options', list)}
    {d.stressCase && <p className="px-note">Test case “{d.stressCase.id}”: capacity factor {show(d.stressCase.capacityFactor)}. {d.stressCase.otherAssumptions}</p>}
    {(d.qualityNotes || d.limitations) && <ul className="px-notes">{[...(d.qualityNotes || []), ...(d.limitations || [])].map((n) => <li key={n}>{n}</li>)}</ul>}
    <details className="px-fine"><summary>Technical details</summary><small>{d.id} · version {d.version}</small></details>
  </section>;
}
