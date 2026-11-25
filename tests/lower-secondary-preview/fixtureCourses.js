import { scenarioId } from './scenarios.js';

export const ROBO_BUDDY = {
  program: {
    id: 'robo-buddy-companion-2026',
    title: 'Robo-Buddy Companion: Build, Code & Care for a 3D-Printed Walking Desk Pet',
    phases: [
      { id: 'explore', title: 'Explore & Reverse-Engineer', sessions: [{ sessionNumber: 1 }, { sessionNumber: 2 }] },
      { id: 'define', title: 'Define & Tamagotchi Logic', sessions: [{ sessionNumber: 3 }, { sessionNumber: 4 }] },
      { id: 'prototype', title: 'Prototype & Servo Walk', sessions: [{ sessionNumber: 5 }, { sessionNumber: 6 }] }
    ]
  },
  summary: {
    pct: 33,
    done: 2,
    total: 6,
    next: {
      title: 'Calibrate micro:bit servo angles (0° to 180°) for stable bipedal gait',
      sessionNumber: 3,
      phaseId: 'define',
      activities: ['Center all 4 SG90 servos at 90° using MakeCode blocks', 'Verify leg symmetry before attaching foot plates'],
      evidenceToCollect: { prompt: 'A photo of your Robo-Buddy standing and zero-calibrated' }
    },
    byPhase: {
      explore: { done: 2, total: 2, complete: true },
      define: { done: 0, total: 2, complete: false },
      prototype: { done: 0, total: 2, complete: false }
    }
  }
};

export const STREETPAWS = {
  program: {
    id: 'streetpaws-animal-rescue-2026',
    title: 'StreetPaws — The Community Animal Rescue App',
    phases: [
      { id: 'explore', title: 'Explore & Hazard Map', sessions: [{ sessionNumber: 1 }, { sessionNumber: 2 }] },
      { id: 'empathise', title: 'Empathise & Interviews', sessions: [{ sessionNumber: 3 }, { sessionNumber: 4 }] },
      { id: 'prototype', title: 'Prototype & Feeding Station', sessions: [{ sessionNumber: 5 }, { sessionNumber: 6 }] }
    ]
  },
  summary: {
    pct: 17,
    done: 1,
    total: 6,
    next: {
      title: 'Sketch 4 paper phone wireframes for the Volunteer Feeding Map',
      sessionNumber: 2,
      phaseId: 'explore',
      activities: ['Draw Red-to-Green pin status screen', 'Label volunteer feeding confirmation flow'],
      evidenceToCollect: { prompt: 'Photos of your paper phone wireframes with labelled buttons' }
    },
    byPhase: {
      explore: { done: 1, total: 2, complete: false },
      empathise: { done: 0, total: 2, complete: false },
      prototype: { done: 0, total: 2, complete: false }
    }
  }
};

export const ECOCOOL = {
  program: {
    id: 'ecocool-smart-garden-2026',
    title: 'EcoCool: Smart Urban Heat & Community Garden Monitor',
    phases: [
      { id: 'explore', title: 'Explore & Microclimates', sessions: [{ sessionNumber: 1 }, { sessionNumber: 2 }] },
      { id: 'define', title: 'Define & Sensor Thresholds', sessions: [{ sessionNumber: 3 }, { sessionNumber: 4 }] },
      { id: 'test', title: 'Test & Water Conservation', sessions: [{ sessionNumber: 5 }, { sessionNumber: 6 }] }
    ]
  },
  summary: {
    pct: 67,
    done: 4,
    total: 6,
    next: {
      title: 'Benchmark analog moisture readings across damp and dry test beds',
      sessionNumber: 5,
      phaseId: 'test',
      activities: ['Log voltage outputs for sandy vs clay soil', 'Set auto-alert threshold to prevent root rot'],
      evidenceToCollect: { prompt: 'A calibrated sensor threshold log' }
    },
    byPhase: {
      explore: { done: 2, total: 2, complete: true },
      define: { done: 2, total: 2, complete: true },
      test: { done: 0, total: 2, complete: false }
    }
  }
};

const recheck = { ...STREETPAWS, summary: null, needsRecheck: true };
const unavailable = { ...ECOCOOL, summary: null, progressUnavailable: true };

export const LOWER_SECONDARY_PBL_PROGRAMS = [ROBO_BUDDY, STREETPAWS, ECOCOOL];

export async function loadDashboardCourses() {
  (window.__fixtureCalls ||= []).push('courses');
  const params = new URLSearchParams(location.search);
  const mode = params.get('state');
  if (mode === 'loading') await new Promise(() => {});
  if (mode === 'error') throw new Error('Synthetic course failure');
  if (mode === 'empty' || scenarioId() === 'age12new') return { courses: [], warnings: [] };
  if (mode === 'mixed') return { warnings: [], courses: [ROBO_BUDDY, recheck, unavailable] };
  if (mode === 'single') return { warnings: [], courses: [ROBO_BUDDY] };
  return { warnings: [], courses: LOWER_SECONDARY_PBL_PROGRAMS };
}
