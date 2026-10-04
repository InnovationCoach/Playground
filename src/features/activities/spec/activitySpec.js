/**
 * Activity spec v1: the shared contract for coach-built STEAM activities.
 *
 * An activity is DATA, never code. AI providers and coaches both produce this
 * shape; the server stores only what validateActivity() returns, and the
 * student player renders every string as plain text. Nothing in a spec is ever
 * executed or injected as HTML.
 *
 * Contract: docs/implementation/COACH-AI-ACTIVITIES-CONTRACT.md
 * Tests: tests/activity-spec.test.js
 */
import { validateSimulation } from '../../school/simulationModel.js';

export const SPEC_VERSION = 1;
export const AGE_BANDS = ['13-15', '16-18'];
export const BLOCK_TYPES = ['intro', 'steps', 'prediction', 'simulation', 'dataTable', 'chart', 'check', 'code', 'reflection'];
export const CODE_LANGUAGES = ['micropython', 'makecode-text'];
export const AI_PROVIDERS = ['gemini', 'anthropic', 'openai'];

export const LIMITS = {
  specBytes: 50_000,
  title: 120,
  summary: 500,
  minMinutes: 10,
  maxMinutes: 240,
  standards: 10,
  standard: 40,
  materials: 25,
  materialName: 80,
  quantity: 40,
  safetyNote: 200,
  hazards: 10,
  hazard: 120,
  safetyNotes: 1000,
  resources: 10,
  resourceTitle: 120,
  url: 500,
  blocks: 20,
  introText: 2000,
  steps: 15,
  stepText: 500,
  evidenceHint: 200,
  question: 300,
  choices: 6,
  choice: 160,
  columns: 8,
  columnLabel: 60,
  unit: 20,
  rows: 30,
  checkQuestions: 8,
  explanation: 500,
  code: 6000,
  codeExplanation: 1000,
  reflection: 500,
  model: 80,
  uid: 160
};

/** Thrown by validateActivity(); `errors` lists every problem with its path. */
export class ActivityValidationError extends Error {
  constructor(errors) {
    super(errors.map((e) => `${e.path}: ${e.message}`).join('\n'));
    this.name = 'ActivityValidationError';
    this.code = 'VALIDATION';
    this.errors = errors;
  }
}

// Control characters other than tab and newline are removed; everything else,
// including "<script>", stays as literal text that the player escapes.
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function makeChecker() {
  const errors = [];
  const fail = (path, message) => { errors.push({ path, message }); return undefined; };
  const text = (value, path, max, { required = true } = {}) => {
    if (value === undefined || value === null || value === '') return required ? fail(path, 'is required.') : undefined;
    if (typeof value !== 'string') return fail(path, 'must be text.');
    const clean = value.replace(CONTROL, '').trim();
    if (!clean) return required ? fail(path, 'is required.') : undefined;
    if (clean.length > max) return fail(path, `must be ${max} characters or fewer.`);
    return clean;
  };
  const int = (value, path, min, max) => {
    if (!Number.isInteger(value) || value < min || value > max) return fail(path, `must be a whole number from ${min} to ${max}.`);
    return value;
  };
  const list = (value, path, min, max, { required = true } = {}) => {
    if (value === undefined || value === null) return required && min > 0 ? fail(path, `needs at least ${min} item${min === 1 ? '' : 's'}.`) : [];
    if (!Array.isArray(value)) return fail(path, 'must be a list.');
    if (value.length < min) return fail(path, `needs at least ${min} item${min === 1 ? '' : 's'}.`);
    if (value.length > max) return fail(path, `allows at most ${max} items.`);
    return value;
  };
  const oneOf = (value, path, allowed) => (allowed.includes(value) ? value : fail(path, `must be one of: ${allowed.join(', ')}.`));
  const url = (value, path) => {
    const s = text(value, path, LIMITS.url);
    if (s === undefined) return undefined;
    try {
      const u = new URL(s);
      if (u.protocol !== 'https:' || u.username || u.password) return fail(path, 'must be an https:// link without credentials.');
      return u.href;
    } catch {
      return fail(path, 'must be a valid https:// link.');
    }
  };
  return { errors, fail, text, int, list, oneOf, url };
}

function cleanBlock(block, i, c, tableColumns) {
  const p = `blocks[${i}]`;
  if (!isObject(block)) return c.fail(p, 'must be an object.');
  const type = c.oneOf(block.type, `${p}.type`, BLOCK_TYPES);
  if (!type) return undefined;
  switch (type) {
    case 'intro':
      return { type, text: c.text(block.text, `${p}.text`, LIMITS.introText) };
    case 'steps': {
      const items = c.list(block.items, `${p}.items`, 1, LIMITS.steps) || [];
      return {
        type,
        items: items.map((item, j) => {
          if (!isObject(item)) return c.fail(`${p}.items[${j}]`, 'must be an object.');
          const out = { text: c.text(item.text, `${p}.items[${j}].text`, LIMITS.stepText) };
          const hint = c.text(item.evidenceHint, `${p}.items[${j}].evidenceHint`, LIMITS.evidenceHint, { required: false });
          if (hint) out.evidenceHint = hint;
          return out;
        })
      };
    }
    case 'prediction': {
      const out = { type, question: c.text(block.question, `${p}.question`, LIMITS.question) };
      if (block.choices !== undefined) {
        const choices = c.list(block.choices, `${p}.choices`, 2, LIMITS.choices) || [];
        out.choices = choices.map((ch, j) => c.text(ch, `${p}.choices[${j}]`, LIMITS.choice));
      }
      return out;
    }
    case 'simulation':
      try {
        const simulation = validateSimulation(block.simulation);
        if (!simulation) return c.fail(`${p}.simulation`, 'is required.');
        return { type, simulation };
      } catch (error) {
        return c.fail(`${p}.simulation`, error.message);
      }
    case 'dataTable': {
      const columns = c.list(block.columns, `${p}.columns`, 1, LIMITS.columns) || [];
      const seen = new Set();
      const out = {
        type,
        columns: columns.map((col, j) => {
          const cp = `${p}.columns[${j}]`;
          if (!isObject(col)) return c.fail(cp, 'must be an object.');
          let key = col.key;
          if (typeof key !== 'string' || !/^[a-z][A-Za-z0-9]{0,30}$/.test(key)) key = c.fail(`${cp}.key`, 'must start with a lowercase letter and use only letters and digits (max 31).');
          else if (seen.has(key)) key = c.fail(`${cp}.key`, 'must be unique in this table.');
          else seen.add(key);
          const column = { key, label: c.text(col.label, `${cp}.label`, LIMITS.columnLabel) };
          const unit = c.text(col.unit, `${cp}.unit`, LIMITS.unit, { required: false });
          if (unit) column.unit = unit;
          return column;
        }),
        rows: c.int(block.rows, `${p}.rows`, 1, LIMITS.rows)
      };
      tableColumns.set(i, seen);
      return out;
    }
    case 'chart': {
      const table = c.int(block.table, `${p}.table`, 0, LIMITS.blocks - 1);
      const columns = table !== undefined ? tableColumns.get(table) : undefined;
      if (table !== undefined && (table >= i || !columns)) c.fail(`${p}.table`, 'must point to an earlier dataTable block.');
      const axis = (name) => {
        const v = block[name];
        if (typeof v !== 'string' || !columns?.has(v)) return c.fail(`${p}.${name}`, 'must be a column key of the referenced table.');
        return v;
      };
      return { type, table, x: axis('x'), y: axis('y'), kind: block.kind === 'line' ? 'line' : 'bar' };
    }
    case 'check': {
      const questions = c.list(block.questions, `${p}.questions`, 1, LIMITS.checkQuestions) || [];
      return {
        type,
        questions: questions.map((q, j) => {
          const qp = `${p}.questions[${j}]`;
          if (!isObject(q)) return c.fail(qp, 'must be an object.');
          const choices = (c.list(q.choices, `${qp}.choices`, 2, LIMITS.choices) || []).map((ch, k) => c.text(ch, `${qp}.choices[${k}]`, LIMITS.choice));
          const answerIndex = c.int(q.answerIndex, `${qp}.answerIndex`, 0, Math.max(0, choices.length - 1));
          return { prompt: c.text(q.prompt, `${qp}.prompt`, LIMITS.question), choices, answerIndex, explanation: c.text(q.explanation, `${qp}.explanation`, LIMITS.explanation) };
        })
      };
    }
    case 'code': {
      // Code is shown as text with a copy button; it is never run in the browser.
      const code = typeof block.code === 'string' ? block.code.replace(CONTROL, '') : block.code;
      if (typeof code !== 'string' || !code.trim()) c.fail(`${p}.code`, 'is required.');
      else if (code.length > LIMITS.code) c.fail(`${p}.code`, `must be ${LIMITS.code} characters or fewer.`);
      return { type, language: c.oneOf(block.language, `${p}.language`, CODE_LANGUAGES), code: typeof code === 'string' ? code.replace(/\s+$/, '') : undefined, explanation: c.text(block.explanation, `${p}.explanation`, LIMITS.codeExplanation) };
    }
    case 'reflection':
      return { type, prompt: c.text(block.prompt, `${p}.prompt`, LIMITS.reflection) };
    default:
      return undefined;
  }
}

/**
 * Validate and normalise an activity spec. Returns a new object holding only
 * known fields; throws ActivityValidationError listing every problem.
 */
export function validateActivity(input) {
  const c = makeChecker();
  if (!isObject(input)) throw new ActivityValidationError([{ path: 'activity', message: 'must be an object.' }]);
  let size = 0;
  try { size = new TextEncoder().encode(JSON.stringify(input)).length; } catch { c.fail('activity', 'must be plain JSON.'); }
  if (size > LIMITS.specBytes) throw new ActivityValidationError([{ path: 'activity', message: `is too large (${size} bytes; limit ${LIMITS.specBytes}).` }]);
  if (input.version !== SPEC_VERSION) c.fail('version', `must be ${SPEC_VERSION}.`);

  const spec = {
    version: SPEC_VERSION,
    title: c.text(input.title, 'title', LIMITS.title),
    summary: c.text(input.summary, 'summary', LIMITS.summary),
    ageBand: c.oneOf(input.ageBand, 'ageBand', AGE_BANDS),
    durationMinutes: c.int(input.durationMinutes, 'durationMinutes', LIMITS.minMinutes, LIMITS.maxMinutes),
    standards: (c.list(input.standards, 'standards', 0, LIMITS.standards, { required: false }) || []).map((s, i) => c.text(s, `standards[${i}]`, LIMITS.standard)),
    materials: (c.list(input.materials, 'materials', 0, LIMITS.materials, { required: false }) || []).map((m, i) => {
      if (!isObject(m)) return c.fail(`materials[${i}]`, 'must be an object.');
      const out = { name: c.text(m.name, `materials[${i}].name`, LIMITS.materialName), quantity: c.text(m.quantity, `materials[${i}].quantity`, LIMITS.quantity) };
      const note = c.text(m.safetyNote, `materials[${i}].safetyNote`, LIMITS.safetyNote, { required: false });
      if (note) out.safetyNote = note;
      return out;
    }),
    safety: (() => {
      const s = input.safety === undefined ? {} : input.safety;
      if (!isObject(s)) return c.fail('safety', 'must be an object.');
      return {
        hazards: (c.list(s.hazards, 'safety.hazards', 0, LIMITS.hazards, { required: false }) || []).map((h, i) => c.text(h, `safety.hazards[${i}]`, LIMITS.hazard)),
        notes: c.text(s.notes, 'safety.notes', LIMITS.safetyNotes, { required: false }) || ''
      };
    })(),
    resources: (c.list(input.resources, 'resources', 0, LIMITS.resources, { required: false }) || []).map((r, i) => {
      if (!isObject(r)) return c.fail(`resources[${i}]`, 'must be an object.');
      return { title: c.text(r.title, `resources[${i}].title`, LIMITS.resourceTitle), url: c.url(r.url, `resources[${i}].url`) };
    }),
    blocks: [],
    provenance: (() => {
      const pv = input.provenance === undefined ? {} : input.provenance;
      if (!isObject(pv)) return c.fail('provenance', 'must be an object.');
      const out = { aiAssisted: pv.aiAssisted === true };
      if (pv.provider !== undefined) out.provider = c.oneOf(pv.provider, 'provenance.provider', AI_PROVIDERS);
      const model = c.text(pv.model, 'provenance.model', LIMITS.model, { required: false });
      if (model) out.model = model;
      const reviewedBy = c.text(pv.reviewedBy, 'provenance.reviewedBy', LIMITS.uid, { required: false });
      if (reviewedBy) out.reviewedBy = reviewedBy;
      if (pv.reviewedAt !== undefined) {
        out.reviewedAt = typeof pv.reviewedAt === 'string' && !Number.isNaN(Date.parse(pv.reviewedAt)) ? new Date(pv.reviewedAt).toISOString() : c.fail('provenance.reviewedAt', 'must be an ISO date-time.');
      }
      return out;
    })()
  };

  const blocks = c.list(input.blocks, 'blocks', 1, LIMITS.blocks) || [];
  const tableColumns = new Map();
  spec.blocks = blocks.map((block, i) => cleanBlock(block, i, c, tableColumns));

  if (c.errors.length) throw new ActivityValidationError(c.errors);
  return spec;
}

// ------------------------------------------------------------------ safety

/** Terms that need a safety note, with the youngest band they suit. */
export const HAZARD_TERMS = [
  { term: 'fire', pattern: /\b(fire|flame|candle|match(es)?|lighter|burn(ing)?)\b/i, minBand: '13-15' },
  { term: 'heat', pattern: /\b(hot water|boiling|hot plate|hotplate|stove|kettle|hot glue|glue gun)\b/i, minBand: '13-15' },
  { term: 'soldering', pattern: /\b(solder(ing)?|heat gun)\b/i, minBand: '16-18' },
  { term: 'chemicals', pattern: /\b(acid|bleach|ammonia|alkali|lye|sodium hydroxide|hydrogen peroxide|solvent|acetone)\b/i, minBand: '13-15' },
  { term: 'mains electricity', pattern: /\b(mains|wall socket|power outlet|220\s?v|230\s?v|240\s?v|110\s?v)\b/i, minBand: '16-18' },
  { term: 'batteries', pattern: /\b(lithium|li-?ion|lipo|short[- ]circuit)\b/i, minBand: '16-18' },
  { term: 'sharp tools', pattern: /\b(knife|knives|blade|scalpel|craft cutter|box cutter|saw|scissors)\b/i, minBand: '13-15' },
  { term: 'glass', pattern: /\b(glass|beaker|test tube|thermometer \(mercury\)|mercury)\b/i, minBand: '13-15' },
  { term: 'lasers', pattern: /\b(laser)\b/i, minBand: '16-18' },
  { term: 'working at height or outdoors near water', pattern: /\b(roof|ladder|river|canal|pond|lake|sea|ocean)\b/i, minBand: '13-15' }
];
const PERSONAL_DATA = [
  { kind: 'email address', pattern: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i },
  { kind: 'phone number', pattern: /(\+?\d[\d\s().-]{7,}\d)/ }
];
const STUDENT_ACTION_TYPES = new Set(['steps', 'prediction', 'simulation', 'dataTable', 'check', 'code']);

/**
 * Every [path, text, isSafetyText] entry in a validated spec, for scanning.
 * Safety notes are expected to name hazards, so the hazard scan skips them.
 */
export function textEntries(spec) {
  const out = [['title', spec.title], ['summary', spec.summary], ['safety.notes', spec.safety.notes, true]];
  spec.safety.hazards.forEach((h, i) => out.push([`safety.hazards[${i}]`, h, true]));
  spec.materials.forEach((m, i) => out.push([`materials[${i}].name`, m.name], [`materials[${i}].safetyNote`, m.safetyNote || '', true]));
  spec.blocks.forEach((b, i) => {
    const p = `blocks[${i}]`;
    if (b.type === 'intro') out.push([`${p}.text`, b.text]);
    if (b.type === 'steps') b.items.forEach((it, j) => out.push([`${p}.items[${j}].text`, it.text], [`${p}.items[${j}].evidenceHint`, it.evidenceHint || '']));
    if (b.type === 'prediction') out.push([`${p}.question`, b.question], ...(b.choices || []).map((ch, j) => [`${p}.choices[${j}]`, ch]));
    if (b.type === 'simulation') out.push([`${p}.simulation.question`, b.simulation.question]);
    if (b.type === 'check') b.questions.forEach((q, j) => out.push([`${p}.questions[${j}].prompt`, q.prompt], [`${p}.questions[${j}].explanation`, q.explanation]));
    if (b.type === 'code') out.push([`${p}.explanation`, b.explanation]);
    if (b.type === 'reflection') out.push([`${p}.prompt`, b.prompt]);
  });
  return out.filter(([, t]) => t);
}

/**
 * Safety and quality warnings for a VALIDATED spec. Warnings never change the
 * content; the coach reads them and must confirm before publishing.
 * Each warning: { code, severity: 'caution' | 'warning', path, message }.
 */
export function safetyWarnings(spec) {
  const warnings = [];
  const entries = textEntries(spec);
  const hasSafetyNotes = Boolean(spec.safety.notes) || spec.safety.hazards.length > 0;
  const found = new Map();
  for (const [path, value, isSafetyText] of entries) {
    if (isSafetyText) continue;
    for (const h of HAZARD_TERMS) if (h.pattern.test(value) && !found.has(h.term)) found.set(h.term, { ...h, path });
  }
  for (const h of found.values()) {
    if (!hasSafetyNotes) warnings.push({ code: 'HAZARD_WITHOUT_SAFETY_NOTE', severity: 'warning', path: h.path, message: `Mentions ${h.term} but the activity has no safety notes or listed hazards.` });
    if (AGE_BANDS.indexOf(spec.ageBand) < AGE_BANDS.indexOf(h.minBand)) warnings.push({ code: 'AGE_BAND_MISMATCH', severity: 'warning', path: h.path, message: `${h.term[0].toUpperCase()}${h.term.slice(1)} is recommended for ages ${h.minBand} and older; this activity is for ${spec.ageBand}.` });
  }
  spec.materials.forEach((m, i) => {
    const h = HAZARD_TERMS.find((x) => x.pattern.test(m.name));
    if (h && !m.safetyNote) warnings.push({ code: 'MATERIAL_NEEDS_SAFETY_NOTE', severity: 'warning', path: `materials[${i}]`, message: `"${m.name}" involves ${h.term}; add a safety note for it.` });
  });
  if (!spec.blocks.some((b) => b.type === 'reflection')) warnings.push({ code: 'MISSING_REFLECTION', severity: 'caution', path: 'blocks', message: 'Add a reflection block so learners explain what they found.' });
  if (!spec.blocks.some((b) => STUDENT_ACTION_TYPES.has(b.type))) warnings.push({ code: 'NO_LEARNER_ACTION', severity: 'caution', path: 'blocks', message: 'Add steps, a prediction, a simulation, a data table, a check or code so learners do something.' });
  for (const [path, value] of entries) {
    const pd = PERSONAL_DATA.find((d) => d.pattern.test(value));
    if (pd) warnings.push({ code: 'CONTAINS_PERSONAL_DATA', severity: 'warning', path, message: `Looks like it contains an ${pd.kind}. Remove personal details before publishing.` });
  }
  return warnings;
}

// ------------------------------------------------------------------ sample

/** A complete, valid example built from Sustainable Futures (Explore stage). */
export function sampleActivity() {
  return {
    version: SPEC_VERSION,
    title: 'Find the campus energy hotspots',
    summary: 'Survey one space on campus, record what uses electricity, estimate daily energy use and decide where savings would matter most.',
    ageBand: '13-15',
    durationMinutes: 45,
    standards: ['MS-ESS3-3', 'MS-ETS1-1'],
    materials: [
      { name: 'Notebook or tablet', quantity: '1 per pair' },
      { name: 'micro:bit with temperature sensor', quantity: '1 per pair' },
      { name: 'Plug-in power meter', quantity: '1 per class', safetyNote: 'Only the coach plugs devices in and out of the wall socket.' }
    ],
    safety: { hazards: ['Wall sockets'], notes: 'Learners observe and read labels only. They do not unplug or open any device.' },
    resources: [{ title: 'Energy use of common appliances', url: 'https://www.energy.gov/energysaver/estimating-appliance-and-home-electronic-energy-use' }],
    blocks: [
      { type: 'intro', text: 'Schools use a lot of electricity, but not every room uses the same amount. Today you are an energy auditor: find out which devices in one space use the most energy, and why.' },
      { type: 'prediction', question: 'Which device do you think uses the most energy in a school day?', choices: ['Air conditioner', 'Lights', 'Projector', 'Computers'] },
      { type: 'steps', items: [
        { text: 'Choose one room or outdoor space and sketch where each electrical device is.', evidenceHint: 'A labelled sketch or photo' },
        { text: 'Read the power rating (watts) on each device label, or ask your coach to measure it with the power meter.' },
        { text: 'Estimate how many hours each device is on during a school day.' }
      ] },
      { type: 'dataTable', columns: [{ key: 'device', label: 'Device' }, { key: 'watts', label: 'Power', unit: 'W' }, { key: 'hours', label: 'Hours on', unit: 'h' }, { key: 'energy', label: 'Energy', unit: 'Wh' }], rows: 8 },
      { type: 'chart', table: 3, x: 'device', y: 'energy', kind: 'bar' },
      { type: 'simulation', simulation: { kind: 'resource-lab', title: 'Solar panels for the room', question: 'How many solar panels would cover this room’s daily energy use within budget?', resource: 'Energy supplied', unit: 'kWh', demand: 12, capacity: 2, cost: 40, budget: 300, reflection: 'Which design met the need within budget? What did the model leave out?' } },
      { type: 'check', questions: [{ prompt: 'Energy (Wh) equals…', choices: ['Power (W) × time (h)', 'Power (W) ÷ time (h)', 'Voltage × time'], answerIndex: 0, explanation: 'Energy is power used over time, so multiply watts by hours.' }] },
      { type: 'reflection', prompt: 'Which device surprised you most, and what is one change your class could make to save energy?' }
    ],
    provenance: { aiAssisted: false }
  };
}

// ------------------------------------------------------------- responses

export const RESPONSE_LIMITS = { text: 2000, cell: 60 };

/**
 * Validate a learner's answers to a VALIDATED spec before they are stored with
 * lesson evidence. Shape: { version: 1, answers: { "<blockIndex>": answer } }
 *   prediction → { choice: index } or { text }
 *   steps      → { done: [itemIndex, ...] }
 *   simulation → { trials: [{ units, efficiency, supplied, cost, success }] } (max 10)
 *   dataTable  → { rows: [{ <columnKey>: string|number }] } (max table rows)
 *   check      → { selected: [choiceIndex per question] }
 *   code       → { copied: boolean }
 *   reflection → { text }
 * Blocks without answers are simply absent. Returns the cleaned object.
 */
export function validateActivityResponses(spec, input) {
  const c = makeChecker();
  if (!isObject(input) || !isObject(input.answers)) throw new ActivityValidationError([{ path: 'responses', message: 'must be { version: 1, answers: {...} }.' }]);
  if (input.version !== SPEC_VERSION) c.fail('responses.version', `must be ${SPEC_VERSION}.`);
  const answers = {};
  for (const [key, value] of Object.entries(input.answers)) {
    const i = Number(key);
    const block = Number.isInteger(i) ? spec.blocks[i] : undefined;
    const p = `responses.answers.${key}`;
    if (!block) { c.fail(p, 'does not match a block.'); continue; }
    if (!isObject(value)) { c.fail(p, 'must be an object.'); continue; }
    switch (block.type) {
      case 'prediction':
        if (block.choices && value.choice !== undefined) answers[i] = { choice: c.int(value.choice, `${p}.choice`, 0, block.choices.length - 1) };
        else answers[i] = { text: c.text(value.text, `${p}.text`, RESPONSE_LIMITS.text) };
        break;
      case 'steps': {
        const done = c.list(value.done, `${p}.done`, 0, block.items.length) || [];
        answers[i] = { done: [...new Set(done.map((d, j) => c.int(d, `${p}.done[${j}]`, 0, block.items.length - 1)))].sort((a, b) => a - b) };
        break;
      }
      case 'simulation': {
        const trials = c.list(value.trials, `${p}.trials`, 0, 10) || [];
        answers[i] = { trials: trials.map((t, j) => ({
          units: c.int(t?.units, `${p}.trials[${j}].units`, 0, 30),
          efficiency: c.int(t?.efficiency, `${p}.trials[${j}].efficiency`, 10, 100),
          supplied: Number.isFinite(t?.supplied) ? t.supplied : c.fail(`${p}.trials[${j}].supplied`, 'must be a number.'),
          cost: Number.isFinite(t?.cost) ? t.cost : c.fail(`${p}.trials[${j}].cost`, 'must be a number.'),
          success: t?.success === true
        })) };
        break;
      }
      case 'dataTable': {
        const keys = block.columns.map((col) => col.key);
        const rows = c.list(value.rows, `${p}.rows`, 0, block.rows) || [];
        answers[i] = { rows: rows.map((row, j) => Object.fromEntries(keys.map((k) => {
          const cell = row?.[k];
          if (cell === undefined || cell === null || cell === '') return [k, ''];
          if (typeof cell === 'number' && Number.isFinite(cell)) return [k, cell];
          return [k, c.text(String(cell), `${p}.rows[${j}].${k}`, RESPONSE_LIMITS.cell) ?? ''];
        }))) };
        break;
      }
      case 'check': {
        const selected = c.list(value.selected, `${p}.selected`, 0, block.questions.length) || [];
        answers[i] = { selected: selected.map((s, j) => (s === null ? null : c.int(s, `${p}.selected[${j}]`, 0, block.questions[j].choices.length - 1))) };
        break;
      }
      case 'code':
        answers[i] = { copied: value.copied === true };
        break;
      case 'reflection':
        answers[i] = { text: c.text(value.text, `${p}.text`, RESPONSE_LIMITS.text) };
        break;
      default:
        c.fail(p, 'this block type takes no answer.');
    }
  }
  if (c.errors.length) throw new ActivityValidationError(c.errors);
  return { version: SPEC_VERSION, answers };
}
