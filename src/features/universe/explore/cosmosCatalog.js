/**
 * Published cosmos catalog (GEMINI BACKEND.md §2.1): static, versioned JSON at
 * /cosmos/v1/catalog.json. The explorer loads it once per visit and stays on
 * that version (session pinning); nothing here is learner data or access.
 *
 * A catalog is checked in full before use. A broken file is refused with its
 * reasons rather than half-rendered, so a learner never sees a universe with
 * dangling destinations.
 */
export const CATALOG_URL = '/cosmos/v1/catalog.json';

export const KINDS = ['ocean', 'basalt', 'ice'];
export const GALAXY_TYPES = ['spiral', 'elliptical'];
export const ACCESS = ['public', 'gated'];
export const FACT_TAGS = { 'fictional-world': 'Fictional world', 'real-science': 'Real science' };
/** Environment renderers the client ships, with the location ids each scene places structures at. */
export const SCENES = { 'ocean-station': ['platform', 'tide-gauge', 'weather-mast', 'vent'] };

const isId = (v) => typeof v === 'string' && /^[a-z0-9][a-z0-9-]{0,63}$/.test(v);
const isText = (v, max = 400) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isVec3 = (v) => Array.isArray(v) && v.length === 3 && v.every(isNum);
const isColor = (v) => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
const colorsOk = (c, keys) => c && typeof c === 'object' && keys.every((k) => isColor(c[k]));

/** Facts may be plain strings (older fixtures) or tagged objects; both become { text, tag, source? }. */
export function normalizeFact(f) {
  if (typeof f === 'string') return { text: f, tag: 'fictional-world' };
  return { text: f?.text, tag: f?.tag, source: f?.source, annotation: f?.annotation };
}

export function validateCatalog(raw) {
  const errors = [];
  const fail = (where, what) => errors.push(`${where}: ${what}`);
  if (!raw || typeof raw !== 'object') return ['catalog: not an object'];
  if (!isText(raw.catalogVersion, 40)) fail('catalog', 'catalogVersion missing');
  for (const key of ['galaxies', 'systems', 'planets', 'environments']) if (!Array.isArray(raw[key])) fail('catalog', `${key} must be a list`);
  if (errors.length) return errors;

  const seen = new Set();
  const unique = (where, id) => { if (!isId(id)) fail(where, `bad id ${JSON.stringify(id)}`); else if (seen.has(id)) fail(where, `duplicate id ${id}`); else seen.add(id); };
  const byId = (list) => new Map(list.map((x) => [x?.id, x]));
  const galaxies = byId(raw.galaxies), systems = byId(raw.systems), planets = byId(raw.planets), envs = byId(raw.environments);

  for (const g of raw.galaxies) {
    const w = `galaxy ${g?.id}`; unique(w, g?.id);
    if (!isText(g.name, 60) || !isText(g.summary)) fail(w, 'name and summary required');
    if (!GALAXY_TYPES.includes(g.type)) fail(w, `type must be ${GALAXY_TYPES.join(' or ')}`);
    if (!isVec3(g.position) || !isNum(g.tilt)) fail(w, 'position [x,y,z] and tilt required');
    if (!colorsOk(g.colors, ['core', 'arm', 'dust'])) fail(w, 'colors core/arm/dust must be #rrggbb');
    if (!Array.isArray(g.systems)) fail(w, 'systems must be a list');
    else for (const sid of g.systems) if (systems.get(sid)?.galaxyId !== g.id) fail(w, `system ${sid} missing or belongs elsewhere`);
    if (!Number.isInteger(g.uncharted) || g.uncharted < 0 || g.uncharted > 12) fail(w, 'uncharted must be 0–12');
  }
  for (const s of raw.systems) {
    const w = `system ${s?.id}`; unique(w, s?.id);
    if (!galaxies.has(s.galaxyId) || !galaxies.get(s.galaxyId).systems?.includes(s.id)) fail(w, 'galaxyId must list this system');
    if (!isText(s.name, 60) || !isText(s.summary) || !isText(s.starClass, 80)) fail(w, 'name, starClass and summary required');
    if (!isColor(s.starColor)) fail(w, 'starColor must be #rrggbb');
    if (!Array.isArray(s.planets)) fail(w, 'planets must be a list');
    else for (const pid of s.planets) if (planets.get(pid)?.systemId !== s.id) fail(w, `planet ${pid} missing or belongs elsewhere`);
  }
  for (const p of raw.planets) {
    const w = `planet ${p?.id}`; unique(w, p?.id);
    if (!systems.has(p.systemId) || !systems.get(p.systemId).planets?.includes(p.id)) fail(w, 'systemId must list this planet');
    if (!isText(p.name, 60) || !isText(p.summary)) fail(w, 'name and summary required');
    if (!KINDS.includes(p.kind)) fail(w, `kind must be one of ${KINDS.join(', ')}`);
    if (![p.orbit, p.angle, p.radius].every(isNum) || p.orbit <= 0 || p.radius <= 0) fail(w, 'orbit, angle and radius must be positive numbers');
    if (!colorsOk(p.colors, ['base', 'deep', 'light', 'atmosphere'])) fail(w, 'colors base/deep/light/atmosphere must be #rrggbb');
    if (p.kind === 'ocean' && !isColor(p.colors?.cloud)) fail(w, 'ocean planets need colors.cloud');
    if (p.kind === 'basalt' && !isColor(p.colors?.glow)) fail(w, 'basalt planets need colors.glow');
    if (p.rings && !isColor(p.colors?.ring)) fail(w, 'ringed planets need colors.ring');
    if (!ACCESS.includes(p.access)) fail(w, `access must be ${ACCESS.join(' or ')}`);
    if (p.access === 'gated' && !isText(p.requirementText)) fail(w, 'gated planets need requirementText');
    if (!Array.isArray(p.facts)) fail(w, 'facts must be a list');
    else p.facts.map(normalizeFact).forEach((f, i) => {
      if (!isText(f.text)) fail(w, `fact ${i + 1} needs text`);
      if (!FACT_TAGS[f.tag]) fail(w, `fact ${i + 1} tag must be fictional-world or real-science`);
      // Real science is only for sourced, educator-reviewed facts (UNIVERSE.md §13.3 #8).
      if (f.tag === 'real-science' && !isText(f.source, 300)) fail(w, `fact ${i + 1} is real-science without a source`);
    });
    if (p.environmentId !== null && p.environmentId !== undefined && envs.get(p.environmentId)?.planetId !== p.id) fail(w, `environment ${p.environmentId} missing or belongs elsewhere`);
  }
  for (const e of raw.environments) {
    const w = `environment ${e?.id}`; unique(w, e?.id);
    if (planets.get(e.planetId)?.environmentId !== e.id) fail(w, 'planetId must point back to this environment');
    if (!isText(e.name, 80) || !isText(e.summary) || !isText(e.biome, 120)) fail(w, 'name, biome and summary required');
    if (!SCENES[e.sceneKind]) fail(w, `sceneKind must be one of ${Object.keys(SCENES).join(', ')}`);
    if (!Array.isArray(e.locations) || !e.locations.length) { fail(w, 'locations must be a non-empty list'); continue; }
    const locIds = new Set();
    for (const l of e.locations) {
      const lw = `${w} location ${l?.id}`;
      if (!isId(l?.id) || locIds.has(l.id)) fail(lw, 'bad or duplicate id'); else locIds.add(l.id);
      if (!isText(l.name, 60) || !isText(l.purpose)) fail(lw, 'name and purpose required');
      if (!isVec3(l.position) || !isVec3(l.view)) fail(lw, 'position and view must be [x,y,z]');
      if (!Array.isArray(l.observations) || !l.observations.every((o) => isText(o))) fail(lw, 'observations must be a list of text');
    }
    for (const needed of SCENES[e.sceneKind] || []) if (!locIds.has(needed)) fail(w, `the ${e.sceneKind} scene needs a "${needed}" location`);
  }
  return errors;
}

/** A validated catalog with lookups; throws with every problem listed if the data is not usable. */
export function buildCosmos(raw) {
  const errors = validateCatalog(raw);
  if (errors.length) { const err = new Error(`Catalog is not valid (${errors.length} problem${errors.length > 1 ? 's' : ''})`); err.problems = errors; throw err; }
  const index = (list) => new Map(list.map((x) => [x.id, x]));
  const planets = raw.planets.map((p) => ({ ...p, facts: p.facts.map(normalizeFact) }));
  const g = index(raw.galaxies), s = index(raw.systems), p = index(planets), e = index(raw.environments);
  return Object.freeze({
    version: raw.catalogVersion,
    galaxies: raw.galaxies, systems: raw.systems, planets, environments: raw.environments,
    galaxyById: (id) => g.get(id) || null, systemById: (id) => s.get(id) || null,
    planetById: (id) => p.get(id) || null, environmentById: (id) => e.get(id) || null
  });
}

/** Fetches and builds the catalog. `fresh` skips the HTTP cache (used for the newer-version check). */
export async function loadCosmos(url = CATALOG_URL, { fetchImpl = globalThis.fetch, fresh = false, signal } = {}) {
  const res = await fetchImpl(url, { cache: fresh ? 'no-cache' : 'default', signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Catalog request failed (${res.status})`);
  return buildCosmos(await res.json());
}
