/**
 * Navigation and access model for the My Universe exploration spike. Pure and
 * framework-free so the 3D scene, the text view and the tests share one truth.
 *
 * The path is a back stack: [{ level: 'universe' }, { level: 'galaxy', id }, …].
 * `selected` is the focused child at the current level (or the location in an
 * environment). Seeing or selecting a destination never grants access.
 */
import { GALAXIES, galaxyById, systemById, planetById, environmentById } from './cosmosFixture.js';

export const LEVELS = ['universe', 'galaxy', 'system', 'planet', 'environment'];
export const LEVEL_LABEL = { universe: 'My Universe', galaxy: 'Galaxy', system: 'Star system', planet: 'Planet', environment: 'Surface' };

export const initialNav = () => ({ path: [{ level: 'universe' }], selected: null });
export const current = (nav) => nav.path[nav.path.length - 1];

/** The destinations one step inward from the current view. */
export function childrenOf(entry) {
  if (entry.level === 'universe') return GALAXIES.map((g) => ({ level: 'galaxy', id: g.id, item: g }));
  if (entry.level === 'galaxy') return (galaxyById(entry.id)?.systems || []).map((id) => ({ level: 'system', id, item: systemById(id) })).filter((c) => c.item);
  if (entry.level === 'system') return (systemById(entry.id)?.planets || []).map((id) => ({ level: 'planet', id, item: planetById(id) })).filter((c) => c.item);
  if (entry.level === 'environment') return (environmentById(entry.id)?.locations || []).map((loc) => ({ level: 'location', id: loc.id, item: loc }));
  return [];
}

export function itemFor(entry) {
  if (!entry) return null;
  if (entry.level === 'galaxy') return galaxyById(entry.id);
  if (entry.level === 'system') return systemById(entry.id);
  if (entry.level === 'planet') return planetById(entry.id);
  if (entry.level === 'environment') return environmentById(entry.id);
  return null;
}

/**
 * Display status for a planet. `preview` marks fixture states shown in labelled
 * previews only. Outside previews no trusted access service exists yet, so a
 * gated destination reads "Access not connected" rather than locked/unlocked.
 */
export function planetAccess(planet, { preview = false } = {}) {
  if (!planet) return { status: 'not-charted', preview };
  if (planet.access === 'public') return { status: planet.environmentId ? 'available' : 'charted', preview };
  if (preview) return { status: 'locked', requirementText: planet.requirementText || '', preview };
  return { status: 'not-connected', preview };
}

export const STATUS_LABEL = { charted: 'Charted', available: 'Available', locked: 'Locked', 'not-connected': 'Access not connected', 'not-charted': 'Not charted' };

export const canLand = (planet, opts) => !!planet?.environmentId && planetAccess(planet, opts).status === 'available';

export function reduce(nav, action) {
  const here = current(nav);
  switch (action.type) {
    case 'select': return { ...nav, selected: action.id ?? null };
    case 'open': {
      // Go one level inward: universe→galaxy→system→planet, or land on a planet's surface.
      if (here.level === 'planet') {
        const planet = planetById(here.id);
        if (!canLand(planet, action.opts)) return nav;
        return { path: [...nav.path, { level: 'environment', id: planet.environmentId }], selected: null };
      }
      const child = childrenOf(here).find((c) => c.id === action.id);
      if (!child || child.level === 'location') return nav;
      return { path: [...nav.path, { level: child.level, id: child.id }], selected: null };
    }
    case 'back': {
      if (nav.path.length === 1) return nav.selected ? { ...nav, selected: null } : nav;
      // Returning keeps the place you came from focused, so the camera frames it again.
      return { path: nav.path.slice(0, -1), selected: here.id };
    }
    case 'goto': {
      const depth = Math.max(0, Math.min(action.depth, nav.path.length - 1));
      if (depth === nav.path.length - 1) return nav;
      return { path: nav.path.slice(0, depth + 1), selected: nav.path[depth + 1].id };
    }
    case 'home': return initialNav();
    case 'jump': return Array.isArray(action.path) && action.path[0]?.level === 'universe' ? { path: action.path, selected: null } : nav;
    default: return nav;
  }
}

/** Builds the back stack that leads to a destination, so the text view can jump into 3D. */
export function pathTo(level, id) {
  const root = { level: 'universe' };
  if (level === 'universe') return [root];
  if (level === 'galaxy') return galaxyById(id) ? [root, { level, id }] : null;
  if (level === 'system') { const s = systemById(id); return s ? [...pathTo('galaxy', s.galaxyId), { level, id }] : null; }
  if (level === 'planet') { const p = planetById(id); return p ? [...pathTo('system', p.systemId), { level, id }] : null; }
  if (level === 'environment') { const e = environmentById(id); return e ? [...pathTo('planet', e.planetId), { level, id }] : null; }
  return null;
}

/**
 * How the camera should move between two navigation states. Deeper = approach
 * from far out; shallower = pull back; refocus = glide within a view; none =
 * keep the learner's own camera (for example, selecting a galaxy).
 */
export function transitionBetween(prev, next) {
  const a = prev.path.length, b = next.path.length;
  if (b > a) return { kind: 'approach', from: 'approach', duration: current(next).level === 'environment' ? 2.4 : 1.6 };
  if (b < a) return { kind: 'retreat', from: 'retreat', duration: 1.2 };
  if (current(next).level === 'environment' && prev.selected !== next.selected) return { kind: 'refocus', from: 'current', duration: 1 };
  if (current(next).level === 'system' && prev.selected !== next.selected) return { kind: 'refocus', from: 'current', duration: 0.8 };
  return { kind: 'none' };
}

/** Selection that changes the camera framing (other levels only highlight). */
export const framedSelection = (nav) => (['system', 'environment'].includes(current(nav).level) ? nav.selected : null);

export function breadcrumbs(nav) {
  return nav.path.map((entry, depth) => ({ depth, level: entry.level, label: entry.level === 'universe' ? LEVEL_LABEL.universe : itemFor(entry)?.name || entry.id }));
}

/** Plain-language summary for screen readers and the live region. */
export function describeView(nav, opts) {
  const here = current(nav);
  const kids = childrenOf(here);
  const item = itemFor(here);
  if (here.level === 'universe') return `My Universe overview. ${kids.length} galaxies charted: ${kids.map((k) => k.item.name).join(', ')}.`;
  if (here.level === 'galaxy') return `${item.name}, a ${item.type} galaxy. ${kids.length ? `${kids.length} charted star system${kids.length > 1 ? 's' : ''}: ${kids.map((k) => k.item.name).join(', ')}.` : 'No star systems charted yet.'}`;
  if (here.level === 'system') return `${item.name}, ${item.starClass}. Planets: ${kids.map((k) => `${k.item.name} (${STATUS_LABEL[planetAccess(k.item, opts).status]})`).join(', ')}. Not to scale.`;
  if (here.level === 'planet') return `${item.name}. ${item.summary} Status: ${STATUS_LABEL[planetAccess(item, opts).status]}.`;
  if (here.level === 'environment') return `${item.name}. ${item.biome}. ${kids.length} places to inspect: ${kids.map((k) => k.item.name).join(', ')}.`;
  return '';
}
