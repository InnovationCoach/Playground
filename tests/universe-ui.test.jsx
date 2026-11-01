// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { UniversePrototype } from '../src/features/universe/UniversePrototype.jsx';
let host, root;
const button = text => [...host.querySelectorAll('button')].find(b => b.textContent.trim() === text || b.getAttribute('aria-label') === text);
const click = async text => act(async () => button(text).click());
const render = async (uid = 'test-student') => act(async () => root.render(<UniversePrototype uid={uid} initialCalm />));
const objects = () => host.querySelectorAll('[data-world-object]').length;
async function inputText(input, value) {
  await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); });
  await act(async () => input.dispatchEvent(new FocusEvent('focusout', { bubbles: true })));
}
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); delete globalThis.IS_REACT_ACT_ENVIRONMENT; });

describe('My Universe playable prototype', () => {
  it('places, moves with the keyboard, removes and undoes without changing unrelated objects', async () => {
    await render(); expect(objects()).toBe(6);
    await click('Place Bubble tree'); expect(objects()).toBe(7);
    let selected = host.querySelector('[data-world-object][aria-pressed=true]');
    const before = selected.getAttribute('transform');
    await act(async () => selected.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })));
    expect(selected.getAttribute('transform')).not.toBe(before);
    await click('Remove selected object'); expect(objects()).toBe(6);
    await click('Undo last change'); expect(objects()).toBe(7);
  });
  it('accepts names with spaces and persists the actual scene in an account-scoped browser sandbox', async () => {
    await render(); await inputText(host.querySelector('[aria-label="World name"]'), 'My Moon Garden');
    await click('Creatures'); await inputText(host.querySelector('[aria-label="Creature name"]'), 'Captain Miso');
    await click('Starlight blue'); await click('Save locally');
    const saved = JSON.parse(localStorage.getItem('spark-universe-prototype:v1:test-student'));
    expect(saved.world.name).toBe('My Moon Garden'); expect(saved.world.creature).toMatchObject({ name: 'Captain Miso', palette: 'sky' });
    await act(async () => root.unmount()); root = createRoot(host); await render();
    expect(host.querySelector('[aria-label="World name"]').value).toBe('My Moon Garden');
    expect(host.textContent).toContain('Your browser-saved prototype is ready');
  });
  it('demonstrates a sample unlock while keeping assessment and XP claims absent', async () => {
    await render(); await click('Preview a reward choice');
    expect(host.querySelector('dialog[open]').textContent).toContain('No learning progress was assessed');
    await click('Try Mini moon'); expect(objects()).toBe(7);
    expect(button('Preview a reward choice')).toBeUndefined();
    expect(button('Sample unlock claimed').disabled).toBe(true);
    await click('Save locally');
    const saved = JSON.parse(localStorage.getItem('spark-universe-prototype:v1:test-student'));
    expect(saved.world.sampleReward).toBe('moon'); expect(saved.world).not.toHaveProperty('xp');
  });
  it('offers manual experiment steps in calm mode without removing world content', async () => {
    await render(); await click('Experiment');
    expect(button('Run experiment').disabled).toBe(true);
    const before = objects();
    await act(async () => [...host.querySelectorAll('.up-gravity label')].find(l => l.textContent.includes('Low gravity')).querySelector('input').click());
    await click('One step');
    expect(Number(host.querySelector('[data-creature-height]').dataset.creatureHeight)).toBeGreaterThan(0);
    await click('Reset motion'); expect(host.querySelector('[data-creature-height]').dataset.creatureHeight).toBe('0');
    expect(objects()).toBe(before);
  });
  it('reports storage failures and leaves the world available', async () => {
    await render(); await click('Place Little pond');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Quota exceeded'); });
    await click('Save locally');
    expect(host.querySelector('[role=alert]').textContent).toContain('could not save');
    expect(objects()).toBe(7); expect(host.textContent).toContain('Unsaved changes');
  });
  it('does not show the previous learner’s saved scene when accounts change', async () => {
    await render('one'); await inputText(host.querySelector('[aria-label="World name"]'), 'First learner world'); await click('Save locally');
    await render('two'); expect(host.querySelector('[aria-label="World name"]').value).toBe('My little universe');
    expect(host.textContent).not.toContain('First learner world');
  });
  it('recovers from a malformed browser save without claiming that it was restored', async () => {
    localStorage.setItem('spark-universe-prototype:v1:test-student', '{broken');
    await render(); expect(objects()).toBe(6); expect(host.textContent).toContain('Welcome to your moon garden');
    expect(host.textContent).toContain('Unsaved changes');
  });
});
