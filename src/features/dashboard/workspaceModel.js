import { hydrateSlides } from './slideModel.js';
import { hydrateDialFinish } from './instrumentModel.js';
export const THEMES = [{ id: 'inherit', label: 'Same as the rest of SPARK' }, { id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }];
export const TOOL_IDS = ['focus', 'notes', 'checkin', 'picked', 'badges', 'readiness', 'skill'];
// 'brand' is WeLearn's Inter text with Plus Jakarta Sans headings (see DISPLAY_FONTS); it is the default.
export const FONTS = { brand: "'Inter', system-ui, sans-serif", system: 'system-ui, sans-serif', rounded: 'ui-rounded, system-ui, sans-serif', serif: 'Georgia, serif' };
export const BACKGROUNDS = { plain: 'var(--sp-canvas, var(--gh-bg))', mist: 'linear-gradient(120deg, var(--ps-mist-a, #e8f0f5), var(--ps-mist-b, #f4edf7))', meadow: 'linear-gradient(120deg, var(--ps-meadow-a, #edf3e3), var(--ps-meadow-b, #f7f4e9))' };
const page = (p, i) => ({
  id: `page-${i + 1}`, name: typeof p?.name === 'string' && p.name.trim() ? p.name.trim().slice(0, 32) : `My space ${i + 1}`,
  layout: p?.layout === 'slider' ? 'slider' : 'grid',
  order: [...new Set([...(Array.isArray(p?.order) ? p.order.filter(id => TOOL_IDS.includes(id)) : []), ...TOOL_IDS])],
  hidden: Array.isArray(p?.hidden) ? [...new Set(p.hidden.filter(id => TOOL_IDS.includes(id)))] : [],
  sizes: Object.fromEntries(TOOL_IDS.map(id => [id, p?.sizes?.[id] === 'wide' ? 'wide' : 'compact']))
});
export const DISPLAY_FONTS = { ...FONTS, brand: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" };
export function hydrateWorkspace(s = {}) {
  const pages = (Array.isArray(s.pages) && s.pages.length ? s.pages : [{ name: 'My space', order: s.order, hidden: s.hidden }]).slice(0, 5).map(page);
  return { ...hydrateSlides(s), pages, activePage: Math.max(0, Math.min(pages.length - 1, Number.isInteger(s.activePage) ? s.activePage : 0)),
    font: Object.hasOwn(FONTS, s.font) ? s.font : 'brand', background: Object.hasOwn(BACKGROUNDS, s.background) ? s.background : 'plain',
    // The dashboard follows the app theme, so Light means light on every page. Dark used to be
    // saved as the default, so a stored 'dark' only counts once the learner has picked it here.
    theme: hydrateTheme(s), themeChosen: s.themeChosen === true, dialFinish: hydrateDialFinish(s.dialFinish) };
}
function hydrateTheme({ theme, themeChosen }) {
  if (theme === 'dark') return themeChosen === true ? 'dark' : 'inherit';
  return THEMES.some((t) => t.id === theme) ? theme : 'inherit';
}
export function changePage(prefs, fn) {
  return { ...prefs, pages: prefs.pages.map((p, i) => i === prefs.activePage ? fn(p) : p) };
}
export function reorderTool(p, id, target) {
  if (!p.order.includes(id) || !p.order.includes(target) || id === target) return p;
  const order = p.order.filter(x => x !== id); order.splice(order.indexOf(target), 0, id);
  return { ...p, order };
}
export function addPage(prefs) {
  if (prefs.pages.length >= 5) return prefs;
  return { ...prefs, pages: [...prefs.pages, page(null, prefs.pages.length)], activePage: prefs.pages.length };
}
export function removePage(prefs) {
  if (prefs.pages.length === 1) return prefs;
  return hydrateWorkspace({ ...prefs, pages: prefs.pages.filter((_, i) => i !== prefs.activePage), activePage: 0 });
}
