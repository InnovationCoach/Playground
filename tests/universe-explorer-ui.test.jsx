// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// jsdom has no WebGL, so these tests exercise the text-view fallback; the 3D scene is never constructed.
let activeGlDomElement = null;
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ onCreated }) => {
    React.useEffect(() => {
      const el = document.createElement('canvas');
      activeGlDomElement = el;
      onCreated?.({ gl: { domElement: el } });
      return () => {
        if (activeGlDomElement === el) activeGlDomElement = null;
      };
    }, [onCreated]);
    return null;
  },
  useFrame: () => {},
  useThree: () => ({})
}));
vi.mock('@react-three/drei', () => ({ Html: () => null, OrbitControls: () => null }));
const { MyUniverseExplorer, nextPanelOpen } = await import('../src/features/universe/explore/MyUniverseExplorer.jsx');
const { initialNav, reduce } = await import('../src/features/universe/explore/explorerModel.js');
const { buildCosmos } = await import('../src/features/universe/explore/cosmosCatalog.js');
const catalog = (await import('../public/cosmos/v1/catalog.json')).default;
const cosmos = buildCosmos(catalog);
const loadCatalog = vi.fn(async () => cosmos);

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
    expect(text()).toMatch(/This expedition is not open yet\./); // neutral pending-policy wording, not the catalog sample
    expect(text()).not.toMatch(/Sample requirement|Ice and Climate/);
    expect(text()).not.toMatch(/Earn XP|You unlocked/);
    expect(document.body.querySelector('.mx-show3d')).toBeNull(); // no 3D buttons when 3D cannot run
    expect(document.body.querySelector('.mx-panel-toggle')).toBeNull(); // text view has no 3D details panel toggle
    await act(async () => buttonNamed('Leave universe').click());
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows "Access not connected" instead of locks outside previews', async () => {
    await act(async () => root.render(<MyUniverseExplorer preview={false} loadCatalog={loadCatalog} onClose={() => {}} />));
    expect(text()).toMatch(/Access not connected/);
    expect(text()).not.toMatch(/Locked/);
    expect(document.body.querySelector('.mx-banner').textContent).toBe('Fictional worlds for exploring · nothing is saved · no XP, rewards or unlocks');
    expect(text()).not.toMatch(/Preview|Sample requirement/);
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

  it('offers Thalassa workstations in previews and opens the station in Hex-Grid', async () => {
    const onOpenActivity = vi.fn();
    await act(async () => root.render(<MyUniverseExplorer preview loadCatalog={loadCatalog} onOpenActivity={onOpenActivity} onClose={() => {}} />));
    expect(text()).toMatch(/Platform design lab/);
    expect(text()).toMatch(/Is the wind worth it\?/);
    await act(async () => buttonNamed('Open simulation').click());
    expect(onOpenActivity).toHaveBeenCalledWith('hexgrid', { scenario: 'thalassa-station' });
  });

  it('keeps draft workstations hidden outside previews', async () => {
    await act(async () => root.render(<MyUniverseExplorer preview={false} loadCatalog={loadCatalog} onOpenActivity={() => {}} onClose={() => {}} />));
    expect(text()).not.toMatch(/Platform design lab|Is the wind worth it/);
    expect(buttonNamed('Open simulation')).toBeUndefined();
  });

  it('toggles the 3D details panel, stays closed until a new selection or level change, and supports keyboard shortcut D and aria-expanded', async () => {
    // Pure state logic: auto-opens on new selection or level change, stays closed on no-op or while dragging
    const nav0 = initialNav();
    const navSelected = reduce(nav0, { type: 'select', id: 'lyra-spiral', cosmos });
    const navSameSelect = reduce(navSelected, { type: 'select', id: 'lyra-spiral', cosmos });
    const navOtherSelect = reduce(navSelected, { type: 'select', id: 'aurora-elliptical', cosmos });
    const navGalaxy = reduce(navSelected, { type: 'open', id: 'lyra-spiral', cosmos });

    expect(nextPanelOpen(false, nav0, nav0)).toBe(false);
    expect(nextPanelOpen(false, nav0, navSelected)).toBe(true);
    expect(nextPanelOpen(false, nav0, navSelected, { dragging: true })).toBe(false);
    expect(nextPanelOpen(false, navSelected, navSameSelect)).toBe(false);
    expect(nextPanelOpen(false, navSelected, navOtherSelect)).toBe(true);
    expect(nextPanelOpen(false, navSelected, navGalaxy)).toBe(true);

    // Component UI: stub WebGL2 so the 3D shell and collapsible panel mount
    const spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((kind) => (kind === 'webgl2' ? {} : null));
    try {
      await act(async () => root.render(<MyUniverseExplorer preview loadCatalog={loadCatalog} onClose={() => {}} />));
      const region = document.body.querySelector('.mx-root');
      const panel = document.getElementById('mx-panel');
      const toggle = document.body.querySelector('.mx-panel-toggle');

      // Auto-open on first entry
      expect(toggle).not.toBeNull();
      expect(toggle.getAttribute('aria-controls')).toBe('mx-panel');
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      expect(toggle.textContent.trim()).toBe('Hide details');
      expect(panel.hidden).toBe(false);

      // Learner hides the panel with the button; focus moves to the toggle button
      await act(async () => toggle.click());
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      expect(toggle.textContent.trim()).toBe('Show details');
      expect(panel.hidden).toBe(true);
      expect(document.activeElement).toBe(toggle);

      // Camera rotation/zoom keys do not reopen the panel
      for (const key of ['ArrowRight', 'ArrowUp', '+', 'r']) {
        await act(async () => region.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })));
      }
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      expect(panel.hidden).toBe(true);

      // Selecting a destination automatically reopens the panel
      await act(async () => buttonNamed('Lyra Spiral').click());
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      expect(panel.hidden).toBe(false);

      // Keyboard shortcut D hides the panel and moves focus to the toggle button
      document.getElementById('mx-panel-title').focus();
      await act(async () => region.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', bubbles: true })));
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      expect(panel.hidden).toBe(true);
      expect(document.activeElement).toBe(toggle);

      // Moving to a new level reopens the panel automatically
      await act(async () => buttonNamed('Explore Lyra Spiral').click());
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      expect(panel.hidden).toBe(false);
      expect(document.getElementById('mx-panel-title').textContent).toBe('Lyra Spiral');

      // Keyboard shortcut D toggles closed and open again
      await act(async () => region.dispatchEvent(new KeyboardEvent('keydown', { key: 'D', bubbles: true })));
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      await act(async () => region.dispatchEvent(new KeyboardEvent('keydown', { key: 'D', bubbles: true })));
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
    } finally {
      spy.mockRestore();
    }
  });

  it('recovers from WebGL context loss gracefully without losing place, and offers Try 3D again', async () => {
    const spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((kind) => (kind === 'webgl2' ? {} : null));
    try {
      await act(async () => root.render(<MyUniverseExplorer preview loadCatalog={loadCatalog} onClose={() => {}} />));
      expect(activeGlDomElement).not.toBeNull();
      expect(document.body.querySelector('.mx-retry-3d')).toBeNull();

      // Trigger webglcontextlost on the active canvas
      await act(async () => {
        const event = new Event('webglcontextlost', { bubbles: true, cancelable: true });
        activeGlDomElement.dispatchEvent(event);
      });

      // Explorer transitions to text view with honest notice and retry action
      expect(text()).toMatch(/The 3D view stopped on this device, so here is the text view\. Your place is kept\./);
      const retryBtn = document.body.querySelector('.mx-retry-3d');
      expect(retryBtn).not.toBeNull();
      expect(retryBtn.textContent).toContain('Try 3D again');

      // Test keyboard shortcut 'L' when context is lost triggers retry
      const region = document.body.querySelector('.mx-root');
      await act(async () => region.dispatchEvent(new KeyboardEvent('keydown', { key: 'L', bubbles: true })));

      // Restores 3D view once timer finishes
      await act(async () => {
        await new Promise((r) => setTimeout(r, 200));
      });

      // Back in 3D view
      expect(document.body.querySelector('.mx-retry-3d')).toBeNull();
      expect(document.getElementById('mx-panel')).not.toBeNull();

      // Context lost again
      await act(async () => {
        const event = new Event('webglcontextlost', { bubbles: true, cancelable: true });
        activeGlDomElement.dispatchEvent(event);
      });
      expect(text()).toMatch(/The 3D view stopped on this device/);

      // WebGL2 now unavailable during retry
      spy.mockImplementation(() => null);
      const retryBtn2 = document.body.querySelector('.mx-retry-3d');
      await act(async () => {
        retryBtn2.click();
      });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 200));
      });

      // Honest failure notice
      expect(text()).toMatch(/3D graphics could not be restored on this device\. You can continue using the text view\./);

      // WebGL context restored event on retained canvas
      spy.mockImplementation((kind) => (kind === 'webgl2' ? {} : null));
      await act(async () => {
        const restoredEvent = new Event('webglcontextrestored', { bubbles: true });
        activeGlDomElement.dispatchEvent(restoredEvent);
      });
      expect(document.body.querySelector('.mx-retry-3d')).toBeNull();
    } finally {
      spy.mockRestore();
    }
  });
});
