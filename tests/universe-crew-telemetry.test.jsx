// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The panel's default AI call goes through geminiApi; the mock decides per test whether "Gemini" answers.
const tutor = vi.hoisted(() => ({ impl: async () => { throw new Error('offline'); } }));
vi.mock('../src/services/geminiApi.js', () => ({
  geminiApi: { generateContextualResponse: (...args) => tutor.impl(...args) }
}));

import { buildCosmos } from '../src/features/universe/explore/cosmosCatalog.js';
import catalogV2 from '../public/cosmos/v2/catalog.json';
import {
  CREW_PERSONAS, fetchCrewAdvisorReply, personaForText, stripSpeaker, toCrewLine
} from '../src/features/universe/playground/crewAdvisor.js';
import {
  buildFeature, completeGoal, getPlanetRecord, initialPlaygroundState, runWeeklyUniverseEvent
} from '../src/features/universe/playground/playgroundModel.js';
import { flightChecks, simulateSpaceshipDesign } from '../src/features/universe/lab/spaceshipSim.js';
import { SpaceshipBuilderModal, buildMeters } from '../src/features/universe/lab/SpaceshipBuilderModal.jsx';
import { PlaygroundPanel } from '../src/features/universe/playground/PlaygroundPanel.jsx';
import { ExplorerTextView, SurfaceTextView } from '../src/features/universe/explore/ExplorerTextView.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const cosmos = buildCosmos(catalogV2);
const thalassa = cosmos.planetById('thalassa');
const lyra = cosmos.systemById('lyra-prime');

let host; let root;
beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  tutor.impl = async () => { throw new Error('offline'); };
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});
const render = (el) => act(() => root.render(el));
const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });
const byText = (sel, text) => [...host.querySelectorAll(sel)].find((el) => el.textContent.includes(text));

describe('AI crew personas', () => {
  it('identifies the speaker and strips the name prefix', () => {
    expect(CREW_PERSONAS.map((p) => p.id)).toEqual(['aria-7', 'lyra-vance', 'kai-sato', 'soren-hale']);
    expect(new Set(CREW_PERSONAS.map((p) => p.color)).size).toBe(4);
    expect(personaForText('Chief Kai Sato: "Vent the dome."').id).toBe('kai-sato');
    expect(personaForText('Alert from Lt. Soren Hale: storm!').id).toBe('soren-hale');
    expect(personaForText('No names at all').id).toBe('aria-7');
    expect(stripSpeaker('Aria-7 (AI Ecologist): "Plant algae first."')).toBe('Plant algae first.');
    expect(toCrewLine('Dr. Lyra Vance: Start with producers.')).toEqual({ speakerId: 'lyra-vance', text: 'Start with producers.' });
  });

  it('uses the live Gemini reply when the tutor answers with a string', async () => {
    const api = { generateContextualResponse: vi.fn(async () => 'Chief Kai Sato: Add fire suppression before raising O₂.') };
    const res = await fetchCrewAdvisorReply({ planet: thalassa, system: lyra, record: getPlanetRecord(initialPlaygroundState(), 'thalassa'), question: 'oxygen?', api });
    expect(api.generateContextualResponse).toHaveBeenCalledOnce();
    expect(res).toEqual({ reply: 'Chief Kai Sato: Add fire suppression before raising O₂.', source: 'gemini', speakerId: 'kai-sato' });
  });

  it('falls back to the offline guide when Gemini fails or answers empty', async () => {
    const record = getPlanetRecord(initialPlaygroundState(), 'thalassa');
    const failing = { generateContextualResponse: async () => { throw new Error('401'); } };
    const empty = { generateContextualResponse: async () => '   ' };
    for (const api of [failing, empty]) {
      const res = await fetchCrewAdvisorReply({ planet: thalassa, system: lyra, record, question: 'How do we grow life?', api });
      expect(res.source).toBe('local');
      expect(res.speakerId).toBe('lyra-vance');
      expect(res.reply).toContain('trophic food-web');
    }
  });
});

describe('Spaceship flight checks and meters', () => {
  const good = { passengers: 2, parts: { hull: 'lightweight-alloy', propulsion: 'chemical-booster', power: 'rtg-core', shield: 'thermal-shield' } };
  const bad = { passengers: 8, parts: { hull: 'titanium-hull', propulsion: 'ion-thruster', power: 'solar-array', shield: 'thermal-shield' } };

  it('certifies only when every check passes, matching the simulator', () => {
    const okSim = simulateSpaceshipDesign(good);
    const okChecks = flightChecks(okSim);
    expect(okChecks.certified).toBe(okSim.passed);
    expect(okChecks.checks.map((c) => c.id)).toEqual(['twr', 'power', 'capacity', 'shield']);

    const badSim = simulateSpaceshipDesign(bad);
    const badChecks = flightChecks(badSim);
    expect(badSim.passed).toBe(false);
    expect(badChecks.certified).toBe(false);
    expect(badChecks.checks.find((c) => c.id === 'twr').ok).toBe(false);
    expect(badChecks.checks.find((c) => c.id === 'power').ok).toBe(false);
    expect(badChecks.checks.find((c) => c.id === 'capacity').ok).toBe(false);
    expect(flightChecks(null)).toEqual({ checks: [], passedCount: 0, certified: false });
  });

  it('places each meter fill on the passing side of its marker exactly when the check passes', () => {
    for (const design of [good, bad]) {
      const sim = simulateSpaceshipDesign(design);
      for (const m of buildMeters(sim)) {
        expect(m.fill).toBeGreaterThanOrEqual(0);
        expect(m.fill).toBeLessThanOrEqual(100);
        if (m.id === 'twr' || m.id === 'shield') expect(m.ok).toBe(m.fill >= m.mark);
      }
    }
  });

  it('shows live meters and a Flight-Certified badge in the builder', () => {
    render(<SpaceshipBuilderModal planetName="Thalassa" onClose={() => {}} />);
    expect(host.querySelectorAll('[role="meter"]').length).toBe(4);
    expect(host.querySelectorAll('.upg-checklist li').length).toBe(4);
    const tag = host.querySelector('[aria-label="Live physics telemetry"] h3 .upg-tag');
    const certified = flightChecks(simulateSpaceshipDesign(good)).certified;
    expect(tag.textContent).toBe(certified ? 'Flight-Certified design' : expect.stringMatching(/checks pass/));
  });
});

describe('Playground crew tab and hazard banner', () => {
  const withHazard = () => {
    let s = initialPlaygroundState('thalassa');
    for (let seed = 1; seed < 200 && !getPlanetRecord(s, 'thalassa').activeHazard; seed += 1) {
      s = runWeeklyUniverseEvent(initialPlaygroundState('thalassa'), cosmos.planets.map((p) => p.id), { seed });
    }
    return s;
  };

  it('collapses the hazard banner outside AI Crew and expands it there', () => {
    const state = withHazard();
    expect(getPlanetRecord(state, 'thalassa').activeHazard).toBeTruthy();
    render(<PlaygroundPanel cosmos={cosmos} state={state} onChange={() => {}} onClose={() => {}} />);
    const toggle = host.querySelector('.upg-alert-toggle');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(host.querySelector('input[name="upg-dilemma"]')).toBeNull();
    act(() => toggle.click());
    expect(host.querySelector('input[name="upg-dilemma"]')).not.toBeNull();
    act(() => byText('[role="tab"]', 'AI Crew').click());
    expect(host.querySelector('.upg-alert-toggle').getAttribute('aria-expanded')).toBe('true');
  });

  it('shows avatars, vitals and a quick-ask answered by the offline guide', async () => {
    render(<PlaygroundPanel cosmos={cosmos} state={initialPlaygroundState('thalassa')} onChange={() => {}} onClose={() => {}} />);
    act(() => byText('[role="tab"]', 'AI Crew').click());
    expect(host.querySelectorAll('.upg-crew-strip li').length).toBe(4);
    expect(host.querySelectorAll('.upg-crew-card [role="meter"]').length).toBe(8);
    expect(host.querySelectorAll('.upg-thread .upg-bubble').length).toBeGreaterThan(0);
    act(() => byText('.upg-quick-asks button', 'Grow life safely').click());
    await flush();
    const reply = host.querySelector('[aria-label="Crew replies"] .upg-bubble');
    expect(reply.textContent).toContain('Dr. Lyra Vance');
    expect(reply.textContent).toContain('Offline guide');
    expect(host.querySelector('.upg-you-said').textContent).toContain('How do we grow life');
  });

  it('labels a live Gemini answer with the right persona', async () => {
    tutor.impl = async () => 'Lt. Soren Hale: Raise shielding before the next storm.';
    render(<PlaygroundPanel cosmos={cosmos} state={initialPlaygroundState('thalassa')} onChange={() => {}} onClose={() => {}} />);
    act(() => byText('[role="tab"]', 'AI Crew').click());
    act(() => byText('.upg-quick-asks button', 'What next?').click());
    await flush();
    const reply = host.querySelector('[aria-label="Crew replies"] .upg-bubble');
    expect(reply.textContent).toContain('Lt. Soren Hale');
    expect(reply.textContent).toContain('Raise shielding before the next storm.');
    expect(reply.textContent).toContain('Live AI');
  });
});

describe('Text View parity badges', () => {
  it('shows hazard and built-feature badges that match the 3D rings', () => {
    let state = completeGoal(initialPlaygroundState('thalassa'), 'goal-hazard-drill');
    state = buildFeature(state, 'thalassa', 'geodesic-biodome', {}).state;
    state = withHazardOn(state, 'kepler-ember');
    const opts = { preview: true };
    render(<ExplorerTextView cosmos={cosmos} opts={opts} canUse3d={false} playgroundPlanets={state.planets} />);
    const built = byText('.mx-pg-badge.is-built', '1 feature built');
    expect(built.closest('details').querySelector('summary strong').textContent).toBe('Thalassa');
    const hazard = host.querySelector('.mx-pg-badge.is-hazard');
    expect(hazard.textContent).toContain('Hazard:');

    render(<ExplorerTextView cosmos={cosmos} opts={opts} canUse3d={false} playgroundPlanets={null} />);
    expect(host.querySelector('.mx-pg-badge')).toBeNull();
  });

  it('lists built feature names on the surface text view', () => {
    let state = completeGoal(initialPlaygroundState('thalassa'), 'goal-hazard-drill');
    state = buildFeature(state, 'thalassa', 'geodesic-biodome', {}).state;
    const environment = cosmos.environmentById(thalassa.environmentId);
    render(<SurfaceTextView cosmos={cosmos} environment={environment} opts={{ preview: true }} onSelect={() => {}} onBack={() => {}}
      canUse3d={false} playgroundRecord={getPlanetRecord(state, 'thalassa')} />);
    expect(host.querySelector('.mx-pg-badge.is-built').textContent).toBe('Built: Geodesic Biodome');
  });
});

/** Puts a synthetic hazard on one planet so the test does not depend on the weekly RNG. */
function withHazardOn(state, planetId) {
  const id = cosmos.planetById(planetId) ? planetId : cosmos.planets.find((p) => p.id !== 'thalassa').id;
  const rec = getPlanetRecord(state, id);
  return { ...state, planets: { ...state.planets, [id]: { ...rec, activeHazard: { id: 'h1', name: 'Solar Flare', summary: 'Test hazard', damage: 10 } } } };
}

describe('Spaceship blueprints: save, load and persistence', () => {
  const setValue = (el, v) => {
    const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  };

  it('Load Blueprint restores the saved design, marks it loaded and re-announces each time', () => {
    window.HTMLElement.prototype.scrollIntoView = () => {};
    render(<SpaceshipBuilderModal planetName="Thalassa" onClose={() => {}} />);
    const nameInput = () => host.querySelector('input[aria-label="Spaceship name"]');
    const selects = () => host.querySelectorAll('.upg-lab-modal select');
    act(() => { setValue(nameInput(), 'Blueprint A'); setValue(selects()[1], 'plasma-drive'); });
    act(() => byText('.upg-lab-modal button', 'Save Version').click());
    act(() => { setValue(nameInput(), 'Changed B'); setValue(selects()[1], 'ion-thruster'); });
    expect(nameInput().value).toBe('Changed B');

    act(() => host.querySelector('button[aria-label^="Load blueprint Blueprint A"]').click());
    expect(nameInput().value).toBe('Blueprint A');
    expect(selects()[1].value).toBe('plasma-drive');
    const item = host.querySelector('.upg-item.is-loaded');
    expect(item.getAttribute('aria-current')).toBe('true');
    expect(item.textContent).toContain('Loaded in the lab');
    const first = host.querySelector('.upg-toast-bar');
    expect(first.textContent).toContain('Loaded Blueprint A (v1)');

    act(() => host.querySelector('button[aria-label^="Load blueprint Blueprint A"]').click());
    expect(host.querySelector('.upg-toast-bar')).not.toBe(first); // remounted, so screen readers hear it again
  });

  it('keeps local blueprints when the server copy has none', async () => {
    const { mergeRemotePlaygroundState, saveSpaceshipProject } = await import('../src/features/universe/playground/playgroundModel.js');
    let local = initialPlaygroundState('thalassa');
    local = saveSpaceshipProject(local, { id: 'ship-a', version: 1, name: 'A', savedAt: '2026-11-25T01:00:00.000Z' });
    local = saveSpaceshipProject(local, { id: 'ship-b', version: 2, name: 'B', savedAt: '2026-11-25T02:00:00.000Z' });
    const remote = { ...initialPlaygroundState('ignis'), credits: 300 };
    delete remote.savedShips; // the server sanitizer drops this field today
    const merged = mergeRemotePlaygroundState(local, remote);
    expect(merged.credits).toBe(300);
    expect(merged.claimedPlanetId).toBe('ignis');
    expect(merged.savedShips.map((s) => s.id)).toEqual(['ship-b', 'ship-a']);
    const both = mergeRemotePlaygroundState(local, { ...remote, savedShips: [{ id: 'ship-c', name: 'C', savedAt: '2026-11-25T03:00:00.000Z' }, { id: 'ship-a', name: 'A', savedAt: '2026-11-25T01:00:00.000Z' }] });
    expect(both.savedShips.map((s) => s.id)).toEqual(['ship-c', 'ship-b', 'ship-a']);
    expect(mergeRemotePlaygroundState(local, null)).toBe(local);
  });

  it('sends contractVersion with every playground save', async () => {
    const { saveRemotePlaygroundState } = await import('../src/features/universe/playground/playgroundClient.js');
    const { API_CONTRACT_VERSION } = await import('../shared/universe/index.js');
    const calls = [];
    const realFetch = globalThis.fetch;
    globalThis.fetch = async (url, init) => { calls.push({ url, init }); return { ok: true }; };
    try {
      const ok = await saveRemotePlaygroundState({ auth: { currentUser: { getIdToken: async () => 'tok' } }, baseUrl: '', state: { version: 1 } });
      expect(ok).toBe(true);
      const body = JSON.parse(calls[0].init.body);
      expect(body.contractVersion).toBe(API_CONTRACT_VERSION);
      expect(body.state).toEqual({ version: 1 });
      expect(calls[0].init.headers['X-Universe-Contract-Version']).toBe(API_CONTRACT_VERSION);
    } finally {
      globalThis.fetch = realFetch;
    }
  });
});
