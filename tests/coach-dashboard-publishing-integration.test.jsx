// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';

vi.mock('../src/firebase.js', () => ({
  usingEmulators: false,
  auth: { currentUser: { uid: 'coach-donovan', email: 'coach@welearn.org', getIdTokenResult: vi.fn() } },
  db: {},
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  doc: (_db, ...parts) => parts.join('/'),
  collection: (_db, ...parts) => parts.join('/'),
  query: (ref, filter) => ({ ref, filter }),
  where: (field, op, value) => ({ field, op, value }),
  serverTimestamp: () => Date.now(),
  getDevStoredUser: () => null
}));

import { auth, getDoc, getDocs } from '../src/firebase.js';
import { ProgramLibrary } from '../src/features/pbl/programs/ProgramLibrary.jsx';
import { ClassProgramsPanel } from '../src/features/coach/ClassProgramsPanel.jsx';
import { saveCustomProgram, getCustomPrograms } from '../src/features/coach/programs/customProgramsStore.js';
import { LocaleProvider } from '../src/app/i18n/LocaleProvider.jsx';

let host, root;
const snapshot = (values) => ({
  forEach: (cb) => values.forEach(([id, value]) => cb({ id, data: () => value })),
  docs: values.map(([id, value]) => ({ id, data: () => value }))
});

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  auth.currentUser.getIdTokenResult.mockResolvedValue({ claims: { role: 'teacher', classIds: ['class-1'] } });
  getDoc.mockResolvedValue({ exists: () => true, data: () => ({ name: 'Class 9A', programId: 'robo-buddy-companion-2026' }) });
  getDocs.mockResolvedValue(snapshot([]));
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  localStorage.clear();
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});

const render = (node) => act(async () => root.render(<LocaleProvider>{node}</LocaleProvider>));

describe('Coach Dashboard PBL Program Publishing & Visibility', () => {
  it('displays coach-authored custom programs in ProgramLibrary', async () => {
    saveCustomProgram({
      id: 'custom-solar-rover-2026',
      title: 'Solar Desert Rover Challenge',
      theme: 'Sustainable Engineering',
      drivingQuestion: 'How can autonomous rovers harvest solar power in desert terrains?',
      durationWeeks: 12,
      sessions: [
        { sessionNumber: 1, title: 'Solar Insolation Calculations' },
        { sessionNumber: 2, title: 'Chassis Milling' }
      ],
      issues: [],
      identity: { icon: 'Zap', tone: 'amber', short: 'Solar Rover' }
    });

    await render(<ProgramLibrary uid="coach-donovan" isCoach={true} classIds={['class-1']} />);

    expect(host.textContent).toContain('Solar Desert Rover Challenge');
    expect(host.textContent).toContain('Sustainable Engineering');
    expect(host.textContent).toContain('How can autonomous rovers harvest solar power');
  });

  it('updates ProgramLibrary dynamically when a program is published or updated', async () => {
    await render(<ProgramLibrary uid="coach-donovan" isCoach={true} classIds={['class-1']} />);
    expect(host.textContent).not.toContain('Aero-Hydroponics Tower');

    await act(async () => {
      saveCustomProgram({
        id: 'custom-aero-hydro-2026',
        title: 'Aero-Hydroponics Tower',
        theme: 'Urban Agriculture',
        drivingQuestion: 'Can vertical aeroponic towers reduce water consumption by 90%?',
        durationWeeks: 10,
        sessions: [{ sessionNumber: 1, title: 'Nutrient Mist Delivery' }],
        issues: [],
        identity: { icon: 'Sprout', tone: 'green', short: 'Hydroponics' }
      });
    });

    expect(host.textContent).toContain('Aero-Hydroponics Tower');
    expect(host.textContent).toContain('Urban Agriculture');
  });

  it('includes custom programs in the ClassProgramsPanel program dropdown', async () => {
    saveCustomProgram({
      id: 'custom-coral-restoration-2026',
      title: 'Coral Reef Micro-Fragmentation',
      theme: 'Marine Conservation',
      drivingQuestion: 'How can ceramic substrates accelerate coral colony growth?'
    });

    await render(<ClassProgramsPanel coachUser={{ uid: 'coach-donovan', classIds: ['class-1'] }} />);

    expect(host.textContent).toContain('Coral Reef Micro-Fragmentation');
  });

  it('restores draft unit from localStorage in Coach Studio', () => {
    const draft = {
      id: 'draft-marine-biomimicry',
      unitTitle: 'Marine Biomimicry Propulsor',
      realProblem: 'Cavitation erosion on ship propellers destroys aquatic habitats.',
      drivingQuestion: 'How can whale tubercle designs enhance propeller efficiency?',
      finalProduct: 'A 3D-printed CFD-validated whale-tubercle blade prototype.'
    };
    localStorage.setItem('hearisland.coachStudio.draftUnit.v1', JSON.stringify(draft));

    const stored = JSON.parse(localStorage.getItem('hearisland.coachStudio.draftUnit.v1'));
    expect(stored.unitTitle).toBe('Marine Biomimicry Propulsor');
    expect(stored.drivingQuestion).toContain('whale tubercle');
  });
});
