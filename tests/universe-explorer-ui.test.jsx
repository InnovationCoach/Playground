// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// jsdom has no WebGL, so these tests exercise the text-view fallback; the 3D scene is never constructed.
vi.mock('@react-three/fiber', () => ({ Canvas: () => null, useFrame: () => {}, useThree: () => ({}) }));
vi.mock('@react-three/drei', () => ({ Html: () => null, OrbitControls: () => null }));
const { MyUniverseExplorer } = await import('../src/features/universe/explore/MyUniverseExplorer.jsx');
const { buildCosmos } = await import('../src/features/universe/explore/cosmosCatalog.js');
const catalog = (await import('../public/cosmos/v1/catalog.json')).default;
const loadCatalog = vi.fn(async () => buildCosmos(catalog));

let host, root;
const text = () => document.body.textContent;
const buttonNamed = (name) => [...document.body.querySelectorAll('button')].find((b) => b.textContent.trim() === name);
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); delete globalThis.IS_REACT_ACT_ENVIRONMENT; });

describe('My Universe explorer without WebGL', () => {
  it('opens a complete text view with every destination, honest statuses and a labelled preview', async () => {
    const onClose = vi.fn();
    await act(async () => root.render(<MyUniverseExplorer preview loadCatalog={loadCatalog} onClose={onClose} />));
    expect(text()).toMatch(/3D isn’t available on this device/);
    expect(text()).toMatch(/Sample universe · fictional worlds · nothing is saved · no XP, rewards or unlocks/);
    expect(text()).toMatch(/Fictional world/);
    for (const name of ['Lyra Spiral', 'Aurora Elliptical', 'Lyra Prime', 'Thalassa', 'Ignis', 'Boreas', 'Thalassa Research Station', 'Research platform', 'Vent overlook']) expect(text()).toContain(name);
    expect(text()).toMatch(/Locked · Preview/);
    expect(text()).toMatch(/Sample requirement/);
    expect(text()).not.toMatch(/Earn XP|You unlocked/);
    expect(document.body.querySelector('.mx-show3d')).toBeNull(); // no 3D buttons when 3D cannot run
    await act(async () => buttonNamed('Leave universe').click());
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows "Access not connected" instead of locks outside previews', async () => {
    await act(async () => root.render(<MyUniverseExplorer preview={false} loadCatalog={loadCatalog} onClose={() => {}} />));
    expect(text()).toMatch(/Access not connected/);
    expect(text()).not.toMatch(/Locked/);
    expect(document.body.querySelector('.mx-banner')).toBeNull();
  });

  it('keeps key presses away from the dashboard deck underneath', async () => {
    const deckKey = vi.fn();
    await act(async () => root.render(<div onKeyDown={deckKey}><MyUniverseExplorer loadCatalog={loadCatalog} onClose={() => {}} /></div>));
    const region = document.body.querySelector('.mx-root');
    await act(async () => region.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })));
    expect(deckKey).not.toHaveBeenCalled();
  });

  it('shows a clear error with Retry when the catalog cannot load, and recovers', async () => {
    const bad = { ...catalog, planets: catalog.planets.map((p, i) => (i === 0 ? { ...p, kind: 'nope' } : p)) };
    const flaky = vi.fn().mockImplementationOnce(async () => buildCosmos(bad)).mockImplementation(async () => buildCosmos(catalog));
    await act(async () => root.render(<MyUniverseExplorer preview loadCatalog={flaky} onClose={() => {}} />));
    expect(text()).toMatch(/universe map didn’t load/);
    expect(text()).toMatch(/kind must be one of/); // preview shows why
    expect(text()).not.toMatch(/Lyra Spiral/);
    await act(async () => buttonNamed('Try again').click());
    expect(text()).toContain('Lyra Spiral');
  });

  it('opens the draft mission from the text view, works a step and closes without saving anything', async () => {
    await act(async () => root.render(<MyUniverseExplorer preview loadCatalog={loadCatalog} onClose={() => {}} />));
    const before = JSON.stringify(localStorage);
    await act(async () => buttonNamed('Open mission').click());
    expect(text()).toMatch(/Draft mission · awaiting educator review/);
    const guided = [...document.querySelectorAll('.mx-route')].find((b) => b.textContent.startsWith('Guided route'));
    await act(async () => guided.click());
    await act(async () => buttonNamed('Next step').click());
    const input = document.querySelector('.mx-answer input');
    await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, '3,600,000'); input.dispatchEvent(new Event('input', { bubbles: true })); });
    await act(async () => input.form.requestSubmit());
    expect(text()).toMatch(/That matches/);
    await act(async () => document.querySelector('.mx-mission').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(document.querySelector('.mx-mission')).toBeNull();
    expect(JSON.stringify(localStorage)).toBe(before);
  });

  it('hides draft missions outside previews', async () => {
    await act(async () => root.render(<MyUniverseExplorer preview={false} loadCatalog={loadCatalog} onClose={() => {}} />));
    expect(buttonNamed('Open mission')).toBeUndefined();
    expect(text()).toMatch(/No reviewed missions yet/);
  });
});
