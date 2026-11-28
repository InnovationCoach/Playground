import { PUBLISHED_BUNDLE } from './publishedRelease.js';

export const API_CONTRACT_VERSION = '1.0.0';
export const MAX_REQUEST_BYTES = 64 * 1024;
export const CAPABILITIES = Object.freeze({
  contractVersion: API_CONTRACT_VERSION,
  capabilityVersion: '1.0.0',
  sceneKinds: Object.freeze(['ocean-station', 'basalt-fissures']),
  workstationKinds: Object.freeze(['mission', 'simulation']),
  artifactPartKinds: Object.freeze(['text', 'table', 'choice', 'diagram']),
  artifactReferenceEnabled: false
});

// Self-directed AI-evaluated release authorized for live learners and coach report delivery.
export const PUBLISHED_RELEASES = Object.freeze([PUBLISHED_BUNDLE]);
