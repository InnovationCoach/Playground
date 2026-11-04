import {PHASES} from '../pbl/content/pblModel.js';

/** Design-thinking stages a portfolio entry can belong to (Portfolio maker). */
export const PHASE_IDS = PHASES.map(p => p.id);

export const PALETTES = {
  plum: {label: 'Plum', accent: '#623580', ink: '#202b38'},
  ocean: {label: 'Ocean', accent: '#155477', ink: '#202b38'},
  forest: {label: 'Forest', accent: '#245c43', ink: '#202b38'},
  clay: {label: 'Clay', accent: '#873e28', ink: '#202b38'}
};
export const BACKGROUNDS = {paper: '#ffffff', mist: '#f0f4f7', cream: '#fff6e8'};
export const WIDGETS = {learning: 'School learning', goals: 'Learning goals', notes: 'Private notes', about: 'About me'};
export const LAYOUTS = {balanced: ['learning', 'goals', 'notes', 'about'], focus: ['goals', 'learning', 'about', 'notes'], journal: ['about', 'notes', 'learning', 'goals']};
export const KINDS = {code: 'Code project', model: '3D model', image: 'Image', writing: 'Written reflection', recording: 'Recorded reflection'};
export const AUDIENCES = {coaches: 'Assigned coaches', classmates: 'Classmates', wider: 'Approved wider audience'};
export const IMAGE_TYPES = ['image/jpeg','image/png','image/webp','image/gif','image/svg+xml','image/avif'];
export const MEDIA_TYPES = [...IMAGE_TYPES,'audio/webm','audio/ogg','audio/mpeg','audio/mp4','audio/wav','video/webm','video/mp4','video/quicktime','model/gltf-binary','model/gltf+json','application/octet-stream','application/zip','text/plain'];
export const MAX_MEDIA_SIZE = 20 * 1024 * 1024; // 20 MB max for student media
export function defaults() {
  const appearance = () => ({accent: 'plum', background: 'paper', picture: null, cover: null});
  return {version: 1, revision: 0, dashboard: {heading: 'My learning space', introduction: '', interests: '', goals: '', layout: 'balanced', widgetOrder: [...LAYOUTS.balanced], appearance: appearance()}, portfolio: {heading: 'My portfolio', introduction: '', interests: '', layout: 'gallery', appearance: appearance()}, items: []};
}
const invalid = message => {throw Object.assign(new Error(message), {status: 400, code: 'VALIDATION'});};
const choice = (value, choices, label) => typeof value === 'string' && Object.hasOwn(choices, value) ? value : invalid(`Choose a supported ${label}.`);
const text = (value, max, label) => typeof value === 'string' && value.length <= max ? value.trim() : invalid(`${label} must be text with at most ${max} characters.`);
export function asset(value, uid) {
  if (value == null) return null;
  if (!value || typeof value.path !== 'string' || !value.path.startsWith(`learnerMedia/${uid}/`) || !/^[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+$/.test(value.path.slice(`learnerMedia/${uid}/`.length))) invalid('Choose a file uploaded to your own portfolio.');
  return {path: value.path, name: text(value.name, 160, 'Filename')};
}
function appearance(value, uid) {
  if (!value || typeof value !== 'object') invalid('Appearance settings are required.');
  return {accent: choice(value.accent, PALETTES, 'accent'), background: choice(value.background, BACKGROUNDS, 'background'), picture: asset(value.picture, uid), cover: asset(value.cover, uid)};
}
export function normalizeSettings(body, uid) {
  const d = body?.dashboard, p = body?.portfolio;
  if (!d || !p || !Array.isArray(d.widgetOrder) || d.widgetOrder.length !== 4 || new Set(d.widgetOrder).size !== 4 || d.widgetOrder.some(id => !Object.hasOwn(WIDGETS,id))) invalid('Include each dashboard widget exactly once.');
  const common = value => ({heading: text(value.heading, 100, 'Heading'), introduction: text(value.introduction, 600, 'Introduction'), interests: text(value.interests, 300, 'Interests'), appearance: appearance(value.appearance, uid)});
  return {version: 1, dashboard: {...common(d), goals: text(d.goals, 1200, 'Private goals'), layout: choice(d.layout, LAYOUTS, 'dashboard layout'), widgetOrder: [...d.widgetOrder]}, portfolio: {...common(p), layout: choice(p.layout, {gallery:1,journal:1}, 'portfolio layout')}};
}
export function safeProjectLink(value) {
  if (!value) return '';
  if (typeof value !== 'string' || value.length > 2000) invalid('Project links must be text with at most 2000 characters.');
  try {const url = new URL(value); if (url.protocol === 'https:' && !url.username && !url.password) return url.href;} catch { /* rejected below */ }
  invalid('Project links must use HTTPS.');
}
export function normalizeItem(value, uid) {
  if (!value || !Array.isArray(value.audiences) || value.audiences.length > 3 || new Set(value.audiences).size !== value.audiences.length || value.audiences.some(a => !Object.hasOwn(AUDIENCES,a))) invalid('Choose valid audiences, or keep this work private.');
  const result = {kind: choice(value.kind, KINDS, 'work type'), title: text(value.title, 160, 'Work title'), body: text(value.body || '', 12000, 'Reflection or code'), link: safeProjectLink(value.link || ''), media: asset(value.media, uid), audiences: [...value.audiences]};
  if (!result.title || (!result.body && !result.link && !result.media)) invalid('Add a title and some work, a link, or a file.');
  if (result.kind === 'image' && !result.media) invalid('Choose an image file.');
  if (result.kind === 'recording' && !result.media) invalid('Choose or record an audio or video file.');
  // Optional design-thinking stage for the Portfolio maker. A stage reflection is
  // the learner's one written reflection for that stage.
  if (value.phase !== undefined && value.phase !== null && value.phase !== '') {
    if (!PHASE_IDS.includes(value.phase)) invalid('Choose a valid design thinking stage.');
    result.phase = value.phase;
  }
  if (value.phaseReflection === true) {
    if (!result.phase || result.kind !== 'writing') invalid('A stage reflection must be written work with a stage.');
    if (!result.body) invalid('Write your reflection before saving.');
    result.phaseReflection = true;
  }
  if (Array.isArray(value.competencies)) {
    result.competencies = [...new Set(
      value.competencies.filter(c => typeof c === 'string' && /^[a-z0-9_-]{1,40}$/i.test(c))
    )].slice(0, 12);
  } else if (value.competencies) {
    result.competencies = [];
  }
  return result;
}
export function moveWidget(order, id, target) {
  const from = order.indexOf(id);
  if (from < 0 || target < 0 || target >= order.length) return order;
  const next = [...order]; next.splice(from,1); next.splice(target,0,id); return next;
}
export function previewItems(items, audience) {return audience === 'owner' ? items : items.filter(item => item.audiences.includes(audience));}
