// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// jsdom has no WebGL, so these tests exercise the text-view fallback; the 3D scene is never constructed.
vi.mock('@react-three/fiber', () => ({ Canvas: () => null, useFrame: () => {}, useThree: () => ({}) }));
vi.mock('@react-three/drei', () => ({ Html: () => null, OrbitControls: () => null }));
const { MyUniverseExplorer } = await import('../src/features/universe/explore/MyUniverseExplorer.jsx');

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
    await act(async () => root.render(<MyUniverseExplorer preview onClose={onClose} />));
    expect(text()).toMatch(/3D isn’t available on this device/);
    expect(text()).toMatch(/Sample universe · fictional fixture data · nothing is saved · no XP, rewards or unlocks/);
    for (const name of ['Lyra Spiral', 'Aurora Elliptical', 'Lyra Prime', 'Thalassa', 'Ignis', 'Boreas', 'Thalassa Research Station', 'Research platform', 'Vent overlook']) expect(text()).toContain(name);
    expect(text()).toMatch(/Locked · Preview/);
    expect(text()).toMatch(/Sample requirement/);
    expect(text()).not.toMatch(/Earn XP|You unlocked/);
    expect(document.body.querySelector('.mx-show3d')).toBeNull(); // no 3D buttons when 3D cannot run
    await act(async () => buttonNamed('Leave universe').click());
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows "Access not connected" instead of locks outside previews', async () => {
    await act(async () => root.render(<MyUniverseExplorer preview={false} onClose={() => {}} />));
    expect(text()).toMatch(/Access not connected/);
    expect(text()).not.toMatch(/Locked/);
    expect(document.body.querySelector('.mx-banner')).toBeNull();
  });

  it('keeps key presses away from the dashboard deck underneath', async () => {
    const deckKey = vi.fn();
    await act(async () => root.render(<div onKeyDown={deckKey}><MyUniverseExplorer onClose={() => {}} /></div>));
    const region = document.body.querySelector('.mx-root');
    await act(async () => region.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })));
    expect(deckKey).not.toHaveBeenCalled();
  });
});
