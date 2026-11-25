// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

vi.mock('../src/firebase.js', () => ({
  db: {},
  doc: vi.fn(() => ({})),
  getDoc: vi.fn(async () => ({ exists: () => false })),
  setDoc: vi.fn(async () => {})
}));

const { UrbanHeatDesigner } = await import('../src/features/activities/urbanHeat/UrbanHeatDesigner.jsx');

let host; let root;
const buttons = () => [...host.querySelectorAll('button')];
const byText = (t) => buttons().find((b) => b.textContent.includes(t));
const click = async (el) => act(async () => { el.click(); });
const press = async (el) => act(async () => {
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
});

beforeEach(async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  window.scrollTo = () => {};
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<UrbanHeatDesigner uid="learner-1" />));
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});

it('walks from choosing a district to designing, with no numbers before the prediction', async () => {
  expect(host.textContent).toContain('Which part of Townsville');
  expect(byText('Step 3').disabled).toBe(true);

  await click(byText('Redesign City Heart'));
  expect(host.textContent).toContain('Predict before you measure');
  // No heat numbers on the map until predictions are locked.
  expect(host.querySelectorAll('.uh-tile-num')).toHaveLength(0);

  const lock = byText('Lock in my predictions');
  expect(lock.disabled).toBe(true);

  const tiles = [...host.querySelectorAll('.uh-tile')];
  for (const i of [8, 9, 10]) await press(tiles[i]);
  await click(host.querySelector('input[name="uh-best"]'));
  await click([...host.querySelectorAll('input[name="uh-when"]')][1]);
  expect(byText('Lock in my predictions').disabled).toBe(false);

  await click(byText('Lock in my predictions'));
  expect(host.textContent).toContain('Fair test');
  expect(host.textContent).toContain('You found');

  await click(byText('Start designing'));
  expect(host.textContent).toContain('Redesign City Heart');
  expect(host.textContent).toContain('People housed');

  // Paint a tree-lined street over the asphalt: money is spent, the street cools.
  const before = host.querySelector('.uh-kpis b').textContent;
  const designTiles = [...host.querySelectorAll('.uh-tile')];
  for (let i = 8; i < 16; i += 1) await press(designTiles[i]);
  const after = host.querySelector('.uh-kpis b').textContent;
  expect(parseFloat(after)).toBeLessThan(parseFloat(before));
  expect(host.textContent).toContain('$720k');

  // Undo is one step per tap.
  await click(byText('Undo'));
  expect(host.textContent).toContain('$630k');
});

it('needs two saved plans before comparing, then a chosen plan before the pitch', async () => {
  await click(byText('Redesign Coral Coast School'));
  // Jump through the prediction quickly.
  const tiles = [...host.querySelectorAll('.uh-tile')];
  for (const i of [0, 1, 2]) await press(tiles[i]);
  await click(host.querySelector('input[name="uh-best"]'));
  await click(host.querySelector('input[name="uh-when"]'));
  await click(byText('Lock in my predictions'));
  await click(byText('Start designing'));

  const compare = byText('Compare my plans');
  expect(compare.disabled).toBe(true);
  await click(byText('Save plan'));
  await press(host.querySelectorAll('.uh-tile')[10]);
  await click(byText('Save plan'));
  expect(byText('Compare my plans').disabled).toBe(false);

  await click(byText('Compare my plans'));
  expect(host.textContent).toContain('Compare your plans');
  expect(byText('Pitch the chosen plan').disabled).toBe(true);
  await click(byText('Choose this plan'));
  await click(byText('Pitch the chosen plan'));
  expect(host.textContent).toContain('Pitch “Plan A”');
  await click(byText('＋ Focus area'));
  expect(host.querySelector('#uh-pitch-evidence').value).toContain('Focus area');
});
