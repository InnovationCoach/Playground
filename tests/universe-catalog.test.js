import { describe, expect, it, vi } from 'vitest';
import { buildCosmos, validateCatalog, loadCosmos, normalizeFact } from '../src/features/universe/explore/cosmosCatalog.js';
import catalog from '../public/cosmos/v1/catalog.json';

const clone = () => JSON.parse(JSON.stringify(catalog));

describe('My Universe published catalog', () => {
  it('the shipped catalog is valid, versioned and entirely fictional', () => {
    expect(validateCatalog(catalog)).toEqual([]);
    const cosmos = buildCosmos(catalog);
    expect(cosmos.version).toBe('1.2.0');
    expect(cosmos.galaxies.map((g) => g.id)).toEqual(['lyra-spiral', 'aurora-elliptical']);
    expect(cosmos.planets.flatMap((p) => p.facts).every((f) => f.tag === 'fictional-world')).toBe(true);
    expect(cosmos.environmentById('thalassa-station').sceneKind).toBe('ocean-station');
    expect(cosmos.environmentById('ignis-fissure-field').sceneKind).toBe('basalt-fissures');
    expect(cosmos.planets.filter((p) => p.access === 'gated').map((p) => p.id)).toEqual(['boreas']);
    expect(Object.isFrozen(cosmos)).toBe(true);
  });

  it('refuses broken references instead of rendering a partial universe', () => {
    const bad = clone();
    bad.galaxies[0].systems.push('ghost-system');
    bad.planets[0].environmentId = 'nowhere';
    bad.environments[0].locations = bad.environments[0].locations.filter((l) => l.id !== 'vent');
    const problems = validateCatalog(bad);
    expect(problems).toEqual(expect.arrayContaining([
      expect.stringMatching(/galaxy lyra-spiral: system ghost-system missing/),
      expect.stringMatching(/planet thalassa: environment nowhere missing/),
      expect.stringMatching(/needs a "vent" location/)
    ]));
    expect(() => buildCosmos(bad)).toThrow(/Catalog is not valid/);
  });

  it('keeps science honest: real-science facts need a source, gated planets need requirement text', () => {
    const bad = clone();
    bad.planets[0].facts.push({ text: 'Water boils at 100 °C at sea level on Earth.', tag: 'real-science' });
    delete bad.planets.find((p) => p.access === 'gated').requirementText;
    bad.planets[2].facts.push({ text: 'Mystery', tag: 'opinion' });
    const problems = validateCatalog(bad);
    expect(problems.some((p) => /real-science without a source/.test(p))).toBe(true);
    expect(problems.some((p) => /gated planets need requirementText/.test(p))).toBe(true);
    expect(problems.some((p) => /tag must be fictional-world or real-science/.test(p))).toBe(true);
    const ok = clone();
    ok.planets[0].facts.push({ text: 'Water boils at 100 °C at sea level on Earth.', tag: 'real-science', source: 'Educator-reviewed reference (sample)' });
    expect(validateCatalog(ok)).toEqual([]);
  });

  it('rejects unsafe or malformed values', () => {
    const bad = clone();
    bad.galaxies[1].id = 'Aurora Elliptical!';
    bad.planets[0].colors.base = 'url(javascript:alert(1))';
    bad.planets[1].kind = 'lava-dragon';
    bad.environments[0].locations[0].position = [1, 2];
    const problems = validateCatalog(bad);
    for (const re of [/bad id/, /colors base\/deep\/light\/atmosphere/, /kind must be one of/, /position and view must be/]) expect(problems.some((p) => re.test(p))).toBe(true);
    expect(validateCatalog(null)).toEqual(['catalog: not an object']);
  });

  it('checks workstations: known kinds and valid ids only', () => {
    const loc = (c) => c.environments[0].locations.find((l) => l.id === 'platform');
    expect(loc(catalog).workstations).toEqual([{ kind: 'simulation', id: 'thalassa-station' }]);
    const bad = clone(); loc(bad).workstations = [{ kind: 'teleporter', id: 'x' }];
    expect(validateCatalog(bad).some((p) => /workstation 1 needs kind/.test(p))).toBe(true);
  });

  it('accepts older string facts and normalises them as fictional', () => {
    expect(normalizeFact('A plain line.')).toEqual({ text: 'A plain line.', tag: 'fictional-world' });
  });

  it('loads over HTTP, bypasses the cache when checking for a newer version, and surfaces failures', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => clone() }));
    const cosmos = await loadCosmos('/cosmos/v1/catalog.json', { fetchImpl, fresh: true });
    expect(cosmos.version).toBe('1.2.0');
    expect(fetchImpl).toHaveBeenCalledWith('/cosmos/v1/catalog.json', expect.objectContaining({ cache: 'no-cache' }));
    await expect(loadCosmos('/x', { fetchImpl: async () => ({ ok: false, status: 404 }) })).rejects.toThrow(/404/);
  });
});
